import { supabase } from './supabase'
import type {
  Usuario,
  Aluno,
  Coach,
  Programacao,
  Fase,
  Semana,
  DiaTreino,
  Treino,
  BlocoTreino,
  Resultado,
  Comentario,
  PersonalRecord,
  Frequencia,
  Exercicio,
} from '@/data/types'

/* =============================================================
   BOX
============================================================= */
export async function getBox() {
  const { data, error } = await supabase
    .from('boxes')
    .select('*')
    .eq('slug', 'olympea-warrior')
    .single()

  if (error) throw error
  return data
}

/* =============================================================
   USUARIOS
============================================================= */
export async function listarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('ativo', true)

  if (error) throw error
  return data as Usuario[]
}

export async function criarUsuario(usuario: Partial<Usuario>) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert(usuario)
    .select()
    .single()

  if (error) throw error
  return data as Usuario
}

export async function atualizarUsuario(id: string, usuario: Partial<Usuario>) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(usuario)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Usuario
}

export async function excluirUsuario(id: string) {
  const { error } = await supabase
    .from('usuarios')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}

export async function getUsuarioByEmail(email: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single()

  if (error) return null
  return data as Usuario
}

/* =============================================================
   ALUNOS
============================================================= */
export async function listarAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select('*, usuario:usuarios(*)')
    .eq('ativo', true)

  if (error) throw error
  return data as Aluno[]
}

export async function getAlunoById(id: string) {
  const { data, error } = await supabase
    .from('alunos')
    .select('*, usuario:usuarios(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Aluno
}

/* =============================================================
   COACHES
============================================================= */
export async function listarCoaches() {
  const { data, error } = await supabase
    .from('coaches')
    .select('*, usuario:usuarios(*)')
    .eq('ativo', true)

  if (error) throw error
  return data as Coach[]
}

/* =============================================================
   PROGRAMACOES
============================================================= */
export async function listarProgramacoes() {
  const { data, error } = await supabase
    .from('programacoes')
    .select('*')
    .eq('ativa', true)

  if (error) throw error
  return data as Programacao[]
}

/* =============================================================
   FASES
============================================================= */
export async function listarFasesByProg(programacaoId: string) {
  const { data, error } = await supabase
    .from('fases')
    .select('*')
    .eq('programacao_id', programacaoId)
    .eq('ativa', true)

  if (error) throw error
  return data as Fase[]
}

/* =============================================================
   SEMANAS
============================================================= */
export async function listarSemanasByFase(faseId: string) {
  const { data, error } = await supabase
    .from('semanas')
    .select('*')
    .eq('fase_id', faseId)
    .eq('ativa', true)

  if (error) throw error
  return data as Semana[]
}

/* =============================================================
   DIAS
============================================================= */
export async function listarDiasBySemana(semanaId: string) {
  const { data, error } = await supabase
    .from('dias_treino')
    .select('*')
    .eq('semana_id', semanaId)

  if (error) throw error
  return data as DiaTreino[]
}

/* =============================================================
   TREINOS
============================================================= */
export async function listarTreinosByDia(diaTreinoId: string) {
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('dia_treino_id', diaTreinoId)
    .eq('ativo', true)

  if (error) throw error
  return data as Treino[]
}

/* =============================================================
   BLOCOS
============================================================= */
export async function listarBlocosByTreino(treinoId: string) {
  const { data, error } = await supabase
    .from('blocos_treino')
    .select('*')
    .eq('treino_id', treinoId)
    .eq('ativo', true)
    .order('ordem')

  if (error) throw error
  return data as BlocoTreino[]
}

/* =============================================================
   EXERCICIOS
============================================================= */
export async function listarExercicios() {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')
    .eq('ativo', true)

  if (error) throw error
  return data as Exercicio[]
}

/* =============================================================
   RESULTADOS
============================================================= */
export async function listarResultadosByAluno(alunoId: string) {
  const { data, error } = await supabase
    .from('resultados')
    .select('*')
    .eq('aluno_id', alunoId)

  if (error) throw error
  return data as Resultado[]
}

export async function listarResultados() {
  const { data, error } = await supabase
    .from('resultados')
    .select('*')
    .order('data', { ascending: false })

  if (error) throw error
  return data as Resultado[]
}

export async function criarResultado(resultado: Partial<Resultado>) {
  const { data, error } = await supabase
    .from('resultados')
    .insert(resultado)
    .select()
    .single()

  if (error) throw error
  return data as Resultado
}

/* =============================================================
   COMENTARIOS
============================================================= */
export async function listarComentarios() {
  const { data, error } = await supabase
    .from('comentarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Comentario[]
}

export async function listarComentariosByResultado(resultadoId: string) {
  const { data, error } = await supabase
    .from('comentarios')
    .select('*')
    .eq('resultado_id', resultadoId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Comentario[]
}

export async function adicionarComentario(comentario: Partial<Comentario>) {
  const { data, error } = await supabase
    .from('comentarios')
    .insert(comentario)
    .select()
    .single()

  if (error) throw error
  return data as Comentario
}

/* =============================================================
   PRS
============================================================= */
export async function getPRsByAluno(alunoId: string) {
  const { data, error } = await supabase
    .from('prs')
    .select('*')
    .eq('aluno_id', alunoId)

  if (error) throw error
  return data as PersonalRecord[]
}

/* =============================================================
   FREQUENCIAS
============================================================= */
export async function getFrequenciasByAluno(alunoId: string) {
  const { data, error } = await supabase
    .from('frequencias')
    .select('*')
    .eq('aluno_id', alunoId)

  if (error) throw error
  return data as Frequencia[]
}

/* =============================================================
   AUTH
============================================================= */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}
