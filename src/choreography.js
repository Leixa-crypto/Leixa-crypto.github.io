import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BASE } from './scene/state.js';
import { PANEL_LAYOUT } from './scene/identity.js';
import { RIG_SPOTS } from './scene/rig.js';
import { NETWORK_CENTER } from './scene/network.js';
import { RING_CENTER } from './scene/media.js';
import { RANGE_CENTER } from './scene/range.js';
import { FINALE_CENTER } from './scene/finale.js';

gsap.registerPlugin(ScrollTrigger);

/** Viewport heights of scrolling per timeline unit. */
export const UNIT = 0.8;
export const TOTAL = 12.6;

// Where each nav link lands (timeline units, at a settled, readable moment).
export const LABELS = { hero: 0, world: 1.45, identity: 2.55, battlestation: 6.8, community: 9.85, video: 11.7 };
export const MARKS = [
  [0, 'LEIXA'], [0.9, 'WORLD'], [2.2, 'IDENTITY'], [6.3, 'BATTLESTATION'], [9.15, 'COMMUNITY'], [10.75, 'VIDEO'],
];

// identity: each card gets 0.4 travel + 0.3 hold
const ID_ARRIVE = PANEL_LAYOUT.map((_, i) => 2.5 + i * 0.7);
const ID_DEPART = ID_ARRIVE.map((t) => t + 0.3);
// battlestation categories
const RIG_ARRIVE = [6.75, 7.4, 8.1, 8.8];
const RIG_DEPART = RIG_ARRIVE.map((t) => t + 0.3);
export const VIDEO_ACTIVE_FROM = 11.1;

const focusPanel = (L) => ({ cx: -L.x * 0.15, cy: L.y + 0.35, cz: L.z + 11.5, tx: L.x * 0.42, ty: L.y + 0.15, tz: L.z - 0.6 });
const focusRig = (p, side = 1) => ({ cx: p.x - 1.2 * side, cy: p.y + 1.4, cz: p.z + 11, tx: p.x + 1.9, ty: p.y + 0.55, tz: p.z });

/**
 * Adds tweens on a state proxy while remembering the latest value of every
 * property, so the next scroll segment can start exactly where this one ends.
 */
function keyer(tl, proxy) {
  const cursor = { ...proxy };
  const key = (at, dur, props, ease = 'power2.inOut') => {
    tl.to(proxy, { ...props, duration: dur, ease }, at);
    Object.assign(cursor, props);
  };
  return { key, cursor };
}

function splitChars(root = document) {
  root.querySelectorAll('[data-split]').forEach((el) => {
    if (el.dataset.splitDone) return;
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'char';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.append(s);
    }
    el.dataset.splitDone = '1';
  });
}

