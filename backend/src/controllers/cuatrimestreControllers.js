const CuatrimestreConfig = require('../models/cuatrimestreConfig');
const Usuarios = require('../models/usuarios');

function ensureDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

exports.getCuatrimestreActualPublico = async (req, res) => {
  try {
    const actual = await CuatrimestreConfig.findOne({ activo: true }).sort({ createdAt: -1 }).lean();
    if (!actual) {
      return res.json({
        activo: false,
        message: 'No hay cuatrimestre activo configurado.'
      });
    }

    const ahora = new Date();
    const inicio = new Date(actual.fecha_inicio);
    const fin = new Date(actual.fecha_fin);

    let estadoVentana = 'futuro';
    if (ahora >= inicio && ahora <= fin) estadoVentana = 'vigente';
    if (ahora > fin) estadoVentana = 'vencido';

    res.json({
      activo: true,
      cuatrimestre: {
        id: actual._id,
        codigo: actual.codigo,
        fecha_inicio: actual.fecha_inicio,
        fecha_fin: actual.fecha_fin,
        requiere_boleta: actual.requiere_boleta,
        estado_ventana: estadoVentana
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar cuatrimestre activo.', error: error.message });
  }
};

exports.listarCuatrimestres = async (req, res) => {
  try {
    const rows = await CuatrimestreConfig.find({}).sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar cuatrimestres.', error: error.message });
  }
};

exports.configurarCuatrimestre = async (req, res) => {
  try {
    const { codigo, fecha_inicio, fecha_fin, requiere_boleta, observaciones } = req.body;

    if (!codigo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: 'Debe enviar codigo, fecha_inicio y fecha_fin.' });
    }

    const inicio = ensureDate(fecha_inicio);
    const fin = ensureDate(fecha_fin);
    if (!inicio || !fin) {
      return res.status(400).json({ message: 'Fechas invalidas.' });
    }
    if (fin < inicio) {
      return res.status(400).json({ message: 'La fecha_fin debe ser mayor o igual a fecha_inicio.' });
    }

    await CuatrimestreConfig.updateMany({}, { activo: false });

    const nuevo = await CuatrimestreConfig.create({
      codigo: String(codigo).trim().toUpperCase(),
      fecha_inicio: inicio,
      fecha_fin: fin,
      activo: true,
      requiere_boleta: requiere_boleta !== false,
      observaciones: observaciones || '',
      creado_por: req.user?._id || null
    });

    // Al abrir nuevo ciclo, pedir nueva boleta a estudiantes
    await Usuarios.updateMany(
      { tipo_rol: 'estudiante' },
      {
        boleta_validada: false,
        boleta_estado: 'pendiente_boleta',
        boleta_cuatrimestre: null,
        boleta_observaciones: `Se requiere boleta para ${nuevo.codigo}.`
      }
    );

    res.status(201).json({
      message: 'Cuatrimestre configurado y activado correctamente.',
      cuatrimestre: nuevo
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al configurar cuatrimestre.', error: error.message });
  }
};

exports.obtenerResumenBoletas = async (req, res) => {
  try {
    const [pendiente, validada, rechazada, sinBoleta] = await Promise.all([
      Usuarios.countDocuments({ tipo_rol: 'estudiante', boleta_estado: 'pendiente_revision' }),
      Usuarios.countDocuments({ tipo_rol: 'estudiante', boleta_estado: 'validada' }),
      Usuarios.countDocuments({ tipo_rol: 'estudiante', boleta_estado: 'rechazada' }),
      Usuarios.countDocuments({ tipo_rol: 'estudiante', $or: [{ boleta_pdf_url: null }, { boleta_pdf_url: { $exists: false } }] })
    ]);

    res.json({ pendiente, validada, rechazada, sin_boleta: sinBoleta });
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar resumen de boletas.', error: error.message });
  }
};

exports.listarBoletasPendientes = async (req, res) => {
  try {
    const rows = await Usuarios.find({
      tipo_rol: 'estudiante',
      boleta_estado: { $in: ['pendiente_revision', 'rechazada', 'pendiente_boleta'] }
    })
      .select('nombre_completo correo_electronico cedula boleta_estado boleta_pdf_url boleta_observaciones boleta_cuatrimestre boleta_fecha_carga')
      .sort({ boleta_fecha_carga: -1, updatedAt: -1 })
      .lean();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar boletas pendientes.', error: error.message });
  }
};

exports.resolverBoleta = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, observacion } = req.body;

    if (!['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ message: 'Accion invalida. Use aprobar o rechazar.' });
    }

    const usuario = await Usuarios.findById(id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    if (accion === 'aprobar') {
      usuario.boleta_validada = true;
      usuario.boleta_estado = 'validada';
      usuario.boleta_observaciones = observacion || 'Validada manualmente por administracion.';
    } else {
      usuario.boleta_validada = false;
      usuario.boleta_estado = 'rechazada';
      usuario.boleta_observaciones = observacion || 'Boleta rechazada. Debe subir un nuevo documento.';
    }

    await usuario.save();

    res.json({ message: 'Estado de boleta actualizado.', usuario_id: usuario._id, boleta_estado: usuario.boleta_estado });
  } catch (error) {
    res.status(500).json({ message: 'Error al resolver boleta.', error: error.message });
  }
};
