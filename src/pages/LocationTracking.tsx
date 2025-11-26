import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, MapPin, Play, Square, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LocationRecord {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  user_id: string;
}

const LocationTracking = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [locationHistory, setLocationHistory] = useState<LocationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const {
    location,
    error,
    isTracking,
    isLoading,
    startTracking,
    stopTracking,
  } = useGeolocation({ trackingIntervalMs: 60000 }); // 1 minuto

  useEffect(() => {
    if (user) {
      fetchLocationHistory();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchLocationHistory = async () => {
    if (!user) return;

    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('location_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLocationHistory(data || []);
    } catch (err) {
      console.error('Error fetching location history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('location-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setLocationHistory((prev) => [payload.new as LocationRecord, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Badge variant={isTracking ? 'default' : 'secondary'}>
            {isTracking ? 'Rastreando' : 'Inactivo'}
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Panel de Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Rastreo de Ubicación
              </CardTitle>
              <CardDescription>
                Activa el rastreo para guardar tu ubicación cada minuto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {!isTracking ? (
                  <Button 
                    onClick={startTracking} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Iniciar Rastreo
                  </Button>
                ) : (
                  <Button 
                    onClick={stopTracking} 
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Detener Rastreo
                  </Button>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {location && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Ubicación Actual</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latitud:</span>
                      <p className="font-mono">{location.latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Longitud:</span>
                      <p className="font-mono">{location.longitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Precisión:</span>
                      <p className="font-mono">{location.accuracy.toFixed(0)}m</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hora:</span>
                      <p className="font-mono">
                        {format(location.timestamp, 'HH:mm:ss', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Ubicaciones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Ubicaciones</CardTitle>
                  <CardDescription>Últimas 50 ubicaciones registradas</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={fetchLocationHistory}
                  disabled={loadingHistory}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {locationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay ubicaciones registradas</p>
                    <p className="text-sm">Inicia el rastreo para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locationHistory.map((record, index) => (
                      <div
                        key={record.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                            <span className="text-sm font-medium">
                              {format(new Date(record.timestamp), 'dd MMM, HH:mm:ss', { locale: es })}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ±{record.accuracy?.toFixed(0) || '?'}m
                          </Badge>
                        </div>
                        <div className="mt-1 pl-4 text-xs text-muted-foreground font-mono">
                          {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LocationTracking;
