import * as THREE from 'three';
import { radialTexture } from './util.js';

export const RING_CENTER = new THREE.Vector3(0, 0, -200);

/**
 * ALCHE-style arc of floating media around the featured video. Stills load
 * lazily the first time the scene is approached; the glow plane switches to a
 * live VideoTexture only once the real <video> is actually playing.
 */
export class MediaRing {
  constructor(stills, videoEl) {
    this.stills = stills;
    this.videoEl = videoEl;
    this.loaded = false;
    this.group = new THREE.Group();
    this.group.position.copy(RING_CENTER);
    this.spin = new THREE.Group();
    this.group.add(this.spin);
    this.items = [];
    const R = 10.5;
    stills.forEach((_, i) => {
      const a = (i / stills.length) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({ color: '#0c0f16', transparent: true, side: THREE.DoubleSide, depthWrite: false });
      const s = 0.85 + ((i * 37) % 10) / 22;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2 * s, 1.8 * s), mat);
      mesh.position.set(Math.sin(a) * R, ((i * 53) % 7) / 2.4 - 1.3, -Math.cos(a) * R);
      mesh.lookAt(0, mesh.position.y * 0.6, 0);
      this.spin.add(mesh);
      this.items.push(mesh);
    });

    this.glowMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(22, 12.4), this.glowMat);
    this.glow.position.set(1.2, 0, -12);
    this.halo = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 18),
      new THREE.MeshBasicMaterial({ map: radialTexture(128, 'rgba(255,79,134,1)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.halo.position.set(1.2, 0, -13);
    this.group.add(this.halo, this.glow);
    this.videoTexture = null;
  }

  load() {
    if (this.loaded) return;
    this.loaded = true;
    const loader = new THREE.TextureLoader();
    this.stills.forEach((src, i) => {
      loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const m = this.items[i].material;
        m.map = tex; m.color.set('#ffffff'); m.needsUpdate = true;
      });
    });
    loader.load(this.stills[1], (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.posterTex = tex;
      if (!this.videoTexture) { this.glowMat.map = tex; this.glowMat.needsUpdate = true; }
    });
  }

  useVideo() {
    if (this.videoTexture || !this.videoEl) return;
    this.videoTexture = new THREE.VideoTexture(this.videoEl);
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;
    this.glowMat.map = this.videoTexture;
    this.glowMat.needsUpdate = true;
  }

  update(opacity, rot, glow, time) {
    this.group.visible = opacity > 0.005;
    if (!this.group.visible) return;
    if (!this.loaded) this.load();
    this.spin.rotation.y = rot + time * 0.015;
    this.items.forEach((m, i) => {
      m.material.opacity = opacity * 0.7;
      m.position.y += Math.sin(time * 0.6 + i) * 0.0015;
    });
    this.glowMat.opacity = opacity * glow * 0.11;
    this.halo.material.opacity = opacity * (0.25 + glow * 0.25);
  }
}
