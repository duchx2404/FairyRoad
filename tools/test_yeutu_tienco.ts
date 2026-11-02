(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { s } from '../src/engine/state';
import { newLife, rollFate } from '../src/engine/life';
import { board, tcPeople, tc, tkAgeMax } from '../src/engine/tienco';
import { npcTick } from '../src/engine/npctick';
import { REALMS } from '../src/data/core';
import { isBeastRow, eqAge, compareRankPower } from '../src/engine/ranking-power';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

async function run() {
  console.log('--- Testing Yêu Tu Thiên Kiêu Bảng & Cultivation Rate ---');
  const fate = rollFate(false, 'm');
  newLife({ name: 'Kiểm Chứng', g: 'm', origin: 'mucdong', fate, perks: [] });

  // 1. Check tkAgeMax for Thương Lan (w=0)
  assert(tkAgeMax(0, false) === 100, 'Human tkAgeMax(0) === 100');
  assert(tkAgeMax(0, true) === 400, 'Beast tkAgeMax(0) === 400');

  // 2. Generate Thiên Kiêu Bảng
  const tkRows = board('tk', 0);
  assert(tkRows.length > 0, 'Thiên Kiêu Bảng has rows');

  // Verify ages of humans vs beasts
  let foundBeast = false;
  let foundBeastOver100 = false;
  for (const r of tkRows) {
    const isBeast = isBeastRow(r);
    if (isBeast) {
      foundBeast = true;
      assert(r.age <= 400, `Beast ${r.name} age ${r.age} <= 400`);
      if (r.age > 100) foundBeastOver100 = true;
    } else {
      assert(r.age <= 100, `Human ${r.name} age ${r.age} <= 100`);
    }
  }
  console.log(`Found beast: ${foundBeast}, found beast over 100: ${foundBeastOver100}`);
  assert(foundBeast, 'Thiên Kiêu Bảng contains beasts');

  // 3. Test equivalent age and tie breaker
  const humanRow: any = { id: 'h1', name: 'Human', r: 3, st: 1, power: 1000, age: 30, soul: 30 };
  const beastRow: any = { id: 'b1', name: 'Beast', r: 3, st: 1, power: 1000, age: 100, soul: 100, person: { beast: 'Cửu Vĩ Hồ' } };
  assert(eqAge(humanRow) === 30, 'Human eqAge is 30');
  assert(eqAge(beastRow) === 25, 'Beast 100yo eqAge is 25');
  // Since power is tied, younger eqAge (beast 25 < human 30) should be ranked higher (negative compareRankPower)
  assert(compareRankPower(beastRow, humanRow) < 0, 'Beast with lower eqAge ranks ahead of human with higher eqAge when power is equal');

  // 4. Test npcTick cultivation rate for Beast vs Human
  const hNpc: any = {
    id: 'h_test', name: 'Nhân Tộc', r: 1, st: 0, p: 0, born: s.year - 20, talent: 2.0, life: REALMS[1].life, alive: true
  };
  const bNpc: any = {
    id: 'b_test', name: 'Yêu Tộc', r: 1, st: 0, p: 0, born: s.year - 20, talent: 2.0, life: REALMS[1].life * 4, alive: true, beast: 'Bạch Hổ'
  };

  npcTick(hNpc, 1);
  npcTick(bNpc, 1);

  console.log(`After 1 year: Human progress = ${hNpc.p.toFixed(3)}, Beast progress = ${bNpc.p.toFixed(3)}`);
  assert(Math.abs(hNpc.p - bNpc.p * 4) < 0.01, 'Human advances cultivation ~4x faster than Beast in 1 year');

  console.log('All unit tests passed successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
