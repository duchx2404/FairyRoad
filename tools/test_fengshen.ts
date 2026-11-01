export {};
// Kiểm tra Phong Thần Lượng Kiếp: roster Phong Thần Bảng có mặt ở Hồng Hoang, nhánh đứng ngoài sắc phong đủ bảng,
// nhánh tham chiến luôn kết thúc, thánh nhân không ứng kiếp, người sống sót trở lại vòng đời.
// Chạy: npx tsx tools/test_fengshen.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };

const ST = await import('../src/engine/state');
await import('../src/engine/wire');
await import('../src/events/core');
await import('../src/events/tienco');
await import('../src/data/worlds');
const fs = await import('../src/events/fengshen');
const life = await import('../src/engine/life');
const tc = await import('../src/engine/tienco');
const { FENGSHEN_ROSTER } = await import('../src/data/fengshen');
const { EVENTS } = await import('../src/engine/events');
const { worldPack } = await import('../src/data/world');

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };

const TOTAL = FENGSHEN_ROSTER.length;
const pairs = FENGSHEN_ROSTER.map((g) => `${g.name}|${g.office}`);
ok(new Set(pairs).size === TOTAL, `roster không lặp mục nào (${TOTAL} thần vị)`);
ok(!/[\u3400-\u9fff]/.test(JSON.stringify(FENGSHEN_ROSTER)), 'roster không chứa chữ Hán');
ok(!FENGSHEN_ROSTER.some((g) => g.name === 'Đát Kỷ'), 'Đát Kỷ không có tên trên Phong Thần Bảng');
ok(FENGSHEN_ROSTER.filter((g) => g.name === 'Vương Hổ').length === 2, 'giữ đủ hai người tên Vương Hổ như nguyên tác');
ok(TOTAL === 369, `đủ 369 mục như nguyên văn hồi 99 (${TOTAL})`);

function fresh(tag: string) {
  const fate = life.rollFate(false, 'm');
  life.newLife({ name: 'Test ' + tag, g: 'm', origin: 'mucdong', fate, perks: [] });
  const s = ST.s;
  s.world = 4;
  s.r = 15; s.st = 0;
  s.flags.fengshenWhen = { r: 0, st: 0, prog: 0 };
  return s;
}
const battle = EVENTS.find((e) => e.id === 'fengshen_battle')!;
const choicesOf = () => (typeof battle.ch === 'function' ? battle.ch() : battle.ch) as { t: string; fn: () => string }[];
const saints = () => tc.tcPeople().filter((p) => p.chief && p.fsi === undefined && p.world === 4);

// 0. Chỉ phe nhập kiếp theo nguyên tác mới có trong cuộc chiến
{
  fresh('sides');
  const gate = fs.fengshenGateScene()!;
  const picks = gate.choices.map((c) => c.t);
  ok(!picks.some((t) => t.includes('Tây Phương') || t.includes('Đạo Giáo')), `cổng chỉ cho nhập Xiển, Tiệt hoặc tự lập (${picks.join(', ')})`);
  gate.choices.find((c) => c.t === 'Nhập kiếp · Xiển Giáo')!.fn();
  ok(fs.fengshenData()!.sides.map((x) => x.id).join(',') === 'xianjiao,jiejiao', 'cuộc chiến chỉ có Xiển Giáo và Tiệt Giáo');
}

// 0b. Tam Thanh thuộc đúng tông có thật trên bản đồ Hồng Hoang (gặp trong game thì vào đúng tông)
{
  fresh('tamthanh');
  const hhSects = new Set(Object.values(worldPack(4).sects).map((x) => x.n));
  const want: Record<string, string> = { 'Lão Tử': 'Đạo Giáo · Bát Cảnh Cung', 'Nguyên Thủy Thiên Tôn': 'Xiển Giáo · Ngọc Hư Cung', 'Thông Thiên Giáo Chủ': 'Tiệt Giáo · Bích Du Cung' };
  for (const [name, sect] of Object.entries(want)) {
    const p = tc.tcPeople().find((x) => x.name === name && x.world === 4);
    ok(p?.sect === sect && hhSects.has(sect), `${name} thuộc ${sect} và tông này có trên bản đồ Hồng Hoang`);
  }
}

