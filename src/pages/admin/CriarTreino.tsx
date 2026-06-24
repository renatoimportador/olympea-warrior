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

  const [loadingTreino, setLoadingTreino] = useState(false)

  useEffect(() => {
    carregarFases()
  }, [])

  async function carregarFases() {
    try {
      const progs = await listarProgramacoes()
      let todasFases: Fase[] = []

      for (const prog of progs) {
        const fasesProg = await listarFasesByProg(prog.id)
        todasFases = [...todasFases, ...fasesProg]
      }

      setFases(todasFases)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar fases')
    }
  }

  async function handleFaseChange(id: string) {
    try {
      setFaseId(id)
      setSemanaId('')
      setDiaTreinoId('')
      setDias([])

      if (!id) {
        setSemanas([])
        return
      }

      const semanasData = await listarSemanasByFase(id)

      console.log('Semanas carregadas:', semanasData)

      setSemanas(semanasData || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar semanas')
    }
  }

  async function handleSemanaChange(id: string) {
    try {
      setSemanaId(id)
      setDiaTreinoId('')

      if (!id) {
        setDias([])
        return
      }

      const diasData = await listarDiasBySemana(id)

      console.log('Dias carregados:', diasData)

      setDias(diasData || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar dias')
    }
  }

  useEffect(() => {
    async function carregarTreino() {
      if (!editTreinoId) return

      setLoadingTreino(true)

      try {
        const treino = await getTreinoById(editTreinoId)

        if (!treino) return

        setTitulo(treino.titulo)
        setDiaTreinoId(treino.dia_treino_id)

        const dia = await getDiaById(treino.dia_treino_id)

        if (dia) {
          const semana = await getSemanaById(dia.semana_id)

          if (semana) {
            setFaseId(semana.fase_id)

            const semanasData = await listarSemanasByFase(semana.fase_id)
            setSemanas(semanasData)

            setSemanaId(semana.id)

            const diasData = await listarDiasBySemana(semana.id)
            setDias(diasData)
          }
        }

        setBlocos((treino as any).blocos || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingTreino(false)
      }
    }

    carregarTreino()
  }, [editTreinoId])

  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error('Digite o título')
      return
    }

    if (!diaTreinoId) {
      toast.error('Selecione um dia')
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

        for (const bloco of blocosAtuais) {
          await removerBloco(bloco.id)
        }

        for (let i = 0; i < blocosOrdenados.length; i++) {
          await adicionarBloco({
            ...blocosOrdenados[i],
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

        for (let i = 0; i < blocosOrdenados.length; i++) {
          await adicionarBloco({
            ...blocosOrdenados[i],
            treino_id: novoTreino.id,
            ordem: i,
            ativo: true,
          } as any)
        }

        toast.success('Treino criado!')
      }

      navigate('/admin/treinos')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
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

  if (loadingTreino) {
    return <p>Carregando treino...</p>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {modoEdicao ? 'Editar Treino' : 'Criar Treino'}
        </h1>

        <Button onClick={handleSalvar}>Salvar Treino</Button>
      </div>

      <GlassCard className="p-5 space-y-4">
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título do treino"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={faseId}
            onChange={(e) => handleFaseChange(e.target.value)}
            className="glass-input"
          >
            <option value="">Selecione a fase</option>

            {fases.map((fase) => (
              <option key={fase.id} value={fase.id}>
                {fase.nome}
              </option>
            ))}
          </select>

          <select
            value={semanaId}
            onChange={(e) => handleSemanaChange(e.target.value)}
            className="glass-input"
          >
            <option value="">Selecione a semana</option>

            {semanas.map((semana) => (
              <option key={semana.id} value={semana.id}>
                {semana.nome}
              </option>
            ))}
          </select>

          <select
            value={diaTreinoId}
            onChange={(e) => setDiaTreinoId(e.target.value)}
            className="glass-input"
          >
            <option value="">Selecione o dia</option>

            {dias.map((dia) => (
              <option key={dia.id} value={dia.id}>
                {(nomes as any)[dia.dia_semana]}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      <BlocoEditor value={blocos} onChange={setBlocos} />
    </div>
  )
}
