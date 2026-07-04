import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import type { Aluno } from '@/data/types'
import { getAlunoByUsuarioId } from '@/lib/api'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Edit3, Phone, AlertTriangle, Shield, Target, User, Ruler, Weight } from 'lucide-react'

export function MeuPerfil() {
  const { user } = useAuth()
  const [aluno, setAluno] = useState<Aluno | null>(null)

useEffect(() => {
  async function loadAluno() {
    if (!user) return
    const a = await getAlunoByUsuarioId(user.id)
    if (a) {
    setAluno(a)
  }
  }
  loadAluno()
}, [user])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Meu Perfil</h1>
        <p className="text-sm text-text-secondary">Seus dados pessoais e preferencias</p>
      </div>

      {/* Foto e nome */}
      <GlassCard className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-2xl">
          {user?.nome?.charAt(0) || 'A'}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-text-primary">{user?.nome}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="accent">{aluno?.categoria || 'BEGINNER'}</Badge>
            <span className="text-xs text-text-secondary">{user?.email}</span>
          </div>
        </div>
        <button className="p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
          <Edit3 size={18} className="text-text-secondary" />
        </button>
      </GlassCard>

      {/* Dados fisicos */}
      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Ruler size={16} className="text-accent" />
          Dados Fisicos
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] space-y-1">
            <div className="flex items-center gap-1.5">
              <Weight size={14} className="text-accent" />
              <p className="text-xs text-text-secondary">Peso</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{aluno?.peso_atual || '--'}<span className="text-sm text-text-secondary">kg</span></p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] space-y-1">
            <div className="flex items-center gap-1.5">
              <Ruler size={14} className="text-accent" />
              <p className="text-xs text-text-secondary">Altura</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{aluno?.altura || '--'}<span className="text-sm text-text-secondary">cm</span></p>
          </div>
        </div>
      </GlassCard>

      {/* Objetivos */}
      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Target size={16} className="text-success" />
          Objetivos
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {aluno?.objetivos || 'Nenhum objetivo cadastrado. Fale com seu coach!'}
        </p>
      </GlassCard>

      {/* Saude */}
      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          Saude e Lesoes
        </h3>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-text-secondary mb-0.5">Lesoes</p>
            <p className="text-sm text-text-primary">{aluno?.lesoes || 'Nenhuma lesao registrada'}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-0.5">Restricoes</p>
            <p className="text-sm text-text-primary">{aluno?.restricoes || 'Nenhuma restricao'}</p>
          </div>
        </div>
      </GlassCard>

      {/* Emergencia */}
      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Shield size={16} className="text-error" />
          Contato de Emergencia
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
            <User size={16} className="text-text-secondary" />
            <div>
              <p className="text-sm text-text-primary">{aluno?.contato_emergencia_nome || 'Nao cadastrado'}</p>
              <p className="text-xs text-text-secondary">Contato principal</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
            <Phone size={16} className="text-text-secondary" />
            <div>
              <p className="text-sm text-text-primary">{aluno?.contato_emergencia_telefone || 'Nao cadastrado'}</p>
              <p className="text-xs text-text-secondary">Telefone</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
