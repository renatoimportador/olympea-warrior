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

/* ========================= BOX ========================= */
export async function getBox() {
  const { data, error } = await supabase
    .from('boxes')
    .select('*')
    .eq('slug', 'olympea-warrior')
    .single()

  if (error) throw error
  return data
}

/* ========================= USUARIOS ========================= */
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
  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single()

  return data as Usuario
}

/* ========================= ALUNOS ========================= */
export async function listarAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select('*, usuario:usuarios(*)')
    .eq('ativo', true)

  if (error) throw error
  return data as Aluno[]
}

export async function criarAluno(aluno: Partial<Aluno>) {
  const { data, error } = await supabase
    .from('alunos')
    .insert(aluno)
    .select()
    .single()

  if (error) throw error
  return data as Aluno
}

export async function atualizarAluno(id: string, aluno: Partial<Aluno>) {
  const { data, error } = await supabase
    .from('alunos')
    .update(aluno)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Aluno
}

export async function excluirAluno(id: string) {
  const { error } = await supabase
    .from('alunos')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}

export async function getAlunoByUsuarioId(uid: string) {
  const { data } = await supabase
    .from('alunos')
    .select('*')
    .eq('usuario_id', uid)
    .single()

  return data as Aluno
}

export async function getAlunoById(id: string) {
  const { data } = await supabase
    .from('alunos')
    .select('*')
    .eq('id', id)
    .single()

  return data as Aluno
}

/* ========================= COACHES ========================= */
export async function listarCoaches() {
  const { data, error } = await supabase
    .from('coaches')
    .select('*, usuario:usuarios(*)')
    .eq('ativo', true)

  if (error) throw error
  return data as Coach[]
}

export async function criarCoach(coach: Partial<Coach>) {
  const { data, error } = await supabase
    .from('coaches')
    .insert(coach)
    .select()
    .single()

  if (error) throw error
  return data as Coach
}

export async function atualizarCoach(id: string, coach: Partial<Coach>) {
  const { data, error } = await supabase
    .from('coaches')
    .update(coach)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Coach
}

export async function excluirCoach(id: string) {
  const { error } = await supabase
    .from('coaches')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}

/* ========================= PROGRAMACOES ========================= */
export async function listarProgramacoes() {
  const { data, error } = await supabase
    .from('programacoes')
    .select('*')
    .eq('ativa', true)

  if (error) throw error
  return data as Programacao[]
}

export const criarProgramacao = async (data: Partial<Programacao>) =>
  (await supabase.from('programacoes').insert(data).select().single()).data

export const atualizarProgramacao = async (id: string, data: Partial<Programacao>) =>
  supabase.from('programacoes').update(data).eq('id', id)

export const excluirProgramacao = async (id: string) =>
  supabase.from('programacoes').update({ ativa: false }).eq('id', id)

export async function getProgramacoesByAluno(alunoId: string) {
  const { data } = await supabase
    .from('inscricoes')
    .select('programacao:programacoes(*)')
    .eq('aluno_id', alunoId)

  return (data?.map((i: any) => i.programacao) || []) as Programacao[]
}

/* ========================= FASES ========================= */
export const listarFasesByProg = async (programacaoId: string) =>
  (await supabase.from('fases').select('*').eq('programacao_id', programacaoId)).data as Fase[]

export const getFaseById = async (id: string) =>
  (await supabase.from('fases').select('*').eq('id', id).single()).data as Fase

export const criarFase = async (fase: Partial<Fase>) =>
  (await supabase.from('fases').insert(fase).select().single()).data

export const atualizarFase = async (id: string, fase: Partial<Fase>) =>
  supabase.from('fases').update(fase).eq('id', id)

export const excluirFase = async (id: string) =>
  supabase.from('fases').update({ ativa: false }).eq('id', id)

/* ========================= SEMANAS ========================= */
export const listarSemanasByFase = async (faseId: string) =>
  (await supabase.from('semanas').select('*').eq('fase_id', faseId)).data as Semana[]

export const getSemanaById = async (id: string) =>
  (await supabase.from('semanas').select('*').eq('id', id).single()).data as Semana

export const criarSemana = async (semana: Partial<Semana>) =>
  (await supabase.from('semanas').insert(semana).select().single()).data

