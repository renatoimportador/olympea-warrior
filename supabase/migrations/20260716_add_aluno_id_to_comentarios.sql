-- Migration: adicionar aluno_id a tabela comentarios para conversas individuais
-- Idempotente e segura: nao recria a tabela, nao apaga dados.

-- 1. Adiciona coluna aluno_id se ainda nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comentarios' AND column_name = 'aluno_id'
  ) THEN
    ALTER TABLE public.comentarios
      ADD COLUMN aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 2. Permite que resultado_id seja NULL para conversas gerais (ja existe como NOT NULL? Ajusta)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comentarios' AND column_name = 'resultado_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.comentarios
      ALTER COLUMN resultado_id DROP NOT NULL;
  END IF;
END$$;

-- 3. Preenche aluno_id dos comentarios antigos a partir de resultados.aluno_id
UPDATE public.comentarios c
SET aluno_id = r.aluno_id
FROM public.resultados r
WHERE c.resultado_id = r.id
  AND c.aluno_id IS NULL;

-- 4. Cria indice em aluno_id para performance
CREATE INDEX IF NOT EXISTS idx_comentarios_aluno_id ON public.comentarios(aluno_id);

-- 5. Atualiza ou cria trigger de updated_at (se a tabela nao tiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comentarios_updated_at'
  ) THEN
    CREATE TRIGGER update_comentarios_updated_at
      BEFORE UPDATE ON public.comentarios
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;
