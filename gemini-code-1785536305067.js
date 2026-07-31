let currentInputMode = 'meters';
let courseLog = [];
let lastCalculatedLine = null;

let horses = [
  { id: 'h1', name: 'Caballo Estándar', stride: 3.60 },
  { id: 'h2', name: 'Zafiro (Tranco Grande)', stride: 3.75 },
  { id: 'h3', name: 'Rayo (Tranco Corto)', stride: 3.45 }
];

document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  setupEventListeners();
  renderHorseSelect();
  syncDistances(); // Sincronizar al cargar
});

function initStorage() {
  const savedHorses = localStorage.getItem('galope_v11_horses');
  if (savedHorses) {
    try { horses = JSON.parse(savedHorses); } catch(e) {}
  }
}

function saveHorses() {
  localStorage.setItem('galope_v11_horses', JSON.stringify(horses));
}

function renderHorseSelect() {
  const select = document.getElementById('horse-select');
  select.innerHTML = '';
  horses.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.innerText = `${h.name} (${h.stride} m)`;
    select.appendChild(opt);
  });
  
  if (horses.length > 0) {
    document.getElementById('horse-stride').value = horses[0].stride;
  }
}

function setupEventListeners() {
  document.getElementById('horse-select').addEventListener('change', (e) => {
    const selected = horses.find(h => h.id === e.target.value);
    if (selected) {
      document.getElementById('horse-stride').value = selected.stride;
    }
  });

  // SINCRONIZACIÓN EN TIEMPO REAL MIENTRAS ESCRIBES
  document.getElementById('human-step').addEventListener('input', syncDistances);
  document.getElementById('distance-meters').addEventListener('input', () => syncFrom('meters'));
  document.getElementById('distance-steps').addEventListener('input', () => syncFrom('steps'));

  document.getElementById('mode-meters').addEventListener('click', () => setInputMode('meters'));
  document.getElementById('mode-steps').addEventListener('click', () => setInputMode('steps'));

  document.getElementById('btn-manage-horses').addEventListener('click', () => {
    document.getElementById('horse-manager-card').classList.remove('hidden');
  });

  document.getElementById('btn-close-horse-manager').addEventListener('click', () => {
    document.getElementById('horse-manager-card').classList.add('hidden');
  });

  document.getElementById('btn-save-horse').addEventListener('click', addNewHorse);
  document.getElementById('btn-delete-horse').addEventListener('click', deleteSelectedHorse);

  document.getElementById('btn-start-course').addEventListener('click', startCourse);
  document.getElementById('btn-edit-setup').addEventListener('click', editSetup);

  document.getElementById('btn-calculate').addEventListener('click', calculateLine);
  document.getElementById('btn-save-to-course').addEventListener('click', saveLineToLog);
  document.getElementById('btn-reset-course-log').addEventListener('click', resetCourseLog);
}

// FUNCIONES DE SINCRONIZACIÓN AUTOMÁTICA
function syncFrom(source) {
  const humanStep = parseFloat(document.getElementById('human-step').value) || 1.0;
  const metersInput = document.getElementById('distance-meters');
  const stepsInput = document.getElementById('distance-steps');

  if (source === 'meters') {
    const metersVal = parseFloat(metersInput.value) || 0;
    stepsInput.value = (humanStep > 0) ? (metersVal / humanStep).toFixed(humanStep === 1 ? 0 : 1) : metersVal;
  } else {
    const stepsVal = parseFloat(stepsInput.value) || 0;
    metersInput.value = (stepsVal * humanStep).toFixed(2);
  }
}

function syncDistances() {
  if (currentInputMode === 'meters') {
    syncFrom('meters');
  } else {
    syncFrom('steps');
  }
}

function setInputMode(mode) {
  currentInputMode = mode;
  const btnMeters = document.getElementById('mode-meters');
  const btnSteps = document.getElementById('mode-steps');
  const groupMeters = document.getElementById('input-group-meters');
  const groupSteps = document.getElementById('input-group-steps');

  if (mode === 'meters') {
    btnMeters.classList.add('active');
    btnSteps.classList.remove('active');
    groupMeters.classList.remove('hidden');
    groupSteps.classList.add('hidden');
    syncFrom('steps'); // Sincroniza metros según los pasos
  } else {
    btnSteps.classList.add('active');
    btnMeters.classList.remove('active');
    groupSteps.classList.remove('hidden');
    groupMeters.classList.add('hidden');
    syncFrom('meters'); // Sincroniza pasos según los metros
  }
}

function addNewHorse() {
  const name = document.getElementById('new-horse-name').value.trim();
  const stride = parseFloat(document.getElementById('new-horse-stride').value);

  if (!name) {
    alert('Ingresa el nombre del caballo.');
    return;
  }

  const newHorse = { id: 'h_' + Date.now(), name, stride };
  horses.push(newHorse);
  saveHorses();
  renderHorseSelect();

  document.getElementById('horse-select').value = newHorse.id;
  document.getElementById('horse-stride').value = newHorse.stride;
  document.getElementById('new-horse-name').value = '';
  document.getElementById('horse-manager-card').classList.add('hidden');
}

