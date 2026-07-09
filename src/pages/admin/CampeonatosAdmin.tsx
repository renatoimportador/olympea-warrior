import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Trophy, Plus, Calendar, MapPin, X, Edit2, Ban } from 'lucide-react'
import {
  listarCampeonatos,
  criarCampeonato,
  excluirCampeonato,
  listarParticipacoesByCampeonato
} from '@/lib/api'

import { supabase } from '@/lib/supabase'

export default function CampeonatosAdmin() {
  const [campeonatos, setCampeonatos] = useState<any[]>([])
  const [abrirModal, setAbrirModal] = useState(false)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [local, setLocal] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [imagem, setImagem] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [participacoes, setParticipacoes] = useState<any[]>([])

  async function carregar() {
  try {
    const dados = await listarCampeonatos()

    const listaParticipacoes = await Promise.all(
      (dados || []).map(async (camp) => ({
        campeonatoId: camp.id,
        inscritos: await listarParticipacoesByCampeonato(camp.id)
      }))
    )

    setCampeonatos(dados || [])
    setParticipacoes(listaParticipacoes)

  } catch (e) {
    console.error(e)
  }
}

  useEffect(() => {
    carregar()
  }, [])

  async function salvar() {
  try {

    if (editingId) {

      const { error } = await supabase
        .from('campeonatos')
        .update({
          nome,
          descricao,
          local,
          data_inicio: dataInicio,
          data_fim: dataFim,
          imagem
        })
        .eq('id', editingId)

      if (error) throw error

    } else {

      await criarCampeonato({
        nome,
        descricao,
        local,
        data_inicio: dataInicio,
        data_fim: dataFim,
        imagem,
        status: 'ABERTO',
        ativo: true,
      })

    }

    setAbrirModal(false)

    setNome('')
    setDescricao('')
    setLocal('')
    setDataInicio('')
    setDataFim('')
    setImagem('')
    setEditingId(null)

    carregar()

  } catch (e: any) {
    console.error(e)
    alert(JSON.stringify(e))
  }
}
    function handleEdit(camp: any) {
  setEditingId(camp.id)

  setNome(camp.nome || '')
  setDescricao(camp.descricao || '')
  setLocal(camp.local || '')
  setDataInicio(camp.data_inicio || '')
  setDataFim(camp.data_fim || '')
  setImagem(camp.imagem || '')

  setAbrirModal(true)
}


  
  return (
    <div className="space-y-5 animate-fade-in">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Campeonatos
          </h1>

          <p className="text-sm text-text-secondary">
            Gerencie os campeonatos da sua box.
          </p>
        </div>

        <button
          onClick={() => setAbrirModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary font-semibold"
        >
          <Plus size={18} />
          Novo Campeonato
        </button>

      </div>
      {campeonatos.length === 0 ? (
        <GlassCard className="p-6">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Trophy size={52} className="text-warning mb-4" />

            <h2 className="text-lg font-semibold text-text-primary">
              Nenhum campeonato cadastrado
            </h2>

            <p className="text-sm text-text-secondary mt-2">
              Clique em <strong>"Novo Campeonato"</strong> para cadastrar o primeiro campeonato.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {campeonatos.map((camp) => (
            <GlassCard key={camp.id} className="p-5">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {camp.nome}
                  </h2>

                  <p className="text-sm text-text-secondary mt-2">
                    {camp.descricao}
                  </p>

                  <div className="flex gap-4 mt-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {camp.data_inicio}
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {camp.local}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">

  <div className="flex gap-2 items-start">

  <button
    onClick={() => handleEdit(camp)}
    className="p-1.5 rounded-lg hover:bg-accent/10 text-accent"
  >
    <Edit2 size={14} />
  </button>

  <button
    onClick={async () => {
  if (!confirm('Deseja realmente excluir este campeonato?')) return

  await excluirCampeonato(camp.id)
  carregar()
}}
    className="p-1.5 rounded-lg hover:bg-error/5 text-error"
  >
    <Ban size={14} />
  </button>

</div>



</div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {abrirModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <GlassCard className="w-full max-w-lg p-6 space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">
  {editingId ? 'Editar Campeonato' : 'Novo Campeonato'}
</h2>

              <button onClick={() => setAbrirModal(false)}>
                <X />
              </button>
            </div>

            <input
              className="w-full p-3 rounded-xl bg-bg-secondary"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <textarea
              className="w-full p-3 rounded-xl bg-bg-secondary"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <input
              className="w-full p-3 rounded-xl bg-bg-secondary"
              placeholder="Local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />

            <input
              type="date"
              className="w-full p-3 rounded-xl bg-bg-secondary"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <input
              type="date"
              className="w-full p-3 rounded-xl bg-bg-secondary"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <input
              className="w-full p-3 rounded-xl bg-bg-secondary"
              placeholder="URL da imagem"
              value={imagem}
              onChange={(e) => setImagem(e.target.value)}
            />

            <button
              onClick={salvar}
              className="w-full py-3 rounded-xl bg-accent text-bg-primary font-semibold"
            >
              Salvar Campeonato
            </button>

          </GlassCard>

        </div>
      )}

    </div>
  )
}
