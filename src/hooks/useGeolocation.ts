import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  trackingIntervalMs?: number;
  autoStart?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const { 
    enableHighAccuracy = true, 
    trackingIntervalMs = 60000, // 1 minuto por defecto
    autoStart = false 
  } = options;

  const { user } = useAuth();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<Date | null>(null);

  const saveLocationToDatabase = useCallback(async (locationData: LocationData) => {
    if (!user) return;

    try {
      const { error: dbError } = await supabase
        .from('location_tracking')
        .insert({
          user_id: user.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp.toISOString(),
        });

      if (dbError) throw dbError;
      
      lastSavedRef.current = new Date();
      console.log('Ubicación guardada:', locationData);
    } catch (err: any) {
      console.error('Error guardando ubicación:', err.message);
    }
  }, [user]);

  const getCurrentPosition = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada en este navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          resolve(locationData);
        },
        (err) => {
          reject(new Error(getGeolocationErrorMessage(err)));
        },
        {
          enableHighAccuracy,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [enableHighAccuracy]);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador');
      toast.error('Geolocalización no soportada');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Obtener ubicación inicial
      const initialLocation = await getCurrentPosition();
      setLocation(initialLocation);
      await saveLocationToDatabase(initialLocation);
      
      setIsTracking(true);
      toast.success('Rastreo de ubicación iniciado');

      // Configurar intervalo para guardar cada minuto
      intervalRef.current = setInterval(async () => {
        try {
          const currentLocation = await getCurrentPosition();
          setLocation(currentLocation);
          await saveLocationToDatabase(currentLocation);
        } catch (err: any) {
          console.error('Error en intervalo:', err.message);
        }
      }, trackingIntervalMs);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPosition, saveLocationToDatabase, trackingIntervalMs]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    toast.info('Rastreo de ubicación detenido');
  }, []);

  // Auto-start si está habilitado
  useEffect(() => {
    if (autoStart && user) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [autoStart, user]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    location,
    error,
    isTracking,
    isLoading,
    startTracking,
    stopTracking,
    lastSaved: lastSavedRef.current,
  };
};

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Por favor habilita el acceso a ubicación.';
    case error.POSITION_UNAVAILABLE:
      return 'Información de ubicación no disponible.';
    case error.TIMEOUT:
      return 'Tiempo de espera agotado al obtener ubicación.';
    default:
      return 'Error desconocido al obtener ubicación.';
  }
}

export default useGeolocation;
