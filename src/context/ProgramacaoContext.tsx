import { type ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Programacao } from '@/data/types'
import { useAuth } from '@/context/AuthContext'

interface ProgramacaoContextData {
  programacaoAtiva: Programacao | null
  setProgramacaoAtiva: (p: Programacao | null) => void
}

const ProgramacaoContext = createContext<ProgramacaoContextData>({
  programacaoAtiva: null,
  setProgramacaoAtiva: () => {}
})

// Chave base: a selecao persistida e vinculada a identidade autenticada
// (usuarios diferentes no mesmo navegador nunca compartilham a escolha)
const STORAGE_KEY_PREFIX = 'olympea:programacao-ativa'

export function ProgramacaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const storageKey = `${STORAGE_KEY_PREFIX}:${user?.id ?? 'anon'}`

  const [programacaoAtiva, setProgramacaoAtivaState] = useState<Programacao | null>(null)

  // (Re)carrega a selecao persistida sempre que a identidade autenticada muda
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setProgramacaoAtivaState(raw ? (JSON.parse(raw) as Programacao) : null)
    } catch {
      setProgramacaoAtivaState(null)
    }
  }, [storageKey])

  // Sincroniza a selecao entre abas abertas (apenas para a chave do usuario atual)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== storageKey) return
      try {
        setProgramacaoAtivaState(e.newValue ? (JSON.parse(e.newValue) as Programacao) : null)
      } catch {
        setProgramacaoAtivaState(null)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [storageKey])

  const setProgramacaoAtiva = useCallback(
    (p: Programacao | null) => {
      setProgramacaoAtivaState(p)
      try {
        if (p) localStorage.setItem(storageKey, JSON.stringify(p))
        else localStorage.removeItem(storageKey)
      } catch {
        // localStorage indisponivel: mantem apenas em memoria
      }
    },
    [storageKey]
  )

  return (
    <ProgramacaoContext.Provider
      value={{
        programacaoAtiva,
        setProgramacaoAtiva
      }}
    >
      {children}
    </ProgramacaoContext.Provider>
  )
}

export const useProgramacao = () => useContext(ProgramacaoContext)
