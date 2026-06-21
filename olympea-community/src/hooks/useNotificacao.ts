import { useMemo } from 'react'
import { getNotificacoesByUsuario } from '@/data/seed'
import { useAuth } from '@/context/AuthContext'

export function useNotificacoes() {
  const { user } = useAuth()
  const notificacoes = useMemo(() => {
    if (!user) return []
    return getNotificacoesByUsuario(user.id)
  }, [user])

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida), [notificacoes])

  return { notificacoes, naoLidas }
}
