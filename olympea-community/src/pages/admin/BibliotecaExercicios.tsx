import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { exercicios } from '@/data/seed'
import { Search, Plus, Edit2, Trash2, BookOpen } from 'lucide-react'

export function BibliotecaExercicios() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtrados = exercicios.filter((e) =>
    e.ativo && (e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.categoria.toLowerCase().includes(busca.toLowerCase()))
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
            <Input placeholder="Nome do exercicio" />
            <Input placeholder="Slug" />
            <Input placeholder="Categoria" />
            <Input placeholder="Dificuldade" />
            <textarea placeholder="Descricao" rows={3} className="glass-input w-full resize-none sm:col-span-2" />
            <textarea placeholder="Padrao de movimento" rows={3} className="glass-input w-full resize-none sm:col-span-2" />
            <textarea placeholder="Dicas do coach" rows={3} className="glass-input w-full resize-none sm:col-span-2" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(false)}>Salvar</Button>
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
