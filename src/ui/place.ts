// Bảng địa điểm: tranh minh họa + lưới chức năng đánh số. Bấm địa điểm khác: giới thiệu + lên đường.
import { askConfirm } from './dialog';
import { glyphSvg, SECT_GLYPH } from './glyph';
import { childScene } from '../events/diephd';
import { skCost } from '../engine/combat';
import { h, btn } from './dom';
import { openModal, closeModal, run, refresh, showScene, toast as toastMsg } from './modal';
import { s } from '../engine/state';
import { RMAX, REALMS, EL, STAGES } from '../data/core';
import { LOCS, LOC_TYPE, REGIONS, VUC, SECTS, SECT_TIER, SECT_TIER_INFO, SECT_TOP, CRAFT_LABEL, type Loc } from '../data/world';
import { EVENTS, eligible } from '../engine/events';
import { eventScene } from '../engine/actions';
import { CLANS } from '../data/core';
import { realmOpen, nextOpen, passTime, mark, relLabel, npcRealm, npcAge, mkNpc, addNpc } from '../engine/core';
import { shjAt } from '../data/world';
import { wander, work, explore, gatherScene, travelInfo, travelTo, formationInfo, travelFormation, waitYear, teahouse, teaPrice, bounties, doBounty, doMission, sectRecruitmentScene, sectRecruitmentUsed } from '../engine/actions';
import { whereOf, ownerTxt } from '../data/world';
import { EMPIRES, EMPIRE_TIER, EMPIRE_GUARD, COURT_RANKS, courtReq, empireAt } from '../data/world';
import { myCourt, audience, canTakePost, takePost, resignPost, courtTask } from '../engine/court';
import { missionPool, promoInfo, canJoin, joinSect, sectRace, sectWares, isExclusiveTech, markVaultSold, donateItemToVault, donateGearToVault } from '../engine/sect';
import { HERBS, MATS, TALIS } from '../data/items';
import { moneyScale, effRi, addGear, myLinh, hiddenRootName, hiddenFlows, itemPrice, stageName, age, isYao } from '../engine/char';
import { TAMPHAP, tamGrade, tamEffect, learnReq, realmForGiai, TIER_N, TECHS, SKILLS, PILLS, TIER_C, techSpeed, techGrade, skillGrade, pillGrade, skHue, SK_KIND, skillEffect, type Skill, type Tech } from '../data/items';
import { techAff, count, addItem, itemName, tamList, pqList } from '../engine/char';
import { PHAPQUYET, pqGrade } from '../data/spirit';
import { itemArtSvg, gearArtSvg } from './art';
import { skillIconSvg, techIconSvg, pillIconSvg, tamIconSvg, pqIconSvg, scrollIconSvg, gearIconSvg, matIconSvg } from './icons';
import { CRAFT_N } from '../engine/craft';
import { myJobs, MAX_JOBS, jobBoard, takeJob, deliverJobs, jobDone, craftJobScene, type SectJob, baiSu, elderRoster, discipleRoster, type SectDisciple, getOrCreateDiscipleNpc, baiChance, baiBlock, isMyMaster, masterCatchUp, backer, assignedMaster, releaseAssigned, ROLE_GIFT, schoolKeyOfSect, SCHOOL_HEAD_TITLE, type Elder, getOrCreateElderNpc, tiThi, daiBi, sparDone, daiBiOpen, daiBiDone, daiBiNext, veinCost, veinCultivate, sectWarScene } from '../engine/sectx';
import { master } from '../engine/core';
import { rankLabel, headTitle } from '../data/world';
import { auctionHeld, nextAuction, stock, buy, wareCat, SHOP_CATS, isBigTown } from '../engine/trade';
import { gearLabel, SLOTS, WEAPON_N, gearPrice } from '../data/items';
import { gearLine } from '../engine/items';
import { itemDesc, itemTier, bagUsed, bagCap } from '../engine/char';
import { openShop, openAuction, openSectHall, openCraft } from './menus';
import { centerOn } from './map';
import { openCelestial } from './celestial';
import { CELESTIAL } from '../data/celestial';
import { fmt, yearsTxt } from '../core/util';
import { getBeastTerritory, getGhostDomain } from '../engine/wild-territory';
import { openBeastTerritoryModal, openGhostDomainModal, openTerritoryClashModal, openTreasureModal } from './wild-modal';
import { checkYaoTerritoryStatus, getTerritoryDominantSpecies } from '../engine/yao-territory';
import { avatarSvg, npcPic, npcPicWanted, playerPortrait } from './portrait';
import { openPortrait } from './hud';
import { weaponKind } from './arena';
import { meetNpc, npcTagName } from './panels';
import { isSameSect } from '../data/declining-schools';

// ---------- Tranh minh họa ----------
function regionTint(l: Loc) {
  return REGIONS[l.reg].c;
}
function banner(l: Loc): string {
  const tint = regionTint(l);
  const sky = `<rect width="600" height="150" fill="#ece3cb"/><rect y="120" width="600" height="30" fill="#d9ceb2"/>`;
  const hills = `<path d="M0 120 L70 62 L140 104 L220 46 L300 98 L380 52 L470 100 L540 64 L600 96 L600 120Z" fill="${tint}" opacity=".35"/><path d="M0 120 L90 84 L190 112 L290 76 L400 110 L500 82 L600 114 L600 120Z" fill="${tint}" opacity=".5"/>`;
  const cloud = (x: number, y: number, w: number) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.16}" fill="#fff" opacity=".5"/>`;
  let art = '';
  switch (l.type) {
    case 'sect': {
      const sc = SECTS[l.sect!];
      const c1 = EL[sc.el[0]].c, c2 = EL[sc.el[1] || sc.el[0]].c;
      const nm = sc.n.length * 9 + 24;
      art = `${hills}
        ${cloud(110, 104, 70)}${cloud(500, 108, 80)}
        ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${246 + i * 6}" y="${118 - i * 5}" width="${108 - i * 12}" height="4" fill="#b9a983"/>`).join('')}
        <rect x="244" y="44" width="10" height="76" fill="#8f2a20"/><rect x="346" y="44" width="10" height="76" fill="#8f2a20"/>
        <rect x="232" y="40" width="136" height="9" fill="#2a241f"/><path d="M222 40 Q300 20 378 40 L370 33 Q300 14 230 33Z" fill="#3b3330"/>
        <rect x="244" y="58" width="112" height="6" fill="#2a241f"/>
        <rect x="${300 - nm / 2}" y="20" width="${nm}" height="18" fill="#2a241f" stroke="#c9a85a"/>
        <text x="300" y="33" font-size="11" fill="#f0dfae" text-anchor="middle" font-family="Noto Serif" ${sc.n.length > 14 ? `textLength="${nm - 14}" lengthAdjust="spacingAndGlyphs"` : ''}>${sc.n}</text>
        <path d="M272 120 L276 74 L324 74 L328 120Z" fill="#cbbd9f" opacity=".6"/>
        <line x1="200" y1="120" x2="200" y2="40" stroke="#2a241f" stroke-width="2"/><path d="M200 40 L226 47 L200 56Z" fill="${c1}"/>
        <line x1="400" y1="120" x2="400" y2="40" stroke="#2a241f" stroke-width="2"/><path d="M400 40 L426 47 L400 56Z" fill="${c2}"/>
        ${sc.evil ? '<circle cx="300" cy="96" r="6" fill="#3b3150" opacity=".7"/>' : ''}`;
      break;
    }
    case 'town':
      art = `${hills}<rect x="80" y="76" width="440" height="44" fill="#d8ccad" stroke="#8a7d62"/>
        ${Array.from({ length: 22 }, (_, i) => `<rect x="${82 + i * 20}" y="68" width="12" height="9" fill="#d8ccad" stroke="#8a7d62"/>`).join('')}
        <path d="M280 120 L280 98 Q300 82 320 98 L320 120Z" fill="#4a3f36"/>
        <rect x="266" y="44" width="68" height="28" fill="#c0473a"/><path d="M252 48 L300 26 L348 48Z" fill="#3b3330"/><path d="M258 72 L300 56 L342 72Z" fill="#3b3330"/>
        <circle cx="262" cy="64" r="4" fill="#e8a84a"/><circle cx="338" cy="64" r="4" fill="#e8a84a"/>
        <line x1="150" y1="68" x2="150" y2="40" stroke="#2a241f" stroke-width="1.6"/><path d="M150 40 L166 45 L150 51Z" fill="#4f7a55"/>
        <line x1="450" y1="68" x2="450" y2="40" stroke="#2a241f" stroke-width="1.6"/><path d="M450 40 L466 45 L450 51Z" fill="#4f7a55"/>`;
      break;
    case 'market':
      art = `${hills}${[0, 1, 2, 3, 4].map((i) => {
        const x = 70 + i * 96;
        const col = i % 2 ? '#7a5b3d' : '#b23a2c';
        return `<rect x="${x + 8}" y="84" width="64" height="36" fill="#e3d6b6" stroke="#8a7d62"/><path d="M${x} 86 L${x + 80} 86 L${x + 72} 70 L${x + 8} 70Z" fill="${col}"/>
          ${[0, 1, 2, 3].map((k) => `<path d="M${x + k * 20} 86 q10 8 20 0" fill="${col}"/>`).join('')}<circle cx="${x + 40}" cy="98" r="4" fill="#c0473a"/><line x1="${x + 40}" y1="86" x2="${x + 40}" y2="94" stroke="#2a241f"/>`;
      }).join('')}`;
      break;
    case 'village':
      art = `${hills}${[[110, 1], [250, 0.85], [400, 1]].map(([x, k]) => `<rect x="${x}" y="${88}" width="${70 * k}" height="${32}" fill="#e6dac0" stroke="#8a7d62"/><path d="M${x - 10} 90 L${x + 35 * k} ${64} L${x + 70 * k + 10} 90Z" fill="#a08455"/><rect x="${x + 28 * k}" y="100" width="12" height="20" fill="#6e5a44"/>`).join('')}
        <circle cx="520" cy="80" r="26" fill="#6f8a5a" opacity=".85"/><rect x="516" y="96" width="8" height="24" fill="#5a4636"/>
        ${Array.from({ length: 14 }, (_, i) => `<line x1="${60 + i * 8}" y1="112" x2="${60 + i * 8}" y2="122" stroke="#8a7d62"/>`).join('')}`;
      break;
    case 'wild':
      art = `<path d="M0 120 L60 40 L120 96 L190 22 L270 100 L340 30 L420 92 L500 34 L600 90 L600 120Z" fill="#4a4540" opacity=".45"/>
        ${Array.from({ length: 16 }, (_, i) => { const x = 20 + i * 37; const hh = 26 + ((i * 7) % 16); return `<path d="M${x} 122 L${x + 10} ${122 - hh} L${x + 20} 122Z" fill="#3f5340" opacity=".8"/>`; }).join('')}
        ${cloud(200, 92, 160)}${cloud(470, 84, 130)}`;
      break;
    case 'realm': {
      const open = realmOpen(l);
      art = `<rect width="600" height="150" fill="#5a524c"/><path d="M0 0 L600 0 L600 18 L560 10 L500 22 L430 8 L360 20 L300 6 L230 22 L160 8 L90 20 L30 8 L0 16Z" fill="#ece3cb"/>
        <path d="M220 120 Q220 46 300 40 Q380 46 380 120Z" fill="#221c26"/>
        ${open ? `<circle cx="300" cy="86" r="26" fill="none" stroke="#8a6fd0" stroke-width="5"/><circle cx="312" cy="82" r="13" fill="none" stroke="#b49ae8" stroke-width="3"/>` : `<path d="M240 70 L360 110 M360 70 L240 110" stroke="#8a7d62" stroke-width="3"/>`}
        <path d="M150 120 L170 84 L190 120Z" fill="#7d6aa8" opacity=".6"/><path d="M410 120 L430 84 L450 120Z" fill="#7d6aa8" opacity=".6"/>`;
      break;
    }
    case 'formation':
      art = `${hills}<circle cx="300" cy="88" r="42" fill="#287f88" opacity=".18"/><circle cx="300" cy="88" r="33" fill="none" stroke="#287f88" stroke-width="5"/><circle cx="300" cy="88" r="23" fill="none" stroke="#a8d7d2" stroke-width="2"/><path d="M300 48v80M260 88h80M272 60l56 56M328 60l-56 56" stroke="#d4b768" stroke-width="2"/><circle cx="300" cy="88" r="6" fill="#f3e7c7" stroke="#8f6c2b" stroke-width="2"/>`;
      break;
  }
  return `<svg viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">${sky}${art}</svg>`;
}

