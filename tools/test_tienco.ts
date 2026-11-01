export {};
// Kiểm tra Thiên Cơ Lâu + luật phi thăng: ép người chơi lên trần giới rồi phi thăng qua từng giới,
// xem thân thể về 1 tuổi, tuổi linh hồn/tổng thọ cộng dồn, bảng mỗi giới, hồi hạ giả, và tick qua ngàn năm không lỗi.
// Chạy: npx tsx tools/test_tienco.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };

const ST = await import('../src/engine/state');
await import('../src/engine/wire');
await import('../src/events/core');
await import('../src/events/town');
await import('../src/events/life');
await import('../src/events/tienco');
await import('../src/data/worlds');
const life = await import('../src/engine/life');
const core = await import('../src/engine/core');
const char = await import('../src/engine/char');
const tc = await import('../src/engine/tienco');
const { RMAX, WORLDS, LAST_WORLD } = await import('../src/data/core');
const { EVENTS, eligible } = await import('../src/engine/events');

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };

for (const origin of ['diep_hondon', 'mucdong']) {
  const fate = life.rollFate(false, 'm');
  life.newLife({ name: 'Test ' + origin, g: 'm', origin, fate, perks: [] });
  const s = ST.s;
  console.log(`\n== ${origin}: sinh năm ${s.born}, tuổi ${char.age()}, hồn ${char.soulAge()}`);
  ok(s.flags.soulBorn === s.born, 'soulBorn = born lúc sinh');
  const people = tc.tcPeople();
  ok(people.length > 6 * 28, `sinh ${people.length} nhân vật trên bảng cho ${LAST_WORLD + 1} giới`);
  const ret = tc.retPeople();
  console.log('  hồi hạ giả:', ret.map((p) => `${p.name} <- ${p.ret} (sinh ${p.born}, tư chất ${p.talent.toFixed(2)})`).join('; ') || '(không ai)');
  ok(origin !== 'diep_hondon' || !ret.some((p) => p.ret === 'Diệp gia Hỗn Độn'), 'Diệp Thần: suất Diệp gia không sinh thêm người');
  ok(ret.every((p) => Math.abs(p.born - s.born) <= 3), 'hồi hạ giả sinh cùng khoảng năm người chơi');
  for (let w = 0; w <= LAST_WORLD; w++) {
    const tk = tc.board('tk', w), cg = tc.board('cg', w);
    ok(tk.every((r) => r.age <= tc.TK_AGE[w]), `giới ${w} Thiên Kiêu Bảng chỉ có người ≤ ${tc.TK_AGE[w]} tuổi (${tk.length} người)`);
    ok(cg.every((r) => r.person?.world === w || r.mine || r.npc || r.id.startsWith('cel:')), `giới ${w} Cường Giả Bảng chỉ người trong giới (kể cả bốn thần giới của giới) (${cg.length} người, #1 ${cg[0]?.name} ${tc.realmTxt(cg[0]?.r ?? 0, cg[0]?.st ?? 0)})`);
    for (let i = 1; i < cg.length; i++) ok(cg[i - 1].r * 10 + cg[i - 1].st >= cg[i].r * 10 + cg[i].st, `giới ${w} Cường Giả xếp giảm dần (${i})`);
  }
  // phi thăng lần lượt qua các giới
  let totalLived = 0;
  for (let w = 0; w < LAST_WORLD; w++) {
    s.r = RMAX(); s.st = 3; s.prog = 100;
    core.passTime(37.5); // sống thêm vài chục năm ở giới này
    const before = char.age(), soulBefore = char.soulAge();
    totalLived += before;
    const to = life.ascend();
    ok(s.world === w + 1 && to === WORLDS[w + 1], `phi thăng tới ${to}`);
    ok(Math.abs(char.age() - 1) < 1e-9, `  thân thể về 1 tuổi (${char.age()})`);
    ok(Math.abs(char.soulAge() - soulBefore) < 1e-9, `  tuổi linh hồn giữ nguyên (${Math.floor(char.soulAge())})`);
    ok(Math.abs(char.lifeLived() - (totalLived + 1)) < 1e-6, `  thọ cộng dồn = ${Math.floor(char.lifeLived())} năm`);
    ok(!s.flags.childhood && char.cultRate() > 0, '  tu luyện được ngay (đặc quyền phi thăng)');
    const tk = tc.board('tk');
    const me = tk.find((r) => r.mine);
    ok(!!me, `  có tên trên Thiên Kiêu Bảng ${WORLDS[s.world!]} (hạng ${me?.rank}/${tk.length})`);
    // sự kiện tuổi thơ (maxAge) không hiện với kẻ có linh hồn già
    const childEv = EVENTS.filter((e) => e.maxAge !== undefined && e.maxAge < 20);
    ok(childEv.every((e) => !eligible(e, e.where[0] as any)), `  ${childEv.length} sự kiện tuổi thơ (maxAge) không hiện cho linh hồn ${Math.floor(char.soulAge())} tuổi`);
  }
  // tick dài: người trên bảng tu luyện / phi thăng / chết
  const alive0 = tc.tcPeople().filter((p) => p.alive).length;
  const t0 = Date.now();
  for (let i = 0; i < 200; i++) core.passTime(50);
  const ms = Date.now() - t0;
  const ppl = tc.tcPeople();
  const asc = ppl.filter((p) => p.asc > 0 && !p.lord && p.world > 0 && p.soulBorn !== p.born).length;
  const dead = ppl.filter((p) => !p.alive).length;
  console.log(`  10000 năm trôi: ${ms}ms · còn sống ${ppl.filter((p) => p.alive).length}/${alive0} · ${asc} người đã phi thăng · ${dead} đã chết`);
  ok(ms < 3000, 'tick 10000 năm dưới 3 giây');
  ok(ppl.every((p) => p.r <= 21 && p.st <= 3 && p.world <= LAST_WORLD), 'không ai vượt trần cảnh giới / giới');
  ok(ppl.filter((p) => p.lord).length === 1, 'chỉ một kẻ giữ Đại Đạo');
  const logs = s.log.filter((l) => l.t.includes('Thiên Cơ Lâu')).slice(-3).map((l) => l.t.slice(0, 110));
  console.log('  nhật ký Thiên Cơ Lâu gần nhất:', logs);
  life.die('kết thúc test');
}
console.log(fails ? `\n${fails} FAIL` : '\nTẤT CẢ PASS');
process.exit(fails ? 1 : 0);
