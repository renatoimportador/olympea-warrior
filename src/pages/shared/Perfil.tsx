import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { User, Edit3, Mail, Phone, Shield } from 'lucide-react'

export function Perfil() {
  const { user } = useAuth()

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary">Perfil</h1>

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-xl">
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{user?.nome}</h2>
            <Badge variant="accent">{user?.role === 'admin' ? 'Administrador' : user?.role === 'coach' ? 'Coach' : 'Aluno'}</Badge>
          </div>
          <button className="ml-auto p-2 rounded-xl hover:bg-white/[0.03]">
            <Edit3 size={18} className="text-text-secondary" />
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <User size={16} className="text-accent" />
          Dados Gerais
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
            <Mail size={16} className="text-text-secondary" />
            <div>
              <p className="text-xs text-text-secondary">Email</p>
              <p className="text-sm text-text-primary">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
            <Phone size={16} className="text-text-secondary" />
            <div>
              <p className="text-xs text-text-secondary">Telefone</p>
              <p className="text-sm text-text-primary">{user?.telefone || 'Nao cadastrado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
            <Shield size={16} className="text-text-secondary" />
            <div>
              <p className="text-xs text-text-secondary">Perfil</p>
              <p className="text-sm text-text-primary">{user?.role}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
