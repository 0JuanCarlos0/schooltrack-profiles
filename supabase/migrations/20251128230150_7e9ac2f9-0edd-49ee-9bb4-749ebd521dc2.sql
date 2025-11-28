-- Crear tabla de noticias
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para noticias
CREATE POLICY "Todos pueden ver noticias"
ON public.news FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Solo admins pueden crear noticias"
ON public.news FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar noticias"
ON public.news FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar noticias"
ON public.news FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();