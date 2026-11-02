import { worldPack } from './world';
import { TECHS } from './items';
import type { LegendaryTreasure } from './treasure-grades';

export const DECLINING_SCHOOLS = {
  chan: { name: 'Xiển Giáo · Ngọc Hư truyền thừa', craft: 'alch', tech: 'nguhanhquyet', motto: 'Trọng căn cơ, nghiêm sư pháp.' },
  jie: { name: 'Tiệt Giáo · Bích Du truyền thừa', craft: 'talis', tech: 'phuvanbo', motto: 'Hữu giáo vô loài.' },
  laozi: { name: 'Đạo Giáo · Bát Cảnh truyền thừa', craft: 'alch', tech: 'thanhmocquyet', motto: 'Thanh tĩnh vô vi.' },
  buddhist: { name: 'Phật Giáo · Tây Phương truyền thừa', craft: 'alch', tech: 'kimcuongquyet', motto: 'Từ bi, giới định tuệ.' },
} as const;
export type LegacySchool = keyof typeof DECLINING_SCHOOLS;
export const branchId = (w: number, school: LegacySchool) => `legacy_${w}_${school}`;
export const branchSchool = (name: string) => (Object.keys(DECLINING_SCHOOLS) as LegacySchool[]).find(k => DECLINING_SCHOOLS[k].name === name);
export const legacyRoleKey = (t: LegendaryTreasure) => `${t.school}:${t.role}`;

/** Bốn chi phái nhỏ, không thay thế các tông môn hoặc thần giới đang tồn tại. */
export function installDecliningSchools() {
  for (let w = 0; w < 4; w++) {
    const pack = worldPack(w);
    const anchor = pack.locs.find(l => l.type === 'town' && !l.island)!;
    for (const [i, school] of (Object.keys(DECLINING_SCHOOLS) as LegacySchool[]).entries()) {
      const def = DECLINING_SCHOOLS[school], id = branchId(w, school);
      if (pack.sects[id]) continue;
      const d = 'Chi phái suy tàn của đạo thống Hồng Hoang, chỉ còn vài người giữ truyền thừa. Công pháp và pháp bảo đều dưới Thần giai.';
      pack.sects[id] = { id, n: def.name, loc: id, tier: 1, el: TECHS[def.tech].el, minQ: school === 'chan' || school === 'laozi' ? 3 : 1, tech: def.tech, craft: def.craft, d, motto: def.motto };
      pack.locs.push({ id, n: def.name, type: 'sect', sect: id, reg: anchor.reg, x: anchor.x + (i - 1.5) * 24, y: anchor.y + 32, qi: 1.1, d });
    }
  }
}
