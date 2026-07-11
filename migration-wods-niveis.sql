-- ============================================================
-- MIGRACAO: WODs + Niveis dinamicos para Alunos
-- Execute no SQL Editor do Supabase ANTES do deploy
-- ============================================================
-- SEGURO: todos os comandos usam IF NOT EXISTS / IF EXISTS
-- Nenhum dado existente sera perdido ou alterado
-- ============================================================

-- ============================================================
-- 1. TABELA WODs (nova)
-- ============================================================
CREATE TABLE IF NOT EXISTS wods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_id UUID REFERENCES boxes(id),
  created_by UUID REFERENCES usuarios(id),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('FOR_TIME', 'AMRAP', 'EMOM', 'TABATA', 'CHIPPER', 'STRENGTH')),
  descricao TEXT,
  time_cap TEXT,
  exercicios JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS + Policies para WODs
ALTER TABLE wods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY allow_select_anon_wods ON wods FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE POLICY allow_all_anon_wods ON wods FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

-- Trigger updated_at para WODs (ignora se ja existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_wods_updated_at'
  ) THEN
    CREATE TRIGGER update_wods_updated_at BEFORE UPDATE ON wods
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================================
-- 2. TABELA NIVEIS - nenhuma alteracao
-- ============================================================
-- A tabela "niveis" JA EXISTE e ja esta em uso pelo CRUD de Niveis.
-- Este script NAO recria, NAO altera e NAO apaga nenhum dado dela.
-- Apenas garante que RLS e policies existam (caso faltem).

ALTER TABLE niveis ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY allow_select_anon_niveis ON niveis FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE POLICY allow_all_anon_niveis ON niveis FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

-- ============================================================
-- 3. REMOVER CHECK CONSTRAINT FIXA de alunos.categoria
-- ============================================================
-- A constraint "alunos_categoria_check" limita valores a
-- ('RX', 'SCALING', 'BEGINNER'). Ao remover, o campo passa
-- a aceitar qualquer valor vindo da tabela "niveis".
-- Dados existentes NAO sao alterados.

ALTER TABLE alunos DROP CONSTRAINT IF EXISTS alunos_categoria_check;

-- ============================================================
-- FIM DA MIGRACAO
-- ============================================================
