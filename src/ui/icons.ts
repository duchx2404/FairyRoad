import { PHAPQUYET } from '../data/spirit';
import { glyphInner } from './glyph';
import { photoSvg, photoCircle } from './art';
import { s as st } from '../engine/state';
// Biểu tượng vẽ tay (SVG) cho thuật pháp và công pháp: hình theo loại chiêu, nền theo màu hệ.
import { EL, type El } from '../data/core';
import { SKILLS, TECHS, TAMPHAP, TALIS, skHue, type Skill, type Tech } from '../data/items';

// Nét vẽ trên khung 24×24, màu trắng.
const G: Record<string, string> = {
  sword: '<path d="M5 19l2.5-2.5M6.5 14.5l3 3M8 16L18.5 5.5 19 5l-.5.5L8 16z" stroke-width="2.2"/><path d="M18.5 5.5L19 5" stroke-width="3"/>',
  saber: '<path d="M6 18c4-2 9-7 13-13-1 6-5 11-11 14z" fill="#fff" stroke="none"/><path d="M4.5 19.5l3-3" stroke-width="2.4"/>',
  spear: '<path d="M4 20L16 8" stroke-width="2"/><path d="M15 5l4-1-1 4-3 1z" fill="#fff"/><path d="M9 13l2 2" stroke-width="1.6"/>',
  palm: '<path d="M8 20v-6l-2-3c-.6-1 .8-2 1.6-1L9 12V5.5c0-1.2 1.8-1.2 1.8 0V11V4.5c0-1.2 1.8-1.2 1.8 0V11V5.5c0-1.2 1.8-1.2 1.8 0V12V8c0-1.2 1.8-1.2 1.8 0v7c0 3-2 5-4 5z" stroke-width="1.6"/>',
  fist: '<rect x="6" y="8" width="11" height="9" rx="3" stroke-width="1.8"/><path d="M9 8v3M12 8v3M15 8v3M6 12h-1.5" stroke-width="1.6"/><path d="M8 17v3h7v-3" stroke-width="1.6"/>',
  seal: '<rect x="5" y="5" width="14" height="14" rx="1.5" stroke-width="2"/><rect x="9" y="9" width="6" height="6" fill="#fff" stroke="none"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5" stroke-width="1.6"/>',
  finger: '<path d="M10 20v-8l-1.5-2c-.6-.9.6-1.9 1.4-1.1L11 10V4.5c0-1.3 2-1.3 2 0V13h3c.8 0 1.2.8 1 1.5L15.5 20" stroke-width="1.6"/><circle cx="12" cy="2.5" r="1" fill="#fff"/>',
  arrow: '<path d="M4 20L18 6" stroke-width="2"/><path d="M13 5h6v6" stroke-width="2"/><path d="M4 16v4h4" stroke-width="1.6"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6z" stroke-width="2"/><path d="M12 7v10M8 11h8" stroke-width="1.4"/>',
  boots: '<path d="M8 3h5v9l5 2.5c1 .5 1.5 1.3 1.5 2.5v2H6V3z" stroke-width="1.8"/><path d="M6 15h13" stroke-width="1.4"/><path d="M3 9h3M2 12h4" stroke-width="1.3"/>',
  heal: '<path d="M12 20s-7-4.3-7-9.5C5 7.5 7 6 9 6c1.4 0 2.4.8 3 1.8.6-1 1.6-1.8 3-1.8 2 0 4 1.5 4 4.5C19 15.7 12 20 12 20z" stroke-width="1.8"/><path d="M12 10v5M9.5 12.5h5" stroke-width="1.6"/>',
  poison: '<path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z" stroke-width="1.8"/><circle cx="10" cy="14" r="1.2" fill="#fff"/><circle cx="14" cy="16" r="1" fill="#fff"/>',
  vine: '<path d="M5 20c0-6 6-6 6-11 0-3-3-4-3-4M11 9c3 0 6 1 7 5M11 13c-2 1-4 3-4 7" stroke-width="1.8"/><path d="M15 9c1.5-1.5 3.5-1 4 0-1 1.5-3 1.6-4 0z" fill="#fff"/>',
  book: '<path d="M5 4.5h9a3 3 0 013 3V20H8a3 3 0 01-3-3z" stroke-width="1.8"/><path d="M17 20h2V6" stroke-width="1.6"/><path d="M8 8h6M8 11h6M8 14h4" stroke-width="1.3"/>',
  // cự nhân đầu đội trời chân đạp đất: mây ngang đầu, núi chỉ tới mắt cá, một tay giơ lên trời
  giant: '<path d="M2 3h4.5M17.5 3H22M3.5 5.2h2.5M18 5.2h2.5" stroke-width="1.3"/><circle cx="12" cy="4.6" r="2.1" fill="#fff" stroke="none"/><path d="M9 7.6h6l-.9 6.2 1.9 6.4h-2.6L12 15.2l-1.4 5H8l1.9-6.4z" fill="#fff" stroke="none"/><path d="M9.3 8.4L5 12.6M14.7 8.4L18.5 3.6" stroke-width="1.9"/><path d="M1.5 21.5h21" stroke-width="1.3"/><path d="M2 21.5l2-3 1.4 1.8 1-1.3 1.6 2.5M16 21.5l1.6-2.5 1 1.3 1.4-1.8 2 3" stroke-width="1.1"/>',
  // biểu tượng theo hệ
  hoa: '<path d="M12 21c-4 0-6-2.6-6-6 0-4 4-6 4-11 2 1.5 3 3.5 3 5.5 1-1 1.5-2 1.5-3 2 2 3.5 4.5 3.5 8 0 3.6-2.5 6.5-6 6.5z" fill="#fff" stroke="none"/>',
  loi: '<path d="M13 2L5 13h6l-2 9 9-12h-6l3-8z" fill="#fff" stroke="none"/>',
  thuy: '<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke-width="1.8"/>',
  bang: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" stroke-width="1.7"/>',
  tho: '<path d="M2 20l6-10 3.5 5L15 8l7 12z" fill="#fff" stroke="none"/>',
  phong: '<path d="M3 8h11a3 3 0 10-3-3M3 13h15a3 3 0 11-3 3M3 18h7" stroke-width="1.9"/>',
  moc: '<path d="M5 19C5 10 11 5 19 5c0 8-5 14-14 14z" stroke-width="1.8"/><path d="M5 19L14 10" stroke-width="1.6"/>',
  kim: '<path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff" stroke="none"/>',
  am: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="#fff"/>',
  quang: '<circle cx="12" cy="12" r="4.5" fill="#fff" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke-width="1.8"/>',
  none: '<circle cx="12" cy="12" r="6" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#fff"/>',
};

