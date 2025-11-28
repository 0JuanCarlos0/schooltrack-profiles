import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Route, UserCheck, UserCog, Navigation, Newspaper, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    users: 0,
    students: 0,
    vehicles: 0,
    routes: 0,
    drivers: 0,
    locations: 0,
    news: 0
  });

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      // Contar usuarios (solo rol 'user' o sin rol específico)
      const { count: usersCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // Contar estudiantes
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Contar vehículos activos
      const { count: vehiclesCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Contar rutas activas
      const { count: routesCount } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Contar conductores
      const { count: driversCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver');

      // Contar ubicaciones
      const { count: locationsCount } = await supabase
        .from('location_tracking')
        .select('*', { count: 'exact', head: true });

      // Contar noticias
      const { count: newsCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      setCounts({
        users: usersCount || 0,
        students: studentsCount || 0,
        vehicles: vehiclesCount || 0,
        routes: routesCount || 0,
        drivers: driversCount || 0,
        locations: locationsCount || 0,
        news: newsCount || 0
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const stats = [
    {
      title: "Usuarios",
      value: counts.users.toString(),
      icon: UserCog,
      description: "Gestión de usuarios",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      route: "/users"
    },
    {
      title: "Total Estudiantes",
      value: counts.students.toString(),
      icon: Users,
      description: "Estudiantes registrados",
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
      route: "/students"
    },
    {
      title: "Vehículos Activos",
      value: counts.vehicles.toString(),
      icon: Car,
      description: "Unidades en servicio",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      route: "/vehicles"
    },
    {
      title: "Rutas Activas",
      value: counts.routes.toString(),
      icon: Route,
      description: "Rutas operativas",
      color: "text-green-500",
      bgColor: "bg-green-50",
      route: "/routes"
    },
    {
      title: "Conductores",
      value: counts.drivers.toString(),
      icon: UserCheck,
      description: "Conductores asignados",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      route: "/drivers"
    },
    {
      title: "Ubicaciones",
      value: counts.locations.toString(),
      icon: Navigation,
      description: "Monitor en tiempo real",
      color: "text-red-500",
      bgColor: "bg-red-50",
      route: "/admin/locations"
    },
    {
      title: "Noticias",
      value: counts.news.toString(),
      icon: Newspaper,
      description: "Gestión de noticias",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      route: "/admin/news"
    },
    {
      title: "Mapa",
      value: "En Vivo",
      icon: Map,
      description: "Vista de mapa en vivo",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      route: "/map"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Panel de Administración</h2>
        <p className="text-gray-600 mt-2">Gestiona todo el sistema de transporte escolar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all cursor-pointer border-l-4 hover:scale-105"
            style={{ borderLeftColor: stat.color.replace('text-', '') }}
            onClick={() => navigate(stat.route)}
          >
            <CardHeader className="pb-2">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-2`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
              <CardDescription className="font-medium">{stat.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Operaciones frecuentes del administrador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button 
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors border border-border"
              onClick={() => navigate('/users')}
            >
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium">Gestionar Usuarios</p>
                  <p className="text-sm text-muted-foreground">Administrar usuarios y roles</p>
                </div>
              </div>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-cyan-50 transition-colors border border-border"
              onClick={() => navigate('/students')}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="font-medium">Gestionar Estudiantes</p>
                  <p className="text-sm text-muted-foreground">Agregar, editar o eliminar estudiantes</p>
                </div>
              </div>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors border border-border"
              onClick={() => navigate('/vehicles')}
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Gestionar Vehículos</p>
                  <p className="text-sm text-muted-foreground">Administrar unidades de transporte</p>
                </div>
              </div>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border border-border"
              onClick={() => navigate('/routes')}
            >
              <div className="flex items-center gap-3">
                <Route className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Gestionar Rutas</p>
                  <p className="text-sm text-muted-foreground">Configurar rutas y horarios</p>
                </div>
              </div>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-yellow-50 transition-colors border border-border"
              onClick={() => navigate('/admin/news')}
            >
              <div className="flex items-center gap-3">
                <Newspaper className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Gestionar Noticias</p>
                  <p className="text-sm text-muted-foreground">Publicar noticias y actualizaciones</p>
                </div>
              </div>
            </button>
            <button 
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-50 transition-colors border border-border"
              onClick={() => navigate('/map')}
            >
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="font-medium">Ver Mapa en Vivo</p>
                  <p className="text-sm text-muted-foreground">Monitorear vehículos en tiempo real</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No hay actividad reciente</p>
              <p className="text-sm mt-1">Las acciones aparecerán aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