export const atualizarSemana = async (id: string, semana: Partial<Semana>) =>
  supabase.from('semanas').update(semana).eq('id', id)

export const excluirSemana = async (id: string) =>
  supabase.from('semanas').update({ ativa: false }).eq('id', id)

/* ========================= DIAS ========================= */
export const listarDiasBySemana = async (semanaId: string) =>
  (await supabase.from('dias_treino').select('*').eq('semana_id', semanaId)).data as DiaTreino[]

export const getDiaById = async (id: string) =>
  (await supabase.from('dias_treino').select('*').eq('id', id).single()).data as DiaTreino

export const criarDia = async (dia: Partial<DiaTreino>) =>
  (await supabase.from('dias_treino').insert(dia).select().single()).data

/* ========================= TREINOS ========================= */
export const listarTreinosByDia = async (diaTreinoId: string) =>
  (await supabase.from('treinos').select('*').eq('dia_treino_id', diaTreinoId)).data as Treino[]

export const getTreinoById = async (id: string) =>
  (await supabase.from('treinos').select('*').eq('id', id).single()).data as Treino

export const getTreinoByDia = async (diaTreinoId: string) =>
  (await supabase.from('treinos').select('*').eq('dia_treino_id', diaTreinoId).single()).data as Treino

export const criarTreino = async (treino: Partial<Treino>) =>
  (await supabase.from('treinos').insert(treino).select().single()).data

export const atualizarTreino = async (id: string, treino: Partial<Treino>) =>
  supabase.from('treinos').update(treino).eq('id', id)

export const excluirTreino = async (id: string) =>
  supabase.from('treinos').update({ ativo: false }).eq('id', id)

/* ========================= BLOCOS ========================= */
export const listarBlocosByTreino = async (treinoId: string) =>
  (await supabase.from('blocos_treino').select('*').eq('treino_id', treinoId)).data as BlocoTreino[]

export const adicionarBloco = async (bloco: Partial<BlocoTreino>) =>
  (await supabase.from('blocos_treino').insert(bloco).select().single()).data

export const atualizarBloco = async (id: string, bloco: Partial<BlocoTreino>) =>
  supabase.from('blocos_treino').update(bloco).eq('id', id)

export const removerBloco = async (id: string) =>
  supabase.from('blocos_treino').update({ ativo: false }).eq('id', id)

/* ========================= EXERCICIOS ========================= */
export async function listarExercicios() {
  const { data } = await supabase
    .from('exercicios')
    .select('*')

  return data as Exercicio[]
}

/* ========================= RESULTADOS ========================= */
export async function listarResultados() {
  const { data } = await supabase
    .from('resultados')
    .select('*')
    .order('data', { ascending: false })

  return data as Resultado[]
}

export async function listarResultadosByAluno(alunoId: string) {
  const { data } = await supabase
    .from('resultados')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('data', { ascending: false })

  return data as Resultado[]
}

export async function criarResultado(resultado: Partial<Resultado>) {
  const { data } = await supabase
    .from('resultados')
    .insert(resultado)
    .select()
    .single()

  return data as Resultado
}

/* ========================= COMENTARIOS ========================= */
export async function listarComentarios() {
  const { data } = await supabase
    .from('comentarios')
    .select('*')
    .order('created_at', { ascending: false })

  return data as Comentario[]
}

export async function listarComentariosByResultado(resultadoId: string) {
  const { data } = await supabase
    .from('comentarios')
    .select('*')
    .eq('resultado_id', resultadoId)
    .order('created_at', { ascending: true })

  return data as Comentario[]
}

export async function adicionarComentario(comentario: Partial<Comentario>) {
  const { data } = await supabase
    .from('comentarios')
    .insert(comentario)
    .select()
    .single()

  return data as Comentario
}

/* ========================= PRS ========================= */
export async function getPRsByAluno(alunoId: string) {
  const { data } = await supabase
    .from('prs')
    .select('*')
    .eq('aluno_id', alunoId)

  return data as PersonalRecord[]
}

/* ========================= FREQUENCIAS ========================= */
export async function getFrequenciasByAluno(alunoId: string) {
  const { data } = await supabase
    .from('frequencias')
    .select('*')
    .eq('aluno_id', alunoId)

  return data as Frequencia[]
}

/* ========================= AUTH ========================= */
export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  return await supabase.auth.signOut()
}
