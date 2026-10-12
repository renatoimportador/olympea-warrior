-- ============================================================================
-- OLYMPEA WARRIOR — ETAPA 4.4 (seguranca)
-- Correcao da RLS da tabela public.inscricoes
-- ============================================================================
-- DIAGNOSTICO (confirmado manualmente em producao):
--   * Politica unica: allow_all_inscricoes — cmd ALL, roles {public},
--     qual=true, with_check=true. Qualquer usuario (inclusive anon) podia
--     ler, criar, alterar e EXCLUIR inscricoes de QUALQUER box.
--   * authenticated possui SELECT/INSERT/UPDATE/DELETE na tabela.
--   * RLS habilitado NAO foi confirmado (o schema legado nao habilita RLS
--     em inscricoes); a migration habilita de forma idempotente.
--
-- RISCOS DA CONFIGURACAO ATUAL:
--   * Aluno mal-intencionado podia inscrever-se em qualquer programacao de
--     qualquer box (acesso indevido a treinos e check-in).
--   * Podia ativar/desativar/excluir inscricoes de outros alunos.
--   * anon (nao autenticado) tambem estava coberto por roles {public}.
--
-- DEPENDENCIAS MAPEADAS (auditoria do codigo):
--   ESCRITA (apenas admin, Etapa 4.4):
--     * src/lib/modalidades.ts — obterInscricoesAluno (SELECT todas),
--       obterModalidadesPorAluno (SELECT ativas), aplicarModalidades
--       (INSERT + UPDATE ativa/data_fim). Nunca DELETE.
--   LEITURA (aluno):
--     * src/lib/api.ts getProgramacoesByAluno — SELECT das proprias
--       inscricoes ativas (inscricoes.ativa = true).
--     * useProgramacaoAtiva / Programacao — consomem a funcao acima.
--   FUNCOES PRIVILEGIADAS (nao afetadas por RLS):
--     * realizar_checkin (Etapa 3.1, SECURITY DEFINER) verifica inscricao
--       ativa em BOX_PRESENCIAL — executa como owner, bypassa RLS.
--   NENHUM outro modulo (coach, campeonatos, comunidade) acessa inscricoes.
--
-- ESTRATEGIA (transacao unica — sem janela de acesso indevido):
--   1. ENABLE RLS (idempotente).
--   2. REVOKE: anon perde tudo; authenticated perde DELETE (a aplicacao
--      desativa inscricoes — ativa=false — e nunca exclui).
--   3. DROP da policy permissiva + CREATE das policies restritivas.
--
-- ESCOPO DAS POLICIAS: o box e derivado da PROGRAMACAO vinculada
-- (programacoes.box_id), nunca de valores enviados pelo cliente.
-- ============================================================================

BEGIN;

-- [1] RLS habilitada (no-op se ja estiver habilitada)
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- [2] Privilegios minimos
-- anon nao deve acessar inscricoes.
REVOKE ALL ON public.inscricoes FROM anon;
REVOKE ALL ON public.inscricoes FROM PUBLIC;
-- A aplicacao nunca exclui inscricoes (desativa com ativa=false, preservando
-- historico). Remover DELETE reduz a superficie de ataque.
REVOKE DELETE ON public.inscricoes FROM authenticated;
-- Garante (idempotente) os privilegios efetivamente necessarios.
GRANT SELECT, INSERT, UPDATE ON public.inscricoes TO authenticated;

-- [3] Substitui a policy permissiva (mesma transacao das novas policies)
DROP POLICY IF EXISTS allow_all_inscricoes ON public.inscricoes;

-- [4] SELECT — admin do box da programacao (gestao completa da Etapa 4.4)
DROP POLICY IF EXISTS inscricoes_select_admin ON public.inscricoes;
CREATE POLICY inscricoes_select_admin
  ON public.inscricoes FOR SELECT
  TO authenticated
  USING (
    public.app_role_atual() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.programacoes p
      WHERE p.id = inscricoes.programacao_id
        AND p.box_id = public.app_box_atual()
    )
  );

