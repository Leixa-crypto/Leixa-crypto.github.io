// Converts the Unbounded display face into a three.js typeface JSON,
// subset to the glyphs the 3D title needs. Run: npm run font
import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'node_modules/@fontsource/unbounded/files/unbounded-latin-800-normal.woff';
const OUT = 'src/assets/unbounded-800.typeface.json';
const CHARS = 'LEIXAFKO/ ';

const buf = readFileSync(SRC);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
const r = (v) => Math.round(v * scale);

const glyphs = {};
for (const ch of CHARS) {
  const g = font.charToGlyph(ch);
  let o = '';
  for (const c of g.path.commands) {
    if (c.type === 'M') o += `m ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'L') o += `l ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'Q') o += `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} `;
    else if (c.type === 'C') o += `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} `;
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o };
}

const json = {
  glyphs,
  familyName: font.names.fontFamily?.en || 'Unbounded',
  ascender: r(font.ascender),
  descender: r(font.descender),
  underlinePosition: r(font.tables.post.underlinePosition),
  underlineThickness: r(font.tables.post.underlineThickness),
  boundingBox: { xMin: r(font.tables.head.xMin), yMin: r(font.tables.head.yMin), xMax: r(font.tables.head.xMax), yMax: r(font.tables.head.yMax) },
  resolution: 1000,
  original_font_information: font.tables.name,
};
// glyph.path is in raw font units (y-up), which is what the typeface format expects.
writeFileSync(OUT, JSON.stringify(json));
console.log('wrote', OUT, Object.keys(glyphs).join(''));
