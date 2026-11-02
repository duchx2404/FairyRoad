import { worldDefinitions } from '../data/local-items';
import { setGrowStateReader } from '../data/treasure-grades';
import { localItemId, limitGear } from '../data/local-items';
import { PHAM_BONUS } from '../data/core';
import { slots } from './slots';
import { PHAPQUYET, CHANLINH, pqGrade, pqPrice } from '../data/spirit';
import { getLinh } from './beast-companion';
// Chỉ số dẫn xuất của nhân vật và quản lý túi đồ.
import { WORLD, RMAX, worldMult, worldLife, TANG_T, DAO_CO, BODIES, REALMS, ROOTS, HON_DON_ROOT, hiddenRootKind, BATQUAI, EL, SINH, type El, type StatKey, STAGES } from '../data/core';
import { LOCS, SECTS } from '../data/world';
import {
  TAMPHAP, tamGrade, tamEffect, tamPrice, TECHS, techSpeed, techPow, pillGrade, talisGrade, techGrade, skillGrade, HERBS, PILLS, MATS, TALIS, SKILLS, SPECIALS, PILL_GRADE, GRADE_MULT, BAG_CAP,
  herbPrice, pillPrice, matPrice, talisPrice, techPrice, skillPrice, gradeLabel, artGradeLabel, type Gear, type Tech,
} from '../data/items';
import { s, codexAdd, type BagItem } from './state';
import { clamp } from '../core/util';

export const has = (p: string) => s.perks.includes(p);
/** Phẩm đã đột phá của từng cảnh giới (chỉ Kết Đan trở lên; Trúc Cơ xem flags.daoCo). */
export const phams = (): Record<number, number> => (s.flags.phams ||= {});
/** Tổng thưởng từ phẩm các cảnh giới đã đột phá. */
export function phamSum(): { hp: number; atk: number; cult: number; life: number; brk: number } {
  const o = { hp: 0, atk: 0, cult: 0, life: 0, brk: 0 };
  for (const [r, g] of Object.entries(phams())) {
    if (Number(r) > s.r) continue;
    const b = PHAM_BONUS[Math.max(0, Math.min(4, g as number))];
    o.hp += b.hp; o.atk += b.atk; o.cult += b.cult; o.brk += b.brk;
    o.life += Math.round(REALMS[Number(r)].life * b.life);
  }
  return o;
}
/** Hỗn Độn Đạo Thai: đột phá luôn Hoàn mỹ. */
export const perfectBody = () => s.body === 'hondon';
export const body = () => BODIES.find((b) => b.id === s.body) || BODIES[0];
export const root = () => ROOTS[s.root.k];
// ---------- Thiên Đố Chi Thể: luyện khí vô hạn tầng ----------
export const thienDo = () => s.body === 'thiendo' && s.r === 1;
export const tang = (): number => s.flags.tang ?? 1;
/** Cảnh giới tương đương (số thực). Người thường = s.r. */
export function effR(): number {
  if (!thienDo()) return s.r;
  const t = tdLocal();
  const cap = RMAX();
  for (let i = 1; i <= cap; i++) if (t < TANG_T[i + 1]) return i + (t - TANG_T[i]) / (TANG_T[i + 1] - TANG_T[i]);
  return cap + 0.99;
}
/** Tầng tính trong giới hiện tại (tầng tổng trừ phần đã luyện ở các giới dưới). */
export const tdLocal = () => Math.max(1, tang() - (s.flags.tangBase ?? 0));
/** Thiên Đố đủ tầng Độ Kiếp viên mãn của giới này → được độ kiếp phi thăng. */
export const tdCanAscend = () => thienDo() && tdLocal() >= TANG_T[RMAX() + 1];
export const effRi = () => Math.min(RMAX(), Math.floor(effR()));
/** Nội suy theo cấp số nhân giữa hai cảnh giới. */
export function realmAt(k: 'pow' | 'life' | 'speed' | 'turn', x: number): number {
  const i = Math.min(REALMS.length - 2, Math.floor(x));
  const f = x - i;
  return REALMS[i][k] * Math.pow(REALMS[i + 1][k] / REALMS[i][k], f);
}
/** Thời gian một lượt bế quan. */
export const turnLen = () => (thienDo() ? REALMS[effRi()].turn * 4 / (TANG_T[effRi() + 1] - TANG_T[effRi()] || 40) : REALMS[s.r].turn);
/** Thập / Hỗn Độn linh căn mà thiên hạ chưa biết: các hệ cân bằng nên đá trắc linh không phản ứng. */
export const thapHidden = () => hiddenRootKind(s.root.k) && !s.flags.thapKnown;
/** Linh căn trong mắt người đời (tông môn, tiên sư, đá trắc linh). */
export const seenRoot = () => (thapHidden() ? ROOTS[0] : ROOTS[s.root.k]);
/** Tên linh căn ẩn (cho lời thoại khi bí mật bị lộ): Thập linh căn hoặc Hỗn Độn linh căn. */
export const hiddenRootName = () => (s.root.k === HON_DON_ROOT ? 'Hỗn Độn linh căn' : 'Thập linh căn');
/** Số hệ của linh căn ẩn, viết bằng chữ: "mười" hoặc "mười hai". */
export const hiddenFlows = () => (s.root.k === HON_DON_ROOT ? 'mười hai' : 'mười');
export const age = () => s.year - s.born;
/** Tuổi linh hồn: tính từ lần sinh đầu tiên, không bao giờ đặt lại (thân thể thì về một tuổi mỗi lần phi thăng). */
export const soulAge = () => s.year - (s.flags.soulBorn ?? s.born);
/** Tổng số năm đã sống qua các giới (thọ nguyên cộng dồn): các kiếp thân ở hạ giới + tuổi thân thể hiện tại. */
export const lifeLived = () => (s.flags.lifeLived || 0) + age();

