import { type ReactNode, createContext, useContext, useState } from 'react'
import type { Programacao } from '@/data/types'

interface ProgramacaoContextData {
  programacaoAtiva: Programacao | null
  setProgramacaoAtiva: (p: Programacao | null) => void
}

const ProgramacaoContext = createContext<ProgramacaoContextData>({
  programacaoAtiva: null,
  setProgramacaoAtiva: () => {},
})

export function ProgramacaoProvider({ children }: { children: ReactNode }) {
  const [programacaoAtiva, setProgramacaoAtiva] = useState<Programacao | null>(null)

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
