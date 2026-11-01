// Đồng hành: chân linh (luôn theo), đạo lữ, đệ tử, thánh nữ còn giữ hôn ước, người quen thân thiết chịu đi theo.
// Mời ở bảng Nhân mạch; xuất trận tối đa 9 (tính cả chân linh), dự bị không giới hạn. Đồng hành tự đánh trong trận.
import { s, type NPC } from './state';
import { myLinh, removeItem, count, itemName, pillMult } from './char';
import { relChange, findNpc, addLog } from './core';
import { ch, ri, pick } from '../core/util';
import { SKILLS, TECHS, PILLS, SLOTS, mkGear, learnReq, gearLabel, type Gear } from '../data/items';
import { REALMS } from '../data/core';
import { SECTS } from '../data/world';
import { sectCanTeachSkill, isExclusiveTech, skillOwners } from './sect';
import { CLANS } from '../data/core';

export const MAX_ACTIVE = 9;
export interface Party { active: string[]; reserve: string[] }
export const party = (): Party => (s.flags.party ||= { active: [], reserve: [] });
export const inParty = (id: string) => party().active.includes(id) || party().reserve.includes(id);
/** Thánh nữ còn giữ hôn ước (Diệp gia Hỗn Độn). */
const kept = (id: string) => ((s.flags.dhKept as string[] | undefined) || []).includes(id);
/** Luôn chịu đi theo: đạo lữ, đệ tử, hôn thê còn giữ ước. */
const loyal = (n: NPC) => n.tag === 'daolu' || n.tag === 'disciple' || kept(n.id);

/** Lý do không mời được (null = mời được). */
export function canInvite(n: NPC): string | null {
  if (!n.alive) return 'đã mất';
  if (inParty(n.id)) return 'đã là đồng hành';
  if (n.tag === 'enemy' || n.tag === 'rival') return 'là kẻ thù';
  if (n.tag === 'master') return 'sư phụ không đi theo đồ đệ';
  if (!loyal(n) && n.rel < 60) return 'chưa đủ thân thiết (cần thiện cảm 60)';
  if (n.inviteY && s.year - n.inviteY < 1) return 'vừa từ chối, đợi một năm';
  return null;
}
/** Mời một người làm đồng hành: đạo lữ / đệ tử / hôn thê luôn nhận; người khác tuỳ thiện cảm. */
export function invite(id: string): string {
  const n = findNpc(id);
  if (!n) return '';
  const why = canInvite(n);
  if (why) return `Không mời được: ${why}.`;
  const p = loyal(n) || n.rel >= 80 ? 1 : (n.rel - 40) / 50;
  n.inviteY = s.year;
  if (!ch(p)) { relChange(n, -2); return `${n.name} lắc đầu: "Ta còn việc riêng, chưa thể theo ngươi." (thiện cảm hiện ${Math.round(n.rel)}, càng thân càng dễ nhận lời)`; }
  party().reserve.push(id);
  outfit(n);
  relChange(n, 3);
  return `${n.name} nhận lời đi theo ngươi. Đã vào danh sách dự bị — vào Nhân mạch › Đồng hành để cho xuất trận.`;
}
/** Chân linh có tính một suất xuất trận. */
export const activeCount = () => activeNpcs().length + (myLinh() ? 1 : 0);
/** Đồng hành đang xuất trận còn sống (bỏ người trọng thương), theo thứ tự đã xếp. */
export function activeNpcs(): NPC[] {
  party().active = party().active.filter((id) => findNpc(id)?.alive);
  for (const id of party().active) { const n = findNpc(id); if (n && !n.kit) outfit(n); }
  return party().active.map((id) => findNpc(id)!).filter((n) => !(n.injuredUntil && s.year < n.injuredUntil));
}
export function reserveNpcs(): NPC[] {
  party().reserve = party().reserve.filter((id) => findNpc(id)?.alive);
  for (const id of party().reserve) { const n = findNpc(id); if (n && !n.kit) outfit(n); }
  return party().reserve.map((id) => findNpc(id)!);
}
/** Cho xuất trận / rút về dự bị. */
export function setActive(id: string, on: boolean): string {
  const P = party();
  const n = findNpc(id);
  if (!n) return '';
  if (on) {
    if (activeCount() >= MAX_ACTIVE) return `Đội xuất trận đã đủ ${MAX_ACTIVE} người (tính cả chân linh).`;
    P.reserve = P.reserve.filter((x) => x !== id);
    if (!P.active.includes(id)) P.active.push(id);
    return `${n.name} vào đội xuất trận.`;
  }
  P.active = P.active.filter((x) => x !== id);
  if (!P.reserve.includes(id)) P.reserve.push(id);
  return `${n.name} lui về dự bị.`;
}
/** Cho về: rời đội hẳn. */
export function dismiss(id: string): string {
  const P = party();
  P.active = P.active.filter((x) => x !== id);
  P.reserve = P.reserve.filter((x) => x !== id);
  const n = findNpc(id);
  return n ? `${n.name} rời đội, trở về đường cũ.` : '';
}

