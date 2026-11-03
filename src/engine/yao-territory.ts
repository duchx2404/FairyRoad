// Hệ thống Lãnh Thổ Yêu Tộc, Họ Tộc Đồng Loài & Mâu Thuẫn Cương Thổ
// 1. Người chơi là Yêu thú được sinh ra trong khu vực lãnh thổ loài của mình.
// 2. Cùng 1 loài thì CÙNG HỌ KHÁC TÊN (Hồ tộc họ Hồ, Lang tộc họ Lang, Xà tộc họ Xà...).
// 3. Sang địa phận loài khác sẽ nảy sinh mâu thuẫn trừ khi:
//    - Hai loài đang kết minh (allied)
//    - Hoặc loài khác yếu hơn loài của người chơi nhiều (much weaker)

import { s } from './state';
import { REALMS, type El } from '../data/core';
import { isYao } from './char';
import { addLog } from './core';
import { fight, mkFoe, type FoeSpec } from './combat';
import { fmt, ri, pick, ch } from '../core/util';

export interface YaoTreasure {
  name: string;
  envDesc: string; // Môi trường sinh dưỡng (nham thạch, băng nhĩ, huyễn đàm...)
  desc: string;
  effect: string;
  guardian: string; // Thú Hộ Bảo canh giữ
  guardianRealm: number;
  statBoost: { exp: number; hp?: number; val?: number; statKey?: string };
}

export interface YaoSpeciesInfo {
  speciesKey: string;
  name: string;
  surname: string; // Họ của loài: Cùng 1 loài thì cùng họ khác tên
  homeLoc: string; // Khu vực lãnh thổ loài của mình
  homeLocName: string;
  defaultRealm: number;
  tier: number; // 1: Phổ thông, 2: Vương thú, 3: Thái cổ thần thú
  alliedWith: string[]; // Các loài kết minh mặc định
  desc: string;
  treasure: YaoTreasure; // Thiên tài địa bảo phù hợp môi trường do loài này canh giữ
}

