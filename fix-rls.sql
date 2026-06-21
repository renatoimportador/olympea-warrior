-- ============================================================
-- CORRECAO RLS - OLYMPEA WARRIOR
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Remover politicas antigas (se existirem)
DROP POLICY IF EXISTS usuarios_box_policy ON usuarios;
DROP POLICY IF EXISTS alunos_own_policy ON alunos;
DROP POLICY IF EXISTS alunos_coach_policy ON alunos;
DROP POLICY IF EXISTS resultados_own_policy ON resultados;
DROP POLICY IF EXISTS notificacoes_own_policy ON notificacoes;

-- Remover politicas anon antigas (se existirem)
DROP POLICY IF EXISTS allow_select_anon ON usuarios;
DROP POLICY IF EXISTS allow_select_anon_alunos ON alunos;
DROP POLICY IF EXISTS allow_select_anon_coaches ON coaches;
DROP POLICY IF EXISTS allow_select_anon_programacoes ON programacoes;
DROP POLICY IF EXISTS allow_select_anon_fases ON fases;
DROP POLICY IF EXISTS allow_select_anon_semanas ON semanas;
DROP POLICY IF EXISTS allow_select_anon_dias ON dias_treino;
DROP POLICY IF EXISTS allow_select_anon_treinos ON treinos;
DROP POLICY IF EXISTS allow_select_anon_blocos ON blocos_treino;
DROP POLICY IF EXISTS allow_select_anon_resultados ON resultados;
DROP POLICY IF EXISTS allow_select_anon_comentarios ON comentarios;
DROP POLICY IF EXISTS allow_select_anon_prs ON prs;
DROP POLICY IF EXISTS allow_select_anon_frequencias ON frequencias;
DROP POLICY IF EXISTS allow_select_anon_notificacoes ON notificacoes;
DROP POLICY IF EXISTS allow_select_anon_rankings ON rankings;

DROP POLICY IF EXISTS allow_all_anon ON usuarios;
DROP POLICY IF EXISTS allow_all_anon_alunos ON alunos;
DROP POLICY IF EXISTS allow_all_anon_coaches ON coaches;
DROP POLICY IF EXISTS allow_all_anon_programacoes ON programacoes;
DROP POLICY IF EXISTS allow_all_anon_fases ON fases;
DROP POLICY IF EXISTS allow_all_anon_semanas ON semanas;
DROP POLICY IF EXISTS allow_all_anon_dias ON dias_treino;
DROP POLICY IF EXISTS allow_all_anon_treinos ON treinos;
DROP POLICY IF EXISTS allow_all_anon_blocos ON blocos_treino;
DROP POLICY IF EXISTS allow_all_anon_resultados ON resultados;
DROP POLICY IF EXISTS allow_all_anon_comentarios ON comentarios;
DROP POLICY IF EXISTS allow_all_anon_prs ON prs;
DROP POLICY IF EXISTS allow_all_anon_frequencias ON frequencias;
DROP POLICY IF EXISTS allow_all_anon_notificacoes ON notificacoes;
DROP POLICY IF EXISTS allow_all_anon_rankings ON rankings;

-- ============================================================
-- NOVAS POLITICAS RLS - PERMISSIVAS PARA DESENVOLVIMENTO
-- ============================================================
-- ATENCAO: Estas politicas permitem acesso anonimo.
-- Em producao, substitua por politicas baseadas em auth.uid()
-- ============================================================

CREATE POLICY allow_all_usuarios ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_alunos ON alunos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_coaches ON coaches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_programacoes ON programacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_fases ON fases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_semanas ON semanas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_dias ON dias_treino FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_treinos ON treinos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_blocos ON blocos_treino FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_exercicios ON exercicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_resultados ON resultados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_comentarios ON comentarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_prs ON prs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_frequencias ON frequencias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_notificacoes ON notificacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_rankings ON rankings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_boxes ON boxes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_inscricoes ON inscricoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_auditorias ON auditorias FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- VERIFICACAO
-- ============================================================
-- Execute esta query para confirmar que as politicas foram criadas:
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
