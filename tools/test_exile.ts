export {};
// Chuỗi "Cố nhân bị hãm hại phải rời tông" (events/exile.ts + engine/ally.ts).
// Chạy: npx tsx tools/test_exile.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const sect = await import('../src/engine/sect');
const party = await import('../src/engine/party');
const ally = await import('../src/engine/ally');
await import('../src/events/life');
const X = await import('../src/events/exile');
const { EVENTS } = await import('../src/engine/events');
const { ORIGINS } = await import('../src/data/core');
const { SECTS, SECT_TIER_INFO, EMPIRES } = await import('../src/data/world');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const org = ORIGINS.find((o) => o.id === 'diep_hondon')!;
type N = (typeof ST.s.npcs)[number];

function setup() {
  life.newLife({ name: 'Diệp Thử', g: 'm', origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
  const s = ST.s;
  s.flags.childhood = false;
  s.born = s.year - 9;
  return s;
}
/** Một thánh nữ có hôn ước, thuộc tông khác Tử Tiêu. */
const saintOf = (s: typeof ST.s): N => s.npcs.find((x) => (s.flags.dhBrides as string[]).includes(x.id) && x.sect && x.sect !== 'tutieu' && x.how.startsWith('Thánh nữ'))!;
const pickChoice = (cs: { t: string; fn: () => any }[], t: string) => cs.find((c) => c.t === t)!.fn();

// 1) Bản lưu cũ: đã thắng trận ở hẻm núi → bước hỏi dự định
{
  const s = setup();
  const n = saintOf(s);
  const oldSect = n.sect!;
  n.rel = 70;
  s.log.push({ y: s.year, t: `Cố nhân tìm tới: Hai người chia đôi dưới ánh lửa. ${n.name} nâng bình rượu: "Kiếp này có ngươi là đủ."` });
  const sc = X.exileTalkScene();
  ok(!!sc && sc.text.includes(n.name), 'Bản lưu cũ: hiện cảnh hỏi dự định đúng người');
  ok(n.sect === null && n.how.startsWith(`Cựu thánh nữ ${SECTS[oldSect].n}`), `Bản lưu cũ: mất tông môn và chức vụ (${n.how.split(' — ')[0]})`);
  ok(X.exileTalkScene() === null, 'Bản lưu cũ: cảnh chỉ hiện một lần');
  const txt = pickChoice(sc!.choices!, 'Mời đồng hành') as string;
  ok(party.inParty(n.id) && ally.allyIds().includes(n.id), 'Mời đồng hành: vào tab Đồng hành');
  ok(n.sect === null && txt.includes('sẽ theo vào đó'), 'Chưa có thế lực: chờ ngươi chọn thế lực');
  // 2) Ngươi gia nhập Tử Tiêu → nàng theo vào, chức theo cảnh giới
  n.r = 1;
  const jt = sect.joinSect('tutieu', 2);
  ok(n.sect === 'tutieu' && jt.includes(`${n.name} cũng theo ngươi bái nhập`), 'Gia nhập tông môn: nàng vào theo');
  ok(n.how.startsWith('Ngoại môn đệ tử Tử Tiêu Tiên Cung'), `Luyện Khí: ${n.how.split(' — ')[0]}`);
  const c = SECT_TIER_INFO[SECTS.tutieu.tier].chu;
  n.r = c - 1;
  ally.allyRealmUp(n);
  ok(n.how.startsWith('Thân truyền đệ tử Tử Tiêu Tiên Cung'), `Lên cảnh giới: ${n.how.split(' — ')[0]}`);
  // 3) Thánh nữ thứ hai
  const ev = EVENTS.find((e) => e.id === 'exile_second_saint')!;
  ok(!!ev.cond!(), 'Đủ cảnh giới, có tư chất: có thể được phong Thánh nữ thứ hai');
  ev.text();
  ok(n.how.startsWith('Thánh nữ thứ hai của Tử Tiêu Tiên Cung') && !ev.cond!(), `Phong: ${n.how.split(' — ')[0]}`);
}
// 4) Sự kiện mới: người có tông môn riêng → mất tông môn ngay khi sự kiện xảy ra; thắng truy binh → hỏi dự định
{
  let asked = 0, runs = 0;
  for (let i = 0; i < 6; i++) {
    const s = setup();
    for (const x of s.npcs) x.rel = 0;
    const n = saintOf(s);
    n.rel = 60;
    const ev = EVENTS.find((e) => e.id === 'life_friend_exile')!;
    const old = EVENTS.find((e) => e.id === 'life_friend_help')!;
    if (i === 0) ok(!!ev.cond!() && !old.cond!(), 'Người có tông môn riêng: đi chuỗi rời tông, không đi bản cũ');
    const t = ev.text();
    if (i === 0) ok(n.sect === null && t.includes('Ta không còn là thánh nữ') && t.includes('Sư phụ'), 'Sự kiện xảy ra: mất tông môn, chức vụ; sư phụ hy sinh');
    s.r = 3; s.hurt = 0; // đủ mạnh để thường thắng truy binh
    const out = pickChoice(ev.ch(), 'Đi cùng, chặn truy binh');
    runs++;
    if (typeof out !== 'string') { asked++; ok(out.text.includes('sau này định thế nào') && out.choices!.some((c: any) => c.t === 'Mời đồng hành'), 'Thắng truy binh: hỏi dự định, có lựa chọn mời đồng hành'); }
  }
  ok(asked > 0, `Thắng truy binh ${asked}/${runs} lần`);
}
// 4b) Gia thế gắn với tông cũ; nguyên nhân: Thánh tử ép cưới / phe trưởng lão
{
  ok(ally.exileFamily('Con gái Thánh chủ đời trước', 'Thương Hải Long Đình') === 'Con gái Thánh chủ Thương Hải Long Đình đời trước', 'Gia thế: Con gái Thánh chủ Thương Hải Long Đình đời trước');
  ok(ally.exileFamily('Thánh nữ của tông, được tông chủ đích thân nuôi dạy', 'Lạc Thủy Tông') === 'Thánh nữ Lạc Thủy Tông, được tông chủ đích thân nuôi dạy', 'Gia thế: Thánh nữ của tông → tên tông cũ');
  const s = setup();
  const n = saintOf(s);
  const scN = SECTS[n.sect!].n;
  n.bio!.family = 'Con gái Thánh chủ đời trước';
  const e = X.applyExile(n);
  ok(n.bio!.family === `Con gái Thánh chủ ${scN} đời trước`, `Sau sự kiện: ${n.bio!.family}`);
  ok(e.traitor.startsWith('Thánh tử') && /ép cưới|cầu thân/.test(e.why!) && /trưởng lão/.test(e.why!), `Nguyên nhân: ${e.why}`);
  // bản lưu cũ: hồ sơ "Chấp pháp trưởng lão", gia thế chưa gắn tông
  const m = s.npcs.find((x) => (s.flags.dhBrides as string[]).includes(x.id) && x.sect && x.id !== n.id)!;
  const mScN = SECTS[m.sect!].n;
  m.bio!.family = 'Con gái Thánh chủ đời trước';
  ally.exiles()[m.id] = { from: m.sect!, title: `Thánh nữ ${mScN}`, traitor: 'Chấp pháp trưởng lão Lý Ác' };
  m.sect = 'tutieu';
  m.how = `Ngoại môn đệ tử Tử Tiêu Tiên Cung — cựu thánh nữ ${mScN}, theo ngươi gia nhập`;
  ally.exileMigrate();
  const me = ally.exiles()[m.id];
  ok(me.v === 2 && me.traitor.startsWith('Thánh tử') && m.bio!.family === `Con gái Thánh chủ ${mScN} đời trước` && m.how.startsWith('Ngoại môn đệ tử Tử Tiêu'), 'Bản lưu cũ: đổi kẻ hãm hại thành Thánh tử, gia thế gắn tông cũ, giữ chức hiện tại');
}
// 5) Ngươi vào chính tông cũ của nàng: nàng không vào
{
  const s = setup();
  const n = saintOf(s);
  const from = n.sect!;
  X.applyExile(n);
  party.party().reserve.push(n.id);
  ally.allyIds().push(n.id);
  const jt = sect.joinSect(from, 2);
  ok(n.sect === null && jt.includes('không chịu bước vào'), 'Tông cũ của nàng: không theo vào');
}
// 6) Chưa có tông môn, vào hoàng triều: nàng nhận chức theo
{
  const s = setup();
  const n = saintOf(s);
  X.applyExile(n);
  party.party().reserve.push(n.id);
  ally.allyIds().push(n.id);
  s.flags.court = { id: 'daichu', rank: 0, favor: 10, lastPay: Math.floor(s.year) };
  const t = ally.allyFollow();
  ok(n.how.includes(EMPIRES.daichu.n) && t.includes('cũng theo ngươi vào'), `Hoàng triều: ${n.how.split(' — ')[0]}`);
}
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
