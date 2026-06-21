import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

const coachItems = [
  { label: 'Dashboard', path: '/coach/dashboard', icon: 'LayoutDashboard' },
  { label: 'Alunos', path: '/coach/alunos', icon: 'Users' },
  { label: 'Evolucao', path: '/coach/evolucao', icon: 'TrendingUp' },
  { label: 'Resultados', path: '/coach/resultados', icon: 'ClipboardCheck' },
  { label: 'Comentarios', path: '/coach/comentarios', icon: 'MessageSquare' },
  { label: 'Frequencia', path: '/coach/frequencia', icon: 'CalendarCheck' },
  { label: 'Rankings', path: '/coach/rankings', icon: 'Trophy' },
  { label: 'Relatorios', path: '/coach/relatorios', icon: 'FileBarChart' },
]

export function CoachLayout() {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role="coach" items={coachItems} />
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
