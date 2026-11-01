// Luyện đan, chế phù, luyện khí.
import { RMAX, REALMS } from '../data/core';
import { coPaper, PHU_PHAM, PILLS, TALIS, TALIS_REC, HERBS, MATS, mkGear, SLOTS, pillGrade, talisGrade, gearLabel } from '../data/items';
import { LOCS } from '../data/world';
import { s } from './state';
import { effRi, count, removeItem, addItem, has, stat, body, addGear, itemName } from './char';
import { passTime, addLog } from './core';
import { ch, clamp, ri, rf } from '../core/util';

export const CRAFT_N = { alch: 'Luyện đan', talis: 'Chế phù', forge: 'Luyện khí' } as const;
export type CraftK = keyof typeof CRAFT_N;
const XP_K = { alch: 'ax', talis: 'tx', forge: 'fx' } as const;
export const xpNeed = (lv: number) => Math.round(6 * lv * lv + 4);
/** Danh hiệu tay nghề. Bậc 1–6 dùng chung; hai bậc cao nhất riêng từng nghề (đứng đầu: Đan Thánh / Khí Thánh / Phù Thánh). */
const CRAFT_TOP: Record<CraftK, [string, string]> = { alch: ['Đan Vương', 'Đan Thánh'], forge: ['Khí Vương', 'Khí Thánh'], talis: ['Phù Vương', 'Phù Thánh'] };
export const craftTitle = (lv: number, k: CraftK) => {
  const i = clamp(lv, 0, RMAX());
  return i >= 7 ? CRAFT_TOP[k][Math.min(i, 8) - 7] : ['Chưa nhập môn', 'Học đồ', 'Sơ cấp', 'Trung cấp', 'Cao cấp', 'Đại sư', 'Tông sư'][i];
};

function gainXp(k: CraftK, n: number): string {
  const xk = XP_K[k];
  s.craft[xk] += n;
  let up = '';
  while (s.craft[xk] >= xpNeed(s.craft[k]) && s.craft[k] < 8) {
    s.craft[xk] -= xpNeed(s.craft[k]);
    s.craft[k]++;
    up = ` Tay nghề ${CRAFT_N[k].toLowerCase()} lên ${craftTitle(s.craft[k], k)}!`;
    addLog(`${CRAFT_N[k]} đạt ${craftTitle(s.craft[k], k)}.`, 'good');
  }
  return up;
}

// ---------- Luyện đan ----------
export function alchChance(pillId: string): number {
  const p = PILLS[pillId];
  let c = 0.45 + (s.craft.alch - p.tier) * 0.12 + (stat('ngo') - 5) * 0.025;
  if (has('dangu')) c += 0.1;
  c += body().alch || 0;
  if (s.flags.flame) c += 0.08;
  if (p.k === 'break') c -= 0.08;
  return clamp(c, 0.03, 0.95);
}
/** Công thức đan kèm số lượng: thảo chính (đầu danh sách) cần giai+1, phụ liệu cần giai; đan đột phá thảo chính thêm 1. */
export function pillRec(pillId: string): [string, number][] {
  const p = PILLS[pillId];
  return p.rec.map((h, i) => ['h:' + h, Math.max(1, (i === 0 ? p.tier + 1 : p.tier) + (i === 0 && p.k === 'break' ? 1 : 0))]);
}
/** Công thức phù kèm số lượng: phù chỉ 1 tờ, chu sa theo phẩm (tối đa 5), vật liệu đặc trưng ⌈phẩm/2⌉. */
export function talisRec(id: string): [string, number][] {
  const t = TALIS[id];
  return TALIS_REC[id].map((m) => [m, m === 'phuchi' ? 1 : m === 'chusa' ? Math.min(5, t.p) : Math.max(1, Math.ceil(t.p / 2))]);
}
export function canBrew(pillId: string): string | null {
  const p = PILLS[pillId];
  if (s.craft.alch < 1) return 'Chưa biết luyện đan.';
  if (!s.recipes.includes(pillId)) return 'Chưa có đan phương.';
  if (p.tier > s.craft.alch + 1) return `Cần tay nghề ${craftTitle(p.tier - 1, 'alch')}.`;
  if (effRi() < p.tier - 2) return 'Chân nguyên không đủ để khống hỏa.';
  for (const [id, n] of pillRec(pillId)) if (count(id) < n) return `Thiếu ${itemName(id)} (${count(id)}/${n}).`;
  return null;
}
export function brew(pillId: string): string {
  const err = canBrew(pillId);
  if (err) return err;
  const p = PILLS[pillId];
  for (const [id, n] of pillRec(pillId)) removeItem(id, n);
  passTime(0.15 * p.tier);
  if (!ch(alchChance(pillId))) {
    const xp = gainXp('alch', 1);
    return `Lò đan nổ "bùm" một tiếng, khói đen mù mịt. Mẻ ${p.n} hỏng.${xp}`;
  }
  const q = s.craft.alch - p.tier + (has('dangu') ? 1 : 0) + rf(-1.2, 1.5) + (s.flags.flame ? 0.5 : 0);
  const g = q >= 2.2 ? 3 : q >= 1 ? 2 : q >= -0.3 ? 1 : 0;
  const n = p.k === 'break' || p.k === 'root' ? 1 : ri(1, 2) + (s.craft.alch >= p.tier + 2 ? 1 : 0);
  const got = addItem('p:' + pillId, n, g);
  const xp = gainXp('alch', p.tier * 2 + g);
  if (!got) return `Thành đan, nhưng túi đã đầy, đành bỏ lại.${xp}`;
  return `Mở nắp lò, mùi thơm lan khắp phòng. Được ${n} viên ${p.n} (${pillGrade(p, g)}).${xp}`;
}

