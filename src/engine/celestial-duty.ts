// Hệ thống Pháp Bảo Trấn Chức & Nhiệm Vụ Chấp Chính Đặc Thù Kèm Mini-Game
// 1. Ban Pháp Bảo Trấn Chức theo Tiên Chức Thần Thoại.
// 2. Mini-game 1: Hành Vân Bố Vũ (Long Vương / Thủy Quân) - Tạo mây, kích lôi, làm mưa chuẩn lượng nước Ngọc Hoàng yêu cầu.
// 3. Mini-game 2: Truy Bắt Kẻ Xấu / Ma Đầu (Thần Tướng / Chấp Pháp) - 2 Bước: Soi Chiếu Yêu Kính & Vây Bắt / Xử Án / Trảm Tại Chỗ.
// 4. Mini-game 3: Câu Hồn Người Chết (Hắc Bạch Vô Thường / Dẫn Hồn Sứ) - Hạ phàm câu hồn, điều tra giải oan hoặc trảm tà tu cướp phách.

import { s } from './state';
import { REALMS, type El } from '../data/core';
import { addGear, bagFree, addItem, count, itemName } from './char';
import { addLog } from './core';
import { mkGear, type Gear } from '../data/items';
import { fight, mkFoe, type FoeSpec } from './combat';
import { fmt, ri, pick, ch, clamp } from '../core/util';
import type { CelestialId } from '../data/celestial';
import { celestialContrib, celestialRank, celestialRankInfo } from './celestial-faction';

/** Bảng quy định Pháp Bảo Trấn Chức theo nhánh và bậc tiên chức */
export interface OfficeTreasureSpec {
  name: string;
  slot: number; // 0: Vũ khí, 2: Pháp bảo
  el: El;
  grade: number; // 4: Địa/Thiên giai, 5: Thiên giai cực phẩm, 6: Tiên giai Chí bảo
  desc: string;
}

export const OFFICE_TREASURES: Record<string, OfficeTreasureSpec> = {
  // THIÊN ĐÌNH
  'tuhai_1': { name: 'Lưu Ly Tích Thủy Hoàn', slot: 2, el: 'thuy', grade: 3, desc: 'Bảo vật của Thủy Binh, có thể lướt trên sóng dữ, tăng phòng ngự thủy hệ.' },
  'tuhai_3': { name: 'Tích Vũ Tiên Kỳ', slot: 2, el: 'thuy', grade: 4, desc: 'Linh kỳ chưởng quản mây mưa, vẫy một cái tụ mây vạn dặm.' },
  'tuhai_5': { name: 'Định Hải Thần Trâm', slot: 0, el: 'kim', grade: 6, desc: 'Trấn Hải Chi Bảo do Thái Thượng Lão Quân luyện chế, nặng một vạn ba ngàn năm trăm cân, quét sạch phong ba.' },
  'tuhai_6': { name: 'Thương Long Hoán Vũ Châu', slot: 2, el: 'thuy', grade: 6, desc: 'Bản mệnh Long Châu tối thượng của Long Vương bốn biển, hô mưa gọi gió lay chuyển càn khôn.' },

  'namthienmon_3': { name: 'Chiếu Yêu Kính Bản Mệnh', slot: 2, el: 'quang', grade: 5, desc: 'Pháp bảo soi thấu chân thân vạn yêu và ma khí trong phạm vi vạn dặm.' },
  'namthienmon_5': { name: 'Tam Tiêm Lưỡng Nhẫn Đao', slot: 0, el: 'loi', grade: 6, desc: 'Thần binh vô thượng của Thanh Nguyên Diệu Đạo Chân Quân, chém đứt núi sông, bổ toái hư không.' },
  'langtieu_5': { name: 'Thất Bảo Linh Lung Tháp', slot: 2, el: 'kim', grade: 6, desc: 'Thần bảo của Thác Tháp Lý Thiên Vương, bên trong chứa bảy loại linh bảo, trấn áp tà ma thiên cổ.' },

  'dausuat_4': { name: 'Hỗn Nguyên Kim Cang Trác', slot: 2, el: 'kim', grade: 6, desc: 'Chí bảo của Thái Thượng Đạo Tổ, ném ra hút sạch mọi binh khí pháp bảo của đối thủ.' },
  'dausuat_5': { name: 'Tử Kim Bát Quái Tiên Lô', slot: 2, el: 'hoa', grade: 6, desc: 'Đan lô huyền thoại chứa Lục Đinh Thần Hỏa, luyện ra Cửu Chuyển Kim Đan.' },

  // ĐỊA PHỦ
  'diaphu_vothuong': { name: 'Tỏa Hồn Thiết Xích & Khốc Tang Bổng', slot: 0, el: 'am', grade: 5, desc: 'Song bảo trấn mệnh của Hắc Bạch Vô Thường, xích khóa câu phách, gậy tang tán hồn.' },
  'diaphu_phanquan': { name: 'Phán Quan Bút & Sinh Tử Âm Dương Bộ', slot: 2, el: 'am', grade: 6, desc: 'Bảo vật chấp pháp Địa Phủ, bút phán định luân hồi thiện ác, ghi tên kẻ chết.' },
  'diaphu_diemla': { name: 'Phong Đô Trấn Hồn Tỷ', slot: 2, el: 'am', grade: 6, desc: 'Ngọc tỷ trấn giữ mười tám tầng địa ngục, ấn xuống vạn quỷ quỳ lạy.' },
  'diaphu_manhba': { name: 'Vong Ưu Thần Oản', slot: 2, el: 'thuy', grade: 5, desc: 'Chén ngọc múc canh Mạnh Bà bên cầu Nại Hà, một giọt xóa sạch hồng trần.' },

  // LINH SƠN
  'linhson_phat': { name: 'Cửu Phẩm Kim Liên Đài', slot: 2, el: 'quang', grade: 6, desc: 'Tòa sen chín phẩm tỏa ánh phật quang vô lượng, vạn pháp bất xâm.' },
  'linhson_lohan': { name: 'Hàng Ma Kim Cang Trử', slot: 0, el: 'kim', grade: 5, desc: 'Binh khí hàng ma phục yêu chí tôn của chư vị La Hán Linh Sơn.' },

  // YÊU GIỚI
  'yeugioi_daithanh': { name: 'Như Ý Kim Cô Bổng', slot: 0, el: 'kim', grade: 6, desc: 'Thần binh trấn hải biến hóa khôn lường, tùy tâm ý mà nặng nhẹ dài ngắn.' },
  'yeugioi_hoang': { name: 'Hỗn Độn Yêu Hoàng Chung', slot: 2, el: 'am', grade: 6, desc: 'Thượng cổ thần chung trấn áp hồng hoang vạn tộc, chuông reo trời long đất lở.' },
};

