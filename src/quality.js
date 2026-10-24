// Decides how much the device can take. Everything visual scales off this.
const PREF_KEY = 'leixa:motion';

function readPref() {
  try { return localStorage.getItem(PREF_KEY); } catch { return null; }
}

export function writeMotionPref(value) {
  try { localStorage.setItem(PREF_KEY, value); } catch { /* storage blocked */ }
}

/** WebGL 2 support plus the GPU name, when the browser exposes it. */
function probeGpu() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return { webgl: false, gpu: '' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl: true, gpu: String(gpu || '') };
  } catch {
    return { webgl: false, gpu: '' };
  }
}

// The 3D canvas targets a full 1920×1080 frame on desktop: a 1080p screen
// renders at native resolution, larger screens render ~1080p worth of pixels.
const FULL_HD = 1920 * 1080;
const PIXEL_BUDGET = { high: FULL_HD, mid: FULL_HD, low: 1.1e6 };
const DPR_CAP = { high: 1.5, mid: 1.5, low: 1.25 };

/** Device pixel ratio for the canvas, capped by tier and a pixel budget. */
export function pixelRatioFor(tier, w = innerWidth, h = innerHeight) {
  const native = window.devicePixelRatio || 1;
  const byBudget = Math.sqrt(PIXEL_BUDGET[tier] / Math.max(1, w * h));
  const dpr = Math.min(native, DPR_CAP[tier], byBudget);
  // a ≤1080p screen always gets its own full resolution
  return w * h <= FULL_HD * 1.02 ? Math.max(dpr, Math.min(native, 1)) : dpr;
}

export function detectQuality() {
  const params = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pref = params.get('motion') || readPref(); // 'on' | 'off' | null
  const { webgl, gpu } = probeGpu();

  const coarse = matchMedia('(pointer: coarse)').matches;
  const shortSide = Math.min(screen.width, screen.height);
  const phone = coarse && shortSide < 820;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;

  let motion = pref ? pref === 'on' : !reduced;
  if (!webgl) motion = false;

  const softwareGpu = /swiftshader|llvmpipe|software|basic render/i.test(gpu);
  const integratedGpu = /intel|uhd|iris|vega \d|radeon\(tm\) graphics|mali|adreno/i.test(gpu);

  let tier = 'high';
  if (phone || memory <= 4 || softwareGpu) tier = 'low';
  else if (coarse || cores < 8 || integratedGpu) tier = 'mid';
  if (params.get('tier')) tier = params.get('tier');

  return {
    motion,
    webgl,
    reducedMotionPreferred: reduced,
    touch: coarse,
    phone,
    tier,
    gpu,
    dpr: pixelRatioFor(tier),
    bloom: tier !== 'low',
    msaa: { high: 4, mid: 2, low: 0 }[tier],
    stars: { high: 1800, mid: 1100, low: 650 }[tier],
  };
}
