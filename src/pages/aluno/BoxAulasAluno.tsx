import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useProgramacao } from '@/context/ProgramacaoContext'
import {
  cancelarReservaAluno,
  formatarDataBR,
  formatarHora,
  hojeSaoPaulo,
  listarAulasComOcupacao,
  listarMinhasReservas,
  realizarCheckin,
  somarDias,
  traduzirErroBoxAulas,
} from '@/lib/boxAulas'
import type { AulaOcupacao, Reserva } from '@/data/types'
import {
  Ban,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock,
  Lock,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function rotuloDia(data: string): string {
  const d = new Date(data + 'T12:00:00')
  return DIAS_CURTO[d.getDay()]
}

function formatarJanela(ts: string): string {
  return new Date(ts).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BoxAulasAluno() {
  const { programacaoAtiva } = useProgramacao()

  const hoje = hojeSaoPaulo()
  const [diaSelecionado, setDiaSelecionado] = useState(hoje)
  const [aulas, setAulas] = useState<AulaOcupacao[]>([])
  const [minhasReservas, setMinhasReservas] = useState<Record<string, Reserva>>({})
  const [loading, setLoading] = useState(true)
  const [operandoId, setOperandoId] = useState<string | null>(null)

  const ehBoxPresencial = programacaoAtiva?.modalidade === 'BOX_PRESENCIAL'

  /* Faixa de dias: hoje ate hoje+13 (janela de check-in de 12h permite
     reservar aulas de amanha a partir de hoje) */
  const dias = Array.from({ length: 14 }, (_, i) => somarDias(hoje, i))

  const carregarDia = useCallback(async (data: string) => {
    setLoading(true)
    try {
      const lista = await listarAulasComOcupacao(data)
      setAulas(lista)

      const reservas = await listarMinhasReservas(lista.map((a) => a.aula_id))
      const mapa: Record<string, Reserva> = {}
      // Ultima reserva por aula (created_at desc): define o estado vigente
      for (const r of reservas) {
        if (!mapa[r.aula_id]) mapa[r.aula_id] = r
      }
      setMinhasReservas(mapa)
    } catch (e) {
      console.error('Erro ao carregar aulas do box:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ehBoxPresencial) carregarDia(diaSelecionado)
    else setLoading(false)
  }, [ehBoxPresencial, diaSelecionado, carregarDia])

  async function handleCheckin(aula: AulaOcupacao) {
    setOperandoId(aula.aula_id)
    try {
      await realizarCheckin(aula.aula_id)
      toast.success('Check-in realizado! Vaga garantida.')
      await carregarDia(diaSelecionado)
    } catch (e) {
      console.error('Erro ao realizar check-in:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setOperandoId(null)
    }
  }

  async function handleCancelar(aula: AulaOcupacao, reserva: Reserva) {
    if (
      !confirm(
        `Cancelar sua reserva na aula das ${formatarHora(aula.hora_inicio)} de ${formatarDataBR(diaSelecionado)}?\n\nA vaga sera liberada para outro aluno.`
      )
    )
      return

    setOperandoId(aula.aula_id)
    try {
      await cancelarReservaAluno(reserva.id)
      toast.success('Reserva cancelada. A vaga foi liberada.')
      await carregarDia(diaSelecionado)
    } catch (e) {
      console.error('Erro ao cancelar reserva:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setOperandoId(null)
    }
  }

  /* Guarda de contexto: tela disponivel apenas na modalidade Box Presencial */
  if (!ehBoxPresencial) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary">Aulas do Box</h1>
          <p className="text-sm text-text-secondary">Check-in presencial</p>
        </div>

        <GlassCard className="p-6 text-center space-y-3">
          <CalendarDays size={28} className="mx-auto text-text-secondary" />
          <p className="text-text-primary font-medium">
            As aulas presenciais ficam disponiveis na modalidade Box Presencial
          </p>
          <p className="text-sm text-text-secondary">
            Voce esta na modalidade{' '}
            {programacaoAtiva
              ? programacaoAtiva.modalidade === 'BOX_PRESENCIAL'
                ? 'Box Presencial'
                : 'Planilha Olympea'
              : 'Planilha Olympea'}
            . Selecione uma programacao do Box Presencial para ver os horarios
            e fazer check-in.
          </p>
          <Link
            to="/aluno/seletor-programacao"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Trocar de programacao
          </Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Aulas do Box</h1>
        <p className="text-sm text-text-secondary">
          Reserve sua vaga — check-in abre 12h antes e encerra 10 minutos
          antes do inicio da aula
        </p>
      </div>

      {/* Faixa de dias */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {dias.map((data) => {
          const selecionado = data === diaSelecionado
          return (
            <button
              key={data}
              onClick={() => setDiaSelecionado(data)}
              className={`flex-shrink-0 flex flex-col items-center rounded-xl px-3 py-2 border transition-colors ${
                selecionado
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-white/[0.02] border-white/[0.04] text-text-secondary hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide">
                {data === hoje ? 'Hoje' : rotuloDia(data)}
              </span>
              <span className="text-sm font-bold">
                {data.slice(8, 10)}/{data.slice(5, 7)}
              </span>
            </button>
          )
        })}
      </div>

      {loading && (
        <p className="text-sm text-text-secondary">Carregando aulas...</p>
      )}

      {!loading && aulas.length === 0 && (
        <GlassCard className="p-6 text-center space-y-2">
          <CalendarDays size={28} className="mx-auto text-text-secondary" />
          <p className="text-text-primary font-medium">
            Nenhuma aula em {formatarDataBR(diaSelecionado)}
          </p>
          <p className="text-sm text-text-secondary">
            Consulte outro dia na faixa acima.
          </p>
        </GlassCard>
      )}

      <div className="space-y-3">
        {aulas.map((aula) => {
          const cancelada = aula.status === 'CANCELADA'
          const minha = minhasReservas[aula.aula_id]
          const reservado =
            minha && minha.status === 'CONFIRMADA'
          const presencaRegistrada =
            minha &&
            (minha.status === 'COMPARECEU' || minha.status === 'AUSENTE')
          const lotada =
            !cancelada && !reservado && aula.vagas_disponiveis === 0
          const operando = operandoId === aula.aula_id
          const podeCheckin =
            !cancelada && !reservado && !presencaRegistrada &&
            aula.janela_checkin_aberta && !lotada

          return (
            <GlassCard
              key={aula.aula_id}
              className={`p-4 space-y-3 ${cancelada ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    {formatarHora(aula.hora_inicio)} – {formatarHora(aula.hora_fim)}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                    <Users size={11} />
                    {cancelada
                      ? 'Aula cancelada'
                      : `${aula.vagas_ocupadas}/${aula.capacidade} ocupadas — ${aula.vagas_disponiveis} livre(s)`}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {cancelada && <Badge variant="error">Cancelada</Badge>}
                  {reservado && <Badge variant="success">Reservado</Badge>}
                  {minha?.status === 'COMPARECEU' && (
                    <Badge variant="accent">Presenca confirmada</Badge>
                  )}
                  {minha?.status === 'AUSENTE' && (
                    <Badge variant="warning">Ausencia registrada</Badge>
                  )}
                  {lotada && <Badge variant="warning">Lotada</Badge>}
                  {!cancelada && !lotada && !reservado && (
                    <Badge>
                      {aula.vagas_disponiveis} vaga(s)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Estado da janela de check-in */}
              {!cancelada && !reservado && !presencaRegistrada && (
                <div className="text-xs text-text-secondary flex items-center gap-1.5">
                  {aula.janela_checkin_aberta ? (
                    <>
                      <CheckCircle2 size={12} className="text-success" />
                      Check-in aberto — encerra as{' '}
                      {formatarJanela(aula.janela_encerra_em)}
                    </>
                  ) : new Date(aula.janela_abre_em).getTime() > Date.now() ? (
                    <>
                      <Lock size={12} />
                      Check-in abre as {formatarJanela(aula.janela_abre_em)}
                    </>
                  ) : (
                    <>
                      <Lock size={12} className="text-warning" />
                      Check-in encerrado as{' '}
                      {formatarJanela(aula.janela_encerra_em)}
                    </>
                  )}
                </div>
              )}

              {/* Acoes */}
              {!cancelada && (
                <div className="flex gap-2">
                  {podeCheckin && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckin(aula)}
                      disabled={operando}
                    >
                      {operando ? 'Executando...' : 'Fazer check-in'}
                    </Button>
                  )}
                  {reservado && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelar(aula, minha!)}
                      disabled={operando}
                    >
                      <Ban size={12} className="mr-1" />
                      {operando ? 'Cancelando...' : 'Cancelar reserva'}
                    </Button>
                  )}
                  {presencaRegistrada && (
                    <p className="text-xs text-text-secondary flex items-center gap-1.5">
                      {minha?.status === 'COMPARECEU' ? (
                        <CheckCircle2 size={12} className="text-success" />
                      ) : (
                        <CalendarX size={12} className="text-warning" />
                      )}
                      {minha?.status === 'COMPARECEU'
                        ? 'Presenca confirmada pelo coach'
                        : 'Ausencia registrada pelo coach'}
                    </p>
                  )}
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
