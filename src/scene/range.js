import * as THREE from 'three';
import { drawLineMaterial, polylineSegments } from './lines.js';

export const RANGE_CENTER = new THREE.Vector3(3.2, 0.2, -246);

/** Training-range hologram behind the eDPI calculator; spin follows eDPI. */
export class Range {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.copy(RANGE_CENTER);
    const color = '#5effc8';
    this.ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.rings = [2.2, 2.9, 3.6].map((r, i) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r, r + (i === 0 ? 0.04 : 0.015), 160, 1, 0, Math.PI * (i === 1 ? 1.4 : 2)), this.ringMat);
      this.group.add(m);
      return m;
    });
    const gap = 0.18, len = 0.55;
    const V = (x, y) => new THREE.Vector3(x, y, 0);
    this.crossMat = drawLineMaterial(color, 1);
    const cross = new THREE.LineSegments(polylineSegments([
      { points: [V(-gap - len, 0), V(-gap, 0)] }, { points: [V(gap, 0), V(gap + len, 0)] },
      { points: [V(0, -gap - len), V(0, -gap)] }, { points: [V(0, gap), V(0, gap + len)] },
    ]), this.crossMat);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), this.ringMat);
    this.targets = Array.from({ length: 6 }, (_, i) => {
      const t = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true }));
      const a = (i / 6) * Math.PI * 2;
      t.position.set(Math.cos(a) * 5, Math.sin(a) * 2.6, -2 - (i % 3));
      this.group.add(t);
      return t;
    });
    this.group.add(cross, dot);
    this.spinRate = 0.4;
    this.angle = 0;
  }

  setEdpi(edpi) {
    // lower eDPI → slower, heavier spin. 280 eDPI ≈ 0.4 rad/s
    this.spinRate = THREE.MathUtils.clamp(edpi / 700, 0.05, 2.5);
  }

  update(opacity, dt, time) {
    this.group.visible = opacity > 0.005;
    if (!this.group.visible) return;
    this.angle += dt * this.spinRate;
    this.ringMat.opacity = opacity * 0.85;
    this.crossMat.uniforms.uOpacity.value = opacity;
    this.crossMat.uniforms.uDraw.value = Math.min(1.4, opacity * 1.4);
    this.rings[0].rotation.z = this.angle;
    this.rings[1].rotation.z = -this.angle * 1.6;
    this.rings[2].rotation.x = Math.sin(time * 0.3) * 0.3;
    this.rings[2].rotation.z = this.angle * 0.5;
    this.targets.forEach((t, i) => {
      t.rotation.y = time * (0.6 + i * 0.1);
      t.material.opacity = opacity * 0.7;
    });
  }
}
