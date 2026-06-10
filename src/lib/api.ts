import { supabase } from './supabase'
import type {
  Usuario, Aluno, Coach, Programacao, Fase, Semana, DiaTreino,
  Treino, BlocoTreino, Resultado, Comentario, PersonalRecord,
  Frequencia, Notificacao, Exercicio, Ranking,
} from '@/data/types'

/* =============================================================
   BOX
   ============================================================= */
export async function getBox() {
  const { data, error } = await supabase.from('boxes').select('*').eq('slug', 'olympea-warrior').single()
  if (error) throw error
  return data
}

/* =============================================================
   USUARIOS
   ============================================================= */
export async function listarUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*').eq('ativo', true)
  if (error) throw error
  return data as Usuario[]
}
export async function criarUsuario(usuario: Partial<Usuario>) {
  const { data, error } = await supabase.from('usuarios').insert(usuario).select().single()
  if (error) throw error
  return data as Usuario
}
export async function atualizarUsuario(id: string, usuario: Partial<Usuario>) {
  const { data, error } = await supabase.from('usuarios').update(usuario).eq('id', id).select().single()
  if (error) throw error
  return data as Usuario
}
export async function excluirUsuario(id: string) {
  const { error } = await supabase.from('usuarios').update({ ativo: false }).eq('id', id)
  if (error) throw error
}
export async function getUsuarioByEmail(email: string) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).single()
  if (error) return null
  return data as Usuario
}

/* =============================================================
   ALUNOS
   ============================================================= */
export async function listarAlunos() {
  const { data, error } = await supabase.from('alunos').select('*, usuario:usuarios(*)').eq('ativo', true)
  if (error) throw error
  return data as Aluno[]
}
export async function criarAluno(aluno: Partial<Aluno>) {
  const { data, error } = await supabase.from('alunos').insert(aluno).select().single()
  if (error) throw error
  return data as Aluno
}
export async function atualizarAluno(id: string, aluno: Partial<Aluno>) {
  const { data, error } = await supabase.from('alunos').update(aluno).eq('id', id).select().single()
  if (error) throw error
  return data as Aluno
}
export async function excluirAluno(id: string) {
  const { error } = await supabase.from('alunos').update({ ativo: false }).eq('id', id)
  if (error) throw error
}
export async function getAlunoByUsuarioId(uid: string) {
  const { data, error } = await supabase.from('alunos').select('*').eq('usuario_id', uid).single()
  if (error) return null
  return data as Aluno
}
export async function getAlunoById(id: string) {
  const { data, error } = await supabase.from('alunos').select('*').eq('id', id).single()
  if (error) return null
  return data as Aluno
}

/* =============================================================
   COACHES
   ============================================================= */
export async function listarCoaches() {
  const { data, error } = await supabase.from('coaches').select('*, usuario:usuarios(*)').eq('ativo', true)
  if (error) throw error
  return data as Coach[]
}
export async function criarCoach(coach: Partial<Coach>) {
  const { data, error } = await supabase.from('coaches').insert(coach).select().single()
  if (error) throw error
  return data as Coach
}
export async function atualizarCoach(id: string, coach: Partial<Coach>) {
  const { data, error } = await supabase.from('coaches').update(coach).eq('id', id).select().single()
  if (error) throw error
  return data as Coach
}
export async function excluirCoach(id: string) {
  const { error } = await supabase.from('coaches').update({ ativo: false }).eq('id', id)
  if (error) throw error
}

/* =============================================================
   PROGRAMACOES
   ============================================================= */
