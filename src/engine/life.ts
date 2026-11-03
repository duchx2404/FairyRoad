import { worldDefinitions } from '../data/local-items';
// Đầu thai, cái chết, điểm số, luân hồi và thành tựu.
import { kmSyncSkills, kmFillNew, kmAutoAll } from './kinhmach';
import { setSurname, splitName, HOLY_SUR, holySur, EL, WORLD, worldName, ROOTS, BODIES, BEAST_BODIES, ORIGINS, PERKS, BEAST_PERKS, originName, CLANS, type Origin, STAT_KEYS, BASIC_EL, VARIANT_EL, VARIANT_W, YINYANG_EL, BATQUAI, ALL_EL, THAP, HON_DON_ROOT, hiddenRootKind, REALMS, STAGES, type El, type StatKey } from '../data/core';
import { BEASTS, LOCS, LOC_LIST, SECTS, RK, REGIONS, applyWorld, beastRoot, worldPack, beastLeafNodes } from '../data/world';
import { tryEvolvePlayerBeast } from './beast-evolution';
import { mkGear, BEAST_INNATE_SKILLS } from '../data/items';
import { mkNgocBoiDoi } from './items';
import { lineTop } from './combat';
import { joinSect } from './sect';
import { TECHS, MAX_SKILLS } from '../data/items';
import { s, meta, setState, save, saveMeta, codexAdd, type State, type LifeRec } from './state';
import { setLoc, mkNpc, mkName, addNpc, mark, addLog, clearPendingDeath, friends, renameNpc, holyNpcName } from './core';
import { root, age, rootLabel, powerScore, stageName, regrowGear } from './char';
import { hooks } from './bus';
import { mkBrideBio } from './bride';
import { ch, pick, ri, shuffle, uid, wpick, clamp } from '../core/util';
import { identifyYaoSpecies, ensurePlayerYaoSurname, mkYaoKinName, getYaoHomeLoc } from './yao-territory';

export interface Fate {
  stats: Record<StatKey, number>;
  root: { k: number; els: El[] };
  body: string;
  perkOffer: string[];
}

/** Chế độ tự do: mở hết xuất thân, nâng cấp luân hồi tối đa, gieo mệnh không giới hạn, tự chọn mệnh số và thiên phú. */
export const freeMode = () => !!meta.settings.free;
export const upLv = (k: string) => (freeMode() ? (UPGRADES.find((u) => u.id === k)?.max ?? (meta.up[k] || 0)) : meta.up[k] || 0);
export const UPGRADES: { id: string; n: string; d: string; max: number; cost: (lv: number) => number }[] = [
  { id: 'reroll', n: 'Luân hồi kính', d: 'Thêm 1 lần gieo lại mệnh số khi đầu thai.', max: 5, cost: (l) => 8 + l * 8 },
  { id: 'stats', n: 'Tiền kiếp thể ngộ', d: 'Mỗi cấp +1 điểm thuộc tính ngẫu nhiên khi đầu thai.', max: 6, cost: (l) => 12 + l * 10 },
  { id: 'root', n: 'Mạnh Bà bớt canh', d: 'Linh căn tốt dễ xuất hiện hơn.', max: 3, cost: (l) => 25 + l * 25 },
  { id: 'money', n: 'Kho báu mai táng', d: 'Linh thạch khởi đầu ×(1 + cấp).', max: 3, cost: (l) => 6 + l * 6 },
  { id: 'memory', n: 'Ký ức dẫn khí', d: 'Đầu thai đã nhớ Thanh Tâm Dẫn Khí Thuật.', max: 1, cost: () => 20 },
  { id: 'perk', n: 'Thêm thiên phú', d: 'Chọn 3 thiên phú thay vì 2.', max: 1, cost: () => 45 },
  { id: 'life', n: 'Diên thọ phù', d: 'Thọ nguyên +5% mỗi cấp.', max: 4, cost: (l) => 15 + l * 15 },
];
export function buyUpgrade(id: string): boolean {
  const u = UPGRADES.find((x) => x.id === id)!;
  const lv = meta.up[id] || 0;
  if (lv >= u.max) return false;
  const c = u.cost(lv);
  if (meta.karma < c) return false;
  meta.karma -= c;
  meta.up[id] = lv + 1;
  saveMeta();
  return true;
}
export const originUnlocked = (id: string) => {
  const o = ORIGINS.find((x) => x.id === id)!;
  return freeMode() || !o.karma || (meta.up['origin_' + id] || 0) > 0;
};
export function unlockOrigin(id: string): boolean {
  const o = ORIGINS.find((x) => x.id === id)!;
  if (!o.karma || originUnlocked(id) || meta.karma < o.karma) return false;
  meta.karma -= o.karma;
  meta.up['origin_' + id] = 1;
  saveMeta();
  return true;
}
export const rerolls = () => (freeMode() ? 999 : 2 + upLv('reroll'));

export function rollRoot(boost = false): { k: number; els: El[] } {
  const ub = upLv('root');
  const w = (r: (typeof ROOTS)[number]) => r.w * (r.q >= 4 ? 1 + ub * 0.6 : 1) * (r.q === 0 ? 1 / (1 + ub) : 1);
  let k = ROOTS.indexOf(wpick(ROOTS, w));
  if (boost) {
    const k2 = ROOTS.indexOf(wpick(ROOTS, w));
    if (ROOTS[k2].q > ROOTS[k].q) k = k2;
  }
  let els: El[] = [];
  if (k === 1) els = [...BASIC_EL];
  else if (k >= 2 && k <= 5) els = shuffle([...BASIC_EL]).slice(0, [0, 5, 4, 3, 2, 1][k]);
  else if (k === 6) els = ch(0.08) ? [pick(YINYANG_EL)] : [wpick(VARIANT_EL, (e) => VARIANT_W[e] || 1)]; // 8% dị linh căn là Âm hoặc Dương
  else if (k === BATQUAI) els = ['yin', 'yang'];
  else if (k === 11) els = [...ALL_EL];
  return { k, els };
}

export function rollFate(boostRoot = false, g: 'm' | 'f' = 'm', isBeastRace = false): Fate {
  const stats = { can: 0, ngo: 0, van: 0, mi: 0, tam: 0 } as Record<StatKey, number>;
  for (const k of STAT_KEYS) stats[k] = ri(2, 7);
  for (let i = 0; i < upLv('stats'); i++) stats[pick(STAT_KEYS)]++;
  if (isBeastRace) {
    const bodies = BEAST_BODIES;
    const body = pick(bodies).id;
    const perkOffer = shuffle(BEAST_PERKS.map((p) => p.id)).slice(0, 5);
    return { stats, root: { k: 0, els: [] }, body, perkOffer };
  }
  const bodies = BODIES.filter((b) => !b.g || b.g === g);
  const body = wpick(bodies, (b) => b.w).id;
  const perkOffer = shuffle(PERKS.map((p) => p.id)).slice(0, 5);
  return { stats, root: rollRoot(boostRoot), body, perkOffer };
}

/** Thánh tử/nữ: linh căn phải hợp thánh địa — đổi thành Đơn hoặc Dị linh căn cùng hệ nếu chưa đạt. */
export function fitRoot(fate: Fate, o: Origin) {
  if (!o.sect) return fate;
  const sc = SECTS[o.sect];
  const ok = ROOTS[fate.root.k].q >= sc.minQ && fate.root.els.some((e) => sc.el.includes(e));
  if (ok) return fate;
  const e = pick(sc.el);
  const variant = VARIANT_EL.includes(e);
  fate.root = { k: variant ? 6 : 5, els: [e] };
  return fate;
}