/** Phân loại chiêu theo tên và tính chất. */
/** Chiêu có hình riêng, không theo quy tắc tên / hệ. */
const SK_GLYPH: Record<string, string> = { phapthientuongdia: 'giant' };
export function skillShape(k: Skill): string {
  if (SK_GLYPH[k.id]) return SK_GLYPH[k.id];
  const n = k.n;
  if (/Thân Pháp|Bộ\b/.test(n)) return 'boots';
  if (/Kiếm/.test(n) || k.sword) return 'sword';
  if (/Đao|Nhận|Khai Thiên/.test(n)) return 'saber';
  if (/Thương/.test(n)) return 'spear';
  if (/Chưởng|Thủ$/.test(n)) return 'palm';
  if (/Quyền|Hống/.test(n)) return 'fist';
  if (/Ấn/.test(n)) return 'seal';
  if (/Chỉ/.test(n)) return 'finger';
  if (/Tiễn|Trùy|Thích/.test(n)) return 'arrow';
  if (k.k === 'shield' || /Tráo|Thuẫn|Kim Thân/.test(n)) return 'shield';
  if (k.k === 'heal') return 'heal';
  if (k.k === 'dot') return /Độc/.test(n) ? 'poison' : 'vine';
  return k.el || 'none';
}

const darken = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.round(v * f)).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
};
function tile(glyph: string, colors: string | string[], size: number, dim = false) {
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  const cs = Array.isArray(colors) ? colors : [colors];
  const color = cs[0];
  // đơn hệ: sáng → tối; đa hệ: chuyển sắc chéo qua từng màu
  const stops = cs.length === 1
    ? `<stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${darken(color, 0.62)}"/>`
    : cs.map((c, i) => `<stop offset="${(i / (cs.length - 1)).toFixed(3)}" stop-color="${darken(c, 0.85)}"/>`).join('');
  const edge = cs.length === 1 ? darken(color, 0.5) : '#3a3026';
  return `<svg class="sk-ic${dim ? ' dim' : ''}" width="${size}" height="${size}" viewBox="0 0 32 32"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="5" fill="url(#${id})" stroke="${edge}"/><rect x="3" y="3" width="26" height="26" rx="4" fill="none" stroke="#fff" stroke-opacity=".25"/><g transform="translate(4 4)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">${G[glyph] || G.none}</g></svg>`;
}
const elColor = (e: El | null | undefined) => (e ? EL[e].c : '#7a6a55');

