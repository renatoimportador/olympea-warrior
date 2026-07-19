import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  listarUsuarios,
  atualizarUsuario,
  excluirUsuario,
  criarAcessoUsuario,
  reenviarConvite,
} from '@/lib/api'
import type { Usuario } from '@/data/types'
import { Search, Plus, Edit2, Ban, Save, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [reenviando, setReenviando] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    role: 'aluno' as 'admin' | 'coach' | 'aluno',
    telefone: '',
  })

  async function carregarUsuarios() {
    try {
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch {
      toast.error('Erro ao carregar usuarios')
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase()
    return (
      (u.nome || '').toLowerCase().includes(termo) ||
      (u.email || '').toLowerCase().includes(termo) ||
      (u.role || '').toLowerCase().includes(termo)
    )
  })

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Preencha nome e email')
      return
    }

    setSaving(true)

    try {
      if (editingId) {
        await atualizarUsuario(editingId, {
          nome: form.nome,
          email: form.email,
          role: form.role,
          telefone: form.telefone || undefined,
        })
        toast.success('Usuario atualizado!')
      } else {
        await criarAcessoUsuario({
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role === 'admin' ? 'coach' : form.role,
          dadosExtra: {
            telefone: form.telefone || undefined,
          },
        })
        toast.success('Usuario criado! Um convite foi enviado para o e-mail informado.')
      }

      setForm({ nome: '', email: '', role: 'aluno', telefone: '' })
      setEditingId(null)
      setShowForm(false)
      await carregarUsuarios()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar usuario')
    } finally {
      setSaving(false)
    }
  }

  async function handleReenviar(email: string) {
    setReenviando(email)
    try {
      await reenviarConvite(email)
      toast.success('Convite reenviado com sucesso!')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao reenviar convite')
    } finally {
      setReenviando(null)
    }
  }

  function handleEdit(u: Usuario) {
    setForm({
      nome: u.nome,
      email: u.email,
      role: u.role,
      telefone: u.telefone || '',
    })
    setEditingId(u.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir?')) return
    try {
      await excluirUsuario(id)
      toast.success('Usuario excluido!')
      carregarUsuarios()
    } catch {
      toast.error('Erro ao excluir usuario')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gerenciar Usuarios</h1>
          <p className="text-sm text-text-secondary">{usuarios.length} usuarios cadastrados</p>
        </div>
        <Button
          onClick={() => {
            setForm({ nome: '', email: '', role: 'aluno', telefone: '' })
            setEditingId(null)
            setShowForm(!showForm)
          }}
        >
          <Plus size={18} className="mr-2" />
          Novo Usuario
        </Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input className="pl-10" placeholder="Buscar usuario..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">{editingId ? 'Editar' : 'Novo'} Usuario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'coach' | 'aluno' })}
              className="glass-input w-full text-sm"
            >
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="aluno">Aluno</option>
            </select>
            <Input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {usuariosFiltrados.map((u) => (
          <GlassCard key={u.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-sm">
              {u.nome?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{u.nome}</p>
              <p className="text-xs text-text-secondary">{u.email}</p>
            </div>
            <Badge variant={u.role === 'admin' ? 'accent' : u.role === 'coach' ? 'warning' : 'success'}>{u.role}</Badge>
            <div className="flex gap-1">
              <button
                onClick={() => handleReenviar(u.email)}
                disabled={reenviando === u.email}
                className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary disabled:opacity-50"
                title="Reenviar convite"
              >
                <Mail size={14} />
              </button>
              <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-error/5 text-error"><Ban size={14} /></button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
