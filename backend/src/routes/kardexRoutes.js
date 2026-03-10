const express = require('express');
const router = express.Router();
const kardexControllers = require('../controllers/kardexControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

// Solo el personal del laboratorio debería ver el Kardex
router.use(protect);
router.use(restrictTo('admin', 'Administrador', 'administrativo'));

// 1. Obtener el historial de un usuario específico (para el perfil o revisión)
router.get('/usuarios/:usuarioId', kardexControllers.getKardexByUsuario);

// 2. Obtener todos los movimientos (Vista general de inventario)
router.get('/', kardexControllers.getAllKardex);

// 3. RUTA CLAVE: Generar el PDF del Kardex
router.get('/reporte/:usuarioId', kardexControllers.generarPdfKardex);

module.exports = router;