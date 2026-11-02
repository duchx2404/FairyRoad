import { worldPack, applyWorld, LOCS, MAP_W, MAP_H, SECTS, type Vuc, type Loc } from './world';
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
export const seatId = (w: number, school: LegacySchool) => `legacy_${w}_${school}_seat`;
export const branchSchool = (name: string) => (Object.keys(DECLINING_SCHOOLS) as LegacySchool[]).find(k => DECLINING_SCHOOLS[k].name === name);
export const legacyRoleKey = (t: LegendaryTreasure) => `${t.school}:${t.role}`;

export function isSameSect(sectA?: string | null, sectB?: string | null): boolean {
  if (!sectA || !sectB) return false;
  if (sectA === sectB) return true;
  const nameA = SECTS[sectA]?.n ?? sectA;
  const nameB = SECTS[sectB]?.n ?? sectB;
  if (nameA === nameB || sectA === nameB || sectB === nameA) return true;
  for (const [k, v] of Object.entries(DECLINING_SCHOOLS)) {
    const isA = sectA === v.name || sectA.endsWith(`_${k}`) || nameA === v.name;
    const isB = sectB === v.name || sectB.endsWith(`_${k}`) || nameB === v.name;
    if (isA && isB) return true;
  }
  return false;
}

export const SCHOOL_VUC: Record<LegacySchool, Vuc> = {
  chan: 'trung',
  jie: 'dong',
  laozi: 'bac',
  buddhist: 'tay',
};

/** Đạo tràng tổ đình của mỗi chi phái: một địa danh riêng, chi phái dựng sơn môn ngay bên cạnh. Kim Ngao Đảo là đảo ngoài khơi biển đông. */
export const SCHOOL_SEAT: Record<LegacySchool, { n: string; island?: boolean; d: string }> = {
  chan: { n: 'Côn Lôn Sơn', d: 'Vạn sơn chi tổ giữa Trung Vực, tuyết trắng phủ đỉnh quanh năm. Tương truyền xưa kia Ngọc Hư Cung của Xiển Giáo dựng trên đỉnh núi; nay chỉ còn một chi truyền thừa giữ sơn môn dưới chân núi.' },
  jie: { n: 'Kim Ngao Đảo', island: true, d: 'Hòn đảo ngoài khơi biển đông, hình như con ngao vàng nằm phục giữa sóng. Bích Du Cung của Tiệt Giáo năm xưa vạn tiên lai triều; nay chỉ còn một chi phái nhỏ giữ đảo.' },
  laozi: { n: 'Huyền Đô Sơn', d: 'Núi mây phương bắc, tương truyền là nơi Thái Thanh đạo tổ giảng Đạo Đức Kinh. Đỉnh núi quanh năm thanh tĩnh, Bát Cảnh truyền thừa ẩn cư dưới chân núi.' },
  buddhist: { n: 'Linh Sơn', d: 'Thánh sơn của Tây Vực, chim thứu đậu trên vách đá, chuông kinh vang giữa sa mạc. Một chi truyền thừa của Tây Phương Giáo vẫn giữ giới luật dưới chân núi.' },
};

const dist = (a: { x: number; y: number }, x: number, y: number) => Math.hypot(a.x - x, a.y - y);

