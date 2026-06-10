import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { listarResultadosByAluno, getTreinoById, getAlunoByUsuarioId } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { Calendar, Search } from 'lucide-react'

export function Historico() {
  const { user } = useAuth()
  const aluno = user ? getAlunoByUsuarioId(user.id) : undefined
  const [busca, setBusca] = useState('')

  const resultados = aluno ? listarResultadosByAluno(aluno.id) : []

  const filtrados = resultados.filter((r) => {
    const treino = getTreinoById(r.treino_id)
    const termo = busca.toLowerCase()
    return (
      (treino?.titulo || '').toLowerCase().includes(termo) ||
      (r.categoria || '').toLowerCase().includes(termo) ||
      (r.data || '').includes(termo)
    )
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Historico</h1>
        <p className="text-sm text-text-secondary">
          {resultados.length} resultados registrados
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input
          className="pl-9"
          placeholder="Buscar por treino, categoria ou data..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filtrados.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Calendar size={32} className="mx-auto text-text-secondary mb-3" />
            <p className="text-sm text-text-secondary">Nenhum resultado encontrado.</p>
          </GlassCard>
        )}
        {filtrados.map((r) => {
          const treino = getTreinoById(r.treino_id)
          const dataLabel = new Date(r.data).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
          return (
            <GlassCard key={r.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">{dataLabel}</span>
                </div>
                <Badge variant={r.categoria === 'RX' ? 'accent' : r.categoria === 'SCALING' ? 'warning' : 'success'}>
                  {r.categoria}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{treino?.titulo || 'Treino'}</p>
                <div className="flex items-center gap-3 mt-1">
                  {r.tempo && (
                    <span className="text-xs text-accent font-medium">{r.tempo}</span>
                  )}
                  {r.rounds !== undefined && r.rounds > 0 && (
                    <span className="text-xs text-text-secondary">{r.rounds} rounds</span>
                  )}
                  {r.repeticoes !== undefined && r.repeticoes > 0 && (
                    <span className="text-xs text-text-secondary">{r.repeticoes} reps</span>
                  )}
                  {r.carga !== undefined && r.carga > 0 && (
                    <span className="text-xs text-text-secondary">{r.carga}kg</span>
                  )}
                  <span className="text-xs text-text-secondary">RPE {r.rpe}</span>
                </div>
              </div>
              {r.reflexao && (
                <p className="text-xs text-text-secondary bg-white/[0.02] p-2 rounded-lg">
                  {r.reflexao}
                </p>
              )}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
