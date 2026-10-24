import * as THREE from 'three';

/**
 * The 3D world is a pure function of one flat state object. Scroll timelines
 * tween copies of it (one per scroll segment) and the World applies whichever
 * segment is active. Scrolling backwards therefore reverses everything.
 */
export const BASE = {
  // camera
  cx: 0, cy: 0, cz: 13, tx: 0, ty: 0.2, tz: 0, fov: 35, roll: 0,
  // atmosphere: mood is a continuous index into PALETTES
  mood: 0, fogNear: 14, fogFar: 70, blur: 0, bloom: 0.55,
  // LEIXA title
  titleX: 0, titleY: 0.55, titleZ: 0, titleRX: 0, titleRY: 0, titleRZ: 0, titleScale: 1,
  titleFill: 1, titleEdge: 0.35, titleDraw: 1,
  // environment layers
  stars: 0.7, gridFloor: 0, gridWalls: 0,
  identity: 0, ribbon: 0, ribbonTwist: 0.35,
  rig: 0, rigSpin: 0,
  net: 0, netSpin: 0,
  ring: 0, ringRot: 0, videoGlow: 0,
  range: 0, guides: 0,
};

export const state = (overrides) => ({ ...BASE, ...overrides });

const P = (bgTop, bgBottom, glow1, glow2, fog, star, accent) => ({
  bgTop: new THREE.Color(bgTop), bgBottom: new THREE.Color(bgBottom),
  glow1: new THREE.Color(glow1), glow2: new THREE.Color(glow2),
  fog: new THREE.Color(fog), star: new THREE.Color(star), accent: new THREE.Color(accent),
});

// 0 void · 1 world · 2 identity · 3 rig · 4 discord · 5 video · 6 range · 7 finale
export const PALETTES = [
  P('#010204', '#04060b', '#0a1626', '#14060c', '#020308', '#d6ecff', '#7fe9ff'),
  P('#02060c', '#081624', '#0f3a56', '#2a0a18', '#040b14', '#cfeaff', '#7fe9ff'),
  P('#03050b', '#0a1424', '#134470', '#3a0c22', '#050a15', '#d2e6ff', '#7fe9ff'),
  P('#040404', '#120f0a', '#3a2a12', '#0d2838', '#080706', '#ffe9c8', '#ffb35c'),
  P('#04041a', '#100d36', '#3b3fd8', '#7a2bd0', '#09092a', '#d9d6ff', '#8f9bff'),
  P('#090307', '#1a0914', '#5a1030', '#182868', '#10050c', '#ffd6e6', '#ff4f86'),
  P('#020908', '#051c17', '#0e4a3c', '#0c2340', '#03100e', '#cffff0', '#5effc8'),
  P('#000001', '#03050a', '#0a1a33', '#050507', '#010204', '#dbeaff', '#7fe9ff'),
];

const tmp = { a: new THREE.Color(), b: new THREE.Color() };
export function samplePalette(mood, out) {
  const m = Math.min(PALETTES.length - 1, Math.max(0, mood));
  const i = Math.floor(m);
  const j = Math.min(PALETTES.length - 1, i + 1);
  const f = m - i;
  for (const k of Object.keys(PALETTES[0])) {
    tmp.a.copy(PALETTES[i][k]);
    tmp.b.copy(PALETTES[j][k]);
    (out[k] ||= new THREE.Color()).lerpColors(tmp.a, tmp.b, f);
  }
  return out;
}
