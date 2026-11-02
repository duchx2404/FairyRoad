import { MALE, FEM } from '../data/core';
import { hashStr } from './util';

export const nameKey = (name: string) => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
/** Exhaustive, deterministic search; no numeric suffixes and no retry loops relying on luck. */
export function uniquePersonalName(g: 'm' | 'f', surname: string, used: Set<string>, seed: string): string {
  const given = [...new Set(g === 'm' ? MALE : FEM)];
  const offset = hashStr(seed) % given.length;
  for (let i = 0; i < given.length; i++) {
    const name = `${surname} ${given[(offset + i) % given.length]}`;
    if (!used.has(nameKey(name))) return name;
  }
  const first = [...new Set(given.map(n => n.split(' ')[0]))];
  const last = [...new Set(given.map(n => n.split(' ').at(-1)!))];
  for (let i = 0; i < first.length * last.length; i++) {
    const ix = (hashStr(seed) + i) % (first.length * last.length);
    const name = `${surname} ${first[Math.floor(ix / last.length)]} ${last[ix % last.length]}`;
    if (!used.has(nameKey(name))) return name;
  }
  throw new Error(`Name pool exhausted for surname ${surname}`);
}
