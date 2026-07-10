-- ====================================================================
-- FIX RLS v2 — OLYMPEA Warrior
-- DOCUMENTACAO DAS POLICIES NECESSARIAS
-- ====================================================================
--
-- STATUS ATUAL (conforme schema.sql):
-- O schema.sql JA POSSUI policies anônimas que permitem TUDO:
--   CREATE POLICY allow_select_anon ON usuarios FOR SELECT USING (true);
--   CREATE POLICY allow_all_anon ON usuarios FOR ALL USING (true) WITH CHECK (true);
--   (repetido para TODAS as 15 tabelas)
--
-- ISSO SIGNIFICA:
-- - Qualquer pessoa (mesmo nao autenticada) pode ler e modificar todos os dados.
-- - E uma FALHA DE SEGURANCA GRAVE para producao.
--
-- ESTE ARQUIVO DOCUMENTA as policies que DEVERAO ser aplicadas
-- quando o sistema estiver pronto para restricao de acesso.
-- NAO executar este arquivo enquanto o sistema estiver em desenvolvimento ativo.
--
-- ====================================================================

-- ---------------------------------------------------------------
-- PASSO 1: REMOVER policies anônimas existentes
-- ---------------------------------------------------------------

-- DROP POLICY IF EXISTS allow_select_anon ON usuarios;
-- DROP POLICY IF EXISTS allow_all_anon ON usuarios;
-- DROP POLICY IF EXISTS allow_select_anon_alunos ON alunos;
-- DROP POLICY IF EXISTS allow_all_anon_alunos ON alunos;
-- DROP POLICY IF EXISTS allow_select_anon_coaches ON coaches;
-- DROP POLICY IF EXISTS allow_all_anon_coaches ON coaches;
-- DROP POLICY IF EXISTS allow_select_anon_programacoes ON programacoes;
-- DROP POLICY IF EXISTS allow_all_anon_programacoes ON programacoes;
-- DROP POLICY IF EXISTS allow_select_anon_fases ON fases;
-- DROP POLICY IF EXISTS allow_all_anon_fases ON fases;
-- DROP POLICY IF EXISTS allow_select_anon_semanas ON semanas;
-- DROP POLICY IF EXISTS allow_all_anon_semanas ON semanas;
-- DROP POLICY IF EXISTS allow_select_anon_dias ON dias_treino;
-- DROP POLICY IF EXISTS allow_all_anon_dias ON dias_treino;
-- DROP POLICY IF EXISTS allow_select_anon_treinos ON treinos;
-- DROP POLICY IF EXISTS allow_all_anon_treinos ON treinos;
-- DROP POLICY IF EXISTS allow_select_anon_blocos ON blocos_treino;
-- DROP POLICY IF EXISTS allow_all_anon_blocos ON blocos_treino;
-- DROP POLICY IF EXISTS allow_select_anon_resultados ON resultados;
-- DROP POLICY IF EXISTS allow_all_anon_resultados ON resultados;
-- DROP POLICY IF EXISTS allow_select_anon_comentarios ON comentarios;
-- DROP POLICY IF EXISTS allow_all_anon_comentarios ON comentarios;
-- DROP POLICY IF EXISTS allow_select_anon_prs ON prs;
-- DROP POLICY IF EXISTS allow_all_anon_prs ON prs;
-- DROP POLICY IF EXISTS allow_select_anon_frequencias ON frequencias;
-- DROP POLICY IF EXISTS allow_all_anon_frequencias ON frequencias;
-- DROP POLICY IF EXISTS allow_select_anon_notificacoes ON notificacoes;
-- DROP POLICY IF EXISTS allow_all_anon_notificacoes ON notificacoes;
-- DROP POLICY IF EXISTS allow_select_anon_rankings ON rankings;
-- DROP POLICY IF EXISTS allow_all_anon_rankings ON rankings;

-- ---------------------------------------------------------------
-- PASSO 2: CRIAR policies seguras
-- ---------------------------------------------------------------

