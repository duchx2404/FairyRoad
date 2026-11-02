// Thế giới Thương Lan Giới: vùng, địa điểm, tông môn, yêu thú.
import { CELESTIAL, type CelestialId } from './celestial';
import type { El } from './core';
import { RMAX } from './core';

export const MAP_W = 11000;
export const MAP_H = 8400;
/** Lục địa cũ (thiết kế ở khung 2400×1600) được phóng ×2 rồi dời vào giữa bản đồ lớn. */
const K = 2, OX = 300, OY = 450;
const T = (x: number, y: number): [number, number] => [x * K + OX, y * K + OY];

export type LocType = 'village' | 'town' | 'market' | 'sect' | 'wild' | 'realm' | 'formation';
export const LOC_TYPE: Record<LocType, { n: string; ic: string }> = {
  village: { n: 'Thôn trấn', ic: 'village' },
  town: { n: 'Thành trì', ic: 'town' },
  market: { n: 'Phường thị', ic: 'market' },
  sect: { n: 'Tông môn', ic: 'sect' },
  wild: { n: 'Hiểm địa', ic: 'wild' },
  realm: { n: 'Bí cảnh', ic: 'realm' },
  formation: { n: 'Truyền tống trận', ic: 'tienco' },
};

export type Vuc = 'trung' | 'dong' | 'tay' | 'nam' | 'bac';
export const VUC: Record<Vuc, { n: string; c: string; d: string }> = {
  trung: { n: 'Trung Vực', c: '#d2b46a', d: 'Vùng lớn nhất, linh khí dồi dào nhất thiên hạ. Thánh địa và thế gia mạnh nhất đều ở đây.' },
  dong: { n: 'Đông Vực', c: '#7aa864', d: 'Sông nước, đầm lầy và biển đông.' },
  tay: { n: 'Tây Vực', c: '#cf9a4e', d: 'Sa mạc, núi lửa và cổ thành vùi trong cát.' },
  nam: { n: 'Nam Vực', c: '#b85a46', d: 'Rừng già, chướng khí, yêu tộc và quần đảo phương nam.' },
  bac: { n: 'Bắc Vực', c: '#a9c6d9', d: 'Thảo nguyên, băng nguyên và đêm dài cực bắc.' },
};
export interface Region {
  id: string;
  vuc: Vuc;
  n: string;
  el: El[];
  d: string;
  c: string; // màu loang trên bản đồ
}
export const REGIONS: Record<string, Region> = {
  trungtho: { id: 'trungtho', vuc: 'trung', n: 'Trung Thổ', el: ['tho', 'kim'], c: '#b9a77c', d: 'Đất của vương triều Đại Chu, phàm nhân đông đúc, tông môn chính đạo san sát.' },
  bacminh: { id: 'bacminh', vuc: 'bac', n: 'Bắc Minh Nguyên', el: ['bang', 'thuy'], c: '#9fb3bb', d: 'Thảo nguyên và băng nguyên mênh mông, nửa năm tuyết phủ.' },
  tayluong: { id: 'tayluong', vuc: 'tay', n: 'Tây Lương', el: ['kim', 'hoa'], c: '#c9a46b', d: 'Sa mạc, ốc đảo và những ngọn núi lửa. Ma đạo ẩn mình trong cát.' },
  namman: { id: 'namman', vuc: 'nam', n: 'Nam Man', el: ['moc', 'hoa'], c: '#8ea279', d: 'Mười vạn núi rừng, chướng khí và cổ trùng. Người bản xứ thờ thần núi.' },
  vanmong: { id: 'vanmong', vuc: 'dong', n: 'Vân Mộng', el: ['thuy', 'moc'], c: '#9db29a', d: 'Đầm lầy, sông ngòi chằng chịt, sương mù quanh năm.' },
  donghai: { id: 'donghai', vuc: 'dong', n: 'Đông Hải', el: ['thuy', 'loi'], c: '#87a2ad', d: 'Biển rộng vô bờ, đảo nhỏ rải rác, giao long ẩn dưới đáy sâu.' },
  cucbac: { id: 'cucbac', vuc: 'bac', n: 'Cực Bắc Băng Vực', el: ['bang', 'quang'], c: '#b3c3cb', d: 'Dải băng lục bên kia biển bắc. Đêm dài nửa năm, cực quang múa trên trời như lụa.' },
  namhai: { id: 'namhai', vuc: 'nam', n: 'Nam Hải', el: ['thuy', 'loi'], c: '#8fb0a8', d: 'Quần đảo phương nam, nước biển xanh như ngọc, bão tố tới không báo trước.' },
  vanyeu: { id: 'vanyeu', vuc: 'nam', n: 'Vạn Yêu Lĩnh', el: ['moc', 'tho', 'am'], c: '#93a07e', d: 'Đại lục của yêu tộc bên kia Đông Hải. Người tu đến đây phải học luật của rừng.' },
  tayhai: { id: 'tayhai', vuc: 'tay', n: 'Tây Hải', el: ['thuy', 'kim'], c: '#a7b5a6', d: 'Biển phía tây, hoàng hôn đỏ như máu, cá voi trắng bơi theo đàn.' },
  bachai: { id: 'bachai', vuc: 'bac', n: 'Bắc Hải', el: ['bang', 'thuy'], c: '#a9bcc6', d: 'Biển băng phía bắc, núi băng trôi như những hòn đảo lang thang.' },
  noihai: { id: 'noihai', vuc: 'trung', n: 'Tứ Hải Giao Giới', el: ['thuy', 'loi', 'phong'], c: '#93a6ad', d: 'Những eo biển giữa Trung Vực và bốn vực. Hải lưu dữ dội, đảo nhỏ nào cũng ẩn hung hiểm cấp cao.' },
  tienchau: { id: 'tienchau', vuc: 'trung', n: 'Hư Linh Tiên Sơn', el: ['phong', 'loi'], c: '#a99cbc', d: 'Quần sơn lơ lửng giữa lòng Trung Vực, bao quanh bởi cương phong. Chỉ người từ Nguyên Anh trở lên mới vượt qua được.' },
};

export interface Loc {
  id: string;
  n: string;
  type: LocType;
  reg: string;
  x: number;
  y: number;
  qi: number; // nồng độ linh khí
  d: string;
  lv?: number; // cấp hiểm địa (theo chỉ số cảnh giới yêu thú)
  island?: boolean;
  sea?: boolean; // thế lực / di tích dưới đáy biển: nằm giữa biển, không có đảo (kèm island để đi thuyền như đảo)
  river?: string; // long cung dưới sông: tên sông, đặt tại giữa dòng sau khi dựng bản đồ
  xy?: [number, number]; // toạ độ cố định (long cung ngoài biển)
  gate?: CelestialId; // cổng bí cảnh thông tới một thần giới (Thiên Đình / Địa Phủ / Yêu Giới / Linh Sơn)
  gateHost?: string; // id địa điểm chủ (cổng đặt ngay sau lưng)
  formationTo?: string; // đầu trận đối diện ở ranh giới vực kế bên
  near?: string; // đặt sát một địa điểm khác (vd. Hoàng Tuyền Trấn dưới chân Hoàng Tuyền Quỷ Môn)
  patronSect?: string; // thành trì trực thuộc tông môn, không thuộc triều đình
  ownerEmp?: string; // id triều đình chủ quản chỉ định (ải của một triều nằm trong châu của triều khác)
  pin?: boolean; // địa danh ghim theo truyền thuyết (Theme.pins): giữ đúng toạ độ ngay từ lần xếp đầu
  base?: [number, number]; // vị trí gốc trước khi đưa lên đỉnh núi (để bước đặt lại chạy nhiều lần không trôi)
  port?: boolean;
  auction?: boolean;
  forge?: boolean;
  sect?: string;
  chau?: string; // châu (tự gán theo vị trí)
  minRealm?: number; // muốn vào bí cảnh
  open?: [number, number]; // bí cảnh: mở mỗi a năm, kéo dài b năm
  shj?: [ShjK, number, number]; // núi trong Sơn Hải Kinh: [thiên, thứ tự, tổng số] để xếp thành dãy
  shjXY?: [number, number]; // Hải Kinh / Đại Hoang Kinh: tọa độ cố định ngoài biển
}
/** Nơi mang thiên địa chi thế — trúc cơ ở đây có thể thành Cực phẩm đạo cơ. */
export const DIA_THE: Record<string, string> = {
  batchu: 'thế chống trời của cột Bất Chu',
  shj_conlon: 'thế vạn sơn chi tổ của Côn Lôn',
  shj_thaison: 'thế trấn áp tứ phương của Thái Sơn',
  shj_chuongvi: 'thế ngày đêm luân chuyển nơi Chúc Long nhắm mở mắt',
  hoadiem: 'thế địa hỏa phun trào',
  bangnguyen: 'thế băng phong vạn năm',
  loiminh: 'thế thiên lôi không dứt',
  toaitinh: 'thế tinh thần rơi rụng',
  hukhong: 'thế không gian nứt vỡ',
  cochien: 'thế sát phạt của cổ chiến trường',
  thapvan: 'thế vạn núi chầu về',
};
export type ShjK = 'nam' | 'tay' | 'bac' | 'dong' | 'trung' | 'hai';

const L: Loc[] = [
  // --- Trung Thổ ---
  { id: 'langtrang', n: 'Làng Trúc Lâm', type: 'village', reg: 'trungtho', x: 820, y: 780, qi: 0.8, d: 'Làng tiều phu dưới chân núi trúc. Khói bếp, tiếng gà và những câu chuyện tiên nhân.' },
  { id: 'kinhdo', n: 'Thiên Kinh', type: 'town', reg: 'trungtho', x: 1060, y: 700, qi: 0.9, auction: true, d: 'Kinh đô Đại Chu, trăm vạn hộ dân. Tu sĩ phải thu liễm uy áp khi vào thành.' },
  { id: 'thietthanh', n: 'Thiết Thành', type: 'town', reg: 'trungtho', x: 760, y: 560, qi: 0.85, forge: true, d: 'Thành của thợ rèn và tiêu cục. Khói lò che cả mặt trời.' },
  { id: 'lamthanh', n: 'Lam Thành', type: 'town', reg: 'trungtho', x: 1250, y: 880, qi: 0.9, d: 'Thành buôn bên sông Lam, nổi tiếng chợ dược liệu.' },
  { id: 'thachkieu', n: 'Thôn Thạch Kiều', type: 'village', reg: 'trungtho', x: 1130, y: 1010, qi: 0.85, d: 'Thôn nhỏ có cây cầu đá cổ, tương truyền do tiên nhân dựng trong một đêm.' },
  { id: 'thanhhathi', n: 'Thanh Hà phường thị', type: 'market', reg: 'trungtho', x: 930, y: 880, qi: 1, d: 'Phường thị tán tu lớn nhất Trung Thổ, nằm dưới sự che chở của Thanh Hà Kiếm Phái.' },
  { id: 'thanhha', n: 'Thanh Hà Kiếm Phái', type: 'sect', reg: 'trungtho', x: 860, y: 970, qi: 1.3, sect: 'thanhha', d: 'Kiếm phái bên dòng Thanh Hà. Đệ tử luyện kiếm dưới thác từ sáng tới tối.' },
  { id: 'hautho', n: 'Hậu Thổ Tông', type: 'sect', reg: 'trungtho', x: 1200, y: 560, qi: 1.3, sect: 'hautho', d: 'Tông môn đào động phủ trong lòng núi, chuộng phòng thủ, chậm mà chắc.' },
  { id: 'thaihuyen', n: 'Thái Huyền Đạo Tông', type: 'sect', reg: 'trungtho', x: 990, y: 450, qi: 1.9, sect: 'thaihuyen', d: 'Đạo tông đứng đầu chính đạo, chín mươi chín ngọn núi nối nhau trên dãy Thiên Trụ.' },
  { id: 'hacphong', n: 'Hắc Phong Lĩnh', type: 'wild', reg: 'trungtho', x: 650, y: 860, qi: 1.15, lv: 1, d: 'Rừng núi gió đen, sói yêu và sơn tặc. Nơi tán tu mới vào nghề kiếm bữa.' },
  { id: 'cochien', n: 'Cổ Chiến Trường', type: 'wild', reg: 'trungtho', x: 1380, y: 640, qi: 1.3, lv: 3, d: 'Chiến trường tiên ma vạn năm trước. Sát khí chưa tan, binh khí gãy cắm đầy đất.' },
  // --- Bắc Minh ---
  { id: 'bachlang', n: 'Trại Bạch Lang', type: 'village', reg: 'bacminh', x: 700, y: 260, qi: 0.8, d: 'Trại du mục trên thảo nguyên, thờ sói trắng làm thần.' },
  { id: 'socphong', n: 'Sóc Phong Thành', type: 'town', reg: 'bacminh', x: 1060, y: 230, qi: 0.9, d: 'Thành biên ải phương bắc, tường thành đóng băng quanh năm.' },
  { id: 'bangthi', n: 'Băng Thị', type: 'market', reg: 'bacminh', x: 1520, y: 300, qi: 1, d: 'Phường thị khoét trong vách băng, bán da thú và băng tinh.' },
  { id: 'hanbang', n: 'Hàn Băng Các', type: 'sect', reg: 'bacminh', x: 1380, y: 150, qi: 1.6, sect: 'hanbang', d: 'Lầu các bằng băng ngàn năm, đệ tử ngồi thiền trong gió tuyết.' },
  { id: 'bangnguyen', n: 'Vạn Tái Băng Nguyên', type: 'wild', reg: 'bacminh', x: 480, y: 120, qi: 1.5, lv: 4, d: 'Băng nguyên vạn năm. Gió ở đây cắt được cả hộ thể chân nguyên.' },
  { id: 'tuyetho', n: 'Tuyết Hồ Cốc', type: 'wild', reg: 'bacminh', x: 1240, y: 340, qi: 1.25, lv: 2, d: 'Thung lũng cáo tuyết, nước suối ấm giữa băng giá.' },
  // --- Tây Lương ---
  { id: 'hoangsa', n: 'Hoàng Sa Trấn', type: 'town', reg: 'tayluong', x: 340, y: 700, qi: 0.85, d: 'Trấn buôn giữa sa mạc, lạc đà nhiều hơn người.' },
  { id: 'lacdatram', n: 'Trạm Lạc Đà', type: 'village', reg: 'tayluong', x: 560, y: 640, qi: 0.8, d: 'Trạm dừng chân của thương đội, có giếng nước ngọt hiếm hoi.' },
  { id: 'lucchau', n: 'Lục Châu phường thị', type: 'market', reg: 'tayluong', x: 470, y: 960, qi: 1, d: 'Phường thị trong ốc đảo xanh, ma tu và chính tu cùng mua bán, miễn đừng rút kiếm.' },
  { id: 'lietduong', n: 'Liệt Dương Môn', type: 'sect', reg: 'tayluong', x: 230, y: 520, qi: 1.5, sect: 'lietduong', d: 'Tông môn dựng trên miệng núi lửa đã tắt, tu hỏa hệ cương mãnh.' },
  { id: 'huyetsat', n: 'Huyết Sát Điện', type: 'sect', reg: 'tayluong', x: 150, y: 990, qi: 1.6, sect: 'huyetsat', d: 'Ma điện chôn dưới cát. Nghe nói gạch lát nền là xương người.' },
  { id: 'hoadiem', n: 'Hỏa Diệm Sơn', type: 'wild', reg: 'tayluong', x: 420, y: 430, qi: 1.45, lv: 3, d: 'Núi lửa còn sống, dung nham chảy thành sông. Hỏa linh dồi dào.' },
  { id: 'luusa', n: 'Lưu Sa Hải', type: 'wild', reg: 'tayluong', x: 250, y: 820, qi: 1.2, lv: 2, d: 'Biển cát chảy, nuốt cả đoàn thương đội không để lại dấu.' },
  { id: 'cothanh', n: 'Tây Mạc Cổ Thành', type: 'wild', reg: 'tayluong', x: 110, y: 690, qi: 1.45, lv: 4, d: 'Thành cổ bị cát vùi, thỉnh thoảng gió thổi lộ ra mái ngói lưu ly.' },
  // --- Nam Man ---
  { id: 'mangoc', n: 'Man Cốc', type: 'village', reg: 'namman', x: 720, y: 1310, qi: 0.85, d: 'Bản làng người Man trong thung lũng, nhà sàn và trống đồng.' },
  { id: 'namcuong', n: 'Nam Cương Thành', type: 'town', reg: 'namman', x: 840, y: 1150, qi: 0.9, d: 'Thành đá giữa rừng già, chợ bán cổ trùng và da rắn.' },
  { id: 'vandoc', n: 'Vạn Độc Giáo', type: 'sect', reg: 'namman', x: 560, y: 1420, qi: 1.5, sect: 'vandoc', d: 'Giáo phái nuôi cổ luyện độc. Người ngoài vào được, ra được hay không thì khó nói.' },
  { id: 'chuongkhi', n: 'Chướng Khí Đầm', type: 'wild', reg: 'namman', x: 430, y: 1240, qi: 1.15, lv: 1, d: 'Đầm lầy độc, cóc yêu và rết lớn. Linh thảo mọc dày.' },
  { id: 'thapvan', n: 'Thập Vạn Đại Sơn', type: 'wild', reg: 'namman', x: 920, y: 1450, qi: 1.4, lv: 3, d: 'Núi tiếp núi không đếm xuể. Càng vào sâu yêu thú càng cổ xưa.' },
  { id: 'bachthao', n: 'Bách Thảo Cốc', type: 'sect', reg: 'namman', x: 1100, y: 1200, qi: 1.35, sect: 'bachthao', d: 'Thung lũng trồng linh thảo, cả tông môn thơm mùi thuốc.' },
  // --- Vân Mộng ---
  { id: 'vanmong', n: 'Vân Mộng Thành', type: 'town', reg: 'vanmong', x: 1500, y: 1120, qi: 0.95, auction: true, d: 'Thành trên mặt nước, đi lại bằng thuyền. Nhà đấu giá Túy Vân Lâu nổi tiếng thiên hạ.' },
  { id: 'bencat', n: 'Bến Cát', type: 'village', reg: 'vanmong', x: 1760, y: 1020, qi: 0.85, port: true, d: 'Làng chài nghèo bên cửa biển, có thuyền ra đảo nếu trả đủ tiền.' },
  { id: 'thuylien', n: 'Thủy Liên phường thị', type: 'market', reg: 'vanmong', x: 1600, y: 960, qi: 1, d: 'Phường thị trên những chiếc thuyền hoa, đèn sáng thâu đêm.' },
  { id: 'phuvan', n: 'Phù Vân Tông', type: 'sect', reg: 'vanmong', x: 1640, y: 800, qi: 1.55, sect: 'phuvan', d: 'Tông môn trên những ngọn núi nổi trong mây, giỏi phù lục và thân pháp.' },
  { id: 'daitrach', n: 'Vân Mộng Đại Trạch', type: 'wild', reg: 'vanmong', x: 1420, y: 1330, qi: 1.25, lv: 2, d: 'Đầm lớn tám trăm dặm, sương che mặt trời, giao xà ẩn dưới bèo.' },
  { id: 'mevu', n: 'Mê Vụ Lâm', type: 'wild', reg: 'vanmong', x: 1700, y: 1290, qi: 1.3, lv: 2, d: 'Rừng sương mê hoặc, đi vòng mười ngày vẫn về chỗ cũ.' },
  // --- Đông Hải ---
  { id: 'vonghai', n: 'Vọng Hải Thành', type: 'town', reg: 'donghai', x: 1800, y: 640, qi: 0.95, port: true, auction: true, d: 'Thành cảng lớn nhất bờ đông, thuyền buôn từ trăm đảo ghé về.' },
  { id: 'loiam', n: 'Lôi Âm Tự', type: 'sect', reg: 'donghai', x: 1700, y: 420, qi: 1.9, sect: 'loiam', d: 'Cổ tự trên đỉnh núi đá, mỗi lần chuông đánh là sấm rền.' },
  { id: 'huyenthuy', n: 'Huyền Thủy Cung', type: 'sect', reg: 'donghai', x: 2060, y: 900, qi: 1.6, sect: 'huyenthuy', island: true, d: 'Cung điện san hô trên đảo giữa biển, môn quy nghiêm, đệ tử phần nhiều là nữ.' },
  { id: 'luuly', n: 'Lưu Ly Đảo', type: 'market', reg: 'donghai', x: 2150, y: 640, qi: 1.1, island: true, d: 'Đảo phường thị, thuyền buôn hải ngoại đem về kỳ trân dị bảo.' },
  { id: 'toaitinh', n: 'Toái Tinh Hải', type: 'wild', reg: 'donghai', x: 2100, y: 1150, qi: 1.5, lv: 4, island: true, d: 'Vùng biển sao rơi, đá thiên thạch lấp lánh dưới đáy, hải yêu chiếm cứ.' },
  { id: 'loiminh', n: 'Lôi Minh Đảo', type: 'wild', reg: 'donghai', x: 2260, y: 960, qi: 1.6, lv: 5, island: true, d: 'Đảo sét đánh không ngừng. Lôi linh và lôi thú sinh ra từ sấm.' },
  // --- Tiên Châu ---
  { id: 'tutieu', n: 'Tử Tiêu Tiên Cung', type: 'sect', reg: 'tienchau', x: 2230, y: 300, qi: 2.4, sect: 'tutieu', island: true, d: 'Tiên cung trên mây tím, ngàn năm mới mở cửa thu đồ một lần.' },
  { id: 'tutieuthanh', n: 'Tử Tiêu Thành', type: 'town', reg: 'trungtho', x: 1100, y: 540, qi: 1.5, near: 'tutieu', patronSect: 'tutieu', d: 'Cổ thành dưới chân Hư Linh Tiên Sơn, không thuộc hoàng triều nào mà trực thuộc Tử Tiêu Tiên Cung. Mỗi năm tiên cung đều mở một kỳ thu đồ tại đây.' },
  { id: 'thiengoai', n: 'Thiên Ngoại phường thị', type: 'market', reg: 'tienchau', x: 2120, y: 430, qi: 1.5, island: true, d: 'Nơi đại năng trao đổi bảo vật, linh thạch thường không đủ, phải đổi vật lấy vật.' },
  { id: 'hukhong', n: 'Hư Không Liệt Cốc', type: 'wild', reg: 'tienchau', x: 2060, y: 220, qi: 2, lv: 7, island: true, d: 'Khe nứt không gian, bên kia là hư vô. Một bước sai là tan thành bụi.' },
  // --- Tông môn bổ sung ---
  { id: 'dieuduong', n: 'Diễm Dương Trang', type: 'sect', reg: 'tayluong', x: 540, y: 790, qi: 1.25, sect: 'dieuduong', d: 'Trang viện giữa ốc đảo, lò đan cháy ngày đêm bằng lửa mặt trời hội tụ qua gương đồng.' },
  { id: 'truyphong', n: 'Truy Phong Biệt Viện', type: 'sect', reg: 'bacminh', x: 870, y: 330, qi: 1.25, sect: 'truyphong', d: 'Biệt viện trên đồi trọc, gió thổi không ngừng. Đệ tử chạy đua với ngựa hoang mỗi sớm.' },
  { id: 'ngunguyen', n: 'Ngũ Nguyên Quán', type: 'sect', reg: 'trungtho', x: 1150, y: 790, qi: 1.25, sect: 'ngunguyen', d: 'Đạo quán nhỏ, cửa luôn mở. Ai linh căn tạp mà có lòng đều được nhận.' },
  { id: 'thinhtrieu', n: 'Thính Triều Các', type: 'sect', reg: 'vanmong', x: 1760, y: 1180, qi: 1.25, sect: 'thinhtrieu', d: 'Lầu các trên mỏm đá nhô ra biển, đệ tử ngồi thiền theo nhịp sóng.' },
  { id: 'ngulinh', n: 'Ngự Thú Sơn Trang', type: 'sect', reg: 'namman', x: 1010, y: 1360, qi: 1.45, sect: 'ngulinh', d: 'Sơn trang nuôi yêu thú giữa rừng già. Đệ tử nào cũng có một con linh sủng.' },
  { id: 'dieunhat', n: 'Diệu Nhật Thần Cung', type: 'sect', reg: 'tayluong', x: 170, y: 430, qi: 1.75, sect: 'dieunhat', d: 'Thần cung lát vàng trên đỉnh núi cát, ban ngày chói đến không mở được mắt.' },
  { id: 'kinhhong', n: 'Kinh Hồng Kiếm Các', type: 'sect', reg: 'bacminh', x: 760, y: 150, qi: 1.75, sect: 'kinhhong', d: 'Kiếm các dựng trên vách băng, mỗi ngày đều có sấm đánh xuống đỉnh tháp kiếm.' },
  { id: 'cuuu', n: 'Cửu U Minh Phủ', type: 'sect', reg: 'vanmong', x: 1250, y: 1420, qi: 1.7, sect: 'cuuu', d: 'Phủ đệ chìm dưới đầm đen, đèn xanh leo lét. Người ta nói nơi này nuôi hồn người chết.' },
  { id: 'bichlac', n: 'Bích Lạc Đan Tông', type: 'sect', reg: 'namman', x: 300, y: 1380, qi: 1.7, sect: 'bichlac', d: 'Đan tông lớn nhất phương nam, một viên đan của họ đổi được cả tòa thành.' },
  { id: 'thiendien', n: 'Thiên Diễn Các', type: 'sect', reg: 'donghai', x: 1790, y: 880, qi: 1.75, sect: 'thiendien', d: 'Lầu xem sao bên bờ biển. Các chủ nói đã đoán trước ngày ngươi tới.' },
  { id: 'huyennguyen', n: 'Huyền Nguyên Thánh Địa', type: 'sect', reg: 'trungtho', x: 1460, y: 470, qi: 2.3, sect: 'huyennguyen', d: 'Thánh địa ẩn sau mây ở cực đông dãy Thiên Trụ. Phàm nhân nhìn lên chỉ thấy núi, không thấy cửa.' },
  { id: 'batchu', n: 'Bất Chu Thánh Sơn', type: 'sect', reg: 'tayluong', x: 630, y: 410, qi: 2.3, sect: 'batchu', d: 'Ngọn núi gãy đỉnh cao nhất Thương Lan. Tương truyền từng là cột chống trời.' },
  // --- Bí cảnh ---
  { id: 'duocvien', n: 'Thượng Cổ Dược Viên', type: 'realm', reg: 'trungtho', x: 1270, y: 1060, qi: 2, lv: 1, minRealm: 1, open: [12, 1], d: 'Vườn thuốc của một vị tiên nhân đã mất. Mười hai năm cấm chế lỏng một lần.' },
  { id: 'kiemtrung', n: 'Kiếm Trủng', type: 'realm', reg: 'trungtho', x: 600, y: 560, qi: 2, lv: 2, minRealm: 2, open: [20, 1], d: 'Mộ của vạn thanh kiếm. Kiếm có linh, chọn người chứ không để người chọn.' },
  { id: 'longcung', n: 'Long Cung Di Tích', type: 'realm', reg: 'donghai', x: 1990, y: 1370, qi: 2.2, lv: 4, minRealm: 3, island: true, sea: true, open: [50, 3], d: 'Cung điện chân long chìm dưới đáy biển, năm mươi năm nước rút một lần.' },
  { id: 'thienma', n: 'Thiên Ma Quật', type: 'realm', reg: 'tayluong', x: 300, y: 290, qi: 2.4, lv: 5, minRealm: 4, open: [100, 5], d: 'Hang phong ấn thiên ma. Bảo vật nhiều, ma niệm càng nhiều.' },
];
for (const l of L) [l.x, l.y] = T(l.x, l.y);

