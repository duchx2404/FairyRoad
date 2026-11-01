export {};
// Họ Thánh tử / Thánh nữ cố định theo thánh địa (HOLY_SUR): mỗi họ chỉ thuộc một thánh địa, Thánh tử và Thánh nữ
// cùng tông khác họ; tên riêng ngẫu nhiên. Đổi tên NPC: giữ họ, kiểm tra trùng / chữ Hán; bản lưu cũ được đổi họ khi tải.
// Chạy: npx tsx tools/test_holy_names.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
await import('../src/data/worlds');
const life = await import('../src/engine/life');
const core = await import('../src/engine/core');
const { ORIGINS, WORLDS, CLANS, HOLY_SUR, holySur, splitName } = await import('../src/data/core');
const W = await import('../src/data/world');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };

// 1) bảng họ phủ mọi thánh địa của mọi giới, không trùng
const holyIds = new Set<string>();
for (let w = 0; w < WORLDS.length; w++) { W.applyWorld(w); for (const sc of Object.values(W.SECTS)) if (sc.tier === 4) holyIds.add(sc.id); }
W.applyWorld(0);
const missing = [...holyIds].filter((id) => !HOLY_SUR[id]);
ok(missing.length === 0, `bảng họ phủ đủ ${holyIds.size} thánh địa${missing.length ? ' — thiếu ' + missing.join(', ') : ''}`);
const all = Object.values(HOLY_SUR).flatMap((x) => [x.f, x.m]);
const dup = all.filter((x, i) => all.indexOf(x) !== i);
ok(dup.length === 0, `${all.length} họ không trùng nhau (thánh tử ≠ thánh nữ, không thánh địa nào dùng chung)${dup.length ? ' — trùng ' + dup.join(', ') : ''}`);
const banned = new Set([...Object.values(CLANS).map((c) => c.sur), 'Diệp', 'Ngô']);
ok(all.every((x) => !banned.has(x)), 'không dùng họ thế gia, họ Diệp, họ Ngô');
ok(holySur('tutieu', 'f') === 'Lạc' && holySur('huyennguyen', 'f') === 'Lâm', 'thánh nữ Tử Tiêu họ Lạc, Huyền Nguyên họ Lâm');

// 2) hôn thê thánh địa (người chơi nam → thánh nữ, người chơi nữ → thánh tử) mang đúng họ của tông
const org = ORIGINS.find((o) => o.id === 'diep_hondon')!;
let bad = 0, seen = 0;
const givens = new Set<string>();
for (let i = 0; i < 30; i++) {
  const g = i % 2 ? 'f' : 'm';
  life.newLife({ name: 'Diệp Thử', g, origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, g), org), perks: [] });
  const brides = (ST.s.flags.dhBrides as string[]).map((id) => ST.s.npcs.find((x) => x.id === id)!);
  for (const b of brides) {
    const want = holySur(life.holyRoleOf(b), b.g);
    if (!want) continue;
    seen++;
    if (splitName(b.name).sur !== want) { bad++; console.log('  sai họ:', b.name, b.how); }
    if (b.sect === 'tutieu' && b.g === 'f') givens.add(splitName(b.name).given);
  }
  if (new Set(brides.map((b) => b.name)).size !== brides.length) bad++;
}
ok(bad === 0 && seen > 50, `30 kiếp: ${seen} thánh nữ / thánh tử hôn ước đều mang họ của tông, không trùng tên`);
ok(givens.size >= 5, `tên riêng thánh nữ Tử Tiêu ngẫu nhiên (${givens.size} tên khác nhau)`);

// 3) người chơi xuất thân Thánh tử / Thánh nữ mang họ của thánh địa
for (const o of ORIGINS.filter((x) => x.sect && HOLY_SUR[x.sect])) {
  for (const g of ['m', 'f'] as const) {
    life.newLife({ name: 'Diệp Thử', g, origin: o.id, fate: life.fitRoot(life.rollFate(false, g), o), perks: [] });
    ok(splitName(ST.s.name).sur === holySur(o.sect, g), `xuất thân ${o.id} (${g}): ${ST.s.name}`);
  }
}

// 4) tình địch là Thánh tử mang họ thánh tử của tông
{
  const sui = await import('../src/events/suitor');
  let n = 0, wrong = 0;
  for (let i = 0; i < 15; i++) {
    life.newLife({ name: 'Diệp Thử', g: 'm', origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
    ST.s.flags.dhKept = [...(ST.s.flags.dhBrides as string[])];
    sui.spawnSuitors();
    for (const x of ST.s.npcs.filter((y) => y.tag === 'enemy' && y.how.startsWith('Thánh tử '))) { n++; if (splitName(x.name).sur !== holySur(x.sect, 'm')) { wrong++; console.log('  sai họ:', x.name, x.how); } }
  }
  ok(wrong === 0 && n > 0, `${n} tình địch Thánh tử đều mang họ thánh tử của tông`);
}

// 5) đổi tên
const brides = (ST.s.flags.dhBrides as string[]).map((id) => ST.s.npcs.find((x) => x.id === id)!);
const [b, other] = brides;
const sur = splitName(b.name).sur;
ok(core.renameNpc(b, `${sur} Vân Khê`) === null && b.name === `${sur} Vân Khê`, `đổi tên hợp lệ → ${b.name}`);
ok(core.renameNpc(b, other.name) !== null, 'trùng tên người khác: báo lỗi');
ok(core.renameNpc(b, sur + ' ' + String.fromCharCode(0x96ea)) !== null, 'có chữ Hán: báo lỗi');
ok(core.renameNpc(b, sur) !== null, 'thiếu tên riêng: báo lỗi');

// 6) bản lưu cũ: đổi họ, giữ tên riêng
const tt = brides.find((x) => life.holyRoleOf(x))!;
const given = splitName(tt.name).given;
tt.name = `Ôn ${given}`;
delete ST.s.flags.holySurV2;
life.syncHolySurnames();
ok(tt.name === `${holySur(tt.sect, tt.g)} ${given}`, `bản lưu cũ: Ôn ${given} → ${tt.name}`);

console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