/** Bảng phân loại quy chuẩn các loài Yêu Thú chính trong Thương Lan Giới */
export const YAO_SPECIES_DATA: Record<string, YaoSpeciesInfo> = {
  ho: {
    speciesKey: 'ho',
    name: 'Hồ Tộc (Hồ Ly / Cửu Vĩ)',
    surname: 'Hồ',
    homeLoc: 'thapvan',
    homeLocName: 'Thập Vạn Đại Sơn · Hồ Tộc Lĩnh Địa',
    defaultRealm: 2,
    tier: 1,
    alliedWith: ['vien', 'mieu'],
    desc: 'Linh hồ thông minh tinh ranh, tu luyện mị thuật và huyễn thuật, cư ngụ nơi thung lũng sương mù.',
    treasure: {
      name: 'Cửu Diệp Huyễn U Chi',
      envDesc: 'Ẩn sâu trong huyễn cảnh sương mù của Thập Vạn Đại Sơn, hấp thu linh khí nhật nguyệt.',
      desc: 'Linh chi chín lá tỏa ánh sáng tím mờ ảo, có khả năng tẩy rửa thần thức, trừ khử tâm ma vĩnh viễn.',
      effect: 'Tăng vĩnh viễn +3 Ngộ Tính, +2 Đạo Tâm, thanh tẩy tâm ma và tăng +5,000 Tu Vi.',
      guardian: 'Hộ Bảo Huyễn Hồ Trưởng Lão',
      guardianRealm: 4,
      statBoost: { exp: 5000, val: 3, statKey: 'ngo' },
    },
  },
  lang: {
    speciesKey: 'lang',
    name: 'Lang Tộc (Tuyết Lang / Hắc Phong Lang)',
    surname: 'Lang',
    homeLoc: 'bangnguyen',
    homeLocName: 'Vạn Tái Băng Nguyên · Lang Tộc Tuyết Cốc',
    defaultRealm: 3,
    tier: 2,
    alliedWith: ['hung'],
    desc: 'Bầy sói hoang dã đoàn kết kiên cường, tính kỷ luật lãnh thổ cao nhất trong yêu tộc.',
    treasure: {
      name: 'Vạn Niên Băng Phách Linh Tinh',
      envDesc: 'Ngưng tụ từ cực hàn hàn tủy dưới đáy vực tuyết nghìn trượng của Vạn Tái Băng Nguyên.',
      desc: 'Khối hàn tinh trong suốt tỏa hàn khí bức người, giúp đúc lại gân cốt, ngưng kết băng giáp bất hoại.',
      effect: 'Tăng vĩnh viễn +600 Khí Huyết, +35 Phòng Ngự, tăng 15% kháng sát thương.',
      guardian: 'Ngân Nguyệt Lang Vương Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 8000, hp: 600, val: 35 },
    },
  },
  xa: {
    speciesKey: 'xa',
    name: 'Xà Tộc (Thanh Xà / Mãng Xà / Giao Long)',
    surname: 'Xà',
    homeLoc: 'daitrach',
    homeLocName: 'Vạn Mộng Đại Trạch · Xà Tộc Đầm Lầy',
    defaultRealm: 2,
    tier: 1,
    alliedWith: ['quy'],
    desc: 'Thủy xà ẩn mình dưới bùn lầy sương độc, giỏi dùng độc sát và phục kích.',
    treasure: {
      name: 'Cửu Chuyển Hóa Long Thảo',
      envDesc: 'Mọc từ đáy bùn lầy đầm độc Vạn Mộng Đại Trạch, nơi hội tụ mạch nước ngầm viễn cổ.',
      desc: 'Thần thảo mang hình rồng uốn lượn, xà tộc ăn vào có thể thoát thai hoán cốt tiến hóa huyết mạch.',
      effect: 'Tăng vĩnh viễn +60 Thọ Nguyên, tăng 20% tốc độ tu luyện yêu lực.',
      guardian: 'Độc Giác Cự Giao Hộ Bảo',
      guardianRealm: 4,
      statBoost: { exp: 6000, val: 60 },
    },
  },
  ung: {
    speciesKey: 'ung',
    name: 'Ưng Tộc (Lôi Ưng / Kim Sí Điểu / Bằng)',
    surname: 'Ưng',
    homeLoc: 'loiminh',
    homeLocName: 'Lôi Minh Đảo · Ưng Tộc Tuyệt Nhai',
    defaultRealm: 4,
    tier: 2,
    alliedWith: ['dieu'],
    desc: 'Bá chủ bầu trời ngự trị vách đá ngút ngàn, sải cánh lướt sấm chớp, tốc độ vô song.',
    treasure: {
      name: 'Phong Lôi Tiên Đằng Quả',
      envDesc: 'Treo lơ lửng trên vách đá Lôi Minh Đảo, ngày đêm tắm mình trong sấm sét và cuồng phong.',
      desc: 'Quả linh mang hoa văn sấm sét lập lòe, dung nạp phong lôi yêu khí thuần khiết nhất.',
      effect: 'Tăng vĩnh viễn +45 Công Kích, tăng mạnh tốc độ thân pháp.',
      guardian: 'Kim Sí Lôi Ưng Thú Vương',
      guardianRealm: 5,
      statBoost: { exp: 9000, val: 45 },
    },
  },
  ho_man: {
    speciesKey: 'ho_man',
    name: 'Hổ Tộc (Xích Diễm Hổ / Bạch Hổ)',
    surname: 'Hổ',
    homeLoc: 'hoadiem',
    homeLocName: 'Hỏa Diễm Sơn · Hổ Tộc Viêm Quật',
    defaultRealm: 4,
    tier: 2,
    alliedWith: ['kylan'],
    desc: 'Sơn lâm chi vương mang hỏa khí cuồng bạo, một tiếng gầm chấn động vạn dặm.',
    treasure: {
      name: 'Địa Tâm Xích Viêm Linh Chi',
      envDesc: 'Sinh trưởng giữa dòng nham thạch sôi sục của Hỏa Diễm Sơn, hấp thu địa hỏa ngàn năm.',
      desc: 'Nấm lửa đỏ rực như máu phượng hoàng, uống một giọt linh dịch có thể đốt cháy tạp chất thể phách.',
      effect: 'Tăng vĩnh viễn +50 Công Kích, +500 Khí Huyết, đúc Hỏa Viêm Chiến Thể.',
      guardian: 'Viêm Hổ Cổ Thú Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 8000, hp: 500, val: 50 },
    },
  },
  hung: {
    speciesKey: 'hung',
    name: 'Hùng Tộc (Băng Bạo Hùng / Cự Hùng)',
    surname: 'Hùng',
    homeLoc: 'bangnguyen',
    homeLocName: 'Vạn Tái Băng Nguyên · Hùng Tộc Cực Địa',
    defaultRealm: 4,
    tier: 2,
    alliedWith: ['lang'],
    desc: 'Thân hình đồ sộ, sức mạnh bài sơn đảo hải, mai giáp da dày đao kiếm khó thương.',
    treasure: {
      name: 'Hàn Tủy Cốt Ngọc Nhũ',
      envDesc: 'Nhỏ giọt từ thạch nhũ băng nghìn năm nơi hang động cự hùng Vạn Tái Băng Nguyên.',
      desc: 'Linh nhũ trắng muốt cô đặc, đại bổ thể phách cho cự thú.',
      effect: 'Tăng vĩnh viễn +800 Khí Huyết, +40 Thể Cốt.',
      guardian: 'Băng Bạo Cự Hùng Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 8000, hp: 800 },
    },
  },
  kylan: {
    speciesKey: 'kylan',
    name: 'Kỳ Lân Tộc (Hắc Kỳ Lân / Hỏa Lân)',
    surname: 'Kỳ',
    homeLoc: 'hoadiem',
    homeLocName: 'Hỏa Diễm Sơn · Thần Thú Lĩnh',
    defaultRealm: 6,
    tier: 3,
    alliedWith: ['ho_man'],
    desc: 'Thụy thú mang huyết mạch thượng cổ chí tôn, uy áp trời sinh chấn nhiếp muôn loài.',
    treasure: {
      name: 'Hỗn Độn Thần Viêm Tinh',
      envDesc: 'Hạch tâm ngọn lửa khởi nguyên nằm sâu dưới lòng đất Hỏa Diễm Sơn.',
      desc: 'Dị bảo chí tôn của Kỳ Lân tộc, chứa đựng thần thông Niết Bàn Chân Viêm.',
      effect: 'Tăng vĩnh viễn +1,000 Khí Huyết, +60 Công Kích, ngộ Thần Thú Uy Áp.',
      guardian: 'Thái Cổ Hỏa Lân Thần Thú',
      guardianRealm: 6,
      statBoost: { exp: 15000, hp: 1000, val: 60 },
    },
  },
  quy: {
    speciesKey: 'quy',
    name: 'Quy Tộc (Huyền Quy / Thủy Quy)',
    surname: 'Quy',
    homeLoc: 'daitrach',
    homeLocName: 'Vạn Mộng Đại Trạch · Quy Tộc Thủy Uyên',
    defaultRealm: 3,
    tier: 1,
    alliedWith: ['xa'],
    desc: 'Thọ mệnh ngàn năm, phòng ngự tuyệt đỉnh, chuộng hòa bình nhưng lãnh thổ bất khả xâm phạm.',
    treasure: {
      name: 'Huyền Thủy Quy Tức Châu',
      envDesc: 'Ngưng tụ nơi sâu nhất đáy vực Vạn Mộng Đại Trạch.',
      desc: 'Bảo châu tỏa ánh sáng lam ngọc êm dịu, bảo hộ thọ nguyên bất diệt.',
      effect: 'Tăng vĩnh viễn +120 Thọ Nguyên, +50 Phòng Ngự.',
      guardian: 'Vạn Niên Huyền Quy Trưởng Lão',
      guardianRealm: 4,
      statBoost: { exp: 7000, val: 120 },
    },
  },
  vien: {
    speciesKey: 'vien',
    name: 'Viên Tộc (Linh Hầu / Cự Viên)',
    surname: 'Viên',
    homeLoc: 'thapvan',
    homeLocName: 'Thập Vạn Đại Sơn · Viên Tộc Thụ Động',
    defaultRealm: 2,
    tier: 1,
    alliedWith: ['ho'],
    desc: 'Linh hoạt leo trèo vách núi, chế biến Bách Quả Tửu, tính tình hào sảng hiếu chiến.',
    treasure: {
      name: 'Vạn Quả Bách Thảo Tiên Tửu Trì',
      envDesc: 'Hốc đá tự nhiên trong Thập Vạn Đại Sơn, nơi bầy linh hầu ủ muôn loài linh quả ngàn năm.',
      desc: 'Rượu thơm nức mũi bay xa mười dặm, một hớp tẩy tủy phạt mao tăng vọt linh lực.',
      effect: 'Tăng vĩnh viễn +25,000 Tu Vi, tăng +2 Khí Vận.',
      guardian: 'Linh Hầu Lão Tổ Hộ Bảo',
      guardianRealm: 4,
      statBoost: { exp: 25000, val: 2 },
    },
  },
  mieu: {
    speciesKey: 'mieu',
    name: 'Miêu Tộc (Hỏa Ly / Linh Miêu)',
    surname: 'Miêu',
    homeLoc: 'thapvan',
    homeLocName: 'Thập Vạn Đại Sơn · Miêu Tộc Rừng Sâu',
    defaultRealm: 1,
    tier: 1,
    alliedWith: ['ho'],
    desc: 'Lanh lẹ trong đêm, giỏi đánh hơi linh thảo và ẩn nấp yêu khí.',
    treasure: {
      name: 'Dạ Quang U Lan Hoa',
      envDesc: 'Mọc trên vách đá ngậm sương đêm của Mê Vụ Lâm, chỉ nở hoa phát sáng trong bóng tối.',
      desc: 'Lan hoa huyền bí giúp mắt nhìn thấu đêm đen và tăng cường trực giác linh cảm.',
      effect: 'Tăng vĩnh viễn +3 Khí Vận, tăng 25% tỷ lệ đào thoát né tránh nguy hiểm.',
      guardian: 'U Minh Linh Ly Hộ Bảo',
      guardianRealm: 3,
      statBoost: { exp: 4000, val: 3 },
    },
  },
  tru: {
    speciesKey: 'tru',
    name: 'Trư Tộc (Thiết Bối Trư / Dã Trư)',
    surname: 'Trư',
    homeLoc: 'hacphong',
    homeLocName: 'Hắc Phong Lĩnh · Trư Tộc Trại',
    defaultRealm: 1,
    tier: 1,
    alliedWith: [],
    desc: 'Ủi đất đào linh căn, da lưng cứng như sắt, hung hãn khi bị xâm phạm vùng đất ăn.',
    treasure: {
      name: 'Đại Địa Huyền Hoàng Cương Thạch',
      envDesc: 'Mạch đá đen cứng nhất Hắc Phong Lĩnh, hấp thu thổ khí địa cầu nghìn trượng.',
      desc: 'Khối cương thạch màu nâu vàng, rèn luyện da thịt cứng như huyền thiết.',
      effect: 'Tăng vĩnh viễn +50 Phòng Ngự, +400 Khí Huyết.',
      guardian: 'Hắc Giáp Trư Vương Hộ Bảo',
      guardianRealm: 3,
      statBoost: { exp: 4500, hp: 400, val: 50 },
    },
  },
  kimo: {
    speciesKey: 'kimo',
    name: 'Tam Túc Kim Ô (Thần Thú Thái Dương)',
    surname: 'Ô',
    homeLoc: 'hoadiem',
    homeLocName: 'Hỏa Diễm Sơn · Kim Ô Phù Tang Lĩnh',
    defaultRealm: 6,
    tier: 3,
    alliedWith: ['kylan', 'ung'],
    desc: 'Thần thú Thái Dương ba chân chí tôn, huyết mạch Thái Dương Thần Điểu, toàn thân bốc cháy Thái Dương Chân Hỏa thiêu rụi trời đất.',
    treasure: {
      name: 'Thái Dương Chân Viêm Linh Tinh & Phù Tang Thần Diệp',
      envDesc: 'Sinh trưởng từ gốc cây Phù Tang Thần Thụ tắm trong biển lửa Thái Dương Chân Hỏa ngàn năm.',
      desc: 'Linh tinh rực lửa chứa Thái Dương Chân Hỏa khởi nguyên, tôi luyện Đúc Cực Dương Thần Thể.',
      effect: 'Tăng vĩnh viễn +1,200 Khí Huyết, +70 Công Kích bộc phát, ngộ Thái Dương Chân Hỏa.',
      guardian: 'Tam Túc Kim Ô Thần Thú Hộ Bảo',
      guardianRealm: 6,
      statBoost: { exp: 20000, hp: 1200, val: 70 },
    },
  },
  ngoctho: {
    speciesKey: 'ngoctho',
    name: 'Thái Âm Ngọc Thố (Thần Thú Cung Trăng)',
    surname: 'Thố',
    homeLoc: 'bangnguyen',
    homeLocName: 'Vạn Tái Băng Nguyên · Nguyệt Quế Tuyết Lĩnh',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['lang', 'hung'],
    desc: 'Thần thú Thái Âm Cung Trăng, ngưng tụ từ nguyệt hoa bạch ngọc tuyết sương, ngày đêm giã thuốc trường sinh bất tử.',
    treasure: {
      name: 'Nguyệt Quế Bất Lão Tiên Dịch & Cửu Chuyển Ngọc Dược',
      envDesc: 'Nhỏ giọt từ rễ cây Nguyệt Quế Thần Thụ nghìn năm hấp thu ánh trăng tuyết cực hàn.',
      desc: 'Tiên dịch óng ánh như ngọc, do Ngọc Thố dùng cối ngọc giã thuốc cô đọng ngàn năm.',
      effect: 'Tăng vĩnh viễn +150 Thọ Nguyên, +5 Ngộ Tính, thanh lọc bách độc và tẩy sạch tâm ma.',
      guardian: 'Thái Âm Ngọc Thố Tiên Tử Hộ Bảo',
      guardianRealm: 6,
      statBoost: { exp: 16000, val: 150, statKey: 'ngo' },
    },
  },

  // HỖN THẾ TỨ HẦU (TÂY DU KÝ)
  linhminhhau: {
    speciesKey: 'linhminhhau',
    name: 'Linh Minh Thạch Hầu (Hỗn Thế Tứ Hầu)',
    surname: 'Tôn',
    homeLoc: 'hoaqua',
    homeLocName: 'Hoa Quả Sơn · Thủy Liêm Động Phủ',
    defaultRealm: 6,
    tier: 3,
    alliedWith: ['thongtivien', 'xichkhaomahau', 'lucnhimihau'],
    desc: 'Thông biến hóa, thức thiên thời, tri địa lợi, di tinh hoán đẩu. Bản tính kiêu hùng tự tại, nhảy ra ngoài càn khôn ngũ hành.',
    treasure: {
      name: 'Thất Thải Bổ Thiên Linh Thạch & Cửu Khiếu Tiên Thai',
      envDesc: 'Đỉnh núi Hoa Quả Sơn ngưng tụ nhật nguyệt tinh hoa ngàn năm hóa thành thạch thai.',
      desc: 'Đá thần Nữ Oa bổ thiên còn sót lại, ẩn chứa năng lượng hỗn độn nguyên thủy phá vỡ mọi gông cùm.',
      effect: 'Tăng vĩnh viễn +1,500 Khí Huyết, +80 Công Kích, giác ngộ thần thông biến hóa.',
      guardian: 'Linh Minh Thạch Hầu Lão Tổ',
      guardianRealm: 6,
      statBoost: { exp: 30000, hp: 1500, val: 80 },
    },
  },
  xichkhaomahau: {
    speciesKey: 'xichkhaomahau',
    name: 'Xích Khào Mã Hầu (Hỗn Thế Tứ Hầu)',
    surname: 'Mã',
    homeLoc: 'daitrach',
    homeLocName: 'Vạn Mộng Đại Trạch · Đô Thao Thủy Cung',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['linhminhhau', 'xa', 'quy'],
    desc: 'Hiểu âm dương, hội nhân sự, thiện xuất nhập, tị tử duyên sinh. Bơi lặn sóng dữ như đi trên đất bằng.',
    treasure: {
      name: 'Cửu U Tị Thủy Định Ba Thần Châu',
      envDesc: 'Ngưng tụ nơi đáy vực sâu nhất Vạn Mộng Đại Trạch.',
      desc: 'Viên ngọc định hải chế áp muôn trùng sóng dữ, giúp thấu suốt âm dương càn khôn.',
      effect: 'Tăng vĩnh viễn +50% Tốc Độ Bơi/Thoát Thân, +4 Khí Vận, +60 Phòng Ngự.',
      guardian: 'Xích Khào Mã Hầu Thủy Tướng',
      guardianRealm: 5,
      statBoost: { exp: 22000, val: 60 },
    },
  },
  thongtivien: {
    speciesKey: 'thongtivien',
    name: 'Thông Tí Viên Hầu (Hỗn Thế Tứ Hầu)',
    surname: 'Viên',
    homeLoc: 'hoaqua',
    homeLocName: 'Mai Sơn Phong Cảnh · Thông Thiên Viên Động',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['linhminhhau', 'vien'],
    desc: 'Nã nhật nguyệt, súc thiên sơn, biện hưu cửu, càn khôn ma lộng. Cánh tay dài vươn hái trăng sao, lực bạt sơn hà.',
    treasure: {
      name: 'Nhật Nguyệt Thần Tinh Côn & Hỗn Độn Linh Cốt',
      envDesc: 'Tôi luyện từ lõi thiên thạch rớt xuống Mai Sơn.',
      desc: 'Cột sắt hấp thu ánh sáng nhật nguyệt, nặng vạn cân đập nát hư không.',
      effect: 'Tăng vĩnh viễn +90 Công Kích, +1,000 Khí Huyết.',
      guardian: 'Mai Sơn Thông Tí Viên Bá',
      guardianRealm: 5,
      statBoost: { exp: 22000, hp: 1000, val: 90 },
    },
  },
  lucnhimihau: {
    speciesKey: 'lucnhimihau',
    name: 'Lục Nhĩ Mĩ Hầu (Hỗn Thế Tứ Hầu)',
    surname: 'Hầu',
    homeLoc: 'thapvan',
    homeLocName: 'Thập Vạn Đại Sơn · Lục Thính U Cốc',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['ho'],
    desc: 'Thiện thính âm, năng sát lý, tri tiền hậu, vạn vật giai minh. Sáu tai lắng nghe chuyện ngàn dặm, giả thật khôn lường.',
    treasure: {
      name: 'Lục Thính Linh Nhĩ Thần Tủy & Vạn Cổ Huyễn Âm',
      envDesc: 'Ẩn giấu nơi hang động cách biệt tuyệt đối âm thanh trong lòng núi.',
      desc: 'Tủy ngọc giúp tai thông tỏ tiếng lòng vạn vật, nghe trước điềm lành dữ.',
      effect: 'Tăng vĩnh viễn +8 Ngộ Tính, +35% Tỷ Lệ Đào Thoát, +15% Tu Luyện.',
      guardian: 'Lục Nhĩ Hầu Vương Hộ Bảo',
      guardianRealm: 6,
      statBoost: { exp: 24000, val: 8, statKey: 'ngo' },
    },
  },

  // HẮC HÙNG & BẠCH CỐT
  hachung: {
    speciesKey: 'hachung',
    name: 'Hắc Hùng Tinh (Hắc Phong Ma Hùng)',
    surname: 'Hùng',
    homeLoc: 'hacphong',
    homeLocName: 'Hắc Phong Lĩnh · Hắc Hùng Cổ Trại',
    defaultRealm: 4,
    tier: 2,
    alliedWith: ['hung', 'tru'],
    desc: 'Mình đồng da sắt, lực lưỡng vô song, say mê Phật pháp thiền định và trân bảo áo cà sa.',
    treasure: {
      name: 'Hắc Phong Ma Hùng Đảm Linh Dịch',
      envDesc: 'Mật gấu ngàn năm tôi luyện giữa luồng gió đen kịch độc Hắc Phong Lĩnh.',
      desc: 'Dược dịch đen nhánh tăng cường thể phách kim cương, bách độc bất xâm.',
      effect: 'Tăng vĩnh viễn +600 Khí Huyết, +75 Phòng Ngự.',
      guardian: 'Hắc Phong Hùng Tướng',
      guardianRealm: 4,
      statBoost: { exp: 12000, hp: 600, val: 75 },
    },
  },
  bachcot: {
    speciesKey: 'bachcot',
    name: 'Bạch Cốt Tinh (Huyễn Cốt Linh Ma)',
    surname: 'Bạch',
    homeLoc: 'cochientruong',
    homeLocName: 'Bạch Hổ Lĩnh · Bạch Cốt Động Phủ',
    defaultRealm: 4,
    tier: 2,
    alliedWith: [],
    desc: 'Xương trắng hấp thu âm sát ngàn năm hóa hình, ba lần biến ảo lừa gạt lòng người, thân thể bất tử trong sương lạnh.',
    treasure: {
      name: 'Vạn Niên Cốt Linh Hàn Tủy & Cốt U Hỏa',
      envDesc: 'Đáy sâu động Bạch Cốt ngưng kết sương lạnh từ đống xương tàn chiến trường xưa.',
      desc: 'Khối tủy xương phát ra ngọn lửa ma xanh biếc đoạn tuyệt lục dục.',
      effect: 'Tăng vĩnh viễn +50 Công Kích, +30% Tốc Độ Ẩn Nấp, tăng 20% sát thương bạo kích.',
      guardian: 'Bạch Cốt Nương Nương Hộ Thể',
      guardianRealm: 5,
      statBoost: { exp: 14000, val: 50 },
    },
  },

  // CÁC LOÀI YÊU QUÁI TÂY DU KÝ (DƯỚI DẠNG LOÀI)
  kimsidieubang: {
    speciesKey: 'kimsidieubang',
    name: 'Kim Sí Đại Bằng Điêu (Sư Đà Lĩnh Thần Điêu)',
    surname: 'Bằng',
    homeLoc: 'suda',
    homeLocName: 'Sư Đà Lĩnh · Kim Sí Điêu Bằng Nhai',
    defaultRealm: 6,
    tier: 3,
    alliedWith: ['cuulinhsu', 'bachngatuong', 'ung'],
    desc: 'Vỗ cánh bay chín vạn dặm, mang huyết mạch Phượng Hoàng viễn cổ, tốc độ đệ nhất thiên hạ.',
    treasure: {
      name: 'Âm Dương Nhị Khí Bình Linh Tinh',
      envDesc: 'Bảo bối hút lấy âm dương nhị khí đất trời trên đỉnh vách đá Sư Đà Lĩnh.',
      desc: 'Linh tinh ẩn chứa khí tức hỗn độn nghiền nát thân thể thần tiên.',
      effect: 'Tăng vĩnh viễn +80 Công Kích, +100% Tốc Độ Di Chuyển.',
      guardian: 'Kim Sí Bằng Vương Thần Thú',
      guardianRealm: 6,
      statBoost: { exp: 28000, val: 80 },
    },
  },
  thanhnguu: {
    speciesKey: 'thanhnguu',
    name: 'Độc Giác Thanh Ngưu (Kim Đới Sơn Ma Ngưu)',
    surname: 'Ngưu',
    homeLoc: 'thapvan',
    homeLocName: 'Kim Đới Sơn · Độc Giác Cổ Động',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['tru'],
    desc: 'Thanh ngưu tọa kỵ của Thái Thượng Lão Quân hạ phàm, một sừng húc đổ núi cao, thể phách ngưng luyện như huyền thiết.',
    treasure: {
      name: 'Thái Thượng Huyền Kim Thiết Trác',
      envDesc: 'Lò rèn cổ ngưng kết huyền kim ngàn năm dưới chân Kim Đới Sơn.',
      desc: 'Vòng sắt huyền kim hút lấy binh khí pháp bảo của đối thủ.',
      effect: 'Tăng vĩnh viễn +90 Phòng Ngự, +800 Khí Huyết, giảm 15% sát thương nhận vào.',
      guardian: 'Thanh Ngưu Yêu Vương Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 20000, hp: 800, val: 90 },
    },
  },
  cuulinhsu: {
    speciesKey: 'cuulinhsu',
    name: 'Cửu Linh Sư Tộc (Cửu Đầu Sư Tử)',
    surname: 'Sư',
    homeLoc: 'suda',
    homeLocName: 'Sư Đà Lĩnh · Cửu Đầu Sư Cương',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['kimsidieubang', 'bachngatuong'],
    desc: 'Sư tử chín đầu chúa tể vạn thú, tiếng hống rền vang làm nứt toác cửa trời, chấn nhiếp quỷ ma.',
    treasure: {
      name: 'Cửu Thủ Hống Thiên Thần Tinh',
      envDesc: 'Mỏm đá cao nhất nơi chín đầu sư tử hàng ngày gầm thét đón ánh sấm sét.',
      desc: 'Linh tinh hấp thu âm thanh cuồng bạo làm run rẩy thần hồn kẻ địch.',
      effect: 'Tăng vĩnh viễn +70 Công Kích, +30 Uy Áp Khiến Kẻ Địch Khiếp Sợ.',
      guardian: 'Cửu Đầu Sư Vương Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 20000, val: 70 },
    },
  },
  bachngatuong: {
    speciesKey: 'bachngatuong',
    name: 'Lục Nha Bạch Tượng (Sư Đà Lĩnh Cự Tượng)',
    surname: 'Tượng',
    homeLoc: 'suda',
    homeLocName: 'Sư Đà Lĩnh · Bạch Tượng Cổ Cốc',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['kimsidieubang', 'cuulinhsu'],
    desc: 'Voi trắng sáu ngà uy nghi trầm ổn, vòi dài quấn gãy đại thụ vạn trượng, lực bạt sơn hà.',
    treasure: {
      name: 'Lục Nha Bạch Tượng Linh Ngà Trân Tủy',
      envDesc: 'Răng ngà voi trắng rụng sau vạn năm hóa thạch ngậm tinh hoa đất mẹ.',
      desc: 'Tủy ngà voi tinh khiết giúp thể phách kiên cố không thể phá vỡ.',
      effect: 'Tăng vĩnh viễn +1,200 Khí Huyết, +80 Phòng Ngự.',
      guardian: 'Bạch Tượng Yêu Vương Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 20000, hp: 1200, val: 80 },
    },
  },
  bantychu: {
    speciesKey: 'bantychu',
    name: 'Bàn Ty Chu Yêu (Thất Sắc Nhện Tinh)',
    surname: 'Chu',
    homeLoc: 'banty',
    homeLocName: 'Bàn Ty Động · Thất Tinh Đầm',
    defaultRealm: 3,
    tier: 1,
    alliedWith: ['bachnhanngocong'],
    desc: 'Bảy tỷ muội nhện tinh nhả tơ bảy màu giăng bẫy bắt người, tắm suối nước nóng trác cấu truyền thống.',
    treasure: {
      name: 'Thất Sắc Tru Ty Ngọc Tằm Tơ',
      envDesc: 'Ổ kén ngọc trong động Bàn Ty nơi tơ độc bảy màu kết tinh.',
      desc: 'Sợi tơ bền chắc dao chém không đứt, lửa đốt không cháy.',
      effect: 'Tăng vĩnh viễn +40 Phòng Ngự, tăng 25% tỷ lệ trói chân làm chậm kẻ địch.',
      guardian: 'Bàn Ty Đại Tỷ Hộ Bảo',
      guardianRealm: 4,
      statBoost: { exp: 8000, val: 40 },
    },
  },
  bachnhanngocong: {
    speciesKey: 'bachnhanngocong',
    name: 'Bách Nhãn Ngô Công (Hoàng Hoa Quán Quái)',
    surname: 'Ngô',
    homeLoc: 'hacphong',
    homeLocName: 'Hoàng Hoa Quán · Bách Mục Đạo Viện',
    defaultRealm: 4,
    tier: 2,
    alliedWith: ['bantychu'],
    desc: 'Rết độc ngàn mắt dưới sườn, khoác đạo bào tinh thông luyện độc đan, phóng hoàng quang vạn trượng.',
    treasure: {
      name: 'Bách Mục Hoàng Quang Thần Tinh',
      envDesc: 'Lò luyện đan trong Hoàng Hoa Quán ngưng tụ độc khí trăm mắt.',
      desc: 'Mắt thần phát sáng vàng rực làm mờ mắt và tan chảy pháp lực đối phương.',
      effect: 'Tăng vĩnh viễn +55 Công Kích, +30 Bộc Phát Pháp Lực.',
      guardian: 'Đa Mục Quái Hộ Trì',
      guardianRealm: 4,
      statBoost: { exp: 12000, val: 55 },
    },
  },
  tybadochac: {
    speciesKey: 'tybadochac',
    name: 'Tỳ Bà Độc Hạt (Độc Địch Sơn Nữ Quái)',
    surname: 'Hạt',
    homeLoc: 'thapvan',
    homeLocName: 'Độc Địch Sơn · Tỳ Bà Thạch Động',
    defaultRealm: 4,
    tier: 2,
    alliedWith: [],
    desc: 'Gảy đàn tỳ bà mê hoặc thần trí, đuôi mang Đảo Mã Độc chích đau thấu xương tủy kể cả kim thân Phật đà.',
    treasure: {
      name: 'Đảo Mã Độc Câu Thần Kim',
      envDesc: 'Vách đá nung nấu nọc độc bọ cạp nghìn năm kết tinh thành khối kim thạch đen óng.',
      desc: 'Nọc kịch độc chí mạng xuyên thủng mọi hộ thể cương khí.',
      effect: 'Tăng vĩnh viễn +65 Công Kích, đòn đánh kèm 20% độc thương liên tục.',
      guardian: 'Tỳ Bà Yêu Cơ Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 14000, val: 65 },
    },
  },
  hoangphongdieuthu: {
    speciesKey: 'hoangphongdieuthu',
    name: 'Hoàng Phong Điêu Thử (Hoàng Mao Thử Tinh)',
    surname: 'Điêu',
    homeLoc: 'phongson',
    homeLocName: 'Hoàng Phong Lĩnh · Phong Sa Động',
    defaultRealm: 3,
    tier: 1,
    alliedWith: [],
    desc: 'Chuột lông vàng Linh Sơn ăn trộm dầu thơm trốn xuống hạ giới, thổi Tam Muội Thần Phong long trời lở đất.',
    treasure: {
      name: 'Tam Muội Thần Phong Linh Cốt',
      envDesc: 'Hốc gió xoáy vĩnh cửu trên ngọn Hoàng Phong Lĩnh.',
      desc: 'Khúc xương gió thổi ra bão cát vàng làm mù lòa thần tiên.',
      effect: 'Tăng vĩnh viễn +35% Tỷ Lệ Đào Thoát, +4 Khí Vận.',
      guardian: 'Hoàng Phong Quái Tướng',
      guardianRealm: 4,
      statBoost: { exp: 8000, val: 35 },
    },
  },
  tichtelam: {
    speciesKey: 'tichtelam',
    name: 'Tịch Hàn Tịch Thử Tam Tê (Thanh Tê Ngưu Tộc)',
    surname: 'Tê',
    homeLoc: 'bangnguyen',
    homeLocName: 'Kim Bình Phủ · Huyền Anh Động',
    defaultRealm: 4,
    tier: 2,
    alliedWith: ['lang'],
    desc: 'Ba anh em tê ngưu tu luyện ngàn năm thích ăn trộm dầu thơm đêm rằm, da dày như tảng băng giá.',
    treasure: {
      name: 'Tô Hợp Hương Tê Giác Ngọc Đỉnh',
      envDesc: 'Đỉnh ngọc chứa dầu thơm ngưng tụ hàn khí Huyền Anh Động.',
      desc: 'Hương dầu thơm ngào ngạt giúp ngưng tụ chân nguyên băng hàn kiên cố.',
      effect: 'Tăng vĩnh viễn +700 Khí Huyết, +60 Phòng Ngự.',
      guardian: 'Tịch Hàn Tê Vương Hộ Bảo',
      guardianRealm: 4,
      statBoost: { exp: 12000, hp: 700, val: 60 },
    },
  },
  bichbacuudau: {
    speciesKey: 'bichbacuudau',
    name: 'Bích Ba Cửu Đầu Điểu (Cửu Đầu Trùng Tộc)',
    surname: 'Cửu',
    homeLoc: 'daitrach',
    homeLocName: 'Bích Ba Đàm · Thủy Tộc Long Cung',
    defaultRealm: 5,
    tier: 3,
    alliedWith: ['xa', 'quy'],
    desc: 'Thần điểu chín đầu cưới công chúa Vạn Thánh Long Cung, ăn trộm xá lợi Phật đài tế Thủy Tinh Cung.',
    treasure: {
      name: 'Cửu Thủ Huyết Diễm Thần Vũ',
      envDesc: 'Lông vũ chín đầu rụng trong đáy đầm Bích Ba hấp thu phật quang xá lợi.',
      desc: 'Cặp cánh chín màu rực máu bay lượn trên nước như sấm sét.',
      effect: 'Tăng vĩnh viễn +75 Công Kích, +15% Tu Luyện Tốc Độ.',
      guardian: 'Cửu Đầu Phò Mã Hộ Bảo',
      guardianRealm: 5,
      statBoost: { exp: 18000, val: 75 },
    },
  },
  ngaiviephoabao: {
    speciesKey: 'ngaiviephoabao',
    name: 'Ngải Diệp Hoa Báo (Ẩn Vụ Báo Vương)',
    surname: 'Báo',
    homeLoc: 'thapvan',
    homeLocName: 'Ẩn Vụ Sơn · Chiết Nhạc Động',
    defaultRealm: 3,
    tier: 1,
    alliedWith: ['ho_man'],
    desc: 'Báo gấm hoa văn lá ngải Nam Sơn Đại Vương, giăng sương mù vây khốn con mồi, tốc độ lẹ làng như bóng ma.',
    treasure: {
      name: 'Ẩn Vụ Báo Đan Bí Linh Tinh',
      envDesc: 'Hốc đá tụ sương mù đặc quánh trên đỉnh Ẩn Vụ Sơn.',
      desc: 'Viên nội đan giúp hòa tan thân hình vào màn sương vô ảnh vô tung.',
      effect: 'Tăng vĩnh viễn +30 Công Kích, +30% Tốc Độ Thoát Thân Ẩn Nấp.',
      guardian: 'Nam Sơn Báo Vương Hộ Bảo',
      guardianRealm: 4,
      statBoost: { exp: 9000, val: 30 },
    },
  },
  bachlocthanthu: {
    speciesKey: 'bachlocthanthu',
    name: 'Bích Khâu Bạch Lộc (Thần Thú Trường Thọ)',
    surname: 'Lộc',
    homeLoc: 'thapvan',
    homeLocName: 'Bỉ Khâu Tiên Cảnh · Bạch Lộc Lâm',
    defaultRealm: 4,
    tier: 2,
    alliedWith: ['ho'],
    desc: 'Tọa kỵ Bạch Lộc của Nam Cực Thọ Tinh trốn xuống phàm trần làm quốc trượng, hấp thu linh khí trường sinh.',
    treasure: {
      name: 'Vạn Niên Trường Thọ Linh Chi Giác',
      envDesc: 'Cặp sừng hươu trắng mọc ra từ cây nấm linh chi ngàn năm trong rừng sâu.',
      desc: 'Sừng hươu tiên tỏa hương thơm thanh tịnh gia tăng vô lượng tuổi thọ.',
      effect: 'Tăng vĩnh viễn +120 Thọ Nguyên, +4 Khí Vận.',
      guardian: 'Bạch Lộc Quốc Trượng Hộ Bảo',
      guardianRealm: 4,
      statBoost: { exp: 12000, val: 120 },
    },
  },
};