// ---------- Địa điểm bổ sung (tọa độ trên bản đồ lớn) ----------
L.push(
  // Trung Thổ
  { id: 'daolam', n: 'Thôn Đào Lâm', type: 'village', reg: 'trungtho', x: 2200, y: 1720, qi: 0.85, d: 'Thôn nhỏ giữa rừng đào, mùa xuân hoa rụng kín đường.' },
  { id: 'vanbao', n: 'Vạn Bảo Lâu', type: 'market', reg: 'trungtho', x: 2640, y: 1760, qi: 1, d: 'Lầu buôn chín tầng cạnh kinh đô, tầng càng cao hàng càng quý, khách càng ít.' },
  { id: 'hoaiduong', n: 'Hoài Dương Thành', type: 'town', reg: 'trungtho', x: 2300, y: 2620, qi: 0.9, d: 'Thành bên sông Hoài, nổi tiếng trà và thư viện cổ.' },
  { id: 'bachlan', n: 'Thôn Bạch Lan', type: 'village', reg: 'trungtho', x: 2950, y: 1980, qi: 0.85, d: 'Thôn trồng lan trắng, hương thơm bay tới tận quan đạo.' },
  { id: 'thientru', n: 'Thiên Trụ Sơn Mạch', type: 'wild', reg: 'trungtho', x: 2560, y: 1240, qi: 1.35, lv: 2, d: 'Dãy núi chống trời chạy ngang Trung Thổ, vách đá dựng đứng, yêu cầm làm tổ.' },
  { id: 'tuyetuyen', n: 'Tuyệt Uyên Cốc', type: 'wild', reg: 'trungtho', x: 3320, y: 1560, qi: 1.4, lv: 4, d: 'Vực sâu không thấy đáy. Có người nói dưới đó là một thế giới khác.' },
  { id: 'cuudinh', n: 'Cửu Đỉnh Di Chỉ', type: 'realm', reg: 'trungtho', x: 2460, y: 1540, qi: 2.1, lv: 3, minRealm: 2, open: [30, 2], d: 'Nơi chín chiếc đỉnh trấn quốc thời thượng cổ từng đặt. Ba mươi năm cấm chế mở một lần.' },
  // Bắc Minh
  { id: 'mucduong', n: 'Thôn Mục Dương', type: 'village', reg: 'bacminh', x: 1450, y: 860, qi: 0.8, d: 'Thôn chăn cừu, lều nỉ trắng như nấm mọc trên thảo nguyên.' },
  { id: 'bangho', n: 'Băng Hồ Trấn', type: 'town', reg: 'bacminh', x: 2960, y: 960, qi: 0.9, d: 'Trấn dựng trên mặt hồ đóng băng quanh năm, đi chợ bằng xe trượt.' },
  { id: 'suongtuyet', n: 'Sương Tuyết Hiệp', type: 'wild', reg: 'bacminh', x: 2320, y: 660, qi: 1.35, lv: 3, d: 'Hẻm núi gió tuyết, tuyết lở chôn người như chôn kiến.' },
  { id: 'tuyetphong', n: 'Trại Tuyết Phong', type: 'village', reg: 'bacminh', x: 3500, y: 820, qi: 0.85, d: 'Trại săn trên sườn núi tuyết, người ở đây săn cả yêu thú.' },
  // Tây Lương
  { id: 'kimsa', n: 'Kim Sa Thành', type: 'town', reg: 'tayluong', x: 700, y: 1640, qi: 0.9, auction: true, d: 'Thành vàng giữa sa mạc, mái ngói dát vàng lá. Nhà đấu giá Kim Sa chuyên bán đồ cổ đào từ cát.' },
  { id: 'thanhtuyen', n: 'Ốc Đảo Thanh Tuyền', type: 'village', reg: 'tayluong', x: 1060, y: 2200, qi: 0.85, d: 'Ốc đảo có suối ngọt, thương đội nào cũng dừng chân.' },
  { id: 'hacsa', n: 'Hắc Sa Mạc', type: 'wild', reg: 'tayluong', x: 500, y: 2220, qi: 1.3, lv: 3, d: 'Sa mạc cát đen, ban ngày nóng chảy sắt, ban đêm lạnh đông máu.' },
  { id: 'hoathi', n: 'Hỏa Thị', type: 'market', reg: 'tayluong', x: 1290, y: 1450, qi: 1.05, d: 'Phường thị dưới chân núi lửa, chuyên bán hỏa tinh và vật liệu luyện khí.' },
  // Nam Man
  { id: 'trongdong', n: 'Bản Trống Đồng', type: 'village', reg: 'namman', x: 2060, y: 3000, qi: 0.85, d: 'Bản người Man giữ chiếc trống đồng ngàn năm, đánh lên là mưa xuống.' },
  { id: 'manvuong', n: 'Man Vương Thành', type: 'town', reg: 'namman', x: 1640, y: 3360, qi: 0.9, d: 'Thành của vua Man, tường đá xếp không cần vữa.' },
  { id: 'docvu', n: 'Độc Vụ Hạp', type: 'wild', reg: 'namman', x: 1500, y: 3060, qi: 1.3, lv: 2, d: 'Hẻm núi đầy sương độc màu tím, chỉ dân luyện độc mới dám vào.' },
  { id: 'manthan', n: 'Man Thần Tế Đàn', type: 'realm', reg: 'namman', x: 1920, y: 3460, qi: 2.1, lv: 3, minRealm: 2, open: [24, 2], d: 'Tế đàn của thần núi Man tộc, mỗi hai mươi bốn năm sương tan một lần.' },
  // Vân Mộng
  { id: 'liendang', n: 'Thôn Liên Đăng', type: 'village', reg: 'vanmong', x: 3150, y: 2460, qi: 0.85, d: 'Thôn thả đèn hoa sen mỗi rằm, cả mặt hồ sáng như trời sao.' },
  { id: 'thuyduong', n: 'Thủy Dương Trấn', type: 'town', reg: 'vanmong', x: 3460, y: 2900, qi: 0.9, d: 'Trấn trên cọc gỗ giữa đầm, nhà nào cũng có thuyền.' },
  { id: 'hongtrach', n: 'Hồng Liên Trạch', type: 'wild', reg: 'vanmong', x: 2950, y: 2900, qi: 1.3, lv: 3, d: 'Đầm sen đỏ như máu, nghe nói mọc trên xác một con giao long.' },
  // Đông Hải
  { id: 'haikhau', n: 'Hải Khẩu Ngư Thôn', type: 'village', reg: 'donghai', x: 4000, y: 1500, qi: 0.85, port: true, d: 'Làng chài ở cửa biển, có thuyền ra đảo và cả thuyền đi Vạn Yêu Lĩnh nếu trả đủ giá.' },
  { id: 'thanhlong', n: 'Thanh Long Đảo', type: 'wild', reg: 'donghai', x: 5000, y: 2860, qi: 1.6, lv: 5, island: true, d: 'Đảo hình con rồng nằm, giữa đảo có hồ nước xanh không bao giờ gợn sóng.' },
  // Cực Bắc Băng Vực
  { id: 'vinhda', n: 'Vĩnh Dạ Thành', type: 'town', reg: 'cucbac', x: 2050, y: 250, qi: 1, island: true, port: true, auction: true, d: 'Thành của đêm dài, đèn băng thắp quanh năm. Nhà đấu giá bán băng tinh vạn năm.' },
  { id: 'tuyetlang', n: 'Thôn Tuyết Lang', type: 'village', reg: 'cucbac', x: 1300, y: 290, qi: 0.9, island: true, d: 'Thôn người nuôi sói tuyết kéo xe.' },
  { id: 'cucquangthi', n: 'Cực Quang phường thị', type: 'market', reg: 'cucbac', x: 2800, y: 220, qi: 1.15, island: true, d: 'Phường thị chỉ họp khi cực quang hiện lên, tán tu cả bắc cảnh tụ về.' },
  { id: 'vinhdong', n: 'Vĩnh Đông Băng Hà', type: 'wild', reg: 'cucbac', x: 3420, y: 190, qi: 1.7, lv: 5, island: true, d: 'Sông băng ngàn dặm, bên dưới đóng băng cả những sinh vật từ thời thượng cổ.' },
  { id: 'tuyetma', n: 'Tuyết Ma Lĩnh', type: 'wild', reg: 'cucbac', x: 1620, y: 150, qi: 1.45, lv: 3, island: true, d: 'Núi tuyết có ma ảnh lang thang, đi vào thường nghe tiếng gọi tên mình.' },
  { id: 'bangmo', n: 'Băng Phong Thần Mộ', type: 'realm', reg: 'cucbac', x: 2420, y: 110, qi: 2.4, lv: 6, minRealm: 4, island: true, open: [60, 3], d: 'Mộ của một vị thần băng, sáu mươi năm băng tan một lần.' },
  // Nam Hải
  { id: 'ngoctrai', n: 'Ngọc Trai Thôn', type: 'village', reg: 'namhai', x: 2150, y: 3880, qi: 0.9, island: true, port: true, d: 'Thôn mò ngọc trai, đàn ông lặn biển, đàn bà xâu ngọc.' },
  { id: 'namhaithanh', n: 'Nam Hải Thành', type: 'town', reg: 'namhai', x: 3100, y: 4000, qi: 0.95, island: true, port: true, auction: true, d: 'Thành cảng phương nam, thuyền buôn trăm nước neo kín bến.' },
  { id: 'haithi', n: 'Hải Thị', type: 'market', reg: 'namhai', x: 3950, y: 3800, qi: 1.1, island: true, d: 'Phường thị trên lưng một con rùa khổng lồ đang ngủ — ít nhất người ta nói vậy.' },
  { id: 'phongbao', n: 'Phong Bạo Hải Vực', type: 'wild', reg: 'namhai', x: 3250, y: 4170, qi: 1.5, lv: 4, island: true, d: 'Vùng biển bão không bao giờ tan, sấm sét đánh xuống mặt nước như mưa.' },
  { id: 'quykhu', n: 'Quy Khư Hải Nhãn', type: 'realm', reg: 'namhai', x: 4600, y: 4170, qi: 2.6, lv: 7, minRealm: 5, island: true, open: [100, 5], d: 'Mắt biển nơi trăm sông đổ về, đáy là cung điện chìm của thời thượng cổ.' },
  // Vạn Yêu Lĩnh
  { id: 'banyeu', n: 'Thôn Bán Yêu', type: 'village', reg: 'vanyeu', x: 5420, y: 1300, qi: 1, island: true, port: true, d: 'Thôn của người lai yêu, tai thú đuôi cáo, hiền hơn người ta tưởng.' },
  { id: 'vanyeuthanh', n: 'Vạn Yêu Thành', type: 'town', reg: 'vanyeu', x: 5650, y: 1900, qi: 1.1, island: true, auction: true, d: 'Thành lớn nhất của yêu tộc. Người tu vào thành phải nộp một giọt máu làm tin.' },
  { id: 'yeuthi', n: 'Yêu Thị', type: 'market', reg: 'vanyeu', x: 5480, y: 2620, qi: 1.15, island: true, d: 'Chợ yêu tộc, bán yêu đan của chính đồng loại — chuyện bình thường ở đây.' },
  { id: 'thaicohoang', n: 'Thái Cổ Hoang Lâm', type: 'wild', reg: 'vanyeu', x: 5720, y: 2920, qi: 1.7, lv: 5, island: true, d: 'Rừng nguyên sinh từ thời khai thiên, cây cao chạm mây.' },
  { id: 'longcot', n: 'Long Cốt Sơn', type: 'wild', reg: 'vanyeu', x: 5930, y: 1680, qi: 1.8, lv: 6, island: true, d: 'Ngọn núi là bộ xương của một con rồng. Xương vẫn còn ấm.' },
  { id: 'yeuthanmo', n: 'Yêu Thần Mộ', type: 'realm', reg: 'vanyeu', x: 5640, y: 3220, qi: 2.5, lv: 6, minRealm: 4, island: true, open: [80, 4], d: 'Lăng của yêu thần đời đầu, tám mươi năm mở một lần.' },
  // Tiên Châu bổ sung
  { id: 'vantieu', n: 'Vân Tiêu Thiên Lộ', type: 'wild', reg: 'tienchau', x: 4900, y: 1320, qi: 2.1, lv: 6, island: true, d: 'Con đường đá trôi giữa mây, mỗi bậc là một thử thách của thiên địa.' },
  // Tông môn bổ sung
  { id: 'tuyetkiem', n: 'Tuyết Kiếm Sơn Trang', type: 'sect', reg: 'cucbac', x: 1000, y: 210, qi: 1.35, sect: 'tuyetkiem', island: true, d: 'Sơn trang luyện kiếm trong bão tuyết, kiếm khách ở đây không bao giờ run tay.' },
  { id: 'cucquang', n: 'Cực Quang Tông', type: 'sect', reg: 'cucbac', x: 3020, y: 330, qi: 1.55, sect: 'cucquang', island: true, d: 'Tông môn tu quang pháp dưới cực quang, áo trắng như tuyết.' },
  { id: 'cucbang', n: 'Cực Băng Thần Điện', type: 'sect', reg: 'cucbac', x: 3820, y: 250, qi: 2.3, sect: 'cucbang', island: true, d: 'Thần điện băng trên đỉnh thế giới, thánh địa duy nhất phương bắc.' },
  { id: 'haiyen', n: 'Hải Yến Môn', type: 'sect', reg: 'namhai', x: 2320, y: 3960, qi: 1.3, sect: 'haiyen', island: true, d: 'Môn phái nhỏ trên đảo đá, đệ tử bay lượn trên sóng như chim yến.' },
  { id: 'sanho', n: 'San Hô Các', type: 'sect', reg: 'namhai', x: 3820, y: 3940, qi: 1.5, sect: 'sanho', island: true, d: 'Lầu các bằng san hô trắng, giỏi dưỡng linh thảo biển.' },
  { id: 'longdinh', n: 'Thương Hải Long Đình', type: 'sect', reg: 'namhai', x: 4720, y: 4020, qi: 2.3, sect: 'longdinh', island: true, sea: true, d: 'Thánh địa dưới đáy Nam Hải, tông chủ được đồn mang huyết mạch chân long.' },
  { id: 'lucnha', n: 'Lục Nha Yêu Trại', type: 'sect', reg: 'vanyeu', x: 5860, y: 1340, qi: 1.5, sect: 'lucnha', island: true, d: 'Trại của yêu tu lang tộc, nhận cả nhân tộc nếu chịu được nghi thức huyết khế.' },
  { id: 'hoangthu', n: 'Hoang Thú Điện', type: 'sect', reg: 'vanyeu', x: 5400, y: 2300, qi: 1.75, sect: 'hoangthu', island: true, d: 'Điện thờ thú thần thời hồng hoang. Đệ tử luyện thân thành nửa người nửa thú.' },
  { id: 'vanyeudinh', n: 'Vạn Yêu Thánh Đình', type: 'sect', reg: 'vanyeu', x: 5820, y: 2440, qi: 2.3, sect: 'vanyeudinh', island: true, d: 'Triều đình của yêu tộc. Yêu Hoàng ngồi trên ngai xương rồng đã ba ngàn năm.' },
);
export const LOCS: Record<string, Loc> = Object.fromEntries(L.map((l) => [l.id, l]));
export const LOC_LIST = L;

// ---------- Tông môn ----------
export interface Sect {
  id: string;
  n: string;
  loc: string;
  tier: 1 | 2 | 3 | 4; // 1 hạ tông · 2 trung tông · 3 thượng tông · 4 thánh địa
  el: El[]; // linh căn được nhận
  minQ: number; // phẩm chất linh căn tối thiểu
  tech: string; // công pháp nhập môn
  craft: 'alch' | 'talis' | 'forge';
  evil?: boolean;
  fem?: boolean;
  d: string;
  motto: string;
  /** Chức vụ của người đứng đầu (vd. Vân Tiêu Tiên Tử, Yêu Hoàng, Hải Long Vương). */
  leader?: string;
  /** Long cung: Long Vương đương nhiệm, danh xưng (Hải/Giang/Hà Long Vương) và tiên chức Thiên Đình. */
  dragon?: { king: string; title: string; rank: string };
  /** Long cung chỉ thu nhận yêu thú hóa hình: 'thuy' thủy tộc (sông), 'hai' hải tộc (biển). */
  tribe?: 'thuy' | 'hai';
}
export const SECT_TIER = ['', 'Hạ tông', 'Trung tông', 'Thượng tông', 'Thánh địa'];
/** Cảnh giới tông chủ và tuổi tối đa nhận đệ tử mới theo bậc. */
export const SECT_TIER_INFO = [
  { chu: 0, maxAge: 99 },
  { chu: 3, maxAge: 30 },
  { chu: 4, maxAge: 22 },
  { chu: 5, maxAge: 18 },
  { chu: 6, maxAge: 16 },
];
/** Cảnh giới cao nhất thường thấy trong thế lực theo bậc (0 = tán tu / thế tục). */
export const SECT_TOP = [6, 3, 4, 6, 8];
/** Được xưng Lão Tổ: từ viên mãn của cảnh giới ngay dưới đỉnh thế lực trở lên.
 *  Hạ tông (đỉnh Kết Đan): Trúc Cơ viên mãn đã là lão tổ. Thánh địa (đỉnh Đại Thừa): Hóa Thần thì chưa. */
export function isLaoTo(r: number, st: number, tier: number): boolean {
  const top = SECT_TOP[tier] ?? 6;
  return r > top - 1 || (r === top - 1 && st >= 3);
}
/** Danh xưng theo đạo hiệu: Lão Tổ nếu đủ, không thì Chân Nhân / Tiên Tử. */
export const daoTitle = (tok: string, r: number, st: number, tier: number, g: 'm' | 'f') => `${tok} ${isLaoTo(r, st, tier) ? 'Lão Tổ' : g === 'm' ? 'Chân Nhân' : 'Tiên Tử'}`;
export const TITLE_RE = / (Lão Tổ|Chân Nhân|Tiên Tử)$/;
export const CRAFT_LABEL = { alch: 'luyện đan', talis: 'chế phù', forge: 'luyện khí' } as const;
export const SECTS: Record<string, Sect> = {
  // ---- Hạ tông (7) ----
  thanhha: { id: 'thanhha', n: 'Thanh Hà Kiếm Phái', loc: 'thanhha', tier: 1, el: ['kim', 'thuy'], minQ: 1, tech: 'thanhhakiem', craft: 'talis', d: 'Kiếm phái hạng hai nhưng nghĩa khí hạng nhất.', motto: 'Kiếm theo nước chảy, lòng chẳng theo dòng.' },
  hautho: { id: 'hautho', n: 'Hậu Thổ Tông', loc: 'hautho', tier: 1, el: ['tho'], minQ: 1, tech: 'hauthoquyet', craft: 'forge', d: 'Tông môn chậm rãi, thủ như núi.', motto: 'Đất dày chở vật.' },
  bachthao: { id: 'bachthao', n: 'Bách Thảo Cốc', loc: 'bachthao', tier: 1, el: ['moc'], minQ: 1, tech: 'xuansinhcong', craft: 'alch', d: 'Lấy y đạo nhập tiên đạo, giỏi luyện đan.', motto: 'Một cọng cỏ cũng là một mạng.' },
  dieuduong: { id: 'dieuduong', n: 'Diễm Dương Trang', loc: 'dieuduong', tier: 1, el: ['hoa'], minQ: 1, tech: 'liethoaquyet', craft: 'alch', d: 'Trang viện hỏa tu giữa sa mạc, giỏi khống hỏa luyện đan.', motto: 'Lửa không tắt thì đường không tận.' },
  truyphong: { id: 'truyphong', n: 'Truy Phong Biệt Viện', loc: 'truyphong', tier: 1, el: ['phong'], minQ: 1, tech: 'thanhphongquyet', craft: 'talis', d: 'Biệt viện phong tu trên thảo nguyên, chạy nhanh hơn ngựa.', motto: 'Gió không có nhà.' },
  ngunguyen: { id: 'ngunguyen', n: 'Ngũ Nguyên Quán', loc: 'ngunguyen', tier: 1, el: ['kim', 'moc', 'thuy', 'hoa', 'tho'], minQ: 1, tech: 'ngunguyenquyet', craft: 'alch', d: 'Đạo quán sẵn lòng thu nhận kẻ linh căn tạp, ngũ linh căn cũng được.', motto: 'Tạp mà không loạn.' },
  thinhtrieu: { id: 'thinhtrieu', n: 'Thính Triều Các', loc: 'thinhtrieu', tier: 1, el: ['thuy'], minQ: 1, tech: 'nhuocthuyquyet', craft: 'talis', d: 'Lầu các thủy tu bên biển, nghe sóng mà ngộ đạo.', motto: 'Sóng tới rồi sóng đi.' },
  // ---- Trung tông (6) ----
  phuvan: { id: 'phuvan', n: 'Phù Vân Tông', loc: 'phuvan', tier: 2, el: ['phong', 'moc'], minQ: 2, tech: 'phuvanbo', craft: 'talis', d: 'Tông môn phù lục và thân pháp, nhẹ như mây.', motto: 'Phú quý như mây nổi.' },
  lietduong: { id: 'lietduong', n: 'Liệt Dương Môn', loc: 'lietduong', tier: 2, el: ['hoa', 'kim'], minQ: 2, tech: 'lietduongcong', craft: 'forge', d: 'Hỏa tu cương mãnh, tính tình nóng như lửa.', motto: 'Đốt tận mới thấy vàng.' },
  hanbang: { id: 'hanbang', n: 'Hàn Băng Các', loc: 'hanbang', tier: 2, el: ['bang', 'thuy'], minQ: 2, tech: 'hanbangquyet', craft: 'talis', d: 'Băng tu lãnh đạm, tâm như mặt hồ đóng băng.', motto: 'Tĩnh cực sinh hàn.' },
  vandoc: { id: 'vandoc', n: 'Vạn Độc Giáo', loc: 'vandoc', tier: 2, el: ['moc', 'am'], minQ: 1, tech: 'vandockinh', craft: 'alch', evil: true, d: 'Tà phái nuôi cổ luyện độc. Không hỏi xuất thân, chỉ hỏi gan.', motto: 'Độc là thuốc, thuốc là độc.' },
  huyenthuy: { id: 'huyenthuy', n: 'Huyền Thủy Cung', loc: 'huyenthuy', tier: 2, el: ['thuy', 'bang'], minQ: 2, tech: 'huyenthuychanquyet', craft: 'alch', fem: true, d: 'Cung điện trên đảo, phần nhiều đệ tử là nữ, nam đệ tử phải có tư chất vượt trội.', motto: 'Thượng thiện nhược thủy.' },
  ngulinh: { id: 'ngulinh', n: 'Ngự Thú Sơn Trang', loc: 'ngulinh', tier: 2, el: ['tho', 'moc', 'phong'], minQ: 2, tech: 'ngulinhquyet', craft: 'alch', d: 'Sơn trang ngự thú, người với thú cùng tu.', motto: 'Thú có linh, người có nghĩa.' },
  // ---- Thượng tông (8) ----
  thaihuyen: { id: 'thaihuyen', n: 'Thái Huyền Đạo Tông', loc: 'thaihuyen', tier: 3, el: ['kim', 'moc', 'thuy', 'hoa', 'tho'], minQ: 4, tech: 'thaihuyenkinh', craft: 'talis', d: 'Đứng đầu chính đạo Thương Lan. Tuyển đệ tử khắt khe nhất thiên hạ.', motto: 'Đạo pháp tự nhiên.' },
  loiam: { id: 'loiam', n: 'Lôi Âm Tự', loc: 'loiam', tier: 3, el: ['loi', 'kim', 'quang'], minQ: 4, tech: 'loiamthien', craft: 'talis', d: 'Cổ tự Phật môn tu lôi pháp. Nhận cả tục gia đệ tử.', motto: 'Một tiếng sấm, tỉnh mộng ngàn năm.' },
  huyetsat: { id: 'huyetsat', n: 'Huyết Sát Điện', loc: 'huyetsat', tier: 3, el: ['am', 'hoa'], minQ: 3, tech: 'huyetsatma', craft: 'alch', evil: true, d: 'Ma đạo cự phách. Không cần tư chất cao, chỉ cần dám giết.', motto: 'Lấy máu người, nuôi đạo ta.' },
  dieunhat: { id: 'dieunhat', n: 'Diệu Nhật Thần Cung', loc: 'dieunhat', tier: 3, el: ['quang', 'hoa'], minQ: 4, tech: 'dieunhatkinh', craft: 'talis', d: 'Thần cung thờ mặt trời, tu quang pháp chí dương.', motto: 'Nơi nào có nắng, nơi đó có ta.' },
  kinhhong: { id: 'kinhhong', n: 'Kinh Hồng Kiếm Các', loc: 'kinhhong', tier: 3, el: ['kim', 'loi'], minQ: 4, tech: 'kinhhongkiem', craft: 'forge', d: 'Kiếm các phương bắc, kiếm tu mang lôi.', motto: 'Một kiếm kinh hồng, vạn dặm không người.' },
  cuuu: { id: 'cuuu', n: 'Cửu U Minh Phủ', loc: 'cuuu', tier: 4, el: ['am', 'thuy'], minQ: 5, tech: 'cuuuminhkinh', craft: 'alch', evil: true, d: 'Ma phủ dưới đầm đen, luyện âm hồn làm binh.', motto: 'Sống là khách, chết mới là chủ.' },
  bichlac: { id: 'bichlac', n: 'Bích Lạc Đan Tông', loc: 'bichlac', tier: 3, el: ['moc', 'hoa'], minQ: 4, tech: 'bichlacdankinh', craft: 'alch', d: 'Đan tông số một phương nam, đan sư đi đâu cũng được kính trọng.', motto: 'Một lò đan, nửa đời người.' },
  thiendien: { id: 'thiendien', n: 'Thiên Diễn Các', loc: 'thiendien', tier: 3, el: ['quang', 'thuy', 'phong'], minQ: 4, tech: 'thiendienquyet', craft: 'talis', d: 'Các phái suy diễn thiên cơ, phù trận vô song.', motto: 'Thiên cơ bất khả lộ — trừ khi trả đủ giá.' },
  // ---- Bổ sung: vùng đất mới ----
  tuyetkiem: { id: 'tuyetkiem', n: 'Tuyết Kiếm Sơn Trang', loc: 'tuyetkiem', tier: 1, el: ['bang', 'kim'], minQ: 1, tech: 'bangphachquyet', craft: 'forge', d: 'Sơn trang kiếm tu phương bắc, kiếm lạnh như băng.', motto: 'Tuyết rơi không tiếng, kiếm ra không hình.' },
  haiyen: { id: 'haiyen', n: 'Hải Yến Môn', loc: 'haiyen', tier: 1, el: ['thuy', 'phong'], minQ: 1, tech: 'nhuocthuyquyet', craft: 'talis', d: 'Môn phái đảo nhỏ, giỏi thân pháp trên sóng.', motto: 'Yến bay không sợ bão.' },
  cucquang: { id: 'cucquang', n: 'Cực Quang Tông', loc: 'cucquang', tier: 2, el: ['quang', 'bang'], minQ: 2, tech: 'luuquangquyet', craft: 'talis', d: 'Tông môn quang tu dưới cực quang phương bắc.', motto: 'Đêm càng dài, ánh sáng càng quý.' },
  sanho: { id: 'sanho', n: 'San Hô Các', loc: 'sanho', tier: 2, el: ['thuy', 'moc'], minQ: 2, tech: 'xuansinhcong', craft: 'alch', fem: true, d: 'Các phái nữ tu Nam Hải, dưỡng linh thảo dưới biển.', motto: 'Biển sâu cũng có hoa.' },
  lucnha: { id: 'lucnha', n: 'Lục Nha Yêu Trại', loc: 'lucnha', tier: 2, el: ['moc', 'phong'], minQ: 1, tech: 'ngulinhquyet', craft: 'alch', d: 'Trại yêu tu lang tộc, nhận cả nhân tộc qua huyết khế.', motto: 'Bầy sống, sói đơn chết.' },
  hoangthu: { id: 'hoangthu', n: 'Hoang Thú Điện', loc: 'hoangthu', tier: 3, el: ['tho', 'am'], minQ: 3, tech: 'baisonkinh', craft: 'alch', evil: true, d: 'Điện thờ thú thần hồng hoang, tu sĩ luyện thân thành nửa thú. Chính đạo coi là tà môn.', motto: 'Người là thú biết nói dối.' },
  // ---- Bổ sung: bốn vực ----
  thuongthuy: { id: 'thuongthuy', n: 'Thương Lan Thủy Phủ', loc: 'thuongthuy', tier: 3, el: ['thuy', 'loi'], minQ: 4, tech: 'tinhhaiquyet', craft: 'alch', d: 'Thủy phủ cổ xưa nhất Đông Vực, cửa phủ chìm dưới nước.', motto: 'Nước chảy đá mòn.' },
  bichdao: { id: 'bichdao', n: 'Bích Đào Cốc', loc: 'bichdao', tier: 2, el: ['moc', 'thuy'], minQ: 2, tech: 'xuansinhcong', craft: 'alch', d: 'Thung lũng đào biếc, đệ tử giỏi y thuật.', motto: 'Hoa nở không vì ai.' },
  ngutieu: { id: 'ngutieu', n: 'Ngư Tiều Môn', loc: 'ngutieu', tier: 1, el: ['thuy', 'tho'], minQ: 1, tech: 'nhuocthuyquyet', craft: 'talis', d: 'Môn phái của ngư phủ và tiều phu, đệ tử phần nhiều là con nhà nghèo.', motto: 'Có cá ăn cá, có củi đốt củi.' },
  kimdinh: { id: 'kimdinh', n: 'Kim Đỉnh Kiếm Tông', loc: 'kimdinh', tier: 3, el: ['kim', 'hoa'], minQ: 4, tech: 'canhkimkiem', craft: 'forge', d: 'Kiếm tông trên đỉnh núi vàng, kiếm khí chiếu sáng sa mạc.', motto: 'Kiếm không cùn, người không lùi.' },
  luusamon: { id: 'luusamon', n: 'Lưu Sa Môn', loc: 'luusamon', tier: 2, el: ['tho', 'kim'], minQ: 2, tech: 'trongsonquyet', craft: 'talis', d: 'Môn phái giữa biển cát chảy, giỏi trận pháp cát.', motto: 'Cát chảy thì đá đứng.' },
  hoaluyen: { id: 'hoaluyen', n: 'Hỏa Luyện Đường', loc: 'hoaluyen', tier: 1, el: ['hoa'], minQ: 1, tech: 'liethoaquyet', craft: 'forge', d: 'Đường luyện khí nhỏ bên núi lửa, đệ tử ai cũng biết rèn.', motto: 'Lửa thử vàng.' },
  vanlam: { id: 'vanlam', n: 'Vạn Lâm Kiếm Các', loc: 'vanlam', tier: 3, el: ['moc', 'phong'], minQ: 4, tech: 'thaiatmoc', craft: 'talis', d: 'Kiếm các giữa vạn cây, kiếm khí như lá rơi.', motto: 'Một lá rụng, biết mùa thu.' },
  hacthiem: { id: 'hacthiem', n: 'Hắc Thiềm Môn', loc: 'hacthiem', tier: 2, el: ['moc', 'am'], minQ: 1, tech: 'uamquyet', craft: 'alch', evil: true, d: 'Tà môn nuôi cóc độc, luyện độc thành đan.', motto: 'Độc nhất là lòng người.' },
  thaoduong: { id: 'thaoduong', n: 'Thảo Đường Phái', loc: 'thaoduong', tier: 1, el: ['moc'], minQ: 1, tech: 'thanhmocquyet', craft: 'alch', d: 'Phái nhỏ trong thảo đường, chữa bệnh cho dân bản.', motto: 'Cứu một người, hơn xây bảy tòa tháp.' },
  thiensuong: { id: 'thiensuong', n: 'Thiên Sương Các', loc: 'thiensuong', tier: 3, el: ['bang', 'quang'], minQ: 4, tech: 'tinhhaiquyet', craft: 'talis', d: 'Các phái trên đỉnh tuyết, sương sớm kết thành phù văn.', motto: 'Sương tan, đạo còn.' },
  phongkhieu: { id: 'phongkhieu', n: 'Phong Khiếu Môn', loc: 'phongkhieu', tier: 2, el: ['phong', 'bang'], minQ: 2, tech: 'canhphongquyet', craft: 'talis', d: 'Môn phái tu gió, đệ tử huýt sáo gọi bão.', motto: 'Gió không có hình, đạo không có cửa.' },
  tuyetnguyen: { id: 'tuyetnguyen', n: 'Tuyết Nguyên Phái', loc: 'tuyetnguyen', tier: 1, el: ['bang'], minQ: 1, tech: 'bangphachquyet', craft: 'forge', d: 'Phái nhỏ trên băng nguyên, sống bằng nghề săn và rèn.', motto: 'Lạnh thì rèn cho nóng.' },
  kinhngu: { id: 'kinhngu', n: 'Kình Ngư Môn', loc: 'kinhngu', tier: 1, el: ['thuy', 'kim'], minQ: 1, tech: 'nhuocthuyquyet', craft: 'talis', d: 'Môn phái đảo nhỏ ở Tây Hải, đệ tử cưỡi cá voi ra khơi.', motto: 'Biển rộng thì lòng phải rộng.' },
  luubang: { id: 'luubang', n: 'Lưu Băng Các', loc: 'luubang', tier: 2, el: ['bang', 'thuy'], minQ: 2, tech: 'hanbangquyet', craft: 'alch', d: 'Lầu các trên núi băng trôi giữa Bắc Hải, chẳng ai biết năm sau nó ở đâu.', motto: 'Băng trôi mà tâm không trôi.' },
  // ---- Thánh địa ----
  tutieu: { id: 'tutieu', n: 'Tử Tiêu Tiên Cung', loc: 'tutieu', tier: 4, el: ['loi', 'phong', 'hoa'], minQ: 5, tech: 'tutieuthan', craft: 'talis', d: 'Tiên cung trên mây tím của Hư Linh Tiên Sơn, đứng đầu ba thánh địa. Cung chủ là đại năng Luyện Hư.', motto: 'Đứng đầu thiên hạ thì phải gánh thiên hạ; đệ tử Tử Tiêu thấy nạn không được ngoảnh mặt.' },
  huyennguyen: { id: 'huyennguyen', n: 'Huyền Nguyên Thánh Địa', loc: 'huyennguyen', tier: 4, el: ['kim', 'thuy', 'quang', 'tho'], minQ: 5, tech: 'huyennguyen', craft: 'talis', d: 'Thánh địa chính đạo ẩn trong dãy Thiên Trụ, ngàn năm chưa từng để lộ sơn môn.', motto: 'Nguyên thủy quy nhất.' },
  batchu: { id: 'batchu', n: 'Bất Chu Thánh Sơn', loc: 'batchu', tier: 4, el: ['tho', 'moc', 'hoa', 'bang'], minQ: 5, tech: 'batchu', craft: 'alch', d: 'Thánh sơn trên núi gãy đỉnh. Đệ tử tu nhục thân tới mức đao kiếm khó vào.', motto: 'Trời sập thì ta chống.' },
  cucbang: { id: 'cucbang', n: 'Cực Băng Thần Điện', loc: 'cucbang', tier: 4, el: ['bang', 'thuy', 'quang'], minQ: 5, tech: 'huyenbang', craft: 'talis', d: 'Thánh địa duy nhất của Cực Bắc, thần điện băng đứng trên đỉnh thế giới.', motto: 'Băng không tan, đạo không đổi.' },
  longdinh: { id: 'longdinh', n: 'Thương Hải Long Đình', loc: 'longdinh', tier: 4, el: ['thuy', 'loi', 'kim'], minQ: 5, tech: 'bichhaitrieu', craft: 'alch', d: 'Thánh địa dưới đáy Nam Hải, đệ tử cưỡi giao long ra vào.', motto: 'Biển lớn dung trăm sông.' },
  vanyeudinh: { id: 'vanyeudinh', n: 'Vạn Yêu Thánh Đình', loc: 'vanyeudinh', tier: 4, el: ['moc', 'tho', 'am', 'phong'], minQ: 5, tech: 'vanyeuhoahinh', craft: 'alch', d: 'Triều đình yêu tộc. Nhân tộc được nhận làm khách khanh, hiếm khi làm đệ tử.', motto: 'Vạn yêu quy nhất.' },
};
/** Mười một bậc thân phận trong tông môn (thứ tự thăng tiến). */
export const SECT_RANKS = [
  'Tạp dịch', 'Ngoại môn đệ tử', 'Nội môn đệ tử', 'Trưởng lão ngoại môn', 'Ký danh đệ tử', 'Thân truyền đệ tử',
  'Thủ tịch đệ tử', 'Trưởng lão nội môn', 'Thánh tử', 'Tông chủ', 'Thái thượng trưởng lão',
];
export const RK = { TAP: 0, NGOAI: 1, NOI: 2, TL_NGOAI: 3, KYDANH: 4, THANTRUYEN: 5, THUTICH: 6, TL_NOI: 7, THANHTU: 8, CHU: 9, THAITHUONG: 10 } as const;
/** Tên chức chủ theo tên tông: Thánh chủ, Cung chủ, Các chủ, Cốc chủ... */
export function headTitle(sc: Sect): string {
  if (sc.tier === 4 && /Thánh Địa|Thánh Sơn|Thánh Đình/.test(sc.n)) return 'Thánh chủ';
  const pairs: [RegExp, string][] = [[/Tiên Cung|Thần Cung|Cung$/, 'Cung chủ'], [/Các$/, 'Các chủ'], [/Cốc$/, 'Cốc chủ'], [/Môn$/, 'Môn chủ'], [/Điện$/, 'Điện chủ'], [/Tự$/, 'Phương trượng'], [/Trang$/, 'Trang chủ'], [/Quán$/, 'Quán chủ'], [/Phủ$/, 'Phủ chủ'], [/Sơn$/, 'Sơn chủ'], [/Đình$/, 'Đình chủ'], [/Trại$/, 'Trại chủ'], [/Giáo$/, 'Giáo chủ'], [/Phái$/, 'Chưởng môn']];
  for (const [re, n] of pairs) if (re.test(sc.n)) return n;
  return 'Tông chủ';
}
/** Tên bậc theo tông và giới tính. */
export function rankLabel(rank: number, sc: Sect, g: 'm' | 'f' = 'm'): string {
  if (rank === RK.THANHTU) return g === 'f' ? 'Thánh nữ' : 'Thánh tử';
  if (rank === RK.CHU) return headTitle(sc);
  return SECT_RANKS[rank];
}
/** Điều kiện lên bậc rank ở tông sc: [cảnh giới tối thiểu, cống hiến]. Cảnh giới tính theo cảnh giới tông chủ (chu). */
export function promoReq(rank: number, sc: Sect): [number, number] {
  const c = SECT_TIER_INFO[sc.tier].chu;
  const realm = [0, 1, Math.min(2, c - 1), c - 1, c - 1, c - 1, c - 1, c, c, c, c][rank];
  const contrib = [0, 20, 80, 250, 400, 700, 1200, 2000, 3000, 5000, 0][rank];
  return [Math.max(0, realm), Math.round(contrib * (0.6 + 0.2 * sc.tier))];
}
/** Bổng lộc hằng năm theo bậc (hệ số). Thái thượng ít việc nên lộc thấp hơn tông chủ. */
export const RANK_PAY = [2, 4, 7, 10, 12, 16, 22, 28, 40, 80, 60];

