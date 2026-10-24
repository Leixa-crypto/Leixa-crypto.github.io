import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture, radialTexture } from './util.js';
import { drawLineMaterial, polylineSegments } from './lines.js';
import { createPS5, createSoundbar, createWheel } from './hardware.js';

export const RIG_SPOTS = {
  main: new THREE.Vector3(0, 0, -86),
  stream: new THREE.Vector3(5.5, 0.3, -98),
  peripherals: new THREE.Vector3(-5, 0.6, -110),
  console: new THREE.Vector3(-10, 0.3, -124),
  sim: new THREE.Vector3(4.5, 0.1, -134),
};

function circuitTexture(accent) {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
  g.strokeStyle = accent; g.lineCap = 'round';
  // seeded so both cores look intentional rather than noisy
  let seed = accent.length * 97;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    g.globalAlpha = 0.35 + rnd() * 0.65;
    g.lineWidth = 1 + rnd() * 2.5;
    let x = Math.round(rnd() * 16) * 32, y = Math.round(rnd() * 16) * 32;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      if (rnd() > 0.5) x += (rnd() > 0.5 ? 1 : -1) * 32 * Math.ceil(rnd() * 4);
      else y += (rnd() > 0.5 ? 1 : -1) * 32 * Math.ceil(rnd() * 4);
      g.lineTo(x, y);
    }
    g.stroke();
    g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fillStyle = accent; g.fill();
  }
  g.globalAlpha = 1;
  g.strokeRect(150, 150, 212, 212);
  g.fillStyle = accent; g.globalAlpha = 0.18; g.fillRect(150, 150, 212, 212);
  g.globalAlpha = 1; g.font = '700 30px "JetBrains Mono", monospace'; g.textAlign = 'center';
  g.fillText('LEIXA', 256, 262);
  return canvasTexture(c);
}

function buildCore(accent, label, lowPoly) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#9aa4b2', metalness: 1, roughness: 0.28, envMapIntensity: 1.2, transparent: true });
  const dark = new THREE.MeshStandardMaterial({ color: '#0b0e13', metalness: 0.7, roughness: 0.45, transparent: true });
  const gold = new THREE.MeshStandardMaterial({ color: '#c9a35a', metalness: 1, roughness: 0.3, transparent: true });

  const substrate = new THREE.Mesh(new RoundedBoxGeometry(3, 0.18, 3, lowPoly ? 2 : 4, 0.06), dark);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.2, 2.2, lowPoly ? 2 : 4, 0.08), metal);
  lid.position.y = 0.18;
  const dieMat = new THREE.MeshBasicMaterial({ map: circuitTexture(accent), color: accent, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const die = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), dieMat);
  die.rotation.x = -Math.PI / 2;
  die.position.y = 0.29;

  const pinGeo = new THREE.BoxGeometry(0.07, 0.05, 0.22);
  const pins = new THREE.InstancedMesh(pinGeo, gold, 64);
  const m = new THREE.Matrix4();
  let k = 0;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 16; i++) {
      const t = -1.3 + (i / 15) * 2.6;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (side * Math.PI) / 2);
      const p = new THREE.Vector3(t, -0.02, 1.58).applyQuaternion(q);
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      pins.setMatrixAt(k++, m);
    }
  }

  const ringMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.012, 6, lowPoly ? 96 : 180), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.008, 6, lowPoly ? 96 : 180), ringMat);
  ring1.rotation.x = Math.PI / 2.2;
  ring2.rotation.x = Math.PI / 1.8;
  ring2.rotation.y = 0.4;

  const chip = new THREE.Group();
  chip.add(substrate, lid, die, pins);
  chip.rotation.set(0.9, 0.5, -0.15);
  group.add(chip, ring1, ring2);
  group.userData = { chip, ring1, ring2, label };
  return { group, materials: [metal, dark, gold, dieMat, ringMat] };
}

function resolutionFrame(accent) {
  // 1440 × 1080 is 4:3; a 16:9 frame of the same height sits behind for scale.
  const h = 3;
  const w43 = h * (4 / 3);
  const w169 = h * (16 / 9);
  const rect = (w, hh, z) => [
    new THREE.Vector3(-w / 2, -hh / 2, z), new THREE.Vector3(w / 2, -hh / 2, z),
    new THREE.Vector3(w / 2, hh / 2, z), new THREE.Vector3(-w / 2, hh / 2, z),
  ];
  const strokes = [
    { points: rect(w169, h, -0.4), closed: true, delay: 0 },
    { points: rect(w43, h, 0), closed: true, delay: 0.15 },
    { points: [new THREE.Vector3(-0.35, 0, 0), new THREE.Vector3(-0.1, 0, 0)], delay: 0.4 },
    { points: [new THREE.Vector3(0.1, 0, 0), new THREE.Vector3(0.35, 0, 0)], delay: 0.4 },
    { points: [new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(0, -0.1, 0)], delay: 0.45 },
    { points: [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0, 0.35, 0)], delay: 0.45 },
  ];
  // stretch arrows
  for (const s of [-1, 1]) {
    strokes.push({ points: [new THREE.Vector3((s * w43) / 2 + s * 0.15, 0, 0), new THREE.Vector3((s * w169) / 2 - s * 0.15, 0, 0)], delay: 0.5 });
  }
  const mat = drawLineMaterial(accent, 0.9);
  const lines = new THREE.LineSegments(polylineSegments(strokes), mat);

  const c = document.createElement('canvas');
  c.width = 1024; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = accent; g.font = '800 64px Unbounded, sans-serif'; g.textAlign = 'center';
  g.fillText('1440 × 1080', 512, 80);
  g.font = '500 34px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillText('4:3 STRETCHED · VALORANT', 512, 136);
  const labelMat = new THREE.MeshBasicMaterial({ map: canvasTexture(c), transparent: true, depthWrite: false });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.625), labelMat);
  label.position.y = -h / 2 - 0.65;

  const group = new THREE.Group();
  group.add(lines, label);
  group.rotation.y = -0.22;
  return { group, lineMat: mat, materials: [labelMat] };
}

