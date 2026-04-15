const mongoose = require('mongoose');

const cuatrimestreConfigSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, trim: true, uppercase: true },
    fecha_inicio: { type: Date, required: true },
    fecha_fin: { type: Date, required: true },
    activo: { type: Boolean, default: false },
    requiere_boleta: { type: Boolean, default: true },
    observaciones: { type: String, trim: true, default: '' },
    creado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null }
  },
  { timestamps: true }
);

cuatrimestreConfigSchema.index({ activo: 1, createdAt: -1 });

module.exports = mongoose.model('CuatrimestreConfig', cuatrimestreConfigSchema);
