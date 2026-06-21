import { type ReactNode, createContext, useContext, useState } from 'react'

interface ThemeContextData {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextData>({
  dark: true,
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true)
  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
