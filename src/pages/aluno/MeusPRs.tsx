import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Trophy, Zap, TrendingUp, Plus, Save, X, Pencil, Trash2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'



function PRForm({ initial, alunoId, onSave, onCancel }: {
  initial?: any
  alunoId: string
  onSave: () => void
  onCancel: () => void
}) {
  const [exercicio, setExercicio] = useState(initial?.exercicio?.nome || initial?.exercicio?.nome || '')
  const [valor, setValor] = useState(initial?.valor || '')
  const [unidade, setUnidade] = useState(initial?.unidade || 'kg')
  const [data, setData] = useState(initial?.data ? new Date(initial.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [observacao, setObservacao] = useState(initial?.observacao || '')

  async function handleSalvar() {
  if (!exercicio || !valor) return

  const { data: ex } = await supabase
    .from('exercicios')
    .select('id,nome')
    .eq('nome', exercicio)
    .single()

  if (!ex) return

  const payload = {
    aluno_id: alunoId,
    exercicio_id: ex.id,
    exercicio_nome: ex.nome,
    valor: Number(valor),
    unidade,
    data,
    observacao,
    is_pr: true,
  }

  if (initial?.id) {
    const { error } = await supabase
      .from('prs')
      .update(payload)
      .eq('id', initial.id)

    if (error) {
      console.error(error)
      return
    }
  } else {
    const { error } = await supabase
      .from('prs')
      .insert(payload)

    if (error) {
      console.error(error)
      return
    }
  }

  onSave()
}

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex justify-between">
        <h4 className="font-semibold text-sm text-text-primary">{initial ? 'Editar PR' : 'Novo PR'}</h4>
        <button onClick={onCancel}><X size={14} className="text-text-secondary" /></button>
      </div>
      <select
  value={exercicio}
  onChange={(e) => setExercicio(e.target.value)}
  className="glass-input w-full text-sm"
>
  <option value="">Selecione um exercício</option>

  {exercicios.map((ex: any) => (
    <option key={ex.id} value={ex.nome}>
      {ex.nome}
    </option>
  ))}
</select>
      <div className="grid grid-cols-3 gap-2">
        <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor" className="text-sm" />
        <select value={unidade} onChange={e => setUnidade(e.target.value)} className="glass-input w-full text-sm">
          <option value="kg">kg</option>
          <option value="lb">lb</option>
          <option value="reps">reps</option>
          <option value="metros">m</option>
        </select>
        <Input type="date" value={data} onChange={e => setData(e.target.value)} className="text-sm" />
      </div>
      <Input value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observacao (opcional)" className="text-sm" />
      <Button onClick={handleSalvar} className="w-full">
        <Save size={16} className="mr-2" /> Salvar PR
      </Button>
    </GlassCard>
  )
}

export function MeusPRs() {
  const { user } = useAuth()

const [alunoId, setAlunoId] = useState('')
const [prs, setPRs] = useState<any[]>([])
const [exercicios, setExercicios] = useState<any[]>([])

const [editPR, setEditPR] = useState<any>(null)
const [showForm, setShowForm] = useState(false)
const [loading, setLoading] = useState(true)

useEffect(() => {
  if (user) {
    carregarDados()
  }
}, [user])

async function carregarDados() {
  if (!user) return

  setLoading(true)

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('usuario_id', user.id)
    .single()

  if (!aluno) {
    setLoading(false)
    return
  }

  setAlunoId(aluno.id)

  const { data: listaPrs } = await supabase
    .from('prs')
    .select('*')
    .eq('aluno_id', aluno.id)
    .order('data', { ascending: false })

  const { data: listaExercicios } = await supabase
    .from('exercicios')
    .select('id,nome')
    .eq('ativo', true)
    .order('nome')

  setPRs(listaPrs || [])
  setExercicios(listaExercicios || [])

  setLoading(false)
}

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary">Meus PRs</h1>
          <p className="text-sm text-text-secondary">Recordes pessoais e evolucao</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditPR(null) }}>
          <Plus size={16} className="mr-2" /> Novo PR
        </Button>
      </div>

      {showForm && aluno && (
        <PRForm
          initial={editPR}
          alunoId={aluno.id}
          onSave={() => { setShowForm(false); setEditPR(null) }}
          onCancel={() => { setShowForm(false); setEditPR(null) }}
        />
      )}

      {/* Grafico de evolucao */}
      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          Evolucao de Cargas (kg)
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{ mes: 'Jan', valor: 0 }, { mes: 'Jun', valor: prs.length > 0 ? prs[prs.length - 1].valor : 0 }]}>
              <defs><linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} /><stop offset="95%" stopColor="#00E5FF" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#131C25', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="valor" stroke="#00E5FF" strokeWidth={2} fill="url(#prGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Lista de PRs */}
      <div className="space-y-3">
        {prs.length === 0 && (
          <GlassCard className="p-6 text-center">
            <Trophy size={32} className="mx-auto text-text-secondary mb-2" />
            <p className="text-sm text-text-secondary">Nenhum PR registrado ainda. Adicione o primeiro!</p>
          </GlassCard>
        )}
        {prs.map((pr: any) => (
          <GlassCard key={pr.id} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{pr.exercicio?.nome}</p>
              <p className="text-xs text-text-secondary">{new Date(pr.data).toLocaleDateString('pt-BR')}</p>
              {pr.observacao && <p className="text-xs text-text-secondary">{pr.observacao}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-accent">{pr.valor}<span className="text-sm">{pr.unidade}</span></p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditPR(pr); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-white/[0.03]">
                <Pencil size={14} className="text-text-secondary" />
              </button>
              <button onClick={() => { excluirPR(pr.id) }} className="p-1.5 rounded-lg hover:bg-error/5">
                <Trash2 size={14} className="text-error" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
