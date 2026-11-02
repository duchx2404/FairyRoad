export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { beastEvolution } = await import('../src/engine/beast-evolution');
const { LAST_WORLD, npcCap } = await import('../src/data/core');
const life = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const tc = await import('../src/engine/tienco');
const { masterBoard } = await import('../src/engine/bang');
const { mkNpc } = await import('../src/engine/core');
function check(value: unknown, label: string) { if (!value) throw new Error(label); }
check(!beastEvolution('Chân Long', 0, npcCap(0), 3), 'no primordial dragon in lower worlds');
check(!beastEvolution('Chân Long', LAST_WORLD, npcCap(LAST_WORLD), 2), 'requires completed realm');
for (const [species, ancestor] of [['Chân Long', 'Tổ Long'], ['Phượng Hoàng', 'Chân Phượng'], ['Kỳ Lân', 'Thủy Kỳ Lân'], ['Huyền Quy', 'Huyền Vũ']]) {
  check(beastEvolution(species, LAST_WORLD, npcCap(LAST_WORLD), 3)?.beast === ancestor, `${species} evolves into ${ancestor}`);
}
const first = beastEvolution('Hải Giao', 0, 5, 3)!;
check(first.beast === 'Giao Long', 'one step along ancestry');
check(!beastEvolution(first.beast, 0, 5, 3, first.evolution), 'no repeated evolution at same milestone');
life.newLife({ name: 'Evolution', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
ST.s.world = LAST_WORLD;
const p = tc.recruitPerson(LAST_WORLD);
Object.assign(p, { beast: 'Chân Long', r: npcCap(LAST_WORLD), st: 3, craft: { kind: 'alch', lv: 8 }, blood: 'mang huyết mạch không thuần của Tổ Long', sect: 'Tán tu' });
const n = mkNpc({ name: p.name }); n.r = p.r; n.st = p.st; ST.s.npcs.push(n); tc.linkNpc(p, n);
tc.tc();
check(p.beast === 'Tổ Long' && n.beast === 'Tổ Long', 'linked character evolves and synchronizes');
check(masterBoard('alch').some(row => row.id === p.id && row.beast === 'Tổ Long'), 'ranking displays actual ancestral species');
tc.tc(); tc.board('cg');
check(p.beast === 'Tổ Long', 'migration and reopening never demote evolved ancestor');
ST.s.beast = 'Phượng Hoàng'; ST.s.r = npcCap(LAST_WORLD); ST.s.st = 3;
tc.tc();
check(ST.s.beast === 'Chân Phượng', 'same evolution rules apply to player');
console.log('PASS: ancestral evolution, realm restrictions, persistence, linked NPCs, player and ranking');
