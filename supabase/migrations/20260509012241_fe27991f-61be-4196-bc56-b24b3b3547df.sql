ALTER TABLE public.inspecoes
  ADD COLUMN IF NOT EXISTS acao text NOT NULL DEFAULT 'Inspecionado',
  ADD COLUMN IF NOT EXISTS pecas text;