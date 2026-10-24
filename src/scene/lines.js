import * as THREE from 'three';

/**
 * Line material that "draws" itself: every vertex carries aT (0→1 along its
 * stroke) and aDelay. A fragment is shown once uDraw has swept past it.
 */
export function drawLineMaterial(color, opacity = 1) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uDraw: { value: 1 },
      uSpan: { value: 0.35 },
    },
    vertexShader: /* glsl */ `
      attribute float aT; attribute float aDelay;
      varying float vT; varying float vDelay;
      void main() { vT = aT; vDelay = aDelay; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uDraw, uSpan;
      varying float vT; varying float vDelay;
      void main() {
        float head = clamp((uDraw - vDelay) / uSpan, 0.0, 1.0);
        if (vT > head) discard;
        float glow = 1.0 + smoothstep(0.08, 0.0, head - vT) * 2.0 * step(head, 0.999);
        gl_FragColor = vec4(uColor * glow, uOpacity);
      }`,
  });
}

/** Builds LineSegments from polylines: [{ points: Vector3[], delay, closed }]. */
export function polylineSegments(strokes) {
  const pos = [];
  const t = [];
  const delay = [];
  for (const s of strokes) {
    const pts = s.closed ? [...s.points, s.points[0]] : s.points;
    let total = 0;
    const acc = [0];
    for (let i = 1; i < pts.length; i++) acc.push((total += pts[i].distanceTo(pts[i - 1])));
    for (let i = 1; i < pts.length; i++) {
      pos.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z);
      t.push(acc[i - 1] / (total || 1), acc[i] / (total || 1));
      delay.push(s.delay || 0, s.delay || 0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
  geo.setAttribute('aDelay', new THREE.Float32BufferAttribute(delay, 1));
  return geo;
}
