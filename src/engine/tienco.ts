// Thiên Cơ Lâu — tổ chức tình báo trải khắp các giới, không thuộc tông môn hay hoàng triều nào.
// Mỗi giới một phân lâu, mỗi phân lâu giữ hai bảng: Thiên Kiêu Bảng (người trẻ theo tuổi thân thể) và Cường Giả Bảng
// (kẻ mạnh nhất giới). Bảng chỉ ghi người đang ở trong giới ấy: phi thăng là tên bị gạch khỏi bảng hạ giới.
//
// Luật phi thăng (dùng chung cho người chơi lẫn nhân vật trên bảng): thân thể về MỘT tuổi, tâm trí giữ nguyên,
// tuổi linh hồn chỉ tăng, thọ nguyên tính lại từ đầu nên cộng dồn qua các giới. Vì thế các thế lực hàng đầu Hỗn Độn
// trả đại giá đưa trẻ sơ sinh về Thương Lan tu hành lại từ những bước chân đầu tiên: sống lâu hơn, dễ thành cường giả hơn. Nhiều người cùng giáng lâm,
// nhưng gặp được họ ở Thương Lan hay không là chuyện ngẫu nhiên. Ngô Thu Phương là suất của Ngô gia Hỗn Độn.
import { maintainLegacyHolders } from './legacy-holders';
import { s, type NPC } from './state';
import { rankedHundred } from './ranking';
import { rankingPower, compareRankPower } from './ranking-power';
import { trainArtisan, type ArtisanCraft } from './craft-proficiency';
import { ensureWorldNames } from './names';
import { doctrineAccepts, doctrineWeight } from './sect-doctrine';
import { beastEvolution, type BeastEvolution } from './beast-evolution';
import { REALMS, STAGES, WORLD_CAP, WORLDS, LAST_WORLD, npcCap, worldLife, BREAK_BASE, SURN, MALE, FEM, DAO_HAO, DAO_HAO_F, DAO_HOLDER, DAI_DAO, CLANS, ORIGINS, type El, ALL_EL, holySur, splitName } from '../data/core';
import { worldPack, daoTitle, SECTS, EMPIRES, LOCS, beastDescendants } from '../data/world';
import { age, soulAge } from './char';
import { addLog, mark } from './core';
import { slots } from './slots';
import { seeded, hashStr, uid } from '../core/util';
import { HEROINE } from '../data/heroine';
import { FENGSHEN_ROSTER } from '../data/fengshen';
import { CELESTIAL, celestialOffices, type CelestialId } from '../data/celestial';

export interface TcPerson {
  legacyRole?: string;
  legacyWorld?: number;
  treasures?: string[];
  evolution?: BeastEvolution;
  craft?: ArtisanCraft;
  id: string;
  name: string;
  g: 'm' | 'f';
  /** Giới đang ở (0 Thương Lan … 5 Hỗn Độn). */
  world: number;
  /** Năm sinh của thân thể hiện tại — đặt lại mỗi lần phi thăng. */
  born: number;
  /** Năm sinh linh hồn — không bao giờ đổi. */
  soulBorn: number;
  r: number;
  st: number;
  /** Tiến độ tiểu cảnh 0..1. */
  p: number;
  talent: number;
  el: El;
  /** Tên thế lực tại Thương Lan: tông môn, thánh địa, hoàng triều hoặc gia tộc. */
  sect: string;
  /** Lai lịch ngắn. */
  from: string;
  /** Thế lực Hỗn Độn đã đưa người này về Thương Lan từ trong nôi (hồi hạ giả). */
  ret?: string;
  /** Gia tộc tại Thương Lan nếu có cùng họ. */
  clan?: string;
  /** Địa điểm hồi hạ tại Thương Lan. */
  loc?: string;
  /** Lai lịch đã được Thiên Cơ Lâu tiết lộ cho người chơi. */
  known?: boolean;
  /** Số lần phi thăng. */
  asc: number;
  alive: boolean;
  luck?: number;
  died?: number;
  cause?: string;
  /** NPC trong nhân mạch nếu đã gặp (cùng giới). */
  npc?: string;
  /** Kẻ giữ Đại Đạo (không tu tiếp, không chết già). */
  lord?: boolean;
  /** Yêu tu: loài yêu thú gốc, đã hóa hình người nên vẫn lên Thiên Kiêu / Cường Giả Bảng. */
  beast?: string;
  /** Chủng tộc thần thoại có hình thể gần nhân tộc, cùng tu luyện như yêu tu. */
  race?: string;
  /** Thủ lĩnh có thể đại diện cho nhiều tộc liên minh. */
  races?: string[];
  /** Nhân vật thần thoại cố định, không bị vòng đời NPC tác động. */
  chief?: boolean;
  /** Người có tên định sẵn trong Phong Thần Bảng, được sinh riêng cho bảng: không già chết trước khi Lượng Kiếp khép lại. */
  fengshen?: boolean;
  /** Chỉ số thần vị trong FENGSHEN_ROSTER (cả thủ lĩnh thần thoại có tên trên bảng). Tra theo chỉ số vì bảng có người trùng tên. */
  fsi?: number;
  /** Đặc trưng yêu thú còn giữ lại sau khi hóa hình (long giác ngắn, tai hồ ly…) hoặc hóa hình giống hệt người. */
  form?: string;
  /** Huyết mạch: hậu duệ dị thú Sơn Hải Kinh, huyết mạch không thuần của thần thú, hoặc loài thường mang huyết mạch thần thú phản tổ. */
  blood?: string;
  heroine?: boolean;
  bio?: NPC['bio'];
  pic?: string;
  home?: string;
}
interface TcState { v: 1; people: TcPerson[]; rank: { tk: number; cg: number }; y: number; meteorYear?: number; bought?: Record<number, boolean>; beastMig?: 1 | 2; beastAgeMig?: 1; raceMig?: 1; chiefMig?: 1; celMig?: 1; recruitDiversity?: 1 }

export interface TcRow {
  power?: number;
  celestialTier?: number;
  daoHao?: string;
  id: string;
  name: string;
  g: 'm' | 'f';
  r: number;
  st: number;
  age: number;
  soul: number;
  note: string;
  mine?: boolean;
  npc?: NPC;
  person?: TcPerson;
  /** Thế lực hiển thị khi không có person/npc (vd. chức vụ thần giới). */
  force?: string;
  /** Chức vụ trong thế lực (tông môn / hoàng triều / thần giới / tộc). */
  role?: string;
  rank: number;
}

/** Tuổi thân thể tối đa để còn được gọi là thiên kiêu, theo giới. Yêu tu thọ mệnh gấp 4 lần nhân tộc nên giới hạn tuổi là 400 (ở Thương Lan). */
export const TK_AGE = [100, 400, 1500, 5000, 15000, 50000];
export const tkAgeMax = (w: number, isBeast = false) => TK_AGE[w] * (isBeast ? 4 : 1);
const N_TK = 14, N_CG = 14;
/** Các đại tộc Hỗn Độn (ngoài thánh địa) có thể đưa trẻ về Thương Lan. */
const HD_CLANS: [string, string][] = [['Diệp gia Hỗn Độn', 'Diệp'], ['Khương gia Hỗn Độn', 'Khương'], ['Cơ gia Hỗn Độn', 'Cơ'], ['Hiên Viên thị', 'Hiên Viên'], ['Ngô gia Hỗn Độn', 'Ngô']];

