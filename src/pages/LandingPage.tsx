import { useNavigate } from 'react-router-dom'
import { Shield, Users, TrendingUp, Zap } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary">
      <section className="relative flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
            <Zap size={14} />
            Sistema de Treinamento Esportivo
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
            <span className="text-gradient-accent">OLYMPEA</span>
            <br />
            <span className="text-white">Community</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            A plataforma premium para gestao de treinamento esportivo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/login')}
              className="glass-button w-full sm:w-auto"
            >
              Acessar Plataforma
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Administrador', desc: 'Controle total de usuarios, programacoes e configuracoes do box.' },
            { icon: Users, title: 'Coach', desc: 'Acompanhe evolucao, corrija resultados e comunique-se com alunos.' },
            { icon: TrendingUp, title: 'Aluno', desc: 'Registre resultados, acompanhe PRs e visualize sua evolucao.' },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <f.icon size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold text-text-primary">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-12 border-t border-border-dark">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '28+', label: 'Telas navegaveis' },
            { value: '3', label: 'Niveis de acesso' },
            { value: '6', label: 'Tipos de programacao' },
            { value: '100%', label: 'Responsivo' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-accent">{s.value}</div>
              <div className="text-sm text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-border-dark text-center">
        <p className="text-sm text-text-secondary">
          OLYMPEA Warrior &copy; 2024. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
