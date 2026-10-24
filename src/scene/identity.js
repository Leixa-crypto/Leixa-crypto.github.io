import * as THREE from 'three';
import { canvasTexture, roundRect, radialTexture } from './util.js';

const W = 1024;
const H = 600;

// Abstract platform glyphs (deliberately not the trademarked logos).
const GLYPHS = {
  player(g, s) { g.beginPath(); g.arc(0, 0, s, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, s * 0.45, 0, Math.PI * 2); g.stroke(); },
  valorant(g, s) { g.beginPath(); g.moveTo(-s, -s); g.lineTo(0, s); g.lineTo(s, -s); g.moveTo(-s * 0.35, -s); g.lineTo(0, -s * 0.1); g.stroke(); },
  roblox(g, s) { g.save(); g.rotate(0.26); g.strokeRect(-s, -s, s * 2, s * 2); g.strokeRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6); g.restore(); },
  tiktok(g, s) { g.beginPath(); g.arc(-s * 0.3, s * 0.45, s * 0.45, 0, Math.PI * 2); g.moveTo(s * 0.15, s * 0.45); g.lineTo(s * 0.15, -s); g.quadraticCurveTo(s * 0.3, -s * 0.4, s, -s * 0.35); g.stroke(); },
  discord(g, s) { roundRect(g, -s, -s * 0.6, s * 2, s * 1.2, s * 0.5); g.stroke(); g.beginPath(); g.arc(-s * 0.4, 0, s * 0.16, 0, Math.PI * 2); g.arc(s * 0.4, 0, s * 0.16, 0, Math.PI * 2); g.stroke(); },
};

function drawCard({ kind, label, handle, sub, index, accent, avatar }) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // glass body
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, 'rgba(18,26,40,0.92)');
  bg.addColorStop(1, 'rgba(6,9,16,0.88)');
  roundRect(g, 8, 8, W - 16, H - 16, 28);
  g.fillStyle = bg; g.fill();
  g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.14)'; g.stroke();

  // accent corner brackets
  g.strokeStyle = accent; g.lineWidth = 5;
  const b = 46;
  for (const [x, y, sx, sy] of [[30, 30, 1, 1], [W - 30, 30, -1, 1], [30, H - 30, 1, -1], [W - 30, H - 30, -1, -1]]) {
    g.beginPath(); g.moveTo(x, y + sy * b); g.lineTo(x, y); g.lineTo(x + sx * b, y); g.stroke();
  }

  // scanlines
  g.fillStyle = 'rgba(255,255,255,0.025)';
  for (let y = 20; y < H; y += 6) g.fillRect(20, y, W - 40, 1);

  g.fillStyle = accent;
  g.font = '500 30px "JetBrains Mono", monospace';
  g.fillText(`${String(index).padStart(2, '0')} // ${label}`, 72, 100);

  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.textAlign = 'right';
  g.fillText('SIGNAL ● LIVE', W - 72, 100);
  g.textAlign = 'left';

  let textX = 72;
  if (avatar) {
    g.save();
    g.beginPath(); g.arc(160, 330, 96, 0, Math.PI * 2); g.clip();
    g.drawImage(avatar, 64, 234, 192, 192);
    g.restore();
    g.strokeStyle = accent; g.lineWidth = 4;
    g.beginPath(); g.arc(160, 330, 104, 0, Math.PI * 2); g.stroke();
    textX = 300;
  }

  // handle, auto-fit
  g.fillStyle = '#f2f6ff';
  let size = 96;
  do {
    g.font = `800 ${size}px Unbounded, sans-serif`;
    size -= 4;
  } while (g.measureText(handle).width > W - textX - 80 && size > 30);
  g.fillText(handle, textX, 360);

  g.fillStyle = 'rgba(220,232,255,0.6)';
  g.font = '500 30px "Space Grotesk", sans-serif';
  g.fillText(sub, textX, 420);

  // glyph
  g.save();
  g.translate(W - 130, H - 120);
  g.strokeStyle = accent; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
  GLYPHS[kind](g, 38);
  g.restore();

  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.font = '500 24px "JetBrains Mono", monospace';
  g.fillText('LEIXA // FXKIO', 72, H - 84);
  return canvasTexture(c);
}

export const PANEL_LAYOUT = [
  { x: -2.7, y: 0.25, z: -16 },
  { x: 2.7, y: -0.15, z: -27 },
  { x: -2.7, y: 0.3, z: -38 },
  { x: 2.7, y: 0.0, z: -49 },
  { x: -2.7, y: 0.2, z: -60 },
];

export class IdentityPanels {
  constructor(cards, avatarImage) {
    this.group = new THREE.Group();
    this.items = [];
    const glow = radialTexture(128, 'rgba(127,233,255,1)');
    cards.forEach((card, i) => {
      const L = PANEL_LAYOUT[i];
      const holder = new THREE.Group();
      holder.position.set(L.x, L.y, L.z);
      holder.rotation.y = L.x < 0 ? 0.32 : -0.32;
      const mat = new THREE.MeshBasicMaterial({
        map: drawCard({ ...card, index: i + 1, avatar: card.kind === 'player' ? avatarImage : null }),
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.12, 3.0), mat);
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 6),
        new THREE.MeshBasicMaterial({ map: glow, color: card.accent, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      halo.position.z = -0.3;
      holder.add(halo, plane);
      this.group.add(holder);
      this.items.push({ holder, mat, halo, phase: Math.random() * 6 });
    });
  }

  update(opacity, time, camera) {
    this.group.visible = opacity > 0.005;
    if (!this.group.visible) return;
    for (const it of this.items) {
      const d = Math.abs(camera.position.z - it.holder.position.z);
      const near = THREE.MathUtils.clamp(1.25 - d / 16, 0.25, 1);
      it.mat.opacity = opacity * near;
      it.halo.material.opacity = opacity * near * 0.22;
      it.holder.children[1].position.y = Math.sin(time * 0.8 + it.phase) * 0.08;
      it.holder.children[1].rotation.z = Math.sin(time * 0.5 + it.phase) * 0.015;
    }
  }
}