function speedStreaks(accent, lowPoly) {
  const n = lowPoly ? 50 : 110;
  const strokes = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.8 + Math.random() * 3;
    const z = -Math.random() * 8;
    strokes.push({ points: [new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z), new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z + 0.6 + Math.random() * 1.6)] });
  }
  const mat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  return { lines: new THREE.LineSegments(polylineSegments(strokes), mat), material: mat };
}

export class Rig {
  constructor(lowPoly) {
    this.group = new THREE.Group();
    const a = buildCore('#7fe9ff', 'PC 01', lowPoly);
    const b = buildCore('#ff4f86', 'PC 02', lowPoly);
    a.group.position.copy(RIG_SPOTS.main);
    b.group.position.copy(RIG_SPOTS.stream);
    const frame = resolutionFrame('#ffb35c');
    frame.group.position.copy(RIG_SPOTS.peripherals);
    const wh = createWheel(lowPoly);
    wh.group.position.copy(RIG_SPOTS.sim);
    wh.group.rotation.set(-0.12, -0.42, 0);
    const streaks = speedStreaks('#ffb35c', lowPoly);
    streaks.lines.position.copy(RIG_SPOTS.sim);

    const ps5 = createPS5();
    const bar = createSoundbar();
    ps5.group.position.y = -0.35;
    ps5.group.scale.setScalar(0.78);
    bar.group.position.set(2.0, -1.95, 1.4);
    bar.group.scale.setScalar(0.75);
    bar.group.rotation.y = -0.2;
    const cs = { group: new THREE.Group(), materials: [...ps5.materials, ...bar.materials] };
    cs.group.add(ps5.group, bar.group);
    cs.group.position.copy(RIG_SPOTS.console);
    this.ps5 = ps5.group;

    // metallic stage floor with a soft radial falloff
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#1a1d22', metalness: 0.92, roughness: 0.38, transparent: true,
      alphaMap: radialTexture(256, 'rgba(255,255,255,1)'), envMapIntensity: 0.9,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 80), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -2.6, -110);
    floor.renderOrder = -10;
    floorMat.depthWrite = false;

    // volumetric-looking light cones
    const coneMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color('#bfe9ff') } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv; void main(){ gl_FragColor = vec4(uColor, pow(vUv.y, 2.2) * 0.12 * uOpacity); }',
    });
    const cones = [RIG_SPOTS.main, RIG_SPOTS.stream].map((p) => {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 3.4, 9, 32, 1, true), coneMat);
      cone.position.set(p.x, p.y + 2.2, p.z);
      return cone;
    });

    this.group.add(a.group, b.group, frame.group, cs.group, wh.group, streaks.lines, floor, ...cones);
    this.streaks = streaks.lines;
    this.console = cs.group;
    this.cores = [a.group, b.group];
    this.frame = frame;
    this.wheel = wh;
    this.coneMat = coneMat;
    this.floorMat = floorMat;
    this.materials = [...a.materials, ...b.materials, ...frame.materials, ...wh.materials, streaks.material, ...cs.materials, floorMat];
    for (const m of this.materials) m.userData.baseOpacity = m.opacity;
  }

  update(opacity, spin, time) {
    this.group.visible = opacity > 0.005;
    if (!this.group.visible) return;
    for (const m of this.materials) {
      m.opacity = opacity * (m.userData.baseOpacity ?? 1);
      if (m.isMeshStandardMaterial && m !== this.floorMat) m.depthWrite = opacity > 0.98;
    }
    this.coneMat.uniforms.uOpacity.value = opacity;
    this.frame.lineMat.uniforms.uOpacity.value = opacity * 0.9;
    this.frame.lineMat.uniforms.uDraw.value = Math.min(1.4, Math.max(0, (spin - 1.7) * 1.1));
    this.cores.forEach((c, i) => {
      const { chip, ring1, ring2 } = c.userData;
      chip.rotation.y = 0.5 + spin * (i ? -1.6 : 1.6) + Math.sin(time * 0.4 + i) * 0.06;
      chip.position.y = Math.sin(time * 0.9 + i * 2) * 0.12;
      ring1.rotation.z = time * 0.25 + spin;
      ring2.rotation.z = -time * 0.18 - spin * 0.6;
    });
    this.ps5.rotation.y = -0.55 + Math.sin(time * 0.3) * 0.15;
    this.wheel.steer.rotation.z = Math.sin(time * 0.7) * 0.45 + Math.sin(spin * 2) * 0.2;
    this.streaks.position.z = RIG_SPOTS.sim.z + ((time * 6) % 8);
  }
}
