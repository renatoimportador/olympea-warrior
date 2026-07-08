import { GlassCard } from '@/components/ui/GlassCard'
import { Trophy } from 'lucide-react'

export function CampeonatosAluno() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Meus Campeonatos
        </h1>

        <p className="text-sm text-text-secondary">
          Acompanhe suas inscrições e competições.
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Trophy size={48} className="text-warning mb-4" />

          <h2 className="text-lg font-semibold text-text-primary">
            Nenhum campeonato disponível
          </h2>

          <p className="text-sm text-text-secondary mt-2">
            Você ainda não está inscrito em nenhum campeonato.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
