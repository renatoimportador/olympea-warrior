import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  listarWods,
  criarWod,
  atualizarWod,
  excluirWod,
  getBoxId,
} from '@/lib/api'
import { Search, Plus, Edit2, Ban, Save, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export function GerenciarWODs() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [wods, setWods] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '',
    tipo: 'FOR_TIME',
    descricao: '',
    time_cap: '',
  })

  async function carregarWods() {
    try {
      const data = await listarWods()
      setWods(data || [])
    } catch {
      toast.error('Erro ao carregar WODs')
    }
  }

  useEffect(() => {
    carregarWods()
  }, [])

  function resetForm() {
    setForm({
      nome: '',
      tipo: 'FOR_TIME',
      descricao: '',
      time_cap: '',
    })
    setEditingId(null)
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Preencha o nome do WOD')
      return
    }

    try {
      if (editingId) {
        await atualizarWod(editingId, {
          nome: form.nome,
          tipo: form.tipo,
          descricao: form.descricao || null,
          time_cap: form.time_cap || null,
        })
        toast.success('WOD atualizado!')
      } else {
        const boxId = await getBoxId()
        await criarWod({
          box_id: boxId || undefined,
          nome: form.nome,
          tipo: form.tipo,
          descricao: form.descricao || null,
          time_cap: form.time_cap || null,
          ativo: true,
        })
        toast.success('WOD criado!')
      }

      resetForm()
      setShowForm(false)
      await carregarWods()
    } catch (e: any) {
      console.error('Erro ao salvar WOD:', e)
      toast.error(e?.message || 'Erro ao salvar WOD')
    }
  }

  function handleEdit(w: any) {
    setForm({
      nome: w.nome || '',
      tipo: w.tipo || 'FOR_TIME',
      descricao: w.descricao || '',
      time_cap: w.time_cap || '',
    })
    setEditingId(w.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este WOD?')) return
    try {
      await excluirWod(id)
      toast.success('WOD excluido!')
      await carregarWods()
    } catch {
      toast.error('Erro ao excluir WOD')
    }
  }

  const tiposLabel: Record<string, string> = {
    FOR_TIME: 'For Time',
    AMRAP: 'AMRAP',
    EMOM: 'EMOM',
    TABATA: 'Tabata',
    CHIPPER: 'Chipper',
    STRENGTH: 'Strength',
  }

  const filtrados = wods.filter((w) =>
    w.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    w.descricao?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gerenciar WODs</h1>
          <p className="text-sm text-text-secondary">{wods.length} WODs cadastrados</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus size={18} className="mr-2" />
          Novo WOD
        </Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input className="pl-10" placeholder="Buscar WOD..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">{editingId ? 'Editar WOD' : 'Novo WOD'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Nome do WOD" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="glass-input w-full"
            >
              <option value="FOR_TIME">For Time</option>
              <option value="AMRAP">AMRAP</option>
              <option value="EMOM">EMOM</option>
              <option value="TABATA">Tabata</option>
              <option value="CHIPPER">Chipper</option>
              <option value="STRENGTH">Strength</option>
            </select>
            <Input placeholder="Time Cap (ex: 20min)" value={form.time_cap} onChange={(e) => setForm({ ...form, time_cap: e.target.value })} />
          </div>
          <textarea
            placeholder="Descricao do WOD (exercicios, rounds, reps...)"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="glass-input w-full min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave}><Save size={16} className="mr-2" />Salvar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      {filtrados.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Zap size={32} className="mx-auto text-text-secondary mb-3" />
          <p className="text-sm text-text-secondary">Nenhum WOD cadastrado.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtrados.map((w) => (
            <GlassCard key={w.id} className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{w.nome}</p>
                {w.descricao && (
                  <p className="text-xs text-text-secondary mt-1 whitespace-pre-line line-clamp-2">{w.descricao}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="accent">{tiposLabel[w.tipo] || w.tipo}</Badge>
                  {w.time_cap && <Badge variant="default">{w.time_cap}</Badge>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(w)} className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg hover:bg-error/5 text-error"><Ban size={14} /></button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
