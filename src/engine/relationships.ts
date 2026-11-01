import { s, type NPC } from './state';

function leadId(): string | undefined {
  return s.g === 'm' ? s.flags.heroineId : s.flags.mainLeadId;
}

export function isPrimaryDaolu(n: NPC): boolean {
  if (n.tag !== 'daolu') return false;
  return n.spouseRole === 'primary' || n.id === s.flags.primaryDaolu || n.id === leadId();
}

export function primaryDaolu(): NPC | undefined {
  return s.npcs.find((n) => n.alive && isPrimaryDaolu(n));
}

export function wedDaolu(n: NPC): NPC {
  n.tag = 'daolu';
  const primary = primaryDaolu();
  if (n.id === leadId() && (!primary || primary.id === n.id)) {
    n.spouseRole = 'primary';
    s.flags.primaryDaolu = n.id;
  } else {
    n.spouseRole = 'concubine';
  }
  s.flags.daolu_bonus = true;
  return n;
}

export function daoluTitle(n: NPC): string {
  return isPrimaryDaolu(n) ? 'Chính thất' : 'Thiếp thất';
}
