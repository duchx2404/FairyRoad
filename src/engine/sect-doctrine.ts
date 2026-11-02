import { branchSchool } from '../data/declining-schools';
import { hashStr, seeded } from '../core/util';

export type Doctrine = 'jie' | 'chan' | 'laozi' | 'ordinary';
export function sectDoctrine(sect: string): Doctrine {
  if (/Tiệt Giáo|Tam Tiên Đảo|Cửu Long Đảo|Hỏa Long Đảo|La Phù Động|Bạch Cốt Động/.test(sect)) return 'jie';
  if (/Xiển Giáo/.test(sect)) return 'chan';
  if (/Đạo Giáo.*Bát Cảnh Cung/.test(sect)) return 'laozi';
  return 'ordinary';
}
/** Gameplay weights represent broad vs selective teaching, not numerical claims from the novel. */
export const doctrineWeight = (sect: string) => branchSchool(sect) ? 0 : ({ jie: 2.5, chan: 0.4, laozi: 0, ordinary: 1 })[sectDoctrine(sect)];
export function doctrineAccepts(p: { id: string; sect: string; talent: number; beast?: string; race?: string; races?: string[] }): boolean {
  if (branchSchool(p.sect)) return false; // Small branches are populated by persistent lineage holders.
  const doctrine = sectDoctrine(p.sect);
  if (doctrine === 'laozi') return false; // Direct disciples of Laozi are canonical, not procedurally generated.
  if (doctrine !== 'chan') return true;
  const nonhuman = !!p.beast || [p.race, ...(p.races ?? [])].some(race => race && race !== 'Nhân tộc');
  return p.talent >= 1.5 && (!nonhuman || (p.talent >= 1.8 && seeded(hashStr(p.id + ':chan-admission'))() < 0.08));
}
