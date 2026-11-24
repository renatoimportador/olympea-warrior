import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Flame, PlayCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BlocoViewer } from '@/components/treino/BlocoViewer'
import { useAuth } from '@/context/AuthContext'
import { useBox } from '@/context/BoxContext'
import {
  buscarResultadoDoDia,
  dataHojeFusoBR,
  getAlunoByUsuarioId,
  getSemanaVigentePorData,
  listarBlocosByTreino,
  listarDiasBySemana,
  listarFasesByProg,
  listarProgramacoes,
  listarTreinosByDia,
} from '@/lib/api'
import type { BlocoTreino, DiaTreino, Fase, Programacao, Semana, Treino } from '@/data/types'

const DIAS = [
  { id: 'SEG', label: 'Segunda' },
  { id: 'TER', label: 'Terça' },
  { id: 'QUA', label: 'Quarta' },
  { id: 'QUI', label: 'Quinta' },
  { id: 'SEX', label: 'Sexta' },
  { id: 'SAB', label: 'Sábado' },
  { id: 'DOM', label: 'Domingo' },
] as const

type DiaHibrido = (typeof DIAS)[number]['id']

interface TreinoHibridoCarregado {
  treino: Treino | null
  blocos: BlocoTreino[]
  resultadoJaSalvo: boolean
}

