
-- 1) PROFILES: own profile only (admins see all)
DROP POLICY IF EXISTS "Profiles: usuários autenticados podem ver" ON public.profiles;
CREATE POLICY "Profiles: ver o próprio ou admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) EMPRESAS: scoped to user's empresa
DROP POLICY IF EXISTS "Empresas visíveis para autenticados" ON public.empresas;
CREATE POLICY "Empresas: ver a própria ou admin"
  ON public.empresas FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- 3) EXTINTORES: scoped to user's empresa
DROP POLICY IF EXISTS "Extintores: ver autenticados" ON public.extintores;
CREATE POLICY "Extintores: ver por empresa ou admin"
  ON public.extintores FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- 4) ALERTAS: via extintor.empresa_id
DROP POLICY IF EXISTS "Authenticated users can view alertas" ON public.alertas;
CREATE POLICY "Alertas: ver por empresa ou admin"
  ON public.alertas FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.extintores e
      WHERE e.id = alertas.extintor_id
        AND e.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 5) INSPECOES: via extintor.empresa_id
DROP POLICY IF EXISTS "Inspeções: ver autenticados" ON public.inspecoes;
CREATE POLICY "Inspecoes: ver por empresa ou admin"
  ON public.inspecoes FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.extintores e
      WHERE e.id = inspecoes.extintor_id
        AND e.empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 6) STORAGE: make 'anexos' private + ownership-scoped UPDATE/DELETE
UPDATE storage.buckets SET public = false WHERE id = 'anexos';

DROP POLICY IF EXISTS "Anexos: leitura pública" ON storage.objects;
CREATE POLICY "Anexos: leitura autenticada"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'anexos');

DROP POLICY IF EXISTS "Anexos: update autenticado" ON storage.objects;
CREATE POLICY "Anexos: update do dono ou admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'anexos'
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

DROP POLICY IF EXISTS "Anexos: delete autenticado" ON storage.objects;
CREATE POLICY "Anexos: delete do dono ou admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'anexos'
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

-- 7) has_role: restrict EXECUTE to authenticated only (used by RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