function badge(l: Loc): HTMLElement {
  if (l.type === 'sect') {
    const sc = SECTS[l.sect!];
    const cols = sc.el.map((e) => EL[e].c);
    const step = 100 / cols.length;
    return h('div', { class: `emb t${sc.tier} pl-badge`, style: { background: `conic-gradient(${cols.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(',')})` } }, h('i', { html: glyphSvg(sc.evil ? 'demon' : SECT_GLYPH[sc.tier] || 'gate', 15, 2) }));
  }
  return h('div', { class: 'pl-badge pl-flag', style: { background: l.type === 'realm' ? '#3b3150' : l.type === 'wild' ? '#2a241f' : l.type === 'market' ? '#8a6a3f' : l.type === 'formation' ? '#287f88' : '#9b2a1f' }, html: glyphSvg(LOC_TYPE[l.type].ic, 22, 2) });
}

interface Card { t: string; sub?: string; fn: () => void; dis?: boolean; hl?: boolean; why?: string; icon?: string; edge?: string; note?: string }
function grid(cards: Card[], start = 0): HTMLElement {
  const g = h('div', { class: 'pl-grid' });
  cards.forEach((c, i) => {
    g.append(h('button', { class: 'pl-card' + (c.hl ? ' hl' : '') + (c.dis ? ' dis' : ''), disabled: c.dis, title: c.why || '', onclick: c.fn, 'data-k': String(start + i + 1) },
      h('span', { class: 'pl-num' }, String(start + i + 1)),
      c.icon ? h('span', { class: 'pl-ic', html: c.icon }) : null,
      h('span', { class: 'pl-txt' }, h('b', {}, c.t), c.sub || c.why ? h('small', {}, c.sub || '', c.dis && c.why ? h('span', { class: 'pl-why' }, (c.sub ? ' · ' : '') + c.why) : null) : null, c.note ? h('small', { class: 'pl-note' }, c.note) : null)));
    if (c.edge) (g.lastElementChild as HTMLElement).style.borderLeftColor = c.edge;
    if (c.icon) (g.lastElementChild as HTMLElement).classList.add('has-ic');
  });
  return g;
}

// phím số 1–9 chọn thẻ
addEventListener('keydown', (e) => {
  const m = document.getElementById('modal')!;
  if (m.hidden || !/^[1-9]$/.test(e.key) || (e.target as HTMLElement).tagName === 'INPUT') return;
  const b = m.querySelector<HTMLButtonElement>(`.pl-card[data-k="${e.key}"]`);
  if (b && !b.disabled) b.click();
});

const T = () => REALMS[s.r].turn;
const after = (fn: () => void) => () => { closeModal(); fn(); };

function dangerLine(l: Loc): HTMLElement | null {
  if (l.lv === undefined) return null;
  const d = '◆'.repeat(l.lv + 1);
  const msg = l.lv > effRi() + 1 ? 'Nơi này quá sức ngươi, cẩn thận thân tử đạo tiêu.' : l.lv > effRi() ? 'Nguy hiểm, nên chuẩn bị kỹ.' : l.lv < effRi() - 1 ? 'Với ngươi, nơi này chẳng còn gì đáng ngại.' : 'Vừa sức.';
  return h('p', { class: 'pl-danger' }, 'Mức nguy hiểm: ', h('b', { style: { color: l.lv > effRi() ? 'var(--seal)' : 'var(--jade)' } }, d), ` (${REALMS[l.lv].n}). ${msg}`);
}

function placeHeader(l: Loc, title?: string) {
  const reg = REGIONS[l.reg];
  return [
    h('div', { class: 'pl-banner' }, h('div', { class: 'pl-art', html: banner(l) }), badge(l)),
  ];
  void title; void reg;
}

function sectDesc(l: Loc) {
  const sc = SECTS[l.sect!];
  const sk = schoolKeyOfSect(sc.n);
  const headTxt = sc.leader ? `Người đứng đầu giữ chức ${sc.leader}. ` : sk ? `Đạo hiệu đứng đầu là ${SCHOOL_HEAD_TITLE[sk]}. ` : '';
  const chuR = sk ? (SECT_TOP[sc.tier] ?? SECT_TIER_INFO[sc.tier].chu) : SECT_TIER_INFO[sc.tier].chu;
  return headTxt + (sc.tribe ? (sc.tribe === 'hai' ? 'Chỉ thu nhận hải tộc yêu thú hóa hình. ' : 'Chỉ thu nhận thủy tộc yêu thú hóa hình. ') : '') + `${SECT_TIER[sc.tier]} ${sc.evil ? 'ma đạo' : 'chính đạo'}, tu ${sc.el.map((e) => EL[e].n).join(' · ')}. ${headTitle(sc)} là cao thủ ${REALMS[chuR].n}. Truyền nghề ${CRAFT_LABEL[sc.craft]}, nhận đệ tử dưới ${SECT_TIER_INFO[sc.tier].maxAge} tuổi.`;
}

