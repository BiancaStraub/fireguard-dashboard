CREATE POLICY "Empresas: inspetor vê todas"
ON public.empresas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'inspetor'::app_role));

CREATE POLICY "Extintores: inspetor vê todos"
ON public.extintores FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'inspetor'::app_role));

CREATE POLICY "Inspecoes: inspetor vê todas"
ON public.inspecoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'inspetor'::app_role));

CREATE POLICY "Alertas: inspetor vê todos"
ON public.alertas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'inspetor'::app_role));