// PLANTILLA -- copiado tal cual, va en frontend/src/api/auth.js. Requiere que
// api/client.js tenga `withCredentials: true` en el axios.create() -- si no, las
// cookies de sesion no viajan en los requests.
import client from './client';

export function login(email, password) {
  return client.post('/auth/login', { username: email, password });
}

export function logout() {
  return client.post('/auth/logout');
}

// Modo de acceso del servidor (off | optional | required): si Cartera usa su login propio o la sesion del portal.
export function getModo() {
  return client.get('/auth/modo');
}

// Cierra la sesion del portal (ruta absoluta del gateway: el portal vive en el mismo dominio, fuera del prefijo de esta app).
export function logoutPortal() {
  return fetch('/portal/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export function cambiarPassword(nuevaPassword) {
  return client.post('/auth/cambiar-password', { nueva_password: nuevaPassword });
}

export function getMe() {
  return client.get('/usuarios/me');
}