// ---------- Yêu thú ----------
export interface Beast {
  n: string;
  el: El;
  lv: [number, number]; // khoảng cảnh giới
  reg?: string[];
  mat: string; // vật liệu rơi
  home?: string; // tổ thú Sơn Hải Kinh: chỉ ở núi của mình
  shj?: string; // lời chép trong Sơn Hải Kinh
  origin?: string; // nguồn gốc được xác định riêng, dùng khi không có nơi ở hoặc phả hệ
  anc?: string; // hậu duệ: tên tổ thú
  population?: bigint; // số cá thể của loài trong phả hệ
  blood?: 0 | 1 | 2; // 0 thuần huyết · 1 huyết mạch đậm · 2 huyết mạch loãng
  codexOnly?: boolean; // tổ tiên trong Đồ giám, không xuất hiện làm địch
  codexHidden?: boolean; // biến thể chiến đấu, không phải một loài riêng trong Đồ giám
  codexOrder?: number;
  shjLineage?: boolean; // tổ tiên của một nhánh được ghi trong Sơn Hải Kinh
}
export const BEASTS: Beast[] = [
  { n: 'Hắc Phong Lang', el: 'phong', lv: [0, 1], reg: ['trungtho', 'bacminh'], mat: 'longthu' },
  { n: 'Thiết Bối Trư', el: 'tho', lv: [0, 1], mat: 'dayeu', anc: 'Hợp Dũ', blood: 2, origin: 'Hậu duệ của Hợp Dũ, dị thú mình lợn mặt người được ghi trong Sơn Hải Kinh.' },
  { n: 'Xích Diễm Hồ', el: 'hoa', lv: [1, 2], reg: ['tayluong', 'trungtho'], mat: 'yeudan' },
  { n: 'Thanh Lân Mãng', el: 'moc', lv: [1, 3], reg: ['namman', 'vanmong'], mat: 'dayeu' },
  { n: 'Kim Giáp Ngô Công', el: 'kim', lv: [1, 2], reg: ['namman'], mat: 'docnang' },
  { n: 'Tuyết Ảnh Hồ', el: 'bang', lv: [1, 3], reg: ['bacminh', 'cucbac'], mat: 'longthu' },
  { n: 'Ngân Nguyệt Lang Vương', el: 'kim', lv: [2, 3], mat: 'yeudan' },
  { n: 'Độc Giác Thủy Tê', el: 'thuy', lv: [2, 3], reg: ['vanmong', 'donghai'], mat: 'yeudan' },
  { n: 'Sa Hạt Vương', el: 'tho', lv: [2, 4], reg: ['tayluong'], mat: 'docnang' },
  { n: 'Liệt Diễm Sư', el: 'hoa', lv: [3, 4], reg: ['tayluong'], mat: 'yeudan' },
  { n: 'Băng Phách Hùng', el: 'bang', lv: [3, 4], reg: ['bacminh', 'cucbac'], mat: 'dayeu' },
  { n: 'Tử Điện Điêu', el: 'loi', lv: [3, 5], reg: ['donghai', 'tienchau'], mat: 'longthu' },
  { n: 'Cửu Đầu Xà', el: 'thuy', lv: [3, 5], reg: ['namman', 'vanmong', 'vanyeu'], mat: 'docnang' },
  { n: 'Phệ Kim Thú', el: 'kim', lv: [4, 5], mat: 'yeudan', origin: 'Hậu duệ của Thôn Kim Thử ở Thần Giới.' },
  { n: 'Hải Giao', el: 'thuy', lv: [4, 6], reg: ['donghai', 'namhai', 'tayhai', 'bachai', 'noihai'], mat: 'longlan' },
  { n: 'Lôi Linh Thú', el: 'loi', lv: [5, 6], reg: ['donghai', 'tienchau', 'namhai', 'noihai'], mat: 'yeudan' },
  { n: 'Cổ Mộc Thụ Yêu', el: 'moc', lv: [4, 6], reg: ['namman', 'vanyeu'], mat: 'linhmoc' },
  { n: 'Phệ Hồn Ma Ảnh', el: 'phong', lv: [5, 7], mat: 'yeudan', anc: 'Bào Hào', blood: 2, origin: 'Hậu duệ của Thao Thiết (Bào Hào), dị thú được ghi trong Sơn Hải Kinh.' },
  { n: 'Hỏa Kỳ Lân Thú', el: 'hoa', lv: [6, 8], mat: 'longlan' },
  { n: 'Hư Không Trùng', el: 'loi', lv: [6, 8], reg: ['tienchau'], mat: 'hukhongthach' },
  { n: 'Âm Trạch Thi Quỷ', el: 'am', lv: [1, 2], reg: ['vanmong', 'namman'], mat: 'docnang' },
  { n: 'Dạ Xoa Ảnh Báo', el: 'am', lv: [2, 4], reg: ['vanmong', 'tayluong', 'namman'], mat: 'longthu' },
  { n: 'Kim Ô Linh Điểu', el: 'quang', lv: [3, 5], reg: ['tayluong', 'tienchau'], mat: 'yeudan' },
  { n: 'Bạch Trạch Thánh Thú', el: 'quang', lv: [5, 7], reg: ['tienchau', 'bacminh'], mat: 'longlan' },
  { n: 'Bạch Trạch Linh Thú', el: 'quang', lv: [4, 6], reg: ['tienchau', 'bacminh'], anc: 'Bạch Trạch Thánh Thú', blood: 1, mat: 'tuduehuyet' },
  { n: 'Bạch Trạch Dị Thú', el: 'quang', lv: [2, 4], reg: ['tienchau', 'bacminh'], anc: 'Bạch Trạch Linh Thú', blood: 2, mat: 'yeudan' },
];

// ================= Hoàng triều =================
export interface Empire {
  id: string;
  n: string;
  capital: string; // id thành làm kinh đô
  tier: 1 | 2 | 3; // 1 tiểu quốc (hộ quốc Kết Đan) · 2 vương triều (Nguyên Anh) · 3 hoàng triều Trung Vực (Hóa Thần)
  vassal?: string; // thuộc quốc của triều đình chủ châu (mỗi châu chỉ một triều đình chính, có vương miện trên bản đồ)
  ruler: string; // tước hiệu người đứng đầu
  patron: string | null; // tông môn / thánh địa hậu thuẫn
  d: string;
}
export const EMPIRE_TIER = ['', 'Tiểu quốc', 'Vương triều', 'Hoàng triều'];
/** Cảnh giới hộ quốc lão tổ theo bậc — luôn kém thánh địa (Luyện Hư) ít nhất một bậc. */
export const EMPIRE_GUARD = [0, 3, 4, 5];
export const EMPIRES: Record<string, Empire> = {
  daichu: { id: 'daichu', n: 'Đại Chu Hoàng Triều', capital: 'kinhdo', tier: 3, ruler: 'Hoàng đế', patron: 'huyennguyen', d: 'Hoàng triều lâu đời nhất Trung Vực, chín trăm năm xã tắc. Tạ thị ba đời làm quốc sư, sau lưng là Huyền Nguyên Thánh Địa.' },
  daingy: { id: 'daingy', n: 'Đại Ngụy Hoàng Triều', capital: 'cuuchau', tier: 3, ruler: 'Hoàng đế', patron: 'batchu', d: 'Hoàng triều thượng võ, quân đội có cả tu sĩ Kết Đan cầm binh. Cửu Châu Thành chín cửa là kinh đô của họ.' },
  daiyen: { id: 'daiyen', n: 'Đại Yên Hoàng Triều', capital: 'hoaiduong', tier: 3, ruler: 'Nữ đế', patron: 'tutieu', d: 'Hoàng triều do nữ đế trị vì, Công Tôn thị nắm triều chính. Đứng sau là Tử Tiêu Tiên Cung — và tham vọng nuốt trọn Trung Vực.' },
  daican: { id: 'daican', n: 'Đại Càn Hoàng Triều', capital: 'thienkhuyet', tier: 3, ruler: 'Hoàng đế', patron: 'tutieu', d: 'Hoàng triều đóng đô ngay dưới chân Tử Tiêu Tiên Cung, tự xưng "thiên tử chi quốc". Mọi chiếu chỉ đều đóng thêm ấn của Tiên Cung.' },
  daiha: { id: 'daiha', n: 'Đại Hạ Hoàng Triều', capital: 'thanhdo', tier: 3, ruler: 'Hoàng đế', patron: 'batchu', d: 'Hoàng triều cổ nhất phương nam Trung Vực, kinh đô Thánh Đô dựng trên nền đô thành của Nhân Hoàng thuở trước. Bất Chu Thánh Sơn là chỗ dựa.' },
  dongviet: { id: 'dongviet', n: 'Đông Việt Vương Triều', capital: 'lamgiang', tier: 2, ruler: 'Quốc vương', patron: 'thuongthuy', d: 'Vương triều sông nước giàu nhất Đông Vực, thuyền buôn của họ đi khắp các hải vực.' },
  lacthuy: { id: 'lacthuy', n: 'Lạc Thủy Quốc', capital: 'thuyduong', tier: 1, ruler: 'Quốc chủ', patron: null, d: 'Tiểu quốc trên đầm lầy, nhà cửa dựng trên cọc. Nghèo nhưng yên ổn.' },
  tayluongquoc: { id: 'tayluongquoc', n: 'Tây Lương Vương Triều', capital: 'tamhoa', tier: 2, ruler: 'Quốc vương', patron: 'kimdinh', d: 'Vương triều của thương lộ sa mạc, kỵ binh lạc đà và kiếm sĩ áo vàng.' },
  hoangsaquoc: { id: 'hoangsaquoc', n: 'Hoàng Sa Quốc', capital: 'hoangsa', tier: 1, ruler: 'Quốc chủ', patron: null, d: 'Tiểu quốc trong ốc đảo, sống nhờ thuế thương đội. Mộ Dung thị mới là người nói có trọng lượng.' },
  namchieu: { id: 'namchieu', n: 'Nam Chiếu Vương Triều', capital: 'tuongthanh', tier: 2, ruler: 'Quốc vương', patron: 'bichlac', d: 'Vương triều cưỡi voi của Nam Vực, thờ thần núi và trọng đan sư như khanh tướng.' },
  manquoc: { id: 'manquoc', n: 'Man Quốc', capital: 'manvuong', tier: 1, ruler: 'Man vương', patron: 'vandoc', d: 'Liên minh các bản Man, vua do các tộc trưởng bầu ra. Vạn Độc Giáo ngấm ngầm giật dây.' },
  socphongquoc: { id: 'socphongquoc', n: 'Sóc Phong Vương Triều', capital: 'hantinh', tier: 2, ruler: 'Quốc vương', patron: 'thiensuong', d: 'Vương triều phương bắc canh giữ biên ải trước băng nguyên, binh sĩ đều luyện thể.' },
  bachlang: { id: 'bachlang', n: 'Bạch Lang Hãn Quốc', capital: 'socphong', tier: 1, ruler: 'Khả hãn', patron: null, d: 'Hãn quốc du mục thờ sói trắng, ngựa nhiều hơn người.' },
  // Đông Vực
  phuongchau: { id: 'phuongchau', n: 'Phượng Châu Vương Triều', capital: 'phuongchau', tier: 2, ruler: 'Quốc vương', patron: 'thiendien', d: 'Vương triều cảng biển, thờ chim phượng, đối đầu Đông Việt giành quyền thương lộ.' },
  vanmongquoc: { id: 'vanmongquoc', n: 'Vân Mộng Quốc', capital: 'vanmong', tier: 1, ruler: 'Quốc chủ', patron: null, d: 'Tiểu quốc trên mặt nước, Ôn thị Vân Mộng mới là người nắm thực quyền.' },
  vonghaiquoc: { id: 'vonghaiquoc', n: 'Vọng Hải Quốc', capital: 'vonghai', tier: 1, ruler: 'Quốc chủ', patron: null, d: 'Tiểu quốc cảng biển dưới bóng Đoan Mộc thị, quốc khố đầy thuế thuyền.' },
  // Tây Vực
  ngocmon: { id: 'ngocmon', n: 'Ngọc Môn Vương Triều', capital: 'ngocmon', tier: 2, ruler: 'Quốc vương', patron: 'dieunhat', d: 'Vương triều giữ cửa ải ngọc, thu thuế mọi thương đội ra vào Tây Vực.' },
  kimsaquoc: { id: 'kimsaquoc', n: 'Kim Sa Quốc', capital: 'kimsa', tier: 1, ruler: 'Quốc chủ', patron: null, d: 'Tiểu quốc giàu vàng nhờ đào cổ vật dưới cát.' },
  thietquoc: { id: 'thietquoc', n: 'Thiết Quốc', capital: 'thietthanh', tier: 1, ruler: 'Quốc chủ', patron: 'lietduong', d: 'Tiểu quốc của thợ rèn; binh khí của họ bán khắp năm vực. Hoắc thị chống lưng.' },
  // Nam Vực
  phithuy: { id: 'phithuy', n: 'Phỉ Thúy Vương Triều', capital: 'phidien', tier: 2, ruler: 'Nữ vương', patron: 'vanlam', d: 'Vương triều ruộng bậc thang do nữ vương trị vì, kiếm tu Vạn Lâm Kiếm Các làm cận vệ.' },
  namcuongquoc: { id: 'namcuongquoc', n: 'Nam Cương Quốc', capital: 'namcuong', tier: 1, ruler: 'Quốc chủ', patron: null, d: 'Tiểu quốc đá giữa rừng già, Khương thị giữ chức ngự y đời đời.' },
  vanyeuquoc: { id: 'vanyeuquoc', n: 'Vạn Yêu Quốc', capital: 'vanyeuthanh', tier: 1, ruler: 'Yêu vương', patron: 'vanyeudinh', d: 'Quốc gia của yêu tộc hóa hình, chư hầu của Vạn Yêu Thánh Đình. Người tu vào thành phải nộp máu làm tin.' },
  // Bắc Vực
  bacquan: { id: 'bacquan', n: 'Bắc Quan Vương Triều', capital: 'bacquan', tier: 2, ruler: 'Quốc vương', patron: 'kinhhong', d: 'Vương triều quân sự, cả nước là một doanh trại canh giữ thảo nguyên.' },
  banghoquoc: { id: 'banghoquoc', n: 'Băng Hồ Quốc', capital: 'bangho', tier: 1, ruler: 'Quốc chủ', patron: 'hanbang', d: 'Tiểu quốc trên hồ băng, Lãnh thị và Hàn Băng Các thay nhau giật dây.' },
  vinhdaquoc: { id: 'vinhdaquoc', n: 'Vĩnh Dạ Quốc', capital: 'vinhda', tier: 1, ruler: 'Quốc chủ', patron: 'cucbang', d: 'Tiểu quốc nơi đêm dài nửa năm, dân thắp đèn băng sống qua mùa tối.' },
};
export const empireAt = (locId: string) => Object.values(EMPIRES).find((e) => e.capital === locId) || null;
export const COURT_RANKS = ['Khách khanh', 'Cung phụng', 'Hộ quốc chân nhân'];
/** Cảnh giới cần cho từng chức ở hoàng triều bậc t. */
export const courtReq = (rank: number, tier: number) => Math.max(1, EMPIRE_GUARD[tier] - 2 + rank);

