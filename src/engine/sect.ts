import { worldDefinitions } from '../data/local-items';
import { itemName, count, removeItem, itemPrice } from './char';
import { localItemId, limitGear } from '../data/local-items';
import { branchSchool } from '../data/declining-schools';
import { worldArtCap } from '../data/treasure-grades';
import { kmSyncSkills } from './kinhmach';
import { PHAPQUYET } from '../data/spirit';
// Tông môn: khảo hạch, gia nhập, thăng cấp, rời tông, nhiệm vụ, đổi cống hiến.
import { RMAX, REALMS, EL } from '../data/core';
import { SECTS, SECT_RANKS, SECT_TIER, SECT_TIER_INFO, RK, rankLabel, promoReq, headTitle } from '../data/world';
import { MAX_SKILLS, TECHS, SKILLS, PILLS, TAMPHAP, TALIS, HERBS, MATS, mkGear, gearPrice, type Gear } from '../data/items';
import { seeded, hashStr, clamp, ch, pick } from '../core/util';
import { s, codexAdd } from './state';
import { effRi, seenRoot as root, root as trueRoot, thapHidden } from './char';
import { mark, addLog, setLoc, mkNpc, addNpc } from './core';
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

export interface SectWarSpoils {
  wins: number;
  books: { id: string; n: string; source: string; cost: number; minRank: number }[];
  gears: Gear[];
  mats: { id: string; n: string; cost: number; minRank: number; source: string }[];
}

/** Hàng đổi bằng cống hiến ở Tàng Kinh Các / Bảo khố tông môn. */
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
  
  // Đan dược: Bảo khố bày đủ các cấp đan dược (đột phá, hỗ trợ, tu luyện, thọ nguyên...)
  for (const p of worldDefinitions('p')) {
    if (p.tier <= Math.min(6, sc.tier + 2)) {
      out.push({ id: 'p:' + p.id, n: p.n, cost: Math.round(8 * Math.pow(3, p.tier - 1) * (p.k === 'break' ? 4 : p.k === 'root' ? 6 : 1)), minRank: p.k === 'break' ? RK.NOI : RK.NGOAI });
    }
  }

  // ---- Bảo khố: pháp khí đầy đủ các ô trang bị, phù lục, linh thảo, nguyên liệu ----
  const rnd = seeded(hashStr(`vault:${sc.id}:${Math.floor(s.year)}:${s.id}`));
  const sold = ((s.flags.vaultSold ||= {}) as Record<string, number>);
  const yk = `${sc.id}:${Math.floor(s.year)}`;
  const giaiCap = Math.min(6, sc.tier + 1);

  // Pháp khí bày đủ 8 ô trang bị
  for (let sIdx = 0; sIdx < 8; sIdx++) {
    const key = `gear_slot_${sIdx}`;
    if (sold[yk + key]) continue;
    const saved = Math.random;
    Math.random = rnd;
    const lv = Math.max(0, Math.min(RMAX(), effRi() + (rnd() < 0.3 ? 1 : 0) - (rnd() < 0.3 ? 1 : 0)));
    const g = Math.max(1, Math.min(giaiCap, Math.round(1 + rnd() * giaiCap * 0.8)));
    const gr = mkGear(lv, g, sIdx);
    Math.random = saved;
    gr.uid = `v${key}${yk}`;
    out.push({ id: 'gear', n: gr.n, cost: Math.round(gearPrice(gr) / 6), minRank: [0, RK.NGOAI, RK.NOI, RK.KYDANH, RK.THANTRUYEN, RK.THUTICH, RK.THANHTU][g], gear: gr });
  }

  // Phù lục: đầy đủ các loại phù
  for (const tl of worldDefinitions('t')) if (!tl.co && tl.tier <= giaiCap) out.push({ id: 't:' + tl.id, n: tl.n, cost: Math.round(6 * Math.pow(3.2, tl.tier - 1)), minRank: tl.tier >= 3 ? RK.NOI : RK.NGOAI, g: sc.craft === 'talis' ? 2 : 1 });

  // Linh thảo luyện đan & Nguyên liệu luyện khí, luyện phù: đầy đủ mọi loại
  const herbCap = Math.min(6, sc.tier + 2);
  for (const hb of Object.values(HERBS)) if (hb.tier <= herbCap) out.push({ id: 'h:' + hb.id, n: hb.n, cost: Math.round(3 * Math.pow(3, hb.tier - 1)), minRank: hb.tier >= 4 ? RK.NOI : RK.NGOAI });
  for (const m of Object.values(MATS)) if (m.tier <= Math.min(6, sc.tier + 2)) out.push({ id: 'm:' + m.id, n: m.n, cost: Math.round(4 * Math.pow(3, m.tier - 1)), minRank: m.tier >= 4 ? RK.NOI : RK.NGOAI });

  // Chiến lợi phẩm thu được từ các lần tông môn chiến chiến thắng
  const sp = (s.flags.sectWarSpoils ||= { wins: 0, books: [], gears: [], mats: [] }) as SectWarSpoils;
  for (const b of sp.books || []) {
    out.push({ id: b.id, n: `${b.n} (Chiến lợi ${b.source})`, cost: b.cost, minRank: b.minRank, source: b.source } as any);
  }
  for (const gr of sp.gears || []) {
    if (!sold[gr.uid]) {
      out.push({ id: 'gear', n: gr.n, cost: Math.round(gearPrice(gr) / 7), minRank: RK.NOI, gear: gr, source: 'war' } as any);
    }
  }
  for (const m of sp.mats || []) {
    out.push({ id: m.id, n: `${m.n} (Chiến lợi ${m.source})`, cost: m.cost, minRank: m.minRank, source: m.source } as any);
  }

  const cap = branchSchool(sc.n) ? Math.min(4, worldArtCap()) : worldArtCap();
  const seen = new Set<string>();
  return out.map(w => {
    if (w.gear) limitGear(w.gear, s.world ?? 0, cap);
    const id = localItemId(w.id, s.world ?? 0, cap);
    const name = (w as any).source ? w.n : (id === w.id ? w.n : itemName(id));
    return { ...w, id, n: name, cost: Math.max(1, Math.round(w.cost)) };
  }).filter(w => {
    if (w.id === 'gear') return true;
    const seenKey = (w as any).source ? `${w.id}:${(w as any).source}` : w.id;
    if (seen.has(seenKey)) return false;
    seen.add(seenKey);
    return true;
  });
}

