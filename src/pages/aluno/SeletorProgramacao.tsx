import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgramacao } from '@/context/ProgramacaoContext'
import { getAlunoByUsuarioId, getProgramacoesByAluno } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Dumbbell, ChevronRight, Check } from 'lucide-react'
import type { Programacao } from '@/data/types'

export function SeletorProgramacao() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { programacaoAtiva, setProgramacaoAtiva } = useProgramacao()
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      if (!user) { setLoading(false); return }
      try {
        const aluno = await getAlunoByUsuarioId(user.id)
        if (aluno) {
          const progs = await getProgramacoesByAluno(aluno.id)
          setProgramacoes(progs || [])
        }
      } catch (e) {
        console.error('Erro ao carregar programacoes:', e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Minhas Programacoes</h1>
        <p className="text-sm text-text-secondary">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Minhas Programacoes</h1>
        <p className="text-sm text-text-secondary">Selecione uma para visualizar</p>
      </div>

      <div className="space-y-3">
        {programacoes.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-text-secondary">Nenhuma programacao encontrada.</p>
          </GlassCard>
        )}
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
              programacaoAtiva?.id === prog.id ? 'bg-accent/10' : 'bg-white/[0.03]'
            }`}>
              <Dumbbell size={22} className={programacaoAtiva?.id === prog.id ? 'text-accent' : 'text-text-secondary'} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{prog.nome}</p>
              <p className="text-xs text-text-secondary">{prog.tipo}</p>
            </div>
            {programacaoAtiva?.id === prog.id ? (
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