// ================= Bố cục thế giới: 5 vực =================
// Trung Vực là hình bầu dục lớn ở giữa; bốn vực bao quanh theo hướng. Vị trí mỗi địa điểm
// được tính theo quy tắc: thế lực càng mạnh càng gần Trung Vực, càng yếu càng ra xa bờ biển.
const CX = MAP_W / 2, CY = MAP_H / 2;
/** Mỗi vực là một lục địa riêng, cách nhau bởi biển. */
export const LANDMASS: Record<Vuc, { x: number; y: number; rx: number; ry: number }> = {
  trung: { x: CX, y: CY, rx: 1500, ry: 1060 },
  dong: { x: CX + 3000, y: CY, rx: 1000, ry: 1780 },
  tay: { x: CX - 3000, y: CY, rx: 1000, ry: 1780 },
  nam: { x: CX, y: CY + 2300, rx: 2250, ry: 880 },
  bac: { x: CX, y: CY - 2300, rx: 2250, ry: 880 },
};
export const TRUNG_R = { rx: LANDMASS.trung.rx, ry: LANDMASS.trung.ry };
export const OUTER_R = { rx: 3000, ry: 2150 };
const hrand = (s: string, k = 0) => {
  let h = 2166136261 ^ k;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
};
const DEG = Math.PI / 180;
/** Phần ngang (lệch trái/phải so với trục hướng về Trung Vực) cho vùng con: [-1..1]. */
const SUB_LAT: Record<string, [number, number]> = {
  vanmong: [0.05, 1], donghai: [-1, -0.05], namman: [0.05, 1], vanyeu: [-1, -0.05], bacminh: [-1, 1], cucbac: [-1, 1], tayluong: [-1, 1],
};
// Dời một số nơi cho đúng thế cục: hạ tông, hiểm địa cấp thấp rời Trung Vực; Bất Chu vào Trung Vực.
const MOVE: Record<string, string> = { langtrang: 'vanmong', thachkieu: 'tayluong', daolam: 'bacminh', bachlan: 'vanmong', linhtuyenthon: 'namman', vanphong: 'bacminh', thanhhathi: 'namman', vanbao: 'vanmong', vantien: 'tayluong', thiengoai: 'donghai', thaihuyen: 'bacminh', thanhha: 'namman', hacphong: 'namman', duocvien: 'namman', hautho: 'tayluong', kiemtrung: 'tayluong', thietthanh: 'tayluong', ngunguyen: 'vanmong', batchu: 'trungtho' };
const LANDED = new Set(['tienchau', 'cucbac', 'vanyeu']);
/** t: 0 = bờ quay về Trung Vực (mạnh), 1 = bờ xa (yếu). */
function placeT(l: Loc): number {
  const r = (a: number, b: number) => a + (b - a) * hrand(l.id, 7);
  const emp = empireAt(l.id);
  if (emp) return emp.tier >= 2 ? r(0.04, 0.16) : r(0.6, 0.85);
  if (l.reg === 'cucbac') return r(0.78, 0.97);
  if (l.type === 'sect' && l.sect) {
    const tier = SECTS[l.sect].tier;
    if (l.id === 'cucbang') return 0.95;
    if (l.id === 'vanyeudinh') return 0.85;
    return tier === 3 ? r(0.03, 0.2) : tier === 2 ? r(0.28, 0.55) : r(0.62, 0.92);
  }
  if (l.type === 'town') return l.auction ? r(0.08, 0.3) : r(0.25, 0.75);
  if (l.type === 'market') return r(0.15, 0.6);
  if (l.type === 'village') return r(0.55, 0.95);
  const lv = l.lv ?? 1;
  return Math.max(0.05, Math.min(0.95, (l.type === 'realm' ? 0.85 : 0.95) - lv * 0.11 + (hrand(l.id, 9) - 0.5) * 0.1));
}
function placeF(l: Loc): number {
  const r = (a: number, b: number) => a + (b - a) * hrand(l.id, 7);
  if (empireAt(l.id)) return r(0.55, 0.72); // hoàng triều Trung Vực: vòng ngoài thánh địa
  if (l.type === 'sect') return r(0.34, 0.5);
  if (l.reg === 'tienchau') return r(0.16, 0.26);
  if (l.type === 'town') return r(0.25, 0.8);
  if (l.type === 'village') return r(0.6, 0.9);
  return r(0.3, 0.88);
}
/** Điểm trong lục địa của vực v theo t (từ bờ gần Trung Vực ra bờ xa) và lat (ngang). */
function inLand(v: Exclude<Vuc, 'trung'>, t: number, lat: number): [number, number] {
  const m = LANDMASS[v];
  const along = -0.82 + 1.64 * t; // -0.82: sát bờ gần trung tâm
  const half = Math.sqrt(Math.max(0, 1 - along * along)) * 0.82;
  const side = lat * half;
  if (v === 'dong') return [m.x + along * m.rx, m.y + side * m.ry];
  if (v === 'tay') return [m.x - along * m.rx, m.y + side * m.ry];
  if (v === 'nam') return [m.x + side * m.rx, m.y + along * m.ry];
  return [m.x + side * m.rx, m.y - along * m.ry];
}
export const vucOf = (l: Loc): Vuc => REGIONS[l.reg].vuc;
export function makeFormationLocations(
  prefix: string,
  regions: Record<string, Region>,
  landmass: Record<Vuc, { x: number; y: number; rx: number; ry: number }>,
  regionIds: Record<Vuc, string>,
): Loc[] {
  const links = [
    { outer: 'dong', name: 'Đông', fullName: 'Đông Vực', side: 'east' },
    { outer: 'tay', name: 'Tây', fullName: 'Tây Vực', side: 'west' },
    { outer: 'nam', name: 'Nam', fullName: 'Nam Vực', side: 'south' },
    { outer: 'bac', name: 'Bắc', fullName: 'Bắc Vực', side: 'north' },
  ] as const;
  const center = landmass.trung;
  return links.flatMap(({ outer, name, fullName, side }) => {
    const edge = landmass[outer];
    const centerId = `${prefix}formation_trung_${outer}`;
    const outerId = `${prefix}formation_${outer}_trung`;
    const centerXY: [number, number] = side === 'east'
      ? [center.x + center.rx * 0.9, center.y]
      : side === 'west'
      ? [center.x - center.rx * 0.9, center.y]
      : side === 'south'
      ? [center.x, center.y + center.ry * 0.9]
      : [center.x, center.y - center.ry * 0.9];
    const outerXY: [number, number] = side === 'east'
      ? [edge.x - edge.rx * 0.98, edge.y]
      : side === 'west'
      ? [edge.x + edge.rx * 0.98, edge.y]
      : side === 'south'
      ? [edge.x, edge.y - edge.ry * 0.98]
      : [edge.x, edge.y + edge.ry * 0.98];
    return [
      {
        id: centerId, n: `Trận Trung - ${name}`, type: 'formation',
        reg: regionIds.trung, x: centerXY[0], y: centerXY[1], xy: centerXY, qi: 1.5,
        formationTo: outerId, d: `Cổ trận đặt nơi giáp Trung Vực và ${fullName}, có thể truyền tới đầu trận bên kia.`,
      },
      {
        id: outerId, n: `Trận ${name} - Trung`, type: 'formation',
        reg: regionIds[outer], x: outerXY[0], y: outerXY[1], xy: outerXY, qi: 1.5,
        formationTo: centerId, d: `Cổ trận đặt nơi giáp ${fullName} và Trung Vực, có thể truyền tới đầu trận bên kia.`,
      },
    ];
  });
}
const BASE_FORMATIONS = makeFormationLocations('', REGIONS, LANDMASS, {
  trung: 'trungtho', dong: 'vanmong', tay: 'tayluong', nam: 'namman', bac: 'bacminh',
});
L.push(...BASE_FORMATIONS);
Object.assign(LOCS, Object.fromEntries(BASE_FORMATIONS.map((l) => [l.id, l])));
/** Khoảng góc (độ, 0 = đông, 90 = nam, ±180 = tây, -90 = bắc) ép cho địa điểm Trung Vực,
 *  chia đều thế lực theo bốn vùng khí hậu: đông rừng xanh, nam núi lửa, tây sa mạc, bắc băng tuyết.
 *  Ba thánh địa: Tử Tiêu ở lõi, Huyền Nguyên (kim thuỷ) ở tây, Bất Chu (thổ hoả) ở nam.
 *  Ba hoàng triều mỗi triều một châu, cách xa nhau: Đại Chu bắc, Đại Ngụy tây, Đại Yên đông. */
const TRUNG_ANG: Record<string, [number, number] | [number, number, number, number]> = {
  // đông — Lâm Châu: Đại Yên Hoàng Triều (Hoài Dương Thành), Diệp gia Tổ Địa
  thientru: [-38, -30], diepgia: [-15, -5], hoaiduong: [8, 18], thienhac: [22, 30], lamthanh: [30, 37],
  // nam — Hoàng Châu: Bất Chu Thánh Sơn
  cuudinh: [60, 70], cochien: [80, 90], thanhdo: [98, 108], batchu: [118, 128],
  // tây — Kim Châu: Đại Ngụy Hoàng Triều (Cửu Châu Thành), Huyền Nguyên Thánh Địa
  thienvan: [142, 152], thanhchien: [160, 170], huyennguyen: [174, 184], cuuchau: [192, 202],
  // bắc — Thiên Châu: Đại Chu Hoàng Triều (Thiên Kinh)
  tuyetuyen: [-124, -114], kinhdo: [-105, -95], linhmach: [-85, -78], thienkhuyet: [-66, -56],
};
function layout() {
  for (const l of L) {
    if (MOVE[l.id]) l.reg = MOVE[l.id];
    if (LANDED.has(l.reg)) l.island = false;
  }
  for (const l of L) {
    const v = vucOf(l);
    if (l.shj) {
      const [k, i, n] = l.shj;
      const u = n > 1 ? i / (n - 1) : 0.5;
      const wig = (hrand(l.id, 21) - 0.5) * 0.25;
      if (l.shjXY) [l.x, l.y] = l.shjXY;
      else if (k === 'nam') [l.x, l.y] = inLand('nam', 0.42 + (i % 2 ? 0.16 : -0.06) + wig * 0.4, -0.85 + 1.7 * u); // tây → đông
      else if (k === 'tay') [l.x, l.y] = inLand('tay', 0.12 + 0.8 * u, (i % 2 ? 0.35 : -0.35) + wig); // gần → xa về tây
      else if (k === 'bac') [l.x, l.y] = inLand('bac', 0.12 + 0.8 * u, (i % 2 ? 0.4 : -0.4) + wig); // nam → bắc
      else if (k === 'dong') [l.x, l.y] = inLand('dong', 0.45 + (i % 2 ? 0.15 : -0.1) + wig * 0.4, -0.8 + 1.6 * u); // bắc → nam
      else { const a = (200 + u * 300) * DEG; l.x = CX + Math.cos(a) * TRUNG_R.rx * 0.8; l.y = CY + Math.sin(a) * TRUNG_R.ry * 0.8; }
      continue;
    }
    if (l.xy) { [l.x, l.y] = l.xy; continue; } // long cung ngoài biển: toạ độ cố định
    if (l.island) {
      // Đông Hải: ngoài khơi phía đông; Nam Hải: vùng biển đông nam
      // quần đảo tự nhiên: mỗi hải vực vài cụm, đảo rải lệch quanh tâm cụm
      const CLUSTERS: Record<string, [number, number][]> = {
        donghai: [[CX + 4250, CY - 1450], [CX + 4550, CY + 150], [CX + 4200, CY + 1650]],
        tayhai: [[CX - 4300, CY - 1100], [CX - 4500, CY + 900]],
        bachai: [[CX - 1700, CY - 3650], [CX + 1500, CY - 3550]],
        namhai: [[CX - 1900, CY + 3600], [CX + 250, CY + 3750], [CX + 2350, CY + 3550]],
      };
      if (l.reg === 'noihai') {
        const k = ['thiennhan', 'cuuuyen', 'loithanh', 'phongthan'].indexOf(l.id);
        const sx = k % 2 ? 1 : -1, sy = k < 2 ? -1 : 1;
        l.x = CX + sx * 2280; l.y = CY + sy * 1820;
      } else {
        const cs = CLUSTERS[l.reg] || CLUSTERS[({ dong: 'donghai', tay: 'tayhai', bac: 'bachai', nam: 'namhai', trung: 'namhai' } as Record<Vuc, string>)[vucOf(l)]];
        const [cx0, cy0] = cs[Math.floor(hrand(l.id, 1) * cs.length)];
        const ang = hrand(l.id, 2) * Math.PI * 2, rad = 120 + hrand(l.id, 3) * 520;
        l.x = cx0 + Math.cos(ang) * rad;
        l.y = cy0 + Math.sin(ang) * rad * 0.75;
      }
      continue;
    }
    if (v === 'trung') {
      // góc cố định cho vài nơi có ý nghĩa địa lý: Diệp gia Tổ Địa ở rìa đông Trung Vực (vùng rừng xanh)
      const fixAng = TRUNG_ANG[l.id];
      const ang = (fixAng ? fixAng[0] + hrand(l.id, 3) * (fixAng[1] - fixAng[0]) : l.reg === 'tienchau' ? 300 + hrand(l.id, 3) * 80 : hrand(l.id, 3) * 360) * DEG;
      const f = fixAng && fixAng.length === 4 ? fixAng[2] + hrand(l.id, 7) * (fixAng[3] - fixAng[2]) : placeF(l);
      l.x = CX + Math.cos(ang) * TRUNG_R.rx * f;
      l.y = CY + Math.sin(ang) * TRUNG_R.ry * f;
    } else {
      const [l0, l1] = SUB_LAT[l.reg] || [-1, 1];
      [l.x, l.y] = inLand(v, placeT(l), l0 + (l1 - l0) * hrand(l.id, 5));
    }
  }
  // giãn các điểm quá gần nhau
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j];
      if (a.formationTo || b.formationTo) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = a.island && b.island ? 330 : vucOf(a) === 'trung' && vucOf(b) === 'trung' ? 260 : 250;
      if (d < min) {
        const push = (min - d) / 2;
        a.x -= (dx / d) * push; a.y -= (dy / d) * push;
        b.x += (dx / d) * push; b.y += (dy / d) * push;
      }
    }
  }
  // Tử Tiêu Tiên Cung — mạnh nhất — ngự ở chính tâm Trung Vực, giữa quần sơn Hư Linh
  const tt = L.find((l) => l.id === 'tutieu');
  if (tt) {
    tt.x = CX; tt.y = CY;
    for (const l of L) {
      if (l === tt) continue;
      const dx = l.x - CX, dy = l.y - CY, d = Math.hypot(dx, dy) || 1;
      if (d < 300) { l.x = CX + (dx / d) * 300; l.y = CY + (dy / d) * 300; }
    }
  }
  // kéo điểm bị đẩy ra biển về lại trong lục địa của nó
  for (const l of L) {
    if (l.island || l.formationTo) continue;
    const m = LANDMASS[vucOf(l)];
    const nx = (l.x - m.x) / m.rx, ny = (l.y - m.y) / m.ry;
    const d = Math.hypot(nx, ny);
    if (d > 0.9) { l.x = m.x + (nx / d) * 0.9 * m.rx; l.y = m.y + (ny / d) * 0.9 * m.ry; }
  }
  // đảo: đẩy ra khơi cho tới khi cách hẳn bờ mọi lục địa (tính cả bán kính đảo và bờ lồi lõm)
  const ISL_R = 180;
  const isl = L.filter((l) => l.island);
  for (let round = 0; round < 60; round++) {
    let moved = false;
    // giãn các đảo
    for (let i = 0; i < isl.length; i++) for (let j = i + 1; j < isl.length; j++) {
      const a = isl[i], b = isl[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d < 330) { const p = (330 - d) / 2; a.x -= (dx / d) * p; a.y -= (dy / d) * p; b.x += (dx / d) * p; b.y += (dy / d) * p; moved = true; }
    }
    // đẩy khỏi bờ
    for (const l of isl) for (const m of Object.values(LANDMASS)) {
      const nx = (l.x - m.x) / (m.rx * 1.2 + ISL_R), ny = (l.y - m.y) / (m.ry * 1.2 + ISL_R);
      if (nx * nx + ny * ny < 1) {
        const d = Math.hypot(l.x - m.x, l.y - m.y) || 1;
        l.x += ((l.x - m.x) / d) * 40; l.y += ((l.y - m.y) / d) * 40; moved = true;
      }
    }
    for (const l of isl) { l.x = Math.max(200, Math.min(MAP_W - 200, l.x)); l.y = Math.max(200, Math.min(MAP_H - 200, l.y)); }
    if (!moved) break;
  }
  for (const l of L) { l.x = Math.round(Math.max(80, Math.min(MAP_W - 80, l.x))); l.y = Math.round(Math.max(80, Math.min(MAP_H - 80, l.y))); }
}
// Trung Vực: nơi linh khí dày nhất — thành lớn, phường thị lớn, hiểm địa và bí cảnh cấp cao
L.push(
  { id: 'thienkhuyet', n: 'Thiên Khuyết Thành', type: 'town', reg: 'trungtho', x: 0, y: 0, qi: 1.2, auction: true, d: 'Thành trì do ba thánh địa cùng dựng, nơi đại năng các vực tụ về giao dịch. Tường thành khắc trận pháp, phàm nhân đứng gần cũng thấy khỏe ra.' },
  { id: 'cuuchau', n: 'Cửu Châu Thành', type: 'town', reg: 'trungtho', x: 0, y: 0, qi: 1.15, d: 'Thành cổ chín cửa, mỗi cửa thông một con đường lớn ra bốn vực.' },
  { id: 'vantien', n: 'Vạn Tiên phường thị', type: 'market', reg: 'trungtho', x: 0, y: 0, qi: 1.3, d: 'Phường thị lớn nhất thiên hạ. Có tiền là mua được — kể cả thứ không nên mua.' },
  { id: 'linhtuyenthon', n: 'Thôn Linh Tuyền', type: 'village', reg: 'trungtho', x: 0, y: 0, qi: 1.1, d: 'Thôn có giếng linh tuyền, dân thường cũng sống tới trăm tuổi.' },
  { id: 'vanphong', n: 'Thôn Vân Phong', type: 'village', reg: 'trungtho', x: 0, y: 0, qi: 1.05, d: 'Thôn trên lưng chừng núi, mây trôi qua sân nhà như khói bếp.' },
  { id: 'linhmach', n: 'Tổ Linh Mạch', type: 'wild', reg: 'trungtho', x: 0, y: 0, qi: 2, lv: 6, d: 'Nơi khởi nguồn linh mạch của cả Thương Lan. Linh khí đặc thành sương, yêu thú canh giữ đã sống vạn năm.' },
  { id: 'diepgia', n: 'Diệp gia Tổ Địa', type: 'village', reg: 'trungtho', x: 0, y: 0, qi: 1.5, d: 'Tổ trạch của Diệp thị Hoang Cổ. Tường thành trăm dặm giờ chỉ còn một góc có người ở; chín cổ đỉnh trước từ đường đã nguội lạnh từ lâu.' },
  { id: 'thienhac', n: 'Thiên Hạc Hồ', type: 'wild', reg: 'trungtho', x: 0, y: 0, qi: 1.6, lv: 4, d: 'Hồ lớn có đàn hạc tiên, nước hồ ngọt như mật.' },
  { id: 'thanhchien', n: 'Cổ Thánh Chiến Trường', type: 'realm', reg: 'trungtho', x: 0, y: 0, qi: 2.6, lv: 7, minRealm: 5, open: [120, 6], d: 'Chiến trường nơi các thánh nhân thượng cổ ngã xuống. Trăm hai mươi năm mới mở một lần.' },
);
// Bốn vực ngoài: thêm tông môn, thành, trấn, thôn, phường thị, bí cảnh, hiểm địa; Trung Vực thêm thành lớn
L.push(
  { id: 'lamgiang', n: 'Lâm Giang Thành', type: 'town', reg: 'vanmong', x: 0, y: 0, qi: 0.95, auction: true, d: 'Thành bên ngã ba sông, thuyền buôn neo kín bến.' },
  { id: 'phuongchau', n: 'Phượng Châu Thành', type: 'town', reg: 'donghai', x: 0, y: 0, qi: 0.95, d: 'Thành cảng xây trên bãi đá hình chim phượng.' },
  { id: 'bachdo', n: 'Bạch Độ Trấn', type: 'town', reg: 'vanmong', x: 0, y: 0, qi: 0.95, d: 'Trấn bến đò, ngày nào cũng có người qua sông tìm tiên duyên.' },
  { id: 'tieuhoa', n: 'Tiêu Hòa Trấn', type: 'town', reg: 'vanmong', x: 0, y: 0, qi: 0.95, d: 'Trấn nhỏ trồng sen, mùa hạ thơm cả một vùng.' },
  { id: 'laudo', n: 'Thôn Lau Đỏ', type: 'village', reg: 'vanmong', x: 0, y: 0, qi: 0.85, d: 'Thôn giữa bãi lau đỏ, chiều xuống như cháy.' },
  { id: 'haiau', n: 'Thôn Hải Âu', type: 'village', reg: 'donghai', x: 0, y: 0, qi: 0.85, d: 'Thôn chài trên mỏm đá, hải âu đậu kín mái nhà.' },
  { id: 'thanhlang', n: 'Thôn Thanh Lãng', type: 'village', reg: 'vanmong', x: 0, y: 0, qi: 0.85, d: 'Thôn nhỏ bên suối trong, trẻ con tắm suối cả ngày.' },
  { id: 'bichthuythi', n: 'Bích Thủy phường thị', type: 'market', reg: 'vanmong', x: 0, y: 0, qi: 1.05, d: 'Phường thị trên mặt hồ, các sạp nối nhau bằng cầu ván.' },
  { id: 'longkhe', n: 'Long Khê phường thị', type: 'market', reg: 'donghai', x: 0, y: 0, qi: 1.05, d: 'Phường thị bên khe suối nghe đồn có rồng ngủ.' },
  { id: 'thuyliem', n: 'Thủy Liêm Động Thiên', type: 'realm', reg: 'vanmong', x: 0, y: 0, qi: 2.1, lv: 2, minRealm: 1, open: [15, 1], d: 'Động sau thác nước, mười lăm năm nước rút một lần.' },
  { id: 'lovi', n: 'Lô Vĩ Đãng', type: 'wild', reg: 'vanmong', x: 0, y: 0, qi: 1.35, lv: 1, d: 'Đầm lau sậy mênh mông, thủy quái ẩn dưới bùn.' },
  { id: 'loihong', n: 'Lôi Hống Nhai', type: 'wild', reg: 'donghai', x: 0, y: 0, qi: 1.35, lv: 3, d: 'Vách đá ven biển, sấm rền suốt đêm.' },
  { id: 'tamhoa', n: 'Tam Hỏa Thành', type: 'town', reg: 'tayluong', x: 0, y: 0, qi: 0.95, auction: true, d: 'Thành có ba ngọn lửa trời không bao giờ tắt trên tháp canh.' },
  { id: 'ngocmon', n: 'Ngọc Môn Thành', type: 'town', reg: 'tayluong', x: 0, y: 0, qi: 0.95, d: 'Cửa ải ngọc của Tây Vực, thương đội nào cũng phải qua.' },
  { id: 'hoangtuyen', n: 'Hoàng Tuyền Trấn', type: 'town', reg: 'vanmong', x: 0, y: 0, qi: 0.95, near: 'gate_diaphu', d: 'Trấn nhỏ dưới chân Hoàng Tuyền Quỷ Môn, quán trọ đông hơn nhà dân. Ai sắp xuống âm ty đều nghỉ lại một đêm ở đây, uống một bát nước giếng vàng — người ta bảo uống vào sống thêm ba năm, đủ để quay về.' },
  { id: 'phongsa', n: 'Phong Sa Trấn', type: 'town', reg: 'tayluong', x: 0, y: 0, qi: 0.95, d: 'Trấn mái thấp, tường dày, gió cát quanh năm.' },
  { id: 'matuyen', n: 'Thôn Mã Tuyền', type: 'village', reg: 'tayluong', x: 0, y: 0, qi: 0.85, d: 'Thôn nuôi ngựa bên suối ngầm.' },
  { id: 'hoangduong', n: 'Thôn Hoàng Dương', type: 'village', reg: 'tayluong', x: 0, y: 0, qi: 0.85, d: 'Thôn trồng dương liễu chắn cát.' },
  { id: 'hongsa', n: 'Thôn Hồng Sa', type: 'village', reg: 'tayluong', x: 0, y: 0, qi: 0.85, d: 'Thôn trên đồi cát đỏ, đêm nghe cát hát.' },
  { id: 'kimlau', n: 'Kim Lâu phường thị', type: 'market', reg: 'tayluong', x: 0, y: 0, qi: 1.05, d: 'Phường thị trong lầu vàng của một phú thương đã chết.' },
  { id: 'saminh', n: 'Sa Minh phường thị', type: 'market', reg: 'tayluong', x: 0, y: 0, qi: 1.05, d: 'Phường thị họp dưới chân cồn cát biết kêu.' },
  { id: 'kimquat', n: 'Kim Quật Di Tích', type: 'realm', reg: 'tayluong', x: 0, y: 0, qi: 2.1, lv: 3, minRealm: 2, open: [25, 2], d: 'Hầm vàng của một vương triều đã mất, cấm chế hai mươi lăm năm lỏng một lần.' },
  { id: 'cotnguyen', n: 'Cốt Nguyên', type: 'wild', reg: 'tayluong', x: 0, y: 0, qi: 1.35, lv: 2, d: 'Đồng xương trắng, nơi yêu thú sa mạc chết dồn về.' },
  { id: 'viemcoc', n: 'Viêm Cốc', type: 'wild', reg: 'tayluong', x: 0, y: 0, qi: 1.35, lv: 4, d: 'Thung lũng nóng chảy chì, hỏa yêu làm tổ.' },
  { id: 'tuongthanh', n: 'Tượng Thành', type: 'town', reg: 'namman', x: 0, y: 0, qi: 0.95, auction: true, d: 'Thành của người cưỡi voi, tường thành khắc hình tượng thần.' },
  { id: 'phidien', n: 'Phỉ Điền Thành', type: 'town', reg: 'namman', x: 0, y: 0, qi: 0.95, d: 'Thành giữa ruộng bậc thang xanh như phỉ thúy.' },
  { id: 'badao', n: 'Ba Đạo Trấn', type: 'town', reg: 'namman', x: 0, y: 0, qi: 0.95, d: 'Trấn ở ngã ba đường mòn xuyên rừng.' },
  { id: 'tieuson', n: 'Tiểu Sơn Trấn', type: 'town', reg: 'vanyeu', x: 0, y: 0, qi: 0.95, d: 'Trấn biên giới giữa người và yêu, chợ bán cả hai loại hàng.' },
  { id: 'trucdai', n: 'Thôn Trúc Đài', type: 'village', reg: 'namman', x: 0, y: 0, qi: 0.85, d: 'Thôn nhà sàn bằng trúc, chân cột ngâm trong suối.' },
  { id: 'homuc', n: 'Thôn Hồ Mục', type: 'village', reg: 'namman', x: 0, y: 0, qi: 0.85, d: 'Thôn bên hồ, dân chăn trâu nước.' },
  { id: 'maison', n: 'Thôn Mai Sơn', type: 'village', reg: 'vanyeu', x: 0, y: 0, qi: 0.85, d: 'Thôn trồng mai trên sườn núi, yêu hồ hay xuống xin quả.' },
  { id: 'cotrungthi', n: 'Cổ Trùng phường thị', type: 'market', reg: 'namman', x: 0, y: 0, qi: 1.05, d: 'Phường thị bán cổ trùng, đi đâu cũng phải nhìn dưới chân.' },
  { id: 'thanhchieu', n: 'Thanh Chiểu phường thị', type: 'market', reg: 'namman', x: 0, y: 0, qi: 1.05, d: 'Phường thị trên đầm xanh, thuyền độc mộc chở hàng.' },
  { id: 'daixa', n: 'Đại Xà Cổ Mộ', type: 'realm', reg: 'namman', x: 0, y: 0, qi: 2.1, lv: 3, minRealm: 2, open: [30, 2], d: 'Mộ của một con mãng xà hóa giao, ba mươi năm mở một lần.' },
  { id: 'manglam', n: 'Mãng Lâm', type: 'wild', reg: 'namman', x: 0, y: 0, qi: 1.35, lv: 2, d: 'Rừng trăn khổng lồ, cây cổ thụ nào cũng có vảy rắn lột.' },
  { id: 'hoangchieu', n: 'Hoang Chiểu', type: 'wild', reg: 'vanyeu', x: 0, y: 0, qi: 1.35, lv: 4, d: 'Đầm hoang nơi yêu tộc vứt xác kẻ thù.' },
  { id: 'hantinh', n: 'Hàn Tinh Thành', type: 'town', reg: 'bacminh', x: 0, y: 0, qi: 0.95, auction: true, d: 'Thành đá xanh, đêm nhìn rõ cả dải ngân hà.' },
  { id: 'bacquan', n: 'Bắc Quan Thành', type: 'town', reg: 'bacminh', x: 0, y: 0, qi: 0.95, d: 'Quan ải trấn giữ thảo nguyên, binh sĩ đều tu luyện thể.' },
  { id: 'lanhtuyet', n: 'Lãnh Tuyết Trấn', type: 'town', reg: 'bacminh', x: 0, y: 0, qi: 0.95, d: 'Trấn tuyết trắng, nhà nào cũng có lò sưởi đá.' },
  { id: 'bachthaotran', n: 'Bạch Thảo Trấn', type: 'town', reg: 'bacminh', x: 0, y: 0, qi: 0.95, d: 'Trấn chợ cỏ trắng, mùa thu thảo nguyên bạc như tóc người già.' },
  { id: 'tuanloc', n: 'Thôn Tuần Lộc', type: 'village', reg: 'cucbac', x: 0, y: 0, qi: 0.85, d: 'Thôn nuôi tuần lộc ở rìa băng nguyên.' },
  { id: 'bangkhe', n: 'Thôn Băng Khê', type: 'village', reg: 'bacminh', x: 0, y: 0, qi: 0.85, d: 'Thôn bên khe nước đóng băng nửa năm.' },
  { id: 'bachdien', n: 'Thôn Bạch Điền', type: 'village', reg: 'bacminh', x: 0, y: 0, qi: 0.85, d: 'Thôn trồng lúa mạch trắng trên thảo nguyên.' },
  { id: 'tuyetvanthi', n: 'Tuyết Vân phường thị', type: 'market', reg: 'bacminh', x: 0, y: 0, qi: 1.05, d: 'Phường thị trong hang tuyết lớn, đèn lồng treo kín vòm.' },
  { id: 'hanhuong', n: 'Hàn Hương phường thị', type: 'market', reg: 'cucbac', x: 0, y: 0, qi: 1.05, d: 'Phường thị bán hàn hương thảo, ngửi một lần tỉnh cả tuần.' },
  { id: 'huyenbangcung', n: 'Huyền Băng Cổ Cung', type: 'realm', reg: 'bacminh', x: 0, y: 0, qi: 2.1, lv: 4, minRealm: 3, open: [40, 3], d: 'Cung điện băng của một tiên tử thượng cổ, bốn mươi năm hiện một lần.' },
  { id: 'suonglang', n: 'Sương Lang Cốc', type: 'wild', reg: 'bacminh', x: 0, y: 0, qi: 1.35, lv: 2, d: 'Thung lũng sương, sói trắng săn theo bầy.' },
  { id: 'lanhphong', n: 'Lãnh Phong Nhai', type: 'wild', reg: 'cucbac', x: 0, y: 0, qi: 1.35, lv: 4, d: 'Vách băng gió lạnh xé da, băng yêu ẩn trong khe.' },
  { id: 'thienvan', n: 'Thiên Vân Thành', type: 'town', reg: 'trungtho', x: 0, y: 0, qi: 1.25, auction: true, d: 'Thành trên mây, cổng thành chỉ mở cho người có tu vi.' },
  { id: 'thanhdo', n: 'Thánh Đô', type: 'town', reg: 'trungtho', x: 0, y: 0, qi: 1.3, d: 'Kinh đô của các thánh địa, nơi họp đại hội luận đạo mười năm một lần.' },
  { id: 'thuongthuy', n: 'Thương Lan Thủy Phủ', type: 'sect', reg: 'donghai', x: 0, y: 0, qi: 1.75, sect: 'thuongthuy', island: true, sea: true, d: 'Thủy phủ cổ xưa nhất Đông Vực, cửa phủ chìm dưới nước.' },
  { id: 'bichdao', n: 'Bích Đào Cốc', type: 'sect', reg: 'vanmong', x: 0, y: 0, qi: 1.5, sect: 'bichdao', d: 'Thung lũng đào biếc, đệ tử giỏi y thuật.' },
  { id: 'ngutieu', n: 'Ngư Tiều Môn', type: 'sect', reg: 'vanmong', x: 0, y: 0, qi: 1.3, sect: 'ngutieu', d: 'Môn phái của ngư phủ và tiều phu, đệ tử phần nhiều là con nhà nghèo.' },
  { id: 'kimdinh', n: 'Kim Đỉnh Kiếm Tông', type: 'sect', reg: 'tayluong', x: 0, y: 0, qi: 1.75, sect: 'kimdinh', d: 'Kiếm tông trên đỉnh núi vàng, kiếm khí chiếu sáng sa mạc.' },
  { id: 'luusamon', n: 'Lưu Sa Môn', type: 'sect', reg: 'tayluong', x: 0, y: 0, qi: 1.5, sect: 'luusamon', d: 'Môn phái giữa biển cát chảy, giỏi trận pháp cát.' },
  { id: 'hoaluyen', n: 'Hỏa Luyện Đường', type: 'sect', reg: 'tayluong', x: 0, y: 0, qi: 1.3, sect: 'hoaluyen', d: 'Đường luyện khí nhỏ bên núi lửa, đệ tử ai cũng biết rèn.' },
  { id: 'vanlam', n: 'Vạn Lâm Kiếm Các', type: 'sect', reg: 'namman', x: 0, y: 0, qi: 1.75, sect: 'vanlam', d: 'Kiếm các giữa vạn cây, kiếm khí như lá rơi.' },
  { id: 'hacthiem', n: 'Hắc Thiềm Môn', type: 'sect', reg: 'namman', x: 0, y: 0, qi: 1.5, sect: 'hacthiem', d: 'Tà môn nuôi cóc độc, luyện độc thành đan.' },
  { id: 'thaoduong', n: 'Thảo Đường Phái', type: 'sect', reg: 'namman', x: 0, y: 0, qi: 1.3, sect: 'thaoduong', d: 'Phái nhỏ trong thảo đường, chữa bệnh cho dân bản.' },
  { id: 'thiensuong', n: 'Thiên Sương Các', type: 'sect', reg: 'bacminh', x: 0, y: 0, qi: 1.75, sect: 'thiensuong', d: 'Các phái trên đỉnh tuyết, sương sớm kết thành phù văn.' },
  { id: 'phongkhieu', n: 'Phong Khiếu Môn', type: 'sect', reg: 'bacminh', x: 0, y: 0, qi: 1.5, sect: 'phongkhieu', d: 'Môn phái tu gió, đệ tử huýt sáo gọi bão.' },
  { id: 'tuyetnguyen', n: 'Tuyết Nguyên Phái', type: 'sect', reg: 'cucbac', x: 0, y: 0, qi: 1.3, sect: 'tuyetnguyen', d: 'Phái nhỏ trên băng nguyên, sống bằng nghề săn và rèn.' },
);
// Đảo các hải vực
L.push(
  { id: 'hailoan', n: 'Hải Loan Thôn', type: 'village', reg: 'tayhai', x: 0, y: 0, qi: 0.9, island: true, port: true, d: 'Thôn chài trong vịnh lặng, có thuyền về đất liền.' },
  { id: 'tayhaithanh', n: 'Tây Hải Thành', type: 'town', reg: 'tayhai', x: 0, y: 0, qi: 1, island: true, auction: true, d: 'Thành đảo lớn nhất Tây Hải, nơi thương thuyền đổi ngọc trai lấy linh thạch.' },
  { id: 'sangu', n: 'Sa Ngư phường thị', type: 'market', reg: 'tayhai', x: 0, y: 0, qi: 1.1, island: true, d: 'Phường thị trên bãi cát, bán xương cá voi và ngọc biển.' },
  { id: 'cuongsa', n: 'Cuồng Sa Đảo', type: 'wild', reg: 'tayhai', x: 0, y: 0, qi: 1.6, island: true, lv: 3, d: 'Đảo cát bị bão quét quanh năm, hải yêu lên bờ kiếm mồi.' },
  { id: 'kinhngu', n: 'Kình Ngư Môn', type: 'sect', reg: 'tayhai', x: 0, y: 0, qi: 1.3, island: true, sect: 'kinhngu', d: 'Môn phái cưỡi cá voi, đệ tử bơi giỏi hơn đi.' },
  { id: 'tichduong', n: 'Tịch Dương Hải Quật', type: 'realm', reg: 'tayhai', x: 0, y: 0, qi: 2.3, island: true, lv: 4, minRealm: 3, open: [45, 3], d: 'Hang biển chỉ lộ ra khi hoàng hôn trùng triều cạn, bốn mươi lăm năm một lần.' },
  { id: 'bangdaothon', n: 'Băng Đảo Thôn', type: 'village', reg: 'bachai', x: 0, y: 0, qi: 0.9, island: true, port: true, d: 'Thôn dựng trên đảo băng, nhà làm bằng xương kình.' },
  { id: 'bachaithanh', n: 'Bắc Hải Thành', type: 'town', reg: 'bachai', x: 0, y: 0, qi: 1, island: true, auction: true, d: 'Thành cảng giữa biển băng, đèn hải đăng thắp bằng băng tinh.' },
  { id: 'tuyetngu', n: 'Tuyết Ngư phường thị', type: 'market', reg: 'bachai', x: 0, y: 0, qi: 1.1, island: true, d: 'Phường thị họp trên mặt băng, bán cá tuyết và hàn ngọc.' },
  { id: 'hanchau', n: 'Hàn Châu Đảo', type: 'wild', reg: 'bachai', x: 0, y: 0, qi: 1.6, island: true, lv: 4, d: 'Đảo băng có ngọc trai lạnh, băng giao canh giữ.' },
  { id: 'luubang', n: 'Lưu Băng Các', type: 'sect', reg: 'bachai', x: 0, y: 0, qi: 1.5, island: true, sect: 'luubang', d: 'Lầu các trên núi băng trôi, mỗi năm dạt một nơi.' },
  { id: 'bachaimo', n: 'Bắc Hải Long Mộ', type: 'realm', reg: 'bachai', x: 0, y: 0, qi: 2.3, island: true, sea: true, lv: 5, minRealm: 4, open: [70, 3], d: 'Mộ của rồng băng dưới đáy biển bắc, bảy mươi năm băng tan một lần.' },
  { id: 'thiennhan', n: 'Thiên Nhãn Đảo', type: 'wild', reg: 'noihai', x: 0, y: 0, qi: 2.2, island: true, lv: 6, d: 'Đảo hình con mắt giữa eo biển, ai tới gần đều thấy mình bị nhìn.' },
  { id: 'cuuuyen', n: 'Cửu Uyên Hải Nhãn', type: 'realm', reg: 'noihai', x: 0, y: 0, qi: 2.6, island: true, lv: 7, minRealm: 5, open: [90, 4], d: 'Xoáy nước chín tầng, đáy là di tích thời khai thiên. Chín mươi năm mở một lần.' },
  { id: 'loithanh', n: 'Lôi Thánh Đảo', type: 'wild', reg: 'noihai', x: 0, y: 0, qi: 2.2, island: true, lv: 7, d: 'Đảo sét đánh không ngừng, nơi lôi tu tới tôi luyện thân thể.' },
  { id: 'phongthan', n: 'Phong Thần Đảo', type: 'wild', reg: 'noihai', x: 0, y: 0, qi: 2.2, island: true, lv: 6, d: 'Đảo có cơn lốc không bao giờ tan, giữa tâm lốc là một ngôi miếu cổ.' },
);

