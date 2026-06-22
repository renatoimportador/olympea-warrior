import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Ban, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export function GerenciarAlunos() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [alunos, setAlunos] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '',
    email: '',
    categoria: 'BEGINNER',
    peso: '',
    altura: '',
    telefone: '',
  })

  async function carregarAlunos() {
    const { data, error } = await supabase
      .from('alunos')
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
      toast.error('Erro ao carregar alunos')
      return
    }

    setAlunos(data || [])
  }

  useEffect(() => {
    carregarAlunos()
  }, [])

  function resetForm() {
    setForm({
      nome: '',
      email: '',
      categoria: 'BEGINNER',
      peso: '',
      altura: '',
      telefone: '',
    })
    setEditingId(null)
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Preencha nome e email')
      return
    }

    if (editingId) {
      const alunoAtual = alunos.find((a) => a.id === editingId)

      await supabase
        .from('usuarios')
        .update({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
        })
        .eq('id', alunoAtual.usuario_id)

      await supabase
        .from('alunos')
        .update({
          categoria: form.categoria,
          peso_atual: form.peso ? parseFloat(form.peso) : null,
          altura: form.altura ? parseFloat(form.altura) : null,
        })
        .eq('id', editingId)

      toast.success('Aluno atualizado!')
    } else {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .insert({
          box_id: 'box-1',
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          role: 'aluno',
          ativo: true,
          auth_provider: 'email',
        })
        .select()
        .single()

      if (error || !usuario) {
        toast.error('Erro ao criar usuário')
        return
      }

      await supabase
        .from('alunos')
        .insert({
          usuario_id: usuario.id,
          box_id: usuario.box_id,
          categoria: form.categoria,
          peso_atual: form.peso ? parseFloat(form.peso) : null,
          altura: form.altura ? parseFloat(form.altura) : null,
          ativo: true,
        })

      toast.success('Aluno criado!')
    }

    resetForm()
    setShowForm(false)
    carregarAlunos()
  }

  function handleEdit(a: any) {
    setForm({
      nome: a.usuarios?.nome || '',
      email: a.usuarios?.email || '',
      categoria: a.categoria || 'BEGINNER',
      peso: a.peso_atual ? String(a.peso_atual) : '',
      altura: a.altura ? String(a.altura) : '',
      telefone: a.usuarios?.telefone || '',
    })

    setEditingId(a.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este aluno?')) return

    await supabase
      .from('alunos')
      .update({ ativo: false })
      .eq('id', id)

    toast.success('Aluno excluído!')
    carregarAlunos()
  }

  const alunosFiltrados = alunos.filter((a) => {
    const termo = busca.toLowerCase()

    return (
      a.usuarios?.nome?.toLowerCase().includes(termo) ||
      a.categoria?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Gerenciar Alunos
          </h1>
          <p className="text-sm text-text-secondary">
            {alunos.length} alunos cadastrados
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
        >
          <Plus size={18} className="mr-2" />
          Novo Aluno
        </Button>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          className="pl-10"
          placeholder="Buscar aluno..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">
            {editingId ? 'Editar Aluno' : 'Novo Aluno'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <select
              value={form.categoria}
              onChange={(e) =>
                setForm({ ...form, categoria: e.target.value })
              }
              className="glass-input w-full text-sm"
            >
              <option value="RX">RX</option>
              <option value="SCALING">Scaling</option>
              <option value="BEGINNER">Beginner</option>
            </select>

            <Input
              placeholder="Peso (kg)"
              type="number"
              value={form.peso}
              onChange={(e) => setForm({ ...form, peso: e.target.value })}
            />

            <Input
              placeholder="Altura (cm)"
              type="number"
              value={form.altura}
              onChange={(e) => setForm({ ...form, altura: e.target.value })}
            />

            <Input
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
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

      <div className="space-y-2">
        {alunosFiltrados.map((a) => (
          <GlassCard key={a.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
              {a.usuarios?.nome?.charAt(0) || 'A'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {a.usuarios?.nome}
              </p>
              <p className="text-xs text-text-secondary">
                {a.usuarios?.email}
              </p>
            </div>

            <Badge
              variant={
                a.categoria === 'RX'
                  ? 'accent'
                  : a.categoria === 'SCALING'
                  ? 'warning'
                  : 'success'
              }
            >
              {a.categoria}
            </Badge>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleEdit(a)}
                className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"
              >
                <Edit2 size={14} />
              </button>

              <button
                onClick={() => handleDelete(a.id)}
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
