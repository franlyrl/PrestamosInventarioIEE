const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompact(value) {
  return normalizeText(value).replace(/[^A-Z0-9]/g, '');
}

function buildCodigoVariants(codigo) {
  const base = normalizeCompact(codigo);
  const variants = new Set();
  if (!base) return variants;
  variants.add(base);

  const lettersMatch = base.match(/^[A-Z]+/);
  const yearMatch = base.match(/(\d{4})$/);
  const letters = lettersMatch ? lettersMatch[0] : '';
  const year = yearMatch ? yearMatch[1] : '';

  if (letters && year) {
    // Permitir equivalencia IC-2026 <-> I-2026
    if (letters === 'IC') variants.add(`I${year}`);
    if (letters === 'I') variants.add(`IC${year}`);

    // Variación adicional: prefijo sin C cuando venga unido al período
    if (letters.includes('C')) variants.add(`${letters.replace(/C/g, '')}${year}`);
  }

  return variants;
}

function extractYearFromCodigo(codigo) {
  const m = String(codigo || '').match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

function parseDateFromToken(token) {
  const m = String(token || '').match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(d.getTime()) ? null : d;
}

function extractCandidateDates(text) {
  const matches = String(text || '').match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g) || [];
  return matches
    .map((token) => parseDateFromToken(token))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
}

async function extractRawTextFromPdf(buffer) {
  try {
    const parsed = await pdfParse(buffer || Buffer.from([]));
    const text = String(parsed?.text || '').trim();
    if (text.length > 0) return text;
  } catch (_) {
    // Fallback below
  }
  // Fallback simple: texto "visible" en flujo binario PDF.
  // Si el PDF esta muy comprimido, podria no extraer todo.
  return Buffer.from(buffer || []).toString('latin1');
}

function normalizeCedula(value) {
  return String(value || '').replace(/[^\d]/g, '').trim();
}

function extractCedulasFromText(text) {
  const matches = String(text || '').match(/\b\d{1,2}[\- ]?\d{3,4}[\- ]?\d{3,4}\b|\b\d{5,12}\b/g) || [];
  return Array.from(new Set(matches.map((m) => normalizeCedula(m)).filter((m) => m.length >= 5 && m.length <= 12)));
}

function containsName(normalizedText, fullName) {
  const normalizedName = normalizeText(fullName);
  if (!normalizedName) return false;

  if (normalizedText.includes(normalizedName)) return true;

  const tokens = normalizedName.split(' ').filter((t) => t.length >= 3);
  if (tokens.length < 2) return false;

  const matched = tokens.filter((t) => normalizedText.includes(t)).length;
  return matched >= Math.min(3, tokens.length);
}

function canonicalCareer(value) {
  const v = normalizeText(value);
  const map = {
    'INGENIERIA ELECTRONICA': 'INGENIERIA ELECTRONICA',
    'INGENIERIA ELECTRICA': 'INGENIERIA ELECTRICA',
    'INGENIERIA EN TECNOLOGIAS DE INFORMACION': 'INGENIERIA EN TECNOLOGIAS DE INFORMACION',
    'INGENIERIA EN PRODUCCION INDUSTRIAL': 'INGENIERIA EN PRODUCCION INDUSTRIAL',
    'N/A': 'N/A',
    'NA': 'N/A'
  };
  return map[v] || v;
}

function containsCareer(normalizedText, career) {
  const target = canonicalCareer(career);
  if (!target || target === 'N/A') return true;
  return normalizedText.includes(target);
}

function evaluateBoletaAgainstConfig(text, activeConfig, expectedData = {}) {
  if (!activeConfig) {
    return {
      validada: true,
      estado: 'validada',
      observacion: 'No hay cuatrimestre activo configurado.'
    };
  }

  const normalizedText = normalizeText(text);
  const compactText = normalizeCompact(text);
  const hasPdfTextLayer = normalizedText.length >= 30 && !normalizedText.startsWith('%PDF-');
  const codigoVariants = buildCodigoVariants(activeConfig.codigo);
  const hasCodigo = Array.from(codigoVariants).some((v) => compactText.includes(v));

  const fechas = extractCandidateDates(text);
  const fechaInicioCfg = new Date(activeConfig.fecha_inicio);
  const fechaFinCfg = new Date(activeConfig.fecha_fin);

  const hasCoverageByRange = fechas.some((f) => {
    const t = f.getTime();
    return t >= fechaInicioCfg.getTime() && t <= fechaFinCfg.getTime();
  });
  const codigoYear = extractYearFromCodigo(activeConfig.codigo);
  const hasCoverageByYear = codigoYear
    ? fechas.some((f) => f.getUTCFullYear() === codigoYear)
    : false;

  // Regla flexible para boletas institucionales:
  // 1) ideal: fecha dentro del rango configurado
  // 2) fallback: mismo año del cuatrimestre
  // 3) fallback final: si no hay fechas extraibles pero sí coincide el código
  const hasCoverage = hasCoverageByRange || (hasCodigo && (hasCoverageByYear || fechas.length === 0));

  const fechaMin = fechas[0] || null;
  const fechaMax = fechas[fechas.length - 1] || null;

  const cedulaEsperada = normalizeCedula(expectedData.cedula);
  const cedulasEnBoleta = extractCedulasFromText(text);
  const hasCedula = cedulaEsperada ? cedulasEnBoleta.includes(cedulaEsperada) : true;

  const hasNombre = expectedData.nombre_completo
    ? containsName(normalizedText, expectedData.nombre_completo)
    : true;

  const hasCarrera = expectedData.carrera
    ? containsCareer(normalizedText, expectedData.carrera)
    : true;

  const validadaAuto = hasCodigo && hasCoverage && hasCedula && hasNombre && hasCarrera;
  const estado = validadaAuto ? 'validada' : 'rechazada';

  let observacion = 'Boleta recibida correctamente.';
  if (!validadaAuto) {
    const reasons = [];
    if (!hasPdfTextLayer) reasons.push('El PDF no contiene texto seleccionable (parece escaneado/imagen).');
    if (!hasCodigo) reasons.push(`No se detectó el código del cuatrimestre (${activeConfig.codigo}).`);
    if (!hasCoverage) reasons.push('No se detectaron fechas dentro del rango configurado o del año del cuatrimestre.');
    if (!hasCedula) reasons.push('La cédula de la boleta no coincide con la del estudiante.');
    if (!hasNombre) reasons.push('El nombre en la boleta no coincide con el nombre del estudiante.');
    if (!hasCarrera) reasons.push('La carrera en la boleta no coincide con la carrera del estudiante.');
    observacion = reasons.join(' ');
  }

  return {
    validada: validadaAuto,
    estado,
    observacion,
    hasCodigo,
    hasCoverage,
    hasPdfTextLayer,
    hasCedula,
    hasNombre,
    hasCarrera,
    cedulasDetectadas: cedulasEnBoleta.slice(0, 5),
    fechaMin,
    fechaMax,
    textoResumen: normalizedText.slice(0, 1200)
  };
}

function persistBoletaFile(file, destinationDir) {
  if (!file || !file.path) return null;
  const baseName = path.basename(file.path);
  return `/uploads/boletas/${baseName}`;
}

module.exports = {
  normalizeText,
  normalizeCompact,
  extractRawTextFromPdf,
  evaluateBoletaAgainstConfig,
  persistBoletaFile
};
