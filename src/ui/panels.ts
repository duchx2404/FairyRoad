import { openAuthModal } from './auth-modal';
import { getCurrentUser, isLoggedIn, fetchRoster, fetchWorldChat, sendWorldChatMessage, syncSaveToCloud, loadSaveFromCloud } from '../engine/auth';
import { isGeminiActive, DEFAULT_GEMINI_MODEL } from '../ai/gemini';
import { fight, fightSummary, type FoeSpec } from '../engine/combat';
import { worldDefinitions } from '../data/local-items';
// Cửa sổ trang kéo thả được.
import { skEff, skGradeOf } from '../engine/char';
import { glyphSvg, SLOT_GLYPH, SECT_GLYPH } from './glyph';
import { board, myRank, retPeople, realmTxt, TK_AGE, TC_INTRO, MYTHIC_RACES, type TcRow } from '../engine/tienco';
import { soulAge, lifeLived } from '../engine/char';
import { skSource, skSrcMul, count } from '../engine/char';
import { kmCalc } from '../engine/kinhmach';
import { avatarSvg, playerPortrait, npcPortrait, npcPic, npcPicWanted, openPortrait } from './hud';
import { weaponKind } from './arena';
import { master } from '../engine/core';
import { worldName } from '../data/core';
import { kmPanel, confirmStow } from './kmpanel';
import { askConfirm, notice } from './dialog';
import { BEAST_INNATE_SKILLS } from '../data/items';
import { applyEvolutionChoice, getAvailableEvolutionBranches, type EvolutionBranch } from '../engine/beast-evolution';
import { isMythicBeast } from '../data/beast-lineage';
import { save } from '../engine/state';
import { addLog, mark } from '../engine/core';
import { h, $, btn, bar } from './dom';
import { s, meta, saveMeta } from '../engine/state';
import { daoluTitle, isPrimaryDaolu } from '../engine/relationships';
import { REALMS, STAGES, STATS, STAT_KEYS, EL, PERKS, PHAM_N, PHAM_BONUS, DAO_CO, ORIGINS, originName, CLANS, BODIES, ROOTS, ALL_EL, VARIANT_EL, khacOf, hiddenRootKind } from '../data/core';
import { CHAU, whereOf, ownerTxt, LOC_TYPE, EMPIRES, EMPIRE_TIER, EMPIRE_GUARD, COURT_RANKS, VUC, LOCS, LOC_LIST, SECTS, BEASTS, beastRoot, REGIONS, SECT_TIER, SECT_TIER_INFO, CRAFT_LABEL, rankLabel } from '../data/world';
import { courtTitle } from '../engine/court';
import { TECHS, SKILLS, skHue, hueBg, SLOTS, GEAR_GRADE_C, TIER_N, TIER_C, gearLabel, techGrade, skillGrade, techSpeed, PILLS, HERBS, MATS, TALIS, SPECIALS, REFINE_Y, TECH_SPEED, MAX_SKILLS, type Gear } from '../data/items';
import { stat, age, maxLife, rootLabel, techAff, checkArtRacePermission, atkOf, defOf, maxHp, powerScore, cultRate, body, bagCap, bagUsed, itemName, itemDesc, sortBag, stageName, daoCoInfo, phams, phamSum, yeuDanName, isYao, yaoToHumanAge, humanToYaoAge } from '../engine/char';
import { phamProbs } from '../engine/core';
import { laws, daos, daoOf, daoPow, R_CHUANTHANH } from '../engine/dao';
import type { NPC } from '../engine/state';
import { party, canInvite, invite, setActive, dismiss, activeNpcs, reserveNpcs, activeCount, MAX_ACTIVE, kit, kitSkills, kitSum, compMul, giftGear, giftItem, outfit } from '../engine/party';
import { exiles, exileMigrate } from '../engine/ally';
import { bioDesc } from '../engine/bride';
import { npcPow } from '../engine/char';
import { myLinh as linhOf } from '../engine/char';
import { npcAge, npcRealm, relLabel, MERIDIANS, merMax, openMeridian, dateStr } from '../engine/core';
import { toggleTam, releaseLinh, toggleLinhRide, usePill, useSpecial, readScroll, toggleSkill, stowSkill, knownByGrade, isChaosBroken, canUpgradeChaosSword, CHAOS_FORGE_MATS, repairChaosSword, startRefine, equip, unequip, gearLine, discard, discardGear } from '../engine/items';
import { npcActions, songTuWith } from '../engine/actions';
import { ACH } from '../engine/life';
import { icon } from './menus';
import { isExclusiveTech, techOwners } from '../engine/sect';
import { itemArtSvg, gearArtSvg } from './art';
import { skillIconSvg, techIconSvg, tamIconSvg, pqIconSvg, linhIconSvg } from './icons';
import { PHAPQUYET, CHANLINH, pqGrade, clEffect, MOUNT_GRADE, mountEffect } from '../data/spirit';
import { xpNeed, craftTitle, CRAFT_N, type CraftK } from '../engine/craft';
import { forceBoard, treasureBoard, masterBoard, toolBoard, tbdbBoard, FORCE_KIND_N, MASTER_N, TOOL_N, type ForceKind, type BaoRow } from '../engine/bang';
import { TB_KIND_N, TB_KIND_C } from '../data/tbdb';
import { CELESTIAL } from '../data/celestial';
import { fengshenData, FENGSHEN_TOTAL } from '../events/fengshen';
import { skCost } from '../engine/combat';
import { TAMPHAP, tamGrade, tamEffect } from '../data/items';
import { turnLen, tamList, tamActive, tamSlots, pqList, myLinh } from '../engine/char';
import { getLinh, feedLinh, STAGE_NAMES } from '../engine/beast-companion';
import { formatStonesDetail, formatStonesShort } from '../engine/stones';
import { showScene, toast, refresh, openModal, closeModal } from './modal';
import { listModels, setAi, aiBlockReason } from '../ai/ollama';
import { fmt, yearsTxt, esc } from '../core/util';

export const NAV: [string, string][] = [
  ['char', 'Nhân vật'],
  ['bag', 'Kho đồ'],
  ['km', 'Kinh mạch'],
  ['daolu', 'Đạo lữ'],
  ['party', 'Đồng hành'],
  ['rel', 'Nhân mạch'],
  ['tienco', 'Thiên Cơ Lâu'],
  ['multi', 'Vạn Giới'],
  ['chat', 'Trò chuyện'],
  ['log', 'Nhật ký'],
  // Đồ giám đã sáp nhập vào Thiên Cơ Lâu
  ['hist', 'Sử ký'],
  ['ach', 'Thành tựu'],
  ['set', 'Cài đặt'],
  ['help', 'Cách chơi'],
];
const NAV_GLYPH: Record<string, string> = {
  char: 'navChar', bag: 'navBag', km: 'navKm', daolu: 'navDaolu', party: 'navParty', rel: 'navRel', tienco: 'navTower', multi: 'navParty', chat: 'navChat',
  log: 'navLog', hist: 'navHist', ach: 'navAch', set: 'navSet', help: 'navHelp',
};
export const npcTagName = (n: NPC) => n.spouseRole ? daoluTitle(n) : (n.id === s.flags.heroineId || (n as any).heroine ? 'Nữ chính' : TAG_N[n.tag]);
const navIcon = (id: string) => glyphSvg(NAV_GLYPH[id] || 'none', 22, 1.7);
const open = new Map<string, { el: HTMLElement; tab: number }>();
let zTop = 10;

export function renderNav() {
  const nav = $('#nav');
  const scroll = nav.scrollLeft;
  nav.innerHTML = '';
  for (const [id, n] of NAV) {
    const b = h('button', { class: open.has(id) ? 'on' : '', onclick: () => toggle(id), 'aria-label': n }, h('span', { class: 'nav-ic', html: navIcon(id) }), h('span', { class: 'tip' }, n));
    if (id === 'rel' && s && s.npcs.some((x) => x.alive && x.rel >= 80 && x.tag !== 'daolu')) b.append(h('span', { class: 'dot' }));
    nav.append(b);
  }
}
export function toggle(id: string) {
  if (open.has(id)) close(id);
  else show(id);
}
export function close(id: string) {
  open.get(id)?.el.remove();
  open.delete(id);
  renderNav();
}
export function closeAll() {
  for (const id of [...open.keys()]) close(id);
}
export function show(id: string, tab = 0) {
  if (open.has(id)) { open.get(id)!.tab = tab; renderPanels(); return; }
  closeAll(); // chỉ mở một bảng tại một thời điểm
  const [, n] = NAV.find((x) => x[0] === id)!;
  const el = h('div', { class: 'win' + (['bag', 'codex', 'hist', 'help', 'km', 'tienco'].includes(id) ? ' wide' : '') });
  const head = h('div', { class: 'win-h' }, h('span', { class: 'seal', html: navIcon(id) }), h('b', {}, n), h('button', { onclick: () => close(id) }, '✕'));
  const bd = h('div', { class: 'win-b' });
  el.append(head, bd);
  const i = open.size;
  el.style.left = Math.max(10, innerWidth - (id === 'bag' || id === 'codex' || id === 'hist' || id === 'help' || id === 'km' || id === 'tienco' ? 640 : 500) - i * 26) + 'px';
  el.style.top = 70 + i * 26 + 'px';
  el.style.zIndex = String(++zTop);
  el.addEventListener('pointerdown', () => (el.style.zIndex = String(++zTop)));
  drag(el, head);
  $('#wins').append(el);
  open.set(id, { el, tab });
  renderPanels();
  renderNav();
}
function drag(el: HTMLElement, head: HTMLElement) {
  let sx = 0, sy = 0, ox = 0, oy = 0, on = false;
  head.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    on = true; sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop;
    head.setPointerCapture(e.pointerId);
  });
  head.addEventListener('pointermove', (e) => {
    if (!on) return;
    el.style.left = Math.max(-200, Math.min(innerWidth - 80, ox + e.clientX - sx)) + 'px';
    el.style.top = Math.max(0, Math.min(innerHeight - 40, oy + e.clientY - sy)) + 'px';
  });
  head.addEventListener('pointerup', () => (on = false));
}
const tabsEl = (id: string, names: string[]) => {
  const st = open.get(id)!;
  return h('div', { class: 'tabs' }, ...names.map((n, i) => h('button', { class: i === st.tab ? 'on' : '', onclick: () => { st.tab = i; renderPanels(); } }, n)));
};

export function renderPanels() {
  for (const [id, st] of open) {
    const bd = st.el.querySelector('.win-b') as HTMLElement;
    const sc = bd.scrollTop;
    bd.innerHTML = '';
    try {
      bd.append(...build(id));
    } catch (e) {
      console.error(e);
      bd.append(h('div', { class: 'empty' }, 'Lỗi hiển thị: ' + String(e)));
    }
    if (id === 'tienco') {
      const g = Math.min(st.tab, TC_GROUPS.length - 1);
      const t = Math.min(tcSub[g] || 0, Math.max(0, TC_GROUPS[g][1].length - 1));
      applyTcSearch(tcSearch[`${g}:${t}`] || '');
    }
    bd.scrollTop = sc;
  }
}
function build(id: string): HTMLElement[] {
  if (!s && !['hist', 'ach', 'set', 'help'].includes(id)) return [h('div', { class: 'empty' }, 'Chưa đầu thai.')];
  switch (id) {
    case 'char': return charPanel();
    case 'bag': return bagPanel();
    case 'km': return kmPanel(() => refresh(), (m) => { if (m) toast(m); });
    case 'daolu': return daoluPanel();
    case 'party': return companionPanel();
    case 'rel': return relPanel();
    case 'tienco': return tiencoPanel();
    case 'log': return logPanel();
    case 'hist': return histPanel();
    case 'ach': return achPanel();
    case 'multi': return multiPanel();
    case 'chat': return chatPanel();
    case 'set': return setPanel();
    case 'help': return helpPanel();
  }
  return [];
}

// ---------- Nhân vật ----------
const kv = (k: string, v: string | HTMLElement, tip?: string) => h('div', { class: 'cp-kv', title: tip || '' }, h('span', {}, k), h('span', {}, v));
const sec = (n: string) => h('div', { class: 'cp-sec' }, n);
const elTags = (els: string[]) => h('span', { class: 'cp-els' }, ...els.map((e) => h('span', { class: 'cp-el', style: { background: EL[e as keyof typeof EL].c } }, EL[e as keyof typeof EL].n)));
export function openFeedModal() {
  const cl = getLinh();
  if (!cl) { toast('Chưa có linh thú đồng hành.'); return; }

  const modalBox = h('div', { class: 'feed-modal' });

  const render = () => {
    modalBox.innerHTML = '';
    const freshCl = getLinh();
    if (!freshCl) { closeModal(); return; }

    const d = CHANLINH[freshCl.id];
    const stageStr = STAGE_NAMES[freshCl.stage] || 'Trưởng thành';
    const realmStr = `${REALMS[freshCl.r].n} ${STAGES[freshCl.st]}`;

    const infoCard = h('div', { class: 'card', style: { marginBottom: '14px', padding: '10px' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } },
        h('b', {}, `${freshCl.name} (${stageStr})`),
        h('span', { style: { color: '#e6c374', fontWeight: 'bold' } }, realmStr),
      ),
      h('div', { class: 'small muted', style: { marginBottom: '6px' } },
        `Tuổi thọ: ${Math.round(freshCl.age)} / ${freshCl.maxLife} năm · Gắn bó: ${Math.round(freshCl.bond)}/100`,
      ),
      h('div', { style: { background: '#2e261f', borderRadius: '4px', overflow: 'hidden', height: '14px', position: 'relative' } },
        h('div', { style: { background: '#8fae72', width: `${Math.min(100, Math.round(freshCl.p))}%`, height: '100%', transition: 'width 0.2s' } }),
        h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, textAlign: 'center', fontSize: '10px', lineHeight: '14px', color: '#fff', textShadow: '0 1px 2px #000' } }, `Tu vi: ${Math.round(freshCl.p)}%`),
      ),
    );

    const descP = h('p', { class: 'pl-desc', style: { marginBottom: '10px' } },
      'Cho linh thú dùng thiên tài địa bảo, linh thảo, linh quả, yêu đan hoặc tinh huyết thượng cổ để tăng nhanh tu vi và đẩy nhanh quá trình trưởng thành hoặc kéo dài tuổi thọ.',
    );

    const eligible: { id: string; name: string; qty: number; desc: string; icon: string }[] = [];
    for (const it of s.bag) {
      const [k, key] = it.id.split(':');
      if (k === 'h') {
        const herb = HERBS[key];
        if (herb) {
          const estGain = Math.round(10 * Math.pow(1.8, herb.tier - 1) * (freshCl.stage === 'aunen' ? 1.35 : 1));
          eligible.push({
            id: it.id,
            name: herb.n,
            qty: it.n,
            desc: `+${estGain}% tu vi${herb.tier >= 4 ? ' · Kích thích huyết mạch trưởng thành' : ''}`,
            icon: itemArtSvg(it.id, 28) || '',
          });
        }
      } else if (k === 'm') {
        if (key === 'yeudan') {
          const estGain = Math.round(22 * (freshCl.stage === 'aunen' ? 1.35 : 1));
          eligible.push({
            id: 'm:yeudan',
            name: MATS.yeudan?.n || 'Yêu đan',
            qty: it.n,
            desc: `+${estGain}% tu vi · Kích thích huyết mạch trưởng thành`,
            icon: itemArtSvg('m:yeudan', 28) || '',
          });
        } else if (key === 'thityeu') {
          const estGain = Math.round(6 * (freshCl.stage === 'aunen' ? 1.35 : 1));
          eligible.push({
            id: 'm:thityeu',
            name: MATS.thityeu?.n || 'Thịt yêu thú',
            qty: it.n,
            desc: `+${estGain}% tu vi, bổ sung thể lực`,
            icon: itemArtSvg('m:thityeu', 28) || '',
          });
        } else if (key === 'tuduehuyet') {
          const estGain = Math.round(45 * (freshCl.stage === 'aunen' ? 1.35 : 1));
          eligible.push({
            id: 'm:tuduehuyet',
            name: MATS.tuduehuyet?.n || 'Tổ thú tinh huyết',
            qty: it.n,
            desc: `+${estGain}% tu vi · Tinh huyết cổ đại, kích thích tiến hóa mạnh`,
            icon: itemArtSvg('m:tuduehuyet', 28) || '',
          });
        } else if (key === 'cotuhuyet') {
          const estGain = Math.round(80 * (freshCl.stage === 'aunen' ? 1.35 : 1));
          eligible.push({
            id: 'm:cotuhuyet',
            name: MATS.cotuhuyet?.n || 'Cổ thú tinh huyết',
            qty: it.n,
            desc: `+${estGain}% tu vi · Huyết mạch tổ thú tối thượng`,
            icon: itemArtSvg('m:cotuhuyet', 28) || '',
          });
        }
      }
    }

    const listDiv = h('div', { class: 'list', style: { maxHeight: '300px', overflowY: 'auto' } });
    if (!eligible.length) {
      listDiv.append(h('div', { class: 'empty' }, 'Túi đồ hiện không có linh thảo, linh quả, yêu đan hay tinh huyết yêu thú nào để cho ăn.'));
    } else {
      for (const item of eligible) {
        listDiv.append(
          h('div', { class: 'item', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              item.icon ? h('div', { html: item.icon }) : null,
              h('div', {},
                h('b', {}, `${item.name} `),
                h('span', { class: 'muted' }, `(còn ${item.qty})`),
                h('div', { class: 'small', style: { color: '#8fae72' } }, item.desc),
              ),
            ),
            btn('Cho ăn', () => {
              const res = feedLinh(item.id);
              if (res.ok) {
                toast(res.msg);
                render();
                refresh();
              } else {
                toast(res.msg);
              }
            }, 'small prime'),
          ),
        );
      }
    }

    const foot = h('div', { style: { textAlign: 'right', marginTop: '12px' } },
      btn('Đóng', () => closeModal(), 'ghost'),
    );

    modalBox.append(infoCard, descP, listDiv, foot);
  };

  render();
  openModal(`Nuôi Dưỡng · ${cl.name}`, modalBox, { wide: true, seal: 'paw' });
}