/** Công tử thánh địa: dù bị coi là phế vật, vẫn là đệ tử chính thức với đãi ngộ Thân truyền. */
export function scionEnroll(sectId: string) {
  if (s.sect) return;
  const keepTech = s.tech, keepKnown = [...s.known], keepSkills = [...s.skills];
  joinSect(sectId, RK.THANTRUYEN);
  // trưởng bối thu lại chân truyền công pháp lúc bị phán phế — giữ công pháp cũ
  s.tech = keepTech; s.known = keepKnown; s.skills = keepSkills; s.techM = 0;
  s.sect!.lastPay = Math.floor(s.year);
}

export interface NewLifeOpts {
  name: string;
  g: 'm' | 'f';
  origin: string;
  fate: Fate;
  perks: string[];
  beast?: string;
}

/** Thiên phú có hợp với xuất thân không: Diệp gia Hỗn Độn còn nguyên gia tộc nên không thể mang "huyết hải thâm thù" (kẻ thù diệt môn) — chỉ chọn một trong hai. */
export const perkAllowed = (origin: string, perk: string) => !(origin === 'diep_hondon' && perk === 'thuhan');
/**
 * Người chủ chốt của thế gia. Tộc có hàng trăm người, Nhân mạch chỉ ghi người quan trọng
 * (phu nhân gia chủ, trưởng lão, thúc bá, anh chị em); hạ nhân, tộc nhân thường không ghi.
 */
function clanHouse(clan: (typeof CLANS)[string], fam: ReturnType<typeof mkNpc>, hd: boolean, hasRival: boolean, shift = 0) {
  s.flags.clanHouseV1 = true;
  const diep = clan.id === 'diep';
  const used = new Set(s.npcs.map((n) => n.name).concat(fam.name, s.name));
  const nameOf = (g: 'm' | 'f') => {
    for (let i = 0; i < 30; i++) {
      const nm = clan.sur + ' ' + mkName(g).split(' ').slice(-1)[0];
      if (!used.has(nm)) { used.add(nm); return nm; }
    }
    return clan.sur + ' ' + mkName(g).split(' ').slice(-1)[0];
  };
  // shift: số năm đã trôi qua từ đầu kiếp (bổ sung cho bản lưu cũ)
  const kin = (r: number, st: number, g: 'm' | 'f', age: number, rel: number, how: string, talent = 0.7) =>
    addNpc(mkNpc({ r, st, g, age: age + shift, rel, how, talent, tag: 'kin', sect: clan.patron, el: pick(clan.el), name: nameOf(g) }));
  const pg = fam.g === 'm' ? 'f' : 'm';
  const pr = hd ? (pg === 'm' ? 'Dưỡng phụ' : 'Dưỡng mẫu') : pg === 'm' ? 'Phụ thân' : 'Mẫu thân';
  // cha/mẹ còn lại
  kin(fam.r, ri(0, 2), pg, ri(32, 44), hd ? 65 : 75,
    diep ? `${pr}, ${pg === 'f' ? 'phu nhân' : 'phu quân'} của gia chủ Diệp thị — lo liệu nội vụ tổ trạch suốt những năm gia tộc lụi tàn`
      : `${pr}, ${pg === 'f' ? 'phu nhân' : 'phu quân'} của trưởng lão ${fam.name}`);
  // gia chủ (thế gia thường: cha mẹ chỉ là trưởng lão Kết Đan)
  if (!diep) kin(Math.max(3, Math.min(clan.ancestor - 1, 4)), 3, 'm', ri(140, 260), 45, `Gia chủ ${clan.n}, nắm quyền cả tộc`, 0.7);
  // trưởng lão
  kin(diep ? 3 : Math.max(3, Math.min(clan.ancestor - 1, 4)), diep ? 0 : ri(0, 2), ch(0.7) ? 'm' : 'f', diep ? ri(300, 340) : ri(200, 320), 50,
    diep ? 'Đại trưởng lão Diệp thị, giữ từ đường và tộc quy. Thọ nguyên đã cạn quá nửa, vẫn chưa chịu rời ghế' : `Đại trưởng lão ${clan.n}, giữ từ đường và tộc quy`, 0.6);
  kin(diep ? 2 : 3, ri(2, 3), ch(0.6) ? 'm' : 'f', ri(90, 160), 40,
    diep ? 'Chấp pháp trưởng lão Diệp thị — tay nghiêm khắc nhất tộc, coi trọng tổ huấn hơn tình thân' : `Chấp pháp trưởng lão ${clan.n}, nghiêm khắc, coi trọng tổ huấn hơn tình thân`, 0.7);
  kin(2, ri(1, 3), ch(0.5) ? 'm' : 'f', ri(70, 130), 55,
    diep ? 'Truyền công trưởng lão Diệp thị, dạy con cháu trong tộc nhập môn' : `Truyền công trưởng lão ${clan.n}, dạy con cháu trong tộc nhập môn`, 0.8);
  // thúc bá: em ruột cha/mẹ đang làm gia chủ
  const uncle = kin(2, ri(0, 2), 'm', ri(30, 42), hd ? 35 : 55,
    diep ? `Nhị thúc, em ruột gia chủ — chạy vạy giữ mấy cửa hiệu, mấy mỏ linh thạch cuối cùng của Diệp thị ở các châu` : `Nhị thúc, em ruột ${fam.how.startsWith('Phụ') ? 'phụ thân' : 'mẫu thân'}, quản sản nghiệp của tộc`);
  // anh chị em
  const sg: 'm' | 'f' = ch(0.5) ? 'm' : 'f';
  const sibAge = hd ? ri(5, 9) : ri(12, 16);
  kin(1, ri(0, 3), sg, sibAge, hd ? 70 : 75,
    hd ? `${sg === 'm' ? 'Nghĩa huynh' : 'Nghĩa tỷ'}, con ruột gia chủ Diệp thị — từ ngày ngươi được bế về, ${sg === 'm' ? 'hắn' : 'nàng'} coi ngươi như em ruột`
      : `${sg === 'm' ? 'Huynh trưởng' : 'Tỷ tỷ'} ruột${diep ? ', cùng lớn lên trong tổ trạch Diệp thị' : ''}`, 1);
  // dòng chính Hỗn Độn: đường huynh mất suất kế thừa vào tay đứa con nuôi
  if (hd && !hasRival) {
    addNpc(mkNpc({ r: 1, st: ri(0, 2), g: 'm', age: ri(10, 13) + shift, rel: -25, tag: 'rival', sect: clan.patron, el: pick(clan.el), talent: 1.2, name: nameOf('m'),
      how: `Đường huynh, con trai ${uncle.name} — vốn được xem là người kế thừa, cho tới ngày gia chủ nhận nuôi ngươi` })); // tag rival: đối thủ trong sự kiện tranh ngôi gia chủ
  }
}

/** NPC đang giữ danh vị Thánh tử / Thánh nữ của thánh địa nào (dò theo lai lịch), hoặc null. */
export function holyRoleOf(n: { how: string; g: 'm' | 'f'; sect: string | null }): string | null {
  if (!n.sect || !SECTS[n.sect] || !HOLY_SUR[n.sect]) return null;
  const sc = SECTS[n.sect].n, role = n.g === 'f' ? 'nữ' : 'tử';
  const h = n.how;
  return h.startsWith(`Thánh ${role} ${sc}`) || h.includes(`cũng là Thánh ${role} ${sc}`) || h.startsWith(`Tân thánh ${role} của ${sc}`) ? n.sect : null;
}
/** Bản lưu cũ: Thánh tử / Thánh nữ mọi thánh địa đổi sang họ cố định của tông (HOLY_SUR), giữ tên riêng. */
export function syncHolySurnames() {
  if (s.flags.holySurV2) return;
  s.flags.holySurV2 = true;
  for (const n of s.npcs) {
    const id = holyRoleOf(n);
    const sur = holySur(id, n.g);
    if (!sur) continue;
    const { sur: cur, given } = splitName(n.name);
    if (cur === sur) continue;
    if (renameNpc(n, `${sur} ${given}`)) renameNpc(n, holyNpcName(id, n.g)!); // trùng tên người khác thì lấy tên riêng mới
  }
}