-- [5] SELECT — coach do box da programacao (somente leitura, para
-- funcionalidades de acompanhamento; sem nenhuma permissao de escrita)
DROP POLICY IF EXISTS inscricoes_select_coach ON public.inscricoes;
CREATE POLICY inscricoes_select_coach
  ON public.inscricoes FOR SELECT
  TO authenticated
  USING (
    public.app_role_atual() = 'coach'
    AND EXISTS (
      SELECT 1 FROM public.programacoes p
      WHERE p.id = inscricoes.programacao_id
        AND p.box_id = public.app_box_atual()
    )
  );

-- [6] SELECT — aluno ve SOMENTE as proprias inscricoes (ativas e inativas;
-- o frontend filtra ativa=true). app_aluno_atual() resolve via
-- usuarios.auth_id -> alunos e falha fechado (NULL) em duplicidade.
DROP POLICY IF EXISTS inscricoes_select_aluno ON public.inscricoes;
CREATE POLICY inscricoes_select_aluno
  ON public.inscricoes FOR SELECT
  TO authenticated
  USING (
    aluno_id = public.app_aluno_atual()
  );

-- [7] INSERT — somente admin, e a programacao DEVE ser do proprio box.
-- Impede forjar inscricao em programacao de outro box mesmo com
-- programacao_id conhecido.
DROP POLICY IF EXISTS inscricoes_insert_admin ON public.inscricoes;
CREATE POLICY inscricoes_insert_admin
  ON public.inscricoes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.app_role_atual() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.programacoes p
      WHERE p.id = inscricoes.programacao_id
        AND p.box_id = public.app_box_atual()
    )
  );

-- [8] UPDATE — somente admin do box da programacao (USING: linha visivel;
-- WITH CHECK: a linha resultante continua apontando para programacao do
-- proprio box, impedindo re-apontar programacao_id para outro box).
DROP POLICY IF EXISTS inscricoes_update_admin ON public.inscricoes;
CREATE POLICY inscricoes_update_admin
  ON public.inscricoes FOR UPDATE
  TO authenticated
  USING (
    public.app_role_atual() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.programacoes p
      WHERE p.id = inscricoes.programacao_id
        AND p.box_id = public.app_box_atual()
    )
  )
  WITH CHECK (
    public.app_role_atual() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.programacoes p
      WHERE p.id = inscricoes.programacao_id
        AND p.box_id = public.app_box_atual()
    )
  );

-- DELETE: nenhuma policy — inscricoes nunca sao excluidas pela aplicacao
-- (preservacao de historico). Combinado com REVOKE DELETE acima.

COMMIT;

-- ============================================================================
-- NOTAS DE SEGURANCA
-- ----------------------------------------------------------------------------
-- * Funcoes de identidade (app_role_atual, app_box_atual, app_aluno_atual)
--   sao da Etapa 3.1: SECURITY DEFINER, STABLE, search_path seguro e falham
--   fechado em identidade duplicada. Nao ha recursao de policies: as
--   subqueries leem apenas programacoes (tabela legada com policies
--   permissivas proprias) e alunos/usuarios (via SECURITY DEFINER).
-- * RISCO RESIDUAL documentado: as policies delimitam o escopo pela
--   programacao, mas nao impedem o admin de inscrever um aluno_id de OUTRO
--   box na programacao do proprio box (cenario improvavel: exigira conhecer
--   o UUID do aluno estrangeiro e a propria RLS de alunos impediria sua
--   selecao na interface). A validacao aluno-pertence-ao-box nao foi
--   incluida porque alunos/usuarios legados podem ter box_id NULL —
--   verificavel somente em producao com:
--     select count(*) from alunos where box_id is null;
--     select count(*) from usuarios where box_id is null;
--   Se ambas retornarem 0, uma restricao adicional podera ser proposta.
-- * Idempotencia: ENABLE RLS, REVOKE/GRANT e DROP POLICY IF EXISTS permitem
--   reexecucao segura.
-- ============================================================================
