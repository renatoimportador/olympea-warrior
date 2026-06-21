import { type ReactNode, createContext, useContext, useState } from 'react'
import type { Box } from '@/data/types'
import { boxPrincipal } from '@/data/seed'

interface BoxContextData {
  box: Box
  setBox: (b: Box) => void
}

const BoxContext = createContext<BoxContextData>({
  box: boxPrincipal,
  setBox: () => {},
})

export function BoxProvider({ children }: { children: ReactNode }) {
  const [box, setBox] = useState<Box>(boxPrincipal)

  return (
    <BoxContext.Provider value={{ box, setBox }}>
      {children}
    </BoxContext.Provider>
  )
}

export const useBox = () => useContext(BoxContext)
