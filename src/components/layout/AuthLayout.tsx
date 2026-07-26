import { Outlet, useLocation } from 'react-router-dom'

export function AuthLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

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
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(/login-bg.jpg)',
            }
          : undefined
      }
    >
      {isLogin && (
        <div className="fixed inset-0 bg-black/65 -z-10 pointer-events-none" />
      )}
      <Outlet />
    </div>
  )
}
