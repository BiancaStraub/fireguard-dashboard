CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  IF NEW.email = 'admin@adelia.edu.br' THEN
    assigned_role := 'admin';
  ELSIF NEW.email = 'inspetor@adelia.edu.br' THEN
    assigned_role := 'inspetor';
  ELSIF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'inspetor';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;