import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture } from './util.js';

/*
 * Detailed procedural models of the console and sim-racing gear.
 * Scale: 1 unit ≈ 10 cm. They are stylised 3D renders, not photos.
 */

function noiseCanvas(w, h, base, speck, amount = 0.08) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * amount;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  if (speck) {
    g.fillStyle = speck;
    for (let i = 0; i < w * h * 0.002; i++) g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  return { c, g };
}

/* =============================================================== PS5 */

/** Side-panel silhouette (depth on x, height on y), front of the console at +x. */
function ps5PanelShape() {
  const s = new THREE.Shape();
  s.moveTo(-1.32, -1.78);
  s.quadraticCurveTo(-1.36, -1.98, -1.1, -1.98);   // bottom-back corner
  s.lineTo(1.05, -1.98);
  s.quadraticCurveTo(1.22, -1.98, 1.2, -1.75);     // bottom-front corner
  s.quadraticCurveTo(1.02, 0.4, 1.18, 1.55);       // concave front waist
  s.quadraticCurveTo(1.26, 2.02, 1.5, 2.12);       // flared top-front collar
  s.quadraticCurveTo(0.2, 2.02, -1.2, 1.86);       // sloping top edge
  s.quadraticCurveTo(-1.36, 1.84, -1.34, 1.66);
  s.lineTo(-1.32, -1.78);
  return s;
}

function ps5PanelGeometry() {
  const geo = new THREE.ExtrudeGeometry(ps5PanelShape(), {
    depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 28,
  });
  geo.rotateY(-Math.PI / 2); // shape x → depth (z), extrusion → x
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // the panel bows outward and flares toward the top, like the real shell
    const bow = 0.05 * (1 - Math.min(1, (v.z / 1.4) ** 2));
    const flare = 0.07 * Math.max(0, v.y - 0.2) ** 1.6;
    pos.setX(i, v.x + 0.03 + bow + flare);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createPS5() {
  const group = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: '#f1f2f4', roughness: 0.42, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5, transparent: true });
  const gloss = new THREE.MeshPhysicalMaterial({ color: '#0a0b0e', roughness: 0.16, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true });
  const matte = new THREE.MeshStandardMaterial({ color: '#08090b', roughness: 0.8, metalness: 0.1, transparent: true });
  const blue = new THREE.MeshBasicMaterial({ color: '#3f7dff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });

  // black glossy core
  const core = new THREE.Mesh(new RoundedBoxGeometry(0.62, 3.62, 2.4, 4, 0.07), gloss);
  core.position.y = -0.15;
  // matte vent band across the top of the core
  const vent = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.06, 2.1, 2, 0.02), matte);
  vent.position.set(0, 1.68, 0);
  const grooves = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const gq = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.012, 0.035), gloss);
    gq.position.set(0, 1.715, -0.95 + i * 0.146);
    grooves.add(gq);
  }

  // front face details (front is +z)
  const front = 1.205;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.25, 0.02), matte);
  slot.position.set(-0.17, 0.75, front);
  const eject = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.012), matte);
  eject.position.set(0.15, -1.25, front);
  const power = eject.clone();
  power.position.y = -0.95;
  const usbA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.02), matte);
  usbA.position.set(0.0, -1.58, front);
  const usbC = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.1, 0.02, 2, 0.015), matte);
  usbC.position.set(0.0, -1.38, front);

  // blue light in the seam between core and shell
  const seamGeo = new THREE.BoxGeometry(0.02, 3.3, 0.02);
  const seamL = new THREE.Mesh(seamGeo, blue);
  seamL.position.set(-0.31, -0.1, front - 0.02);
  const seamR = seamL.clone();
  seamR.position.x = 0.31;
  const topSeam = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 2.1), blue);
  topSeam.position.set(-0.31, 1.66, 0);
  const topSeamR = topSeam.clone();
  topSeamR.position.x = 0.31;

  const panelGeo = ps5PanelGeometry();
  const panelR = new THREE.Mesh(panelGeo, white);
  panelR.position.x = 0.33;
  const panelL = new THREE.Mesh(panelGeo, white);
  panelL.position.x = -0.33;
  panelL.scale.x = -1; // mirrored copy; three.js flips the winding for negative scale

  // round stand
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.08, 48), matte);
  stand.position.set(0, -2.03, -0.2);

  group.add(core, vent, grooves, slot, eject, power, usbA, usbC, seamL, seamR, topSeam, topSeamR, panelL, panelR, stand);
  return { group, materials: [white, gloss, matte, blue] };
}

