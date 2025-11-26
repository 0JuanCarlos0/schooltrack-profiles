import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Navigation, Clock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Bienvenido</h2>
        <p className="text-muted-foreground mt-2">Tu cuenta está pendiente de asignación de rol</p>
      </div>

      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Cuenta Pendiente</h3>
              <p className="text-muted-foreground">
                Tu cuenta ha sido creada exitosamente. Un administrador te asignará un rol 
                (Estudiante, Padre o Conductor) pronto. Mientras tanto, puedes acceder al 
                rastreo de ubicación.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>Gestiona tu información personal</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/profile')}
            >
              <User className="w-4 h-4 mr-2" />
              Ver Perfil
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
          onClick={() => navigate('/location')}
        >
          <CardHeader>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
              <Navigation className="w-6 h-6 text-orange-500" />
            </div>
            <CardTitle>Rastreo de Ubicación</CardTitle>
            <CardDescription>Comparte tu ubicación en tiempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Navigation className="w-4 h-4 mr-2" />
              Ir a Rastreo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-gray-500" />
            </div>
            <CardTitle>Estado de Cuenta</CardTitle>
            <CardDescription>Información sobre tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium text-sm">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Rol:</span>
              <span className="font-medium text-amber-600">Pendiente</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Estado:</span>
              <span className="font-medium text-green-600">Activo</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
