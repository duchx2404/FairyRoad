// Tranh vẽ riêng cho từng vật phẩm (SVG nhiều màu, khung 32×32).
import { EL, type El } from '../data/core';
import { glyphInner } from './glyph';
import { HERBS, MATS, PILLS, TALIS, TECHS, TAMPHAP, TIER_C, type Gear } from '../data/items';
import { PHAPQUYET } from '../data/spirit';
import { pillGiai } from '../data/items';

let uidN = 0;
// ---------- Tranh bán thực (public/items/*.webp, sinh bằng tools/gen_items.py) ----------
const PHOTOS = new Set<string>();
const PHOTO_V = new Map<string, number>(); // khoá vừa vẽ lại trong phiên → thêm ?v= để trình duyệt không dùng ảnh cũ
/** Đường dẫn ảnh bán thực của một khoá (có đuôi phiên bản nếu vừa vẽ lại). */
export const photoUrl = (key: string) => `items/${key}.webp${PHOTO_V.has(key) ? '?v=' + PHOTO_V.get(key) : ''}`;
/** Ghi nhận một khoá vừa được máy vẽ vẽ xong: coi như đã có ảnh, đổi phiên bản, báo cho giao diện vẽ lại. */
export function markPhoto(key: string) {
  PHOTOS.add(key);
  PHOTO_V.set(key, Date.now());
  window.dispatchEvent(new CustomEvent('tienlo-photo', { detail: key }));
}
export async function loadItemPhotos() {
  try {
    const r = await fetch('items/manifest.json', { cache: 'no-cache' });
    if (r.ok) for (const k of (await r.json()) as string[]) PHOTOS.add(k);
  } catch { /* chưa có ảnh: dùng hình vẽ vector */ }
}
function photo(key: string, border: string, size: number, dim = false): string | null {
  if (!PHOTOS.has(key)) return null;
  const c = gid();
  return `<svg class="art-ic photo${dim ? ' dim' : ''}" width="${size}" height="${size}" viewBox="0 0 32 32"><defs><clipPath id="${c}"><rect x="1" y="1" width="30" height="30" rx="5"/></clipPath></defs><image href="${photoUrl(key)}" x="1" y="1" width="30" height="30" preserveAspectRatio="xMidYMid slice" clip-path="url(#${c})"/><rect x="1" y="1" width="30" height="30" rx="5" fill="none" stroke="${border}" stroke-width="1.8"/></svg>`;
}
const GEAR_SLUG: [RegExp, string][] = [[/Phất trần$/, 'phattran'], [/Hộ tâm kính$/, 'hotamkinh'], [/Lân giáp$/, 'langiap'], [/Ngọc bội$/, 'ngocboi'], [/Kiếm$/, 'kiem'], [/Đao$/, 'dao'], [/Thương$/, 'thuong'], [/Phiến$/, 'phien'], [/Tiêu$/, 'tieu'], [/Châm$/, 'cham'], [/Câu$/, 'cau'], [/Giáp$/, 'giap'], [/Bào$/, 'bao'], [/ Y$/, 'y'], [/Ấn$/, 'an'], [/Chung$/, 'chung'], [/Bình$/, 'binh'], [/Kính$/, 'kinh'], [/Đỉnh$/, 'dinh'], [/Tháp$/, 'thap'], [/Châu$/, 'chau'], [/Linh$/, 'linh'], [/Giới$/, 'gioi'], [/Hoàn$/, 'hoan'], [/Trạc$/, 'trac'], [/Ngoa$/, 'ngoa'], [/Hài$/, 'hai'], [/Lý$/, 'ly']];
/** Đã có ảnh bán thực cho khoá này chưa (public/items/<khoá>.webp). */
export const hasPhoto = (key: string) => PHOTOS.has(key);
/** Ảnh bán thực theo khoá (khung vuông bo góc), null nếu chưa vẽ. */
export const photoSvg = (key: string, border: string, size: number, dim = false) => photo(key, border, size, dim);
/** Ảnh bán thực khung tròn cho chân dung, null nếu chưa vẽ. */
/** Ảnh tròn. `ring=false`: tràn hết ô, không vẽ viền riêng — dùng khi khung chứa (.avatar, .rel-av) đã có viền tròn, tránh hai vòng. */
export function photoCircle(key: string, border: string, size: number, ring = true): string | null {
  if (!PHOTOS.has(key)) return null;
  const c = gid();
  if (!ring) return `<svg class="art-ic photo" width="${size}" height="${size}" viewBox="0 0 40 40"><defs><clipPath id="${c}"><circle cx="20" cy="20" r="20"/></clipPath></defs><image href="${photoUrl(key)}" x="0" y="0" width="40" height="40" preserveAspectRatio="xMidYMid slice" clip-path="url(#${c})"/></svg>`;
  return `<svg class="art-ic photo" width="${size}" height="${size}" viewBox="0 0 40 40"><defs><clipPath id="${c}"><circle cx="20" cy="20" r="18.5"/></clipPath></defs><image href="${photoUrl(key)}" x="1.5" y="1.5" width="37" height="37" preserveAspectRatio="xMidYMid slice" clip-path="url(#${c})"/><circle cx="20" cy="20" r="18.5" fill="none" stroke="${border}" stroke-width="2"/></svg>`;
}
function photoKey(id: string): string {
  const [k, key] = id.split(':');
  if (k === 'cp') { const t = TECHS[key]; return t ? (t.evil ? 'b_cp_evil' : 'b_cp_' + (t.el[0] || 'none')) : ''; }
  if (k === 'tp') return PHOTOS.has('tp_' + key) ? 'tp_' + key : 'b_tp';
  if (k === 'fq') return PHOTOS.has('fq_' + key) ? 'fq_' + key : 'b_fq';
  if (k === 'recipe') return 'b_recipe';
  if (k === 't' && key.startsWith('co_')) return 't_' + key.slice(3);
  return `${k}_${key}`;
}
const gid = () => 'a' + (uidN++).toString(36);
function frame(inner: string, border: string, size: number, dim = false) {
  const g = gid();
  return `<svg class="art-ic${dim ? ' dim' : ''}" width="${size}" height="${size}" viewBox="0 0 32 32"><defs><radialGradient id="${g}" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e9dcbd"/></radialGradient></defs><rect x="1" y="1" width="30" height="30" rx="5" fill="url(#${g})" stroke="${border}" stroke-width="1.6"/>${inner}</svg>`;
}
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
};
const INK = '#3a2f26';

