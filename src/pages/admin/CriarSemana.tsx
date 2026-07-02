import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  listarSemanasByFase,
  listarFasesByProg,
  listarProgramacoes,
  criarSemana,
  atualizarSemana,
  excluirSemana,
  listarDiasBySemana,
  criarDia,
} from '@/lib/api'
import type {
  Semana,
  Fase,
  Programacao,
  TipoSemana,
} from '@/data/types'
import { useAuth } from '@/context/AuthContext'
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const tiposSemana: TipoSemana[] = [
  'ORDINARIA',
  'FORTE',
  'DELOAD',
  'PEAK',
  'TESTE',
]

type SemanaForm = {
  id?: string
  fase_id: string
  nome: string
  tipo: TipoSemana
  ordem: number
  descricao: string
}

export function CriarSemana() {
  const { user } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [semanas, setSemanas] = useState<Semana[]>([])
  const [fases, setFases] = useState<Fase[]>([])
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [diasMap, setDiasMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<SemanaForm>({
    fase_id: '',
    nome: '',
    tipo: 'ORDINARIA',
    ordem: 1,
    descricao: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    try {
      const progs = (await listarProgramacoes()) || []
      setProgramacoes(progs)

      const allFases: Fase[] = []
      const allSemanas: Semana[] = []
      const dMap: Record<string, number> = {}

      for (const p of progs) {
        const fasesProg = (await listarFasesByProg(p.id)) || []
        allFases.push(...fasesProg)

        for (const f of fasesProg) {
          const semanasFase = (await listarSemanasByFase(f.id)) || []
          allSemanas.push(...semanasFase)

          for (const s of semanasFase) {
            const dias = (await listarDiasBySemana(s.id)) || []
            dMap[s.id] = dias.length
          }
        }
      }

      setFases(allFases)
      setSemanas(allSemanas)
      setDiasMap(dMap)
    } catch (e) {
      console.error('Erro ao carregar semanas:', e)
      toast.error('Erro ao carregar semanas')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Digite o nome da semana')
      return
    }

    if (!form.fase_id) {
      toast.error('Selecione a fase')
      return
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      if (form.id) {
        await atualizarSemana(form.id, {
          nome: form.nome,
          tipo: form.tipo,
          ordem: form.ordem,
          descricao: form.descricao,
          fase_id: form.fase_id,
        })

        toast.success('Semana atualizada!')
      } else {
        const novaSemana = await criarSemana({
          nome: form.nome,
          tipo: form.tipo,
          ordem: form.ordem,
          descricao: form.descricao,
          fase_id: form.fase_id,
          ativa: true,
        })

        if (!novaSemana?.id) {
          throw new Error('Erro ao criar semana')
        }

        const diasSemanaArray = [
          'SEG',
          'TER',
          'QUA',
          'QUI',
          'SEX',
          'SAB',
          'DOM',
        ] as const

        const semanaDiaMap: Record<string, string> = {
          SEG: 'Segunda-Feira',
          TER: 'Terca-Feira',
          QUA: 'Quarta-Feira',
          QUI: 'Quinta-Feira',
          SEX: 'Sexta-Feira',
          SAB: 'Sabado',
          DOM: 'Domingo',
        }

        for (const ds of diasSemanaArray) {
          await criarDia({
  semana_id: novaSemana.id,
  dia_semana: ds,
  ativo: true,
} as any)
        }

        toast.success('Semana criada com 7 dias!')
      }

      await loadData()

      setShowForm(false)

      setForm({
        fase_id: '',
        nome: '',
        tipo: 'ORDINARIA',
        ordem: 1,
        descricao: '',
      })
    } catch (e: any) {
      console.error('Erro ao salvar semana:', e)
      toast.error('Erro ao salvar: ' + (e?.message || 'Verifique os dados'))
    }
  }

  function handleEdit(s: Semana) {
    setForm({
      id: s.id,
      fase_id: s.fase_id,
      nome: s.nome,
      tipo: s.tipo,
      ordem: s.ordem,
      descricao: s.descricao || '',
    })

    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta semana?')) return

    try {
      await excluirSemana(id)
      await loadData()
      toast.success('Semana excluída!')
    } catch {
      toast.error('Erro ao excluir semana')
    }
  }

  const semanasAtivas = semanas.filter((s) => s.ativa !== false)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Semanas de Treino
          </h1>
          <p className="text-sm text-text-secondary">
            {semanasAtivas.length} semanas criadas
          </p>
        </div>

        <Button
          onClick={() => {
            setShowForm(!showForm)
            setForm({
              fase_id: '',
              nome: '',
              tipo: 'ORDINARIA',
              ordem: 1,
              descricao: '',
            })
          }}
        >
          <Plus size={18} className="mr-2" />
          Nova Semana
        </Button>
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3>{form.id ? 'Editar Semana' : 'Nova Semana'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.fase_id}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  fase_id: e.target.value,
                }))
              }
              className="glass-input w-full"
            >
              <option value="">Selecione a fase...</option>

              {fases.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>

            <Input
              placeholder="Nome da semana"
              value={form.nome}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  nome: e.target.value,
                }))
              }
            />

            <select
              value={form.tipo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tipo: e.target.value as TipoSemana,
                }))
              }
              className="glass-input w-full"
            >
              {tiposSemana.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <Input
              type="number"
              value={form.ordem}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  ordem: parseInt(e.target.value) || 1,
                }))
              }
            />

            <textarea
              rows={2}
              value={form.descricao}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  descricao: e.target.value,
                }))
              }
              className="glass-input w-full resize-none sm:col-span-2"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>Salvar</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      {loading && <p>Carregando...</p>}

      <div className="space-y-6">
        {fases.map((f) => {
          const semanasFase = semanasAtivas.filter(
            (s) => s.fase_id === f.id
          )

          return (
            <div key={f.id} className="space-y-3">
              <h2 className="text-sm flex items-center gap-2">
                <Calendar size={14} />
                {f.nome}
              </h2>

              {semanasFase.map((s) => (
                <GlassCard key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p>{s.nome}</p>
                      <p className="text-xs">
                        {s.tipo} — Ordem {s.ordem}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s)}>
                        <Edit2 size={14} />
                      </button>

                      <button onClick={() => handleDelete(s.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge>{s.tipo}</Badge>
                    <Badge>{diasMap[s.id] || 0} dias</Badge>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