/** Kiểm tra và cấp Pháp Bảo Trấn Chức nếu người chơi chưa nhận */
export function checkAndGrantOfficeTreasure(id: CelestialId, branchId: string): OfficeTreasureSpec | null {
  s.flags.celestialOfficeGears ||= {};
  const rankIdx = celestialRank(id, branchId);
  const rkInfo = celestialRankInfo(id, branchId);

  // Tìm chìa khóa tương ứng
  let key = `${branchId}_${rankIdx}`;
  if (!OFFICE_TREASURES[key]) {
    if (branchId.includes('tuhai') || branchId.includes('longcung')) {
      key = rankIdx >= 4 ? 'tuhai_5' : 'tuhai_3';
    } else if (branchId.includes('namthien') || branchId.includes('chienthan')) {
      key = rankIdx >= 4 ? 'namthienmon_5' : 'namthienmon_3';
    } else if (branchId.includes('langtieu')) {
      key = 'langtieu_5';
    } else if (branchId.includes('dausuat')) {
      key = rankIdx >= 4 ? 'dausuat_5' : 'dausuat_4';
    } else if (id === 'diaphu') {
      if (branchId.includes('phanquan')) key = 'diaphu_phanquan';
      else if (branchId.includes('diemla') || rankIdx >= 4) key = 'diaphu_diemla';
      else key = 'diaphu_vothuong';
    } else if (id === 'linhson') {
      key = rankIdx >= 4 ? 'linhson_phat' : 'linhson_lohan';
    } else if (id === 'yeugioi') {
      key = rankIdx >= 4 ? 'yeugioi_hoang' : 'yeugioi_daithanh';
    }
  }

  const spec = OFFICE_TREASURES[key];
  if (!spec) return null;

  const grantKey = `${id}_${branchId}_${spec.name}`;
  if (s.flags.celestialOfficeGears[grantKey]) {
    return null; // Đã nhận rồi
  }

  // Cấp phát
  if (bagFree() <= 0) {
    addLog(`Túi đồ đã đầy, không thể tiếp nhận Pháp Bảo Trấn Chức 【${spec.name}】! Hãy dọn dẹp túi đồ.`, 'bad');
    return null;
  }

  const gear = mkGear(Math.max(s.r, 5), spec.grade, spec.slot, spec.el, 3);
  gear.n = spec.name;
  addGear(gear);
  s.flags.celestialOfficeGears[grantKey] = true;

  addLog(`✦ Tiếp nhận sắc phong 【${rkInfo.title}】! Thiên Đình / Minh Phủ ban tặng Pháp Bảo Trấn Chức cực phẩm: 【${spec.name}】 (${spec.desc})!`, 'good');
  return spec;
}

