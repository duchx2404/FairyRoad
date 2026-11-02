export {};
// Hôn thê không chết vì tai nạn ngẫu nhiên; bản lưu cũ có hôn thê chết kiểu đó thì sống lại và có mặt ở cảnh 16 tuổi.
// Chạy: npx tsx tools/test_revive.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const tick = await import('../src/engine/npctick');
const D = await import('../src/events/diephd');
const { ORIGINS } = await import('../src/data/core');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const org = ORIGINS.find((o) => o.id === 'diep_hondon')!;
life.newLife({ name: 'Diệp Thử', g: 'm', origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
const s = ST.s;
s.flags.childhood = false;
s.born = s.year - 12;
const ids = s.flags.dhBrides as string[];
// 1) 2000 năm mô phỏng tai nạn: hôn thê tư chất thấp không chết (chưa tới thọ tận)
const b = s.npcs.find((n) => n.id === ids[0])!;
b.talent = 1.5; b.life = 99999;
for (let i = 0; i < 2000; i++) tick.npcTick(b, 1);
ok(b.alive, 'Hôn thê tư chất 1.5 qua 2000 năm mô phỏng: không chết vì tai nạn ngẫu nhiên');
// 2) bản lưu cũ: hôn thê đã "tẩu hỏa nhập ma" → sống lại, có mặt ở cảnh định đoạt
const d = s.npcs.find((n) => n.id === ids[1])!;
d.alive = false; d.died = s.year; d.cause = 'tẩu hỏa nhập ma';
s.born = s.year - 16;
for (const id of ids) s.npcs.find((n) => n.id === id)!.rel = 200; // ai cũng giữ hôn ước: cảnh kể hết mọi người
const sc = D.engageScene();
ok(d.alive && sc.text.includes(d.name), `Bản lưu cũ: ${d.name} sống lại và có mặt ở cảnh 16 tuổi`);
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
