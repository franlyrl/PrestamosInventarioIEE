import os

def replace_in_file(filepath, target, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if target in content:
        new_content = content.replace(target, replacement)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully updated {filepath}")
    else:
        print(f"Target not found in {filepath}")
        # Try finding with flexible whitespace if direct match fails
        import re
        # Escape special characters in target
        escaped_target = re.escape(target).replace(r'\ ', r'\s+').replace(r'\n', r'\s+')
        if re.search(escaped_target, content):
            new_content = re.sub(escaped_target, replacement, content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully updated {filepath} using regex")
        else:
            print(f"Failed to find target even with flexible whitespace in {filepath}")

# 1. Update Dashboard.html
dashboard_path = r'c:\Users\madmu\Downloads\Prestamos\PrestamosInventarioIEE\frontend\pages\Dashboard.html'

# Rules/Instructions
target_rules = """                    <p> Por favor, lee las reglas antes de continuar </p>
                    <ul class="list-disc list-inside text-slate-600">
                        <li>Solo se puede pedir una vez el mismo artículo</li>
                        <li>No se prestarán equipos que no estén en el inventario</li>
                        <li>No se prestarán equipos que no estén disponibles</li>
                    </ul>"""

replacement_rules = """                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-sm font-bold text-blue-800 uppercase tracking-wider">Instrucciones de Uso</h3>
                                <div class="mt-2 text-sm text-blue-700 space-y-2">
                                    <p>1. <strong>Explora el catálogo:</strong> Utiliza el buscador para encontrar lo que necesitas (Digitales o Analógicos).</p>
                                    <p>2. <strong>Selección máxima:</strong> Puedes añadir un máximo de <strong>dos (2) artículos</strong> a tu carrito por solicitud.</p>
                                    <p>3. <strong>Envía tu solicitud:</strong> Revisa tu carrito y confirma el pedido. Recibirás una notificación cuando sea aprobada.</p>
                                    <p>4. <strong>Cita de recogida:</strong> El administrador te indicará el día y la hora exacta para retirar los implementos.</p>
                                </div>
                            </div>
                        </div>
                    </div>"""

# Manual Categories
target_cats = """                                <select id="categoria-manual" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                    <option value="Componentes Digitales">Componentes Digitales</option>
                                    <option value="Componentes Analógicos">Componentes Analógicos</option>
                                </select>"""

replacement_cats = """                                <select id="categoria-manual" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                    <option value="Digitales">Digitales</option>
                                    <option value="Analógicos">Analógicos</option>
                                </select>"""

replace_in_file(dashboard_path, target_rules, replacement_rules)
replace_in_file(dashboard_path, target_cats, replacement_cats)

# 2. Update signup.html
signup_path = r'c:\Users\madmu\Downloads\Prestamos\PrestamosInventarioIEE\frontend\signup.html'

target_email = """                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Correo Institucional</label>
                                <input type="email" id="emailInput" placeholder="estudiante@utn.ac.cr" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-utn-blue/10 focus:border-utn-blue focus:bg-white outline-none transition-all text-sm text-slate-800 font-medium" required>
                            </div>"""

replacement_email = """                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Correo Institucional</label>
                                <div class="relative">
                                    <input type="email" id="emailInput" placeholder="usuario@utn.ac.cr" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-utn-blue/10 focus:border-utn-blue focus:bg-white outline-none transition-all text-sm text-slate-800 font-medium" required>
                                    <div id="roleBadge" class="hidden absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight transition-all duration-300"></div>
                                </div>
                                <p id="roleNote" class="text-[10px] text-slate-400 mt-1.5 ml-1 font-medium italic"></p>
                            </div>"""

target_autofill = """            // Auto-llenar email con formato UTN si es cédula
            document.getElementById('cedulaInput')?.addEventListener('blur', (e) => {
                const emailInput = document.getElementById('emailInput');
                if (!emailInput.value && /^\d{9,12}$/.test(e.target.value)) {
                    emailInput.value = `${e.target.value}@utn.ac.cr`;
                }
            });"""

replacement_autofill = """            // Detección dinámica de rol por correo
            document.getElementById('emailInput')?.addEventListener('input', (e) => {
                const email = e.target.value.toLowerCase().trim();
                const badge = document.getElementById('roleBadge');
                const note = document.getElementById('roleNote');
                
                if (!email.includes('@utn.ac.cr')) {
                    badge.classList.add('hidden');
                    note.textContent = '';
                    return;
                }

                badge.classList.remove('hidden');
                if (email.endsWith('@est.utn.ac.cr')) {
                    badge.textContent = 'Estudiante';
                    badge.className = 'absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight bg-blue-100 text-blue-700';
                    note.textContent = 'ℹ️ Registro detectado como Estudiante.';
                } else if (email.endsWith('@utn.ac.cr')) {
                    badge.textContent = 'Docente';
                    badge.className = 'absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight bg-indigo-100 text-indigo-700';
                    note.textContent = 'ℹ️ Registro detectado como Docente.';
                }
            });

            // Auto-llenar email con formato UTN si es cédula
            document.getElementById('cedulaInput')?.addEventListener('blur', (e) => {
                const emailInput = document.getElementById('emailInput');
                if (!emailInput.value && /^\d{9,12}$/.test(e.target.value)) {
                    emailInput.value = `${e.target.value}@est.utn.ac.cr`;
                    // Disparar evento input para activar el badge
                    emailInput.dispatchEvent(new Event('input'));
                }
            });"""

replace_in_file(signup_path, target_email, replacement_email)
replace_in_file(signup_path, target_autofill, replacement_autofill)
