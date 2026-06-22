import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Ban, BookOpen, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export function BibliotecaExercicios() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [exercicios, setExercicios] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '',
    slug: '',
    categoria: '',
    dificuldade: '',
    descricao: '',
    padrao_movimento: '',
    dicas_coach: '',
  })

  async function carregarExercicios() {
    const { data, error } = await supabase
      .from('exercicios')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      console.log(error)
      toast.error('Erro ao carregar exercícios')
      return
    }

    setExercicios(data || [])
  }

  useEffect(() => {
    carregarExercicios()
  }, [])

  function resetForm() {
    setForm({
      nome: '',
      slug: '',
      categoria: '',
      dificuldade: '',
      descricao: '',
      padrao_movimento: '',
      dicas_coach: '',
    })
    setEditingId(null)
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.slug.trim()) {
      toast.error('Preencha nome e slug')
      return
    }

    if (editingId) {
      const { error } = await supabase
        .from('exercicios')
        .update({
          nome: form.nome,
          slug: form.slug,
          categoria: form.categoria,
          dificuldade: form.dificuldade,
          descricao: form.descricao,
          padrao_movimento: form.padrao_movimento,
          dicas_coach: form.dicas_coach,
        })
        .eq('id', editingId)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Exercício atualizado!')
    } else {
      const { error } = await supabase
        .from('exercicios')
        .insert({
          nome: form.nome,
          slug: form.slug,
          categoria: form.categoria,
          dificuldade: form.dificuldade,
          descricao: form.descricao,
          padrao_movimento: form.padrao_movimento,
          dicas_coach: form.dicas_coach,
          ativo: true,
        })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Exercício criado!')
    }

    resetForm()
    setShowForm(false)
    carregarExercicios()
  }

  function handleEdit(e: any) {
    setForm({
      nome: e.nome || '',
      slug: e.slug || '',
      categoria: e.categoria || '',
      dificuldade: e.dificuldade || '',
      descricao: e.descricao || '',
      padrao_movimento: e.padrao_movimento || '',
      dicas_coach: e.dicas_coach || '',
    })

    setEditingId(e.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente inativar este exercício?')) return

    const { error } = await supabase
      .from('exercicios')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Exercício inativado!')
    carregarExercicios()
  }

  const filtrados = exercicios.filter((e) =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.categoria.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Biblioteca de Exercícios
          </h1>
          <p className="text-sm text-text-secondary">
            {filtrados.length} exercícios cadastrados
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
        >
          <Plus size={18} className="mr-2" />
          Novo Exercício
        </Button>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          className="pl-10"
          placeholder="Buscar exercício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3>{editingId ? 'Editar Exercício' : 'Novo Exercício'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Input placeholder="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            <Input placeholder="Dificuldade" value={form.dificuldade} onChange={(e) => setForm({ ...form, dificuldade: e.target.value })} />

            <textarea
              placeholder="Descrição"
              rows={3}
              className="glass-input w-full resize-none sm:col-span-2"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />

            <textarea
              placeholder="Padrão de movimento"
              rows={3}
              className="glass-input w-full resize-none sm:col-span-2"
              value={form.padrao_movimento}
              onChange={(e) => setForm({ ...form, padrao_movimento: e.target.value })}
            />

            <textarea
              placeholder="Dicas do coach"
              rows={3}
              className="glass-input w-full resize-none sm:col-span-2"
              value={form.dicas_coach}
              onChange={(e) => setForm({ ...form, dicas_coach: e.target.value })}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((e) => (
          <GlassCard key={e.id} className="p-5 space-y-3 group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BookOpen size={18} className="text-accent" />
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(e)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => handleDelete(e.id)}
                  className="p-1.5 rounded-lg hover:bg-error/5 text-error"
                >
                  <Ban size={14} />
                </button>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-text-primary">{e.nome}</h3>
            <p className="text-xs text-text-secondary line-clamp-2">{e.descricao}</p>

            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
              <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[10px] text-text-secondary">
                {e.categoria}
              </span>

              {e.dificuldade && (
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[10px] text-text-secondary">
                  {e.dificuldade}
                </span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
