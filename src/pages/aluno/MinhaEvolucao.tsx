import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Weight, Zap } from 'lucide-react'

const dadosPeso = [
  { mes: 'Jan', peso: 80 },
  { mes: 'Fev', peso: 79.5 },
  { mes: 'Mar', peso: 79 },
  { mes: 'Abr', peso: 78.5 },
  { mes: 'Mai', peso: 78.5 },
  { mes: 'Jun', peso: 78 },
]

const dadosPerformance = [
  { mes: 'Jan', pontuacao: 720 },
  { mes: 'Fev', pontuacao: 780 },
  { mes: 'Mar', pontuacao: 820 },
  { mes: 'Abr', pontuacao: 860 },
  { mes: 'Mai', pontuacao: 920 },
  { mes: 'Jun', pontuacao: 950 },
]

export function MinhaEvolucao() {
  const [abaAtiva, setAbaAtiva] = useState<'peso' | 'performance' | 'cargas'>('peso')

  const abas = [
    { id: 'peso' as const, label: 'Peso', icon: Weight },
    { id: 'performance' as const, label: 'Performance', icon: TrendingUp },
    { id: 'cargas' as const, label: 'Cargas', icon: Zap },
  ]

  const dados = abaAtiva === 'peso' ? dadosPeso : dadosPerformance
  const chave = abaAtiva === 'peso' ? 'peso' : 'pontuacao'
  const cor = abaAtiva === 'peso' ? '#34D399' : '#00E5FF'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Minha Evolucao</h1>
        <p className="text-sm text-text-secondary">Acompanhe sua progressao ao longo do tempo</p>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {abas.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.id}
              onClick={() => setAbaAtiva(a.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                abaAtiva === a.id
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'bg-white/[0.03] text-text-secondary border border-white/[0.05]'
              }`}
            >
              <Icon size={16} />
              {a.label}
            </button>
          )
        })}
      </div>

      {/* Grafico */}
      <GlassCard className="p-5 space-y-4">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados}>
              <defs>
                <linearGradient id={`evGrad-${abaAtiva}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={cor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#131C25', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey={chave} stroke={cor} strokeWidth={2} fill={`url(#evGrad-${abaAtiva})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  )
}
