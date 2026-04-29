-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'inspetor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Has-role security definer (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Extintores
CREATE TABLE public.extintores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  classes TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Ativo',
  fabricante TEXT,
  predio TEXT NOT NULL,
  andar TEXT NOT NULL,
  setor TEXT NOT NULL,
  validade_carga DATE NOT NULL,
  teste_hidrostatico DATE,
  altura_cm INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_extintores_codigo ON public.extintores(codigo);
CREATE INDEX idx_extintores_setor ON public.extintores(setor);
CREATE INDEX idx_extintores_validade ON public.extintores(validade_carga);

-- Inspeções
CREATE TABLE public.inspecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extintor_id UUID NOT NULL REFERENCES public.extintores(id) ON DELETE CASCADE,
  inspetor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  inspetor_nome TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  conforme BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspecoes_extintor ON public.inspecoes(extintor_id);
CREATE INDEX idx_inspecoes_data ON public.inspecoes(data DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_extintores_updated BEFORE UPDATE ON public.extintores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- First user becomes admin, others become inspetor
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'inspetor');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extintores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspecoes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles: usuários autenticados podem ver" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles: cada um edita o seu" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles policies
CREATE POLICY "Roles: ver os próprios" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Roles: admin gerencia" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extintores policies
CREATE POLICY "Extintores: ver autenticados" ON public.extintores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Extintores: admin insere" ON public.extintores
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Extintores: admin atualiza" ON public.extintores
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Extintores: admin remove" ON public.extintores
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Inspeções policies
CREATE POLICY "Inspeções: ver autenticados" ON public.inspecoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inspeções: inspetor/admin cria" ON public.inspecoes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = inspetor_id AND (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inspetor')
    )
  );
CREATE POLICY "Inspeções: admin remove" ON public.inspecoes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));