// ---------- Bảng nơi đang đứng ----------
export function openPlace(id = s.loc) {
  if (s.flags.childhood) { run(childScene); return; }
  const l = LOCS[id];
  const cards: Card[] = [];
  const clan = Object.values(CLANS).find((c) => c.seat === l.id);
  if (l.type === 'formation') {
    const fi = formationInfo(l);
    cards.push({
      t: fi.destination ? `Truyền tống tới ${fi.destination.n}` : 'Trận không thể vận hành',
      sub: fi.available ? `Tới ngay lập tức · trận phí ${fmt(fi.fare)} linh thạch` : undefined,
      dis: !fi.available, why: fi.reason || undefined, hl: fi.available,
      fn: after(() => run(() => travelFormation(l.id))),
    });
  } else if (l.type === 'village' || l.type === 'town' || l.type === 'market') {
    cards.push({ t: 'Dạo quanh', sub: `${yearsTxt(Math.max(1 / 12, T() * 0.25))} · gặp chuyện thế gian`, hl: true, fn: after(() => run(wander)) });
    cards.push({ t: 'Mưu sinh', sub: `${yearsTxt(s.r === 0 ? 0.5 : T() * 0.5)} · kiếm linh thạch`, fn: after(() => run(work)) });
    if (l.id === 'tutieuthanh') {
      const year = Math.floor(s.year);
      const used = sectRecruitmentUsed('tutieu', year) || s.flags.tutieuRecruitYear === year;
      const admission = canJoin('tutieu');
      cards.push({
        t: 'Kỳ tuyển đồ Tử Tiêu Tiên Cung',
        sub: used ? `Năm ${year} đã tuyển · kỳ tiếp theo năm ${year + 1}` : admission.ok ? `Mỗi năm một lần · năm ${year}` : admission.why,
        dis: used,
        why: used ? 'Kỳ tuyển đồ năm nay đã kết thúc' : undefined,
        hl: !used && admission.ok,
        fn: after(() => run(() => sectRecruitmentScene('tutieu'))),
      });
    }
    if (l.type !== 'village') {
      cards.push({ t: l.type === 'market' ? 'Vào phường thị' : 'Ghé tiệm', sub: 'Công pháp, pháp khí, đan dược, phù lục, vật liệu', fn: () => openStore(0) });
      cards.push({ t: 'Bán vật phẩm', sub: 'Đổi đồ trong túi lấy linh thạch', fn: after(() => openShop(1)) });
    }
    const hasAuc = l.auction || l.type === 'town' || l.type === 'market';
    const isBig = (l.type === 'town' && isBigTown(l.n)) || !!l.auction;
    if (hasAuc) {
      cards.push({
        t: auctionHeld() ? `${isBig ? 'Đại hội đấu giá' : 'Đấu giá hội nhỏ'} · đang mở` : (isBig ? 'Đại hội đấu giá' : 'Đấu giá hội nhỏ'),
        sub: auctionHeld()
          ? (isBig ? `Đại hội tại ${l.n} mở phiên · nguyên liệu hiếm, pháp bảo cao cấp & linh thú ấu niên` : `Phiên đấu giá nhỏ tại ${l.n} đang mở phiên`)
          : `Phiên tới năm ${nextAuction()} · vẫn nhận ký gửi`,
        hl: auctionHeld(),
        fn: after(() => openAuction()),
      });
    }
    if (l.type !== 'village') cards.push({ t: 'Vào trà lâu', sub: `${fmt(teaPrice())} linh thạch · nghe thuyết thư, dò tin`, dis: s.money < teaPrice(), fn: after(() => run(teahouse)) });
    const emp = empireAt(l.id);
    if (emp) cards.push({ t: `Hoàng cung · ${emp.n}`, sub: `${EMPIRE_TIER[emp.tier]} · ${emp.ruler} · hộ quốc lão tổ ${REALMS[EMPIRE_GUARD[emp.tier]].n}${myCourt()?.id === emp.id ? ' · ngươi là ' + COURT_RANKS[myCourt()!.rank] : ''}`, hl: true, fn: () => openCourt(emp.id) });
    if (clan) cards.push({ t: clan.n, sub: s.flags.clan === clan.id ? 'Tổ trạch nhà ngươi · bổng lộc, từ đường' : `Thế gia lớn nhất nơi này${clan.patron ? ' · phụ thuộc ' + SECTS[clan.patron].n : ''}`, fn: after(() => clanVisit(clan.id)) });
    if (l.type !== 'village' || s.r >= 1) {
      const bs = bounties();
      cards.push({ t: 'Bảng nhiệm vụ', sub: bs.length ? `${bs.length} việc · cấp ${REALMS[Math.min(...bs.map((b) => b.lv))].n}–${REALMS[Math.max(...bs.map((b) => b.lv))].n}` : 'Năm nay đã hết việc', hl: bs.length > 0, dis: !bs.length, fn: () => bountyBoard() });
    }
  } else if (l.type === 'sect') {
    const sc = SECTS[l.sect!];
    const member = s.sect?.id === sc.id;
    if (member) {
      const ms = missionPool();
      const pi = promoInfo();
      const jobs = myJobs();
      const ready = jobs.filter(jobDone).length;
      const m = master();
      if (s.flags.holyScion === sc.id) cards.push({ t: 'Về phủ', sub: 'Thỉnh an, bổng lộc gia tộc, xin trắc linh', fn: after(() => scionHome(sc.id)) });
      cards.push({ t: 'Nhận nhiệm vụ tông môn', sub: `${ms.length} việc · kiếm cống hiến (${s.sect!.contrib})`, hl: true, fn: after(() => openSectHall(0)) });
      cards.push({ t: 'Nhiệm Vụ Đường', sub: `Đang nhận ${jobs.length}/${MAX_JOBS} việc${ready ? ` · ${ready} việc đã xong, giao nộp!` : ' · luyện đan, khí, phù và việc khác · giao nộp lấy cống hiến'}`, hl: ready > 0, fn: () => jobHall() });
      cards.push({ t: 'Tàng Kinh Các', sub: 'Công pháp, võ công, kinh thư', fn: () => openLibrary('book') });
      cards.push({ t: 'Bảo khố tông môn', sub: 'Đổi cống hiến lấy đan dược', fn: () => openLibrary('vault') });
      cards.push({ t: 'Thành viên tông môn', sub: 'Tông chủ, các vị trưởng lão, đồng môn & đệ tử', hl: true, fn: () => openSectRoster(sc.id) });
      cards.push({ t: 'Bái sư', sub: m ? `Sư phụ: ${m.name} · xem các trưởng lão` : 'Chọn một vị trưởng lão để cầu bái', fn: () => masterHall() });
      cards.push({ t: 'Tông môn tỉ thí', sub: sparDone() ? 'Năm nay đã tham gia' : 'Ba vòng lôi đài với đồng môn, thua không tổn tính mệnh', dis: sparDone(), fn: after(() => run(tiThi)) });
      cards.push({ t: daiBiOpen() ? 'Tông môn đại bỉ · đang mở' : 'Tông môn đại bỉ', sub: daiBiOpen() ? (daiBiDone() ? 'Năm nay đã tham gia' : 'Mười năm một lần, năm vòng lôi đài, thưởng lớn') : `Năm ${daiBiNext()} (còn ${daiBiNext() - Math.floor(s.year)} năm)`, hl: daiBiOpen() && !daiBiDone(), dis: !daiBiOpen() || daiBiDone(), fn: after(() => run(daiBi)) });
      cards.push({ t: 'Bế quan linh mạch', sub: `${yearsTxt(T() * 3)} · ${veinCost()} cống hiến · tu nhanh gấp đôi`, dis: s.sect!.contrib < veinCost(), why: s.sect!.contrib < veinCost() ? `Cần ${veinCost()} cống hiến` : undefined, fn: after(() => run(veinCultivate)) });
      cards.push({
        t: 'Tông môn chiến',
        sub: s.flags.lastSectWar && Math.floor(s.year) - s.flags.lastSectWar < 3
          ? `Đang chỉnh đốn sau đại chiến (năm ${s.flags.lastSectWar + 3} có thể tiếp tục)`
          : 'Chinh phạt / Nghênh chiến tông môn đối địch (thắng nhận sách, pháp bảo, nguyên liệu)',
        dis: !!(s.flags.lastSectWar && Math.floor(s.year) - s.flags.lastSectWar < 3),
        hl: !(s.flags.lastSectWar && Math.floor(s.year) - s.flags.lastSectWar < 3),
        fn: after(() => run(sectWarScene)),
      });
      cards.push({ t: pi.can ? 'Thăng cấp · đủ điều kiện' : `Thân phận · ${rankLabel(s.sect!.rank, sc, s.g)}`, sub: pi.why, hl: pi.can, fn: after(() => openSectHall(2)) });
      cards.push({ t: 'Dạo quanh sơn môn', sub: `${yearsTxt(Math.max(1 / 12, T() * 0.25))} · gặp đồng môn`, fn: after(() => run(wander)) });
      cards.push({ t: 'Rời tông môn', sub: 'Làm tán tu tự do', fn: after(() => openSectHall(2)) });
    } else if (s.flags.holyScion === sc.id) {
      cards.push({ t: 'Về phủ', sub: 'Thỉnh an, nhận bổng lộc, xin trắc linh', hl: true, fn: after(() => scionHome(sc.id)) });
      cards.push({ t: 'Dạo quanh thánh địa', sub: `${yearsTxt(Math.max(1 / 12, T() * 0.25))}`, fn: after(() => run(wander)) });
    } else if (sc.tier === 4) {
      const year = Math.floor(s.year);
      const used = sectRecruitmentUsed(sc.id, year) || (sc.id === 'tutieu' && s.flags.tutieuRecruitYear === year);
      const admission = canJoin(sc.id);
      cards.push({
        t: `Kỳ tuyển sinh ${sc.n}`,
        sub: used ? `Năm ${year} đã tuyển · kỳ tiếp theo năm ${year + 1}` : admission.ok ? `Mỗi năm một lần · năm ${year}` : admission.why,
        dis: used,
        why: used ? 'Kỳ tuyển sinh năm nay đã kết thúc' : undefined,
        hl: !used && admission.ok,
        fn: after(() => run(() => sectRecruitmentScene(sc.id))),
      });
      cards.push({ t: 'Nhân vật danh vọng', sub: 'Tông chủ, các vị trưởng lão & thiên kiêu xuất chúng', hl: true, fn: () => openSectRoster(sc.id) });
      cards.push({ t: 'Dạo quanh sơn môn', sub: `${yearsTxt(Math.max(1 / 12, T() * 0.25))} · làm khách`, fn: after(() => run(wander)) });
    } else {
      const c = canJoin(sc.id);
      cards.push({ t: 'Bái sơn', sub: c.ok ? 'Xin khảo hạch nhập môn' : undefined, dis: !c.ok && !s.bag.some((b) => b.id === 'x:kiemlenh'), why: s.sect ? `Ngươi đã thuộc ${SECTS[s.sect.id].n}` : c.why, hl: c.ok, fn: after(() => applySect(sc.id)) });
      cards.push({ t: 'Nhân vật danh vọng', sub: 'Tông chủ, các vị trưởng lão & thiên kiêu xuất chúng', hl: true, fn: () => openSectRoster(sc.id) });
      cards.push({ t: 'Dạo quanh sơn môn', sub: `${yearsTxt(Math.max(1 / 12, T() * 0.25))} · làm khách`, fn: after(() => run(wander)) });
    }
  } else {
    const open = l.type !== 'realm' || realmOpen(l);
    cards.push({ t: l.type === 'realm' ? 'Tiến vào' : 'Thám hiểm', sub: `${yearsTxt(T() * 0.5)} · ${l.type === 'realm' ? 'truyền thừa thượng cổ, cấm chế đoạt mệnh' : 'yêu thú, kỳ ngộ, bảo vật'}`, hl: true, dis: !open, why: open ? undefined : `Bí cảnh đóng, mở lại năm ${nextOpen(l)}`, fn: after(() => run(explore)) });
    if (l.shj) {
      const ev = EVENTS.find((e) => e.id === 'shj_totu')!;
      const ok = eligible(ev, 'wild');
      const names = shjAt(l.id).map((b) => `${b.n} (${REALMS[b.lv[0]].n})`).join(', ');
      cards.push({ t: 'Tìm tổ thú', sub: `${yearsTxt(T() * 0.5)} · ${names}`, dis: !ok, why: ok ? undefined : 'Tổ thú vừa lộ diện, phải chờ thêm nhiều năm', fn: after(() => run(() => { passTime(T() * 0.5); return eventScene(ev); })) });
    }
    cards.push({ t: 'Hái dược', sub: `${yearsTxt(T() * 0.5)} · dược liệu cấp ${REALMS[Math.min(RMAX(), (l.lv ?? 1) + 1)].n}`, fn: after(() => run(() => gatherScene(false))) });
    const bTerr = getBeastTerritory(l.id);
    if (bTerr) {
      cards.push({
        t: 'Lãnh Thổ Yêu Thú',
        sub: 'Ý thức lãnh thổ loài thú · Săn yêu đan & Thuần phục tọa kỵ',
        hl: true,
        fn: () => openBeastTerritoryModal(bTerr),
      });
    }
    const gDom = getGhostDomain(l.id);
    if (gDom) {
      cards.push({
        t: 'Quỷ Vực Âm Sát',
        sub: 'Quỷ Vương > Quỷ Soái > Quỷ Tướng... · Siêu độ & Khiêu chiến',
        hl: true,
        fn: () => openGhostDomainModal(gDom),
      });
    }

    const domSpec = getTerritoryDominantSpecies(l.id);
    if (domSpec) {
      cards.push({
        t: `✨ Thiên Tài Địa Bảo · ${domSpec.treasure.name}`,
        sub: `Canh giữ bởi ${domSpec.treasure.guardian} · Thu hoạch / Cường đoạt`,
        hl: true,
        fn: () => openTreasureModal(domSpec, () => openPlace(id)),
      });
    }

    const yaoCheck = checkYaoTerritoryStatus(l.id);
    if (yaoCheck.dominantSpecies && yaoCheck.clash) {
      cards.unshift({
        t: `⚔️ Đụng độ cương thổ · ${yaoCheck.dominantSpecies.name}`,
        sub: 'Xâm phạm địa bàn loài khác! Quyết đấu trấn áp hoặc cống nạp kết minh',
        hl: true,
        edge: '#b91c1c',
        fn: () => openTerritoryClashModal(yaoCheck.dominantSpecies!, () => openPlace(id)),
      });
    }
  }
  if (l.gate) cards.unshift({ t: `Tới ${CELESTIAL[l.gate].n}`, sub: `${CELESTIAL[l.gate].kind} · xem bản đồ, chức vụ và người đương nhiệm`, hl: true, fn: () => openCelestial(l.gate!) });
  if (s.craft.alch || s.craft.talis || s.craft.forge) cards.push({ t: 'Luyện chế', sub: 'Luyện đan, chế phù, luyện khí', fn: after(() => openCraft()) });
  cards.push({ t: 'Chờ một năm', sub: '1 năm · nghỉ ngơi, hồi khí huyết', fn: after(() => run(waitYear)) });
  cards.push({ t: 'Rời đi', fn: () => closeModal() });

  const body: HTMLElement[] = [
    ...placeHeader(l),
    h('p', { class: 'pl-desc' }, l.type === 'sect' ? sectDesc(l) : l.d),
  ];
  const yaoCheckLoc = checkYaoTerritoryStatus(l.id);
  if (yaoCheckLoc.dominantSpecies) {
    if (yaoCheckLoc.clash) {
      body.push(h('div', { style: { background: 'rgba(185, 28, 28, 0.08)', border: '1px solid #b91c1c', borderRadius: '4px', padding: '8px 12px', marginBottom: '8px', color: '#991b1b', fontSize: '12.5px', fontWeight: '500' } }, `⚠️ ${yaoCheckLoc.msg}`));
    } else {
      body.push(h('div', { style: { background: 'rgba(22, 101, 52, 0.06)', border: '1px solid #16a34a', borderRadius: '4px', padding: '8px 12px', marginBottom: '8px', color: '#15803d', fontSize: '12.5px' } }, `🌿 ${yaoCheckLoc.msg}`));
    }
  }
  const dl = dangerLine(l);
  if (dl) body.push(dl);
  body.push(grid(cards));
  openModal(l.n, body, { wide: true, sub: `${whereOf(l)} · ${LOC_TYPE[l.type].n}${ownerTxt(l) ? ' · ' + ownerTxt(l) : ''}`, noClose: true, xBtn: true });
}

