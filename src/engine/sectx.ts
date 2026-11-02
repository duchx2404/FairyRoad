import { worldDefinitions } from '../data/local-items';
// Chức năng mở rộng của đệ tử tông môn: Nhiệm Vụ Đường, Bái sư, Tỉ thí, Đại bỉ, Bế quan linh mạch.
import { REALMS, EL, SURN, MALE, FEM, DAO_HAO, DAO_HAO_F, type El } from '../data/core';
import { SKILLS, TAMPHAP, HERBS, MATS, WEAPON_N, type Weapon } from '../data/items';
import { effRi, thapHidden, tamList, addItem } from './char';
import { learnSkill } from './api';
import { CRAFT_N, craftTitle, gainXp, xpNeed, type CraftK } from './craft';
import { SECTS, SECT_TIER_INFO, RK, rankLabel, isLaoTo, daoTitle, TITLE_RE } from '../data/world';
import { s } from './state';
import { cultRate, M } from './char';
import { passTime, mkNpc, addNpc, mark, master, addProg, cultivateTurn, relChange, TRAITS, missionProg } from './core';
import { fight, fightSummary } from './combat';
import { seeded, hashStr, ch, clamp, pick, yearsTxt } from '../core/util';
import type { Scene } from './actions';

const sc = () => SECTS[s.sect!.id];

// ---------- Nhiệm Vụ Đường: việc dài hạn, tới hạn thì giao nộp ----------
/** craft/xp: việc tay nghề (luyện đan / khí / phù) — giao nộp thì cộng thêm thuần thục tay nghề loại đó. */
export interface SectJob { key: string; n: string; dur: number; reward: number; end?: number; craft?: CraftK; xp?: number }
const JOBS = ['Canh giữ dược điền', 'Chép kinh ở Tàng Kinh Các', 'Tuần tra biên giới sơn môn', 'Vận chuyển khoáng thạch', 'Dạy dỗ đệ tử tạp dịch', 'Tu sửa trận pháp hộ sơn', 'Thu thập linh thảo ở hậu sơn', 'Trấn thủ phân đà dưới núi'];
/** Ba việc tay nghề luôn có trên bảng, mỗi việc 3 tháng. */
const CRAFT_JOBS: [CraftK, string][] = [['alch', 'Trông lò đan cho trưởng lão'], ['forge', 'Phụ luyện pháp khí ở Khí Phong'], ['talis', 'Chế phù cho đệ tử tuần sơn']];
const CRAFT_DUR = 0.25;
export const MAX_JOBS = 3;
export const myJobs = (): SectJob[] => ((s.flags.sjobs ||= []) as SectJob[]);
/** Việc đã hoàn thành, giao nộp được (sai số nhỏ vì thời gian cộng theo từng tháng). */
export const jobDone = (j: SectJob) => s.year + 1e-6 >= (j.end || 0);
/** Thuần thục tay nghề một việc mang lại: khoảng 1/5 lượng cần để lên bậc kế. */
const craftXp = (k: CraftK) => Math.max(4, Math.round(xpNeed(s.craft[k]) * 0.2));
export function jobBoard(): SectJob[] {
  const key = `${s.sect!.id}:${Math.floor(s.year)}`;
  const rnd = seeded(hashStr(key + s.id + 'job'));
  const taken = new Set(myJobs().map((j) => j.key));
  const out: SectJob[] = [];
  // việc tay nghề cố định: đang làm thì ẩn, giao nộp xong lại hiện
  for (const [k, n] of CRAFT_JOBS) {
    const ck = `${s.sect!.id}:craft:${k}`;
    if (taken.has(ck)) continue;
    const reward = Math.max(5, Math.round((6 + effRi() * 4) * CRAFT_DUR / Math.max(1, REALMS[effRi()].turn) * (1 + sc().tier * 0.2) * 1.5));
    out.push({ key: ck, n, dur: CRAFT_DUR, reward, craft: k, xp: craftXp(k) });
  }
  // việc khác: rút đủ số ngẫu nhiên cho mọi ô trước rồi mới bỏ việc đang làm / đã giao nộp,
  // để nhận một việc không làm các việc còn lại đổi tên, đổi thưởng
  const done = new Set(doneJobs());
  for (let i = 0; i < 4; i++) {
    const dur = Math.max(1, Math.round((1 + rnd() * 4) * Math.max(1, REALMS[s.r].turn)));
    const k = `${key}#${i}`;
    const n = JOBS[Math.floor(rnd() * JOBS.length)];
    const reward = Math.round((6 + effRi() * 4) * dur / Math.max(1, REALMS[effRi()].turn) * (0.8 + rnd() * 0.5) * (1 + sc().tier * 0.2));
    if (taken.has(k) || done.has(k)) continue;
    out.push({ key: k, n, dur, reward });
  }
  return out;
}
/** Việc khác (không phải việc tay nghề) đã giao nộp trong năm nay: không hiện lại trên bảng. */
function doneJobs(): string[] {
  const yr = `${s.sect!.id}:${Math.floor(s.year)}#`;
  const l = ((s.flags.sjobsDone ||= []) as string[]).filter((k) => k.startsWith(yr)); // bỏ khóa của năm cũ
  s.flags.sjobsDone = l;
  return l;
}
export function takeJob(j: SectJob): string {
  if (myJobs().length >= MAX_JOBS) return `Chỉ nhận tối đa ${MAX_JOBS} việc cùng lúc.`;
  myJobs().push({ ...j, end: s.year + j.dur });
  return `Nhận việc "${j.n}". Làm trong ${yearsTxt(j.dur)}, xong lúc nào về giao nộp lúc ấy — việc đã nhận không mất.`;
}
export function deliverJobs(): string {
  const ready = myJobs().filter(jobDone);
  if (!ready.length) return 'Chưa việc nào hoàn thành.';
  const total = ready.reduce((a, j) => a + j.reward, 0);
  s.sect!.contrib += total;
  s.flags.sjobs = myJobs().filter((j) => !jobDone(j));
  // việc khác giao nộp rồi thì mất hẳn; việc tay nghề luôn quay lại bảng
  const gone = (s.flags.sjobsDone ||= []) as string[];
  for (const j of ready) if (!j.craft && !gone.includes(j.key)) gone.push(j.key);
  let craft = '';
  for (const j of ready) if (j.craft && j.xp) craft += ` ${CRAFT_N[j.craft]} +${j.xp} thuần thục.${gainXp(j.craft, j.xp)}`;
  // tu vi: việc tay nghề làm liền một mạch (30% tu vi bế quan cùng thời gian); việc khác làm dần trong lúc vẫn tu luyện nên ít hơn (10%)
  const prog = missionProg(ready.reduce((a, j) => a + j.dur * (j.craft ? 0.3 : 0.1), 0), 1);
  return `Giao nộp ${ready.length} việc, nhận ${total} cống hiến.${craft}${prog}`;
}

