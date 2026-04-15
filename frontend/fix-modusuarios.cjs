const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'pages', 'ModUsuarios.html');

let content = fs.readFileSync(file, 'utf8');

// Remove all footers
content = content.replace(/<footer[\s\S]*?<\/footer>/g, '');

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
</footer>\n`;

// Append it right before the first script
let insertPos = content.indexOf('<!-- JavaScript -->');
if (insertPos === -1) {
    insertPos = content.indexOf('<script src="../js/app.js">');
}

if (insertPos !== -1) {
    content = content.slice(0, insertPos) + newFooter + content.slice(insertPos);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Cleaned ModUsuarios.html footer.');
