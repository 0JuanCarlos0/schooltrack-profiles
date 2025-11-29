import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  grade: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  enrollment_date: string;
  status: string;
  user_id: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

const Students = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_code: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    grade: '',
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    status: 'active',
    user_id: 'none',
  });

  useEffect(() => {
    loadStudents();
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    // Cargar usuarios con rol 'student' o 'user'
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['student', 'user']);

    if (roles) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      
      setAvailableUsers(profiles || []);
    }
  };

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar estudiantes');
      return;
    }

    setStudents(data || []);
  };

  const resetForm = () => {
    setFormData({
      student_code: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      grade: '',
      phone: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      status: 'active',
      user_id: 'none',
    });
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.student_code.trim()) {
      toast.error('El código del estudiante es requerido');
      return;
    }
    if (!formData.first_name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!formData.last_name.trim()) {
      toast.error('El apellido es requerido');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        student_code: formData.student_code.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth || null,
        grade: formData.grade || null,
        phone: formData.phone || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        status: formData.status,
        user_id: formData.user_id === 'none' ? null : formData.user_id,
      };

      if (editingStudent) {
        // Actualizar estudiante
        const { error } = await supabase
          .from('students')
          .update(submitData)
          .eq('id', editingStudent.id);

        if (error) throw error;
        toast.success('Estudiante actualizado correctamente');
      } else {
        // Crear estudiante
        const { error } = await supabase
          .from('students')
          .insert([submitData]);

        if (error) throw error;
        toast.success('Estudiante creado correctamente');
      }

      setDialogOpen(false);
      resetForm();
      loadStudents();
      loadAvailableUsers(); // Recargar usuarios disponibles
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      student_code: student.student_code,
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: student.date_of_birth || '',
      grade: student.grade || '',
      phone: student.phone || '',
      address: student.address || '',
      emergency_contact: student.emergency_contact || '',
      emergency_phone: student.emergency_phone || '',
      status: student.status,
      user_id: student.user_id || 'none',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al estudiante "${studentName}"? Esta acción también eliminará sus asignaciones de rutas.`)) return;

    setLoading(true);
    try {
      // Primero eliminar las asignaciones de rutas
      await supabase
        .from('student_routes')
        .delete()
        .eq('student_id', id);

      // Luego eliminar el estudiante
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Estudiante eliminado correctamente');
      loadStudents();
    } catch (error: any) {
      toast.error('Error al eliminar estudiante: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.student_code}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestión de Estudiantes</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Estudiante
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
                    </DialogTitle>
                    <DialogDescription>
                      Completa la información del estudiante
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="student_code">Código de Estudiante *</Label>
                        <Input
                          id="student_code"
                          value={formData.student_code}
                          onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                          required
                          disabled={!!editingStudent}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                            <SelectItem value="graduated">Graduado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Nombre *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Apellido *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grade">Grado</Label>
                        <Input
                          id="grade"
                          value={formData.grade}
                          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                          placeholder="Ej: 5to Grado"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_phone">Teléfono de Emergencia</Label>
                        <Input
                          id="emergency_phone"
                          type="tel"
                          value={formData.emergency_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                        />
                      </div>
                      {userRole === 'admin' && (
                        <div className="space-y-2">
                          <Label htmlFor="user_id">Usuario Asociado</Label>
                          <Select
                            value={formData.user_id}
                            onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sin usuario" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin usuario</SelectItem>
                              {availableUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name || user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : editingStudent ? 'Actualizar' : 'Crear'}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o código..."
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
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No se encontraron estudiantes
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_code}</TableCell>
                        <TableCell>
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.grade || '-'}</TableCell>
                        <TableCell>{student.phone || '-'}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              student.status === 'active'
                                ? 'bg-secondary/10 text-secondary'
                                : student.status === 'inactive'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-accent/10 text-accent'
                            }`}
                          >
                            {student.status === 'active' ? 'Activo' : student.status === 'inactive' ? 'Inactivo' : 'Graduado'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(student)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(student.id, `${student.first_name} ${student.last_name}`)}
                            >
                              <Trash2 className="w-4 h-4" />
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

export default Students;
