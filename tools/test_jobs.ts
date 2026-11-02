export {};
// Nhiệm Vụ Đường: 3 việc tay nghề cố định (đan / khí / phù), 3 tháng, giao nộp cộng cống hiến + thuần thục.
// Chạy: npx tsx tools/test_jobs.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const sect = await import('../src/engine/sect');
const X = await import('../src/engine/sectx');
const core = await import('../src/engine/core');
const { ORIGINS } = await import('../src/data/core');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const org = ORIGINS[0];
life.newLife({ name: 'Thử', g: 'm', origin: org.id, fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
const s = ST.s;
s.sect = null;
sect.joinSect('tutieu', 2);
const b = X.jobBoard();
const crafts = b.filter((j) => j.craft);
ok(crafts.length === 3 && ['alch', 'forge', 'talis'].every((k) => crafts.some((j) => j.craft === k)), `Bảng có đủ 3 việc tay nghề: ${crafts.map((j) => j.n).join(', ')}`);
ok(crafts.every((j) => j.dur === 0.25 && j.reward > 0 && (j.xp ?? 0) > 0), `Mỗi việc 3 tháng, có cống hiến và thuần thục (${crafts.map((j) => `+${j.reward}/+${j.xp}`).join(' ')})`);
const alch = crafts.find((j) => j.craft === 'alch')!;
X.takeJob(alch);
ok(!X.jobBoard().some((j) => j.key === alch.key), 'Đang làm thì việc ẩn khỏi bảng');
s.year = Math.floor(s.year) + 1 + 11 / 12; // sang năm mới: bảng đổi, việc đã nhận vẫn còn
ok(X.myJobs().some((j) => j.key === alch.key), 'Việc đã nhận không mất khi bảng đổi năm');
const xp0 = s.craft.ax, lv0 = s.craft.alch, c0 = s.sect!.contrib;
const t = X.deliverJobs();
ok(s.sect!.contrib === c0 + alch.reward && (s.craft.alch > lv0 || s.craft.ax > xp0), `Giao nộp: ${t}`);
ok(X.jobBoard().some((j) => j.key === alch.key), 'Giao nộp xong, việc luyện đan lại hiện trên bảng');
// đúng 3 tháng sau là giao nộp được
const a2 = X.jobBoard().find((j) => j.craft === 'forge')!;
X.takeJob(a2);
for (let i = 0; i < 3; i++) core.passTime(1 / 12);
ok(X.jobDone(X.myJobs().find((j) => j.key === a2.key)!), 'Sau đúng 3 tháng: giao nộp được');
// việc khác: nhận một việc thì các việc còn lại giữ nguyên; giao nộp xong thì mất hẳn
s.flags.sjobs = [];
const others = X.jobBoard().filter((j) => !j.craft);
const first = others[0];
X.takeJob(first);
const after = X.jobBoard().filter((j) => !j.craft);
ok(after.length === others.length - 1 && after.every((j) => others.some((o) => o.key === j.key && o.n === j.n && o.reward === j.reward)), 'Nhận một việc: các việc còn lại giữ nguyên tên, thưởng');
X.myJobs()[0].end = s.year;
X.deliverJobs();
ok(!X.jobBoard().some((j) => j.key === first.key), 'Giao nộp xong: việc đó không hiện lại trên bảng');
// việc tay nghề: cảnh phong chủ giao việc → bấm làm → thời gian +3 tháng, việc xong, giao nộp được ngay
s.flags.sjobs = [];
const tj = X.jobBoard().find((j) => j.craft === 'talis')!;
const sc = X.craftJobScene(tj);
ok(/Phù Phong phong chủ/.test(sc.text) && sc.choices!.length === 2, 'Cảnh giao việc chế phù: phong chủ Phù Phong dẫn chuyện');
const y0 = s.year;
const done = sc.choices![0].fn() as any;
ok(Math.abs(s.year - y0 - 0.25) < 1e-6 && X.myJobs().some((j) => j.key === tj.key && X.jobDone(j)), 'Bấm làm: thời gian +3 tháng, việc đã xong');
const c1 = s.sect!.contrib;
const dt = done.choices.find((c: any) => c.t === 'Giao nộp ngay').fn();
ok(s.sect!.contrib === c1 + tj.reward && X.myJobs().length === 0, `Giao nộp ngay: ${dt}`);
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
