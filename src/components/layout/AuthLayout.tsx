import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function AuthLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const bgImage = isMobile ? '/login-bg-mobile.jpg' : '/login-bg-v2.jpg'

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${
        isLogin ? 'bg-no-repeat' : 'bg-bg-primary'
      }`}
      style={
        isLogin
          ? {
              backgroundImage: `url(${bgImage})`,
              backgroundSize: isMobile ? 'cover' : 'contain',
              backgroundPosition: isMobile ? 'center center' : 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#000',
            }
          : undefined
      }
    >
      <Outlet />
    </div>
  )
}
