import { NavLink, useLocation } from 'react-router-dom'
import { Home, Dumbbell, Zap, User } from 'lucide-react'

const navItems = [
  { label: 'Inicio', path: '/aluno/dashboard', icon: Home },
  { label: 'Treino', path: '/aluno/treino', icon: Dumbbell },
  { label: 'PRs', path: '/aluno/prs', icon: Zap },
  { label: 'Perfil', path: '/aluno/perfil', icon: User },
]

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary/90 backdrop-blur-xl border-t border-border-dark md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                isActive ? 'text-accent' : 'text-text-secondary'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
