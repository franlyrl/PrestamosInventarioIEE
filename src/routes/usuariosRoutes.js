const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

/**
 * @description Rutas para la gestión de usuarios
 * @route /api/usuarios
 * @access Público para registro/login, protegido para perfil, solo admin para gestión
 * Rutas para la gestión de usuarios.
 * 
 * Estas rutas permiten:
 * - Registro y login de usuarios (públicas)
 * - Acceso al perfil del usuario (protegida)
 * - Gestión administrativa de usuarios (solo admin)
 * 
 * Asegúrate de tener los controladores implementados en usuarioController.js
 * y los middlewares de autenticación y autorización configurados correctamente.
 */
// --- 1. RUTAS PÚBLICAS ---
// Para registrarse se suele usar un middleware de multer para el PDF
// Si ya tienes configurado multer, agrégalo aquí (ej: upload.single('comprobante'))
router.post('/register', usuarioController.createUsuario);
router.post('/login', usuarioController.loginUsuario);

// --- 2. RUTAS PROTEGIDAS (Cualquier usuario logueado) ---
router.use(protect); // A partir de aquí, todos deben tener Token

router.get('/perfil', (req, res) => {
    // Reutilizamos el objeto req.user que inyecta el authMiddleware
    res.json(req.user);
});

// --- 3. RUTAS ADMINISTRATIVAS (Solo Admin) ---
router.use(restrictTo('admin', 'Administrador')); 

// Gestión de usuarios
// Rutas para obtener usuarios por diferentes criterios
// Nota: El orden de las rutas es importante. Las rutas más específicas deben ir 
// antes que las más generales.
router.get('/', usuarioController.getUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.get('/email/:email', usuarioController.getUsuarioByEmail);
router.get('/rol/:role', usuarioController.getUsuariosByRole);
router.get('/buscar', usuarioController.searchUsuarios);

// Acciones de control y estado
// Rutas para actualizar, inactivar y sancionar usuarios
router.patch('/:id', usuarioController.updateUsuario);
router.patch('/:id/inactivar', usuarioController.inactivarUsuario);
router.post('/sancionar/:id', usuarioController.sancionarUsuarioPorFalta);

// Herramientas de ciclo académico (Cierre de cuatrimestre y limpieza)
router.patch('/mantenimiento/cierre-cuatrimestre', usuarioController.cierreCuatrimestre);
router.post('/mantenimiento/limpiar-archivo', usuarioController.limpiarUsuariosViejos);

module.exports = router;