/** Nhận diện loài yêu thú và họ tộc từ tên loài */
export function identifyYaoSpecies(beastName?: string): YaoSpeciesInfo {
  const b = (beastName || s.beast || '').toLowerCase();
  // Hỗn thế tứ hầu & thần hầu
  if (b.includes('thạch hầu') || b.includes('linh minh') || b.includes('tôn ngộ không') || b.includes('linhminhhau')) return YAO_SPECIES_DATA.linhminhhau;
  if (b.includes('mã hầu') || b.includes('xích khào') || b.includes('xichkhaomahau')) return YAO_SPECIES_DATA.xichkhaomahau;
  if (b.includes('thông tí') || b.includes('thongtivien') || b.includes('bạch viên')) return YAO_SPECIES_DATA.thongtivien;
  if (b.includes('lục nhĩ') || b.includes('lucnhimihau') || b.includes('sáu tai')) return YAO_SPECIES_DATA.lucnhimihau;

  // Thần điểu & thỏ
  if (b.includes('kim ô') || b.includes('tam túc') || b.includes('kimo') || b.includes('quạ vàng') || b.includes('kim o')) return YAO_SPECIES_DATA.kimo;
  if (b.includes('ngọc thố') || b.includes('thỏ ngọc') || b.includes('nguyệt thố') || b.includes('ngoctho') || b.includes('thố') || b.includes('thỏ')) return YAO_SPECIES_DATA.ngoctho;

  // Hắc hùng & bạch cốt
  if (b.includes('hắc hùng') || b.includes('hachung') || b.includes('ma hùng') || b.includes('hắc phong hùng')) return YAO_SPECIES_DATA.hachung;
  if (b.includes('bạch cốt') || b.includes('bachcot') || b.includes('khô lâu') || b.includes('cốt yêu')) return YAO_SPECIES_DATA.bachcot;

  // Các loài Tây Du Ký
  if (b.includes('đại bằng') || b.includes('điêu bằng') || b.includes('kimsidieubang') || b.includes('kim sí điêu')) return YAO_SPECIES_DATA.kimsidieubang;
  if (b.includes('thanh ngưu') || b.includes('thanhnguu') || b.includes('độc giác ngưu')) return YAO_SPECIES_DATA.thanhnguu;
  if (b.includes('cửu linh') || b.includes('cuulinhsu') || b.includes('chín đầu sư') || b.includes('sư tử')) return YAO_SPECIES_DATA.cuulinhsu;
  if (b.includes('bạch tượng') || b.includes('bachngatuong') || b.includes('lục nha') || b.includes('voi trắng')) return YAO_SPECIES_DATA.bachngatuong;
  if (b.includes('nhện') || b.includes('bàn ty') || b.includes('bantychu') || b.includes('chu tinh')) return YAO_SPECIES_DATA.bantychu;
  if (b.includes('ngô công') || b.includes('bachnhanngocong') || b.includes('rết') || b.includes('bách nhãn')) return YAO_SPECIES_DATA.bachnhanngocong;
  if (b.includes('bọ cạp') || b.includes('tybadochac') || b.includes('độc hạt') || b.includes('tỳ bà')) return YAO_SPECIES_DATA.tybadochac;
  if (b.includes('điêu thử') || b.includes('hoangphongdieuthu') || b.includes('hoàng phong') || b.includes('chuột gió')) return YAO_SPECIES_DATA.hoangphongdieuthu;
  if (b.includes('tê ngưu') || b.includes('tichtelam') || b.includes('tịch hàn') || b.includes('tam đầu tê')) return YAO_SPECIES_DATA.tichtelam;
  if (b.includes('cửu đầu điểu') || b.includes('bichbacuudau') || b.includes('cửu đầu trùng') || b.includes('bích ba')) return YAO_SPECIES_DATA.bichbacuudau;
  if (b.includes('báo') || b.includes('ngaiviephoabao') || b.includes('hoa báo')) return YAO_SPECIES_DATA.ngaiviephoabao;
  if (b.includes('bạch lộc') || b.includes('bachlocthanthu') || b.includes('hươu trắng')) return YAO_SPECIES_DATA.bachlocthanthu;

  // Các loài cơ bản
  if (b.includes('hồ') || b.includes('cáo') || (b.includes('ly') && !b.includes('ly miêu'))) return YAO_SPECIES_DATA.ho;
  if (b.includes('lang') || b.includes('sói')) return YAO_SPECIES_DATA.lang;
  if (b.includes('xà') || b.includes('rắn') || b.includes('mãng') || b.includes('giao')) return YAO_SPECIES_DATA.xa;
  if (b.includes('ưng') || b.includes('điêu') || b.includes('bằng') || b.includes('loan') || b.includes('điểu')) return YAO_SPECIES_DATA.ung;
  if (b.includes('hổ')) return YAO_SPECIES_DATA.ho_man;
  if (b.includes('hùng') || b.includes('gấu')) return YAO_SPECIES_DATA.hung;
  if (b.includes('lân') || b.includes('kỳ lân')) return YAO_SPECIES_DATA.kylan;
  if (b.includes('quy') || b.includes('rùa')) return YAO_SPECIES_DATA.quy;
  if (b.includes('viên') || b.includes('hầu') || b.includes('khỉ')) return YAO_SPECIES_DATA.vien;
  if (b.includes('miêu')) return YAO_SPECIES_DATA.mieu;
  if (b.includes('trư') || b.includes('lợn')) return YAO_SPECIES_DATA.tru;

  // Mặc định là Hồ tộc ở Thập Vạn Đại Sơn
  return YAO_SPECIES_DATA.ho;
}

