import { openAuthModal } from './auth-modal';
import { getCurrentUser, isLoggedIn } from '../engine/auth';
// Màn hình toàn trang: mở đầu, đầu thai, cái chết, phi thăng.
import { askConfirm, notice } from './dialog';
import { glyphSvg } from './glyph';
import { h, $, btn } from './dom';
import { s, meta, saveMeta, load, getActiveSlot, setActiveSlot, getAllSlotsInfo, MAX_SAVE_SLOTS } from '../engine/state';
import { openSaveSlotsModal } from './save-slots-modal';
import { setSurname, ORIGINS, originName, originDesc, RACE_GROUPS, RACE_INFO, originRace, PERKS, BEAST_PERKS, ROOTS, BODIES, BEAST_BODIES, STATS, STAT_KEYS, EL, REALMS, BASIC_EL, ALL_EL, YINYANG_EL, EVERY_EL, hiddenRootKind, rootKindOf, type El, type StatKey } from '../data/core';
import { LOCS, beastLeafNodes, getBeastFamilies, rollWeightedBeastFamilies, type BeastFamilyInfo } from '../data/world';
import { rollFate, rollRoot, fitRoot, newLife, rerolls, freeMode, UPGRADES, upLv, buyUpgrade, originUnlocked, unlockOrigin, scoreParts, lastLife, perkAllowed, getOriginTier, rollWeightedRaceOrigins, getHumanOriginTier, rollWeightedHumanOrigins, type Fate } from '../engine/life';
import { mkName } from '../engine/core';
import { mkRaceName, applyRaceSurname } from '../engine/race-names';
import { pick, wpick, shuffle } from '../core/util';
import { biography, aiBlockReason } from '../ai/ollama';
import { avatarSvg, playerPortrait } from './hud';
import { identifyYaoSpecies, ensurePlayerYaoSurname } from '../engine/yao-territory';

const scr = $('#screen');
let onStart: () => void = () => {};
export const setOnStart = (f: () => void) => (onStart = f);
export const runOnStart = () => onStart();

function showScreen(...kids: (HTMLElement | null)[]) {
  const keep = scr.dataset.keep === '1' ? scr.scrollTop : 0;
  scr.dataset.keep = '';
  scr.innerHTML = '';
  scr.append(h('div', { class: 'wrap' }, ...kids));
  scr.hidden = false;
  scr.scrollTop = keep;
}
export const hideScreen = () => (scr.hidden = true);

