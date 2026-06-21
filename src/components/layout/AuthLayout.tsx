import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-bg-primary items-center justify-center p-4">
      <Outlet />
    </div>
  )
}
