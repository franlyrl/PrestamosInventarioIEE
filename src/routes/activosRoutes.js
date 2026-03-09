const express = require('express');
const router = express.Router();
const activosController = require('../controllers/activosControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

/** 
 * @description Rutas para la gestión de activos
 * @route /api/activos
 * @access Protegido (Cualquier usuario logueado), solo admin para gestión
 * 
 * Estas rutas permiten:
 * - Listar activos (para cualquier usuario logueado)
 * - Filtrar activos por estado o categoría (para cualquier usuario logueado)
 * - Crear, actualizar y eliminar activos (solo para admin y administrativo)
 * 
 * Asegúrate de tener los controladores implementados en activosController.js
 * y los middlewares de autenticación y autorización configurados correctamente.
 */
// --- TODAS LAS RUTAS REQUIEREN TOKEN ---
router.use(protect);

// 1. Rutas de Lectura y Búsqueda (Usuarios autenticados)
router.get('/', activosController.getActivos);
router.get('/categorias/lista', activosController.getEnumCategoriasActivos); // enum de categorías
router.get('/estadisticas', activosController.getEstadisticas);
router.get('/search', activosController.searchActivos);
router.get('/estado/:estado', activosController.getActivosByEstado);
router.get('/categoria/:categoria', activosController.getActivosByCategoria);
router.get('/:id', activosController.getActivoById); // al final para evitar solapamientos

// 2. Rutas de Gestión (Solo Admin y Administrativo)
router.post('/', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    activosController.createActivo
);
// creación masiva reutiliza el mismo controlador que detecta arreglos
router.post('/bulk', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    activosController.createActivo
);
// Para actualizar, se puede usar un middleware de multer si se permite cambiar el PDF
router.put('/:id',
    restrictTo('admin', 'Administrador'), 
    activosController.updateActivo
);

// reactivación de activos dados de baja
router.patch('/:id/reactivar', 
    restrictTo('admin', 'Administrador'), 
    activosController.reactivarActivo
);

// 3. Baja de Activos (Borrado lógico con observaciones)
// En lugar de eliminar físicamente el activo, se inactiva y se registra la observación
router.delete('/:id', 
    restrictTo('admin', 'Administrador'), 
    activosController.deleteActivo
);

module.exports = router;