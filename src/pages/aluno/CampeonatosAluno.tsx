import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Trophy, CalendarDays, MapPin } from 'lucide-react'
import { listarCampeonatos } from '@/lib/api'

export function CampeonatosAluno() {
  const [campeonatos, setCampeonatos] = useState<any[]>([])
const [loading, setLoading] = useState(true)

const [modalAberto, setModalAberto] = useState(false)
const [campeonatoSelecionado, setCampeonatoSelecionado] = useState<any>(null)
  const [categoria, setCategoria] = useState('')
const [modalidade, setModalidade] = useState('')

const [equipe, setEquipe] = useState('')
const [parceiro1, setParceiro1] = useState('')
const [parceiro2, setParceiro2] = useState('')
const [parceiro3, setParceiro3] = useState('')
const [parceiro4, setParceiro4] = useState('')
const [parceiro5, setParceiro5] = useState('')
const [observacoes, setObservacoes] = useState('')
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

  <select
  value={categoria}
  onChange={(e) => setCategoria(e.target.value)}
  className="w-full rounded-xl bg-bg-secondary p-3"
>
  <option value="">Categoria</option>
  <option value="Elite">Elite</option>
  <option value="RX">RX</option>
  <option value="Scale">Scale</option>
  <option value="Iniciante">Iniciante</option>
  <option value="Master 35+">Master 35+</option>
  <option value="Master 40+">Master 40+</option>
  <option value="Master 45+">Master 45+</option>
</select>

        <select
  value={modalidade}
  onChange={(e) => setModalidade(e.target.value)}
  className="w-full rounded-xl bg-bg-secondary p-3"
>
  <option value="">Modalidade</option>
  <option value="Individual">Individual</option>
  <option value="Dupla">Dupla</option>
  <option value="Trio">Trio</option>
  <option value="Quarteto">Quarteto</option>
  <option value="Sexteto">Sexteto</option>
</select>
        <input
  className="w-full rounded-xl bg-bg-secondary p-3"
  placeholder="Nome da equipe"
/>
      

{modalidade !== 'Individual' && (
  <input
    value={parceiro1}
    onChange={(e) => setParceiro1(e.target.value)}
    className="w-full rounded-xl bg-bg-secondary p-3"
    placeholder="Parceiro 1"
  />
)}
        {(modalidade === 'Trio' ||
  modalidade === 'Quarteto' ||
  modalidade === 'Sexteto') && (
  <input
    value={parceiro2}
    onChange={(e) => setParceiro2(e.target.value)}
    className="w-full rounded-xl bg-bg-secondary p-3"
    placeholder="Parceiro 2"
  />
)}
        <textarea
  className="w-full rounded-xl bg-bg-secondary p-3"
  rows={3}
  placeholder="Observações"
/>
</div>

    </GlassCard>

  </div>
)}
    </div>
  )
}
