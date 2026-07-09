import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Trophy, CalendarDays, MapPin } from 'lucide-react'
import { listarCampeonatos } from '@/lib/api'
import { supabase } from '@/lib/supabase'

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
const [minhasInscricoes, setMinhasInscricoes] = useState<any[]>([])
const [inscricaoAtual, setInscricaoAtual] = useState<any>(null)
  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarCampeonatos()
        setCampeonatos(dados)
        const {
  data: { user }
} = await supabase.auth.getUser()

if (user) {
  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('usuario_id', user.id)
    .single()

  if (aluno) {
    const { data: inscricoes } = await supabase
      .from('participacoes_campeonato')
      .select('*')
      .eq('aluno_id', aluno.id)

    setMinhasInscricoes(inscricoes || [])
  }
}
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])
async function confirmarInscricao() {

  const {
  data: { user }
} = await supabase.auth.getUser()

if (!user) {
  alert('Usuário não encontrado.')
  return
}

const { data: aluno } = await supabase
  .from('alunos')
  .select('id')
  .eq('usuario_id', user.id)
  .single()

if (!aluno) {
  alert('Aluno não encontrado.')
  return
}

  if (!user) {
    alert('Usuário não encontrado.')
    return
  }

  let error = null

  if (inscricaoAtual) {

    const resultado = await supabase
      .from('participacoes_campeonato')
      .update({
        categoria,
        modalidade,
        equipe,
        parceiro1,
        parceiro2,
        parceiro3,
        parceiro4,
        parceiro5,
        observacoes
      })
      .eq('id', inscricaoAtual.id)
    .select()
    

    error = resultado.error

  } else {

    const resultado = await supabase
      .from('participacoes_campeonato')
      .insert({
        campeonato_id: campeonatoSelecionado.id,
        aluno_id: aluno.id,
        categoria,
        modalidade,
        equipe,
        parceiro1,
        parceiro2,
        parceiro3,
        parceiro4,
        parceiro5,
        observacoes
      })

    error = resultado.error
  }

  if (error) {
    console.error(error)
    alert('Erro ao salvar inscrição.')
    return
  }

  

  alert('Inscrição salva com sucesso!')
  const { data } = await supabase
  .from('participacoes_campeonato')
  .select('*')
  .eq('aluno_id', aluno.id)

setMinhasInscricoes(data || [])

  setModalAberto(false)
}
  function jaInscrito(campeonatoId: number) {
  return minhasInscricoes.some(
    (i) => i.campeonato_id === campeonatoId
  )
}
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
onClick={async() => {

  const {
  data: { user }
} = await supabase.auth.getUser()

let inscricao = null

if (user) {
  const { data: aluno } = await supabase
  .from('alunos')
  .select('id')
  .eq('usuario_id', user.id)
  .single()

if (!aluno) {
  alert('Aluno não encontrado.')
  return
}
  const { data } = await supabase
    .from('participacoes_campeonato')
    .select('*')
    .eq('campeonato_id', camp.id)
    .eq('aluno_id', aluno.id)
    .maybeSingle()

  inscricao = data
}

  setInscricaoAtual(inscricao || null)

  setCampeonatoSelecionado(camp)

  if (inscricao) {
    setCategoria(inscricao.categoria || '')
    setModalidade(inscricao.modalidade || '')
    setEquipe(inscricao.equipe || '')
    setParceiro1(inscricao.parceiro1 || '')
    setParceiro2(inscricao.parceiro2 || '')
    setParceiro3(inscricao.parceiro3 || '')
    setParceiro4(inscricao.parceiro4 || '')
    setParceiro5(inscricao.parceiro5 || '')
    setObservacoes(inscricao.observacoes || '')
  } else {
    setCategoria('')
    setModalidade('')
    setEquipe('')
    setParceiro1('')
    setParceiro2('')
    setParceiro3('')
    setParceiro4('')
    setParceiro5('')
    setObservacoes('')
  }

  setModalAberto(true)
}}
  className={`mt-5 w-full rounded-xl py-3 font-semibold transition ${
  jaInscrito(camp.id)
    ? 'bg-accent text-bg-primary ring-2 ring-accent'
    : 'bg-accent hover:opacity-90 text-bg-primary'
}`}
>
  {jaInscrito(camp.id) ? 'Editar Inscrição' : 'Vou Participar'}
</button>
          </GlassCard>
        ))
      )}
      {modalAberto && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

    <GlassCard className="w-full max-w-lg p-6 space-y-4">

      <h2 className="text-xl font-bold text-text-primary">
  {inscricaoAtual ? 'Editar Inscrição' : 'Nova Inscrição'}
</h2>

<p className="text-text-secondary">
  {campeonatoSelecionado?.nome}
</p>

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
  value={equipe}
  onChange={(e) => setEquipe(e.target.value)}
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
        {(modalidade === 'Quarteto' ||
  modalidade === 'Sexteto') && (
  <input
    value={parceiro3}
    onChange={(e) => setParceiro3(e.target.value)}
    className="w-full rounded-xl bg-bg-secondary p-3"
    placeholder="Parceiro 3"
  />
)}
        {modalidade === 'Sexteto' && (
  <>
    <input
      value={parceiro4}
      onChange={(e) => setParceiro4(e.target.value)}
      className="w-full rounded-xl bg-bg-secondary p-3"
      placeholder="Parceiro 4"
    />

    <input
      value={parceiro5}
      onChange={(e) => setParceiro5(e.target.value)}
      className="w-full rounded-xl bg-bg-secondary p-3"
      placeholder="Parceiro 5"
    />
  </>
)}
        
        <textarea
  value={observacoes}
  onChange={(e) => setObservacoes(e.target.value)}
  className="w-full rounded-xl bg-bg-secondary p-3"
  rows={3}
  placeholder="Observações"
/>
        <div className="flex justify-end gap-3 mt-4">

  <button
  onClick={() => setModalAberto(false)}
  className="px-6 py-3 rounded-xl border border-white/10 text-text-secondary hover:bg-white/5 transition"
>
  Cancelar
</button>

  <button
  onClick={confirmarInscricao}
  className="px-6 py-3 rounded-xl bg-accent hover:opacity-90 text-bg-primary font-bold transition"
>
    {inscricaoAtual ? 'Salvar Alterações' : 'Confirmar Inscrição'}
  </button>

</div>
</div>

    </GlassCard>

  </div>
)}
    </div>
  )
}
