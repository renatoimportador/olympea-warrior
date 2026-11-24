import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  listarFasesByProg,
  listarSemanasByFase,
  listarDiasBySemana,
  listarTreinosByDia,
  excluirTreino,
  listarProgramacoes,
  getSemanaById,
  getFaseById,
} from '@/lib/api'
import type { Treino, DiaTreino, Semana, Fase, Programacao } from '@/data/types'
import {
  Dumbbell,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TreinoView {
  treino: Treino
  dia: DiaTreino
  semana: Semana
  fase: Fase
}

export function ListarTreinos() {
  const navigate = useNavigate()

  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [programacao, setProgramacao] = useState<Programacao | null>(null)
  const [fases, setFases] = useState<Fase[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [dias, setDias] = useState<DiaTreino[]>([])
  const [treinos, setTreinos] = useState<TreinoView[]>([])

  const [faseAtiva, setFaseAtiva] = useState<string>('')
  const [semanaAtiva, setSemanaAtiva] = useState<string>('')

  const [loading, setLoading] = useState(true)

  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    async function carregar() {
      try {
        const progs = await listarProgramacoes()
        if (!mounted.current) return
        setProgramacoes(progs)
        if (progs.length === 1) setProgramacao(progs[0])
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar programações')
      } finally {
        if (mounted.current) setLoading(false)
      }
    }

    carregar()
  }, [])

  useEffect(() => {
    let cancelado = false
    setFases([])
    setFaseAtiva('')
    setSemanas([])
    setSemanaAtiva('')
    setDias([])
    setTreinos([])

    if (!programacao) return

    async function carregarFases(programacaoId: string) {
      setLoading(true)
      try {
        const fasesData = await listarFasesByProg(programacaoId)
        if (cancelado) return
        setFases(fasesData)
        setFaseAtiva(fasesData[0]?.id || '')
      } catch (error) {
        if (cancelado) return
        console.error(error)
        toast.error('Erro ao carregar fases')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    carregarFases(programacao.id)
    return () => { cancelado = true }
  }, [programacao?.id])

  useEffect(() => {
    let cancelado = false
    setSemanas([])
    setSemanaAtiva('')
    setDias([])
    setTreinos([])

    if (!faseAtiva) return

    async function carregarSemanas(faseId: string) {
      setLoading(true)
      try {
        const semanasData = await listarSemanasByFase(faseId)
        if (cancelado) return
        setSemanas(semanasData)
        setSemanaAtiva(semanasData[0]?.id || '')
      } catch (error) {
        if (cancelado) return
        console.error(error)
        toast.error('Erro ao carregar semanas')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    carregarSemanas(faseAtiva)
    return () => { cancelado = true }
  }, [faseAtiva])

  useEffect(() => {
    let cancelado = false
    setDias([])
    setTreinos([])

    if (!semanaAtiva) return

    async function carregarTreinos(semanaId: string) {
      setLoading(true)
      try {
        const diasData = await listarDiasBySemana(semanaId)
        const semanaAtual = await getSemanaById(semanaId)
        const faseAtual = semanaAtual?.fase_id
          ? await getFaseById(semanaAtual.fase_id)
          : null

        const views: TreinoView[] = []
        for (const dia of diasData) {
          const ts = await listarTreinosByDia(dia.id)
          for (const treino of ts) {
            views.push({
              treino,
              dia,
              semana: semanaAtual || { id: semanaId, nome: 'Semana' } as Semana,
              fase: faseAtual || { id: '', nome: 'Fase' } as Fase,
            })
          }
        }

        if (cancelado) return
        setDias(diasData)
        setTreinos(views)
      } catch (error) {
        if (cancelado) return
        console.error(error)
        toast.error('Erro ao carregar treinos')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    carregarTreinos(semanaAtiva)
    return () => { cancelado = true }
  }, [semanaAtiva])

  function handleProgramacaoChange(id: string) {
    if (!id) setLoading(false)
    setProgramacao(programacoes.find((p) => p.id === id) || null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este treino?')) return

    try {
      await excluirTreino(id)

      setTreinos((prev) =>
        prev.filter((item) => item.treino.id !== id)
      )

      toast.success('Treino excluído!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir treino')
    }
  }

  function semanaAnterior() {
    const idx = semanas.findIndex((s) => s.id === semanaAtiva)

    if (idx > 0) {
      setSemanaAtiva(semanas[idx - 1].id)
    }
  }

  function semanaProxima() {
    const idx = semanas.findIndex((s) => s.id === semanaAtiva)

    if (idx < semanas.length - 1) {
      setSemanaAtiva(semanas[idx + 1].id)
    }
  }

  const nomes = {
    SEG: 'Seg',
    TER: 'Ter',
    QUA: 'Qua',
    QUI: 'Qui',
    SEX: 'Sex',
    SAB: 'Sab',
    DOM: 'Dom',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Treinos</h1>
          <p className="text-sm text-text-secondary">
            {treinos.length} treinos cadastrados
          </p>
        </div>

        <Button onClick={() => navigate('/admin/treinos/novo')}>
          <Plus size={18} className="mr-2" />
          Novo Treino
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={programacao?.id || ''}
          onChange={(e) => handleProgramacaoChange(e.target.value)}
          className="glass-input w-full sm:w-auto text-sm px-3 py-2"
          aria-label="Selecionar programação"
        >
          <option value="">Selecione uma programação</option>
          {programacoes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} — {p.tipo}{' '}
              ({p.modalidade === 'BOX_PRESENCIAL' ? 'Box Presencial' : 'Planilha'})
            </option>
          ))}
        </select>

        <select
          value={faseAtiva}
          onChange={(e) => setFaseAtiva(e.target.value)}
          className="glass-input w-full sm:w-auto text-sm px-3 py-2"
          disabled={fases.length === 0}
        >
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome} (Ordem {f.ordem})
            </option>
          ))}
        </select>
      </div>

      <GlassCard className="p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={semanaAnterior}
            disabled={semanas.findIndex((s) => s.id === semanaAtiva) <= 0}
            className="p-2 rounded-lg hover:bg-white/[0.03] disabled:opacity-30"
          >
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              {semanas.find((s) => s.id === semanaAtiva)?.nome || 'Semana'}
            </p>
          </div>

          <button
            onClick={semanaProxima}
            disabled={
              semanas.findIndex((s) => s.id === semanaAtiva) >=
              semanas.length - 1
            }
            className="p-2 rounded-lg hover:bg-white/[0.03] disabled:opacity-30"
          >
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
        </div>
      </GlassCard>

      {loading ? (
        <p className="text-sm text-text-secondary">Carregando...</p>
      ) : treinos.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Dumbbell size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">
            {programacao ? 'Nenhum treino cadastrado para esta semana.' : 'Selecione uma programação para visualizar os treinos.'}
          </p>
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
                    <p className="text-sm font-semibold text-text-primary">
                      {treino.titulo}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                      <span>{(nomes as any)[dia.dia_semana]}</span>
                      <span>/</span>
                      <span>{semana.nome}</span>
                      <span>/</span>
                      <span>{fase.nome}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => navigate(`/admin/treinos/${treino.id}`)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.03]"
                  >
                    <Eye size={14} className="text-accent" />
                  </button>

                  <button
                    onClick={() =>
                      navigate('/admin/treinos/novo', {
                        state: { treinoId: treino.id },
                      })
                    }
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
                {treino.ativo ? (
                  <Badge variant="success">Ativo</Badge>
                ) : (
                  <Badge variant="default">Inativo</Badge>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
