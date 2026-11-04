// Dữ liệu nền: ngũ hành, cảnh giới, linh căn, thể chất, thiên phú, xuất thân, tên.

export type El = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho' | 'bang' | 'loi' | 'phong' | 'am' | 'quang' | 'yin' | 'yang' | 'hondon' | 'none';

export const EL: Record<El, { n: string; c: string }> = {
  kim: { n: 'Kim', c: '#a8862f' },
  moc: { n: 'Mộc', c: '#4f7a45' },
  thuy: { n: 'Thủy', c: '#35627e' },
  hoa: { n: 'Hỏa', c: '#a8392b' },
  tho: { n: 'Thổ', c: '#8a6a3f' },
  bang: { n: 'Băng', c: '#5f8fa6' },
  loi: { n: 'Lôi', c: '#6a4f98' },
  phong: { n: 'Phong', c: '#5c8c7a' },
  am: { n: 'Ám', c: '#3b3150' },
  quang: { n: 'Quang', c: '#c49a2c' },
  yin: { n: 'Âm', c: '#2a2a3a' },
  yang: { n: 'Dương', c: '#e0a030' },
  hondon: { n: 'Hỗn Độn', c: '#a886d8' },
  none: { n: 'Vô Tính', c: '#888888' },
};
export const BASIC_EL: El[] = ['kim', 'moc', 'thuy', 'hoa', 'tho'];
export const VARIANT_EL: El[] = ['bang', 'loi', 'phong', 'am', 'quang'];
/** Trọng số khi ra dị linh căn: Ám và Quang hiếm hơn. */
export const VARIANT_W: Record<string, number> = { bang: 3, loi: 3, phong: 3, am: 1, quang: 1 };
export const ALL_EL: El[] = [...BASIC_EL, ...VARIANT_EL];
/** Âm / Dương: linh căn tiên thiên ngoài mười hệ, hiếm hơn Ám / Quang nhiều. Có cả hai thì hợp thành Bát quái linh căn. */
export const YINYANG_EL: El[] = ['yin', 'yang'];
export const EVERY_EL: El[] = [...ALL_EL, ...YINYANG_EL];

/** a khắc b. */
const KHAC: Record<El, El[]> = {
  kim: ['moc'],
  moc: ['tho'],
  tho: ['thuy'],
  thuy: ['hoa'],
  hoa: ['kim', 'bang'],
  bang: ['thuy', 'phong'],
  phong: ['tho', 'loi'],
  loi: ['moc', 'bang'],
  am: ['quang', 'loi'],
  quang: ['am', 'bang'],
  yin: ['yang', 'am', 'quang'],
  yang: ['yin', 'am', 'quang'],
  hondon: [],
  none: [],
};
/** a sinh b (tương sinh) — công pháp hệ được sinh vẫn tu được, chậm hơn chút. */
export const SINH: Partial<Record<El, El>> = { kim: 'thuy', thuy: 'moc', moc: 'hoa', hoa: 'tho', tho: 'kim' };

export function elMult(att: El | null | undefined, def: El | null | undefined): number {
  if (!att || !def || att === 'hondon' || def === 'hondon') return 1;
  if (KHAC[att]?.includes(def)) return 1.5;
  if (KHAC[def]?.includes(att)) return 0.75;
  return 1;
}
export const khacOf = (e: El) => KHAC[e];

// ---------- Cảnh giới ----------
export interface Realm {
  n: string;
  life: number; // thọ nguyên (năm)
  turn: number; // một lượt tu luyện kéo dài bao nhiêu năm
  pow: number; // sức mạnh nền
  diff: number; // độ khó tu luyện
  speed: number; // dặm/năm khi đi đường
}
export const REALMS: Realm[] = [
  { n: 'Phàm Nhân', life: 72, turn: 0.25, pow: 5, diff: 1, speed: 1000 },
  { n: 'Luyện Khí', life: 120, turn: 0.5, pow: 24, diff: 1, speed: 1800 },
  { n: 'Trúc Cơ', life: 220, turn: 1, pow: 90, diff: 1.15, speed: 4000 },
  { n: 'Kết Đan', life: 460, turn: 2, pow: 320, diff: 1.3, speed: 8000 },
  { n: 'Nguyên Anh', life: 900, turn: 4, pow: 1100, diff: 1.5, speed: 16000 },
  { n: 'Hóa Thần', life: 1800, turn: 8, pow: 3600, diff: 1.7, speed: 32000 },
  { n: 'Luyện Hư', life: 3500, turn: 15, pow: 11000, diff: 1.9, speed: 64000 },
  { n: 'Hợp Thể', life: 6000, turn: 30, pow: 34000, diff: 2.1, speed: 128000 },
  { n: 'Đại Thừa', life: 10000, turn: 50, pow: 100000, diff: 2.4, speed: 260000 },
  { n: 'Độ Kiếp', life: 15000, turn: 80, pow: 300000, diff: 2.7, speed: 500000 },
  // ---- Linh Giới ----
  { n: 'Nhân Tiên', life: 20000, turn: 100, pow: 9e5, diff: 2.9, speed: 8e5 },
  { n: 'Địa Tiên', life: 30000, turn: 120, pow: 2.7e6, diff: 3.1, speed: 1.1e6 },
  { n: 'Thiên Tiên', life: 50000, turn: 150, pow: 8.1e6, diff: 3.3, speed: 1.5e6 },
  // ---- Tiên Giới ----
  { n: 'Chân Tiên', life: 80000, turn: 180, pow: 2.4e7, diff: 3.5, speed: 2e6 },
  { n: 'Huyền Tiên', life: 130000, turn: 220, pow: 7.3e7, diff: 3.7, speed: 2.6e6 },
  { n: 'Kim Tiên', life: 200000, turn: 260, pow: 2.2e8, diff: 3.9, speed: 3.4e6 },
  // ---- Thần Giới ----
  { n: 'Thái Ất Kim Tiên', life: 350000, turn: 320, pow: 6.6e8, diff: 4.1, speed: 4.5e6 },
  { n: 'Đại La Kim Tiên', life: 600000, turn: 400, pow: 2e9, diff: 4.4, speed: 6e6 },
  { n: 'Chuẩn Thánh', life: 1e6, turn: 500, pow: 6e9, diff: 4.7, speed: 8e6 },
  // ---- Hồng Hoang ----
  { n: 'Thánh Nhân', life: 1e7, turn: 700, pow: 1.8e10, diff: 5, speed: 1.2e7 },
  { n: 'Hợp Đạo', life: 1e8, turn: 1000, pow: 5.4e10, diff: 5.5, speed: 2e7 },
  // ---- Hỗn Độn ----
  { n: 'Đại Đạo', life: 1e9, turn: 1500, pow: 1.6e11, diff: 6, speed: 4e7 },
];
/** Các giới theo tầng thứ sinh mệnh. Phi thăng = lên giới kế tiếp, tu lại từ Luyện Khí. */
export const WORLDS = ['Thương Lan Giới', 'Linh Giới', 'Tiên Giới', 'Thần Giới', 'Hồng Hoang', 'Hỗn Độn'];
export const worldName = (w: number) => WORLDS[Math.min(w, WORLDS.length - 1)];
/** Cảnh giới cao nhất tu được ở mỗi giới: Độ Kiếp, Thiên Tiên, Kim Tiên, Chuẩn Thánh, Hợp Đạo, Đại Đạo. */
export const WORLD_CAP = [9, 12, 15, 18, 20, 21];
/** Giới cuối cùng: tu tới Đại Đạo viên mãn là thành tựu tối thượng. */
export const LAST_WORLD = WORLDS.length - 1;
/** Giới hiện tại (đồng bộ với s.world khi vào game / phi thăng). */
export const WORLD = { lv: 0 };
/** Sức mạnh nhân theo giới: Luyện Khí giới trên vẫn mạnh hơn Độ Kiếp viên mãn giới dưới. */
/** Trần cảnh giới của giới hiện tại. */
export const RMAX = (w = WORLD.lv) => WORLD_CAP[Math.min(w, LAST_WORLD)];
/** Đại Đạo: trong trời đất chỉ có MỘT người. Muốn lên Đại Đạo phải giết kẻ đang giữ nó. */
export const DAI_DAO = 21;
/** Kẻ đang ngồi ở Đại Đạo khi ngươi tới Hỗn Độn. */
export const DAO_HOLDER = 'Thái Sơ Đạo Chủ';
/** Trần cảnh giới của mọi sinh linh khác (NPC, yêu thú, thánh thú): tối đa Hợp Đạo. */
export const npcCap = (w = WORLD.lv) => Math.min(RMAX(w), DAI_DAO - 1);
/** Sức mạnh nhân theo giới: Luyện Khí giới trên vẫn mạnh hơn cảnh giới cao nhất (viên mãn) của giới dưới. */
const WMULT: number[] = [1];
for (let w = 1; w <= LAST_WORLD; w++) WMULT[w] = WMULT[w - 1] * Math.ceil((REALMS[WORLD_CAP[w - 1]].pow * 1.9 * 1.6) / REALMS[1].pow);
export const worldMult = (w = WORLD.lv) => WMULT[Math.min(w, LAST_WORLD)];
export const worldLife = (w = WORLD.lv) => 1 + w;
/** Giới càng cao càng rộng lớn: quãng đường nhân lên. */
export const worldSize = (w = WORLD.lv) => [1, 1.5, 2.2, 3, 4, 5][Math.min(w, 5)];
export const STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Viên Mãn'];
/** Thiên Đố Chi Thể: tầng luyện khí ứng với từng cảnh giới (chỉ số = cảnh giới). */
export const TANG_T = [0, 1, 10, 20, 35, 55, 80, 110, 150, 200, 260, 330, 410, 500, 600, 710, 830, 960, 1100, 1250, 1410, 1580, 1760];
/** Tỉ lệ đột phá nền khi lên cảnh giới r (từ r-1). */
/** Phẩm đạo cơ (Trúc Cơ). 0..4 */
export const DAO_CO = [
  { n: 'Hạ phẩm đạo cơ', cult: 0.85, pow: 0.92, brk: -0.05 },
  { n: 'Trung phẩm đạo cơ', cult: 1, pow: 1, brk: 0 },
  { n: 'Thượng phẩm đạo cơ', cult: 1.12, pow: 1.08, brk: 0.03 },
  { n: 'Cực phẩm đạo cơ', cult: 1.25, pow: 1.16, brk: 0.06 },
  { n: 'Hoàn mỹ đạo cơ', cult: 1.4, pow: 1.25, brk: 0.1 },
];
/** Phẩm chất đột phá mỗi cảnh giới (Kết Đan trở lên; Trúc Cơ dùng đạo cơ riêng): Hạ, Trung, Thượng, Cực, Hoàn mỹ. */
export const PHAM_N = ['Hạ phẩm', 'Trung phẩm', 'Thượng phẩm', 'Cực phẩm', 'Hoàn mỹ'];
/** Thưởng cộng dồn theo phẩm của từng cảnh giới đã đột phá: khí huyết %, công phạt %, tỉ lệ đột phá kế tiếp. */
export const PHAM_BONUS = [
  { hp: 0, atk: 0, cult: 0, life: 0, brk: -0.02 },
  { hp: 4, atk: 1.3, cult: 5, life: 0.05, brk: 0 },
  { hp: 8, atk: 2.5, cult: 10, life: 0.095, brk: 0.015 },
  { hp: 12, atk: 3.8, cult: 15, life: 0.145, brk: 0.03 },
  { hp: 15, atk: 5, cult: 20, life: 0.19, brk: 0.05 },
];
/** Ngưỡng điểm gieo phẩm (Kết Đan trở lên): dưới 0.45 Hạ, tới 0.8 Trung, 1.05 Thượng, 1.3 Cực, trên là Hoàn mỹ. */
export const PHAM_T = [0.45, 0.8, 1.05, 1.3];
export const BREAK_BASE = [0, 0.75, 0.32, 0.24, 0.18, 0.14, 0.11, 0.08, 0.06, 0.05, 0.06, 0.06, 0.055, 0.05, 0.05, 0.045, 0.04, 0.04, 0.035, 0.03, 0.03, 0.025];
/** Đan dược hỗ trợ đột phá lên cảnh giới r. */
export const BREAK_PILL = ['', 'khaimach', 'trucco', 'ketdan', 'hoaanh', 'ngungthan', 'phahu', 'hopnguyen', 'daithua', '', '', '', '', '', '', '', '', '', '', '', '', ''];

export const realmName = (r: number, st: number) => (r === 0 ? 'Phàm Nhân' : `${REALMS[r].n} ${STAGES[st]}`);

// ---------- Thuộc tính ----------
export type StatKey = 'can' | 'ngo' | 'van' | 'mi' | 'tam';
export const STATS: Record<StatKey, { n: string; d: string }> = {
  can: { n: 'Căn cốt', d: 'Khí huyết, sức chịu đòn, tốc độ hồi phục.' },
  ngo: { n: 'Ngộ tính', d: 'Tốc độ tu luyện, lĩnh ngộ công pháp, luyện chế.' },
  van: { n: 'Khí vận', d: 'Kỳ ngộ, may mắn khi nhặt đồ và chạy trốn.' },
  mi: { n: 'Mị lực', d: 'Thiện cảm của người khác, giá mua bán.' },
  tam: { n: 'Đạo tâm', d: 'Tỉ lệ đột phá, chống tâm ma.' },
};
export const STAT_KEYS: StatKey[] = ['can', 'ngo', 'van', 'mi', 'tam'];

// ---------- Linh căn ----------
export interface RootKind {
  n: string;
  m: number; // hệ số tu luyện
  q: number; // phẩm chất (tông môn xét tuyển)
  w: number; // trọng số khi đầu thai
  d: string;
}
export const ROOTS: RootKind[] = [
  { n: 'Phế linh căn', m: 0, q: 0, w: 11, d: 'Kinh mạch bế tắc, không cảm được linh khí. Muốn bước lên tiên lộ chỉ còn cách tìm kỳ ngộ nghịch thiên.' },
  { n: 'Ngũ linh căn', m: 0.4, q: 1, w: 22, d: 'Đủ năm hành nhưng loãng như nước ao. Tu chậm, bù lại công pháp nào cũng hợp được đôi chút.' },
  { n: 'Tứ linh căn', m: 0.55, q: 2, w: 22, d: 'Bốn hành tranh nhau, linh khí vào người tản mất quá nửa.' },
  { n: 'Tam linh căn', m: 0.75, q: 3, w: 20, d: 'Tư chất thường thấy nhất trong giới tu chân.' },
  { n: 'Song linh căn', m: 1, q: 4, w: 13, d: 'Hai hành thuần, tông môn nào cũng muốn giữ lại.' },
  { n: 'Đơn linh căn', m: 1.6, q: 6, w: 5, d: 'Một hành duy nhất, linh khí vào người không hao một giọt. Thiên tài trăm năm khó gặp.' },
  { n: 'Dị linh căn', m: 1.45, q: 5, w: 7, d: 'Linh căn biến dị: Băng, Lôi, Phong, hiếm nhất là Ám và Quang. Thuật pháp cùng hệ uy lực vượt xa người thường.' },
  { n: 'Lục linh căn', m: 0.32, q: 1, w: 0, d: 'Sáu hành chen chúc trong kinh mạch, linh khí vào người như nước đổ lá khoai.' },
  { n: 'Thất linh căn', m: 0.28, q: 1, w: 0, d: 'Bảy hành hỗn loạn. Tu luyện cực khổ, nhưng công pháp hệ nào cũng dùng được.' },
  { n: 'Bát linh căn', m: 0.25, q: 1, w: 0, d: 'Tám hành giằng xé nhau. Người đời gọi là "tạp căn", chẳng tông môn nào muốn nhận.' },
  { n: 'Cửu linh căn', m: 0.22, q: 1, w: 0, d: 'Chỉ thiếu một hành là viên mãn — và cũng chính vì thiếu một hành mà mọi thứ sụp đổ.' },
  { n: 'Thập linh căn', m: 2, q: 7, w: 0.3, d: 'Mười hành tề tựu, tương sinh tương khắc thành một vòng tròn khép kín. Vạn năm khó gặp. Mười hệ cân bằng tuyệt đối nên đá trắc linh không phản ứng — người đời sẽ coi ngươi là phế linh căn, chỉ mình ngươi biết sự thật.' },
  { n: 'Bát quái linh căn', m: 1.9, q: 7, w: 0.2, d: 'Âm Dương song sinh trong một thân, giao nhau mà thành tám quẻ. Hiếm ngang Thập linh căn. Chỉ người này mới hợp nhất Âm Dương pháp tắc thành Bát quái.' },
  { n: 'Hỗn Độn linh căn', m: 3, q: 8, w: 0, d: 'Đủ mười hai hệ, gồm mười hành cùng Âm và Dương, hợp nhất thành Hỗn Độn. Linh căn mạnh nhất, các hệ cân bằng tuyệt đối nên đá trắc linh không phản ứng; người đời nhầm là phế linh căn.' },
  { n: 'Thập nhất linh căn', m: 0.2, q: 1, w: 0, d: 'Mười một hệ chưa đủ cân bằng; còn thiếu một hệ để hợp nhất thành Hỗn Độn.' },
];
export const THAP = 11;
/** Bát quái linh căn: Âm + Dương hợp nhất. */
export const BATQUAI = 12;
/** Hỗn Độn linh căn: đủ 12 hệ (mười hành + Âm + Dương). Mạnh nhất. */
export const HON_DON_ROOT = 13;
/** Linh căn mà đá trắc linh không phản ứng (người đời tưởng là phế linh căn): Thập và Hỗn Độn. */
export const hiddenRootKind = (k: number) => k === THAP || k === HON_DON_ROOT;
/** Xác định loại linh căn theo các hệ đã có. */
export function rootKindOf(els: El[]): number {
  els = [...new Set(els)];
  const n = els.length;
  if (EVERY_EL.every(e => els.includes(e))) return HON_DON_ROOT;
  if (n === 11) return 14;
  if (n === 0) return 0;
  if (n === 2 && els.includes('yin') && els.includes('yang')) return BATQUAI;
  if (n === 1) return VARIANT_EL.includes(els[0]) || YINYANG_EL.includes(els[0]) ? 6 : 5;
  if (n <= 5) return [0, 0, 4, 3, 2, 1][n];
  return [7, 8, 9, 10, 11][n - 6];
}

