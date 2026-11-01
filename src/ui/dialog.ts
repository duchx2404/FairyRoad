// Hộp thoại xác nhận / thông báo theo phong cách game (thay cho confirm/alert của trình duyệt).
import { h, btn } from './dom';
import { glyphSvg } from './glyph';

let open: HTMLElement | null = null;

function show(title: string, msg: string, buttons: HTMLElement[], danger = false) {
  open?.remove();
  const close = () => { open?.remove(); open = null; removeEventListener('keydown', onKey, true); };
  const box = h('div', { class: 'dlg-veil', onclick: (e: Event) => { if (e.target === box) close(); } },
    h('div', { class: 'dlg' + (danger ? ' danger' : '') },
      h('div', { class: 'dlg-title' }, h('span', { class: 'dlg-seal', html: glyphSvg(danger ? 'warn' : 'ask', 17, 2) }), title),
      h('div', { class: 'dlg-msg' }, msg),
      h('div', { class: 'dlg-btns' }, ...buttons)));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'Enter') { e.stopPropagation(); (box.querySelector('.dlg-btns .prime, .dlg-btns .danger') as HTMLButtonElement | null)?.click(); }
  };
  addEventListener('keydown', onKey, true);
  document.body.append(box);
  open = box;
  (box.querySelector('.dlg-btns .btn') as HTMLButtonElement | null)?.focus();
  return close;
}

/** Hỏi xác nhận. onOk chạy khi người chơi đồng ý. */
export function askConfirm(msg: string, onOk: () => void, o: { title?: string; ok?: string; cancel?: string; danger?: boolean } = {}) {
  let close = () => {};
  const okBtn = btn(o.ok ?? 'Đồng ý', () => { close(); onOk(); }, o.danger ? 'danger' : 'prime');
  const noBtn = btn(o.cancel ?? 'Thôi', () => close(), 'ghost');
  close = show(o.title ?? 'Xác nhận', msg, [noBtn, okBtn], o.danger);
}

/** Thông báo một nút. */
export function notice(msg: string, title = 'Thông báo') {
  let close = () => {};
  close = show(title, msg, [btn('Đã hiểu', () => close(), 'prime')]);
}
