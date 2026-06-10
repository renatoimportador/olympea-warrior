-- ============================================================
-- SCHEMA OLYMPEA WARRIOR - Supabase
-- ============================================================
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensao para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. BOX (Whitelabel)
-- ============================================================
CREATE TABLE IF NOT EXISTS boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#00E5FF',
  cor_secundaria TEXT DEFAULT '#00B8D4',
  cor_sucesso TEXT DEFAULT '#22C55E',
  cor_alerta TEXT DEFAULT '#F59E0B',
  cor_erro TEXT DEFAULT '#EF4444',
  dominio TEXT,
  ativo BOOLEAN DEFAULT true,
  configuracoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USUARIOS (perfis vinculados ao Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  box_id UUID REFERENCES boxes(id),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'aluno')),
  auth_provider TEXT DEFAULT 'email',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. COACHES
-- ============================================================
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  box_id UUID REFERENCES boxes(id),
  especialidade TEXT,
  certificacoes TEXT[],
  bio TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ALUNOS
-- ============================================================
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  box_id UUID REFERENCES boxes(id),
  categoria TEXT NOT NULL CHECK (categoria IN ('RX', 'SCALING', 'BEGINNER')),
  data_nascimento DATE,
  peso_atual NUMERIC(5,2),
  altura NUMERIC(5,2),
  objetivos TEXT,
  lesoes TEXT,
  restricoes TEXT,
  contato_emergencia TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. PROGRAMACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS programacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_id UUID REFERENCES boxes(id),
  created_by UUID REFERENCES usuarios(id),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CROSSFIT', 'LPO', 'GYMNASTICS', 'ENDURANCE', 'MASTER40', 'COMPETIDOR')),
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  semana_atual INTEGER DEFAULT 1,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. INSCRICOES (aluno em multiplas programacoes)
-- ============================================================
CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  programacao_id UUID REFERENCES programacoes(id) ON DELETE CASCADE,
  ativa BOOLEAN DEFAULT true,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  UNIQUE(aluno_id, programacao_id)
);

