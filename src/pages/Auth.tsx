import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignupMode = searchParams.get('mode') === 'signup';

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName);
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">ST</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SchoolTrack UTSJR</h1>
          <p className="text-gray-600">Sistema de seguimiento de transporte escolar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignupMode ? 'Crear Cuenta' : 'Iniciar Sesión'}</CardTitle>
            <CardDescription>
              {isSignupMode 
                ? 'Completa el formulario para registrarte' 
                : 'Ingresa tus credenciales para acceder'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isSignupMode ? handleSignup : handleLogin} className="space-y-4">
              {isSignupMode && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignupMode ? "Mínimo 6 caracteres" : ""}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isSignupMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? (isSignupMode ? 'Creando cuenta...' : 'Iniciando sesión...') 
                  : (isSignupMode ? 'Crear Cuenta' : 'Iniciar Sesión')
                }
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button 
                className="text-sm text-cyan-500 hover:underline"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setFullName('');
                  navigate(isSignupMode ? '/auth' : '/auth?mode=signup');
                }}
              >
                {isSignupMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>

            {!isSignupMode && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Usuario Admin por defecto:</p>
                <p className="text-xs text-gray-600">Correo: admin@schooltrack.com</p>
                <p className="text-xs text-gray-600">Contraseña: admin123</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
