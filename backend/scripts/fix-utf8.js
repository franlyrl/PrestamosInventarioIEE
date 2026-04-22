#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para corregir problemas de codificación UTF-8 en archivos del backend
 * Reemplaza caracteres mal codificados comunes en español
 */

const replacements = [
    // Vocales con tilde mal codificadas
    { from: /\Ã¡/g, to: 'á' },
    { from: /\Ã©/g, to: 'é' },
    { from: /\Ã­/g, to: 'í' },
    { from: /\Ã³/g, to: 'ó' },
    { from: /\Ãº/g, to: 'ú' },
    { from: /\Ã/g, to: 'Á' },
    { from: /\Ã/g, to: 'É' },
    { from: /\Ã/g, to: 'Í' },
    { from: /\Ã/g, to: 'Ó' },
    { from: /\Ã/g, to: 'Ú' },
    
    // Letra ñ mal codificada
    { from: /\Ã±/g, to: 'ñ' },
    { from: /\Ã/g, to: 'Ñ' },
    
    // Signos de apertura/cierre
    { from: /\Ã/g, to: 'Ñ' },
    { from: /\Â¿/g, to: '¿' },
    { from: /\Â¡/g, to: '¡' },
    
    // Comillas y otros caracteres
    { from: /\Ã/g, to: 'Ñ' },
    { from: /\Ã±/g, to: 'ñ' },
    { from: /\Ã­/g, to: 'í' },
    { from: /\Ã³/g, to: 'ó' },
    { from: /\Ã¡/g, to: 'á' },
    { from: /\Ã©/g, to: 'é' },
    { from: /\Ãº/g, to: 'ú' },
];

function fixFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let fixed = content;
        let changes = 0;
        
        replacements.forEach(({ from, to }) => {
            const matches = fixed.match(from);
            if (matches) {
                changes += matches.length;
                fixed = fixed.replace(from, to);
            }
        });
        
        if (changes > 0) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`  [FIXED] ${filePath} - ${changes} cambios`);
            return changes;
        }
        
        return 0;
    } catch (error) {
        console.error(`  [ERROR] ${filePath}: ${error.message}`);
        return 0;
    }
}

function findFilesToFix(dir) {
    const files = [];
    
    function scanDirectory(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                scanDirectory(fullPath);
            } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.md'))) {
                files.push(fullPath);
            }
        }
    }
    
    scanDirectory(dir);
    return files;
}

function main() {
    const srcDir = path.join(__dirname, '../src');
    const files = findFilesToFix(srcDir);
    
    console.log(`\n=== UTF-8 Fix Script ===`);
    console.log(`Analizando ${files.length} archivos...\n`);
    
    let totalChanges = 0;
    let filesChanged = 0;
    
    for (const file of files) {
        const changes = fixFile(file);
        if (changes > 0) {
            totalChanges += changes;
            filesChanged++;
        }
    }
    
    console.log(`\n=== Resumen ===`);
    console.log(`Archivos modificados: ${filesChanged}`);
    console.log(`Cambios totales: ${totalChanges}`);
    console.log(`\n¡Proceso completado!`);
}

if (require.main === module) {
    main();
}

module.exports = { fixFile, findFilesToFix };
