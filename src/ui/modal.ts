import { songTuPanel } from './songtu';
// Khung giấy giữa màn hình: sự kiện, kết quả, và các bảng menu (tiệm, luyện chế, tông môn...).
import { h, $, btn } from './dom';
import { glyphSvg } from './glyph';
import { s } from '../engine/state';
import { dateStr, pendingDeath, clearPendingDeath, addLog } from '../engine/core';
import { drainFights, type Scene } from '../engine/actions';
import type { Choice, Outcome, PickSpec } from '../engine/events';
import type { FightResult } from '../engine/combat';
import { die, checkAch } from '../engine/life';
import { save } from '../engine/state';
import { rewriteNarration, rewriteOutcome, aiOn, aiBlockReason } from '../ai/ollama';
import { esc } from '../core/util';
import { withFights } from './fightui';

const modal = $('#modal');
const veil = $('#veil');
let onCloseCb: (() => void) | null = null;
export let refresh: () => void = () => {};
export const setRefresh = (f: () => void) => (refresh = f);
let toastFn: (m: string, cls?: string) => void = () => {};
export const setToast = (f: typeof toastFn) => (toastFn = f);

export const modalOpen = () => !modal.hidden;

export function openModal(title: string, body: HTMLElement | HTMLElement[], opts: { characterAge?: number | null; wide?: boolean; seal?: string; onClose?: () => void; noClose?: boolean; sub?: string; xBtn?: boolean } = {}) {
  modal.innerHTML = '';
  modal.className = opts.wide ? 'wide' : '';
  const head = h('h2', {}, opts.seal ? h('span', { class: 'seal', html: glyphSvg(opts.seal, 16, 2) }) : h('span', { class: 'pl-dia' }, '◆'), title, opts.sub ? h('small', { class: 'pl-sub' }, opts.sub) : null, opts.xBtn ? h('button', { class: 'pl-x', title: 'Đóng (Esc)', onclick: () => closeModal() }, '✕') : null);
  modal.append(head);
  if (s) modal.append(h('div', { class: 'date' }, `${dateStr()}${opts.characterAge === null ? '' : ` · ${Math.floor(opts.characterAge ?? (s.year - s.born)).toLocaleString('vi-VN')} tuổi`}`));
  const wrap = h('div', {});
  wrap.append(...(Array.isArray(body) ? body : [body]));
  modal.append(wrap);
  if (!opts.noClose) modal.append(h('div', { style: { textAlign: 'right', marginTop: '12px' } }, btn('Đóng', closeModal, 'ghost')));
  modal.hidden = false;
  veil.hidden = false;
  onCloseCb = opts.onClose || null;
  modal.scrollTop = 0;
  modal.scrollLeft = 0;
}

/** Cảnh bắt buộc chen trước kết quả hành động (vd. định đoạt hôn ước năm mười sáu tuổi); hud đăng ký. */
let gate: () => Scene | null = () => null;
export const setGate = (f: () => Scene | null) => (gate = f);
/** Cảnh hiện tiếp ngay sau khi đóng cảnh hiện tại (vd. thư chúc mừng sau khi gia nhập tông môn); hud đăng ký.
 *  Chỉ hiện khi không có cửa sổ nào khác vừa được mở thay chỗ — nếu có thì chờ lần đóng sau. */
let follow: () => Scene | null = () => null;
export const setFollow = (f: () => Scene | null) => (follow = f);
let prelude: () => Scene | null = () => null;
export const setPrelude = (f: () => Scene | null) => (prelude = f);
let queued: Scene | null = null;
let queuedAction: (() => void) | null = null;
export function closeModal() {
  modal.hidden = true;
  veil.hidden = true;
  const cb = onCloseCb;
  onCloseCb = null;
  const action = queuedAction;
  queuedAction = null;
  after();
  cb?.();
  if (queued && s && !s.dead) { const q = queued; queued = null; showScene(q); }
  else if (action && s && !s.dead) action();
  else setTimeout(() => { if (!modal.hidden || !s || s.dead) return; const f = follow(); if (f) showScene(f); }, 0);
}
veil.addEventListener('click', () => {
  // không cho bấm ra ngoài để bỏ qua sự kiện có lựa chọn
  if (modal.querySelector('.choices .btn:not([data-close])')) return;
  closeModal();
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden && !modal.querySelector('.choices .btn:not([data-close])')) closeModal();
});