// ---------- Bảng nơi khác: giới thiệu + lên đường ----------
export function openRemote(id: string) {
  const l = LOCS[id];
  const ti = travelInfo(l);
  const cards: Card[] = [];
  if (ti.block) cards.push({ t: 'Không thể tới', dis: true, why: ti.block, fn: () => {} });
  else cards.push({
    t: 'Lên đường', hl: true, sub: `${ti.y > 0 ? `Mất khoảng ${yearsTxt(ti.y)}` : 'Tới ngay lập tức'}${myLinh() && !ti.ship ? ` · cưỡi ${myLinh()!.name}` : ''}${ti.ship ? ` · thuyền ${ti.fare} linh thạch` : ''} · ${fmt(ti.d)} dặm`,
    fn: () => {
      closeModal();
      centerOn(l.x, l.y);
      run(() => travelTo(id));
      // tới nơi mà không gặp chuyện gì → mở luôn bảng địa điểm
      setTimeout(() => { if (s.loc === id && document.getElementById('modal')!.hidden && !s.dead) openPlace(id); }, 30);
    },
  });
  if (l.type === 'sect' && l.sect) {
    cards.push({
      t: 'Nhân vật danh vọng',
      sub: 'Tông chủ, các vị trưởng lão & thiên kiêu xuất chúng',
      hl: true,
      fn: () => openSectRoster(l.sect!),
    });
  }
  cards.push({ t: 'Thôi', fn: () => closeModal() });
  const body: HTMLElement[] = [
    ...placeHeader(l),
    h('p', { class: 'pl-desc' }, l.type === 'sect' ? sectDesc(l) : l.d),
  ];
  if (l.type === 'sect') body.push(h('p', { class: 'small muted' }, SECTS[l.sect!].d));
  if (l.type === 'realm') body.push(h('p', { class: 'small', style: { color: realmOpen(l) ? 'var(--jade)' : 'var(--muted)' } }, realmOpen(l) ? 'Bí cảnh đang mở!' : `Đóng. Mở lại năm ${nextOpen(l)}.`));
  if (l.auction) body.push(h('p', { class: 'small muted' }, auctionHeld() ? 'Nhà đấu giá đang mở phiên năm nay.' : `Có nhà đấu giá — phiên tới năm ${nextAuction()}.`));
  const dl = dangerLine(l);
  if (dl) body.push(dl);
  body.push(grid(cards));
  openModal(l.n, body, { wide: true, sub: `${whereOf(l)} · ${LOC_TYPE[l.type].n}${ownerTxt(l) ? ' · ' + ownerTxt(l) : ''}`, noClose: true, xBtn: true });
}

