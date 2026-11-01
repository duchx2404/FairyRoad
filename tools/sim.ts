export {};
// Bot chơi tự động nhiều kiếp để bắt lỗi và đo cân bằng. Chạy: npx tsx tools/sim.ts [số kiếp]
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };

const ST = await import('../src/engine/state');
await import('../src/engine/wire');
await import('../src/events/core');
await import('../src/events/town');
await import('../src/events/wild');
await import('../src/events/life');
await import('../src/events/clan');
await import('../src/events/scion');
await import('../src/events/betrothal');
await import('../src/events/spirit');
await import('../src/events/shj');
await import('../src/events/random');
await import('../src/events/congtu');
await import('../src/events/suitor');
await import('../src/events/heroine');
await import('../src/events/tienco');
await import('../src/data/worlds');
const life = await import('../src/engine/life');
const act = await import('../src/engine/actions');
const core = await import('../src/engine/core');
const char = await import('../src/engine/char');
const { EVENTS } = await import('../src/engine/events');
const { LOC_LIST } = await import('../src/data/world');
const { ORIGINS } = await import('../src/data/core');
const { canJoin, joinSect } = await import('../src/engine/sect');
const { usePill } = await import('../src/engine/items');
const { PILLS } = await import('../src/data/items');

const N = Number(process.argv[2] || 150);
const errors = new Map<string, number>();
const evCount = new Map<string, number>();
const realms: number[] = Array(10).fill(0);
const causes = new Map<string, number>();
let ages = 0;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function err(where: string, e: unknown) {
  const k = where + ': ' + String((e as Error)?.stack?.split('\n').slice(0, 3).join(' | ') || e);
  errors.set(k, (errors.get(k) || 0) + 1);
}
function playScene(sc: any, depth = 0) {
  if (sc.ev) evCount.set(sc.ev, (evCount.get(sc.ev) || 0) + 1);
  let ch = sc.choices;
  let d = 0;
  while (ch && ch.length && d < 6) {
    const ok = ch.filter((c: any) => !c.dis);
    if (!ok.length) break;
    const safe = ok.filter((c: any) => c.cls !== 'danger' && !/Giao chiến|đánh|Rút kiếm/i.test(c.t));
    const c = (process.env.CAREFUL && safe.length && Math.random() < 0.85 ? pick(safe) : pick(ok)) as any;
    let out: any;
    try { out = c.fn(); } catch (e) { err(`choice ${sc.ev || sc.title} / ${c.t}`, e); break; }
    if (typeof out !== 'string' && typeof out?.text !== 'string') err(`badOutcome ${sc.ev}`, JSON.stringify(out)?.slice(0, 80));
    ch = typeof out === 'string' ? null : out.choices;
    d++;
    if (core.pendingDeath()) break;
  }
  void depth;
}
function settle() {
  const pd = core.pendingDeath();
  if (pd && !ST.s.dead) { core.clearPendingDeath(); life.die(pd); }
  life.checkAch();
}

