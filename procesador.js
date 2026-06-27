const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const EXCEL_PATH  = path.join(__dirname, 'respuestas.xlsx');
const OUTPUT_PATH = path.join(__dirname, 'datos_publicos.json');

function processData() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Error: no se encontró ${EXCEL_PATH}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const data     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const rows = data.slice(1).filter(row => row.some(c => c !== ''));

  let totalInscritos = rows.length;
  let paisesSet = new Set();
  let asistentes = 0, ponentesInvestigacion = 0, ponentesEmprendimiento = 0;
  let trabajosRecibidos = 0, pitchesRecibidos = 0;
  let matriz = {};
  let participantes = [];

  rows.forEach(row => {
    const str = i => (row[i] || '').toString().trim();

    const nombre          = str(3)  || 'Anónimo';
    const pais            = str(5)  || 'No especificado';
    const institucion     = str(7);
    const otraInstitucion = str(8);
    const perfil          = str(9)  || 'No especificado';
    const modalidad       = str(10);
    const tipoTrabajo     = str(12);

    const instFinal = (
      institucion === 'Otra  Universidad, Empresa u Organización' ||
      institucion === 'Otra Universidad, Empresa u Organización'
    ) ? otraInstitucion : institucion;

    if (pais) paisesSet.add(pais);

    const esAsistente      = modalidad === 'Asistente' ? 1 : 0;
    const esInvestigacion  = modalidad.includes('Investigación');
    const esEmprendimiento = modalidad.includes('Emprendimiento') ? 1 : 0;
    const esPropuesta      = esInvestigacion && tipoTrabajo.includes('Propuesta')              ? 1 : 0;
    const esEnDesarrollo   = esInvestigacion && tipoTrabajo.includes('en desarrollo')           ? 1 : 0;
    const esFinalizada     = esInvestigacion && tipoTrabajo.includes('finalizada')              ? 1 : 0;
    const esInnovacion     = esInvestigacion && tipoTrabajo.includes('innovación pedagógica')   ? 1 : 0;

    if (esAsistente)      asistentes++;
    if (esInvestigacion)  { ponentesInvestigacion++;   trabajosRecibidos++; }
    if (esEmprendimiento) { ponentesEmprendimiento++;  pitchesRecibidos++;  }

    const clave = `${pais}|||${perfil}`;
    if (!matriz[clave]) {
      matriz[clave] = { pais, perfil, asistente: 0, propuesta: 0, enDesarrollo: 0, finalizada: 0, innovacion: 0, emprendimiento: 0 };
    }
    matriz[clave].asistente      += esAsistente;
    matriz[clave].propuesta      += esPropuesta;
    matriz[clave].enDesarrollo   += esEnDesarrollo;
    matriz[clave].finalizada     += esFinalizada;
    matriz[clave].innovacion     += esInnovacion;
    matriz[clave].emprendimiento += esEmprendimiento;

    let trabajo = '—', documento = '';
    if (esInvestigacion) {
      trabajo   = str(14) || 'Sin título';
      documento = str(18);
    } else if (esEmprendimiento) {
      trabajo   = str(20) || 'Sin nombre';
      documento = str(23);
    }

    // Solo datos públicos — sin emails, teléfonos ni DNI
    participantes.push({ nombre, pais, institucion: instFinal, perfil, modalidad, trabajo, documento });
  });

  const output = {
    generado: new Date().toISOString(),
    kpis: {
      totalInscritos,
      paisesRepresentados: paisesSet.size,
      asistentes,
      ponentesInvestigacion,
      ponentesEmprendimiento,
      trabajosRecibidos,
      pitchesRecibidos,
    },
    matriz: Object.values(matriz),
    participantes,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  console.log(`✓ datos_publicos.json generado — ${participantes.length} participantes — ${new Date().toLocaleString('es-PE')}`);
}

processData();