function deleteSelectedHorse() {
  const selectedId = document.getElementById('horse-select').value;
  if (horses.length <= 1) {
    alert('Debes mantener al menos un caballo en el perfil.');
    return;
  }

  horses = horses.filter(h => h.id !== selectedId);
  saveHorses();
  renderHorseSelect();
  document.getElementById('horse-manager-card').classList.add('hidden');
}

function startCourse() {
  const selectedHorseId = document.getElementById('horse-select').value;
  const currentHorse = horses.find(h => h.id === selectedHorseId);
  const heightText = document.getElementById('height').options[document.getElementById('height').selectedIndex].text;
  const speedVal = document.getElementById('speed').value;
  const groundText = document.getElementById('ground').options[document.getElementById('ground').selectedIndex].text;

  document.getElementById('sum-horse').innerText = `🐴 ${currentHorse ? currentHorse.name : 'Caballo'}`;
  document.getElementById('sum-height').innerText = `📏 ${heightText}`;
  document.getElementById('sum-speed').innerText = `⏱️ ${speedVal} m/min`;
  document.getElementById('sum-ground').innerText = `🌱 ${groundText}`;

  document.getElementById('setup-card').classList.add('hidden');
  document.getElementById('course-summary-bar').classList.remove('hidden');
  document.getElementById('walk-card').classList.remove('hidden');
  document.getElementById('course-log-card').classList.remove('hidden');

  syncDistances();
  document.getElementById('walk-card').scrollIntoView({ behavior: 'smooth' });
}

function editSetup() {
  document.getElementById('setup-card').classList.remove('hidden');
  document.getElementById('course-summary-bar').classList.add('hidden');
  document.getElementById('walk-card').classList.add('hidden');
  document.getElementById('results-card').classList.add('hidden');
  document.getElementById('course-log-card').classList.add('hidden');

  document.getElementById('setup-card').scrollIntoView({ behavior: 'smooth' });
}

function getParabolas(jump1, jump2, height) {
  let R = 1.80;
  let B = 1.80;

  if (jump1 === 'oxer') R = 2.05;
  if (jump1 === 'triplebar') R = (height >= 1.30) ? 2.30 : 2.20;
  if (jump1 === 'water_open') R = 2.50; // Foso
  if (jump1 === 'water_tray') R = 1.95; // Ría

  if (jump2 === 'oxer') B = 1.95;
  if (jump2 === 'triplebar') B = 1.85;
  if (jump2 === 'water_open') B = 2.30;
  if (jump2 === 'water_tray') B = 1.90;

  if (height >= 1.30) {
    R += 0.10;
    B += 0.10;
  }

  return { R, B };
}

function calculateLine() {
  const horseStride = parseFloat(document.getElementById('horse-stride').value);
  const humanStep = parseFloat(document.getElementById('human-step').value) || 1.0;
  const height = parseFloat(document.getElementById('height').value);
  const speed = parseInt(document.getElementById('speed').value);
  const ground = document.getElementById('ground').value;

  const lineLabel = document.getElementById('line-label').value.trim() || "Línea";
  const elemType = document.getElementById('elem-type').value;
  const jump1 = document.getElementById('jump-1').value;
  const jump2 = document.getElementById('jump-2').value;
  const trajectory = document.getElementById('trajectory').value;

  const { R, B } = getParabolas(jump1, jump2, height);

  let effectiveStride = horseStride;
  if (speed === 300) effectiveStride *= 0.96;
  if (speed === 375) effectiveStride *= 1.03;
  if (speed === 400) effectiveStride *= 1.05;

  if (ground === 'heavy') effectiveStride *= 0.97;
  if (ground === 'grass') effectiveStride *= 0.99;

  let realDistanceMeters = parseFloat(document.getElementById('distance-meters').value) || 0;
  let stepsCount = parseFloat(document.getElementById('distance-steps').value) || 0;

  if (realDistanceMeters <= 0) {
    alert('Ingresa una distancia o cantidad de pasos válida.');
    return;
  }

  const usefulDistance = realDistanceMeters - (R + B);
  const rawStrides = usefulDistance / effectiveStride;
  
  let numberOfStrides = Math.round(rawStrides);
  
  if (elemType === 'double_combo' && usefulDistance < 8.5) {
    numberOfStrides = 1;
  }

  const expectedUsefulDist = numberOfStrides * effectiveStride;
  const diff = usefulDistance - expectedUsefulDist;

  lastCalculatedLine = {
    label: lineLabel,
    elemType: elemType,
    meters: realDistanceMeters,
    steps: stepsCount,
    strides: numberOfStrides,
    diff: diff,
    speed: speed,
    trajectory: trajectory,
    jump1: jump1,
    jump2: jump2
  };

  renderLineResults(realDistanceMeters, usefulDistance, numberOfStrides, diff, stepsCount, trajectory, jump1, jump2, speed, elemType);
}

