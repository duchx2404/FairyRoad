// Bảng Kinh mạch: lưới ô hình thân người, chọn mảnh rồi bấm ô để đặt; xoay, gỡ, tự xếp.
import { toggleSkill, knownByGrade, stowSkill } from '../engine/items';
import { glyphSvg } from './glyph';
import { askConfirm } from './dialog';
import { kmSyncSkills } from '../engine/kinhmach';
import { h, btn } from './dom';
import { s } from '../engine/state';
import { EL, REALMS } from '../data/core';
import { SKILLS, TAMPHAP, TIER_C, SK_KIND, skHue, hueBg, skillEffect, tamGrade, tamEffect, learnReq } from '../data/items';
import { skillIconSvg, tamIconSvg } from './icons';
import { skEff, skGradeOf, skSource, skSrcMul, effRi } from '../engine/char';
import { skCost } from '../engine/combat';
import { openMeridian, merMax } from '../engine/core';
import {
  KMW, KMH, KM_TOTAL, KM_KIND, KM_ROOT, HX_NAME, kmCalc, kmOpen, hxCount, kmCells, kmCanPlace, kmPlace, kmRemove, kmPlacement, kmAutoAll, kmRoot, kmRot, shapeOf, skSize, type Piece,
} from '../engine/kinhmach';

let sel: string | null = null;
/** Mảnh / chiêu đang xem chi tiết ('sk:id' hoặc 'tk:id'), kể cả chiêu chưa mang. */
let info: string | null = null;
let jump = false;
let rot = 0;
const CS = 30, G = 3;
const pct = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
/** Màu mảnh: chiêu lấy theo hệ (đa hệ thì chuyển sắc), tâm kinh / vô hệ màu đồng. */
const pHue = (p: Piece) => (p.kind === 'sk' && SKILLS[p.key] ? skHue(SKILLS[p.key]) : p.el ? { n: EL[p.el].n, c: [EL[p.el].c] } : null);
const elC = (p: Piece) => { const u = pHue(p); return u ? hueBg(u.c) : '#8a7650'; };
const hueTag = (u: { n: string; c: string[] } | null) => (u ? h('span', { class: 'km-el' + (u.c.length > 1 ? ' multi' : ''), style: { background: hueBg(u.c) } }, u.n) : null);

/** Hình mảnh thu nhỏ. */
function miniShape(sh: [number, number][], bg: string, cs = 9): HTMLElement {
  const mini = h('div', { class: 'km-mini' });
  const mw = Math.max(...sh.map((c) => c[0])) + 1, mh = Math.max(...sh.map((c) => c[1])) + 1;
  mini.style.width = `${mw * cs}px`; mini.style.height = `${mh * cs}px`;
  for (const [a, b] of sh) mini.append(h('i', { style: { left: `${a * cs}px`, top: `${b * cs}px`, width: `${cs - 1}px`, height: `${cs - 1}px`, background: bg } }));
  return mini;
}
const row = (k: string, ...v: (Node | string | null)[]) => [h('span', {}, k), h('span', {}, ...v)];

