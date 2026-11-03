// Quản lý hệ thống Thần Triều / Thánh Địa cho 4 Thần Giới (Thiên Đình, Địa Phủ, Yêu Giới, Linh Sơn):
// Tiên chức theo chuẩn truyền thuyết thần thoại Trung Hoa:
// - Địa Phủ: Phong Đô Đại Đế Quân > Thập Điện Diêm La (Tần Quảng Vương, Diêm La Vương, Chuyển Luân Vương... ngang hàng nhau, mỗi điện có nhánh thăng chức riêng).
// - Thiên Đình: Hạo Thiên Ngọc Hoàng Đại Đế > Tứ Đại Thống Soái / Chân Quân (Hiển Thánh Chân Quân, Thác Tháp Thiên Vương, Thiên Bồng Nguyên Soái, Huyền Đô...).
// - Yêu Giới: Thái Cổ Yêu Hoàng > Thất Đại Thánh (Tề Thiên Đại Thánh, Bình Thiên Đại Thánh, Hỗn Thiên Đại Thánh...).
// - Linh Sơn: Tây Thiên Phật Tổ Như Lai > Tứ Đại Bồ Tát & Thập Bát La Hán (Quan Thế Âm, Văn Thù, Địa Tạng, Hàng Long...).
import { s } from './state';
import { type CelestialId, CELESTIAL, type COfficeView } from '../data/celestial';
import { REALMS, type El } from '../data/core';
import { effRi, addItem, addGear, bagFree, count, removeItem, itemName } from './char';
import { addLog } from './core';
import { mkGear, gearPrice, type Gear, TECHS, SKILLS, TAMPHAP, learnReq } from '../data/items';
import { PHAPQUYET } from '../data/spirit';
import { seeded, hashStr, fmt, pick, ch, clamp, yearsTxt } from '../core/util';
import { fight, fightSummary, type FightResult } from './combat';
import { passTime, cultivateTurn, addProg, mark, setLoc } from './core';
import { cultRate, M, itemTier, itemPrice } from './char';
import type { Scene } from './actions';
import type { Outcome, Choice } from './events';

export interface CelestialRankInfo {
  title: string;
  minContrib: number;
  minRealm: number;
  salaryStones: number;
  salaryContrib: number;
  desc: string;
}

export interface CelestialBranchInfo {
  id: string;
  name: string;
  hall: string; // Tên điện / đạo tràng / sơn đầu
  leader: string; // Tên vị lãnh đạo ngang hàng
  desc: string;
  ranks: CelestialRankInfo[];
}

