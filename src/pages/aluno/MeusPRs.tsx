import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import {
  getAlunoByUsuarioId,
  getPRsByAluno,
  criarPR,
  atualizarPR,
  excluirPR,
  listarExercicios,
} from '@/lib/api'
import { Trophy, Zap, TrendingUp, Plus, Save, X, Pencil, Trash2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function PRForm({
  initial,
  alunoId,
  onSave,
  onCancel,
}: {
  initial?: any
  alunoId: string
  onSave: () => void
  onCancel: () => void
}) {
  const [exercicios, setExercicios] = useState<any[]>([])
  const [exercicioId, setExercicioId] = useState(initial?.exercicio_id || '')
  const [exercicio, setExercicio] = useState(initial?.exercicio?.nome || '')
  const [valor, setValor] = useState(initial?.valor || '')
  const [unidade, setUnidade] = useState(initial?.unidade || 'kg')
  const [data, setData] = useState(
    initial?.data
      ? new Date(initial.data).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [observacao, setObservacao] = useState(initial?.observacao || '')

  useEffect(() => {
    async function loadExercicios() {
      const data = await listarExercicios()
      setExercicios(data || [])
    }
    loadExercicios()
  }, [])

  async function handleSalvar() {
    if (!exercicioId || !valor) return

    const payload = {
      aluno_id: alunoId,
      exercicio_id: exercicioId,
      valor: parseFloat(String(valor)),
      unidade,
      data: new Date(data).toISOString(),
      observacao,
      is_pr: true,
    }

    if (initial?.id) {
      await atualizarPR(initial.id, payload)
    } else {
      await criarPR(payload)
    }

    onSave()
  }

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex justify-between">
        <h4 className="font-semibold text-sm text-text-primary">
          {initial ? 'Editar PR' : 'Novo PR'}
        </h4>
        <button onClick={onCancel}>
          <X size={14} className="text-text-secondary" />
        </button>
      </div>

      <select
        value={exercicioId}
        onChange={(e) => {
          setExercicioId(e.target.value)
          const ex = exercicios.find((x) => x.id === e.target.value)
          setExercicio(ex?.nome || '')
        }}
        className="glass-input w-full text-sm"
      >
        <option value="">Selecione o movimento...</option>
        {exercicios.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor"
          className="text-sm"
        />

        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          className="glass-input w-full text-sm"
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
          <option value="reps">reps</option>
          <option value="metros">m</option>
        </select>

        <Input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="text-sm"
        />
      </div>

      <Input
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Observacao (opcional)"
        className="text-sm"
      />

      <Button onClick={handleSalvar} className="w-full">
        <Save size={16} className="mr-2" />
        Salvar PR
      </Button>
    </GlassCard>
  )
}

export function MeusPRs() {
  const { user } = useAuth()

  const [aluno, setAluno] = useState<any>(null)
  const [prs, setPRs] = useState<any[]>([])
  const [editPR, setEditPR] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user?.id) return

      const alunoData = await getAlunoByUsuarioId(user.id)
      if (!alunoData) return

      setAluno(alunoData)

      const prsData = await getPRsByAluno(alunoData.id)
      setPRs(prsData || [])
    }

    load()
  }, [user?.id, showForm])

  async function handleDelete(id: string) {
    await excluirPR(id)

    if (aluno?.id) {
      const prsData = await getPRsByAluno(aluno.id)
      setPRs(prsData || [])
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary">Meus PRs</h1>
          <p className="text-sm text-text-secondary">
            Recordes pessoais e evolucao
          </p>
        </div>

        <Button
          onClick={() => {
            setShowForm(true)
            setEditPR(null)
          }}
        >
          <Plus size={16} className="mr-2" />
          Novo PR
        </Button>
      </div>

      {showForm && aluno && (
        <PRForm
          initial={editPR}
          alunoId={aluno.id}
          onSave={async () => {
            const prsData = await getPRsByAluno(aluno.id)
            setPRs(prsData || [])
            setShowForm(false)
            setEditPR(null)
          }}
          onCancel={() => {
            setShowForm(false)
            setEditPR(null)
          }}
        />
      )}

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          Evolucao de Cargas
        </h3>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={prs.map((pr) => ({
                data: new Date(pr.data).toLocaleDateString('pt-BR'),
                valor: pr.valor,
              }))}
            >
              <defs>
                <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="data"
                tick={{ fill: '#8B9DB0', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131C25',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#00E5FF"
                strokeWidth={2}
                fill="url(#prGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {prs.length === 0 && (
          <GlassCard className="p-6 text-center">
            <Trophy size={32} className="mx-auto text-text-secondary mb-2" />
            <p className="text-sm text-text-secondary">
              Nenhum PR registrado ainda. Adicione o primeiro!
            </p>
          </GlassCard>
        )}

        {prs.map((pr: any) => (
          <GlassCard key={pr.id} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="text-warning" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {pr.exercicio?.nome || 'Exercicio'}
              </p>

              <p className="text-xs text-text-secondary">
                {new Date(pr.data).toLocaleDateString('pt-BR')}
              </p>

              {pr.observacao && (
                <p className="text-xs text-text-secondary">
                  {pr.observacao}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-accent">
                {pr.valor}
                <span className="text-sm">{pr.unidade}</span>
              </p>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => {
                  setEditPR(pr)
                  setShowForm(true)
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.03]"
              >
                <Pencil size={14} className="text-text-secondary" />
              </button>

              <button
                onClick={() => handleDelete(pr.id)}
                className="p-1.5 rounded-lg hover:bg-error/5"
              >
                <Trash2 size={14} className="text-error" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