// ---------- Mở đầu ----------
export function titleScreen() {
  const activeSlot = getActiveSlot();
  const hasSave = load(activeSlot);
  const allSlots = getAllSlotsInfo();
  const usedCount = allSlots.filter((x) => x.hasSave).length;

  showScreen(
    h('div', { class: 'title-big', html: glyphSvg('title', 96, 1.3) }),
    h('div', { class: 'title-vn' }, 'TIÊN LỘ MẠN MẠN'),
    h('p', { class: 'center', style: { maxWidth: '560px', margin: '0 auto 22px', fontStyle: 'italic' } },
      'Thương Lan Giới, linh khí suy vi. Trăm vạn người cầu tiên, mấy ai thành đạo? Một kiếp người ngắn ngủi — ngươi sẽ đi được bao xa trên con đường dài dằng dặc ấy?'),
    h('div', { class: 'center', style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
      hasSave ? btn(`Tiếp tục: ${s.name} (Bản lưu ${activeSlot})`, () => { hideScreen(); onStart(); }, 'prime') : null,
      btn(`📂 Chọn bản lưu (${usedCount}/${MAX_SAVE_SLOTS})`, () => openSaveSlotsModal(() => titleScreen()), 'prime'),
      btn(hasSave ? 'Bỏ kiếp này, đầu thai mới' : 'Đầu thai', () => (hasSave ? askConfirm('Kiếp hiện tại sẽ bị bỏ và không được tính điểm luân hồi. Chắc chứ?', creation, { title: 'Đầu thai mới', ok: 'Bỏ kiếp này', danger: true }) : creation()), hasSave ? '' : 'prime'),
      meta.lives.length ? btn('Điện Luân Hồi', karmaHall) : null,
      btn(isLoggedIn() ? '☁️ ' + (getCurrentUser()?.displayName || 'Tài khoản') : '👤 Đăng nhập / Đăng ký', () => openAuthModal(() => titleScreen()), 'sm'),
    ),
    h('div', { class: 'slot-bar center', style: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' } },
      ...allSlots.map((info) => {
        const isCurrent = info.slot === activeSlot;
        const label = info.hasSave ? `Slot ${info.slot}: ${info.name}` : `Slot ${info.slot}: [Trống]`;
        const cls = isCurrent ? 'btn small prime' : info.hasSave ? 'btn small' : 'btn small ghost';
        return btn(isCurrent ? `★ ${label}` : label, () => {
          setActiveSlot(info.slot);
          titleScreen();
        }, cls, { title: info.hasSave ? `${info.name} · ${info.stageName} · ${info.worldName}` : `Bản lưu ${info.slot} còn trống` });
      })
    ),
    meta.lives.length ? h('p', { class: 'center small muted', style: { marginTop: '18px' } }, `${meta.lives.length} kiếp đã qua · điểm luân hồi ${meta.karma} · năm thế giới ${meta.worldYear}`) : null,
  );
}

// ---------- Điện luân hồi ----------
export function karmaHall(back: () => void = titleScreen) {


  const draw = () => {
    showScreen(
      h('h2', { class: 'center' }, 'Điện Luân Hồi'),
      h('p', { class: 'center muted' }, `Điểm luân hồi: `, h('b', {}, String(meta.karma))),
      h('div', { class: 'opts' }, ...UPGRADES.map((u) => {
        const lv = upLv(u.id);
        const max = lv >= u.max;
        const cost = u.cost(lv);
        return h('button', { class: 'opt', disabled: max || meta.karma < cost, onclick: () => { buyUpgrade(u.id); draw(); } },
          h('b', {}, `${u.n} (${lv}/${u.max})`), h('small', {}, u.d), h('small', {}, max ? 'Đã tối đa' : `Giá: ${cost} điểm`));
      })),
      h('h3', {}, 'Xuất thân hiếm'),
      h('div', { class: 'opts' }, ...ORIGINS.filter((o) => o.karma).sort((a, b) => getOriginTier(b).tier - getOriginTier(a).tier || (b.money ?? 0) - (a.money ?? 0)).map((o) => h('button', { class: 'opt', disabled: originUnlocked(o.id) || meta.karma < (o.karma || 0), onclick: () => { unlockOrigin(o.id); draw(); } },
        h('b', {}, originName(o)), h('small', {}, originDesc(o)), h('small', {}, originUnlocked(o.id) ? 'Đã mở' : `Mở khóa: ${o.karma} điểm`)))),
      h('div', { class: 'center', style: { marginTop: '18px' } }, btn('Trở lại', back, 'prime')),
    );
  };
  draw();
}

export const getTierStyle = (tier: number) => {
  switch (tier) {
    case 5:
      return {
        color: '#d97706',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: '#f59e0b',
        icon: '👑 ',
      };
    case 4:
      return {
        color: '#7c3aed',
        bg: 'rgba(139, 92, 246, 0.12)',
        border: '#c084fc',
        icon: '★ ',
      };
    case 3:
      return {
        color: '#2563eb',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: '#93c5fd',
        icon: '◆ ',
      };
    case 2:
      return {
        color: '#059669',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: '#86efac',
        icon: '✦ ',
      };
    default:
      return {
        color: '#78716c',
        bg: 'rgba(120, 113, 108, 0.12)',
        border: '#d6d3d1',
        icon: '• ',
      };
  }
};

const getRootTier = (rk: (typeof ROOTS)[number]) => {
  if (rk.q >= 7) return { ...getTierStyle(5), tier: 5, tierName: 'Thần Phẩm' };
  if (rk.q >= 5) return { ...getTierStyle(4), tier: 4, tierName: 'Thiên Phẩm' };
  if (rk.q === 4) return { ...getTierStyle(3), tier: 3, tierName: 'Địa Phẩm' };
  if (rk.q === 3) return { ...getTierStyle(2), tier: 2, tierName: 'Huyền Phẩm' };
  return { ...getTierStyle(1), tier: 1, tierName: 'Hoàng Phẩm' };
};

const getBodyTier = (b: (typeof BODIES)[number] | (typeof BEAST_BODIES)[number]) => {
  if (b.id === 'hondon' || b.id === 'yeu_hondon' || b.id === 'thiendo') {
    return { ...getTierStyle(5), tier: 5, tierName: 'Thần Phẩm' };
  }
  if (b.w <= 4) {
    return { ...getTierStyle(4), tier: 4, tierName: 'Thiên Phẩm' };
  }
  if (b.w <= 8) {
    return { ...getTierStyle(3), tier: 3, tierName: 'Địa Phẩm' };
  }
  if (b.w <= 15) {
    return { ...getTierStyle(2), tier: 2, tierName: 'Huyền Phẩm' };
  }
  return { ...getTierStyle(1), tier: 1, tierName: 'Hoàng Phẩm' };
};

const getPerkTier = (p?: (typeof PERKS)[number] | (typeof BEAST_PERKS)[number]) => {
  if (!p) {
    return {
      tier: 1,
      tierName: 'Hoàng Phẩm',
      color: '#78716c',
      bg: 'rgba(120, 113, 108, 0.1)',
      border: '#a8a29e',
      icon: '• ',
    };
  }
  if (p.bad) {
    return {
      tier: 0,
      tierName: 'Hung Phẩm',
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)',
      border: '#f87171',
      icon: '🔴 ',
    };
  }
  const t5 = ["binhchu","mahuyet","vuthe","batkhuat","hoangdao","chiton","hondon_the","luanhoi_tam","thanh_the","tien_can","thien_menh","yeudan","yeu_taico","yeu_tothu","yeu_honnguyen","yeu_thontian","yeu_batdiet","yeu_long_to","yeu_phuong_hoang","yeu_thao_thiet","yeu_bach_trach"];
  if (t5.includes(p.id)) {
    return { ...getTierStyle(5), tier: 5, tierName: 'Thần Phẩm' };
  }
  const t4 = ["kiemtam","menhcung","samhoi","cuongchien","phuctinh","chanhan","trandao","dandao","loi_phap","kiem_y","kim_than","thuan_duong","thai_am","thien_ngan","phu_than","khi_vuong","am_duong","than_thong","than_phap","thuong_khung","vo_ngiem","van_linh","long_khi","quy_nguyen","yeu_thoaicot","yeu_huyetkhi","yeu_hungtinh","yeu_thienkhang","yeu_quytuc","yeu_doatthien","yeu_longuy","yeu_nguphong","yeu_huyet_te","yeu_ky_lan","yeu_huyen_vu","yeu_chu_tuoc","yeu_bach_ho","yeu_kim_bang","yeu_hoa_hinh","yeu_ngung_dan","yeu_ma_dong","yeu_loi_dinh","yeu_huyen_am","yeu_phan_cot","yeu_trieu_hoan","yeu_khong_gian","yeu_sinh_menh","yeu_pha_giap"];
  if (t4.includes(p.id)) {
    return { ...getTierStyle(4), tier: 4, tierName: 'Thiên Phẩm' };
  }
  const t3 = ["dangu","phusu","thuongnhan","tinhtam","dakhoe","duocdien","khicong","khuyenquyet","luyenthi","hoa_linh","thuy_tinh","phong_tinh","loi_tinh","tho_tinh","bang_tinh","quang_tinh","am_tinh","thien_tai","dieu_thu","cuong_luc","linh_nhan","tru_luc","chinh_phap","ngoc_cot","thuan_thao","tien_ngam","bat_dong","doc_duoc","kinh_nghiem","linh_thach","khong_tuoc","tam_kinh","yeu_nguyethoa","yeu_uyap","yeu_langiap","yeu_phehuyet","yeu_hoangda","yeu_mehoac","yeu_trangam","yeu_linhkhuu","yeu_cuongluc","yeu_doc_chua","yeu_dia_don","yeu_thuy_te","yeu_hoa_diem","yeu_bang_phach","yeu_phong_loi","yeu_am_sat","yeu_da_day","yeu_sung_nhon","yeu_tai_sinh","yeu_tieng_hu","yeu_da_day_2","yeu_phan_kich","yeu_cuong_thao","yeu_vuot_ho","yeu_duoi_doc","yeu_mat_u","yeu_long_nhim","yeu_khong_lo","yeu_chuot_vang","yeu_vo_oc","yeu_nhen_doc","yeu_song_am"];
  if (t3.includes(p.id)) {
    return { ...getTierStyle(3), tier: 3, tierName: 'Địa Phẩm' };
  }
  return { ...getTierStyle(2), tier: 2, tierName: 'Huyền Phẩm' };
};

// ---------- Đầu thai ----------
export function creation() {
  let g: 'm' | 'f' = Math.random() < 0.5 ? 'm' : 'f';
  let name = mkRaceName('Nhân tộc', g);
  let race: string = 'Nhân tộc';
  let offeredOriginRounds: (typeof ORIGINS)[number][][] = [rollWeightedRaceOrigins(race, 3)];
  let selectedOriginCardIdx = 0;
  let originRerollsLeft = 3;
  let showFullOriginCatalog = false;
  let originSearchQuery = '';
  let origin = offeredOriginRounds[0][0]?.id ?? ORIGINS[0].id;
  const isBeast = () => race === 'Yêu tộc' || !!ORIGINS.find((o) => o.id === origin)?.beastOrigin;
  const leafNodes = beastLeafNodes();
  const allBeastFamilies = getBeastFamilies();
  const roll3BeastFamilies = (): BeastFamilyInfo[] => rollWeightedBeastFamilies(allBeastFamilies, 3);
  let offeredBeasts: BeastFamilyInfo[] = roll3BeastFamilies().sort((a, b) => b.tier - a.tier);
  let beastRerollsLeft = 3;
  const BEAST_REROLL_KARMA_COST = 1;
  let showFullCatalog = false;
  let beastCatTab: string = 'taico';
  let beastSearchQuery: string = '';
  let chosenFamily: BeastFamilyInfo | null = offeredBeasts[0] || allBeastFamilies[0] || null;
  let chosenBeast: { n: string; el: El; reg?: string[]; home?: string } | null = isBeast()
    ? (chosenFamily ? { n: chosenFamily.starterName, el: chosenFamily.starterEl } : pick(leafNodes))
    : null;
  if (isBeast() && chosenFamily) {
    name = ensurePlayerYaoSurname(name, `${chosenFamily.starterName} ${chosenFamily.ancestor}`);
  }
  const pickOrigin = (o: (typeof ORIGINS)[number], cardIdx?: number) => {
    origin = o.id;
    if (cardIdx !== undefined) {
      selectedOriginCardIdx = cardIdx;
    } else {
      const flat = offeredOriginRounds.flat();
      const idx = flat.findIndex((x) => x.id === o.id);
      selectedOriginCardIdx = idx >= 0 ? idx : 0;
    }
    perks = perks.filter((x) => perkAllowed(origin, x));
    fate.root = { ...baseRoot };
    fitRoot(fate, o);
    if (isBeast()) {
      if (chosenFamily) {
        chosenBeast = { n: chosenFamily.starterName, el: chosenFamily.starterEl };
        name = ensurePlayerYaoSurname(name, chosenFamily.ancestor);
      } else {
        if (!chosenBeast) chosenBeast = pick(leafNodes);
        name = ensurePlayerYaoSurname(name, chosenBeast?.n);
      }
    } else if (o.clan && !name.startsWith(o.clan + ' ')) {
      name = setSurname(name, o.clan);
    }
    draw();
  };
  let lockedStats: Record<StatKey, boolean> = { can: false, ngo: false, van: false, mi: false, tam: false };
  let statsRerollsLeft = 3;
  let rootRerollsLeft = 3;
  let bodyRerollsLeft = 3;
  let showFullBodyCatalog = false;
  let offeredBodies: ((typeof BODIES)[number] | (typeof BEAST_BODIES)[number])[] = [];
  let selectedBodyCardIdx = 0;
  let perkRerollsLeft = 3;
  let showFullPerkCatalog = false;
  let extraPerkSlots = 0;
  let lockedPerkIds: string[] = [];

  const rollOneStat = (): number => {
    const r = Math.random();
    if (r < 0.08) return 10;
    if (r < 0.22) return 9;
    if (r < 0.40) return 8;
    if (r < 0.62) return 7;
    if (r < 0.82) return 6;
    if (r < 0.94) return 5;
    return Math.floor(Math.random() * 3) + 2;
  };

  let fate: Fate = rollFate(false, g, isBeast());
  for (const k of STAT_KEYS) {
    fate.stats[k] = rollOneStat();
  }
  let left = rerolls();
  let perks: string[] = [];
  const perkN = freeMode() ? (isBeast() ? BEAST_PERKS.length : PERKS.length) : 2 + upLv('perk'); // chế độ tự chọn: không giới hạn
  const freePicker = () => {
    const toggleEl = (e: El) => {
      const els = fate.root.els.includes(e) ? fate.root.els.filter((x) => x !== e) : [...fate.root.els, e];
      els.sort((x, y) => EVERY_EL.indexOf(x) - EVERY_EL.indexOf(y));
      fate.root = { k: rootKindOf(els), els };
      baseRoot = { ...fate.root };
      draw();
    };
    const setAll = (els: El[]) => { fate.root = { k: rootKindOf(els), els: [...els] }; baseRoot = { ...fate.root }; draw(); };
    const rk = ROOTS[fate.root.k];
    const rkTier = getRootTier(rk);
    const verdict = h('div', {
      class: 'card verdict' + (hiddenRootKind(fate.root.k) ? ' thap' : ''),
      style: {
        borderLeft: `4px solid ${rkTier.color}`,
        background: 'rgba(0,0,0,0.015)'
      }
    },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } },
        h('div', { class: 'small muted' }, 'Đánh giá linh căn'),
        h('span', { style: { fontSize: '11px', padding: '1px 6px', borderRadius: '3px', background: rkTier.bg, color: rkTier.color, border: `1px solid ${rkTier.border}`, fontWeight: 'bold' } },
          `${rkTier.icon}${rkTier.tierName}`
        )
      ),
      h('div', { class: 'v-name', style: { color: rkTier.color } },
        rk.n,
        fate.root.els.length ? h('span', { class: 'v-els' }, ...fate.root.els.map((e) => h('span', { class: 'el', style: { background: EL[e].c } }, EL[e].n))) : null
      ),
      h('div', { class: 'small', style: { marginTop: '2px' } }, `Tốc độ tu ×${rk.m} · phẩm chất ${rk.q}`),
      h('div', { class: 'small muted', style: { marginTop: '2px' } }, rk.d),
      hiddenRootKind(fate.root.k) ? h('div', { class: 'small', style: { color: 'var(--seal)', marginTop: '4px' } }, 'Ngươi tu luyện được ngay, với tư chất vượt trội. Nhưng các hệ cân bằng khiến đá trắc linh không sáng: thiên hạ coi ngươi là phế linh căn — tiên sư không thu, tông môn không nhận, người đời khinh rẻ — cho tới khi bí mật bị lộ.') : null,
    );
    const bodyFx = (b: (typeof BODIES)[number] | (typeof BEAST_BODIES)[number]) => {
      const f: string[] = [];
      if (b.cult) f.push(`tu luyện ×${b.cult}`);
      if (b.life) f.push(`thọ nguyên ×${b.life}`);
      if (b.hp) f.push(`khí huyết ×${b.hp}`);
      if (b.pow) f.push(`chiến lực ×${b.pow}`);
      if (b.luck) f.push(`khí vận +${b.luck}`);
      if (b.heal) f.push(`hồi phục ×${b.heal}`);
      if (b.alch) f.push(`luyện đan +${Math.round(b.alch * 100)}%`);
      if ('g' in b && b.g) f.push(b.g === 'f' ? 'chỉ nữ' : 'chỉ nam');
      return f.join(' · ') || 'không có gì đặc biệt';
    };

    const renderBodySection = () => {
      const isYao = isBeast();
      const allBodies = isYao ? BEAST_BODIES : BODIES.filter((b) => !b.g || b.g === g);
      const curBody = (isYao ? BEAST_BODIES.find((b) => b.id === fate.body) : null) || BODIES.find((b) => b.id === fate.body) || allBodies[0];

      if (offeredBodies.length === 0) {
        offeredBodies = [curBody];
        selectedBodyCardIdx = 0;
      }

      const doReroll1Body = () => {
        if (bodyRerollsLeft > 0) {
          bodyRerollsLeft--;
        } else {
          if (meta.karma < 1) return notice('Cần 1 Điểm Luân Hồi để quay lại Thể chất.', 'Thiếu điểm Luân Hồi');
          meta.karma -= 1;
          saveMeta();
        }
        const b = isYao ? pick(BEAST_BODIES) : wpick(allBodies, (item) => item.w);
        fate.body = b.id;
        offeredBodies = [b];
        selectedBodyCardIdx = 0;
        draw();
      };

      const free10Used = Math.min(bodyRerollsLeft, 10);
      const karma10Needed = 10 - free10Used;
      const bodyReroll10BtnLabel = karma10Needed === 0
        ? `🎲 Quay 10 lần (Miễn phí: 10/10)`
        : (free10Used > 0
            ? `🎲 Quay 10 lần (Dùng ${free10Used} miễn phí + ${karma10Needed} Luân Hồi)`
            : `🎲 Quay 10 lần (Tốn 10 Luân Hồi)`);

      const doReroll10Body = () => {
        if (karma10Needed > 0 && meta.karma < karma10Needed) {
          return notice(`Quay 10 lần cần ${free10Used > 0 ? `${free10Used} lượt miễn phí + ` : ''}${karma10Needed} điểm Luân Hồi (hiện có ${meta.karma}).`, 'Thiếu điểm Luân Hồi');
        }
        bodyRerollsLeft -= free10Used;
        if (karma10Needed > 0) {
          meta.karma -= karma10Needed;
          saveMeta();
        }
        const list: typeof allBodies = [];
        for (let i = 0; i < 10; i++) {
          list.push(isYao ? pick(BEAST_BODIES) : wpick(allBodies, (item) => item.w));
        }
        list.sort((a, b) => getBodyTier(b).tier - getBodyTier(a).tier);
        offeredBodies = list;
        selectedBodyCardIdx = 0;
        fate.body = list[0].id;
        draw();
      };

      const bodyReroll1BtnLabel = bodyRerollsLeft > 0
        ? `🎲 Quay 1 lần (Miễn phí: còn ${bodyRerollsLeft}/3)`
        : `🎲 Quay 1 lần (Tốn 1 Luân Hồi)`;

      return h('div', { style: { marginTop: '14px' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' } },
          h('h4', { style: { margin: 0 } }, offeredBodies.length > 1 ? (isYao ? 'Chọn 1 Trong 10 Thể Chất Yêu Tộc (10 Lần Quay)' : 'Chọn 1 Trong 10 Thể Chất Khởi Đầu (10 Lần Quay)') : (isYao ? 'Thể chất Yêu Tộc' : 'Thể chất Khởi Đầu')),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            btn(bodyReroll1BtnLabel, doReroll1Body, bodyRerollsLeft > 0 ? 'small prime' : 'small', {
              dis: bodyRerollsLeft <= 0 && meta.karma < 1
            }),
            btn(bodyReroll10BtnLabel, doReroll10Body, 'small prime', {
              dis: meta.karma < karma10Needed
            })
          )
        ),
        (() => {
          const curTier = getBodyTier(curBody);
          return h('div', {
            style: {
              border: `1.5px solid ${curTier.border}`,
              borderLeft: `4px solid ${curTier.color}`,
              background: 'rgba(0,0,0,0.015)',
              borderRadius: '6px',
              padding: '12px 14px',
              marginBottom: '10px',
            }
          },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                h('b', { style: { fontSize: '16px', color: curTier.color } }, `✨ ${curBody.n}`),
                h('span', { style: { fontSize: '11px', padding: '1px 6px', borderRadius: '3px', background: curTier.bg, color: curTier.color, border: `1px solid ${curTier.border}`, fontWeight: 'bold' } },
                  `${curTier.icon}${curTier.tierName}`
                )
              ),
              h('span', { style: { fontSize: '11.5px', color: 'var(--prime)', fontWeight: 'bold' } }, '✓ Đang kích hoạt')
            ),
            h('div', { style: { color: 'var(--ink)', fontSize: '12.5px', marginTop: '4px', fontWeight: '500' } }, bodyFx(curBody)),
            h('div', { class: 'small muted', style: { fontSize: '11px', marginTop: '2px', fontStyle: 'italic' } }, curBody.d)
          );
        })(),
        offeredBodies.length > 1 ? h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '4px',
            marginBottom: '10px'
          }
        },
          ...offeredBodies.map((b, idx) => {
            const isSel = selectedBodyCardIdx === idx;
            const bTier = getBodyTier(b);
            return h('button', {
              class: 'opt' + (isSel ? ' on' : ''),
              style: {
                textAlign: 'left',
                borderColor: isSel ? 'var(--prime)' : bTier.border,
                background: isSel ? 'var(--card-on, rgba(217, 119, 6, 0.08))' : undefined,
                boxShadow: isSel ? '0 0 0 1px var(--prime)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '10px 12px',
                cursor: 'pointer',
                borderRadius: '6px',
              },
              onclick: () => {
                selectedBodyCardIdx = idx;
                fate.body = b.id;
                draw();
              }
            },
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                  h('span', { style: { fontSize: '11px', padding: '1px 5px', borderRadius: '3px', background: isSel ? 'var(--prime)' : 'var(--muted)', color: '#fff', fontWeight: 'bold' } },
                    `#${idx + 1}`
                  ),
                  h('span', { style: { fontSize: '10.5px', padding: '1px 5px', borderRadius: '3px', background: bTier.bg, color: bTier.color, border: `1px solid ${bTier.border}`, fontWeight: 'bold' } },
                    `${bTier.icon}${bTier.tierName}`
                  )
                ),
                isSel ? h('span', { style: { fontSize: '11px', color: 'var(--prime)', fontWeight: 'bold' } }, '✓ Đang chọn') : null
              ),
              h('div', { style: { marginTop: '2px' } },
                h('b', { style: { fontSize: '15px', color: bTier.color } }, `✨ ${b.n}`)
              ),
              h('div', { style: { color: 'var(--ink)', fontSize: '12px', marginTop: '2px', fontWeight: '500' } }, bodyFx(b)),
              h('div', { class: 'small muted', style: { fontSize: '11px', fontStyle: 'italic', lineHeight: '1.4' } }, b.d)
            );
          })
        ) : null,
        freeMode() ? h('div', { style: { margin: '6px 0 10px' } },
          btn(showFullBodyCatalog ? '▲ Thu gọn danh sách toàn bộ thể chất' : '🔍 Tự do tìm chọn từ toàn bộ thể chất (Chế độ tự do)', () => {
            showFullBodyCatalog = !showFullBodyCatalog;
            draw();
          }, 'small ghost')
        ) : null,
        (freeMode() && showFullBodyCatalog) ? h('div', { class: 'opts', style: { maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' } },
          ...[...allBodies].sort((a, b) => getBodyTier(b).tier - getBodyTier(a).tier).map((b) => {
            const bTier = getBodyTier(b);
            const isSel = fate.body === b.id;
            return h('button', {
              class: 'opt' + (isSel ? ' on' : ''),
              style: { textAlign: 'left', borderColor: isSel ? 'var(--prime)' : undefined },
              onclick: () => { fate.body = b.id; draw(); }
            },
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } },
                h('b', { style: { color: bTier.color } }, `✨ ${b.n}`),
                h('span', { style: { fontSize: '10.5px', color: bTier.color, fontWeight: 'bold' } }, `${bTier.icon}${bTier.tierName}`)
              ),
              h('small', {}, bodyFx(b)),
              h('small', {}, b.d)
            );
          })
        ) : null
      );
    };
    if (isBeast()) {
      const yaoSpec = identifyYaoSpecies(chosenFamily ? `${chosenFamily.starterName} ${chosenFamily.ancestor}` : chosenBeast?.n);

      const rerollBtnLabel = beastRerollsLeft > 0
        ? `🎲 Đổi lại 3 loài (Miễn phí: còn ${beastRerollsLeft}/3)`
        : `🎲 Đổi lại 3 loài (Tốn ${BEAST_REROLL_KARMA_COST} Luân Hồi)`;

      const doReroll3Beasts = () => {
        if (beastRerollsLeft > 0) {
          beastRerollsLeft--;
        } else {
          if (meta.karma < BEAST_REROLL_KARMA_COST) {
            return notice(`Ngươi cần ít nhất ${BEAST_REROLL_KARMA_COST} Điểm Luân Hồi để đổi lại 3 loài Yêu Thú!`, 'Thiếu điểm Luân Hồi');
          }
          meta.karma -= BEAST_REROLL_KARMA_COST;
          saveMeta();
        }
        offeredBeasts = roll3BeastFamilies().sort((a, b) => b.tier - a.tier);
        chosenFamily = offeredBeasts[0];
        chosenBeast = { n: chosenFamily.starterName, el: chosenFamily.starterEl };
        name = ensurePlayerYaoSurname(name, chosenFamily.ancestor);
        draw();
      };

      const BEAST_TABS: { id: string; n: string }[] = [
        { id: 'taico', n: '👑 Thần Thú Thái Cổ' },
        { id: 'hau', n: '🐒 Hỗn Thế Thần Hầu' },
        { id: 'dieu', n: '🦅 Thần Cầm & Tiên Điểu' },
        { id: 'tu_hung', n: '👹 Tứ Hung & Cổ Ma' },
        { id: 'son_hai', n: '🐾 Sơn Hải Dị Thú' },
        { id: 'all', n: `🌐 Tất Cả (${allBeastFamilies.length})` },
      ];

      const q = beastSearchQuery.trim().toLowerCase();
      const visibleBeasts = allBeastFamilies.filter((fam) => {
        if (q) {
          return fam.ancestor.toLowerCase().includes(q) ||
                 fam.title.toLowerCase().includes(q) ||
                 fam.starterName.toLowerCase().includes(q) ||
                 fam.catName.toLowerCase().includes(q) ||
                 EL[fam.el].n.toLowerCase().includes(q);
        }
        if (beastCatTab === 'all') return true;
        return fam.cat === beastCatTab;
      }).sort((a, b) => b.tier - a.tier);



      return h('div', { class: 'free-pick' },
        h('h4', {}, 'Bản Thể Khởi Đầu & Tiềm Năng Huyết Mạch'),
        h('div', { class: 'card verdict' },
          h('div', { class: 'v-name', style: { fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
            `🌱 ${chosenFamily ? chosenFamily.starterName : (chosenBeast ? chosenBeast.n : 'Yêu thú')}`,
            chosenFamily ? h('span', { class: 'v-els' }, h('span', { class: 'el', style: { background: EL[chosenFamily.starterEl].c } }, EL[chosenFamily.starterEl].n)) : null,
            chosenFamily ? (() => {
              const ts = getTierStyle(chosenFamily.tier);
              return h('span', { style: { fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, fontWeight: 'bold' } },
                `${ts.icon}Tiềm năng: ${chosenFamily.tierName}`
              );
            })() : null
          ),
          chosenFamily ? (() => {
            const ts = getTierStyle(chosenFamily.tier);
            return h('div', { style: { margin: '6px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: '4px', borderLeft: `3px solid ${ts.color}` } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                h('span', { style: { fontWeight: 'bold', color: ts.color, fontSize: '13px' } },
                  `🔮 Tiềm năng thức tỉnh: ${chosenFamily.cat === 'taico' ? '👑 ' : chosenFamily.myth ? '★ ' : ''}${chosenFamily.ancestor}`
                ),
                h('span', { class: 'el', style: { background: EL[chosenFamily.el].c, fontSize: '11px' } }, EL[chosenFamily.el].n),
                h('span', { class: 'small muted' }, `(${chosenFamily.title})`)
              ),
              h('div', { class: 'small muted', style: { fontSize: '11px', marginTop: '3px' } },
                `➔ Lộ trình tiến hóa: ${chosenFamily.pathDesc}`
              )
            );
          })() : null,
          h('div', { class: 'small', style: { color: 'var(--prime)', margin: '4px 0', lineHeight: '1.4' } },
            `✨ Tiến hóa tự do: Ngươi bắt đầu từ loài sơ khai 【${chosenFamily?.starterName}】. Khi đột phá cảnh giới, ngươi tự do chọn các con đường nguyên tố (Lôi, Hỏa, Thủy, Băng...) để tiến hóa thức tỉnh sức mạnh tối thượng!`
          ),
          h('div', { class: 'small' }, `🐾 Họ tộc: 【${yaoSpec.surname}】 · Thánh địa cội nguồn: 【${yaoSpec.homeLocName}】`),
          h('div', { class: 'small muted' }, `Quy tắc Yêu tộc: Bắt đầu từ 1 tuổi, tuổi thọ gấp 4 lần nhân tộc, tu luyện yêu lực. Cùng một họ tộc che chở lẫn nhau.`),
        ),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '14px', marginBottom: '4px' } },
          h('h4', { style: { margin: 0 } }, 'Chọn 1 Trong 3 Loài Sơ Khai (Kèm Tiềm Năng Tiến Hóa)'),
          btn(rerollBtnLabel, doReroll3Beasts, beastRerollsLeft > 0 ? 'small prime' : 'small', {
            dis: beastRerollsLeft <= 0 && meta.karma < BEAST_REROLL_KARMA_COST
          })
        ),
        h('div', { class: 'small muted', style: { fontSize: '11px', marginBottom: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' } },
          h('span', {}, '🎲 Tỷ lệ xuất hiện giảm dần theo tiềm năng phẩm cấp:'),
          h('span', { style: { color: '#d97706', fontWeight: 'bold' } }, '👑 Thần Phẩm (~3%)'),
          h('span', {}, '<'),
          h('span', { style: { color: '#7c3aed', fontWeight: 'bold' } }, '★ Thiên Phẩm (~8%)'),
          h('span', {}, '<'),
          h('span', { style: { color: '#2563eb', fontWeight: 'bold' } }, '◆ Địa Phẩm (~18%)'),
          h('span', {}, '<'),
          h('span', { style: { color: '#059669', fontWeight: 'bold' } }, '✦ Huyền Phẩm (~35%)'),
          h('span', {}, '<'),
          h('span', { style: { color: '#78716c' } }, '• Hoàng Phẩm')
        ),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '12px' } },
          ...offeredBeasts.map((fam, idx) => {
            const isSel = chosenFamily?.ancestor === fam.ancestor;
            const tierStyle = getTierStyle(fam.tier);

            return h('button', {
              class: 'opt' + (isSel ? ' on' : ''),
              style: {
                textAlign: 'left',
                borderColor: isSel ? 'var(--prime)' : tierStyle.border,
                background: isSel ? 'var(--card-on, rgba(217, 119, 6, 0.08))' : undefined,
                boxShadow: isSel ? '0 0 0 1px var(--prime)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '12px 14px',
                cursor: 'pointer',
                borderRadius: '6px',
              },
              onclick: () => {
                chosenFamily = fam;
                chosenBeast = { n: fam.starterName, el: fam.starterEl };
                name = ensurePlayerYaoSurname(name, `${fam.starterName} ${fam.ancestor}`);
                draw();
              },
            },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                h('span', { style: { fontSize: '11px', padding: '1px 5px', borderRadius: '3px', background: isSel ? 'var(--prime)' : 'var(--muted)', color: '#fff', fontWeight: 'bold' } },
                  `#${idx + 1}`
                ),
                h('span', { style: { fontSize: '11px', padding: '1px 6px', borderRadius: '3px', background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}`, fontWeight: 'bold' } },
                  `${tierStyle.icon}Tiềm năng ${fam.tierName}`
                )
              ),
              h('span', { class: 'el', style: { background: EL[fam.starterEl].c, fontSize: '11px', padding: '1px 5px' } }, EL[fam.starterEl].n)
            ),
            h('div', { style: { marginTop: '2px' } },
              h('b', { style: { fontSize: '16px', color: 'var(--prime)' } },
                `🌱 ${fam.starterName}`
              ),
              h('span', { class: 'small muted', style: { marginLeft: '6px', fontSize: '11px' } }, '(Loài sơ khai)')
            ),
            h('div', { style: { background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '4px', marginTop: '2px' } },
              h('div', { style: { color: tierStyle.color, fontWeight: 'bold', fontSize: '12.5px' } },
                `🔮 Tiềm năng: ${fam.cat === 'taico' ? '👑 ' : fam.myth ? '★ ' : ''}${fam.ancestor} [${EL[fam.el].n}]`
              ),
              h('div', { class: 'small muted', style: { fontSize: '11px', marginTop: '2px', fontStyle: 'italic' } },
                fam.title
              ),
              h('div', { class: 'small muted', style: { fontSize: '10.5px', marginTop: '4px', borderTop: '1px dashed var(--border)', paddingTop: '3px' } },
                `➔ ${fam.pathDesc}`
              )
            ),
            isSel ? h('div', { style: { fontSize: '11px', color: 'var(--prime)', fontWeight: 'bold', textAlign: 'right', marginTop: '2px' } }, '✓ Đang chọn') : null
            );
          })
        ),
        freeMode() ? h('div', { style: { margin: '8px 0' } },
          btn(showFullCatalog ? '▲ Thu gọn danh mục toàn bộ' : '🔍 Tự do tìm chọn từ toàn bộ phả hệ (Chế độ tự do)', () => {
            showFullCatalog = !showFullCatalog;
            draw();
          }, 'small ghost')
        ) : null,
        (freeMode() && showFullCatalog) ? (() => {
          const listContainer = h('div', { class: 'opts', style: { maxHeight: '200px', overflowY: 'auto' } });

          const renderVisibleBeasts = () => {
            const query = beastSearchQuery.trim().toLowerCase();
            const visible = allBeastFamilies.filter((fam) => {
              if (query) {
                return fam.ancestor.toLowerCase().includes(query) ||
                       fam.title.toLowerCase().includes(query) ||
                       fam.starterName.toLowerCase().includes(query) ||
                       fam.catName.toLowerCase().includes(query) ||
                       EL[fam.el].n.toLowerCase().includes(query) ||
                       EL[fam.starterEl].n.toLowerCase().includes(query);
              }
              if (beastCatTab === 'all') return true;
              return fam.cat === beastCatTab;
            });

            listContainer.innerHTML = '';
            if (visible.length === 0) {
              listContainer.append(h('div', { class: 'small muted', style: { padding: '12px', textAlign: 'center' } }, 'Không tìm thấy thần thú nào phù hợp từ khóa.'));
            } else {
              visible.forEach((fam) => {
                const isSel = chosenFamily?.ancestor === fam.ancestor;
                const btnItem = h('button', {
                  class: 'opt' + (isSel ? ' on' : ''),
                  style: {
                    textAlign: 'left',
                    borderColor: isSel ? 'var(--prime)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    padding: '8px 10px',
                  },
                  onclick: () => {
                    chosenFamily = fam;
                    chosenBeast = { n: fam.starterName, el: fam.starterEl };
                    name = ensurePlayerYaoSurname(name, `${fam.starterName} ${fam.ancestor}`);
                    draw();
                  },
                },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } },
                  h('b', { style: { color: 'var(--prime)' } }, `🌱 ${fam.starterName}`),
                  h('span', { class: 'el', style: { background: EL[fam.starterEl].c, fontSize: '11px', padding: '1px 5px' } }, EL[fam.starterEl].n)
                ),
                (() => {
                  const ts = getTierStyle(fam.tier);
                  return h('small', { style: { color: ts.color, fontSize: '11.5px', fontWeight: 'bold' } },
                    `🔮 Tiềm năng: ${fam.ancestor} · ${ts.icon}${fam.tierName}`
                  );
                })(),
                h('small', { style: { color: 'var(--muted)', fontSize: '10.5px' } }, fam.title)
                );
                listContainer.append(btnItem);
              });
            }
          };

          const tabBtnsContainer = h('div', { class: 'tabs', style: { display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' } });
          const updateTabs = () => {
            tabBtnsContainer.innerHTML = '';
            BEAST_TABS.forEach((tab) => {
              const b = btn(tab.n, () => {
                beastCatTab = tab.id;
                updateTabs();
                renderVisibleBeasts();
              }, beastCatTab === tab.id ? 'prime small' : 'small');
              tabBtnsContainer.append(b);
            });
          };

          const searchInput = h('input', {
            type: 'text',
            placeholder: '🔍 Tìm kiếm theo tên sơ khai hoặc tổ thú (vd: Thanh Lân Mãng, Tổ Long, Chân Phượng, Hồ, Chu...)...',
            value: beastSearchQuery,
            style: { width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' },
            oninput: (e: Event) => {
              beastSearchQuery = (e.target as HTMLInputElement).value;
              renderVisibleBeasts();
            },
          });

          updateTabs();
          renderVisibleBeasts();

          return h('div', { style: { border: '1px dashed var(--border)', borderRadius: '6px', padding: '10px', marginBottom: '12px' } },
            h('h4', { style: { marginTop: 0 } }, 'Toàn Bộ Dòng Dõi Thần Thú & Yêu Ma'),
            h('div', { style: { marginBottom: '8px' } }, searchInput),
            tabBtnsContainer,
            listContainer
          );
        })() : null,
        renderBodySection(),
      );
    }
    const elBtn = (e: El) => {
      const on = fate.root.els.includes(e);
      return h('button', { class: 'opt el-opt' + (on ? ' on' : ''), style: { borderColor: on ? EL[e].c : undefined }, onclick: () => toggleEl(e) },
        h('span', { class: 'el-ch', style: { background: EL[e].c }, html: glyphSvg(e, 16, 2) }), h('b', {}, EL[e].n));
    };
    return h('div', { class: 'free-pick' },
      (() => {
        const canUseRootFree = rootRerollsLeft > 0;
        const rootRerollBtnLabel = canUseRootFree
          ? `🎲 Quay Linh căn (Miễn phí: còn ${rootRerollsLeft}/3)`
          : `🎲 Quay Linh căn (Tốn 1 Luân Hồi)`;

        const doRerollRoot = () => {
          const curOrg = ORIGINS.find((o) => o.id === origin)!;
          if (canUseRootFree) {
            rootRerollsLeft--;
          } else {
            if (meta.karma < 1) return notice('Cần 1 Điểm Luân Hồi để quay ngẫu nhiên Linh căn.', 'Thiếu điểm Luân Hồi');
            meta.karma -= 1;
            saveMeta();
          }
          fate.root = rollRoot(!!curOrg.rootBoost);
          baseRoot = { ...fate.root };
          fitRoot(fate, curOrg);
          draw();
        };

        return h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' } },
          h('h4', { style: { margin: 0 } }, 'Linh căn — chọn tùy ý hoặc quay ngẫu nhiên (bỏ trống = phế linh căn)'),
          btn(rootRerollBtnLabel, doRerollRoot, canUseRootFree ? 'small prime' : 'small', {
            dis: !canUseRootFree && meta.karma < 1
          })
        );
      })(),
      h('div', { class: 'opts el-opts' }, ...ALL_EL.map(elBtn), ...YINYANG_EL.map(elBtn)),
      h('div', { style: { margin: '6px 0' } }, btn('Bỏ chọn hết', () => setAll([]), 'small'), ' ', btn('Ngũ hành', () => setAll(BASIC_EL), 'small'), ' ', btn('Đủ mười hệ', () => setAll(ALL_EL), 'small'), ' ', btn('Hỗn Độn · 12 hệ', () => setAll(EVERY_EL), 'small')),
      verdict,
      renderBodySection(),
    );
  };
  let first = true;
  const draw = () => {
    if (!first) scr.dataset.keep = '1';
    first = false;
    const org = ORIGINS.find((o) => o.id === origin)!;
    const forced = org.forcePerks ?? [];
    const root = ROOTS[fate.root.k];
    const body = (isBeast() ? BEAST_BODIES.find((b) => b.id === fate.body) : null) || BODIES.find((b) => b.id === fate.body) || (isBeast() ? BEAST_BODIES[0] : BODIES[0]);
    const perkList = isBeast() ? BEAST_PERKS : PERKS;
    if (org.clan && !name.startsWith(org.clan + ' ')) name = setSurname(name, org.clan); // xuất thân thế gia: họ theo gia tộc
    const nameIn = h('input', { type: 'text', value: name, maxlength: 20, oninput: (e: Event) => (name = (e.target as HTMLInputElement).value) });
    showScreen(
      h('h2', { class: 'center' }, 'Đầu thai'),
      h('div', {
        class: 'card',
        style: {
          position: 'sticky',
          top: '0px',
          zIndex: 50,
          background: 'var(--sheet)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--border)',
        }
      },
        h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' } },
          h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' } },
            h('div', { class: 'avatar', style: { width: '64px', height: '64px' }, html: avatarSvg(g, 0, fate.root.els[0] || null, 60, playerPortrait(g, 0)) }),
            h('div', {}, h('div', { class: 'small muted' }, 'Tên'), nameIn, ' ', btn('🎲', () => { name = mkName(g); draw(); }, 'small', { title: 'Tên ngẫu nhiên' })),
            h('div', {}, h('div', { class: 'small muted' }, 'Giới tính'),
              btn('Nam', () => { g = 'm'; name = mkName(g); if (BODIES.find((b) => b.id === fate.body)?.g === 'f') fate.body = 'pham'; draw(); }, g === 'm' ? 'prime small' : 'small'), ' ',
              btn('Nữ', () => { g = 'f'; name = mkName(g); if (BODIES.find((b) => b.id === fate.body)?.g === 'm') fate.body = 'pham'; draw(); }, g === 'f' ? 'prime small' : 'small')),
          ),
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              borderRadius: '6px',
            }
          },
            h('div', { style: { textAlign: 'right' } },
              h('div', { class: 'small muted', style: { fontSize: '11px', lineHeight: '1.2' } }, 'Điểm Luân Hồi'),
              h('b', { style: { color: 'var(--prime)', fontSize: '18px', lineHeight: '1.2' } }, `☯ ${meta.karma.toLocaleString('vi-VN')}`)
            )
          )
        ),
      ),
      h('h3', {}, 'Chủng tộc'),
      h('div', { class: 'opts' }, ...RACE_GROUPS.map((r) => {
        const list = ORIGINS.filter((o) => originRace(o) === r);
        const locked = list.filter((o) => !originUnlocked(o.id)).length;
        return h('button', { class: 'opt' + (r === race ? ' on' : ''), onclick: () => {
          if (r === race) return;
          race = r;
          perks = [];
          lockedPerkIds = [];
          offeredOriginRounds = [rollWeightedRaceOrigins(r, 3)];
          selectedOriginCardIdx = 0;
          let nextOrg = offeredOriginRounds[0][0] ?? list.find((o) => originUnlocked(o.id)) ?? list[0];
          origin = nextOrg.id;
          if (isBeast()) {
            if (!chosenFamily && offeredBeasts.length > 0) {
              chosenFamily = offeredBeasts[0];
            }
            if (chosenFamily) {
              chosenBeast = { n: chosenFamily.starterName, el: chosenFamily.starterEl };
            }
            fate = rollFate(false, g, true);
          } else {
            chosenBeast = null;
            fate = rollFate(false, g, false);
          }
          // Chuẩn hóa họ tên theo chủng tộc mới:
          // Hồng Hoang có họ tên chính xác (Hiên Viên, Hình Thiên, Cửu Lê, Vu, Ma), Yêu thú có họ loài, Nhân tộc đa dạng
          name = applyRaceSurname(name, race, g, nextOrg, chosenFamily ? `${chosenFamily.starterName} ${chosenFamily.ancestor}` : chosenBeast?.n);
          baseRoot = { ...fate.root };
          fitRoot(fate, nextOrg);
          draw();
        } },
          h('b', {}, r), h('small', {}, `${list.length} xuất thân${locked ? ` · ${locked} cần điểm Luân Hồi` : ''}`));
      })),
      RACE_INFO[race] ? h('p', { class: 'small', style: { fontStyle: 'italic' } }, RACE_INFO[race]) : null,
      ...((() => {
        const reroll1BtnLabel = originRerollsLeft > 0
          ? `🎲 Đổi 1 lần (Miễn phí: còn ${originRerollsLeft}/3)`
          : `🎲 Đổi 1 lần (Tốn 1 Luân Hồi)`;

        const doReroll1Origin = () => {
          if (originRerollsLeft > 0) {
            originRerollsLeft--;
          } else {
            if (meta.karma < 1) return notice(`Cần 1 điểm Luân Hồi để đổi lại xuất thân (hiện có ${meta.karma}).`, 'Thiếu điểm Luân Hồi');
            meta.karma -= 1;
            saveMeta();
          }
          const newRound = rollWeightedRaceOrigins(race, 3);
          offeredOriginRounds = [newRound];
          selectedOriginCardIdx = 0;
          pickOrigin(newRound[0], 0);
        };

        const free10Used = Math.min(originRerollsLeft, 10);
        const karma10Needed = 10 - free10Used;
        const reroll10BtnLabel = karma10Needed === 0
          ? `🎲 Đổi 10 lần (Miễn phí: 10/10)`
          : (free10Used > 0
              ? `🎲 Đổi 10 lần (Dùng ${free10Used} miễn phí + ${karma10Needed} Luân Hồi)`
              : `🎲 Đổi 10 lần (Tốn 10 Luân Hồi)`);

        const doReroll10Origins = () => {
          if (karma10Needed > 0 && meta.karma < karma10Needed) {
            return notice(`Đổi 10 lần cần ${free10Used > 0 ? `${free10Used} lượt miễn phí + ` : ''}${karma10Needed} điểm Luân Hồi (hiện có ${meta.karma}).`, 'Thiếu điểm Luân Hồi');
          }
          originRerollsLeft -= free10Used;
          if (karma10Needed > 0) {
            meta.karma -= karma10Needed;
            saveMeta();
          }
          const rounds: (typeof ORIGINS)[number][][] = [];
          for (let r = 0; r < 10; r++) {
            rounds.push(rollWeightedRaceOrigins(race, 3));
          }
          offeredOriginRounds = rounds;
          selectedOriginCardIdx = 0;
          pickOrigin(rounds[0][0], 0);
        };

        const orgTier = getOriginTier(org);
        const orgTierStyle = getTierStyle(orgTier.tier);

        const renderOriginCard = (o: (typeof ORIGINS)[number], globalIdx: number, itemNum: number) => {
          const isSel = selectedOriginCardIdx === globalIdx;
          const info = getOriginTier(o);
          const tierStyle = getTierStyle(info.tier);

          const tags: HTMLElement[] = [];
          if (o.money) tags.push(h('span', { style: { fontSize: '10.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(217,119,6,0.1)', color: '#d97706', fontWeight: 'bold' } }, `💰 ${o.money} Linh thạch`));
          if (o.tech) tags.push(h('span', { style: { fontSize: '10.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontWeight: 'bold' } }, '📜 Công pháp'));
          if (o.craft) tags.push(h('span', { style: { fontSize: '10.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 'bold' } }, '🔨 Bách nghệ'));
          if (o.startR) tags.push(h('span', { style: { fontSize: '10.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontWeight: 'bold' } }, '⚔️ Luyện Khí'));
          if (o.sect) tags.push(h('span', { style: { fontSize: '10.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontWeight: 'bold' } }, '🏰 Chân truyền'));
          if (o.rootBoost) tags.push(h('span', { style: { fontSize: '10.5px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', fontWeight: 'bold' } }, '✨ Linh căn tốt'));

          return h('button', {
            class: 'opt' + (isSel ? ' on' : ''),
            style: {
              textAlign: 'left',
              borderColor: isSel ? 'var(--prime)' : tierStyle.border,
              background: isSel ? 'var(--card-on, rgba(217, 119, 6, 0.08))' : undefined,
              boxShadow: isSel ? '0 0 0 1px var(--prime)' : undefined,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '12px 14px',
              cursor: 'pointer',
              borderRadius: '6px',
            },
            onclick: () => pickOrigin(o, globalIdx),
          },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
              h('span', { style: { fontSize: '11px', padding: '1px 5px', borderRadius: '3px', background: isSel ? 'var(--prime)' : 'var(--muted)', color: '#fff', fontWeight: 'bold' } },
                `#${globalIdx + 1}`
              ),
              h('span', { style: { fontSize: '11px', padding: '1px 6px', borderRadius: '3px', background: tierStyle.bg, color: tierStyle.color, border: `1px solid ${tierStyle.border}`, fontWeight: 'bold' } },
                `${tierStyle.icon}${info.tierName}`
              )
            ),
            h('span', { class: 'small muted', style: { fontSize: '11px' } }, `📍 ${LOCS[o.loc].n}`)
          ),
          h('div', { style: { marginTop: '2px' } },
            h('b', { style: { fontSize: '16px', color: tierStyle.color } }, originName(o, g) + (o.karma ? ' ★' : '')),
            o.clan ? h('span', { class: 'small muted', style: { marginLeft: '6px', fontSize: '11px' } }, `(Họ ${o.clan})`) : null
          ),
          tags.length ? h('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' } }, ...tags) : null,
          h('div', { class: 'small muted', style: { fontSize: '11px', marginTop: '2px', fontStyle: 'italic', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, originDesc(o, g)),
          isSel ? h('div', { style: { fontSize: '11px', color: 'var(--prime)', fontWeight: 'bold', textAlign: 'right', marginTop: '2px' } }, '✓ Đang chọn') : null
          );
        };

        const originSectionTitle = isBeast()
          ? 'Xuất Thân & Thân Phận Trong Tộc Quần Yêu Thú'
          : `Xuất Thân Khởi Đầu & Gia Thế (${race})`;

        const originChooseTitle = offeredOriginRounds.length > 1
          ? `Chọn 1 Trong ${offeredOriginRounds.length * 3} Xuất Thân ${race} (10 Lần Đổi)`
          : `Chọn 1 Trong 3 Xuất Thân ${race}`;

        return [
          h('div', { class: 'free-pick' },
            h('h4', {}, originSectionTitle),
            h('div', { class: 'card verdict' },
              h('div', { class: 'v-name', style: { fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                h('span', { style: { color: orgTierStyle.color } }, originName(org, g) + (org.karma ? ' ★' : '')),
                h('span', { style: { fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: orgTierStyle.bg, color: orgTierStyle.color, border: `1px solid ${orgTierStyle.border}`, fontWeight: 'bold' } },
                  `${orgTierStyle.icon}${orgTier.tierName}`
                )
              ),
              h('div', { style: { margin: '6px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: '4px', borderLeft: `3px solid ${orgTierStyle.color}` } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px' } },
                  h('span', {}, `📍 Nơi sinh: `, h('b', {}, LOCS[org.loc].n)),
                  h('span', {}, `💰 Ngân lượng: `, h('b', {}, `${org.money} linh thạch`)),
                  org.clan ? h('span', {}, `🐾 Gia tộc: `, h('b', {}, `Họ ${org.clan}`)) : null,
                  org.craft ? h('span', { style: { color: '#059669', fontWeight: 'bold' } }, '🔨 Biết thủ nghệ') : null,
                  org.tech ? h('span', { style: { color: '#7c3aed', fontWeight: 'bold' } }, '📜 Gia truyền công pháp') : null,
                  org.startR ? h('span', { style: { color: '#dc2626', fontWeight: 'bold' } }, '⚔️ Khởi đầu Luyện Khí') : null,
                  org.sect ? h('span', { style: { color: '#dc2626', fontWeight: 'bold' } }, '🏰 Chân truyền thánh địa') : null,
                  org.rootBoost ? h('span', { style: { color: '#2563eb', fontWeight: 'bold' } }, '✨ Ưu tiên linh căn tốt') : null
                ),
                h('div', { class: 'small muted', style: { fontSize: '11px', marginTop: '4px', fontStyle: 'italic' } }, originDesc(org, g))
              )
            ),
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '14px', marginBottom: '4px' } },
              h('h4', { style: { margin: 0 } }, originChooseTitle),
              h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                btn(reroll1BtnLabel, doReroll1Origin, originRerollsLeft > 0 ? 'small prime' : 'small', {
                  dis: originRerollsLeft <= 0 && meta.karma < 1
                }),
                btn(reroll10BtnLabel, doReroll10Origins, 'small prime', {
                  dis: meta.karma < karma10Needed
                })
              )
            ),
            h('div', { class: 'small muted', style: { fontSize: '11px', marginBottom: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' } },
              h('span', {}, '🎲 Tỷ lệ xuất hiện theo phẩm cấp:'),
              h('span', { style: { color: '#d97706', fontWeight: 'bold' } }, '👑 Thần Phẩm (~4%)'),
              h('span', {}, '<'),
              h('span', { style: { color: '#7c3aed', fontWeight: 'bold' } }, '★ Thiên Phẩm (~10%)'),
              h('span', {}, '<'),
              h('span', { style: { color: '#2563eb', fontWeight: 'bold' } }, '◆ Địa Phẩm (~25%)'),
              h('span', {}, '<'),
              h('span', { style: { color: '#059669', fontWeight: 'bold' } }, '✦ Huyền Phẩm (~40%)'),
              h('span', {}, '<'),
              h('span', { style: { color: '#78716c' } }, '• Hoàng Phẩm')
            ),
            offeredOriginRounds.length === 1
              ? h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '12px' } },
                  ...offeredOriginRounds[0].map((o, idx) => renderOriginCard(o, idx, idx + 1))
                )
              : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' } },
                  ...offeredOriginRounds.map((roundOrigins, rIdx) => {
                    return h('div', {
                      style: {
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.015)'
                      }
                    },
                      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } },
                        h('b', { style: { color: 'var(--prime)', fontSize: '13px' } }, `🎯 Lần ${rIdx + 1}`),
                        h('span', { class: 'small muted', style: { fontSize: '11px' } }, `Xuất thân #${rIdx * 3 + 1} - #${rIdx * 3 + 3}`)
                      ),
                      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' } },
                        ...roundOrigins.map((o, itemIdx) => renderOriginCard(o, rIdx * 3 + itemIdx, itemIdx + 1))
                      )
                    );
                  })
                ),
            freeMode() ? h('div', { style: { margin: '8px 0' } },
              btn(showFullOriginCatalog ? '▲ Thu gọn danh sách toàn bộ xuất thân' : `🔍 Tự do tìm chọn từ toàn bộ xuất thân ${race} (Chế độ tự do)`, () => {
                showFullOriginCatalog = !showFullOriginCatalog;
                draw();
              }, 'small ghost')
            ) : null,
            (freeMode() && showFullOriginCatalog) ? (() => {
              const listContainer = h('div', { class: 'opts', style: { maxHeight: '200px', overflowY: 'auto' } });
              const renderVisibleOrigins = () => {
                const query = originSearchQuery.trim().toLowerCase();
                const allRaceOrigins = ORIGINS.filter((o) => originRace(o) === race);
                const visible = allRaceOrigins.filter((o) => {
                  if (query) {
                    return originName(o, g).toLowerCase().includes(query) ||
                           o.d.toLowerCase().includes(query) ||
                           LOCS[o.loc].n.toLowerCase().includes(query);
                  }
                  return true;
                }).sort((a, b) => getOriginTier(b).tier - getOriginTier(a).tier || (b.money ?? 0) - (a.money ?? 0));

                listContainer.innerHTML = '';
                if (!visible.length) {
                  listContainer.append(h('div', { class: 'small muted center', style: { padding: '12px' } }, 'Không tìm thấy xuất thân phù hợp.'));
                } else {
                  visible.forEach((o) => {
                    const isSel = origin === o.id;
                    const locked = !originUnlocked(o.id);
                    const info = getOriginTier(o);
                    const ts = getTierStyle(info.tier);
                    const b = h('button', {
                      class: 'opt' + (isSel ? ' on' : ''),
                      disabled: locked,
                      style: {
                        textAlign: 'left',
                        borderColor: isSel ? 'var(--prime)' : undefined,
                        background: isSel ? 'var(--card-on, rgba(217, 119, 6, 0.08))' : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        padding: '8px 10px',
                      },
                      onclick: () => pickOrigin(o),
                    },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } },
                      h('b', { style: { color: ts.color } }, originName(o, g) + (o.karma ? ' ★' : '')),
                      h('span', { style: { fontSize: '10.5px', color: ts.color, fontWeight: 'bold' } }, `${ts.icon}${info.tierName}`)
                    ),
                    h('small', { style: { color: 'var(--muted)', fontSize: '10.5px' } }, locked ? `Mở ở Điện Luân Hồi (${o.karma} điểm)` : `${LOCS[o.loc].n} · ${o.money} linh thạch · ${originDesc(o, g)}`)
                    );
                    listContainer.append(b);
                  });
                }
              };

              const searchInput = h('input', {
                type: 'text',
                placeholder: `🔍 Tìm kiếm xuất thân ${race}...`,
                value: originSearchQuery,
                style: { width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', marginBottom: '8px' },
                oninput: (e: Event) => {
                  originSearchQuery = (e.target as HTMLInputElement).value;
                  renderVisibleOrigins();
                },
              });

              renderVisibleOrigins();

              return h('div', { style: { border: '1px dashed var(--border)', borderRadius: '6px', padding: '10px', marginBottom: '12px' } },
                h('h4', { style: { marginTop: 0 } }, `Toàn Bộ Xuất Thân ${race}`),
                searchInput,
                listContainer
              );
            })() : null
          )
        ];
      })()),
      (() => {
        const lockedCount = STAT_KEYS.filter((k) => lockedStats[k]).length;
        const unlockedCount = 5 - lockedCount;

        // Chi phí quay mệnh số:
        // - Khóa 0 chỉ số: 1 lượt free hoặc 1 Luân Hồi
        // - Khóa >= 1 chỉ số: mỗi chỉ số khóa làm chi phí tăng theo cấp số mũ (2^lockedCount). Nếu còn lượt free sẽ giảm 1 Luân Hồi.
        const baseStatsCost = lockedCount === 0 ? 1 : Math.pow(2, lockedCount);
        const canUseStatsFree = statsRerollsLeft > 0;
        const statsKarmaCost = canUseStatsFree ? Math.max(0, baseStatsCost - 1) : baseStatsCost;

        let statsRerollBtnLabel = '';
        if (lockedCount >= 5) {
          statsRerollBtnLabel = '🔒 Đã khóa cả 5 chỉ số';
        } else if (lockedCount === 0) {
          statsRerollBtnLabel = canUseStatsFree
            ? `🎲 Quay Mệnh số (Miễn phí: còn ${statsRerollsLeft}/3)`
            : `🎲 Quay Mệnh số (Tốn 1 Luân Hồi)`;
        } else {
          if (canUseStatsFree) {
            if (statsKarmaCost === 0) {
              statsRerollBtnLabel = `🎲 Quay ${unlockedCount} chỉ số (Khóa ${lockedCount} · Miễn phí: còn ${statsRerollsLeft}/3)`;
            } else {
              statsRerollBtnLabel = `🎲 Quay ${unlockedCount} chỉ số (Khóa ${lockedCount} · Tốn ${statsKarmaCost} Luân Hồi + 1 free)`;
            }
          } else {
            statsRerollBtnLabel = `🎲 Quay ${unlockedCount} chỉ số (Khóa ${lockedCount} · Tốn ${statsKarmaCost} Luân Hồi)`;
          }
        }

        const doRerollStats = () => {
          if (lockedCount >= 5) return;
          if (statsKarmaCost > 0 && meta.karma < statsKarmaCost) {
            return notice(`Cần ${statsKarmaCost} Điểm Luân Hồi để quay mệnh số (hiện có ${meta.karma}).`, 'Thiếu điểm Luân Hồi');
          }
          if (canUseStatsFree) {
            statsRerollsLeft--;
          }
          if (statsKarmaCost > 0) {
            meta.karma -= statsKarmaCost;
            saveMeta();
          }
          for (const k of STAT_KEYS) {
            if (!lockedStats[k]) {
              fate.stats[k] = rollOneStat();
            }
          }
          draw();
        };

        return h('div', {},
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '16px', marginBottom: '8px' } },
            h('h3', { style: { margin: 0 } }, 'Mệnh số'),
            btn(statsRerollBtnLabel, doRerollStats, (lockedCount < 5 && (canUseStatsFree || meta.karma >= statsKarmaCost)) ? 'small prime' : 'small', {
              dis: lockedCount >= 5 || (!canUseStatsFree && meta.karma < statsKarmaCost),
              title: lockedCount >= 5 ? 'Đã khóa toàn bộ 5 chỉ số, không thể quay thêm' : undefined,
            })
          ),
          h('div', { class: 'card' },
            h('div', { class: 'stats5' }, ...STAT_KEYS.map((k) => {
              const isLocked = lockedStats[k];
              const curVal = fate.stats[k] + (org.stat?.[k] || 0);
              const maxVal = 10 + (org.stat?.[k] || 0);
              return h('div', {
                title: STATS[k].d,
                style: {
                  border: isLocked ? '1.5px solid var(--prime)' : '1px solid var(--border)',
                  background: isLocked ? 'rgba(217, 119, 6, 0.1)' : undefined,
                  boxShadow: isLocked ? '0 0 0 1px var(--prime)' : undefined,
                  borderRadius: '6px',
                  padding: '8px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease-in-out',
                }
              },
                h('b', { style: { color: isLocked ? 'var(--prime)' : (curVal >= maxVal ? '#dc2626' : undefined), fontSize: '20px', margin: '2px 0' } }, `${curVal}/${maxVal}`),
                h('span', { class: 'small', style: { fontWeight: 'bold' } }, STATS[k].n),
                (() => {
                  const bLock = btn(isLocked ? '🔒' : '🔓', () => {
                    lockedStats[k] = !lockedStats[k];
                    draw();
                  }, isLocked ? 'small prime' : 'small ghost', {
                    title: isLocked ? 'Đang khóa: chỉ số này được giữ nguyên khi quay' : 'Chưa khóa: bấm để giữ nguyên chỉ số này khi quay'
                  });
                  bLock.style.fontSize = '11px';
                  bLock.style.padding = '2px 8px';
                  bLock.style.marginTop = '2px';
                  return bLock;
                })(),
                freeMode() ? h('div', { style: { marginTop: '4px', display: 'flex', gap: '2px' } },
                  btn('−', () => { fate.stats[k] = Math.max(1, fate.stats[k] - 1); draw(); }, 'small'),
                  btn('+', () => { fate.stats[k] = Math.min(10, fate.stats[k] + 1); draw(); }, 'small'),
                  btn('Max', () => { fate.stats[k] = 10; draw(); }, 'small', { title: `${STATS[k].n} tối đa (10)` })
                ) : null
              );
            })),
            freePicker()
          )
        );
      })(),
      (() => {
        const totalAllowedSlots = 4 + extraPerkSlots;
        const targetOfferCount = Math.min(perkList.length, totalAllowedSlots + 2);

        // Đảm bảo fate.perkOffer luôn có đủ targetOfferCount (luôn dư 2 so với số slot chọn)
        if (!fate.perkOffer || fate.perkOffer.length < targetOfferCount) {
          const curOffer = fate.perkOffer || [];
          const needed = targetOfferCount - curOffer.length;
          const pool = perkList.filter((p) => !curOffer.includes(p.id) && !forced.includes(p.id));
          fate.perkOffer = [...curOffer, ...shuffle(pool.map((p) => p.id)).slice(0, needed)];
        }

        const activeLockedIds: string[] = lockedPerkIds.filter((id: string) => fate.perkOffer.includes(id) && !forced.includes(id));
        const lockedCount = activeLockedIds.length;
        const lockSurcharge = lockedCount * 2;
        const karmaCost = perkRerollsLeft > 0 ? lockSurcharge : (1 + lockSurcharge);

        let perkRerollBtnLabel = '';
        if (lockedCount >= targetOfferCount) {
          perkRerollBtnLabel = `🔒 Đã khóa toàn bộ ${targetOfferCount} thiên phú`;
        } else if (perkRerollsLeft > 0) {
          if (lockedCount === 0) {
            perkRerollBtnLabel = `🎲 Đổi lại Thiên phú (Miễn phí: còn ${perkRerollsLeft}/3)`;
          } else {
            perkRerollBtnLabel = `🎲 Đổi lại Thiên phú (Khóa ${lockedCount} · Miễn phí + ${lockSurcharge} Luân Hồi)`;
          }
        } else {
          if (lockedCount === 0) {
            perkRerollBtnLabel = `🎲 Đổi lại Thiên phú (Tốn 1 Luân Hồi)`;
          } else {
            perkRerollBtnLabel = `🎲 Đổi lại Thiên phú (Khóa ${lockedCount} · Tốn ${karmaCost} Luân Hồi)`;
          }
        }

        const doRerollPerks = () => {
          if (lockedCount >= targetOfferCount) {
            return notice('Toàn bộ thiên phú đề cử đã bị khóa. Hãy mở khóa ít nhất 1 thiên phú để đổi lại.', 'Đã khóa toàn bộ');
          }
          if (karmaCost > 0 && meta.karma < karmaCost) {
            return notice(`Đổi lại thiên phú khi khóa ${lockedCount} thiên phú cần ${perkRerollsLeft > 0 ? '1 lượt miễn phí + ' : ''}${karmaCost} Điểm Luân Hồi (hiện có ${meta.karma}).`, 'Thiếu điểm Luân Hồi');
          }
          if (perkRerollsLeft > 0) {
            perkRerollsLeft--;
          }
          if (karmaCost > 0) {
            meta.karma -= karmaCost;
            saveMeta();
          }

          const keptIds = fate.perkOffer.filter((id) => activeLockedIds.includes(id));
          const needed = targetOfferCount - keptIds.length;
          const candidatePool = perkList.filter((p) => !keptIds.includes(p.id) && !forced.includes(p.id));
          const newPicked = shuffle(candidatePool.map((p) => p.id)).slice(0, needed);
          fate.perkOffer = [...keptIds, ...newPicked];

          perks = perks.filter((x) => forced.includes(x) || fate.perkOffer.includes(x));
          draw();
        };

        const getPerkObj = (id: string) => perkList.find((x) => x.id === id) || PERKS.find((x) => x.id === id) || BEAST_PERKS.find((x) => x.id === id);
        const offeredPerkIds = [...new Set([...forced, ...fate.perkOffer])].sort((a, b) => {
          const pA = getPerkObj(a);
          const pB = getPerkObj(b);
          return getPerkTier(pB).tier - getPerkTier(pA).tier;
        });

        const totalCount = perkList.length;
        const chosenNonForced = perks.filter((x) => !forced.includes(x)).length;
        const nextSlotCost = (extraPerkSlots + 1) * 10;

        // Thống kê phẩm cấp toàn kho thiên phú tộc
        const t5Pool = perkList.filter((p) => getPerkTier(p).tier === 5);
        const t4Pool = perkList.filter((p) => getPerkTier(p).tier === 4);
        const t3Pool = perkList.filter((p) => getPerkTier(p).tier === 3);
        const t2Pool = perkList.filter((p) => getPerkTier(p).tier === 2);
        const t0Pool = perkList.filter((p) => getPerkTier(p).tier === 0);

        const doBuyExtraSlot = () => {
          if (meta.karma < nextSlotCost) {
            return notice(`Cần ${nextSlotCost} Điểm Luân Hồi để mở thêm slot thiên phú (hiện có ${meta.karma}).`, 'Thiếu điểm Luân Hồi');
          }
          meta.karma -= nextSlotCost;
          saveMeta();
          extraPerkSlots++;

          // Tăng 1 ô chọn thì tăng thêm 1 lựa chọn đề cử (luôn luôn có dư 2 lựa chọn)
          const newTargetCount = Math.min(perkList.length, 4 + extraPerkSlots + 2);
          const pool = perkList.filter((p) => !fate.perkOffer.includes(p.id) && !forced.includes(p.id));
          if (pool.length > 0 && fate.perkOffer.length < newTargetCount) {
            const added = shuffle(pool.map((p) => p.id)).slice(0, newTargetCount - fate.perkOffer.length);
            fate.perkOffer = [...fate.perkOffer, ...added];
          }
          draw();
        };

        return h('div', { style: { marginTop: '16px' } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' } },
            h('h3', { style: { margin: 0 } }, `Thiên phú (Đề cử ${targetOfferCount} chọn ${totalAllowedSlots})`),
            btn(perkRerollBtnLabel, doRerollPerks, perkRerollsLeft > 0 && lockedCount === 0 ? 'small prime' : 'small', {
              dis: lockedCount >= targetOfferCount || (karmaCost > 0 && meta.karma < karmaCost)
            })
          ),
          h('div', {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '10px',
              fontSize: '12px'
            }
          },
            h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } },
              h('span', {}, `📖 Kho tộc (${totalCount}):`),
              h('span', { style: { color: '#d97706', fontWeight: 'bold' } }, `👑 ${t5Pool.length} Thần`),
              h('span', { style: { color: 'var(--muted)' } }, '·'),
              h('span', { style: { color: '#7c3aed', fontWeight: 'bold' } }, `★ ${t4Pool.length} Thiên`),
              h('span', { style: { color: 'var(--muted)' } }, '·'),
              h('span', { style: { color: '#2563eb', fontWeight: 'bold' } }, `◆ ${t3Pool.length} Địa`),
              h('span', { style: { color: 'var(--muted)' } }, '·'),
              h('span', { style: { color: '#059669', fontWeight: 'bold' } }, `✦ ${t2Pool.length} Huyền`),
              h('span', { style: { color: 'var(--muted)' } }, '·'),
              h('span', { style: { color: '#dc2626', fontWeight: 'bold' } }, `🔴 ${t0Pool.length} Hung`),
              h('span', { style: { color: 'var(--muted)', margin: '0 2px' } }, '|'),
              h('span', {}, `🎯 Đã chọn: `, h('b', { style: { color: chosenNonForced >= totalAllowedSlots ? '#dc2626' : 'var(--prime)' } }, `${chosenNonForced}/${totalAllowedSlots} slot`), ` (Đề cử ${targetOfferCount} chọn ${totalAllowedSlots}${extraPerkSlots > 0 ? ` · Mở +${extraPerkSlots} slot` : ''})`)
            ),
            btn(`➕ Mở thêm slot thứ ${totalAllowedSlots + 1} (Tốn ${nextSlotCost} Luân Hồi)`, doBuyExtraSlot, 'small prime', {
              dis: meta.karma < nextSlotCost,
              title: `Mở thêm 1 slot thiên phú cho kiếp này (Tốn ${nextSlotCost} Điểm Luân Hồi)`
            })
          ),
          h('div', { class: 'opts' }, ...offeredPerkIds.map((id) => {
            const p = perkList.find((x) => x.id === id) || PERKS.find((x) => x.id === id) || BEAST_PERKS.find((x) => x.id === id);
            if (!p) return null;
            const must = forced.includes(id);
            const on = must || perks.includes(id);
            const isLocked = !must && activeLockedIds.includes(id);
            const blocked = !perkAllowed(origin, id);
            const pTier = getPerkTier(p);
            return h('div', {
              class: 'opt' + (on ? ' on' : '') + (p.bad ? ' bad' : ''),
              style: {
                cursor: (blocked || must) ? 'default' : 'pointer',
                opacity: blocked ? '0.5' : '1',
                borderColor: on ? 'var(--prime)' : (isLocked ? '#f59e0b' : (p.bad ? '#fca5a5' : pTier.border)),
                background: on
                  ? 'var(--card-on, rgba(217, 119, 6, 0.08))'
                  : (isLocked ? 'rgba(245, 158, 11, 0.06)' : (p.bad ? 'rgba(185, 28, 28, 0.03)' : undefined)),
                boxShadow: isLocked ? '0 0 0 1px #f59e0b' : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              },
              onclick: () => {
                if (must || blocked) return;
                if (on) {
                  perks = perks.filter((x) => x !== id);
                  // Bỏ chọn thiên phú thì cũng mở khóa thiên phú đó
                  lockedPerkIds = lockedPerkIds.filter((x: string) => x !== id);
                } else {
                  if (chosenNonForced >= totalAllowedSlots) {
                    return notice(`Ngươi chỉ có tối đa ${totalAllowedSlots} slot thiên phú. Hãy bấm nút "➕ Mở thêm slot" để dùng Điểm Luân Hồi mở rộng!`, 'Đã đầy slot thiên phú');
                  }
                  perks = [...perks, id];
                }
                draw();
              }
            },
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2px' } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                  h('b', { style: { color: pTier.color, fontSize: '15px' } }, p.n),
                  on ? h('span', { style: { fontSize: '11px', color: 'var(--prime)', fontWeight: 'bold' } }, '✓ Đang chọn') : null
                ),
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                  h('span', { style: { fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: pTier.bg, color: pTier.color, border: `1px solid ${pTier.border}`, fontWeight: 'bold' } },
                    `${pTier.icon}${pTier.tierName}`
                  ),
                  !must ? h('button', {
                    class: 'btn small' + (isLocked ? ' prime' : ''),
                    style: {
                      padding: '2px 8px',
                      fontSize: '13px',
                      lineHeight: '1.2',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      background: isLocked ? '#9b2a1f !important' : 'rgba(0,0,0,0.06)',
                      color: isLocked ? '#ffffff !important' : 'var(--ink)',
                      border: isLocked ? '1px solid #9b2a1f !important' : '1px solid var(--line)',
                      boxShadow: isLocked ? '0 1px 4px rgba(155, 42, 31, 0.4)' : undefined,
                    },
                    title: isLocked ? 'Đang khóa (bấm để mở khóa)' : 'Chưa khóa (bấm để khóa và chọn)',
                    onclick: (e: MouseEvent) => {
                      e.stopPropagation();
                      if (isLocked) {
                        lockedPerkIds = lockedPerkIds.filter((x: string) => x !== id);
                      } else {
                        if (!perks.includes(id)) {
                          if (chosenNonForced >= totalAllowedSlots) {
                            return notice(`Ngươi chỉ có tối đa ${totalAllowedSlots} slot thiên phú. Hãy bấm nút "➕ Mở thêm slot" hoặc bỏ chọn thiên phú khác trước khi khóa!`, 'Đã đầy slot thiên phú');
                          }
                          perks = [...perks, id];
                        }
                        lockedPerkIds.push(id);
                      }
                      draw();
                    }
                  }, isLocked ? '🔒' : '🔓') : null
                )
              ),
              h('small', { style: { lineHeight: '1.4' } }, must ? `${p.d} Bắt buộc với ${org.race ?? originName(org, g)}.` : blocked ? `${p.d} Không hợp với xuất thân ${originName(org, g)}.` : p.d)
            );
          })),
          freeMode() ? h('div', { style: { margin: '8px 0' } },
            btn(showFullPerkCatalog ? '▲ Thu gọn danh sách toàn bộ thiên phú' : '🔍 Tự do tìm chọn từ toàn bộ thiên phú (Chế độ tự do)', () => {
              showFullPerkCatalog = !showFullPerkCatalog;
              draw();
            }, 'small ghost')
          ) : null,
          (freeMode() && showFullPerkCatalog) ? h('div', { class: 'opts', style: { maxHeight: '240px', overflowY: 'auto', marginBottom: '10px' } },
            ...[...perkList].sort((a, b) => getPerkTier(b).tier - getPerkTier(a).tier).map((p) => {
              const must = forced.includes(p.id);
              const on = must || perks.includes(p.id);
              const blocked = !perkAllowed(origin, p.id);
              const pTier = getPerkTier(p);
              return h('button', {
                class: 'opt' + (on ? ' on' : '') + (p.bad ? ' bad' : ''),
                disabled: blocked || must,
                style: {
                  borderColor: on ? 'var(--prime)' : (p.bad ? '#fca5a5' : pTier.border),
                  background: on ? 'var(--card-on, rgba(217, 119, 6, 0.08))' : (p.bad ? 'rgba(185, 28, 28, 0.03)' : undefined),
                },
                onclick: () => {
                  if (must) return;
                  if (on) {
                    perks = perks.filter((x) => x !== p.id);
                  } else {
                    if (chosenNonForced >= totalAllowedSlots) {
                      return notice(`Ngươi chỉ có tối đa ${totalAllowedSlots} slot thiên phú. Hãy bấm nút "➕ Mở thêm slot" để dùng Điểm Luân Hồi mở rộng!`, 'Đã đầy slot thiên phú');
                    }
                    perks = [...perks, p.id];
                  }
                  draw();
                }
              },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2px' } },
                  h('b', { style: { color: pTier.color, fontSize: '15px' } }, p.n),
                  h('span', { style: { fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: pTier.bg, color: pTier.color, border: `1px solid ${pTier.border}`, fontWeight: 'bold' } },
                    `${pTier.icon}${pTier.tierName}`
                  )
                ),
                h('small', {}, must ? `${p.d} Bắt buộc với ${org.race ?? originName(org, g)}.` : blocked ? `${p.d} Không hợp với xuất thân.` : p.d)
              );
            })
          ) : null
        );
      })(),
      h('div', { class: 'center', style: { marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' } },
        btn('Trở lại', titleScreen),
        btn('Bước vào nhân gian', () => {
          if (!name.trim()) return notice('Hãy đặt tên cho nhân vật.', 'Thiếu tên');
          if (perks.filter((x) => !forced.includes(x)).length < 1) return notice('Hãy chọn ít nhất 1 thiên phú khởi đầu.', 'Thiếu thiên phú');
          newLife({
            name: name.trim(),
            g,
            origin,
            fate,
            perks: [...new Set([...perks, ...forced])],
            beast: isBeast() ? (chosenBeast?.n ?? pick(leafNodes).n) : undefined,
          });
          s.flags.introPending = true;
          if (org.rootBoost && fate.root.k < 3) { /* xuất thân tốt đã được ưu tiên khi gieo */ }
          hideScreen();
          onStart();
        }, 'prime'),
      ),
    );
  };
  if (ORIGINS.find((o) => o.id === origin)?.rootBoost) fate = rollFate(true, g);
  let baseRoot = { ...fate.root };
  fitRoot(fate, ORIGINS.find((o) => o.id === origin)!);
  draw();
}

