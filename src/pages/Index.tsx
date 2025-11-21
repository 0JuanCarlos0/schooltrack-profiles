import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, Shield, BookOpen } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">SchoolTrack</h1>
          </div>
          <Button onClick={() => navigate('/auth')}>
            Iniciar Sesión
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6">
            <GraduationCap className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bienvenido a SchoolTrack
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sistema completo de gestión escolar con autenticación segura y gestión de perfiles
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Comenzar Ahora
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Crear Cuenta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestión de Estudiantes</h3>
            <p className="text-muted-foreground">
              Administra estudiantes, actualiza información y mantén registros organizados
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Perfiles con Fotos</h3>
            <p className="text-muted-foreground">
              Sube, cambia y elimina fotos de perfil con almacenamiento seguro en servidor
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">CRUD Completo</h3>
            <p className="text-muted-foreground">
              Crea, lee, actualiza y elimina registros con interfaz intuitiva
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