/** Lấy địa điểm quê hương loài của Yêu Thú */
export function getYaoHomeLoc(beastName?: string): string {
  const spec = identifyYaoSpecies(beastName);
  return spec.homeLoc;
}

/** Tên riêng dành cho các đồng tộc cùng loài: Cùng họ khác tên */
const YAO_FIRST_NAMES_MALE = ['Liệt', 'Ngạo', 'Phong', 'Hắc', 'Cuồng', 'Thiên', 'Đại Lực', 'Trường Không', 'Thiểm', 'Lôi', 'Sát', 'Tiêu', 'Bá', 'Trảm'];
const YAO_FIRST_NAMES_FEMALE = ['Mỵ', 'Nhi', 'Linh', 'Thanh', 'Vân', 'Nguyệt', 'Tuyết', 'Bích', 'Huyên', 'Tiên', 'Ly', 'U', 'Dao', 'Cửu'];

/** Tạo tên một NPC đồng tộc cùng loài: Đảm bảo CÙNG HỌ của loài, khác tên */
export function mkYaoKinName(species: YaoSpeciesInfo, g: 'm' | 'f' = 'm'): string {
  const pool = g === 'f' ? YAO_FIRST_NAMES_FEMALE : YAO_FIRST_NAMES_MALE;
  return `${species.surname} ${pick(pool)}`;
}

