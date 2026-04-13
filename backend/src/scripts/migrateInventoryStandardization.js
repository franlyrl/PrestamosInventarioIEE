require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Insumo = require('../models/insumos');
const Activo = require('../models/activos');

const DRY_RUN = process.argv.includes('--dry-run');

const mapEstadoInsumo = (estado, cantidad) => {
    const valor = String(estado || '').trim().toLowerCase();
    const equivalencias = {
        activo: 'disponible',
        disponible: 'disponible',
        prestado: 'prestado',
        pendiente: 'en espera',
        'en espera': 'en espera',
        agotado: 'fuera de stock',
        'sin stock': 'fuera de stock',
        'fuera de stock': 'fuera de stock',
        eliminado: 'eliminado'
    };

    if (equivalencias[valor]) {
        return equivalencias[valor];
    }

    return Number(cantidad) <= 0 ? 'fuera de stock' : 'disponible';
};

const mapEstadoActivo = estado => {
    const valor = String(estado || '').trim().toLowerCase();
    const equivalencias = {
        disponible: 'disponible',
        prestado: 'prestado',
        pendiente: 'en espera',
        'en espera': 'en espera',
        deteriorado: 'fuera de stock',
        danado: 'fuera de stock',
        eliminado: 'eliminado'
    };

    return equivalencias[valor] || 'disponible';
};

const normalizarTipo = tipo => (String(tipo || '').trim().toLowerCase() === 'activo' ? 'activo' : 'consumible');

const generarCodigo = (item = {}) => {
    const tipo = normalizarTipo(item.tipo);
    const baseRaw = String(item.codigo || item.id_insumo || item.numActivo || '').trim();
    const base = baseRaw || String(item._id).slice(-6).toUpperCase();
    const prefijo = tipo === 'activo' ? 'ACT-' : 'INS-';

    const upper = base.toUpperCase();
    if (upper.startsWith('ACT-') || upper.startsWith('INS-')) {
        return upper;
    }

    return `${prefijo}${upper}`;
};

const run = async () => {
    await connectDB();

    let insumosActualizados = 0;
    let activosActualizados = 0;

    const insumos = await Insumo.find({});
    for (const insumo of insumos) {
        const nuevoTipo = normalizarTipo(insumo.tipo);
        const nuevaCantidad = Math.max(0, Number(insumo.cantidad || 0));
        const nuevoEstado = mapEstadoInsumo(insumo.estado, nuevaCantidad);
        const nuevoCodigo = generarCodigo({ ...insumo.toObject(), tipo: nuevoTipo });
        const nuevaUbicacion = String(insumo.ubicacion || 'Laboratorio de Electronica').trim();

        const hayCambios = (
            insumo.tipo !== nuevoTipo
            || Number(insumo.cantidad) !== nuevaCantidad
            || insumo.estado !== nuevoEstado
            || insumo.codigo !== nuevoCodigo
            || String(insumo.ubicacion || '').trim() !== nuevaUbicacion
        );

        if (!hayCambios) continue;
        insumosActualizados += 1;

        if (!DRY_RUN) {
            insumo.tipo = nuevoTipo;
            insumo.cantidad = nuevaCantidad;
            insumo.estado = nuevoEstado;
            insumo.codigo = nuevoCodigo;
            insumo.ubicacion = nuevaUbicacion;
            await insumo.save();
        }
    }

    const activos = await Activo.find({});
    for (const activo of activos) {
        const nuevoEstado = mapEstadoActivo(activo.estadoActivo);
        if (activo.estadoActivo === nuevoEstado) continue;

        activosActualizados += 1;
        if (!DRY_RUN) {
            activo.estadoActivo = nuevoEstado;
            await activo.save();
        }
    }

    console.log(`[migracion] modo=${DRY_RUN ? 'dry-run' : 'write'}`);
    console.log(`[migracion] insumos actualizados: ${insumosActualizados}`);
    console.log(`[migracion] activos actualizados: ${activosActualizados}`);

    await mongoose.connection.close();
};

run().catch(async error => {
    console.error('[migracion] error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
});