export const tamList = (): string[] => (s.flags.tamphap ||= []);
/** Tâm kinh đang vận hành (chỉ những bộ này có hiệu lực). */
export const tamActive = (): string[] => (s.flags.tamActive ||= tamList().slice(0, tamSlots()));
export const tamSlots = () => (s.r <= 9 ? [1, 2, 2, 3, 3, 4, 4, 5, 5, 6][s.r] : 6 + Math.floor((s.r - 9) / 3));
export const tamSum = (k: 'tam' | 'ngo' | 'cult' | 'brk' | 'calm') => tamActive().reduce((a, id) => a + (TAMPHAP[id]?.[k] || 0), 0);
export const pqList = (): string[] => (s.flags.phapquyet ||= []);
export const pqSum = (k: 'cult' | 'herb' | 'speed' | 'flee' | 'hide' | 'atk' | 'def' | 'heal' | 'luck') => pqList().reduce((a, id) => a + (PHAPQUYET[id]?.[k] || 0), 0);
/** Chân linh đang theo: tự động chuẩn hóa trạng thái cảnh giới, tuổi thọ, giai đoạn. */
export const myLinh = () => getLinh();
/** Chân linh đang xuất chiến (mặc định có); chỉ để cưỡi thì không vào trận, không cộng công / thủ / huyết. */
export const linhFights = () => { const c = myLinh(); return !!c && !c.ride; };
export const clSum = (k: 'atk' | 'def' | 'hp' | 'cult' | 'luck' | 'flee') => {
  const c = myLinh();
  if (!c) return 0;
  if (c.ride && (k === 'atk' || k === 'def' || k === 'hp')) return 0;
  const d = CHANLINH[c.id];
  let mult = 0.6 + c.bond / 250;
  if (c.stage === 'aunen') mult *= 0.9;
  else if (c.stage === 'gia') mult *= 0.7;
  else mult *= 1.3;
  return ((d?.[k] || 0) as number) * mult;
};
/** Phẩm đạo cơ hiện tại (chỉ có từ Trúc Cơ). Save cũ mặc định Trung phẩm. */
export const daoCo = (): number => (s.r >= 2 ? (s.flags.daoCo ?? 1) : -1);
export const daoCoInfo = () => (daoCo() >= 0 ? DAO_CO[daoCo()] : null);
/** Đại khí vận: khí vận từ 10 trở lên, hoặc được thiên mệnh. */
export const thienMenh = () => stat('van') >= 10 || !!s.flags.thienMenh;
export function stat(k: StatKey): number {
  let v = s.stats[k];
  if (k === 'tam' || k === 'ngo') v += tamSum(k);
  if (k === 'van') {
    v += body().luck || 0;
    v += pqSum('luck') + Math.floor(clSum('luck'));
    for (const g of s.gear) if (g?.refined) v += g.luck;
  }
  return v;
}