// ================= Linh thảo =================
const grass = (c: string, tip: string) => `<path d="M16 27c-1-6-5-9-8-12M16 27c0-7 1-12 3-17M16 27c1-5 4-8 8-10M16 27c-.5-5-2-9-4-13" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="8" cy="15" r="1.6" fill="${tip}"/><circle cx="19" cy="10" r="1.8" fill="${tip}"/><circle cx="24" cy="17" r="1.5" fill="${tip}"/><circle cx="12" cy="14" r="1.2" fill="${tip}"/><path d="M10 27h12" stroke="${INK}" stroke-width="1" opacity=".4"/>`;
const leaves = (c: string) => `<path d="M16 27V13" stroke="${shade(c, 0.6)}" stroke-width="1.6"/><path d="M16 22c-5 0-8-3-8-7 5 0 8 3 8 7zM16 18c5 0 8-3 8-7-5 0-8 3-8 7zM16 14c-3-1-4-4-3-7 3 1 4 4 3 7z" fill="${c}" stroke="${shade(c, 0.55)}" stroke-width=".8"/>`;
const lotus = (p: string, ctr: string) => `<path d="M6 21c3 4 17 4 20 0" fill="#5a8a6a" opacity=".7"/><path d="M16 22c-4-3-5-8-3-13 2 2 3 7 3 13zM16 22c4-3 5-8 3-13-2 2-3 7-3 13z" fill="${p}" stroke="${shade(p, 0.6)}" stroke-width=".8"/><path d="M16 22c-6 0-9-3-10-7 4 0 8 3 10 7zM16 22c6 0 9-3 10-7-4 0-8 3-10 7z" fill="${shade(p, 0.9)}" stroke="${shade(p, 0.6)}" stroke-width=".8"/><circle cx="16" cy="18" r="2" fill="${ctr}"/>`;
const lingzhi = (cap: string) => `<path d="M15 28c0-5 1-8 1-11" stroke="#8a6a3f" stroke-width="2.4" fill="none"/><path d="M5 14c1-6 7-9 12-8s10 4 10 9c-3 2-7 2-11 1s-8 0-11-2z" fill="${cap}" stroke="${shade(cap, 0.55)}" stroke-width="1"/><path d="M9 12c3-2 9-3 14 0M8 14c4-1 10-1 16 1" stroke="${shade(cap, 1.35)}" stroke-width=".9" fill="none"/><path d="M20 22c2-3 5-3 7-1-2 2-5 2-7 1z" fill="${shade(cap, 0.85)}"/>`;
const ginseng = (c: string) => `<path d="M16 7c-2 3 1 3 0 6" stroke="#4f7a45" stroke-width="1.4" fill="none"/><path d="M12 6l4 2 4-2-4-3z" fill="#5a8a50"/><circle cx="16" cy="5" r="1.4" fill="#c0392b"/><path d="M13 13c-2 4-1 8 0 10l-3 5M19 13c2 4 1 8 0 10l3 5M14 23l-1 5M18 23l1 5" stroke="${shade(c, 0.6)}" stroke-width="1.2" fill="none"/><path d="M13 13c0-2 6-2 6 0 1 4 1 8-3 10-4-2-4-6-3-10z" fill="${c}" stroke="${shade(c, 0.55)}"/>`;
const fruit = (c: string, mark = '') => `<path d="M16 8c1-3 3-4 5-4-1 2-3 3-5 4z" fill="#4f7a45"/><path d="M16 8v3" stroke="#6b4b2e" stroke-width="1.3"/><circle cx="16" cy="18" r="8.5" fill="${c}" stroke="${shade(c, 0.55)}" stroke-width="1"/><ellipse cx="13" cy="15" rx="2.5" ry="1.6" fill="#fff" opacity=".45"/>${mark}`;
const flower = (p: string, ctr: string, n = 6) => `<path d="M16 28v-9" stroke="#4f7a45" stroke-width="1.6"/><path d="M16 24c-3 0-5-2-5-4 3 0 5 2 5 4z" fill="#5a8a50"/>${Array.from({ length: n }, (_, i) => `<ellipse cx="16" cy="9.5" rx="2.6" ry="5" fill="${p}" stroke="${shade(p, 0.6)}" stroke-width=".7" transform="rotate(${(360 / n) * i} 16 14)"/>`).join('')}<circle cx="16" cy="14" r="2.6" fill="${ctr}"/>`;
const branch = (c: string, extra = '') => `<path d="M7 26L24 7M14 18l-6-2M18 14l6 1M20 11l-1-5" stroke="${c}" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M25 6l-1 1" stroke="${c}" stroke-width="3"/>${extra}`;
const crystalLeaf = (c: string) => `<path d="M16 28V16" stroke="${shade(c, 0.6)}" stroke-width="1.4"/><path d="M16 17l-6-6 3-6 3 4 3-4 3 6z" fill="${c}" stroke="${shade(c, 0.5)}" stroke-width=".9"/><path d="M16 17l-4-8M16 17l4-8M16 9v8" stroke="#fff" stroke-width=".7" opacity=".7"/><path d="M16 23l-5-3 1-3 4 2zM16 23l5-3-1-3-4 2z" fill="${shade(c, 0.85)}"/>`;
const woodHeart = (c: string) => `<circle cx="16" cy="16" r="10" fill="#8a6a3f" stroke="#5a4028"/><circle cx="16" cy="16" r="7.5" fill="#a5814f"/><circle cx="16" cy="16" r="5" fill="#b8925a" stroke="#8a6a3f" stroke-width=".6"/><circle cx="16" cy="16" r="3" fill="${c}"/><circle cx="16" cy="16" r="1.2" fill="#e8ffd8"/>`;
const starStamen = (c: string) => `<path d="M16 4l2.5 8 8 .5-6.5 5 2.5 8-6.5-5-6.5 5 2.5-8-6.5-5 8-.5z" fill="${c}" stroke="${shade(c, 0.55)}" stroke-width=".8"/><circle cx="16" cy="15" r="2.5" fill="#fff"/><circle cx="9" cy="7" r=".8" fill="${c}"/><circle cx="25" cy="23" r=".9" fill="${c}"/>`;
const daoFruit = () => `<circle cx="16" cy="17" r="9" fill="#d9b44a" stroke="#8a6a1f"/><path d="M16 8a4.5 4.5 0 010 9 4.5 4.5 0 000 9" fill="none" stroke="#3a2f26" stroke-width="1.2"/><path d="M16 8a9 9 0 000 18 4.5 4.5 0 010-9 4.5 4.5 0 000-9z" fill="#3a2f26" opacity=".85"/><circle cx="16" cy="12.5" r="1.3" fill="#3a2f26"/><circle cx="16" cy="21.5" r="1.3" fill="#d9b44a"/><path d="M16 8c1-3 3-4 5-4" stroke="#4f7a45" stroke-width="1.6" fill="none"/>`;
const HERB_ART: Record<string, () => string> = {
  ngungkhithao: () => grass('#5a8a50', '#bfe8ff'),
  xichdiepthao: () => leaves('#c0473a'),
  thanhtamlien: () => lotus('#9fc4e8', '#f2d06b'),
  hoangtinh: () => `<path d="M8 20c2-5 13-6 17-1 2 4-3 8-9 8s-10-3-8-7z" fill="#c9a24a" stroke="#7a5e1f"/><path d="M10 21c3 1 8 1 12-1M12 24c3 0 6 0 9-1" stroke="#7a5e1f" stroke-width=".8" fill="none"/><path d="M16 15c-1-4-4-6-7-7 2 3 4 5 7 7zM17 15c1-5 4-7 7-8-1 3-3 6-7 8z" fill="#5a8a50"/>`,
  baclinhchi: () => lingzhi('#a8432c'),
  tuyetlien: () => lotus('#f6f8fb', '#cfe6f5'),
  hoaduongqua: () => fruit('#e07a2c', '<path d="M16 13c2 2 2 5 0 7-2-2-2-5 0-7z" fill="#ffd27a"/>'),
  kimtuyenthao: () => grass('#c9a24a', '#fff2b0'),
  longtuthao: () => `<path d="M16 27c0-6-2-9-6-11-3-2-3-6 0-7M16 27c0-7 2-10 6-12 3-2 3-6 0-7M16 27c-1-8 0-14 1-19" stroke="#3f8a9c" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="10" cy="9" r="1.4" fill="#7fd0e0"/><circle cx="22" cy="8" r="1.4" fill="#7fd0e0"/>`,
  thienniensam: () => ginseng('#c0473a'),
  loikichmoc: () => branch('#6b4b2e', '<path d="M22 3l-4 6h3l-3 6 6-8h-3l2-4z" fill="#b48cff" stroke="#5e3fa0" stroke-width=".6"/>'),
  phongvuthao: () => `<path d="M16 28V10" stroke="#4f7a55" stroke-width="1.4"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M16 ${11 + i * 3.4}c-5-1-8 0-10 2M16 ${11 + i * 3.4}c5-1 8 0 10 2" stroke="#7ab88f" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('')}<path d="M4 8c3 1 5 0 7-2" stroke="#9fc4e8" stroke-width="1" fill="none"/>`,
  cuuchuyenhoa: () => `${flower('#8a5cc0', '#f2d06b', 9)}<path d="M16 14m-6 0a6 6 0 1012 0" fill="none" stroke="#e8d8ff" stroke-width=".7"/>`,
  bangtamthao: () => crystalLeaf('#8fd0f0'),
  hoalongqua: () => fruit('#d23a6a', '<path d="M10 14l3 2M22 14l-3 2M12 22l2-2M20 22l-2-2M16 11v3" stroke="#6fbf5a" stroke-width="1.6"/>'),
  vannienthanhmoc: () => woodHeart('#4fbf6a'),
  tinhthannhuy: () => starStamen('#e8c24a'),
  hongmongqua: () => `<circle cx="16" cy="17" r="9" fill="url(#hm)" stroke="#5e4c8a"/><defs><linearGradient id="hm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c0473a"/><stop offset=".33" stop-color="#e8c24a"/><stop offset=".66" stop-color="#4f9a80"/><stop offset="1" stop-color="#5e4c8a"/></linearGradient></defs><path d="M10 17c2-4 10-4 12 0" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/><path d="M16 8c1-3 3-4 5-4" stroke="#4f7a45" stroke-width="1.6" fill="none"/>`,
  uminhthao: () => grass('#4a3a6a', '#b48cff'),
  thienquanghoa: () => `${flower('#f2d06b', '#fff8d0', 8)}<circle cx="16" cy="14" r="9" fill="none" stroke="#f2d06b" stroke-width=".6" stroke-dasharray="1 2"/>`,
  dahonlien: () => lotus('#4a3a6a', '#b48cff'),
  kimodienqua: () => fruit('#f0b52a', '<circle cx="16" cy="18" r="3.5" fill="#fff3b0"/><path d="M16 9v-2M8 18H6M26 18h-2M10 12l-1-1M22 12l1-1" stroke="#f0b52a" stroke-width="1.4"/>'),
};

