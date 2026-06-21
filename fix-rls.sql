-- ====================================================================
-- FIX RLS — OLYMPEA Warrior
-- Executar no SQL Editor do Supabase para resolver 401/vazio
-- ====================================================================

-- ---------------------------------------------------------------
-- TABELAS QUE PRECISAM DE POLICY SELECT (hoje retornam vazio)
-- ---------------------------------------------------------------

-- Programacoes: qualquer usuario autenticado do mesmo box pode ver
CREATE POLICY IF NOT EXISTS programacoes_select_box
  ON programacoes FOR SELECT
  USING (box_id = current_setting('app.current_box_id', true)::UUID);

-- Fases: mesma regra por box
CREATE POLICY IF NOT EXISTS fases_select_box
  ON fases FOR SELECT
  USING (box_id = current_setting('app.current_box_id', true)::UUID);

-- Semanas: sobe pela fase → programacao → box
CREATE POLICY IF NOT EXISTS semanas_select_box
  ON semanas FOR SELECT
  USING (
    fase_id IN (
      SELECT id FROM fases WHERE box_id = current_setting('app.current_box_id', true)::UUID
    )
  );

-- Dias de treino: semana → programacao → box
CREATE POLICY IF NOT EXISTS dias_treino_select_box
  ON dias_treino FOR SELECT
  USING (
    semana_id IN (
      SELECT s.id FROM semanas s
      WHERE s.box_id = current_setting('app.current_box_id', true)::UUID
    )
  );

-- Treinos: dia → semana → programacao → box
CREATE POLICY IF NOT EXISTS treinos_select_box
  ON treinos FOR SELECT
  USING (
    dia_treino_id IN (
      SELECT dt.id FROM dias_treino dt
      WHERE dt.semana_id IN (
        SELECT s.id FROM semanas s
        WHERE s.box_id = current_setting('app.current_box_id', true)::UUID
      )
    )
  );

-- Blocos de treino: treino → dia → semana → programacao → box
CREATE POLICY IF NOT EXISTS blocos_treino_select_box
  ON blocos_treino FOR SELECT
  USING (
    treino_id IN (
      SELECT t.id FROM treinos t
      JOIN dias_treino dt ON dt.id = t.dia_treino_id
      WHERE dt.semana_id IN (
        SELECT s.id FROM semanas s
        WHERE s.box_id = current_setting('app.current_box_id', true)::UUID
      )
    )
  );

-- Inscricoes: usuario ve apenas as suas (ou todas do box para coach)
CREATE POLICY IF NOT EXISTS inscricoes_select_own_or_box
  ON inscricoes FOR SELECT
  USING (
    aluno_id IN (
      SELECT id FROM alunos WHERE usuario_id = auth.uid()
    )
    OR
    programacao_id IN (
      SELECT id FROM programacoes WHERE box_id = current_setting('app.current_box_id', true)::UUID
    )
  );

-- ---------------------------------------------------------------
-- POLICIES INSERT / UPDATE / DELETE (para admin/head_coach)
-- ---------------------------------------------------------------

CREATE POLICY IF NOT EXISTS programacoes_all_admin
  ON programacoes FOR ALL
  USING (auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
  ));

CREATE POLICY IF NOT EXISTS fases_all_admin
  ON fases FOR ALL
  USING (auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
  ));

CREATE POLICY IF NOT EXISTS semanas_all_admin
  ON semanas FOR ALL
  USING (auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
  ));

CREATE POLICY IF NOT EXISTS dias_treino_all_admin
  ON dias_treino FOR ALL
  USING (auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
  ));

CREATE POLICY IF NOT EXISTS treinos_all_admin
  ON treinos FOR ALL
  USING (auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
  ));

CREATE POLICY IF NOT EXISTS blocos_treino_all_admin
  ON blocos_treino FOR ALL
  USING (auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
  ));

CREATE POLICY IF NOT EXISTS inscricoes_all_admin
  ON inscricoes FOR ALL
  USING (auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE role IN ('admin', 'head_coach')
  ));

-- ---------------------------------------------------------------
-- TABELAS AUXILIARES SEM POLICY (SE PRECISO)
-- ---------------------------------------------------------------

-- coaches: sem policy de select (coach pode ver colegas do mesmo box?)
CREATE POLICY IF NOT EXISTS coaches_select_box
  ON coaches FOR SELECT
  USING (box_id = current_setting('app.current_box_id', true)::UUID);

-- prs: aluno ve so os proprios, coach ve alunos do box
CREATE POLICY IF NOT EXISTS prs_select_own_or_box
  ON prs FOR SELECT
  USING (
    aluno_id IN (
      SELECT id FROM alunos WHERE usuario_id = auth.uid()
    )
    OR
    aluno_id IN (
      SELECT id FROM alunos WHERE box_id = current_setting('app.current_box_id', true)::UUID
    )
  );

-- frequencias: aluno ve so as proprias, coach ve do box
CREATE POLICY IF NOT EXISTS frequencias_select_own_or_box
  ON frequencias FOR SELECT
  USING (
    aluno_id IN (
      SELECT id FROM alunos WHERE usuario_id = auth.uid()
    )
    OR
    aluno_id IN (
      SELECT id FROM alunos WHERE box_id = current_setting('app.current_box_id', true)::UUID
    )
  );

-- rankings: todos do box
CREATE POLICY IF NOT EXISTS rankings_select_box
  ON rankings FOR SELECT
  USING (box_id = current_setting('app.current_box_id', true)::UUID);

-- comentarios: todos do box (coach ve comentarios de alunos do box)
CREATE POLICY IF NOT EXISTS comentarios_select_box
  ON comentarios FOR SELECT
  USING (true);
