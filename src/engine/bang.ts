import { limitGear } from '../data/local-items';
import { heldTreasures } from './legacy-holders';
import { worldTreasureCap } from '../data/treasure-grades';
// Các bảng xếp hạng của Thiên Cơ Lâu ngoài Thiên Kiêu / Cường Giả:
// Thế Lực Bảng (tông môn, hoàng triều, thế gia chung một bảng), Pháp Bảo Bảng, ba bảng danh sư (đan / khí / phù)
// và ba bảng pháp khí luyện chế (đan lô / luyện khí đỉnh / phù bút). Phần sinh ngẫu nhiên dùng hạt giống theo kiếp + giới
// nên mỗi lần mở bảng đều giống nhau; người chơi được chèn vào đúng thứ hạng của mình.
import { s } from './state';
import { seeded, hashStr } from '../core/util';
import { SECTS, EMPIRES, LOCS, SECT_TIER, SECT_TOP, EMPIRE_TIER, EMPIRE_GUARD, whereOf, worldPack, CRAFT_LABEL } from '../data/world';
import { CLANS, REALMS, SURN, MALE, FEM, type El } from '../data/core';
import { TIER_N } from '../data/items';
import { craftTitle, XP_K, type CraftK } from './craft';
import { craftProficiency, trainArtisan, type ArtisanCraft } from './craft-proficiency';
import { board, worldOf, worldResidents, recruitPerson, tcPeople } from './tienco';
import { rankedHundred } from './ranking';
import { CELESTIAL, CELESTIAL_CRAFT, celestialTop, celestialOffices, type CelestialId } from '../data/celestial';
import { tbdbOf, TB_KIND_N, type Tbdb } from '../data/tbdb';

