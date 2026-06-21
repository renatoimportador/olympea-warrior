import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import type { UserRole } from '@/data/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  console.log('USER ROLE:', user.role)
  console.log('ROLES PERMITIDAS:', roles)

  if (!roles.includes(user.role)) {
    return <div>Sem permissão: {user.role}</div>
  }

  return <>{children}</>
}
