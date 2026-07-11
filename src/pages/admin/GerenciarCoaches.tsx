import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  listarCoaches,
  criarCoach,
  atualizarCoach,
  excluirCoach,
  criarUsuario,
  atualizarUsuario,
  getUsuarioByEmail,
  getBoxId,
} from '@/lib/api'
import type { Coach } from '@/data/types'
import { UserCog, Plus, Edit2, Ban, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export function GerenciarCoaches() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    bio: '',
    especialidade: ''
  })

  async function carregarCoaches() {
    try {
      const data = await listarCoaches()
      setCoaches(data)
    } catch {
      toast.error('Erro ao carregar coaches')
    }
  }

  useEffect(() => {
    carregarCoaches()
  }, [])

  async function handleSave() {
    if (!form.nome || !form.email) {
      toast.error('Preencha nome e email')
      return
    }

    try {
      if (editingId) {
        const coachAtual = coaches.find((c) => c.id === editingId)
        if (!coachAtual) return

        await atualizarUsuario(coachAtual.usuario_id, {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || undefined,
        })

        await atualizarCoach(editingId, {
          bio: form.bio,
          especialidades: form.especialidade ? [form.especialidade] : undefined,
        })

        toast.success('Coach atualizado!')
      } else {
        const boxId = await getBoxId()
        let usuario = null

        const usuarioExistente = await getUsuarioByEmail(form.email)
        if (usuarioExistente) {
          usuario = usuarioExistente
        } else {
          usuario = await criarUsuario({
            box_id: boxId || undefined,
            nome: form.nome,
            email: form.email,
            telefone: form.telefone || undefined,
            role: 'coach',
            ativo: true,
            auth_provider: 'email',
          })
        }

        if (!usuario) {
          toast.error('Erro ao criar usuario')
          return
        }

        await criarCoach({
          usuario_id: usuario.id,
          box_id: boxId || usuario.box_id || undefined,
          bio: form.bio,
          especialidades: form.especialidade ? [form.especialidade] : undefined,
          ativo: true,
        })

        toast.success('Coach criado!')
      }

      setForm({ nome: '', email: '', telefone: '', bio: '', especialidade: '' })
      setEditingId(null)
      setShowForm(false)
      carregarCoaches()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar coach')
    }
  }

  function handleEdit(c: any) {
    setForm({
      nome: c.usuario?.nome || '',
      email: c.usuario?.email || '',
      telefone: c.usuario?.telefone || '',
      bio: c.bio || '',
      especialidade: c.especialidade || ''
    })
    setEditingId(c.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este coach?')) return
    try {
      await excluirCoach(id)
      toast.success('Coach excluido!')
      carregarCoaches()
    } catch {
      toast.error('Erro ao excluir coach')
    }
  }

  const coachesFiltrados = coaches.filter((c: any) => {
    const termo = busca.toLowerCase()
    return (
      c.usuario?.nome?.toLowerCase().includes(termo) ||
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

      <Input placeholder="Buscar coach..." value={busca} onChange={(e) => setBusca(e.target.value)} />

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <Input placeholder="Especialidade" value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} />
          <Input placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <Button onClick={handleSave}><Save size={16} className="mr-2" />Salvar</Button>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coachesFiltrados.map((c: any) => (
          <GlassCard key={c.id} className="p-5">
            <div className="flex justify-between">
              <div>
                <h3>{c.usuario?.nome}</h3>
                <p>{c.usuario?.email}</p>
                <Badge>{c.especialidade}</Badge>
                <p>{c.bio}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(c)}><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-error/5 text-error"><Ban size={14} /></button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
