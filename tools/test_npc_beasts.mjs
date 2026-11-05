import assert from 'node:assert/strict';
import { createServer } from 'vite';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { CHANLINH, canRideBeast } = await server.ssrLoadModule('/src/data/spirit.ts');
  const { NPC_BEASTS, beastsOfNpc, ensureNpcBeasts } = await server.ssrLoadModule('/src/data/npc-beasts.ts');
  const { getSpeciesLineagePath, getBeastWorldReq } = await server.ssrLoadModule('/src/data/beast-lineage.ts');
  const { npcCap } = await server.ssrLoadModule('/src/data/core.ts');
  const { BEAST_SECTS, beastDoctrine } = await server.ssrLoadModule('/src/data/beast-sects.ts');
  await server.ssrLoadModule('/src/data/worlds.ts');
  const { worldPack } = await server.ssrLoadModule('/src/data/world.ts');
  const state = await server.ssrLoadModule('/src/engine/state.ts');
  await server.ssrLoadModule('/src/engine/wire.ts');
  const { newLife, rollFate } = await server.ssrLoadModule('/src/engine/life.ts');
  const { Battle, mkFoe, mkRng } = await server.ssrLoadModule('/src/engine/combat.ts');
  const { mountYears, mkNpc, addNpc } = await server.ssrLoadModule('/src/engine/core.ts');
  const { setLinhSize } = await server.ssrLoadModule('/src/engine/beast-companion.ts');
  const { toggleLinhRide } = await server.ssrLoadModule('/src/engine/items.ts');
  const { rankingPower } = await server.ssrLoadModule('/src/engine/ranking-power.ts');
  newLife({ name: 'Test', g: 'm', origin: 'mucdong', fate: rollFate(false, 'm'), perks: [] });
  const s = state.s;
  for (const id of ['bantychu', 'bachnhanngocong', 'tybadochac', 'hoangphongdieuthu']) {
    assert.equal(canRideBeast(CHANLINH[id], 2), false);
    assert.equal(canRideBeast(CHANLINH[id], 3), true);
    s.flags.chanlinh = { id, name: 'Tên riêng', r: 2, bond: 50, st: 0 };
    assert.equal(mountYears(1), 1);
    toggleLinhRide(9, 0);
    assert.ok(!s.flags.chanlinh.ride);
    setLinhSize('large');
    assert.ok(!s.flags.chanlinh.bodySize);
    s.flags.chanlinh.r = 3;
    assert.equal(mountYears(1), 1 / 3);
    assert.equal(s.flags.chanlinh.bodySize, 'large');
    setLinhSize('small');
    assert.equal(s.flags.chanlinh.bodySize, 'small');
  }
  for (const pet of NPC_BEASTS) {
    assert.notEqual(pet.name, pet.species);
    assert.ok(getSpeciesLineagePath(pet.species).length, pet.species);
    const battle = new Battle({ name: pet.owner, r: 5, kind: 'cultivator' }, {}, 42);
    assert.equal(battle.foes.filter(f => f.beastId === pet.id).length, 1);
  }
  assert.equal(beastsOfNpc('Nhị Lang Thần')[0].owner, 'Dương Tiễn');
  for (const doctrine of BEAST_SECTS) {
    const school = Object.values(worldPack(doctrine.world).sects).find(sc => sc.n === doctrine.name);
    assert.ok(school, doctrine.name + ' is a real map faction');
    assert.equal(beastDoctrine(school.id), doctrine, 'faction ID and display name resolve identically');
    const master = { id: `tamer-${doctrine.world}`, name: `Ngự thú sư ${doctrine.world}`, r: 5, world: doctrine.world, sect: school.id, beasts: [] };
    const pets = ensureNpcBeasts(master);
    assert.equal(pets.length, doctrine.count, 'old empty saves receive guaranteed bonded beasts');
    assert.equal(new Set(pets.map(p => p.name)).size, pets.length);
    if (doctrine.family) assert.ok(pets.every(p => doctrine.family.test(p.species)), 'specialist school breeds its own families');
    const battle = new Battle({ name: master.name, sect: school.id, beasts: pets, r: 5, st: 0, kind: 'cultivator' }, {}, 42);
    assert.equal(battle.foes.length, doctrine.count);
    assert.ok(battle.foes.every(p => p.r === battle.foe.r));
    assert.ok(battle.foes.reduce((sum, p) => sum + p.atk, 0) > battle.foe.atk * 2, 'beasts provide most attack strength');
    const boss = new Battle({ name: 'Trưởng lão hộ tông', sect: school.id, r: 5, st: 0, kind: 'boss' }, {}, 42);
    assert.equal(boss.foes.length, doctrine.count, 'sect war elders also deploy bonded beasts');
    const resident = addNpc(mkNpc({ name: master.name, sect: school.id, r: 5, st: 0 }));
    s.flags.party = { active: [resident.id], reserve: [] };
    s.flags.chanlinh = null;
    const allyBattle = new Battle({ name: 'Đối thủ', r: 5, kind: 'cultivator' }, {}, 42);
    assert.equal(allyBattle.allies.filter(p => p.ownerId === resident.id).length, doctrine.count, 'allied tamers deploy their full pack');
    const row = { id: resident.id, npc: resident, r: 5, st: 0 };
    const fullPower = rankingPower(row, doctrine.world);
    resident.beastStatus = Object.fromEntries(resident.beasts.map(p => [p.id, { dead: true }]));
    assert.ok(rankingPower(row, doctrine.world) < fullPower, 'ranking includes living beasts');
    assert.equal(ensureNpcBeasts(resident).length, doctrine.count, 'dead beasts are not replaced on reload');
    const withoutPets = new Battle({ name: resident.name, npcId: resident.id, r: 5, kind: 'cultivator' }, {}, 42);
    assert.equal(withoutPets.foes.length, 0, 'dead pack cannot respawn');
  }
  s.flags.party = { active: [], reserve: [] };
  assert.ok(NPC_BEASTS.length > 2);
  const counts = [];
  for (let world = 0; world < 6; world++) {
    let count = 0;
    for (let i = 0; i < 100; i++) {
      const resident = { id: `resident-${world}-${i}`, name: `Đạo hữu ${i}`, r: npcCap(world), world, sect: 'Tán tu' };
      const pets = ensureNpcBeasts(resident);
      if (pets.length) count++;
      const before = JSON.stringify(pets);
      resident.name = 'Đổi tên';
      assert.equal(JSON.stringify(ensureNpcBeasts(resident)), before, 'rename must not reroll pet');
      const restored = JSON.parse(JSON.stringify(resident));
      assert.deepEqual(ensureNpcBeasts(restored), pets, 'save/load retains pets');
      for (const pet of pets) {
        assert.notEqual(pet.name, pet.species);
        assert.ok(getSpeciesLineagePath(pet.species).length);
        const req = getBeastWorldReq(pet.species);
        assert.ok(req.minWorld <= world && req.minRealm <= resident.r - 1);
      }
    }
    assert.ok(count > 0 && count < 100, `world ${world} should have some, not all, pet owners`);
    counts.push(count);
  }
  let normal = 0, tamers = 0;
  for (let i = 0; i < 100; i++) {
    const base = { id: `sect-test-${i}`, name: `Tu sĩ ${i}`, r: 5 };
    normal += ensureNpcBeasts({ ...base, sect: 'Tán tu' }).length;
    tamers += ensureNpcBeasts({ ...base, sect: 'ngulinh' }).length;
  }
  assert.ok(tamers > normal);
  assert.equal(ensureNpcBeasts({ id: 'mortal', name: 'Phàm nhân', r: 0 }).length, 0);
  console.log('Pet owners per 100 ordinary residents across six worlds:', counts.join(', '));
  const { tcPeople, linkNpc } = await server.ssrLoadModule('/src/engine/tienco.ts');
  const residents = tcPeople();
  const worldCounts = Array.from({ length: 6 }, (_, w) => residents.filter(p => p.world === w && p.beasts?.length).length);
  assert.ok(worldCounts.every(n => n > 0), 'actual world populations all include pet owners');
  const keeper = residents.find(p => !p.chief && p.beasts?.length);
  assert.ok(keeper);
  const linked = addNpc(mkNpc({ name: keeper.name, r: keeper.r }));
  linkNpc(keeper, linked);
  assert.equal(linked.beasts, keeper.beasts);
  assert.equal(linked.beastStatus, keeper.beastStatus);
  s.flags.party = { active: [linked.id], reserve: [] };
  const linkedBattle = new Battle({ name: 'Đối thủ', r: 4, kind: 'cultivator' }, {}, 42);
  assert.ok(linkedBattle.allies.some(f => f.ownerId === linked.id && f.beastId === keeper.beasts[0].id));
  const enemyBattle = new Battle({ name: keeper.name, npcId: linked.id, r: keeper.r, kind: 'cultivator' }, {}, 42);
  assert.ok(enemyBattle.foes.some(f => f.beastId === keeper.beasts[0].id));
  keeper.beastStatus[keeper.beasts[0].id] = { dead: true };
  const afterDeath = new Battle({ name: keeper.name, npcId: linked.id, r: keeper.r, kind: 'cultivator' }, {}, 42);
  assert.ok(!afterDeath.foes.some(f => f.beastId === keeper.beasts[0].id));
  console.log('Pet owners in actual six-world populations:', worldCounts.join(', '));
  s.flags.chanlinh = null;
  const owner = addNpc(mkNpc({ name: 'Dương Tiễn', r: 5 }));
  s.flags.party = { active: [owner.id], reserve: [] };
  const foe = mkFoe({ name: 'Test foe', r: 4 }, mkRng(1));
  let battle = new Battle(foe, {}, 42);
  assert.ok(battle.allies.some(f => f.ownerId === owner.id && f.species === 'Thần Khuyển'));
  owner.beastStatus = { 'hao-thien-khuyen': { dead: true } };
  battle = new Battle(foe, {}, 42);
  assert.ok(!battle.allies.some(f => f.ownerId === owner.id));
  s.flags.party.active = [];
  battle = new Battle(foe, {}, 42);
  assert.ok(!battle.allies.some(f => f.beastId));
  console.log('PASS: mount realm gate, resize, lineage, owner aliases, allied/enemy pets, dead pets and reserves');
} finally {
  await server.close();
}
