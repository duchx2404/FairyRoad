import { worldDefinitions } from '../data/local-items';
import { itemName } from './char';
import { localItemId, limitGear } from '../data/local-items';
import { branchSchool } from '../data/declining-schools';
import { worldArtCap } from '../data/treasure-grades';
import { kmSyncSkills } from './kinhmach';
import { PHAPQUYET } from '../data/spirit';
// Tông môn: khảo hạch, gia nhập, thăng cấp, rời tông, nhiệm vụ, đổi cống hiến.
import { RMAX, REALMS, EL } from '../data/core';
import { SECTS, SECT_RANKS, SECT_TIER, SECT_TIER_INFO, RK, rankLabel, promoReq, headTitle } from '../data/world';
import { MAX_SKILLS, TECHS, SKILLS, PILLS, TAMPHAP, TALIS, HERBS, MATS, mkGear, gearPrice, type Gear } from '../data/items';
import { seeded, hashStr } from '../core/util';
import { s, codexAdd } from './state';
import { effRi, seenRoot as root, root as trueRoot, thapHidden } from './char';
import { mark, addLog, setLoc, mkNpc, addNpc } from './core';
import { ch, pick } from '../core/util';
import { queueJoinCongrats } from './bride';
import { allyFollow } from './ally';

// ---------- Công pháp độc môn ----------
/** Công pháp phổ thông: dù có tông dùng làm nhập môn, nơi khác vẫn truyền. */
const COMMON_TECH = new Set(['thanhtam', 'kimcuongquyet', 'thanhmocquyet', 'nhuocthuyquyet', 'liethoaquyet', 'bangphachquyet', 'loidinhquyet', 'thanhphongquyet', 'liemtucthuat', 'thanquangquyet', 'trongsonquyet', 'canhphongquyet', 'kinhloiquyet', 'uamquyet', 'luuquangquyet', 'nguhanhquyet', 'tinhhaiquyet', 'phonglangquyet', 'baisonkinh']);
export const techOwners = (id: string) => Object.values(SECTS).filter((x) => x.tech === id).map((x) => x.id);
/** Công pháp trấn tông: chỉ tông sở hữu mới truyền. */
export const isExclusiveTech = (id: string) => !COMMON_TECH.has(id) && techOwners(id).length > 0;
const commonSkills = () => new Set(worldDefinitions('cp').filter((t) => !isExclusiveTech(t.id)).flatMap((t) => t.skills));
/** Thuật pháp đi kèm công pháp độc môn → cũng độc môn. Trả về danh sách tông sở hữu (rỗng = phổ thông). */
export function skillOwners(id: string): string[] {
  if (commonSkills().has(id)) return [];
  return worldDefinitions('cp').filter((t) => isExclusiveTech(t.id) && t.skills.includes(id)).flatMap((t) => techOwners(t.id));
}
export const sectCanTeachTech = (techId: string, sectId: string) => !isExclusiveTech(techId) || techOwners(techId).includes(sectId);
export const sectCanTeachSkill = (skId: string, sectId: string) => { const o = skillOwners(skId); return !o.length || o.includes(sectId); };

export const sect = () => (s.sect ? SECTS[s.sect.id] : null);
export const rankName = () => (s.sect ? rankLabel(s.sect.rank, SECTS[s.sect.id], s.g) : '');

