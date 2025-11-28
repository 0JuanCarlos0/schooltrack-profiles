import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { Map } from '@/components/Map';

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

interface Route {
  id: string;
  name: string;
  vehicle_id: string | null;
  vehicles?: {
    vehicle_number: string;
    plate_number: string;
  };
}

const MapView = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Centro en San Juan del Río, Querétaro
  const center: [number, number] = [20.3883, -99.9830];

  useEffect(() => {
    loadLocations();
    loadRoutes();
    
    // Suscripción en tiempo real
    const subscription = supabase
      .channel('location_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'location_tracking'
      }, () => {
        loadLocations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadLocations = async () => {
    try {
      // Cargar las últimas ubicaciones
      const { data: locationData, error: locationError } = await supabase
        .from('location_tracking')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (locationError) throw locationError;

      // Obtener información de usuarios
      const userIds = [...new Set(locationData?.map(l => l.user_id) || [])];
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Combinar datos y filtrar última ubicación por usuario
      const locationsWithUsers = locationData?.map(loc => {
        const profile = profileData?.find(p => p.id === loc.user_id);
        return {
          ...loc,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null
        };
      }) || [];

      // Filtrar para obtener solo la última ubicación de cada usuario
      const uniqueLocations = locationsWithUsers.reduce((acc: LocationPoint[], curr) => {
        if (!acc.find(loc => loc.user_id === curr.user_id)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      
      setLocations(uniqueLocations);
    } catch (error: any) {
      console.error('Error al cargar ubicaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          vehicles (
            vehicle_number,
            plate_number
          )
        `)
        .eq('status', 'active');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      console.error('Error al cargar rutas:', error);
    }
  };

  const getUserName = (location: LocationPoint) => {
    return location.user_name || location.user_email || 'Usuario';
  };

  // Ruta de ejemplo para simulación (San Juan del Río)
  const sampleRoute: [number, number][] = [
    [20.3883, -99.9830],
    [20.3900, -99.9850],
    [20.3920, -99.9870],
    [20.3940, -99.9890],
    [20.3960, -99.9910]
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-[1000] shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Mapa de Vehículos</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de información */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Vehículos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-gray-500">Cargando...</p>
                ) : locations.length === 0 ? (
                  <p className="text-gray-500">No hay ubicaciones activas</p>
                ) : (
                  <div className="space-y-3">
                    {locations.map((location) => (
                      <div key={location.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-cyan-500 mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{getUserName(location)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(location.timestamp).toLocaleTimeString('es-MX')}
                            </p>
                            <p className="text-xs text-gray-400">
                              Lat: {location.latitude.toFixed(5)}, 
                              Lng: {location.longitude.toFixed(5)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rutas Activas</CardTitle>
              </CardHeader>
              <CardContent>
                {routes.length === 0 ? (
                  <p className="text-gray-500">No hay rutas activas</p>
                ) : (
                  <div className="space-y-3">
                    {routes.map((route) => (
                      <div key={route.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">{route.name}</p>
                        {route.vehicles && (
                          <p className="text-xs text-gray-500">
                            {route.vehicles.vehicle_number} - {route.vehicles.plate_number}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] overflow-hidden">
              <CardContent className="p-0 h-full">
                {!loading && (
                  <Map
                    locations={locations}
                    center={center}
                    sampleRoute={sampleRoute}
                    getUserName={getUserName}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