// ---------- Thế lực ----------
export type ForceKind = 'sect' | 'empire' | 'clan' | 'celestial';
export interface ForceRow {
  id: string;
  kind: ForceKind;
  name: string;
  /** Cảnh giới cao nhất trong thế lực (lão tổ / hộ quốc). */
  top: number;
  score: number;
  rank: number;
  mine: boolean;
  mineTxt: string;
  where: string;
  els: string[];
  tier: number;
  evil?: boolean;
  /** Dòng phụ ngắn. */
  sub: string;
  /** Mô tả dài. */
  d: string;
}
export const FORCE_KIND_N: Record<ForceKind, string> = { sect: 'Tông môn', empire: 'Hoàng triều', clan: 'Thế gia', celestial: 'Thần giới' };
/** Bảng thế lực của giới hiện tại; `kind` để lấy bảng riêng từng loại (đánh số từ 1). */
export function forceBoard(kind?: ForceKind): ForceRow[] {
  const rows: ForceRow[] = [];
  for (const sc of Object.values(SECTS)) {
    const l = LOCS[sc.loc];
    const top = SECT_TOP[sc.tier];
    rows.push({
      id: 's:' + sc.id, kind: 'sect', name: sc.n, top, score: top * 1000 + sc.tier * 100 + (l?.qi || 1) * 10 + (sc.evil ? 5 : 0), rank: 0,
      mine: s.sect?.id === sc.id, mineTxt: 'tông môn của ngươi', where: l ? whereOf(l) : '', els: sc.el, tier: sc.tier, evil: sc.evil,
      sub: `${SECT_TIER[sc.tier]}${sc.leader ? ' · chủ: ' + sc.leader : ''} · lão tổ ${REALMS[top].n} · ${CRAFT_LABEL[sc.craft]}`, d: `${sc.d} “${sc.motto}”`,
    });
  }
  for (const e of Object.values(EMPIRES)) {
    const l = LOCS[e.capital];
    if (!l) continue;
    const top = EMPIRE_GUARD[e.tier];
    const host = e.vassal ? EMPIRES[e.vassal] : null;
    rows.push({
      id: 'e:' + e.id, kind: 'empire', name: e.n, top, score: top * 1000 + e.tier * 100 + 50 - (e.vassal ? 40 : 0), rank: 0,
      mine: s.flags.court?.id === e.id, mineTxt: 'ngươi làm quan ở đây', where: whereOf(l), els: [], tier: e.tier,
      sub: `${EMPIRE_TIER[e.tier]} · hộ quốc ${REALMS[top].n} · kinh đô ${l.n} · ${e.ruler}${e.patron && SECTS[e.patron] ? ' · hậu thuẫn ' + SECTS[e.patron].n : ''}${host ? ' · thuộc quốc của ' + host.n : ''}`, d: e.d,
    });
  }
  if (worldOf() === 0) {
    for (const k of Object.values(CLANS)) {
      const l = LOCS[k.seat];
      rows.push({
        id: 'c:' + k.id, kind: 'clan', name: k.n, top: k.ancestor, score: k.ancestor * 1000 + 60 + (k.patron ? 10 : 0), rank: 0,
        mine: s.flags.clan === k.id, mineTxt: 'thế gia của ngươi', where: l ? whereOf(l) : '', els: k.el, tier: 1,
        sub: `Thế gia · lão tổ ${REALMS[k.ancestor].n}${l ? ' · ' + l.n : ''} · ${k.patron && SECTS[k.patron] ? 'phụ thuộc ' + SECTS[k.patron].n : 'tự lập'}`, d: k.d,
      });
    }
  }
  // Bốn thần giới: không thuộc giới nào nhưng Thiên Cơ Lâu vẫn xếp vào bảng; người đứng đầu ở trần thực lực của giới
  const w = worldOf();
  const gates = Object.values(LOCS).filter((l) => l.gate);
  (['thiendinh', 'linhson', 'diaphu', 'yeugioi'] as CelestialId[]).forEach((id, i) => {
    const g = gates.find((l) => l.gate === id);
    if (!g) return;
    const R = CELESTIAL[id];
    const top = celestialTop(w);
    const head = celestialOffices(id, w)[0];
    if (!head) return;
    rows.push({ id: 'x:' + id, kind: 'celestial', name: R.n, top, score: top * 1000 + 999 - i, rank: 0, mine: false, mineTxt: '', where: `qua ${g.n}`, els: id === 'thiendinh' ? ['loi'] : id === 'linhson' ? ['quang'] : id === 'diaphu' ? ['am'] : ['moc'], tier: 4,
      sub: `${R.kind} · ${head.title} ${head.name} (${head.realm}) · cổng ở ${LOCS[g.gateHost!]?.n || '?'}`, d: R.intro });
  });
  rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const out = kind ? rows.filter((r) => r.kind === kind) : rows;
  out.forEach((r, i) => (r.rank = i + 1)); // bảng riêng đánh số lại từ 1, không dùng hạng của Thế Lực Bảng
  return out;
}

// ---------- Tên sinh ngẫu nhiên ----------
const pk = <X,>(rnd: () => number, a: readonly X[]) => a[Math.floor(rnd() * a.length)];
const PRE = ['Cửu Thiên', 'Thái Cổ', 'Hỗn Nguyên', 'Vạn Kiếp', 'Chu Thiên', 'Thiên Cương', 'Thái Hư', 'Huyền Thiên', 'Phá Thiên', 'Trấn Hải', 'Tru Tiên', 'Thần Tiêu', 'Vô Lượng', 'Bất Diệt'];
const EL_MID: Record<string, string[]> = {
  kim: ['Kim Quang', 'Canh Kim'], moc: ['Thanh Mộc', 'Kiến Mộc'], thuy: ['Huyền Thủy', 'Nhược Thủy'], hoa: ['Xích Diễm', 'Ly Hỏa'], tho: ['Hậu Thổ', 'Hoàng Nhưỡng'],
  bang: ['Băng Phách', 'Huyền Băng'], loi: ['Tử Lôi', 'Thần Lôi'], phong: ['Cương Phong', 'Thiên Phong'], am: ['U Minh', 'Cửu U'], quang: ['Thánh Huy', 'Lưu Quang'],
};
const ELS = Object.keys(EL_MID) as El[];
const BAO_KIND: [string, string][] = [['kiếm', 'Kiếm'], ['đao', 'Đao'], ['thương', 'Thương'], ['ấn', 'Ấn'], ['chuông', 'Chung'], ['tháp', 'Tháp'], ['gương', 'Kính'], ['châu', 'Châu'], ['giáp', 'Giáp'], ['bào', 'Bào'], ['giới chỉ', 'Giới'], ['linh', 'Linh'], ['cung', 'Cung'], ['phiến', 'Phiến']];
const genName = (rnd: () => number, g: 'm' | 'f') => `${pk(rnd, SURN)} ${pk(rnd, g === 'm' ? MALE : FEM)}`;

