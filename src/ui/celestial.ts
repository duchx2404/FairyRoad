// Bản đồ một thần giới (Thiên Đình / Địa Phủ / Yêu Giới / Linh Sơn): mở từ cổng bí cảnh ở trần giới. Bản đồ tĩnh,
// bấm một nơi để xem chức vụ và người đương nhiệm; Thiên Đình có thêm mục Long tộc thụ phong lấy từ các long cung của giới.
import { h, btn } from './dom';
import { glyphSvg } from './glyph';
import { openModal, closeModal } from './modal';
import { s } from '../engine/state';
import { CELESTIAL, celestialOffices, celestialTop, type CelestialId } from '../data/celestial';
import { SECTS, LOCS } from '../data/world';
import { REALMS, WORLDS } from '../data/core';

const sel: Record<string, string> = {};

export function openCelestial(id: CelestialId) {
  const R = CELESTIAL[id];
  const w = s.world ?? 0;
  sel[id] ||= R.places[Math.min(1, R.places.length - 1)].id;
  const draw = () => openModal(`${R.n} · ${WORLDS[w]}`, body(), { wide: true, xBtn: true, noClose: true, sub: `${R.kind} · trần thực lực ${REALMS[celestialTop(w)].n}` });
  const body = (): HTMLElement[] => {
    const W = 860, H = 360;
    const offices = celestialOffices(id, w);
    const map = h('div', { style: { position: 'relative', width: '100%', aspectRatio: `${W} / ${H}`, background: R.bg, borderRadius: '4px', border: '1px solid rgba(255,255,255,.18)', overflow: 'hidden' } });
    const pts = R.places.map((p) => `${(p.x / 100) * W},${(p.y / 100) * H}`).join(' ');
    map.append(h('div', { style: { position: 'absolute', inset: '0' }, html: `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${R.line}" stroke-width="3" stroke-dasharray="8 7" opacity=".7"/></svg>` }));
    for (const p of R.places) {
      const on = p.id === sel[id];
      const n = offices.filter((o) => o.place === p.id).length;
      map.append(h('button', { title: p.d, onclick: () => { sel[id] = p.id; draw(); },
        style: { position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)', background: on ? '#8a2a2a' : 'rgba(0,0,0,.45)', color: '#f1e8d6', border: `1px solid ${on ? R.line : 'rgba(255,255,255,.35)'}`, borderRadius: '3px', padding: '4px 8px', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: on ? `0 0 12px ${R.line}` : 'none' } },
        p.n, n ? h('small', { style: { opacity: '.75' } }, ` · ${n}`) : null));
    }
    const place = R.places.find((p) => p.id === sel[id])!;
    const list = h('div', { class: 'list' });
    const here = offices.filter((o) => o.place === place.id);
    if (!here.length) list.append(h('div', { class: 'empty' }, 'Nơi này không có chức vụ thường trực.'));
    for (const o of here) list.append(h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: 'rgba(0,0,0,.55)' }, html: glyphSvg('crown', 20) }),
      h('div', { class: 'nm' }, h('b', {}, o.title), ' ', h('span', { class: 'pill' }, o.name), h('span', { class: 'muted small' }, ` · ${o.realm}`), h('small', {}, o.d))));
    const out: HTMLElement[] = [h('p', { class: 'small muted' }, R.intro), map, h('h4', {}, place.n), h('p', { class: 'small' }, place.d), list];
    if (id === 'thiendinh' && place.id === 'tuhai') {
      // Long tộc thụ phong: Long Vương bốn biển và các sông của giới này
      const dl = h('div', { class: 'list' });
      for (const sc of Object.values(SECTS).filter((x) => x.dragon)) {
        const d = sc.dragon!;
        const l = LOCS[sc.loc];
        dl.append(h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: '#1d4e6e' }, html: glyphSvg('thuy', 20) }),
          h('div', { class: 'nm' }, h('b', {}, d.rank), ' ', h('span', { class: 'pill' }, d.king), h('span', { class: 'muted small' }, ` · ${d.title}`), h('small', {}, `Tiên chức Thiên Đình của ${d.title} ${sc.n}${l?.river ? `, cai quản ${l.river}` : ''}.`))));
      }
      out.push(h('h4', {}, 'Long tộc thụ phong'), dl);
    }
    out.push(h('div', { class: 'center', style: { marginTop: '12px' } }, btn('Trở về trần giới', () => closeModal(), 'prime')));
    return out;
  };
  draw();
}