/** Đảm bảo tên người chơi Yêu thú có họ của loài mình */
export function ensurePlayerYaoSurname(playerName: string, beastName?: string): string {
  const spec = identifyYaoSpecies(beastName);
  const parts = playerName.trim().split(/\s+/);
  if (parts.length === 0) return `${spec.surname} Linh`;

  // Nếu đã mang họ của loài thì giữ nguyên
  if (parts[0].toLowerCase() === spec.surname.toLowerCase()) {
    return playerName;
  }

  // Nếu người chơi chưa có họ loài thì gắn họ của loài vào
  if (parts.length === 1) {
    return `${spec.surname} ${parts[0]}`;
  } else {
    // Thay họ đầu tiên bằng họ của loài
    return `${spec.surname} ${parts.slice(1).join(' ')}`;
  }
}

/** Xác định loài chiếm ưu thế tại một địa danh hoang dã */
export function getTerritoryDominantSpecies(locId: string): YaoSpeciesInfo | null {
  if (locId === 'hoaqua') return YAO_SPECIES_DATA.linhminhhau;
  if (locId === 'suda') return YAO_SPECIES_DATA.kimsidieubang;
  if (locId === 'banty') return YAO_SPECIES_DATA.bantychu;
  if (locId === 'cochientruong') return YAO_SPECIES_DATA.bachcot;
  if (locId === 'phongson') return YAO_SPECIES_DATA.hoangphongdieuthu;
  if (locId === 'hacphong') return YAO_SPECIES_DATA.hachung;
  if (locId === 'hoadiem') return YAO_SPECIES_DATA.kimo;
  if (locId === 'bangnguyen') return YAO_SPECIES_DATA.ngoctho;
  if (locId === 'thapvan') return YAO_SPECIES_DATA.ho;
  if (locId === 'daitrach') return YAO_SPECIES_DATA.xa;
  if (locId === 'loiminh') return YAO_SPECIES_DATA.ung;
  return null;
}