// ---------- Pháp bảo ----------
export interface BaoRow {
  detail?: string;
  rank: number;
  name: string;
  /** Giai 0 Phàm … 6 Tiên. */
  grade: number;
  q: number;
  kind: string;
  el: El | null;
  holder: string;
  mine?: boolean;
  score: number;
  note: string;
}
const Q_N = ['Hạ phẩm', 'Trung phẩm', 'Thượng phẩm', 'Cực phẩm'];
/** Pháp Bảo Bảng của giới: danh khí thiên hạ (sinh theo hạt giống) + pháp bảo Thiên giai trở lên người chơi đang mang. */
export function treasureBoard(): BaoRow[] {
  const w = worldOf();
  const rnd = seeded(hashStr(s.id + ':bao:' + w));
  const rows: BaoRow[] = [];
  const holders = board('cg').filter((r) => !r.mine).map((r) => r.name);
  const sects = Object.values(worldPack(w).sects).filter((x) => x.tier >= 3).map((x) => x.n);
  for (const p of tcPeople().filter(p => p.alive && p.world === w)) {
    for (const t of heldTreasures(p)) rows.push({ rank: 0, name: t.name, grade: t.grade, q: 3, kind: 'pháp bảo', el: p.el, holder: p.name,
      score: t.grade * 100 + 60, note: '', detail: [t.role, ...t.functions, t.replica ? 'Uy lực mô phỏng ' + Math.round(t.powerScale * 100) + '%' : 'Bản chính', t.merit ? 'Công đức' : ''].filter(Boolean).join(' · ') });
  }
  const N = 18;
  for (let i = 0; i < N; i++) {
    const r = rnd();
    const grade = Math.min(worldTreasureCap(w), (r < 0.15 ? 6 : r < 0.5 ? 5 : 4) + Math.min(1, Math.floor(w / 2)));
    const q = Math.min(3, Math.floor(rnd() * 3) + (grade >= 6 ? 1 : 0));
    const el = rnd() < 0.85 ? pk(rnd, ELS) : null;
    const [kind, kn] = pk(rnd, BAO_KIND);
    const name = `${pk(rnd, PRE)} ${el ? pk(rnd, EL_MID[el]) : 'Vô Tướng'} ${kn}`;
    const holder = rnd() < 0.7 && holders.length ? holders[i % holders.length] : `Tàng bảo các ${pk(rnd, sects.length ? sects : ['Tán tu'])}`;
    rows.push({ rank: 0, name, grade, q, kind, el, holder, score: grade * 100 + q * 20 + rnd() * 10, note: '' });
  }
  for (const g of s.gear) {
    if (!g) continue;
    limitGear(g, w);
    if (g.g < 4) continue;
    rows.push({ rank: 0, name: g.n, grade: g.g, q: g.q ?? 1, kind: BAO_KIND.find(([, kn]) => g.n.endsWith(kn))?.[0] || 'pháp bảo', el: g.el, holder: s.name, mine: true, score: g.g * 100 + (g.q ?? 1) * 20 + (g.grow ? 60 : 0) + g.lv * 2, note: '' });
  }
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => { r.rank = i + 1; r.note = `${TIER_N[r.grade]} · ${Q_N[r.q]} · ${r.kind} · ${r.mine ? 'trong tay ngươi' : 'trong tay ' + r.holder}${r.detail ? ' · ' + r.detail : ''}`; });
  return rows;
}

