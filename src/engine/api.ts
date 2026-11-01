// API gọn cho người viết sự kiện. Gói sự kiện chỉ nên import từ đây.
//
//   import { register, s, M, gain, ... } from '../engine/api';
//
// Quy ước lời văn: gọi người chơi là "ngươi", tiếng Việt văn phong tiên hiệp, câu ngắn, có hình ảnh.

import { kmPlaceOne, kmRemove } from './kinhmach';
import { kmFillNew } from './kinhmach';
import { s, type NPC } from './state';
import { RMAX, REALMS, STAGES, type El, type StatKey, STATS } from '../data/core';
import { LOCS, SECTS } from '../data/world';
import { TECHS, SKILLS, mkGear, type Gear, MAX_SKILLS } from '../data/items';
import { addItem, removeItem, count, itemName, M, has, stat, seenRoot as root, root as trueRoot, thapHidden, age, maxLife, addGear, bagFree, lifeLeft, effRi } from './char';
import { addLog, mark, passTime, addProg, mkNpc, addNpc, relChange, findNpc, friends, enemies, daolu, master, killPlayer, setLoc, npcRealm } from './core';
import { fight, fightSummary, mkFoe, beastFoe, dangerLabel, compare, type FoeSpec, type FightOpts, type FightResult } from './combat';
import { register, type GameEvent, type Choice, type Outcome } from './events';
import { ch, ri, rf, pick, clamp, fmt } from '../core/util';
import { codexAdd } from './state';

export { s, register, M, has, stat, root, trueRoot, thapHidden, age, maxLife, lifeLeft, count, itemName, addLog, mark, passTime, addProg, mkNpc, addNpc, relChange, findNpc, friends, enemies, daolu, master, killPlayer, setLoc, npcRealm, effRi, RMAX };
export { fight, fightSummary, mkFoe, beastFoe, dangerLabel, compare, ch, ri, rf, pick, clamp, fmt, REALMS, STAGES, LOCS, SECTS, TECHS, SKILLS, STATS };
export type { GameEvent, Choice, Outcome, FoeSpec, FightOpts, FightResult, NPC, El, StatKey, Gear };

/** Chỗ đang đứng. */
export const here = () => LOCS[s.loc];
export const realmN = (r = effRi()) => REALMS[r].n;
/** Cảnh giới người khác nhìn thấy (Thiên Đố Chi Thể chỉ lộ ra "Luyện Khí", không rõ tầng). */
export const seenRealm = () => REALMS[s.r].n;

/** Cho vật phẩm; trả về câu mô tả ngắn để nối vào văn bản. id có tiền tố: 'h:', 'p:', 'm:', 't:', 'cp:', 'sk:', 'x:'. */
export function gain(id: string, n = 1, g?: number): string {
  const got = addItem(id, n, g);
  if (!got) return ` (Túi đồ đã đầy, đành bỏ lại ${itemName(id, g)}.)`;
  addLog(`Nhận ${itemName(id, g)}${n > 1 ? ' ×' + n : ''}.`);
  return ` Nhận được ${itemName(id, g)}${n > 1 ? ' ×' + n : ''}.`;
}
export const lose = (id: string, n = 1, g?: number) => removeItem(id, n, g);
export const hasItem = (id: string, n = 1) => count(id) >= n;

/** Cộng/trừ linh thạch (đã nhân theo cảnh giới nếu dùng M()). Trả về câu mô tả. */
export function money(n: number): string {
  s.money = Math.max(0, s.money + n);
  return n >= 0 ? ` (+${fmt(n)} linh thạch)` : ` (−${fmt(-n)} linh thạch)`;
}
export const canPay = (n: number) => s.money >= n;

/** Cộng tu vi theo % một tiểu cảnh giới. */
export const cult = (pct: number) => ' ' + addProg(pct);

/** Thương thế: hurt(20) tăng 20 điểm thương thế (0..100). Trên 100 không chết, chỉ kẹt ở 100. */
export function hurt(n: number): string {
  s.hurt = clamp(s.hurt + n, 0, 100);
  return n > 0 ? ' (Bị thương)' : ' (Thương thế giảm)';
}
export const heal = (n: number) => hurt(-n);

export function statUp(k: StatKey, n = 1): string {
  s.stats[k] += n;
  return ` (${STATS[k].n} ${n >= 0 ? '+' : ''}${n})`;
}
export function tamma(n: number): string {
  s.tamma = clamp(s.tamma + n, 0, 100);
  return n > 0 ? ' (Tâm ma tăng)' : ' (Tâm cảnh thanh tịnh hơn)';
}
export function fame(n: number) {
  s.fame += n;
}
export function good(n = 1) {
  s.good += n;
}
export function evil(n = 1) {
  s.evil += n;
}
export function lifeAdd(years: number): string {
  s.lifeBonus += years;
  return ` (Thọ nguyên +${years} năm)`;
}

