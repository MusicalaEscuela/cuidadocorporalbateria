'use strict';

const STORAGE_KEY = 'musicala_bateria_habitos_v1';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Si no hay storage (modo raro), pues ni modo.
  }
}

function computeProgress(state) {
  const inputs = $$('input[type="checkbox"][data-key]');
  const total = inputs.length;
  let checked = 0;

  for (const inp of inputs) {
    const k = inp.dataset.key;
    if (state[k] === true) checked++;
  }

  const pct = total ? Math.round((checked / total) * 100) : 0;
  return { total, checked, pct };
}

function renderProgress(state) {
  const { pct } = computeProgress(state);
  const fill = $('#progressFill');
  const val = $('#progressValue');
  const bar = $('.progressBar');

  if (fill) fill.style.width = `${pct}%`;
  if (val) val.textContent = `${pct}%`;
  if (bar) bar.setAttribute('aria-valuenow', String(pct));
}

function applyState(state) {
  const inputs = $$('input[type="checkbox"][data-key]');
  for (const inp of inputs) {
    const k = inp.dataset.key;
    inp.checked = state[k] === true;
  }
  renderProgress(state);
}

function setKey(state, key, value) {
  state[key] = value === true;
  saveState(state);
  renderProgress(state);
}

function keysForCard(cardName) {
  const root = document.querySelector(`[data-card="${cardName}"]`);
  if (!root) return [];
  return $$('input[type="checkbox"][data-key]', root).map(i => i.dataset.key);
}

function markAllInCard(state, cardName) {
  for (const k of keysForCard(cardName)) state[k] = true;
  saveState(state);
  applyState(state);
}

function clearCard(state, cardName) {
  for (const k of keysForCard(cardName)) delete state[k];
  saveState(state);
  applyState(state);
}

function resetAll(state) {
  // Limpia solo los keys de esta página (sin volarte otras cosas del usuario)
  const keys = $$('input[type="checkbox"][data-key]').map(i => i.dataset.key);
  for (const k of keys) delete state[k];
  saveState(state);
  applyState(state);
}

(function init() {
  const state = loadState();
  applyState(state);

  // Cambios individuales
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type !== 'checkbox') return;
    const key = t.dataset.key;
    if (!key) return;

    setKey(state, key, t.checked);
  });

  // Acciones de botones
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const card = btn.getAttribute('data-card');

    if (action === 'markAll' && card) markAllInCard(state, card);
    if (action === 'clearCard' && card) clearCard(state, card);
  });

  // Reset global
  const btnReset = $('#btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      const ok = confirm('¿Reiniciar todas las marcaciones de esta página?');
      if (!ok) return;
      resetAll(state);
    });
  }
})();
