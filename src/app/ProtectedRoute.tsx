import { useAuth } from '@/context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '@/data/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          <p className="text-sm text-text-secondary">Carregando sessao...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