export function buildChoreography({ world, video }) {
  splitChars();
  const vh = () => window.innerHeight;

  /* ============================================================ JOURNEY */
  const J = { ...BASE };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#journey',
      start: 'top top',
      end: () => `+=${vh() * TOTAL * UNIT}`,
      pin: true,
      scrub: true,
      anticipatePin: 1,
    },
  });
  // Pad the timeline to exactly TOTAL units so labels map linearly to scroll.
  tl.set({}, {}, TOTAL);
  const { key, cursor } = keyer(tl, J);

  // ---------------------------------------------------------- camera path
  key(0, 1.4, { cx: -3.0, cy: 0.9, cz: 8.6, tx: 1.5, ty: 0.3, tz: -6, roll: -0.03 });
  PANEL_LAYOUT.forEach((L, i) => {
    const start = i === 0 ? 2.05 : ID_DEPART[i - 1];
    key(start, ID_ARRIVE[i] - start, { ...focusPanel(L), roll: L.x < 0 ? 0.02 : -0.02 });
  });
  key(5.6, 0.35, { cx: 0.1, cy: 0.1, cz: -58.5, tx: 0.4, ty: 0, tz: -68, roll: 0.05 }, 'power1.inOut');
  key(5.95, 0.5, { cx: 0, cy: 0.8, cz: -76, tx: 0.8, ty: 0, tz: -86, roll: 0 }, 'power2.inOut');
  const spots = [RIG_SPOTS.main, RIG_SPOTS.stream, RIG_SPOTS.peripherals, RIG_SPOTS.sim];
  spots.forEach((p, i) => {
    const start = i === 0 ? 6.45 : RIG_DEPART[i - 1];
    key(start, RIG_ARRIVE[i] - start, { ...focusRig(p, i === 2 ? -0.4 : 1), roll: i % 2 ? -0.02 : 0.02 });
  });
  const N = NETWORK_CENTER;
  key(9.1, 0.6, { cx: N.x - 1.5, cy: 1.0, cz: N.z + 16, tx: N.x - 3.4, ty: 0, tz: N.z, roll: 0.03 });
  key(9.7, 0.9, { cx: N.x - 7.5, cy: -0.6, cz: N.z + 10, tx: N.x - 2.6, ty: 0.2, tz: N.z, roll: -0.02 }, 'sine.inOut');
  const R = RING_CENTER;
  key(10.6, 0.7, { cx: 0, cy: 0.4, cz: R.z + 11.5, tx: 0.5, ty: 0, tz: R.z - 5, roll: 0 }, 'power2.inOut');
  key(11.3, 1.3, { cx: 0.5, cy: 0.15, cz: R.z + 7, tx: 0.9, ty: 0, tz: R.z - 6 }, 'sine.out');

  // --------------------------------------------------------- atmosphere
  key(0, 1.4, { mood: 1, fogNear: 10, fogFar: 60, stars: 0.9, gridFloor: 0.75, bloom: 0.5 });
  key(2.0, 0.6, { mood: 2, fogNear: 8, fogFar: 48, gridFloor: 0.5, gridWalls: 0.3, bloom: 0.6, stars: 1 });
  key(5.9, 0.5, { mood: 3, fogNear: 9, fogFar: 78, gridFloor: 0.15, gridWalls: 0, bloom: 0.5 });
  key(9.1, 0.5, { mood: 4, fogNear: 10, fogFar: 55, gridFloor: 0, bloom: 0.85 });
  key(10.6, 0.6, { mood: 5, fogNear: 12, fogFar: 70, gridFloor: 0.2, bloom: 0.6 });

  // --------------------------------------------- LEIXA title choreography
  // Slides right and turns into a wall framing the next scene…
  key(0, 1.4, { titleX: 7.4, titleY: 0.45, titleZ: -7.5, titleRY: -0.78, titleRX: 0.04, titleEdge: 0.7 });
  // …the camera passes it on the way to the identity panels…
  key(2.0, 0.55, { titleX: 9, titleZ: -14, titleFill: 0, titleEdge: 0 }, 'power1.in');
  // …it re-forms behind the hardware and recedes into the scene…
  key(6.1, 0.05, { titleX: 1.5, titleY: 7.2, titleZ: -146, titleRY: 0, titleRX: 0.12, titleScale: 4.2 });
  key(6.4, 0.4, { titleFill: 0.75, titleEdge: 0.7 }, 'power1.out');
  key(6.8, 2.3, { titleX: 2.5, titleY: 8.6, titleZ: -172, titleScale: 5 }, 'none');
  key(9.1, 0.3, { titleFill: 0, titleEdge: 0 });

  // ------------------------------------------------------ world layers
  key(2.05, 0.45, { identity: 1 });
  key(5.6, 0.4, { identity: 0 });
  key(5.5, 0.35, { ribbon: 1, ribbonTwist: 0.45 }, 'power1.out');
  key(6.15, 0.25, { ribbon: 0, ribbonTwist: 0.7 });
  key(6.2, 0.4, { rig: 1 });
  key(6.4, 2.7, { rigSpin: 4 }, 'none');
  key(9.1, 0.4, { rig: 0 });
  key(9.2, 0.4, { net: 1 });
  key(9.1, 1.7, { netSpin: 1.5 }, 'none');
  key(10.6, 0.4, { net: 0 });
  key(10.5, 0.5, { ring: 1 });
  key(10.5, 2.1, { ringRot: 1.4 }, 'none');
  key(10.8, 0.5, { videoGlow: 1 });

  /* -------------------------------------------------------- DOM: hero */
  tl.to('.hero__lockup', { y: -50, autoAlpha: 0, scale: 0.94, duration: 0.6, ease: 'power1.in' }, 0.1);
  tl.to('.hero__bottom', { autoAlpha: 0, duration: 0.25 }, 0);
  tl.set('.scene--hero', { autoAlpha: 0 }, 0.75);

  /* -------------------------------------------------------- DOM: world */
  tl.fromTo('.scene--world', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.5);
  tl.fromTo('.scene--world .kicker', { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power2.out' }, 0.55);
  tl.fromTo('.world__title .line > span', { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 0.5, stagger: 0.09, ease: 'power3.out' }, 0.6);
  tl.fromTo(['.world__copy', '.world__tags'], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, 0.95);
  tl.to('.scene--world', { autoAlpha: 0, y: -70, duration: 0.35, ease: 'power1.in' }, 1.95);

  /* ----------------------------------------------------- DOM: identity */
  tl.fromTo('.scene--identity', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 2.05);
  tl.fromTo('.scene--identity .scene__head', { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 2.1);
  document.querySelectorAll('[data-id-card]').forEach((card, i) => {
    const dir = card.classList.contains('id-card--right') ? 1 : -1;
    tl.fromTo(card, { autoAlpha: 0, x: 70 * dir, rotationY: -22 * dir }, { autoAlpha: 1, x: 0, rotationY: 0, duration: 0.25, ease: 'power3.out' }, ID_ARRIVE[i] - 0.22);
    tl.to(card, { autoAlpha: 0, x: -40 * dir, duration: 0.18, ease: 'power1.in' }, ID_DEPART[i] + 0.02);
  });
  document.querySelectorAll('[data-id-steps] li').forEach((li, i) => {
    tl.fromTo(li, { opacity: 0.3 }, { opacity: 1, duration: 0.1 }, ID_ARRIVE[i] - 0.15);
    tl.to(li, { opacity: 0.3, duration: 0.1 }, ID_DEPART[i] + 0.05);
  });
  tl.to('.scene--identity', { autoAlpha: 0, duration: 0.25 }, 5.6);

  /* -------------------------------------------------- DOM: battlestation */
  tl.fromTo('.scene--rig', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 6.3);
  tl.fromTo('.rig__bigword', { xPercent: 20 }, { xPercent: -75, duration: 3.0, ease: 'none' }, 6.3);
  tl.fromTo('.scene--rig .scene__head', { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 6.4);
  document.querySelectorAll('[data-rig-panel]').forEach((panel, i) => {
    tl.fromTo(panel, { autoAlpha: 0, x: 90, rotationY: -18 }, { autoAlpha: 1, x: 0, rotationY: 0, duration: 0.3, ease: 'power3.out' }, RIG_ARRIVE[i] - 0.3);
    tl.fromTo(panel.querySelectorAll('.spec'), { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.18, stagger: 0.025, ease: 'power2.out' }, RIG_ARRIVE[i] - 0.22);
    tl.to(panel, { autoAlpha: 0, x: -50, duration: 0.2, ease: 'power1.in' }, RIG_DEPART[i] + 0.02);
  });
  document.querySelectorAll('[data-rig-tabs] li').forEach((li, i) => {
    tl.fromTo(li, { opacity: 0.3 }, { opacity: 1, duration: 0.1 }, RIG_ARRIVE[i] - 0.2);
    tl.to(li, { opacity: 0.3, duration: 0.1 }, RIG_DEPART[i] + 0.05);
  });
  tl.to('.scene--rig', { autoAlpha: 0, duration: 0.25 }, 9.15);

  /* ---------------------------------------------------- DOM: community */
  tl.fromTo('.scene--discord', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 9.15);
  document.querySelectorAll('[data-dword]').forEach((w, i) => {
    const from = i % 2 ? -55 : 5;
    tl.fromTo(w, { xPercent: from }, { xPercent: i % 2 ? 5 : -55, duration: 1.8, ease: 'none' }, 9.1);
  });
  tl.fromTo('.discord__panel > *', { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.07, ease: 'power3.out' }, 9.4);
  tl.fromTo('.discord__acts li', { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.2, stagger: 0.04, ease: 'power2.out' }, 9.6);
  tl.to('.scene--discord', { autoAlpha: 0, duration: 0.3 }, 10.55);

  /* -------------------------------------------------------- DOM: video */
  tl.fromTo('.scene--video', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 10.75);
  tl.fromTo('.video__head > *', { autoAlpha: 0, x: -50 }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power3.out' }, 10.8);
  tl.fromTo('.player', { autoAlpha: 0, xPercent: 18, rotationY: -26, rotationX: 6, scale: 0.9 },
    { autoAlpha: 1, xPercent: 0, rotationY: 0, rotationX: 0, scale: 1, duration: 0.55, ease: 'power3.out' }, 10.85);

  /* ================================================================ eDPI */
  const E = { ...cursor };
  const edpiTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#edpi', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  const ek = keyer(edpiTl, E);
  edpiTl.set({}, {}, 1);
  const RC = RANGE_CENTER;
  ek.key(0, 0.45, { cx: RC.x - 3.8, cy: 0.5, cz: RC.z + 12, tx: RC.x - 2.4, ty: 0.2, tz: RC.z, roll: 0, mood: 6, range: 1, ring: 0, videoGlow: 0, gridFloor: 0.5, gridWalls: 0.4, fogNear: 8, fogFar: 50, bloom: 0.6 }, 'power2.out');
  ek.key(0.45, 0.27, { cz: RC.z + 10.5 }, 'none');
  const FC = FINALE_CENTER;
  ek.key(0.72, 0.28, { cx: 0, cy: 0.1, cz: FC.z + 24, tx: 0, ty: FC.y + 0.4, tz: FC.z, mood: 7, range: 0, gridFloor: 0, gridWalls: 0, fogNear: 14, fogFar: 60, bloom: 0.7 }, 'power2.in');
  ek.key(0.72, 0.01, { titleX: 0, titleY: FC.y + 0.75, titleZ: FC.z, titleRX: 0, titleRY: 0, titleRZ: 0, titleScale: 1, titleFill: 0, titleEdge: 0, titleDraw: 0 });
  edpiTl.fromTo('.edpi__inner', { autoAlpha: 0, y: 80, rotationX: 10 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.3, ease: 'power3.out' }, 0.05);

  /* ============================================================ SIGNATURE */
  const F = { ...ek.cursor };
  const sigTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#signature', start: 'top top', end: () => `+=${vh() * 2}`, pin: '.sig__stage', scrub: true, anticipatePin: 1 },
  });
  const fk = keyer(sigTl, F);
  sigTl.set({}, {}, 1);
  fk.key(0, 0.15, { cz: FC.z + 14 }, 'power2.out');
  fk.key(0.15, 0.85, { cz: FC.z + 11.5, cy: 0.3, roll: 0.015 }, 'sine.inOut');
  fk.key(0.03, 0.4, { titleEdge: 1, titleDraw: 1 }, 'power1.inOut');
  fk.key(0.05, 0.45, { guides: 1 }, 'power1.inOut');
  fk.key(0.42, 0.22, { titleFill: 1 }, 'power2.inOut');
  fk.key(0.55, 0.2, { titleEdge: 0.3 });
  sigTl.fromTo('.sig__title .char', { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.2, stagger: 0.012, ease: 'power3.out' }, 0.38);
  sigTl.fromTo('.sig__line', { autoAlpha: 0, y: 20, letterSpacing: '0.6em' }, { autoAlpha: 1, y: 0, letterSpacing: '0.28em', duration: 0.2, ease: 'power2.out' }, 0.55);
  sigTl.fromTo('.sig__actions > *', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.15, stagger: 0.04, ease: 'power2.out' }, 0.64);

  /* ===================================================== state selection */
  const segments = [
    { st: tl.scrollTrigger, proxy: J },
    { st: edpiTl.scrollTrigger, proxy: E },
    { st: sigTl.scrollTrigger, proxy: F },
  ];
  world.getState = () => {
    const y = window.scrollY;
    for (let i = segments.length - 1; i > 0; i--) if (y >= segments[i].st.start) return segments[i].proxy;
    return J;
  };

  // video: preview while its scene is on screen, pause once it scrolls away
  const updateVideo = () => {
    const inJourney = tl.time() >= VIDEO_ACTIVE_FROM && tl.scrollTrigger.progress < 1;
    const leaving = edpiTl.scrollTrigger.progress > 0 && edpiTl.scrollTrigger.progress < 0.3;
    video.setActive(inJourney || leaving);
    if (tl.time() > 10.2) video.prefetch?.();
  };

  return {
    journey: tl,
    edpi: edpiTl,
    signature: sigTl,
    update: updateVideo,
    /** Absolute scroll position for a nav key. */
    scrollFor(name) {
      if (name === 'hero') return 0;
      if (name === 'edpi') {
        const h = document.getElementById('edpi').offsetHeight;
        return edpiTl.scrollTrigger.start + vh() + Math.max(0, (h - vh()) / 2);
      }
      if (name === 'signature') return sigTl.scrollTrigger.start + vh() * 1.8;
      const st = tl.scrollTrigger;
      return st.start + (LABELS[name] / TOTAL) * (st.end - st.start);
    },
    /** Current chapter for the side rail. */
    chapter() {
      const y = window.scrollY;
      if (y >= sigTl.scrollTrigger.start - vh() * 0.3) return [8, 'SIGNATURE'];
      if (y >= edpiTl.scrollTrigger.start + vh() * 0.4) return [7, 'eDPI'];
      const t = tl.time();
      let idx = 0;
      MARKS.forEach(([at], i) => { if (t >= at) idx = i; });
      return [idx + 1, MARKS[idx][1]];
    },
  };
}
