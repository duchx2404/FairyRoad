export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { newLife, rollFate } = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const { WORLD } = await import('../src/data/core');
const { worldPack, applyWorld, SECTS, LOCS } = await import('../src/data/world');
const { DECLINING_SCHOOLS, branchId, legacyRoleKey } = await import('../src/data/declining-schools');
const { tcPeople, recruitPerson } = await import('../src/engine/tienco');
const { treasureBoard, toolBoard } = await import('../src/engine/bang');
const { LEGENDARY_TREASURES, TREASURE_TIERS, treasureManifest, worldTreasureCap, worldArtCap } = await import('../src/data/treasure-grades');
const { TECHS, SKILLS, PILLS, TALIS, pillGiai, mkGear } = await import('../src/data/items');
const { localItemId } = await import('../src/data/local-items');
const { normalizeWorldItems } = await import('../src/engine/world-items');
const { addItem } = await import('../src/engine/char');
const { talisRec } = await import('../src/engine/craft');
const { stock, lots } = await import('../src/engine/trade');
const { sectWares } = await import('../src/engine/sect');
function check(x: unknown, message: string): asserts x { if (!x) throw new Error(message); }
newLife({ name: 'Kiểm Chứng', g: 'm', origin: 'mucdong', fate: rollFate(false, 'm'), perks: [] });
const state = ST.s;
const expected = ['Hậu Thiên Linh Bảo', 'Tiên Thiên Linh Bảo', 'Hậu Thiên Chí Bảo', 'Tiên Thiên Chí Bảo', 'Hỗn Độn Linh Bảo', 'Hỗn Độn Chí Bảo'];
for (let w = 1; w <= 5; w++) { check(worldTreasureCap(w) > worldTreasureCap(w - 1), 'treasure ceiling rises in each world'); check(worldArtCap(w) > worldArtCap(w - 1), 'art/pill/talisman ceiling rises in each world'); }
check(JSON.stringify(TREASURE_TIERS.slice(7)) === JSON.stringify(expected), 'exact user-defined hierarchy');
for (let w = 0; w < 4; w++) {
  state.world = WORLD.lv = w; applyWorld(w);
  const people = tcPeople();
  for (const school of Object.keys(DECLINING_SCHOOLS) as (keyof typeof DECLINING_SCHOOLS)[]) {
    const sc = worldPack(w).sects[branchId(w, school)];
    check(sc && LOCS[sc.loc], `branch visible in world ${w}: ${school}`);
    check(TECHS[sc.tech].tier < 5, 'declining branch technique below divine');
    const members = people.filter(p => p.world === w && p.alive && p.sect === sc.n);
    check(members.length >= 1 && members.length <= 3, 'very few branch members');
    state.sect = { id: sc.id, rank: 6, contrib: 99999, joined: state.year, lastPay: state.year };
    for (const ware of sectWares()) {
      if (ware.gear) check(ware.gear.g <= 4, 'branch gear cap');
      if (ware.id.startsWith('cp:')) check(TECHS[ware.id.slice(3)].tier <= 4, 'branch book cap');
    }
  }
  for (let i = 0; i < 20; i++) recruitPerson(w);
  for (const school of Object.keys(DECLINING_SCHOOLS) as (keyof typeof DECLINING_SCHOOLS)[]) check(tcPeople().filter(p => p.world === w && p.alive && p.sect === DECLINING_SCHOOLS[school].name).length <= 3, 'rank refill cannot flood branches');
  const treasures = treasureBoard();
  check(treasures.every(t => t.grade <= worldTreasureCap(w)), 'treasure board world cap');
  for (const t of LEGENDARY_TREASURES) {
    const rows = treasures.filter(row => row.name === t.name + ' (mô phỏng)');
    check(rows.length === 1, 'one replica per world');
    const owner = tcPeople().find(p => p.world === w && p.alive && p.legacyRole === legacyRoleKey(t));
    check(owner && rows[0].holder === owner.name, 'replica held by corresponding office');
    const copy = treasureManifest(t, w);
    check(copy.grade < 5 && copy.functions.length < t.functions.length && copy.powerScale < 1, 'replica weaker with fewer functions');
  }
}
state.world = WORLD.lv = 0; applyWorld(0); state.sect = null;
const first = tcPeople().find(p => p.world === 0 && p.legacyRole === 'chan:Chấp chưởng Phong Thần')!;
first.alive = false;
const successor = tcPeople().find(p => p.world === 0 && p.alive && p.legacyRole === 'chan:Chấp chưởng Phong Thần');
check(successor && successor.id !== first.id && first.treasures?.length === 0, 'death transfers replica to successor');
successor.world = 1;
const afterAscension = tcPeople();
check(!successor.legacyRole && successor.treasures?.length === 0, 'ascending holder leaves replicas behind');
check(afterAscension.filter(p => p.world === 1 && p.alive && p.legacyRole === 'chan:Chấp chưởng Phong Thần').length === 1, 'ascending holder cannot duplicate office in destination');
check(toolBoard('alch').every(t => t.grade <= 4), 'craft tool board cap');
for (const t of LEGENDARY_TREASURES) {
  const owners = tcPeople().filter(p => p.world === 4 && p.alive && p.treasures?.includes(t.id));
  check(owners.length === 1 && owners[0].name === t.owner, 'canonical owner of original');
}
state.tech = 'cuuchuyen'; state.known = TECHS.cuuchuyen.skills.slice(); state.skills = state.known.slice(0, 4);
state.bag = [{ id: 'p:daithua', n: 2, g: 1 }];
state.recipes = ['daithua', 'nietbanphu'];
state.gearBag = [{ ...mkGear(3, 4), g: 6 }];
const originalPower = PILLS.daithua.v, beforeGear = state.gearBag[0].atk;
normalizeWorldItems();
check(TECHS[state.tech!].tier <= 4 && state.known.every(id => SKILLS[id].tier <= 4), 'old techniques and skills migrate');
const pill = PILLS[state.bag[0].id.slice(2)];
check(pillGiai(pill) <= 4 && pill.v < originalPower && state.bag[0].n === 2, 'old pills have real reduced potency, quantities preserved');
check(state.gearBag[0].g === 4 && state.gearBag[0].atk <= beforeGear, 'old gear stats and grade migrate');
const snapshot = JSON.stringify({ tech: state.tech, bag: state.bag, gear: state.gearBag, known: state.known });
normalizeWorldItems();
check(snapshot === JSON.stringify({ tech: state.tech, bag: state.bag, gear: state.gearBag, known: state.known }), 'migration idempotent');
const tl = localItemId('t:nietbanphu', 0).slice(2);
check(TALIS[tl].tier <= 4 && TALIS[tl].p <= 6 && talisRec(tl).length > 0, 'local talisman grade and recipe work');
addItem('p:daithua');
check(state.bag.every(b => !b.id.startsWith('p:') || pillGiai(PILLS[b.id.slice(2)]) <= 4), 'scripted pill rewards capped');
state.r = 8;
for (const place of Object.values(LOCS).filter(l => l.type === 'town' || l.type === 'market').slice(0, 12)) {
  state.loc = place.id;
  for (const row of [...stock(), ...lots()]) {
    if (row.id.startsWith('p:')) check(pillGiai(PILLS[row.id.slice(2)]) <= 4, 'shop/auction pills capped');
    if (row.gear) check(row.gear.g <= 4, 'shop/auction gear capped');
  }
}
console.log('PASS: four declining branches, stable role succession, canonical originals, weakened replicas, world caps, shops, rewards, recipe and save migration');
