// Trợ giúp DOM nhỏ gọn.
type Kid = Node | string | number | null | undefined | false;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, ...kids: (Kid | Kid[])[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') (e as any)[k.toLowerCase()] = v;
    else if (k === 'disabled') (e as any).disabled = !!v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  const add = (c: Kid | Kid[]) => {
    if (Array.isArray(c)) return c.forEach(add);
    if (c === null || c === undefined || c === false) return;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return e;
}
export const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
export function btn(label: Kid | Kid[], onClick: () => void, cls = '', opts: { dis?: boolean; title?: string; hint?: string } = {}) {
  return h('button', { class: 'btn ' + cls, onclick: onClick, disabled: opts.dis, title: opts.title }, label, opts.hint ? h('span', { class: 'hint' }, opts.hint) : null);
}
export function bar(pct: number, cls = '') {
  return h('div', { class: 'bar ' + cls }, h('i', { style: { width: Math.max(0, Math.min(100, pct)) + '%' } }));
}
/** Màu các tầng giáp, lặp vòng: xám → lam → vàng → tím → lục → ngọc → nâu nhạt → xám… (không dùng đỏ — đỏ là máu). */
export const SHIELD_COLORS = ['#b4bec8', '#5f9fd6', '#e2b64a', '#9a7ed2', '#5cb487', '#45b0bb', '#c4a47c'];
/** Các tầng giáp phủ lên thanh máu, tính theo đơn vị máu tối đa: tầng 1 (xám) phủ từ trái sang;
 *  giáp vượt một lần máu tối đa thì tầng đó phủ kín, tầng kế (màu khác) phủ tiếp phần dư. Chỉ vẽ hai tầng trên cùng. */
export function shieldLayers(shield: number, max: number): { w: number; c: string }[] {
  const m = max > 0 ? max : 1, sh = Math.max(0, shield);
  if (sh <= 0) return [];
  const full = Math.floor(sh / m), rem = sh - full * m, n = SHIELD_COLORS.length;
  const out: { w: number; c: string }[] = [];
  if (full >= 1) out.push({ w: 100, c: SHIELD_COLORS[(full - 1) % n] });
  if (rem > 0) out.push({ w: (rem / m) * 100, c: SHIELD_COLORS[full % n] });
  return out;
}
/** Thanh khí huyết: phần máu đỏ, các tầng giáp phủ đè lên từ trái sang (xem shieldLayers). */
export function hpBar(hp: number, max: number, shield = 0, cls = 'hp') {
  const m = max > 0 ? max : 1;
  return h('div', { class: `bar ${cls} layered` },
    h('i', { style: { width: Math.max(0, Math.min(100, (hp / m) * 100)) + '%' } }),
    ...shieldLayers(shield, m).map((l) => h('i', { class: 'sh', style: { width: l.w + '%', background: l.c } })));
}