export function canJoin(id: string, token = false): { ok: boolean; why: string } {
  const sc = SECTS[id];
  if (s.sect) return { ok: false, why: 'Ngươi đã là người của tông môn khác.' };
  const h = s.sectHist[id];
  if (h === 'betrayed' || h === 'expelled') return { ok: false, why: `${sc.n} đã liệt ngươi vào danh sách phản đồ.` };
  const admissionRoot = thapHidden() && effRi() >= 2 ? trueRoot() : root();
  if (admissionRoot.m === 0) return { ok: false, why: 'Không có linh căn, tông môn nào nhận?' };
  if (sc.tribe) return { ok: false, why: sc.tribe === 'hai' ? `${sc.n} chỉ thu nhận hải tộc yêu thú hóa hình, không nhận nhân tộc.` : `${sc.n} chỉ thu nhận thủy tộc yêu thú hóa hình, không nhận nhân tộc.` };
  const age = s.year - s.born;
  const maxAge = SECT_TIER_INFO[sc.tier].maxAge;
  const veteran = effRi() >= sc.tier + 1; // tu sĩ đủ mạnh được mời làm khách khanh, bỏ qua giới hạn tuổi
  if (age > maxAge && !veteran) return { ok: false, why: `${SECT_TIER[sc.tier]} chỉ nhận người dưới ${maxAge} tuổi, trừ tu sĩ từ ${REALMS[sc.tier + 1].n} trở lên.` };
  if (!token || sc.tier === 4) {
    if (admissionRoot.q < sc.minQ) return { ok: false, why: `Tư chất ${admissionRoot.n} chưa đạt yêu cầu của ${sc.n}.` };
    if (!s.root.els.some((e) => sc.el.includes(e)) && !(s.root.els.length >= 5 && sc.el.length >= 5)) return { ok: false, why: `${sc.n} chỉ nhận linh căn ${sc.el.map((e) => EL[e].n).join(', ')}.` };
    if (sc.fem && s.g === 'm' && admissionRoot.q < 5) return { ok: false, why: `${sc.n} hiếm khi nhận nam đệ tử, trừ phi tư chất xuất chúng.` };
  }
  return { ok: true, why: '' };
}

export function joinSect(id: string, rank = -1): string {
  const sc = SECTS[id];
  const chu = SECT_TIER_INFO[sc.tier].chu;
  const startRank = rank >= 0 ? rank : effRi() >= chu - 1 ? RK.TL_NGOAI : effRi() >= 2 ? RK.NOI : RK.NGOAI;
  s.sect = { id, rank: startRank, contrib: 0, joined: s.year, lastPay: Math.floor(s.year) };
  codexAdd('sect', id);
  setLoc(sc.loc);
  const t = TECHS[sc.tech];
  let txt = `Ngươi trở thành ${rankLabel(startRank, sc, s.g).toLowerCase()} của ${sc.n} (${SECT_TIER[sc.tier]}). Môn quy: "${sc.motto}"`;
  if (!s.tech || (!TECHS[s.tech]?.grow && TECHS[s.tech].tier <= t.tier)) {
    s.tech = sc.tech;
    s.techM = 0;
    for (const k of t.skills) if (!s.known.includes(k)) { s.known.push(k); s.skills.push(k); }
    kmSyncSkills();
    codexAdd('tech', sc.tech);
    txt += ` Được truyền ${t.n}.`;
  }
  if (sc.craft === 'alch' && s.craft.alch < 1) { s.craft.alch = 1; s.recipes.push('hoixuandan', 'tukhi'); }
  if (sc.craft === 'talis' && s.craft.talis < 1) { s.craft.talis = 1; s.recipes.push('hoaphu', 'kimcangphu', 'thanhanhphu'); }
  if (sc.craft === 'forge' && s.craft.forge < 1) s.craft.forge = 1;
  // một sư huynh/tỷ trong tông
  addNpc(mkNpc({ dr: 1, sect: id, tag: 'senior', rel: 20, how: `Sư ${ch(0.5) ? 'huynh' : 'tỷ'} đồng môn ở ${sc.n}` }));
  if (startRank >= RK.NOI) txt += ' Mấy vị trưởng lão đã để mắt tới ngươi — tới Bái sư mà chọn lấy một người.';
  mark(`Gia nhập ${sc.n}`);
  queueJoinCongrats(`sect:${id}`); // Diệp gia trước 16 tuổi: các vị hôn thê gửi thư chúc mừng
  txt += allyFollow(); // đồng hành đã mất tông môn: theo ngươi gia nhập
  return txt;
}

