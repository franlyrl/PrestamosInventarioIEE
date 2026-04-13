const express = require('express');
const router = express.Router();
const solicitudesControllers = require('../controllers/solicitudesControllers');
const { ponerFueraDeServicio } = require('../controllers/ponerFueraDeServicio');
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

// 2.1. Visualización para Estudiantes (solo sus solicitudes)
// Esta ruta permite a los estudiantes ver cualquier solicitud que les pertenezca
router.get('/estudiante/:id',
    restrictTo('estudiante', 'docente'),
    solicitudesControllers.getSolicitudByIdForStudent
);

// 2.2. Rutas específicas (deben ir antes de /:id para evitar conflictos)
router.put('/poner-fuera-servicio/:id',
    restrictTo('admin', 'Administrador', 'administrativo'),
    ponerFueraDeServicio
);

// Ruta de prueba (debe ir antes de /:id)
router.get('/test-endpoint', (req, res) => {
    res.json({ 
        message: 'Endpoint de prueba funcionando correctamente',
        timestamp: new Date(),
        routes: Object.keys(router)
    });
});

// Ruta de prueba PUT simple
router.put('/test-put', (req, res) => {
    res.json({ 
        message: 'PUT test funcionando',
        body: req.body
    });
});

// 3.1. Cambiar estado de solicitud (con autenticación) - debe ir antes de /:id
router.put('/estado/:id', 
    restrictTo('admin', 'Administrador', 'administrativo'),
    solicitudesControllers.actualizarEstadoSolicitud
);

// 3.2. Para cambios de estado generales (PATCH) - debe ir antes de /:id
router.patch('/:id/estado', 
    restrictTo('admin', 'Administrador', 'administrativo'),
    solicitudesControllers.gestionarEstadoAdmin
);

// 3. Gestión del Estudiante (Cancelar su propia boleta)
// REGLA DE ORO: Solo si el estado es 'pendiente' y es el dueño.
router.delete('/:id', solicitudesControllers.deleteSolicitud);

// 3.2. Gestión del Estudiante (Editar su propia solicitud)
// REGLA DE ORO: Solo si el estado es 'pendiente' o 'aprobada' y es el dueño.
router.put('/:id', solicitudesControllers.updateSolicitud);

// 4. Gestión Administrativa (Solo Admin / Administrativo)
// Estas rutas son para aprobar, rechazar o marcar devoluciones.

// Para aprobaciones/rechazos iniciales y disparar el motor de inventario
router.put('/admin-gestion/:id',
    restrictTo('admin', 'Administrador', 'administrativo'),
    solicitudesControllers.gestionarEstadoAdmin
);

// 2.3. Visualización por ID (debe ir al final de todo)
router.get('/:id', solicitudesControllers.getSolicitudById);

module.exports = router;