export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { CELESTIAL, celestialOffices } = await import('../src/data/celestial');
const { LAST_WORLD, splitName } = await import('../src/data/core');
const { worldPack } = await import('../src/data/world');
const tc = await import('../src/engine/tienco');
const { masterBoard, forceBoard } = await import('../src/engine/bang');
const life = await import('../src/engine/life');
const ST = await import('../src/engine/state');
function check(value: unknown, message: string) { if (!value) throw new Error(message); }
for (const id of Object.keys(CELESTIAL) as (keyof typeof CELESTIAL)[]) {
  const canonical = celestialOffices(id, 4);
  check(canonical.every(o => o.name === o.holder), `${id}: Hồng Hoang keeps canonical names`);
  for (let w = 0; w < 4; w++) {
    const offices = celestialOffices(id, w);
    check(offices.every(o => o.name !== o.holder && o.name !== o.daoHao), `${id}/${w}: names differ from canonical names and Dao titles`);
    check(offices.every(o => splitName(o.name).sur === (o.holder === 'Lão Tử' || o.holder === 'Na Tra' ? 'Lý' : splitName(o.holder).sur)), `${id}/${w}: surnames preserved`);
    check(JSON.stringify(offices) === JSON.stringify(celestialOffices(id, w)), 'identity stable');
  }
  check(!celestialOffices(id, LAST_WORLD).length, `${id}: no offices in Chaos`);
}
const erlang = celestialOffices('thiendinh', 0).find(o => o.title === 'Nhị Lang Hiển Thánh Chân Quân')!;
check(erlang.name.startsWith('Dương ') && erlang.name !== 'Dương Tiễn' && erlang.daoHao, 'Erlang has a Dương personal name and separate Dao title');
check(!worldPack(LAST_WORLD).locs.some(l => l.gate), 'Chaos has no gates');
life.newLife({ name: 'Identity', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
ST.s.world = LAST_WORLD;
check(!tc.tcPeople().some(p => p.world === LAST_WORLD && Object.values(CELESTIAL).some(r => r.n === p.sect)), 'no celestial youths in Chaos');
const legacy = tc.recruitPerson(LAST_WORLD); legacy.sect = CELESTIAL.thiendinh.n;
tc.tc(); check(legacy.sect === 'Tán tu', 'legacy celestial affiliation corrected');
check(!tc.board('cg').some(r => r.id.startsWith('cel:')), 'no celestial strength entries in Chaos');
for (const k of ['alch', 'forge', 'talis'] as const) check(!masterBoard(k).some(r => r.id?.startsWith('cel:')), 'no celestial crafts in Chaos');
check(!forceBoard().some(r => r.kind === 'celestial'), 'no celestial forces in Chaos');
console.log('PASS: personal names, surnames, Dao titles, canonical Hồng Hoang and no celestial realms in Chaos');