// ---------- Thành viên tông môn / Nhân vật danh vọng ----------
export function openSectRoster(sectId: string) {
  const sct = SECTS[sectId];
  if (!sct) return;
  const isMine = s.sect?.id === sectId;

  const elders = elderRoster(sct);
  const leaders = elders.filter((e) => e.top);
  const innerElders = elders.filter((e) => e.inner && !e.top);
  const outerElders = elders.filter((e) => !e.inner && !e.top);

  // Danh sách đệ tử đại diện của tông
  const disciples = discipleRoster(sct);
  const coreDisciples = disciples.filter((d) => d.rankKey === 'thantruyen');
  const innerDisciples = disciples.filter((d) => d.rankKey === 'noimon');
  const outerDisciples = disciples.filter((d) => d.rankKey === 'ngoaimon');
  const discipleNames = new Set(disciples.map((d) => d.name));

  // Thiên kiêu & đệ tử danh tiếng thuộc tông trên bảng Thiên Cơ Lâu
  const w = s.world ?? 0;
  const people: any[] = s.flags.tienco?.people ?? [];
  const curM = master();
  const elderNames = new Set(elders.map((e) => e.name));
  const elderLegacyRoles = new Set(elders.map((e) => e.legacyRole).filter(Boolean));

  const geniuses = people.filter((p) => {
    if (!p.alive || p.world !== w) return false;
    if (!isSameSect(p.sect, sct.id) && !p.from?.includes(sct.n)) return false;
    // Exclude legacy role elders (like Thông Thiên Giáo Chủ, Vân Tiêu Tiên Tử, etc.)
    if (p.legacyRole || elderLegacyRoles.has(p.legacyRole)) return false;
    // Exclude if already in elders list, disciple list or is current master
    if (elderNames.has(p.name) || discipleNames.has(p.name) || (curM && curM.name === p.name)) return false;
    // Must satisfy genius age (human <= 100, beast <= 400) OR have disciple/holy scion title
    const pAge = s.year - (p.born ?? s.year);
    const maxGeniusAge = p.beast ? 400 : 100;
    const isDisciple = p.from?.includes('Đệ tử') || p.from?.includes('Thánh');
    return isDisciple || pAge <= maxGeniusAge;
  });

  // Đồng môn trong nhân mạch
  const knownNpcs = s.npcs.filter((n) =>
    n.alive &&
    isSameSect(n.sect, sectId) &&
    n.tag !== 'master' &&
    !elderNames.has(n.name) &&
    !discipleNames.has(n.name) &&
    !elders.some((e) => isMyMaster(e) || (e.legacyRole && n.how?.includes(e.legacyRole))) &&
    !geniuses.some((g) => g.name === n.name)
  );

  const body: HTMLElement[] = [];

  body.push(h('p', { class: 'pl-desc' }, isMine
    ? `Danh sách các vị tiền bối, trưởng lão, thiên kiêu và đồng môn trong ${sct.n}. Ngươi hiện giữ thân phận ${rankLabel(s.sect!.rank, sct, s.g)}.`
    : `Những nhân vật có danh vọng và thực lực đứng đầu ${sct.n} — bao gồm Tông chủ, Thái thượng trưởng lão, các vị phong chủ và thiên kiêu xuất chúng.`
  ));

  const list = h('div', { class: 'list' });

  // 1. Thân phận của ngươi (nếu là tông mình)
  if (isMine) {
    list.append(h('h4', { class: 'cx-h' }, 'Thân phận của ngươi'));
    const pic = playerPortrait(s.g, age());
    list.append(h('div', { class: 'item mine' },
      h('div', { class: 'ic ic-svg rel-av click', title: 'Xem tranh', onclick: () => openPortrait(s.name, pic, s.g, stageName(), weaponKind()), html: avatarSvg(s.g, s.r, null, 34, pic) }),
      h('div', { class: 'nm' },
        h('b', {}, s.name), ' ',
        h('span', { class: 'pill' }, 'Ngươi'), ' ',
        h('span', { class: 'pill' }, rankLabel(s.sect!.rank, sct, s.g)),
        h('small', {}, `${REALMS[s.r].n} ${STAGES[s.st]} · ${Math.floor(age())} tuổi · Cống hiến: ${s.sect!.contrib}`),
        h('small', { class: 'muted' }, `${rankLabel(s.sect!.rank, sct, s.g)} của ${sct.n}`)
      )
    ));
  }

  // Helper render elder row
  const renderElder = (e: Elder) => {
    const isMaster = isMyMaster(e);
    const existingNpc = isMaster
      ? curM
      : s.npcs.find((n) => n.alive && isSameSect(n.sect, sct.id) && (n.name === e.name || (e.legacyRole && n.how?.includes(e.legacyRole))));
    const rel = existingNpc ? existingNpc.rel : (isMine ? 20 : 0);
    const relC = rel >= 40 ? '#4f7a55' : rel <= -40 ? '#9b2a1f' : '#6e6253';
    const roleTitle = e.top ? (e.role === 'chu' ? headTitle(sct) : (e.seat.includes('Thái thượng đại trưởng lão') ? 'Thái thượng đại trưởng lão' : 'Thái thượng trưởng lão')) : (e.inner ? 'Trưởng lão nội môn' : 'Trưởng lão ngoại môn');

    return h('div', { class: 'item' },
      h('div', {
        class: 'ic ic-svg rel-av click',
        style: { borderColor: relC, color: relC },
        title: 'Xem tranh',
        onclick: () => {
          const n = getOrCreateElderNpc(e, sct.id);
          openPortrait(n.name, npcPic(n), n.g, npcRealm(n), 'quyen', npcPicWanted(n), n.id, npcAge(n));
        },
        html: avatarSvg(e.g, e.r, e.el, 34),
      }),
      h('div', { class: 'nm' },
        h('b', {}, e.name), ' ',
        h('span', { class: 'pill', style: { color: relC } }, isMaster ? 'Sư phụ' : roleTitle),
        e.title && e.title !== e.name ? h('span', { class: 'pill muted' }, e.title.split(' – ')[0]) : null,
        h('small', {}, `${REALMS[e.r].n} ${STAGES[e.st]} · ${e.age} tuổi · ${EL[e.el].n} hệ · ${e.trait}`),
        h('small', { class: 'muted' }, `${e.seat}. ${e.d}`)
      ),
      h('div', { class: 'acts' }, btn('Gặp', () => {
        const n = getOrCreateElderNpc(e, sct.id);
        closeModal();
        meetNpc(n.id);
      }, 'small prime'))
    );
  };

  // Helper render genius row
  const renderGenius = (g: any) => {
    const existingNpc = g.npc ? s.npcs.find((n: any) => n.id === g.npc) : s.npcs.find((n: any) => n.name === g.name);
    const rel = existingNpc ? existingNpc.rel : (isMine ? 15 : 0);
    const relC = rel >= 40 ? '#4f7a55' : rel <= -40 ? '#9b2a1f' : '#6e6253';
    const roleName = g.from ? (g.from.split(' — ')[0].split(', ')[0].trim()) : 'Thân truyền đệ tử';

    return h('div', { class: 'item' },
      h('div', {
        class: 'ic ic-svg rel-av click',
        style: { borderColor: relC, color: relC },
        title: 'Xem tranh',
        onclick: () => {
          let n = existingNpc;
          if (!n) {
            n = mkNpc({
              name: g.name,
              g: g.g,
              r: g.r,
              st: g.st,
              sect: sct.id,
              tag: isMine ? 'peer' : 'acq',
              rel: isMine ? 15 : 0,
              el: g.el,
              age: Math.floor(s.year - g.born),
              how: g.from || `Đệ tử ${sct.n}`,
              talent: g.talent,
            });
            addNpc(n);
            g.npc = n.id;
          }
          openPortrait(n.name, npcPic(n), n.g, npcRealm(n), 'quyen', npcPicWanted(n), n.id, npcAge(n));
        },
        html: avatarSvg(g.g, g.r, g.el, 34),
      }),
      h('div', { class: 'nm' },
        h('b', {}, g.name), ' ',
        h('span', { class: 'pill', style: { color: relC } }, 'Thiên kiêu'),
        g.beast ? h('span', { class: 'pill' }, 'Yêu tu') : null,
        h('small', {}, `${REALMS[g.r].n} ${STAGES[g.st]} · ${Math.floor(s.year - g.born)} tuổi · ${roleName}`),
        h('small', { class: 'muted' }, g.from || `Đệ tử ${sct.n}`)
      ),
      h('div', { class: 'acts' }, btn('Gặp', () => {
        let n = existingNpc;
        if (!n) {
          n = mkNpc({
            name: g.name,
            g: g.g,
            r: g.r,
            st: g.st,
            sect: sct.id,
            tag: isMine ? 'peer' : 'acq',
            rel: isMine ? 15 : 0,
            el: g.el,
            age: Math.floor(s.year - g.born),
            how: g.from || `Đệ tử ${sct.n}`,
            talent: g.talent,
          });
          addNpc(n);
          g.npc = n.id;
        }
        closeModal();
        meetNpc(n.id);
      }, 'small prime'))
    );
  };

  // Helper render disciple row
  const renderDisciple = (d: SectDisciple) => {
    const existingNpc = s.npcs.find((n) => n.alive && isSameSect(n.sect, sct.id) && n.name === d.name);
    const rel = existingNpc ? existingNpc.rel : (isMine ? 20 : 0);
    const relC = rel >= 40 ? '#4f7a55' : rel <= -40 ? '#9b2a1f' : '#6e6253';

    return h('div', { class: 'item' },
      h('div', {
        class: 'ic ic-svg rel-av click',
        style: { borderColor: relC, color: relC },
        title: 'Xem tranh',
        onclick: () => {
          const n = getOrCreateDiscipleNpc(d, sct.id);
          openPortrait(n.name, npcPic(n), n.g, npcRealm(n), 'quyen', npcPicWanted(n), n.id, npcAge(n));
        },
        html: avatarSvg(d.g, d.r, d.el, 34),
      }),
      h('div', { class: 'nm' },
        h('b', {}, d.name), ' ',
        h('span', { class: 'pill', style: { color: relC } }, d.rankName),
        d.title && d.title !== d.name ? h('span', { class: 'pill muted' }, d.title.split(' – ')[0]) : null,
        d.beast ? h('span', { class: 'pill' }, 'Yêu tu') : null,
        h('small', {}, `${REALMS[d.r].n} ${STAGES[d.st]} · ${d.age} tuổi · ${EL[d.el].n} hệ · ${d.trait}`),
        h('small', { class: 'muted' }, d.seatTitle ? `${d.seatTitle}. ${d.d}` : d.d)
      ),
      h('div', { class: 'acts' }, btn('Gặp', () => {
        const n = getOrCreateDiscipleNpc(d, sct.id);
        closeModal();
        meetNpc(n.id);
      }, 'small prime'))
    );
  };

  // 2. Tông chủ & Thái thượng trưởng lão
  const titleLeaders = isMine ? `${headTitle(sct)} & Thái thượng trưởng lão (${leaders.length})` : `Tông chủ & Thái thượng trưởng lão (${leaders.length})`;
  list.append(h('h4', { class: 'cx-h' }, titleLeaders));
  for (const e of leaders) list.append(renderElder(e));

  // 3. Trưởng lão nội môn / Các Phong chủ
  const shownInner = isMine ? innerElders : innerElders.slice(0, 5);
  list.append(h('h4', { class: 'cx-h' }, isMine ? `Trưởng lão nội môn & Phong chủ (${shownInner.length})` : `Trưởng lão chủ chốt (${shownInner.length})`));
  for (const e of shownInner) list.append(renderElder(e));

  // 4. Trưởng lão ngoại môn (ở tông mình)
  if (isMine && outerElders.length) {
    list.append(h('h4', { class: 'cx-h' }, `Trưởng lão ngoại môn (${outerElders.length})`));
    for (const e of outerElders) list.append(renderElder(e));
  }

  // 5. Thiên kiêu & Thân truyền đệ tử
  const shownGeniuses = isMine ? geniuses : geniuses.slice(0, 3);
  const shownCore = isMine ? coreDisciples : coreDisciples.slice(0, 3);
  const totalCore = shownGeniuses.length + shownCore.length;
  if (totalCore) {
    list.append(h('h4', { class: 'cx-h' }, isMine ? `Thiên kiêu & Thân truyền đệ tử (${totalCore})` : `Thiên kiêu & Thân truyền xuất chúng (${totalCore})`));
    for (const g of shownGeniuses) list.append(renderGenius(g));
    for (const d of shownCore) list.append(renderDisciple(d));
  }

  // 6. Nội môn đệ tử
  const shownInnerDisciples = isMine ? innerDisciples : innerDisciples.slice(0, 3);
  if (shownInnerDisciples.length) {
    list.append(h('h4', { class: 'cx-h' }, `Nội môn đệ tử (${shownInnerDisciples.length})`));
    for (const d of shownInnerDisciples) list.append(renderDisciple(d));
  }

  // 7. Ngoại môn đệ tử (ở tông mình)
  if (isMine && outerDisciples.length) {
    list.append(h('h4', { class: 'cx-h' }, `Ngoại môn đệ tử (${outerDisciples.length})`));
    for (const d of outerDisciples) list.append(renderDisciple(d));
  }

  // 8. Đồng môn trong nhân mạch (nếu là tông mình và có quen biết)
  if (isMine && knownNpcs.length) {
    list.append(h('h4', { class: 'cx-h' }, `Đồng môn quen biết trong môn (${knownNpcs.length})`));
    for (const n of knownNpcs) {
      const relC = n.rel >= 40 ? '#4f7a55' : n.rel <= -40 ? '#9b2a1f' : '#6e6253';
      list.append(h('div', { class: 'item' },
        h('div', { class: 'ic ic-svg rel-av click', style: { borderColor: relC, color: relC }, title: 'Xem tranh', onclick: () => openPortrait(n.name, npcPic(n), n.g, npcRealm(n), 'quyen', npcPicWanted(n), n.id, npcAge(n)), html: avatarSvg(n.g, n.r, n.el, 34, npcPic(n)) }),
        h('div', { class: 'nm' },
          h('b', {}, n.name), ' ',
          h('span', { class: 'pill', style: { color: relC } }, npcTagName(n)),
          h('small', {}, `${npcRealm(n)} · ${npcAge(n)} tuổi · ${relLabel(n.rel)} (${Math.round(n.rel)}) · ${n.trait}`),
          h('small', { class: 'muted' }, n.how || `Đồng môn ${sct.n}`)
        ),
        h('div', { class: 'acts' }, btn('Gặp', () => { closeModal(); meetNpc(n.id); }, 'small prime'))
      ));
    }
  }

  body.push(list);

  body.push(grid([
    {
      t: 'Trở lại',
      fn: () => {
        if (s.loc === (sct.loc || sectId)) openPlace();
        else openRemote(sct.loc || sectId);
      },
    },
  ]));

  openModal(
    isMine ? `Thành viên tông môn · ${sct.n}` : `Nhân vật danh vọng · ${sct.n}`,
    body,
    { wide: true, noClose: true, xBtn: true, sub: `${sct.n} · ${whereOf(LOCS[sct.loc || sectId] || { n: sct.n })}` }
  );
}

// ---------- Bảng nhiệm vụ ----------
function bountyBoard() {
  const bs = bounties();
  const cards: Card[] = bs.map((b) => ({
    t: b.n,
    sub: `${b.d} · ${yearsTxt(b.y)} · thưởng ${fmt(b.reward)} linh thạch`,
    hl: b.lv <= effRi(),
    fn: after(() => run(() => doBounty(b))),
  }));
  cards.push({ t: 'Trở lại', fn: () => openPlace() });
  openModal('Bảng nhiệm vụ', [h('p', { class: 'pl-desc' }, `Tờ cáo thị dán kín tấm ván gỗ trước cổng ${LOCS[s.loc].n}. Việc cấp cao thưởng hậu, nhưng có thể mất mạng.`), grid(cards)], { wide: true, noClose: true, xBtn: true, sub: LOCS[s.loc].n });
}

