# LEIXA // FXKIO

Cinematic, scroll-driven 3D site for LEIXA: FPS competitor, sim racer, content creator.

**Stack:** Vite · Three.js (real-time WebGL scene) · GSAP ScrollTrigger (pinned, scrubbed timelines) · Lenis (smooth wheel scrolling on desktop).

## Run

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
```

## Deploy

- **Netlify:** `netlify.toml` is included (build `npm run build`, publish `dist`). Or drag the `dist/` folder onto Netlify Drop.
- **GitHub Pages / any static host:** upload `dist/`. Asset paths are relative, so it also works from a sub-folder.

## Editing content

Everything editable lives in **`src/config.js`**: profile links, usernames, Riot ID, the Discord invite, hardware specs, and media paths.

| What | Where |
| --- | --- |
| Discord invite | `PROFILES.discord.url` (currently `null`, so the site shows "invite link coming soon") |
| TikTok / Roblox / Valorant links | `PROFILES.*.url` |
| PC specs | `HARDWARE[*].specs[*].value` (`null` shows a pending placeholder bar) |
| Avatar | `MEDIA.avatar.src` → file in `public/media/` |
| Featured video | `MEDIA.featuredVideo` (`src`, `poster`, `width`, `height`) |
| 3D media ring stills | `MEDIA.reelStills` |

The 3D title font is generated from Unbounded by `npm run font` (`scripts/build-font.mjs`). Rerun it only if you change the letters in the wordmark.

## How the experience works

- `src/choreography.js`: one pinned journey timeline (hero → world → identity → ribbon dive → battlestation → Discord → video) plus scrubbed segments for the eDPI section and the finale. Every animation is tied to scroll position, so scrolling up reverses it exactly.
- `src/scene/World.js`: the Three.js world. It renders whichever scroll segment's state is active, blending palettes, fog, the camera path and the scene layers.
- `src/scene/*`: chrome LEIXA wordmark, identity panels, iridescent ribbon, abstract CPU cores, 4:3 resolution frame, sim wheel, Discord network, video media ring, eDPI reticle, finale guide lines.
- `src/ui/*`: DOM rendering from the config, the video controller (lazy load, muted preview, play/sound controls) and the eDPI calculator.

## Performance and accessibility

- Device tiers: pixel ratio cap, particle count, bloom, MSAA. Adaptive resolution drops if FPS stays under ~45.
- `prefers-reduced-motion`, no WebGL 2, or the **Motion off** toggle switches to a static, fully readable layout. The calculator and video work in both modes.
- The video downloads nothing until its scene is reached or play is pressed, and it pauses when you scroll away.
- Hidden scenes are `visibility: hidden`, so keyboard focus only reaches what's on screen. A skip link jumps to the calculator.
