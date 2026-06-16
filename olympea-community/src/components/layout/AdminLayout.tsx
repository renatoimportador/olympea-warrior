import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

const adminItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Usuarios', path: '/admin/usuarios', icon: 'Users' },
  { label: 'Coaches', path: '/admin/coaches', icon: 'UserCog' },
  { label: 'Alunos', path: '/admin/alunos', icon: 'GraduationCap' },
  { label: 'Programacao', path: '/admin/programacao', icon: 'CalendarDays' },
  { label: 'Fases', path: '/admin/fases', icon: 'Layers' },
  { label: 'Semanas', path: '/admin/semanas', icon: 'Calendar' },
  { label: 'Treinos', path: '/admin/treinos', icon: 'Dumbbell' },
  { label: 'WODs', path: '/admin/wods', icon: 'Flame' },
  { label: 'Niveis', path: '/admin/niveis', icon: 'BarChart3' },
  { label: 'Biblioteca', path: '/admin/biblioteca', icon: 'BookOpen' },
  { label: 'Rankings', path: '/admin/rankings', icon: 'Trophy' },
  { label: 'Configuracoes', path: '/admin/configuracoes', icon: 'Settings' },
  { label: 'Box', path: '/admin/box', icon: 'Building2' },
  { label: 'Auditoria', path: '/admin/auditoria', icon: 'Activity' },
]

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role="admin" items={adminItems} />
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
