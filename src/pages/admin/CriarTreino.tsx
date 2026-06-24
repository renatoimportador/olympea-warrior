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
  console.log('PROGRAMACAO SELECIONADA:', id)

  setProgramacaoId(id)
  setFaseId('')
  setSemanaId('')
  setDiaTreinoId('')
  setSemanas([])
  setDias([])

  if (!id) {
    setFases([])
    return
  }

  const data = await listarFasesByProg(id)

  console.log('FASES RETORNADAS:', data)

  setFases(data || [])
}

  async function handleFaseChange(id: string) {
    setFaseId(id)
    setSemanaId('')
    setDiaTreinoId('')
    setDias([])

    if (!id) {
      setSemanas([])
      return
    }

    const data = await listarSemanasByFase(id)
    setSemanas(data || [])
  }

  async function handleSemanaChange(id: string) {
    setSemanaId(id)
    setDiaTreinoId('')

    if (!id) {
      setDias([])
      return
    }

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

    const semanasData = await listarSemanasByFase(semana.fase_id)
    setSemanas(semanasData)

    const faseEncontrada = fases.find(f => f.id === semana.fase_id)

    if (faseEncontrada) {
      setProgramacaoId(faseEncontrada.programacao_id)

      const fasesData = await listarFasesByProg(faseEncontrada.programacao_id)
      setFases(fasesData)
    }

    const diasData = await listarDiasBySemana(semana.id)
    setDias(diasData)
  }
}

        setBlocos((treino as any).blocos || [])
      } catch (error) {
        console.error(error)
      }
    }

    carregarTreino()
  }, [editTreinoId])

  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error('Digite o título do treino')
      return
    }

    if (!diaTreinoId) {
      toast.error('Selecione o dia')
      return
    }

    try {
      if (editTreinoId) {
        await atualizarTreino(editTreinoId, {
          titulo,
          dia_treino_id: diaTreinoId,
        } as any)

        const blocosAtuais = await listarBlocosByTreino(editTreinoId)

        for (const bloco of blocosAtuais) {
          await removerBloco(bloco.id)
        }

        for (let i = 0; i < blocos.length; i++) {
          await adicionarBloco({
            ...blocos[i],
            treino_id: editTreinoId,
            ordem: i,
            ativo: true,
          } as any)
        }

        toast.success('Treino atualizado!')
      } else {
        const novoTreino = await criarTreino({
          titulo,
          dia_treino_id: diaTreinoId,
          descricao: '',
          tipo_wod: 'FOR_TIME',
          ativo: true,
        } as any)

        for (let i = 0; i < blocos.length; i++) {
          await adicionarBloco({
            ...blocos[i],
            treino_id: novoTreino.id,
            ordem: i,
            ativo: true,
          } as any)
        }

        toast.success('Treino criado!')
      }

      navigate('/admin/treinos')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar treino')
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
        <h1 className="text-2xl font-bold">Criar Treino</h1>
        <Button onClick={handleSalvar}>Salvar Treino</Button>
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
