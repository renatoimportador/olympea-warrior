import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  FileBarChart, TrendingUp, Users, CalendarCheck, Trophy,
} from 'lucide-react'

export function RelatoriosCoach() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Relatorios</h1>
        <p className="text-sm text-text-secondary">Relatorios e estatisticas dos seus alunos</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 space-y-2">
          <Users size={16} className="text-accent" />
          <p className="text-2xl font-bold text-text-primary">24</p>
          <p className="text-xs text-text-secondary">Alunos vinculados</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <TrendingUp size={16} className="text-success" />
          <p className="text-2xl font-bold text-text-primary">85%</p>
          <p className="text-xs text-text-secondary">Taxa de evolucao</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <CalendarCheck size={16} className="text-warning" />
          <p className="text-2xl font-bold text-text-primary">92%</p>
          <p className="text-xs text-text-secondary">Frequencia media</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <Trophy size={16} className="text-secondary" />
          <p className="text-2xl font-bold text-text-primary">12</p>
          <p className="text-xs text-text-secondary">PRs no mes</p>
        </GlassCard>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <FileBarChart size={16} className="text-accent" />
          Relatorios Disponiveis
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Evolucao dos Alunos', desc: 'Progresso mensal' },
            { label: 'Frequencia por Aluno', desc: 'Presenca detalhada' },
            { label: 'Performance por Categoria', desc: 'RX / Scaling / Beginner' },
            { label: 'PRs Conquistados', desc: 'Recordes pessoais' },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
              <div>
                <p className="text-sm font-medium text-text-primary">{r.label}</p>
                <p className="text-xs text-text-secondary">{r.desc}</p>
              </div>
              <Badge variant="accent">Gerar</Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
