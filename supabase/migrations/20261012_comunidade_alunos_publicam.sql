-- ============================================================================
-- OLYMPEA WARRIOR — ETAPA 4.3
-- Comunidade participativa: ALUNOS podem criar publicacoes
-- ============================================================================
-- Migration INCREMENTAL e estritamente ADITIVA. Nao altera nem remove
-- nenhuma policy, trigger, funcao ou tabela da migration 4.1
-- (20261011_comunidade_fundacao.sql), que ja esta aplicada em producao.
--
-- O que muda (apenas permissões NOVAS, em OR com as policies existentes):
--   1. Aluno pode CRIAR publicacao no proprio box (nasce RASCUNHO, autor =
--      ele mesmo — mesma regra de autoria/box derivada de auth.uid()).
--   2. Aluno pode EDITAR a propria publicacao (legenda) e PUBLICAR o
--      proprio rascunho. Moderacao (ativo), autor, box, id e created_at
--      continuam protegidos pelos triggers da 4.1.
--   3. Aluno pode EXCLUIR o proprio RASCUNHO (cancelamento). Publicacao
--      PUBLICADA nunca e excluida — e moderada pelo admin (regra da 4.1).
--   4. Aluno pode REGISTRAR/REMOVER fotos do proprio RASCUNHO.
--   5. Aluno pode fazer UPLOAD/DELETE de objetos no bucket 'comunidade'
--      SOMENTE no prefixo do proprio rascunho.
--
-- O que NAO muda (protecoes da 4.1 que permanecem intactas):
--   - Isolamento entre boxes (todas as policies exigem box_id = app_box_atual()).
--   - Limite de 5 fotos (trigger app_comunidade_limite_fotos + storage_guard).
--   - Bucket privado; validacao fotos <-> storage antes de PUBLICAR.
--   - Imutabilidade de autor_id/box_id/id/created_at (triggers).
--   - Moderacao (ativo) EXCLUSIVA do admin (trigger + policy admin-only).
--   - Aluno NAO ve rascunhos nem moderadas DE OUTROS (select policies da 4.1
--     ja cobriam o proprio rascunho do autor — role-agnostic).
--   - STORAGE_VINCULO_PUBLICADA: arquivo de publicacao publicada e ativa nao
--     pode ser removido (vale para o aluno tambem).
--   - UPDATE de storage.objects: aluno NAO recebe policy de UPDATE (o fluxo
--     do app nao usa upsert; substituir = remover + reenviar).
--
-- Estrategia: novas policies PERMISSIVE (OR com as existentes). Nenhuma
-- policy existente e recriada, portanto as permissoes de admin/coach
-- permanecem bit a bit as mesmas.
--
-- Pre-requisito: migrations 3.1 (funcoes de identidade) e 4.1 aplicadas.
-- ============================================================================

BEGIN;

-- ============================================================================
-- [1] publicacoes — aluno cria o proprio rascunho no proprio box
-- ============================================================================
DROP POLICY IF EXISTS publicacoes_insert_aluno ON public.publicacoes;
CREATE POLICY publicacoes_insert_aluno
  ON public.publicacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.app_role_atual() = 'aluno'
    AND box_id = public.app_box_atual()
    AND autor_id = (SELECT i.id FROM public.app_identidade_atual() i)
    AND status = 'RASCUNHO'
  );

-- ============================================================================
-- [2] publicacoes — aluno edita/publica SOMENTE as proprias
-- ============================================================================
-- Permite editar a legenda (publicada ou rascunho) e a transicao
-- RASCUNHO -> PUBLICADA. As demais colunas sao protegidas pelo trigger
-- app_comunidade_publicacao_imutavel (id, created_at, autor_id, box_id
-- imutaveis; status so RASCUNHO->PUBLICADA; ativo so admin).
DROP POLICY IF EXISTS publicacoes_update_aluno ON public.publicacoes;
CREATE POLICY publicacoes_update_aluno
  ON public.publicacoes FOR UPDATE
  TO authenticated
  USING (
    public.app_role_atual() = 'aluno'
    AND box_id = public.app_box_atual()
    AND autor_id = (SELECT i.id FROM public.app_identidade_atual() i)
  )
  WITH CHECK (
    public.app_role_atual() = 'aluno'
    AND box_id = public.app_box_atual()
    AND autor_id = (SELECT i.id FROM public.app_identidade_atual() i)
  );