/** Kiểm tra 2 loài có đang kết minh không */
export function areSpeciesAllied(specA: YaoSpeciesInfo, specB: YaoSpeciesInfo): boolean {
  if (specA.speciesKey === specB.speciesKey) return true;

  // Kiểm tra cờ minh ước trong game
  const key1 = `${specA.speciesKey}_${specB.speciesKey}`;
  const key2 = `${specB.speciesKey}_${specA.speciesKey}`;
  if (s.flags.yaoAlliances?.[key1] || s.flags.yaoAlliances?.[key2]) return true;

  // Kiểm tra minh ước mặc định
  return specA.alliedWith.includes(specB.speciesKey) || specB.alliedWith.includes(specA.speciesKey);
}

/** Kiểm tra loài này đã thần phục người chơi chưa */
export function isSpeciesSubjugated(spec: YaoSpeciesInfo): boolean {
  return !!s.flags.yaoSubjugated?.[spec.speciesKey];
}

/** Bắt một loài yêu thú thần phục hoàn toàn làm tộc phụ dung */
export function subjugateSpecies(mySpec: YaoSpeciesInfo, targetSpec: YaoSpeciesInfo): { ok: boolean; msg: string } {
  s.flags.yaoSubjugated ||= {};
  s.flags.yaoSubjugated[targetSpec.speciesKey] = true;

  // Thu nạp cống phẩm quy phục
  s.money += 3000;
  const msg = `✦ Trấn áp hoàn toàn! Đầu Đàn cùng toàn tộc 【${targetSpec.name}】 run rẩy quỳ rạp dưới chân thần phục, dâng nộp kho tàng 3,000 linh thạch và cống vật, tôn ngươi làm TÔN CHỦ! Toàn bộ cương thổ 【${targetSpec.homeLocName}】 từ nay trở thành thuộc địa của ngươi! Bầy thú đối phương chỉ là tộc phụ dung, tuyệt đối không có quyền lợi ngang hàng!`;
  addLog(msg, 'good');
  return { ok: true, msg };
}

