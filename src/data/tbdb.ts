// Thiên tài địa bảo theo truyền thuyết Trung Hoa / tiên hiệp. Mỗi thứ có cảnh giới cần đạt để dùng (realm) — giới nào
// có thứ đó tùy trần sức mạnh của giới: thứ gì cần cảnh giới cao hơn trần của giới thì giới ấy không sinh ra được.
// Bảng của giới w chỉ ghi địa bảo nằm trong khoảng trần (cap(w-1), cap(w)].
import { WORLD_CAP, LAST_WORLD } from './core';

export type TbKind = 'thảo' | 'quả' | 'mộc' | 'khoáng' | 'thủy' | 'hoa';
export interface Tbdb { n: string; kind: TbKind; realm: number; d: string }
export const TBDB: Tbdb[] = [
  // ---- Thương Lan (trần Độ Kiếp 9) ----
  { n: 'Hà Thủ Ô Trăm Năm', kind: 'thảo', realm: 2, d: 'Củ hình người, trăm năm thành tinh. Bổ huyết, đen tóc, kéo thọ.' },
  { n: 'Huyết Sâm Trăm Năm', kind: 'thảo', realm: 3, d: 'Sâm đỏ như máu, mọc nơi có người chết oan. Hồi khí huyết trong một đêm.' },
  { n: 'Linh Chi Ngàn Năm', kind: 'thảo', realm: 3, d: 'Nấm tía trên gỗ mục ngàn năm, Bạch Xà từng trộm để cứu Hứa Tiên.' },
  { n: 'Thiên Sơn Tuyết Liên', kind: 'hoa', realm: 4, d: 'Sen nở trên tuyết vạn năm không tan. Giải mọi hàn độc.' },
  { n: 'Hồng Hoa Tử Chi', kind: 'thảo', realm: 4, d: 'Chi tía nhụy đỏ, chỉ mọc dưới sấm sét. Trợ Kết Đan.' },
  { n: 'Băng Phách Hàn Ngọc', kind: 'khoáng', realm: 5, d: 'Ngọc trong lòng băng nguyên, lạnh thấu xương, luyện khí băng hệ đệ nhất.' },
  { n: 'Long Huyết Linh Chi', kind: 'thảo', realm: 5, d: 'Linh chi mọc nơi giao long đổ máu, ăn vào gân cốt như rồng.' },
  { n: 'Phượng Vĩ Trúc', kind: 'mộc', realm: 5, d: 'Trúc đuôi phượng, chẻ ra có vân lửa. Làm bút phù thượng hạng.' },
  { n: 'Cửu Diệp Linh Chi', kind: 'thảo', realm: 6, d: 'Chín lá chín màu, mỗi lá một hệ. Đan sư tranh nhau tới đổ máu.' },
  { n: 'Vạn Niên Hà Thủ Ô', kind: 'thảo', realm: 6, d: 'Hà thủ ô vạn năm, đã biết chạy. Phải dùng chỉ đỏ buộc mới đào được.' },
  { n: 'Tử Kim Tinh', kind: 'khoáng', realm: 6, d: 'Vàng tía trong lõi núi lửa đã tắt. Luyện pháp bảo Địa giai.' },
  { n: 'Cửu Khúc Linh Sâm', kind: 'thảo', realm: 7, d: 'Rễ uốn chín khúc như rồng, mỗi khúc một ngàn năm. Cải tử hoàn sinh.' },
  { n: 'Long Lân Quả', kind: 'quả', realm: 8, d: 'Quả vảy rồng trên cây mọc từ xương rồng. Ăn một quả, thân thể hóa long.' },
  { n: 'Thái Ất Tinh Kim', kind: 'khoáng', realm: 8, d: 'Kim loại rơi từ sao, nặng gấp trăm lần sắt. Nguyên liệu tiên khí.' },
  { n: 'Địa Tâm Hỏa Liên', kind: 'hoa', realm: 9, d: 'Sen lửa nở trong lòng đất, ba ngàn năm một đóa. Luyện thể thành kim cương bất hoại.' },
  { n: 'Bất Tử Thảo', kind: 'thảo', realm: 9, d: 'Cỏ trường sinh trên Côn Lôn, Tây Vương Mẫu từng ban cho Hậu Nghệ. Một ngọn đổi một mạng.' },
  // ---- Linh Giới (trần 12) ----
  { n: 'Bồ Đề Tử', kind: 'quả', realm: 10, d: 'Hạt từ cây Bồ Đề nơi Phật thành đạo. Ngồi dưới nó một ngày bằng tu trăm năm.' },
  { n: 'Tử Linh Tiên Thảo', kind: 'thảo', realm: 10, d: 'Cỏ tía chỉ mọc nơi có tiên khí, nền của mọi tiên đan.' },
  { n: 'Huyền Thiết Tinh', kind: 'khoáng', realm: 10, d: 'Sắt đen ngàn năm dưới đáy biển, Định Hải Thần Châm luyện từ thứ này.' },
  { n: 'Hỏa Phượng Hoa', kind: 'hoa', realm: 11, d: 'Hoa nở nơi phượng hoàng rũ lông, cánh hoa cháy không tàn.' },
  { n: 'Cửu Chuyển Hoàn Hồn Thảo', kind: 'thảo', realm: 11, d: 'Gọi hồn đã rời xác chín ngày trở về.' },
  { n: 'Thiên Tằm Linh Lụa', kind: 'mộc', realm: 11, d: 'Tơ của tằm trời ăn lá Phù Tang, dệt áo không đao kiếm nào xuyên.' },
  { n: 'Lôi Kích Mộc', kind: 'mộc', realm: 12, d: 'Cây bị sét đánh chín lần mà không chết, trong thớ gỗ còn lôi quang.' },
  { n: 'Vạn Niên Tuyết Liên', kind: 'hoa', realm: 12, d: 'Tuyết liên vạn năm, một cánh hoa luyện ra Băng Tâm Đan.' },
  { n: 'Huyền Băng Ngọc Tủy', kind: 'thủy', realm: 12, d: 'Tủy ngọc chảy trong lòng băng vạn năm, uống vào linh căn tinh thuần một bậc.' },
  // ---- Tiên Giới (trần 15) ----
  { n: 'Bàn Đào Ba Ngàn Năm', kind: 'quả', realm: 13, d: 'Đào trong Bàn Đào Viên của Vương Mẫu, ba ngàn năm một lần chín. Ăn vào thành tiên.' },
  { n: 'Long Nhãn Tiên Quả', kind: 'quả', realm: 13, d: 'Quả như mắt rồng, mở ra mắt thứ ba nhìn thấu ảo ảnh.' },
  { n: 'Phượng Hoàng Niết Bàn Hoa', kind: 'hoa', realm: 14, d: 'Nở từ tro phượng hoàng trọng sinh, sống lại một lần từ cõi chết.' },
  { n: 'Bàn Đào Sáu Ngàn Năm', kind: 'quả', realm: 14, d: 'Đào sáu ngàn năm, ăn vào bay lên trời, trường sinh bất lão.' },
  { n: 'Thái Dương Chân Hỏa Thạch', kind: 'khoáng', realm: 14, d: 'Đá rơi từ xe mặt trời, giữ trong tay là Thái Dương Chân Hỏa.' },
  { n: 'Nhân Sâm Quả', kind: 'quả', realm: 15, d: 'Quả hình trẻ con trên cây Vạn Thọ Thảo Hoàn Đan của Trấn Nguyên Tử. Ngửi một cái sống ba trăm sáu mươi năm.' },
  { n: 'Bàn Đào Chín Ngàn Năm', kind: 'quả', realm: 15, d: 'Đào chín ngàn năm, thọ cùng trời đất, ngang với nhật nguyệt.' },
  { n: 'Long Tủy Ngọc', kind: 'khoáng', realm: 15, d: 'Ngọc kết từ tủy chân long, nắm trong tay long uy bốn phía.' },
  // ---- Thần Giới (trần 18) ----
  { n: 'Phù Tang Mộc', kind: 'mộc', realm: 16, d: 'Cây thần nơi mặt trời mọc, mười mặt trời đậu trên cành. Một nhánh luyện thành thần cung.' },
  { n: 'Nhược Mộc', kind: 'mộc', realm: 16, d: 'Cây nơi mặt trời lặn, lá đỏ như lửa chiều. Gỗ nhẹ hơn khí.' },
  { n: 'Nguyệt Quế', kind: 'mộc', realm: 16, d: 'Quế trên Quảng Hàn, Ngô Cương chặt mãi không đổ. Vỏ cây là thần dược.' },
  { n: 'Tiên Thiên Linh Căn Bồ Đề', kind: 'mộc', realm: 17, d: 'Một trong các tiên thiên linh căn của Hồng Hoang, Chuẩn Đề đạo nhân từng giữ.' },
  { n: 'Kiến Mộc', kind: 'mộc', realm: 17, d: 'Cây thang trời ở Đô Quảng, thần nhân theo đó lên xuống giữa trời và đất.' },
  { n: 'Thái Ất Chân Thủy', kind: 'thủy', realm: 17, d: 'Nước tiên thiên, một giọt sinh vạn vật, một giọt diệt vạn vật.' },
  { n: 'Côn Lôn Thần Ngọc', kind: 'khoáng', realm: 18, d: 'Ngọc từ gốc Côn Lôn, luyện ra Côn Lôn Kính soi khắp tam giới.' },
  { n: 'Tạo Hóa Thần Thủy', kind: 'thủy', realm: 18, d: 'Nước trong Tạo Hóa Ngọc Điệp, tưới cây khô mọc lại, rưới xương khô sống dậy.' },
  // ---- Hồng Hoang (trần 20) ----
  { n: 'Thế Giới Thụ Chi', kind: 'mộc', realm: 19, d: 'Cành của cây chống đỡ thế giới, trồng xuống thành một tiểu thế giới.' },
  { n: 'Thái Sơ Thần Kim', kind: 'khoáng', realm: 19, d: 'Kim loại sinh trước khi có ngũ hành, không hệ nào khắc nổi.' },
  { n: 'Hỗn Độn Thanh Liên', kind: 'hoa', realm: 20, d: 'Sen xanh sinh trong Hỗn Độn, nở thành Hồng Hoang. Một cánh là một tiên thiên chí bảo.' },
  { n: 'Tiên Thiên Hồng Mông Tử Khí', kind: 'thủy', realm: 20, d: 'Chín đạo tử khí Hồng Quân chia cho các thánh. Có nó mới chứng Hỗn Nguyên.' },
  { n: 'Bàn Cổ Chân Huyết', kind: 'thủy', realm: 20, d: 'Máu của Bàn Cổ khai thiên, rơi xuống thành mười hai Tổ Vu.' },
  // ---- Hỗn Độn (trần 21) ----
  { n: 'Hỗn Độn Châu', kind: 'khoáng', realm: 21, d: 'Hạt châu từ thuở hỗn độn chưa phân, nắm trong tay nắm một phần đại đạo.' },
  { n: 'Hồng Mông Linh Bảo Mầm', kind: 'mộc', realm: 21, d: 'Mầm sinh ra linh bảo tiên thiên, Thiên Cơ Lâu chỉ biết có ba mầm trong Hỗn Độn.' },
  { n: 'Đại Đạo Chi Quả', kind: 'quả', realm: 21, d: 'Quả kết trên Đại Đạo, ăn vào thấy được điểm cuối của mọi con đường. Kẻ giữ Đại Đạo canh nó.' },
];
/** Trần sức mạnh của giới w (0 nếu w < 0). */
const cap = (w: number) => (w < 0 ? 0 : WORLD_CAP[Math.min(w, LAST_WORLD)]);
/** Địa bảo của riêng giới w: cần cảnh giới nằm trong (trần giới dưới, trần giới này]. */
export const tbdbOf = (w: number) => TBDB.filter((x) => x.realm > cap(w - 1) && x.realm <= cap(w));
export const TB_KIND_N: Record<TbKind, string> = { thảo: 'Linh thảo', quả: 'Linh quả', mộc: 'Linh mộc', khoáng: 'Linh khoáng', thủy: 'Linh dịch', hoa: 'Linh hoa' };
export const TB_KIND_C: Record<TbKind, string> = { thảo: '#4f7a55', quả: '#b0392b', mộc: '#8a6a3f', khoáng: '#6a4f98', thủy: '#35627e', hoa: '#b8558f' };
