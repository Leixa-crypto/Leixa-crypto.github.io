/**
 * LEIXA // FXKIO — site content.
 *
 * Every link, username, spec and media path lives here. Components read from
 * this file only, so swapping the avatar, the featured video, a spec or the
 * Discord invite is a one-line change.
 *
 * Rule: a value of `null` means "not provided yet". The UI hides or marks
 * those slots instead of inventing data. Fill them in from the original site.
 */

export const SITE = {
  name: 'LEIXA // FXKIO',
  shortName: 'LEIXA',
  tagline: 'FPS COMPETITOR // SIM RACER // CONTENT CREATOR',
  interests: ['Valorant', 'Roblox', 'Counter-Strike 2', 'Sim racing', 'Gaming PC hardware', 'Gaming community'],
};

/* ---------------------------------------------------------------- media -- */
// Files live in /public/media. Replace the files or point these at new ones.
export const MEDIA = {
  avatar: {
    src: 'media/avatar-umi-asanagi-square.jpg',
    alt: 'Umi Asanagi profile avatar',
  },
  featuredVideo: {
    src: 'media/umi-asanagi-edit.mp4',
    type: 'video/mp4',
    poster: 'media/umi-asanagi-edit-poster.jpg',
    title: 'Umi Asanagi edit',
    // Native size of the file, used to reserve the right aspect ratio.
    width: 1024,
    height: 576,
  },
  // Stills (taken from the featured video) that orbit the player in 3D.
  reelStills: Array.from({ length: 12 }, (_, i) => `media/reel/still-${String(i + 1).padStart(2, '0')}.jpg`),
};

/* ------------------------------------------------------------- profiles -- */
export const PROFILES = {
  valorant: {
    name: 'Valorant',
    label: 'VALORANT',
    handle: 'Leixa#777',
    // No profile URL on the original site has been confirmed yet.
    url: null,
  },
  roblox: {
    name: 'Roblox',
    label: 'ROBLOX',
    handle: 'fxkio999',
    // Roblox profile links need the numeric user id (roblox.com/users/<id>/profile).
    url: null,
  },
  tiktok: {
    name: 'TikTok',
    label: 'TIKTOK',
    handle: '@thx_fxkio',
    // Standard TikTok profile URL for the username above.
    url: 'https://www.tiktok.com/@thx_fxkio',
  },
  discord: {
    name: 'Discord',
    label: 'DISCORD',
    handle: 'Official gaming community',
    // Paste the exact invite from the original site, e.g. 'https://discord.gg/xxxx'.
    url: null,
  },
};

export const VALORANT_SETTINGS = {
  resolution: '1440 × 1080',
  aspect: '4:3 stretched',
};

/* ------------------------------------------------------------- hardware -- */
// `value: null` renders as a pending slot. Add or remove rows freely.
export const HARDWARE = [
  {
    id: 'main',
    title: 'MAIN GAMING PC',
    kicker: 'PC 01',
    specs: [
      { label: 'CPU', value: null },
      { label: 'GPU', value: null },
      { label: 'RAM', value: null },
      { label: 'Motherboard', value: null },
      { label: 'Storage', value: null },
      { label: 'Cooling', value: null },
      { label: 'PSU', value: null },
    ],
  },
  {
    id: 'stream',
    title: 'SECOND PC / STREAM PC',
    kicker: 'PC 02',
    specs: [
      { label: 'CPU', value: null },
      { label: 'GPU', value: null },
      { label: 'RAM', value: null },
      { label: 'Storage', value: null },
      { label: 'Capture', value: null },
    ],
  },
  {
    id: 'peripherals',
    title: 'GAMING PERIPHERALS',
    kicker: 'GEAR',
    specs: [
      { label: 'Valorant resolution', value: `${VALORANT_SETTINGS.resolution} · ${VALORANT_SETTINGS.aspect}` },
      { label: 'Monitor', value: null },
      { label: 'Mouse', value: null },
      { label: 'Keyboard', value: null },
      { label: 'Headset', value: null },
      { label: 'Mousepad', value: null },
    ],
  },
  {
    id: 'sim',
    title: 'SIM RACING SETUP',
    kicker: 'SIM',
    specs: [
      { label: 'Wheelbase', value: null },
      { label: 'Wheel', value: null },
      { label: 'Pedals', value: null },
      { label: 'Rig', value: null },
    ],
  },
];

/* ------------------------------------------------------------ community -- */
export const COMMUNITY = {
  headlines: ['JOIN THE SQUAD', 'FIND YOUR TEAM', 'PLAY TOGETHER'],
  activities: [
    { tag: 'VAL', text: 'Valorant party recruitment' },
    { tag: 'RBX', text: 'Roblox sessions' },
    { tag: 'CS2', text: 'Counter-Strike 2' },
    { tag: 'SIM', text: 'Sim racing' },
    { tag: 'VC', text: 'Voice chat & community hangouts' },
    { tag: 'LIVE', text: 'TikTok live-stream & custom-match updates' },
  ],
};
