const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const path = require('path');
const generarToken = require('../utils/generarToken');
const usuarioControllers = require('../controllers/usuarioControllers');
const { searchUsuarios } = require('../controllers/usuarioControllers');

// FIX: Combine all middleware into ONE declaration and remove the duplicates
// Note: Make sure restrictTo is coming from the correct file (authMiddleware or roleMiddleware)
const { protect, restrictTo } = require('../middlewares/authMiddleware');

/**
 * // --- 1. CONFIGURACIÓN DE MULTER (Debe ir antes de las rutas) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/comprobantes/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});**/


// --- 2. RUTAS PÚBLICAS ---
// Usamos upload.single para que el controlador reciba el req.file
router.post('/registro', usuarioControllers.createUsuario);
router.post('/login', usuarioControllers.loginUsuario);
router.get('/perfil', protect, usuarioControllers.getPerfil);
router.patch('/update-password', protect, usuarioControllers.updatePassword);

// --- 4. RUTAS ADMINISTRATIVAS (Solo Admin) ---

// Nota: Cambié el orden de /buscar para que no se confunda con /:id
router.get('/buscar', protect, restrictTo('admin'), searchUsuarios);
router.get('/', protect, usuarioControllers.getUsuarios);
router.get('/:id', usuarioControllers.getUsuarioById);
router.get('/email/:email', usuarioControllers.getUsuarioByEmail);
router.get('/rol/:role', usuarioControllers.getUsuariosByRole);

// Acciones de control
router.patch('/:id', protect, usuarioControllers.updateUsuario);
router.patch('/:id/inactivar', protect, restrictTo('admin'), usuarioControllers.inactivarUsuario);
router.post('/sancionar/:id', protect, restrictTo('admin'), usuarioControllers.sancionarUsuarioPorFalta);
router.patch('/:id/sancionar', protect, restrictTo('admin'), usuarioControllers.sancionarUsuario);
router.patch('/:id/levantar-sancion', protect, restrictTo('admin'), usuarioControllers.levantarSancion);

// Ciclo académico
router.patch('/mantenimiento/cierre-cuatrimestre', protect, restrictTo('admin'), usuarioControllers.cierreCuatrimestre);
router.post('/mantenimiento/limpiar-archivo', protect, restrictTo('admin'), usuarioControllers.limpiarUsuariosViejos);

module.exports = router;