// ---------- Chế phù ----------
export function talisChance(id: string): number {
  const t = TALIS[id];
  let c = 0.5 + (s.craft.talis - t.tier) * 0.13 + (stat('tam') - 5) * 0.025;
  if (has('phusu')) c += 0.12;
  return clamp(c, 0.03, 0.95);
}
/** Giấy dùng khi vẽ: phù thường dùng Phù chỉ; cổ phù dùng giấy da yêu thú / linh mộc. */
export function paperFor(id: string, co: boolean): string | null {
  if (!co) return 'phuchi';
  return coPaper(TALIS[id].p).find((k) => count('m:' + k) > 0) || null;
}
export function canDraw(id: string, co = false): string | null {
  const t = TALIS[id];
  if (s.craft.talis < 1) return 'Chưa biết chế phù.';
  if (!s.recipes.includes(id)) return 'Chưa có phù phương.';
  if (effRi() < t.p - 1) return `${PHU_PHAM[t.p]} phẩm phù cần cảnh giới ${REALMS[t.p - 1].n} mới vẽ nổi.`;
  if (t.tier > s.craft.talis + 1) return `Cần tay nghề ${craftTitle(t.tier - 1, 'talis')}.`;
  if (co && !s.flags.coPhu) return 'Chưa có bí tịch chế phù thượng cổ.';
  if (co && !paperFor(id, true)) return t.p <= 4 ? 'Cổ phù phải vẽ trên Yêu bì phù chỉ hoặc Linh mộc phù chỉ.' : 'Cổ phù từ Ngũ phẩm trở lên chỉ Linh mộc phù chỉ mới chứa nổi.';
  for (const [m, n] of talisRec(id)) if (m !== 'phuchi' && count(itemIdOf(m)) < n) return `Thiếu ${itemName(itemIdOf(m))} (${count(itemIdOf(m))}/${n}).`;
  if (!co && count('m:phuchi') < 1) return 'Thiếu Phù chỉ.';
  return null;
}
export const itemIdOf = (key: string) => (HERBS[key] ? 'h:' + key : 'm:' + key);
export function draw(id: string, co = false): string {
  const err = canDraw(id, co);
  if (err) return err;
  const t = TALIS[id];
  const paper = paperFor(id, co)!;
  for (const [m, n] of talisRec(id)) removeItem(itemIdOf(m === 'phuchi' ? paper : m), n);
  passTime(0.08 * t.tier);
  if (!ch(talisChance(id))) return `Nét bút cuối run lên, phù văn tan thành tro.${gainXp('talis', 1)}`;
  const n = ri(2, 3) + Math.max(0, s.craft.talis - t.tier);
  const qv = s.craft.talis - t.tier + (has('phusu') ? 1 : 0) + rf(-1.2, 1.5);
  const tg = qv >= 2.2 ? 3 : qv >= 1 ? 2 : qv >= -0.3 ? 1 : 0;
  const out = co ? TALIS['co_' + id] : t;
  if (!addItem('t:' + out.id, n, tg)) return 'Vẽ xong mà túi đầy, đành bỏ lại.';
  return `${co ? `Ngươi vẽ theo nét bút trong bí tịch thượng cổ lên ${itemName('m:' + paper)} — phù văn không chìm vào giấy mà như muốn bay ra khỏi giấy. ` : 'Phù văn sáng lên rồi chìm vào giấy. '}Được ${n} lá ${out.n} (${talisGrade(out, tg)}).${gainXp('talis', t.tier * 2)}`;
}
/** Chế giấy cổ phù (cần bí tịch): da yêu thú → yêu bì phù chỉ, linh mộc tâm → linh mộc phù chỉ. */
export const PAPER_REC: [string, string, number][] = [['dayeu', 'yeubiphuchi', 2], ['linhmoc', 'linhmocphuchi', 3]];
export function makePaper(i: number): string {
  const [src, out, n] = PAPER_REC[i];
  if (!s.flags.coPhu) return 'Chưa có bí tịch chế phù thượng cổ.';
  if (count('m:' + src) < 1) return `Thiếu ${itemName('m:' + src)}.`;
  removeItem('m:' + src, 1);
  passTime(0.1);
  if (!addItem('m:' + out, n)) return 'Túi đầy.';
  return `Ngươi ngâm, thuộc, bào mỏng theo cách chép trong bí tịch. Được ${n} tờ ${itemName('m:' + out)}.`;
}