/** Soundbar: fabric-wrapped bar with an RGB underglow strip. */
export function createSoundbar() {
  const group = new THREE.Group();
  const { c } = noiseCanvas(512, 64, '#1a1b1e', null, 0.12);
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.45)';
  for (let y = 2; y < 64; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 512; x += 4) g.fillRect(x, y, 2, 2); // perforated grille
  const fabric = new THREE.MeshStandardMaterial({ map: canvasTexture(c), roughness: 0.95, metalness: 0, transparent: true });
  const shell = new THREE.MeshStandardMaterial({ color: '#0d0e10', roughness: 0.5, metalness: 0.3, transparent: true });
  const bar = new THREE.Mesh(new RoundedBoxGeometry(5.0, 0.42, 0.55, 4, 0.18), fabric);
  const cap = new THREE.Mesh(new RoundedBoxGeometry(5.04, 0.06, 0.58, 2, 0.03), shell);
  cap.position.y = 0.2;

  const glowC = document.createElement('canvas');
  glowC.width = 512; glowC.height = 16;
  const gg = glowC.getContext('2d');
  const grad = gg.createLinearGradient(0, 0, 512, 0);
  ['#ff2d6f', '#ffb300', '#36ff9b', '#2fd0ff', '#7a5cff', '#ff2d6f'].forEach((col, i, arr) => grad.addColorStop(i / (arr.length - 1), col));
  gg.fillStyle = grad; gg.fillRect(0, 0, 512, 16);
  const glow = new THREE.MeshBasicMaterial({ map: canvasTexture(glowC), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.45), glow);
  strip.rotation.x = -Math.PI / 2;
  strip.position.y = -0.24;
  group.add(bar, cap, strip);
  return { group, materials: [fabric, shell, glow], glowTexture: glow.map };
}

/* ================================================== WHEEL + SHIFTER */

function leatherTexture() {
  const { c, g } = noiseCanvas(2048, 128, '#151515', 'rgba(255,255,255,0.05)', 0.1);
  // two rows of stitching around the rim
  g.strokeStyle = '#8c8c8c';
  g.lineWidth = 3;
  for (const y of [40, 88]) {
    for (let x = 0; x < 2048; x += 16) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 9, y + 2); g.stroke();
    }
  }
  const tex = canvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function spokeShape(len, wHub, wRim) {
  const s = new THREE.Shape();
  s.moveTo(0, -wHub / 2);
  s.lineTo(len, -wRim / 2);
  s.quadraticCurveTo(len + 0.08, 0, len, wRim / 2);
  s.lineTo(0, wHub / 2);
  s.closePath();
  return s;
}

function hubShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.62, 0.38);
  s.quadraticCurveTo(0, 0.52, 0.62, 0.38);
  s.quadraticCurveTo(0.74, 0.3, 0.7, 0.05);
  s.quadraticCurveTo(0.6, -0.5, 0.22, -0.62);
  s.lineTo(-0.22, -0.62);
  s.quadraticCurveTo(-0.6, -0.5, -0.7, 0.05);
  s.quadraticCurveTo(-0.74, 0.3, -0.62, 0.38);
  return s;
}

