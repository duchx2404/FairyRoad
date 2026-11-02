import { s, type NPC } from './state';
import { REALMS, STAGES, worldName } from '../data/core';
import { LOCS } from '../data/world';

export interface SongTuContext {
  me: string;
  player: string;
  partner: string;
  partnerNames: string;
  partners: string[];
  place: string;
  world: string;
  outcome: string;
  playerAge: number;
  partnerAge: number;
}
export const canSongTu = (n: NPC) => n.alive && n.tag === 'daolu' && s.year - s.born >= 18 && s.year - n.born >= 18;
export function songTuPartnerNames(people: NPC[]): string {
  const names = [...new Map(people.map(n => [n.id, n.name])).values()];
  return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' và ' + names[names.length - 1];
}
export function songTuOutcome(input: NPC | NPC[], text: string): { text: string; songTu?: SongTuContext } {
  const people = Array.isArray(input) ? input : [input];
  if (!people.length || people.some(n => !canSongTu(n))) return { text };
  return { text, songTu: {
    me: s.name,
    partners: [...new Map(people.map(n => [n.id, n.name])).values()],
    partnerNames: songTuPartnerNames(people),
    player: `${s.name}, ${s.g === 'm' ? 'nam' : 'nữ'}, ${Math.floor(s.year - s.born)} tuổi, ${REALMS[s.r].n} ${STAGES[s.st]}`,
    partner: people.map(n => `${n.name}, ${n.g === 'm' ? 'nam' : 'nữ'}, ${Math.floor(s.year - n.born)} tuổi, ${REALMS[n.r].n} ${STAGES[n.st]}, đạo lữ${n.bio?.look ? ', ' + n.bio.look : ''}`).join('\n'),
    place: LOCS[s.loc]?.n ?? s.loc, world: worldName(s.world ?? 0), outcome: text,
    playerAge: Math.floor(s.year - s.born), partnerAge: Math.min(...people.map(n => Math.floor(s.year - n.born))),
  } };
}
