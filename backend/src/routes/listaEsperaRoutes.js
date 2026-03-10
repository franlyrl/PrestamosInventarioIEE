const express = require('express');
const router = express.Router();
const listaEsperaController = require('../controllers/listaEsperaControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

// --- TODAS REQUIEREN TOKEN ---
router.use(protect);

// 1. Ver la lista (Ordenada por prioridad y tiempo)
router.get('/', listaEsperaController.getListaEspera);

// 2. Anotarse en la lista (Estudiantes y Docentes)
router.post('/', listaEsperaController.agregarAListaEspera);

// 3. Gestión de la lista (Solo Admin / Administrativo)
// Útil para cambiar la prioridad o marcar como 'atendido'
router.patch('/:id', 
    restrictTo('admin', 'Administrador', 'administrativo'), 
    listaEsperaController.actualizarTurno
);

module.exports = router;