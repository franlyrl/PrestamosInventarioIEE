const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'pages');

const newFooter = `<!-- FOOTER INSTITUCIONAL MEJORADO -->
<footer class="bg-utn-dark text-slate-300 py-10 mt-12 border-t-4 border-utn-gold">
    <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div class="text-center md:text-left">
                <h3 class="text-xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                    <img src="../css/UTN.jpg" class="w-8 h-8 rounded-md bg-white p-1" alt="UTN"> 
                    SPIEE-SP
                </h3>
                <p class="text-sm text-slate-400">Sistema Institucional de Préstamos e Inventario</p>
                <p class="text-xs text-slate-500 mt-1">Sede Central Universitaria</p>
            </div>
            <div class="text-center space-y-2">
                <p class="text-sm font-medium hover:text-white transition-colors cursor-default">Soporte Técnico: soporte@utn.ac.cr</p>
                <p class="text-sm font-medium hover:text-white transition-colors cursor-default">Teléfono: +506 2435-5000</p>
            </div>
            <div class="text-center md:text-right">
                <p class="text-sm">
                    &copy; 2024-2025 <strong>Universidad Técnica Nacional</strong>
                </p>
                <p class="text-xs text-slate-500 mt-2">Todos los derechos reservados. Desarrollo Institucional.</p>
            </div>
        </div>
    </div>
</footer>`;

const targetFiles = ['ModUsuarios.html', 'ModAdmis.html', 'perfil.html', 'Dashboard.html'];
for (const file of targetFiles) {
    let filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;
    let original = fs.readFileSync(filePath, 'utf8');
    let replaced = original.replace(/<footer[\s\S]*?<\/footer>/g, newFooter);
    
    // Si no tiene footer original, inyectar el nuevo antes del primer <script src=
    if (!replaced.includes('<!-- FOOTER INSTITUCIONAL MEJORADO -->')) {
        let scriptPos = replaced.lastIndexOf('<script src="../js');
        if (scriptPos !== -1) {
            replaced = replaced.slice(0, scriptPos) + newFooter + '\n    ' + replaced.slice(scriptPos);
        } else {
            replaced = replaced.replace('</body>', newFooter + '\n</body>');
        }
    }

    if (original !== replaced) {
        fs.writeFileSync(filePath, replaced, 'utf8');
        console.log('Fixed footer in:', file);
    }
}