// ---------- Ghé thế gia ----------
function clanVisit(cid: string) {
  const c = CLANS[cid];
  const mine = s.flags.clan === cid;
  const foe = s.flags.clan && CLANS[s.flags.clan]?.foes.includes(cid);
  const ally = s.flags.clan && CLANS[s.flags.clan]?.allies.includes(cid);
  if (mine) {
    const ev = EVENTS.find((e) => e.id === 'clan_home');
    if (ev && eligible(ev, 'town')) return run(() => eventScene(ev));
    return run(() => ({ title: c.n, text: 'Gia nhân cúi chào. Kho tộc năm nay đã phát bổng lộc cho ngươi rồi; từ đường đang có trưởng bối bế quan.' }));
  }
  run(() => ({
    title: c.n,
    text: `${c.d}\n\n${mine ? 'Đây là nhà ngươi.' : foe ? `Gia nhân nhìn thấy họ ${CLANS[s.flags.clan].sur} của ngươi liền biến sắc, tay đặt lên chuôi đao.` : ally ? 'Hai nhà là đồng minh, quản gia mời ngươi vào uống trà.' : 'Quản gia hỏi ngươi tới có việc gì.'}`,
    choices: [
      ...(mine ? [] : [{
        t: 'Nhận việc của thế gia (tăng danh vọng)', dis: !!foe,
        fn: () => { const m = Math.round(12 * moneyScale(effRi())); s.money += m; s.fame += 4; refresh(); return `Ngươi giúp ${c.n} xử lý một việc vặt ở ngoại thành. Được trả ${fmt(m)} linh thạch, danh vọng tăng.`; },
      }]),
      { t: 'Cáo từ', fn: () => 'Ngươi chắp tay rời đi.' },
    ],
  }));
}

// ---------- Nhiệm Vụ Đường ----------
function masterHall() {
  const cu = masterCatchUp();
  if (cu) toastMsg(cu);
  const m = master();
  const sct = SECTS[s.sect!.id];
  const ros = elderRoster();
  const card = (e: Elder): Card => {
    const why = baiBlock(e);
    const mine = isMyMaster(e);
    return {
      t: `${e.name}${e.title && e.title !== e.name ? ' · ' + e.title : ''}${mine ? ' · sư phụ của ngươi' : ''}`,
      sub: `${e.seat} · ${REALMS[e.r].n} · ${EL[e.el].n} hệ · ${e.g === 'm' ? 'nam' : 'nữ'}, ${e.age} tuổi · ${e.trait}. ${e.d}`,
      note: `${e.w ? `Truyền ${WEAPON_N[e.w].toLowerCase()} pháp chân truyền${e.role === 'the' ? ', căn cốt +1' : ''}` : ROLE_GIFT[e.role]}${mine || why ? '' : backer() ? ' · chắc chắn nhận (nể mặt gia thế)' : ` · cơ hội ${Math.round(baiChance(e) * 100)}%`}`,
      hl: mine, dis: !!why, why: why || undefined, edge: EL[e.el].c,
      fn: after(() => run(() => baiSu(e))),
    };
  };
  const leaders = ros.filter((e) => e.top).map(card);
  const inner = ros.filter((e) => e.inner && !e.top).map(card);
  const outer = ros.filter((e) => !e.inner && !e.top).map(card);

  const top: Card[] = [];
  const asg = assignedMaster();
  if (m && !ros.some(isMyMaster)) top.push({ t: `${m.name} · sư phụ của ngươi${asg ? ' (tông phân công)' : ''}`, sub: `${REALMS[m.r].n} · ${EL[m.el].n} hệ · ${m.trait}`, hl: true, dis: true, fn: () => {} });
  if (asg) top.push({ t: `Xin thôi sư phụ phân công`, sub: `Trả ${asg.name} về làm sư thúc, không mất thiện cảm, rồi tự chọn lại`, fn: () => { toastMsg(releaseAssigned()); masterHall(); } });
  const intro = asg
    ? `${asg.name} chỉ là sư phụ do tông môn phân công khi ngươi nhập môn. Ngươi có thể xin thôi, hoặc bái thẳng một vị khác — không bị phạt, sư phụ cũ cũng không để bụng.`
    : m
    ? `Ngươi đã là đệ tử của ${m.name}. Đổi thầy thì cơ hội thấp hơn, và sư phụ cũ sẽ để bụng.`
    : `Ngươi có thể cầu bái ${headTitle(sct)}, Thái thượng trưởng lão hoặc các vị trưởng lão trong môn. Linh căn hợp hệ, ngộ tính, mị lực, thân phận cao thì dễ được nhận.${schoolKeyOfSect(sct.n) && (s.world ?? 0) < 4 ? ' Tại hạ giới, các đạo hiệu và chức vụ truyền thuyết do hậu nhân hoặc y bát truyền nhân của chư vị tiền bối Hồng Hoang kế thừa.' : ''} Bị từ chối thì một năm sau mới cầu lại được.`;
  const bk = backer();
  const body: HTMLElement[] = [h('p', { class: 'pl-desc' }, intro + (bk ? ` Có điều ${bk} — vị trưởng lão nào cũng phải nể mặt, ngươi chọn ai người đó nhận.` : ''))];
  if (top.length) body.push(grid(top));
  if (leaders.length) body.push(h('h4', { class: 'cx-h' }, `${headTitle(sct)} & Thái thượng trưởng lão (${leaders.length})`), grid(leaders, top.length));
  body.push(h('h4', { class: 'cx-h' }, `Trưởng lão nội môn (${inner.length})`), grid(inner, top.length + leaders.length));
  body.push(h('h4', { class: 'cx-h' }, `Trưởng lão ngoại môn (${outer.length})`), grid(outer, top.length + leaders.length + inner.length));
  body.push(grid([{ t: 'Trở lại', fn: () => openPlace() }], top.length + leaders.length + inner.length + outer.length));
  openModal('Bái sư', body, { wide: true, noClose: true, xBtn: true, sub: sct.n });
  refresh();
}

function jobHall() {
  const jobs = myJobs();
  const ready = jobs.filter(jobDone);
  const cards: Card[] = [];
  const gain = (j: SectJob) => `+${j.reward} cống hiến${j.craft && j.xp ? ` · +${j.xp} thuần thục ${CRAFT_N[j.craft].toLowerCase()}` : ''}`;
  if (ready.length) cards.push({ t: `Giao nộp ${ready.length} việc đã xong`, sub: ready.map(gain).join(' · '), hl: true, fn: () => { toastMsg(deliverJobs()); jobHall(); } });
  for (const j of jobs) if (!jobDone(j)) cards.push({ t: `Đang làm: ${j.n}`, sub: `Còn ${yearsTxt((j.end || 0) - s.year)} · ${gain(j)}`, dis: true, fn: () => {} });
  // việc tay nghề: mở cảnh phong chủ giao việc, làm ngay 3 tháng; việc khác: nhận rồi làm dần
  for (const j of jobBoard()) cards.push({ t: j.n, sub: `${yearsTxt(j.dur)} · ${gain(j)}`, dis: jobs.length >= MAX_JOBS, why: jobs.length >= MAX_JOBS ? `Đã nhận đủ ${MAX_JOBS} việc` : undefined, fn: j.craft ? after(() => run(() => craftJobScene(j))) : () => { toastMsg(takeJob(j)); jobHall(); } });
  cards.push({ t: 'Trở lại', fn: () => openPlace() });
  openModal('Nhiệm Vụ Đường', [h('p', { class: 'pl-desc' }, 'Việc của tông môn: nhận việc rồi cứ tu luyện, đi lại bình thường — việc xong lúc nào thì quay về đây giao nộp lúc ấy, việc đã nhận không mất. Ba việc luyện đan, luyện khí, chế phù luôn có: phong chủ giao việc, làm ngay trong 3 tháng rồi giao nộp; ngoài cống hiến còn tăng thuần thục tay nghề. Tối đa ba việc cùng lúc.'), grid(cards)], { wide: true, noClose: true, xBtn: true, sub: SECTS[s.sect!.id].n });
  refresh();
}