// ================= Sơn Hải Kinh =================
// Năm thiên Sơn Kinh ứng với năm vực (Nam/Tây/Bắc/Đông/Trung Sơn Kinh); mỗi thiên là một dãy núi xếp theo thứ tự trong sách.
// Hải Kinh và Đại Hoang Kinh nằm ngoài biển. Tổ thú từ Nguyên Anh trở lên; hậu duệ yếu dần theo độ đậm của huyết mạch.
const SHJ_LOC: [string, string, ShjK, string, string][] = [
  // Nam Sơn Kinh — từ bờ Tây Hải chạy sang đông
  ['shj_chieudieu', 'Chiêu Diêu Sơn', 'nam', 'namman', 'Núi đầu tiên của Nam Sơn Kinh, sát bờ Tây Hải. Nhiều quế, nhiều vàng ngọc; có cỏ chúc dư ăn vào không đói.'],
  ['shj_coson', 'Cơ Sơn', 'nam', 'namman', 'Phía dương nhiều ngọc, phía âm nhiều cây lạ.'],
  ['shj_thanhkhau', 'Thanh Khâu Sơn', 'nam', 'vanyeu', 'Phía dương nhiều ngọc, phía âm nhiều thanh hộ. Nơi Cửu Vĩ Hồ làm tổ.'],
  ['shj_phungoc', 'Phù Ngọc Sơn', 'nam', 'namman', 'Phía bắc nhìn ra hồ Cụ Khu, phía đông nhìn ra Chư Bì.'],
  ['shj_locngo', 'Lộc Ngô Sơn', 'nam', 'namman', 'Trên núi không cây cỏ, nhiều vàng đá. Sông Trạch Canh chảy ra từ đây.'],
  ['shj_danhuyet', 'Đan Huyệt Sơn', 'nam', 'namman', 'Trên núi nhiều vàng ngọc, sông Đan chảy về nam đổ ra Bột Hải. Phượng Hoàng ở đây.'],
  // Tây Sơn Kinh — từ bờ gần Trung Vực đi dần về tây
  ['shj_thaihoa', 'Thái Hoa Sơn', 'tay', 'tayluong', 'Bốn mặt vách dựng như gọt, cao năm nghìn nhận, chim muông không lên được.'],
  ['shj_tieuthu', 'Tiểu Thứ Sơn', 'tay', 'tayluong', 'Trên núi nhiều ngọc trắng, dưới núi nhiều đồng đỏ.'],
  ['shj_conlon', 'Côn Lôn Khâu', 'tay', 'tayluong', 'Đế đô dưới trần. Lục Ngô cai quản, giữ chín bộ của trời và vườn thú của Đế.'],
  ['shj_chuongnga', 'Chương Nga Sơn', 'tay', 'tayluong', 'Không cây cỏ, nhiều dao ngọc bích. Lửa lạ thường cháy lên không rõ từ đâu.'],
  ['shj_amson', 'Âm Sơn', 'tay', 'tayluong', 'Sông Âm chảy về tây. Thiên Cẩu sống ở đây, nuôi được thì trừ được hung.'],
  ['shj_tamnguy', 'Tam Nguy Sơn', 'tay', 'tayluong', 'Ba con Thanh Điểu ở đây. Núi vuông trăm dặm.'],
  ['shj_thienson', 'Thiên Sơn', 'tay', 'tayluong', 'Nhiều vàng ngọc, có thanh hùng hoàng. Đế Giang ở đây — không mặt không mắt, biết ca múa.'],
  ['shj_trungkhuc', 'Trung Khúc Sơn', 'tay', 'tayluong', 'Phía dương nhiều ngọc, phía âm nhiều hùng hoàng.'],
  ['shj_khueson', 'Khuê Sơn', 'tay', 'tayluong', 'Trên núi có thú tên Cùng Kỳ, tiếng như chó tru, ăn thịt người.'],
  // Bắc Sơn Kinh — từ nam đi lên bắc
  ['shj_daison', 'Đái Sơn', 'bac', 'bacminh', 'Trên núi nhiều ngọc, dưới nhiều thanh bích.'],
  ['shj_daiham', 'Đại Hàm Sơn', 'bac', 'bacminh', 'Không cây cỏ, núi vuông bốn bề, không leo được. Trường Xà ở đây.'],
  ['shj_thieuham', 'Thiếu Hàm Sơn', 'bac', 'bacminh', 'Không cây cỏ, nhiều ngọc xanh. Á Dủ sống ở đây.'],
  ['shj_bacnhac', 'Bắc Nhạc Sơn', 'bac', 'bacminh', 'Nhiều chỉ, kỷ và gỗ cứng.'],
  ['shj_caungo', 'Câu Ngô Sơn', 'bac', 'bacminh', 'Trên núi nhiều ngọc, dưới nhiều đồng. Bào Hào — tức Thao Thiết — làm tổ ở đây.'],
  ['shj_mathanh', 'Mã Thành Sơn', 'bac', 'bacminh', 'Trên núi nhiều đá văn, phía âm nhiều vàng ngọc.'],
  ['shj_canhson', 'Cảnh Sơn', 'bac', 'cucbac', 'Phía nam nhìn ra Diêm Phiến Trạch, phía bắc nhìn ra Thiếu Trạch.'],
  ['shj_phatcuu', 'Phát Cưu Sơn', 'bac', 'cucbac', 'Nhiều cây chá. Con gái Viêm Đế chết đuối ở Đông Hải, hóa thành chim Tinh Vệ, ngày ngày ngậm đá cây núi Tây lấp biển Đông.'],
  // Đông Sơn Kinh — từ bắc xuống nam
  ['shj_khongtang', 'Không Tang Sơn', 'dong', 'vanmong', 'Phía bắc nhìn ra Thực Thủy, phía đông nhìn ra Tự Trạch.'],
  ['shj_phule', 'Phù Lệ Sơn', 'dong', 'vanmong', 'Trên núi nhiều vàng ngọc, cát đá.'],
  ['shj_thiemson', 'Thiệm Sơn', 'dong', 'vanmong', 'Nhiều vàng ngọc. Hợp Dũ hiện thì thiên hạ đại thủy.'],
  ['shj_thaison', 'Thái Sơn', 'dong', 'vanmong', 'Trên núi nhiều ngọc, dưới nhiều vàng. Phỉ đi qua nước thì nước cạn, đi qua cỏ thì cỏ chết, thấy nó thì thiên hạ đại dịch.'],
  // Trung Sơn Kinh — vòng quanh Trung Thổ
  ['shj_phongson', 'Phong Sơn', 'trung', 'trungtho', 'Có chín cái chuông, gặp sương xuống thì tự kêu. Canh Phụ thần ở đây.'],
  ['shj_lichthach', 'Lịch Thạch Sơn', 'trung', 'trungtho', 'Trên núi nhiều gỗ kinh kỷ, phía dương nhiều vàng.'],
  ['shj_conngo', 'Côn Ngô Sơn', 'trung', 'trungtho', 'Trên núi nhiều đồng đỏ, luyện ra như lửa đỏ.'],
  ['shj_thanhyeu', 'Thanh Yêu Sơn', 'trung', 'trungtho', 'Mật đô của Đế. Thần Vũ La cai quản — mặt người, vằn báo, eo nhỏ răng trắng, tai đeo vòng vàng.'],
  // Hải Kinh / Đại Hoang Kinh — ngoài biển
  ['shj_luuba', 'Lưu Ba Sơn', 'hai', 'donghai', 'Trong Đông Hải, vào biển bảy nghìn dặm. Quỳ ở đây — ra vào nước tất có mưa gió, ánh như nhật nguyệt, tiếng như sấm.'],
  ['shj_hungle', 'Hung Lê Thổ Khâu', 'hai', 'donghai', 'Góc đông bắc Đại Hoang. Ứng Long ở cực nam gò này; sau khi giết Xi Vưu và Khoa Phụ không lên trời được nữa.'],
  ['shj_chuongvi', 'Chương Vĩ Sơn', 'hai', 'bachai', 'Ngoài Tây Bắc Hải, phía bắc Xích Thủy. Chúc Long mở mắt là ngày, nhắm mắt là đêm, không ăn không ngủ không thở.'],
  ['shj_bachaichu', 'Bắc Hải Chi Chử', 'hai', 'bachai', 'Bãi giữa Bắc Hải. Ngung Cường — mặt người mình chim, tai đeo hai rắn xanh, chân đạp hai rắn đỏ.'],
  ['shj_bachdan', 'Bạch Dân Quốc', 'hai', 'tayhai', 'Nước của người tóc trắng ngoài Tây Hải. Có Thừa Hoàng — cưỡi được thì thọ hai nghìn năm.'],
];
const SHJ_XY: Record<string, [number, number]> = {
  shj_luuba: [MAP_W - 420, CY - 300], shj_hungle: [MAP_W - 600, 560], shj_chuongvi: [560, 520], shj_bachaichu: [CX + 300, 300], shj_bachdan: [380, CY + 900],
};
{
  const cnt: Record<string, number> = {}, idx: Record<string, number> = {};
  for (const [, , k] of SHJ_LOC) cnt[k] = (cnt[k] || 0) + 1;
  for (const [id, n, k, reg, d] of SHJ_LOC) {
    const i = (idx[k] = (idx[k] ?? -1) + 1);
    L.push({ id, n, type: 'wild', reg, x: 0, y: 0, qi: 1.6, lv: 3, d: `${d} (Sơn Hải Kinh)`, shj: [k, i, cnt[k]], ...(k === 'hai' ? { island: true, shjXY: SHJ_XY[id] } : {}) });
  }
}
// [tên, hệ, cảnh giới tổ thú, núi, lời chép]
const SHJ_BEASTS = [
  ['Tinh Tinh', 'moc', 4, 'shj_chieudieu', 'Giống khỉ tai trắng, khi bò khi đi thẳng. Biết tên người. Ăn thịt nó thì chạy nhanh.'],
  ['Bác Thi', 'tho', 4, 'shj_coson', 'Giống dê, chín đuôi bốn tai, mắt mọc trên lưng. Mặc da nó thì không biết sợ.'],
  ['Cửu Vĩ Hồ', 'hoa', 6, 'shj_thanhkhau', 'Giống cáo chín đuôi, tiếng như trẻ khóc, ăn thịt người. Ăn thịt nó thì không trúng tà độc.'],
  ['Trệ', 'tho', 4, 'shj_phungoc', 'Giống hổ mà đuôi trâu, tiếng như chó sủa, ăn thịt người.'],
  ['Cổ Điêu', 'phong', 5, 'shj_locngo', 'Giống điêu mà có sừng, tiếng như trẻ khóc, ăn thịt người.'],
  ['Phượng Hoàng', 'hoa', 7, 'shj_danhuyet', 'Giống gà, lông ngũ sắc có văn. Ăn uống tự nhiên, tự ca tự múa. Hiện thì thiên hạ thái bình.'],
  ['Phì Di', 'hoa', 6, 'shj_thaihoa', 'Rắn sáu chân bốn cánh. Hiện thì thiên hạ đại hạn.'],
  ['Chu Yếm', 'kim', 5, 'shj_tieuthu', 'Giống vượn, đầu trắng chân đỏ. Hiện thì thiên hạ có binh đao lớn.'],
  ['Lục Ngô', 'kim', 8, 'shj_conlon', 'Thần Côn Lôn: mình hổ, chín đuôi, mặt người, vuốt hổ. Coi chín bộ của trời và vườn của Đế.'],
  ['Thổ Lâu', 'tho', 5, 'shj_conlon', 'Giống dê bốn sừng, ăn thịt người.'],
  ['Khâm Nguyên', 'moc', 5, 'shj_conlon', 'Giống ong to bằng chim uyên. Chích chim chim chết, chích cây cây khô.'],
  ['Tất Phương', 'hoa', 6, 'shj_chuongnga', 'Giống hạc một chân, văn đỏ trên nền xanh, mỏ trắng. Hiện ở đâu thì nơi đó có lửa lạ.'],
  ['Tranh', 'kim', 5, 'shj_chuongnga', 'Giống báo đỏ, năm đuôi một sừng, tiếng như đập đá.'],
  ['Thiên Cẩu', 'kim', 4, 'shj_amson', 'Giống cáo đầu trắng, tiếng kêu "lưu lưu". Nuôi được thì trừ hung.'],
  ['Ngao Yết', 'tho', 5, 'shj_tamnguy', 'Giống trâu trắng bốn sừng, lông như áo tơi, ăn thịt người.'],
  ['Đế Giang', 'am', 8, 'shj_thienson', 'Hình như túi vàng, đỏ như lửa, sáu chân bốn cánh, hỗn độn không mặt mũi — tức Hỗn Độn.'],
  ['Bác', 'kim', 4, 'shj_trungkhuc', 'Giống ngựa trắng đuôi đen, một sừng, răng hổ vuốt hổ, ăn thịt hổ báo.'],
  ['Cùng Kỳ', 'phong', 7, 'shj_khueson', 'Giống trâu, lông như nhím, tiếng như chó tru, ăn thịt người.'],
  ['Hoan Sơ', 'bang', 4, 'shj_daison', 'Giống ngựa một sừng có vân. Nuôi nó thì tránh được lửa.'],
  ['Trường Xà', 'tho', 5, 'shj_daiham', 'Rắn dài trăm tầm, lông như lông lợn, tiếng như mõ canh đêm.'],
  ['Á Dủ', 'thuy', 6, 'shj_thieuham', 'Giống trâu, mình đỏ mặt người chân ngựa, tiếng như trẻ khóc, ăn thịt người.'],
  ['Chư Hoài', 'bang', 5, 'shj_bacnhac', 'Giống trâu bốn sừng, mắt người tai lợn, tiếng như nhạn kêu, ăn thịt người.'],
  ['Bào Hào', 'am', 7, 'shj_caungo', 'Mình dê mặt người, mắt mọc dưới nách, răng hổ móng người, tiếng như trẻ khóc, ăn thịt người — tức Thao Thiết.'],
  ['Thiên Mã', 'phong', 4, 'shj_mathanh', 'Giống chó trắng đầu đen, thấy người thì bay đi.'],
  ['Toan Dư', 'am', 4, 'shj_canhson', 'Giống rắn, bốn cánh sáu mắt ba chân. Hiện ở đâu thì nơi đó có điều kinh sợ.'],
  ['Tinh Vệ', 'thuy', 5, 'shj_phatcuu', 'Giống quạ, đầu hoa, mỏ trắng chân đỏ. Ngậm đá cây núi Tây lấp biển Đông, đời đời không thôi.'],
  ['Linh Linh', 'thuy', 4, 'shj_khongtang', 'Giống trâu vằn hổ, tiếng như người rên. Hiện thì thiên hạ đại thủy.'],
  ['Lung Điệt', 'hoa', 6, 'shj_phule', 'Giống cáo chín đầu chín đuôi, vuốt hổ, tiếng như trẻ khóc, ăn thịt người.'],
  ['Hợp Dũ', 'thuy', 5, 'shj_thiemson', 'Giống lợn mặt người, mình vàng đuôi đỏ, ăn thịt người, cũng ăn sâu rắn.'],
  ['Phỉ', 'am', 6, 'shj_thaison', 'Giống trâu đầu trắng, một mắt đuôi rắn. Đi qua đâu nơi đó khô héo, thấy nó thì thiên hạ đại dịch.'],
  ['Ung Hòa', 'am', 5, 'shj_phongson', 'Giống vượn, mắt đỏ mỏ đỏ, mình vàng. Hiện thì nước có đại khủng.'],
  ['Lương Cừ', 'kim', 5, 'shj_lichthach', 'Giống mèo đầu trắng, vuốt hổ. Hiện thì nước có đại binh.'],
  ['Lung Chất', 'hoa', 5, 'shj_conngo', 'Giống lợn có sừng, tiếng như người khóc, ăn thịt người.'],
  ['Vũ La', 'quang', 6, 'shj_thanhyeu', 'Thần cai quản Thanh Yêu: mặt người vằn báo, eo nhỏ răng trắng, tai đeo vòng vàng, tiếng như ngọc va.'],
  ['Quỳ', 'loi', 7, 'shj_luuba', 'Giống trâu, mình xanh không sừng, một chân. Ra vào nước tất có mưa gió. Hoàng Đế lấy da nó làm trống, tiếng vang năm trăm dặm.'],
  ['Ứng Long', 'thuy', 8, 'shj_hungle', 'Rồng có cánh. Giết Xi Vưu và Khoa Phụ rồi không lên trời được nữa; mỗi lần hạn hán, người làm hình Ứng Long thì mưa xuống.'],
  ['Chúc Long', 'quang', 8, 'shj_chuongvi', 'Mặt người mình rắn, màu đỏ, dài nghìn dặm. Mắt dựng thẳng, mở mắt là ngày, nhắm mắt là đêm.'],
  ['Ngung Cường', 'thuy', 8, 'shj_bachaichu', 'Thần Bắc Hải: mặt người mình chim, tai đeo hai rắn xanh, chân đạp hai rắn đỏ.'],
  ['Thừa Hoàng', 'kim', 6, 'shj_bachdan', 'Giống cáo, trên lưng có sừng. Cưỡi được thì thọ hai nghìn năm.'],
  ['Thủy Kỳ Lân', 'thuy', 8, 'shj_conlon', 'Lân thú phủ vảy xanh sẫm, ngự tại Côn Lôn Khâu; nơi đặt chân cỏ cây hồi sinh, có thể điều khiển thủy mạch.'],
] as const satisfies readonly [string, El, number, string, string][];
type ShjBeastName = (typeof SHJ_BEASTS)[number][0];
const BLOOD_N = ['thuần huyết', 'huyết mạch đậm', 'huyết mạch loãng'];
const SHJ_DESCENDANTS: Record<ShjBeastName, readonly [{ n: string; el?: El }, { n: string; el?: El }]> = {
  'Tinh Tinh': [{ n: 'Bạch Nhĩ Hô Danh Viên' }, { n: 'Nhân Ngôn Sơn Viên' }],
  'Bác Thi': [{ n: 'Cửu Vĩ Tứ Nhãn Dương' }, { n: 'Bối Mục Sơn Dương' }],
  'Cửu Vĩ Hồ': [{ n: 'Cửu Vĩ Linh Hồ' }, { n: 'Xích Đồng Cửu Vĩ Hồ' }],
  'Trệ': [{ n: 'Ngưu Vĩ Khiếu Hổ' }, { n: 'Hổ Vĩ Thực Nhân Trệ' }],
  'Cổ Điêu': [{ n: 'Độc Giác Khốc Điêu' }, { n: 'Huyết Vũ Thực Nhân Điêu' }],
  'Phượng Hoàng': [{ n: 'Ngũ Sắc Linh Phượng' }, { n: 'Minh Ca Thải Vũ' }],
  'Phì Di': [{ n: 'Lục Túc Tứ Dực Xà' }, { n: 'Hạn Hỏa Phi Xà' }],
  'Chu Yếm': [{ n: 'Bạch Đầu Xích Túc Viên' }, { n: 'Chiến Hống Sơn Viên' }],
  'Lục Ngô': [{ n: 'Cửu Vĩ Nhân Diện Hổ' }, { n: 'Côn Lôn Thủ Viên' }],
  'Thổ Lâu': [{ n: 'Tứ Giác Thực Nhân Dương' }, { n: 'Xích Mục Thạch Dương' }],
  'Khâm Nguyên': [{ n: 'Tử Vũ Độc Phong' }, { n: 'Khô Mộc Chích Phong' }],
  'Tất Phương': [{ n: 'Độc Túc Thanh Vũ Hạc' }, { n: 'Xích Văn Tai Hỏa Điểu' }],
  'Tranh': [{ n: 'Ngũ Vĩ Độc Giác Báo' }, { n: 'Xích Văn Toái Thạch Báo' }],
  'Thiên Cẩu': [{ n: 'Ngân Nguyệt Lang' }, { n: 'Tật Phong Lang', el: 'phong' }],
  'Ngao Yết': [{ n: 'Tứ Giác Bạch Ngưu' }, { n: 'Tơi Mao Thực Nhân Ngưu' }],
  'Đế Giang': [{ n: 'Lục Túc Tứ Dực Đế Giang' }, { n: 'Hỗn Độn Nang Thú' }],
  'Bác': [{ n: 'Nhất Sừng Hắc Đuôi Bác Mã' }, { n: 'Hổ Nha Thực Báo Mã' }],
  'Cùng Kỳ': [{ n: 'Thiết Mao Khiếu Ngưu' }, { n: 'Hống Thiên Thực Nhân Thú' }],
  'Hoan Sơ': [{ n: 'Vân Văn Độc Giác Mã' }, { n: 'Tị Hỏa Linh Câu' }],
  'Trường Xà': [{ n: 'Bách Trượng Trư Mao Xà' }, { n: 'Canh Dạ Minh Xà' }],
  'Á Dủ': [{ n: 'Xích Diện Nhân Thân Ngưu' }, { n: 'Mã Đề Khốc Ngưu' }],
  'Chư Hoài': [{ n: 'Tứ Giác Nhân Mục Ngưu' }, { n: 'Trư Nhĩ Minh Hoài Thú' }],
  'Bào Hào': [{ n: 'Nách Mục Nhân Diện Thao Thú' }, { n: 'Hổ Nha Thực Nhân Dương' }],
  'Thiên Mã': [{ n: 'Bạch Đầu Phi Thiên Khuyển' }, { n: 'Hắc Thủng Vân Cẩu' }],
  'Toan Dư': [{ n: 'Tứ Dực Lục Mục Xà' }, { n: 'Tam Túc Kinh Dị Xà' }],
  'Tinh Vệ': [{ n: 'Hoa Đầu Bạch Chủy Điểu' }, { n: 'Tinh Vệ Điền Hải Điểu' }],
  'Linh Linh': [{ n: 'Hổ Văn Nhân Thanh Ngưu' }, { n: 'Đại Thủy Báo Linh Ngưu' }],
  'Lung Điệt': [{ n: 'Cửu Đầu Hổ Trảo Hồ' }, { n: 'Khốc Thanh Cửu Vĩ Hồ' }],
  'Hợp Dũ': [{ n: 'Nhân Diện Kim Vĩ Trư' }, { n: 'Thực Trùng Phệ Xà Trư' }],
  'Phỉ': [{ n: 'Bạch Đầu Độc Mục Xà Ngưu' }, { n: 'Khô Vinh Ôn Ngưu' }],
  'Ung Hòa': [{ n: 'Xích Mục Hồng Chủy Viên' }, { n: 'Kim Mao Kinh Hống Viên' }],
  'Lương Cừ': [{ n: 'Bạch Đầu Hổ Trảo Miêu' }, { n: 'Binh Tai Sơn Miêu' }],
  'Lung Chất': [{ n: 'Độc Giác Khiếu Trư' }, { n: 'Khốc Thanh Thực Nhân Trư' }],
  'Vũ La': [{ n: 'Báo Văn Ngọc Xỉ Thần' }, { n: 'Kim Hoàn Linh Quan' }],
  'Quỳ': [{ n: 'Thanh Thân Độc Túc Lôi Ngưu' }, { n: 'Phong Vũ Chấn Hải Quỳ' }],
  'Ứng Long': [{ n: 'Song Dực Thần Long' }, { n: 'Hạn Vũ Ứng Long' }],
  'Chúc Long': [{ n: 'Xích Thân Nhân Diện Xà' }, { n: 'Nhật Dạ Minh Long' }],
  'Ngung Cường': [{ n: 'Điểu Thân Chấp Xà Thần' }, { n: 'Bắc Hải Đạp Xà Thú' }],
  'Thừa Hoàng': [{ n: 'Bối Sinh Độc Giác Hồ' }, { n: 'Thiên Thọ Linh Hồ' }],
  'Thủy Kỳ Lân': [{ n: 'Kỳ Lân' }, { n: 'Thủy Lân Thú' }],
};
for (const [n, el, r, home, d] of SHJ_BEASTS) {
  const reg = L.find((l) => l.id === home)!.reg;
  BEASTS.push({ n, el, lv: [r, r], home, shj: d, mat: 'cotuhuyet' });
  if (n === 'Cửu Vĩ Hồ') {
    let parent: string = n;
    for (let tails = 8; tails >= 1; tails--) {
      const blood = (tails >= 6 ? 0 : tails >= 3 ? 1 : 2) as 0 | 1 | 2;
      const level = Math.max(1, r - Math.ceil((9 - tails) / 2));
      const name = `${['', 'Nhất', 'Nhị', 'Tam', 'Tứ', 'Ngũ', 'Lục', 'Thất', 'Bát'][tails]} Vĩ Hồ`;
      BEASTS.push({ n: name, el, lv: [level, level], reg: [reg], anc: parent, blood, mat: blood === 2 ? 'yeudan' : 'tuduehuyet' });
      parent = name;
    }
  } else {
    const [dense, dilute] = SHJ_DESCENDANTS[n];
    const denseLevel = Math.max(1, r - 2);
    const diluteLevel = Math.max(1, r - 4);
    BEASTS.push({ n: dense.n, el: dense.el || el, lv: [denseLevel, denseLevel], reg: [reg], anc: n, blood: 1, mat: 'tuduehuyet' });
    BEASTS.push({ n: dilute.n, el: dilute.el || el, lv: [diluteLevel, diluteLevel], reg: [reg], anc: dense.n, blood: 2, mat: 'yeudan' });
  }
  const loc = L.find((l) => l.id === home)!;
  loc.lv = Math.max(loc.lv ?? 0, Math.min(7, r - 1));
  loc.qi = Math.max(loc.qi, 1.4 + r * 0.12);
}
type BeastLineageNode = { n: string; parent?: string; el: El; order: number; shjLineage?: boolean };
const BEAST_LINEAGE: BeastLineageNode[] = [
  { n: 'Tổ Long', el: 'thuy', order: 0 },
  { n: 'Chân Long', parent: 'Tổ Long', el: 'thuy', order: 0 },
  ...(['Kim', 'Hỏa', 'Thủy', 'Thổ', 'Mộc', 'Lôi', 'Băng', 'Phong', 'Ám', 'Quang'] as const).map((n, i) => ({
    n: `${n} Long`, parent: 'Chân Long', el: ({ Kim: 'kim', Hỏa: 'hoa', Thủy: 'thuy', Thổ: 'tho', Mộc: 'moc', Lôi: 'loi', Băng: 'bang', Phong: 'phong', Ám: 'am', Quang: 'quang' } as const)[n], order: i,
  })),
  { n: 'Ứng Long', parent: 'Chân Long', el: 'thuy', order: 10 },
  { n: 'Chúc Long', parent: 'Ứng Long', el: 'hoa', order: 0 },
  { n: 'Thanh Long', parent: 'Chúc Long', el: 'moc', order: 0 },
  { n: 'Giao Long', parent: 'Thanh Long', el: 'thuy', order: 0 },
  { n: 'Hải Giao', parent: 'Giao Long', el: 'thuy', order: 0 },
  { n: 'Lôi Giao', parent: 'Giao Long', el: 'loi', order: 1 },
  { n: 'Giao Long Vương', parent: 'Giao Long', el: 'thuy', order: 2 },
  { n: 'Thần Giao', parent: 'Giao Long', el: 'loi', order: 3 },
  { n: 'Thanh Lân Mãng', parent: 'Giao Long', el: 'moc', order: 4 },
  ...(['Tù Ngưu', 'Nhai Tí', 'Trào Phong', 'Bồ Lao', 'Toan Nghê', 'Bá Hạ', 'Bệ Ngạn', 'Phụ Hí', 'Si Vẫn'] as const).map((n, i) => ({ n, parent: 'Chân Long', el: 'thuy' as El, order: 1 + i })),
  { n: 'Chân Phượng', el: 'hoa', order: 0, shjLineage: true },
  { n: 'Phượng Hoàng', parent: 'Chân Phượng', el: 'hoa', order: 0 },
  { n: 'Hỏa Vũ Điểu', parent: 'Phượng Hoàng', el: 'hoa', order: 1 },
  { n: 'Xích Hỏa Thanh Điểu', parent: 'Phượng Hoàng', el: 'hoa', order: 2 },
  { n: 'Hỏa Linh Tước', parent: 'Phượng Hoàng', el: 'hoa', order: 3 },
  { n: 'Tất Phương', parent: 'Phượng Hoàng', el: 'hoa', order: 4 },
  { n: 'Kim Ô Linh Điểu', parent: 'Phượng Hoàng', el: 'quang', order: 5 },
  { n: 'Ngũ Sắc Linh Phượng', parent: 'Phượng Hoàng', el: 'hoa', order: 6 },
  { n: 'Thanh Loan', parent: 'Phượng Hoàng', el: 'phong', order: 7 },
  { n: 'Chu Tước', parent: 'Phượng Hoàng', el: 'hoa', order: 8 },
  { n: 'Tử Điện Điêu', parent: 'Phượng Hoàng', el: 'loi', order: 9 },
  { n: 'Hỏa Phượng', parent: 'Chu Tước', el: 'hoa', order: 0 },
  { n: 'Băng Phượng', parent: 'Thanh Loan', el: 'bang', order: 0 },
  { n: 'Thủy Kỳ Lân', el: 'thuy', order: 0, shjLineage: true },
  { n: 'Kỳ Lân', parent: 'Thủy Kỳ Lân', el: 'thuy', order: 0 },
  { n: 'Hỏa Kỳ Lân', parent: 'Kỳ Lân', el: 'hoa', order: 0 },
  { n: 'Hỏa Kỳ Lân Thú', parent: 'Kỳ Lân', el: 'hoa', order: 1 },
  { n: 'Kim Lân Thú', parent: 'Kỳ Lân', el: 'kim', order: 2 },
  { n: 'Lân Mã', parent: 'Kỳ Lân', el: 'kim', order: 3 },
  { n: 'Tê Ngưu', el: 'tho', order: 0 },
  { n: 'Thủy Tê', parent: 'Tê Ngưu', el: 'thuy', order: 0 },
  { n: 'Bích Lân Tê', parent: 'Thủy Tê', el: 'thuy', order: 0 },
  { n: 'Độc Giác Thủy Tê', parent: 'Bích Lân Tê', el: 'thuy', order: 0 },
  { n: 'Nguyên Lang', el: 'phong', order: 0 },
  { n: 'Thanh Phong Lang', parent: 'Nguyên Lang', el: 'phong', order: 0 },
  { n: 'Tuyết Ảnh Lang', parent: 'Thanh Phong Lang', el: 'bang', order: 0 },
  { n: 'U Minh Lang', parent: 'Nguyên Lang', el: 'am', order: 1 },
  { n: 'Thần Điểu', el: 'quang', order: 0 },
  { n: 'Hỏa Hạc', parent: 'Thần Điểu', el: 'hoa', order: 0 },
  { n: 'Kim Vũ Hạc', parent: 'Hỏa Hạc', el: 'kim', order: 0 },
  { n: 'Thanh Vân Điểu', parent: 'Thần Điểu', el: 'phong', order: 1 },
  { n: 'Hải Kình', el: 'thuy', order: 0 },
  { n: 'Bạch Kình', parent: 'Hải Kình', el: 'thuy', order: 0 },
  { n: 'Hàn Hải Kình', parent: 'Bạch Kình', el: 'bang', order: 0 },
  { n: 'Lôi Kình', parent: 'Hải Kình', el: 'loi', order: 1 },
  { n: 'Sư Tử', el: 'hoa', order: 0 },
  { n: 'Xích Diễm Sư', parent: 'Sư Tử', el: 'hoa', order: 0 },
  { n: 'Liệt Diễm Sư', parent: 'Xích Diễm Sư', el: 'hoa', order: 0 },
  { n: 'Tuyết Sư', parent: 'Sư Tử', el: 'bang', order: 1 },
  { n: 'Cổ Quy', el: 'thuy', order: 0 },
  { n: 'Huyền Giáp Quy', parent: 'Cổ Quy', el: 'tho', order: 0 },
  { n: 'Bích Hải Quy', parent: 'Huyền Giáp Quy', el: 'thuy', order: 0 },
  { n: 'Bạch Hổ', el: 'kim', order: 0 },
  { n: 'Thiết Trảo Hổ', parent: 'Bạch Hổ', el: 'kim', order: 0 },
  { n: 'U Minh Hổ', parent: 'Thiết Trảo Hổ', el: 'am', order: 0 },
  { n: 'Hỏa Văn Hổ', parent: 'Bạch Hổ', el: 'hoa', order: 1 },
  { n: 'Thuần Long', el: 'thuy', order: 0 },
  { n: 'Thanh Lân Long', parent: 'Thuần Long', el: 'moc', order: 0 },
  { n: 'Hải Thiên Long', parent: 'Thanh Lân Long', el: 'thuy', order: 0 },
  { n: 'Xích Viêm Long', parent: 'Thuần Long', el: 'hoa', order: 1 },
  { n: 'Cự Ngư', el: 'thuy', order: 0 },
  { n: 'Thâm Hải Cự Ngư', parent: 'Cự Ngư', el: 'thuy', order: 0 },
  { n: 'Thôn Hải Thú', parent: 'Thâm Hải Cự Ngư', el: 'am', order: 0 },
  { n: 'Băng Ngạc Ngư', parent: 'Cự Ngư', el: 'bang', order: 1 },
  { n: 'Thượng Cổ Trùng', el: 'moc', order: 0 },
  { n: 'Kim Giáp Ngô Công', parent: 'Thượng Cổ Trùng', el: 'kim', order: 0 },
  { n: 'Hư Linh Trùng', parent: 'Thượng Cổ Trùng', el: 'loi', order: 1 },
  { n: 'Hư Không Trùng', parent: 'Hư Linh Trùng', el: 'loi', order: 0 },
  { n: 'Sa Hạt', el: 'tho', order: 0 },
  { n: 'Sa Hạt Vương', parent: 'Sa Hạt', el: 'tho', order: 0 },
  { n: 'Thổ Hoàng Hạt', parent: 'Sa Hạt', el: 'tho', order: 1 },
  { n: 'Băng Phách Hạt', parent: 'Thổ Hoàng Hạt', el: 'bang', order: 0 },
  { n: 'Băng Hùng', el: 'bang', order: 0 },
  { n: 'Huyền Băng Hùng', parent: 'Băng Hùng', el: 'bang', order: 0 },
  { n: 'Băng Phách Hùng', parent: 'Huyền Băng Hùng', el: 'bang', order: 0 },
  { n: 'Lôi Thú', el: 'loi', order: 0 },
  { n: 'Tử Điện Thú', parent: 'Lôi Thú', el: 'loi', order: 0 },
  { n: 'Lôi Linh Thú', parent: 'Tử Điện Thú', el: 'loi', order: 0 },
  { n: 'Thụ Yêu', el: 'moc', order: 0 },
  { n: 'Thanh Mộc Thụ Yêu', parent: 'Thụ Yêu', el: 'moc', order: 0 },
  { n: 'Cổ Mộc Thụ Yêu', parent: 'Thanh Mộc Thụ Yêu', el: 'moc', order: 0 },
  { n: 'Thi Quỷ', el: 'am', order: 0 },
  { n: 'Âm Trạch Thi Quỷ', parent: 'Thi Quỷ', el: 'am', order: 0 },
  { n: 'Ảnh Báo', el: 'am', order: 0 },
  { n: 'Dạ Ảnh Báo', parent: 'Ảnh Báo', el: 'am', order: 0 },
  { n: 'Dạ Xoa Ảnh Báo', parent: 'Dạ Ảnh Báo', el: 'am', order: 0 },
  { n: 'Thôn Kim Thử', el: 'kim', order: 0 },
  { n: 'Phệ Kim Thử', parent: 'Thôn Kim Thử', el: 'kim', order: 0 },
  { n: 'Phệ Kim Thú', parent: 'Phệ Kim Thử', el: 'kim', order: 0 },
  { n: 'Côn Bằng', el: 'thuy', order: 0, shjLineage: true },
  { n: 'Côn Ngư', parent: 'Côn Bằng', el: 'thuy', order: 0 },
  { n: 'Kim Sí Đại Bằng', parent: 'Côn Bằng', el: 'phong', order: 1 },
  { n: 'Thanh Vũ Điêu', parent: 'Côn Bằng', el: 'phong', order: 2 },
  { n: 'Huyền Vũ', el: 'thuy', order: 0, shjLineage: true },
  { n: 'Huyền Quy', parent: 'Huyền Vũ', el: 'thuy', order: 0 },
  { n: 'Huyền Quy Thần', parent: 'Huyền Quy', el: 'thuy', order: 0 },
  { n: 'Bạch Trạch', el: 'quang', order: 0 },
  { n: 'Bạch Trạch Thánh Thú', parent: 'Bạch Trạch', el: 'quang', order: 0 },
  { n: 'Bạch Trạch Linh Thú', parent: 'Bạch Trạch Thánh Thú', el: 'quang', order: 0 },
  { n: 'Bạch Trạch Dị Thú', parent: 'Bạch Trạch Linh Thú', el: 'quang', order: 0 },
  { n: 'Cửu Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Bát Vĩ Hồ', parent: 'Cửu Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Thất Vĩ Hồ', parent: 'Bát Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Lục Vĩ Hồ', parent: 'Thất Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Ngũ Vĩ Hồ', parent: 'Lục Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Tứ Vĩ Hồ', parent: 'Ngũ Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Tam Vĩ Hồ', parent: 'Tứ Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Nhị Vĩ Hồ', parent: 'Tam Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Nhất Vĩ Hồ', parent: 'Nhị Vĩ Hồ', el: 'hoa', order: 0 },
  { n: 'Xích Diễm Hồ', parent: 'Cửu Vĩ Hồ', el: 'hoa', order: 1 },
  { n: 'Tuyết Ảnh Hồ', parent: 'Cửu Vĩ Hồ', el: 'bang', order: 2 },
  { n: 'Ngân Nguyệt Hồ', parent: 'Cửu Vĩ Hồ', el: 'quang', order: 3 },
  { n: 'Tinh Hồ', parent: 'Cửu Vĩ Hồ', el: 'quang', order: 4 },
  { n: 'Ảnh Hồ', parent: 'Cửu Vĩ Hồ', el: 'am', order: 5 },
  { n: 'Lung Điệt', parent: 'Cửu Vĩ Hồ', el: 'hoa', order: 6 },
  { n: 'Thiên Cẩu', el: 'kim', order: 0, shjLineage: true },
  { n: 'Ngân Nguyệt Lang Vương', parent: 'Thiên Cẩu', el: 'kim', order: 0, shjLineage: true },
  { n: 'Hắc Phong Lang', parent: 'Ngân Nguyệt Lang Vương', el: 'phong', order: 0 },
  { n: 'Linh Lang', parent: 'Ngân Nguyệt Lang Vương', el: 'phong', order: 1 },
  { n: 'Hồng Hoang Hung Lang', parent: 'Ngân Nguyệt Lang Vương', el: 'am', order: 2 },
  { n: 'Ngân Nguyệt Lang', parent: 'Ngân Nguyệt Lang Vương', el: 'kim', order: 3 },
  { n: 'Tật Phong Lang', parent: 'Ngân Nguyệt Lang', el: 'phong', order: 0 },
  { n: 'Chu Yếm', el: 'kim', order: 0, shjLineage: true },
  { n: 'Tinh Tinh', parent: 'Chu Yếm', el: 'moc', order: 0 },
  { n: 'Ung Hòa', parent: 'Chu Yếm', el: 'am', order: 1 },
];
/** Gắn các nhánh phả hệ đã định danh và họ nền dùng cho dị thú bản địa. */
/** Concrete descendant species, keeping ancestor names separate from the animal's own species. */
export function beastDescendants(ancestor: string): { n: string; el: El }[] {
  const descendants = new Set<string>([ancestor]);
  for (let changed = true; changed;) {
    changed = false;
    for (const node of BEAST_LINEAGE) if (node.parent && descendants.has(node.parent) && !descendants.has(node.n)) {
      descendants.add(node.n); changed = true;
    }
  }
  return BEAST_LINEAGE.filter(node => node.n !== ancestor && descendants.has(node.n) && !BEAST_LINEAGE.some(child => child.parent === node.n));
}
export function linkBeastFamilies(beasts: Beast[]) {
  for (const node of BEAST_LINEAGE) {
    let beast = beasts.find((b) => b.n === node.n);
    if (!beast) {
      beast = { n: node.n, el: node.el, lv: [20, 20], mat: 'cotuhuyet', codexOnly: true };
      beasts.push(beast);
    }
    if (node.parent) beast.anc = node.parent;
    else delete beast.anc;
    beast.codexOrder = node.order;
    if (node.shjLineage) beast.shjLineage = true;
  }
  const pending = new Set(beasts);
  while (pending.size) {
    let linked = false;
    for (const beast of pending) {
      if (!beast.anc) {
        beast.population = 1n;
        pending.delete(beast);
        linked = true;
        continue;
      }
      const parent = beasts.find((b) => b.n === beast.anc);
      if (!parent) throw new Error(`Unknown beast ancestor "${beast.anc}" for "${beast.n}"`);
      if (parent.population === undefined) continue;
      let hash = 2166136261;
      const seed = `${parent.n}>${beast.n}`;
      for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619) >>> 0;
      const multiplier = BigInt(10 + hash % 91);
      beast.population = parent.population * multiplier;
      pending.delete(beast);
      linked = true;
    }
    if (!linked) throw new Error('Beast lineage contains a cycle');
  }
}
linkBeastFamilies(BEASTS);
export function beastRoot(beast: Beast): string {
  let current = beast;
  while (current.anc) {
    const parent = BEASTS.find((x) => x.n === current.anc);
    if (!parent) break;
    current = parent;
  }
  return current.n;
}
export const shjAt = (locId: string) => BEASTS.filter((b) => b.home === locId);
for (const l of L) LOCS[l.id] = l; // đăng ký các địa điểm bổ sung vào bảng tra cứu
// ================= Sông & Long Vương & cổng thần giới =================
/** Số sông mỗi lục địa: Trung Vực và Đông Vực nhiều sông nhất, các vực khác ít hơn nhưng không dưới sáu. */
/** Số sông mặc định mỗi vực; giới có thể đặt riêng (WorldPack.riverN). RIVER_N / RIVER_MAJOR_N là số của giới đang nạp. */
export const RIVER_N0: Record<Vuc, number> = { trung: 10, dong: 10, tay: 6, nam: 7, bac: 6 };
export const RIVER_N: Record<Vuc, number> = { ...RIVER_N0 };
/** Số sông lớn (có Long Cung) mỗi lục địa; các sông còn lại là sông nhỏ thuộc quyền Long Vương sông lớn gần nhất. */
export const RIVER_MAJOR_N0: Record<Vuc, number> = { trung: 4, dong: 3, tay: 3, nam: 3, bac: 3 }; // mỗi sông lớn một Long Vương
export const RIVER_MAJOR_N: Record<Vuc, number> = { ...RIVER_MAJOR_N0 };
/** Dòng chảy đặt tay cho một số sông nhỏ: tên sông → điểm [vực, nx, ny] (toạ độ chuẩn hoá trong elip lục địa). */
const RIVER_PATHS: Record<string, [Vuc, number, number][]> = {};
const VUC_ORDER: Vuc[] = ['trung', 'dong', 'tay', 'nam', 'bac'];
/** Tên sông theo thứ tự RIVERS (lần lượt từng lục địa theo VUC_ORDER, sông lớn đứng trước). */
export const RIVER_NAMES: string[] = [];
/** Sông lớn hay sông nhỏ, theo thứ tự RIVERS. */
export const RIVER_MAJOR: boolean[] = [];
/** Nhãn sông: [tên, x, y, góc (radian)]. */
export const RIVER_LABELS: [string, number, number, number][] = [];
const RIVERS0 = [
  // Trung Vực: 4 sông lớn + 6 nhánh
  'Thiên Hà', 'Lạc Thủy', 'Vị Thủy', 'Kinh Hà', 'Bạch Lộ Hà', 'Tử Khê', 'Hoàng Nhưỡng Hà', 'Thanh Khê', 'Lương Thủy', 'Phong Khê',
  // Đông Vực: 3 sông lớn + 7 nhánh (đồng bằng sông nước)
  'Vân Giang', 'Bích Thủy Giang', 'Yên Ba Giang', 'Mộng Trạch Hà', 'Lục Khê', 'Thanh Nguyên Hà', 'Triều Âm Hà', 'Hạc Khê', 'Liễu Khê', 'Sương Khê',
  // Tây Vực: 3 sông lớn + 3 nhánh (sa mạc ít nhánh)
  'Lưu Sa Hà', 'Kim Sa Giang', 'Hắc Thủy', 'Nhược Thủy', 'Ốc Châu Khê', 'Diễm Khê',
  // Nam Vực: 3 sông lớn + 4 nhánh
  'Thương Giang', 'Man Giang', 'Lan Thương Giang', 'Độc Long Hà', 'Cổ Trùng Khê', 'Trống Đồng Hà', 'Tượng Khê',
  // Bắc Vực: 3 sông lớn + 3 nhánh
  'Sóc Hà', 'Băng Hà', 'Hàn Tinh Hà', 'Tuyết Thủy', 'Bạch Lang Khê', 'Cực Quang Khê',
];
/** Tên các sông lớn (theo thứ tự Trung ×2, Đông, Tây, Nam, Bắc) rút từ danh sách tên đầy đủ. */
export function majorRivers(names: string[], n: Record<Vuc, number> = RIVER_N, major: Record<Vuc, number> = RIVER_MAJOR_N): string[] {
  const out: string[] = [];
  let i = 0;
  for (const v of VUC_ORDER) { for (let j = 0; j < n[v]; j++, i++) if (j < major[v] && names[i]) out.push(names[i]); }
  return out;
}
/** Hải Long Vương bốn biển (theo điển cố Ngao thị) và Hà/Giang Long Vương các sông lớn. */
const SEA_KINGS = ['Ngao Quảng', 'Ngao Khâm', 'Ngao Nhuận', 'Ngao Thuận'];
const SEA_RANKS = ['Phụng Thiên Hành Vũ Đại Long Thần', 'Tư Vũ Đại Long Thần', 'Trấn Hải Đại Long Thần', 'Bố Vũ Đại Long Thần'];
const RIVER_KINGS = ['Ngao Bính', 'Ngao Liệt', 'Ngao Minh', 'Ngao Tuấn', 'Ngao Dật', 'Ngao Hạo', 'Ngao Tĩnh', 'Ngao Lăng', 'Ngao Ly', 'Ngao Chấn', 'Ngao Thanh', 'Ngao Hồng', 'Ngao Nhiên', 'Ngao Khải', 'Ngao Vân', 'Ngao Túc'];
const RIVER_RANKS = ['Trấn Giang Long Thần', 'Tư Thủy Long Thần', 'Hộ Giang Long Thần', 'Bố Vũ Long Thần', 'Thanh Ba Long Thần', 'Định Lưu Long Thần'];
const riverKingTitle = (river: string) => (/Giang$/.test(river) ? 'Giang Long Vương' : 'Hà Long Vương');
/**
 * Sinh thế lực Long Vương cho một giới: 4 Hải Long Cung ngoài biển (vị trí cố định) + một Long Cung dưới mỗi sông lớn.
 * Long cung là tông môn (bậc 3 biển / bậc 2 sông) do Long Vương đương nhiệm cai quản; mỗi Long Vương đều mang tiên chức Thiên Đình.
 */