/** Học công pháp chính (đổi nếu tốt hơn hoặc force). */
export function learnTech(id: string, force = false): string {
  const t = TECHS[id];
  if (!t) return '';
  codexAdd('tech', id);
  const cur = s.tech ? TECHS[s.tech] : null;
  if (!cur || force || t.tier > cur.tier) {
    s.tech = id;
    s.techM = 0;
    if (!(s.flags.techSeen ||= []).includes(id)) s.flags.techSeen.push(id);
    for (const k of t.skills) learnSkill(k);
    addLog(`Chuyển tu ${t.n}.`, 'good');
    return ` Ngươi chuyển sang tu luyện ${t.n}.`;
  }
  return gain('cp:' + id);
}
export function learnSkill(id: string): string {
  if (!SKILLS[id] || s.known.includes(id)) return '';
  s.known.push(id);
  s.skills.push(id);
  if (!kmPlaceOne('sk:' + id)) { s.skills.pop(); kmRemove('sk:' + id); } // không đủ chỗ trong kinh mạch: chỉ học, chưa mang
  return ` Lĩnh ngộ ${SKILLS[id].n}.`;
}
/** Cho trang bị ngẫu nhiên (lv = cảnh giới chế tạo, g = phẩm 0..4). */
export function giveGear(lv = effRi(), g = 1, slot?: number, el?: El | null): string {
  const gr = mkGear(clamp(lv, 0, RMAX()), clamp(g, 0, 4), slot, el);
  if (!addGear(gr)) return ` (Túi đầy, đành bỏ lại ${gr.n}.)`;
  addLog(`Nhận ${gr.n}.`);
  return ` Nhận được ${gr.n}.`;
}
export const bagRoom = () => bagFree();

/** Yêu thú ngẫu nhiên hợp vùng, cấp lv (mặc định theo hiểm địa / người chơi). */
export function beast(lv = here().lv ?? effRi(), mult = 1): FoeSpec {
  return beastFoe(lv, here().reg, mult).spec;
}
/** Tu sĩ địch: dr = chênh lệch cảnh giới so với người chơi. */
export function cultivator(name: string, dr = 0, mult = 1, el?: El): FoeSpec {
  const r = clamp(effRi() + dr, 0, RMAX());
  return { name, r, kind: r === 0 ? 'mortal' : 'cultivator', mult: r === 0 ? mult * 1.5 : mult, el: el ?? null };
}
export function mortal(name: string, mult = 1): FoeSpec {
  return { name, r: 0, kind: 'mortal', mult };
}

/** Đánh nhau rồi dựng sẵn câu kết; win/lose là hàm trả về phần văn thêm. */
export function battle(spec: FoeSpec, o: { win?: (r: FightResult) => string; lose?: (r: FightResult) => string; flee?: (r: FightResult) => string } & FightOpts = {}): string {
  const r = fight(spec, o);
  let t = fightSummary(r);
  if (r.win && o.win) t += ' ' + o.win(r);
  else if (r.fled && o.flee) t += ' ' + o.flee(r);
  else if (!r.win && !r.fled && !r.died && o.lose) t += ' ' + o.lose(r);
  return t;
}

/** Tạo NPC và thêm vào nhân mạch. */
export function meet(o: Parameters<typeof mkNpc>[0]): NPC {
  return addNpc(mkNpc(o));
}
export const he = (n: NPC) => (n.g === 'm' ? 'hắn' : 'nàng');
export const npcTitle = (n: NPC) => `${n.name} (${npcRealm(n)})`;

export const inSect = (id?: string) => !!s.sect && (!id || s.sect.id === id);
export const sectName = () => (s.sect ? SECTS[s.sect.id].n : '');
export function contrib(n: number): string {
  if (!s.sect) return '';
  s.sect.contrib += n;
  return ` (Cống hiến +${n})`;
}
export const realmStage = () => (s.r === 0 ? 'Phàm Nhân' : `${REALMS[s.r].n} ${STAGES[s.st]}`);
export const isMortalRoot = () => root().m === 0;
export const flag = (k: string) => s.flags[k];
export const setFlag = (k: string, v: unknown = true) => (s.flags[k] = v);
export const years = (y: number): string => (passTime(y), '');
/** Một lượt thời gian theo cảnh giới hiện tại. */
export const turnY = () => REALMS[s.r].turn;
export const gearRand = (lv: number, g: number): Gear => mkGear(lv, g);
