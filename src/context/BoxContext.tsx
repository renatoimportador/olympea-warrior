import { type ReactNode, createContext, useContext, useState, useEffect } from 'react'
import type { Box } from '@/data/types'
import { getBox } from '@/lib/api'

const defaultBox: Box = {
  id: '',
  nome: 'OLYMPEA Warrior',
  slug: 'olympea-warrior',
  cor_primaria: '#00E5FF',
  cor_secundaria: '#00B8D4',
  cor_sucesso: '#34D399',
  cor_alerta: '#FBBF24',
  cor_erro: '#F87171',
  ativo: true,
  configuracoes: {},
  created_at: '',
  updated_at: '',
}

interface BoxContextData {
  box: Box
  setBox: (b: Box) => void
}

const BoxContext = createContext<BoxContextData>({
  box: defaultBox,
  setBox: () => {},
})

export function BoxProvider({ children }: { children: ReactNode }) {
  const [box, setBox] = useState<Box>(defaultBox)

  useEffect(() => {
    async function carregar() {
      try {
        const data = await getBox()
        if (data) setBox(data as Box)
      } catch {}
    }
    carregar()
  }, [])

  return (
    <BoxContext.Provider value={{ box, setBox }}>
      {children}
    </BoxContext.Provider>
  )
}

export const useBox = () => useContext(BoxContext)