export function maxLife(): number {
  let l = (thienDo() ? realmAt('life', effR()) : REALMS[s.r].life) * (body().life || 1) * worldLife();
  if (has('samhoi')) l *= 1.15;
  return Math.round(l + s.lifeBonus + phamSum().life);
}
export const lifeLeft = () => maxLife() - age();

export function rootLabel(): string {
  const r = root();
  if (s.root.k === 0) return r.n;
  if (hiddenRootKind(s.root.k)) return r.n;
  return `${r.n} (${s.root.els.map((e) => EL[e].n).join(' · ')})`;
}

/** Độ hợp giữa linh căn và công pháp: 0.45 .. 1.3. */
export function techAff(techId = s.tech): number {
  if (!techId) return 0.3;
  const t = TECHS[techId];
  if (t.blood === 'diep_hondon') return s.flags.hondonBlood ? 2 : 0.2; // Cửu Chuyển Huyền Công: chỉ dòng chính Hỗn Độn
  if (t.blood) return t.blood === 'diep' && s.flags.diepBlood ? (s.flags.hondonBlood ? 1.5 : 1.3) : 0.2; // công pháp huyết mạch (dòng chính Hỗn Độn hợp hơn)
  if (s.root.k === HON_DON_ROOT) return 1.5;
  if (hiddenRootKind(s.root.k)) return 1.25; // mười hệ: công pháp nào cũng hợp
  if (s.root.k === BATQUAI) return 1.15; // âm dương sinh vạn vật: hợp khá rộng
  if (!t.el.length) return s.root.k === 1 ? 1 : 0.85;
  const els = s.root.els;
  const hit = els.filter((e) => t.el.includes(e)).length;
  if (s.root.els.length >= 5 && t.el.length >= 5) return 1.3; // ngũ linh căn + công pháp ngũ hành
  if (hit) return Math.min(1.2, 0.9 + (hit / els.length) * 0.3);
  if (els.some((e) => SINH[e] && t.el.includes(SINH[e]!))) return 0.7;
  return 0.45;
}

export function placeQi(): number {
  const l = LOCS[s.loc];
  let q = l.qi;
  if (l.type === 'sect' && (!s.sect || SECTS[s.sect.id].loc !== l.id) && s.flags.holyScion !== l.sect) q = Math.min(q, 1.1); // khách không được vào linh mạch
  if (s.flags.dongphu === s.loc) q *= 1.25;
  return q;
}

/** Tu vi tăng mỗi lượt bế quan (đơn vị: % một tiểu cảnh giới). */
export function cultRate(): number {
  const rm = root().m;
  if (rm <= 0) return 0;
  let g = 9 * rm;
  const t = s.tech ? TECHS[s.tech] : null;
  g *= t ? techSpeed(t) * techAff() : 0.3;
  g *= 1 + (placeQi() - 1) * 0.6; // linh khí dày giúp tu nhanh, nhưng không nhân thẳng
  g *= 1 + (stat('ngo') - 5) * 0.06;
  g *= body().cult || 1;
  if (has('daphu')) g *= 1.1;
  if (has('cotrung')) g *= 1.15;
  let gc = 0;
  for (const it of s.gear) if (it?.refined) gc += it.cult;
  g *= 1 + gc / 100;
  g *= 1 + s.meridians * 0.03;
  g *= 1 + (tamSum('cult') + pqSum('cult') + clSum('cult')) / 100;
  if (t?.evil) g *= 1.2;
  g *= 1 - s.hurt / 200;
  g /= REALMS[effRi()].diff;
  if (s.flags.daolu_bonus) g *= 1.1;
  g *= daoCoInfo()?.cult || 1;
  g *= 1 + phamSum().cult / 100;
  if (s.flags.hondonBlood) g *= 1.15; // huyết mạch Hỗn Độn
  g *= Math.max(0.5, 1 + slots.kmCult()); // kinh mạch
  return Math.max(0.5, g);
}

