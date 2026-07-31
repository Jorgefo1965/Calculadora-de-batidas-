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

  document.getElementById('btn-calculate').addEventListener('click', calculateStrategy);
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

  const newHorse = {
    id: 'h_' + Date.now(),
    name: name,
    stride: stride
  };

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

function calculateStrategy() {
  const horseStride = parseFloat(document.getElementById('horse-stride').value);
  const humanStep = parseFloat(document.getElementById('human-step').value);
  const calcMode = document.getElementById('calc-mode').value;
  const jump1 = document.getElementById('jump-1').value;
  const jump2 = document.getElementById('jump-2').value;
  const height = parseFloat(document.getElementById('height').value);
  const ground = document.getElementById('ground').value;

  let realDistanceMeters = 0;
  if (currentInputMode === 'meters') {
    realDistanceMeters = parseFloat(document.getElementById('distance-meters').value);
  } else {
    const steps = parseFloat(document.getElementById('distance-steps').value);
    realDistanceMeters = steps * humanStep;
  }

  if (!realDistanceMeters || realDistanceMeters <= 0) {
    alert('Ingresa una distancia o cantidad de pasos válida.');
    return;
  }

  let R = 1.80;
  let B = 1.80;

  if (jump1 === 'oxer') R = 2.05;
  if (jump1 === 'triplebar') R = 2.20;
  if (jump1 === 'water_open') R = 2.50; 
  if (jump1 === 'water_tray') R = 1.95;

  if (jump2 === 'oxer') B = 1.95;
  if (jump2 === 'triplebar') B = 1.85;
  if (jump2 === 'water_open') B = 2.30; 
  if (jump2 === 'water_tray') B = 1.90;

  if (height >= 1.30) {
    R += 0.10;
    B += 0.10;
  }

  let effectiveStride = horseStride;
  if (ground === 'heavy') effectiveStride *= 0.97;
  if (ground === 'grass') effectiveStride *= 0.99;

  const usefulDistance = realDistanceMeters - (R + B);
  const rawStrides = usefulDistance / effectiveStride;
  
  let numberOfStrides = Math.round(rawStrides);
  
  if (calcMode === 'double' && usefulDistance < 8.5) {
    numberOfStrides = 1;
  }

  const expectedUsefulDist = numberOfStrides * effectiveStride;
  const diff = usefulDistance - expectedUsefulDist;

  renderDiagnosis(realDistanceMeters, usefulDistance, numberOfStrides, diff, effectiveStride, jump1, jump2, calcMode);
}

function renderDiagnosis(realDist, usefulDist, strides, diff, effStride, jump1, jump2, calcMode) {
  const card = document.getElementById('results-card');
  const bStrides = document.getElementById('badge-strides');
  const bStatus = document.getElementById('badge-status');
  const mReal = document.getElementById('metric-real-dist');
  const mUseful = document.getElementById('metric-useful');
  const mDiff = document.getElementById('metric-diff');
  const mEff = document.getElementById('metric-effective-stride');
  const recText = document.getElementById('recommendation-text');

  card.classList.remove('hidden');

  bStrides.innerText = `${strides} ${strides === 1 ? 'TRANCO' : 'TRAMOS'}`;
  mReal.innerText = `${realDist.toFixed(2)} m`;
  mUseful.innerText = `${usefulDist.toFixed(2)} m`;
  mEff.innerText = `${effStride.toFixed(2)} m`;

  const absDiff = Math.abs(diff);
  let statusText = "CÓMODO / RÍTMICO";
  let statusClass = "badge-normal";
  let advice = "";

  if (absDiff <= 0.22) {
    statusText = "DISTANCIA PERFECTA";
    statusClass = "badge-normal";
    advice = `La línea de ${strides} tramos viene muy fluida. Mantén el ritmo natural y deja que el caballo resuelva sin cambios de velocidad bruscos.`;
  } else if (diff < -0.22) {
    statusText = "DISTANCIA CORTA / ESPERADA";
    statusClass = "badge-short";
    advice = `La distancia viene apretada (-${absDiff.toFixed(2)} m). Recepciona firme, espalda atrás y retén suavemente desde la salida del primer salto. No empujes con las piernas hacia adelante.`;
  } else {
    statusText = "DISTANCIA LARGA / ABIERTA";
    statusClass = "badge-long";
    advice = `La distancia viene abierta (+${absDiff.toFixed(2)} m). Abre la mano tras la recepción y avanza con impulsión desde el 1er y 2º tranco para llegar con comodidad al despegue.`;
  }

  if (jump1 === 'water_open') {
    advice += ` ⚠️ ATENCIÓN FOSO DE AGUA DE ENTRADA: La recepción será muy larga y desplazada hacia adelante; prepárate para equilibrar de inmediato.`;
  }
  if (jump2 === 'water_open') {
    advice += ` ⚠️ ATENCIÓN FOSO DE AGUA DE SALIDA: Requiere despegue lejano con máxima impulsión. Asegúrate de avanzar sin vacilar.`;
  }
  if (calcMode === 'double' && strides === 1) {
    advice += ` 📌 DOBLE A 1 TRAMO: Prioriza el equilibrio en la recepción del 1er salto para no pegarte a la salida.`;
  }

  bStatus.innerText = statusText;
  bStatus.className = `badge ${statusClass}`;
  mDiff.innerText = `${diff > 0 ? '+' : ''}${diff.toFixed(2)} m`;
  recText.innerText = advice;

  card.scrollIntoView({ behavior: 'smooth' });
}