import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Bell, Check, MessageSquare, Trophy, Dumbbell, AlertCircle } from 'lucide-react'
import { listarNotificacoesByUsuario, marcarNotificacaoLida } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { Notificacao } from '@/data/types'

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
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      if (!user) { setLoading(false); return }
      const data = await listarNotificacoesByUsuario(user.id)
      setNotificacoes(data)
      setLoading(false)
    }
    carregar()
  }, [user])

  async function handleClick(n: Notificacao) {
    if (!n.lida) {
      try {
        await marcarNotificacaoLida(n.id)
        setNotificacoes(prev => prev.map(not => not.id === n.id ? { ...not, lida: true } : not))
      } catch {}
    }
    if (n.link) {
      navigate(n.link, { state: { notificacaoId: n.id, tipo: n.tipo } })
    }
  }

  async function handleMarcarLida(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    try {
      await marcarNotificacaoLida(id)
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    } catch {}
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Notificacoes</h1>
        <p className="text-sm text-text-secondary">Carregando...</p>
      </div>
    )
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
            <p className="text-sm text-text-secondary">Nenhuma notificacao.</p>
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
                  {n.data ? new Date(n.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
              {!n.lida && (
                <button
                  onClick={(e) => handleMarcarLida(e, n.id)}
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
