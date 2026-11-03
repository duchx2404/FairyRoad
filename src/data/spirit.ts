// Pháp quyết (bí thuật tiện ích, học xong là có) và Chân linh (linh thú đồng hành).
import type { El } from './core';
import { gradeLabel, registerSpecial } from './items';

// ---------- Pháp quyết ----------
export interface PhapQuyet {
  id: string;
  n: string;
  tier: number;
  pq: number;
  d: string;
  icon: 'scroll' | 'boots' | 'eye' | 'mountain' | 'person' | 'shield';
  cult?: number; // % tu luyện
  herb?: number; // hái thêm dược
  speed?: number; // % tốc độ đi đường
  flee?: number; // cộng tỉ lệ thoát thân
  hide?: number; // né yêu thú / phục kích
  atk?: number; // % công
  def?: number; // % thủ
  heal?: number; // % hồi phục thương thế
  luck?: number; // khí vận
  race?: 'human' | 'yao' | 'all'; // chủng tộc có thể học
  exclusive?: boolean; // bí tịch gia tộc / truyền thừa độc quyền
}
export const PHAPQUYET: Record<string, PhapQuyet> = {
  // ===== Pháp Quyết Yêu Tộc =====
  yeu_thithuyet: { id: 'yeu_thithuyet', n: 'Thệ Huyết Thối Thể Quyết', tier: 1, pq: 1, icon: 'shield', race: 'yao', def: 12, d: 'Bí quyết rèn luyện yêu cốt bằng cách vận chuyển huyết khí toàn thân, phòng thủ +12%.' },
  yeu_khunghoang: { id: 'yeu_khunghoang', n: 'Man Hoang Thú Uy Quyết', tier: 1, pq: 2, icon: 'scroll', race: 'yao', atk: 12, d: 'Tỏa ra uy áp của yêu thú man hoang thượng cổ, công phạt +12%.' },
  yeu_thonkhi: { id: 'yeu_thonkhi', n: 'Thôn Thệ Yêu Khí Thuật', tier: 1, pq: 1, icon: 'scroll', race: 'yao', cult: 8, d: 'Nuốt chửng thiên địa yêu khí vào đan điền bồi dưỡng yêu đan, tốc độ tu +8%.' },
  yeu_khuudoc: { id: 'yeu_khuudoc', n: 'Ngự Độc Hóa Thương Thuật', tier: 1, pq: 0, icon: 'scroll', race: 'yao', heal: 40, d: 'Bản năng dã thú tự liếm láp miệng vết thương, chữa lành thương thế nhanh hơn 40%.' },
  yeu_hacphong: { id: 'yeu_hacphong', n: 'Hắc Phong Độn Quyết', tier: 2, pq: 1, icon: 'boots', race: 'yao', speed: 35, d: 'Hóa thành làn cuồng phong đen kịt cuộn trào phi hành, tốc độ đi đường +35%.' },
  yeu_khuuthu: { id: 'yeu_khuuthu', n: 'Thiên Yêu Thú Tê Quyết', tier: 3, pq: 1, icon: 'shield', race: 'yao', def: 15, atk: 5, d: 'Lớp sừng vảy yêu thú dày cộm đao kiếm bất nhập, thủ +15%, công +5%.' },
  cophu: { id: 'cophu', n: 'Bí tịch chế phù thượng cổ', tier: 1, pq: 3, icon: 'scroll', exclusive: true, d: 'Cuốn da thú cũ của Diệp thị Hoang Cổ, chép cách vẽ phù từ thời chưa có tông môn. Phù vẽ theo bí tịch này mạnh gấp mười phù thường (kèm bí pháp chế Yêu bì phù chỉ, Linh mộc phù chỉ).' },
  tulinhquyet: { id: 'tulinhquyet', n: 'Tụ Linh Quyết', tier: 1, pq: 1, icon: 'scroll', cult: 8, d: 'Tu luyện +8%.' },
  thiennhan: { id: 'thiennhan', n: 'Thiên Nhãn Thuật', tier: 1, pq: 2, icon: 'eye', herb: 1, d: 'Nhìn thấu linh khí cỏ cây, hái dược được thêm một cây.' },
  liemtuc: { id: 'liemtuc', race: 'all', n: 'Liễm Tức Quyết', tier: 1, pq: 1, icon: 'scroll', hide: 0.3, flee: 0.1, d: 'Thu liễm khí tức: yêu thú khó phát hiện, thoát thân dễ hơn 10%.' },
  hoinguyenquyet: { id: 'hoinguyenquyet', n: 'Hồi Nguyên Quyết', tier: 1, pq: 0, icon: 'scroll', heal: 40, d: 'Vết thương mau lành hơn 40%.' },
  ngukiemquyet: { id: 'ngukiemquyet', n: 'Ngự Kiếm Quyết', tier: 2, pq: 1, icon: 'scroll', speed: 35, d: 'Ngự kiếm phi hành, đi đường nhanh hơn 35%.' },
  thodon: { id: 'thodon', race: 'all', n: 'Thổ Độn Thuật', tier: 2, pq: 2, icon: 'mountain', flee: 0.25, d: 'Độn thổ thoát khỏi trận đấu: thoát thân +25%.' },
  tambao: { id: 'tambao', race: 'all', n: 'Tầm Bảo Thuật', tier: 2, pq: 1, icon: 'eye', luck: 2, d: 'Cảm ứng bảo khí, khí vận +2.' },
  kimcang: { id: 'kimcang', n: 'Kim Cang Bất Hoại Thân', tier: 3, pq: 1, icon: 'shield', def: 15, d: 'Luyện thân như kim cang, thủ +15%.' },
  tuphongbo: { id: 'tuphongbo', race: 'all', n: 'Truy Phong Bộ', tier: 3, pq: 2, icon: 'boots', speed: 25, flee: 0.1, d: 'Thân pháp như gió: đi đường +25%, thoát thân +10%.' },
  phapthien: { id: 'phapthien', race: 'all', n: 'Pháp Thiên Tượng Địa', tier: 4, pq: 2, icon: 'person', atk: 20, d: 'Hóa thân cự nhân, công +20%.' },
  thienlythuc: { id: 'thienlythuc', race: 'all', n: 'Súc Địa Thành Thốn', tier: 5, pq: 2, icon: 'boots', speed: 80, d: 'Thu ngàn dặm vào một bước: đi đường +80%.' },
  vanphaptu: { id: 'vanphaptu', race: 'all', n: 'Vạn Pháp Quy Tông Quyết', tier: 6, pq: 3, icon: 'scroll', cult: 15, atk: 10, def: 10, d: 'Tu luyện +15%, công và thủ +10%.' },
};
export const pqGrade = (x: PhapQuyet) => gradeLabel(x.tier, x.pq);
export const pqPrice = (x: PhapQuyet) => Math.round(55 * Math.pow(4.2, x.tier - 1) * (1 + x.pq * 0.3));