/** Sau mỗi hành động: chết?, thành tựu, lưu, vẽ lại. */
export function after() {
  if (!s) return;
  const pd = pendingDeath();
  if (pd && !s.dead) {
    clearPendingDeath();
    die(pd);
    return;
  }
  for (const a of checkAch()) toastFn(`Thành tựu: ${a.n}`, 'gold');
  save();
  refresh();
}

function fightBlock(fs: FightResult[]) {
  if (!fs.length) return null;
  return h('details', { class: 'flog' }, h('summary', {}, fs.length > 1 ? `Diễn biến ${fs.length} trận đấu` : 'Diễn biến trận đấu'), ...fs.map((f) => h('ol', {}, ...f.log.map((l) => h('li', {}, l)))));
}

/** Gọi AI kể lại đoạn `el`; lỗi thì giữ bản gốc và hiện nút "Thử lại" (gọi AI lần nữa cho đúng đoạn này). */
function addAiNarration(el: HTMLElement, original: string, make: () => Promise<string | null>) {
  const wait = h('div', { class: 'ai-wait' }, 'AI đang chấp bút…');
  el.after(wait);
  void make().then((text) => {
    if (!el.isConnected) return;
    if (!text) return; // không có gì để kể lại (vd. kết quả chỉ có phần thưởng): giữ bản gốc
    el.innerHTML = `${esc(text)}<div class="ai-tag">✎ AI kể lại · <a href="#" class="orig">xem bản gốc</a></div>`;
    el.querySelector('.orig')?.addEventListener('click', (e) => {
      e.preventDefault();
      el.textContent = original;
    });
  }).catch((e: unknown) => {
    if (!el.isConnected) return;
    const reason = e instanceof Error ? e.message : String(e);
    const tag = h('div', { class: 'ai-tag' }, `AI chưa kể lại được: ${reason} Bản gốc đang hiển thị. `);
    tag.append(h('a', { href: '#', class: 'ai-retry', onclick: (ev: Event) => { ev.preventDefault(); tag.remove(); addAiNarration(el, original, make); } }, 'Thử lại'));
    el.append(tag);
  }).finally(() => wait.remove());
}

/** AI đã bật nhưng không gọi được: ghi lý do dưới đoạn `el`, mỗi khung sự kiện chỉ một lần. */
function noteAiBlocked(el: HTMLElement) {
  const reason = aiBlockReason();
  if (!reason || modal.querySelector('.ai-blocked')) return;
  el.append(h('div', { class: 'ai-tag ai-blocked' }, `AI không kể lại được: ${reason} Đang hiển thị lời kể cố định.`));
}

/** Hiển thị một Scene. Scene loại info không có lựa chọn → chỉ bắn thông báo nhỏ. */
export function showScene(sc: Scene) {
  if (sc.then) queued = sc.then;
  const fights = drainFights();
  if (sc.kind === 'info' && !sc.choices?.length && !fights.length) {
    toastFn(sc.text.split('\n')[0].slice(0, 160));
    addLog(sc.text.replace(/\n+/g, ' '));
    after();
    return;
  }
  const story = h('div', { class: 'story' }, sc.text);
  const body: HTMLElement[] = [story];
  const fb = fightBlock(fights);
  if (fb) body.push(fb);
  const box = h('div', { class: 'choices' });
  body.push(box);
  openModal(sc.title, body, { noClose: true, seal: sc.kind === 'event' ? 'fate' : undefined });
  if (sc.kind === 'event' && sc.text.length > 0) {
    if (aiOn()) addAiNarration(story, sc.text, () => rewriteNarration(sc.title, sc.text, sc.aiContext, sc.aiCast));
    else noteAiBlocked(story);
  }
  renderChoices(box, sc.choices, sc);
}

function renderChoices(box: HTMLElement, choices: Choice[] | undefined, sc: Scene) {
  box.innerHTML = '';
  if (!choices?.length) {
    box.append(h('button', { class: 'btn prime', 'data-close': '1', onclick: closeModal }, 'Tiếp tục'));
    return;
  }
  for (const c of choices) {
    box.append(btn(c.t, () => pickChoice(c, box, sc), c.cls || '', { dis: c.dis, hint: c.hint }));
  }
}