/** Thắng tông môn chiến: Tàng Kinh Các nhận thêm sách của địch, Bảo khố có thêm pháp bảo và nguyên liệu quý. */
export function winSectWar(foeId: string): string {
  const sc = sect();
  const foe = SECTS[foeId] || Object.values(SECTS).find((x) => x.id !== sc?.id);
  if (!sc || !foe) return '';
  s.flags.sectWarWins = (s.flags.sectWarWins || 0) + 1;
  const sp = (s.flags.sectWarSpoils ||= { wins: 0, books: [], gears: [], mats: [] }) as SectWarSpoils;
  sp.wins = s.flags.sectWarWins;

  const added: string[] = [];

  // 1. Tàng Kinh Các có thêm sách từ địch:
  const foeTech = TECHS[foe.tech];
  if (foeTech && !sp.books.some((b) => b.id === 'cp:' + foeTech.id)) {
    sp.books.push({
      id: 'cp:' + foeTech.id,
      n: `《${foeTech.n}》`,
      source: foe.n,
      cost: 40 * Math.pow(4, foeTech.tier - 1),
      minRank: RK.NOI,
    });
    added.push(`Công pháp trấn tông 《${foeTech.n}》`);
  }
  const skPool = worldDefinitions('sk').filter((k) => (foe.el.includes(k.el as any) || skillOwners(k.id).includes(foe.id)) && !sp.books.some((b) => b.id === 'sk:' + k.id));
  if (skPool.length) {
    const sk = skPool[Math.floor(Math.random() * skPool.length)];
    sp.books.push({
      id: 'sk:' + sk.id,
      n: sk.n,
      source: foe.n,
      cost: 25 * Math.pow(3.5, sk.tier - 1),
      minRank: RK.NOI,
    });
    added.push(`Võ công 《${sk.n}》`);
  }
  const tpPool = worldDefinitions('tp').filter((x) => x.tier >= 2 && x.tier <= Math.min(6, sc.tier + 2) && !sp.books.some((b) => b.id === 'tp:' + x.id));
  if (tpPool.length) {
    const tp = tpPool[Math.floor(Math.random() * tpPool.length)];
    sp.books.push({
      id: 'tp:' + tp.id,
      n: tp.n,
      source: foe.n,
      cost: Math.round(30 * Math.pow(4, tp.tier - 1) * (1 + tp.pq * 0.3)),
      minRank: RK.NOI,
    });
    added.push(`Tâm kinh 《${tp.n}》`);
  }

  // 2. Bảo khố có thêm pháp bảo cao cấp:
  const cap = Math.min(6, sc.tier + 2);
  const nGears = 2;
  for (let i = 0; i < nGears; i++) {
    const gr = mkGear(Math.min(RMAX(), effRi() + 1), clamp(Math.round(2 + Math.random() * (cap - 1)), 2, 6), (i * 2 + 1) % 8);
    gr.n = `${gr.n} · chiến lợi phẩm ${foe.n}`;
    gr.refined = true;
    gr.uid = `war_gear_${s.flags.sectWarWins}_${i}_${Math.random().toString(36).slice(2, 7)}`;
    sp.gears.push(gr);
  }
  added.push(`${nGears} kiện pháp bảo chiến lợi`);

  // 3. Bảo khố có thêm nguyên liệu quý từ khoáng mạch và dược điền địch:
  const rareMats = Object.values(MATS).filter((m) => m.tier >= 2 && m.tier <= cap);
  const rareHerbs = Object.values(HERBS).filter((h) => h.tier >= 2 && h.tier <= cap);
  for (let i = 0; i < 3 && rareMats.length; i++) {
    const m = rareMats[Math.floor(Math.random() * rareMats.length)];
    if (!sp.mats.some((x) => x.id === 'm:' + m.id)) {
      sp.mats.push({ id: 'm:' + m.id, n: m.n, cost: Math.round(4 * Math.pow(3, m.tier - 1)), minRank: RK.NGOAI, source: foe.n });
    }
  }
  for (let i = 0; i < 3 && rareHerbs.length; i++) {
    const h = rareHerbs[Math.floor(Math.random() * rareHerbs.length)];
    if (!sp.mats.some((x) => x.id === 'h:' + h.id)) {
      sp.mats.push({ id: 'h:' + h.id, n: h.n, cost: Math.round(3 * Math.pow(3, h.tier - 1)), minRank: RK.NGOAI, source: foe.n });
    }
  }
  added.push('nhiều nguyên liệu luyện đan, luyện khí, phù lục quý');

  s.fame += 100 * sc.tier;
  if (s.sect) s.sect.contrib += 300 * sc.tier;
  addLog(`Chiến thắng tông môn chiến trước ${foe.n}! Tàng Kinh Các và Bảo khố thu về: ${added.join(', ')}.`, 'good');
  return `Chiến thắng đại tiệc khải hoàn! Toàn tông vang rền tiếng chiêng trống mừng thắng lợi trước ${foe.n}. Tàng Kinh Các đã nhập thêm kinh tịch mới; Bảo khố tông môn bổ sung thêm pháp bảo và nguyên liệu quý tịch thu từ đối phương!`;
}

