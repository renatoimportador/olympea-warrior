import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { niveis } from '@/data/seed'
import { Search, Plus, Layers, Edit2, Trash2 } from 'lucide-react'

export function GerenciarNiveis() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtrados = niveis.filter((n) =>
    n.ativo && n.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gerenciar Niveis</h1>
          <p className="text-sm text-text-secondary">Personalize os niveis de cada treino</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" />
          Novo Nivel
        </Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input className="pl-10" placeholder="Buscar nivel..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">Novo Nivel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input placeholder="Nome do nivel" />
            <Input placeholder="Slug" />
            <Input placeholder="Cor (hex)" />
            <Input placeholder="Ordem" type="number" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(false)}>Salvar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {filtrados.map((n) => (
          <GlassCard key={n.id} className="p-4 flex items-center gap-4">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: n.cor }} />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{n.nome}</p>
              <p className="text-xs text-text-secondary">{n.slug} - Ordem {n.ordem}</p>
            </div>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary">
                <Edit2 size={14} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-error/5 text-error">
                <Trash2 size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