/** Kết minh 2 loài yêu thú (chỉ qua đường cống nạp hòa giải) */
export function formSpeciesAlliance(specA: YaoSpeciesInfo, specB: YaoSpeciesInfo) {
  s.flags.yaoAlliances ||= {};
  const key1 = `${specA.speciesKey}_${specB.speciesKey}`;
  s.flags.yaoAlliances[key1] = true;
  addLog(`✦ Hai loài 【${specA.name}】 và 【${specB.name}】 đã lập huyết thệ minh ước, từ nay hòa hiếu tương trợ!`, 'good');
}

export interface TerritoryClashCheck {
  clash: boolean;
  reason: 'same_species' | 'subjugated' | 'allied' | 'much_weaker' | 'hostile';
  dominantSpecies: YaoSpeciesInfo | null;
  msg: string;
}

/** Kiểm tra tình trạng mâu thuẫn cương thổ khi Yêu thú đặt chân tới một địa bàn */
export function checkYaoTerritoryStatus(locId: string): TerritoryClashCheck {
  if (!isYao()) {
    return { clash: false, reason: 'same_species', dominantSpecies: null, msg: '' };
  }

  const mySpec = identifyYaoSpecies(s.beast);
  const domSpec = getTerritoryDominantSpecies(locId);

  // Không phải địa bàn tranh chấp của loài nào
  if (!domSpec) {
    return { clash: false, reason: 'same_species', dominantSpecies: null, msg: 'Nơi này là vùng hoang vu phi chủ quyền, không có đàn thú chiếm giữ.' };
  }

  // 1. CÙNG MỘT LOÀI
  if (domSpec.speciesKey === mySpec.speciesKey) {
    return {
      clash: false,
      reason: 'same_species',
      dominantSpecies: domSpec,
      msg: `Ngươi đang ở trong lãnh thổ của đồng tộc ${mySpec.name}! Khắp nơi đều là tộc nhân cùng mang họ 【${mySpec.surname}】, ánh mắt thân tình bảo bọc.`,
    };
  }

  // 2. NGOẠI LỆ 1: LOÀI NÀY ĐÃ BỊ ĐÁNH THẮNG VÀ THẦN PHỤC
  if (isSpeciesSubjugated(domSpec)) {
    return {
      clash: false,
      reason: 'subjugated',
      dominantSpecies: domSpec,
      msg: `Lãnh địa của ${domSpec.name} (Tộc Phụ Dung đã thần phục)! Đàn thú bản địa vừa thấy bóng dáng ngươi liền phủ phục sát đất, run rẩy quỳ lạy Tôn Chủ!`,
    };
  }

  // 3. NGOẠI LỆ 2: HAI LOÀI ĐANG KẾT MINH
  if (areSpeciesAllied(mySpec, domSpec)) {
    return {
      clash: false,
      reason: 'allied',
      dominantSpecies: domSpec,
      msg: `Lãnh địa của ${domSpec.name}! Hai loài ${mySpec.name} và ${domSpec.name} đang kết minh tương hảo. Tuần tra bản địa nhận ra khí tức minh ước, cúi đầu đón tiếp: "Chào mừng đồng minh ${mySpec.surname} tộc nhân!"`,
    };
  }

  // 4. NGOẠI LỆ 3: LOÀI KHÁC YẾU HƠN LOÀI CỦA NGƯỜI CHƠI NHIỀU
  // Cảnh giới người chơi cao hơn cảnh giới loài đó >= 2 bậc hoặc tier vượt trội
  const muchWeaker = s.r >= domSpec.defaultRealm + 2 || mySpec.tier > domSpec.tier + 1;
  if (muchWeaker) {
    return {
      clash: false,
      reason: 'much_weaker',
      dominantSpecies: domSpec,
      msg: `Cảm nhận được uy áp huyết mạch thượng vị kinh người từ ngươi, bầy ${domSpec.name} khiếp đảm rạp mình sát đất, cuống cuồng mở đường! Kẻ yếu không dám mạo phạm kẻ mạnh!`,
    };
  }

  // 5. MÂU THUẪN CƯƠNG THỔ BÙNG PHÁT!
  return {
    clash: true,
    reason: 'hostile',
    dominantSpecies: domSpec,
    msg: `CẢNH BÁO MÂU THUẪN CƯƠNG THỔ! Ngươi là ${mySpec.name} cả gan xâm nhập vùng săn bắn của ${domSpec.name}! Tiếng gầm thét thị uy vang dội, bầy thú bản địa lập tức giương nanh múa vuốt bao vây!`,
  };
}