// ---------- Tàng Kinh Các / Bảo khố ----------
function techEffect(tc: Tech): string {
  const p = [`tu ×${techSpeed(tc).toFixed(2)}`, `hợp linh căn ${Math.round(techAff(tc.id) * 100)}%`];
  if (tc.pw) p.push(`công ×${tc.pw}`);
  if (tc.def) p.push(`thủ ×${tc.def}`);
  if (tc.hp) p.push(`huyết ×${tc.hp}`);
  return p.join(', ');
}
export function openLibrary(kind: 'book' | 'vault', tab = 0) {
  if (!s.sect) return;
  const sc = SECTS[s.sect.id];
  const PFX = ['cp:', 'sk:', 'tp:', 'fq:'];
  const VAULT_CATS = ['Pháp khí', 'Đan dược', 'Phù lục', 'Vật liệu luyện đan', 'Vật liệu luyện khí', 'Vật liệu chế phù', 'Nộp đổi cống hiến'];
  const vcat = (w: { id: string }) => { const c = wareCat({ id: w.id } as never); return c === 1 ? 0 : c - 1; };
  const allW = sectWares().filter((w) => !/^(cp|sk|tp|fq):/.test(w.id));
  const isDonateTab = kind === 'vault' && tab === 6;

  let cards: Card[] = [];
  if (isDonateTab) {
    for (const b of s.bag) {
      const baseP = itemPrice(b.id, b.g);
      const c1 = Math.max(1, Math.round(baseP * 0.45));
      const cAll = c1 * b.n;
      cards.push({
        t: `${itemName(b.id, b.g)} ×${b.n}`,
        sub: `Giao nộp nhận cống hiến · 1 cái nhận +${c1} cống hiến · nộp hết nhận +${cAll} cống hiến`,
        note: `trong túi: ${b.n}`,
        icon: itemArtSvg(b.id, 34, b.g) || matIconSvg(b.id, 34),
        edge: '#4f7a55',
        hl: true,
        fn: () => {
          const res = donateItemToVault(b.id, b.n);
          toastMsg(res.msg);
          refresh();
          openLibrary('vault', 6);
        },
      });
    }
    for (const gr of s.gearBag) {
      const cg = Math.max(5, Math.round(gearPrice(gr) / 7));
      cards.push({
        t: gr.n,
        sub: `${gearLabel(gr)} · ${SLOTS[gr.slot]} · ${REALMS[gr.lv].n} · Giao nộp nhận +${cg} cống hiến`,
        icon: gearArtSvg(gr, 34),
        edge: TIER_C[gr.g],
        hl: true,
        fn: () => {
          const res = donateGearToVault(gr.uid);
          toastMsg(res.msg);
          refresh();
          openLibrary('vault', 6);
        },
      });
    }
  } else {
    const wares = kind === 'book' ? sectWares().filter((w) => w.id.startsWith(PFX[tab])) : allW.filter((w) => vcat(w) === tab);
    const giaiOf = (id: string, gr?: { g: number }) => {
      if (gr) return Math.max(1, gr.g);
      const [k, key] = id.split(':');
      if (k === 'h') return Math.max(1, (HERBS[key]?.tier ?? 2) - 1);
      if (k === 'm') return Math.max(1, Math.min(6, (MATS[key]?.tier ?? 2) - 1));
      if (k === 't') return TALIS[key]?.tier ?? 1;
      if (k === 'cp') return TECHS[key]?.tier ?? 1;
      if (k === 'sk') return SKILLS[key]?.tier ?? 1;
      if (k === 'tp') return TAMPHAP[key]?.tier ?? 1;
      if (k === 'fq') return PHAPQUYET[key]?.tier ?? 1;
      if (k === 'p') return PILLS[key]?.tier ? (PILLS[key].tier <= 1 ? 1 : Math.min(6, PILLS[key].tier - 1)) : 1;
      if (k === 'x') return 3;
      return 1;
    };
    // xếp: trấn tông trước, rồi theo giai, theo giá
    const ord = (id: string) => (id.startsWith('cp:') && isExclusiveTech(id.slice(3)) ? 0 : 1);
    wares.sort((a, b) => giaiOf(b.id, b.gear) - giaiOf(a.id, a.gear) || ord(a.id) - ord(b.id) || b.cost - a.cost);
    cards = wares.map((w) => {
      const [k, key] = w.id.split(':');
      const locked = s.sect!.rank < w.minRank;
      const poor = s.sect!.contrib < w.cost;
      let t = w.n, sub = `${w.cost} cống hiến`, icon = '', edge = '', note = '';
      if (k === 'cp') {
        const tc = TECHS[key];
        t = `${isExclusiveTech(key) ? 'Công pháp trấn tông' : 'Công pháp'}: ${tc.n}`;
        sub += ` · ${tc.el.length ? tc.el.map((e) => EL[e].n).join(' · ') + ' hệ' : 'vô thuộc tính'} · ${techGrade(tc)} · ${techEffect(tc)}`;
        icon = itemArtSvg('cp:' + key, 34)!;
        edge = TIER_C[tc.tier];
        if (s.tech === key) note = 'đang tu';
      } else if (k === 'sk') {
        const sk = SKILLS[key];
        t = `Võ công: ${sk.n}`;
        sub += ` · ${skHue(sk) ? skHue(sk)!.n + ' hệ' : 'vô thuộc tính'} · ${skillGrade(sk)} · ${SK_KIND[sk.k]} ${skillEffect(sk)} · ${skCost(sk)} linh lực`;
        icon = skillIconSvg(sk, 34);
        edge = TIER_C[sk.tier];
        if (s.known.includes(key)) note = 'đã học';
        else if (effRi() < learnReq(sk.tier)) note = `lĩnh hội cần ${REALMS[learnReq(sk.tier)].n}`;
      } else if (k === 'tp') {
        const x = TAMPHAP[key];
        t = `Tâm kinh: ${x.n}`;
        sub += ` · ${tamGrade(x)} · ${tamEffect(x)}`;
        icon = itemArtSvg('tp:' + key, 34)!;
        edge = TIER_C[x.tier];
        if (tamList().includes(key)) note = 'đã lĩnh hội';
        else if (effRi() < learnReq(x.tier)) note = `lĩnh hội cần ${REALMS[learnReq(x.tier)].n}`;
      } else if (k === 'fq') {
        const x = PHAPQUYET[key];
        t = `Pháp quyết: ${x.n}`;
        sub += ` · ${pqGrade(x)} · ${x.d}`;
        icon = itemArtSvg('fq:' + key, 34)!;
        edge = TIER_C[x.tier];
        if (pqList().includes(key)) note = 'đã lĩnh hội';
        else if (effRi() < learnReq(x.tier)) note = `lĩnh hội cần ${REALMS[learnReq(x.tier)].n}`;
      } else if (w.gear) {
        const gr = w.gear;
        t = `Pháp khí: ${gr.n}`;
        sub += ` · ${gearLabel(gr)} · ${SLOTS[gr.slot]} · ${REALMS[gr.lv].n}${gr.el ? ' · ' + EL[gr.el].n : ''} · ${gearLine(gr)}`;
        icon = gearArtSvg(gr, 34);
        edge = TIER_C[gr.g];
      } else if (k !== 'p') {
        t = itemName(w.id, w.g);
        const d = itemDesc(w.id);
        if (d) sub += ` · ${d}`;
        icon = itemArtSvg(w.id, 34, w.g ?? 1) || matIconSvg(w.id, 34);
        edge = TIER_C[Math.min(6, itemTier(w.id))];
        note = `trong túi: ${count(w.id)}`;
      } else {
        const p = PILLS[key];
        t = `Đan dược: ${p.n}`;
        sub += ` · ${pillGrade(p, 1)} · ${p.d}`;
        edge = '#9b2a1f';
        icon = itemArtSvg('p:' + key, 34)!;
        note = `trong túi: ${count(w.id)}`;
      }
      return {
        t, sub, icon, edge, note,
        dis: locked || poor || note === 'đang tu' || note === 'đã học' || note === 'đã lĩnh hội',
        why: note === 'đang tu' || note === 'đã học' || note === 'đã lĩnh hội' ? undefined : locked ? `cần ${rankLabel(w.minRank, sc, s.g)}` : poor ? 'chưa đủ cống hiến' : undefined,
        hl: !locked && !poor && !note.startsWith('đã') && !note.startsWith('đang'),
        fn: () => {
          if (w.gear) {
            if (!addGear({ ...w.gear, uid: Math.random().toString(36).slice(2, 10), refined: true })) return toastMsg('Túi đầy.');
            markVaultSold(w.gear.uid);
          } else if (!addItem(w.id, 1, k === 'p' ? 1 : k === 't' ? w.g ?? 1 : undefined)) return toastMsg('Túi đầy.');
          if ((w as any).uid) markVaultSold((w as any).uid);
          s.sect!.contrib -= w.cost;
          toastMsg(`Đổi được ${w.gear ? w.gear.n : itemName(w.id, w.g)}.`);
          refresh();
          openLibrary(kind, tab);
        },
        _g: giaiOf(w.id, w.gear),
      } as Card & { _g: number };
    });
  }
  const intro = kind === 'book'
    ? [`Kinh thư của ${sc.n}. Cống hiến hiện có: `, h('b', {}, String(s.sect.contrib)), '.', h('br', {}), `Thân phận: ${rankLabel(s.sect.rank, sc, s.g)}.`, h('br', {}), `Công pháp trấn tông chỉ ${sc.n} mới có; tuyệt học giai cao chỉ truyền cho đệ tử bậc cao. Võ công, tâm kinh, pháp quyết phải đủ cảnh giới mới lĩnh hội được.`]
    : [`Bảo khố ${sc.n}: pháp khí, đan dược, phù lục, vật liệu — đổi bằng cống hiến. Cống hiến hiện có: `, h('b', {}, String(s.sect.contrib)), '.', h('br', {}), `Thân phận: ${rankLabel(s.sect.rank, sc, s.g)}. Bảo khố nhập hàng mới mỗi năm; đệ tử có thể dùng cống hiến để đổi hoặc giao nộp vật phẩm lấy cống hiến. Pháp khí của tông đã được luyện hóa sẵn.`];
  if (s.flags.sectWarWins) {
    intro.push(h('br', {}), h('span', { style: { color: '#047857', fontWeight: 'bold' } }, `Chiến tích: Tông môn đã toàn thắng ${s.flags.sectWarWins} lần tông môn chiến — Tàng Kinh Các và Bảo khố đã thu nạp thêm nhiều sách, pháp bảo và nguyên liệu chiến lợi phẩm!`));
  }
  const body: HTMLElement[] = [h('p', { class: 'pl-intro' }, ...intro)];
  if (kind === 'vault') body.push(h('div', { class: 'lib-tabs shop-tabs' }, ...VAULT_CATS.map((n, i) => { const c = i === 6 ? s.bag.length + s.gearBag.length : allW.filter((w) => vcat(w) === i).length; return h('button', { class: i === tab ? 'on' : '', disabled: !c, onclick: () => openLibrary('vault', i) }, n, h('small', {}, ` (${c})`)); })));
  if (kind === 'book') body.push(h('div', { class: 'lib-tabs' }, ...['Công pháp', 'Võ công', 'Tâm kinh', 'Pháp quyết'].map((n, i) => h('button', { class: i === tab ? 'on' : '', onclick: () => openLibrary('book', i) }, n, h('small', {}, ` (${sectWares().filter((w) => w.id.startsWith(PFX[i])).length})`)))));
  if (isDonateTab) {
    if (cards.length) body.push(grid(cards, 0));
    else body.push(h('div', { class: 'empty' }, 'Túi đồ không có vật phẩm hoặc trang bị nào để giao nộp đổi cống hiến.'));
  } else {
    const REALM_SEC = ['', 'Luyện Khí', 'Trúc Cơ', 'Kết Đan', 'Nguyên Anh', 'Hóa Thần', 'Luyện Hư trở lên'];
    let start = 0;
    for (let g = 1; g <= 6; g++) {
      const part = (cards as (Card & { _g: number })[]).filter((c) => c._g === g);
      if (!part.length) continue;
      const mine = realmForGiai(g) === Math.max(1, Math.min(6, effRi()));
      body.push(h('h4', { class: 'lib-sec' + (mine ? ' mine' : '') }, `${REALM_SEC[g]} · ${TIER_N[g]}`, mine ? h('small', {}, '  — hợp cảnh giới hiện tại') : null));
      body.push(grid(part, start));
      start += part.length;
    }
    if (!cards.length) body.push(h('div', { class: 'empty' }, 'Không có gì để đổi.'));
  }
  body.push(grid([{ t: 'Trở lại', fn: () => openPlace() }], cards.length));
  openModal(kind === 'book' ? 'Tàng Kinh Các' : 'Bảo khố tông môn', body, { wide: true, noClose: true, xBtn: true, sub: `${whereOf(LOCS[s.loc])} · ${sc.n}` });
}

