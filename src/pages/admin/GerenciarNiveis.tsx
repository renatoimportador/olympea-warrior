import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2 } from 'lucide-react'

export function GerenciarNiveis() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [niveis, setNiveis] = useState<any[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [cor, setCor] = useState('')
  const [ordem, setOrdem] = useState('')

  useEffect(() => {
    carregarNiveis()
  }, [])

  async function carregarNiveis() {
    const { data, error } = await supabase
      .from('niveis')
      .select('*')
      .order('ordem', { ascending: true })

    if (!error && data) {
      setNiveis(data)
    }
  }

  async function salvarNivel() {
    if (editandoId) {
      await supabase
        .from('niveis')
        .update({
          nome,
          slug,
          cor,
          ordem: Number(ordem)
        })
        .eq('id', editandoId)
    } else {
      await supabase
        .from('niveis')
        .insert({
          nome,
          slug,
          cor,
          ordem: Number(ordem),
          ativo: true
        })
    }

    limparFormulario()
    carregarNiveis()
  }

  function editarNivel(n: any) {
    setEditandoId(n.id)
    setNome(n.nome)
    setSlug(n.slug)
    setCor(n.cor)
    setOrdem(String(n.ordem))
    setShowForm(true)
  }

  async function excluirNivel(id: string) {
    await supabase
      .from('niveis')
      .update({ ativo: false })
      .eq('id', id)

    carregarNiveis()
  }

  function limparFormulario() {
    setEditandoId(null)
    setNome('')
    setSlug('')
    setCor('')
    setOrdem('')
    setShowForm(false)
  }

  const filtrados = niveis.filter(
    (n) =>
      n.ativo &&
      n.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Gerenciar Níveis
          </h1>
          <p className="text-sm text-text-secondary">
            Personalize os níveis de cada treino
          </p>
        </div>

        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" />
          Novo Nível
        </Button>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          className="pl-10"
          placeholder="Buscar nível..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">
            {editandoId ? 'Editar Nível' : 'Novo Nível'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Nome do nível"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <Input
              placeholder="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />

            <Input
              placeholder="Cor (hex)"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
            />

            <Input
              placeholder="Ordem"
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={salvarNivel}>
              Salvar
            </Button>

            <Button variant="ghost" onClick={limparFormulario}>
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {filtrados.map((n) => (
          <GlassCard
            key={n.id}
            className="p-4 flex items-center gap-4"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: n.cor }}
            />

            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                {n.nome}
              </p>
              <p className="text-xs text-text-secondary">
                {n.slug} - Ordem {n.ordem}
              </p>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => editarNivel(n)}
                className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"
              >
                <Edit2 size={14} />
              </button>

              <button
                onClick={() => excluirNivel(n.id)}
                className="p-1.5 rounded-lg hover:bg-error/5 text-error"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
