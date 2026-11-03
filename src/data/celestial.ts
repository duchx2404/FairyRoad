// Bốn thần giới ngoài trần thế, theo truyền thuyết Trung Hoa: Thiên Đình (Ngọc Hoàng), Địa Phủ (Phong Đô, Thập Điện),
// Yêu Giới (Yêu Hoàng, Thất Đại Thánh), Linh Sơn (Phật Tổ, Bồ Tát). Mỗi giới tu chân có bốn nơi này riêng: bản đồ và
// chức vụ giống nhau, người giữ chức khác nhau, trần thực lực tăng theo giới (giới cao chứa được sức mạnh lớn hơn).
// Chức vụ là chức vụ; Hồng Hoang dùng tên trong truyền thuyết, các giới thấp có người đương nhiệm riêng.
import { REALMS, npcCap, DAO_HAO, DAO_HAO_F, MALE, FEM, WORLDS, LAST_WORLD, splitName } from './core';
import { seeded, hashStr } from '../core/util';
import { nameKey, uniquePersonalName } from '../core/names';
import { s } from '../engine/state';

export type CelestialId = 'thiendinh' | 'diaphu' | 'yeugioi' | 'linhson';
export interface CPlace { id: string; n: string; x: number; y: number; d: string }
/** tier: 0 = đứng đầu (ở trần thực lực của giới), mỗi bậc thấp hơn một đại cảnh giới. f: chức vụ nữ. */
export interface COffice { title: string; holder: string; place: string; tier: number; d: string; f?: boolean }
export interface CRealm { id: CelestialId; n: string; kind: string; gateN: string; gateD: string; intro: string; bg: string; line: string; places: CPlace[]; offices: COffice[] }

