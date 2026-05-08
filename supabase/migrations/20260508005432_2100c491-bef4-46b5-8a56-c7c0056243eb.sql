
-- 1. Add 'subadmin' to role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'subadmin';

-- 2. Add empresa_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

-- 3. Extintores: fotos + observacoes
ALTER TABLE public.extintores ADD COLUMN IF NOT EXISTS fotos text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.extintores ADD COLUMN IF NOT EXISTS observacoes text;

-- 4. Inspecoes: fotos + anexos
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS fotos text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS anexos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 5. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos', 'anexos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies
DO $$ BEGIN
  CREATE POLICY "Anexos: leitura pública" ON storage.objects FOR SELECT USING (bucket_id = 'anexos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anexos: upload autenticado" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'anexos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anexos: update autenticado" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'anexos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anexos: delete autenticado" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'anexos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
