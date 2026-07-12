import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  listarCoaches,
  atualizarCoach,
  excluirCoach,
  atualizarUsuario,
  criarAcessoUsuario,
  reenviarConvite,
  getBoxId,
} from '@/lib/api'
import type { Coach } from '@/data/types'
import { UserCog, Plus, Edit2, Ban, Save, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export function GerenciarCoaches() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [saving, setSaving] = useState(false)
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

    if (saving) return
    setSaving(true)

    try {
      if (editingId) {
        // Edição: mantém fluxo direto
        const coachAtual = coaches.find((c) => c.id === editingId)
        if (!coachAtual) return

        await atualizarUsuario(coachAtual.usuario_id, {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || undefined,
        })

        await atualizarCoach(editingId, {
          bio: form.bio,
          especialidade: form.especialidade || undefined,
        })

        toast.success('Coach atualizado!')
      } else {
        // Criação: usa API segura
        const boxId = await getBoxId()

        const result = await criarAcessoUsuario({
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          role: 'coach',
          box_id: boxId || undefined,
          dadosExtra: {
            bio: form.bio || undefined,
            especialidade: form.especialidade || undefined,
          }
        })

        if (result.warning) {
          toast.success(result.message, { duration: 6000 })
        } else {
          toast.success(result.message || 'Coach cadastrado com sucesso!', { duration: 5000 })
        }
      }

      setForm({ nome: '', email: '', telefone: '', bio: '', especialidade: '' })
      setEditingId(null)
      setShowForm(false)
      carregarCoaches()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar coach')
    } finally {
      setSaving(false)
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

  async function handleReenviarConvite(email: string) {
    try {
      const result = await reenviarConvite(email)
      toast.success(result.message || 'Convite reenviado!')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao reenviar convite')
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
          {!editingId && (
            <p className="text-xs text-text-secondary">
              Ao cadastrar, um convite será enviado por e-mail para o coach criar a própria senha.
            </p>
          )}
          <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!!editingId}
          />
          <Input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <Input placeholder="Especialidade" value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} />
          <Input placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coachesFiltrados.map((c: any) => (
          <GlassCard key={c.id} className="p-5">
            <div className="flex justify-between">
              <div>
                <h3>{c.usuario?.nome}</h3>
                <p className="text-xs text-text-secondary">{c.usuario?.email}</p>
                <Badge>{c.especialidade}</Badge>
                <p>{c.bio}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReenviarConvite(c.usuario?.email)}
                  title="Reenviar convite"
                  className="p-1.5 rounded-lg hover:bg-accent/10 text-text-secondary hover:text-accent"
                >
                  <Mail size={14} />
                </button>
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
