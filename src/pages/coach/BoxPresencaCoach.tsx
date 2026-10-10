import { useCallback, useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PresencasAula } from '@/components/box/PresencasAula'
import {
  DIA_SEMANA_LABEL,
  diaSemanaDeData,
  formatarDataBR,
  formatarHora,
  hojeSaoPaulo,
  listarAulasComOcupacao,
  somarDias,
} from '@/lib/boxAulas'
import type { AulaOcupacao } from '@/data/types'
import { CalendarCheck, ChevronDown, ChevronUp, Clock, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { traduzirErroBoxAulas } from '@/lib/boxAulas'

const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function rotuloDia(data: string): string {
  return DIAS_CURTO[new Date(data + 'T12:00:00').getDay()]
}

export function BoxPresencaCoach() {
  const hoje = hojeSaoPaulo()
  /* Faixa: 7 dias atras ate 7 dias a frente (registrar aulas passadas e
     acompanhar as proximas) */
  const dias = Array.from({ length: 15 }, (_, i) => somarDias(hoje, i - 7))

  const [diaSelecionado, setDiaSelecionado] = useState(hoje)
  const [aulas, setAulas] = useState<AulaOcupacao[]>([])
  const [loading, setLoading] = useState(true)
  const [abertaId, setAbertaId] = useState<string | null>(null)

  const carregarDia = useCallback(async (data: string) => {
    setLoading(true)
    try {
      setAulas(await listarAulasComOcupacao(data))
    } catch (e) {
      console.error('Erro ao carregar aulas do box:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDia(diaSelecionado)
  }, [diaSelecionado, carregarDia])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Presencas — Box Presencial
        </h1>
        <p className="text-sm text-text-secondary">
          Consulte as aulas, veja os alunos reservados e registre comparecimento
          ou ausencia (a partir do inicio da aula)
        </p>
      </div>

      {/* Faixa de dias */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {dias.map((data) => {
          const selecionado = data === diaSelecionado
          return (
            <button
              key={data}
              onClick={() => setDiaSelecionado(data)}
              className={`flex-shrink-0 flex flex-col items-center rounded-xl px-3 py-2 border transition-colors ${
                selecionado
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-white/[0.02] border-white/[0.04] text-text-secondary hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide">
                {data === hoje ? 'Hoje' : rotuloDia(data)}
              </span>
              <span className="text-sm font-bold">
                {data.slice(8, 10)}/{data.slice(5, 7)}
              </span>
            </button>
          )
        })}
      </div>

      {loading && (
        <p className="text-sm text-text-secondary">Carregando aulas...</p>
      )}

      {!loading && aulas.length === 0 && (
        <GlassCard className="p-6 text-center space-y-2">
          <CalendarCheck size={28} className="mx-auto text-text-secondary" />
          <p className="text-text-primary font-medium">
            Nenhuma aula em {formatarDataBR(diaSelecionado)}
          </p>
          <p className="text-sm text-text-secondary">
            Consulte outro dia na faixa acima.
          </p>
        </GlassCard>
      )}

      <div className="space-y-3">
        {aulas.map((aula) => {
          const cancelada = aula.status === 'CANCELADA'
          const aberta = abertaId === aula.aula_id
          const comReservas = aula.vagas_ocupadas > 0

          return (
            <GlassCard
              key={aula.aula_id}
              className={`p-4 space-y-3 ${cancelada ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    {formatarHora(aula.hora_inicio)} – {formatarHora(aula.hora_fim)}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                    <Users size={11} />
                    {cancelada
                      ? 'Aula cancelada'
                      : `${aula.vagas_ocupadas}/${aula.capacidade} ocupadas — ${aula.vagas_disponiveis} livre(s)`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {cancelada && <Badge variant="error">Cancelada</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancelada}
                    onClick={() => setAbertaId(aberta ? null : aula.aula_id)}
                  >
                    {aberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {aberta ? 'Fechar' : 'Presencas'}
                  </Button>
                </div>
              </div>

              {!cancelada && aberta && (
                <PresencasAula
                  aula={aula}
                  data={diaSelecionado}
                  onAtualizado={() => carregarDia(diaSelecionado)}
                />
              )}
            </GlassCard>
          )
        })}
      </div>

      <p className="text-xs text-text-secondary">
        Aula de {DIA_SEMANA_LABEL[diaSemanaDeData(diaSelecionado)]},{' '}
        {formatarDataBR(diaSelecionado)} — presencas registradas apenas nas aulas
        do seu Box.
      </p>
    </div>
  )
}
