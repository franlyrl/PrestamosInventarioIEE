const express = require('express');
const router = express.Router();
const multer = require('multer'); // IMPORTANTE: Importar multer aquí
const path = require('path');
const generarToken = require('../utils/generarToken');
const usuarioController = require('../controllers/usuarioControllers');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

// --- 1. CONFIGURACIÓN DE MULTER (Debe ir antes de las rutas) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/comprobantes/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF'), false);
    }
};

const upload = multer({ storage, fileFilter });

// --- 2. RUTAS PÚBLICAS ---
// Usamos upload.single para que el controlador reciba el req.file
router.post('/register', upload.single('comprobante_pdf'), usuarioController.createUsuario);
router.post('/login', usuarioController.loginUsuario);

// --- 3. RUTAS PROTEGIDAS (Cualquier usuario logueado) ---
router.use(protect); 

router.get('/perfil', (req, res) => {
    res.json(req.user);
});

// --- 4. RUTAS ADMINISTRATIVAS (Solo Admin) ---
router.use(restrictTo('admin', 'Administrador')); 

// Nota: Cambié el orden de /buscar para que no se confunda con /:id
router.get('/buscar', usuarioController.searchUsuarios);
router.get('/', usuarioController.getUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.get('/email/:email', usuarioController.getUsuarioByEmail);
router.get('/rol/:role', usuarioController.getUsuariosByRole);

// Acciones de control
router.patch('/:id', usuarioController.updateUsuario);
router.patch('/:id/inactivar', usuarioController.inactivarUsuario);
router.post('/sancionar/:id', usuarioController.sancionarUsuarioPorFalta);

// Ciclo académico
router.patch('/mantenimiento/cierre-cuatrimestre', usuarioController.cierreCuatrimestre);
router.post('/mantenimiento/limpiar-archivo', usuarioController.limpiarUsuariosViejos);

module.exports = router;