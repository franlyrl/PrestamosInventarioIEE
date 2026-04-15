const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const cuatrimestreControllers = require('../controllers/cuatrimestreControllers');

router.get('/actual', cuatrimestreControllers.getCuatrimestreActualPublico);

router.get('/', protect, restrictTo('admin', 'administrativo'), cuatrimestreControllers.listarCuatrimestres);
router.post('/configurar', protect, restrictTo('admin', 'administrativo'), cuatrimestreControllers.configurarCuatrimestre);
router.get('/boletas/resumen', protect, restrictTo('admin', 'administrativo'), cuatrimestreControllers.obtenerResumenBoletas);
router.get('/boletas/pendientes', protect, restrictTo('admin', 'administrativo'), cuatrimestreControllers.listarBoletasPendientes);
router.patch('/boletas/:id/resolver', protect, restrictTo('admin', 'administrativo'), cuatrimestreControllers.resolverBoleta);

module.exports = router;