// ---------- Kết thúc một kiếp ----------
export function deathScreen() {
  const rec = lastLife();
  if (!rec) return titleScreen();
  const parts = scoreParts();
  const bio = h('div', { class: 'card small' }, rec.bio || (meta.settings.ai && meta.settings.aiBio ? h('span', { class: 'ai-wait' }, 'AI đang viết tiểu sử…') : null));
  const asc = !!rec.ascended;
  showScreen(
    h('div', { class: 'bigseal', html: glyphSvg(asc ? 'ascend' : 'end', 52, 1.6) }),
    h('h2', { class: 'center' }, asc ? `${rec.name} phi thăng` : `${rec.name} đã qua đời`),
    h('p', { class: 'center muted' }, `${rec.realm} · ${rec.age} tuổi · ${rec.cause}`),
    h('p', { class: 'epitaph' }, `“${rec.epitaph}”`),
    bio,
    h('div', { class: 'card' },
      h('h3', { style: { marginTop: 0 } }, 'Tổng kết'),
      ...parts.map(([n, v]) => h('div', { class: 'score-row' }, h('span', {}, n), h('b', {}, String(v)))),
      h('div', { class: 'score-row' }, h('span', {}, 'Thành tựu trong kiếp'), h('b', {}, String(rec.score - parts.reduce((a, b) => a + b[1], 0)))),
      h('div', { class: 'score-row', style: { fontSize: '17px' } }, h('b', {}, 'Tổng điểm'), h('b', {}, String(rec.score))),
      h('p', { class: 'center' }, `Nhận `, h('b', {}, `${rec.karma}`), ` điểm luân hồi (hiện có ${meta.karma}).`),
    ),
    h('details', { class: 'card' }, h('summary', { style: { cursor: 'pointer' } }, 'Các mốc đời người'), ...rec.marks.map((m) => h('div', { class: 'logline' }, m))),
    h('div', { class: 'center', style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
      btn('Điện Luân Hồi', () => karmaHall(deathScreen)),
      btn('Đầu thai kiếp mới', creation, 'prime'),
    ),
  );
  if (!rec.bio && meta.settings.ai && meta.settings.aiBio) {
    biography(rec).then((t) => {
      bio.innerHTML = '';
      if (t) {
        rec.bio = t;
        saveMeta();
        bio.append(h('div', {}, t), h('div', { class: 'ai-tag small', style: { color: 'var(--violet)' } }, '✎ Tiểu sử do AI viết'));
      } else {
        const r = aiBlockReason();
        bio.append(h('span', { class: 'muted' }, r ? `AI không viết được tiểu sử: ${r}` : 'AI không phản hồi — bỏ qua tiểu sử.'));
      }
    });
  } else if (!rec.bio) bio.remove();
  void REALMS;
}