export function leaveSect(betray = false): string {
  if (!s.sect) return '';
  const sc = SECTS[s.sect.id];
  s.sectHist[sc.id] = betray ? 'betrayed' : 'left';
  for (const n of s.npcs) if (n.sect === sc.id && n.alive) n.rel -= betray ? 50 : 15;
  mark(betray ? `Phản bội ${sc.n}` : `Rời khỏi ${sc.n}`);
  s.sect = null;
  return betray ? `Ngươi trốn khỏi ${sc.n}. Từ nay đệ tử ${sc.n} gặp ngươi là rút kiếm.` : `Ngươi trả lại lệnh bài, rời khỏi ${sc.n}.`;
}

export function expel(): string {
  if (!s.sect) return '';
  const sc = SECTS[s.sect.id];
  s.sectHist[sc.id] = 'expelled';
  mark(`Bị trục xuất khỏi ${sc.n}`);
  s.sect = null;
  return `Ngươi bị trục xuất khỏi ${sc.n}.`;
}

export function promoInfo(): { can: boolean; why: string } {
  if (!s.sect) return { can: false, why: '' };
  const sc = SECTS[s.sect.id];
  const nr = s.sect.rank + 1;
  if (s.sect.rank === RK.CHU) return { can: false, why: `Đã là ${headTitle(sc)}. Có thể thoái vị làm Thái thượng trưởng lão.` };
  if (nr >= SECT_RANKS.length) return { can: false, why: 'Vai vế cao nhất tông môn.' };
  const [minR, need] = promoReq(nr, sc);
  const next = rankLabel(nr, sc, s.g);
  if (effRi() < minR) return { can: false, why: `Lên ${next} cần ${REALMS[minR].n}.` };
  if (s.sect.contrib < need) return { can: false, why: `Lên ${next} cần ${need} cống hiến (hiện ${s.sect.contrib}).` };
  return { can: true, why: `Đủ điều kiện thăng ${next}.` };
}
export function promote(): string {
  const p = promoInfo();
  if (!p.can || !s.sect) return p.why;
  const sc = SECTS[s.sect.id];
  const [, need] = promoReq(s.sect.rank + 1, sc);
  s.sect.contrib -= need;
  s.sect.rank++;
  const nm = rankLabel(s.sect.rank, sc, s.g);
  mark(`Thăng ${nm} của ${sc.n}`);
  s.fame += s.sect.rank * 12;
  if (s.sect.rank === RK.CHU) return `${headTitle(sc)} đời trước thoái vị, trao ấn tín cho ngươi trước mặt toàn tông. Từ nay ngươi là ${nm} ${sc.n}.`;
  if (s.sect.rank === RK.THANHTU) return `Toàn tông chấn động: ngươi được lập làm ${nm}, người kế thừa tương lai của ${sc.n}.`;
  return `Tông môn ban lệnh bài mới. Ngươi giờ là ${nm}.`;
}
/** Tông chủ thoái vị → Thái thượng trưởng lão: ít quyền hơn tông chủ đương nhiệm, nhưng vai vế cao hơn. */
export function retire(): string {
  if (!s.sect || s.sect.rank !== RK.CHU) return '';
  const sc = SECTS[s.sect.id];
  s.sect.rank = RK.THAITHUONG;
  mark(`Thoái vị ${headTitle(sc)}, làm Thái thượng trưởng lão ${sc.n}`);
  s.fame += 50;
  return `Ngươi trao ấn ${headTitle(sc).toLowerCase()} cho người kế nhiệm, lui về hậu sơn. Việc tông môn không còn trong tay ngươi — nhưng ngay cả ${headTitle(sc).toLowerCase()} mới gặp ngươi cũng phải cúi đầu gọi một tiếng "sư tôn".`;
}

