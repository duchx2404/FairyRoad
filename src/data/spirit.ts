// Pháp quyết (bí thuật tiện ích, học xong là có) và Chân linh (linh thú đồng hành).
import type { El } from './core';
import { gradeLabel, registerSpecial } from './items';
import type { CelestialId } from './celestial';

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
  celestial?: CelestialId;
  celestialTier?: 'low' | 'mid' | 'high';
}
export const PHAPQUYET: Record<string, PhapQuyet> = {
  // ===== Pháp Quyết Thiên Đình =====
  fq_td_nguphong: { id: 'fq_td_nguphong', n: 'Cửu Thiên Ngự Phong Thuật', tier: 2, pq: 1, icon: 'boots', speed: 40, celestial: 'thiendinh', celestialTier: 'low', d: 'Cưỡi gió tiên giới lướt mây, tốc độ đi đường +40%.' },
  fq_td_tophuc: { id: 'fq_td_tophuc', n: 'Thiên Quan Tứ Phúc Quyết', tier: 4, pq: 2, icon: 'shield', luck: 3, def: 15, celestial: 'thiendinh', celestialTier: 'high', d: 'Phúc khí tiên giới che chở, vận khí +3, thủ +15%.' },
  fq_td_sucdia: { id: 'fq_td_sucdia', n: 'Súc Địa Cửu Thiên Độn', tier: 6, pq: 3, icon: 'boots', speed: 100, flee: 0.3, celestial: 'thiendinh', celestialTier: 'high', d: 'Độn thuật một bước vượt qua chín tầng trời, tốc độ đi đường +100%, thoát thân +30%.' },

  // ===== Pháp Quyết Địa Phủ =====
  fq_dp_vonganh: { id: 'fq_dp_vonganh', n: 'Hoàng Tuyền Vong Ảnh Bộ', tier: 2, pq: 1, icon: 'boots', speed: 35, flee: 0.2, celestial: 'diaphu', celestialTier: 'low', d: 'Thân pháp chập chờn như ma trôi trên đường Hoàng Tuyền, đi đường +35%, thoát thân +20%.' },
  fq_dp_amduongnhan: { id: 'fq_dp_amduongnhan', n: 'Âm Dương Thấu Thị Nhãn', tier: 4, pq: 2, icon: 'eye', herb: 2, luck: 2, celestial: 'diaphu', celestialTier: 'high', d: 'Nhìn thấu âm dương ngũ hành, hái thêm 2 linh thảo, khí vận +2.' },
  fq_dp_hoaanh: { id: 'fq_dp_hoaanh', n: 'Cửu U Hóa Ảnh Bất Tử Thân', tier: 6, pq: 3, icon: 'shield', def: 20, heal: 80, celestial: 'diaphu', celestialTier: 'high', d: 'Thân thể hòa vào u minh, phòng thủ +20%, hồi phục thương tổn nhanh hơn 80%.' },

  // ===== Pháp Quyết Yêu Giới =====
  fq_yg_dondia: { id: 'fq_yg_dondia', n: 'Bách Thú Độn Địa Thuật', tier: 2, pq: 1, icon: 'mountain', speed: 35, flee: 0.2, race: 'yao', celestial: 'yeugioi', celestialTier: 'low', d: 'Lủi trốn nhanh như thú rừng, đi đường +35%, thoát thân +20%.' },
  fq_yg_candauvan: { id: 'fq_yg_candauvan', n: 'Cân Đẩu Vân Phi Hành Thuật', tier: 5, pq: 2, icon: 'boots', speed: 90, flee: 0.25, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', d: 'Một cái lộn nhào mười vạn tám ngàn dặm, đi đường +90%, thoát thân +25%.' },
  fq_yg_thonthien: { id: 'fq_yg_thonthien', n: 'Thiên Yêu Thôn Thiên Khí', tier: 6, pq: 3, icon: 'person', atk: 25, def: 15, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', d: 'Nuốt chửng linh khí thiên địa vào cơ thể, công +25%, thủ +15%.' },

  // ===== Pháp Quyết Linh Sơn =====
  fq_ls_lienhoa: { id: 'fq_ls_lienhoa', n: 'Liên Hoa Bộ Pháp', tier: 2, pq: 1, icon: 'boots', speed: 35, heal: 30, celestial: 'linhson', celestialTier: 'low', d: 'Mỗi bước chân nở ra hoa sen, đi đường +35%, hồi phục vết thương +30%.' },
  fq_ls_kimthan: { id: 'fq_ls_kimthan', n: 'Trượng Lục Kim Thân Quyết', tier: 5, pq: 2, icon: 'shield', def: 25, heal: 60, celestial: 'linhson', celestialTier: 'high', d: 'Hóa hiện kim thân mười sáu trượng, thủ +25%, hồi phục vết thương +60%.' },
  fq_ls_thantuc: { id: 'fq_ls_thantuc', n: 'Lục Thông Thần Túc Quyết', tier: 6, pq: 3, icon: 'boots', speed: 95, flee: 0.3, celestial: 'linhson', celestialTier: 'high', d: 'Phật môn thần túc thông, đi đường +95%, thoát thân +30%.' },

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
  /** Phẩm tọa kỵ 1..5 (Hoàng → Tiên giai): càng cao đi đường càng nhanh. Nếu bỏ trống: không phải thú cưỡi, chỉ là linh sủng chiến đấu. */
  mount?: number;
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
  kimo: { id: 'kimo', n: 'Tam Túc Kim Ô', el: 'hoa', ic: 'phoenix', minR: 6, d: 'Thần thú Thái Dương ba chân viễn cổ, toàn thân bốc cháy Thái Dương Chân Hỏa, tốc độ lướt mây nghìn dặm.', atk: 35, cult: 8, luck: 4, mount: 5 },
  ngoctho: { id: 'ngoctho', n: 'Thái Âm Ngọc Thố', el: 'quang', ic: 'rabbit', minR: 5, d: 'Thần thú Thái Âm Cung Trăng, tinh thông giã thuốc trường sinh, tốc độ lướt trăng vô ảnh.', flee: 0.25, luck: 5, cult: 6, mount: 4 },
  // Hỗn Thế Tứ Hầu (Tây Du Ký - Linh trưởng hai chân, chiến sủng hộ pháp, KHÔNG PHẢI THÚ CƯỠI)
  linhminhhau: { id: 'linhminhhau', n: 'Linh Minh Thạch Hầu', el: 'kim', ic: 'paw', minR: 6, d: 'Thông biến hóa, thức thiên thời, tri địa lợi, di tinh hoán đẩu. Thần hầu chiến đấu dũng mãnh (Linh sủng hộ pháp).', atk: 45, def: 25, luck: 6 },
  xichkhaomahau: { id: 'xichkhaomahau', n: 'Xích Khào Mã Hầu', el: 'thuy', ic: 'paw', minR: 5, d: 'Hiểu âm dương, hội nhân sự, thiện xuất nhập, tị tử duyên sinh. Thần hầu thông thủy tính sông Hoài (Linh sủng hộ pháp).', hp: 35, flee: 0.3, luck: 5 },
  thongtivien: { id: 'thongtivien', n: 'Thông Tí Viên Hầu', el: 'moc', ic: 'paw', minR: 5, d: 'Nã nhật nguyệt, súc thiên sơn, biện hưu cửu, càn khôn ma lộng. Thần vượn Mai Sơn vung côn trợ chiến (Linh sủng hộ pháp).', atk: 40, hp: 30 },
  lucnhimihau: { id: 'lucnhimihau', n: 'Lục Nhĩ Mĩ Hầu', el: 'am', ic: 'paw', minR: 5, d: 'Thiện thính âm, năng sát lý, tri tiền hậu, vạn vật giai minh. Sáu tai lắng nghe vạn dặm càn khôn (Linh sủng hộ pháp).', cult: 15, flee: 0.35, luck: 5 },
  // Hắc Hùng & Bạch Cốt (Gấu 4 chân cưỡi được; Bạch Cốt hai chân là linh sủng chiến đấu)
  hachung: { id: 'hachung', n: 'Hắc Phong Ma Hùng', el: 'tho', ic: 'paw', minR: 4, d: 'Gấu đen Hắc Phong Lĩnh 4 chân lực lưỡng, mình đồng da sắt, chở chủ vượt núi như đi trên đất bằng.', def: 25, hp: 25, mount: 3 },
  bachcot: { id: 'bachcot', n: 'Bạch Cốt Linh Ma', el: 'am', ic: 'demon', minR: 4, d: 'Xương trắng ngàn năm hóa hình, ba lần biến hóa khôn lường, ma quỷ hộ thể bất tử giữa âm phong (Linh sủng trợ chiến).', atk: 30, flee: 0.3 },
  // Các loài Yêu Quái Tây Du Ký (Thú cưỡi 4 chân hoặc bay lượn hoặc ngư rồng)
  kimsidieubang: { id: 'kimsidieubang', n: 'Kim Sí Điêu Bằng', el: 'kim', ic: 'eagle', minR: 6, d: 'Đại bằng sải cánh chín vạn dặm, chở chủ vượt cửu trùng thiên chỉ trong một cái chớp mắt.', atk: 35, flee: 0.3, mount: 5 },
  thanhnguu: { id: 'thanhnguu', n: 'Độc Giác Thanh Ngưu', el: 'kim', ic: 'paw', minR: 5, d: 'Trâu thần sừng vàng 4 chân vững như bàn thạch, Thái Thượng Lão Quân thường cưỡi dạo chơi thiên hà.', def: 30, hp: 25, mount: 4 },
  cuulinhsu: { id: 'cuulinhsu', n: 'Cửu Linh Sư Tử', el: 'loi', ic: 'paw', minR: 5, d: 'Sư tử chín đầu 4 chân chúa tể sơn lâm, tiếng hống rền vang, chở chủ đi mây về gió.', atk: 28, def: 18, mount: 5 },
  bachngatuong: { id: 'bachngatuong', n: 'Lục Nha Bạch Tượng', el: 'tho', ic: 'paw', minR: 5, d: 'Voi trắng sáu ngà 4 chân uy nghi trầm ổn, lực bạt sơn hà, chở chủ băng qua muôn trùng hiểm trở.', hp: 35, def: 25, mount: 4 },
  tichtelam: { id: 'tichtelam', n: 'Tịch Hàn Tam Đầu Tê', el: 'bang', ic: 'paw', minR: 4, d: 'Tê ngưu ba sừng 4 chân da dày như băng giá ngàn năm, chở chủ đạp tuyết lướt băng.', def: 28, hp: 20, mount: 3 },
  ngaiviephoabao: { id: 'ngaiviephoabao', n: 'Ngải Diệp Hoa Báo', el: 'phong', ic: 'cat', minR: 3, d: 'Báo hoa 4 chân chạy nhanh như gió thoắt ẩn thoắt hiện giữa sương mù.', atk: 18, flee: 0.25, mount: 3 },
  bachlocthanthu: { id: 'bachlocthanthu', n: 'Bích Khâu Bạch Lộc', el: 'moc', ic: 'paw', minR: 4, d: 'Hươu trắng 4 chân gạc ngọc trường thọ, chở chủ thong thả tiêu dao tam giới.', cult: 10, luck: 5, mount: 3 },
  bichbacuudau: { id: 'bichbacuudau', n: 'Bích Ba Cửu Đầu Điểu', el: 'thuy', ic: 'eagle', minR: 5, d: 'Chim nước chín đầu sải cánh lớn bay lượn trên muôn trùng sóng cả.', atk: 26, cult: 8, mount: 4 },
  // Ngư yêu và Rồng (Thủy tộc cưỡi sóng vượt biển)
  ngaclong: { id: 'ngaclong', n: 'Hắc Thủy Cự Ngạc', el: 'thuy', ic: 'snake', minR: 4, d: 'Ngư yêu cá sấu khổng lồ Hắc Thủy Hà, lưng bọc lân giáp rộng như thuyền rồng, cưỡi sóng rẽ nước.', def: 25, hp: 20, mount: 4 },
  thanhgiao: { id: 'thanhgiao', n: 'Thanh Hải Thần Long', el: 'thuy', ic: 'qilin', minR: 6, d: 'Chân Long viễn cổ thân dài vạn trượng, chở chủ cưỡi mây đạp sóng tung hoành tứ hải.', atk: 35, def: 25, mount: 5 },
  // Côn trùng / chuột nhỏ (Linh sủng chiến đấu, không phải thú cưỡi)
  bantychu: { id: 'bantychu', n: 'Bàn Ty Thất Sắc Chu', el: 'am', ic: 'demon', minR: 3, d: 'Nhện tinh Bàn Ty Động, nhả tơ bảy màu dệt thiên la địa võng độc sát sinh linh (Chiến sủng hộ pháp).', flee: 0.25, def: 20 },
  bachnhanngocong: { id: 'bachnhanngocong', n: 'Bách Nhãn Ngô Công', el: 'quang', ic: 'demon', minR: 4, d: 'Rết độc ngàn mắt dưới sườn phóng hoàng quang thiêu đốt hồn phách (Chiến sủng hộ pháp).', atk: 30, def: 20 },
  tybadochac: { id: 'tybadochac', n: 'Tỳ Bà Độc Hạt', el: 'hoa', ic: 'demon', minR: 4, d: 'Bọ cạp độc đuôi châm Đảo Mã chích thủng kim thân bất hoại (Chiến sủng hộ pháp).', atk: 35, flee: 0.2 },
  hoangphongdieuthu: { id: 'hoangphongdieuthu', n: 'Hoàng Phong Điêu Thử', el: 'phong', ic: 'paw', minR: 3, d: 'Chuột gió vàng thổi Tam Muội Thần Phong mù trời mù đất (Chiến sủng hộ pháp).', flee: 0.3, luck: 4 },
};
// Lồng linh thú ('x:trung_<id>'): đăng ký sẵn để bảo khố, túi đồ, save cũ luôn có tên/mô tả.
for (const b of Object.values(CHANLINH)) registerSpecial({
  id: 'trung_' + b.id,
  n: b.mount ? `Lồng linh thú: ${b.n} (Ấu niên)` : `Khế ước linh sủng: ${b.n}`,
  d: b.mount
    ? `Phong ấn ấu thú ${b.n} mang huyết mạch linh thú. Dùng để thuần phục và ký kết khế ước làm chân linh tọa kỵ (thú cưỡi).`
    : `Khế ước linh hồn với ${b.n}. Dùng để triệu hoán làm chiến sủng hộ pháp cùng tham gia chiến đấu (không phải thú cưỡi).`,
  price: Math.round((650 + (b.mount || 1) * 350) * 0.4),
  use: b.mount ? 'Ký khế ước thú cưỡi' : 'Ký khế ước chiến sủng',
});
// ---------- Tọa kỵ: chân linh chở chủ đi đường ----------
export const MOUNT_GRADE = ['', 'Hoàng giai', 'Huyền giai', 'Địa giai', 'Thiên giai', 'Tiên giai'];
/** Hệ số nhanh hơn đi thường theo phẩm. Tiên giai: cự ly ngắn tới ngay, cự ly dài chỉ 1–3 tháng. */
export const MOUNT_SPEED = [1, 1.5, 2, 3, 5, Infinity];
/** Đi thường từ chừng này trở xuống (năm) thì tọa kỵ Tiên giai tới ngay lập tức. */
export const MOUNT_BLINK = 0.5;
export const mountEffect = (c: ChanLinh) => ((c.mount ?? 0) >= 5 ? 'cự ly ngắn tới ngay lập tức, cự ly dài chỉ 1–3 tháng' : c.mount ? `đi đường nhanh gấp ${MOUNT_SPEED[c.mount]} lần` : 'linh sủng trợ chiến, không thể cưỡi');
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