export function TreinoHibrido() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { box } = useBox()
  const hoje = dataHojeFusoBR()
  const diaDaSemana = new Date(`${hoje}T12:00:00Z`).getUTCDay()
  const diaDeHoje = DIAS[diaDaSemana === 0 ? 6 : diaDaSemana - 1].id

  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [programacaoId, setProgramacaoId] = useState('')
  const [fase, setFase] = useState<Fase | null>(null)
  const [semana, setSemana] = useState<Semana | null>(null)
  const [dias, setDias] = useState<DiaTreino[]>([])
  const [diaSelecionado, setDiaSelecionado] = useState<DiaHibrido>(diaDeHoje)
  const [treinoAtual, setTreinoAtual] = useState<TreinoHibridoCarregado>({ treino: null, blocos: [], resultadoJaSalvo: false })
  const [alunoId, setAlunoId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingTreino, setLoadingTreino] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false

    async function carregarProgramacoes() {
      if (!user?.id) return
      setLoading(true)
      setErro('')
      try {
        const aluno = await getAlunoByUsuarioId(user.id)
        const todas = await listarProgramacoes()
        const hibridas = todas.filter((p) => (
          p.tipo === 'HIBRIDO' &&
          p.ativa &&
          p.box_id === box?.id &&
          p.data_inicio <= hoje &&
          (!p.data_fim || p.data_fim >= hoje)
        ))

        if (cancelado) return
        setAlunoId(aluno?.id || '')
        setProgramacoes(hibridas)
        if (hibridas.length === 1) {
          setProgramacaoId(hibridas[0].id)
        } else {
          setProgramacaoId('')
          setLoading(false)
        }
      } catch (e) {
        console.error('Erro ao carregar programações Híbridas:', e)
        if (!cancelado) {
          setErro('Não foi possível carregar a programação Híbrida.')
          setLoading(false)
        }
      }
    }

    carregarProgramacoes()
    return () => { cancelado = true }
  }, [user?.id, box?.id, hoje])

  useEffect(() => {
    let cancelado = false
    setFase(null)
    setSemana(null)
    setDias([])
    setTreinoAtual({ treino: null, blocos: [], resultadoJaSalvo: false })
    if (!programacaoId) return

    async function carregarSemana() {
      setLoading(true)
      setErro('')
      try {
        const fases = await listarFasesByProg(programacaoId)
        const faseAtiva = fases.find((f) => f.ativa) || fases[0]
        const semanaVigente = faseAtiva ? await getSemanaVigentePorData(faseAtiva.id, hoje) : null
        const diasDaSemana = semanaVigente ? await listarDiasBySemana(semanaVigente.id) : []

        if (cancelado) return
        setFase(faseAtiva || null)
        setSemana(semanaVigente)
        setDias(diasDaSemana)
      } catch (e) {
        console.error('Erro ao carregar semana Híbrida:', e)
        if (!cancelado) setErro('Não foi possível carregar a semana Híbrida.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    carregarSemana()
    return () => { cancelado = true }
  }, [programacaoId, hoje])

  useEffect(() => {
    let cancelado = false
    const dia = dias.find((d) => d.dia_semana === diaSelecionado)
    setTreinoAtual({ treino: null, blocos: [], resultadoJaSalvo: false })
    if (!dia) {
      setLoadingTreino(false)
      return
    }

    async function carregarTreino() {
      setLoadingTreino(true)
      try {
        const treinos = await listarTreinosByDia(dia!.id)
        const treino = treinos[0] || null
        const blocos = treino ? await listarBlocosByTreino(treino.id) : []
        const resultado = treino && alunoId ? await buscarResultadoDoDia(alunoId, treino.id) : null
        if (!cancelado) setTreinoAtual({ treino, blocos, resultadoJaSalvo: !!resultado })
      } catch (e) {
        console.error('Erro ao carregar treino Híbrido:', e)
        if (!cancelado) setErro('Não foi possível carregar o treino Híbrido.')
      } finally {
        if (!cancelado) setLoadingTreino(false)
      }
    }

    carregarTreino()
    return () => { cancelado = true }
  }, [dias, diaSelecionado, alunoId])

  const programacao = programacoes.find((p) => p.id === programacaoId)
  const diaAtual = dias.find((d) => d.dia_semana === diaSelecionado)
  const precisaSelecionar = programacoes.length > 1 && !programacaoId

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
          <Flame size={12} className="text-accent" />
          <span>{fase?.nome || 'Fase'}</span>
          {semana && <><span>/</span><span>{semana.nome}</span></>}
        </div>
        <h1 className="text-xl font-bold text-text-primary">{treinoAtual.treino?.titulo || 'Híbrido'}</h1>
        <Badge variant="accent">Híbrido</Badge>
      </div>

      {programacoes.length > 1 && (
        <GlassCard className="p-3">
          <label htmlFor="programacao-hibrida" className="text-xs font-medium text-text-primary block mb-2">
            Programação Híbrida
          </label>
          <select
            id="programacao-hibrida"
            className="glass-input w-full"
            value={programacaoId}
            onChange={(e) => setProgramacaoId(e.target.value)}
          >
            <option value="">Selecione uma programação</option>
            {programacoes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </GlassCard>
      )}

      {!precisaSelecionar && (
        <GlassCard className="p-3">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {DIAS.map((dia) => (
              <button
                key={dia.id}
                onClick={() => setDiaSelecionado(dia.id)}
                disabled={loading}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  diaSelecionado === dia.id
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'bg-white/[0.02] text-text-secondary border border-white/[0.03] hover:text-text-primary'
                }`}
              >
                {dia.label}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {(loading || loadingTreino) && <p className="text-sm text-text-secondary">Carregando treino Híbrido...</p>}

      {erro && (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-text-secondary">{erro}</p>
        </GlassCard>
      )}

      {!loading && !loadingTreino && !erro && precisaSelecionar && (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-text-secondary">Selecione uma programação Híbrida para visualizar os treinos.</p>
        </GlassCard>
      )}

      {!loading && !loadingTreino && !erro && programacoes.length === 0 && (
        <GlassCard className="p-8 text-center">
          <CalendarDays size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">Nenhuma programação Híbrida ativa no momento.</p>
        </GlassCard>
      )}

      {!loading && !loadingTreino && !erro && programacao && !fase && (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-text-secondary">Nenhuma fase ativa cadastrada para esta programação Híbrida.</p>
        </GlassCard>
      )}

      {!loading && !loadingTreino && !erro && programacao && !semana && fase && (
        <GlassCard className="p-8 text-center">
          <CalendarDays size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">Nenhuma semana Híbrida ativa para a data atual.</p>
        </GlassCard>
      )}

      {!loading && !loadingTreino && !erro && semana && programacao && (
        <>
          {!treinoAtual.treino ? (
            <GlassCard className="p-8 text-center">
              <CalendarDays size={32} className="mx-auto text-text-secondary mb-3" />
              <p className="text-sm text-text-secondary">Nenhum treino Híbrido programado para este dia</p>
              {!diaAtual && <p className="text-xs text-text-secondary mt-2">Este dia não está cadastrado na semana ativa.</p>}
            </GlassCard>
          ) : (
            <>
              {treinoAtual.blocos.length > 0 ? (
                <BlocoViewer key={treinoAtual.treino.id} blocos={treinoAtual.blocos} />
              ) : (
                <GlassCard className="p-8 text-center">
                  <p className="text-sm text-text-secondary">Nenhum bloco cadastrado para este treino.</p>
                </GlassCard>
              )}
              {!treinoAtual.resultadoJaSalvo && (
                <Button
                  className="w-full"
                  disabled={!alunoId}
                  onClick={() => navigate('/aluno/resultado', {
                    state: {
                      treinoId: treinoAtual.treino!.id,
                      tituloTreino: treinoAtual.treino!.titulo,
                    },
                  })}
                >
                  <PlayCircle size={18} className="mr-2" />
                  Registrar Resultado
                </Button>
              )}
            </>
          )}
        </>
      )}

      {!loading && !loadingTreino && !erro && programacao && !alunoId && (
        <p className="text-sm text-text-secondary">Perfil de aluno não encontrado para registrar resultados.</p>
      )}
    </div>
  )
}
