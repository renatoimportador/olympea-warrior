import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import type { UserRole } from '@/data/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  console.log('PROTECTED ROUTE')
  console.log('LOADING:', loading)
  console.log('USER:', user)
  console.log('ROLES PERMITIDAS:', roles)

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    console.log('BLOQUEADO: user null')
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(user.role)) {
    console.log('BLOQUEADO: role inválida ->', user.role)
    return <div>Sem permissão: {user.role}</div>
  }

  console.log('LIBERADO')
  return <>{children}</>
}
