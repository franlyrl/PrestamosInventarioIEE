const express = require('express');
const router = express.Router();
const insumosControllers = require('../controllers/insumosControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

/** 
* @description Rutas para la gestión de insumos
 * @route /api/insumos
 * @access Protegido (Cualquier usuario logueado), solo admin para gestión
 * 
 * Estas rutas permiten:
 * - Listar insumos (para cualquier usuario logueado)
 * - Filtrar insumos por estado o categoría (para cualquier usuario logueado)
 * - Crear, actualizar y eliminar insumos (solo para admin y administrativo)
 * - Reportes de stock y alertas (solo para personal autorizado)
 * 
 * Asegúrate de tener los controladores implementados en insumoController.js
 * y los middlewares de autenticación y autorización configurados correctamente.
*/

// --- TODAS LAS RUTAS REQUIEREN TOKEN ---
// A partir de aquí, todas las rutas requieren que el usuario esté autenticado
router.use(protect);
// (nota: se había duplicado la llamada, la quitamos)


// 1. Rutas de Lectura y Búsqueda (Cualquier usuario logueado)
// La ruta de búsqueda se puede implementar con query params para mayor flexibilidad
router.get('/', insumosControllers.getInsumos);
router.get('/categorias', insumosControllers.getEnumCategorias); // Lista de categorías para el select del front
router.get('/estadisticas', insumosControllers.getEstadisticas); // Estadísticas del inventario
router.get('/bajo-stock', insumosControllers.getBajoStock); // Insumos con stock bajo
router.get('/search', insumosControllers.searchInsumos);
router.get('/filtro/:categoria', insumosControllers.getInsumosPorCategoria);
router.get('/estado/:estado', insumosControllers.getInsumosByEstado);
router.get('/:id', insumosControllers.getInsumoById); // obtener un solo insumo por ID

// 2. Rutas de Gestión de Stock (Admin y Administrativo)
router.post('/', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumosControllers.createInsumo
);
// permite creación masiva: acepta array de objetos con la misma validación
router.post('/bulk', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumosControllers.createInsumo // reusa la misma función que detecta arrays
);

router.patch('/:id', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumosControllers.updateInsumo
);

// Rutas especializadas para stock
router.patch('/:id/stock', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumosControllers.updateStock // incrementar o decrementar cantidad
);

router.patch('/:id/reactivar', 
    restrictTo('admin', 'Administrador'), 
    insumosControllers.reactivarInsumo // reactivar un insumo eliminado
);

// 3. Reportes y Alertas (Solo personal autorizado)
router.get('/reportes/alertas-stock', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumosControllers.getAlertasStock
);

// 4. Baja de Insumos (Solo Admin)
// En lugar de eliminar físicamente el insumo, se inactiva y se registra la observación
router.delete('/:id', 
    restrictTo('admin', 'Administrador'), 
    insumosControllers.deleteInsumo
);

module.exports = router;