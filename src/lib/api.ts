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
  Notificacao,
  Auditoria,
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

export async function getBoxId(): Promise<string | null> {
  try {
    const box = await getBox()
    return box?.id || null
  } catch {
    return null
  }
}

export async function atualizarBox(id: string, dados: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('boxes')
    .update(dados)
    .eq('id', id)
    .select()
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
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error) {
    console.error('getUsuarioByEmail error:', error)
    return null
  }

  return data as Usuario | null
}

/* ========================= ALUNOS ========================= */
export async function listarAlunos() {
  const { data: alunos, error: erroAlunos } = await supabase
    .from('alunos')
    .select('*')
    .eq('ativo', true)

  if (erroAlunos) throw erroAlunos

  const { data: usuarios, error: erroUsuarios } = await supabase
    .from('usuarios')
    .select('*')
    .eq('ativo', true)

  if (erroUsuarios) throw erroUsuarios

  const mapaUsuarios = new Map(
    (usuarios || []).map((u: any) => [u.id, u])
  )

  const resultado = (alunos || []).map((aluno: any) => ({
    ...aluno,
    usuario: mapaUsuarios.get(aluno.usuario_id) || null,
  }))

  return resultado as Aluno[]
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
  // Buscar o aluno para obter o usuario_id
  const { data: aluno } = await supabase
    .from('alunos')
    .select('usuario_id')
    .eq('id', id)
    .single()

  // Inativar o aluno
  const { error } = await supabase
    .from('alunos')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error

  // Verificar se o usuario tem outros vinculos ativos
  if (aluno?.usuario_id) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', aluno.usuario_id)
      .single()

    const role = usuario?.role || ''
    if (role !== 'admin') {
      // Verificar se eh coach ativo
      const { data: coaches } = await supabase
        .from('coaches')
        .select('id')
        .eq('usuario_id', aluno.usuario_id)
        .eq('ativo', true)

      if (!coaches || coaches.length === 0) {
        // Sem outro vinculo, inativar usuario
        await supabase
          .from('usuarios')
          .update({ ativo: false })
          .eq('id', aluno.usuario_id)
      }
    }
  }
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
  // Buscar o coach para obter o usuario_id
  const { data: coach } = await supabase
    .from('coaches')
    .select('usuario_id')
    .eq('id', id)
    .single()

  // Inativar o coach
  const { error } = await supabase
    .from('coaches')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error

  // Verificar se o usuario tem outros vinculos ativos
  if (coach?.usuario_id) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', coach.usuario_id)
      .single()

    const role = usuario?.role || ''
    if (role !== 'admin') {
      // Verificar se eh aluno ativo
      const { data: alunos } = await supabase
        .from('alunos')
        .select('id')
        .eq('usuario_id', coach.usuario_id)
        .eq('ativo', true)

      if (!alunos || alunos.length === 0) {
        // Sem outro vinculo, inativar usuario
        await supabase
          .from('usuarios')
          .update({ ativo: false })
          .eq('id', coach.usuario_id)
      }
    }
  }
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

export const atualizarProgramacao = async (
  id: string,
  data: Partial<Programacao>
) => {
  const { error } = await supabase.from('programacoes').update(data).eq('id', id)
  if (error) throw error
}