export const CELESTIAL: Record<CelestialId, CRealm> = {
  thiendinh: {
    id: 'thiendinh', n: 'Thiên Đình', kind: 'Thiên giới', gateN: 'Nam Thiên Môn Chi Lộ', bg: 'radial-gradient(ellipse at 50% 30%, #4a4f7a 0%, #262a4a 60%, #15172e 100%)', line: '#c9a23a',
    gateD: 'Bậc mây tía sau lưng Tử Tiêu Tiên Cung, chỉ cung chủ và người được Vân Tiêu Tiên Tử dẫn mới đi lên được. Hết chín vạn bậc là Nam Thiên Môn.',
    intro: 'Thiên Đình ngự trên chín tầng trời, Ngọc Hoàng Đại Đế thống lĩnh tam giới. Tiên chức là chức, không phải tên: ai giữ Nam Thiên Môn thì là Nam Thiên Môn thủ tướng, bất kể là người nào. Long Vương bốn biển và các sông đều nhận tiên chức của Thiên Đình.',
    places: [
      { id: 'namthienmon', n: 'Nam Thiên Môn', x: 10, y: 60, d: 'Cổng chính của Thiên Đình, Tứ Đại Thiên Vương thay nhau trấn giữ. Người trần đi lên đều phải qua đây.' },
      { id: 'linhtieu', n: 'Lăng Tiêu Bảo Điện', x: 50, y: 24, d: 'Điện chầu của Ngọc Hoàng. Mỗi sớm thần tiên tam giới tới triều kiến, Thái Bạch Kim Tinh xướng tấu.' },
      { id: 'daotri', n: 'Dao Trì', x: 72, y: 46, d: 'Hồ ngọc của Vương Mẫu, bàn đào ba ngàn năm một lần chín. Hội Bàn Đào mở ở đây.' },
      { id: 'dausuat', n: 'Đâu Suất Cung', x: 30, y: 30, d: 'Cung của Thái Thượng Lão Quân, lò Bát Quái luyện tiên đan ngày đêm không tắt.' },
      { id: 'quanghan', n: 'Quảng Hàn Cung', x: 88, y: 20, d: 'Cung trên mặt trăng, cây quế, thỏ ngọc và một mùa thu không bao giờ hết.' },
      { id: 'thienha', n: 'Thiên Hà Thủy Quân Doanh', x: 34, y: 76, d: 'Doanh trại tám vạn thủy binh trên sông Ngân, canh giữ biên giới Thiên Đình với Yêu Giới.' },
      { id: 'tuhai', n: 'Tứ Hải Long Cung Phủ', x: 66, y: 80, d: 'Nha môn quản Long tộc hạ giới: Long Vương bốn biển và các sông nhận tiên chức, nộp sổ mưa gió ở đây.' },
    ],
    offices: [
      { title: 'Ngọc Hoàng Đại Đế', holder: 'Trương Bách Nhẫn', place: 'linhtieu', tier: 0, d: 'Chí tôn tam giới, mọi tiên chức đều do ngài sắc phong.' },
      { title: 'Vương Mẫu Nương Nương', holder: 'Dương Hồi', place: 'daotri', tier: 0, f: true, d: 'Chủ Dao Trì, nắm bàn đào và quyền phong thưởng nữ tiên.' },
      { title: 'Thái Thượng Lão Quân', holder: 'Lão Tử', place: 'dausuat', tier: 0, d: 'Đạo tổ, giữ lò Bát Quái. Tiên đan cửu chuyển ra từ tay ngài.' },
      { title: 'Nam Cực Trường Sinh Đại Đế', holder: 'Bành Tổ', place: 'linhtieu', tier: 1, d: 'Coi sổ thọ của chư tiên và người có công.' },
      { title: 'Nhị Lang Hiển Thánh Chân Quân', holder: 'Dương Tiễn', place: 'namthienmon', tier: 1, d: 'Thính điều bất thính tuyên: chỉ ra tay khi Thiên Đình có đại họa.' },
      { title: 'Thác Tháp Lý Thiên Vương', holder: 'Lý Tĩnh', place: 'linhtieu', tier: 1, d: 'Tổng binh thiên binh thiên tướng, tay nâng Linh Lung Bảo Tháp.' },
      { title: 'Vân Tiêu Tiên Tử', holder: 'Vân Tiêu', place: 'namthienmon', tier: 1, f: true, d: 'Tiên chức giữ con đường giữa trần giới và Nam Thiên Môn, dẫn người có duyên lên trời.' },
      { title: 'Thái Bạch Kim Tinh', holder: 'Lý Trường Canh', place: 'linhtieu', tier: 2, d: 'Sứ giả của Ngọc Hoàng, chuyên xuống hạ giới chiêu an.' },
      { title: 'Tam Đàn Hải Hội Đại Thần', holder: 'Na Tra', place: 'namthienmon', tier: 2, d: 'Ba đầu sáu tay, phong hỏa luân, hỗn thiên lăng. Tiên phong của thiên binh.' },
      { title: 'Thiên Bồng Nguyên Soái', holder: 'Trư Cương Liệp', place: 'thienha', tier: 2, d: 'Thống lĩnh tám vạn thủy binh Thiên Hà.' },
      { title: 'Thái Âm Tinh Quân', holder: 'Hằng Nga', place: 'quanghan', tier: 2, f: true, d: 'Chủ Quảng Hàn Cung, quản trăng và thủy triều.' },
      { title: 'Nguyệt Cung Thủ Dược Thần Thú', holder: 'Thái Âm Ngọc Thố', place: 'quanghan', tier: 3, d: 'Sủng vật ngự tiền của Hằng Nga Tiên Tử, ngày đêm giã tiên dược trường sinh dưới gốc Nguyệt Quế.' },
      { title: 'Trì Quốc Thiên Vương', holder: 'Ma Lễ Hải', place: 'namthienmon', tier: 2, d: 'Một trong Tứ Đại Thiên Vương, ôm tỳ bà, gảy một tiếng gió lửa nổi lên.' },
      { title: 'Tăng Trưởng Thiên Vương', holder: 'Ma Lễ Thanh', place: 'namthienmon', tier: 2, d: 'Cầm Thanh Vân Kiếm, canh cửa nam.' },
      { title: 'Quảng Mục Thiên Vương', holder: 'Ma Lễ Hồng', place: 'namthienmon', tier: 2, d: 'Cầm Hỗn Nguyên Tán, mở ra là trời đất tối sầm.' },
      { title: 'Đa Văn Thiên Vương', holder: 'Ma Lễ Thọ', place: 'namthienmon', tier: 2, d: 'Cầm Hoa Hồ Điêu, nghe thấu mọi lời trong tam giới.' },
      { title: 'Quyển Liêm Đại Tướng', holder: 'Sa Hối', place: 'linhtieu', tier: 3, d: 'Hầu bên ngai Ngọc Hoàng, cuốn rèm khi lâm triều.' },
      { title: 'Tứ Hải Long Cung Phủ Chủ Bộ', holder: 'Hà Chấp Bút', place: 'tuhai', tier: 3, d: 'Giữ sổ mưa gió, ghi lễ cống của Long tộc hạ giới.' },
    ],
  },
  diaphu: {
    id: 'diaphu', n: 'Địa Phủ', kind: 'Âm ty', gateN: 'Hoàng Tuyền Quỷ Môn', bg: 'radial-gradient(ellipse at 50% 40%, #2b2434 0%, #171320 70%, #0e0b14 100%)', line: '#7a3a3a',
    gateD: 'Khe nứt sau lưng Cửu U Minh Phủ, gió lạnh thổi ngược từ dưới lên, hoa bỉ ngạn mọc quanh miệng khe. Đi xuống hết bậc đá là Quỷ Môn Quan của Địa Phủ.',
    intro: 'Địa Phủ nằm dưới Hoàng Tuyền. Người sống xuống được chỉ qua Hoàng Tuyền Quỷ Môn, và chỉ Kết Đan trở lên mới giữ được hồn phách khi qua Quỷ Môn Quan. Phong Đô Đại Đế đứng đầu, Thập Điện Diêm La xử án, Phán Quan giữ sổ sinh tử.',
    places: [
      { id: 'quymon', n: 'Quỷ Môn Quan', x: 8, y: 50, d: 'Cửa ải đầu tiên dưới Hoàng Tuyền. Quỷ sai soát tên theo sổ.' },
      { id: 'hoangtuyen', n: 'Hoàng Tuyền Lộ', x: 22, y: 30, d: 'Con đường hai bên nở hoa bỉ ngạn đỏ như máu. Hồn đi trên đường này không được ngoảnh lại.' },
      { id: 'vonghuong', n: 'Vọng Hương Đài', x: 36, y: 62, d: 'Đài cao nhìn về quê nhà lần cuối.' },
      { id: 'tamsinh', n: 'Tam Sinh Thạch', x: 48, y: 28, d: 'Tảng đá khắc ba kiếp của mỗi hồn. Người tu đạo cao đọc được kiếp trước của mình.' },
      { id: 'naiha', n: 'Nại Hà Kiều', x: 58, y: 52, d: 'Cầu qua sông Vong Xuyên. Thiện hồn đi tầng trên, ác hồn rơi xuống sông.' },
      { id: 'manhba', n: 'Mạnh Bà Đình', x: 66, y: 74, d: 'Một bát canh Mạnh Bà, quên hết ân oán một đời.' },
      { id: 'phongdo', n: 'Phong Đô Thành', x: 78, y: 36, d: 'Kinh đô âm ty. Thập Điện Diêm La mở công đường trong thành.' },
      { id: 'uongtu', n: 'Uổng Tử Thành', x: 84, y: 66, d: 'Thành giam hồn chết oan, chết yểu, chưa tới số.' },
      { id: 'luanhoi', n: 'Lục Đạo Luân Hồi Đài', x: 94, y: 48, d: 'Đài xoay sáu cửa: thiên, nhân, a tu la, súc sinh, ngạ quỷ, địa ngục.' },
    ],
    offices: [
      { title: 'Phong Đô Đại Đế', holder: 'Trương Hành', place: 'phongdo', tier: 0, d: 'Chúa tể âm ty, trên cả Thập Điện.' },
      { title: 'Đệ nhất điện · Tần Quảng Vương', holder: 'Tưởng Tử Văn', place: 'phongdo', tier: 1, d: 'Giữ sổ sinh tử, xét hồn mới tới.' },
      { title: 'Đệ nhị điện · Sở Giang Vương', holder: 'Lệ Ôn', place: 'phongdo', tier: 1, d: 'Coi Hoạt Đại Địa Ngục.' },
      { title: 'Đệ tam điện · Tống Đế Vương', holder: 'Dư Đạo Nguyên', place: 'phongdo', tier: 1, d: 'Coi Hắc Thằng Đại Địa Ngục, xử kẻ bất trung bất hiếu.' },
      { title: 'Đệ tứ điện · Ngũ Quan Vương', holder: 'Lữ Thừa Đức', place: 'phongdo', tier: 1, d: 'Coi Hợp Đại Địa Ngục, xử kẻ gian lận quỵt nợ.' },
      { title: 'Đệ ngũ điện · Diêm La Vương', holder: 'Bao Chửng', place: 'phongdo', tier: 1, d: 'Vì quá thương người chết oan mà bị giáng từ điện nhất xuống điện năm. Coi Khiếu Hoán Đại Địa Ngục.' },
      { title: 'Đệ lục điện · Biện Thành Vương', holder: 'Tất Nguyên Tân', place: 'phongdo', tier: 1, d: 'Xử kẻ oán trời trách đất, bất kính thần minh.' },
      { title: 'Đệ thất điện · Thái Sơn Vương', holder: 'Đổng Hoằng', place: 'phongdo', tier: 1, d: 'Xử kẻ đào mộ, bán người.' },
      { title: 'Đệ bát điện · Đô Thị Vương', holder: 'Hoàng Vạn Sơn', place: 'phongdo', tier: 1, d: 'Xử kẻ bất hiếu với cha mẹ.' },
      { title: 'Đệ cửu điện · Bình Đẳng Vương', holder: 'Lục Trọng Dân', place: 'phongdo', tier: 1, d: 'Coi A Tỳ Địa Ngục, tội không thể tha.' },
      { title: 'Đệ thập điện · Chuyển Luân Vương', holder: 'Tiết Lễ', place: 'luanhoi', tier: 1, d: 'Định hồn vào đạo nào trong sáu đạo.' },
      { title: 'Chưởng Án Phán Quan', holder: 'Thôi Giác', place: 'phongdo', tier: 2, d: 'Giữ bút son và Sinh Tử Bộ. Một nét bút, dương gian có người tắt thở.' },
      { title: 'Thưởng Thiện Ty Phán Quan', holder: 'Ngụy Trưng', place: 'phongdo', tier: 2, d: 'Ghi công đức.' },
      { title: 'Phạt Ác Ty Phán Quan', holder: 'Chung Quỳ', place: 'phongdo', tier: 2, d: 'Trảm tà trừ quỷ.' },
      { title: 'Hắc Vô Thường', holder: 'Phạm Vô Cứu', place: 'quymon', tier: 3, d: 'Câu hồn sứ giả áo đen, mũ ghi "Thiên hạ thái bình".' },
      { title: 'Bạch Vô Thường', holder: 'Tạ Tất An', place: 'quymon', tier: 3, d: 'Câu hồn sứ giả áo trắng, mũ ghi "Nhất kiến sinh tài".' },
      { title: 'Ngưu Đầu', holder: 'A Bàng', place: 'naiha', tier: 3, d: 'Đầu trâu thân người, áp giải hồn qua Nại Hà Kiều.' },
      { title: 'Mã Diện', holder: 'La Sát', place: 'naiha', tier: 3, d: 'Mặt ngựa thân người, bắt hồn bỏ trốn.' },
      { title: 'Mạnh Bà', holder: 'Mạnh Khương Nữ', place: 'manhba', tier: 3, f: true, d: 'Nấu canh quên lãng từ nước mắt một đời người.' },
      { title: 'Vọng Hương Đài Đài Chủ', holder: 'Tô Vong Ưu', place: 'vonghuong', tier: 4, f: true, d: 'Cho hồn nhìn về nhà đúng một khắc rồi thúc đi.' },
      { title: 'Tam Sinh Thạch Thủ Thạch Nhân', holder: 'Thạch Vô Ngôn', place: 'tamsinh', tier: 4, d: 'Canh đá, không nói.' },
      { title: 'Uổng Tử Thành Thành Chủ', holder: 'Oán Thập Tam', place: 'uongtu', tier: 4, d: 'Hồn chết oan lâu nhất thành, được phong làm chủ để trấn oán khí.' },
      { title: 'Hoàng Tuyền Lộ Dẫn Hồn Sứ', holder: 'Bỉ Ngạn', place: 'hoangtuyen', tier: 5, f: true, d: 'Dẫn hồn đi hết con đường hoa đỏ.' },
      { title: 'Quỷ Môn Quan Thủ Quan', holder: 'Giải Thiết Tâm', place: 'quymon', tier: 5, d: 'Hồn không có tên không được vào, hồn có tên không được ra.' },
    ],
  },
  yeugioi: {
    id: 'yeugioi', n: 'Yêu Giới', kind: 'Yêu giới', gateN: 'Vạn Yêu Cổ Môn', bg: 'radial-gradient(ellipse at 50% 40%, #3a4a2c 0%, #1f2a18 65%, #121a0e 100%)', line: '#8a6a2a',
    gateD: 'Cổng đá khổng lồ khắc vạn hình thú sau điện Yêu Hoàng của Vạn Yêu Thánh Đình. Chỉ Yêu Hoàng mở được; người được ngài cho phép mới qua.',
    intro: 'Yêu Giới là đất của yêu tộc hóa hình đã bỏ trần giới mà lên. Yêu Hoàng ngự ở Yêu Hoàng Điện; Thất Đại Thánh mỗi người một ngọn núi. Đình chủ Vạn Yêu Thánh Đình hạ giới luôn kiêm chức Yêu Hoàng, nên thánh đình là cửa ngõ của Yêu Giới ở trần thế.',
    places: [
      { id: 'codmon', n: 'Vạn Yêu Cổ Môn', x: 8, y: 52, d: 'Cổng vào Yêu Giới, mở về phía Vạn Yêu Thánh Đình.' },
      { id: 'yeuhoang', n: 'Yêu Hoàng Điện', x: 50, y: 30, d: 'Điện trên ngai xương rồng, Yêu Hoàng hội chư vương.' },
      { id: 'hoaqua', n: 'Hoa Quả Sơn · Thủy Liêm Động', x: 84, y: 24, d: 'Phúc địa của hầu tộc, thác nước che cửa động.' },
      { id: 'tichloi', n: 'Tích Lôi Sơn · Ma Vân Động', x: 28, y: 22, d: 'Sào huyệt Ngưu Ma Vương.' },
      { id: 'sudaa', n: 'Sư Đà Lĩnh', x: 70, y: 62, d: 'Ba yêu vương sư, tượng, bằng chiếm cả một dãy núi.' },
      { id: 'banty', n: 'Bàn Ty Động', x: 34, y: 72, d: 'Động của nhện tinh bảy chị em, tơ giăng kín rừng.' },
      { id: 'hacphong', n: 'Hắc Phong Sơn', x: 52, y: 84, d: 'Núi của hùng yêu áo đen, mê cà sa và kinh sách.' },
      { id: 'bachho', n: 'Bạch Hổ Lĩnh', x: 90, y: 72, d: 'Hang Bạch Cốt Phu Nhân, xương trắng chất thành đồi.' },
    ],
    offices: [
      { title: 'Yêu Hoàng', holder: 'Đế Tuấn', place: 'yeuhoang', tier: 0, d: 'Chức vụ luôn thuộc đình chủ Vạn Yêu Thánh Đình. Lệnh một tiếng, vạn yêu quy phục.' },
      { title: 'Yêu Hậu', holder: 'Thanh Khâu Cửu Nương', place: 'yeuhoang', tier: 1, f: true, d: 'Hồ tộc, nắm lễ nghi và tình báo của Yêu Giới.' },
      { title: 'Bình Thiên Đại Thánh · Ngưu Ma Vương', holder: 'Ngưu Cương', place: 'tichloi', tier: 1, d: 'Đứng đầu Thất Đại Thánh, hỗn thiết côn nặng vạn cân.' },
      { title: 'Phúc Hải Đại Thánh · Giao Ma Vương', holder: 'Giao Hồng', place: 'sudaa', tier: 1, d: 'Giao long thành yêu, quản thủy tộc Yêu Giới.' },
      { title: 'Hỗn Thiên Đại Thánh · Bằng Ma Vương', holder: 'Bằng Vân Trình', place: 'sudaa', tier: 1, d: 'Một cánh chín vạn dặm.' },
      { title: 'Di Sơn Đại Thánh · Sư Đà Vương', holder: 'Sư Hống', place: 'sudaa', tier: 1, d: 'Gầm một tiếng, núi dời.' },
      { title: 'Thông Phong Đại Thánh · Mi Hầu Vương', holder: 'Mi Linh', place: 'hoaqua', tier: 1, d: 'Nghe gió biết chuyện ngàn dặm.' },
      { title: 'Khu Thần Đại Thánh · Ngu Nhung Vương', holder: 'Ngu Cát', place: 'hoaqua', tier: 1, d: 'Đuổi được cả thần nhỏ của Thiên Đình.' },
      { title: 'Tề Thiên Đại Thánh · Mỹ Hầu Vương', holder: 'Tôn Ngộ Không', place: 'hoaqua', tier: 1, d: 'Hầu vương Hoa Quả Sơn, từng đại náo Thiên Cung.' },
      { title: 'Cửu Vĩ Hồ Vương', holder: 'Đát Kỷ', place: 'yeuhoang', tier: 2, f: true, d: 'Thủ lĩnh hồ tộc, mê hoặc nhân tâm.' },
      { title: 'Thiết Phiến Công Chúa', holder: 'La Sát Nữ', place: 'tichloi', tier: 2, f: true, d: 'Chủ Ba Tiêu Phiến, một quạt dập lửa Hỏa Diệm Sơn.' },
      { title: 'Thánh Anh Đại Vương', holder: 'Hồng Hài Nhi', place: 'tichloi', tier: 2, d: 'Tam muội chân hỏa, không ai dập được.' },
      { title: 'Hắc Phong Đại Vương', holder: 'Hùng Bãi', place: 'hacphong', tier: 3, d: 'Hùng yêu áo đen, giỏi thương pháp.' },
      { title: 'Bạch Cốt Phu Nhân', holder: 'Bạch Cốt Tinh', place: 'bachho', tier: 3, f: true, d: 'Ba lần đổi hình, một bộ xương trắng.' },
      { title: 'Bàn Ty Động Chủ', holder: 'Chu Thất Nương', place: 'banty', tier: 3, f: true, d: 'Chị cả nhện tinh, tơ từ rốn giăng được cả rừng.' },
      { title: 'Ngọc Diện Công Chúa', holder: 'Ngọc Diện Hồ', place: 'tichloi', tier: 3, f: true, d: 'Hồ ly Tích Lôi Sơn, giàu có nhất Yêu Giới.' },
      { title: 'Cổ Môn Thủ Vệ Thống Lĩnh', holder: 'Thạch Giáp', place: 'codmon', tier: 4, d: 'Thạch hầu thủ cổng, kiểm tra yêu khí kẻ ra vào.' },
    ],
  },
  linhson: {
    id: 'linhson', n: 'Linh Sơn', kind: 'Phật sơn', gateN: 'Linh Sơn Phật Quang Lộ', bg: 'radial-gradient(ellipse at 50% 30%, #6a5a3a 0%, #3d3322 60%, #241e14 100%)', line: '#d8b25a',
    gateD: 'Cột Phật quang sau Đại Hùng Bảo Điện của Linh Sơn Tự. Phương trượng là một vị Phật Đà, chỉ người có tuệ căn mới được ngài độ lên Linh Sơn.',
    intro: 'Linh Sơn ở Tây Thiên, Phật Tổ Như Lai thuyết pháp tại Đại Lôi Âm Tự. Chư Phật, Bồ Tát, La Hán, Kim Cương mỗi vị một đạo tràng. Phương trượng Linh Sơn Tự ở trần giới luôn là một Phật Đà của Linh Sơn.',
    places: [
      { id: 'sonmon', n: 'Linh Sơn Sơn Môn', x: 8, y: 56, d: 'Cổng đá dưới chân núi, Kim Cương trấn giữ.' },
      { id: 'loiam', n: 'Đại Lôi Âm Tự · Đại Hùng Bảo Điện', x: 50, y: 24, d: 'Phật Tổ thuyết pháp, hoa sen rơi như mưa.' },
      { id: 'lacgia', n: 'Phổ Đà Lạc Già Sơn', x: 82, y: 50, d: 'Đạo tràng Quan Âm, biển Nam Hải vỗ dưới chân.' },
      { id: 'ngudai', n: 'Ngũ Đài Sơn', x: 26, y: 26, d: 'Đạo tràng Văn Thù, trí tuệ đệ nhất.' },
      { id: 'ngami', n: 'Nga Mi Sơn', x: 30, y: 76, d: 'Đạo tràng Phổ Hiền, voi trắng sáu ngà.' },
      { id: 'cuuhoa', n: 'Cửu Hoa Sơn', x: 68, y: 80, d: 'Đạo tràng Địa Tạng: "Địa ngục chưa trống, thề không thành Phật".' },
      { id: 'tangkinh', n: 'Tàng Kinh Các', x: 58, y: 54, d: 'Ba tạng kinh, A Nan Ca Diếp giữ chìa khóa.' },
    ],
    offices: [
      { title: 'Phật Tổ Như Lai', holder: 'Như Lai', place: 'loiam', tier: 0, d: 'Giáo chủ Linh Sơn, một bàn tay úp xuống là Ngũ Hành Sơn.' },
      { title: 'Nhiên Đăng Cổ Phật', holder: 'Nhiên Đăng', place: 'loiam', tier: 0, d: 'Phật quá khứ, thầy của Như Lai.' },
      { title: 'Di Lặc Tôn Phật', holder: 'A Dật Đa', place: 'loiam', tier: 0, d: 'Phật tương lai, bụng lớn cười lớn.' },
      { title: 'Phương Trượng Linh Sơn Tự · Phật Đà', holder: 'Giác Minh', place: 'sonmon', tier: 1, d: 'Phật Đà xuống trần giữ Linh Sơn Tự ở Tây Vực; chức phương trượng luôn do một vị Phật Đà của Linh Sơn đảm nhiệm.' },
      { title: 'Quan Thế Âm Bồ Tát', holder: 'Diệu Thiện', place: 'lacgia', tier: 1, f: true, d: 'Cứu khổ cứu nạn, tịnh bình dương liễu.' },
      { title: 'Văn Thù Sư Lợi Bồ Tát', holder: 'Mạn Thù', place: 'ngudai', tier: 1, d: 'Cưỡi sư tử xanh, cầm kiếm trí tuệ.' },
      { title: 'Phổ Hiền Bồ Tát', holder: 'Tam Mạn Đa', place: 'ngami', tier: 1, d: 'Cưỡi voi trắng sáu ngà, hạnh nguyện đệ nhất.' },
      { title: 'Địa Tạng Vương Bồ Tát', holder: 'Kim Kiều Giác', place: 'cuuhoa', tier: 1, d: 'Cầm tích trượng mở cửa địa ngục.' },
      { title: 'A Nan Tôn Giả', holder: 'A Nan Đà', place: 'tangkinh', tier: 2, d: 'Đa văn đệ nhất, giữ kinh.' },
      { title: 'Ca Diếp Tôn Giả', holder: 'Ma Ha Ca Diếp', place: 'tangkinh', tier: 2, d: 'Niêm hoa vi tiếu, truyền tâm ấn.' },
      { title: 'Vi Đà Hộ Pháp', holder: 'Vi Côn', place: 'sonmon', tier: 2, d: 'Kim cương xử trong tay, hộ pháp Linh Sơn.' },
      { title: 'Giáng Long La Hán', holder: 'Ca Diếp Ba', place: 'loiam', tier: 3, d: 'Hàng phục long vương, đứng đầu Thập Bát La Hán.' },
      { title: 'Phục Hổ La Hán', holder: 'Di Lặc Nhĩ', place: 'loiam', tier: 3, d: 'Thuần hổ dữ bằng cơm chay.' },
      { title: 'Tứ Đại Kim Cương Thủ Tọa', holder: 'Thanh Tịnh Huệ', place: 'sonmon', tier: 3, d: 'Dẫn đầu bốn Kim Cương giữ sơn môn.' },
      { title: 'Yết Đế', holder: 'Ngũ Phương Yết Đế Trưởng', place: 'sonmon', tier: 4, d: 'Thần tuần tra, báo tin về Linh Sơn.' },
      { title: 'Tàng Kinh Các Chấp Sự', holder: 'Huệ Tịnh', place: 'tangkinh', tier: 5, d: 'Quét bụi ba tạng kinh, đọc được là ngộ.' },
    ],
  },
};

