import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { alunos, usuarios, frequencias } from '@/data/seed'
import { CalendarCheck, Clock, UserCheck, UserX } from 'lucide-react'

export function FrequenciaAlunos() {
  const frequenciasPorAluno = alunos.filter((a) => a.ativo).map((a) => {
    const u = usuarios.find((u) => u.id === a.usuario_id)
    const freq = frequencias.filter((f) => f.aluno_id === a.id)
    const presencas = freq.filter((f) => f.presente).length
    const ultima = freq.filter((f) => f.presente).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
    return { ...a, usuario: u, freq, presencas, ultima }
  })

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
              <p className="text-sm font-medium text-text-primary">{a.usuario?.nome}</p>
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
