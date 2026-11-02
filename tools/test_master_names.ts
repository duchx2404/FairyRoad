export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { newLife, rollFate } = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const { elderRoster, baiSu, isMyMaster } = await import('../src/engine/sectx');
const { maintainLegacyHolders } = await import('../src/engine/legacy-holders');
const { ensureWorldNames } = await import('../src/engine/names');
const { tcPeople } = await import('../src/engine/tienco');
const { splitName } = await import('../src/data/core');
const { SECTS } = await import('../src/data/world');

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

newLife({ name: 'Kiểm Chứng', g: 'm', origin: 'mucdong', fate: rollFate(false, 'm'), perks: [] });
const s = ST.s;

console.log('--- TEST 1: Unique given names in Tiệt Giáo elder roster ---');
// Set up player in Tiệt Giáo
s.world = 0;
const jieSect = Object.values(SECTS).find(sec => sec.n.startsWith('Tiệt Giáo'))!;
assert(!!jieSect, 'Found Tiệt Giáo sect');
s.sect = { id: jieSect.id, rank: 1, contrib: 100 } as any;

tcPeople();
maintainLegacyHolders(s.flags.tienco!.people);

const ph = s.flags.tienco!.people.find(p => p.legacyRole === 'jie:Giáo chủ Tiệt Giáo');
console.log('ph in main:', ph?.id, ph?.world, ph?.name, ph?.alive, ph?.legacyRole);

const elders = elderRoster();
console.log(`Elders count: ${elders.length}`);
const givenNames = new Set<string>();
for (const e of elders) {
  const { sur, given } = splitName(e.name);
  console.log(`Elder: ${e.name.padEnd(20)} (Họ: "${sur}", Tên riêng: "${given}") - ${e.seat}`);
  assert(!givenNames.has(given.toLowerCase()), `Duplicate given name found: "${given}" in "${e.name}"!`);
  givenNames.add(given.toLowerCase());
}
console.log('=> SUCCESS: All elders have completely unique given names (no Thông Vô Kỵ + Đa Vô Kỵ collision)!');

console.log('\n--- TEST 2: Master name consistency on baiSu ---');
const gchu = elders.find(e => e.role === 'chu')!;
assert(!!gchu, 'Found Giáo chủ');
console.log(`Bái sư Giáo chủ: ${gchu.name}`);

const gchuNameBefore = gchu.name;
s.flags.holyScion = s.sect.id;
s.npcs.push({ id: 'kin-test', name: 'Lão Tổ', alive: true, tag: 'kin', how: 'Thái thượng trưởng lão', g: 'm', r: 7, st: 3, sect: s.sect.id, rel: 100, age: 500, el: 'loi' } as any);
let res = baiSu(gchu);
console.log('baiSu result:', res.text);

const masterNpcBefore = s.npcs.find(n => n.alive && n.tag === 'master')!;
const pHolder = s.flags.tienco!.people.find(p => p.legacyRole === 'jie:Giáo chủ Tiệt Giáo');
console.log('Master NPC before ensureWorldNames:', masterNpcBefore?.id, masterNpcBefore?.name);
console.log('pHolder:', pHolder?.id, pHolder?.name, 'pHolder.npc:', pHolder?.npc);

// Run ensureWorldNames
ensureWorldNames();

const masterNpc = s.npcs.find(n => n.alive && n.tag === 'master')!;
assert(!!masterNpc, 'Master NPC exists in s.npcs');
console.log(`Master NPC name: "${masterNpc.name}"`);
assert(masterNpc.name === gchuNameBefore, `Master NPC name "${masterNpc.name}" must equal Giáo chủ name "${gchuNameBefore}"!`);

// Re-fetch elders
const eldersAfter = elderRoster();
const gchuAfter = eldersAfter.find(e => e.role === 'chu')!;
console.log(`Giáo chủ name in roster after: "${gchuAfter.name}"`);
assert(gchuAfter.name === masterNpc.name, `Giáo chủ roster name "${gchuAfter.name}" must match master NPC "${masterNpc.name}"`);

assert(isMyMaster(gchuAfter), 'isMyMaster(gchuAfter) must be TRUE');
console.log('=> SUCCESS: Master name is unified and consistent across all systems!');

console.log('\n--- TEST 3: Existing save reconciliation (Thông Thiếu Khanh -> Thông Vô Kỵ) ---');
// Simulate an existing save where master NPC was renamed to "Thông Thiếu Khanh"
masterNpc.name = 'Thông Thiếu Khanh';
// Now run maintainLegacyHolders again to simulate save load / yearly tick
tcPeople();
maintainLegacyHolders(s.flags.tienco!.people);
console.log(`After reconciliation, master NPC name: "${masterNpc.name}"`);
assert(masterNpc.name === gchuNameBefore, `Master NPC name should be reconciled to "${gchuNameBefore}", got "${masterNpc.name}"`);
assert(isMyMaster(gchuAfter), 'isMyMaster must still be true after reconciliation');
console.log('=> SUCCESS: Existing save reconciliation works perfectly!');

console.log('\nALL TESTS PASSED SUCCESSFULLY!');
