-- Crear tabla para rastreo de ubicaciones
CREATE TABLE public.location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX idx_location_tracking_user_id ON public.location_tracking(user_id);
CREATE INDEX idx_location_tracking_timestamp ON public.location_tracking(timestamp DESC);

-- Habilitar RLS
ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para location_tracking
-- Los admins pueden ver todas las ubicaciones
CREATE POLICY "Admins pueden ver todas las ubicaciones"
ON public.location_tracking FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Los usuarios pueden insertar sus propias ubicaciones
CREATE POLICY "Usuarios pueden insertar sus propias ubicaciones"
ON public.location_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden ver sus propias ubicaciones
CREATE POLICY "Usuarios pueden ver sus propias ubicaciones"
ON public.location_tracking FOR SELECT
USING (auth.uid() = user_id);

-- Los conductores pueden ver ubicaciones de usuarios en sus rutas
CREATE POLICY "Conductores pueden ver ubicaciones de sus rutas"
ON public.location_tracking FOR SELECT
USING (
  has_role(auth.uid(), 'driver'::app_role) 
  AND EXISTS (
    SELECT 1 FROM vehicles v
    JOIN routes r ON r.vehicle_id = v.id
    JOIN student_routes sr ON sr.route_id = r.id
    JOIN students s ON s.id = sr.student_id
    WHERE v.driver_id = auth.uid()
    AND s.user_id = location_tracking.user_id
  )
);

-- Habilitar realtime para la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_tracking;