/** Đệ tử nộp vật phẩm từ túi vào bảo khố tông môn để đổi lấy cống hiến. */
export function donateItemToVault(id: string, qty = 1, g?: number): { ok: boolean; msg: string; contrib: number } {
  if (!s.sect) return { ok: false, msg: 'Chưa gia nhập tông môn.', contrib: 0 };
  const cur = count(id, g);
  if (cur < qty) return { ok: false, msg: `Không đủ số lượng trong túi (${cur}/${qty}).`, contrib: 0 };
  const baseP = itemPrice(id, g);
  const singleC = Math.max(1, Math.round(baseP * 0.45));
  const totalC = singleC * qty;
  removeItem(id, qty, g);
  s.sect.contrib += totalC;
  addLog(`Giao nộp ${qty}x ${itemName(id, g)} vào bảo khố tông môn, nhận ${totalC} cống hiến.`, 'good');
  return { ok: true, msg: `Đã giao nộp ${qty}x ${itemName(id, g)}, nhận được ${totalC} cống hiến!`, contrib: totalC };
}

/** Đệ tử nộp trang bị vào bảo khố tông môn để đổi lấy cống hiến. */
export function donateGearToVault(uid: string): { ok: boolean; msg: string; contrib: number } {
  if (!s.sect) return { ok: false, msg: 'Chưa gia nhập tông môn.', contrib: 0 };
  const idx = s.gearBag.findIndex((g) => g.uid === uid);
  if (idx < 0) return { ok: false, msg: 'Không tìm thấy trang bị trong túi.', contrib: 0 };
  const gr = s.gearBag[idx];
  const contrib = Math.max(5, Math.round(gearPrice(gr) / 7));
  s.gearBag.splice(idx, 1);
  s.sect.contrib += contrib;
  addLog(`Giao nộp pháp bảo ${gr.n} vào bảo khố tông môn, nhận ${contrib} cống hiến.`, 'good');
  return { ok: true, msg: `Đã giao nộp ${gr.n}, nhận được ${contrib} cống hiến!`, contrib };
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
