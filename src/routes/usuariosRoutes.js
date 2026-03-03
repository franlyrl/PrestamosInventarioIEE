const express = require('express');
const router = express.Router();
const multer = require('multer'); // IMPORTANTE: Importar multer aquí
const path = require('path');
const generarToken = require('../utils/generarToken');
const usuarioControllers = require('../controllers/usuarioControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');


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
// El login no necesita multer, así que va directo al controlador
//router.post('/login', upload.single('comprobante'), usuarioControllers.loginUsuario); --- IGNORE ---
router.post('/login', usuarioControllers.loginUsuario);

// --- 3. RUTAS PROTEGIDAS (Cualquier usuario logueado) ---
//router.use(protect); 

router.get('/perfil', (req, res) => {
    res.json(req.user || { message: "Usuario no cargado" });
});

// --- 4. RUTAS ADMINISTRATIVAS (Solo Admin) ---
router.use(restrictTo('admin', 'Administrador')); 

// Nota: Cambié el orden de /buscar para que no se confunda con /:id
router.get('/perfil', protect, usuarioControllers.getPerfil);
router.get('/buscar', usuarioControllers.searchUsuarios);
router.get('/', usuarioControllers.getUsuarios);
router.get('/:id', usuarioControllers.getUsuarioById);
router.get('/email/:email', usuarioControllers.getUsuarioByEmail);
router.get('/rol/:role', usuarioControllers.getUsuariosByRole);

// Acciones de control
router.patch('/:id', usuarioControllers.updateUsuario);
router.patch('/:id/inactivar', usuarioControllers.inactivarUsuario);
router.post('/sancionar/:id', usuarioControllers.sancionarUsuarioPorFalta);

// Ciclo académico
router.patch('/mantenimiento/cierre-cuatrimestre', usuarioControllers.cierreCuatrimestre);
router.post('/mantenimiento/limpiar-archivo', usuarioControllers.limpiarUsuariosViejos);

module.exports = router;