// =========================================================================
// MINI-GAME 1: HÀNH VÂN BỐ VŨ (LONG VƯƠNG / THỦY THẦN)
// =========================================================================

export interface RainMissionState {
  targetRegion: string;
  targetWater: number; // Lượng nước chiếu chỉ yêu cầu (28 - 48 tấc)
  currentWater: number;
  cloudDensity: number; // 0: Chưa có, 1: Mây mỏng, 2: Mây đen vần vũ, 3: Cuồng lôi bão tố
  lightningBoost: boolean; // x1.5 lượng mưa lần sau
  step: number;
  maxSteps: number;
  completed: boolean;
  resultMsg?: string;
}

export function initRainMission(): RainMissionState {
  const regions = ['Trung Vực · Giang Châu Phủ', 'Đông Vực · Lạc Hà Cổ Độ', 'Bắc Cực · Tuyết Băng Thôn', 'Nam Man · Bách Thảo Trạch', 'Tây Vực · Hoàng Cát Thành'];
  const targetRegion = pick(regions);
  const targetWater = ri(30, 46); // Ví dụ: 3 thước 2 tấc = 32 tấc nước
  return {
    targetRegion,
    targetWater,
    currentWater: 0,
    cloudDensity: 1,
    lightningBoost: false,
    step: 0,
    maxSteps: 8,
    completed: false,
  };
}

export function actGatherClouds(st: RainMissionState): string {
  st.step++;
  st.cloudDensity = clamp(st.cloudDensity + 1, 1, 3);
  const add = ri(4, 7);
  st.currentWater += add;
  return `Vận chuyển long châu, tụ khí thành mây! Lớp mây đen dày thêm một tầng, độ ẩm ngưng tụ thêm ${add} tấc nước. (Hiện có: ${st.currentWater} tấc).`;
}

export function actTriggerLightning(st: RainMissionState): string {
  st.step++;
  st.lightningBoost = true;
  return `Kích phát thiên lôi! Tia sét xé toạc tầng mây, áp suất không khí nén lại cực độ! Đợt trút mưa kế tiếp sẽ tăng 150% hiệu quả (x1.5)!`;
}

export function actCastRain(st: RainMissionState): string {
  st.step++;
  let baseRain = ri(8, 13);
  if (st.lightningBoost) {
    baseRain = Math.round(baseRain * 1.5);
    st.lightningBoost = false;
  }
  st.currentWater += baseRain;
  return `Hành vân bố vũ! Vẫy cờ Tích Vũ Tiên Kỳ, mưa rào xối xả trút xuống nhân gian thêm ${baseRain} tấc nước! (Hiện có: ${st.currentWater} tấc).`;
}

