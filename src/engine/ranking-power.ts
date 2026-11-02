import { treasureBonus } from './legacy-holders';
import { REALMS, worldMult } from '../data/core';
import { worldPack } from '../data/world';
import { TECHS, SKILLS } from '../data/items';
import { s } from './state';
import { powerScore } from './char';
import type { TcRow } from './tienco';
import { hashStr, seeded } from '../core/util';

const artsBonus = (known: string[]) => 1 + known.map(id => SKILLS[id]?.m ?? 0).sort((a, b) => b - a).slice(0, 4).reduce((a, b) => a + b, 0) * 0.025;
/** ATK + 1.2 DEF + HP/8, plus combat arts; no age bonus or automatic faction precedence. */
export function rankingPower(row: TcRow, world: number): number {
  if (row.mine) return Math.round(powerScore() * artsBonus(s.skills));
  const n = row.npc, p = row.person;
  const rnd = seeded(hashStr(row.id + ':combat-profile'));
  const sects = Object.values(worldPack(world).sects);
  const tier = sects.find(sc => sc.id === n?.sect || sc.n === p?.sect)?.tier ?? 0;
  const celestial = row.celestialTier;
  const heritage = celestial !== undefined ? 1.8 - Math.min(5, celestial) * 0.12 : 1 + tier * 0.1;
  const talent = 0.75 + (n?.talent ?? p?.talent ?? 1.5) * 0.25;
  const tech = n?.kit?.tech ? TECHS[n.kit.tech] : undefined;
  // Unmet residents have a stable estimated loadout based on their cultivation and lineage.
  const technique = tech ? (0.9 + tech.tier * 0.1) * (tech.pw || 1) : heritage * (0.9 + rnd() * 0.2);
  const blood = p?.evolution ? 1.25 : p?.beast || n?.beast ? 1.1 : p?.race || n?.race ? 1.05 : 1;
  const base = REALMS[row.r].pow * (1 + row.st * 0.3) * (1 + Math.max(0, row.r - 1) * 0.08) * worldMult(world) * talent * technique * blood;
  let atk = base, def = base * 0.35, hp = base * 8;
  if (n?.kit) {
    for (const gear of n.kit.gear) if (gear) { atk += gear.atk; def += gear.def; hp += gear.hp; }
  } else {
    const equipment = 1 + (heritage - 0.8) * (0.2 + rnd() * 0.2);
    atk *= equipment; def *= equipment; hp *= equipment;
  }
  const arts = n?.kit ? artsBonus(n.kit.known) : 1 + Math.min(4, 1 + Math.floor(row.r / 2)) * 0.04 * heritage;
  const relic = p ? treasureBonus(p) : 0;
  return Math.round((atk + def * 1.2 + hp / 8) * arts * (1 + relic));
}
export const compareRankPower = (a: TcRow, b: TcRow) => (b.power ?? 0) - (a.power ?? 0) || a.age - b.age || a.id.localeCompare(b.id);
