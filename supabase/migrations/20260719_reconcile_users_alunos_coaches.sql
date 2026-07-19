-- ============================================================
-- MIGRATION: Reconciliacao de usuarios - auth.users x public.usuarios x public.alunos x public.coaches
-- Idempotente e segura: nao apaga dados, nao duplica registros, gera relatorio.
-- ============================================================

-- Tabela temporaria para armazenar o relatorio de correcoes
CREATE TEMP TABLE IF NOT EXISTS tmp_reconcile_report (
  acao TEXT,
  tabela TEXT,
  usuario_email TEXT,
  detalhe TEXT
);

-- Limpa dados de execucoes anteriores na mesma sessao
TRUNCATE tmp_reconcile_report;

-- ============================================================
-- 1. Sincronizar auth.users -> public.usuarios
--    Usuarios que existem em auth.users mas nao existem em public.usuarios
--    Cria o public.usuarios com auth_id preenchido.
-- ============================================================
INSERT INTO public.usuarios (auth_id, box_id, nome, email, role, ativo, auth_provider)
SELECT
  au.id,
  b.id,
  COALESCE(au.raw_user_meta_data->>'nome', au.email),
  LOWER(au.email),
  COALESCE(au.raw_user_meta_data->>'role', 'aluno'),
  true,
  'email'
FROM auth.users au
CROSS JOIN (
  SELECT id FROM public.boxes WHERE slug = 'olympea-warrior' LIMIT 1
) b
WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.usuarios u WHERE LOWER(u.email) = LOWER(au.email)
  );

INSERT INTO tmp_reconcile_report (acao, tabela, usuario_email, detalhe)
SELECT 'CRIAR', 'usuarios', LOWER(au.email),
       'Criado public.usuarios a partir de auth.users'
FROM auth.users au
WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.usuarios u WHERE LOWER(u.email) = LOWER(au.email)
  );

-- ============================================================
-- 2. Preencher auth_id em public.usuarios quando estiver NULL
--    Busca auth.users pelo email e atualiza public.usuarios.auth_id.
-- ============================================================
WITH upd AS (
  UPDATE public.usuarios u
  SET auth_id = au.id
  FROM auth.users au
  WHERE u.auth_id IS NULL
    AND LOWER(u.email) = LOWER(au.email)
  RETURNING u.email
)
INSERT INTO tmp_reconcile_report (acao, tabela, usuario_email, detalhe)
SELECT 'ATUALIZAR', 'usuarios.auth_id', LOWER(email), 'auth_id preenchido a partir de auth.users'
FROM upd;

-- ============================================================
-- 3. Reativar public.usuarios ativo=false quando existe auth.users
--    (indica que o usuario foi desativado mas ainda deve ter acesso)
-- ============================================================
WITH upd AS (
  UPDATE public.usuarios u
  SET ativo = true
  FROM auth.users au
  WHERE u.ativo = false
    AND LOWER(u.email) = LOWER(au.email)
  RETURNING u.email
)
INSERT INTO tmp_reconcile_report (acao, tabela, usuario_email, detalhe)
SELECT 'REATIVAR', 'usuarios', LOWER(email), 'Usuario reativado porque existe em auth.users'
FROM upd;

-- ============================================================
-- 4. Criar public.alunos ausentes para usuarios com role = 'aluno'
-- ============================================================
INSERT INTO public.alunos (usuario_id, box_id, categoria, ativo)
SELECT
  u.id,
  u.box_id,
  'BEGINNER',
  true
FROM public.usuarios u
WHERE u.role = 'aluno'
  AND u.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.alunos a WHERE a.usuario_id = u.id
  );

INSERT INTO tmp_reconcile_report (acao, tabela, usuario_email, detalhe)
SELECT 'CRIAR', 'alunos', LOWER(u.email), 'Criado registro de aluno ausente'
FROM public.usuarios u
WHERE u.role = 'aluno'
  AND u.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.alunos a WHERE a.usuario_id = u.id
  );

-- ============================================================
-- 5. Reativar public.alunos ativo=false cujo usuario esteja ativo
-- ============================================================
WITH upd AS (
  UPDATE public.alunos a
  SET ativo = true
  FROM public.usuarios u
  WHERE a.usuario_id = u.id
    AND u.ativo = true
    AND a.ativo = false
  RETURNING u.email
)
INSERT INTO tmp_reconcile_report (acao, tabela, usuario_email, detalhe)
SELECT 'REATIVAR', 'alunos', LOWER(email), 'Aluno reativado porque usuario esta ativo'
FROM upd;

-- ============================================================
-- 6. Criar public.coaches ausentes para usuarios com role = 'coach'
-- ============================================================
INSERT INTO public.coaches (usuario_id, box_id, ativo)
SELECT
  u.id,
  u.box_id,
  true
FROM public.usuarios u
WHERE u.role = 'coach'
  AND u.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.usuario_id = u.id
  );

INSERT INTO tmp_reconcile_report (acao, tabela, usuario_email, detalhe)
SELECT 'CRIAR', 'coaches', LOWER(u.email), 'Criado registro de coach ausente'
FROM public.usuarios u
WHERE u.role = 'coach'
  AND u.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.coaches c WHERE c.usuario_id = u.id
  );

-- ============================================================
-- 7. Reativar public.coaches ativo=false cujo usuario esteja ativo
-- ============================================================
WITH upd AS (
  UPDATE public.coaches c
  SET ativo = true
  FROM public.usuarios u
  WHERE c.usuario_id = u.id
    AND u.ativo = true
    AND c.ativo = false
  RETURNING u.email
)
INSERT INTO tmp_reconcile_report (acao, tabela, usuario_email, detalhe)
SELECT 'REATIVAR', 'coaches', LOWER(email), 'Coach reativado porque usuario esta ativo'
FROM upd;

-- ============================================================
-- 8. RELATORIO FINAL
-- ============================================================
SELECT
  acao,
  tabela,
  usuario_email,
  detalhe
FROM tmp_reconcile_report
ORDER BY tabela, acao, usuario_email;

-- Resumo agregado
SELECT
  'RESUMO' AS tipo,
  COUNT(*) FILTER (WHERE acao = 'CRIAR') AS registros_criados,
  COUNT(*) FILTER (WHERE acao = 'REATIVAR') AS registros_reativados,
  COUNT(*) FILTER (WHERE acao = 'ATUALIZAR') AS registros_atualizados,
  COUNT(*) AS total_correcoes
FROM tmp_reconcile_report;