export function actFinishRain(id: CelestialId, st: RainMissionState): { ok: boolean; msg: string; reward: string } {
  st.completed = true;
  const diff = Math.abs(st.currentWater - st.targetWater);

  if (diff <= 2) {
    // Hoàn thành hoàn hảo
    s.money += 2500;
    (s.flags.celestialContrib ||= {})[id] = (s.flags.celestialContrib?.[id] || 0) + 250;
    const msg = `✦ Thiên ý viên mãn! Chiếu chỉ yêu cầu ${st.targetWater} tấc nước, ngươi làm mưa đạt đúng ${st.currentWater} tấc (sai lệch chỉ ${diff} tấc). Dân chúng vạn dặm tấu biểu tạ ơn Long Vương! Ngọc Hoàng hạ chiếu khen ngợi, ban thưởng hậu hĩnh!`;
    addLog(msg, 'good');
    return { ok: true, msg, reward: '+250 cống hiến, +2,500 linh thạch' };
  } else if (st.currentWater < st.targetWater) {
    // Hạn hán
    (s.flags.celestialContrib ||= {})[id] = Math.max(0, (s.flags.celestialContrib?.[id] || 0) - 30);
    const msg = `Lượng mưa quá ít! Chiếu chỉ yêu cầu ${st.targetWater} tấc, ngươi chỉ làm được ${st.currentWater} tấc (thiếu hụt ${st.targetWater - st.currentWater} tấc). Đất đai khô nẻ, dân chúng ca thán. Thiên Đình khiển trách lười biếng chấp pháp!`;
    addLog(msg, 'bad');
    return { ok: false, msg, reward: '-30 cống hiến' };
  } else {
    // Lũ lụt
    (s.flags.celestialContrib ||= {})[id] = Math.max(0, (s.flags.celestialContrib?.[id] || 0) - 50);
    const msg = `Lũ lụt ngập tràn! Chiếu chỉ chỉ định ${st.targetWater} tấc nước, ngươi trút mưa tới ${st.currentWater} tấc (dư thừa ${st.currentWater - st.targetWater} tấc). Nước lũ vỡ đê tràn ngập nhà cửa, phạm vào thiên điều! Bị Thiên Lôi giáng phạt cảnh cáo!`;
    addLog(msg, 'bad');
    return { ok: false, msg, reward: '-50 cống hiến, cảnh cáo thiên quy' };
  }
}

// =========================================================================
// MINI-GAME 2: TRUY BẮT KẺ XẤU / MA ĐẦU (2 BƯỚC)
// =========================================================================

export interface WantedCriminal {
  name: string;
  crime: string;
  realm: number;
  el: El;
  hideout: string;
  found: boolean;
  captured: boolean;
  executed: boolean;
}

export function genWantedCriminal(): WantedCriminal {
  const titles = ['Huyết Ma Đạo Nhân', 'Hắc Phong Tà Tu', 'U Hồn Độc Quân', 'Cực Lạc Dâm Ma', 'Thiên Tà Lão Quái'];
  const crimes = [
    'Hút máu luyện Hồn Phiên, tàn sát ba thôn trang phàm trần',
    'Trộm đan dược tại Đâu Suất Cung rồi trốn xuống trần làm loạn',
    'Cấu kết tà ma phản nghịch, mưu đồ ám toán tuần thiên sứ',
    'Đoạt linh thạch công quỹ thần giới, trốn vào hẻm núi tu luyện tà thuật',
  ];
  const hideouts = ['Hắc Phong Lĩnh · Tà Huyệt', 'Tuyệt Uyên Cốc · Âm Động', 'Vạn Mộng Đại Trạch · Độc Hạp', 'Cổ Chiến Trường · Bạch Cốt Quật'];

  return {
    name: pick(titles),
    crime: pick(crimes),
    realm: clamp(s.r, 2, 7),
    el: 'am',
    hideout: pick(hideouts),
    found: false,
    captured: false,
    executed: false,
  };
}

/** Bước 1: Tìm người (Tự dò tìm hoặc Nhờ Chiếu Yêu Kính) */
export function trackCriminal(c: WantedCriminal, useMirror: boolean, id: CelestialId): { ok: boolean; msg: string } {
  if (useMirror) {
    c.found = true;
    return {
      ok: true,
      msg: `Ngươi dâng phù lệnh mượn 【Chiếu Yêu Kính】 của Nhị Lang Thần soi thấu cõi trần! Ánh hoàng kim rực rỡ chiếu xuyên mây mù, lập tức định vị chuẩn xác: ${c.name} đang ẩn náu tại 【${c.hideout}】!`,
    };
  }

  // Tự dò tìm theo thần thức
  const success = ch(0.7);
  if (success) {
    c.found = true;
    return {
      ok: true,
      msg: `Ngươi lần theo dấu vết tà khí và oán linh bị sát hại suốt nửa tháng, cuối cùng đã khóa chặt vị trí ẩn náu của ${c.name} tại 【${c.hideout}】!`,
    };
  } else {
    return {
      ok: false,
      msg: `Tà khí đứt đoạn giữa chừng! Tên gian tặc ${c.name} xảo quyệt dùng bí thuật ẩn nấp, ngươi chưa thể tìm ra sào huyệt. Hãy thử lại hoặc nhờ Chiếu Yêu Kính!`,
    };
  }
}