-- ============================================================
-- 7. FASES
-- ============================================================
CREATE TABLE IF NOT EXISTS fases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programacao_id UUID REFERENCES programacoes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES usuarios(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 1,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SEMANAS
-- ============================================================
CREATE TABLE IF NOT EXISTS semanas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fase_id UUID REFERENCES fases(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ORDINARIA', 'FORTE', 'DELOAD', 'PEAK', 'TESTE')),
  descricao TEXT,
  ordem INTEGER DEFAULT 1,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. DIAS DE TREINO
-- ============================================================
CREATE TABLE IF NOT EXISTS dias_treino (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semana_id UUID REFERENCES semanas(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL CHECK (dia_semana IN ('SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM')),
  data_especifica DATE,
  ativo BOOLEAN DEFAULT true
);

-- ============================================================
-- 10. TREINOS
-- ============================================================
CREATE TABLE IF NOT EXISTS treinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dia_treino_id UUID REFERENCES dias_treino(id) ON DELETE CASCADE,
  created_by UUID REFERENCES usuarios(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_wod TEXT CHECK (tipo_wod IN ('FOR_TIME', 'AMRAP', 'EMOM', 'TABATA', 'CHIPPER', 'STRENGTH')),
  time_cap TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. BLOCOS DE TREINO
-- ============================================================
CREATE TABLE IF NOT EXISTS blocos_treino (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treino_id UUID REFERENCES treinos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('MOBILIDADE', 'WARM_UP', 'SKILL', 'FORCA', 'WORKOUT', 'GAME_PLAN', 'OBSERVACOES_COACH', 'ACCESSORIES', 'CONDITIONING')),
  titulo TEXT,
  descricao TEXT,
  exercicios JSONB DEFAULT '[]',
  link_youtube TEXT,
  observacoes TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true
);

-- ============================================================
-- 12. EXERCICIOS (BIBLIOTECA)
-- ============================================================
CREATE TABLE IF NOT EXISTS exercicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_id UUID REFERENCES boxes(id),
  created_by UUID REFERENCES usuarios(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  categoria TEXT,
  video_url TEXT,
  imagem_url TEXT,
  padrao_movimento TEXT,
  erros_comuns TEXT,
  dicas TEXT,
  escalas JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. RESULTADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS resultados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  treino_id UUID REFERENCES treinos(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('RX', 'SCALING', 'BEGINNER')),
  data TIMESTAMPTZ DEFAULT NOW(),
  tempo TEXT,
  rounds INTEGER,
  repeticoes INTEGER,
  carga NUMERIC(8,2),
  rpe INTEGER CHECK (rpe >= 0 AND rpe <= 10),
  reflexao TEXT,
  meta_proxima TEXT,
  peso_corporal NUMERIC(5,2),
  foto_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. COMENTARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resultado_id UUID REFERENCES resultados(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES usuarios(id),
  mensagem TEXT NOT NULL,
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. PERSONAL RECORDS (PRs)
-- ============================================================
CREATE TABLE IF NOT EXISTS prs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  exercicio_id UUID REFERENCES exercicios(id),
  exercicio_nome TEXT,
  valor NUMERIC(10,2) NOT NULL,
  unidade TEXT DEFAULT 'kg',
  data TIMESTAMPTZ DEFAULT NOW(),
  video_url TEXT,
  observacao TEXT,
  is_pr BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. FREQUENCIAS / CHECK-INS
-- ============================================================
CREATE TABLE IF NOT EXISTS frequencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  treino_id UUID REFERENCES treinos(id),
  data TIMESTAMPTZ DEFAULT NOW(),
  presente BOOLEAN DEFAULT true,
  treino_concluido BOOLEAN DEFAULT false,
  checkin_at TIMESTAMPTZ,
  checkout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. NOTIFICACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('NOVO_TREINO', 'RESULTADO', 'PR', 'MENSAGEM_COACH', 'ATUALIZACAO')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  data TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. RANKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programacao_id UUID REFERENCES programacoes(id),
  treino_id UUID REFERENCES treinos(id),
  aluno_id UUID REFERENCES alunos(id),
  categoria TEXT NOT NULL CHECK (categoria IN ('RX', 'SCALING', 'BEGINNER')),
  posicao INTEGER NOT NULL,
  pontuacao NUMERIC(10,2),
  periodo TEXT NOT NULL CHECK (periodo IN ('SEMANAL', 'MENSAL', 'ANUAL')),
  data_referencia DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS auditorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('CREATE', 'UPDATE', 'DELETE')),
  usuario_id UUID REFERENCES usuarios(id),
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_alunos_usuario ON alunos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_coaches_usuario ON coaches(usuario_id);
CREATE INDEX IF NOT EXISTS idx_programacoes_box ON programacoes(box_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_aluno ON inscricoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_fases_programacao ON fases(programacao_id);
CREATE INDEX IF NOT EXISTS idx_semanas_fase ON semanas(fase_id);
CREATE INDEX IF NOT EXISTS idx_dias_semana ON dias_treino(semana_id);
CREATE INDEX IF NOT EXISTS idx_treinos_dia ON treinos(dia_treino_id);
CREATE INDEX IF NOT EXISTS idx_blocos_treino ON blocos_treino(treino_id);
CREATE INDEX IF NOT EXISTS idx_resultados_aluno ON resultados(aluno_id);
CREATE INDEX IF NOT EXISTS idx_resultados_treino ON resultados(treino_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_resultado ON comentarios(resultado_id);
CREATE INDEX IF NOT EXISTS idx_prs_aluno ON prs(aluno_id);
CREATE INDEX IF NOT EXISTS idx_frequencias_aluno ON frequencias(aluno_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rankings_periodo ON rankings(periodo, data_referencia);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Politicas basicas
-- ============================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE semanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocos_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE prs ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- Politica: usuarios veem apenas usuarios do mesmo box
CREATE POLICY usuarios_box_policy ON usuarios
  FOR SELECT USING (box_id = current_setting('app.current_box_id', true)::UUID OR role = 'admin');

-- Politica: alunos veem apenas seus proprios dados
CREATE POLICY alunos_own_policy ON alunos
  FOR SELECT USING (usuario_id = auth.uid());

-- Politica: coaches veem alunos do mesmo box
CREATE POLICY alunos_coach_policy ON alunos
  FOR SELECT USING (box_id = current_setting('app.current_box_id', true)::UUID);

-- Politica: resultados do proprio aluno
CREATE POLICY resultados_own_policy ON resultados
  FOR SELECT USING (aluno_id IN (SELECT id FROM alunos WHERE usuario_id = auth.uid()));

-- Politica: notificacoes do proprio usuario
CREATE POLICY notificacoes_own_policy ON notificacoes
  FOR ALL USING (usuario_id = auth.uid());

-- ============================================================
-- FUNCOES AUXILIARES
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programacoes_updated_at BEFORE UPDATE ON programacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fases_updated_at BEFORE UPDATE ON fases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_semanas_updated_at BEFORE UPDATE ON semanas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treinos_updated_at BEFORE UPDATE ON treinos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercicios_updated_at BEFORE UPDATE ON exercicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DADOS INICIAIS (SEED) - Usando UUIDs validos
-- ============================================================

-- Box
INSERT INTO boxes (nome, slug, cor_primaria, cor_secundaria, ativo)
VALUES ('OLYMPEA Warrior', 'olympea-warrior', '#00E5FF', '#00B8D4', true)
ON CONFLICT (slug) DO NOTHING;

-- Usuarios iniciais (senhas devem ser criadas via Supabase Auth)
INSERT INTO usuarios (box_id, nome, email, role, ativo)
VALUES
  ((SELECT id FROM boxes WHERE slug = 'olympea-warrior'), 'Renato Souza', 'admin@olympea.com', 'admin', true),
  ((SELECT id FROM boxes WHERE slug = 'olympea-warrior'), 'Coach Rafael', 'coach@olympea.com', 'coach', true),
  ((SELECT id FROM boxes WHERE slug = 'olympea-warrior'), 'Bruno Almeida', 'aluno@olympea.com', 'aluno', true),
  ((SELECT id FROM boxes WHERE slug = 'olympea-warrior'), 'Carla Mendes', 'carla@olympea.com', 'aluno', true),
  ((SELECT id FROM boxes WHERE slug = 'olympea-warrior'), 'Diego Costa', 'diego@olympea.com', 'aluno', true)
ON CONFLICT (email) DO NOTHING;

-- Coaches
INSERT INTO coaches (usuario_id, box_id, especialidade, ativo)
SELECT u.id, b.id, 'CrossFit / LPO', true
FROM usuarios u, boxes b
WHERE u.email = 'coach@olympea.com' AND b.slug = 'olympea-warrior'
ON CONFLICT DO NOTHING;

-- Alunos
INSERT INTO alunos (usuario_id, box_id, categoria, peso_atual, ativo)
SELECT u.id, b.id, 'RX', 82.5, true
FROM usuarios u, boxes b
WHERE u.email = 'aluno@olympea.com' AND b.slug = 'olympea-warrior'
ON CONFLICT DO NOTHING;

INSERT INTO alunos (usuario_id, box_id, categoria, peso_atual, ativo)
SELECT u.id, b.id, 'SCALING', 65.0, true
FROM usuarios u, boxes b
WHERE u.email = 'carla@olympea.com' AND b.slug = 'olympea-warrior'
ON CONFLICT DO NOTHING;

INSERT INTO alunos (usuario_id, box_id, categoria, peso_atual, ativo)
SELECT u.id, b.id, 'BEGINNER', 78.0, true
FROM usuarios u, boxes b
WHERE u.email = 'diego@olympea.com' AND b.slug = 'olympea-warrior'
ON CONFLICT DO NOTHING;

-- Programacao
INSERT INTO programacoes (box_id, created_by, nome, tipo, descricao, data_inicio, data_fim, ativa)
SELECT b.id, u.id, 'CrossFit OLYMPEA', 'CROSSFIT', 'Programacao principal de CrossFit', '2024-01-01', '2024-12-31', true
FROM boxes b, usuarios u
WHERE b.slug = 'olympea-warrior' AND u.email = 'admin@olympea.com'
ON CONFLICT DO NOTHING;

-- Inscricoes
INSERT INTO inscricoes (aluno_id, programacao_id, ativa)
SELECT a.id, p.id, true
FROM alunos a, programacoes p, usuarios u
WHERE u.email = 'aluno@olympea.com' AND a.usuario_id = u.id AND p.nome = 'CrossFit OLYMPEA'
ON CONFLICT DO NOTHING;

INSERT INTO inscricoes (aluno_id, programacao_id, ativa)
SELECT a.id, p.id, true
FROM alunos a, programacoes p, usuarios u
WHERE u.email = 'carla@olympea.com' AND a.usuario_id = u.id AND p.nome = 'CrossFit OLYMPEA'
ON CONFLICT DO NOTHING;

INSERT INTO inscricoes (aluno_id, programacao_id, ativa)
SELECT a.id, p.id, true
FROM alunos a, programacoes p, usuarios u
WHERE u.email = 'diego@olympea.com' AND a.usuario_id = u.id AND p.nome = 'CrossFit OLYMPEA'
ON CONFLICT DO NOTHING;

-- Fase
INSERT INTO fases (programacao_id, created_by, nome, ordem, ativa)
SELECT p.id, u.id, 'Revolucao', 1, true
FROM programacoes p, usuarios u
WHERE p.nome = 'CrossFit OLYMPEA' AND u.email = 'admin@olympea.com'
ON CONFLICT DO NOTHING;

-- Semana
INSERT INTO semanas (fase_id, nome, tipo, ordem, ativa)
SELECT f.id, 'Semana 1', 'ORDINARIA', 1, true
FROM fases f
WHERE f.nome = 'Revolucao'
ON CONFLICT DO NOTHING;

-- Dias de treino
INSERT INTO dias_treino (semana_id, dia_semana, ativo)
SELECT s.id, 'SEG', true
FROM semanas s
WHERE s.nome = 'Semana 1';

INSERT INTO dias_treino (semana_id, dia_semana, ativo)
SELECT s.id, 'TER', true
FROM semanas s
WHERE s.nome = 'Semana 1';

INSERT INTO dias_treino (semana_id, dia_semana, ativo)
SELECT s.id, 'QUA', true
FROM semanas s
WHERE s.nome = 'Semana 1';

INSERT INTO dias_treino (semana_id, dia_semana, ativo)
SELECT s.id, 'QUI', true
FROM semanas s
WHERE s.nome = 'Semana 1';

INSERT INTO dias_treino (semana_id, dia_semana, ativo)
SELECT s.id, 'SEX', true
FROM semanas s
WHERE s.nome = 'Semana 1';

INSERT INTO dias_treino (semana_id, dia_semana, ativo)
SELECT s.id, 'SAB', true
FROM semanas s
WHERE s.nome = 'Semana 1';

INSERT INTO dias_treino (semana_id, dia_semana, ativo)
SELECT s.id, 'DOM', true
FROM semanas s
WHERE s.nome = 'Semana 1';

-- Treino de exemplo
INSERT INTO treinos (dia_treino_id, created_by, titulo, descricao, tipo_wod, ativo)
SELECT dt.id, u.id, 'Monday WOD', 'Treino completo de segunda-feira', 'FOR_TIME', true
FROM dias_treino dt, usuarios u
WHERE dt.dia_semana = 'SEG' AND u.email = 'admin@olympea.com'
ON CONFLICT DO NOTHING;

-- Blocos do treino
INSERT INTO blocos_treino (treino_id, tipo, titulo, descricao, exercicios, ordem, ativo)
SELECT t.id, 'MOBILIDADE', 'Mobilidade Ombro', 'Preparacao articular', '[{"nome":"PVC Pass Through","series":"2","repeticoes":"10"}]'::jsonb, 0, true
FROM treinos t
WHERE t.titulo = 'Monday WOD';

INSERT INTO blocos_treino (treino_id, tipo, titulo, descricao, exercicios, ordem, ativo)
SELECT t.id, 'WARM_UP', 'Aquecimento', 'Aquecimento geral', '[{"nome":"Jumping Jacks","series":"3","repeticoes":"20"}]'::jsonb, 1, true
FROM treinos t
WHERE t.titulo = 'Monday WOD';

INSERT INTO blocos_treino (treino_id, tipo, titulo, descricao, exercicios, ordem, ativo)
SELECT t.id, 'WORKOUT', 'WOD Principal', '21-15-9 Thrusters + Pull-ups', '[]'::jsonb, 2, true
FROM treinos t
WHERE t.titulo = 'Monday WOD';

-- PRs iniciais
INSERT INTO prs (aluno_id, exercicio_nome, valor, unidade, data, is_pr)
SELECT a.id, 'Back Squat', 140, 'kg', NOW(), true
FROM alunos a, usuarios u
WHERE u.email = 'aluno@olympea.com' AND a.usuario_id = u.id;

INSERT INTO prs (aluno_id, exercicio_nome, valor, unidade, data, is_pr)
SELECT a.id, 'Snatch', 85, 'kg', NOW(), true
FROM alunos a, usuarios u
WHERE u.email = 'aluno@olympea.com' AND a.usuario_id = u.id;

-- Frequencias iniciais
INSERT INTO frequencias (aluno_id, data, presente, treino_concluido)
SELECT a.id, NOW() - INTERVAL '1 day', true, true
FROM alunos a, usuarios u
WHERE u.email = 'aluno@olympea.com' AND a.usuario_id = u.id;

INSERT INTO frequencias (aluno_id, data, presente, treino_concluido)
SELECT a.id, NOW() - INTERVAL '2 day', true, true
FROM alunos a, usuarios u
WHERE u.email = 'aluno@olympea.com' AND a.usuario_id = u.id;

-- Notificacoes iniciais
INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida, link)
SELECT u.id, 'NOVO_TREINO', 'Novo treino disponivel', 'O treino de segunda-feira foi liberado!', false, '/aluno/treino'
FROM usuarios u
WHERE u.email = 'aluno@olympea.com';

INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida, link)
SELECT u.id, 'MENSAGEM_COACH', 'Mensagem do Coach', 'Parabens pelo resultado! Continue assim.', false, '/aluno/comentarios'
FROM usuarios u
WHERE u.email = 'aluno@olympea.com';