export async function listarProgramacoes() {
  const { data, error } = await supabase.from('programacoes').select('*').eq('ativa', true)
  if (error) throw error
  return data as Programacao[]
}
export async function getProgramacoesByAluno(alunoId: string) {
  const { data, error } = await supabase
    .from('inscricoes')
    .select('programacao:programacoes(*)')
    .eq('aluno_id', alunoId)
    .eq('ativa', true)
  if (error) throw error
  return (data?.map((d: any) => d.programacao) || []) as Programacao[]
}
export async function criarProgramacao(prog: Partial<Programacao>) {
  const { data, error } = await supabase.from('programacoes').insert(prog).select().single()
  if (error) throw error
  return data as Programacao
}
export async function atualizarProgramacao(id: string, prog: Partial<Programacao>) {
  const { error } = await supabase.from('programacoes').update(prog).eq('id', id)
  if (error) throw error
}
export async function excluirProgramacao(id: string) {
  const { error } = await supabase.from('programacoes').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

/* =============================================================
   FASES
   ============================================================= */
export async function listarFasesByProg(programacaoId: string) {
  const { data, error } = await supabase.from('fases').select('*').eq('programacao_id', programacaoId).eq('ativa', true)
  if (error) throw error
  return data as Fase[]
}
export async function getFaseById(id: string) {
  const { data, error } = await supabase.from('fases').select('*').eq('id', id).single()
  if (error) return null
  return data as Fase
}
export async function criarFase(fase: Partial<Fase>) {
  const { data, error } = await supabase.from('fases').insert(fase).select().single()
  if (error) throw error
  return data as Fase
}
export async function atualizarFase(id: string, fase: Partial<Fase>) {
  const { data, error } = await supabase.from('fases').update(fase).eq('id', id).select().single()
  if (error) throw error
  return data as Fase
}
export async function excluirFase(id: string) {
  const { error } = await supabase.from('fases').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

/* =============================================================
   SEMANAS
   ============================================================= */
export async function listarSemanasByFase(faseId: string) {
  const { data, error } = await supabase.from('semanas').select('*').eq('fase_id', faseId).eq('ativa', true)
  if (error) throw error
  return data as Semana[]
}
export async function getSemanaById(id: string) {
  const { data, error } = await supabase.from('semanas').select('*').eq('id', id).single()
  if (error) return null
  return data as Semana
}
export async function criarSemana(semana: Partial<Semana>) {
  const { data, error } = await supabase.from('semanas').insert(semana).select().single()
  if (error) throw error
  return data as Semana
}
export async function atualizarSemana(id: string, semana: Partial<Semana>) {
  const { data, error } = await supabase.from('semanas').update(semana).eq('id', id).select().single()
  if (error) throw error
  return data as Semana
}
export async function excluirSemana(id: string) {
  const { error } = await supabase.from('semanas').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

/* =============================================================
   DIAS DE TREINO
   ============================================================= */
export async function listarDiasBySemana(semanaId: string) {
  const { data, error } = await supabase.from('dias_treino').select('*').eq('semana_id', semanaId)
  if (error) throw error
  return data as DiaTreino[]
}
export async function getDiaById(id: string) {
  const { data, error } = await supabase.from('dias_treino').select('*').eq('id', id).single()
  if (error) return null
  return data as DiaTreino
}
export async function criarDia(dia: Partial<DiaTreino>) {
  const { data, error } = await supabase.from('dias_treino').insert(dia).select().single()
  if (error) throw error
  return data as DiaTreino
}

/* =============================================================
   TREINOS
   ============================================================= */
export async function listarTreinosByDia(diaTreinoId: string) {
  const { data, error } = await supabase.from('treinos').select('*').eq('dia_treino_id', diaTreinoId).eq('ativo', true)
  if (error) throw error
  return data as Treino[]
}
export async function getTreinoById(id: string) {
  const { data, error } = await supabase.from('treinos').select('*, blocos:blocos_treino(*)').eq('id', id).single()
  if (error) return null
  return data as Treino
}
export async function getTreinoByDia(diaTreinoId: string) {
  const { data, error } = await supabase.from('treinos').select('*').eq('dia_treino_id', diaTreinoId).eq('ativo', true).single()
  if (error) return null
  return data as Treino
}
export async function criarTreino(treino: Partial<Treino>) {
  const { data, error } = await supabase.from('treinos').insert(treino).select().single()
  if (error) throw error
  return data as Treino
}
export async function atualizarTreino(id: string, treino: Partial<Treino>) {
  const { data, error } = await supabase.from('treinos').update(treino).eq('id', id).select().single()
  if (error) throw error
  return data as Treino
}
export async function excluirTreino(id: string) {
  const { error } = await supabase.from('treinos').update({ ativo: false }).eq('id', id)
  if (error) throw error
}

/* =============================================================
   BLOCOS DE TREINO
   ============================================================= */
export async function listarBlocosByTreino(treinoId: string) {
  const { data, error } = await supabase.from('blocos_treino').select('*').eq('treino_id', treinoId).eq('ativo', true).order('ordem')
  if (error) throw error
  return data as BlocoTreino[]
}
export async function adicionarBloco(bloco: Partial<BlocoTreino>) {
  const { data, error } = await supabase.from('blocos_treino').insert(bloco).select().single()
  if (error) throw error
  return data as BlocoTreino
}
export async function atualizarBloco(id: string, bloco: Partial<BlocoTreino>) {
  const { error } = await supabase.from('blocos_treino').update(bloco).eq('id', id)
  if (error) throw error
}
export async function removerBloco(id: string) {
  const { error } = await supabase.from('blocos_treino').update({ ativo: false }).eq('id', id)
  if (error) throw error
}

/* =============================================================
   EXERCICIOS
   ============================================================= */
export async function listarExercicios() {
  const { data, error } = await supabase.from('exercicios').select('*').eq('ativo', true)
  if (error) throw error
  return data as Exercicio[]
}
export async function criarExercicio(ex: Partial<Exercicio>) {
  const { data, error } = await supabase.from('exercicios').insert(ex).select().single()
  if (error) throw error
  return data as Exercicio
}

/* =============================================================
   RESULTADOS
   ============================================================= */
export async function listarResultadosByAluno(alunoId: string) {
  const { data, error } = await supabase.from('resultados').select('*').eq('aluno_id', alunoId).order('data', { ascending: false })
  if (error) throw error
  return data as Resultado[]
}
export async function listarResultadosByTreino(treinoId: string) {
  const { data, error } = await supabase.from('resultados').select('*').eq('treino_id', treinoId)
  if (error) throw error
  return data as Resultado[]
}
export async function criarResultado(resultado: Partial<Resultado>) {
  const { data, error } = await supabase.from('resultados').insert(resultado).select().single()
  if (error) throw error
  return data as Resultado
}

/* =============================================================
   COMENTARIOS
   ============================================================= */
export async function listarComentariosByResultado(resultadoId: string) {
  const { data, error } = await supabase.from('comentarios').select('*, autor:usuarios(nome)').eq('resultado_id', resultadoId)
  if (error) throw error
  return data as Comentario[]
}
export async function criarComentario(comentario: Partial<Comentario>) {
  const { data, error } = await supabase.from('comentarios').insert(comentario).select().single()
  if (error) throw error
  return data as Comentario
}

/* =============================================================
   PRs
   ============================================================= */
export async function getPRsByAluno(alunoId: string) {
  const { data, error } = await supabase.from('prs').select('*').eq('aluno_id', alunoId).order('data', { ascending: false })
  if (error) throw error
  return data as PersonalRecord[]
}
export async function criarPR(pr: Partial<PersonalRecord>) {
  const { data, error } = await supabase.from('prs').insert(pr).select().single()
  if (error) throw error
  return data as PersonalRecord
}
export async function atualizarPR(id: string, pr: Partial<PersonalRecord>) {
  const { error } = await supabase.from('prs').update(pr).eq('id', id)
  if (error) throw error
}
export async function excluirPR(id: string) {
  const { error } = await supabase.from('prs').delete().eq('id', id)
  if (error) throw error
}

/* =============================================================
   FREQUENCIAS
   ============================================================= */
export async function getFrequenciasByAluno(alunoId: string) {
  const { data, error } = await supabase.from('frequencias').select('*').eq('aluno_id', alunoId).order('data', { ascending: false })
  if (error) throw error
  return data as Frequencia[]
}
export async function criarFrequencia(freq: Partial<Frequencia>) {
  const { data, error } = await supabase.from('frequencias').insert(freq).select().single()
  if (error) throw error
  return data as Frequencia
}

/* =============================================================
   NOTIFICACOES
   ============================================================= */
export async function getNotificacoesByUsuario(usuarioId: string) {
  const { data, error } = await supabase.from('notificacoes').select('*').eq('usuario_id', usuarioId).order('data', { ascending: false })
  if (error) throw error
  return data as Notificacao[]
}
export async function criarNotificacao(notif: Partial<Notificacao>) {
  const { data, error } = await supabase.from('notificacoes').insert(notif).select().single()
  if (error) throw error
  return data as Notificacao
}

/* =============================================================
   RANKINGS
   ============================================================= */
export async function listarRankings(periodo: string, categoria: string) {
  const { data, error } = await supabase.from('rankings').select('*, aluno:alunos(*)').eq('periodo', periodo).eq('categoria', categoria).order('posicao')
  if (error) throw error
  return data as Ranking[]
}

/* =============================================================
   AUTH
   ============================================================= */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
export async function signUpWithEmail(email: string, password: string, metadata?: object) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
  if (error) throw error
  return data
}
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