/** Bản lưu cũ: thế gia chỉ có cha mẹ + lão tổ → bổ sung người chủ chốt của tộc. */
export function syncClanHouse() {
  if (s.flags.clanHouseV1 || !s.flags.clan) return;
  s.flags.clanHouseV1 = true;
  const clan = CLANS[s.flags.clan as string];
  if (!clan) return;
  const isSur = (n: { name: string }) => n.name.startsWith(clan.sur + ' ');
  if (s.npcs.filter((n) => n.tag === 'kin' && isSur(n)).length >= 5) return;
  const fam = s.npcs.find((n) => n.tag === 'kin' && isSur(n) && /^(Phụ thân|Mẫu thân|Dưỡng phụ|Dưỡng mẫu)/.test(n.how));
  if (!fam) return;
  const hd = s.origin === 'diep_hondon';
  const shift = Math.max(0, Math.floor(age()) - (hd ? 1 : 10));
  clanHouse(clan, fam, hd, s.npcs.some((n) => n.tag === 'rival' && isSur(n)), shift);
}

export function newLife(o: NewLifeOpts) {
  // Kiếp trước có thể kết thúc ở giới cao: nạp lại Thương Lan trước khi tra địa điểm xuất phát và loài yêu thú.
  WORLD.lv = 0;
  applyWorld(0);
  const org = ORIGINS.find((x) => x.id === o.origin)!;
  o.perks = [...new Set([...o.perks, ...(org.forcePerks ?? [])])].filter((p) => perkAllowed(o.origin, p));
  const leafNodes = beastLeafNodes();
  let beastSpecies: { n: string; el: El; reg?: string[]; home?: string } | undefined;
  if (org.beastOrigin) {
    if (o.beast) {
      beastSpecies = leafNodes.find((b) => b.n === o.beast) || BEASTS.find((b) => b.n === o.beast) || { n: o.beast, el: 'hoa' };
    } else {
      beastSpecies = pick(leafNodes);
    }
  }
  const beast = beastSpecies?.n;
  const isYaoBeast = org.beastOrigin || org.race === 'Yêu tộc';
  let startLoc: (typeof LOC_LIST)[number];

  if (isYaoBeast) {
    // Người chơi Yêu thú được sinh ra trong khu vực lãnh thổ loài của mình
    const homeLocId = getYaoHomeLoc(beast);
    startLoc = LOCS[homeLocId] || LOCS['thapvan'] || LOC_LIST[0];
  } else {
    startLoc = LOCS[org.loc] || LOC_LIST[0];
  }

  if (!startLoc) throw new Error(`Unknown starting location "${org.loc}" for origin "${org.id}"`);
  const startAge = 1; // Tất cả xuất thân đều bắt đầu từ 1 tuổi
  const year = meta.worldYear + ri(1, 30);
  const stats = { ...o.fate.stats };
  for (const [k, v] of Object.entries(org.stat || {})) stats[k as StatKey] += v as number;
  if (o.perks.includes('chanhan')) stats.ngo += 2;
  if (o.perks.includes('dakhoe')) stats.can += 2;
  if (o.perks.includes('phuctinh')) stats.van += 2;
  if (o.perks.includes('tinhtam')) stats.tam += 2;
  if (o.perks.includes('xuixeo')) stats.van -= 3;
  if (o.perks.includes('benhtat')) { stats.can -= 2; stats.tam += 2; }
  const st: State = {
    v: 1,
    id: uid(),
    name: o.name,
    g: o.g,
    origin: o.origin,
    race: org.race || (org.beastOrigin ? 'Yêu tộc' : undefined),
    beast,
    year,
    born: year - startAge,
    stats,
    root: (org.race === 'Yêu tộc' || org.beastOrigin) ? { k: 0, els: beastSpecies ? [beastSpecies.el] : ['hoa'] } : o.fate.root,
    body: o.fate.body,
    perks: o.perks,
    r: 0,
    st: 0,
    prog: 0,
    hurt: 0,
    tamma: 0,
    money: org.money * (1 + upLv('money')),
    loc: startLoc.id,
    x: 0,
    y: 0,
    tech: null,
    techM: 0,
    known: [],
    skills: [],
    gear: [null, null, null, mkNgocBoiDoi(), null],
    gearBag: [],
    refining: null,
    bag: [],
    meridians: 0,
    merProg: 0,
    sect: null,
    sectHist: {},
    npcs: [],
    craft: { alch: org.craft === 'alch' ? 1 : 0, talis: org.craft === 'talis' ? 1 : 0, forge: org.craft === 'forge' ? 1 : 0, ax: 0, tx: 0, fx: 0 },
    recipes: org.craft === 'alch' ? ['hoixuandan', 'tukhi'] : org.craft === 'talis' ? ['hoaphu', 'kimcangphu'] : [],
    lifeBonus: 0,
    lifePills: 0,
    fame: 0,
    evil: 0,
    good: 0,
    kills: 0,
    wins: 0,
    flags: { yearStart: year, fleeAt: 0.3, initialBeast: beast, beastBlood: beast ? `${beast} · huyết mạch sơ khai` : undefined, mapV2: true, rankV2: true, mapV3: true, mapV4: true, mapV5: true, mapV6: true, mapV7: true, mapV8: true, mapV9: true, mapV10: true, mapV11: true, mapV12: true, mapV13: true, mapV14: true },
    evSeen: {},
    log: [],
    marks: [],
    pins: [],
    turns: 0,
    bestPower: 0,
  };
  setState(st);
  WORLD.lv = 0;
  applyWorld(0);
  clearPendingDeath();
  setLoc(startLoc.id);
  if (o.fate.root.k === 0) s.flags.wasMortalRoot = true;

  if (org.clan && !s.name.startsWith(org.clan + ' ')) s.name = setSurname(s.name, org.clan);
  { const hs = holySur(org.sect, s.g); if (hs) s.name = setSurname(s.name, hs); } // xuất thân Thánh tử / Thánh nữ: mang họ cố định của thánh địa
  if (isYaoBeast) {
    const yaoSpec = identifyYaoSpecies(beast);
    s.name = ensurePlayerYaoSurname(s.name, beast);
    // Cùng 1 loài thì cùng họ khác tên: Sinh các đồng tộc thân hữu
    const kin1 = mkNpc({ name: mkYaoKinName(yaoSpec, 'm'), r: 1, st: 1, rel: 45, how: `Đồng tộc huynh đệ loài ${yaoSpec.name}` });
    const kin2 = mkNpc({ name: mkYaoKinName(yaoSpec, 'f'), r: 1, st: 0, rel: 40, how: `Đồng tộc muội muội loài ${yaoSpec.name}` });
    const kin3 = mkNpc({ name: mkYaoKinName(yaoSpec, 'm'), r: 2, st: 2, rel: 60, how: `Trưởng bối đồng tộc loài ${yaoSpec.name}` });
    s.npcs.push(kin1, kin2, kin3);
    addLog(`Đầu thai làm ${beast || 'Yêu thú'} tại lãnh địa loài 【${startLoc.n}】! Mang họ 【${yaoSpec.surname}】 theo huyết mạch của loài.`, 'good');
  }
  if (s.name.startsWith('Diệp ')) s.flags.diepBlood = true; // cơ chế ẩn: họ Diệp là huyết mạch Diệp thị Hoang Cổ
  if (org.startR) { s.r = org.startR; s.st = 0; }
  if (org.gearG !== undefined) { const gr = mkGear(Math.max(1, org.startR || 0), org.gearG, 0); gr.refined = true; s.gear[0] = gr; }
  const lb = upLv('life');
  if (lb) s.lifeBonus = Math.round(REALMS[0].life * 0.05 * lb);
  const isYaoOrg = org.race === 'Yêu tộc' || org.beastOrigin;
  if (org.tech || upLv('memory') || isYaoOrg) {
    const defaultTech = isYaoOrg ? 'thonnguyetquyet' : 'thanhtam';
    const t = isYaoOrg ? (org.tech || 'thonnguyetquyet') : (org.tech || 'thanhtam');
    s.tech = t;
    for (const k of TECHS[t]?.skills || []) {
      if (!s.known.includes(k)) s.known.push(k);
      if (!s.skills.includes(k)) s.skills.push(k);
    }
    codexAdd('tech', t);
  }
  if (org.race === 'Yêu tộc' || org.beastOrigin) {
    if (!s.perks.includes('yeudan')) s.perks.push('yeudan');
    const beastEl = beastSpecies?.el || 'hoa';
    const innate = BEAST_INNATE_SKILLS[beastEl] || 'yeu_hoangao';
    for (const sk of ['yeu_hoangao', innate]) {
      if (!s.known.includes(sk)) s.known.push(sk);
      if (!s.skills.includes(sk)) s.skills.push(sk);
    }
  }
  if (org.herb) s.bag.push({ id: 'h:ngungkhithao', n: org.herb });
  if (org.craft === 'talis') s.bag.push({ id: 'm:phuchi', n: 6 }, { id: 'm:chusa', n: 4 });
  // người thân, bạn thơ ấu
  const fam = mkNpc({ r: 0, tag: 'kin', rel: 70, how: org.id === 'hieuthuoc' ? 'Ông lang nuôi ngươi khôn lớn' : 'Người nhà', age: ri(34, 46), g: ch(0.5) ? 'm' : 'f', sect: null, talent: 0 });
  if (org.id === 'hieuthuoc') { fam.g = 'm'; fam.born = s.year - 61; fam.life = 78; }
  if (org.id === 'giatoc') fam.name = 'Cố ' + fam.name.split(' ').slice(1).join(' ');
  const clan = org.clanId ? CLANS[org.clanId] : null;
  const withSur = (sur: string, nm: string) => sur + ' ' + nm.split(' ').slice(-1)[0];
  if (clan) {
    s.flags.clan = clan.id;
    fam.name = withSur(clan.sur, fam.name); fam.r = 3; fam.st = 1; fam.talent = 0.8; fam.life = 460; fam.el = clan.el[0];
    fam.how = `${fam.g === 'm' ? 'Phụ thân' : 'Mẫu thân'}, trưởng lão Kết Đan của ${clan.n}`;
    const anc = mkNpc({ r: clan.ancestor, st: 2, tag: 'kin', rel: 50, sect: clan.patron, el: clan.el[0], how: `Lão tổ ${clan.n}, bế quan đã lâu`, age: Math.round(REALMS[clan.ancestor].life * 0.6), talent: 0.6 });
    anc.name = withSur(clan.sur, anc.name);
    if (org.id === 'diep_hondon') { // dòng chính Hỗn Độn
      s.flags.hondonBlood = true;
      s.flags.childhood = true; // 1–6 tuổi: chưa tu luyện
      s.flags.dhHeir = true;
      s.flags.dhStipend = true;
      if (s.root.k !== HON_DON_ROOT) s.root = { k: THAP, els: ALL_EL.slice() }; // Thập linh căn — đá trắc linh không đo được
      // hôn ước với các thánh nữ: ba thánh địa + thánh nữ Khương thị (thế gia đồng minh)
      // hôn ước: ít nhất 3 thánh địa, có thể nhiều hơn; thế gia Trung Vực ngẫu nhiên;
      // có tỉ lệ "đại hôn ước" với tất cả thánh địa và mọi thế gia Trung Vực
      const shuffle = <X,>(a: X[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
      const allHoly = Object.values(SECTS).filter((x) => x.tier === 4);
      const trungClans = Object.values(CLANS).filter((c) => c.id !== 'diep' && LOCS[c.seat] && REGIONS[LOCS[c.seat].reg]?.vuc === 'trung');
      const dao = o.perks.includes('dinhvan'); // thiên phú Đào hoa: nhiều hôn ước hơn
      const grand = Math.random() < (dao ? 0.3 : 0.12);
      const extra = dao ? 1 + Math.floor(Math.random() * (allHoly.length - 3)) : Math.random() < 0.5 ? Math.floor(Math.random() * (allHoly.length - 2)) : 0;
      const holy = grand ? allHoly : shuffle(allHoly).slice(0, Math.min(allHoly.length, 3 + extra));
      const clans = grand ? trungClans : trungClans.filter(() => Math.random() < (dao ? 0.65 : 0.35));
      const given = shuffle(['Uyển Nhi', 'Thiên Tuyết', 'Như Mộng', 'Vân Khê', 'Thanh Ca', 'Ngọc Dao', 'Mạn Thanh', 'Tử Yên']);
      const ids: string[] = [];
      for (const h of holy) {
        const bg: 'm' | 'f' = s.g === 'f' ? 'm' : 'f'; // người chơi nữ thì hôn ước với Thánh tử
        const b = mkNpc({ r: 0, st: 0, g: bg, tag: 'friend', rel: 30, age: 1, talent: 1.8, sect: h.id, how: `Thánh ${bg === 'm' ? 'tử' : 'nữ'} ${h.n} — hôn ước từ khi còn trong nôi`, name: holyNpcName(h.id, bg) ?? mkName(bg) }); // họ cố định theo thánh địa (HOLY_SUR), tên riêng ngẫu nhiên
        b.bio = mkBrideBio('holy'); b.el = b.bio.els![0]; b.talent = 1.5 + Math.random() * 0.5; b.pic = 'pc_' + bg; // Thánh nữ dùng ảnh Nữ chính đã huấn luyện, Thánh tử dùng ảnh Nam chính
        addNpc(b); ids.push(b.id);
      }
      for (const c of clans) {
        const bg: 'm' | 'f' = s.g === 'f' ? 'm' : 'f';
        const b = mkNpc({ r: 0, st: 0, g: bg, tag: 'friend', rel: 30, age: 1, talent: 1.6, sect: c.patron, how: `Thánh ${bg === 'm' ? 'tử' : 'nữ'} ${c.n} — hôn ước từ khi còn trong nôi`, name: bg === 'm' ? `${c.sur} ${mkName('m').split(' ').slice(1).join(' ')}` : `${c.sur} ${given.pop() ?? 'Linh'}` });
        b.pic = 'pc_' + bg;
        b.bio = mkBrideBio('clan'); b.el = b.bio.els![0]; b.talent = 1.4 + Math.random() * 0.5;
        addNpc(b); ids.push(b.id);
      }
      if (grand) mark('Đại hôn ước: tất cả thánh địa và thế gia Trung Vực đều định thân với ngươi');
      s.flags.dhBrides = ids;
      // tiên kiếm tàn khuyết, lớn theo tu vi
      s.gear[0] = { uid: uid(), slot: 0, n: 'Hỗn Độn Kiếm (Tàn khuyết)', g: 1, q: 0, lv: 0, el: null, atk: 0, def: 0, hp: 0, cult: 0, luck: 2, cap: 0, refined: true, grow: true };
      anc.how = 'Lão tổ Diệp thị Hoang Cổ — người duy nhất nhận ra huyết mạch Hỗn Độn trong người ngươi';
      fam.how = `${fam.g === 'm' ? 'Dưỡng phụ' : 'Dưỡng mẫu'}, gia chủ Diệp thị Hoang Cổ — người nhặt ngươi từ chiếc nôi rơi xuống từ khe nứt không gian`;
      fam.r = 2; fam.life = 220;
    } else if (clan.id === 'diep') {
      s.flags.hondonBlood = true;
      s.gear[0] = { uid: uid(), slot: 0, n: 'Hỗn Độn Kiếm (Tàn khuyết)', g: 1, q: 0, lv: 0, el: null, atk: 0, def: 0, hp: 0, cult: 0, luck: 2, cap: 0, refined: true, grow: true };
      // gia tộc suy tàn: lão tổ cuối cùng sắp tọa hóa, cha mẹ chỉ còn Trúc Cơ
      anc.how = 'Lão tổ cuối cùng của Diệp thị Hoang Cổ, thọ nguyên sắp cạn';
      anc.born = s.year - Math.round(anc.life * 0.94);
      fam.r = 2; fam.life = 220;
      fam.how = `${fam.g === 'm' ? 'Phụ thân' : 'Mẫu thân'}, gia chủ Diệp thị Hoang Cổ — gánh cả gia tộc đang lụi tàn`;
    }
    addNpc(anc);
    for (const fid of clan.foes) {
      const f = CLANS[fid];
      addNpc(mkNpc({ r: 1, st: 2, tag: 'enemy', rel: -45, el: f.el[0], sect: f.patron, how: `Thiếu chủ ${f.n} — thế gia đối địch. ${clan.foes[0] === fid ? clan.feud : ''}`.trim(), age: ri(11, 15), talent: 1.1, name: withSur(f.sur, mkName(ch(0.5) ? 'm' : 'f')) }));
    }
    for (const aid of org.id === 'diep_hondon' ? [] : clan.allies.slice(0, 1)) {
      const a = CLANS[aid];
      const g2 = s.g === 'm' ? 'f' : 'm';
      addNpc(mkNpc({ r: 1, st: 0, tag: 'friend', rel: 45, g: g2, el: a.el[0], how: `Con cháu ${a.n}, thế gia đồng minh. Hai nhà từng nhắc chuyện hôn ước`, sect: a.patron, age: ri(1, 2), talent: 1, name: withSur(a.sur, mkName(g2)) }));
    }
    if (clan.patron) s.bag.push({ id: 'x:kiemlenh', n: 1 });
    // công pháp gia truyền: phẩm Hoàng/Huyền hợp linh căn, ưu tiên hệ của tộc
    const fit = worldDefinitions('cp').filter((x) => !x.blood && !x.celestial && x.tier <= 2 && !x.evil && x.el.some((e) => s.root.els.includes(e)))
      .sort((a, b) => b.tier - a.tier || Number(b.el.some((e) => clan.el.includes(e))) - Number(a.el.some((e) => clan.el.includes(e))));
    if (fit.length) {
      s.tech = fit[0].id;
      for (const k of fit[0].skills) if (!s.known.includes(k)) { s.known.push(k); if (s.skills.length < MAX_SKILLS) s.skills.push(k); }
      codexAdd('tech', fit[0].id);
    }
  }
  if (org.sect) { fam.how = 'Người nhà phàm trần, đã lâu không gặp'; fam.rel = 40; }
  addNpc(fam);
  if (clan) clanHouse(clan, fam, org.id === 'diep_hondon', !!org.rival);
  if (!o.perks.includes('cotrung')) {
    addNpc(mkNpc({ r: 0, tag: 'friend', rel: 45, how: 'Bạn chơi từ thuở nhỏ', age: ri(1, 2), sect: null, talent: ch(0.4) ? 0.8 : 0 }));
  }
  if (org.rival) {
    const rv = addNpc(mkNpc({ r: 1, st: 1, tag: 'rival', rel: -40, how: org.sect ? `Ứng viên thánh truyền thua ngươi, vẫn chưa phục` : org.clan ? 'Anh em họ trong tộc, tranh suất gia chủ với ngươi' : org.id === 'thaitu' ? 'Hoàng tôn cùng dòng, coi ngươi là cái gai' : 'Đích tử trong tộc, luôn chèn ép ngươi', age: ri(2, 4), talent: 1.2 }));
    if (org.clan) rv.name = org.clan + ' ' + rv.name.split(' ').slice(-1)[0];
  }
  // tên trong nhân mạch không trùng nhau: đổi tên người đến sau; riêng cha/mẹ giữ tên (đã ghi trong mô tả người khác)
  const rename = (n: (typeof s.npcs)[number]) => {
    const sur = n.name.split(' ').slice(0, -1).join(' ');
    for (let k = 0; k < 30; k++) {
      const nm = setSurname(mkName(n.g), sur);
      if (nm !== s.name && !s.npcs.some((x) => x.name === nm)) { n.name = nm; return; }
    }
  };
  for (let i = 0; i < s.npcs.length; i++) {
    const n = s.npcs[i];
    const prev = s.npcs.find((x, j) => j < i && x.name === n.name);
    if (n.name === s.name || (prev && n !== fam)) rename(n);
    else if (prev) rename(prev);
  }
  if (o.perks.includes('thuhan')) {
    const foe = addNpc(mkNpc({ r: 2, st: 1, tag: 'enemy', rel: -100, how: 'Kẻ đã diệt cả nhà ngươi', age: ri(40, 70), talent: 0.9 }));
    s.flags.nemesis = foe.id;
  }
  if (org.sect && hiddenRootKind(s.root.k)) {
    // Sinh ra trời hiện dị tượng, được chọn làm Thánh tử; sáu tuổi trắc linh: "phế linh căn".
    // Là con cháu Thái thượng trưởng lão nên không ai dám đuổi — chỉ thành công tử ăn chơi của thánh địa.
    const sc = SECTS[org.sect];
    s.flags.holyScion = org.sect;
    scionEnroll(org.sect);
    s.money = org.money * 4 * (1 + upLv('money'));
    s.tech = 'thanhtam';
    s.techM = 0;
    s.known = [...TECHS.thanhtam.skills];
    s.skills = [...TECHS.thanhtam.skills];
    fam.r = 6; fam.st = 2; fam.sect = org.sect; fam.rel = 85; fam.talent = 0.4; fam.life = 3800; fam.born = s.year - ri(900, 1400);
    fam.name = s.name.split(' ').slice(0, -1).join(' ') + ' ' + mkName(fam.g).split(' ').slice(-1)[0];
    fam.how = `${fam.g === 'm' ? 'Phụ thân' : 'Mẫu thân'}, Thái thượng trưởng lão ${sc.n}. Người duy nhất không bao giờ gọi ngươi là phế vật`;
    fam.tag = 'kin';
    const rv = s.npcs.find((n) => n.tag === 'rival');
    if (rv) { rv.sect = org.sect; rv.name = holyNpcName(org.sect, rv.g) ?? rv.name; rv.r = 2; rv.st = 0; rv.rel = -55; rv.how = `Tân ${originName(org, rv.g).split(' ').slice(0, 2).join(' ').toLowerCase()} của ${sc.n} — người thay ngươi sau ngày ngươi bị phán phế linh căn`; }
    mark(`Ra đời giữa dị tượng, được ${sc.n} chọn sẵn làm ${originName(org, s.g)}`);
    mark('Sáu tuổi trắc linh: đá không sáng. Bị phán phế linh căn, phế bỏ danh vị');
    // hôn ước từ bé trong cùng thánh địa
    const g2: 'm' | 'f' = s.g === 'm' ? 'f' : 'm';
    const fz = addNpc(mkNpc({ r: 1, st: 2, g: g2, sect: org.sect, tag: 'friend', rel: 55, age: ri(1, 2), talent: 1.3, how: '' }));
    const elder = mkName(ri(0, 1) ? 'm' : 'f');
    fz.name = elder.split(' ').slice(0, -1).join(' ') + ' ' + mkName(g2).split(' ').slice(-1)[0];
    fz.how = `${g2 === 'f' ? 'Hôn thê' : 'Hôn phu'} từ bé — ${g2 === 'f' ? 'con gái' : 'con trai'} Trưởng lão nội môn ${elder} của ${sc.n}. Hai nhà định thân ngay ngày ngươi ra đời giữa dị tượng`;
    s.flags.betrothed = fz.id;
    addLog(`Thánh địa không đuổi con cháu Thái thượng trưởng lão. Ngươi vẫn sống trong ${sc.n}, áo gấm ngựa quý, được người ta gọi là "công tử" — sau lưng thì gọi là phế vật. Không ai biết đêm nào ngươi cũng ngồi thiền, ${s.root.k === HON_DON_ROOT ? 'mười hai' : 'mười'} dòng linh khí lặng lẽ xoay vòng.`);
  } else if (org.sect) {
    joinSect(org.sect, RK.THANHTU);
    s.flags.thanhtu = org.sect;
    s.money = org.money * (1 + upLv('money'));
    mark(`Được lập làm ${originName(org, s.g)}`);
  }
  if (s.flags.diepBlood) {
    // truyền thừa huyết mạch: Bát Cửu Huyền Công + bí tịch chế phù thượng cổ
    s.tech = 'batcuu';
    s.techM = 0;
    for (const k of TECHS.batcuu.skills) if (!s.known.includes(k)) { s.known.push(k); if (s.skills.length < MAX_SKILLS) s.skills.push(k); }
    if (org.id === 'diep_hondon' || org.clanId === 'diep') { // chọn Diệp gia: khởi đầu Hỗn Nguyên Kinh
      // Diệp gia: Hỗn Nguyên Kinh mang 3 chiêu Hỗn Độn, phẩm theo trần giới
      s.flags.hondonBlood = true; s.tech = 'honnguyenkinh';
      for (const k of TECHS.honnguyenkinh.skills) if (!s.known.includes(k)) s.known.push(k);
      s.skills = [...TECHS.honnguyenkinh.skills];
    }
    s.flags.coPhu = true;
    s.bag.push({ id: 'fq:cophu', n: 1 }, { id: 'm:phuchi', n: 6 }, { id: 'm:chusa', n: 6 }, { id: 'm:yeubiphuchi', n: 4 });
    if (s.craft.talis < 1) s.craft.talis = 1;
    for (const r of ['trantaphu', 'thanhanhphu', 'hoaphu', 'kimcangphu', 'hoixuanphu']) if (!s.recipes.includes(r)) s.recipes.push(r);
    addLog(org.id === 'diep_hondon'
      ? 'Ngày ngươi tròn một tuổi, lão tổ đặt tay lên trán ngươi rồi rụt lại như chạm phải lửa. "Huyết mạch này… không phải của Thương Lan." Trong người ngươi, một bộ công pháp chí cao tự vận chuyển — Hỗn Nguyên Kinh, công pháp trấn tộc của Diệp gia Hỗn Độn. Lão trao cho ngươi bí tịch chế phù thượng cổ — cùng thanh Hỗn Độn Kiếm (Tàn khuyết) và tấm ngọc bội Hỗn Độn đã nằm trong nôi của ngươi.'
      : org.clanId === 'diep'
      ? 'Một tuổi. Lão tổ gọi ngươi vào từ đường, đặt tay lên trán ngươi. Một luồng nhiệt chạy qua bảy mươi hai huyệt khiếu — Bát Cửu Huyền Công, chỉ máu họ Diệp mới mở được. Rồi lão đưa ngươi cuốn da thú cũ: "Bí tịch chế phù thượng cổ. Nhà ta mất hết, chỉ còn giữ được hai thứ này."'
      : 'Một tuổi. Trong tay nải cha mẹ để lại có một cuốn da thú cũ khắc chữ "Diệp" và một tấm ngọc giản. Ngươi vừa chạm vào, một luồng nhiệt chạy qua bảy mươi hai huyệt khiếu — như có thứ gì trong máu vừa thức dậy.', 'good');
  }
  s.flags.soulBorn = s.born; // tuổi linh hồn tính từ lần sinh đầu tiên
  mark(`Sinh ra tại ${startLoc.n}, ${((x) => x[0].toLowerCase() + x.slice(1))(originName(org, s.g))}${beast ? `, yêu thú loài ${beast}` : ''}`);
  if (org.race === 'Yêu tộc' || org.beastOrigin) {
    addLog(`Một tuổi. Ngươi là yêu thú loài ${beast}, sinh ra không có linh căn người phàm. Trong đan điền, một viên ${beastSpecies?.el ? EL[beastSpecies.el].n : 'Hỏa'} hệ Yêu Đan đang chậm rãi xoay chuyển, vận hành Thôn Nguyệt Thổ Nạp Quyết hấp thu nhật nguyệt tinh hoa rèn đúc nhục thân.`);
  } else if (org.id === 'diep_hondon') addLog('Một tuổi. Ngươi lớn lên ở Diệp gia Tổ Địa, là con nuôi của gia chủ và người kế thừa đã được chỉ định. Các vị thánh nữ có hôn ước với ngươi đều sinh cùng năm.');
  else if (hiddenRootKind(o.fate.root.k)) addLog('Một tuổi. Thầy bói đặt tay ngươi lên đá trắc linh: không một tia sáng. "Phế linh căn." Cả làng thở dài. Chỉ mình ngươi cảm thấy, trong người có những dòng chảy nhỏ đang lặng lẽ xoay vòng.');
  else addLog(`Một tuổi. ${root().n}. ${o.fate.root.k === 0 ? 'Thầy bói trong làng lắc đầu: "Đứa nhỏ này không có tiên duyên."' : 'Người trong làng nói ngươi có tướng lạ.'}`);
  regrowGear();
  kmFillNew();
  save();
}

// ---------- Điểm số ----------
const REALM_PTS = [0, 10, 35, 90, 220, 520, 1200, 2700, 6000, 13000, ...Array.from({ length: 12 }, (_, i) => Math.round(13000 * Math.pow(2.2, i + 1)))];
export function scoreParts() {
  const parts: [string, number][] = [];
  parts.push([`Cảnh giới ${stageName()}`, REALM_PTS[s.r] + Math.round((REALM_PTS[s.r] * s.st) / 6)]);
  parts.push([`Hưởng thọ ${Math.floor(age())} tuổi`, Math.round(age() / 8)]);
  if (s.fame) parts.push(['Danh vọng', Math.round(s.fame / 4)]);
  if (s.kills) parts.push([`Hạ ${s.kills} đối thủ`, s.kills]);
  if (s.meridians) parts.push([`Thông ${s.meridians} kinh mạch`, s.meridians * 4]);
  const fr = friends().length;
  if (fr) parts.push([`${fr} tri kỷ`, fr * 3]);
  if (s.sect) parts.push([`Thân phận tông môn`, (s.sect.rank + 1) * SECTS[s.sect.id].tier * 5]);
  const craft = s.craft.alch + s.craft.talis + s.craft.forge;
  if (craft) parts.push(['Tay nghề luyện chế', craft * 6]);
  if (s.ascended) parts.push(['Hợp nhất Đại Đạo', 2000000]);
  if (s.world) parts.push([`Phi thăng ${s.world} lần, tới ${worldName(s.world)}`, 20000 * s.world]);
  return parts;
}
export const scoreOf = () => scoreParts().reduce((a, b) => a + b[1], 0);

export function epitaph(): string {
  const a = Math.floor(age());
  if (s.ascended) return `${s.name} hợp nhất với Đại Đạo, vĩnh hằng bất diệt. Thế gian chỉ còn lại truyền thuyết.`;
  if (s.r === 0) {
    if (root().m === 0) return `Một đời phàm nhân ${a} năm. Có lẽ cũng từng ngẩng đầu nhìn tiên nhân bay qua.`;
    return `Mang linh căn mà chưa kịp bước qua cửa tiên. ${a} tuổi, tro bụi trở về tro bụi.`;
  }
  const bits = [`${REALMS[s.r].n} tu sĩ ${s.name}`];
  if (s.sect) bits.push(`${SECTS[s.sect.id].n}`);
  if (s.kills > 30) bits.push('tay nhuốm máu trăm trận');
  else if (s.good > s.evil + 5) bits.push('hiệp nghĩa có tiếng');
  else if (s.evil > s.good + 5) bits.push('ma danh lẫy lừng');
  return bits.join(', ') + `. Hưởng thọ ${a} năm.`;
}

export function die(cause: string) {
  if (s.dead || s.ascended) return;
  s.dead = { cause, y: s.year };
  finish(cause);
  hooks.onDeath();
}

/** Đại Đạo viên mãn ở Hỗn Độn: thành tựu tối thượng, kết thúc kiếp này. */
export function transcend() {
  s.ascended = true;
  mark('Hợp nhất với Đại Đạo');
  finish('Hợp nhất Đại Đạo');
  hooks.onAscend();
}
/** Phi thăng lên giới kế tiếp. Trả về tên giới mới. */
export function ascend(): string {
  const w = (s.world ?? 0) + 1;
  s.world = w;
  WORLD.lv = w;
  applyWorld(w);
  const to = worldName(w);
  mark(`Độ kiếp thành công, phi thăng ${to}`);
  if (s.body === 'thiendo' && s.r === 1) s.flags.tangBase = (s.flags.tang ?? 1) - 1; // Thiên Đố: luyện khí tiếp, không tu lại
  else { s.r = 1; s.st = 0; }
  s.prog = 0;
  s.hurt = 0;
  s.tamma = 0;
  s.meridians = 0;
  delete s.flags.daoCo;
  delete s.flags.phams;
  // Luật phi thăng: thân thể bị pháp tắc giới mới ép về hình hài MỘT tuổi, tâm trí giữ nguyên;
  // tuổi linh hồn (flags.soulBorn) không đổi, số năm đã sống cộng dồn (flags.lifeLived), thọ nguyên tính lại từ đầu.
  s.flags.soulBorn ??= s.born;
  s.flags.lifeLived = (s.flags.lifeLived || 0) + (s.year - s.born);
  s.born = s.year - 1;
  delete s.flags.childhood; // đặc quyền phi thăng: tu luyện được ngay từ một tuổi
  s.sect = null;
  for (const k of ['thanhtu', 'holyScion', 'masterPick', 'masterRole', 'betrothed', 'ctGrudge', 'clan', 'nemesis', 'war_side']) delete s.flags[k];
  s.npcs = [];
  s.pins = [];
  const towns = LOC_LIST.filter((l) => l.type === 'town' && !l.island);
  setLoc(towns[Math.floor(Math.random() * towns.length)].id);
  addLog(`Phi thăng ${to}. Người quen, tông môn, ân oán ở hạ giới — tất cả ở lại phía sau.`, 'good');
  addLog(`Pháp tắc ${to} ép thân thể ngươi về hình hài một tuổi. Ký ức, tâm cảnh, ngộ tính vẫn nguyên vẹn (linh hồn ${Math.floor(s.year - s.flags.soulBorn)} tuổi, đã sống ${Math.floor(s.flags.lifeLived)} năm ở các giới dưới). Thọ nguyên tính lại từ đầu — và khác hài nhi thường, ngươi tu luyện được ngay: đặc quyền phi thăng.`, 'good');
  regrowGear();
  if (s.flags.hondonBlood) kmAutoAll();
  { const drop = kmSyncSkills(); if (drop.length) addLog(`Kinh mạch tu lại từ đầu, chỉ còn chỗ cho vài chiêu. Tạm cất: ${drop.join(', ')}.`); }
  if (s.flags.hondonBlood && w >= 5) {
    s.stats.ngo += 2; s.stats.can += 2;
    addLog('Vừa đặt chân xuống Hỗn Độn, huyết mạch trong người ngươi sôi lên, phong ấn vỡ tan. Đây là cố hương. Ở đâu đó giữa hỗn độn, Diệp gia đang chờ ngươi trở về.', 'good');
    mark('Huyết mạch Diệp gia Hỗn Độn thức tỉnh');
  }
  if (s.race === 'Yêu tộc' || s.beast || s.perks.includes('yeudan')) {
    const evo = tryEvolvePlayerBeast(s, worldPack(w).beasts);
    if (evo?.ok) {
      addLog(evo.text, 'good');
      mark(`Phi thăng huyết mạch thoát biến: ${evo.from} ➔ ${evo.to}`);
    } else if (evo?.requiresChoice && evo.branches) {
      s.flags.pendingBeastBranches = evo.branches;
      addLog(`Phi thăng mở ra nhiều con đường tiến hóa mới cho huyết mạch ${s.beast}. Hãy chọn con đường đạo lộ của ngươi!`, 'mark');
    }
  }
  return to;
}

let lastRec: LifeRec | null = null;
export const lastLife = () => lastRec;

function finish(cause: string) {
  checkAch();
  const score = scoreOf() + achPtsLife();
  const karma = Math.max(1, Math.round(score / 12));
  const rec: LifeRec = {
    id: s.id,
    name: s.name,
    g: s.g,
    origin: (() => {
      const o = ORIGINS.find((x) => x.id === s.origin);
      return `${o ? originName(o, s.g) : ''}${s.beast ? ` · loài ${s.beast}` : ''}${s.race && !o?.beastOrigin ? ` · ${s.race}` : ''}`;
    })(),
    root: rootLabel(),
    realm: stageName(),
    r: s.r,
    age: Math.floor(age()),
    cause,
    score,
    karma,
    year: Math.floor(s.year),
    marks: s.marks.map((m) => `Năm ${Math.floor(m.y)} (${Math.floor(m.y - s.born)} tuổi): ${m.t}`),
    epitaph: epitaph(),
    ascended: s.ascended,
    sect: s.sect ? SECTS[s.sect.id].n : undefined,
  };
  lastRec = rec;
  meta.lives.unshift(rec);
  if (meta.lives.length > 60) meta.lives.length = 60;
  meta.karma += karma;
  meta.karmaTotal += karma;
  meta.worldYear = Math.floor(s.year);
  regrowGear();
  kmFillNew();
  save();
}

// ---------- Thành tựu ----------
export interface Ach {
  id: string;
  n: string;
  d: string;
  pts: number;
  ok: () => boolean;
}
export const ACH: Ach[] = [
  { id: 'luyenkhi', n: 'Bước qua cửa tiên', d: 'Đạt Luyện Khí.', pts: 5, ok: () => s.r >= 1 },
  { id: 'trucco', n: 'Đạo cơ vững chắc', d: 'Đạt Trúc Cơ.', pts: 10, ok: () => s.r >= 2 },
  { id: 'ketdan', n: 'Kim đan đại đạo', d: 'Đạt Kết Đan.', pts: 20, ok: () => s.r >= 3 },
  { id: 'nguyenanh', n: 'Anh thành vạn dặm', d: 'Đạt Nguyên Anh.', pts: 40, ok: () => s.r >= 4 },
  { id: 'hoathan', n: 'Thần du thái hư', d: 'Đạt Hóa Thần.', pts: 80, ok: () => s.r >= 5 },
  { id: 'luyenhu', n: 'Hư thực tương sinh', d: 'Đạt Luyện Hư.', pts: 150, ok: () => s.r >= 6 },
  { id: 'hopthe', n: 'Thiên nhân hợp nhất', d: 'Đạt Hợp Thể.', pts: 250, ok: () => s.r >= 7 },
  { id: 'daithua', n: 'Đại đạo viên mãn', d: 'Đạt Đại Thừa.', pts: 400, ok: () => s.r >= 8 },
  { id: 'phithang', n: 'Phi thăng', d: 'Độ kiếp phi thăng.', pts: 1000, ok: () => !!s.ascended || (s.world ?? 0) >= 1 },
  { id: 'phelinh', n: 'Nghịch thiên cải mệnh', d: 'Đạt Trúc Cơ với xuất phát điểm là phế linh căn.', pts: 60, ok: () => s.r >= 2 && !!s.flags.wasMortalRoot },
  { id: 'tramtuoi', n: 'Trăm năm', d: 'Sống quá 100 tuổi.', pts: 5, ok: () => age() >= 100 },
  { id: 'ngantuoi', n: 'Ngàn năm', d: 'Sống quá 1000 tuổi.', pts: 50, ok: () => age() >= 1000 },
  { id: 'tongmon', n: 'Có nơi nương tựa', d: 'Gia nhập một tông môn.', pts: 5, ok: () => !!s.sect },
  { id: 'chantruyen', n: 'Thân truyền', d: 'Trở thành thân truyền đệ tử.', pts: 20, ok: () => !!s.sect && s.sect.rank >= RK.THANTRUYEN },
  { id: 'truonglao', n: 'Trưởng lão nội môn', d: 'Trở thành trưởng lão nội môn.', pts: 40, ok: () => !!s.sect && s.sect.rank >= RK.TL_NOI },
  { id: 'thanhtu', n: 'Thánh tử', d: 'Được lập làm Thánh tử/Thánh nữ của một tông môn.', pts: 50, ok: () => !!s.sect && s.sect.rank >= RK.THANHTU },
  { id: 'tongchu', n: 'Chưởng giáo', d: 'Trở thành chủ một tông môn.', pts: 80, ok: () => !!s.sect && s.sect.rank >= RK.CHU },
  { id: 'thanhdia', n: 'Đệ tử thánh địa', d: 'Gia nhập Tử Tiêu Tiên Cung.', pts: 60, ok: () => s.sect?.id === 'tutieu' },
  { id: 'daolu', n: 'Thần tiên quyến lữ', d: 'Kết thành đạo lữ.', pts: 15, ok: () => s.npcs.some((n) => n.tag === 'daolu') },
  { id: 'tramtran', n: 'Bách chiến', d: 'Thắng 100 trận.', pts: 25, ok: () => s.wins >= 100 },
  { id: 'nhatchien', n: 'Lần đầu thấy máu', d: 'Thắng trận đầu tiên.', pts: 2, ok: () => s.wins >= 1 },
  { id: 'phuhao', n: 'Phú khả địch quốc', d: 'Có 100 vạn linh thạch.', pts: 30, ok: () => s.money >= 1e6 },
  { id: 'dansu', n: 'Đan sư', d: 'Luyện đan đạt cấp 3.', pts: 15, ok: () => s.craft.alch >= 3 },
  { id: 'danvuong', n: 'Đan vương', d: 'Luyện đan đạt cấp 6.', pts: 50, ok: () => s.craft.alch >= 6 },
  { id: 'phusu', n: 'Phù sư', d: 'Chế phù đạt cấp 3.', pts: 15, ok: () => s.craft.talis >= 3 },
  { id: 'khisu', n: 'Luyện khí sư', d: 'Luyện khí đạt cấp 3.', pts: 15, ok: () => s.craft.forge >= 3 },
  { id: 'kinhmach', n: 'Bách mạch câu thông', d: 'Đả thông đủ 12 kinh mạch.', pts: 40, ok: () => s.meridians >= 12 },
  { id: 'tiengtam', n: 'Danh chấn một phương', d: 'Danh vọng đạt 500.', pts: 20, ok: () => s.fame >= 500 },
  { id: 'hiepnghia', n: 'Hiệp nghĩa', d: 'Làm 30 việc thiện.', pts: 20, ok: () => s.good >= 30 },
  { id: 'mađầu', n: 'Ma đầu', d: 'Gây 30 việc ác.', pts: 20, ok: () => s.evil >= 30 },
  { id: 'baothu', n: 'Huyết hải đã báo', d: 'Đánh bại kẻ thù diệt môn.', pts: 30, ok: () => !!s.flags.revenged },
  { id: 'thiengiai', n: 'Chu du thiên hạ', d: 'Đặt chân tới cả bảy vùng.', pts: 20, ok: () => new Set(meta.codex.loc.map((l) => LOCS[l]?.reg)).size >= 7 && !!s.flags.visitedAll },
  { id: 'tienthien', n: 'Tiên Sơn', d: 'Đặt chân lên Hư Linh Tiên Sơn.', pts: 30, ok: () => LOCS[s.loc].reg === 'tienchau' },
  { id: 'thienkieu', n: 'Thiên kiêu', d: 'Đạt Kết Đan trước 60 tuổi.', pts: 40, ok: () => s.r >= 3 && !!s.flags.ketdanAge && s.flags.ketdanAge < 60 },
  { id: 'luanhoi10', n: 'Mười kiếp luân hồi', d: 'Trải qua 10 kiếp.', pts: 20, ok: () => meta.lives.length >= 9 },
];
const lifeAch = new Set<string>();
export function checkAch(): Ach[] {
  if (!s) return [];
  const got: Ach[] = [];
  if (s.r >= 3 && !s.flags.ketdanAge) s.flags.ketdanAge = Math.floor(age());
  for (const a of ACH) {
    let ok = false;
    try { ok = a.ok(); } catch { ok = false; }
    if (ok && !lifeAch.has(s.id + a.id)) {
      lifeAch.add(s.id + a.id);
      (s.flags.ach ||= []).includes(a.id) || s.flags.ach.push(a.id);
      if (!meta.ach.includes(a.id)) {
        meta.ach.push(a.id);
        got.push(a);
      }
    }
  }
  const pw = powerScore();
  if (pw > s.bestPower) s.bestPower = pw;
  return got;
}
function achPtsLife() {
  return ((s.flags.ach as string[]) || []).reduce((a, id) => a + (ACH.find((x) => x.id === id)?.pts || 0), 0);
}
export const isNewAch = (_id: string) => true;
export { clamp };
