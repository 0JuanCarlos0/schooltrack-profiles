import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const newsItems = [
    {
      title: "Bienvenidos a SchoolTrack UTSJR",
      date: "11 de noviembre de 2025",
      description: "Sistema de seguimiento en tiempo real para transporte escolar de UTSJR"
    },
    {
      title: "Seguridad en el Transporte Escolar",
      date: "11 de noviembre de 2025",
      description: "Conoce las medidas de seguridad implementadas en el transporte"
    },
    {
      title: "Nuevas Rutas Disponibles",
      date: "11 de noviembre de 2025",
      description: "Más opciones de transporte para la comunidad estudiantil"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">ST</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SchoolTrack</h1>
              <p className="text-xs text-gray-600">UTSJR</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate('/auth?mode=signup')}>
              Crear Cuenta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-cyan-500 leading-tight">
            Seguimiento de Transporte Escolar en Tiempo Real
          </h1>
          <p className="text-xl text-gray-600 mb-4 font-medium">
            Universidad Tecnológica de San Juan del Río
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Monitorea la ubicación de las unidades de transporte en tiempo real, recibe notificaciones y mantente informado sobre las rutas de los estudiantes.
          </p>
          <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth?mode=signup')}>
            Comenzar Ahora →
          </Button>
        </div>

        {/* News Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Noticias y Actualizaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {item.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
