let rawData = { kpis: {}, matriz: [], participantes: [] };

const KPI_CONFIG = {
  totalInscritos:         { label: 'Total Inscritos',      bar: 'bg-blue-500',    num: 'text-blue-700'    },
  paisesRepresentados:    { label: 'Países',               bar: 'bg-violet-500',  num: 'text-violet-700'  },
  asistentes:             { label: 'Asistentes',           bar: 'bg-slate-400',   num: 'text-slate-600'   },
  ponentesInvestigacion:  { label: 'Ponentes Inv.',        bar: 'bg-indigo-500',  num: 'text-indigo-700'  },
  ponentesEmprendimiento: { label: 'Ponentes Emp.',        bar: 'bg-orange-400',  num: 'text-orange-600'  },
  trabajosRecibidos:      { label: 'Total de trabajos',    bar: 'bg-teal-500',    num: 'text-teal-700'    },
  pitchesRecibidos:       { label: 'Pitches',              bar: 'bg-emerald-500', num: 'text-emerald-700' },
};

window.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const res = await fetch('datos_publicos.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderDashboard(data);
  } catch {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
  }
}

function renderDashboard(data) {
  rawData = data;

  if (data.generado) {
    const d = new Date(data.generado);
    document.getElementById('ultima-actualizacion').textContent =
      d.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // KPIs
  document.getElementById('kpis').innerHTML = Object.keys(data.kpis).map(key => {
    const c = KPI_CONFIG[key] || { label: key, bar: 'bg-gray-400', num: 'text-gray-700' };
    return `
      <div class="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center gap-2">
        <div class="w-1.5 h-7 ${c.bar} rounded-full opacity-80"></div>
        <p class="text-2xl font-bold ${c.num}">${data.kpis[key]}</p>
        <p class="text-xs font-medium text-gray-400 text-center leading-tight">${c.label}</p>
      </div>`;
  }).join('');

  // Matriz
  document.getElementById('tabla-matriz').innerHTML = data.matriz.map(row => `
    <tr class="border-b hover:bg-gray-50 transition">
      <td class="p-3 font-medium text-gray-900 whitespace-nowrap">${row.pais}</td>
      <td class="p-3 text-gray-600 whitespace-nowrap">${row.perfil}</td>
      ${numCell(row.asistente)}${numCell(row.propuesta)}${numCell(row.enDesarrollo)}
      ${numCell(row.finalizada)}${numCell(row.emprendimiento)}
    </tr>`).join('');

  filterAndRenderTable();
  setupFilters();

  // Mostrar app, ocultar loading con fade
  const loading = document.getElementById('loading');
  loading.style.opacity = '0';
  setTimeout(() => {
    loading.classList.add('hidden');
    document.getElementById('app').classList.remove('opacity-0');
  }, 280);
}

function numCell(val) {
  return val > 0
    ? `<td class="p-3 text-center font-semibold text-gray-900">${val}</td>`
    : `<td class="p-3 text-center text-gray-200">—</td>`;
}

function setupFilters() {
  ['nombre', 'pais', 'institucion', 'perfil', 'modalidad', 'trabajo'].forEach(id => {
    document.getElementById(`filter-${id}`).addEventListener('input', filterAndRenderTable);
  });
}

function filterAndRenderTable() {
  const val = id => document.getElementById(`filter-${id}`).value.toLowerCase();
  const fNombre    = val('nombre');
  const fPais      = val('pais');
  const fInst      = val('institucion');
  const fPerfil    = val('perfil');
  const fMod       = val('modalidad');
  const fTrabajo   = val('trabajo');

  const filtered = rawData.participantes.filter(p =>
    p.nombre.toLowerCase().includes(fNombre)    &&
    p.pais.toLowerCase().includes(fPais)         &&
    p.institucion.toLowerCase().includes(fInst)  &&
    p.perfil.toLowerCase().includes(fPerfil)     &&
    p.modalidad.toLowerCase().includes(fMod)     &&
    p.trabajo.toLowerCase().includes(fTrabajo)
  );

  const total = rawData.participantes.length;
  document.getElementById('count-label').textContent =
    filtered.length === total
      ? `${total} participantes`
      : `${filtered.length} de ${total} participantes`;

  document.getElementById('tabla-participantes').innerHTML = filtered.map(p => {
    let btnAcceso = '<span class="text-gray-300 text-xs">—</span>';
    if (p.documento) {
      const esPitch  = p.modalidad.includes('Emprendimiento');
      const texto    = esPitch ? 'Pitch' : 'Trabajo';
      const color    = esPitch
        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
        : 'text-blue-700 bg-blue-50 hover:bg-blue-100';
      btnAcceso = `<a href="${p.documento}" target="_blank" rel="noopener" class="px-2.5 py-1 rounded-lg text-xs font-medium transition ${color}">${texto}</a>`;
    }
    return `
      <tr class="border-b hover:bg-gray-50 transition">
        <td class="p-3 font-medium text-gray-900 whitespace-nowrap">${p.nombre}</td>
        <td class="p-3 text-gray-600 whitespace-nowrap">${p.pais}</td>
        <td class="p-3 text-gray-500 max-w-[200px] truncate" title="${p.institucion}">${p.institucion || '—'}</td>
        <td class="p-3 text-gray-600 whitespace-nowrap">${p.perfil}</td>
        <td class="p-3 text-gray-500 whitespace-nowrap">${p.modalidad}</td>
        <td class="p-3 text-gray-700 max-w-[240px] truncate" title="${p.trabajo}">${p.trabajo}</td>
        <td class="p-3 text-center">${btnAcceso}</td>
      </tr>`;
  }).join('');
}
