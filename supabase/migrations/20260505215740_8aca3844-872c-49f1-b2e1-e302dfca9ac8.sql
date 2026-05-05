-- Empresas (clientes)
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  endereco TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas visíveis para autenticados"
  ON public.empresas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam empresas"
  ON public.empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add columns to extintores for traceability
ALTER TABLE public.extintores
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS capacidade TEXT,
  ADD COLUMN IF NOT EXISTS localizacao TEXT,
  ADD COLUMN IF NOT EXISTS data_recarga DATE,
  ADD COLUMN IF NOT EXISTS agrupamento_risco TEXT;

CREATE INDEX IF NOT EXISTS idx_extintores_empresa ON public.extintores(empresa_id);

-- Seed 5 companies
INSERT INTO public.empresas (id, nome, cnpj, endereco) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Condomínio Atlântico Sul', '12.345.678/0001-01', 'Av. Beira Mar, 1000 - Centro'),
  ('22222222-2222-2222-2222-222222222222', 'Colégio Educare', '23.456.789/0001-02', 'Rua das Flores, 250 - Bairro Novo'),
  ('33333333-3333-3333-3333-333333333333', 'Indústria Metalúrgica Costa & Silva', '34.567.890/0001-03', 'Rod. BR-101, Km 25 - Distrito Industrial'),
  ('44444444-4444-4444-4444-444444444444', 'Shopping Praia Center', '45.678.901/0001-04', 'Av. Litorânea, 5000 - Praia Norte'),
  ('55555555-5555-5555-5555-555555555555', 'Hospital São Lucas', '56.789.012/0001-05', 'Rua da Saúde, 800 - Centro Médico');