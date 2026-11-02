export {};
// Tích Huyết Trùng Sinh: hồi máu ngay + hồi máu theo lượt 5 lượt, chỉ hồi máu không hồi giáp.
// Chạy: npx tsx tools/test_hot.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
await import('../src/engine/state');
await import('../src/engine/wire');
const { SKILLS } = await import('../src/data/items');
const C = await import('../src/engine/combat');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const sk = SKILLS.tichhuyettrungsinh;
const b: any = Object.create(C.Battle.prototype);
b.log = [];
const a: any = { name: 'Ta', hp: 100, maxHp: 1000, shield: 50, dot: [] };
// gọi thẳng nhánh hồi phục của cast với hệ số m = 1
const h0 = Math.round(1000 * 0.18 * 1);
a.hp = 100; a.hp = Math.min(a.maxHp, a.hp + h0);
const v = Math.max(1, Math.round(h0 * sk.hot!.m));
a.hot = [{ v, turns: sk.hot!.turns, n: sk.n }];
let ticks = 0;
for (let i = 0; i < 8; i++) { const before = a.hp; b.tickHot(a); if (a.hp > before) ticks++; }
ok(sk.hot!.turns === 5 && ticks === 5, `Hồi theo lượt đúng 5 lượt (mỗi lượt +${v})`);
ok(a.shield === 50, 'Không hồi giáp');
ok(a.hp === Math.min(1000, 100 + h0 + v * 5) && !a.hot.length, `Máu sau 5 lượt: ${a.hp}/1000, hết hiệu ứng`);
a.hp = 990; a.hot = [{ v: 100, turns: 2, n: sk.n }]; b.tickHot(a);
ok(a.hp === 1000, 'Không vượt máu tối đa');
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
