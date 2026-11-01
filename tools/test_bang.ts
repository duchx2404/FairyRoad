export {};
// Kiểm tra các bảng Thiên Cơ Lâu mới: yêu tu hóa hình, Thế Lực Bảng, Pháp Bảo Bảng, danh sư, pháp khí luyện chế. Chạy: npx tsx tools/test_bang.ts
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
const tc = await import('../src/engine/tienco');
const bang = await import('../src/engine/bang');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const fate = life.rollFate(false, 'm');
life.newLife({ name: 'Test', g: 'm', origin: 'mucdong', fate, perks: [] });
const s = ST.s;
// yêu tu
const people = tc.tcPeople().filter((p) => p.fsi === undefined && !p.chief && !p.lord && !p.ret && !p.heroine); // chỉ người sinh ngẫu nhiên
const beasts = people.filter((p) => p.beast);
ok(beasts.length > people.length * 0.1, `yêu tu hóa hình: ${beasts.length}/${people.length}`);
console.log('  vd:', beasts.slice(0, 4).map((p) => `${p.name} [${p.beast}] — ${p.form}`).join(' | '));
ok(beasts.every((p) => p.form && p.blood && p.name.split(' ').length >= 2), 'yêu tu có đặc trưng hóa hình, huyết mạch và tên');
console.log('  huyết mạch:', beasts.slice(0, 5).map((p) => p.blood).join(' | '));
const tk = tc.board('tk'), cg = tc.board('cg');
ok(tk.some((r) => r.person?.beast) || cg.some((r) => r.person?.beast), 'bảng Thiên Kiêu/Cường Giả có yêu tu');
console.log('  note yêu tu:', (cg.find((r) => r.person?.beast) || tk.find((r) => r.person?.beast))?.note);
// thế lực
const f = bang.forceBoard();
ok(f.filter((r) => r.kind === 'celestial').length === 4 && f.filter((r) => /Long Cung$/.test(r.name)).length === 20, 'Thế Lực Bảng có 4 thần giới và 20 long cung');
ok(f.length > 20, `Thế Lực Bảng ${f.length} thế lực; #1 ${f[0].name} (${f[0].sub})`);
ok(f.every((r, i) => !i || f[i - 1].score >= r.score), 'thế lực xếp giảm dần');
for (const k of ['sect', 'empire', 'clan'] as const) { const b = bang.forceBoard(k); ok(b[0]?.rank === 1 && b.every((r, i) => r.rank === i + 1), `${k}: bảng riêng đánh số từ 1 (${b.length}, #1 ${b[0]?.name})`); }
const vass = f.filter((r) => r.sub.includes('thuộc quốc')); console.log('  thuộc quốc:', vass.length, vass.slice(0, 2).map((r) => r.name).join(', '));
// pháp bảo & pháp khí & danh sư
const tb = bang.treasureBoard(); ok(tb.length >= 18, `Pháp Bảo Bảng ${tb.length}; #1 ${tb[0].name} — ${tb[0].note}`);
s.gear[0] = { uid: 'x', slot: 0, n: 'Hỗn Độn Tàn Kiếm (tàn khuyết)', g: 6, q: 3, lv: 0, el: null, atk: 0, def: 0, hp: 0, cult: 0, luck: 2, cap: 0, refined: true, grow: true } as any;
const tb2 = bang.treasureBoard(); const mine = tb2.find((r) => r.mine); ok(!!mine && mine.rank <= 3, `pháp bảo của ngươi lên bảng hạng ${mine?.rank}: ${mine?.name}`);
for (const k of ['alch', 'forge', 'talis'] as const) {
  const m = bang.masterBoard(k); const tools = bang.toolBoard(k);
  ok(m.length >= 12 && tools.length === 10, `${k}: ${m.length} danh sư (#1 ${m[0].name} ${m[0].note}) · ${tools.length} pháp khí (#1 ${tools[0].name} — ${tools[0].note})`);
  ok(tools[0].holder === m[0].name, `${k}: pháp khí số 1 trong tay danh sư số 1`);
}
s.craft.alch = 5;
const ma = bang.masterBoard('alch'); const me = ma.find((r) => r.mine); ok(!!me, `người chơi vào Đan Sư Bảng hạng ${me?.rank}/${ma.length}`);
const tbb = bang.tbdbBoard();
ok(tbb.length >= 10 && tbb.every((r) => r.realm <= 9 && r.realm >= 1) && tbb.every((r, i) => !i || tbb[i - 1].realm >= r.realm), `Thiên Tài Địa Bảo Bảng Thương Lan: ${tbb.length} thứ, #1 ${tbb[0].n} — ${tbb[0].note}`);
// tính ổn định: gọi lại cho kết quả như cũ
ok(JSON.stringify(bang.treasureBoard().map((r) => r.name)) === JSON.stringify(tb2.map((r) => r.name)), 'bảng ổn định giữa hai lần gọi');
console.log(fails ? `\n${fails} FAIL` : '\nALL PASS');
