-- 1. Crear enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'parent', 'driver');

-- 2. Crear tabla de roles de usuario (separada de profiles por seguridad)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Crear función security definer para verificar roles (evita recursión infinita)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Crear función para obtener el rol principal del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'driver' THEN 2
      WHEN 'parent' THEN 3
      WHEN 'student' THEN 4
    END
  LIMIT 1
$$;

-- 6. Políticas para user_roles
CREATE POLICY "Los usuarios pueden ver sus propios roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los admins pueden ver todos los roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los admins pueden crear roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los admins pueden actualizar roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los admins pueden eliminar roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Actualizar políticas de profiles
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON public.profiles;

CREATE POLICY "Los usuarios pueden ver su propio perfil"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Los admins pueden ver todos los perfiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 8. Actualizar políticas de students
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los estudiantes" ON public.students;
DROP POLICY IF EXISTS "Los usuarios pueden crear estudiantes" ON public.students;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar estudiantes" ON public.students;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar estudiantes" ON public.students;

CREATE POLICY "Los admins pueden ver todos los estudiantes"
ON public.students
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los conductores pueden ver todos los estudiantes"
ON public.students
FOR SELECT
USING (public.has_role(auth.uid(), 'driver'));

CREATE POLICY "Los padres pueden ver estudiantes asociados a ellos"
ON public.students
FOR SELECT
USING (
  public.has_role(auth.uid(), 'parent') AND
  user_id = auth.uid()
);

CREATE POLICY "Los estudiantes pueden ver su propia información"
ON public.students
FOR SELECT
USING (
  public.has_role(auth.uid(), 'student') AND
  user_id = auth.uid()
);

CREATE POLICY "Los admins pueden crear estudiantes"
ON public.students
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los admins pueden actualizar estudiantes"
ON public.students
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los admins pueden eliminar estudiantes"
ON public.students
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Crear tabla de vehículos de transporte
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT UNIQUE NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  driver_id UUID REFERENCES profiles(id),
  capacity INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos los usuarios autenticados pueden ver vehículos"
ON public.vehicles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Los admins pueden gestionar vehículos"
ON public.vehicles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Crear tabla de rutas
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  vehicle_id UUID REFERENCES vehicles(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos los usuarios autenticados pueden ver rutas"
ON public.routes
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Los admins pueden gestionar rutas"
ON public.routes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Crear tabla de asignación estudiante-ruta
CREATE TABLE public.student_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  pickup_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (student_id, route_id)
);

ALTER TABLE public.student_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los admins pueden ver todas las asignaciones"
ON public.student_routes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Los conductores pueden ver asignaciones de sus rutas"
ON public.student_routes
FOR SELECT
USING (
  public.has_role(auth.uid(), 'driver') AND
  EXISTS (
    SELECT 1 FROM routes r
    JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.id = route_id AND v.driver_id = auth.uid()
  )
);

CREATE POLICY "Los padres pueden ver las rutas de sus hijos"
ON public.student_routes
FOR SELECT
USING (
  public.has_role(auth.uid(), 'parent') AND
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Los admins pueden gestionar asignaciones"
ON public.student_routes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 12. Triggers para updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_routes_updated_at
BEFORE UPDATE ON public.routes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 13. Insertar usuario admin por defecto
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar o crear usuario admin
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@schooltrack.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Asignar rol de admin si no existe
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;