function renderLineResults(realDist, usefulDist, strides, diff, steps, trajectory, jump1, jump2, speed, elemType) {
  const card = document.getElementById('results-card');
  card.classList.remove('hidden');

  let stridesLabel = `${strides} ${strides === 1 ? 'TRANCO' : 'TRAMOS'}`;
  if (elemType === 'double_combo') stridesLabel = `DOBLE: ${stridesLabel}`;
  if (elemType === 'triple_combo') stridesLabel = `TRIPLE: ${stridesLabel}`;

  const formattedSteps = (steps % 1 === 0) ? steps.toFixed(0) : steps.toFixed(1);

  document.getElementById('badge-strides').innerText = stridesLabel;
  document.getElementById('metric-1').innerText = `${realDist.toFixed(2)} m`;
  document.getElementById('metric-2').innerText = `${usefulDist.toFixed(2)} m`;
  document.getElementById('metric-3').innerText = `${formattedSteps} pasos`;
  document.getElementById('metric-4').innerText = `${diff > 0 ? '+' : ''}${diff.toFixed(2)} m`;

  const absDiff = Math.abs(diff);
  let statusText = "CÓMODO / RÍTMICO";
  let statusClass = "badge-normal";
  let advice = "";

  if (absDiff <= 0.22) {
    statusText = "DISTANCIA PERFECTA";
    statusClass = "badge-normal";
    advice = `Línea de ${strides} tramos muy fluida a ${speed} m/min. Mantén el ritmo constante.`;
  } else if (diff < -0.22) {
    statusText = "DISTANCIA CORTA / ESPERADA";
    statusClass = "badge-short";
    advice = `Distancia apretada (-${absDiff.toFixed(2)} m). Recepciona firme, espalda atrás y retén suavemente.`;
    if (trajectory === 'curved') advice += `\n💡 CONSEJO TRAYECTORIA: Abre la curva por el EXTERIOR.`;
  } else {
    statusText = "DISTANCIA LARGA / ABIERTA";
    statusClass = "badge-long";
    advice = `Distancia abierta (+${absDiff.toFixed(2)} m). Avanza con impulsión tras la caída.`;
    if (trajectory === 'curved') advice += `\n💡 CONSEJO TRAYECTORIA: Recorta la curva por el INTERIOR.`;
  }

  if (jump1 === 'water_open') advice += `\n⚠️ ATENCIÓN FOSO ENTRADA: Recepción larga; equilibra de inmediato.`;
  if (jump2 === 'water_open') advice += `\n⚠️ ATENCIÓN FOSO SALIDA: Exige despegue lejano con velocidad.`;
  if (jump1 === 'water_tray' || jump2 === 'water_tray') advice += `\n⚠️ ATENCIÓN RÍA: Mantén la pierna puesta para evitar frenadas.`;

  document.getElementById('badge-status').innerText = statusText;
  document.getElementById('badge-status').className = `badge ${statusClass}`;
  document.getElementById('recommendation-text').innerText = advice;

  card.scrollIntoView({ behavior: 'smooth' });
}

function saveLineToLog() {
  if (!lastCalculatedLine) return;

  courseLog.push(lastCalculatedLine);
  renderCourseLog();
  alert(`📌 Línea "${lastCalculatedLine.label}" guardada en la bitácora.`);
}

function renderCourseLog() {
  const container = document.getElementById('course-log-list');
  container.innerHTML = '';

  if (courseLog.length === 0) {
    container.innerHTML = `<p class="empty-log">Aún no has guardado líneas. Calcula y presiona 'Guardar en Bitácora' para armar tu mapa de la prueba.</p>`;
    return;
  }

  courseLog.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'log-item';
    
    const diffSign = item.diff > 0 ? '+' : '';
    const statusNote = Math.abs(item.diff) <= 0.22 ? 'Fluida' : (item.diff < 0 ? 'Apretada' : 'Abierta');
    const formattedItemSteps = (item.steps % 1 === 0) ? item.steps.toFixed(0) : item.steps.toFixed(1);

    div.innerHTML = `
      <div>
        <div class="log-title">#${index + 1}. ${item.label} (${item.strides} tramo/s)</div>
        <div class="log-sub">${item.meters.toFixed(2)}m • ${formattedItemSteps} pasos • ${statusNote} (${diffSign}${item.diff.toFixed(2)}m)</div>
      </div>
      <span class="badge ${Math.abs(item.diff) <= 0.22 ? 'badge-normal' : (item.diff < 0 ? 'badge-short' : 'badge-long')}">${item.strides} T</span>
    `;
    container.appendChild(div);
  });
}

function resetCourseLog() {
  if (confirm('¿Quieres reiniciar la bitácora del recorrido completo?')) {
    courseLog = [];
    renderCourseLog();
  }
}