// ---------- Thể chất ----------
export interface Body {
  id: string;
  n: string;
  w: number;
  d: string;
  life?: number; // nhân thọ nguyên
  cult?: number; // nhân tốc độ tu luyện
  hp?: number; // nhân khí huyết
  pow?: number;
  luck?: number; // cộng khí vận
  heal?: number; // nhân hồi phục
  alch?: number; // cộng tỉ lệ luyện đan
  g?: 'm' | 'f';
}
export const BEAST_BODIES: Body[] = [
  { id: 'yeu_manhoang', n: 'Thượng Cổ Man Hoang Thể', w: 10, hp: 1.45, pow: 1.25, life: 1.2, d: 'Nhục thân man hoang thời viễn cổ, gân cốt cứng như huyền thiết. Khí huyết ×1.45, chiến lực ×1.25, thọ nguyên ×1.2.' },
  { id: 'yeu_thonglinh', n: 'Thông Thiên Yêu Linh Thể', w: 8, cult: 1.3, pow: 1.15, heal: 1.2, d: 'Linh khiếu thông suốt, thiên sinh yêu linh cảm ứng thiên địa. Tu luyện ×1.3, chiến lực ×1.15, hồi phục ×1.2.' },
  { id: 'yeu_hungsat', n: 'Hồng Hoang Hung Sát Thể', w: 6, pow: 1.35, hp: 1.2, luck: 1, d: 'Mang sát khí hung bạo khai thiên tích địa, đòn đánh cuồng bạo xé nát càn khôn. Chiến lực ×1.35, khí huyết ×1.2, khí vận +1.' },
  { id: 'yeu_huyennguyet', n: 'Huyền Nguyệt Tịnh Thể', w: 6, heal: 1.4, cult: 1.2, life: 1.3, d: 'Hấp thu thái âm nguyệt hoa tôi luyện thân xác, thanh lọc thương thế. Hồi phục ×1.4, tu luyện ×1.2, thọ nguyên ×1.3.' },
  { id: 'yeu_thienvan', n: 'Thiên Mệnh Dị Tượng Thể', w: 4, luck: 3, cult: 1.2, life: 1.25, d: 'Dị tượng che trời khi sinh ra, hưởng khí vận thiên địa bảo hộ. Khí vận +3, tu luyện ×1.2, thọ nguyên ×1.25.' },
  { id: 'yeu_hondon', n: 'Hỗn Độn Yêu Thai', w: 1, hp: 1.35, pow: 1.3, cult: 1.3, life: 1.35, luck: 2, d: 'Thai nghén từ khí Hỗn Độn sơ khai, tư chất kinh thế hãi tục. Huyết ×1.35, lực ×1.3, tu ×1.3, thọ ×1.35, vận +2.' },
];

export const BODIES: Body[] = [
  { id: 'pham', n: 'Phàm thể', w: 60, d: 'Thân thể bình thường, không có gì đặc biệt.' },
  { id: 'kimcuong', n: 'Kim Cương Cốt', w: 6, d: 'Xương cứng như sắt, khí huyết dồi dào.', hp: 1.4, pow: 1.1 },
  { id: 'thanhlinh', n: 'Thanh Linh Thể', w: 5, d: 'Có thể tu luyện khi đang ngủ.', cult: 1.3 },
  { id: 'thaiam', n: 'Thái Âm Huyền Mạch', w: 3, g: 'f', d: 'Âm mạch thuần khiết, song tu cực lợi, tâm tĩnh như trăng.', cult: 1.15, life: 1.1 },
  { id: 'cuuduong', n: 'Cửu Dương Chân Thể', w: 3, g: 'm', d: 'Dương khí sôi trào, đánh đâu thắng đó nhưng dễ hỏa vượng.', pow: 1.25, hp: 1.15 },
  { id: 'linhlung', n: 'Linh Lung Tâm', w: 4, d: 'Tâm khiếu thông suốt, nhìn một hiểu mười.', cult: 1.1 },
  { id: 'batlao', n: 'Trường Xuân Huyết', w: 3, d: 'Máu mang sinh cơ cỏ cây, vết thương mau lành, sống lâu hơn người.', life: 1.35, heal: 2 },
  { id: 'doanmenh', n: 'Đoản Mệnh Thể', w: 4, d: 'Thiên đố anh tài: tu cực nhanh nhưng thọ nguyên bị cắt.', cult: 1.45, life: 0.7 },
  { id: 'tubao', n: 'Tụ Bảo Thể', w: 4, d: 'Đi đường cũng nhặt được của rơi.', luck: 3 },
  { id: 'vandoc', n: 'Vạn Độc Thể', w: 3, d: 'Bách độc bất xâm, ngửi thuốc là biết dược tính.', alch: 0.12, heal: 1.3 },
  { id: 'thiendo', n: 'Thiên Đố Chi Thể', w: 1, d: 'Trời đất đố kỵ: vĩnh viễn không thể trúc cơ, nhưng luyện khí không có tầng cuối. Tầng càng cao, sức mạnh và thọ nguyên càng sánh ngang cảnh giới trên — tầng 10 ngang Trúc Cơ, tầng 20 ngang Kết Đan, tầng 35 ngang Nguyên Anh…' },
  { id: 'hondon', n: 'Hỗn Độn Đạo Thai', w: 1, d: 'Truyền thuyết nói là thai nhi của đất trời. Mọi mặt đều vượt người.', cult: 1.35, pow: 1.2, hp: 1.2, life: 1.2 },
  ...BEAST_BODIES,
];

// ---------- Thiên phú (chọn khi đầu thai) ----------
export interface Perk {
  id: string;
  n: string;
  d: string;
  bad?: boolean;
}
export const BEAST_PERKS: Perk[] = [
  // Tier 5: Thần Phẩm (10)
  { id: 'yeudan', n: 'Yêu Đan Bản Mệnh', d: 'Đặc tính Yêu tộc: Không có linh căn. Tu luyện bằng Yêu đan và nhục thân. Khí huyết +40%, thủ +20%, đòn đánh tăng 25% uy lực.' },
  { id: 'yeu_taico', n: 'Thái Cổ Chân Huyết', d: 'Huyết mạch thần thú nguyên thủy chảy trong người, căn cốt +3, khí vận +2, thọ nguyên +25%, uy áp tuyệt đỉnh.' },
  { id: 'yeu_tothu', n: 'Tổ Thú Chiến Hồn', d: 'Ý chí tổ thú thượng cổ hộ thể: Khi sinh mệnh dưới 25% tạo lớp lân giáp chắn 35% sát thương.' },
  { id: 'yeu_honnguyen', n: 'Hỗn Độn Yêu Thể', d: 'Thân thể dung hợp yêu khí thiên địa, công phá vạn pháp, sát thương mọi hệ tăng 20%.' },
  { id: 'yeu_thontian', n: 'Thôn Thiên Khát Máu', d: 'Đại thần thông cắn nuốt vạn vật, đòn đánh hút 25% sinh lực đối thủ, nuốt yêu đan tăng tu vi gấp đôi.' },
  { id: 'yeu_batdiet', n: 'Chân Ma Yêu Khu', d: 'Nhục thân bất diệt của Ma Yêu viễn cổ, máu tối đa +50%, hồi phục 8% máu mỗi hiệp chiến đấu.' },
  { id: 'yeu_long_to', n: 'Cửu Trảo Kim Long Uy', d: 'Mang huyết mạch Long Tổ chí tôn, công kích +30%, long tức thiêu đốt vạn vật, áp chế quần thú.' },
  { id: 'yeu_phuong_hoang', n: 'Niết Bàn Phượng Huyết', d: 'Tử địa trùng sinh: Khi chết hồi sinh ngay lập tức với 40% máu kèm bão lửa thiêu đốt đối thủ, 1 lần/trận.' },
  { id: 'yeu_thao_thiet', n: 'Thao Thiết Thôn Thực', d: 'Bao tử vô đáy, nuốt chửng linh dược khoáng thạch trực tiếp hóa thành yêu lực tu vi khổng lồ.' },
  { id: 'yeu_bach_trach', n: 'Bạch Trạch Thần Tri', d: 'Hiểu rõ ngôn ngữ vạn linh, nhìn thấu nhược điểm mọi loài, ngộ tính +4, né tránh toàn bộ bẫy hiểm địa.' },

  // Tier 4: Thiên Phẩm (24)
  { id: 'yeu_thoaicot', n: 'Thối Cốt Dịch Cân', d: 'Xương cốt tôi luyện như thần binh. Phòng ngự +20%, giảm 12% sát thương nhận vào.' },
  { id: 'yeu_huyetkhi', n: 'Huyết Khí Bàng Bạc', d: 'Huyết hải cuộn trào sinh cơ bàng bạc. Khí máu tối đa +30%, căn cốt +2.' },
  { id: 'yeu_hungtinh', n: 'Hung Tính Bạo Phát', d: 'Dã tính bộc phát khi thương thế trầm trọng. Càng mất máu đánh càng mạnh, tối đa +40% sát thương.' },
  { id: 'yeu_thienkhang', n: 'Vạn Độc Chi Khu', d: 'Cơ thể tôi luyện trong đầm lầy hiểm độc, miễn dịch mọi chất độc và ăn độc vật tăng tu vi.' },
  { id: 'yeu_quytuc', n: 'Quy Tức Thao Quang', d: 'Bí pháp ngủ đông thu liễm sinh cơ, thọ nguyên +40%, tốc độ hồi phục vết thương nhân đôi.' },
  { id: 'yeu_doatthien', n: 'Đoạt Thiên Hóa Đan', d: 'Tinh luyện nội đan đạt đến đỉnh phong, ngộ tính +3, đột phá cảnh giới giảm 30% thiên kiếp.' },
  { id: 'yeu_longuy', n: 'Chấn Thế Thú Uy', d: 'Uy áp vương giả chấn nhiếp quần yêu, giảm 20% phòng ngự và độ chính xác của địch nhân.' },
  { id: 'yeu_nguphong', n: 'Ngự Phong Lăng Vân', d: 'Cánh móng xé gió lướt đi thần tốc, tỉ lệ né tránh đòn công kích nguy hiểm tăng 25%.' },
  { id: 'yeu_huyet_te', n: 'Huyết Tế Cuồng Triều', d: 'Đốt cháy 10% khí huyết bản thân để bộc phát đòn tấn công tăng 50% uy lực chí tử.' },
  { id: 'yeu_ky_lan', n: 'Kỳ Lân Tường Thụy', d: 'Khí vận +3, bước chân mang theo điềm lành, hấp thu thiên địa linh khí nhanh hơn 30%.' },
  { id: 'yeu_huyen_vu', n: 'Huyền Vũ Cương Giáp', d: 'Lớp mai hoặc vảy cứng không thể phá vỡ, giảm 25% sát thương vật lý và phản lại 15% sát thương.' },
  { id: 'yeu_chu_tuoc', n: 'Chu Tước Liệt Diễm', d: 'Hỏa diễm thiêu đốt linh hồn đối thủ, đòn đánh hệ Hỏa tăng 25%, gây sát thương thiêu đốt liên tục.' },
  { id: 'yeu_bach_ho', n: 'Bạch Hổ Sát Khí', d: 'Sát phạt vô song, đòn đánh tăng 20% tỉ lệ bạo kích, bỏ qua 15% phòng ngự của kẻ địch.' },
  { id: 'yeu_kim_bang', n: 'Đại Bằng Kim Sí', d: 'Đôi cánh xé rách không gian, tốc độ di chuyển +40%, ưu tiên xuất chiêu trước trong giao chiến.' },
  { id: 'yeu_hoa_hinh', n: 'Thiên Yêu Hóa Hình', d: 'Dễ dàng hóa hình thành nhân dạng hoàn mỹ mà không bị lộ yêu khí trước tu sĩ nhân tộc.' },
  { id: 'yeu_ngung_dan', n: 'Ngũ Hành Yêu Đan', d: 'Nội đan dung nạp cả năm nguyên tố ngũ hành, kháng mọi loại sát thương nguyên tố 15%.' },
  { id: 'yeu_ma_dong', n: 'Dị Giới Ma Nhãn', d: 'Con mắt thứ ba nhìn thấu hư vô, phá tan mọi ảo thuật và phân thân của đối thủ.' },
  { id: 'yeu_loi_dinh', n: 'Lôi Trăn Thú Thể', d: 'Hấp thu sấm sét thiên kiếp để tôi luyện thể xác, giảm 30% sát thương lôi kiếp.' },
  { id: 'yeu_huyen_am', n: 'Cửu U Minh Khí', d: 'Yêu khí mang theo hàn độc âm phủ, làm đông cứng kinh mạch đối thủ khi trúng đòn.' },
  { id: 'yeu_phan_cot', n: 'Dã Tính Bất Diệt', d: 'Khi chịu sát thương chí tử có 50% cơ hội giữ lại 1 điểm máu và tăng 100% né tránh trong 1 hiệp.' },
  { id: 'yeu_trieu_hoan', n: 'Vạn Thú Hiệu Triệu', d: 'Tiếng gầm triệu tập bầy thú rừng sâu cùng tham chiến hỗ trợ.' },
  { id: 'yeu_khong_gian', n: 'Hư Không Thú Huyết', d: 'Có khả năng độn thổ xuyên không gian, dễ dàng thoát khỏi trận pháp giam cầm.' },
  { id: 'yeu_sinh_menh', n: 'Cổ Mộc Sinh Cơ', d: 'Khí tức của mộc yêu ngàn năm, tự hồi phục 5% máu tối đa mỗi hiệp.' },
  { id: 'yeu_pha_giap', n: 'Cự Giác Xung Kích', d: 'Sừng nhọn hoặc ngà voi khổng lồ húc vỡ mọi khiên chắn và giáp trụ.' },

  // Tier 3: Địa Phẩm (32)
  { id: 'yeu_nguyethoa', n: 'Nguyệt Hoa Thối Thể', d: 'Hấp thu tinh hoa ánh trăng nuôi dưỡng nội đan. Bế quan ngưng đan luyện thể ban đêm tăng +25% hiệu quả.' },
  { id: 'yeu_uyap', n: 'Bách Thú Khiếp Sợ', d: 'Uy áp dị thú khiến kẻ địch khiếp đảm, làm suy giảm 15% uy lực công kích của đối phương.' },
  { id: 'yeu_langiap', n: 'Lân Giáp Bất Hoại', d: 'Lớp vảy giáp lông vũ cứng như huyền thiết, giảm 25% sát thương bạo kích từ đối thủ.' },
  { id: 'yeu_phehuyet', n: 'Phệ Tinh Thực Huyết', d: 'Thôn phệ sinh cơ đối thủ, mỗi đòn đánh hút 15% sát thương hồi phục khí huyết bản thân.' },
  { id: 'yeu_hoangda', n: 'Dã Tính Trực Giác', d: 'Bản năng dã thú nhạy bén phi thường, khí vận +2, ngộ tính +1, dễ né phục kích và tìm cơ duyên rừng sâu.' },
  { id: 'yeu_mehoac', n: 'Thiên Sinh Mị Cốt', d: 'Yêu mị câu hồn đoạt phách. Mị lực +3, đạo tâm +1, làm đối phương phân tâm trượt đòn.' },
  { id: 'yeu_trangam', n: 'Chấn Sơn Thú Hống', d: 'Tiếng gầm rung chuyển núi rừng, có xác suất làm đối thủ chấn động tê liệt mất lượt xuất chiêu.' },
  { id: 'yeu_linhkhuu', n: 'Linh Khứu Sơn Hải', d: 'Khứu giác dã thú siêu phàm, thám hiểm hiểm địa tầm bảo linh dược tăng 35% cơ hội.' },
  { id: 'yeu_cuongluc', n: 'Cự Thú Thần Lực', d: 'Cơ bắp cường tráng man hoang, căn cốt +2, đòn đánh cận chiến tăng thêm 18% sát thương.' },
  { id: 'yeu_doc_chua', n: 'Mãng Xà Kịch Độc', d: 'Đòn cắn tẩm nọc độc kịch liệt, khiến kẻ địch mất máu liên tục mỗi hiệp.' },
  { id: 'yeu_dia_don', n: 'Địa Độn Chi Thuật', d: 'Lặn sâu vào lòng đất để di chuyển và trốn thoát nguy nan tăng 30%.' },
  { id: 'yeu_thuy_te', n: 'Thủy Trung Thần Thú', d: 'Tự do bơi lội dưới biển sâu, công kích và né tránh dưới nước tăng 35%.' },
  { id: 'yeu_hoa_diem', n: 'Hỏa Lân Liệt Thể', d: 'Vảy bốc cháy ngọn lửa nóng bỏng, kẻ đánh cận chiến bị phản lại sát thương lửa.' },
  { id: 'yeu_bang_phach', n: 'Băng Phách Hàn Thú', d: 'Hơi thở đóng băng vạn vật, làm giảm 20% tốc độ xuất chiêu của kẻ địch.' },
  { id: 'yeu_phong_loi', n: 'Phong Lôi Dị Dực', d: 'Đôi cánh mang sấm sét và gió lốc, tăng 20% tốc độ tấn công.' },
  { id: 'yeu_am_sat', n: 'Dạ Hành Thợ Săn', d: 'Săn mồi trong bóng đêm, đòn đánh bất ngờ tăng 30% sát thương bạo kích.' },
  { id: 'yeu_da_day', n: 'Kim Cương Vị Trường', d: 'Dạ dày cứng như sắt đá, ăn được mọi loại khoáng thạch độc mộc để chuyển hóa yêu lực.' },
  { id: 'yeu_sung_nhon', n: 'Liệt Thiên Nhọn Hoắt', d: 'Móng vuốt sắc bén xuyên thấu qua lớp phòng ngự của đối thủ 15%.' },
  { id: 'yeu_tai_sinh', n: 'Trùng Sinh Đứt Đuôi', d: 'Khi bị thương nặng có thể tự rụng đuôi hoặc lột xác để hồi phục tức thì 20% máu.' },
  { id: 'yeu_tieng_hu', n: 'Điệu Hổ Ly Sơn', d: 'Tiếng hú giả dạng đánh lừa bầy thú và đối phương để dễ dàng tháo chạy.' },
  { id: 'yeu_da_day_2', n: 'Cổ Thú Cốt Cương', d: 'Xương cốt dẻo dai như cao su, giảm 20% chấn động từ đòn đánh uy lực lớn.' },
  { id: 'yeu_phan_kich', n: 'Thú Tính Phản Kích', d: 'Mỗi khi né tránh thành công đòn đánh sẽ lập tức phản công một đòn.' },
  { id: 'yeu_cuong_thao', n: 'Hấp Thu Độc Chướng', d: 'Sống trong rừng thiêng nước độc, biến khí độc đầm lầy thành dinh dưỡng hồi phục.' },
  { id: 'yeu_vuot_ho', n: 'Cọp Vồ Mồi', d: 'Đòn vồ đầu tiên trong trận đấu tăng 35% uy lực và có cơ hội đè bẹp đối thủ.' },
  { id: 'yeu_duoi_doc', n: 'Bọ Cạp Thiết Vĩ', d: 'Đuôi bọ cạp đâm xuyên qua giáp trụ tiêm nọc làm tê liệt kẻ thù.' },
  { id: 'yeu_mat_u', n: 'Linh Giác Dạ Minh', d: 'Mắt sáng trong đêm, không bị ảnh hưởng bởi sương mù và trời tối.' },
  { id: 'yeu_long_nhim', n: 'Nhím Xù Lông Gai', d: 'Toàn thân bắn gai nhọn khi bị bao vây, gây sát thương diện rộng.' },
  { id: 'yeu_khong_lo', n: 'Khổng Lồ Chi Thân', d: 'Thể hình to lớn gấp ba đồng loại, máu +25%, chấn áp kẻ địch nhỏ hơn.' },
  { id: 'yeu_chuot_vang', n: 'Tầm Bảo Thử Linh', d: 'Bản năng chuột tìm vàng, dễ dàng ngửi thấy mùi khoáng mạch và bảo vật chôn giấu.' },
  { id: 'yeu_vo_oc', n: 'Huyền Quy Hộ Giáp', d: 'Khi gặp nguy hiểm rụt người vào mai, tăng 50% phòng thủ trong 1 hiệp.' },
  { id: 'yeu_nhen_doc', n: 'Thiên La Mạng Nhện', d: 'Nhả tơ giăng bẫy trói chân đối thủ, giảm 30% tốc độ di chuyển của địch.' },
  { id: 'yeu_song_am', n: 'Dơi Đêm Sóng Âm', d: 'Phát sóng âm gây choáng váng màng nhĩ và làm mù tạm thời kẻ thù.' },

  // Tier 2: Huyền Phẩm (26)
  { id: 'yeu_thoatxac', n: 'Huyễn Ảnh Thoát Xác', d: 'Lột xác trút bỏ hiểm nguy, tỉ lệ chạy trốn nguy nan +30%, tốc độ di chuyển +20%.' },
  { id: 'yeu_thongu', n: 'Thông U Dị Đồng', d: 'Mắt dạ quang nhìn thấu bóng đêm và sương mù ảo cảnh, đạo tâm +2, miễn nhiễm mê hoặc.' },
  { id: 'yeu_vuhoa', n: 'Vũ Hóa Khinh Thân', d: 'Thân pháp nhẹ nhàng linh hoạt, tăng 18% tỉ lệ né tránh đòn công kích hiểm hóc.' },
  { id: 'yeu_daunhuc', n: 'Bản Năng Liếm Thương', d: 'Bản năng tự chữa lành vết thương của dã thú, hồi phục khí huyết sau trận chiến tăng 50%.' },
  { id: 'yeu_thannhiet', n: 'Ôn Noãn Thú Bì', d: 'Lớp lông da dày dặn chịu nóng chịu rét cực tốt, giảm 20% sát thương từ hệ Hỏa và Băng.' },
  { id: 'yeu_mongvuot', n: 'Vuốt Sắc Răng Nhọn', d: 'Vuốt nanh sắc bén như đao kiếm, đòn đánh thường có 20% xác suất gây vết thương rách máu.' },
  { id: 'yeu_danong', n: 'Bầy Đàn Khế Ước', d: 'Được các sinh linh nhỏ trong núi rừng che chở, giảm nguy cơ bị bầy thú tấn công vô cớ.' },
  { id: 'yeu_linhcuc', n: 'Cốt Cách Man Hoang', d: 'Xương cốt dẻo dai tôi luyện từ thuở nhỏ, thọ nguyên tăng thêm 15%.' },
  { id: 'yeu_danh_hoi', n: 'Thính Tai Thính Mũi', d: 'Sớm phát hiện dấu chân thợ săn và yêu thú lạ trong bán kính 10 dặm.' },
  { id: 'yeu_ngu_ngay', n: 'Đông Miên Dưỡng Lực', d: 'Giấc ngủ sâu trong hang đá giúp hồi phục thể lực nhanh hơn người thường.' },
  { id: 'yeu_leo_cay', n: 'Linh Viên Phan Viên', d: 'Trèo cây leo vách đá thoăn thoắt, di chuyển trên địa hình đồi núi không tốn sức.' },
  { id: 'yeu_nguy_trang', n: 'Biến Sắc Ngụy Trang', d: 'Đổi màu lông da hòa vào cảnh vật xung quanh, né tránh ánh mắt kẻ thù.' },
  { id: 'yeu_boi_loi', n: 'Kình Ngư Du Thủy', d: 'Bơi lội dưới sông hồ nhanh gấp ba lần bình thường.' },
  { id: 'yeu_dao_boi', n: 'Thỏ Đào Hang Sâu', d: 'Đào hang trú ẩn nhanh chóng trong hiểm cảnh để trốn tránh nguy cơ.' },
  { id: 'yeu_an_tap', n: 'Tạp Thực Chi Thể', d: 'Ăn cỏ cây hay thịt cá đều hấp thu trọn vẹn dinh dưỡng, không lo đói khát.' },
  { id: 'yeu_long_muot', n: 'Bộ Lông Mượt Mà', d: 'Mị lực thú cưng +2, dễ thu phục thiện cảm khi giao tiếp.' },
  { id: 'yeu_ham_rang', n: 'Răng Nanh Cứng Cáp', d: 'Gặm nát xương cốt con mồi dễ dàng, tăng 10% sát thương cắn xé.' },
  { id: 'yeu_chan_nhanh', n: 'Chân Hươu Thoăn Thoắt', d: 'Chạy nước rút trên bình nguyên cực nhanh, tăng 20% tốc độ chạy trốn.' },
  { id: 'yeu_tieng_keu', n: 'Tiếng Kêu Réo Rắt', d: 'Tiếng hót tiếng gáy trong trẻo thu hút chim muông cùng loài.' },
  { id: 'yeu_chiu_khat', n: 'Lạc Đà Trữ Nước', d: 'Nhịn khát trong sa mạc khô cằn hàng tháng trời không hề suy giảm sinh lực.' },
  { id: 'yeu_can_than', n: 'Cáo Già Xảo Quyệt', d: 'Bản tính cẩn trọng đa nghi, không bao giờ rơi vào bẫy sập hai lần.' },
  { id: 'yeu_mat_chim', n: 'Mắt Ưng Nhìn Xa', d: 'Tầm nhìn từ trên không trung cực kỳ rộng lớn, phát hiện mục tiêu từ xa.' },
  { id: 'yeu_ngua_chien', n: 'Bền Bỉ Ngựa Hoang', d: 'Sức bền dẻo dai, chạy đường trường liên tục không biết mệt mỏi.' },
  { id: 'yeu_ran_truon', n: 'Trườn Bò Không Tiếng', d: 'Di chuyển áp sát con mồi không gây ra một tiếng động nhỏ.' },
  { id: 'yeu_ong_mat', n: 'Bầy Ong Chăm Chỉ', d: 'Cần mẫn tích lũy mật ngọt và linh dịch, tăng 15% tài nguyên thu hoạch.' },
  { id: 'yeu_kien_than', n: 'Kiến Lực Phi Phàm', d: 'Nâng được vật thể nặng gấp 10 lần trọng lượng cơ thể.' },

  // Tier 0: Hung Phẩm (16)
  { id: 'yeu_cuongbao', n: 'Huyết Mạch Cuồng Bạo', d: 'Công kích +20%, nhưng tính tình hung hãn dễ sinh tâm ma, đạo tâm −2.', bad: true },
  { id: 'yeu_thienkich', n: 'Thiên Địch Truy Kích', d: 'Có đại yêu thiên địch hoặc thợ săn yêu thú luôn rình rập. Đánh bại nhận thưởng lớn.', bad: true },
  { id: 'yeu_codo', n: 'Lạc Bầy Cô Độc', d: 'Sinh ra bị đồng tộc xua đuổi, không có gia tộc hỗ trợ nhưng ý chí sinh tồn giúp tu vi +20%.', bad: true },
  { id: 'yeu_tancan', n: 'Huyết Tàn Tật Thể', d: 'Huyết mạch sơ khai bị tổn hại từ trong trứng/thai: căn cốt −2, bù lại giác quan nghịch thiên giúp khí vận +3.', bad: true },
  { id: 'yeu_diemgo', n: 'Yêu Khí Xung Thiên', d: 'Yêu khí quá nặng dễ thu hút thiên lôi dòm ngó, nhưng uy lực yêu thuật bộc phát tăng 25%.', bad: true },
  { id: 'yeu_phanthuc', n: 'Huyết Mạch Phản Phệ', d: 'Huyết mạch quá mãnh liệt đôi khi phản phệ tự tổn thương, nhưng sát thương bạo kích tăng 30%.', bad: true },
  { id: 'yeu_gay_canh', n: 'Gãy Cánh Tàn Khuyết', d: 'Không thể bay lượn trên cao, bù lại lực chân chạy bộ tăng 30%.', bad: true },
  { id: 'yeu_mat_duoi', n: 'Đứt Đuôi Mất Thăng Bằng', d: 'Né tránh giảm 15%, nhưng cơ thể dồn hết sức mạnh vào hai vuốt trước tăng 20% sát thương.', bad: true },
  { id: 'yeu_thieu_mat', n: 'Độc Nhãn Hắc Thú', d: 'Mất một bên mắt, góc nhìn bị thu hẹp, bù lại khứu giác và thính giác tăng vọt.', bad: true },
  { id: 'yeu_khat_mau', n: 'Khát Máu Điên Cuồng', d: 'Không thể kiềm chế cơn khát máu khi ngửi thấy mùi tanh, nếu không giao chiến sẽ khó chịu giảm 10% tu vi.', bad: true },
  { id: 'yeu_ngu_muoi', n: 'Yêu Trí Chưa Khai', d: 'Chậm chạp trong việc hiểu biết nhân gian, ngộ tính −2, nhưng căn cốt nhục thân +3.', bad: true },
  { id: 'yeu_nguy_hiem', n: 'Dị Chủng Bị Ruồng Bỏ', d: 'Hình dạng biến dị quái đản, bị cả nhân loại lẫn yêu thú xa lánh, nhưng có độc tính tự nhiên bảo vệ.', bad: true },
  { id: 'yeu_cham_chap', n: 'Thân Hình Nặng Nề', d: 'Tốc độ di chuyển giảm 25%, nhưng da dày thịt béo tăng 30% máu tối đa.', bad: true },
  { id: 'yeu_so_lua', n: 'Thú Tính Sợ Lửa', d: 'Bản năng sợ hãi ngọn lửa dữ dội, chịu thêm 25% sát thương từ hệ Hỏa, bù lại chịu rét cực giỏi.', bad: true },
  { id: 'yeu_yeu_ot', n: 'Trứng Vỡ Non Ngày', d: 'Sinh thiếu ngày tháng nên thể chất ban đầu yếu đuối, máu −15%, nhưng linh tính mẫn tiệp ngộ tính +2.', bad: true },
  { id: 'yeu_doi_khat', n: 'Cơn Đói Vô Hồi', d: 'Lượng tiêu hao thức ăn linh đan gấp ba lần bình thường, nếu đói bụng sẽ giảm chiến lực.', bad: true },
];

