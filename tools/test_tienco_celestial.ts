export {};
// Bảng Thiên Cơ Lâu gồm mọi người/yêu/ma của giới, kể cả bốn thần giới (Thiên Đình, Linh Sơn, Địa Phủ, Yêu Giới):
// chức vụ thần giới lên Cường Giả Bảng, thiên kiêu thần giới lên Thiên Kiêu Bảng, danh sư thần giới lên bảng nghề.
// Chạy: npx tsx tools/test_tienco_celestial.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const tc = await import('../src/engine/tienco');
const bang = await import('../src/engine/bang');
const { CELESTIAL, celestialOffices } = await import('../src/data/celestial');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };

life.newLife({ name: 'Thử Bảng', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
const cg = tc.board('cg');
const tk = tc.board('tk');
for (const id of Object.keys(CELESTIAL) as (keyof typeof CELESTIAL)[]) {
  const offs = celestialOffices(id, 0);
  const onCg = offs.filter((o) => cg.some((r) => r.name === o.name));
  ok(onCg.length === offs.length, `${CELESTIAL[id].n}: ${onCg.length}/${offs.length} chức vụ có tên trên Cường Giả Bảng (đứng đầu: ${offs[0].title} ${offs[0].name}, hạng ${cg.find((r) => r.name === offs[0].name)?.rank})`);
  const youth = tk.filter((r) => r.person?.sect === CELESTIAL[id].n);
  ok(youth.length >= 1, `${CELESTIAL[id].n}: ${youth.length} thiên kiêu trên Thiên Kiêu Bảng`);
}
const alch = bang.masterBoard('alch');
const laoquan = celestialOffices('thiendinh', 0).find((o) => o.title === 'Thái Thượng Lão Quân')!;
ok(alch.some((r) => r.name === laoquan.name), `Đan Sư Bảng có Thái Thượng Lão Quân ${laoquan.name} (hạng ${alch.find((r) => r.name === laoquan.name)?.rank})`);
ok(bang.masterBoard('talis').some((r) => r.sect.startsWith('Linh Sơn')) && bang.masterBoard('forge').some((r) => r.sect.startsWith('Thiên Đình')), 'Phù Sư / Khí Sư Bảng có danh sư thần giới');
for (const k of ['alch', 'forge', 'talis'] as const) {
  const rows = bang.masterBoard(k).filter((r) => !r.mine);
  const lastCel = Math.max(...rows.filter((r) => r.cel).map((r) => r.rank));
  const firstMortal = Math.min(...rows.filter((r) => !r.cel).map((r) => r.rank));
  ok(lastCel < firstMortal, `${bang.MASTER_N[k]}: người thần giới hạng 1–${lastCel}, danh sư trần thế từ hạng ${firstMortal} (#1 ${rows[0].name} · ${rows[0].note})`);
}
ok(alch[0].name === laoquan.name, 'Thái Thượng Lão Quân đứng đầu Đan Sư Bảng');
// chức vụ: mọi dòng đều có, không lặp tên thế lực, chức vụ thần giới đúng tên chức
for (const [label, rows] of [['Cường Giả', cg], ['Thiên Kiêu', tk]] as const) {
  const bad = rows.filter((r) => !r.mine && (!r.role || r.role === (r.force ?? r.person?.sect)));
  ok(bad.length === 0, `${label} Bảng: ${rows.length} dòng đều có chức vụ${bad.length ? ' — thiếu: ' + bad.slice(0, 3).map((r) => r.name + '/' + r.note).join('; ') : ''}`);
  for (const r of rows.slice(0, 6)) console.log(`   ${r.rank}. ${r.name} · ${r.force ?? r.person?.sect ?? r.npc?.sect ?? ''} · ${r.role}`);
}
ok(cg.filter((r) => r.id.startsWith('cel:')).every((r) => r.note.startsWith(r.role + ' · ')), 'chức vụ thần giới = tên chức (Ngọc Hoàng Đại Đế, Phong Đô Đại Đế…)');
const roles = new Set([...cg, ...tk].map((r) => r.role));
console.log('   các chức vụ gặp:', [...roles].slice(0, 25).join(' | '));
// mỗi thánh địa chỉ một Thánh tử, một Thánh nữ, đúng họ cố định — xét cả 6 giới, có cả vị hôn thê thánh nữ trong nhân mạch
{
  const { holySur, splitName } = await import('../src/data/core');
  life.newLife({ name: 'Diệp Thử', g: 'm', origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, 'm'), (await import('../src/data/core')).ORIGINS.find((o) => o.id === 'diep_hondon')!), perks: [] });
  let dup = 0, wrong = 0, n = 0;
  for (let w = 0; w < 6; w++) {
    const rows = [...tc.board('tk', w), ...tc.board('cg', w)];
    const seen = new Map<string, Set<string>>();
    for (const r of rows) {
      const role = r.role;
      if (role !== 'Thánh tử' && role !== 'Thánh nữ') continue;
      const force = r.person && !r.npc ? r.person.sect : r.npc?.sect ? (await import('../src/data/world')).SECTS[r.npc.sect]?.n : '';
      const key = `${w}:${force}:${role}`;
      (seen.get(key) ?? seen.set(key, new Set()).get(key)!).add(r.id);
      n++;
      const id = r.npc?.sect ?? Object.values((await import('../src/data/world')).worldPack(w).sects).find((x) => x.n === force)?.id;
      const want = holySur(id, role === 'Thánh tử' ? 'm' : 'f');
      if (want && splitName(r.name).sur !== want) { wrong++; console.log('   sai họ:', w, r.name, force, role); }
    }
    for (const [k, v] of seen) if (v.size > 1) { dup++; console.log('   trùng danh vị:', k, v.size); }
  }
  ok(dup === 0 && wrong === 0 && n > 0, `6 giới: ${n} Thánh tử/Thánh nữ trên bảng, mỗi thánh địa tối đa một người mỗi danh vị, đúng họ`);
}
// yêu tu không thuộc hoàng thất loài người: thái tử / công chúa / tộc trưởng của chính loài mình
{
  let royalBeast = 0, moved = 0;
  for (let w = 0; w < 6; w++) {
    for (const r of [...tc.board('tk', w), ...tc.board('cg', w)]) {
      if (!r.person?.beast) continue;
      if (r.person.sect.startsWith('Hoàng thất') || r.role === 'Hoàng tử' || r.role === 'Công chúa' && !r.person.sect.endsWith(' tộc')) royalBeast++;
      if (r.person.sect === `${r.person.beast} tộc`) { if (moved++ < 3) console.log(`   ${r.name} · ${r.person.sect} · ${r.role}`); }
    }
  }
  // ép một ca: biến một người hoàng thất thành yêu tu
  const T = ST.s.flags.tienco as { people: any[] };
  const p = T.people.find((x) => !x.beast && x.sect.startsWith('Hoàng thất') && x.from.startsWith('Đệ tử'));
  if (p) { p.beast = 'Toan Dư'; tc.board('tk', p.world); console.log(`   ép thử: ${p.name} · ${p.sect} · ${tc.roleOfPerson(p)}`); }
  ok(royalBeast === 0 && (!p || (p.sect === 'Toan Dư tộc' && /^(Thái tử|Công chúa)$/.test(tc.roleOfPerson(p)))), `không yêu tu nào thuộc hoàng thất (${moved} yêu tu xếp về tộc của loài mình)`);
}
// Long Cung: Hải Long Cung chỉ hải tộc, Long Cung sông chỉ thủy tộc giang/hà
{
  const W = await import('../src/data/world');
  let n = 0, bad = 0;
  for (let w = 0; w < 6; w++) {
    const tribes = new Map(Object.values(W.worldPack(w).sects).filter((x) => x.tribe).map((x) => [x.n, x.tribe!]));
    for (const r of [...tc.board('tk', w), ...tc.board('cg', w)]) {
      const tr = r.person && !r.npc ? tribes.get(r.person.sect) : undefined;
      if (!tr) continue;
      n++;
      if (!(tr === 'hai' ? tc.SEA_TRIBE : tc.RIVER_TRIBE).includes(r.person!.beast ?? '')) { bad++; console.log('   sai tộc:', w, r.name, r.person!.sect, r.person!.beast); }
    }
  }
  // ép đúng ca trong ảnh: phượng làm đệ tử Hải Long Cung
  const T = ST.s.flags.tienco as { people: any[] };
  const hai = Object.values(W.worldPack(0).sects).find((x) => x.tribe === 'hai')!;
  const p = T.people.find((x) => x.world === 0 && !x.npc && !x.ret && !x.lord && x.r > 0);
  p.sect = hai.n; p.beast = 'Ngũ Sắc Linh Phượng'; p.from = `Thân truyền ${hai.n}`;
  tc.board('cg', 0);
  console.log(`   ép thử: ${p.name} · ${p.sect} · loài ${p.beast} (${p.blood})`);
  ok(bad === 0 && n > 0 && tc.SEA_TRIBE.includes(p.beast), `6 giới: ${n} người thuộc Long Cung trên bảng đều đúng thủy tộc`);
}
const celRows = cg.filter((r) => r.id.startsWith('cel:'));
ok(celRows.every((r) => cg.filter((x) => x.name === r.name).length === 1), `${celRows.length} người thần giới trên Cường Giả Bảng, không trùng tên ai`);
// bản lưu cũ: chưa có thiên kiêu thần giới → bổ sung một lần khi mở bảng
const T = ST.s.flags.tienco as { people: { sect: string }[]; celMig?: number };
const celNames = new Set(Object.values(CELESTIAL).map((c) => c.n));
T.people = T.people.filter((p) => !celNames.has(p.sect));
delete T.celMig;
const before = T.people.filter((p) => celNames.has(p.sect)).length;
tc.tc();
const after = T.people.filter((p) => celNames.has(p.sect)).length;
ok(before === 0 && after > 0, `bản lưu cũ: thiên kiêu thần giới ${before} → ${after}`);
tc.tc();
ok(T.people.filter((p) => celNames.has(p.sect)).length === after, 'bổ sung đúng một lần');
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
