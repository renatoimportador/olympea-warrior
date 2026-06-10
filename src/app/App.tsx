import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { BoxProvider } from '@/context/BoxContext'
import { ProgramacaoProvider } from '@/context/ProgramacaoContext'
import { AppRoutes } from './routes'
import { Toaster } from 'react-hot-toast'

export function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <BoxProvider>
            <ProgramacaoProvider>
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#131C25',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                  },
                }}
              />
            </ProgramacaoProvider>
          </BoxProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}
