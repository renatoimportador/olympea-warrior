import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { alunos, usuarios } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'
import { User, TrendingUp, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AlunosVinculados() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const alunosVinculados = alunos.filter((a) => a.ativo)
    .map((a) => {
      const u = usuarios.find((u) => u.id === a.usuario_id)
      return { ...a, usuario: u }
    })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Alunos Vinculados</h1>
        <p className="text-sm text-text-secondary">{alunosVinculados.length} alunos sob sua responsabilidade</p>
      </div>

      <div className="space-y-2">
        {alunosVinculados.map((a) => (
          <GlassCard
            key={a.id}
            className="p-4 flex items-center gap-4 cursor-pointer group"
            onClick={() => navigate(`/coach/evolucao?aluno=${a.id}`)}
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center font-bold text-accent">
              {a.usuario?.nome?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{a.usuario?.nome}</p>
              <p className="text-xs text-text-secondary">{a.usuario?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-text-secondary">Categoria</p>
                <Badge variant={a.categoria === 'RX' ? 'accent' : a.categoria === 'SCALING' ? 'warning' : 'success'}>
                  {a.categoria}
                </Badge>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                <TrendingUp size={16} className="text-text-secondary" />
              </div>
            </div>
            <ChevronRight size={18} className="text-text-secondary group-hover:text-accent transition-colors" />
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
