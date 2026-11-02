export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
await import('../src/events/life');
const { newLife, rollFate } = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const { mkNpc } = await import('../src/engine/core');
const { npcActions, songTuWith } = await import('../src/engine/actions');
const { EVENTS } = await import('../src/engine/events');
const { canSongTu } = await import('../src/engine/songtu');
const { fillSongTuTemplate, writeSongTu, loadSongTuPrompt } = await import('../src/ai/songtu');
function check(x: unknown, message: string): asserts x { if (!x) throw new Error(message); }
newLife({ name: 'Thanh Vân', g: 'm', origin: 'mucdong', fate: rollFate(false, 'm'), perks: [] });
const s = ST.s;
s.born = s.year - 30; s.r = 1;
const n = mkNpc({ name: 'Ngọc Lan', g: 'f', r: 1, st: 0, age: 28, tag: 'daolu', rel: 100 });
n.life = 10000; s.npcs.push(n);
check(canSongTu(n), 'adult partners eligible');
const choice = npcActions(n.id).find(c => c.t === 'Song tu')!;
check(choice && !choice.dis, 'NPC Song Tu choice enabled');
const out = choice.fn();
check(typeof out !== 'string' && out.songTu, 'NPC action includes generation context');
check(out.songTu.partner.includes(n.name), 'correct partner snapshot');
const event = EVENTS.find(e => e.id === 'life_daolu_songtu')!;
check(event.cond?.(), 'event eligible'); event.text();
const eventOut = event.ch().find(c => c.t === 'Song tu')!.fn();
check(typeof eventOut !== 'string' && eventOut.songTu, 'random event uses same generation path');
const other = mkNpc({ name: 'Thanh Liên', g: 'f', r: 1, st: 0, age: 29, tag: 'daolu', rel: 80 });
other.life = 10000; s.npcs.push(other);
delete s.flags['npc_dual' + n.id];
const group = songTuWith([n.id, other.id, n.id]);
check(typeof group !== 'string' && group.songTu, 'group Song Tu returns narrative context');
check(group.songTu.partner.includes(n.name) && group.songTu.partner.includes(other.name), 'all chosen partners in prompt');
check(group.songTu.partnerNames === n.name + ' và ' + other.name, 'selected names listed once');
check(out.songTu.partnerNames === n.name, 'single selected name');
check(fillSongTuTemplate('Cùng {{partnerNames}}', group.songTu) === 'Cùng ' + n.name + ' và ' + other.name, 'names substituted in narrative');
check(group.songTu.partner.split(n.name).length === 2, 'duplicate selections deduplicated');
const unchanged = JSON.stringify({ year: s.year, prog: s.prog });
check(typeof songTuWith([]) === 'string', 'empty selection rejected');
check(unchanged === JSON.stringify({ year: s.year, prog: s.prog }), 'invalid selection has no gameplay effects');
n.born = s.year - 12;
check(!canSongTu(n) && npcActions(n.id).find(c => c.t === 'Song tu')?.dis, 'body age eligibility');
const context = out.songTu;
check(fillSongTuTemplate('{{me}}: Bắt đầu thôi.', context) === s.name + ': Bắt đầu thôi.', 'me resolves to player name without biography');
check(fillSongTuTemplate('{{player}} / {{partner}}', context).includes(n.name), 'template substitutes participant facts');
const oldFetch = globalThis.fetch;
let calls = 0, supplied = '';
(globalThis as any).document = { baseURI: 'http://localhost:5180/' };
globalThis.fetch = (async (url: any, init: any) => {
  if (String(url).includes('/prompts/') || String(url).endsWith('/prompt')) {
    calls++; check(init.cache === 'no-store', 'read prompt fresh');
    return new Response(JSON.stringify({ narrative: '- Version ' + calls + ': {{partner}}', outcome: 'Kết quả riêng: {{outcome}}' }));
  }
  supplied = JSON.parse(init.body).messages[1].content;
  return new Response(JSON.stringify({ message: { content: 'Ngươi cùng vị đạo lữ ngồi nhập định, chân nguyên tuần hoàn trong ánh trăng thanh.' } }));
}) as typeof fetch;
try {
  const first = await loadSongTuPrompt(), second = await loadSongTuPrompt();
  check(first.narrative !== second.narrative, 'edited prompt reread each generation');
  const before = JSON.stringify({ year: s.year, prog: s.prog, rel: n.rel });
  await writeSongTu(second, context); await writeSongTu(second, context);
  check(supplied.includes('Kết quả riêng: ' + context.outcome), 'separate outcome template included');
  check(supplied.includes('Version 2:') && supplied.includes(n.name), 'Ollama receives custom prompt and snapshot');
  check(before === JSON.stringify({ year: s.year, prog: s.prog, rel: n.rel }), 'generation/retry never reapplies gameplay rewards');
} finally { globalThis.fetch = oldFetch; delete (globalThis as any).document; }
console.log('PASS: both Song Tu actions, adult eligibility, live prompt reload, custom Ollama request and retry without duplicate rewards.');
const { loadDefaultSongTu } = await import('../src/ai/songtu');
(globalThis as any).document = { baseURI: 'http://localhost:5180/' };
let fallbackReads = 0;
globalThis.fetch = (async (url: any, init: any) => {
  check(init.cache === 'no-store', 'default story reread');
  if (String(url).includes(':8788')) throw new Error('server offline');
  check(String(url).endsWith('/prompts/song-tu-default.txt'), 'static default path');
  fallbackReads++;
  return new Response('Lần ' + fallbackReads + ': Cùng nhập định tại {{place}}.');
}) as typeof fetch;
try {
  const first = await loadDefaultSongTu(context);
  const second = await loadDefaultSongTu(context);
  check(first.includes(context.place) && second !== first, 'default substitutes context and reloads edits without AI/server');
} finally { globalThis.fetch = oldFetch; delete (globalThis as any).document; }
console.log('PASS: default story works offline and rereads editable text.');

