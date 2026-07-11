import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useBox } from '@/context/BoxContext'

export function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const { user, logout } = useAuth()
  const { box } = useBox()
  const navigate = useNavigate()

  return (
    <nav className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border-dark bg-bg-secondary/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gradient-accent lg:hidden">
          {box.nome || 'OLYMPEA Warrior'}
        </h1>

        <span className="text-xs text-text-secondary hidden lg:inline">
          {user?.role === 'admin'
            ? 'Administrador'
            : user?.role === 'coach'
            ? 'Coach'
            : 'Aluno'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {searchOpen && (
          <input
            type="text"
            placeholder="Buscar..."
            autoFocus
            onBlur={() => setSearchOpen(false)}
            className="glass-input w-40 md:w-56 text-sm"
          />
        )}

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          <Search size={18} className="text-text-secondary" />
        </button>

        <button
          onClick={() => navigate('/notificacoes')}
          className="relative p-2 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          <Bell size={18} className="text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-sm">
              {user?.nome?.charAt(0) || 'U'}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-card overflow-hidden">
              <button
                onClick={() => {
                  const role = user?.role
                  if (role === 'admin') navigate('/admin/configuracoes')
                  else if (role === 'coach') navigate('/coach/dashboard')
                  else navigate('/aluno/perfil')
                  setMenuOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.03] w-full text-left"
              >
                <User size={16} />
                Perfil
              </button>

              <button
                onClick={() => {
                  navigate('/notificacoes')
                  setMenuOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.03] w-full text-left"
              >
                <Bell size={16} />
                Notificações
              </button>

              <div className="border-t border-border-dark" />

              <button
                onClick={async () => {
                  await logout()
                  setMenuOpen(false)
                  navigate('/login')
                }}
                className="flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-error/5 w-full text-left"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
