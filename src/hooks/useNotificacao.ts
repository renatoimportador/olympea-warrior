import { useState, useEffect, useMemo } from 'react'
import { listarNotificacoesByUsuario } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Notificacao } from '@/data/types'

export function useNotificacoes() {
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])

  useEffect(() => {
    async function carregar() {
      if (!user) return
      const data = await listarNotificacoesByUsuario(user.id)
      setNotificacoes(data)
    }
    carregar()

    const interval = setInterval(carregar, 30000)
    return () => clearInterval(interval)
  }, [user])

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida), [notificacoes])

  return { notificacoes, naoLidas, setNotificacoes }
}
