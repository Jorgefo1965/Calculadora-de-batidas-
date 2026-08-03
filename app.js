let currentRole = 'rider';
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
  syncDistances();
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

  document.getElementById('human-step').addEventListener('input', syncDistances);
  document.getElementById('distance-meters').addEventListener('input', () => syncFrom('meters'));
  document.getElementById('distance-steps').addEventListener('input', () => syncFrom('steps'));

  document.getElementById('role-rider').addEventListener('click', () => setRole('rider'));
  document.getElementById('role-designer').addEventListener('click', () => setRole('designer'));

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

function setRole(role) {
  currentRole = role;
  const btnRider = document.getElementById('role-rider');
  const btnDesigner = document.getElementById('role-designer');
  const formRider = document.getElementById('form-rider-mode');
  const formDesigner = document.getElementById('form-designer-mode');

  if (role === 'rider') {
    btnRider.classList.add('active');
    btnDesigner.classList.remove('active');
    formRider.classList.remove('hidden');
    formDesigner.classList.add('hidden');
  } else {
    btnDesigner.classList.add('active');
    btnRider.classList.remove('active');
    formDesigner.classList.remove('hidden');
    formRider.classList.add('hidden');
  }
}

function syncFrom(source) {
  const humanStep = parseFloat(document.getElementById('human-step').value) || 1.0;
  const metersInput = document.getElementById('distance-meters');
  const stepsInput = document.getElementById('distance-steps');

  if (source === 'meters') {
    const metersVal = parseFloat(metersInput.value) || 0;
    const stepsCalc = (humanStep > 0) ? (metersVal / humanStep) : metersVal;
    stepsInput.value = Number.isInteger(stepsCalc) ? stepsCalc.toFixed(0) : stepsCalc.toFixed(1);
  } else {
    const stepsVal = parseFloat(stepsInput.value) || 0;
    const metersCalc = stepsVal * humanStep;
    metersInput.value = Number.isInteger(metersCalc) ? metersCalc.toFixed(0) : metersCalc.toFixed(2);
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
    syncFrom('steps');
  } else {
    btnSteps.classList.add('active');
    btnMeters.classList.remove('active');
    groupSteps.classList.remove('hidden');
    groupMeters.classList.add('hidden');
    syncFrom('meters');
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

  const { R, B } = getParabolas(jump1, jump2, height);

  let effectiveStride = horseStride;
  if (speed === 300) effectiveStride *= 0.96;
  if (speed === 375) effectiveStride *= 1.03;
  if (speed === 400) effectiveStride *= 1.05;

  if (ground === 'heavy') effectiveStride *= 0.97;
  if (ground === 'grass') effectiveStride *= 0.99;

  if (currentRole === 'rider') {
    calculateAsRider(effectiveStride, humanStep, R, B, jump1, jump2, speed, lineLabel, elemType);
  } else {
    calculateAsDesigner(effectiveStride, humanStep, R, B, jump1, jump2, speed, lineLabel, elemType);
  }
}

function calculateAsRider(effStride, humanStep, R, B, jump1, jump2, speed, lineLabel, elemType) {
  const trajectory = document.getElementById('trajectory').value;
  let realDistanceMeters = parseFloat(document.getElementById('distance-meters').value) || 0;
  let stepsCount = parseFloat(document.getElementById('distance-steps').value) || 0;

  if (realDistanceMeters <= 0) {
    alert('Ingresa una distancia o cantidad de pasos válida.');
    return;
  }

  const usefulDistance = realDistanceMeters - (R + B);
  const rawStrides = usefulDistance / effStride;
  let numberOfStrides = Math.round(rawStrides);
  
  if (elemType === 'double_combo' && usefulDistance < 8.5) {
    numberOfStrides = 1;
  }

  const expectedUsefulDist = numberOfStrides * effStride;
  const diff = usefulDistance - expectedUsefulDist;

  const adviceText = generateAdvice(stridesText(numberOfStrides, elemType), diff, speed, trajectory, jump1, jump2);

  lastCalculatedLine = {
    label: lineLabel,
    elemType: elemType,
    meters: realDistanceMeters,
    steps: stepsCount,
    strides: numberOfStrides,
    diff: diff,
    role: 'rider',
    advice: adviceText
  };

  renderRiderResults(realDistanceMeters, usefulDistance, numberOfStrides, diff, stepsCount, trajectory, jump1, jump2, speed, elemType, adviceText);
}

function generateAdvice(stridesLabel, diff, speed, trajectory, jump1, jump2) {
  const absDiff = Math.abs(diff);
  let advice = "";

  if (absDiff <= 0.22) {
    advice = `Línea fluida a ${speed} m/min. Mantén el ritmo constante sin alterar el galope.`;
  } else if (diff < -0.22) {
    advice = `Distancia apretada (-${absDiff.toFixed(2)} m). Recepciona firme, espalda atrás y retén suavemente.`;
    if (trajectory === 'curved') advice += `\n💡 CONSEJO TRAYECTORIA: Abre la curva por el EXTERIOR para ganar metros.`;
  } else {
    advice = `Distancia abierta (+${absDiff.toFixed(2)} m). Avanza con impulsión tras la caída.`;
    if (trajectory === 'curved') advice += `\n💡 CONSEJO TRAYECTORIA: Recorta la curva por el INTERIOR para acortar metros.`;
  }

  if (jump1 === 'water_open') advice += `\n⚠️ ATENCIÓN FOSO ENTRADA: Recepción larga; equilibra de inmediato tras la caída.`;
  if (jump2 === 'water_open') advice += `\n⚠️ ATENCIÓN FOSO SALIDA: Exige despegue lejano con velocidad.`;
  if (jump1 === 'water_tray' || jump2 === 'water_tray') advice += `\n⚠️ ATENCIÓN RÍA: Mantén la pierna puesta para evitar frenadas al mirar el agua.`;

  return advice;
}

function stridesText(strides, elemType) {
  let label = `${strides} ${strides === 1 ? 'TRANCO' : 'TRAMOS'}`;
  if (elemType === 'double_combo') label = `DOBLE: ${label}`;
  if (elemType === 'triple_combo') label = `TRIPLE: ${label}`;
  return label;
}

function renderRiderResults(realDist, usefulDist, strides, diff, steps, trajectory, jump1, jump2, speed, elemType, advice) {
  const card = document.getElementById('results-card');
  card.classList.remove('hidden');

  document.getElementById('badge-strides').innerText = stridesText(strides, elemType);
  document.getElementById('label-metric-1').innerText = "Distancia Real";
  document.getElementById('metric-1').innerText = `${realDist.toFixed(2)} m`;
  document.getElementById('label-metric-2').innerText = "Espacio Útil Galope";
  document.getElementById('metric-2').innerText = `${usefulDist.toFixed(2)} m`;
  document.getElementById('label-metric-3').innerText = "Pasos Caminados";
  document.getElementById('metric-3').innerText = `${steps.toFixed(1)} pasos`;
  document.getElementById('label-metric-4').innerText = "Ajuste / Diferencia";
  document.getElementById('metric-4').innerText = `${diff > 0 ? '+' : ''}${diff.toFixed(2)} m`;

  const absDiff = Math.abs(diff);
  let statusText = "CÓMODO / RÍTMICO";
  let statusClass = "badge-normal";

  if (absDiff <= 0.22) {
    statusText = "DISTANCIA PERFECTA";
    statusClass = "badge-normal";
  } else if (diff < -0.22) {
    statusText = "DISTANCIA CORTA / ESPERADA";
    statusClass = "badge-short";
  } else {
    statusText = "DISTANCIA LARGA / ABIERTA";
    statusClass = "badge-long";
  }

  document.getElementById('badge-status').innerText = statusText;
  document.getElementById('badge-status').className = `badge ${statusClass}`;
  document.getElementById('recommendation-text').innerText = advice;

  card.scrollIntoView({ behavior: 'smooth' });
}

function calculateAsDesigner(effStride, humanStep, R, B, jump1, jump2, speed, lineLabel, elemType) {
  const targetStrides = parseInt(document.getElementById('target-strides').value);
  const targetFeel = document.getElementById('target-feel').value;

  let baseUsefulDistance = targetStrides * effStride;
  let adviceNote = "";

  if (targetFeel === 'short') {
    baseUsefulDistance -= 0.40;
    adviceNote = "Obliga al jinete a retener y acortar el galope tras el primer salto.";
  } else if (targetFeel === 'long') {
    baseUsefulDistance += 0.40;
    adviceNote = "Obliga al jinete a abrir la mano y galopar con impulsión hacia adelante.";
  } else if (targetFeel === 'trap_short') {
    baseUsefulDistance -= 0.65;
    adviceNote = "Zona 'trampa' apretada. Forzará al jinete a sentarse atrás de inmediato.";
  } else if (targetFeel === 'trap_long') {
    baseUsefulDistance += 0.65;
    adviceNote = "Zona 'trampa' larga. Exigirá atacar con velocidad desde la curva anterior.";
  } else {
    adviceNote = `Distancia fluida calculada para el ritmo de ${speed} m/min.`;
  }

  const totalMeters = baseUsefulDistance + R + B;
  const totalSteps = totalMeters / humanStep;

  lastCalculatedLine = {
    label: lineLabel,
    elemType: elemType,
    meters: totalMeters,
    steps: totalSteps,
    strides: targetStrides,
    diff: 0,
    role: 'designer',
    advice: `Diseño para ${targetStrides} tramos a ${speed} m/min.\n💡 ${adviceNote}`
  };

  renderDesignerResults(totalMeters, totalSteps, targetStrides, targetFeel, R, B, effStride, adviceNote, speed);
}

function renderDesignerResults(meters, steps, strides, feel, R, B, effStride, adviceNote, speed) {
  const card = document.getElementById('results-card');
  card.classList.remove('hidden');

  document.getElementById('badge-strides').innerText = `DISEÑO: ${strides} TRAMOS`;
  document.getElementById('label-metric-1').innerText = "Distancia a Medir (Cinta)";
  document.getElementById('metric-1').innerText = `${meters.toFixed(2)} m`;
  document.getElementById('label-metric-2').innerText = "Pasos del Armador";
  document.getElementById('metric-2').innerText = `${steps.toFixed(1)} pasos`;
  document.getElementById('label-metric-3').innerText = "Caída + Batida (R+B)";
  document.getElementById('metric-3').innerText = `${(R+B).toFixed(2)} m`;
  document.getElementById('label-metric-4').innerText = `Tranco (${speed} m/min)`;
  document.getElementById('metric-4').innerText = `${effStride.toFixed(2)} m`;

  let badgeLabel = "ESTÁNDAR";
  let statusClass = "badge-normal";

  if (feel.includes('short')) {
    badgeLabel = "OBLIGA A ACORTAR";
    statusClass = "badge-short";
  } else if (feel.includes('long')) {
    badgeLabel = "OBLIGA A ALARGAR";
    statusClass = "badge-long";
  }

  let finalAdvice = `Para armar esta línea de **${strides} tramos** a **${speed} m/min**, debes colocar los saltos a **${meters.toFixed(2)} metros** (o **${steps.toFixed(1)} pasos** caminados).\n\n💡 **Intención Técnica:** ${adviceNote}`;

  document.getElementById('badge-status').innerText = badgeLabel;
  document.getElementById('badge-status').className = `badge ${statusClass}`;
  document.getElementById('recommendation-text').innerText = finalAdvice;

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

    div.innerHTML = `
      <div class="log-header">
        <div>
          <div class="log-title">#${index + 1}. ${item.label} (${item.strides} tramo/s)</div>
          <div class="log-sub">${item.meters.toFixed(2)}m • ${item.steps.toFixed(1)} pasos ${item.role === 'rider' ? `• ${statusNote} (${diffSign}${item.diff.toFixed(2)}m)` : '• Diseñado'}</div>
        </div>
        <span class="badge ${item.role === 'rider' ? (Math.abs(item.diff) <= 0.22 ? 'badge-normal' : (item.diff < 0 ? 'badge-short' : 'badge-long')) : 'badge-normal'}">${item.strides} T</span>
      </div>
      <div class="log-detail hidden" id="log-detail-${index}">
        <strong>💡 Recomendación Táctica:</strong><br>${item.advice}
      </div>
    `;

    // ACORDEÓN INTERACTIVO AL TOCAR LA LÍNEA
    div.addEventListener('click', () => {
      const detailDiv = document.getElementById(`log-detail-${index}`);
      detailDiv.classList.toggle('hidden');
    });

    container.appendChild(div);
  });
}

function resetCourseLog() {
  if (confirm('¿Quieres reiniciar la bitácora del recorrido completo?')) {
    courseLog = [];
    renderCourseLog();
  }
}
