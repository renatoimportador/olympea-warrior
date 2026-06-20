import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2, BookOpen } from 'lucide-react'

export function BibliotecaExercicios() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
const [exercicios, setExercicios] = useState<any[]>([])
  const [nome, setNome] = useState('')
const [slug, setSlug] = useState('')
const [categoria, setCategoria] = useState('')
const [dificuldade, setDificuldade] = useState('')
const [descricao, setDescricao] = useState('')
const [padraoMovimento, setPadraoMovimento] = useState('')
const [dicasCoach, setDicasCoach] = useState('')
  useEffect(() => {
  carregarExercicios()
}, [])

async function carregarExercicios() {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')

  if (!error && data) {
    setExercicios(data)
  }
}

  async function salvarExercicio() {
  const { data, error } = await supabase
    .from('exercicios')
    .insert([
      {
        nome,
        slug,
        categoria,
        dificuldade,
        descricao,
        padrao_movimento: padraoMovimento,
        dicas_coach: dicasCoach,
        ativo: true
      }
    ])
console.log('DATA:', data)
console.log('ERROR:', error)
  if (!error) {
    setShowForm(false)
    carregarExercicios()

    setNome('')
    setSlug('')
    setCategoria('')
    setDificuldade('')
    setDescricao('')
    setPadraoMovimento('')
    setDicasCoach('')
  }
}

const filtrados = exercicios.filter((e) =>
  e.ativo &&
  (
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.categoria.toLowerCase().includes(busca.toLowerCase())
  )
)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Biblioteca de Exercicios</h1>
          <p className="text-sm text-text-secondary">{filtrados.length} exercicios cadastrados</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" />
          Novo Exercicio
        </Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input className="pl-10" placeholder="Buscar exercicio..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">Novo Exercicio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
  placeholder="Nome do exercicio"
  value={nome}
  onChange={(e) => setNome(e.target.value)}
/>

<Input
  placeholder="Slug"
  value={slug}
  onChange={(e) => setSlug(e.target.value)}
/>

<Input
  placeholder="Categoria"
  value={categoria}
  onChange={(e) => setCategoria(e.target.value)}
/>

<Input
  placeholder="Dificuldade"
  value={dificuldade}
  onChange={(e) => setDificuldade(e.target.value)}
/>
            <textarea
  placeholder="Descricao"
  rows={3}
  value={descricao}
  onChange={(e) => setDescricao(e.target.value)}
  className="glass-input w-full resize-none sm:col-span-2"
/>
            <textarea
  placeholder="Padrao de movimento"
  rows={3}
  value={padraoMovimento}
  onChange={(e) => setPadraoMovimento(e.target.value)}
  className="glass-input w-full resize-none sm:col-span-2"
/>
            <textarea
  placeholder="Dicas do coach"
  rows={3}
  value={dicasCoach}
  onChange={(e) => setDicasCoach(e.target.value)}
  className="glass-input w-full resize-none sm:col-span-2"
/>
          </div>
          <div className="flex gap-2">
            <Button onClick={salvarExercicio}>Salvar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
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
                <button className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary">
                  <Edit2 size={14} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-error/5 text-error">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">{e.nome}</h3>
            <p className="text-xs text-text-secondary line-clamp-2">{e.descricao}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
              <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[10px] text-text-secondary">{e.categoria}</span>
              {e.dificuldade && (
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[10px] text-text-secondary">{e.dificuldade}</span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