// ================= Vật liệu =================
const ingot = (c: string) => `<path d="M5 20l3-7h16l3 7-3 4H8z" fill="${c}" stroke="${shade(c, 0.5)}" stroke-width="1"/><path d="M8 13l3 4h10l3-4" fill="none" stroke="${shade(c, 1.4)}" stroke-width="1"/><path d="M11 17l-3 7M21 17l3 7" stroke="${shade(c, 0.7)}" stroke-width=".8"/><path d="M10 15h4" stroke="#fff" stroke-width="1" opacity=".6"/>`;
const MAT_ART: Record<string, () => string> = {
  longthu: () => `<path d="M8 25c-2-6 0-13 4-17M12 26c-1-7 1-13 5-18M16 26c0-6 2-12 6-16M20 26c1-5 3-9 6-11" stroke="#9a8a7a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M6 26h20" stroke="#6e6253" stroke-width="2.4" stroke-linecap="round"/>`,
  dayeu: () => `<path d="M9 6c3 2 11 2 14 0l3 5-3 2 1 8-3 5c-4 1-8 1-12 0l-3-5 1-8-3-2z" fill="#a5814f" stroke="#6b4b2e" stroke-width="1"/><path d="M12 12c2 1 6 1 8 0M11 17c3 1 7 1 10 0M12 22c2 1 6 1 8 0" stroke="#6b4b2e" stroke-width=".8" fill="none" opacity=".7"/>`,
  docnang: () => `<path d="M16 5c-1 3-8 8-8 14a8 8 0 0016 0c0-6-7-11-8-14z" fill="#6fae4a" stroke="#3f6a2a"/><circle cx="13.5" cy="18" r="1.6" fill="#2a3a1a"/><circle cx="18.5" cy="18" r="1.6" fill="#2a3a1a"/><path d="M13 23h6" stroke="#2a3a1a" stroke-width="1.2"/><ellipse cx="12" cy="13" rx="1.5" ry="2.4" fill="#fff" opacity=".4"/>`,
  yeudan: () => `<circle cx="16" cy="16" r="10" fill="#f0b52a" opacity=".22"/><circle cx="16" cy="16" r="7" fill="#e07a2c" stroke="#8a3f1a"/><circle cx="16" cy="16" r="3.5" fill="#ffd27a"/><ellipse cx="13" cy="13" rx="2" ry="1.3" fill="#fff" opacity=".6"/><path d="M16 4v3M16 25v3M4 16h3M25 16h3" stroke="#e07a2c" stroke-width="1.2"/>`,
  longlan: () => `${[[11, 12], [21, 12], [16, 18], [11, 24], [21, 24]].map(([x, y]) => `<path d="M${x - 5} ${y - 3}a5 5 0 0010 0c0 4-2 7-5 8-3-1-5-4-5-8z" fill="#3f8a9c" stroke="#1f4a5a" stroke-width=".8"/><path d="M${x - 2} ${y}l2 3 2-3" stroke="#9fe0f0" stroke-width=".7" fill="none"/>`).join('')}`,
  linhmoc: () => woodHeart('#6fbf5a'),
  hukhongthach: () => `<path d="M7 22l2-11 8-5 8 5 1 10-8 6z" fill="#2c2438" stroke="#120e18"/><path d="M14 10l3 6-4 4 5 5M17 16l5-3" stroke="#b48cff" stroke-width="1.4" fill="none"/><circle cx="23" cy="8" r="1" fill="#e8d8ff"/><circle cx="7" cy="9" r=".8" fill="#e8d8ff"/>`,
  hondonthach: () => `<path d="M7 22l2-11 8-5 8 5 1 10-8 6z" fill="#3b2754" stroke="#180f24"/><path d="M14 10l3 6-4 4 5 5M17 16l5-3" stroke="#e2b857" stroke-width="1.4" fill="none"/><circle cx="23" cy="8" r="1.2" fill="#f5d97e"/>`,
  hondonkim: () => ingot('#a886d8'),
  hondonngoc: () => `<path d="M16 4l9 7-3 13H10L7 11z" fill="#a886d8" stroke="#5e3fa0" stroke-width="1"/><path d="M16 4l-3 7 3 13M16 4l3 7-3 13M7 11h18" stroke="#f0e6ff" stroke-width=".8" fill="none" opacity=".85"/>`,
  hondonhoa: () => `<circle cx="16" cy="16" r="10" fill="#a886d8" opacity=".25"/><circle cx="16" cy="16" r="7" fill="#8b57b8" stroke="#4a2a6a"/><circle cx="16" cy="16" r="3.5" fill="#f2d06b"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4" stroke="#f2d06b" stroke-width="1.3"/>`,
  huyenthiet: () => ingot('#4a4550'),
  tinhkim: () => ingot('#d9b44a'),
  hanngoc: () => `<path d="M16 4l9 7-3 13H10L7 11z" fill="#8fd0e0" stroke="#3f8a9c" stroke-width="1"/><path d="M16 4l-3 7 3 13M16 4l3 7-3 13M7 11h18" stroke="#e8fbff" stroke-width=".8" fill="none" opacity=".8"/>`,
  thienthach: () => `<path d="M6 20c-1-6 4-12 10-12 7 0 11 5 10 11-1 5-6 7-10 7-6 0-9-2-10-6z" fill="#5a524c" stroke="#2a2420"/><circle cx="12" cy="17" r="2" fill="#3a3430"/><circle cx="20" cy="20" r="1.5" fill="#3a3430"/><path d="M19 12l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L16 14.3l2-.3z" fill="#f2d06b"/><path d="M27 5l-4 4M29 8l-3 2" stroke="#f2d06b" stroke-width="1"/>`,
  phuchi: () => `<rect x="9" y="5" width="13" height="20" rx="1" fill="#e8d18a" stroke="#9a7a2e" transform="rotate(-8 16 15)"/><rect x="10" y="6" width="13" height="20" rx="1" fill="#f2df9a" stroke="#9a7a2e"/><path d="M13 10h7M13 14h7M13 18h5" stroke="#c9a85a" stroke-width="1"/>`,
  chusa: () => `<ellipse cx="14" cy="22" rx="9" ry="4" fill="#6e6253"/><ellipse cx="14" cy="20.5" rx="7.5" ry="2.8" fill="#c0392b"/><path d="M20 19L27 6" stroke="#6b4b2e" stroke-width="2" stroke-linecap="round"/><path d="M19 20l1.5-3 2 1z" fill="#2a241f"/>`,
};