// ---------- Danh sư ----------
export interface MasterRow {
  proficiency: number;
  daoHao?: string;
  id?: string;
  beast?: string;
  race?: string;
  rank: number;
  name: string;
  g: 'm' | 'f';
  lv: number;
  sect: string;
  mine?: boolean;
  /** Danh sư thần giới: thứ tự tay nghề giữa người thần giới với nhau (cao hơn đứng trước). */
  cel?: number;
  note: string;
}
export const MASTER_N: Record<CraftK, string> = { alch: 'luyện đan sư', forge: 'luyện khí sư', talis: 'phù sư' };
/** Bảng danh sư một nghề trong giới: cao thủ sinh theo hạt giống + người chơi nếu đã nhập môn. */
export function masterBoard(k: CraftK): MasterRow[] {
  const w = worldOf();
  const rows: MasterRow[] = [];
  for (const { person: p, npc: n } of worldResidents(w)) {
    const craft = n?.craft ?? p?.craft;
    if (craft?.kind !== k || craft.lv < 1) continue;
    const proficiency = trainArtisan(craft, s.year, n?.talent ?? p?.talent ?? 1);
    rows.push({ id: p?.id ?? 'npc:' + n!.id, rank: 0, name: n?.name ?? p!.name, g: n?.g ?? p!.g, lv: craft.lv, proficiency,
      sect: (n?.sect ? SECTS[n.sect]?.n ?? n.sect : p?.sect) ?? 'Tán tu',
      beast: n?.beast ?? p?.beast, race: n?.race ?? p?.races?.join(' · ') ?? p?.race, note: '' });
  }
  // danh sư của bốn thần giới trong giới này (Thái Thượng Lão Quân luyện đan…)
  for (const id of Object.keys(CELESTIAL) as CelestialId[]) {
    for (const o of celestialOffices(id, w)) {
      const lv = CELESTIAL_CRAFT[o.title]?.find(([c]) => c === k)?.[1];
      if (!lv) continue;
      const key = `${w}:${id}:${o.title}:${k}`;
      const records: Record<string, ArtisanCraft> = (s.flags.celestialCraft ||= {});
      const skill = records[key] ||= { kind: k, lv: 8, xp: (lv ?? 0) * 1000, trainedAt: s.year };
      const proficiency = trainArtisan(skill, s.year, (lv ?? 1) / 2);
      if (!rows.some(r => r.name === o.name)) rows.push({ id: `cel:${id}:${o.title}`, rank: 0, name: o.name, daoHao: o.daoHao, g: o.f ? 'f' : 'm', lv: 8, proficiency, cel: lv, sect: `${CELESTIAL[id].n} · ${o.title}`, race: id === 'yeugioi' ? 'Yêu tộc' : undefined, note: '' });
    }
  }
  const my = s.craft[k];
  if (my >= 1) rows.push({ id: 'me', rank: 0, name: s.name, g: s.g, lv: my, proficiency: craftProficiency(my, s.craft[XP_K[k]]), sect: s.sect && SECTS[s.sect.id] ? SECTS[s.sect.id].n : 'Tán tu', mine: true, beast: s.beast, race: s.race, note: '' });
  const ranked = rankedHundred<MasterRow>(rows, () => {
    const p = recruitPerson(w);
    const rnd = seeded(hashStr(p.id + ':craft:' + k));
    const lv = 1 + Math.floor(rnd() * 7);
    p.craft = { kind: k, lv, xp: Math.floor(rnd() * 30), trainedAt: s.year };
    return { id: p.id, rank: 0, name: p.name, g: p.g, lv, proficiency: craftProficiency(lv, p.craft.xp), sect: p.sect, beast: p.beast, race: p.race, note: '' };
  }, (a, b) => b.proficiency - a.proficiency || (a.id ?? a.name).localeCompare(b.id ?? b.name));
  ranked.forEach((r) => { r.note = [craftTitle(r.lv, k), `Thuần thục: ${Math.floor(r.proficiency).toLocaleString('vi-VN')}`, r.sect, r.daoHao ? `Đạo hiệu: ${r.daoHao}` : '', r.beast ? `Yêu tu · ${r.beast}` : '', r.race].filter(Boolean).join(' · '); });
  return ranked;
}