export function showBeastBranchModal(branches?: EvolutionBranch[]) {
  const currentBranches = branches || (s.flags.pendingBeastBranches as EvolutionBranch[]) || (s.beast ? getAvailableEvolutionBranches(s.beast, s.flags.beastNodeId) : []);
  if (!currentBranches || currentBranches.length === 0) {
    notice('Hiện tại huyết mạch của ngươi chưa đến lúc mở ra các đạo lộ tiến hóa mới.', 'Huyết Mạch Yêu Tộc');
    return;
  }

  const modalBox = h('div', { class: 'beast-branch-modal' });

  const intro = h('div', { class: 'card', style: { marginBottom: '16px', padding: '12px', lineHeight: '1.6' } },
    h('div', { style: { fontSize: '15px', fontWeight: 'bold', marginBottom: '6px', color: '#e6c374' } },
      `Bản thể hiện tại: 【${s.beast || 'Yêu thú'}】`
    ),
    h('p', { class: 'small', style: { margin: '0 0 8px 0' } },
      'Huyết mạch viễn cổ cuộn trào trong yêu đan, mở ra các ngã rẽ tiến hóa độc nhất vô nhị. Mỗi con đường đều mang thuộc tính nguyên tố và thần thông bản mệnh riêng biệt.'
    ),
    h('div', { class: 'small', style: { color: '#ef4444', fontStyle: 'italic' } },
      '⚠️ Lưu ý: Một khi đã chọn con đường nào, ngươi phải theo con đường đó đến cùng để tiến hóa lên Thần Thú tối cao, trừ khi gặp đại cơ duyên dùng 【Dị Hóa Niết Bàn Đan】 để biến dị huyết mạch!'
    )
  );
  modalBox.append(intro);

  const branchList = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });

  currentBranches.forEach((b) => {
    const elInfo = EL[b.targetEl] || { n: 'Vô Tính', c: '#888888' };
    const skillId = BEAST_INNATE_SKILLS[b.targetEl];
    const skill = skillId ? SKILLS[skillId] : undefined;
    const reqRealm = REALMS[b.minRealm]?.n || 'Trúc Cơ';
    const reqWorld = worldName(b.minWorld);

    const card = h('div', {
      class: 'card',
      style: {
        padding: '12px 14px',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'rgba(255, 255, 255, 0.03)'
      }
    },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('span', {
            style: {
              background: elInfo.c,
              color: '#fff',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)'
            }
          }, elInfo.n),
          h('b', { style: { fontSize: '16px' } }, b.targetName),
          (b.myth || isMythicBeast(b.targetName))
            ? h('span', { class: 'pill', style: { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', fontSize: '11px', fontWeight: 'bold' }, title: 'Thần Thú có cơ sở truyền thuyết thượng cổ (Sơn Hải Kinh / Thần thoại). Uy áp huyết mạch mạnh hơn 25% so với loài cùng bậc!' }, '👑 Thần Thoại')
            : h('span', { class: 'pill', style: { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', fontSize: '11px' }, title: 'Dị thú do thiên địa biến sinh trong game. Thực lực cơ bản yếu hơn loài có cơ sở truyền thuyết cùng bậc.' }, '🌱 Biến Sinh'),
        ),
        h('span', { class: 'small muted' }, `Đỉnh cao: `, h('b', { style: { color: '#e6c374' } }, b.ultimateAncestor)),
      ),
      h('div', { class: 'small', style: { color: '#bbb' } },
        `Đạo lộ: `,
        h('span', { class: 'muted' }, b.fullLineage.slice().reverse().join(' ➔ '))
      ),
      skill ? h('div', { class: 'small' },
        `Thần thông thức tỉnh: `,
        h('b', { style: { color: elInfo.c } }, `«${skill.n}»`),
        h('span', { class: 'muted' }, ` (${skill.d || 'Bản mệnh thần thông'})`)
      ) : null,
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' } },
        h('span', { class: 'small muted' }, `Cảnh giới: ${reqRealm} · ${reqWorld}`),
        btn('Chọn Đạo Lộ Này', () => {
          askConfirm(
            `Ngươi có chắc chắn chọn đạo lộ tiến hóa thành 【${b.targetName}】 (${elInfo.n} hệ)?\n\nHuyết mạch sẽ khóa chặt vào nhánh này hướng tới đỉnh cao 【${b.ultimateAncestor}】!`,
            () => {
              const resMsg = applyEvolutionChoice(s, b);
              delete s.flags.pendingBeastBranches;
              addLog(resMsg, 'good');
              mark(`Huyết mạch thoát biến: ${s.beast}`);
              save();
              closeModal();
              refresh();
              notice(resMsg, 'Huyết Mạch Thoát Biến Thành Công');
            },
            { title: 'Định Đoạt Đạo Lộ Huyết Mạch', ok: 'Chấp Nhận Tiến Hóa' }
          );
        }, 'prime')
      )
    );
    branchList.append(card);
  });

  modalBox.append(branchList);
  openModal('⚡ Huyết Mạch Thoát Biến · Chọn Đạo Lộ', modalBox, { wide: true, seal: 'paw' });
}

function charPanel(): HTMLElement[] {
  const b = body();
  const org = ORIGINS.find((o) => o.id === s.origin);
  const out: HTMLElement[] = [];
  const act = (m: string) => { if (m) toast(m); refresh(); };
  // ---- đầu trang ----
  out.push(h('div', { class: 'cp-head' }, h('div', { class: 'cp-av click', title: 'Xem tranh toàn thân', onclick: () => openPortrait(s.name, playerPortrait(s.g, age()), s.g, stageName(), weaponKind()), html: avatarSvg(s.g, s.r, s.root.els[0] ?? null, 58, playerPortrait(s.g, age())) }),
    h('div', {}, h('div', { class: 'cp-name' }, s.name),
      h('div', { class: 'cp-realm' }, `${stageName()}${s.world ? ' · ' + worldName(s.world) : ''}${org ? ' · ' + (s.flags.holyScion && !s.flags.thanhtu ? `${s.g === 'm' ? 'công tử' : 'tiểu thư'} thánh địa` : originName(org, s.g)) : ''}`),
      daoCoInfo() ? h('div', { class: 'cp-daoco cp-pham' }, h('a', { class: 'pham p' + s.flags.daoCo, href: '#', title: 'Xem bảng phẩm đạo cơ', onclick: (e: Event) => { e.preventDefault(); openPhamInfo(2); } }, daoCoInfo()!.n), ` (tu luyện ×${daoCoInfo()!.cult}, chiến lực ×${daoCoInfo()!.pow})`) : null, // phẩm Trúc Cơ chính là phẩm đạo cơ, chỉ hiện một lần ở đây
      phamLine())));
  // ---- căn cơ ----
  out.push(sec('Căn cơ'));
  out.push(kv('Giới tính', s.g === 'm' ? '♂ Nam' : '♀ Nữ'));
  if (s.race) out.push(kv('Chủng tộc', s.beast ? `${s.race} · ${s.beast}` : s.race));
  out.push(kv('Tuổi thân thể', `${fmt(age())} / ${fmt(maxLife())}`, 'Tuổi thân thể hiện tại / thọ nguyên — thân thể về một tuổi mỗi lần phi thăng'));
  if (isYao()) {
    const hAge = +(yaoToHumanAge(age())).toFixed(1);
    const hLife = +(yaoToHumanAge(maxLife())).toFixed(1);
    out.push(kv(
      'Quy đổi tuổi',
      `${fmt(age())} tuổi Yêu tộc ≈ ${fmt(hAge)} tuổi Nhân tộc`,
      `Tỉ lệ thọ nguyên 4:1 (1 năm Nhân tộc = 4 năm Yêu tộc; 100 tuổi Yêu tộc ≈ 25 tuổi Nhân tộc, ngược lại 100 tuổi Nhân tộc = 400 tuổi Yêu tộc). Thọ nguyên tương đương Nhân tộc: ${fmt(hLife)} năm.`
    ));
  }
  if (s.world) {
    out.push(kv('Tuổi linh hồn', fmt(soulAge()), 'Tính từ lần sinh đầu tiên, không bao giờ đặt lại'));
    out.push(kv('Thọ cộng dồn', `${fmt(lifeLived())} năm qua ${(s.world ?? 0) + 1} giới`, 'Tổng số năm đã sống ở mọi giới'));
  }
  out.push(kv('Khí huyết', `${fmt(Math.round(maxHp() * (1 - s.hurt / 100)))} / ${fmt(maxHp())}`));
  out.push(kv('Chiến lực', fmt(powerScore()), `Công ${fmt(atkOf())} · Thủ ${fmt(defOf())}`));
  out.push(kv('Công / Thủ', `${fmt(atkOf())} / ${fmt(defOf())}`));
  out.push(kv('Linh thạch', `${fmt(s.money)} (${formatStonesDetail(s.money)})`));
  out.push(kv('Thương thế', `${Math.round(s.hurt)}%`));
  out.push(kv('Tâm ma', `${Math.round(s.tamma)} / 100`));
  out.push(kv('Danh vọng', fmt(s.fame), `Thiện ${s.good} · Ác ${s.evil}`));
  out.push(kv('Chiến tích', `Thắng ${s.wins} trận · hạ ${s.kills}`));
  if (laws().length || daos().length || s.r >= R_CHUANTHANH) out.push(kv('Pháp tắc · Đại đạo', [...laws().filter((e) => !daos().includes(e)).map((e) => daoOf(e).n), ...daos().map((e) => daoOf(e).dao)].join(' · ') || 'chưa ngộ', `Công phạt ×${daoPow().toFixed(2)}. Thánh Nhân cần ≥1 pháp tắc, Hợp Đạo cần ≥1 đại đạo, Đạo chủ cần ≥3 đại đạo.`));
  // ---- tư chất ----
  out.push(sec('Tư chất'));
  if (isYao()) {
    out.push(kv('Yêu Đan', h('span', {}, s.root.els.length ? elTags(s.root.els) : '', ' ', yeuDanName()), `Yêu tộc không có linh căn người phàm. Ngưng tụ Yêu Đan (${s.root.els.map((e) => EL[e].n).join(' · ')} hệ) và tôi luyện nhục thân.`));
    const isMyth = isMythicBeast(s.beast);
    const mythBadge = s.beast ? (isMyth
      ? h('span', { class: 'pill', style: { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', fontSize: '11px', marginLeft: '6px' }, title: 'Thần thú có cơ sở truyền thuyết thượng cổ (Chiến lực & khí huyết +25%)' }, '👑 Thần Thoại')
      : h('span', { class: 'pill', style: { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }, title: 'Dị thú biến sinh trong game (Yếu hơn loài có cơ sở truyền thuyết cùng bậc)' }, '🌱 Biến Sinh')
    ) : null;
    const beastVal = h('span', {},
      s.beast || 'Yêu thú',
      mythBadge,
      (s.flags.pendingBeastBranches && s.flags.pendingBeastBranches.length > 0)
        ? [' ', btn('⚡ Chọn đạo lộ', () => showBeastBranchModal(), 'small prime')]
        : null
    );
    out.push(kv('Bản thể', beastVal, s.flags.beastBlood || 'Huyết mạch dị thú Thương Lan. Khi đột phá đại cảnh giới sẽ thoát biến tiến hóa theo phả hệ thượng cổ.'));
  } else {
    out.push(kv('Linh căn', h('span', {}, s.root.els.length ? elTags(s.root.els) : '', ' ', rootLabel().split(' (')[0]), ROOTS[s.root.k].d + (hiddenRootKind(s.root.k) ? (s.flags.thapKnown ? ' Thiên hạ đã biết.' : ' Hiện người đời vẫn tưởng ngươi là phế linh căn.') : '')));
  }
  for (const k of STAT_KEYS) out.push(kv(STATS[k].n, String(stat(k)), STATS[k].d));
  const perks = s.perks.map((p) => PERKS.find((x) => x.id === p)).filter(Boolean);
  if (perks.length) out.push(h('div', { class: 'cp-chips' }, ...perks.map((p) => h('span', { class: 'cp-chip' + (p!.bad ? ' bad' : ''), title: p!.d }, p!.n))));
  // ---- thể chất ----
  out.push(sec('Thể chất'));
  if (isYao()) {
    out.push(h('div', { class: 'cp-card' }, h('div', { class: 'cp-ic body', html: glyphSvg('body', 24, 1.9) }), h('div', {}, h('b', {}, 'Yêu Thú Thể Phách (Cường Hãn)'), h('small', {}, 'Nhục thân dẻo dai bẩm sinh: Khí huyết +40%, thủ +20%, đòn đánh tăng 25% uy lực.'))));
  } else {
    out.push(h('div', { class: 'cp-card' }, h('div', { class: 'cp-ic body', html: glyphSvg('body', 24, 1.9) }), h('div', {}, h('b', {}, b.n), h('small', {}, b.d))));
  }
  // ---- tông môn ----
  if (s.sect) {
    const sc = SECTS[s.sect.id];
    out.push(sec('Tông môn'));
    out.push(h('div', { class: 'cp-card' }, emblem(sc.el, sc.tier, sc.evil), h('div', {}, h('b', {}, sc.n), h('small', {}, `${SECT_TIER[sc.tier]} · ${rankLabel(s.sect.rank, sc, s.g)} · cống hiến ${fmt(s.sect.contrib)}`))));
  }
  // ---- sư phụ ----
  const m = master();
  if (m) {
    out.push(sec('Sư phụ'));
    out.push(h('div', { class: 'cp-card' }, h('div', { class: 'cp-av sm click', title: 'Xem tranh', onclick: () => openPortrait(m.name, npcPic(m), m.g, npcRealm(m), 'quyen', npcPicWanted(m)), html: avatarSvg(m.g, m.r, m.el, 42, npcPortrait(m.g, m.r)) }),
      h('div', {}, h('b', {}, m.name), h('small', {}, `${npcRealm(m)} · ${EL[m.el].n} hệ · ${m.how} · ${relLabel(m.rel)} ${Math.round(m.rel)}`))));
  }
  // ---- công pháp ----
  out.push(sec('Công pháp'));
  const t = s.tech ? TECHS[s.tech] : null;
  if (t) {
    out.push(kv('Đang tu', h('span', {}, t.el.length ? elTags(t.el) : '', ' ', h('b', {}, t.n), ` · ${techGrade(t)}`)));
    out.push(kv('Độ hợp', `${Math.round(techAff() * 100)}% · tốc độ ×${techSpeed(t).toFixed(2)}`));
    out.push(kv('Thuần thục', `${Math.round(s.techM)}%`));
  } else out.push(h('div', { class: 'empty' }, 'Chưa có công pháp — tu luyện cực chậm.'));
  out.push(kv('Tốc độ tu luyện', `${cultRate().toFixed(1)}%/lượt · ${yearsTxt(turnLen())}`, `Linh khí nơi này ×${LOCS[s.loc].qi}`));
  // ---- võ công ----
  const C = kmCalc();
  out.push(sec(`Võ công · ${s.skills.length}`));
  if (!s.skills.length) out.push(h('div', { class: 'empty' }, 'Chưa mang võ công nào. Mang ở Kho đồ › Công pháp & Thuật.'));
  for (const k of s.skills) {
    const sk = SKILLS[k];
    if (!sk) continue;
    const placed = !!C.cells['sk:' + k];
    out.push(h('div', { class: 'cp-row' }, h('div', { class: 'cp-ic', html: skillIconSvg(sk, 32) }),
      h('div', { class: 'cp-rt' }, h('b', {}, sk.n, ' ', h('span', { class: 'pill', style: { color: TIER_C[skEff(k).tier] } }, skGradeOf(k))), h('small', {}, `${skHue(sk)?.n ?? 'Vô hệ'} · ${({ atk: 'Tấn công', multi: 'Liên kích', dot: 'Kéo dài', heal: 'Hồi phục', shield: 'Hộ thể' })[sk.k]} ×${sk.m} · ${skCost(sk)} linh lực · ${skSource(k) ? `từ ${skSource(k)!.n} ×${skSrcMul(k).toFixed(2)} · ` : ''}`, h('span', { class: placed ? 'up' : 'dn' }, placed ? `kinh mạch ×${(C.per['sk:' + k] ?? 1).toFixed(2)}` : 'chưa xếp kinh mạch ×0,85'))),
      btn('Cất', () => act(toggleSkill(k)), 'small')));
  }
  // ---- tâm kinh ----
  out.push(sec(`Tâm kinh · vận hành ${tamActive().length}/${tamSlots()}`));
  if (!tamList().length) out.push(h('div', { class: 'empty' }, 'Chưa lĩnh hội tâm kinh nào. Đổi ở Tàng Kinh Các tông môn.'));
  for (const id of tamList()) {
    const x = TAMPHAP[id];
    const on = tamActive().includes(id);
    out.push(h('div', { class: 'cp-row' }, h('div', { class: 'cp-ic', html: itemArtSvg('tp:' + id, 32, 1, !on)! }),
      h('div', { class: 'cp-rt' }, h('b', {}, x.n), h('small', {}, `${tamGrade(x)} · ${tamEffect(x)}${on ? ' · đang vận hành' : ''}`)),
      btn(on ? 'Ngừng' : 'Vận hành', () => act(toggleTam(id)), 'small' + (on ? '' : ' prime'), { dis: !on && tamActive().length >= tamSlots() })));
  }
  // ---- pháp quyết ----
  out.push(sec(`Pháp quyết · ${pqList().length}`));
  if (!pqList().length) out.push(h('div', { class: 'empty' }, 'Chưa học pháp quyết nào. Tìm ở Tàng Kinh Các hoặc phường thị.'));
  for (const id of pqList()) {
    const x = PHAPQUYET[id];
    out.push(h('div', { class: 'cp-row' }, h('div', { class: 'cp-ic', html: itemArtSvg('fq:' + id, 32)! }), h('div', { class: 'cp-rt' }, h('b', {}, x.n), h('small', {}, `${pqGrade(x)} · ${x.d}`))));
  }
  // ---- chân linh ----
  out.push(sec('Chân linh'));
  const cl = myLinh();
  if (!cl) out.push(h('div', { class: 'empty' }, 'Chưa có. Gặp chân linh ở hoang dã hay di tích để thuần phục hoặc đoạt tinh huyết.'));
  else {
    const d = CHANLINH[cl.id];
    const stageStr = STAGE_NAMES[cl.stage] || 'Trưởng thành';
    const realmStr = `${REALMS[cl.r].n} ${STAGES[cl.st]} (${Math.round(cl.p)}%)`;
    const lifeStr = `Thọ nguyên: ${Math.round(cl.age)}/${cl.maxLife} năm`;
    out.push(h('div', { class: 'cp-row' },
      h('div', { class: 'cp-ic', html: linhIconSvg(d.ic, d.el, 36, 'cl_' + cl.id) }),
      h('div', { class: 'cp-rt' },
        h('b', {}, `${cl.name} [${stageStr}]`),
        h('small', {}, `${realmStr} · ${EL[d.el].n} hệ · ${lifeStr} · gắn bó ${Math.round(cl.bond)}/100 · ${clEffect(d)} · ${d.mount ? `tọa kỵ ${MOUNT_GRADE[d.mount]}: ${mountEffect(d)}${cl.ride ? ' · đang chỉ để cưỡi' : ''}` : 'linh sủng trợ chiến (không phải thú cưỡi)'}`),
      ),
      h('div', { class: 'acts', style: { display: 'flex', gap: '4px' } },
        btn('Nuôi dưỡng', openFeedModal, 'small prime', { title: 'Cho ăn linh thảo, yêu đan, tinh huyết để tăng tu vi và trưởng thành' }),
        btn('Thả đi', () => askConfirm(`Thả ${cl.name} về rừng? Chân linh đã đi sẽ không quay lại.`, () => act(releaseLinh()), { title: 'Thả chân linh', ok: 'Thả đi' }), 'small ghost'),
      ),
    ));
  }
  // ---- kỹ nghệ ----
  out.push(sec('Kỹ nghệ'));
  const craftLv = (lv: number) => (lv <= 0 ? 'Chưa học' : TIER_N[Math.min(6, lv - 1)]);
  const nRec = (pre: 'alch' | 'talis') => s.recipes.filter((r) => (pre === 'alch' ? PILLS[r] : TALIS[r])).length;
  out.push(kv('Đan thuật', `${craftLv(s.craft.alch)}${s.craft.alch ? ` · cấp ${s.craft.alch}` : ''} · biết ${nRec('alch')} đan phương`));
  out.push(kv('Phù thuật', `${craftLv(s.craft.talis)}${s.craft.talis ? ` · cấp ${s.craft.talis}` : ''} · biết ${nRec('talis')} phù phương`));
  out.push(kv('Luyện khí thuật', `${craftLv(s.craft.forge)}${s.craft.forge ? ` · cấp ${s.craft.forge}` : ''}`));
  // ---- thành tựu ----
  const got = ACH.filter((a) => { try { return a.ok(); } catch { return false; } });
  out.push(sec(`Thành tựu · ${got.length}`));
  out.push(got.length ? h('div', { class: 'cp-chips' }, ...got.map((a) => h('span', { class: 'cp-chip', title: a.d }, `${a.n} +${a.pts}`))) : h('div', { class: 'empty' }, 'Chưa có.'));
  // ---- tùy chọn ----
  out.push(sec('Tùy chọn chiến đấu'));
  out.push(h('label', { class: 'small', style: { display: 'block' } }, h('input', { type: 'checkbox', checked: !!s.flags.autoFight, onchange: (e: Event) => { s.flags.autoFight = (e.target as HTMLInputElement).checked; } }), ' Tự động đánh mọi trận (không mở màn đánh tay)'));
  out.push(h('div', { class: 'small' }, 'Tự bỏ chạy khi khí huyết dưới (tự động đánh) ', h('select', { onchange: (e: Event) => { s.flags.fleeAt = Number((e.target as HTMLSelectElement).value); } },
    ...[0, 0.1, 0.2, 0.3, 0.45].map((v) => h('option', { value: v, selected: Math.abs((s.flags.fleeAt ?? 0.3) - v) < 0.01 }, v ? Math.round(v * 100) + '%' : 'Không bao giờ'))), '.'));
  return out;
}

// ---------- Kho đồ ----------
/** Ô Tọa kỵ trong tab Trang bị: chân linh đang theo ngươi, phẩm tọa kỵ, tốc độ, xuất chiến hay chỉ để cưỡi. */
function mountSlot(act: (m: string) => void): HTMLElement {
  const cl = myLinh();
  const d = cl ? CHANLINH[cl.id] : null;
  if (!cl || !d) return h('div', { class: 'slot' }, h('div', { class: 'ic', html: glyphSvg('paw', 18) }), h('div', { class: 'nm', style: { flex: '1' } }, h('span', { class: 'muted' }, 'Tọa kỵ: trống — thuần phục chân linh ở hoang dã để làm tọa kỵ')));
  return h('div', { class: 'slot' }, h('div', { class: 'ic ic-svg', html: linhIconSvg(d.ic, d.el, 30, 'cl_' + cl.id) }),
    h('div', { class: 'nm', style: { flex: '1' } }, h('b', {}, `${cl.name}`), h('div', { class: 'small muted' }, d.mount ? `Tọa kỵ ${MOUNT_GRADE[d.mount]} · ${mountEffect(d)} · ${cl.ride ? 'chỉ để cưỡi' : 'đang xuất chiến'}` : 'Linh sủng hộ pháp · xuất chiến cùng chủ nhân')),
    d.mount ? btn(cl.ride ? 'Cho xuất chiến' : 'Chỉ cưỡi', () => act(toggleLinhRide(MAX_ACTIVE, activeCount())), 'small') : null);
}
function bagPanel(): HTMLElement[] {
  const out: HTMLElement[] = [tabsEl('bag', ['Trang bị', `Túi (${bagUsed()}/${bagCap()})`, 'Công pháp & Thuật'])];
  const tab = open.get('bag')!.tab;
  const act = (m: string) => { if (m) toast(m); refresh(); };
  if (tab === 0) {
    for (let i = 0; i < SLOTS.length; i++) {
      const g = s.gear[i];
      out.push(h('div', { class: 'slot' }, g ? h('div', { class: 'ic ic-svg', html: gearArtSvg(g, 30) }) : h('div', { class: 'ic', html: glyphSvg(SLOT_GLYPH[i], 18) }),
        h('div', { class: 'nm', style: { flex: '1' } }, g ? [h('b', {}, g.n), h('div', { class: 'small muted' }, `${gearLabel(g)} · ${REALMS[g.lv].n}${g.el ? ' · ' + EL[g.el].n : ''} · ${gearLine(g)}`)] : h('span', { class: 'muted' }, SLOTS[i] + ': trống')),
        g && canUpgradeChaosSword(g) ? repairBtn(g, act) : null,
        g ? btn('Tháo', () => act(unequip(i)), 'small') : null));
    }
    out.push(mountSlot(act));
    out.push(h('h4', {}, 'Trang bị trong túi'));
    if (s.refining) {
      const g = s.gearBag.find((x) => x.uid === s.refining!.uid);
      if (g) out.push(h('div', { class: 'small' }, `Đang luyện hóa ${g.n}: còn ${yearsTxt(Math.max(0, s.refining.left))}`, bar((1 - s.refining.left / REFINE_Y[g.g]) * 100)));
    }
    if (!s.gearBag.length) out.push(h('div', { class: 'empty' }, 'Không có.'));
    for (const g of s.gearBag) {
      out.push(h('div', { class: 'item' }, h('div', { class: 'ic ic-svg', html: gearArtSvg(g, 30) }),
        h('div', { class: 'nm' }, g.n, h('small', {}, `${SLOTS[g.slot]} · ${gearLabel(g)} · ${REALMS[g.lv].n}${g.el ? ' · ' + EL[g.el].n : ''} · ${gearLine(g)}${g.refined ? '' : ' · chưa luyện hóa'}`)),
        h('div', { class: 'acts' },
          canUpgradeChaosSword(g) ? repairBtn(g, act) : null,
          g.refined ? btn('Mang', () => act(equip(g.uid)), 'small') : btn('Luyện hóa', () => act(startRefine(g.uid)), 'small', { dis: !!s.refining, title: `Mất ${yearsTxt(REFINE_Y[g.g])}` }),
          !g.grow && !/ngọc bội/i.test(g.n) ? btn('Vứt', () => askConfirm(`Vứt ${g.n}?`, () => act(discardGear(g.uid)), { title: 'Vứt pháp bảo', ok: 'Vứt', danger: true }), 'small ghost') : null)));
    }
  } else if (tab === 1) {
    sortBag();
    out.push(h('div', { class: 'small muted' }, `Linh thạch: ${fmt(s.money)}`));
    if (!s.bag.length) out.push(h('div', { class: 'empty' }, 'Túi trống.'));
    const list = h('div', { class: 'list' });
    for (const b of s.bag) {
      const [k, key] = b.id.split(':');
      const acts: HTMLElement[] = [];
      if (k === 'p' && PILLS[key]?.k !== 'break') acts.push(btn('Dùng', () => act(usePill(key, b.g ?? 1)), 'small'));
      if (k === 'x' && SPECIALS[key]?.use) acts.push(btn(SPECIALS[key].use!.split(' (')[0], () => act(useSpecial(key)), 'small'));
      if (k === 'sk') acts.push(btn('Học', () => act(readScroll(b.id, true)), 'small'));
      if (k === 'tp' || k === 'fq') acts.push(btn('Lĩnh ngộ', () => act(readScroll(b.id, true)), 'small'));
      if (k === 'cp') acts.push(btn('Tu luyện', () => confirmTech(key), 'small'));
      if (b.id !== 'x:ngocboidoi') acts.push(btn('Vứt', () => askConfirm(`Vứt ${itemName(b.id, b.g)}?`, () => act(discard(b.id, b.g)), { title: 'Vứt vật phẩm', ok: 'Vứt', danger: true }), 'small ghost'));
      list.append(h('div', { class: 'item' }, icon(b.id, b.g), h('div', { class: 'nm' }, `${itemName(b.id, b.g)}${b.n > 1 ? ' ×' + b.n : ''}`, h('small', {}, itemDesc(b.id))), h('div', { class: 'acts' }, ...acts)));
    }
    out.push(list);
  } else if (tab === 2) {
    const t = s.tech ? TECHS[s.tech] : null;
    out.push(h('h4', {}, 'Công pháp chủ tu'));
    out.push(t ? h('div', { class: 'item' }, icon('cp:' + t.id), h('div', { class: 'nm' }, `${t.n} `, h('span', { class: 'pill', style: { color: TIER_C[t.tier] } }, techGrade(t)), h('small', {}, `${t.d} Hệ: ${t.el.length ? t.el.map((e) => EL[e].n).join(', ') : 'vô thuộc tính'} · hợp ${Math.round(techAff() * 100)}% · thuần thục ${Math.round(s.techM)}%`)))
      : h('div', { class: 'empty' }, 'Chưa có công pháp.'));
    out.push(h('h4', {}, `Tâm kinh đã lĩnh hội (${tamList().length}) — vận hành ở trang Nhân vật`));
    out.push(tamList().length ? h('div', { class: 'list' }, ...tamList().map((id) => { const x = TAMPHAP[id]; return h('div', { class: 'item' }, h('div', { class: 'ic ic-svg', html: itemArtSvg('tp:' + id, 30)! }), h('div', { class: 'nm' }, `${x.n} `, h('span', { class: 'pill', style: { color: TIER_C[x.tier] } }, tamGrade(x)), h('small', {}, tamEffect(x)))); })) : h('div', { class: 'empty' }, 'Chưa lĩnh hội tâm kinh nào. Đổi ở Tàng Kinh Các hoặc tìm trong kỳ ngộ.'));
    out.push(h('h4', {}, `Thuật pháp mang theo (${s.skills.length}) — chiêu nào xếp được vào kinh mạch thì mang được`));
    const list = h('div', { class: 'list' });
    for (const k of knownByGrade()) {
      const sk = SKILLS[k];
      const on = s.skills.includes(k);
      list.append(h('div', { class: 'item' }, h('div', { class: 'ic ic-svg', html: skillIconSvg(sk, 30) }),
        h('div', { class: 'nm' }, `${sk.n} `, h('span', { class: 'pill', style: { color: TIER_C[skEff(k).tier] } }, skGradeOf(k)), h('small', {}, `${skSource(k) ? `Truyền từ ${skSource(k)!.n}. ` : ''}${sk.d} · ${({ atk: 'Tấn công', multi: 'Liên kích', dot: 'Kéo dài', heal: 'Hồi phục', shield: 'Hộ thể' })[sk.k]} ×${sk.m} · ${skCost(sk)} linh lực`)),
        h('div', { class: 'acts' },
          btn(on ? 'Gỡ' : 'Mang', () => act(toggleSkill(k)), 'small' + (on ? '' : ' prime'), { title: on ? 'Gỡ khỏi kinh mạch, vẫn nhớ chiêu' : 'Xếp vào kinh mạch để dùng khi đánh' }),
          btn('Cất', () => confirmStow(k, act), 'small ghost', { title: 'Chép lại thành thuật thư, cất vào túi' }))));
    }
    if (!s.known.length) list.append(h('div', { class: 'empty' }, 'Chưa biết thuật pháp nào.'));
    out.push(list);
  }
  return out;
}
/** Nút sửa Hỗn Độn Kiếm (Tàn khuyết): cần Hỗn Độn Thạch trong túi. */
function repairBtn(g: Gear, act: (m: string) => void) {
  if (isChaosBroken(g)) {
    const atCap = g.g >= 11 && (g.q ?? 0) >= 3;
    const hasStone = count('m:hondonthach') > 0;
    const ok = atCap && hasStone;
    const title = !atCap
      ? 'Cần trưởng thành tới Hỗn Độn Linh Bảo cực phẩm mới có thể dùng Hỗn Độn Thạch'
      : hasStone ? 'Dùng một Hỗn Độn Thạch để thăng lên Hỗn Độn Chí Bảo hạ phẩm' : 'Cần Hỗn Độn Thạch, chỉ tìm được ở Hỗn Độn giới';
    return btn('Sửa', () => act(repairChaosSword(g.uid)), 'small prime', { dis: !ok, title });
  }
  const q = g.q ?? 0;
  const matKey = CHAOS_FORGE_MATS[q];
  const matName = MATS[matKey]?.n || matKey;
  const ok = count('m:' + matKey) > 0;
  return btn('Rèn', () => act(repairChaosSword(g.uid)), 'small prime', {
    dis: !ok,
    title: ok ? `Dùng ${matName} để rèn ${g.n} lên phẩm kế tiếp` : `Cần ${matName} (nguyên liệu luyện khí cấp bậc Hỗn Độn ở Hỗn Độn giới)`,
  });
}
/** Dòng phẩm chất các cảnh giới đã đột phá: "Cực phẩm Trúc Cơ · Trung phẩm Kết Đan · … (khí huyết +x%, công phạt +y%)". */
function phamLine(): HTMLElement | null {
  const parts: HTMLElement[] = [];
  // phẩm Trúc Cơ không lặp lại ở đây: dòng đạo cơ phía trên đã là nó
  for (const [r, g] of Object.entries(phams()).sort((a, b) => Number(a[0]) - Number(b[0]))) if (Number(r) <= s.r) parts.push(h('a', { class: 'pham p' + g, href: '#', onclick: (e: Event) => { e.preventDefault(); openPhamInfo(Number(r)); } }, `${PHAM_N[g as number]} ${REALMS[Number(r)].n}`));
  const nr = s.r + 1;
  if (nr >= 2 && nr <= REALMS.length - 1 && s.r >= 1) parts.push(h('a', { class: 'pham next', href: '#', title: 'Xem trước tỉ lệ ra từng phẩm khi đột phá cảnh giới kế tiếp', onclick: (e: Event) => { e.preventDefault(); openPhamInfo(nr); } }, `Xem trước phẩm ${REALMS[nr].n} ▸`));
  if (!parts.length) return null;
  const sum = phamSum();
  const out = h('div', { class: 'cp-pham' });
  parts.forEach((p, i) => out.append(i ? ' · ' : '', p));
  if (sum.hp || sum.atk) out.append(h('span', { class: 'muted' }, ` (khí huyết +${sum.hp}%, công phạt +${sum.atk}%, tu luyện +${sum.cult}%, thọ +${fmt(sum.life)} năm${sum.brk ? `, đột phá ${sum.brk > 0 ? '+' : ''}${Math.round(sum.brk * 100)}%` : ''})`));
  return out;
}
/** Bảng phẩm của một cảnh giới: hiệu quả từng phẩm và tỉ lệ ra phẩm đó với căn cơ hiện tại (cột nhỏ: khi có đan). */
function openPhamInfo(r: number) {
  const have = r === 2 ? (s.r >= 2 ? s.flags.daoCo : undefined) : phams()[r];
  const p0 = phamProbs(r, false), p1 = phamProbs(r, true);
  const pc = (v: number) => `${Math.round(v * 100)}%`;
  const eff = (g: number) => r === 2
    ? (g === 1 ? 'Căn cơ bình thường' : `tu luyện ×${DAO_CO[g].cult}, chiến lực ×${DAO_CO[g].pow}, đột phá ${DAO_CO[g].brk >= 0 ? '+' : ''}${Math.round(DAO_CO[g].brk * 100)}%`)
    : (g === 0 ? 'Căn cơ bình thường' : `khí huyết +${PHAM_BONUS[g].hp}%, công phạt +${PHAM_BONUS[g].atk}%, tu luyện +${PHAM_BONUS[g].cult}%, thọ +${fmt(Math.round(REALMS[r].life * PHAM_BONUS[g].life))} năm`);
  const rows = PHAM_N.map((n, g) => h('tr', { class: have === g ? 'cur' : '' },
    h('td', { class: 'pham p' + g }, n, have === g ? ' ◀' : ''),
    h('td', {}, eff(g)),
    h('td', { class: 'num' }, pc(p0[g]), h('small', {}, pc(p1[g])))));
  openModal(r === 2 ? 'Phẩm đạo cơ' : `Phẩm căn cơ ${REALMS[r].n}`, [
    h('div', { class: 'small muted' }, `Ngưng tụ khi đột phá lên ${REALMS[r].n}${have !== undefined ? ' · ngươi có' : ' · chưa đột phá'}`),
    have !== undefined ? h('div', { class: 'pham-cur pham p' + have }, `${PHAM_N[have]} ${REALMS[r].n}`) : null,
    h('p', { class: 'small' }, `Đột phá thành công lên ${REALMS[r].n} sẽ ngưng tụ ${r === 2 ? 'đạo cơ' : 'căn cơ'} theo một trong năm phẩm. Phẩm càng cao khí huyết, công phạt, tốc độ tu luyện và thọ nguyên càng tăng; phẩm của mọi đại cảnh giới cộng dồn với nhau.`),
    h('table', { class: 'pham-tbl' }, h('thead', {}, h('tr', {}, h('th', {}, 'Phẩm'), h('th', {}, 'Hiệu quả'), h('th', { class: 'num' }, 'Tỉ lệ', h('small', {}, 'có đan')))), h('tbody', {}, ...rows)),
    h('p', { class: 'small muted' }, 'Tỉ lệ tính theo căn cơ hiện tại của ngươi; cột nhỏ là khi uống đan đột phá đúng loại. Tâm cảnh, ngộ tính, độ thuần thục công pháp, đan phẩm cao và cảnh giới trước đạt Cực/Hoàn mỹ giúp phẩm cao hơn; thương thế và tâm ma làm phẩm thấp đi. Hỗn Độn Đạo Thai luôn Hoàn mỹ.'),
  ].filter(Boolean) as HTMLElement[]);
}
function confirmTech(key: string) {
  const perm = checkArtRacePermission('cp:' + key);
  if (!perm.ok) {
    showScene({
      title: 'Không thể chuyển tu',
      text: perm.reason || 'Công pháp này không phù hợp với chủng tộc của ngươi.',
      choices: [{ t: 'Đã hiểu', fn: () => 'Ngươi cất bí kíp lại.' }],
    });
    return;
  }
  const t = TECHS[key];
  const cur = s.tech ? TECHS[s.tech] : null;
  showScene({
    title: `Chuyển tu ${t.n}?`,
    text: `${t.d}\n\n${techGrade(t)} · hệ ${t.el.length ? t.el.map((e) => EL[e].n).join(', ') : 'vô thuộc tính'} · độ hợp với linh căn ngươi: ${Math.round(techAff(key) * 100)}%.${cur ? `\nCông pháp hiện tại: ${cur.n} (${techGrade(cur)}, hợp ${Math.round(techAff() * 100)}%). Chuyển tu sẽ mất phần lớn độ thuần thục.` : ''}${t.evil ? '\n\nĐây là ma công: tu nhanh nhưng dễ sinh tâm ma, chính đạo khinh rẻ.' : ''}`,
    choices: [
      { t: 'Chuyển tu', cls: 'prime', fn: () => readScroll('cp:' + key, true) },
      { t: 'Thôi', fn: () => 'Ngươi cất bí kíp lại.' },
    ],
  });
}

// ---------- Nhân mạch ----------
export const TAG_N: Record<string, string> = { friend: 'Bằng hữu', enemy: 'Kẻ thù', master: 'Sư phụ', disciple: 'Đồ đệ', daolu: 'Đạo lữ', rival: 'Đối thủ', kin: 'Người thân', acq: 'Quen biết', senior: 'Đồng môn', peer: 'Đồng đạo' };
function relPanel(): HTMLElement[] {
  const out: HTMLElement[] = [tabsEl('rel', ['Còn sống', 'Đã mất'])];
  const tab = open.get('rel')!.tab;
  const alive = tab === 0;
  const list = h('div', { class: 'list' });
  const order = ['daolu', 'master', 'kin', 'disciple', 'friend', 'senior', 'peer', 'rival', 'enemy', 'acq'];
  const ns = s.npcs.filter((n) => n.alive === alive).sort((a, b) => order.indexOf(a.tag) - order.indexOf(b.tag) || b.rel - a.rel);
  if (!ns.length) list.append(h('div', { class: 'empty' }, alive ? 'Ngươi chưa quen ai.' : 'Chưa ai qua đời.'));
  for (const n of ns) list.append(relRow(n));
  out.push(list);
  return out;
}
/** Đồng hành có đội xuất trận và danh sách đồ đệ riêng. */
function companionPanel(): HTMLElement[] {
  const disciples = s.npcs.filter(n => n.tag === 'disciple');
  const tabs = tabsEl('party', [`Đội hình ${activeCount()}/${MAX_ACTIVE}`, `Đồ đệ ${disciples.filter(n => n.alive).length}`]);
  return [tabs, ...(open.get('party')!.tab === 1 ? disciplePanel(disciples) : partyPanel())];
}
function chooseSongTu() {
  const selected = new Set<string>();
  const body = h('div', {});
  const inputs: { id: string; input: HTMLInputElement; disabled: boolean }[] = [];

  const start = btn('Song tu (0)', () => {
    const ids = [...selected];
    closeModal();
    showScene({ title: 'Song tu', text: 'Cùng đạo lữ điều hòa linh khí, nhập định tu luyện.', choices: [
      { t: 'Bắt đầu song tu', cls: 'prime', fn: () => songTuWith(ids) },
      { t: 'Thôi', fn: () => 'Ngươi quyết định để dịp khác.' },
    ] });
  }, 'prime', { dis: true });

  const toggleSelectAll = () => {
    const available = inputs.filter(x => !x.disabled);
    if (available.length === 0) return;
    const allSelected = available.every(x => selected.has(x.id));
    if (allSelected) {
      for (const x of available) {
        x.input.checked = false;
        selected.delete(x.id);
      }
    } else {
      for (const x of available) {
        x.input.checked = true;
        selected.add(x.id);
      }
    }
    updateState();
  };

  const selectAllTop = btn('Chọn hết', toggleSelectAll, 'small');
  const selectAllBottom = btn('Chọn hết', toggleSelectAll, 'small');

  const updateState = () => {
    start.disabled = selected.size === 0;
    start.textContent = `Song tu (${selected.size})`;
    const available = inputs.filter(x => !x.disabled);
    const text = (available.length > 0 && available.every(x => selected.has(x.id))) ? 'Bỏ chọn' : 'Chọn hết';
    const dis = available.length === 0;
    selectAllTop.textContent = text;
    selectAllTop.disabled = dis;
    selectAllBottom.textContent = text;
    selectAllBottom.disabled = dis;
  };

  const topRow = h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } },
    h('p', { style: { margin: 0 } }, 'Chọn một hoặc nhiều đạo lữ cùng tu luyện.'),
    selectAllTop,
  );
  body.append(topRow);

  const listDiv = h('div', { class: 'list', style: { maxHeight: '360px', overflowY: 'auto', marginBottom: '12px' } });

  for (const n of s.npcs.filter(n => n.alive && n.tag === 'daolu')) {
    const eligible = npcActions(n.id).find(c => c.t === 'Song tu');
    const disabled = !eligible || !!eligible.dis;
    const input = h('input', { type: 'checkbox', disabled, onchange: () => {
      if (input.checked) selected.add(n.id); else selected.delete(n.id);
      updateState();
    } });
    inputs.push({ id: n.id, input, disabled });
    listDiv.append(h('label', { class: 'item' }, input, h('span', {}, n.name + ' · ' + daoluTitle(n) + (disabled ? ' · Chưa đủ điều kiện hoặc cần chờ sang năm' : ''))));
  }
  body.append(listDiv);

  const foot = h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
    start,
    selectAllBottom,
  );
  body.append(foot);

  updateState();
  openModal('Chọn đạo lữ song tu', body);
}
/** Đạo lữ chia theo vai vế; người đã mất được giữ riêng để tưởng nhớ. */
function daoluPanel(): HTMLElement[] {
  const spouses = s.npcs.filter(n => n.tag === 'daolu');
  const out: HTMLElement[] = [];
  out.push(btn('Song tu', () => chooseSongTu(), 'prime', { dis: !spouses.some(n => n.alive) }));
  const groups = [
    { title: 'Chính thất', people: spouses.filter(n => n.alive && isPrimaryDaolu(n)), empty: 'Chưa có chính thất.' },
    { title: 'Thê thiếp', people: spouses.filter(n => n.alive && !isPrimaryDaolu(n)), empty: 'Chưa có thê thiếp.' },
    { title: 'Đã mất', people: spouses.filter(n => !n.alive), empty: '' },
  ];
  for (const group of groups) {
    if (!group.people.length && !group.empty) continue;
    out.push(h('h4', {}, `${group.title} (${group.people.length})`));
    const list = h('div', { class: 'list' });
    for (const n of group.people.sort((a, b) => b.rel - a.rel)) list.append(relRow(n));
    if (!group.people.length) list.append(h('div', { class: 'empty' }, group.empty));
    out.push(list);
  }
  return out;
}
/** Một dòng người trong Nhân mạch: chân dung, danh xưng, lai lịch; còn sống thì có nút Gặp / Mời đồng hành. */
function relRow(n: NPC): HTMLElement {
  const alive = n.alive;
  const c = n.rel >= 40 ? '#4f7a55' : n.rel <= -40 ? '#9b2a1f' : '#6e6253';
  return h('div', { class: 'item' }, h('div', { class: 'ic ic-svg rel-av click', style: { borderColor: c, color: c }, title: 'Xem tranh',     onclick: () => openPortrait(n.name, npcPic(n), n.g, `${npcRealm(n)} · ${npcTagName(n)}`, 'quyen', npcPicWanted(n), n.id), html: avatarSvg(n.g, n.r, n.el, 34, npcPic(n)) }),
    h('div', { class: 'nm' }, h('b', {}, n.name), ' ', h('span', { class: 'pill', style: { color: c } }, npcTagName(n)),
      h('small', {}, alive ? `${npcRealm(n)} · ${npcAge(n)} tuổi · ${relLabel(n.rel)} (${Math.round(n.rel)}) · ${n.trait}${n.sect ? ' · ' + SECTS[n.sect]?.n : ''}${n.how ? ' · ' + n.how : ''}${n.bio ? ` · ${n.bio.root} · ${n.bio.body} · thiên phú ${n.bio.perk}, Khuynh quốc khuynh thành` : ''}` : `${npcRealm(n)} · ${n.cause || 'qua đời'} năm ${Math.floor(n.died || 0)}${n.how ? ' · ' + n.how : ''}`)),
    alive ? h('div', { class: 'acts' }, btn('Gặp', () => meetNpc(n.id), 'small'),
      canInvite(n) === null ? btn('Mời đồng hành', () => { toast(invite(n.id)); refresh(); }, 'small prime', { title: 'Mời đi theo cùng ngươi; vào đội dự bị, xếp xuất trận ở Đồng hành › Đội hình' }) : null) : null);
}
/** Tab Đồ đệ: đồ đệ còn sống (cảnh giới cao trước), rồi đồ đệ đã mất. */
function disciplePanel(all: NPC[]): HTMLElement[] {
  const live = all.filter((n) => n.alive).sort((a, b) => b.r - a.r || b.st - a.st || b.rel - a.rel);
  const dead = all.filter((n) => !n.alive);
  const out: HTMLElement[] = [h('div', { class: 'small muted' }, 'Người ngươi đã nhận làm đồ đệ. Đồ đệ luôn nhận lời đi theo làm đồng hành.')];
  const list = h('div', { class: 'list' });
  for (const n of live) list.append(relRow(n));
  if (!live.length) list.append(h('div', { class: 'empty' }, 'Ngươi chưa nhận đồ đệ nào.'));
  out.push(list);
  if (dead.length) {
    out.push(h('h4', {}, `Đã mất (${dead.length})`));
    const dl = h('div', { class: 'list' });
    for (const n of dead) dl.append(relRow(n));
    out.push(dl);
  }
  return out;
}
/** Tab Đồng hành: chân linh (luôn xuất trận), đội xuất trận (tối đa 9) và dự bị. */
function partyPanel(): HTMLElement[] {
  const out: HTMLElement[] = [];
  const act = (m: string) => { if (m) toast(m); refresh(); };
  out.push(h('div', { class: 'small muted' }, `Đồng hành tự đánh trong trận; ngươi chỉ điều khiển chính mình. Xuất trận tối đa ${MAX_ACTIVE} (chân linh tính một suất), dự bị không giới hạn. Trận sinh tử đồng hành có thể chết; khi sắp gục ngươi được chọn cho chạy trốn hay cử người đỡ đòn.`));
  const list = h('div', { class: 'list' });
  const cl = linhOf();
  out.push(h('h4', {}, `Xuất trận (${activeCount()}/${MAX_ACTIVE})`));
  const fights = !!cl && !cl.ride;
  const clRow = () => {
    const stageStr = cl?.stage ? ` [${STAGE_NAMES[cl.stage]}]` : '';
    const realmStr = cl ? ` · ${REALMS[cl.r].n} ${STAGES[cl.st]} (${Math.round(cl.p)}%)` : '';
    const lifeStr = cl ? ` · thọ ${Math.round(cl.age)}/${cl.maxLife} năm` : '';
    return h('div', { class: 'item' },
      h('div', { class: 'ic rel-av linh-av', html: glyphSvg('paw', 20) }),
      h('div', { class: 'nm' },
        h('b', {}, `${cl!.name}${stageStr}`),
        h('small', {}, `Tọa kỵ ${MOUNT_GRADE[CHANLINH[cl!.id]?.mount ?? 1]}${realmStr}${lifeStr} · ${fights ? 'xuất chiến' : 'chỉ để cưỡi'} · gắn bó ${Math.round(cl!.bond)}`),
      ),
      h('div', { class: 'acts', style: { display: 'flex', gap: '4px' } },
        btn('Nuôi', openFeedModal, 'small', { title: 'Cho ăn thiên tài địa bảo' }),
        btn(fights ? 'Chỉ cưỡi' : 'Xuất chiến', () => act(toggleLinhRide(MAX_ACTIVE, activeCount())), 'small' + (fights ? '' : ' prime'), { dis: !fights && activeCount() >= MAX_ACTIVE }),
      ),
    );
  };
  if (fights) list.append(clRow());
  for (const n of activeNpcs()) list.append(npcRow(n, [btn('Gặp', () => meetNpc(n.id), 'small'), btn('Chi tiết', () => openCompanion(n.id), 'small prime'), btn('Dự bị', () => act(setActive(n.id, false)), 'small'), btn('Cho về', () => act(dismiss(n.id)), 'small ghost')]));
  const hurt = party().active.map((id) => s.npcs.find((x) => x.id === id)).filter((n) => n && n.alive && n.injuredUntil && s.year < n.injuredUntil) as NPC[];
  for (const n of hurt) list.append(npcRow(n, [btn('Gặp', () => meetNpc(n.id), 'small'), btn('Chi tiết', () => openCompanion(n.id), 'small prime'), btn('Cho về', () => act(dismiss(n.id)), 'small ghost')], `Trọng thương, nghỉ tới ${Math.ceil(n.injuredUntil! - s.born)} tuổi (tặng đan hồi phục để lành ngay)`));
  if (!fights && !activeNpcs().length && !hurt.length) list.append(h('div', { class: 'empty' }, 'Chưa ai xuất trận.'));
  out.push(list);
  out.push(h('h4', {}, `Dự bị (${reserveNpcs().length})`));
  const res = h('div', { class: 'list' });
  if (cl && !fights) res.append(clRow()); // tọa kỵ chỉ để cưỡi: nằm ở dự bị, bấm Xuất chiến để vào đội
  for (const n of reserveNpcs()) res.append(npcRow(n, [btn('Gặp', () => meetNpc(n.id), 'small'), btn('Chi tiết', () => openCompanion(n.id), 'small'), btn('Xuất trận', () => act(setActive(n.id, true)), 'small prime', { dis: activeCount() >= MAX_ACTIVE }), btn('Cho về', () => act(dismiss(n.id)), 'small ghost')]));
  if (!reserveNpcs().length) res.append(h('div', { class: 'empty' }, 'Chưa có. Mời ở Nhân mạch hoặc Đạo lữ: đạo lữ, đệ tử, hôn thê luôn nhận lời; người khác cần thiện cảm từ 60.'));
  out.push(res);
  return out;
}
/** Nhãn tư chất theo tốc độ tu luyện. */
const talentLabel = (t: number) => (t >= 1.9 ? 'Tuyệt thế' : t >= 1.7 ? 'Thiên kiêu' : t >= 1.5 ? 'Xuất chúng' : t >= 1.1 ? 'Hơn người' : 'Bình thường');
/** Bảng một đồng hành: sức mạnh, công pháp, chiêu, trang bị, và tặng đồ (đan, sách, bí kíp, pháp khí). */
function openCompanion(id: string) {
  const n = s.npcs.find((x) => x.id === id);
  if (!n) return;
  if (!n.kit) outfit(n);
  exileMigrate();
  const ex = exiles()[n.id]; // đã bị trục xuất: gia thế gắn với tông cũ, không ghép tên tông đang ở
  const K = kit(n);
  const draw = () => {
    const ks = kitSum(n);
    const base = npcPow(n.r, n.st) * compMul(n);
    const atk = Math.round(base) + ks.atk, def = Math.round(base * 0.35) + ks.def, hp = Math.round(base * 8) + ks.hp;
    const tech = K.tech ? TECHS[K.tech] : null;
    const body: HTMLElement[] = [
      h('div', { class: 'cp-head' }, h('div', { class: 'cp-av click', title: 'Xem tranh toàn thân', onclick: () => openPortrait(n.name, npcPic(n), n.g, npcRealm(n), 'quyen', npcPicWanted(n), n.id), html: avatarSvg(n.g, n.r, n.el, 58, npcPic(n)) }),
        h('div', { style: { flex: '1' } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            h('div', { class: 'cp-name' }, n.name),
            btn('Gặp mặt', () => { closeModal(); meetNpc(n.id); }, 'small prime'),
          ),
          h('div', { class: 'cp-realm' }, `${npcRealm(n)} · ${EL[n.el].n} hệ · ${npcAge(n)} tuổi · ${npcTagName(n)} · ${relLabel(n.rel)} (${Math.round(n.rel)})`),
          h('div', { class: 'small muted' }, n.how || ''))),
      sec('Hồ sơ'),
      kv('Gia thế', ex ? (n.bio?.family || `Xuất thân ${SECTS[ex.from]?.n ?? ''}`) : n.bio?.family ? `${n.sect && SECTS[n.sect] ? SECTS[n.sect].n + ' · ' : ''}${n.bio.family}` : n.sect && SECTS[n.sect] ? SECTS[n.sect].n : n.how || '—'),
      n.bio ? kv('Ngoại hình', n.bio.look) : null,
      kv('Tính cách', n.bio?.traits ?? n.trait),
      n.bio?.hobby ? kv('Sở thích', n.bio.hobby) : null,
      kv('Linh căn', n.bio?.root ?? `${EL[n.el].n} hệ`),
      n.bio ? kv('Thể chất', `${n.bio.body}${bioDesc(n.bio, 'body') ? ' — ' + bioDesc(n.bio, 'body') : ''}`) : null,
      n.bio ? kv('Thiên phú', `${n.bio.perk}${bioDesc(n.bio, 'perk') ? ' — ' + bioDesc(n.bio, 'perk') : ''}`) : null,
      kv('Tư chất', `${talentLabel(n.talent)} (${n.talent.toFixed(1)})`),
      kv('Cảnh giới', `${npcRealm(n)} · tiến độ ${Math.round(((n as any).p || 0) * 100)}%${n.injuredUntil && s.year < n.injuredUntil ? ' · đang trọng thương' : ''}`),
      sec('Sức mạnh'), kv('Công', fmt(atk)), kv('Thủ', fmt(def)), kv('Khí huyết', fmt(hp)),
      kv('Công pháp', tech ? `${tech.n} (${techGrade(tech)})` : 'Chưa có — tặng bí kíp để tu'),
      kv('Chiêu mang ra trận', kitSkills(n).map((k) => SKILLS[k].n).join(' · ') || 'Chưa học chiêu nào, chỉ dùng đòn thường / chiêu bản năng'),
      K.known.length > 4 ? kv('Chiêu đã học', K.known.map((k) => SKILLS[k]?.n).filter(Boolean).join(', ')) : null,
      sec('Trang bị'),
      ...SLOTS.slice(0, 5).map((sn, i) => { const g = K.gear[i]; return kv(sn, g ? `${g.n} · ${gearLabel(g)} · ${gearLine(g)}` : 'trống'); }),
      sec('Tặng đồ'),
      h('div', { class: 'small muted' }, 'Đồng hành luôn tự phối trang bị, công pháp và chiêu mạnh nhất; pháp khí yếu hơn món đang mang sẽ được trả lại.'),
    ].filter(Boolean) as HTMLElement[];
    const list = h('div', { class: 'list' });
    const act = (m: string) => { if (m) toast(m); refresh(); draw(); };
    for (const g of s.gearBag) list.append(h('div', { class: 'item' }, h('div', { class: 'ic ic-svg', html: gearArtSvg(g, 30) }), h('div', { class: 'nm' }, g.n, h('small', {}, `${SLOTS[g.slot]} · ${gearLabel(g)} · ${gearLine(g)}${g.refined ? '' : ' · chưa luyện hóa'}`)), h('div', { class: 'acts' }, btn('Tặng', () => act(giftGear(id, g.uid)), 'small', { dis: !g.refined || g.lv > n.r + 1, title: !g.refined ? 'Luyện hóa trước rồi mới tặng được' : g.lv > n.r + 1 ? `${n.name} chưa đủ cảnh giới điều khiển` : '' }))));
    for (const b of s.bag) {
      const [k, key] = b.id.split(':');
      const ok = (k === 'p' && ['cult', 'heal', 'life'].includes(PILLS[key]?.k)) || k === 'sk' || k === 'cp';
      if (!ok) continue;
      list.append(h('div', { class: 'item' }, icon(b.id, b.g), h('div', { class: 'nm' }, `${itemName(b.id, b.g)}${b.n > 1 ? ' ×' + b.n : ''}`, h('small', {}, itemDesc(b.id))), h('div', { class: 'acts' }, btn('Tặng', () => act(giftItem(id, b.id, b.g ?? 1)), 'small'))));
    }
    if (!list.children.length) list.append(h('div', { class: 'empty' }, 'Trong túi không có gì tặng được (đan tu luyện / hồi phục / tăng thọ, thuật thư, bí kíp, pháp khí đã luyện hóa).'));
    body.push(list);
    openModal(`Đồng hành · ${n.name}`, h('div', { class: 'comp-sheet' }, ...body), { wide: true, seal: 'companion' });
  };
  draw();
}
function npcRow(n: NPC, acts: (HTMLElement | null)[], note = ''): HTMLElement {
  const c = n.rel >= 40 ? '#4f7a55' : n.rel <= -40 ? '#9b2a1f' : '#6e6253';
  const validActs = acts.filter(Boolean) as HTMLElement[];
  const actsCls = validActs.length >= 3 ? 'acts acts-2col' : 'acts';
  return h('div', { class: 'item' }, h('div', { class: 'ic ic-svg rel-av click', style: { borderColor: c, color: c }, title: 'Xem tranh', onclick: () => openPortrait(n.name, npcPic(n), n.g, npcRealm(n), 'quyen', npcPicWanted(n), n.id), html: avatarSvg(n.g, n.r, n.el, 34, npcPic(n)) }),
    h('div', { class: 'nm' }, h('b', {}, n.name), ' ', h('span', { class: 'pill', style: { color: c } }, npcTagName(n)), h('small', {}, `${npcRealm(n)} · ${npcAge(n)} tuổi · ${relLabel(n.rel)} (${Math.round(n.rel)}) · ${n.trait}`), note ? h('small', { style: { color: 'var(--seal)' } }, note) : null),
    h('div', { class: actsCls }, ...validActs));
}
export function meetNpc(id: string) {
  const n = s.npcs.find((x) => x.id === id)!;
  showScene({
    title: n.name,
    text: `${n.name}, ${npcRealm(n)}, ${npcAge(n)} tuổi, tính tình ${n.trait}. ${relLabel(n.rel)}.${n.how ? '\n' + n.how + '.' : ''}\n\nGặp mặt tốn một tháng.`,
    choices: [...npcActions(id), { t: 'Thôi', fn: () => 'Ngươi gác lại.' }],
  });
}

