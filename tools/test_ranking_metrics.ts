export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const ST = await import('../src/engine/state');
const life = await import('../src/engine/life');
const tc = await import('../src/engine/tienco');
const { masterBoard } = await import('../src/engine/bang');
const { rankingPower, compareRankPower } = await import('../src/engine/ranking-power');
const { craftProficiency, trainArtisan, xpNeed } = await import('../src/engine/craft-proficiency');
const { gainXp, XP_K } = await import('../src/engine/craft');
const { mkNpc } = await import('../src/engine/core');
function check(value: unknown, message: string) { if (!value) throw new Error(message); }
life.newLife({ name: 'Metrics', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
const row = { id: 'same', name: 'Test', g: 'm' as const, r: 5, st: 3, age: 50, soul: 50, note: '', rank: 0 };
const old = { ...row, id: 'old', age: 80, power: 123 };
const young = { ...row, id: 'young', age: 20, power: 123 };
check(compareRankPower(young, old) < 0, 'equal power prefers younger age');
check(compareRankPower({ ...old, power: 124 }, young) < 0, 'power takes precedence over age');
const n = mkNpc({ r: 5, st: 3 });
n.kit = { gear: [], tech: null, known: [] };
const before = rankingPower({ ...row, npc: n }, 0);
n.kit.gear.push({ atk: 1e6, def: 1e6, hp: 1e6 } as any);
check(rankingPower({ ...row, npc: n }, 0) > before, 'equipment contributes to aggregate strength');
check(rankingPower({ ...row, celestialTier: 0 }, 0) > rankingPower(row, 0), 'celestial leaders have stronger estimated loadouts, not a ranking override');
for (const kind of ['tk', 'cg'] as const) {
  const rows = tc.board(kind);
  check(rows.length === 100 && rows.every((r,i) => !i || compareRankPower(rows[i-1], r) <= 0), `${kind}: aggregate strength sorting`);
  check(rows.every(r => (r.power ?? 0) > 0), `${kind}: strength displayed for every entry`);
}
for (const k of ['alch', 'forge', 'talis'] as const) {
  ST.s.craft[k] = 7; ST.s.craft[XP_K[k]] = xpNeed(7) - 1;
  const total = craftProficiency(7, ST.s.craft[XP_K[k]]);
  gainXp(k, 2);
  check(ST.s.craft[k] === 8 && craftProficiency(8, ST.s.craft[XP_K[k]]) === total + 2, `${k}: cumulative proficiency survives promotion`);
  gainXp(k, 1e9);
  check(ST.s.craft[k] === 8 && ST.s.craft[XP_K[k]] > 1e9, `${k}: no cap after final rank`);
  const rows = masterBoard(k);
  check(rows[0].mine && rows.every((r,i) => !i || rows[i-1].proficiency >= r.proficiency), `${k}: mastery can surpass celestial masters`);
}
const skill = { kind: 'alch' as const, lv: 8, xp: 10000, trainedAt: 100 };
const proficiency = trainArtisan(skill, 110, 2);
check(skill.xp === 10080 && skill.lv === 8, 'NPC masters keep training at maximum rank');
check(trainArtisan(skill, 110, 2) === proficiency, 'reopening does not grant extra proficiency');
console.log('PASS: aggregate strength, younger tie-break, equipment, five ranking metrics and uncapped mastery');
