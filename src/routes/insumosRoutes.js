const express = require('express');
const router = express.Router();
const insumoController = require('../controllers/insumoController');
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
// --- TODAS LAS RUTAS REQUIEREN TOKEN ---
router.use(protect);

// 1. Rutas de Lectura y Búsqueda (Cualquier usuario logueado)
// La ruta de búsqueda se puede implementar con query params para mayor flexibilidad
router.get('/', insumoController.getInsumos);
router.get('/categorias', insumoController.getEnumCategorias); // Lista de categorías para el select del front
router.get('/search', insumoController.searchInsumos);
router.get('/filtro/:categoria', insumoController.getInsumosPorCategoria);
router.get('/estado/:estado', insumoController.getInsumosByEstado);
router.get('/:id', insumoController.getInsumoById);

// 2. Rutas de Gestión de Stock (Admin y Administrativo)
// Para crear y actualizar insumos, se suele usar un middleware de multer para el PDF
router.post('/', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumoController.createInsumo
);

router.patch('/:id', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumoController.updateInsumo
);

// 3. Reportes y Alertas (Solo personal autorizado)
router.get('/reportes/alertas-stock', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    insumoController.getAlertasStock
);

// 4. Baja de Insumos (Solo Admin)
// En lugar de eliminar físicamente el insumo, se inactiva y se registra la observación
router.delete('/:id', 
    restrictTo('admin', 'Administrador'), 
    insumoController.deleteInsumo
);

module.exports = router;