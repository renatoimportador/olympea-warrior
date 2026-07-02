/* =============================================================
   OLYMPA Community - Type Definitions
   ============================================================= */

export type UUID = string;

export type UserRole = 'admin' | 'coach' | 'aluno';
export type CategoriaAluno = 'RX' | 'SCALING' | 'BEGINNER';
export type DiaSemana = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM';
export type TipoSemana = 'ORDINARIA' | 'FORTE' | 'DELOAD' | 'PEAK' | 'TESTE';
export type TipoProgramacao = 'CROSSFIT' | 'LPO' | 'GYMNASTICS' | 'ENDURANCE' | 'MASTER40' | 'COMPETIDOR';
export type TipoNotificacao = 'NOVO_TREINO' | 'RESULTADO' | 'PR' | 'MENSAGEM_COACH' | 'ATUALIZACAO';
export type PeriodoRanking = 'SEMANAL' | 'MENSAL' | 'ANUAL';
export type TipoPlano = 'BASICO' | 'PADRAO' | 'PREMIUM' | 'COMPETIDOR';
export type StatusAssinatura = 'ATIVA' | 'CANCELADA' | 'SUSPENSA' | 'EXPIRADA';
export type AcaoAuditoria = 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICAR' | 'CHECKIN' | 'CHECKOUT';

/* =============================================================
   NOVA ESTRUTURA DE TREINOS - BLOCOS
   ============================================================= */
export type TipoBloco = 'MOBILIDADE' | 'WARM_UP' | 'SKILL' | 'FORCA' | 'WORKOUT' | 'GAME_PLAN' | 'OBSERVACOES_COACH' | 'ACCESSORIES' | 'CONDITIONING';
export type TipoWOD = 'FOR_TIME' | 'AMRAP' | 'EMOM' | 'TABATA' | 'CHIPPER' | 'STRENGTH';

export interface ExercicioBloco {
  id: UUID;
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  percentual?: string;
  tempo_descanso?: string;
  link_youtube?: string;
  observacoes?: string;
  ordem: number;
}

export interface BlocoTreino {
  id: UUID;
  treino_id: UUID;
  tipo: TipoBloco;
  titulo: string;
  descricao?: string;
  exercicios: ExercicioBloco[];
  link_youtube?: string;
  observacoes?: string;
  ordem: number;
  ativo: boolean;
}

export interface WODConfig {
  tipo: TipoWOD;
  nome?: string;
  descricao: string;
  time_cap?: string;
}

/* =============================================================
   Box (Whitelabel)
   ============================================================= */