export const tc = (): TcState => {
  const T: TcState = (s.flags.tienco ||= gen());
  if (T.beastMig !== 2) { migrateBeasts(T, !T.beastMig); T.beastMig = 2; } // bản lưu cũ: thêm yêu tu / đổi sang huyết mạch Sơn Hải Kinh & thần thú
  if (!T.beastAgeMig) { migrateBeastAgesAndRealms(T); T.beastAgeMig = 1; }
  if (!T.raceMig) { migrateRaces(T); T.raceMig = 1; }
  if (!T.chiefMig) { addHonghuangChiefs(T); T.chiefMig = 1; }
  if (!s.flags.tcDoctrineMigrated) { addHonghuangChiefs(T); s.flags.tcDoctrineMigrated = true; }
  if (!T.celMig) { addCelestialYouth(T.people, s.year); T.celMig = 1; } // bản lưu cũ: thiên kiêu của bốn thần giới
  if (!T.recruitDiversity) {
    // Repair ordinary recruits from saves made before recruitment included other species.
    for (const p of T.people) {
      if (p.npc || p.ret || p.chief || p.lord || p.fengshen || p.heroine || p.beast || p.race || p.races?.length) continue;
      if (p.from === `Đệ tử ${p.sect}`) diversifyRecruit(p, seeded(hashStr(p.id + ':diversity')));
    }
    T.recruitDiversity = 1;
  }
  T.meteorYear ??= s.born;
  if (!T.people.some((p) => p.heroine)) T.people.push(makeHeroine(seeded(hashStr(s.id + ':ngo-thu-phuong')), s.year));
  if (s.g === 'f' && !T.people.some((p) => p.ret === 'Diệp gia Hỗn Độn' && p.g === 'm')) T.people.push(makeYeLead(s.year));
  for (const p of T.people) {
    fitDoctrine(p);
    const linkedCraft = p.npc ? s.npcs.find(n => n.id === p.npc) : undefined;
    if (p.alive && linkedCraft?.alive !== false) {
      const craft = linkedCraft?.craft ?? p.craft;
      if (craft) { trainArtisan(craft, s.year, linkedCraft?.talent ?? p.talent); p.craft = craft; }
    }
    if (p.world === LAST_WORLD && Object.values(CELESTIAL).some(realm => realm.n === p.sect)) {
      p.from = `Tán tu Hỗn Độn, xuất thân ${p.sect} ở hạ giới`;
      p.sect = 'Tán tu';
    }
    repairBeastSpecies(p);
    evolvePerson(p);
    if (p.known && !T.bought?.[p.world]) p.known = false;
    if (p.ret) {
      p.soulBorn = s.born;
      if (p.asc === 0) {
        p.born = s.born;
        const n = p.npc ? s.npcs.find((x) => x.id === p.npc) : undefined;
        if (n) n.born = s.born;
      }
    }
    if (!p.ret || p.world !== 0 || p.asc > 0) continue;
    const home = returnerHome(seeded(hashStr(s.id + ':hoiha:' + p.id)), p.name);
    p.loc = home.loc;
    p.clan = home.clan;
    p.sect = home.sect;
  }
  while (T.people.filter((p) => p.ret).length < 5) {
    const rnd = seeded(hashStr(s.id + ':hoiha-fallback:' + T.people.length));
    const g = rnd() < 0.5 ? 'm' : 'f';
    const name = genName(rnd, g);
    const home = returnerHome(rnd, name);
    const born = s.born;
    const a = Math.max(1, s.year - born);
    const talent = 1.7 + rnd() * 0.7;
    const grown = a > 6 ? realmAfter(a - 6, talent, npcCap(0)) : { r: 0, st: 0, p: 0 };
    const sources = [...sectsOf(LAST_WORLD).filter((x) => x.tier === 4).map((x) => x.n), ...HD_CLANS.map(([n]) => n)];
    const available = sources.filter((source) => !T.people.some((p) => p.ret === source));
    const source = available[Math.floor(rnd() * available.length)] ?? 'Thế lực Hỗn Độn vô danh';
    T.people.push({ id: uid(), name, g, world: 0, born, soulBorn: born, ...grown, talent, el: ALL_EL[Math.floor(rnd() * ALL_EL.length)], ...home, from: `Được ${source} đưa về Thương Lan từ trong nôi — hồi hạ giả vô danh`, ret: source, asc: 0, alive: true });
  }
  const lead = T.people.find((p) => p.ret === 'Diệp gia Hỗn Độn' && p.g === 'm' && p.npc);
  if (lead?.npc) s.flags.mainLeadId = lead.npc;
  const linked = new Set(T.people.map(p => p.npc));
  for (const n of s.npcs) {
    if (!n.alive || linked.has(n.id)) continue;
    const evolved = beastEvolution(n.beast, worldOf(), n.r, n.st, n.evolution);
    if (evolved) Object.assign(n, evolved);
  }
  const playerEvolution = beastEvolution(s.beast, worldOf(), s.r, s.st, s.flags.beastEvolution);
  if (playerEvolution) {
    s.beast = playerEvolution.beast;
    s.flags.beastEvolution = playerEvolution.evolution;
    s.flags.beastBlood = playerEvolution.blood;
  }
  if (!s.flags.tcRecruitAgeFixed) {
    for (const p of T.people) {
      if (p.asc || p.ret || p.heroine || p.chief || p.lord || p.fengshen) continue;
      const minimum = 10 + cultivationYears(p.r, p.st, p.talent);
      if (s.year - p.born >= minimum) continue;
      p.born = s.year - Math.ceil(minimum);
      p.soulBorn = Math.min(p.soulBorn, p.born);
      const n = p.npc ? s.npcs.find(n => n.id === p.npc) : undefined;
      if (n) n.born = p.born;
    }
    s.flags.tcRecruitAgeFixed = true;
  }
  maintainLegacyHolders(T.people);
  ensureWorldNames(T.people);
  return T;
};
export const tcPeople = () => tc().people;
export const retPeople = () => tcPeople().filter((p) => p.ret);
export const personOf = (id: string) => tcPeople().find((p) => p.id === id);
export const realmTxt = (r: number, st: number) => (r === 0 ? 'Phàm nhân' : r >= DAI_DAO ? REALMS[DAI_DAO].n : `${REALMS[r].n} ${STAGES[st]}`);
export const worldOf = () => s.world ?? 0;

/** All living residents, including unmet people and linked/unlinked acquaintances, exactly once. */
export function worldResidents(w = worldOf()): { person?: TcPerson; npc?: NPC }[] {
  const people = tcPeople();
  const linked = new Set(people.flatMap(p => p.npc ? [p.npc] : []));
  const npcs = new Map(s.npcs.map(n => [n.id, n]));
  const residents: { person?: TcPerson; npc?: NPC }[] = [];
  for (const person of people) {
    if (!person.alive || person.world !== w) continue;
    const npc = person.npc ? npcs.get(person.npc) : undefined;
    if (npc && !npc.alive) continue;
    residents.push({ person, npc });
  }
  if (w === worldOf()) for (const npc of s.npcs) {
    if (npc.alive && !linked.has(npc.id)) residents.push({ npc });
  }
  return residents;
}

// ---------- Sinh bảng ----------
/** Cảnh giới một tu sĩ đạt được sau `years` năm tu từ Luyện Khí với tư chất `talent`, trần `cap` (kỳ vọng, có hao hụt vì đột phá thất bại). */
export function realmAfter(years: number, talent: number, cap: number): { r: number; st: number; p: number } {
  let r = 1, st = 0, left = years;
  for (;;) {
    const per = (REALMS[r].turn * 12) / Math.max(0.2, talent) * (st === 3 ? 1 + (1 - (BREAK_BASE[r + 1] ?? 0.1)) * 1.5 : 1);
    if (left < per) return { r, st, p: left / per };
    left -= per;
    if (st < 3) st++;
    else if (r < cap) { r++; st = 0; }
    else return { r, st, p: 1 };
  }
}
function makeYeLead(year: number): TcPerson {
  const rnd = seeded(hashStr(s.id + ':diep-nam-chinh'));
  const born = s.born;
  const a = Math.max(1, year - born);
  const talent = 2 + rnd() * 0.4;
  const grown = a > 6 ? realmAfter(a - 6, talent, npcCap(0)) : { r: 0, st: 0, p: 0 };
  const name = genName(rnd, 'm', 'Diệp');
  const { sect, clan, loc } = returnerHome(rnd, name);
  return {
    id: uid(), name, g: 'm', world: 0, born, soulBorn: born, ...grown,
    talent, el: ALL_EL[Math.floor(rnd() * ALL_EL.length)], sect, clan, loc, from: 'Được Diệp gia Hỗn Độn đưa về Thương Lan từ trong nôi — nam chính hồi hạ giả',
    ret: 'Diệp gia Hỗn Độn', asc: 0, alive: true,
  };
}
function genName(rnd: () => number, g: 'm' | 'f', sur?: string) {
  const pk = <X,>(a: readonly X[]) => a[Math.floor(rnd() * a.length)];
  return `${sur || pk(SURN)} ${pk(g === 'm' ? MALE : FEM)}`;
}
// ---------- Yêu tu hóa hình ----------
const pkAny = <X,>(rnd: () => number, a: readonly X[]) => a[Math.floor(rnd() * a.length)];
/** Họ của yêu tu lấy theo loài. */
const BEAST_SUR: [RegExp, string][] = [[/Long|Giao/, 'Long'], [/Hồ(?= |$)/, 'Hồ'], [/Lang/, 'Lang'], [/Hổ(?= |$)/, 'Hổ'], [/Sư(?= |$)/, 'Sư'], [/Xà|Mãng/, 'Xà'], [/Phượng|Hoàng/, 'Phượng'], [/Quy/, 'Quy'], [/Viên|Hầu/, 'Viên'], [/Điêu|Ưng|Điểu|Ô(?= |$)/, 'Vũ'], [/Bằng/, 'Bằng'], [/Loan/, 'Loan'], [/Thao Thiết/, 'Thao'], [/Huyền Vũ/, 'Quy'], [/Hạc/, 'Hạc'], [/Ngưu|Tê(?= |$)/, 'Ngưu'], [/Lộc/, 'Lộc'], [/Kình/, 'Kình'], [/Hùng/, 'Hùng'], [/Trư(?= |$)/, 'Trư'], [/Lân/, 'Lân'], [/Thụ|Mộc/, 'Mộc'], [/Trùng|Công|Hạt/, 'Trùng'], [/Báo/, 'Báo'], [/Quỷ|Thi|Xoa/, 'Quỷ'], [/Lân/, 'Lân'], [/Ngư|Kình/, 'Ngư']];
/** Đặc trưng còn giữ sau khi hóa hình, theo loài. */
const BEAST_FORM: [RegExp, string[]][] = [
  [/Long|Giao/, ['giữ lại đôi long giác ngắn trên trán', 'thái dương còn hai mẩu sừng rồng nhỏ, sau tai ẩn vảy']],
  [/Hồ(?= |$)/, ['giữ lại đôi tai hồ ly', 'sau lưng còn cái đuôi lông dày', 'đuôi hồ ly chỉ hiện ra khi động nộ']],
  [/Lang|Hổ(?= |$)|Sư(?= |$)|Báo/, ['đồng tử dọc như thú', 'răng nanh hơi dài, móng tay sắc']],
  [/Xà|Mãng/, ['da cổ còn một mảng vảy nhỏ', 'lưỡi chẻ đôi khi nói nhanh']],
  [/Phượng|Hạc|Điêu|Ưng|Điểu|Ô(?= |$)|Hoàng|Loan/, ['sau lưng ẩn hiện lông vũ', 'trong tóc có vài sợi lông vũ không rụng']],
  [/Lân/, ['cổ tay ẩn vảy kỳ lân', 'trán có một chiếc sừng ngọc nhỏ']],
  [/Bằng/, ['vận công thì sau lưng ẩn hiện đôi cánh che trời']],
  [/Thao Thiết/, ['ăn bao nhiêu cũng không no, mắt lộ tham quang']],
  [/Quy|Huyền Vũ/, ['lưng khoác lớp giáp vân như mai rùa']],
  [/Ngưu|Tê(?= |$)/, ['trán còn một chiếc sừng ngắn']],
  [/Lộc/, ['trên đầu còn cặp gạc non']],
  [/Hùng|Trư(?= |$)/, ['vóc người to lớn khác thường']],
  [/Thụ|Mộc/, ['tóc xanh như lá, da có vân gỗ']],
];
const HUMAN_FORM = ['hóa hình giống hệt người thường, không ai nhận ra', 'hóa hình hoàn hảo, chỉ lộ nguyên hình khi trọng thương'];
const beastSur = (n: string) => BEAST_SUR.find(([re]) => re.test(n))?.[1] || n.split(' ')[0] || 'Yêu'; // không khớp loài nào: lấy chữ đầu tên loài làm họ
function beastForm(n: string, rnd: () => number) {
  if (rnd() < 0.3) return pkAny(rnd, HUMAN_FORM);
  const f = BEAST_FORM.find(([re]) => re.test(n));
  return f ? pkAny(rnd, f[1]) : pkAny(rnd, HUMAN_FORM);
}
/** Thần thú thượng cổ: yêu tu trẻ lên bảng thường mang huyết mạch không thuần của chúng. */
const DIVINE: [string, El][] = [['Tổ Long', 'thuy'], ['Chân Phượng', 'hoa'], ['Thủy Kỳ Lân', 'thuy'], ['Cửu Vĩ Hồ', 'am'], ['Huyền Vũ', 'bang'], ['Bạch Hổ', 'kim'], ['Kim Ô', 'quang'], ['Thao Thiết', 'tho'], ['Côn Bằng', 'phong'], ['Thanh Loan', 'moc']];
export const MYTHIC_RACES = ORIGINS.filter((origin) => origin.race && !origin.beastOrigin).map((origin) => ({ n: origin.race!, d: origin.d }));
const MYTHIC_RACE_RATE = 0.06;
const BLOOD_N = ['thuần huyết', 'huyết mạch đậm', 'huyết mạch loãng'];
const DILUTE = ['một phần tư', 'một phần tám', 'một phần mười sáu', 'một phần ba mươi hai'];
function descendantSpecies(ancestor: string, rnd: () => number) {
  const species = ancestor === 'Tổ Long'
    ? [{ n: 'Hải Giao', el: 'thuy' as El }, { n: 'Lôi Giao', el: 'loi' as El }]
    : beastDescendants(ancestor);
  return species.length ? pkAny(rnd, species) : undefined;
}
/** Time budget matching realmAfter, used to repair recruits previously assigned arbitrary realms. */
export function cultivationYears(r: number, st: number, talent: number): number {
  let years = 0;
  for (let realm = 1; realm <= r; realm++) {
    const stages = realm === r ? st : 4;
    for (let stage = 0; stage < stages; stage++) years += (REALMS[realm].turn * 12) / Math.max(0.2, talent)
      * (stage === 3 ? 1 + (1 - (BREAK_BASE[realm + 1] ?? 0.1)) * 1.5 : 1);
  }
  return years;
}
/** Old saves used the ancestor as the species even for explicitly diluted bloodlines. */
function repairBeastSpecies(p: TcPerson) {
  if (!p.beast || !p.blood || p.evolution || p.chief || p.lord || p.fengshen) return;
  const ancestor = p.beast;
  if (!p.blood.includes(`không thuần của ${ancestor}`) && !(p.blood.startsWith('hậu duệ') && p.blood.includes(`của ${ancestor} trong Sơn Hải Kinh`))) return;
  const rnd = seeded(hashStr(p.id + ':species'));
  const descendants = worldPack(p.world).beasts.filter(b => b.anc === ancestor && b.n.split(' · ')[0] !== ancestor && !b.codexOnly);
  const species = p.blood.startsWith('hậu duệ') && descendants.length ? pkAny(rnd, descendants) : descendantSpecies(ancestor, rnd);
  if (!species) return;
  p.beast = species.n.split(' · ')[0]; p.el = species.el; p.form = beastForm(p.beast, rnd);
  const npc = p.npc ? s.npcs.find(n => n.id === p.npc) : undefined;
  if (npc) { npc.beast = p.beast; npc.el = p.el; }
}
function evolvePerson(p: TcPerson) {
  const n = p.npc ? s.npcs.find(n => n.id === p.npc) : undefined;
  if (!p.alive || n?.alive === false) return;
  const evolved = beastEvolution(p.beast, p.world, n?.r ?? p.r, n?.st ?? p.st, p.evolution);
  if (!evolved) return;
  Object.assign(p, evolved);
  p.form = beastForm(p.beast!, seeded(hashStr(p.id + ':evolution:' + evolved.evolution.milestone)));
  if (n) Object.assign(n, evolved);
}
/**
 * Biến một người trên bảng thành yêu tu hóa hình. Loài thường không đủ tư chất lên bảng, nên huyết mạch chỉ có ba nguồn:
 * hậu duệ dị thú Sơn Hải Kinh (60%), huyết mạch không thuần của thần thú (30%), hoặc loài thường mang huyết mạch thần thú phản tổ (10%).
 */