// ---------- Chiến lực ----------
/** Tiên khí tàn khuyết: chỉ số tính lại theo cảnh giới (tương đương) và giới hiện tại. */
setGrowStateReader(() => ({ r: s ? effRi() : 0, st: s?.st ?? 0, w: s?.world ?? WORLD.lv }));
function growGear(g: Gear) {
  const oldG = g.g, oldQ = g.q; limitGear(g, s.world ?? 0);
  const lv = Math.max(1, effRi());
  const m = g.growMul ?? 1;
  if (g.lv === lv && g.gw === WORLD.lv && (g.gm ?? 1) === m && g.g === oldG && g.q === oldQ && g.atk > 0) return;
  const base = (REALMS[lv].pow * 0.25 * (1 + g.g * 0.45) + 2) * (1 + (g.q ?? 0) * 0.12) * 1.3 * worldMult();
  g.atk = Math.round(base * 1.2 * m);
  g.hp = Math.round(base * 1.5 * m);
  g.def = Math.round(base * 0.5 * (m - 1)); // bản đã sửa mới có thủ
  g.lv = lv;
  g.gw = WORLD.lv;
  g.gm = m;
}
/** Tính lại chỉ số pháp bảo lớn theo tu vi (gọi ngay sau khi đổi tỷ lệ trưởng thành). */
export function regrowGear() {
  for (const g of [...s.gear, ...s.gearBag]) if (g?.grow) growGear(g);
}
function gearSum(k: 'atk' | 'def' | 'hp' | 'cap'): number {
  let v = 0;
  for (const g of s.gear) if (g?.grow) growGear(g);
  for (const g of s.gear) if (g?.refined) v += g[k];
  return v;
}
export function basePow(): number {
  const t = s.tech ? TECHS[s.tech] : null;
  let p = thienDo() ? realmAt('pow', effR()) : REALMS[s.r].pow * (1 + s.st * 0.3);
  p *= t ? techPow(t) * (t.pw || 1) : 0.85;
  p *= 1 + (stat('can') - 5) * 0.04;
  p *= body().pow || 1;
  p *= 1 + s.meridians * 0.04;
  p *= 1 + s.techM / 250;
  p *= daoCoInfo()?.pow || 1;
  p *= 1 + phamSum().atk / 100;
  p *= slots.daoPow();
  p *= worldMult();
  return p;
}
/** Công pháp truyền thụ một võ công (lấy công pháp phẩm cao nhất mà ngươi tiếp cận được). */
export function skSource(id: string): Tech | null {
  const seen: string[] = s.flags.techSeen || [];
  const ok = (t: Tech) => (t.blood === 'diep' ? !!s.flags.diepBlood : t.blood === 'diep_hondon' ? !!s.flags.hondonBlood : t.id === s.tech || seen.includes(t.id));
  const c = worldDefinitions('cp').filter((t) => t.skills.includes(id) && ok(t));
  return c.sort((a, b) => b.tier - a.tier || (b.pq ?? 0) - (a.pq ?? 0))[0] || null;
}
/** Cùng một võ công, học từ công pháp phẩm càng cao càng mạnh (chênh lệch phẩm chất công pháp). */
export function skSrcMul(id: string): number {
  const sk = SKILLS[id], src = skSource(id);
  if (!sk || !src) return 1;
  if (src.grow) { setGrowStateReader(() => ({ r: s ? effRi() : 0, st: s?.st ?? 0, w: s?.world ?? WORLD.lv })); return 1 + (src.tier - 1) * 0.08 + (src.pq ?? 0) * 0.03; }
  return Math.max(0.7, Math.min(1.6, 1 + 0.12 * (src.tier - sk.tier) + 0.04 * (src.pq ?? 0)));
}
/** Giai/phẩm hiển thị của một võ công ngươi đã học: theo công pháp truyền thụ (không thấp hơn bản gốc). */
export function skEff(id: string): { tier: number; pq: number } {
  const sk = SKILLS[id], src = skSource(id);
  if (!sk) return { tier: 1, pq: 0 };
  if (!src || src.tier < sk.tier || (src.tier === sk.tier && (src.pq ?? 0) <= (sk.pq ?? 0))) return { tier: sk.tier, pq: sk.pq ?? 0 };
  return { tier: src.tier, pq: src.pq ?? 0 };
}
export const skGradeOf = (id: string) => { const e = skEff(id); return artGradeLabel(e.tier, e.pq); };
export const atkOf = () => Math.round((basePow() + gearSum('atk')) * (1 + (pqSum('atk') + clSum('atk')) / 100) * (1 + slots.kmAtk()));
export const defOf = () => Math.round((basePow() * 0.35 * ((s.tech && TECHS[s.tech].def) || 1) + gearSum('def')) * (1 + (pqSum('def') + clSum('def')) / 100));
export function maxHp(): number {
  const t = s.tech ? TECHS[s.tech] : null;
  return Math.round((basePow() * 8 * (1 + (stat('can') - 5) * 0.06) * (body().hp || 1) * (t?.hp || 1) + gearSum('hp')) * (1 + clSum('hp') / 100) * (1 + phamSum().hp / 100));
}
/** Chỉ số tổng hợp để so sánh nhanh. */
export const powerScore = () => Math.round(atkOf() + defOf() * 1.2 + maxHp() / 8);