const many = { ...context, partners: ['Ngọc Lan', 'Thanh Liên', 'Hoa Tuyết'] };
check(fillSongTuTemplate('{{partner1}} / {{partner3}}', many) === 'Ngọc Lan / Hoa Tuyết', 'numbered partners support arbitrary index');
check(fillSongTuTemplate('{{me}}: Bắt đầu\n{{#partners}}\n{{index}}. {{name}}: Đồng ý.\n{{/partners}}', many) === context.me + ': Bắt đầu\n1. Ngọc Lan: Đồng ý.\n2. Thanh Liên: Đồng ý.\n3. Hoa Tuyết: Đồng ý.', 'loop includes every selected partner');
check(fillSongTuTemplate('{{partner1}}: Có\n{{partner2}}: Có', { ...context, partners: ['Ngọc Lan'] }) === 'Ngọc Lan: Có', 'missing numbered partner line omitted');
check(fillSongTuTemplate('{{#partners}}{{name}}{{/partners}}', { ...context, partners: [] }) === '', 'empty loop has no phantom partner');
console.log('PASS: numbered partners, dynamic dialogue loops, missing and empty selections.');
const scenes = '{{#withPartner}}{{name}} chào {{me}}. {{name}} ngồi xuống.{{/withPartner}}\n{{#withNextPartner}}{{name}} đáp.{{/withNextPartner}}\n{{#withNextPartner}}{{name}} mỉm cười.{{/withNextPartner}}';
check(fillSongTuTemplate(scenes, many) === 'Ngọc Lan chào ' + context.me + '. Ngọc Lan ngồi xuống.\nThanh Liên đáp.\nHoa Tuyết mỉm cười.', 'sequential scenes keep stable names and never reuse participants');
check(fillSongTuTemplate(scenes, { ...many, partners: ['Ngọc Lan'] }).trim() === 'Ngọc Lan chào ' + context.me + '. Ngọc Lan ngồi xuống.', 'exhausted scenes omitted');
const pairScene = '{{#withPartner}}{{name}} trước.{{/withPartner}} {{#withNextPartner}}{{name1}} cùng {{name2}}; {{name1}} đáp.{{/withNextPartner}}';
check(fillSongTuTemplate(pairScene, many) === 'Ngọc Lan trước. Thanh Liên cùng Hoa Tuyết; Thanh Liên đáp.', 'two-person scene excludes already used partner');
check(fillSongTuTemplate(pairScene, { ...many, partners: ['A', 'B'] }).trim() === 'A trước.', 'pair scene omitted without enough partners');
let badBlock = false;
try { fillSongTuTemplate('{{#withPartner}}{{name}}', many); } catch { badBlock = true; }
check(badBlock, 'unclosed block reported');
console.log('PASS: sequential scenes, distinct pair participants, exhausted selection and block validation.');