function beastify(p: TcPerson, rnd: () => number, w: number, includeCommon = false) {
  const all = worldPack(w).beasts;
  const shj = all.filter((b) => b.anc && !b.codexOnly); // hậu duệ dị thú Sơn Hải Kinh (có mức huyết mạch)
  const common = all.filter((b) => !b.home && !b.anc && !b.codexOnly);
  const roll = rnd();
  if (includeCommon && roll < 0.3 && common.length) {
    const b = pkAny(rnd, common);
    p.beast = b.n.split(' · ')[0]; p.el = b.el; p.form = beastForm(p.beast, rnd);
    p.blood = `Yêu thú ${p.beast} tu luyện thành đạo`;
    p.name = genName(rnd, p.g, beastSur(p.beast));
  } else if (roll < 0.6 && shj.length) {
    const b = pkAny(rnd, shj);
    const n = b.anc!;
    p.beast = b.n.split(' · ')[0]; p.el = b.el; p.form = beastForm(p.beast, rnd);
    p.blood = `hậu duệ ${BLOOD_N[b.blood ?? 2]} của ${n} trong Sơn Hải Kinh`;
    p.name = genName(rnd, p.g, beastSur(n));
  } else if (roll < 0.9 || !common.length) {
    const [n, el] = pkAny(rnd, DIVINE);
    const species = descendantSpecies(n, rnd);
    p.beast = species?.n ?? n; p.el = species?.el ?? el; p.form = beastForm(p.beast, rnd);
    p.blood = `mang huyết mạch không thuần của ${n} (${pkAny(rnd, DILUTE)})`;
    p.name = genName(rnd, p.g, beastSur(n));
  } else {
    const b = pkAny(rnd, common);
    const [dn, del] = pkAny(rnd, DIVINE);
    const n = b.n.split(' · ')[0];
    p.beast = n; p.el = del; p.form = beastForm(dn, rnd);
    p.blood = `${n} mang huyết mạch thần thú phản tổ: ${dn}`;
    p.name = genName(rnd, p.g, beastSur(n));
  }
  beastHome(p);
}
/** Long Cung chỉ nhận đúng thủy tộc: Hải Long Cung nhận hải tộc (biển), Long Cung sông nhận thủy tộc giang / hà. */
export const SEA_TRIBE = ['Giao Long', 'Hải Giao', 'Lôi Giao', 'Kình Ngư', 'Hải Xà', 'Lăng Ngư', 'Hải Quy', 'Bạng Tinh', 'Sa Ngư', 'Hà Binh', 'Giải Tướng'];
export const RIVER_TRIBE = ['Lý Ngư', 'Thủy Xà', 'Ngoan', 'Ngạc', 'Thủy Quy', 'Văn Diêu Ngư', 'Thủy Hầu', 'Giang Giao'];
/** Người trên bảng thuộc Long Cung mà không đúng thủy tộc (người thường, phượng, hổ…) → đổi thành thủy tộc hợp với Long Cung ấy. */
function fitTribe(p: TcPerson, w: number) {
  if (p.npc || p.lord || p.ret || p.evolution) return;
  const sc = Object.values(worldPack(w).sects).find((x) => x.n === p.sect);
  if (!sc?.tribe) return;
  const pool = sc.tribe === 'hai' ? SEA_TRIBE : RIVER_TRIBE;
  if (p.beast && pool.includes(p.beast)) return;
  const rnd = seeded(hashStr(p.id + ':tribe'));
  const n = pool[Math.floor(rnd() * pool.length)];
  p.beast = n; p.el = 'thuy'; p.form = beastForm(n, rnd);
  p.blood = sc.tribe === 'hai' ? 'hải tộc dưới trướng Long Cung' : 'thủy tộc sông hồ dưới trướng Long Cung';
  delete p.race; delete p.races;
  p.name = genName(rnd, p.g, beastSur(n));
}
/** Yêu tu không thể thuộc hoàng thất loài người: ai rơi vào suất hoàng thất là Thái tử / Công chúa / Tộc trưởng của chính loài mình. */
function beastHome(p: TcPerson) {
  if (!p.beast || !p.sect.startsWith('Hoàng thất')) return;
  const tribe = `${p.beast} tộc`;
  p.from = /^(Lão tổ|Trấn giữ|Thái thượng)/.test(p.from) ? `Tộc trưởng ${tribe}` : `${p.g === 'f' ? 'Công chúa' : 'Thái tử'} ${tribe}`;
  p.sect = tribe;
}
const BEAST_RATE = 0.18;
function diversifyRecruit(p: TcPerson, rnd: () => number) {
  if (rnd() < BEAST_RATE) beastify(p, rnd, p.world, true);
  else if (rnd() < MYTHIC_RACE_RATE && MYTHIC_RACES.length) p.race = pkAny(rnd, MYTHIC_RACES).n;
  fitTribe(p, p.world);
  beastHome(p);
  fitDoctrine(p);
}
/** Preserve named mythological figures and their exceptional origins; repair generated affiliations. */
function fitDoctrine(p: TcPerson) {
  if (p.legacyRole || p.chief || p.fengshen || p.lord || p.ret || p.heroine || doctrineAccepts(p)) return;
  const former = p.sect;
  p.sect = 'Tán tu';
  p.from = 'Tán tu không rõ sư thừa';
  const n = p.npc ? s.npcs.find(n => n.id === p.npc) : undefined;
  if (n) {
    const sc = worldPack(p.world).sects[n.sect ?? ''];
    if (sc?.n === former) n.sect = null;
    n.how = n.how.replaceAll(former, 'Tán tu');
  }
}
function pickRecruitSect<T extends { n: string }>(sects: T[], rnd: () => number): T {
  const total = sects.reduce((sum, sc) => sum + doctrineWeight(sc.n), 0);
  let pick = rnd() * total;
  for (const sc of sects) { pick -= doctrineWeight(sc.n); if (pick < 0) return sc; }
  return sects.find(sc => doctrineWeight(sc.n) > 0)!;
}
function migrateBeasts(T: TcState, addNew: boolean) {
  const rnd = seeded(hashStr(s.id + ':yeutu'));
  for (const p of T.people) {
    if (p.ret || p.lord || p.npc) continue;
    if (p.beast && !p.blood) beastify(p, rnd, p.world); // yêu tu kiểu cũ (loài thường): đổi sang huyết mạch mới
    else if (!p.beast && addNew && rnd() < BEAST_RATE) beastify(p, rnd, p.world);
  }
}
function migrateRaces(T: TcState) {
  const rnd = seeded(hashStr(s.id + ':mythic-races'));
  for (const p of T.people) {
    if (p.ret || p.lord || p.npc || p.beast || rnd() >= MYTHIC_RACE_RATE) continue;
    const race = MYTHIC_RACES[Math.floor(rnd() * MYTHIC_RACES.length)];
    p.race = race.n;
  }
}
function migrateBeastAgesAndRealms(T: TcState) {
  for (const p of T.people) {
    if (p.npc || p.lord || p.chief || p.ret || p.heroine) continue;
    if (!p.beast && (p as any).race !== 'yeu') continue;
    const curAge = Math.floor(s.year - p.born);
    const tkLimit = TK_AGE[p.world];
    // Yêu tu ở bảng thiên kiêu (tuổi cũ <= tkLimit):
    // Phân bổ lại độ tuổi sang khoảng [48 .. tkLimit * 4] (Thương Lan: 48 .. 400 tuổi)
    // Và điều chỉnh thực lực tương ứng với 1/4 độ tuổi (100 tuổi chỉ ngang 25 tuổi nhân tộc)
    if (curAge <= tkLimit) {
      const rnd = seeded(hashStr(p.id + ':beast-age-v2'));
      const minAge = 48;
      const maxAge = tkLimit * 4;
      const newAge = Math.round(minAge + rnd() * (maxAge - minAge));
      p.born = s.year - newAge;
      p.soulBorn = s.year - newAge;
      const humanEq = newAge / 4;
      const grown = realmAfter(Math.max(0, humanEq - 10), p.talent, npcCap(p.world));
      p.r = grown.r;
      p.st = grown.st;
      p.p = grown.p;
    }
  }
}
/** Thiên kiêu trẻ của bốn thần giới, mỗi giới tu chân một bộ (Thiên Đình / Linh Sơn / Địa Phủ / Yêu Giới của giới ấy). */
const CEL_YOUTH: Record<CelestialId, [string, 'm' | 'f', string?][]> = {
  thiendinh: [['Thiên tướng trẻ tuổi dưới trướng Thác Tháp Thiên Vương', 'm'], ['Tiên nữ Dao Trì, đệ tử Vương Mẫu', 'f'], ['Tiên đồng giữ lò Đâu Suất Cung', 'm']],
  linhson: [['Phật tử Linh Sơn, đệ tử Quan Thế Âm Bồ Tát', 'm'], ['Long nữ hầu cận Quan Thế Âm Bồ Tát', 'f']],
  diaphu: [['Thiếu quân Phong Đô, con trai một vị Diêm Vương', 'm'], ['Quỷ sai trẻ nhất Âm ty, theo hầu Phán Quan', 'f']],
  yeugioi: [['Yêu tử, con trai một vị Đại Thánh Yêu Giới', 'm'], ['Hồ nữ Thanh Khâu, cháu gái Yêu Hậu', 'f']],
};
function addCelestialYouth(people: TcPerson[], y: number) {
  const rnd = seeded(hashStr(s.id + ':cel-youth'));
  for (let w = 0; w < LAST_WORLD; w++) {
    const cap = npcCap(w);
    for (const id of Object.keys(CEL_YOUTH) as CelestialId[]) {
      for (const [from, g, race] of CEL_YOUTH[id]) {
        const isBeast = id === 'yeugioi' || race === 'yeu' || /yêu|hồ|long/i.test(from);
        const maxAge = tkAgeMax(w, isBeast);
        const a = Math.round(maxAge * (0.3 + rnd() * 0.6));
        const talent = 1.5 + rnd() * 0.8;
        const effectiveAge = isBeast ? a / 4 : a;
        const { r, st, p } = realmAfter(Math.max(0, effectiveAge - 10), talent, cap);
        people.push({ id: uid(), name: genName(rnd, g), g, world: w, born: y - a, soulBorn: y - a, r, st, p, talent, el: ALL_EL[Math.floor(rnd() * ALL_EL.length)], sect: CELESTIAL[id].n, from, asc: 0, alive: true, ...(race ? { race } : {}) });
      }
    }
  }
}
function sectsOf(w: number): { n: string; tier: number }[] {
  const p = worldPack(w);
  return Object.values(p.sects).map((x) => ({ n: x.n, tier: x.tier }));
}
const HONGHUANG_CHIEFS: { name: string; g?: 'm' | 'f'; race?: string; races?: string[]; sect: string; from: string; el: El }[] = [
  { name: 'Đế Giang', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu, đứng đầu Vu tộc', el: 'phong' },
  { name: 'Câu Mang', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Mộc, thủ lĩnh một bộ Vu tộc', el: 'moc' },
  { name: 'Nhục Thu', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Kim, thủ lĩnh một bộ Vu tộc', el: 'kim' },
  { name: 'Cộng Công', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Thủy, thủ lĩnh một bộ Vu tộc', el: 'thuy' },
  { name: 'Chúc Dung', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Hỏa, thủ lĩnh một bộ Vu tộc', el: 'hoa' },
  { name: 'Thiên Ngô', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Phong, thủ lĩnh một bộ Vu tộc', el: 'phong' },
  { name: 'Huyền Minh', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Băng, thủ lĩnh một bộ Vu tộc', el: 'bang' },
  { name: 'Hậu Thổ', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Thổ, thủ lĩnh một bộ Vu tộc', el: 'tho' },
  { name: 'Cường Lương', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Lôi, thủ lĩnh một bộ Vu tộc', el: 'loi' },
  { name: 'Chúc Cửu Âm', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Thời, thủ lĩnh một bộ Vu tộc', el: 'am' },
  { name: 'Xa Bỉ Thi', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Độc, thủ lĩnh một bộ Vu tộc', el: 'am' },
  { name: 'Hấp Tư', race: 'Vu tộc', sect: 'Vu Tộc · Bàn Cổ Điện', from: 'Tổ Vu chưởng Điện, thủ lĩnh một bộ Vu tộc', el: 'loi' },
  { name: 'Xi Vưu', race: 'Cửu Lê tộc', sect: 'Cửu Lê tộc', from: 'Xi Vưu — danh hiệu của kẻ mạnh nhất Cửu Lê tộc, thống lĩnh cả chín bộ', el: 'kim' },
  { name: 'Hiên Viên', race: 'Hiên Viên tộc', sect: 'Hỏa Vân Động', from: 'Tộc trưởng Hiên Viên tộc, thủ lĩnh Nhân tộc', el: 'tho' },
  { name: 'La Hầu', race: 'Ma tộc', sect: 'Ma tộc', from: 'Ma Tổ, thủ lĩnh Ma tộc', el: 'am' },
  { name: 'Hình Thiên', race: 'Hình Thiên tộc', sect: 'Hình Thiên tộc', from: 'Tộc trưởng Hình Thiên tộc, chiến thần bất khuất', el: 'hoa' },
  { name: 'Phục Hy', race: 'Yêu tộc', sect: 'Hỏa Vân Động', from: 'Thủ lĩnh Yêu tộc, truyền lại bát quái và thiên văn', el: 'quang' },
  { name: 'Nữ Oa', g: 'f', race: 'Yêu tộc', sect: 'Yêu tộc', from: 'Thánh mẫu Yêu tộc, tạo hóa vạn linh', el: 'moc' },
  { name: 'Lão Tử', race: 'Nhân tộc', sect: 'Đạo Giáo · Bát Cảnh Cung', from: 'Thái Thượng Lão Quân (thế danh Lý Nhĩ, tự Bá Dương, hiệu Lão Đam), giáo chủ Đạo Giáo, đại sư huynh của Nguyên Thủy và Thông Thiên, sư trưởng của Xiển Giáo; ngự Bát Cảnh Cung ở Đại La Cung Huyền Đô Động, cùng hai sư đệ ký Phong Thần Bảng', el: 'tho' },
  { name: 'Nguyên Thủy Thiên Tôn', race: 'Nhân tộc', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Ngọc Thanh Nguyên Thủy Thiên Tôn, tiên thiên thần thánh hóa sinh từ Hỗn Độn Khí, một trong Tam Thanh, giáo chủ Xiển Giáo tại Ngọc Hư Cung Côn Lôn', el: 'quang' },
  { name: 'Thông Thiên Giáo Chủ', race: 'Nhân tộc', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Thượng Thanh Thông Thiên Giáo Chủ (Thượng Thanh Linh Bảo Thiên Tôn), tiên thiên thánh nhân hóa sinh từ Khí Bàn Cổ, một trong Tam Thanh, giáo chủ Tiệt Giáo tại Bích Du Cung Kim Ngao Đảo', el: 'loi' },
  { name: 'Chuẩn Đề', sect: 'Tây Phương Giáo', from: 'Chuẩn Đề Đạo Nhân (Chuẩn Đề Phật Mẫu, Thất Câu Đê Phật Mẫu), tiên thiên tây phương nhị giáo chủ, chấp chưởng Thất Bảo Diệu Thụ', el: 'quang' },
  { name: 'Tiếp Dẫn', sect: 'Tây Phương Giáo', from: 'Tiếp Dẫn Đạo Nhân (tiền thân Đức Phật A Di Đà), tiên thiên tây phương đại giáo chủ, ngự trên Thập Nhị Phẩm Công Đức Kim Liên', el: 'quang' },
  { name: 'Bồ Đề Tổ Sư', sect: 'Phương Thốn Sơn · Tam Tinh Động', from: 'Ẩn tu tại Linh Đài Phương Thốn Sơn, sư phụ của Tôn Ngộ Không', el: 'moc' },
  { name: 'Đế Tuấn', race: 'Yêu tộc', sect: 'Yêu Đình', from: 'Yêu Hoàng, đứng đầu Thiên Đình thời thượng cổ', el: 'hoa' },
  { name: 'Đông Hoàng Thái Nhất', race: 'Yêu tộc', sect: 'Yêu Đình', from: 'Đông Hoàng, em trai Đế Tuấn, chấp chưởng Hỗn Độn Chung', el: 'hoa' },
  { name: 'Tôn Ngộ Không', race: 'Yêu tộc', sect: 'Tán tu', from: 'Thạch Hầu xuất thế từ Hoa Quả Sơn, về sau đại náo thiên cung', el: 'kim' },
  { name: 'Dương Tiễn', race: 'Nhân tộc', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Nhị Lang Hiển Thánh Chân Quân (tên thật Dương Tiễn), đệ tử Ngọc Đỉnh Chân Nhân, tu thành Bát Cửu Huyền Công', el: 'thuy' },
  { name: 'Na Tra', race: 'Nhân tộc', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Tam Đàn Hải Hội Đại Thần (Lý Na Tra, con Lý Tĩnh), linh châu tử chuyển thế, đệ tử Thái Ất Chân Nhân', el: 'hoa' },
  { name: 'Như Lai', sect: 'Tây Phương Giáo', from: 'Thích Ca Mâu Ni Phật (thế danh Tất Đạt Đa Cồ Đàm, tông tộc Thích Ca, hiệu Đa Bảo Như Lai), chí tôn Đại Lôi Âm Tự Linh Sơn', el: 'quang' },
  { name: 'Nhiên Đăng', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Nhiên Đăng Đạo Nhân (sau thành Nhiên Đăng Thượng Cổ Phật), phó giáo chủ Xiển Giáo, cổ phật quá khứ', el: 'hoa' },
  { name: 'Hồng Quân Đạo Tổ', sect: 'Tán tu', from: 'Đạo Tổ giảng đạo tại Tử Tiêu Cung, sư tôn Tam Thanh', el: 'quang' },
  { name: 'Trấn Nguyên Tử', sect: 'Ngũ Trang Quán', from: 'Địa Tiên chi tổ, chủ nhân Ngũ Trang Quán', el: 'tho' },
  { name: 'Minh Hà Lão Tổ', sect: 'Tán tu', from: 'Sinh trong Huyết Hải, tự lập A Tu La đạo', el: 'am' },
  { name: 'Côn Bằng Lão Tổ', race: 'Yêu tộc', sect: 'Yêu Đình', from: 'Yêu Sư, một trong các cường giả Yêu tộc', el: 'phong' },
  { name: 'Vân Tiêu', g: 'f', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Đại tỷ Tam Tiêu, trấn giữ Tam Tiên Đảo, tinh thông Cửu Khúc Hoàng Hà Trận', el: 'phong' },
  { name: 'Quỳnh Tiêu', g: 'f', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Nhị tỷ Tam Tiêu, cùng Vân Tiêu và Bích Tiêu trấn giữ Tam Tiên Đảo', el: 'thuy' },
  { name: 'Bích Tiêu', g: 'f', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Tam muội Tam Tiêu, cùng hai tỷ tỷ trấn giữ Tam Tiên Đảo', el: 'thuy' },
  { name: 'Triệu Công Minh', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Đệ tử Tiệt Giáo, huynh trưởng Tam Tiêu, cưỡi Hắc Hổ và chấp chưởng Định Hải Châu', el: 'loi' },
  { name: 'Kim Linh Thánh Mẫu', g: 'f', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Đệ tử thân truyền của Thông Thiên Giáo Chủ, đứng đầu nữ tiên Tiệt Giáo', el: 'kim' },
  { name: 'Vô Đương Thánh Mẫu', g: 'f', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Đệ tử thân truyền của Thông Thiên Giáo Chủ, một trong tứ đại đệ tử Tiệt Giáo', el: 'tho' },
  { name: 'Quy Linh Thánh Mẫu', g: 'f', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Đệ tử thân truyền của Thông Thiên Giáo Chủ, một trong tứ đại đệ tử Tiệt Giáo', el: 'thuy' },
  { name: 'Đa Bảo Đạo Nhân', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Đại đệ tử Tiệt Giáo, đứng đầu vạn tiên Bích Du Cung', el: 'tho' },
  { name: 'Thân Công Báo', sect: 'Tán tu', from: 'Đạo nhân từng tu học ở Xiển Giáo, về sau đi khắp nơi chiêu mời tiên gia trợ Thương', el: 'thuy' },
  { name: 'Khương Tử Nha', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Ngọc Hư, phụng mệnh xuống núi phò Chu diệt Thương', el: 'tho' },
  { name: 'Cơ Xương', race: 'Nhân tộc', sect: 'Tây Kỳ', from: 'Tây Bá Hầu, người đặt nền móng cho nhà Chu', el: 'tho' },
  { name: 'Cơ Phát', race: 'Nhân tộc', sect: 'Tây Kỳ', from: 'Vũ Vương nhà Chu, khởi binh phạt Trụ', el: 'hoa' },
  { name: 'Văn Trọng', sect: 'Tiệt Giáo · Bích Du Cung', from: 'Thái sư Đại Thương, đệ tử Kim Linh Thánh Mẫu, chấp chưởng Đả Thần Tiên', el: 'loi' },
  { name: 'Hoàng Phi Hổ', race: 'Nhân tộc', sect: 'Tây Kỳ', from: 'Vũ Thành Vương nhà Thương, sau quy thuận Tây Kỳ', el: 'kim' },
  { name: 'Trụ Vương', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Đế Tân, vị vua cuối cùng của nhà Thương; hậu thế gọi là Trụ Vương', el: 'hoa' },
  { name: 'Đát Kỷ', g: 'f', race: 'Yêu tộc', sect: 'Đại Thương', from: 'Hồ yêu phụng mệnh Nữ Oa nhập xác Tô thị, trở thành sủng phi của Trụ Vương', el: 'am' },
  { name: 'Phí Trọng', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Nịnh thần nhà Thương, cùng Vưu Hồn gièm pha trung lương', el: 'am' },
  { name: 'Vưu Hồn', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Nịnh thần thân cận Trụ Vương, cùng Phí Trọng thao túng triều chính', el: 'am' },
  { name: 'Sùng Hầu Hổ', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Bắc Bá Hầu, một trong tứ đại chư hầu nhà Thương', el: 'tho' },
  { name: 'Ngạc Sùng Vũ', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Nam Bá Hầu, một trong tứ đại chư hầu nhà Thương', el: 'hoa' },
  { name: 'Khương Hoàn Sở', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Đông Bá Hầu, một trong tứ đại chư hầu nhà Thương', el: 'moc' },
  { name: 'Lý Tĩnh', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Trần Đường Quan tổng binh, cha của Na Tra', el: 'kim' },
  { name: 'Ân Thị', g: 'f', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Phu nhân của Lý Tĩnh, mẹ của Na Tra', el: 'tho' },
  { name: 'Kim Tra', race: 'Nhân tộc', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Con trưởng Lý Tĩnh, đệ tử Văn Thù Quảng Pháp Thiên Tôn', el: 'kim' },
  { name: 'Mộc Tra', race: 'Nhân tộc', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Con thứ Lý Tĩnh, đệ tử Phổ Hiền Chân Nhân', el: 'moc' },
  { name: 'Lôi Chấn Tử', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Vân Trung Tử, mọc cánh phong lôi sau khi ăn hai quả tiên hạnh', el: 'loi' },
  { name: 'Hoàng Thiên Hóa', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Con trai Hoàng Phi Hổ, đệ tử Thanh Hư Đạo Đức Chân Quân', el: 'hoa' },
  { name: 'Dương Nhậm', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Thanh Hư Đạo Đức Chân Quân, đôi mắt hóa thành thần nhãn trong lòng bàn tay', el: 'quang' },
  { name: 'Đặng Thiền Ngọc', g: 'f', race: 'Nhân tộc', sect: 'Tây Kỳ', from: 'Nữ tướng nhà Thương, về sau phò trợ Tây Kỳ', el: 'tho' },
  { name: 'Thổ Hành Tôn', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Cụ Lưu Tôn, tinh thông địa hành thuật', el: 'tho' },
  { name: 'Long Cát Công Chúa', g: 'f', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Công chúa Dao Trì, xuống núi trợ chiến Tây Kỳ', el: 'thuy' },
  { name: 'Tỷ Can', race: 'Nhân tộc', sect: 'Đại Thương', from: 'Trung thần nhà Thương, bị Trụ Vương hại vì can gián', el: 'hoa' },
  { name: 'Vân Trung Tử', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Tiên nhân Chung Nam Sơn, từng dâng kiếm trừ yêu ở Triều Ca', el: 'phong' },
  { name: 'Quảng Thành Tử', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, đạo tràng Đào Nguyên Sơn', el: 'kim' },
  { name: 'Xích Tinh Tử', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, đạo tràng Thái Hoa Sơn', el: 'hoa' },
  { name: 'Thái Ất Chân Nhân', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, sư phụ của Na Tra', el: 'hoa' },
  { name: 'Ngọc Đỉnh Chân Nhân', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, sư phụ của Dương Tiễn', el: 'kim' },
  { name: 'Từ Hàng Đạo Nhân', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, đạo tràng Phổ Đà Sơn', el: 'thuy' },
  { name: 'Văn Thù Quảng Pháp Thiên Tôn', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, đạo tràng Ngũ Long Sơn', el: 'quang' },
  { name: 'Phổ Hiền Chân Nhân', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, đạo tràng Cửu Cung Sơn', el: 'tho' },
  { name: 'Cụ Lưu Tôn', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử Nguyên Thủy Thiên Tôn, sư phụ của Thổ Hành Tôn', el: 'tho' },
  { name: 'Hoàng Long Chân Nhân', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Một trong thập nhị kim tiên Xiển Giáo, đạo tràng Nhị Tiên Sơn', el: 'thuy' },
  { name: 'Đạo Hạnh Thiên Tôn', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Một trong thập nhị kim tiên Xiển Giáo, đạo tràng Kim Đình Sơn', el: 'phong' },
  { name: 'Thanh Hư Đạo Đức Chân Quân', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Một trong thập nhị kim tiên Xiển Giáo, sư phụ Hoàng Thiên Hóa và Dương Nhậm', el: 'quang' },
  { name: 'Nam Cực Tiên Ông', sect: 'Xiển Giáo · Ngọc Hư Cung', from: 'Đệ tử lớn của Nguyên Thủy Thiên Tôn, thường truyền pháp chỉ Ngọc Hư', el: 'tho' },
  { name: 'Huyền Đô Đại Pháp Sư', race: 'Nhân tộc', sect: 'Đạo Giáo · Bát Cảnh Cung', from: 'Đệ tử đích truyền của Lão Tử, tu hành thanh tĩnh tại Bát Cảnh Cung', el: 'tho' },
];
function addHonghuangChiefs(T: TcState) {
  const y = s.year;
  for (const [i, chief] of HONGHUANG_CHIEFS.entries()) {
    const id = `honghuang-chief-${i}`;
    if (T.people.some((p) => p.id === id)) continue;
    T.people.push({
      id,
      name: chief.name,
      g: chief.g ?? 'm',
      world: 4,
      born: y - 100_000_000,
      soulBorn: y - 100_000_000,
      r: npcCap(4),
      st: 3,
      p: 0,
      talent: 2.4,
      el: chief.el,
      sect: chief.sect,
      from: chief.from,
      ...(chief.races ? { races: chief.races } : chief.race ? { races: [chief.race] } : {}),
      ...(chief.race ? { race: chief.race } : {}),
      chief: true,
      asc: 4,
      alive: true,
    });
  }
  addFengshenRoster(T);
  const id = 'chaos-figure-pangu';
  if (!T.people.some((p) => p.id === id)) T.people.push({
    id,
    name: 'Bàn Cổ',
    g: 'm',
    world: LAST_WORLD,
    born: y - 1_000_000_000,
    soulBorn: y - 1_000_000_000,
    r: npcCap(LAST_WORLD),
    st: 3,
    p: 0,
    talent: 2.4,
    el: 'tho',
    sect: 'Tán tu',
    from: 'Khai thiên tích địa, tán tu độc hành tại Hỗn Độn',
    chief: true,
    asc: LAST_WORLD,
    alive: true,
  });
}
/** Các vị có tên trong Phong Thần Bảng sống ở Hồng Hoang. Thủ lĩnh thần thoại đã có (Văn Trọng, Tam Tiêu…) được gắn
 *  thần vị của mình; người trùng tên với một thủ lĩnh đã được gắn thì là người khác, sinh riêng. */
function addFengshenRoster(T: TcState) {
  const y = s.year;
  const realmIdx = (n: string) => REALMS.findIndex((realm) => realm.n === n);
  const BAND: [number, number][] = [
    [realmIdx('Chuẩn Thánh'), realmIdx('Chuẩn Thánh')],
    [realmIdx('Thái Ất Kim Tiên'), realmIdx('Đại La Kim Tiên')],
    [realmIdx('Kim Tiên'), realmIdx('Thái Ất Kim Tiên')],
  ];
  for (const [i, god] of FENGSHEN_ROSTER.entries()) {
    if (T.people.some((p) => p.fsi === i)) continue;
    const chief = T.people.find((p) => p.chief && p.world === 4 && p.name === god.name && p.fsi === undefined);
    if (chief) { chief.fsi = i; chief.sect = god.sect; continue; } // thế lực theo sư thừa đã kiểm chứng trong bảng
    const rnd = seeded(hashStr(`fengshen:${i}:${god.name}`));
    const [lo, hi] = BAND[god.tier];
    const r = Math.min(npcCap(4), lo + Math.floor(rnd() * (hi - lo + 1)));
    const age = Math.round(REALMS[r].life * worldLife(4) * (0.05 + rnd() * 0.4));
    T.people.push({
      id: `fengshen-god-${i}`,
      name: god.name,
      g: god.g,
      world: 4,
      born: y - age,
      soulBorn: y - age,
      r,
      st: Math.floor(rnd() * 4),
      p: rnd(),
      talent: 1.2 + rnd() * 0.8,
      el: ALL_EL[Math.floor(rnd() * ALL_EL.length)],
      sect: god.sect,
      from: god.from,
      fengshen: true,
      fsi: i,
      asc: 4,
      alive: true,
    });
  }
}
function gen(): TcState {
  const rnd = seeded(hashStr(s.id + ':tienco'));
  const pk = <X,>(a: readonly X[]) => a[Math.floor(rnd() * a.length)];
  const rf = (a: number, b: number) => a + rnd() * (b - a);
  const people: TcPerson[] = [];
  const y = s.year;
  for (let w = 0; w <= LAST_WORLD; w++) {
    const cap = npcCap(w);
    const sects = sectsOf(w);
    const pickSect = (hi: boolean) => {
      const pool = sects.filter((x) => (hi ? x.tier >= 3 : true));
      const r = rnd();
      if (r < 0.15) return { n: 'Tán tu', tier: 0 };
      if (r < 0.25) return { n: `Hoàng thất ${WORLDS[w]}`, tier: 2 };
      return pickRecruitSect(pool.length ? pool : sects, rnd);
    };
    // Thiên kiêu: trẻ theo tuổi thân thể, tư chất cao. Yêu tu thọ mệnh gấp 4 lần (tối đa 400 tuổi), tu vi xấp xỉ nhân tộc lúc 1/4 tuổi
    for (let i = 0; i < N_TK; i++) {
      const g = rnd() < 0.5 ? 'm' : 'f';
      const isBeast = rnd() < BEAST_RATE;
      const maxAge = tkAgeMax(w, isBeast);
      const minAge = isBeast ? 12 * 4 : 12;
      const a = Math.round(rf(minAge, maxAge));
      const talent = rf(1.3, 2.3);
      const effectiveAge = isBeast ? a / 4 : a;
      const { r, st, p } = realmAfter(Math.max(0, effectiveAge - 10), talent, cap);
      const sc = pickSect(rnd() < 0.6);
      const person: TcPerson = { id: uid(), name: genName(rnd, g), g, world: w, born: y - a, soulBorn: y - a, r, st, p, talent, el: pk(ALL_EL), sect: sc.n, from: sc.tier >= 4 ? `Thánh ${g === 'm' ? 'tử' : 'nữ'} ${sc.n}` : sc.tier >= 3 ? `Thân truyền ${sc.n}` : sc.n === 'Tán tu' ? 'Tán tu không rõ sư thừa' : `Đệ tử ${sc.n}`, asc: 0, alive: true };
      if (isBeast) beastify(person, rnd, w); // yêu thú hóa hình cũng là thiên kiêu
      people.push(person);
    }
    // Cường giả: cảnh giới sát trần giới, tuổi lớn
    for (let i = 0; i < N_CG; i++) {
      const g = rnd() < 0.6 ? 'm' : 'f';
      const isBeast = rnd() < BEAST_RATE;
      const r = Math.max(1, cap - Math.floor(rnd() * rnd() * 4));
      const st = Math.floor(rnd() * 4);
      const life = REALMS[r].life * worldLife(w) * (isBeast ? 4 : 1);
      const a = Math.round(life * rf(0.35, 0.85));
      const sc = pickSect(true);
      const talent = rf(0.8, 1.5);
      const name = rnd() < 0.7 ? daoTitle(pk(g === 'm' ? DAO_HAO : DAO_HAO_F), r, st, sc.tier, g) : genName(rnd, g);
      const person: TcPerson = { id: uid(), name, g, world: w, born: y - a, soulBorn: y - a - (w ? Math.round(rf(0.3, 0.9) * TK_AGE[w - 1] * 3) : 0), r, st, p: rnd(), talent, el: pk(ALL_EL), sect: sc.n, from: sc.tier >= 4 ? `Thái thượng trưởng lão ${sc.n}` : sc.tier >= 3 ? `Lão tổ ${sc.n}` : sc.n === 'Tán tu' ? 'Tán tu' : `Trấn giữ ${sc.n}`, asc: w, alive: true };
      if (isBeast) beastify(person, rnd, w); // đại yêu hóa hình trên Cường Giả Bảng
      people.push(person);
    }
  }
  // Kẻ giữ Đại Đạo ở Hỗn Độn
  people.push({ id: 'daolord', name: DAO_HOLDER, g: 'm', world: LAST_WORLD, born: y - 1e9, soulBorn: y - 1e9, r: DAI_DAO, st: 0, p: 0, talent: 1, el: 'quang', sect: 'Đại Đạo', from: 'Ngồi ở Đại Đạo từ thuở hỗn độn chưa phân', asc: LAST_WORLD, alive: !s.flags.daiDao, lord: true });
  // Nhiều hồi hạ giả cùng giáng lâm trong một năm; thế lực nguồn có thể khác nhau.
  const top: [string, string | undefined][] = [...sectsOf(LAST_WORLD).filter((x) => x.tier === 4).map((x) => [x.n, undefined] as [string, undefined]), ...HD_CLANS];
  for (const [force, sur] of top) {
    if (s.origin === 'diep_hondon' && force === 'Diệp gia Hỗn Độn' && s.g !== 'f') continue; // nữ chính cần nam chính hồi hạ giả của Diệp gia
    if (s.g === 'f' && force === 'Diệp gia Hỗn Độn') { people.push(makeYeLead(y)); continue; }
    if (force === 'Ngô gia Hỗn Độn') continue; // suất của Ngô gia là Ngô Thu Phương, tạo riêng với thiên phú đỉnh cấp
    if (rnd() > 0.55) continue;
    const g = rnd() < 0.5 ? 'm' : 'f';
    const born = s.born;
    const a = Math.max(1, y - born);
    const talent = rf(1.7, 2.4);
    const grown = a > 6 ? realmAfter(Math.max(0, a - 6), talent, npcCap(0)) : { r: 0, st: 0, p: 0 };
    const name = genName(rnd, g, sur);
    const home = returnerHome(rnd, name);
    people.push({ id: uid(), name, g, world: 0, born, soulBorn: born, ...grown, talent, el: pk(ALL_EL), ...home, from: `Được ${force} đưa về Thương Lan từ trong nôi, đi lại con đường tu hành từ những bước chân đầu tiên — một suất duy nhất của cả thế lực`, ret: force, asc: 0, alive: true });
  }
  people.push(makeHeroine(rnd, y));
  addCelestialYouth(people, y);
  return { v: 1, people, rank: { tk: 0, cg: 0 }, y: Math.floor(y), meteorYear: s.born, beastMig: 2, celMig: 1 };
}

function makeHeroine(rnd: () => number, year: number): TcPerson {
  const towns = Object.values(LOCS).filter((l) => l.type === 'town' && !l.island);
  const home = towns[Math.floor(rnd() * towns.length)];
  const homeRealm = 1 + Math.floor(rnd() * npcCap(0));
  const born = s.born;
  const physicalAge = Math.max(0, year - born);
  const grown = physicalAge > 6 ? realmAfter(physicalAge - 6, 2.4, npcCap(0)) : { r: 0, st: 0, p: 0 };
  const { sect, clan, loc } = returnerHome(rnd, HEROINE.name);
  return {
    id: uid(),
    name: HEROINE.name,
    g: 'f',
    world: 0,
    born,
    soulBorn: born,
    ...grown,
    talent: 2.4,
    el: pkAny(rnd, ALL_EL),
    sect, clan, loc,
    from: `Được Ngô gia Hỗn Độn đưa về Thương Lan từ khi còn nhỏ; con đường tu luyện tại ${sect} hoàn toàn do cơ duyên`,
    ret: 'Ngô gia Hỗn Độn',
    asc: 0,
    alive: true,
    heroine: true,
    bio: { ...HEROINE.bio, els: [...HEROINE.bio.els] },
    pic: HEROINE.pic,
    home: `Ngô gia ${home.n} — lão tổ ${REALMS[homeRealm].n}`,
  };
}
function returnerHome(rnd: () => number, name: string): { sect: string; clan?: string; loc: string } {
  const matchingClan = Object.values(CLANS).find((c) => name.startsWith(c.sur + ' '));
  const clan = matchingClan;
  const sects = Object.values(SECTS).filter((x) => x.tier > 0);
  const forces = [...sects, ...Object.values(EMPIRES)];
  const sect = clan?.n ?? forces[Math.floor(rnd() * forces.length)]?.n ?? 'Tán tu';
  const places = Object.values(LOCS).filter((l) => ['village', 'town', 'market', 'sect', 'wild'].includes(l.type));
  const loc = places[Math.floor(rnd() * places.length)]?.id ?? 'diepgia';
  return { sect, clan: clan?.id, loc };
}
function pickSectTL(rnd: () => number) {
  const all = Object.values(SECTS).filter((x) => x.tier >= 2);
  return all.length ? all[Math.floor(rnd() * all.length)].n : 'Tán tu';
}

// ---------- Thời gian trôi ----------
/** Người trên bảng tu luyện, đột phá, phi thăng, chết già — gọi từ passTime(y). */
export function tiencoTick(y: number) {
  if (!s || y <= 0) return;
  const T = tc();
  for (const p of T.people) {
    if (!p.alive || p.lord || p.chief || p.fengshen) continue;
    // đã thành NPC trong nhân mạch (cùng giới): theo NPC
    if (p.npc) {
      const n = s.npcs.find((x) => x.id === p.npc);
      if (n) {
        if (!n.alive) { p.alive = false; p.died = n.died; p.cause = n.cause; continue; }
        p.r = n.r; p.st = n.st; p.born = n.born;
        evolvePerson(p);
        continue;
      }
      delete p.npc; // người chơi đã rời giới / NPC bị quên
    }
    grow(p, y);
    evolvePerson(p);
  }
  // xếp hạng của người chơi: kiểm mỗi năm
  const yy = Math.floor(s.year);
  if (yy !== T.y) {
    T.y = yy;
    checkRank();
  }
}
slots.tiencoTick = tiencoTick;
const cap = (w: number) => npcCap(w);
function grow(p: TcPerson, y: number) {
  const isBeast = !!(p.beast || (p as any).race === 'yeu');
  const bodyAge = s.year - p.born;
  const startAge = isBeast ? 24 : 6;
  if (p.r === 0) {
    if (bodyAge >= startAge) { p.r = 1; p.st = 0; p.p = 0; } else return;
  }
  let left = y;
  const speedMul = isBeast ? 0.25 : 1; // Thực lực yêu tộc tăng chậm hơn nhân tộc 4 lần
  let guard = 0;
  while (left > 0 && guard++ < 400) {
    const per = ((REALMS[p.r].turn * 12) / Math.max(0.2, p.talent)) / speedMul;
    const step = Math.min(left, per);
    left -= step;
    p.p += step / per;
    if (p.p < 1) continue;
    p.p = 0;
    if (p.st < 3) { p.st++; continue; }
    const c = cap(p.world);
    if (p.r < c) {
      if (Math.random() < Math.min(0.95, (BREAK_BASE[p.r + 1] ?? 0.05) + 0.15 + (p.luck ?? 0) * 0.01)) { p.r++; p.st = 0; } else p.p = 0.5;
      continue;
    }
    // viên mãn trần giới: độ kiếp phi thăng
    if (p.world >= LAST_WORLD) { p.p = 1; break; }
    if (Math.random() < 0.55) ascendPerson(p);
    else if (Math.random() < 0.35) { kill(p, 'độ kiếp thất bại, tro bay khói tan'); return; }
    else p.p = 0.6;
  }
  const life = REALMS[p.r].life * worldLife(p.world) * 1.05 * (isBeast ? 4 : 1);
  if (s.year - p.born > life) kill(p, 'thọ tận');
  else if (Math.random() < y / (life * 2.5 * (1 + (p.luck ?? 0) * 0.05))) kill(p, ['bỏ mạng trong hiểm địa', 'bị kẻ thù ám sát', 'tẩu hỏa nhập ma'][Math.floor(Math.random() * 3)]); // rủi ro theo tỉ lệ thọ nguyên: cường giả sống hàng vạn năm không chết vặt
}
function ascendPerson(p: TcPerson) {
  const from = p.world;
  p.world++;
  if (p.heroine) {
    const sects = sectsOf(p.world);
    if (sects.length) p.sect = sects[Math.floor(Math.random() * sects.length)].n;
  }
  p.asc++;
  p.r = 1; p.st = 0; p.p = 0;
  p.born = s.year - 1; // thân thể về một tuổi, tâm trí giữ nguyên
  if (from === worldOf() && (p.known || p.npc)) addLog(`Thiên Cơ Lâu truyền tin: ${p.name} độ kiếp thành công, phi thăng ${WORLDS[p.world]}. Tên ${p.g === 'm' ? 'hắn' : 'nàng'} bị gạch khỏi các bảng ${WORLDS[from]}.`);
  if (p.ret && p.known && p.world === LAST_WORLD) addLog(`${p.name} đã về tới Hỗn Độn — suất đưa về Thương Lan của ${p.ret} coi như thành công.`);
}
function kill(p: TcPerson, cause: string) {
  p.alive = false; p.died = s.year; p.cause = cause;
  if (p.world === worldOf() && (p.known || p.npc)) addLog(`Thiên Cơ Lâu truyền tin: ${p.name} đã ${cause}.`, 'bad');
}

// ---------- Bảng ----------

/** Danh sách đầy đủ một bảng trong giới hiện tại (đã xếp hạng, gồm người chơi). */
/** Mỗi thánh địa của giới w chỉ có một Thánh tử và một Thánh nữ, mang họ cố định (HOLY_SUR).
 *  Người giữ danh vị trong nhân mạch (vd. vị hôn thê thánh nữ) được ưu tiên; người dư trên bảng thành đệ tử thân truyền. */
function fixHolyTitles(w: number) {
  const people = tcPeople();
  for (const sc of Object.values(worldPack(w).sects)) {
    if (sc.tier < 4) continue;
    for (const g of ['m', 'f'] as const) {
      const title = `Thánh ${g === 'm' ? 'tử' : 'nữ'} ${sc.n}`;
      let kept = w === worldOf() && s.npcs.some((n) => n.alive && n.sect === sc.id && n.g === g && n.how.startsWith(title));
      for (const p of people) {
        if (p.world !== w || p.g !== g || !p.alive || p.npc || p.from !== title) continue;
        if (kept) { p.from = `Thân truyền ${sc.n}`; continue; }
        kept = true;
        const sur = holySur(sc.id, g);
        if (sur && splitName(p.name).sur !== sur) p.name = `${sur} ${splitName(p.name).given}`;
      }
    }
  }
}
export function board(kind: 'tk' | 'cg', w = worldOf()): TcRow[] {
  fixHolyTitles(w);
  for (const p of tcPeople()) if (p.world === w) { beastHome(p); fitTribe(p, w); } // yêu tu không vào hoàng thất; Long Cung chỉ có đúng thủy tộc
  const rows: TcRow[] = [];
  for (const { person: p, npc: n } of worldResidents(w)) {
    const r = n?.r ?? p!.r, st = n?.st ?? p!.st;
    if (r === 0) continue;
    const a = Math.floor(s.year - (n?.born ?? p!.born));
    const isBeast = !!(p?.beast || n?.beast || (n as any)?.race === 'yeu' || (p as any)?.race === 'yeu');
    if (kind === 'tk' && a > tkAgeMax(w, isBeast)) continue;
    rows.push({ id: p?.id ?? 'npc:' + n!.id, name: n?.name ?? p!.name, g: n?.g ?? p!.g, r, st, age: a,
      soul: p ? Math.floor(s.year - p.soulBorn) : a,
      note: p ? noteOf(p) : [n!.sect && SECTS[n!.sect] ? SECTS[n!.sect].n : '', n!.how].filter(Boolean).join(' · ') || 'Người quen',
      npc: n, person: p, role: n ? roleOfNpc(n) : roleOfPerson(p!), rank: 0 });
  }
  // chức vụ bốn thần giới của giới này (Ngọc Hoàng, Phong Đô Đại Đế, Yêu Hoàng, Phật Tổ…): đều là người của giới, không ngoại lệ
  {
    const names = new Set(rows.map((x) => x.name));
    for (const id of Object.keys(CELESTIAL) as CelestialId[]) {
      celestialOffices(id, w).forEach((o, i) => {
        if (names.has(o.name)) { const existing = rows.find(row => row.name === o.name)!; existing.celestialTier = Math.min(existing.celestialTier ?? o.tier, o.tier); return; } // Hồng Hoang: nhân vật truyền thuyết đã có mặt trên bảng
        names.add(o.name);
        const births: Record<string, number> = (s.flags.celestialBirths ||= {});
        const birthKey = `${w}:${id}:${o.title}`;
        if (births[birthKey] === undefined) {
          const rnd = seeded(hashStr(`${s.id}:celestial-age:${birthKey}`));
          const initialAge = Math.floor(REALMS[o.r].life * worldLife(w) * (0.4 + rnd() * 0.4));
          births[birthKey] = s.year - initialAge;
        }
        const a = Math.floor(s.year - births[birthKey]);
        const isCelBeast = id === 'yeugioi' || /yêu|thần thú|long|phượng/i.test(o.title);
        if (kind === 'tk' && a > tkAgeMax(w, isCelBeast)) return;
        rows.push({ id: `cel:${id}:${i}`, name: o.name, g: o.f ? 'f' : 'm', r: o.r, st: o.tier === 0 ? 3 : 2 - (i % 3), age: a, soul: a, note: `${o.title} · ${CELESTIAL[id].n}${o.daoHao ? ` · Đạo hiệu: ${o.daoHao}` : ''}`, force: CELESTIAL[id].n, role: o.title, rank: 0, daoHao: o.daoHao, celestialTier: o.tier });
      });
    }
  }
  // người quen trong nhân mạch (luôn cùng giới với người chơi)
  if (w === worldOf()) {
    const a = Math.floor(age());
    const isPlayerBeast = !!((s as any).beast || (s as any).race === 'yeu');
    if (s.r > 0 && (kind === 'cg' || a <= tkAgeMax(w, isPlayerBeast))) rows.push({ id: 'me', name: s.name, g: s.g, r: s.r, st: s.st, age: a, soul: Math.floor(soulAge()), note: s.sect && SECTS[s.sect.id] ? SECTS[s.sect.id].n : 'Chính ngươi', mine: true, rank: 0 });
  }
  for (const row of rows) row.power = rankingPower(row, w);
  return rankedHundred<TcRow>(rows, () => {
    const p = recruitPerson(w, kind === 'tk');
    const a = Math.floor(s.year - p.born);
    const row: TcRow = { id: p.id, name: p.name, g: p.g, r: p.r, st: p.st, age: a, soul: a, note: noteOf(p), person: p, role: roleOfPerson(p), rank: 0 };
    row.power = rankingPower(row, w);
    return row;
  }, compareRankPower);
}

/** New residents persist in the save and follow the normal cultivation lifecycle. */
export function recruitPerson(w: number, young = false): TcPerson {
  const T = tc();
  const rnd = seeded(hashStr(`${s.id}:recruit:${w}:${s.year}:${T.people.length}`));
  const g = rnd() < 0.5 ? 'm' : 'f';
  const talent = 1.3 + rnd();
  const target = Math.max(1, npcCap(w) - Math.floor(rnd() * 4));
  const isBeast = rnd() < BEAST_RATE;
  const maxAge = young ? tkAgeMax(w, isBeast) : Math.floor(REALMS[target].life * worldLife(w) * (0.4 + rnd() * 0.4) * (isBeast ? 4 : 1));
  const minAge = young ? (isBeast ? 24 : 18) : 18;
  const bodyAge = Math.floor(minAge + rnd() * Math.max(1, maxAge - minAge));
  const effectiveYears = Math.max(0, (isBeast ? bodyAge / 4 : bodyAge) - 10);
  const grown = realmAfter(effectiveYears, talent, npcCap(w));
  const r = grown.r;
  const sect = pickRecruitSect(sectsOf(w), rnd)?.n ?? 'Tán tu';
  const p: TcPerson = { id: uid(), name: genName(rnd, g), g, world: w, born: s.year - bodyAge, soulBorn: s.year - bodyAge,
    r, st: grown.st, p: grown.p, talent, el: pkAny(rnd, ALL_EL), sect, from: `Đệ tử ${sect}`, asc: 0, alive: true };
  if (isBeast) {
    beastify(p, rnd, p.world, true);
    fitTribe(p, p.world);
    beastHome(p);
    fitDoctrine(p);
  } else {
    if (rnd() < MYTHIC_RACE_RATE && MYTHIC_RACES.length) p.race = pkAny(rnd, MYTHIC_RACES).n;
    fitTribe(p, p.world);
    beastHome(p);
    fitDoctrine(p);
  }
  T.people.push(p);
  ensureWorldNames(T.people);
  return p;
}
/** Chức vụ của một người do Thiên Cơ Lâu ghi chép, suy từ lai lịch. */
export function roleOfPerson(p: TcPerson): string {
  if (p.legacyRole) return p.legacyRole.slice(p.legacyRole.indexOf(':') + 1);
  if (p.lord) return 'Đạo Chủ';
  const f = p.from, royal = p.sect.startsWith('Hoàng thất');
  if (p.ret && !p.known) return p.clan ? 'Con cháu trong tộc' : p.sect === 'Tán tu' ? 'không chức vụ' : 'Đệ tử';
  if (p.sect === 'Tán tu' || f.startsWith('Tán tu')) return 'không chức vụ';
  const holy = /^Thánh (tử|nữ) /.exec(f);
  if (holy) return `Thánh ${holy[1]}`;
  if (f.startsWith('Thân truyền ')) return 'Đệ tử thân truyền';
  if (f.startsWith('Thái thượng trưởng lão ')) return 'Thái thượng trưởng lão';
  if (f.startsWith('Lão tổ ')) return royal ? 'Hộ quốc lão tổ' : 'Lão tổ';
  if (f.startsWith('Trấn giữ ')) return royal ? 'Hộ quốc trưởng lão' : 'Trưởng lão trấn giữ';
  if (f.startsWith('Đệ tử ')) return royal ? (p.g === 'f' ? 'Công chúa' : 'Hoàng tử') : 'Đệ tử';
  // còn lại (thủ lĩnh Hồng Hoang, thiên kiêu thần giới, hồi hạ giả đã lộ…): vế đầu của lai lịch, bỏ tên thế lực
  let r = f.split(' — ')[0].split(', ')[0].trim();
  r = r.replace(/\s+(trẻ tuổi|trẻ nhất|dưới trướng|hầu cận|giữ lò|theo hầu)(\s.*)?$/, ''); // chỉ giữ tên chức: 'Quỷ sai trẻ nhất Âm ty' → 'Quỷ sai'
  if (p.sect) r = r.replace(` của ${p.sect}`, '').replace(p.sect, '').trim();
  return r || 'không chức vụ';
}
const NPC_ROLE = /(Thái thượng trưởng lão|Đại trưởng lão|Chấp pháp trưởng lão|Truyền công trưởng lão|Trưởng lão nội môn|Thánh tử|Thánh nữ|Thiếu chủ|[Gg]ia chủ|Lão tổ|Tông chủ|Chưởng môn|Thánh chủ|Cung chủ|Công chúa|Hoàng tử|Đệ tử thân truyền|Thân truyền|Đệ tử ngoại môn|Đệ tử nội môn|[Tt]rưởng lão|Đệ tử)/;
/** Chức vụ của một người quen trong nhân mạch, dò theo lai lịch. */
export function roleOfNpc(n: NPC): string {
  const m = NPC_ROLE.exec(n.how);
  if (!m) return n.sect ? 'Đệ tử' : 'không chức vụ';
  const r = m[1] === 'Thân truyền' ? 'Đệ tử thân truyền' : m[1];
  return r.charAt(0).toUpperCase() + r.slice(1);
}
export function noteOf(p: TcPerson): string {
  if (p.lord) return p.from;
  if (p.ret && !p.known) return p.sect || 'Tán tu';
  const bits = [p.beast ? `${p.beast} hóa hình, ${p.form}${p.blood ? ' · ' + p.blood : ''}` : '', p.races?.length ? `Chủng tộc: ${p.races.join(' · ')}` : p.race ? `Chủng tộc: ${p.race}` : '', p.from].filter(Boolean);
  if (p.asc) bits.push(`phi thăng ${p.asc} lần (linh hồn ${Math.floor(s.year - p.soulBorn)} tuổi)`);
  return bits.join(' · ');
}
export const myRank = (kind: 'tk' | 'cg') => board(kind).find((r) => r.mine)?.rank ?? 0;

const TH = [1, 3, 10, 50, 100];
function checkRank() {
  const T = tc();
  for (const kind of ['tk', 'cg'] as const) {
    const now = myRank(kind);
    const was = T.rank[kind];
    T.rank[kind] = now;
    if (!now || now === was) continue;
    const label = kind === 'tk' ? 'Thiên Kiêu Bảng' : 'Cường Giả Bảng';
    const cross = TH.find((t) => now <= t && (!was || was > t));
    if (cross) {
      const gain = kind === 'tk' ? [40, 20, 10, 4, 2] : [120, 60, 30, 12, 5];
      s.fame += gain[TH.indexOf(cross)] * Math.max(1, s.r);
      addLog(`Thiên Cơ Lâu ${WORLDS[worldOf()]} cập nhật bảng: ngươi ${now === 1 ? 'đứng đầu' : `vào hạng ${now}`} ${label}. Danh tiếng lan khắp giới.`, 'good');
      if (now === 1) mark(`Đứng đầu ${label} ${WORLDS[worldOf()]}`);
    } else if (was && now > was && TH.some((t) => was <= t && now > t)) addLog(`Thiên Cơ Lâu cập nhật bảng: ngươi tụt xuống hạng ${now} ${label}.`);
  }
}

/** Người chơi gặp một hồi hạ giả: biến thành NPC trong nhân mạch và gắn với mục trên bảng. */
export function linkNpc(p: TcPerson, n: NPC) {
  p.npc = n.id;
  n.talent = Math.max(n.talent, p.talent);
  n.craft ??= p.craft ? { ...p.craft } : undefined;
  n.beast ??= p.beast;
  n.race ??= p.race;
  n.evolution ??= p.evolution;
  n.blood ??= p.blood;
}
/** Mua Thiên Cơ Lục: lộ lai lịch mọi hồi hạ giả đang ở giới này. */
export function revealAll(w = worldOf()): TcPerson[] {
  const out = tcPeople().filter((p) => p.alive && p.world === w && p.ret && !p.known);
  for (const p of out) p.known = true;
  (tc().bought ||= {})[w] = true;
  return out;
}
export const infoBought = (w = worldOf()) => !!tc().bought?.[w];
/** Giới thiệu Thiên Cơ Lâu và luật phi thăng (hiện ở bảng giới thiệu). */
export const TC_INTRO = [
  'Thiên Cơ Lâu không thuộc tông môn hay hoàng triều nào. Lầu dựng ở mọi giới, từ Thương Lan tới Hỗn Độn; phân lâu giới nào chỉ biết chuyện giới ấy, nhưng cái gì đã biết thì không sai. Thiên Cơ Lâu không nói dối — chỉ bán đắt.',
  'Mỗi phân lâu giữ hai bảng. Thiên Kiêu Bảng xếp người trẻ theo cảnh giới và tuổi thân thể; Cường Giả Bảng xếp kẻ mạnh nhất giới. Bảng chỉ ghi người đang đứng trong giới: ai phi thăng là tên bị gạch khỏi bảng hạ giới và chép sang lầu giới trên.',
  'Luật phi thăng: vượt kiếp xong, pháp tắc giới mới ép thân thể về hình hài một tuổi. Tâm trí, ký ức, ngộ tính giữ nguyên; tuổi linh hồn chỉ tăng; thọ nguyên tính lại từ đầu nên cộng dồn qua từng giới. Khác hài nhi thường, kẻ phi thăng tu luyện được ngay từ một tuổi — đặc quyền phi thăng.',
  'Có lời đồn rằng vài thế lực hàng đầu Hỗn Độn từng đưa người xuống Thương Lan tu hành lại từ những bước chân đầu tiên, nhưng thật giả ra sao, ai đã đến và họ đang ở đâu đều không thể xác nhận nếu chưa có chứng cứ.',
];
