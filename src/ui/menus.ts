// Bảng tương tác: cửa tiệm, luyện chế, sảnh tông môn, đấu giá.
import { askConfirm } from './dialog';
import { glyphSvg, ITEM_KIND_GLYPH } from './glyph';
import { h, btn } from './dom';
import { scrollIconSvg } from './icons';
import { itemArtSvg, gearArtSvg } from './art';
import type { Gear } from '../data/items';
import { openModal, closeModal, toast, refresh, run } from './modal';
import { s } from '../engine/state';
import { LOCS, SECTS, SECT_RANKS, RK, rankLabel, promoReq, headTitle } from '../data/world';
import { PILLS, TALIS, HERBS, SLOTS, TECHS, GEAR_GRADE_C, TIER_C, TIER_N, gearLabel, pillGiai } from '../data/items';
import { RMAX, REALMS } from '../data/core';
import { effRi, itemName, itemDesc, itemTier, count } from '../engine/char';
import { stock, buy, sellPrice, sellItem, unsellable, sellGear, sellGearPrice, lots, winLot, consign, consignGear, auctionHeld, nextAuction, type Ware, type Lot } from '../engine/trade';
import { brew, canBrew, alchChance, draw as drawTalis, canDraw, talisChance, makePaper, PAPER_REC, forge, canForge, forgeMats, craftTitle, xpNeed, itemIdOf, pillRec, talisRec } from '../engine/craft';
import { missionPool, sectWares, promoInfo, promote, leaveSect, rankName, retire } from '../engine/sect';
import { doMission } from '../engine/actions';
import { gearLine } from '../engine/items';
import { fmt, pct, rf, ch } from '../core/util';
import { TALIS_REC, PHU_PHAM } from '../data/items';

export function icon(id: string, g?: number) {
  const svg = id.startsWith('sk:') ? scrollIconSvg(id, 30) : itemArtSvg(id, 30, g ?? 1);
  if (svg) return h('div', { class: 'ic ic-svg', html: svg });
  const k = id.split(':')[0];
  const col: Record<string, string> = { h: '#4f7a55', p: '#9b2a1f', m: '#8a6a3f', t: '#9a7a2e', cp: '#5e4c8a', sk: '#3f6a85', x: '#2a241f', gear: '#6e6253', recipe: '#9b2a1f', craft: '#4f7a55' };
  const c = col[k] || '#6e6253';
  return h('div', { class: 'ic', style: { background: g !== undefined && k === 'p' ? ['#8a7f70', '#9b2a1f', '#5e4c8a', '#9a7a2e'][g] : c }, html: glyphSvg(ITEM_KIND_GLYPH[k] || 'item', 18) });
}
const gearIcon = (gr: Gear) => h('div', { class: 'ic ic-svg', html: gearArtSvg(gr, 30) });
const tabs = (names: string[], cur: number, on: (i: number) => void) => h('div', { class: 'tabs' }, ...names.map((n, i) => h('button', { class: i === cur ? 'on' : '', onclick: () => on(i) }, n)));

