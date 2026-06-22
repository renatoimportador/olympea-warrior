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
  const [niveis, setNiveis] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '',
    email: '',
    categoria: '',
    peso: '',
    altura: '',
    telefone: '',
  })

  async function carregarNiveis() {
    const { data, error } = await supabase
      .from('niveis')
      .select('*')
      .eq('ativo', true)

    if (error) {
      console.log(error)
      return
    }

    setNiveis(data || [])

    if (data && data.length > 0) {
      setForm((prev) => ({
        ...prev,
        categoria: data[0].nome,
      }))
    }
  }

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
      console.log(error)
      toast.error('Erro ao carregar alunos')
      return
    }

    setAlunos(data || [])
  }

  useEffect(() => {
    carregarAlunos()
    carregarNiveis()
  }, [])

  function resetForm() {
    setForm({
      nome: '',
      email: '',
      categoria: niveis.length > 0 ? niveis[0].nome : '',
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

      const { error: userUpdateError } = await supabase
        .from('usuarios')
        .update({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
        })
        .eq('id', alunoAtual.usuario_id)

      if (userUpdateError) {
        toast.error(userUpdateError.message)
        return
      }

      const { error: alunoUpdateError } = await supabase
        .from('alunos')
        .update({
          categoria: form.categoria,
          peso_atual: form.peso ? parseFloat(form.peso) : null,
          altura: form.altura ? parseFloat(form.altura) : null,
        })
        .eq('id', editingId)

      if (alunoUpdateError) {
        toast.error(alunoUpdateError.message)
        return
      }

      toast.success('Aluno atualizado!')
    } else {
      let usuario = null

      // procura se já existe usuário com esse email
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (usuarioExistente) {
        usuario = usuarioExistente
      } else {
        // cria novo usuário
        const { data: novoUsuario, error: userError } = await supabase
          .from('usuarios')
          .insert({
            box_id: '89b16bd4-69f8-43ae-ba6e-7434d424fef0',
            auth_id: null,
            nome: form.nome,
            email: form.email,
            telefone: form.telefone,
            foto_url: '',
            role: 'aluno',
            ativo: true,
            auth_provider: 'email',
          })
          .select()
          .single()

        if (userError || !novoUsuario) {
          toast.error(userError?.message || 'Erro ao criar usuário')
          return
        }

        usuario = novoUsuario
      }

      // cria aluno
      const { error: alunoError } = await supabase
        .from('alunos')
        .insert({
          usuario_id: usuario.id,
          box_id: usuario.box_id,
          categoria: form.categoria,
          peso_atual: form.peso ? parseFloat(form.peso) : null,
          altura: form.altura ? parseFloat(form.altura) : null,
          ativo: true,
        })

      if (alunoError) {
        toast.error(alunoError.message)
        return
      }

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
      categoria: a.categoria || '',
      peso: a.peso_atual ? String(a.peso_atual) : '',
      altura: a.altura ? String(a.altura) : '',
      telefone: a.usuarios?.telefone || '',
    })

    setEditingId(a.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este aluno?')) return

    const { error } = await supabase
      .from('alunos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return
    }

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
          <h3>{editingId ? 'Editar Aluno' : 'Novo Aluno'}</h3>

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

            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="glass-input w-full"
            >
              {niveis.map((nivel) => (
                <option key={nivel.id} value={nivel.nome}>
                  {nivel.nome}
                </option>
              ))}
            </select>

            <Input
              placeholder="Peso"
              value={form.peso}
              onChange={(e) => setForm({ ...form, peso: e.target.value })}
            />

            <Input
              placeholder="Altura"
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
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              {a.usuarios?.nome?.charAt(0)}
            </div>

            <div className="flex-1">
              <p>{a.usuarios?.nome}</p>
              <p>{a.usuarios?.email}</p>
            </div>

            <Badge>{a.categoria}</Badge>

            <div className="flex gap-2">
              <button onClick={() => handleEdit(a)}>
                <Edit2 size={14} />
              </button>

              <button onClick={() => handleDelete(a.id)}>
                <Ban size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
