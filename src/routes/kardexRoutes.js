const express = require('express');
const router = express.Router();
const kardexController = require('../controllers/kardexController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

// Solo el personal del laboratorio debería ver el Kardex
router.use(protect);
router.use(restrictTo('admin', 'Administrador', 'administrativo'));

// 1. Obtener el historial de un usuario específico (para el perfil o revisión)
router.get('/usuario/:usuarioId', kardexController.getKardexByUsuario);

// 2. Obtener todos los movimientos (Vista general de inventario)
router.get('/', kardexController.getAllKardex);

// 3. RUTA CLAVE: Generar el PDF del Kardex
router.get('/reporte/:usuarioId', kardexController.generarPdfKardex);

module.exports = router;