/** Việc tay nghề: nhận việc thì phong chủ Đan / Khí / Phù Phong giao việc, bấm làm là thời gian trôi 3 tháng, việc xong ngay, giao nộp được luôn. */
const CRAFT_ROLE: Record<CraftK, Role> = { alch: 'dan', forge: 'khi', talis: 'phu' };
const CRAFT_SEAT: Record<CraftK, string> = { alch: 'Đan Phong phong chủ', forge: 'Khí Phong phong chủ', talis: 'Phù Phong phong chủ' };
const CRAFT_ASK: Record<CraftK, (who: string, ta: string) => string> = {
  alch: (who, ta) => `Trong Đan Phong, khói thuốc lượn lờ quanh chiếc lò đan ba chân cao ngang người. ${who} nhận lệnh bài nhiệm vụ của ngươi, liếc qua rồi chỉ vào lò: "Mẻ đan này phải giữ lửa đều suốt ba tháng, lò không được nguội lúc nào. Ngươi trông lửa, thêm dược liệu đúng canh giờ. Làm cho tử tế, ${ta} chỉ cho ngươi vài mẹo khống hỏa."`,
  forge: (who, ta) => `Trong Khí Phong, tiếng búa vang không dứt, hơi nóng địa hỏa phả rát mặt. ${who} ném cho ngươi chiếc tạp dề da: "Lô phi kiếm cho đệ tử ngoại môn cần tôi luyện gấp. Ngươi kéo bễ, giữ địa hỏa, thấy phôi đỏ rực thì gọi ${ta}. Ba tháng, xong lô này."`,
  talis: (who, ta) => `${who} đặt trước mặt ngươi một chồng phù chỉ cao ngang ngực, bên cạnh là nghiên chu sa còn ấm: "Đệ tử tuần sơn thiếu Hộ Thân Phù và Truyền Tin Phù. Ba tháng, ngươi vẽ cho đủ. Nét bút phải liền một hơi — đứt giữa chừng là phế, ${ta} không nhận."`,
};
const CRAFT_DONE: Record<CraftK, (name: string) => string> = {
  alch: (name) => `Ba tháng ngồi bên lò, ngươi thuộc từng tiếng lửa reo. Ngày mở lò, mùi đan hương lan khắp Đan Phong. ${name} nhặt một viên lên ngửi, khẽ gật đầu: "Không tệ. Lửa đều tay hơn ta tưởng."`,
  forge: (name) => `Ba tháng kéo bễ, tay ngươi chai sạn, nhưng đã nghe ra tiếng phôi kim loại "chín". Lô phi kiếm ra lò sáng như nước. ${name} gõ thử một thanh, tiếng ngân trong trẻo: "Được. Lô này dùng được."`,
  talis: (name) => `Ba tháng vẽ phù, chồng phù chỉ vơi dần, nét bút ngươi mỗi lúc một liền. ${name} lật xem từng tờ, rút ra vài tờ hỏng, còn lại đều đóng ấn: "Đủ số. Tay nghề có tiến."`,
};
export function craftJobScene(j: SectJob): Scene {
  const k = j.craft!;
  const e = elderRoster().find((x) => x.role === CRAFT_ROLE[k]);
  const name = e?.name || 'Phong chủ';
  const who = `${e?.seat || CRAFT_SEAT[k]} ${e ? e.name : ''}`.trim();
  const ta = e ? (e.g === 'm' ? 'lão phu' : 'bản tọa') : 'ta';
  const full = myJobs().length >= MAX_JOBS;
  return {
    title: j.n,
    kind: 'event',
    text: CRAFT_ASK[k](who, ta),
    choices: [
      {
        t: `Bắt tay vào làm (${yearsTxt(j.dur)})`, cls: 'prime', dis: full, hint: full ? `Đã nhận đủ ${MAX_JOBS} việc` : `+${j.reward} cống hiến · +${j.xp} thuần thục ${CRAFT_N[k].toLowerCase()}`,
        fn: () => {
          passTime(j.dur);
          myJobs().push({ ...j, end: s.year }); // làm xong ngay, chờ giao nộp
          return {
            text: CRAFT_DONE[k](name),
            choices: [
              { t: 'Giao nộp ngay', cls: 'prime', fn: () => deliverJobs() },
              { t: 'Để sau', fn: () => 'Ngươi cất lệnh bài. Lúc nào rảnh về Nhiệm Vụ Đường giao nộp — việc đã làm xong không mất.' },
            ],
          };
        },
      },
      { t: 'Để lúc khác', fn: () => 'Ngươi chắp tay cáo lui, việc vẫn để trên bảng.' },
    ],
  };
}

