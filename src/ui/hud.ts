import { childScene, engageScene, needEngageScene, congratsScene, needCongratsScene } from '../events/diephd';
import { glyphSvg } from './glyph';
import { courtTitle } from '../engine/court';
// Mệnh bài góc trái, thanh hành động dưới đáy, popup địa điểm.
import { h, $, btn, bar } from './dom';
import { hasPhoto, photoUrl } from './art';
import { drawButtons } from './artgen';
import { R_CHUANTHANH, laws } from '../engine/dao';
import { openModal, closeModal, refresh } from './modal';
import { stoneForRealm, STONE_NAMES, STONE_VALUE, formatStonesDetail, formatStonesShort, stonesToBottleneck } from '../engine/stones';
import { weaponKind } from './arena';
import { s, type Pin, type NPC } from '../engine/state';
import { LAST_WORLD, RMAX, worldName, REALMS, STAGES, splitName, GIVEN_F, GIVEN_M } from '../data/core';
import { LOCS, LOC_TYPE, REGIONS, SECTS, VUC, rankLabel, whereOf, ownerTxt, type Loc } from '../data/world';
import { TECHS } from '../data/items';
import { soulAge } from '../engine/char';
import { turnLen, age, maxLife, rootLabel, cultRate, atBottleneck, powerScore, stageName, body, techAff, isYao, yeuDanName } from '../engine/char';
import { dateStr, realmOpen, nextOpen, passTime, renameNpc } from '../engine/core';
import { daoScene, cultivate, breakthroughScene, wander, explore, gatherScene, work, rest, travelTo, travelInfo, visitPin, eventScene } from '../engine/actions';
import { auctionHeld } from '../engine/trade';
import { run, showScene, toast, setGate, setPrelude, setFollow } from './modal';
import { EVENTS } from '../engine/events';
import { retPeople, worldOf } from '../engine/tienco';
import { fengshenGateScene } from '../events/fengshen';
import { exileTalkScene } from '../events/exile';
import { reviveBrides } from '../engine/bride';
// Tới mười sáu tuổi (Diệp gia Hỗn Độn): dù đang làm gì cũng phải qua định đoạt hôn ước trước, rồi mới xem kết quả việc đang làm.
// Cố nhân bị hãm hại rời tông (bản lưu cũ đã đánh xong truy binh): hỏi dự định ở hành động kế tiếp.
setGate(() => { reviveBrides(); return needEngageScene() ? engageScene() : exileTalkScene() ?? fengshenGateScene(); });
// Vừa gia nhập tông môn / đại hoàng triều trước 16 tuổi: đóng cảnh gia nhập xong thì hiện thư chúc mừng của các vị hôn thê.
setFollow(() => (needCongratsScene() ? congratsScene() : null));
setPrelude(() => {
  if (worldOf() === 0 && s.evSeen.tc_sao_bang === undefined) {
    retPeople();
    const event = EVENTS.find((e) => e.id === 'tc_sao_bang');
    if (event) return eventScene(event);
  }
  return fengshenGateScene();
});
import { setTravelLine, centerOn } from './map';
import { openShop, openCraft, openSectHall, openAuction } from './menus';
import { openPlace, openRemote } from './place';
import { showBeastBranchModal } from './panels';
import { fmt, yearsTxt, esc } from '../core/util';

