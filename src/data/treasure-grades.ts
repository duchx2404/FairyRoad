import { WORLD, WORLD_CAP } from './core';

/** Quy ước của game theo dòng tiểu thuyết Hồng Hoang hiện đại, không phải một thang cổ điển thống nhất. */
export const TREASURE_TIERS = [
  'Phàm phẩm', 'Hoàng giai', 'Huyền giai', 'Địa giai', 'Thiên giai', 'Thần giai', 'Tiên giai',
  'Hậu Thiên Linh Bảo', 'Tiên Thiên Linh Bảo', 'Hậu Thiên Chí Bảo', 'Tiên Thiên Chí Bảo',
  'Hỗn Độn Linh Bảo', 'Hỗn Độn Chí Bảo',
] as const;
/** Thứ tự tăng dần theo thiết lập người chơi: Hậu Thiên Chí Bảo cao hơn Tiên Thiên Linh Bảo. */
export const TREASURE_GRADE = { acquiredSpirit: 7, innateSpirit: 8, acquiredSupreme: 9, innateSupreme: 10, chaosSpirit: 11, chaosSupreme: 12 } as const;
/** Trần phẩm chất đang phát huy được tại mỗi giới. */
export const WORLD_TREASURE_CAP = [4, 5, 6, 9, 10, 12] as const;
export const worldTreasureCap = (w = WORLD.lv) => WORLD_TREASURE_CAP[Math.max(0, Math.min(5, w))];
/** Công pháp, đan, phù dùng hệ giai riêng; không gọi đan dược là Tiên Thiên Linh Bảo. */
export const ART_TIERS = [...TREASURE_TIERS.slice(0, 7), 'Thánh phẩm', 'Hỗn Nguyên phẩm', 'Hỗn Độn phẩm'];
export const WORLD_ART_CAP = [4, 5, 6, 7, 8, 9] as const;
export const worldArtCap = (w = WORLD.lv): number => WORLD_ART_CAP[Math.max(0, Math.min(5, w))];
export const localTreasureGrade = (g: number, w = WORLD.lv) => Math.max(0, Math.min(g, worldTreasureCap(w)));

let _growState: () => { r: number; st: number; w: number } = () => ({ r: 0, st: 0, w: WORLD.lv });
export function setGrowStateReader(fn: () => { r: number; st: number; w: number }) { _growState = fn; }

/** Chia đều các bậc phẩm chất (hạ, trung, thượng, cực phẩm) theo số lượng cảnh giới của giới hiện tại. */
function divideGrade(minT: number, maxT: number, ww: number, rr: number, ss: number): { t: number; q: number } {
  const rMax = WORLD_CAP[Math.max(0, Math.min(WORLD_CAP.length - 1, ww))] || 9;
  const tiers = Math.max(1, maxT - minT + 1);
  const steps = tiers * 4;
  if (rr <= 0) return { t: minT, q: 0 };
  if (tiers === 1) {
    const q = Math.max(0, Math.min(3, Math.floor(((rr - 1) * 4) / rMax)));
    return { t: minT, q };
  }
  const cur = Math.max(0, Math.min(rMax * 4 - 1, (rr - 1) * 4 + ss));
  const step = Math.max(0, Math.min(steps - 1, Math.floor((cur * steps) / (rMax * 4))));
  return { t: minT + Math.floor(step / 4), q: step % 4 };
}

/** Phẩm cấp công pháp/thuật pháp trưởng thành theo người dùng: bắt đầu từ Hoàng giai hạ phẩm (1, 0), tăng theo cảnh giới, 4 bậc hạ/trung/thượng/cực phẩm chia đều theo số lượng cảnh giới. */
export function growArtGrade(w?: number, r?: number, st?: number): { tier: number; pq: number } {
  const cur = _growState();
  const ww = Math.max(0, Math.min(5, w ?? cur.w)), rr = r ?? cur.r, ss = Math.max(0, Math.min(3, st ?? cur.st));
  const maxT = worldArtCap(ww);
  const minT = ww > 0 ? worldArtCap(ww - 1) + 1 : 1;
  const { t, q } = divideGrade(minT, maxT, ww, rr, ss);
  return { tier: t, pq: q };
}

