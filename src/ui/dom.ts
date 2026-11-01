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
