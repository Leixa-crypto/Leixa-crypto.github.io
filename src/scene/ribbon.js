import * as THREE from 'three';

/** Iridescent twisting band the camera dives through between scenes. */
export class Ribbon {
  constructor(lowPoly) {
    this.uniforms = { uTime: { value: 0 }, uTwist: { value: 0.35 }, uOpacity: { value: 0 } };
    const geo = new THREE.PlaneGeometry(5, 46, 1, lowPoly ? 160 : 320);
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        uniform float uTime, uTwist;
        varying vec2 vUv; varying float vFacing; varying vec3 vView;
        void main() {
          vUv = uv;
          vec3 p = position;
          float a = p.y * uTwist + uTime * 0.25;
          float x = p.x;
          p.x = cos(a) * x;
          p.z = sin(a) * x + sin(p.y * 0.18 + uTime * 0.4) * 1.4;
          vFacing = cos(a);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uOpacity;
        varying vec2 vUv; varying float vFacing; varying vec3 vView;
        vec3 spectrum(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
        void main() {
          float film = vUv.y * 2.6 + vFacing * 0.45 + vUv.x * 0.35 + uTime * 0.03;
          vec3 col = spectrum(film);
          col = mix(col, vec3(1.0), pow(abs(vFacing), 14.0) * 0.6);    // specular sheen
          float stripes = 0.85 + 0.15 * sin(vUv.x * 38.0 + vUv.y * 6.0);
          float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
          float ends = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
          gl_FragColor = vec4(col * stripes * (0.55 + 0.45 * abs(vFacing)), uOpacity * edge * ends);
        }`,
    }));
    this.mesh.position.set(0.4, 0, -68);
    this.mesh.rotation.z = 0.42;
    this.mesh.frustumCulled = false;
  }

  update(opacity, twist, time) {
    this.mesh.visible = opacity > 0.005;
    this.uniforms.uOpacity.value = opacity;
    this.uniforms.uTwist.value = twist;
    this.uniforms.uTime.value = time;
  }
}