/** Phẩm cấp pháp bảo trưởng thành theo người dùng: bắt đầu từ Hoàng giai hạ phẩm (1, 0), bản tàn khuyết tối đa Hỗn Độn Linh Bảo cực phẩm (11, 3); sau khi dùng Hỗn Độn Thạch lên Hỗn Độn Chí Bảo hạ phẩm (12, 0) và rèn bằng nguyên liệu Hỗn Độn lên cực phẩm (12, 3). */
export function growTreasureGrade(broken: boolean, w?: number, r?: number, st?: number, curQ?: number): { g: number; q: number } {
  if (!broken) return { g: 12, q: Math.max(0, Math.min(3, curQ ?? 0)) };
  const cur = _growState();
  const ww = Math.max(0, Math.min(5, w ?? cur.w)), rr = r ?? cur.r, ss = Math.max(0, Math.min(3, st ?? cur.st));
  const maxT = Math.min(worldTreasureCap(ww), 11);
  const minT = ww > 0 ? Math.min(worldTreasureCap(ww - 1), 11) + 1 : 1;
  const { t, q } = divideGrade(minT, maxT, ww, rr, ss);
  return { g: t, q };
}

export interface LegendaryTreasure {
  id: string;
  name: string;
  owner: string;
  role: string;
  school: 'chan' | 'jie' | 'laozi' | 'buddhist';
  grade: number;
  merit?: boolean;
  functions: readonly string[];
}
/** Chủ sở hữu theo thiết lập Phong Thần/Hồng Hoang; phẩm cấp là quy ước hiện đại của game. */
export const LEGENDARY_TREASURES: readonly LegendaryTreasure[] = [
  { id: 'dashen', name: 'Đả Thần Tiên', owner: 'Khương Tử Nha', role: 'Chấp chưởng Phong Thần', school: 'chan', grade: TREASURE_GRADE.innateSpirit, functions: ['Đả thần', 'Trấn áp thần vị', 'Ứng Phong Thần Bảng'] },
  { id: 'taiji', name: 'Thái Cực Đồ', owner: 'Lão Tử', role: 'Giáo chủ Đạo Giáo', school: 'laozi', grade: TREASURE_GRADE.innateSupreme, functions: ['Hộ thân', 'Định địa thủy hỏa phong', 'Trấn áp khí vận'] },
  { id: 'pagoda', name: 'Thiên Địa Huyền Hoàng Linh Lung Tháp', owner: 'Lão Tử', role: 'Giáo chủ Đạo Giáo', school: 'laozi', grade: TREASURE_GRADE.acquiredSupreme, merit: true, functions: ['Hộ thân', 'Vạn pháp bất xâm', 'Trấn áp khí vận'] },
  { id: 'pangu-banner', name: 'Bàn Cổ Phiên', owner: 'Nguyên Thủy Thiên Tôn', role: 'Giáo chủ Xiển Giáo', school: 'chan', grade: TREASURE_GRADE.innateSupreme, functions: ['Phá phòng ngự', 'Khai phá hỗn độn', 'Trấn áp khí vận'] },
  { id: 'zhuxian', name: 'Tru Tiên Tứ Kiếm và Trận Đồ', owner: 'Thông Thiên Giáo Chủ', role: 'Giáo chủ Tiệt Giáo', school: 'jie', grade: TREASURE_GRADE.innateSupreme, functions: ['Kiếm khí sát phạt', 'Bày Tru Tiên Trận', 'Phong tỏa trận vực'] },
  { id: 'jindou', name: 'Hỗn Nguyên Kim Đấu', owner: 'Vân Tiêu', role: 'Chủ trì Cửu Khúc Hoàng Hà Trận', school: 'jie', grade: TREASURE_GRADE.innateSpirit, functions: ['Thu nhiếp', 'Gọt tam hoa', 'Bế ngũ khí'] },
  { id: 'fantian', name: 'Phiên Thiên Ấn', owner: 'Quảng Thành Tử', role: 'Thủ đồ Xiển Giáo', school: 'chan', grade: TREASURE_GRADE.acquiredSupreme, functions: ['Trấn áp', 'Phá pháp thân'] },
  { id: 'seven-tree', name: 'Thất Bảo Diệu Thụ', owner: 'Chuẩn Đề', role: 'Nhị giáo chủ Tây Phương', school: 'buddhist', grade: TREASURE_GRADE.innateSpirit, functions: ['Quét pháp bảo', 'Hàng phục', 'Hộ đạo'] },
  { id: 'lotus', name: 'Thập Nhị Phẩm Công Đức Kim Liên', owner: 'Tiếp Dẫn', role: 'Đại giáo chủ Tây Phương', school: 'buddhist', grade: TREASURE_GRADE.innateSpirit, merit: true, functions: ['Hộ thân', 'Tịnh hóa', 'Trấn áp khí vận'] },
];

export function treasureManifest(t: LegendaryTreasure, w: number) {
  const replica = w < 4;
  return {
    name: t.name + (replica ? ' (mô phỏng)' : ''),
    grade: replica ? Math.min(4, worldTreasureCap(w), t.grade - 1) : t.grade,
    replica,
    functions: replica ? t.functions.slice(0, 1) : [...t.functions],
    powerScale: replica ? 0.05 * (w + 1) : 1,
  };
}
