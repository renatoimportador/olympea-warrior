import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BlocoViewer } from '@/components/treino/BlocoViewer'
import {
  listarProgramacoes,
  listarFasesByProg,
  listarSemanasByFase,
  listarDiasBySemana,
  listarTreinosByDia,
  listarBlocosByTreino,
  buscarResultadoDoDia
} from '@/lib/api'
import type { DiaTreino, Treino, BlocoTreino, Fase, Semana } from '@/data/types'
import { CalendarDays, ArrowRight, PlayCircle, Layers, Calendar } from 'lucide-react'
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

  // Carregar hierarquia do Supabase: Programacoes -> Fases -> Semanas -> Dias
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const progs = await listarProgramacoes()
        const prog = progs.find(p => p.ativa) || progs[0]
        if (!prog) { setLoading(false); return }

        const fases = await listarFasesByProg(prog.id)
        const faseAtiva = fases.find(f => f.ativa) || fases[0]
        if (!faseAtiva) { setLoading(false); return }
        setFase(faseAtiva)

        const semanas = await listarSemanasByFase(faseAtiva.id)
        const semanaAtiva = semanas.find(s => s.ativa) || semanas[0]
        if (!semanaAtiva) { setLoading(false); return }
        setSemana(semanaAtiva)

        const diasDaSemana = await listarDiasBySemana(semanaAtiva.id)
        setDias(diasDaSemana)

        // Selecionar dia atual (hoje) ou o primeiro
        const hoje = new Date()
        const semanaNomes = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
        const diaHoje = semanaNomes[hoje.getDay()]
        const diaAtual = diasDaSemana.find(d => d.dia_semana === diaHoje) || diasDaSemana[0]

        if (diaAtual) {
          setDiaAtivo(diaAtual.id)
        }
      } catch (e) {
        console.error('Erro ao carregar treino do dia:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  // Quando o dia ativo muda, buscar treino real do Supabase
  useEffect(() => {
    if (!diaAtivo) return
    async function loadTreino() {
      try {
        const ts = await listarTreinosByDia(diaAtivo)
        const t = ts[0] || null
        setTreino(t)


if (t && user?.id) {
  const resultado = await buscarResultadoDoDia(user.id, t.id)
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
  }, [diaAtivo])

  const nomes = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sab', DOM: 'Dom' }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-text-secondary">Carregando treino...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header com hierarquia */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mb-1">
          <Layers size={12} className="text-accent" />
          <span>{fase?.nome || 'Fase'}</span>
          <span>/</span>
          <Calendar size={12} />
          <span>{semana?.nome || 'Semana'}</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary">{treino?.titulo || 'Treino do Dia'}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="accent">CrossFit OLYMPEA</Badge>
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
      {treino && blocos.length > 0 ? (
        <>
          <BlocoViewer blocos={blocos} wod={undefined} />

          {/* CTA Registrar Resultado */}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={() => navigate('/aluno/resultado', { state: { treinoId: treino.id, tituloTreino: treino.titulo } })}>
              <PlayCircle size={18} className="mr-2" />
              Registrar Resultado
            </Button>
            <Button variant="secondary" onClick={() => navigate('/aluno/historico')}>
              <ArrowRight size={18} />
            </Button>
          </div>
        </>
      ) : (
        <GlassCard className="p-8 text-center">
          <CalendarDays size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">
            {treino ? 'Nenhum bloco cadastrado para este treino.' : 'Nenhum treino cadastrado para este dia.'}
          </p>
        </GlassCard>
      )}
    </div>
  )
}
