import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  listarProgramacoes,
  listarFasesByProg,
  listarSemanasByFase,
  listarDiasBySemana,
  getAlunoByUsuarioId,
  dataHojeFusoBR,
} from '@/lib/api'
import { useProgramacaoAtiva } from '@/hooks/useProgramacaoAtiva'
import { encontrarFallbackPlanilha } from '@/lib/programacao'
import { useAuth } from '@/context/AuthContext'
import type { Fase, Semana, DiaTreino, Programacao } from '@/data/types'
import { Layers, Calendar, ChevronRight, ChevronDown } from 'lucide-react'

export function Programacao() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [programacaoFallback, setProgramacaoFallback] = useState<Programacao | null>(null)
  const [alunoId, setAlunoId] = useState<string | undefined>(undefined)

  const {
    programacao,
    precisaSelecionar,
    loading: loadingProgramacao,
    erro: erroProgramacao,
  } = useProgramacaoAtiva(alunoId, programacaoFallback)

  const [fases, setFases] = useState<Fase[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [dias, setDias] = useState<DiaTreino[]>([])

  const [faseAtiva, setFaseAtiva] = useState<string>('')
  const [semanaAtiva, setSemanaAtiva] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Resolve o aluno logado para buscar suas inscricoes
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
      // Fuso America/Sao_Paulo (toISOString/UTC virava o dia as 21:00 locais)
      const hojeStr = dataHojeFusoBR()
      const progs = await listarProgramacoes()
      setProgramacaoFallback(encontrarFallbackPlanilha(progs, hojeStr))
    }
    loadFallback()
  }, [])

  // Carrega hierarquia real do Supabase
  useEffect(() => {
    // Reseta estado da programacao anterior para nao exibir dados obsoletos na troca
    setFases([])
    setSemanas([])
    setDias([])
    setFaseAtiva('')
    setSemanaAtiva('')

    async function load() {
      setLoading(true)
      try {
        const prog = programacao
        if (!prog) { setLoading(false); return }

        const f = await listarFasesByProg(prog.id)
        const fasesAtivas = f.filter(fa => fa.ativa)
        setFases(fasesAtivas)

        if (fasesAtivas.length > 0) {
          const primeira = fasesAtivas[0]
          setFaseAtiva(primeira.id)
          const s = await listarSemanasByFase(primeira.id)
          const sAtivas = s.filter(s => s.ativa)
          setSemanas(sAtivas)

          if (sAtivas.length > 0) {
            const ps = sAtivas[0]
            setSemanaAtiva(ps.id)
            const d = await listarDiasBySemana(ps.id)
            setDias(d)
          }
        }
      } catch (e) {
        console.error('Erro ao carregar programacao:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [programacao?.id])

  // Seleção de fase recarrega semanas
  useEffect(() => {
    async function load() {
      if (!faseAtiva) return
      try {
        const s = await listarSemanasByFase(faseAtiva)
        const sAtivas = s.filter(s => s.ativa)
        setSemanas(sAtivas)
        setSemanaAtiva(sAtivas[0]?.id || '')
      } catch (e) {
        console.error('Erro ao carregar semanas:', e)
      }
    }
    load()
  }, [faseAtiva])

  // Seleção de semana recarrega dias
  useEffect(() => {
    async function load() {
      if (!semanaAtiva) return
      try {
        const d = await listarDiasBySemana(semanaAtiva)
        setDias(d)
      } catch (e) {
        console.error('Erro ao carregar dias:', e)
      }
    }
    load()
  }, [semanaAtiva])

  const nomes = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sab', DOM: 'Dom' }

  if (loading || loadingProgramacao) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-text-secondary">Carregando programacao...</p>
      </div>
    )
  }

  if (erroProgramacao) {
    return (
      <div className="space-y-5 animate-fade-in p-4 text-center">
        <Calendar size={48} className="mx-auto text-text-secondary" />
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
        <Calendar size={48} className="mx-auto text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">Nenhuma programacao disponivel</h2>
        <p className="text-sm text-text-secondary">
          Voce nao esta inscrito em nenhuma programacao ativa no momento.
        </p>
        {precisaSelecionar && (
          <button
            onClick={() => navigate('/aluno/seletor-programacao')}
            className="text-accent hover:text-accent/80 transition-colors"
          >
            Selecionar programacao
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Programacao</h1>
          {precisaSelecionar && (
            <button
              onClick={() => navigate('/aluno/seletor-programacao')}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Trocar
              <ChevronDown size={14} />
            </button>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          {programacao?.modalidade === 'BOX_PRESENCIAL' ? 'Box Presencial' : 'Planilha Olympea'}
          {programacao?.nome ? ` — ${programacao.nome}` : ''}
        </p>
      </div>

      {/* Fases */}
      {fases.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Layers size={14} className="text-accent" />
            Fases
          </h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {fases.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFaseAtiva(f.id) }}
                className={`flex-shrink-0 p-4 rounded-2xl border transition-all text-left space-y-1 min-w-[140px] ${
                  faseAtiva === f.id
                    ? 'bg-accent/5 border-accent/20'
                    : 'bg-white/[0.02] border-white/[0.05]'
                }`}
              >
                <p className="text-sm font-semibold text-text-primary">{f.nome}</p>
                <p className="text-[10px] text-text-secondary">{f.duracao_semanas || 0} semanas</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Semanas */}
      {semanas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Calendar size={14} className="text-accent" />
            Semanas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {semanas.map((s) => (
              <button
                key={s.id}
                onClick={() => setSemanaAtiva(s.id)}
                className={`p-3 rounded-xl border transition-all text-left space-y-1 ${
                  semanaAtiva === s.id
                    ? 'bg-accent/5 border-accent/20'
                    : 'bg-white/[0.02] border-white/[0.05]'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{s.nome}</p>
                <p className="text-[10px] text-text-secondary">{s.tipo}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dias */}
      {semanaAtiva && dias.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-text-secondary">Dias de Treino</h2>
          <div className="space-y-2">
            {dias.map((d) => (
              <GlassCard
                key={d.id}
                className="p-4 flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate('/aluno/treino')}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{(nomes as any)[d.dia_semana] || d.dia_semana}</p>
                  <p className="text-xs text-text-secondary">{d.data_especifica || d.dia_semana}</p>
                </div>
                <Badge variant="success">Liberado</Badge>
                <ChevronRight size={16} className="text-text-secondary group-hover:text-accent transition-colors" />
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
