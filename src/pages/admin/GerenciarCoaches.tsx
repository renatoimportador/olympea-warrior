import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { UserCog, Plus, Edit2, Ban, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export function GerenciarCoaches() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [coaches, setCoaches] = useState<any[]>([])
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    bio: '',
    especialidade: ''
  })

  async function carregarCoaches() {
    const { data, error } = await supabase
      .from('coaches')
      .select(`
        *,
        usuarios (
          id,
          nome,
          email,
          telefone
        )
      `)
      .eq('ativo', true)

    if (error) {
      toast.error('Erro ao carregar coaches')
      return
    }

    setCoaches(data || [])
  }

  useEffect(() => {
    carregarCoaches()
  }, [])

  async function handleSave() {
    if (!form.nome || !form.email) {
      toast.error('Preencha nome e email')
      return
    }

    if (editingId) {
      const coachAtual = coaches.find((c) => c.id === editingId)

      await supabase
        .from('usuarios')
        .update({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone
        })
        .eq('id', coachAtual.usuario_id)

      await supabase
        .from('coaches')
        .update({
          bio: form.bio,
          especialidade: form.especialidade
        })
        .eq('id', editingId)

      toast.success('Coach atualizado!')
    } else {
      const { data: usuario } = await supabase
        .from('usuarios')
        .insert({
          box_id: 'box-1',
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          role: 'coach',
          ativo: true,
          auth_provider: 'email'
        })
        .select()
        .single()

      if (!usuario) {
        toast.error('Erro ao criar usuário')
        return
      }

      await supabase
        .from('coaches')
        .insert({
          usuario_id: usuario.id,
          box_id: usuario.box_id,
          bio: form.bio,
          especialidade: form.especialidade,
          ativo: true
        })

      toast.success('Coach criado!')
    }

    setForm({
      nome: '',
      email: '',
      telefone: '',
      bio: '',
      especialidade: ''
    })

    setEditingId(null)
    setShowForm(false)

    carregarCoaches()
  }

  function handleEdit(c: any) {
    setForm({
      nome: c.usuarios?.nome || '',
      email: c.usuarios?.email || '',
      telefone: c.usuarios?.telefone || '',
      bio: c.bio || '',
      especialidade: c.especialidade || ''
    })

    setEditingId(c.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este coach?')) return

    await supabase
      .from('coaches')
      .update({ ativo: false })
      .eq('id', id)

    toast.success('Coach excluído!')
    carregarCoaches()
  }

  const coachesFiltrados = coaches.filter((c) => {
    const termo = busca.toLowerCase()

    return (
      c.usuarios?.nome?.toLowerCase().includes(termo) ||
      c.bio?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Gerenciar Coaches</h1>

        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" />
          Novo Coach
        </Button>
      </div>

      <Input
        placeholder="Buscar coach..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <Input
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />

          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Input
            placeholder="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />

          <Input
            placeholder="Especialidade"
            value={form.especialidade}
            onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
          />

          <Input
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />

          <Button onClick={handleSave}>
            <Save size={16} className="mr-2" />
            Salvar
          </Button>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coachesFiltrados.map((c) => (
          <GlassCard key={c.id} className="p-5">
            <div className="flex justify-between">
              <div>
                <h3>{c.usuarios?.nome}</h3>
                <p>{c.usuarios?.email}</p>
                <Badge>{c.especialidade}</Badge>
                <p>{c.bio}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleEdit(c)}>
                  <Edit2 size={14} />
                </button>

                <button onClick={() => handleDelete(c.id)}>
                  <Ban size={14} />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