export const excluirProgramacao = async (id: string) => {
  const { error } = await supabase.from('programacoes').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

/* ========================= FASES ========================= */
export const listarFasesByProg = async (programacaoId: string) =>
  (
    await supabase
      .from('fases')
      .select('*')
      .eq('programacao_id', programacaoId)
      .eq('ativa', true)
      .order('ordem', { ascending: true })
  ).data as Fase[]

export const getFaseById = async (id: string) =>
  (await supabase.from('fases').select('*').eq('id', id).single())
    .data as Fase

export async function criarFase(fase: Partial<Fase>) {
  const { data, error } = await supabase
    .from('fases')
    .insert([fase])
    .select()

  if (error) throw error
  return data?.[0] as Fase
}

export const atualizarFase = async (id: string, fase: Partial<Fase>) => {
  const { error } = await supabase.from('fases').update(fase).eq('id', id)
  if (error) throw error
}

export const excluirFase = async (id: string) => {
  const { error } = await supabase.from('fases').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

/* ========================= SEMANAS ========================= */
export const listarSemanasByFase = async (faseId: string) =>
  (
    await supabase
      .from('semanas')
      .select('*')
      .eq('fase_id', faseId)
      .eq('ativa', true)
      .order('ordem', { ascending: true })
  ).data as Semana[]

export const getSemanaById = async (id: string) =>
  (await supabase.from('semanas').select('*').eq('id', id).single())
    .data as Semana

export async function criarSemana(semana: Partial<Semana>) {
  const { data, error } = await supabase
    .from('semanas')
    .insert([semana])
    .select()

  if (error) throw error
  return data?.[0] as Semana
}

export const atualizarSemana = async (id: string, semana: Partial<Semana>) => {
  const { error } = await supabase.from('semanas').update(semana).eq('id', id)
  if (error) throw error
}

export const excluirSemana = async (id: string) => {
  const { error } = await supabase.from('semanas').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

/* ========================= DIAS ========================= */
export async function listarDiasBySemana(semanaId: string) {
  const { data, error } = await supabase
    .from('dias_treino')
    .select('*')
    .eq('semana_id', semanaId)
    .eq('ativo', true)

  const ordemDias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
  data?.sort(
    (a, b) =>
      ordemDias.indexOf(a.dia_semana) -
      ordemDias.indexOf(b.dia_semana)
  )

  if (error) throw error
  return data as DiaTreino[]
}

export const getDiaById = async (id: string) =>
  (await supabase.from('dias_treino').select('*').eq('id', id).single())
    .data as DiaTreino

export async function criarDia(dia: Partial<DiaTreino>) {
  const { data, error } = await supabase
    .from('dias_treino')
    .insert([
      {
        semana_id: dia.semana_id,
        dia_semana: dia.dia_semana,
        data_especifica: dia.data_especifica || null,
        ativo: true,
      },
    ])
    .select()
  if (error) throw error
  return data?.[0] as DiaTreino
}

/* ========================= TREINOS ========================= */
export const listarTreinosByDia = async (diaTreinoId: string) =>
  (
    await supabase
      .from('treinos')
      .select('*')
      .eq('dia_treino_id', diaTreinoId)
      .eq('ativo', true)
  ).data as Treino[]

export const getTreinoById = async (id: string) =>
  (await supabase.from('treinos').select('*').eq('id', id).single())
    .data as Treino

export const getTreinoByDia = async (diaTreinoId: string) => {
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .eq('dia_treino_id', diaTreinoId)
    .eq('ativo', true)

  if (error) throw error

  return data?.[0] as Treino
}
export async function getTreinoDoDia() {
  const programacoes = await listarProgramacoes()
  const programacao = programacoes.find(p => p.ativa) || programacoes[0]

  if (!programacao) return null

  const fases = await listarFasesByProg(programacao.id)
  const fase = fases.find(f => f.ativa) || fases[0]

  if (!fase) return null

  const semanas = await listarSemanasByFase(fase.id)
  const semana = semanas.find(s => s.ativa) || semanas[0]

  if (!semana) return null

  const dias = await listarDiasBySemana(semana.id)

  const hoje = new Date()
  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
  const diaHoje = diasSemana[hoje.getDay()]

  const dia = dias.find(d => d.dia_semana === diaHoje) || dias[0]

  if (!dia) return null

  const treino = await getTreinoByDia(dia.id)

  if (!treino) return null

  const blocos = await listarBlocosByTreino(treino.id)

  return {
    ...treino,
    blocos,
  }
}

export const criarTreino = async (treino: Partial<Treino>) => {
  const { data, error } = await supabase
    .from('treinos')
    .insert(treino)
    .select()
    .single()

  if (error) throw error
  return data as Treino
}

export const atualizarTreino = async (
  id: string,
  treino: Partial<Treino>
) => {
  const { data, error } = await supabase
    .from('treinos')
    .update(treino)
    .eq('id', id)
    .select()

  if (error) throw error

  return data
}

export const excluirTreino = async (id: string) => {
  const { error } = await supabase.from('treinos').update({ ativo: false }).eq('id', id)
  if (error) throw error
}

/* ========================= BLOCOS ========================= */
export const listarBlocosByTreino = async (treinoId: string) =>
  (
    await supabase
      .from('blocos_treino')
      .select('*')
      .eq('treino_id', treinoId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
  ).data as BlocoTreino[]

export const adicionarBloco = async (bloco: Partial<BlocoTreino>) => {
  const { data, error } = await supabase
    .from('blocos_treino')
    .insert(bloco)
    .select()
    .single()

  if (error) throw error
  return data
}

export const atualizarBloco = async (id: string, bloco: Partial<BlocoTreino>) => {
  const { error } = await supabase.from('blocos_treino').update(bloco).eq('id', id)
  if (error) throw error
}

export const removerBloco = async (id: string) => {
  const { error } = await supabase.from('blocos_treino').update({ ativo: false }).eq('id', id)
  if (error) throw error
}

/* ========================= EXERCICIOS ========================= */
export async function listarExercicios() {
  const { data, error } = await supabase
    .from('exercicios')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw error
  return data as Exercicio[]
}

export async function criarExercicio(exercicio: Partial<Exercicio>) {
  const { data, error } = await supabase
    .from('exercicios')
    .insert(exercicio)
    .select()
    .single()

  if (error) throw error
  return data as Exercicio
}

export async function atualizarExercicio(id: string, exercicio: Partial<Exercicio>) {
  const { data, error } = await supabase
    .from('exercicios')
    .update(exercicio)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Exercicio
}

export async function excluirExercicio(id: string) {
  const { error } = await supabase
    .from('exercicios')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
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
export async function listarResultadosByTreino(treinoId: string) {
  const { data, error } = await supabase
    .from('resultados')
    .select('*')
    .eq('treino_id', treinoId)

  if (error) throw error

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
export async function buscarResultadoDoDia(alunoId: string, treinoId: string) {
  const { data, error } = await supabase
    .from('resultados')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('treino_id', treinoId)
    .limit(1)

  if (error) {
    return null
  }

  return data?.[0] || null
}
export async function getResultadoById(id: string) {
  const { data, error } = await supabase
    .from('resultados')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

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

export async function getProgramacoesByAluno(alunoId: string) {
  const { data } = await supabase
    .from('inscricoes')
    .select('programacao:programacoes(*)')
    .eq('aluno_id', alunoId)

  return (data?.map((i: any) => i.programacao) || []) as Programacao[]
}
/* ========================= CAMPEONATOS ========================= */

export async function listarCampeonatos() {
  const { data, error } = await supabase
  .from('campeonatos')
  .select('*')
  .eq('ativo', true)
  .order('data_inicio', { ascending: true })

  if (error) throw error

  return data
}

export async function criarCampeonato(campeonato: any) {
  const { data, error } = await supabase
    .from('campeonatos')
    .insert(campeonato)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function atualizarCampeonato(id: string, campeonato: any) {
  const { data, error } = await supabase
    .from('campeonatos')
    .update(campeonato)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function excluirCampeonato(id: string) {
  const { error } = await supabase
    .from('campeonatos')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}
export async function listarParticipacoesByCampeonato(campeonatoId: string) {
  const { data, error } = await supabase
    .from('participacoes_campeonato')
    .select('*')
    .eq('campeonato_id', campeonatoId)

  if (error) throw error

  return data
}
export async function getAlunoCompleto(alunoId: string) {
  const { data, error } = await supabase
    .from('alunos')
    .select(`
      *,
      usuario:usuarios(*)
    `)
    .eq('id', alunoId)
    .maybeSingle()

  if (error) throw error

  return data
}
/* ========================= AUTH ========================= */
export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

/* ========================= NIVEIS ========================= */
export async function listarNiveis() {
  const { data, error } = await supabase
    .from('niveis')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('listarNiveis error:', error)
    throw error
  }
  return data || []
}

/* ========================= WODs ========================= */
export async function listarWods() {
  const { data, error } = await supabase
    .from('wods')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw error
  return data || []
}

export async function criarWod(wod: any) {
  const { data, error } = await supabase
    .from('wods')
    .insert(wod)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarWod(id: string, wod: any) {
  const { data, error } = await supabase
    .from('wods')
    .update(wod)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function excluirWod(id: string) {
  const { error } = await supabase
    .from('wods')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}

/* ========================= NOTIFICACOES ========================= */
export async function listarNotificacoesByUsuario(usuarioId: string) {
  const { data, error } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('data', { ascending: false })

  if (error) {
    console.error('listarNotificacoes error:', error)
    return []
  }
  return (data || []) as Notificacao[]
}

export async function criarNotificacaoSupabase(notificacao: Partial<Notificacao>) {
  const { data, error } = await supabase
    .from('notificacoes')
    .insert(notificacao)
    .select()
    .single()

  if (error) {
    console.error('criarNotificacao error:', error)
    return null
  }
  return data as Notificacao
}

export async function marcarNotificacaoLida(id: string) {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', id)

  if (error) throw error
}

/* ========================= FREQUENCIAS (CRUD) ========================= */
export async function criarFrequenciaSupabase(frequencia: Partial<Frequencia>) {
  const { data, error } = await supabase
    .from('frequencias')
    .insert(frequencia)
    .select()
    .single()

  if (error) throw error
  return data as Frequencia
}

export async function listarTodasFrequencias() {
  const { data, error } = await supabase
    .from('frequencias')
    .select('*')
    .order('data', { ascending: false })

  if (error) throw error
  return (data || []) as Frequencia[]
}

/* ========================= AUDITORIA ========================= */
export async function listarAuditorias() {
  const { data, error } = await supabase
    .from('auditorias')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data || []) as Auditoria[]
}

/* ========================= ALUNO UPDATE (perfil) ========================= */

export async function atualizarPerfilAluno(id: string, dados: Partial<Aluno>) {
  const { data, error } = await supabase
    .from('alunos')
    .update(dados)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Aluno
}

/* ========================= CRIAR ACESSO (via Vercel API segura) ========================= */

export async function criarAcessoUsuario(dados: {
  nome: string
  email: string
  role: 'aluno' | 'coach'
  box_id?: string
  dadosExtra?: Record<string, unknown>
}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sessão não encontrada. Faça login novamente.')

  const res = await fetch('/api/create-user-access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(dados)
  })

  const result = await res.json()
  if (!res.ok) throw new Error(result.error || 'Erro ao criar acesso')
  return result
}

export async function reenviarConvite(email: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sessão não encontrada')

  const res = await fetch('/api/resend-invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ email })
  })

  const result = await res.json()
  if (!res.ok) throw new Error(result.error || 'Erro ao reenviar convite')
  return result
}

/* ========================= HELPER: getTipoBlocoLabel ========================= */
export function getTipoBlocoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    MOBILIDADE: 'Mobilidade',
    WARM_UP: 'Aquecimento',
    SKILL: 'Skill',
    FORCA: 'Forca',
    WORKOUT: 'Workout',
    GAME_PLAN: 'Game Plan',
    OBSERVACOES_COACH: 'Obs. Coach',
    ACCESSORIES: 'Acessorios',
    CONDITIONING: 'Condicionamento',
  }
  return labels[tipo] || tipo
}
