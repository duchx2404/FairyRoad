import { s } from './state';
import { localItemId, localRecipeId, limitGear } from '../data/local-items';
import { branchSchool } from '../data/declining-schools';
import { worldArtCap } from '../data/treasure-grades';
import { SECTS } from '../data/world';
import { type NPC } from './state';

export function normalizeNpcItems(n: NPC, w = s.world ?? 0) {
  if (!n.kit) return;
  const branch = n.sect && branchSchool(SECTS[n.sect]?.n ?? '');
  const cap = branch ? Math.min(4, worldArtCap(w)) : worldArtCap(w);
  if (n.kit.tech) n.kit.tech = localItemId('cp:' + n.kit.tech, w, cap).slice(3);
  n.kit.known = [...new Set(n.kit.known.map(id => localItemId('sk:' + id, w, cap).slice(3)))];
  for (const g of n.kit.gear) if (g) limitGear(g, w, branch ? 4 : undefined);
}

/** Also covers saves and scripted rewards which assigned fields directly. Does not reset training XP. */
export function normalizeWorldItems() {
  if (!s) return;
  const w = s.world ?? 0;
  if (!s.flags.beforeWorldGradeMigration) s.flags.beforeWorldGradeMigration = JSON.parse(JSON.stringify({
    tech: s.tech, known: s.known, skills: s.skills, bag: s.bag, gear: s.gear, gearBag: s.gearBag,
    recipes: s.recipes, tamphap: s.flags.tamphap, tamActive: s.flags.tamActive, phapquyet: s.flags.phapquyet,
  }));
  const key = (kind: string, id: string) => localItemId(kind + ':' + id, w).slice(kind.length + 1);
  if (s.tech) s.tech = key('cp', s.tech);
  s.known = [...new Set(s.known.map(id => key('sk', id)))];
  s.skills = [...new Set(s.skills.map(id => key('sk', id)))];
  for (const [field, kind] of [['tamphap', 'tp'], ['tamActive', 'tp'], ['phapquyet', 'fq']]) {
    if (Array.isArray(s.flags[field])) s.flags[field] = [...new Set(s.flags[field].map((id: string) => key(kind, id)))];
  }
  if (s.flags.kmb) s.flags.kmb = Object.fromEntries(Object.entries(s.flags.kmb).map(([id, placement]) => {
    const colon = id.indexOf(':'); const kind = id.slice(0, colon);
    return [kind === 'sk' || kind === 'tk' ? kind + ':' + key(kind === 'tk' ? 'tp' : 'sk', id.slice(colon + 1)) : id, placement];
  }));
  s.recipes = [...new Set(s.recipes.map(id => localRecipeId(id, w)))];
  for (const item of s.bag) item.id = localItemId(item.id, w);
  for (const g of [...s.gear, ...s.gearBag]) if (g) limitGear(g, w);
  for (const n of s.npcs) normalizeNpcItems(n, w);
}
