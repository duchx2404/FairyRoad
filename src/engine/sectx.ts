import { worldDefinitions } from '../data/local-items';
// Chức năng mở rộng của đệ tử tông môn: Nhiệm Vụ Đường, Bái sư, Tỉ thí, Đại bỉ, Bế quan linh mạch.
import { REALMS, EL, SURN, MALE, FEM, DAO_HAO, DAO_HAO_F, type El, splitName, RMAX } from '../data/core';
import { SKILLS, TAMPHAP, HERBS, MATS, TECHS, WEAPON_N, type Weapon } from '../data/items';
import { effRi, thapHidden, tamList, addItem } from './char';
import { learnSkill } from './api';
import { CRAFT_N, craftTitle, gainXp, xpNeed, type CraftK } from './craft';
import { SECTS, SECT_TIER_INFO, SECT_TOP, RK, rankLabel, headTitle, isLaoTo, daoTitle, TITLE_RE } from '../data/world';
import { winSectWar } from './sect';
import { nameKey, uniquePersonalName } from '../core/names';
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
export type Role = 'chu' | 'thaithuong' | 'dan' | 'khi' | 'phu' | 'chap' | 'truyen' | 'vk' | 'the' | 'he' | 'ngoai' | 'tap' | 'tuc' | 'duoc' | 'khoang';
export const ROLE_GIFT: Record<Role, string> = {
  chu: 'Chưởng giáo chân truyền (truyền trấn phái công pháp, ngộ tính +1, danh vọng)',
  thaithuong: 'Thái thượng điểm hóa (ngộ tính +1, căn cốt +1, truyền tuyệt học)',
  dan: 'Dạy luyện đan (+1 bậc tay nghề)', khi: 'Dạy luyện khí (+1 bậc tay nghề)', phu: 'Dạy chế phù (+1 bậc tay nghề)',
  chap: 'Rèn tâm tính (tâm cảnh +1, danh vọng)', truyen: 'Truyền một bộ tâm kinh, ngộ tính +1',
  vk: 'Truyền một môn sát chiêu', the: 'Rèn thân thể (căn cốt +1)', he: 'Truyền một môn thuật pháp cùng hệ',
  ngoai: 'Ghi công (+cống hiến)', tap: 'Giao việc nhẹ, cho thêm cống hiến', tuc: 'Chia lời sản nghiệp (+linh thạch)',
  duoc: 'Cho linh thảo ở dược viên', khoang: 'Cho khoáng liệu luyện khí',
};
export interface Elder {
  key: string; name: string; g: 'm' | 'f'; r: number; st: number; el: El; role: Role;
  seat: string; // "Kiếm Phong phong chủ", "Chấp pháp trưởng lão"...
  w?: Weapon; inner: boolean; top?: boolean; title?: string; trait: string; minRank: number; maxRank: number; age: number; d: string;
  legacyRole?: string;
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
export type SchoolKey = 'jie' | 'chan' | 'laozi' | 'buddhist';
export function schoolKeyOfSect(sectName: string): SchoolKey | null {
  if (sectName.startsWith('Tiệt Giáo')) return 'jie';
  if (sectName.startsWith('Xiển Giáo')) return 'chan';
  if (sectName.startsWith('Đạo Giáo')) return 'laozi';
  if (sectName.startsWith('Tây Phương Giáo') || sectName.startsWith('Phật Giáo')) return 'buddhist';
  return null;
}
export const SCHOOL_HEAD_TITLE: Record<SchoolKey, string> = {
  jie: 'Thượng Thanh Thông Thiên Giáo Chủ (còn gọi là Thượng Thanh Linh Bảo Thiên Tôn) – Giáo chủ Tiệt Giáo',
  chan: 'Ngọc Thanh Nguyên Thủy Thiên Tôn – Giáo chủ Xiển Giáo',
  laozi: 'Thái Thanh Đạo Đức Thiên Tôn (còn gọi là Thái Thượng Lão Quân) – Giáo chủ Đạo Giáo',
  buddhist: 'Tiếp Dẫn Đạo Nhân (A Di Đà Phật) – Đại giáo chủ Tây Phương Giáo',
};

interface LegacySeat {
  canonName: string;
  sur: string;
  title: string;
  seat: string;
  g: 'm' | 'f';
  el: El;
  role: Role;
  inner: boolean;
  top?: boolean;
  w?: Weapon;
  legacyRole?: string;
  d: string;
}

const LEGACY_SCHOOL_ROSTER: Record<SchoolKey, LegacySeat[]> = {
  jie: [
    { canonName: 'Thông Thiên', sur: 'Thông', title: 'Thượng Thanh Thông Thiên Giáo Chủ (còn gọi là Thượng Thanh Linh Bảo Thiên Tôn) – Giáo chủ Tiệt Giáo', seat: 'Giáo chủ Tiệt Giáo', g: 'm', el: 'loi', role: 'chu', inner: true, top: true, legacyRole: 'jie:Giáo chủ Tiệt Giáo', d: 'Chưởng quản Bích Du Cung, chấp chưởng Tru Tiên Tứ Kiếm, chủ trương hữu giáo vô loại — vạn tiên lai triều.' },
    { canonName: 'Đa Bảo', sur: 'Đa', title: 'Đa Bảo Đạo Nhân', seat: 'Thái thượng đại trưởng lão', g: 'm', el: 'tho', role: 'thaithuong', inner: true, top: true, d: 'Đại đệ tử đứng đầu môn hạ Tiệt Giáo, thay mặt Giáo chủ thống lĩnh vạn tiên Bích Du Cung.' },
    { canonName: 'Kim Linh', sur: 'Kim', title: 'Kim Linh Thánh Mẫu', seat: 'Thái thượng trưởng lão', g: 'f', el: 'kim', role: 'thaithuong', inner: true, top: true, d: 'Đứng đầu các nữ tiên Tiệt Giáo, đạo hạnh thâm hậu, tinh thông Vạn Tiên Trận và Long Hổ Ngọc Như Ý.' },
    { canonName: 'Vô Đương', sur: 'Vô', title: 'Vô Đương Thánh Mẫu', seat: 'Thái thượng trưởng lão', g: 'f', el: 'tho', role: 'thaithuong', inner: true, top: true, d: 'Một trong Tứ Đại Đệ Tử thân truyền của Tiệt Giáo, thấu hiểu thiên cơ, giữ trọn căn cơ truyền thừa.' },
    { canonName: 'Quy Linh', sur: 'Quy', title: 'Quy Linh Thánh Mẫu', seat: 'Thái thượng trưởng lão', g: 'f', el: 'thuy', role: 'thaithuong', inner: true, top: true, d: 'Một trong Tứ Đại Đệ Tử thân truyền của Tiệt Giáo, chân thân linh quy vạn cổ, hộ thể vô song.' },
    { canonName: 'Vân Tiêu', sur: 'Vân', title: 'Vân Tiêu Tiên Tử', seat: 'Tam Tiên Đảo đại chủ · Truyền công trưởng lão', g: 'f', el: 'phong', role: 'truyen', inner: true, legacyRole: 'jie:Chủ trì Cửu Khúc Hoàng Hà Trận', d: 'Đại tỷ Tam Tiêu trên Tam Tiên Đảo, chấp chưởng Hỗn Nguyên Kim Đấu và Cửu Khúc Hoàng Hà Trận.' },
    { canonName: 'Quỳnh Tiêu', sur: 'Quỳnh', title: 'Quỳnh Tiêu Tiên Tử', seat: 'Tam Tiên Đảo nhị chủ · Kiếm Phong phong chủ', g: 'f', el: 'thuy', role: 'vk', inner: true, w: 'kiem', d: 'Nhị tỷ Tam Tiêu trên Tam Tiên Đảo, nắm giữ Kim Giao Tiễn, kiếm khí sắc bén tuyệt luân.' },
    { canonName: 'Bích Tiêu', sur: 'Bích', title: 'Bích Tiêu Tiên Tử', seat: 'Tam Tiên Đảo tam chủ · Phù Phong phong chủ', g: 'f', el: 'moc', role: 'phu', inner: true, d: 'Tam muội Tam Tiêu trên Tam Tiên Đảo, tính tình cương liệt, tinh thông trận đồ và phù lục sát phạt.' },
    { canonName: 'Triệu Công Minh', sur: 'Triệu', title: 'Huyền Đàn Chân Quân', seat: 'La Phù Động chủ · Khí Phong phong chủ', g: 'm', el: 'kim', role: 'khi', inner: true, d: 'Huynh trưởng Tam Tiêu, cưỡi Hắc Hổ, chấp chưởng hai mươi tư hạt Định Hải Thần Châu và Kim Tiên.' },
    { canonName: 'Văn Trọng', sur: 'Văn', title: 'Cửu Thiên Ứng Nguyên Lôi Thanh Phổ Hóa Thiên Tôn', seat: 'Chấp pháp trưởng lão', g: 'm', el: 'loi', role: 'chap', inner: true, d: 'Đệ tử chân truyền Kim Linh Thánh Mẫu, trán mở thiên nhãn, tổng lĩnh lôi pháp và môn quy Tiệt Giáo.' },
    { canonName: 'La Tuyên', sur: 'La', title: 'Diệm Trung Tiên', seat: 'Hỏa Long Đảo chủ · Đan Phong phong chủ', g: 'm', el: 'hoa', role: 'dan', inner: true, d: 'Luyện khí sĩ Hỏa Long Đảo, khống chế vạn hỏa luyện đan và thiêu đốt vạn dặm.' },
    { canonName: 'Lữ Nhạc', sur: 'Lữ', title: 'Ôn Hoàng Hạo Thiên Đại Đế', seat: 'Cửu Long Đảo chủ · Độc Phong phong chủ', g: 'm', el: 'am', role: 'he', inner: true, d: 'Đạo nhân Cửu Long Đảo, tinh thông kỳ độc và dịch khí thần thông.' },
    { canonName: 'Kim Quang', sur: 'Kim', title: 'Kim Quang Tiên', seat: 'Thể Phong phong chủ', g: 'm', el: 'quang', role: 'the', inner: true, w: 'quyen', d: 'Một trong Tùy Thị Thất Tiên của Tiệt Giáo, kim thân hộ thể cứng hơn vạn năm huyền thiết.' },
    { canonName: 'Thạch Cơ', sur: 'Thạch', title: 'Thạch Cơ Nương Nương', seat: 'Bạch Cốt Động chủ · Quản sự ngoại môn', g: 'f', el: 'tho', role: 'ngoai', inner: false, d: 'Chủ nhân Khô Lâu Sơn Bạch Cốt Động, nắm giữ Bát Quái Vân Quang Khăn, cai quản đệ tử ngoại môn.' },
    { canonName: 'Ô Vân', sur: 'Ô', title: 'Ô Vân Tiên', seat: 'Quản sự khoáng mạch', g: 'm', el: 'thuy', role: 'khoang', inner: false, d: 'Đứng đầu Tùy Thị Thất Tiên, nắm giữ Hỗn Nguyên Chùy, trông coi linh mạch và kho khoáng Tiệt Giáo.' },
    { canonName: 'Cầu Thủ', sur: 'Cầu', title: 'Cầu Thủ Tiên', seat: 'Quản sự dược viên', g: 'm', el: 'moc', role: 'duoc', inner: false, d: 'Một trong Tùy Thị Thất Tiên, trấn giữ linh thảo viên và tử chi tiên thảo trên Kim Ngao Đảo.' },
  ],
  chan: [
    { canonName: 'Nguyên Thủy', sur: 'Nguyên', title: 'Ngọc Thanh Nguyên Thủy Thiên Tôn – Giáo chủ Xiển Giáo', seat: 'Giáo chủ Xiển Giáo', g: 'm', el: 'quang', role: 'chu', inner: true, top: true, legacyRole: 'chan:Giáo chủ Xiển Giáo', d: 'Chưởng quản Ngọc Hư Cung trên đỉnh Côn Lôn, chấp chưởng Bàn Cổ Phiên, thuận thiên ứng mệnh.' },
    { canonName: 'Nhiên Đăng', sur: 'Nhiên', title: 'Nhiên Đăng Đạo Nhân', seat: 'Phó giáo chủ · Thái thượng đại trưởng lão', g: 'm', el: 'hoa', role: 'thaithuong', inner: true, top: true, d: 'Chủ nhân Linh Thứu Sơn Nguyên Giác Động, phó giáo chủ Xiển Giáo, đạo hạnh uyên thâm.' },
    { canonName: 'Nam Cực', sur: 'Nam', title: 'Nam Cực Tiên Ông (Nam Cực Trường Sinh Đại Đế)', seat: 'Thái thượng trưởng lão', g: 'm', el: 'moc', role: 'thaithuong', inner: true, top: true, d: 'Đại đệ tử đứng đầu Ngọc Hư Cung, thay mặt Giáo chủ truyền pháp chỉ khắp Côn Lôn.' },
    { canonName: 'Quảng Thành', sur: 'Quảng', title: 'Quảng Thành Tử', seat: 'Thủ tọa Thập Nhị Kim Tiên · Thái thượng trưởng lão', g: 'm', el: 'kim', role: 'thaithuong', inner: true, top: true, legacyRole: 'chan:Thủ đồ Xiển Giáo', d: 'Đứng đầu Thập Nhị Kim Tiên Xiển Giáo tại Cửu Tiên Sơn Đào Nguyên Động, chấp chưởng Phiên Thiên Ấn.' },
    { canonName: 'Xích Tinh', sur: 'Xích', title: 'Xích Tinh Tử', seat: 'Thái Hoa Sơn chủ · Truyền công trưởng lão', g: 'm', el: 'hoa', role: 'truyen', inner: true, d: 'Một trong Thập Nhị Kim Tiên tại Thái Hoa Sơn Vân Tiêu Động, chấp chưởng Âm Dương Kính.' },
    { canonName: 'Thái Ất', sur: 'Thái', title: 'Thái Ất Chân Nhân', seat: 'Càn Nguyên Sơn chủ · Khí Phong phong chủ', g: 'm', el: 'hoa', role: 'khi', inner: true, d: 'Một trong Thập Nhị Kim Tiên tại Càn Nguyên Sơn Kim Quang Động, tinh thông luyện bảo và Cửu Long Thần Hỏa Tráo.' },
    { canonName: 'Ngọc Đỉnh', sur: 'Ngọc', title: 'Ngọc Đỉnh Chân Nhân', seat: 'Ngọc Tuyền Sơn chủ · Kiếm Phong phong chủ', g: 'm', el: 'kim', role: 'vk', inner: true, w: 'kiem', d: 'Một trong Thập Nhị Kim Tiên tại Ngọc Tuyền Sơn Kim Hà Động, chấp chưởng Trảm Tiên Kiếm và Bát Cửu Huyền Công.' },
    { canonName: 'Văn Thù', sur: 'Văn', title: 'Văn Thù Quảng Pháp Thiên Tôn', seat: 'Ngũ Long Sơn chủ · Chấp pháp trưởng lão', g: 'm', el: 'quang', role: 'chap', inner: true, d: 'Một trong Thập Nhị Kim Tiên tại Ngũ Long Sơn Vân Tiêu Động, chấp chưởng Độn Long Thung giữ môn quy.' },
    { canonName: 'Phổ Hiền', sur: 'Phổ', title: 'Phổ Hiền Chân Nhân', seat: 'Cửu Cung Sơn chủ · Phù Phong phong chủ', g: 'm', el: 'tho', role: 'phu', inner: true, d: 'Một trong Thập Nhị Kim Tiên tại Cửu Cung Sơn Bạch Hạc Động, tinh thông Ngô Câu Song Kiếm và phù ấn.' },
    { canonName: 'Từ Hàng', sur: 'Từ', title: 'Từ Hàng Đạo Nhân', seat: 'Phổ Đà Sơn chủ · Đan Phong phong chủ', g: 'f', el: 'thuy', role: 'dan', inner: true, d: 'Một trong Thập Nhị Kim Tiên tại Phổ Đà Sơn Lạc Già Động, giữ Thanh Tịnh Lưu Ly Bình cứu độ chúng sinh.' },
    { canonName: 'Dương Tiễn', sur: 'Dương', title: 'Nhị Lang Hiển Thánh Chân Quân', seat: 'Tam Tiêm Lưỡng Nhận · Chiến Đường đường chủ', g: 'm', el: 'loi', role: 'the', inner: true, w: 'kich', d: 'Hộ pháp đệ nhất thế hệ ba của Xiển Giáo, tu thành Bát Cửu Huyền Công và Thiên Nhãn bất bại.' },
    { canonName: 'Na Tra', sur: 'Lý', title: 'Tam Đàn Hải Hội Đại Thần', seat: 'Thương Phong phong chủ', g: 'm', el: 'hoa', role: 'vk', inner: true, w: 'thuong', d: 'Linh Châu Tử chuyển thế, liên hoa hóa thân, tay cầm Hỏa Tiêm Thương và Càn Khôn Quyển.' },
    { canonName: 'Khương Tử Nha', sur: 'Khương', title: 'Phi Hùng Đạo Nhân – Chấp chưởng Phong Thần', seat: 'Chấp chưởng Phong Thần · Quản sự ngoại môn', g: 'm', el: 'tho', role: 'ngoai', inner: false, legacyRole: 'chan:Chấp chưởng Phong Thần', d: 'Chấp chưởng Đả Thần Tiên và Phong Thần Bảng, khảo hạch khí vận và công đức môn nhân.' },
    { canonName: 'Vân Trung', sur: 'Vân', title: 'Vân Trung Tử', seat: 'Chung Nam Sơn chủ · Quản sự khoáng mạch', g: 'm', el: 'phong', role: 'khoang', inner: false, d: 'Phúc đức chân tiên tại Chung Nam Sơn Ngọc Trụ Động, tinh thông luyện bảo và tầm khoáng.' },
    { canonName: 'Cụ Lưu', sur: 'Cụ', title: 'Cụ Lưu Tôn', seat: 'Giáp Long Sơn chủ · Quản sự dược viên', g: 'm', el: 'tho', role: 'duoc', inner: false, d: 'Một trong Thập Nhị Kim Tiên tại Giáp Long Sơn Phi Vân Động, nắm giữ Khổn Tiên Thừng và địa hành thuật.' },
  ],
  laozi: [
    { canonName: 'Lão Tử', sur: 'Lý', title: 'Thái Thanh Đạo Đức Thiên Tôn (còn gọi là Thái Thượng Lão Quân) – Giáo chủ Đạo Giáo', seat: 'Giáo chủ Đạo Giáo', g: 'm', el: 'tho', role: 'chu', inner: true, top: true, legacyRole: 'laozi:Giáo chủ Đạo Giáo', d: 'Đứng đầu Tam Thanh tại Huyền Đô Bát Cảnh Cung, chấp chưởng Thái Cực Đồ và Thiên Địa Huyền Hoàng Linh Lung Tháp, vô vi nhi trị.' },
    { canonName: 'Huyền Đô', sur: 'Huyền', title: 'Huyền Đô Đại Pháp Sư', seat: 'Thái thượng đại trưởng lão', g: 'm', el: 'hoa', role: 'thaithuong', inner: true, top: true, d: 'Đệ tử đích truyền duy nhất của Thái Thượng Lão Quân tại Bát Cảnh Cung, chưởng quản Bát Quái Lô và Thái Thanh đạo thống.' },
    { canonName: 'Độ Ách', sur: 'Độ', title: 'Độ Ách Chân Nhân', seat: 'Thái thượng trưởng lão', g: 'm', el: 'phong', role: 'thaithuong', inner: true, top: true, d: 'Bậc tiên nhân đắc đạo ở Cửu Đỉnh Thiết Xoa Sơn Bát Bảo Vân Quang Động, nắm giữ Định Phong Châu.' },
    { canonName: 'Doãn Hỷ', sur: 'Doãn', title: 'Văn Thủy Chân Nhân', seat: 'Truyền công trưởng lão', g: 'm', el: 'quang', role: 'truyen', inner: true, d: 'Người đón khí tím ở Hàm Cốc Quan, được truyền Đạo Đức Kinh năm ngàn chữ, giữ tàng kinh Bát Cảnh Cung.' },
    { canonName: 'Trang Chu', sur: 'Trang', title: 'Nam Hoa Chân Nhân', seat: 'Chấp pháp trưởng lão', g: 'm', el: 'phong', role: 'chap', inner: true, d: 'Mộng hóa hồ điệp, tiêu dao tự tại, lấy thiên đạo tự nhiên làm môn quy.' },
    { canonName: 'Liệt Ngự Khấu', sur: 'Liệt', title: 'Xung Hư Chân Nhân', seat: 'Phù Phong phong chủ', g: 'm', el: 'phong', role: 'phu', inner: true, d: 'Ngự phong nhi hành, câu thông thiên địa huyền phù.' },
    { canonName: 'Kim Giác', sur: 'Kim', title: 'Kim Giác Đạo Nhân', seat: 'Đan Phong phong chủ', g: 'm', el: 'hoa', role: 'dan', inner: true, d: 'Chưởng quản lò Bát Quái luyện Cửu Chuyển Kim Đan, nắm giữ Tử Kim Hồng Hồ Lô.' },
    { canonName: 'Ngân Giác', sur: 'Ngân', title: 'Ngân Giác Đạo Nhân', seat: 'Khí Phong phong chủ', g: 'm', el: 'kim', role: 'khi', inner: true, d: 'Chưởng quản Lục Đinh Thần Hỏa rèn pháp bảo Bát Cảnh Cung, giữ Thất Tinh Kiếm và Ba Tiêu Phiến.' },
    { canonName: 'Thanh Ngưu', sur: 'Ngưu', title: 'Độc Giác Huyền Tiên', seat: 'Thể Phong phong chủ', g: 'm', el: 'tho', role: 'the', inner: true, w: 'quyen', d: 'Hộ đạo linh thú của Bát Cảnh Cung, nhục thân bất hoại, nắm giữ Kim Cang Trác khắc chế vạn bảo.' },
    { canonName: 'Văn Tử', sur: 'Văn', title: 'Thông Huyền Chân Nhân', seat: 'Kiếm Phong phong chủ', g: 'm', el: 'thuy', role: 'vk', inner: true, w: 'kiem', d: 'Tu Thái Thanh kiếm ý lấy nhu thắng cương, kiếm xuất như nước chảy mây trôi.' },
    { canonName: 'Huyền Minh', sur: 'Huyền', title: 'Thái Thanh Tiên Đồng', seat: 'Quản sự ngoại môn', g: 'm', el: 'moc', role: 'ngoai', inner: false, d: 'Thị giả lâu năm trước cửa Bát Cảnh Cung, coi sóc danh sách và khảo hạch đệ tử nhập môn.' },
    { canonName: 'Thái Hòa', sur: 'Thái', title: 'Thái Hòa Tiên Tử', seat: 'Quản sự dược viên', g: 'f', el: 'moc', role: 'duoc', inner: false, d: 'Trông coi vườn tiên thảo phục vụ luyện chế Cửu Chuyển Kim Đan.' },
    { canonName: 'Cương Sơn', sur: 'Cương', title: 'Bát Cảnh Lực Sĩ', seat: 'Quản sự khoáng mạch', g: 'm', el: 'kim', role: 'khoang', inner: false, d: 'Khai thác thần thiết và linh thạch dâng vào lò Bát Quái.' },
  ],
  buddhist: [
    { canonName: 'Tiếp Dẫn', sur: 'Tiếp', title: 'Tiếp Dẫn Đạo Nhân (A Di Đà Phật) – Đại giáo chủ Tây Phương Giáo', seat: 'Đại giáo chủ Tây Phương Giáo', g: 'm', el: 'quang', role: 'chu', inner: true, top: true, legacyRole: 'buddhist:Đại giáo chủ Tây Phương', d: 'Cùng Chuẩn Đề lập nên Tây Phương Giáo, ngự trên Thập Nhị Phẩm Công Đức Kim Liên, tiếp dẫn vạn linh về Cực Lạc.' },
    { canonName: 'Chuẩn Đề', sur: 'Chuẩn', title: 'Chuẩn Đề Đạo Nhân (Thất Câu Đê Phật Mẫu) – Nhị giáo chủ Tây Phương Giáo', seat: 'Nhị giáo chủ · Thái thượng đại trưởng lão', g: 'm', el: 'moc', role: 'thaithuong', inner: true, top: true, legacyRole: 'buddhist:Nhị giáo chủ Tây Phương', d: 'Cùng Tiếp Dẫn sáng lập Tây Phương Giáo, chấp chưởng Thất Bảo Diệu Thụ và Pháp Thân mười tám tay.' },
    { canonName: 'Như Lai', sur: 'Thích', title: 'Đa Bảo Như Lai (Thích Ca Mâu Ni Phật)', seat: 'Thái thượng trưởng lão', g: 'm', el: 'quang', role: 'thaithuong', inner: true, top: true, d: 'Chí tôn Đại Lôi Âm Tự trên đỉnh Linh Sơn, chưởng Trung Ương Bà Sa Thế Giới, bàn tay hóa Ngũ Hành Sơn.' },
    { canonName: 'Nhiên Đăng', sur: 'Nhiên', title: 'Nhiên Đăng Thượng Cổ Phật', seat: 'Thái thượng trưởng lão', g: 'm', el: 'hoa', role: 'thaithuong', inner: true, top: true, d: 'Quá khứ Phật của Tây Phương Linh Sơn, giữ hai mươi tư hạt Định Hải Thần Châu hóa thành Nhị Thập Tứ Chư Thiên.' },
    { canonName: 'A Dật Đa', sur: 'Di', title: 'Đông Lai Phật Tổ Di Lặc Tôn Phật', seat: 'Truyền công trưởng lão', g: 'm', el: 'tho', role: 'truyen', inner: true, d: 'Vị lai Phật của Tây Phương Giáo, nắm giữ Nhân Chủng Đại và Kim Nhiêu, truyền thụ đại thừa tâm kinh.' },
    { canonName: 'Dược Sư', sur: 'Dược', title: 'Dược Sư Lưu Ly Quang Vương Phật', seat: 'Tịnh Lưu Ly chủ · Đan Phong phong chủ', g: 'm', el: 'moc', role: 'dan', inner: true, d: 'Giáo chủ thế giới Tịnh Lưu Ly, tinh thông y đạo và luyện chế Phật môn linh đan cứu thế.' },
    { canonName: 'Kim Kiều Giác', sur: 'Kim', title: 'Đại Nguyện Địa Tạng Vương Bồ Tát', seat: 'Chấp pháp trưởng lão', g: 'm', el: 'am', role: 'chap', inner: true, d: 'Phát đại nguyện "Địa ngục chưa trống, thề không thành Phật", có Đế Thính phân biệt thật giả, giữ giới luật Tây Phương.' },
    { canonName: 'Diệu Thiện', sur: 'Diệu', title: 'Đại Bi Quan Thế Âm Bồ Tát', seat: 'Phù Phong phong chủ', g: 'f', el: 'thuy', role: 'phu', inner: true, d: 'Tầm thanh cứu khổ, giữ Tịnh Bình Dương Liễu và Lục Tự Đại Minh Chân Ngôn phù ấn.' },
    { canonName: 'Mạn Thù', sur: 'Mạn', title: 'Đại Trí Văn Thù Sư Lợi Bồ Tát', seat: 'Kiếm Phong phong chủ', g: 'm', el: 'kim', role: 'vk', inner: true, w: 'kiem', d: 'Trí tuệ đệ nhất Phật môn, tay cầm Tuệ Kiếm chém đứt vô minh phiền não.' },
    { canonName: 'Tam Mạn Đa', sur: 'Tam', title: 'Đại Hạnh Phổ Hiền Bồ Tát', seat: 'Khí Phong phong chủ', g: 'm', el: 'loi', role: 'khi', inner: true, d: 'Hạnh nguyện đệ nhất, cưỡi Bạch Tượng sáu ngà, luyện chế pháp khí hộ đạo.' },
    { canonName: 'Đắc Đại Thế', sur: 'Đắc', title: 'Đại Thế Chí Bồ Tát', seat: 'Thể Phong phong chủ', g: 'm', el: 'quang', role: 'the', inner: true, w: 'chuong', d: 'Một trong Tây Phương Tam Thánh, bước chân rung chuyển đại thiên thế giới, kim thân lực lượng vô song.' },
    { canonName: 'Ma Ha Ca Diếp', sur: 'Ca', title: 'Ma Ha Ca Diếp Tôn Giả', seat: 'Quản sự ngoại môn', g: 'm', el: 'tho', role: 'ngoai', inner: false, d: 'Đầu đà đệ nhất, niêm hoa vi tiếu, khảo hạch tâm tính đệ tử ngoại môn.' },
    { canonName: 'A Nan Đà', sur: 'A', title: 'A Nan Đà Tôn Giả', seat: 'Quản sự dược viên', g: 'm', el: 'phong', role: 'duoc', inner: false, d: 'Đa văn đệ nhất, thuộc nằm lòng vạn quyển kinh thư và trăm ngàn loài linh dược Tây Phương.' },
    { canonName: 'Di Lặc Nhĩ', sur: 'Di', title: 'Phục Hổ La Hán', seat: 'Quản sự khoáng mạch', g: 'm', el: 'kim', role: 'khoang', inner: false, d: 'Một trong Thập Bát La Hán, hàng phục mãnh hổ, trông coi khoáng mạch và bảo tháp dưới chân Linh Sơn.' },
  ],
};

function legacySchoolRoster(sk: SchoolKey, sct: ReturnType<typeof sc>, era: number, rnd: () => number, rp: <T>(a: readonly T[]) => T, chu: number): Elder[] {
  const w = s.world ?? 0;
  const seats = LEGACY_SCHOOL_ROSTER[sk];
  const usedNames = new Set<string>();
  const usedGivens = new Set<string>();
  for (const item of seats) {
    usedNames.add(nameKey(item.canonName));
    usedNames.add(nameKey(`${item.sur} ${item.canonName}`));
    usedNames.add(nameKey(item.title));
    usedGivens.add(nameKey(splitName(item.canonName).given));
  }
  const people: { alive?: boolean; world?: number; legacyRole?: string; name?: string }[] = s.flags.tienco?.people ?? [];
  for (const item of seats) {
    if (item.legacyRole) {
      const holder = people.find((p) => p.alive && p.world === w && p.legacyRole === item.legacyRole);
      if (holder?.name) {
        usedNames.add(nameKey(holder.name));
        usedGivens.add(nameKey(splitName(holder.name).given));
      }
    }
  }
  const curMaster = master();
  return seats.map((item, i) => {
    const r = w === 4
      ? (item.role === 'chu' ? 8 : item.role === 'thaithuong' ? 7 : item.inner ? 6 : 5)
      : clamp(item.role === 'chu' || item.role === 'thaithuong' ? chu : item.inner ? chu - 1 : chu - 2, 1, 8);
    const st = item.role === 'chu' ? 3 : item.role === 'thaithuong' ? (w === 4 ? 3 : 2) : Math.floor(rnd() * 3) + 1;
    let name: string;
    if (w === 4) {
      name = item.canonName;
    } else {
      const holder = item.legacyRole ? people.find((p) => p.alive && p.world === w && p.legacyRole === item.legacyRole) : undefined;
      if (holder?.name) {
        name = holder.name;
      } else if (curMaster && curMaster.sect === sct.id && item.title && curMaster.how?.includes(item.title.split(' – ')[0])) {
        name = curMaster.name;
      } else {
        name = uniquePersonalName(item.g, item.sur, usedNames, `${s.id}:${sct.id}:${w}:${era}:${i}:${item.title}`, usedGivens);
      }
      usedNames.add(nameKey(name));
      usedGivens.add(nameKey(splitName(name).given));
    }
    const shortTitle = item.title.split(' – ')[0];
    const d = w === 4 ? item.d : `Hậu nhân họ ${item.sur} kế thừa đạo hiệu ${shortTitle}. ${item.d}`;
    return {
      key: `${sct.id}:${era}:legacy:${i}`,
      name,
      title: item.title,
      g: item.g,
      r,
      st,
      el: item.el,
      role: item.role,
      seat: item.seat,
      w: item.w,
      inner: item.inner,
      top: item.top,
      trait: rp(TRAITS),
      minRank: RK.TAP,
      maxRank: RK.THAITHUONG,
      age: Math.round(REALMS[r].life * (item.top ? 0.55 + rnd() * 0.3 : 0.3 + rnd() * 0.45)),
      d,
      legacyRole: item.legacyRole,
    };
  });
}

/** Toàn bộ trưởng lão nhận đồ đệ của tông (đổi mỗi 30 năm). */
export function elderRoster(): Elder[] {
  const sct = sc();
  const era = Math.floor(s.year / 30);
  const rnd = seeded(hashStr(`${sct.id}:elders:${era}`));
  const rp = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
  const chu = SECT_TIER_INFO[sct.tier].chu;
  const sk = schoolKeyOfSect(sct.n);
  if (sk) return legacySchoolRoster(sk, sct, era, rnd, rp, chu);
  const used = new Set<string>();
  const out: Elder[] = [];
  const add = (inner: boolean, seat: string, role: Role, el: El, r: number, d: string, gFix?: 'm' | 'f', w?: Weapon, top?: boolean) => {
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
      key: `${sct.id}:${era}:${out.length}`, name, g, r, w, st: top ? 3 : Math.floor(rnd() * 4), el, role, seat, inner, top, trait: rp(TRAITS), d,
      minRank: top ? RK.TAP : inner ? RK.NOI : RK.TAP, maxRank: inner ? RK.THAITHUONG : RK.NGOAI,
      age: Math.round(REALMS[r].life * (0.3 + rnd() * 0.45)),
    });
    // danh xưng theo bậc thế lực (không tiêu thêm số ngẫu nhiên để giữ nguyên danh sách)
    const e = out[out.length - 1];
    if (TITLE_RE.test(e.name)) e.name = daoTitle(tok, r, e.st, sct.tier, g);
    else if (isLaoTo(r, e.st, sct.tier) && hashStr(e.key) % 2 === 0) e.name = `${tok} Lão Tổ`;
  };
  const lv = (pLow: number) => chu - 1 - (rnd() < pLow ? 1 : 0); // pLow = xác suất thấp hơn một bậc
  // ----- chưởng giáo & thái thượng trưởng lão -----
  const topRealm = Math.max(chu, SECT_TOP[sct.tier] - 1);
  add(true, headTitle(sct), 'chu', rp(sct.el), chu, `Chưởng quản toàn tông ${sct.n}, nắm giữ trấn phái công pháp. Hiếm khi thu nhận đồ đệ, một khi nhận là lập làm chân truyền.`, undefined, undefined, true);
  add(true, 'Thái thượng đại trưởng lão', 'thaithuong', rp(sct.el), topRealm, 'Bậc lão tổ bế quan ở hậu sơn, tu vi thâm sâu khó lường, chỉ khi tông môn có đại sự mới xuất quan.', undefined, undefined, true);
  add(true, 'Thái thượng trưởng lão', 'thaithuong', rp(sct.el), topRealm, 'Bậc tiền bối thoái ẩn hậu sơn, một lòng tham ngộ đại đạo, cực kỳ kén chọn truyền nhân.', undefined, undefined, true);
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
export const isMyMaster = (e: Elder) => {
  const m = master();
  if (!m || m.sect !== s.sect?.id) return false;
  if (e.legacyRole && (s.flags.masterLegacyRole === e.legacyRole || m.how?.includes(e.legacyRole))) return true;
  if (e.title && m.how?.includes(e.title.split(' – ')[0])) return true;
  if (e.seat && m.how?.includes(e.seat)) return true;
  return baseName(m.name) === baseName(e.name);
};
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
    const pool = worldDefinitions('sk').filter((k) => k.w === e.w && k.el !== 'hondon' && k.tier <= cap && !s.known.includes(k.id));
    if (!pool.length) { s.stats.ngo++; return ` ${WEAPON_N[e.w!]} pháp của sư phụ ngươi đã học hết, sư phụ bèn giảng ${WEAPON_N[e.w!].toLowerCase()} ý — ngộ tính +1.`; }
    const k = pool.sort((x, y) => y.tier - x.tier)[0];
    return ` Sư phụ truyền ${WEAPON_N[e.w!].toLowerCase()} pháp ${k.n}.` + learnSkill(k.id).replace(/^ Lĩnh ngộ [^.]*\./, '');
  };
  switch (e.role) {
    case 'chu': {
      s.stats.ngo++;
      s.fame += 25 * tier;
      const tid = sc().tech;
      const hasTech = s.tech === tid || s.bag.some((b) => b.id === 'cp:' + tid);
      if (!hasTech && TECHS[tid]) {
        addItem('cp:' + tid);
        return ` Chưởng giáo đích thân truyền thụ trấn phái tuyệt học 《${TECHS[tid].n}》, giảng giải đại đạo (ngộ tính +1, danh vọng đại tăng).`;
      }
      return ' Chưởng giáo đích thân khai đàn giảng đạo (ngộ tính +1, danh vọng đại tăng).' + skill(['atk', 'multi', 'dot', 'shield', 'heal'], false);
    }
    case 'thaithuong': {
      s.stats.ngo++;
      s.stats.can++;
      s.fame += 15 * tier;
      return ' Thái thượng trưởng lão lấy chân nguyên tẩy kinh phạt tủy cho ngươi (ngộ tính +1, căn cốt +1).' + skill(['atk', 'multi', 'dot', 'shield', 'heal'], false);
    }
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
  if (worldDefinitions('sk').some((k) => k.w === e.w && k.el !== 'hondon' && s.known.includes(k.id))) return null;
  const cap = clamp(Math.ceil((effRi() + 1) / 1.5), 1, 6);
  const k = worldDefinitions('sk').filter((x) => x.w === e.w && x.el !== 'hondon' && x.tier <= cap).sort((x, y) => y.tier - x.tier)[0];
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
  const fullTitle = e.title ? (e.title.includes(e.seat) ? e.title : `${e.title} · ${e.seat}`) : e.seat;
  const npcData = mkNpc({ name: e.name, g: e.g, r: e.r, st: e.st, sect: s.sect!.id, tag: 'master', rel: 50, el: e.el, age: e.age, how: `${fullTitle} ${sc().n}, nhận ngươi làm đệ tử`, talent: e.top ? 1.2 : 0.8 });
  const w = s.world ?? 0;
  const p = e.legacyRole ? (s.flags.tienco?.people as any[])?.find((p) => p.alive && p.world === w && p.legacyRole === e.legacyRole) : undefined;
  if (p) {
    p.npc = npcData.id;
    p.name = npcData.name;
    if (p.beast) npcData.beast = p.beast;
    if (p.race) npcData.race = p.race;
  }
  const m = addNpc(npcData);
  m.trait = e.trait;
  s.flags.masterRole = e.role;
  s.flags.masterPick = m.id;
  if (e.legacyRole) s.flags.masterLegacyRole = e.legacyRole;
  if (e.w) s.flags.peakGift = e.key;
  delete refused()[e.key];
  mark(`Bái ${m.name} làm sư phụ`);
  if (e.top) { if (s.sect!.rank < RK.THANTRUYEN) s.sect!.rank = RK.THANTRUYEN; }
  else if (e.inner) { if (s.sect!.rank < RK.KYDANH) s.sect!.rank = Math.max(s.sect!.rank, RK.NOI); }
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

// ---------- Tông môn chiến ----------
export function sectWarScene(): Scene {
  const me = sc();
  const foe = Object.values(SECTS).find((x) => x.id !== me.id && Math.abs(x.tier - me.tier) <= 1)
    || Object.values(SECTS).find((x) => x.id !== me.id)!;
  s.flags.lastSectWar = Math.floor(s.year);
  passTime(0.5);

  const lines: string[] = [];
  lines.push(`Hộ sơn đại trận khởi động, chuông lệnh triệu tập đệ tử toàn môn. ${me.n} cùng ${foe.n} giao tranh quyết liệt tranh đoạt linh mạch và truyền thừa đại đạo!`);

  // Trận 1: Tiên phong đệ tử địch
  const r1 = fight({ name: `Đội tiên phong ${foe.n}`, r: Math.max(1, s.r), st: 1, kind: 'cultivator', mult: 0.95, el: foe.el[0] }, { lethal: false });
  lines.push(`Tiên phong giao tranh: ${fightSummary(r1)}`);

  if (!r1.win) {
    s.hurt = Math.min(90, s.hurt + 20);
    s.sect!.contrib += 40 * me.tier;
    return { title: 'Tông môn chiến', text: `${lines.join('\n\n')}\n\nTrận đầu thất lợi, tông môn đành lui về củng cố phòng ngự. Ngươi nhận được ${40 * me.tier} cống hiến khích lệ.` };
  }

  // Trận 2: Trưởng lão / Chiến tướng địch
  const r2 = fight({ name: `Trưởng lão hộ tông ${foe.n}`, r: Math.min(RMAX(), s.r + 1), st: 2, kind: 'boss', mult: 1.05, el: foe.el[0] }, { lethal: false });
  lines.push(`Quyết chiến chủ lực: ${fightSummary(r2)}`);

  if (!r2.win) {
    s.hurt = Math.min(90, s.hurt + 25);
    s.sect!.contrib += 100 * me.tier;
    return { title: 'Tông môn chiến', text: `${lines.join('\n\n')}\n\nĐối phương quá mạnh, ngươi kiệt lực lui về. Tuy vậy chiến ý của ngươi đã cổ vũ toàn môn giữ vững trận nhãn. Nhận ${100 * me.tier} cống hiến.` };
  }

  // Chiến thắng toàn diện!
  const winMsg = winSectWar(foe.id);
  return {
    title: 'Tông môn chiến đại thắng!',
    text: `${lines.join('\n\n')}\n\n${winMsg}`,
  };
}
