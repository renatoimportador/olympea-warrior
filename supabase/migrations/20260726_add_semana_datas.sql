-- Migration: adicionar datas de vigencia a public.semanas
-- Objetivo: permitir selecao automatica da semana vigente por data real

BEGIN;

-- Adiciona colunas apenas se nao existirem
ALTER TABLE public.semanas
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Adiciona comentarios para documentacao
COMMENT ON COLUMN public.semanas.data_inicio IS 'Data inicial de vigencia da semana (inclusive)';
COMMENT ON COLUMN public.semanas.data_fim IS 'Data final de vigencia da semana (inclusive)';

COMMIT;