-- ============================================================================
-- [3] publicacoes — aluno exclui SOMENTE o proprio RASCUNHO
-- ============================================================================
-- Publicada nao pode ser excluida por ninguem (moderacao via ativo=false).
-- O trigger app_comunidade_rascunho_limpo continua exigindo a remocao
-- previa dos objetos do storage.
DROP POLICY IF EXISTS publicacoes_delete_aluno ON public.publicacoes;
CREATE POLICY publicacoes_delete_aluno
  ON public.publicacoes FOR DELETE
  TO authenticated
  USING (
    public.app_role_atual() = 'aluno'
    AND box_id = public.app_box_atual()
    AND status = 'RASCUNHO'
    AND autor_id = (SELECT i.id FROM public.app_identidade_atual() i)
  );

-- ============================================================================
-- [4] publicacao_fotos — aluno registra fotos SOMENTE no proprio rascunho
-- ============================================================================
DROP POLICY IF EXISTS publicacao_fotos_insert_aluno ON public.publicacao_fotos;
CREATE POLICY publicacao_fotos_insert_aluno
  ON public.publicacao_fotos FOR INSERT
  TO authenticated
  WITH CHECK (
    public.app_role_atual() = 'aluno'
    AND EXISTS (
      SELECT 1 FROM public.publicacoes p
      WHERE p.id = publicacao_fotos.publicacao_id
        AND p.box_id = public.app_box_atual()
        AND p.status <> 'PUBLICADA'
        AND p.autor_id = (SELECT i.id FROM public.app_identidade_atual() i)
    )
  );

-- Aluno remove fotos SOMENTE do proprio RASCUNHO (nunca de publicada —
-- diferente do admin, que pode remover de publicada moderada). O trigger
-- app_comunidade_foto_guard continua exigindo o objeto removido antes.
DROP POLICY IF EXISTS publicacao_fotos_delete_aluno ON public.publicacao_fotos;
CREATE POLICY publicacao_fotos_delete_aluno
  ON public.publicacao_fotos FOR DELETE
  TO authenticated
  USING (
    public.app_role_atual() = 'aluno'
    AND EXISTS (
      SELECT 1 FROM public.publicacoes p
      WHERE p.id = publicacao_fotos.publicacao_id
        AND p.box_id = public.app_box_atual()
        AND p.status = 'RASCUNHO'
        AND p.autor_id = (SELECT i.id FROM public.app_identidade_atual() i)
    )
  );

-- ============================================================================
-- [5] storage.objects — upload do aluno SOMENTE no prefixo do proprio rascunho
-- ============================================================================
-- Mesma forma da policy de staff: path {box_id}/{publicacao_id}/{arquivo},
-- publicacao existente, do mesmo box, NAO PUBLICADA e do proprio autor.
DROP POLICY IF EXISTS comunidade_insert_aluno ON storage.objects;
CREATE POLICY comunidade_insert_aluno
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comunidade'
    AND public.app_role_atual() = 'aluno'
    AND (storage.foldername(name))[1] = public.app_box_atual()::text
    AND EXISTS (
      SELECT 1 FROM public.publicacoes p
      WHERE p.id = NULLIF((storage.foldername(name))[2], '')::uuid
        AND p.box_id = public.app_box_atual()
        AND p.status <> 'PUBLICADA'
        AND p.autor_id = (SELECT i.id FROM public.app_identidade_atual() i)
    )
  );

-- DELETE de objeto: aluno remove arquivos do PROPRIO rascunho (cancelamento
-- / troca de foto). Reusa app_comunidade_path_autor_ou_admin(), que ja
-- autoriza o autor em publicacao NAO PUBLICADA (role-agnostic) e o admin.
-- O trigger trg_comunidade_storage_guard continua bloqueando a remocao de
-- arquivo vinculado a publicacao PUBLICADA e ativa.
DROP POLICY IF EXISTS comunidade_delete_aluno ON storage.objects;
CREATE POLICY comunidade_delete_aluno
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'comunidade'
    AND public.app_role_atual() = 'aluno'
    AND (storage.foldername(name))[1] = public.app_box_atual()::text
    AND public.app_comunidade_path_autor_ou_admin(name)
  );

COMMIT;

-- ============================================================================
-- NOTAS
-- ----------------------------------------------------------------------------
-- * SELECT: nenhuma policy nova foi necessaria — as policies da 4.1 ja
--   autorizam o AUTOR (qualquer papel) a ver o proprio rascunho, e o aluno
--   a ver PUBLICADAS ativas do box.
-- * UPDATE de storage.objects NAO foi concedido ao aluno: o fluxo do app
--   nao faz upsert; trocar foto = remover + reenviar (path imutavel).
-- * Concorrencia e limites continuam garantidos pelos triggers da 4.1,
--   independentemente do papel do autor.
-- * Idempotencia: todas as policies usam DROP POLICY IF EXISTS antes do
--   CREATE — reexecucao segura.
-- ============================================================================
