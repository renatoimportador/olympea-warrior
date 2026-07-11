import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { listarAlunos, getFrequenciasByAluno } from '@/lib/api'
import type { Frequencia } from '@/data/types'
import { CalendarCheck, Clock, UserCheck, UserX } from 'lucide-react'

export function FrequenciaAlunos() {
  const [frequenciasPorAluno, setFrequenciasPorAluno] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const alunosData = await listarAlunos()
        const alunosAtivos = (alunosData || []).filter((a: any) => a.ativo)

        const resultado = await Promise.all(
          alunosAtivos.map(async (a: any) => {
            const freq = await getFrequenciasByAluno(a.id)
            const presencas = (freq || []).filter((f: Frequencia) => f.presente).length
            const ultima = (freq || [])
              .filter((f: Frequencia) => f.presente)
              .sort((x: Frequencia, y: Frequencia) => new Date(y.data).getTime() - new Date(x.data).getTime())[0]
            return { ...a, freq: freq || [], presencas, ultima }
          })
        )

        setFrequenciasPorAluno(resultado)
      } catch (e) {
        console.error('Erro ao carregar frequencias:', e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Frequencia dos Alunos</h1>
        <p className="text-sm text-text-secondary">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Frequencia dos Alunos</h1>
        <p className="text-sm text-text-secondary">Acompanhamento de presenca</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 text-center space-y-1">
          <UserCheck size={18} className="mx-auto text-success" />
          <p className="text-xl font-bold text-text-primary">
            {frequenciasPorAluno.filter((a) => a.presencas > 0).length}
          </p>
          <p className="text-[10px] text-text-secondary">Alunos presentes</p>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <UserX size={18} className="mx-auto text-error" />
          <p className="text-xl font-bold text-text-primary">
            {frequenciasPorAluno.filter((a) => a.presencas === 0).length}
          </p>
          <p className="text-[10px] text-text-secondary">Sem registro</p>
        </GlassCard>
      </div>

      <div className="space-y-2">
        {frequenciasPorAluno.map((a) => (
          <GlassCard key={a.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center font-bold text-accent text-sm">
              {a.usuario?.nome?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{a.usuario?.nome || 'Aluno'}</p>
              <p className="text-xs text-text-secondary">
                Ultima presenca: {a.ultima ? new Date(a.ultima.data).toLocaleDateString('pt-BR') : 'Nunca'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-text-primary">{a.presencas}</p>
                <p className="text-[10px] text-text-secondary">presencas</p>
              </div>
              <Badge variant={a.presencas > 0 ? 'success' : 'error'}>
                {a.presencas > 0 ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
