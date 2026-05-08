const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const usuarioControllers = require('../controllers/usuarioControllers');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const BOLETAS_DIR = path.join(__dirname, '..', '..', 'uploads', 'boletas');
if (!fs.existsSync(BOLETAS_DIR)) {
  fs.mkdirSync(BOLETAS_DIR, { recursive: true });
}

const boletaStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BOLETAS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf';
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  }
});

const boletaUpload = multer({
  storage: boletaStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdfExt = /\.pdf$/i.test(file.originalname || '');
    const isPdfMime = (file.mimetype || '').includes('pdf') || file.mimetype === 'application/octet-stream';
    if (!isPdfExt || !isPdfMime) {
      return cb(new Error('Solo se permite boleta en formato PDF.'));
    }
    cb(null, true);
  }
});

// Publicas
router.post('/registro', boletaUpload.single('boleta_pdf'), usuarioControllers.createUsuario);
router.post('/login', usuarioControllers.loginUsuario);
router.post('/cambiar-password-login', usuarioControllers.cambiarPasswordLogin);
router.post('/cambiar-password', usuarioControllers.cambiarPasswordLogin);
router.post('/boleta-reactivacion', boletaUpload.single('boleta_pdf'), usuarioControllers.subirBoletaReactivacion);
router.get('/perfil', protect, usuarioControllers.getPerfil);
router.patch('/update-password', protect, usuarioControllers.updatePassword);

// Boleta del usuario autenticado
router.post('/boleta', protect, boletaUpload.single('boleta_pdf'), usuarioControllers.subirBoletaPerfil);
router.get('/boleta/estado', protect, usuarioControllers.getEstadoBoleta);

// Administrativas
router.get('/buscar', protect, restrictTo('admin'), usuarioControllers.searchUsuarios);
router.get('/', protect, usuarioControllers.getUsuarios);
router.get('/email/:email', usuarioControllers.getUsuarioByEmail);
router.get('/rol/:role', usuarioControllers.getUsuariosByRole);
router.get('/:id', usuarioControllers.getUsuarioById);

router.patch('/:id/permisos', protect, restrictTo('admin', 'administrativo'), usuarioControllers.updateRolesPermisos);
router.patch('/:id', protect, usuarioControllers.updateUsuario);
router.patch('/:id/inactivar', protect, restrictTo('admin'), usuarioControllers.inactivarUsuario);
router.post('/sancionar/:id', protect, restrictTo('admin'), usuarioControllers.sancionarUsuarioPorFalta);
router.patch('/:id/sancionar', protect, restrictTo('admin'), usuarioControllers.sancionarUsuario);
router.patch('/:id/levantar-sancion', protect, restrictTo('admin'), usuarioControllers.levantarSancion);

router.patch('/mantenimiento/cierre-cuatrimestre', protect, restrictTo('admin'), usuarioControllers.cierreCuatrimestre);
router.post('/mantenimiento/limpiar-archivo', protect, restrictTo('admin'), usuarioControllers.limpiarUsuariosViejos);

// Actualizar estados de docentes por CSV
router.post('/actualizar-csv', protect, restrictTo('admin', 'administrativo'), usuarioControllers.actualizarDocentesCSV);

// Contar docentes pendientes de aprobación (para notificación admin)
router.get('/pendientes-aprobacion', protect, restrictTo('admin', 'administrativo'), usuarioControllers.contarDocentesPendientes);

module.exports = router;
