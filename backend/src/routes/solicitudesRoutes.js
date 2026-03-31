const express = require('express');
const router = express.Router();
const solicitudesControllers = require('../controllers/solicitudesControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

/**
 * @description Rutas para la gestión de solicitudes de préstamo
 * @route /api/solicitudes
 * @access Protegido (Cualquier usuario logueado), solo admin para gestión
 * Estas rutas permiten:
 * - Crear solicitudes de préstamo (para estudiantes y docentes)
 * - Visualizar solicitudes (estudiantes ven las suyas, admin ve todas)
 * - Cancelar solicitudes (estudiantes pueden cancelar las suyas si están pendientes)
 * - Aprobar/Rechazar solicitudes (solo para admin/administrativo)
 * - Marcar como entregado/devolución (solo para admin/administrativo)
 * 
 * Asegúrate de tener los controladores implementados en solicitudController.js
 * y los middlewares de autenticación y autorización configurados correctamente.
 */
// --- TODAS LAS RUTAS REQUIEREN LOGIN ---
router.use(protect);

// 1. Creación de Solicitudes (Estudiantes, Docentes, Admin)
// Nota: Tu controlador extrae el ID del usuario del token por seguridad.
router.post('/', solicitudesControllers.createSolicitud);

// 2. Visualización de Solicitudes
// El controlador ya filtra: si es Estudiante solo ve las suyas, si es Admin ve todas.
router.get('/', solicitudesControllers.getSolicitudes);
router.get('/:id', solicitudesControllers.getSolicitudById);

// 2.1. Visualización para Estudiantes (solo sus solicitudes)
// Esta ruta permite a los estudiantes ver cualquier solicitud que les pertenezca
router.get('/estudiante/:id',
    restrictTo('estudiante', 'docente'),
    solicitudesControllers.getSolicitudByIdForStudent
);

// 3. Gestión del Estudiante (Cancelar su propia boleta)
// REGLA DE ORO: Solo si el estado es 'pendiente' y es el dueño.
router.delete('/:id', solicitudesControllers.deleteSolicitud);

// 4. Gestión Administrativa (Solo Admin / Administrativo)
// Estas rutas son para aprobar, rechazar o marcar devoluciones.

// Para aprobaciones/rechazos iniciales y disparar el motor de inventario
router.put('/admin-gestion/:id',
    restrictTo('admin', 'Administrador', 'administrativo'),
    solicitudesControllers.gestionarEstadoAdmin
);

// Para cambios de estado generales (ej. marcar como 'entregado' cuando retiran el equipo)
router.patch('/:id/estado',
    restrictTo('admin', 'Administrador', 'administrativo'),
    solicitudesControllers.gestionarEstadoAdmin
);

module.exports = router;