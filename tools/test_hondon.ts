export {};
// Kiểm thử nhiệm vụ Hỗn Độn Thạch: bot Diệp gia Hỗn Độn, Hợp Đạo, ở Hỗn Độn giới → lấy đá → sửa Hỗn Độn Tàn Kiếm.
// Chạy: npx tsx tools/test_hondon.ts [số lần thử, mặc định 20]
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };

const ST = await import('../src/engine/state');
await import('../src/engine/wire');
await import('../src/events/wild');
await import('../src/data/worlds');
const life = await import('../src/engine/life');
const char = await import('../src/engine/char');
const { EVENTS } = await import('../src/engine/events');
const { LOC_LIST } = await import('../src/data/world');
const { ORIGINS, REALMS, WORLD, LAST_WORLD, worldName } = await import('../src/data/core');
const { repairChaosSword, isChaosBroken, gearLine } = await import('../src/engine/items');
const { drainFights } = await import('../src/engine/actions');

const N = Number(process.argv[2] || 20);
const HD = REALMS.findIndex((r) => r.n === 'Hợp Đạo');
const ev = EVENTS.find((e) => e.id === 'wild_hondonthach')!;
const text = (o: any): string => (typeof o === 'string' ? o : o?.text ?? JSON.stringify(o));

function setup() {
  const org = ORIGINS.find((o) => o.id === 'diep_hondon')!;
  life.newLife({ name: 'Diệp Thần (bot)', g: 'm', origin: org.id, fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
  const s = ST.s;
  delete s.flags.childhood;
  while ((s.world ?? 0) < LAST_WORLD) life.ascend();
  s.r = HD; s.st = 0; s.prog = 0; s.hurt = 0;
  const wild = LOC_LIST.filter((l) => l.type === 'wild');
  s.loc = wild[0].id;
  return s;
}

let got = 0, won = 0, lost = 0, died = 0;
for (let i = 0; i < N; i++) {
  const s = setup();
  if (i === 0) {
    const sw = s.gear[0]!;
    console.log(`Nhân vật: ${s.name} · ${REALMS[s.r].n} · ${worldName(WORLD.lv)} (giới ${WORLD.lv}/${LAST_WORLD}) · tại ${LOC_LIST.find((l) => l.id === s.loc)?.n}`);
    console.log(`Kiếm trước: ${sw.n} · ${gearLine(sw)} · tàn khuyết=${isChaosBroken(sw)}`);
    console.log(`Sự kiện ${ev.id} đủ điều kiện: ${ev.cond ? ev.cond() : true}\n`);
  }
  const chs = ev.ch();
  const c = process.env.FIGHT ? chs[0] : chs.find((x) => x.t.includes('kiếm tàn khuyết')) ?? chs[0];
  if (i === 0) console.log('Mô tả:', ev.text(), '\nLựa chọn:', chs.map((x) => `[${x.t}${x.hint ? ' · ' + x.hint : ''}]`).join(' '), `\n→ chọn: ${c.t}\n`);
  const out = text(c.fn());
  drainFights();
  const has = char.count('m:hondonthach') > 0;
  if (s.dead) died++; else if (has) { got++; won++; } else lost++;
  if (i === 0) console.log('Kết quả:', out.replace(/\s+/g, ' ').slice(0, 700), '\n');
  if (has && got === 1) {
    const sw = s.gear[0]!;
    const atk0 = char.atkOf(), hp0 = char.maxHp(), def0 = char.defOf();
    console.log('Sửa kiếm:', repairChaosSword(sw.uid));
    console.log(`Kiếm sau: ${sw.n} · ${gearLine(sw)} · tàn khuyết=${isChaosBroken(sw)}`);
    console.log(`Chỉ số nhân vật: công ${atk0} → ${char.atkOf()}, thủ ${def0} → ${char.defOf()}, huyết ${hp0} → ${char.maxHp()}`);
    console.log(`Còn Hỗn Độn Thạch: ${char.count('m:hondonthach')} · thử sửa lần 2: "${repairChaosSword(sw.uid) || '(không làm gì — đã sửa)'}"\n`);
  }
}
console.log(`=== ${N} lần thử (chọn "${process.env.FIGHT ? 'tự đánh' : 'kiếm dẫn đường'}") === lấy được đá: ${got} · thua/chạy: ${lost} · tử trận: ${died}`);

// ===== Luật Đại Đạo chỉ có một =====
{
  const { beastFoe, mkFoe } = await import('../src/engine/combat');
  const { mkNpc } = await import('../src/engine/core');
  const { BEASTS } = await import('../src/data/world');
  const act = await import('../src/engine/actions');
  const { DAI_DAO, RMAX } = await import('../src/data/core');
  const s = setup();
  let maxBeast = 0, maxNpc = 0, maxFoe = 0;
  for (let i = 0; i < 500; i++) {
    maxBeast = Math.max(maxBeast, beastFoe(RMAX()).spec.r);
    maxNpc = Math.max(maxNpc, mkNpc({ r: RMAX() }).r);
    maxFoe = Math.max(maxFoe, mkFoe({ name: 'x', r: RMAX() }).r);
  }
  console.log(`\nLuật Đại Đạo · trần giới Hỗn Độn = ${REALMS[RMAX()].n}`);
  console.log(`Cao nhất trong 500 lần: yêu thú ${REALMS[maxBeast].n} · NPC ${REALMS[maxNpc].n} · địch ${REALMS[maxFoe].n}`);
  for (const n of ['Tổ Long', 'Chân Phượng', 'Thủy Kỳ Lân']) { const b = BEASTS.find((x) => x.n === n); console.log(`${n}: ${b ? REALMS[b.lv[0]].n : '(không có trong giới này)'}`); }
  s.st = 3; s.prog = 100;
  const sc: any = act.breakthroughScene();
  console.log(`Hợp Đạo viên mãn → cảnh: "${sc.title}"\n  ${sc.text}\n  Lựa chọn: ${sc.choices.map((c: any) => `[${c.t}${c.hint ? ' · ' + c.hint : ''}]`).join(' ')}`);
  let win = 0; const T = Number(process.env.DAO || 10);
  for (let i = 0; i < T; i++) {
    const p = setup(); p.st = 3; p.prog = 100;
    const out: any = (act.breakthroughScene() as any).choices[0].fn(); drainFights();
    const { pendingDeath } = await import('../src/engine/core');
    if (p.r === DAI_DAO) win++;
    if (i === 0) console.log('  Trận mẫu:', String(typeof out === 'string' ? out : out.text).replace(/\s+/g, ' ').slice(0, 400), pendingDeath() ? '(tử trận)' : '');
  }
  console.log(`Khiêu chiến ${T} lần (kiếm chưa sửa): thắng, thành Đại Đạo ${win}/${T}`);
}
