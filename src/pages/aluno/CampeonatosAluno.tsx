import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Trophy, CalendarDays, MapPin } from 'lucide-react'
import { listarCampeonatos } from '@/lib/api'

export function CampeonatosAluno() {
  const [campeonatos, setCampeonatos] = useState<any[]>([])
const [loading, setLoading] = useState(true)

const [modalAberto, setModalAberto] = useState(false)
const [campeonatoSelecionado, setCampeonatoSelecionado] = useState<any>(null)
  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarCampeonatos()
        setCampeonatos(dados)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Campeonatos
        </h1>

        <p className="text-sm text-text-secondary">
          Escolha os campeonatos que deseja participar.
        </p>
      </div>

      {loading ? (
        <GlassCard className="p-6">
          Carregando...
        </GlassCard>
      ) : campeonatos.length === 0 ? (
        <GlassCard className="p-6">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Trophy size={48} className="text-warning mb-4" />

            <h2 className="text-lg font-semibold text-text-primary">
              Nenhum campeonato disponível
            </h2>

            <p className="text-sm text-text-secondary mt-2">
              Aguarde novos campeonatos serem cadastrados.
            </p>
          </div>
        </GlassCard>
      ) : (
        campeonatos.map((camp) => (
          <GlassCard key={camp.id} className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-text-primary">
                  {camp.nome}
                </h2>

                <p className="text-text-secondary">
                  {camp.descricao}
                </p>

                <div className="flex gap-5 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <CalendarDays size={15} />
                    {camp.data_inicio}
                  </div>

                  <div className="flex items-center gap-1">
                    <MapPin size={15} />
                    {camp.local}
                  </div>
                </div>
              </div>

              <Trophy className="text-warning" size={32} />
            </div>

            <button
  onClick={() => {
    setCampeonatoSelecionado(camp)
    setModalAberto(true)
  }}
  className="mt-5 w-full rounded-xl bg-accent text-bg-primary py-3 font-semibold hover:opacity-90 transition"
>
  Vou Participar
</button>
          </GlassCard>
        ))
      )}
      {modalAberto && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

    <GlassCard className="w-full max-w-lg p-6 space-y-4">

      <h2 className="text-xl font-bold text-text-primary">
        {campeonatoSelecionado?.nome}
      </h2>

      <div className="space-y-4">

  <select className="w-full rounded-xl bg-bg-secondary p-3">
    <option>Categoria</option>
    <option>Elite</option>
    <option>RX</option>
    <option>Scale</option>
    <option>Iniciante</option>
    <option>Master 35+</option>
    <option>Master 40+</option>
    <option>Master 45+</option>
  </select>

</div>

    </GlassCard>

  </div>
)}
    </div>
  )
}
