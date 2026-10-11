import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CalendarCheck, Dumbbell, Menu, MessagesSquare, User } from 'lucide-react'
import { MenuLateral } from './MenuLateral'

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/* Navegacao inferior do aluno (Etapa 4.3): Feed, Check-in, WOD (destaque
   central), Perfil e Menu lateral. Visivel em celulares e computadores —
   no desktop fica centralizada, sem duplicar a Topbar.
   Rotas reutilizadas (nenhuma pagina nova de treino/check-in/perfil):
   - Feed     -> /aluno/comunidade
   - Check-in -> /aluno/box/aulas (aulas e reservas do Box Presencial)
   - WOD      -> /aluno/treino (programacao ativa; o seletor de modalidade
                 existente cobre alunos com uma ou duas inscricoes)
   - Perfil   -> /aluno/perfil */
const WOD_PATHS = [
  '/aluno/treino',
  '/aluno/programacao',
  '/aluno/resultado',
  '/aluno/seletor-programacao',
]

export function BottomNav() {
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  const feedAtivo = location.pathname.startsWith('/aluno/comunidade')
  const checkinAtivo =
    location.pathname.startsWith('/aluno/box') ||
    location.pathname.startsWith('/aluno/checkin')
  const wodAtivo = WOD_PATHS.some((p) => location.pathname.startsWith(p))
  const perfilAtivo = location.pathname.startsWith('/aluno/perfil')

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary/90 backdrop-blur-xl border-t border-border-dark">
        <div className="flex items-end justify-around py-2 max-w-md mx-auto">
          {/* 1. Feed */}
          <NavLink
            to="/aluno/comunidade"
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
              feedAtivo ? 'text-accent' : 'text-text-secondary'
            )}
          >
            <MessagesSquare size={20} />
            <span className="text-[10px] font-medium">Feed</span>
          </NavLink>

          {/* 2. Check-in */}
          <NavLink
            to="/aluno/box/aulas"
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
              checkinAtivo ? 'text-accent' : 'text-text-secondary'
            )}
          >
            <CalendarCheck size={20} />
            <span className="text-[10px] font-medium">Check-in</span>
          </NavLink>

          {/* 3. WOD — destaque central */}
          <NavLink
            to="/aluno/treino"
            className="flex flex-col items-center -mt-5"
            aria-label="WOD"
          >
            <span
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg transition-all',
                wodAtivo
                  ? 'bg-gradient-accent text-bg-primary border-accent shadow-accent/25'
                  : 'bg-bg-secondary text-accent border-accent/40'
              )}
            >
              <Dumbbell size={26} />
            </span>
            <span
              className={cn(
                'text-[10px] font-bold mt-1',
                wodAtivo ? 'text-accent' : 'text-text-secondary'
              )}
            >
              WOD
            </span>
          </NavLink>

          {/* 4. Perfil */}
          <NavLink
            to="/aluno/perfil"
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
              perfilAtivo ? 'text-accent' : 'text-text-secondary'
            )}
          >
            <User size={20} />
            <span className="text-[10px] font-medium">Perfil</span>
          </NavLink>

          {/* 5. Menu lateral */}
          <button
            onClick={() => setMenuAberto(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
              menuAberto ? 'text-accent' : 'text-text-secondary'
            )}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      <MenuLateral aberto={menuAberto} onFechar={() => setMenuAberto(false)} />
    </>
  )
}
