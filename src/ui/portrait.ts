// Khoá chân dung và avatar SVG dự phòng. Tách khỏi hud.ts để fightui.ts không phải import hud
// (tránh vòng fightui → hud → modal → fightui).
import { EL, CLANS } from '../data/core';
import { SECTS } from '../data/world';
import type { NPC } from '../engine/state';
import { photoCircle, hasPhoto } from './art';
import { isBeast } from './arena';

/** Khoá chân dung nhân vật chính: luôn là ảnh Nam chính / Nữ chính đã huấn luyện theo giới tính, mọi lứa tuổi. */
export const playerPortrait = (g: 'm' | 'f', _age = 0) => `pc_${g}`;
/** Khoá chân dung NPC theo giới và tầng tu vi (phàm / sơ / trung / lão tổ). */
export const npcPortrait = (g: 'm' | 'f', r: number) => `npc_${g}${r <= 0 ? 0 : r <= 2 ? 1 : r <= 5 ? 2 : 3}`;
/** Thế lực của một Thánh nữ / Thánh tử có hôn ước: id tông môn (bậc 4) hoặc id thế gia, dò theo lai lịch "Thánh nữ <tên> —". */
function saintFaction(n: NPC): string | null {
  const m = /^Thánh (?:nữ|tử) (.+?) —/.exec(n.how || '');
  if (!m) return n.pic && n.pic.startsWith('sn_') ? n.pic.slice(3).split('_')[0] : null;
  if (n.sect && SECTS[n.sect]?.n === m[1]) return n.sect;
  const sc = Object.values(SECTS).find((x) => x.n === m[1]);
  if (sc) return sc.id;
  const cl = Object.values(CLANS).find((x) => x.n === m[1]);
  return cl ? cl.id : null;
}
/** Khoá chân dung của một NPC. Thánh nữ / Thánh tử có hôn ước: cùng gương mặt Nữ chính / Nam chính đã huấn luyện, y phục đổi theo
 *  thế lực và linh căn — thử sn_<thế lực>_<hệ> (nữ) / st_<thế lực>_<hệ> (nam), rồi sn_<thế lực>, cuối cùng ảnh Nữ/Nam chính trơn.
 *  NPC khác: ảnh riêng nếu có, không thì theo giới và tầng tu vi. */
export function npcPic(n: NPC): string {
  const fac = saintFaction(n);
  if (fac) {
    const pre = n.g === 'f' ? 'sn' : 'st';
    for (const k of [`${pre}_${fac}_${n.el}`, n.g === 'f' ? `sn_${fac}` : '', `pc_${n.g}`]) if (k && hasPhoto(k)) return k;
    return `pc_${n.g}`;
  }
  if (n.pic) return n.pic;
  return npcPortrait(n.g, n.r);
}
/** Các khoá chân dung MUỐN có cho một NPC, ưu tiên trước (để nút "Vẽ chân dung" vẽ đúng người kể cả khi chưa có ảnh):
 *  Thánh nữ / Thánh tử → biến thể thế lực × hệ, rồi bản gốc thế lực (nữ), rồi ảnh Nữ/Nam chính; NPC khác → ảnh riêng hoặc theo giới & tầng. */
export function npcPicWanted(n: NPC): string[] {
  const fac = saintFaction(n);
  if (fac) { const pre = n.g === 'f' ? 'sn' : 'st'; return [`${pre}_${fac}_${n.el}`, ...(n.g === 'f' ? [`sn_${fac}`] : []), `pc_${n.g}`]; }
  return [n.pic || npcPortrait(n.g, n.r)];
}
/** Khoá chân dung đối thủ: yêu thú theo hệ, còn lại theo loại (phàm nhân / tu sĩ / ma tu). */
export const foePortrait = (kind: string | undefined, el: string | null | undefined, name = '') =>
  isBeast(kind, name) ? `foe_beast_${el || 'tho'}` : kind === 'demon' ? 'foe_demon' : kind === 'mortal' ? 'foe_mortal' : 'foe_cultivator';
export function avatarSvg(g: 'm' | 'f', r: number, el: string | null, size = 54, key?: string) {
  const ph = key ? photoCircle(key, '#9b2a1f', size, false) : null; // khung chứa đã có viền tròn
  if (ph) return ph;
  const robe = el ? EL[el as keyof typeof EL]?.c || '#6e6253' : '#6e6253';
  const halo = r >= 4 ? `<circle cx="27" cy="20" r="17" fill="none" stroke="#9a7a2e" stroke-width="1.5" opacity=".6"/>` : '';
  const back = g === 'f' ? `<path d="M15 21 Q15 8 27 8 Q39 8 39 21 L41 40 Q34 34 33 26 L21 26 Q20 34 13 40Z" fill="#2a241f"/>` : '';
  const front = g === 'm'
    ? `<path d="M18 19 Q19 9 27 9 Q35 9 36 19 Q31 14 27 14 Q22 14 18 19Z" fill="#2a241f"/><rect x="24" y="3" width="6" height="7" rx="2" fill="#2a241f"/><rect x="21" y="8" width="12" height="2" fill="#9b2a1f"/>`
    : `<path d="M18 20 Q19 9 27 9 Q35 9 36 20 Q30 13 24 16 Q21 17 18 20Z" fill="#2a241f"/><circle cx="27" cy="6" r="4.5" fill="#2a241f"/><path d="M31 5 L38 2" stroke="#9a7a2e" stroke-width="1.5"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 54 54">${halo}${back}<path d="M10 54 Q12 34 27 32 Q42 34 44 54Z" fill="${robe}"/><path d="M27 32 L22 54 M27 32 L32 54" stroke="#f8f2e3" stroke-width="1.2" opacity=".6"/><circle cx="27" cy="20" r="9" fill="#ead9bd"/>${front}</svg>`;
}

