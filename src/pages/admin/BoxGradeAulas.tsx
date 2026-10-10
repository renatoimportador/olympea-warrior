import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { getBoxId } from '@/lib/api'
import {
  DIAS_SEMANA_ORDEM,
  DIA_SEMANA_LABEL,
  atualizarGradeAula,
  criarGradeAula,
  definirGradeAulaAtiva,
  formatarDataBR,
  formatarHora,
  hojeSaoPaulo,
  listarGradeAulas,
  traduzirErroBoxAulas,
} from '@/lib/boxAulas'
import type { DiaSemana, GradeAula } from '@/data/types'
import { CalendarClock, Clock, Edit2, Plus, Power, Users } from 'lucide-react'
import toast from 'react-hot-toast'

type GradeForm = {
  id?: string
  dia_semana: DiaSemana
  hora_inicio: string
  hora_fim: string
  capacidade: number
  vigencia_inicio: string
  vigencia_fim: string
}

const formVazio: GradeForm = {
  dia_semana: 'SEG',
  hora_inicio: '06:00',
  hora_fim: '07:00',
  capacidade: 20,
  vigencia_inicio: hojeSaoPaulo(),
  vigencia_fim: '',
}

export function BoxGradeAulas() {
  const [grade, setGrade] = useState<GradeAula[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<GradeForm>(formVazio)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      setGrade(await listarGradeAulas())
    } catch (e) {
      console.error('Erro ao carregar grade de aulas:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(g: GradeAula) {
    setForm({
      id: g.id,
      dia_semana: g.dia_semana,
      hora_inicio: formatarHora(g.hora_inicio),
      hora_fim: formatarHora(g.hora_fim),
      capacidade: g.capacidade,
      vigencia_inicio: g.vigencia_inicio,
      vigencia_fim: g.vigencia_fim || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.hora_inicio || !form.hora_fim) {
      toast.error('Informe o horario de inicio e termino')
      return
    }
    if (form.hora_fim <= form.hora_inicio) {
      toast.error('O horario de termino deve ser posterior ao inicio')
      return
    }
    if (!form.capacidade || form.capacidade < 1) {
      toast.error('A capacidade deve ser maior que zero')
      return
    }
    if (!form.vigencia_inicio) {
      toast.error('Informe a vigencia inicial')
      return
    }
    if (form.vigencia_fim && form.vigencia_fim < form.vigencia_inicio) {
      toast.error('A vigencia final nao pode ser anterior a inicial')
      return
    }

    const boxId = await getBoxId()
    if (!boxId) {
      toast.error('Box nao identificado')
      return
    }

    setSalvando(true)
    try {
      const dados = {
        dia_semana: form.dia_semana,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
        capacidade: form.capacidade,
        vigencia_inicio: form.vigencia_inicio,
        vigencia_fim: form.vigencia_fim || null,
      }

      if (form.id) {
        await atualizarGradeAula(form.id, dados)
        toast.success('Horario atualizado!')
      } else {
        await criarGradeAula({ ...dados, box_id: boxId, ativo: true })
        toast.success('Horario adicionado a grade!')
      }

      setShowForm(false)
      setForm(formVazio)
      await loadData()
    } catch (e) {
      console.error('Erro ao salvar horario da grade:', e)
      toast.error(traduzirErroBoxAulas(e))
    } finally {
      setSalvando(false)
    }
  }

  async function handleToggleAtivo(g: GradeAula) {
    const acao = g.ativo ? 'desativar' : 'ativar'
    if (
      !confirm(
        g.ativo
          ? `Desativar o horario das ${formatarHora(g.hora_inicio)} de ${DIA_SEMANA_LABEL[g.dia_semana]}?\n\nAulas ja geradas serao preservadas; apenas novas geracoes deixarao de incluir este horario.`
          : `Ativar novamente o horario das ${formatarHora(g.hora_inicio)} de ${DIA_SEMANA_LABEL[g.dia_semana]}?`
      )
    )
      return

    try {
      await definirGradeAulaAtiva(g.id, !g.ativo)
      toast.success(`Horario ${acao === 'desativar' ? 'desativado' : 'ativado'}!`)
      await loadData()
    } catch (e) {
      console.error('Erro ao alterar status do horario:', e)
      toast.error(traduzirErroBoxAulas(e))
    }
  }

  const ativos = grade.filter((g) => g.ativo).length

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Grade de Aulas — Box Presencial
          </h1>
          <p className="text-sm text-text-secondary">
            {ativos} horarios ativos de {grade.length} cadastrados
          </p>
        </div>

        <Button
          onClick={() => {
            setShowForm(!showForm)
            setForm(formVazio)
          }}
        >
          <Plus size={18} className="mr-2" />
          Novo Horario
        </Button>
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3>{form.id ? 'Editar Horario' : 'Novo Horario'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">
                Dia da semana
              </label>
              <select
                value={form.dia_semana}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dia_semana: e.target.value as DiaSemana,
                  }))
                }
                className="glass-input w-full"
              >
                {DIAS_SEMANA_ORDEM.map((d) => (
                  <option key={d} value={d}>
                    {DIA_SEMANA_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">
                Inicio
              </label>
              <Input
                type="time"
                value={form.hora_inicio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hora_inicio: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">
                Termino
              </label>
              <Input
                type="time"
                value={form.hora_fim}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hora_fim: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">
                Vagas
              </label>
              <Input
                type="number"
                min={1}
                value={form.capacidade}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    capacidade: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">
                Vigencia inicial
              </label>
              <Input
                type="date"
                value={form.vigencia_inicio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vigencia_inicio: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">
                Vigencia final (opcional)
              </label>
              <Input
                type="date"
                value={form.vigencia_fim}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vigencia_fim: e.target.value }))
                }
              />
            </div>
          </div>

          <p className="text-xs text-text-secondary">
            Alteracoes na grade valem para as proximas geracoes de aulas. Aulas
            ja geradas nao sao modificadas automaticamente.
          </p>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </GlassCard>
      )}

      {loading && (
        <p className="text-sm text-text-secondary">Carregando grade...</p>
      )}

      {!loading && grade.length === 0 && (
        <GlassCard className="p-6 text-center space-y-2">
          <CalendarClock size={28} className="mx-auto text-text-secondary" />
          <p className="text-text-primary font-medium">
            Nenhum horario cadastrado
          </p>
          <p className="text-sm text-text-secondary">
            Cadastre os horarios recorrentes do Box e depois gere as aulas na
            tela "Aulas do Box".
          </p>
        </GlassCard>
      )}

      <div className="space-y-6">
        {DIAS_SEMANA_ORDEM.map((dia) => {
          const itens = grade.filter((g) => g.dia_semana === dia)
          if (itens.length === 0) return null

          return (
            <div key={dia} className="space-y-3">
              <h2 className="text-sm flex items-center gap-2 text-text-primary font-semibold">
                <CalendarClock size={14} />
                {DIA_SEMANA_LABEL[dia]}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {itens.map((g) => (
                  <GlassCard
                    key={g.id}
                    className={`p-4 space-y-2 ${!g.ativo ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="flex items-center gap-2 text-text-primary font-semibold">
                          <Clock size={14} />
                          {formatarHora(g.hora_inicio)} – {formatarHora(g.hora_fim)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          desde {formatarDataBR(g.vigencia_inicio)}
                          {g.vigencia_fim
                            ? ` ate ${formatarDataBR(g.vigencia_fim)}`
                            : ' (sem fim previsto)'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(g)}
                          title="Editar horario"
                          className="text-text-secondary hover:text-accent transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleAtivo(g)}
                          title={g.ativo ? 'Desativar' : 'Ativar'}
                          className={`transition-colors ${
                            g.ativo
                              ? 'text-success hover:text-warning'
                              : 'text-text-secondary hover:text-success'
                          }`}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={g.ativo ? 'accent' : 'default'}>
                        <Users size={11} className="mr-1" />
                        {g.capacidade} vagas
                      </Badge>
                      <Badge variant={g.ativo ? 'success' : 'default'}>
                        {g.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
