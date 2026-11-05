import { s } from './state';
import { CHANLINH, type ChanLinh } from '../data/spirit';
import { REALMS, STAGES, RMAX, EL } from '../data/core';
import { HERBS, MATS } from '../data/items';
import { addLog } from './core';
import { clamp } from '../core/util';
import { count, removeItem, itemName } from './char';
import { canResizeBeast } from '../data/spirit';

export type BeastStage = 'aunen' | 'truongthanh' | 'gia';

export interface ChanLinhState {
  id: string;
  name: string;
  bond: number;
  ride?: boolean;
  bodySize?: 'small' | 'normal' | 'large';
  r: number;        // Cảnh giới yêu thú (1: Nhất giai/Luyện Khí, 2: Nhị giai/Trúc Cơ...)
  st: number;       // Tiểu cảnh giới (0: Sơ kỳ, 1: Trung kỳ, 2: Hậu kỳ, 3: Viên mãn)
  p: number;        // Tiến độ tu vi (0..100%)
  stage: BeastStage;// Giai đoạn: ấu niên -> trưởng thành -> già (lão niên)
  age: number;      // Tuổi (năm)
  maxLife: number;  // Thọ nguyên tối đa (năm, dài gấp 4 lần nhân tộc)
  cultCount?: number;
}

export const STAGE_NAMES: Record<BeastStage, string> = {
  aunen: 'Ấu niên',
  truongthanh: 'Trưởng thành',
  gia: 'Lão niên (Già)',
};

export function setLinhSize(size: 'small' | 'normal' | 'large'): string {
  const cl = getLinh();
  if (!cl) return 'Chưa có linh thú đồng hành.';
  if (size !== 'normal' && !canResizeBeast(cl.r)) return 'Cần đạt Kim Đan để phóng to, thu nhỏ bản thể.';
  cl.bodySize = size;
  return `${cl.name} ${size === 'large' ? 'phóng to bản thể để chở chủ' : size === 'small' ? 'thu nhỏ bản thể' : 'trở về kích thước tự nhiên'}.`;
}

/** Lấy chân linh đồng hành và tự động chuẩn hóa cấu trúc dữ liệu nếu là bản lưu cũ */
export function getLinh(): ChanLinhState | null {
  const cl = s.flags.chanlinh as any;
  if (!cl) return null;
  const def = CHANLINH[cl.id];
  if (!def) return null;

  if (cl.r === undefined) {
    cl.r = Math.max(1, def.minR ?? 1);
    cl.st = 0;
    cl.p = 0;
    cl.stage = 'truongthanh';
    cl.maxLife = Math.round(REALMS[cl.r].life * 4);
    cl.age = Math.round(cl.maxLife * 0.25);
  }
  return cl as ChanLinhState;
}

/** Tạo linh thú mới gia nhập làm bạn đồng hành (mặc định là ấu niên) */
export function mkChanLinh(id: string, customName?: string, isBaby = true): ChanLinhState {
  const def = CHANLINH[id];
  const name = customName || def?.n || id;
  const minR = def?.minR ?? 2;
  const r = isBaby ? Math.max(1, minR - 1) : Math.max(1, minR);
  const maxLife = Math.round((REALMS[r]?.life ?? 100) * 4);
  const age = isBaby ? Math.round(4 + Math.random() * 6) : Math.round(maxLife * 0.2);
  const stage: BeastStage = isBaby ? 'aunen' : 'truongthanh';

  const beast: ChanLinhState = {
    id,
    name,
    bond: 40,
    r,
    st: 0,
    p: 0,
    stage,
    age,
    maxLife,
    cultCount: 0,
  };
  s.flags.chanlinh = beast;
  return beast;
}

