import { Outlet } from 'react-router-dom'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNav } from '@/components/layout/BottomNav'

export function AlunoLayout() {
  return (
    <div className="flex min-h-screen bg-bg-primary flex-col">
      <Topbar />
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