// ---------- Cửa tiệm ----------
export function openShop(tab = 0) {
  const body = h('div', {});
  const draw = (t: number) => {
    body.innerHTML = '';
    body.append(tabs(['Mua', 'Bán'], t, draw), h('div', { class: 'small muted', style: { marginBottom: '6px' } }, `Linh thạch: ${fmt(s.money)}`));
    const list = h('div', { class: 'list' });
    if (t === 0) {
      const ws = stock();
      if (!ws.length) list.append(h('div', { class: 'empty' }, 'Hàng đã bán hết. Năm sau quay lại.'));
      for (const w of ws) list.append(wareRow(w, () => draw(0)));
    } else {
      for (const b of s.bag) {
        list.append(h('div', { class: 'item' }, icon(b.id, b.g), h('div', { class: 'nm' }, `${itemName(b.id, b.g)} ×${b.n}`, h('small', {}, unsellable(b.id) ? 'Chân truyền, không bán' : `Giá thu: ${sellPrice(b.id, b.g)}`)),
          h('div', { class: 'acts' }, unsellable(b.id) ? null : btn('Bán 1', () => { toast(sellItem(b.id, b.g, 1)); draw(1); refresh(); }, 'small'), !unsellable(b.id) && b.n > 1 ? btn('Bán hết', () => { toast(sellItem(b.id, b.g, b.n)); draw(1); refresh(); }, 'small') : null)));
      }
      for (const g of s.gearBag) {
        list.append(h('div', { class: 'item' }, gearIcon(g), h('div', { class: 'nm' }, g.n, h('small', {}, `${gearLabel(g)} · ${REALMS[g.lv].n} · ${gearLine(g)} · Giá thu: ${sellGearPrice(g)}`)),
          h('div', { class: 'acts' }, btn('Bán', () => { toast(sellGear(g.uid)); draw(1); refresh(); }, 'small'))));
      }
      if (!s.bag.length && !s.gearBag.length) list.append(h('div', { class: 'empty' }, 'Túi trống.'));
    }
    body.append(list);
  };
  draw(tab);
  openModal(`Cửa tiệm · ${LOCS[s.loc].n}`, body, { wide: true, seal: 'market' });
}
function wareRow(w: Ware, redraw: () => void) {
  const desc = w.gear ? `${gearLabel(w.gear)} · ${SLOTS[w.gear.slot]} · ${REALMS[w.gear.lv].n} · ${gearLine(w.gear)}` : w.d || (w.id.includes(':') && !w.id.startsWith('recipe') && !w.id.startsWith('craft') ? itemDesc(w.id) : '');
  return h('div', { class: 'item' }, w.gear ? gearIcon(w.gear) : icon(w.id, w.g),
    h('div', { class: 'nm' }, w.n, w.qty > 1 ? h('span', { class: 'muted small' }, ` (còn ${w.qty})`) : null, h('small', {}, desc)),
    h('div', { class: 'acts' }, btn(`${fmt(w.price)}`, () => { toast(buy(w)); redraw(); refresh(); }, 'small', { dis: s.money < w.price, title: 'Mua' })));
}

