import { type ReactNode, createContext, useContext, useState, useEffect } from 'react'
import type { Programacao } from '@/data/types'
import { listarProgramacoes } from '@/lib/api'

const [programacaoAtiva, setProgramacaoAtiva] = useState<Programacao | null>(null)

useEffect(() => {
  async function load() {
    try {
      const progs = await listarProgramacoes()
      const ativa = progs.find(p => p.ativa) || progs[0] || null
      setProgramacaoAtiva(ativa)
    } catch (e) {
      setProgramacaoAtiva(null)
    }
  }

  load()
}, [])

interface ProgramacaoContextData {
  programacaoAtiva: Programacao | null
  setProgramacaoAtiva: (p: Programacao) => void
}

const ProgramacaoContext = createContext<ProgramacaoContextData>({
  programacaoAtiva: null as any,
  setProgramacaoAtiva: () => {},
})

export function ProgramacaoProvider({ children }: { children: ReactNode }) {
  const [programacaoAtiva, setProgramacaoAtiva] = useState<Programacao | null>(null)
  return (
    <ProgramacaoContext.Provider value={{ programacaoAtiva, setProgramacaoAtiva }}>
      {children}
    </ProgramacaoContext.Provider>
  )
}

export const useProgramacao = () => useContext(ProgramacaoContext)
