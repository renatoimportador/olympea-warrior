import { type ReactNode, createContext, useContext, useState } from 'react'
import type { Programacao } from '@/data/types'

const defaultProgramacao: Programacao = {
  id: 'prog-1',
  box_id: 'box-1',
  nome: 'CrossFit OLYMPEA',
  tipo: 'CROSSFIT',
  descricao: 'Programacao principal',
  data_inicio: '2024-06-01',
  data_fim: '2024-12-31',
  ativa: true,
  created_by: 'u-admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

interface ProgramacaoContextData {
  programacaoAtiva: Programacao
  setProgramacaoAtiva: (p: Programacao) => void
}

const ProgramacaoContext = createContext<ProgramacaoContextData>({
  programacaoAtiva: defaultProgramacao,
  setProgramacaoAtiva: () => {},
})

export function ProgramacaoProvider({ children }: { children: ReactNode }) {
  const [programacaoAtiva, setProgramacaoAtiva] = useState<Programacao>(defaultProgramacao)

  return (
    <ProgramacaoContext.Provider value={{ programacaoAtiva, setProgramacaoAtiva }}>
      {children}
    </ProgramacaoContext.Provider>
  )
}

export const useProgramacao = () => useContext(ProgramacaoContext)
