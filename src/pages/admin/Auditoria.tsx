import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { listarAuditorias } from '@/lib/api'
import type { Auditoria as AuditoriaType } from '@/data/types'
import { Edit3, Trash2, Copy, CheckSquare } from 'lucide-react'

const iconeAcao: Record<string, typeof Edit3> = {
  CREATE: Copy,
  UPDATE: Edit3,
  DELETE: Trash2,
  DUPLICAR: Copy,
  CHECKIN: CheckSquare,
  CHECKOUT: CheckSquare,
}

const corAcao: Record<string, string> = {
  CREATE: 'text-success',
  UPDATE: 'text-accent',
  DELETE: 'text-error',
  DUPLICAR: 'text-warning',
  CHECKIN: 'text-success',
  CHECKOUT: 'text-text-secondary',
}

export function Auditoria() {
  const [auditorias, setAuditorias] = useState<AuditoriaType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarAuditorias()
        setAuditorias(data)
      } catch (e) {
        console.error('Erro ao carregar auditorias:', e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Auditoria</h1>
        <p className="text-sm text-text-secondary">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Auditoria</h1>
        <p className="text-sm text-text-secondary">Log de todas as alteracoes do sistema</p>
      </div>

      <div className="space-y-2">
        {auditorias.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-text-secondary">Nenhum registro de auditoria.</p>
          </GlassCard>
        )}
        {auditorias.map((a) => {
          const Icon = iconeAcao[a.acao] || Edit3
          return (
            <GlassCard key={a.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                <Icon size={16} className={corAcao[a.acao] || 'text-text-secondary'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary capitalize">{a.acao.toLowerCase()}</span>
                  <span className="text-xs text-text-secondary">em {a.tabela}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  {new Date(a.created_at).toLocaleString('pt-BR')}
                </p>
                {a.dados_novos && (
                  <p className="text-[10px] text-text-secondary mt-1 font-mono truncate">
                    {JSON.stringify(a.dados_novos)}
                  </p>
                )}
              </div>
              <Badge variant={a.acao === 'CREATE' ? 'success' : a.acao === 'DELETE' ? 'error' : 'default'}>
                {a.acao}
              </Badge>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
