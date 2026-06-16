import { GlassCard } from '@/components/ui/GlassCard'
import { Bell, Check, MessageSquare, Trophy, Dumbbell, AlertCircle } from 'lucide-react'
import { getNotificacoesByUsuario } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const tipoIcon: Record<string, { icon: typeof MessageSquare; color: string }> = {
  NOVO_TREINO: { icon: Dumbbell, color: 'text-accent' },
  RESULTADO: { icon: Check, color: 'text-success' },
  PR: { icon: Trophy, color: 'text-warning' },
  MENSAGEM_COACH: { icon: MessageSquare, color: 'text-secondary' },
  ATUALIZACAO: { icon: AlertCircle, color: 'text-accent' },
}

export function Notificacoes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const notificacoes = user ? getNotificacoesByUsuario(user.id) : []

  function handleClick(n: typeof notificacoes[0]) {
    if (n.link) {
      navigate(n.link, { state: { notificacaoId: n.id, tipo: n.tipo } })
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Notificacoes</h1>
        <p className="text-sm text-text-secondary">{notificacoes.filter((n) => !n.lida).length} nao lidas</p>
      </div>

      <div className="space-y-2">
        {notificacoes.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Bell size={32} className="mx-auto text-text-secondary mb-2" />
            <p className="text-sm text-text-secondary">Nenhuma notificacao</p>
          </GlassCard>
        )}
        {notificacoes.map((n) => {
          const tipo = tipoIcon[n.tipo] || tipoIcon.ATUALIZACAO
          const Icon = tipo.icon
          return (
            <GlassCard
              key={n.id}
              onClick={() => handleClick(n)}
              className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-white/[0.01] transition-colors ${n.lida ? 'opacity-60' : ''}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.lida ? 'bg-white/[0.03]' : 'bg-accent/10'}`}>
                <Icon size={16} className={tipo.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{n.titulo}</p>
                  {!n.lida && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{n.mensagem}</p>
                <p className="text-[10px] text-text-secondary mt-1">
                  {new Date(n.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.lida && (
                <button
                  onClick={(e) => { e.stopPropagation(); /* marcar lida futuro */ }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <Check size={14} className="text-success" />
                </button>
              )}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
