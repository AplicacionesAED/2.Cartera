// Sesión: el usuario SOLO se borra cuando el servidor dice de verdad que no hay
// sesión (401 al leer el perfil, o refresh rechazado). Cualquier otro fallo
// (red caída, 502/503, timeout, 500) conserva al usuario que ya estaba: antes un
// solo error al pedir el perfil lo mandaba al login.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import { setModoPortal, setSessionExpiredHandler } from '../api/client';

const AuthContext = createContext(null);
const REINTENTO_MS = 5000;

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  // true = no se pudo leer el perfil por un fallo de conexión/servidor (no por
  // falta de sesión): la UI muestra "reintentar" en vez de mandar al login.
  const [errorConexion, setErrorConexion] = useState(false);
  // Modo de acceso del servidor (off | optional | required) y, si el portal acepta a la persona pero Cartera no, el motivo (403).
  const [modo, setModo] = useState('off');
  const [bloqueo, setBloqueo] = useState(null);

  const cargarPerfil = useCallback(() => {
    return authApi
      .getMe()
      .then((res) => {
        setUsuario(res.data);
        setBloqueo(null);
        setErrorConexion(false);
      })
      .catch((err) => {
        if (err.status === 401) {
          setUsuario(null);
          setBloqueo(null);
          setErrorConexion(false);
        } else if (err.status === 403) {
          // Sesion del portal valida, pero sin acceso a Cartera o sin usuario en Cartera: se explica en vez de mandar al login.
          setUsuario(null);
          setBloqueo(err.message);
          setErrorConexion(false);
        } else {
          setErrorConexion(true);
        }
      });
  }, []);

  // Primero el modo (decide como se renueva la sesion), luego el perfil. Un servidor sin /auth/modo (version anterior) cuenta como `off`.
  useEffect(() => {
    authApi
      .getModo()
      .then((res) => res.data?.modo ?? 'off')
      .catch(() => 'off')
      .then((m) => {
        setModoPortal(m);
        setModo(m);
        return cargarPerfil();
      })
      .finally(() => setCargando(false));
  }, [cargarPerfil]);

  // Reintenta solo mientras haya un error de conexión.
  useEffect(() => {
    if (!errorConexion) return undefined;
    const id = setInterval(cargarPerfil, REINTENTO_MS);
    return () => clearInterval(id);
  }, [errorConexion, cargarPerfil]);

  useEffect(() => {
    setSessionExpiredHandler(() => setUsuario(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  async function login(email, password) {
    const res = await authApi.login(email, password);
    await cargarPerfil();
    return res.data;
  }

  async function logout() {
    // Con el portal activo tambien se cierra la sesion del portal (cierra la de TODAS las apps); si falla no debe impedir salir.
    if (modo !== 'off') await authApi.logoutPortal().catch(() => {});
    try {
      await authApi.logout();
    } catch {
      // Aunque el servidor no responda, el usuario pidió salir.
    }
    setBloqueo(null);
    // Con el portal activo y detras del gateway la pantalla se abandona navegando al login del portal (UserMenu): borrar `usuario` aqui
    // haria que ProtectedRoute redirigiera antes y con `next`, y la persona volveria a esta app en lugar de a la landing.
    if (modo === 'off' || import.meta.env.BASE_URL === '/') setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, errorConexion, modo, bloqueo, login, logout, refrescarPerfil: cargarPerfil }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
