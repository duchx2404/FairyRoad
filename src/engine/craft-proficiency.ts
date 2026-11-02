export const xpNeed = (lv: number) => Math.round(6 * lv * lv + 4);
export interface ArtisanCraft { kind: 'alch' | 'forge' | 'talis'; lv: number; xp?: number; trainedAt?: number }
/** Lifetime proficiency includes experience already spent on advancing ranks. */
export function craftProficiency(lv: number, xp = 0): number {
  let total = xp;
  for (let i = 1; i < Math.min(8, lv); i++) total += xpNeed(i);
  return total;
}
export function trainArtisan(craft: ArtisanCraft, year: number, talent = 1): number {
  craft.xp ??= 0;
  craft.trainedAt ??= year;
  const elapsed = Math.max(0, year - craft.trainedAt);
  craft.xp += elapsed * Math.max(0.2, talent) * 4;
  craft.trainedAt = Math.max(craft.trainedAt, year);
  while (craft.lv < 8 && craft.xp >= xpNeed(craft.lv)) {
    craft.xp -= xpNeed(craft.lv);
    craft.lv++;
  }
  return craftProficiency(craft.lv, craft.xp);
}
