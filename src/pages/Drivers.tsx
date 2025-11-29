import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Driver {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  vehicle_id: string | null;
  vehicle_number: string | null;
}

interface Vehicle {
  id: string;
  vehicle_number: string;
  plate_number: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

const Drivers = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    vehicle_id: 'none'
  });
  

  useEffect(() => {
    loadDrivers();
    loadVehicles();
    loadAvailableUsers();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, plate_number')
        .order('vehicle_number');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      console.error('Error al cargar vehículos:', error);
    }
  };

  const loadAvailableUsers = async () => {
    // Cargar usuarios sin rol de conductor
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name');

    const { data: driverRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'driver');

    const driverIds = driverRoles?.map(r => r.user_id) || [];
    const available = allProfiles?.filter(p => !driverIds.includes(p.id)) || [];
    
    setAvailableUsers(available);
  };

  const loadDrivers = async () => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');

      if (roleError) throw roleError;

      const driverIds = roleData?.map(r => r.user_id) || [];
      
      if (driverIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('id', driverIds);

        if (profilesError) throw profilesError;

        // Obtener vehículos asignados
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, vehicle_number, driver_id')
          .in('driver_id', driverIds);

        if (vehiclesError) throw vehiclesError;

        // Combinar datos
        const driversWithVehicles = profiles?.map(profile => {
          const vehicle = vehiclesData?.find(v => v.driver_id === profile.id);
          return {
            ...profile,
            vehicle_id: vehicle?.id || null,
            vehicle_number: vehicle?.vehicle_number || null
          };
        }) || [];

        setDrivers(driversWithVehicles);
      } else {
        setDrivers([]);
      }
    } catch (error: any) {
      toast.error('Error al cargar conductores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      full_name: '',
      vehicle_id: 'none'
    });
    setEditingDriver(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.full_name.trim()) {
      toast.error('El nombre completo es requerido');
      return;
    }

    setLoading(true);

    try {
      if (editingDriver) {
        // Actualizar conductor
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            full_name: formData.full_name.trim(),
            role: 'driver'
          })
          .eq('id', editingDriver.id);

        if (profileError) throw profileError;

        // Actualizar vehículo asignado
        // Primero desasignar vehículo anterior si existe
        if (editingDriver.vehicle_id) {
          await supabase
            .from('vehicles')
            .update({ driver_id: null })
            .eq('id', editingDriver.vehicle_id);
        }

        // Asignar nuevo vehículo si se seleccionó uno
        if (formData.vehicle_id !== 'none') {
          const { error: vehicleError } = await supabase
            .from('vehicles')
            .update({ driver_id: editingDriver.id })
            .eq('id', formData.vehicle_id);

          if (vehicleError) throw vehicleError;
        }

        toast.success('Conductor actualizado exitosamente');
      } else {
        // Crear nuevo conductor
        if (!formData.user_id) {
          toast.error('Selecciona un usuario');
          return;
        }

        // Agregar rol de conductor
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: formData.user_id, role: 'driver' });

        if (roleError) throw roleError;

        // Actualizar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            full_name: formData.full_name.trim() || null,
            role: 'driver'
          })
          .eq('id', formData.user_id);

        if (profileError) throw profileError;

        // Asignar vehículo si se seleccionó uno
        if (formData.vehicle_id !== 'none') {
          const { error: vehicleError } = await supabase
            .from('vehicles')
            .update({ driver_id: formData.user_id })
            .eq('id', formData.vehicle_id);

          if (vehicleError) throw vehicleError;
        }

        toast.success('Conductor creado exitosamente');
      }

      setIsDialogOpen(false);
      resetForm();
      loadDrivers();
      loadVehicles();
      loadAvailableUsers();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      user_id: driver.id,
      full_name: driver.full_name || '',
      vehicle_id: driver.vehicle_id || 'none'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, driverName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al conductor "${driverName}"? Se desasignará de cualquier vehículo.`)) return;

    setLoading(true);
    try {
      // Primero desasignar de vehículos
      await supabase
        .from('vehicles')
        .update({ driver_id: null })
        .eq('driver_id', id);

      // Luego eliminar el rol
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id)
        .eq('role', 'driver');

      if (roleError) throw roleError;

      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: null })
        .eq('id', id);

      if (profileError) throw profileError;

      toast.success('Conductor eliminado exitosamente');
      loadDrivers();
      loadVehicles();
      loadAvailableUsers();
    } catch (error: any) {
      toast.error('Error al eliminar conductor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    (driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Conductores</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conductores Registrados</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Conductor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingDriver && (
                      <div>
                        <Label htmlFor="user_id">Usuario</Label>
                        <select
                          id="user_id"
                          value={formData.user_id}
                          onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                          className="w-full border rounded-md p-2"
                          required
                        >
                          <option value="">Seleccionar usuario</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.email} - {user.full_name || 'Sin nombre'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="full_name">Nombre Completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nombre del conductor"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_id">Vehículo Asignado</Label>
                      <select
                        id="vehicle_id"
                        value={formData.vehicle_id}
                        onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="none">Sin vehículo asignado</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicle_number} - {vehicle.plate_number}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay conductores registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">
                          {driver.full_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell>{driver.email}</TableCell>
                        <TableCell>
                          {driver.vehicle_number ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                              {driver.vehicle_number}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Activo
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(driver)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(driver.id, driver.full_name || driver.email)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Drivers;