// Hệ thống Lãnh Thổ Yêu Thú (Beast Territories) & Quỷ Vực Lãnh Thổ (Ghost Domains).
// - Yêu thú: Ý thức lãnh thổ phân cấp theo loài (loài yếu không được xâm phạm loài mạnh).
//   Người chơi nhân tộc có thể đến săn bắt yêu thú lấy yêu đan/nguyên liệu hoặc thuần phục làm thú cưỡi (mount).
// - Cô hồn dã quỷ: Âm sát chi khí tụ tập thành lãnh thổ với trật tự tôn ti nghiêm ngặt:
//   Quỷ Vương > Quỷ Soái > Quỷ Tướng > Quỷ Binh > Quỷ Tốt > Dã Quỷ.
//   Người chơi có thể siêu độ, trừ ma đoạt phách hoặc khiêu chiến Quỷ Vương thu phục âm binh hộ pháp.

import { s } from './state';
import { REALMS, type El } from '../data/core';
import { CHANLINH, type ChanLinh } from '../data/spirit';
import { addItem, addGear, bagFree, itemName } from './char';
import { addLog } from './core';
import { mkGear } from '../data/items';
import { fight, mkFoe, type FoeSpec } from './combat';
import { fmt, ri, pick, ch, clamp } from '../core/util';

export interface BeastSpec {
  id: string;
  name: string;
  tier: number; // 1 (Ngoại vi) -> 4 (Hạch tâm cấm địa)
  realm: number; // Realm index 1..8
  el: El;
  desc: string;
  mountId?: string; // id trong CHANLINH nếu có thể thuần hóa làm thú cưỡi
  dropDan: string; // m:yeudan hoặc m:thaicoyaudan
  dropMat: string; // m:dayeu hoặc vảy/nanh
  preyIds?: string[]; // Các loài yếu hơn mà loài này xua đuổi/săn bắt
}

export interface BeastTerritory {
  locId: string;
  name: string;
  desc: string;
  dangerLevel: number;
  species: BeastSpec[];
}

export interface GhostRankSpec {
  rank: 'quytu' | 'quytot' | 'quybinh' | 'quytuong' | 'quysoai' | 'quyvuong';
  title: string;
  realm: number;
  desc: string;
  soulDrop: number; // Điểm âm đức / hồn tinh
}

export interface GhostDomain {
  locId: string;
  name: string;
  desc: string;
  yinAura: string; // Miêu tả âm sát chi khí
}

