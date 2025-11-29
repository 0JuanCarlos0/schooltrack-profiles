import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  vehicle_number: string;
  plate_number: string;
  capacity: number;
  status: string | null;
  driver_id: string | null;
}

interface Driver {
  id: string;
  full_name: string | null;
  email: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

const Vehicles = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const [formData, setFormData] = useState({
    vehicle_number: '',
    plate_number: '',
    capacity: '',
    driver_id: ''
  });

  useEffect(() => {
    loadVehicles();
    loadDrivers();
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    // Cargar usuarios con rol 'driver' o 'user'
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['driver', 'user']);

    if (roles) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      
      setAvailableUsers(profiles || []);
    }
  };

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast.error('Error al cargar vehículos: ' + error.message);
    } finally {
      setLoading(false);
    }
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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', driverIds);

        if (error) throw error;
        setDrivers(data || []);
      }
    } catch (error: any) {
      console.error('Error al cargar conductores:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      plate_number: '',
      capacity: '',
      driver_id: 'none'
    });
    setEditingVehicle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.vehicle_number.trim()) {
      toast.error('El número de vehículo es requerido');
      return;
    }
    if (!formData.plate_number.trim()) {
      toast.error('El número de placa es requerido');
      return;
    }
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      toast.error('La capacidad debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const vehicleData = {
        vehicle_number: formData.vehicle_number.trim(),
        plate_number: formData.plate_number.trim().toUpperCase(),
        capacity: parseInt(formData.capacity),
        driver_id: formData.driver_id === 'none' ? null : formData.driver_id,
        status: 'active'
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (error) throw error;
        toast.success('Vehículo actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([vehicleData]);

        if (error) throw error;
        toast.success('Vehículo creado exitosamente');
      }

      setIsDialogOpen(false);
      resetForm();
      loadVehicles();
      loadDrivers(); // Recargar conductores
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      plate_number: vehicle.plate_number,
      capacity: vehicle.capacity.toString(),
      driver_id: vehicle.driver_id || 'none'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, vehicleNumber: string) => {
    if (!confirm(`¿Estás seguro de eliminar el vehículo "${vehicleNumber}"? Esta acción también desasignará sus rutas.`)) return;

    setLoading(true);
    try {
      // Primero desasignar el vehículo de las rutas
      await supabase
        .from('routes')
        .update({ vehicle_id: null })
        .eq('vehicle_id', id);

      // Luego eliminar el vehículo
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vehículo eliminado exitosamente');
      loadVehicles();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Sin asignar';
    const driver = drivers.find(d => d.id === driverId);
    return driver?.full_name || driver?.email || 'Sin nombre';
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-cyan-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Vehículos</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vehículos Registrados</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Vehículo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Número de Vehículo *</Label>
                    <Input
                      id="vehicle_number"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plate_number">Placa *</Label>
                    <Input
                      id="plate_number"
                      value={formData.plate_number}
                      onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacidad *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver">Conductor Asignado</Label>
                    <Select
                      value={formData.driver_id}
                      onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar conductor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {userRole === 'admin' ? (
                          // Admin puede ver todos los usuarios disponibles
                          availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))
                        ) : (
                          // Otros solo ven conductores oficiales
                          drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.full_name || driver.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número o placa..."
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
                    <TableHead>Número</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No hay vehículos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                        <TableCell>{vehicle.plate_number}</TableCell>
                        <TableCell>{vehicle.capacity} pasajeros</TableCell>
                        <TableCell>{getDriverName(vehicle.driver_id)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            vehicle.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {vehicle.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(vehicle)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(vehicle.id, vehicle.vehicle_number)}
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

export default Vehicles;