/** Hàng đổi bằng cống hiến ở Tàng Kinh Các / Đan Phòng. */
export interface SectWare { id: string; n: string; cost: number; minRank: number; gear?: Gear; g?: number }
export function sectWares(): SectWare[] {
  const sc = sect();
  if (!sc) return [];
  const out: SectWare[] = [];
  const techs = worldDefinitions('cp').filter((t) => !t.blood && (t.id === sc.tech || (t.tier <= Math.min(6, sc.tier + 1) && !t.evil === !sc.evil && (t.el.length === 0 || t.el.some((e) => sc.el.includes(e)) || sc.el.length === 0))) && sectCanTeachTech(t.id, sc.id));
  for (const t of techs) out.push({ id: 'cp:' + t.id, n: t.n, cost: 40 * Math.pow(4, t.tier - 1), minRank: [0, RK.NGOAI, RK.NOI, RK.THANTRUYEN, RK.THUTICH, RK.THANHTU, RK.CHU][t.tier] });
  const sks = worldDefinitions('sk').filter((k) => !k.peak && ((k.tier <= sc.tier + 1 && (!k.el || sc.el.includes(k.el) || sc.el.length === 0)) || skillOwners(k.id).includes(sc.id)) && sectCanTeachSkill(k.id, sc.id));
  for (const k of sks) out.push({ id: 'sk:' + k.id, n: k.n, cost: 25 * Math.pow(3.5, k.tier - 1), minRank: [0, RK.NGOAI, RK.NOI, RK.KYDANH, RK.THANTRUYEN, RK.THUTICH, RK.THANHTU][Math.min(6, k.tier)] });
  for (const x of worldDefinitions('tp')) if (x.tier <= Math.min(6, sc.tier + 2)) out.push({ id: 'tp:' + x.id, n: x.n, cost: Math.round(30 * Math.pow(4, x.tier - 1) * (1 + x.pq * 0.3)), minRank: [0, RK.NGOAI, RK.NOI, RK.KYDANH, RK.THANTRUYEN, RK.THUTICH, RK.THANHTU][x.tier] });
  for (const x of worldDefinitions('fq')) if (x.tier <= Math.min(6, sc.tier + 2)) out.push({ id: 'fq:' + x.id, n: x.n, cost: Math.round(35 * Math.pow(4, x.tier - 1) * (1 + x.pq * 0.3)), minRank: [0, RK.NGOAI, RK.NOI, RK.KYDANH, RK.THANTRUYEN, RK.THUTICH, RK.THANHTU][x.tier] });
  for (const p of worldDefinitions('p')) {
    if (p.tier > effRi() + 1 || p.tier < effRi() - 1) continue;
    out.push({ id: 'p:' + p.id, n: p.n, cost: Math.round(8 * Math.pow(3, p.tier - 1) * (p.k === 'break' ? 4 : p.k === 'root' ? 6 : 1)), minRank: p.k === 'break' ? RK.NOI : RK.NGOAI });
  }
  // ---- Bảo khố: pháp khí, phù lục, vật liệu (đổi theo năm, thiên về nghề của tông) ----
  const rnd = seeded(hashStr(`vault:${sc.id}:${Math.floor(s.year)}:${s.id}`));
  const sold = ((s.flags.vaultSold ||= {}) as Record<string, number>);
  const yk = `${sc.id}:${Math.floor(s.year)}`;
  const giaiCap = Math.min(6, sc.tier + 1);
  const nGear = sc.craft === 'forge' ? 6 : 4;
  for (let i = 0; i < nGear; i++) {
    const key = `gear${i}`;
    if (sold[yk + key]) continue;
    const saved = Math.random;
    Math.random = rnd;
    const lv = Math.max(0, Math.min(RMAX(), effRi() + (rnd() < 0.3 ? 1 : 0) - (rnd() < 0.3 ? 1 : 0)));
    const g = Math.max(1, Math.min(giaiCap, Math.round(1 + rnd() * giaiCap * 0.8)));
    const gr = mkGear(lv, g, (i + Math.floor(rnd() * 5)) % 5);
    Math.random = saved;
    gr.uid = `v${key}${yk}`;
    out.push({ id: 'gear', n: gr.n, cost: Math.round(gearPrice(gr) / 6), minRank: [0, RK.NGOAI, RK.NOI, RK.KYDANH, RK.THANTRUYEN, RK.THUTICH, RK.THANHTU][g], gear: gr });
  }
  for (const tl of worldDefinitions('t')) if (!tl.co && tl.tier <= giaiCap && (sc.craft === 'talis' || tl.tier <= Math.max(1, sc.tier))) out.push({ id: 't:' + tl.id, n: tl.n, cost: Math.round(6 * Math.pow(3.2, tl.tier - 1)), minRank: tl.tier >= 3 ? RK.NOI : RK.NGOAI, g: sc.craft === 'talis' ? 2 : 1 });
  const herbCap = Math.min(6, sc.tier + 2);
  for (const hb of Object.values(HERBS)) if (hb.tier <= herbCap && (sc.craft === 'alch' || hb.tier <= sc.tier + 1)) out.push({ id: 'h:' + hb.id, n: hb.n, cost: Math.round(3 * Math.pow(3, hb.tier - 1)), minRank: hb.tier >= 4 ? RK.NOI : RK.NGOAI });
  for (const m of Object.values(MATS)) if (m.tier <= Math.min(6, sc.tier + 2)) out.push({ id: 'm:' + m.id, n: m.n, cost: Math.round(4 * Math.pow(3, m.tier - 1)), minRank: m.tier >= 4 ? RK.NOI : RK.NGOAI });
  const cap = branchSchool(sc.n) ? Math.min(4, worldArtCap()) : worldArtCap();
  const seen = new Set<string>();
  return out.map(w => {
    if (w.gear) limitGear(w.gear, s.world ?? 0, cap);
    const id = localItemId(w.id, s.world ?? 0, cap);
    return { ...w, id, n: id === w.id ? w.n : itemName(id), cost: Math.max(1, Math.round(w.cost)) };
  }).filter(w => { if (w.id === 'gear') return true; if (seen.has(w.id)) return false; seen.add(w.id); return true; });
}

