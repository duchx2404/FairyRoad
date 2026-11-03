// Phong Thần Bảng theo hồi 99 "Khương Tử Nha quy quốc phong thần" (Phong Thần Diễn Nghĩa). Nguyên văn gọi là 365 vị chính thần,
// nhưng đếm thẳng danh sách được 369 mục: thêm Bách Giám đứng đầu bảng và bốn người trùng tên giữ hai thần vị.
// Mỗi vị là một nhân vật có thật ở Hồng Hoang (sinh ở engine/tienco.ts); khi tử trận Phong Thần mới nhận thần chức.
// Tên phiên âm Hán-Việt theo nguyên văn hồi 99 (bản Wikisource). Nguyên tác có người trùng tên (Vương Hổ, Tôn Bảo, Trần Canh, Chu Tín):
// họ là những người khác nhau nên ở đây vẫn giữ đủ, mỗi người là một mục riêng; tra theo chỉ số trong bảng, không theo tên.

/** Thế lực của một vị trước khi phong thần, theo sư thừa đã kiểm chứng: môn hạ giáo nào thì thuộc giáo đó
 *  (Xiển, Tiệt; Đạo Giáo của Lão Tử và Tây Phương Giáo không có ai trên bảng); người không bái sư giáo nào thì theo phe nhân gian lúc tử trận (Đại Thương, Tây Kỳ),
 *  hoặc Tán tu nếu không theo phe nào. Phe Lượng Kiếp: Đại Thương đứng sau Tiệt Giáo, Tây Kỳ đứng sau Xiển Giáo. */
export type FengshenSect =
  | 'Đại Thương'
  | 'Tây Kỳ'
  | 'Tiệt Giáo · Bích Du Cung'
  | 'Xiển Giáo · Ngọc Hư Cung'
  | 'Đạo Giáo · Bát Cảnh Cung'
  | 'Tây Phương Giáo'
  | 'Mai Sơn'
  | 'Tán tu';

export interface FengshenGod {
  name: string;
  office: string;
  /** Bộ trong Phong Thần Bảng. */
  dept: string;
  sect: FengshenSect;
  g: 'm' | 'f';
  /** 0: đứng đầu bộ (Chuẩn Thánh), 1: tiên nhân (Thái Ất – Đại La), 2: tướng lĩnh nhân gian (Kim Tiên – Thái Ất). */
  tier: 0 | 1 | 2;
  /** Lai lịch ngắn trước khi phong thần. */
  from: string;
}

type Row = [name: string, office: string, sect?: FengshenSect, g?: 'f', tier?: 0 | 1 | 2];

const DAI_THUONG: FengshenSect = 'Đại Thương';
const TAY_KY: FengshenSect = 'Tây Kỳ';
const TIET: FengshenSect = 'Tiệt Giáo · Bích Du Cung';
const XIEN: FengshenSect = 'Xiển Giáo · Ngọc Hư Cung';
const MAI_SON: FengshenSect = 'Mai Sơn';
const TAN_TU: FengshenSect = 'Tán tu';

const tierOf = (sect: FengshenSect): 1 | 2 => (sect === DAI_THUONG || sect === TAY_KY ? 2 : 1);

/** Lai lịch cho người khác thế lực với phần đông trong bộ (lai lịch của bộ không đúng với họ). */
const FROM_BY_SECT: Record<FengshenSect, string> = {
  'Đại Thương': 'Người phe Đại Thương, tử trận trong cuộc chiến Thương Chu',
  'Tây Kỳ': 'Người phe Tây Kỳ, tử trận trên đường phò Chu phạt Trụ',
  'Tiệt Giáo · Bích Du Cung': 'Môn hạ Tiệt Giáo, ứng kiếp trong đại chiến Phong Thần',
  'Xiển Giáo · Ngọc Hư Cung': 'Môn hạ Xiển Giáo, ứng kiếp trong đại chiến Phong Thần',
  'Đạo Giáo · Bát Cảnh Cung': 'Môn hạ Bát Cảnh Cung, ứng kiếp trong đại chiến Phong Thần',
  'Tây Phương Giáo': 'Môn hạ Tây Phương Giáo, ứng kiếp trong đại chiến Phong Thần',
  'Mai Sơn': 'Yêu tu Mai Sơn theo phò Đại Thương',
  'Tán tu': 'Người ngoài tam giáo và hai phe, bị cuốn vào kiếp số Phong Thần',
};

function dept(name: string, defaultSect: FengshenSect, from: string, rows: Row[]): FengshenGod[] {
  return rows.map(([n, office, sect, g, tier]) => {
    const sc = sect ?? defaultSect;
    return { name: n, office, dept: name, sect: sc, g: g ?? 'm', tier: tier ?? tierOf(sc), from: sc === defaultSect ? from : FROM_BY_SECT[sc] };
  });
}