// ---------- Luyện chế ----------
/** "Tên (có/cần)", tô đỏ khi thiếu. */
const need = (name: string, have: number, n = 1) => h('span', { class: have < n ? 'need-no' : 'need-ok' }, `${name} (${have}/${n})`);
const needList = (items: [string, number, number][]) => { const out: (HTMLElement | string)[] = []; items.forEach(([nm, hv, n], i) => out.push(i ? ', ' : '', need(nm, hv, n))); return out; };
export function openCraft(tab = -1) {
  const body = h('div', {});
  const ks = ['alch', 'talis', 'forge'] as const;
  const t0 = tab >= 0 ? tab : 0;
  const draw = (t: number) => {
    body.innerHTML = '';
    body.append(tabs(ks.map((k) => ({ alch: 'Luyện đan', talis: 'Chế phù', forge: 'Luyện khí' })[k]), t, draw));
    const k = ks[t];
    const lv = s.craft[k];
    const xk = ({ alch: 'ax', talis: 'tx', forge: 'fx' } as const)[k];
    body.append(h('div', { class: 'small muted', style: { marginBottom: '8px' } }, `Tay nghề: ${craftTitle(lv, k)} (cấp ${lv}) · kinh nghiệm ${s.craft[xk]}/${xpNeed(lv)}${s.flags.flame ? ' · có linh hỏa' : ''}`));
    const list = h('div', { class: 'list' });
    const out = h('div', { class: 'story res', style: { minHeight: '1em' } });
    if (!lv) {
      list.append(h('div', { class: 'empty' }, ({ alch: 'Chưa nhập môn luyện đan. Học ở phường thị, đan phòng tông môn, hoặc từ kỳ ngộ; có đan lô và đan phương là luyện được.', talis: 'Chưa nhập môn chế phù. Học ở phường thị hay tông môn; cần phù chỉ, chu sa và phù phương.', forge: 'Chưa nhập môn luyện khí. Học ở lò rèn Thiết Thành hoặc tông môn luyện khí; cần tinh kim, huyền thiết và lò rèn.' })[k]));
      body.append(list);
      return;
    }
    const say = (m: string) => { out.textContent = m; draw2(); };
    const draw2 = () => { refresh(); const keep = out.textContent; draw(t); body.querySelector('.story')!.textContent = keep; };
    if (k === 'alch') {
      const known = Object.values(PILLS).filter((p) => s.recipes.includes(p.id)).sort((a, b) => a.tier - b.tier);
      if (!known.length) list.append(h('div', { class: 'empty' }, 'Chưa có đan phương nào. Mua ở phường thị hoặc tìm trong kỳ ngộ.'));
      for (const p of known) {
        const err = canBrew(p.id);
        list.append(h('div', { class: 'item' }, icon('p:' + p.id), h('div', { class: 'nm' }, `${p.n} `, h('span', { class: 'pill', style: { color: TIER_C[pillGiai(p)] } }, pillGiai(p) ? TIER_N[pillGiai(p)] : 'Phàm phẩm'),
          h('small', {}, `${p.d} Cần: `, ...needList(pillRec(p.id).map(([id, n]) => [itemName(id), count(id), n])), `. Thành công ~${pct(alchChance(p.id))}`)),
          h('div', { class: 'acts' }, btn('Luyện', () => say(brew(p.id)), 'small', { dis: !!err, title: err || '' }))));
      }
    } else if (k === 'talis') {
      const known = Object.values(TALIS).filter((x) => !x.co && s.recipes.includes(x.id)).sort((a, b) => a.p - b.p);
      const co = !!s.flags.coPhu;
      if (co) {
        body.append(h('div', { class: 'small muted', style: { marginBottom: '6px' } }, 'Bí tịch chế phù thượng cổ: cổ phù mạnh gấp mười, nhưng phải vẽ trên giấy da yêu thú (tới Tứ phẩm) hoặc giấy linh mộc (mọi phẩm).'));
        PAPER_REC.forEach(([src, out, n], i) => list.append(h('div', { class: 'item' }, icon('m:' + out), h('div', { class: 'nm' }, `Chế ${itemName('m:' + out)}`,
          h('small', {}, 'Cần: ', need(itemName('m:' + src), count('m:' + src), 1), ` → ${n} tờ. Đang có ${count('m:' + out)} tờ.`)),
          h('div', { class: 'acts' }, btn('Chế', () => say(makePaper(i)), 'small', { dis: count('m:' + src) < 1 })))));
      }
      if (!known.length) list.append(h('div', { class: 'empty' }, 'Chưa có phù phương nào.'));
      for (const x of known) {
        const err = canDraw(x.id);
        const errCo = co ? canDraw(x.id, true) : null;
        list.append(h('div', { class: 'item' }, icon('t:' + x.id), h('div', { class: 'nm' }, x.n, ' ', h('span', { class: 'pill', style: { color: TIER_C[x.tier] } }, `${PHU_PHAM[x.p]} phẩm · ${REALMS[x.p - 1].n}`),
          h('small', {}, `${x.d} Cần: `, ...needList(talisRec(x.id).map(([m, n]) => [itemName(itemIdOf(m)), count(itemIdOf(m)), n])), `. Thành công ~${pct(talisChance(x.id))}`)),
          h('div', { class: 'acts' }, btn('Vẽ', () => say(drawTalis(x.id)), 'small', { dis: !!err, title: err || '' }),
            ...(co ? [btn('Vẽ cổ phù', () => say(drawTalis(x.id, true)), 'small prime', { dis: !!errCo, title: errCo || '' })] : []))));
      }
    } else {
      for (let gl = 0; gl <= Math.min(RMAX(), Math.max(lv, 1)); gl++) {
        if (gl > effRi() + 1) break;
        const err = canForge(gl);
        list.append(h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: '#6e6253' }, html: glyphSvg('furnace', 18) }), h('div', { class: 'nm' }, `Pháp khí cấp ${REALMS[gl].n}`,
          h('small', {}, 'Cần: ', ...needList(forgeMats(gl).map(([id, n]) => [itemName(id), count(id), n])), `${LOCS[s.loc].forge ? ' · Lò rèn Thiết Thành +10%' : ''}`)),
          h('div', { class: 'acts' }, ...SLOTS.map((sn, i) => btn(sn, () => say(forge(gl, i)), 'small', { dis: !!err, title: err || '' })))));
      }
    }
    body.append(list, out);
  };
  draw(t0);
  openModal('Luyện chế', body, { wide: true, seal: 'furnace' });
}

