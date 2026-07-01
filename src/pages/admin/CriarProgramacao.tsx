import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  listarProgramacoes,
  criarProgramacao,
  atualizarProgramacao,
  excluirProgramacao,
  listarFasesByProg,
  getBox,
} from '@/lib/api'
import type { Programacao, Fase } from '@/data/types'
import { useAuth } from '@/context/AuthContext'
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type ProgramacaoForm = {
  id?: string
  nome: string
  tipo: Programacao['tipo']
  descricao: string
  data_inicio: string
  data_fim: string
}

export function CriarProgramacao() {
  const { user } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProgramacaoForm>({
    nome: '',
    tipo: 'CROSSFIT',
    descricao: '',
    data_inicio: '',
    data_fim: '',
  })

  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [fasesMap, setFasesMap] = useState<Record<string, Fase[]>>({})
  const [boxId, setBoxId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      await loadBox()
      await loadProgramacoes()
    }
    init()
  }, [])

  async function loadBox() {
    try {
      const box = await getBox()

      if (box?.id) {
        setBoxId(box.id)
      }
    } catch (e) {
      console.error('Erro ao carregar box:', e)
      toast.error('Erro ao carregar box')
    }
  }

  async function loadProgramacoes() {
    setLoading(true)

    try {
      const progs = await listarProgramacoes()

      setProgramacoes(progs || [])

      const mapa: Record<string, Fase[]> = {}

      for (const prog of progs || []) {
        mapa[prog.id] = await listarFasesByProg(prog.id)
      }

      setFasesMap(mapa)
    } catch (e) {
      console.error('Erro ao carregar programações:', e)
      toast.error('Erro ao carregar programações')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({
      nome: '',
      tipo: 'CROSSFIT',
      descricao: '',
      data_inicio: '',
      data_fim: '',
    })
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Digite o nome da programação')
      return
    }

    if (!boxId) {
      toast.error('Box não carregado')
      return
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      if (form.id) {
        await atualizarProgramacao(form.id, {
          nome: form.nome,
          tipo: form.tipo,
          descricao: form.descricao,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
        })

        toast.success('Programação atualizada!')
      } else {
        await criarProgramacao({
          nome: form.nome,
          tipo: form.tipo,
          descricao: form.descricao,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
          box_id: boxId,
          created_by: user.id,
          ativa: true,
        })

        toast.success('Programação criada!')
      }

      resetForm()
      setShowForm(false)
      await loadProgramacoes()
    } catch (e: any) {
      console.error('Erro ao salvar programação:', e)
      toast.error(e?.message || 'Erro ao salvar programação')
    }
  }

  function handleEdit(programacao: Programacao) {
    setForm({
      id: programacao.id,
      nome: programacao.nome,
      tipo: programacao.tipo,
      descricao: programacao.descricao || '',
      data_inicio: programacao.data_inicio || '',
      data_fim: programacao.data_fim || '',
    })

    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta programação?')) return

    try {
      await excluirProgramacao(id)
      toast.success('Programação excluída!')
      await loadProgramacoes()
    } catch {
      toast.error('Erro ao excluir programação')
    }
  }

  const programacoesAtivas = programacoes.filter((p) => p.ativa)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Programações
          </h1>

          <p className="text-sm text-text-secondary">
            {programacoesAtivas.length} programações criadas
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
        >
          <Plus size={18} className="mr-2" />
          Nova Programação
        </Button>
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-text-primary">
            {form.id ? 'Editar Programação' : 'Nova Programação'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Nome da programação"
              value={form.nome}
              onChange={(e) =>
                setForm({
                  ...form,
                  nome: e.target.value,
                })
              }
            />

            <select
              value={form.tipo}
              onChange={(e) =>
                setForm({
                  ...form,
                  tipo: e.target.value as Programacao['tipo'],
                })
              }
              className="glass-input w-full text-sm"
            >
              <option value="CROSSFIT">CrossFit</option>
              <option value="LPO">LPO</option>
              <option value="GYMNASTICS">Gymnastics</option>
              <option value="ENDURANCE">Endurance</option>
              <option value="MASTER40">Master 40+</option>
              <option value="COMPETIDORES">Competidores</option>
            </select>

            <Input
              type="date"
              value={form.data_inicio}
              onChange={(e) =>
                setForm({
                  ...form,
                  data_inicio: e.target.value,
                })
              }
            />

            <Input
              type="date"
              value={form.data_fim}
              onChange={(e) =>
                setForm({
                  ...form,
                  data_fim: e.target.value,
                })
              }
            />

            <textarea
              rows={3}
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) =>
                setForm({
                  ...form,
                  descricao: e.target.value,
                })
              }
              className="glass-input w-full resize-none sm:col-span-2"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
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

      {loading && (
        <p className="text-sm text-text-secondary">
          Carregando...
        </p>
      )}

      <div className="space-y-3">
        {programacoesAtivas.map((p) => {
          const fases = fasesMap[p.id] || []

          return (
            <GlassCard key={p.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Layers size={18} className="text-accent" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {p.nome}
                    </p>

                    <p className="text-xs text-text-secondary">
                      {p.tipo}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.03]"
                  >
                    <Edit2
                      size={14}
                      className="text-text-secondary"
                    />
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg hover:bg-error/5"
                  >
                    <Trash2
                      size={14}
                      className="text-error"
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="accent">
                  {fases.length} fases
                </Badge>

                <Badge>
                  {p.data_inicio} até {p.data_fim}
                </Badge>

                {p.ativa ? (
                  <Badge variant="success">
                    Ativa
                  </Badge>
                ) : (
                  <Badge>
                    Inativa
                  </Badge>
                )}
              </div>

              {p.descricao && (
                <p className="text-xs text-text-secondary">
                  {p.descricao}
                </p>
              )}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