// ================= Đan dược =================
const PILL_COLOR: Record<string, string> = {
  tukhi: '#6fae6a', hoixuandan: '#7ac07a', khaimach: '#e0a04a', giaidoc: '#5aa0c8', trucco: '#d9b44a', ngungnguyen: '#5a86c8', tucotthuc: '#e8e0cc',
  ketdan: '#e8c24a', hoanguyen: '#4fa8a0', diennien: '#f0a0a8', hoaanh: '#f2d06b', duonganh: '#f0b8c8', tayconghoan: '#f6f8fb', ngungthan: '#8a5cc0',
  thanhtamdan: '#a8d8f0', khaitridan: '#9a7ae0', luyencotdan: '#e8d8b8', hoathan: '#7fd0e0', phahu: '#3a3048', hopnguyen: '#6a8ac8', daithua: '#e8c24a', truongsinh: '#f0c060',
};
const PILL_MARK: Record<string, string> = {
  tukhi: '<path d="M13 16a3 3 0 106 0 2 2 0 00-4 0" stroke="#fff" stroke-width="1.2" fill="none"/>',
  hoixuandan: '<path d="M16 20c-3-1-4-4-3-7 3 1 4 4 3 7z" fill="#fff" opacity=".8"/>',
  khaimach: '<path d="M11 13c2 2 4 0 5 3s3 1 5 3" stroke="#fff" stroke-width="1.2" fill="none"/>',
  giaidoc: '<path d="M16 11c-1 2-3 4-3 6a3 3 0 006 0c0-2-2-4-3-6z" fill="#fff" opacity=".85"/>',
  trucco: '<rect x="12.5" y="13" width="7" height="7" fill="none" stroke="#7a5e1f" stroke-width="1.3"/><path d="M12.5 16.5h7M16 13v7" stroke="#7a5e1f" stroke-width=".8"/>',
  ngungnguyen: '<circle cx="16" cy="16.5" r="2.5" fill="#fff" opacity=".8"/>',
  tucotthuc: '<path d="M12 19l8-6M11 18a1.3 1.3 0 112 1.4M19 12.6a1.3 1.3 0 112 1.4" stroke="#8a7a60" stroke-width="1.4" fill="none"/>',
  ketdan: '<circle cx="16" cy="16.5" r="3.5" fill="none" stroke="#8a6a1f" stroke-width="1.3"/><circle cx="16" cy="16.5" r="1.4" fill="#8a6a1f"/>',
  hoanguyen: '<path d="M12 18c2-4 6-4 8 0" stroke="#fff" stroke-width="1.2" fill="none"/>',
  hoaanh: '<circle cx="16" cy="13.5" r="2" fill="#8a5a2a"/><path d="M13 20c0-3 6-3 6 0z" fill="#8a5a2a"/>',
  duonganh: '<circle cx="16" cy="14" r="1.8" fill="#a85a7a"/><path d="M13.5 20c0-3 5-3 5 0z" fill="#a85a7a"/>',
  tayconghoan: '<path d="M11 15c2-1.5 3 1.5 5 0s3 1.5 5 0M11 18.5c2-1.5 3 1.5 5 0s3 1.5 5 0" stroke="#5aa0c8" stroke-width="1.1" fill="none"/>',
  ngungthan: '<path d="M11 16.5s2-3 5-3 5 3 5 3-2 3-5 3-5-3-5-3z" fill="#fff" opacity=".85"/><circle cx="16" cy="16.5" r="1.4" fill="#4a3a6a"/>',
  thanhtamdan: '<path d="M16 20c-2-1-3-4-2-6 1.5 1 2 3 2 6zM16 20c2-1 3-4 2-6-1.5 1-2 3-2 6z" fill="#fff" opacity=".85"/>',
  khaitridan: '<path d="M16 12l1.2 3 3 .2-2.4 1.9.9 3L16 18.4l-2.7 1.7.9-3-2.4-1.9 3-.2z" fill="#fff"/>',
  luyencotdan: '<path d="M12 19l8-6" stroke="#a89060" stroke-width="2" stroke-linecap="round"/>',
  phahu: '<path d="M13 12l3 4-2 2 4 3" stroke="#b48cff" stroke-width="1.3" fill="none"/>',
  hopnguyen: '<path d="M16 11.5a5 5 0 010 10" fill="#fff" opacity=".6"/>',
  daithua: '<circle cx="16" cy="16.5" r="4" fill="none" stroke="#c0473a" stroke-width="1"/><circle cx="16" cy="16.5" r="2.5" fill="none" stroke="#4f9a80" stroke-width="1"/>',
};
function pillArt(id: string): string {
  if (id === 'diennien' || id === 'truongsinh') {
    const c = PILL_COLOR[id];
    return `<path d="M16 26c-6 0-10-4-10-9 0-5 4-8 8-8 1 0 2 .5 2 .5s1-.5 2-.5c4 0 8 3 8 8 0 5-4 9-10 9z" fill="${c}" stroke="${shade(c, 0.6)}"/><path d="M16 9.5c0 4-1 9-2 15" stroke="${shade(c, 0.7)}" stroke-width=".9" fill="none"/><path d="M16 9c2-3 5-4 7-3-1 2-4 3-7 3z" fill="#5a8a50"/><ellipse cx="11" cy="15" rx="2" ry="1.4" fill="#fff" opacity=".5"/>${id === 'truongsinh' ? '<path d="M16 3l.8 2 2 .2-1.5 1.3.5 2-1.8-1.1-1.8 1.1.5-2L13.2 5.2l2-.2z" fill="#f2d06b"/>' : ''}`;
  }
  if (id === 'hoathan') return `<path d="M13 5h6M14 5v5c-4 2-6 5-6 9a8 8 0 0016 0c0-4-2-7-6-9V5" fill="#e8f6fb" stroke="#3f8a9c" stroke-width="1.2"/><path d="M9 19a7 7 0 0014 0c-3 1.5-11 1.5-14 0z" fill="#7fd0e0"/><circle cx="13" cy="17" r="1" fill="#fff"/>`;
  const c = PILL_COLOR[id] || '#c0473a';
  const g = gid();
  return `<defs><radialGradient id="${g}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${shade(c, 1.45)}"/><stop offset="1" stop-color="${shade(c, 0.7)}"/></radialGradient></defs><ellipse cx="16" cy="26" rx="8" ry="2" fill="#000" opacity=".12"/><circle cx="16" cy="16.5" r="8.5" fill="url(#${g})" stroke="${shade(c, 0.5)}" stroke-width=".9"/>${PILL_MARK[id] || ''}<ellipse cx="12.8" cy="12.8" rx="2.4" ry="1.5" fill="#fff" opacity=".55"/>`;
}