// ---------- Chân linh ----------
export interface ChanLinh {
  id: string;
  n: string;
  el: El;
  ic: string; // tên biểu tượng trong ui/glyph.ts // chữ trên biểu tượng
  minR: number; // cảnh giới tối thiểu để gặp
  reg?: string[];
  d: string;
  atk?: number; // % công
  def?: number;
  hp?: number;
  cult?: number;
  luck?: number;
  flee?: number;
  /** Phẩm tọa kỵ 1..5 (Hoàng → Tiên giai): càng cao đi đường càng nhanh. */
  mount: number;
}
export const CHANLINH: Record<string, ChanLinh> = {
  hoaly: { id: 'hoaly', n: 'Hỏa Ly', el: 'hoa', ic: 'cat', minR: 1, d: 'Mèo rừng lông đỏ, đuôi cháy như ngọn đuốc. Tham ăn, nhưng trung thành.', atk: 8, luck: 1, mount: 1 },
  thanhxa: { id: 'thanhxa', n: 'Thanh Linh Xà', el: 'moc', ic: 'snake', minR: 1, reg: ['namman', 'vanmong', 'vanyeu'], d: 'Rắn xanh biết đánh hơi linh thảo.', hp: 10, cult: 3, mount: 1 },
  ngantho: { id: 'ngantho', n: 'Ngân Nguyệt Thố', el: 'quang', ic: 'rabbit', minR: 1, d: 'Thỏ trắng dưới trăng, gặp nguy chạy nhanh hơn chủ.', flee: 0.15, luck: 2, mount: 2 },
  tuyetlang: { id: 'tuyetlang', n: 'Tuyết Lang', el: 'bang', ic: 'wolf', minR: 2, reg: ['bacminh', 'cucbac', 'bachai'], d: 'Sói tuyết lạnh lùng, cắn một miếng đông cứng xương.', atk: 12, def: 5, mount: 2 },
  kimdieu: { id: 'kimdieu', n: 'Kim Sí Điêu', el: 'kim', ic: 'eagle', minR: 2, d: 'Đại bàng cánh vàng, có thể chở chủ bay qua núi.', atk: 10, flee: 0.1, mount: 3 },
  huyenquy: { id: 'huyenquy', n: 'Huyền Quy', el: 'thuy', ic: 'turtle', minR: 3, reg: ['donghai', 'namhai', 'vanmong', 'tayhai'], d: 'Rùa đen sống ngàn năm, mai cứng hơn pháp bảo.', def: 20, hp: 15, mount: 1 },
  loiung: { id: 'loiung', n: 'Lôi Ưng', el: 'loi', ic: 'hawk', minR: 3, d: 'Chim ưng mang sét, lao xuống như một tia chớp.', atk: 18, mount: 3 },
  phonglinhhoa: { id: 'phonglinhhoa', n: 'Phong Linh Hồ', el: 'phong', ic: 'fox', minR: 3, d: 'Hồ ly ba đuôi tinh ranh, giỏi mê hoặc kẻ địch.', atk: 8, flee: 0.15, luck: 2, mount: 2 },
  hacky: { id: 'hacky', n: 'Hắc Kỳ Lân', el: 'am', ic: 'qilin', minR: 5, d: 'Kỳ lân đen của bóng tối, uy áp làm yêu thú quỳ rạp.', atk: 22, def: 12, hp: 15, mount: 4 },
  chuoc: { id: 'chuoc', n: 'Chu Tước Ấu Điểu', el: 'hoa', ic: 'phoenix', minR: 6, d: 'Chim lửa con mang huyết mạch thần thú. Lửa của nó không bao giờ tắt.', atk: 30, cult: 6, luck: 3, mount: 5 },
};
// Lồng linh thú ('x:trung_<id>'): đăng ký sẵn để bảo khố, túi đồ, save cũ luôn có tên/mô tả.
for (const b of Object.values(CHANLINH)) registerSpecial({
  id: 'trung_' + b.id,
  n: `Lồng linh thú: ${b.n} (Ấu niên)`,
  d: `Phong ấn ấu thú ${b.n} mang huyết mạch linh thú. Dùng để thuần phục và ký kết khế ước làm chân linh tọa kỵ.`,
  price: Math.round((650 + b.mount * 350) * 0.4),
  use: 'Ký khế ước linh thú',
});
// ---------- Tọa kỵ: chân linh chở chủ đi đường ----------
export const MOUNT_GRADE = ['', 'Hoàng giai', 'Huyền giai', 'Địa giai', 'Thiên giai', 'Tiên giai'];
/** Hệ số nhanh hơn đi thường theo phẩm. Tiên giai: cự ly ngắn tới ngay, cự ly dài chỉ 1–3 tháng. */
export const MOUNT_SPEED = [1, 1.5, 2, 3, 5, Infinity];
/** Đi thường từ chừng này trở xuống (năm) thì tọa kỵ Tiên giai tới ngay lập tức. */
export const MOUNT_BLINK = 0.5;
export const mountEffect = (c: ChanLinh) => (c.mount >= 5 ? 'cự ly ngắn tới ngay lập tức, cự ly dài chỉ 1–3 tháng' : `đi đường nhanh gấp ${MOUNT_SPEED[c.mount]} lần`);
export const clEffect = (c: ChanLinh) => {
  const p: string[] = [];
  if (c.atk) p.push(`công +${c.atk}%`);
  if (c.def) p.push(`thủ +${c.def}%`);
  if (c.hp) p.push(`huyết +${c.hp}%`);
  if (c.cult) p.push(`tu luyện +${c.cult}%`);
  if (c.luck) p.push(`khí vận +${c.luck}`);
  if (c.flee) p.push(`thoát thân +${Math.round(c.flee * 100)}%`);
  return p.join(', ') + ', cùng chiến đấu';
};
