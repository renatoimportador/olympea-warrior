import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  formatarDataBR,
  formatarHora,
  hojeSaoPaulo,
  listarAlunosBox,
  listarFrequenciaBox,
  somarDias,
  traduzirErroBoxAulas,
} from '@/lib/boxAulas'
import type { FrequenciaBoxLinha } from '@/lib/boxAulas'
import type { StatusReserva } from '@/data/types'
import { CalendarClock, User, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_LABEL: Record<
  StatusReserva,
  { variant: 'success' | 'accent' | 'warning' | 'default'; label: string }
> = {
  COMPARECEU: { variant: 'success', label: 'Compareceu' },
  CONFIRMADA: { variant: 'accent', label: 'Confirmada' },
  AUSENTE: { variant: 'warning', label: 'Ausente' },
  CANCELADA: { variant: 'default', label: 'Cancelada' },
}

const STATUS_FILTRO: Array<{ value: '' | StatusReserva; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'COMPARECEU', label: 'Compareceu' },
  { value: 'AUSENTE', label: 'Ausente' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

type AlunoFiltro = { aluno_id: string; nome: string }

export function BoxFrequenciaAdmin() {
  const hoje = hojeSaoPaulo()
  const inicioMes = `${hoje.slice(0, 7)}-01`

  const [dataInicio, setDataInicio] = useState(inicioMes)
  const [dataFim, setDataFim] = useState(hoje)
  const [alunoId, setAlunoId] = useState('')
  const [status, setStatus] = useState<'' | StatusReserva>('')

  const [linhas, setLinhas] = useState<FrequenciaBoxLinha[]>([])
  const [alunos, setAlunos] = useState<AlunoFiltro[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarAlunos()
  }, [])

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim, alunoId, status])

  async function carregarAlunos() {
    try {
      setAlunos(await listarAlunosBox())
    } catch (e) {
      console.error('Erro ao carregar alunos:', e)
    } finally {
      setLoadingAlunos(false)
    }
  }

  async function carregar() {
    setLoading(true)
    setErro('')
    try {
      const dados = await listarFrequenciaBox({
        dataInicio,
        dataFim,
        alunoId: alunoId || undefined,
        status: status || undefined,
      })
      setLinhas(dados)
    } catch (e) {
      console.error('Erro ao carregar frequencia do box:', e)
      setErro(traduzirErroBoxAulas(e))
      setLinhas([])
    } finally {
      setLoading(false)
    }
  }

  /* Totais */
  const presencas = linhas.filter((l) => l.status === 'COMPARECEU').length
  const ausencias = linhas.filter((l) => l.status === 'AUSENTE').length
  const cancelamentos = linhas.filter((l) => l.status === 'CANCELADA').length
  const pendentes = linhas.filter((l) => l.status === 'CONFIRMADA').length
  const registrados = presencas + ausencias
  const percentual =
    registrados > 0 ? Math.round((presencas / registrados) * 100) : null

  /* Resumo por aluno (para a secao "Por aluno") */
  const porAluno = new Map<
    string,
    { nome: string; presencas: number; ausencias: number }
  >()
  for (const l of linhas) {
    const atual = porAluno.get(l.aluno_id) ?? {
      nome: l.aluno_nome ?? 'Aluno',
      presencas: 0,
      ausencias: 0,
    }
    if (l.status === 'COMPARECEU') atual.presencas += 1
    if (l.status === 'AUSENTE') atual.ausencias += 1
    porAluno.set(l.aluno_id, atual)
  }
  const resumoPorAluno = Array.from(porAluno.values()).filter(
    (a) => a.presencas + a.ausencias > 0
  )

  function irHoje() {
    setDataInicio(hoje)
    setDataFim(hoje)
  }

  function ultimos7() {
    setDataInicio(somarDias(hoje, -6))
    setDataFim(hoje)
  }

  function mesAtual() {
    setDataInicio(inicioMes)
    setDataFim(hoje)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Frequencia — Box Presencial
        </h1>
        <p className="text-sm text-text-secondary">
          Acompanhamento de presencas nas aulas presenciais (dados reais de
          reservas e aulas)
        </p>
      </div>

      {/* Filtros */}
      <GlassCard className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              Data final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              Aluno
            </label>
            <select
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              disabled={loadingAlunos}
              className="glass-input w-full"
            >
              <option value="">Todos</option>
              {alunos.map((a) => (
                <option key={a.aluno_id} value={a.aluno_id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as '' | StatusReserva)}
              className="glass-input w-full"
            >
              {STATUS_FILTRO.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm" onClick={irHoje}>
              Hoje
            </Button>
            <Button variant="ghost" size="sm" onClick={ultimos7}>
              7 dias
            </Button>
            <Button variant="ghost" size="sm" onClick={mesAtual}>
              Mes atual
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Totais */}
      {!loading && !erro && linhas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold text-success">{presencas}</p>
            <p className="text-xs text-text-secondary">Presencas</p>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold text-warning">{ausencias}</p>
            <p className="text-xs text-text-secondary">Ausencias</p>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold text-text-secondary">{cancelamentos}</p>
            <p className="text-xs text-text-secondary">Cancelamentos</p>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold text-accent">{pendentes}</p>
            <p className="text-xs text-text-secondary">Pendentes</p>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold text-text-primary">
              {percentual !== null ? `${percentual}%` : '—'}
            </p>
            <p className="text-xs text-text-secondary">
              Frequencia {percentual === null && '(sem dados)'}
            </p>
          </GlassCard>
        </div>
      )}

      {/* Por aluno */}
      {!loading && !erro && resumoPorAluno.length > 0 && (
        <GlassCard className="p-4 space-y-2">
          <h3 className="flex items-center gap-2 text-text-primary font-semibold text-sm">
            <Users size={14} />
            Resumo por aluno (periodo filtrado)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {resumoPorAluno.map((a) => {
              const reg = a.presencas + a.ausencias
              const pct = Math.round((a.presencas / reg) * 100)
              return (
                <div
                  key={a.nome}
                  className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                >
                  <span className="text-sm text-text-primary truncate">
                    {a.nome}
                  </span>
                  <span className="text-xs text-text-secondary flex-shrink-0">
                    {a.presencas}P / {a.ausencias}A —{' '}
                    <span className="font-semibold text-text-primary">
                      {pct}%
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {loading && (
        <p className="text-sm text-text-secondary">Carregando frequencia...</p>
      )}

      {erro && (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-error">{erro}</p>
        </GlassCard>
      )}

      {!loading && !erro && linhas.length === 0 && (
        <GlassCard className="p-6 text-center space-y-2">
          <CalendarClock size={28} className="mx-auto text-text-secondary" />
          <p className="text-text-primary font-medium">
            Nenhum registro de frequencia no periodo
          </p>
          <p className="text-sm text-text-secondary">
            Ajuste os filtros ou verifique se ha aulas e reservas no Box
            Presencial neste intervalo.
          </p>
        </GlassCard>
      )}

      {/* Lista */}
      {!loading && !erro && linhas.length > 0 && (
        <div className="space-y-2">
          {linhas.map((l) => {
            const badge = STATUS_LABEL[l.status]
            return (
              <GlassCard
                key={l.reserva_id}
                className="p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <User size={14} className="text-text-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {l.aluno_nome ?? 'Aluno'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatarDataBR(l.data)} — {formatarHora(l.hora_inicio)} a{' '}
                      {formatarHora(l.hora_fim)}
                    </p>
                  </div>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </GlassCard>
            )
          })}
        </div>
      )}

      {!loading && !erro && linhas.length > 0 && (
        <p className="text-xs text-text-secondary">
          {linhas.length} registro(s) no periodo — apenas aulas do seu Box.
        </p>
      )}
    </div>
  )
}
