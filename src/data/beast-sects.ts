/** Các thế lực lấy khế ước linh thú làm đạo thống và lực chiến chủ đạo. */
export interface BeastDoctrine {
  world: number;
  name: string;
  count: number;
  family?: RegExp;
}

export const BEAST_SECTS: BeastDoctrine[] = [
  { world: 0, name: 'Ngự Thú Sơn Trang', count: 2 },
  { world: 1, name: 'Tuyết Lang Bảo', count: 3, family: /Lang/ },
  { world: 2, name: 'Vân Hạc Tông', count: 2, family: /Hạc|Điểu|Ưng|Điêu/ },
  { world: 3, name: 'Vạn Thú Thần Tông', count: 3 },
  { world: 4, name: 'Ngự Linh Đạo Cung', count: 3 },
  { world: 5, name: 'Hỗn Nguyên Ngự Thú Đạo', count: 3 },
];

const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '');
export function beastDoctrine(sect?: string | null): BeastDoctrine | undefined {
  if (!sect) return;
  return BEAST_SECTS.find(d => sect === d.name || sect === (d.world === 0 ? 'ngulinh' : `w${d.world}_${slug(d.name)}`));
}

export const BEAST_DOCTRINE_TEXT = 'Ngự thú làm lực chiến chính: đệ tử ký khế ước với 2–3 linh thú đồng cảnh giới; bản thân thiên về điều khiển, đàn thú trực tiếp công phạt.';
