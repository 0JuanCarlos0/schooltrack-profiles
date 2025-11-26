import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, Clock, MapPin, User, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Mi Dashboard</h2>
        <p className="text-muted-foreground mt-2">Información sobre tu transporte escolar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mb-2">
              <Bus className="w-6 h-6 text-cyan-500" />
            </div>
            <CardTitle>Mi Ruta Asignada</CardTitle>
            <CardDescription>Información de tu ruta de transporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes una ruta asignada</p>
              <p className="text-sm mt-1">Contacta al administrador</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle>Horario de Recogida</CardTitle>
            <CardDescription>Hora estimada de llegada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay horario configurado</p>
              <p className="text-sm mt-1">Espera la asignación de ruta</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Punto de Recogida</CardTitle>
            <CardDescription>Tu parada asignada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Sin punto de recogida</p>
              <p className="text-sm mt-1">Se configurará con la ruta</p>
            </div>
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
      </div>

      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Bus className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Bienvenido al Sistema de Transporte</h3>
              <p className="text-muted-foreground">
                Aquí podrás consultar información sobre tu ruta de transporte, horarios y ubicación en tiempo real del vehículo. 
                Si necesitas ayuda o tienes alguna duda, contacta al administrador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
