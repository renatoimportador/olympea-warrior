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

  const bgImage = isMobile ? '/login-bg-mobile.jpg' : '/login-bg.jpg'

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${
        isLogin
          ? 'bg-cover bg-center bg-no-repeat md:bg-[center_25%]'
          : 'bg-bg-primary'
      }`}
      style={
        isLogin
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
            }
          : undefined
      }
    >
      {isLogin && (
        <div className="fixed inset-0 bg-black/50 -z-10 pointer-events-none" />
      )}
      <Outlet />
    </div>
  )
}
