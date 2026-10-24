import '@fontsource/unbounded/400.css';
import '@fontsource/unbounded/800.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/jetbrains-mono/500.css';
import 'lenis/dist/lenis.css';
import './styles.css';

import { detectQuality, writeMotionPref } from './quality.js';
import { MEDIA } from './config.js';
import { renderAll, wireCopyButtons, IDENTITY_CARDS } from './ui/render.js';
import { initEdpi } from './ui/edpi.js';
import { initVideo } from './ui/video.js';

const quality = detectQuality();
const root = document.documentElement;
root.classList.add(quality.motion ? 'motion' : 'lite');
root.dataset.tier = quality.tier;

renderAll();
wireCopyButtons();

let world = null;
const video = initVideo({
  allowPreview: quality.motion,
  onPlaying: () => world?.media.useVideo(),
});
initEdpi((r) => world?.range.setEdpi(r.edpi));

// Mobile menu
const menuBtn = document.querySelector('[data-menu]');
const nav = document.getElementById('site-nav');
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
};
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Motion toggle: reload into the other mode so both stay simple and robust.
const toggle = document.querySelector('[data-motion-toggle]');
toggle.setAttribute('aria-pressed', String(quality.motion));
toggle.querySelector('[data-motion-label]').textContent = quality.motion ? 'Motion on' : 'Motion off';
if (!quality.webgl) {
  toggle.disabled = true;
  toggle.title = 'WebGL 2 is not available on this device';
}
toggle.addEventListener('click', () => {
  writeMotionPref(quality.motion ? 'off' : 'on');
  location.reload();
});

if (quality.motion) startExperience().catch((err) => {
  console.error('[LEIXA] 3D experience failed, falling back to lite mode', err);
  root.classList.replace('motion', 'lite');
  document.querySelector('.veil')?.remove();
});
else document.querySelector('.veil')?.remove();

async function startExperience() {
  const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }, { World }, { buildChoreography }] = await Promise.all([
    import('gsap'), import('gsap/ScrollTrigger'), import('lenis'), import('./scene/World.js'), import('./choreography.js'),
  ]);

  const counter = document.querySelector('[data-count]');
  let shown = 0;
  const tick = setInterval(() => { shown = Math.min(96, shown + 7); counter.textContent = String(shown).padStart(2, '0'); }, 60);

  // Canvas-rendered panels need the web fonts to be ready.
  await Promise.all([
    document.fonts.load('800 64px Unbounded'),
    document.fonts.load('500 30px "Space Grotesk"'),
    document.fonts.load('500 30px "JetBrains Mono"'),
  ]).catch(() => {});
  const avatarImage = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = MEDIA.avatar.src;
  });

  world = new World(document.getElementById('webgl'), quality, {
    videoEl: video.el, avatarImage, cards: IDENTITY_CARDS, stills: MEDIA.reelStills,
  });
  world.intro = { letters: 0, camZ: 9, glow: 0, blur: 1 };

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (!quality.touch) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
  }
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time, deltaMs) => {
    lenis?.raf(time * 1000);
    world.frame(deltaMs / 1000);
  });

  const director = buildChoreography({ world, video });
  window.__leixa = { world, director, gsap, ScrollTrigger, lenis }; // handy for debugging

  // side rail + video state
  const railIndex = document.querySelector('[data-rail-index]');
  const railLabel = document.querySelector('[data-rail-label]');
  const railFill = document.querySelector('[data-rail-fill]');
  let lastChapter = -1;
  const onScroll = () => {
    director.update();
    const max = ScrollTrigger.maxScroll(window) || 1;
    railFill.style.transform = `scaleY(${window.scrollY / max})`;
    const [i, label] = director.chapter();
    if (i !== lastChapter) {
      lastChapter = i;
      railIndex.textContent = String(i).padStart(2, '0');
      railLabel.textContent = label;
    }
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: onScroll, onRefresh: onScroll });

  // navigation
  const scrollTo = (y) => {
    const distance = Math.abs(y - window.scrollY);
    if (lenis) lenis.scrollTo(y, { duration: Math.min(2.6, 0.8 + distance / 6000), easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-nav]');
    if (!a) return;
    e.preventDefault();
    const name = a.dataset.nav;
    scrollTo(director.scrollFor(name));
    const focusTarget = name === 'hero' ? document.querySelector('.brand') : document.getElementById(name)?.querySelector('h2, h1');
    if (focusTarget) {
      focusTarget.setAttribute('tabindex', '-1');
      setTimeout(() => focusTarget.focus({ preventScroll: true }), 900);
    }
  });

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => world.resize(), 120);
  });
  world.resize();

  clearInterval(tick);
  counter.textContent = '100';
  playIntro(gsap, lenis);
}

function playIntro(gsap, lenis) {
  const intro = world.intro;
  const restoring = window.scrollY > 20;
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.to('.veil__dot', { scale: 2.2, opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 0)
    .to(intro, { glow: 1, duration: 0.7 }, 0.2)
    .to('.veil', { autoAlpha: 0, duration: 0.6, onComplete: () => document.querySelector('.veil')?.remove() }, 0.5)
    .to(intro, { letters: 1, duration: 1.9, ease: 'none' }, 0.75)
    .to(intro, { glow: 0, duration: 0.8, ease: 'power1.in' }, 1.6)
    .to(intro, { blur: 0, duration: 1.7, ease: 'power2.out' }, 0.9)
    .to(intro, { camZ: 0, duration: 2.6, ease: 'power3.out' }, 0.5)
    .fromTo('.hero__name .char', { yPercent: 120, rotateX: -80, autoAlpha: 0 }, { yPercent: 0, rotateX: 0, autoAlpha: 1, duration: 0.8, stagger: 0.035, ease: 'power3.out' }, 2.1)
    .fromTo('.hero__name i', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 2.4)
    .fromTo('.hero__tagline', { autoAlpha: 0, letterSpacing: '0.7em' }, { autoAlpha: 1, letterSpacing: '0.32em', duration: 1.1, ease: 'power3.out' }, 2.5)
    .fromTo(['.hero__meta', '.scroll-hint'], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 }, 2.9);

  // Never hold the visitor hostage: any scroll fast-forwards the intro.
  const hurry = () => { tl.timeScale(4); removeEventListener('wheel', hurry); removeEventListener('touchmove', hurry); };
  addEventListener('wheel', hurry, { passive: true });
  addEventListener('touchmove', hurry, { passive: true });
  if (restoring) tl.progress(1);
  lenis?.start();
}
