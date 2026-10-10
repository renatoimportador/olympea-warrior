import { supabase } from './supabase'
import type {
  Aula,
  AulaOcupacao,
  DiaSemana,
  GradeAula,
  Reserva,
  StatusReserva,
} from '@/data/types'

/* =============================================================
   Box Presencial - camada de dados (Etapa 3.2)
   Regras de negocio protegidas no PostgreSQL (migration 3.1):
   - gerar_aulas: RPC com validacoes de horizonte/escopo
   - capacidade/data/horario de aula: trigger app_aulas_protege_alteracao
   - ocupacao e janela de check-in: RPC listar_aulas_por_data
   A interface apenas consome; nao reimplementa validacoes.
   ============================================================= */

export const DIAS_SEMANA_ORDEM: DiaSemana[] = [
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SAB',
  'DOM',
]

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  SEG: 'Segunda',
  TER: 'Terca',
  QUA: 'Quarta',
  QUI: 'Quinta',
  SEX: 'Sexta',
  SAB: 'Sabado',
  DOM: 'Domingo',
}

/* Dia da semana (SEG..DOM) de uma data YYYY-MM-DD (calendario local). */
export function diaSemanaDeData(data: string): DiaSemana {
  const dow = new Date(data + 'T12:00:00').getDay() // 0=domingo
  return DIAS_SEMANA_ORDEM[(dow + 6) % 7]
}