/** Đặt cặp (tổ đình, sơn môn) sát nhau: đất liền thì kẹp hai bên dãy núi của tổ đình; Kim Ngao Đảo thì nằm ngoài khơi biển đông. */
function placePair(w: number, school: LegacySchool, seat: Loc, sect: Loc) {
  const land = worldPack(w).landmass;
  const v = SCHOOL_VUC[school];
  const m = land[v];
  const others = Object.values(LOCS).filter(l => l !== seat && l !== sect);
  const clear = (x: number, y: number) => Math.min(...others.map(o => dist(o, x, y)));
  if (SCHOOL_SEAT[school].island) {
    const onLand = (x: number, y: number) => Object.values(land).some(k => ((x - k.x) / (k.rx * 1.2 + 200)) ** 2 + ((y - k.y) / (k.ry * 1.2 + 200)) ** 2 < 1);
    const dongLand = others.filter(o => !o.island && o.chau && worldPack(w).regions[o.reg]?.vuc === 'dong');
    const nearChau = (x: number, y: number) => dongLand.reduce((b, k) => (dist(k, x, y) < dist(b, x, y) ? k : b), dongLand[0])?.chau;
    let best: [number, number] = [MAP_W - 400, m.y], bestD = -1;
    for (let x = m.x + m.rx; x <= MAP_W - 350; x += 60) for (let y = m.y - m.ry; y <= m.y + m.ry; y += 60) {
      if (y < 350 || y > MAP_H - 450 || onLand(x, y) || onLand(x, y + 140) || nearChau(x, y) !== nearChau(x, y + 140)) continue;
      const d = Math.min(clear(x, y), clear(x, y + 140));
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
    seat.xy = [Math.round(best[0]), Math.round(best[1])];
    sect.xy = [Math.round(best[0]), Math.round(best[1] + 140)];
  } else {
    const dx = 140, dy = -60;
    const inCont = (x: number, y: number) => ((x - m.x) / m.rx) ** 2 + ((y - m.y) / m.ry) ** 2 <= 0.72 ** 2;
    const awayBorder = (x: number, y: number) => {
      if (v === 'trung') {
        const nx = (x - m.x) / m.rx, ny = (y - m.y) / m.ry, f = Math.hypot(nx, ny), deg = Math.abs((Math.atan2(ny, nx) * 180) / Math.PI);
        return Math.abs(f - 0.48) > 0.1 && Math.abs(deg - 45) > 14 && Math.abs(deg - 135) > 14;
      }
      const along = v === 'tay' ? (y - m.y) / m.ry : (x - m.x) / m.rx;
      return Math.abs(Math.abs(along) - 1 / 3) > 0.15;
    };
    let best: [number, number] = [seat.x, seat.y], bestD = -1;
    for (let x = m.x - m.rx * 0.7; x <= m.x + m.rx * 0.7; x += 60) for (let y = m.y - m.ry * 0.7; y <= m.y + m.ry * 0.7; y += 60) {
      if (!inCont(x, y) || !inCont(x + dx, y + dy) || !awayBorder(x, y) || !awayBorder(x + dx, y + dy)) continue;
      const d = Math.min(clear(x, y), clear(x + dx, y + dy));
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
    seat.xy = [Math.round(best[0]), Math.round(best[1])];
    sect.xy = [Math.round(best[0] + dx), Math.round(best[1] + dy)];
  }
  seat.pin = sect.pin = true;
  [seat.x, seat.y] = seat.xy; [sect.x, sect.y] = sect.xy;
}

/** Bốn chi phái nhỏ chia đều bốn phương, mỗi chi bên một tổ đình riêng; không thay thế các tông môn hoặc thần giới đang tồn tại. */
export function installDecliningSchools() {
  for (let w = 0; w < 4; w++) {
    const pack = worldPack(w);
    const vucOf = (l: Loc) => pack.regions[l.reg]?.vuc;
    const seaReg = Object.keys(pack.regions).find(r => /donghai$/.test(r) && pack.regions[r].vuc === 'dong')!;
    for (const school of Object.keys(DECLINING_SCHOOLS) as LegacySchool[]) {
      const def = DECLINING_SCHOOLS[school], id = branchId(w, school), sid = seatId(w, school);
      if (pack.sects[id]) continue;
      const v = SCHOOL_VUC[school], seat = SCHOOL_SEAT[school];
      const anchor = pack.locs.find(l => l.type === 'town' && !l.island && vucOf(l) === v)
        || pack.locs.find(l => vucOf(l) === v && !l.island) || pack.locs[0];
      const wilds = pack.locs.filter(l => l.type === 'wild' && l.lv && vucOf(l) === v);
      const lv = Math.max(1, Math.round(wilds.reduce((a, l) => a + l.lv!, 0) / Math.max(1, wilds.length)));
      const reg = seat.island ? seaReg : anchor.reg;
      const d = `Chi phái suy tàn của đạo thống Hồng Hoang, sơn môn ở ${seat.n}; chỉ còn vài người giữ truyền thừa. Công pháp và pháp bảo đều dưới Thần giai.`;
      pack.locs.push({ id: sid, n: seat.n, type: 'wild', reg, x: 0, y: 0, qi: 1.6, lv, d: seat.d, ...(seat.island ? { island: true } : {}) });
      pack.sects[id] = { id, n: def.name, loc: id, tier: 1, el: TECHS[def.tech].el, minQ: school === 'chan' || school === 'laozi' ? 3 : 1, tech: def.tech, craft: def.craft, d, motto: def.motto };
      pack.locs.push({ id, n: def.name, type: 'sect', sect: id, reg, x: 0, y: 0, qi: 1.1, d, ...(seat.island ? { island: true } : {}) });
    }
    pack.laid = false;
  }
  for (let w = 3; w >= 0; w--) {
    applyWorld(w);
    for (const school of Object.keys(DECLINING_SCHOOLS) as LegacySchool[]) {
      placePair(w, school, LOCS[seatId(w, school)], LOCS[branchId(w, school)]);
    }
  }
  // Nạp lại giới 0 sau khi đã ghim toạ độ để dựng đảo, núi và châu khớp hoàn toàn
  applyWorld(1);
  applyWorld(0);
}
