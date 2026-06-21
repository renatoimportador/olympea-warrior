import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { exercicios } from '@/data/seed'
import { Search, BookOpen, ArrowRight } from 'lucide-react'

const categorias = ['TODOS', 'LPO', 'GYMNASTICS', 'MONOSTRUTURAL', 'CORE']

export function BibliotecaMovimentos() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('TODOS')

  const filtrados = exercicios.filter((e) => {
    const matchCategoria = categoria === 'TODOS' || e.categoria === categoria
    const matchBusca = e.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCategoria && matchBusca && e.ativo
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Biblioteca de Movimentos</h1>
        <p className="text-sm text-text-secondary">Exercicios, padroes, erros e escalas</p>
      </div>

      {/* Buscas */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input
          className="pl-10"
          placeholder="Buscar movimento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              categoria === c
                ? 'bg-accent/15 text-accent border border-accent/20'
                : 'bg-white/[0.03] text-text-secondary border border-white/[0.05]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtrados.length === 0 && (
          <p className="text-center text-sm text-text-secondary py-8">Nenhum movimento encontrado</p>
        )}
        {filtrados.map((ex) => (
          <GlassCard
            key={ex.id}
            className="p-4 flex items-center gap-4 cursor-pointer hover:border-accent/10 group"
            onClick={() => navigate(`/movimento/${ex.slug}`)}
          >
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center flex-shrink-0 border border-white/[0.05] group-hover:border-accent/10 transition-colors">
              <BookOpen size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-text-primary">{ex.nome}</h3>
              <p className="text-xs text-text-secondary line-clamp-1">{ex.descricao}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[10px] text-text-secondary">{ex.categoria}</span>
                {ex.dificuldade && (
                  <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[10px] text-text-secondary">{ex.dificuldade}</span>
                )}
              </div>
            </div>
            <ArrowRight size={16} className="text-text-secondary group-hover:text-accent transition-colors flex-shrink-0" />
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
