import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Ban, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

type Usuario = {
  id: string
  nome: string
  email: string
  role: 'admin' | 'coach' | 'aluno'
  telefone?: string
  ativo: boolean
}

export function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    role: 'aluno' as 'admin' | 'coach' | 'aluno',
    telefone: '',
  })

  async function carregarUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar usuários')
      return
    }

    if (data) setUsuarios(data)
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

    if (editingId) {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: form.nome,
          email: form.email,
          role: form.role,
          telefone: form.telefone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)

      if (error) {
        toast.error('Erro ao atualizar usuário')
        return
      }

      toast.success('Usuário atualizado!')
    } else {
      const { error } = await supabase.from('usuarios').insert([
  {
    box_id: '89b16bd4-69f8-43ae-ba6e-7434d424fef0',
    nome: form.nome,
    email: form.email,
    role: form.role,
    telefone: form.telefone || null,
    ativo: true,
    auth_provider: 'email',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
])

      if (error) {
  console.log('ERRO SUPABASE:', error)
  toast.error(error.message)
  return
}

      toast.success('Usuário criado!')
    }

    setForm({
      nome: '',
      email: '',
      role: 'aluno',
      telefone: '',
    })

    setEditingId(null)
    setShowForm(false)

    carregarUsuarios()
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

    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir usuário')
      return
    }

    toast.success('Usuário excluído!')
    carregarUsuarios()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Gerenciar Usuários
          </h1>
          <p className="text-sm text-text-secondary">
            {usuarios.length} usuários cadastrados
          </p>
        </div>

        <Button
          onClick={() => {
            setForm({
              nome: '',
              email: '',
              role: 'aluno',
              telefone: '',
            })
            setEditingId(null)
            setShowForm(!showForm)
          }}
        >
          <Plus size={18} className="mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          className="pl-10"
          placeholder="Buscar usuário..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">
            {editingId ? 'Editar' : 'Novo'} Usuário
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) =>
                setForm({ ...form, nome: e.target.value })
              }
            />

            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as any })
              }
              className="glass-input w-full text-sm"
            >
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="aluno">Aluno</option>
            </select>

            <Input
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) =>
                setForm({ ...form, telefone: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Salvar
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {usuariosFiltrados.map((u) => (
          <GlassCard
            key={u.id}
            className="p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-sm">
              {u.nome?.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {u.nome}
              </p>
              <p className="text-xs text-text-secondary">
                {u.email}
              </p>
            </div>

            <Badge
              variant={
                u.role === 'admin'
                  ? 'accent'
                  : u.role === 'coach'
                  ? 'warning'
                  : 'success'
              }
            >
              {u.role}
            </Badge>

            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(u)}
                className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"
              >
                <Edit2 size={14} />
              </button>

              <button
                onClick={() => handleDelete(u.id)}
                className="p-1.5 rounded-lg hover:bg-error/5 text-error"
              >
                <Ban size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
