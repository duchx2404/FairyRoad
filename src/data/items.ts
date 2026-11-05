// Công pháp, thuật pháp, đan dược, linh thảo, vật liệu, phù lục, trang bị.
import { TREASURE_TIERS, ART_TIERS, localTreasureGrade, worldArtCap, growArtGrade, growTreasureGrade } from './treasure-grades';
import { REALMS, EL, worldMult, type El } from './core';
import { pick, ri, rf, ch } from '../core/util';
import type { CelestialId } from './celestial';

// ---------- Giai & phẩm ----------
// Sáu giai: Hoàng, Huyền, Địa, Thiên, Thần, Tiên; mỗi giai bốn phẩm Hạ/Trung/Thượng/Cực.
// Phàm phẩm (giai 0) chỉ có ở đan dược và pháp khí.
export const TIER_N = [...TREASURE_TIERS];
export const TIER_C = ['#7a6e60', '#8a7650', '#35627e', '#6a4f98', '#a8862f', '#b0392b', '#b8558f', '#ad792c', '#b75c2a', '#8b57b8', '#ba7440', '#8053a7', '#d19638'];
export const PHAM = ['Hạ phẩm', 'Trung phẩm', 'Thượng phẩm', 'Cực phẩm'];
export const MAX_GIAI = TREASURE_TIERS.length - 1;
/** "Hoàng giai hạ phẩm" · "Phàm phẩm". */
export const gradeLabel = (giai: number, pq = 0) => (giai <= 0 ? 'Phàm phẩm' : `${TIER_N[Math.min(MAX_GIAI, giai)]} ${PHAM[Math.max(0, Math.min(3, pq))].toLowerCase()}`);
export const artGradeLabel = (g: number, q = 0) => g <= 6 ? gradeLabel(g, q) : `${ART_TIERS[Math.min(g, ART_TIERS.length - 1)]} ${PHAM[Math.max(0, Math.min(3, q))].toLowerCase()}`;
/** Hệ số hiệu lực theo phẩm trong cùng một giai. */
export const PQ_MULT = [0.88, 1, 1.15, 1.35];

