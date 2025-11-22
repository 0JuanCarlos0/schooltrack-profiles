import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bus, Bell, MapPin } from 'lucide-react';

const ParentDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Panel de Padres</h2>
        <p className="text-gray-600 mt-2">Monitorea el transporte de tus hijos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-cyan-500" />
            </div>
            <CardTitle>Mis Hijos</CardTitle>
            <CardDescription>Estudiantes bajo tu responsabilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No hay estudiantes vinculados</p>
              <p className="text-sm mt-1">Contacta al administrador para vincular estudiantes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Bus className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle>Rutas Asignadas</CardTitle>
            <CardDescription>Transporte de tus hijos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Sin rutas asignadas</p>
              <p className="text-sm mt-1">Las rutas aparecerán aquí</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Ubicación en Tiempo Real</CardTitle>
            <CardDescription>Rastrea el transporte de tus hijos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Rastreo no disponible</p>
              <p className="text-sm mt-1">Requiere asignación de ruta</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <Bell className="w-6 h-6 text-purple-500" />
            </div>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Alertas y actualizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No hay notificaciones</p>
              <p className="text-sm mt-1">Las alertas aparecerán aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Panel de Padres de Familia</h3>
              <p className="text-gray-700">
                Desde aquí podrás monitorear en tiempo real el transporte de tus hijos, recibir notificaciones importantes
                y consultar información sobre rutas y horarios. Para vincular estudiantes a tu cuenta, contacta al administrador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;