// 1. Roster có mặt ở Hồng Hoang
{
  fresh('roster');
  const hh = tc.tcPeople().filter((p) => p.world === 4 && p.fsi !== undefined);
  const idx = new Set(hh.map((p) => p.fsi));
  ok(idx.size === TOTAL && hh.length === TOTAL, `mỗi thần vị có đúng một người ở Hồng Hoang (${hh.length}/${TOTAL})`);
  ok(hh.every((p) => p.name === FENGSHEN_ROSTER[p.fsi!].name), 'tên người khớp thần vị');
  const chiefsOnBoard = hh.filter((p) => p.chief).map((p) => p.name);
  ok(chiefsOnBoard.includes('Văn Trọng') && chiefsOnBoard.includes('Vân Tiêu'), `thủ lĩnh thần thoại được gắn thần vị (${chiefsOnBoard.length} vị)`);
  const before = hh.filter((p) => p.alive).length;
  tc.tiencoTick(50_000);
  const after = tc.tcPeople().filter((p) => p.fsi !== undefined && p.alive).length;
  ok(before === after, `5 vạn năm trôi qua không vị nào chết trước Lượng Kiếp (${before} → ${after})`);
}

// 2. Đứng ngoài: thiên mệnh sắc phong đủ bảng
{
  fresh('neutral');
  const gate = fs.fengshenGateScene();
  ok(!!gate, 'cổng Phong Thần mở khi đủ điều kiện');
  const saintsBefore = saints().filter((p) => p.alive).length;
  gate!.choices.find((c) => c.t === 'Không nhập Lượng Kiếp')!.fn();
  const text = choicesOf().find((c) => c.t === 'Rời khỏi chiến địa')!.fn();
  const camp = fs.fengshenData()!;
  ok(camp.ended && camp.board.length === TOTAL, `đứng ngoài: ${camp.board.length}/${TOTAL} người lên bảng`);
  ok(text.includes(String(TOTAL)), 'lời kết nhắc đúng số người');
  ok(camp.board.every((e, i) => e.office === FENGSHEN_ROSTER[i].office && e.name === FENGSHEN_ROSTER[i].name), 'mỗi vị nhận đúng thần chức, đúng thứ tự sắc phong');
  const byName = new Map(camp.board.map((e) => [e.name, e]));
  ok(byName.get('Văn Trọng')?.faction === 'Tiệt Giáo' && byName.get('Hoàng Phi Hổ')?.faction === 'Xiển Giáo' && byName.get('Thân Công Báo')?.faction === 'Xiển Giáo', 'phe hiển thị đúng (Văn Trọng: Tiệt, Hoàng Phi Hổ và Thân Công Báo: Xiển)');
  const alive = tc.tcPeople().filter((p) => p.world === 4 && p.fsi !== undefined && p.alive);
  ok(!alive.length, `mọi vị trên bảng đã tử trận (${alive.length} người còn sống)`);
  ok(saints().filter((p) => p.alive).length === saintsBefore, 'thánh nhân và nhân vật chính không tên trên bảng vẫn sống');
}