// ---------- Pháp khí luyện chế ----------
export const TOOL_N: Record<CraftK, string> = { alch: 'đan lô', forge: 'luyện khí đỉnh', talis: 'phù bút' };
const TOOL_SUFFIX: Record<CraftK, string[]> = { alch: ['Đan Lô', 'Thần Lô', 'Bảo Lô'], forge: ['Đỉnh', 'Thần Đỉnh', 'Luyện Khí Đỉnh'], talis: ['Phù Bút', 'Linh Bút', 'Thần Bút'] };
/** Bảng pháp khí luyện chế một nghề: pháp khí càng cao càng về tay danh sư xếp trên. */
export function toolBoard(k: CraftK): BaoRow[] {
  const w = worldOf();
  const rnd = seeded(hashStr(s.id + ':khi:' + k + ':' + w));
  const masters = masterBoard(k).filter((r) => !r.mine);
  const rows: BaoRow[] = [];
  const N = 10;
  for (let i = 0; i < N; i++) {
    const grade = Math.min(worldTreasureCap(w), Math.max(3, Math.round(6 - i * 0.35 + rnd() * 0.8)));
    const q = Math.min(3, Math.max(0, Math.round(3 - i * 0.3 + rnd() * 0.8)));
    const el = pk(rnd, ELS);
    const name = `${pk(rnd, PRE)} ${pk(rnd, EL_MID[el])} ${pk(rnd, TOOL_SUFFIX[k])}`;
    const m = masters[i];
    rows.push({ rank: 0, name, grade, q, kind: TOOL_N[k], el, holder: m ? m.name : 'không rõ', score: grade * 100 + q * 20 - i, note: '' });
  }
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => { r.rank = i + 1; r.note = `${TIER_N[r.grade]} · ${Q_N[r.q]} · trong tay ${r.holder}`; });
  return rows;
}

// ---------- Thiên tài địa bảo ----------
export interface TbRow extends Tbdb { rank: number; where: string; left: number; note: string }
/** Thiên Tài Địa Bảo Bảng của giới hiện tại: chỉ những thứ giới này sinh ra được (theo trần sức mạnh), xếp theo cảnh giới cần đạt. */
export function tbdbBoard(): TbRow[] {
  const w = worldOf();
  const rnd = seeded(hashStr(s.id + ':tbdb:' + w));
  const wilds = Object.values(LOCS).filter((l) => (l.type === 'wild' || l.type === 'realm') && !l.gate);
  return tbdbOf(w).slice().sort((a, b) => b.realm - a.realm || a.n.localeCompare(b.n)).map((x, i) => {
    const l = wilds.length ? wilds[Math.floor(rnd() * wilds.length)] : null;
    const left = 1 + Math.floor(rnd() * (x.realm >= celestialTop(w) ? 2 : 7));
    return { ...x, rank: i + 1, where: l ? l.n : 'không rõ', left, note: `${TB_KIND_N[x.kind]} · cần ${REALMS[x.realm].n} mới dùng nổi · ${l ? 'tương truyền mọc ở ' + l.n : 'nơi sinh trưởng không rõ'} · Thiên Cơ Lâu biết còn ${left}` };
  });
}
