import { SURN, MALE, FEM, splitName, type Origin } from '../data/core';
import { identifyYaoSpecies } from './yao-territory';
import { pick } from '../core/util';

/** Lấy họ chính xác theo chủng tộc và xuất thân:
 *  - Hậu duệ truyền thuyết Hồng Hoang có họ tên chính xác (Hiên Viên, Hình Thiên, Cửu Lê, Vu tộc, Ma tộc).
 *  - Yêu tộc: 1 họ chỉ dùng cho 1 tộc (Hồ tộc họ Hồ, Lôi thú họ Lôi, Trùng tộc họ Trùng, Mộc tộc họ Mộc, Báo tộc họ Báo...).
 *  - Nhân tộc: Đa dạng họ Trung Quốc từ pool SURN (Hoàng, Quách, Trần, Ngô, Dương, Hàn, Vương, Tần, Doanh, Đỗ, Lưu...).
 */
export function getRaceSurname(race: string, org?: Origin | null, beastName?: string): string {
  if (race === 'Hiên Viên tộc') {
    return org?.clan || 'Hiên Viên';
  }
  if (race === 'Hình Thiên tộc') {
    return org?.clan || 'Hình';
  }
  if (race === 'Cửu Lê tộc') {
    return org?.clan || 'Xi';
  }
  if (race === 'Vu tộc') {
    return org?.clan || 'Vu';
  }
  if (race === 'Ma tộc') {
    return org?.clan || 'Ma';
  }
  if (race === 'Yêu tộc' || org?.beastOrigin) {
    const spec = identifyYaoSpecies(beastName);
    return spec.surname;
  }
  // Nhân tộc: nếu có thế gia clan thì theo clan, nếu không thì lấy họ từ pool SURN
  if (org?.clan) return org.clan;
  return pick(SURN);
}

/** Tạo tên ngẫu nhiên đúng chuẩn chủng tộc và giới tính */
export function mkRaceName(race: string, g: 'm' | 'f', org?: Origin | null, beastName?: string): string {
  const sur = getRaceSurname(race, org, beastName);
  const given = pick(g === 'm' ? MALE : FEM);
  return `${sur} ${given}`;
}

/** Chuẩn hóa họ tên hiện tại khi đổi tộc hoặc đổi xuất thân */
export function applyRaceSurname(currentName: string, race: string, g: 'm' | 'f', org?: Origin | null, beastName?: string): string {
  const sur = getRaceSurname(race, org, beastName);
  const { given } = splitName(currentName);
  const cleanGiven = given || pick(g === 'm' ? MALE : FEM);
  return `${sur} ${cleanGiven}`;
}