/** Bảng chọn nhiều: mỗi mục một thẻ có ô đánh dấu, thêm nút chọn hết / bỏ hết và xác nhận. */
function renderPick(box: HTMLElement, p: PickSpec, sc: Scene) {
  box.innerHTML = '';
  const sel = new Set<string>();
  const min = p.min ?? 1;
  const ok = btn(p.confirm, () => {
    const ids = p.items.filter((x) => sel.has(x.id)).map((x) => x.id);
    const label = (p.head ? p.head + ' · ' : '') + p.items.filter((x) => sel.has(x.id)).map((x) => x.label).join(', ');
    let out: Outcome;
    try { out = p.done(ids); } catch (e) { console.error(e); out = '(Có lỗi.)'; }
    showOutcome({ t: label, fn: () => '' }, box, sc, out);
  }, 'prime', { dis: true });
  const sync = () => { (ok as HTMLButtonElement).disabled = sel.size < min; cards.forEach(([id, el]) => el.classList.toggle('on', sel.has(id))); };
  const cards: [string, HTMLElement][] = p.items.map((it) => {
    const el = h('label', { class: 'pick-card' },
      h('input', { type: 'checkbox', onchange: (e: Event) => { if ((e.target as HTMLInputElement).checked) sel.add(it.id); else sel.delete(it.id); sync(); } }),
      h('div', {}, h('b', { class: 'pick-head' }, it.head ?? it.label), ...it.info.map((l) => h('div', { class: 'small' }, l))));
    return [it.id, el];
  });
  const setAll = (v: boolean) => { for (const [id, el] of cards) { (el.querySelector('input') as HTMLInputElement).checked = v; if (v) sel.add(id); else sel.delete(id); } sync(); };
  box.append(h('div', { class: 'pick-grid' }, ...cards.map((c) => c[1])), h('div', { class: 'pick-row' }, btn('Chọn tất cả', () => setAll(true), 'small'), btn('Bỏ chọn', () => setAll(false), 'small ghost'), ok));
}

function pickChoice(c: Choice, box: HTMLElement, sc: Scene) {
  box.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = true));
  withFights(() => c.fn(), (out) => showOutcome(c, box, sc, out), (err) => { console.error(err); showOutcome(c, box, sc, '(Có lỗi khi xử lý lựa chọn này.)'); });
}

function showOutcome(c: Choice, box: HTMLElement, sc: Scene, out: Outcome) {
  const fights = drainFights();
  const text = typeof out === 'string' ? out : out.text;
  const next = typeof out === 'string' || pendingDeath() ? undefined : out.choices;
  box.innerHTML = '';
  if (typeof out !== 'string' && out.quiet && !pendingDeath()) {
    // Bước trung gian: chỉ hiện câu hỏi, kết quả thật sẽ kể một lần ở bước sau.
    box.before(h('div', { class: 'story ask' }, text));
    if (out.pick) renderPick(box, out.pick, { ...sc, text: sc.text + '\n\n' + text });
    else renderChoices(box, next, { ...sc, text: sc.text + '\n\n' + text });
    modal.scrollTop = modal.scrollHeight;
    refresh();
    return;
  }
  const res = h('div', { class: 'story res' }, text);
  const prev = box.previousElementSibling;
  box.before(h('div', { class: 'small muted' }, '▸ ' + c.t));
  box.before(res);
  const fb = fightBlock(fights);
  if (fb) box.before(fb);
  addLog(`${sc.title}: ${text.replace(/\n+/g, ' ').slice(0, 220)}`);
  if (typeof out !== 'string' && out.title) {
    const t = modal.querySelector('h2');
    if (t) t.lastChild!.textContent = out.title;
  }
  void prev;
  if (typeof out !== 'string' && out.songTu) box.before(songTuPanel(out.songTu));
  else if (sc.kind === 'event' ? text.length > 0 : text.length > 25 && !s?.dead) {
    if (aiOn()) addAiNarration(res, text, () => rewriteOutcome(sc.title, sc.text.slice(-600), c.t, text, sc.aiContext, sc.aiCast));
    else noteAiBlocked(res);
  }
  if (typeof out !== 'string' && out.pick && !pendingDeath()) renderPick(box, out.pick, { ...sc, text: text });
  else renderChoices(box, next, { ...sc, text: text });
  modal.scrollTop = modal.scrollHeight;
  refresh();
}

/** Chạy một hành động trả về Scene. */
export function run(fn: () => Scene) {
  if (!s || s.dead) return;
  const first = prelude();
  if (first) {
    queuedAction = () => run(fn);
    showScene(first);
    return;
  }
  withFights(fn, (sc) => { const g = gate(); showScene(g ? { ...g, then: sc } : sc); }, (e) => { console.error(e); showScene({ title: 'Lỗi', text: String(e) }); });
}
export const toast = (m: string, cls?: string) => toastFn(m, cls);
