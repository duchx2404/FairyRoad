// Dữ liệu nền: ngũ hành, cảnh giới, linh căn, thể chất, thiên phú, xuất thân, tên.

export type El = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho' | 'bang' | 'loi' | 'phong' | 'am' | 'quang' | 'yin' | 'yang';

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
};
/** a sinh b (tương sinh) — công pháp hệ được sinh vẫn tu được, chậm hơn chút. */
export const SINH: Partial<Record<El, El>> = { kim: 'thuy', thuy: 'moc', moc: 'hoa', hoa: 'tho', tho: 'kim' };

export function elMult(att: El | null | undefined, def: El | null | undefined): number {
  if (!att || !def) return 1;
  if (KHAC[att].includes(def)) return 1.5;
  if (KHAC[def].includes(att)) return 0.75;
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
];
export const THAP = 11;
/** Bát quái linh căn: Âm + Dương hợp nhất. */
export const BATQUAI = 12;
/** Xác định loại linh căn theo các hệ đã có. */
export function rootKindOf(els: El[]): number {
  const n = els.length;
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
];

// ---------- Thiên phú (chọn khi đầu thai) ----------
export interface Perk {
  id: string;
  n: string;
  d: string;
  bad?: boolean;
}
export const PERKS: Perk[] = [
  { id: 'kiemtam', n: 'Kiếm tâm', d: 'Kiếm pháp uy lực +20%.' },
  { id: 'dangu', n: 'Đan ngữ', d: 'Luyện đan thành công +10%, đan phẩm chất cao hơn.' },
  { id: 'phusu', n: 'Phù tay', d: 'Chế phù thành công +12%.' },
  { id: 'thuongnhan', n: 'Đầu óc buôn bán', d: 'Mua rẻ hơn 15%, bán đắt hơn 15%.' },
  { id: 'daphu', n: 'Ngủ ngon', d: 'Bế quan tu luyện +10%.' },
  { id: 'menhcung', n: 'Mệnh cứng', d: 'Trọng thương sắp chết có 50% cơ hội giữ được một hơi.' },
  { id: 'nhangiac', n: 'Trực giác', d: 'Dễ né phục kích, khám phá hiểm địa an toàn hơn.' },
  { id: 'dinhvan', n: 'Đào hoa', d: 'Thiện cảm khi gặp người lạ +15. Với xuất thân có hôn ước: nhiều hôn ước hơn và dễ giữ hôn ước hơn.' },
  { id: 'chanhan', n: 'Chân nhân dạy chữ', d: 'Ngộ tính +2.' },
  { id: 'dakhoe', n: 'Da trâu', d: 'Căn cốt +2.' },
  { id: 'phuctinh', n: 'Phúc tinh', d: 'Khí vận +2.' },
  { id: 'tinhtam', n: 'Tĩnh tâm', d: 'Đạo tâm +2, tâm ma khó xâm nhập.' },
  { id: 'duocdien', n: 'Mắt dược sư', d: 'Hái thuốc được nhiều hơn, nhận ra linh thảo quý.' },
  { id: 'tranphap', n: 'Chạy nhanh', d: 'Tỉ lệ chạy trốn +25%, đi đường nhanh hơn 20%.' },
  { id: 'samhoi', n: 'Trường thọ', d: 'Thọ nguyên +15%.' },
  { id: 'cuongchien', n: 'Chiến cuồng', d: 'Càng mất máu càng đánh mạnh.' },
  { id: 'cotrung', n: 'Cô độc', d: 'Không có bạn bè ban đầu, nhưng tu luyện +15%.', bad: true },
  { id: 'xuixeo', n: 'Sao chổi', d: 'Khí vận −3, nhưng mỗi lần đột phá thành công được thưởng thêm tu vi.', bad: true },
  { id: 'benhtat', n: 'Ốm yếu từ nhỏ', d: 'Căn cốt −2, nhưng đạo tâm +2.', bad: true },
  { id: 'thuhan', n: 'Gánh huyết hải thâm thù', d: 'Có một kẻ thù mạnh hơn mình từ đầu. Đánh bại hắn được thưởng lớn.', bad: true },
];