import { playerPortrait, npcPortrait, npcPic, foePortrait, avatarSvg } from './portrait';
export { playerPortrait, npcPortrait, npcPic, npcPicWanted, foePortrait, avatarSvg } from './portrait';
/** Khoá ảnh toàn thân (sprite) của một người: nhân vật chính theo vũ khí; thánh nữ có ảnh riêng sn_full_*; còn lại dùng sprite tu sĩ theo giới. */
export function fullBodyKey(pic: string, g: 'm' | 'f', weapon = 'quyen'): string | null {
  // ảnh xem chi tiết: nhóm full_* (trực diện); chưa vẽ thì không mượn sprite trận (quay nghiêng), để chân dung.
  // Nhân vật chính: luôn bản TAY KHÔNG (user chốt 2026-10-31: tranh toàn thân không vẽ vũ khí, vũ khí chỉ có ở sprite trận).
  void weapon;
  if (pic.startsWith('pc_')) { const k = `full_pc_${g}_quyen`; return hasPhoto(k) ? k : null; }
  if (pic.startsWith('sn_') || pic.startsWith('st_')) { const base = 'full_sn_' + pic.split('_')[1]; return hasPhoto('full_' + pic) ? 'full_' + pic : pic.startsWith('sn_') && hasPhoto(base) ? base : null; } // biến thể theo hệ dùng tranh toàn thân của bản gốc thế lực
  if (pic.startsWith('npc_')) { const k = `full_npc_cultivator_${g}`; return hasPhoto(k) ? k : null; }
  return null;
}
/** Khoá tranh toàn thân NÊN có cho một ảnh chân dung (kể cả khi chưa vẽ) — dùng cho nút "Vẽ toàn thân". */
export function fullBodyWanted(pic: string, g: 'm' | 'f'): string | null {
  if (pic.startsWith('pc_')) return `full_pc_${g}_quyen`;
  if (pic.startsWith('sn_')) return 'full_sn_' + pic.split('_')[1];
  if (pic.startsWith('npc_')) return `full_npc_cultivator_${g}`;
  return null;
}
/** Bấm avatar: mở ảnh phóng to — toàn thân nếu đã vẽ, không thì chân dung. Kèm nút "Vẽ chân dung" / "Vẽ toàn thân" vẽ riêng người này
 *  (máy vẽ tools/art_server.py vẽ từng ảnh một). `want`: các khoá chân dung muốn có theo thứ tự ưu tiên (mặc định chính `pic`). */
