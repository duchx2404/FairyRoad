export {};
// Tọa kỵ: chân linh chở chủ đi đường nhanh theo phẩm; chỉ cưỡi thì không vào trận, không chiếm suất.
// Chạy: npx tsx tools/test_mount.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const core = await import('../src/engine/core');
const party = await import('../src/engine/party');
const items = await import('../src/engine/items');
const { ORIGINS } = await import('../src/data/core');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const org = ORIGINS[0];
life.newLife({ name: 'Thử', g: 'm', origin: org.id, fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
const s = ST.s;
const m = (id: string, base: number) => { s.flags.chanlinh = { id, name: id, bond: 50 }; return core.mountYears(base); };
s.flags.chanlinh = null;
ok(core.mountYears(0.25) === 0.25, 'Không tọa kỵ: giữ nguyên 3 tháng');
ok(Math.abs(m('loiung', 0.25) - 1 / 12) < 1e-9, 'Lôi Ưng (Địa giai): 3 tháng → 1 tháng');
ok(Math.abs(m('hoaly', 0.75) - 0.5) < 1e-9, 'Hỏa Ly (Hoàng giai, ×1.5): 9 tháng → 6 tháng');
ok(m('chuoc', 0.4) === 0, 'Chu Tước (Tiên giai): cự ly ngắn tới ngay lập tức');
const far = m('chuoc', 6);
ok(far >= 1 / 12 && far <= 0.25, `Chu Tước: cự ly dài (6 năm đi thường) chỉ ${Math.round(far * 12)} tháng`);
// xuất chiến / chỉ cưỡi
s.flags.chanlinh = { id: 'loiung', name: 'Lôi Ưng', bond: 50 };
const a1 = party.activeCount();
items.toggleLinhRide(9, a1);
ok(s.flags.chanlinh.ride === true && party.activeCount() === a1 - 1, 'Chỉ cưỡi: không chiếm suất xuất trận');
ok(Math.abs(core.mountYears(0.25) - 1 / 12) < 1e-9, 'Chỉ cưỡi: vẫn đi đường nhanh');
items.toggleLinhRide(9, party.activeCount());
ok(!s.flags.chanlinh.ride && party.activeCount() === a1, 'Cho xuất chiến lại: chiếm một suất');
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