/** Tốc độ tu vi theo giai đoạn phát triển */
export function beastCultSpeed(stage: BeastStage): number {
  switch (stage) {
    case 'aunen': return 1.25;      // Ấu niên: hấp thu linh khí mạnh, tiềm năng lớn
    case 'truongthanh': return 1.0; // Trưởng thành: ổn định
    case 'gia': return 0.35;        // Già yếu: kinh mạch lão hóa, tu luyện rất chậm
  }
}

/**
 * Cập nhật thời gian cho Chân linh:
 * - Tuổi tăng theo năm
 * - Tự tích lũy tu vi (chậm hơn nhân tộc nhưng thọ nguyên dài gấp 4 lần)
 * - Tự động phát triển từ Ấu niên -> Trưởng thành
 * - Gần cạn thọ nguyên (>80%) mà không đột phá thì chuyển thành Già
 * - Khi đột phá đại cảnh giới: thọ nguyên tăng, nếu đang Già thì phản lão hoàn đồng trở lại Trưởng thành!
 */
export function tickLinh(y: number) {
  const cl = getLinh();
  if (!cl) return;

  cl.bond = Math.min(100, cl.bond + y * 2.5);
  cl.age += y;

  // Tính lượng tu vi nhận được
  const spd = beastCultSpeed(cl.stage);
  const turn = Math.max(1, REALMS[cl.r].turn);
  const gain = y * spd * (20 / turn);
  cl.p += gain;

  // Đột phá tiểu cảnh giới và đại cảnh giới
  while (cl.p >= 100) {
    cl.p -= 100;
    cl.st++;
    if (cl.st >= 4) {
      cl.st = 0;
      if (cl.r < RMAX()) {
        cl.r++;
        cl.maxLife = Math.round(REALMS[cl.r].life * 4);
        if (cl.stage === 'gia') {
          cl.stage = 'truongthanh';
          addLog(`Chân linh ${cl.name} đột phá lên ${REALMS[cl.r].n}, thọ nguyên tăng mạnh (${cl.maxLife} năm), phản lão hoàn đồng trở lại trạng thái Trưởng Thành!`, 'good');
        } else if (cl.stage === 'aunen') {
          cl.stage = 'truongthanh';
          addLog(`Chân linh ${cl.name} đột phá ${REALMS[cl.r].n}, lột xác trưởng thành uy dũng phi thường!`, 'good');
        } else {
          addLog(`Chân linh ${cl.name} thành công đột phá lên ${REALMS[cl.r].n}!`, 'good');
        }
      } else {
        cl.st = 3;
        cl.p = 100;
        break;
      }
    } else {
      addLog(`Chân linh ${cl.name} tu vi tinh tiến: ${REALMS[cl.r].n} ${STAGES[cl.st]}.`, 'good');
    }
  }

  // Chuyển giai đoạn theo tuổi thọ
  if (cl.stage === 'aunen' && (cl.age >= 30 || cl.r >= 2 || (cl.cultCount ?? 0) >= 8)) {
    cl.stage = 'truongthanh';
    addLog(`Chân linh ${cl.name} đã chính thức bước vào giai đoạn Trưởng Thành! Hình thể to lớn, chiến lực bộc phát.`, 'good');
  } else if (cl.stage === 'truongthanh' && cl.age >= cl.maxLife * 0.8) {
    cl.stage = 'gia';
    addLog(`Chân linh ${cl.name} thọ nguyên đã hao tổn hơn tám phần (${Math.round(cl.age)}/${cl.maxLife} năm), bước vào giai đoạn Già Yếu (Lão niên). Tốc độ tu vi giảm sút, hãy giúp nó đột phá để kéo dài thọ mệnh!`, 'bad');
  }

  // Cạn kiệt thọ nguyên
  if (cl.age >= cl.maxLife) {
    addLog(`Chân linh ${cl.name} đã sống đến tận cùng thọ nguyên (${cl.maxLife} năm), thanh thản tạ thế giữa đất trời...`, 'bad');
    delete s.flags.chanlinh;
  }
}

/**
 * Cho chân linh ăn Thiên tài địa bảo để thúc đẩy trưởng thành và tăng tu vi
 */