// ---------- Sảnh tông môn ----------
export function openSectHall(tab = 0, filter: 'book' | 'vault' | '' = '') {
  if (!s.sect) return;
  const sc = SECTS[s.sect.id];
  const body = h('div', {});
  const draw = (t: number) => {
    body.innerHTML = '';
    const pi = promoInfo();
    body.append(
      h('div', { class: 'small', style: { marginBottom: '6px' } }, `${rankName()} · Cống hiến: `, h('b', {}, String(s.sect!.contrib)), ` · ${pi.why}`),
      tabs(['Nhiệm vụ', 'Tàng kinh các & Đan phòng', 'Thân phận'], t, draw),
    );
    const list = h('div', { class: 'list' });
    if (t === 0) {
      missionPool().forEach((m, i) => list.append(h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: '#9b2a1f' }, html: glyphSvg('token', 18) }),
        h('div', { class: 'nm' }, m.n, h('small', {}, `${m.d} · ${m.y} lượt · nguy hiểm ${m.danger >= 1 ? 'cao (có thể chết)' : m.danger >= 0.5 ? 'vừa' : m.danger > 0 ? 'thấp' : 'không'} · +${m.reward} cống hiến`)),
        h('div', { class: 'acts' }, btn('Nhận', () => { closeModal(); run(() => doMission(i)); }, 'small', { dis: m.danger >= 1 && s.r === 0 })))));
    } else if (t === 1) {
      for (const w of sectWares().filter((x) => !x.gear && !/^(h|m|t):/.test(x.id)).filter((x) => !filter || (filter === 'book' ? /^(cp|sk):/.test(x.id) : x.id.startsWith('p:')))) {
        const locked = s.sect!.rank < w.minRank;
        list.append(h('div', { class: 'item' }, icon(w.id), h('div', { class: 'nm' }, w.id.startsWith('cp:') ? `Bí kíp: ${w.n}` : w.id.startsWith('sk:') ? `Thuật: ${w.n}` : w.n,
          h('small', {}, `${itemDesc(w.id)}${locked ? ` · cần ${rankLabel(w.minRank, sc, s.g)}` : ''}`)),
          h('div', { class: 'acts' }, btn(`${w.cost} cống hiến`, () => {
            s.sect!.contrib -= w.cost;
            s.bag.push({ id: w.id, n: 1, g: w.id.startsWith('p:') ? 1 : undefined });
            toast(`Đổi được ${itemName(w.id)}.`);
            draw(1); refresh();
          }, 'small', { dis: locked || s.sect!.contrib < w.cost }))));
      }
    } else {
      list.append(h('div', { class: 'card' }, h('b', {}, sc.n), h('div', { class: 'small muted' }, sc.d), h('div', { class: 'small' }, `Môn quy: “${sc.motto}”`)));
      const ladder = h('div', { class: 'rank-ladder' });
      SECT_RANKS.forEach((_, i) => {
        const [rr, cc] = promoReq(i, sc);
        const cur = s.sect!.rank === i;
        ladder.append(h('div', { class: 'rank-row' + (cur ? ' cur' : '') + (i < s.sect!.rank ? ' done' : '') },
          h('span', { class: 'rk-i' }, String(i + 1)), h('b', {}, rankLabel(i, sc, s.g)),
          h('small', {}, i === RK.THAITHUONG ? `${headTitle(sc)} thoái vị · vai vế cao nhất, quyền thua ${headTitle(sc).toLowerCase()} đương nhiệm` : i ? `${REALMS[rr].n} · ${cc} cống hiến` : 'Mới nhập môn')));
      });
      list.append(h('h4', {}, 'Thang bậc'), ladder);
      list.append(h('div', { class: 'row', style: { display: 'flex', gap: '6px', marginTop: '8px' } },
        btn('Xin thăng cấp', () => { toast(promote()); draw(2); refresh(); }, 'prime', { dis: !pi.can }),
        s.sect!.rank === RK.CHU ? btn(`Thoái vị làm Thái thượng trưởng lão`, () => askConfirm('Thoái vị làm Thái thượng trưởng lão? Ngươi sẽ không còn nắm quyền tông môn.', () => { toast(retire()); draw(2); refresh(); }, { title: 'Thoái vị', ok: 'Thoái vị' })) : null,
        btn('Rời tông môn', () => askConfirm('Rời tông môn? Mọi quyền lợi, cống hiến và thân phận sẽ mất.', () => { toast(leaveSect(false)); closeModal(); }, { title: 'Rời tông môn', ok: 'Rời đi', danger: true }), 'danger')));
    }
    body.append(list);
  };
  draw(tab);
  openModal(filter === 'book' ? 'Tàng Kinh Các' : filter === 'vault' ? 'Bảo khố tông môn' : sc.n, body, { wide: true, seal: 'sect' });
}

