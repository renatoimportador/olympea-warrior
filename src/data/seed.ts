import type {
  Box, Usuario, Aluno, Coach, Programacao, Inscricao,
  Fase, Semana, DiaTreino, Nivel, Treino,
  BlocoTreino, ExercicioBloco, WODConfig,
  Exercicio, PersonalRecord, Frequencia, Resultado,
  Comentario, Notificacao, Auditoria, Ranking,
} from './types'

let _c = 9000
const uid = (p = 'id'): string => `${p}-${++_c}`

export let boxPrincipal: Box = {
  id: 'box-1', nome: 'OLYMPEA Warrior', slug: 'olympea-warrior',
  cor_primaria: '#00E5FF', cor_secundaria: '#00B8D4',
  cor_sucesso: '#34D399', cor_alerta: '#FBBF24', cor_erro: '#F87171',
  ativo: true, configuracoes: {}, created_at: '', updated_at: '',
}

export let usuarios: Usuario[] = [
  { id: 'u-admin', box_id: 'box-1', nome: 'Renato Souza', email: 'admin@olympea.com', senha_hash: '', role: 'admin', foto_url: '', ativo: true, auth_provider: 'email', telefone: '', created_at: '', updated_at: '' },
  { id: 'u-coach1', box_id: 'box-1', nome: 'Coach Rafael', email: 'coach@olympea.com', senha_hash: '', role: 'coach', foto_url: '', ativo: true, auth_provider: 'email', telefone: '', created_at: '', updated_at: '' },
  { id: 'u-aluno1', box_id: 'box-1', nome: 'Bruno Almeida', email: 'aluno@olympea.com', senha_hash: '', role: 'aluno', foto_url: '', ativo: true, auth_provider: 'email', telefone: '', created_at: '', updated_at: '' },
  { id: 'u-aluno2', box_id: 'box-1', nome: 'Carla Mendes', email: 'carla@olympea.com', senha_hash: '', role: 'aluno', foto_url: '', ativo: true, auth_provider: 'email', telefone: '', created_at: '', updated_at: '' },
  { id: 'u-aluno3', box_id: 'box-1', nome: 'Diego Costa', email: 'diego@olympea.com', senha_hash: '', role: 'aluno', foto_url: '', ativo: true, auth_provider: 'email', telefone: '', created_at: '', updated_at: '' },
  { id: 'u-aluno4', box_id: 'box-1', nome: 'Ana Silva', email: 'ana@olympea.com', senha_hash: '', role: 'aluno', foto_url: '', ativo: true, auth_provider: 'email', telefone: '', created_at: '', updated_at: '' },
]

export let alunos: Aluno[] = [
  { id: 'a-1', usuario_id: 'u-aluno1', box_id: 'box-1', categoria: 'RX', data_nascimento: '1990-05-15', peso_atual: 78.5, altura: 175, objetivos: 'Competir', lesoes: '', restricoes: '', contato_emergencia_nome: 'Maria', contato_emergencia_telefone: '', data_inicio_treino: '2023-03-01', ativo: true, created_at: '', updated_at: '' },
  { id: 'a-2', usuario_id: 'u-aluno2', box_id: 'box-1', categoria: 'SCALING', data_nascimento: '1995-08-22', peso_atual: 62, altura: 162, objetivos: 'Condicionamento', lesoes: '', restricoes: '', contato_emergencia_nome: 'Joao', contato_emergencia_telefone: '', data_inicio_treino: '2023-08-15', ativo: true, created_at: '', updated_at: '' },
  { id: 'a-3', usuario_id: 'u-aluno3', box_id: 'box-1', categoria: 'BEGINNER', data_nascimento: '2000-01-10', peso_atual: 85, altura: 180, objetivos: 'Perder peso', lesoes: '', restricoes: '', contato_emergencia_nome: 'Ana', contato_emergencia_telefone: '', data_inicio_treino: '2024-01-10', ativo: true, created_at: '', updated_at: '' },
  { id: 'a-4', usuario_id: 'u-aluno4', box_id: 'box-1', categoria: 'RX', data_nascimento: '1988-03-20', peso_atual: 70, altura: 168, objetivos: 'Master', lesoes: '', restricoes: '', contato_emergencia_nome: 'Pedro', contato_emergencia_telefone: '', data_inicio_treino: '2023-05-01', ativo: true, created_at: '', updated_at: '' },
]

