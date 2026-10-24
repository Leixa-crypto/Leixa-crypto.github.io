import { SITE, MEDIA, PROFILES, HARDWARE, COMMUNITY } from '../config.js';

const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, attrs = {}, children = []) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c) el.append(c);
  return el;
};

const ICON = {
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
};

export function linkButton(label, url, { variant = '', icon = 'out' } = {}) {
  return h('a', {
    class: `btn ${variant}`.trim(), href: url, target: '_blank', rel: 'noopener noreferrer',
    html: `<span>${label}</span>${ICON[icon]}`,
  });
}

export function copyButton(label, value, { variant = 'btn--ghost' } = {}) {
  return h('button', {
    class: `btn ${variant}`, type: 'button', 'data-copy': value,
    'aria-label': `${label}: ${value}`, html: `<span>${label}</span>${ICON.copy}`,
  });
}

/** A Discord button that only exists when a real invite is configured. */
function discordButton(variant = '') {
  if (PROFILES.discord.url) return linkButton('Join Discord', PROFILES.discord.url, { variant: `btn--discord ${variant}` });
  return h('p', { class: 'pending-note', text: 'Discord invite link coming soon' });
}

/* ------------------------------------------------------------- identity -- */
export const IDENTITY_CARDS = [
  { kind: 'player', label: 'PLAYER', handle: 'LEIXA', sub: SITE.tagline, accent: '#7fe9ff' },
  { kind: 'valorant', label: PROFILES.valorant.label, handle: PROFILES.valorant.handle, sub: 'Riot ID', accent: '#ff4f6d', profile: PROFILES.valorant },
  { kind: 'roblox', label: PROFILES.roblox.label, handle: PROFILES.roblox.handle, sub: 'Roblox username', accent: '#e8eef8', profile: PROFILES.roblox },
  { kind: 'tiktok', label: PROFILES.tiktok.label, handle: PROFILES.tiktok.handle, sub: 'Edits · lives · custom matches', accent: '#5ff2ee', profile: PROFILES.tiktok },
  { kind: 'discord', label: PROFILES.discord.label, handle: 'THE SQUAD', sub: PROFILES.discord.handle, accent: '#8f9bff', profile: PROFILES.discord },
];

function renderIdentity() {
  const hud = $('[data-id-hud]');
  const steps = $('[data-id-steps]');
  IDENTITY_CARDS.forEach((c, i) => {
    const side = i % 2 === 0 ? 'right' : 'left'; // opposite the 3D panel
    const actions = [];
    if (c.kind === 'player') {
      actions.push(copyButton('Copy Riot ID', PROFILES.valorant.handle));
    } else if (c.kind === 'discord') {
      actions.push(discordButton());
    } else {
      actions.push(copyButton(c.kind === 'valorant' ? 'Copy Riot ID' : 'Copy username', c.handle));
      if (c.profile?.url) actions.push(linkButton(`Open ${c.profile.name}`, c.profile.url, { variant: 'btn--ghost' }));
    }
    const card = h('article', { class: `id-card id-card--${side}`, 'data-id-card': i, style: `--accent:${c.accent}` }, [
      h('p', { class: 'id-card__label', text: `${String(i + 1).padStart(2, '0')} — ${c.label}` }),
      c.kind === 'player'
        ? h('div', { class: 'id-card__player' }, [
            h('img', { class: 'id-card__avatar', src: MEDIA.avatar.src, alt: MEDIA.avatar.alt, width: 64, height: 64, loading: 'lazy', decoding: 'async', 'data-avatar-img': true }),
            h('h3', { class: 'id-card__handle', text: 'LEIXA // FXKIO' }),
          ])
        : h('h3', { class: 'id-card__handle', text: c.kind === 'discord' ? 'Official gaming community' : c.handle }),
      h('p', { class: 'id-card__sub', text: c.kind === 'player' ? SITE.interests.join(' · ') : c.sub }),
      h('div', { class: 'id-card__actions' }, actions),
    ]);
    hud.append(card);
    steps.append(h('li', { text: c.label }));
  });
}

