-- Script para asignar conductores a vehículos
-- IMPORTANTE: Ejecutar DESPUÉS de registrar los usuarios de prueba

-- Paso 1: Asignar rol 'driver' a los 3 conductores
-- (Reemplaza los emails con los que registraste)
INSERT INTO user_roles (user_id, role)
SELECT id, 'driver'
FROM profiles
WHERE email IN (
  'conductor1@schooltrack.com',
  'conductor2@schooltrack.com',
  'conductor3@schooltrack.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Paso 2: Asignar conductores a los 3 vehículos activos del mapa
-- BUS-001 <- conductor1
UPDATE vehicles 
SET driver_id = (SELECT id FROM profiles WHERE email = 'conductor1@schooltrack.com')
WHERE vehicle_number = 'BUS-001';

-- BUS-002 <- conductor2
UPDATE vehicles 
SET driver_id = (SELECT id FROM profiles WHERE email = 'conductor2@schooltrack.com')
WHERE vehicle_number = 'BUS-002';

-- BUS-003 <- conductor3
UPDATE vehicles 
SET driver_id = (SELECT id FROM profiles WHERE email = 'conductor3@schooltrack.com')
WHERE vehicle_number = 'BUS-003';

-- Verificar asignaciones
SELECT 
  v.vehicle_number,
  v.status,
  p.full_name as conductor,
  p.email
FROM vehicles v
LEFT JOIN profiles p ON v.driver_id = p.id
WHERE v.status = 'active'
ORDER BY v.vehicle_number;
