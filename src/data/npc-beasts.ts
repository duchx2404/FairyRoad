import { beastDoctrine } from './beast-sects';
import type { El } from './core';
import { BEAST_LINEAGE, getBeastWorldReq } from './beast-lineage';
import { hashStr, seeded } from '../core/util';

/** Cá thể có tên riêng; species là tên loài trong cây phả hệ, không phải tên cá thể. */
export interface NpcBeast {
  id: string;
  name: string;
  species: string;
  owner: string;
  ownerAliases: string[];
  el: El;
  /** Tên cá thể do game đặt khi nguyên tác chỉ gọi bằng tên loài. */
  gameName?: boolean;
}

export const NPC_BEASTS: NpcBeast[] = [
  { id: 'hao-thien-khuyen', name: 'Hạo Thiên Khuyển', species: 'Thần Khuyển', owner: 'Dương Tiễn', ownerAliases: ['Nhị Lang Thần', 'Nhị Lang Hiển Thánh Chân Quân'], el: 'kim' },
  { id: 'hoa-ho-dieu', name: 'Tử Kim Hoa Hồ Điêu', species: 'Hoa Hồ Điêu', owner: 'Ma Lễ Thọ', ownerAliases: [], el: 'phong' },
  { id: 'lao-tu-nguu', name: 'Thanh Giác', species: 'Độc Giác Thanh Ngưu', owner: 'Lão Tử', ownerAliases: ['Thái Thượng Lão Quân', 'Lý Nhĩ'], el: 'kim', gameName: true },
  { id: 'hang-nga-tho', name: 'Ngọc Nhi', species: 'Thái Âm Ngọc Thố', owner: 'Hằng Nga', ownerAliases: ['Thái Âm Tinh Quân'], el: 'quang', gameName: true },
  { id: 'trieu-cong-minh-ho', name: 'Huyền Nha', species: 'Hắc Hổ', owner: 'Triệu Công Minh', ownerAliases: [], el: 'am', gameName: true },
  { id: 'van-trong-lan', name: 'Mặc Lôi', species: 'Mặc Kỳ Lân', owner: 'Văn Trọng', ownerAliases: ['Văn Thái Sư'], el: 'tho', gameName: true },
  { id: 'khuong-tu-nha-tu-bat-tuong', name: 'Tứ Bất Tướng', species: 'Tứ Bất Tượng', owner: 'Khương Tử Nha', ownerAliases: ['Khương Thượng'], el: 'tho' },
  { id: 'hoang-phi-ho-nguu', name: 'Ngũ Sắc', species: 'Ngũ Sắc Thần Ngưu', owner: 'Hoàng Phi Hổ', ownerAliases: [], el: 'tho', gameName: true },
  { id: 'hoang-thien-hoa-lan', name: 'Ngọc Giác', species: 'Ngọc Kỳ Lân', owner: 'Hoàng Thiên Hóa', ownerAliases: [], el: 'quang', gameName: true },
  { id: 'van-thu-su', name: 'Thanh Hống', species: 'Thanh Mao Sư', owner: 'Văn Thù', ownerAliases: ['Văn Thù Bồ Tát', 'Văn Thù Quảng Pháp Thiên Tôn'], el: 'phong', gameName: true },
  { id: 'pho-hien-tuong', name: 'Bạch Nha', species: 'Lục Nha Bạch Tượng', owner: 'Phổ Hiền', ownerAliases: ['Phổ Hiền Bồ Tát', 'Phổ Hiền Chân Nhân'], el: 'tho', gameName: true },
  { id: 'quan-am-hau', name: 'Kim Hống', species: 'Kim Mao Hống', owner: 'Quan Âm', ownerAliases: ['Quan Thế Âm', 'Quan Thế Âm Bồ Tát', 'Từ Hàng Đạo Nhân'], el: 'kim', gameName: true },
  { id: 'dia-tang-de-thinh', name: 'Đế Thính', species: 'Đế Thính Thú', owner: 'Địa Tạng', ownerAliases: ['Địa Tạng Vương', 'Địa Tạng Vương Bồ Tát'], el: 'am' },
];

export const beastsOfNpc = (name: string) => NPC_BEASTS.filter(b => b.owner === name || b.ownerAliases.includes(name));

export interface BeastOwner {
  id?: string;
  name: string;
  r: number;
  world?: number;
  sect?: string | null;
  beast?: string;
  chief?: boolean;
  beasts?: NpcBeast[];
}

/** Ổn định theo căn cước: không bốc lại thú khi tải save, đổi tên hoặc vào trận. */
export function ensureNpcBeasts(owner: BeastOwner, world = owner.world ?? 0): NpcBeast[] {
  const doctrine = beastDoctrine(owner.sect);
  if (owner.beasts !== undefined && (!doctrine || owner.beasts.length >= doctrine.count)) return owner.beasts;
  const fixed = beastsOfNpc(owner.name);
  if (fixed.length) return owner.beasts = fixed.map(b => ({ ...b, ownerAliases: [...b.ownerAliases] }));
  if (owner.r < 1) return []; // Phàm nhân không tự nhiên có linh thú chiến đấu.
  const rnd = seeded(hashStr(`npc-beasts:${owner.id ?? owner.name}`));

  // Không tự gán sủng vật tùy ý cho thủ lĩnh thần thoại hoặc yêu thú hóa hình.
  if (!doctrine && (owner.chief || owner.beast || rnd() >= 0.24)) return owner.beasts = [];
  const r = Math.max(1, owner.r - (doctrine ? 0 : 1));
  const pool = BEAST_LINEAGE.filter(b => {
    const req = getBeastWorldReq(b.n);
    return !!b.parent && req.minWorld <= world && req.minRealm <= r && (!doctrine?.family || doctrine.family.test(b.n));
  });
  if (!pool.length) return owner.beasts = [];
  // Ưu tiên huyết mạch phù hợp trình độ của chủ thay vì toàn loài sơ cấp.
  const strongest = Math.max(...pool.map(b => getBeastWorldReq(b.n).minRealm));
  const candidates = pool.filter(b => getBeastWorldReq(b.n).minRealm >= Math.max(0, strongest - 3));
  const first = ['A', 'Tiểu', 'Thanh', 'Huyền', 'Ngọc', 'Xích', 'Tử', 'Bạch'];
  const last = ['Vân', 'Ảnh', 'Phong', 'Linh', 'Nguyệt', 'Tinh', 'Hỏa', 'Sương'];
  const pets = owner.beasts ?? [];
  while (pets.length < (doctrine?.count ?? 1)) {
    const i = pets.length;
    const species = candidates[Math.floor(rnd() * candidates.length)];
    let name = `${first[Math.floor(rnd() * first.length)]} ${last[Math.floor(rnd() * last.length)]}`;
    if (pets.some(p => p.name === name)) name += ` ${i + 1}`;
    pets.push({
      id: `beast:${owner.id ?? owner.name}${i ? ':' + i : ''}`, name,
      species: species.n, el: species.el, owner: owner.name, ownerAliases: [], gameName: true,
    });
  }
  return owner.beasts = pets;
}
