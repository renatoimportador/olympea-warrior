import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProgramacao } from '@/context/ProgramacaoContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  getAlunoByUsuarioId,
  getPRsByAluno,
  getFrequenciasByAluno,
  listarResultadosByAluno,
  getProgramacoesByAluno,
  listarDiasBySemana,
  getTreinoByDia,
  listarResultadosByTreino,
  listarAlunos,
  getTreinoDoDia,
  listarTreinosByDia,
} from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Aluno, PersonalRecord, Frequencia, Resultado, Programacao, DiaTreino, Treino } from '@/data/types'
import {
  Zap, TrendingUp, CalendarCheck, Dumbbell, Flame, Trophy,
  ChevronRight, Clock, ArrowUpRight, Users,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function formatarResultado(r: any, tipoWod?: string): string {
  if (!r) return '-'
  if (tipoWod === 'FOR_TIME' && r.tempo) return r.tempo
  if (tipoWod === 'AMRAP') return `${r.rounds || 0} rounds + ${r.repeticoes || 0} reps`
  if (r.tempo) return r.tempo
  if (r.carga) return `${r.carga} kg`
  if (r.rounds != null) return `${r.rounds} rounds${r.repeticoes ? ` + ${r.repeticoes} reps` : ''}`
  return '-'
}

export function DashboardAluno() {
  const { user } = useAuth()
  const { programacaoAtiva } = useProgramacao()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [prs, setPRs] = useState<PersonalRecord[]>([])
  const [frequencias, setFrequencias] = useState<Frequencia[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [diasTreino, setDiasTreino] = useState<DiaTreino[]>([])
  const [treinoHoje, setTreinoHoje] = useState<Treino | null>(null)
  const [proximoTreino, setProximoTreino] = useState<{ dia: string; treino: Treino } | null>(null)
  const [rankingSemana, setRankingSemana] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [meusCampeonatos, setMeusCampeonatos] = useState<any[]>([])
  const [campeonatos, setCampeonatos] = useState<any[]>([])
  const [participantesPorCamp, setParticipantesPorCamp] = useState<Record<string, any[]>>({})

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      try {
        const a = await getAlunoByUsuarioId(user.id)
        if (!a) { setLoading(false); return }
        setAluno(a)

        const [p, f, r, progs] = await Promise.all([
          getPRsByAluno(a.id),
          getFrequenciasByAluno(a.id),
          listarResultadosByAluno(a.id),
          getProgramacoesByAluno(a.id),
        ])
        setPRs(p)
        setFrequencias(f)
        setResultados(r)
        setProgramacoes(progs)

        // Campeonatos + inscrições
        const [inscRes, campRes] = await Promise.all([
          supabase
            .from('participacoes_campeonato')
            .select('*, campeonatos(*)')
            .eq('aluno_id', a.id),
          supabase
            .from('campeonatos')
            .select('*')
            .eq('ativo', true)
            .order('data_inicio'),
        ])

        setMeusCampeonatos(inscRes.data || [])
        const listaCamp = campRes.data || []
        setCampeonatos(listaCamp)

        // Buscar participantes de cada campeonato
        if (listaCamp.length > 0) {
          const partMap: Record<string, any[]> = {}
          for (const camp of listaCamp) {
            const { data: parts } = await supabase
              .from('participacoes_campeonato')
              .select('*, alunos(id, usuario_id, usuarios(nome))')
              .eq('campeonato_id', camp.id)
            partMap[camp.id] = (parts || []).map((p: any) => ({
              nome: p.alunos?.usuarios?.nome || 'Atleta',
              aluno_id: p.aluno_id,
            }))
          }
          setParticipantesPorCamp(partMap)
        }

        // Ranking do treino de hoje
        const treino = await getTreinoDoDia()
        setTreinoHoje(treino as Treino | null)

        if (treino) {
          const resHoje = await listarResultadosByTreino(treino.id)
          const todosAlunos = await listarAlunos()

          const ranking = todosAlunos
            .map((al) => {
              const resAluno = resHoje.filter((rr: any) => rr.aluno_id === al.id)
              const resultado = resAluno[0] || null
              return {
                id: al.id,
                nome: al.usuario?.nome || 'Sem nome',
                resultado,
              }
            })
            .filter((x) => x.resultado)
            .sort((aa, bb) => {
              const ra = aa.resultado
              const rb = bb.resultado
              if (!ra) return 1
              if (!rb) return -1

              if ((treino as any).tipo_wod === 'FOR_TIME') {
                return (ra.tempo || '').localeCompare(rb.tempo || '')
              }
              if ((treino as any).tipo_wod === 'AMRAP') {
                if ((rb.rounds || 0) !== (ra.rounds || 0))
                  return (rb.rounds || 0) - (ra.rounds || 0)
                return (rb.repeticoes || 0) - (ra.repeticoes || 0)
              }
              return (rb.carga || 0) - (ra.carga || 0)
            })
            .map((x, i) => ({ ...x, posicao: i + 1 }))

          setRankingSemana(ranking)
        }

        // Buscar próximo treino
        if (programacaoAtiva?.id) {
          const { listarFasesByProg } = await import('@/lib/api')
          const fases = await listarFasesByProg(programacaoAtiva.id)
          if (fases.length > 0) {
            const { listarSemanasByFase } = await import('@/lib/api')
            const semanas = await listarSemanasByFase(fases[0].id)
            if (semanas.length > 0) {
              const dias = await listarDiasBySemana(semanas[0].id)
              setDiasTreino(dias)

              // Encontrar próximo dia com treino
              const hoje = new Date()
              const diaSemanaIdx = hoje.getDay() // 0=Dom
              const nomesOrdem = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

              // Buscar a partir de amanhã, ciclicamente
              for (let offset = 1; offset <= 7; offset++) {
                const idx = (diaSemanaIdx + offset) % 7
                const nomeDia = nomesOrdem[idx]
                const dia = dias.find((d) => d.dia_semana === nomeDia)
                if (dia) {
                  const treinos = await listarTreinosByDia(dia.id)
                  if (treinos.length > 0) {
                    const nomesLegivel: Record<string, string> = {
                      DOM: 'Domingo', SEG: 'Segunda', TER: 'Terça',
                      QUA: 'Quarta', QUI: 'Quinta', SEX: 'Sexta', SAB: 'Sábado'
                    }
                    setProximoTreino({
                      dia: nomesLegivel[nomeDia] || nomeDia,
                      treino: treinos[0]
                    })
                    break
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro ao carregar dashboard aluno:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, programacaoAtiva])

  // Frequência do mês: contar dias únicos com resultado no mês atual
  const agora = new Date()
  const mesAtual = agora.getMonth()
  const anoAtual = agora.getFullYear()

  const freqMes = useMemo(() => {
    const diasUnicos = new Set(
      resultados
        .filter((r) => {
          const d = new Date(r.data)
          return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
        })
        .map((r) => new Date(r.data).toDateString())
    )
    return diasUnicos.size
  }, [resultados, mesAtual, anoAtual])

  const treinosTotal = resultados.length
  const pesoAtual = aluno?.peso_atual ?? 0

  const semanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const frequenciaData = semanaNomes.map((nome) => ({
    name: nome,
    freq: resultados.filter((r) => {
      const d = new Date(r.data)
      return semanaNomes[d.getDay()] === nome
    }).length,
  }))

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-text-primary">Ola, {user?.nome?.split(' ')[0] || 'Aluno'}!</h1>
          <p className="text-text-secondary">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-xl">
          {user?.nome?.charAt(0) || 'A'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Ola, {user?.nome?.split(' ')[0] || 'Aluno'}!</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="accent">{aluno?.categoria || 'BEGINNER'}</Badge>
            <span className="text-xs text-text-secondary">{programacaoAtiva?.nome || ''}</span>
          </div>
        </div>
      </div>

      {/* Metricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <CalendarCheck size={16} className="text-success" />
            <ArrowUpRight size={14} className="text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{freqMes}</p>
            <p className="text-xs text-text-secondary">Frequencia mes</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Dumbbell size={16} className="text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{treinosTotal}</p>
            <p className="text-xs text-text-secondary">Treinos realizados</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Zap size={16} className="text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{prs.length}</p>
            <p className="text-xs text-text-secondary">PRs</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <TrendingUp size={16} className="text-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{pesoAtual}kg</p>
            <p className="text-xs text-text-secondary">Peso atual</p>
          </div>
        </GlassCard>
      </div>

      {/* Proximo Treino */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-accent" />
          <h2 className="font-semibold text-text-primary">Proximo Treino</h2>
        </div>

        {proximoTreino ? (
          <div>
            <p className="text-sm text-text-primary font-medium">
              {proximoTreino.treino.titulo || 'Treino'}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {proximoTreino.dia}
              {(proximoTreino.treino as any).tipo_wod && (
                <> &bull; {(proximoTreino.treino as any).tipo_wod}</>
              )}
            </p>
            <Link
              to="/aluno/treino"
              className="inline-flex items-center gap-1 text-xs text-accent mt-3 hover:underline"
            >
              Ver detalhes <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Nenhum proximo treino programado.
          </p>
        )}
      </GlassCard>

      {/* Ranking da Semana */}
      <GlassCard className="p-5 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-warning" />
          Ranking da Semana
        </h2>

        {rankingSemana.length === 0 ? (
          <p className="text-sm text-text-secondary py-4 text-center">
            Ainda nao ha resultados registrados para o treino de hoje.
          </p>
        ) : (
          rankingSemana.slice(0, 5).map((r, index) => (
            <div
              key={r.id}
              className={`flex items-center justify-between py-2 border-b border-white/5 last:border-0 ${
                r.id === aluno?.id ? 'bg-accent/5 rounded-lg px-2 -mx-2' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-5">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>
                <p className="font-medium text-text-primary text-sm">
                  {r.nome}
                </p>
                {r.id === aluno?.id && (
                  <Badge variant="accent">Voce</Badge>
                )}
              </div>
              <p className="text-sm font-bold text-accent">
                {formatarResultado(r.resultado, (treinoHoje as any)?.tipo_wod)}
              </p>
            </div>
          ))
        )}
      </GlassCard>

      {/* Grafico de Frequencia */}
      <GlassCard className="p-5 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <CalendarCheck size={16} className="text-accent" />
          Treinos por dia da semana
        </h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={frequenciaData}>
              <defs>
                <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131C25',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="freq" stroke="#00E5FF" strokeWidth={2} fill="url(#freqGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* PRs Recentes */}
      <GlassCard className="p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-warning" />
          PRs Recentes
        </h2>
        {prs.length > 0 ? (
          <div className="space-y-2">
            {prs.slice(0, 3).map((pr) => (
              <div key={pr.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Zap size={14} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{pr.exercicio_nome || 'Exercicio'}</p>
                    <p className="text-xs text-text-secondary">{new Date(pr.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-accent">{pr.valor}{pr.unidade}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Nenhum PR registrado ainda.</p>
        )}
      </GlassCard>

      {/* Campeonatos */}
      <GlassCard className="p-5 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-warning" />
          Campeonatos
        </h2>

        <div className="space-y-3">
          {campeonatos.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">
              Nenhum campeonato disponivel no momento.
            </p>
          ) : (
            campeonatos.map((camp) => {
              const inscrito = meusCampeonatos.some((i) => i.campeonato_id === camp.id)
              const participantes = participantesPorCamp[camp.id] || []

              return (
                <Link
                  key={camp.id}
                  to="/aluno/campeonatos"
                  className="block rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{camp.nome}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {camp.data_inicio
                          ? new Date(camp.data_inicio).toLocaleDateString('pt-BR')
                          : ''}{' '}
                        {camp.local && `• ${camp.local}`}
                      </p>
                      <p className={`text-xs mt-1.5 ${inscrito ? 'text-success' : 'text-warning'}`}>
                        {inscrito ? 'Inscrito' : 'Disponivel'}
                      </p>
                    </div>
                    <Trophy size={24} className="text-warning opacity-60 flex-shrink-0" />
                  </div>

                  {participantes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-text-secondary flex items-center gap-1 mb-1.5">
                        <Users size={12} />
                        {participantes.length} inscrito{participantes.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {participantes.slice(0, 8).map((pt, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              pt.aluno_id === aluno?.id
                                ? 'bg-accent/15 text-accent'
                                : 'bg-white/[0.04] text-text-secondary'
                            }`}
                          >
                            {pt.aluno_id === aluno?.id ? 'Voce' : pt.nome}
                          </span>
                        ))}
                        {participantes.length > 8 && (
                          <span className="text-[10px] text-text-secondary">
                            +{participantes.length - 8}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              )
            })
          )}
        </div>
      </GlassCard>
    </div>
  )
}