export function mkDragons(o: { prefix: string; seas: [string, string, string, string]; rivers: string[]; seaReg: Record<Exclude<Vuc, 'trung'>, string>; landReg: Record<Vuc, string>; seaTech: string; riverTech: string; landmass: Record<Vuc, { x: number; y: number; rx: number; ry: number }>; seaXY?: Partial<Record<Exclude<Vuc, 'trung'>, [number, number]>>; riverKings?: string[]; majorN?: Record<Vuc, number> }): { locs: Loc[]; sects: Record<string, Sect> } {
  const locs: Loc[] = [];
  const sects: Record<string, Sect> = {};
  const cx = o.landmass.trung.x, cy = o.landmass.trung.y;
  const seaXY: Record<Exclude<Vuc, 'trung'>, [number, number]> = { dong: [cx + 4650, cy - 200], nam: [cx - 300, cy + 3450], tay: [cx - 4650, cy + 200], bac: [cx + 300, cy - 3450], ...o.seaXY };
  const riverKings = o.riverKings ?? RIVER_KINGS;
  const majorN = o.majorN ?? RIVER_MAJOR_N;
  const seaIdx: Record<Exclude<Vuc, 'trung'>, number> = { dong: 0, nam: 1, tay: 2, bac: 3 };
  for (const v of ['dong', 'nam', 'tay', 'bac'] as const) {
    const sea = o.seas[seaIdx[v]].replace(/\s+/g, ' ').trim();
    const seaN = sea.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()); // 'ĐÔNG HẢI' → 'Đông Hải'
    const id = `${o.prefix}lc_${v}`;
    const king = SEA_KINGS[seaIdx[v]], rank = SEA_RANKS[seaIdx[v]];
    locs.push({ id, n: `${seaN} Long Cung`, type: 'sect', reg: o.seaReg[v], x: 0, y: 0, qi: 1.9, sect: id, island: true, sea: true, xy: seaXY[v], d: `Long cung dưới đáy ${seaN}, cột san hô, mái dạ minh châu. Hải Long Vương ${king} cai quản toàn bộ ${seaN}: thủy tộc, mưa gió, tàu thuyền qua lại đều phải nộp lễ.` });
    sects[id] = { id, n: `${seaN} Long Cung`, loc: id, tier: 3, el: ['thuy', 'loi'], minQ: 3, tech: o.seaTech, craft: 'alch', leader: 'Hải Long Vương', tribe: 'hai', dragon: { king, title: 'Hải Long Vương', rank }, d: `Thế lực của Hải Long Vương ${king}, cai quản ${seaN}. Tiên chức Thiên Đình: ${rank}. Chỉ thu nhận hải tộc yêu thú hóa hình; nhân tộc không có cửa.`, motto: 'Bốn biển một nhà, trăm sông về biển.' };
  }
  const order: Vuc[] = VUC_ORDER.flatMap((v) => Array.from({ length: majorN[v] }, () => v)); // mỗi sông lớn một long cung
  o.rivers.forEach((river, i) => {
    const v = order[i] || 'trung';
    const id = `${o.prefix}lc_r${i}`;
    const king = riverKings[i % riverKings.length], rank = RIVER_RANKS[i % RIVER_RANKS.length];
    const title = riverKingTitle(river);
    locs.push({ id, n: `${river} Long Cung`, type: 'sect', reg: o.landReg[v], x: 0, y: 0, qi: 1.5, sect: id, river, d: `Long cung dưới đáy ${river}. ${title} ${king} cai quản dòng sông và các sông nhỏ đổ vào: nước lớn nước ròng, cá tôm, thuyền bè đều theo lệnh.` });
    sects[id] = { id, n: `${river} Long Cung`, loc: id, tier: 2, el: ['thuy'], minQ: 2, tech: o.riverTech, craft: 'talis', leader: title, tribe: 'thuy', dragon: { king, title, rank }, d: `Thế lực của ${title} ${king}, cai quản ${river} cùng các nhánh sông nhỏ đổ vào (nhánh nhỏ không có Long Vương riêng). Tiên chức Thiên Đình: ${rank}, dưới quyền Hải Long Vương nơi sông đổ ra. Chỉ thu nhận thủy tộc yêu thú hóa hình.`, motto: 'Nước chảy về đâu, lệnh ta tới đó.' };
  });
  return { locs, sects };
}
/** Cổng bí cảnh tới bốn thần giới, đặt sau lưng địa điểm chủ (Tử Tiêu → Thiên Đình, ma phủ → Địa Phủ, yêu đình → Yêu Giới, Phật tự → Linh Sơn). */
export function mkGates(o: { prefix: string; hosts: Partial<Record<CelestialId, Loc>> }): Loc[] {
  const out: Loc[] = [];
  for (const id of Object.keys(o.hosts) as CelestialId[]) {
    const host = o.hosts[id];
    if (!host) continue;
    const R = CELESTIAL[id];
    out.push({ id: `${o.prefix}gate_${id}`, n: R.gateN, type: 'realm', reg: host.reg, x: 0, y: 0, qi: 1.6, lv: 5, minRealm: 3, gate: id, gateHost: host.id, d: R.gateD });
  }
  return out;
}
/** Đặt long cung sông vào giữa dòng, trả long cung biển về toạ độ cố định, đặt cổng thần giới sau lưng địa điểm chủ — gọi sau buildGeo. */
function placeSpecial() {
  for (const l of L) if (l.xy) [l.x, l.y] = l.xy; // bước giãn điểm trong layout có thể đẩy lệch
  const others = L.filter((l) => !l.river && !l.gate);
  const free = (x: number, y: number, d = 240) => others.every((o) => Math.hypot(o.x - x, o.y - y) >= d);
  for (const l of L) {
    if (!l.river) continue;
    const i = RIVER_NAMES.indexOf(l.river);
    const pts = RIVERS[i];
    if (!pts) continue;
    const mid = Math.floor(pts.length / 2);
    const order = Array.from({ length: pts.length }, (_, d) => mid + (d % 2 ? (d + 1) / 2 : -d / 2)).filter((j) => j >= 2 && j < pts.length - 1); // từ giữa dòng tỏa ra hai phía
    const minD = (x: number, y: number, arr: Loc[]) => (arr.length ? Math.min(...arr.map((o) => Math.hypot(o.x - x, o.y - y))) : 1e9);
    const fixedO = others.filter(isFixedLoc);
    let k = order.find((j) => free(pts[j][0], pts[j][1])) ?? -1;
    if (k < 0) { // không chỗ nào trống hẳn: chọn điểm cách mọi địa điểm cố định ≥ 240 và thoáng nhất với số còn lại (số còn lại sẽ lùi ra)
      const okIdx = order.filter((j) => minD(pts[j][0], pts[j][1], fixedO) >= 240);
      const pool = okIdx.length ? okIdx : order;
      k = pool.reduce((best, j) => (minD(pts[j][0], pts[j][1], others) > minD(pts[best][0], pts[best][1], others) ? j : best), pool[0]);
    }
    [l.x, l.y] = pts[k];
    // địa điểm thường nào quá sát long cung thì lùi ra (long cung và đảo giữ nguyên)
    for (const o of others) {
      if (isFixedLoc(o)) continue;
      const d = Math.hypot(o.x - l.x, o.y - l.y);
      if (d < 240) { const ux = d ? (o.x - l.x) / d : 1, uy = d ? (o.y - l.y) / d : 0; o.x = l.x + ux * 240; o.y = l.y + uy * 240; }
    }
  }
  const nonGate = L.filter((l) => !l.gate);
  /** Đặt l quanh anchor: ưu tiên chỗ trống hẳn (≥ minOther với mọi nơi khác), không có thì chọn chỗ thoáng nhất rồi lùi địa điểm thường ra xa. */
  const VERT = [-90, 90, -65, -115, 65, 115, -40, -140, 40, 140, -20, -160, 20, 160, 0, 180]; // ưu tiên trên/dưới
  const settleNear = (l: Loc, anchor: Loc, rings: number[], pool: Loc[], minOther = 240, angles: number[] = Array.from({ length: 16 }, (_, a) => (a / 16) * 360)) => {
    const rest = pool.filter((o) => o !== l);
    const minD = (x: number, y: number) => Math.min(...rest.map((o) => (o === anchor ? 1e9 : Math.hypot(o.x - x, o.y - y))));
    let best: [number, number] | null = null, bestD = -1;
    for (const r of rings) for (const ang of angles) {
      const x = anchor.x + Math.cos(ang * DEG) * r, y = anchor.y + Math.sin(ang * DEG) * r;
      const d = minD(x, y);
      if (d >= minOther) { best = [x, y]; bestD = d; break; }
      if (d > bestD) { best = [x, y]; bestD = d; }
    }
    [l.x, l.y] = best || [anchor.x + rings[0], anchor.y];
    for (const o of rest) { // địa điểm thường quá sát thì lùi ra; nơi cố định giữ nguyên
      if (o === anchor || isFixedLoc(o)) continue;
      const d = Math.hypot(o.x - l.x, o.y - l.y);
      if (d < minOther) { const ux = d ? (o.x - l.x) / d : 1, uy = d ? (o.y - l.y) / d : 0; o.x = l.x + ux * minOther; o.y = l.y + uy * minOther; }
    }
  };
  for (const l of L) {
    if (!l.gate) continue;
    const host = L.find((x) => x.id === l.gateHost) || L[0];
    const pool = nonGate.concat(L.filter((x) => x.gate && x !== l));
    // chủ có dãy núi riêng: thế lực đứng trên đỉnh núi gốc; cổng lên ngọn gần nhất (thấp hơn núi gốc) cách thế lực ≥ 75
    const apex = (p: Peak): [number, number] => [p.x, p.y - p.h];
    host.base ||= [host.x, host.y];
    const range = PEAKS.filter((p) => p.id === host.id);
    const root = range.find((p) => p.root);
    if (root) {
      [host.x, host.y] = [apex(root)[0], apex(root)[1] + 6];
      const othersAll = pool.filter((o) => o !== host && o !== l);
      const d = (p: Peak) => Math.hypot(apex(p)[0] - host.x, apex(p)[1] - host.y);
      const clear = (p: Peak) => othersAll.every((o) => Math.hypot(o.x - apex(p)[0], o.y - apex(p)[1]) >= 150);
      // chiều cao ngọn đặt cổng sẽ được nâng thành cao thứ nhì của dãy → tính khoảng cách theo đỉnh sau khi nâng
      const hAdj = (p: Peak) => { const rest = Math.max(0, ...range.filter((q) => q !== root && q !== p).map((q) => q.h)); return rest + (root.h - rest) * 0.3; }; // cao nhì: trên mọi ngọn còn lại, dưới núi gốc rõ rệt
      const dAdj = (p: Peak) => Math.hypot(p.x - host.x, p.y - hAdj(p) - host.y);
      const clearAdj = (p: Peak) => othersAll.every((o) => Math.hypot(o.x - p.x, o.y - (p.y - hAdj(p))) >= 150);
      const far = range.filter((p) => p !== root && dAdj(p) >= 75).sort((a, b) => dAdj(a) - dAdj(b));
      const gp = far.find(clearAdj) || far[0] || range.filter((p) => p !== root).sort((a, b) => dAdj(b) - dAdj(a))[0];
      if (gp) {
        // ngọn đặt cổng là ngọn cao thứ nhì của dãy: chỉ thấp hơn núi gốc, cao hơn mọi ngọn còn lại
        gp.h = hAdj(gp);
        gp.w = Math.max(gp.w, gp.h * 0.42);
        gp.gate = true;
        l.x = apex(gp)[0]; l.y = apex(gp)[1] + 8;
        continue;
      }
    }
    settleNear(l, host, [75, 90, 110], pool, 200, VERT); // bí cảnh sát thế lực trấn giữ, lệch dọc để chữ không đè, cách nơi khác ≥ 200
  }
  // địa điểm đi kèm (vd. Hoàng Tuyền Trấn dưới chân Hoàng Tuyền Quỷ Môn): đặt sát mục tiêu, cách các nơi khác ≥ 240
  for (const l of L) {
    if (!l.near) continue;
    const tgt = L.find((x) => x.id === l.near);
    if (!tgt) continue;
    settleNear(l, tgt, [260, 320, 400], L);
  }
}
{
  // Phật môn phía Tây: phương trượng là một vị Phật Đà của Linh Sơn
  L.push({ id: 'linhsontu', n: 'Linh Sơn Tự', type: 'sect', reg: 'tayluong', x: 0, y: 0, qi: 1.9, sect: 'linhsontu', d: 'Phật tự trên ngọn núi đá giữa sa mạc, tường vàng giữa cát trắng, chuông sớm vang ba trăm dặm. Phương trượng là một vị Phật Đà từ Linh Sơn xuống trụ trì; sau Đại Hùng Bảo Điện có cột Phật quang thông lên Linh Sơn.' });
  L.push({ id: 'daigiac', n: 'Đại Giác Tự', type: 'sect', reg: 'tayluong', x: 0, y: 0, qi: 1.6, sect: 'daigiac', d: 'Phật tự trong ốc đảo, tăng chúng đông, giỏi giảng kinh và vẽ phù. Là hạ viện của Linh Sơn Tự.' });
  SECTS.linhsontu = { id: 'linhsontu', n: 'Linh Sơn Tự', loc: 'linhsontu', tier: 4, el: ['quang', 'tho'], minQ: 5, tech: 'luuquangquyet', craft: 'talis', leader: 'Phương Trượng (Phật Đà)', d: 'Phật môn chính tông của Tây Vực, cửa ngõ của Linh Sơn ở trần thế. Phương trượng luôn là một vị Phật Đà của Linh Sơn.', motto: 'Sắc tức thị không, không tức thị sắc.' };
  SECTS.daigiac = { id: 'daigiac', n: 'Đại Giác Tự', loc: 'daigiac', tier: 2, el: ['quang', 'tho'], minQ: 2, tech: 'thanquangquyet', craft: 'talis', d: 'Hạ viện của Linh Sơn Tự trong ốc đảo Tây Vực, chuyên giảng kinh và chế phù trấn tà.', motto: 'Phóng hạ đồ đao.' };
  SECTS.tutieu.leader = 'Vân Tiêu Tiên Tử';
  SECTS.vanyeudinh.leader = 'Yêu Hoàng';
  const dr = mkDragons({ prefix: '', seas: ['Đông Hải', 'Nam Hải', 'Tây Hải', 'Bắc Hải'], rivers: majorRivers(RIVERS0), seaReg: { dong: 'donghai', nam: 'namhai', tay: 'tayhai', bac: 'bachai' }, landReg: { trung: 'trungtho', dong: 'vanmong', tay: 'tayluong', nam: 'namman', bac: 'bacminh' }, seaTech: 'bichhaitrieu', riverTech: 'tinhhaiquyet', landmass: LANDMASS });
  L.push(...dr.locs);
  Object.assign(SECTS, dr.sects);
  const byId = (id: string) => L.find((l) => l.id === id)!;
  L.push(...mkGates({ prefix: '', hosts: { thiendinh: byId('tutieu'), diaphu: byId('cuuu'), yeugioi: byId('vanyeudinh'), linhson: byId('linhsontu') } }));
  RIVER_NAMES.push(...RIVERS0); // (fill chưa khai báo ở điểm này)
}
layout();
// cảng
for (const l of L) if (l.type === 'town') l.port = true;
for (const id of ['bencat', 'haikhau', 'ngoctrai']) if (LOCS[id]) LOCS[id].port = true;

