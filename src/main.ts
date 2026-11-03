import { normalizeWorldItems } from './engine/world-items';
// Điểm vào: nạp sự kiện, gắn UI với engine.
import './engine/wire';
import { kmSyncSkills } from './engine/kinhmach';
import { addLog } from './engine/core';
import { kmFillNew } from './engine/kinhmach';
import './events/core';
import './events/wild';
import './events/town';
import { s } from './engine/state';
import { hooks } from './engine/bus';
import { renderHud, renderActions, showLocPopup, showPinPopup, closePopup } from './ui/hud';
import { renderNav, renderPanels, closeAll } from './ui/panels';
import { setRefresh, setToast, closeModal, modalOpen, showScene } from './ui/modal';
import { openingScene } from './engine/intro';
import { titleScreen, deathScreen, setOnStart } from './ui/screens';
import { scionEnroll, syncClanHouse, syncHolySurnames } from './engine/life';
import { loadItemPhotos } from './ui/art';
import { LOCS, REGIONS, VUC, SECTS, daoTitle, TITLE_RE, applyWorld } from './data/world';
import './data/worlds';
import { WORLD, EL, type El } from './data/core';
import { resize, draw, centerOn, zoom, setMapHandlers, startAnim } from './ui/map';
import { h, $ } from './ui/dom';

function refreshAll() {
  normalizeWorldItems();
  renderHud();
  renderActions();
  renderPanels();
  renderNav();
  draw();
}
setRefresh(refreshAll);
setToast((m, cls) => {
  const t = h('div', { class: 'toast ' + (cls || '') }, m);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 3800);
});
hooks.toast = (m) => $('#toasts').append(h('div', { class: 'toast' }, m));
hooks.render = refreshAll;
hooks.onDeath = () => {
  if (modalOpen()) closeModal();
  closePopup();
  closeAll();
  setTimeout(deathScreen, 50);
};
hooks.onAscend = hooks.onDeath;

setMapHandlers(showLocPopup, showPinPopup, closePopup);
document.querySelectorAll<HTMLButtonElement>('#zoom button').forEach((b) =>
  b.addEventListener('click', () => {
    const z = Number(b.dataset.z);
    if (z === 0) { if (s) centerOn(s.x, s.y); } else zoom(z);
  }),
);

setOnStart(() => {
  WORLD.lv = s.world ?? 0;
  applyWorld(s.world ?? 0);
  normalizeWorldItems();
  // vị trí người chơi luôn là địa điểm đang đứng: bản đồ có thể đã dời địa điểm so với lúc lưu
  { const l = LOCS[s.loc]; if (l) { s.x = l.x; s.y = l.y; } }
  if (!s.flags.mapV14) { s.pins = []; s.flags.mapV14 = true; }
  s.flags.soulBorn ??= s.born; // bản lưu cũ: tuổi linh hồn = tuổi thân thể
  if (!s.flags.laoToV1) { // danh xưng Lão Tổ theo bậc thế lực
    for (const n of s.npcs) {
      const m = n.name.match(TITLE_RE);
      if (!m) continue;
      const tier = n.sect && SECTS[n.sect] ? SECTS[n.sect].tier : 0;
      n.name = daoTitle(n.name.replace(TITLE_RE, ''), n.r, n.st, tier, n.g);
    }
    s.flags.laoToV1 = true;
  }
  if ((s.race === 'Yêu tộc' || s.beast || s.perks.includes('yeudan')) && s.tech === 'thanhtam') {
    s.tech = 'thonnguyetquyet';
    if (!s.known.includes('yeu_hoangao')) s.known.push('yeu_hoangao');
    if (!s.skills.includes('yeu_hoangao')) s.skills.push('yeu_hoangao');
    s.known = s.known.filter((x) => x !== 'chuongphong');
    s.skills = s.skills.filter((x) => x !== 'chuongphong');
  }
  if (s.tech === 'batcuc') { // đổi Bát Cực → Bát Cửu Huyền Công
    s.tech = 'batcuu';
    const ren: Record<string, string> = { batcucbang: 'phapthientuongdia', batcuchothe: 'thatthapnhibien' };
    s.known = s.known.map((k) => ren[k] || k);
    // bản lưu cũ: hệ chiến đấu của người có hồ sơ phải khớp linh căn trong hồ sơ
    for (const n of s.npcs) if (n.bio && !n.bio.els) {
      const m = /\(([^)]+)\)/.exec(n.bio.root);
      const names = m ? m[1].split('·').map((x) => x.trim()) : [];
      const els = names.map((nm) => (Object.keys(EL) as El[]).find((e) => EL[e].n === nm)).filter((e): e is El => !!e);
      if (els.length) { n.bio.els = els; n.el = els[0]; }
    }
    s.skills = s.skills.map((k) => ren[k] || k);
  }
  syncClanHouse(); // bản lưu cũ: thế gia thiếu trưởng lão, thúc bá, anh chị em
  syncHolySurnames(); // bản lưu cũ: thánh nữ Tử Tiêu họ Lạc, Huyền Nguyên họ Lâm
  if (s.flags.holyScion && !s.sect && !s.flags.scionEnrolled) { scionEnroll(s.flags.holyScion); s.flags.scionEnrolled = true; }
  { const drop = kmSyncSkills(); if (drop.length) addLog(`Kinh mạch không đủ chỗ, tạm cất: ${drop.join(', ')}.`); } // mang theo = đã xếp vào kinh mạch
  refreshAll();
  centerOn(s.x, s.y);
  if (s.flags.introPending) { delete s.flags.introPending; showScene(openingScene()); }
});

loadItemPhotos().then(() => { if (s) refreshAll(); });
window.addEventListener('tienlo-photo', () => { if (s) refreshAll(); }); // máy vẽ vừa vẽ xong một ảnh
resize();
startAnim();
renderNav();
titleScreen();
import './events/life';
import './events/clan';
import './events/scion';
import './events/betrothal';
import './events/exile';
import './events/spirit';
import './events/shj';
import './events/random';
import './events/congtu';
import './events/suitor';
import './events/heroine';
import './events/tienco';

// Cổng debug cho kiểm thử tự động (chỉ khi chạy dev).
if (import.meta.env.DEV) {
  import('./engine/state').then((st) => import('./engine/actions').then((ac) => import('./engine/life').then((lf) => import('./engine/core').then((co) => import('./engine/events').then((ev) => import('./ui/modal').then((md) => import('./engine/api').then((api) => {
    (window as any).__tl = { st, ac, lf, co, ev, md, api, refreshAll };
  })))))));
}