/** Ô đổi tên: họ giữ nguyên, chỉ sửa tên riêng; có nút lấy tên ngẫu nhiên. */
function renameBox(n: NPC, onDone: (name: string) => void, onCancel: () => void): HTMLElement {
  const { sur, given } = splitName(n.name);
  const input = h('input', { class: 'por-rename-in', value: given, maxlength: '20', 'aria-label': 'Tên riêng' }) as HTMLInputElement;
  const err = h('div', { class: 'por-rename-err' });
  const save = () => {
    const e = renameNpc(n, `${sur} ${input.value}`);
    if (e) { err.textContent = e; return; }
    onDone(n.name);
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } });
  setTimeout(() => input.select(), 0);
  return h('div', { class: 'por-rename' },
    h('div', { class: 'por-rename-row' }, h('b', {}, sur), input),
    h('div', { class: 'por-rename-row' },
      btn('Ngẫu nhiên', () => { const pool = (n.g === 'f' ? GIVEN_F : GIVEN_M).filter((x) => x !== input.value); input.value = pool[Math.floor(Math.random() * pool.length)]; err.textContent = ''; }, 'small ghost'),
      btn('Lưu', save, 'small prime'), btn('Thôi', onCancel, 'small ghost')),
    err);
}
export function openPortrait(name: string, pic: string, g: 'm' | 'f', sub = '', weapon = 'quyen', want: string[] = [pic], npcId?: string, characterAge?: number) {
  const box = h('div', { class: 'por-big' });
  const npc = npcId ? s.npcs.find((x) => x.id === npcId) : undefined;
  let editing = false;
  const paint = () => {
    const full = fullBodyKey(pic, g, weapon);
    const src = full ? photoUrl(full) : hasPhoto(pic) ? photoUrl(pic) : null;
    box.className = 'por-big' + (full ? ' full' : '');
    box.innerHTML = '';
    const cap = editing && npc
      ? renameBox(npc, (nm) => {
        name = nm; editing = false;
        const t = document.querySelector('#modal h2')?.childNodes[1];
        if (t) t.textContent = nm;
        refresh(); paint(); toast(`Đã đổi tên thành ${nm}.`);
      }, () => { editing = false; paint(); })
      : h('div', { class: 'por-cap' },
        h('div', { class: 'por-name' }, h('b', {}, name), npc ? btn('Đổi tên', () => { editing = true; paint(); }, 'small ghost') : null),
        sub ? h('small', {}, sub) : null);
    box.append(src ? h('img', { src, alt: name }) : h('div', { class: 'empty' }, 'Chưa có tranh. Bấm "Vẽ chân dung" để vẽ riêng người này.'),
      cap,
      drawButtons({ want, full: fullBodyWanted(want[0] ?? pic, g), onDone: (k) => { if (!k.startsWith('full_')) pic = k; paint(); } }));
  };
  paint();
  openModal(name, box, { seal: 'portrait', characterAge: characterAge ?? (npc ? s.year - npc.born : name === s.name ? age() : null) });
}
export function renderHud() {
  const el = $('#hud');
  if (!s) { el.hidden = true; return; }
  el.hidden = false;
  if (!el.dataset.initialized) {
    el.classList.toggle('mini', matchMedia('(max-width: 720px)').matches);
    el.dataset.initialized = 'true';
  }
  const mini = el.classList.contains('mini');
  const life = maxLife();
  const a = age();
  const t = s.tech ? TECHS[s.tech] : null;
  const l = LOCS[s.loc];
  el.innerHTML = '';
  el.append(
    h('button', { class: 'hud-min', title: mini ? 'Mở thông tin' : 'Thu gọn', 'aria-label': mini ? 'Mở thông tin nhân vật' : 'Thu gọn thông tin nhân vật', 'aria-expanded': String(!mini), onclick: () => { el.classList.toggle('mini'); renderHud(); } }, mini ? '▾' : '▴'),
    h('div', { class: 'hud-top' },
      h('div', { class: 'avatar click', title: 'Xem tranh toàn thân', onclick: () => openPortrait(s.name, playerPortrait(s.g, age()), s.g, stageName(), weaponKind()), html: avatarSvg(s.g, s.r, s.root.els[0] || null, 54, playerPortrait(s.g, age())) }),
      h('div', {},
        h('div', { class: 'hud-name' }, s.name),
        h('div', { class: 'hud-realm' }, stageName() + (s.world ? ` · ${worldName(s.world)}` : '')),
        h('div', {
          class: 'hud-sub',
          title: isYao()
            ? `Yêu tộc thọ nguyên gấp 4 lần nhân tộc: ${fmt(a)} tuổi Yêu tộc ≈ ${fmt(+(a / 4).toFixed(1))} tuổi Nhân tộc | ${formatStonesDetail(s.money)}`
            : formatStonesDetail(s.money)
        }, `${fmt(a)} / ${fmt(life)} tuổi${isYao() ? ` (≈ ${fmt(+(a / 4).toFixed(1))}t Nhân)` : ''}${s.world ? ` (hồn ${fmt(soulAge())})` : ''} · ${formatStonesShort(s.money)}`),
      ),
    ),
    h('div', { class: 'hud-detail' },
      h('div', { class: 'hud-row', style: { marginTop: '8px' } }, h('span', {}, s.r === 0 ? 'Cảm ứng linh khí' : 'Tu vi'), h('span', {}, atBottleneck() ? 'Bình cảnh' : `${Math.floor(s.prog)}%`)),
      bar(s.prog),
      h('div', { class: 'hud-row' }, h('span', {}, 'Khí huyết'), h('span', {}, s.hurt > 0 ? `Thương ${Math.round(s.hurt)}%` : 'Khỏe mạnh')),
      bar(100 - s.hurt, 'hp'),
      h('div', {
        class: 'hud-row',
        title: isYao()
          ? `Còn ${fmt(Math.max(0, life - a))} năm Yêu tộc (tương đương ${fmt(+((life - a) / 4).toFixed(1))} năm Nhân tộc)`
          : undefined
      }, h('span', {}, 'Thọ nguyên'), h('span', {}, `còn ${fmt(Math.max(0, life - a))} năm`)),
      bar(((life - a) / life) * 100, 'life'),
      s.tamma > 5 ? [h('div', { class: 'hud-row' }, h('span', {}, 'Tâm ma'), h('span', {}, `${Math.round(s.tamma)}`)), bar(s.tamma, 'tm')] : null,
      h('div', { class: 'kv' },
        ...(isYao() ? [h('span', {}, 'Yêu Đan'), h('span', {}, `${yeuDanName()} · ${s.beast || 'Yêu thú'}`)] : [h('span', {}, 'Linh căn'), h('span', {}, rootLabel())]),
        h('span', {}, 'Công pháp'), h('span', {}, t ? `${t.n} (hợp ${Math.round(techAff() * 100)}%)` : 'Chưa có'),
        h('span', {}, 'Tốc độ tu'), h('span', {}, `${cultRate().toFixed(1)}%/lượt (${yearsTxt(turnLen())})`),
        h('span', {}, 'Chiến lực'), h('span', {}, fmt(powerScore())),
        s.flags.court ? [h('span', {}, 'Triều đình'), h('span', {}, courtTitle())] : null,
        s.sect ? [h('span', {}, 'Tông môn'), h('span', {}, `${SECTS[s.sect.id].n} · ${rankLabel(s.sect.rank, SECTS[s.sect.id], s.g)}`)] : null,
        s.flags.fengshen?.mode === 'neutral' ? [h('span', {}, 'Phong Thần'), h('span', {}, s.flags.fengshen.ended ? `Thiên mệnh · ${s.flags.fengshen.winner}` : 'Ngoài Lượng Kiếp')] : null,
        s.flags.fengshen?.mode === 'liangjie' ? [h('span', {}, 'Phong Thần'), h('span', {}, s.flags.fengshen.ended ? `Kết thúc · ${s.flags.fengshen.winner}` : `${s.flags.fengshen.faction} · công trận ${s.flags.fengshen.merit}`)] : null,
      ),
      h('div', { class: 'hud-loc' }, h('b', {}, l.n), ` · ${LOC_TYPE[l.type].n}, ${whereOf(l)}`, ownerTxt(l) ? h('div', { class: 'small muted' }, ownerTxt(l)) : null, h('div', { class: 'small muted' }, dateStr())),
    ),
  );
  void body;
  void STAGES;
}

