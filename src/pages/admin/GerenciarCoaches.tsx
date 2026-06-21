import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { UserCog, Plus, Edit2, Ban, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
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
    especialidade: '',
  })

  useEffect(() => {
    carregarCoaches()
  }, [])

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

    if (!error && data) {
      setCoaches(data)
    }
  }

  function resetForm() {
    setForm({
      nome: '',
      email: '',
      telefone: '',
      bio: '',
      especialidade: '',
    })
    setEditingId(null)
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
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
          telefone: form.telefone,
        })
        .eq('id', coachAtual.usuario_id)

      await supabase
        .from('coaches')
        .update({
          bio: form.bio,
          especialidade: form.especialidade,
        })
        .eq('id', editingId)

      toast.success('Coach atualizado!')
    } else {
      const { data: novoUsuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .insert({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          role: 'coach',
          ativo: true,
        })
        .select()
        .single()

      if (erroUsuario) {
        toast.error('Erro ao criar usuário')
        return
      }

      const { error: erroCoach } = await supabase
        .from('coaches')
        .insert({
          usuario_id: novoUsuario.id,
          especialidade: form.especialidade,
          bio: form.bio,
          ativo: true,
        })

      if (erroCoach) {
        toast.error('Erro ao criar coach')
        return
      }

      toast.success('Coach criado!')
    }

    resetForm()
    setShowForm(false)
    carregarCoaches()
  }

  function handleEdit(c: any) {
    setForm({
      nome: c.usuarios?.nome || '',
      email: c.usuarios?.email || '',
      telefone: c.usuarios?.telefone || '',
      bio: c.bio || '',
      especialidade: c.especialidade || '',
    })

    setEditingId(c.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente inativar este coach?')) return

    await supabase
      .from('coaches')
      .update({ ativo: false })
      .eq('id', id)

    toast.success('Coach inativado!')
    carregarCoaches()
  }

  const coachesFiltrados = coaches.filter((c) => {
    const termo = busca.toLowerCase()

    return (
      c.ativo &&
      (
        c.usuarios?.nome?.toLowerCase().includes(termo) ||
        c.bio?.toLowerCase().includes(termo) ||
        c.especialidade?.toLowerCase().includes(termo)
      )
    )
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Gerenciar Coaches
          </h1>
          <p className="text-sm text-text-secondary">
            {coachesFiltrados.length} coaches cadastrados
          </p>
        </div>

        <Button onClick={() => {
          resetForm()
          setShowForm(!showForm)
        }}>
          <Plus size={18} className="mr-2" />
          Novo Coach
        </Button>
      </div>

      <div className="relative">
        <UserCog
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          className="pl-10"
          placeholder="Buscar coach..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">
            {editingId ? 'Editar Coach' : 'Novo Coach'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className="sm:col-span-2"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Salvar
            </Button>

            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coachesFiltrados.map((c) => (
          <GlassCard key={c.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-lg">
                  {c.usuarios?.nome?.charAt(0) || 'C'}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {c.usuarios?.nome}
                  </h3>

                  <p className="text-xs text-text-secondary">
                    {c.usuarios?.email}
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.03]"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-red-500"
                >
                  <Ban size={14} />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-1">
                Especialidade
              </p>

              <Badge variant="accent">
                {c.especialidade || '---'}
              </Badge>
            </div>

            {c.bio && (
              <p className="text-xs text-text-secondary leading-relaxed">
                {c.bio}
              </p>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
