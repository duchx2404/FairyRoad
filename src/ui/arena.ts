// Màn giao chiến bán thực: chọn nền theo nơi đứng, sprite nhân vật / địch, hư ảnh cự nhân Pháp Thiên Tượng Địa.
// Ảnh do tools/gen_battle.py vẽ vào public/items; thiếu ảnh nào thì bỏ qua phần đó (giao diện vẫn chạy).
import { s } from '../engine/state';
import { LOCS, REGIONS } from '../data/world';
import { TECHS } from '../data/items';
import { CHANLINH } from '../data/spirit';
import { myLinh } from '../engine/char';
import { hasPhoto } from './art';
import type { Battle, Fighter } from '../engine/combat';

export type WeaponKind = 'kiem' | 'dao' | 'thuong' | 'cung' | 'phien' | 'cau' | 'phattran' | 'quyen';
/** Loại vũ khí đang cầm (ô Vũ khí), quyết định dáng sprite và vũ khí của cự nhân. */
export function weaponKind(): WeaponKind {
  const n = s.gear[0]?.n || '';
  if (/Kiếm/.test(n)) return 'kiem';
  if (/Đao/.test(n)) return 'dao';
  if (/Thương|Kích/.test(n)) return 'thuong';
  if (/Cung/.test(n)) return 'cung';
  if (/Phiến/.test(n)) return 'phien';
  if (/Câu/.test(n)) return 'cau';
  if (/Phất trần/.test(n)) return 'phattran';
  return 'quyen';
}

/** Màu cự nhân theo hệ chủ đạo của công pháp: Lôi tím, Ám đen (viền tím sẫm), vô hệ trắng bạc. */
export const PTTD_COL: Record<string, [string, string]> = {
  kim: ['#f5c842', '#f5c842'], moc: ['#4fd27a', '#4fd27a'], thuy: ['#3a8cff', '#3a8cff'], hoa: ['#ff6a2a', '#ff6a2a'], tho: ['#d9964a', '#d9964a'],
  bang: ['#9ad8ff', '#9ad8ff'], loi: ['#8a2be2', '#b56cff'], phong: ['#5fe0b8', '#5fe0b8'], am: ['#120a1c', '#4a1a6e'], quang: ['#fff3b0', '#fff3b0'],
  none: ['#e8ecff', '#e8ecff'],
};
export function pttdColor(): [string, string] {
  const main = (s.tech && TECHS[s.tech]?.el[0]) || 'none';
  return PTTD_COL[main] ?? PTTD_COL.none;
}

/** Địa hình nền theo vùng đang đứng: biển đảo, băng tuyết (Bắc), sa mạc (Tây), rừng núi (Nam), đầm sông (Đông), đồng bằng (Trung). */
function terrain(): string {
  const reg = REGIONS[LOCS[s.loc]?.reg ?? ''];
  if (!reg) return 'plain';
  if (/hai$/.test(reg.id)) return 'sea';
  return ({ bac: 'snow', tay: 'desert', nam: 'jungle', dong: 'marsh', trung: 'plain' } as Record<string, string>)[reg.vuc] ?? 'plain';
}
/** Nền trận đánh: địa hình × cảnh dưới đất (hoang dã / thành trì / tông môn) × ngày đêm (theo hạt giống trận). */
export function battleBg(seed: number): string | null {
  const t = terrain();
  const ty = LOCS[s.loc]?.type;
  const l = ty === 'sect' ? 'sect' : ty === 'town' || ty === 'market' || ty === 'village' ? 'town' : 'wild';
  const tm = seed % 2 ? 'night' : 'day';
  const other = tm === 'day' ? 'night' : 'day';
  const tries = [`bg_${t}_${l}_${tm}`, `bg_${t}_wild_${tm}`, `bg_${t}_${l}_${other}`, `bg_${t}_wild_${other}`, `bg_plain_wild_${tm}`, `bg_plain_town_${tm}`, 'bg_plain_wild_day', 'bg_plain_town_day'];
  for (const k of tries) if (hasPhoto(k)) return `items/${k}.webp`;
  return null;
}

const BEAST_RE = /Thú|Yêu|Lang|Hổ|Giao|Long|Xà|Ưng|Hồ|Điêu|Quy|Lân|Tước|Trùng|Viên|Quỷ|Kình|Lộc|Tằm|Loan|Bằng|Mãng|Báo|Hùng|Sư/;
/** Địch là thú (yêu thú, thú vương…) hay người. */
export const isBeast = (kind: string | undefined, name: string) => kind === 'beast' || (kind === 'boss' && BEAST_RE.test(name));
/** Khoá sprite địch theo loại. */
export function foeSpriteKey(kind: string | undefined, el: string | null | undefined, name: string, g?: 'm' | 'f'): string {
  if (isBeast(kind, name)) return `sp_foe_beast_${el || 'tho'}`;
  if (kind === 'demon') return 'sp_foe_demon';
  if (kind === 'mortal') return 'sp_foe_mortal';
  return g === 'f' || /nữ|cô|nàng|Thánh nữ|muội|tỷ/i.test(name) ? 'sp_foe_cultivator_f' : 'sp_foe_cultivator';
}