/** Thẻ chi tiết của chiêu / tâm kinh đang chọn. */
function detailCard(id: string, C: ReturnType<typeof kmCalc>, rerender: () => void, toast: (m: string) => void): HTMLElement | null {
  const kind = id.slice(0, 2), key = id.slice(3);
  const placed = !!C.cells[id];
  const close = h('button', { class: 'km-det-x', title: 'Đóng', onclick: () => { info = null; sel = null; rerender(); } }, '×');
  if (kind === 'tk') {
    const t = TAMPHAP[key];
    if (!t) return null;
    const n = 2 + Math.ceil(t.tier / 2);
    return h('div', { class: 'km-det' }, close,
      h('div', { class: 'km-det-h' }, h('span', { class: 'km-ic', html: tamIconSvg(t.tier, 46) }),
        h('div', {}, h('b', {}, t.n), h('small', {}, `Tâm kinh · ${tamGrade(t)}`))),
      h('div', { class: 'km-kv' },
        ...row('Hiệu ứng', tamEffect(t)),
        ...row('Kinh mạch', miniShape(C.P.find((p) => p.id === id)?.shape ?? shapeOf(id, n), '#8a7650', 7), ` ${n} ô · `, placed ? h('span', { class: 'up' }, 'đang vận, tăng công và tu luyện') : h('span', { class: 'dn' }, 'chưa xếp'))),
      h('p', {}, t.d));
  }
  const sk = SKILLS[key];
  if (!sk) return null;
  const hue = skHue(sk), on = s.skills.includes(key), size = skSize(sk.tier);
  const rt = kmRoot(sk.el), src = skSource(key), v = C.per[id] ?? 1;
  const bg = hue ? hueBg(hue.c) : '#8a7650';
  const kmTxt = placed
    ? h('span', { class: 'up' }, `đã xếp, uy lực ×${v.toFixed(2)}${C.hxOn[id] ? ` · ${C.hxOn[id]} huyệt` : ''}`)
    : on ? h('span', { class: 'dn' }, 'chưa xếp, uy lực ×0,85') : h('span', { class: 'muted' }, 'chưa mang');
  const rootTxt = rt
    ? h('span', { class: KM_ROOT[rt][1] >= 0 ? 'up' : 'dn' }, `${KM_ROOT[rt][0]}, uy lực ${pct(KM_ROOT[rt][1])}`)
    : hue && hue.c.length > 1 ? `${hue.n}: không hợp cũng không khắc linh căn` : 'Không liên quan linh căn';
  return h('div', { class: 'km-det' }, close,
    h('div', { class: 'km-det-h' }, h('span', { class: 'km-ic', html: skillIconSvg(sk, 46) }),
      h('div', {}, h('b', {}, sk.n), h('small', {}, `${hue?.n ?? 'Vô hệ'} · ${SK_KIND[sk.k]} · `, h('span', { style: { color: TIER_C[skEff(key).tier] } }, skGradeOf(key))))),
    h('div', { class: 'km-kv' },
      ...row('Hệ', hueTag(hue) ?? 'Vô hệ'),
      ...row('Kiểu', SK_KIND[sk.k]),
      ...row('Linh lực', `${skCost(sk)} mỗi lần dùng · hồi ${sk.cd} lượt`),
      ...row('Hiệu ứng', skillEffect(sk)),
      ...row('Linh căn', rootTxt),
      ...(src ? row('Truyền từ', `${src.n} · uy lực ×${skSrcMul(key).toFixed(2)}`) : []),
      ...row('Kinh mạch', miniShape(C.P.find((p) => p.id === id)?.shape ?? shapeOf(id, size), bg, 7), ` ${size} ô · `, kmTxt)),
    h('p', {}, sk.d),
    h('div', { class: 'km-det-a' },
      btn(on ? 'Gỡ' : 'Mang', () => { const m = toggleSkill(key); if (m) toast(m); sel = !on && s.skills.includes(key) ? id : null; rerender(); }, 'small' + (on ? ' ghost' : ' prime')),
      btn('Cất thành sách', () => confirmStow(key, (m) => { if (m) toast(m); sel = info = null; rerender(); }), 'small ghost')));
}

/** Hỏi trước khi cất chiêu thành sách; báo nếu cảnh giới chưa đủ để đọc lại. */
export function confirmStow(k: string, done: (m: string) => void) {
  const sk = SKILLS[k];
  const req = learnReq(sk.tier), low = effRi() < req;
  askConfirm(`Chép ${sk.n} lại thành thuật thư và cất vào túi? Chiêu sẽ bị quên, gỡ khỏi kinh mạch; đọc lại sách thì học lại.${low ? ` Lưu ý: cần ${REALMS[req].n} mới đọc lại được, cảnh giới hiện tại chưa đủ.` : ''}${sk.peak ? ' Sách chân truyền không bán được.' : ''}`,
    () => done(stowSkill(k)), { title: 'Cất thuật pháp', ok: 'Cất thành sách', danger: low });
}