// ---------- Nhật ký ----------
function logPanel(): HTMLElement[] {
  const out: HTMLElement[] = [tabsEl('log', ['Nhật ký', 'Mốc đời'])];
  const src = open.get('log')!.tab === 0 ? s.log : s.marks;
  const list = h('div', {});
  for (const l of [...src].reverse().slice(0, 200)) list.append(h('div', { class: 'logline ' + (l.k || '') }, h('span', { class: 'y' }, `${Math.floor(l.y - s.born)}t`), l.t));
  if (!src.length) list.append(h('div', { class: 'empty' }, 'Trống.'));
  out.push(list);
  return out;
}

// ---------- Đồ giám ----------
const skTag = (k: Parameters<typeof skHue>[0]) => { const u = skHue(k); return u ? h('span', { class: 'el' + (u.c.length > 1 ? ' multi' : ''), style: { background: hueBg(u.c) } }, u.n) : null; };
const elTag = (e: string) => h('span', { class: 'el', style: { background: EL[e as keyof typeof EL].c } }, EL[e as keyof typeof EL].n);
function emblem(els: string[], tier: number, evil?: boolean) {
  const cols = els.length ? els.map((e) => EL[e as keyof typeof EL].c) : ['#6e6253'];
  const step = 100 / cols.length;
  const grad = cols.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(',');
  return h('div', { class: `emb t${tier}`, style: { background: `conic-gradient(${grad})` } }, h('i', { style: evil ? { background: '#2a241f', color: '#e6d6b0' } : {}, html: glyphSvg(evil ? 'demon' : SECT_GLYPH[tier] || 'gate', 15, 2) }));
}
/** Mục đang mở trong cây Địa danh ('v:<vực>' / 'c:<châu>'). */
const cxOpen = new Set<string>();
const cxBeastOpen = new Set<string>();
/** Nội dung Đồ giám (nay là một nhóm trang trong Thiên Cơ Lâu): linh căn, địa danh, yêu thú, vật phẩm. */
function codexBody(t: 'root' | 'loc' | 'beast' | 'item', query = ''): HTMLElement[] {
  const out: HTMLElement[] = [];
  const c = meta.codex;
  const list = h('div', { class: 'list' });
  const row = (known: boolean, ic: string, col: string, n: string, d: string) => h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: known ? col : '#c9b994' }, html: known ? glyphSvg(ic, 18) : '' }, known ? null : '?'), h('div', { class: 'nm' }, known ? n : '???', h('small', {}, known ? d : 'Chưa khám phá.')));
  if (t === 'root') {
    list.append(h('h4', { class: 'cx-h' }, `${ROOTS.length} loại linh căn`));
    ROOTS.forEach((r, i) => list.append(h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: (['#8a7f70', '#6e6253', '#7d6b4f', '#8a6a3f', '#4f7a55', '#9a7a2e', '#5e4c8a'][i] || (i === 11 ? '#2a241f' : '#7a7062')) }, html: glyphSvg('root', 18) }),
      h('div', { class: 'nm' }, h('b', {}, r.n), s?.root.k === i ? h('span', { class: 'mine-tag' }, ' · của ngươi') : null, h('small', {}, `${r.d} Tốc độ tu ×${r.m}${i === 6 ? ' · Băng/Lôi/Phong thường gặp, Ám/Quang hiếm' : ''}`)))));
    list.append(h('h4', { class: 'cx-h' }, 'Mười hệ thuộc tính'));
    for (const e of ALL_EL) {
      const k = khacOf(e);
      const bi = ALL_EL.filter((x) => khacOf(x).includes(e));
      const techN = worldDefinitions('cp').filter((x) => !x.blood && x.el.includes(e)).length;
      list.append(h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: EL[e].c }, html: glyphSvg(e, 18) }),
        h('div', { class: 'nm' }, h('b', {}, EL[e].n), VARIANT_EL.includes(e) ? h('span', { class: 'muted small' }, ' · biến dị') : null,
          h('small', {}, 'Khắc: ', ...k.map(elTag), ' · Bị khắc: ', ...bi.map(elTag), ` · ${techN} công pháp`))));
    }
  } else if (t === 'loc') {
    // cây thu gọn: Vực → Châu → địa điểm. Bấm tiêu đề để mở / đóng.
    const capOf = new Map(Object.values(EMPIRES).map((e) => [e.capital, e] as const));
    const ownerOf = (chauId: string) => Object.values(EMPIRES).find((e) => !e.vassal && LOCS[e.capital]?.chau === chauId);
    const TYPE_ORDER: Record<string, number> = { sect: 0, town: 1, market: 2, village: 3, wild: 4, realm: 5 };
    const caret = (k: string) => (cxOpen.has(k) ? '▾ ' : '▸ ');
    const toggleK = (k: string) => { if (cxOpen.has(k)) cxOpen.delete(k); else cxOpen.add(k); renderPanels(); };
    for (const v of ['trung', 'dong', 'tay', 'nam', 'bac'] as const) {
      const chs = Object.values(CHAU).filter((x) => x.vuc === v);
      const all = LOC_LIST.filter((l) => chs.some((x) => x.id === l.chau));
      const vk = 'v:' + v;
      list.append(h('h4', { class: 'cx-h click', style: { cursor: 'pointer' }, onclick: () => toggleK(vk) }, `${caret(vk)}${VUC[v].n} · ${chs.length} châu (${all.filter((l) => c.loc.includes(l.id)).length}/${all.length})`));
      if (!cxOpen.has(vk) && !query.trim()) continue;
      list.append(h('div', { class: 'small muted' }, VUC[v].d));
      for (const ch of chs) {
        const ls = LOC_LIST.filter((l) => l.chau === ch.id).sort((x, y) => (TYPE_ORDER[x.type] ?? 9) - (TYPE_ORDER[y.type] ?? 9) || (capOf.has(y.id) ? 1 : 0) - (capOf.has(x.id) ? 1 : 0));
        const ck = 'c:' + ch.id;
        const owner = ownerOf(ch.id);
        list.append(h('div', { class: 'item click', style: { cursor: 'pointer', fontWeight: '600' }, onclick: () => toggleK(ck) },
          h('div', { class: 'nm' }, `${caret(ck)}${ch.n} (${ls.filter((l) => c.loc.includes(l.id)).length}/${ls.length})`, h('small', { style: { fontWeight: '400' } }, `${ch.d}${owner ? ` Triều đình: ${owner.n}.` : ''}`))));
        if (!cxOpen.has(ck) && !query.trim()) continue;
        for (const l of ls) {
          const known = c.loc.includes(l.id);
          const emp = capOf.get(l.id);
          const sc = l.sect ? SECTS[l.sect] : null;
          const bits = [LOC_TYPE[l.type].n];
          if (l.sea) bits.push('dưới đáy biển'); else if (l.river) bits.push(`dưới sông ${l.river}`); else if (l.island) bits.push('đảo');
          if (l.gate) bits.push(`thông tới ${CELESTIAL[l.gate].n}`);
          if (sc?.leader) bits.push(`chủ: ${sc.leader}`);
          if (sc?.tribe) bits.push(sc.tribe === 'hai' ? 'chỉ nhận hải tộc yêu thú' : 'chỉ nhận thủy tộc yêu thú');
          if (sc) bits.push(SECT_TIER[sc.tier]);
          if (ownerTxt(l)) bits.push(ownerTxt(l));
          list.append(h('div', { class: 'item', style: { marginLeft: '18px' } },
            h('div', { class: 'ic', style: { background: known ? (sc ? '#5b4a7a' : emp ? '#b08d3a' : l.type === 'realm' || l.type === 'wild' ? '#3a5a3a' : '#3f6a85') : '#c9b994' }, html: known ? glyphSvg(sc ? 'gate' : emp ? 'crown' : LOC_TYPE[l.type].ic, 18) : '' }, known ? null : '?'),
            h('div', { class: 'nm' }, known ? l.n : '???', h('small', {}, bits.join(' · ') + (known ? '' : ' · chưa khám phá')), known ? h('small', { class: 'cx-d' }, l.d) : null)));
        }
      }
    }
  } else if (t === 'beast') {
    list.append(h('div', { class: 'small muted' }, 'Yêu thú đủ đạo hạnh đều hóa hình được. Kẻ hóa hình có thể giữ lại một đặc trưng (long giác ngắn, tai hồ ly, đuôi…) hoặc giống hệt người thường — vì thế Thiên Kiêu Bảng và Cường Giả Bảng đều có yêu tu.'));
    // yêu tu cùng loài đang có tên trên bảng → ghi thực lực
    const onBoard = (species: string) => {
      const hits: string[] = [];
      for (const [kind, label] of [['cg', 'Cường Giả Bảng'], ['tk', 'Thiên Kiêu Bảng']] as const) {
        const r = board(kind).find((x) => x.person?.beast === species);
        if (r) hits.push(`${label} hạng ${r.rank}: ${r.name}, ${realmTxt(r.r, r.st)}`);
      }
      return hits;
    };
    const BLOOD = ['thuần huyết', 'huyết mạch đậm', 'huyết mạch loãng'];
    const regN = (b: typeof BEASTS[number]) => (b.reg || []).map((r) => REGIONS[r]?.n).filter(Boolean);
    const beastRow = (b: typeof BEASTS[number], expandable = false, expanded = false, key = '') => {
      if (b.population === undefined) throw new Error(`Missing population for beast "${b.n}"`);
      const known = !b.codexOnly && (c.beast.includes(b.n) || c.beast.includes(beastRoot(b)) || (!!b.anc && c.beast.includes(b.anc)));
      const origin = b.codexOnly ? 'Tổ tiên được ghi trong phả hệ; hậu duệ có thể tồn tại ở các giới thấp hơn.' : b.origin || (b.anc ? `Hậu duệ ${BLOOD[b.blood ?? 2]} của ${b.anc}.` : b.home ? `Trấn giữ ${LOCS[b.home].n} (${whereOf(LOCS[b.home])}).` : regN(b).length ? `Thường gặp ở ${regN(b).join(', ')}.` : 'Loài bản địa Thương Lan Giới, không thuộc phả hệ dị thú cổ đã định danh.');
      const strength = b.codexOnly ? 'Tổ tiên được ghi trong phả hệ.' : known ? `Cảnh giới ${REALMS[b.lv[0]].n}${b.lv[1] !== b.lv[0] ? '–' + REALMS[b.lv[1]].n : ''}.` : 'Chưa rõ cảnh giới.';
      const hits = onBoard(b.n.split(' · ')[0]);
      const toggleDescendants = (e: Event) => {
        const row = e.currentTarget as HTMLElement;
        const expanded = !cxBeastOpen.has(key);
        if (expanded) cxBeastOpen.add(key); else cxBeastOpen.delete(key);
        row.setAttribute('aria-expanded', String(expanded));
        const caret = row.querySelector<HTMLElement>('.tc-beast-caret');
        if (caret) caret.textContent = expanded ? '▾ ' : '▸ ';
        const descendants = row.nextElementSibling as HTMLElement | null;
        if (descendants?.classList.contains('tc-beast-desc')) descendants.hidden = !expanded;
      };
      return h('div', {
        class: 'item' + (expandable ? ' click tc-beast-parent' : ''),
        style: expandable ? { cursor: 'pointer' } : {},
        role: expandable ? 'button' : undefined,
        tabindex: expandable ? 0 : undefined,
        'aria-expanded': expandable ? String(expanded) : undefined,
        onclick: expandable ? toggleDescendants : undefined,
        onkeydown: expandable ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDescendants(e); } } : undefined,
      },
        h('div', { class: 'ic', style: { background: known ? EL[b.el].c : '#c9b994' }, html: glyphSvg('paw', 18) }),
        h('div', { class: 'nm' }, h('b', {}, expandable ? h('span', { class: 'tc-beast-caret', 'aria-hidden': 'true' }, expanded ? '▾ ' : '▸ ') : null, b.n), ' ', h('span', { class: 'pill' }, EL[b.el].n), (b.myth || isMythicBeast(b.n)) ? h('span', { class: 'pill', style: { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', fontSize: '10px' }, title: 'Có cơ sở truyền thuyết thượng cổ (Uy áp +25%)' }, '👑 Thần Thoại') : null, known || b.codexOnly ? null : h('span', { class: 'muted small' }, ' · chưa gặp'),
          h('small', {}, `Quần thể: ${b.population.toLocaleString('vi-VN')} cá thể.`),
          h('small', {}, `${strength} ${origin}${b.anc ? ` · dòng ${beastRoot(b)}` : ''}`), b.shj ? h('small', {}, b.shj) : null,
          ...hits.map((x) => h('small', { class: 'mine-tag' }, x))));
    };
    const beastTree = (b: typeof BEASTS[number]): HTMLElement => {
      const key = `${beastRoot(b)}:${b.n}`;
      const descendants = BEASTS.filter((x) => x.anc === b.n && !x.codexHidden)
        .sort((a, b) => (a.codexOrder ?? Number.MAX_SAFE_INTEGER) - (b.codexOrder ?? Number.MAX_SAFE_INTEGER) || a.n.localeCompare(b.n, 'vi'));
      const expanded = cxBeastOpen.has(key);
      const group = h('div', { class: 'tc-beast-group' }, beastRow(b, descendants.length > 0, expanded, key));
      if (descendants.length) group.append(h('div', { class: 'tc-beast-desc', 'data-beast-key': key }, ...descendants.map(beastTree)));
      return group;
    };
    const codexBeasts = BEASTS.filter((b) => !b.codexHidden);
    const shjRoots = new Set(codexBeasts.filter((b) => b.home || b.shj || b.shjLineage).map(beastRoot));
    const roots = codexBeasts.filter((x) => !x.anc)
      .sort((a, b) => (a.codexOrder ?? Number.MAX_SAFE_INTEGER) - (b.codexOrder ?? Number.MAX_SAFE_INTEGER) || a.n.localeCompare(b.n, 'vi'));
    list.append(h('h4', { class: 'cx-h' }, 'Phả hệ dị thú ngoài Sơn Hải Kinh'), h('div', { class: 'small muted' }, 'Các họ dị thú bản địa và những nhánh phả hệ riêng. Bấm tên để mở cây hậu duệ.'));
    for (const b of roots.filter((x) => !shjRoots.has(x.n))) list.append(beastTree(b));
    list.append(h('h4', { class: 'cx-h' }, 'Sơn Hải Kinh'), h('div', { class: 'small muted' }, 'Dị thú có ghi chép hoặc phả hệ liên quan trong Sơn Hải Kinh được gom tại đây, không phụ thuộc tổ thú đang ở giới nào. Bấm tên để mở cây hậu duệ; hậu duệ có thể sinh sống ở các giới thấp hơn.'));
    for (const b of roots.filter((x) => shjRoots.has(x.n))) list.append(beastTree(b));
  } else {
    const all = [...Object.keys(PILLS).map((k) => 'p:' + k), ...Object.keys(HERBS).map((k) => 'h:' + k), ...Object.keys(MATS).map((k) => 'm:' + k), ...Object.keys(TALIS).filter((k) => !TALIS[k].co).map((k) => 't:' + k), ...Object.keys(SPECIALS).map((k) => 'x:' + k)];
    for (const id of all) { const kn = c.item.includes(id); list.append(h('div', { class: 'item' }, h('div', { class: 'ic ic-svg', html: itemArtSvg(id, 30, 1, !kn) || '' }), h('div', { class: 'nm' }, kn ? itemName(id) : '???', h('small', {}, kn ? itemDesc(id) : 'Chưa khám phá.')))); }
  }
  if (t === 'loc') out.push(h('div', { class: 'small muted' }, `Đã biết ${LOC_LIST.filter((l) => c.loc.includes(l.id)).length}/${LOC_LIST.length} · bấm tên vực, tên châu để mở hoặc thu gọn`));
  else if (t === 'beast') {
    const catalog = BEASTS.filter((b) => !b.anc && !b.codexHidden && !b.codexOnly);
    out.push(h('div', { class: 'small muted' }, `Đã gặp ${catalog.filter((b) => c.beast.includes(b.n) || c.beast.includes(beastRoot(b))).length}/${catalog.length}`));
  }
  else if (t === 'item') {
    const total = list.querySelectorAll('.item').length;
    const known = [...list.querySelectorAll('.item .ic')].filter((x) => x.textContent !== '?').length;
    out.push(h('div', { class: 'small muted' }, `Đã biết ${known}/${total}`));
  }
  out.push(list);
  return out;
}
/** Bảng công pháp / thuật pháp: xếp theo phẩm cấp từ cao xuống thấp. Tên chưa lĩnh hội thì ẩn. */
function lawBoard(kind: 'tech' | 'skill'): HTMLElement[] {
  const c = meta.codex;
  const list = h('div', { class: 'list' });
  if (kind === 'tech') {
    const ts = worldDefinitions('cp').filter((x) => !x.blood).sort((a, b) => b.tier - a.tier || a.n.localeCompare(b.n));
    ts.forEach((tc, i) => {
      const known = c.tech.includes(tc.id);
      const mine = s.tech === tc.id;
      list.append(h('div', { class: 'item' + (mine ? ' mine' : '') }, h('div', { class: 'rk-i' }, String(i + 1)), h('div', { class: 'ic ic-svg', html: itemArtSvg('cp:' + tc.id, 30, 1, !known)! }),
        h('div', { class: 'nm' }, known ? tc.n : '???', ' ', h('span', { class: 'pill', style: { color: TIER_C[tc.tier] } }, techGrade(tc)), mine ? h('span', { class: 'mine-tag' }, ' · ngươi đang tu') : null,
          h('small', {}, ...tc.el.map(elTag), tc.evil ? h('span', { style: { color: 'var(--seal)' } }, ' ma công ') : null, isExclusiveTech(tc.id) ? h('span', { class: 'mine-tag' }, ` độc môn của ${techOwners(tc.id).map((x) => SECTS[x].n).join(', ')} `) : null, known ? ' ' + tc.d : ' Chưa lĩnh hội.'))));
    });
    return [h('div', { class: 'small muted' }, `Công Pháp Bảng: ${ts.length} công pháp lưu truyền, xếp theo phẩm cấp. Công pháp huyết mạch không lên bảng.`), list];
  }
  const sk = worldDefinitions('sk').sort((a, b) => b.tier - a.tier || b.m - a.m);
  sk.forEach((k, i) => {
    const known = !!s?.known.includes(k.id);
    list.append(h('div', { class: 'item' + (known ? ' mine' : '') }, h('div', { class: 'rk-i' }, String(i + 1)), h('div', { class: 'ic ic-svg', html: skillIconSvg(k, 30, !known) }),
      h('div', { class: 'nm' }, k.n, ' ', h('span', { class: 'pill', style: { color: TIER_C[k.tier] } }, skillGrade(k)), known ? h('span', { class: 'mine-tag' }, ' · đã học') : null,
        h('small', {}, skTag(k) ?? 'Vô thuộc tính', ` ${k.d} · ×${k.m} · ${skCost(k)} linh lực`))));
  });
  return [h('div', { class: 'small muted' }, `Thuật Pháp Bảng: ${sk.length} thuật pháp, xếp theo phẩm cấp rồi uy lực.`), list];
}
/** Bảng thế lực (chung hoặc lọc theo loại). */
function forceRows(kind?: ForceKind): HTMLElement[] {
  const rows = forceBoard(kind);
  const list = h('div', { class: 'list' });
  if (!rows.length) list.append(h('div', { class: 'empty' }, 'Giới này không có thế lực loại ấy.'));
  for (const r of rows) {
    const ic = r.kind === 'empire' ? h('div', { class: 'ic', style: { background: ['', '#9a8a6a', '#b08d3a', '#c9a23a'][r.tier] }, html: glyphSvg('crown', 18) }) : emblem(r.els, r.kind === 'sect' || r.kind === 'celestial' ? r.tier : 1, r.evil || r.kind === 'celestial');
    const extra: (HTMLElement | null)[] = [];
    if (r.kind === 'clan') {
      const k = CLANS[r.id.slice(2)];
      const cl = (id: string, cls: string) => h('span', { class: 'pill ' + cls }, CLANS[id].n);
      if (k) extra.push(h('small', {}, 'Đồng minh: ', ...(k.allies.length ? k.allies.map((x) => cl(x, 'ally')) : ['—']), ' Đối địch: ', ...(k.foes.length ? k.foes.map((x) => cl(x, 'foe')) : ['—'])));
    }
    list.append(h('div', { class: 'item' + (r.mine ? ' mine' : '') }, h('div', { class: 'rk-i' }, String(r.rank)), ic,
      h('div', { class: 'nm' }, h('b', {}, r.name), ' ', h('span', { class: 'pill' }, FORCE_KIND_N[r.kind]), r.mine ? h('span', { class: 'mine-tag' }, ' · ' + r.mineTxt) : null,
        h('small', {}, ...r.els.map(elTag), ` ${r.sub}${r.where ? ' · ' + r.where : ''}`), ...extra, h('small', { class: 'cx-d' }, r.d))));
  }
  return [list];
}
/** Bảng pháp bảo / pháp khí luyện chế. */
function baoRows(rows: BaoRow[], intro: string): HTMLElement[] {
  const list = h('div', { class: 'list' });
  if (!rows.length) list.append(h('div', { class: 'empty' }, 'Bảng trống.'));
  for (const r of rows) list.append(h('div', { class: 'item' + (r.mine ? ' mine' : '') }, h('div', { class: 'rk-i' }, String(r.rank)), h('div', { class: 'ic', style: { background: TIER_C[r.grade] }, html: glyphSvg(r.el || 'gate', 18) }),
    h('div', { class: 'nm' }, h('b', {}, r.name), r.mine ? h('span', { class: 'pill' }, 'Của ngươi') : null, h('small', {}, r.note))));
  return [h('div', { class: 'small muted' }, intro), list];
}
/** Thiên Tài Địa Bảo Bảng của giới hiện tại. */
function tbRows(): HTMLElement[] {
  const rows = tbdbBoard();
  const w = s.world ?? 0;
  const list = h('div', { class: 'list' });
  for (const r of rows) list.append(h('div', { class: 'item' }, h('div', { class: 'rk-i' }, String(r.rank)), h('div', { class: 'ic', style: { background: TB_KIND_C[r.kind] }, html: glyphSvg(r.kind === 'khoáng' ? 'root' : r.kind === 'thủy' ? 'thuy' : 'herb', 18) }),
    h('div', { class: 'nm' }, h('b', {}, r.n), ' ', h('span', { class: 'pill' }, TB_KIND_N[r.kind]), h('span', { class: 'pill', style: { color: TIER_C[Math.min(6, Math.ceil(r.realm / 3))] } }, REALMS[r.realm].n), h('small', {}, r.note), h('small', { class: 'cx-d' }, r.d))));
  return [h('div', { class: 'small muted' }, `Thiên Tài Địa Bảo Bảng ${worldName(w)}: chỉ ghi những thứ giới này sinh ra được — trần sức mạnh ${REALMS[celestialTopLocal(w)].n} thì không chứa nổi địa bảo cần cảnh giới cao hơn. Giới trên có bảng riêng.`), list];
}
const celestialTopLocal = (w: number) => Math.min(REALMS.length - 1, [9, 12, 15, 18, 20, 21][Math.min(5, w)]);
/** Bảng danh sư một nghề. */
function masterRows(k: CraftK): HTMLElement[] {
  const rows = masterBoard(k);
  const me = rows.find((r) => r.mine);
  const list = h('div', { class: 'list' });
  for (const r of rows) list.append(h('div', { class: 'item' + (r.mine ? ' mine' : '') }, h('div', { class: 'rk-i' }, String(r.rank)),
    h('div', { class: 'ic ic-svg rel-av', html: avatarSvg(r.g, 5, null, 34, r.mine ? playerPortrait(s.g, age()) : npcPortrait(r.g, 5)) }),
    h('div', { class: 'nm' }, h('b', {}, r.name), ' ', r.rank === 1 ? h('span', { class: 'pill' }, `Đệ nhất ${MASTER_N[k]}`) : null, r.mine ? h('span', { class: 'pill' }, 'Ngươi') : null, h('small', {}, r.note))));
  return [h('div', { class: 'small muted' }, `Bảng ${MASTER_N[k]} ${worldName(s.world ?? 0)}: xếp theo tổng độ thuần thục ${CRAFT_N[k].toLowerCase()}, tiếp tục tăng sau bậc tối đa. Xét toàn giới, mọi chủng tộc; chỉ lấy top 100. ${me ? `Ngươi hạng ${me.rank}/${rows.length} (${craftTitle(me.lv, k)}).` : s.craft[k] >= 1 ? 'Ngươi chưa lọt top 100.' : `Ngươi chưa nhập môn ${CRAFT_N[k].toLowerCase()}, chưa có tên.`}`), list];
}