export interface Box {
  id: UUID;
  nome: string;
  slug: string;
  logo_url?: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_sucesso: string;
  cor_alerta: string;
  cor_erro: string;
  dominio_customizado?: string;
  ativo: boolean;
  configuracoes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/* =============================================================
   Usuarios
   ============================================================= */
export interface Usuario {
  id: UUID;
  box_id: UUID;
  nome: string;
  email: string;
  senha_hash?: string;
  role: UserRole;
  foto_url?: string;
  ativo: boolean;
  auth_provider: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
}

/* =============================================================
   Alunos
   ============================================================= */
export interface Aluno {
  id: UUID;
  usuario_id: UUID;
  usuario?: Usuario;
  nome?: string;
  box_id: UUID;
  categoria: CategoriaAluno;
  data_nascimento?: string;
  peso_atual?: number;
  altura?: number;
  objetivos?: string;
  lesoes?: string;
  restricoes?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_telefone?: string;
  data_inicio_treino?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface HistoricoPeso {
  id: UUID;
  aluno_id: UUID;
  peso: number;
  data: string;
  observacao?: string;
  created_at: string;
}

/* =============================================================
   Coaches
   ============================================================= */
export interface Coach {
  id: UUID;
  usuario_id: UUID;
  box_id: UUID;
  especialidades?: string[];
  bio?: string;
  ativo: boolean;
  created_at: string;
}

export interface RelacaoCoachAluno {
  id: UUID;
  coach_id: UUID;
  aluno_id: UUID;
  ativo: boolean;
  created_at: string;
}

/* =============================================================
   Programacoes & Periodizacao
   ============================================================= */
export interface Programacao {
  id: UUID;
  box_id: UUID;
  nome: string;
  tipo: TipoProgramacao;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  ativa: boolean;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface Inscricao {
  id: UUID;
  aluno_id: UUID;
  programacao_id: UUID;
  box_id: UUID;
  ativa: boolean;
  data_inicio: string;
  data_fim?: string;
  created_at: string;
}

export interface Fase {
  id: UUID;
  programacao_id: UUID;
  nome: string;
  ordem: number;
  duracao_semanas: number;
  descricao?: string;
  ativa: boolean;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface Semana {
  id: UUID;
  fase_id: UUID;
  nome: string;
  tipo: TipoSemana;
  ordem: number;
  descricao?: string;
  ativa: boolean;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface DiaTreino {
  id: UUID;
  semana_id: UUID;
  dia_semana: DiaSemana;
  data_especifica?: string;
  descricao?: string;
  ativo: boolean;
}

/* =============================================================
   Niveis Dinamicos
   ============================================================= */
export interface Nivel {
  id: UUID;
  box_id: UUID;
  nome: string;
  slug: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_by: UUID;
  created_at: string;
}

/* =============================================================
   Treinos REFORMULADOS
   ============================================================= */
export interface Treino {
  id: UUID;
  dia_treino_id: UUID;
  titulo: string;
  liberado: boolean;
  blocos: BlocoTreino[];
  wod?: WODConfig;
  ativo: boolean;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface TreinoNivel {
  id: UUID;
  treino_id: UUID;
  nivel_id: UUID;
  escala_descricao: string;
  ativo: boolean;
}

/* =============================================================
   Resultados REFORMULADOS
   ============================================================= */
export interface Resultado {
  id: UUID;
  aluno_id: UUID;
  treino_id: UUID;
  categoria: CategoriaAluno;
  data: string;
  tempo?: string;
  rounds?: number;
  repeticoes?: number;
  carga?: number;
  rpe: number;
  reflexao?: string;
  meta_proxima?: string;
  peso_corporal?: number;
  foto_url?: string;
  video_url?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

/* =============================================================
   Comentarios
   ============================================================= */
export interface Comentario {
  id: UUID;
  resultado_id: UUID;
  autor_id: UUID;
  autor?: Usuario;
  parent_id?: UUID;
  mensagem: string;
  lido: boolean;
  created_at: string;
}

/* =============================================================
   Biblioteca de Exercicios
   ============================================================= */
export interface Exercicio {
  id: UUID;
  box_id: UUID;
  nome: string;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  video_url?: string;
  video_demonstrativo_url?: string;
  padrao_movimento?: string;
  observacoes?: string;
  dicas_coach?: string;
  link_externo?: string;
  categoria: string;
  dificuldade?: string;
  equipamento?: string[];
  musculos?: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ErroMovimento {
  id: UUID;
  exercicio_id: UUID;
  titulo: string;
  descricao: string;
  imagem_url?: string;
  video_url?: string;
  gravidade: 'LEVE' | 'MEDIA' | 'GRAVE';
  created_at: string;
}

export interface EscalaMovimento {
  id: UUID;
  exercicio_id: UUID;
  nome: string;
  descricao: string;
  video_url?: string;
  ordem: number;
  created_at: string;
}

/* =============================================================
   Personal Records
   ============================================================= */
export interface PersonalRecord {
  id: UUID;
  aluno_id: UUID;
  exercicio_id: UUID;
  exercicio_nome?: string;
  exercicio?: Exercicio;
  valor: number;
  unidade: string;
  data: string;
  video_url?: string;
  observacao?: string;
  is_pr: boolean;
  created_at: string;
}

/* =============================================================
   Frequencias & Check-in
   ============================================================= */
export interface Frequencia {
  id: UUID;
  aluno_id: UUID;
  treino_id: UUID;
  data: string;
  presente: boolean;
  checkin_at?: string;
  checkout_at?: string;
  treino_concluido: boolean;
  created_at: string;
}

/* =============================================================
   Rankings
   ============================================================= */
export interface Ranking {
  id: UUID;
  categoria: CategoriaAluno;
  periodo: PeriodoRanking;
  aluno_id: UUID;
  programacao_id: UUID;
  pontuacao: number;
  posicao: number;
  treinos_completados: number;
  data_atualizacao: string;
}

/* =============================================================
   Notificacoes
   ============================================================= */
export interface Notificacao {
  id: UUID;
  usuario_id: UUID;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link?: string;
  data: string;
}

/* =============================================================
   Financeiro (Futuro)
   ============================================================= */
export interface Plano {
  id: UUID;
  box_id: UUID;
  nome: string;
  tipo: TipoPlano;
  descricao?: string;
  preco_mensal: number;
  preco_anual?: number;
  beneficios?: string[];
  limitacoes?: string[];
  ativo: boolean;
  created_at: string;
}

export interface Assinatura {
  id: UUID;
  aluno_id: UUID;
  plano_id: UUID;
  status: StatusAssinatura;
  data_inicio: string;
  data_fim?: string;
  proxima_cobranca?: string;
  metodo_pagamento?: string;
  created_at: string;
  updated_at: string;
}

export interface Mensalidade {
  id: UUID;
  assinatura_id: UUID;
  aluno_id: UUID;
  valor: number;
  mes_referencia: string;
  pago: boolean;
  data_pagamento?: string;
  comprovante_url?: string;
  observacao?: string;
  created_at: string;
}

/* =============================================================
   Auditoria
   ============================================================= */
export interface Auditoria {
  id: UUID;
  tabela: string;
  registro_id: UUID;
  acao: AcaoAuditoria;
  usuario_id: UUID;
  box_id: UUID;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/* =============================================================
   Configuracoes do Sistema
   ============================================================= */
export interface ConfiguracaoSistema {
  id: UUID;
  chave: string;
  valor: string;
  descricao?: string;
  categoria?: string;
  box_id?: UUID;
  updated_by?: UUID;
  updated_at: string;
}

/* =============================================================
   Auxiliares para UI
   ============================================================= */
export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  role: UserRole[];
}
