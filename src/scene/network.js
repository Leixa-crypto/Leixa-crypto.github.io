import * as THREE from 'three';

export const NETWORK_CENTER = new THREE.Vector3(0, 0, -160);

/** Discord "squad" constellation: nodes on a sphere, linked to neighbours. */
export class Network {
  constructor(lowPoly) {
    const n = lowPoly ? 110 : 190;
    const r = 4.4;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      const jitter = 1 + (Math.random() - 0.5) * 0.12;
      pts.push(new THREE.Vector3(Math.cos(th) * rad * r * jitter, y * r * jitter, Math.sin(th) * rad * r * jitter));
    }
    const linePos = [];
    for (let i = 0; i < n; i++) {
      const near = pts.map((p, j) => [p.distanceTo(pts[i]), j]).filter(([, j]) => j > i).sort((a, b) => a[0] - b[0]).slice(0, 3);
      for (const [d, j] of near) if (d < 1.8) linePos.push(...pts[i].toArray(), ...pts[j].toArray());
    }
    this.group = new THREE.Group();
    this.group.position.copy(NETWORK_CENTER);
    this.uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color('#8f9bff') }, uHot: { value: new THREE.Color('#e3b8ff') } };

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    this.lines = new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uTime, uOpacity; uniform vec3 uColor, uHot; varying vec3 vP;
        void main(){
          float wave = smoothstep(0.85, 1.0, sin(dot(vP, vec3(0.6, 0.8, 0.2)) * 1.6 - uTime * 2.2));
          gl_FragColor = vec4(mix(uColor, uHot, wave), (0.28 + wave * 0.7) * uOpacity);
        }`,
    }));

    const ptGeo = new THREE.BufferGeometry().setFromPoints(pts);
    this.points = new THREE.Points(ptGeo, new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float uTime; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = 70.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uHot; uniform float uOpacity; void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(uHot, smoothstep(0.5,0.0,d) * uOpacity); }',
    }));

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.MeshBasicMaterial({ color: '#8f9bff', wireframe: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.core = core;

    // members orbiting on rings
    this.orbits = [0, 1, 2].map((i) => {
      const g = new THREE.Group();
      g.rotation.set(0.6 + i * 0.7, i * 1.1, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(6 + i * 0.8, 0.008, 4, 160), core.material);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true }));
      dot.position.x = 6 + i * 0.8;
      g.add(ring, dot);
      return g;
    });
    this.group.add(this.lines, this.points, core, ...this.orbits);
  }

  update(opacity, spin, time) {
    this.group.visible = opacity > 0.005;
    if (!this.group.visible) return;
    this.uniforms.uOpacity.value = opacity;
    this.uniforms.uTime.value = time;
    this.core.material.opacity = opacity * 0.45;
    this.group.rotation.y = time * 0.06 + spin;
    this.core.rotation.x = time * 0.3;
    this.orbits.forEach((o, i) => {
      o.children[0].rotation.z = 0;
      o.rotation.z = time * (0.2 + i * 0.07);
      o.children[1].material.opacity = opacity;
    });
  }
}