export function missionPool(): { n: string; d: string; y: number; danger: number; reward: number }[] {
  const sc = sect();
  if (!sc || !s.sect) return [];
  const base = 4 + effRi() * 3;
  return [
    { n: 'Trông vườn thuốc', d: 'Nhổ cỏ, tưới linh tuyền, đuổi chuột yêu.', y: 0.5, danger: 0, reward: base },
    { n: 'Tuần tra sơn môn', d: 'Canh giữ đại trận hộ sơn.', y: 1, danger: 0.15, reward: Math.round(base * 1.6) },
    { n: 'Diệt yêu thú quấy nhiễu', d: 'Yêu thú cấp thấp phá làng dưới núi.', y: 1, danger: 0.7, reward: Math.round(base * 3) },
    { n: 'Áp tải tài nguyên', d: 'Hộ tống linh thạch về tông, đường xa có cướp.', y: 2, danger: 0.5, reward: Math.round(base * 3.5) },
    { n: 'Truy sát phản đồ', d: sc.evil ? 'Kẻ phản giáo mang bí kíp bỏ trốn.' : 'Ma tu ẩn náu gần sơn môn.', y: 2, danger: 1, reward: Math.round(base * 6) },
  ];
}
export { pick, addLog };

export const markVaultSold = (gearUid: string) => {
  const m = gearUid.match(/^vgear(\d+)(.*)$/);
  if (m) ((s.flags.vaultSold ||= {}) as Record<string, number>)[m[2] + 'gear' + m[1]] = 1;
};