// ---------- Xuất thân ----------
/** Chủng tộc ở màn đầu thai (bước 1); xuất thân không ghi race thuộc Nhân tộc. */
export const RACE_GROUPS = ['Nhân tộc', 'Yêu tộc', 'Ma tộc', 'Vu tộc', 'Hiên Viên tộc', 'Hình Thiên tộc', 'Cửu Lê tộc'] as const;
export const RACE_INFO: Record<string, string> = {
  'Nhân tộc': 'Sinh làm người ở Thương Lan: từ con nhà nghèo tới đích tử thế gia, thánh tử thánh địa. Các thế gia và thánh địa phải mở bằng điểm Luân Hồi.',
};
export const originRace = (o: { race?: string }) => o.race ?? 'Nhân tộc';
export interface Origin {
  id: string;
  n: string;
  loc: string;
  d: string;
  money: number;
  stat?: Partial<Record<StatKey, number>>;
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
/** Tên xuất thân theo giới tính: "{tu}" → "tử"/"nữ". */
export const originName = (o: Origin, g: 'm' | 'f') => o.n.replace('{tu}', g === 'f' ? 'nữ' : 'tử');
export const ORIGINS: Origin[] = [
  { id: 'tieuphu', n: 'Con tiều phu', loc: 'langtrang', d: 'Lớn lên ở chân núi Trúc Lâm, ngày ngày theo cha đốn củi. Ngươi từng thấy một đạo kiếm quang xé mây bay qua đỉnh núi, từ đó không quên được.', money: 4, stat: { can: 1 } },
  { id: 'chaichai', n: 'Con nhà chài', loc: 'bencat', d: 'Sinh trên thuyền, lớn trên sóng. Bến Cát nghèo, nhưng biển rộng.', money: 8, stat: { can: 1, van: 1 } },
  { id: 'hieuthuoc', n: 'Học việc hiệu thuốc', loc: 'lamthanh', d: 'Mồ côi từ nhỏ, được ông lang hiệu Bách An ở Lam Thành nhận nuôi. Biết tên trăm loại thảo dược trước khi biết chữ.', money: 20, herb: 4, craft: 'alch', stat: { ngo: 1 } },
  { id: 'tieucuc', n: 'Con nhà tiêu cục', loc: 'thietthanh', d: 'Cha là tổng tiêu đầu Uy Viễn tiêu cục ở Thiết Thành. Ngươi cầm đao từ năm sáu tuổi.', money: 40, stat: { can: 2 } },
  { id: 'dochu', n: 'Thư đồng nhà quan', loc: 'kinhdo', d: 'Hầu sách cho công tử phủ Thượng thư ở Thiên Kinh. Đọc lén sách của chủ nhiều hơn chủ đọc.', money: 15, stat: { ngo: 2 } },
  { id: 'kepphuong', n: 'Đào kép gánh hát', loc: 'vanmong', d: 'Theo gánh hát rong khắp Vân Mộng. Ngươi biết cười, biết khóc, biết nói dối không chớp mắt.', money: 25, stat: { mi: 2, van: 1 } },
  { id: 'mucdong', n: 'Mục đồng thảo nguyên', loc: 'bachlang', d: 'Chăn ngựa trên thảo nguyên Bắc Minh, quen gió tuyết và tiếng sói tru.', money: 6, stat: { can: 1, tam: 1 } },
  { id: 'lacda', n: 'Con thương đội sa mạc', loc: 'hoangsa', d: 'Sinh ra giữa đường buôn Tây Lương, đọc sao trời trước khi đọc chữ.', money: 60, stat: { van: 1 } },
  { id: 'phuthuy', n: 'Đồ đệ thầy pháp bản Man', loc: 'mangoc', d: 'Thầy pháp già ở Man Cốc dạy ngươi vẽ bùa trừ tà. Bùa của ông không linh, nhưng tay ngươi vẽ thì thỉnh thoảng phát sáng.', money: 10, craft: 'talis', stat: { tam: 1 } },
  { id: 'thorentieu', n: 'Con thợ rèn', loc: 'thietthanh', d: 'Lò rèn nhà ngươi đỏ lửa quanh năm ở Thiết Thành. Ngươi nghe tiếng sắt là biết thép tốt hay xấu.', money: 18, craft: 'forge', stat: { can: 1 } },
  { id: 'giatoc', n: 'Chi thứ Cố gia', loc: 'kinhdo', clan: 'Cố', d: 'Cố gia là gia tộc tu tiên lâu đời ở Thiên Kinh. Ngươi là con vợ lẽ, có tài nguyên nhưng cũng có quá nhiều ánh mắt soi mói.', money: 220, tech: 'thanhtam', rootBoost: true, rival: true, stat: { ngo: 1 }, karma: 30 },
  { id: 'thaitu', n: 'Hoàng tôn Đại Chu', loc: 'kinhdo', d: 'Cháu xa của hoàng đế Đại Chu. Gấm vóc lụa là, cung cấm hiểm sâu hơn bất cứ hiểm địa nào.', money: 400, rival: true, stat: { mi: 1, ngo: 1 }, karma: 60 },
  { id: 'thanhtu_tutieu', n: 'Thánh {tu} Tử Tiêu Tiên Cung', loc: 'tutieu', sect: 'tutieu', d: 'Lúc ngươi chào đời, tử lôi đánh chín tiếng trên Hư Linh Tiên Châu. Cung chủ Tử Tiêu tự tay bế ngươi về, lập làm truyền nhân của tiên cung. Thiên hạ ngưỡng vọng, và cũng có không ít kẻ muốn ngươi chết yểu.', money: 300, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { ngo: 2, tam: 1 }, karma: 160 },
  { id: 'thanhtu_huyennguyen', n: 'Thánh {tu} Huyền Nguyên Thánh Địa', loc: 'huyennguyen', sect: 'huyennguyen', d: 'Huyền Nguyên Thánh Địa suy diễn ba trăm năm mới tìm thấy ngươi trong một làng chài. Từ đó ngươi lớn lên giữa mây núi Thiên Trụ, là người kế thừa thứ chín của Huyền Nguyên Chân Kinh.', money: 300, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { ngo: 1, tam: 2 }, karma: 160 },
  { id: 'thanhtu_batchu', n: 'Thánh {tu} Bất Chu Thánh Sơn', loc: 'batchu', sect: 'batchu', d: 'Ngươi được nhặt về dưới chân núi gãy, trên người quấn tấm vải khắc cổ văn mà cả Bất Chu Thánh Sơn không ai đọc được. Thánh chủ nói đó là điềm, và phong ngươi làm thánh truyền nhân.', money: 250, rootBoost: true, rival: true, startR: 1, gearG: 2, stat: { can: 2, tam: 1 }, karma: 160 },
  { id: 'chuyenthe', n: 'Chuyển thế đại năng', loc: 'langtrang', d: 'Trong mơ thường thấy một kiếp khác: áo trắng đứng trên mây. Ký ức tiền kiếp mờ nhạt, nhưng bản năng tu luyện vẫn còn.', money: 5, tech: 'thanhtam', rootBoost: true, stat: { ngo: 3, tam: 2 }, karma: 120 },
  { id: 'cuuli', n: 'Cửu Lê tộc', loc: 'mangoc', race: 'Cửu Lê tộc', forcePerks: ['cuongchien'], d: 'Ngươi sinh trong Cửu Lê tộc, liên minh chín bộ lạc cổ nổi danh về chiến trận, luyện binh và kỹ nghệ. Cửu Lê không có tộc trưởng truyền đời: kẻ mạnh nhất tộc được tôn làm Xi Vưu, thống lĩnh cả chín bộ. Một số bộ lạc còn giữ nghi lễ cổ, nhưng Cửu Lê không đồng nhất với Vu tộc. Máu chiến trong người: tộc nhân nào cũng sinh ra đã mang Chiến cuồng.', money: 30, stat: { can: 2, tam: 1 } },
  { id: 'wu', n: 'Vu tộc', loc: 'mangoc', race: 'Vu tộc', d: 'Ngươi sinh trong Vu tộc, cổ tộc tôn kính mười hai Tổ Vu: Đế Giang, Câu Mang, Nhục Thu, Cộng Công, Chúc Dung, Thiên Ngô, Huyền Minh, Hậu Thổ, Cường Lương, Chúc Cửu Âm, Xa Bỉ Thi và Hấp Tư. Vu tộc tu luyện bằng tế tự, luyện thể và cảm ứng thiên địa.', money: 20, stat: { can: 1, tam: 1 } },
  { id: 'ma', n: 'Ma tộc', loc: 'mangoc', race: 'Ma tộc', d: 'Ngươi sinh trong Ma tộc, sinh linh có thể tu luyện ma khí và đi theo ma đạo mà không bị xem là yêu thú hóa hình.', money: 20, stat: { can: 1, ngo: 1 } },
  { id: 'xingtian', n: 'Hình Thiên tộc', loc: 'mangoc', race: 'Hình Thiên tộc', d: 'Ngươi sinh trong Hình Thiên tộc, chiến tộc cổ xem ý chí và thể phách là căn cơ, dù bại trận vẫn không khuất phục.', money: 25, stat: { can: 2 } },
  { id: 'xuanyuan', n: 'Hiên Viên tộc', loc: 'mangoc', race: 'Hiên Viên tộc', d: 'Ngươi sinh trong Hiên Viên tộc, một nhánh Nhân tộc cổ ở Hồng Hoang. Tộc nhân lấy lễ, pháp độ và con đường tu hành làm gốc.', money: 25, stat: { ngo: 1, tam: 1 } },
  { id: 'yaoshou', n: 'Yêu thú Thương Lan', loc: 'mangoc', race: 'Yêu tộc', beastOrigin: true, d: 'Ngươi đầu thai thành một yêu thú bản địa Thương Lan Giới. Loài cụ thể được chọn ngẫu nhiên trong số các loài có huyết mạch thượng cổ hoặc tiềm năng tu luyện phi thăng.', money: 5 },
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
    d: 'Đại gia tộc Trung Châu. Thời Hoang Cổ, Diệp thị từng sánh vai ba thánh địa, chín cổ đỉnh trước từ đường trấn cả một phương. Nay tổ trạch hoang phế, vài trăm tộc nhân co cụm trong một góc tường thành, cao thủ chỉ còn một vị lão tổ Hóa Thần thọ nguyên sắp cạn — và kẻ thù năm xưa vẫn chờ ngày hương hỏa nhà họ Diệp tắt hẳn.',
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
  d.d += ' Khởi đầu có truyền thừa huyết mạch: Bát Cửu Huyền Công và bí tịch chế phù thượng cổ.';
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
  d: 'Đêm ngươi ra đời, Hư Không Liệt Cốc nứt toác, một chiếc nôi gỗ Hỗn Độn rơi xuống Thương Lan. Diệp thị Hoang Cổ nhặt về nuôi; ngọc bội trong nôi cho thấy ngươi là dòng chính Diệp gia ở Hỗn Độn, gốc của mọi người mang họ Diệp. Gia chủ nhận ngươi làm con nuôi, chỉ định làm người kế thừa, định sẵn hôn ước với thánh nữ của ít nhất ba thánh địa — có khi là tất cả thánh địa và thế gia Trung Vực. Bắt đầu từ năm một tuổi: tới sáu tuổi chưa thể tu luyện, chỉ lớn lên cùng các thánh nữ. Sáu tuổi thức tỉnh linh căn; gia nhập tông môn / đại hoàng triều thì các vị hôn thê gửi thư chúc mừng; mười sáu tuổi các hôn ước được định đoạt. Mang theo Cửu Chuyển Huyền Công (Tiên giai), Bát Cửu Huyền Công, cổ phù, một thanh tiên kiếm tàn khuyết lớn theo tu vi, và bổng lộc hằng tháng của gia tộc.',
  money: 10500,
  stat: { ngo: 5, can: 5, van: 10, tam: 5 },
  karma: 300,
});
ORIGINS.sort((a, b) => a.money - b.money);

