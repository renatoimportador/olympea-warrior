-- Migration: adicionar modalidade em public.programacoes
-- Objetivo: separar programacoes entre PLANILHA (online) e BOX_PRESENCIAL (aulas presenciais)
-- Regras:
-- - Nao altera tipo, ativa, vigencia nem inscricoes.
-- - Preserva todos os registros existentes como PLANILHA.
-- - So aceita os valores PLANILHA ou BOX_PRESENCIAL.

BEGIN;

ALTER TABLE public.programacoes
  ADD COLUMN IF NOT EXISTS modalidade TEXT NOT NULL DEFAULT 'PLANILHA';

ALTER TABLE public.programacoes
  ADD CONSTRAINT chk_programacoes_modalidade
  CHECK (modalidade IN ('PLANILHA', 'BOX_PRESENCIAL'));

COMMENT ON COLUMN public.programacoes.modalidade IS 'Modalidade da programacao: PLANILHA (online) ou BOX_PRESENCIAL (aulas presenciais)';

COMMIT;