-- ============================================================
-- 2.1 USUARIOS
-- ============================================================
-- SELECT: usuarios do mesmo box podem se ver
-- CREATE POLICY usuarios_select_box ON usuarios
--   FOR SELECT USING (auth.uid() IS NOT NULL);

-- ALL: apenas admin pode criar/editar/excluir usuarios
-- CREATE POLICY usuarios_all_admin ON usuarios
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.2 ALUNOS
-- ============================================================
-- SELECT: aluno ve proprio perfil; coach/admin ve alunos do box
-- CREATE POLICY alunos_select_own_or_box ON alunos
--   FOR SELECT USING (
--     usuario_id = auth.uid()
--     OR
--     box_id IN (SELECT box_id FROM usuarios WHERE auth_id = auth.uid())
--   );

-- ALL: apenas admin/coach pode criar/editar/excluir
-- CREATE POLICY alunos_all_admin ON alunos
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--   ));

-- ============================================================
-- 2.3 COACHES
-- ============================================================
-- SELECT: todos autenticados podem ver coaches
-- CREATE POLICY coaches_select_auth ON coaches
--   FOR SELECT USING (auth.uid() IS NOT NULL);

-- ALL: apenas admin pode criar/editar/excluir coaches
-- CREATE POLICY coaches_all_admin ON coaches
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.4 PROGRAMACOES
-- ============================================================
-- SELECT: todos autenticados podem ver programacoes ativas
-- CREATE POLICY programacoes_select_auth ON programacoes
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativa = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY programacoes_all_admin ON programacoes
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.5 FASES
-- ============================================================
-- SELECT: todos autenticados podem ver fases ativas
-- CREATE POLICY fases_select_auth ON fases
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativa = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY fases_all_admin ON fases
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.6 SEMANAS
-- ============================================================
-- SELECT: todas as semanas ativas sao visiveis
-- CREATE POLICY semanas_select_auth ON semanas
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativa = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY semanas_all_admin ON semanas
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.7 DIAS_TREINO
-- ============================================================
-- SELECT: todos os dias ativos sao visiveis
-- CREATE POLICY dias_treino_select_auth ON dias_treino
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY dias_treino_all_admin ON dias_treino
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.8 TREINOS
-- ============================================================
-- SELECT: todos os treinos ativos sao visiveis
-- CREATE POLICY treinos_select_auth ON treinos
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY treinos_all_admin ON treinos
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.9 BLOCOS_TREINO
-- ============================================================
-- SELECT: todos os blocos ativos sao visiveis
-- CREATE POLICY blocos_treino_select_auth ON blocos_treino
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY blocos_treino_all_admin ON blocos_treino
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.10 RESULTADOS
-- ============================================================
-- SELECT: aluno ve proprios resultados; coach/admin ve todos
-- CREATE POLICY resultados_select_own_or_coach ON resultados
--   FOR SELECT USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ALL: aluno pode criar proprio resultado; coach/admin pode tudo
-- CREATE POLICY resultados_all_authenticated ON resultados
--   FOR ALL USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ============================================================
-- 2.11 COMENTARIOS
-- ============================================================
-- SELECT: autor ve proprios; coach/admin ve todos
-- CREATE POLICY comentarios_select_own_or_coach ON comentarios
--   FOR SELECT USING (
--     autor_id = auth.uid()
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ALL: autor pode criar/editar proprio; coach/admin pode tudo
-- CREATE POLICY comentarios_all_authenticated ON comentarios
--   FOR ALL USING (
--     autor_id = auth.uid()
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ============================================================
-- 2.12 PRs
-- ============================================================
-- SELECT: aluno ve proprios PRs; coach/admin ve todos
-- CREATE POLICY prs_select_own_or_coach ON prs
--   FOR SELECT USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ALL: aluno pode criar/editar proprio; coach/admin pode tudo
-- CREATE POLICY prs_all_authenticated ON prs
--   FOR ALL USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ============================================================
-- 2.13 FREQUENCIAS
-- ============================================================
-- SELECT: aluno ve proprias frequencias; coach/admin ve todas
-- CREATE POLICY frequencias_select_own_or_coach ON frequencias
--   FOR SELECT USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ALL: aluno pode criar propria; coach/admin pode tudo
-- CREATE POLICY frequencias_all_authenticated ON frequencias
--   FOR ALL USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach', 'coach')
--     )
--   );

