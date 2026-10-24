import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Rack focus, slight chromatic fringe, vignette and film grain.
const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBlur: { value: 0 },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uFringe: { value: 0.0015 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uBlur, uTime, uAspect, uFringe;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * uFringe * 8.0;
      vec4 col = vec4(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b, 1.0);
      if (uBlur > 0.001) {
        vec3 acc = col.rgb;
        float rad = uBlur * 0.018;
        for (int i = 0; i < 12; i++) {
          float a = float(i) * 2.39996;
          float d = sqrt(float(i) + 0.5) / 3.5;
          acc += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a) * uAspect) * d * rad).rgb;
        }
        col.rgb = acc / 13.0;
      }
      col.rgb *= 1.0 - smoothstep(0.18, 0.75, r2 * 1.6) * 0.55;
      col.rgb += (hash(vUv * 1000.0 + fract(uTime)) - 0.5) * 0.025;
      gl_FragColor = col;
    }`,
};

export function createComposer(renderer, scene, camera, quality) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: quality.msaa,
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  let bloom = null;
  if (quality.bloom) {
    bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.55, 0.55, 0.82);
    composer.addPass(bloom);
  }
  const lens = new ShaderPass(LensShader);
  composer.addPass(lens);
  composer.addPass(new OutputPass());
  return { composer, bloom, lens };
}
