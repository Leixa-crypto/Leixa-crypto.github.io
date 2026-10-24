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
    url: 'https://discord.gg/JTGaF5MJTs',
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
      { label: 'CPU', value: 'Intel Core i5-11400F · 6 Cores / 12 Threads' },
      { label: 'GPU', value: 'NVIDIA GeForce RTX 5060 Ti for High FPS 1080p/1440p Gaming' },
      { label: 'Motherboard', value: 'Gigabyte B560M Aorus Elite · Stable BIOS Configuration' },
      { label: 'RAM', value: '32GB DDR4 2933MHz · 4x Slots Dual-Channel' },
      { label: 'PSU', value: '750W 80+ Certified' },
      { label: 'Displays', value: '240Hz 1080p Main + 2K 120Hz on a North Bayou NB F80' },
      { label: 'Monitors', value: 'Quad Monitor Setup' },
    ],
  },
  {
    id: 'stream',
    title: 'SECOND PC / STREAM PC',
    kicker: 'PC 02',
    specs: [
      { label: 'CPU', value: 'AMD Ryzen 5 5600X · Dedicated Encoding & Server CPU' },
      { label: 'GPU', value: 'NVIDIA GeForce GTX 1650 for NVENC Stream Pass-through' },
      { label: 'Motherboard', value: 'ASRock B550M Pro SE · BIOS v4.00 (Secure Boot Active)' },
      { label: 'RAM', value: '16GB DDR4 Dual-Channel' },
      { label: 'Monitor', value: 'Acer Nitro KG251Q 200Hz · Speaker Boosted via FxSound' },
      { label: 'Storage', value: '4.5TB+ · NVMe M.2 + SATA SSD + 2TB HDD' },
    ],
  },
  {
    id: 'peripherals',
    title: 'PERIPHERALS & ACCESSORIES',
    kicker: 'GEAR',
    specs: [
      { label: 'Valorant res', value: `${VALORANT_SETTINGS.resolution} · ${VALORANT_SETTINGS.aspect}` },
      { label: 'Keyboard #1', value: 'MelGeek REAL67 (Hall Effect) · CNC Aluminum + TTC Sacred Heart' },
      { label: 'Keyboard #2', value: 'Wraith W60 Ciela Edition · Rapid Trigger via HM Lab Z-Neo 8K Hub' },
      { label: 'Mice', value: 'Logitech G Pro X Superlight 2 & ATK Ultra Max 2.0' },
      { label: 'Headsets', value: 'Corsair HS80 RGB & Logitech G435' },
      { label: 'Speakers', value: 'Logitech Z906 5.1 Surround · THX Certified' },
      { label: 'Chair', value: 'Razer Enki X' },
    ],
  },
  {
    id: 'console',
    title: 'CONSOLE SETUP',
    kicker: 'CONSOLE',
    specs: [
      { label: 'Console', value: 'PlayStation 5 (PS5)' },
      { label: 'Sound', value: 'Razer Leviathan V2' },
    ],
  },
  {
    id: 'sim',
    title: 'SIM RACING SETUP',
    kicker: 'SIM',
    specs: [
      { label: 'Wheel', value: 'Logitech G29 Force Feedback · Custom Sensor Tuned + Shifter' },
      { label: 'Telemetry', value: 'Aimzone 5.0" IPS LCD Dash · Powered by SimHub' },
      { label: 'Main titles', value: 'EA Sports F1 25 · Assetto Corsa (Custom Sepang Circuit Mod) · GT7' },
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
