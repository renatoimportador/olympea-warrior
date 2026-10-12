import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  listarAlunos,
  atualizarAluno,
  excluirAluno,
  atualizarUsuario,
  criarAcessoUsuario,
  reenviarConvite,
} from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useBox } from '@/context/BoxContext'
import {
  MODALIDADES,
  aplicarModalidades,
  derivarEstadoModalidades,
  listarProgramacoesPorModalidade,
  obterInscricoesAluno,
  obterModalidadesPorAluno,
  rotuloModalidades,
  type SelecaoModalidades,
} from '@/lib/modalidades'
import type { Aluno, ModalidadeProgramacao, Programacao } from '@/data/types'
import { Search, Plus, Edit2, Ban, Save, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

/* Selecao inicial do formulario: nenhuma modalidade marcada. */
function selecaoVazia(): SelecaoModalidades {
  return {
    PLANILHA: { marcada: false, programacaoId: null },
    BOX_PRESENCIAL: { marcada: false, programacaoId: null },
  }
}

export function GerenciarAlunos() {
  const { box } = useBox()

  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [niveis, setNiveis] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  /* Etapa 4.4: modalidades de treinamento (fonte: inscricoes reais). */
  const [programacoesModalidade, setProgramacoesModalidade] = useState<
    Record<ModalidadeProgramacao, Programacao[]>
  >({ PLANILHA: [], BOX_PRESENCIAL: [] })
  const [modalidadesPorAluno, setModalidadesPorAluno] = useState<
    Map<string, Set<ModalidadeProgramacao>>
  >(new Map())
  const [selecao, setSelecao] = useState<SelecaoModalidades>(selecaoVazia())

  const [form, setForm] = useState({
    nome: '',
    email: '',
    categoria: '',
    peso: '',
    altura: '',
    telefone: '',
  })

  async function carregarAlunos() {
    try {
      const data = await listarAlunos()
      setAlunos(data)
    } catch {
      toast.error('Erro ao carregar alunos')
    }
  }

  async function carregarNiveis() {
    const { data, error } = await supabase
      .from('niveis')
      .select('*')

    if (error) {
      console.error('Erro ao carregar niveis:', error)
      toast.error('Erro ao carregar niveis')
      return
    }

    const ativos = (data || []).filter((n: any) => n.ativo !== false)
    ativos.sort((a: any, b: any) => (a.ordem ?? 999) - (b.ordem ?? 999))

    setNiveis(ativos)
  }

  /* Carrega as programacoes ativas do Box por modalidade e o mapa
     aluno -> modalidades ativas (para o formulario e a listagem). */
  async function carregarModalidades() {
    if (!box?.id) return
    try {
      const grupos = await listarProgramacoesPorModalidade(box.id)
      setProgramacoesModalidade(grupos)

      const todosIds = [...grupos.PLANILHA, ...grupos.BOX_PRESENCIAL].map(
        (p) => p.id
      )
      const mapa = await obterModalidadesPorAluno(todosIds)
      setModalidadesPorAluno(mapa)
    } catch (e: any) {
      console.error('Erro ao carregar modalidades:', e)
      toast.error('Erro ao carregar modalidades dos alunos')
    }
  }

  useEffect(() => {
    carregarAlunos()
    carregarNiveis()
  }, [])

  useEffect(() => {
    carregarModalidades()
  }, [box?.id])

  function resetForm() {
    setForm({
      nome: '',
      email: '',
      categoria: niveis.length > 0 ? niveis[0].slug : '',
      peso: '',
      altura: '',
      telefone: '',
    })
    setSelecao(selecaoVazia())
    setEditingId(null)
  }

  /* ---------- Controles de modalidade do formulario ---------- */

  function alternarModalidade(id: ModalidadeProgramacao, marcada: boolean) {
    setSelecao((prev) => {
      const progs = programacoesModalidade[id] || []

      let programacaoId: string | null = null
      if (marcada) {
        /* Com uma unica programacao elegivel, pre-seleciona; com varias,
           mantem a atual ou exige escolha explicita do administrador. */
        if (progs.length === 1) {
          programacaoId = progs[0].id
        } else {
          programacaoId = prev[id].programacaoId
        }
      }

      return { ...prev, [id]: { marcada, programacaoId } }
    })
  }

  function escolherProgramacao(id: ModalidadeProgramacao, programacaoId: string) {
    setSelecao((prev) => ({
      ...prev,
      [id]: { marcada: true, programacaoId },
    }))
  }

  /* Valida a selecao: pelo menos uma modalidade quando houver opcoes. */
  function validarSelecao(): boolean {
    const algumaElegivel =
      programacoesModalidade.PLANILHA.length > 0 ||
      programacoesModalidade.BOX_PRESENCIAL.length > 0

    if (!algumaElegivel) {
      toast(
        'Nenhuma programacao ativa encontrada no Box. O aluno sera cadastrado sem modalidade (usara o fallback da Planilha).',
        { duration: 6000, icon: '⚠' }
      )
      return true
    }

    const marcadas = MODALIDADES.filter((m) => selecao[m.id].marcada)
    if (marcadas.length === 0) {
      toast.error('Selecione pelo menos uma modalidade de treinamento')
      return false
    }

    for (const m of marcadas) {
      if (!selecao[m.id].programacaoId) {
        const progs = programacoesModalidade[m.id] || []
        if (progs.length === 0) {
          toast.error(`Nao ha programacao ativa de ${m.label} neste Box`)
          return false
        }
        toast.error(`Selecione a programacao de ${m.label}`)
        return false
      }
    }

    return true
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Preencha nome e email')
      return
    }

    if (!form.categoria) {
      toast.error('Selecione o nivel/categoria')
      return
    }

    if (!validarSelecao()) return

    if (saving) return
    setSaving(true)

    try {
      if (editingId) {
        // Edicao: mantem fluxo direto (nao cria auth user). A identidade,
        // historico e resultados sao preservados; so as inscricoes mudam.
        const alunoAtual = alunos.find((a) => a.id === editingId)
        if (!alunoAtual) return

        await atualizarUsuario(alunoAtual.usuario_id, {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || undefined,
        })

        await atualizarAluno(editingId, {
          categoria: form.categoria as any,
          peso_atual: form.peso ? parseFloat(form.peso) : undefined,
          altura: form.altura ? parseFloat(form.altura.replace(',', '.')) : undefined,
        })

        /* Etapa 4.4: sincroniza as inscricoes com as modalidades marcadas
           (ativa/reinsere/desativa — nunca exclui, nunca duplica). */
        const inscricoes = await obterInscricoesAluno(editingId)
        await aplicarModalidades(editingId, selecao, inscricoes)

        toast.success('Aluno atualizado!')
      } else {
        // Criacao: usa API segura que cria auth user + envia convite
        const result = await criarAcessoUsuario({
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          role: 'aluno',
          box_id: box?.id || undefined,
          dadosExtra: {
            categoria: form.categoria,
            peso_atual: form.peso || undefined,
            altura: form.altura || undefined,
          }
        })

        /* Etapa 4.4: cria as inscricoes nas modalidades selecionadas.
           Busca o aluno pelo usuario_id retornado pela API. */
        if (result.usuario_id) {
          const { data: alunoCriado, error: erroAluno } = await supabase
            .from('alunos')
            .select('id')
            .eq('usuario_id', result.usuario_id)
            .maybeSingle()

          if (erroAluno || !alunoCriado) {
            toast.error(
              'Aluno cadastrado, mas nao foi possivel localizar o registro para criar as inscricoes. Edite o aluno e selecione as modalidades.',
              { duration: 8000 }
            )
          } else {
            /* Aluno reativado pode ter inscricoes antigas — considera-as
               para reativar sem duplicar. */
            const inscricoes = await obterInscricoesAluno(alunoCriado.id)
            await aplicarModalidades(alunoCriado.id, selecao, inscricoes)
          }
        }

        if (result.warning) {
          toast.success(result.message, { duration: 6000 })
        } else {
          toast.success(result.message || 'Aluno cadastrado com sucesso!', { duration: 5000 })
        }
      }

      resetForm()
      setShowForm(false)
      await carregarAlunos()
      await carregarModalidades()
    } catch (e: any) {
      console.error('Erro ao salvar aluno:', e)
      toast.error(e?.message || 'Erro ao salvar aluno')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(a: any) {
    setForm({
      nome: a.usuario?.nome || '',
      email: a.usuario?.email || '',
      categoria: a.categoria || '',
      peso: a.peso_atual ? String(a.peso_atual) : '',
      altura: a.altura ? String(a.altura) : '',
      telefone: a.usuario?.telefone || '',
    })

    /* Etapa 4.4: preenche as modalidades a partir das inscricoes REAIS
       do aluno (ativas e inativas). */
    let selecaoInicial = selecaoVazia()
    try {
      const inscricoes = await obterInscricoesAluno(a.id)
      const estado = derivarEstadoModalidades(inscricoes)
      for (const m of MODALIDADES) {
        const ativa = estado.selecionada[m.id]
        const progs = programacoesModalidade[m.id] || []
        selecaoInicial = {
          ...selecaoInicial,
          [m.id]: {
            marcada: ativa != null,
            programacaoId:
              ativa ?? (progs.length === 1 ? progs[0].id : null),
          },
        }
      }
    } catch (e: any) {
      console.error('Erro ao carregar inscricoes do aluno:', e)
      toast.error('Erro ao carregar modalidades do aluno')
    }
    setSelecao(selecaoInicial)

    setEditingId(a.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este aluno?')) return
    try {
      await excluirAluno(id)
      toast.success('Aluno excluido!')
      carregarAlunos()
    } catch {
      toast.error('Erro ao excluir aluno')
    }
  }

  async function handleReenviarConvite(email: string) {
    try {
      const result = await reenviarConvite(email)
      toast.success(result.message || 'Convite reenviado!')
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao reenviar convite')
    }
  }

  const alunosFiltrados = alunos.filter((a: any) => {
    const termo = busca.toLowerCase()
    return (
      a.usuario?.nome?.toLowerCase().includes(termo) ||
      a.categoria?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gerenciar Alunos</h1>
          <p className="text-sm text-text-secondary">{alunos.length} alunos cadastrados</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus size={18} className="mr-2" />
          Novo Aluno
        </Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input className="pl-10" placeholder="Buscar aluno..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {showForm && (
        <GlassCard className="p-5 space-y-4">
          <h3>{editingId ? 'Editar Aluno' : 'Novo Aluno'}</h3>
          {!editingId && (
            <p className="text-xs text-text-secondary">
              Ao cadastrar, um convite será enviado por e-mail para o aluno criar a própria senha.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!!editingId}
            />
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="glass-input w-full"
            >
              <option value="">Selecione o nivel</option>
              {niveis.map((n: any) => (
                <option key={n.id} value={n.slug}>
                  {n.nome}
                </option>
              ))}
            </select>
            <Input placeholder="Peso (kg)" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            <Input placeholder="Altura (m)" value={form.altura} onChange={(e) => setForm({ ...form, altura: e.target.value })} />
            <Input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>

          {/* Etapa 4.4: Modalidades de treinamento */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              Modalidades de treinamento
            </p>
            <p className="text-xs text-text-secondary">
              As modalidades controlam o acesso do aluno aos treinos da Planilha e
              às aulas presenciais do Box (check-in). O histórico, os resultados e
              as reservas existentes são sempre preservados.
            </p>
            {MODALIDADES.map((m) => {
              const progs = programacoesModalidade[m.id] || []
              const sel = selecao[m.id]
              const semProgramacao = progs.length === 0

              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-3 space-y-2 transition ${
                    sel.marcada
                      ? 'border-accent/30 bg-accent/[0.04]'
                      : 'border-white/[0.06]'
                  }`}
                >
                  <label
                    className={`flex items-start gap-3 ${
                      semProgramacao ? 'opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sel.marcada}
                      disabled={semProgramacao}
                      onChange={(e) => alternarModalidade(m.id, e.target.checked)}
                      className="mt-0.5 accent-[var(--color-accent)]"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {m.label}
                      </p>
                      <p className="text-xs text-text-secondary">{m.descricao}</p>
                    </div>
                  </label>

                  {semProgramacao && (
                    <p className="text-xs text-warning pl-6">
                      Nenhuma programação ativa desta modalidade no Box.
                    </p>
                  )}

                  {sel.marcada && progs.length === 1 && (
                    <p className="text-xs text-text-secondary pl-6">
                      Programação: <span className="text-text-primary">{progs[0].nome}</span>
                    </p>
                  )}

                  {sel.marcada && progs.length > 1 && (
                    <select
                      value={sel.programacaoId ?? ''}
                      onChange={(e) => escolherProgramacao(m.id, e.target.value)}
                      className="glass-input w-full"
                    >
                      <option value="">Selecione a programação</option>
                      {progs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-2">
        {alunosFiltrados.map((a: any) => {
          const rotulo = rotuloModalidades(modalidadesPorAluno.get(a.id))
          return (
            <GlassCard key={a.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                {a.usuario?.nome?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p>{a.usuario?.nome}</p>
                <p className="text-xs text-text-secondary truncate">{a.usuario?.email}</p>
              </div>
              {rotulo && (
                <Badge variant="accent" className="hidden sm:inline-flex">
                  {rotulo}
                </Badge>
              )}
              <Badge>{a.categoria}</Badge>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReenviarConvite(a.usuario?.email)}
                  title="Reenviar convite"
                  className="p-1.5 rounded-lg hover:bg-accent/10 text-text-secondary hover:text-accent"
                >
                  <Mail size={14} />
                </button>
                <button onClick={() => handleEdit(a)}><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-error/5 text-error"><Ban size={14} /></button>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
