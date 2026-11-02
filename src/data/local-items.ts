import { WORLD } from './core';
import { TECHS, SKILLS, TAMPHAP, PILLS, TALIS, pillGiai, type Gear } from './items';
import { PHAPQUYET } from './spirit';
import { worldArtCap, worldTreasureCap, growTreasureGrade } from './treasure-grades';

const tables = { cp: TECHS, sk: SKILLS, tp: TAMPHAP, fq: PHAPQUYET, p: PILLS, t: TALIS };
type Kind = keyof typeof tables;
const knownKind = (k: string): k is Kind => k in tables;
export const baseItemKey = (key: string) => key.replace(/^local\d_g\d_/, '');
const variant = /^local(\d)_g(\d)_(.+)$/;

/** Named local editions retain their own identity when carried to another world. */
export function localItemId(id: string, w = WORLD.lv, cap = worldArtCap(w)): string {
  const colon = id.indexOf(':');
  const kind = id.slice(0, colon), key = id.slice(colon + 1);
  if (!knownKind(kind)) return id;
  const table = tables[kind] as unknown as Record<string, Record<string, any>>;
  const old = key.match(variant);
  if (old && !table[key]) localItemId(`${kind}:${old[3]}`, Number(old[1]), Number(old[2]));
  const item = table[key];
  if (!item) return id;
  const grade = kind === 'p' ? pillGiai(item as typeof PILLS[string]) : item.tier;
  if (item.grow || item.el === 'hondon' || grade <= cap) return id;
  const baseKey = old?.[3] ?? key;
  const next = `local${w}_g${cap}_${baseKey}`;
  if (!table[next]) {
    const scale = Math.pow(0.55, grade - cap);
    const copy: Record<string, any> = { ...item, id: next, n: item.n.replace(/ \((tàn bản|hạ giới)\)$/, '') + (['cp', 'sk', 'tp', 'fq'].includes(kind) ? ' (tàn bản)' : ' (hạ giới)'), d: `Bản hạ giới, hiệu lực giảm còn ${Math.round(scale * 100)}% so với bản nguồn. ${item.d}` };
    if (kind === 'p') { copy.giai = cap; copy.v = item.v * scale; }
    else copy.tier = cap;
    if (kind === 't') { copy.p = Math.min(item.p, [1, 2, 3, 4, 6, 7, 9][cap]); copy.m = item.m * scale; }
    if (kind === 'sk') copy.m = 1 + Math.max(0, item.m - 1) * scale;
    if (kind === 'cp') {
      copy.skills = item.skills.map((key: string) => localItemId('sk:' + key, w, cap).slice(3));
      for (const k of ['pw', 'hp', 'def']) if (item[k] !== undefined) copy[k] = 1 + (item[k] - 1) * scale;
    }
    if (kind === 'tp' || kind === 'fq') for (const k of ['cult', 'brk', 'tam', 'ngo', 'calm', 'herb', 'speed', 'flee', 'hide', 'atk', 'def', 'heal', 'luck']) if (typeof item[k] === 'number') copy[k] = item[k] * scale;
    // Keep procedural pools free of duplicate editions from other worlds.
    Object.defineProperty(table, next, { value: copy, enumerable: false, configurable: true });
  }
  return `${kind}:${next}`;
}

export function localRecipeId(key: string, w = WORLD.lv): string {
  return localItemId((PILLS[key] ? 'p:' : 't:') + key, w).slice(2);
}

/** All menus and procedural pools see the same world-specific editions. */
export function worldDefinitions<K extends Kind>(kind: K, w = WORLD.lv): Array<(typeof tables)[K][string]> {
  return Object.keys(tables[kind]).map(key => {
    const local = localItemId(`${kind}:${key}`, w).slice(kind.length + 1);
    return tables[kind][local] as (typeof tables)[K][string];
  });
}

/** Existing and scripted gear is normalized too, including stats; repeat calls are idempotent. */
export function limitGear(g: Gear, w = WORLD.lv, cap: number = worldTreasureCap(w)) {
  if (g.grow) { const gr = growTreasureGrade(/\(tàn khuyết\)/i.test(g.n), w, undefined, undefined, g.q); g.g = Math.min(cap, gr.g); g.q = gr.q; return g; } // Hỗn Độn Kiếm: bắt đầu từ phẩm thấp nhất, trưởng thành theo người dùng và trần giới
  if (g.g <= cap) return g;
  const ratio = (1 + cap * 0.45) / (1 + g.g * 0.45);
  for (const k of ['atk', 'def', 'hp', 'cult', 'cap', 'luck'] as const) g[k] = Math.floor(g[k] * ratio);
  g.g = cap;
  return g;
}

// Recreate deterministic edition IDs before a saved character is read.
for (const [kind, table] of Object.entries(tables)) {
  for (const key of Object.keys(table)) for (let w = 0; w < 4; w++) {
    localItemId(`${kind}:${key}`, w);
    if (worldArtCap(w) > 4) localItemId(`${kind}:${key}`, w, 4);
  }
}
