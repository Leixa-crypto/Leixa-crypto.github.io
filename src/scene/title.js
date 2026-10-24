import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import fontData from '../assets/unbounded-800.typeface.json';
import { drawLineMaterial, polylineSegments } from './lines.js';

const FONT = new Font(fontData);

/**
 * The giant LEIXA wordmark. Each letter is its own chrome mesh so the intro
 * can fly letters in individually, while the root group is driven by scroll.
 */
export class Title {
  constructor(text = 'LEIXA', { size = 1.5, depth = 0.42, spacing = 0.07, lowPoly = false } = {}) {
    this.root = new THREE.Group();
    this.letters = [];

    this.front = new THREE.MeshPhysicalMaterial({
      color: '#c3cedd', metalness: 1, roughness: 0.26, clearcoat: 0.35, clearcoatRoughness: 0.4,
      envMapIntensity: 1.7, transparent: true,
    });
    this.side = new THREE.MeshStandardMaterial({
      color: '#0d1118', metalness: 0.95, roughness: 0.32, emissive: '#06141e', envMapIntensity: 1.1, transparent: true,
    });
    this.edge = drawLineMaterial('#7fe9ff', 0.4);
    this.edge.uniforms.uSpan.value = 0.6;

    const res = FONT.data.resolution;
    const advances = [...text].map((ch) => (FONT.data.glyphs[ch].ha / res) * size);
    const width = advances.reduce((a, b) => a + b, 0) + spacing * size * (text.length - 1);
    let x = -width / 2;

    [...text].forEach((ch, i) => {
      const geo = new TextGeometry(ch, {
        font: FONT, size, depth, curveSegments: lowPoly ? 5 : 9,
        bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.025, bevelSegments: lowPoly ? 2 : 4,
      });
      geo.computeBoundingBox();
      const c = new THREE.Vector3();
      geo.boundingBox.getCenter(c);
      geo.translate(-c.x, -c.y, -c.z);

      const mesh = new THREE.Mesh(geo, [this.front, this.side]);
      const holder = new THREE.Group(); // intro animates holder; mesh stays centred
      holder.add(mesh);
      const glyphLeft = (FONT.data.glyphs[ch].x_min / res) * size;
      const cx = x + glyphLeft + (geo.boundingBox.max.x - geo.boundingBox.min.x) / 2;
      holder.position.set(cx, c.y - size * 0.36, 0);
      holder.userData.home = holder.position.clone();

      // Outline strokes (front and back faces) for the wireframe finale.
      const strokes = [];
      for (const shape of FONT.generateShapes(ch, size)) {
        const loops = [shape.getPoints(lowPoly ? 4 : 8), ...shape.holes.map((h) => h.getPoints(lowPoly ? 4 : 8))];
        for (const pts of loops) {
          for (const z of [depth / 2 + 0.04, -depth / 2 - 0.04]) {
            strokes.push({
              points: pts.map((p) => new THREE.Vector3(p.x - c.x, p.y - c.y, z)),
              closed: true,
              delay: i * 0.07 + (z < 0 ? 0.12 : 0),
            });
          }
        }
      }
      const outline = new THREE.LineSegments(polylineSegments(strokes), this.edge);
      holder.add(outline);

      this.root.add(holder);
      this.letters.push(holder);
      x += advances[i] + spacing * size;
    });
    this.width = width;
  }

  /** p in [0,1]: intro progress. Letters fly in from a distant glowing point. */
  setIntro(p) {
    const n = this.letters.length;
    this.letters.forEach((h, i) => {
      const local = Math.min(1, Math.max(0, (p - i * 0.06) / (1 - (n - 1) * 0.06)));
      const e = 1 - Math.pow(1 - local, 4);
      const home = h.userData.home;
      const side = i - (n - 1) / 2;
      h.position.set(home.x * e + side * 0.4 * (1 - e), home.y + (1 - e) * (i % 2 ? 1.6 : -1.4), home.z - (1 - e) * 42);
      h.rotation.set((1 - e) * (i % 2 ? 1.4 : -1.1), (1 - e) * side * 0.9, (1 - e) * side * 0.35);
    });
  }

  update(s, time) {
    this.root.position.set(s.titleX, s.titleY, s.titleZ);
    this.root.rotation.set(s.titleRX, s.titleRY, s.titleRZ);
    this.root.scale.setScalar(s.titleScale);
    this.front.opacity = s.titleFill;
    this.side.opacity = s.titleFill;
    this.front.depthWrite = this.side.depthWrite = s.titleFill > 0.98;
    this.edge.uniforms.uOpacity.value = s.titleEdge;
    this.edge.uniforms.uDraw.value = s.titleDraw * 1.6;
    this.root.visible = s.titleFill > 0.004 || s.titleEdge > 0.004;
    // idle breathing
    this.letters.forEach((h, i) => {
      const y = Math.sin(time * 0.9 + i * 0.7) * 0.03;
      for (const c of h.children) c.position.y = y;
    });
  }
}
