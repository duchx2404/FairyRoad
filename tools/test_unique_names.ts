export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { CELESTIAL, celestialOffices } = await import('../src/data/celestial');
const { nameKey } = await import('../src/core/names');
const { ensureWorldNames } = await import('../src/engine/names');
const { MALE, SURN, LAST_WORLD } = await import('../src/data/core');
const ST = await import('../src/engine/state');
const life = await import('../src/engine/life');
const tc = await import('../src/engine/tienco');
const { mkNpc, addNpc } = await import('../src/engine/core');
const { masterBoard } = await import('../src/engine/bang');
function check(value: unknown, message: string) { if (!value) throw new Error(message); }
check(!MALE.includes('Bách Lý') && SURN.includes('Bách Lý'), 'Bách Lý is only a surname');
const offices = Array.from({ length: LAST_WORLD }, (_, w) => Object.keys(CELESTIAL).flatMap(id => celestialOffices(id as keyof typeof CELESTIAL, w))).flat();
check(new Set(offices.map(o => nameKey(o.name))).size === offices.length, 'office holders have globally unique names across every realm');
life.newLife({ name: 'Test', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
const T = tc.tc();
const p = tc.recruitPerson(0), q = tc.recruitPerson(0), remote = tc.recruitPerson(1);
p.name = q.name = remote.name = 'Dương Thanh Huyền';
ensureWorldNames();
check(p.name !== q.name && remote.name === p.name, 'same-world duplicates repaired; cross-world names allowed');
const n = mkNpc({ name: p.name });
tc.linkNpc(p, n); addNpc(n);
check(p.name === n.name, 'linked records keep same identity');
const stranger = addNpc(mkNpc({ name: p.name }));
check(stranger.name !== p.name, 'new unlinked NPC cannot reuse existing name');
const snapshots = T.people.map(p => p.name);
ensureWorldNames();
check(JSON.stringify(snapshots) === JSON.stringify(T.people.map(p => p.name)), 'renaming is stable');
q.name = remote.name; q.world = 1;
ensureWorldNames(); check(q.name !== remote.name, 'arrival in another world resolves collisions');
for (let w = 0; w <= LAST_WORLD; w++) {
  ST.s.world = w;
  for (const get of [() => tc.board('tk'), () => tc.board('cg'), ...(['alch', 'forge', 'talis'] as const).map(k => () => masterBoard(k))]) {
    const rows = get();
    check(rows.length === 100 && new Set(rows.map(r => nameKey(r.name))).size === rows.length, `world ${w}: top 100 contains distinct names`);
  }
  const residents = tc.worldResidents(w).map(({ person, npc }) => (npc ?? person)!.name);
  check(new Set(residents.map(nameKey)).size === residents.length, `world ${w}: all residents have distinct names`);
}
console.log('PASS: diverse name pools, globally unique celestial names, world-wide uniqueness, linked identities, migration and all five rankings');
