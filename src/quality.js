// Decides how much the device can take. Everything visual scales off this.
const PREF_KEY = 'leixa:motion';

function readPref() {
  try { return localStorage.getItem(PREF_KEY); } catch { return null; }
}

export function writeMotionPref(value) {
  try { localStorage.setItem(PREF_KEY, value); } catch { /* storage blocked */ }
}

function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export function detectQuality() {
  const params = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pref = params.get('motion') || readPref(); // 'on' | 'off' | null
  const webgl = hasWebGL2();

  const coarse = matchMedia('(pointer: coarse)').matches;
  const shortSide = Math.min(screen.width, screen.height);
  const phone = coarse && shortSide < 820;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;

  let motion = pref ? pref === 'on' : !reduced;
  if (!webgl) motion = false;

  let tier = 'high';
  if (phone || memory <= 4) tier = 'low';
  else if (coarse || cores < 8) tier = 'mid';
  if (params.get('tier')) tier = params.get('tier');

  const dprCap = { high: 1.75, mid: 1.35, low: 1.25 }[tier];

  return {
    motion,
    webgl,
    reducedMotionPreferred: reduced,
    touch: coarse,
    phone,
    tier,
    dpr: Math.min(window.devicePixelRatio || 1, dprCap),
    bloom: tier !== 'low',
    msaa: tier === 'high' ? 4 : 0,
    stars: { high: 1800, mid: 1100, low: 650 }[tier],
  };
}
