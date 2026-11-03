// Màn hình toàn trang: mở đầu, đầu thai, cái chết, phi thăng.
import { askConfirm, notice } from './dialog';
import { glyphSvg } from './glyph';
import { h, $, btn } from './dom';
import { s, meta, saveMeta, load } from '../engine/state';
import { setSurname, ORIGINS, originName, RACE_GROUPS, RACE_INFO, originRace, PERKS, BEAST_PERKS, ROOTS, BODIES, BEAST_BODIES, STATS, STAT_KEYS, EL, REALMS, BASIC_EL, ALL_EL, YINYANG_EL, EVERY_EL, hiddenRootKind, rootKindOf, type El } from '../data/core';
import { LOCS, beastLeafNodes } from '../data/world';
import { rollFate, fitRoot, newLife, rerolls, freeMode, UPGRADES, upLv, buyUpgrade, originUnlocked, unlockOrigin, scoreParts, lastLife, perkAllowed, type Fate } from '../engine/life';
import { mkName } from '../engine/core';
import { pick } from '../core/util';
import { biography, aiBlockReason } from '../ai/ollama';
import { avatarSvg, playerPortrait } from './hud';

const scr = $('#screen');
let onStart: () => void = () => {};
export const setOnStart = (f: () => void) => (onStart = f);

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
  const hasSave = load();
  showScreen(
    h('div', { class: 'title-big', html: glyphSvg('title', 96, 1.3) }),
    h('div', { class: 'title-vn' }, 'TIÊN LỘ MẠN MẠN'),
    h('p', { class: 'center', style: { maxWidth: '560px', margin: '0 auto 22px', fontStyle: 'italic' } },
      'Thương Lan Giới, linh khí suy vi. Trăm vạn người cầu tiên, mấy ai thành đạo? Một kiếp người ngắn ngủi — ngươi sẽ đi được bao xa trên con đường dài dằng dặc ấy?'),
    h('div', { class: 'center', style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
      hasSave ? btn(`Tiếp tục: ${s.name}`, () => { hideScreen(); onStart(); }, 'prime') : null,
      btn(hasSave ? 'Bỏ kiếp này, đầu thai mới' : 'Đầu thai', () => (hasSave ? askConfirm('Kiếp hiện tại sẽ bị bỏ và không được tính điểm luân hồi. Chắc chứ?', creation, { title: 'Đầu thai mới', ok: 'Bỏ kiếp này', danger: true }) : creation()), hasSave ? '' : 'prime'),
      meta.lives.length ? btn('Điện Luân Hồi', karmaHall) : null,
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
      h('div', { class: 'opts' }, ...ORIGINS.filter((o) => o.karma).map((o) => h('button', { class: 'opt', disabled: originUnlocked(o.id) || meta.karma < (o.karma || 0), onclick: () => { unlockOrigin(o.id); draw(); } },
        h('b', {}, originName(o, 'm').replace('Thánh tử', 'Thánh tử/nữ').replace('Đích tử', 'Đích tử/nữ')), h('small', {}, o.d), h('small', {}, originUnlocked(o.id) ? 'Đã mở' : `Mở khóa: ${o.karma} điểm`)))),
      h('div', { class: 'center', style: { marginTop: '18px' } }, btn('Trở lại', back, 'prime')),
    );
  };
  draw();
}