/** Bước 2: Vây bắt & Thẩm án / Trảm quyết tại chỗ */
export interface CaptureResult {
  ok: boolean;
  msg: string;
  canSurrender: boolean;
  fierceResistance: boolean; // Chống cự quyết liệt
  rewardContrib: number;
  rewardStones: number;
}

export function confrontCriminal(c: WantedCriminal): CaptureResult {
  const foe: FoeSpec = {
    name: c.name,
    r: c.realm,
    el: c.el,
    kind: 'cultivator',
  };

  const res = fight(mkFoe(foe));
  if (!res.win) {
    return {
      ok: false,
      msg: `Bị ${c.name} liều chết phản kháng với ma công hung hãn! Ngươi bị thương phải tạm thời rút lui!`,
      canSurrender: false,
      fierceResistance: false,
      rewardContrib: 0,
      rewardStones: 0,
    };
  }

  // Đánh thắng: Kẻ địch đầu hàng hoặc chống cự quyết liệt
  const fierce = ch(0.5);
  if (fierce) {
    return {
      ok: true,
      msg: `Ngươi đánh trọng thương ${c.name}! Nhưng tên ma đầu điên cuồng gào thét, kích phát cấm thuật huyết sát muốn tự bạo cùng chết! Ngươi có thể TRẢM QUYẾT TẠI CHỖ để trừ hậu họa!`,
      canSurrender: false,
      fierceResistance: true,
      rewardContrib: 300,
      rewardStones: 3000,
    };
  } else {
    return {
      ok: true,
      msg: `Trước thiên uy cái thế, ${c.name} vỡ nát đan điền, sợ hãi quỳ rạp cầu xin: "Thượng tiên tha mạng! Tiểu nhân nguyện chịu quy án tra tay vào xích!" Ngươi có thể bắt sống áp giải về quy án hoặc xử tội!`,
      canSurrender: true,
      fierceResistance: false,
      rewardContrib: 250,
      rewardStones: 2000,
    };
  }
}

export function executeAtSite(id: CelestialId, c: WantedCriminal): string {
  c.executed = true;
  s.money += 3000;
  (s.flags.celestialContrib ||= {})[id] = (s.flags.celestialContrib?.[id] || 0) + 300;
  if (bagFree() > 0 && ch(0.7)) {
    const gr = mkGear(c.realm, 4, 0, 'am', 3);
    gr.n = `Chiến Lợi Phẩm · ${c.name} Tà Kiếm`;
    addGear(gr);
  }
  const msg = `Trảm quyết tại chỗ thành công! Đao quang lóe lên, thủ cấp ác tặc ${c.name} rơi xuống đất. Ngươi thu hồi tang vật nộp về thiên môn: nhận +300 cống hiến, +3,000 linh thạch!`;
  addLog(msg, 'good');
  return msg;
}

export function sendToPrison(id: CelestialId, c: WantedCriminal, sentence: 'jail' | 'hell' | 'execute'): string {
  c.captured = true;
  s.money += 2000;
  (s.flags.celestialContrib ||= {})[id] = (s.flags.celestialContrib?.[id] || 0) + 250;
  const sentenceTxt = sentence === 'jail' ? 'Giam vào Thiên Lao sám hối' : sentence === 'hell' ? 'Đày xuống 18 tầng Địa Ngục thụ hình' : 'Đưa lên Đoán Tiên Đài trảm quyết thị chúng';
  const msg = `Áp giải phạm nhân về công đường thần giới! Phán quyết: 【${sentenceTxt}】! Toàn cõi ngợi khen đức độ công minh. Nhận +250 cống hiến, +2,000 linh thạch!`;
  addLog(msg, 'good');
  return msg;
}

// =========================================================================
// MINI-GAME 3: CÂU HỒN NGƯỜI CHẾT (HẮC BẠCH VÔ THƯỜNG / DẪN HỒN SỨ)
// =========================================================================

export interface SoulMissionState {
  targetMortal: string;
  locName: string;
  caseType: 'peaceful' | 'grievance' | 'evil_cult'; // 3 Loại kỳ án
  resolved: boolean;
  step: number;
}

