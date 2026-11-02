import { s } from './state';
import type { TcPerson } from './tienco';
import { LEGENDARY_TREASURES, treasureManifest } from '../data/treasure-grades';
import { DECLINING_SCHOOLS, branchId, branchSchool, legacyRoleKey } from '../data/declining-schools';
import { npcCap, REALMS, splitName } from '../data/core';
import { hashStr, seeded } from '../core/util';

/** One living office holder per role/world. Death or ascension transfers replicas, never duplicates originals. */
export function maintainLegacyHolders(people: TcPerson[]) {
  const linked = new Map(s.npcs.map(n => [n.id, n]));
  for (const p of people) {
    p.treasures = [];
    if (p.legacyRole && (p.world !== p.legacyWorld || p.world >= 4 || !p.alive || (p.npc && linked.get(p.npc)?.alive === false))) delete p.legacyRole;
    if (p.world < 4 && branchSchool(p.sect) && !p.legacyRole) {
      p.sect = 'Tán tu';
      p.from = 'Cựu môn nhân của chi phái suy tàn';
      const n = p.npc ? linked.get(p.npc) : undefined;
      if (n) n.sect = null;
    }
  }
  for (const t of LEGENDARY_TREASURES) {
    const original = people.find(p => p.alive && p.world === 4 && p.chief && p.name === t.owner);
    if (original) (original.treasures ??= []).push(t.id);
    for (let w = 0; w < 4; w++) {
      const key = legacyRoleKey(t);
      let holder = people.find(p => p.alive && p.world === w && p.legacyRole === key);
      if (!holder) {
        const id = `legacy-holder:${w}:${key}:${people.length}`;
        const rnd = seeded(hashStr(s.id + id));
        const surname = t.owner === 'Lão Tử' ? 'Lý' : splitName(t.owner).sur;
        const g = t.owner === 'Vân Tiêu' ? 'f' : 'm';
        const r = Math.max(1, npcCap(w) - 5);
        const training = REALMS.slice(1, r).reduce((years, realm) => years + realm.turn * 12 / 1.9, 0);
        const age = Math.ceil(Math.max(20 + training, REALMS[r].life * (0.4 + rnd() * 0.2)));
        holder = { id, name: `${surname} ${['Thanh Huyền', 'Minh Tâm', 'Ngọc Thanh', 'Tĩnh Vân', 'Huyền Chân'][Math.floor(rnd() * 5)]}`, g, world: w,
          born: s.year - age, soulBorn: s.year - age, r, st: 1, p: 0, talent: 1.9, el: 'tho', asc: 0, alive: true,
          sect: DECLINING_SCHOOLS[t.school].name, from: `${t.role} · Chi phái suy tàn`, loc: branchId(w, t.school), legacyRole: key, legacyWorld: w, treasures: [] };
        // Tiệt giáo accepts nonhuman successors as well as humans.
        if (t.school === 'jie' && rnd() < 0.5) { holder.beast = 'Lôi Giao'; holder.race = 'Yêu tộc'; holder.el = 'loi'; }
        people.push(holder);
      }
      (holder.treasures ??= []).push(t.id);
    }
  }
}

export function heldTreasures(person: Pick<TcPerson, 'treasures' | 'world'>) {
  return (person.treasures ?? []).flatMap(id => {
    const t = LEGENDARY_TREASURES.find(t => t.id === id);
    return t ? [{ ...treasureManifest(t, person.world), id: t.id, role: t.role, merit: t.merit }] : [];
  });
}

export const treasureBonus = (p: Pick<TcPerson, 'treasures' | 'world'>) => heldTreasures(p).reduce((sum, t) => sum + (t.grade + 1) * 0.03 * t.powerScale * t.functions.length, 0);
export function npcTreasureBonus(npcId: string): number {
  const p: TcPerson | undefined = s.flags.tienco?.people.find((p: TcPerson) => p.alive && p.world === (s.world ?? 0) && p.npc === npcId);
  return p ? treasureBonus(p) : 0;
}
