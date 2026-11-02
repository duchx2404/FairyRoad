import { LAST_WORLD, npcCap } from '../data/core';
import { worldPack } from '../data/world';

export interface BeastEvolution { from: string; milestone: number }
/** One ancestral step per completed realm; the pinnacle of Chaos completes the lineage. */
export function beastEvolution(beast: string | undefined, world: number, r: number, st: number, previous?: BeastEvolution) {
  if (!beast || st < 3) return;
  const milestone = world * 100 + r;
  if (previous && previous.milestone >= milestone) return;
  const beasts = worldPack(world).beasts;
  let current = beasts.find(b => b.n === beast);
  const pinnacle = world === LAST_WORLD && r >= npcCap(world);
  const seen = new Set<string>();
  while (current?.anc && !seen.has(current.n)) {
    seen.add(current.n);
    const parent = beasts.find(b => b.n === current!.anc);
    if (!parent || (!parent.anc && !pinnacle)) break;
    current = parent;
    if (!pinnacle) break;
  }
  if (!current || current.n === beast) return;
  return { beast: current.n, el: current.el, blood: `Đã thoát biến từ ${beast} thành ${current.n} · huyết mạch thuần`,
    evolution: { from: beast, milestone } };
}