// ================= Phù lục =================
const RUNE: Record<string, string> = {
  hoaphu: '<path d="M16 22c-3 0-4-2-4-4 0-3 3-4 3-8 2 1 4 4 4 6 1-1 1-2 1-3 1 2 1 3 1 5 0 2-2 4-5 4z" fill="#c0392b"/>',
  kimcangphu: '<path d="M16 9l5 2v4c0 4-2 6-5 7-3-1-5-3-5-7v-4z" fill="none" stroke="#c0392b" stroke-width="1.5"/><path d="M16 12v7M13.5 15h5" stroke="#c0392b" stroke-width="1.2"/>',
  thanhanhphu: '<path d="M11 21c2-1 3-4 3-7l3 1c0 3 1 4 3 5l-2 2c-2-1-4-1-7-1z" fill="#c0392b"/><path d="M8 12h4M7 15h4" stroke="#c0392b" stroke-width="1"/>',
  hoixuanphu: '<path d="M16 21c-4-2-5-6-3-10 4 1 5 5 3 10zM16 21c3-2 5-5 4-9-3 1-4 4-4 9z" fill="#c0392b"/>',
  loiphu: '<path d="M17 8l-5 7h3l-2 7 6-8h-3l2-6z" fill="#c0392b"/>',
  bangphu: '<path d="M16 9v13M10.5 12l11 7M21.5 12l-11 7" stroke="#c0392b" stroke-width="1.5"/>',
  doanhphu: '<path d="M16 10l5 3v5l-5 3-5-3v-5z" fill="none" stroke="#c0392b" stroke-width="1.4"/><path d="M16 10v11M11 13l10 5M21 13l-10 5" stroke="#c0392b" stroke-width=".7"/>',
  dichphu: '<path d="M10 16a6 6 0 1011-3M21 13l-3 .5M21 13l.5 3" stroke="#c0392b" stroke-width="1.5" fill="none"/>',
  thienloiphu: '<path d="M12 8l-3 5h2l-1 5 4-6h-2l1-4zM20 8l-3 5h2l-1 5 4-6h-2l1-4z" fill="#c0392b"/><path d="M12 21h8" stroke="#c0392b" stroke-width="1.4"/>',
  phongthienphu: '<rect x="11" y="10" width="10" height="10" fill="none" stroke="#c0392b" stroke-width="1.5"/><path d="M13 13h6M13 16h6M16 13v6" stroke="#c0392b" stroke-width="1"/>',
  tutienphu: '<path d="M16 7v15M13 18h6M16 22l-1 2h2z" stroke="#c0392b" stroke-width="1.6"/><path d="M16 7l-1.5 3h3z" fill="#c0392b"/>',
};
function talisArt(id: string): string {
  return `<path d="M10 3h12v26l-6-3-6 3z" fill="#f2df9a" stroke="#9a7a2e" stroke-width="1"/><path d="M11.5 5h9" stroke="#c0392b" stroke-width="1.2"/><circle cx="16" cy="25" r="1.2" fill="#c0392b"/>${RUNE[id] || RUNE.kimcangphu}`;
}

