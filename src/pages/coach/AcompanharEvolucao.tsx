import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { alunos, usuarios, resultados } from '@/data/seed'
import { TrendingUp, Trophy, User } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const evolucaoData = [
  { mes: 'Jan', pontos: 720 },
  { mes: 'Fev', pontos: 750 },
  { mes: 'Mar', pontos: 790 },
  { mes: 'Abr', pontos: 830 },
  { mes: 'Mai', pontos: 880 },
  { mes: 'Jun', pontos: 920 },
]

export function AcompanharEvolucao() {
  const alunosVinculados = alunos.filter((a) => a.ativo)
    .map((a) => {
      const u = usuarios.find((u) => u.id === a.usuario_id)
      const res = resultados.filter((r) => r.aluno_id === a.id)
      return { ...a, usuario: u, totalResultados: res.length }
    })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Acompanhar Evolucao</h1>
        <p className="text-sm text-text-secondary">Desempenho dos alunos ao longo do tempo</p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          Evolucao Geral dos Alunos
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolucaoData}>
              <defs>
                <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#131C25', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="pontos" stroke="#00E5FF" strokeWidth={2} fill="url(#evoGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="space-y-2">
        {alunosVinculados.map((a) => (
          <GlassCard key={a.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center font-bold text-accent text-sm">
                {a.usuario?.nome?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{a.usuario?.nome}</p>
                <p className="text-xs text-text-secondary">{a.totalResultados} resultados</p>
              </div>
              <Badge variant={a.categoria === 'RX' ? 'accent' : a.categoria === 'SCALING' ? 'warning' : 'success'} className="ml-auto">
                {a.categoria}
              </Badge>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.05]">
              <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${Math.min((a.totalResultados * 10) + 50, 100)}%` }} />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