const pk = <X,>(rnd: () => number, a: readonly X[]) => a[Math.floor(rnd() * a.length)];
const HONGHUANG_FIGURES = new Set([
  'Bàn Cổ', 'Lão Tử', 'Nguyên Thủy Thiên Tôn', 'Thông Thiên Giáo Chủ', 'Bồ Đề Tổ Sư', 'Nữ Oa', 'Phục Hy',
  'Đế Tuấn', 'Đông Hoàng Thái Nhất', 'Tôn Ngộ Không', 'Dương Tiễn', 'Na Tra', 'Như Lai', 'Nhiên Đăng',
  'Chuẩn Đề', 'Tiếp Dẫn', 'Hồng Quân Đạo Tổ', 'Trấn Nguyên Tử', 'Minh Hà Lão Tổ', 'Côn Bằng Lão Tổ',
  'Vân Tiêu', 'Quỳnh Tiêu', 'Bích Tiêu', 'Triệu Công Minh', 'Kim Linh Thánh Mẫu', 'Vô Đương Thánh Mẫu',
  'Quy Linh Thánh Mẫu', 'Đa Bảo Đạo Nhân', 'Thân Công Báo', 'Khương Tử Nha', 'Cơ Xương', 'Cơ Phát',
  'Văn Trọng', 'Hoàng Phi Hổ', 'Trụ Vương', 'Đát Kỷ', 'Phí Trọng', 'Vưu Hồn', 'Sùng Hầu Hổ',
  'Ngạc Sùng Vũ', 'Khương Hoàn Sở', 'Lý Tĩnh', 'Ân Thị', 'Kim Tra', 'Mộc Tra', 'Cơ Lôi Chấn (Đạo hiệu: Lôi Chấn Tử)', 'Hoàng Thiên Hóa', 'Dương Nhậm',
  'Đặng Thiền Ngọc', 'Thổ Tôn (Đạo hiệu: Thổ Hành Tôn)', 'Long Cát Công Chúa', 'Tỷ Can', 'Vân Trung Tử', 'Quảng Thành Tử',
  'Xích Tinh Tử', 'Thái Ất Chân Nhân', 'Ngọc Đỉnh Chân Nhân', 'Từ Hàng Đạo Nhân',
  'Văn Thù Quảng Pháp Thiên Tôn', 'Phổ Hiền Chân Nhân', 'Cụ Lưu Tôn', 'Hoàng Long Chân Nhân',
  'Đạo Hạnh Thiên Tôn', 'Thanh Hư Đạo Đức Chân Quân', 'Nam Cực Tiên Ông',
]);
/** Hồng Hoang dùng người trong truyền thuyết; chức vụ tương ứng ở giới thấp có người khác đảm nhận. */
export const hasCelestialRealms = (w: number) => w >= 0 && w < LAST_WORLD;
let holderNames: Map<string, string> | undefined;
function holderName(id: CelestialId, o: COffice, w: number, i: number): string {
  if (w === 4) return o.holder;
  if (!holderNames) {
    holderNames = new Map();
    const used = new Set([...HONGHUANG_FIGURES, ...Object.values(CELESTIAL).flatMap(realm => realm.offices.map(office => office.holder))].map(nameKey));
    for (let world = 0; world < 4; world++) for (const realm of Object.values(CELESTIAL)) {
      realm.offices.forEach((office, index) => {
        const key = `${realm.id}:${world}:${index}`;
        const surname = office.holder === 'Lão Tử' || office.holder === 'Na Tra' ? 'Lý' : splitName(office.holder).sur;
        const name = uniquePersonalName(office.f ? 'f' : 'm', surname, used, 'celestial:' + key);
        holderNames!.set(key, name);
        used.add(nameKey(name));
      });
    }
  }
  return holderNames.get(`${id}:${w}:${i}`)!;
}
function holderDaoHao(id: CelestialId, o: COffice, w: number, i: number): string | undefined {
  if (w === 4) return undefined;
  const rnd = seeded(hashStr(`celestial:${id}:${w}:${i}:${o.title}`));
  return o.f ? `${pk(rnd, DAO_HAO_F)} ${pk(rnd, ['Tiên Tử', 'Nguyên Quân', 'Thánh Mẫu'])}`
    : `${pk(rnd, DAO_HAO)} ${pk(rnd, ['Chân Quân', 'Tinh Quân', 'Đế Quân', 'Thiên Tôn'])}`;
}
/** Chức vụ thần giới tinh thông nghề luyện chế (theo truyền thuyết): lên bảng danh sư của Thiên Cơ Lâu. lv 3..8 như cấp nghề. */
export const CELESTIAL_CRAFT: Record<string, ['alch' | 'forge' | 'talis', number][]> = {
  'Thái Thượng Lão Quân': [['alch', 8], ['forge', 7]], // lò Bát Quái, tiên đan cửu chuyển, Kim Cang Trác
  'Vương Mẫu Nương Nương': [['alch', 6]], // bàn đào, tiên tửu
  'Thác Tháp Lý Thiên Vương': [['forge', 6]], // Linh Lung Bảo Tháp
  'Thái Bạch Kim Tinh': [['talis', 6]], // thánh chỉ, phù chiêu an
  'Chưởng Án Phán Quan': [['talis', 7]], // phán bút, sổ sinh tử
  'Phạt Ác Ty Phán Quan': [['talis', 6]], // Chung Quỳ trấn quỷ phù
  'Mạnh Bà': [['alch', 6]], // canh Mạnh Bà
  'Thiết Phiến Công Chúa': [['forge', 6]], // Ba Tiêu Phiến
  'Thánh Anh Đại Vương': [['alch', 5]], // Tam Muội Chân Hỏa
  'Phật Tổ Như Lai': [['talis', 8]], // Lục Tự Chân Ngôn, Phật ấn
  'Quan Thế Âm Bồ Tát': [['alch', 7]], // cam lộ tịnh bình
  'Tàng Kinh Các Chấp Sự': [['talis', 6]],
};
/** Trần thực lực của một thần giới ở giới w (= trần tu sĩ giới ấy). */
export const celestialTop = (w: number) => npcCap(w);
/** Cảnh giới của một chức vụ ở giới w: bậc 0 đứng ở trần, mỗi bậc thấp hơn một đại cảnh giới. */
export const officeRealm = (tier: number, w: number) => Math.max(1, celestialTop(w) - tier);
export interface COfficeView extends COffice {
  name: string;
  daoHao?: string;
  r: number;
  realm: string;
  isPlayer?: boolean;
}
/** Danh sách chức vụ kèm người đương nhiệm và cảnh giới cho giới w. */
export function celestialOffices(id: CelestialId, w: number): COfficeView[] {
  if (!hasCelestialRealms(w)) return [];
  return CELESTIAL[id].offices.map((o, i) => {
    const isPlayer = s?.flags?.celestialUsurped?.[`${id}:${o.title}`] === true;
    if (isPlayer) {
      return {
        ...o,
        holder: s.name,
        name: s.name,
        daoHao: 'Bá Chủ',
        r: s.r,
        realm: REALMS[s.r].n,
        isPlayer: true,
      };
    }
    const r = officeRealm(o.tier, w);
    return { ...o, name: holderName(id, o, w, i), daoHao: holderDaoHao(id, o, w, i), r, realm: REALMS[r].n, isPlayer: false };
  });
}
export const celestialWorldName = (id: CelestialId, w: number) => `${CELESTIAL[id].n} ${WORLDS[w]}`;

