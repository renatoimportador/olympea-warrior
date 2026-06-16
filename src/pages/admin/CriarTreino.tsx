import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BlocoEditor } from '@/components/treino/BlocoEditor'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  criarTreino, atualizarTreino, listarDiasBySemana, listarSemanasByFase, listarFasesByProg, listarProgramacoes,
  adicionarBloco, getTreinoById, getDiaById, getSemanaById, getFaseById,
  listarBlocosByTreino, atualizarBloco, removerBloco,
} from '@/lib/api'
import type { BlocoTreino, DiaTreino, Semana, Fase } from '@/data/types'
import toast from 'react-hot-toast'

export function CriarTreino() {
  const navigate = useNavigate()
  const location = useLocation()
  const editTreinoId = (location.state as any)?.treinoId || ''

  const [modoEdicao, setModoEdicao] = useState<boolean>(!!editTreinoId)
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
        if (!treino) { toast.error('Treino nao encontrado'); return }
        setTitulo(treino.titulo || '')
        setDiaTreinoId(treino.dia_treino_id)

        const dia = await getDiaById(treino.dia_treino_id)
        if (dia?.semana_id) {
          const semana = await getSemanaById(dia.semana_id)
          if (semana?.fase_id) {
            const fase = await getFaseById(semana.fase_id)
            setFaseId(semana.fase_id)
            setTimeout(() => setSemanaId(dia.semana_id), 100)
            setDiaTreinoId(treino.dia_treino_id)
          }
        }

        const blocosTreino = (treino as any).blocos || []
        setBlocos(blocosTreino)
      } catch (e) {
        console.error('Erro ao carregar treino:', e)
        toast.error('Erro ao carregar treino')
      } finally {
        setLoadingTreino(false)
      }
    }
    carregarTreino()
  }, [editTreinoId])

  useEffect(() => {
    if (faseId) {
      loadSemanas(faseId)
    } else {
      setSemanas([])
      setSemanaId('')
      setDias([])
      setDiaTreinoId('')
    }
  }, [faseId])

  useEffect(() => {
    if (semanaId) {
      loadDias(semanaId)
    } else {
      setDias([])
      setDiaTreinoId('')
    }
  }, [semanaId])

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
      console.error('Erro ao carregar fases:', e)
    } finally {
      setLoadingFases(false)
    }
  }

  async function loadSemanas(fId: string) {
    try {
      const s = await listarSemanasByFase(fId)
      setSemanas(s)
    } catch (e) {
      console.error('Erro ao carregar semanas:', e)
    }
  }

  async function loadDias(sId: string) {
    try {
      const d = await listarDiasBySemana(sId)
      setDias(d)
    } catch (e) {
      console.error('Erro ao carregar dias:', e)
    }
  }

  async function handleSalvar() {
    if (!titulo.trim()) { toast.error('Digite o titulo do treino'); return }
    if (!diaTreinoId) { toast.error('Selecione o dia do treino'); return }
    try {
      const blocosOrdenados = blocos

      if (modoEdicao && editTreinoId) {
        await atualizarTreino(editTreinoId, {
          titulo, dia_treino_id: diaTreinoId,
        } as any)

        const blocosAtuais = await listarBlocosByTreino(editTreinoId)
        const novosBlocos = blocosOrdenados.filter(b => !blocosAtuais.some(ba => ba.id === b.id))
        const existentesBlocos = blocosOrdenados.filter(b => blocosAtuais.some(ba => ba.id === b.id))
        const removidosBlocos = blocosAtuais.filter(ba => !blocosOrdenados.some(b => b.id === ba.id))

        for (let i = 0; i < novosBlocos.length; i++) {
          const b = novosBlocos[i]
          await adicionarBloco({
            treino_id: editTreinoId,
            tipo: b.tipo,
            titulo: b.titulo,
            descricao: b.descricao || '',
            exercicios: b.exercicios || [],
            link_youtube: b.link_youtube || '',
            observacoes: b.observacoes || '',
            ordem: i,
            ativo: true,
          } as any)
        }

        for (const b of existentesBlocos) {
          await atualizarBloco(b.id, {
            tipo: b.tipo,
            titulo: b.titulo,
            descricao: b.descricao || '',
            exercicios: b.exercicios || [],
            link_youtube: b.link_youtube || '',
            observacoes: b.observacoes || '',
            ordem: blocosOrdenados.findIndex(bl => bl.id === b.id),
            ativo: true,
          } as any)
        }

        for (const r of removidosBlocos) {
          await removerBloco(r.id)
        }

        toast.success('Treino atualizado!')
      } else {
        const novoTreino = await criarTreino({
          dia_treino_id: diaTreinoId, titulo, descricao: '', tipo_wod: 'FOR_TIME', ativo: true,
        } as any)

        if (!novoTreino || !novoTreino.id) {
          throw new Error('Falha ao criar treino: resposta sem ID valido')
        }

        for (let i = 0; i < blocosOrdenados.length; i++) {
          const b = blocosOrdenados[i]
          await adicionarBloco({
            treino_id: novoTreino.id,
            tipo: b.tipo,
            titulo: b.titulo,
            descricao: b.descricao || '',
            exercicios: b.exercicios || [],
            link_youtube: b.link_youtube || '',
            observacoes: b.observacoes || '',
            ordem: i,
            ativo: true,
          } as any)
        }
        toast.success('Treino criado com sucesso!')
      }

      navigate('/admin/treinos')
    } catch (e: any) {
      console.error('ERRO AO SALVAR:', e)
      toast.error('Erro ao salvar treino: ' + (e?.message || 'Erro desconhecido'))
    }
  }

  const nomes = { SEG: 'Segunda', TER: 'Terca', QUA: 'Quarta', QUI: 'Quinta', SEX: 'Sexta', SAB: 'Sabado', DOM: 'Domingo' }

  if (loadingTreino) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-text-secondary">Carregando treino...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{modoEdicao ? 'Editar Treino' : 'Criar Treino'}</h1>
          <p className="text-sm text-text-secondary">{modoEdicao ? 'Altere os campos e salve' : 'Monte o treino adicionando blocos'}</p>
        </div>
        <Button onClick={handleSalvar}>{modoEdicao ? 'Atualizar Treino' : 'Salvar Treino'}</Button>
      </div>

      <GlassCard className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Titulo do Treino</label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Monday WOD" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Fase</label>
            <select value={faseId} onChange={e => setFaseId(e.target.value)} className="glass-input w-full text-sm" disabled={modoEdicao}>
              <option value="">Selecione...</option>
              {fases.filter(f => f.ativa).map(f => (
                <option key={f.id} value={f.id}>{f.nome} (Ordem {f.ordem})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">Semana</label>
            <select value={semanaId} onChange={e => setSemanaId(e.target.value)} className="glass-input w-full text-sm" disabled={!faseId || modoEdicao}>
              <option value="">{modoEdicao ? 'Carregando...' : 'Selecione...'}</option>
              {semanas.filter(s => s.ativa).map(s => (
                <option key={s.id} value={s.id}>{s.nome} ({s.tipo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">Dia do Treino</label>
            <select value={diaTreinoId} onChange={e => setDiaTreinoId(e.target.value)} className="glass-input w-full text-sm" disabled={!semanaId || modoEdicao}>
              <option value="">{modoEdicao ? 'Carregando...' : 'Selecione...'}</option>
              {dias.map(d => (
                <option key={d.id} value={d.id}>{(nomes as any)[d.dia_semana] || d.dia_semana}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {loadingFases && <p className="text-sm text-text-secondary">Carregando fases...</p>}

      <BlocoEditor value={blocos} onChange={setBlocos} />
    </div>
  )
}