// ---------- Thanh hành động ----------
export function renderActions() {
  const bx = $('#actions');
  bx.innerHTML = '';
  if (!s || s.dead) { bx.hidden = true; return; }
  bx.hidden = false;
  const l = LOCS[s.loc];
  const add = (...e: (HTMLElement | null)[]) => e.forEach((x) => x && bx.append(x));
  const sep = () => h('div', { class: 'act-sep' });
  // tuổi thơ (xuất thân Diệp gia Hỗn Độn): chỉ có sự kiện cùng các thánh nữ
  if (s.flags.childhood) {
    add(btn(`Tuổi thơ · ${Math.floor(s.year - s.born)} tuổi`, () => run(childScene), 'prime', { title: 'Từ 1 tới 6 tuổi chưa thể tu luyện — lớn lên cùng các thánh nữ' }));
    add(h('div', { class: 'act-here' }, h('span', {}, 'Đang ở ', h('b', {}, l.n))));
    return;
  }
  if (needEngageScene()) add(btn('Hôn ước năm mười sáu tuổi', () => run(engageScene), 'prime'));
  if (s.flags.pendingBeastBranches && s.flags.pendingBeastBranches.length > 0) {
    add(btn('⚡ Chọn Đạo Lộ Tiến Hóa', () => showBeastBranchModal(), 'prime', { title: 'Lựa chọn nhánh thoát biến huyết mạch cho yêu thú' }));
  }
  // tu luyện
  if (atBottleneck()) {
    add(btn(s.r === 0 ? 'Đả thông kinh mạch' : s.r === RMAX() || (s.body === 'thiendo' && s.r === 1) ? ((s.world ?? 0) >= LAST_WORLD ? 'Hợp nhất Đại Đạo' : 'Độ kiếp phi thăng') : 'Đột phá', () => run(breakthroughScene), 'prime'));
  } else {
    const turn = turnLen();
    add(h('div', { class: 'act-group' },
      btn('Bế quan', openCultivateModal, 'prime', { title: `Bế quan tu luyện (chọn số lượt & dùng linh thạch)` }),
      btn('×5', () => run(() => cultivate(5)), 'small', { title: `Bế quan nhanh 5 lượt: ${yearsTxt(turn * 5)}` }),
      btn(s.body === 'thiendo' && s.r === 1 ? 'Tới tầng kế' : 'Tới bình cảnh', () => run(() => cultivate(60)), 'small', { title: 'Bế quan liên tục tới khi chạm bình cảnh / lên tầng mới (có thể bị sự kiện cắt ngang)' }),
    ));
  }
  if (s.hurt >= 15) add(btn('Dưỡng thương', () => run(rest)));
  add(btn('Luyện chế', () => openCraft(), '', { title: 'Luyện đan · Chế phù · Luyện khí' }));
  if (s.r >= R_CHUANTHANH) add(btn('Tham ngộ', () => run(daoScene), laws().length ? '' : 'prime', { title: 'Cảm ngộ Pháp tắc (Chuẩn Thánh) và Đại đạo (Thánh Nhân)' }));
  add(sep());
  const enter = { village: 'Vào thôn', town: 'Vào thành', market: 'Vào phường thị', sect: s.sect?.id === l.sect ? 'Vào sơn môn' : s.flags.holyScion === l.sect ? 'Về phủ' : 'Tới sơn môn', wild: 'Tiến vào', realm: 'Tiến vào', formation: 'Xem truyền tống trận' }[l.type];
  add(h('div', { class: 'act-here' }, h('span', {}, 'Đang ở ', h('b', {}, l.n), ` · ${LOC_TYPE[l.type].n}`), btn(enter, () => openPlace(), 'prime')));

}