export function genSoulMission(): SoulMissionState {
  const mortals = ['Lý Viên Ngoại (78 tuổi, bệnh mất)', 'Trần Thục Nữ (22 tuổi, chết oan)', 'Vương Thợ Rèn (45 tuổi, thợ rèn danh tiếng)', 'Tô Đốc Học (60 tuổi, quan thanh liêm)'];
  const locs = ['Giang Châu Thành · Lý Phủ', 'Hạc Tiên Trấn · Ngoại Ô', 'Thanh Vân Thôn · Khê Đầu', 'Vô Danh Cổ Miếu'];
  const types: ('peaceful' | 'grievance' | 'evil_cult')[] = ['peaceful', 'grievance', 'evil_cult'];

  return {
    targetMortal: pick(mortals),
    locName: pick(locs),
    caseType: pick(types),
    resolved: false,
    step: 0,
  };
}

export function conductSoulCatch(id: CelestialId, st: SoulMissionState): { msg: string; needInvestigate?: boolean; needFight?: boolean } {
  st.step = 1;
  if (st.caseType === 'peaceful') {
    st.resolved = true;
    s.money += 1500;
    (s.flags.celestialContrib ||= {})[id] = (s.flags.celestialContrib?.[id] || 0) + 150;
    const msg = `Hạ phàm câu hồn tại ${st.locName}: Linh hồn 【${st.targetMortal}】 thanh thản đón nhận thiên mệnh, tra tay vào Tỏa Hồn Xích êm đẹp, theo ngươi bước qua Quỷ Môn Quan chuyển sinh. Nhận +150 cống hiến, +1,500 linh thạch.`;
    addLog(msg, 'good');
    return { msg };
  } else if (st.caseType === 'grievance') {
    return {
      msg: `Hạ phàm câu hồn tại ${st.locName}: Vong hồn 【${st.targetMortal}】 gào khóc ai oán, oán khí bao trùm không chịu bước đi! Linh hồn tố cáo bị gã tài chủ gian ác lén hạ độc chiếm đoạt gia tài, quan huyện nhận hối lộ che đậy. Cần phải ĐIỀU TRA GIẢI OAN mới có thể câu hồn suôn sẻ!`,
      needInvestigate: true,
    };
  } else {
    return {
      msg: `Hạ phàm câu hồn tại ${st.locName}: Ngươi vừa tới hiện trường thì thấy một gã Ma Tu tà đạo đang giăng 【Vạn Hồn Phiên】 toan cưỡng ép hút linh hồn 【${st.targetMortal}】 để luyện tà pháp! Phải xuất thủ ĐÁNH BẠI MA TU để giải cứu vong hồn!`,
      needFight: true,
    };
  }
}

export function investigateGrievance(id: CelestialId, st: SoulMissionState): string {
  st.resolved = true;
  s.money += 3000;
  (s.flags.celestialContrib ||= {})[id] = (s.flags.celestialContrib?.[id] || 0) + 350;
  const msg = `Điều tra kỳ án thành công! Ban đêm ngươi hiển thánh báo mộng quan tuần phủ liêm khiết, vạch trần lọ độc dược và sổ sách gian lận, trừng trị kẻ thủ ác trước bàn dân thiên hạ! Oan khuất tan biến, ${st.targetMortal} quỳ tạ ơn ân đức rồi an lòng theo xích về Âm Ty. Nhận thưởng đại âm đức: +350 cống hiến, +3,000 linh thạch!`;
  addLog(msg, 'good');
  return msg;
}

export function defeatEvilCult(id: CelestialId, st: SoulMissionState): { ok: boolean; msg: string } {
  const foe: FoeSpec = {
    name: 'Tà Tu Cướp Phách',
    r: clamp(s.r, 2, 6),
    el: 'am',
    kind: 'demon',
  };

  const res = fight(mkFoe(foe));
  if (res.win) {
    st.resolved = true;
    s.money += 3500;
    (s.flags.celestialContrib ||= {})[id] = (s.flags.celestialContrib?.[id] || 0) + 400;
    const msg = `Đại chiến thắng lợi! Ngươi vung Khốc Tang Bổng đánh nát Vạn Hồn Phiên, trảm sát gã tà tu ngay tại trận, giải cứu linh hồn ${st.targetMortal} dẫn giải về Quỷ Môn Quan! Thưởng công: +400 cống hiến, +3,500 linh thạch!`;
    addLog(msg, 'good');
    return { ok: true, msg };
  } else {
    return { ok: false, msg: 'Tà tu ma công thâm hậu, ngươi bị hắc vụ phản chấn thương tích, cần hồi phục rồi tái chiến!' };
  }
}