export const PERKS: Perk[] = [
  // Tier 5: Thần Phẩm (10)
  { id: 'mahuyet', n: 'Ma Huyết Phệ Hồn', d: 'Đặc tính Ma tộc: Đòn đánh hút 20% sát thương hồi khí huyết. Mất máu tăng thêm sát thương.' },
  { id: 'vuthe', n: 'Tổ Vu Chiến Thể', d: 'Đặc tính Vu tộc: Thể phách Bàn Cổ giúp máu tối đa +35%, thủ +25%, giảm 15% mọi sát thương nhận vào.' },
  { id: 'batkhuat', n: 'Bất Khuất Chiến Hồn', d: 'Đặc tính Hình Thiên: Nhận đòn chí mạng miễn tử 1 lần mỗi trận, hồi 30% khí huyết tiếp tục tử chiến.' },
  { id: 'hoangdao', n: 'Hiên Viên Kiếm Khí', d: 'Đặc tính Hiên Viên: Khí vận +3, đạo tâm +2, công kích +15%, kiếm pháp +20% uy lực, giảm 50% tâm ma.' },
  { id: 'binhchu', n: 'Binh Chủ Di Phong', d: 'Đặc tính Cửu Lê: Mình đồng da sắt, công thủ +20%, giảm 15% sát thương nhận vào, tự biết thuật đúc binh khí.' },
  { id: 'chiton', n: 'Chí Tôn Tiên Cốt', d: 'Trời sinh tiên cốt ngàn năm khó gặp: Mọi thuộc tính cơ bản +1, ngộ tính +3, căn cốt +3, tu vi tăng nhanh 25%.' },
  { id: 'hondon_the', n: 'Hỗn Độn Đạo Thể', d: 'Thân thể bao dung vạn đạo ngũ hành, tốc độ luyện hóa chân nguyên +30%, miễn dịch 15% mọi loại sát thương phép.' },
  { id: 'luanhoi_tam', n: 'Cửu Chuyển Luân Hồi', d: 'Ký ức luân hồi thức tỉnh: Khi sinh mệnh về 0 lập tức hồi sinh với 50% khí huyết và tăng 30% công kích trong 3 hiệp, 1 lần/trận.' },
  { id: 'thanh_the', n: 'Hoang Cổ Thánh Thể', d: 'Thánh thể cái thế, khí huyết như rồng, phòng ngự +30%, phá vỡ mọi cấm chế và áp chế cảnh giới.' },
  { id: 'tien_can', n: 'Cửu Khiếu Linh Lung', d: 'Chín khiếu mở toang, ngộ tính tuyệt đỉnh +4, lĩnh ngộ công pháp siêu giai không gặp bình cảnh.' },
  { id: 'thien_menh', n: 'Khí Vận Chi Tử', d: 'Thiên đạo sủng nhi, khí vận +4, mọi sự kiện hiểm địa đều chuyển nguy thành an, tỉ lệ rơi bảo vật tăng 50%.' },

  // Tier 4: Thiên Phẩm (24)
  { id: 'kiemtam', n: 'Kiếm tâm thông minh', d: 'Kiếm pháp uy lực +20%, dễ dàng lĩnh ngộ kiếm ý tuyệt kỹ.' },
  { id: 'menhcung', n: 'Mệnh cứng', d: 'Trọng thương sắp chết có 50% cơ hội giữ được một hơi.' },
  { id: 'samhoi', n: 'Tiên phong đạo cốt', d: 'Thọ nguyên +25%, căn cốt +2, khí chất xuất trần thoát tục.' },
  { id: 'cuongchien', n: 'Chiến cuồng', d: 'Càng mất máu càng đánh mạnh, thương thế hiểm nghèo bùng nổ chiến lực.' },
  { id: 'phuctinh', n: 'Thiên mệnh phúc tinh', d: 'Khí vận +3, gặp dữ hóa lành, nhặt được bảo vật và cơ duyên lớn.' },
  { id: 'chanhan', n: 'Ngộ tính tuyệt luân', d: 'Ngộ tính +3, lĩnh ngộ công pháp bí kíp nhanh hơn 30%.' },
  { id: 'trandao', n: 'Trận đạo tông sư', d: 'Bố trận phá trận tăng 25%, giảm 20% sát thương từ cấm chế đại trận.' },
  { id: 'dandao', n: 'Dược vương chuyển thế', d: 'Luyện đan xác suất ra cực phẩm +20%, đan dược hồi phục tăng 25% hiệu quả.' },
  { id: 'loi_phap', n: 'Lôi Đình Hóa Thân', d: 'Thao túng thiên kiếp tử lôi, công kích hệ Lôi tăng 25%, giảm 20% sát thương sấm sét.' },
  { id: 'kiem_y', n: 'Vạn Kiếm Quy Tông', d: 'Kiếm khí tung hoành, tăng 15% bạo kích kiếm pháp, mỗi đòn đánh kèm theo kiếm khí xuyên giáp.' },
  { id: 'kim_than', n: 'Bất Hoại Kim Thân', d: 'Phật môn kim thân tôi luyện, giảm 20% sát thương bạo kích và sát thương vật lý.' },
  { id: 'thuan_duong', n: 'Thuần Dương Chân Thể', d: 'Hỏa diễm thuần dương thiêu đốt tà ma, công kích hệ Hỏa +25%, miễn nhiễm đóng băng.' },
  { id: 'thai_am', n: 'Thái Âm Băng Cơ', d: 'Băng cơ ngọc cốt, hàn khí thấu xương, công kích hệ Thủy/Băng +25%, làm chậm đối thủ.' },
  { id: 'thien_ngan', n: 'Thấu Thị Thiên Nhãn', d: 'Mắt thần nhìn thấu sơ hở đối phương, độ chính xác +20%, né tránh +15%.' },
  { id: 'phu_than', n: 'Thiên Phù Tông Sư', d: 'Chế phù và thi triển phù chú cực hạn, tăng 25% uy lực và tăng 1 lần dùng phù.' },
  { id: 'khi_vuong', n: 'Hạo Nhiên Chính Khí', d: 'Nho đạo chính khí che chở, đạo tâm +3, miễn nhiễm mọi loại huyễn thuật tà đạo.' },
  { id: 'am_duong', n: 'Âm Dương Tương Tế', d: 'Cân bằng sinh tử âm dương, hồi phục khí huyết và chân nguyên nhanh hơn 35%.' },
  { id: 'than_thong', n: 'Đốn Ngộ Thần Thông', d: 'Có cơ hội lĩnh ngộ thần thông bí truyền khi đột phá cảnh giới lớn.' },
  { id: 'than_phap', n: 'Đạp Tuyết Vô Ngấn', d: 'Thân pháp huyền ảo vô ảnh, né tránh +20%, tốc độ di chuyển +30%.' },
  { id: 'thuong_khung', n: 'Thương Khung Chiến Ý', d: 'Càng đánh càng hăng, mỗi hiệp chiến đấu tự tăng 3% công kích, cộng dồn tối đa 30%.' },
  { id: 'vo_ngiem', n: 'Vô Cực Đạo Tâm', d: 'Đạo tâm kiên định +3, giảm 50% nguy cơ tẩu hỏa nhập ma khi bế quan.' },
  { id: 'van_linh', n: 'Vạn Bảo Linh Thể', d: 'Dễ dàng cộng hưởng với linh khí pháp bảo, uy lực pháp bảo tăng 20%.' },
  { id: 'long_khi', n: 'Chân Long Hoàng Khí', d: 'Khí phách đế vương, khí vận +2, công kích +15%, chấn áp kẻ địch yếu hơn.' },
  { id: 'quy_nguyen', n: 'Bách Xuyên Quy Hải', d: 'Hấp thu đòn đánh nguyên tố của địch nhân, chuyển hóa 10% sát thương thành chân nguyên.' },

  // Tier 3: Địa Phẩm (32)
  { id: 'dangu', n: 'Đan ngữ', d: 'Luyện đan thành công +10%, đan phẩm chất cao hơn.' },
  { id: 'phusu', n: 'Phù lục tinh thông', d: 'Chế phù thành công +15%, phù chú xuất thủ tăng thêm 15% uy lực.' },
  { id: 'thuongnhan', n: 'Đầu óc buôn bán', d: 'Mua rẻ hơn 15%, bán đắt hơn 15% tại phường thị thương hội.' },
  { id: 'tinhtam', n: 'Tĩnh tâm', d: 'Đạo tâm +2, tâm ma khó bề xâm nhập.' },
  { id: 'dakhoe', n: 'Mình đồng da sắt', d: 'Căn cốt +2, giảm 12% sát thương ngoại công vật lý.' },
  { id: 'duocdien', n: 'Mắt dược sư', d: 'Hái thuốc được nhiều hơn, nhận diện được linh thảo hiếm.' },
  { id: 'khicong', n: 'Khí hải vô nhai', d: 'Khí hải rộng lớn mênh mông, chân nguyên hùng hậu +20%, hồi khí nhanh hơn.' },
  { id: 'khuyenquyet', n: 'Bách gia bác học', d: 'Hiểu biết điển tích cổ xưa, tăng cơ hội khám phá bí cảnh cổ mộ.' },
  { id: 'luyenthi', n: 'Thiết cốt luyện khí', d: 'Luyện khí rèn đúc pháp bảo thành công +15%, pháp bảo gia tăng độ bền.' },
  { id: 'hoa_linh', n: 'Hỏa Diễm Tinh Thông', d: 'Uy lực pháp thuật hệ Hỏa tăng 15%.' },
  { id: 'thuy_tinh', n: 'Thủy Lưu Tinh Thông', d: 'Uy lực pháp thuật hệ Thủy tăng 15%.' },
  { id: 'phong_tinh', n: 'Phong Vũ Tinh Thông', d: 'Uy lực pháp thuật hệ Phong tăng 15%.' },
  { id: 'loi_tinh', n: 'Lôi Quang Tinh Thông', d: 'Uy lực pháp thuật hệ Lôi tăng 15%.' },
  { id: 'tho_tinh', n: 'Hoàng Thổ Tinh Thông', d: 'Uy lực pháp thuật hệ Thổ và phòng ngự tăng 15%.' },
  { id: 'bang_tinh', n: 'Băng Sương Tinh Thông', d: 'Uy lực pháp thuật hệ Băng tăng 15%.' },
  { id: 'quang_tinh', n: 'Quang Minh Tinh Thông', d: 'Uy lực pháp thuật hệ Quang tăng 15%.' },
  { id: 'am_tinh', n: 'Ám Ảnh Tinh Thông', d: 'Uy lực pháp thuật hệ Ám tăng 15%.' },
  { id: 'thien_tai', n: 'Thương Vụ Kỳ Tài', d: 'Đấu giá và buôn bán luôn chiếm ưu thế, thu lợi tăng 20%.' },
  { id: 'dieu_thu', n: 'Diệu Thủ Đan Tâm', d: 'Trị liệu và dùng dược tề tăng 20% lượng máu hồi phục.' },
  { id: 'cuong_luc', n: 'Cự Lực Bạt Sơn', d: 'Sức mạnh cơ bắp phi thường, đòn đánh tay và binh khí nặng +15% uy lực.' },
  { id: 'linh_nhan', n: 'Thông Linh Pháp Nhãn', d: 'Nhìn thấu cấm chế ẩn tàng trong động phủ tiền nhân.' },
  { id: 'tru_luc', n: 'Trúc Cơ Vững Vàng', d: 'Căn cốt vững như bàn thạch, đột phá Trúc Cơ thành công 100%.' },
  { id: 'chinh_phap', n: 'Phá Trận Thần Thương', d: 'Đòn đánh có 15% cơ hội xuyên thủng hộ thể chân khí.' },
  { id: 'ngoc_cot', n: 'Ôn Ngọc Thể Phách', d: 'Kinh mạch trơn tru dẻo dai, giảm tiêu hao chân nguyên khi thi triển chiêu thức 15%.' },
  { id: 'thuan_thao', n: 'Dược Thi Thảo Mộc', d: 'Trồng cấy linh thảo trong động phủ sinh trưởng nhanh hơn 25%.' },
  { id: 'tien_ngam', n: 'Đạo Khí Trường Lưu', d: 'Hồi phục chân nguyên sau mỗi hiệp chiến đấu 5%.' },
  { id: 'bat_dong', n: 'Bất Động Như Sơn', d: 'Kháng đẩy lùi, choáng và hiệu ứng áp chế tăng 30%.' },
  { id: 'doc_duoc', n: 'Độc Đạo Tinh Tu', d: 'Bách độc tôi luyện, đòn đánh có 20% khả năng tẩm độc ăn mòn.' },
  { id: 'kinh_nghiem', n: 'Bách Chiến Thao Lược', d: 'Tích lũy kinh nghiệm chiến đấu tăng 20%.' },
  { id: 'linh_thach', n: 'Tụ Bảo Tài Vận', d: 'Khí vận +1, mỗi năm nhận thêm linh thạch lợi tức.' },
  { id: 'khong_tuoc', n: 'Thất Xảo Linh Lung', d: 'Khéo tay chế tạo cơ quan, con rối tăng 20% thuộc tính.' },
  { id: 'tam_kinh', n: 'Tâm Như Chỉ Thủy', d: 'Miễn nhiễm hiệu ứng khiêu khích và hoảng loạn.' },

  // Tier 2: Huyền Phẩm (26)
  { id: 'daphu', n: 'Ngủ say dưỡng khí', d: 'Bế quan tu luyện hấp thu linh khí thiên địa +12%.' },
  { id: 'nhangiac', n: 'Linh giác mẫn cảm', d: 'Dễ né phục kích, khám phá hiểm địa an toàn hơn.' },
  { id: 'dinhvan', n: 'Đào hoa duyên', d: 'Thiện cảm khi gặp người lạ +15, dễ kết giao tri kỷ và đạo lữ.' },
  { id: 'tranphap', n: 'Thần hành thuật', d: 'Tỉ lệ chạy trốn nguy nan +25%, tốc độ di chuyển trên bản đồ nhanh hơn 20%.' },
  { id: 'thanhkhi', n: 'Dưỡng khí sinh cơ', d: 'Hồi phục vết thương ngoài trận đấu nhanh gấp đôi.' },
  { id: 'linhkinh', n: 'Linh thị nhãn', d: 'Nhìn thấu tu vi hư thực của đối thủ thấp hơn cảnh giới.' },
  { id: 'daotam', n: 'Băng tâm quyết', d: 'Giảm 30% sát thương từ các đòn huyễn thuật và mê hoặc tinh thần.' },
  { id: 'chihuu', n: 'Cố nhân tương trợ', d: 'Dễ được cao nhân tiền bối tán tu chỉ điểm thêm kinh nghiệm tu vi.' },
  { id: 'can_cu', n: 'Cần cù bù thông minh', d: 'Tu luyện mỗi ngày chăm chỉ, tu vi tích lũy ổn định +10%.' },
  { id: 'nhe_nhang', n: 'Khinh Thân Thuật', d: 'Thân hình nhẹ nhàng, giảm 15% sát thương khi rơi từ cao hoặc trúng bẫy.' },
  { id: 'kien_nhan', n: 'Kiên nhẫn bền bỉ', d: 'Thời gian bế quan có thể kéo dài gấp đôi mà không sinh chán nản.' },
  { id: 'tiet_kiem', n: 'Cần kiệm trì gia', d: 'Tiêu hao linh thạch sinh hoạt và sửa chữa trang bị giảm 20%.' },
  { id: 'hieu_hoc', n: 'Hiếu học tầm sư', d: 'Tăng 15% cơ hội bái vào môn phái danh môn chính đạo.' },
  { id: 'khoan_dung', n: 'Khoan hòa đãi nhân', d: 'Ít khi tạo thù chuốc oán với tu sĩ khác ngoài giang hồ.' },
  { id: 'tinh_mat', n: 'Tinh mắt nhìn xa', d: 'Tầm nhìn trên bản đồ tăng 20%, sớm phát hiện kẻ thù.' },
  { id: 'nhanh_tay', n: 'Nhanh tay lẹ mắt', d: 'Nhặt đồ và thu hoạch tài nguyên nhanh hơn.' },
  { id: 'ngung_than', n: 'Ngưng thần định phách', d: 'Kháng phân tâm khi luyện đan chế khí +15%.' },
  { id: 'thao_da', n: 'Quen đường thuộc lối', d: 'Đi đường rừng núi tiêu hao ít thể lực hơn 25%.' },
  { id: 'vo_tinh', n: 'Vô tình kiếm khách', d: 'Sát phạt quyết đoán, bạo kích tăng 10%.' },
  { id: 'huong_thien', n: 'Tâm hướng thiện duyên', d: 'Dễ nhận được thiện cảm từ thường dân và tăng lữ.' },
  { id: 'an_phan', n: 'An phận thủ thường', d: 'Giảm 25% nguy cơ bị dính vào các vụ thanh trừng môn phái.' },
  { id: 'kheo_leo', n: 'Ngón tay khéo léo', d: 'Gia công vật liệu rèn đúc ít bị hư hao 15%.' },
  { id: 'thuc_khuya', n: 'Thức khuya đọc sách', d: 'Đọc công pháp ban đêm tăng 15% tiến độ.' },
  { id: 'nhan_nhin', n: 'Nhẫn nhục phụ trọng', d: 'Khi máu dưới 30% tăng phòng ngự thêm 15%.' },
  { id: 'lac_quan', n: 'Lạc quan yêu đời', d: 'Tâm trạng luôn tích cực, giảm 20% tâm ma tích tụ.' },
  { id: 'de_tinh', n: 'Dễ tính hòa đồng', d: 'Đạo lữ và đồng môn ít khi ghen tuông cãi vã.' },

  // Tier 0: Hung Phẩm (16)
  { id: 'cotrung', n: 'Cô độc', d: 'Không có bạn bè ban đầu, nhưng tu luyện +15%.', bad: true },
  { id: 'xuixeo', n: 'Sao chổi', d: 'Khí vận −3, nhưng mỗi lần đột phá thành công được thưởng thêm tu vi.', bad: true },
  { id: 'benhtat', n: 'Ốm yếu từ nhỏ', d: 'Căn cốt −2, nhưng đạo tâm +2.', bad: true },
  { id: 'thuhan', n: 'Huyết hải thâm thù', d: 'Có một kẻ thù mạnh hơn mình từ đầu. Đánh bại hắn được thưởng lớn.', bad: true },
  { id: 'tamquyet', n: 'Tâm ma túc trái', d: 'Đạo tâm −2, khi đột phá dễ gặp tâm ma nhưng chiến lực cuồng nộ +20%.', bad: true },
  { id: 'phankot', n: 'Nghịch cốt sinh tà', d: 'Khó kết giao môn phái, dễ bị đồng môn ngờ vực, nhưng sát thương bạo kích +25%.', bad: true },
  { id: 'tan_tat', n: 'Tàn tật một chân', d: 'Tốc độ di chuyển giảm 20%, nhưng hạ bàn vững chắc tăng 20% phòng ngự.', bad: true },
  { id: 'mu_loa', n: 'Nhược thị cận nhãn', d: 'Tầm nhìn giảm 30%, nhưng thính giác bù đắp giúp tăng 20% né tránh đòn đánh lén.', bad: true },
  { id: 'vo_duyen', n: 'Đoạn tuyệt hồng trần', d: 'Không thể kết đạo lữ, bù lại tu vi tốc độ tăng 20%.', bad: true },
  { id: 'kho_tinh', n: 'Tính tình quái đản', d: 'Người khác khó gần thiện cảm −20, nhưng công kích xuất kỳ bất ý +15%.', bad: true },
  { id: 'tham_lam', n: 'Tham lam vô độ', d: 'Dễ dính bẫy kho báu, nhưng khi cướp đoạt được nhiều hơn 30% linh thạch.', bad: true },
  { id: 'yeu_menh', n: 'Đoản mệnh chi tướng', d: 'Thọ nguyên giảm 25%, nhưng ngộ tính +3 để chạy đua với tử thần.', bad: true },
  { id: 'am_khi', n: 'Âm khí quấn thân', d: 'Dễ bị tà ma quấy nhiễu, nhưng đòn đánh kèm theo 15% sát thương hàn độc.', bad: true },
  { id: 'nang_no', n: 'Nợ máu ngập đầu', d: 'Bị sát thủ truy sát định kỳ, mỗi lần sống sót thực lực tăng mạnh.', bad: true },
  { id: 'tan_khi', n: 'Tản khí chi thể', d: 'Mỗi năm tiêu tán một ít chân nguyên, bù lại cơ thể hấp thu đan dược mạnh gấp rưỡi.', bad: true },
  { id: 'kinh_mach', n: 'Kinh mạch bế tắc', d: 'Tu luyện cảnh giới đầu chậm hơn 30%, nhưng khi đả thông thì khí hải rộng gấp đôi người thường.', bad: true },
];