/** Sức mạnh nền của một tu sĩ ở cảnh giới r, tiểu cảnh st (dùng cho NPC / địch). */
export const npcPow = (r: number, st: number) => REALMS[r].pow * (1 + st * 0.3) * (1 + Math.max(0, r - 1) * 0.08) * worldMult();

export const stageName = () => (s.r === 0 ? 'Phàm Nhân' : thienDo() ? `Luyện Khí tầng ${tang()}` : `${REALMS[s.r].n} ${STAGES[s.st]}`);

/** Đủ Viên Mãn, tiến độ đầy → bình cảnh. */
export const atBottleneck = () => (s.r === 0 ? s.prog >= 100 : thienDo() ? tdCanAscend() : s.st === 3 && s.prog >= 100);

// ---------- Túi đồ ----------
export const bagCap = () => BAG_CAP + (s.flags.bagExtra || 0) + gearSum('cap');
export const bagUsed = () => s.bag.length + s.gearBag.length;
export const bagFree = () => bagCap() - bagUsed();

export function itemKind(id: string) {
  return id.slice(0, id.indexOf(':'));
}
export function itemName(id: string, g?: number): string {
  const [k, key] = id.split(':');
  switch (k) {
    case 'h': return HERBS[key]?.n || key;
    case 'p': return PILLS[key] ? `${PILLS[key].n} (${pillGrade(PILLS[key], g ?? 1)})` : key;
    case 'm': return MATS[key]?.n || key;
    case 't': return TALIS[key] ? `${TALIS[key].n} (${talisGrade(TALIS[key], g ?? 1)})` : key;
    case 'cp': return TECHS[key] ? `Bí kíp «${TECHS[key].n}» (${techGrade(TECHS[key])})` : key;
    case 'sk': return SKILLS[key] ? `Thuật thư «${SKILLS[key].n}» (${skillGrade(SKILLS[key])})` : key;
    case 'x': return SPECIALS[key]?.n || key;
    case 'tp': return TAMPHAP[key] ? `Tâm kinh «${TAMPHAP[key].n}» (${tamGrade(TAMPHAP[key])})` : key;
    case 'fq': return PHAPQUYET[key] ? `Pháp quyết «${PHAPQUYET[key].n}» (${pqGrade(PHAPQUYET[key])})` : key;
  }
  return id;
}
export function itemTier(id: string): number {
  const [k, key] = id.split(':');
  switch (k) {
    case 'h': return HERBS[key]?.tier || 1;
    case 'p': return PILLS[key]?.tier || 1;
    case 'm': return MATS[key]?.tier || 1;
    case 't': return TALIS[key]?.tier || 1;
    case 'cp': return TECHS[key]?.tier || 1;
    case 'sk': return SKILLS[key]?.tier || 1;
    case 'tp': return TAMPHAP[key]?.tier || 1;
    case 'fq': return PHAPQUYET[key]?.tier || 1;
  }
  return 1;
}
export function itemDesc(id: string): string {
  const [k, key] = id.split(':');
  switch (k) {
    case 'h': { const h = HERBS[key]; return h ? `Linh thảo ${h.tier} phẩm, thuộc tính ${EL[h.el].n}.` : ''; }
    case 'p': return PILLS[key]?.d || '';
    case 'm': return MATS[key]?.d || '';
    case 't': return TALIS[key]?.d || '';
    case 'cp': return TECHS[key]?.d || '';
    case 'sk': return SKILLS[key]?.d || '';
    case 'x': return SPECIALS[key]?.d || '';
    case 'tp': return TAMPHAP[key] ? `${TAMPHAP[key].d} (${tamEffect(TAMPHAP[key])})` : '';
    case 'fq': return PHAPQUYET[key]?.d || '';
  }
  return '';
}
export function itemPrice(id: string, g = 1): number {
  const [k, key] = id.split(':');
  switch (k) {
    case 'h': return herbPrice(HERBS[key]?.tier || 1);
    case 'p': return PILLS[key] ? pillPrice(PILLS[key], g) : 10;
    case 'm': return MATS[key] ? matPrice(MATS[key]) : 10;
    case 't': return TALIS[key] ? talisPrice(TALIS[key], g) : 10;
    case 'cp': return TECHS[key] ? techPrice(TECHS[key]) : 50;
    case 'sk': return SKILLS[key] ? skillPrice(SKILLS[key]) : 50;
    case 'x': return SPECIALS[key]?.price || 20;
    case 'tp': return TAMPHAP[key] ? tamPrice(TAMPHAP[key]) : 50;
    case 'fq': return PHAPQUYET[key] ? pqPrice(PHAPQUYET[key]) : 50;
  }
  return 10;
}
export const pillMult = (g = 1) => GRADE_MULT[g] ?? 1;

