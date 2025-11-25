-- Políticas RLS para el bucket de avatares

-- Los usuarios pueden ver todos los avatares (bucket público)
CREATE POLICY "Avatares públicos accesibles para todos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Los usuarios pueden subir sus propios avatares
CREATE POLICY "Usuarios pueden subir su propio avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden actualizar sus propios avatares
CREATE POLICY "Usuarios pueden actualizar su propio avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden eliminar sus propios avatares
CREATE POLICY "Usuarios pueden eliminar su propio avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);