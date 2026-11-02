import { s, type NPC } from './state';
import type { TcPerson } from './tienco';
import { LAST_WORLD, splitName } from '../data/core';
import { CELESTIAL, celestialOffices } from '../data/celestial';
import { nameKey, uniquePersonalName } from '../core/names';

let officeNames: Set<string>[] | undefined;
const checkedWorlds = new Map<number, string>();

/** Linked records are one identity. Canonical figures and the player take priority. */
export function ensureWorldNames(people: TcPerson[] = s.flags.tienco?.people ?? []) {
  officeNames ??= Array.from({ length: LAST_WORLD + 1 }, (_, w) => new Set(Object.keys(CELESTIAL).flatMap(id => celestialOffices(id as keyof typeof CELESTIAL, w).map(o => nameKey(o.name)))));
  const npcs = new Map(s.npcs.map(n => [n.id, n]));
  const linked = new Set(people.flatMap(p => p.npc ? [p.npc] : []));
  for (let w = 0; w <= LAST_WORLD; w++) {
    const canonical = officeNames[w];
    const used = new Set(canonical);
    if (w === (s.world ?? 0)) used.add(nameKey(s.name));
    const claimedCanonical = new Set<string>();
    const residents: { person?: TcPerson; npc?: NPC }[] = people.filter(p => p.world === w)
      .map(person => ({ person, npc: person.npc ? npcs.get(person.npc) : undefined }));
    if (w === (s.world ?? 0)) residents.push(...s.npcs.filter(n => !linked.has(n.id)).map(npc => ({ npc })));
    const signature = () => `${s.id}|${w === (s.world ?? 0) ? s.name : ''}|` + residents.map(({ person: p, npc: n }) => `${p?.id}:${p?.name}:${n?.id}:${n?.name}`).join('|');
    if (checkedWorlds.get(w) === signature()) continue;
    const score = (r: { person?: TcPerson; npc?: NPC }) => {
      let sc = 0;
      if (r.person?.chief || r.person?.fengshen || r.person?.lord || r.person?.heroine) sc += 10;
      if (r.person?.legacyRole) sc += 8;
      if (r.npc?.tag === 'master' || r.npc?.tag === 'daolu') sc += 6;
      return sc;
    };
    const ordered = [...residents].sort((a, b) => score(b) - score(a));
    for (const { person: p, npc: n } of ordered) {
      if (p?.fengshen && p.fsi !== undefined) {
        used.add(nameKey(p.name));
        continue;
      }
      const record = (p && p.legacyRole) ? p : (n ?? p!);
      const key = nameKey(record.name);
      // A legendary figure also listed by an office is the same person, not a namesake.
      const isCanonical = !!p && !!(p.chief || p.fengshen) && canonical.has(key) && !claimedCanonical.has(key);
      if (isCanonical) claimedCanonical.add(key);
      else if (used.has(key) || record.name.endsWith(' Bách Lý')) {
        record.name = uniquePersonalName(record.g, splitName(record.name).sur, used, `resident:${w}:${record.id}`);
      }
      used.add(nameKey(record.name));
      if (p) p.name = record.name;
      if (n) n.name = record.name;
    }
    checkedWorlds.set(w, signature());
  }
}
