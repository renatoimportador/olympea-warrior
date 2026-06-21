import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { coaches, usuarios, criarCoach, atualizarCoach, excluirCoach } from '@/data/seed'
import { UserCog, Plus, Edit2, Ban, Save } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function GerenciarCoaches() {
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    bio: '',
    especialidades: '',
  })

  const coachesComUsuario = coaches
    .filter((c) => c.ativo)
    .map((c) => {
      const u = usuarios.find((u2) => u2.id === c.usuario_id)
      return { ...c, usuario: u }
    })
    .filter((c) => {
      const termo = busca.toLowerCase()
      return (
        (c.usuario?.nome || '').toLowerCase().includes(termo) ||
        (c.bio || '').toLowerCase().includes(termo)
      )
    })

  function forceRefresh() {
    setRefresh((prev) => prev + 1)
  }

  function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Preencha nome e email')
      return
    }

    if (editingId) {
      const c = coaches.find((x) => x.id === editingId)

      if (c) {
        atualizarCoach(editingId, {
          bio: form.bio,
          especialidades: form.especialidades
            .split(',')
            .map((s) => s.trim()),
        })

        const u = usuarios.find((u2) => u2.id === c.usuario_id)

        if (u) {
          u.nome = form.nome
          u.email = form.email
          u.telefone = form.telefone
        }
      }

      toast.success('Coach atualizado!')
    } else {
      const novoUsuario = {
        id: `u-${Date.now()}`,
        box_id: 'box-1',
        nome: form.nome,
        email: form.email,
        senha_hash: '',
        role: 'coach' as const,
        foto_url: '',
        ativo: true,
        auth_provider: 'email',
        telefone: form.telefone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      usuarios.push(novoUsuario)

      criarCoach({
        usuario_id: novoUsuario.id,
        bio: form.bio,
        especialidades: form.especialidades
          .split(',')
          .map((s) => s.trim()),
      })

      toast.success('Coach criado!')
    }

    forceRefresh()

    setForm({
      nome: '',
      email: '',
      telefone: '',
      bio: '',
      especialidades: '',
    })

    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(c: any) {
    setForm({
      nome: c.usuario?.nome || '',
      email: c.usuario?.email || '',
      telefone: c.usuario?.telefone || '',
      bio: c.bio || '',
      especialidades: (c.especialidades || []).join(', '),
    })

    setEditingId(c.id)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este coach?')) return

    const coach = coaches.find((c) => c.id === id)

    excluirCoach(id)

    if (coach) {
      const usuario = usuarios.find((u) => u.id === coach.usuario_id)
      if (usuario) {
        usuario.ativo = false
      }
    }

    forceRefresh()
    toast.success('Coach excluído!')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Gerenciar Coaches
          </h1>
          <p className="text-sm text-text-secondary">
            {coaches.filter((c) => c.ativo).length} coaches cadastrados
          </p>
        </div>

        <Button
          onClick={() => {
            setForm({
              nome: '',
              email: '',
              telefone: '',
              bio: '',
              especialidades: '',
            })
            setEditingId(null)
            setShowForm(!showForm)
          }}
        >
          <Plus size={18} className="mr-2" />
          Novo Coach
        </Button>
      </div>

      <div className="relative">
        <UserCog
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <Input
          className="pl-10"
          placeholder="Buscar coach..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">
            {editingId ? 'Editar' : 'Novo'} Coach
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) =>
                setForm({ ...form, nome: e.target.value })
              }
            />

            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <Input
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) =>
                setForm({ ...form, telefone: e.target.value })
              }
            />

            <Input
              placeholder="Especialidades (separadas por vírgula)"
              value={form.especialidades}
              onChange={(e) =>
                setForm({ ...form, especialidades: e.target.value })
              }
            />

            <Input
              placeholder="Bio"
              value={form.bio}
              onChange={(e) =>
                setForm({ ...form, bio: e.target.value })
              }
              className="sm:col-span-2"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Salvar
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" key={refresh}>
        {coachesComUsuario.map((c) => (
          <GlassCard key={c.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-lg">
                  {c.usuario?.nome?.charAt(0) || 'C'}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {c.usuario?.nome}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {c.usuario?.email}
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.03] text-text-secondary"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg hover:bg-error/5 text-error"
                >
                  <Ban size={14} />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-1">
                Especialidades
              </p>

              <div className="flex flex-wrap gap-1">
                {c.especialidades?.map((e: string, i: number) => (
                  <Badge key={i} variant="accent">
                    {e}
                  </Badge>
                )) || (
                  <span className="text-xs text-text-secondary">---</span>
                )}
              </div>
            </div>

            {c.bio && (
              <p className="text-xs text-text-secondary leading-relaxed">
                {c.bio}
              </p>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
