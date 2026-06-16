import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Bell, Save, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export function Configuracoes() {
  const [notifTreino, setNotifTreino] = useState(true)
  const [notifResultado, setNotifResultado] = useState(true)
  const [notifPR, setNotifPR] = useState(true)
  const [idioma, setIdioma] = useState('pt-BR')

  function handleSave() {
    toast.success('Configuracoes salvas!')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary">Configuracoes</h1>

      <GlassCard className="p-6 space-y-6">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Bell size={16} className="text-accent" />
          Notificacoes
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Novo treino disponivel', valor: notifTreino, set: setNotifTreino },
            { label: 'Resultado registrado', valor: notifResultado, set: setNotifResultado },
            { label: 'Novo PR conquistado', valor: notifPR, set: setNotifPR },
            { label: 'Mensagem do coach', valor: true, set: () => {} },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-text-primary">{n.label}</span>
              <button
                onClick={() => n.set(!n.valor)}
                className={`w-10 h-6 rounded-full transition-all ${n.valor ? 'bg-accent' : 'bg-white/[0.08]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all ${n.valor ? 'ml-[22px]' : 'ml-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-6">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Globe size={16} className="text-accent" />
          Idioma
        </h3>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="glass-input w-full"
        >
          <option value="pt-BR">Portugues (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Espanol</option>
        </select>
      </GlassCard>

      <Button onClick={handleSave}>
        <Save size={18} className="mr-2" />
        Salvar Configuracoes
      </Button>
    </div>
  )
}