// ---------- Tên ----------
export const SURN = ['Trương', 'Vương', 'Lý', 'Triệu', 'Trần', 'Dương', 'Tống', 'Tần', 'Chu', 'Hàn', 'Ngụy', 'Tôn', 'Hà', 'Lâm', 'Tiêu', 'Giang', 'Bạch', 'Đào', 'Liễu', 'Đường', 'Cao', 'La', 'Đỗ', 'Quách', 'Phùng', 'Trịnh', 'Tào', 'Phan', 'Từ', 'Lữ', 'Lưu', 'Lương', 'Thái', 'Vệ', 'Tưởng', 'Khang', 'Đinh', 'Nhậm', 'Viên', 'Dư', 'Bách Lý', 'Âu Dương', 'Thượng Quan', 'Đông Phương', 'Nam Cung', 'Tư Mã', 'Gia Cát', 'Mộ Dung', 'Hoàng Phủ', 'Lục', 'Tạ', 'Cố', 'Thẩm', 'Tô', 'Diệp', 'Phó', 'Hứa', 'Mạnh', 'Kỷ', 'Ôn', 'Văn', 'Hoắc', 'Tiết', 'Bùi', 'Lam', 'Mục', 'Khương', 'Đoan Mộc', 'Hạ Hầu', 'Tư Đồ', 'Công Tôn', 'Lãnh', 'Nhạc', 'Sở'];
/** Tách họ và tên riêng; nhận đúng cả họ kép (Công Tôn, Đoan Mộc, Tư Đồ…). */
export function splitName(name: string): { sur: string; given: string } {
  const all = [...new Set([...SURN, ...Object.values(CLANS).map((c) => c.sur), 'Hoàng Phủ', 'Mộ Dung', ...HOLY_SURS])].sort((a, b) => b.length - a.length);
  const n = name.trim();
  const sur = all.find((x) => n.startsWith(x + ' ')) ?? n.split(' ')[0];
  return { sur, given: n.slice(sur.length).trim() };
}
/** Đổi họ của một cái tên (giữ tên riêng). Nhận đúng cả họ kép như Công Tôn, Đoan Mộc, Tư Đồ. */
export function setSurname(name: string, sur: string): string {
  const all = [...new Set([...SURN, ...Object.values(CLANS).map((c) => c.sur), 'Hoàng Phủ', 'Mộ Dung', ...HOLY_SURS])].sort((a, b) => b.length - a.length);
  const n = name.trim();
  const cur = all.find((x) => n.startsWith(x + ' '));
  const given = cur ? n.slice(cur.length + 1) : n.split(' ').slice(1).join(' ') || n;
  return `${sur} ${given}`;
}
export const MALE = ['Trường Phong', 'Thanh Huyền', 'Vân Đình', 'Dật Trần', 'Tinh Hà', 'Mặc Ngôn', 'Tử Kỳ', 'Quân Lâm', 'Hạo Nhiên', 'Tu Viễn', 'Cảnh Du', 'Thiên Hành', 'Vân Thâm', 'Tử Hiên', 'Hoài Cẩn', 'Minh Triết', 'Trường Khanh', 'Dịch An', 'Thanh Dương', 'Vân Tiêu', 'Cảnh Thần', 'Thiếu Khanh', 'Ngọc Hành', 'Thiên Hựu', 'Hạo Vũ', 'Tư Viễn', 'Nhược Trần', 'Bác Văn', 'Tĩnh Chi', 'Trọng Minh', 'Tử Khiêm', 'Vĩnh An', 'Hoài Sơn', 'Kiến Nguyên', 'Thanh Hoài', 'Vân Sinh', 'Lăng Tiêu', 'Thiên Dật', 'Huyền Chi', 'Cẩn Du', 'Vô Trần', 'Trường Sinh', 'Tử Hằng', 'Mộ Bạch', 'Cảnh Dương', 'Huyền Minh', 'Hoằng Văn', 'Đình Phong', 'Vũ Hiên', 'Văn Hiên', 'Thiên Trạch', 'Tử Du', 'Minh Châu', 'Hạo Thiên', 'Khải Phong', 'Tu Trúc', 'Ngọc Thư', 'Hoài Nam', 'Hàn Giang', 'Thiên Lãng', 'Trầm', 'Hành Chu', 'Kinh Hồng', 'Minh Viễn', 'Thừa Ân', 'Tử Mặc', 'Vô Kỵ', 'Thiên Sách', 'Dật', 'Hoài', 'Cảnh', 'Lâm Xuyên', 'Trí', 'Tranh', 'Nguyên', 'Diễn', 'Khải'];
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
export const FEM = ['Thanh Tuyết', 'Nguyệt Hoa', 'Tịch Dao', 'Tố Y', 'Khinh Vũ', 'Lộng Ảnh', 'Băng Tâm', 'Tịch Nhan', 'Uyển Nhi', 'Thiên Tuyết', 'Như Mộng', 'Vân Khê', 'Ngọc Dao', 'Mạn Thanh', 'Tử Yên', 'Như Yên', 'Mộng Dao', 'Vũ Hi', 'Sơ Ảnh', 'Khuynh Thành', 'Tuyết Kiến', 'Nhược Thủy', 'Cẩm Tú', 'An Nhiên', 'Thanh Trúc', 'Nguyệt Cầm', 'Tĩnh Xu', 'Diệu Âm', 'Lưu Ly', 'Tuyết Liên', 'Uyển Thanh', 'Ngọc Tâm', 'Bích Hà', 'Yên Chi', 'Tử Hà', 'Vân Y', 'Hạ Lan', 'Xuân Hi', 'Thu Nguyệt', 'Hàn Mai', 'Thanh Liên', 'Tố Nguyệt', 'Ngưng Hương', 'Mộc Lan', 'Ngọc Châu', 'Linh San', 'Tịch Lam', 'Vân Cẩm', 'Hàm Chương', 'Thiên Hương', 'Thanh Uyển', 'Tâm Nghi', 'Tuyết Ninh', 'Mộng Điệp', 'Khinh La', 'Nhược Lan', 'Uyển Dung', 'Tịnh Y', 'Tư Vũ', 'Nguyệt Anh', 'Thanh Ca', 'Vân Thường', 'Như Ý', 'Tố Tâm', 'Lạc Anh', 'Tịch Nguyệt', 'Uyển', 'Ngưng Sương', 'Diệu', 'Tri Âm', 'Hàm Yên', 'Linh Lung', 'Bích Dao', 'Thu Thủy', 'Mộ Tuyết', 'Nhược'];
/** Đạo hiệu nữ tu. */
export const DAO_HAO_F = ['Thanh Tuyết', 'Tố Nguyệt', 'Lăng Ba', 'Băng Tâm', 'Tử Yên', 'Ngọc Hoa', 'Lạc Hà', 'Bích Lạc', 'Hàn Mai', 'Lưu Ly', 'Thanh Liên', 'Vân Thường', 'Diệu Âm', 'Nghê Thường'];
export const DAO_HAO = ['Thanh Phong', 'Huyền Cơ', 'Tử Dương', 'Bạch Thạch', 'Cô Vân', 'Tàng Kiếm', 'Vọng Nguyệt', 'Hàn Sơn', 'Lưu Thủy', 'Thiết Tâm', 'Ngọc Hư', 'Xích Hà'];
