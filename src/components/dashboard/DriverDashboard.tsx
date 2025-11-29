import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Route, Users, Clock, Calendar, Newspaper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NewsItem {
  id: string;
  title: string;
  date: string;
  description: string;
}

const DriverDashboard = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNewsItems(data || []);
    } catch (error) {
      console.error('Error al cargar noticias:', error);
    } finally {
      setLoadingNews(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Panel de Conductor</h2>
        <p className="text-gray-600 mt-2">Gestiona tu ruta y pasajeros</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mb-2">
              <Car className="w-6 h-6 text-cyan-500" />
            </div>
            <CardTitle>Mi Vehículo</CardTitle>
            <CardDescription>Unidad asignada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No hay vehículo asignado</p>
              <p className="text-sm mt-1">Contacta al administrador</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Route className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle>Ruta Asignada</CardTitle>
            <CardDescription>Tu ruta de trabajo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Sin ruta asignada</p>
              <p className="text-sm mt-1">Espera asignación</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Estudiantes en Ruta</CardTitle>
            <CardDescription>Pasajeros asignados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No hay estudiantes</p>
              <p className="text-sm mt-1">Se mostrarán con la ruta</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <CardTitle>Horario de Hoy</CardTitle>
            <CardDescription>Programación del día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Sin horario configurado</p>
              <p className="text-sm mt-1">Requiere asignación de ruta</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Car className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Bienvenido Conductor</h3>
              <p className="text-gray-700">
                Desde este panel podrás ver tu vehículo asignado, la ruta diaria, lista de estudiantes y reportar
                cualquier incidencia. Recuerda mantener actualizada tu ubicación para que los padres puedan rastrear el transporte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Noticias */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Noticias y Actualizaciones</h3>
        </div>
        {loadingNews ? (
          <p className="text-center text-gray-500 py-8">Cargando noticias...</p>
        ) : newsItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No hay noticias disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.date).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