// ================= Pháp khí =================
const GEAR_SHAPES: [RegExp, (m: string, a: string) => string][] = [
  [/Kiếm$/, (m, a) => `<path d="M7 25l2.5-2.5" stroke="${a}" stroke-width="3" stroke-linecap="round"/><path d="M8 20l4 4" stroke="${INK}" stroke-width="2.2"/><path d="M11 21L24 8l2-3-3 2L10 20z" fill="${m}" stroke="${shade(m, 0.5)}" stroke-width=".9"/><path d="M12 20L25 7" stroke="#fff" stroke-width=".7" opacity=".7"/>`],
  [/Đao$/, (m, a) => `<path d="M8 24l3-3" stroke="${a}" stroke-width="3" stroke-linecap="round"/><path d="M11 21c5-3 10-9 14-16 0 8-5 13-12 18z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M10 19l4 4" stroke="${INK}" stroke-width="2"/>`],
  [/Thương$/, (m, a) => `<path d="M6 26L21 11" stroke="#8a6a3f" stroke-width="2.4"/><path d="M20 9l6-4-3 7-3 1z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M17 13c-2 0-4 2-3 4 2-1 3-2 3-4z" fill="${a}"/>`],
  [/Phiến$/, (m, a) => `<path d="M16 25L4 12a17 17 0 0124 0z" fill="${m}" stroke="${shade(m, 0.5)}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M16 25L${5 + i * 4.4} ${12 - Math.sin((i / 5) * Math.PI) * 4}" stroke="${shade(m, 0.55)}" stroke-width=".7"/>`).join('')}<circle cx="16" cy="25" r="1.6" fill="${a}"/>`],
  [/Tiêu$/, (m) => `${[0, 1, 2].map((i) => `<path d="M${8 + i * 6} 25l3-14 3 14-3-3z" fill="${m}" stroke="${shade(m, 0.5)}" stroke-width=".7"/>`).join('')}`],
  [/Châm$/, (m) => `${[0, 1, 2, 3].map((i) => `<path d="M${9 + i * 4.5} 26l2-20" stroke="${m}" stroke-width="1.4"/><circle cx="${11 + i * 4.5}" cy="6" r=".9" fill="${shade(m, 0.6)}"/>`).join('')}`],
  [/Câu$/, (m, a) => `<path d="M10 27V12a6 6 0 0112 0v2" stroke="${m}" stroke-width="2.6" fill="none"/><path d="M22 14l-3-1" stroke="${m}" stroke-width="2.6"/><path d="M8 27h4" stroke="${a}" stroke-width="3"/>`],
  [/Phất trần$/, (m, a) => `<path d="M8 26L18 12" stroke="#8a6a3f" stroke-width="2.2"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M18 12c3-2 ${4 + i} -5 ${6 + i} -8" stroke="#b8ad98" stroke-width="1.8" fill="none"/>`).join('')}<circle cx="18" cy="12" r="1.8" fill="${a}"/>`],
  [/Giáp$|Lân giáp$/, (m, a) => `<path d="M9 7l4-2h6l4 2 2 6-2 2v10H9V15l-2-2z" fill="${m}" stroke="${shade(m, 0.5)}"/>${[12, 16, 20].map((y) => `<path d="M10 ${y}c2 2 4 2 6 0 2 2 4 2 6 0" stroke="${shade(m, 0.5)}" stroke-width=".8" fill="none"/>`).join('')}<path d="M13 5c0 3 6 3 6 0" fill="none" stroke="${a}" stroke-width="1.2"/>`],
  [/Bào$|^.* Y$/, (m, a) => `<path d="M11 5l5 4 5-4 6 5-3 4-2-1v14H10V13l-2 1-3-4z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M16 9v18" stroke="${a}" stroke-width="1.4"/><path d="M10 18h12" stroke="${a}" stroke-width="2"/>`],
  [/Hộ tâm kính$|Kính$/, (m, a) => `<circle cx="16" cy="15" r="9" fill="${m}" stroke="${shade(m, 0.5)}" stroke-width="1.2"/><circle cx="16" cy="15" r="6" fill="${shade(m, 1.35)}" stroke="${shade(m, 0.6)}" stroke-width=".7"/><path d="M12 12a5 5 0 014-2" stroke="#fff" stroke-width="1.2" fill="none"/><path d="M14 24l2 4 2-4" fill="${a}"/>`],
  [/Ấn$/, (m, a) => `<rect x="8" y="14" width="16" height="11" rx="1" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M12 14c0-6 8-6 8 0" fill="${shade(m, 0.85)}" stroke="${shade(m, 0.5)}"/><circle cx="16" cy="8" r="2.2" fill="${a}"/><path d="M11 19h10M13 22h6" stroke="${shade(m, 0.5)}" stroke-width=".9"/>`],
  [/Chung$/, (m, a) => `<path d="M16 4v3" stroke="${m}" stroke-width="2.4"/><path d="M8 24c0-10 3-17 8-17s8 7 8 17z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M6 24h20" stroke="${shade(m, 0.5)}" stroke-width="2"/><path d="M11 13h10M10 18h12" stroke="${shade(m, 0.55)}" stroke-width=".8"/><circle cx="16" cy="27" r="1.6" fill="${a}"/>`],
  [/Bình$/, (m, a) => `<path d="M13 5h6v4c5 2 7 6 7 10a10 10 0 01-20 0c0-4 2-8 7-10z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M12 5h8" stroke="${a}" stroke-width="2"/><path d="M9 18c4 2 10 2 14 0" stroke="${a}" stroke-width="1.4" fill="none"/>`],
  [/Đỉnh$/, (m, a) => `<path d="M7 11h18l-2 10H9z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M9 11V7M23 11V7M7 7h4M21 7h4" stroke="${shade(m, 0.5)}" stroke-width="1.6"/><path d="M10 21l-1 5M22 21l1 5M16 21v5" stroke="${shade(m, 0.5)}" stroke-width="1.8"/><path d="M11 15h10" stroke="${a}" stroke-width="1.4"/><path d="M14 9c0-3 4-3 4-6" stroke="#bbb" stroke-width=".9" fill="none" opacity=".7"/>`],
  [/Tháp$/, (m, a) => `${[0, 1, 2, 3].map((i) => `<path d="M${8 + i * 2} ${26 - i * 5}h${16 - i * 4}l-2 -4h${-(12 - i * 4)}z" fill="${m}" stroke="${shade(m, 0.5)}" stroke-width=".8"/>`).join('')}<path d="M16 5V2" stroke="${a}" stroke-width="1.6"/><circle cx="16" cy="5" r="1.4" fill="${a}"/>`],
  [/Châu$/, (m, a) => `<circle cx="16" cy="16" r="9" fill="${m}" stroke="${shade(m, 0.5)}"/><circle cx="16" cy="16" r="12" fill="none" stroke="${a}" stroke-width=".7" opacity=".6"/><ellipse cx="12.5" cy="12.5" rx="3" ry="2" fill="#fff" opacity=".55"/>`],
  [/Linh$/, (m, a) => `<path d="M16 5v4" stroke="${a}" stroke-width="1.6"/><path d="M10 22c0-8 2-13 6-13s6 5 6 13z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M8 22h16" stroke="${shade(m, 0.5)}" stroke-width="1.6"/><circle cx="16" cy="25" r="2" fill="${a}"/><path d="M16 27c0 2-2 3-2 3M16 27c0 2 2 3 2 3" stroke="${a}" stroke-width="1"/>`],
  [/Đan lô$/, (m, a) => `<path d="M11 5h10v4c4 2 6 6 6 10a8 8 0 01-16 0c0-4 2-7 6-10V5z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M10 5h12M13 18c3 1 6 1 9 0" stroke="${a}" stroke-width="1.4"/><path d="M15 10c-1 2-1 3 0 4M19 9c-1 2-1 3 0 4" stroke="#fff" stroke-width="1" opacity=".7"/>`],
  [/Phù bút$/, (m, a) => `<path d="M7 23L21 5l4 3L11 26z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M21 5l2-2 4 3-2 2M8 22l3 2" stroke="${a}" stroke-width="1.4"/><path d="M6 27l2-5 3 2z" fill="${a}"/>`],
  [/Luyện khí đỉnh$/, (m, a) => `<path d="M8 11h18l-2 10H10z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M10 11V7M24 11V7M8 7h4M22 7h4M11 21l-1 5M23 21l1 5M17 21v5" stroke="${shade(m, 0.5)}" stroke-width="1.8"/><path d="M11 15h12" stroke="${a}" stroke-width="1.4"/><path d="M17 9c0-3 4-3 4-6" stroke="#bbb" stroke-width=".9" fill="none"/>`],
  [/Giới$/, (m, a) => `<ellipse cx="16" cy="19" rx="8" ry="7" fill="none" stroke="${m}" stroke-width="3"/><path d="M12 11l4-5 4 5-4 3z" fill="${a}" stroke="${shade(a, 0.5)}" stroke-width=".8"/><path d="M15 8l1-1" stroke="#fff" stroke-width=".8"/>`],
  [/Hoàn$|Trạc$/, (m, a) => `<ellipse cx="16" cy="16" rx="10" ry="8" fill="none" stroke="${m}" stroke-width="3.4"/><ellipse cx="16" cy="16" rx="10" ry="8" fill="none" stroke="${shade(m, 1.4)}" stroke-width="1" stroke-dasharray="3 3"/><circle cx="16" cy="8" r="2" fill="${a}"/>`],
  [/Ngọc bội/i, (m, a) => `<path d="M16 3v5" stroke="${a}" stroke-width="1.4"/><circle cx="16" cy="17" r="8" fill="${m}" stroke="${shade(m, 0.5)}"/><circle cx="16" cy="17" r="3" fill="#e9dcbd" stroke="${shade(m, 0.5)}"/><path d="M14 28l2-3 2 3" stroke="${a}" stroke-width="1.6" fill="none"/>`],
  [/Ngoa$|Hài$|Lý$/, (m, a) => `<path d="M10 4h6v12l7 4c2 1 3 2 3 4v2H8V4z" fill="${m}" stroke="${shade(m, 0.5)}"/><path d="M8 22h18" stroke="${a}" stroke-width="2"/><path d="M10 9h6" stroke="${a}" stroke-width="1.3"/><path d="M3 12h4M2 16h4" stroke="${m}" stroke-width="1.2"/>`],
];
/** Khoá ảnh riêng cho pháp bảo có tên (vd. 'Hỗn Độn Tàn Kiếm' → hondontankiem). */
export const uniqKey = (n: string) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
const SLOT_FALLBACK = ['Kiếm', 'Giáp', 'Châu', 'Giới', 'Ngoa', 'Đan lô', 'Phù bút', 'Luyện khí đỉnh'];
export function gearArtSvg(gr: Gear, size = 32): string {
  // phần trong ngoặc là trạng thái (tàn khuyết, chưa luyện hóa…): tranh vẫn vẽ món đầy đủ
  const base = gr.n.replace(/\s*\(.*\)\s*$/, '');
  const slug = GEAR_SLUG.find(([re]) => re.test(base))?.[1];
  const ph = photo('g_u_' + uniqKey(base).replace('hondontankiem', 'hondonkiem'), TIER_C[gr.g], size) || (slug ? photo('g_' + slug, TIER_C[gr.g], size) : null);
  if (ph) return ph;
  const metal = gr.el ? shade(EL[gr.el].c, 1.1) : gr.slot === 1 ? '#8a7a64' : '#a9b0b6';
  const accent = TIER_C[Math.max(1, gr.g)];
  const f = GEAR_SHAPES.find(([re]) => re.test(base)) || GEAR_SHAPES.find(([re]) => re.test(SLOT_FALLBACK[gr.slot]))!;
  return frame(f[1](metal, accent), TIER_C[gr.g], size);
}