/* ------------------------------------------------------------- hardware -- */
function renderHardware() {
  const wrap = $('[data-rig-panels]');
  const tabs = $('[data-rig-tabs]');
  HARDWARE.forEach((cat, i) => {
    const rows = cat.specs.map((s) =>
      h('div', { class: `spec ${s.value ? '' : 'spec--pending'}`.trim() }, [
        h('dt', { text: s.label }),
        h('dd', s.value ? { text: s.value } : { 'aria-label': `${s.label} not listed yet`, html: '<span class="skeleton" aria-hidden="true"></span>' }),
      ]));
    const panel = h('article', { class: 'spec-panel', 'data-rig-panel': i }, [
      h('header', { class: 'spec-panel__head' }, [
        h('span', { class: 'spec-panel__kicker', text: cat.kicker }),
        h('h3', { class: 'spec-panel__title', text: cat.title }),
      ]),
      h('dl', { class: 'spec-panel__list' }, rows),
    ]);
    wrap.append(panel);
    tabs.append(h('li', { text: cat.kicker }));
  });
  const missing = HARDWARE.flatMap((c) => c.specs.filter((s) => !s.value).map((s) => `${c.title} › ${s.label}`));
  if (missing.length) console.info(`[LEIXA] ${missing.length} hardware specs not set in src/config.js:`, missing);
}

/* ------------------------------------------------------------ community -- */
function renderCommunity() {
  const words = $('[data-discord-words]');
  COMMUNITY.headlines.forEach((t, i) => {
    words.append(h('div', { class: `dword dword--${i}`, 'data-dword': i }, [h('span', { text: `${t} · ${t} · ` })]));
  });
  const list = $('[data-activities]');
  COMMUNITY.activities.forEach((a) => list.append(h('li', {}, [h('b', { text: a.tag }), h('span', { text: a.text })])));
  $('[data-discord-cta]').append(discordButton('btn--lg'));
}

/* ---------------------------------------------------------------- video -- */
function renderVideo() {
  const v = MEDIA.featuredVideo;
  const video = $('[data-video]');
  video.poster = v.poster;
  video.setAttribute('aria-label', v.title);
  video.width = v.width;
  video.height = v.height;
  const source = h('source', { 'data-src': v.src, type: v.type });
  video.append(source);
  $('[data-player] .player__frame').style.aspectRatio = `${v.width} / ${v.height}`;

  const avatar = $('[data-avatar]');
  avatar.src = MEDIA.avatar.src;
  avatar.alt = MEDIA.avatar.alt;
  $('[data-tiktok-handle]').textContent = PROFILES.tiktok.handle;
  const actions = $('[data-tiktok-actions]');
  if (PROFILES.tiktok.url) actions.append(linkButton('Watch on TikTok', PROFILES.tiktok.url, { variant: 'btn--tiktok' }));
  actions.append(copyButton('Copy handle', PROFILES.tiktok.handle));
}

/* ------------------------------------------------------------ signature -- */
function renderSignature() {
  const a = $('[data-sig-actions]');
  a.append(discordButton());
  if (PROFILES.tiktok.url) a.append(linkButton('TikTok profile', PROFILES.tiktok.url, { variant: 'btn--ghost' }));
  a.append(h('a', { class: 'btn btn--ghost', href: '#top', 'data-nav': 'hero', html: `<span>Back to top</span>${ICON.up}` }));
}

export function renderAll() {
  const tags = $('[data-interests]');
  SITE.interests.forEach((t) => tags.append(h('li', { text: t })));
  renderIdentity();
  renderHardware();
  renderCommunity();
  renderVideo();
  renderSignature();
  if (!PROFILES.discord.url) console.info('[LEIXA] Discord invite not set: add PROFILES.discord.url in src/config.js');
}

/* -------------------------------------------------------- copy + toast -- */
let toastTimer;
export function toast(msg) {
  const el = $('[data-toast]');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2200);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;top:0;left:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export function wireCopyButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const ok = await copyText(btn.dataset.copy);
    toast(ok ? `Copied ${btn.dataset.copy}` : 'Copy failed, select and copy manually');
  });
}
