import { s } from './state';
import { REALMS, STAGES, RMAX } from '../data/core';

export type StoneGrade = 'ha' | 'trung' | 'thuong' | 'cuc';

export const STONE_NAMES: Record<StoneGrade, string> = {
  ha: 'Hạ phẩm linh thạch',
  trung: 'Trung phẩm linh thạch',
  thuong: 'Thượng phẩm linh thạch',
  cuc: 'Cực phẩm linh thạch',
};

export const STONE_SHORT: Record<StoneGrade, string> = {
  ha: 'Hạ phẩm',
  trung: 'Trung phẩm',
  thuong: 'Thượng phẩm',
  cuc: 'Cực phẩm',
};

// 1 Cực phẩm = 10 Thượng phẩm = 100 Trung phẩm = 1000 Hạ phẩm
export const STONE_VALUE: Record<StoneGrade, number> = {
  ha: 1,
  trung: 10,
  thuong: 100,
  cuc: 1000,
};

/**
 * Cảnh giới phù hợp với loại linh thạch tu luyện:
 * - Phàm nhân (0), Luyện Khí (1), Trúc Cơ (2): Hạ phẩm linh thạch
 * - Kết Đan (3), Nguyên Anh (4): Trung phẩm linh thạch
 * - Hóa Thần (5), Luyện Hư (6): Thượng phẩm linh thạch
 * - Hợp Thể (7), Đại Thừa / Độ Kiếp (8 trở lên): Cực phẩm linh thạch
 */
export function stoneForRealm(r = s.r): StoneGrade {
  if (r <= 2) return 'ha';
  if (r <= 4) return 'trung';
  if (r <= 6) return 'thuong';
  return 'cuc';
}

/**
 * Tỷ lệ quy đổi linh thạch giữa các thế giới:
 * Hạ phẩm linh thạch ở thế giới bậc cao = 10 Cực phẩm linh thạch ở thế giới kém hơn 1 bậc.
 * Kém k bậc: 1 Hạ phẩm (w + k) = 10^k Cực phẩm (w) = 10^(k+3) Hạ phẩm (w)
 */
export function worldStoneRate(targetWorld: number, baseWorld: number): number {
  const diff = targetWorld - baseWorld;
  if (diff === 0) return 1;
  if (diff > 0) {
    // Thế giới target cao hơn base k bậc
    return Math.pow(10, diff * 4); // 1 Hạ phẩm ở w+1 = 10 Cực phẩm = 10,000 Hạ phẩm
  }
  // Thế giới target thấp hơn base
  return Math.pow(10, diff * 4);
}

/**
 * Phân tích tổng tiền (Hạ phẩm) thành 4 phẩm: Cực, Thượng, Trung, Hạ
 */
export function breakdownStones(totalHa: number = s.money): Record<StoneGrade, number> {
  const t = Math.max(0, Math.floor(totalHa));
  const cuc = Math.floor(t / 1000);
  let rem = t % 1000;
  const thuong = Math.floor(rem / 100);
  rem %= 100;
  const trung = Math.floor(rem / 10);
  const ha = rem % 10;
  return { cuc, thuong, trung, ha };
}

/**
 * Chuỗi hiển thị chi tiết các loại linh thạch
 */
export function formatStonesDetail(totalHa: number = s.money): string {
  const { cuc, thuong, trung, ha } = breakdownStones(totalHa);
  const parts: string[] = [];
  if (cuc > 0) parts.push(`${cuc.toLocaleString('vi-VN')} Cực phẩm`);
  if (thuong > 0) parts.push(`${thuong} Thượng phẩm`);
  if (trung > 0) parts.push(`${trung} Trung phẩm`);
  if (ha > 0 || !parts.length) parts.push(`${ha} Hạ phẩm`);
  return parts.join(' · ');
}

/**
 * Chuỗi hiển thị ngắn gọn linh thạch
 */
export function formatStonesShort(totalHa: number = s.money): string {
  const { cuc, thuong, trung, ha } = breakdownStones(totalHa);
  const parts: string[] = [];
  if (cuc > 0) parts.push(`${cuc} Cực`);
  if (thuong > 0) parts.push(`${thuong} Thượng`);
  if (trung > 0) parts.push(`${trung} Trung`);
  if (ha > 0 || !parts.length) parts.push(`${ha} Hạ`);
  return `${totalHa.toLocaleString('vi-VN')} linh thạch (${parts.join(', ')})`;
}

/**
 * Hàm hỗ trợ tính toán số linh thạch cần thiết để bế quan tới bình cảnh của cảnh giới hiện tại.
 */
export function stonesToBottleneck(): {
  stoneGrade: StoneGrade;
  stoneName: string;
  neededStones: number;
  availableStones: number;
  usableStones: number;
  costInHa: number;
  progToGain: number;
} {
  const g = stoneForRealm(s.r);
  const val = STONE_VALUE[g]; // 1, 10, 100, 1000

  // Tính số tu vi còn thiếu tới bình cảnh
  let progNeeded = 0;
  if (s.body === 'thiendo' && s.r === 1) {
    progNeeded = Math.max(0, 100 - s.prog);
  } else {
    const remainingStages = Math.max(0, 3 - s.st);
    progNeeded = Math.max(0, remainingStages * 100 + (100 - s.prog));
  }

  // Mỗi viên linh thạch đúng cấp cung cấp 1% tu vi
  const neededStones = Math.ceil(progNeeded);
  const availableStones = Math.floor(s.money / val);
  const usableStones = Math.min(neededStones, availableStones);
  const costInHa = usableStones * val;
  const progToGain = usableStones;

  return {
    stoneGrade: g,
    stoneName: STONE_NAMES[g],
    neededStones,
    availableStones,
    usableStones,
    costInHa,
    progToGain,
  };
}
