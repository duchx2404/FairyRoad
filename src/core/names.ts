import { MALE, FEM } from '../data/core';
import { hashStr } from './util';

export const nameKey = (name: string) => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
/** Exhaustive, deterministic search; no numeric suffixes and no retry loops relying on luck. */
export function uniquePersonalName(
  g: 'm' | 'f',
  surname: string,
  used: Set<string>,
  seed: string,
  usedGiven?: Set<string>,
): string {
  const given = [...new Set(g === 'm' ? MALE : FEM)];
  const offset = hashStr(seed) % given.length;
  if (usedGiven) {
    for (let i = 0; i < given.length; i++) {
      const cand = given[(offset + i) % given.length];
      if (usedGiven.has(nameKey(cand))) continue;
      const name = `${surname} ${cand}`;
      if (!used.has(nameKey(name))) {
        usedGiven.add(nameKey(cand));
        return name;
      }
    }
    const first = [...new Set(given.map(n => n.split(' ')[0]))];
    const last = [...new Set(given.map(n => n.split(' ').at(-1)!))];
    for (let i = 0; i < first.length * last.length; i++) {
      const ix = (hashStr(seed) + i) % (first.length * last.length);
      const cand = `${first[Math.floor(ix / last.length)]} ${last[ix % last.length]}`;
      if (usedGiven.has(nameKey(cand))) continue;
      const name = `${surname} ${cand}`;
      if (!used.has(nameKey(name))) {
        usedGiven.add(nameKey(cand));
        return name;
      }
    }
  }
  for (let i = 0; i < given.length; i++) {
    const cand = given[(offset + i) % given.length];
    const name = `${surname} ${cand}`;
    if (!used.has(nameKey(name))) {
      usedGiven?.add(nameKey(cand));
      return name;
    }
  }
  const first = [...new Set(given.map(n => n.split(' ')[0]))];
  const last = [...new Set(given.map(n => n.split(' ').at(-1)!))];
  for (let i = 0; i < first.length * last.length; i++) {
    const ix = (hashStr(seed) + i) % (first.length * last.length);
    const cand = `${first[Math.floor(ix / last.length)]} ${last[ix % last.length]}`;
    const name = `${surname} ${cand}`;
    if (!used.has(nameKey(name))) {
      usedGiven?.add(nameKey(cand));
      return name;
    }
  }
  throw new Error(`Name pool exhausted for surname ${surname}`);
}
