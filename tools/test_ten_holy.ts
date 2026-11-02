export {};
// Hôn ước Diệp gia Hỗn Độn:
// - Trước 16 tuổi gia nhập tông môn / đại hoàng triều: các vị hôn thê gửi thư CHÚC MỪNG (cùng tông thì gặp mặt, đứng đầu cảnh).
// - Năm 16 tuổi: thư bàn về hôn ước. Đang ở thánh địa thì không ai từ hôn; thánh nữ cùng tông gặp mặt trực tiếp, luôn giữ.
// - Trước 16 tuổi chưa định đoạt; sau khi đã định đoạt thì gia nhập không còn thư chúc mừng.
// Chạy: npx tsx tools/test_ten_holy.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const sect = await import('../src/engine/sect');
const bride = await import('../src/engine/bride');
const D = await import('../src/events/diephd');
const { ORIGINS } = await import('../src/data/core');
const { SECTS, EMPIRES } = await import('../src/data/world');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const org = ORIGINS.find((o) => o.id === 'diep_hondon')!;

function setup(age: number) {
  life.newLife({ name: 'Diệp Thử', g: 'm', origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
  const s = ST.s;
  s.flags.childhood = false;
  s.born = s.year - age;
  for (const id of s.flags.dhBrides as string[]) s.npcs.find((x) => x.id === id)!.rel = -30; // thiện cảm thấp: bình thường sẽ bị từ hôn
  return s;
}
const holyBride = (s: typeof ST.s, sectId: string) =>
  s.npcs.filter((x) => (s.flags.dhBrides as string[]).includes(x.id) && x.sect === sectId && x.how.startsWith(`Thánh nữ ${SECTS[sectId].n}`));

// mốc định đoạt dời sang 16 tuổi
{
  const s = setup(10);
  ok(!D.needEngageScene(), '10 tuổi: chưa định đoạt hôn ước');
  s.born = s.year - 15.9;
  ok(!D.needEngageScene(), '15 tuổi: chưa định đoạt hôn ước');
  s.born = s.year - 16;
  ok(D.needEngageScene(), '16 tuổi: tới lúc định đoạt hôn ước');
}

for (let run = 0; run < 5; run++) {
  const s = setup(12);
  sect.joinSect('tutieu', 2);
  ok(D.needCongratsScene(), `Tử Tiêu ${run + 1}: gia nhập lúc 12 tuổi → có thư chúc mừng`);
  const n = (s.flags.dhBrides as string[]).length;
  const cg = D.congratsScene()!;
  const cParts = cg.text.split('\n\n').slice(1, 1 + n);
  const peers = holyBride(s, 'tutieu');
  ok(cParts.filter((l) => !l.includes('không viết thư mà')).every((l) => /[Mm]ừng/.test(l)), `Tử Tiêu ${run + 1}: thư nào cũng chúc mừng`);
  ok(peers.every((p, i) => cParts[i].startsWith(p.name) && cParts[i].includes('không viết thư mà')), `Tử Tiêu ${run + 1}: ${peers.length} thánh nữ Tử Tiêu gặp mặt trực tiếp, đứng đầu cảnh`);
  ok(!s.flags.dhDecided && !((s.flags.dhKept as string[]) || []).length, `Tử Tiêu ${run + 1}: chúc mừng chưa định đoạt hôn ước`);
  ok(!/hôn ước|hôn phu|ước cũ|ngọc bội định thân/i.test(cg.text), `Tử Tiêu ${run + 1}: thư và lời gặp mặt lúc nhập môn không nhắc tới hôn ước`);
  ok(!D.needCongratsScene(), `Tử Tiêu ${run + 1}: thư chúc mừng chỉ hiện một lần`);

  s.born = s.year - 16;
  const sc = D.engageScene();
  const kept = ((s.flags.dhKept as string[]) || []).length;
  ok(!sc.choices?.length && kept === n, `Tử Tiêu ${run + 1}: 16 tuổi giữ ${kept}/${n} hôn ước, không có cảnh từ hôn`);
  ok(sc.title.includes('mười sáu') && !/vực ngoài khổ|Chúc mừng ngươi/.test(sc.text), `Tử Tiêu ${run + 1}: 16 tuổi là thư bàn hôn ước, không phải thư chúc mừng`);
  const parts = sc.text.split('\n\n').slice(1, 1 + n);
  ok(peers.every((p, i) => parts[i].startsWith(p.name) && parts[i].includes('không viết thư mà')), `Tử Tiêu ${run + 1}: 16 tuổi thánh nữ cùng tông gặp mặt bàn hôn ước`);
}
// tông khác có thánh nữ hôn ước: vẫn gặp mặt, vẫn giữ dù thiện cảm thấp
for (let run = 0; run < 5; run++) {
  const s = setup(16);
  const b = s.npcs.find((x) => (s.flags.dhBrides as string[]).includes(x.id) && x.sect && x.sect !== 'tutieu' && x.how.startsWith(`Thánh nữ ${SECTS[x.sect].n}`))!;
  sect.joinSect(b.sect!, 2);
  const sc = D.engageScene();
  const first = sc.text.split('\n\n')[1];
  ok(first.startsWith(b.name) && first.includes('không viết thư mà') && ((s.flags.dhKept as string[]) || []).includes(b.id), `${SECTS[b.sect!].n}: ${b.name} gặp mặt trực tiếp, giữ hôn ước`);
}
// đại hoàng triều: nhận chức trước 16 tuổi → thư chúc mừng
{
  const s = setup(13);
  s.flags.court = { id: 'daichu', rank: 0, favor: 10, lastPay: Math.floor(s.year) };
  bride.queueJoinCongrats('court:daichu');
  const cg = D.needCongratsScene() ? D.congratsScene() : null;
  ok(!!cg && cg.text.includes(`được ${EMPIRES.daichu.n} phong làm`) && !cg.text.includes('không viết thư mà'), 'Đại Chu: nhận chức lúc 13 tuổi → thư chúc mừng, không ai gặp mặt');
}
// đã định đoạt rồi mới gia nhập: không còn thư chúc mừng
{
  const s = setup(16);
  D.engageScene();
  sect.joinSect('tutieu', 2);
  ok(!D.needCongratsScene() && !s.flags.dhCongrats, 'Gia nhập sau khi đã định đoạt: không có thư chúc mừng');
}
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
