import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, RefreshCw, Users } from 'lucide-react';
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

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

const AdminLocations = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLocations();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [selectedUser]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name');

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('location_tracking')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-location-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
        },
        (payload) => {
          const newLocation = payload.new as LocationRecord;
          if (selectedUser === 'all' || selectedUser === newLocation.user_id) {
            setLocations((prev) => [newLocation, ...prev].slice(0, 100));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || 'Desconocido';
  };

  // Agrupar ubicaciones por usuario
  const latestByUser = locations.reduce((acc, loc) => {
    if (!acc[loc.user_id]) {
      acc[loc.user_id] = loc;
    }
    return acc;
  }, {} as Record<string, LocationRecord>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Badge variant="default">
            {Object.keys(latestByUser).length} usuarios activos
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Monitor de Ubicaciones</h1>
          <p className="text-muted-foreground mt-1">Visualiza las ubicaciones de todos los usuarios en tiempo real</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Panel de Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Filtrar por Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={fetchLocations}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </CardContent>
          </Card>

          {/* Resumen de Usuarios Activos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Última Ubicación por Usuario</CardTitle>
              <CardDescription>Usuarios que han compartido su ubicación recientemente</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {Object.keys(latestByUser).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay ubicaciones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.values(latestByUser).map((loc) => (
                      <div
                        key={loc.user_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{getUserName(loc.user_id)}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            ±{loc.accuracy?.toFixed(0) || '?'}m
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(loc.timestamp), 'HH:mm:ss', { locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Historial Completo */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Historial de Ubicaciones</CardTitle>
              <CardDescription>Últimas 100 ubicaciones registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay ubicaciones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locations.map((record, index) => (
                      <div
                        key={record.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                            <div>
                              <span className="font-medium">{getUserName(record.user_id)}</span>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(record.timestamp), 'dd MMM yyyy, HH:mm:ss', { locale: es })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ±{record.accuracy?.toFixed(0) || '?'}m
                          </Badge>
                        </div>
                        <div className="mt-1 pl-4 text-xs text-muted-foreground font-mono">
                          Lat: {record.latitude.toFixed(6)}, Lng: {record.longitude.toFixed(6)}
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

export default AdminLocations;
