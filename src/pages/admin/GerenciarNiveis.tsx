import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Layers, Edit2, Ban, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export function GerenciarNiveis() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [niveis, setNiveis] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '',
    slug: '',
    cor: '',
    ordem: '',
  })

  async function carregarNiveis() {
    const { data, error } = await supabase
      .from('niveis')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      console.log(error)
      toast.error('Erro ao carregar níveis')
      return
    }

    setNiveis(data || [])
  }

  useEffect(() => {
    carregarNiveis()
  }, [])

  function resetForm() {
    setForm({
      nome: '',
      slug: '',
      cor: '',
      ordem: '',
    })
    setEditingId(null)
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.slug.trim()) {
      toast.error('Preencha nome e slug')
      return
    }

    if (editingId) {
      const { error } = await supabase
        .from('niveis')
        .update({
          nome: form.nome,
          slug: form.slug,
          cor: form.cor,
          ordem: form.ordem ? parseInt(form.ordem) : null,
        })
        .eq('id', editingId)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Nível atualizado!')
    } else {
      const { error } = await supabase
        .from('niveis')
        .insert({
          nome: form.nome,
          slug: form.slug,
          cor: form.cor,
          ordem: form.ordem ? parseInt(form.ordem) : null,
          ativo: true,
        })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Nível criado!')
    }

    resetForm()
    setShowForm(false)
    carregarNiveis()
  }

  function handleEdit(n: any) {
    setForm({
      nome: n.nome || '',
      slug: n.slug || '',
      cor: n.cor || '',
      ordem: n.ordem ? String(n.ordem) : '',
    })

    setEditingId(n.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente inativar este nível?')) return

    const { error } = await supabase
      .from('niveis')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Nível inativado!')
    carregarNiveis()
  }

  const filtrados = niveis.filter((n) =>
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
            {niveis.length} níveis cadastrados
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
        >
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
          <h3>{editingId ? 'Editar Nível' : 'Novo Nível'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <Input
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />

            <Input
              placeholder="Cor (hex)"
              value={form.cor}
              onChange={(e) => setForm({ ...form, cor: e.target.value })}
            />

            <Input
              placeholder="Ordem"
              type="number"
              value={form.ordem}
              onChange={(e) => setForm({ ...form, ordem: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Salvar
            </Button>

            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {filtrados.map((n) => (
          <GlassCard key={n.id} className="p-4 flex items-center gap-4">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: n.cor }}
            />

            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{n.nome}</p>
              <p className="text-xs text-text-secondary">
                {n.slug} - Ordem {n.ordem}
              </p>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(n)}
                className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"
              >
                <Edit2 size={14} />
              </button>

              <button
                onClick={() => handleDelete(n.id)}
                className="p-1.5 rounded-lg hover:bg-error/5 text-error"
              >
                <Ban size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