export function feedLinh(itemId: string): { ok: boolean; msg: string; progGain: number } {
  const cl = getLinh();
  if (!cl) return { ok: false, msg: 'Chưa có linh thú đồng hành.', progGain: 0 };
  if (count(itemId) <= 0) return { ok: false, msg: 'Không có vật phẩm này trong túi.', progGain: 0 };

  const [k, key] = itemId.split(':');
  let progGain = 0;
  let bondGain = 2;
  let canEvolve = false;

  if (k === 'h') {
    const herb = HERBS[key];
    if (!herb) return { ok: false, msg: 'Vật phẩm không hợp lệ.', progGain: 0 };
    progGain = Math.round(10 * Math.pow(1.8, herb.tier - 1));
    bondGain = Math.min(6, 2 + herb.tier);
    if (herb.tier >= 4) canEvolve = true;
  } else if (k === 'm') {
    if (key === 'thityeu') {
      progGain = 6;
      bondGain = 3;
    } else if (key === 'yeudan') {
      progGain = 22;
      bondGain = 4;
      canEvolve = true;
    } else if (key === 'tuduehuyet') {
      progGain = 45;
      bondGain = 6;
      canEvolve = true;
    } else if (key === 'cotuhuyet') {
      progGain = 80;
      bondGain = 10;
      canEvolve = true;
    } else {
      return { ok: false, msg: 'Linh thú chỉ ăn linh thảo, linh quả, thịt và tinh huyết yêu thú.', progGain: 0 };
    }
  } else {
    return { ok: false, msg: 'Vật phẩm này không thể dùng nuôi dưỡng linh thú.', progGain: 0 };
  }

  // Giai đoạn ấu niên hấp thu thiên tài địa bảo tốt hơn (+35%)
  if (cl.stage === 'aunen') {
    progGain = Math.round(progGain * 1.35);
  }

  removeItem(itemId, 1);
  cl.bond = Math.min(100, cl.bond + bondGain);
  cl.cultCount = (cl.cultCount || 0) + 1;
  cl.p += progGain;

  const iname = itemName(itemId);
  let extraMsg = '';

  // Kiểm tra thúc đẩy tiến hóa từ Ấu niên sang Trưởng thành
  if (cl.stage === 'aunen' && (canEvolve || (cl.cultCount >= 6) || cl.r >= 2)) {
    cl.stage = 'truongthanh';
    extraMsg = ` Dược lực của ${iname} kích phát huyết mạch ngủ say, ${cl.name} lột xác thành hình thái Trưởng Thành!`;
    addLog(`Chân linh ${cl.name} đã trưởng thành nhờ được nuôi dưỡng thiên tài địa bảo!`, 'good');
  }

  // Kiểm tra đột phá khi tu vi đầy
  while (cl.p >= 100) {
    cl.p -= 100;
    cl.st++;
    if (cl.st >= 4) {
      cl.st = 0;
      if (cl.r < RMAX()) {
        cl.r++;
        cl.maxLife = Math.round(REALMS[cl.r].life * 4);
        if (cl.stage === 'gia') cl.stage = 'truongthanh';
        extraMsg += ` ${cl.name} hấp thu tinh hoa, đột phá lên ${REALMS[cl.r].n}!`;
        addLog(`Chân linh ${cl.name} đột phá lên ${REALMS[cl.r].n} nhờ thiên tài địa bảo!`, 'good');
      } else {
        cl.st = 3;
        cl.p = 100;
        break;
      }
    } else {
      extraMsg += ` ${cl.name} tinh tiến lên ${REALMS[cl.r].n} ${STAGES[cl.st]}!`;
    }
  }

  const msg = `Đã cho ${cl.name} ăn 1x ${iname}. Tu vi tăng +${progGain}%, độ gắn bó +${bondGain}.${extraMsg}`;
  addLog(msg, 'good');
  return { ok: true, msg, progGain };
}