/* Data atual em America/Sao_Paulo, formato YYYY-MM-DD. */
export function hojeSaoPaulo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(data + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/* Segunda-feira da semana que contem a data informada. */
export function segundaDaSemana(data: string): string {
  const d = new Date(data + 'T12:00:00')
  const dow = d.getDay() // 0=domingo
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function formatarDataBR(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarHora(hora: string): string {
  return hora.slice(0, 5)
}

/* Traduz codigos de erro do PostgreSQL para mensagens amigaveis. */
export function traduzirErroBoxAulas(erro: unknown): string {
  const msg = erro instanceof Error ? erro.message : String(erro || '')

  if (msg.includes('GERAR_AULAS_PASSADO'))
    return 'Nao e permitido gerar aulas em datas anteriores a hoje.'
  if (msg.includes('GERAR_AULAS_HORIZONTE'))
    return 'O periodo inicial esta alem do limite de geracao (hoje + 14 dias).'
  if (msg.includes('GERAR_AULAS_INTERVALO'))
    return 'O intervalo de geracao e invalido (maximo de 14 dias por vez).'
  if (msg.includes('GERAR_AULAS_BOX_NAO_AUTORIZADO'))
    return 'Voce so pode gerar aulas do seu proprio Box.'
  if (msg.includes('GERAR_AULAS_PARAMETROS'))
    return 'Informe o box e o periodo para gerar as aulas.'
  if (msg.includes('AULA_HORARIO_BLOQUEADO'))
    return 'Existem reservas ocupando vagas nesta aula. Resolva as reservas antes de alterar data ou horario.'
  if (msg.includes('AULA_CAPACIDADE_INVALIDA'))
    return 'A nova capacidade e inferior ao numero de vagas ja ocupadas.'
  if (msg.includes('chk_grade_aulas_horarios') || msg.includes('chk_aulas_horarios'))
    return 'O horario de termino deve ser posterior ao horario de inicio.'
  if (msg.includes('chk_grade_aulas_capacidade') || msg.includes('chk_aulas_capacidade'))
    return 'A capacidade deve ser maior que zero.'
  if (msg.includes('chk_grade_aulas_vigencia'))
    return 'A vigencia final nao pode ser anterior a vigencia inicial.'
  if (msg.includes('uq_aulas_box_data_hora'))
    return 'Ja existe uma aula neste Box, nesta data e horario.'
  if (msg.includes('row-level security'))
    return 'Voce nao tem permissao para esta operacao.'

  /* Check-in (realizar_checkin) */
  if (msg.includes('CHECKIN_SESSAO_INVALIDA') || msg.includes('CHECKIN_ALUNO_INVALIDO'))
    return 'Sessao invalida. Entre novamente para fazer check-in.'
  if (msg.includes('CHECKIN_SOMENTE_ALUNO'))
    return 'Apenas alunos realizam check-in.'
  if (msg.includes('CHECKIN_AULA_INEXISTENTE'))
    return 'Aula nao encontrada.'
  if (msg.includes('CHECKIN_AULA_CANCELADA'))
    return 'Esta aula foi cancelada e nao aceita check-in.'
  if (msg.includes('CHECKIN_JANELA_FECHADA'))
    return 'O check-in para esta aula ainda nao esta aberto (abre 12 horas antes do inicio).'
  if (msg.includes('CHECKIN_JANELA_ENCERRADA'))
    return 'O check-in para esta aula ja foi encerrado (fecha 10 minutos antes do inicio).'
  if (msg.includes('CHECKIN_SEM_INSCRICAO'))
    return 'Voce precisa de uma inscricao ativa no Box Presencial para fazer check-in.'
  if (msg.includes('CHECKIN_DUPLICADO'))
    return 'Voce ja possui uma reserva nesta aula.'
  if (msg.includes('CHECKIN_LOTADA'))
    return 'Aula lotada — todas as vagas foram preenchidas.'

  /* Cancelamento (cancelar_reserva) */
  if (msg.includes('CANCELAR_SESSAO_INVALIDA'))
    return 'Sessao invalida. Entre novamente para cancelar a reserva.'
  if (msg.includes('CANCELAR_RESERVA_INEXISTENTE'))
    return 'Reserva nao encontrada.'
  if (msg.includes('CANCELAR_NAO_AUTORIZADO'))
    return 'Voce so pode cancelar a propria reserva.'
  if (msg.includes('CANCELAR_PERFIL_INVALIDO'))
    return 'Cancelamento disponivel apenas para o proprio aluno.'
  if (msg.includes('CANCELAR_JA_CANCELADA'))
    return 'Esta reserva ja esta cancelada.'
  if (msg.includes('CANCELAR_PRESENCA_CONFIRMADA'))
    return 'Nao e possivel cancelar: sua presenca ja foi confirmada pelo coach.'
  if (msg.includes('CANCELAR_AUSENCIA_REGISTRADA'))
    return 'Nao e possivel cancelar: ausencia ja registrada pelo coach.'

  /* Confirmacao de presenca (confirmar_presenca) */
  if (msg.includes('PRESENCA_SESSAO_INVALIDA'))
    return 'Sessao invalida. Entre novamente para registrar a presenca.'
  if (msg.includes('PRESENCA_PERFIL_INVALIDO'))
    return 'Apenas coach ou administrador registram presenca.'
  if (msg.includes('PRESENCA_RESERVA_INEXISTENTE'))
    return 'Reserva nao encontrada.'
  if (msg.includes('PRESENCA_NAO_AUTORIZADA'))
    return 'Aula fora do escopo do seu Box.'
  if (msg.includes('PRESENCA_AULA_CANCELADA'))
    return 'Nao e possivel registrar presenca em aula cancelada.'
  if (msg.includes('PRESENCA_ANTES_DO_INICIO'))
    return 'A confirmacao de presenca so e permitida a partir do inicio da aula.'
  if (msg.includes('PRESENCA_ESTADO_INVALIDO'))
    return 'Apenas reservas CONFIRMADAS podem ter presenca registrada.'

  return msg || 'Erro inesperado. Tente novamente.'
}

/* ========================= GRADE SEMANAL ========================= */

export async function listarGradeAulas(): Promise<GradeAula[]> {
  const { data, error } = await supabase
    .from('grade_aulas')
    .select('*')
    .order('hora_inicio', { ascending: true })

  if (error) throw error

  const aulas = (data || []) as GradeAula[]
  return aulas.sort(
    (a, b) =>
      DIAS_SEMANA_ORDEM.indexOf(a.dia_semana) -
        DIAS_SEMANA_ORDEM.indexOf(b.dia_semana) ||
      a.hora_inicio.localeCompare(b.hora_inicio)
  )
}

export async function criarGradeAula(
  grade: Omit<GradeAula, 'id' | 'box_id' | 'created_at' | 'updated_at'> & {
    box_id: string
  }
): Promise<GradeAula> {
  const { data, error } = await supabase
    .from('grade_aulas')
    .insert(grade)
    .select()
    .single()

  if (error) throw error
  return data as GradeAula
}

export async function atualizarGradeAula(
  id: string,
  dados: Partial<
    Pick<
      GradeAula,
      | 'dia_semana'
      | 'hora_inicio'
      | 'hora_fim'
      | 'capacidade'
      | 'ativo'
      | 'vigencia_inicio'
      | 'vigencia_fim'
    >
  >
): Promise<void> {
  const { error } = await supabase.from('grade_aulas').update(dados).eq('id', id)
  if (error) throw error
}

export async function definirGradeAulaAtiva(
  id: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from('grade_aulas')
    .update({ ativo })
    .eq('id', id)
  if (error) throw error
}

/* ========================= AULAS (ocorrencias) ========================= */

/* RPC gerar_aulas — retorna a quantidade de aulas criadas. */
export async function gerarAulas(
  boxId: string,
  dataInicio: string,
  dataFim: string
): Promise<number> {
  const { data, error } = await supabase.rpc('gerar_aulas', {
    p_box_id: boxId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
  })

  if (error) throw error
  return (data as number) ?? 0
}

/* RPC listar_aulas_por_data — aulas do box do usuario na data, com ocupacao. */
export async function listarAulasComOcupacao(
  data: string
): Promise<AulaOcupacao[]> {
  const { data: rows, error } = await supabase.rpc('listar_aulas_por_data', {
    p_data: data,
  })

  if (error) throw error
  return (rows || []) as AulaOcupacao[]
}

/* Leitura direta da ocorrencia (admin do box via RLS). */
export async function getAula(id: string): Promise<Aula | null> {
  const { data, error } = await supabase
    .from('aulas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data as Aula) || null
}

/* Cancelamento pontual: altera SOMENTE a ocorrencia (a grade nao muda).
   Reservas existentes sao preservadas pelo banco. */
export async function cancelarAula(id: string, motivo: string): Promise<void> {
  const { error } = await supabase
    .from('aulas')
    .update({ status: 'CANCELADA', motivo_cancelamento: motivo })
    .eq('id', id)

  if (error) throw error
}

/* Ajuste de capacidade da ocorrencia. O trigger do banco impede reduzir
   abaixo das vagas ocupadas. */
export async function atualizarCapacidadeAula(
  id: string,
  capacidade: number
): Promise<void> {
  const { error } = await supabase
    .from('aulas')
    .update({ capacidade })
    .eq('id', id)

  if (error) throw error
}

/* ========================= CHECK-IN DO ALUNO ========================= */

/* RPC realizar_checkin(p_aula_id) — valida janela 12h/10min, elegibilidade,
   duplicidade e capacidade no banco. Retorna o id da reserva criada. */
export async function realizarCheckin(aulaId: string): Promise<string> {
  const { data, error } = await supabase.rpc('realizar_checkin', {
    p_aula_id: aulaId,
  })

  if (error) throw error
  return data as string
}

/* RPC cancelar_reserva(p_reserva_id) — permitido a qualquer momento,
   inclusive apos o encerramento da janela. */
export async function cancelarReservaAluno(reservaId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_reserva', {
    p_reserva_id: reservaId,
  })

  if (error) throw error
}

/* Minhas reservas nas aulas informadas (RLS: aluno ve apenas as proprias). */
export async function listarMinhasReservas(aulaIds: string[]): Promise<Reserva[]> {
  if (aulaIds.length === 0) return []

  const { data, error } = await supabase
    .from('reservas')
    .select('id, aula_id, aluno_id, status, checkin_at, cancelado_at, presenca_confirmada_at, created_at')
    .in('aula_id', aulaIds)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Reserva[]
}

/* ========================= PRESENCA (COACH/ADMIN) ========================= */

/* Reserva com o nome do aluno (leitura via RLS: coach/admin do box da aula
   veem todas as reservas do seu box — policy reservas_select_autorizadas). */
export interface ReservaComAluno extends Reserva {
  aluno_nome: string | null
}

/* Reservas de uma aula com nome dos alunos. Somente leitura; mutacoes
   exclusivamente via RPC confirmar_presenca. */
export async function listarReservasDaAula(
  aulaId: string
): Promise<ReservaComAluno[]> {
  const { data, error } = await supabase
    .from('reservas')
    .select(
      `id, aula_id, aluno_id, status, checkin_at, cancelado_at,
       presenca_confirmada_at, presenca_confirmada_por, created_at,
       alunos ( usuarios ( nome ) )`
    )
    .eq('aula_id', aulaId)
    .order('created_at', { ascending: true })

  if (error) throw error

  /* PostgREST pode retornar o relacionamento aninhado como objeto ou array;
     fazemos parsing defensivo. */
  const linhas = (data || []) as unknown as Array<
    Reserva & { alunos?: unknown }
  >

  function nomeDoAluno(alunos: unknown): string | null {
    const rel = Array.isArray(alunos) ? alunos[0] : alunos
    if (!rel || typeof rel !== 'object') return null
    const usuario = (rel as { usuarios?: unknown }).usuarios
    const u = Array.isArray(usuario) ? usuario[0] : usuario
    if (!u || typeof u !== 'object') return null
    const nome = (u as { nome?: unknown }).nome
    return typeof nome === 'string' ? nome : null
  }

  return linhas.map((r) => ({
    ...r,
    aluno_nome: nomeDoAluno(r.alunos),
  }))
}

/* RPC confirmar_presenca(p_reserva_id, p_compareceu) — valida no backend:
   papel coach/admin, escopo do box, aula iniciada e reserva CONFIRMADA. */
export async function confirmarPresenca(
  reservaId: string,
  compareceu: boolean
): Promise<void> {
  const { error } = await supabase.rpc('confirmar_presenca', {
    p_reserva_id: reservaId,
    p_compareceu: compareceu,
  })

  if (error) throw error
}

/* Instante de inicio de uma aula (data + hora em America/Sao_Paulo). */
export function inicioDaAula(data: string, horaInicio: string): Date {
  return new Date(`${data}T${horaInicio.slice(0, 8)}-03:00`)
}

/* ========================= FREQUENCIA (ADMIN) ========================= */

/* Linha do relatorio de frequencia: reserva + aula + nome do aluno.
   Leitura agregada no cliente, respeitando RLS (admin ve apenas reservas
   das aulas do seu box — policy reservas_select_autorizadas). */
export interface FrequenciaBoxLinha {
  reserva_id: string
  aula_id: string
  aluno_id: string
  status: StatusReserva
  data: string
  hora_inicio: string
  hora_fim: string
  aluno_nome: string | null
}

/* Relatorio de frequencia do Box num periodo, com filtros opcionais.
   Nao usa a tabela `frequencias` da Planilha — somente reservas/aulas. */
export async function listarFrequenciaBox(params: {
  dataInicio: string
  dataFim: string
  alunoId?: string
  status?: StatusReserva
}): Promise<FrequenciaBoxLinha[]> {
  const { dataInicio, dataFim, alunoId, status } = params

  let query = supabase
    .from('reservas')
    .select(
      `id, aula_id, aluno_id, status,
       aulas!inner ( data, hora_inicio, hora_fim ),
       alunos ( usuarios ( nome ) )`
    )
    .gte('aulas.data', dataInicio)
    .lte('aulas.data', dataFim)

  if (alunoId) query = query.eq('aluno_id', alunoId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error

  const linhas = (data || []) as unknown as Array<{
    id: string
    aula_id: string
    aluno_id: string
    status: StatusReserva
    aulas: { data: string; hora_inicio: string; hora_fim: string } | Array<{ data: string; hora_inicio: string; hora_fim: string }>
    alunos: unknown
  }>

  const resultado = linhas.map((r) => {
    const aula = Array.isArray(r.aulas) ? r.aulas[0] : r.aulas
    return {
      reserva_id: r.id,
      aula_id: r.aula_id,
      aluno_id: r.aluno_id,
      status: r.status,
      data: aula?.data ?? '',
      hora_inicio: aula?.hora_inicio ?? '',
      hora_fim: aula?.hora_fim ?? '',
      aluno_nome: nomeDoAlunoFrequencia(r.alunos),
    } as FrequenciaBoxLinha
  })

  return resultado.sort(
    (a, b) =>
      a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio)
  )
}

/* Reuso interno do parsing defensivo do join alunos->usuarios->nome. */
function nomeDoAlunoFrequencia(alunos: unknown): string | null {
  const rel = Array.isArray(alunos) ? alunos[0] : alunos
  if (!rel || typeof rel !== 'object') return null
  const usuario = (rel as { usuarios?: unknown }).usuarios
  const u = Array.isArray(usuario) ? usuario[0] : usuario
  if (!u || typeof u !== 'object') return null
  const nome = (u as { nome?: unknown }).nome
  return typeof nome === 'string' ? nome : null
}

/* Alunos do box (para o filtro). Leitura base legada (RLS permissiva). */
export async function listarAlunosBox(): Promise<
  Array<{ aluno_id: string; nome: string }>
> {
  const { data, error } = await supabase
    .from('alunos')
    .select('id, usuarios ( nome )')
    .eq('ativo', true)

  if (error) throw error

  const linhas = (data || []) as unknown as Array<{ id: string; usuarios: unknown }>
  const resultado = linhas.map((r) => {
    const usuario = Array.isArray(r.usuarios) ? r.usuarios[0] : r.usuarios
    const nome =
      usuario && typeof usuario === 'object'
        ? (usuario as { nome?: string }).nome ?? null
        : null
    return { aluno_id: r.id, nome: nome ?? 'Aluno' }
  })

  return resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