// ---------- Công pháp ----------
export interface Tech {
  id: string;
  n: string;
  el: El[]; // rỗng = vô thuộc tính, hợp mọi linh căn ở mức trung bình
  tier: number; // giai 1..6
  pq?: number; // phẩm 0..3
  d: string;
  skills: string[];
  evil?: boolean;
  pw?: number; // nhân sức mạnh thêm
  def?: number;
  hp?: number;
  blood?: string; // công pháp huyết mạch: chỉ người mang huyết mạch này tu được, không rơi, không bán
  race?: 'human' | 'yao' | 'all'; // chủng tộc có thể tu luyện
  grow?: boolean; // phẩm trưởng thành theo người dùng: luôn bằng trần phẩm của giới đang ở (Hỗn Nguyên Kinh)
  celestial?: CelestialId;
  celestialTier?: 'low' | 'mid' | 'high';
}
export const TECHS: Record<string, Tech> = {
  // ===== Công pháp Yêu Tộc =====
  bachthutoithe: { id: 'bachthutoithe', n: 'Bách Thú Tôi Thể Quyết', el: [], tier: 1, race: 'yao', skills: ['yeu_cuongthu', 'yeu_thuphach'], hp: 1.15, def: 1.12, d: 'Lấy huyết khí của trăm loài yêu thú tôi rèn thể phách, da dày thịt béo.' },
  manhoangluyencot: { id: 'manhoangluyencot', n: 'Man Hoang Luyện Cốt Kinh', el: [], tier: 2, race: 'yao', skills: ['yeu_cuongthu', 'yeu_diaham'], hp: 1.2, def: 1.18, pw: 1.08, d: 'Hấp thụ khí man hoang viễn cổ, rèn xương cứng như huyền thiết.' },
  thietgiapyeubao: { id: 'thietgiapyeubao', n: 'Thiết Giáp Yêu Quyết', el: ['kim'], tier: 1, race: 'yao', skills: ['yeu_lietthach'], def: 1.15, d: 'Luyện yêu khí thành lớp giáp sắt bao bọc nhục thân, móng vuốt sắc bén.' },
  kimgiacyeukinh: { id: 'kimgiacyeukinh', n: 'Kim Giác Cự Thú Kinh', el: ['kim'], tier: 2, race: 'yao', skills: ['yeu_bachkimtrao'], def: 1.15, pw: 1.12, d: 'Công pháp của loài Kim Giác thú, ngưng tụ kim sát vào sừng nhọn và móng vuốt.' },
  bachhothankim: { id: 'bachhothankim', n: 'Bạch Hổ Canh Kim Điển', el: ['kim'], tier: 3, race: 'yao', skills: ['yeu_bachhocanhkim'], pw: 1.22, d: 'Thượng cổ Bạch Hổ truyền thừa bí điển, sát khí Canh Kim xé rách vạn vật.' },
  xichkimthanvien: { id: 'xichkimthanvien', n: 'Xích Kim Thần Viên Kinh', el: ['kim', 'hoa'], tier: 4, race: 'yao', skills: ['yeu_bachhokhong', 'yeu_bachhocanhkim'], hp: 1.2, def: 1.15, pw: 1.25, d: 'Bí điển Thông Thiên Thần Viên, nhục thân kim cương bất hoại, lực bạt sơn hề.' },
  thanhmanthonmoc: { id: 'thanhmanthonmoc', n: 'Thanh Mãng Thôn Mộc Quyết', el: ['moc'], tier: 1, race: 'yao', skills: ['yeu_manhtoc'], hp: 1.12, d: 'Nuốt sinh cơ mộc linh trong rừng sâu để tôi luyện yêu đan, sinh mệnh dồi dào.' },
  vanthumocyen: { id: 'vanthumocyen', n: 'Vạn Thụ Mộc Yêu Kinh', el: ['moc'], tier: 2, race: 'yao', skills: ['yeu_vanmoc', 'yeu_chucdoc'], hp: 1.2, def: 1.1, d: 'Hấp thụ linh khí ngàn năm thảo mộc, vết thương tự động khép miệng cực nhanh.' },
  thienthuhoalinh: { id: 'thienthuhoalinh', n: 'Thiên Thụ Hóa Linh Điển', el: ['moc'], tier: 3, race: 'yao', skills: ['yeu_thanhlinhhoang', 'yeu_vanmoc'], hp: 1.3, d: 'Khai mở linh trí mộc tộc, sinh cơ dồi dào tựa biển sâu, trường thọ bất lão.' },
  cuudiepyeuthan: { id: 'cuudiepyeuthan', n: 'Cửu Diệp Yêu Thần Kinh', el: ['moc', 'thuy'], tier: 4, race: 'yao', skills: ['yeu_thanhlinhhoang', 'yeu_vanmoc'], hp: 1.35, def: 1.18, d: 'Thượng cổ thần thảo đắc đạo thành yêu, chín lá chém đứt tinh thần, sinh cơ vô tận.' },
  giaolongphucthuy: { id: 'giaolongphucthuy', n: 'Giao Long Phục Thủy Quyết', el: ['thuy'], tier: 1, race: 'yao', skills: ['yeu_thuylang'], hp: 1.1, d: 'Học theo Giao Long điều khiển dòng nước, yêu lực cuồn cuộn liên miên bất tuyệt.' },
  uhaixuankinh: { id: 'uhaixuankinh', n: 'U Hải Huyền Xà Kinh', el: ['thuy'], tier: 2, race: 'yao', skills: ['yeu_uhaichao', 'yeu_haithanhoang'], hp: 1.18, def: 1.1, d: 'Ẩn mình đáy biển sâu lạnh giá, yêu lực nhu hòa mà hiểm độc khôn lường.' },
  bacminhkinhba: { id: 'bacminhkinhba', n: 'Bắc Minh Kình Ba Điển', el: ['thuy'], tier: 3, race: 'yao', skills: ['yeu_giaolongbaivi', 'yeu_uhaichao'], hp: 1.25, pw: 1.15, d: 'Kình ngư Bắc Minh quẫy đuôi dâng ngập trời sóng gió, chân nguyên hùng hậu vô song.' },
  chanlonghoathan: { id: 'chanlonghoathan', n: 'Chân Long Hóa Thần Kinh', el: ['thuy', 'loi'], tier: 4, race: 'yao', skills: ['yeu_chanlongphan', 'yeu_giaolongbaivi'], hp: 1.3, def: 1.2, pw: 1.25, d: 'Long tộc chí cao công pháp, lột xác thành Chân Long đằng vân giá vũ, thống trị muôn loài.' },
  xichdiemhoadieu: { id: 'xichdiemhoadieu', n: 'Xích Diễm Hỏa Điểu Quyết', el: ['hoa'], tier: 1, race: 'yao', skills: ['yeu_hoatuc'], pw: 1.08, d: 'Loài chim lửa thổ nạp thái dương hỏa khí, yêu hỏa thiêu đốt đối thủ.' },
  liethoathanchu: { id: 'liethoathanchu', n: 'Liệt Hỏa Thần Chu Kinh', el: ['hoa'], tier: 2, race: 'yao', skills: ['yeu_lietdiem', 'yeu_mahoa'], pw: 1.16, d: 'Hỏa nhện phun tơ lửa rực cháy, yêu hỏa hung bạo thiêu rụi kinh mạch.' },
  chutuothanhoa: { id: 'chutuothanhoa', n: 'Chu Tước Thần Hỏa Điển', el: ['hoa'], tier: 3, race: 'yao', skills: ['yeu_chutuocviem', 'yeu_lietdiem'], hp: 1.1, pw: 1.25, d: 'Nam Phương Chu Tước truyền thừa thánh điển, thần hỏa bất diệt đốt cháy càn khôn.' },
  nietbankimo: { id: 'nietbankimo', n: 'Niết Bàn Kim Ô Kinh', el: ['hoa', 'quang'], tier: 4, race: 'yao', skills: ['yeu_nietbanhoa', 'yeu_chutuocviem'], hp: 1.25, pw: 1.3, d: 'Thái Dương Kim Ô thượng cổ bí pháp, tắm trong lửa thần niết bàn tái sinh.' },
  hauthuhungvuong: { id: 'hauthuhungvuong', n: 'Hậu Thổ Hùng Vương Quyết', el: ['tho'], tier: 1, race: 'yao', skills: ['yeu_thuphach'], hp: 1.1, def: 1.2, d: 'Thổ hùng vững chãi đứng trên mặt đất, tiếp nhận thổ địa yêu lực phòng thủ vô song.' },
  trongsoncutuong: { id: 'trongsoncutuong', n: 'Trọng Sơn Cự Tượng Kinh', el: ['tho'], tier: 2, race: 'yao', skills: ['yeu_diaham'], hp: 1.18, def: 1.22, d: 'Cự tượng giẫm nát núi non, khí huyết nồng đậm trầm ổn như núi cao.' },
  huyenquyhoangtho: { id: 'huyenquyhoangtho', n: 'Huyền Quy Thác Thiên Điển', el: ['tho', 'thuy'], tier: 3, race: 'yao', skills: ['yeu_huyenquygiap'], hp: 1.25, def: 1.35, d: 'Bắc Hải Huyền Quy đỡ trời chống đất, mai rùa bất hoại cản phá vạn kiếp công kích.' },
  hoanglongkinh: { id: 'hoanglongkinh', n: 'Hoàng Long Hậu Thổ Kinh', el: ['tho'], tier: 4, race: 'yao', skills: ['yeu_hoanglongchan', 'yeu_huyenquygiap'], hp: 1.3, def: 1.3, pw: 1.15, d: 'Hoàng Long trấn giữ trung ương đại địa, long uy bàng bạc dồi dào sinh cơ.' },
  hanbangbachlang: { id: 'hanbangbachlang', n: 'Hàn Băng Bạch Lang Quyết', el: ['bang'], tier: 1, race: 'yao', skills: ['yeu_bangnha'], def: 1.08, pw: 1.06, d: 'Bạch lang miền tuyết lạnh, hơi thở ngưng sương, nanh vuốt giá buốt.' },
  bangphachtuyetho: { id: 'bangphachtuyetho', n: 'Băng Phách Tuyết Hồ Kinh', el: ['bang'], tier: 2, race: 'yao', skills: ['yeu_huyenbangphun'], hp: 1.12, pw: 1.12, d: 'Tuyết Hồ cửu vĩ chi thứ, ngưng băng phách vào yêu đan, thân hình uyển chuyển thoắt ẩn thoắt hiện.' },
  huyenbangthangiao: { id: 'huyenbangthangiao', n: 'Huyền Băng Thần Giao Điển', el: ['bang', 'thuy'], tier: 3, race: 'yao', skills: ['yeu_banglongtuc'], hp: 1.15, def: 1.15, pw: 1.2, d: 'Băng Giao ngàn năm ngưng hàn khí cực độ, đông cứng huyết mạch kẻ thù.' },
  cuchanbanglong: { id: 'cuchanbanglong', n: 'Cực Hàn Băng Long Kinh', el: ['bang'], tier: 4, race: 'yao', skills: ['yeu_cuchanbangvuc', 'yeu_banglongtuc'], hp: 1.2, def: 1.25, pw: 1.25, d: 'Băng Long viễn cổ phun tuyết lạnh thấu cửu u, đóng băng hư không.' },
  loibaotrucquyet: { id: 'loibaotrucquyet', n: 'Lôi Báo Trục Điện Quyết', el: ['loi'], tier: 1, race: 'yao', skills: ['yeu_loibao'], pw: 1.1, d: 'Báo sấm săn mồi giữa mưa giông, yêu lực chuyển hóa thành tia chớp chớp nhoáng.' },
  cuuthienloibang: { id: 'cuuthienloibang', n: 'Cửu Thiên Lôi Bằng Kinh', el: ['loi', 'phong'], tier: 2, race: 'yao', skills: ['yeu_kinhloibao'], pw: 1.18, d: 'Lôi Bằng vỗ cánh cuốn theo sấm chớp cuồng phong, chấn động kinh mạch.' },
  loigiaokhiulong: { id: 'loigiaokhiulong', n: 'Lôi Giao Khiêu Long Điển', el: ['loi'], tier: 3, race: 'yao', skills: ['yeu_cuuthienloi'], pw: 1.26, d: 'Lôi Giao tắm mình trong thiên kiếp lôi đình, mượn sấm sét rèn luyện lôi đan.' },
  tuloithanlong: { id: 'tuloithanlong', n: 'Tử Lôi Thần Long Kinh', el: ['loi'], tier: 4, race: 'yao', skills: ['yeu_tuloigiang', 'yeu_cuuthienloi'], def: 1.1, pw: 1.35, d: 'Thượng cổ Tử Lôi Long Kinh, hô phong hoán lôi, hủy diệt vạn vật.' },
  thanhungnguphong: { id: 'thanhungnguphong', n: 'Thanh Ưng Ngự Phong Quyết', el: ['phong'], tier: 1, race: 'yao', skills: ['yeu_phongvuc'], pw: 1.05, d: 'Chim ưng bay lượn nương theo chiều gió, xé gió phi hành chém địch.' },
  tatphongliepbao: { id: 'tatphongliepbao', n: 'Tật Phong Liệp Báo Kinh', el: ['phong'], tier: 2, race: 'yao', skills: ['yeu_phongtrao', 'yeu_thanquang'], pw: 1.15, d: 'Báo gió săn mồi với tốc độ kinh người, vuốt phong xé rách phòng hộ.' },
  kimsidaibang: { id: 'kimsidaibang', n: 'Kim Sí Đại Bằng Điển', el: ['phong', 'kim'], tier: 3, race: 'yao', skills: ['yeu_kimsitram', 'yeu_phongtrao'], pw: 1.25, d: 'Đại Bằng kim sí vỗ cánh chín vạn dặm, cuồng phong trảm kích đoạn sơn ngăn sông.' },
  cuuthienphongbang: { id: 'cuuthienphongbang', n: 'Cửu Thiên Cuồng Bằng Kinh', el: ['phong'], tier: 4, race: 'yao', skills: ['yeu_conbangphahai', 'yeu_kimsitram'], def: 1.15, pw: 1.3, d: 'Thần điểu rẽ mây đạp gió thượng tầng thiên, thân hóa gió lốc cuồng bạo.' },
  uamxaanh: { id: 'uamxaanh', n: 'U Minh Xà Ảnh Quyết', el: ['am'], tier: 1, race: 'yao', skills: ['yeu_uamkich'], pw: 1.08, d: 'Loài rắn độc rình rập trong bóng tối, yêu khí âm u lạnh lẽo.' },
  damaducbuc: { id: 'damaducbuc', n: 'Dạ Ma Dực Bức Kinh', el: ['am'], tier: 2, race: 'yao', skills: ['yeu_hacvu', 'yeu_thientho'], hp: 1.12, pw: 1.14, d: 'Dơi quỷ bay lượn trong đêm hút tinh huyết, hóa thành bóng đêm phục kích.' },
  cuuumayeu: { id: 'cuuumayeu', n: 'Cửu U Ma Yêu Điển', el: ['am'], tier: 3, race: 'yao', skills: ['yeu_cuuumathu', 'yeu_hacvu'], hp: 1.15, pw: 1.24, d: 'Ma thú chín tầng địa u tụ hội âm sát, gặm nhấm ăn mòn thần hồn đối phương.' },
  thontienhaclong: { id: 'thontienhaclong', n: 'Thôn Thiên Hắc Long Kinh', el: ['am'], tier: 4, race: 'yao', skills: ['yeu_cuuumathu', 'yeu_thientho'], hp: 1.25, pw: 1.3, d: 'Hắc Long thượng cổ nuốt chửng bóng tối và càn khôn, khí tức âm tà bá đạo.' },
  kimquangthanloc: { id: 'kimquangthanloc', n: 'Kim Quang Thần Lộc Quyết', el: ['quang'], tier: 1, race: 'yao', skills: ['yeu_quanghoa'], hp: 1.12, d: 'Hươu sao tắm ánh hào quang, thanh lọc yêu khí trở nên thuần khiết tường hòa.' },
  dieuquangbachho: { id: 'dieuquangbachho', n: 'Diệu Quang Thần Hạc Kinh', el: ['quang'], tier: 2, race: 'yao', skills: ['yeu_quanghoa', 'yeu_sinhco'], hp: 1.18, pw: 1.1, d: 'Hạc tiên nghênh đón bình minh, hào quang chiếu sáng xua tan ma chướng.' },
  thaiduongthandieu: { id: 'thaiduongthandieu', n: 'Thái Dương Thần Điểu Điển', el: ['quang', 'hoa'], tier: 3, race: 'yao', skills: ['yeu_chutuocviem', 'yeu_quanghoa'], hp: 1.15, pw: 1.25, d: 'Thần điểu mang ánh thái dương rực rỡ, chiếu rọi vạn vật, uy áp rực sáng.' },
  quangminhlongthan: { id: 'quangminhlongthan', n: 'Quang Minh Long Thần Kinh', el: ['quang'], tier: 4, race: 'yao', skills: ['yeu_chanlongphan', 'yeu_quanghoa'], hp: 1.25, def: 1.15, pw: 1.3, d: 'Quang Minh Cự Long chí thánh, vảy rồng sáng như vầng thái dương, vạn tà quy phục.' },
  honnguyenkinh: { id: 'honnguyenkinh', race: 'all', n: 'Hỗn Nguyên Kinh', el: ['hondon'], get tier() { return growArtGrade().tier; }, get pq() { return growArtGrade().pq; }, blood: 'diep_hondon', grow: true, skills: ['honnguyenkhaithien', 'honnguyenphaptuong', 'vankiemquytong'], pw: 1.35, hp: 1.45, def: 1.3, d: 'Công pháp trấn tộc chí cao của Diệp gia Hỗn Độn, vạn đạo quy nguyên. Bắt đầu từ phẩm thấp nhất rồi trưởng thành theo người dùng, bị giới hạn phẩm theo trần của giới đang ở; khi về tới Hỗn Độn giới sẽ không còn giới hạn trần.' },
  cuuchuyen: { id: 'cuuchuyen', n: 'Cửu Chuyển Huyền Công', el: [], tier: 6, blood: 'diep_hondon', skills: ['cuuchuyenphathien', 'cuuchuyenkimthan', 'tichhuyettrungsinh', 'phapthientuongdia'], pw: 1.3, hp: 1.4, def: 1.25, d: 'Công pháp trấn tộc của Diệp gia Hỗn Độn. Chín lần chuyển hóa nhục thân: mỗi lần chuyển là thay máu đổi xương, tới chuyển thứ chín thì nhỏ máu tái sinh, vạn kiếp bất diệt. Chỉ dòng chính Diệp gia Hỗn Độn mới khai mở được.' },
  batcuu: { id: 'batcuu', n: 'Bát Cửu Huyền Công', el: [], tier: 5, blood: 'diep', skills: ['phapthientuongdia', 'thatthapnhibien'], pw: 1.15, hp: 1.2, def: 1.1, d: 'Công pháp huyết mạch của Diệp thị Hoang Cổ. Tu tới đại thành có bảy mươi hai phép biến hóa, nhục thân luyện tới bất hoại, pháp thiên tượng địa. Không mang máu họ Diệp thì đọc cũng không hiểu nổi một chữ.' },
  // --- Công pháp Yêu tộc ---
  thonnguyetquyet: { id: 'thonnguyetquyet', n: 'Thôn Nguyệt Thổ Nạp Quyết', el: [], tier: 1, skills: ['yeu_hoangao'], hp: 1.15, def: 1.1, d: 'Pháp môn thổ nạp bản năng của Yêu tộc: ngẩng đầu nuốt ánh trăng, hấp thụ tinh hoa nhật nguyệt và thiên địa linh khí để ngưng tụ yêu đan, tôi rèn yêu cốt nhục thân.' },
  thienyeuluyenthe: { id: 'thienyeuluyenthe', n: 'Thiên Yêu Luyện Thể Điển', el: [], tier: 3, skills: ['yeu_hoangao'], hp: 1.25, def: 1.2, pw: 1.1, d: 'Thượng cổ yêu điển tôi luyện chân thân, lấy yêu khí và lôi đình đoán cốt hoán huyết.' },
  thontienyeukinh: { id: 'thontienyeukinh', n: 'Thôn Thiên Yêu Kinh', el: [], tier: 4, skills: ['thuvuong', 'yeu_hoangao'], pw: 1.2, hp: 1.3, def: 1.15, d: 'Bí điển trấn tộc thượng cổ của cự yêu, miệng nuốt nhật nguyệt, thân hóa thiên địa.' },
  thanhtam: { id: 'thanhtam', n: 'Thanh Tâm Dẫn Khí Thuật', el: [], tier: 1, skills: ['chuongphong'], d: 'Pháp môn dẫn khí nhập thể phổ biến nhất. Ai cũng tu được, nhưng chẳng ai tu nhanh.' },
  kimcuongquyet: { id: 'kimcuongquyet', n: 'Kim Cương Luyện Khí Quyết', el: ['kim'], tier: 1, skills: ['kimtien'], d: 'Luyện kim khí vào xương, đánh ra sắc bén.' },
  thanhmocquyet: { id: 'thanhmocquyet', n: 'Thanh Mộc Trường Sinh Quyết', el: ['moc'], tier: 1, skills: ['dangleo'], hp: 1.1, d: 'Hấp thụ sinh cơ cỏ cây, sống dai.' },
  nhuocthuyquyet: { id: 'nhuocthuyquyet', n: 'Nhược Thủy Quyết', el: ['thuy'], tier: 1, skills: ['thuytien'], d: 'Chân nguyên mềm như nước, liên miên bất tuyệt.' },
  liethoaquyet: { id: 'liethoaquyet', n: 'Liệt Hỏa Luyện Thân Quyết', el: ['hoa'], tier: 1, skills: ['hoacau'], pw: 1.05, d: 'Lấy lửa rèn thân, nóng nảy mà mạnh.' },
  hauthoquyet: { id: 'hauthoquyet', n: 'Hậu Thổ Quyết', el: ['tho'], tier: 1, skills: ['thothuan'], def: 1.2, d: 'Nhập môn của Hậu Thổ Tông. Chậm chạp nhưng vững như đất.' },
  thanhhakiem: { id: 'thanhhakiem', n: 'Thanh Hà Kiếm Quyết', el: ['kim', 'thuy'], tier: 1, skills: ['luuthuykiem'], pw: 1.1, d: 'Kiếm pháp nhập môn của Thanh Hà Kiếm Phái, kiếm thế như sông.' },
  xuansinhcong: { id: 'xuansinhcong', n: 'Xuân Sinh Công', el: ['moc', 'thuy'], tier: 1, skills: ['hoixuan'], hp: 1.15, d: 'Công pháp y đạo của Bách Thảo Cốc, hồi phục cực nhanh.' },
  nguhanhquyet: { id: 'nguhanhquyet', n: 'Ngũ Hành Luân Chuyển Công', el: ['kim', 'moc', 'thuy', 'hoa', 'tho'], tier: 2, skills: ['nguhanhan'], d: 'Cho năm hành luân chuyển trong kinh mạch. Hợp nhất với ngũ linh căn.' },
  phuvanbo: { id: 'phuvanbo', n: 'Phù Vân Bộ Hư Quyết', el: ['phong', 'moc', 'thuy'], tier: 2, skills: ['phongnhan', 'phuvanthan'], d: 'Thân nhẹ như mây, một bước mười trượng.' },
  lietduongcong: { id: 'lietduongcong', n: 'Liệt Dương Chân Công', el: ['hoa', 'kim'], tier: 2, skills: ['lietduongchuong'], pw: 1.12, d: 'Hỏa công chí dương, càng đánh càng nóng.' },
  hanbangquyet: { id: 'hanbangquyet', n: 'Hàn Băng Tĩnh Tâm Quyết', el: ['bang', 'thuy'], tier: 2, skills: ['hanbangtien'], d: 'Lấy tĩnh chế động, chân nguyên lạnh thấu xương.' },
  vandockinh: { id: 'vandockinh', n: 'Vạn Độc Chân Kinh', el: ['moc', 'hoa', 'thuy'], tier: 2, skills: ['docvu'], evil: true, d: 'Luyện độc vào máu, chạm vào đâu thối rữa tới đó.' },
  huyenthuychanquyet: { id: 'huyenthuychanquyet', n: 'Huyền Thủy Chân Quyết', el: ['thuy', 'bang'], tier: 2, skills: ['thuymanthien'], hp: 1.1, d: 'Chân quyết của Huyền Thủy Cung, nước nuôi vạn vật.' },
  kinhloiquyet: { id: 'kinhloiquyet', n: 'Kinh Lôi Dẫn Điện Quyết', el: ['loi'], tier: 2, skills: ['loiquang'], pw: 1.1, d: 'Dẫn sét vào kinh mạch. Đau, nhưng nhanh.' },
  canhphongquyet: { id: 'canhphongquyet', n: 'Cang Phong Quyết', el: ['phong'], tier: 2, skills: ['phongnhan'], d: 'Gió sắc như dao, xuyên qua hộ thể.' },
  thaihuyenkinh: { id: 'thaihuyenkinh', n: 'Thái Huyền Chân Kinh', el: ['kim', 'moc', 'thuy', 'hoa', 'tho'], tier: 3, skills: ['thaihuyenan', 'nguhanhan'], d: 'Chân kinh trấn tông của Thái Huyền Đạo Tông, năm hành quy nhất.' },
  loiamthien: { id: 'loiamthien', n: 'Lôi Âm Thiền Công', el: ['loi', 'kim', 'tho'], tier: 3, skills: ['loiamchuong', 'kimthan'], def: 1.15, d: 'Thiền công Phật môn hợp lôi pháp, tâm định như núi.' },
  huyetsatma: { id: 'huyetsatma', n: 'Huyết Sát Ma Công', el: [], tier: 3, skills: ['huyetsatthu'], evil: true, pw: 1.15, d: 'Ma công lấy sát khí nuôi tu vi. Tu nhanh, nhưng tâm ma đeo bám.' },
  tinhhaiquyet: { id: 'tinhhaiquyet', n: 'Tinh Hải Thâm Uyên Quyết', el: ['thuy', 'bang'], tier: 3, skills: ['tinhhailang'], d: 'Chân nguyên sâu như biển đêm đầy sao.' },
  canhkimkiem: { id: 'canhkimkiem', n: 'Canh Kim Kiếm Điển', el: ['kim'], tier: 3, skills: ['canhkimkiem'], pw: 1.2, d: 'Kiếm điển chí cương, một kiếm phá vạn pháp.' },
  thaiatmoc: { id: 'thaiatmoc', n: 'Thái Ất Thanh Mộc Kinh', el: ['moc', 'hoa'], tier: 3, skills: ['vanmoc', 'hoixuan'], hp: 1.2, d: 'Chân kinh mộc hệ cổ xưa, sinh sinh bất tức.' },
  tutieuthan: { id: 'tutieuthan', n: 'Tử Tiêu Thần Lôi Kinh', el: ['loi', 'phong', 'hoa'], tier: 4, skills: ['tutieuloi', 'loiquang'], pw: 1.15, d: 'Thần kinh của Tử Tiêu Tiên Cung, dẫn tử lôi chín tầng trời.' },
  hondonkinh: { id: 'hondonkinh', race: 'all', n: 'Hỗn Độn Khai Thiên Kinh', el: [], tier: 4, skills: ['khaithien'], pw: 1.2, d: 'Tương truyền là pháp môn khi trời đất chưa phân. Không kén linh căn.' },
  thaicuc: { id: 'thaicuc', race: 'all', n: 'Thái Cực Vô Lượng Kinh', el: ['kim', 'moc', 'thuy', 'hoa', 'tho'], tier: 4, skills: ['thaicucan', 'thaihuyenan'], def: 1.2, d: 'Âm dương tương tế, ngũ hành viên dung.' },
  huyenbang: { id: 'huyenbang', n: 'Cửu U Huyền Băng Kinh', el: ['bang'], tier: 4, skills: ['cuuuban'], d: 'Băng từ chín tầng địa phủ, đóng băng cả thần hồn.' },
  // --- bổ sung: mỗi hệ đủ bốn phẩm ---
  ngunguyenquyet: { id: 'ngunguyenquyet', n: 'Ngũ Nguyên Quy Tức Pháp', el: ['kim', 'moc', 'thuy', 'hoa', 'tho'], tier: 1, skills: ['chuongphong'], d: 'Nhập môn của Ngũ Nguyên Quán. Năm hành hít thở như một, dành cho kẻ linh căn tạp.' },
  bangphachquyet: { id: 'bangphachquyet', n: 'Băng Phách Ngưng Khí Quyết', el: ['bang'], tier: 1, skills: ['bangtruy'], d: 'Ngưng hàn khí thành sợi, dẫn vào đan điền từng chút một.' },
  loidinhquyet: { id: 'loidinhquyet', n: 'Lôi Đình Dẫn Khí Thuật', el: ['loi'], tier: 1, skills: ['loichi'], pw: 1.05, d: 'Đứng giữa mưa giông mà hít thở. Mỗi lần sét đánh gần, kinh mạch lại rộng thêm một chút.' },
  thanhphongquyet: { id: 'thanhphongquyet', n: 'Thanh Phong Dẫn Khí Quyết', el: ['phong'], tier: 1, skills: ['tieuphong'], d: 'Nhập môn của Truy Phong Biệt Viện. Thở theo gió, chạy theo gió.' },
  liemtucthuat: { id: 'liemtucthuat', n: 'Ám Ảnh Liễm Tức Thuật', el: ['am'], tier: 1, skills: ['uanhthich'], d: 'Giấu khí tức vào bóng tối. Tu chậm, nhưng kẻ địch khó phát hiện.' },
  thanquangquyet: { id: 'thanquangquyet', n: 'Thần Quang Dẫn Khí Quyết', el: ['quang'], tier: 1, skills: ['quangkiem'], d: 'Hấp thụ ánh bình minh. Ngày âm u thì tu chẳng được bao nhiêu.' },
  trongsonquyet: { id: 'trongsonquyet', n: 'Trọng Sơn Quyết', el: ['tho'], tier: 2, skills: ['thothuan', 'diachan'], def: 1.15, hp: 1.1, d: 'Lấy thân làm núi, chân nguyên nặng như đá tảng.' },
  ngulinhquyet: { id: 'ngulinhquyet', n: 'Ngự Linh Bách Thú Công', el: ['tho', 'moc', 'phong'], tier: 2, skills: ['thuvuong'], pw: 1.08, d: 'Tu luyện thần thức, ký khế ước và điều khiển nhiều linh thú. Lấy linh thú làm lực chiến chủ đạo, người thú đồng tu, phối hợp công phạt.' },
  uamquyet: { id: 'uamquyet', n: 'U Ám Hóa Ảnh Quyết', el: ['am'], tier: 2, skills: ['uanhthich', 'phehon'], d: 'Thân hóa bóng, chân nguyên lạnh như đêm không trăng.' },
  luuquangquyet: { id: 'luuquangquyet', n: 'Lưu Quang Quyết', el: ['quang'], tier: 2, skills: ['quangkiem', 'thanhquang'], d: 'Chân nguyên sáng như sao băng, chữa thương rất nhanh.' },
  dieunhatkinh: { id: 'dieunhatkinh', n: 'Diệu Nhật Thần Kinh', el: ['quang', 'hoa'], tier: 3, skills: ['thanhquang', 'dieunhat'], pw: 1.1, d: 'Chân kinh Diệu Nhật Thần Cung: luyện mặt trời vào đan điền.' },
  kinhhongkiem: { id: 'kinhhongkiem', n: 'Kinh Hồng Lôi Kiếm Điển', el: ['kim', 'loi'], tier: 3, skills: ['canhkimkiem', 'liemloi'], pw: 1.2, d: 'Kiếm như chim hồng kinh sợ, như sét giữa trời quang.' },
  cuuuminhkinh: { id: 'cuuuminhkinh', n: 'Cửu U Minh Thủy Kinh', el: ['am', 'thuy'], tier: 3, skills: ['phehon', 'tinhhailang'], evil: true, d: 'Ma kinh của Cửu U Minh Phủ, nuôi âm hồn trong nước đen.' },
  bichlacdankinh: { id: 'bichlacdankinh', n: 'Bích Lạc Đan Hỏa Kinh', el: ['moc', 'hoa'], tier: 3, skills: ['hoixuan', 'diahoa'], hp: 1.1, d: 'Lấy mộc dưỡng hỏa, lấy hỏa luyện đan. Đan sư Bích Lạc ai cũng tu.' },
  thiendienquyet: { id: 'thiendienquyet', n: 'Thiên Diễn Tinh Đồ', el: ['quang', 'thuy', 'phong'], tier: 3, skills: ['thanhquang', 'phongnhan'], d: 'Suy diễn tinh tú, đoán trước đường kiếm của đối thủ.' },
  baisonkinh: { id: 'baisonkinh', n: 'Bàn Sơn Chân Kinh', el: ['tho'], tier: 3, skills: ['sontrung', 'kimthan'], def: 1.2, hp: 1.15, d: 'Gánh núi mà tu, mỗi tầng công pháp là một ngọn núi đè trên vai.' },
  phonglangquyet: { id: 'phonglangquyet', n: 'Phong Lăng Cửu Thiên Quyết', el: ['phong'], tier: 3, skills: ['phongnhan', 'cuongphong'], d: 'Cưỡi gió chín tầng trời, thân pháp nhanh như ý niệm.' },
  huyennguyen: { id: 'huyennguyen', n: 'Huyền Nguyên Chân Kinh', el: ['kim', 'thuy', 'quang', 'tho'], tier: 4, skills: ['thaihuyenan', 'daiquangminh'], def: 1.1, d: 'Trấn phái của Huyền Nguyên Thánh Địa: bốn hành quy về một điểm sáng.' },
  batchu: { id: 'batchu', race: 'all', n: 'Bất Chu Thần Kinh', el: ['tho', 'moc', 'hoa', 'bang'], tier: 4, skills: ['sontrung', 'vanmoc'], hp: 1.2, pw: 1.1, d: 'Tương truyền khắc trên cột chống trời đã gãy. Thân thể vững như núi Bất Chu.' },
  vanmakinh: { id: 'vanmakinh', race: 'all', n: 'Vạn Ma Quy Nguyên Kinh', el: ['am'], tier: 4, skills: ['vanmaphe', 'phehon'], evil: true, pw: 1.2, d: 'Ma kinh tối thượng. Vạn ma quy về một thân, đổi lại là tâm ma không bao giờ ngủ.' },
  daiquangminhkinh: { id: 'daiquangminhkinh', race: 'all', n: 'Đại Quang Minh Kinh', el: ['quang'], tier: 4, skills: ['daiquangminh', 'thanhquang'], d: 'Ánh sáng không sinh không diệt. Người tu thành thì tà ma tránh xa.' },
  thanhvukiem: { id: 'thanhvukiem', n: 'Thanh Vũ Phong Lôi Kiếm', el: ['phong', 'loi'], tier: 4, skills: ['phongloi', 'tutieuloi'], pw: 1.2, d: 'Kiếm thế như mưa xanh, mỗi giọt mang tiếng sấm.' },
  bichhaitrieu: { id: 'bichhaitrieu', n: 'Bích Hải Triều Sinh Kinh', el: ['thuy', 'moc'], tier: 4, skills: ['tinhhailang', 'thuymanthien'], hp: 1.25, d: 'Như thủy triều, rút đi rồi lại về, sinh cơ không cạn.' },
  // ===== Công Pháp Bốn Thần Giới =====
  // --- Thiên Đình ---
  cp_td_ngungkhi: { id: 'cp_td_ngungkhi', n: 'Cửu Thiên Ngưng Khí Quyết', el: ['quang', 'phong'], tier: 1, celestial: 'thiendinh', celestialTier: 'low', skills: ['sk_td_tienquang'], d: 'Pháp môn hít thở mây tía chín tầng trời, linh khí tinh thuần.' },
  cp_td_tuvi: { id: 'cp_td_tuvi', n: 'Tử Vi Tinh Thần Điển', el: ['quang', 'loi'], tier: 3, celestial: 'thiendinh', celestialTier: 'mid', skills: ['sk_td_phongloi', 'sk_td_tienquang'], pw: 1.15, d: 'Luyện tinh quang Bắc Đẩu vào kinh mạch, hộ thể và ngự khí cửu thiên.' },
  cp_td_thienha: { id: 'cp_td_thienha', n: 'Thiên Hà Thủy Quân Chân Điển', el: ['thuy', 'quang'], tier: 4, celestial: 'thiendinh', celestialTier: 'high', skills: ['sk_td_thienhathuy'], hp: 1.25, pw: 1.15, d: 'Chân điển thống lĩnh tám vạn thủy binh sông Ngân Hà, khí thế bàng bạc như triều dâng sóng sao.' },
  cp_td_dausuat: { id: 'cp_td_dausuat', n: 'Thái Thượng Bát Quái Đan Kinh', el: ['hoa', 'moc', 'kim'], tier: 5, celestial: 'thiendinh', celestialTier: 'high', skills: ['sk_td_batquaihoa'], hp: 1.2, pw: 1.2, d: 'Chân truyền lò Bát Quái Đâu Suất Cung của Thái Thượng Lão Quân, luyện chân hỏa tam muội thiêu đốt vạn vật.' },
  cp_td_linhtieu: { id: 'cp_td_linhtieu', n: 'Cửu Trùng Thiên Ngọc Hoàng Thần Điển', el: ['quang', 'kim', 'loi'], tier: 6, celestial: 'thiendinh', celestialTier: 'high', skills: ['sk_td_linhtieuchuong', 'sk_td_thienhathuy'], pw: 1.3, def: 1.25, d: 'Thần điển chí tôn tam giới ngự trên Lăng Tiêu Bảo Điện, vạn tiên triều bái, kim thân vạn kiếp bất diệt.' },

  // --- Địa Phủ ---
  cp_dp_hoangtuyen: { id: 'cp_dp_hoangtuyen', n: 'Hoàng Tuyền Dẫn Hồn Quyết', el: ['am', 'thuy'], tier: 1, evil: true, celestial: 'diaphu', celestialTier: 'low', skills: ['sk_dp_cauhon'], d: 'Luyện tử khí ven sông Hoàng Tuyền mở mang kinh mạch, câu hồn định phách.' },
  cp_dp_hanphach: { id: 'cp_dp_hanphach', n: 'U Minh Hàn Phách Kinh', el: ['am', 'bang'], tier: 3, evil: true, celestial: 'diaphu', celestialTier: 'mid', skills: ['sk_dp_bingan', 'sk_dp_cauhon'], pw: 1.15, def: 1.1, d: 'Hàn khí thấu xương của chín tầng địa phủ, đông cứng cả thần hồn kẻ địch.' },
  cp_dp_thapdien: { id: 'cp_dp_thapdien', n: 'Thập Điện Diêm La Phán Thế Kinh', el: ['am'], tier: 4, evil: true, celestial: 'diaphu', celestialTier: 'high', skills: ['sk_dp_phanbut'], pw: 1.25, d: 'Chân điển phán xét tội phúc của mười điện âm ty Phong Đô, chấp chưởng sinh tử chi quyền.' },
  cp_dp_phongdo: { id: 'cp_dp_phongdo', n: 'Phong Đô Quỷ Đế U Minh Điển', el: ['am', 'hoa'], tier: 5, evil: true, celestial: 'diaphu', celestialTier: 'high', skills: ['sk_dp_vongxuyen', 'sk_dp_phanbut'], def: 1.25, hp: 1.2, d: 'Đại điển chúa tể âm ty Phong Đô Đại Đế, ngự trị vạn quỷ, oán khí vạn năm hóa thành hộ thể thần giáp.' },
  cp_dp_luanhoi: { id: 'cp_dp_luanhoi', n: 'Lục Đạo Luân Hồi Chân Kinh', el: ['am', 'thuy', 'quang'], tier: 6, celestial: 'diaphu', celestialTier: 'high', skills: ['sk_dp_luanhoian', 'sk_dp_vongxuyen'], pw: 1.3, hp: 1.3, d: 'Chí cao chân kinh Địa Phủ xoay chuyển sáu nẻo luân hồi, vượt ra ngoài sinh tử, cải tử hồi sinh.' },

  // --- Yêu Giới ---
  cp_yg_yeukhi: { id: 'cp_yg_yeukhi', n: 'Yêu Khí Luyện Thể Pháp', el: ['tho', 'phong'], tier: 1, race: 'yao', celestial: 'yeugioi', celestialTier: 'low', skills: ['sk_yg_toicot'], def: 1.12, hp: 1.1, d: 'Dẫn thiên địa yêu khí Thập Vạn Đại Sơn rèn luyện da thịt gân cốt sơ giai.' },
  cp_yg_hacphong: { id: 'cp_yg_hacphong', n: 'Hắc Phong Thôn Lôi Quyết', el: ['phong', 'am', 'loi'], tier: 3, race: 'yao', celestial: 'yeugioi', celestialTier: 'mid', skills: ['sk_yg_banty', 'sk_yg_toicot'], pw: 1.18, d: 'Tuyệt kỹ Hắc Phong Sơn kết hợp gió đen và sấm sét, công thủ toàn diện.' },
  cp_yg_tichloi: { id: 'cp_yg_tichloi', n: 'Ma Vân Tích Lôi Thần Điển', el: ['loi', 'hoa'], tier: 4, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', skills: ['sk_yg_tichloibong'], pw: 1.25, hp: 1.15, d: 'Tuyệt học Bình Thiên Đại Thánh Ngưu Ma Vương, chưởng khống ma vân và vạn đạo lôi điện Tích Lôi Sơn.' },
  cp_yg_hoaqua: { id: 'cp_yg_hoaqua', n: 'Hoa Quả Sơn Thủy Liêm Tiên Kinh', el: ['kim', 'tho'], tier: 5, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', skills: ['sk_yg_hoaquagay'], pw: 1.25, def: 1.2, hp: 1.2, d: 'Chân truyền Mỹ Hầu Vương Tề Thiên Đại Thánh, nhục thân kim cương bất hoại, biến hóa khôn lường.' },
  cp_yg_yeuhoang: { id: 'cp_yg_yeuhoang', n: 'Thái Cổ Yêu Hoàng Vạn Thú Kinh', el: ['hoa', 'quang', 'phong'], tier: 6, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', skills: ['sk_yg_suda', 'sk_yg_hoaquagay'], pw: 1.3, hp: 1.25, def: 1.2, d: 'Đế vương chi điển của Yêu Hoàng Đế Tuấn, lệnh một tiếng vạn yêu quy phục, huyết mạch chí tôn thượng cổ.' },

  // --- Linh Sơn ---
  cp_ls_toathien: { id: 'cp_ls_toathien', n: 'Phật Môn Tọa Thiền Quyết', el: ['quang', 'tho'], tier: 1, celestial: 'linhson', celestialTier: 'low', skills: ['sk_ls_kimcuong'], def: 1.15, hp: 1.1, d: 'Ngồi thiền tụng niệm dưới chân Phật sơn, tịnh hóa tạp niệm và tụ khí đan điền.' },
  cp_ls_vanthu: { id: 'cp_ls_vanthu', n: 'Ngũ Đài Văn Thù Kiếm Điển', el: ['quang', 'kim'], tier: 3, celestial: 'linhson', celestialTier: 'mid', skills: ['sk_ls_batnha', 'sk_ls_kimcuong'], pw: 1.18, def: 1.12, d: 'Kiếm điển trí tuệ Văn Thù Bồ Tát ngự Ngũ Đài Sơn, kiếm khí thanh tịnh chém đứt vô minh phiền não.' },
  cp_ls_cuuhoa: { id: 'cp_ls_cuuhoa', n: 'Địa Tạng Độ Ách Thần Điển', el: ['quang', 'tho', 'am'], tier: 4, celestial: 'linhson', celestialTier: 'high', skills: ['sk_ls_hanglong'], def: 1.28, hp: 1.22, d: 'Chân điển Địa Tạng Vương Bồ Tát Cửu Hoa Sơn: "Địa ngục chưa trống thề không thành Phật", đại bi vô biên.' },
  cp_ls_lacgia: { id: 'cp_ls_lacgia', n: 'Phổ Đà Nam Hải Thanh Tịnh Kinh', el: ['quang', 'thuy', 'moc'], tier: 5, celestial: 'linhson', celestialTier: 'high', skills: ['sk_ls_camlo'], hp: 1.35, def: 1.2, d: 'Chân kinh Quan Thế Âm Bồ Tát đạo tràng Phổ Đà Lạc Già Sơn, cam lộ tịnh bình cứu khổ cứu nạn, sinh cơ bất tận.' },
  cp_ls_nhulai: { id: 'cp_ls_nhulai', n: 'Đại Lôi Âm Như Lai Đại Phật Điển', el: ['quang', 'kim', 'tho'], tier: 6, celestial: 'linhson', celestialTier: 'high', skills: ['sk_ls_nhulaichuong', 'sk_ls_hanglong'], pw: 1.3, def: 1.25, hp: 1.25, d: 'Giáo chủ chi điển của Phật Tổ Như Lai tại Đại Lôi Âm Tự, một bàn tay úp xuống định càn khôn, vạn phật triều tông.' },

};
export const TECH_SPEED = [0, 1, 1.25, 1.55, 2, 2.5, 3.2, 4, 5, 6.2];
export const TECH_POW = [0, 1, 1.2, 1.45, 1.8, 2.25, 2.9, 3.6, 4.5, 5.6];
// Công pháp mới cấp Thần/Tiên giai
Object.assign(TECHS, {
  vanyeuhoahinh: { id: 'vanyeuhoahinh', race: 'all', n: 'Vạn Yêu Hóa Hình Kinh', el: ['moc', 'tho', 'am', 'phong'], tier: 5, skills: ['thuvuong', 'vanmoc'], pw: 1.15, hp: 1.15, d: 'Trấn đình chi bảo của Vạn Yêu Thánh Đình: dạy yêu hóa người, dạy người hiểu yêu.' },
  thaiso: { id: 'thaiso', race: 'all', n: 'Thái Sơ Đạo Kinh', el: ['kim', 'moc', 'thuy', 'hoa', 'tho', 'bang', 'loi', 'phong', 'am', 'quang'], tier: 6, skills: ['khaithien', 'thaicucan'], pw: 1.2, def: 1.2, d: 'Đạo kinh từ trước khi có trời đất. Mười hệ đều thông — truyền thuyết nói chỉ người mười linh căn mới tu tới tận cùng.' },
} as Record<string, Tech>);
/** Định giai/phẩm cho công pháp: thánh địa → Thần giai, cổ kinh thất truyền → Tiên giai. */
const TECH_GRADE: Record<string, [number, number]> = {
  bachthutoithe: [1, 1],
  manhoangluyencot: [2, 1],
  thietgiapyeubao: [1, 1],
  kimgiacyeukinh: [2, 1],
  bachhothankim: [3, 2],
  xichkimthanvien: [4, 2],
  thanhmanthonmoc: [1, 1],
  vanthumocyen: [2, 1],
  thienthuhoalinh: [3, 2],
  cuudiepyeuthan: [4, 2],
  giaolongphucthuy: [1, 1],
  uhaixuankinh: [2, 1],
  bacminhkinhba: [3, 2],
  chanlonghoathan: [4, 2],
  xichdiemhoadieu: [1, 1],
  liethoathanchu: [2, 1],
  chutuothanhoa: [3, 2],
  nietbankimo: [4, 2],
  hauthuhungvuong: [1, 1],
  trongsoncutuong: [2, 1],
  huyenquyhoangtho: [3, 2],
  hoanglongkinh: [4, 2],
  hanbangbachlang: [1, 1],
  bangphachtuyetho: [2, 1],
  huyenbangthangiao: [3, 2],
  cuchanbanglong: [4, 2],
  loibaotrucquyet: [1, 1],
  cuuthienloibang: [2, 1],
  loigiaokhiulong: [3, 2],
  tuloithanlong: [4, 2],
  thanhungnguphong: [1, 1],
  tatphongliepbao: [2, 1],
  kimsidaibang: [3, 2],
  cuuthienphongbang: [4, 2],
  uamxaanh: [1, 1],
  damaducbuc: [2, 1],
  cuuumayeu: [3, 2],
  thontienhaclong: [4, 2],
  kimquangthanloc: [1, 1],
  dieuquangbachho: [2, 1],
  thaiduongthandieu: [3, 2],
  quangminhlongthan: [4, 2],
  cuuchuyen: [6, 3], batcuu: [5, 2], thonnguyetquyet: [1, 1], thienyeuluyenthe: [3, 2], thontienyeukinh: [4, 2], thanhtam: [1, 0], kimcuongquyet: [1, 1], thanhmocquyet: [1, 1], nhuocthuyquyet: [1, 1], liethoaquyet: [1, 1], hauthoquyet: [1, 2], thanhhakiem: [1, 2], xuansinhcong: [1, 2],
  ngunguyenquyet: [1, 1], bangphachquyet: [1, 1], loidinhquyet: [1, 2], thanhphongquyet: [1, 1], liemtucthuat: [1, 1], thanquangquyet: [1, 1],
  nguhanhquyet: [2, 1], phuvanbo: [2, 2], lietduongcong: [2, 2], hanbangquyet: [2, 2], vandockinh: [2, 2], huyenthuychanquyet: [2, 3], kinhloiquyet: [2, 1], canhphongquyet: [2, 0],
  trongsonquyet: [2, 1], ngulinhquyet: [2, 2], uamquyet: [2, 1], luuquangquyet: [2, 1],
  thaihuyenkinh: [3, 3], loiamthien: [3, 2], huyetsatma: [3, 2], tinhhaiquyet: [3, 0], canhkimkiem: [3, 1], thaiatmoc: [3, 1], dieunhatkinh: [3, 2], kinhhongkiem: [3, 2],
  cuuuminhkinh: [3, 2], bichlacdankinh: [3, 2], thiendienquyet: [3, 2], baisonkinh: [3, 0], phonglangquyet: [3, 0],
  thanhvukiem: [4, 1], daiquangminhkinh: [4, 2], thaicuc: [4, 3],
  huyenbang: [5, 0], bichhaitrieu: [5, 0], vanmakinh: [5, 1], vanyeuhoahinh: [5, 1], batchu: [5, 2], huyennguyen: [5, 2], tutieuthan: [5, 3],
  hondonkinh: [6, 2], thaiso: [6, 3],
  cp_td_ngungkhi: [1, 1], cp_td_tuvi: [3, 2], cp_td_thienha: [4, 2], cp_td_dausuat: [5, 2], cp_td_linhtieu: [6, 3],
  cp_dp_hoangtuyen: [1, 1], cp_dp_hanphach: [3, 2], cp_dp_thapdien: [4, 2], cp_dp_phongdo: [5, 2], cp_dp_luanhoi: [6, 3],
  cp_yg_yeukhi: [1, 1], cp_yg_hacphong: [3, 2], cp_yg_tichloi: [4, 2], cp_yg_hoaqua: [5, 2], cp_yg_yeuhoang: [6, 3],
  cp_ls_toathien: [1, 1], cp_ls_vanthu: [3, 2], cp_ls_cuuhoa: [4, 2], cp_ls_lacgia: [5, 2], cp_ls_nhulai: [6, 3],

};
for (const [id, [g, q]] of Object.entries(TECH_GRADE)) if (TECHS[id]) { TECHS[id].tier = g; TECHS[id].pq = q; }
export const techSpeed = (t: Tech) => TECH_SPEED[t.tier] * (1 + (t.pq ?? 0) * 0.06);
export const techPow = (t: Tech) => TECH_POW[t.tier] * (1 + (t.pq ?? 0) * 0.05);
export const techGrade = (t: Tech) => artGradeLabel(t.tier, t.pq ?? 0);

// ---------- Thuật pháp ----------
export type SkillKind = 'atk' | 'heal' | 'shield' | 'dot' | 'multi';
export interface Skill {
  id: string;
  n: string;
  el: El | null;
  tier: number;
  pq?: number;
  k: SkillKind;
  m: number; // hệ số
  cd: number; // hồi chiêu (lượt)
  sword?: boolean;
  w?: Weapon; // loại vũ khí / quyền cước
  race?: 'human' | 'yao' | 'all'; // chủng tộc có thể thi triển
  peak?: boolean; // chân truyền của phong chủ, không bán, không rơi
  /** Chiêu hồi phục có thêm hồi máu theo lượt: mỗi lượt hồi m × lượng hồi tức thời, trong `turns` lượt. Chỉ hồi máu, không hồi giáp. */
  hot?: { m: number; turns: number };
  /** Gây sát thương lên toàn bộ kẻ địch (chỉ với kiểu 'atk'). */
  all?: boolean;
  celestial?: CelestialId;
  celestialTier?: 'low' | 'mid' | 'high';
  d: string;
}
export type Weapon = 'kiem' | 'dao' | 'thuong' | 'quyen' | 'chuong' | 'cung' | 'kich';
export const WEAPON_N: Record<Weapon, string> = { kiem: 'Kiếm', dao: 'Đao', thuong: 'Thương', quyen: 'Quyền', chuong: 'Chưởng', cung: 'Cung', kich: 'Kích' };
export const SKILLS: Record<string, Skill> = {
  // ===== Võ Kỹ / Thần Thông Yêu Tộc =====
  yeu_lietthach: { id: 'yeu_lietthach', n: 'Liệt Thạch Yêu Trảo', el: 'kim', tier: 1, k: 'atk', m: 1.45, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Vuốt sắc chém đá nát vàng.' },
  yeu_cuongthu: { id: 'yeu_cuongthu', n: 'Cuồng Thú Bôn Tập', el: 'tho', tier: 1, k: 'atk', m: 1.4, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Lao mạnh nghiền nát vật cản bằng nhục thân đồ sộ.' },
  yeu_manhtoc: { id: 'yeu_manhtoc', n: 'Mãng Độc Triền Nhiễu', el: 'moc', tier: 1, k: 'dot', m: 0.65, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Nọc độc yêu xà ngấm vào kinh mạch rút cạn sinh lực.' },
  yeu_hoatuc: { id: 'yeu_hoatuc', n: 'Xích Viêm Thổ Tức', el: 'hoa', tier: 1, k: 'atk', m: 1.55, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Phun ra luồng lửa yêu thiêu đốt quân thù.' },
  yeu_thuylang: { id: 'yeu_thuylang', n: 'Bích Ba Thủy Kích', el: 'thuy', tier: 1, k: 'atk', m: 1.35, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Cuộn sóng yêu thủy đập tan hộ thể đối phương.' },
  yeu_loibao: { id: 'yeu_loibao', n: 'Lôi Thiểm Bôn Lôi', el: 'loi', tier: 1, k: 'atk', m: 1.5, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Thân hóa lôi đình bạo kích chớp nhoáng.' },
  yeu_bangnha: { id: 'yeu_bangnha', n: 'Băng Nha Toái Cốt', el: 'bang', tier: 1, k: 'atk', m: 1.4, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Răng nanh sắc nhọn mang theo hàn khí đông cứng thịt xương.' },
  yeu_phongvuc: { id: 'yeu_phongvuc', n: 'Liệt Phong Cuồng Vực', el: 'phong', tier: 1, k: 'multi', m: 0.6, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Vỗ cánh phóng ra ba lưỡi phong nhận xé rách đối phương.' },
  yeu_uamkich: { id: 'yeu_uamkich', n: 'U Minh Ảnh Kích', el: 'am', tier: 1, k: 'atk', m: 1.4, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Đột kích hiểm hóc từ bóng tối không một tiếng động.' },
  yeu_quanghoa: { id: 'yeu_quanghoa', n: 'Quang Dực Trảm', el: 'quang', tier: 1, k: 'atk', m: 1.45, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Đôi cánh tỏa kim quang trảm kích sắc bén.' },
  yeu_thuphach: { id: 'yeu_thuphach', n: 'Cương Giáp Hộ Thể', el: 'tho', tier: 1, k: 'shield', m: 1.25, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Gồng cứng cơ bắp và lớp da yêu thú hóa giải đòn đánh.' },
  yeu_sinhco: { id: 'yeu_sinhco', n: 'Yêu Huyết Hồi Sinh', el: 'moc', tier: 1, k: 'heal', m: 0.95, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Vận chuyển yêu huyết chữa lành thương thế cực nhanh.' },
  yeu_bachkimtrao: { id: 'yeu_bachkimtrao', n: 'Bách Kim Liệt Không Trảo', el: 'kim', tier: 2, k: 'multi', m: 0.75, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Vuốt sắc xé gió để lại nhiều vết thương chí mạng.' },
  yeu_kinhloibao: { id: 'yeu_kinhloibao', n: 'Kinh Lôi Yêu Hống', el: 'loi', tier: 2, k: 'atk', m: 2.1, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Tiếng gầm sấm sét làm tê liệt thần hồn kẻ địch.' },
  yeu_huyenbangphun: { id: 'yeu_huyenbangphun', n: 'Huyền Băng Thổ Tức', el: 'bang', tier: 2, k: 'atk', m: 1.8, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Phun ra dòng hàn băng đóng cứng kinh mạch mục tiêu.' },
  yeu_diaham: { id: 'yeu_diaham', n: 'Đại Địa Ba Chấn', el: 'tho', tier: 2, k: 'shield', m: 1.5, cd: 4, race: 'yao', d: 'Thần thông yêu tộc: Dộng chân xuống đất dựng màn chắn đất đá kiên cố.' },
  yeu_haithanhoang: { id: 'yeu_haithanhoang', n: 'Thủy Triều Dưỡng Tinh', el: 'thuy', tier: 2, k: 'heal', m: 1.25, cd: 4, race: 'yao', d: 'Thần thông yêu tộc: Thủy khí dạt dào làm dịu và phục hồi vết thương.' },
  yeu_mahoa: { id: 'yeu_mahoa', n: 'Hắc Viêm Ma Hỏa', el: 'hoa', tier: 2, k: 'atk', m: 2.05, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Ngọn lửa yêu ma u tối bốc cháy dữ dội.' },
  yeu_chucdoc: { id: 'yeu_chucdoc', n: 'Chúc Cốt Yêu Độc', el: 'moc', tier: 2, k: 'dot', m: 1.05, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Chất độc ngấm tận tủy xương ăn mòn hộ thể.' },
  yeu_thientho: { id: 'yeu_thientho', n: 'Thôn Hồn Đoạt Phách', el: 'am', tier: 2, k: 'atk', m: 1.95, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Hút một phần hồn phách đối phương làm suy yếu.' },
  yeu_thanquang: { id: 'yeu_thanquang', n: 'Phong Dực Hóa Ảnh', el: 'phong', tier: 2, k: 'multi', m: 0.7, cd: 2, race: 'yao', d: 'Thần thông yêu tộc: Đôi cánh hóa thành tàn ảnh trảm kích liên hồi.' },
  yeu_giaolongbaivi: { id: 'yeu_giaolongbaivi', n: 'Giao Long Bãi Vĩ', el: 'thuy', tier: 3, k: 'multi', m: 1.0, cd: 3, race: 'yao', d: 'Thần thông yêu tộc: Đuôi rồng quất mạnh gây sóng gió dập tan quân thù.' },
  yeu_bachhocanhkim: { id: 'yeu_bachhocanhkim', n: 'Canh Kim Bạch Hổ Sát', el: 'kim', tier: 3, k: 'atk', m: 2.75, cd: 3, race: 'yao', d: 'Thần thông Bạch Hổ: Kim sát sắc bén xuyên thủng hộ thể tuyệt đối.' },
  yeu_chutuocviem: { id: 'yeu_chutuocviem', n: 'Chu Tước Liệt Thiên Viêm', el: 'hoa', tier: 3, k: 'atk', m: 2.6, cd: 3, race: 'yao', d: 'Thần thông Chu Tước: Biển lửa thiêu đỏ cả một góc trời.' },
  yeu_huyenquygiap: { id: 'yeu_huyenquygiap', n: 'Huyền Quy Thác Thiên Giáp', el: 'tho', tier: 3, k: 'shield', m: 2.2, cd: 4, race: 'yao', d: 'Thần thông Huyền Quy: Khí thuẫn mai rùa đỡ trời cản phá đòn tấn công.' },
  yeu_cuuthienloi: { id: 'yeu_cuuthienloi', n: 'Cửu Thiên Cuồng Lôi', el: 'loi', tier: 3, k: 'atk', m: 2.7, cd: 3, race: 'yao', d: 'Thần thông lôi yêu: Dẫn sấm sét cuồng bạo đánh tan nát mục tiêu.' },
  yeu_banglongtuc: { id: 'yeu_banglongtuc', n: 'Băng Long Thổ Tức', el: 'bang', tier: 3, k: 'atk', m: 2.5, cd: 3, race: 'yao', d: 'Thần thông băng yêu: Luồng hàn phong cực độ đóng băng vạn dặm.' },
  yeu_kimsitram: { id: 'yeu_kimsitram', n: 'Đại Bằng Liệt Phong Trảm', el: 'phong', tier: 3, k: 'multi', m: 0.95, cd: 3, race: 'yao', d: 'Thần thông Kim Sí Đại Bằng: Đôi cánh chém đứt không gian.' },
  yeu_cuuumathu: { id: 'yeu_cuuumathu', n: 'Cửu U Ma Yêu Vực', el: 'am', tier: 3, k: 'dot', m: 1.35, cd: 3, race: 'yao', d: 'Thần thông ma yêu: Vực thẳm âm u hút cạn sinh cơ mục tiêu.' },
  yeu_thanhlinhhoang: { id: 'yeu_thanhlinhhoang', n: 'Thanh Loan Dưỡng Mệnh Quang', el: 'moc', tier: 3, k: 'heal', m: 1.6, cd: 4, race: 'yao', d: 'Thần thông Thanh Loan: Ánh sáng sinh mệnh hồi phục trọng thương trong tích tắc.' },
  yeu_chanlongphan: { id: 'yeu_chanlongphan', n: 'Chân Long Phá Giới Kích', el: 'thuy', tier: 4, k: 'atk', m: 3.5, cd: 3, race: 'yao', d: 'Chân Long thần thông: Móng vuốt xé toạc không gian bổ đôi tinh cầu.' },
  yeu_nietbanhoa: { id: 'yeu_nietbanhoa', n: 'Phượng Hoàng Niết Bàn Viêm', el: 'hoa', tier: 4, k: 'heal', m: 2.5, cd: 4, race: 'yao', d: 'Chân Phượng thần thông: Lửa niết bàn hồi sinh từ cõi chết.' },
  yeu_conbangphahai: { id: 'yeu_conbangphahai', n: 'Côn Bằng Phá Hải Thôn Thiên', el: 'phong', tier: 4, k: 'atk', m: 3.6, cd: 4, race: 'yao', d: 'Côn Bằng thần thông: Nuốt chửng đất trời, sức mạnh nghiền nát càn khôn.' },
  yeu_bachhokhong: { id: 'yeu_bachhokhong', n: 'Bạch Hổ Đoạt Mệnh Tuyệt Sát', el: 'kim', tier: 4, k: 'atk', m: 3.7, cd: 4, race: 'yao', d: 'Bạch Hổ thần thông: Sát phạt tuyệt đối, một kích lấy mạng kẻ thù.' },
  yeu_hoanglongchan: { id: 'yeu_hoanglongchan', n: 'Hoàng Long Hậu Thổ Ấn', el: 'tho', tier: 4, k: 'shield', m: 3.2, cd: 4, race: 'yao', d: 'Hoàng Long thần thông: Đại địa ấn phù hộ thể kim thân vạn kiếp bất diệt.' },
  yeu_tuloigiang: { id: 'yeu_tuloigiang', n: 'Cửu Thiên Tử Tiêu Diệt Lôi', el: 'loi', tier: 4, k: 'atk', m: 3.65, cd: 4, race: 'yao', d: 'Thần lôi diệt thế giáng xuống hóa tro tàn mọi chướng ngại.' },
  yeu_cuchanbangvuc: { id: 'yeu_cuchanbangvuc', n: 'Cực Hàn Tuyệt Đối Vực', el: 'bang', tier: 4, k: 'dot', m: 1.8, cd: 4, race: 'yao', d: 'Băng vực tuyệt đối ngưng đọng thời gian và đóng băng mọi sinh linh.' },
  chuongphong: { id: 'chuongphong', n: 'Chưởng Phong', el: 'phong', tier: 1, k: 'atk', m: 1.2, cd: 1, d: 'Gom linh khí vào lòng bàn tay mà đánh.' },
  kimtien: { id: 'kimtien', n: 'Kim Tiễn Thuật', el: 'kim', tier: 1, k: 'atk', m: 1.45, cd: 2, d: 'Ngưng kim khí thành mũi tên.' },
  dangleo: { id: 'dangleo', n: 'Đằng La Triền', el: 'moc', tier: 1, k: 'dot', m: 0.6, cd: 3, d: 'Dây leo quấn chặt, rút dần sinh lực địch.' },
  thuytien: { id: 'thuytien', n: 'Thủy Tiễn Thuật', el: 'thuy', tier: 1, k: 'atk', m: 1.35, cd: 2, d: 'Tên nước liên hoàn.' },
  hoacau: { id: 'hoacau', n: 'Hỏa Cầu Thuật', el: 'hoa', tier: 1, k: 'atk', m: 1.55, cd: 2, d: 'Pháp thuật kinh điển của mọi tu sĩ hỏa hệ.' },
  thothuan: { id: 'thothuan', n: 'Thổ Thuẫn Thuật', el: 'tho', tier: 1, k: 'shield', m: 1.2, cd: 3, d: 'Dựng tường đất chắn đòn.' },
  luuthuykiem: { id: 'luuthuykiem', n: 'Lưu Thủy Kiếm', el: 'thuy', tier: 1, k: 'multi', m: 0.6, cd: 2, sword: true, d: 'Ba kiếm liên tiếp như nước chảy.' },
  hoixuan: { id: 'hoixuan', n: 'Hồi Xuân Thuật', el: 'moc', tier: 1, k: 'heal', m: 0.9, cd: 3, d: 'Hồi phục khí huyết.' },
  nguhanhan: { id: 'nguhanhan', n: 'Ngũ Hành Ấn', el: null, tier: 2, k: 'atk', m: 1.7, cd: 2, d: 'Ấn pháp năm hành, không bị khắc chế.' },
  phongnhan: { id: 'phongnhan', n: 'Phong Nhận', el: 'phong', tier: 2, k: 'multi', m: 0.7, cd: 2, d: 'Lưỡi gió vô hình chém liên tiếp.' },
  phuvanthan: { id: 'phuvanthan', n: 'Phù Vân Thân Pháp', el: 'phong', tier: 2, k: 'shield', m: 1.4, cd: 4, d: 'Thân hóa mây, đòn đánh trượt qua.' },
  lietduongchuong: { id: 'lietduongchuong', n: 'Liệt Dương Chưởng', el: 'hoa', tier: 2, k: 'atk', m: 2, cd: 3, d: 'Chưởng lực như mặt trời giữa trưa.' },
  hanbangtien: { id: 'hanbangtien', n: 'Hàn Băng Tiễn', el: 'bang', tier: 2, k: 'atk', m: 1.75, cd: 2, d: 'Tên băng đóng cứng kinh mạch đối thủ.' },
  docvu: { id: 'docvu', n: 'Độc Vụ Thuật', el: 'moc', tier: 2, k: 'dot', m: 0.95, cd: 3, d: 'Sương độc ăn mòn hộ thể.' },
  thuymanthien: { id: 'thuymanthien', n: 'Thủy Mạn Thiên', el: 'thuy', tier: 2, k: 'heal', m: 1.2, cd: 4, d: 'Thủy khí bao bọc, chữa thương.' },
  loiquang: { id: 'loiquang', n: 'Chưởng Tâm Lôi', el: 'loi', tier: 2, k: 'atk', m: 2.1, cd: 3, d: 'Sét nổ trong lòng bàn tay.' },
  kimthan: { id: 'kimthan', n: 'Kim Thân Bất Hoại', el: 'kim', tier: 3, k: 'shield', m: 2, cd: 4, d: 'Thân hóa vàng ròng, đao kiếm khó vào.' },
  thaihuyenan: { id: 'thaihuyenan', n: 'Thái Huyền Ấn', el: 'kim', tier: 3, k: 'atk', m: 2.4, cd: 3, d: 'Đại ấn trấn áp của Thái Huyền Đạo Tông.' },
  loiamchuong: { id: 'loiamchuong', n: 'Lôi Âm Phật Chưởng', el: 'loi', tier: 3, k: 'atk', m: 2.5, cd: 3, d: 'Chưởng ấn mang tiếng sấm, chấn động thần hồn.' },
  huyetsatthu: { id: 'huyetsatthu', n: 'Huyết Sát Thủ', el: 'hoa', tier: 3, k: 'atk', m: 2.3, cd: 2, d: 'Tay máu xé thịt, hút một phần sinh lực.' },
  tinhhailang: { id: 'tinhhailang', n: 'Tinh Hải Cuồng Lan', el: 'thuy', tier: 3, k: 'multi', m: 0.95, cd: 3, d: 'Sóng biển đêm cuộn tới từng đợt.' },
  canhkimkiem: { id: 'canhkimkiem', n: 'Canh Kim Phá Pháp Kiếm', el: 'kim', tier: 3, k: 'atk', m: 2.7, cd: 3, sword: true, d: 'Một kiếm phá hộ thể.' },
  vanmoc: { id: 'vanmoc', n: 'Vạn Mộc Triều Tông', el: 'moc', tier: 3, k: 'dot', m: 1.3, cd: 3, d: 'Vạn cây quấn lấy, hút cạn sinh cơ.' },
  tutieuloi: { id: 'tutieuloi', n: 'Tử Tiêu Thần Lôi', el: 'loi', tier: 4, k: 'atk', m: 3.4, cd: 3, d: 'Lôi tím chín tầng trời giáng xuống.' },
  khaithien: { id: 'khaithien', n: 'Khai Thiên Nhất Kích', el: null, tier: 4, k: 'atk', m: 3.6, cd: 4, d: 'Một đòn như búa rìu đầu tiên bổ đôi hỗn độn.' },
  thaicucan: { id: 'thaicucan', n: 'Thái Cực Lưỡng Nghi Ấn', el: null, tier: 4, k: 'shield', m: 2.6, cd: 4, d: 'Âm dương xoay chuyển, hóa giải lực đạo.' },
  cuuuban: { id: 'cuuuban', n: 'Cửu U Băng Phong', el: 'bang', tier: 4, k: 'atk', m: 3.3, cd: 3, d: 'Băng phong cả trời đất.' },
  // thuật pháp học riêng (sách thuật)
  ngukiem: { id: 'ngukiem', n: 'Ngự Kiếm Thuật', el: 'kim', tier: 2, k: 'atk', m: 1.9, cd: 2, sword: true, d: 'Điều khiển phi kiếm giết địch ngoài trăm bước.' },
  kimchungtrao: { id: 'kimchungtrao', n: 'Kim Chung Tráo', el: 'kim', tier: 2, k: 'shield', m: 1.6, cd: 4, d: 'Chuông vàng hộ thể.' },
  diahoa: { id: 'diahoa', n: 'Địa Hỏa Phần Thiên', el: 'hoa', tier: 3, k: 'dot', m: 1.4, cd: 3, d: 'Lửa đất trào lên thiêu đốt.' },
  liemloi: { id: 'liemloi', n: 'Liên Hoàn Lôi Kích', el: 'loi', tier: 3, k: 'multi', m: 1, cd: 3, d: 'Sét giật liên tiếp.' },
  honnguyenkhaithien: { id: 'honnguyenkhaithien', n: 'Hỗn Nguyên Khai Thiên Kiếm', el: 'hondon', get tier() { return growArtGrade().tier; }, get pq() { return growArtGrade().pq; }, k: 'atk', all: true, m: 4.5, cd: 4, w: 'kiem', sword: true, peak: true, d: 'Một kiếm khai thiên tích địa, kiếm khí hỗn độn quét ngang toàn bộ kẻ địch. Tăng phẩm theo Hỗn Nguyên Kinh.' },
  honnguyenphaptuong: { id: 'honnguyenphaptuong', n: 'Hỗn Nguyên Pháp tướng', el: 'hondon', get tier() { return growArtGrade().tier; }, get pq() { return growArtGrade().pq; }, k: 'atk', all: true, m: 4.0, cd: 4, peak: true, d: 'Hóa hiện pháp tướng Hỗn Nguyên cao vạn trượng, uy áp nghiền nát toàn bộ kẻ địch. Tăng phẩm theo Hỗn Nguyên Kinh.' },
  vankiemquytong: { id: 'vankiemquytong', n: 'Vạn Kiếm quy tông', el: 'hondon', get tier() { return growArtGrade().tier; }, get pq() { return growArtGrade().pq; }, k: 'atk', all: true, m: 4.2, cd: 3, w: 'kiem', sword: true, peak: true, d: 'Vạn đạo kiếm khí hỗn độn cùng quy về một hướng, xuyên thủng toàn bộ kẻ địch. Tăng phẩm theo Hỗn Nguyên Kinh.' },
  cuuchuyenphathien: { id: 'cuuchuyenphathien', n: 'Cửu Chuyển Phá Thiên Kiếm', el: 'kim', tier: 6, k: 'atk', m: 4.2, cd: 4, w: 'kiem', sword: true, peak: true, d: 'Chín lần chuyển kiếm thế, mỗi lần nặng thêm một tầng trời; kiếm thứ chín hạ xuống thì trời nứt. Chân truyền Cửu Chuyển Huyền Công.' },
  cuuchuyenkimthan: { id: 'cuuchuyenkimthan', n: 'Cửu Chuyển Kim Thân', el: 'kim', tier: 6, k: 'shield', m: 3.2, cd: 4, peak: true, d: 'Nhục thân hóa kim, đao kiếm chém vào chỉ tóe lửa. Chân truyền Cửu Chuyển Huyền Công.' },
  tichhuyettrungsinh: { id: 'tichhuyettrungsinh', n: 'Tích Huyết Trùng Sinh', el: 'moc', tier: 6, k: 'heal', m: 2.2, cd: 5, peak: true, hot: { m: 0.25, turns: 5 }, d: 'Còn một giọt máu là còn sống lại. Hồi máu tức thì, rồi huyết khí tiếp tục tái sinh trong 5 lượt. Chân truyền Cửu Chuyển Huyền Công.' },
  phapthientuongdia: { id: 'phapthientuongdia', n: 'Pháp Thiên Tượng Địa', el: 'tho', tier: 5, k: 'atk', m: 3.4, cd: 4, peak: true, d: 'Thân hóa cao vạn trượng, đầu đội trời chân đạp đất, một chưởng giáng xuống như trời sập. Uy lực tùy công pháp truyền thụ: Bát Cửu Huyền Công mạnh, Cửu Chuyển Huyền Công càng mạnh hơn.' },
  thatthapnhibien: { id: 'thatthapnhibien', n: 'Thất Thập Nhị Biến', el: 'phong', tier: 5, k: 'shield', m: 2.4, cd: 4, peak: true, d: 'Thân hóa thành vật khác trong một ý niệm, đòn đánh tới chỉ trúng ảo ảnh. Chân truyền Bát Cửu Huyền Công.' },
  sontrung: { id: 'sontrung', n: 'Di Sơn Thuật', el: 'tho', tier: 3, k: 'atk', m: 2.5, cd: 3, d: 'Dời núi đè địch.' },
  // --- bổ sung ---
  bangtruy: { id: 'bangtruy', n: 'Băng Trùy Thuật', el: 'bang', tier: 1, k: 'atk', m: 1.4, cd: 2, d: 'Mũi băng nhọn phóng thẳng vào huyệt.' },
  loichi: { id: 'loichi', n: 'Lôi Chỉ', el: 'loi', tier: 1, k: 'atk', m: 1.55, cd: 2, d: 'Một ngón tay, một tia sét nhỏ.' },
  tieuphong: { id: 'tieuphong', n: 'Phong Đao Thuật', el: 'phong', tier: 1, k: 'multi', m: 0.55, cd: 2, d: 'Ba lưỡi gió mỏng như giấy.' },
  uanhthich: { id: 'uanhthich', n: 'U Ảnh Thích', el: 'am', tier: 1, k: 'atk', m: 1.6, cd: 2, d: 'Đâm ra từ trong bóng của đối thủ.' },
  quangkiem: { id: 'quangkiem', n: 'Quang Kiếm Thuật', el: 'quang', tier: 1, k: 'atk', m: 1.45, cd: 2, sword: true, d: 'Ngưng ánh sáng thành kiếm.' },
  diachan: { id: 'diachan', n: 'Địa Chấn Kích', el: 'tho', tier: 2, k: 'atk', m: 1.85, cd: 3, d: 'Giậm chân một cái, đất nứt dưới chân địch.' },
  thuvuong: { id: 'thuvuong', n: 'Bách Thú Hống', el: 'tho', tier: 2, k: 'multi', m: 0.75, cd: 3, d: 'Gầm như hổ, vồ như báo, cắn như sói.' },
  phehon: { id: 'phehon', n: 'Phệ Hồn Thuật', el: 'am', tier: 2, k: 'dot', m: 1, cd: 3, d: 'Gặm nhấm thần hồn đối thủ từng chút một.' },
  thanhquang: { id: 'thanhquang', n: 'Thánh Quang Hộ Thể', el: 'quang', tier: 2, k: 'heal', m: 1.2, cd: 4, d: 'Ánh sáng bao lấy thân, vết thương khép lại.' },
  dieunhat: { id: 'dieunhat', n: 'Diệu Nhật Chiếu Không', el: 'quang', tier: 3, k: 'atk', m: 2.5, cd: 3, d: 'Một vầng mặt trời nhỏ nổ tung trước mặt địch.' },
  cuongphong: { id: 'cuongphong', n: 'Cuồng Phong Quyển', el: 'phong', tier: 3, k: 'multi', m: 0.95, cd: 3, d: 'Lốc xoáy cuốn địch lên rồi quật xuống.' },
  vanmaphe: { id: 'vanmaphe', n: 'Vạn Ma Phệ Thiên', el: 'am', tier: 4, k: 'atk', m: 3.5, cd: 3, d: 'Vạn bóng ma từ dưới đất trồi lên cắn xé.' },
  daiquangminh: { id: 'daiquangminh', n: 'Đại Quang Minh Ấn', el: 'quang', tier: 4, k: 'atk', m: 3.3, cd: 3, d: 'Ấn sáng như mặt trời giữa trưa, tà ma tan biến.' },
  phongloi: { id: 'phongloi', n: 'Phong Lôi Song Kích', el: 'phong', tier: 4, k: 'multi', m: 1.25, cd: 3, d: 'Gió dẫn đường cho sét.' },
  // Thần thông bản mệnh Yêu thú
  yeu_hoangao: { id: 'yeu_hoangao', n: 'Yêu Thú Cuồng Hống', el: null, tier: 1, k: 'atk', m: 1.5, cd: 2, d: 'Thần thông bản mệnh: Gầm vang rung chuyển đất trời, bạo phát yêu lực nghiền ép đối thủ.' },
  yeu_lietdiem: { id: 'yeu_lietdiem', n: 'Liệt Diễm Thôn Thiên', el: 'hoa', tier: 2, k: 'atk', m: 1.8, cd: 2, d: 'Thần thông bản mệnh: Phun ra yêu hỏa ngập trời thiêu rụi mục tiêu.' },
  yeu_bangphach: { id: 'yeu_bangphach', n: 'Băng Phách Huyền Quang', el: 'bang', tier: 2, k: 'atk', m: 1.8, cd: 2, d: 'Thần thông bản mệnh: Ngưng tụ hàn băng thấu xương đóng băng đối phương.' },
  yeu_cuongloi: { id: 'yeu_cuongloi', n: 'Cuồng Lôi Oanh Kích', el: 'loi', tier: 2, k: 'atk', m: 1.9, cd: 2, d: 'Thần thông bản mệnh: Dẫn thiên lôi oanh tạc kinh hoàng.' },
  yeu_phongtrao: { id: 'yeu_phongtrao', n: 'Liệt Phong Yêu Trảo', el: 'phong', tier: 2, k: 'multi', m: 0.8, cd: 2, d: 'Thần thông bản mệnh: Vuốt sắc xé gió trảm kích ba liên hoàn.' },
  yeu_uhaichao: { id: 'yeu_uhaichao', n: 'U Hải Nộ Triều', el: 'thuy', tier: 2, k: 'atk', m: 1.7, cd: 2, d: 'Thần thông bản mệnh: Thủy triều yêu khí cuồn cuộn dâng trào nuốt chửng quân thù.' },
  yeu_kimquang: { id: 'yeu_kimquang', n: 'Phá Giáp Kim Quang', el: 'kim', tier: 2, k: 'atk', m: 1.85, cd: 2, d: 'Thần thông bản mệnh: Kim mang sắc bén xuyên thủng hộ thể.' },
  yeu_trongnham: { id: 'yeu_trongnham', n: 'Trọng Nham Hộ Thể', el: 'tho', tier: 2, k: 'shield', m: 1.8, cd: 3, d: 'Thần thông bản mệnh: Tường đá nham thạch bao bọc nhục thân.' },
  yeu_hacvu: { id: 'yeu_hacvu', n: 'Thực Hồn Hắc Vụ', el: 'am', tier: 2, k: 'dot', m: 1.0, cd: 3, d: 'Thần thông bản mệnh: Màn sương yêu ám gặm nhấm sinh cơ.' },
  yeu_tinhhoa: { id: 'yeu_tinhhoa', n: 'Nguyệt Hoa Tịnh Thể', el: 'quang', tier: 2, k: 'heal', m: 1.4, cd: 3, d: 'Thần thông bản mệnh: Hấp thụ nguyệt hoa chữa lành vết thương nhục thân.' },
  yeu_vanmoc: { id: 'yeu_vanmoc', n: 'Vạn Mộc Tác Hồn', el: 'moc', tier: 2, k: 'dot', m: 0.95, cd: 3, d: 'Thần thông bản mệnh: Dây leo yêu mộc trói buộc và hút cạn sinh cơ.' },
  // ===== Thuật Pháp / Võ Kỹ Bốn Thần Giới =====
  // --- Thiên Đình ---
  sk_td_tienquang: { id: 'sk_td_tienquang', n: 'Kim Khuyết Tiên Quang', el: 'quang', tier: 2, k: 'atk', m: 1.85, cd: 2, celestial: 'thiendinh', celestialTier: 'low', d: 'Phóng ra luồng tiên quang từ Nam Thiên Môn xuyên phá tà khí.' },
  sk_td_phongloi: { id: 'sk_td_phongloi', n: 'Cửu Thiên Lôi Độn Kích', el: 'loi', tier: 3, k: 'multi', m: 1.0, cd: 3, celestial: 'thiendinh', celestialTier: 'mid', d: 'Ba luồng tử lôi giáng xuống liên hoàn từ chín tầng mây.' },
  sk_td_thienhathuy: { id: 'sk_td_thienhathuy', n: 'Thiên Hà Tinh Đào Lạc', el: 'thuy', tier: 4, k: 'atk', all: true, m: 3.2, cd: 3, celestial: 'thiendinh', celestialTier: 'high', d: 'Sóng sao dải Ngân Hà cuộn trào nhấn chìm toàn bộ quân thù.' },
  sk_td_batquaihoa: { id: 'sk_td_batquaihoa', n: 'Bát Quái Tam Muội Chân Hỏa', el: 'hoa', tier: 5, k: 'dot', m: 1.9, cd: 3, celestial: 'thiendinh', celestialTier: 'high', d: 'Lửa thần lò Bát Quái Đâu Suất Cung thiêu đốt thần hồn và nhục thân.' },
  sk_td_linhtieuchuong: { id: 'sk_td_linhtieuchuong', n: 'Lăng Tiêu Trấn Thế Thần Chưởng', el: 'quang', tier: 6, k: 'atk', all: true, m: 4.4, cd: 4, celestial: 'thiendinh', celestialTier: 'high', d: 'Bàn tay kim quang của Thiên Đế giáng xuống từ chín tầng trời, nghiền nát càn khôn.' },

  // --- Địa Phủ ---
  sk_dp_cauhon: { id: 'sk_dp_cauhon', n: 'Hoàng Tuyền Câu Hồn Thích', el: 'am', tier: 2, k: 'atk', m: 1.9, cd: 2, celestial: 'diaphu', celestialTier: 'low', d: 'Liềm câu hồn câu thẳng vào nguyên thần đối thủ.' },
  sk_dp_bingan: { id: 'sk_dp_bingan', n: 'Bỉ Ngạn Hoa Lạc Huyết Thần', el: 'am', tier: 3, k: 'dot', m: 1.35, cd: 3, celestial: 'diaphu', celestialTier: 'mid', d: 'Ngàn cánh hoa bỉ ngạn nở rộ hút cạn sinh cơ mục tiêu.' },
  sk_dp_phanbut: { id: 'sk_dp_phanbut', n: 'Sinh Tử Phán Quan Bút', el: 'am', tier: 4, k: 'atk', m: 3.5, cd: 3, celestial: 'diaphu', celestialTier: 'high', d: 'Một nét bút son gạch tên trên sổ sinh tử, đoạn tuyệt thọ mệnh.' },
  sk_dp_vongxuyen: { id: 'sk_dp_vongxuyen', n: 'Vong Xuyên Nộ Đào Trảm', el: 'thuy', tier: 5, k: 'atk', all: true, m: 3.8, cd: 4, celestial: 'diaphu', celestialTier: 'high', d: 'Sóng nước đỏ thẫm sông Vong Xuyên nhấn chìm và làm tan biến thần hồn toàn bộ kẻ địch.' },
  sk_dp_luanhoian: { id: 'sk_dp_luanhoian', n: 'Lục Đạo Luân Hồi Tuyệt Diệt Ấn', el: 'am', tier: 6, k: 'atk', all: true, m: 4.5, cd: 4, celestial: 'diaphu', celestialTier: 'high', d: 'Sáu luồng sáng luân hồi nghiền nát thân xác và đày ải hồn phách đối thủ vào ngục vô gián.' },

  // --- Yêu Giới ---
  sk_yg_toicot: { id: 'sk_yg_toicot', n: 'Hắc Phong Toái Cốt Trảo', el: 'am', tier: 2, k: 'atk', m: 1.95, cd: 2, race: 'yao', celestial: 'yeugioi', celestialTier: 'low', d: 'Vuốt đen cuồng bạo xé nát giáp sắt hộ thể.' },
  sk_yg_banty: { id: 'sk_yg_banty', n: 'Bàn Ty Thiên La Võng', el: 'moc', tier: 3, k: 'dot', m: 1.35, cd: 3, race: 'yao', celestial: 'yeugioi', celestialTier: 'mid', d: 'Tơ nhện ngàn năm của Bàn Ty Động trói chặt và ăn mòn kẻ địch.' },
  sk_yg_suda: { id: 'sk_yg_suda', n: 'Sư Đà Liệt Thiên Hống', el: 'tho', tier: 4, k: 'atk', all: true, m: 3.2, cd: 3, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', d: 'Tiếng gầm của Sư Đà Vương làm nứt toác mặt đất, chấn nhiếp toàn bộ quân thù.' },
  sk_yg_tichloibong: { id: 'sk_yg_tichloibong', n: 'Bình Thiên Hỗn Thiết Bổng', el: 'loi', tier: 5, k: 'atk', m: 3.9, cd: 3, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', d: 'Côn sắt vạn cân mang theo sấm sét Tích Lôi đập nát càn khôn.' },
  sk_yg_hoaquagay: { id: 'sk_yg_hoaquagay', n: 'Đại Náo Thiên Cung Nhất Kích', el: 'kim', tier: 6, k: 'atk', all: true, m: 4.3, cd: 4, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', d: 'Một gậy Tề Thiên quét ngang đất trời, phá tan vạn pháp hộ thể của kẻ địch.' },

  // --- Linh Sơn ---
  sk_ls_kimcuong: { id: 'sk_ls_kimcuong', n: 'Kim Cương Hộ Pháp Trảo', el: 'kim', tier: 2, k: 'shield', m: 1.8, cd: 3, celestial: 'linhson', celestialTier: 'low', d: 'Đòn đánh cứng cỏi của hộ pháp kim cương chấn lui yêu ma.' },
  sk_ls_batnha: { id: 'sk_ls_batnha', n: 'Bát Nhã Tâm Chú', el: 'quang', tier: 3, k: 'heal', m: 1.5, cd: 4, celestial: 'linhson', celestialTier: 'mid', d: 'Tụng niệm tâm chú hồi phục vết thương và thanh tẩy độc tố.' },
  sk_ls_hanglong: { id: 'sk_ls_hanglong', n: 'Thập Bát La Hán Hàng Long Kích', el: 'kim', tier: 4, k: 'multi', m: 1.25, cd: 3, celestial: 'linhson', celestialTier: 'high', d: 'Mười tám đòn quyền liên hoàn giáng phục chân long.' },
  sk_ls_camlo: { id: 'sk_ls_camlo', n: 'Nam Hải Cam Lộ Tịnh Thể', el: 'quang', tier: 5, k: 'heal', m: 2.2, cd: 4, hot: { m: 0.35, turns: 5 }, celestial: 'linhson', celestialTier: 'high', d: 'Nước cam lộ cành dương liễu hồi phục cực đại sinh mạng và liên tục hồi phục trong 5 lượt.' },
  sk_ls_nhulaichuong: { id: 'sk_ls_nhulaichuong', n: 'Vạn Phật Triều Tông Như Lai Chưởng', el: 'quang', tier: 6, k: 'atk', all: true, m: 4.5, cd: 4, celestial: 'linhson', celestialTier: 'high', d: 'Bàn tay Phật Tổ úp xuống hóa thành Ngũ Hành Sơn, phong ấn và tiêu diệt toàn bộ kẻ địch.' },

};
export const BEAST_INNATE_SKILLS: Record<string, string> = {
  hoa: 'yeu_lietdiem',
  bang: 'yeu_bangphach',
  loi: 'yeu_cuongloi',
  phong: 'yeu_phongtrao',
  thuy: 'yeu_uhaichao',
  kim: 'yeu_kimquang',
  tho: 'yeu_trongnham',
  am: 'yeu_hacvu',
  quang: 'yeu_tinhhoa',
  moc: 'yeu_vanmoc',
};
/** Không giới hạn cố định: chiêu nào xếp được vào kinh mạch thì mang theo được (số lớn chỉ để chặn lỗi). */
export const MAX_SKILLS = 99;
/** Chiêu không theo một hệ: nhãn và màu riêng. */
export const SK_TAG: Record<string, { n: string; c: string[] }> = {
  nguhanhan: { n: 'Ngũ hành', c: ['#c9a227', '#4f8a3a', '#3f78b5', '#c0473a', '#9a6b3a'] },
  khaithien: { n: 'Hỗn độn', c: ['#c9a227', '#4f8a3a', '#3f78b5', '#c0473a', '#9a6b3a', '#7fb6d8', '#7a55b5', '#5f9e8f', '#3a3048', '#e0c25a'] },
  thaicucan: { n: 'Âm dương', c: ['#2a241f', '#f2ead6'] },
};
export const SK_KIND: Record<SkillKind, string> = { atk: 'Công kích', multi: 'Liên kích', dot: 'Kéo dài', heal: 'Hồi phục', shield: 'Hộ thể' };
/** Mô tả ngắn hiệu ứng của chiêu. */
export function skillEffect(k: Skill): string {
  switch (k.k) {
    case 'atk': return `${k.m}× công${k.all ? ', toàn bộ kẻ địch' : ''}`;
    case 'multi': return `3 đòn, mỗi đòn ${k.m}× công`;
    case 'dot': return `${k.m}× công + ăn mòn 3 lượt`;
    case 'heal': return `hồi ${Math.round(18 * k.m)}% khí huyết${k.hot ? `, rồi mỗi lượt hồi thêm ${Math.round(18 * k.m * k.hot.m)}% trong ${k.hot.turns} lượt` : ''}`;
    case 'shield': return `hộ thuẫn ${k.m}×`;
  }
  return '';
}
/** Tên hệ và màu của chiêu: đơn hệ một màu, đa hệ (SK_TAG) nhiều màu, vô hệ trả null. */
export function skHue(sk: Pick<Skill, 'id' | 'el'>): { n: string; c: string[] } | null {
  if (sk.el === 'hondon') return { n: 'Hỗn Độn', c: SK_TAG.khaithien.c };
  if (sk.el) return { n: EL[sk.el].n, c: [EL[sk.el].c] };
  return SK_TAG[sk.id] ?? null;
}
/** Nền CSS cho một dải màu hệ: một màu thì tô đặc, nhiều màu thì chuyển sắc. */
export const hueBg = (c: string[]) => (c.length === 1 ? c[0] : `linear-gradient(90deg, ${c.join(', ')})`);
// Chân truyền các phong vũ khí (chỉ phong chủ truyền).
const PEAK_SK: [string, string, Weapon, number, SkillKind, number, number, string][] = [
  ['pk_thanhphong', 'Thanh Phong Kiếm Quyết', 'kiem', 2, 'multi', 0.85, 2, 'Ba kiếm nhẹ như gió thoảng, kiếm thứ ba mới lộ sát cơ.'],
  ['pk_vankiem', 'Vạn Kiếm Quy Tông', 'kiem', 4, 'multi', 1.3, 3, 'Phi kiếm phân hóa thành vạn, cùng quy về một điểm.'],
  ['pk_doangiang', 'Nhất Kiếm Đoạn Giang', 'kiem', 5, 'atk', 4.0, 4, 'Một kiếm chém xuống, sông lớn ngừng chảy ba hơi thở.'],
  ['pd_bonloi', 'Bôn Lôi Đao', 'dao', 2, 'atk', 2.0, 2, 'Đao ra như sấm chạy, không để địch kịp nhìn.'],
  ['pd_thapbattram', 'Cuồng Đao Thập Bát Trảm', 'dao', 3, 'multi', 1.05, 3, 'Mười tám nhát đao liên miên, nhát sau nặng hơn nhát trước.'],
  ['pd_khaison', 'Khai Sơn Đao', 'dao', 4, 'atk', 3.3, 3, 'Đao thế bổ núi, chém cả hộ thể cương khí.'],
  ['pt_phatran', 'Phá Trận Thương', 'thuong', 1, 'atk', 1.5, 2, 'Thương pháp của kỵ binh, một đâm xuyên ba lớp giáp.'],
  ['pt_bachdieu', 'Bách Điểu Triều Hoàng Thương', 'thuong', 3, 'multi', 1.0, 3, 'Mũi thương nở thành trăm bóng chim.'],
  ['pt_bachlong', 'Bạch Long Quán Nhật', 'thuong', 4, 'atk', 3.4, 3, 'Thương như rồng trắng đâm thẳng lên mặt trời.'],
  ['pq_bangson', 'Băng Sơn Quyền', 'quyen', 1, 'atk', 1.5, 2, 'Quyền nặng như núi lở.'],
  ['pq_bavuong', 'Bá Vương Quyền', 'quyen', 2, 'atk', 2.0, 2, 'Lấy lực phá xảo, một quyền một mạng.'],
  ['pq_thatthuong', 'Thất Thương Quyền', 'quyen', 3, 'atk', 2.7, 3, 'Bảy luồng kình lực thương địch, cũng thương chính mình nếu tu chưa tới.'],
  ['pq_longtuong', 'Long Tượng Quyền', 'quyen', 4, 'multi', 1.25, 3, 'Sức của long, thế của tượng — ba quyền liên hoàn.'],
  ['pc_phienthien', 'Phiên Thiên Chưởng', 'chuong', 4, 'atk', 3.3, 3, 'Bàn tay lật lên, trời đất đảo ngược.'],
  ['pb_lienchau', 'Liên Châu Tiễn', 'cung', 1, 'multi', 0.6, 2, 'Ba mũi tên nối đuôi như chuỗi hạt.'],
  ['pb_xuyenvan', 'Xuyên Vân Tiễn', 'cung', 2, 'atk', 2.0, 2, 'Mũi tên xuyên mây, trúng đích ngoài nghìn trượng.'],
  ['pb_lactinh', 'Lạc Tinh Tiễn', 'cung', 3, 'atk', 2.7, 3, 'Bắn rơi sao trời.'],
  ['pb_xanhat', 'Xạ Nhật Thần Tiễn', 'cung', 4, 'atk', 3.4, 3, 'Mũi tên mang lửa mặt trời.'],
  ['px_thutam', 'Thứ Tâm Kích', 'kich', 1, 'atk', 1.5, 2, 'Mũi kích nhắm thẳng tim.'],
  ['px_phuongthien', 'Phương Thiên Kích Pháp', 'kich', 2, 'atk', 1.95, 2, 'Kích pháp đại khai đại hợp của danh tướng xưa.'],
  ['px_hoanhtao', 'Hoành Tảo Thiên Quân', 'kich', 3, 'multi', 1.0, 3, 'Một vòng quét ngang, nghìn quân ngã rạp.'],
  ['px_doantruong', 'Bá Vương Đoạn Trường Kích', 'kich', 4, 'atk', 3.4, 3, 'Đòn cuối của bá vương, đứt ruột cả người lẫn ngựa.'],
];
for (const [id, n, w, tier, k, m, cd, d] of PEAK_SK) SKILLS[id] = { id, n, el: null, tier, k, m, cd, w, peak: true, sword: w === 'kiem' || undefined, d };
// Gắn loại vũ khí cho các chiêu sẵn có.
for (const [id, w] of Object.entries({ luuthuykiem: 'kiem', ngukiem: 'kiem', canhkimkiem: 'kiem', quangkiem: 'kiem', tieuphong: 'dao', chuongphong: 'chuong', lietduongchuong: 'chuong', loiquang: 'chuong', loiamchuong: 'chuong', huyetsatthu: 'chuong' } as Record<string, Weapon>)) if (SKILLS[id]) SKILLS[id].w = w;
for (const [id, g] of Object.entries({ tutieuloi: 5, vanmaphe: 5, cuuuban: 5, khaithien: 6 })) if (SKILLS[id]) SKILLS[id].tier = g;
{
  // phẩm võ công: xếp theo hệ số trong cùng giai và loại
  const groups: Record<string, Skill[]> = {};
  for (const k of Object.values(SKILLS)) if (k.pq === undefined) (groups[k.tier + k.k] ||= []).push(k);
  for (const arr of Object.values(groups)) {
    arr.sort((a, b) => a.m - b.m);
    arr.forEach((k, i) => (k.pq = arr.length === 1 ? 1 : Math.round((i / (arr.length - 1)) * 3)));
  }
}
export const skillGrade = (k: Skill) => artGradeLabel(k.tier, k.pq ?? 0);

// ---------- Linh thảo ----------
export interface Herb {
  id: string;
  n: string;
  tier: number; // 1..6
  reg: string[];
  el: El;
}
export const HERBS: Record<string, Herb> = {
  bandao: { id: 'bandao', n: 'Bàn Đào Tiên Quả', tier: 6, reg: ['trungtho'], el: 'moc' },
  binganhoa: { id: 'binganhoa', n: 'Bỉ Ngạn Hoa Tinh', tier: 5, reg: ['namman'], el: 'hoa' },
  bodhitu: { id: 'bodhitu', n: 'Bồ Đề Tử', tier: 5, reg: ['tayluong'], el: 'quang' },
  ngungkhithao: { id: 'ngungkhithao', n: 'Ngưng Khí Thảo', tier: 1, reg: ['trungtho', 'vanmong', 'namman', 'bacminh', 'vanyeu'], el: 'moc' },
  xichdiepthao: { id: 'xichdiepthao', n: 'Xích Diệp Thảo', tier: 1, reg: ['tayluong', 'namman', 'trungtho'], el: 'hoa' },
  thanhtamlien: { id: 'thanhtamlien', n: 'Thanh Tâm Liên', tier: 1, reg: ['vanmong', 'trungtho', 'namhai', 'tayhai', 'bachai'], el: 'thuy' },
  hoangtinh: { id: 'hoangtinh', n: 'Hoàng Tinh', tier: 1, reg: ['trungtho', 'bacminh', 'tayluong', 'vanyeu'], el: 'tho' },
  baclinhchi: { id: 'baclinhchi', n: 'Bách Niên Linh Chi', tier: 2, reg: ['namman', 'vanmong', 'trungtho', 'vanyeu'], el: 'moc' },
  tuyetlien: { id: 'tuyetlien', n: 'Thiên Sơn Tuyết Liên', tier: 2, reg: ['bacminh', 'cucbac', 'bachai'], el: 'bang' },
  hoaduongqua: { id: 'hoaduongqua', n: 'Hỏa Dương Quả', tier: 2, reg: ['tayluong'], el: 'hoa' },
  kimtuyenthao: { id: 'kimtuyenthao', n: 'Kim Tuyến Thảo', tier: 2, reg: ['trungtho', 'tayluong', 'tayhai'], el: 'kim' },
  longtuthao: { id: 'longtuthao', n: 'Long Tu Thảo', tier: 3, reg: ['donghai', 'vanmong', 'namhai', 'tayhai', 'noihai'], el: 'thuy' },
  thienniensam: { id: 'thienniensam', n: 'Thiên Niên Huyết Sâm', tier: 3, reg: ['namman', 'bacminh', 'vanyeu'], el: 'tho' },
  loikichmoc: { id: 'loikichmoc', n: 'Lôi Kích Mộc', tier: 3, reg: ['donghai', 'tienchau', 'namhai', 'noihai'], el: 'loi' },
  phongvuthao: { id: 'phongvuthao', n: 'Phong Vũ Thảo', tier: 3, reg: ['vanmong', 'tienchau', 'bacminh', 'cucbac', 'noihai'], el: 'phong' },
  cuuchuyenhoa: { id: 'cuuchuyenhoa', n: 'Cửu Chuyển Huyền Hoa', tier: 4, reg: ['namman', 'tienchau', 'vanyeu'], el: 'moc' },
  bangtamthao: { id: 'bangtamthao', n: 'Băng Tâm Thảo', tier: 4, reg: ['bacminh', 'tienchau', 'cucbac', 'bachai'], el: 'bang' },
  hoalongqua: { id: 'hoalongqua', n: 'Hỏa Long Quả', tier: 4, reg: ['tayluong', 'donghai', 'namhai', 'tayhai'], el: 'hoa' },
  vannienthanhmoc: { id: 'vannienthanhmoc', n: 'Vạn Niên Thanh Mộc Tâm', tier: 5, reg: ['namman', 'tienchau', 'vanyeu'], el: 'moc' },
  tinhthannhuy: { id: 'tinhthannhuy', n: 'Tinh Thần Nhụy', tier: 5, reg: ['donghai', 'tienchau', 'namhai', 'noihai'], el: 'thuy' },
  hongmongqua: { id: 'hongmongqua', n: 'Hồng Mông Đạo Quả', tier: 6, reg: ['tienchau'], el: 'tho' },
  uminhthao: { id: 'uminhthao', n: 'U Minh Thảo', tier: 2, reg: ['vanmong', 'namman', 'tayluong', 'vanyeu'], el: 'am' },
  thienquanghoa: { id: 'thienquanghoa', n: 'Thiên Quang Hoa', tier: 2, reg: ['tayluong', 'tienchau', 'bacminh', 'cucbac'], el: 'quang' },
  dahonlien: { id: 'dahonlien', n: 'Dạ Hồn Liên', tier: 4, reg: ['vanmong', 'tienchau'], el: 'am' },
  kimodienqua: { id: 'kimodienqua', n: 'Kim Ô Diệm Quả', tier: 4, reg: ['tayluong', 'donghai'], el: 'quang' },
};

// ---------- Đan dược ----------
export type PillKind = 'cult' | 'heal' | 'break' | 'life' | 'stat' | 'detox' | 'root' | 'mutate';
export interface Pill {
  giai?: number;
  id: string;
  n: string;
  k: PillKind;
  tier: number;
  v: number;
  d: string;
  rec: string[]; // linh thảo cần
  stat?: string;
}
export const PILLS: Record<string, Pill> = {
  tukhi: { id: 'tukhi', n: 'Tụ Khí Đan', k: 'cult', tier: 1, v: 25, rec: ['ngungkhithao', 'hoangtinh'], d: 'Tăng tu vi cho tu sĩ Luyện Khí.' },
  hoixuandan: { id: 'hoixuandan', n: 'Hồi Xuân Đan', k: 'heal', tier: 1, v: 40, rec: ['ngungkhithao', 'thanhtamlien'], d: 'Chữa thương nhẹ.' },
  khaimach: { id: 'khaimach', n: 'Khai Mạch Đan', k: 'break', tier: 1, v: 0.2, rec: ['xichdiepthao', 'ngungkhithao', 'hoangtinh'], d: 'Giúp phàm nhân đả thông kinh mạch, bước vào Luyện Khí.' },
  giaidoc: { id: 'giaidoc', n: 'Bách Độc Giải', k: 'detox', tier: 1, v: 30, rec: ['thanhtamlien', 'xichdiepthao'], d: 'Giải độc, chữa nội thương.' },
  trucco: { id: 'trucco', n: 'Trúc Cơ Đan', k: 'break', tier: 2, v: 0.25, rec: ['baclinhchi', 'kimtuyenthao', 'ngungkhithao'], d: 'Bảo đan mà mọi tu sĩ Luyện Khí mơ ước. Tăng mạnh tỉ lệ Trúc Cơ.' },
  ngungnguyen: { id: 'ngungnguyen', n: 'Ngưng Nguyên Đan', k: 'cult', tier: 2, v: 30, rec: ['baclinhchi', 'thanhtamlien'], d: 'Tăng tu vi cho tu sĩ Trúc Cơ.' },
  tucotthuc: { id: 'tucotthuc', n: 'Tục Cốt Đan', k: 'heal', tier: 2, v: 70, rec: ['baclinhchi', 'hoaduongqua'], d: 'Nối xương liền thịt, chữa trọng thương.' },
  ketdan: { id: 'ketdan', n: 'Kết Kim Đan', k: 'break', tier: 3, v: 0.22, rec: ['longtuthao', 'thienniensam', 'kimtuyenthao'], d: 'Hỗ trợ ngưng kết kim đan.' },
  hoanguyen: { id: 'hoanguyen', n: 'Hóa Nguyên Đan', k: 'cult', tier: 3, v: 32, rec: ['thienniensam', 'tuyetlien'], d: 'Tăng tu vi cho tu sĩ Kết Đan.' },
  diennien: { id: 'diennien', n: 'Diên Niên Đan', k: 'life', tier: 3, v: 30, rec: ['thienniensam', 'baclinhchi', 'tuyetlien'], d: 'Kéo dài thọ nguyên. Mỗi người chỉ hiệu nghiệm vài viên.' },
  hoaanh: { id: 'hoaanh', n: 'Hóa Anh Đan', k: 'break', tier: 4, v: 0.2, rec: ['cuuchuyenhoa', 'longtuthao', 'loikichmoc'], d: 'Hỗ trợ phá đan thành anh.' },
  duonganh: { id: 'duonganh', n: 'Dưỡng Anh Đan', k: 'cult', tier: 4, v: 34, rec: ['cuuchuyenhoa', 'phongvuthao'], d: 'Tăng tu vi cho tu sĩ Nguyên Anh.' },
  tayconghoan: { id: 'tayconghoan', n: 'Tẩy Tủy Đan', k: 'root', tier: 3, v: 1, rec: ['tuyetlien', 'longtuthao', 'thienniensam'], d: 'Tẩy kinh phạt tủy. Có thể làm linh căn tinh khiết hơn một bậc.' },
  ngungthan: { id: 'ngungthan', n: 'Ngưng Thần Đan', k: 'break', tier: 5, v: 0.18, rec: ['vannienthanhmoc', 'bangtamthao', 'hoalongqua'], d: 'Hỗ trợ Hóa Thần.' },
  thanhtamdan: { id: 'thanhtamdan', n: 'Tĩnh Tâm Đan', k: 'stat', tier: 2, v: 1, stat: 'tam', rec: ['thanhtamlien', 'tuyetlien'], d: 'Đạo tâm +1.' },
  khaitridan: { id: 'khaitridan', n: 'Khai Trí Đan', k: 'stat', tier: 3, v: 1, stat: 'ngo', rec: ['phongvuthao', 'thanhtamlien', 'baclinhchi'], d: 'Ngộ tính +1.' },
  luyencotdan: { id: 'luyencotdan', n: 'Luyện Cốt Đan', k: 'stat', tier: 2, v: 1, stat: 'can', rec: ['hoaduongqua', 'hoangtinh'], d: 'Căn cốt +1.' },
  hoathan: { id: 'hoathan', n: 'Hóa Thần Linh Dịch', k: 'cult', tier: 5, v: 36, rec: ['vannienthanhmoc', 'tinhthannhuy'], d: 'Tăng tu vi cho tu sĩ Hóa Thần trở lên.' },
  phahu: { id: 'phahu', n: 'Phá Hư Đan', k: 'break', tier: 6, v: 0.16, rec: ['tinhthannhuy', 'vannienthanhmoc', 'loikichmoc'], d: 'Hỗ trợ đột phá Luyện Hư.' },
  hopnguyen: { id: 'hopnguyen', n: 'Hợp Nguyên Đan', k: 'break', tier: 7, v: 0.15, rec: ['hongmongqua', 'tinhthannhuy', 'bangtamthao'], d: 'Hỗ trợ đột phá Hợp Thể.' },
  daithua: { id: 'daithua', n: 'Đại Thừa Đạo Đan', k: 'break', tier: 8, v: 0.14, rec: ['hongmongqua', 'vannienthanhmoc', 'hoalongqua'], d: 'Hỗ trợ đột phá Đại Thừa.' },
  truongsinh: { id: 'truongsinh', n: 'Trường Sinh Đan', k: 'life', tier: 6, v: 300, rec: ['hongmongqua', 'vannienthanhmoc', 'cuuchuyenhoa'], d: 'Thêm vài trăm năm thọ nguyên.' },
  dihua_dan: { id: 'dihua_dan', n: 'Dị Hóa Niết Bàn Đan', k: 'mutate', tier: 4, v: 1, rec: ['tuduehuyet', 'cuuchuyenhoa', 'loikichmoc'], d: 'Đan dược thượng cổ ngưng tụ từ dị thú tinh huyết, có khả năng trùng tố huyết mạch, phá vỡ xiềng xích định hình con đường tiến hóa, cho phép rẽ sang nhánh tiến hóa khác.' },
};
export const PILL_GRADE = PHAM;
/** Giai của đan theo cảnh giới dùng; đan phàm tục (chữa thương nhẹ, giải độc) là Phàm phẩm. */
const PILL_GIAI_OF_TIER = [0, 1, 2, 2, 3, 4, 5, 5, 6];
const PILL_PHAM = new Set(['hoixuandan', 'giaidoc']);
export const pillGiai = (p: Pill) => p.giai ?? (PILL_PHAM.has(p.id) ? 0 : PILL_GIAI_OF_TIER[Math.min(8, p.tier)]);
export const pillGrade = (p: Pill, g = 1) => artGradeLabel(pillGiai(p), g);
export const GRADE_MULT = [0.8, 1, 1.3, 1.7];

// ---------- Vật liệu ----------
export interface Mat {
  id: string;
  n: string;
  tier: number;
  d: string;
}
export const MATS: Record<string, Mat> = {
  thienhathuy: { id: 'thienhathuy', n: 'Thiên Hà Thần Thủy', tier: 5, d: 'Nước sông Ngân lấp lánh như tinh tú, dùng tôi luyện pháp bảo thần binh.' },
  dausuathoa: { id: 'dausuathoa', n: 'Đâu Suất Chân Hỏa', tier: 6, d: 'Tia lửa từ lò Bát Quái của Lão Quân, nung chảy vạn vật, luyện thần binh chí bảo.' },
  hoangtuyenthuy: { id: 'hoangtuyenthuy', n: 'Hoàng Tuyền Huyết Thủy', tier: 5, d: 'Nước đầu nguồn Hoàng Tuyền, u hàn thấu cốt, dùng luyện chí bảo âm sát.' },
  tamsinhthach_mat: { id: 'tamsinhthach_mat', n: 'Tam Sinh Thạch Toái Phiến', tier: 6, d: 'Mảnh vỡ đá Tam Sinh thấu suốt tiền kiếp hậu kiếp, dùng luyện bảo hộ mệnh.' },
  thaicoyaudan: { id: 'thaicoyaudan', n: 'Thái Cổ Yêu Đan', tier: 6, d: 'Yêu đan của đại yêu thời hồng hoang, ẩn chứa khí huyết và yêu lực bàng bạc.' },
  chanlonghuyet: { id: 'chanlonghuyet', n: 'Chân Long Huyết Tinh', tier: 5, d: 'Tinh huyết long tộc thuần huyết, tăng cường thể phách và rèn luyện long giáp.' },
  batcongduc: { id: 'batcongduc', n: 'Bát Công Đức Thủy', tier: 5, d: 'Nước trong ao Bát Công Đức ở Linh Sơn, gột rửa nghiệp chướng, tinh luyện phật bảo.' },
  xaloi: { id: 'xaloi', n: 'Kim Cang Xá Lợi', tier: 6, d: 'Xá lợi của cao tăng đắc đạo viên tịch, tỏa hào quang kim sắc bất hoại.' },
  cotuhuyet: { id: 'cotuhuyet', n: 'Tổ thú tinh huyết', tier: 6, d: 'Một giọt máu của dị thú chép trong Sơn Hải Kinh, đỏ như than hồng, nặng như chì.' },
  tuduehuyet: { id: 'tuduehuyet', n: 'Huyết mạch tinh huyết', tier: 4, d: 'Tinh huyết của hậu duệ dị thú thượng cổ, còn vương uy áp của tổ tiên.' },
  longthu: { id: 'longthu', n: 'Lông yêu thú', tier: 1, d: 'Lông mềm còn vương yêu khí.' },
  dayeu: { id: 'dayeu', n: 'Da yêu thú', tier: 1, d: 'Da dày, dùng làm hộ giáp.' },
  docnang: { id: 'docnang', n: 'Độc nang', tier: 2, d: 'Túi độc của yêu trùng, dân luyện độc rất thích.' },
  yeudan: { id: 'yeudan', n: 'Yêu đan', tier: 2, d: 'Tinh hoa tu vi của yêu thú. Phẩm cấp theo yêu thú.' },
  longlan: { id: 'longlan', n: 'Giao long lân', tier: 4, d: 'Vảy giao long, cứng hơn huyền thiết.' },
  linhmoc: { id: 'linhmoc', n: 'Linh mộc tâm', tier: 4, d: 'Lõi cây ngàn năm, luyện linh bảo cực tốt.' },
  hondonthach: { id: 'hondonthach', n: 'Hỗn Độn Thạch', tier: 9, d: 'Đá ngưng từ khí hỗn độn trước thuở khai thiên, chỉ có ở Hỗn Độn giới. Khi Hỗn Độn Kiếm (Tàn khuyết) hoặc Nửa ngọc bội đôi (Tàn khuyết) đạt Hỗn Độn Linh Bảo cực phẩm, dùng đá này để thăng lên Hỗn Độn Chí Bảo hạ phẩm.' },
  hondonkim: { id: 'hondonkim', n: 'Hỗn Độn Thần Kim', tier: 9, d: 'Nguyên liệu luyện khí cấp bậc Hỗn Độn, ngưng kết từ tinh hoa kim thiết thuở hồng mông. Dùng để rèn Hỗn Độn Kiếm / Ngọc bội đôi lên Hỗn Độn Chí Bảo trung phẩm.' },
  hondonngoc: { id: 'hondonngoc', n: 'Hỗn Độn Đạo Ngọc', tier: 9, d: 'Nguyên liệu luyện khí cấp bậc Hỗn Độn, ẩn chứa đạo vận tiên thiên. Dùng để rèn Hỗn Độn Kiếm / Ngọc bội đôi lên Hỗn Độn Chí Bảo thượng phẩm.' },
  hondonhoa: { id: 'hondonhoa', n: 'Hỗn Độn Nguyên Tinh', tier: 9, d: 'Nguyên liệu luyện khí cấp bậc Hỗn Độn, tinh hoa bản nguyên của Hỗn Độn giới. Dùng để rèn Hỗn Độn Kiếm / Ngọc bội đôi lên Hỗn Độn Chí Bảo cực phẩm.' },
  hukhongthach: { id: 'hukhongthach', n: 'Hư không thạch', tier: 6, d: 'Đá sinh ra trong khe nứt không gian.' },
  huyenthiet: { id: 'huyenthiet', n: 'Huyền thiết', tier: 1, d: 'Sắt đen nặng gấp ba sắt thường.' },
  tinhkim: { id: 'tinhkim', n: 'Tinh kim', tier: 2, d: 'Kim loại tinh luyện, dẫn linh lực tốt.' },
  hanngoc: { id: 'hanngoc', n: 'Hàn ngọc', tier: 3, d: 'Ngọc lạnh ngàn năm.' },
  thienthach: { id: 'thienthach', n: 'Tinh thần thiết', tier: 4, d: 'Sắt từ sao rơi, trong lõi có tinh quang.' },
  phuchi: { id: 'phuchi', n: 'Phù chỉ', tier: 1, d: 'Giấy vẽ bùa thường, làm từ vỏ trúc nghiền với bột gạo. Không chứa nổi phù văn thượng cổ.' },
  yeubiphuchi: { id: 'yeubiphuchi', n: 'Yêu bì phù chỉ', tier: 2, d: 'Giấy phù thuộc từ da yêu thú theo cổ pháp Diệp thị. Chứa được cổ phù tới Tứ phẩm.' },
  linhmocphuchi: { id: 'linhmocphuchi', n: 'Linh mộc phù chỉ', tier: 4, d: 'Giấy phù bào mỏng từ lõi linh mộc ngàn năm. Chứa được cổ phù mọi phẩm.' },
  chusa: { id: 'chusa', n: 'Chu sa', tier: 1, d: 'Mực đỏ vẽ phù.' },
  thityeu: { id: 'thityeu', n: 'Thịt yêu thú', tier: 1, d: 'Thịt yêu thú tươi chứa linh khí nồng đậm, bồi bổ khí huyết và dùng phối chế linh dược.' },
  yeucot: { id: 'yeucot', n: 'Yêu thú cốt', tier: 2, d: 'Xương cốt yêu thú cứng cáp chứa yêu lực, vật liệu rèn pháp khí và hộ giáp.' },
  yeunha: { id: 'yeunha', n: 'Yêu thú nanh vuốt', tier: 2, d: 'Răng nanh, móng vuốt hoặc sừng nhọn của yêu thú hung hãn, sắc bén cứng cáp.' },
};

// ---------- Phù lục ----------
export interface Talis {
  id: string;
  n: string;
  tier: number;
  k: 'atk' | 'shield' | 'flee' | 'heal';
  m: number;
  el: El | null;
  d: string;
  p: number; // phẩm 1..9 — phẩm p ứng với cảnh giới p-1 (Nhất phẩm: Phàm Nhân … Cửu phẩm: Đại Thừa)
  co?: boolean; // vẽ theo bí tịch chế phù thượng cổ: uy lực ×10
}
export const PHU_PHAM = ['', 'Nhất', 'Nhị', 'Tam', 'Tứ', 'Ngũ', 'Lục', 'Thất', 'Bát', 'Cửu'];
const PHU_Q = ['hạ', 'trung', 'thượng', 'cực'];
/** Giai (1..6) suy từ phẩm phù — để giá, màu, cửa hàng dùng chung thang giai. */
const GIAI_OF_P = [0, 1, 1, 2, 3, 4, 4, 5, 6, 6];
export const talisGrade = (tl: Talis, g = 1) => `${PHU_PHAM[tl.p]} phẩm · ${PHU_Q[g] ?? 'trung'}`;
/** Cổ phù phẩm cao cần giấy tốt: yêu bì chỉ chứa tới Tứ phẩm. */
export const coPaper = (p: number) => (p <= 4 ? ['yeubiphuchi', 'linhmocphuchi'] : ['linhmocphuchi']);
export const TALIS: Record<string, Talis> = {
  // Nhất phẩm — Phàm Nhân
  trantaphu: { id: 'trantaphu', n: 'Trấn Tà Phù', p: 1, tier: 0, k: 'atk', m: 1.4, el: 'quang', d: 'Bùa trừ tà của thầy pháp dân gian. Phàm nhân cũng vẽ được, đánh lui âm hồn tiểu yêu.' },
  thanhanhphu: { id: 'thanhanhphu', n: 'Thần Hành Phù', p: 1, tier: 0, k: 'flee', m: 0.35, el: null, d: 'Chạy trốn chắc chắn hơn.' },
  // Nhị phẩm — Luyện Khí
  hoaphu: { id: 'hoaphu', n: 'Hỏa Đạn Phù', p: 2, tier: 0, k: 'atk', m: 1.8, el: 'hoa', d: 'Ném ra một quả cầu lửa.' },
  kimcangphu: { id: 'kimcangphu', n: 'Kim Cương Phù', p: 2, tier: 0, k: 'shield', m: 1.4, el: null, d: 'Hộ thể một lần.' },
  hoixuanphu: { id: 'hoixuanphu', n: 'Hồi Xuân Phù', p: 2, tier: 0, k: 'heal', m: 0.6, el: 'moc', d: 'Hồi khí huyết.' },
  // Tam phẩm — Trúc Cơ
  loiphu: { id: 'loiphu', n: 'Ngũ Lôi Phù', p: 3, tier: 0, k: 'atk', m: 2.6, el: 'loi', d: 'Năm đạo sét giáng xuống.' },
  bangphu: { id: 'bangphu', n: 'Băng Phong Phù', p: 3, tier: 0, k: 'atk', m: 2.3, el: 'bang', d: 'Phong băng đối thủ.' },
  doanhphu: { id: 'doanhphu', n: 'Huyền Quy Phù', p: 3, tier: 0, k: 'shield', m: 2.2, el: 'thuy', d: 'Mai rùa nước bao thân.' },
  // Tứ phẩm — Kết Đan
  xichdiemphu: { id: 'xichdiemphu', n: 'Xích Diễm Phần Sơn Phù', p: 4, tier: 0, k: 'atk', m: 3.1, el: 'hoa', d: 'Lửa đỏ cuốn lên như núi lở, đốt trụi cả sườn đồi.' },
  dichphu: { id: 'dichphu', n: 'Thiên Lý Độn Phù', p: 4, tier: 0, k: 'flee', m: 0.7, el: null, d: 'Độn đi ngàn dặm trong chớp mắt.' },
  sinhsinhphu: { id: 'sinhsinhphu', n: 'Sinh Sinh Tạo Hóa Phù', p: 4, tier: 0, k: 'heal', m: 0.9, el: 'moc', d: 'Sinh cơ cỏ cây rót vào kinh mạch, vết thương liền miệng thấy rõ.' },
  // Ngũ phẩm — Nguyên Anh
  thienloiphu: { id: 'thienloiphu', n: 'Cửu Tiêu Thiên Lôi Phù', p: 5, tier: 0, k: 'atk', m: 4, el: 'loi', d: 'Phù bảo của cao nhân, sấm trời cuồn cuộn.' },
  // Lục phẩm — Hóa Thần
  thaiamphu: { id: 'thaiamphu', n: 'Thái Âm Hàn Nguyệt Phù', p: 6, tier: 0, k: 'atk', m: 4.7, el: 'bang', d: 'Gọi xuống một vầng trăng lạnh, nơi ánh trăng rọi tới đều đóng băng.' },
  phongthienphu: { id: 'phongthienphu', n: 'Phong Thiên Ấn Phù', p: 6, tier: 0, k: 'shield', m: 4, el: null, d: 'Phong cả một vùng trời, mọi đòn đánh vào như đánh vào núi.' },
  // Thất phẩm — Luyện Hư
  hukhongphu: { id: 'hukhongphu', n: 'Hư Không Phá Giới Phù', p: 7, tier: 0, k: 'atk', m: 5.5, el: 'phong', d: 'Xé một đường trong không gian, kẻ đứng trên đường ấy bị cắt làm đôi.' },
  nadiphu: { id: 'nadiphu', n: 'Hư Không Na Di Phù', p: 7, tier: 0, k: 'flee', m: 0.9, el: null, d: 'Bước một bước vào hư không, bước ra đã ở ngoài vạn dặm.' },
  // Bát phẩm — Hợp Thể
  tutienphu: { id: 'tutienphu', n: 'Tru Tiên Kiếm Phù', p: 8, tier: 0, k: 'atk', m: 6.5, el: 'kim', d: 'Trong phù phong ấn một đạo kiếm khí của tiên nhân. Dùng một lần, trời đất đổi màu.' },
  vanphapphu: { id: 'vanphapphu', n: 'Vạn Pháp Bất Xâm Phù', p: 8, tier: 0, k: 'shield', m: 5.5, el: null, d: 'Pháp thuật nào chạm vào cũng tan như tuyết gặp nắng.' },
  // Cửu phẩm — Đại Thừa
  thiendaophu: { id: 'thiendaophu', n: 'Thiên Đạo Trấn Thế Phù', p: 9, tier: 0, k: 'atk', m: 8, el: 'quang', d: 'Mượn một sợi quy tắc của thiên đạo đè xuống. Dưới Đại Thừa không ai đỡ nổi.' },
  nietbanphu: { id: 'nietbanphu', n: 'Niết Bàn Tái Sinh Phù', p: 9, tier: 0, k: 'heal', m: 1.6, el: 'hoa', d: 'Lửa niết bàn thiêu sạch thương thế, thân thể như sinh lại lần nữa.' },
};
for (const tl of Object.values(TALIS)) tl.tier = GIAI_OF_P[tl.p];
// Cổ phù: cùng phù phương nhưng vẽ theo bí tịch thượng cổ của Diệp thị — uy lực gấp mười
for (const tl of Object.values(TALIS)) if (!tl.co) TALIS['co_' + tl.id] = { ...tl, id: 'co_' + tl.id, n: `${tl.n} · cổ pháp`, co: true, d: `${tl.d} Vẽ theo bí tịch thượng cổ, uy lực gấp mười phù thường.` };
/** Nguyên liệu chế phù: [phù chỉ, chu sa, thêm] */
export const TALIS_REC: Record<string, string[]> = {
  trantaphu: ['phuchi', 'chusa', 'hoangtinh'],
  hoaphu: ['phuchi', 'chusa', 'xichdiepthao'],
  kimcangphu: ['phuchi', 'chusa', 'huyenthiet'],
  thanhanhphu: ['phuchi', 'chusa', 'longthu'],
  hoixuanphu: ['phuchi', 'chusa', 'ngungkhithao'],
  loiphu: ['phuchi', 'chusa', 'loikichmoc'],
  bangphu: ['phuchi', 'chusa', 'tuyetlien'],
  doanhphu: ['phuchi', 'chusa', 'dayeu', 'yeudan'],
  dichphu: ['phuchi', 'chusa', 'phongvuthao', 'yeudan'],
  thienloiphu: ['phuchi', 'chusa', 'loikichmoc', 'longlan'],
  phongthienphu: ['phuchi', 'chusa', 'hukhongthach', 'longlan'],
  tutienphu: ['phuchi', 'chusa', 'hukhongthach', 'hongmongqua'],
  xichdiemphu: ['phuchi', 'chusa', 'hoalongqua', 'yeudan'],
  sinhsinhphu: ['phuchi', 'chusa', 'cuuchuyenhoa'],
  thaiamphu: ['phuchi', 'chusa', 'bangtamthao', 'hanngoc', 'longlan'],
  hukhongphu: ['phuchi', 'chusa', 'hukhongthach', 'tinhthannhuy'],
  nadiphu: ['phuchi', 'chusa', 'hukhongthach', 'phongvuthao'],
  vanphapphu: ['phuchi', 'chusa', 'hukhongthach', 'thienthach', 'vannienthanhmoc'],
  thiendaophu: ['phuchi', 'chusa', 'hongmongqua', 'cotuhuyet'],
  nietbanphu: ['phuchi', 'chusa', 'kimodienqua', 'cotuhuyet'],
};

// ---------- Trang bị ----------
export const SLOTS = ['Vũ khí', 'Hộ giáp', 'Linh bảo', 'Giới chỉ', 'Ngoa hài', 'Đan lô', 'Phù bút', 'Luyện khí đỉnh'] as const;
export const GEAR_GRADE = TIER_N;
export const GEAR_GRADE_C = TIER_C;
/** Thời gian luyện hóa (năm) theo phẩm. */
export const REFINE_Y = [0.1, 0.5, 2, 6, 15, 30, 60, 120, 240, 480, 960, 1920, 3840];
const BASE_NAMES: string[][] = [
  ['Kiếm', 'Đao', 'Thương', 'Phiến', 'Tiêu', 'Châm', 'Câu', 'Phất trần'],
  ['Giáp', 'Bào', 'Y', 'Hộ tâm kính', 'Lân giáp'],
  ['Ấn', 'Chung', 'Bình', 'Kính', 'Đỉnh', 'Tháp', 'Châu', 'Linh'],
  ['Giới', 'Hoàn', 'Ngọc bội', 'Trạc'],
  ['Ngoa', 'Hài', 'Lý'],
  ['Đan lô'],
  ['Phù bút'],
  ['Luyện khí đỉnh'],
];
const PREFIX: Partial<Record<El, string[]>> = {
  kim: ['Canh Kim', 'Phá Quân', 'Kim Lân', 'Thiết Cốt'],
  moc: ['Thanh Mộc', 'Bích Đằng', 'Xuân Phong', 'Linh Trúc'],
  thuy: ['Huyền Thủy', 'Thu Ba', 'Lưu Ly', 'Hàn Đàm'],
  hoa: ['Xích Diễm', 'Liệt Dương', 'Hồng Liên', 'Chu Tước'],
  tho: ['Hậu Thổ', 'Bàn Thạch', 'Hoàng Sa', 'Trấn Sơn'],
  bang: ['Băng Phách', 'Tuyết Ảnh', 'Hàn Nguyệt'],
  loi: ['Tử Điện', 'Kinh Lôi', 'Thiên Cương'],
  phong: ['Truy Phong', 'Lưu Vân', 'Thanh Vũ'],
  am: ['U Minh', 'Dạ Ảnh', 'Phệ Hồn'],
  quang: ['Diệu Nhật', 'Lưu Quang', 'Thánh Huy'],
  yin: ['Thái Âm', 'Huyền Âm', 'Nguyệt Hoa'],
  yang: ['Thái Dương', 'Thuần Dương', 'Cửu Dương'],
};
const PLAIN_PREFIX = ['Tinh Cương', 'Mộc', 'Thanh Đồng', 'Cổ', 'Hắc Thiết', 'Ngân', 'Vô Danh'];

export interface Gear {
  uid: string;
  slot: number;
  n: string;
  g: number; // giai 0 Phàm .. 6 Tiên
  q?: number; // phẩm 0 Hạ .. 3 Cực
  lv: number; // cảnh giới chế tạo
  el: El | null;
  atk: number;
  def: number;
  hp: number;
  cult: number; // % tu luyện
  luck: number;
  cap: number; // giới chỉ: ô túi
  refined: boolean;
  grow?: boolean; // tiên khí tàn khuyết: chỉ số lớn theo tu vi người cầm
  gw?: number; // giới lúc tính chỉ số
  growMul?: number; // tỷ lệ trưởng thành (mặc định 1; Hỗn Độn Kiếm đã sửa cao hơn)
  gm?: number; // tỷ lệ trưởng thành lúc tính chỉ số
}
export const gearLabel = (gr: Gear) => {
  if (gr.grow) { const { g, q } = growTreasureGrade(/\(tàn khuyết\)/i.test(gr.n), undefined, undefined, undefined, gr.q); gr.g = g; gr.q = q; }
  return gradeLabel(gr.g, gr.q ?? 1);
};
export function mkGear(lv: number, g: number, slot?: number, el?: El | null, q?: number): Gear {
  g = localTreasureGrade(g);
  const qq = q ?? (() => { const r = Math.random(); return r < 0.4 ? 0 : r < 0.75 ? 1 : r < 0.95 ? 2 : 3; })();
  const sl = slot ?? ri(0, 4);
  if (!Number.isInteger(sl) || sl < 0 || sl >= SLOTS.length) throw new RangeError(`Ô trang bị không hợp lệ: ${sl}`);
  const e: El | null = el !== undefined ? el : g >= 1 && ch(0.75) ? pick(Object.keys(PREFIX) as El[]) : null;
  const pre = e && PREFIX[e] ? pick(PREFIX[e]!) : pick(PLAIN_PREFIX);
  const n = `${pre} ${pick(BASE_NAMES[sl])}`;
  const base = (REALMS[lv].pow * 0.25 * (1 + g * 0.45) + 2) * PQ_MULT[qq] * worldMult();
  const v = (k: number) => Math.round(base * k * rf(0.85, 1.15));
  const gear: Gear = { uid: Math.random().toString(36).slice(2, 10), slot: sl, n, g, q: qq, lv, el: e, atk: 0, def: 0, hp: 0, cult: 0, luck: 0, cap: 0, refined: false };
  if (sl === 0) gear.atk = v(1);
  else if (sl === 1) { gear.def = v(0.6); gear.hp = v(4); }
  else if (sl === 2) { gear.atk = v(0.6); gear.def = v(0.3); gear.cult = g >= 2 ? ri(3, 6) * g : 0; }
  else if (sl === 3) { gear.cap = 4 + g * 4; gear.luck = g >= 2 ? Math.floor(g / 2) : 0; gear.hp = v(1.5); }
  else if (sl === 4) { gear.def = v(0.4); gear.luck = g >= 3 ? 1 : 0; gear.hp = v(2); }
  return gear;
}
export function mkNgocBoiDoi(): Gear {
  return {
    uid: Math.random().toString(36).slice(2, 10),
    slot: 3,
    n: 'Nửa ngọc bội đôi (Tàn khuyết)',
    g: 1,
    q: 0,
    lv: 0,
    el: null,
    atk: 0,
    def: 0,
    hp: 0,
    cult: 5,
    luck: 2,
    cap: 10,
    refined: true,
    grow: true,
    growMul: 1,
  };
}
export const gearPrice = (gr: Gear) => Math.round(8 * Math.pow(3.2, gr.lv) * Math.pow(2.4, gr.g) * PQ_MULT[gr.q ?? 1]);

// ---------- Túi trữ vật ----------
export const BAG_CAP = 14;

// ---------- Giá ----------
export const herbPrice = (t: number) => Math.round(4 * Math.pow(3.4, t - 1));
export const pillPrice = (p: Pill, g = 1) => Math.round(18 * Math.pow(3.6, p.tier - 1) * (p.k === 'break' ? 3 : p.k === 'root' ? 6 : p.k === 'life' ? 4 : p.k === 'stat' ? 3 : 1) * GRADE_MULT[g]);
export const matPrice = (m: Mat) => Math.round(6 * Math.pow(3.4, m.tier - 1));
export const talisPrice = (t: Talis, g = 1) => Math.round(15 * Math.pow(3.5, t.tier - 1) * GRADE_MULT[g]);
export const techPrice = (t: Tech) => Math.round(60 * Math.pow(5, t.tier - 1) * (1 + (t.pq ?? 0) * 0.4));
export const skillPrice = (s: Skill) => Math.round(40 * Math.pow(4.5, s.tier - 1) * (1 + (s.pq ?? 0) * 0.3));

// ---------- Vật đặc biệt ('x:') — sự kiện có thể thêm mới qua registerSpecial ----------
export interface Special {
  id: string;
  n: string;
  d: string;
  price: number;
  use?: string; // mô tả khi dùng (logic dùng nằm ở engine/items useSpecial)
}
export const SPECIALS: Record<string, Special> = {
  tuitruvat: { id: 'tuitruvat', n: 'Túi trữ vật', d: 'Dùng để mở rộng túi đồ thêm 6 ô.', price: 120, use: 'Mở rộng túi' },
  ngocboidoi: { id: 'ngocboidoi', n: 'Nửa ngọc bội đôi', d: 'Một nửa ngọc bội cũ luôn theo ngươi từ thuở nhỏ. Nửa còn lại nằm trong tay Nữ chính (chính thất Ngô Thu Phương). Khi dung hợp Hỗn Độn Thạch viên mãn, sẽ thăng hoa thành Ngọc bội đôi - Hỗn Độn Chí Bảo.', price: 0 },
  banddo: { id: 'banddo', n: 'Mảnh bản đồ cổ', d: 'Vẽ dở một vùng hiểm địa. Đủ ba mảnh có thể tìm ra kho báu.', price: 60 },
  ngocgian: { id: 'ngocgian', n: 'Ngọc giản vô danh', d: 'Ngọc giản cũ, thần thức quét vào thấy mơ hồ. Dùng để lĩnh ngộ.', price: 80, use: 'Lĩnh ngộ' },
  linhthach_trung: { id: 'linhthach_trung', n: 'Trung phẩm linh thạch', d: 'Một viên bằng trăm viên hạ phẩm.', price: 100, use: 'Đổi thành 100 linh thạch' },
  linhthach_thuong: { id: 'linhthach_thuong', n: 'Thượng phẩm linh thạch', d: 'Một viên bằng vạn viên hạ phẩm.', price: 10000, use: 'Đổi thành 10.000 linh thạch' },
  cophu: { id: 'cophu', n: 'Bí tịch chế phù thượng cổ', d: 'Cuốn da thú cũ của Diệp thị Hoang Cổ, chép cách vẽ phù từ thời chưa có tông môn. Phù vẽ theo bí tịch này mạnh gấp mười phù thường.', price: 0, use: 'Lĩnh ngộ' },
  kiemlenh: { id: 'kiemlenh', n: 'Lệnh bài tiến cử', d: 'Mang lệnh bài này tới một tông môn sẽ được nhận làm đệ tử, bỏ qua khảo hạch tư chất (trừ thánh địa).', price: 300 },
  linhtuyen: { id: 'linhtuyen', n: 'Bình linh tuyền', d: 'Nước suối linh, uống vào tăng tu vi đáng kể.', price: 150, use: 'Uống' },
  thanhoa: { id: 'thanhoa', n: 'Mồi lửa linh hỏa', d: 'Một đốm linh hỏa bị phong ấn. Luyện hóa sẽ tăng tỉ lệ luyện đan, luyện khí vĩnh viễn.', price: 600, use: 'Luyện hóa' },
  phatnganh: { id: 'phatnganh', n: 'Bồ Đề Tử', d: 'Hạt bồ đề nghìn năm. Ngậm trong miệng lúc đột phá, tâm ma khó xâm.', price: 900, use: 'Ngậm (giảm tâm ma, +đạo tâm)' },
};
export function registerSpecial(sp: Special) {
  SPECIALS[sp.id] = sp;
}

// ---------- Tâm pháp: kinh tu tâm, hiệu quả bị động, học xong là có ----------
export interface TamPhap { id: string; n: string; tier: number; pq: number; d: string; race?: 'human' | 'yao' | 'all'; tam?: number; ngo?: number; cult?: number; brk?: number; calm?: number; celestial?: CelestialId; celestialTier?: 'low' | 'mid' | 'high'; }
export const TAMPHAP: Record<string, TamPhap> = {
  // ===== Tâm Pháp Yêu Tộc =====
  hungtinhngungtam: { id: 'hungtinhngungtam', n: 'Hung Tính Ngưng Tâm Quyết', tier: 1, pq: 0, race: 'yao', tam: 1, calm: 1, d: 'Tâm pháp sơ giai yêu tộc: Thu liễm dã tính hung bạo trong máu, giữ yêu tâm thanh tỉnh.' },
  thonnguyetkhaithuc: { id: 'thonnguyetkhaithuc', n: 'Thôn Nguyệt Khai Khiếu Kinh', tier: 1, pq: 1, race: 'yao', cult: 5, d: 'Hấp thụ ánh trăng soi rọi yêu khiếu, giúp tu vi yêu thú tích lũy vững chắc.' },
  yeuhonngungluyen: { id: 'yeuhonngungluyen', n: 'Yêu Hồn Ngưng Luyện Quyết', tier: 1, pq: 2, race: 'yao', ngo: 1, d: 'Rèn luyện yêu hồn dẻo dai kiên cố, tăng khả năng lĩnh ngộ thần thông bản mệnh.' },
  manhoangluyenthan: { id: 'manhoangluyenthan', n: 'Man Hoang Luyện Thần Quyết', tier: 2, pq: 0, race: 'yao', tam: 1, calm: 2, d: 'Kế thừa ý chí quật cường của man hoang cự thú, trấn áp tạp niệm ngoại cảnh.' },
  huyetmachquynguyen: { id: 'huyetmachquynguyen', n: 'Huyết Mạch Quy Nguyên Kinh', tier: 2, pq: 1, race: 'yao', tam: 1, brk: 0.02, d: 'Thanh lọc huyết mạch tạp chất, hỗ trợ yêu thú đột phá bình cảnh dễ dàng hơn.' },
  yeudanduongtinh: { id: 'yeudanduongtinh', n: 'Yêu Đan Dưỡng Tinh Kinh', tier: 2, pq: 2, race: 'yao', cult: 6, d: 'Ôn dưỡng yêu đan trong đan điền, yêu khí ngưng tụ châu viên ngọc nhuận không tiêu tán.' },
  thienyeutinhphach: { id: 'thienyeutinhphach', n: 'Thiên Yêu Tĩnh Phách Điển', tier: 3, pq: 2, race: 'yao', tam: 2, calm: 2, d: 'Tâm phách vững như thượng cổ thần sơn, yêu tâm bất động trước mọi huyễn ảnh ma chướng.' },
  batdietdathuan: { id: 'batdietdathuan', n: 'Bất Diệt Dã Tính Kinh', tier: 4, pq: 3, race: 'yao', tam: 3, calm: 4, d: 'Nung nấu dã tính thành ý chí bất diệt, tâm ma vừa sinh liền bị chiến ý xé rách.' },
  tinhtamkinh: { id: 'tinhtamkinh', n: 'Tĩnh Tâm Kinh', tier: 1, pq: 0, tam: 1, calm: 1, d: 'Kinh nhập môn của mọi tu sĩ: ngồi yên, thở chậm, nhìn tạp niệm trôi qua.' },
  duongkhikinh: { id: 'duongkhikinh', n: 'Dưỡng Khí Kinh', tier: 1, pq: 1, cult: 5, d: 'Dạy cách giữ linh khí không tản mát sau mỗi lần vận công.' },
  ngungthankinh: { id: 'ngungthankinh', n: 'Ngưng Thần Kinh', tier: 1, pq: 2, ngo: 1, d: 'Gom thần thức về một điểm, đọc kinh một lần nhớ mười.' },
  bangtamquyet: { id: 'bangtamquyet', n: 'Băng Tâm Quyết', tier: 2, pq: 0, calm: 2, tam: 1, d: 'Tâm lạnh như băng, tạp niệm vừa sinh đã đông cứng.' },
  thanhtinhkinh: { id: 'thanhtinhkinh', n: 'Thanh Tịnh Kinh', tier: 2, pq: 1, tam: 1, brk: 0.02, d: 'Gột sạch bụi trần trong tâm trước mỗi lần xung quan.' },
  hoinguyenkinh: { id: 'hoinguyenkinh', n: 'Hồi Nguyên Kinh', tier: 2, pq: 2, cult: 6, d: 'Linh khí đi một vòng chu thiên lại quay về đan điền, không hao một giọt.' },
  tuphukinh: { id: 'tuphukinh', n: 'Tử Phủ Kinh', tier: 3, pq: 1, ngo: 1, cult: 6, d: 'Khai mở tử phủ trong thức hải, thần thức rộng như biển.' },
  bodetamkinh: { id: 'bodetamkinh', n: 'Bồ Đề Tâm Kinh', tier: 3, pq: 2, tam: 2, calm: 2, d: 'Tâm như cây bồ đề, gió có lay lá cũng không lay gốc.' },
  huyennguyentam: { id: 'huyennguyentam', n: 'Huyền Nguyên Tâm Kinh', tier: 3, pq: 3, brk: 0.04, tam: 1, d: 'Lúc xung quan, tâm không sợ hãi thì bình cảnh tự lỏng.' },
  cuuchuyentam: { id: 'cuuchuyentam', n: 'Cửu Chuyển Tâm Kinh', tier: 4, pq: 1, cult: 10, brk: 0.03, d: 'Tâm chuyển chín vòng, mỗi vòng một tầng ngộ.' },
  vongtinhkinh: { id: 'vongtinhkinh', n: 'Thái Thượng Vong Tình Kinh', tier: 4, pq: 3, tam: 3, calm: 4, d: 'Quên tình để giữ đạo. Tâm ma khó vào, nhưng người bên cạnh cũng khó vào.' },
  hukhongtam: { id: 'hukhongtam', n: 'Hư Không Tâm Kinh', tier: 5, pq: 1, brk: 0.05, tam: 2, d: 'Tâm như hư không: chứa được tất cả, không vướng víu gì.' },
  honnguyentam: { id: 'honnguyentam', n: 'Hỗn Nguyên Tâm Kinh', tier: 5, pq: 2, cult: 12, ngo: 2, d: 'Thần thức và chân nguyên hợp làm một, tu một được hai.' },
  vouluongtam: { id: 'vouluongtam', n: 'Vô Lượng Tâm Kinh', tier: 6, pq: 3, cult: 18, brk: 0.06, tam: 3, ngo: 2, d: 'Tâm kinh không biết ai viết, không biết từ đâu tới. Đọc xong, cả đời không quên được.' },
  // ===== Tâm Pháp Bốn Thần Giới =====
  // --- Thiên Đình ---
  tp_td_thanhtam: { id: 'tp_td_thanhtam', n: 'Tiên Quan Thanh Tâm Kinh', tier: 2, pq: 1, celestial: 'thiendinh', celestialTier: 'low', tam: 1, calm: 2, d: 'Giữ lòng thanh tịnh như mây trời bồng bềnh, tạp niệm tự tiêu.' },
  tp_td_vovi: { id: 'tp_td_vovi', n: 'Thái Thượng Vô Vi Đạo Tâm', tier: 5, pq: 2, celestial: 'thiendinh', celestialTier: 'high', tam: 3, cult: 15, calm: 5, d: 'Đạo tâm hòa hợp thiên địa, vô vi nhi vô bất vi, tâm ma không chỗ nương náu.' },
  tp_td_truongsinh: { id: 'tp_td_truongsinh', n: 'Cửu Thiên Trường Sinh Tâm Điển', tier: 6, pq: 3, celestial: 'thiendinh', celestialTier: 'high', cult: 20, brk: 0.08, tam: 4, d: 'Tâm pháp trường sinh của chư tiên Thiên Đình, thọ cùng nhật nguyệt.' },

  // --- Địa Phủ ---
  tp_dp_vonghuong: { id: 'tp_dp_vonghuong', n: 'Vọng Hương Vô Lệ Quyết', tier: 2, pq: 1, celestial: 'diaphu', celestialTier: 'low', calm: 3, tam: 1, d: 'Quên đi ân oán phàm trần, dứt bỏ chấp niệm, tâm ma tự diệt.' },
  tp_dp_tamsinh: { id: 'tp_dp_tamsinh', n: 'Tam Sinh Thạch Ngộ Kiếp Kinh', tier: 4, pq: 2, celestial: 'diaphu', celestialTier: 'high', ngo: 2, brk: 0.05, tam: 2, d: 'Nhìn thấu ba kiếp nhân quả, ngộ tính tăng mạnh, bình cảnh tự thông.' },
  tp_dp_bathu: { id: 'tp_dp_bathu', n: 'U Minh Bất Hủ Đạo Tâm', tier: 6, pq: 3, celestial: 'diaphu', celestialTier: 'high', tam: 4, cult: 18, calm: 6, d: 'Đạo tâm rèn luyện qua trăm kiếp luân hồi, ngàn vạn ma chướng không thể lay chuyển.' },

  // --- Yêu Giới ---
  tp_yg_cuongthu: { id: 'tp_yg_cuongthu', n: 'Bản Năng Cuồng Thú Quyết', tier: 2, pq: 1, race: 'yao', celestial: 'yeugioi', celestialTier: 'low', tam: 1, cult: 6, d: 'Đánh thức bản năng dã thú thượng cổ, tu vi tích lũy vững chắc.' },
  tp_yg_cuuvi: { id: 'tp_yg_cuuvi', n: 'Cửu Vĩ Thiên Hồ Mị Tâm Điển', tier: 4, pq: 2, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', ngo: 2, tam: 2, calm: 3, d: 'Tâm thần hồ tộc biến ảo khôn lường, miễn nhiễm mọi ảo ảnh và mê hoặc lòng người.' },
  tp_yg_batdiet: { id: 'tp_yg_batdiet', n: 'Thái Cổ Yêu Hoàng Bất Diệt Huyết', tier: 6, pq: 3, race: 'yao', celestial: 'yeugioi', celestialTier: 'high', cult: 18, brk: 0.07, tam: 3, d: 'Huyết mạch chân hoàng cuộn chảy, sức sống vô tận, phá cảnh như bẻ cành khô.' },

  // --- Linh Sơn ---
  tp_ls_minhtam: { id: 'tp_ls_minhtam', n: 'Minh Tâm Kiến Tính Kinh', tier: 2, pq: 1, celestial: 'linhson', celestialTier: 'low', calm: 3, tam: 1, d: 'Soi chiếu nội tâm, gạt bỏ sợ hãi vô minh, tâm an định như thái sơn.' },
  tp_ls_bodhi: { id: 'tp_ls_bodhi', n: 'Bồ Đề Vô Thụ Chân Thiền', tier: 4, pq: 2, celestial: 'linhson', celestialTier: 'high', tam: 3, calm: 5, ngo: 2, d: 'Bồ Đề vốn không cây, gương sáng cũng chẳng đài, tâm cảnh tuyệt đối không vướng bụi trần.' },
  tp_ls_nietban: { id: 'tp_ls_nietban', n: 'Đại Thừa Niết Bàn Tịch Diệt Tâm', tier: 6, pq: 3, celestial: 'linhson', celestialTier: 'high', tam: 5, brk: 0.08, cult: 18, d: 'Tâm pháp tối cao Phật môn, tâm như hư không tịch diệt, thoát khỏi sinh tử luân hồi.' },

};
export const tamGrade = (x: TamPhap) => artGradeLabel(x.tier, x.pq);
export const tamPrice = (x: TamPhap) => Math.round(50 * Math.pow(4.2, x.tier - 1) * (1 + x.pq * 0.3));
/** Cảnh giới phù hợp theo giai: Hoàng→Luyện Khí, Huyền→Trúc Cơ, Địa→Kết Đan, Thiên→Nguyên Anh, Thần→Hóa Thần, Tiên→Luyện Hư. */
export const realmForGiai = (giai: number) => Math.max(1, Math.min(6, giai));
/** Cảnh giới tối thiểu để lĩnh hội (Hoàng giai ai cũng học được). */
export const learnReq = (giai: number) => (giai <= 1 ? 0 : realmForGiai(giai));
export function tamEffect(x: TamPhap): string {
  const p: string[] = [];
  if (x.tam) p.push(`đạo tâm +${x.tam}`);
  if (x.ngo) p.push(`ngộ tính +${x.ngo}`);
  if (x.cult) p.push(`tu luyện +${x.cult}%`);
  if (x.brk) p.push(`đột phá +${Math.round(x.brk * 100)}%`);
  if (x.calm) p.push(`tâm ma tiêu nhanh +${x.calm}/năm`);
  return p.join(', ');
}
