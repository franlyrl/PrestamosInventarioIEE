// Función createSolicitudCardV2 limpia y sin errores de sintaxis
createSolicitudCardV2(solicitud) {
    console.log('** createSolicitudCardV2 llamado con solicitud:', {
        id: solicitud._id,
        estado: solicitud.estado,
        tipoEstado: typeof solicitud.estado,
        usuario: solicitud.usuario?.nombre_completo,
        objetoCompleto: solicitud
    });
    
    const usuario = solicitud.usuario || {};
    const nombreUsuario = usuario.nombre_completo || usuario.nombre || 'Usuario sin nombre';
    const rolUsuario = usuario.rol || usuario.rol_nombre || '';
    const rolText = rolUsuario.toLowerCase();
    
    const esEstudiante = rolText.includes('estudiante');
    const esDocente = rolText.includes('docente') || rolText.includes('profesor');
    
    let rolColor = '#10b981'; // Verde para estudiantes
    let rolBgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    let rolIcono = '??';
    
    if (esDocente) {
        rolColor = '#f59e0b'; // Naranja para docentes
        rolBgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        rolIcono = '??';
    }

    return `
        <div class="bg-white rounded-lg shadow-md border border-slate-200 p-3 sm:p-4 mb-3 sm:mb-4 hover:shadow-lg transition-shadow">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-base sm:text-lg">${rolIcono}</span>
                        <div>
                            <div class="font-bold text-xs sm:text-xs" style="color: ${rolColor};">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                            <div class="text-xs sm:text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                        </div>
                    </div>
                    <div class="text-slate-600 font-medium text-sm sm:text-base mt-1">${nombreUsuario}</div>
                </div>
                <div class="text-right sm:text-left mt-2 sm:mt-0">
                    <div class="text-slate-500 text-xs sm:text-sm">${new Date(solicitud.createdAt).toLocaleDateString()}</div>
                    <div class="mt-1">${this.getEstadoBadge(solicitud.estado)}</div>
                </div>
            </div>
            
            <div class="space-y-2 sm:space-y-3">
                <div class="text-xs sm:text-sm text-slate-700">
                    ${this.getElementosInfo(solicitud)}
                </div>
                
                <!-- Información adicional para solicitudes aprobadas -->
                ${solicitud.estado === 'aprobada' && (solicitud.fecha_recogida || solicitud.dias_disponibles) ? `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-2 space-y-1">
                        ${solicitud.fecha_recogida ? `
                            <div class="text-xs font-medium text-green-700">
                                ?? <span class="font-semibold">Fecha de recogida:</span> ${solicitud.fecha_recogida}
                            </div>
                        ` : ''}
                        ${solicitud.dias_disponibles ? `
                            <div class="text-xs font-medium text-blue-700">
                                ?? <span class="font-semibold">Días disponibles:</span> ${solicitud.dias_disponibles}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <!-- Información adicional para solicitudes entregadas -->
                ${solicitud.estado === 'entregado' && (solicitud.fecha_entrega || solicitud.fecha_recogida) ? `
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-2 space-y-1">
                        ${solicitud.fecha_entrega ? `
                            <div class="text-xs font-medium text-orange-700">
                                ?? <span class="font-semibold">Fecha de entrega:</span> ${solicitud.fecha_entrega}
                            </div>
                        ` : ''}
                        ${solicitud.fecha_recogida ? `
                            <div class="text-xs font-medium text-green-600">
                                ?? <span class="font-semibold">Fecha de recogida:</span> ${solicitud.fecha_recogida}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="flex justify-end mt-2 sm:mt-3">
                    <div class="relative">
                        <button 
                            id="menu-btn-${solicitud._id}"
                            onclick="window.mobileAdminController.toggleMenu('${solicitud._id}')" 
                            class="p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110"
                            style="background: ${rolBgGradient}; color: white; box-shadow: 0 2px 8px ${rolColor}40;">
                            <span class="text-sm sm:text-base">??</span>
                        </button>
                        <div id="menu-${solicitud._id}" class="hidden absolute right-0 sm:right-4 mt-1 sm:mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border-2" style="border-color: ${rolColor}; z-index: 1000;">
                            <div class="menu-header" style="background: ${rolBgGradient}; color: white; padding: 12px; border-radius: 8px 8px 0 0;">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">${rolIcono}</span>
                                    <div>
                                        <div class="font-bold text-xs">${esEstudiante ? 'ESTUDIANTE' : 'DOCENTE'}</div>
                                        <div class="text-xs opacity-90">Solicitud #${solicitud._id?.slice(-6)}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="p-2">
                                ${this.createAdminActions(solicitud)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
