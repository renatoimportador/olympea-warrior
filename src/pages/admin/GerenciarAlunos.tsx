import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  listarAlunos,
  criarAluno,
  atualizarAluno,
  excluirAluno,
  criarUsuario,
  atualizarUsuario,
  getUsuarioByEmail,
  getBoxId,
  listarNiveis,
} from '@/lib/api'
import type { Aluno } from '@/data/types'
import { Search, Plus, Edit2, Ban, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export function GerenciarAlunos() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [niveis, setNiveis] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '',
    email: '',
    categoria: '',
    peso: '',
    altura: '',
    telefone: '',
  })

  async function carregarAlunos() {
    try {
      const data = await listarAlunos()
      setAlunos(data)
    } catch {
      toast.error('Erro ao carregar alunos')
    }
  }

  async function carregarNiveis() {
    try {
      const data = await listarNiveis()
      setNiveis(data || [])
    } catch {
      console.error('Erro ao carregar niveis')
    }
  }

  useEffect(() => {
    carregarAlunos()
    carregarNiveis()
  }, [])

  function resetForm() {
    setForm({
      nome: '',
      email: '',
      categoria: niveis.length > 0 ? niveis[0].slug : '',
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

    if (!form.categoria) {
      toast.error('Selecione o nivel/categoria')
      return
    }

    try {
      if (editingId) {
        const alunoAtual = alunos.find((a) => a.id === editingId)
        if (!alunoAtual) return

        await atualizarUsuario(alunoAtual.usuario_id, {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || undefined,
        })

        await atualizarAluno(editingId, {
          categoria: form.categoria as any,
          peso_atual: form.peso ? parseFloat(form.peso) : undefined,
          altura: form.altura ? parseFloat(form.altura.replace(',', '.')) : undefined,
        })

        toast.success('Aluno atualizado!')
      } else {
        let usuario = null

        const usuarioExistente = await getUsuarioByEmail(form.email)
        if (usuarioExistente) {
          usuario = usuarioExistente
        } else {
          const boxId = await getBoxId()
          usuario = await criarUsuario({
            box_id: boxId || undefined,
            nome: form.nome,
            email: form.email,
            telefone: form.telefone || undefined,
            role: 'aluno',
            ativo: true,
            auth_provider: 'email',
          })
        }

        if (!usuario) {
          toast.error('Erro ao criar usuario')
          return
        }

        const novoAluno = await criarAluno({
          usuario_id: usuario.id,
          box_id: usuario.box_id || undefined,
          categoria: form.categoria as any,
          peso_atual: form.peso ? parseFloat(form.peso) : undefined,
          altura: form.altura ? parseFloat(form.altura.replace(',', '.')) : undefined,
          ativo: true,
        })

        if (!novoAluno) {
          toast.error('Erro ao salvar aluno no banco')
          return
        }

        toast.success('Aluno criado!')
      }

      resetForm()
      setShowForm(false)
      await carregarAlunos()
    } catch (e: any) {
      console.error('Erro ao salvar aluno:', e)
      toast.error(e?.message || 'Erro ao salvar aluno')
    }
  }

  function handleEdit(a: any) {
    setForm({
      nome: a.usuario?.nome || '',
      email: a.usuario?.email || '',
      categoria: a.categoria || '',
      peso: a.peso_atual ? String(a.peso_atual) : '',
      altura: a.altura ? String(a.altura) : '',
      telefone: a.usuario?.telefone || '',
    })
    setEditingId(a.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este aluno?')) return
    try {
      await excluirAluno(id)
      toast.success('Aluno excluido!')
      carregarAlunos()
    } catch {
      toast.error('Erro ao excluir aluno')
    }
  }

  const alunosFiltrados = alunos.filter((a: any) => {
    const termo = busca.toLowerCase()
    return (
      a.usuario?.nome?.toLowerCase().includes(termo) ||
      a.categoria?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gerenciar Alunos</h1>
          <p className="text-sm text-text-secondary">{alunos.length} alunos cadastrados</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus size={18} className="mr-2" />
          Novo Aluno
        </Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input className="pl-10" placeholder="Buscar aluno..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3>{editingId ? 'Editar Aluno' : 'Novo Aluno'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="glass-input w-full"
            >
              <option value="">Selecione o nivel</option>
              {niveis.map((n: any) => (
                <option key={n.id} value={n.slug}>
                  {n.nome}
                </option>
              ))}
            </select>
            <Input placeholder="Peso (kg)" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            <Input placeholder="Altura (m)" value={form.altura} onChange={(e) => setForm({ ...form, altura: e.target.value })} />
            <Input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}><Save size={16} className="mr-2" />Salvar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {alunosFiltrados.map((a: any) => (
          <GlassCard key={a.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              {a.usuario?.nome?.charAt(0)}
            </div>
            <div className="flex-1">
              <p>{a.usuario?.nome}</p>
              <p>{a.usuario?.email}</p>
            </div>
            <Badge>{a.categoria}</Badge>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(a)}><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-error/5 text-error"><Ban size={14} /></button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