export const CELESTIAL_GATEWAY_SECTS: Record<string, CelestialId> = {
  tutieu: 'thiendinh',
  cuuu: 'diaphu',
  vanyeudinh: 'yeugioi',
  linhsontu: 'linhson',
};

export const CELESTIAL_PLACE_ARTS: Record<CelestialId, Record<string, string[]>> = {
  thiendinh: {
    namthienmon: ['cp:cp_td_ngungkhi', 'sk:sk_td_tienquang', 'fq:fq_td_nguphong'],
    linhtieu: ['cp:cp_td_linhtieu', 'sk:sk_td_linhtieuchuong', 'tp:tp_td_truongsinh', 'fq:fq_td_sucdia'],
    daotri: ['cp:cp_td_tuvi', 'tp:tp_td_thanhtam'],
    dausuat: ['cp:cp_td_dausuat', 'sk:sk_td_batquaihoa', 'tp:tp_td_vovi', 'fq:fq_td_tophuc'],
    quanghan: ['sk:sk_td_phongloi'],
    thienha: ['cp:cp_td_thienha', 'sk:sk_td_thienhathuy'],
    tuhai: [],
  },
  diaphu: {
    quymon: ['cp:cp_dp_hoangtuyen', 'sk:sk_dp_cauhon', 'fq:fq_dp_vonganh'],
    hoangtuyen: ['sk:sk_dp_bingan', 'tp:tp_dp_vonghuong'],
    vonghuong: ['tp:tp_dp_tamsinh'],
    tamsinh: ['cp:cp_dp_hanphach', 'fq:fq_dp_amduongnhan'],
    naiha: ['sk:sk_dp_vongxuyen'],
    manhba: [],
    phongdo: ['cp:cp_dp_phongdo', 'sk:sk_dp_phanbut', 'tp:tp_dp_bathu'],
    uongtu: ['cp:cp_dp_thapdien'],
    luanhoi: ['cp:cp_dp_luanhoi', 'sk:sk_dp_luanhoian', 'fq:fq_dp_hoaanh'],
  },
  yeugioi: {
    codmon: ['cp:cp_yg_yeukhi', 'sk:sk_yg_toicot', 'tp:tp_yg_cuongthu', 'fq:fq_yg_dondia'],
    yeuhoang: ['cp:cp_yg_yeuhoang', 'tp:tp_yg_batdiet', 'fq:fq_yg_thonthien'],
    hoaqua: ['cp:cp_yg_hoaqua', 'sk:sk_yg_hoaquagay', 'fq:fq_yg_candauvan'],
    tichloi: ['cp:cp_yg_tichloi', 'sk:sk_yg_tichloibong'],
    sudaa: ['sk:sk_yg_suda', 'tp:tp_yg_cuuvi'],
    banty: ['sk:sk_yg_banty'],
    hacphong: ['cp:cp_yg_hacphong'],
    bachho: [],
  },
  linhson: {
    sonmon: ['cp:cp_ls_toathien', 'sk:sk_ls_kimcuong', 'tp:tp_ls_minhtam'],
    loiam: ['cp:cp_ls_nhulai', 'sk:sk_ls_nhulaichuong', 'tp:tp_ls_nietban'],
    lacgia: ['cp:cp_ls_lacgia', 'sk:sk_ls_camlo', 'fq:fq_ls_lienhoa'],
    ngudai: ['cp:cp_ls_vanthu', 'sk:sk_ls_hanglong', 'fq:fq_ls_kimthan'],
    ngami: ['sk:sk_ls_batnha', 'tp:tp_ls_bodhi'],
    cuuhoa: ['cp:cp_ls_cuuhoa'],
    tangkinh: ['fq:fq_ls_thantuc'],
  },
};

