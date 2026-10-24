import { copyText, toast } from './render.js';

// Valorant turns 0.07° per mouse count at sensitivity 1.
export const VALORANT_YAW = 0.07;
const DEFAULTS = { dpi: 800, sens: 0.35 };
const KEY = 'leixa:edpi';

export const calcEdpi = (dpi, sens) => dpi * sens;
export const cmPer360 = (edpi) => (360 / (VALORANT_YAW * edpi)) * 2.54;

const fmt = (n, max = 2) => Number(n.toFixed(max)).toLocaleString('en-US', { maximumFractionDigits: max });

function validate(name, raw) {
  if (raw.trim() === '') return { error: 'Required' };
  const v = Number(raw);
  if (!Number.isFinite(v)) return { error: 'Enter a number' };
  if (name === 'dpi') {
    if (!Number.isInteger(v)) return { error: 'Whole numbers only' };
    if (v < 50 || v > 32000) return { error: '50 to 32000' };
  } else if (v <= 0 || v > 10) {
    return { error: 'Above 0, up to 10' };
  }
  return { value: v };
}

export function initEdpi(onChange = () => {}) {
  const form = document.querySelector('[data-calc]');
  const dpiIn = form.elements.dpi;
  const sensIn = form.elements.sens;
  const out = Object.fromEntries([...form.querySelectorAll('[data-out]')].map((el) => [el.dataset.out, el]));
  let last = null;

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) { dpiIn.value = saved.dpi; sensIn.value = saved.sens; }
  } catch { /* storage unavailable */ }

  function update() {
    const d = validate('dpi', dpiIn.value);
    const s = validate('sens', sensIn.value);
    for (const [input, res] of [[dpiIn, d], [sensIn, s]]) {
      input.setAttribute('aria-invalid', res.error ? 'true' : 'false');
      document.getElementById(input.getAttribute('aria-describedby')).textContent = res.error || '';
    }
    out.dpi.textContent = d.error ? '—' : fmt(d.value, 0);
    out.sens.textContent = s.error ? '—' : fmt(s.value, 3);
    if (d.error || s.error) {
      out.edpi.textContent = '—';
      out.cm.textContent = '—';
      last = null;
      return;
    }
    const edpi = calcEdpi(d.value, s.value);
    const cm = cmPer360(edpi);
    out.edpi.textContent = fmt(edpi, 2);
    out.cm.textContent = fmt(cm, 2);
    last = { dpi: d.value, sens: s.value, edpi, cm };
    try { localStorage.setItem(KEY, JSON.stringify({ dpi: d.value, sens: s.value })); } catch { /* ignore */ }
    onChange(last);
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  form.querySelector('[data-calc-reset]').addEventListener('click', () => {
    dpiIn.value = DEFAULTS.dpi;
    sensIn.value = DEFAULTS.sens;
    update();
    toast('Calculator reset');
  });
  form.querySelector('[data-calc-copy]').addEventListener('click', async () => {
    if (!last) { toast('Fix the inputs first'); return; }
    const text = `Valorant · ${fmt(last.dpi, 0)} DPI × ${fmt(last.sens, 3)} sens = ${fmt(last.edpi, 2)} eDPI · ${fmt(last.cm, 2)} cm/360`;
    toast((await copyText(text)) ? 'Result copied' : 'Copy failed');
  });
  update();
}
