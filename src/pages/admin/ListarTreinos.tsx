import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  listarFasesByProg, listarSemanasByFase, listarDiasBySemana, listarTreinosByDia,
  excluirTreino, listarProgramacoes,
} from '@/lib/api'
import type { Treino, DiaTreino, Semana, Fase, Programacao } from '@/data/types'
import { Dumbbell, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface TreinoView {
  treino: Treino
  dia: DiaTreino
  semana: Semana
  fase: Fase
}

export function ListarTreinos() {
  const navigate = useNavigate()

  const [programacao, setProgramacao] = useState<Programacao | null>(null)
  const [fases, setFases] = useState<Fase[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [dias, setDias] = useState<DiaTreino[]>([])
  const [treinos, setTreinos] = useState<TreinoView[]>([])

  const [faseAtiva, setFaseAtiva] = useState<string>('')
  const [semanaAtiva, setSemanaAtiva] = useState<string>('')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const progs = await listarProgramacoes()
        const prog = progs.find(p => p.ativa) || progs[0]
        if (!prog) { setLoading(false); return }
        setProgramacao(prog)

        const f = await listarFasesByProg(prog.id)
        const fasesAtivas = f.filter(fa => fa.ativa)
        setFases(fasesAtivas)

        if (fasesAtivas.length > 0) {
          const primeiraFase = fasesAtivas[0]
          setFaseAtiva(primeiraFase.id)
          await loadSemanaDados(primeiraFase.id)
        }
      } catch (e) {
        console.error('Erro ao carregar treinos:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function loadSemanaDados(fId: string) {
    try {
      const s = await listarSemanasByFase(fId)
      const semanasAtivas = s.filter(sm => sm.ativa)
      setSemanas(semanasAtivas)

      if (semanasAtivas.length > 0) {
        const primeiraSemana = semanasAtivas[0]
        setSemanaAtiva(primeiraSemana.id)
        await loadDados(primeiraSemana.id)
      } else {
        setDias([])
        setTreinos([])
      }
    } catch (e) {
      console.error('Erro ao carregar semanas:', e)
    }
  }

  async function loadDados(semId: string) {
    setLoading(true)
    try {
      const d = await listarDiasBySemana(semId)
      setDias(d)

      const views: TreinoView[] = []
      for (const dia of d) {
        const ts = await listarTreinosByDia(dia.id)
        for (const t of ts) {
          const sem = semanas.find(s => s.id === dia.semana_id)
          const f = fases.find(fa => fa.id === sem?.fase_id)
          if (sem && f) {
            views.push({ treino: t, dia, semana: sem, fase: f })
          }
        }
      }
      setTreinos(views)
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (faseAtiva) {
      loadSemanaDados(faseAtiva)
    }
  }, [faseAtiva])

  useEffect(() => {
    if (semanaAtiva) {
      loadDados(semanaAtiva)
    }
  }, [semanaAtiva])

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este treino?')) return
    try {
      await excluirTreino(id)
      toast.success('Treino excluido!')
      if (semanaAtiva) await loadDados(semanaAtiva)
    } catch (e) {
      toast.error('Erro ao excluir treino')
    }
  }

  function semanaAnterior() {
    const idx = semanas.findIndex(s => s.id === semanaAtiva)
    if (idx > 0) setSemanaAtiva(semanas[idx - 1].id)
  }

  function semanaProxima() {
    const idx = semanas.findIndex(s => s.id === semanaAtiva)
    if (idx < semanas.length - 1) setSemanaAtiva(semanas[idx + 1].id)
  }

  const nomes = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sab', DOM: 'Dom' }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Treinos</h1>
          <p className="text-sm text-text-secondary">{treinos.length} treinos cadastrados</p>
        </div>
        <Button onClick={() => navigate('/admin/treinos/novo')}>
          <Plus size={18} className="mr-2" />
          Novo Treino
        </Button>
      </div>

      {/* Filtro Fase */}
      <div className="flex items-center gap-3">
        <select
          value={faseAtiva}
          onChange={e => setFaseAtiva(e.target.value)}
          className="glass-input w-full sm:w-auto text-sm px-3 py-2"
        >
          {fases.map(f => (
            <option key={f.id} value={f.id}>{f.nome} (Ordem {f.ordem})</option>
          ))}
        </select>
      </div>

      {/* Navegação Semana */}
      <GlassCard className="p-3">
        <div className="flex items-center justify-between">
          <button onClick={semanaAnterior} disabled={semanas.findIndex(s => s.id === semanaAtiva) <= 0} className="p-2 rounded-lg hover:bg-white/[0.03] disabled:opacity-30">
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              {semanas.find(s => s.id === semanaAtiva)?.nome || 'Semana'}
            </p>
          </div>
          <button onClick={semanaProxima} disabled={semanas.findIndex(s => s.id === semanaAtiva) >= semanas.length - 1} className="p-2 rounded-lg hover:bg-white/[0.03] disabled:opacity-30">
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
        </div>
      </GlassCard>

      {/* Lista de Treinos */}
      {loading ? (
        <p className="text-sm text-text-secondary">Carregando...</p>
      ) : treinos.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Dumbbell size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">Nenhum treino cadastrado para esta semana.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {treinos.map(({ treino, dia, semana, fase }) => (
            <GlassCard key={treino.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Dumbbell size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{treino.titulo}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                      <span>{(nomes as any)[dia.dia_semana] || dia.dia_semana}</span>
                      <span>/</span>
                      <span>{semana.nome}</span>
                      <span>/</span>
                      <span>{fase.nome}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate('/admin/treinos/novo', { state: { treinoId: treino.id } })}
                    className="p-1.5 rounded-lg hover:bg-white/[0.03]"
                  >
                    <Edit2 size={14} className="text-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDelete(treino.id)}
                    className="p-1.5 rounded-lg hover:bg-error/5"
                  >
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="accent">WOD</Badge>
                {treino.ativo ? <Badge variant="success">Ativo</Badge> : <Badge variant="default">Inativo</Badge>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
