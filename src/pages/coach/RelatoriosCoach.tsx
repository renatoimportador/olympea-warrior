import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  FileBarChart,
  TrendingUp,
  Users,
  CalendarCheck,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  listarAlunos,
  listarResultadosByAluno,
  getFrequenciasByAluno,
  getPRsByAluno,
} from '@/lib/api'
import type { Resultado, Frequencia, PersonalRecord } from '@/data/types'

export function RelatoriosCoach() {
  const [stats, setStats] = useState({
    alunos: 0,
    evolucao: 0,
    frequencia: 0,
    prs: 0,
  })

  const [loading, setLoading] = useState(true)
  const [alunosData, setAlunosData] = useState<any[]>([])
  const [allResultados, setAllResultados] = useState<Record<string, Resultado[]>>({})
  const [allFrequencias, setAllFrequencias] = useState<Record<string, Frequencia[]>>({})
  const [allPRs, setAllPRs] = useState<Record<string, PersonalRecord[]>>({})
  const [relatorioAberto, setRelatorioAberto] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const alunosRaw = await listarAlunos()
        const alunosAtivos = (alunosRaw || []).filter((a: any) => a.ativo)
        setAlunosData(alunosAtivos)

        let totalResultados = 0
        let totalPresencas = 0
        let totalFrequencias = 0
        let totalPRs = 0

        const resMap: Record<string, Resultado[]> = {}
        const freqMap: Record<string, Frequencia[]> = {}
        const prMap: Record<string, PersonalRecord[]> = {}

        for (const aluno of alunosAtivos) {
          const [resultados, frequencias, prs] = await Promise.all([
            listarResultadosByAluno(aluno.id),
            getFrequenciasByAluno(aluno.id),
            getPRsByAluno(aluno.id),
          ])

          resMap[aluno.id] = resultados || []
          freqMap[aluno.id] = frequencias || []
          prMap[aluno.id] = prs || []

          totalResultados += resultados?.length || 0
          totalPRs += prs?.length || 0
          totalFrequencias += frequencias?.length || 0
          totalPresencas += frequencias?.filter((f: Frequencia) => f.presente).length || 0
        }

        setAllResultados(resMap)
        setAllFrequencias(freqMap)
        setAllPRs(prMap)

        const taxaEvolucao = alunosAtivos.length > 0
          ? Math.round((totalResultados / alunosAtivos.length) * 10)
          : 0

        const frequenciaMedia = totalFrequencias > 0
          ? Math.round((totalPresencas / totalFrequencias) * 100)
          : 0

        setStats({
          alunos: alunosAtivos.length,
          evolucao: taxaEvolucao,
          frequencia: frequenciaMedia,
          prs: totalPRs,
        })
      } catch (error) {
        console.error('Erro ao carregar relatorios:', error)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  function toggleRelatorio(label: string) {
    setRelatorioAberto(relatorioAberto === label ? null : label)
  }

  function renderRelatorio(label: string) {
    if (relatorioAberto !== label) return null

    if (label === 'Evolucao dos Alunos') {
      return (
        <div className="mt-3 space-y-2 p-3 rounded-xl bg-white/[0.01]">
          {alunosData.map((a: any) => {
            const res = allResultados[a.id] || []
            return (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-text-primary">{a.usuario?.nome || 'Aluno'}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-accent">{res.length}</span>
                  <span className="text-xs text-text-secondary ml-1">resultados</span>
                </div>
              </div>
            )
          })}
          {alunosData.length === 0 && <p className="text-sm text-text-secondary text-center">Nenhum aluno</p>}
        </div>
      )
    }

    if (label === 'Frequencia por Aluno') {
      return (
        <div className="mt-3 space-y-2 p-3 rounded-xl bg-white/[0.01]">
          {alunosData.map((a: any) => {
            const freq = allFrequencias[a.id] || []
            const presencas = freq.filter((f: Frequencia) => f.presente).length
            const taxa = freq.length > 0 ? Math.round((presencas / freq.length) * 100) : 0
            return (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-text-primary">{a.usuario?.nome || 'Aluno'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-accent">{taxa}%</span>
                  <span className="text-xs text-text-secondary">({presencas}/{freq.length})</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (label === 'Performance por Categoria') {
      const categorias: Record<string, { total: number; resultados: number }> = {}
      alunosData.forEach((a: any) => {
        const cat = a.categoria || 'SEM CATEGORIA'
        if (!categorias[cat]) categorias[cat] = { total: 0, resultados: 0 }
        categorias[cat].total++
        categorias[cat].resultados += (allResultados[a.id] || []).length
      })
      return (
        <div className="mt-3 space-y-2 p-3 rounded-xl bg-white/[0.01]">
          {Object.entries(categorias).map(([cat, data]) => (
            <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{cat}</Badge>
                <span className="text-xs text-text-secondary">{data.total} alunos</span>
              </div>
              <span className="text-sm font-bold text-accent">{data.resultados} resultados</span>
            </div>
          ))}
        </div>
      )
    }

    if (label === 'PRs Conquistados') {
      const todosPRs: (PersonalRecord & { nomeAluno: string })[] = []
      alunosData.forEach((a: any) => {
        (allPRs[a.id] || []).forEach((pr) => {
          todosPRs.push({ ...pr, nomeAluno: a.usuario?.nome || 'Aluno' })
        })
      })
      todosPRs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      return (
        <div className="mt-3 space-y-2 p-3 rounded-xl bg-white/[0.01]">
          {todosPRs.slice(0, 15).map((pr) => (
            <div key={pr.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <div>
                <span className="text-sm text-text-primary">{pr.nomeAluno}</span>
                <span className="text-xs text-text-secondary ml-2">{pr.exercicio_nome || 'Exercicio'}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-accent">{pr.valor}{pr.unidade}</span>
                <p className="text-[10px] text-text-secondary">{new Date(pr.data).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ))}
          {todosPRs.length === 0 && <p className="text-sm text-text-secondary text-center">Nenhum PR registrado</p>}
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">Carregando relatorios...</p>
      </div>
    )
  }

  const relatorios = [
    { label: 'Evolucao dos Alunos', desc: 'Progresso geral no sistema' },
    { label: 'Frequencia por Aluno', desc: 'Controle de presenca' },
    { label: 'Performance por Categoria', desc: 'RX / Scaling / Beginner' },
    { label: 'PRs Conquistados', desc: 'Recordes pessoais' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Relatorios</h1>
        <p className="text-sm text-text-secondary">Relatorios e estatisticas dos seus alunos</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 space-y-2">
          <Users size={16} className="text-accent" />
          <p className="text-2xl font-bold text-text-primary">{stats.alunos}</p>
          <p className="text-xs text-text-secondary">Alunos vinculados</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <TrendingUp size={16} className="text-success" />
          <p className="text-2xl font-bold text-text-primary">{stats.evolucao}%</p>
          <p className="text-xs text-text-secondary">Taxa de evolucao</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <CalendarCheck size={16} className="text-warning" />
          <p className="text-2xl font-bold text-text-primary">{stats.frequencia}%</p>
          <p className="text-xs text-text-secondary">Frequencia media</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-2">
          <Trophy size={16} className="text-secondary" />
          <p className="text-2xl font-bold text-text-primary">{stats.prs}</p>
          <p className="text-xs text-text-secondary">PRs registrados</p>
        </GlassCard>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <FileBarChart size={16} className="text-accent" />
          Relatorios Disponiveis
        </h3>

        <div className="space-y-2">
          {relatorios.map((r) => (
            <div key={r.label}>
              <div
                onClick={() => toggleRelatorio(r.label)}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{r.label}</p>
                  <p className="text-xs text-text-secondary">{r.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">Gerar</Badge>
                  {relatorioAberto === r.label ? (
                    <ChevronUp size={16} className="text-text-secondary" />
                  ) : (
                    <ChevronDown size={16} className="text-text-secondary" />
                  )}
                </div>
              </div>
              {renderRelatorio(r.label)}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