/** Một ô trong đội hình: ảnh sprite, có phải thú, có cần lật ngang (thú đồng hành dùng ảnh địch nên phải lật). */
export interface Slot { src: string; beast: boolean; mirror?: boolean; name: string }
export interface ArenaScene { bg: string | null; me: string | null; giant: string | null; foe: string | null; beast: boolean; col: string; glow: string; allies: Slot[]; foes: Slot[] }
/** Vị trí ô đội hình i (0..9), tính từ mép trong của mỗi bên: hàng 1 là thủ lĩnh đứng một mình,
    ba hàng sau mỗi hàng 3 người (trận hình 3×3); trong một hàng, người đứng cao hơn là ở xa hơn (chiều sâu). */
export function slotPos(i: number): { x: number; bottom: number; depth: number } {
  if (i === 0) return { x: 70, bottom: 3, depth: 0 };
  const line = Math.floor((i - 1) / 3) + 1; // 1..3: hàng 2,3,4
  const k = (i - 1) % 3;                    // 0 giữa, 1 trước-thấp, 2 sau-cao
  const bottom = [12, 1, 24][k];
  const x = 70 - line * 19 - [0, 3, -3][k];
  return { x, bottom, depth: line + (k === 2 ? 0.5 : k === 1 ? -0.3 : 0) };
}
/** Hệ dùng để chọn tạo hình đồng hành (âm/dương quy về ám/quang). */
const allyEl = (el: string | null | undefined) => (el === 'yin' ? 'am' : el === 'yang' ? 'quang' : el || 'none');
const ALLY_SPRITES_FACING_LEFT = new Set(['sp_ally_f_moc', 'sp_ally_f_thuy', 'sp_ally_f_kim', 'sp_ally_f_loi', 'sp_ally_m_tho']);
const FOE_SPRITES_FACING_RIGHT = new Set(['sp_foe_cultivator_f']);
/** Sprite đồng hành (người): chuẩn hóa hướng nhìn về phía đối thủ ở bên phải.
    Không bao giờ mượn tạo hình khác giới: thiếu ảnh thì trả null để vẽ ô ghost. */
export function allySprite(f: Fighter): { k: string; mirror: boolean } | null {
  const g = f.g === 'f' ? 'f' : 'm';
  // thánh nữ: chỉ dùng sprite trận sp_sn_* (quay 3/4); KHÔNG mượn tranh full_sn_* trực diện (user chốt 2026-10-31) — thiếu thì dùng sprite đồng hành nữ theo hệ
  if (f.pic?.startsWith('sn_') && hasPhoto(`sp_${f.pic}`)) return { k: `sp_${f.pic}`, mirror: false };
  for (const k of [`sp_ally_${g}_${allyEl(f.el)}`, `sp_ally_${g}_none`]) {
    if (hasPhoto(k)) return { k, mirror: ALLY_SPRITES_FACING_LEFT.has(k) };
  }
  const k = g === 'f' ? 'sp_foe_cultivator_f' : 'sp_foe_cultivator';
  return hasPhoto(k) ? { k, mirror: !FOE_SPRITES_FACING_RIGHT.has(k) } : null;
}
/** Sprite cho một chiến binh trong trận. */
export function fighterSlot(f: Fighter, side: 'me' | 'foe'): Slot | null {
  const beast = f.kind === 'beast' || f.id === 'cl';
  let k: string, mirror = false;
  if (f.player) k = `sp_pc_${s.g}_${weaponKind()}`;
  else if (side === 'me' && !beast) { const a = allySprite(f); if (!a) return null; k = a.k; mirror = a.mirror; }
  else if (side === 'me') { k = `sp_foe_beast_${f.el || 'tho'}`; mirror = true; }
  else { k = foeSpriteKey(f.kind, f.el, f.name, f.g); mirror = FOE_SPRITES_FACING_RIGHT.has(k); }
  if (!hasPhoto(k)) { if (f.player && hasPhoto(`sp_pc_${s.g}_quyen`)) k = `sp_pc_${s.g}_quyen`; else return null; }
  return { src: `items/${k}.webp`, beast, mirror, name: f.name };
}
/** Gom mọi thứ cần vẽ cho một trận. */
export function arenaScene(b: Battle, seed: number): ArenaScene {
  const w = weaponKind();
  const pc = `sp_pc_${s.g}_${w}`, gi = `gi_${s.g}_${w}`;
  const fk = foeSpriteKey(b.spec?.kind, b.foe.el, b.foe.name);
  const [col, glow] = pttdColor();
  const allies: Slot[] = [], foes: Slot[] = [];
  return {
    allies, foes,
    bg: battleBg(seed),
    me: hasPhoto(pc) ? `items/${pc}.webp` : hasPhoto(`sp_pc_${s.g}_quyen`) ? `items/sp_pc_${s.g}_quyen.webp` : null,
    giant: hasPhoto(gi) ? `items/${gi}.webp` : hasPhoto(`gi_${s.g}_quyen`) ? `items/gi_${s.g}_quyen.webp` : null,
    foe: hasPhoto(fk) ? `items/${fk}.webp` : null,
    beast: isBeast(b.spec?.kind, b.foe.name),
    col, glow,
  };
}
