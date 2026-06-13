import { useNavigate } from 'react-router-dom'
import { useProgramacao } from '@/context/ProgramacaoContext'
import { getProgramacoesByAluno } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Dumbbell, ChevronRight, Check } from 'lucide-react'

export function SeletorProgramacao() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { programacaoAtiva, setProgramacaoAtiva } = useProgramacao()

  const aluno = user ? { id: 'a-1' } : undefined // usuario mock
  const programacoes = aluno ? getProgramacoesByAluno(aluno.id) : []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Minhas Programacoes</h1>
        <p className="text-sm text-text-secondary">Selecione uma para visualizar</p>
      </div>

      <div className="space-y-3">
        {programacoes.map((prog) => (
          <GlassCard
            key={prog.id}
            className="p-4 flex items-center gap-4 cursor-pointer"
            onClick={() => {
              setProgramacaoAtiva(prog)
              navigate('/aluno/programacao')
            }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              programacaoAtiva.id === prog.id ? 'bg-accent/10' : 'bg-white/[0.03]'
            }`}>
              <Dumbbell size={22} className={programacaoAtiva.id === prog.id ? 'text-accent' : 'text-text-secondary'} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{prog.nome}</p>
              <p className="text-xs text-text-secondary">{prog.tipo}</p>
            </div>
            {programacaoAtiva.id === prog.id ? (
              <Check size={18} className="text-success" />
            ) : (
              <ChevronRight size={18} className="text-text-secondary" />
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
