import * as THREE from 'three';
import { drawLineMaterial, polylineSegments } from './lines.js';

export const FINALE_CENTER = new THREE.Vector3(0, 0.2, -290);

/** Perspective construction lines that draw in behind the final wordmark. */
export class FinaleGuides {
  constructor() {
    const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    const strokes = [];
    const W = 15, H = 8.5;
    let d = 0;
    for (let i = -6; i <= 6; i++) strokes.push({ points: [V(i * 2.2, -H), V(i * 2.2, H)], delay: (d += 0.025) });
    for (const y of [-2.2, -1.1, 1.4, 2.6]) strokes.push({ points: [V(-W, y), V(W, y)], delay: (d += 0.03) });
    // diagonals converging on two vanishing points
    for (const [vx, vy] of [[-9, 6], [9, 6]]) {
      for (let i = 0; i < 6; i++) strokes.push({ points: [V(vx, vy), V(-W + i * 6, -H)], delay: 0.2 + i * 0.04 });
    }
    // floor recession
    for (let i = -8; i <= 8; i++) strokes.push({ points: [V(i * 1.6, -2.2, 0), V(i * 6, -8, 12)], delay: 0.35 + Math.abs(i) * 0.02 });
    this.mat = drawLineMaterial('#7fe9ff', 0.35);
    this.mat.uniforms.uSpan.value = 0.5;
    this.lines = new THREE.LineSegments(polylineSegments(strokes), this.mat);
    this.lines.position.copy(FINALE_CENTER).add(V(0, 0, -2.5));
  }

  update(draw) {
    this.lines.visible = draw > 0.002;
    this.mat.uniforms.uDraw.value = draw * 1.3;
    this.mat.uniforms.uOpacity.value = 0.32 * Math.min(1, draw * 3);
  }
}