// ---------- Đấu giá ----------
export function openAuction() {
  const l = LOCS[s.loc];
  const body = h('div', {});
  if (!auctionHeld()) {
    body.append(h('p', {}, `Túy Vân Lâu đóng cửa. Phiên tới vào năm ${nextAuction()}.`), h('p', { class: 'small muted' }, 'Vẫn có thể ký gửi bán đồ qua nhà đấu giá (giá dao động, thường cao hơn bán tiệm).'));
  }
  const draw = (t: number) => {
    body.innerHTML = '';
    body.append(tabs(['Phiên đấu giá', 'Ký gửi'], t, draw), h('div', { class: 'small muted', style: { marginBottom: '6px' } }, `Linh thạch: ${fmt(s.money)}`));
    const list = h('div', { class: 'list' });
    if (t === 0) {
      if (!auctionHeld()) list.append(h('div', { class: 'empty' }, `Phiên tới vào năm ${nextAuction()}.`));
      else for (const lot of lots()) list.append(lotRow(lot, () => draw(0)));
    } else {
      for (const b of s.bag) if (itemTier(b.id) >= 2) list.append(h('div', { class: 'item' }, icon(b.id, b.g), h('div', { class: 'nm' }, `${itemName(b.id, b.g)} ×${b.n}`), h('div', { class: 'acts' }, btn('Ký gửi 1', () => { toast(consign(b.id, b.g)); draw(1); refresh(); }, 'small'))));
      for (const g of s.gearBag) if (g.g >= 1) list.append(h('div', { class: 'item' }, gearIcon(g), h('div', { class: 'nm' }, g.n, h('small', {}, gearLabel(g))), h('div', { class: 'acts' }, btn('Ký gửi', () => { toast(consignGear(g.uid)); draw(1); refresh(); }, 'small'))));
      if (!list.children.length) list.append(h('div', { class: 'empty' }, 'Nhà đấu giá chỉ nhận vật từ nhị phẩm trở lên.'));
    }
    body.append(list);
  };
  draw(0);
  openModal(`Nhà đấu giá · ${l.n}`, body, { wide: true, seal: 'gavel' });
}
function lotRow(lot: Lot, redraw: () => void) {
  const desc = lot.gear ? `${gearLabel(lot.gear)} · ${SLOTS[lot.gear.slot]} · ${REALMS[lot.gear.lv].n} · ${gearLine(lot.gear)}` : itemDesc(lot.id);
  const row = h('div', { class: 'item' }, lot.gear ? gearIcon(lot.gear) : icon(lot.id, lot.g), h('div', { class: 'nm' }, lot.n, h('small', {}, desc)));
  const acts = h('div', { class: 'acts' });
  if (lot.sold) acts.append(h('span', { class: 'small muted' }, 'Đã bán'));
  else acts.append(btn(`Khởi điểm ${fmt(lot.start)}`, () => bidding(lot, redraw), 'small'));
  row.append(acts);
  return row;
}
function bidding(lot: Lot, redraw: () => void) {
  let price = lot.start;
  let leader: 'me' | 'rival' | null = null;
  const log = h('div', { class: 'story', style: { maxHeight: '220px', overflow: 'auto', fontSize: '14px' } });
  const box = h('div', { class: 'choices' });
  const say = (m: string) => { log.append(h('div', {}, m)); log.scrollTop = log.scrollHeight; };
  const step = () => Math.max(1, Math.round(price * 0.1));
  const rivalTurn = () => {
    if (price + step() <= lot.rivalMax && ch(0.85)) {
      price += step();
      leader = 'rival';
      say(`${lot.rival} ra giá ${fmt(price)}.`);
    } else {
      say(`${lot.rival} lắc đầu, không theo nữa.`);
      leader = 'me';
      finish();
      return;
    }
    renderBtns();
  };
  const finish = () => {
    box.innerHTML = '';
    if (leader === 'me') {
      const r = winLot(lot, price);
      say(r);
    } else say(`${lot.n} về tay ${lot.rival} với giá ${fmt(price)}.`);
    lot.sold = true;
    (s.flags.aucSold ||= {})[lot.key] = true;
    box.append(btn('Trở lại', () => { openAuction(); redraw; }, 'prime'));
    refresh();
  };
  const renderBtns = () => {
    box.innerHTML = '';
    const next = leader === null ? price : price + step();
    box.append(
      btn(`Ra giá ${fmt(next)}`, () => { price = next; leader = 'me'; say(`Ngươi ra giá ${fmt(price)}.`); setTimeout(rivalTurn, 250 + rf(0, 300)); box.innerHTML = ''; }, 'prime', { dis: s.money < next }),
      btn('Bỏ', () => { if (leader === 'me') finish(); else { leader = 'rival'; finish(); } }),
    );
  };
  say(`Người chủ trì gõ búa: "${lot.n}, giá khởi điểm ${fmt(price)} linh thạch!"`);
  renderBtns();
  openModal(`Đấu giá: ${lot.n}`, [log, box], { seal: 'gavel', noClose: true });
}
export { TECHS };
