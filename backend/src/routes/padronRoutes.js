const express = require('express');
const router = express.Router();
const multer = require('multer');
const padronControllers = require('../controllers/padronControllers');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Multer en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/msexcel',
            'text/csv', 'text/plain', 'application/csv', 'application/x-csv',
            'application/octet-stream'
        ];
        const allowedExts = /\.(xlsx|xls|csv)$/i;
        const originalname = file.originalname || '';
        const extensionValida = allowedExts.test(originalname);
        const mimeValido = allowedMimes.includes(file.mimetype);

        // Regla de negocio: solo se permite cargar .xlsx, .xls y .csv
        if (extensionValida && mimeValido) {
            cb(null, true);
        } else {
            cb(new Error('Formato no soportado. Use únicamente archivos .xlsx, .xls o .csv.'));
        }
    }
});

// ── RUTAS PÚBLICAS (sin auth) — deben ir PRIMERO ──
// Autocompletado en signup: buscar por cédula
router.get('/buscar-cedula/:cedula', padronControllers.buscarPorCedula);
// Verificar si el padrón tiene datos (para mostrar aviso en signup)
router.get('/estado-padron', padronControllers.estadoPadron);

// ── RUTAS PROTEGIDAS — orden importante: rutas específicas ANTES que /:id ──
router.post('/importar', protect, restrictTo('admin'), upload.single('archivo'), padronControllers.importarPadron);
router.get('/estadisticas', protect, restrictTo('admin', 'operador'), padronControllers.getEstadisticasPadron);
router.get('/', protect, restrictTo('admin', 'operador'), padronControllers.getPadron);
router.patch('/:id/estado', protect, restrictTo('admin'), padronControllers.cambiarEstadoEstudiante);

module.exports = router;
