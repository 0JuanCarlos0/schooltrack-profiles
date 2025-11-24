-- Paso 1: Agregar el rol 'user' al enum de roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'user';

-- Paso 2: Insertar el usuario admin en user_roles
-- El usuario admin@schooltrack.com ya existe con ID: 57163464-fc06-4b2c-9805-b804b45c7a35
INSERT INTO public.user_roles (user_id, role)
VALUES ('57163464-fc06-4b2c-9805-b804b45c7a35', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Paso 3: Actualizar el perfil del admin
UPDATE public.profiles
SET full_name = 'Administrador', role = 'admin'
WHERE id = '57163464-fc06-4b2c-9805-b804b45c7a35';