for (let i = 0; i < N; i++) {
  const origins = ORIGINS.filter((o) => !o.karma);
  const fate = life.rollFate(false, 'm');
  if (process.env.THAP) fate.root = { k: 11, els: ['kim', 'moc', 'thuy', 'hoa', 'tho', 'bang', 'loi', 'phong', 'am', 'quang'] };
  life.newLife({ name: 'Bot ' + i, g: Math.random() < 0.5 ? 'm' : 'f', origin: process.env.ORIGIN ? pick(process.env.ORIGIN.split(',')) : pick(origins).id, fate: process.env.ORIGIN ? life.fitRoot(fate, ORIGINS.find((o) => o.id === process.env.ORIGIN!.split(',')[0])!) : fate, perks: fate.perkOffer.slice(0, 2) });
  let steps = 0;
  while (!ST.s.dead && !ST.s.ascended && steps < 4000) {
    steps++;
    let sc: any;
    try {
      if (char.atBottleneck()) {
        sc = act.breakthroughScene();
      } else if (ST.s.hurt > 55) sc = act.rest();
      else {
        // dùng đan tu luyện
        for (const b of [...ST.s.bag]) if (b.id.startsWith('p:') && ['cult', 'heal', 'stat', 'root', 'life'].includes(PILLS[b.id.slice(2)]?.k)) usePill(b.id.slice(2), b.g ?? 1);
        const l = LOC_LIST.find((x) => x.id === ST.s.loc)!;
        const r = Math.random();
        if (l.type === 'sect' && !ST.s.sect && canJoin(l.sect!).ok) sc = { title: 'join', text: joinSect(l.sect!) };
        else if (r < 0.5) sc = act.cultivate(5);
        else if (r < 0.62) sc = l.type === 'wild' || l.type === 'realm' ? act.explore() : act.wander();
        else if (r < 0.68) sc = act.work();
        else if (r < 0.74 && ST.s.pins.length) sc = act.visitPin(pick(ST.s.pins));
        else if (r < 0.8) {
          const cand = LOC_LIST.filter((x) => !act.travelInfo(x).block && (!ST.s.sect || Math.random() < 0.3));
          sc = cand.length ? act.travelTo(pick(cand).id) : act.cultivate(1);
        } else if (r < 0.86 && ST.s.npcs.some((n) => n.alive)) {
          const n = pick(ST.s.npcs.filter((x) => x.alive));
          sc = { title: n.name, text: '', choices: act.npcActions(n.id) };
        } else if (r < 0.9) sc = act.gatherScene(false);
        else sc = act.cultivate(1);
      }
      playScene(sc);
    } catch (e) { err('action', e); }
    act.drainFights();
    settle();
  }
  if (!ST.s.dead && !ST.s.ascended) { life.die('Hết bước mô phỏng'); }
  realms[ST.s.ascended ? 9 : ST.s.r]++;
  if (process.env.BTSTAT) { const f = ST.s.flags; const dl = ST.s.npcs.find((n: any) => n.tag === 'daolu'); const k = !f.betrothed ? 'không hôn ước' : dl && dl.id === f.betrothed ? 'cưới hôn thê/phu' : dl && dl.id === f.outsider ? 'cưới thánh tử/nữ nơi khác' : f.engageBroken ? (f.outsider ? 'bị từ hôn, có gặp người mới' : 'bị từ hôn') : 'giữ hôn ước, chưa cưới'; (globalThis as any).bt = (globalThis as any).bt || {}; (globalThis as any).bt[k] = ((globalThis as any).bt[k] || 0) + 1; }
  if (process.env.THAP) { const aw = ST.s.marks.find((m: any) => m.t.includes('Thập linh căn bị thiên hạ')); (globalThis as any).aw = ((globalThis as any).aw || []); (globalThis as any).aw.push(aw ? Math.floor(aw.y - ST.s.born) : -1); }
  if (process.env.KILLS) console.log('r', ST.s.r, 'root', ST.s.root.k, 'age', Math.floor(char.age()), '|', ST.s.dead?.cause, '| last:', ST.s.log.slice(-2).map((l: any) => l.t.slice(0, 90)).join(' // '));
  const c = (ST.s.dead?.cause || 'Phi thăng').replace(/dưới tay .*/, 'dưới tay …').replace(/Đột phá .* thất bại.*/, 'Đột phá thất bại');
  causes.set(c, (causes.get(c) || 0) + 1);
  ages += char.age();
}

console.log(`\n=== ${N} kiếp ===`);
console.log('Cảnh giới cuối (0..8, 9=phi thăng):', realms.join(' / '));
if (process.env.THAP) console.log('Tuổi thức tỉnh (-1 = không):', (globalThis as any).aw.join(' '));
if (process.env.BTSTAT) console.log('Hôn ước:', (globalThis as any).bt);
console.log('Tuổi TB:', Math.round(ages / N));
console.log('Nguyên nhân chết:', [...causes].sort((a, b) => b[1] - a[1]).slice(0, 8));
console.log(`Sự kiện: ${EVENTS.length} đăng ký, ${evCount.size} đã gặp. Chưa gặp:`, EVENTS.filter((e) => !evCount.has(e.id)).map((e) => e.id).join(', '));
console.log(`\nLỗi (${errors.size}):`);
for (const [k, v] of [...errors].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(v + '×', k);
