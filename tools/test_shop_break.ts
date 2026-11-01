export {};
// Kiểm tra: thành lớn bán đủ đan đột phá kể cả cấp cao, trấn bán cấp thấp + trung; đột phá thất bại thì lần sau dễ hơn.
// Chạy: npx tsx tools/test_shop_break.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const core = await import('../src/engine/core');
const trade = await import('../src/engine/trade');
const { LOC_LIST } = await import('../src/data/world');
const { PILLS } = await import('../src/data/items');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
life.newLife({ name: 'Thử Tiệm', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
const s = ST.s;
const brk = (w: { id: string }[]) => w.filter((x) => x.id.startsWith('p:') && PILLS[x.id.slice(2)]?.k === 'break').map((x) => PILLS[x.id.slice(2)].tier);
for (const l of LOC_LIST.filter((x) => x.type === 'town')) {
  s.loc = l.id;
  const tiers = brk(trade.stock());
  const big = trade.isBigTown(l.n);
  const want = big ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5];
  const good = want.every((t) => tiers.includes(t)) && (big || tiers.every((t) => t <= 5));
  if (!good || l.n === 'Thiên Kinh' || l.n === 'Hoàng Tuyền Trấn') ok(good, `${l.n} (${big ? 'lớn' : 'nhỏ'}): đan đột phá bậc ${tiers.join(',')}`);
  else fails += 0;
}
ok(LOC_LIST.filter((x) => x.type === 'town').every((l) => { s.loc = l.id; const t = brk(trade.stock()); return trade.isBigTown(l.n) ? t.includes(8) : t.includes(5) && !t.includes(6); }), 'mọi thành trì đúng luật');
// thất bại cộng dồn
s.r = 4; s.st = 3; s.hurt = 0; s.tamma = 0;
const p0 = core.btChance();
s.flags.btFail = { r: 5, n: 2 };
const p2 = core.btChance();
ok(p2 > p0, `2 lần thất bại: ${Math.round(p0 * 100)}% → ${Math.round(p2 * 100)}%`);
s.flags.btFail = { r: 4, n: 3 }; // cảnh giới khác: không tính
ok(Math.abs(core.btChance() - p0) < 1e-9, 'kinh nghiệm cảnh giới khác không tính');
s.flags.btFail = { r: 5, n: 99 };
ok(core.failBonus(5).n === 5, 'tối đa 5 lần cộng dồn');
// Hỗn Độn Đạo Thai: đột phá mọi cảnh giới 100%, kể cả khi tâm ma và thương thế cao
delete s.flags.btFail;
s.body = 'hondon'; s.r = 1; s.st = 3;
let allOk = true;
for (let i = 0; i < 20 && s.r < 9; i++) {
  s.tamma = 90; s.hurt = 90; s.st = 3;
  if (core.btChance() !== 1) allOk = false;
  const r = core.breakthrough();
  if (!r.ok) allOk = false;
}
ok(allOk && s.r === 9, `Hỗn Độn Đạo Thai: đột phá liền mạch tới ${s.r} (tâm ma 90, thương thế 90)`);
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