export function kmPanel(rerender: () => void, toast: (m: string) => void): HTMLElement[] {
  const C = kmCalc();
  const out: HTMLElement[] = [];
  if (sel && !C.P.some((p) => p.id === sel)) sel = null;
  const selP = sel ? C.P.find((p) => p.id === sel)! : null;
  if (sel) info = sel;
  if (info && !(info.startsWith('sk:') ? s.known.includes(info.slice(3)) : C.P.some((p) => p.id === info))) info = null;
  const nG = C.links.filter((l) => l.k !== 'khac').length, nR = C.links.length - nG;
  out.push(h('div', { class: 'km-sec' }, `Kinh mạch · khai mở ${kmOpen()}/${KM_TOTAL} · dùng ${C.used} ô`));
  out.push(h('div', { class: 'km-stat' },
    h('span', {}, 'Công ', h('b', { class: C.atk >= 0 ? 'up' : 'dn' }, pct(C.atk))),
    h('span', {}, 'Tu luyện ', h('b', { class: C.sp >= 0 ? 'up' : 'dn' }, pct(C.sp))),
    h('span', {}, h('i', { class: 'km-dot hx' }), `Huyệt ${C.HX.size}/${hxCount()}`),
    h('span', {}, h('i', { class: 'km-dot thong' }), `${nG} thông`),
    h('span', {}, h('i', { class: 'km-dot khac' }), `${nR} nghịch`)));

  // ---- bàn ô ----
  const board = h('div', { class: 'km-board', style: { width: `${KMW * (CS + G) - G}px`, height: `${KMH * (CS + G) - G}px` } });
  const cellEls: HTMLElement[] = [];
  const firstOf: Record<string, number> = {};
  for (const [id, cs] of Object.entries(C.cells)) firstOf[id] = cs[0][1] * KMW + cs[0][0];
  const hxIdx = [...C.HX];
  for (let y = 0; y < KMH; y++) for (let x = 0; x < KMW; x++) {
    const i = y * KMW + x;
    const validCell = Math.min(x, KMW - 1 - x) + Math.min(y, KMH - 1 - y) >= 2;
    const pid = C.B.get(i);
    const p = pid ? C.P.find((q) => q.id === pid)! : null;
    const open = C.open.has(i), hx = C.HX.has(i);
    const cl = ['km-cell', !validCell ? 'void' : !open ? 'closed' : p ? 'on' : 'free', hx ? 'hx' : '', pid && pid === sel ? 'sel' : ''].filter(Boolean).join(' ');
    const el = h('div', {
      class: cl,
      style: { left: `${x * (CS + G)}px`, top: `${y * (CS + G)}px`, width: `${CS}px`, height: `${CS}px`, ...(p ? { background: elC(p) } : {}) },
      title: hx ? `Huyệt ${HX_NAME[hxIdx.indexOf(i)] ?? ''}` : p ? p.n : open ? '' : 'Chưa khai mở',
      onclick: () => onCell(x, y, pid),
      onmouseenter: () => preview(x, y),
    });
    if (p && firstOf[p.id] === i) el.append(p.kind === 'sk' && SKILLS[p.key] ? h('span', { class: 'km-ic', html: skillIconSvg(SKILLS[p.key], 22) }) : h('span', { class: 'km-ch', html: glyphSvg('heart', 16, 2) }));
    if (validCell) { cellEls[i] = el; board.append(el); }
  }
  for (const e of C.edges) {
    const bar = e.dx
      ? { left: `${(e.x + 1) * (CS + G) - G / 2 - 2}px`, top: `${e.y * (CS + G) + 5}px`, width: '4px', height: `${CS - 10}px` }
      : { left: `${e.x * (CS + G) + 5}px`, top: `${(e.y + 1) * (CS + G) - G / 2 - 2}px`, width: `${CS - 10}px`, height: '4px' };
    board.append(h('div', { class: 'km-edge ' + e.k, style: bar }));
  }
  board.addEventListener('mouseleave', () => clearPrev());
  const clearPrev = () => cellEls.forEach((c) => c?.classList.remove('pv-ok', 'pv-bad'));
  function preview(x: number, y: number) {
    clearPrev();
    if (!selP) return;
    const ok = kmCanPlace(C, selP, x, y, rot);
    for (const [a, b] of kmCells(selP, { x, y, r: rot })) cellEls[b * KMW + a]?.classList.add(ok ? 'pv-ok' : 'pv-bad');
  }
  function onCell(x: number, y: number, pid?: string) {
    if (!selP) { if (pid) { sel = pid; jump = true; rot = kmPlacement(pid)?.r ?? 0; rerender(); } return; }
    if (pid && pid !== sel && !kmCanPlace(C, selP, x, y, rot)) { sel = pid; jump = true; rot = kmPlacement(pid)?.r ?? 0; rerender(); return; }
    if (kmPlace(selP.id, x, y, rot)) { rerender(); return; }
    toast('Không đặt vừa: mảnh phải nằm trọn trong ô đã khai mở và không đè lên mảnh khác.');
  }
  out.push(h('div', { class: 'km-wrap' }, board));

  // ---- thanh thao tác ----
  out.push(h('div', { class: 'km-bar' },
    selP ? h('span', {}, 'Đang chọn ', h('b', {}, selP.n), ': rê chuột lên bàn để xem, bấm ô để đặt.') : h('span', {}, 'Chọn một mảnh bên dưới (hoặc bấm vào mảnh trên bàn), rồi bấm ô kinh mạch để đặt.'),
    selP ? btn('Xoay', () => { rot = (rot + 1) & 3; const pl = kmPlacement(selP.id); if (pl && !kmPlace(selP.id, pl.x, pl.y, rot)) toast('Xoay tại chỗ không vừa — bấm ô khác để đặt.'); rerender(); }, 'small') : null,
    selP && C.cells[selP.id] ? btn(selP.kind === 'sk' ? 'Gỡ ra (cất chiêu)' : 'Gỡ ra', () => { if (selP.kind === 'sk') toggleSkill(selP.key); else kmRemove(selP.id); sel = null; rerender(); }, 'small ghost') : null,
    selP ? btn('Bỏ chọn', () => { sel = null; info = null; rerender(); }, 'small ghost') : null,
    btn('Tự xếp lại', () => { kmAutoAll(); const drop = kmSyncSkills(); toast(drop.length ? `Không đủ chỗ, đã cất: ${drop.join(', ')}.` : 'Đã xếp lại toàn bộ kinh mạch.'); rerender(); }, 'small'),
    btn(`Xung kích kinh mạch (+2 ô)`, () => { toast(openMeridian()); rerender(); }, 'small prime', { dis: s.meridians >= merMax() || s.r === 0, title: `Đã đả thông ${s.meridians}/${merMax()} kinh mạch. Mỗi mạch +2 ô, tốn 30% tu vi.` })));

  // ---- thẻ chi tiết ----
  const det = info ? detailCard(info, C, rerender, toast) : null;
  if (det) {
    out.push(det);
    if (jump) { jump = false; setTimeout(() => det.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0); }
  }

  // ---- danh sách mảnh ----
  const list = h('div', { class: 'km-list' });
  for (const p of C.P) {
    const placed = !!C.cells[p.id];
    const rt = kmRoot(p.el);
    const mini = miniShape(kmRot(p.shape, p.id === sel ? rot : kmPlacement(p.id)?.r ?? 0), elC(p));
    const v = C.per[p.id] ?? 1;
    const status = p.kind === 'tk'
      ? (placed ? h('span', { class: 'up' }, 'đang vận · tăng công, tu luyện') : h('span', { class: 'muted' }, 'chưa xếp'))
      : placed ? h('span', { class: 'up' }, `uy lực ×${v.toFixed(2)}${C.hxOn[p.id] ? ` · ${C.hxOn[p.id]} huyệt` : ''}`) : h('span', { class: 'dn' }, 'chưa xếp, ×0,85');
    list.append(h('button', { class: 'km-piece' + (p.id === sel ? ' on' : '') + (placed ? '' : ' off'), onclick: () => { if (p.id === sel) { sel = null; info = null; } else { sel = info = p.id; jump = true; } rot = kmPlacement(p.id)?.r ?? 0; rerender(); } },
      mini,
      h('span', { class: 'km-pt' },
        h('b', {}, hueTag(pHue(p)), ' ', p.n),
        h('small', {}, `${KM_KIND[p.kind]} · ${p.size} ô${rt ? ' · ' + KM_ROOT[rt][0] : ''} · `, status))));
  }
  if (!C.P.length) list.append(h('div', { class: 'empty' }, 'Chưa mang võ công hay vận tâm kinh nào để xếp vào kinh mạch.'));
  out.push(list);
  // chiêu đã học nhưng chưa mang: bấm Mang để xếp vào chỗ trống
  const idle = knownByGrade().filter((k) => !s.skills.includes(k));
  if (idle.length) {
    out.push(h('div', { class: 'km-sec' }, `Chiêu đã học, chưa mang · ${idle.length}`));
    out.push(h('div', { class: 'km-list' }, ...idle.map((k) => {
      const sk = SKILLS[k];
      const id = 'sk:' + k, u = skHue(sk);
      return h('div', { class: 'km-piece off pick' + (info === id ? ' on' : ''), title: 'Bấm để xem chi tiết', onclick: () => { sel = null; info = info === id ? null : id; jump = true; rerender(); } },
        miniShape(shapeOf(id, skSize(sk.tier)), u ? hueBg(u.c) : '#8a7650'),
        h('span', { class: 'km-pt', style: { flex: '1' } }, h('b', {}, hueTag(u), ' ', sk.n), h('small', {}, `${SK_KIND[sk.k]} · ${skSize(sk.tier)} ô · ×${sk.m}`)),
        btn('Mang', () => { const m = toggleSkill(k); if (m) toast(m); rerender(); }, 'small'));
    })));
  }
  out.push(h('details', { class: 'km-more' }, h('summary', {}, 'Cách kinh mạch tính sức mạnh'),
    h('div', { class: 'small' },
      'Ô khai mở dần theo cảnh giới; mỗi kinh mạch đả thông (Xung kích) mở thêm 2 ô. ',
      'Hai mảnh chạm nhau: đồng hệ hoặc tương sinh là kinh mạch thông (vạch xanh), mỗi chỗ thông +6% uy lực cho cả hai võ công, cộng chút công và tu luyện. Tương khắc là kinh mạch nghịch (vạch đỏ), −8%. ',
      'Với linh căn: hợp mệnh +8%, mệnh sinh ra hệ đó +12%, hệ đó sinh mệnh +4% và tăng tu luyện, khắc mệnh −8%. ',
      'Ô viền vàng là huyệt vị: võ công hợp mệnh hoặc mệnh sinh phủ lên mỗi huyệt được +6% uy lực, hệ khác +1,5%. Tâm kinh xếp lên huyệt tăng tu luyện. ',
      'Võ công chưa xếp vào kinh mạch chỉ phát huy 85% uy lực.')));
  return out;
}
