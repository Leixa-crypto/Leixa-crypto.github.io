import * as THREE from 'three';
import { BASE, samplePalette } from './state.js';
import { createEnvironment, Background, Stars, Grid } from './atmosphere.js';
import { createComposer } from './post.js';
import { Title } from './title.js';
import { IdentityPanels } from './identity.js';
import { Ribbon } from './ribbon.js';
import { Rig } from './rig.js';
import { Network } from './network.js';
import { MediaRing } from './media.js';
import { Range } from './range.js';
import { FinaleGuides } from './finale.js';
import { damp, radialTexture } from './util.js';
import { pixelRatioFor } from '../quality.js';

export class World {
  constructor(canvas, quality, { videoEl, avatarImage, cards, stills }) {
    this.quality = quality;
    this.canvas = canvas;
    const low = quality.tier === 'low';

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false });
    this.renderer.setPixelRatio(quality.dpr);
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.environment = createEnvironment(this.renderer);
    this.scene.fog = new THREE.Fog(0x000000, 14, 70);

    this.camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 400);
    this.target = new THREE.Vector3();

    const post = createComposer(this.renderer, this.scene, this.camera, quality);
    Object.assign(this, post);

    // ---- layers
    this.background = new Background();
    this.stars = new Stars(quality.stars, quality.dpr);
    this.grid = new Grid();
    this.title = new Title('LEIXA', { lowPoly: low });
    this.identity = new IdentityPanels(cards, avatarImage);
    this.ribbon = new Ribbon(low);
    this.rig = new Rig(low);
    this.network = new Network(low);
    this.media = new MediaRing(stills, videoEl);
    this.range = new Range();
    this.guides = new FinaleGuides();

    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTexture(128, 'rgba(190,240,255,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.glow.position.set(0, 0.55, -36);

    this.scene.add(
      this.background.mesh, this.stars.points, this.grid.group, this.title.root, this.identity.group,
      this.ribbon.mesh, this.rig.group, this.network.group, this.media.group, this.range.group,
      this.guides.lines, this.glow,
    );

    // ---- runtime state
    this.getState = () => BASE;
    this.intro = { letters: 1, camZ: 0, glow: 0, blur: 0 };
    this.pointer = new THREE.Vector2();
    this.parallax = new THREE.Vector2();
    this.palette = {};
    this.time = 0;
    this.perf = { acc: 0, frames: 0, slow: 0 };
    this.dprScale = 1; // lowered by adapt() when the GPU struggles
    this.pending = 0; // time accumulated since the last rendered frame
    this.running = true;

    if (!quality.touch) {
      addEventListener('pointermove', (e) => {
        this.pointer.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
      }, { passive: true });
    }
    document.addEventListener('visibilitychange', () => { this.running = !document.hidden; });
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.camera.aspect = w / h;
    this.renderer.setPixelRatio(pixelRatioFor(this.quality.tier, w, h) * this.dprScale);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.lens.uniforms.uAspect.value = w / h;
  }

  /** Keep horizontal framing stable on portrait screens by widening the fov. */
  effectiveFov(fov) {
    const a = this.camera.aspect;
    const minAspect = 1.3;
    if (a >= minAspect) return fov;
    const hHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * minAspect);
    return Math.min(95, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hHalf) / a)));
  }

  frame(rawDt) {
    if (!this.running) return;
    // On 120–240Hz monitors, render at most ~85fps: the scene looks the same
    // and the GPU does a half to a third of the work.
    this.pending += rawDt;
    if (this.pending < 1 / 85 - 0.0008) return;
    const dt = Math.min(this.pending, 0.05);
    this.pending = 0;
    this.time += dt;
    const t = this.time;
    const s = this.getState();
    const pal = samplePalette(s.mood, this.palette);

    // atmosphere
    this.scene.fog.color.copy(pal.fog);
    this.scene.fog.near = s.fogNear;
    this.scene.fog.far = s.fogFar;
    this.parallax.x = damp(this.parallax.x, this.pointer.x, 3, dt);
    this.parallax.y = damp(this.parallax.y, this.pointer.y, 3, dt);
    this.background.update(pal, t, this.camera.aspect, this.parallax);

    // camera
    const cam = this.camera;
    cam.position.set(s.cx + this.parallax.x * 0.35, s.cy + this.parallax.y * 0.22, s.cz + this.intro.camZ);
    this.target.set(s.tx, s.ty, s.tz);
    cam.lookAt(this.target);
    cam.rotateZ(s.roll);
    const fov = this.effectiveFov(s.fov);
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }

    // layers
    if (this.intro.letters < 1) this.title.setIntro(this.intro.letters);
    else if (!this.introSettled) { this.title.setIntro(1); this.introSettled = true; }
    this.title.update(s, t);
    this.stars.update(pal.star, s.stars, t, s.fogFar);
    this.grid.update(cam, pal.accent, s.gridFloor, s.gridWalls);
    this.identity.update(s.identity, t, cam);
    this.ribbon.update(s.ribbon, s.ribbonTwist, t);
    this.rig.update(s.rig, s.rigSpin, t);
    this.network.update(s.net, s.netSpin, t);
    this.media.update(s.ring, s.ringRot, s.videoGlow, t);
    this.range.update(s.range, dt, t);
    this.guides.update(s.guides);

    this.glow.visible = this.intro.glow > 0.01;
    this.glow.material.opacity = this.intro.glow;
    this.glow.scale.setScalar(2 + this.intro.glow * 6);

    // post
    this.lens.uniforms.uBlur.value = Math.max(s.blur, this.intro.blur);
    this.lens.uniforms.uTime.value = t;
    if (this.bloom) this.bloom.strength = s.bloom;

    this.composer.render(dt);
    this.adapt(dt);
  }

  /** Drop resolution, then bloom, if the device can't hold ~45fps. */
  adapt(dt) {
    const p = this.perf;
    p.acc += dt;
    p.frames++;
    if (p.acc < 1) return;
    const fps = p.frames / p.acc;
    p.acc = 0;
    p.frames = 0;
    if (fps > 50 || this.time < 3) { p.slow = 0; return; }
    if (++p.slow < 2) return;
    p.slow = 0;
    if (this.bloom?.enabled && this.dprScale <= 0.85) {
      this.bloom.enabled = false;
    } else if (this.dprScale > 0.6) {
      this.dprScale = Math.max(0.6, this.dprScale - 0.15);
      this.resize();
    }
  }
}
