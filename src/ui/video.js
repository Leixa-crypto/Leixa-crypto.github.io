/**
 * Featured video. Nothing downloads until the scene is reached or the visitor
 * presses play. A muted preview autoplays where the browser allows it; when
 * it doesn't, the big play button stays visible.
 */
export function initVideo({ allowPreview, onPlaying = () => {} }) {
  const video = document.querySelector('[data-video]');
  const playBtn = document.querySelector('[data-video-play]');
  const soundBtn = document.querySelector('[data-video-sound]');
  const toggle = document.querySelector('[data-autoplay-toggle]');
  const source = video.querySelector('source');
  let loaded = false;
  let active = false;
  let previewing = false;

  toggle.checked = allowPreview;

  function load() {
    if (loaded) return;
    loaded = true;
    source.src = source.dataset.src;
    video.preload = 'auto';
    video.load();
  }

  function syncUi() {
    const playing = !video.paused && !video.ended;
    playBtn.hidden = playing;
    soundBtn.textContent = video.muted ? 'Sound on' : 'Mute';
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
  }

  async function play({ muted }) {
    load();
    video.muted = muted;
    try {
      await video.play();
      return true;
    } catch {
      syncUi();
      return false;
    }
  }

  async function startPreview() {
    if (!toggle.checked || !active || !video.paused) return;
    previewing = await play({ muted: true });
  }

  playBtn.addEventListener('click', async () => {
    previewing = false;
    await play({ muted: false });
  });
  soundBtn.addEventListener('click', async () => {
    previewing = false;
    if (video.paused) await play({ muted: false });
    else video.muted = !video.muted;
    syncUi();
  });
  toggle.addEventListener('change', () => {
    if (toggle.checked) startPreview();
    else if (previewing) { video.pause(); previewing = false; }
  });
  video.addEventListener('play', () => { if (!video.muted) previewing = false; });
  video.addEventListener('playing', () => { syncUi(); onPlaying(video); });
  video.addEventListener('pause', syncUi);
  video.addEventListener('volumechange', syncUi);
  video.addEventListener('ended', syncUi);
  syncUi();

  return {
    el: video,
    /** Called by the scroll director as the video scene enters/leaves. */
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) startPreview();
      else if (!video.paused) { video.pause(); previewing = false; }
    },
    prefetch: load,
  };
}