// ---------- Cửa tiệm theo danh mục ----------
export function openStore(cat = 0) {
  const l = LOCS[s.loc];
  const all = stock();
  const counts = SHOP_CATS.map((_, i) => all.filter((w) => wareCat(w) === i).length);
  if (!counts[cat]) cat = Math.max(0, counts.findIndex((n) => n > 0));
  const wares = all.filter((w) => wareCat(w) === cat);
  const cards: Card[] = wares.map((w) => {
    const [k, key] = w.id.split(':');
    let sub = `${fmt(w.price)} linh thạch`;
    let icon = '';
    let edge = '';
    if (w.gear) {
      sub += ` · ${gearLabel(w.gear)} · ${SLOTS[w.gear.slot]} · ${REALMS[w.gear.lv].n}${w.gear.el ? ' · ' + EL[w.gear.el].n : ''} · ${gearLine(w.gear)}`;
      icon = gearArtSvg(w.gear, 34);
      edge = TIER_C[w.gear.g];
    } else {
      icon = (k === 'sk' ? scrollIconSvg(w.id, 34) : itemArtSvg(w.id, 34, w.g ?? 1)) || matIconSvg(w.id, 34);
      const d = w.d || (/^(recipe|craft):/.test(w.id) ? '' : itemDesc(w.id));
      if (d) sub += ` · ${d}`;
      edge = TIER_C[Math.min(6, itemTier(w.id))];
    }
    const have = !w.gear && /^(p|h|m|t):/.test(w.id) ? count(w.id) : 0;
    return {
      t: w.n + (w.qty > 1 ? ` (còn ${w.qty})` : ''),
      sub, icon, edge,
      note: have ? `trong túi: ${have}` : undefined,
      dis: s.money < w.price,
      why: s.money < w.price ? 'không đủ linh thạch' : undefined,
      hl: s.money >= w.price,
      fn: () => { toastMsg(buy(w)); refresh(); openStore(cat); },
    };
  });
  const body: HTMLElement[] = [
    h('p', { class: 'pl-intro' }, 'Linh thạch: ', h('b', {}, fmt(s.money)), ` · Túi đồ ${bagUsed()}/${bagCap()} ô.`, h('br', {}), 'Hàng mỗi năm mỗi khác, chủ tiệm nhập gì bán nấy.'),
    h('div', { class: 'lib-tabs shop-tabs' }, ...SHOP_CATS.map((n, i) => h('button', { class: i === cat ? 'on' : '', disabled: !counts[i], onclick: () => openStore(i) }, n, h('small', {}, ` (${counts[i]})`)))),
  ];
  body.push(cards.length ? grid(cards) : h('div', { class: 'empty' }, 'Mục này hết hàng.'));
  body.push(grid([{ t: 'Bán đồ', sub: 'Bán vật phẩm lấy linh thạch', fn: after(() => openShop(1)) }, { t: 'Trở lại', fn: () => openPlace() }], cards.length));
  openModal(l.type === 'market' ? l.n : `Cửa tiệm · ${l.n}`, body, { wide: true, noClose: true, xBtn: true, sub: `${whereOf(l)} · ${l.n}` });
}

// ---------- Hoàng cung ----------
export function openCourt(eid: string) {
  const e = EMPIRES[eid];
  const c = myCourt();
  const mine = c?.id === eid;
  const y = Math.floor(s.year);
  const cards: Card[] = [];
  const met = (s.flags.audYear || {})[eid] === y;
  cards.push({ t: `Yết kiến ${e.ruler}`, sub: met ? 'Năm nay đã yết kiến' : 'Mỗi năm một lần · lễ vật, danh vọng, mật lệnh · có thể được ban hôn', dis: met, hl: !met, fn: after(() => run(() => audience(e))) });
  COURT_RANKS.forEach((rn, i) => {
    const err = canTakePost(e, i);
    const held = mine && c!.rank >= i;
    cards.push({ t: held ? `${rn} · đang giữ` : `Nhận chức ${rn}`, sub: `Cần ${REALMS[courtReq(i, e.tier)].n}${i ? ` · ân sủng ${i * 40}` : ''} · bổng lộc mỗi năm`, dis: !!err || held, why: held ? undefined : err || undefined, hl: !err && !held, fn: () => { toastMsg(takePost(e, i)); refresh(); openCourt(eid); } });
  });
  cards.push({ t: 'Nhận việc triều đình', sub: `Trấn yêu, dẹp loạn, hộ giá · thưởng lớn${mine ? ' · tăng ân sủng' : ''}`, fn: after(() => run(() => courtTask(e))) });
  if (mine) cards.push({ t: 'Từ quan', sub: 'Trả lại ấn tín', fn: () => askConfirm('Từ quan, trả lại ấn tín?', () => { toastMsg(resignPost()); refresh(); openCourt(eid); }, { title: 'Từ quan', ok: 'Từ quan' }) });
  cards.push({ t: 'Trở lại', fn: () => openPlace() });
  const pat = e.patron ? SECTS[e.patron] : null;
  openModal(`Hoàng cung · ${e.n}`, [
    h('p', { class: 'pl-intro' }, e.d, h('br', {}), `${EMPIRE_TIER[e.tier]} · ${e.ruler} trị vì · hộ quốc lão tổ ${REALMS[EMPIRE_GUARD[e.tier]].n}${pat ? ` · hậu thuẫn: ${pat.n}` : ''}.`, mine ? [h('br', {}), 'Ngươi là ', h('b', {}, COURT_RANKS[c!.rank]), ` · ân sủng ${c!.favor}.`] : null),
    grid(cards),
  ], { wide: true, noClose: true, xBtn: true, sub: `${whereOf(LOCS[e.capital])} · ${LOCS[e.capital].n}` });
}

// ---------- Cảnh ở tông môn: bái sơn, về phủ (chuyển từ hud.ts để tránh vòng place → hud → place) ----------
export function scionHome(id: string) {
  const sc = SECTS[id];
  const p = s.npcs.find((n) => n.alive && n.tag === 'kin' && n.sect === id);
  const y = Math.floor(s.year);
  const visited = s.flags.scionVisit === y;
  const pName = p ? p.name : 'thân nhân';
  showScene({
    title: 'Về phủ',
    text: `Phủ đệ của ${pName} nằm lưng chừng núi trong ${sc.n}: mái ngọc, sân rộng, gia nhân cúi đầu gọi ngươi là ${s.g === 'm' ? 'công tử' : 'tiểu thư'}. Danh vị Thánh ${s.g === 'm' ? 'tử' : 'nữ'} đã mất, nhưng đây vẫn là nhà.${s.flags.thapKnown ? '' : '\n\nNgoài kia người ta vẫn gọi ngươi là phế vật. Trong phủ, không ai dám.'}`,
    choices: [
      {
        t: `Thỉnh an ${pName}`, dis: visited || !p, hint: visited ? 'Năm nay đã thỉnh an' : undefined,
        fn: () => {
          s.flags.scionVisit = y;
          passTime(1 / 12);
          if (p) p.rel = Math.min(100, p.rel + 5);
          const m = Math.round(80 * Math.pow(1.8, Math.max(0, s.r - 1)));
          s.money += m;
          return `${pName} hỏi han vài câu, không nhắc chuyện linh căn. Lúc ngươi lui ra, quản gia lặng lẽ đưa thêm một túi linh thạch (+${m}).`;
        },
      },
      {
        t: 'Xin trắc linh lại', cls: 'danger', dis: !!s.flags.thapKnown, hint: s.flags.thapKnown ? 'Thiên hạ đã biết' : 'Có thể bị chê cười',
        fn: () => {
          passTime(1 / 12);
          if (Math.random() < 0.12 + s.r * 0.04) {
            s.flags.thapKnown = true;
            s.fame += 100;
            mark('Trắc linh lại trong thánh địa — lộ ra ' + hiddenRootName());
            const f = hiddenFlows();
            return `Đá trắc linh vẫn tối. Nhưng lần này có một vị Thái thượng trưởng lão đi ngang, dừng lại nhìn rất lâu, rồi đặt tay lên vai ngươi. Linh lực của ông chạy một vòng — rồi khựng lại. "${f[0].toUpperCase() + f.slice(1)} hệ... cân bằng tới mức đá cũng mù." Cả điện im phăng phắc.`;
          }
          s.tamma = Math.min(100, s.tamma + 6);
          return 'Đá trắc linh không sáng một tia. Chấp sự giám sát nhếch mép: "Công tử, đá không biết nói dối." Tiếng cười khúc khích sau lưng theo ngươi về tận phủ.';
        },
      },
      { t: 'Lui ra', fn: () => 'Ngươi về phòng, đóng cửa lại.' },
    ],
  });
}

export function applySect(id: string) {
  const sc = SECTS[id];
  const c = canJoin(id);
  const token = s.bag.some((b) => b.id === 'x:kiemlenh');
  const sRace = sectRace(sc);
  const raceLabel = sRace === 'yao' ? 'Thế lực Yêu tộc (chỉ thu nhận Yêu tộc)' : sRace === 'all' ? 'Tiệt Giáo hữu giáo vô loại (nhận cả Nhân tộc & Yêu tộc)' : 'Tiên môn Nhân tộc';
  const welcomeText = c.ok ? (isYao() ? 'Thủ lĩnh/trưởng lão mở sơn môn, đón tiếp yêu tu bái nhập.' : 'Đệ tử gác cổng dẫn ngươi tới trước đá trắc linh.') : c.why;
  const actBtnText = isYao() ? 'Vận khí bái sơn nhập môn' : 'Đặt tay lên đá trắc linh';
  showScene({
    title: `Bái sơn ${sc.n}`,
    text: `${sc.d}\n\n${SECT_TIER[sc.tier]} · ${raceLabel} · ${sc.el.length ? 'Hệ: ' + sc.el.map((e) => EL[e].n).join(', ') : 'Không kén hệ'}${sc.evil ? ' · Ma đạo' : ''}\n\n${welcomeText}`,
    choices: [
      ...(c.ok ? [{ t: actBtnText, cls: 'prime' as const, fn: () => joinSect(id) }] : []),
      ...(!c.ok && token && canJoin(id, true).ok ? [{ t: 'Trình lệnh bài tiến cử', cls: 'prime' as const, fn: () => { s.bag = s.bag.filter((b) => b.id !== 'x:kiemlenh'); return 'Trưởng lão xem lệnh bài, gật đầu. ' + joinSect(id); } }] : []),
      { t: 'Cáo từ', fn: () => 'Ngươi chắp tay cáo từ.' },
    ],
  });
}
