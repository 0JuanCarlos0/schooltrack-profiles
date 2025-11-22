import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Clock, MapPin, User } from 'lucide-react';

const StudentDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Mi Dashboard</h2>
        <p className="text-gray-600 mt-2">Información sobre tu transporte escolar</p>
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
            <div className="text-center py-8 text-gray-500">
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
            <div className="text-center py-8 text-gray-500">
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
            <div className="text-center py-8 text-gray-500">
              <p>Sin punto de recogida</p>
              <p className="text-sm mt-1">Se configurará con la ruta</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-purple-500" />
            </div>
            <CardTitle>Mi Información</CardTitle>
            <CardDescription>Datos del estudiante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Estado:</span>
              <span className="font-medium">Activo</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Código:</span>
              <span className="font-medium">No asignado</span>
            </div>
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
              <p className="text-gray-700">
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