/** Công tử thánh địa về phủ: thỉnh an, nhận bổng lộc, xin trắc linh lại. */
// ---------- Popup ----------
const pop = $('#popup');
export function closePopup() {
  pop.hidden = true;
  setTravelLine(null);
}
function place(sx: number, sy: number) {
  pop.hidden = false;
  const w = pop.offsetWidth, hh = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, sx + 14)) + 'px';
  pop.style.top = Math.max(8, Math.min(innerHeight - hh - 8, sy - hh / 2)) + 'px';
}
export function showLocPopup(l: Loc, _sx: number, _sy: number) {
  closePopup();
  if (l.id === s.loc && Math.hypot(s.x - l.x, s.y - l.y) < 2) openPlace(l.id);
  else openRemote(l.id);
}
export function showPinPopup(p: Pin, sx: number, sy: number) {
  pop.innerHTML = '';
  const names: Record<string, [string, string]> = {
    '?': ['Kỳ ngộ', 'Có điều gì đó khác thường ở đây. Có thể là cơ duyên, cũng có thể là rắc rối.'],
    '!': ['Nguy hiểm', 'Yêu khí hoặc sát khí bốc lên. Kẻ yếu tránh xa.'],
    bao: ['Bảo quang', 'Ánh sáng lấp lánh, dường như có bảo vật xuất thế.'],
    bi: ['Bí ẩn', 'Một lối vào bị che giấu, không biết dẫn tới đâu.'],
  };
  const [n, d] = names[p.k];
  const y = Math.max(1 / 12, Math.hypot(s.x - p.x, s.y - p.y) / (REALMS[s.r].speed));
  pop.append(
    h('button', { class: 'x', onclick: closePopup }, '✕'),
    h('h3', { class: 'pin-h', html: glyphSvg(p.k === 'bao' || p.k === 'bi' ? p.k : p.k === '!' ? 'warn' : 'ask', 18, 2) }, ' ' + n),
    h('div', { class: 'meta' }, `Cấp: ${REALMS[p.lv].n} · biến mất sau ${yearsTxt(Math.max(0, p.until - s.year))}`),
    h('p', {}, d),
    h('div', { class: 'row' }, btn(`Tới xem (${yearsTxt(y)})`, () => { closePopup(); run(() => visitPin(p)); }, p.k === '!' ? 'danger' : 'prime')),
  );
  setTravelLine(p);
  place(sx, sy);
}
export function openCultivateModal() {
  if (s.flags.childhood) { run(() => cultivate(1)); return; }
  if (needEngageScene()) { run(() => cultivate(1)); return; }
  if (atBottleneck()) {
    toast(s.r === 0 ? 'Linh khí đã đầy, hãy đả thông kinh mạch bước vào Luyện Khí.' : 'Đã chạm bình cảnh, hãy thử đột phá!');
    return;
  }

  const turn = turnLen();
  const info = stonesToBottleneck();
  let turns = 1;
  let useStones = 0;

  const modalBox = h('div', { class: 'cult-modal' });

  const render = () => {
    modalBox.innerHTML = '';

    const curProg = Math.round(s.prog);
    const curStage = stageName();
    const curRate = Math.round(cultRate());

    const realmInfo = h('div', { class: 'card', style: { marginBottom: '12px', padding: '10px' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } },
        h('b', {}, `Cảnh giới: ${curStage}`),
        h('span', { class: 'muted' }, `Tốc độ: +${curRate}%/lượt (${yearsTxt(turn)})`),
      ),
      h('div', { style: { background: '#2e261f', borderRadius: '4px', overflow: 'hidden', height: '14px', position: 'relative' } },
        h('div', { style: { background: '#8fae72', width: `${Math.min(100, curProg)}%`, height: '100%', transition: 'width 0.2s' } }),
        h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, textAlign: 'center', fontSize: '10px', lineHeight: '14px', color: '#fff', textShadow: '0 1px 2px #000' } }, `${curProg}%`),
      ),
    );

    const val = STONE_VALUE[info.stoneGrade];
    const avail = Math.floor(s.money / val);
    const detailStr = formatStonesDetail(s.money);

    const stoneSec = h('div', { class: 'card', style: { marginBottom: '12px', padding: '10px' } },
      h('div', { style: { marginBottom: '6px' } },
        h('b', {}, `Linh thạch tu luyện phù hợp: `),
        h('span', { style: { color: '#e6c374', fontWeight: 'bold' } }, info.stoneName),
      ),
      h('div', { class: 'small muted', style: { marginBottom: '6px' } },
        `Quy đổi: 1 ${info.stoneName} = ${val.toLocaleString('vi-VN')} Hạ phẩm. Hiện có: ${avail.toLocaleString('vi-VN')} viên (Tổng: ${detailStr}).`,
      ),
      h('div', { class: 'small', style: { marginBottom: '10px', color: '#a0a0a0' } },
        `Mỗi viên ${info.stoneName} luyện hóa tăng +1% tu vi. Còn thiếu ước tính ${info.neededStones.toLocaleString('vi-VN')} viên để đạt bình cảnh.`,
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
        h('span', {}, 'Số lượng dùng: '),
        h('input', {
          type: 'number',
          min: '0',
          max: String(avail),
          value: String(useStones),
          style: { width: '100px', padding: '4px 8px', borderRadius: '4px', background: '#1c1917', border: '1px solid #57534e', color: '#f5f5f4' },
          oninput: (e: Event) => {
            const valInput = parseInt((e.target as HTMLInputElement).value, 10);
            useStones = isNaN(valInput) ? 0 : Math.max(0, Math.min(avail, valInput));
            updatePreview();
          },
        }),
        btn('Không dùng', () => { useStones = 0; render(); }, 'small ghost'),
        btn('Tới bình cảnh', () => {
          const fresh = stonesToBottleneck();
          useStones = fresh.usableStones;
          render();
        }, 'small prime', { title: `Tự động chọn ${info.usableStones} viên để đạt bình cảnh` }),
        btn('Dùng tối đa', () => { useStones = avail; render(); }, 'small'),
      ),
    );

    const turnSec = h('div', { class: 'card', style: { marginBottom: '12px', padding: '10px' } },
      h('b', {}, 'Thời gian bế quan tĩnh tọa: '),
      h('div', { style: { display: 'flex', gap: '8px', marginTop: '6px' } },
        btn(`1 lượt (${yearsTxt(turn)})`, () => { turns = 1; render(); }, 'small' + (turns === 1 ? ' prime' : '')),
        btn(`5 lượt (${yearsTxt(turn * 5)})`, () => { turns = 5; render(); }, 'small' + (turns === 5 ? ' prime' : '')),
        btn(s.body === 'thiendo' && s.r === 1 ? 'Tới tầng kế' : 'Tới bình cảnh', () => { turns = 60; render(); }, 'small' + (turns === 60 ? ' prime' : '')),
      ),
    );

    const previewDiv = h('div', { class: 'small', style: { color: '#8fae72', marginBottom: '14px' } });
    const updatePreview = () => {
      const stoneCost = useStones * val;
      const gainEstimate = Math.round(turns * curRate + useStones);
      previewDiv.innerHTML = `Dự kiến: Tiêu hao <b>${useStones.toLocaleString('vi-VN')}</b> viên ${info.stoneName} (${stoneCost.toLocaleString('vi-VN')} Hạ phẩm). Tổng tu vi nhận được ước tính khoảng <b>+${gainEstimate}%</b>.`;
    };
    updatePreview();

    const acts = h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' } },
      btn('Hủy', () => closeModal(), 'ghost'),
      btn('Bắt đầu Bế quan', () => {
        closeModal();
        run(() => cultivate(turns, useStones));
      }, 'prime'),
    );

    modalBox.append(realmInfo, stoneSec, turnSec, previewDiv, acts);
  };

  render();
  openModal('Bế Quan Tu Luyện', modalBox, { wide: true, seal: 'lotus' });
}

export { toast, esc };