/** Pháp Thiên Tượng Địa: cự nhân linh lực mang hình chính người dùng, màu theo hệ chủ đạo (hệ đầu) của công pháp chủ tu. */
function pttdPhoto(size: number, dim = false): string | null {
  if (!st) return null;
  const main = (st.tech && TECHS[st.tech]?.el[0]) || 'none';
  return photoSvg(`pttd_${st.g}_${main}`, main === 'none' ? '#c9b994' : EL[main].c, size, dim);
}
export function skillIconSvg(k: Skill | string, size = 32, dim = false): string {
  const s = typeof k === 'string' ? SKILLS[k] : k;
  if (!s) return tile('none', '#7a6a55', size, dim);
  const cs = skHue(s)?.c ?? [elColor(s.el)];
  if (s.id === 'phapthientuongdia') { const ph = pttdPhoto(size, dim); if (ph) return ph; }
  return photoSvg('sk_' + s.id, cs[0], size, dim) || tile(skillShape(s), cs, size, dim);
}
export function techIconSvg(t: Tech | string, size = 32, dim = false): string {
  const tc = typeof t === 'string' ? TECHS[t] : t;
  if (!tc) return tile('book', '#7a6a55', size, dim);
  const col = tc.evil ? '#6e1f1a' : tc.el.length ? EL[tc.el[0]].c : '#7a6a55';
  return tile('book', col, size, dim);
}
const PILL_COL: Record<string, string> = { cult: '#4f7a55', heal: '#b5463a', break: '#9a7a2e', life: '#3f8a7a', stat: '#5e4c8a', detox: '#3f6a85', root: '#8a3f6a' };
const PILL_GLYPH = '<path d="M9 3h6M10 3v3.5c-3 1.2-5 4-5 7.2C5 17.8 8.1 21 12 21s7-3.2 7-7.3c0-3.2-2-6-5-7.2V3" stroke-width="1.8"/><circle cx="12" cy="14" r="3" fill="#fff"/>';
export function pillIconSvg(kind: string, size = 32, grade = 1): string {
  G.pill = PILL_GLYPH;
  return tile('pill', PILL_COL[kind] || '#9b2a1f', size).replace('stroke-opacity=".25"', `stroke-opacity="${grade >= 3 ? 0.7 : grade >= 2 ? 0.45 : 0.25}"`);
}
export function tamIconSvg(giai: number, size = 32, dim = false, id?: string): string {
  const ph = id ? photoSvg('tp_' + id, TIER_GIAI_C[Math.max(1, Math.min(6, giai))], size, dim) : null;
  if (ph) return ph;
  G.lotus = '<path d="M12 19c-4 0-7-2-8-5 3 0 5 1 6 3-1-4 0-8 2-11 2 3 3 7 2 11 1-2 3-3 6-3-1 3-4 5-8 5z" stroke-width="1.6"/><path d="M5 21h14" stroke-width="1.4"/>';
  return tile('lotus', TIER_GIAI_C[Math.max(1, Math.min(6, giai))], size, dim);
}
const TIER_GIAI_C = ['#7a6e60', '#8a7650', '#35627e', '#6a4f98', '#a8862f', '#b0392b', '#b8558f'];
const PQ_G: Record<string, string> = {
  scroll: '<path d="M5 18L17 6" stroke-width="2.4"/><path d="M15 4l5 5-2 1-4-4z" fill="#fff"/><path d="M4 16l4 4-2 1-3-3z" fill="#fff"/><path d="M8 14l2 2M11 11l2 2" stroke-width="1.3"/>',
  boots: '', eye: '', mountain: '', person: '<circle cx="12" cy="6" r="3" fill="#fff"/><path d="M6 21v-5c0-3 2.5-5 6-5s6 2 6 5v5z" fill="#fff" stroke="none"/>', shield: '',
};
export function pqIconSvg(icon: string, giai: number, size = 32, id?: string): string {
  if (id === 'phapthien') { const ph = pttdPhoto(size); if (ph) return ph; }
  const ph = id ? photoSvg('fq_' + id, TIER_GIAI_C[Math.max(1, Math.min(6, giai))], size) : null;
  if (ph) return ph;
  G.pq_scroll = PQ_G.scroll; G.pq_person = PQ_G.person;
  const glyph = icon === 'scroll' ? 'pq_scroll' : icon === 'person' ? 'pq_person' : icon === 'mountain' ? 'tho' : icon;
  return tile(glyph === 'eye' ? 'am' : glyph, TIER_GIAI_C[Math.max(1, Math.min(6, giai))], size);
}
/** Chân linh / đối thủ: key = khoá ảnh bán thực (cl_<id>, foe_*), không có thì vẽ biểu tượng (ui/glyph.ts) trong vòng tròn. */
export function linhIconSvg(ic: string, el: El, size = 40, key?: string): string {
  const ph = key ? photoCircle(key, EL[el].c, size) : null;
  if (ph) return ph;
  const id = 'l' + Math.random().toString(36).slice(2, 8);
  const c = EL[el].c;
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40"><defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="${c}"/></radialGradient></defs><circle cx="20" cy="20" r="18" fill="url(#${id})" stroke="${darken(c, 0.55)}" stroke-width="1.5"/><circle cx="20" cy="20" r="14.5" fill="none" stroke="#fff" stroke-opacity=".4"/>${glyphInner(ic, 8, 8, 24, '#fff', 2)}</svg>`;
}
const SLOT_GLYPH = ['sword', 'shield', 'seal', 'ring', 'boots', 'furnace', 'ink', 'furnace'];
export function gearIconSvg(slot: number, giai: number, size = 32): string {
  G.ring = '<circle cx="12" cy="14" r="6" stroke-width="2.2"/><path d="M9 6l3-3 3 3-3 2z" fill="#fff"/>';
  return tile(SLOT_GLYPH[slot] || 'none', TIER_GIAI_C[Math.max(0, Math.min(6, giai))], size);
}
const MAT_G: Record<string, string> = {
  herb: '<path d="M12 21V10" stroke-width="1.8"/><path d="M12 13c-4 0-6-3-6-6 4 0 6 2 6 6zM12 11c0-4 2-7 6-7 0 4-2 7-6 7z" fill="#fff" stroke="none"/>',
  ore: '<path d="M5 15l3-8 7-2 5 6-2 8-9 1z" stroke-width="1.8"/><path d="M8 7l4 5 8-1M12 12l-2 8" stroke-width="1.2"/>',
  paper: '<rect x="6" y="3" width="12" height="18" rx="1" stroke-width="1.8"/><path d="M9 8h6M9 12h6M9 16h3" stroke-width="1.3"/>',
  ink: '<path d="M7 20h10l-1.5-9h-7z" stroke-width="1.8"/><path d="M12 11V6M10 4h4" stroke-width="1.6"/><circle cx="12" cy="16" r="1.6" fill="#fff"/>',
  hide: '<path d="M6 5c3 1 9 1 12 0l1 5-2 2 1 6c-4 2-8 2-12 0l1-6-2-2z" stroke-width="1.7"/>',
  core: '<circle cx="12" cy="12" r="6" fill="#fff" stroke="none"/><circle cx="12" cy="12" r="9" stroke-width="1.4"/>',
  talis: '<rect x="7" y="2.5" width="10" height="19" rx="1" stroke-width="1.8"/><path d="M12 6v12M9.5 9h5M9.5 13l5 2" stroke-width="1.4"/>',
  book: G.book,
  craft: '<path d="M4 20l7-7M13 11l3-3 4 4-3 3zM6 18l-2-2" stroke-width="2"/>',
};
const MAT_C: Record<string, string> = { herb: '#4f7a55', ore: '#6e6253', paper: '#b39a62', ink: '#9b2a1f', hide: '#8a6a3f', core: '#5e4c8a', talis: '#a8862f', book: '#3f6a85', craft: '#4f7a55' };
export function matIconSvg(id: string, size = 32): string {
  const [k, key] = id.split(':');
  let kind = 'ore';
  if (k === 'h') kind = 'herb';
  else if (k === 't') kind = 'talis';
  else if (k === 'recipe') kind = 'book';
  else if (k === 'craft') kind = 'craft';
  else if (key === 'phuchi') kind = 'paper';
  else if (key === 'chusa') kind = 'ink';
  else if (key === 'dayeu' || key === 'longthu' || key === 'longlan') kind = 'hide';
  else if (key === 'yeudan' || key === 'docnang') kind = 'core';
  G['m_' + kind] = MAT_G[kind];
  const col = k === 't' && TALIS[key]?.el ? EL[TALIS[key].el!].c : MAT_C[kind];
  return tile('m_' + kind, col, size);
}
/** Biểu tượng cho id vật phẩm 'cp:' / 'sk:' (null nếu không phải). */
export function scrollIconSvg(id: string, size = 32): string | null {
  if (id.startsWith('sk:')) return skillIconSvg(id.slice(3), size);
  if (id.startsWith('cp:')) return techIconSvg(id.slice(3), size);
  if (id.startsWith('tp:')) return tamIconSvg(TAMPHAP[id.slice(3)]?.tier || 1, size, false, id.slice(3));
  if (id.startsWith('fq:')) { const x = PHAPQUYET[id.slice(3)]; return x ? pqIconSvg(x.icon, x.tier, size, x.id) : null; }
  return null;
}