/** Danh sách Lãnh Thổ Yêu Thú tại các hiểm địa hoang dã */
export const BEAST_TERRITORIES: Record<string, BeastTerritory> = {
  thapvan: {
    locId: 'thapvan',
    name: 'Thập Vạn Đại Sơn · Vạn Thú Lĩnh',
    desc: 'Dãy núi điệp trùng vạn dặm, nơi quần cư của muôn vàn dị thú cổ xưa. Ranh giới lãnh thổ phân chia rõ rệt: loài yếu lẩn khuất rìa ngoài, cấm địa hạch tâm là vương thổ của thái cổ hung thú.',
    dangerLevel: 5,
    species: [
      {
        id: 'hoaly',
        name: 'Xích Hỏa Ly',
        tier: 1,
        realm: 1,
        el: 'hoa',
        desc: 'Mèo rừng lửa lanh lẹ tụ tập ở bìa rừng ngoại vi, thường bắt chuột linh thỏ.',
        mountId: 'hoaly',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'ngantho',
        name: 'Ngân Nguyệt Thỏ',
        tier: 1,
        realm: 1,
        el: 'quang',
        desc: 'Thỏ trắng gặm cỏ linh ở thung lũng thấp, cực kỳ nhút nhát, sợ hãi sói tuyết.',
        mountId: 'ngantho',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'phonglinhhoa',
        name: 'Phong Linh Hồ',
        tier: 2,
        realm: 2,
        el: 'phong',
        desc: 'Hồ ly ba đuôi cư ngụ tại sườn đồi đầy gió, kiểm soát lãnh địa không cho tiểu thú tới gần.',
        mountId: 'phonglinhhoa',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
        preyIds: ['hoaly', 'ngantho'],
      },
      {
        id: 'loiung',
        name: 'Kim Sí Lôi Ưng',
        tier: 3,
        realm: 4,
        el: 'loi',
        desc: 'Bá chủ vách đá cheo leo, sải cánh lượn quanh đỉnh núi, phóng sét xua tan loài yếu.',
        mountId: 'loiung',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
        preyIds: ['phonglinhhoa', 'hoaly'],
      },
      {
        id: 'hacky',
        name: 'U Minh Hắc Kỳ Lân',
        tier: 4,
        realm: 6,
        el: 'am',
        desc: 'Vương thú hạch tâm Thập Vạn Đại Sơn. Chỉ một tiếng gầm cũng khiến muôn thú trong bán kính trăm dặm quỳ rạp.',
        mountId: 'hacky',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['loiung', 'phonglinhhoa'],
      },
      {
        id: 'thanhnguu',
        name: 'Độc Giác Thanh Ngưu',
        tier: 3,
        realm: 5,
        el: 'kim',
        desc: 'Thanh ngưu sừng vàng mình đồng da sắt, lực húc kinh thiên động địa.',
        mountId: 'thanhnguu',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'lucnhimihau',
        name: 'Lục Nhĩ Mĩ Hầu',
        tier: 4,
        realm: 6,
        el: 'am',
        desc: 'Hỗn thế thần hầu sáu tai lắng nghe trời đất, biến hóa vô song trong rừng sâu.',
        mountId: 'lucnhimihau',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['thanhnguu'],
      },
      {
        id: 'tybadochac',
        name: 'Tỳ Bà Độc Hạt',
        tier: 2,
        realm: 4,
        el: 'hoa',
        desc: 'Bọ cạp độc đuôi châm Đảo Mã chích thủng kim thân tu sĩ.',
        mountId: 'tybadochac',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
    ],
  },
  bangnguyen: {
    locId: 'bangnguyen',
    name: 'Vạn Tái Băng Nguyên · Hàn Thú Lĩnh',
    desc: 'Băng tuyết ngút ngàn nghìn năm không tan, nơi các loài dã thú hàn tính lập nên ranh giới sinh tồn khắc nghiệt.',
    dangerLevel: 4,
    species: [
      {
        id: 'ngantho_b',
        name: 'Tuyết Thỏ Linh',
        tier: 1,
        realm: 1,
        el: 'bang',
        desc: 'Loài thỏ tuyết đào hang dưới tầng băng mỏng, chỉ dám kiếm ăn ban ngày.',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'tuyetlang',
        name: 'Cực Địa Tuyết Lang',
        tier: 2,
        realm: 3,
        el: 'bang',
        desc: 'Sói tuyết săn mồi theo bầy, phong tỏa toàn bộ thung lũng băng, tuyệt đối cấm thỏ và hồ ly xâm lấn.',
        mountId: 'tuyetlang',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
        preyIds: ['ngantho_b'],
      },
      {
        id: 'bangbaoxiong',
        name: 'Băng Bạo Hùng',
        tier: 3,
        realm: 5,
        el: 'bang',
        desc: 'Gấu khổng lồ ngự trị hang động băng hà, khí tức lạnh thấu xương xua đuổi mọi bầy sói.',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
        preyIds: ['tuyetlang'],
      },
      {
        id: 'ngoctho',
        name: 'Thái Âm Ngọc Thố',
        tier: 4,
        realm: 6,
        el: 'quang',
        desc: 'Thần thú Thỏ Ngọc Cung Trăng hạ phàm, ngưng tụ ánh trăng tuyết giã thuốc trường sinh, thân tỏa bạch ngọc thánh quang.',
        mountId: 'ngoctho',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['bangbaoxiong', 'tuyetlang'],
      },
      {
        id: 'tichtelam',
        name: 'Tịch Hàn Tam Đầu Tê',
        tier: 3,
        realm: 5,
        el: 'bang',
        desc: 'Tê ngưu băng hàn ba sừng da dày vạn trượng, ngự trị hồ băng giá.',
        mountId: 'tichtelam',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['bangbaoxiong'],
      },
    ],
  },
  daitrach: {
    locId: 'daitrach',
    name: 'Vạn Mộng Đại Trạch · Thủy Trạch Thú Cương',
    desc: 'Đầm lầy mịt mù sương độc, nơi giao tranh ngấm ngầm giữa thủy xà, huyền quy và giao long.',
    dangerLevel: 4,
    species: [
      {
        id: 'thanhxa',
        name: 'Thanh Linh Xà',
        tier: 1,
        realm: 1,
        el: 'moc',
        desc: 'Rắn lục ẩn mình dưới cỏ lau đầm lầy, chỉ dám săn ếch nhái và cá con.',
        mountId: 'thanhxa',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'huyenquy',
        name: 'Vạn Niên Huyền Quy',
        tier: 2,
        realm: 3,
        el: 'thuy',
        desc: 'Rùa khổng lồ ngự trên cồn cát, mai cứng như kim thạch, rắn lục không dám bén mảng.',
        mountId: 'huyenquy',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
        preyIds: ['thanhxa'],
      },
      {
        id: 'ngaclong',
        name: 'Hắc Thủy Cự Ngạc',
        tier: 3,
        realm: 5,
        el: 'thuy',
        desc: 'Ngư yêu cá sấu ngàn trượng cưỡi sóng vượt sông lớn, lưng rộng như chiến thuyền rồng (Tọa kỵ thủy hành).',
        mountId: 'ngaclong',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['thanhxa'],
      },
      {
        id: 'thanhgiao',
        name: 'Thanh Hải Thần Long',
        tier: 4,
        realm: 7,
        el: 'thuy',
        desc: 'Chân Long viễn cổ thân dài vạn trượng cưỡi mây đạp sóng tung hoành tứ hải (Tọa kỵ Thần cấp).',
        mountId: 'thanhgiao',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['ngaclong', 'bichgiao'],
      },
      {
        id: 'xichkhaomahau',
        name: 'Xích Khào Mã Hầu',
        tier: 4,
        realm: 6,
        el: 'thuy',
        desc: 'Hỗn thế thần hầu thông âm dương, hiểu thủy tính, khuấy động sóng thần đại trạch.',
        mountId: 'xichkhaomahau',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['bichgiao'],
      },
      {
        id: 'bichbacuudau',
        name: 'Bích Ba Cửu Đầu Điểu',
        tier: 3,
        realm: 5,
        el: 'thuy',
        desc: 'Dị điểu chín đầu khát máu lao xuống từ mây đen cắp nuốt cự giao.',
        mountId: 'bichbacuudau',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['bichgiao'],
      },
    ],
  },
  hoadiem: {
    locId: 'hoadiem',
    name: 'Hỏa Diễm Sơn · Hỏa Thú Quật',
    desc: 'Nham thạch cuồn cuộn, lửa trời đỏ rực. Loài thú hỏa hệ chia tầng địa nhiệt theo sức mạnh nội đan.',
    dangerLevel: 6,
    species: [
      {
        id: 'hoaly_h',
        name: 'Nham Hỏa Thử',
        tier: 1,
        realm: 2,
        el: 'hoa',
        desc: 'Chuột lửa sống ở lớp tro tàn ven núi.',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'hoakylan',
        name: 'Xích Viêm Hỏa Lân',
        tier: 3,
        realm: 5,
        el: 'hoa',
        desc: 'Lân thú phun lửa canh giữ mạch nham thạch trung tâm, cấm tiệt loài yếu.',
        mountId: 'hacky',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
        preyIds: ['hoaly_h'],
      },
      {
        id: 'chuoc',
        name: 'Chu Tước Ấu Điểu',
        tier: 4,
        realm: 7,
        el: 'hoa',
        desc: 'Thần thú Chu Tước niết bàn trong biển lửa cực nhiệt hạch tâm.',
        mountId: 'chuoc',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['hoakylan'],
      },
      {
        id: 'kimo',
        name: 'Tam Túc Kim Ô',
        tier: 4,
        realm: 7,
        el: 'hoa',
        desc: 'Thần thú Thái Dương ba chân chí tôn, mang Thái Dương Chân Hỏa thiêu đốt hư không, ngự trị đỉnh Phù Tang.',
        mountId: 'kimo',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['hoakylan', 'hoaly_h'],
      },
    ],
  },
  hoaqua: {
    locId: 'hoaqua',
    name: 'Hoa Quả Sơn · Thủy Liêm Thần Cương',
    desc: 'Đông Hải tiên sơn, vách đá cheo leo tụ khí ngàn năm. Nơi ngự trị của các chi tộc Thần Hầu siêu phàm thoát tục.',
    dangerLevel: 6,
    species: [
      {
        id: 'thongtivien',
        name: 'Thông Tí Viên Hầu',
        tier: 3,
        realm: 5,
        el: 'moc',
        desc: 'Thần vượn tay dài nã nhật nguyệt, súc thiên sơn, thân thể kiên cố như huyền thạch.',
        mountId: 'thongtivien',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'linhminhhau',
        name: 'Linh Minh Thạch Hầu',
        tier: 4,
        realm: 7,
        el: 'kim',
        desc: 'Hỗn Thế Thần Hầu nhảy ra ngoài càn khôn tam giới, thông biến hóa, di tinh hoán đẩu.',
        mountId: 'linhminhhau',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['thongtivien'],
      },
    ],
  },
  suda: {
    locId: 'suda',
    name: 'Sư Đà Lĩnh · Vạn Yêu Ma Vực',
    desc: 'Hiểm địa đệ nhất yêu ma Tây Vực, ba đại vương tộc thống lĩnh tám vạn tiểu yêu hoành hành ngang dọc.',
    dangerLevel: 7,
    species: [
      {
        id: 'bachngatuong',
        name: 'Lục Nha Bạch Tượng',
        tier: 3,
        realm: 5,
        el: 'tho',
        desc: 'Voi trắng sáu ngà mình đồng da sắt, bước chân đạp vỡ sơn xuyên đại địa.',
        mountId: 'bachngatuong',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'cuulinhsu',
        name: 'Cửu Linh Sư Tử',
        tier: 3,
        realm: 6,
        el: 'loi',
        desc: 'Chúa tể sơn lâm chín đầu rống toang cửa trời, lôi điện rền vang mười phương.',
        mountId: 'cuulinhsu',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['bachngatuong'],
      },
      {
        id: 'kimsidieubang',
        name: 'Kim Sí Điêu Bằng',
        tier: 4,
        realm: 7,
        el: 'kim',
        desc: 'Bá chủ trời xanh vỗ cánh chín vạn dặm, mang Âm Dương Nhị Khí nuốt trọn càn khôn.',
        mountId: 'kimsidieubang',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['cuulinhsu', 'bachngatuong'],
      },
    ],
  },
  hacphong: {
    locId: 'hacphong',
    name: 'Hắc Phong Lĩnh · Hắc Ám Cổ Lĩnh',
    desc: 'Gió đen cuồn cuộn gào rít, sào huyệt của đại lực ma hùng cùng ngô công độc trùng.',
    dangerLevel: 5,
    species: [
      {
        id: 'bachnhanngocong',
        name: 'Bách Nhãn Ngô Công',
        tier: 2,
        realm: 4,
        el: 'quang',
        desc: 'Rết khổng lồ nghìn chân tỏa hoàng quang kịch độc thiêu đốt nguyên thần tu sĩ.',
        mountId: 'bachnhanngocong',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
      {
        id: 'hachung',
        name: 'Hắc Phong Ma Hùng',
        tier: 3,
        realm: 5,
        el: 'tho',
        desc: 'Gấu đen khổng lồ đao kiếm bất nhập, khí thế trầm ổn uy chấn toàn bộ sườn núi.',
        mountId: 'hachung',
        dropDan: 'm:thaicoyaudan',
        dropMat: 'm:dayeu',
        preyIds: ['bachnhanngocong'],
      },
    ],
  },
  banty: {
    locId: 'banty',
    name: 'Bàn Ty Động · Chu Ty Cổ Trạch',
    desc: 'Hang sâu giăng đầy tơ nhện độc bảy màu, tiên ma lỡ bước sa chân khó lòng thoát mạng.',
    dangerLevel: 4,
    species: [
      {
        id: 'bantychu',
        name: 'Bàn Ty Thất Sắc Chu',
        tier: 2,
        realm: 3,
        el: 'am',
        desc: 'Nhện tinh nhả tơ bảy màu hóa thành thiên la địa võng độc sát sinh linh.',
        mountId: 'bantychu',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
    ],
  },
  cochientruong: {
    locId: 'cochientruong',
    name: 'Bạch Cốt Lĩnh · Khô Lâu Ma Huyệt',
    desc: 'Chiến trường cổ xương trắng chất chồng vạn trượng, âm khí ngút trời sinh ra huyễn ma biến hóa.',
    dangerLevel: 5,
    species: [
      {
        id: 'bachcot',
        name: 'Bạch Cốt Linh Ma',
        tier: 3,
        realm: 4,
        el: 'am',
        desc: 'Yêu ma xương trắng ba lần biến ảo hình dung, thân thể bất tử trong hắc ám.',
        mountId: 'bachcot',
        dropDan: 'm:yeudan',
        dropMat: 'm:dayeu',
      },
    ],
  },
};

/** Cấu trúc 6 thứ bậc Cô Hồn Dã Quỷ tại các Quỷ Vực Âm Sát */
export const GHOST_RANKS: GhostRankSpec[] = [
  {
    rank: 'quytu',
    title: 'Dã Quỷ',
    realm: 0, // Phàm nhân / Luyện khí sơ kỳ
    desc: 'Cô hồn phiêu bạt không chốn dung thân, oán khí mờ nhạt, chỉ dám dập dờn nơi rìa ngoài bãi tha ma.',
    soulDrop: 20,
  },
  {
    rank: 'quytot',
    title: 'Quỷ Tốt',
    realm: 1, // Luyện Khí
    desc: 'Hồn ma tích tụ sát khí ngưng hình, nhận sai dịch của quỷ sai, tuần tra chông gai biên cảnh.',
    soulDrop: 50,
  },
  {
    rank: 'quybinh',
    title: 'Quỷ Binh',
    realm: 2, // Trúc Cơ
    desc: 'Âm binh mặc giáp rách, cầm trường mâu rỉ sét, kết thành trận pháp phòng ngự sào huyệt.',
    soulDrop: 120,
  },
  {
    rank: 'quytuong',
    title: 'Quỷ Tướng',
    realm: 3, // Kết Đan
    desc: 'Thống lĩnh một doanh quỷ binh, đao khí mang độc sát, tiếng gào rợn tóc gáy chấn nhiếp dã quỷ.',
    soulDrop: 300,
  },
  {
    rank: 'quysoai',
    title: 'Quỷ Soái',
    realm: 4, // Nguyên Anh
    desc: 'Âm soái ngự trên chiến xa xương trắng, điều khiển thiên quân vạn mã u linh, oán hận ngập trời.',
    soulDrop: 800,
  },
  {
    rank: 'quyvuong',
    title: 'Quỷ Vương',
    realm: 5, // Hóa Thần / Luyện Hư
    desc: 'Đứng đầu cả một vùng âm sát quỷ vực! Tọa trấn đại điện u minh, hô phong hoán vũ, vạn quỷ quỳ lạy thần phục.',
    soulDrop: 2500,
  },
];

/** Danh sách các Quỷ Vực Âm Sát trên trần thế */
export const GHOST_DOMAINS: Record<string, GhostDomain> = {
  cochien: {
    locId: 'cochien',
    name: 'Cổ Chiến Trường · Vạn Hồn Quỷ Vực',
    desc: 'Nơi chôn vùi hàng vạn tu sĩ và chiến binh viễn cổ. Huyết sát hòa cùng âm khí ngưng tụ thành quỷ quốc ngầm.',
    yinAura: 'Âm phong rít gào, cát bay đá chạy, tiếng binh khí va chạm rợn người văng vẳng trong sương mù đen đặc.',
  },
  cothanh: {
    locId: 'cothanh',
    name: 'Tây Mạc Cổ Thành · Phong Sa Quỷ Quật',
    desc: 'Tòa thành cổ bị vùi lấp dưới bão cát, cư dân chết oan biến thành ác quỷ phong tỏa các ngõ ngách cung điện ngầm.',
    yinAura: 'Khí tức tử vong nồng nặc bao trùm những bức tường đổ nát, tiếng than khóc ai oán truyền từ sâu trong lòng đất.',
  },
  tuyetuyen: {
    locId: 'tuyetuyen',
    name: 'Tuyệt Uyên Cốc · Cửu U Âm Sát Hạp',
    desc: 'Khe nứt sâu vạn trượng dẫn xuống mạch âm ty, nơi tụ tập của những hung linh tàn bạo nhất trần gian.',
    yinAura: 'Lửa ma trơi lập lòe xanh biếc, âm sát chi khí đóng băng cả thần thức tu sĩ tầm thường.',
  },
  hacsa: {
    locId: 'hacsa',
    name: 'Hắc Sa Mạc · Dạ Xoa Quỷ Địa',
    desc: 'Sa mạc cát đen vô tận, nơi Dạ Xoa và Quỷ Tướng lập doanh trại săn lùng tu sĩ lạc bước.',
    yinAura: 'Gió lốc cuốn theo cát đen như những bàn tay quỷ chực chờ kéo người sống xuống vực sâu.',
  },
};

/** Kiểm tra địa điểm hiện tại có phải Lãnh Thổ Yêu Thú không */
export function getBeastTerritory(locId: string): BeastTerritory | undefined {
  return BEAST_TERRITORIES[locId];
}

/** Kiểm tra địa điểm hiện tại có phải Quỷ Vực Âm Sát không */
export function getGhostDomain(locId: string): GhostDomain | undefined {
  return GHOST_DOMAINS[locId];
}

/** Kết quả hành động săn yêu thú */
export interface HuntResult {
  ok: boolean;
  msg: string;
  capturedMount?: string;
  dropDan?: string;
  dropMat?: string;
}

/** Người chơi săn yêu thú lấy yêu đan và linh tài */
export function huntBeast(territory: BeastTerritory, beast: BeastSpec): HuntResult {
  const foe: FoeSpec = {
    name: beast.name,
    r: beast.realm,
    el: beast.el,
    kind: 'beast',
  };

  const res = fight(mkFoe(foe));
  if (res.win) {
    let drops = '';
    if (addItem(beast.dropDan, 1) > 0) drops += `${itemName(beast.dropDan)} x1`;
    if (addItem(beast.dropMat, ri(1, 3)) > 0) drops += `, ${itemName(beast.dropMat)}`;

    addLog(`Trảm sát ${beast.name} tại ${territory.name}, thu hoạch ${drops}.`, 'good');
    return {
      ok: true,
      msg: `Ngươi đã kích sát ${beast.name}! Mổ lấy nội đan và thu thập linh tài: ${drops}.`,
      dropDan: beast.dropDan,
      dropMat: beast.dropMat,
    };
  } else {
    addLog(`Giao chiến với ${beast.name} bất lợi, bị uy áp thú vương đánh trọng thương tháo lui!`, 'bad');
    return {
      ok: false,
      msg: `Bị ${beast.name} hung tợn cắn trả! Uy áp lãnh thổ loài mạnh quá lớn khiến ngươi trọng thương phải lui bước.`,
    };
  }
}

/** Thu phục yêu thú làm Thú Cưỡi (Mount) */
export function tameMount(territory: BeastTerritory, beast: BeastSpec): HuntResult {
  if (!beast.mountId) {
    return { ok: false, msg: `${beast.name} là dã thú hung tàn, không thể thuần phục làm thú cưỡi.` };
  }
  const chan = CHANLINH[beast.mountId];
  if (!chan) {
    return { ok: false, msg: `Chưa tìm được phương pháp kết ấn khế ước với loài này.` };
  }

  if (s.r < beast.realm) {
    return {
      ok: false,
      msg: `Cảnh giới của ngươi (${REALMS[s.r].n}) thấp hơn uy áp của ${beast.name} (${REALMS[beast.realm].n}). Yêu thú không chịu khuất phục!`,
    };
  }

  // Chiến đấu khảo nghiệm thực lực để thuần phục
  const foe: FoeSpec = {
    name: `${beast.name} (Chưa thuần phục)`,
    r: beast.realm,
    el: beast.el,
    kind: 'beast',
  };

  const res = fight(mkFoe(foe));
  if (res.win) {
    // Thu phục thành công: Tặng lồng linh thú trứng thú tương ứng
    const eggId = 'trung_' + beast.mountId;
    if (bagFree() <= 0) {
      return { ok: false, msg: 'Túi đồ đã đầy, không thể chứa lồng linh thú phong ấn tọa kỵ.' };
    }
    addItem(eggId, 1);
    const isMount = !!chan.mount;
    const typeLabel = isMount ? 'tọa kỵ (thú cưỡi)' : 'chiến sủng (linh sủng hộ pháp)';
    addLog(`Thuần phục thành công ${beast.name}! Thu được Khế ước ${chan.n} làm ${typeLabel}.`, 'good');
    return {
      ok: true,
      msg: `Sau hồi giao tranh kinh thiên động địa, ngươi thi triển ngự thú linh quyết thuần phục hoàn toàn ${beast.name}! Thu được ${itemName(eggId)} trong túi đồ. Hãy dùng để ký khế ước ${typeLabel}!`,
      capturedMount: chan.n,
    };
  } else {
    addLog(`Thuần phục ${beast.name} thất bại! Bị linh thú cắn ngược tẩu thoát.`, 'bad');
    return {
      ok: false,
      msg: `${beast.name} tính tình bất khuất, nhân lúc ngươi sơ hở đã phóng thích yêu khí đào thoát về sâu trong cấm địa!`,
    };
  }
}

/** Tương tác kiểm tra lãnh thổ: Loài yếu xâm phạm loài mạnh sẽ bị xua đuổi */
export function observeTerritory(territory: BeastTerritory): string {
  const strong = territory.species.filter((sp) => sp.tier >= 3);
  const weak = territory.species.filter((sp) => sp.tier <= 2);
  if (!strong.length || !weak.length) {
    return `Lãnh thổ ${territory.name} tĩnh lặng, các bầy thú tuần tra theo ranh giới riêng biệt.`;
  }
  const sOne = pick(strong);
  const wOne = pick(weak);
  return `Ngươi nấp sau tảng đá quan sát: Một đàn 【${wOne.name}】 vô tình vượt qua ranh giới tìm cỏ linh, lập tức một tiếng gầm chấn động sơn hà của 【${sOne.name}】 vang lên! Uy áp thú vương bùng nổ xé toạc không khí, đàn ${wOne.name} khiếp đảm cắm đầu tháo chạy về vùng biên duyên. Ý thức lãnh thổ ở đây cực kỳ nghiêm ngặt: Kẻ yếu tuyệt đối không được xâm phạm cương thổ kẻ mạnh!`;
}

/** Chiến đấu với các cấp bậc Quỷ Vực: Quỷ Vương > Quỷ Soái > Quỷ Tướng > Quỷ Binh > Quỷ Tốt > Dã Quỷ */
export function challengeGhostRank(domain: GhostDomain, rankIdx: number): { ok: boolean; msg: string; rewardGear?: string } {
  const rank = GHOST_RANKS[rankIdx];
  if (!rank) return { ok: false, msg: 'Bậc quỷ không tồn tại.' };

  const foe: FoeSpec = {
    name: `${rank.title} · ${domain.name.split(' · ')[0]}`,
    r: rank.realm,
    el: 'am',
    kind: 'demon',
  };

  const res = fight(mkFoe(foe));
  if (res.win) {
    // Thưởng âm đức / linh thạch / quỷ khí
    s.money += rank.soulDrop * 5;
    let gearMsg = '';
    // Nếu đánh thắng Quỷ Tướng trở lên có cơ hội rơi pháp bảo âm ty cực phẩm
    if (rankIdx >= 3 && ch(0.65) && bagFree() > 0) {
      const gTier = clamp(rankIdx, 2, 6);
      const gr = mkGear(rank.realm, gTier, 2, 'am', 3);
      gr.n = `U Minh ${rank.title} Linh Bài`;
      addGear(gr);
      gearMsg = ` và thu được Quỷ Binh Pháp Bảo 【${gr.n}】!`;
    }

    addLog(`Trảm sát ${rank.title} tại ${domain.name}, giải trừ âm sát, nhận ${fmt(rank.soulDrop * 5)} linh thạch${gearMsg}.`, 'good');
    return {
      ok: true,
      msg: `Ngươi đã phá tan âm sát đại trận, đánh bại ${rank.title}! Thu hoạch ${fmt(rank.soulDrop * 5)} linh thạch, tích lũy ${rank.soulDrop} điểm âm đức thanh tẩy${gearMsg}. Vùng âm sát bị đẩy lui một phần!`,
      rewardGear: gearMsg,
    };
  } else {
    addLog(`Khiêu chiến ${rank.title} thất bại, bị âm sát quỷ khí xâm nhập tâm mạch!`, 'bad');
    return {
      ok: false,
      msg: `Âm phong cuồn cuộn! ${rank.title} vung cờ triệu hoán vạn quỷ cắn xé linh lực của ngươi. Ngươi bị thương nặng phải dùng độn phù đào thoát khỏi quỷ vực!`,
    };
  }
}