export const FENGSHEN_ROSTER: FengshenGod[] = [
  ...dept('Thanh Phúc Chính Thần', TAN_TU, 'Nguyên soái của Hiên Viên Hoàng Đế, hồn phách lưu lạc ngàn năm ở Bắc Hải', [
    ['Bách Giám', 'Tam Giới Thủ Lĩnh Bát Bộ Tam Bách Lục Thập Ngũ Vị Thanh Phúc Chính Thần', TAN_TU, undefined, 0],
  ]),

  ...dept('Ngũ Nhạc', TAY_KY, 'Đại tướng phò Chu phạt Trụ, tử trận trước cửa ải', [
    ['Hoàng Phi Hổ', 'Đông Nhạc Thái Sơn Thiên Tề Nhân Thánh Đại Đế', TAY_KY, undefined, 0],
    ['Sùng Hắc Hổ', 'Nam Nhạc Hành Sơn Tư Thiên Chiêu Thánh Đại Đế', TIET, undefined, 2],
    ['Văn Sính', 'Trung Nhạc Tung Sơn Trung Thiên Sùng Thánh Đại Đế', TAY_KY],
    ['Thôi Anh', 'Bắc Nhạc Hằng Sơn An Thiên Huyền Thánh Đại Đế', TAY_KY],
    ['Tưởng Hùng', 'Tây Nhạc Hoa Sơn Kim Thiên Thuận Thánh Đại Đế', TAY_KY],
  ]),

  ...dept('Lôi Bộ', DAI_THUONG, 'Tướng lĩnh dưới trướng Thái sư Văn Trọng, tử trận trong các chiến dịch phạt Tây Kỳ', [
    ['Văn Trọng', 'Cửu Thiên Ứng Nguyên Lôi Thanh Phổ Hóa Thiên Tôn', TIET, undefined, 0],
    ['Đặng Trung', 'Lôi Bộ Thiên Quân · Đặng Thiên Quân', DAI_THUONG],
    ['Tân Hoàn', 'Lôi Bộ Thiên Quân · Tân Thiên Quân', DAI_THUONG],
    ['Trương Tiết', 'Lôi Bộ Thiên Quân · Trương Thiên Quân', DAI_THUONG],
    ['Đào Vinh', 'Lôi Bộ Thiên Quân · Đào Thiên Quân', DAI_THUONG],
    ['Bàng Hồng', 'Lôi Bộ Thiên Quân · Bàng Thiên Quân', DAI_THUONG],
    ['Lưu Phủ', 'Lôi Bộ Thiên Quân · Lưu Thiên Quân', DAI_THUONG],
    ['Cẩu Chương', 'Lôi Bộ Thiên Quân · Cẩu Thiên Quân', DAI_THUONG],
    ['Tất Hoàn', 'Lôi Bộ Thiên Quân · Tất Thiên Quân', DAI_THUONG],
    ['Tần Hoàn', 'Lôi Bộ Thiên Quân · Tần Thiên Quân', TIET],
    ['Triệu Giang', 'Lôi Bộ Thiên Quân · Triệu Thiên Quân', TIET],
    ['Đổng Toàn', 'Lôi Bộ Thiên Quân · Đổng Thiên Quân', TIET],
    ['Viên Giác', 'Lôi Bộ Thiên Quân · Viên Thiên Quân', TIET],
    ['Lý Đức', 'Lôi Bộ Thiên Quân · Lý Thiên Quân', TIET],
    ['Tôn Lương', 'Lôi Bộ Thiên Quân · Tôn Thiên Quân', TIET],
    ['Bách Lễ', 'Lôi Bộ Thiên Quân · Bách Thiên Quân', TIET],
    ['Vương Biến', 'Lôi Bộ Thiên Quân · Vương Thiên Quân', TIET],
    ['Diêu Bân', 'Lôi Bộ Thiên Quân · Diêu Thiên Quân', TIET],
    ['Trương Thiệu', 'Lôi Bộ Thiên Quân · Trương Thiệu Thiên Quân', TIET],
    ['Hoàng Canh', 'Lôi Bộ Thiên Quân · Hoàng Thiên Quân', TIET],
    ['Kim Tố', 'Lôi Bộ Thiên Quân · Kim Thiên Quân', TIET],
    ['Cát Lập', 'Lôi Bộ Thiên Quân · Cát Thiên Quân', TIET, undefined, 2],
    ['Dư Khánh', 'Lôi Bộ Thiên Quân · Dư Thiên Quân', TIET, undefined, 2],
    ['Kim Quang Thánh Mẫu', 'Thiểm Điện Thần', TIET, 'f'],
    ['Hạm Chi Tiên', 'Trợ Phong Thần', TIET, 'f'],
  ]),

  ...dept('Hỏa Bộ', TIET, 'Tiên nhân Tiệt Giáo theo La Tuyên phóng hỏa Tây Kỳ', [
    ['La Tuyên', 'Nam Phương Tam Khí Hỏa Đức Tinh Quân Chính Thần', TIET, undefined, 0],
    ['Chu Ngộ', 'Vĩ Hỏa Hổ', TIET],
    ['Cao Chấn', 'Thất Hỏa Trư', TIET],
    ['Phương Quý', 'Chủy Hỏa Hầu', TIET],
    ['Vương Giao', 'Dực Hỏa Xà', TIET],
    ['Lưu Hoàn', 'Tiếp Hỏa Thiên Quân', TIET],
  ]),

  ...dept('Ôn Bộ', TIET, 'Môn hạ của Lữ Nhạc ở Cửu Long Đảo, gieo ôn dịch xuống Tây Kỳ', [
    ['Lữ Nhạc', 'Ôn Hoàng Hạo Thiên Đại Đế', TIET, undefined, 0],
    ['Chu Tín', 'Đông Phương Hành Ôn Sứ Giả', TIET],
    ['Lý Kỳ', 'Nam Phương Hành Ôn Sứ Giả', TIET],
    ['Chu Thiên Lân', 'Tây Phương Hành Ôn Sứ Giả', TIET],
    ['Dương Văn Huy', 'Bắc Phương Hành Ôn Sứ Giả', TIET],
    ['Trần Canh', 'Khuyến Thiện Đại Sư', TIET],
    ['Lý Bình', 'Hòa Ôn Đạo Sĩ', TIET],
  ]),

  ...dept('Đẩu Bộ · Đẩu Mẫu', TIET, 'Đệ tử thân truyền của Thông Thiên Giáo Chủ, đứng đầu nữ tiên Tiệt Giáo', [
    ['Kim Linh Thánh Mẫu', 'Khảm Cung Đẩu Mẫu Chính Thần', TIET, 'f', 0],
  ]),
  ...dept('Đẩu Bộ · Đông Đẩu', TAY_KY, 'Tướng lĩnh phò Chu, tử trận trên đường đông chinh', [
    ['Tô Hộ', 'Đông Đẩu Tinh Quân', TAY_KY],
    ['Kim Khuê', 'Đông Đẩu Tinh Quân', DAI_THUONG],
    ['Cơ Thúc Minh', 'Đông Đẩu Tinh Quân', TAY_KY],
    ['Triệu Bính', 'Đông Đẩu Tinh Quân', TAY_KY],
  ]),
  ...dept('Đẩu Bộ · Tây Đẩu', TAY_KY, 'Tướng lĩnh phò Chu, tử trận trên đường đông chinh', [
    ['Hoàng Thiên Lộc', 'Tây Đẩu Tinh Quân', TAY_KY],
    ['Long Hoàn', 'Tây Đẩu Tinh Quân', TAY_KY],
    ['Tôn Tử Vũ', 'Tây Đẩu Tinh Quân', TAY_KY],
    ['Hồ Thăng', 'Tây Đẩu Tinh Quân', DAI_THUONG],
    ['Hồ Vân Bằng', 'Tây Đẩu Tinh Quân', DAI_THUONG],
  ]),
  ...dept('Đẩu Bộ · Trung Đẩu', TAY_KY, 'Tướng lĩnh hai bên Thương – Chu tử trận trong đại kiếp', [
    ['Lỗ Nhân Kiệt', 'Trung Đẩu Tinh Quân', DAI_THUONG],
    ['Triều Lôi', 'Trung Đẩu Tinh Quân', TAY_KY],
    ['Cơ Thúc Thăng', 'Trung Đẩu Tinh Quân', TAY_KY],
  ]),
  ...dept('Đẩu Bộ · Tử Vi', TAY_KY, 'Trưởng tử của Tây Bá Hầu Cơ Xương, bị Trụ Vương giết ở Triều Ca', [
    ['Bá Ấp Khảo', 'Trung Thiên Bắc Cực Tử Vi Đại Đế', TAY_KY, undefined, 0],
  ]),
  ...dept('Đẩu Bộ · Nam Đẩu', TAY_KY, 'Tướng lĩnh hai bên Thương – Chu tử trận trong đại kiếp', [
    ['Chu Kỷ', 'Nam Đẩu Tinh Quân', TAY_KY],
    ['Hồ Lôi', 'Nam Đẩu Tinh Quân', TIET, undefined, 2],
    ['Cao Quý', 'Nam Đẩu Tinh Quân', DAI_THUONG],
    ['Dư Thành', 'Nam Đẩu Tinh Quân', DAI_THUONG],
    ['Tôn Bảo', 'Nam Đẩu Tinh Quân', DAI_THUONG],
    ['Lôi Côn', 'Nam Đẩu Tinh Quân', DAI_THUONG],
  ]),
  ...dept('Đẩu Bộ · Bắc Đẩu', DAI_THUONG, 'Quan tướng hai bên Thương – Chu tử trận trong đại kiếp', [
    ['Hoàng Thiên Tường', 'Thiên Cương Tinh', TAY_KY],
    ['Tỷ Can', 'Văn Khúc Tinh', DAI_THUONG],
    ['Đậu Vinh', 'Vũ Khúc Tinh', DAI_THUONG],
    ['Hàn Thăng', 'Tả Phụ Tinh', TIET, undefined, 2],
    ['Hàn Biến', 'Hữu Bật Tinh', TIET, undefined, 2],
    ['Tô Toàn Trung', 'Phá Quân Tinh', TAY_KY],
    ['Ngạc Thuận', 'Tham Lang Tinh', TAY_KY],
    ['Quách Thần', 'Cự Môn Tinh', DAI_THUONG],
    ['Đổng Trung', 'Chiêu Dao Tinh', DAI_THUONG],
  ]),

  ...dept('Quần Tinh Liệt Tú', DAI_THUONG, 'Người trong đại kiếp Thương – Chu, chết đi được liệt vào hàng tinh tú', [
    ['Đặng Cửu Công', 'Thanh Long Tinh', TAY_KY],
    ['Ân Thành Tú', 'Bạch Hổ Tinh', DAI_THUONG],
    ['Mã Phương', 'Chu Tước Tinh', DAI_THUONG],
    ['Từ Khôn', 'Huyền Vũ Tinh', DAI_THUONG],
    ['Lôi Bằng', 'Câu Trần Tinh', DAI_THUONG],
    ['Trương Sơn', 'Đằng Xà Tinh', DAI_THUONG],
    ['Từ Cái', 'Thái Dương Tinh', TAY_KY],
    ['Khương Hoàng Hậu', 'Thái Âm Tinh', DAI_THUONG, 'f'],
    ['Thương Dung', 'Ngọc Đường Tinh', DAI_THUONG],
    ['Cơ Thúc Càn', 'Thiên Quý Tinh', TAY_KY],
    ['Hồng Cẩm', 'Long Đức Tinh', TAY_KY],
    ['Long Cát Công Chúa', 'Hồng Loan Tinh', TAY_KY, 'f', 1],
    ['Trụ Vương', 'Thiên Hỉ Tinh', DAI_THUONG],
    ['Mai Bá', 'Thiên Đức Tinh', DAI_THUONG],
    ['Hạ Chiêu', 'Nguyệt Đức Tinh', DAI_THUONG],
    ['Triệu Khải', 'Thiên Xá Tinh', DAI_THUONG],
    ['Giả Phu Nhân', 'Mạo Đoan Tinh', DAI_THUONG, 'f'],
    ['Tiêu Trăn', 'Kim Phủ Tinh', XIEN],
    ['Đặng Hoa', 'Mộc Phủ Tinh', XIEN],
    ['Dư Nguyên', 'Thủy Phủ Tinh', TIET],
    ['Hỏa Linh Thánh Mẫu', 'Hỏa Phủ Tinh', TIET, 'f'],
    ['Thổ Tôn (Đạo hiệu: Thổ Hành Tôn)', 'Thổ Phủ Tinh', XIEN],
    ['Đặng Thiền Ngọc', 'Lục Hợp Tinh', TAY_KY, 'f'],
    ['Đỗ Nguyên Tiển', 'Bác Sĩ Tinh', DAI_THUONG],
    ['Ô Văn Hóa', 'Lực Sĩ Tinh', DAI_THUONG],
    ['Giao Cách', 'Tấu Thư Tinh', DAI_THUONG],
    ['Hoàng Phi Bưu', 'Hà Khôi Tinh', TAY_KY],
    ['Triệt Địa Phu Nhân', 'Nguyệt Khôi Tinh', DAI_THUONG, 'f'],
    ['Khương Hoàn Sở', 'Đế Xa Tinh', DAI_THUONG],
    ['Hoàng Phi Báo', 'Thiên Tự Tinh', TAY_KY],
    ['Đinh Sách', 'Đế Lộ Tinh', DAI_THUONG],
    ['Ngạc Sùng Vũ', 'Thiên Mã Tinh', DAI_THUONG],
    ['Lý Cẩm', 'Hoàng Ân Tinh', DAI_THUONG],
    ['Tiền Bảo', 'Thiên Y Tinh', DAI_THUONG],
    ['Hoàng Quý Phi', 'Địa Hậu Tinh', DAI_THUONG, 'f'],
    ['Cơ Thúc Đức', 'Trạch Long Tinh', TAY_KY],
    ['Hoàng Minh', 'Phục Long Tinh', TAY_KY],
    ['Lôi Khai', 'Dịch Mã Tinh', DAI_THUONG],
    ['Ngụy Bí', 'Hoàng Phiên Tinh', TAY_KY],
    ['Ngô Khiêm', 'Báo Vĩ Tinh', TAY_KY],
    ['Trương Quế Phương', 'Tang Môn Tinh', DAI_THUONG],
    ['Phong Lâm', 'Điếu Khách Tinh', DAI_THUONG],
    ['Phí Trọng', 'Câu Giảo Tinh', DAI_THUONG],
    ['Vưu Hồn', 'Quyển Thiệt Tinh', DAI_THUONG],
    ['Bành Tuân', 'La Hầu Tinh', DAI_THUONG],
    ['Vương Báo', 'Kế Đô Tinh', DAI_THUONG],
    ['Cơ Thúc Khôn', 'Phi Liêm Tinh', TAY_KY],
    ['Sùng Hầu Hổ', 'Đại Hao Tinh', DAI_THUONG],
    ['Ân Phá Bại', 'Tiểu Hao Tinh', DAI_THUONG],
    ['Khưu Dẫn', 'Quán Sách Tinh', DAI_THUONG, undefined, 1],
    ['Đặng Tú', 'Ngũ Quỷ Tinh', TAY_KY],
    ['Triệu Thăng', 'Dương Nhận Tinh', TAY_KY],
    ['Tôn Diễm Hồng', 'Huyết Quang Tinh', TAY_KY],
    ['Phương Nghĩa Chân', 'Quan Phù Tinh', DAI_THUONG],
    ['Dư Hóa', 'Cô Thần Tinh', TIET],
    ['Quý Khang', 'Thiên Cẩu Tinh', TAY_KY],
    ['Vương Tá', 'Bệnh Phù Tinh', DAI_THUONG],
    ['Trương Phượng', 'Toản Cốt Tinh', DAI_THUONG],
    ['Biện Kim Long', 'Tử Phù Tinh', DAI_THUONG],
    ['Bách Hiển Trung', 'Thiên Bại Tinh', DAI_THUONG],
    ['Trịnh Xuân', 'Phù Trầm Tinh', DAI_THUONG],
    ['Biện Cát', 'Thiên Sát Tinh', DAI_THUONG],
    ['Trần Canh', 'Tuế Sát Tinh', DAI_THUONG],
    ['Từ Phương', 'Tuế Hình Tinh', DAI_THUONG],
    ['Triều Điền', 'Tuế Phá Tinh', TAY_KY],
    ['Cơ Thúc Nghĩa', 'Chúc Hỏa Tinh', TAY_KY],
    ['Mã Trung', 'Huyết Quang Tinh', DAI_THUONG],
    ['Vương Hổ', 'Nguyệt Phá Tinh', DAI_THUONG],
    ['Âu Dương Thuần', 'Vong Thần Tinh', DAI_THUONG],
    ['Thạch Cơ Nương Nương', 'Nguyệt Du Tinh', TIET, 'f'],
    ['Trần Quý Trinh', 'Tử Khí Tinh', TAN_TU, undefined, 2],
    ['Từ Trung', 'Hàm Trì Tinh', DAI_THUONG],
    ['Diêu Trung', 'Nguyệt Yếm Tinh', DAI_THUONG],
    ['Trần Ngô', 'Nguyệt Hình Tinh', DAI_THUONG],
    ['Cao Kế Năng', 'Hắc Sát Tinh', DAI_THUONG],
    ['Trương Khuê', 'Thất Sát Tinh', DAI_THUONG],
    ['Tôn Hợp', 'Ngũ Cùng Tinh', DAI_THUONG],
    ['Ân Hồng', 'Ngũ Cốc Tinh', XIEN, undefined, 2],
    ['Dư Trung', 'Trừ Sát Tinh', TAY_KY],
    ['Kim Đại Thăng', 'Thiên Ôn Tinh', MAI_SON],
    ['Đới Lễ', 'Hoang Vu Tinh', MAI_SON],
    ['Cơ Thúc Lễ', 'Thai Thần Tinh', TAY_KY],
    ['Chu Tử Chân', 'Phục Đoạn Tinh', MAI_SON],
    ['Dương Hiển', 'Phản Ngâm Tinh', MAI_SON],
    ['Diêu Thứ Lương', 'Phục Ngâm Tinh', TAY_KY],
    ['Thường Hạo', 'Đao Châm Tinh', MAI_SON],
    ['Ngô Long', 'Phá Toái Tinh', MAI_SON],
    ['Viên Hồng', 'Tứ Phế Tinh', MAI_SON],
    ['Phòng Cảnh Nguyên', 'Diệt Một Tinh', TAN_TU, undefined, 2],
    ['Bành Tổ Thọ', 'Tuế Yếm Tinh', TAY_KY],
    ['Hoàng Nguyên Tế', 'Tàm Súc Tinh', DAI_THUONG],
    ['Cao Lan Anh', 'Đào Hoa Tinh', DAI_THUONG, 'f'],
    ['Mã Thị', 'Tảo Trửu Tinh', TAN_TU, 'f', 2],
    ['Lý Lương', 'Đại Họa Tinh', TAN_TU, undefined, 2],
    ['Hàn Vinh', 'Lang Tạ Tinh', DAI_THUONG],
    ['Lâm Thiện', 'Phi Ma Tinh', TAY_KY],
    ['Long An Cát', 'Lan Can Tinh', DAI_THUONG],
    ['Thái Loan', 'Phi Đầu Tinh', TAY_KY],
    ['Âu Dương Thiên Lộc', 'Thiên Hình Tinh', DAI_THUONG],
    ['Trần Đồng', 'Thiên La Tinh', DAI_THUONG],
    ['Cơ Thúc Cát', 'Địa Võng Tinh', TAY_KY],
    ['Mai Vũ', 'Thiên Không Tinh', DAI_THUONG],
    ['Mai Đức', 'Địa Không Tinh', DAI_THUONG],
    ['Ngao Bính', 'Hoa Cái Tinh', TAN_TU, undefined, 2],
    ['Chu Tín', 'Thập Ác Tinh', DAI_THUONG],
    ['Kim Thành', 'Âm Thác Tinh', DAI_THUONG],
    ['Mã Thành Long', 'Dương Sai Tinh', TAY_KY],
    ['Công Tôn Đạc', 'Nhẫn Sát Tinh', DAI_THUONG],
    ['Long Tu Hổ', 'Cửu Xú Tinh', XIEN],
    ['Tát Kiên', 'Tam Thi Tinh', TAN_TU, undefined, 2],
    ['Tát Cường', 'Tam Thi Tinh', TAN_TU, undefined, 2],
    ['Tát Dũng', 'Tam Thi Tinh', TAN_TU, undefined, 2],
    ['Dương Phi', 'Hồng Diễm Tinh', DAI_THUONG, 'f'],
    ['Vũ Vinh', 'Lưu Hà Tinh', TAY_KY],
    ['Chu Thăng', 'Quả Tú Tinh', DAI_THUONG],
  ]),

  ...dept('Nhị Thập Bát Tú', TIET, 'Tiên nhân Tiệt Giáo tử trận trong Vạn Tiên Trận', [ // 4 tú Hỏa ở Hỏa Bộ, 4 tú Thủy ở Thủy Bộ
    ['Bách Lâm', 'Giác Mộc Giao', TIET],
    ['Dương Tín', 'Đẩu Mộc Giải', TIET],
    ['Lý Hùng', 'Khuê Mộc Lang', TIET],
    ['Thẩm Canh', 'Tỉnh Mộc Hãn', TIET],
    ['Lý Hoằng', 'Ngưu Kim Ngưu', TIET],
    ['Triệu Bạch Cao', 'Quỷ Kim Dương', TIET],
    ['Trương Hùng', 'Lâu Kim Cẩu', TIET],
    ['Lý Đạo Thông', 'Cang Kim Long', TIET],
    ['Trịnh Nguyên', 'Nữ Thổ Bức', TIET],
    ['Tống Canh', 'Vị Thổ Trĩ', TIET],
    ['Ngô Khôn', 'Liễu Thổ Chương', TIET],
    ['Cao Bính', 'Đê Thổ Lạc', TIET],
    ['Lữ Năng', 'Tinh Nhật Mã', TIET],
    ['Hoàng Thương', 'Mão Nhật Kê', TIET],
    ['Chu Bảo', 'Hư Nhật Thử', TIET],
    ['Diêu Công Bá', 'Phòng Nhật Thố', TIET],
    ['Kim Thằng Dương', 'Tất Nguyệt Ô', TIET],
    ['Hầu Thái Ất', 'Nguy Nguyệt Yến', TIET],
    ['Tô Nguyên', 'Tâm Nguyệt Hồ', TIET],
    ['Tiết Định', 'Trương Nguyệt Lộc', TIET],
  ]),

  ...dept('Tam Thập Lục Thiên Cương', TIET, 'Tiên nhân Tiệt Giáo tử trận trong Vạn Tiên Trận, liệt vào Thiên Cương', [
    ['Cao Diễn', 'Thiên Khôi Tinh', TIET],
    ['Hoàng Chân', 'Thiên Cương Tinh', TIET],
    ['Lư Xương', 'Thiên Cơ Tinh', TIET],
    ['Kỷ Bính', 'Thiên Nhàn Tinh', TIET],
    ['Diêu Công Hiếu', 'Thiên Dũng Tinh', TIET],
    ['Thi Cối', 'Thiên Hùng Tinh', TIET],
    ['Tôn Ất', 'Thiên Mãnh Tinh', TIET],
    ['Lý Báo', 'Thiên Uy Tinh', TIET],
    ['Chu Nghĩa', 'Thiên Anh Tinh', TIET],
    ['Trần Khảm', 'Thiên Quý Tinh', TIET],
    ['Lê Tiên', 'Thiên Phú Tinh', TIET],
    ['Phương Bảo', 'Thiên Mãn Tinh', TIET],
    ['Chiêm Tú', 'Thiên Cô Tinh', TIET],
    ['Lý Hồng Nhân', 'Thiên Thương Tinh', TIET],
    ['Vương Long Mậu', 'Thiên Huyền Tinh', TIET],
    ['Đặng Ngọc', 'Thiên Kiện Tinh', TIET],
    ['Lý Tân', 'Thiên Ám Tinh', TIET],
    ['Từ Chính Đạo', 'Thiên Hựu Tinh', TIET],
    ['Điển Thông', 'Thiên Không Tinh', TIET],
    ['Ngô Húc', 'Thiên Tốc Tinh', TIET],
    ['Lữ Tự Thành', 'Thiên Dị Tinh', TIET],
    ['Nhậm Lai Sính', 'Thiên Sát Tinh', TIET],
    ['Cung Thanh', 'Thiên Vi Tinh', TIET],
    ['Đan Bách Chiêu', 'Thiên Cứu Tinh', TIET],
    ['Cao Khả', 'Thiên Thoái Tinh', TIET],
    ['Thích Thành', 'Thiên Thọ Tinh', TIET],
    ['Vương Hổ', 'Thiên Kiếm Tinh', TIET],
    ['Bốc Đồng', 'Thiên Bình Tinh', TIET],
    ['Diêu Công', 'Thiên Tội Tinh', TIET],
    ['Đường Thiên Chính', 'Thiên Tổn Tinh', TIET],
    ['Thân Lễ', 'Thiên Bại Tinh', TIET],
    ['Văn Kiệt', 'Thiên Lao Tinh', TIET],
    ['Trương Trí Hùng', 'Thiên Tuệ Tinh', TIET],
    ['Tất Đức', 'Thiên Bạo Tinh', TIET],
    ['Lưu Đạt', 'Thiên Khốc Tinh', TIET],
    ['Trình Tam Ích', 'Thiên Xảo Tinh', TIET],
  ]),

  ...dept('Thất Thập Nhị Địa Sát', TIET, 'Tiên nhân Tiệt Giáo tử trận trong Vạn Tiên Trận, liệt vào Địa Sát', [
    ['Trần Kế Chân', 'Địa Khôi Tinh', TIET],
    ['Hoàng Cảnh Nguyên', 'Địa Sát Tinh', TIET],
    ['Giả Thành', 'Địa Dũng Tinh', TIET],
    ['Hô Bách Nhan', 'Địa Kiệt Tinh', TIET],
    ['Lỗ Tu Đức', 'Địa Hùng Tinh', TIET],
    ['Tu Thành', 'Địa Uy Tinh', TIET],
    ['Tôn Tường', 'Địa Anh Tinh', TIET],
    ['Vương Bình', 'Địa Kỳ Tinh', TIET],
    ['Bách Hữu Hoạn', 'Địa Mãnh Tinh', TIET],
    ['Cách Cao', 'Địa Văn Tinh', TIET],
    ['Khảo Cách', 'Địa Chính Tinh', TIET],
    ['Lý Toại', 'Địa Tịch Tinh', TIET],
    ['Lưu Hành', 'Địa Hạp Tinh', TIET],
    ['Hạ Tường', 'Địa Cường Tinh', TIET],
    ['Dư Huệ', 'Địa Ám Tinh', TIET],
    ['Bào Long', 'Địa Phụ Tinh', TIET],
    ['Lỗ Chi', 'Địa Hội Tinh', TIET],
    ['Hoàng Bính Khánh', 'Địa Tá Tinh', TIET],
    ['Trương Kỳ', 'Địa Hựu Tinh', TIET],
    ['Quách Tị', 'Địa Linh Tinh', TIET],
    ['Kim Nam Đạo', 'Địa Thú Tinh', TIET],
    ['Trần Nguyên', 'Địa Vi Tinh', TIET],
    ['Xa Khôn', 'Địa Tuệ Tinh', TIET],
    ['Tang Thành Đạo', 'Địa Bạo Tinh', TIET],
    ['Chu Canh', 'Địa Mặc Tinh', TIET],
    ['Tề Công', 'Địa Xương Tinh', TIET],
    ['Hoắc Chi Nguyên', 'Địa Cuồng Tinh', TIET],
    ['Diệp Trung', 'Địa Phi Tinh', TIET],
    ['Cố Tông', 'Địa Tẩu Tinh', TIET],
    ['Lý Xương', 'Địa Xảo Tinh', TIET],
    ['Phương Cát', 'Địa Minh Tinh', TIET],
    ['Từ Cát', 'Địa Tiến Tinh', TIET],
    ['Phàn Hoán', 'Địa Thoái Tinh', TIET],
    ['Trác Công', 'Địa Mãn Tinh', TIET],
    ['Khổng Thành', 'Địa Toại Tinh', TIET],
    ['Diêu Kim Tú', 'Địa Chu Tinh', TIET],
    ['Ninh Tam Ích', 'Địa Ẩn Tinh', TIET],
    ['Dư Tri', 'Địa Dị Tinh', TIET],
    ['Đồng Trinh', 'Địa Lý Tinh', TIET],
    ['Viên Đỉnh Tương', 'Địa Tuấn Tinh', TIET],
    ['Uông Tường', 'Địa Lạc Tinh', TIET],
    ['Cảnh Nhan', 'Địa Tiệp Tinh', TIET],
    ['Hình Tam Loan', 'Địa Tốc Tinh', TIET],
    ['Khương Trung', 'Địa Trấn Tinh', TIET],
    ['Khổng Thiên Triệu', 'Địa Ky Tinh', TIET],
    ['Lý Dược', 'Địa Ma Tinh', TIET],
    ['Cung Thiến', 'Địa Yêu Tinh', TIET, 'f'],
    ['Đoàn Thanh', 'Địa U Tinh', TIET],
    ['Môn Đạo Chính', 'Địa Phục Tinh', TIET],
    ['Tổ Lâm', 'Địa Tích Tinh', TIET],
    ['Tiêu Điện', 'Địa Không Tinh', TIET],
    ['Ngô Tứ Ngọc', 'Địa Cô Tinh', TIET],
    ['Khuông Ngọc', 'Địa Toàn Tinh', TIET],
    ['Thái Công', 'Địa Đoản Tinh', TIET],
    ['Lam Hổ', 'Địa Giác Tinh', TIET],
    ['Tống Lộc', 'Địa Tù Tinh', TIET],
    ['Quan Bân', 'Địa Tàng Tinh', TIET],
    ['Long Thành', 'Địa Bình Tinh', TIET],
    ['Hoàng Ô', 'Địa Tổn Tinh', TIET],
    ['Khổng Đạo Linh', 'Địa Nô Tinh', TIET],
    ['Trương Hoán', 'Địa Sát Tinh', TIET],
    ['Lý Tín', 'Địa Ác Tinh', TIET],
    ['Từ Sơn', 'Địa Hồn Tinh', TIET],
    ['Cát Phương', 'Địa Số Tinh', TIET],
    ['Tiêu Long', 'Địa Âm Tinh', TIET],
    ['Tần Tường', 'Địa Hình Tinh', TIET],
    ['Vũ Diễn Công', 'Địa Tráng Tinh', TIET],
    ['Phạm Bân', 'Địa Liệt Tinh', TIET],
    ['Diệp Cảnh Xương', 'Địa Kiện Tinh', TIET],
    ['Diêu Diệp', 'Địa Hao Tinh', TIET],
    ['Tôn Cát', 'Địa Tặc Tinh', TIET],
    ['Trần Mộng Canh', 'Địa Cẩu Tinh', TIET],
  ]),

  ...dept('Cửu Diệu Tinh Quan', DAI_THUONG, 'Tướng lĩnh Đại Thương tử trận trước các cửa ải', [
    ['Sùng Ứng Bưu', 'Cửu Diệu Tinh Quan', DAI_THUONG],
    ['Cao Hệ Bình', 'Cửu Diệu Tinh Quan', TIET],
    ['Hàn Bằng', 'Cửu Diệu Tinh Quan', TIET],
    ['Lý Tế', 'Cửu Diệu Tinh Quan', TIET],
    ['Vương Phong', 'Cửu Diệu Tinh Quan', TIET],
    ['Lưu Cấm', 'Cửu Diệu Tinh Quan', TIET],
    ['Vương Trữ', 'Cửu Diệu Tinh Quan', TIET],
    ['Bành Cửu Nguyên', 'Cửu Diệu Tinh Quan', TIET],
    ['Lý Tam Ích', 'Cửu Diệu Tinh Quan', TIET],
  ]),

  ...dept('Thủy Bộ', DAI_THUONG, 'Tả quân thượng tướng Đại Thương, chết cóng giữa trận tuyết Khương Tử Nha gọi xuống Kỳ Sơn', [
    ['Lỗ Hùng', 'Bắc Đẩu Ngũ Khí Thủy Đức Tinh Quân', DAI_THUONG, undefined, 0],
  ]),
  ...dept('Thủy Bộ · Tứ Tú', TIET, 'Tiên nhân Tiệt Giáo tử trận trong Vạn Tiên Trận, thuộc Thủy Bộ dưới quyền Thủy Đức Tinh Quân', [
    ['Dương Chân', 'Cơ Thủy Báo', TIET],
    ['Tôn Bảo', 'Sâm Thủy Viên', TIET],
    ['Hồ Đạo Nguyên', 'Chẩn Thủy Dẫn', TIET],
    ['Phương Cát Thanh', 'Bích Thủy Du', TIET],
  ]),

  ...dept('Thái Tuế Bộ', DAI_THUONG, 'Người hai bên Thương – Chu tử trận, giữ các thần vị tuần du ngày đêm năm tháng', [
    ['Ân Giao', 'Chấp Niên Tuế Quân Thái Tuế', XIEN, undefined, 0],
    ['Dương Nhậm', 'Giáp Tý Thái Tuế', XIEN],
    ['Ôn Lương', 'Nhật Du Thần', DAI_THUONG],
    ['Kiều Khôn', 'Dạ Du Thần', TAY_KY, undefined, 1],
    ['Hàn Độc Long', 'Tăng Phúc Thần', XIEN],
    ['Tiết Ác Hổ', 'Tổn Phúc Thần', XIEN],
    ['Phương Bật', 'Hiển Đạo Thần', TAY_KY],
    ['Phương Tướng', 'Khai Lộ Thần', TAY_KY],
    ['Lý Bính', 'Trực Niên Thần', TIET],
    ['Hoàng Thừa Ất', 'Trực Nguyệt Thần', TIET],
    ['Chu Đăng', 'Trực Nhật Thần', TIET],
    ['Lưu Hồng', 'Trực Thời Thần', TIET],
  ]),

  ...dept('Tứ Thánh Đại Nguyên Soái', TIET, 'Tứ Thánh Cửu Long Đảo, tử trận dưới chân thành Tây Kỳ', [
    ['Vương Ma', 'Trấn Thủ Linh Tiêu Bảo Điện Tứ Thánh Đại Nguyên Soái', TIET],
    ['Dương Sâm', 'Trấn Thủ Linh Tiêu Bảo Điện Tứ Thánh Đại Nguyên Soái', TIET],
    ['Cao Hữu Càn', 'Trấn Thủ Linh Tiêu Bảo Điện Tứ Thánh Đại Nguyên Soái', TIET],
    ['Lý Hưng Bá', 'Trấn Thủ Linh Tiêu Bảo Điện Tứ Thánh Đại Nguyên Soái', TIET],
  ]),

  ...dept('Huyền Đàn Bộ', TIET, 'Người theo Triệu Công Minh và những kẻ đoạt bảo tử trận ở Tây Kỳ', [
    ['Triệu Công Minh', 'Kim Long Như Ý Chính Nhất Long Hổ Huyền Đàn Chân Quân', TIET, undefined, 0],
    ['Tiêu Thăng', 'Chiêu Bảo Thiên Tôn', TAY_KY, undefined, 1],
    ['Tào Bảo', 'Nạp Trân Thiên Tôn', TAY_KY, undefined, 1],
    ['Trần Cửu Công', 'Chiêu Tài Sứ Giả', TIET],
    ['Diêu Thiếu Tư', 'Lợi Thị Tiên Quan', TIET],
  ]),

  ...dept('Tam Tiêu', TIET, 'Ba nữ tiên Tam Tiên Đảo, bày Cửu Khúc Hoàng Hà Trận trả thù cho huynh trưởng', [
    ['Vân Tiêu', 'Cảm Ứng Tùy Thế Tiên Cô Chính Thần', TIET, 'f', 0],
    ['Quỳnh Tiêu', 'Cảm Ứng Tùy Thế Tiên Cô Chính Thần', TIET, 'f', 0],
    ['Bích Tiêu', 'Cảm Ứng Tùy Thế Tiên Cô Chính Thần', TIET, 'f', 0],
  ]),

  ...dept('Phân Thủy Tướng Quân', XIEN, 'Từng nhập Xiển Giáo rồi phản sư môn, đi khắp nơi chiêu mời tiên gia trợ Thương; bị lấp vào mắt biển Bắc Hải', [
    ['Thân Công Báo', 'Phân Thủy Tướng Quân', XIEN, undefined, 0],
  ]),

  ...dept('Đậu Bộ', DAI_THUONG, 'Gia tộc Dư Hóa Long trấn Đồng Quan, gieo đậu chẩn xuống quân Chu', [
    ['Dư Hóa Long', 'Chủ Đậu Bích Hà Nguyên Quân', DAI_THUONG, undefined, 0],
    ['Kim Phu Nhân', 'Vệ Phòng Thánh Mẫu Nguyên Quân', DAI_THUONG, 'f'],
    ['Dư Đạt', 'Đông Phương Chủ Đậu Chính Thần', DAI_THUONG],
    ['Dư Triệu', 'Tây Phương Chủ Đậu Chính Thần', DAI_THUONG],
    ['Dư Quang', 'Nam Phương Chủ Đậu Chính Thần', DAI_THUONG],
    ['Dư Tiên', 'Bắc Phương Chủ Đậu Chính Thần', DAI_THUONG],
    ['Dư Đức', 'Trung Ương Chủ Đậu Chính Thần', DAI_THUONG, undefined, 1],
  ]),

  ...dept('Tam Sơn Chính Thần', XIEN, 'Con trai Hoàng Phi Hổ, đệ tử Thanh Hư Đạo Đức Chân Quân, tử trận ở Dẫn Trì', [
    ['Hoàng Thiên Hóa', 'Tam Sơn Chính Thần Bỉnh Linh Công', XIEN, undefined, 0],
  ]),

  ...dept('Tứ Đại Thiên Vương', DAI_THUONG, 'Ma gia tứ tướng trấn Giai Mộng Quan, tử trận trước Tây Kỳ', [
    ['Ma Lễ Thanh', 'Tăng Trưởng Thiên Vương', DAI_THUONG],
    ['Ma Lễ Hồng', 'Quảng Mục Thiên Vương', DAI_THUONG],
    ['Ma Lễ Hải', 'Đa Văn Thiên Vương', DAI_THUONG],
    ['Ma Lễ Thọ', 'Trì Quốc Thiên Vương', DAI_THUONG],
  ]),

  ...dept('Hanh Ha Nhị Tướng', DAI_THUONG, 'Hai tướng có thuật hanh ha, một theo Chu một giữ Thương, cùng chết dưới thành Mãnh Tân', [
    ['Trịnh Luân', 'Trấn Thủ Tây Thích Sơn Môn Hanh Tướng', TAY_KY],
    ['Trần Kỳ', 'Trấn Thủ Tây Thích Sơn Môn Ha Tướng', DAI_THUONG],
  ]),
];

/** Mọi thần chức trong bảng: chức phụ cho người tử trận ngoài danh sách không được trùng với các chức này. */
export const FENGSHEN_OFFICES = new Set(FENGSHEN_ROSTER.map((god) => god.office));

/** Số thần vị trong bảng. */
export const FENGSHEN_TOTAL = FENGSHEN_ROSTER.length;
