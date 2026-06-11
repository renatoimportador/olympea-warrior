import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  listarProgramacoes, criarProgramacao, atualizarProgramacao, excluirProgramacao,
  listarFasesByProg, getBox,
} from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Programacao, Fase } from '@/data/types'
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type ProgramacaoForm = {
  id?: string
  nome: string
  tipo: string
  descricao: string
  data_inicio: string
  data_fim: string
}

export function CriarProgramacao() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProgramacaoForm>({ nome: '', tipo: 'CROSSFIT', descricao: '', data_inicio: '', data_fim: '' })
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [fasesMap, setFasesMap] = useState<Record<string, Fase[]>>({})
  const [loading, setLoading] = useState(true)
  const [boxId, setBoxId] = useState<string>('')

  useEffect(() => {
    loadProgramacoes()
    loadBox()
  }, [])

  async function loadBox() {
    try {
      const box = await getBox()
      if (box?.id) setBoxId(box.id)
    } catch (e) {
      console.error('Erro ao carregar box:', e)
    }
  }

  async function loadProgramacoes() {
    setLoading(true)
    try {
      const progs = await listarProgramacoes()
      setProgramacoes(progs)
      const fMap: Record<string, Fase[]> = {}
      for (const p of progs) {
        fMap[p.id] = await listarFasesByProg(p.id)
      }
      setFasesMap(fMap)
    } catch (e) {
      console.error('Erro ao carregar programacoes:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Digite o nome da programacao'); return }
    if (!boxId) { toast.error('Box nao carregado'); return }
    if (!user?.id) { toast.error('Usuario nao autenticado'); return }
    try {
      if (form.id) {
        await atualizarProgramacao(form.id, form as any)
        toast.success('Programacao atualizada!')
      } else {
        await criarProgramacao({ ...form, box_id: boxId, created_by: user.id } as any)
        toast.success('Programacao criada!')
      }
      await loadProgramacoes()
      setShowForm(false)
      setForm({ nome: '', tipo: 'CROSSFIT', descricao: '', data_inicio: '', data_fim: '' })
    } catch (e) {
      toast.error('Erro ao salvar programacao')
    }
  }

  async function handleEdit(p: Programacao) {
    setForm({
      id: p.id,
      nome: p.nome,
      tipo: p.tipo,
      descricao: p.descricao || '',
      data_inicio: p.data_inicio || '',
      data_fim: p.data_fim || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta programacao?')) return
    try {
      await excluirProgramacao(id)
      toast.success('Programacao excluida!')
      await loadProgramacoes()
    } catch (e) {
      toast.error('Erro ao excluir programacao')
    }
    setShowForm(false)
  }

  const progsAtivas = programacoes.filter(p => p.ativa)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Programacoes</h1>
          <p className="text-sm text-text-secondary">{progsAtivas.length} programacoes criadas</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setForm({ nome: '', tipo: 'CROSSFIT', descricao: '', data_inicio: '', data_fim: '' }) }}>
          <Plus size={18} className="mr-2" />
          Nova Programacao
        </Button>
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">Nova Programacao</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome da programacao" />
            <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value }))} className="glass-input w-full text-sm">
              <option value="CROSSFIT">CrossFit</option>
              <option value="LPO">LPO</option>
              <option value="GYMNASTICS">Gymnastics</option>
              <option value="ENDURANCE">Endurance</option>
              <option value="MASTER40">Master 40+</option>
              <option value="COMPETIDORES">Competidores</option>
            </select>
            <Input type="date" value={form.data_inicio} onChange={e => setForm(prev => ({ ...prev, data_inicio: e.target.value }))} />
            <Input type="date" value={form.data_fim} onChange={e => setForm(prev => ({ ...prev, data_fim: e.target.value }))} />
            <textarea value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descricao" rows={2} className="glass-input w-full resize-none sm:col-span-2" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Salvar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      {loading && <p className="text-sm text-text-secondary">Carregando...</p>}

      <div className="space-y-3">
        {progsAtivas.map((p) => {
          const fasesProg = fasesMap[p.id] || []
          return (
            <GlassCard key={p.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Layers size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{p.nome}</p>
                    <p className="text-xs text-text-secondary">{p.tipo}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-white/[0.03]">
                    <Edit2 size={14} className="text-text-secondary" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-error/5">
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="accent">{fasesProg.length} fases</Badge>
                <Badge>{p.data_inicio} a {p.data_fim}</Badge>
                {p.ativa ? <Badge variant="success">Ativa</Badge> : <Badge variant="default">Inativa</Badge>}
              </div>
              {p.descricao && (<p className="text-xs text-text-secondary">{p.descricao}</p>)}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