// ---------- Xuất thân ----------
/** Chủng tộc ở màn đầu thai (bước 1); xuất thân không ghi race thuộc Nhân tộc. */
export const RACE_GROUPS = ['Nhân tộc', 'Yêu tộc', 'Ma tộc', 'Vu tộc', 'Hiên Viên tộc', 'Hình Thiên tộc', 'Cửu Lê tộc'] as const;
export const RACE_INFO: Record<string, string> = {
  'Nhân tộc': 'Sinh làm người ở Thương Lan: từ con nhà nghèo tới đích tử thế gia, thánh tử thánh địa. Lấy ngộ tính và sự cần cù bù đắp thể chất.',
  'Yêu tộc': 'Dị thú thiên địa: Sinh ra không có linh căn của nhân loại, tu luyện bằng cách ngưng tụ Yêu Đan, rèn luyện thể phách cường hãn và thần thông bản mệnh. Khi đạt tới cảnh giới nhất định sẽ thoát biến tiến hóa lên loài cao hơn theo cây gia phả.',
  'Ma tộc': 'Dòng dõi Ma đạo: mang thiên phú "Ma Huyết Phệ Hồn", lấy sát phạt dưỡng thân, đòn đánh hút máu hồi phục khí huyết, ma tính dâng trào theo thương thế.',
  'Vu tộc': 'Huyết mạch Thập Nhị Tổ Vu Bàn Cổ: mang thiên phú "Tổ Vu Chiến Thể", nhục thân vô địch, khí huyết và phòng ngự kinh người (+35% huyết, +25% thủ, giảm 15% sát thương), căn cốt tuyệt đỉnh.',
  'Hình Thiên tộc': 'Chiến thần viễn cổ: mang thiên phú "Bất Khuất Chiến Hồn", dẫu chém đầu vẫn múa rìu chiến đấu. Miễn tử 1 lần khi chịu đòn chí mạng trong mỗi trận, giữ lại sinh cơ bùng nổ phản kích.',
  'Hiên Viên tộc': 'Hậu duệ Hiên Viên Hoàng Đế: mang thiên phú "Hiên Viên Kiếm Khí", vạn tà bất xâm, thụ thiên mệnh che chở (+3 khí vận, +2 đạo tâm, +15% công, +20% kiếm uy, giảm 50% tâm ma).',
  'Cửu Lê tộc': 'Hậu duệ Xi Vưu Binh Chủ: mang thiên phú "Chiến Cuồng" và "Binh Chủ Di Phong", mình đồng da sắt, tự biết nghề Luyện khí, tăng 20% công phòng và giảm sát thương nhận vào.',
};
export const originRace = (o: { race?: string }) => o.race ?? 'Nhân tộc';
export interface Origin {
  id: string;
  n: string;
  loc: string;
  d: string;
  money: number;
  stat?: Partial<Record<StatKey, number>>;
  tier?: 1 | 2 | 3 | 4 | 5;
  tech?: string;
  herb?: number;
  craft?: 'alch' | 'talis' | 'forge';
  rival?: boolean;
  rootBoost?: boolean;
  karma?: number; // cần mở khoá bằng điểm luân hồi
  forcePerks?: string[]; // thiên phú bắt buộc của xuất thân (không tính vào số thiên phú được chọn)
  sect?: string; // sinh ra đã là người của tông môn này (thánh tử/thánh nữ)
  startR?: number; // cảnh giới khởi đầu
  clan?: string; // họ của thế gia (tên nhân vật đổi theo)
  clanId?: string; // id trong CLANS
  gearG?: number; // phẩm pháp bảo hộ thân khi đầu thai
  race?: string; // chủng tộc dị tộc
  beastOrigin?: boolean; // xuất thân yêu thú, loài được chọn ngẫu nhiên lúc đầu thai
}
/** Tên xuất thân theo giới tính: "{tu}" → "tử"/"nữ", "{congchua}" → "Hoàng tử"/"Công chúa", "{thetu}" → "Thế tử"/"Quận chúa", "{conquan}" → "Công tử"/"Tiểu thư". */
export const originName = (o: Origin, g?: 'm' | 'f') => {
  let n = o.n;
  if (n.includes('{congchua}')) {
    const repl = !g ? 'Hoàng tử/Công chúa' : g === 'f' ? 'Công chúa' : 'Hoàng tử';
    n = n.replace(/\{congchua\}/g, repl);
  }
  if (n.includes('{thetu}')) {
    const repl = !g ? 'Thế tử/Quận chúa' : g === 'f' ? 'Quận chúa' : 'Thế tử';
    n = n.replace(/\{thetu\}/g, repl);
  }
  if (n.includes('{conquan}')) {
    const repl = !g ? 'Công tử/Tiểu thư' : g === 'f' ? 'Tiểu thư' : 'Công tử';
    n = n.replace(/\{conquan\}/g, repl);
  }
  const repl = !g ? 'tử/nữ' : g === 'f' ? 'nữ' : 'tử';
  return n.replace(/\{tu\}/g, repl);
};
export const originDesc = (o: Origin, g?: 'm' | 'f') => {
  let d = o.d;
  if (d.includes('{congchua}')) {
    const repl = !g ? 'hoàng tử/công chúa' : g === 'f' ? 'công chúa' : 'hoàng tử';
    d = d.replace(/\{congchua\}/g, repl);
  }
  if (d.includes('{thetu}')) {
    const repl = !g ? 'thế tử/quận chúa' : g === 'f' ? 'quận chúa' : 'thế tử';
    d = d.replace(/\{thetu\}/g, repl);
  }
  if (d.includes('{conquan}')) {
    const repl = !g ? 'công tử/tiểu thư' : g === 'f' ? 'tiểu thư' : 'công tử';
    d = d.replace(/\{conquan\}/g, repl);
  }
  const repl = !g ? 'tử/nữ' : g === 'f' ? 'nữ' : 'tử';
  return d.replace(/\{tu\}/g, repl);
};
export const ORIGINS: Origin[] = [
  { id: 'tieuphu', n: 'Con tiều phu', loc: 'langtrang', d: 'Đốn củi dưới chân núi Trúc Lâm, từng thấy kiếm quang xé mây bay qua đỉnh núi mà ôm mộng tu tiên.', money: 4, stat: { can: 1 } },
  { id: 'chaichai', n: 'Con nhà chài', loc: 'bencat', d: 'Sinh trên thuyền, lớn trên biển.', money: 8, stat: { can: 1, van: 1 } },
  { id: 'hieuthuoc', n: 'Học việc hiệu thuốc', loc: 'lamthanh', d: 'Mồ côi từ nhỏ, được ông lang hiệu Bách An ở Lam Thành nhận nuôi. Biết tên trăm loại thảo dược trước khi biết chữ.', money: 20, herb: 4, craft: 'alch', stat: { ngo: 1 } },
  { id: 'tieucuc', n: 'Con nhà tiêu cục', loc: 'thietthanh', d: 'Cha là tổng tiêu đầu Uy Viễn tiêu cục ở Thiết Thành. Ngươi cầm đao từ năm sáu tuổi.', money: 40, stat: { can: 2 } },
  { id: 'dochu', n: 'Thư đồng nhà quan', loc: 'kinhdo', d: 'Hầu sách cho công tử phủ Thượng thư ở Thiên Kinh. Đọc lén sách của chủ nhiều hơn chủ đọc.', money: 15, stat: { ngo: 2 } },
  { id: 'kepphuong', n: 'Đào kép gánh hát', loc: 'vanmong', d: 'Theo gánh hát rong khắp Vân Mộng. Ngươi biết cười, biết khóc, biết nói dối không chớp mắt.', money: 25, stat: { mi: 2, van: 1 } },
  { id: 'mucdong', n: 'Mục đồng thảo nguyên', loc: 'bachlang', d: 'Chăn ngựa trên thảo nguyên Bắc Minh, quen gió tuyết và tiếng sói tru.', money: 6, stat: { can: 1, tam: 1 } },
  { id: 'lacda', n: 'Con thương đội sa mạc', loc: 'hoangsa', d: 'Sinh ra giữa đường buôn Tây Lương, đọc sao trời trước khi đọc chữ.', money: 60, stat: { van: 1 } },
  { id: 'phuthuy', n: 'Đồ đệ thầy pháp bản Man', loc: 'mangoc', d: 'Học vẽ bùa trừ tà ở Man Cốc, bùa người khác không linh nhưng tay ngươi hạ bút lại tự phát linh quang.', money: 10, craft: 'talis', stat: { tam: 1 } },
  { id: 'thorentieu', n: 'Con thợ rèn', loc: 'thietthanh', d: 'Lò rèn nhà ngươi đỏ lửa quanh năm ở Thiết Thành. Ngươi nghe tiếng sắt là biết thép tốt hay xấu.', money: 18, craft: 'forge', stat: { can: 1 } },
  { id: 'giatoc', n: 'Chi thứ Cố gia', loc: 'kinhdo', clan: 'Cố', d: 'Con thứ của vọng tộc tu tiên Thiên Kinh, nắm giữ tài nguyên tu luyện nhưng chịu nhiều ánh mắt dòm ngó.', money: 220, tech: 'thanhtam', rootBoost: true, rival: true, stat: { ngo: 1 }, karma: 30 },
  { id: 'thaitu', n: 'Hoàng tôn Đại Chu', loc: 'kinhdo', d: 'Cháu xa của hoàng đế Đại Chu. Gấm vóc lụa là, cung cấm hiểm sâu hơn bất cứ hiểm địa nào.', money: 400, rival: true, stat: { mi: 1, ngo: 1 }, karma: 60 },
  { id: 'thanhtu_tutieu', n: 'Thánh {tu} Tử Tiêu Tiên Cung', loc: 'tutieu', sect: 'tutieu', d: 'Tử lôi chín tiếng giáng thế, Cung chủ đích thân đón về lập làm thánh {tu}.', money: 300, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { ngo: 2, tam: 1 }, karma: 160 },
  { id: 'thanhtu_huyennguyen', n: 'Thánh {tu} Huyền Nguyên Thánh Địa', loc: 'huyennguyen', sect: 'huyennguyen', d: 'Thánh địa suy diễn ba trăm năm tìm về, kế thừa Huyền Nguyên Chân Kinh làm truyền nhân đời thứ chín.', money: 300, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { ngo: 1, tam: 2 }, karma: 160 },
  { id: 'thanhtu_batchu', n: 'Thánh {tu} Bất Chu Thánh Sơn', loc: 'batchu', sect: 'batchu', d: 'Mang tàn phiến cổ văn giáng thế dưới chân Bất Chu Sơn, thụ phong làm thánh {tu} duy nhất.', money: 250, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 2, tam: 1 }, karma: 160 },
  { id: 'chuyenthe', n: 'Chuyển thế đại năng', loc: 'langtrang', d: 'Trong mơ thường thấy một kiếp khác đạp mây. Ký ức tiền kiếp mờ nhạt nhưng ngộ tính tu luyện thông thiên.', money: 5, tech: 'thanhtam', rootBoost: true, stat: { ngo: 3, tam: 2 }, karma: 120 },
  // --- HOÀNG TRIỀU, QUAN LẠI & VÕ TƯỚNG NHÂN TỘC ---
  { id: 'hoang_toc_dich', n: '{congchua} Đại Chu Triều', loc: 'kinhdo', tier: 4, money: 950, rootBoost: true, rival: true, stat: { van: 3, mi: 2, tam: 1 }, karma: 75, d: 'Con đích xuất của Hoàng đế Đại Chu, được tắm nước tiên trì từ bé, mang khí vận chân long che chở, nắm giữ ngàn lượng vàng ròng linh thạch và bảo vật cung đình.' },
  { id: 'thetu_vuongphu', n: '{thetu} Tiêu Dao Vương Phủ', loc: 'kinhdo', tier: 4, money: 900, rival: true, stat: { van: 2, mi: 2 }, karma: 50, d: 'Con nhà thân vương thống lãnh một cõi, gấm vóc lụa là, từ nhỏ đã được danh sư truyền dạy cầm kỳ thi họa cùng bí pháp hoàng gia.' },
  { id: 'tran_bac_hau', n: '{conquan} Trấn Bắc Hầu Phủ', loc: 'bachlang', tier: 4, money: 750, rootBoost: true, rival: true, stat: { can: 2, van: 1, tam: 1 }, karma: 45, d: 'Con của Trấn Bắc Hầu nắm giữ ba mươi vạn thiết kỵ trấn thủ biên ải phía Bắc, tôi luyện dũng khí giữa gió tuyết cuồng phong.' },
  { id: 'dai_tuong_quan', n: '{conquan} Đại Tướng Quân Phủ', loc: 'thietthanh', tier: 4, money: 700, rootBoost: true, rival: true, stat: { can: 3, tam: 1 }, karma: 50, d: 'Con nhà tướng soái nắm giữ binh quyền đế quốc, cưỡi chiến mã từ năm lên tám, sát phạt quyết đoán, quen đao kiếm hơn phấn son.' },
  { id: 'con_te_tuong', n: '{conquan} Tể Tướng Phủ', loc: 'kinhdo', tier: 4, money: 600, rival: true, stat: { ngo: 2, van: 1 }, karma: 40, d: 'Cha là đương triều Tể tướng dưới một người trên vạn người, quyền khuynh triều dã, thư phòng tàng trữ vạn quyển đạo tàng bí tịch.' },
  { id: 'con_thuong_thu', n: '{conquan} Lễ Bộ Thượng Thư', loc: 'kinhdo', tier: 3, money: 350, stat: { ngo: 2, mi: 1 }, karma: 20, d: 'Sinh ra trong phủ Lễ Bộ Thượng Thư uy nghiêm lễ nghi, đọc thông bách gia kinh sử, văn khí ngưng tụ trong thần hồn.' },
  { id: 'cam_quan_do_thong', n: '{conquan} Thống Lĩnh Cấm Quân', loc: 'kinhdo', tier: 3, money: 300, stat: { can: 2, tam: 1 }, karma: 25, d: 'Cha là Đô thống cấm vệ quân canh giữ hoàng thành và long nhĩ đế vương, bản thân được thụ giáo võ kinh cấm quân từ nhỏ.' },
  { id: 'tien_phong_hieu_uy', n: 'Hiệu Úy Thiết Kỳ Quân', loc: 'thietthanh', tier: 3, money: 180, craft: 'forge', stat: { can: 2 }, d: 'Hiệu úy trẻ tuổi lập nhiều chiến công hiển hách ngoài quan ngoại, đao thương sắc lẹm, cưỡi thiết kỵ đạp tung doanh trại địch.' },
  { id: 'con_quan_huyen', n: '{conquan} Tri Huyện Lam Thành', loc: 'lamthanh', tier: 2, money: 120, stat: { van: 1, ngo: 1 }, d: 'Con quan phụ mẫu cai quản một phương, cuộc sống sung túc ấm êm, có nha dịch kẻ hầu người hạ cung phụng chu đáo.' },
  { id: 'thien_ho_doanh', n: '{conquan} Thiên Hộ Doanh Trại', loc: 'hoangsa', tier: 2, money: 110, stat: { can: 1, van: 1 }, d: 'Con cái của Thiên Hộ cai quản đồn trú biên ải sa mạc, quen tiếng trống trận và giáo mác từ thuở thiếu thời.' },
  { id: 'ngu_lam_quan', n: 'Ngự Lâm Quân thị vệ', loc: 'kinhdo', tier: 2, money: 90, stat: { can: 1, tam: 1 }, d: 'Tuyển chọn từ hàng ngàn thanh niên tuấn tú làm thị vệ bảo giá hoàng thành, giáp bạc kiếm bén, tác phong nghiêm minh.' },
  { id: 'han_lam_hoc_si', n: 'Môn sinh Hàn Lâm Viện', loc: 'kinhdo', tier: 2, money: 80, stat: { ngo: 2 }, d: 'Đỗ đạt kỳ thi điện đình làm học sĩ Hàn Lâm Viện, ngày ngày sao chép cổ tịch điển tịch triều đình, tâm tư thông tuệ mẫn tiệp.' },

  // --- CỬU LÊ TỘC (16 Xuất thân) ---
  { id: 'cuule_lo_duc', n: 'Đệ tử lò đúc', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 1, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Học việc kéo bễ thổi lửa trong hầm đúc binh khí của Cửu Lê Bát Thập Nhất Huynh Đệ.', money: 12, stat: { can: 1 } },
  { id: 'cuule_trinh_sat', n: 'Trinh sát sơn lâm', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 1, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Trinh sát nhanh nhẹn như báo đen luồn lách qua các bãi lầy và rừng rậm sương mù.', money: 22, stat: { can: 1, van: 1 } },
  { id: 'cuule_dao_khoang', n: 'Thợ đào quặng đồng', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 1, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Đào quặng thanh đồng sâu ngàn trượng dưới lòng núi, thân thể rắn chắc như đá tảng.', money: 15, stat: { can: 1 } },
  { id: 'cuule_thao_nam', n: 'Tiều phu chướng khí', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 1, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Đẵn gỗ lim và chặt dây leo độc nơi đầm lầy, quen sống với độc khí từ nhỏ.', money: 10, stat: { can: 1 } },
  { id: 'cuule_thiet_giap', n: 'Thiết giáp dũng sĩ', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 2, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Mặc giáp thanh đồng nặng trăm cân, đầu đội mũ sừng trâu, đao thương chém vào chỉ tóe tia lửa.', money: 45, stat: { can: 2 } },
  { id: 'cuule_doc_y', n: 'Vu Y luyện cổ', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 2, forcePerks: ['cuongchien', 'binhchu'], craft: 'alch', herb: 3, d: 'Biết dùng nọc độc sâu bọ và thảo mộc man hoang tôi luyện binh khí bén ngót.', money: 40, stat: { ngo: 1 } },
  { id: 'cuule_binh_khi', n: 'Đúc khí tông đồ', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 2, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Học việc dưới trướng đại sư rèn kích nỏ liên hoàn, am hiểu tính chất trăm loại quặng sắt.', money: 50, stat: { can: 1, ngo: 1 } },
  { id: 'cuule_da_thu', n: 'Thuần thú dũng sĩ', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 2, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Chỉ huy bầy khổng tước hung hăng và dã thú đi săn, đấm lui hổ báo chỉ bằng tay không.', money: 35, stat: { can: 1, van: 1 } },
  { id: 'cuule_bat_thap', n: 'Hậu duệ Bát Thập Huynh Đệ', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 3, clan: 'Xi Vưu', forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Huyết mạch dòng thứ của tám mươi mốt huynh đệ Xi Vưu, đầu đồng trán sắt, dũng mãnh cái thế.', money: 190, rival: true, stat: { can: 2, van: 1 }, karma: 35 },
  { id: 'cuule_phong_ba', n: 'Phong Bá Truyền Nhân', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 3, clan: 'Phong Bá', forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Kế thừa bí pháp hô phong dẫn khí, vung đao phát ra cuồng phong xé rách chiến trường.', money: 200, stat: { can: 1, ngo: 2 }, karma: 35 },
  { id: 'cuule_vu_su', n: 'Vũ Sư Đích Duệ', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 3, clan: 'Vũ Sư', forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Truyền nhân của Vũ Sư triệu mưa tạo lầy, giỏi bố trí độc vụ và trận địa bùn lầy giam địch.', money: 210, stat: { can: 1, tam: 2 }, karma: 35 },
  { id: 'cuule_thieu_chu', n: 'Huyết tộc Binh Chủ', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 4, clan: 'Xi Vưu', forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Con cháu dòng dõi Binh Chủ, trời sinh sát khí ngút trời, hiểu thấu mọi loại thần binh đao kiếm.', money: 240, rival: true, stat: { can: 2, ngo: 1 }, karma: 40 },
  { id: 'cuule_van_binh', n: 'Vạn Binh Tông Sư', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 4, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', tech: 'thanhtam', rootBoost: true, d: 'Trời sinh mẫn cảm với thần binh, có thể lắng nghe tiếng ngân và cảm ứng linh hồn của vũ khí cổ.', money: 260, stat: { ngo: 2, can: 2 }, karma: 65 },
  { id: 'cuule_cuong_chien', n: 'Cuồng Huyết Bá Thể', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 4, clan: 'Cửu Lê', forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', rootBoost: true, d: 'Chiến sĩ thức tỉnh cuồng huyết viễn cổ, càng bị thương nặng thì sức mạnh càng bộc phát kinh người.', money: 270, stat: { can: 3, tam: 1 }, karma: 70 },
  { id: 'cuule_thanh_tu', n: 'Xi Vưu Thánh Tử', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 5, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Mang chân huyết Xi Vưu Đại Đế, vạn binh quy phục, huyết sát ngút trời chấn nhiếp bát hoang lục hợp.', money: 380, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 3, ngo: 1, tam: 1 }, karma: 130 },
  { id: 'cuule_binh_de', n: 'Binh Chủ Tái Sinh', loc: 'mangoc', race: 'Cửu Lê tộc', tier: 5, forcePerks: ['cuongchien', 'binhchu'], craft: 'forge', d: 'Hồn phách Thượng Cổ Binh Chủ chuyển thế đầu thai, hiệu lệnh vạn binh, sát phạt khai thiên lập địa.', money: 420, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 3, tam: 2 }, karma: 140 },

  // --- VU TỘC (16 Xuất thân) ---
  { id: 'vu_san_ban', n: 'Man hoang liệp thủ', loc: 'mangoc', race: 'Vu tộc', tier: 1, forcePerks: ['vuthe'], d: 'Thợ săn trẻ tuổi trong rừng sâu Thập Vạn Đại Sơn, theo chân người lớn săn thú dữ từ thuở biết đi.', money: 8, stat: { can: 1 } },
  { id: 'vu_chien_binh', n: 'Cốt giáp dũng sĩ', loc: 'mangoc', race: 'Vu tộc', tier: 1, forcePerks: ['vuthe'], d: 'Chiến sĩ mang giáp xương mãnh thú, từng một mình đấm chết thiết giáp hùng trong nghi lễ thành nhân.', money: 25, stat: { can: 2 } },
  { id: 'vu_dap_da', n: 'Tiều phu Man Hoang', loc: 'mangoc', race: 'Vu tộc', tier: 1, forcePerks: ['vuthe'], d: 'Xẻ đá đốn cổ thụ nơi hoang dã ngàn năm, hai tay rắn như gang thép gánh vác ngàn cân.', money: 12, stat: { can: 1 } },
  { id: 'vu_chay_nhanh', n: 'Sơn cước phi nhân', loc: 'mangoc', race: 'Vu tộc', tier: 1, forcePerks: ['vuthe'], d: 'Lớn lên giữa vách đá cheo leo, chạy đua cùng sơn dương và báo đốm như bay trên mặt đất.', money: 15, stat: { van: 1 } },
  { id: 'vu_thao_y', n: 'Dược đồ Thảo Vu', loc: 'mangoc', race: 'Vu tộc', tier: 2, forcePerks: ['vuthe'], craft: 'alch', herb: 3, d: 'Học việc bên cạnh Vu Y bốc thuốc chữa thương, biết dùng cổ trùng và thảo dược tôi luyện thân thể.', money: 40, stat: { ngo: 1, can: 1 } },
  { id: 'vu_khac_cot', n: 'Khắc cốt phù sư', loc: 'mangoc', race: 'Vu tộc', tier: 2, forcePerks: ['vuthe'], craft: 'talis', d: 'Học nghệ thuật khắc phù văn thượng cổ lên đầu lâu cự thú, ngự linh hộ thể.', money: 45, stat: { tam: 1 } },
  { id: 'vu_thuan_thu', n: 'Ngự man cự tượng', loc: 'mangoc', race: 'Vu tộc', tier: 2, forcePerks: ['vuthe'], d: 'Kỵ sĩ điều khiển man tượng khổng lồ mở đường xuyên rừng sâu, da dày thịt béo khó tổn thương.', money: 35, stat: { can: 1, van: 1 } },
  { id: 'vu_dong_doi', n: 'Hộ vệ bộ lạc', loc: 'mangoc', race: 'Vu tộc', tier: 2, forcePerks: ['vuthe'], d: 'Thủ hộ sơn trại bộ lạc trước sự tập kích của yêu ma và dị tộc rình rập hàng đêm.', money: 30, stat: { can: 1, tam: 1 } },
  { id: 'vu_chuc_am', n: 'Hậu duệ Chúc Cửu Âm', loc: 'mangoc', race: 'Vu tộc', tier: 3, clan: 'Chúc Âm', forcePerks: ['vuthe'], d: 'Dòng dõi Tổ Vu Thời Gian, mở mắt là ngày, nhắm mắt là đêm, trực giác cảm ứng thiên cơ cực nhạy.', money: 190, stat: { ngo: 2, tam: 1 }, karma: 35 },
  { id: 'vu_chuc_dung', n: 'Chúc Dung Huyết Duệ', loc: 'mangoc', race: 'Vu tộc', tier: 3, clan: 'Chúc Dung', forcePerks: ['vuthe'], d: 'Dòng dõi Hỏa Thần Chúc Dung, trời sinh không sợ dung nham liệt hỏa, thân thể tỏa ra nhiệt độ bỏng cháy.', money: 200, stat: { can: 2, ngo: 1 }, karma: 35 },
  { id: 'vu_cong_cong', n: 'Cộng Công Tộc Dũng', loc: 'mangoc', race: 'Vu tộc', tier: 3, clan: 'Cộng Công', forcePerks: ['vuthe'], d: 'Huyết mạch Thủy Thần Cộng Công, cuồng lực húc gãy trụ trời, ngâm mình đáy vực sâu vạn dặm không chết.', money: 190, stat: { can: 2, tam: 1 }, karma: 35 },
  { id: 'vu_te_tu', n: 'Tế tư truyền nhân', loc: 'mangoc', race: 'Vu tộc', tier: 4, forcePerks: ['vuthe'], d: 'Đích truyền của Đại Tế Tư bộ lạc, thông hiểu thiên văn địa lý, giao tiếp cùng anh linh tổ vu.', money: 220, rival: true, stat: { tam: 2, ngo: 1 }, karma: 40 },
  { id: 'vu_man_vuong', n: 'Man Hoang Tù Trưởng Tử', loc: 'mangoc', race: 'Vu tộc', tier: 4, clan: 'Đại Vu', forcePerks: ['vuthe'], rootBoost: true, d: 'Con trai vương giả thống ngự trăm vạn man dân, nhục thân tôi luyện bằng trăm loại huyết mạch cự thú.', money: 260, rival: true, stat: { can: 3, van: 1 }, karma: 65 },
  { id: 'vu_hau_nghe', n: 'Hậu Nghệ Thần Tiễn', loc: 'mangoc', race: 'Vu tộc', tier: 4, clan: 'Hậu Nghệ', forcePerks: ['vuthe'], tech: 'thanhtam', rootBoost: true, d: 'Kế thừa tài xạ thuật bắn rụng mặt trời, ánh mắt xuyên thấu ngàn dặm hư không, một mũi tên định giang sơn.', money: 270, stat: { can: 2, ngo: 2 }, karma: 70 },
  { id: 'vu_than_due', n: 'Đại Vu Thần Duệ', loc: 'mangoc', race: 'Vu tộc', tier: 5, forcePerks: ['vuthe'], d: 'Huyết mạch Thập Nhị Tổ Vu Bàn Cổ nồng đậm chưa từng có, mình đồng da sắt, nhục thân xé rách non sông.', money: 350, rootBoost: true, rival: true, startR: 1, stat: { can: 3, tam: 2 }, karma: 130 },
  { id: 'vu_ban_co', n: 'Bàn Cổ Chân Tủy', loc: 'batchu', race: 'Vu tộc', tier: 5, forcePerks: ['vuthe'], d: 'Sinh ra mang chân tủy Bàn Cổ sơ khai giáng thế, nhục thân vô địch thế gian, vạn kiếp bất diệt.', money: 410, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 3, ngo: 2, tam: 1 }, karma: 140 },

  // --- MA TỘC (16 Xuất thân) ---
  { id: 'ma_no', n: 'Ma nô tầng đáy', loc: 'mangoc', race: 'Ma tộc', tier: 1, forcePerks: ['mahuyet'], d: 'Nô lệ đào khoáng ma thạch ở đáy Vạn Ma Quật, lớn lên giữa tanh hôi và chết chóc.', money: 8, stat: { can: 1 } },
  { id: 'ma_binh', n: 'Tuần giới ma binh', loc: 'mangoc', race: 'Ma tộc', tier: 1, forcePerks: ['mahuyet'], d: 'Binh sĩ gác ải biên cảnh Ma Vực, quen với gió lạnh và lưỡi đao rỉ máu.', money: 22, stat: { can: 1, tam: 1 } },
  { id: 'ma_tu_toi', n: 'Huyết lao khổ sai', loc: 'mangoc', race: 'Ma tộc', tier: 1, forcePerks: ['mahuyet'], d: 'Kéo xích sắt dưới hầm ngục Ma Hoàng Thành, tôi luyện ý chí sống sót ngoan cường giữa cạm bẫy.', money: 12, stat: { can: 1 } },
  { id: 'ma_sat_thu', n: 'U hồn ám sát giả', loc: 'mangoc', race: 'Ma tộc', tier: 1, forcePerks: ['mahuyet'], d: 'Ẩn mình trong bóng tối từ thuở bé, học cách đoạt mạng đối thủ không gây một tiếng động.', money: 20, stat: { ngo: 1 } },
  { id: 'ma_duoc_do', n: 'Đồ đệ Ma Y', loc: 'mangoc', race: 'Ma tộc', tier: 2, forcePerks: ['mahuyet'], craft: 'alch', herb: 3, d: 'Theo học một vị lão ma chuyên luyện độc đan và huyết dược, hiểu rõ kinh mạch và tử huyệt.', money: 45, stat: { ngo: 1 } },
  { id: 'ma_luyen_khi', n: 'Ma cốt đúc đao', loc: 'mangoc', race: 'Ma tộc', tier: 2, forcePerks: ['mahuyet'], craft: 'forge', d: 'Dùng xương cốt cường giả và lửa ma rèn đúc vũ khí hung sát, đao vừa ra lò đã ngập oán khí.', money: 40, stat: { can: 1, ngo: 1 } },
  { id: 'ma_tuan_thu', n: 'Ma thú tuần sư', loc: 'mangoc', race: 'Ma tộc', tier: 2, forcePerks: ['mahuyet'], d: 'Chăn dắt và thuần phục bầy Ma Lang khát máu, tính cách tàn nhẫn quyết đoán.', money: 35, stat: { can: 1, van: 1 } },
  { id: 'ma_huyet_te', n: 'Huyết trì tế đồ', loc: 'mangoc', race: 'Ma tộc', tier: 2, forcePerks: ['mahuyet'], d: 'Sống sót sau nghi thức ngâm mình trong huyết trì cổ, toàn thân ngập tràn ma sát tinh huyết.', money: 50, stat: { can: 2 } },
  { id: 'ma_viem_ma', n: 'Viêm Ma Liệt Hỏa', loc: 'mangoc', race: 'Ma tộc', tier: 3, clan: 'Viêm Ma', forcePerks: ['mahuyet'], d: 'Hậu duệ bộ tộc Viêm Ma ngự hỏa, đòn đánh kèm theo hắc hỏa thiêu đốt chân nguyên đối phương.', money: 190, stat: { can: 2, ngo: 1 }, karma: 35 },
  { id: 'ma_am_nguyet', n: 'Ám Nguyệt Dạ Xoa', loc: 'mangoc', race: 'Ma tộc', tier: 3, clan: 'Dạ Ma', forcePerks: ['mahuyet'], d: 'Dòng dõi Ám Ma tốc độ quỷ mị, thoắt ẩn thoắt hiện dưới ánh trăng máu.', money: 200, stat: { van: 2, ngo: 1 }, karma: 35 },
  { id: 'ma_huyen_am', n: 'Huyễn Ma Mị Hồn', loc: 'mangoc', race: 'Ma tộc', tier: 3, clan: 'Huyễn Ma', forcePerks: ['mahuyet'], d: 'Hậu duệ Huyễn Ma chuyên mê hoặc tâm trí, lời nói ngọt ngào như độc dược quyến rũ vạn linh.', money: 210, stat: { mi: 2, tam: 1 }, karma: 35 },
  { id: 'ma_thieu_chu', n: 'Thiếu chủ Ma Môn', loc: 'mangoc', race: 'Ma tộc', tier: 4, clan: 'U Minh', forcePerks: ['mahuyet'], d: 'Con trai trưởng lão Thiên Ma Tông, từ nhỏ đã được ngâm mình trong huyết trì rèn đúc ma khu.', money: 240, tech: 'thanhtam', rival: true, stat: { can: 1, ngo: 2 }, karma: 40 },
  { id: 'ma_kiem_ton', n: 'Kiếm Thai Ma Hồn', loc: 'mangoc', race: 'Ma tộc', tier: 4, forcePerks: ['mahuyet'], tech: 'thanhtam', rootBoost: true, d: 'Nuôi dưỡng ma kiếm bản mệnh trong tim từ nhỏ, mỗi lần vung kiếm là một lần hiến tế tinh huyết uy chấn tứ phương.', money: 260, stat: { can: 2, ngo: 2 }, karma: 65 },
  { id: 'ma_huyet_long', n: 'Huyết Hải Thiếu Đế', loc: 'mangoc', race: 'Ma tộc', tier: 4, clan: 'Huyết Hải', forcePerks: ['mahuyet'], rootBoost: true, rival: true, d: 'Sinh ra tại trung tâm Minh Hà Huyết Hải, vạn giọt ma huyết quy tụ ngưng tụ chân ma chi thân.', money: 280, stat: { can: 2, tam: 2 }, karma: 75 },
  { id: 'ma_than_duoc', n: 'Ma Thần Chân Truyền', loc: 'mangoc', race: 'Ma tộc', tier: 5, forcePerks: ['mahuyet'], d: 'Trời sinh ma chủng, dị tượng nhật nguyệt đồng quy, kế thừa ma công vô thượng của Viễn Cổ Ma Tổ.', money: 380, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 2, ngo: 2, tam: 1 }, karma: 130 },
  { id: 'ma_la_hau', n: 'La Hầu Tái Sinh', loc: 'batchu', race: 'Ma tộc', tier: 5, forcePerks: ['mahuyet'], d: 'Ý chí Ma Tổ La Hầu thức tỉnh, chấp chưởng Tru Tiên kiếm sát, đồ lục thiên hạ vạn đạo quy ma.', money: 430, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 3, ngo: 2, van: 1 }, karma: 140 },

  // --- HÌNH THIÊN TỘC (16 Xuất thân) ---
  { id: 'hinhthein_tan_binh', n: 'Tân binh chiến tộc', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 1, forcePerks: ['batkhuat'], d: 'Thiếu niên mới gia nhập chiến đội, vác rìu tập luyện dưới thác nước ngày đêm.', money: 10, stat: { can: 1 } },
  { id: 'hinhthein_dung_si', n: 'Chiến sĩ tiên phong', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 1, forcePerks: ['batkhuat'], d: 'Lao vào trận địa xung phong đầu tiên, khắp mình mang đầy vết thương vinh quang của chiến binh.', money: 25, stat: { can: 2 } },
  { id: 'hinhthein_chan_thu', n: 'Mục đồng săn sói', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 1, forcePerks: ['batkhuat'], d: 'Một mình chăn thả bầy thú giữa hang hốc hoang vu, nhiều lần tay không bẻ gãy cổ sói rừng.', money: 12, stat: { can: 1 } },
  { id: 'hinhthein_khuan_da', n: 'Lực sĩ vác đá', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 1, forcePerks: ['batkhuat'], d: 'Vác tảng đá nặng ngàn cân leo vách núi mỗi sớm, gân cốt rắn như thiết thạch.', money: 15, stat: { can: 1 } },
  { id: 'hinhthein_tho_ren', n: 'Thợ rèn chiến phủ', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 2, forcePerks: ['batkhuat'], craft: 'forge', d: 'Thợ rèn chuyên đúc rìu chiến và giáp nặng khổng lồ cho chiến sĩ bộ tộc.', money: 45, stat: { can: 1, ngo: 1 } },
  { id: 'hinhthein_thuong_binh', n: 'Dược dịch chiến thương', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 2, forcePerks: ['batkhuat'], herb: 3, d: 'Biết tìm kiếm linh thảo cầm máu và băng bó vết thương cho các dũng sĩ sau trận huyết chiến.', money: 35, stat: { ngo: 1 } },
  { id: 'hinhthein_thu_binh', n: 'Chiến tràng thu tàn', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 2, forcePerks: ['batkhuat'], d: 'Thu dọn di vật và binh khí sót lại sau chiến hỏa, rèn luyện được đôi mắt quan sát sắc bén.', money: 30, stat: { van: 1 } },
  { id: 'hinhthein_thiet_ve', n: 'Hộ lăng chiến vệ', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 2, forcePerks: ['batkhuat'], d: 'Canh gác lăng mộ liệt tổ liệt tông trên đỉnh núi gió tuyết, bất chấp đói lạnh không rời một bước.', money: 40, stat: { can: 1, tam: 1 } },
  { id: 'hinhthein_cuong_huyet', n: 'Cuồng Chiến Dũng Tướng', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 3, clan: 'Chiến Cuồng', forcePerks: ['batkhuat'], d: 'Dòng dõi chiến tướng tả xung hữu đột, vung song phủ chém tan vạn quân không hề chớp mắt.', money: 190, rival: true, stat: { can: 2, tam: 1 }, karma: 35 },
  { id: 'hinhthein_doan_thu', n: 'Đoạn Thủ Tộc Duệ', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 3, clan: 'Đoạn Thủ', forcePerks: ['batkhuat'], d: 'Con cháu dòng dõi thề chết không lùi, dù thân thể đứt lìa vẫn dùng ngực làm mắt rốn làm miệng chiến đấu.', money: 200, stat: { can: 2, van: 1 }, karma: 35 },
  { id: 'hinhthein_bat_khuat_chi', n: 'Bất Khuất Tông Duệ', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 3, clan: 'Bất Diệt', forcePerks: ['batkhuat'], d: 'Mang ý chí bất khuất như bàn thạch, đứng vững trước mọi luồng uy áp và sát khí cuồn cuộn.', money: 210, stat: { tam: 2, can: 1 }, karma: 35 },
  { id: 'hinhthein_thieu_chu', n: 'Tù trưởng chi tử', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 4, clan: 'Hình Thiên', forcePerks: ['batkhuat'], d: 'Con trai tộc trưởng, từ nhỏ đã được truyền thụ đồ hình chiến trận và ý chí tử chiến không lùi.', money: 240, rival: true, stat: { can: 2, tam: 1 }, karma: 40 },
  { id: 'hinhthein_vo_song', n: 'Vô Song Chiến Phủ', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 4, forcePerks: ['batkhuat'], craft: 'forge', rootBoost: true, d: 'Tự tay đúc nên rìu chiến bản mệnh khổng lồ, chiến lực áp chế đồng giai, dũng quan tam quân.', money: 260, stat: { can: 3, ngo: 1 }, karma: 65 },
  { id: 'hinhthein_kiem_khien', n: 'Thần Khiên Hộ Quốc', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 4, clan: 'Thần Khiên', forcePerks: ['batkhuat'], rootBoost: true, d: 'Kế thừa tấm khiên đồng vĩ đại của đại dũng sĩ, lực phòng ngự kiên cố như thành đồng vách sắt.', money: 270, stat: { can: 2, tam: 2 }, karma: 70 },
  { id: 'hinhthein_chien_than', n: 'Chiến Thần Giáng Thế', loc: 'mangoc', race: 'Hình Thiên tộc', tier: 5, forcePerks: ['batkhuat'], d: 'Sinh ra tay cầm thần phủ, gầm vang chấn động sơn hà, toàn tộc tôn sùng làm Chiến Thần tái sinh.', money: 360, rootBoost: true, rival: true, startR: 1, stat: { can: 3, tam: 2 }, karma: 130 },
  { id: 'hinhthein_khai_thien', n: 'Khai Thiên Chiến Bá', loc: 'batchu', race: 'Hình Thiên tộc', tier: 5, forcePerks: ['batkhuat'], d: 'Chiến ý nghịch thiên khiêu chiến cả thiên đạo, đao búa xé rách thương khung, bất tử bất diệt trong chiến hỏa.', money: 410, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 3, tam: 2, ngo: 1 }, karma: 140 },

  // --- HIÊN VIÊN TỘC (16 Xuất thân) ---
  { id: 'hienvien_quet_kiem', n: 'Thị tòng Kiếm Các', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 1, forcePerks: ['hoangdao'], d: 'Thiếu niên quét dọn trong Kiếm Các Hiên Viên thị, ngày đêm nghe tiếng kiếm ngân mà nuôi chí lớn.', money: 12, stat: { ngo: 1 } },
  { id: 'hienvien_thi_ve', n: 'Ngự tiền thị vệ', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 1, forcePerks: ['hoangdao'], d: 'Thị vệ tuần tra điện tiền Hoàng Đế Cung, kỷ luật nghiêm minh, cung kiếm thuần thục.', money: 28, stat: { can: 1, van: 1 } },
  { id: 'hienvien_nong_canh', n: 'Điển nông hoàng huấn', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 1, forcePerks: ['hoangdao'], d: 'Trông nom linh điền và mùa màng theo lời dạy của Thánh Hoàng, am hiểu sự tuần hoàn của vạn vật.', money: 15, stat: { ngo: 1 } },
  { id: 'hienvien_thu_sinh', n: 'Văn uyển thư sinh', loc: 'kinhdo', race: 'Hiên Viên tộc', tier: 1, forcePerks: ['hoangdao'], d: 'Đọc thiên văn địa lý và điển chương hoàng đạo trong cung điện, phong thái ôn nhu điềm đạm.', money: 20, stat: { ngo: 1, tam: 1 } },
  { id: 'hienvien_kiem_do', n: 'Hiên Viên Rèn Kiếm', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 2, forcePerks: ['hoangdao'], craft: 'forge', d: 'Thợ đúc kiếm dưới trướng đúc kiếm sư hoàng tộc, biết cách tôi luyện kiếm phôi ngậm linh quang.', money: 50, stat: { can: 1, ngo: 1 } },
  { id: 'hienvien_duoc_vien', n: 'Ngự dược điển dịch', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 2, forcePerks: ['hoangdao'], craft: 'alch', herb: 3, d: 'Học việc tại vườn thảo dược hoàng thất, biết phối chế thuốc dưỡng khí bồi bổ căn bản.', money: 45, stat: { ngo: 1 } },
  { id: 'hienvien_tran_phap', n: 'Trận đồ thị độc', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 2, forcePerks: ['hoangdao'], craft: 'talis', d: 'Nghiên cứu kỳ môn độn giáp và Bát Quái trận đồ của Hoàng Đế truyền lại để bảo hộ trận địa.', money: 40, stat: { ngo: 1, tam: 1 } },
  { id: 'hienvien_ngu_ma', n: 'Ngự mã kỵ sĩ', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 2, forcePerks: ['hoangdao'], d: 'Chăn dắt đàn thiên mã và thần câu cho hoàng tộc, thân thủ linh hoạt phi phàm.', money: 35, stat: { can: 1, van: 1 } },
  { id: 'hienvien_ung_long', n: 'Ứng Long Huyết Mạch', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 3, clan: 'Ứng Long', forcePerks: ['hoangdao'], d: 'Dòng dõi thần tướng Ứng Long theo hầu Hoàng Đế, có đôi cánh rồng vẫy gọi bão mưa diệt giặc.', money: 200, stat: { can: 2, van: 1 }, karma: 35 },
  { id: 'hienvien_phong_hau', n: 'Phong Hậu Trí Tộc', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 3, clan: 'Phong Hậu', forcePerks: ['hoangdao'], d: 'Hậu duệ tể tướng Phong Hậu kỳ mưu diệu toán, mưu lược cái thế, nhìn thấu cạm bẫy thiên hạ.', money: 210, stat: { ngo: 2, tam: 1 }, karma: 35 },
  { id: 'hienvien_luc_muc', n: 'Lực Mục Thần Tướng', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 3, clan: 'Lực Mục', forcePerks: ['hoangdao'], d: 'Dòng dõi đại tướng Lực Mục lực địch muôn người, vung bảo đao trấn giữ tứ phương bờ cõi.', money: 190, stat: { can: 2, ngo: 1 }, karma: 35 },
  { id: 'hienvien_hoang_ton', n: 'Hoàng tộc chi thứ', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 4, clan: 'Hiên Viên', forcePerks: ['hoangdao'], d: 'Hậu duệ dòng thứ của Hiên Viên gia tộc, được ban linh dược và danh kiếm tu luyện từ bé.', money: 240, rival: true, stat: { ngo: 2, van: 1 }, karma: 45 },
  { id: 'hienvien_kiem_y', n: 'Hoàng Đạo Kiếm Tâm', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 4, forcePerks: ['hoangdao'], tech: 'thanhtam', rootBoost: true, d: 'Trời sinh kiếm tâm thông thấu, lĩnh hội chân ý Hiên Viên kiếm quyết, kiếm khí chính đạo tà ma tránh xa.', money: 260, stat: { ngo: 3, can: 1 }, karma: 70 },
  { id: 'hienvien_cuu_long', n: 'Cửu Long Khí Vận', loc: 'kinhdo', race: 'Hiên Viên tộc', tier: 4, clan: 'Hiên Viên', rootBoost: true, rival: true, d: 'Sinh ra có chín luồng hoàng long khí vờn quanh đỉnh đầu, thiên mệnh đế vương sủng ái ngập tràn.', money: 280, stat: { van: 3, tam: 1 }, karma: 75 },
  { id: 'hienvien_thanh_hoang', n: 'Thánh Hoàng Trực Hệ', loc: 'mangoc', race: 'Hiên Viên tộc', tier: 5, forcePerks: ['hoangdao'], d: 'Đích truyền trực hệ mang huyết mạch Hiên Viên Hoàng Đế thuần khiết nhất, vạn kiếm quy phục, thiên mệnh hoàng đạo.', money: 400, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { ngo: 2, tam: 2, van: 1 }, karma: 140 },
  { id: 'hienvien_nhan_hoang', n: 'Thống Nhất Sơn Hà', loc: 'batchu', race: 'Hiên Viên tộc', tier: 5, forcePerks: ['hoangdao'], d: 'Ý chí Nhân Hoàng thức tỉnh, định đỉnh Trung Nguyên, chấp chưởng Hiên Viên Thần Kiếm chém sạch yêu ma.', money: 450, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { ngo: 3, tam: 2, van: 1 }, karma: 150 },

  // --- YÊU TỘC (16 Thân phận trong tộc quần Yêu thú - Tuyệt đối không chứa tên loài) ---
  { id: 'yeu_hoang_thu', n: 'Dã thú mồ côi', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 1, forcePerks: ['yeudan'], d: 'Sinh ra trong khe đá hoang vu không cha mẹ, tự mình bới tìm đồ ăn và trốn tránh thiên địch từ nhỏ.', money: 8, stat: { can: 1 } },
  { id: 'yeu_thay_dan', n: 'Thú con trong bầy', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 1, forcePerks: ['yeudan'], d: 'Sinh ra trong một bầy đàn yêu thú đông đúc giữa rừng sâu, được đồng loại bao bọc che chở.', money: 18, stat: { van: 1 } },
  { id: 'yeu_hac_thi', n: 'Thú đầm lầy u tối', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 1, forcePerks: ['yeudan'], d: 'Lớn lên giữa vũng lầy hôi tanh ngập tràn độc khí, da thịt dày dạn chịu đựng sương gió.', money: 12, stat: { can: 1 } },
  { id: 'yeu_tuyet_canh', n: 'Ấu thú rãnh băng', loc: 'bachlang', race: 'Yêu tộc', beastOrigin: true, tier: 1, forcePerks: ['yeudan'], d: 'Sinh ra trong hang băng vạn trượng vùng Bắc Minh tuyết phủ, quen chịu rét buốt thấu xương.', money: 15, stat: { can: 1 } },
  { id: 'yeu_dong_boc', n: 'Động phủ yêu bộc', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 2, forcePerks: ['yeudan'], herb: 3, d: 'Thú con canh cửa hầu hạ trong sơn động của một vị Yêu Đan kỳ đại năng, được ban linh khí và linh quả thừa.', money: 35, stat: { can: 1 } },
  { id: 'yeu_linh_thu', n: 'Linh thú hộ sơn', loc: 'bachlang', race: 'Yêu tộc', beastOrigin: true, tier: 2, forcePerks: ['yeudan'], tech: 'thonnguyetquyet', d: 'Sinh sống gần sơn môn tu tiên nhân loại, từng trộm nghe chân nhân thuyết pháp mà sớm mở mang linh trí.', money: 45, stat: { ngo: 1 } },
  { id: 'yeu_thao_moc', n: 'Dược uyển hộ thú', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 2, forcePerks: ['yeudan'], craft: 'alch', herb: 3, d: 'Trông coi linh thảo thiên địa ngàn năm trong cốc sâu, ngậm nuốt sương sớm linh dược mà tiến hóa.', money: 40, stat: { ngo: 1 } },
  { id: 'yeu_tieu_yeu', n: 'Tiểu yêu sơn trại', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 2, forcePerks: ['yeudan'], craft: 'forge', d: 'Tuần la canh gác trại yêu quái của Yêu Vương, từng gõ trống đánh chiêng xua đuổi dã thú.', money: 30, stat: { can: 1, van: 1 } },
  { id: 'yeu_bach_hoa', n: 'Linh thai Bách Hoa Cốc', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 3, forcePerks: ['yeudan'], d: 'Thai nghén tại Bách Hoa Sơn ngàn năm hoa nở, hấp thu tinh hoa cỏ cây, thân thể ngát hương thơm, linh tính thuần khiết.', money: 180, stat: { mi: 2, ngo: 1 }, karma: 35 },
  { id: 'yeu_xich_xa', n: 'Huyết trì thối thể thú', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 3, forcePerks: ['yeudan'], d: 'Ngâm mình dưới huyết trì ngàn năm tôi luyện thể xác, da thịt cứng như sắt thép, huyết khí dũng mãnh khác thường.', money: 200, stat: { can: 2, van: 1 }, karma: 35 },
  { id: 'yeu_quy_vuong', n: 'Thiếu chủ Vạn Yêu Động', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 3, rival: true, d: 'Con của một vị Yêu Vương uy chấn một phương, dưới trướng có ngàn vạn tiểu yêu nghe lệnh.', money: 210, stat: { can: 2, tam: 1 }, karma: 35 },
  { id: 'yeu_yeu_tuong', n: 'Hậu duệ Yêu Tướng', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 4, d: 'Huyết mạch của một vị Yêu Tướng hùng cứ ngàn dặm hoang sơn, từ nhỏ đã được truyền dạy yêu công sát phạt.', money: 240, rival: true, stat: { can: 2, van: 1 }, karma: 40 },
  { id: 'yeu_nghich_linh', n: 'Dị biến yêu thai', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 4, forcePerks: ['yeudan'], tech: 'thonnguyetquyet', rootBoost: true, d: 'Thai nghén trong linh mạch nghìn năm xảy ra dị biến, sinh ra mọc thêm nghịch cốt thiên tư cái thế.', money: 270, stat: { can: 2, ngo: 2 }, karma: 70 },
  { id: 'yeu_thao_thiet_due', n: 'Viễn cổ huyết kế thừa', loc: 'bachlang', race: 'Yêu tộc', beastOrigin: true, tier: 4, rootBoost: true, d: 'Mang trong mình một sợi chân huyết viễn cổ truyền thừa, thức tỉnh dị tượng bẩm sinh, tốc độ và uy lực vô song.', money: 280, stat: { van: 2, ngo: 2 }, karma: 75 },
  { id: 'yeu_than_thu', n: 'Thần thú ấu đích', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, tier: 5, forcePerks: ['yeudan'], d: 'Sinh ra tại tuyệt đỉnh long mạch, mang trong mình dòng máu thần thú thượng cổ thuần khiết, muôn thú cúi đầu quy phục.', money: 350, rootBoost: true, rival: true, startR: 1, stat: { can: 3, ngo: 1, van: 1 }, karma: 130 },
  { id: 'yeu_yeu_hoang', n: 'Yêu Hoàng huyết duệ', loc: 'batchu', race: 'Yêu tộc', beastOrigin: true, tier: 5, forcePerks: ['yeudan'], d: 'Đích hệ con cháu của Yêu Hoàng Thái Cổ Đế Tuấn, sinh ra đã có Nhật Nguyệt yêu hỏa hộ thân, hiệu triệu vạn yêu quy bái.', money: 420, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 3, ngo: 2, tam: 1 }, karma: 140 }
];


// ---------- Thế gia tu chân ----------
export interface Clan {
  id: string;
  sur: string; // họ
  n: string; // tên gọi
  seat: string; // id địa điểm tổ trạch
  el: El[];
  ancestor: number; // cảnh giới lão tổ
  patron: string | null; // tông môn bảo hộ (thế gia phụ thuộc)
  secret?: string; // quan hệ ngầm (không công khai)
  allies: string[];
  foes: string[];
  d: string;
  feud: string; // lý do thù hận với kẻ thù chính
}
export const CLANS: Record<string, Clan> = {
  on: { id: 'on', sur: 'Ôn', n: 'Ôn thị Vân Mộng', seat: 'vanmong', el: ['thuy', 'moc'], ancestor: 4, patron: null, allies: ['ta', 'khuong'], foes: ['lanh'],
    d: 'Thế gia tám trăm năm trên sông nước Vân Mộng, giàu nhờ thuyền buôn và dược điền. Không theo tông môn nào, tự xưng "nước chảy không cần bờ".',
    feud: 'Trăm năm trước, đích nữ Ôn gia bỏ trốn ngay đêm cưới với thiếu chủ Lãnh gia. Lãnh gia coi đó là nhục, hai nhà từ đó không đội trời chung.' },
  tudo: { id: 'tudo', sur: 'Tư Đồ', n: 'Tư Đồ thị Lam Thành', seat: 'lamthanh', el: ['thuy', 'quang', 'moc'], ancestor: 6, patron: null, allies: ['ta'], foes: ['congton'],
    d: 'Cổ tộc ngàn năm giữa lòng Trung Vực. Lão tổ là đại năng Luyện Hư, không phụ thuộc thánh địa nào — thánh chủ gặp cũng phải chắp tay ngang hàng. Con cháu Tư Đồ gia đi đâu cũng được mời ngồi ghế trên.',
    feud: 'Công Tôn thị dựa thế Tử Tiêu Tiên Cung lấn dần sản nghiệp Tư Đồ gia ở Trung Vực. Hai nhà chưa động binh, nhưng mỗi lần chạm mặt là một lần đấu trí.' },
  congton: { id: 'congton', sur: 'Công Tôn', n: 'Công Tôn thị Hoài Dương', seat: 'hoaiduong', el: ['loi', 'kim', 'phong'], ancestor: 5, patron: 'tutieu', allies: ['doanmoc'], foes: ['ta', 'tudo'],
    d: 'Thế gia chư hầu của Tử Tiêu Tiên Cung tại Trung Vực, trăm năm nay lên như diều gặp gió. Gia chủ đời này tham vọng lớn: muốn thay Tạ gia làm thế gia đứng đầu kinh kỳ.',
    feud: 'Tạ gia theo Huyền Nguyên, Công Tôn gia theo Tử Tiêu. Thù của hai nhà thật ra là ván cờ giữa hai thánh địa — chỉ có máu đổ là thật.' },
  lanh: { id: 'lanh', sur: 'Lãnh', n: 'Lãnh thị Sóc Phong', seat: 'socphong', el: ['bang', 'thuy'], ancestor: 4, patron: 'hanbang', allies: ['hoac'], foes: ['on'],
    d: 'Thế gia trấn biên phương bắc, đời đời gả con vào Hàn Băng Các, nhờ đó được che chở. Người Lãnh gia lạnh như băng và nhớ thù lâu như băng.',
    feud: 'Mối nhục hôn ước bị hủy với Ôn thị vẫn khắc trên bia tổ đường.' },
  ta: { id: 'ta', sur: 'Tạ', n: 'Tạ thị Thiên Kinh', seat: 'kinhdo', el: ['kim', 'tho', 'quang'], ancestor: 5, patron: 'huyennguyen', allies: ['on', 'tudo'], foes: ['congton', 'hoac', 'mudung'],
    d: 'Thế gia quyền thế bậc nhất kinh đô: ba đời làm quốc sư Đại Chu, lại là thế gia phụ thuộc của Huyền Nguyên Thánh Địa. Đứng giữa triều đình và tiên môn, ai cũng phải nể.',
    feud: 'Tạ gia và Hoắc gia tranh nhau mạch linh thạch dưới Thiết Thành suốt ba trăm năm, máu đổ không biết bao nhiêu lần.' },
  hoac: { id: 'hoac', sur: 'Hoắc', n: 'Hoắc thị Thiết Thành', seat: 'thietthanh', el: ['kim', 'hoa'], ancestor: 4, patron: 'lietduong', allies: ['lanh', 'mudung'], foes: ['ta'],
    d: 'Thế gia luyện khí, nắm nửa số lò rèn Thiết Thành. Phụ thuộc Liệt Dương Môn, mỗi năm cống pháp khí đổi lấy chỗ dựa.',
    feud: 'Mạch linh thạch dưới Thiết Thành vốn của Hoắc gia — ít nhất họ tin vậy. Tạ gia dựa thế triều đình chiếm mất một nửa.' },
  mudung: { id: 'mudung', sur: 'Mộ Dung', n: 'Mộ Dung thị Hoàng Sa', seat: 'hoangsa', el: ['hoa', 'quang', 'kim'], ancestor: 4, patron: 'dieunhat', secret: 'huyetsat', allies: ['hoac'], foes: ['doanmoc', 'ta'],
    d: 'Thế gia thương nhân nắm đường buôn Tây Lương, ngoài mặt phụ thuộc Diệu Nhật Thần Cung. Có lời đồn rằng Mộ Dung gia còn lén làm ăn với Huyết Sát Điện.',
    feud: 'Tranh giành thương lộ trên biển với Đoan Mộc thị; thuyền hai nhà gặp nhau là đánh.' },
  doanmoc: { id: 'doanmoc', sur: 'Đoan Mộc', n: 'Đoan Mộc thị Đông Hải', seat: 'vonghai', el: ['loi', 'thuy'], ancestor: 5, patron: 'tutieu', allies: ['khuong', 'congton'], foes: ['mudung'],
    d: 'Thế gia hải thương cai quản cảng Vọng Hải, là chư hầu ngoài biển của Tử Tiêu Tiên Cung. Thuyền Đoan Mộc treo cờ tử lôi, hải tặc thấy là tránh.',
    feud: 'Mộ Dung thị nhiều lần thuê hải tặc cướp thuyền Đoan Mộc. Bằng chứng thì chưa ai tìm được.' },
  khuong: { id: 'khuong', sur: 'Khương', n: 'Khương thị Nam Cương', seat: 'namcuong', el: ['moc', 'tho'], ancestor: 3, patron: null, allies: ['on', 'doanmoc'], foes: ['hoangphu'],
    d: 'Thế gia ẩn thế giữa rừng Nam Man, giỏi y thuật và giải cổ. Từ chối mọi lời mời của tông môn lớn, chỉ kết thân với người đáng tin.',
    feud: 'Hoàng Phủ gia đầu quân Vạn Độc Giáo, nhiều lần thả cổ vào giếng nước của Khương gia để ép họ khuất phục.' },
  diep: { id: 'diep', sur: 'Diệp', n: 'Diệp thị Hoang Cổ', seat: 'diepgia', el: ['moc', 'kim', 'quang'], ancestor: 5, patron: null, allies: ['khuong'], foes: ['ta', 'congton'],
    d: 'Cổ tộc Hoang Cổ từng sánh vai thánh địa, nay suy vi nhưng vẫn giữ truyền thừa Hỗn Độn Kiếm và bí tịch thượng cổ.',
    feud: 'Năm Diệp thị suy, Tạ thị và Công Tôn thị chia nhau linh mạch của Diệp gia. Món nợ đó, người nhà họ Diệp chưa từng quên.' },
  hoangphu: { id: 'hoangphu', sur: 'Hoàng Phủ', n: 'Hoàng Phủ thị Man Cốc', seat: 'mangoc', el: ['moc', 'am'], ancestor: 3, patron: 'vandoc', allies: ['mudung'], foes: ['khuong'],
    d: 'Thế gia nuôi cổ, phụ thuộc Vạn Độc Giáo. Người ngoài sợ, người trong tộc càng sợ — gia chủ đời nào cũng chết vì cổ của người kế vị.',
    feud: 'Khương gia giải được mọi loại cổ của Hoàng Phủ gia. Còn Khương gia, Hoàng Phủ gia không bao giờ thật sự thắng.' },
};
export const clanRel = (a: string, b: string): 'self' | 'ally' | 'foe' | 'none' =>
  a === b ? 'self' : CLANS[a]?.allies.includes(b) ? 'ally' : CLANS[a]?.foes.includes(b) ? 'foe' : 'none';
for (const c of Object.values(CLANS)) {
  ORIGINS.splice(ORIGINS.length - 1, 0, {
    id: 'thegia_' + c.id,
    n: `Đích {tu} ${c.n}`,
    loc: c.seat,
    clan: c.sur,
    clanId: c.id,
    d: c.d,
    money: 300 + c.ancestor * 60,
    rootBoost: true,
    rival: true,
    startR: 1,
    gearG: 1,
    stat: { ngo: 1, can: 1 },
    karma: 50,
  });
}

/** Thứ bậc xuất thân (thấp → cao) và linh thạch khởi đầu tương ứng. */
const ORIGIN_MONEY: Record<string, number> = {
  tieuphu: 4, chuyenthe: 5, mucdong: 6, chaichai: 8, phuthuy: 10, kepphuong: 14, dochu: 18, hieuthuoc: 22, thorentieu: 28, tieucuc: 40, lacda: 60,
  giatoc: 200, thaitu: 700, thegia_diep: 800, thanhtu_batchu: 1000, thanhtu_huyennguyen: 1100, thanhtu_tutieu: 1200,
};
for (const o of ORIGINS) {
  if (ORIGIN_MONEY[o.id] != null) o.money = ORIGIN_MONEY[o.id];
  else if (o.clanId) o.money = 300 + CLANS[o.clanId].ancestor * 60; // thế gia: lão tổ càng cao càng giàu
}
{
  const d = ORIGINS.find((o) => o.id === 'thegia_diep')!;
  d.n = 'Đích {tu} Diệp thị Hoang Cổ';
  d.gearG = 2;
  d.stat = { ngo: 1, can: 1, tam: 1 };
  d.karma = 120;
}
// Diệp gia Hỗn Độn: dòng chính của mọi người họ Diệp, lưu lạc xuống Thương Lan qua khe nứt không gian
ORIGINS.push({
  id: 'diep_hondon',
  n: 'Huyết mạch Diệp gia Hỗn Độn',
  loc: 'diepgia',
  clan: 'Diệp',
  clanId: 'diep',
  d: 'Dòng chính Hỗn Độn lưu lạc Thương Lan, nắm giữ huyết mạch viễn cổ tối thượng và đính ước cùng chư thiên thánh nữ.',
  money: 10500,
  stat: { ngo: 5, can: 5, van: 10, tam: 5 },
  karma: 300,
});
ORIGINS.sort((a, b) => (b.money ?? 0) - (a.money ?? 0));

// ---------- Tên ----------
export const SURN = ["Hoàng","Quách","Trần","Ngô","Dương","Hàn","Vương","Tần","Doanh","Đỗ","Lưu","Trương","Lý","Triệu","Tống","Chu","Ngụy","Tôn","Hà","Lâm","Tiêu","Giang","Bạch","Đào","Liễu","Đường","Cao","La","Phùng","Trịnh","Tào","Phan","Từ","Lữ","Lương","Thái","Vệ","Tưởng","Khang","Đinh","Nhậm","Viên","Dư","Lục","Tạ","Cố","Thẩm","Tô","Diệp","Phó","Hứa","Mạnh","Kỷ","Ôn","Văn","Hoắc","Tiết","Bùi","Lam","Mục","Khương","Lãnh","Nhạc","Sở","Vân","Phí","Liêm","Sầm","Lôi","Hạ","Nghê","Thang","Đằng","Ân","Tất","Hác","Ô","An","Thường","Lạc","Ngũ","Nguyên","Bặc","Bình","Hòa","Doãn","Diêu","Thiệu","Uông","Kỳ","Mao","Vũ","Địch","Mễ","Bối","Minh","Tang","Nhiễm","Đàm","Hướng","Thôi","Cung","Trác","Chung","Khâu","Cốc","Xa","Hầu","Bàng","Cảnh","Nhiếp","Mai","Khổng","Trang","Yến","Tiền","Kim","Chúc","Phù","Chử","Thích","Trâu","Dụ","Bách","Thủy","Đậu","Chương","Cát","Hề","Phạm","Bành","Lang","Lỗ","Vi","Xương","Mã","Miêu","Phượng","Phương","Du","Bào","Sử","Đổng","Điền","Phàn","Hạng","Giả","Khúc","Diêm","Lư","Sài","Quan","Trọng","Bì","Biện","Âu Dương","Thượng Quan","Đông Phương","Nam Cung","Tư Mã","Gia Cát","Mộ Dung","Hoàng Phủ","Đoan Mộc","Hạ Hầu","Tư Đồ","Công Tôn","Bách Lý","Độc Cô","Lệnh Hồ","Uất Trì","Hách Liên","Văn Nhân","Chung Ly","Vũ Văn","Trưởng Tôn","Tư Không","Thác Bạt","Thái Sử","Tây Môn","Bắc Cung","Hô Diên","Đông Quách","Thuần Vu"];
export const MYTHIC_SURS = ['Hiên Viên', 'Hình Thiên', 'Xi Vưu', 'Cửu Lê', 'U Minh', 'Chúc Âm', 'Chúc Dung', 'Cộng Công', 'Hậu Nghệ', 'Viêm Ma', 'Dạ Ma', 'Thần Khiên', 'Ứng Long', 'Phong Hậu', 'Lực Mục', 'Bách Hoa', 'Xích Lân', 'Vạn Yêu', 'Hắc Phong', 'Thần Cầm'];
/** Tách họ và tên riêng; nhận đúng cả họ kép (Công Tôn, Đoan Mộc, Tư Đồ…). */
export function splitName(name: string): { sur: string; given: string } {
  const all = [...new Set([...SURN, ...MYTHIC_SURS, ...Object.values(CLANS).map((c) => c.sur), 'Hoàng Phủ', 'Mộ Dung', ...HOLY_SURS])].sort((a, b) => b.length - a.length);
  const n = name.trim();
  const sur = all.find((x) => n.startsWith(x + ' ')) ?? n.split(' ')[0];
  return { sur, given: n.slice(sur.length).trim() };
}
/** Đổi họ của một cái tên (giữ tên riêng). Nhận đúng cả họ kép như Công Tôn, Đoan Mộc, Tư Đồ. */
export function setSurname(name: string, sur: string): string {
  const all = [...new Set([...SURN, ...MYTHIC_SURS, ...Object.values(CLANS).map((c) => c.sur), 'Hoàng Phủ', 'Mộ Dung', ...HOLY_SURS])].sort((a, b) => b.length - a.length);
  const n = name.trim();
  const cur = all.find((x) => n.startsWith(x + ' '));
  const given = cur ? n.slice(cur.length + 1) : n.split(' ').slice(1).join(' ') || n;
  return `${sur} ${given}`;
}
export const MALE = ["Hàn Lập","Tiêu Viêm","Lâm Động","Mạnh Hạo","Trần Bình An","Diệp Phàm","Sở Phàm","Bạch Tiểu Thuần","Ninh Phàm","Quân Tiêu Dao","Vân Triệt","Thần Cơ","Phong Thần","Huyền Diệp","Trọng Lâu","Trường Ca","Tiêu Dao","Nhất Kiếm","Kinh Lôi","Lăng Phong","Diệp Thu","Tần Vũ","Tiêu Thần","Dạ Thần","Cố Trần","Tử Lăng","Trảm Phong","Thần Nam","Vô Nhai","Trọng Hoa","Bất Hối","Kiếm Nhất","Vô Địch","Phá Thiên","Diễn Phong","Hạo Nguyệt","Hàn Băng","Xích Viêm","Dạ Lăng","Minh Dạ","Thiên Vũ","Huyền Tịch","Liệt Không","Cửu Châu","Tử Lôi","Mặc Hàn","Bắc Thần","Vân Chu","Huyền Vũ","Lạc Trần","Khâm Thiên","Trọng Dạ","Vọng Thư","Cố Dạ","Trường Phong","Thanh Huyền","Vân Đình","Dật Trần","Tinh Hà","Mặc Ngôn","Tử Kỳ","Quân Lâm","Hạo Nhiên","Tu Viễn","Cảnh Du","Thiên Hành","Vân Thâm","Tử Hiên","Hoài Cẩn","Minh Triết","Trường Khanh","Dịch An","Thanh Dương","Vân Tiêu","Cảnh Thần","Thiếu Khanh","Ngọc Hành","Thiên Hựu","Hạo Vũ","Tư Viễn","Nhược Trần","Bác Văn","Tĩnh Chi","Trọng Minh","Tử Khiêm","Vĩnh An","Hoài Sơn","Kiến Nguyên","Thanh Hoài","Vân Sinh","Lăng Tiêu","Thiên Dật","Huyền Chi","Cẩn Du","Vô Trần","Trường Sinh","Tử Hằng","Mộ Bạch","Cảnh Dương","Huyền Minh","Hoằng Văn","Đình Phong","Vũ Hiên","Văn Hiên","Thiên Trạch","Tử Du","Minh Châu","Hạo Thiên","Khải Phong","Tu Trúc","Ngọc Thư","Hoài Nam","Hàn Giang","Thiên Lãng","Hành Chu","Kinh Hồng","Minh Viễn","Thừa Ân","Tử Mặc","Vô Kỵ","Thiên Sách","Lâm Xuyên","Cảnh Hành","Trầm","Dật","Hoài","Cảnh","Trí","Tranh","Nguyên","Diễn","Khải","Phong","Vân","Thiên","Vũ","Lôi","Kiếm","Viêm","Hàn","Trần","Thần"];
/** Họ cố định của Thánh nữ (f) và Thánh tử (m) theo từng thánh địa (bậc 4), mọi giới; tên riêng ngẫu nhiên.
 *  Mỗi họ chỉ thuộc một thánh địa; Thánh tử và Thánh nữ cùng tông là hai gia tộc khác nhau tranh vị trí trong tông.
 *  Không dùng họ của 8 thế gia, họ Diệp, họ Ngô (Ngô gia Hỗn Độn). Kiểm tra: tools/test_holy_names.ts. */
export const HOLY_SUR: Record<string, { f: string; m: string }> = {
  // Thương Lan
  tutieu: { f: 'Lạc', m: 'Tiêu' },
  huyennguyen: { f: 'Lâm', m: 'Thượng Quan' },
  batchu: { f: 'Thẩm', m: 'Độc Cô' },
  cuuu: { f: 'Hoa', m: 'Mặc' },
  cucbang: { f: 'Mộ', m: 'Hàn' },
  longdinh: { f: 'Vân', m: 'Ngao' },
  vanyeudinh: { f: 'Bạch', m: 'Lệnh Hồ' },
  linhsontu: { f: 'Tô', m: 'Giang' },
  // giới 1
  w1_thienlinhthanhdia: { f: 'Liễu', m: 'Nam Cung' },
  w1_vankiemthanhtong: { f: 'Tần', m: 'Lục' },
  w1_thaiamthanhcung: { f: 'Yến', m: 'Âu Dương' },
  w1_lyhoatong: { f: 'Diêu', m: 'Phong' },
  w1_hoanhatrai: { f: 'Ân', m: 'Thác Bạt' },
  // giới 2
  w2_thiendinhtienphu: { f: 'Cố', m: 'Đông Phương' },
  w2_daotrithanhcung: { f: 'Tống', m: 'Gia Cát' },
  w2_ngochukiemcac: { f: 'Kỷ', m: 'Tây Môn' },
  w2_bonglaitientong: { f: 'Hứa', m: 'Tư Mã' },
  w2_namminhlyhoacung: { f: 'Đào', m: 'Hạ Hầu' },
  // giới 3
  w3_chuthandien: { f: 'Triệu', m: 'Úy Trì' },
  w3_thaiduongthancung: { f: 'Khổng', m: 'Tào' },
  w3_thaiamthancung: { f: 'Thi', m: 'Nghiêm' },
  w3_loithandien: { f: 'Lữ', m: 'Ngụy' },
  w3_hoangtuyenthangiao: { f: 'Tưởng', m: 'Vệ' },
  // Hồng Hoang
  w4_xiengiaongochucung: { f: 'Lý', m: 'Trịnh' },
  w4_daogiaobatcanhcung: { f: 'Trương', m: 'Phó' },
  w4_tietgiaobichducung: { f: 'Bùi', m: 'Mạnh' },
  w4_tayphuonggiao: { f: 'Dư', m: 'Khang' },
  w4_yeudinh: { f: 'Hà', m: 'Tề' },
  w4_vutocbancodien: { f: 'Sở', m: 'Ngũ' },
  // Hỗn Độn
  w5_hongmongdaocung: { f: 'Vương', m: 'Trần' },
  w5_honnguyenthanhdien: { f: 'Phùng', m: 'Tôn' },
  w5_khaithienthanmon: { f: 'Tiền', m: 'Kim' },
  w5_vocucdaovien: { f: 'Hoàng', m: 'Chu' },
};
/** Họ cố định của Thánh tử / Thánh nữ một thánh địa (undefined nếu không phải thánh địa trong bảng). */
export const holySur = (sectId: string | null | undefined, g: 'm' | 'f') => (sectId ? HOLY_SUR[sectId]?.[g] : undefined);
/** Mọi họ thuộc về thánh địa (để NPC thánh địa khác không dùng nhầm). */
export const HOLY_SURS = new Set(Object.values(HOLY_SUR).flatMap((x) => [x.f, x.m]));
/** Kho tên riêng hai chữ cho thánh nữ / thánh tử và nút "Ngẫu nhiên" khi đổi tên. */
export const GIVEN_F = ['Thanh Tuyết', 'Ngưng Sương', 'Nguyệt Hoa', 'Tịch Dao', 'Linh Lung', 'Tố Y', 'Khinh Vũ', 'Lộng Ảnh', 'Băng Tâm', 'Tịch Nhan', 'Uyển Nhi', 'Thiên Tuyết', 'Như Mộng', 'Vân Khê', 'Thanh Ca', 'Ngọc Dao', 'Mạn Thanh', 'Tử Yên', 'Như Yên', 'Mộng Dao', 'Vũ Hi', 'Sơ Ảnh', 'Thu Thủy', 'Hàm Yên', 'Bích Dao', 'Tịch Nguyệt', 'Vân Thường', 'Khuynh Thành', 'Tuyết Kiến', 'Nhược Thủy'];
export const GIVEN_M = ['Hành Chu', 'Kinh Hồng', 'Minh Viễn', 'Thừa Ân', 'Tử Mặc', 'Vô Kỵ', 'Thiên Sách', 'Lâm Xuyên', 'Trường Phong', 'Vân Đình', 'Thanh Huyền', 'Dật Trần', 'Cảnh Hành', 'Tinh Hà', 'Lạc Trần', 'Mặc Ngôn', 'Tử Kỳ', 'Quân Lâm'];
export const FEM = ["Thanh Tuyết","Nguyệt Thiền","Thanh Y","Huân Nhi","Nam Cung Uyển","Tử Nghiên","Nhược Vi","Sở Kiều","Mộ Tuyết","Dao Cơ","Uyển Nhi","Ngưng Sương","Băng Ngưng","Vân Hi","Linh Lung","Tố Y","Tịch Nhan","Thính Vũ","Lạc Băng","Chỉ Nhược","Mộng Khê","Dạ Nguyệt","Phù Dung","Bích Hà","Thiển Thiển","Diệp Thanh","Tuyết Nghê","Linh Nhi","Như Sương","Bích Dao","Diễm Lan","Cẩm Sắt","Mộng Dao","Ngâm Sương","Chiêu Tuyết","Yên Chi","Nhược Lan","Triêu Nhan","Tĩnh Hương","Uyển Dung","Nhược Vũ","Vãn Tình","Sở Tuyết","Thanh Nhã","Sở Sở","Lộ Khiết","Y Nguyệt","Lam Huyên","Dao Trì","Tố Huyên","Hàm Chi","Diễm Cơ","Ngưng Lạc","Chiêu Hoa","Nguyệt Hoa","Tịch Dao","Khinh Vũ","Lộng Ảnh","Băng Tâm","Thiên Tuyết","Như Mộng","Vân Khê","Ngọc Dao","Mạn Thanh","Tử Yên","Như Yên","Vũ Hi","Sơ Ảnh","Khuynh Thành","Tuyết Kiến","Nhược Thủy","Cẩm Tú","An Nhiên","Thanh Trúc","Nguyệt Cầm","Tĩnh Xu","Diệu Âm","Lưu Ly","Tuyết Liên","Uyển Thanh","Ngọc Tâm","Tử Hà","Vân Y","Hạ Lan","Xuân Hi","Thu Nguyệt","Hàn Mai","Thanh Liên","Tố Nguyệt","Ngưng Hương","Mộc Lan","Ngọc Châu","Linh San","Tịch Lam","Vân Cẩm","Hàm Chương","Thiên Hương","Thanh Uyển","Tâm Nghi","Tuyết Ninh","Mộng Điệp","Khinh La","Tịnh Y","Tư Vũ","Nguyệt Anh","Thanh Ca","Vân Thường","Như Ý","Tố Tâm","Lạc Anh","Tịch Nguyệt","Hàm Yên","Thu Thủy","Tuyết","Nguyệt","Dao","Băng","Tâm","Sương","Yên","Lam","Y","Hà","Uyển","Linh","Chi","Nhan","Huyên","Thiềm","Vân","Liên","Hương","Mai","Trúc","Nhược","Thường"];
/** Đạo hiệu nữ tu. */
export const DAO_HAO_F = ['Thanh Tuyết', 'Tố Nguyệt', 'Lăng Ba', 'Băng Tâm', 'Tử Yên', 'Ngọc Hoa', 'Lạc Hà', 'Bích Lạc', 'Hàn Mai', 'Lưu Ly', 'Thanh Liên', 'Vân Thường', 'Diệu Âm', 'Nghê Thường'];
export const DAO_HAO = ['Thanh Phong', 'Huyền Cơ', 'Tử Dương', 'Bạch Thạch', 'Cô Vân', 'Tàng Kiếm', 'Vọng Nguyệt', 'Hàn Sơn', 'Lưu Thủy', 'Thiết Tâm', 'Ngọc Hư', 'Xích Hà'];