// ---------- Bộ đồ của đồng hành ----------
export type Kit = NonNullable<NPC['kit']>;
export const kit = (n: NPC): Kit => (n.kit ||= { gear: [null, null, null, null, null], tech: null, known: [] });
/** Phẩm pháp khí được cấp theo gia thế: thánh địa 3, thượng tông / thế gia 2, còn lại 1. Thánh nữ (hồ sơ) thêm 1. */
function outfitGrade(n: NPC): number {
  const sc = n.sect ? SECTS[n.sect] : null;
  const clan = Object.values(CLANS).find((c) => c.patron === n.sect);
  let g = sc ? (sc.tier >= 4 ? 3 : sc.tier >= 3 ? 2 : 1) : 1;
  if (clan) g = Math.max(g, 2);
  if (n.bio) g += 1;
  return Math.min(4, g);
}
/** Cấp đồ cho đồng hành xứng với xuất thân và cảnh giới: công pháp tông môn, chiêu theo cảnh giới, pháp khí đủ 5 ô.
    Gọi khi vào đội và mỗi lần lên cảnh giới (chỉ nâng, không hạ). */
export function outfit(n: NPC, why = 'gia nhập') {
  const K = kit(n);
  const sc = n.sect ? SECTS[n.sect] : null;
  const g = outfitGrade(n);
  // công pháp: CHỈ của thế lực mình (công pháp trấn tông); tán tu không tông thì công pháp phổ thông hợp hệ cao nhất đủ cảnh giới
  const cur = K.tech ? TECHS[K.tech] : null;
  let want = sc && TECHS[sc.tech] ? TECHS[sc.tech] : null;
  if (!want && !sc) {
    const pool = Object.values(TECHS).filter((x) => !x.blood && !x.evil && !isExclusiveTech(x.id) && x.tier <= Math.max(1, Math.ceil((n.r + 1) / 2)) && (x.el.includes(n.el) || !x.el.length));
    want = pool.sort((a, b) => b.tier - a.tier || (b.pq ?? 0) - (a.pq ?? 0))[0] || null;
  }
  if (want && (!cur || want.tier > cur.tier)) { K.tech = want.id; for (const sid of want.skills) if (!K.known.includes(sid)) K.known.push(sid); }
  // chiêu: đủ số chiêu theo cảnh giới (Luyện Khí 2, Trúc Cơ 3, Kết Đan trở lên 4); chỉ chiêu thế lực mình truyền được (độc môn của tông khác thì không)
  const need = Math.min(4, 1 + Math.min(3, n.r));
  const pool = Object.values(SKILLS).filter((k) => !k.peak && k.tier <= Math.max(1, Math.ceil(n.r / 2)) && n.r >= learnReq(k.tier) && !K.known.includes(k.id) && (k.el === n.el || k.el === null) && (sc ? sectCanTeachSkill(k.id, sc.id) : !skillOwners(k.id).length));
  pool.sort((a, b) => b.tier - a.tier || b.m - a.m);
  while (K.known.filter((k) => SKILLS[k]).length < need && pool.length) K.known.push(pool.shift()!.id);
  // pháp khí: đủ 5 ô, cấp theo cảnh giới, phẩm theo gia thế; chỉ thay khi mạnh hơn
  const lv = Math.max(1, Math.min(n.r, REALMS.length - 2));
  let got = 0;
  for (let slot = 0; slot < 5; slot++) {
    const gear = mkGear(lv, g, slot, n.el, g >= 3 ? ri(1, 3) : ri(0, 2));
    const old = K.gear[slot];
    if (!old || gearScore(old) < gearScore(gear)) { K.gear[slot] = gear; got++; }
  }
  if (got || why !== 'lên cảnh giới') addLog(`${n.name} được ${sc ? sc.n : 'gia tộc'} cấp ${got ? `${got} món pháp khí` : 'thêm hành trang'} (${why}).`);
}
/** Điểm một món trang bị để so "mạnh nhất". */
export const gearScore = (g: Gear) => g.atk + g.def * 1.2 + g.hp / 8 + g.cult * 4 + g.luck * 15 + g.cap * 3;
/** Độ mạnh một chiêu để chọn mang ra trận. */
const skPower = (id: string) => { const k = SKILLS[id]; return k ? k.m * (k.k === 'multi' ? 3 : 1) * (k.k === 'heal' || k.k === 'shield' ? 0.8 : 1) : 0; };
/** Bốn chiêu mạnh nhất đã học (đồng hành luôn phối mạnh nhất). */
export const kitSkills = (n: NPC) => [...kit(n).known].filter((k) => SKILLS[k]).sort((a, b) => skPower(b) - skPower(a)).slice(0, 4);
/** Hệ số sức mạnh của đồng hành ngoài cảnh giới: tư chất, công pháp. */
export function compMul(n: NPC): number {
  const t = kit(n).tech ? TECHS[kit(n).tech!] : null;
  return (0.75 + n.talent * 0.25) * (t ? 0.9 + 0.1 * t.tier : 0.85) * (t?.pw || 1);
}
/** Cộng thêm từ trang bị đồng hành đang mang. */
export function kitSum(n: NPC): { atk: number; def: number; hp: number } {
  const o = { atk: 0, def: 0, hp: 0 };
  for (const g of kit(n).gear) if (g) { o.atk += g.atk; o.def += g.def; o.hp += g.hp; }
  return o;
}
/** Tặng pháp khí: so với món đang mang cùng ô, giữ món mạnh hơn, trả món kia lại túi ngươi. */
export function giftGear(id: string, uid: string): string {
  const n = findNpc(id);
  const i = s.gearBag.findIndex((g) => g.uid === uid);
  if (!n || i < 0) return '';
  const g = s.gearBag[i];
  if (!g.refined) return `${g.n} chưa luyện hóa, ${n.name} không dùng được.`;
  if (g.lv > n.r + 1) return `${g.n} là pháp khí cấp ${REALMS[g.lv].n}, ${n.name} chưa đủ cảnh giới điều khiển.`;
  const K = kit(n);
  const cur = K.gear[g.slot];
  if (cur && gearScore(cur) >= gearScore(g)) return `${n.name} xem qua rồi lắc đầu: ${cur.n} đang mang còn tốt hơn ${g.n}.`;
  s.gearBag.splice(i, 1);
  if (s.refining?.uid === uid) s.refining = null;
  K.gear[g.slot] = g;
  if (cur) s.gearBag.push(cur);
  relChange(n, 2);
  addLog(`Tặng ${g.n} cho ${n.name}.`);
  return `${n.name} nhận ${g.n} (${gearLabel(g)}), mang ngay vào ô ${SLOTS[g.slot]}.${cur ? ` ${cur.n} cũ trả lại cho ngươi.` : ''}`;
}
/** Tặng vật phẩm trong túi: đan tu luyện / dưỡng thương / tăng thọ, sách thuật, bí kíp công pháp. */
export function giftItem(id: string, item: string, g = 1): string {
  const n = findNpc(id);
  if (!n || count(item, g) < 1) return '';
  const [k, key] = item.split(':');
  const K = kit(n);
  if (k === 'p') {
    const pl = PILLS[key];
    if (!pl) return '';
    const m = pillMult(g);
    if (pl.k === 'cult') {
      if (pl.tier > n.r + 1) return `Dược lực ${pl.n} quá mạnh với ${n.name}, uống vào sẽ nổ kinh mạch.`;
      removeItem(item, 1, g);
      let eff = pl.v * m; if (pl.tier < n.r) eff *= Math.pow(0.35, n.r - pl.tier);
      (n as any).p = ((n as any).p || 0) + eff / 100;
      relChange(n, 2);
      return `${n.name} nuốt ${pl.n}, tu vi tăng ${Math.round(eff)}%.`;
    }
    if (pl.k === 'heal') {
      if (!(n.injuredUntil && s.year < n.injuredUntil)) return `${n.name} không bị thương, cất đan lại.`;
      removeItem(item, 1, g); delete n.injuredUntil; relChange(n, 3);
      return `${n.name} uống ${pl.n}, thương thế lành hẳn, có thể xuất trận.`;
    }
    if (pl.k === 'life') { removeItem(item, 1, g); const eff = Math.round(pl.v * m); n.life += eff; relChange(n, 4); return `${n.name} uống ${pl.n}, thọ nguyên thêm ${eff} năm.`; }
    return `${n.name} không cần ${pl.n}.`;
  }
  if (k === 'sk') {
    const sk = SKILLS[key];
    if (!sk) return '';
    if (K.known.includes(key)) return `${n.name} đã biết ${sk.n}.`;
    if (n.r < learnReq(sk.tier)) return `${sk.n} cần ${REALMS[learnReq(sk.tier)].n}, ${n.name} chưa lĩnh hội nổi.`;
    removeItem(item, 1); K.known.push(key); relChange(n, 3);
    addLog(`${n.name} học ${sk.n}.`);
    return `${n.name} đọc thuật thư, lĩnh hội ${sk.n}.${kitSkills(n).includes(key) ? '' : ' (chưa mạnh bằng các chiêu đang dùng, để dành.)'}`;
  }
  if (k === 'cp') {
    const tc = TECHS[key];
    if (!tc) return '';
    if (tc.blood) return `${tc.n} là công pháp huyết mạch, ${n.name} không tu được.`;
    const cur = K.tech ? TECHS[K.tech] : null;
    if (cur && (cur.tier > tc.tier || (cur.tier === tc.tier && (cur.pq ?? 0) >= (tc.pq ?? 0)))) return `${n.name} đang tu ${cur.n}, không kém ${tc.n}; không đổi.`;
    removeItem(item, 1); K.tech = key; for (const sid of tc.skills) if (!K.known.includes(sid)) K.known.push(sid); relChange(n, 5);
    addLog(`${n.name} chuyển tu ${tc.n}.`);
    return `${n.name} nhận bí kíp, chuyển tu ${tc.n}${tc.skills.length ? `, học được ${tc.skills.map((x) => SKILLS[x]?.n).filter(Boolean).join(', ')}` : ''}.`;
  }
  return `${n.name} không biết dùng ${itemName(item, g)} làm gì.`;
}
/** Tu luyện của đồng hành nhanh hơn khi có công pháp (gọi từ npcTick). */
export const compCultMul = (n: NPC) => (inParty(n.id) && n.kit?.tech ? 1 + 0.12 * TECHS[n.kit.tech].tier : 1);
/** Kỳ ngộ riêng của đồng hành theo năm: ngộ đạo, nhặt pháp khí, học chiêu, gặp bí kíp, hoặc gặp nạn. */
export function compAdventure(n: NPC, y: number) {
  if (!inParty(n.id) || !ch(0.12 * y)) return;
  const K = kit(n);
  const roll = ri(0, 9);
  if (roll <= 2) { (n as any).p = ((n as any).p || 0) + 0.5; addLog(`${n.name} ngộ đạo trong lúc tĩnh tọa, tu vi tăng vọt.`); return; }
  if (roll <= 4) {
    const g = mkGear(Math.max(1, Math.min(n.r, 9)), ri(1, 3));
    const cur = K.gear[g.slot];
    if (!cur || gearScore(cur) < gearScore(g)) { K.gear[g.slot] = g; addLog(`${n.name} gặp kỳ ngộ, có được ${g.n}.`); }
    return;
  }
  if (roll <= 6) {
    const pool = Object.values(SKILLS).filter((k) => !k.peak && k.tier <= Math.ceil((n.r + 1) / 2) && (k.el === n.el || k.el === null) && !K.known.includes(k.id));
    if (pool.length) { const k = pick(pool); K.known.push(k.id); addLog(`${n.name} lĩnh ngộ ${k.n} trong một lần kỳ ngộ.`); }
    return;
  }
  if (roll <= 7) {
    const cur = K.tech ? TECHS[K.tech] : null;
    const pool = Object.values(TECHS).filter((t) => !t.blood && !t.evil && t.tier <= Math.ceil((n.r + 1) / 2) && (!cur || t.tier > cur.tier) && t.el.some((e) => e === n.el));
    if (pool.length) { const t = pick(pool); K.tech = t.id; for (const sid of t.skills) if (!K.known.includes(sid)) K.known.push(sid); addLog(`${n.name} tìm được ${t.n}, chuyển tu.`); }
    return;
  }
  n.injuredUntil = s.year + 0.5;
  addLog(`${n.name} gặp nạn trong kỳ ngộ, trọng thương nửa năm.`, 'bad');
}
