import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  listarAlunos,
  listarResultadosByAluno,
  getPRsByAluno,
  getFrequenciasByAluno,
} from '@/lib/api'
import type { Resultado, PersonalRecord, Frequencia } from '@/data/types'
import { TrendingUp, Trophy, CalendarCheck } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export function AcompanharEvolucao() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [selectedAluno, setSelectedAluno] = useState<string>('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [prs, setPrs] = useState<PersonalRecord[]>([])
  const [frequencias, setFrequencias] = useState<Frequencia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarAlunos()
        const ativos = (data || []).filter((a: any) => a.ativo)
        setAlunos(ativos)
        if (ativos.length > 0) {
          setSelectedAluno(ativos[0].id)
        }
      } catch (e) {
        console.error('Erro:', e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  useEffect(() => {
    if (!selectedAluno) return
    async function carregarDados() {
      const [res, pr, freq] = await Promise.all([
        listarResultadosByAluno(selectedAluno),
        getPRsByAluno(selectedAluno),
        getFrequenciasByAluno(selectedAluno),
      ])
      setResultados(res || [])
      setPrs(pr || [])
      setFrequencias(freq || [])
    }
    carregarDados()
  }, [selectedAluno])

  const chartData = resultados
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(-12)
    .map((r) => ({
      data: new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      rpe: r.rpe || 0,
      carga: r.carga || 0,
    }))

  const alunoSelecionado = alunos.find((a) => a.id === selectedAluno)
  const totalPresencas = frequencias.filter(f => f.presente).length

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Acompanhar Evolucao</h1>
        <p className="text-sm text-text-secondary">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Acompanhar Evolucao</h1>
        <p className="text-sm text-text-secondary">Dados reais de desempenho</p>
      </div>

      <select
        value={selectedAluno}
        onChange={(e) => setSelectedAluno(e.target.value)}
        className="glass-input w-full"
      >
        {alunos.map((a: any) => (
          <option key={a.id} value={a.id}>
            {a.usuario?.nome || 'Aluno'}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center space-y-1">
          <TrendingUp size={18} className="mx-auto text-accent" />
          <p className="text-xl font-bold text-text-primary">{resultados.length}</p>
          <p className="text-[10px] text-text-secondary">Resultados</p>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <Trophy size={18} className="mx-auto text-warning" />
          <p className="text-xl font-bold text-text-primary">{prs.length}</p>
          <p className="text-[10px] text-text-secondary">PRs</p>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <CalendarCheck size={18} className="mx-auto text-success" />
          <p className="text-xl font-bold text-text-primary">{totalPresencas}</p>
          <p className="text-[10px] text-text-secondary">Presencas</p>
        </GlassCard>
      </div>

      {chartData.length > 0 ? (
        <GlassCard className="p-5 space-y-3">
          <h3 className="font-semibold text-text-primary">Evolucao RPE / Carga</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rpeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="data" tick={{ fill: '#8B9DB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9DB0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131C25',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="rpe" stroke="#00E5FF" strokeWidth={2} fill="url(#rpeGrad)" name="RPE" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-text-secondary">Nenhum resultado registrado para este aluno.</p>
        </GlassCard>
      )}

      {prs.length > 0 && (
        <GlassCard className="p-5 space-y-3">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Trophy size={16} className="text-warning" />
            PRs de {alunoSelecionado?.usuario?.nome || 'Aluno'}
          </h3>
          <div className="space-y-2">
            {prs.slice(0, 5).map((pr) => (
              <div key={pr.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-sm text-text-primary">{pr.exercicio_nome || 'Exercicio'}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-accent">{pr.valor}{pr.unidade}</span>
                  <p className="text-[10px] text-text-secondary">{new Date(pr.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
