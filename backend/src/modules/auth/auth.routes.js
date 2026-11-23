// PLANTILLA -- copiado tal cual, va en backend/src/modules/auth/auth.routes.js,
// montado en /auth (ver routes/index.js).
const express = require('express');
const validate = require('../../middlewares/validate');
const { requireAuth } = require('../../middlewares/auth');
const controller = require('./auth.controller');
const { loginSchema, cambiarPasswordSchema } = require('./auth.schema');

const portalAuth = require('../../utils/portalAuth');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/ApiResponse');

const router = express.Router();

// Con PORTAL_AUTH=required el login propio de la app (y su contraseña, que ya no tiene sentido) se apaga: seguiria siendo una puerta
// paralela al portal.
const loginPropioActivo = (req, res, next) =>
  portalAuth.modo() === 'required' ? next(new ApiError(410, 'El inicio de sesión de Cartera ahora se hace en el portal')) : next();

// Modo de acceso (off | optional | required): el frontend decide si muestra su login o manda al del portal. Publico a proposito.
router.get('/modo', (req, res) => ok(res, { modo: portalAuth.modo() }));

router.post('/login', loginPropioActivo, validate(loginSchema, 'body'), controller.login);
router.post('/logout', controller.logout);
router.post('/refresh', loginPropioActivo, controller.refresh);
router.post('/cambiar-password', loginPropioActivo, requireAuth, validate(cambiarPasswordSchema, 'body'), controller.cambiarPassword);

module.exports = router;