// ================= Bí kíp / tâm kinh / pháp quyết =================
function bookArt(el: El | null, evil: boolean, ic: string) {
  const c = evil ? '#6e1f1a' : el ? EL[el].c : '#7a6a55';
  return `<path d="M7 5h16a2 2 0 012 2v19a2 2 0 01-2 2H7z" fill="${c}" stroke="${shade(c, 0.5)}"/><path d="M7 5v23" stroke="${shade(c, 0.45)}" stroke-width="2"/><path d="M8 9h-2M8 14h-2M8 19h-2M8 24h-2" stroke="#e9dcbd" stroke-width=".9"/><rect x="12" y="8" width="9" height="13" fill="#f2e8cc" stroke="${shade(c, 0.5)}" stroke-width=".7"/>${glyphInner(ic, 12.5, 10.5, 8, c, 2.4)}`;
}
function sutraArt(giai: number) {
  return `<path d="M4 9c4-2 8-2 12 0 4-2 8-2 12 0v16c-4-2-8-2-12 0-4-2-8-2-12 0z" fill="#f2e8cc" stroke="#9a7a2e"/><path d="M16 9v16" stroke="#9a7a2e" stroke-width=".8"/><path d="M7 13h6M7 16h6M19 13h6M19 16h6" stroke="#c9b994" stroke-width=".8"/><path d="M16 22c-3-1-4-4-3-7 2 1 3 4 3 7zM16 22c3-1 4-4 3-7-2 1-3 4-3 7z" fill="${TIER_C[Math.max(1, giai)]}"/><circle cx="16" cy="5" r="1.6" fill="${TIER_C[Math.max(1, giai)]}"/>`;
}
function scrollArt(giai: number) {
  const c = TIER_C[Math.max(1, giai)];
  return `<rect x="9" y="6" width="14" height="20" fill="#f2e8cc" stroke="#9a7a2e"/><rect x="7" y="4" width="18" height="3" rx="1.5" fill="${c}"/><rect x="7" y="25" width="18" height="3" rx="1.5" fill="${c}"/><path d="M12 11h8M12 14h8M12 17h6M12 20h7" stroke="${INK}" stroke-width=".9" opacity=".6"/><path d="M25 5c2 2 2 5 0 7" stroke="#c0392b" stroke-width="1.2" fill="none"/><circle cx="25" cy="13" r="1" fill="#c0392b"/>`;
}

