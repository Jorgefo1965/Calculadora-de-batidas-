let currentRole = 'rider';
let currentInputMode = 'meters';
let horses = [
  { id: 'h1', name: 'Caballo Estándar', stride: 3.60 },
  { id: 'h2', name: 'Zafiro (Tranco Grande)', stride: 3.75 },
  { id: 'h3', name: 'Rayo (Tranco Corto)', stride: 3.45 }
];

document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  setupEventListeners();
  renderHorseSelect();
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

  document.getElementById('btn-calculate').addEventListener('click', processCalculation);
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
  } else {
    btnSteps.classList.add('active');
    btnMeters.classList.remove('active');
    groupSteps.classList.remove('hidden');
    groupMeters.classList.add('hidden');
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

function processCalculation() {
  const horseStride = parseFloat(document.getElementById('horse-stride').value);
  const humanStep = parseFloat(document.getElementById('human-step').value);
  const jump1 = document.getElementById('jump-1').value;
  const jump2 = document.getElementById('jump-2').value;
  const height = parseFloat(document.getElementById('height').value);
  const speed = parseInt(document.getElementById('speed').value);
  const ground = document.getElementById('ground').value;

  const { R, B } = getParabolas(jump1, jump2, height);

  // AJUSTE POR VELOCIDAD (m/min) Y SUELO
  let effectiveStride = horseStride;
  
  if (speed === 300) effectiveStride *= 0.96; // Ritmo lento (-4%)
  if (speed === 375) effectiveStride *= 1.03; // Ritmo rápido (+3%)
  if (speed === 400) effectiveStride *= 1.05; // Gran Premio / Desempate (+5%)

  if (ground === 'heavy') effectiveStride *= 0.97;
  if (ground === 'grass') effectiveStride *= 0.99;

  if (currentRole === 'rider') {
    calculateAsRider(effectiveStride, humanStep, R, B, jump1, jump2, speed);
  } else {
    calculateAsDesigner(effectiveStride, humanStep, R, B, jump1, jump2, speed);
  }
}

// MODO JINETE
function calculateAsRider(effStride, humanStep, R, B, jump1, jump2, speed) {
  const trajectory = document.getElementById('trajectory').value;
  let realDistanceMeters = 0;

  if (currentInputMode === 'meters') {
    realDistanceMeters = parseFloat(document.getElementById('distance-meters').value);
  } else {
    const steps = parseFloat(document.getElementById('distance-steps').value);
    realDistanceMeters = steps * humanStep;
  }

  if (!realDistanceMeters || realDistanceMeters <= 0) {
    alert('Ingresa una distancia o pasos válidos.');
    return;
  }

  const usefulDistance = realDistanceMeters - (R + B);
  const rawStrides = usefulDistance / effStride;
  const numberOfStrides = Math.round(rawStrides);
  const expectedUsefulDist = numberOfStrides * effStride;
  const diff = usefulDistance - expectedUsefulDist;

  const stepsCount = Math.round(realDistanceMeters / humanStep);

  renderRiderResults(realDistanceMeters, usefulDistance, numberOfStrides, diff, effStride, stepsCount, trajectory, jump1, jump2, speed);
}

function renderRiderResults(realDist, usefulDist, strides, diff, effStride, steps, trajectory, jump1, jump2, speed) {
  const card = document.getElementById('results-card');
  card.classList.remove('hidden');

  document.getElementById('badge-strides').innerText = `${strides} ${strides === 1 ? 'TRANCO' : 'TRAMOS'}`;
  
  document.getElementById('label-metric-1').innerText = "Distancia Real";
  document.getElementById('metric-1').innerText = `${realDist.toFixed(2)} m`;

  document.getElementById('label-metric-2').innerText = "Espacio Útil Galope";
  document.getElementById('metric-2').innerText = `${usefulDist.toFixed(2)} m`;

  document.getElementById('label-metric-3').innerText = "Pasos Caminados";
  document.getElementById('metric-3').innerText = `${steps} pasos`;

  document.getElementById('label-metric-4').innerText = `Tranco (${speed} m/min)`;
  document.getElementById('metric-4').innerText = `${effStride.toFixed(2)} m`;

  const absDiff = Math.abs(diff);
  let statusText = "CÓMODO / RÍTMICO";
  let statusClass = "badge-normal";
  let advice = "";

  if (absDiff <= 0.22) {
    statusText = "DISTANCIA PERFECTA";
    statusClass = "badge-normal";
    advice = `La línea de ${strides} tramos viene fluida para un ritmo de ${speed} m/min.`;
  } else if (diff < -0.22) {
    statusText = "DISTANCIA CORTA / ESPERADA";
    statusClass = "badge-short";
    advice = `La distancia viene apretada (-${absDiff.toFixed(2)} m). A ${speed} m/min el caballo llegará con inercia, siéntate atrás inmediatamente al caer.`;
    if (trajectory === 'curved') {
      advice += `\n💡 CONSEJO TRAYECTORIA: Abre la curva por el EXTERIOR para ganar metros.`;
    }
  } else {
    statusText = "DISTANCIA LARGA / ABIERTA";
    statusClass = "badge-long";
    advice = `La distancia viene abierta (+${absDiff.toFixed(2)} m). Aumenta la impulsión tras la recepción para cubrir el espacio a ${speed} m/min.`;
    if (trajectory === 'curved') {
      advice += `\n💡 CONSEJO TRAYECTORIA: Recorta la curva por el INTERIOR para acortar metros.`;
    }
  }

  if (jump1 === 'water_open') advice += `\n⚠️ ATENCIÓN FOSO ENTRADA: Recepción muy larga; equilibra de inmediato.`;
  if (jump2 === 'water_open') advice += `\n⚠️ ATENCIÓN FOSO SALIDA: Exige despegue lejano con velocidad.`;
  if (jump1 === 'water_tray' || jump2 === 'water_tray') advice += `\n⚠️ ATENCIÓN RÍA: Mantén la pierna puesta para evitar frenadas.`;

  document.getElementById('badge-status').innerText = statusText;
  document.getElementById('badge-status').className = `badge ${statusClass}`;
  document.getElementById('recommendation-text').innerText = advice;

  card.scrollIntoView({ behavior: 'smooth' });
}

// MODO ARMADOR
function calculateAsDesigner(effStride, humanStep, R, B, jump1, jump2, speed) {
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
    adviceNote = `Distancia fluida calculada para el ritmo reglamentario de ${speed} m/min.`;
  }

  const totalMeters = baseUsefulDistance + R + B;
  const totalSteps = Math.round(totalMeters / humanStep);

  renderDesignerResults(totalMeters, totalSteps, targetStrides, targetFeel, R, B, effStride, adviceNote, speed);
}

function renderDesignerResults(meters, steps, strides, feel, R, B, effStride, adviceNote, speed) {
  const card = document.getElementById('results-card');
  card.classList.remove('hidden');

  document.getElementById('badge-strides').innerText = `DISEÑO: ${strides} TRAMOS`;

  document.getElementById('label-metric-1').innerText = "Distancia a Medir (Cinta)";
  document.getElementById('metric-1').innerText = `${meters.toFixed(2)} m`;

  document.getElementById('label-metric-2').innerText = "Pasos del Armador";
  document.getElementById('metric-2').innerText = `${steps} pasos`;

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

  let finalAdvice = `Para armar esta línea de **${strides} tramos** a una velocidad de **${speed} m/min**, debes colocar los elementos a **${meters.toFixed(2)} metros** (o **${steps} pasos** caminados).\n\n💡 **Intención Técnica:** ${adviceNote}`;

  document.getElementById('badge-status').innerText = badgeLabel;
  document.getElementById('badge-status').className = `badge ${statusClass}`;
  document.getElementById('recommendation-text').innerText = finalAdvice;

  card.scrollIntoView({ behavior: 'smooth' });
}