// ---------- Sử ký ----------
function histPanel(): HTMLElement[] {
  const out: HTMLElement[] = [h('div', { class: 'small muted' }, `Điểm luân hồi: ${meta.karma} (tổng tích lũy ${meta.karmaTotal}) · ${meta.lives.length} kiếp đã qua. Năm thế giới: ${meta.worldYear}.`)];
  if (!meta.lives.length) out.push(h('div', { class: 'empty' }, 'Chưa có kiếp nào kết thúc.'));
  for (const l of meta.lives) {
    out.push(h('details', { class: 'card' }, h('summary', { style: { cursor: 'pointer' } }, h('b', {}, l.name), ` — ${l.realm}, ${l.age} tuổi, ${l.score} điểm${l.ascended ? ' · PHI THĂNG' : ''}`),
      h('div', { class: 'small muted' }, `${l.origin} · ${l.root}${l.sect ? ' · ' + l.sect : ''} · ${l.cause} (năm ${l.year})`),
      h('p', { style: { fontStyle: 'italic' } }, l.epitaph),
      l.bio ? h('p', { class: 'small' }, l.bio) : null,
      h('div', { class: 'small' }, ...l.marks.slice(0, 40).map((m) => h('div', { class: 'logline' }, m)))));
  }
  return out;
}

