import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  listarFasesByProg, listarSemanasByFase, listarDiasBySemana,
  criarFase, atualizarFase, excluirFase,
  listarProgramacoes,
} from '@/lib/api'
import type { Fase, Semana, Programacao, DiaTreino } from '@/data/types'
import { Layers, Plus, Edit2, Copy, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function CriarFase() {
  const [showForm, setShowForm] = useState(false)
  const [fases, setFases] = useState<Fase[]>([])
  const [semanasMap, setSemanasMap] = useState<Record<string, Semana[]>>({})
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', ordem: 1, descricao: '', programacao_id: '' })
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const progs = await listarProgramacoes()
      setProgramacoes(progs)

      const allFases: Fase[] = []
      const sMap: Record<string, Semana[]> = {}
      for (const p of progs) {
        const f = await listarFasesByProg(p.id)
        allFases.push(...f)
        for (const fa of f) {
          const s = await listarSemanasByFase(fa.id)
          sMap[fa.id] = s
        }
      }
      setFases(allFases)
      setSemanasMap(sMap)
    } catch (e) {
      console.error('Erro ao carregar fases:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Digite o nome da fase'); return }
    if (!form.programacao_id) { toast.error('Selecione a programacao'); return }
    try {
      if (editId) {
        await atualizarFase(editId, form as any)
        toast.success('Fase atualizada!')
      } else {
        await criarFase({ ...form, ativa: true, created_by: 'u-admin' } as any)
        toast.success('Fase criada!')
      }
      await loadData()
      setShowForm(false)
      setForm({ nome: '', ordem: 1, descricao: '', programacao_id: '' })
      setEditId(null)
    } catch (e) {
      toast.error('Erro ao salvar fase')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta fase?')) return
    try {
      await excluirFase(id)
      toast.success('Fase excluida!')
      await loadData()
    } catch (e) {
      toast.error('Erro ao excluir fase')
    }
  }

  function handleEdit(f: Fase) {
    setForm({ nome: f.nome, ordem: f.ordem, descricao: f.descricao || '', programacao_id: f.programacao_id })
    setEditId(f.id)
    setShowForm(true)
  }

  const fasesAtivas = fases.filter((f) => f.ativa)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fases de Periodizacao</h1>
          <p className="text-sm text-text-secondary">{fasesAtivas.length} fases ativas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Copy size={16} className="mr-2" />
            Duplicar Fase
          </Button>
          <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ nome: '', ordem: 1, descricao: '', programacao_id: '' }) }}>
            <Plus size={18} className="mr-2" />
            Nova Fase
          </Button>
        </div>
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">{editId ? 'Editar Fase' : 'Nova Fase'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={form.programacao_id}
              onChange={e => setForm(prev => ({ ...prev, programacao_id: e.target.value }))}
              className="glass-input w-full text-sm"
            >
              <option value="">Selecione a programacao...</option>
              {programacoes.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            <Input placeholder="Nome da fase" value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} />
            <Input placeholder="Ordem" type="number" value={form.ordem} onChange={e => setForm(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))} />
            <textarea placeholder="Descricao" rows={2} value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} className="glass-input w-full resize-none sm:col-span-3" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Salvar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      {loading && <p className="text-sm text-text-secondary">Carregando...</p>}

      <div className="space-y-3">
        {fasesAtivas.map((f) => {
          const semanasFase = semanasMap[f.id] || []
          const prog = programacoes.find((p) => p.id === f.programacao_id)
          return (
            <GlassCard key={f.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Layers size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{f.nome}</p>
                    <p className="text-xs text-text-secondary">{prog?.nome || ''}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(f)} className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-error/5 text-text-secondary">
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-white/[0.02] text-center">
                  <p className="text-lg font-bold text-text-primary">{f.ordem}</p>
                  <p className="text-[10px] text-text-secondary">Ordem</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] text-center">
                  <p className="text-lg font-bold text-text-primary">{semanasFase.length}</p>
                  <p className="text-[10px] text-text-secondary">Semanas</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] text-center">
                  <p className="text-lg font-bold text-text-primary">{semanasFase.length}</p>
                  <p className="text-[10px] text-text-secondary">Duracao total</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-text-secondary font-medium">Semanas desta fase</p>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {semanasFase.map((s) => (
                    <span key={s.id} className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-text-secondary whitespace-nowrap">
                      {s.nome}
                    </span>
                  ))}
                </div>
              </div>

              {f.descricao && (
                <p className="text-xs text-text-secondary leading-relaxed">{f.descricao}</p>
              )}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