// 3. Tham chiến: nhiều cuộc chiến, phe khác nhau
const SIDES = ['Nhập kiếp · Xiển Giáo', 'Nhập kiếp · Tiệt Giáo', 'Nhập kiếp · tự lập đạo thống'];
let zeroRounds = 0, bigRounds = 0, maxRound = 0;
let wars = 0, endedAll = true, saintDeaths = 0, dupBoard = 0, survivorsFlagged = 0, boardTotal = 0, roundsTotal = 0, offBoardDupOffice = 0;
for (let k = 0; k < 40; k++) {
  fresh('war' + k);
  const saintIds = new Set(saints().filter((p) => p.alive).map((p) => p.id));
  fs.fengshenGateScene()!.choices.find((c) => c.t === SIDES[k % SIDES.length])!.fn();
  let rounds = 0;
  while (!fs.fengshenData()!.ended && rounds < 300) {
    const cs = choicesOf();
    // xen kẽ: đánh, giữ thành, thỉnh thoảng đầu hàng giữa chừng
    const pickC = k % 5 === 0 && rounds === 2 ? cs.find((c) => c.t === 'Dẫn phe mình đầu hàng') : rounds % 3 === 2 ? cs.find((c) => c.t === 'Củng cố phòng tuyến') : cs.find((c) => c.t.startsWith('Dốc sức'));
    const before = fs.fengshenData()!.board.length;
    (pickC ?? cs[0]).fn();
    const died = fs.fengshenData()!.board.length - before;
    if (died === 0) zeroRounds++;
    if (died >= 8) bigRounds++;
    maxRound = Math.max(maxRound, died);
    rounds++;
  }
  const camp = fs.fengshenData()!;
  wars++;
  roundsTotal += rounds;
  boardTotal += camp.board.length;
  if (!camp.ended) endedAll = false;
  saintDeaths += tc.tcPeople().filter((p) => saintIds.has(p.id) && !p.alive).length;
  if (new Set(camp.board.map((e) => e.id)).size !== camp.board.length) dupBoard++;
  survivorsFlagged += tc.tcPeople().filter((p) => p.fengshen).length;
  const extra = camp.board.filter((e) => !e.dept).map((e) => e.office);
  if (extra.length <= 12 && new Set(extra).size !== extra.length) offBoardDupOffice++;
}
ok(endedAll, `${wars} cuộc chiến tham chiến đều kết thúc (trung bình ${(roundsTotal / wars).toFixed(1)} trận)`);
ok(saintDeaths === 0, `không thánh nhân hay nhân vật chính nào tử trận (${saintDeaths})`);
ok(dupBoard === 0, 'không ai bị ghi lên bảng hai lần');
ok(survivorsFlagged === 0, 'người sống sót trở lại vòng đời sau khi Lượng Kiếp khép lại');
ok(offBoardDupOffice === 0, 'người ngoài danh sách không chiếm trùng chức phụ');
ok(zeroRounds > 0, `có trận không ai tử trận (${zeroRounds} trận)`);
console.log(`  số người tử trận mỗi trận ngẫu nhiên: nhiều nhất ${maxRound}, ${bigRounds} trận từ 8 người trở lên; tổng ${boardTotal} người qua ${roundsTotal} trận`);

// 4. Phe mình đầu hàng thì không còn lệnh xuất trận
{
  fresh('surrender');
  fs.fengshenGateScene()!.choices.find((c) => c.t === 'Nhập kiếp · tự lập đạo thống')!.fn();
  const camp = fs.fengshenData()!;
  for (const side of camp.sides) side.power = 30;
  choicesOf().find((c) => c.t === 'Dẫn phe mình đầu hàng')!.fn();
  const cs = choicesOf().map((c) => c.t);
  ok(!camp.ended && !cs.some((t) => t.startsWith('Dốc sức')) && cs.includes('Theo dõi chiến cuộc'), `sau khi đầu hàng chỉ còn theo dõi (${cs.join(', ')})`);
}

// 5. Hai phe cuối cùng thế lực 1: vẫn có phe thắng, cuộc chiến không treo
{
  fresh('edge');
  fs.fengshenGateScene()!.choices.find((c) => c.t === 'Nhập kiếp · tự lập đạo thống')!.fn();
  const camp = fs.fengshenData()!;
  camp.sides.find((x) => x.id === 'self')!.status = 'surrendered';
  camp.sides.find((x) => x.id === 'xianjiao')!.power = 1;
  camp.sides.find((x) => x.id === 'jiejiao')!.power = 1;
  choicesOf().find((c) => c.t === 'Theo dõi chiến cuộc')!.fn();
  ok(camp.ended && !!camp.winner, `trận cuối với hai phe thế lực 1 vẫn khép lại (phe thắng: ${camp.winner})`);
}

console.log(fails ? `\n${fails} FAIL` : '\nTất cả PASS');
process.exit(fails ? 1 : 0);
