BEGIN;

ALTER TABLE public.programacoes
  DROP CONSTRAINT programacoes_tipo_check;

ALTER TABLE public.programacoes
  ADD CONSTRAINT programacoes_tipo_check
  CHECK (tipo IN ('CROSSFIT', 'LPO', 'GYMNASTICS', 'ENDURANCE', 'MASTER40', 'COMPETIDOR', 'HIBRIDO'));

COMMIT;