export const count = (id: string, g?: number) =>
  s.bag.filter((b) => b.id === id && (g === undefined || (b.g ?? 1) === g)).reduce((a, b) => a + b.n, 0);

/** Thêm vật phẩm. Trả về số lượng thực nhận (túi đầy thì bỏ lại). */
export function addItem(id: string, n = 1, g?: number): number {
  id = localItemId(id, s.world ?? 0);
  if ((id.startsWith('p:') || id.startsWith('t:')) && g === undefined) g = 1;
  const ex = s.bag.find((b) => b.id === id && b.g === g);
  if (ex) {
    ex.n += n;
  } else {
    if (bagFree() <= 0) return 0;
    s.bag.push({ id, n, g });
  }
  codexAdd('item', id.startsWith('p:') ? id : id);
  return n;
}
export function removeItem(id: string, n = 1, g?: number): boolean {
  let need = n;
  if (count(id, g) < n) return false;
  for (const b of [...s.bag]) {
    if (b.id !== id || (g !== undefined && (b.g ?? 1) !== g)) continue;
    const take = Math.min(b.n, need);
    b.n -= take;
    need -= take;
    if (b.n <= 0) s.bag.splice(s.bag.indexOf(b), 1);
    if (!need) break;
  }
  return true;
}
export function addGear(g: Gear): boolean {
  const oldG = g.g, oldQ = g.q; limitGear(g, s.world ?? 0);
  if (bagFree() <= 0) return false;
  s.gearBag.push(g);
  return true;
}

export const sortBag = () =>
  s.bag.sort((a, b) => a.id.localeCompare(b.id) || (b.g ?? 1) - (a.g ?? 1));

export function bagItemLabel(b: BagItem) {
  return itemName(b.id, b.g) + (b.n > 1 ? ` ×${b.n}` : '');
}

/** Hệ số tiền thưởng theo cảnh giới, để sự kiện cho thưởng hợp lý ở mọi giai đoạn. */
export const moneyScale = (r = s.r) => (r <= 8 ? [1, 3, 12, 45, 160, 550, 1800, 6000, 20000][r] : Math.round(20000 * Math.pow(3.3, r - 8)));
export const M = (n: number) => Math.max(1, Math.round(n * moneyScale()));

export const buyMult = () => (has('thuongnhan') ? 0.85 : 1) * (1 - clamp(stat('mi') - 5, -3, 8) * 0.015);
export const sellMult = () => (has('thuongnhan') ? 1.15 : 1) * 0.5;
