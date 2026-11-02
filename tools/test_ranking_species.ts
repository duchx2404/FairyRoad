export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const life = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const tc = await import('../src/engine/tienco');
const { masterBoard } = await import('../src/engine/bang');
const { mkNpc } = await import('../src/engine/core');
const { LAST_WORLD, npcCap } = await import('../src/data/core');
function check(value: unknown, message: string) { if (!value) throw new Error(message); }
life.newLife({ name: 'Species test', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
ST.s.id = 'ranking-species-regression';
for (let w = 0; w <= LAST_WORLD; w++) {
  ST.s.world = w;
  const recruits = Array.from({ length: 150 }, () => tc.recruitPerson(w, true));
  check(recruits.some(p => p.beast), `world ${w}: recruits include beasts`);
  check(recruits.some(p => p.race), `world ${w}: recruits include other races`);
  for (const k of ['alch', 'forge', 'talis'] as const) {
    const beast = tc.recruitPerson(w, true);
    Object.assign(beast, { name: `Beast ${w} ${k}`, sect: 'Tán tu', beast: 'Bạch Hổ', craft: { kind: k, lv: 8 }, r: npcCap(w) + 1, st: 3, born: ST.s.year - 1 });
    const race = tc.recruitPerson(w, true);
    Object.assign(race, { name: `Race ${w} ${k}`, sect: 'Tán tu', race: 'Ma tộc', craft: { kind: k, lv: 8 }, r: npcCap(w) + 1, st: 3, born: ST.s.year - 1 });
    const npc = mkNpc({ name: `Known beast ${w} ${k}`, r: npcCap(w), st: 3, age: 1 });
    npc.r = npcCap(w) + 1;
    npc.beast = 'Cửu Vĩ Hồ'; npc.craft = { kind: k, lv: 8 }; ST.s.npcs.push(npc);
    for (const kind of ['tk', 'cg'] as const) {
      const rows = tc.board(kind);
      check(rows.some(r => r.id === beast.id) && rows.some(r => r.id === race.id) && rows.some(r => r.npc?.id === npc.id), `${kind}: includes all eligible species, known and unknown`);
    }
    let rows = masterBoard(k);
    check(rows.length === 100 && rows.some(r => r.id === beast.id && r.beast) && rows.some(r => r.id === race.id && r.race) && rows.some(r => r.id === 'npc:' + npc.id && r.beast), `${k}: includes all species from whole world`);
    check(rows.some(r => r.beast && r.note.includes('Yêu tu')), `${k}: species is visible`);
    tc.linkNpc(beast, npc);
    rows = masterBoard(k);
    check(rows.filter(r => r.name === npc.name).length === 1, `${k}: linked character appears once`);
    beast.world = (w + 1) % (LAST_WORLD + 1);
    check(!masterBoard(k).some(r => r.id === beast.id || r.id === 'npc:' + npc.id), `${k}: excludes other worlds, even with old NPC link`);
    beast.world = w; npc.alive = false;
    check(!masterBoard(k).some(r => r.id === beast.id), `${k}: linked death excluded`);
    check(masterBoard(k).length === 100, `${k}: refill after death`);
  }
  ST.s.npcs = [];
}
// Old saves filled with human-only recruits are repaired once, without new identities.
const T = tc.tc();
const old = Array.from({ length: 150 }, () => tc.recruitPerson(0));
for (const p of old) { delete p.beast; delete p.race; p.sect = 'Tán tu'; p.from = 'Đệ tử Tán tu'; }
delete T.recruitDiversity;
tc.tc();
check(old.some(p => p.beast), 'old saves gain beast recruits');
const snapshot = old.map(p => [p.id, p.name, p.beast, p.race]);
tc.tc();
check(JSON.stringify(snapshot) === JSON.stringify(old.map(p => [p.id, p.name, p.beast, p.race])) , 'migration is stable');
console.log('PASS: all five rankings include all eligible species across every world; links, deaths and save migration verified');
const dragon = tc.recruitPerson(0);
Object.assign(dragon, { beast: 'Tổ Long', sect: 'Tán tu', blood: 'mang huyết mạch không thuần của Tổ Long (một phần mười sáu)' });
const dragonNpc = mkNpc({ name: dragon.name });
ST.s.npcs.push(dragonNpc);
tc.linkNpc(dragon, dragonNpc);
const identity = dragon.id, name = dragon.name, blood = dragon.blood;
tc.tc();
check(['Hải Giao', 'Lôi Giao'].includes(dragon.beast!), 'diluted dragon has a concrete species');
check(dragonNpc.beast === dragon.beast, 'linked NPC species is repaired');
check(dragon.id === identity && dragon.name === name && dragon.blood === blood, 'repair preserves identity and ancestry');
const species = dragon.beast;
tc.tc();
check(dragon.beast === species, 'species stays stable on reopening');
for (let i = 0; i < 300; i++) {
  const p = tc.recruitPerson(0);
  check(!(p.beast === 'Tổ Long' && p.blood?.includes('không thuần')), 'new recruits never use Tổ Long for diluted species');
}
console.log('PASS: concrete beast species, ancestry, linked NPCs and old saves');
