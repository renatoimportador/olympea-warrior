import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  listarProgramacoes,
  listarFasesByProg,
  listarSemanasByFase,
  listarDiasBySemana,
} from '@/lib/api'
import type { Fase, Semana, DiaTreino } from '@/data/types'
import { Layers, Calendar, ChevronRight } from 'lucide-react'

export function Programacao() {
  const navigate = useNavigate()

  const [fases, setFases] = useState<Fase[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [dias, setDias] = useState<DiaTreino[]>([])

  const [faseAtiva, setFaseAtiva] = useState<string>('')
  const [semanaAtiva, setSemanaAtiva] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Carrega hierarquia real do Supabase
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const progs = await listarProgramacoes()
        const prog = progs.find(p => p.ativa) || progs[0]
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
  }, [])

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

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-text-secondary">Carregando programacao...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Programacao</h1>
        <p className="text-sm text-text-secondary">CrossFit Olympea Warrior</p>
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
                  <p className="text-xs text-text-secondary">
  {d.data_especifica || d.dia_semana}
</p>
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
