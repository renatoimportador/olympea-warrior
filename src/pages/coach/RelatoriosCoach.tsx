import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  FileBarChart,
  TrendingUp,
  Users,
  CalendarCheck,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  listarAlunos,
  listarResultadosByAluno,
  getFrequenciasByAluno,
  getPRsByAluno,
} from '@/lib/api'

export function RelatoriosCoach() {
  const [stats, setStats] = useState({
    alunos: 0,
    evolucao: 0,
    frequencia: 0,
    prs: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const alunosData = await listarAlunos()
        const alunosAtivos = (alunosData || []).filter((a) => a.ativo)

        let totalResultados = 0
        let totalPresencas = 0
        let totalFrequencias = 0
        let totalPRs = 0

        for (const aluno of alunosAtivos) {
          const [resultados, frequencias, prs] =
            await Promise.all([
              listarResultadosByAluno(aluno.id),
              getFrequenciasByAluno(aluno.id),
              getPRsByAluno(aluno.id),
            ])

          totalResultados += resultados?.length || 0
          totalPRs += prs?.length || 0

          totalFrequencias += frequencias?.length || 0
          totalPresencas +=
            frequencias?.filter((f) => f.presente).length || 0
        }

        const taxaEvolucao =
          alunosAtivos.length > 0
            ? Math.round(
                (totalResultados / alunosAtivos.length) * 10
              )
            : 0

        const frequenciaMedia =
          totalFrequencias > 0
            ? Math.round(
                (totalPresencas / totalFrequencias) * 100
              )
            : 0

        setStats({
          alunos: alunosAtivos.length,
          evolucao: taxaEvolucao,
          frequencia: frequenciaMedia,
          prs: totalPRs,
        })
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">
          Carregando relatórios...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Relatórios
        </h1>

        <p className="text-sm text-text-secondary">
          Relatórios e estatísticas dos seus alunos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 space-y-2">
          <Users size={16} className="text-accent" />
          <p className="text-2xl font-bold text-text-primary">
            {stats.alunos}
          </p>
          <p className="text-xs text-text-secondary">
            Alunos vinculados
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <TrendingUp size={16} className="text-success" />
          <p className="text-2xl font-bold text-text-primary">
            {stats.evolucao}%
          </p>
          <p className="text-xs text-text-secondary">
            Taxa de evolução
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <CalendarCheck size={16} className="text-warning" />
          <p className="text-2xl font-bold text-text-primary">
            {stats.frequencia}%
          </p>
          <p className="text-xs text-text-secondary">
            Frequência média
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <Trophy size={16} className="text-secondary" />
          <p className="text-2xl font-bold text-text-primary">
            {stats.prs}
          </p>
          <p className="text-xs text-text-secondary">
            PRs registrados
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <FileBarChart size={16} className="text-accent" />
          Relatórios Disponíveis
        </h3>

        <div className="space-y-2">
          {[
            {
              label: 'Evolução dos Alunos',
              desc: 'Progresso geral no sistema',
            },
            {
              label: 'Frequência por Aluno',
              desc: 'Controle de presença',
            },
            {
              label: 'Performance por Categoria',
              desc: 'RX / Scaling / Beginner',
            },
            {
              label: 'PRs Conquistados',
              desc: 'Recordes pessoais',
            },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {r.label}
                </p>

                <p className="text-xs text-text-secondary">
                  {r.desc}
                </p>
              </div>

              <Badge variant="accent">Gerar</Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