-- ============================================================
-- 2.14 NOTIFICACOES
-- ============================================================
-- SELECT: usuario ve apenas proprias notificacoes
-- CREATE POLICY notificacoes_select_own ON notificacoes
--   FOR SELECT USING (usuario_id = auth.uid());

-- ALL: usuario pode criar/editar/excluir proprias
-- CREATE POLICY notificacoes_all_own ON notificacoes
--   FOR ALL USING (usuario_id = auth.uid());

-- ============================================================
-- 2.15 RANKINGS
-- ============================================================
-- SELECT: todos autenticados podem ver rankings
-- CREATE POLICY rankings_select_auth ON rankings
--   FOR SELECT USING (auth.uid() IS NOT NULL);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY rankings_all_admin ON rankings
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.16 EXERCICIOS
-- ============================================================
-- SELECT: todos autenticados podem ver exercicios ativos
-- CREATE POLICY exercicios_select_auth ON exercicios
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY exercicios_all_admin ON exercicios
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.17 INSCRICOES
-- ============================================================
-- SELECT: aluno ve proprias inscricoes; admin ve todas
-- CREATE POLICY inscricoes_select_own_or_admin ON inscricoes
--   FOR SELECT USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--     )
--   );

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY inscricoes_all_admin ON inscricoes
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.18 CAMPEONATOS
-- ============================================================
-- SELECT: todos autenticados podem ver campeonatos ativos
-- CREATE POLICY campeonatos_select_auth ON campeonatos
--   FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY campeonatos_all_admin ON campeonatos
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ============================================================
-- 2.19 PARTICIPACOES_CAMPEONATO
-- ============================================================
-- SELECT: aluno ve proprias participacoes; admin ve todas
-- CREATE POLICY participacoes_select_own_or_admin ON participacoes_campeonato
--   FOR SELECT USING (
--     aluno_id IN (
--       SELECT id FROM alunos WHERE usuario_id = auth.uid()
--     )
--     OR
--     auth.uid() IN (
--       SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--     )
--   );

-- ALL: apenas admin pode criar/editar/excluir
-- CREATE POLICY participacoes_all_admin ON participacoes_campeonato
--   FOR ALL USING (auth.uid() IN (
--     SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
--   ));

-- ====================================================================
-- RESUMO DAS POLICIES POR TABELA
-- ====================================================================
--
-- | Tabela              | SELECT                          | ALL (INSERT/UPDATE/DELETE)       |
-- |---------------------|----------------------------------|-----------------------------------|
-- | usuarios            | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | alunos              | proprio ou box                   | role IN ('admin', 'head_coach')  |
-- | coaches             | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | programacoes        | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | fases               | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | semanas             | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | dias_treino         | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | treinos             | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | blocos_treino       | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | resultados          | proprio ou coach/admin           | proprio ou coach/admin           |
-- | comentarios         | proprio ou coach/admin           | proprio ou coach/admin           |
-- | prs                 | proprio ou coach/admin           | proprio ou coach/admin           |
-- | frequencias         | proprio ou coach/admin           | proprio ou coach/admin           |
-- | notificacoes        | proprio                          | proprio                          |
-- | rankings            | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | exercicios          | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | inscricoes          | proprio ou admin                 | role IN ('admin', 'head_coach')  |
-- | campeonatos         | auth.uid() IS NOT NULL          | role IN ('admin', 'head_coach')  |
-- | participacoes_campeonato | proprio ou admin            | role IN ('admin', 'head_coach')  |
--
-- ====================================================================
