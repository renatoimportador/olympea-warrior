import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { exercicios } from '@/data/seed'
import { BookOpen, Play, AlertTriangle, Lightbulb, ArrowLeft, Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DetalheMovimento() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState<'padrao' | 'erros' | 'dicas' | 'escalas'>('padrao')

  const ex = useMemo(() => exercicios.find((e) => e.slug === slug), [slug])

  if (!ex) {
    return (
      <div className="text-center py-20 text-text-secondary">
        Movimento nao encontrado
      </div>
    )
  }

  const abas = [
    { id: 'padrao' as const, label: 'Padrao', icon: BookOpen },
    { id: 'erros' as const, label: 'Erros Comuns', icon: AlertTriangle },
    { id: 'dicas' as const, label: 'Dicas', icon: Lightbulb },
    { id: 'escalas' as const, label: 'Escalas', icon: Scale },
  ]

  const conteudo = {
    padrao: ex.padrao_movimento || 'Padrao de movimento nao cadastrado.',
    erros: 'Erros comuns:\n\n1. Barra se afastando do corpo\n2. Extensao dos joelhos antes dos quadris\n3. Recepcao instavel',
    dicas: ex.dicas_coach || 'Dicas do coach nao cadastradas.',
    escalas: 'Escalas recomendadas:\n\n1. PVC pipe vez da barra\n2. Power snatch vez do snatch completo\n3. Hang snatch vez do chao',
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate('/biblioteca')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para biblioteca
      </button>

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{ex.nome}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="accent">{ex.categoria}</Badge>
              {ex.dificuldade && <Badge>{ex.dificuldade}</Badge>}
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <BookOpen size={28} className="text-accent" />
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">{ex.descricao}</p>

        {/* Video placeholder */}
        <div className="aspect-video rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
          <div className="text-center">
            <Play size={36} className="mx-auto text-text-secondary mb-2" />
            <p className="text-xs text-text-secondary">Video demonstrativo</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {abas.map((aba) => {
            const Icon = aba.icon
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  abaAtiva === aba.id
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'bg-white/[0.03] text-text-secondary border border-white/[0.05]'
                }`}
              >
                <Icon size={14} />
                {aba.label}
              </button>
            )
          })}
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {conteudo[abaAtiva]}
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