// ================= Vật đặc biệt =================
const SPECIAL_ART: Record<string, string> = {
  tuitruvat: '<path d="M10 11c-3 3-4 8-2 12 2 3 14 3 16 0 2-4 1-9-2-12z" fill="#8a5a8a" stroke="#4a2a4a"/><path d="M10 11c2-2 10-2 12 0M12 8l4 3 4-3" stroke="#d9b44a" stroke-width="1.4" fill="none"/><path d="M12 18c2 1 6 1 8 0" stroke="#d9b44a" stroke-width="1" fill="none"/>',
  banddo: '<path d="M6 8l7-2 6 2 7-2v18l-7 2-6-2-7 2z" fill="#e8d18a" stroke="#8a6a3f"/><path d="M13 6v18M19 8v18" stroke="#8a6a3f" stroke-width=".7"/><path d="M9 18c2-3 6 2 9-2s4-1 5-3" stroke="#c0392b" stroke-width="1" stroke-dasharray="1.5 1.2" fill="none"/><path d="M21 12l2 2M23 12l-2 2" stroke="#c0392b" stroke-width="1.2"/><path d="M26 6l-3 4 3 2" fill="#e9dcbd" stroke="none"/>',
  ngocgian: '<rect x="8" y="5" width="16" height="22" rx="2" fill="#7fbf9a" stroke="#3f7a5a"/><path d="M12 9v14M16 9v14M20 9v14" stroke="#3f7a5a" stroke-width=".9"/><ellipse cx="13" cy="8" rx="3" ry="1.3" fill="#fff" opacity=".45"/>',
  linhthach_trung: '<path d="M10 25l-3-9 5-9 6 3 2 10-4 5z" fill="#7fd0e0" stroke="#3f8a9c"/><path d="M12 7l1 9-6 0M13 16l3 9" stroke="#e8fbff" stroke-width=".8" fill="none"/><path d="M19 26l2-8 5-3 1 8-3 4z" fill="#9fe0f0" stroke="#3f8a9c"/>',
  linhthach_thuong: '<path d="M16 3l7 7-2 15h-10L9 10z" fill="#b48cff" stroke="#5e3fa0"/><path d="M16 3l-3 7 3 15M16 3l3 7-3 15M9 10h14" stroke="#f0e6ff" stroke-width=".8" fill="none"/><circle cx="24" cy="6" r="1" fill="#fff"/>',
  kiemlenh: '<path d="M9 5h14v18l-7 5-7-5z" fill="#b48a3a" stroke="#6a4a1a"/><path d="M12 9h8v9l-4 3-4-3z" fill="#e8c24a" stroke="#6a4a1a" stroke-width=".7"/><path d="M16 11v7M13.5 14h5" stroke="#6a4a1a" stroke-width="1.2"/><path d="M16 1v4" stroke="#c0392b" stroke-width="1.6"/>',
  linhtuyen: '<path d="M13 4h6v4c4 2 6 5 6 9a9 9 0 01-18 0c0-4 2-7 6-9z" fill="#e8f6fb" stroke="#3f8a9c"/><path d="M8 18a8 8 0 0016 0c-3 1.5-13 1.5-16 0z" fill="#7fd0e0"/><path d="M12 4h8" stroke="#4f7a45" stroke-width="2"/><circle cx="13" cy="21" r="1" fill="#fff"/>',
  thanhoa: '<ellipse cx="16" cy="25" rx="8" ry="2.5" fill="#6e6253"/><path d="M16 23c-5 0-7-3-7-6 0-4 4-6 4-11 3 2 5 5 5 8 1-1 2-3 2-4 2 2 3 5 3 7 0 3-3 6-7 6z" fill="#e07a2c"/><path d="M16 23c-2 0-3-1-3-3 0-2 2-3 2-6 2 2 4 4 4 6s-1 3-3 3z" fill="#ffd27a"/>',
  phatnganh: `${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${16 + Math.cos((i / 8) * 6.28) * 8}" cy="${16 + Math.sin((i / 8) * 6.28) * 8}" r="2.6" fill="#8a5a2a" stroke="#4a2a10" stroke-width=".6"/>`).join('')}<circle cx="16" cy="16" r="3.4" fill="#d9b44a" stroke="#6a4a1a"/>`,
};

// ================= Điểm vào chung =================
/** Tranh cho vật phẩm theo id có tiền tố ('h:', 'm:', 'p:', 't:', 'cp:', 'tp:', 'fq:', 'x:', 'recipe:', 'craft:'). */
export function itemArtSvg(id: string, size = 32, g = 1, dim = false): string | null {
  const [k, key] = id.split(':');
  let inner = '';
  let border = '#c9b994';
  if (k === 'h' && HERBS[key]) { inner = (HERB_ART[key] || (() => grass('#5a8a50', '#e8ffd8')))(); border = TIER_C[Math.min(6, HERBS[key].tier)]; }
  else if (k === 'm' && MATS[key]) { inner = (MAT_ART[key] || MAT_ART.huyenthiet)(); border = TIER_C[Math.min(TIER_C.length - 1, MATS[key].tier)]; }
  else if (k === 'p' && PILLS[key]) { inner = pillArt(key); border = TIER_C[pillGiai(PILLS[key])]; if (g >= 3) inner += '<circle cx="26" cy="6" r="2.2" fill="#f2d06b" stroke="#9a7a2e" stroke-width=".6"/>'; }
  else if (k === 't' && TALIS[key]) { inner = talisArt(key); border = TIER_C[TALIS[key].tier]; }
  else if (k === 'cp' && TECHS[key]) { const t = TECHS[key]; inner = bookArt(t.el[0] || null, !!t.evil, t.el[0] || 'book'); border = TIER_C[t.tier]; }
  else if (k === 'tp' && TAMPHAP[key]) { inner = sutraArt(TAMPHAP[key].tier); border = TIER_C[TAMPHAP[key].tier]; }
  else if (k === 'fq' && PHAPQUYET[key]) { inner = scrollArt(PHAPQUYET[key].tier); border = TIER_C[PHAPQUYET[key].tier]; }
  else if (k === 'x' && SPECIAL_ART[key]) inner = SPECIAL_ART[key];
  else if (k === 'recipe') inner = PILLS[key] ? `${scrollArt(Math.min(6, PILLS[key].tier))}<g transform="translate(14 14) scale(.45)">${pillArt(key)}</g>` : `${scrollArt(TALIS[key]?.tier || 1)}<g transform="translate(15 13) scale(.45)">${talisArt(key)}</g>`;
  else if (k === 'craft') inner = key === 'alch' ? MAT_ART.chusa().replace('#c0392b', '#e07a2c') + '<path d="M8 10h10l-1 6H9z" fill="#8a6a3f"/>' : key === 'forge' ? '<path d="M5 22h16l2-3H8z" fill="#4a4550"/><path d="M14 19V11M10 11h12l-2 3h-8z" fill="#6e6253" stroke="#2a241f"/><path d="M24 8l-6 6" stroke="#8a6a3f" stroke-width="2.4"/>' : talisArt('kimcangphu');
  else return null;
  return photo(photoKey(id), border, size, dim) || frame(inner, border, size, dim);
}
