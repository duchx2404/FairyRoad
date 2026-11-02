export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { newLife, rollFate } = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const { WORLD } = await import('../src/data/core');
const { worldPack, applyWorld, SECTS, LOCS, ISLANDS } = await import('../src/data/world');
const { DECLINING_SCHOOLS, SCHOOL_VUC, SCHOOL_SEAT, branchId, seatId, legacyRoleKey } = await import('../src/data/declining-schools');
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
const { elderRoster, baiBlock } = await import('../src/engine/sectx');
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
    const loc = LOCS[sc.loc], seat = LOCS[seatId(w, school)];
    check(sc && loc && seat && seat.n === SCHOOL_SEAT[school].n, `branch and seat visible in world ${w}: ${school}`);
    check(worldPack(w).regions[loc.reg]?.vuc === SCHOOL_VUC[school] && worldPack(w).regions[seat.reg]?.vuc === SCHOOL_VUC[school], `branch and seat in canonical vuc (${SCHOOL_VUC[school]}): ${school}`);
    check(loc.chau === seat.chau && Math.hypot(loc.x - seat.x, loc.y - seat.y) <= 180, `branch next to seat in same chau in world ${w}: ${school}`);
    if (school === 'jie') {
      const m = worldPack(w).landmass.dong;
      check(loc.island && seat.island && seat.x > m.x + m.rx, `Kim Ngao Dao and Tiet Giao are East Sea islands in world ${w}`);
      check(ISLANDS.some(([x, y]) => x === seat.x && y === seat.y) && ISLANDS.some(([x, y]) => x === loc.x && y === loc.y), `island geometry matches in world ${w}`);
    }
    check(TECHS[sc.tech].tier < 5, 'declining branch technique below divine');
    const members = people.filter(p => p.world === w && p.alive && p.sect === sc.n);
    check(members.length >= 1 && members.length <= 3, 'very few branch members');
    state.sect = { id: sc.id, rank: 6, contrib: 99999, joined: state.year, lastPay: state.year };
    const roster = elderRoster();
    check(roster.some(e => e.role === 'chu' && e.top && baiBlock(e) === null), `can bai su Giao chu in ${sc.n} (world ${w})`);
    check(roster.some(e => e.role === 'thaithuong' && e.top && baiBlock(e) === null), `can bai su Thai thuong truong lao in ${sc.n} (world ${w})`);
    if (school === 'jie') {
      check(roster.some(e => e.title?.includes('Thượng Thanh Thông Thiên Giáo Chủ (còn gọi là Thượng Thanh Linh Bảo Thiên Tôn) – Giáo chủ Tiệt Giáo') && !e.name.startsWith('Thông ') && e.d.includes('Y bát truyền nhân')), 'Tiet Giao head has title and y bat successor in lower world');
      check(roster.some(e => e.title === 'Đa Bảo Đạo Nhân' && !e.name.startsWith('Đa ') && e.d.includes('Y bát truyền nhân')), 'Da Bao Dao Nhan title and y bat successor in lower world');
      check(roster.some(e => e.title === 'Huyền Đàn Chân Quân' && e.name.startsWith('Triệu ') && e.d.includes('Hậu nhân họ Triệu')), 'Trieu Cong Minh descendant name in lower world');
    }
    for (const ware of sectWares()) {
      if (ware.gear) check(ware.gear.g <= 4, 'branch gear cap');
      if (ware.id.startsWith('cp:')) check(TECHS[ware.id.slice(3)].tier <= 4, 'branch book cap');
    }
  }
  const locList = (Object.keys(DECLINING_SCHOOLS) as (keyof typeof DECLINING_SCHOOLS)[]).map(k => LOCS[branchId(w, k)]);
  for (let a = 0; a < locList.length; a++) for (let b = a + 1; b < locList.length; b++) {
    check(Math.hypot(locList[a].x - locList[b].x, locList[a].y - locList[b].y) > 200, `declining schools well separated on map in world ${w}`);
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
state.world = WORLD.lv = 4; applyWorld(4);
for (const [sectName, canonHead] of [['Tiệt Giáo · Bích Du Cung', 'Thông Thiên Giáo Chủ'], ['Xiển Giáo · Ngọc Hư Cung', 'Nguyên Thủy Thiên Tôn'], ['Đạo Giáo · Bát Cảnh Cung', 'Lão Tử'], ['Tây Phương Giáo', 'Tiếp Dẫn Đạo Nhân']] as const) {
  const sc4 = Object.values(SECTS).find(x => x.n === sectName)!;
  state.sect = { id: sc4.id, rank: 1, contrib: 0, joined: state.year, lastPay: state.year };
  const ros4 = elderRoster();
  check(ros4[0]?.role === 'chu' && ros4[0]?.name === canonHead && baiBlock(ros4[0]) === null, `Hong Hoang ${sectName} uses canonical name ${canonHead} and allows baiSu`);
}
state.world = WORLD.lv = 0; applyWorld(0); state.sect = null;
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
