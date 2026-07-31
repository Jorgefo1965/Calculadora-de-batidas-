document.addEventListener('DOMContentLoaded', () => {
  // Cargar perfil guardado si existe
  loadSavedProfile();

  document.getElementById('btn-calculate').addEventListener('click', calculateStrides);
});

function loadSavedProfile() {
  const savedName = localStorage.getItem('galope_horse_name');
  const savedStride = localStorage.getItem('galope_horse_stride');

  if (savedName) document.getElementById('horse-name').value = savedName;
  if (savedStride) document.getElementById('stride-length').value = savedStride;
}

function calculateStrides() {
  // 1. Obtención de datos
  const horseName = document.getElementById('horse-name').value;
  let baseStride = parseFloat(document.getElementById('stride-length').value);
  const distance = parseFloat(document.getElementById('distance').value);
  const jump1 = document.getElementById('jump-1').value;
  const jump2 = document.getElementById('jump-2').value;
  const height = parseFloat(document.getElementById('height').value);
  const ground = document.getElementById('ground').value;

  // Guardar datos del caballo para futuras ocasiones
  localStorage.setItem('galope_horse_name', horseName);
  localStorage.setItem('galope_horse_stride', baseStride);

  if (!distance || distance <= 0) {
    alert('Por favor ingresa una distancia válida en metros.');
    return;
  }

  // 2. Cálculo de Rebounds/Parábolas (Caída R y Batida B)
  let R = 1.80; // Caída base
  let B = 1.80; // Batida base

  // Ajustes por tipo de salto
  if (jump1 === 'oxer') R = 2.00;
  if (jump1 === 'triplebar') R = 2.15;

  if (jump2 === 'oxer') B = 1.95;
  if (jump2 === 'triplebar') B = 1.85;

  // Ajuste por altura (> 1.30m exige mayor parábola)
  if (height >= 1.30) {
    R += 0.10;
    B += 0.10;
  }

  // Ajuste de tranco por calidad de suelo
  let effectiveStride = baseStride;
  if (ground === 'heavy') effectiveStride *= 0.97; // El suelo pesado acorta el tranco un 3%
  if (ground === 'grass') effectiveStride *= 0.99;

  // 3. Mathemática del Galope
  const usefulDistance = distance - (R + B);
  const rawStrides = usefulDistance / effectiveStride;
  const numberOfStrides = Math.round(rawStrides);
  const expectedDistanceForStrides = numberOfStrides * effectiveStride;
  const diff = usefulDistance - expectedDistanceForStrides; // Positivo = Largo, Negativo = Corto

  // 4. Renderizar Resultados
  renderResults(numberOfStrides, usefulDistance, diff, horseName, jump2);
}

function renderResults(strides, usefulDist, diff, horseName, jump2Type) {
  const resultsCard = document.getElementById('results-card');
  const badgeStrides = document.getElementById('badge-strides');
  const badgeStatus = document.getElementById('badge-status');
  const metricUseful = document.getElementById('metric-useful');
  const metricDiff = document.getElementById('metric-diff');
  const recommendationText = document.getElementById('recommendation-text');

  resultsCard.classList.remove('hidden');

  badgeStrides.innerText = `${strides} TRAMOS`;
  metricUseful.innerText = `${usefulDist.toFixed(2)} m`;

  let statusText = "CÓMODO / NORMAL";
  let statusClass = "badge-normal";
  let advice = "";

  const absDiff = Math.abs(diff);

  if (absDiff <= 0.25) {
    statusText = "DISTANCIA PERFECTA";
    statusClass = "badge-normal";
    advice = `La distancia viene muy fluida para ${horseName}. Mantén un ritmo de galope constante y deja que el tranco siga su curso natural sin interferir en la boca.`;
  } else if (diff < -0.25) {
    statusText = "DISTANCIA CORTA / ESPERADA";
    statusClass = "badge-short";
    advice = `La distancia está apretada (-${absDiff.toFixed(2)} m). Siéntate atrás tras la recepción del primer salto, mantén el contacto firme y pide a ${horseName} que espere. No empujes hacia adelante.`;
  } else {
    statusText = "DISTANCIA LARGA / ABIERTA";
    statusClass = "badge-long";
    advice = `La distancia viene abierta (+${absDiff.toFixed(2)} m). Necesitas abrir la mano tras la recepción y avanzar con impulsión desde el 1er y 2º tranco`;
    if (jump2Type === 'oxer') {
      advice += ` especialmente para asegurar el alcance necesario sobre el fondo de salida.`;
    } else {
      advice += `.`;
    }
  }

  badgeStatus.innerText = statusText;
  badgeStatus.className = `badge ${statusClass}`;
  metricDiff.innerText = `${diff > 0 ? '+' : ''}${diff.toFixed(2)} m`;
  recommendationText.innerText = advice;

  // Hacer scroll suave hacia los resultados en móviles
  resultsCard.scrollIntoView({ behavior: 'smooth' });
}