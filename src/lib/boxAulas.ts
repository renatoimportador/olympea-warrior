import { supabase } from './supabase'
import type {
  Aula,
  AulaOcupacao,
  DiaSemana,
  GradeAula,
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
