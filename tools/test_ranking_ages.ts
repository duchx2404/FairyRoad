export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const life = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const tc = await import('../src/engine/tienco');
const { masterBoard } = await import('../src/engine/bang');
function check(value: unknown, message: string) { if (!value) throw new Error(message); }
life.newLife({ name: 'Age test', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
for (const young of [false, true]) for (let i = 0; i < 40; i++) {
  const p = tc.recruitPerson(0, young);
  const age = ST.s.year - p.born;
  check(age + 1e-6 >= 10 + tc.cultivationYears(p.r, p.st, p.talent), 'realm supported by cultivation time');
  if (age < 30) check(p.r < 9, 'twenty-year-old recruits cannot be at Độ Kiếp');
}
for (const k of ['alch', 'forge', 'talis'] as const) masterBoard(k);
const tk = tc.board('tk');
check(tk.length === 100 && tk.every(row => row.age <= 100), 'youth leaderboard remains full and age-limited');
check(!tk.some(row => row.age < 30 && row.r >= 9 && !row.mine), 'craft recruitment does not contaminate youth board with young high realms');
tc.board('cg');
const births = { ...ST.s.flags.celestialBirths } as Record<string, number>;
check(new Set(Object.values(births)).size > 20, 'celestial birth dates are varied');
const prior = tc.board('cg').filter(row => row.id.startsWith('cel:'));
ST.s.year += 10;
const later = tc.board('cg');
for (const row of prior) {
  const current = later.find(other => other.id === row.id);
  if (current) check(current.age === row.age + 10, 'celestial age advances with time');
}
check(Object.entries(births).every(([key, born]) => ST.s.flags.celestialBirths[key] === born), 'opening board preserves birth dates');
const legacy = tc.recruitPerson(0);
Object.assign(legacy, { born: ST.s.year - 25, soulBorn: ST.s.year - 25, r: 9, st: 3, asc: 0 });
delete ST.s.flags.tcRecruitAgeFixed;
tc.tc();
check(ST.s.year - legacy.born > 100 && legacy.r === 9, 'legacy bad age corrected without reducing realm');
const born = legacy.born;
tc.tc(); check(legacy.born === born, 'migration only applies once');
console.log('PASS: cultivation-consistent recruits, youth eligibility, varied persistent celestial ages and legacy repair');
