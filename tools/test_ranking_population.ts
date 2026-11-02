export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { s } = await import('../src/engine/state');
await import('../src/engine/wire');
await import('../src/data/worlds');
const life = await import('../src/engine/life');
const tc = await import('../src/engine/tienco');
const { masterBoard } = await import('../src/engine/bang');
const { LAST_WORLD } = await import('../src/data/core');
life.newLife({ name: 'Test', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
const state = (await import('../src/engine/state')).s;
function check(value: boolean, message: string) { if (!value) throw new Error(message); }
for (let w = 0; w <= LAST_WORLD; w++) {
  state.world = w;
  const boards = [() => tc.board('tk'), () => tc.board('cg'), ...(['alch', 'forge', 'talis'] as const).map(k => () => masterBoard(k))];
  for (const get of boards) {
    check(get().length === 100, `world ${w}: initial size`);
    const count = tc.tcPeople().length;
    const names = get().map(r => r.name).join('|');
    check(tc.tcPeople().length === count && get().map(r => r.name).join('|') === names, 'reopening must be stable');
  }
  for (const p of tc.tcPeople()) if (p.world === w && !p.chief && !p.lord) p.alive = false;
  for (const get of boards) check(get().length === 100, `world ${w}: refill deaths`);
  state.year += 60000;
  tc.tiencoTick(60000);
  for (const get of boards) check(get().length === 100 && get().every((r,i) => r.rank === i+1), `world ${w}: long-term refill`);
}
console.log('PASS: five boards stay at 100 across all worlds, deaths and long time skips');