// ---------- Thành tựu ----------
function achPanel(): HTMLElement[] {
  const got = meta.ach;
  return [h('div', { class: 'small muted' }, `${got.length}/${ACH.length} thành tựu (mỗi thành tựu đạt được trong một kiếp cộng điểm cho kiếp đó).`),
    h('div', { class: 'list' }, ...ACH.map((a) => h('div', { class: 'item' }, h('div', { class: 'ic', style: { background: got.includes(a.id) ? '#9a7a2e' : '#c9b994' }, html: glyphSvg('trophy', 18) }), h('div', { class: 'nm' }, got.includes(a.id) ? a.n : '???', h('small', {}, `${a.d} · ${a.pts} điểm`)))))];
}

// ---------- Cài đặt ----------

// ---------- Vạn Giới Liên Minh (Multi-player & Bảng Thiên Kiêu & Lôi Đài) ----------
function multiPanel(): HTMLElement[] {
  const user = getCurrentUser();
  const root = h('div', { class: 'multi-panel' });

  // 1. Header trạng thái tài khoản & đồng bộ Cloud
  const topBar = h('div', { class: 'card', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '10px 14px' } });
  if (user && isLoggedIn()) {
    topBar.append(
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
        h('span', { class: 'badge gold', style: { fontSize: '16px' } }, '仙'),
        h('div', {},
          h('div', { style: { fontWeight: 'bold' } }, user.displayName || user.username),
          h('div', { class: 'small muted' }, `@${user.username} · ${user.authProvider === 'google' ? 'Google · Gemini AI' : 'Tài khoản thường'}`)
        )
      ),
      h('div', { style: { display: 'flex', gap: '6px' } },
        btn('☁️ Lưu Cloud', async () => {
          const ok = await syncSaveToCloud();
          notice(ok ? '✓ Đã đồng bộ Save lên Đám Mây thành công!' : '✕ Lỗi đồng bộ. Hãy kiểm tra máy chủ.');
        }, 'sm prime'),
        btn('Tài khoản', () => openAuthModal(() => renderNav()), 'sm')
      )
    );
  } else {
    topBar.append(
      h('div', {},
        h('div', { style: { fontWeight: 'bold' } }, 'Chưa đăng nhập tài khoản'),
        h('div', { class: 'small muted' }, 'Đăng ký nhanh không cần xác minh để lưu cloud và tranh tài Thiên Bảng')
      ),
      btn('Đăng nhập / Đăng ký', () => openAuthModal(() => renderNav()), 'sm prime')
    );
  }
  root.append(topBar);

  // 2. Tab con: [Thiên Kiêu Bảng] [Lôi Đài Huyễn Ảnh] [Truyền Âm Vạn Giới]
  const tabHeader = h('div', { style: { display: 'flex', gap: '6px', margin: '8px 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px' } });
  let subTab: 'board' | 'pvp' | 'chat' = 'board';

  const btnBoard = h('button', { class: 'btn sm prime', onclick: () => { subTab = 'board'; switchSub(); } }, '🏆 Thiên Kiêu Bảng');
  const btnPvp = h('button', { class: 'btn sm', onclick: () => { subTab = 'pvp'; switchSub(); } }, '⚔️ Lôi Đài Huyễn Ảnh');
  const btnChat = h('button', { class: 'btn sm', onclick: () => { subTab = 'chat'; switchSub(); } }, '💬 Truyền Âm Vạn Giới');
  tabHeader.append(btnBoard, btnPvp, btnChat);
  root.append(tabHeader);

  const subBody = h('div', {});
  root.append(subBody);

  async function switchSub() {
    btnBoard.className = subTab === 'board' ? 'btn sm prime' : 'btn sm';
    btnPvp.className = subTab === 'pvp' ? 'btn sm prime' : 'btn sm';
    btnChat.className = subTab === 'chat' ? 'btn sm prime' : 'btn sm';
    subBody.innerHTML = '<div class="small muted">Đang tải dữ liệu từ máy chủ Vạn Giới...</div>';

    if (subTab === 'board') {
      // TAB 1: BẢNG THIÊN KIÊU
      const roster = await fetchRoster();
      subBody.innerHTML = '';
      if (!roster.length) {
        subBody.append(h('div', { class: 'card', style: { padding: '16px', textAlign: 'center' } },
          h('p', {}, 'Chưa có dữ liệu tu sĩ nào trên Thiên Kiêu Bảng.'),
          h('p', { class: 'small muted' }, 'Hãy đăng nhập và bấm "Lưu Cloud" để đưa tên mình lên bảng vàng!')
        ));
        return;
      }

      const table = h('div', { class: 'list' });
      roster.forEach((p, idx) => {
        const row = h('div', { class: 'card', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0', padding: '10px' } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            h('span', { class: 'badge ' + (idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''), style: { fontWeight: 'bold' } }, `#${idx + 1}`),
            h('div', {},
              h('div', { style: { fontWeight: 'bold' } }, p.displayName),
              h('div', { class: 'small muted' }, `${p.realm} · Tuổi: ${Math.floor(p.life)} · Linh thạch: ${p.score || 0}`)
            )
          ),
          h('span', { class: 'badge purple small' }, p.realm)
        );
        table.append(row);
      });
      subBody.append(table);

    } else if (subTab === 'pvp') {
      // TAB 2: LÔI ĐÀI HUYỄN ẢNH (PVP)
      const roster = await fetchRoster();
      subBody.innerHTML = '';
      const intro = h('div', { class: 'small muted', style: { marginBottom: '10px' } },
        'Nơi các đạo hữu lưu lại huyễn ảnh chiến hồn để luận đạo so tài. Đánh bại chiến hồn nhận 500 linh thạch và 25 điểm danh vọng!'
      );
      subBody.append(intro);

      if (!roster.length) {
        subBody.append(h('div', { class: 'card', style: { padding: '16px', textAlign: 'center' } }, 'Chưa có đối thủ nào lưu lại huyễn ảnh trên lôi đài.'));
        return;
      }

      const list = h('div', { class: 'list' });
      roster.forEach((p) => {
        const item = h('div', { class: 'card', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0', padding: '10px' } },
          h('div', {},
            h('div', { style: { fontWeight: 'bold' } }, p.displayName),
            h('div', { class: 'small muted' }, `Cảnh giới: ${p.realm} · Chiến lực ngũ hành`)
          ),
          btn('⚔️ Khiêu chiến', () => {
            if (!s) { notice('Cần vào một kiếp nhân vật mới có thể bước lên lôi đài!'); return; }
            const foe: FoeSpec = {
              name: p.displayName + ' (Huyễn Ảnh)',
              r: Math.max(0, p.realmIdx || 0),
              mult: 1.15,
              kind: 'cultivator',
              el: p.spec?.el || null,
            };
            const r = fight(foe);
            const sum = fightSummary(r);
            if (r.win) {
              s.money = (s.money || 0) + 500;
              s.fame = (s.fame || 0) + 25;
              save();
              notice(sum + '\n\n🎉 Ngươi xuất sắc đánh bại huyễn ảnh của ' + p.displayName + ' trên lôi đài, vang danh thiên hạ, nhận thưởng 500 linh thạch!');
            } else {
              notice(sum + '\n\nĐối thủ xuất chiêu quá biến ảo, ngươi bại trận lui xuống lôi đài đúc rút kinh nghiệm.');
            }
          }, 'sm prime')
        );
        list.append(item);
      });
      subBody.append(list);

    } else {
      // TAB 3: TRUYỀN ÂM VẠN GIỚI (CHAT)
      subBody.innerHTML = '';
      const chatBox = h('div', { class: 'chat-container', style: { maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', marginBottom: '8px', background: 'rgba(0,0,0,0.02)' } });
      subBody.append(chatBox);

      async function loadChat() {
        const msgs = await fetchWorldChat();
        chatBox.innerHTML = '';
        if (!msgs.length) {
          chatBox.innerHTML = '<div class="small muted center" style="padding: 16px;">Chưa có lời truyền âm nào. Hãy là người đầu tiên lên tiếng!</div>';
          return;
        }
        msgs.forEach((m) => {
          const row = h('div', { style: { margin: '4px 0', fontSize: '13px' } },
            h('span', { class: 'badge small purple', style: { marginRight: '6px', fontSize: '11px' } }, m.realm || 'Tu sĩ'),
            h('strong', {}, (m.display_name || 'Đạo Hữu') + ': '),
            h('span', {}, m.message)
          );
          chatBox.append(row);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      loadChat();

      const inputRow = h('div', { style: { display: 'flex', gap: '6px' } });
      const msgInput = h('input', { type: 'text', placeholder: 'Nhập lời truyền âm khắp thiên hạ...', style: { flex: 1, padding: '6px 8px' } });
      const sendBtn = btn('Gửi', async () => {
        const text = msgInput.value.trim();
        if (!text) return;
        if (!isLoggedIn()) { notice('Cần đăng nhập tài khoản để truyền âm!'); openAuthModal(); return; }
        sendBtn.textContent = '...';
        const userRealm = s ? REALMS[s.r]?.n : 'Phàm nhân';
        const ok = await sendWorldChatMessage(text, userRealm);
        sendBtn.textContent = 'Gửi';
        if (ok) {
          msgInput.value = '';
          loadChat();
        } else {
          notice('Không thể gửi tin nhắn. Kiểm tra kết nối máy chủ.');
        }
      }, 'prime');

      inputRow.append(msgInput, sendBtn);
      subBody.append(inputRow);
    }
  }

  switchSub();
  return [root];
}


// ---------- Cửa sổ Trò chuyện (Chat Thế Giới & Đàm Đạo AI) ----------
let aiChatHistory: { role: 'user' | 'ai'; text: string }[] = [
  { role: 'ai', text: 'Vô lượng thiên tôn! Ta là Khí Linh Thiên Đạo của Thương Lan Giới. Đạo hữu tìm ta muốn thỉnh giáo điều gì về con đường tu tiên?' }
];

function chatPanel(): HTMLElement[] {
  const root = h('div', { class: 'chat-panel' });
  const tabs = h('div', { style: { display: 'flex', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' } });

  let tabMode: 'ai' | 'world' = 'ai'; // Mặc định mở đàm đạo AI
  const btnAi = h('button', { class: 'btn sm prime', onclick: () => { tabMode = 'ai'; switchTab(); } }, '🤖 Đàm Đạo Với Tiên Giới AI');
  const btnWorld = h('button', { class: 'btn sm', onclick: () => { tabMode = 'world'; switchTab(); } }, '💬 Truyền Âm Thế Giới');
  tabs.append(btnAi, btnWorld);
  root.append(tabs);

  const body = h('div', {});
  root.append(body);

  function switchTab() {
    btnAi.className = tabMode === 'ai' ? 'btn sm prime' : 'btn sm';
    btnWorld.className = tabMode === 'world' ? 'btn sm prime' : 'btn sm';
    body.innerHTML = '';

    if (tabMode === 'ai') {
      // TAB 1: ĐÀM ĐẠO TRỰC TIẾP VỚI GEMINI AI
      const isGemini = isGeminiActive();
      const aiBadge = isGemini
        ? h('div', { class: 'badge green small', style: { marginBottom: '8px', display: 'inline-block' } }, '✨ Đang kết nối: Google Gemini AI (gemini-2.5-flash)')
        : h('div', { class: 'badge small', style: { marginBottom: '8px', display: 'inline-block' } }, '💻 Đang kết nối: Ollama Local');

      const chatContainer = h('div', {
        class: 'ai-chat-box',
        style: {
          height: '320px',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px',
          background: 'rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }
      });

      function renderAiMessages() {
        chatContainer.innerHTML = '';
        aiChatHistory.forEach((msg) => {
          const isUser = msg.role === 'user';
          const msgBubble = h('div', {
            style: {
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              padding: '8px 12px',
              borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: isUser ? 'var(--accent)' : 'var(--card-bg, #f4ecd8)',
              color: isUser ? '#fff' : 'inherit',
              border: isUser ? 'none' : '1px solid var(--border)',
              fontSize: '13.5px',
              lineHeight: '1.5'
            }
          }, msg.text);
          chatContainer.append(msgBubble);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      renderAiMessages();

      const inputRow = h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } });
      const promptInput = h('input', {
        type: 'text',
        placeholder: 'Hỏi về công pháp, bí cảnh, hoặc tâm sự tu tiên...',
        style: { flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', boxSizing: 'border-box' }
      });

      const sendBtn = btn('Gửi', async () => {
        const query = promptInput.value.trim();
        if (!query) return;
        promptInput.value = '';
        aiChatHistory.push({ role: 'user', text: query });
        renderAiMessages();

        sendBtn.textContent = '...';
        sendBtn.setAttribute('disabled', 'true');

        const systemPrompt = `Bạn là Khí Linh Thiên Đạo của Thương Lan Giới trong game Tiên Lộ Mạn Mạn. Người chơi (tên: ${s?.name || 'Đạo hữu'}, cảnh giới: ${s ? REALMS[s.r]?.n : 'Phàm nhân'}) đang đàm đạo cùng ngươi.
Quy tắc:
- Xưng "Ta", gọi người chơi là "Đạo hữu" hoặc "Ngươi".
- Văn phong tiên hiệp cổ phong uyên bác, trang nhã, thấu triệt thiên địa, có chất huyền huyễn.
- Trả lời ngắn gọn, súc tích (dưới 150 chữ).`;

        try {
          let reply = '';
          if (isGeminiActive()) {
            const { callGemini } = await import('../ai/gemini');
            reply = await callGemini(systemPrompt, query, 300, 0.85);
          } else {
            const { chatAi } = await import('../ai/ollama');
            reply = await chatAi(`${systemPrompt}\n\nĐạo hữu hỏi: ${query}`);
          }
          aiChatHistory.push({ role: 'ai', text: reply || 'Thiên đạo mịt mờ, chốc lát chưa thấu triệt ý niệm...' });
        } catch (err: any) {
          aiChatHistory.push({ role: 'ai', text: 'Hư không dao động, chưa thể kết nối thần thức lúc này. (' + (err.message || 'Lỗi mạng') + ')' });
        } finally {
          sendBtn.textContent = 'Gửi';
          sendBtn.removeAttribute('disabled');
          renderAiMessages();
        }
      }, 'prime');

      promptInput.onkeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') sendBtn.click();
      };

      inputRow.append(promptInput, sendBtn);
      body.append(aiBadge, chatContainer, inputRow);

    } else {
      // TAB 2: TRUYỀN ÂM THẾ GIỚI
      const chatContainer = h('div', {
        style: {
          height: '320px',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px',
          background: 'rgba(0,0,0,0.02)',
          marginBottom: '10px'
        }
      });
      body.append(chatContainer);

      async function loadWorldChat() {
        chatContainer.innerHTML = '<div class="small muted center">Đang tải truyền âm...</div>';
        const msgs = await fetchWorldChat();
        chatContainer.innerHTML = '';
        if (!msgs.length) {
          chatContainer.innerHTML = '<div class="small muted center" style="padding: 24px;">Chưa có ai truyền âm. Hãy là người đầu tiên lên tiếng!</div>';
          return;
        }
        msgs.forEach((m) => {
          const row = h('div', { style: { margin: '6px 0', fontSize: '13px' } },
            h('span', { class: 'badge small purple', style: { marginRight: '6px', fontSize: '11px' } }, m.realm || 'Tu sĩ'),
            h('strong', {}, (m.display_name || 'Đạo Hữu') + ': '),
            h('span', {}, m.message)
          );
          chatContainer.append(row);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      loadWorldChat();

      const inputRow = h('div', { style: { display: 'flex', gap: '8px' } });
      const msgInput = h('input', {
        type: 'text',
        placeholder: 'Nhập lời truyền âm khắp thiên hạ...',
        style: { flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }
      });
      const sendBtn = btn('Truyền âm', async () => {
        const text = msgInput.value.trim();
        if (!text) return;
        if (!isLoggedIn()) { notice('Cần đăng nhập tài khoản để truyền âm!'); openAuthModal(); return; }
        sendBtn.textContent = '...';
        const userRealm = s ? REALMS[s.r]?.n : 'Phàm nhân';
        const ok = await sendWorldChatMessage(text, userRealm);
        sendBtn.textContent = 'Truyền âm';
        if (ok) {
          msgInput.value = '';
          loadWorldChat();
        } else {
          notice('Không thể gửi tin nhắn. Hãy kiểm tra kết nối server.');
        }
      }, 'prime');

      msgInput.onkeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') sendBtn.click();
      };

      inputRow.append(msgInput, sendBtn);
      body.append(inputRow);
    }
  }

  switchTab();
  return [root];
}

function setPanel(): HTMLElement[] {
  const st = meta.settings;
  const user = getCurrentUser();
  const root = h('div', { class: 'set-panel' });

  // 1. Tài khoản & Đám mây
  root.append(h('h4', { style: { marginTop: 0 } }, '👤 Tài Khoản & Đám Mây'));
  const userBox = h('div', { class: 'card', style: { padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } });
  if (user && isLoggedIn()) {
    userBox.append(
      h('div', {},
        h('div', { style: { fontWeight: 'bold' } }, user.displayName || user.username),
        h('div', { class: 'small muted' }, `${user.authProvider === 'google' ? 'Đã liên kết Google' : 'Tài khoản thường'} · @${user.username}`)
      ),
      h('div', { style: { display: 'flex', gap: '6px' } },
        btn('☁️ Lưu Cloud', async () => {
          const ok = await syncSaveToCloud();
          notice(ok ? 'Đã lưu Save lên Đám Mây thành công!' : 'Lỗi đồng bộ.');
        }, 'sm prime'),
        btn('Quản lý', () => openAuthModal(() => renderNav()), 'sm')
      )
    );
  } else {
    userBox.append(
      h('div', {},
        h('div', { style: { fontWeight: 'bold' } }, 'Chưa đăng nhập'),
        h('div', { class: 'small muted' }, 'Đăng nhập để đồng bộ save và kích hoạt Gemini AI')
      ),
      btn('Đăng nhập / Đăng ký', () => openAuthModal(() => renderNav()), 'sm prime')
    );
  }
  root.append(userBox);

  // 2. Bộ máy AI Kể Chuyện
  root.append(h('h4', {}, '🤖 Bộ Máy AI Kể Chuyện'));
  const cb = (label: string, k: 'ai' | 'aiBio', sub?: string) =>
    h('label', { style: { display: 'block', margin: '6px 0' } },
      h('input', {
        type: 'checkbox',
        checked: st[k],
        onchange: (e: Event) => {
          setAi({ [k]: (e.target as HTMLInputElement).checked });
          renderPanels();
        }
      }),
      ' ', label,
      sub ? h('div', { class: 'small muted', style: { marginLeft: '22px' } }, sub) : null
    );

  root.append(
    cb('Bật AI kể chuyện', 'ai', 'Khi bật, AI sẽ viết lại kết quả các lựa chọn và biến cố kiếp người.'),
    cb('Viết tiểu sử khi kiếp người kết thúc', 'aiBio')
  );

  // Chọn Provider: Google Gemini vs Ollama
  const isGem = isGeminiActive();
  const providerRow = h('div', { style: { margin: '10px 0', padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px' } });
  providerRow.append(h('div', { style: { fontWeight: 'bold', marginBottom: '8px' } }, 'Chọn Bộ Máy AI:'));

  const radioGemini = h('label', { style: { display: 'block', margin: '4px 0', cursor: 'pointer' } },
    h('input', {
      type: 'radio',
      name: 'ai_provider',
      checked: st.aiProvider === 'gemini' || isGem,
      onchange: () => {
        setAi({ aiProvider: 'gemini' });
        renderPanels();
      }
    }),
    ' ✨ ', h('strong', {}, 'Google Gemini AI (Cloud - Khuyên dùng)'),
    h('div', { class: 'small muted', style: { marginLeft: '24px' } }, 'Chạy trên máy chủ đám mây của Google. Nhanh (1s), văn phong xuất sắc, không cần GPU.')
  );

  const radioOllama = h('label', { style: { display: 'block', margin: '8px 0 4px 0', cursor: 'pointer' } },
    h('input', {
      type: 'radio',
      name: 'ai_provider',
      checked: st.aiProvider === 'ollama' && !isGem,
      onchange: () => {
        setAi({ aiProvider: 'ollama' });
        renderPanels();
      }
    }),
    ' 💻 ', h('strong', {}, 'Ollama AI (Local - Chạy trên máy)'),
    h('div', { class: 'small muted', style: { marginLeft: '24px' } }, 'Yêu cầu mở phần mềm Ollama trên máy tính.')
  );

  providerRow.append(radioGemini, radioOllama);
  root.append(providerRow);

  // Chi tiết cấu hình theo Provider đã chọn
  if (st.aiProvider === 'gemini' || isGem) {
    const gemBox = h('div', { class: 'card small', style: { padding: '12px', margin: '10px 0', border: '1px solid rgba(52, 168, 83, 0.4)' } });
    gemBox.append(
      h('div', { style: { color: '#2e7d32', fontWeight: 'bold', marginBottom: '6px' } }, '✨ Đang Dùng: Google Gemini 2.5 Flash'),
      h('div', { class: 'small muted', style: { marginBottom: '8px' } }, 'Model Gemini 2.5 Flash trên đám mây để viết sự kiện & đàm đạo.')
    );

    const hasToken = !!meta.settings.geminiToken;
    const isGoogle = getCurrentUser()?.authProvider === 'google';

    if (hasToken) {
      gemBox.append(
        h('div', { class: 'badge green small', style: { margin: '4px 0 8px 0', display: 'inline-block' } }, '✓ Đang dùng Token Google OAuth tự động (Không cần Key)')
      );
    } else if (isGoogle) {
      const oauthQuickBtn = btn('⚡ Cấp quyền Gemini Tự Động (Google OAuth - Không cần Key)', () => {
        oauthQuickBtn.textContent = 'Đang mở Google...';
        const clientId = meta.settings.googleClientId || '744884064365-0lt381v4e24g1ihe6botta6tf4dripuv.apps.googleusercontent.com';
        if (!window.google?.accounts?.oauth2) {
          notice('Đang tải thư viện Google, vui lòng thử lại sau 2 giây.');
          oauthQuickBtn.textContent = '⚡ Cấp quyền Gemini Tự Động (Google OAuth - Không cần Key)';
          return;
        }
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile https://www.googleapis.com/auth/generative-language',
            callback: async (tokenResp: any) => {
              if (tokenResp.error) {
                oauthQuickBtn.textContent = '⚡ Cấp quyền Gemini Tự Động (Google OAuth - Không cần Key)';
                notice('Google OAuth: ' + tokenResp.error);
                return;
              }
              meta.settings.geminiToken = tokenResp.access_token;
              meta.settings.aiProvider = 'gemini';
              saveMeta();
              notice('✓ Đã cấp quyền Google Gemini OAuth thành công! Không cần API Key.');
              renderPanels();
            },
          });
          client.requestAccessToken();
        } catch (e: any) {
          oauthQuickBtn.textContent = '⚡ Cấp quyền Gemini Tự Động (Google OAuth - Không cần Key)';
          notice('Lỗi: ' + e.message);
        }
      }, 'sm prime');
      oauthQuickBtn.style.marginBottom = '8px';
      oauthQuickBtn.style.display = 'block';
      gemBox.append(oauthQuickBtn);
    }

    const currentKey = meta.settings.geminiKey || '';
    const keyInput = h('input', {
      type: 'password',
      placeholder: 'Dán Gemini API Key (AIzaSy...)...',
      value: currentKey,
      style: { width: '100%', padding: '6px 8px', marginBottom: '6px', boxSizing: 'border-box' }
    });

    const keyRow = h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' } });
    const saveKeyBtn = btn('Lưu Key', async () => {
      const val = keyInput.value.trim();
      setAi({ geminiKey: val, aiProvider: 'gemini' });
      const { updateAccountGeminiKey } = await import('../engine/auth');
      await updateAccountGeminiKey(val);
      notice('Đã lưu Gemini API Key!');
      renderPanels();
    }, 'sm prime');

    const testGeminiBtn = btn('Kiểm tra kết nối Gemini AI', async () => {
      testGeminiBtn.textContent = 'Đang gọi Gemini...';
      try {
        const { getActiveGeminiAuth } = await import('../ai/gemini');
        const auth = getActiveGeminiAuth();

        // Nếu là tài khoản Google và chưa có token hay key: Tự động kích hoạt OAuth ngay!
        if (!auth.accessToken && !auth.apiKey && isGoogle) {
          testGeminiBtn.textContent = 'Đang mở Google OAuth...';
          const clientId = meta.settings.googleClientId || '744884064365-0lt381v4e24g1ihe6botta6tf4dripuv.apps.googleusercontent.com';
          if (!window.google?.accounts?.oauth2) {
            notice('Đang tải thư viện Google, vui lòng thử lại sau 2 giây.');
            testGeminiBtn.textContent = 'Kiểm tra kết nối Gemini AI';
            return;
          }
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile https://www.googleapis.com/auth/generative-language',
            callback: async (tokenResp: any) => {
              if (tokenResp.error) {
                notice('Google OAuth: ' + tokenResp.error);
                testGeminiBtn.textContent = 'Kiểm tra kết nối Gemini AI';
                return;
              }
              meta.settings.geminiToken = tokenResp.access_token;
              meta.settings.aiProvider = 'gemini';
              saveMeta();
              testGeminiBtn.textContent = 'Đang gọi Gemini...';
              try {
                const { callGemini } = await import('../ai/gemini');
                const res = await callGemini('Bạn là ai?', 'Hãy chào 1 câu phong cách tiên hiệp ngắn gọn.', 60, 0.7);
                notice('✓ Kết nối Gemini AI thành công! Phản hồi: ' + res);
                renderPanels();
              } catch (err: any) {
                notice('✕ ' + (err.message || 'Lỗi kết nối Gemini.'));
              } finally {
                testGeminiBtn.textContent = 'Kiểm tra kết nối Gemini AI';
              }
            },
          });
          client.requestAccessToken();
          return;
        }

        const { callGemini } = await import('../ai/gemini');
        const res = await callGemini('Bạn là ai?', 'Hãy chào 1 câu phong cách tiên hiệp ngắn gọn.', 60, 0.7);
        notice('✓ Kết nối Gemini AI thành công! Phản hồi: ' + res);
      } catch (err: any) {
        notice('✕ ' + (err.message || 'Lỗi kết nối Gemini.'));
      } finally {
        testGeminiBtn.textContent = 'Kiểm tra kết nối Gemini AI';
      }
    }, 'sm');

    keyRow.append(saveKeyBtn, testGeminiBtn);
    gemBox.append(
      h('div', { class: 'small muted', style: { marginBottom: '4px' } }, 'Gemini API Key (Tùy chọn nếu server đã có key chung, hoặc dùng key riêng):'),
      keyInput,
      keyRow,
      h('div', { class: 'small', style: { marginTop: '4px' } },
        '👉 Lấy mã miễn phí tại: ',
        h('a', {
          href: 'https://aistudio.google.com/app/apikey',
          target: '_blank',
          style: { color: 'var(--prime)', textDecoration: 'underline' }
        }, 'Google AI Studio (aistudio.google.com)'),
        h('div', { class: 'muted', style: { fontSize: '11px', marginTop: '2px' } }, 'Đăng nhập Google, bấm "Create API key" để lấy mã miễn phí 100%.')
      )
    );

    root.append(gemBox);

  } else {
    // Cấu hình Ollama
    const status = h('div', { class: 'small muted', style: { margin: '4px 0' } });
    const modelSel = h('select', { onchange: (e: Event) => setAi({ model: (e.target as HTMLSelectElement).value }) }, h('option', { value: st.model }, st.model));
    const checkBtn = btn('Kiểm tra Ollama', async () => {
      status.textContent = 'Đang kiểm tra Ollama...';
      try {
        const ms = await listModels();
        modelSel.innerHTML = '';
        for (const m of ms) modelSel.append(h('option', { value: m, selected: m === st.model }, m));
        status.textContent = `Kết nối thành công, có ${ms.length} model.`;
      } catch {
        status.textContent = 'Không kết nối được Ollama tại ' + st.url;
      }
    }, 'sm');

    root.append(
      h('div', { style: { margin: '8px 0' } }, 'Địa chỉ Ollama: ', h('input', { type: 'text', value: st.url, style: { width: '220px' }, onchange: (e: Event) => setAi({ url: (e.target as HTMLInputElement).value.trim() }) })),
      h('div', { style: { margin: '8px 0' } }, 'Model: ', modelSel, ' ', checkBtn),
      status
    );
  }

  // 3. Chế độ tự do
  root.append(h('h4', { style: { marginTop: '16px' } }, 'Chế độ tự do'));
  root.append(
    h('label', { style: { display: 'block', margin: '4px 0' } },
      h('input', { type: 'checkbox', checked: st.free, onchange: (e: Event) => setAi({ free: (e.target as HTMLInputElement).checked }) }),
      ' Mở hết xuất thân, nâng cấp luân hồi, tự chọn linh căn / thể chất'
    )
  );

  return [root];
}

function helpPanel(): HTMLElement[] {
  const P = (t: string, d: string) => h('p', { class: 'small' }, h('b', {}, t + '. '), d);
  return [
    P('Mục tiêu', 'Sống một kiếp tu tiên: từ phàm nhân bước lên Luyện Khí, Trúc Cơ, Kết Đan... tới Đại Thừa rồi độ kiếp phi thăng. Phần lớn sẽ chết giữa đường — đó là chuyện thường. Mỗi kiếp kết thúc được tính điểm, đổi thành điểm luân hồi để kiếp sau mạnh hơn.'),
    P('Thời gian', 'Mỗi hành động đều tốn thời gian. Cảnh giới càng cao, một lượt bế quan càng dài (Luyện Khí nửa năm, Nguyên Anh bốn năm...), nhưng thọ nguyên cũng dài hơn nhiều.'),
    P('Bản đồ', 'Kéo để di chuyển, cuộn hoặc nút +/− để phóng to. Bấm vào địa điểm để lên đường. Biểu tượng địa điểm: mái nhà = thôn, tường thành = thành trì, sạp hàng = phường thị, cổng điện = tông môn, núi cây khô = hiểm địa, cổng vòm = bí cảnh (chỉ mở theo chu kỳ). Dấu tròn: ? kỳ ngộ, ! nguy hiểm, rương = bảo vật, ổ khoá = bí ẩn — tự biến mất sau một thời gian.'),
    P('Tu luyện', 'Bế quan tăng tu vi. Mỗi cảnh giới có bốn tiểu cảnh (Sơ, Trung, Hậu, Viên Mãn). Viên Mãn đầy thì gặp bình cảnh, phải đột phá — có thể thất bại, bị thương, tâm ma tăng. Đan phá cảnh (Trúc Cơ Đan, Kết Kim Đan...) tăng mạnh tỉ lệ. Tông môn và hiểm địa có linh khí dày hơn.'),
    P('Linh căn & công pháp', 'Ít hành thì tu nhanh: Ngũ linh căn chậm nhất, Đơn và Dị linh căn nhanh nhất. Công pháp cùng hệ với linh căn tu nhanh; khác hệ thì chậm hẳn. Phế linh căn không tu được — phải tìm kỳ ngộ hoặc Tẩy Tủy Đan.'),
    P('Mười hệ', 'Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim và Băng. Băng khắc Thủy và Phong; Phong khắc Thổ và Lôi; Lôi khắc Mộc và Băng; Ám và Quang khắc nhau (Ám còn khắc Lôi, Quang khắc Băng). Khắc hệ +50% sát thương, bị khắc −25%. Xem đầy đủ ở Thiên Cơ Lâu › Đồ giám › Linh căn.'),
    P('Chiến đấu', 'Tự động theo lượt. Thuật pháp mang theo (tối đa 4) quyết định cách đánh. Phù lục trong túi tự dùng khi cần; đan chữa thương tự uống khi máu thấp. Có thể đặt ngưỡng tự bỏ chạy ở trang Nhân vật. Thua trận sinh tử là chết thật.'),
    P('Tông môn', '24 tông môn chia bốn bậc: hạ tông (nhận dưới 30 tuổi), trung tông (22), thượng tông (18), thánh địa (16) — càng cao càng kén linh căn. Quá tuổi thì chỉ được mời làm khách khanh khi tu vi đủ cao. Đệ tử được bổng lộc mỗi năm, nhận nhiệm vụ lấy cống hiến, đổi bí kíp và đan dược, thăng bậc tới trưởng lão.'),
    P('Trang bị', 'Năm ô: vũ khí, hộ giáp, linh bảo, giới chỉ (mở rộng túi), ngoa hài. Đồ nhặt được phải luyện hóa (tốn thời gian, chạy ngầm) mới mang được. Đồ tự luyện thì nhận chủ ngay.'),
    P('Luyện chế', 'Luyện đan cần đan phương + linh thảo. Chế phù cần phù chỉ, chu sa và một vật dẫn. Luyện khí cần khoáng và vật liệu yêu thú. Học nghề ở phường thị hoặc trong tông môn có truyền nghề.'),
    P('Nhân mạch', 'Người quen cũng tu luyện, già đi và chết. Gặp gỡ, tặng quà, luận bàn để thân hơn; thân thiết đủ có thể kết đạo lữ để song tu. Kẻ thù có thể tìm tới tận nơi.'),
    P('Phong Thần Lượng Kiếp', 'Ở Hồng Hoang, từ Kim Tiên đến Chuẩn Thánh sẽ xuất hiện lựa chọn nhập kiếp. Nếu đứng ngoài, thiên mệnh diễn ra theo thần thoại; nếu gia nhập hoặc tự lập đạo thống, ngươi trở thành biến số. Phe thắng nhận +2 khí vận, phe đầu hàng hoặc diệt vong mất 1. Người tử trận được ghi lên Phong Thần Bảng và nhận thần chức Thiên Đình. Lượng kiếp không có hạn năm cố định, chỉ kết thúc khi còn một phe.'),
    P('Đấu giá', 'Thiên Kinh, Vân Mộng Thành và Vọng Hải Thành có nhà đấu giá, mở phiên vào năm chẵn. Có thể ký gửi đồ quý để bán giá cao.'),
    P('Luân hồi', 'Điểm luân hồi dùng ở màn đầu thai để mua thêm lượt gieo mệnh, thuộc tính khởi đầu, mở xuất thân hiếm... Thế giới tiếp tục qua các kiếp — kiếp sau có thể tìm thấy động phủ của chính mình kiếp trước.'),
    P('AI kể chuyện', 'Bật ở Cài đặt nếu máy có Ollama. AI kể lại phần mở đầu và kết quả của mọi sự kiện; tắt AI thì dùng lời kể cố định. Kết quả không đổi.'),
  ];
}
export { esc, openModal, closeModal, BODIES, STAGES, LOCS };

// ---------- Thiên Cơ Lâu ----------
/** Nhóm trang: mỗi nhóm một hàng tab phụ. Đồ giám cũ nằm trong nhóm thứ tư. */
const TC_GROUPS: [string, string[]][] = [
  ['Nhân vật', ['Thiên Kiêu Bảng', 'Cường Giả Bảng', 'Đan Sư Bảng', 'Khí Sư Bảng', 'Phù Sư Bảng']],
  ['Thế lực', ['Thế Lực Bảng', 'Tông môn', 'Hoàng triều', 'Thế gia']],
  ['Pháp bảo', ['Công pháp', 'Thuật pháp', 'Pháp Bảo Bảng', 'Thiên Tài Địa Bảo', 'Đan Lô Bảng', 'Luyện Khí Đỉnh Bảng', 'Phù Bút Bảng']],
  ['Đồ giám', ['Linh căn', 'Địa danh', 'Yêu thú', 'Vật phẩm']],
  ['Phong Thần', ['Phong Thần Bảng']],
  ['Về Thiên Cơ Lâu', []],
];
const tcSub: Record<number, number> = {};
const tcSearch: Record<string, string> = {};
const subTabsEl = (g: number, names: string[]) => h('div', { class: 'tabs' }, ...names.map((n, i) => h('button', { class: i === (tcSub[g] || 0) ? 'on' : '', onclick: () => { tcSub[g] = i; renderPanels(); } }, n)));
const CRAFT_ORDER: CraftK[] = ['alch', 'forge', 'talis'];

function tiencoPanel(): HTMLElement[] {
  const w = s.world ?? 0;
  const out: HTMLElement[] = [tabsEl('tienco', TC_GROUPS.map((g) => g[0]))];
  const g = Math.min(open.get('tienco')!.tab, TC_GROUPS.length - 1);
  const names = TC_GROUPS[g][1];
  if (names.length) out.push(subTabsEl(g, names));
  const t = Math.min(tcSub[g] || 0, Math.max(0, names.length - 1));
  const searchKey = `${g}:${t}`;
  const query = tcSearch[searchKey] || '';
  let composing = false;
  const updateSearch = (input: HTMLInputElement) => {
    tcSearch[searchKey] = input.value;
    if (composing) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    renderPanels();
    const next = open.get('tienco')?.el.querySelector<HTMLInputElement>('.tc-search input');
    if (next) {
      next.focus();
      next.setSelectionRange(start, end);
    }
  };
  out.push(h('div', { class: 'tc-search' },
    h('input', {
      type: 'search',
      placeholder: 'Tìm trong trang này…',
      'aria-label': 'Tìm trong Thiên Cơ Lâu',
      value: query,
      oninput: (e: Event) => updateSearch(e.currentTarget as HTMLInputElement),
      oncompositionstart: () => { composing = true; },
      oncompositionend: (e: Event) => { composing = false; updateSearch(e.currentTarget as HTMLInputElement); },
    }),
    h('span', { class: 'tc-search-count', 'aria-live': 'polite' }),
  ));
  if (g === 5) {
    out.push(h('div', { class: 'small muted' }, `Phân lâu ${worldName(w)}. Bảng chỉ ghi người và thế lực đang đứng trong giới này; các giới khác có bảng riêng. Đồ giám thiên hạ cũng do Thiên Cơ Lâu biên soạn.`));
    for (const x of TC_INTRO) out.push(h('p', { class: 'small' }, x));
    out.push(h('h4', {}, 'Ngươi trong mắt Thiên Cơ Lâu'));
    out.push(kv('Tuổi thân thể', `${fmt(age())} / thọ nguyên ${fmt(maxLife())}`));
    out.push(kv('Tuổi linh hồn', fmt(soulAge()), 'Không đặt lại khi phi thăng'));
    out.push(kv('Đã sống', `${fmt(lifeLived())} năm · phi thăng ${w} lần`));
    out.push(kv('Thứ hạng', `Thiên Kiêu ${myRank('tk') || '—'} · Cường Giả ${myRank('cg') || '—'}`));
    out.push(kv('Tay nghề', CRAFT_ORDER.map((k) => { const r = masterBoard(k).find((x) => x.mine); return `${CRAFT_N[k]} ${r ? 'hạng ' + r.rank : '—'}`; }).join(' · ')));
    out.push(h('h4', {}, 'Hồi hạ giả — trẻ được Hỗn Độn đưa về Thương Lan'));
    const list = h('div', { class: 'list' });
    const rp = retPeople();
    if (!rp.length) list.append(h('div', { class: 'empty' }, 'Thiên Cơ Lâu chưa ghi nhận ai trong giới này.'));
    for (const p of rp) {
      const where = p.alive ? `${worldName(p.world)} · ${realmTxt(p.r, p.st)} · thân thể ${fmt(s.year - p.born)} tuổi, linh hồn ${fmt(s.year - p.soulBorn)} tuổi${p.asc ? ` · phi thăng ${p.asc} lần` : ''}` : `đã ${p.cause} năm ${Math.floor(p.died || 0)}`;
      const n = p.npc ? s.npcs.find((x) => x.id === p.npc) : undefined;
      list.append(h('div', { class: 'item' }, h('div', { class: 'ic ic-svg rel-av', html: p.known ? avatarSvg(p.g, p.r, p.el, 34, n ? npcPic(n) : undefined) : avatarSvg('m', 0, null, 34) }),
        h('div', { class: 'nm' }, h('b', {}, p.known ? p.name : 'Chưa rõ danh tính'), ' ', h('span', { class: 'pill' }, p.known ? p.ret : '?'),
          h('small', {}, p.known ? where : 'Thiên Cơ Lâu biết có một người như vậy đang ở Thương Lan nhưng không bán tin này. Gặp mặt, hoặc mua Thiên Cơ Lục từ người áo xám.')),
        p.known && n && n.alive ? h('div', { class: 'acts' }, btn('Gặp', () => meetNpc(n.id), 'small')) : null));
    }
    out.push(list);
    return out;
  }
  if (g === 0) {
    if (t <= 1) out.push(...peopleBoard(t === 0 ? 'tk' : 'cg'));
    else out.push(...masterRows(CRAFT_ORDER[t - 2]));
  } else if (g === 1) {
    out.push(h('div', { class: 'small muted' }, t === 0
      ? `Thế Lực Bảng ${worldName(w)}: tông môn, hoàng triều, thế gia chung một bảng, xếp theo cảnh giới cao nhất trong thế lực rồi tới bậc và linh khí đất đóng.`
      : t === 1 ? 'Tông môn xếp theo lão tổ mạnh nhất, rồi bậc tông và linh khí nơi dựng sơn môn.'
      : t === 2 ? 'Hoàng triều phàm trần có tu sĩ hộ quốc. Mỗi châu chỉ một triều đình chính; thuộc quốc xếp dưới chủ của mình.'
      : `${Object.keys(CLANS).length} thế gia tu chân lớn của Thương Lan Giới, xếp theo cảnh giới lão tổ. Quan hệ giữa các nhà ảnh hưởng tới kẻ thù, đồng minh và hôn ước của con cháu.`));
    out.push(...forceRows(t === 0 ? undefined : (['sect', 'empire', 'clan'] as ForceKind[])[t - 1]));
  } else if (g === 2) {
    if (t === 0) out.push(...lawBoard('tech'));
    else if (t === 1) out.push(...lawBoard('skill'));
    else if (t === 2) out.push(...baoRows(treasureBoard(), `Pháp Bảo Bảng ${worldName(w)}: danh khí thiên hạ xếp theo giai, phẩm. Pháp bảo Thiên giai trở lên ngươi đang mang cũng được ghi tên.`));
    else if (t === 3) out.push(...tbRows());
    else { const k = CRAFT_ORDER[t - 4]; out.push(...baoRows(toolBoard(k), `Bảng ${TOOL_N[k]} ${worldName(w)}: pháp khí luyện chế quý nhất giới, hầu hết nằm trong tay các danh sư đứng đầu Bảng ${MASTER_N[k]}.`)); }
  } else if (g === 3) {
    out.push(...codexBody((['root', 'loc', 'beast', 'item'] as const)[t], query));
  } else if (g === 4) {
    const campaign = fengshenData();
    if (!campaign) out.push(h('div', { class: 'empty' }, 'Phong Thần Lượng Kiếp chưa xuất hiện trong kiếp này.'));
    else {
      out.push(h('div', { class: 'small muted' }, campaign.ended
        ? `Lượng kiếp đã kết thúc. Phe thắng: ${campaign.winner ?? 'không rõ'}.`
        : `Lượng kiếp đang diễn ra, chưa định năm kết thúc. Số trận đã qua: ${campaign.round}.`));
      out.push(...campaign.sides.map((side) => kv(side.name, side.status === 'active' ? `Còn thế lực ${side.power}` : side.status === 'surrendered' ? 'Đã đầu hàng' : side.status === 'allied' ? 'Đã quy thuận' : 'Đã tan rã')));
      out.push(h('h4', {}, `Danh sách sắc phong · ${campaign.board.length} người`));
      out.push(h('div', { class: 'small muted' }, `Phong Thần Bảng định sẵn ${FENGSHEN_TOTAL} thần vị. Người tử trận ngoài danh sách vẫn được sắc phong vào các bộ thần còn trống.`));
      const list = h('div', { class: 'list' });
      if (!campaign.board.length) list.append(h('div', { class: 'empty' }, 'Chưa có người tử trận Phong Thần.'));
      for (const entry of campaign.board) {
        list.append(h('div', { class: 'item' },
          h('div', { class: 'nm' }, h('b', {}, entry.name), ' ', h('span', { class: 'pill' }, entry.faction),
            h('small', {}, `${entry.office}${entry.dept ? ` · ${entry.dept}` : ''} · sắc phong năm ${entry.year}`))));
      }
      out.push(list);
    }
  } else {
    out.push(h('div', { class: 'small muted' }, 'Chọn một mục trên các tab để xem bảng của Thiên Cơ Lâu.'));
  }
  return out;
}

function searchKeyText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

function applyTcSearch(query: string) {
  const bd = open.get('tienco')?.el.querySelector<HTMLElement>('.win-b');
  if (!bd) return;
  const terms = searchKeyText(query).trim().split(/\s+/).filter(Boolean);
  const rows = [...bd.querySelectorAll<HTMLElement>('.item, .kv, p')];
  let count = 0;
  for (const row of rows) {
    const matches = !terms.length || terms.every((term) => searchKeyText(row.textContent || '').includes(term));
    row.hidden = !matches;
    if (matches) count++;
  }
  for (const group of bd.querySelectorAll<HTMLElement>('.tc-beast-desc')) {
    const key = group.dataset.beastKey || '';
    group.hidden = terms.length === 0 && !cxBeastOpen.has(key);
  }
  for (const empty of bd.querySelectorAll<HTMLElement>('.empty')) empty.hidden = terms.length > 0;
  const countEl = bd.querySelector<HTMLElement>('.tc-search-count');
  if (countEl) countEl.textContent = terms.length ? `${count} kết quả` : '';
  let noResults = bd.querySelector<HTMLElement>('.tc-search-empty');
  if (terms.length && count === 0) {
    if (!noResults) {
      noResults = h('div', { class: 'empty tc-search-empty' }, 'Không tìm thấy kết quả.');
      bd.append(noResults);
    }
    noResults.hidden = false;
  } else if (noResults) noResults.hidden = true;
}
/** Thế lực của một người trên bảng: tông môn / triều đình / tán tu. */
/** Chức vụ hiển thị trên bảng: người chơi lấy chức trong tông / triều / tộc, người khác lấy từ dòng bảng. */
function roleOf(r: TcRow): string {
  if (!r.mine) return r.role || 'không chức vụ';
  if (s.sect && SECTS[s.sect.id]) return rankLabel(s.sect.rank, SECTS[s.sect.id], s.g);
  return courtTitle() || (s.flags.clanHead ? 'Gia chủ' : s.flags.clan ? 'Con cháu đích hệ' : 'không chức vụ');
}
function forceOf(r: TcRow): string {
  if (r.mine) return s.sect && SECTS[s.sect.id] ? SECTS[s.sect.id].n : s.flags.court?.id && EMPIRES[s.flags.court.id] ? EMPIRES[s.flags.court.id].n : 'Tán tu';
  if (r.force) return r.force;
  if (r.person && !r.npc) return r.person.sect || 'Tán tu';
  if (r.npc) return r.npc.sect && SECTS[r.npc.sect] ? SECTS[r.npc.sect].n : 'Tán tu';
  return 'Tán tu';
}
/** Thiên Kiêu Bảng / Cường Giả Bảng (gồm cả yêu tu hóa hình). */
function peopleBoard(kind: 'tk' | 'cg'): HTMLElement[] {
  const w = s.world ?? 0;
  const out: HTMLElement[] = [];
  const rows: TcRow[] = board(kind);
  const me = rows.find((r) => r.mine);
  const nBeast = rows.filter((r) => r.person?.beast || r.npc?.beast || (r.mine && s.beast)).length;
  const nRace = rows.filter((r) => r.person?.race || r.person?.races?.length).length;
  out.push(h('div', { class: 'small muted' }, (kind === 'tk'
    ? `Thiên Kiêu Bảng ${worldName(w)}: tu sĩ có thân thể không quá ${fmt(TK_AGE[w])} tuổi (yêu tu không quá ${fmt(TK_AGE[w] * 4)} tuổi), xếp theo thực lực tổng hợp; bằng điểm thì người trẻ hơn đứng trước. Xét toàn giới, mọi chủng tộc; chỉ lấy top 100. ${me ? `Ngươi hạng ${me.rank}/${rows.length}.` : s.r === 0 ? 'Phàm nhân không có tên trên bảng.' : age() > (s.beast ? TK_AGE[w] * 4 : TK_AGE[w]) ? `Ngươi đã quá tuổi bảng (${fmt(s.beast ? TK_AGE[w] * 4 : TK_AGE[w])} tuổi), không còn trên bảng.` : 'Ngươi chưa lọt top 100.'}`
    : `Cường Giả Bảng ${worldName(w)}: xếp theo thực lực tổng hợp trên toàn giới; bằng điểm thì người trẻ hơn đứng trước. Chỉ lấy top 100. ${me ? `Ngươi hạng ${me.rank}/${rows.length}.` : 'Ngươi chưa có tên.'}`) + (nBeast ? ` Trên bảng có ${nBeast} yêu tu hóa hình.` : '')));
  if (nRace) out.push(h('div', { class: 'small muted' }, `Trong bảng còn có ${nRace} người thuộc dị tộc cổ.`));
  const list = h('div', { class: 'list' });
  const shown = rows;
  if (!shown.length) list.append(h('div', { class: 'empty' }, 'Bảng trống.'));
  for (const r of shown) {
    const beast = r.person?.beast ?? r.npc?.beast ?? (r.mine ? s.beast : undefined);
    const race = r.person?.race ?? r.npc?.race ?? (r.mine ? s.race : undefined);
    const races = r.person?.races ?? (race ? [race] : []);
    const el = r.npc?.el ?? r.person?.el ?? null;
    const pic = r.mine ? playerPortrait(s.g, age()) : r.npc ? npcPic(r.npc) : undefined;
    const hiddenRet = !!r.person?.ret && !r.person.known;
    list.append(h('div', { class: 'item' + (r.mine ? ' mine' : '') }, h('div', { class: 'rk-i' }, String(r.rank)),
      h('div', { class: 'ic ic-svg rel-av' + (r.npc || r.mine ? ' click' : ''), title: r.npc || r.mine ? 'Xem tranh' : '', onclick: r.mine ? () => openPortrait(s.name, pic!, s.g, stageName(), weaponKind()) : r.npc ? () => openPortrait(r.npc!.name, npcPic(r.npc!), r.npc!.g, npcRealm(r.npc!), 'quyen', npcPicWanted(r.npc!), r.npc!.id, r.age) : undefined, html: avatarSvg(r.g, r.r, hiddenRet ? null : el, 34, pic) }),
      h('div', { class: 'nm' }, h('b', {}, r.name), ' ', r.mine ? h('span', { class: 'pill' }, 'Ngươi') : null, beast ? h('span', { class: 'pill', title: `${beast} hóa hình` }, 'Yêu tu') : null, ...races.map((race) => h('span', { class: 'pill', title: MYTHIC_RACES.find((entry) => entry.n === race)?.d || race }, race)), r.person?.ret && r.person.known ? h('span', { class: 'pill', title: r.person.ret }, 'Hồi hạ giả') : null, r.person?.asc ? h('span', { class: 'pill' }, `Phi thăng ${r.person.asc}`) : null,
        h('small', {}, `${realmTxt(r.r, r.st)} · Thực lực ${fmt(r.power ?? 0)} · ${fmt(r.age)} tuổi${r.soul !== r.age ? ` (linh hồn ${fmt(r.soul)})` : ''} · ${forceOf(r)} · ${roleOf(r)}${r.daoHao ? ` · Đạo hiệu: ${r.daoHao}` : ''}${beast ? ` · ${beast}${r.person?.blood ? ' — ' + r.person?.blood : ''}` : ''}${r.person?.races?.length ? ` · ${r.person.races.join(' · ')}` : r.person?.race ? ` · ${r.person.race}` : ''}`)),
      r.npc && r.npc.alive ? h('div', { class: 'acts' }, btn('Gặp', () => meetNpc(r.npc!.id), 'small')) : null));
  }
  out.push(list);
  if (rows.length > shown.length) out.push(h('div', { class: 'small muted' }, `… còn ${rows.length - shown.length} người nữa.`));
  return out;
}