export function createWheel(lowPoly) {
  const group = new THREE.Group();
  const steer = new THREE.Group();

  const leather = new THREE.MeshStandardMaterial({ map: leatherTexture(), roughness: 0.78, metalness: 0, transparent: true });
  const alu = new THREE.MeshStandardMaterial({ color: '#b9c0c8', metalness: 1, roughness: 0.32, transparent: true });
  const plastic = new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.55, metalness: 0.15, transparent: true });
  const rubber = new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.9, transparent: true });
  const red = new THREE.MeshStandardMaterial({ color: '#d4141e', roughness: 0.4, metalness: 0.2, transparent: true });
  const ledMats = ['#3dff6e', '#3dff6e', '#3dff6e', '#3dff6e', '#ffd43d', '#ffd43d', '#ff3d3d', '#ff3d3d', '#ff3d3d', '#ff3d3d']
    .map((col) => new THREE.MeshBasicMaterial({ color: col, transparent: true }));

  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.13, lowPoly ? 14 : 22, lowPoly ? 96 : 180), leather);

  const ext = { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 12 };
  const spokeR = new THREE.Mesh(new THREE.ExtrudeGeometry(spokeShape(0.78, 0.46, 0.3), ext), alu);
  spokeR.position.set(0.55, -0.05, -0.04);
  const spokeL = spokeR.clone();
  spokeL.rotation.z = Math.PI;
  spokeL.position.x = -0.55;
  const spokeB = new THREE.Mesh(new THREE.ExtrudeGeometry(spokeShape(0.72, 0.42, 0.34), ext), alu);
  spokeB.rotation.z = -Math.PI / 2;
  spokeB.position.set(0, -0.55, -0.04);

  const hub = new THREE.Mesh(new THREE.ExtrudeGeometry(hubShape(), { ...ext, depth: 0.14 }), plastic);
  hub.position.z = -0.02;
  const face = 0.17;

  // right cluster: four face buttons
  const btnGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20);
  btnGeo.rotateX(Math.PI / 2);
  [[0, 0.13], [0.13, 0], [-0.13, 0], [0, -0.13]].forEach(([x, y]) => {
    const b = new THREE.Mesh(btnGeo, rubber);
    b.position.set(0.95 + x, 0.02 + y, face - 0.02);
    steer.add(b);
  });
  // left cluster: d-pad
  const dH = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.09, 0.04, 2, 0.015), rubber);
  dH.position.set(-0.95, 0.02, face - 0.02);
  const dV = dH.clone();
  dV.rotation.z = Math.PI / 2;
  steer.add(dH, dV);
  // red rotary dial + enter, centre button, small option buttons
  const dial = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 12, 32), red);
  dial.position.set(0.32, -0.36, face);
  const enter = new THREE.Mesh(btnGeo, plastic);
  enter.scale.setScalar(0.75);
  enter.position.set(0.32, -0.36, face);
  const centre = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24).rotateX(Math.PI / 2), alu);
  centre.position.set(0, -0.32, face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 48), alu);
  ring.position.set(0, 0.02, face - 0.01);
  const small = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.045, 0.03, 2, 0.01), rubber);
  small.position.set(-0.32, -0.36, face);
  const small2 = small.clone();
  small2.position.y = -0.27;

  // rev LEDs along the top of the hub
  ledMats.forEach((m, i) => {
    const t = (i - 4.5) / 4.5;
    const led = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.035, 0.03, 1, 0.01), m);
    led.position.set(t * 0.5, 0.36 + (1 - t * t) * 0.07, face - 0.01);
    steer.add(led);
  });

  // paddle shifters behind the spokes
  const paddleShape = new THREE.Shape();
  paddleShape.moveTo(0, -0.18); paddleShape.lineTo(0.42, -0.1); paddleShape.quadraticCurveTo(0.5, 0, 0.42, 0.1); paddleShape.lineTo(0, 0.18); paddleShape.closePath();
  const paddleR = new THREE.Mesh(new THREE.ExtrudeGeometry(paddleShape, { depth: 0.03, bevelEnabled: false }), alu);
  paddleR.position.set(0.72, 0.18, -0.18);
  const paddleL = paddleR.clone();
  paddleL.rotation.z = Math.PI;
  paddleL.position.x = -0.72;

  steer.add(rim, spokeL, spokeR, spokeB, hub, dial, enter, centre, ring, small, small2, paddleL, paddleR);

  // wheelbase housing + shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 24).rotateX(Math.PI / 2), alu);
  shaft.position.z = -0.4;
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.7, 1.25, 2.3, 4, 0.22), plastic);
  base.position.set(0, -0.1, -1.75);
  const baseTop = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.08, 1.6, 2, 0.03), alu);
  baseTop.position.set(0, 0.54, -1.85);
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.5, 0.35, 2, 0.06), plastic);
  clamp.position.set(-0.55, -0.9, -1.4);
  const clamp2 = clamp.clone();
  clamp2.position.x = 0.55;

  // H-pattern shifter
  const shifter = new THREE.Group();
  const sBase = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.45, 1.1, 3, 0.12), plastic);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.03, 0.75, 2, 0.01), alu);
  plate.position.y = 0.235;
  const gate = new THREE.Group();
  const slotGeo = new THREE.BoxGeometry(0.03, 0.01, 0.5);
  [-0.22, 0, 0.22].forEach((x) => { const sl = new THREE.Mesh(slotGeo, rubber); sl.position.set(x, 0.252, 0); gate.add(sl); });
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.01, 0.03), rubber);
  cross.position.y = 0.252;
  gate.add(cross);
  const boot = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 24), rubber);
  boot.position.set(-0.22, 0.33, -0.25);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 16), alu);
  stick.position.set(-0.22, 0.68, -0.25);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 28, 20), leather);
  knob.position.set(-0.22, 1.1, -0.25);
  shifter.add(sBase, plate, gate, boot, stick, knob);
  shifter.position.set(2.5, -1.15, -0.2);
  shifter.rotation.y = -0.3;

  group.add(steer, shaft, base, baseTop, clamp, clamp2, shifter);
  return { group, steer, materials: [leather, alu, plastic, rubber, red, ...ledMats] };
}
