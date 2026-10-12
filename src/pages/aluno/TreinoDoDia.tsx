import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BlocoViewer } from '@/components/treino/BlocoViewer'
import {
  listarProgramacoes,
  listarFasesByProg,
  listarDiasBySemana,
  listarTreinosByDia,
  listarBlocosByTreino,
  buscarResultadoDoDia,
  getAlunoByUsuarioId,
  getSemanaVigentePorData,
  dataHojeFusoBR,
} from '@/lib/api'
import { useProgramacaoAtiva } from '@/hooks/useProgramacaoAtiva'
import { encontrarFallbackPlanilha } from '@/lib/programacao'
import type { DiaTreino, Treino, BlocoTreino, Fase, Semana, Programacao } from '@/data/types'
import { CalendarDays, History, PlayCircle, Layers, Calendar, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function TreinoDoDia() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [fase, setFase] = useState<Fase | null>(null)
  const [semana, setSemana] = useState<Semana | null>(null)
  const [dias, setDias] = useState<DiaTreino[]>([])
  const [diaAtivo, setDiaAtivo] = useState<string>('')
  const [treino, setTreino] = useState<Treino | null>(null)
  const [resultadoJaSalvo, setResultadoJaSalvo] = useState(false)
  const [blocos, setBlocos] = useState<BlocoTreino[]>([])
  const [loading, setLoading] = useState(true)

  const [alunoId, setAlunoId] = useState<string | undefined>(undefined)
  const [programacaoFallback, setProgramacaoFallback] = useState<Programacao | null>(null)
  const {
    programacao,
    precisaSelecionar,
    loading: loadingProgramacao,
    erro: erroProgramacao,
  } = useProgramacaoAtiva(alunoId, programacaoFallback)

  // Fuso America/Sao_Paulo: toISOString() (UTC) virava o dia as 21:00 locais
  // e quebrava a resolucao da semana vigente no WOD.
  const hojeStr = dataHojeFusoBR()
  const semanaNomes = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

  // Resolve aluno e fallback de programacao (primeira ativa na vigencia)
  useEffect(() => {
    async function loadAluno() {
      if (!user?.id) return
      const aluno = await getAlunoByUsuarioId(user.id)
      if (aluno) setAlunoId(aluno.id)
    }
    loadAluno()
  }, [user?.id])

  // Fallback legado: primeira programacao PLANILHA ativa na vigencia
  // (compatibilidade apenas para alunos sem nenhuma inscricao)
  useEffect(() => {
    async function loadFallback() {
      const progs = await listarProgramacoes()
      setProgramacaoFallback(encontrarFallbackPlanilha(progs, hojeStr))
    }
    loadFallback()
  }, [hojeStr])

  // Carregar hierarquia da programacao selecionada
  useEffect(() => {
    // Reseta estado da programacao anterior para nao exibir dados obsoletos na troca
    setFase(null)
    setSemana(null)
    setDias([])
    setDiaAtivo('')
    setTreino(null)
    setBlocos([])
    setResultadoJaSalvo(false)

    async function load() {
      setLoading(true)
      try {
        const progSelecionada = programacao
        if (!progSelecionada) { setLoading(false); return }

        const fases = await listarFasesByProg(progSelecionada.id)
        const faseAtiva = fases.find(f => f.ativa) || fases[0]
        if (!faseAtiva) { setLoading(false); return }
        setFase(faseAtiva)

        // Regra definitiva: somente a semana vigente (intervalo de datas que
        // contem hoje, no fuso America/Sao_Paulo). Domingo ate 23h59 exibe a
        // semana corrente; a partir de segunda 00h00 exige a nova semana. Se
        // o coach ainda nao cadastrou/ativou a nova semana, os estados
        // permanecem vazios e a interface exibe "Nenhum treino programado
        // para esta semana" — sem reutilizar a semana anterior.
        const semanaVigente = await getSemanaVigentePorData(faseAtiva.id, hojeStr)
        if (!semanaVigente) { setLoading(false); return }
        setSemana(semanaVigente)

        const diasDaSemana = await listarDiasBySemana(semanaVigente.id)
        setDias(diasDaSemana)

        // Dia da semana derivado da data no fuso America/Sao_Paulo
        const diaHoje = semanaNomes[new Date(`${hojeStr}T12:00:00Z`).getUTCDay()]
        const diaAtual = diasDaSemana.find(d => d.dia_semana === diaHoje)

        if (diaAtual) {
          setDiaAtivo(diaAtual.id)
        } else if (diasDaSemana.length > 0) {
          // A semana vigente nao tem o dia de hoje cadastrado (ex.: domingo
          // ausente da grade): seleciona o ultimo dia disponivel da PROPRIA
          // semana para exibir o treino mais recente e manter a navegacao.
          setDiaAtivo(diasDaSemana[diasDaSemana.length - 1].id)
        }
      } catch (e) {
        console.error('Erro ao carregar treino do dia:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [programacao?.id, hojeStr])

  // Quando o dia ativo muda, buscar treino real do Supabase
  useEffect(() => {
    if (!diaAtivo) return
    async function loadTreino() {
      try {
        const ts = await listarTreinosByDia(diaAtivo)
        const t = ts[0] || null
        setTreino(t)


if (t && user?.id) {
  const aluno = await getAlunoByUsuarioId(user.id)
  if (!aluno) return
const resultado = await buscarResultadoDoDia(aluno.id, t.id)
  setResultadoJaSalvo(!!resultado)
} else {
  setResultadoJaSalvo(false)
}
        if (t) {
          const bs = await listarBlocosByTreino(t.id)
          setBlocos(bs)
        } else {
          setBlocos([])
        }
      } catch (e) {
        console.error('Erro ao carregar treino/blocos:', e)
      }
    }
    loadTreino()
  }, [diaAtivo, user?.id])

  const nomes = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sab', DOM: 'Dom' }

  if (loading || loadingProgramacao) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-text-secondary">Carregando treino...</p>
      </div>
    )
  }

  if (erroProgramacao) {
    return (
      <div className="space-y-5 animate-fade-in p-4 text-center">
        <CalendarDays size={48} className="mx-auto text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">Não foi possível carregar suas programações</h2>
        <p className="text-sm text-text-secondary">
          Tente novamente em alguns instantes. Se o problema persistir, contate o suporte.
        </p>
      </div>
    )
  }

  if (!programacao) {
    return (
      <div className="space-y-5 animate-fade-in p-4 text-center">
        <CalendarDays size={48} className="mx-auto text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">Nenhuma programação disponível</h2>
        <p className="text-sm text-text-secondary">
          Você não está inscrito em nenhuma programação ativa no momento.
        </p>
        {precisaSelecionar && (
          <Button onClick={() => navigate('/aluno/seletor-programacao')}>
            Selecionar programação
          </Button>
        )}
      </div>
    )
  }

  // Semana vigente inexistente (ex.: segunda-feira sem a nova semana ainda
  // cadastrada/ativada pelo coach) — nao reutiliza a semana anterior.
  if (!semana || dias.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in p-4 text-center">
        <CalendarDays size={48} className="mx-auto text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">Nenhum treino programado para esta semana</h2>
        <p className="text-sm text-text-secondary">
          Assim que a nova semana for cadastrada, os treinos aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header com hierarquia */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-1">
            <Layers size={12} className="text-accent" />
            <span>{fase?.nome || 'Fase'}</span>
            <span>/</span>
            <Calendar size={12} />
            <span>{semana?.nome || 'Semana'}</span>
          </div>

          {precisaSelecionar && (
            <button
              onClick={() => navigate('/aluno/seletor-programacao')}
              className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 transition-colors"
            >
              Trocar
              <ChevronDown size={12} />
            </button>
          )}
        </div>

        <h1 className="text-xl font-bold text-text-primary">{treino?.titulo || 'Treino do Dia'}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="accent">{programacao?.modalidade === 'BOX_PRESENCIAL' ? 'Box Presencial' : 'Planilha Olympea'}</Badge>
          <Badge>{fase?.nome || 'Programacao'}</Badge>
        </div>
      </div>

      {/* Dias da semana */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {dias.map((d) => (
            <button
              key={d.id}
              onClick={() => setDiaAtivo(d.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                diaAtivo === d.id
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'bg-white/[0.02] text-text-secondary border border-white/[0.03] hover:text-text-primary'
              }`}
            >
              {(nomes as any)[d.dia_semana] || d.dia_semana}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Blocos reais do Supabase */}
      {treino && blocos.length > 0 && (
        
          <BlocoViewer blocos={blocos} wod={undefined} />
)}
          {/* CTA Registrar Resultado */}

          <div className="flex gap-3 pt-2">
  {!resultadoJaSalvo && (
    <Button className="flex-1" onClick={() => navigate('/aluno/resultado', { state: { treinoId: treino!.id } })}>
      <PlayCircle size={18} className="mr-2" />
      Registrar Resultado
    </Button>
  )}
  <Button
  variant="secondary"
  onClick={() => navigate('/aluno/historico')}
  className="flex items-center gap-2 px-4 whitespace-nowrap"
>
  <History size={18} />
  <span>Meus resultados</span>
</Button>
</div>
          
        
      
        <GlassCard className="p-8 text-center">
          <CalendarDays size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">
            {treino ? 'Nenhum bloco cadastrado para este treino.' : 'Nenhum treino programado para esta data.'}
          </p>
        </GlassCard>
      
    </div>
  )
}
