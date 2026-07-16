import { useState, useEffect } from 'react'
import {
  Users, UserCog, GraduationCap, CalendarCheck, Flame, Trophy,
  TrendingUp, Activity, ArrowUpRight,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  listarUsuarios, listarAlunos, listarCoaches, listarProgramacoes,
  listarResultadosByAluno, listarFasesByProg, listarSemanasByFase,
} from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { Usuario, Aluno, Coach, Programacao, Resultado, Fase, Semana } from '@/data/types'

function formatarResultadoAdmin(r: Resultado): string {
  if (r.tempo) return r.tempo
  if (r.carga) return `${r.carga} kg`
  if (r.rounds != null) return `${r.rounds} rounds${r.repeticoes ? ` + ${r.repeticoes} reps` : ''}`
  return '--'
}

export function DashboardAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [u, a, c, p] = await Promise.all([
          listarUsuarios(),
          listarAlunos(),
          listarCoaches(),
          listarProgramacoes(),
        ])
        setUsuarios(u)
        setAlunos(a)
        setCoaches(c)
        setProgramacoes(p)

        // Buscar IDs de treinos existentes para filtrar resultados órfãos
        const { data: treinosExistentes } = await supabase
          .from('treinos')
          .select('id')
        const treinoIds = new Set((treinosExistentes || []).map((t: any) => t.id))

        // Buscar resultados de todos os alunos, filtrando órfãos
        const allResultados: Resultado[] = []
        for (const al of a) {
          const r = await listarResultadosByAluno(al.id)
          // Manter apenas resultados cujo treino_id existe
          const validos = r.filter((res: any) => res.treino_id && treinoIds.has(res.treino_id))
          allResultados.push(...validos)
        }
        setResultados(allResultados)

        // Buscar fases e semanas
        const allFases: Fase[] = []
        const allSemanas: Semana[] = []
        for (const prog of p) {
          const f = await listarFasesByProg(prog.id)
          allFases.push(...f)
          for (const fa of f) {
            const s = await listarSemanasByFase(fa.id)
            allSemanas.push(...s)
          }
        }
        setFases(allFases)
        setSemanas(allSemanas)
      } catch (e) {
        console.error('Erro ao carregar dashboard:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalUsuarios = usuarios.filter(
    (u: any) => u.ativo && u.auth_id && u.box_id
  ).length

  const totalAlunos = alunos.filter((a: any) => a.ativo).length
  const totalCoaches = coaches.filter((c: any) => c.ativo).length
  const totalProgramacoes = programacoes.filter((p) => p.ativa).length
  const totalResultados = resultados.length
  const totalFases = fases.filter((f) => f.ativa).length
  const totalSemanas = semanas.filter((s) => s.ativa).length

  const stats = [
    { label: 'Total Usuarios', value: String(totalUsuarios), icon: Users, change: `${totalUsuarios}`, color: 'text-accent' },
    { label: 'Total Alunos', value: String(totalAlunos), icon: GraduationCap, change: `${totalAlunos}`, color: 'text-success' },
    { label: 'Total Coaches', value: String(totalCoaches), icon: UserCog, change: `${totalCoaches}`, color: 'text-warning' },
    { label: 'Resultados', value: String(totalResultados), icon: CalendarCheck, change: `${totalResultados}`, color: 'text-accent' },
  ]

  const crescimentoData = [
    { mes: 'Prog', total: totalProgramacoes },
    { mes: 'Fases', total: totalFases },
    { mes: 'Semanas', total: totalSemanas },
    { mes: 'Alunos', total: totalAlunos },
    { mes: 'Coach', total: totalCoaches },
    { mes: 'Res', total: totalResultados },
  ]

  const recentActivity = resultados.slice(-5).reverse().map((r) => ({
    action: `Resultado: ${formatarResultadoAdmin(r)}`,
    user: alunos.find((a) => a.id === r.aluno_id)?.usuario?.nome ||
          alunos.find((a) => a.id === r.aluno_id)?.nome || 'Aluno',
    time: new Date(r.data).toLocaleDateString('pt-BR'),
  }))

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Dashboard Administrativo</h1>
          <p className="text-text-secondary">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard Administrativo</h1>
        <p className="text-text-secondary">Visao geral completa do sistema OLYMPEA</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <GlassCard key={s.label} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center">
                  <Icon size={18} className={s.color} />
                </div>
                <span className="text-xs font-medium text-success flex items-center gap-0.5">
                  <ArrowUpRight size={12} />
                  {s.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-secondary">{s.label}</p>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              Panorama do Sistema
            </h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crescimentoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9DB0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131C25',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="total" fill="#00E5FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              Atividade Recente
            </h2>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">{a.action}</p>
                  <p className="text-xs text-text-secondary">{a.user}</p>
                </div>
                <span className="text-[10px] text-text-secondary whitespace-nowrap">{a.time}</span>
              </div>
            )) : (
              <p className="text-sm text-text-secondary text-center py-6">Nenhuma atividade recente.</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Rankings e Treinos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-6 space-y-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Trophy size={16} className="text-warning" />
            Ultimos Resultados RX
          </h2>
          <div className="space-y-2">
            {resultados.filter((r) => r.categoria === 'RX').slice(-5).reverse().map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-warning/15 text-warning' : i === 1 ? 'bg-text-secondary/15 text-text-secondary' : i === 2 ? 'bg-orange-500/15 text-orange-500' : 'bg-white/[0.03] text-text-secondary'
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm text-text-primary flex-1">
                  {alunos.find((a) => a.id === r.aluno_id)?.usuario?.nome ||
                   alunos.find((a) => a.id === r.aluno_id)?.nome || 'Aluno'}
                  {' — '}
                  {formatarResultadoAdmin(r)}
                </span>
                {r.rpe && (
                  <span className="text-xs text-text-secondary">RPE {r.rpe}</span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Flame size={16} className="text-accent" />
            Programacoes Ativas
          </h2>
          <div className="space-y-2">
            {programacoes.filter((p) => p.ativa).map((prog) => (
              <div key={prog.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-sm text-text-primary">{prog.nome}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-accent" style={{ width: '90%' }} />
                  </div>
                  <span className="text-xs text-text-secondary w-8">Ativa</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
