const express = require('express');
const router = express.Router();
const UsuariosHistorialControllers = require('../controllers/UsuariosHistorialControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

/**
 * @description Rutas para la gestión del historial de usuarios inactivos
 * @route /api/historial-usuarios
 * @access Protegido (Solo admin)
 * Estas rutas permiten:
 * - Ejecutar el proceso de limpieza del historial de usuarios inactivos.
 * Asegúrate de tener el controlador implementado en UserHist_Controller.js
 * y los middlewares de autenticación y autorización configurados correctamente.
 */

// --- TODAS LAS RUTAS REQUIEREN TOKEN ---
// A partir de aquí, todas las rutas requieren que el usuario esté autenticado
router.use(protect);
// --- SEGURIDAD NIVEL ADMIN ---
// Solo un Administrador debería poder disparar el proceso de limpieza de historial.
router.use(protect);
router.use(restrictTo('admin', 'Administrador'));

/**
 * @route POST /api/historial-usuarios/establecer-fechas-inactividad
 * @desc Establece fechas de inactividad a usuarios que no la tienen.
 * Esto prepara a los usuarios para el proceso de archivado.
 */
router.post('/establecer-fechas-inactividad', UsuariosHistorialControllers.establecerFechasInactividad);

/**
 * @route POST /api/historial-usuarios/ejecutar-limpieza
 * @desc Mueve usuarios inactivos > 1 año a la colección de historial.
 * Se usa POST porque es una acción que transforma la base de datos.
 */
router.post('/ejecutar-limpieza', UsuariosHistorialControllers.ejecutarLimpiezaHistorial);

/**
 * @route GET /api/historial-usuarios/
 * @desc Obtiene todo el historial de usuarios archivados.
 */
router.get('/', UsuariosHistorialControllers.getHistorialCompleto);

/**
 * @route GET /api/historial-usuarios/usuario/:cedula
 * @desc Busca un usuario específico en el historial por cédula.
 */
router.get('/usuario/:cedula', UsuariosHistorialControllers.getUsuarioHistorial);

/**
 * @route DELETE /api/historial-usuarios/limpiar-antiguo
 * @desc Elimina registros del historial más antiguos que los años especificados.
 * Query: ?años=5 (por defecto 5 años)
 */
router.delete('/limpiar-antiguo', UsuariosHistorialControllers.limpiarHistorialAntiguo);

/**
 * @route GET /api/historial-usuarios/estadisticas
 * @desc Obtiene estadísticas del historial de usuarios.
 */
router.get('/estadisticas', UsuariosHistorialControllers.getEstadisticasHistorial);

module.exports = router;