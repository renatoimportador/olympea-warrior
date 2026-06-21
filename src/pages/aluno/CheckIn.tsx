import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { criarFrequencia, getAlunoByUsuarioId } from '@/data/seed'
import toast from 'react-hot-toast'
import { Clock, CheckCircle, LogIn, LogOut, Dumbbell } from 'lucide-react'

export function CheckIn() {
  const { user } = useAuth()
  const aluno = user ? getAlunoByUsuarioId(user.id) : undefined
  const [status, setStatus] = useState<'nenhum' | 'checkin' | 'checkout'>('nenhum')
  const [treinoConcluido, setTreinoConcluido] = useState(false)
  const [horaEntrada, setHoraEntrada] = useState('')
  const [horaSaida, setHoraSaida] = useState('')

  function handleCheckIn() {
    setStatus('checkin')
    setHoraEntrada(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    toast.success('Check-in realizado!')
  }

  function handleCheckOut() {
    setStatus('checkout')
    setHoraSaida(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    if (aluno) {
      criarFrequencia({
        aluno_id: aluno.id,
        treino_id: '',
        data: new Date().toISOString(),
        presente: true,
        treino_concluido: treinoConcluido,
        checkin_at: horaEntrada,
        checkout_at: new Date().toISOString(),
      })
    }
    toast.success('Check-out realizado! Presenca salva.')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Check-In</h1>
        <p className="text-sm text-text-secondary">Registre sua presenca no box</p>
      </div>

      <GlassCard className="p-6 space-y-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
          <Clock size={36} className="text-accent" />
        </div>
        <div>
          <p className="text-3xl font-black text-text-primary">06:00</p>
          <p className="text-sm text-text-secondary">Segunda, 03 de Junho</p>
        </div>

        {status === 'nenhum' && (
          <Button onClick={handleCheckIn} className="w-full">
            <LogIn size={18} className="mr-2" />
            Realizar Check-In
          </Button>
        )}

        {status === 'checkin' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-success/5 border border-success/10">
              <CheckCircle size={20} className="text-success" />
              <div className="text-left">
                <p className="text-sm font-medium text-success">Check-in realizado</p>
                <p className="text-xs text-text-secondary">06:00 - CrossFit OLYMPEA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setTreinoConcluido(!treinoConcluido)}
              >
                <Dumbbell size={18} className="mr-2" />
                {treinoConcluido ? 'Treino Concluido' : 'Marcar Concluido'}
              </Button>
              <Button onClick={handleCheckOut} className="flex-1">
                <LogOut size={18} className="mr-2" />
                Check-Out
              </Button>
            </div>
          </div>
        )}

        {status === 'checkout' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-accent/5 border border-accent/10">
              <CheckCircle size={20} className="text-accent" />
              <div className="text-left">
                <p className="text-sm font-medium text-accent">Treino completo!</p>
                <p className="text-xs text-text-secondary">Check-in: 06:00 | Check-out: 07:15</p>
              </div>
            </div>
            <Badge variant="success">Presente + Concluido</Badge>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
