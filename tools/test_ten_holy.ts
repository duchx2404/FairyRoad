export {};
// Năm mười tuổi:
// - Đã bái vào thánh địa: không vị hôn thê nào từ hôn, thư là thư chúc mừng.
// - Thánh nữ của chính tông môn ngươi vào (bất kỳ tông nào): không viết thư mà gặp mặt trước đông người, luôn giữ hôn ước, đứng đầu cảnh.
// Chạy: npx tsx tools/test_ten_holy.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const sect = await import('../src/engine/sect');
const D = await import('../src/events/diephd');
const { ORIGINS } = await import('../src/data/core');
const { SECTS } = await import('../src/data/world');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const org = ORIGINS.find((o) => o.id === 'diep_hondon')!;

function setup() {
  life.newLife({ name: 'Diệp Thử', g: 'm', origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
  const s = ST.s;
  s.flags.childhood = false;
  s.born = s.year - 10;
  for (const id of s.flags.dhBrides as string[]) s.npcs.find((x) => x.id === id)!.rel = -30; // thiện cảm thấp: bình thường sẽ bị từ hôn
  return s;
}
const holyBride = (s: typeof ST.s, sectId: string) =>
  s.npcs.filter((x) => (s.flags.dhBrides as string[]).includes(x.id) && x.sect === sectId && x.how.startsWith(`Thánh nữ ${SECTS[sectId].n}`));

for (let run = 0; run < 5; run++) {
  const s = setup();
  sect.joinSect('tutieu', 2);
  const sc = D.tenScene();
  const n = (s.flags.dhBrides as string[]).length;
  const kept = ((s.flags.dhKept as string[]) || []).length;
  ok(!sc.choices?.length && kept === n, `Tử Tiêu ${run + 1}: giữ ${kept}/${n} hôn ước, không có cảnh từ hôn`);
  const parts = sc.text.split('\n\n').slice(1, 1 + n);
  const letters = parts.filter((l) => !l.includes('không viết thư mà'));
  ok(letters.every((l) => /[Mm]ừng/.test(l)) && !/vực ngoài khổ|Sư môn ép ta từ hôn/.test(sc.text), `Tử Tiêu ${run + 1}: thư nào cũng chúc mừng`);
  const peers = holyBride(s, 'tutieu');
  ok(peers.every((p) => parts[0].startsWith(p.name) && parts[0].includes('không viết thư mà')), `Tử Tiêu ${run + 1}: ${peers.length} thánh nữ Tử Tiêu gặp mặt trực tiếp, đứng đầu cảnh`);
}
// tông khác có thánh nữ hôn ước: vẫn gặp mặt, vẫn giữ dù thiện cảm thấp
for (let run = 0; run < 5; run++) {
  const s = setup();
  const b = s.npcs.find((x) => (s.flags.dhBrides as string[]).includes(x.id) && x.sect && x.sect !== 'tutieu' && x.how.startsWith(`Thánh nữ ${SECTS[x.sect].n}`))!;
  sect.joinSect(b.sect!, 2);
  const sc = D.tenScene();
  const first = sc.text.split('\n\n')[1];
  ok(first.startsWith(b.name) && first.includes('không viết thư mà') && ((s.flags.dhKept as string[]) || []).includes(b.id), `${SECTS[b.sect!].n}: ${b.name} gặp mặt trực tiếp, giữ hôn ước`);
}
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
