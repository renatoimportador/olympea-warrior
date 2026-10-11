import { useNavigate } from 'react-router-dom'
import {
  Dumbbell,
  History,
  LogOut,
  Medal,
  TrendingUp,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface MenuLateralProps {
  aberto: boolean
  onFechar: () => void
}

interface ItemMenu {
  label: string
  path: string
  icon: typeof Zap
}

/* Menu lateral do aluno (Etapa 4.3): acessos as funcionalidades existentes,
   agrupados por secao. Todas as rotas sao reais e ja existentes no app. */
const SECOES: Array<{ titulo: string; itens: ItemMenu[] }> = [
  {
    titulo: 'Treinamento',
    itens: [
      { label: 'Recordes pessoais', path: '/aluno/prs', icon: Zap },
      { label: 'Historico de treinos', path: '/aluno/historico', icon: History },
      { label: 'Resultados', path: '/aluno/evolucao', icon: TrendingUp },
    ],
  },
  {
    titulo: 'Competicao',
    itens: [
      { label: 'Rankings', path: '/aluno/rankings', icon: Trophy },
      { label: 'Campeonatos', path: '/aluno/campeonatos', icon: Medal },
    ],
  },
  {
    titulo: 'Conta',
    itens: [{ label: 'Perfil', path: '/aluno/perfil', icon: User }],
  },
]

export function MenuLateral({ aberto, onFechar }: MenuLateralProps) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  if (!aberto) return null

  const ir = (path: string) => {
    onFechar()
    navigate(path)
  }

  const sair = async () => {
    onFechar()
    await logout()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onFechar}
      />

      {/* Painel deslizante */}
      <aside className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-bg-secondary border-l border-border-dark shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-sm flex-shrink-0">
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {user?.nome || 'Aluno'}
              </p>
              <p className="text-xs text-text-secondary flex items-center gap-1">
                <Dumbbell size={11} />
                Olympea Warrior
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="text-text-secondary hover:text-text-primary p-1.5"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {SECOES.map((secao) => (
            <div key={secao.titulo} className="mb-2">
              <p className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                {secao.titulo}
              </p>
              {secao.itens.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => ir(item.path)}
                    className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.03] transition text-left"
                  >
                    <Icon size={17} className="text-accent/80" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <button
            onClick={sair}
            className="flex items-center gap-3 w-full px-2 py-2.5 text-sm text-error hover:bg-error/5 rounded-xl transition"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>
    </div>
  )
}