export let coaches: Coach[] = [
  { id: 'c-1', usuario_id: 'u-coach1', box_id: 'box-1', especialidades: ['CrossFit', 'LPO', 'Competicao'], bio: 'Coach desde 2015.', ativo: true, created_at: '' }
]

export let programacoes: Programacao[] = [
  { id: 'prog-1', box_id: 'box-1', nome: 'CrossFit OLYMPEA', tipo: 'CROSSFIT', descricao: 'Programacao principal', data_inicio: '2024-06-01', data_fim: '2024-12-31', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
  { id: 'prog-2', box_id: 'box-1', nome: 'LPO Strength', tipo: 'LPO', descricao: 'Levantamento de peso', data_inicio: '2024-06-01', data_fim: '2024-12-31', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
  { id: 'prog-3', box_id: 'box-1', nome: 'Gymnastics Skills', tipo: 'GYMNASTICS', descricao: 'Habilidades gimnasticas', data_inicio: '2024-06-01', data_fim: '2024-12-31', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
  { id: 'prog-4', box_id: 'box-1', nome: 'Master 40+', tipo: 'MASTER40', descricao: 'Atletas 40+', data_inicio: '2024-06-01', data_fim: '2024-12-31', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
]

export let inscricoes: Inscricao[] = [
  { id: 'i-1', aluno_id: 'a-1', programacao_id: 'prog-1', box_id: 'box-1', ativa: true, data_inicio: '', created_at: '' },
  { id: 'i-2', aluno_id: 'a-2', programacao_id: 'prog-1', box_id: 'box-1', ativa: true, data_inicio: '', created_at: '' },
  { id: 'i-3', aluno_id: 'a-3', programacao_id: 'prog-1', box_id: 'box-1', ativa: true, data_inicio: '', created_at: '' },
  { id: 'i-4', aluno_id: 'a-4', programacao_id: 'prog-1', box_id: 'box-1', ativa: true, data_inicio: '', created_at: '' },
  { id: 'i-5', aluno_id: 'a-1', programacao_id: 'prog-2', box_id: 'box-1', ativa: true, data_inicio: '', created_at: '' },
]

export let niveis: Nivel[] = [
  { id: 'n-1', box_id: 'box-1', nome: 'RX', slug: 'rx', cor: '#00E5FF', ordem: 1, ativo: true, created_by: 'u-admin', created_at: '' },
  { id: 'n-2', box_id: 'box-1', nome: 'Scaling', slug: 'scaling', cor: '#FBBF24', ordem: 2, ativo: true, created_by: 'u-admin', created_at: '' },
  { id: 'n-3', box_id: 'box-1', nome: 'Beginner', slug: 'beginner', cor: '#34D399', ordem: 3, ativo: true, created_by: 'u-admin', created_at: '' },
]

export let fases: Fase[] = [
  { id: 'f-1', programacao_id: 'prog-1', nome: 'Revolucao', ordem: 1, duracao_semanas: 4, descricao: '', ativa: true, created_by: 'u-admin', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'f-2', programacao_id: 'prog-1', nome: 'Ascensao', ordem: 2, duracao_semanas: 4, descricao: '', ativa: true, created_by: 'u-admin', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'f-3', programacao_id: 'prog-1', nome: 'Conquista', ordem: 3, duracao_semanas: 4, descricao: '', ativa: true, created_by: 'u-admin', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
]

export let semanas: Semana[] = [
  { id: 's-1', fase_id: 'f-1', nome: 'Semana 1', tipo: 'ORDINARIA', ordem: 1, descricao: '', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
  { id: 's-2', fase_id: 'f-1', nome: 'Semana 2', tipo: 'FORTE', ordem: 2, descricao: '', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
  { id: 's-3', fase_id: 'f-1', nome: 'Semana 3', tipo: 'DELOAD', ordem: 3, descricao: '', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
  { id: 's-4', fase_id: 'f-1', nome: 'Semana 4', tipo: 'PEAK', ordem: 4, descricao: '', ativa: true, created_by: 'u-admin', created_at: '', updated_at: '' },
]

export let diasTreino: DiaTreino[] = [
  { id: 'dt-1', semana_id: 's-1', dia_semana: 'SEG', data: '2024-06-03' },
  { id: 'dt-2', semana_id: 's-1', dia_semana: 'TER', data: '2024-06-04' },
  { id: 'dt-3', semana_id: 's-1', dia_semana: 'QUA', data: '2024-06-05' },
  { id: 'dt-4', semana_id: 's-1', dia_semana: 'QUI', data: '2024-06-06' },
  { id: 'dt-5', semana_id: 's-1', dia_semana: 'SEX', data: '2024-06-07' },
]

/* =============================================================
   TREINOS REFORMULADOS COM BLOCOS COMPLETOS
   ============================================================= */

function mockEB(id: string, nome: string, p?: Partial<ExercicioBloco>): ExercicioBloco {
  return { id, nome, ordem: 0, ...p }
}

function mockB(id: string, tipo: BlocoTreino['tipo'], titulo: string, descricao: string, exs: ExercicioBloco[], p?: Partial<BlocoTreino>): BlocoTreino {
  return { id, treino_id: 't-1', tipo, titulo, descricao, exercicios: exs, ordem: 0, ativo: true, ...p }
}

export let treinos: Treino[] = [
  {
    id: 't-1', dia_treino_id: 'dt-1', titulo: 'Monday WOD - Revolucao S1',
    liberado: true, ativo: true, created_by: 'u-admin', created_at: '', updated_at: '',
    blocos: [
      mockB('bl-1', 'MOBILIDADE', 'Mobilidade de Ombro e Quadril',
        'Mobilidade completa para preparar o corpo para o treino.', [
          mockEB('ex-1', 'PVC Pass Through'),
          mockEB('ex-2', 'Shoulder Stretch'),
          mockEB('ex-3', 'Couch Stretch'),
          mockEB('ex-4', 'Thoracic Rotation'),
        ], { link_youtube: 'https:\/\/youtube.com\/watch?v=mobilidade1' }),
      mockB('bl-2', 'WARM_UP', 'Aquecimento',
        '2 rounds: 200m run, 10 air squats, 10 push-ups, 10 pass-throughs', [
          mockEB('ex-5', '200m Run'),
          mockEB('ex-6', 'Air Squat', { repeticoes: '10' }),
          mockEB('ex-7', 'Push Up', { repeticoes: '10' }),
          mockEB('ex-8', 'Pass Through', { repeticoes: '10' }),
        ]),
      mockB('bl-3', 'SKILL', 'Skill - Toes to Bar',
        'Pratica de T2B com foco na tecnica de kip.', [
          mockEB('ex-9', 'T2B Kipping Drill', { repeticoes: '3x5' }),
          mockEB('ex-10', 'T2B Strict', { repeticoes: '3x3' }),
        ], { link_youtube: 'https:\/\/youtube.com\/watch?v=t2b1' }),
      mockB('bl-4', 'FORCA', 'Back Squat',
        'Trabalho de forca na barra.', [
          mockEB('ex-11', 'Back Squat', { series: '5', repeticoes: '5', percentual: '75%' }),
        ]),
    ],
    wod: { tipo: 'AMRAP', nome: 'Monday WOD', descricao: '20min AMRAP: 10 box jumps 24"\/20", 10 burpees, 10 KB swings 32\/24kg', time_cap: '20 min' },
  },
  {
    id: 't-2', dia_treino_id: 'dt-1', titulo: 'Game Plan e Observacoes',
    liberado: true, ativo: true, created_by: 'u-admin', created_at: '', updated_at: '',
    blocos: [
      mockB('bl-5', 'GAME_PLAN', 'Game Plan',
        'Controlar ritmo na primeira metade. Quebrar wall balls em series de 15. Manter transicoes curtas. Nao parar nos burpees.', []),
      mockB('bl-6', 'OBSERVACOES_COACH', 'Observacoes do Coach',
        'Priorizar tecnica. Nao exceder RPE 8. Se sentir dor no ombro, reduza a amplitude ou faca scaling.', []),
    ],
  },
]

export let exercicios: Exercicio[] = [
  { id: 'ex-1', box_id: 'box-1', nome: 'Snatch', slug: 'snatch', descricao: 'Levantamento de barra do chao ate acima da cabeca em um movimento continuo.', categoria: 'LPO', dificuldade: 'AVANCADO', ativo: true, created_at: '', updated_at: '' },
  { id: 'ex-2', box_id: 'box-1', nome: 'Clean & Jerk', slug: 'clean-jerk', descricao: 'Levantamento em duas partes: clean e jerk.', categoria: 'LPO', dificuldade: 'AVANCADO', ativo: true, created_at: '', updated_at: '' },
  { id: 'ex-3', box_id: 'box-1', nome: 'Back Squat', slug: 'back-squat', descricao: 'Agachamento com barra nas costas.', categoria: 'LPO', dificuldade: 'INTERMEDIARIO', ativo: true, created_at: '', updated_at: '' },
  { id: 'ex-4', box_id: 'box-1', nome: 'Deadlift', slug: 'deadlift', descricao: 'Levantamento terra.', categoria: 'LPO', dificuldade: 'INICIANTE', ativo: true, created_at: '', updated_at: '' },
  { id: 'ex-5', box_id: 'box-1', nome: 'Ring Muscle Up', slug: 'ring-muscle-up', descricao: 'Transicao sobre os aneis de gimnasia.', categoria: 'GYMNASTICS', dificuldade: 'AVANCADO', ativo: true, created_at: '', updated_at: '' },
]

export let personalRecords: PersonalRecord[] = [
  { id: 'pr-1', aluno_id: 'a-1', exercicio_id: 'ex-1', valor: 95, unidade: 'kg', data: '2024-05-15', is_pr: true, created_at: '' },
  { id: 'pr-2', aluno_id: 'a-1', exercicio_id: 'ex-2', valor: 125, unidade: 'kg', data: '2024-05-20', is_pr: true, created_at: '' },
  { id: 'pr-3', aluno_id: 'a-1', exercicio_id: 'ex-3', valor: 140, unidade: 'kg', data: '2024-05-25', is_pr: true, created_at: '' },
  { id: 'pr-4', aluno_id: 'a-1', exercicio_id: 'ex-4', valor: 180, unidade: 'kg', data: '2024-06-01', is_pr: true, created_at: '' },
]

export let frequencias: Frequencia[] = [
  { id: 'freq-1', aluno_id: 'a-1', treino_id: 't-1', data: '2024-06-03', presente: true, checkin_at: '2024-06-03T06:00:00Z', checkout_at: '2024-06-03T07:15:00Z', treino_concluido: true, created_at: '' },
  { id: 'freq-2', aluno_id: 'a-2', treino_id: 't-1', data: '2024-06-03', presente: true, checkin_at: '2024-06-03T07:00:00Z', checkout_at: '2024-06-03T08:00:00Z', treino_concluido: true, created_at: '' },
  { id: 'freq-3', aluno_id: 'a-3', treino_id: 't-1', data: '2024-06-03', presente: true, checkin_at: '2024-06-03T08:00:00Z', checkout_at: '2024-06-03T09:00:00Z', treino_concluido: true, created_at: '' },
]

export let resultados: Resultado[] = [
  { id: 'r-1', aluno_id: 'a-1', treino_id: 't-1', categoria: 'RX', data: '2024-06-03', tempo: '18:45', rpe: 8, reflexao: 'Tinha congestionado na ultima rodada.', meta_proxima: 'Manter ritmo consistente.', peso_corporal: 78.5, created_at: '', updated_at: '' },
  { id: 'r-2', aluno_id: 'a-2', treino_id: 't-1', categoria: 'SCALING', data: '2024-06-03', tempo: '22:10', rpe: 7, reflexao: 'Foquei na tecnica de box jumps.', meta_proxima: 'Tentar RX na proxima semana.', created_at: '', updated_at: '' },
]

export let comentarios: Comentario[] = [
  { id: 'com-1', resultado_id: 'r-1', autor_id: 'u-coach1', mensagem: 'Excelente tempo! Voce manteve um ritmo consistente.', lido: true, created_at: '' },
  { id: 'com-2', resultado_id: 'r-1', autor_id: 'u-aluno1', parent_id: 'com-1', mensagem: 'Obrigado, Coach! Tentei manter o RPE em 8 como voce pediu.', lido: false, created_at: '' },
]

export let notificacoes: Notificacao[] = [
  { id: 'not-1', usuario_id: 'u-aluno1', tipo: 'NOVO_TREINO', titulo: 'Novo treino disponivel', mensagem: 'O treino de segunda-feira foi liberado!', lida: false, link: '/aluno/treino', data: '' },
  { id: 'not-2', usuario_id: 'u-aluno1', tipo: 'MENSAGEM_COACH', titulo: 'Mensagem do Coach', mensagem: 'Parabens pelo resultado! Continue assim.', lida: false, link: '/aluno/comentarios', data: '' },
]

export function criarNotificacao(data: Partial<Notificacao>) {
  const n: Notificacao = { ...data, id: uid('not'), lida: false, data: new Date().toISOString() } as Notificacao
  notificacoes.push(n)
  return n
}

export let auditorias: Auditoria[] = [
  { id: 'aud-1', tabela: 'treinos', registro_id: 't-1', acao: 'CREATE', usuario_id: 'u-admin', box_id: 'box-1', dados_novos: { titulo: 'Monday WOD' }, created_at: '' },
]

export let rankings: Ranking[] = [
  { id: 'rank-1', categoria: 'RX', periodo: 'SEMANAL', aluno_id: 'a-1', programacao_id: 'prog-1', pontuacao: 950, posicao: 1, treinos_completados: 5, data_atualizacao: '' },
  { id: 'rank-2', categoria: 'SCALING', periodo: 'SEMANAL', aluno_id: 'a-2', programacao_id: 'prog-1', pontuacao: 920, posicao: 1, treinos_completados: 5, data_atualizacao: '' },
]

/* =============================================================
   CRUDS FUNCIONAIS (API Mock em memoria)
   ============================================================= */

/* FASES */
export function listarFasesByProg(programacaoId: string) { return fases.filter(f => f.ativa && f.programacao_id === programacaoId) }
export function criarFase(data: Partial<Fase>) { const n: Fase = { ...data, id: uid('f'), ativa: true, created_by: data.created_by || 'u-admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Fase; fases.push(n); return n }
export function atualizarFase(id: string, data: Partial<Fase>) { const i = fases.findIndex(f => f.id === id); if (i >= 0) { fases[i] = { ...fases[i], ...data, updated_at: new Date().toISOString() }; return fases[i] } return undefined }
export function excluirFase(id: string) { const i = fases.findIndex(f => f.id === id); if (i >= 0) { fases[i].ativa = false; return true } return false }

/* SEMANAS */
export function listarSemanasByFase(faseId: string) { return semanas.filter(s => s.ativa && s.fase_id === faseId) }
export function criarSemana(data: Partial<Semana>) { const n: Semana = { ...data, id: uid('s'), ativa: true, created_by: data.created_by || 'u-admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Semana; semanas.push(n); return n }
export function atualizarSemana(id: string, data: Partial<Semana>) { const i = semanas.findIndex(s => s.id === id); if (i >= 0) { semanas[i] = { ...semanas[i], ...data, updated_at: new Date().toISOString() }; return semanas[i] } return undefined }
export function excluirSemana(id: string) { const i = semanas.findIndex(s => s.id === id); if (i >= 0) { semanas[i].ativa = false; return true } return false }

/* DIAS */
export function listarDiasBySemana(semanaId: string) { return diasTreino.filter(d => d.semana_id === semanaId) }
export function criarDia(data: Partial<DiaTreino>) { const n: DiaTreino = { ...data, id: uid('dt') } as DiaTreino; diasTreino.push(n); return n }

/* TREINOS */
export function listarTreinosByDia(diaTreinoId: string) { return treinos.filter(t => t.ativo && t.dia_treino_id === diaTreinoId) }
export function getTreinoById(id: string) { return treinos.find(t => t.id === id) }
export function criarTreino(data: Partial<Treino>) {
  const n: Treino = { ...data, id: uid('t'), ativo: true, created_by: 'u-admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Treino
  treinos.push(n)
  // Notificar todos os alunos ativos
  const dia = diasTreino.find(d => d.id === n.dia_treino_id)
  alunos.filter(a => a.ativo).forEach(a => {
    const u = usuarios.find(u2 => u2.id === a.usuario_id)
    if (u) {
      criarNotificacao({
        usuario_id: u.id,
        tipo: 'NOVO_TREINO',
        titulo: 'Novo treino disponivel',
        mensagem: `${n.titulo} foi liberado para ${dia?.dia_semana || 'hoje'}!`,
        link: '/aluno/treino',
      })
    }
  })
  return n
}
export function atualizarTreino(id: string, data: Partial<Treino>) { const i = treinos.findIndex(t => t.id === id); if (i >= 0) { treinos[i] = { ...treinos[i], ...data, updated_at: new Date().toISOString() }; return treinos[i] } return undefined }
export function excluirTreino(id: string) { const i = treinos.findIndex(t => t.id === id); if (i >= 0) { treinos[i].ativo = false; return true } return false }

/* BLOCOS */
export function listarBlocosByTreino(treinoId: string) { return treinos.find(t => t.id === treinoId)?.blocos?.filter(b => b.ativo) || [] }
export function adicionarBloco(treinoId: string, bloco: Partial<BlocoTreino>) {
  const t = treinos.find(t => t.id === treinoId); if (!t) return undefined
  const n: BlocoTreino = { ...bloco, id: uid('bl'), treino_id: treinoId, ordem: t.blocos.length, ativo: true } as BlocoTreino
  t.blocos = [...(t.blocos || []), n]; return n
}
export function atualizarBloco(treinoId: string, blocoId: string, data: Partial<BlocoTreino>) {
  const t = treinos.find(t => t.id === treinoId); if (!t) return undefined
  const i = t.blocos.findIndex(b => b.id === blocoId); if (i === -1) return undefined
  t.blocos[i] = { ...t.blocos[i], ...data }; return t.blocos[i]
}
export function removerBloco(treinoId: string, blocoId: string) {
  const t = treinos.find(t => t.id === treinoId); if (!t) return false
  const i = t.blocos.findIndex(b => b.id === blocoId); if (i === -1) return false
  t.blocos[i].ativo = false; return true
}
export function reordenarBlocos(treinoId: string, novaOrdem: string[]) {
  const t = treinos.find(t => t.id === treinoId); if (!t) return
  const map = new Map(t.blocos.map(b => [b.id, b]))
  t.blocos = novaOrdem.map(id => map.get(id)).filter(Boolean) as BlocoTreino[]
  t.blocos.forEach((b, i) => b.ordem = i)
}

/* USUARIOS */
export function criarUsuario(data: Partial<Usuario>) { const n: Usuario = { ...data, id: uid('u'), ativo: true, box_id: data.box_id || 'box-1', auth_provider: 'email', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Usuario; usuarios.push(n); return n }
export function atualizarUsuario(id: string, data: Partial<Usuario>) { const i = usuarios.findIndex(u => u.id === id); if (i >= 0) { usuarios[i] = { ...usuarios[i], ...data, updated_at: new Date().toISOString() }; return usuarios[i] } return undefined }
export function excluirUsuario(id: string) { const i = usuarios.findIndex(u => u.id === id); if (i >= 0) { usuarios[i].ativo = false; return true } return false }

/* NIVEIS */
export function criarNivel(data: Partial<Nivel>) { const n: Nivel = { ...data, id: uid('n'), ativo: true, created_by: data.created_by || 'u-admin', created_at: new Date().toISOString() } as Nivel; niveis.push(n); return n }
export function atualizarNivel(id: string, data: Partial<Nivel>) { const i = niveis.findIndex(n => n.id === id); if (i >= 0) { niveis[i] = { ...niveis[i], ...data }; return niveis[i] } return undefined }
export function excluirNivel(id: string) { const i = niveis.findIndex(n => n.id === id); if (i >= 0) { niveis[i].ativo = false; return true } return false }

/* PROGRAMACOES */
export function criarProgramacao(data: Partial<Programacao>) { const n: Programacao = { ...data, id: uid('prog'), ativa: true, created_by: data.created_by || 'u-admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Programacao; programacoes.push(n); return n }
export function atualizarProgramacao(id: string, data: Partial<Programacao>) { const i = programacoes.findIndex(p => p.id === id); if (i >= 0) { programacoes[i] = { ...programacoes[i], ...data, updated_at: new Date().toISOString() } } }
export function excluirProgramacao(id: string) { const i = programacoes.findIndex(p => p.id === id); if (i >= 0) { programacoes[i].ativa = false; return true } return false }

/* ALUNOS */
export function criarAluno(data: Partial<Aluno>) { const n: Aluno = { ...data, id: uid('a'), ativo: true, box_id: data.box_id || 'box-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Aluno; alunos.push(n); return n }
export function atualizarAluno(id: string, data: Partial<Aluno>) { const i = alunos.findIndex(a => a.id === id); if (i >= 0) { alunos[i] = { ...alunos[i], ...data, updated_at: new Date().toISOString() }; return alunos[i] } return undefined }
export function excluirAluno(id: string) { const i = alunos.findIndex(a => a.id === id); if (i >= 0) { alunos[i].ativo = false; return true } return false }

/* COACHES */
export function criarCoach(data: Partial<Coach>) { const n: Coach = { ...data, id: uid('c'), ativo: true, box_id: data.box_id || 'box-1', created_at: new Date().toISOString() } as Coach; coaches.push(n); return n }
export function atualizarCoach(id: string, data: Partial<Coach>) { const i = coaches.findIndex(c => c.id === id); if (i >= 0) { coaches[i] = { ...coaches[i], ...data }; return coaches[i] } return undefined }
export function excluirCoach(id: string) { const i = coaches.findIndex(c => c.id === id); if (i >= 0) { coaches[i].ativo = false; return true } return false }

/* EXERCICIOS */
export function criarExercicio(data: Partial<Exercicio>) { const n: Exercicio = { ...data, id: uid('ex'), ativo: true, box_id: data.box_id || 'box-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Exercicio; exercicios.push(n); return n }
export function atualizarExercicio(id: string, data: Partial<Exercicio>) { const i = exercicios.findIndex(e => e.id === id); if (i >= 0) { exercicios[i] = { ...exercicios[i], ...data, updated_at: new Date().toISOString() } } }
export function excluirExercicio(id: string) { const i = exercicios.findIndex(e => e.id === id); if (i >= 0) { exercicios[i].ativo = false; return true } return false }

/* RESULTADOS */
export function criarResultado(data: Partial<Resultado>) { const n: Resultado = { ...data, id: uid('r'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Resultado; resultados.push(n); return n }
export function listarResultadosByAluno(alunoId: string) { return resultados.filter(r => r.aluno_id === alunoId) }
export function listarResultadosByTreino(treinoId: string) { return resultados.filter(r => r.treino_id === treinoId) }

/* HELPER LOOKUPS */
export function getUsuarioById(id: string) { return usuarios.find(u => u.id === id) }
export function getAlunoById(id: string) { return alunos.find(a => a.id === id) }
export function getAlunoByUsuarioId(uid: string) { return alunos.find(a => a.usuario_id === uid) }
export function getUsuarioByEmail(email: string) { return usuarios.find(u => u.email === email) }
export function getProgramacoesByAluno(alunoId: string) { const pids = inscricoes.filter(i => i.aluno_id === alunoId && i.ativa).map(i => i.programacao_id); return programacoes.filter(p => pids.includes(p.id)) }
export function getTreinoByDia(diaId: string) { return treinos.find(t => t.dia_treino_id === diaId && t.ativo) }
export function getPRsByAluno(alunoId: string) { return personalRecords.filter(pr => pr.aluno_id === alunoId) }
export function criarPR(data: Partial<PersonalRecord>) { const n: PersonalRecord = { ...data, id: uid('pr'), created_at: new Date().toISOString() } as PersonalRecord; personalRecords.push(n); return n }
export function atualizarPR(id: string, data: Partial<PersonalRecord>) { const i = personalRecords.findIndex(p => p.id === id); if (i >= 0) { personalRecords[i] = { ...personalRecords[i], ...data }; return personalRecords[i] } return undefined }
export function excluirPR(id: string) { const i = personalRecords.findIndex(p => p.id === id); if (i >= 0) { personalRecords.splice(i, 1); return true } return false }
export function getFrequenciasByAluno(alunoId: string) { return frequencias.filter(f => f.aluno_id === alunoId) }
export function criarFrequencia(data: Partial<Frequencia>) { const n: Frequencia = { ...data, id: uid('freq'), created_at: new Date().toISOString() } as Frequencia; frequencias.push(n); return n }
export function getNotificacoesByUsuario(uid: string) { return notificacoes.filter(n => n.usuario_id === uid).sort((a, b) => b.data.localeCompare(a.data)) }
export function getDiaById(id: string) { return diasTreino.find(d => d.id === id) }
export function getSemanaById(id: string) { return semanas.find(s => s.id === id) }
export function getFaseById(id: string) { return fases.find(f => f.id === id) }
export function getProgramacaoById(id: string) { return programacoes.find(p => p.id === id) }
export function getNivelById(id: string) { return niveis.find(n => n.id === id) }

/* CATEGORIA LABELS */
export function getCategoriaLabel(cat: string) {
  const map: Record<string, string> = { RX: 'RX', SCALING: 'Scaling', BEGINNER: 'Beginner' }
  return map[cat] || cat
}
export function getTipoBlocoLabel(tipo: string) {
  const map: Record<string, string> = {
    MOBILIDADE: 'Mobilidade', WARM_UP: 'Aquecimento', SKILL: 'Skill / Tecnica',
    FORCA: 'Forca', WORKOUT: 'Workout (WOD)', GAME_PLAN: 'Game Plan', OBSERVACOES_COACH: 'Obs. Coach',
    ACCESSORIES: 'Accessories', CONDITIONING: 'Conditioning',
  }
  return map[tipo] || tipo
}
export function getTipoBlocoIcon(tipo: string) {
  const map: Record<string, string> = {
    MOBILIDADE: 'Move', WARM_UP: 'Flame', SKILL: 'Star', FORCA: 'Zap',
    WORKOUT: 'Dumbbell', GAME_PLAN: 'Target', OBSERVACOES_COACH: 'MessageCircle',
    ACCESSORIES: 'Plus', CONDITIONING: 'Heart',
  }
  return map[tipo] || 'Circle'
}