// ---------- Đầu thai ----------
export function creation() {
  let g: 'm' | 'f' = Math.random() < 0.5 ? 'm' : 'f';
  let name = mkName(g);
  let origin = ORIGINS.filter((o) => !o.karma)[Math.floor(Math.random() * 10)].id;
  let race: string = originRace(ORIGINS.find((o) => o.id === origin)!);
  const isBeast = () => race === 'Yêu tộc' || !!ORIGINS.find((o) => o.id === origin)?.beastOrigin;
  const leafNodes = beastLeafNodes();
  let chosenBeast: { n: string; el: El; reg?: string[]; home?: string } | null = isBeast() ? pick(leafNodes) : null;
  const pickOrigin = (o: (typeof ORIGINS)[number]) => {
    origin = o.id;
    perks = perks.filter((x) => perkAllowed(origin, x));
    fate.root = { ...baseRoot };
    fitRoot(fate, o);
    if (isBeast() && !chosenBeast) chosenBeast = pick(leafNodes);
    draw();
  };
  let fate: Fate = rollFate(false, g, isBeast());
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
    const verdict = h('div', { class: 'card verdict' + (hiddenRootKind(fate.root.k) ? ' thap' : '') },
      h('div', { class: 'small muted' }, 'Đánh giá linh căn'),
      h('div', { class: 'v-name' }, rk.n, fate.root.els.length ? h('span', { class: 'v-els' }, ...fate.root.els.map((e) => h('span', { class: 'el', style: { background: EL[e].c } }, EL[e].n))) : null),
      h('div', { class: 'small' }, `Tốc độ tu ×${rk.m} · phẩm chất ${rk.q}`),
      h('div', { class: 'small muted' }, rk.d),
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
    if (isBeast()) {
      return h('div', { class: 'free-pick' },
        h('h4', {}, 'Bản thể Yêu Thú & Yêu Đan Bản Mệnh (Hậu duệ xa nhất)'),
        h('div', { class: 'card verdict' },
          h('div', { class: 'small muted' }, 'Hậu duệ sơ khai trong cây gia phả'),
          h('div', { class: 'v-name' }, chosenBeast ? chosenBeast.n : 'Yêu thú',
            chosenBeast ? h('span', { class: 'v-els' }, h('span', { class: 'el', style: { background: EL[chosenBeast.el].c } }, EL[chosenBeast.el].n)) : null
          ),
          h('div', { class: 'small' }, `Yêu tộc không có linh căn nhân loại. Tu luyện bằng cách ngưng tụ Yêu Đan (${chosenBeast ? EL[chosenBeast.el].n : ''} hệ) và rèn luyện thể phách.`),
          h('div', { class: 'small muted' }, 'Theo cảnh giới và thế giới, huyết mạch sẽ thức tỉnh và thoát biến tiến hóa lên các bậc cao hơn trong gia phả.'),
          h('div', { style: { marginTop: '8px' } },
            btn('🎲 Đổi loài ngẫu nhiên', () => { chosenBeast = pick(leafNodes); draw(); }, 'small'),
          ),
        ),
        h('h4', {}, 'Thể chất Yêu Tộc'),
        h('div', { class: 'opts' }, ...BEAST_BODIES.map((b) => h('button', { class: 'opt' + (fate.body === b.id ? ' on' : ''), onclick: () => { fate.body = b.id; draw(); } },
          h('b', {}, b.n), h('small', {}, bodyFx(b)), h('small', {}, b.d)))),
      );
    }
    const elBtn = (e: El) => {
      const on = fate.root.els.includes(e);
      return h('button', { class: 'opt el-opt' + (on ? ' on' : ''), style: { borderColor: on ? EL[e].c : undefined }, onclick: () => toggleEl(e) },
        h('span', { class: 'el-ch', style: { background: EL[e].c }, html: glyphSvg(e, 16, 2) }), h('b', {}, EL[e].n));
    };
    return h('div', { class: 'free-pick' },
      h('h4', {}, 'Linh căn — chọn tùy ý các hệ (bỏ trống = phế linh căn)'),
      h('div', { class: 'opts el-opts' }, ...ALL_EL.map(elBtn), ...YINYANG_EL.map(elBtn)),
      h('div', { style: { margin: '6px 0' } }, btn('Bỏ chọn hết', () => setAll([]), 'small'), ' ', btn('Ngũ hành', () => setAll(BASIC_EL), 'small'), ' ', btn('Đủ mười hệ', () => setAll(ALL_EL), 'small'), ' ', btn('Hỗn Độn · 12 hệ', () => setAll(EVERY_EL), 'small')),
      verdict,
      h('h4', {}, 'Thể chất'),
      h('div', { class: 'opts' }, ...BODIES.filter((b) => !b.g || b.g === g).map((b) => h('button', { class: 'opt' + (fate.body === b.id ? ' on' : ''), onclick: () => { fate.body = b.id; draw(); } },
        h('b', {}, b.n), h('small', {}, bodyFx(b)), h('small', {}, b.d)))),
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
      h('div', { class: 'card' },
        h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' } },
          h('div', { class: 'avatar', style: { width: '64px', height: '64px' }, html: avatarSvg(g, 0, fate.root.els[0] || null, 60, playerPortrait(g, 0)) }),
          h('div', {}, h('div', { class: 'small muted' }, 'Tên'), nameIn, ' ', btn('🎲', () => { name = mkName(g); draw(); }, 'small', { title: 'Tên ngẫu nhiên' })),
          h('div', {}, h('div', { class: 'small muted' }, 'Giới tính'),
            btn('Nam', () => { g = 'm'; name = mkName(g); if (BODIES.find((b) => b.id === fate.body)?.g === 'f') fate.body = 'pham'; draw(); }, g === 'm' ? 'prime small' : 'small'), ' ',
            btn('Nữ', () => { g = 'f'; name = mkName(g); if (BODIES.find((b) => b.id === fate.body)?.g === 'm') fate.body = 'pham'; draw(); }, g === 'f' ? 'prime small' : 'small')),
        ),
      ),
      h('h3', {}, 'Chủng tộc'),
      h('div', { class: 'opts' }, ...RACE_GROUPS.map((r) => {
        const list = ORIGINS.filter((o) => originRace(o) === r);
        const locked = list.filter((o) => !originUnlocked(o.id)).length;
        return h('button', { class: 'opt' + (r === race ? ' on' : ''), onclick: () => {
          if (r === race) return;
          race = r;
          const nextOrg = list.find((o) => originUnlocked(o.id)) ?? list[0];
          origin = nextOrg.id;
          perks = [];
          if (isBeast()) {
            chosenBeast = pick(leafNodes);
            fate = rollFate(false, g, true);
          } else {
            chosenBeast = null;
            fate = rollFate(false, g, false);
          }
          baseRoot = { ...fate.root };
          fitRoot(fate, nextOrg);
          draw();
        } },
          h('b', {}, r), h('small', {}, `${list.length} xuất thân${locked ? ` · ${locked} cần điểm Luân Hồi` : ''}`));
      })),
      RACE_INFO[race] ? h('p', { class: 'small', style: { fontStyle: 'italic' } }, RACE_INFO[race]) : null,
      h('h3', {}, `Xuất thân — ${race}`),
      h('div', { class: 'opts' }, ...ORIGINS.filter((o) => originRace(o) === race).map((o) => {
        const locked = !originUnlocked(o.id);
        const detail = o.beastOrigin || o.race
          ? o.d
          : `${LOCS[o.loc].n} · ${o.money} linh thạch${o.craft ? ' · biết nghề' : ''}${o.tech ? ' · có công pháp' : ''}${o.startR ? ' · khởi đầu Luyện Khí' : ''}${o.sect ? ' · chân truyền thánh địa' : ''}`;
        return h('button', { class: 'opt' + (o.id === origin ? ' on' : ''), disabled: locked, onclick: () => pickOrigin(o) },
          h('b', {}, originName(o, g) + (o.karma ? ' ★' : '')), h('small', {}, locked ? `Mở ở Điện Luân Hồi (${o.karma} điểm)` : detail));
      })),
      h('p', { class: 'small', style: { fontStyle: 'italic' } }, org.d),
      h('h3', {}, 'Mệnh số'),
      h('div', { class: 'card' },
        h('div', { class: 'stats5' }, ...STAT_KEYS.map((k) => h('div', { title: STATS[k].d }, h('b', {}, String(fate.stats[k] + (org.stat?.[k] || 0))), h('span', { class: 'small' }, STATS[k].n),
          freeMode() ? h('div', {}, btn('−', () => { fate.stats[k] = Math.max(1, fate.stats[k] - 1); draw(); }, 'small'), ' ', btn('+', () => { fate.stats[k] = Math.min(10, fate.stats[k] + 1); draw(); }, 'small'), ' ', btn('Max', () => { fate.stats[k] = 10; draw(); }, 'small', { title: `${STATS[k].n} tối đa (10)` })) : null))),
        freeMode() ? freePicker() : null,
        freeMode() ? null : (isBeast()
          ? h('p', {},
              h('b', {}, 'Bản thể khởi đầu: '),
              chosenBeast ? h('span', { style: { fontWeight: 'bold', color: 'var(--prime)' } }, chosenBeast.n) : 'Yêu thú',
              ' ',
              chosenBeast ? h('span', { class: 'el', style: { background: EL[chosenBeast.el].c } }, EL[chosenBeast.el].n) : null,
              ' ',
              btn('🎲 Đổi loài thú', () => { chosenBeast = pick(leafNodes); draw(); }, 'small'),
              h('br', {}),
              h('span', { class: 'small muted' }, `Không có linh căn. Tu luyện bằng cách ngưng tụ Yêu Đan (${chosenBeast ? EL[chosenBeast.el].n : ''} hệ), rèn luyện nhục thân và thần thông. Đạt đủ cảnh giới sẽ tiến hóa lên loài cao hơn theo cây gia phả.`))
          : h('p', {}, h('b', {}, 'Linh căn: '), root.n, fate.root.els.length ? ` (${fate.root.els.map((e) => EL[e].n).join(' · ')})` : '', h('br', {}), h('span', { class: 'small muted' }, root.d))),
        freeMode() ? null : (isBeast()
          ? h('p', {}, h('b', {}, 'Thể chất Yêu Tộc: '), body.n, h('br', {}), h('span', { class: 'small muted' }, body.d))
          : h('p', {}, h('b', {}, 'Thể chất: '), body.n, h('br', {}), h('span', { class: 'small muted' }, body.d))),
        freeMode() ? null : h('div', { class: 'center' }, btn(`Gieo lại mệnh số (còn ${left})`, () => {
          if (left > 0) {
            left--;
            fate = rollFate(!!org.rootBoost, g, isBeast());
            baseRoot = { ...fate.root };
            fitRoot(fate, org);
            perks = [];
            if (isBeast()) chosenBeast = pick(leafNodes);
            draw();
          }
        }, '', { dis: left <= 0 })),
      ),
      h('h3', {}, freeMode() ? `Thiên phú — chọn tùy ý (đã chọn ${perks.length})` : `Thiên phú — chọn ${perkN}`),
      freeMode() ? h('div', { style: { margin: '0 0 8px' } }, btn('Chọn hết thiên phú tốt', () => { perks = perkList.filter((p) => !p.bad).map((p) => p.id); draw(); }, 'small'), ' ', btn('Chọn tất cả', () => { perks = perkList.map((p) => p.id); draw(); }, 'small'), ' ', btn('Bỏ chọn hết', () => { perks = []; draw(); }, 'small ghost')) : null,
      h('div', { class: 'opts' }, ...(freeMode() ? perkList.map((p) => p.id) : [...forced.filter((x) => !fate.perkOffer.includes(x)), ...fate.perkOffer]).map((id) => {
        const p = perkList.find((x) => x.id === id) || PERKS.find((x) => x.id === id)!;
        const must = forced.includes(id); // thiên phú bắt buộc của xuất thân: luôn bật, không bỏ được, không tính vào số được chọn
        const on = must || perks.includes(id);
        const blocked = !perkAllowed(origin, id); // vd. huyết hải thâm thù không đi cùng Diệp gia Hỗn Độn
        const picked = perks.filter((x) => !forced.includes(x)).length;
        return h('button', { class: 'opt' + (on ? ' on' : '') + (p.bad ? ' bad' : ''), disabled: blocked || must, onclick: () => { perks = on ? perks.filter((x) => x !== id) : picked < perkN ? [...perks, id] : perks; draw(); } }, h('b', {}, p.n), h('small', {}, must ? `${p.d} Bắt buộc với ${org.race ?? originName(org, g)}.` : blocked ? `${p.d} Không hợp với xuất thân ${originName(org, g)} — chỉ chọn một trong hai.` : p.d));
      })),
      h('div', { class: 'center', style: { marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' } },
        btn('Trở lại', titleScreen),
        btn('Bước vào nhân gian', () => {
          if (!name.trim()) return notice('Hãy đặt tên cho nhân vật.', 'Thiếu tên');
          if ((freeMode() ? perks.length + forced.length : perks.filter((x) => !forced.includes(x)).length) < (freeMode() ? 1 : perkN)) return notice(`Hãy chọn ${freeMode() ? 'ít nhất 1' : 'đủ ' + perkN} thiên phú.`, 'Thiếu thiên phú');
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
