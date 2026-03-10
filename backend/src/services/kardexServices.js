const kardex = require('../models/kardex');
const usuarios = require('../models/usuarios'); // Para validar el estado del usuario
const activos = require('../models/activos');
const insumos = require('../models/insumos');

/**
 * @description Función central para registrar movimientos en el Kardex.
 * Esta función se llamará desde los controladores de solicitudes, devoluciones, pérdidas, etc.
 * @param {*} idItem 
 * @param {*} tipoItem 
 * @param {*} tipoMovimiento 
 * @param {*} cantidad 
 * @param {*} usuarioId 
 * @param {*} motivo 
 * @param {*} solicitudId 
 * @returns 
 */
exports.registrarMovimiento = async (idItem, tipoItem, tipoMovimiento, cantidad, usuarioId, motivo, solicitudId = null) => {
    try {
        // 1. Solo usuarios ACTIVOS pueden mover cosas
        const usuario = await Usuarios.findById(usuarioId);
        if (!usuario || usuario.estado !== 'activo') {
            throw new Error(`Usuario no autorizado para movimientos.`);
        }

        // 2. Localizar el item para actualizar las UNIDADES (no el precio)
        const Modelo = (tipoItem === 'Activos') ? Activos : Insumos;
        const itemData = await Modelo.findById(idItem);
        if (!itemData) throw new Error('El item no existe.');

        // 3. Lógica de UNIDADES (Stock físico)
        const stockAnterior = itemData.stock || 0; 
        let stockFinal;

        // Si es entrada o devolución, el laboratorio recupera objetos
        if (['entrada', 'devolucion'].includes(tipoMovimiento)) {
            stockFinal = stockAnterior + cantidad;
        } else {
            // Si es salida o pérdida, el laboratorio tiene menos objetos
            stockFinal = stockAnterior - cantidad;
        }

        // 4. ACTUALIZAR EL STOCK EN LA COLECCIÓN CORRESPONDIENTE
        // Esto es vital para que el inventario siempre sea real
        itemData.stock = stockFinal;
        await itemData.save();

        // 5. REGISTRO EN EL KARDEX (La auditoría para el PDF)
        return await Kardex.create({
            item: idItem,
            tipoItem,
            tipoMovimiento, // 'prestamo', 'devolucion', 'perdida', 'entrada'
            cantidad,
            stockAnterior,
            stockFinal,
            motivo, // Ejemplo: "Préstamo clase Robótica" o "Perdido por estudiante"
            referenciaSolicitud: solicitudId,
            usuarioResponsable: usuarioId,
            fecha: new Date()
        });

        

    } catch (error) {
        throw new Error(`Error en Kardex: ${error.message}`);
    }
};