export const CELESTIAL_BRANCHES: Record<CelestialId, CelestialBranchInfo[]> = {
  diaphu: [
    {
      id: 'tanquang',
      name: 'Điện Thứ Nhất · Tần Quảng Vương Phủ',
      hall: 'Nghiệp Cảnh Đài & Sơ Thẩm Điện',
      leader: 'Tần Quảng Vương',
      desc: 'Chưởng quản sổ Sinh Tử nhân gian, Nghiệp Cảnh Đài soi tỏ thiện ác, định đoạt thọ yểu cát hung.',
      ranks: [
        { title: 'U Hồn U Cốc', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Vong linh mới xuống Hoàng Tuyền, tự do vãng lai dưới chân Quỷ Môn Quan.' },
        { title: 'Dẫn Hồn Quỷ Sai', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Cầm bài dẫn hồn, dẫn dắt vong hồn qua Hoàng Tuyền Lộ tới công đường sơ thẩm.' },
        { title: 'Nghiệp Cảnh Đài Chấp Sự', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Trông coi Nghiệp Cảnh Đài bằng gương báu soi rọi công tội kiếp trước của hồn phách.' },
        { title: 'Tần Quảng Phán Quan', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Chấp bút son tra xét sổ bộ, cùng Điện Chủ sơ thẩm vạn linh dương thế.' },
        { title: 'Đệ Nhất Điện · Tần Quảng Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La tối cao, nắm lệnh bài quyền uy đệ nhất điện âm ty.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'sogiang',
      name: 'Điện Thứ Nhị · Sở Giang Vương Phủ',
      hall: 'Hoạt Đại Địa Ngục & Hàn Băng Trì',
      leader: 'Sở Giang Vương',
      desc: 'Cai quản Hoạt Đại Địa Ngục cùng Đao Sơn Băng Trì, trừng phạt kẻ làm thương tổn sinh linh, cướp đoạt lừa gạt.',
      ranks: [
        { title: 'Hàn Băng Thính Đạo Giả', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Linh hồn tu trì tại bờ Hàn Băng Trì, lắng nghe tiếng chuông kinh âm ty.' },
        { title: 'Đao Sơn Áp Giải Sai', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Quỷ sai áp giải tội hồn qua ngọn núi Đao Sơn chông gai.' },
        { title: 'Hàn Trì Chấp Pháp Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Chấp chưởng hàn băng linh trượng, tôi luyện thần hồn kiên định bất hoại.' },
        { title: 'Hoạt Đại Ngục Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lĩnh mười vạn quỷ tốt chấp pháp nơi Hoạt Đại Ngục uy nghiêm.' },
        { title: 'Đệ Nhị Điện · Sở Giang Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, chưởng quản điện thứ hai âm ty.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'tongde',
      name: 'Điện Thứ Tam · Tống Đế Vương Phủ',
      hall: 'Hắc Thằng Địa Ngục & Khổ Hình Điện',
      leader: 'Tống Đế Vương',
      desc: 'Cai quản Hắc Thằng Đại Địa Ngục, trừng trị kẻ ngỗ nghịch bất hiếu, khi sư diệt tổ, xúi giục kiện tụng thị phi.',
      ranks: [
        { title: 'U Minh Khổ Hạnh Nhân', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Vong linh sám hối tiền khiên, gột rửa nghiệp chướng chốn âm ti.' },
        { title: 'Hắc Thằng Quỷ Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Thiết giáp quỷ binh tay cầm thừng đen tróc nã kẻ phản nghịch.' },
        { title: 'Giám Hình Phán Quan', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Xem xét phân minh tội trạng phản bội, thưởng phạt công minh không thiên vị.' },
        { title: 'Hắc Thằng Ngục Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Chưởng quản toàn bộ cấm chế và xích sắt hắc thiết nơi ngục sâu.' },
        { title: 'Đệ Tam Điện · Tống Đế Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, danh xưng thiết diện vô tư của điện thứ ba.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'nguquan',
      name: 'Điện Thứ Tứ · Ngũ Quan Vương Phủ',
      hall: 'Hợp Đại Địa Ngục & Nghiệp Cân Điện',
      leader: 'Ngũ Quan Vương',
      desc: 'Chấp chưởng bảo vật Nghiệp Cân, cân đo tội phúc công đức tơ hào không sai, trừng phạt kẻ tham ô dối lừa.',
      ranks: [
        { title: 'Lượng Tội Hành Giả', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Hành hương đến trước đài Nghiệp Cân chiêm nghiệm lẽ thiện ác.' },
        { title: 'Cân Tội Quỷ Lại', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Phụ trách khiêng quả cân công đức, đối chiếu thiện hạnh dương trần.' },
        { title: 'Nghiệp Cân Chấp Pháp Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Trực tiếp đứng bên Nghiệp Cân định tội, một tấc thiện ác rõ như ban ngày.' },
        { title: 'Hợp Đại Ngục Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lĩnh hình cụ đệ tứ điện, răn đe kẻ gian thương buôn gian bán lận.' },
        { title: 'Đệ Tứ Điện · Ngũ Quan Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, chưởng quản cán cân công lý của đệ tứ điện.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'diemla',
      name: 'Điện Thứ Ngũ · Diêm La Vương Phủ',
      hall: 'Vọng Hương Đài & Khiếu Hoán Ngục',
      leader: 'Diêm La Vương',
      desc: 'Chí công vô tư, cai quản Khiếu Hoán Đại Địa Ngục và Vọng Hương Đài cho hồn nhìn về quê nhà lần cuối.',
      ranks: [
        { title: 'U Hồn Vãng Khách', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Hành hương nơi Phong Đô Thành, chờ đợi gọi tên vào đại điện xét xử.' },
        { title: 'Tuần Sát Âm Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Thiết giáp âm binh tuần phòng nghiêm ngặt quanh Khiếu Hoán Ngục.' },
        { title: 'Vọng Hương Đài Chấp Pháp', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Giữ trật tự trên Vọng Hương Đài, cho hồn phách ngắm nhìn quê nhà đúng một khắc.' },
        { title: 'Khiếu Hoán Ngục Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Chấp chưởng hình cụ đại ngục, răn đe tà ma phản trắc chốn âm ti.' },
        { title: 'Đệ Ngũ Điện · Diêm La Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, danh chấn tam giới bởi đức độ và thiết diện vô tư.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'bienthanh',
      name: 'Điện Thứ Lục · Biện Thành Vương Phủ',
      hall: 'Đại Khiếu Hoán Ngục & Uổng Tử Thành',
      leader: 'Biện Thành Vương',
      desc: 'Cai quản Đại Khiếu Hoán Đại Địa Ngục và Uổng Tử Thành, bảo bọc linh hồn chết oan và trừng trị kẻ báng bổ thần linh.',
      ranks: [
        { title: 'Uổng Tử Cô Hồn', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Vong linh oan ức nương nhờ Uổng Tử Thành tìm kiếm công lý.' },
        { title: 'Thành Trì Trấn Thủ Sai', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Tuần tra bốn bức tường thành Uổng Tử, xoa dịu oán khí âm hồn.' },
        { title: 'Giải Oan Phán Ty', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Xem xét sớ tấu oan khuất, định án rõ ràng cho kẻ bị hàm oan.' },
        { title: 'Uổng Tử Thành Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Quản lý toàn bộ ức vạn sinh linh cư ngụ trong Uổng Tử Thành.' },
        { title: 'Đệ Lục Điện · Biện Thành Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, nắm lệnh bài đệ lục điện âm ty.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'thaison',
      name: 'Điện Thứ Thất · Thái Sơn Vương Phủ',
      hall: 'Nhiệt Não Địa Ngục & Đổng Hoằng Điện',
      leader: 'Thái Sơn Vương',
      desc: 'Coi Nhiệt Não Đại Địa Ngục, trừng phạt kẻ quật mồ cướp mả, xâm phạm di cốt tiền nhân và phản bội đồng đạo.',
      ranks: [
        { title: 'Âm Ty Du Thần', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tu sĩ đi lại âm giới tìm kiếm cơ duyên âm sát.' },
        { title: 'Thiết Giáp Quỷ Tốt', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Chiến sĩ tay cầm xiềng xích sắt đen phong tỏa lối vào hắc ngục.' },
        { title: 'Trấn Hồn Phán Ty', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Chấp chưởng linh phù giam giữ ác hồn gây rối tam giới.' },
        { title: 'Nhiệt Não Điện Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Điều phối trừng phạt ngục tốt nơi hắc địa ngục sâu thẳm.' },
        { title: 'Đệ Thất Điện · Thái Sơn Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, uy danh như núi Thái Sơn sừng sững trấn âm ty.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'dothi',
      name: 'Điện Thứ Bát · Đô Thị Vương Phủ',
      hall: 'Đại Nhiệt Não Ngục & Bạt Thiệt Điện',
      leader: 'Đô Thị Vương',
      desc: 'Cai quản Đại Nhiệt Não Đại Địa Ngục và Bạt Thiệt Điện, trừng trị kẻ khẩu nghiệp bất lương, dối gạt chia rẽ gia đình người khác.',
      ranks: [
        { title: 'Trừng Khẩu Khổ Tu Tăng', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Vong linh tu trì khẩu đức nơi đệ bát điện âm ty.' },
        { title: 'Chấp Hình Quỷ Lại', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Quỷ lại cầm kìm thiết giáp thực thi môn quy âm luật nghiêm minh.' },
        { title: 'Khẩu Nghiệp Tra Sát Ty', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Soi xét từng lời ăn tiếng nói và thư từ lừa đảo hại người trần gian.' },
        { title: 'Đại Nhiệt Não Ngục Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lĩnh biển lửa luyện hồn của đệ bát điện uy vũ.' },
        { title: 'Đệ Bát Điện · Đô Thị Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, chưởng quản đệ bát điện cõi âm.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'binhdang',
      name: 'Điện Thứ Cửu · Bình Đẳng Vương Phủ',
      hall: 'A Tỳ Địa Ngục & Vô Gián Hắc Ám',
      leader: 'Bình Đẳng Vương',
      desc: 'Cai quản A Tỳ Đại Địa Ngục (Vô Gián Địa Ngục), nơi giam cầm và trừng phạt kẻ đại nghịch bất đạo, tội ác tày trời.',
      ranks: [
        { title: 'U Minh Trấn Tà Hành Giả', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Hành tẩu ngoài rìa Vô Gián Địa Ngục, phòng ngừa ma đầu trốn thoát.' },
        { title: 'Vô Gián Ám Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Âm binh áo đen canh giữ cánh cửa phong ấn A Tỳ ngục thất.' },
        { title: 'A Tỳ Hộ Giới Phán Quan', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Kiểm tra phong ấn các đại ma đầu bị đày ải nơi vực thẳm muôn trượng.' },
        { title: 'Vô Gián Ngục Chủ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Chưởng quản đại trận cửu u hắc ám, không để một sợi oán niệm lọt ra ngoài.' },
        { title: 'Đệ Cửu Điện · Bình Đẳng Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, chưởng quản ngục thất sâu nhất tam giới.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'chuyenluan',
      name: 'Điện Thứ Thập · Chuyển Luân Vương Phủ',
      hall: 'Lục Đạo Luân Hồi & Nại Hà Kiều',
      leader: 'Chuyển Luân Vương',
      desc: 'Chấp chưởng bánh xe Lục Đạo Luân Hồi, phán định thiện ác đưa hồn vào thiên, nhân, a tu la hay địa ngục súc sinh.',
      ranks: [
        { title: 'Luân Hồi Độ Giả', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Khách bộ hành nơi đầu cầu Nại Hà, chờ đợi canh Mạnh Bà thanh lọc ký ức.' },
        { title: 'Nại Hà Kiều Vệ', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Canh gác hai đầu cầu Nại Hà, ngăn ác quỷ nhảy xuống sông Vong Xuyên trốn thoát.' },
        { title: 'Mạnh Bà Đình Phán Ty', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Giúp Mạnh Bà điều phối nước mắt sinh linh, đun nấu chén canh lãng quên ân oán.' },
        { title: 'Lục Đạo Luân Chuyển Sứ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Xoay chuyển linh bàn lục đạo, mở ra cánh cổng luân hồi theo công đức tích lũy.' },
        { title: 'Đệ Thập Điện · Chuyển Luân Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thập Điện Diêm La ngang hàng, cai quản chặng cuối cùng của sinh tử luân hồi.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'manhba',
      name: 'Mạnh Bà Đình & Vong Xuyên Ty',
      hall: 'Mạnh Bà Đình & Vong Ưu Điện',
      leader: 'Mạnh Bà Tôn Thần',
      desc: 'Nấu bát canh Vong Xuyên đoạn tuyệt ân oán tình thù ba kiếp, giúp âm hồn thanh tịnh tiến vào luân hồi.',
      ranks: [
        { title: 'Trầm Luân Vong Hồn', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'U hồn dừng chân bên bờ Vong Xuyên buông bỏ trần duyên.' },
        { title: 'Tế Thủy Quỷ Lại', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Múc nước Vong Xuyên thanh lọc trần cấu cho âm hồn.' },
        { title: 'Vong Ưu Sứ Giả', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Dẫn dắt các linh hồn uống canh Mạnh Bà không gây hỗn loạn.' },
        { title: 'Hoàng Tuyền Chưởng Lô Quan', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Nắm công thức nấu canh quên lãng cứu vớt tâm ma trăm họ.' },
        { title: 'Mạnh Bà U Minh Tôn Thần', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Tôn thần trấn giữ đình Nại Hà, quyền năng tịnh hóa vạn hồn.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
    {
      id: 'phanquanty',
      name: 'Tứ Đại Phán Quan Ty',
      hall: 'Phán Quan Phủ & Tra Sát Điện',
      leader: 'Chưởng Án Thôi Phán Quan',
      desc: 'Tập hợp bốn vị đại phán quan: Thôi Giác (Sinh Tử), Chung Quỳ (Trảm Tà), Ngụy Trưng (Thưởng Thiện), Lục Chi Đạo (Tra Sát).',
      ranks: [
        { title: 'Âm Ty Hành Giả', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Hành tẩu giữa hai bờ âm dương, tìm kiếm chân tướng tà đạo.' },
        { title: 'Câu Hồn Sứ Giả', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Khoác áo Hắc Bạch Vô Thường, tay cầm Khốc Tang Bổng dẫn dắt hồn về ty.' },
        { title: 'Thưởng Thiện Phạt Ác Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Ghi chép công đức trần gian, thưởng phạt phân minh không sót mảy may.' },
        { title: 'Chưởng Án Phán Quan', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Cầm bút son quyền năng sinh tử, chấm một nét là đoạt mạng vạn dặm.' },
        { title: 'U Minh Tổng Phán Quan', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Đứng đầu Tứ Đại Phán Quan, quyền uy ngang hàng Thập Điện Diêm La.' },
        { title: 'Phong Đô Đại Đế Quân', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn U Minh Giáo Chủ, chúa tể toàn cõi Địa Phủ, thống lĩnh Thập Điện Diêm La và Cửu U.' },
      ],
    },
  ],

  thiendinh: [
    {
      id: 'chienthan',
      name: 'Nam Thiên Môn & Chiến Thần Phủ',
      hall: 'Nam Thiên Môn & Phục Ma Điện',
      leader: 'Nhị Lang Hiển Thánh Chân Quân',
      desc: 'Thống lĩnh thần tướng tinh nhuệ xung kích tiền tuyến, trấn thủ Nam Thiên Môn và trừ ma vạn dặm.',
      ranks: [
        { title: 'Tán Tiên Du Vân', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Người tu lên cõi trời du ngoạn, chưa có tiên tịch chính thức.' },
        { title: 'Nam Thiên Canh Môn Tiên Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Đứng gác bậc mây cổng trời Nam Thiên Môn, kiểm tra người qua lại.' },
        { title: 'Phục Ma Tiên Phong Tướng', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Dẫn đầu thiên binh thảo phạt yêu ma hạ giới làm loạn.' },
        { title: 'Tam Đàn Hải Hội Đại Tướng', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Cưỡi phong hỏa luân, vung hỗn thiên lăng, tiên phong bách chiến bách thắng.' },
        { title: 'Nhị Lang Hiển Thánh Chân Quân', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Chiến thần Thiên Đình, ba mắt thấu tam giới, thính điều bất thính tuyên.' },
        { title: 'Hạo Thiên Ngọc Hoàng Đại Đế', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn tam giới ngự Cửu Trùng Thiên, vạn thần triều bái, thống lĩnh chư thiên.' },
      ],
    },
    {
      id: 'voban',
      name: 'Lăng Tiêu Võ Ban & Thiên Vương Doanh',
      hall: 'Lăng Tiêu Bảo Điện & Thiên Binh Doanh',
      leader: 'Thác Tháp Lý Thiên Vương',
      desc: 'Tổng binh thiên binh thiên tướng, giữ trật tự Lăng Tiêu Bảo Điện, Tứ Đại Thiên Vương phò tá.',
      ranks: [
        { title: 'Cửu Thiên Tự Tại Tiên', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tu sĩ tiên gia nhập triều học tập quy củ thiên đình.' },
        { title: 'Trấn Điện Thiên Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Canh giữ trước thềm điện Lăng Tiêu, uy nghi chỉnh tề.' },
        { title: 'Tứ Đại Thiên Vương Chưởng Kỳ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Cầm cờ lệnh Tứ Đại Thiên Vương, điều khiển phong lôi kiếm kích.' },
        { title: 'Thiên Cung Đô Thống', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống soái mười vạn thiên binh túc vệ hoàng cung.' },
        { title: 'Thác Tháp Thiên Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Tổng binh thiên hạ, tay nâng Linh Lung Bảo Tháp trấn áp vạn thần.' },
        { title: 'Hạo Thiên Ngọc Hoàng Đại Đế', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn tam giới ngự Cửu Trùng Thiên, vạn thần triều bái, thống lĩnh chư thiên.' },
      ],
    },
    {
      id: 'thienha',
      name: 'Thiên Hà Thủy Quân Doanh',
      hall: 'Thiên Hà Thủy Doanh & Tinh Hán Doanh',
      leader: 'Thiên Bồng Thủy Doanh Đại Nguyên Soái',
      desc: 'Cai quản tám vạn thủy binh sông Ngân, canh giữ biên giới Thiên Đình với Yêu Giới.',
      ranks: [
        { title: 'Lưu Ly Thủy Tiên', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tu tiên giả tinh thông thủy hành công pháp chiêm bái sông Ngân.' },
        { title: 'Ngân Hán Tuần Thủy Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Chèo thuyền tiên tuần phòng trên dải Thiên Hà lấp lánh tinh vân.' },
        { title: 'Trấn Thủy Tiên Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Điều động thiên binh giữ đê sông Ngân, ngăn sóng dữ dâng trào.' },
        { title: 'Bát Vạn Thủy Quân Tiên Phong', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Cầm cửu xỉ đinh ba tung hoành sóng nước Ngân Hà.' },
        { title: 'Thiên Bồng Đại Nguyên Soái', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Thống lĩnh tám vạn thủy quân sông Ngân, danh chấn tam giới.' },
        { title: 'Hạo Thiên Ngọc Hoàng Đại Đế', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn tam giới ngự Cửu Trùng Thiên, vạn thần triều bái, thống lĩnh chư thiên.' },
      ],
    },
    {
      id: 'tuhai',
      name: 'Tứ Hải Long Cung Phủ',
      hall: 'Thủy Tinh Cung & Bát Nhã Long Phủ',
      leader: 'Đông Hải Long Vương Ngao Quảng',
      desc: 'Nha môn thống quản Long tộc bốn biển hạ giới, nắm giữ sổ mưa gió và kho báu thủy tộc.',
      ranks: [
        { title: 'Thủy Tộc Tán Tu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tu sĩ mang huyết mạch thủy tộc đến Long Cung yết kiến.' },
        { title: 'Tuần Biển Dạ Xoa Tướng', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Cưỡi sóng tuần sát đáy biển, kiểm soát thủy quái quấy nhiễu.' },
        { title: 'Long Cung Trấn Hải Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Khâm sai Thiên Đình truyền thánh chỉ mưa gió cho bốn phương.' },
        { title: 'Tứ Hải Phủ Chủ Bộ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Nắm sổ sách Long mạch, điều phối bảo vật Thủy Tinh Cung.' },
        { title: 'Đông Hải Thần Long Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Vua của vạn rồng bốn biển, hô mưa gọi gió, chưởng quản thủy mạch nhân gian.' },
        { title: 'Hạo Thiên Ngọc Hoàng Đại Đế', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn tam giới ngự Cửu Trùng Thiên, vạn thần triều bái, thống lĩnh chư thiên.' },
      ],
    },
    {
      id: 'dausuat',
      name: 'Đâu Suất Cung & Văn Ban Đạo Chức',
      hall: 'Đâu Suất Cung & Lão Quân Đan Phòng',
      leader: 'Thái Thượng Lão Quân Đạo Đức Chân Tôn',
      desc: 'Giữ lò Bát Quái, tiên đan cửu chuyển và truyền bá đại đạo vô vi thanh tĩnh khắp chư thiên.',
      ranks: [
        { title: 'Thanh Hư Đạo Đồng', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Quét dọn đan phòng, học phân biệt trăm loại tiên thảo cõi trời.' },
        { title: 'Bát Quái Lô Chấp Hỏa Quan', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Cầm Ba Tiêu phiến quạt lò Bát Quái, canh giữ tam muội thần hỏa.' },
        { title: 'Thái Bạch Tuyên Phủ Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Hạ giới chiêu an, ban thưởng tiên duyên cho người hữu đức.' },
        { title: 'Đâu Suất Kim Đan Chân Nhân', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Tự tay luyện chế cửu chuyển kim đan, được ban kim liên tọa.' },
        { title: 'Huyền Đô Đại Pháp Sư', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Đại đệ tử chân truyền của Lão Tử, văn ban đệ nhất chân nhân thiên đình.' },
        { title: 'Hạo Thiên Ngọc Hoàng Đại Đế', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn tam giới ngự Cửu Trùng Thiên, vạn thần triều bái, thống lĩnh chư thiên.' },
      ],
    },

    {
      id: 'daotri',
      name: 'Dao Trì Tiên Cung & Bàn Đào Phủ',
      hall: 'Dao Trì Cung & Bàn Đào Viên',
      leader: 'Tây Vương Mẫu Kim Mẫu Đại Đế',
      desc: 'Nơi ngự của Dao Trì Kim Mẫu, chưởng quản tiên tịch nữ tiên và ba ngàn sáu trăm gốc bàn đào trường sinh.',
      ranks: [
        { title: 'Dao Trì Tán Hoa Tiên Nữ', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Dâng hoa tiên và tưới tắm linh thảo cõi Dao Trì thanh tịnh.' },
        { title: 'Bàn Đào Viên Thủ Viên Tiên Sứ', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Canh giữ ba nghìn sáu trăm gốc bàn đào, phân loại quả chín.' },
        { title: 'Thất Tiên Nữ Chưởng Lễ Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Phụ trách dâng tiên đan rượu quỳnh trong đại yến Bàn Đào.' },
        { title: 'Dao Trì Thượng Cung Tiên Quan', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lý tiên tỳ, nắm giữ sổ vàng thọ tinh của chư tiên.' },
        { title: 'Tây Linh Khâm Mạng Kim Mẫu Chân Nhân', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Đại năng Dao Trì xuất trần, pháp lực sánh ngang ngũ phương ngũ lão.' },
        { title: 'Hạo Thiên Ngọc Hoàng Đại Đế', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn tam giới ngự Cửu Trùng Thiên, vạn thần triều bái, thống lĩnh chư thiên.' },
      ],
    },
    {
      id: 'quanghan',
      name: 'Quảng Hàn Cung & Thái Âm Phủ',
      hall: 'Quảng Hàn Nguyệt Điện & Ngô Cương Lâm',
      leader: 'Thái Âm Tinh Quân & Hằng Nga Tiên Tử',
      desc: 'Điện trăng thanh tao tịch mịch, chứa nguồn băng phách thái âm tinh hoa và cây quế ngàn năm.',
      ranks: [
        { title: 'Nguyệt Cung Thiền Thỏ Hữu Hộ', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Hái lá nguyệt quế, giã tiên dược ngọc thỏ nơi trăng sáng.' },
        { title: 'Quảng Hàn Băng Hồn Tiên Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Băng giáp sáng ngời, canh gác hàn cung giữa sương mù ngân hà.' },
        { title: 'Nguyệt Phách Chấp Đao Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Vung đao đốn quế ngàn trượng, tôi luyện đạo tâm tịch mịch.' },
        { title: 'Thái Âm Thần Điện Chưởng Sự', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Hút thái âm huyền khí bổ sung trận pháp chư thiên.' },
        { title: 'Quảng Hàn Nguyệt Phách Tiên Tôn', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Tôn thần Thái Âm, thân ngự hàn quang vạn dặm chấn nhiếp ma tà.' },
        { title: 'Hạo Thiên Ngọc Hoàng Đại Đế', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Chí tôn tam giới ngự Cửu Trùng Thiên, vạn thần triều bái, thống lĩnh chư thiên.' },
      ],
    },
  ],

  yeugioi: [
    {
      id: 'hoaqua',
      name: 'Hoa Quả Sơn · Thủy Liêm Động Phủ',
      hall: 'Thủy Liêm Động & Thiết Bản Kiều',
      leader: 'Tề Thiên Đại Thánh Mỹ Hầu Vương',
      desc: 'Tự tại xưng vương, không phục thiên quy, gậy sắt Như Ý kình thiên trụ chấn nhiếp tam giới.',
      ranks: [
        { title: 'Sơn Dã Hóa Hình Tiểu Yêu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Yêu thú mới thoát thai cốt, đến Hoa Quả Sơn bái kiến cờ hiệu Tề Thiên.' },
        { title: 'Thủy Liêm Động Hầu Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Uống rượu tiên ăn đào quả, luyện côn pháp sau màn thác nước.' },
        { title: 'Thông Tý Ma Viên Tướng', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Thân dài tay vượn, ném đá dời non, chỉ huy ngàn hầu binh.' },
        { title: 'Hoa Quả Sơn Tiên Phong Hầu Vương', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Đại tướng tiên phong của động phủ, cùng Đại Thánh đại náo càn khôn.' },
        { title: 'Tề Thiên Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thất Đại Thánh ngang hàng, xưng thần tề thiên, bất tử bất diệt.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'tichloi',
      name: 'Tích Lôi Sơn · Ma Vân Động Phủ',
      hall: 'Tích Lôi Ma Điện & Diễm Hỏa Sơn',
      leader: 'Bình Thiên Đại Thánh Ngưu Ma Vương',
      desc: 'Đứng đầu Thất Đại Thánh về uy dũng, hỗn thiết côn vạn cân, sấm sét lôi đình chấn vỡ hư không.',
      ranks: [
        { title: 'Dị Thú Sơn Đầu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Dã thú tu luyện yêu lực tìm đến Tích Lôi Sơn nương tựa.' },
        { title: 'Ma Vân Động Ngưu Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Thân mang giáp sắt, tay cầm kích nặng canh giữ sào huyệt.' },
        { title: 'Hỗn Thiết Lôi Tướng', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Đón sấm rèn thân, thể phách cứng như kim cương.' },
        { title: 'Tích Lôi Sơn Thiết Giáp Yêu Vương', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Tướng soái tay mặt của Lão Ngưu, uy chấn một phương.' },
        { title: 'Bình Thiên Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thất Đại Thánh ngang hàng, lực bạt sơn hề khí cái thế.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'suda',
      name: 'Sư Đà Lĩnh · Tam Ma Động Phủ',
      hall: 'Sư Đà Động & Bằng Trình Phong',
      leader: 'Hỗn Thiên Đại Thánh Bằng Ma Vương',
      desc: 'Ba vị ma vương sư, tượng, bằng bá chiếm tám trăm dặm núi non, một cánh lượn chín vạn dặm.',
      ranks: [
        { title: 'Man Hoang Thú Tộc', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Yêu tộc phương nam gia nhập bầy thú Sư Đà Lĩnh.' },
        { title: 'Bằng Vân Yêu Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Lướt gió trên ngọn cây, tuần sát ranh giới tám trăm dặm.' },
        { title: 'Vạn Trượng Cuồng Phong Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Gầm thét gọi gió giông, cuốn sạch quân địch cản lối.' },
        { title: 'Sư Đà Nhị Đại Vương', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Chiếm một tòa sơn phong xưng hùng, chư tiểu yêu phụng mệnh.' },
        { title: 'Hỗn Thiên Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thất Đại Thánh ngang hàng, tốc độ đệ nhất thiên hạ không ai bắt kịp.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'phuchai',
      name: 'Bắc Hải Yêu Đàm · Phúc Hải Phủ',
      hall: 'Phúc Hải Yêu Cung & Hắc Thủy Đàm',
      leader: 'Phúc Hải Đại Thánh Giao Ma Vương',
      desc: 'Một trong Thất Đại Thánh, cự giao biến ảo, chưởng quản vạn loài giao long thủy quái phương bắc.',
      ranks: [
        { title: 'Thủy Phủ Tiểu Yêu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tiểu yêu lặn sâu đáy đàm tu tập thủy thuật.' },
        { title: 'Hắc Thủy Kình Tốt', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Cưỡi cá kình tuần tra vùng nước sâu Bắc Hải.' },
        { title: 'Giao Long Hộ Vệ Tướng', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Mang lân phiến đao thương bất nhập, dấy phong ba quấy động hải vực.' },
        { title: 'Bắc Hải Yêu Soái', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lĩnh mười vạn thủy quái cự vực sương mù.' },
        { title: 'Phúc Hải Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thất Đại Thánh ngang hàng, uy chấn Bắc Hải, nhấc tay lật sóng ngập trời.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'dison',
      name: 'Di Sơn Phong · Cự Sư Động Phủ',
      hall: 'Di Sơn Thần Điện & Bàn Thạch Trận',
      leader: 'Di Sơn Đại Thánh Sư Đà Vương',
      desc: 'Một trong Thất Đại Thánh, dời non lấp biển chỉ trong chớp mắt, nhục thân kim cương bất hoại.',
      ranks: [
        { title: 'Trọng Giáp Dã Thú', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Yêu thú thể hình hộ pháp đến Di Sơn Phong học đạo.' },
        { title: 'Khiêng Núi Cự Lực Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Hàng ngày khiêng cự thạch vạn cân rèn luyện cơ bắp.' },
        { title: 'Phá Thạch Tiên Phong', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Một quyền phá vỡ chân núi hiểm trở làm đường cho đại quân.' },
        { title: 'Di Sơn Hộ Giáo Vương', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Bày bàn thạch cấm địa trận pháp phòng ngự sơn môn kiên cố.' },
        { title: 'Di Sơn Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thất Đại Thánh ngang hàng, nhổ núi dời đồi, sức mạnh cái thế vô địch.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'thongphong',
      name: 'Vô Nhai Cốc · Thông Phong Động Phủ',
      hall: 'Thông Phong Mật Điện & Tật Phong Nhai',
      leader: 'Thông Phong Đại Thánh Di Hầu Vương',
      desc: 'Một trong Thất Đại Thánh, thông tỏ âm thanh tam giới, hành tung quỷ mị, ngự phong vô ảnh.',
      ranks: [
        { title: 'Thính Phong Yêu Đồ', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Lắng nghe tiếng gió trong sơn cốc phân biệt địch ta.' },
        { title: 'Mật Thám Dạ Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Ẩn mình trong bóng đêm thám thính động tĩnh tam giới.' },
        { title: 'Tật Phong Du Kích Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Đi mây về gió gieo rắc sự hoảng sợ cho kẻ xâm phạm.' },
        { title: 'Thông Phong Chưởng Cơ Sứ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Nắm giữ mạng lưới tình báo khắp chín châu bốn biển.' },
        { title: 'Thông Phong Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thất Đại Thánh ngang hàng, biết trước vạn sự trong thiên hạ.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'khuthan',
      name: 'U Tịch Sơn · Khu Thần Điện Phủ',
      hall: 'Khu Thần Bí Điện & Nhiếp Phách Nhai',
      leader: 'Khu Thần Đại Thánh Ngu Nhung Vương',
      desc: 'Một trong Thất Đại Thánh, khu thần nhiếp quỷ, áp chế âm dương, câu hồn đoạt phách làm thần tướng phục vụ.',
      ranks: [
        { title: 'Nhiếp Phách Hóa Hình Yêu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tập luyện thần thông câu hồn nơi vách núi hoang sơ.' },
        { title: 'Khu Quỷ Yêu Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Chỉ huy âm hồn quỷ tốt tuần tra bảo vệ sơn lâm.' },
        { title: 'U Minh Nhiếp Hồn Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Áp giải thần tướng lạc lối quy phục về dưới trướng.' },
        { title: 'Khu Thần Hộ Giới Tướng', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Chủ trì pháp trận câu triệu vạn quỷ hộ vệ sơn môn.' },
        { title: 'Khu Thần Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Thất Đại Thánh ngang hàng, sai khiến thần linh phục vụ mệnh lệnh.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'banty',
      name: 'Bàn Ty Động Phủ',
      hall: 'Bàn Ty Động & Thất Khúc Tơ Trận',
      leader: 'Bàn Ty Động Chủ · Chu Thất Nương',
      desc: 'Bảy tỷ muội nhện tinh giăng tơ vạn dặm, luyện độc tơ cực âm hãm trận vô phương phá giải.',
      ranks: [
        { title: 'Tơ Nhện Hóa Hình Yêu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tiểu yêu nhện tu luyện kết mạng tơ bảo vệ cửa động.' },
        { title: 'Độc Tơ Yêu Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Phun tơ độc bủa vây kẻ xâm phạm sơn lâm.' },
        { title: 'Thất Muội Hộ Pháp', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Chủ trì thất khúc tơ trận độc bộ thiên hạ.' },
        { title: 'Bàn Ty Thượng Tướng', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lĩnh vạn độc quái bảo hộ động phủ an toàn.' },
        { title: 'Bàn Ty Động Chủ Thất Tiên Cô', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Chủ nhân Bàn Ty Động, tuyệt sắc độc sương làm chấn động giang hồ.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'hacphong',
      name: 'Hắc Phong Sơn · Hắc Phong Động',
      hall: 'Hắc Phong Động & Hùng Vương Trại',
      leader: 'Hắc Phong Đại Vương · Hùng Bãi',
      desc: 'Hắc hùng tinh áo đen võ nghệ siêu quần, mê đắm Phật pháp và trân bảo áo cà sa.',
      ranks: [
        { title: 'Hùng Tộc Hóa Hình Yêu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Gấu đen thành tinh tôi luyện thể phách cứng như đá.' },
        { title: 'Hắc Phong Thiết Thương Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Cầm hắc thiết thương múa tít cuồng phong bão táp.' },
        { title: 'Thiền Yêu Hộ Sơn Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Vừa tu yêu thuật vừa tụng kinh niệm Phật.' },
        { title: 'Hắc Phong Trấn Sơn Tướng', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Đại tướng tay mặt của Hùng Bãi, thương pháp xuất thần nhập hóa.' },
        { title: 'Hắc Phong Hùng Vương Đại Thánh', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Chúa tể Hắc Phong Sơn, pháp lực sánh ngang thần tướng Thiên Đình.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'bachho',
      name: 'Bạch Hổ Lĩnh · Bạch Cốt Động',
      hall: 'Bạch Cốt Động & Huyễn Hóa Điện',
      leader: 'Bạch Cốt Phu Nhân · Bạch Cốt Tinh',
      desc: 'Tu luyện từ bộ xương trắng ngàn năm, ba lần biến hóa khôn lường, tinh thông huyễn thuật đoạt phách.',
      ranks: [
        { title: 'Khô Cốt Hóa Hình Yêu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Xương khô hấp thu linh khí hóa thành hình người sơ cấp.' },
        { title: 'Bạch Cốt Dạ Xoa', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Ẩn hiện trong sương trắng Bạch Cốt Lĩnh bắt giữ sinh linh.' },
        { title: 'Tam Biến Huyễn Ảnh Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Hóa hình mỹ nữ, lão bà, trượng phu mê hoặc thế gian.' },
        { title: 'Bạch Cốt Hộ Pháp Vương', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Chỉ huy vạn cốt quân đoàn trong hắc ám rừng sâu.' },
        { title: 'Bạch Cốt Nương Nương Tôn Thượng', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Chúa tể Bạch Hổ Lĩnh, thân bất tử bất diệt giữa đống xương tàn.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
    {
      id: 'vanyeu',
      name: 'Vạn Yêu Thánh Đình · Thanh Khâu Cung',
      hall: 'Yêu Hoàng Điện & Cổ Môn Cung',
      leader: 'Thanh Khâu Cửu Vĩ Hồ Vương',
      desc: 'Trung tâm quyền lực tối cao của Yêu Giới, Hồ tộc nắm nghi lễ và mật vụ tình báo toàn cõi.',
      ranks: [
        { title: 'Thảo Mộc Thú Điển Yêu Tu', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Yêu tu tu luyện pháp điển thánh đình.' },
        { title: 'Cổ Môn Cấm Vệ Binh', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Bảo vệ Vạn Yêu Cổ Môn, cửa ngõ giao thương giữa trần thế và yêu giới.' },
        { title: 'Thanh Khâu Tuyên Phủ Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Sứ giả hồ tộc truyền đạt sắc lệnh tới chư vương động phủ.' },
        { title: 'Vạn Yêu Tướng Soái', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lĩnh vạn cấm vệ bảo hộ cung điện hoàng triều.' },
        { title: 'Cửu Vĩ Thiên Hồ Yêu Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Thủ lĩnh hồ tộc, quyền uy nghiêng ngửa Thất Đại Thánh.' },
        { title: 'Thái Cổ Yêu Hoàng', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Vị vua tối cao thống nhất toàn bộ Thập Vạn Đại Sơn, vạn yêu quỳ phục tung hô hoàng tôn.' },
      ],
    },
  ],

  linhson: [
    {
      id: 'lacgia',
      name: 'Phổ Đà Lạc Già Sơn · Quan Âm Đạo Tràng',
      hall: 'Triều Âm Động & Tử Trúc Lâm',
      leader: 'Đại Bi Quan Thế Âm Bồ Tát',
      desc: 'Đạo tràng trên biển Nam Hải, cành dương liễu và tịnh bình nước cam lộ độ tận khổ nạn chúng sinh.',
      ranks: [
        { title: 'Nam Hải Thiện Nam Tín Nữ', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Hành hương vượt biển triều bái cõi Phật thanh tịnh.' },
        { title: 'Triều Thánh Sa Di', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Quét dọn rừng Tử Trúc, sớm tối tụng niệm Đại Bi Chú.' },
        { title: 'Thiện Tài Hộ Pháp', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Hộ trì đạo tràng, lắng nghe tiếng kêu cứu của muôn loài.' },
        { title: 'Lạc Già Sơn Thượng Tọa', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Đại đức truyền giảng Phật pháp, ban rải cam lộ tiêu trừ nghiệp chướng.' },
        { title: 'Đại Bi Quan Thế Âm Bồ Tát', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Tứ Đại Bồ Tát ngang hàng, đại từ đại bi tầm thanh cứu khổ cứu nạn.' },
        { title: 'Tây Thiên Phật Tổ Như Lai', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Giáo chủ cõi Cực Lạc Tây Thiên, Vô Thượng Chánh Đẳng Chánh Giác, vạn Phật triều bái.' },
      ],
    },
    {
      id: 'ngudai',
      name: 'Ngũ Đài Sơn · Văn Thù Đạo Tràng',
      hall: 'Thanh Lương Tự & Bát Nhã Viện',
      leader: 'Đại Trí Văn Thù Sư Lợi Bồ Tát',
      desc: 'Đạo tràng trí tuệ đệ nhất, cưỡi thanh sư tử, tay cầm kiếm huệ trảm đứt phiền não vô minh.',
      ranks: [
        { title: 'Thiền Môn Cư Sĩ', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tu sĩ đến Ngũ Đài Sơn tầm đạo khai mở trí tuệ.' },
        { title: 'Thanh Lương Sa Môn', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Tu trì thiền định giữa năm đỉnh núi linh thiêng tuyết phủ.' },
        { title: 'Sư Tử Hống Hàng Ma Giả', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Phát xuất tiếng gầm bát nhã chấn tỉnh kẻ lầm đường lạc lối.' },
        { title: 'Bát Nhã Trí Huệ Pháp Vương', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thông tỏ tam tạng kinh điển, giảng kinh hoa sen rơi khắp đài cao.' },
        { title: 'Đại Trí Văn Thù Sư Lợi Bồ Tát', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Tứ Đại Bồ Tát ngang hàng, trí tuệ vô biên đệ nhất chư Phật.' },
        { title: 'Tây Thiên Phật Tổ Như Lai', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Giáo chủ cõi Cực Lạc Tây Thiên, Vô Thượng Chánh Đẳng Chánh Giác, vạn Phật triều bái.' },
      ],
    },
    {
      id: 'ngami',
      name: 'Nga Mi Sơn · Phổ Hiền Đạo Tràng',
      hall: 'Vạn Niên Tự & Kim Đỉnh Đại Điện',
      leader: 'Đại Hạnh Phổ Hiền Bồ Tát',
      desc: 'Đạo tràng đại hạnh thực hành vô biên, cưỡi voi trắng sáu ngà, hạnh nguyện rộng khắp cõi Ta Bà.',
      ranks: [
        { title: 'Hành Nguyện Thiện Tín', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Cất bước ngàn dặm lên Kim Đỉnh chiêm ngưỡng Phật quang.' },
        { title: 'Bạch Tượng Trì Giới Tăng', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Trì tụng Thập Đại Nguyện Vương, thân tâm kiên định tựa bàn thạch.' },
        { title: 'Kim Đỉnh Hộ Pháp Sứ', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Bảo hộ đàn tràng, xua tan sương mù tà niệm nơi đỉnh thiêng.' },
        { title: 'Đại Hạnh Giảng Kinh Luận Sư', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thuyết pháp độ sinh, lấy thực hành đại nguyện làm gốc giải thoát.' },
        { title: 'Đại Hạnh Phổ Hiền Bồ Tát', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Tứ Đại Bồ Tát ngang hàng, đại hạnh vô ngại cùng khắp mười phương.' },
        { title: 'Tây Thiên Phật Tổ Như Lai', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Giáo chủ cõi Cực Lạc Tây Thiên, Vô Thượng Chánh Đẳng Chánh Giác, vạn Phật triều bái.' },
      ],
    },
    {
      id: 'cuuhoa',
      name: 'Cửu Hoa Sơn · Địa Tạng Đạo Tràng',
      hall: 'Địa Tạng Thiền Viện & U Minh Điện',
      leader: 'Đại Nguyện Địa Tạng Vương Bồ Tát',
      desc: 'Đạo tràng đại nguyện: "Địa ngục vị không, thệ bất thành Phật", cứu vớt chúng sinh chịu khổ nơi tăm tối.',
      ranks: [
        { title: 'U Minh Độ Hóa Tăng', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Tăng lữ phát tâm phổ độ vong linh oan khuất.' },
        { title: 'Thiết Vi Cảnh Thính Đạo Tăng', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Tụng kinh soi rọi ánh sáng ấm áp vào ngục tối sâu thẳm.' },
        { title: 'Trừ Ác Thiện Duyên Hộ Pháp', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Tay cầm bảo châu và tích trượng hóa giải nghiệp chướng oán thù.' },
        { title: 'Thập Luân Bản Nguyện Sứ', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Khâm sai mang bản nguyện kinh dẫn độ linh hồn đắc đạo siêu thăng.' },
        { title: 'Đại Nguyện Địa Tạng Vương Bồ Tát', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Một trong Tứ Đại Bồ Tát ngang hàng, đại nguyện thấu tận đáy địa ngục u minh.' },
        { title: 'Tây Thiên Phật Tổ Như Lai', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Giáo chủ cõi Cực Lạc Tây Thiên, Vô Thượng Chánh Đẳng Chánh Giác, vạn Phật triều bái.' },
      ],
    },
    {
      id: 'sonmon',
      name: 'Linh Sơn Sơn Môn · Vi Đà Hộ Pháp',
      hall: 'Linh Sơn Cổ Môn & Kim Cương Điện',
      leader: 'Vi Đà Bồ Tát Hộ Pháp Tôn Thiên',
      desc: 'Trấn giữ cửa ngõ Tây Thiên, tay cầm Kim Cương Xử hộ trì chánh pháp và che chở người hành hương.',
      ranks: [
        { title: 'Sơn Môn Hướng Thiện Giả', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Người tu lên núi Linh Sơn phát tâm trì giới.' },
        { title: 'Sơn Môn Chấp Sự Tăng', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Tiếp đón chư tăng mười phương về cõi Phật.' },
        { title: 'Vi Đà Hộ Pháp Tiên Phong', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Vung bảo xử hàng phục yêu ma ngăn cản đường chánh đạo.' },
        { title: 'Tứ Đại Kim Cương Đô Thống', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thống lĩnh toàn bộ hộ pháp thần tướng giữ vững sơn môn.' },
        { title: 'Vi Đà Thiên Tôn Hộ Pháp Vương', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Vị bồ tát hộ pháp dũng mãnh đệ nhất Phật môn, uy chấn cõi Ta Bà.' },
        { title: 'Tây Thiên Phật Tổ Như Lai', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Giáo chủ cõi Cực Lạc Tây Thiên, Vô Thượng Chánh Đẳng Chánh Giác, vạn Phật triều bái.' },
      ],
    },
    {
      id: 'tangkinh',
      name: 'Tàng Kinh Các · Đại Ca Diếp & A Nan',
      hall: 'Tàng Kinh Điện & Bát Nhã Các',
      leader: 'Đại Ca Diếp & A Nan Đà Tôn Giả',
      desc: 'Giữ chìa khóa Ba Tạng Kinh Điển, niêm hoa vi tiếu truyền thừa Phật tâm ấn cho đời sau.',
      ranks: [
        { title: 'Tra Kinh Cư Sĩ', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Đọc tụng kinh điển mở mang trí tuệ bát nhã.' },
        { title: 'Biên Dịch Pháp Sư', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Sao chép và bảo tồn các bản kinh Phạn ngữ cổ.' },
        { title: 'Chưởng Kinh Đại Tăng', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Quản lý vạn quyển bối diệp kinh văn nơi gác ngọc.' },
        { title: 'Pháp Ấn Truyền Đăng Giả', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Thấu suốt áo nghĩa tam thừa, truyền bá Phật pháp rộng khắp.' },
        { title: 'Ma Ha Ca Diếp Chưởng Giáo Tôn Giả', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Đệ nhất đầu đà, tiếp nhận y bát từ Phật Tổ, đứng đầu chư đại đệ tử.' },
        { title: 'Tây Thiên Phật Tổ Như Lai', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Giáo chủ cõi Cực Lạc Tây Thiên, Vô Thượng Chánh Đẳng Chánh Giác, vạn Phật triều bái.' },
      ],
    },
    {
      id: 'loiam',
      name: 'Đại Lôi Âm Tự · La Hán & Kim Cương Trấn Sơn',
      hall: 'Đại Hùng Bảo Điện & Tàng Kinh Các',
      leader: 'Hàng Long Thập Bát La Hán Tôn Giả',
      desc: 'Hộ pháp thần lực Phật môn, Thập Bát La Hán và Bát Đại Kim Cương trấn giữ chánh pháp Tây Thiên.',
      ranks: [
        { title: 'Sơn Môn Khách Tăng', minContrib: 0, minRealm: 1, salaryStones: 60, salaryContrib: 25, desc: 'Hành cước tăng đến cửa núi Lôi Âm chiêm bái.' },
        { title: 'Hàng Ma Kim Cương', minContrib: 400, minRealm: 2, salaryStones: 300, salaryContrib: 90, desc: 'Tay cầm bảo xử, kim thân bất hoại trấn thủ bốn góc sơn môn.' },
        { title: 'Thập Bát La Hán Vị', minContrib: 1800, minRealm: 3, salaryStones: 1000, salaryContrib: 250, desc: 'Chứng đắc quả vị La Hán, hàng phục rồng cọp tiêu diệt ma sát.' },
        { title: 'A Nan Ca Diếp Chưởng Kinh Tọa', minContrib: 6000, minRealm: 4, salaryStones: 3000, salaryContrib: 600, desc: 'Đại đệ tử hầu bên Phật Tổ, nắm chìa khóa Tàng Kinh Các bảo khố.' },
        { title: 'Lôi Âm Chánh Pháp Tôn Giả', minContrib: 18000, minRealm: 5, salaryStones: 7500, salaryContrib: 1500, desc: 'Đứng đầu chư vị La Hán và Kim Cương, pháp lực hùng hậu ngang hàng Bồ Tát.' },
        { title: 'Tây Thiên Phật Tổ Như Lai', minContrib: 45000, minRealm: 6, salaryStones: 16000, salaryContrib: 3500, desc: 'Giáo chủ cõi Cực Lạc Tây Thiên, Vô Thượng Chánh Đẳng Chánh Giác, vạn Phật triều bái.' },
      ],
    },
  ],
};

/** Lấy điểm cống hiến hiện tại của thần giới */
export function celestialContrib(id: CelestialId): number {
  const flags = (s.flags.celestialContrib ||= {});
  return flags[id] || 0;
}

/** Tăng/giảm cống hiến thần giới */
export function addCelestialContrib(id: CelestialId, amount: number) {
  const flags = (s.flags.celestialContrib ||= {});
  flags[id] = Math.max(0, (flags[id] || 0) + amount);
}

/** Lấy nhánh chức vụ hiện tại của người chơi tại Thần Giới */
export function celestialBranch(id: CelestialId): string {
  const flags = (s.flags.celestialBranch ||= {});
  const branches = CELESTIAL_BRANCHES[id];
  return flags[id] || branches[0].id;
}

/** Chọn / đổi nhánh tiên chức */
export function setCelestialBranch(id: CelestialId, branchId: string) {
  const flags = (s.flags.celestialBranch ||= {});
  flags[id] = branchId;
}

/** Lấy cấp bậc chức vụ của nhánh hiện tại (0..5) */
export function celestialRank(id: CelestialId, branchId = celestialBranch(id)): number {
  const flags = (s.flags.celestialBranchRanks ||= {});
  const key = `${id}:${branchId}`;
  return flags[key] || 0;
}

/** Lấy danh sách bậc chức vụ của nhánh hiện tại (backward compat) */
export function getBranchRanks(id: CelestialId, branchId = celestialBranch(id)): CelestialRankInfo[] {
  const branch = CELESTIAL_BRANCHES[id].find((b) => b.id === branchId) || CELESTIAL_BRANCHES[id][0];
  return branch.ranks;
}


export const PLACE_TO_BRANCH: Record<CelestialId, Record<string, string>> = {
  thiendinh: {
    namthienmon: 'chienthan',
    linhtieu: 'voban',
    thienha: 'thienha',
    tuhai: 'tuhai',
    dausuat: 'dausuat',
    daotri: 'daotri',
    quanghan: 'quanghan',
  },
  diaphu: {
    quymon: 'phanquanty',
    hoangtuyen: 'tanquang',
    vonghuong: 'diemla',
    tamsinh: 'nguquan',
    naiha: 'sogiang',
    manhba: 'manhba',
    phongdo: 'diemla',
    uongtu: 'bienthanh',
    luanhoi: 'chuyenluan',
  },
  yeugioi: {
    codmon: 'vanyeu',
    yeuhoang: 'vanyeu',
    hoaqua: 'hoaqua',
    tichloi: 'tichloi',
    sudaa: 'suda',
    banty: 'banty',
    hacphong: 'hacphong',
    bachho: 'bachho',
  },
  linhson: {
    sonmon: 'sonmon',
    loiam: 'loiam',
    lacgia: 'lacgia',
    ngudai: 'ngudai',
    ngami: 'ngami',
    cuuhoa: 'cuuhoa',
    tangkinh: 'tangkinh',
  },
};

export const CELESTIAL_RANKS: Record<CelestialId, CelestialRankInfo[]> = new Proxy({} as any, {
  get: (_, prop: string) => {
    const id = prop as CelestialId;
    if (CELESTIAL_BRANCHES[id]) {
      return getBranchRanks(id);
    }
    return [];
  },
});

/** Thông tin tiên chức hiện tại */
export function celestialRankInfo(id: CelestialId, branchId = celestialBranch(id)): CelestialRankInfo {
  const ranks = getBranchRanks(id, branchId);
  const r = celestialRank(id, branchId);
  return ranks[Math.min(ranks.length - 1, r)];
}

/** Thăng cấp tiên chức */
export function canPromoteCelestialRank(id: CelestialId, branchId = celestialBranch(id)): { ok: boolean; why: string; next?: CelestialRankInfo } {
  const ranks = getBranchRanks(id, branchId);
  const cur = celestialRank(id, branchId);
  if (cur >= ranks.length - 1) return { ok: false, why: 'Ngươi đã đạt cảnh giới tiên chức tối cao nơi nhánh này.' };
  const next = ranks[cur + 1];
  const contrib = celestialContrib(id);
  const curR = effRi();
  if (contrib < next.minContrib) return { ok: false, why: `Cần ${fmt(next.minContrib)} cống hiến (hiện có ${fmt(contrib)}).`, next };
  if (curR < next.minRealm) return { ok: false, why: `Cần cảnh giới ${REALMS[next.minRealm].n} trở lên.`, next };
  return { ok: true, why: 'Đủ điều kiện thăng phong tiên chức!', next };
}

export function promoteCelestialRank(id: CelestialId, branchId = celestialBranch(id)): string {
  const check = canPromoteCelestialRank(id, branchId);
  if (!check.ok || !check.next) return check.why;
  const flags = (s.flags.celestialBranchRanks ||= {});
  const key = `${id}:${branchId}`;
  flags[key] = (flags[key] || 0) + 1;
  const newRank = check.next;
  addLog(`Sắc phong Thần Triều! Ngươi được thăng phong lên 【${newRank.title}】 của ${CELESTIAL[id].n}!`, 'good');
  return `Thăng phong thành công: ${newRank.title}!`;
}

/** Lĩnh bổng lộc hàng năm của thần giới */
export function canClaimCelestialSalary(id: CelestialId): boolean {
  const y = Math.floor(s.year);
  const flags = (s.flags.celestialSalaryY ||= {});
  return (flags[id] || -1) < y;
}

export function claimCelestialSalary(id: CelestialId): string {
  if (!canClaimCelestialSalary(id)) return 'Ngươi đã nhận bổng lộc thần giới của năm nay rồi.';
  const flags = (s.flags.celestialSalaryY ||= {});
  flags[id] = Math.floor(s.year);
  const rInfo = celestialRankInfo(id);
  s.money += rInfo.salaryStones;
  addCelestialContrib(id, rInfo.salaryContrib);
  addLog(`Nhận bổng lộc ${rInfo.title} của ${CELESTIAL[id].n}: +${fmt(rInfo.salaryStones)} linh thạch, +${rInfo.salaryContrib} cống hiến.`, 'good');
  return `Đã nhận bổng lộc: +${fmt(rInfo.salaryStones)} linh thạch, +${rInfo.salaryContrib} cống hiến!`;
}

// ---------- Nhiệm vụ Phụng Mệnh Thần Giới ----------
export interface CelestialMission {
  id: string;
  title: string;
  desc: string;
  type: 'patrol' | 'donate_item' | 'meditate' | 'slay';
  placeId?: string;
  reqItem?: string;
  reqItemCount?: number;
  rewardContrib: number;
  rewardStones: number;
}

export function getCelestialMissions(id: CelestialId): CelestialMission[] {
  const y = Math.floor(s.year);
  const list: CelestialMission[] = [];

  switch (id) {
    case 'thiendinh':
      list.push(
        {
          id: `td_patrol_namthienmon_${y}`,
          title: 'Tuần Tra Nam Thiên Môn & Phục Ma',
          desc: 'Phụng mệnh Lý Thiên Vương, cùng Thiên Binh tuần tra Nam Thiên Môn, tra xét kính Chiếu Yêu, ngăn ngừa ma khí hạ giới nhiễu loạn thiên cung.',
          type: 'patrol',
          placeId: 'namthienmon',
          rewardContrib: 180,
          rewardStones: 450,
        },
        {
          id: `td_item_dausuat_${y}`,
          title: 'Cung Ứng Lò Bát Quái Đâu Suất',
          desc: 'Thái Thượng Lão Quân đang khai lò luyện đan, cần bổ sung Huyền Thiết thượng phẩm để nung đúc tiên đỉnh luyện Cửu Chuyển Kim Đan.',
          type: 'donate_item',
          placeId: 'dausuat',
          reqItem: 'm:huyenthiet',
          reqItemCount: 15,
          rewardContrib: 260,
          rewardStones: 600,
        },
        {
          id: `td_item_daotri_${y}`,
          title: 'Tưới Dưỡng Bàn Đào Tiên Viên',
          desc: 'Tây Vương Mẫu chuẩn bị mở Bàn Đào Đại Hội, cần Thanh Tâm Liên thanh khiết tưới dưỡng linh căn ngàn năm của cây Bàn Đào tiên gia.',
          type: 'donate_item',
          placeId: 'daotri',
          reqItem: 'h:thanhtamlien',
          reqItemCount: 12,
          rewardContrib: 250,
          rewardStones: 550,
        },
        {
          id: `td_patrol_thienha_${y}`,
          title: 'Tuần Phòng Thiên Hà Tinh Lưu',
          desc: 'Hiệp trợ Thiên Bồng Đại Nguyên Soái tuần phòng dòng sông Ngân lấp lánh, thám thính biên cương giáp ranh cõi Yêu Giới.',
          type: 'patrol',
          placeId: 'thienha',
          rewardContrib: 200,
          rewardStones: 500,
        },
        {
          id: `td_item_quanghan_${y}`,
          title: 'Thu Thập Thái Âm Băng Phách',
          desc: 'Thường Nga tiên tử nơi Quảng Hàn Cung cần Thiên Sơn Tuyết Liên để bồi dưỡng Ngọc Thỏ và tinh luyện Nguyệt Hoa Tiên Lộ thuần khiết.',
          type: 'donate_item',
          placeId: 'quanghan',
          reqItem: 'h:tuyetlien',
          reqItemCount: 10,
          rewardContrib: 280,
          rewardStones: 700,
        },
        {
          id: `td_patrol_tuhai_${y}`,
          title: 'Hộ Trì Tứ Hải Long Cung Bố Vũ',
          desc: 'Cùng Đông Hải Long Vương thị sát thủy mạch, kiểm soát phong vân mưa gió để điều hòa thiên hạ mưa thuận gió hòa.',
          type: 'patrol',
          placeId: 'tuhai',
          rewardContrib: 190,
          rewardStones: 480,
        },
        {
          id: `td_med_langtieu_${y}`,
          title: 'Ngắm Đán Hà Lăng Tiêu Bảo Điện',
          desc: 'Nhập định tại ngọc thềm Lăng Tiêu Điện hấp thu thái dương chân hỏa buổi sớm trước giờ chư thiên triều bái, thanh lọc tâm ma.',
          type: 'meditate',
          placeId: 'langtieu',
          rewardContrib: 180,
          rewardStones: 350,
        },
        {
          id: `td_slay_chienthan_${y}`,
          title: 'Chiến Thần Phủ Tiễu Trừ Dị Ma',
          desc: 'Tiếp nhận quân lệnh Chiến Thần Phủ, xuất kích tiêu diệt tàn dư dị ma lẩn khuất nơi hư không thiên ngoại lăm le phá hủy thiên giới.',
          type: 'slay',
          placeId: 'namthienmon',
          rewardContrib: 320,
          rewardStones: 850,
        }
      );
      break;

    case 'diaphu':
      list.push(
        {
          id: `dp_patrol_hoangtuyen_${y}`,
          title: 'Trấn Áp Vong Linh Hoàng Tuyền Lộ',
          desc: 'Dọc theo con đường rực sắc hoa Bỉ Ngạn tuần sát, hiệp trợ quỷ sai an phủ những cô hồn vương vấn trần gian không chịu nhập thành.',
          type: 'patrol',
          placeId: 'hoangtuyenlo',
          rewardContrib: 180,
          rewardStones: 450,
        },
        {
          id: `dp_item_chusa_${y}`,
          title: 'Cung Nộp Chu Sa Khắc Sinh Tử Bộ',
          desc: 'Phán Quan Ty cần Chu Sa tinh khiết để hòa mực son điểm phê sổ Sinh Tử, phán quyết dương thọ thiện ác vạn linh.',
          type: 'donate_item',
          placeId: 'phongdothanh',
          reqItem: 'm:chusa',
          reqItemCount: 20,
          rewardContrib: 250,
          rewardStones: 600,
        },
        {
          id: `dp_item_bingan_${y}`,
          title: 'Thu Hái Bỉ Ngạn Nấu Vong Ưu Thang',
          desc: 'Mạnh Bà nương nương cần hoa Bỉ Ngạn Hoa Tinh thuần âm đầu mùa hái bên bờ Hoàng Tuyền để nấu một vạc Canh Quên tiếp dẫn chư hồn.',
          type: 'donate_item',
          placeId: 'manhbadinh',
          reqItem: 'h:binganhoa',
          reqItemCount: 8,
          rewardContrib: 320,
          rewardStones: 800,
        },
        {
          id: `dp_med_tamsinh_${y}`,
          title: 'Quan Tưởng Tam Sinh Thạch Định Tâm',
          desc: 'Đứng trước Tam Sinh Thạch soi tỏ tiền kiếp hậu lai, đoạn trừ si niệm, mài giũa thần niệm kiên định trước vạn trượng hồng trần.',
          type: 'meditate',
          placeId: 'tamsinhthach',
          rewardContrib: 180,
          rewardStones: 350,
        },
        {
          id: `dp_patrol_uongtu_${y}`,
          title: 'Bình Ổn Oán Sát Uổng Tử Thành',
          desc: 'Tuần tra bốn bức tường thành Uổng Tử Thành, xoa dịu oán khí ngút trời của ức vạn sinh linh chết oan khuất nơi dương thế.',
          type: 'patrol',
          placeId: 'uongtuthanh',
          rewardContrib: 220,
          rewardStones: 550,
        },
        {
          id: `dp_slay_naiha_${y}`,
          title: 'Trảm Thủy Quái Dưới Cầu Nại Hà',
          desc: 'Dưới chân cầu Nại Hà sóng cuộn đục ngầu, xuất thủ chém giết tà ma thủy quái chuyên chực chờ kéo chân cô hồn rơi xuống Vong Xuyên Hà.',
          type: 'slay',
          placeId: 'naihakieu',
          rewardContrib: 280,
          rewardStones: 700,
        },
        {
          id: `dp_med_vonghuong_${y}`,
          title: 'Vọng Hương Đài Đoạn Tuyệt Trần Duyên',
          desc: 'Lên đỉnh Vọng Hương Đài phóng tầm mắt về cố hương trần thế lần cuối, hiểu thấu lẽ sắc không vô thường, tâm cảnh đại khai.',
          type: 'meditate',
          placeId: 'vonghuongdai',
          rewardContrib: 190,
          rewardStones: 400,
        },
        {
          id: `dp_patrol_lucdao_${y}`,
          title: 'Hộ Vệ Luân Hồi Đài Chuyển Kiếp',
          desc: 'Trấn thủ bên vòng xoay Lục Đạo Luân Hồi Đài, duy trì thiên cơ luân chuyển, hộ tống chư hồn thiện duyên an ổn đầu thai chuyển thế.',
          type: 'patrol',
          placeId: 'lucdaodai',
          rewardContrib: 240,
          rewardStones: 600,
        }
      );
      break;

    case 'yeugioi':
      list.push(
        {
          id: `yg_patrol_vanyeumon_${y}`,
          title: 'Thị Uy Cổ Môn · Trấn Áp Biên Giới',
          desc: 'Phóng thích bàng bạc yêu khí uy áp tại Vạn Yêu Cổ Môn, răn đe lũ thợ săn yêu thú và đám tu sĩ nhân tộc dòm ngó thánh địa yêu tộc.',
          type: 'patrol',
          placeId: 'vanyeumon',
          rewardContrib: 180,
          rewardStones: 450,
        },
        {
          id: `yg_item_dayeu_${y}`,
          title: 'Thu Nộp Da Thú Gia Cố Doanh Trại',
          desc: 'Yêu Hoàng Điện triệu tập Da Yêu Thú dày dặn cường tráng để gia cố quân trướng, may hộ giáp và đúc cờ lệnh chiến trận cho chư vương.',
          type: 'donate_item',
          placeId: 'yeuhoangdien',
          reqItem: 'm:dayeu',
          reqItemCount: 15,
          rewardContrib: 250,
          rewardStones: 600,
        },
        {
          id: `yg_med_tichloi_${y}`,
          title: 'Huyết Khí Thối Thể Tích Lôi Sơn',
          desc: 'Đón nhận sấm sét từ Tích Lôi Sơn rèn luyện gân cốt nhục thân, kích phát cuồng bạo huyết mạch, đánh thức bản năng dũng mãnh thời hồng hoang.',
          type: 'meditate',
          placeId: 'tichloison',
          rewardContrib: 200,
          rewardStones: 400,
        },
        {
          id: `yg_item_hoaquason_${y}`,
          title: 'Hái Bách Quả Ủ Rượu Thủy Liêm Động',
          desc: 'Hái Hoàng Tinh trên vách đá đem về Thủy Liêm Động dâng cho Hầu Vương và bầy khỉ ủ Bách Quả Linh Tửu thơm nồng vang danh.',
          type: 'donate_item',
          placeId: 'hoaquason',
          reqItem: 'h:hoangtinh',
          reqItemCount: 18,
          rewardContrib: 240,
          rewardStones: 550,
        },
        {
          id: `yg_patrol_banty_${y}`,
          title: 'Thu Gom Yêu Tơ Bàn Ty Động',
          desc: 'Tiến vào hang ổ mạng nhện Bàn Ty Động thu gom kén tơ và độc tơ, đồng thời kiểm tra cấm chế hộ sơn cho Thất Muội nhện yêu.',
          type: 'patrol',
          placeId: 'bantydong',
          rewardContrib: 210,
          rewardStones: 520,
        },
        {
          id: `yg_slay_hacphong_${y}`,
          title: 'Tiễu Trừ Phản Nghịch Hắc Phong Sơn',
          desc: 'Dẹp loạn bè lũ sơn tặc quỷ yêu bất tuân lệnh chỉ yêu giới nơi rặng tùng Hắc Phong Sơn, thu hồi bảo vật yêu tộc bị cướp đoạt.',
          type: 'slay',
          placeId: 'hacphongson',
          rewardContrib: 260,
          rewardStones: 650,
        },
        {
          id: `yg_slay_bachho_${y}`,
          title: 'Trấn Áp Khô Lâu Bạch Hổ Lĩnh',
          desc: 'Tiễu trừ bạch cốt khô lâu và thi ma trỗi dậy từ các cổ mộ hoang phế quanh Bạch Hổ Lĩnh, thanh trừng u ám tà khí.',
          type: 'slay',
          placeId: 'bachholinh',
          rewardContrib: 270,
          rewardStones: 680,
        },
        {
          id: `yg_med_suda_${y}`,
          title: 'Sư Đà Lĩnh Đấu Thú Đàn Tôi Rèn Sát Khí',
          desc: 'Bước vào huyết sát trận của Tam Đại Ma Vương Sư Đà Lĩnh, đón nhận uy áp cuồng bạo tôi luyện chiến ý vô địch thiên hạ.',
          type: 'meditate',
          placeId: 'sudalinh',
          rewardContrib: 220,
          rewardStones: 500,
        }
      );
      break;

    case 'linhson':
      list.push(
        {
          id: `ls_patrol_sonmon_${y}`,
          title: 'Hộ Vệ Bát Nhã Sơn Môn',
          desc: 'Đồng hành cùng Bát Đại Hộ Pháp Kim Cương canh gác bến đò Lăng Vân và sơn môn Linh Sơn, tiếp dẫn khách hành hương thiện lương.',
          type: 'patrol',
          placeId: 'sonmon',
          rewardContrib: 180,
          rewardStones: 450,
        },
        {
          id: `ls_item_phuchi_${y}`,
          title: 'Quyên Tặng Phù Chỉ Chép Đại Tạng Kinh',
          desc: 'Cúng dường Phù Chỉ thượng hảo cho Tàng Kinh Các để chư vị tôn giả in khắc Đại Tạng Chân Kinh truyền bá cứu độ muôn dân.',
          type: 'donate_item',
          placeId: 'tangkinhcac',
          reqItem: 'm:phuchi',
          reqItemCount: 25,
          rewardContrib: 250,
          rewardStones: 600,
        },
        {
          id: `ls_med_dailoiam_${y}`,
          title: 'Nghe Kinh Dưới Tòa Sen Phật Tổ',
          desc: 'Tham gia pháp hội tại Đại Hùng Bảo Điện, lắng nghe Như Lai Phật Tổ giảng Kim Cương Kinh, hoa sen trời rơi rụng, tiêu trừ muôn kiếp nghiệp chướng.',
          type: 'meditate',
          placeId: 'dailoiam',
          rewardContrib: 210,
          rewardStones: 450,
        },
        {
          id: `ls_patrol_phoda_${y}`,
          title: 'Phổ Đà Nam Hải Tầm Thanh Cứu Khổ',
          desc: 'Cưỡi sóng biếc Nam Hải quanh Lạc Già Sơn, hiệp trợ Quan Thế Âm Bồ Tát lắng nghe tiếng kêu cứu của muôn loài gặp nạn trên biển.',
          type: 'patrol',
          placeId: 'phodalacgia',
          rewardContrib: 220,
          rewardStones: 550,
        },
        {
          id: `ls_med_ngudai_${y}`,
          title: 'Ngũ Đài Sơn Mượn Trí Tuệ Kiếm Trảm Ma',
          desc: 'Chiêm bái đạo tràng Văn Thù Sư Lợi Bồ Tát, quán tưởng thanh trí tuệ bảo kiếm chặt đứt vô minh ám muội cùng tâm ma nội tại.',
          type: 'meditate',
          placeId: 'ngudaison',
          rewardContrib: 200,
          rewardStones: 500,
        },
        {
          id: `ls_med_ngami_${y}`,
          title: 'Nga Mi Kim Đỉnh Phát Nguyện Đại Hạnh',
          desc: 'Đứng trên đỉnh cao ngắm Phật quang vạn trượng, đảnh lễ Phổ Hiền Bồ Tát phát đại thệ nguyện kiên định hành thiện cứu độ hữu tình.',
          type: 'meditate',
          placeId: 'ngamison',
          rewardContrib: 200,
          rewardStones: 500,
        },
        {
          id: `ls_patrol_cuuhoa_${y}`,
          title: 'Cửu Hoa Khai Đàn Siêu Độ Chúng Sinh',
          desc: 'Phụng sự Địa Tạng Bồ Tát khai đàn niệm tụng kinh U Minh, gõ chuông dẫn độ vong linh thoát khỏi bể khổ trầm luân.',
          type: 'patrol',
          placeId: 'cuuhoason',
          rewardContrib: 240,
          rewardStones: 600,
        },
        {
          id: `ls_item_bodhi_${y}`,
          title: 'Hái Bồ Đề Tử Cung Dường Chư Phật',
          desc: 'Thu thập quả Bồ Đề Tử tròn trịa sáng ngời dưới bóng bồ đề già dâng cúng Tam Bảo làm tràng hạt định tâm niệm Phật.',
          type: 'donate_item',
          placeId: 'sonmon',
          reqItem: 'h:bodhitu',
          reqItemCount: 5,
          rewardContrib: 320,
          rewardStones: 800,
        }
      );
      break;
  }

  return list;
}

/** Kiểm tra hoàn thành nhiệm vụ */
export function isMissionDone(realmId: CelestialId, missionId: string): boolean {
  const doneMap = (s.flags.celestialMissionsDone ||= {});
  const y = Math.floor(s.year);
  return doneMap[`${realmId}:${missionId}:${y}`] === true;
}

/** Nộp nhiệm vụ phụng mệnh */
export function completeMission(realmId: CelestialId, m: CelestialMission): { ok: boolean; msg: string } {
  if (isMissionDone(realmId, m.id)) return { ok: false, msg: 'Nhiệm vụ này ngươi đã hoàn thành trong năm nay rồi.' };

  if (m.type === 'donate_item' && m.reqItem && m.reqItemCount) {
    if (count(m.reqItem) < m.reqItemCount) {
      return { ok: false, msg: `Không đủ vật phẩm yêu cầu: cần ${m.reqItemCount} ${itemName(m.reqItem)} (hiện có ${count(m.reqItem)}).` };
    }
    removeItem(m.reqItem, m.reqItemCount);
  }

  let extraMsg = '';
  if (m.type === 'patrol') {
    passTime(1 / 12);
    extraMsg = ' (Mất 1 tháng tuần sát)';
  } else if (m.type === 'meditate') {
    passTime(1 / 12);
    s.tamma = Math.max(0, s.tamma - 15);
    if (ch(0.25)) {
      s.stats.tam = (s.stats.tam || 0) + 1;
      extraMsg = ' (Mất 1 tháng nhập định · Tâm ma -15, ngộ đạo sâu sắc: Đạo tâm +1!)';
    } else {
      extraMsg = ' (Mất 1 tháng nhập định · Tâm ma -15, tâm thần an định)';
    }
  } else if (m.type === 'slay') {
    passTime(1 / 12);
    const progGain = Math.min(20, Math.max(8, 6 + effRi() * 2));
    const progMsg = addProg(progGain);
    extraMsg = ` (Mất 1 tháng xuất kích trảm yêu ma · ${progMsg})`;
  }

  const doneMap = (s.flags.celestialMissionsDone ||= {});
  const y = Math.floor(s.year);
  doneMap[`${realmId}:${m.id}:${y}`] = true;

  addCelestialContrib(realmId, m.rewardContrib);
  s.money += m.rewardStones;
  addLog(`Hoàn thành phụng mệnh 【${m.title}】: nhận +${m.rewardContrib} cống hiến, +${fmt(m.rewardStones)} linh thạch.${extraMsg}`, 'good');

  return { ok: true, msg: `Hoàn tất nhiệm vụ! +${m.rewardContrib} cống hiến, +${fmt(m.rewardStones)} linh thạch.${extraMsg}` };
}

// ---------- Cúng dường Linh Thạch ----------
export function donateSpiritStones(realmId: CelestialId, tier: 1 | 2 | 3): { ok: boolean; msg: string } {
  const costs = [0, 1000, 5000, 20000];
  const contribs = [0, 100, 550, 2500];
  const cost = costs[tier];
  const gain = contribs[tier];

  if (s.money < cost) return { ok: false, msg: `Không đủ linh thạch: cần ${fmt(cost)} linh thạch.` };

  s.money -= cost;
  addCelestialContrib(realmId, gain);
  addLog(`Tại ${CELESTIAL[realmId].n}, ngươi cúng dường ${fmt(cost)} linh thạch, tăng +${gain} cống hiến thần giới!`, 'good');
  return { ok: true, msg: `Cúng dường thành công: +${gain} cống hiến thần giới!` };
}

// ---------- Bảo Khố Thần Giới (Vật phẩm đổi bằng cống hiến) ----------
export interface VaultEntry {
  id: string; // 'cp:*', 'sk:*', 'tp:*', 'fq:*', 'm:*', 'h:*', 'gear:*'
  n: string;
  tier: number;
  kindLabel: string;
  contribCost: number;
  rankReq: number;
  desc: string;
  gearObj?: Gear;
}

export function getCelestialVaultEntries(realmId: CelestialId): VaultEntry[] {
  const out: VaultEntry[] = [];
  const curR = effRi();
  const gearLv = Math.max(3, Math.min(8, curR + 1));

  switch (realmId) {
    case 'thiendinh': {
      const g1 = mkGear(gearLv, 5, 0, 'loi', 3);
      g1.n = 'Linh Lung Bảo Tháp';
      g1.refined = true;
      out.push({
        id: 'gear:linhlung',
        n: g1.n,
        tier: 6,
        kindLabel: 'Tiên Bảo Cực Phẩm',
        contribCost: 3500,
        rankReq: 2,
        desc: 'Bảo tháp tỏa hào quang trấn áp vạn ma, hộ thể kim quang vô địch.',
        gearObj: g1,
      });

      const g2 = mkGear(gearLv, 5, 1, 'kim', 3);
      g2.n = 'Chiếu Yêu Kính';
      g2.refined = true;
      out.push({
        id: 'gear:chieuyeu',
        n: g2.n,
        tier: 5,
        kindLabel: 'Tiên Bảo Thượng Phẩm',
        contribCost: 2200,
        rankReq: 1,
        desc: 'Gương báu soi rõ chân thân yêu ma, tăng mạnh bạo kích và chính xác.',
        gearObj: g2,
      });

      out.push(
        { id: 'm:thienhathuy', n: 'Thiên Hà Thần Thủy', tier: 5, kindLabel: 'Thần Vật', contribCost: 400, rankReq: 1, desc: 'Dùng tôi luyện nâng cấp pháp bảo cực phẩm.' },
        { id: 'm:dausuathoa', n: 'Đâu Suất Chân Hỏa', tier: 6, kindLabel: 'Tiên Hỏa', contribCost: 900, rankReq: 2, desc: 'Lửa lò Bát Quái dùng tôi luyện thần khí vô thượng.' },
        { id: 'h:bandao', n: 'Bàn Đào Tiên Quả', tier: 6, kindLabel: 'Tiên Dược', contribCost: 1200, rankReq: 3, desc: 'Ăn vào tăng thọ nguyên và đại lượng tu vi.' }
      );
      break;
    }

    case 'diaphu': {
      const g1 = mkGear(gearLv, 5, 0, 'am', 3);
      g1.n = 'Phán Quan Đoạt Mệnh Bút';
      g1.refined = true;
      out.push({
        id: 'gear:phanbut',
        n: g1.n,
        tier: 6,
        kindLabel: 'Minh Khí Cực Phẩm',
        contribCost: 3500,
        rankReq: 2,
        desc: 'Bút son định đoạt sinh tử, phát xuất âm sát công kích cực hiểm.',
        gearObj: g1,
      });

      const g2 = mkGear(gearLv, 5, 4, 'am', 3);
      g2.n = 'Nại Hà U Đăng';
      g2.refined = true;
      out.push({
        id: 'gear:naihadang',
        n: g2.n,
        tier: 5,
        kindLabel: 'Minh Khí Thượng Phẩm',
        contribCost: 2200,
        rankReq: 1,
        desc: 'Đèn dẫn hồn xua tan âm chướng, tăng phòng ngự tâm thần.',
        gearObj: g2,
      });

      out.push(
        { id: 'm:hoangtuyenthuy', n: 'Hoàng Tuyền Huyết Thủy', tier: 5, kindLabel: 'Minh Thủy', contribCost: 400, rankReq: 1, desc: 'Luyện chí bảo âm sát và rèn khí cực hàn.' },
        { id: 'm:tamsinhthach_mat', n: 'Tam Sinh Thạch Toái Phiến', tier: 6, kindLabel: 'Thần Thạch', contribCost: 900, rankReq: 2, desc: 'Mảnh đá thấu suốt kiếp số, dùng rèn thần giáp hộ mệnh.' },
        { id: 'h:binganhoa', n: 'Bỉ Ngạn Hoa Tinh', tier: 5, kindLabel: 'U Minh Thảo', contribCost: 650, rankReq: 2, desc: 'Luyện đan định phách và hộ tâm tuyệt phẩm.' }
      );
      break;
    }

    case 'yeugioi': {
      const g1 = mkGear(gearLv, 5, 0, 'hoa', 3);
      g1.n = 'Hỗn Thiên Ma Côn';
      g1.refined = true;
      out.push({
        id: 'gear:hontheoncon',
        n: g1.n,
        tier: 6,
        kindLabel: 'Yêu Binh Cực Phẩm',
        contribCost: 3500,
        rankReq: 2,
        desc: 'Côn nặng vạn cân, quét sạch phong vân, tăng cuồng bạo cực hạn.',
        gearObj: g1,
      });

      const g2 = mkGear(gearLv, 5, 3, 'moc', 3);
      g2.n = 'Thái Cổ Yêu Hoàng Kỳ';
      g2.refined = true;
      out.push({
        id: 'gear:yeuhoangky',
        n: g2.n,
        tier: 5,
        kindLabel: 'Yêu Binh Thượng Phẩm',
        contribCost: 2200,
        rankReq: 1,
        desc: 'Cờ lệnh vạn yêu, kích phát khí huyết và tốc độ kinh mạch.',
        gearObj: g2,
      });

      out.push(
        { id: 'm:chanlonghuyet', n: 'Chân Long Huyết Tinh', tier: 5, kindLabel: 'Huyết Tinh', contribCost: 450, rankReq: 1, desc: 'Bổ sung khí huyết thuần dương, tôi luyện long giáp.' },
        { id: 'm:thaicoyaudan', n: 'Thái Cổ Yêu Đan', tier: 6, kindLabel: 'Yêu Hạch', contribCost: 950, rankReq: 2, desc: 'Yêu đan vạn năm ẩn chứa sức mạnh nguyên thủy hồng hoang.' }
      );
      break;
    }

    case 'linhson': {
      const g1 = mkGear(gearLv, 5, 0, 'quang', 3);
      g1.n = 'Kim Cương Hàng Ma Xử';
      g1.refined = true;
      out.push({
        id: 'gear:hangmaxu',
        n: g1.n,
        tier: 6,
        kindLabel: 'Phật Bảo Cực Phẩm',
        contribCost: 3500,
        rankReq: 2,
        desc: 'Xử hàng ma Phật quang chói lòa, khắc chế ma sát toàn diện.',
        gearObj: g1,
      });

      const g2 = mkGear(gearLv, 5, 2, 'quang', 3);
      g2.n = 'Cửu Hoàn Tích Trượng';
      g2.refined = true;
      out.push({
        id: 'gear:cuuhoantruong',
        n: g2.n,
        tier: 5,
        kindLabel: 'Phật Bảo Thượng Phẩm',
        contribCost: 2200,
        rankReq: 1,
        desc: 'Trượng thiền thanh tao rung vang chuông ngọc, đại phúc hộ trì thể phách.',
        gearObj: g2,
      });

      out.push(
        { id: 'm:batcongduc', n: 'Bát Công Đức Thủy', tier: 5, kindLabel: 'Linh Dịch', contribCost: 400, rankReq: 1, desc: 'Gột rửa tâm ma nghiệp chướng, tôi luyện kim thân.' },
        { id: 'm:xaloi', n: 'Kim Cang Xá Lợi', tier: 6, kindLabel: 'Phật Cốt', contribCost: 900, rankReq: 2, desc: 'Tỏa hào quang bất hoại, tăng cường vĩnh viễn định lực tâm thần.' },
        { id: 'h:bodhitu', n: 'Bồ Đề Tử', tier: 5, kindLabel: 'Thánh Hạt', contribCost: 650, rankReq: 2, desc: 'Hạt ngộ đạo từ cội Bồ Đề, giúp đốn ngộ đạo lý sâu sắc.' }
      );
      break;
    }
  }

  return out;
}

/** Đổi vật phẩm từ Bảo Khố Thần Giới */
export function redeemVaultItem(realmId: CelestialId, item: VaultEntry): { ok: boolean; msg: string } {
  const contrib = celestialContrib(realmId);
  const curRank = celestialRank(realmId);

  if (curRank < item.rankReq) {
    const ranks = getBranchRanks(realmId);
    const needTitle = ranks[item.rankReq]?.title || 'Tiên chức cao hơn';
    return { ok: false, msg: `Cấp bậc chưa đủ: yêu cầu chức vị 【${needTitle}】 trở lên.` };
  }

  if (contrib < item.contribCost) {
    return { ok: false, msg: `Không đủ cống hiến: cần ${fmt(item.contribCost)} điểm (hiện có ${fmt(contrib)}).` };
  }

  if (bagFree() <= 0) {
    return { ok: false, msg: 'Túi trữ vật đã đầy, không thể nhận thêm vật phẩm.' };
  }

  // Nếu là Gear
  if (item.gearObj) {
    const gr = { ...item.gearObj, uid: `cel_gear_${realmId}_${Date.now()}` };
    if (!addGear(gr)) {
      return { ok: false, msg: 'Túi đồ đã đầy, không thể chứa thêm pháp bảo.' };
    }
  } else {
    if (addItem(item.id, 1) <= 0) {
      return { ok: false, msg: 'Túi đồ đã đầy, không thể nhận thêm vật phẩm.' };
    }
  }

  addCelestialContrib(realmId, -item.contribCost);
  addLog(`Đổi thành công 【${item.n}】 từ Bảo Khố ${CELESTIAL[realmId].n} (-${fmt(item.contribCost)} cống hiến).`, 'good');
  return { ok: true, msg: `Đổi thành công: ${item.n}!` };
}

// ---------- Thần Giới Tỉ Thí & Đại Bỉ / Pháp Hội ----------
export const isCelestialTiThiDone = (id: CelestialId) => (s.flags['cel_tithi_' + id] === Math.floor(s.year));
export const isCelestialDaiBiOpen = () => Math.floor(s.year) % 10 === 0;
export const celestialDaiBiNext = () => Math.floor(s.year) - (Math.floor(s.year) % 10) + 10;
export const isCelestialDaiBiDone = (id: CelestialId) => (s.flags['cel_daibi_' + id] === Math.floor(s.year));

export function celestialTiThi(id: CelestialId): Scene {
  s.flags['cel_tithi_' + id] = Math.floor(s.year);
  passTime(0.25);
  const R = CELESTIAL[id];
  const foeNames: Record<CelestialId, string[]> = {
    diaphu: ['Âm Binh Thống Lĩnh', 'Ngưu Đầu Quỷ Tướng', 'Mã Diện Hộ Vệ', 'Thập Điện Chấp Pháp Quỷ Soái'],
    thiendinh: ['Nam Thiên Môn Kim Giáp Tướng', 'Thiên Hà Thủy Quân Tiên Phong', 'Phục Ma Thần Tướng', 'Lăng Tiêu Thị Vệ'],
    yeugioi: ['Hắc Phong Yêu Tướng', 'Sư Đà Yêu Binh Dũng Sĩ', 'Hoa Quả Sơn Hầu Tướng', 'Bạch Cốt Sơn Hộ Vệ'],
    linhson: ['Bát Nhã Thiền Tăng', 'Kim Cương Hộ Pháp', 'Thập Bát La Hán Đệ Tử', 'Linh Sơn Hộ Đạo Giả'],
  };

  const lines: string[] = [];
  let wins = 0;
  const pool = foeNames[id];

  for (let i = 0; i < 3; i++) {
    const foeName = pool[i % pool.length];
    const r = fight(
      {
        name: foeName + ' · Vòng ' + (i + 1),
        r: Math.max(1, s.r),
        st: Math.min(3, i),
        kind: 'cultivator',
        mult: 0.9 + i * 0.08,
      },
      { lethal: false, noLoot: true }
    );
    s.wins -= r.win ? 1 : 0;
    s.kills = Math.max(0, s.kills - (r.win ? 1 : 0));
    lines.push('Vòng ' + (i + 1) + ': ' + fightSummary(r));
    if (!r.win) break;
    wins++;
    s.hurt = Math.max(0, s.hurt - 20);
  }

  const gainContrib = Math.round(120 * wins * (1 + effRi() * 0.25));
  const gainStones = Math.round(250 * wins * (1 + effRi() * 0.2));
  addCelestialContrib(id, gainContrib);
  s.money += gainStones;
  s.fame += wins * 8;
  addLog('Tham gia Thần Giới Tỉ Thí tại ' + R.n + ': Thắng ' + wins + '/3 vòng (+' + gainContrib + ' cống hiến, +' + fmt(gainStones) + ' linh thạch).', 'good');

  return {
    title: 'Thần Giới Tỉ Thí · ' + R.n,
    text: lines.join('\n') + '\n\nKết quả: Thắng ' + wins + '/3 hiệp lôi đài! Thần triều ban thưởng +' + gainContrib + ' cống hiến, +' + fmt(gainStones) + ' linh thạch.',
  };
}

export function celestialDaiBi(id: CelestialId): Scene {
  s.flags['cel_daibi_' + id] = Math.floor(s.year);
  passTime(0.5);
  const R = CELESTIAL[id];
  const festivalNames: Record<CelestialId, string> = {
    thiendinh: 'Hội Bàn Đào Dao Trì · Đại Diễn Võ',
    diaphu: 'Pháp Hội Vu Lan Bồn & Vô Thường Diễn Võ',
    yeugioi: 'Vạn Yêu Triều Thánh Đại Bỉ',
    linhson: 'Linh Sơn Vấn Đạo & Kim Liên Đại Pháp Hội',
  };
  const eventName = festivalNames[id];

  const lines: string[] = [];
  let wins = 0;
  for (let i = 0; i < 5; i++) {
    const r = fight(
      {
        name: 'Cao Thủ ' + R.n + ' · Tầng ' + (i + 1),
        r: Math.min(8, s.r + (i >= 3 ? 1 : 0)),
        st: Math.min(3, i % 3),
        kind: 'cultivator',
        mult: 0.95 + i * 0.09,
      },
      { lethal: false, noLoot: true }
    );
    s.wins -= r.win ? 1 : 0;
    s.kills = Math.max(0, s.kills - (r.win ? 1 : 0));
    lines.push('Trận ' + (i + 1) + ': ' + fightSummary(r));
    if (!r.win) break;
    wins++;
    s.hurt = Math.max(0, s.hurt - 25);
  }

  const gainContrib = Math.round(350 * wins * (1 + effRi() * 0.3));
  const gainStones = Math.round(800 * wins * (1 + effRi() * 0.3));
  addCelestialContrib(id, gainContrib);
  s.money += gainStones;
  s.fame += wins * 20;

  let extra = '';
  if (wins === 5) {
    mark('Đoạt khôi thủ ' + eventName);
    extra = '\n\n★ VÔ ĐỊCH PHÁP HỘI! Ngươi đoạt ngôi vị Quán Quân ' + eventName + ', danh chấn tam giới! Nhận thêm 1 thần đan đại đạo!';
    addItem('p:hondan', 1);
  }

  addLog('Tham gia ' + eventName + ': Thắng ' + wins + '/5 trận (+' + gainContrib + ' cống hiến, +' + fmt(gainStones) + ' linh thạch).', 'good');

  return {
    title: eventName,
    text: lines.join('\n') + '\n\nChiến tích: Thắng ' + wins + '/5 trận tại đại hội! Nhận +' + gainContrib + ' cống hiến, +' + fmt(gainStones) + ' linh thạch.' + extra,
  };
}

// ---------- Bế Quan Thần Mạch / Tiên Trì (Tu vi x3) ----------
export const celestialVeinCost = () => Math.round(180 * (effRi() + 1));

export function celestialVein(id: CelestialId): Scene {
  const c = celestialVeinCost();
  const contrib = celestialContrib(id);
  const R = CELESTIAL[id];
  if (contrib < c) return { title: 'Bế Quan Tiên Trì', text: 'Không đủ cống hiến thần giới (cần ' + c + ' điểm, hiện có ' + contrib + ').' };

  addCelestialContrib(id, -c);
  passTime(1.5);
  let g = 0;
  for (let i = 0; i < 4; i++) g += cultivateTurn().gain;
  const bonus = cultRate() * 4.5;
  addProg(bonus);

  const placeNames: Record<CelestialId, string> = {
    thiendinh: 'Bàn Đào Dao Trì Tiên Tuyền',
    diaphu: 'Cửu U Hoàng Tuyền Thần Mạch',
    yeugioi: 'Vạn Yêu Thái Cổ Huyết Trì',
    linhson: 'Bát Công Đức Thủy Kim Liên Trì',
  };

  addLog('Bế quan 1 năm 6 tháng tại ' + placeNames[id] + ', tu vi tăng vọt gấp ba (+' + Math.round(g + bonus) + '%).', 'good');

  return {
    title: 'Bế Quan Thần Mạch · ' + placeNames[id],
    text: 'Ngươi ngồi xếp bằng tại trung tâm ' + placeNames[id] + ' suốt một năm sáu tháng. Tinh hoa đại đạo ngưng tụ thành sương thẩm thấu qua từng lỗ chân lông. Tu vi tăng vọt ' + Math.round(g + bonus) + '% (nhanh gấp ba lần bình thường). Tốn ' + c + ' cống hiến thần giới.',
    kind: 'info',
  };
}

// ---------- Thần Ma Đại Chiến / Giới Chiến ----------
export function celestialCrusade(id: CelestialId): Scene {
  s.flags['cel_war_' + id] = Math.floor(s.year);
  passTime(0.5);
  const R = CELESTIAL[id];

  const lines: string[] = [
    'Chiêng đồng cổ xưa ngân vang, hiệu lệnh xuất chinh từ ' + R.n + ' truyền khắp hư không. Ngươi theo đại quân tiến vào Vực Ngoại Hư Không chinh phạt dị tộc phản nghịch!',
  ];

  const r1 = fight(
    {
      name: 'Đội Tiên Phong Vực Ngoại Ma Tộc',
      r: Math.max(1, s.r),
      st: 2,
      kind: 'demon',
      mult: 1.0,
    },
    { lethal: false }
  );
  lines.push('Tiên phong giao chiến: ' + fightSummary(r1));

  if (!r1.win) {
    s.hurt = Math.min(90, s.hurt + 20);
    addCelestialContrib(id, 100);
    return {
      title: 'Thần Ma Đại Chiến · ' + R.n,
      text: lines.join('\n\n') + '\n\nChiến dịch gặp trở ngại, quân đoàn lui về phòng thủ. Ngươi được nhận 100 cống hiến an ủi.',
    };
  }

  const r2 = fight(
    {
      name: 'Vực Ngoại Hỗn Độn Ma Tướng',
      r: Math.min(8, s.r + 1),
      st: 2,
      kind: 'boss',
      mult: 1.15,
    },
    { lethal: false }
  );
  lines.push('Huyết chiến Ma Tướng: ' + fightSummary(r2));

  if (!r2.win) {
    s.hurt = Math.min(95, s.hurt + 35);
    addCelestialContrib(id, 300);
    return {
      title: 'Thần Ma Đại Chiến · ' + R.n,
      text: lines.join('\n\n') + '\n\nMa Tướng quá hung hãn, chư thần phải hợp lực áp chế. Ngươi trảm địch dũng cảm, nhận 300 cống hiến thần giới.',
    };
  }

  const rewContrib = 1200 + effRi() * 300;
  const rewStones = 3000 + effRi() * 1000;
  addCelestialContrib(id, rewContrib);
  s.money += rewStones;
  s.fame += 50;
  addItem('m:hondontinh', 2);
  mark('Đại thắng Vực Ngoại Thần Ma cùng ' + R.n);
  addLog('Đại thắng Thần Ma Đại Chiến! Nhận +' + rewContrib + ' cống hiến, +' + fmt(rewStones) + ' linh thạch, 2 Hỗn Độn Linh Tinh!', 'good');

  return {
    title: 'Đại Thắng Thần Ma · ' + R.n,
    text: lines.join('\n\n') + '\n\nĐẠI THẮNG TOÀN DIỆN! Quân tiên phong quét sạch ma sào, trảm Ma Tướng Vực Ngoại. Ngươi được ban thưởng đại công: +' + rewContrib + ' cống hiến, +' + fmt(rewStones) + ' linh thạch và 2 viên Hỗn Độn Linh Tinh cực phẩm!',
  };
}

// ---------- Dạo Quanh Tiên Cảnh (Kỳ Ngộ) ----------
export function celestialWander(id: CelestialId): Scene {
  passTime(2 / 12);
  const R = CELESTIAL[id];

  // Nếu đang có nguy cơ bị phản bội do trước đây từng áp chế bằng vũ lực
  if (s.flags.celestialRebellionRisk && Math.random() < 0.28) {
    const assassin = fight(
      {
        name: `Thích Khách Phản Nghịch · Môn Đồ Cũ ${R.n}`,
        r: Math.max(1, s.r),
        st: 2,
        kind: 'cultivator',
        mult: 1.15,
      },
      { lethal: false }
    );

    if (assassin.win) {
      addLog(`Nửa đêm bị môn đồ cũ mai phục ám sát! Ngươi dũng mãnh phản kích trảm sát thích khách!`, 'good');
      return {
        title: `Phản Trắc Ám Sát · ${R.n}`,
        text: `Đêm thanh vắng tại ${R.n}, một đạo hàn quang sắc lẹm xé gió đánh úp sau lưng! Môn đồ cũ bất phục ôm hận câu kết thích khách mưu sát đoạt lại thần vị!\n\n` +
          `${fightSummary(assassin)}\n\n` +
          `Ngươi giơ tay chế phục thích khách, tra ra danh sách kẻ chủ mưu phản loạn ngấm ngầm trong môn đình!`,
        fights: [assassin],
        choices: [
          {
            t: 'Huyết sát toàn bộ kẻ mưu phản (Xóa bỏ nguy cơ phản trắc)',
            hint: 'Tru diệt kẻ phản loạn tận gốc · Tà ác +15',
            cls: 'danger',
            fn: () => {
              s.flags.celestialRebellionRisk = false;
              s.evil = (s.evil || 0) + 15;
              addLog('Ngươi thẳng tay tru diệt toàn bộ kẻ chủ mưu phản nghịch, nhổ cỏ tận gốc!', 'bad');
              return 'Ngươi đã hạ lệnh hành quyết toàn bộ kẻ tham gia âm mưu ám sát. Từ nay mối nguy phản loạn trong nội bộ hoàn toàn chấm dứt!';
            },
          },
          {
            t: 'Tha mạng cho đệ tử, tăng cường trận pháp phòng vệ',
            hint: 'Khoan dung răn đe · Thiện duyên +10',
            cls: 'prime',
            fn: () => {
              s.good = (s.good || 0) + 10;
              addLog('Ngươi khoan dung tha mạng cho kẻ tạo phản, tăng cường phòng vệ.', 'good');
              return 'Ngươi khoan thứ tha chết, nhưng phế đi tu vi kẻ chủ mưu răn đe. Môn hạ chấn động trước ân uy của ngươi.';
            },
          },
        ],
      };
    } else {
      s.hurt = 75;
      addLog(`Bị môn đồ phản nghịch đánh lén trọng thương!`, 'bad');
      return {
        title: `Ám Sát Trọng Thương · ${R.n}`,
        text: `Nửa đêm bị môn đồ phản nghịch tập kích bất ngờ! Ngươi không kịp chuẩn bị nên bị thương nặng, may nhờ hộ thân bảo quang bảo vệ mới đuổi được thích khách đi!\n\n` +
          `${fightSummary(assassin)}\n\nHãy cẩn trọng hơn với nguy cơ phản trắc!`,
        fights: [assassin],
      };
    }
  }

  const rnd = Math.random();

  if (rnd < 0.35) {
    addItem('m:hondontinh', 1);
    addLog('Dạo quanh ' + R.n + ', ngươi tìm thấy Hỗn Độn Linh Tinh giữa khe đá tiên cảnh!', 'good');
    return {
      title: 'Dạo Quanh Tiên Cảnh · ' + R.n,
      text: 'Du ngoạn giữa mây mờ sương phủ của ' + R.n + ', ngươi phát hiện một luồng linh quang sáng ngời giữa vách đá cổ kính, thu được 1 viên Hỗn Độn Linh Tinh quý giá!',
    };
  } else if (rnd < 0.7) {
    let g = cultivateTurn().gain * 1.5;
    addProg(g);
    addLog('Ngắm nhìn thiên địa pháp tắc tại ' + R.n + ', tu vi tăng tiến +' + Math.round(g) + '%!', 'good');
    return {
      title: 'Dạo Quanh Tiên Cảnh · ' + R.n,
      text: 'Dạo bước thưởng ngoạn thắng cảnh, ngươi chứng kiến một luồng thần thông hư ảnh giao hòa cùng thiên đạo, bỗng nhiên có chỗ đốn ngộ! Tu vi tăng tiến +' + Math.round(g) + '%.',
    };
  } else {
    addCelestialContrib(id, 80);
    s.stats.ngo = Math.min(30, s.stats.ngo + (Math.random() < 0.2 ? 1 : 0));
    addLog('Đàm đạo cùng chư tiên tại ' + R.n + ': +80 cống hiến.', 'good');
    return {
      title: 'Dạo Quanh Tiên Cảnh · ' + R.n,
      text: 'Tại vọng đình tiên cảnh, ngươi hạnh ngộ vài vị tiên quan thần tướng đang luận đạo. Đôi bên nâng chén trà tiên hàn huyên ý vị. Thần triều ghi nhận công đức: +80 cống hiến.',
    };
  }
}

// ---------- Thỉnh An Tiên Hiền / Bái Sư ----------
export function celestialBlessing(id: CelestialId): Scene {
  passTime(1 / 12);
  const R = CELESTIAL[id];
  const patrons: Record<CelestialId, { name: string; title: string; gift: string }> = {
    thiendinh: { name: 'Thái Thượng Lão Quân', title: 'Đạo Đức Thiên Tôn', gift: 'Ban cho một chén Bát Quái Tiên Trà, gột rửa tâm ma, ngộ tính +1!' },
    diaphu: { name: 'Địa Tạng Vương Bồ Tát', title: 'U Minh Giáo Chủ', gift: 'Khẽ điểm lên trán ngươi một vệt kim quang đại nguyện, định lực tâm thần kiên cố bất hoại!' },
    linhson: { name: 'Tây Thiên Phật Tổ Như Lai', title: 'Thích Ca Mâu Ni', gift: 'Niêm hoa vi tiếu, thuyết một đoạn kinh Bát Nhã, tu vi tăng tiến 5%!' },
    yeugioi: { name: 'Tề Thiên Đại Thánh', title: 'Đấu Chiến Thắng Phật', gift: 'Vỗ vai ngươi cười lớn, chỉ điểm cho ba chiêu côn pháp biến hóa, khí huyết sôi trào!' },
  };

  const p = patrons[id];
  s.stats.ngo = Math.min(30, s.stats.ngo + 1);
  addCelestialContrib(id, 120);
  addLog('Thỉnh an ' + p.name + ' tại ' + R.n + ': ' + p.gift + ' (+120 cống hiến)', 'good');

  return {
    title: 'Thỉnh An Tiên Hiền · ' + p.name,
    text: 'Ngươi thành kính dâng hương thỉnh an trước pháp giá của ' + p.name + ' (' + p.title + ').\n\n' + p.name + ' mỉm cười gật đầu, ' + p.gift + '\n\nCống hiến thần giới +120 điểm.',
  };
}

// ---------- Giao Nộp Tài Vật / Vật Phẩm Đổi Cống Hiến (Nhiệm Vụ Đường) ----------
export function celestialDonateBagItem(realmId: CelestialId, itemId: string, qty = 1): { ok: boolean; msg: string; contrib: number } {
  const currentCount = count(itemId);
  if (currentCount < qty) return { ok: false, msg: 'Trong túi trữ vật không đủ số lượng: cần ' + qty + ' (có ' + currentCount + ').', contrib: 0 };

  const tier = itemTier(itemId);
  const price = itemPrice(itemId);
  const contribPerUnit = Math.max(10, Math.round(tier * 25 + price * 0.08));
  const totalContrib = contribPerUnit * qty;

  removeItem(itemId, qty);
  addCelestialContrib(realmId, totalContrib);
  addLog('Giao nộp ' + qty + 'x 【' + itemName(itemId) + '】 vào thần khố ' + CELESTIAL[realmId].n + ': nhận +' + totalContrib + ' cống hiến!', 'good');

  return { ok: true, msg: 'Giao nộp thành công ' + qty + 'x ' + itemName(itemId) + ', nhận +' + totalContrib + ' cống hiến!', contrib: totalContrib };
}

// ==========================================================
// ---------- CHỨC NĂNG KHIÊU CHIẾN ĐOẠT VỊ TRÍ / CHỨC VỤ ----------
// ==========================================================

/** Khiêu chiến với Thái Độ Đoan Chính (Ước hẹn quang minh, 1v1, thua chỉ trọng thương) */
export function celestialUsurpPolite(realmId: CelestialId, office: COfficeView): Scene {
  passTime(0.25);
  const R = CELESTIAL[realmId];

  const duel = fight(
    {
      name: `${office.name} (${office.title})`,
      r: office.r,
      st: 2,
      kind: 'cultivator',
      mult: 1.15,
    },
    { lethal: false, noFlee: true }
  );

  if (duel.win) {
    (s.flags.celestialUsurped ||= {})[`${realmId}:${office.title}`] = true;
    addCelestialContrib(realmId, 2500);
    s.money += 15000;
    s.fame += 60;
    addLog(`Quang minh chính đại khiêu chiến đánh bại ${office.name}, tiếp quản chức vị 【${office.title}】 của ${R.n}!`, 'good');
    return {
      title: `Khiêu Chiến Đoạt Vị Thành Công · ${office.title}`,
      text: `Dưới sự chứng kiến của chư thiên thần tướng tại ${R.n}, ngươi và ${office.name} bước lên lôi đài tỉ thí đoạt vị đoan chính.\n\n` +
        `${fightSummary(duel)}\n\n` +
        `${office.name} chắp tay tâm phục khẩu phục, tự nguyện trao lại lệnh bài ấn tín của 【${office.title}】 cho ngươi! Chư tiên đồng loạt chúc mừng tân vị quang minh chính đại!\n\n` +
        `Nhận +2,500 cống hiến thần triều, +15,000 linh thạch bổng lộc, uy danh tam giới vang dội!`,
      fights: [duel],
    };
  } else {
    s.hurt = 85;
    passTime(0.25);
    addLog(`Tỉ thí đoạt vị thất bại trước ${office.name}. May nhờ thái độ đoan chính, đối phương thủ hạ lưu tình, ngươi chỉ bị trọng thương dưỡng bệnh 3 tháng.`, 'bad');
    return {
      title: `Tỉ Thí Bại Trận · ${office.title}`,
      text: `Ngươi dốc hết thần thông nhưng thực lực vẫn còn kém ${office.name} một bậc, cuối cùng bại trận.\n\n` +
        `${fightSummary(duel)}\n\n` +
        `Tuy nhiên, nhờ trước trận ngươi dâng chiến thư lễ độ, ${office.name} thán phục chí khí dũng cảm, kịp thời thu tay hạ lưu tình, chỉ điểm cho ngươi vài chỗ thiếu sót rồi cho người đưa ngươi về điều dưỡng.\n\n` +
        `Ngươi chỉ bị trọng thương (Khí huyết tổn hao), lui về tịnh dưỡng 3 tháng để mài giũa lại đạo hạnh.`,
      fights: [duel],
    };
  }
}

/** Khiêu chiến với Thái Độ Ngang Tàng (Huyết tẩy cướp ngôi, đấu cả thế lực, thua thì chết xuống địa phủ) */
export function celestialUsurpRuthless(realmId: CelestialId, office: COfficeView): Scene {
  passTime(0.25);
  const R = CELESTIAL[realmId];

  // Vòng 1: Đội hình Hộ Pháp Thần Tướng Trấn Thủ
  const guardFight = fight(
    {
      name: `Hộ Pháp Thần Tướng · Trấn Thủ ${R.n}`,
      r: Math.max(1, office.r - 1),
      st: 2,
      kind: 'cultivator',
      mult: 1.05,
    },
    { lethal: true, noFlee: true }
  );

  if (!guardFight.win) {
    return underworldJudgmentScene(realmId, office, 'Hộ Pháp Thần Tướng', [guardFight]);
  }

  // Vòng 2: Người giữ chức vụ toàn lực thị nộ cùng đại trận
  const leaderFight = fight(
    {
      name: `${office.name} · ${office.title} (Thị Nộ Toàn Lực)`,
      r: office.r,
      st: 3,
      kind: 'cultivator',
      mult: 1.35,
    },
    { lethal: true, noFlee: true }
  );

  if (!leaderFight.win) {
    return underworldJudgmentScene(realmId, office, office.name, [guardFight, leaderFight]);
  }

  // Nếu đánh thắng toàn bộ:
  addLog(`Ngạo nghễ huyết chiến san bằng toàn bộ phòng ngự của ${R.n}, đánh bại ${office.name}!`, 'good');
  return {
    title: `Huyết Chiến Đoạt Vị Thắng Lợi · ${office.title}`,
    text: `Ngươi ngang tàng xông vào đại điện, liên tiếp chém rách đại trận hộ sơn, đè bẹp Hộ Pháp Thần Tướng rồi một kích kinh thiên đánh gục ${office.name} (${office.title})!\n\n` +
      `Toàn bộ môn hạ, trưởng lão và chư thần ${R.n} kinh hoàng run sợ trước sát khí ngập trời của ngươi. Trước mắt ngươi có hai con đường xử trí thế lực này:\n\n` +
      `▸ Đánh phục tất cả: Bắt toàn bộ môn đồ quỳ phục xưng thần, tiếp quản trọn vẹn thế lực (nhưng luôn tiềm ẩn nguy cơ phản bội ngấm ngầm).\n` +
      `▸ Giết sạch diệt khẩu: Huyết tẩy toàn bộ mầm họa phản nghịch, trảm thảo trừ căn để chiêu mộ môn đồ mới trung thành từ đầu.`,
    fights: [guardFight, leaderFight],
    choices: [
      {
        t: 'Đánh phục tất cả (Áp chế bằng vũ lực)',
        hint: 'Môn đồ quy phục xưng thần · Nguy cơ bị phản trắc / ám sát sau này',
        cls: 'prime',
        fn: () => resolveUsurpChoice(realmId, office, 'subdue'),
      },
      {
        t: 'Giết sạch diệt khẩu, chiêu mộ môn đồ mới',
        hint: 'Huyết tẩy môn đình trừ hậu họa · Tà ác +50, mở chiêu mộ môn đồ mới',
        cls: 'danger',
        fn: () => resolveUsurpChoice(realmId, office, 'purge'),
      },
    ],
  };
}

/** Xử lý lựa chọn khi đánh thắng thái độ kém */
export function resolveUsurpChoice(realmId: CelestialId, office: COfficeView, mode: 'subdue' | 'purge'): Outcome {
  const R = CELESTIAL[realmId];
  (s.flags.celestialUsurped ||= {})[`${realmId}:${office.title}`] = true;

  if (mode === 'subdue') {
    s.flags.celestialRebellionRisk = true;
    addCelestialContrib(realmId, 5000);
    s.money += 50000;
    s.fame += 120;
    addLog(`Dùng vũ lực tuyệt đối áp chế toàn bộ ${R.n}, cưỡng ép môn đồ quỳ phục xưng thần! Nắm quyền 【${office.title}】 (Nguy cơ bị phản bội âm ỉ).`, 'good');
    return {
      text: `【VŨ LỰC ÁP CHẾ · CHƯ THẦN QUỲ PHỤC】\n\n` +
        `Ngươi giẫm chân lên đại điện, khí thế bễ nghễ thiên hạ. Toàn bộ môn đồ, chấp sự và hộ pháp của ${R.n} dập đầu run rẩy, đồng thanh tôn xưng ngươi là chủ nhân mới của 【${office.title}】!\n\n` +
        `Ngươi tiếp quản toàn bộ kho tàng linh thạch và thuộc hạ (+5,000 cống hiến, +50,000 linh thạch).\n\n` +
        `⚠️ Cảnh báo: Môn đồ ngoài mặt thần phục nhưng trong lòng nung nấu thù hận, nguy cơ bị thích khách ám sát hoặc nội ứng tạo phản có thể xảy ra bất cứ lúc nào! Hãy luôn nâng cao cảnh giác khi dạo quanh tiên cảnh!`,
    };
  } else {
    s.flags.celestialRebellionRisk = false;
    (s.flags.celestialRecruitNew ||= {})[`${realmId}:${office.place}`] = true;
    s.evil = (s.evil || 0) + 50;
    addCelestialContrib(realmId, 15000);
    s.money += 100000;
    s.fame += 150;
    addLog(`Huyết tẩy sạch bóng toàn bộ kẻ chống đối tại ${R.n}! Trảm thảo trừ căn, đoạt lấy 【${office.title}】! Có thể chiêu mộ môn đồ mới từ đầu.`, 'bad');
    return {
      text: `【HUYẾT TẨY MÔN ĐÌNH · TRẢM THẢO TRỪ CĂN】\n\n` +
        `Một đao trảm sạch vạn dặm mây đen! Ngươi không lưu lại bất kỳ một mầm mống phản trắc nào, máu nhuộm đỏ bậc thềm tiên cảnh, quét sạch toàn bộ kẻ ngoan cố!\n\n` +
        `Tà ác +50 điểm! Ngươi thu vét toàn bộ tàn dư bảo vật tích lũy muôn đời của thế lực (+15,000 cống hiến, +100,000 linh thạch).\n\n` +
        `Đạo tràng nay hoàn toàn trống trơn dưới sự thống trị độc tôn của ngươi. Mối lo phản bội hoàn toàn tiêu tan! Ngươi có thể tự mình chiêu mộ đội ngũ môn đồ và thần tướng mới trung thành tuyệt đối từ con số 0!`,
    };
  }
}

/** Tòa án Âm Ty Địa Phủ khi đánh thua với thái độ kém */
export function underworldJudgmentScene(realmId: CelestialId, office: COfficeView, slayerName: string, fights: FightResult[]): Scene {
  const isEvil = (s.evil || 0) > (s.good || 0) || (s.evil || 0) >= 30;

  let text = `Trận huyết chiến kết thúc trong bi thảm! Trước sức mạnh liên thủ của cả thế lực, ngươi bị ${slayerName} đánh nát đạo thể, nhục thân hóa thành tro bụi!\n\n` +
    `Linh hồn ngươi lìa khỏi thể xác, biến thành một luồng Cô Hồn Dã Quỷ vất vưởng phiêu bạt giữa thiên địa lạnh lẽo.\n\n` +
    `Đột nhiên, âm phong rít gào buốt giá, sương đen cuồn cuộn xuất hiện. Hắc Bạch Vô Thường tay cầm Tỏa Hồn Xích xông tới vung xích khóa chặt cổ ngươi:\n` +
    `“Hồn phách to gan cuồng vọng! Dám dùng thái độ ngang tàng huyết tẩy thần vị, nay chết dưới tay chư thần, còn không mau theo ta xuống Phong Đô thụ thẩm!”\n\n` +
    `Xích sắt siết chặt, kéo thẳng thần hồn ngươi qua Quỷ Môn Quan, vượt Hoàng Tuyền Lộ, điệu tới trước công đường Sâm La Điện của Thập Điện Diêm La!\n\n`;

  if (isEvil) {
    text += `Thôi Phán Quan lật mở Sinh Tử Bộ, dùng bút son chỉ vào tên ngươi nghiêm giọng tấu:\n` +
      `“Khởi bẩm Diêm Vương, kẻ này bình sinh mang nặng dã tâm cướp đoạt, tích tụ ${s.evil || 0} điểm Tà Ác, sát khí ngập trời! Chiếu theo âm luật, đáng bị đày xuống 18 Tầng Địa Ngục để đền tội!”\n\n` +
      `Diêm La Vương đập mạnh kinh đường mộc rền vang như sấm, phán quyết định tội! Ngươi có thể chọn chấp nhận đền tội hoặc xin cầu luân hồi:`;

    return {
      title: `Âm Ty Thẩm Phán · Đày Xuống 18 Tầng Địa Ngục`,
      text,
      fights,
      choices: [
        {
          t: 'Chấp nhận đày xuống 18 Tầng Địa Ngục (Đền tội nghiệp chướng)',
          hint: 'Chịu ngục hình Vạc Dầu Đao Sơn, gột rửa tâm ma, niết bàn tái sinh thành Quỷ Tu',
          cls: 'danger',
          fn: () => execute18HellsSentence(),
        },
        {
          t: 'Xin được uống Canh Mạnh Bà để Đầu Thai chuyển kiếp',
          hint: 'Bước lên Lục Đạo Luân Hồi Đài, bắt đầu kiếp sống mới',
          fn: () => executeReincarnation(),
        },
      ],
    };
  } else {
    text += `Thôi Phán Quan lật giở Sinh Tử Bộ, ngạc nhiên bẩm báo:\n` +
      `“Khởi bẩm Diêm Vương! Kẻ này tuy cuồng ngạo tử trận, song bình sinh tích lũy nhiều công đức thiện hạnh (${s.good || 0} điểm Thiện), đã từng cứu độ nhiều sinh linh, chính khí chưa tan!”\n\n` +
      `Phong Đô Đại Đế đích thân hạ chỉ tiếc tài:\n` +
      `“Bản đế khâm phục khí phách và tâm tính thiện đạo của ngươi. Thay vì đưa đi luân hồi đày đọa, nay bản đế đặc cách phong thưởng ngươi làm Quan tại Địa Phủ!”`;

    return {
      title: `Âm Ty Thẩm Phán · Sắc Phong Âm Quan`,
      text,
      fights,
      choices: [
        {
          t: 'Tiếp nhận sắc phong làm Quan tại Địa Phủ',
          hint: 'Thụ phong Tiên Chức Âm Ty, nhận bổng lộc, thần hồn bất diệt',
          cls: 'prime',
          fn: () => executeUnderworldOfficial(),
        },
        {
          t: 'Xin được bước vào Lục Đạo Luân Hồi để Đầu Thai kiếp khác',
          hint: 'Uống Canh Mạnh Bà tại Lục Đạo Luân Hồi Đài, bắt đầu lại kiếp sau',
          fn: () => executeReincarnation(),
        },
      ],
    };
  }
}

/** Chịu phạt tại 18 Tầng Địa Ngục: Xóa tội, tôi rèn thần hồn, tái sinh thành Quỷ Tu */
export function execute18HellsSentence(): Outcome {
  s.hurt = 0;
  s.evil = 0;
  s.tamma = 0;
  setLoc('hoangtuyen_quymon');
  addCelestialContrib('diaphu', 500);
  addLog('Trải qua 18 Tầng Địa Ngục đền tội, nghiệp hỏa tôi luyện thần hồn, ngươi niết bàn tái sinh thành Quỷ Tu tại bờ Hoàng Tuyền!', 'good');
  return {
    text: `【18 TẦNG ĐỊA NGỤC · TỘI NGHIỆP TIÊU TAN】\n\n` +
      `Ngươi bị áp giải qua Vạc Dầu sôi sục, Rừng Đao rợn gáy, Cối Giã nát thịt! Nghiệp hỏa hồng liên thiêu rụi toàn bộ tà niệm và tâm ma tích tụ thuở sinh tiền.\n\n` +
      `Sau vạn kiếp thống khổ, tội nghiệt đền sạch! Thần hồn ngươi chẳng những không tan biến mà còn ngưng kết thành Âm Hồn Bất Diệt, tái sinh tại Hoàng Tuyền Quỷ Môn Quan!\n\n` +
      `Tâm ma xóa sạch (0/100), Tà ác về 0, nhận +500 cống hiến Địa Phủ. Hãy bắt đầu lại con đường tu chân!`,
  };
}

/** Nhận sắc phong làm Quan tại Địa Phủ: Thần hồn bất diệt, thành Quỷ Tiên */
export function executeUnderworldOfficial(): Outcome {
  s.hurt = 0;
  s.tamma = 0;
  setCelestialBranch('diaphu', 'tanquang');
  addCelestialContrib('diaphu', 2000);
  s.money += 20000;
  (s.flags.celestialUsurped ||= {})['diaphu:Hoàng Tuyền Lộ Dẫn Hồn Sứ'] = true;
  addLog('Diêm La Vương tiếc tài đức, sắc phong ngươi làm Quan tại Địa Phủ! Thần hồn bất diệt hóa thành Quỷ Tiên.', 'good');
  return {
    text: `【SẮC PHONG TIÊN CHỨC ÂM TY · PHONG ĐÔ TRIỀU HỘI】\n\n` +
      `Thôi Phán Quan xướng danh trên điện Sâm La, Phong Đô Đại Đế ban lệnh bài huyền thiết:\n\n` +
      `“Ngươi tuy binh bại, nhưng bình sinh thiện nghiệp thấu trời, đạo hạnh phi phàm. Bản đế đặc cách sắc phong ngươi làm 【Địa Phủ Tuần Tra Quỷ Quan】, chưởng quản tuần sát bờ cõi Hoàng Tuyền, nhận bổng lộc âm triều!”\n\n` +
      `Hào quang U Minh nhập thể, nhục thân ngươi ngưng tụ thành Âm Tiên Đạo Thể! Nhận +2,000 cống hiến Địa Phủ, +20,000 linh thạch bổng lộc. Tiếp tục đại đạo trường sinh tại cõi Âm Ty!`,
  };
}

/** Đầu thai chuyển kiếp: Uống canh Mạnh Bà, chuyển sinh luân hồi */
export function executeReincarnation(): Outcome {
  s.flags.soulBorn ??= s.born;
  s.flags.lifeLived = (s.flags.lifeLived || 0) + (s.year - s.born);
  s.born = s.year - 16;
  s.hurt = 0;
  s.tamma = 0;
  s.flags.reincarnated = true;
  s.stats.tam = (s.stats.tam || 0) + 2;
  s.stats.ngo = (s.stats.ngo || 0) + 1;
  addLog('Uống Canh Mạnh Bà tại Lục Đạo Luân Hồi Đài, ngươi đầu thai chuyển kiếp thành công!', 'good');
  return {
    text: `【LỤC ĐẠO LUÂN HỒI · ĐẦU THAI CHUYỂN THẾ】\n\n` +
      `Bên bờ Vong Xuyên Hà, Mạnh Bà trao cho ngươi một bát Vong Ưu Thang trong suốt. Ngươi uống cạn bát canh, bước lên Luân Hồi Đài sáng rực kim quang!\n\n` +
      `Vòng xoay Lục Đạo chuyển động, ân oán tiền kiếp khép lại. Nhờ công đức và thần thức cường đại, ngươi giữ lại được Chân Linh Ấn Ký khi chuyển sinh vào hình hài một thiếu niên 16 tuổi!\n\n` +
      `Đạo tâm +2, Ngộ tính +1, thương thế bình phục hoàn toàn. Một kiếp tu chân mới chính thức mở ra!`,
  };
}

/** Chiêu mộ môn đồ mới sau khi đã huyết tẩy diệt khẩu */
export function recruitCelestialDisciples(realmId: CelestialId, placeId: string, customName?: string): { ok: boolean; msg: string } {
  const cost = 2000;
  if (s.money < cost) return { ok: false, msg: `Không đủ linh thạch chiêu mộ: cần ${fmt(cost)} linh thạch.` };

  s.money -= cost;
  const name = customName?.trim() || pick(['Cơ Lôi Chấn (Lôi Chấn Tử)', 'Kim Giáp Hộ Vệ', 'Huyền Minh Quỷ Tướng', 'Hắc Phong Tiên Phong', 'Vô Cực Kiếm Đồng', 'Thanh Phong Đạo Đồng']);
  const list = ((s.flags.celestialRecruitedDisciples ||= {})[`${realmId}:${placeId}`] ||= []);
  list.push(name);
  addCelestialContrib(realmId, 150);
  addLog(`Chiêu mộ thành công môn đồ mới 【${name}】 gia nhập trấn thủ ${CELESTIAL[realmId].places.find(p => p.id === placeId)?.n || placeId}!`, 'good');
  return { ok: true, msg: `Đã chiêu mộ môn đồ trung thành 【${name}】 (+150 cống hiến)!` };
}

