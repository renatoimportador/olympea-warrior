import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BlocoEditor } from '@/components/treino/BlocoEditor'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  criarTreino,
  atualizarTreino,
  listarDiasBySemana,
  listarSemanasByFase,
  listarFasesByProg,
  listarProgramacoes,
  adicionarBloco,
  getTreinoById,
  getDiaById,
  getSemanaById,
  listarBlocosByTreino,
  removerBloco,
} from '@/lib/api'
import type {
  BlocoTreino,
  DiaTreino,
  Semana,
  Fase,
  Programacao,
} from '@/data/types'
import toast from 'react-hot-toast'

export function CriarTreino() {
  const navigate = useNavigate()
  const location = useLocation()
  const editTreinoId = (location.state as any)?.treinoId || ''

  const [titulo, setTitulo] = useState('')
  const [blocos, setBlocos] = useState<BlocoTreino[]>([])
  const [salvando, setSalvando] = useState(false)

  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [dias, setDias] = useState<DiaTreino[]>([])

  const [programacaoId, setProgramacaoId] = useState('')
  const [faseId, setFaseId] = useState('')
  const [semanaId, setSemanaId] = useState('')
  const [diaTreinoId, setDiaTreinoId] = useState('')

  useEffect(() => {
    carregarProgramacoes()
  }, [])

  async function carregarProgramacoes() {
    try {
      const data = await listarProgramacoes()
      setProgramacoes(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar programações')
    }
  }

  async function handleProgramacaoChange(id: string) {
    setProgramacaoId(id)
    setFaseId('')
    setSemanaId('')
    setDiaTreinoId('')
    setFases([])
    setSemanas([])
    setDias([])

    if (!id) return

    const data = await listarFasesByProg(id)
    setFases(data || [])
  }

  async function handleFaseChange(id: string) {
    setFaseId(id)
    setSemanaId('')
    setDiaTreinoId('')
    setSemanas([])
    setDias([])

    if (!id) return

    const data = await listarSemanasByFase(id)
    setSemanas(data || [])
  }

  async function handleSemanaChange(id: string) {
    setSemanaId(id)
    setDiaTreinoId('')
    setDias([])

    if (!id) return

    const data = await listarDiasBySemana(id)
    setDias(data || [])
  }

  useEffect(() => {
    async function carregarTreino() {
      if (!editTreinoId) return

      try {
        const treino = await getTreinoById(editTreinoId)
        if (!treino) return

        setTitulo(treino.titulo || '')
        setDiaTreinoId(treino.dia_treino_id || '')

        const dia = await getDiaById(treino.dia_treino_id)

        if (dia) {
          const semana = await getSemanaById(dia.semana_id)

          if (semana) {
            setSemanaId(semana.id)
            setFaseId(semana.fase_id)

            const programacoesData = await listarProgramacoes()
            setProgramacoes(programacoesData || [])

            const programacaoAtual = programacoesData.find(
              (p: any) => p.id === semana.programacao_id
            )

            if (programacaoAtual) {
              setProgramacaoId(programacaoAtual.id)

              const fasesData = await listarFasesByProg(programacaoAtual.id)
              setFases(fasesData || [])
            }

            const semanasData = await listarSemanasByFase(semana.fase_id)
            setSemanas(semanasData || [])

            const diasData = await listarDiasBySemana(semana.id)
            setDias(diasData || [])
          }
        }

        const blocosTreino = await listarBlocosByTreino(editTreinoId)

        setBlocos(
          (blocosTreino || []).filter((b: any) => b.ativo !== false)
        )
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar treino')
      }
    }

    carregarTreino()
  }, [editTreinoId])

  async function handleSalvar() {
    if (salvando) return

    if (!titulo.trim()) {
      toast.error('Digite o título do treino')
      return
    }

    if (!diaTreinoId) {
      toast.error('Selecione o dia')
      return
    }

    if (blocos.length === 0) {
      toast.error('Adicione pelo menos um bloco')
      return
    }

    const blocosValidos = blocos.filter(
      (bloco) =>
        bloco.titulo?.trim() ||
        bloco.descricao?.trim() ||
        (bloco.exercicios && bloco.exercicios.length > 0)
    )

    if (blocosValidos.length === 0) {
      toast.error('Nenhum bloco válido para salvar')
      return
    }

    for (const bloco of blocosValidos) {
      if (!bloco.titulo?.trim()) {
        toast.error('Todos os blocos precisam de título')
        return
      }
    }

    try {
      setSalvando(true)

      if (editTreinoId) {
        await atualizarTreino(editTreinoId, {
          titulo,
          dia_treino_id: diaTreinoId,
        } as any)

        const blocosAtuais = await listarBlocosByTreino(editTreinoId)

        for (const bloco of blocosAtuais.filter((b: any) => b.ativo !== false)) {
          await removerBloco(bloco.id)
        }

        for (let i = 0; i < blocosValidos.length; i++) {
          await adicionarBloco({
            treino_id: editTreinoId,
            tipo: blocosValidos[i].tipo,
            titulo: blocosValidos[i].titulo,
            descricao: blocosValidos[i].descricao || '',
            exercicios: blocosValidos[i].exercicios || [],
            link_youtube: blocosValidos[i].link_youtube || '',
            observacoes: blocosValidos[i].observacoes || '',
            ordem: i,
            ativo: true,
          } as any)
        }

        toast.success('Treino atualizado!')
      } else {
        const novoTreino = await criarTreino({
          titulo,
          dia_treino_id: diaTreinoId,
          ativo: true,
        } as any)

        for (let i = 0; i < blocosValidos.length; i++) {
          await adicionarBloco({
            treino_id: novoTreino.id,
            tipo: blocosValidos[i].tipo,
            titulo: blocosValidos[i].titulo,
            descricao: blocosValidos[i].descricao || '',
            exercicios: blocosValidos[i].exercicios || [],
            link_youtube: blocosValidos[i].link_youtube || '',
            observacoes: blocosValidos[i].observacoes || '',
            ordem: i,
            ativo: true,
          } as any)
        }

        toast.success('Treino criado!')
      }

      navigate('/admin/treinos')
    } catch (error) {
      console.error('Erro ao salvar treino:', error)
      toast.error('Erro ao salvar treino')
    } finally {
      setSalvando(false)
    }
  }

  const nomes = {
    SEG: 'Segunda',
    TER: 'Terça',
    QUA: 'Quarta',
    QUI: 'Quinta',
    SEX: 'Sexta',
    SAB: 'Sábado',
    DOM: 'Domingo',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {editTreinoId ? 'Editar Treino' : 'Criar Treino'}
        </h1>

        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar Treino'}
        </Button>
      </div>

      <GlassCard className="p-5 space-y-4">
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do treino"
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={programacaoId}
            onChange={(e) => handleProgramacaoChange(e.target.value)}
            className="glass-input"
          >
            <option value="">Selecione a programação</option>
            {programacoes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            value={faseId}
            onChange={(e) => handleFaseChange(e.target.value)}
            className="glass-input"
            disabled={!programacaoId}
          >
            <option value="">Selecione a fase</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>

          <select
            value={semanaId}
            onChange={(e) => handleSemanaChange(e.target.value)}
            className="glass-input"
            disabled={!faseId}
          >
            <option value="">Selecione a semana</option>
            {semanas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>

          <select
            value={diaTreinoId}
            onChange={(e) => setDiaTreinoId(e.target.value)}
            className="glass-input"
            disabled={!semanaId}
          >
            <option value="">Selecione o dia</option>
            {dias.map((d) => (
              <option key={d.id} value={d.id}>
                {(nomes as any)[d.dia_semana]}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      <BlocoEditor value={blocos} onChange={setBlocos} />
    </div>
  )
}