/** Khai chiến quyết đấu lãnh thổ với đầu đàn loài khác: Đánh thắng sẽ BẮT THẦN PHỤC */
export function fightTerritoryClash(domSpec: YaoSpeciesInfo): { ok: boolean; msg: string } {
  const foe: FoeSpec = {
    name: `Đầu Đàn ${domSpec.name.split(' (')[0]}`,
    r: Math.max(domSpec.defaultRealm, s.r),
    el: 'hoa',
    kind: 'beast',
  };

  const res = fight(mkFoe(foe));
  if (res.win) {
    const mySpec = identifyYaoSpecies(s.beast);
    return subjugateSpecies(mySpec, domSpec);
  } else {
    return {
      ok: false,
      msg: `Bị đàn ${domSpec.name} hợp lực vây công hung tợn! Ngươi bị thương nặng, buộc phải dùng độn thuật tháo chạy khỏi cương thổ của chúng!`,
    };
  }
}

/** Đồng tộc xin thu hoạch / lĩnh ngộ Thiên Tài Địa Bảo của loài mình */
export function claimTreasureAsKin(spec: YaoSpeciesInfo): { ok: boolean; msg: string } {
  s.flags.yaoTreasureClaimed ||= {};
  const lastYear = s.flags.yaoTreasureClaimed[spec.speciesKey] || 0;
  if (Math.floor(s.year) - lastYear < 3) {
    return {
      ok: false,
      msg: `Thiên Tài Địa Bảo 【${spec.treasure.name}】 mới vừa được thu hái, linh khí chưa kịp ngưng tụ hoàn mãn. Cần đợi thêm ${3 - (Math.floor(s.year) - lastYear)} năm nữa!`,
    };
  }

  s.flags.yaoTreasureClaimed[spec.speciesKey] = Math.floor(s.year);
  const tb = spec.treasure.statBoost;
  s.prog += tb.exp;
  if (tb.hp) s.stats.can += Math.round(tb.hp / 100);
  if (tb.val && tb.statKey === 'ngo') s.stats.ngo += tb.val;
  if (tb.val && !tb.statKey) s.money += tb.val * 10;

  const msg = `✦ Là đồng tộc thân cận, các vị trưởng bối cho phép ngươi tiến vào cấm địa hấp thu 【${spec.treasure.name}】! ${spec.treasure.effect} Nhận thêm ${fmt(tb.exp)} điểm tu vi!`;
  addLog(msg, 'good');
  return { ok: true, msg };
}

/** Tôn Chủ thu nhận Thiên Tài Địa Bảo do Tộc Phụ Dung cống nạp */
export function claimTreasureAsVassal(spec: YaoSpeciesInfo): { ok: boolean; msg: string } {
  s.flags.yaoTreasureClaimed ||= {};
  const lastYear = s.flags.yaoTreasureClaimed[spec.speciesKey] || 0;
  if (Math.floor(s.year) - lastYear < 3) {
    return {
      ok: false,
      msg: `Tộc phụ dung 【${spec.name}】 báo cáo: 【${spec.treasure.name}】 đợt trước đã dâng nộp, mầm linh dược mới đang đâm chồi, cần chờ ${3 - (Math.floor(s.year) - lastYear)} năm nữa để chín rộ dâng lên Tôn Chủ!`,
    };
  }

  s.flags.yaoTreasureClaimed[spec.speciesKey] = Math.floor(s.year);
  const tb = spec.treasure.statBoost;
  s.prog += tb.exp;
  s.money += 2000;
  if (tb.hp) s.stats.can += Math.round(tb.hp / 100);
  if (tb.val && tb.statKey === 'ngo') s.stats.ngo += tb.val;

  const msg = `✦ Đầu Đàn và bầy thú 【${spec.name}】 quỳ rạp sát đất, hai tay kính cẩn dâng nộp Thiên Tài Địa Bảo 【${spec.treasure.name}】 mà cả tộc canh giữ ngàn năm cho Tôn Chủ! ${spec.treasure.effect} Cùng 2,000 linh thạch cống phẩm!`;
  addLog(msg, 'good');
  return { ok: true, msg };
}

/** Cường đoạt: Khai chiến với Thú Hộ Bảo để đoạt Thiên Tài Địa Bảo */
export function fightForTreasure(spec: YaoSpeciesInfo): { ok: boolean; msg: string } {
  const foe: FoeSpec = {
    name: spec.treasure.guardian,
    r: spec.treasure.guardianRealm,
    el: 'hoa',
    kind: 'beast',
  };

  const res = fight(mkFoe(foe));
  if (res.win) {
    const tb = spec.treasure.statBoost;
    s.prog += tb.exp;
    s.money += 1500;
    if (tb.hp) s.stats.can += Math.round(tb.hp / 100);
    if (tb.val && tb.statKey === 'ngo') s.stats.ngo += tb.val;
    const msg = `✦ Khai chiến đại thắng! Ngươi chấn áp Thú Hộ Bảo 【${spec.treasure.guardian}】, cưỡng đoạt Thiên Tài Địa Bảo 【${spec.treasure.name}】! ${spec.treasure.effect} Nhận ${fmt(tb.exp)} điểm tu vi!`;
    addLog(msg, 'good');
    return { ok: true, msg };
  } else {
    return {
      ok: false,
      msg: `Bị Thú Hộ Bảo 【${spec.treasure.guardian}】 mang uy lực ngập trời đánh trọng thương! Ngươi buộc phải lui bước, không thể đoạt lấy dị bảo!`,
    };
  }
}

/** Lén lút hái trộm Thiên Tài Địa Bảo */
export function stealTreasure(spec: YaoSpeciesInfo): { ok: boolean; msg: string } {
  const success = ch(0.5);
  if (success) {
    const tb = spec.treasure.statBoost;
    s.prog += Math.round(tb.exp * 0.7);
    const msg = `✦ Thần cơ diệu toán! Nhân lúc Thú Hộ Bảo sơ hở say ngủ, ngươi thi triển diệu pháp hái trộm thành công một phần linh dịch 【${spec.treasure.name}】! Luyện hóa nhận được ${fmt(Math.round(tb.exp * 0.7))} tu vi!`;
    addLog(msg, 'good');
    return { ok: true, msg };
  } else {
    const foe: FoeSpec = {
      name: spec.treasure.guardian,
      r: spec.treasure.guardianRealm,
      el: 'am',
      kind: 'beast',
    };
    const res = fight(mkFoe(foe));
    if (res.win) {
      const tb = spec.treasure.statBoost;
      s.prog += tb.exp;
      const msg = `Bị Thú Hộ Bảo phát hiện! Nhưng ngươi phản đòn đánh bại nó và đoạt lấy 【${spec.treasure.name}】! Nhận ${fmt(tb.exp)} tu vi!`;
      addLog(msg, 'good');
      return { ok: true, msg };
    } else {
      return { ok: false, msg: `Bị Thú Hộ Bảo 【${spec.treasure.guardian}】 phát hiện gầm thét phục kích! Bị trọng thương tháo chạy!` };
    }
  }
}

/** Cống nạp linh dược cầu hòa ngoại giao */
export function bribeTerritoryClash(domSpec: YaoSpeciesInfo): { ok: boolean; msg: string } {
  const mySpec = identifyYaoSpecies(s.beast);
  formSpeciesAlliance(mySpec, domSpec);
  return {
    ok: true,
    msg: `Ngươi lấy ra linh quả quý hiếm dâng tặng làm lễ vật giao hảo. Đầu Đàn ${domSpec.name} hít ngửi linh khí, gật đầu thu nhận lễ vật và cất tiếng gầm hòa giải. Hai loài ${mySpec.name} và ${domSpec.name} chính thức kết minh hữu hảo!`,
  };
}
