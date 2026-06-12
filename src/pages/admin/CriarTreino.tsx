import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BlocoEditor } from '@/components/treino/BlocoEditor'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  criarTreino, listarDiasBySemana, listarSemanasByFase, listarFasesByProg, listarProgramacoes,
} from '@/lib/api'
import type { BlocoTreino, TipoBloco, DiaTreino } from '@/data/types'
import toast from 'react-hot-toast'

function ordenarBlocosPorTipo(blocos: BlocoTreino[]): BlocoTreino[] {
  const ordemTipo: Record<TipoBloco, number> = {
    MOBILIDADE: 0, WARM_UP: 1, SKILL: 2, FORCA: 3,
    ACCESSORIES: 4, CONDITIONING: 5, WORKOUT: 6, GAME_PLAN: 7, OBSERVACOES_COACH: 8,
  }
  return [...blocos].sort((a, b) => ordemTipo[a.tipo] - ordemTipo[b.tipo])
}

export function CriarTreino() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [diaTreinoId, setDiaTreinoId] = useState('')
  const [blocos, setBlocos] = useState<BlocoTreino[]>([])
  const [dias, setDias] = useState<DiaTreino[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDias()
  }, [])

  async function loadDias() {
    setLoading(true)
    try {
      const progs = await listarProgramacoes()
      const allDias: DiaTreino[] = []
      for (const p of progs) {
        const fases = await listarFasesByProg(p.id)
        for (const f of fases) {
          const semanas = await listarSemanasByFase(f.id)
          for (const s of semanas) {
            const diasSemana = await listarDiasBySemana(s.id)
            allDias.push(...diasSemana)
          }
        }
      }
      setDias(allDias)
    } catch (e) {
      console.error('Erro ao carregar dias:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSalvar() {
    if (!titulo.trim()) { toast.error('Digite o titulo do treino'); return }
    if (!diaTreinoId) { toast.error('Selecione o dia do treino'); return }
    try {
      const blocosOrdenados = ordenarBlocosPorTipo(blocos.filter(b => b.ativo))
      console.log('SALVANDO TREINO:', { diaTreinoId, titulo })
      await criarTreino({
        dia_treino_id: diaTreinoId, titulo, descricao: '', tipo_wod: 'FOR_TIME', ativo: true,
      } as any)
      toast.success('Treino criado com sucesso!')
      navigate('/admin/treinos')
    } catch (e) {
  console.error('ERRO AO CRIAR TREINO:', e)
  toast.error('Erro ao criar treino')
}
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Criar Treino</h1>
          <p className="text-sm text-text-secondary">Monte o treino adicionando blocos</p>
        </div>
        <Button onClick={handleSalvar}>Salvar Treino</Button>
      </div>

      <GlassCard className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Titulo do Treino</label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Monday WOD" />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Dia do Treino</label>
            <select value={diaTreinoId} onChange={e => setDiaTreinoId(e.target.value)} className="glass-input w-full text-sm">
              <option value="">Selecione...</option>
              {dias.map(d => (
                <option key={d.id} value={d.id}>{d.dia_semana} — {d.data || ''}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {loading && <p className="text-sm text-text-secondary">Carregando dias...</p>}

      <BlocoEditor value={blocos} onChange={setBlocos} />
    </div>
  )
}
