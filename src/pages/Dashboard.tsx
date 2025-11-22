import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import DriverDashboard from '@/components/dashboard/DriverDashboard';

const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'driver':
        return <DriverDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rol no asignado</h2>
            <p className="text-gray-600 mb-6">
              No tienes un rol asignado en el sistema. Contacta al administrador.
            </p>
          </div>
        );
    }
  };

  const getRoleLabel = () => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      student: 'Estudiante',
      parent: 'Padre/Madre',
      driver: 'Conductor'
    };
    return roles[userRole || ''] || 'Sin rol';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">ST</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SchoolTrack UTSJR</h1>
              <p className="text-xs text-gray-600">Sistema de Transporte Escolar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-600">{getRoleLabel()}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/profile')}>
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
