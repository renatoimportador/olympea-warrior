import { useCallback, useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { getBoxId } from '@/lib/api'
import {
  DIA_SEMANA_LABEL,
  atualizarCapacidadeAula,
  cancelarAula,
  diaSemanaDeData,
  formatarDataBR,
  formatarHora,
  gerarAulas,
  hojeSaoPaulo,
  listarAulasComOcupacao,
  segundaDaSemana,
  somarDias,
  traduzirErroBoxAulas,
} from '@/lib/boxAulas'
import type { AulaOcupacao } from '@/data/types'
import { PresencasAula } from '@/components/box/PresencasAula'
import {
  Ban,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  UserCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'

function formatarJanela(ts: string): string {
  return new Date(ts).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BoxAulasAdmin() {
  const [semanaInicio, setSemanaInicio] = useState(() =>
    segundaDaSemana(hojeSaoPaulo())
  )
  const [aulasPorDia, setAulasPorDia] = useState<Record<string, AulaOcupacao[]>>({})
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [salvandoCancelamento, setSalvandoCancelamento] = useState(false)
  const [editandoCapId, setEditandoCapId] = useState<string | null>(null)
  const [novaCapacidade, setNovaCapacidade] = useState<number>(20)
  const [salvandoCap, setSalvandoCap] = useState(false)
  const [presencasAbertasId, setPresencasAbertasId] = useState<string | null>(null)

  const hoje = hojeSaoPaulo()
  const diasSemana = Array.from({ length: 7 }, (_, i) =>
    somarDias(semanaInicio, i)
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const resultado: Record<string, AulaOcupacao[]> = {}
      for (const dia of diasSemana) {
        resultado[dia] = await listarAulasComOcupacao(dia)
      }
      setAulasPorDia(resultado)
    } catch (e) {
      console.error('Erro ao carregar aulas:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanaInicio])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleGerar() {
    const boxId = await getBoxId()
    if (!boxId) {
      toast.error('Box nao identificado')
      return
    }

    setGerando(true)
    try {
      const criadas = await gerarAulas(boxId, hoje, somarDias(hoje, 14))
      toast.success(
        criadas > 0
          ? `${criadas} aula(s) gerada(s) a partir da grade.`
          : 'Nenhuma aula nova: o periodo ja estava gerado.'
      )
      await loadData()
    } catch (e) {
      console.error('Erro ao gerar aulas:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setGerando(false)
    }
  }

  function iniciarCancelamento(aula: AulaOcupacao) {
    setCancelandoId(aula.aula_id)
    setMotivo('')
  }

  async function confirmarCancelamento(aula: AulaOcupacao) {
    if (!motivo.trim()) {
      toast.error('Informe o motivo do cancelamento')
      return
    }

    setSalvandoCancelamento(true)
    try {
      await cancelarAula(aula.aula_id, motivo.trim())
      toast.success('Aula cancelada. As reservas existentes foram preservadas.')
      setCancelandoId(null)
      setMotivo('')
      await loadData()
    } catch (e) {
      console.error('Erro ao cancelar aula:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setSalvandoCancelamento(false)
    }
  }

  function iniciarEdicaoCapacidade(aula: AulaOcupacao) {
    setEditandoCapId(aula.aula_id)
    setNovaCapacidade(aula.capacidade)
  }

  async function salvarCapacidade(aula: AulaOcupacao) {
    if (!novaCapacidade || novaCapacidade < 1) {
      toast.error('A capacidade deve ser maior que zero')
      return
    }

    setSalvandoCap(true)
    try {
      await atualizarCapacidadeAula(aula.aula_id, novaCapacidade)
      toast.success('Capacidade atualizada!')
      setEditandoCapId(null)
      await loadData()
    } catch (e) {
      console.error('Erro ao atualizar capacidade:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setSalvandoCap(false)
    }
  }

  const totalSemana = Object.values(aulasPorDia).reduce(
    (acc, lista) => acc + lista.length,
    0
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Aulas — Box Presencial
          </h1>
          <p className="text-sm text-text-secondary">
            Semana de {formatarDataBR(semanaInicio)} a{' '}
            {formatarDataBR(somarDias(semanaInicio, 6))} — {totalSemana} aula(s)
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setSemanaInicio(somarDias(semanaInicio, -7))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSemanaInicio(segundaDaSemana(hoje))}
          >
            Semana atual
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSemanaInicio(somarDias(semanaInicio, 7))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <GlassCard className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-text-primary font-medium">
            Gerar aulas a partir da grade
          </p>
          <p className="text-xs text-text-secondary">
            Periodo permitido: {formatarDataBR(hoje)} ate{' '}
            {formatarDataBR(somarDias(hoje, 14))} (limite de 14 dias definido no
            banco). A geracao e idempotente: nao duplica nem recria aulas
            canceladas.
          </p>
        </div>
        <Button onClick={handleGerar} disabled={gerando}>
          <RefreshCw size={16} className={`mr-2 ${gerando ? 'animate-spin' : ''}`} />
          {gerando ? 'Gerando...' : 'Gerar aulas'}
        </Button>
      </GlassCard>

      {loading && (
        <p className="text-sm text-text-secondary">Carregando aulas...</p>
      )}

      {!loading && totalSemana === 0 && (
        <GlassCard className="p-6 text-center space-y-2">
          <CalendarCheck size={28} className="mx-auto text-text-secondary" />
          <p className="text-text-primary font-medium">
            Nenhuma aula nesta semana
          </p>
          <p className="text-sm text-text-secondary">
            Cadastre horarios na Grade de Aulas e use o botao "Gerar aulas"
            para materializar as ocorrencias.
          </p>
        </GlassCard>
      )}

      {!loading &&
        diasSemana.map((dia) => {
          const aulas = aulasPorDia[dia] || []
          if (aulas.length === 0) return null

          return (
            <div key={dia} className="space-y-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <CalendarCheck size={14} />
                {DIA_SEMANA_LABEL[diaSemanaDeData(dia)]} — {formatarDataBR(dia)}
                {dia === hoje && <Badge variant="accent">Hoje</Badge>}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {aulas.map((aula) => {
                  const cancelada = aula.status === 'CANCELADA'
                  const janelaAberta = aula.janela_checkin_aberta
                  const janelaFutura =
                    !cancelada &&
                    !janelaAberta &&
                    new Date(aula.janela_abre_em).getTime() > Date.now()

                  return (
                    <GlassCard
                      key={aula.aula_id}
                      className={`p-4 space-y-3 ${cancelada ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-text-primary font-semibold">
                            {formatarHora(aula.hora_inicio)} –{' '}
                            {formatarHora(aula.hora_fim)}
                          </p>
                          <p className="text-xs text-text-secondary flex items-center gap-1">
                            <Users size={11} />
                            {cancelada
                              ? `${aula.vagas_ocupadas} reserva(s) preservada(s)`
                              : `${aula.vagas_ocupadas}/${aula.capacidade} ocupadas — ${aula.vagas_disponiveis} livres`}
                          </p>
                        </div>

                        <Badge variant={cancelada ? 'error' : 'success'}>
                          {aula.status}
                        </Badge>
                      </div>

                      {!cancelada && (
                        <div className="flex gap-2 flex-wrap">
                          {janelaAberta && (
                            <Badge variant="accent">Check-in aberto</Badge>
                          )}
                          {janelaFutura && (
                            <Badge>
                              Check-in abre {formatarJanela(aula.janela_abre_em)}
                            </Badge>
                          )}
                          {!janelaAberta && !janelaFutura && (
                            <Badge variant="warning">Check-in encerrado</Badge>
                          )}
                          {aula.vagas_ocupadas > 0 && (
                            <Badge variant="warning">Com reservas</Badge>
                          )}
                        </div>
                      )}

                      {!cancelada && editandoCapId !== aula.aula_id && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => iniciarEdicaoCapacidade(aula)}
                          >
                            Capacidade
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPresencasAbertasId(
                                presencasAbertasId === aula.aula_id
                                  ? null
                                  : aula.aula_id
                              )
                            }
                          >
                            <UserCheck size={12} className="mr-1" />
                            {presencasAbertasId === aula.aula_id
                              ? 'Fechar presencas'
                              : 'Presencas'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => iniciarCancelamento(aula)}
                          >
                            <Ban size={12} className="mr-1" />
                            Cancelar aula
                          </Button>
                        </div>
                      )}

                      {!cancelada &&
                        presencasAbertasId === aula.aula_id &&
                        editandoCapId !== aula.aula_id && (
                          <PresencasAula
                            aula={aula}
                            data={dia}
                            onAtualizado={() => loadData()}
                          />
                        )}

                      {!cancelada && editandoCapId === aula.aula_id && (
                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <Input
                              type="number"
                              min={1}
                              value={novaCapacidade}
                              onChange={(e) =>
                                setNovaCapacidade(
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                          {novaCapacidade < aula.vagas_ocupadas && (
                            <p className="text-xs text-warning">
                              Atencao: existem {aula.vagas_ocupadas} vaga(s)
                              ocupada(s). O banco impedira reduzir abaixo
                              disso.
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={salvandoCap}
                              onClick={() => salvarCapacidade(aula)}
                            >
                              {salvandoCap ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditandoCapId(null)}
                            >
                              Voltar
                            </Button>
                          </div>
                        </div>
                      )}

                      {!cancelada && cancelandoId === aula.aula_id && (
                        <div className="space-y-2 border-t border-white/[0.06] pt-3">
                          {aula.vagas_ocupadas > 0 && (
                            <p className="text-xs text-warning">
                              Esta aula possui {aula.vagas_ocupadas} reserva(s)
                              ativa(s). O cancelamento impede novos check-ins,
                              mas as reservas serao preservadas — comunique os
                              alunos.
                            </p>
                          )}
                          <textarea
                            rows={2}
                            placeholder="Motivo do cancelamento (ex.: feriado)"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            className="glass-input w-full resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={salvandoCancelamento}
                              onClick={() => confirmarCancelamento(aula)}
                            >
                              {salvandoCancelamento
                                ? 'Cancelando...'
                                : 'Confirmar cancelamento'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCancelandoId(null)
                                setMotivo('')
                              }}
                            >
                              Voltar
                            </Button>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )
        })}
    </div>
  )
}