// ---------- Bái sư ----------
// Nội môn trưởng lão: ba phong luyện (đan/khí/phù), Chấp pháp, Truyền công, các phong vũ khí, các phong theo hệ.
// Ngoại môn trưởng lão: quản đệ tử ngoại môn, tạp dịch và sản nghiệp thế tục của tông.
export type Role = 'dan' | 'khi' | 'phu' | 'chap' | 'truyen' | 'vk' | 'the' | 'he' | 'ngoai' | 'tap' | 'tuc' | 'duoc' | 'khoang';
export const ROLE_GIFT: Record<Role, string> = {
  dan: 'Dạy luyện đan (+1 bậc tay nghề)', khi: 'Dạy luyện khí (+1 bậc tay nghề)', phu: 'Dạy chế phù (+1 bậc tay nghề)',
  chap: 'Rèn tâm tính (tâm cảnh +1, danh vọng)', truyen: 'Truyền một bộ tâm kinh, ngộ tính +1',
  vk: 'Truyền một môn sát chiêu', the: 'Rèn thân thể (căn cốt +1)', he: 'Truyền một môn thuật pháp cùng hệ',
  ngoai: 'Ghi công (+cống hiến)', tap: 'Giao việc nhẹ, cho thêm cống hiến', tuc: 'Chia lời sản nghiệp (+linh thạch)',
  duoc: 'Cho linh thảo ở dược viên', khoang: 'Cho khoáng liệu luyện khí',
};
export interface Elder {
  key: string; name: string; g: 'm' | 'f'; r: number; st: number; el: El; role: Role;
  seat: string; // "Kiếm Phong phong chủ", "Chấp pháp trưởng lão"...
  w?: Weapon; inner: boolean; trait: string; minRank: number; maxRank: number; age: number; d: string;
}
const WEAPONS: [string, Role, string, Weapon][] = [
  ['Kiếm Phong', 'vk', 'kiếm', 'kiem'], ['Đao Phong', 'vk', 'đao', 'dao'], ['Thương Phong', 'vk', 'thương', 'thuong'], ['Quyền Phong', 'the', 'quyền cước luyện thể', 'quyen'],
  ['Chưởng Phong', 'vk', 'chưởng pháp', 'chuong'], ['Cung Phong', 'vk', 'cung tiễn', 'cung'], ['Kích Phong', 'vk', 'kích', 'kich'],
];
const OUTER: [string, Role, string][] = [
  ['Quản sự ngoại môn', 'ngoai', 'Quản danh sách, khảo hạch và cống hiến của đệ tử ngoại môn.'],
  ['Quản sự tạp dịch', 'tap', 'Phân việc gánh nước, chẻ củi, quét sơn môn cho tạp dịch.'],
  ['Chưởng quỹ sản nghiệp thế tục', 'tuc', 'Coi các cửa hiệu, thương đội và ruộng đất của tông ở thế tục.'],
  ['Quản sự dược viên', 'duoc', 'Trông dược điền dưới chân núi.'],
  ['Quản sự khoáng mạch', 'khoang', 'Coi phu mỏ và linh khoáng của tông.'],
  ['Quản sự phường thị', 'tuc', 'Thu thuế phường thị dưới núi, xử việc tán tu gây rối.'],
];
/** Toàn bộ trưởng lão nhận đồ đệ của tông (đổi mỗi 30 năm). */
export function elderRoster(): Elder[] {
  const sct = sc();
  const era = Math.floor(s.year / 30);
  const rnd = seeded(hashStr(`${sct.id}:elders:${era}`));
  const rp = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
  const chu = SECT_TIER_INFO[sct.tier].chu;
  const used = new Set<string>();
  const out: Elder[] = [];
  const add = (inner: boolean, seat: string, role: Role, el: El, r: number, d: string, gFix?: 'm' | 'f', w?: Weapon) => {
    r = clamp(r, 1, 8);
    const g: 'm' | 'f' = gFix ?? (sct.fem ? 'f' : rnd() < 0.5 ? 'm' : 'f');
    let name = '';
    let tok = '';
    for (let k = 0; k < 20 && (!name || used.has(tok)); k++) {
      if (r >= 4 && rnd() < 0.4) { tok = rp(g === 'm' ? DAO_HAO : DAO_HAO_F); name = `${tok} ${r >= 5 ? 'Lão Tổ' : g === 'm' ? 'Chân Nhân' : 'Tiên Tử'}`; }
      else { tok = rp(g === 'm' ? MALE : FEM); name = `${rp(SURN)} ${tok}`; }
    }
    used.add(tok);
    out.push({
      key: `${sct.id}:${era}:${out.length}`, name, g, r, w, st: Math.floor(rnd() * 4), el, role, seat, inner, trait: rp(TRAITS), d,
      minRank: inner ? RK.NOI : RK.TAP, maxRank: inner ? RK.THAITHUONG : RK.NGOAI,
      age: Math.round(REALMS[r].life * (0.3 + rnd() * 0.45)),
    });
    // danh xưng theo bậc thế lực (không tiêu thêm số ngẫu nhiên để giữ nguyên danh sách)
    const e = out[out.length - 1];
    if (TITLE_RE.test(e.name)) e.name = daoTitle(tok, r, e.st, sct.tier, g);
    else if (isLaoTo(r, e.st, sct.tier) && hashStr(e.key) % 2 === 0) e.name = `${tok} Lão Tổ`;
  };
  const lv = (pLow: number) => chu - 1 - (rnd() < pLow ? 1 : 0); // pLow = xác suất thấp hơn một bậc
  // ----- nội môn -----
  add(true, 'Chấp pháp trưởng lão', 'chap', rp(sct.el), chu - 1, 'Giữ môn quy, xử phạt đệ tử phạm lỗi. Nhận đồ đệ rất khắt khe.');
  add(true, 'Truyền công trưởng lão', 'truyen', rp(sct.el), chu - 1, 'Giảng đạo ở Truyền Công Điện, giữ chìa khóa Tàng Kinh Các.');
  add(true, 'Đan Phong phong chủ', 'dan', 'hoa', lv(0.5), 'Chủ trì Đan Phong, lò đan của cả tông đều qua tay.');
  add(true, 'Khí Phong phong chủ', 'khi', 'kim', lv(0.5), 'Chủ trì Khí Phong, rèn pháp khí cho đệ tử.');
  add(true, 'Phù Phong phong chủ', 'phu', rp(sct.el), lv(0.5), 'Chủ trì Phù Phong, vẽ phù trấn sơn và phù hộ thân.');
  const ws = WEAPONS.slice(0, 1).concat(WEAPONS.slice(1).sort(() => rnd() - 0.5).slice(0, sct.tier));
  for (const [n, role, wn, w] of ws) add(true, `${n} phong chủ`, role, rp(sct.el), n === 'Kiếm Phong' ? chu - 1 : lv(0.2), `Sở trường ${wn}; đệ tử ${n} ra tay nổi tiếng hung hãn.`, n === 'Kiếm Phong' ? 'f' : undefined, w);
  const els = sct.el.slice().sort(() => rnd() - 0.5).slice(0, Math.min(sct.el.length, 1 + sct.tier));
  for (const el of els) add(true, `${EL[el].n} Phong phong chủ`, 'he', el, lv(0.5), `Tu ${EL[el].n.toLowerCase()} hệ thuật pháp tới mức xuất thần.`);
  // ----- ngoại môn -----
  const outs = OUTER.slice(0, 3).concat(OUTER.slice(3).sort(() => rnd() - 0.5).slice(0, sct.tier - 1));
  for (const [n, role, d] of outs) add(false, n, role, rp(sct.el), chu - 2 - (rnd() < 0.5 ? 1 : 0), d);
  return out;
}
/** Sư phụ do tông phân công (không phải tự chọn) — đổi không bị phạt. */
export const assignedMaster = () => { const m = master(); return m && s.flags.masterPick !== m.id ? m : undefined; };
/** Xin thôi sư phụ phân công để tự chọn lại. */
export function releaseAssigned(): string {
  const m = assignedMaster();
  if (!m) return 'Không có sư phụ phân công nào.';
  m.tag = 'senior';
  return `Ngươi tới bẩm với ${m.name}. Vốn chỉ là tông môn phân công, ${m.name} gật đầu: "Tìm người hợp đạo của ngươi đi." Từ nay gọi là sư thúc.`;
}
const refused = (): Record<string, number> => ((s.flags.baiNo ||= {}) as Record<string, number>);
/** Vị này có phải sư phụ hiện tại không. */
const baseName = (n: string) => n.replace(TITLE_RE, '');
export const isMyMaster = (e: Elder) => { const m = master(); return !!m && baseName(m.name) === baseName(e.name) && m.sect === s.sect?.id; };
/** Con cháu của bậc lão tổ trong chính tông này: trưởng lão nào cũng phải nể mặt. */
export function backer(): string | null {
  if (!s.sect || s.flags.holyScion !== s.sect.id) return null;
  const p = s.npcs.find((n) => n.alive && n.tag === 'kin' && /Thái thượng/i.test(n.how));
  return p ? `${p.g === 'm' ? 'phụ thân' : 'mẫu thân'} ngươi là Thái thượng trưởng lão ${p.name}` : 'ngươi là con cháu bậc lão tổ trong tông';
}
export function baiChance(e: Elder): number {
  if (backer()) return 1;
  const chu = SECT_TIER_INFO[sc().tier].chu;
  const fit = !thapHidden() && s.root.els.includes(e.el) ? 0.15 : 0;
  let p = 0.3 + s.stats.ngo * 0.025 + s.stats.mi * 0.02 + s.sect!.rank * 0.05 + (s.flags.holyScion ? 0.15 : 0) + fit - (e.r - (chu - 3)) * 0.08 - (master() && !assignedMaster() ? 0.15 : 0);
  if (e.role === 'dan' || e.role === 'phu' || e.role === 'truyen') p += (s.stats.ngo - 5) * 0.02;
  if (e.role === 'khi' || e.role === 'the') p += (s.stats.can - 5) * 0.02;
  if (e.role === 'chap') p += (s.stats.tam - 5) * 0.03 - (s.evil > s.good ? 0.25 : 0) - 0.1;
  if (!e.inner) p += 0.1;
  return clamp(p, 0.05, 0.92);
}
/** Lý do không thể cầu bái (null = được). */
export function baiBlock(e: Elder): string | null {
  if (isMyMaster(e)) return 'Đang là sư phụ của ngươi';
  if (s.sect!.rank < e.minRank) return `Trưởng lão nội môn chỉ nhận đệ tử từ ${rankLabel(e.minRank, sc(), s.g)} trở lên`;
  if (s.sect!.rank > e.maxRank) return 'Trưởng lão ngoại môn chỉ quản ngoại môn và tạp dịch';
  const y = refused()[e.key];
  if (y !== undefined && s.year - y < 1 && !backer()) return 'Vừa từ chối ngươi, năm sau hãy tới';
  return null;
}
function roleGift(e: Elder): string {
  const cap = clamp(Math.ceil((effRi() + 1) / 1.5), 1, 6);
  const tier = sc().tier;
  const skill = (kinds: string[], elOnly: boolean) => {
    const pool = worldDefinitions('sk').filter((k) => kinds.includes(k.k) && (elOnly ? k.el === e.el : k.el === e.el || k.el === null) && k.tier <= cap && !s.known.includes(k.id));
    if (!pool.length) { s.stats.ngo++; return ' Chiêu thức của sư phụ ngươi đã biết cả, sư phụ bèn giảng đạo lý — ngộ tính +1.'; }
    const k = pool.sort((x, y) => y.tier - x.tier)[0];
    return learnSkill(k.id) || ` Sư phụ truyền ${k.n}.`;
  };
  const weaponSkill = () => {
    const pool = worldDefinitions('sk').filter((k) => k.w === e.w && k.tier <= cap && !s.known.includes(k.id));
    if (!pool.length) { s.stats.ngo++; return ` ${WEAPON_N[e.w!]} pháp của sư phụ ngươi đã học hết, sư phụ bèn giảng ${WEAPON_N[e.w!].toLowerCase()} ý — ngộ tính +1.`; }
    const k = pool.sort((x, y) => y.tier - x.tier)[0];
    return ` Sư phụ truyền ${WEAPON_N[e.w!].toLowerCase()} pháp ${k.n}.` + learnSkill(k.id).replace(/^ Lĩnh ngộ [^.]*\./, '');
  };
  switch (e.role) {
    case 'vk': return weaponSkill();
    case 'he': return skill(['atk', 'multi', 'dot', 'shield', 'heal'], true);
    case 'dan': case 'phu': case 'khi': {
      const ck = e.role === 'dan' ? 'alch' : e.role === 'phu' ? 'talis' : 'forge';
      if (ck === 'alch' && s.craft.alch < 1) for (const r of ['hoixuandan', 'tukhi']) if (!s.recipes.includes(r)) s.recipes.push(r);
      if (ck === 'talis' && s.craft.talis < 1) for (const r of ['hoaphu', 'kimcangphu']) if (!s.recipes.includes(r)) s.recipes.push(r);
      if (s.craft[ck] < 8) s.craft[ck]++;
      return ` Sư phụ cầm tay chỉ việc — ${CRAFT_N[ck].toLowerCase()} lên ${craftTitle(s.craft[ck], ck)}.`;
    }
    case 'the': s.stats.can++; return ' Sư phụ ném ngươi vào suối hàn tẩy tủy ba tháng — căn cốt +1.' + (e.w ? weaponSkill() : '');
    case 'chap': s.stats.tam++; s.fame += 10 * tier; return ' Sư phụ bắt ngươi chép môn quy trăm lần, đứng xem xử phạt ba buổi — tâm cảnh +1. Đệ tử trong tông nhìn ngươi đã khác.';
    case 'truyen': {
      s.stats.ngo++;
      const known = tamList();
      const pool = worldDefinitions('tp').filter((x) => !known.includes(x.id) && x.tier <= cap);
      if (!pool.length) return ' Sư phụ giảng kinh bảy ngày — ngộ tính +1.';
      const x = pool.sort((p, q) => q.tier - p.tier)[0];
      addItem('tp:' + x.id);
      return ` Sư phụ giảng kinh bảy ngày (ngộ tính +1) rồi trao ngươi quyển ${x.n}.`;
    }
    case 'ngoai': { const c = 20 * tier; s.sect!.contrib += c; return ` Sư phụ ghi tên ngươi vào sổ ưu đãi — +${c} cống hiến.`; }
    case 'tap': { const c = 12 * tier; s.sect!.contrib += c; return ` Sư phụ giao cho ngươi việc nhẹ nhất, công lại tính gấp đôi — +${c} cống hiến.`; }
    case 'tuc': { const m = M(60 * tier); s.money += m; return ` Sư phụ dẫn ngươi đi một vòng các cửa hiệu dưới núi, chia cho ngươi ${m} linh thạch.`; }
    case 'duoc': {
      const hs = Object.values(HERBS).filter((x) => x.tier <= Math.max(1, cap - 1)).sort((x, y) => y.tier - x.tier).slice(0, 3);
      for (const x of hs) addItem('h:' + x.id, 2);
      return ` Sư phụ cho ngươi hái ở dược viên: ${hs.map((x) => x.n).join(', ')}.`;
    }
    case 'khoang': {
      const ms = Object.values(MATS).filter((x) => x.tier <= Math.max(1, cap - 1)).sort((x, y) => y.tier - x.tier).slice(0, 3);
      for (const x of ms) addItem('m:' + x.id, 2);
      return ` Sư phụ cho ngươi chọn trong kho khoáng: ${ms.map((x) => x.n).join(', ')}.`;
    }
  }
}
/** Bù chân truyền vũ khí cho sư phụ phong vũ khí đã bái trước khi có hệ thống này. */
export function masterCatchUp(): string | null {
  const e = s.sect ? elderRoster().find(isMyMaster) : undefined;
  if (!e?.w || s.flags.peakGift === e.key) return null;
  s.flags.peakGift = e.key;
  if (worldDefinitions('sk').some((k) => k.w === e.w && s.known.includes(k.id))) return null;
  const cap = clamp(Math.ceil((effRi() + 1) / 1.5), 1, 6);
  const k = worldDefinitions('sk').filter((x) => x.w === e.w && x.tier <= cap).sort((x, y) => y.tier - x.tier)[0];
  if (!k) return null;
  learnSkill(k.id);
  return `${e.name} gọi ngươi tới: "Đệ tử ${e.seat.replace(' phong chủ', '')} không thể không biết ${WEAPON_N[e.w].toLowerCase()} pháp." Truyền cho ngươi ${k.n}.`;
}
export function baiSu(e: Elder): Scene {
  passTime(1 / 12);
  const why = baiBlock(e);
  if (why) return { title: 'Bái sư', text: why + '.' };
  const old = master();
  const assigned = !!assignedMaster();
  if (!ch(baiChance(e))) {
    refused()[e.key] = s.year;
    return { title: 'Bái sư', text: old && !assigned
      ? `${e.name} lắc đầu: "Ngươi đã có sư phụ là ${old.name}. Bỏ thầy theo ta, sau này ngươi có bỏ ta không?"`
      : e.role === 'chap' ? `${e.name} không ngẩng đầu: "Tâm chưa định, tay chưa sạch. Về đi."`
      : `Ngươi quỳ trước động phủ của ${e.name} ba ngày ba đêm. Bên trong chỉ truyền ra một câu: "Duyên chưa tới."` };
  }
  let extra = '';
  if (old && assigned) {
    old.tag = 'senior';
    extra = ` ${old.name} vốn chỉ là sư phụ do tông phân công, nghe tin cũng không để bụng — từ nay ngươi gọi là sư thúc.`;
  } else if (old) {
    old.tag = 'senior';
    relChange(old, -40);
    extra = ` Tin truyền tới tai ${old.name}, người chỉ cười nhạt — từ nay tình thầy trò coi như đoạn.`;
  }
  const m = addNpc(mkNpc({ name: e.name, g: e.g, r: e.r, st: e.st, sect: s.sect!.id, tag: 'master', rel: 50, el: e.el, age: e.age, how: `${e.seat} ${sc().n}, nhận ngươi làm đệ tử`, talent: 0.8 }));
  m.trait = e.trait;
  s.flags.masterRole = e.role;
  s.flags.masterPick = m.id;
  if (e.w) s.flags.peakGift = e.key;
  delete refused()[e.key];
  mark(`Bái ${m.name} làm sư phụ`);
  if (e.inner) { if (s.sect!.rank < RK.KYDANH) s.sect!.rank = Math.max(s.sect!.rank, RK.NOI); }
  else if (s.sect!.rank < RK.NGOAI) s.sect!.rank = RK.NGOAI;
  const bk = backer();
  if (bk) return { title: 'Bái sư', text: `${m.name} (${REALMS[m.r].n}, ${e.seat}) đỡ ngươi dậy trước khi ngươi kịp quỳ xong — ${bk}, ai dám không nể mặt. "Từ hôm nay, ngươi là đệ tử của ta." Ngươi vẫn dập đầu chín cái.` + roleGift(e) + extra };
  return { title: 'Bái sư', text: `${m.name} (${REALMS[m.r].n}, ${e.seat}) nhìn ngươi một lúc lâu rồi gật đầu: "Từ hôm nay, ngươi là đệ tử của ta." Ngươi dập đầu chín cái.` + roleGift(e) + extra };
}

