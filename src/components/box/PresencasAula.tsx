import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  confirmarPresenca,
  formatarHora,
  inicioDaAula,
  listarReservasDaAula,
  traduzirErroBoxAulas,
} from '@/lib/boxAulas'
import type { ReservaComAluno } from '@/lib/boxAulas'
import type { AulaOcupacao } from '@/data/types'
import { CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface PresencasAulaProps {
  aula: AulaOcupacao
  /* Data da aula (YYYY-MM-DD) — a RPC listar_aulas_por_data nao a retorna. */
  data: string
  /* Callback apos cada confirmacao, para a tela pai atualizar ocupacao. */
  onAtualizado?: () => void
}

const STATUS_BADGE: Record<
  ReservaComAluno['status'],
  { variant: 'success' | 'accent' | 'warning' | 'default'; label: string }
> = {
  COMPARECEU: { variant: 'success', label: 'Compareceu' },
  CONFIRMADA: { variant: 'accent', label: 'Reserva confirmada' },
  AUSENTE: { variant: 'warning', label: 'Ausente' },
  CANCELADA: { variant: 'default', label: 'Cancelada' },
}

/**
 * Lista de alunos com reserva em uma aula, com registro de COMPARECEU/AUSENTE.
 * Componente compartilhado entre coach (BoxPresencaCoach) e admin
 * (BoxAulasAdmin). Mutacoes exclusivamente via RPC confirmar_presenca —
 * a validacao de horario (a partir do inicio da aula), escopo do box e
 * estado da reserva acontece no backend.
 */
export function PresencasAula({ aula, data, onAtualizado }: PresencasAulaProps) {
  const [reservas, setReservas] = useState<ReservaComAluno[]>([])
  const [loading, setLoading] = useState(true)
  const [operandoId, setOperandoId] = useState<string | null>(null)

  const aulaIniciada = inicioDaAula(data, aula.hora_inicio).getTime() <= Date.now()

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      setReservas(await listarReservasDaAula(aula.aula_id))
    } catch (e) {
      console.error('Erro ao carregar reservas da aula:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setLoading(false)
    }
  }, [aula.aula_id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleConfirmar(reserva: ReservaComAluno, compareceu: boolean) {
    setOperandoId(reserva.id)
    try {
      await confirmarPresenca(reserva.id, compareceu)
      toast.success(
        compareceu
          ? `Presenca de ${reserva.aluno_nome ?? 'aluno'} confirmada.`
          : `Ausencia de ${reserva.aluno_nome ?? 'aluno'} registrada.`
      )
      await carregar()
      onAtualizado?.()
    } catch (e) {
      console.error('Erro ao confirmar presenca:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setOperandoId(null)
    }
  }

  if (loading) {
    return <p className="text-xs text-text-secondary">Carregando reservas...</p>
  }

  if (reservas.length === 0) {
    return (
      <p className="text-xs text-text-secondary">
        Nenhum aluno com reserva nesta aula.
      </p>
    )
  }

  const confirmadas = reservas.filter((r) => r.status === 'CONFIRMADA')

  return (
    <div className="space-y-2 border-t border-white/[0.06] pt-3">
      {!aulaIniciada && confirmadas.length > 0 && (
        <p className="text-xs text-warning">
          A confirmacao de presenca sera liberada a partir das{' '}
          {formatarHora(aula.hora_inicio)} (inicio da aula).
        </p>
      )}

      {reservas.map((r) => {
        const badge = STATUS_BADGE[r.status]
        const podeRegistrar =
          r.status === 'CONFIRMADA' && aulaIniciada && operandoId !== r.id

        return (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm text-text-primary truncate">
                {r.aluno_nome ?? 'Aluno'}
              </p>
              <div className="mt-0.5">
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            </div>

            {r.status === 'CONFIRMADA' && (
              <div className="flex gap-1.5 flex-shrink-0">
                <Button
                  size="sm"
                  disabled={!podeRegistrar}
                  onClick={() => handleConfirmar(r, true)}
                  title={
                    aulaIniciada
                      ? 'Registrar comparecimento'
                      : 'Disponivel a partir do inicio da aula'
                  }
                >
                  <CheckCircle2 size={12} className="mr-1" />
                  {operandoId === r.id ? '...' : 'Compareceu'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!podeRegistrar}
                  onClick={() => handleConfirmar(r, false)}
                  title={
                    aulaIniciada
                      ? 'Registrar ausencia'
                      : 'Disponivel a partir do inicio da aula'
                  }
                >
                  <XCircle size={12} className="mr-1" />
                  Ausente
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