/** Hạt giống địa hình của giới hiện tại (giới 0 = '' để giữ nguyên bản đồ Thương Lan). */
let GEO = '';
const blob = (v: Vuc, n: number, jitter: number): [number, number][] => {
  const m = LANDMASS[v];
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (hrand(GEO + 'coast' + v, i) - 0.5) * jitter;
    return [m.x + Math.cos(a) * m.rx * 1.08 * k, m.y + Math.sin(a) * m.ry * 1.08 * k] as [number, number];
  });
};
const fill = <T,>(arr: T[], v: T[]) => { arr.length = 0; arr.push(...v); };
export const MAINLAND: [number, number][] = [];
export const LANDS: [number, number][][] = [];
export const ISLANDS: [number, number, number, number][] = [];
export const TRUNG_RING: [number, number][] = [];
export const VUC_BORDERS: [number, number][][] = [];
/** Ranh giới các châu (nét đứt trên bản đồ): vực ngoài chia ba theo trục dài, Trung Vực = lõi + bốn góc chéo. */
export const CHAU_BORDERS: [number, number][][] = [];
/** Lõi Trung Vực (Trung Châu) tính theo bán kính chuẩn hoá. */
const TRUNG_CORE = 0.478; // bán kính tới đỉnh tứ giác lõi; cùng CORE_BULGE cho lõi đúng 1/5 diện tích Trung Vực → 5 châu bằng nhau
/** Vực ngoài chia ba châu quanh ±CHAU_SPLIT trên trục dài (chuẩn hoá -1..1). */
const CHAU_SPLIT = 1 / 3;
/** Đường lượn tự nhiên (tổng vài sóng sin, hạt giống cố định theo giới) — dùng chung cho cả gán châu lẫn vẽ ranh giới. */
function wob(seed: string, u: number, amp: number, periodic = false) {
  let v = 0, norm = 0;
  for (let k = 1; k <= 8; k++) { // 5 sóng lớn + 3 sóng nhỏ cho răng cưa
    const ph = hrand(seed, k) * Math.PI * 2;
    const fr = periodic ? Math.round(k * 1.6 + hrand(seed, 10 + k) * 1.4) : k * 1.7 + hrand(seed, 10 + k) * 1.3;
    const w = 1 / k;
    v += Math.sin((periodic ? u : u * Math.PI) * fr + ph) * w;
    norm += w;
  }
  return (v / norm) * amp;
}
const SPLIT_AMP = 0.085; // biên độ lượn của vạch chia vực ngoài (chuẩn hoá theo trục dài)
const CORE_AMP = 0.035; // biên độ lượn cạnh lõi Trung Vực
const CORE_BULGE = 0.1; // cạnh lõi phình ra ngoài (tứ giác bo tròn)
const DIAG_AMP = 6; // biên độ lượn (độ) của bốn đường chéo Trung Vực
const DIAG_DEG = [45, 135, -135, -45] as const; // đông-nam, tây-nam, tây-bắc, đông-bắc
/** Vị trí vạch chia thứ i (0 = gần, 1 = xa theo trục dài) tại toạ độ ngang u. */
const splitAt = (v: Exclude<Vuc, 'trung'>, i: 0 | 1, u: number) => (i ? CHAU_SPLIT : -CHAU_SPLIT) + wob(`${GEO}cb${v}${i}`, u, SPLIT_AMP);
/** Góc (độ) của đường chéo k tại bán kính chuẩn hoá f. */
const diagAt = (k: 0 | 1 | 2 | 3, f: number) => DIAG_DEG[k] + wob(`${GEO}dg${k}`, f, DIAG_AMP);
/** Đa giác lõi Trung Vực (toạ độ chuẩn hoá): nối bốn đầu trong của bốn đường chéo bằng cạnh lượn.
 *  Bốn châu rìa nhờ đó khép kín; ô giữa tự thành Trung Châu. */
