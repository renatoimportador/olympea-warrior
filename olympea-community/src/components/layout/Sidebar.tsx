import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCog, GraduationCap, CalendarDays, Layers,
  Calendar, Dumbbell, Flame, BarChart3, BookOpen, Trophy, Settings,
  Building2, Activity, TrendingUp, ClipboardCheck, MessageSquare,
  CalendarCheck, FileBarChart, X, Menu, LogOut,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useBox } from '@/context/BoxContext'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/data/types'

const iconMap: Record<string, React.FC<any>> = {
  LayoutDashboard, Users, UserCog, GraduationCap, CalendarDays, Layers,
  Calendar, Dumbbell, Flame, BarChart3, BookOpen, Trophy, Settings,
  Building2, Activity, TrendingUp, ClipboardCheck, MessageSquare,
  CalendarCheck, FileBarChart,
}

interface SidebarProps {
  role: UserRole
  items: { label: string; path: string; icon: string }[]
}

export function Sidebar({ items }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()
  const { box } = useBox()

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass-card p-2"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-bg-secondary border-r border-border-dark flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-border-dark flex items-center gap-3">
          <img src="/assets/logo.png" alt="OLYMPEA Warrior" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-gradient-accent leading-tight">
              {box.nome || 'OLYMPEA Warrior'}
            </h1>
            <p className="text-[10px] text-text-secondary">Sistema de Treino</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon] || Dumbbell
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                )}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border-dark">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-error hover:bg-error/5 transition-all w-full"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
