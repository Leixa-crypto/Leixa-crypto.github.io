import * as THREE from 'three';

/** A dark studio with coloured light strips, baked once into a PMREM map. */
export function createEnvironment(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(20, 12, 20),
    new THREE.MeshBasicMaterial({ color: 0x050608, side: THREE.BackSide }),
  );
  env.add(room);
  const strip = (color, intensity, w, h, x, y, z, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    env.add(m);
  };
  strip('#ffffff', 2.4, 10, 1.2, 0, 5.8, 0, 0, Math.PI / 2); // soft top key
  strip('#7fe9ff', 3.0, 0.5, 8, -9.8, 0, -2, Math.PI / 2); // cyan rim left
  strip('#ff3d6e', 2.4, 0.5, 8, 9.8, 0, -2, -Math.PI / 2); // crimson rim right
  strip('#9fb4ff', 1.2, 14, 0.4, 0, -2, -9.8); // low back strip
  strip('#dfe8ff', 1.5, 16, 2.6, 0, 3.0, 9.8, Math.PI); // high front band
  strip('#7fe9ff', 0.35, 16, 1.2, 0, -2.6, 9.8, Math.PI); // low cyan bounce

  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  env.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return tex;
}

/** Full-screen gradient sky with two drifting light pools. */
export class Background {
  constructor() {
    this.uniforms = {
      uTop: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uGlow1: { value: new THREE.Color() },
      uGlow2: { value: new THREE.Color() },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uShift: { value: new THREE.Vector2() },
    };
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uBottom, uGlow1, uGlow2;
        uniform float uTime, uAspect;
        uniform vec2 uShift;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
        void main() {
          vec2 p = vUv; p.x = (p.x - 0.5) * uAspect + 0.5;
          vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
          vec2 g1 = vec2(0.22 + 0.06 * sin(uTime * 0.07), 0.3) + uShift * 0.05;
          vec2 g2 = vec2(0.82, 0.78 + 0.05 * cos(uTime * 0.05)) - uShift * 0.04;
          col += uGlow1 * pow(max(0.0, 1.0 - distance(p, g1) * 1.25), 2.4) * 0.9;
          col += uGlow2 * pow(max(0.0, 1.0 - distance(p, g2) * 1.4), 2.6) * 0.7;
          col += (hash(vUv * 900.0 + uTime) - 0.5) * 0.006; // dither against banding
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
  }

  update(pal, time, aspect, shift) {
    const u = this.uniforms;
    u.uTop.value.copy(pal.bgTop);
    u.uBottom.value.copy(pal.bgBottom);
    u.uGlow1.value.copy(pal.glow1);
    u.uGlow2.value.copy(pal.glow2);
    u.uTime.value = time;
    u.uAspect.value = aspect;
    u.uShift.value.copy(shift);
  }
}

/** Dust and ALCHE-style "+" sparkles scattered along the whole camera path. */
export class Stars {
  constructor(count, dpr) {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 2] = 30 - Math.random() * 360;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color() },
      uOpacity: { value: 1 },
      uPixel: { value: dpr },
      uFar: { value: 70 },
    };
    this.points = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime, uPixel, uFar;
        varying float vAlpha, vCross;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float depth = -mv.z;
          vCross = step(0.82, aSeed);
          float size = mix(1.4, 3.2, fract(aSeed * 7.13)) * (vCross > 0.5 ? 5.0 : 1.0);
          gl_PointSize = size * uPixel * (24.0 / max(depth, 0.5));
          float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 40.0);
          vAlpha = tw * smoothstep(uFar, uFar * 0.35, depth) * smoothstep(0.2, 2.5, depth);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacity;
        varying float vAlpha, vCross;
        void main() {
          vec2 d = abs(gl_PointCoord - 0.5);
          float dotA = smoothstep(0.5, 0.0, length(d));
          float cross = max(smoothstep(0.05, 0.0, d.x) * smoothstep(0.5, 0.0, d.y),
                            smoothstep(0.05, 0.0, d.y) * smoothstep(0.5, 0.0, d.x));
          float a = mix(dotA * dotA, cross + dotA * 0.4, vCross);
          gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
        }`,
    }));
    this.points.frustumCulled = false;
  }

  update(color, opacity, time, far) {
    this.uniforms.uColor.value.copy(color);
    this.uniforms.uOpacity.value = opacity;
    this.uniforms.uTime.value = time;
    this.uniforms.uFar.value = far * 1.3;
    this.points.visible = opacity > 0.01;
  }
}

/** Anti-aliased line grid that follows the camera; floor and two walls. */
export class Grid {
  constructor() {
    this.group = new THREE.Group();
    const make = (wall) => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      defines: wall ? { WALL: 1 } : {},
      uniforms: {
        uColor: { value: new THREE.Color() },
        uOpacity: { value: 0 },
        uCam: { value: new THREE.Vector3() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor, uCam; uniform float uOpacity;
        varying vec3 vWorld;
        float lineAt(vec2 c, float cell, float w) {
          vec2 g = abs(fract(c / cell - 0.5) - 0.5) / fwidth(c / cell);
          return 1.0 - min(min(g.x, g.y) / w, 1.0);
        }
        void main() {
          #ifdef WALL
            vec2 c = vWorld.zy;
          #else
            vec2 c = vWorld.xz;
          #endif
          float minor = lineAt(c, 2.0, 1.0) * 0.35;
          // "+" markers at major intersections
          vec2 cell = abs(fract(c / 8.0 + 0.5) - 0.5) * 8.0;
          float plus = (step(cell.x, 0.035) * step(cell.y, 0.35) + step(cell.y, 0.035) * step(cell.x, 0.35));
          float major = lineAt(c, 8.0, 1.2) * 0.5;
          float d = distance(vWorld, uCam);
          float fade = exp(-d * 0.045) * smoothstep(0.5, 4.0, d);
          float a = max(max(minor, major), min(plus, 1.0) * 1.3) * fade * uOpacity;
          if (a < 0.002) discard;
          gl_FragColor = vec4(uColor, a);
        }`,
    });
    this.floorMat = make(false);
    this.wallMat = make(true);
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), this.floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -3.4;
    this.walls = [-1, 1].map((s) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(240, 40), this.wallMat);
      m.rotation.y = Math.PI / 2;
      m.position.x = s * 10;
      m.position.y = 6;
      return m;
    });
    this.group.add(this.floor, ...this.walls);
  }

  update(camera, color, floorOpacity, wallOpacity) {
    for (const [mat, op] of [[this.floorMat, floorOpacity], [this.wallMat, wallOpacity]]) {
      mat.uniforms.uColor.value.copy(color);
      mat.uniforms.uOpacity.value = op;
      mat.uniforms.uCam.value.copy(camera.position);
    }
    this.floor.position.x = camera.position.x;
    this.floor.position.z = camera.position.z;
    this.floor.visible = floorOpacity > 0.005;
    for (const w of this.walls) {
      w.position.z = camera.position.z;
      w.visible = wallOpacity > 0.005;
    }
  }
}
