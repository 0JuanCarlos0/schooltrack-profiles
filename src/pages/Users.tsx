import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Edit, Loader2, Trash2 } from 'lucide-react';

type UserRole = 'admin' | 'student' | 'parent' | 'driver' | 'user';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole | null;
  created_at: string;
}

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [entityFormData, setEntityFormData] = useState<any>({});

  // Form states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data - Mostrar TODOS los usuarios
      const usersWithRoles: UserWithRole[] = profiles
        .map(profile => {
          const userRole = roles.find(r => r.user_id === profile.id);
          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: userRole?.role || null,
            created_at: profile.created_at || '',
          };
        });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Error al cargar usuarios', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setCreatingUser(true);

    try {
      // Informar al admin que no podemos crear usuarios directamente
      // sin perder su sesión
      toast.info('Los usuarios deben registrarse desde /auth?mode=signup');
      toast.info('Una vez registrados, podrás asignarles roles aquí');
      
      setCreateDialogOpen(false);
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('user');
    } catch (error: any) {
      toast.error('Error', {
        description: error.message,
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    // Si el rol es student, driver o parent, mostrar formulario de entidad
    if (editRole === 'student' || editRole === 'driver' || editRole === 'parent') {
      setShowEntityForm(true);
      return;
    }

    // Para admin y user, solo actualizar el rol
    await updateUserRole();
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;

    setUpdatingRole(true);

    try {
      if (selectedUser.role) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: editRole })
          .eq('user_id', selectedUser.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.id,
            role: editRole,
          });

        if (error) throw error;
      }

      toast.success('Rol actualizado exitosamente');
      setEditDialogOpen(false);
      setShowEntityForm(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error('Error al actualizar rol', {
        description: error.message,
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleEntityFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingRole(true);

    try {
      // Primero actualizar el rol
      if (selectedUser) {
        if (selectedUser.role) {
          const { error } = await supabase
            .from('user_roles')
            .update({ role: editRole })
            .eq('user_id', selectedUser.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_roles')
            .insert({
              user_id: selectedUser.id,
              role: editRole,
            });
          if (error) throw error;
        }

        // Luego crear el registro de la entidad correspondiente
        if (editRole === 'student') {
          const { error } = await supabase
            .from('students')
            .insert({
              student_code: entityFormData.student_code,
              first_name: entityFormData.first_name,
              last_name: entityFormData.last_name,
              grade: entityFormData.grade || null,
              phone: entityFormData.phone || null,
              address: entityFormData.address || null,
              emergency_contact: entityFormData.emergency_contact || null,
              emergency_phone: entityFormData.emergency_phone || null,
              user_id: selectedUser.id,
              status: 'active'
            });
          if (error) throw error;
          toast.success('Estudiante creado y rol asignado exitosamente');
        } else if (editRole === 'driver' || editRole === 'parent') {
          // Para driver y parent, solo actualizamos el rol
          // Los datos adicionales se manejan desde sus respectivas pantallas
          toast.success(`Rol de ${editRole === 'driver' ? 'conductor' : 'padre'} asignado exitosamente`);
        }

        setEditDialogOpen(false);
        setShowEntityForm(false);
        setEntityFormData({});
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error('Error al actualizar', {
        description: error.message,
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}? Esta acción eliminará todos sus datos relacionados.`)) {
      return;
    }

    try {
      // Primero eliminar registros relacionados
      
      // Eliminar de students si existe
      await supabase
        .from('students')
        .delete()
        .eq('user_id', userId);

      // Eliminar location_tracking
      await supabase
        .from('location_tracking')
        .delete()
        .eq('user_id', userId);

      // Eliminar de vehicles como conductor
      await supabase
        .from('vehicles')
        .update({ driver_id: null })
        .eq('driver_id', userId);

      // Eliminar user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Eliminar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Finalmente eliminar el usuario de auth
      // Nota: Esto requeriría llamar a un edge function con permisos de admin
      // Por ahora solo eliminamos el perfil y el rol
      
      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error: any) {
      toast.error('Error al eliminar usuario', {
        description: error.message,
      });
    }
  };

  const getRoleBadge = (role: UserRole | null) => {
    const variants: Record<UserRole, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      admin: { label: 'Administrador', variant: 'destructive' },
      driver: { label: 'Conductor', variant: 'default' },
      parent: { label: 'Padre', variant: 'secondary' },
      student: { label: 'Estudiante', variant: 'outline' },
      user: { label: 'Usuario', variant: 'secondary' },
    };

    if (!role) return <Badge variant="outline">Sin rol</Badge>;
    
    const { label, variant } = variants[role];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(user => 
        filterRole === 'sin-rol' 
          ? !user.role 
          : user.role === filterRole
      );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra todos los usuarios del sistema y sus roles.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => navigate('/auth?mode=signup')} variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Ir a Registro
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <UserPlus className="mr-2 h-4 w-4" />
                Usuarios de Prueba
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Crear Usuarios de Prueba</DialogTitle>
                <DialogDescription>
                  Registra estos usuarios para pruebas (usa una ventana privada para mantener tu sesión de admin)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium text-sm">Conductores (3):</p>
                  <div className="space-y-1 text-sm font-mono">
                    <p>• conductor1@schooltrack.com / pass123</p>
                    <p>• conductor2@schooltrack.com / pass123</p>
                    <p>• conductor3@schooltrack.com / pass123</p>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium text-sm">Usuarios Generales (7):</p>
                  <div className="space-y-1 text-sm font-mono">
                    <p>• usuario1@schooltrack.com / pass123</p>
                    <p>• usuario2@schooltrack.com / pass123</p>
                    <p>• usuario3@schooltrack.com / pass123</p>
                    <p>• usuario4@schooltrack.com / pass123</p>
                    <p>• usuario5@schooltrack.com / pass123</p>
                    <p>• usuario6@schooltrack.com / pass123</p>
                    <p>• usuario7@schooltrack.com / pass123</p>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Importante:</strong> Abre una ventana privada para registrar estos usuarios y no perder tu sesión de admin.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => window.open('/auth?mode=signup', '_blank')}>
                  Abrir Registro en Nueva Pestaña
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuarios del Sistema</CardTitle>
                <CardDescription>
                  {users.length} usuario{users.length !== 1 ? 's' : ''} sin rol específico. Una vez asignado un rol (estudiante, padre, conductor), el usuario se eliminará de esta lista.
                </CardDescription>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Asignar Conductores Rápido
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignación Rápida de Conductores</DialogTitle>
                    <DialogDescription>
                      Esto asignará rol de conductor a los primeros 3 usuarios y los vinculará a BUS-001, BUS-002, BUS-003
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {users.slice(0, 3).length > 0 ? (
                      <>
                        <p className="text-sm">Se asignarán estos usuarios como conductores:</p>
                        <div className="space-y-2">
                          {users.slice(0, 3).map((user, idx) => (
                            <div key={user.id} className="p-3 bg-muted rounded-lg">
                              <p className="font-medium">{user.full_name || user.email}</p>
                              <p className="text-sm text-muted-foreground">
                                → BUS-00{idx + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No hay usuarios disponibles. Registra al menos 3 usuarios primero.
                      </p>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      disabled={users.length < 3}
                      onClick={async () => {
                        try {
                          const conductores = users.slice(0, 3);
                          
                          for (let i = 0; i < conductores.length; i++) {
                            const user = conductores[i];
                            
                            // Asignar rol
                            await supabase
                              .from('user_roles')
                              .insert({ user_id: user.id, role: 'driver' });
                            
                            // Asignar a vehículo
                            await supabase
                              .from('vehicles')
                              .update({ driver_id: user.id })
                              .eq('vehicle_number', `BUS-00${i + 1}`);
                          }
                          
                          toast.success('Conductores asignados exitosamente');
                          fetchUsers();
                        } catch (error: any) {
                          toast.error('Error al asignar conductores', {
                            description: error.message
                          });
                        }
                      }}
                    >
                      Asignar Ahora
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="filterRole">Filtrar por rol</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger id="filterRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="sin-rol">Sin rol asignado</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="driver">Conductores</SelectItem>
                  <SelectItem value="student">Estudiantes</SelectItem>
                  <SelectItem value="parent">Padres</SelectItem>
                  <SelectItem value="user">Usuarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay usuarios con el filtro seleccionado
                </div>
              ) : (
                filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {user.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setEditRole(user.role || 'user');
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Cambiar Rol
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setShowEntityForm(false);
          setEntityFormData({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {!showEntityForm ? (
            <form onSubmit={handleUpdateRole}>
              <DialogHeader>
                <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
                <DialogDescription>
                  Modificar el rol de {selectedUser?.full_name || selectedUser?.email}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editRole">Nuevo Rol</Label>
                  <Select value={editRole} onValueChange={(value) => setEditRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="student">Estudiante</SelectItem>
                      <SelectItem value="parent">Padre</SelectItem>
                      <SelectItem value="driver">Conductor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {(editRole === 'student' || editRole === 'driver' || editRole === 'parent') && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Se solicitarán datos adicionales para crear el registro de {editRole === 'student' ? 'estudiante' : editRole === 'driver' ? 'conductor' : 'padre'}
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updatingRole}>
                  {updatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continuar
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleEntityFormSubmit}>
              <DialogHeader>
                <DialogTitle>
                  Datos de {editRole === 'student' ? 'Estudiante' : editRole === 'driver' ? 'Conductor' : 'Padre'}
                </DialogTitle>
                <DialogDescription>
                  Completa la información para {selectedUser?.full_name || selectedUser?.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {editRole === 'student' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="student_code">Código de Estudiante *</Label>
                        <Input
                          id="student_code"
                          value={entityFormData.student_code || ''}
                          onChange={(e) => setEntityFormData({ ...entityFormData, student_code: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grade">Grado</Label>
                        <Input
                          id="grade"
                          value={entityFormData.grade || ''}
                          onChange={(e) => setEntityFormData({ ...entityFormData, grade: e.target.value })}
                          placeholder="Ej: 5to Grado"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Nombre *</Label>
                        <Input
                          id="first_name"
                          value={entityFormData.first_name || ''}
                          onChange={(e) => setEntityFormData({ ...entityFormData, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Apellido *</Label>
                        <Input
                          id="last_name"
                          value={entityFormData.last_name || ''}
                          onChange={(e) => setEntityFormData({ ...entityFormData, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={entityFormData.phone || ''}
                        onChange={(e) => setEntityFormData({ ...entityFormData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={entityFormData.address || ''}
                        onChange={(e) => setEntityFormData({ ...entityFormData, address: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact">Contacto de Emergencia</Label>
                        <Input
                          id="emergency_contact"
                          value={entityFormData.emergency_contact || ''}
                          onChange={(e) => setEntityFormData({ ...entityFormData, emergency_contact: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_phone">Teléfono de Emergencia</Label>
                        <Input
                          id="emergency_phone"
                          type="tel"
                          value={entityFormData.emergency_phone || ''}
                          onChange={(e) => setEntityFormData({ ...entityFormData, emergency_phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {(editRole === 'driver' || editRole === 'parent') && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Los datos de {editRole === 'driver' ? 'conductor' : 'padre'} se completarán desde su perfil</p>
                    <p className="text-sm mt-2">El usuario podrá editar su información en /profile</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEntityForm(false)}>
                  Atrás
                </Button>
                <Button type="submit" disabled={updatingRole}>
                  {updatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar y Asignar Rol
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