// ---------- Luyện khí ----------
/** Vật liệu cần để luyện trang bị cấp lv. */
export function forgeMats(lv: number): [string, number][] {
  if (lv <= 1) return [['m:huyenthiet', 2], ['m:dayeu', 1]];
  if (lv === 2) return [['m:tinhkim', 2], ['m:yeudan', 1]];
  if (lv === 3) return [['m:tinhkim', 2], ['m:hanngoc', 1], ['m:yeudan', 2]];
  if (lv <= 5) return [['m:thienthach', 2], ['m:longlan', 1], ['m:yeudan', 2]];
  return [['m:thienthach', 3], ['m:hukhongthach', 1], ['m:linhmoc', 1]];
}
export function canForge(lv: number): string | null {
  if (s.craft.forge < 1) return 'Chưa biết luyện khí.';
  if (lv > s.craft.forge) return `Tay nghề chưa đủ để luyện đồ cấp ${REALMS[lv].n}.`;
  if (lv > effRi() + 1) return 'Chân nguyên không đủ.';
  for (const [id, n] of forgeMats(lv)) if (count(id) < n) return `Thiếu ${itemName(id)} (${count(id)}/${n}).`;
  return null;
}
export function forge(lv: number, slot: number): string {
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOTS.length) return 'Ô trang bị không hợp lệ.';
  const err = canForge(lv);
  if (err) return err;
  for (const [id, n] of forgeMats(lv)) removeItem(id, n);
  passTime(0.3 + lv * 0.2);
  const atForge = LOCS[s.loc].forge ? 0.1 : 0;
  const c = clamp(0.5 + (s.craft.forge - lv) * 0.12 + (stat('can') - 5) * 0.02 + atForge + (s.flags.flame ? 0.08 : 0), 0.05, 0.95);
  if (!ch(c)) return `Phôi khí nứt toác trong lửa. Uổng công.${gainXp('forge', 1)}`;
  const q = s.craft.forge - lv + rf(-1, 1.6) + (s.flags.flame ? 0.4 : 0);
  const q0 = q;
  const g = clamp(q >= 3 ? 3 : q >= 1.4 ? 2 : q >= 0 ? 1 : 0, 0, 4);
  const pq = clamp(Math.floor(q0 * 1.3 + rf(-0.5, 1.2)), 0, 3);
  const gr = mkGear(lv, g, slot, undefined, pq);
  gr.refined = true; // tự tay luyện, khỏi luyện hóa
  if (!addGear(gr)) return 'Luyện xong mà túi đầy.';
  return `Khí thành! Ngươi có ${gr.n} (${gearLabel(gr)}, ${SLOTS[slot]}), đã nhận chủ sẵn.${gainXp('forge', (lv + 1) * 2 + g)}`;
}

export const allMats = () => Object.keys(MATS);
