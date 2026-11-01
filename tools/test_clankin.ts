export {};
// Kiểm tra Nhân mạch thế gia: tộc có đủ người chủ chốt (cha mẹ, lão tổ, trưởng lão, thúc bá, anh chị em).
// Chạy: npx tsx tools/test_clankin.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };
const ST = await import('../src/engine/state');
await import('../src/engine/wire');
const life = await import('../src/engine/life');
const core = await import('../src/engine/core');
const { ORIGINS, CLANS } = await import('../src/data/core');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const origins = ['diep_hondon', ...Object.keys(CLANS).map((c) => 'thegia_' + c)];
for (const origin of origins) {
  const org = ORIGINS.find((o) => o.id === origin)!;
  life.newLife({ name: 'Diệp Test', g: 'm', origin, fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
  const s = ST.s;
  const sur = CLANS[org.clanId!].sur;
  const kin = s.npcs.filter((n) => n.tag === 'kin' && n.name.startsWith(sur + ' '));
  const names = s.npcs.map((n) => n.name);
  if (origin === 'diep_hondon' || origin === 'thegia_diep' || origin === 'thegia_ta') {
    console.log(`--- ${origin}`);
    for (const n of s.npcs.filter((x) => x.name.startsWith(sur + ' '))) console.log(`  [${n.tag}] ${n.name} · ${core.npcRealm(n)} · ${core.npcAge(n)} tuổi · ${n.how}`);
  }
  ok(kin.length >= 8, `${origin}: ${kin.length} người thân trong tộc`);
  ok(new Set(names).size === names.length, `${origin}: không trùng tên ${names.filter((x, i) => names.indexOf(x) !== i).map((x) => s.npcs.filter((n) => n.name === x).map((n) => n.how.slice(0, 40)).join(" / ")).join("; ")}`);
  ok(kin.every((n) => n.alive && core.npcAge(n) < n.life), `${origin}: người thân còn trong thọ nguyên`);
}
// bản lưu cũ: chỉ còn cha mẹ + lão tổ, đã qua 20 năm
{
  const org = ORIGINS.find((o) => o.id === 'diep_hondon')!;
  life.newLife({ name: 'Diệp Cũ', g: 'm', origin: 'diep_hondon', fate: life.fitRoot(life.rollFate(false, 'm'), org), perks: [] });
  const s = ST.s;
  const keep = s.npcs.filter((n) => !(n.name.startsWith('Diệp ') && /trưởng lão|thúc|Nghĩa|Đường huynh|phu nhân|phu quân/.test(n.how)));
  s.npcs.splice(0, s.npcs.length, ...keep);
  delete s.flags.clanHouseV1;
  s.year += 20;
  const before = s.npcs.filter((n) => n.tag === 'kin' && n.name.startsWith('Diệp ')).length;
  life.syncClanHouse();
  const after = s.npcs.filter((n) => n.tag === 'kin' && n.name.startsWith('Diệp ')).length;
  const sib = s.npcs.find((n) => /Nghĩa (huynh|tỷ)/.test(n.how))!;
  ok(before === 2 && after === 8, `bản lưu cũ: ${before} → ${after} người thân`);
  ok(core.npcAge(sib) >= 25, `bản lưu cũ: nghĩa huynh/tỷ ${core.npcAge(sib)} tuổi (lớn hơn ngươi)`);
  life.syncClanHouse();
  ok(s.npcs.filter((n) => n.tag === 'kin' && n.name.startsWith('Diệp ')).length === after, 'bản lưu cũ: chỉ bổ sung một lần');
}
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
process.exit(fails ? 1 : 0);
