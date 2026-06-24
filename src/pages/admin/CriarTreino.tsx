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
  getFaseById,
  listarBlocosByTreino,
  atualizarBloco,
  removerBloco,
} from '@/lib/api'
import type { BlocoTreino, DiaTreino, Semana, Fase } from '@/data/types'
import toast from 'react-hot-toast'

export function CriarTreino() {
  const navigate = useNavigate()
  const location = useLocation()
  const editTreinoId = (location.state as any)?.treinoId || ''

  const [modoEdicao] = useState<boolean>(!!editTreinoId)
  const [titulo, setTitulo] = useState('')
  const [diaTreinoId, setDiaTreinoId] = useState('')
  const [blocos, setBlocos] = useState<BlocoTreino[]>([])

  const [fases, setFases] = useState<Fase[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [dias, setDias] = useState<DiaTreino[]>([])

  const [faseId, setFaseId] = useState('')
  const [semanaId, setSemanaId] = useState('')

  const [loadingFases, setLoadingFases] = useState(true)
  const [loadingTreino, setLoadingTreino] = useState(false)

  useEffect(() => {
    loadFases()
  }, [])

  useEffect(() => {
    async function carregarTreino() {
      if (!editTreinoId) return

      setLoadingTreino(true)

      try {
        const treino = await getTreinoById(editTreinoId)

        if (!treino) {
          toast.error('Treino nao encontrado')
          return
        }

        setTitulo(treino.titulo || '')
        setDiaTreinoId(treino.dia_treino_id)

        const dia = await getDiaById(treino.dia_treino_id)

        if (dia?.semana_id) {
          const semana = await getSemanaById(dia.semana_id)

          if (semana?.fase_id) {
            setFaseId(semana.fase_id)

            const semanasData = await listarSemanasByFase(semana.fase_id)
            setSemanas(semanasData)

            setSemanaId(dia.semana_id)

            const diasData = await listarDiasBySemana(dia.semana_id)
            setDias(diasData)
          }
        }

        const blocosTreino = (treino as any).blocos || []
        setBlocos(blocosTreino)
      } catch (e) {
        console.error(e)
        toast.error('Erro ao carregar treino')
      } finally {
        setLoadingTreino(false)
      }
    }

    carregarTreino()
  }, [editTreinoId])

  async function loadFases() {
    setLoadingFases(true)

    try {
      const progs = await listarProgramacoes()
      const allFases: Fase[] = []

      for (const p of progs) {
        const f = await listarFasesByProg(p.id)
        allFases.push(...f)
      }

      setFases(allFases)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingFases(false)
    }
  }

  async function handleFaseChange(fId: string) {
    setFaseId(fId)
    setSemanaId('')
    setDiaTreinoId('')
    setSemanas([])
    setDias([])

    if (!fId) return

    const semanasData = await listarSemanasByFase(fId)
    setSemanas(semanasData)
  }

  async function handleSemanaChange(sId: string) {
    setSemanaId(sId)
    setDiaTreinoId('')
    setDias([])

    if (!sId) return

    const diasData = await listarDiasBySemana(sId)
    setDias(diasData)
  }

  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error('Digite o titulo do treino')
      return
    }

    if (!diaTreinoId) {
      toast.error('Selecione o dia do treino')
      return
    }

    try {
      const blocosOrdenados = blocos.filter(b => b.ativo !== false)

      if (modoEdicao && editTreinoId) {
        await atualizarTreino(editTreinoId, {
          titulo,
          dia_treino_id: diaTreinoId,
        } as any)

        const blocosAtuais = await listarBlocosByTreino(editTreinoId)

        const novosBlocos = blocosOrdenados.filter(
          b => !blocosAtuais.some(ba => ba.id === b.id)
        )

        const existentesBlocos = blocosOrdenados.filter(
          b => blocosAtuais.some(ba => ba.id === b.id)
        )

        const removidosBlocos = blocosAtuais.filter(
          ba => !blocosOrdenados.some(b => b.id === ba.id)
        )

        for (let i = 0; i < novosBlocos.length; i++) {
          await adicionarBloco({
            ...novosBlocos[i],
            treino_id: editTreinoId,
            ordem: i,
            ativo: true,
          } as any)
        }

        for (const b of existentesBlocos) {
          await atualizarBloco(b.id, {
            ...b,
            ordem: blocosOrdenados.findIndex(bl => bl.id === b.id),
          } as any)
        }

        for (const r of removidosBlocos) {
          await removerBloco(r.id)
        }

        toast.success('Treino atualizado!')
      } else {
        const novoTreino = await criarTreino({
          dia_treino_id: diaTreinoId,
          titulo,
          descricao: '',
          tipo_wod: 'FOR_TIME',
          ativo: true,
        } as any)

        for (let i = 0; i < blocosOrdenados.length; i++) {
          await adicionarBloco({
            ...blocosOrdenados[i],
            treino_id: novoTreino.id,
            ordem: i,
            ativo: true,
          } as any)
        }

        toast.success('Treino criado com sucesso!')
      }

      navigate('/admin/treinos')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Erro ao salvar treino')
    }
  }

  const nomes = {
    SEG: 'Segunda',
    TER: 'Terca',
    QUA: 'Quarta',
    QUI: 'Quinta',
    SEX: 'Sexta',
    SAB: 'Sabado',
    DOM: 'Domingo',
  }

  if (loadingTreino) {
    return <p>Carregando treino...</p>
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {modoEdicao ? 'Editar Treino' : 'Criar Treino'}
          </h1>
        </div>

        <Button onClick={handleSalvar}>
          {modoEdicao ? 'Atualizar Treino' : 'Salvar Treino'}
        </Button>
      </div>

      <GlassCard className="p-5 space-y-4">
        <Input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Titulo do treino"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={faseId}
            onChange={e => handleFaseChange(e.target.value)}
            className="glass-input"
          >
            <option value="">Selecione...</option>

            {fases.map(f => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>

          <select
            value={semanaId}
            onChange={e => handleSemanaChange(e.target.value)}
            className="glass-input"
            disabled={!faseId}
          >
            <option value="">Selecione...</option>

            {semanas.map(s => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>

          <select
            value={diaTreinoId}
            onChange={e => setDiaTreinoId(e.target.value)}
            className="glass-input"
            disabled={!semanaId}
          >
            <option value="">Selecione...</option>

            {dias.map(d => (
              <option key={d.id} value={d.id}>
                {(nomes as any)[d.dia_semana] || d.dia_semana}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {loadingFases && <p>Carregando fases...</p>}

      <BlocoEditor value={blocos} onChange={setBlocos} />
    </div>
  )
}