let coreCache: { geo: string; poly: [number, number][] } | null = null;
function corePoly(): [number, number][] {
  if (coreCache && coreCache.geo === GEO) return coreCache.poly;
  const vs = ([0, 1, 2, 3] as const).map((k) => { const a = diagAt(k, TRUNG_CORE) * DEG; return [Math.cos(a) * TRUNG_CORE, Math.sin(a) * TRUNG_CORE] as [number, number]; });
  const poly: [number, number][] = [];
  const N = 24;
  for (let k = 0; k < 4; k++) {
    const a = vs[k], b = vs[(k + 1) % 4];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len; // pháp tuyến
    for (let s = 0; s < N; s++) {
      const u = s / N;
      const w = Math.sin(u * Math.PI) * (wob(`${GEO}ce${k}`, u * 2 - 1, CORE_AMP) - CORE_BULGE); // hai đầu cạnh trùng đỉnh; pháp tuyến (-dy,dx) hướng vào trong nên trừ để phình ra
      poly.push([a[0] + dx * u + px * w, a[1] + dy * u + py * w]);
    }
  }
  coreCache = { geo: GEO, poly };
  return poly;
}
export function inPoly(x: number, y: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** Chỉ số châu (0,1,2) của một điểm trong vực ngoài theo phạm vi địa lý (ranh giới lượn). */
function bandOf(v: Exclude<Vuc, 'trung'>, x: number, y: number) {
  const m = LANDMASS[v];
  const tall = v === 'dong' || v === 'tay';
  const along = tall ? (y - m.y) / m.ry : (x - m.x) / m.rx;
  const u = tall ? (x - m.x) / m.rx : (y - m.y) / m.ry;
  return along < splitAt(v, 0, u) ? 0 : along <= splitAt(v, 1, u) ? 1 : 2;
}
/** Châu Trung Vực: 0 lõi, 1 bắc, 2 nam, 3 đông, 4 tây — theo đa giác lõi và bốn đường chéo lượn. */
function trungQuad(x: number, y: number): 0 | 1 | 2 | 3 | 4 {
  const m = LANDMASS.trung;
  const nx = (x - m.x) / m.rx, ny = (y - m.y) / m.ry;
  const f = Math.hypot(nx, ny), th = Math.atan2(ny, nx);
  if (inPoly(nx, ny, corePoly())) return 0;
  const deg = th / DEG;
  const d0 = diagAt(0, f), d1 = diagAt(1, f), d2 = diagAt(2, f), d3 = diagAt(3, f);
  if (deg > d3 && deg < d0) return 3;
  if (deg >= d0 && deg < d1) return 2;
  if (deg >= d2 && deg <= d3) return 1;
  return 4;
}
/** Sông: mỗi lục địa một hai con sông chảy từ giữa ra biển. */
export const RIVERS: [number, number][][] = [];
/** Dãy núi: [x, y, tỉ lệ, id thế lực?]. Dãy gắn id là núi của tông môn: đỉnh ngọn cao nhất trùng vị trí thế lực. */
export const MOUNTAINS: [number, number, number, string?][] = [];
/** Từng ngọn núi (sinh từ MOUNTAINS, dùng để vẽ và để đặt thế lực / cổng lên đỉnh). gate: ngọn dành cho cổng bí cảnh. */
export interface Peak { x: number; y: number; h: number; w: number; id?: string; gate?: boolean; root?: boolean }
export const PEAKS: Peak[] = [];
function buildGeo() {
  fill(MAINLAND, blob('trung', 60, 0.1));
  fill(LANDS, (['dong', 'tay', 'nam', 'bac'] as const).map((v) => blob(v, 48, 0.14)));
  fill(ISLANDS, L.filter((l) => l.island && !l.sea).map((l) => [l.x, l.y, 95 + hrand(l.id, 11) * 110, 70 + hrand(l.id, 12) * 75] as [number, number, number, number]));
  const sd = GEO.length * 13;
  // sông: sông lớn (trục) uốn mềm từ nội địa ra biển; sông nhỏ là chi lưu bắt nguồn lưng chừng và đổ vào trục theo dạng cành cây
  {
    const rv: [number, number][][] = [];
    const major: boolean[] = [];
    /** Dòng chảy đặt tay (RIVER_PATHS) cho sông ở vị trí rv.length: đường Catmull-Rom qua đúng các điểm điều khiển. */
    const fixedPath = (): [number, number][] | null => {
      const ctrl = RIVER_PATHS[RIVER_NAMES[rv.length]];
      if (!ctrl || ctrl.length < 2) return null;
      const P = ctrl.map(([v, nx, ny]) => { const m = LANDMASS[v]; return [m.x + nx * m.rx, m.y + ny * m.ry] as [number, number]; });
      const pts: [number, number][] = [];
      for (let s = 0; s < P.length - 1; s++) {
        const p0 = P[Math.max(0, s - 1)], p1 = P[s], p2 = P[s + 1], p3 = P[Math.min(P.length - 1, s + 2)];
        for (let k = 0; k < 6; k++) {
          const t = k / 6, t2 = t * t, t3 = t2 * t;
          const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
          pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
      }
      pts.push(P[P.length - 1]);
      return pts;
    };
    VUC_ORDER.forEach((v, k) => {
      const m = LANDMASS[v];
      const toXY = (ang: number, f: number): [number, number] => [m.x + Math.cos(ang) * m.rx * f, m.y + Math.sin(ang) * m.ry * f];
      const fOf = (p: [number, number]) => Math.hypot((p[0] - m.x) / m.rx, (p[1] - m.y) / m.ry);
      const nMajor = RIVER_MAJOR_N[v], nMinor = RIVER_N[v] - nMajor;
      const trunks: [number, number][][] = [];
      for (let j = 0; j < nMajor; j++) {
        // các sông lớn tỏa từ vùng cao giữa lục địa ra bờ biển, cách đều nhau theo góc (có xê dịch nhẹ)
        const jit = (hrand(GEO + 'trunk' + v, j) - 0.5) * (300 / nMajor) * 0.5;
        const deg = (k * 77 + 30 + sd) + (j * 360) / nMajor + jit;
        const S0 = toXY((deg + (hrand(GEO + 'trunks' + v, j) - 0.5) * 60) * DEG, 0.08 + hrand(GEO + 'trunkf' + v, j) * 0.1);
        const E0 = toXY(deg * DEG, 1.08);
        const N = 24;
        const dx = E0[0] - S0[0], dy = E0[1] - S0[1], dl = Math.hypot(dx, dy) || 1;
        const px = -dy / dl, py = dx / dl;
        const ph = hrand(GEO + 'trunkp' + v, j) * 6;
        const pts: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const off = (Math.sin(u * Math.PI * 2.1 + ph) * 0.06 + Math.sin(u * Math.PI * 5.3 + ph * 2) * 0.02) * dl * Math.min(1, 0.4 + u); // uốn mềm, hạ lưu rộng hơn
          pts.push([S0[0] + dx * u + px * off, S0[1] + dy * u + py * off]);
        }
        const fixed = fixedPath(); // sông lớn có dòng chảy theo truyền thuyết: chi lưu sẽ đổ vào đúng dòng này
        trunks.push(fixed ?? pts); rv.push(fixed ?? pts); major.push(true);
      }
      // chi lưu: chia đều cho các trục, hai bên xen kẽ, điểm hợp lưu rải từ giữa dòng tới gần cửa sông
      const perTrunk = Math.ceil(nMinor / Math.max(1, trunks.length));
      for (let q = 0; q < nMinor; q++) {
        const T = trunks[q % trunks.length];
        const qq = Math.floor(q / trunks.length);
        const ji = Math.max(2, Math.min(T.length - 3, Math.round((0.18 + ((qq + 0.5) / perTrunk) * 0.72) * (T.length - 1)))); // điểm hợp lưu rải dọc trục, chừa hai đầu
        const J = T[ji], A = T[ji - 1], B = T[ji + 1];
        const tx = B[0] - A[0], ty = B[1] - A[1], tl = Math.hypot(tx, ty) || 1;
        const side = qq % 2 ? 1 : -1;
        const nx = (-ty / tl) * side, ny = (tx / tl) * side;
        const r1 = hrand(GEO + 'tb' + v, q * 2), r2 = hrand(GEO + 'tb' + v, q * 2 + 1);
        let len = (0.28 + r1 * 0.22) * Math.min(m.rx, m.ry);
        const start = (L2: number): [number, number] => [J[0] + nx * L2 - (tx / tl) * L2 * 0.5, J[1] + ny * L2 - (ty / tl) * L2 * 0.5];
        let S = start(len);
        for (let g2 = 0; g2 < 6 && fOf(S) > 0.88; g2++) { len *= 0.8; S = start(len); } // đầu nguồn phải nằm trong đất liền
        const N = 12;
        const dx = J[0] - S[0], dy = J[1] - S[1], dl = Math.hypot(dx, dy) || 1;
        const px = -dy / dl, py = dx / dl;
        const pts: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const off = Math.sin(u * Math.PI) * (Math.sin(u * Math.PI * 2.2 + r2 * 6) * 0.09 + (r2 - 0.5) * 0.12) * dl; // uốn nhẹ, hai đầu khép vào trục
          pts.push([S[0] + dx * u + px * off, S[1] + dy * u + py * off]);
        }
        rv.push(fixedPath() ?? pts); major.push(false);
      }
    });
    fill(RIVERS, rv);
    fill(RIVER_MAJOR, major);
  }
  fill(MOUNTAINS, [
    ...L.filter((l) => (l.type === 'wild' || l.type === 'realm') && !l.island).map((l) => [l.x + 70, l.y - 30, 1 + hrand(l.id, 2) * 0.6] as [number, number, number]),
    ...L.filter((l) => l.reg === 'tienchau' && l.id !== 'tutieu').map((l) => [l.x - 60, l.y - 40, 1.6] as [number, number, number]),
    // thánh địa trên núi: Bất Chu là ngọn núi lớn nhất, Tử Tiêu giữa quần sơn
    ...L.filter((l) => l.type === 'sect' && !l.island && SECTS[l.sect!] && (SECTS[l.sect!].tier === 4 || /Sơn/.test(l.n))).flatMap((l) => {
      const big = l.id === 'batchu' ? 2.8 : l.id === 'tutieu' ? 2.2 : SECTS[l.sect!].tier === 4 ? 1.9 : 1.4;
      const [bx, by] = l.base ?? [l.x, l.y]; // dãy núi neo theo vị trí gốc để dựng lại nhiều lần vẫn ra cùng dãy
      return [[bx, by + 30, big, '*' + l.id], [bx - 150, by + 50, big * 0.6, l.id], [bx + 150, by + 50, big * 0.6, l.id]] as [number, number, number, string?][];
    }),
    // đảo: một dãy núi nhỏ (3 ngọn) ở đảo có hiểm địa / bí cảnh, không rải nhiều dãy
    ...L.filter((l) => l.island && !l.sea && (l.type === 'wild' || l.type === 'realm')).map((l) => [l.x + 10, l.y - 20, 0.7] as [number, number, number]),
    ...(Object.keys(LANDMASS) as Vuc[]).flatMap((v) => Array.from({ length: 6 }, (_, i) => {
      const m = LANDMASS[v];
      const a = hrand(GEO + 'mt' + v, i) * Math.PI * 2, f = 0.3 + hrand(GEO + 'mf' + v, i) * 0.5;
      return [m.x + Math.cos(a) * m.rx * f, m.y + Math.sin(a) * m.ry * f, 1.2 + hrand(GEO + 'ms' + v, i) * 0.5] as [number, number, number];
    })),
  ]);
  // từng ngọn núi: mỗi dãy 3–5 ngọn. Dãy của tông môn: ngọn giữa của entry chính là "núi gốc", được nâng thành ngọn cao nhất cả dãy
  // và dời cả dãy sao cho đỉnh núi gốc nằm đúng dưới ký hiệu thế lực (vị trí thế lực giữ nguyên). Cổng bí cảnh sẽ lên ngọn gần nhất.
  {
    const peaks: Peak[] = [];
    const rangeBase = new Map<string, [number, number]>(); // id tông môn → vị trí gốc (bx, by)
    MOUNTAINS.forEach(([x, y, sc, id], mi) => {
      const r = (k: number) => hrand(GEO + 'pk' + mi, k);
      const isRoot = !!id && id.startsWith('*');
      const sid = id ? id.replace(/^\*/, '') : undefined;
      if (isRoot) rangeBase.set(sid!, [x, y - 30]);
      const n = sc < 0.8 ? 3 : 3 + Math.floor(r(0) * 3);
      for (let i = 0; i < n; i++) {
        const mid = i === Math.floor(n / 2);
        const px = isRoot && mid ? x : x + (i - (n - 1) / 2) * 36 * sc + (r(1 + i * 4) - 0.5) * (sc < 0.8 ? 8 : 22);
        const h = (40 + r(2 + i * 4) * 34) * sc * (mid ? 1.3 : 1);
        const w = (36 + r(3 + i * 4) * 14) * sc;
        const py = isRoot && mid ? y : y + (r(4 + i * 4) - 0.5) * 24;
        peaks.push({ x: px, y: py, h, w, id: sid, root: isRoot && mid });
      }
    });
    // núi gốc cao nhất dãy, đỉnh trùng vị trí thế lực
    for (const [sid, [bx, by]] of rangeBase) {
      const range = peaks.filter((p) => p.id === sid);
      const root = range.find((p) => p.root);
      if (!root) continue;
      root.h = Math.max(...range.filter((p) => p !== root).map((p) => p.h)) * 1.25; // núi gốc cao hơn hẳn để đỉnh cổng thấp hơn rõ, chữ không đè
      root.w = Math.max(root.w, root.h * 0.42);
      const dy = (by - 6) - (root.y - root.h); // đỉnh núi gốc = by - 6 (ngay dưới ký hiệu)
      for (const p of range) p.y += dy;
      root.x = bx;
    }
    fill(PEAKS, peaks);
  }
}
/** Nhãn: [chữ, x, y, cỡ chữ]. */
// ================= 19 Châu =================
export interface Chau { id: string; n: string; vuc: Vuc; d: string }
export const CHAU: Record<string, Chau> = {
  trungchau: { id: 'trungchau', n: 'Trung Châu', vuc: 'trung', d: 'Lõi của Trung Vực, nơi tụ ba thánh địa. Linh khí dày tới mức phàm nhân hít thở cũng kéo dài tuổi thọ.' },
  thienchau: { id: 'thienchau', n: 'Thiên Châu', vuc: 'trung', d: 'Phía bắc Trung Vực, băng tuyết phủ nửa năm. Đất của Đại Chu Hoàng Triều và những dãy núi chống trời.' },
  lamchau: { id: 'lamchau', n: 'Lâm Châu', vuc: 'trung', d: 'Phía đông Trung Vực, rừng rậm và đồng bằng phì nhiêu. Đất của Đại Yên Hoàng Triều và tổ địa Diệp thị Hoang Cổ.' },
  kimchau: { id: 'kimchau', n: 'Kim Châu', vuc: 'trung', d: 'Phía tây Trung Vực, cát vàng và mỏ kim loại. Đất của Đại Ngụy Hoàng Triều và Huyền Nguyên Thánh Địa.' },
  hoangchau: { id: 'hoangchau', n: 'Hoàng Châu', vuc: 'trung', d: 'Phía nam Trung Vực, núi lửa còn sống và đất đỏ. Bất Chu Thánh Sơn đứng giữa, Thánh Đô và Cổ Chiến Trường nằm quanh.' },
  thanhchau: { id: 'thanhchau', n: 'Thanh Châu', vuc: 'dong', d: 'Phía bắc Đông Vực, núi xanh nối biển.' },
  vanchau: { id: 'vanchau', n: 'Vân Châu', vuc: 'dong', d: 'Giữa Đông Vực, sông hồ và sương mù quanh năm.' },
  giangchau: { id: 'giangchau', n: 'Giang Châu', vuc: 'dong', d: 'Phía nam Đông Vực, trăm sông đổ ra biển.' },
  luongchau: { id: 'luongchau', n: 'Lương Châu', vuc: 'tay', d: 'Phía bắc Tây Vực, thảo nguyên khô và núi lửa.' },
  sachau: { id: 'sachau', n: 'Sa Châu', vuc: 'tay', d: 'Giữa Tây Vực, biển cát mênh mông và ốc đảo.' },
  viemchau: { id: 'viemchau', n: 'Viêm Châu', vuc: 'tay', d: 'Phía nam Tây Vực, nóng như lò rèn.' },
  yeuchau: { id: 'yeuchau', n: 'Yêu Châu', vuc: 'nam', d: 'Phía tây Nam Vực, rừng nguyên thủy của yêu tộc.' },
  thuongchau: { id: 'thuongchau', n: 'Thương Châu', vuc: 'nam', d: 'Giữa Nam Vực, núi rừng trùng điệp.' },
  manchau: { id: 'manchau', n: 'Man Châu', vuc: 'nam', d: 'Phía đông Nam Vực, đất của người Man và cổ độc.' },
  tuyetchau: { id: 'tuyetchau', n: 'Tuyết Châu', vuc: 'bac', d: 'Phía tây Bắc Vực, tuyết phủ quanh năm.' },
  socchau: { id: 'socchau', n: 'Sóc Châu', vuc: 'bac', d: 'Giữa Bắc Vực, thảo nguyên và biên ải.' },
  hanchau: { id: 'hanchau', n: 'Hàn Châu', vuc: 'bac', d: 'Phía đông Bắc Vực, băng nguyên và cực quang.' },
};
export type ChauLand = Record<Exclude<Vuc, 'trung'>, [string, string, string]>;
let CHAU_LAND: ChauLand = {
  dong: ['thanhchau', 'vanchau', 'giangchau'], tay: ['luongchau', 'sachau', 'viemchau'], nam: ['yeuchau', 'thuongchau', 'manchau'], bac: ['tuyetchau', 'socchau', 'hanchau'],
};
/** Năm châu của Trung Vực: [lõi, bắc, nam, đông, tây]. Đảo không lập châu riêng — thuộc châu đất liền gần nhất. */
export type ChauMid = [string, string, string, string, string];
let CHAU_MID: ChauMid = ['trungchau', 'thienchau', 'hoangchau', 'lamchau', 'kimchau'];
function assignChau() {
  for (const l of L) {
    const v = vucOf(l);
    if (l.island) { l.chau = ''; continue; }
    if (v === 'trung') {
      // lõi: Hư Linh Tiên Sơn và vòng trong; còn lại chia bốn hướng theo đường chéo
      l.chau = CHAU_MID[l.reg === 'tienchau' ? 0 : trungQuad(l.x, l.y)];
      continue;
    }
    l.chau = '';
  }
  // đất liền vực ngoài: ba châu theo phạm vi cố định trên trục dài (không theo thứ tự địa điểm)
  for (const l of L) {
    const v = vucOf(l);
    if (l.island || v === 'trung') continue;
    l.chau = CHAU_LAND[v][bandOf(v, l.x, l.y)];
  }
  // đảo: thuộc châu của địa điểm đất liền gần nhất trong cùng vực (không lập châu riêng)
  const land = L.filter((l) => !l.island && l.chau);
  for (const l of L) {
    if (!l.island) continue;
    const v = vucOf(l);
    let best = '', bd = Infinity;
    for (const k of land) {
      if (vucOf(k) !== v) continue;
      const d = Math.hypot(k.x - l.x, k.y - l.y);
      if (d < bd) { bd = d; best = k.chau!; }
    }
    if (!best) for (const k of land) { const d = Math.hypot(k.x - l.x, k.y - l.y); if (d < bd) { bd = d; best = k.chau!; } }
    l.chau = best || CHAU_MID[0];
  }
}
/**
 * Mỗi châu phải có một triều đình chính (Trung Vực: Đại Hoàng Triều bậc 3; vực ngoài: Vương Triều bậc 2).
 * Châu nào có thành trì mà chưa có triều đình thì lập triều mới, kinh đô là thành chưa thuộc triều nào trong châu.
 * `pack` là bảng hoàng triều của giới đang nạp để triều mới còn lại khi nạp lại giới.
 */
export function ensureChauEmpires(pack?: Record<string, Empire>) {
  for (const c of Object.values(CHAU)) {
    const inChau = L.filter((l) => l.chau === c.id && !l.island);
    const has = Object.values(EMPIRES).some((e) => !e.vassal && LOCS[e.capital]?.chau === c.id) || inChau.some((l) => Object.values(EMPIRES).some((e) => !e.vassal && e.capital === l.id));
    if (has) continue;
    const towns = inChau.filter((l) => l.type === 'town' && !Object.values(EMPIRES).some((e) => e.capital === l.id)).sort((a, b) => b.qi - a.qi);
    const cap = towns[0];
    if (!cap) continue;
    const tier: 2 | 3 = c.vuc === 'trung' ? 3 : 2;
    const stem = cap.n.replace(/ (Thành|Trấn|Đô)$/, '');
    const id = 'emp_' + cap.id;
    const patron = inChau.filter((l) => l.type === 'sect' && SECTS[l.sect!]).sort((a, b) => SECTS[b.sect!].tier - SECTS[a.sect!].tier)[0]?.sect ?? null;
    const e: Empire = { id, n: `${stem} ${tier === 3 ? 'Hoàng Triều' : 'Vương Triều'}`, capital: cap.id, tier, ruler: tier === 3 ? 'Hoàng đế' : 'Quốc vương', patron, d: `Triều đình chính của ${c.n}, đóng đô ở ${cap.n}.${patron && SECTS[patron] ? ` Có ${SECTS[patron].n} hậu thuẫn.` : ''}` };
    EMPIRES[id] = e;
    if (pack) pack[id] = e;
  }
}
/** Tâm phạm vi của một châu — "vị trí đẹp nhất" châu, cũng là chỗ đặt nhãn. */
function chauCenter(c: Chau): [number, number] {
  const m = LANDMASS[c.vuc];
  let x = m.x, y = m.y;
  if (c.vuc === 'trung') {
    const q = CHAU_MID.indexOf(c.id);
    const R = 0.62;
    if (q === 1) y = m.y - m.ry * R;
    else if (q === 2) y = m.y + m.ry * R;
    else if (q === 3) x = m.x + m.rx * R;
    else if (q === 4) x = m.x - m.rx * R;
  } else {
    const i = CHAU_LAND[c.vuc].indexOf(c.id);
    const a = i < 0 ? 0 : (i - 1) * 0.64;
    if (c.vuc === 'dong' || c.vuc === 'tay') y = m.y + m.ry * a;
    else x = m.x + m.rx * a;
  }
  return [x, y];
}
/** Châu chứa một toạ độ đất liền (cùng hàm với ranh giới vẽ). */
function chauIdAt(v: Vuc, x: number, y: number): string {
  return v === 'trung' ? CHAU_MID[trungQuad(x, y)] : CHAU_LAND[v][bandOf(v, x, y)];
}
/** Sức mạnh thế lực tại một địa điểm: triều đình chủ châu > tông môn (theo bậc) > thành > phường thị > thôn > hiểm địa. */
function powerOf(l: Loc): number {
  const e = empireAt(l.id);
  let p = 0;
  if (e) p = e.vassal ? 36 + e.tier * 4 : 100 + e.tier * 10;
  if (l.type === 'sect') p = Math.max(p, 40 + (SECTS[l.sect!]?.tier || 1) * 12);
  else if (l.type === 'town') p = Math.max(p, 30);
  else if (l.type === 'market') p = Math.max(p, 24);
  else if (l.type === 'village') p = Math.max(p, 12);
  return p;
}
/** Địa điểm giữ nguyên chỗ: đảo, núi Sơn Hải Kinh, Hư Linh Tiên Sơn (vị trí đặc thù). */
const isFixedLoc = (l: Loc) => !!l.island || !!l.shj || !!l.river || !!l.gate || !!l.xy || !!l.near || !!l.formationTo || l.reg === 'tienchau';
/** Tông môn cần vị trí đặc thù ven biển → đặt sát bờ. */
const wantsCoast = (l: Loc) => l.type === 'sect' && /biển|sóng|hải|bờ đá|mỏm đá|san hô/i.test(l.d || '');
/**
 * Xếp lại thế lực trong từng châu theo sức mạnh.
 * 1) Mỗi châu đúng một triều đình chính: triều mạnh nhất trong châu làm chủ; châu thiếu thì lấy triều dư từ châu khác cùng vực;
 *    triều dư còn lại thành thuộc quốc (không vương miện).
 * 2) Trong châu, thế lực càng mạnh càng gần tâm châu; tông môn ven biển và hiểm địa ra rìa. Vị trí đảo, núi Sơn Hải Kinh, Hư Linh Tiên Sơn giữ nguyên.
 */
function arrangeByPower() {
  const MIN_D = 260; // bằng khoảng giãn tối thiểu của layout
  const STEP = 80;
  const force = new Map<string, string>(); // locId → châu bắt buộc (triều được điều sang châu thiếu)
  // ---- 1) một châu một triều ----
  for (const v of Object.keys(LANDMASS) as Vuc[]) {
    const chauIds: string[] = v === 'trung' ? [...CHAU_MID] : (() => { const c = CHAU_LAND[v]; return [c[1], c[0], c[2]]; })(); // ưu tiên châu giữa
    const emps = Object.values(EMPIRES)
      .filter((e) => LOCS[e.capital] && !LOCS[e.capital].island && vucOf(LOCS[e.capital]) === v)
      .sort((a, b) => b.tier - a.tier);
    const primary: Record<string, Empire> = {};
    const extras: Empire[] = [];
    for (const e of emps) { const cid = LOCS[e.capital].chau || ''; if (!primary[cid]) primary[cid] = e; else extras.push(e); }
    for (const cid of chauIds) { if (!primary[cid] && extras.length) { const e = extras.shift()!; primary[cid] = e; force.set(e.capital, cid); } }
    for (const e of emps) delete e.vassal;
    for (const e of extras) { const host = primary[LOCS[e.capital].chau || '']; if (host) e.vassal = host.id; }
  }
  // ---- 2) xếp trong châu ----
  const fixed = L.filter(isFixedLoc);
  const placed: Loc[] = [...fixed];
  const farEnough = (x: number, y: number, d: number) => placed.every((o) => Math.hypot(o.x - x, o.y - y) >= d);
  for (const c of Object.values(CHAU)) {
    const m = LANDMASS[c.vuc];
    const [cx, cy] = chauCenter(c);
    const members = L.filter((l) => !isFixedLoc(l) && vucOf(l) === c.vuc && (force.get(l.id) ?? l.chau) === c.id);
    if (!members.length) continue;
    // ứng viên: lưới điểm trong lục địa thuộc châu này, kèm bán kính chuẩn hoá f
    const cands: { x: number; y: number; f: number; d: number; used: boolean }[] = [];
    for (let x = m.x - m.rx; x <= m.x + m.rx; x += STEP) for (let y = m.y - m.ry; y <= m.y + m.ry; y += STEP) {
      const nx = (x - m.x) / m.rx, ny = (y - m.y) / m.ry, f = Math.hypot(nx, ny);
      if (f > 0.9 || chauIdAt(c.vuc, x, y) !== c.id) continue;
      cands.push({ x, y, f, d: Math.hypot(x - cx, y - cy), used: false });
    }
    cands.sort((a, b) => a.d - b.d);
    const rank = (l: Loc) => (l.type === 'wild' || l.type === 'realm' ? -1 : wantsCoast(l) ? -0.5 : powerOf(l));
    const order = members.slice().sort((a, b) => rank(b) - rank(a) || L.indexOf(a) - L.indexOf(b));
    for (const l of order) {
      const coast = wantsCoast(l) || l.type === 'wild' || l.type === 'realm';
      const pool = coast ? cands.slice().sort((a, b) => b.f - a.f) : cands;
      let pick: typeof cands[number] | undefined;
      for (const d of [MIN_D, MIN_D * 0.85, MIN_D * 0.7, MIN_D * 0.5]) { pick = pool.find((q) => !q.used && farEnough(q.x, q.y, d)); if (pick) break; }
      if (!pick) pick = pool.find((q) => !q.used);
      if (!pick) continue;
      pick.used = true;
      l.x = pick.x + (hrand(l.id, 31) - 0.5) * STEP * 0.6;
      l.y = pick.y + (hrand(l.id, 32) - 0.5) * STEP * 0.6;
      placed.push(l);
    }
  }
}
export const chauOf = (l: Loc) => CHAU[l.chau || CHAU_MID[0]] || Object.values(CHAU)[0];
/** "Trung Vực · Trung Châu" */
export const whereOf = (l: Loc) => `${VUC[chauOf(l).vuc].n} · ${chauOf(l).n}`;
/** Triều đình của một địa điểm phàm trần: kinh đô thì là triều ấy; thành trấn thôn khác thuộc triều đình chính của châu (không tính thuộc quốc). */
export function ownerEmpire(l: Loc): { e: Empire; capital: boolean } | null {
  if (l.patronSect) return null;
  const cap = empireAt(l.id);
  if (cap) return { e: cap, capital: true };
  if (l.ownerEmp && EMPIRES[l.ownerEmp]) return { e: EMPIRES[l.ownerEmp], capital: false };
  if (l.type !== 'town' && l.type !== 'market' && l.type !== 'village') return null;
  const e = Object.values(EMPIRES).find((x) => !x.vassal && LOCS[x.capital]?.chau === l.chau);
  return e ? { e, capital: false } : null;
}
/** "Kinh đô Đại Chu Hoàng Triều" / "thuộc Đại Chu Hoàng Triều" / '' */
export function ownerTxt(l: Loc): string {
  if (l.patronSect && SECTS[l.patronSect]) return `trực thuộc ${SECTS[l.patronSect].n}`;
  const o = ownerEmpire(l);
  if (!o) return '';
  if (!o.capital) return `thuộc ${o.e.n}`;
  const host = o.e.vassal ? EMPIRES[o.e.vassal] : null;
  return `Kinh đô ${o.e.n}${host ? `, thuộc quốc của ${host.n}` : ''}`;
}

let SEAS: [string, string, string, string] = ['ĐÔNG HẢI', 'NAM HẢI', 'TÂY HẢI', 'BẮC HẢI'];
export const REGION_LABELS: [string, number, number, number][] = [];
function buildLabels() {
  fill(REGION_LABELS, [
    ...(['trung', 'dong', 'nam', 'tay', 'bac'] as const).map((v) => [VUC[v].n.toUpperCase(), LANDMASS[v].x, LANDMASS[v].y - LANDMASS[v].ry * 0.93 + 60, 110] as [string, number, number, number]),
    [SEAS[0], CX + 4400, CY - 2500, 70], [SEAS[1], CX - 900, CY + 3300, 70], [SEAS[2], CX - 4400, CY - 2300, 70], [SEAS[3], CX, CY - 3900, 70],
    ...Object.values(CHAU).map((c) => {
      const [x, y] = chauCenter(c);
      const sz = c.vuc === 'trung' && CHAU_MID.indexOf(c.id) <= 0 ? 90 : 72;
      return [c.n.toUpperCase(), x, y + 40, sz] as [string, number, number, number];
    }),
  ]);
  buildChauBorders();
  fill(RIVER_LABELS, RIVERS.map((pts, i) => {
    const mid = Math.floor(pts.length / 2);
    const a = pts[mid - 1], b = pts[mid + 1], m = pts[mid];
    return [RIVER_NAMES[i] || '', m[0], m[1] - (RIVER_MAJOR[i] ? 26 : 18), Math.atan2(b[1] - a[1], b[0] - a[0])] as [string, number, number, number];
  }));
}
function buildChauBorders() {
  const out: [number, number][][] = [];
  const EXT = 1.1; // vượt mép bầu dục một chút, bản đồ sẽ cắt theo bờ đất liền
  for (const v of ['dong', 'tay', 'nam', 'bac'] as const) {
    const m = LANDMASS[v];
    const tall = v === 'dong' || v === 'tay';
    for (const i of [0, 1] as const) {
      const pts: [number, number][] = [];
      for (let s = 0; s <= 140; s++) {
        const u = -EXT + (2 * EXT * s) / 140;
        const along = splitAt(v, i, u);
        pts.push(tall ? [m.x + u * m.rx, m.y + along * m.ry] : [m.x + along * m.rx, m.y + u * m.ry]);
      }
      out.push(pts);
    }
  }
  const m = LANDMASS.trung;
  // đa giác lõi nối bốn đầu trong của đường chéo → bốn châu rìa khép kín, ô giữa là Trung Châu
  const core = corePoly().map(([nx, ny]) => [m.x + nx * m.rx, m.y + ny * m.ry] as [number, number]);
  out.push([...core, core[0]]);
  for (const k of [0, 1, 2, 3] as const) {
    const pts: [number, number][] = [];
    const f0 = TRUNG_CORE;
    for (let s = 0; s <= 96; s++) {
      const f = f0 + ((EXT - f0) * s) / 96;
      const th = diagAt(k, f) * DEG;
      pts.push([m.x + Math.cos(th) * m.rx * f, m.y + Math.sin(th) * m.ry * f]);
    }
    out.push(pts);
  }
  fill(CHAU_BORDERS, out);
}
assignChau();
ensureChauEmpires();
arrangeByPower();
assignChau();
buildGeo();
placeSpecial();
assignChau();
buildLabels();

// ================= Nhiều giới: mỗi giới một bản đồ, tông môn, yêu thú riêng =================
export interface WorldPack {
  vuc: Record<Vuc, { n: string; d: string }>;
  landmass: Record<Vuc, { x: number; y: number; rx: number; ry: number }>;
  regions: Record<string, Region>;
  chau: Record<string, Chau>;
  chauMid: ChauMid;
  chauLand: ChauLand;
  seas: [string, string, string, string];
  /** Tên sông theo thứ tự RIVERS. */
  rivers: string[];
  /** Số sông / sông lớn mỗi vực của giới này (mặc định RIVER_N0 / RIVER_MAJOR_N0). */
  riverN?: Record<Vuc, number>;
  riverMajorN?: Record<Vuc, number>;
  /** Dòng chảy đặt tay cho sông nhỏ: tên sông → điểm [vực, nx, ny]. */
  riverPaths?: Record<string, [Vuc, number, number][]>;
  locs: Loc[];
  sects: Record<string, Sect>;
  empires: Record<string, Empire>;
  beasts: Beast[];
  geo: string;
  laid?: boolean;
}
const PACKS: WorldPack[] = [{
  vuc: Object.fromEntries(Object.entries(VUC).map(([k, v]) => [k, { n: v.n, d: v.d }])) as WorldPack['vuc'],
  landmass: JSON.parse(JSON.stringify(LANDMASS)),
  regions: { ...REGIONS }, chau: { ...CHAU }, chauMid: CHAU_MID, chauLand: CHAU_LAND, seas: SEAS, rivers: RIVERS0,
  locs: L.slice(), sects: { ...SECTS }, empires: { ...EMPIRES }, beasts: BEASTS.slice(), geo: '', laid: true,
}];
export const registerWorld = (w: number, p: WorldPack) => { PACKS[w] = p; };
/** Gói dữ liệu của một giới bất kỳ (không cần nạp giới đó) — Thiên Cơ Lâu đọc tông môn Hỗn Độn từ Thương Lan. */
export const worldPack = (w: number): WorldPack => PACKS[w] || PACKS[0];
const BASE_CHU = SECT_TIER_INFO.map((x) => x.chu);
const BASE_TOP = SECT_TOP.slice();
const BASE_GUARD = EMPIRE_GUARD.slice();
let curWorld = 0;
/** Tăng mỗi lần đổi giới — bản đồ dựa vào đây để vẽ lại nền. */
export let worldVer = 0;
const swap = <T extends object>(t: T, src: T) => { for (const k of Object.keys(t)) delete (t as Record<string, unknown>)[k]; Object.assign(t, src); };
/** Nạp giới w vào các bảng dùng chung (địa điểm, tông môn, vùng, yêu thú, địa hình). */
export function applyWorld(w: number) {
  const p = PACKS[w] || PACKS[0];
  if (w === curWorld && worldVer > 0) return;
  curWorld = w;
  worldVer++;
  for (const k of Object.keys(VUC) as Vuc[]) { VUC[k].n = p.vuc[k].n; VUC[k].d = p.vuc[k].d; }
  for (const k of Object.keys(LANDMASS) as Vuc[]) Object.assign(LANDMASS[k], p.landmass[k]);
  TRUNG_R.rx = LANDMASS.trung.rx; TRUNG_R.ry = LANDMASS.trung.ry;
  swap(REGIONS, p.regions);
  swap(CHAU, p.chau);
  CHAU_MID = p.chauMid; CHAU_LAND = p.chauLand; SEAS = p.seas;
  fill(RIVER_NAMES, p.rivers);
  Object.assign(RIVER_N, p.riverN ?? RIVER_N0);
  Object.assign(RIVER_MAJOR_N, p.riverMajorN ?? RIVER_MAJOR_N0);
  swap(RIVER_PATHS, p.riverPaths ?? {});
  fill(L, p.locs);
  swap(LOCS, Object.fromEntries(p.locs.map((l) => [l.id, l])));
  swap(SECTS, p.sects);
  swap(EMPIRES, p.empires);
  fill(BEASTS, p.beasts);
  GEO = p.geo;
  // trần cảnh giới của giới: tông môn, lão tổ, hộ quốc đều cao lên tương ứng
  const off = RMAX(w) - 9;
  SECT_TIER_INFO.forEach((x, i) => (x.chu = i ? BASE_CHU[i] + off : 0));
  SECT_TOP.forEach((_, i) => (SECT_TOP[i] = BASE_TOP[i] + off));
  EMPIRE_GUARD.forEach((_, i) => (EMPIRE_GUARD[i] = i ? BASE_GUARD[i] + off : 0));
  if (!p.laid) {
    layout();
    for (const l of L) if (l.pin && l.xy) [l.x, l.y] = l.xy; // địa danh ghim không bị bước giãn / đẩy đảo của layout làm lệch (các giới không ghim giữ nguyên cách xếp cũ)
    for (const l of L) if (l.type === 'town' && !l.island) l.port = true;
    assignChau();
    ensureChauEmpires(p.empires);
    arrangeByPower();
    assignChau();
    p.laid = true;
  }
  for (const l of L) if (l.xy) [l.x, l.y] = l.xy; // đảo và núi dựng theo đúng toạ độ ghim
  buildGeo();
  placeSpecial();
  assignChau();
  buildLabels();
}