// ---------- Tỉ thí (mỗi năm) & Đại bỉ (mười năm) ----------
export const sparDone = () => s.flags.tiThiYear === Math.floor(s.year);
export const daiBiOpen = () => Math.floor(s.year) % 10 === 0;
export const daiBiNext = () => Math.floor(s.year) - (Math.floor(s.year) % 10) + 10;
export const daiBiDone = () => s.flags.daiBiYear === Math.floor(s.year);
function tourney(rounds: number, label: string, big: boolean): Scene {
  passTime(big ? 0.5 : 0.25);
  const lines: string[] = [];
  let wins = 0;
  for (let i = 0; i < rounds; i++) {
    const r = fight({ name: `${pick(['Sư huynh', 'Sư tỷ', 'Sư đệ', 'Sư muội'])} ${pick(['họ Tô', 'họ Lạc', 'họ Mạnh', 'họ Hàn', 'họ Thẩm', 'họ Bạch', 'họ Tần'])}`, r: s.r, st: Math.min(3, i), kind: 'cultivator', mult: 0.85 + i * (big ? 0.08 : 0.07) }, { lethal: false, noLoot: true });
    s.wins -= r.win ? 1 : 0;
    s.kills = Math.max(0, s.kills - (r.win ? 1 : 0));
    lines.push(`Vòng ${i + 1}: ${fightSummary(r)}`);
    if (!r.win) break;
    wins++;
    s.hurt = Math.max(0, s.hurt - 20);
  }
  const t = sc().tier;
  const contrib = Math.round((big ? 60 : 15) * wins * t * (1 + effRi() * 0.3));
  s.sect!.contrib += contrib;
  s.fame += wins * (big ? 15 : 4);
  let extra = '';
  if (big && wins === rounds) { mark(`Đoạt khôi thủ ${label} ${sc().n}`); s.money += M(100); extra = ' Ngươi đoạt khôi thủ! Tông môn ban thưởng hậu hĩnh.'; }
  return { title: label, text: `${lines.join('\n')}\n\nThắng ${wins}/${rounds} vòng. Cống hiến +${contrib}.${extra}` };
}
export function tiThi(): Scene {
  s.flags.tiThiYear = Math.floor(s.year);
  return tourney(3, 'Tông môn tỉ thí', false);
}
export function daiBi(): Scene {
  s.flags.daiBiYear = Math.floor(s.year);
  return tourney(5, 'Tông môn đại bỉ', true);
}

// ---------- Bế quan linh mạch ----------
export const veinCost = () => Math.round(15 * sc().tier * (effRi() + 1));
export function veinCultivate(): Scene {
  const c = veinCost();
  if (s.sect!.contrib < c) return { title: 'Linh mạch', text: 'Không đủ cống hiến.' };
  s.sect!.contrib -= c;
  let g = 0;
  for (let i = 0; i < 3; i++) g += cultivateTurn().gain;
  const bonus = cultRate() * 3;
  addProg(bonus);
  return { title: 'Bế quan linh mạch', text: `Ngươi ngồi trên mắt linh mạch của ${sc().n} ba lượt. Linh khí đặc như sương. Tu vi tăng ${Math.round(g + bonus)}% (gấp đôi bình thường). Tốn ${c} cống hiến.`, kind: 'info' };
}

export const myRankLabel = () => (s.sect ? rankLabel(s.sect.rank, sc(), s.g) : '');
