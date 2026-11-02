// Màn đánh tay theo lượt. Chơi trên trạng thái hiện tại; xong thì trả kịch bản (hạt giống + chuỗi thao tác)
// để sự kiện chạy lại trận y hệt và áp kết quả (xem withFights).
import { skSource, skSrcMul } from '../engine/char';
import { glyphSvg } from './glyph';
import { h, btn, bar, hpBar, shieldLayers } from './dom';
import { s, meta } from '../engine/state';
import { Battle, BASIC, FightPending, fightLogs, setFightCtx, manualFights, skCost, type Script } from '../engine/combat';
import { REALMS, STAGES, EL } from '../data/core';
import { TALIS } from '../data/items';
import { itemName, age, maxLife, stageName } from '../engine/char';
import { skillIconSvg, linhIconSvg } from './icons';
import { avatarSvg, playerPortrait, foePortrait } from './portrait';
import { fmt } from '../core/util';
import { arenaScene, slotPos, fighterSlot } from './arena';
import type { Fighter } from '../engine/combat';
import type { Skill } from '../data/items';

const KIND_N: Record<string, string> = { atk: 'Tấn công', multi: 'Liên kích', dot: 'Kéo dài', heal: 'Hồi phục', shield: 'Hộ thể' };
let keyFn: ((e: KeyboardEvent) => void) | null = null;

let root: HTMLElement | null = null;

/** Dựng các ô đội hình một bên (tối đa 10 chiến binh): ô 0 là thủ lĩnh, cự nhân Pháp Thiên Tượng Địa đứng sau ô 0. Có thanh máu nhỏ. */
function slots(side: 'me' | 'foe', list: Fighter[], giant: { giant: string | null; col: string; glow: string } | null): HTMLElement[] {
  return list.slice(0, 10).map((f, i) => {
    const ps = slotPos(i);
    const sl = fighterSlot(f, side);
    const style: Record<string, string> = { bottom: `${ps.bottom}%`, zIndex: String(Math.round(10 - ps.depth * 2)) };
    style[side === 'me' ? 'right' : 'left'] = `${100 - ps.x - 22}%`;
    const dead = f.hp <= 0 && !f.fled;
    return h('div', { class: 'fa-slot' + (ps.depth >= 1 ? ' back' : '') + (ps.depth >= 2.4 ? ' far' : '') + (i === 0 ? ' lead' : '') + (dead ? ' dead' : '') + (f.fled ? ' fled' : ''), style, title: `${f.name} · ${Math.max(0, Math.round(f.hp))}/${f.maxHp}` },
      i === 0 && giant?.giant ? h('div', { class: 'fa-giant', style: { maskImage: `url(${giant.giant})`, webkitMaskImage: `url(${giant.giant})`, background: giant.col, filter: `drop-shadow(0 0 10px ${giant.glow}) drop-shadow(0 0 28px ${giant.glow})` } }) : null,
      sl ? h('img', { class: 'fa-sprite' + (sl.beast ? ' beast' : '') + (sl.mirror ? ' mir' : ''), src: sl.src, alt: '' }) : h('div', { class: 'fa-ghost' }, f.name.slice(0, 2)),
      miniHp(f));
  });
}
/** Thanh máu nhỏ dưới chân mỗi ô, có phần giáp nối sau máu. */
function miniHp(f: Fighter): HTMLElement {
  const m = f.maxHp || 1;
  return h('div', { class: 'fa-hp' }, h('i', { style: { width: `${Math.max(0, Math.min(100, (f.hp / m) * 100))}%` } }),
    ...shieldLayers(f.shield || 0, m).map((l) => h('i', { style: { width: `${l.w}%`, background: l.c } })));
}

function openFight(p: FightPending, done: (sc: Script) => void) {
  const b = new Battle(p.spec, p.opts, p.seed);
  b.interactive = true;
  root?.remove();
  root = h('div', { id: 'fightbox' });
  document.body.append(root);
  let auto = false;
  let logOpen = false;
  const finish = () => {
    root?.remove();
    root = null;
    if (keyFn) removeEventListener('keydown', keyFn);
    keyFn = null;
    done({ seed: p.seed, acts: b.acts });
  };
  const act = (a: Parameters<Battle['do']>[0]) => { b.do(a); draw(); };
  const runAuto = () => {
    auto = true;
    const step = () => {
      if (!root || b.over) { draw(); return; }
      b.autoTurn();
      draw();
      setTimeout(step, 380);
    };
    b.acts.push({ t: 'auto' });
    step();
  };
  const draw = () => {
    if (!root) return;
    const f = b.foe, me = b.p;
    const myT = !b.over && !auto;
    root.innerHTML = '';
    const sc = arenaScene(b, p.seed);
    root.classList.toggle('nobg', !sc.bg);
    root.style.backgroundImage = sc.bg ? `url(${sc.bg})` : '';
    const foeRealm = f.r ? `${REALMS[f.r].n} ${STAGES[f.st]}` : 'phàm nhân';
    const intentTxt = b.over ? '' : b.intent.k === 'shield' ? `Sắp ra: ${b.intent.n} (hộ thuẫn)` : b.intent.k === 'heal' ? `Sắp ra: ${b.intent.n} (hồi máu)` : `Sắp ra: ${b.intent.n} · ~${b.estIntent()} sát thương`;
    const lifeLeft = Math.max(0, Math.floor(maxLife() - age() - b.burnYears));
    // ---- sân đấu: nền trời, ta bên trái, địch bên phải, cự nhân sau lưng khi đã thi triển Pháp Thiên Tượng Địa ----
    const arena = h('div', { class: 'fa-arena' },
      h('div', { class: 'fb-head' }, h('b', {}, 'Giao chiến'), ` · Hiệp ${b.round}${b.lethal ? ' · sinh tử' : ' · luận bàn'}`,
        b.uyDiff > 0 ? h('span', { class: 'fb-uy dn' }, ` · bị uy áp, công còn ${Math.round(b.uyMul() * 100)}%`) : b.uyDiff < 0 ? h('span', { class: 'fb-uy up' }, ' · áp chế đối phương') : null),
      h('div', { class: 'fb-turn ' + (myT ? 'me' : 'foe') }, b.over ? 'Trận đấu kết thúc' : auto ? 'Đang tự động đánh…' : ['Lượt của ngươi', h('span', { class: 'fb-hint' }, ' · mỗi chiêu dùng một lần, đủ linh lực là xuất chiêu, xong bấm Kết thúc lượt (Space).')]),
      h('div', { class: 'fa-side me' }, ...slots('me', [me, ...b.allies], b.pttd && sc.giant ? sc : null)),
      h('div', { class: 'fa-side foe' }, ...slots('foe', [f, ...b.foes], null)),
      h('div', { class: 'fb-me fa-card' },
        h('div', { class: 'fb-por sm', html: avatarSvg(s.g, s.r, me.el, 40, playerPortrait(s.g, age())) }),
        h('div', { class: 'fb-name' }, h('b', {}, me.name), ` · ${stageName()}${me.hot?.length ? ` · ${me.hot.map((t) => `${t.n} hồi ${fmt(t.v)}/lượt, còn ${t.turns} lượt`).join(' · ')}` : ''}${b.burns ? ` · đã thiêu đốt ${b.burns}/3` : ''}${b.guard ? ' · thủ thế' : ''}${b.pttd ? ' · Pháp Thiên Tượng Địa' : ''}`),
        h('div', { class: 'fb-row' }, h('span', {}, 'Khí huyết'), hpBar(me.hp, me.maxHp, me.shield), h('span', {}, `${fmt(Math.max(0, Math.round(me.hp)))} / ${fmt(me.maxHp)}`, me.shield > 0 ? h('span', { class: 'fb-sh' }, ` +${fmt(Math.round(me.shield))} giáp`) : null)),
        h('div', { class: 'fb-row' }, h('span', {}, 'Linh lực'), bar((b.mp / b.mpMax) * 100, 'mp'), h('span', {}, `${b.mp.toFixed(1)} / ${Math.round(b.mpMax)} · +${b.regen.toFixed(1)}`))),
      h('div', { class: 'fb-foe fa-card' },
        h('div', { class: 'fb-por', html: linhIconSvg(b.spec?.kind === 'beast' ? 'paw' : b.spec?.kind === 'demon' ? 'demon' : b.spec?.kind === 'mortal' ? 'mortal' : 'cultivator', f.el || 'tho', 52, foePortrait(b.spec?.kind, f.el, f.name)) }),
        h('div', { class: 'fb-body' },
          h('div', { class: 'fb-name' }, f.el ? h('span', { class: 'fb-el', style: { background: EL[f.el].c } }, EL[f.el].n) : null, h('b', {}, f.name), h('span', { class: 'fb-realm' }, foeRealm)),
          h('div', { class: 'fb-row' }, h('span', {}, 'Khí huyết'), hpBar(f.hp, f.maxHp, f.shield), h('span', {}, `${fmt(Math.max(0, Math.round(f.hp)))} / ${fmt(f.maxHp)}`, f.shield > 0 ? h('span', { class: 'fb-sh' }, ` +${fmt(Math.round(f.shield))} giáp`) : null)),
          intentTxt ? h('div', { class: 'fb-intent' }, intentTxt) : null,
          h('div', { class: 'fb-moves' }, h('span', { class: 'small muted' }, 'Chiêu thức:'), ...b.foeMoves().map((m) => h('span', { class: 'fb-mv' + (!b.over && m.n === b.intent.n ? ' next' : '') },
            m.k === 'shield' ? `${m.n} · hộ thuẫn` : m.k === 'heal' ? `${m.n} · hồi máu` : `${m.n} ~${fmt(b.estMove(m))}`))))));
    root.append(arena);
    // ---- bảng dưới (một cột): chiêu thức → đan/phù → thanh nút. Nhật ký trận không hiện sẵn, bấm nút "Nhật ký trận" (L) mở khung riêng ----
    const right = h('div', { class: 'fa-panel' });
    root.append(right);
    const logBtn = (cls = 'ghost') => btn([h('span', { class: 'fb-logic', html: glyphSvg('log', 15) }), ` Nhật ký trận · ${b.log.length}`], () => { logOpen = !logOpen; draw(); }, cls + ' fb-logbtn', { title: 'Xem toàn bộ diễn biến trận đấu (phím L)' });
    if (logOpen) {
      const close = () => { logOpen = false; draw(); };
      const body = h('ol', { class: 'fa-loglist' }, ...b.log.map((l) => h('li', { class: l.startsWith('—') ? 'sep' : /^Hiệp \d/.test(l) ? 'round' : '' }, l)));
      root.append(h('div', { class: 'fa-logbox', onclick: (e: MouseEvent) => { if (e.target === e.currentTarget) close(); } },
        h('div', { class: 'fa-logcard' },
          h('div', { class: 'fa-loghead' }, h('span', { class: 'seal', html: glyphSvg('log', 18) }), h('b', {}, 'Nhật ký trận đấu'), h('span', { class: 'small muted' }, `Hiệp ${b.round} · ${b.log.length} dòng`), h('button', { class: 'pl-x', title: 'Đóng (Esc)', onclick: close }, '✕')),
          body,
          h('div', { class: 'fa-logfoot' }, btn('Đóng · Esc', close, 'ghost')))));
      requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
    }
    if (b.over) {
      // Kết quả hiện bằng hộp nổi giữa sân, bảng chiêu bên dưới vẫn vẽ nhưng bị khoá.
      const title = b.over === 'win' ? 'Thắng trận' : b.over === 'fled' ? 'Thoát thân' : b.over === 'draw' ? 'Bất phân thắng bại' : 'Bại trận';
      const msg = b.over === 'win' ? `${f.name} bại trận.` : b.over === 'fled' ? 'Ngươi đã thoát thân.' : b.over === 'draw' ? 'Hai bên giằng co, đành rút lui.' : 'Ngươi gục xuống…';
      root.append(h('div', { class: 'fa-veil' }),
        h('div', { class: 'fa-result res-' + b.over }, // tiền tố res-: tránh trùng class .win của cửa sổ game
          h('h2', {}, h('span', { class: 'seal', html: glyphSvg(b.over, 20) }), title),
          h('div', { class: 'fa-res-sub' }, `Hiệp ${b.round}${b.lethal ? ' · sinh tử' : ' · luận bàn'}`),
          h('div', { class: 'fa-res-msg' }, msg),
          h('div', { class: 'fa-res-log' }, ...b.log.slice(-3).map((l) => h('div', {}, l))),
          h('div', { class: 'fb-btns' }, logBtn(), btn('Tiếp tục · Enter', finish, 'prime'))));
    }
    if (b.pending) {
      const pd = b.pending;
      const guards = b.allies.filter((x) => x !== pd.ally && x.hp > 0 && !x.fled);
      right.append(h('div', { class: 'fb-rescue' },
        h('div', { class: 'fb-end' }, `${pd.ally.name} sắp bị ${pd.attacker.name} đánh gục (${pd.label}, ${fmt(pd.dmg)} sát thương, còn ${fmt(Math.max(0, Math.round(pd.ally.hp)))} khí huyết).`),
        h('div', { class: 'small muted' }, 'Cho chạy trốn: thoát được thì chỉ trọng thương, không thoát thì tử trận. Hoặc chọn một người đỡ hộ đòn này để người ấy chắc chắn thoát.'),
        h('div', { class: 'fb-btns' },
          btn(`Để ${pd.ally.name} chạy trốn · ${Math.round(b.allyFleeChance(pd.ally) * 100)}%`, () => act({ t: 'rescue', mode: 'flee' }), 'prime'),
          btn(`Ta đỡ đòn · còn ${fmt(Math.round(me.hp))} khí huyết`, () => act({ t: 'rescue', mode: 'guard', who: 'me' }), me.hp + me.shield > pd.dmg ? 'danger' : 'danger', { title: me.hp + me.shield <= pd.dmg ? 'Đòn này đủ hạ gục ngươi!' : 'Ngươi chịu đòn thay' }),
          ...guards.map((g) => btn(`${g.name} đỡ đòn · còn ${fmt(Math.round(g.hp))}`, () => act({ t: 'rescue', mode: 'guard', who: g.id }), g.hp + g.shield > pd.dmg ? '' : 'ghost', { title: g.hp + g.shield <= pd.dmg ? `${g.name} sẽ gục sau đòn này` : `${g.name} chịu đòn thay` })),
          h('span', { class: 'fa-spacer' }), logBtn())));
      return;
    }
    const list: Skill[] = [BASIC, ...me.skills];
    const sk = list.map((k, i) => {
      const basic = k.id === 'quyen';
      const ok = basic ? !b.used.includes('quyen') : b.canUse(k);
      const e = b.estSkill(k);
      const eff = e.k === 'heal' ? `hồi ${fmt(e.v)} khí huyết${k.hot ? ` + ${fmt(Math.round(e.v * k.hot.m))}/lượt × ${k.hot.turns} lượt` : ''}` : e.k === 'shield' ? `hộ thuẫn ${fmt(e.v)}` : `${fmt(e.v)} sát thương${k.k === 'multi' ? ' (3 đòn)' : k.k === 'dot' ? ' + ăn mòn' : ''}`;
      const cost = b.used.includes(k.id) ? 'đã dùng lượt này' : basic ? 'không tốn' : `${skCost(k)} linh lực`;
      const tag = e.em > 1 ? h('span', { class: 'fb-tag up' }, 'khắc') : e.em < 1 ? h('span', { class: 'fb-tag dn' }, 'bị khắc') : null;
      return h('button', { class: 'fb-sk' + (ok ? '' : ' off'), disabled: !myT || !ok, title: `${k.n} · ${KIND_N[k.k]}${skSource(k.id) ? ` · truyền từ ${skSource(k.id)!.n} (×${skSrcMul(k.id).toFixed(2)})` : ''}${k.d ? ' · ' + k.d : ''}`, onclick: () => act(basic ? { t: 'basic' } : { t: 'sk', id: k.id }) },
        h('span', { class: 'fb-ic', html: skillIconSvg(k, 34, !ok) }),
        h('span', { class: 'fb-skt' }, h('b', {}, `${i + 1}. ${k.n} `, tag), h('small', { class: e.k === 'dmg' ? 'dmg' : 'sup' }, `${eff} · ${cost}`)));
    });
    right.append(h('div', { class: 'fb-skills' }, ...sk));
    const its = b.items();
    if (its.length) right.append(h('div', { class: 'fb-items' }, h('span', { class: 'small muted' }, b.itemUsed ? 'Đan · phù (đã dùng lượt này): ' : 'Đan · phù (một lần mỗi lượt): '),
      ...its.slice(0, 8).map((x) => btn(`${itemName(x.id, x.g)}${x.id.startsWith('t:') && TALIS[x.id.slice(2)].co ? ' ✦' : ''}`, () => act({ t: 'item', id: x.id, g: x.g }), 'small', { dis: !myT || b.itemUsed }))));
    const mpLow = !me.skills.some((k) => b.canUse(k)) && me.skills.length > 0;
    if (mpLow && !b.used.length) right.append(h('div', { class: 'fb-warn' }, 'Linh lực đã cạn, chỉ còn Quyền cước cơ bản. Có thể Điều tức để hồi linh lực.'));
    // thanh nút: hành động lượt bên trái, nút phụ (tự động, nhật ký) dồn sang phải
    right.append(h('div', { class: 'fb-btns fa-actions' },
      btn(`Kết thúc lượt${b.used.length ? '' : ' (chưa ra chiêu)'} · Space`, () => act({ t: 'end' }), 'prime', { dis: !myT }),
      btn(`Điều tức · +${Math.round(b.mpMax * 0.35)} linh lực`, () => act({ t: 'rest' }), '', { dis: !myT || !b.canRest() }),
      btn(`Thiêu đốt thọ nguyên · ${b.burnCost()} năm · ${b.burns}/3`, () => act({ t: 'burn' }), 'danger', { dis: !myT || b.burns >= 3, title: `Còn ${lifeLeft} năm thọ nguyên` }),
      b.canUy() ? btn('Phóng uy áp', () => act({ t: 'uy' }), 'danger', { dis: !myT }) : null,
      b.opts.noFlee ? null : btn(`Thoát thân · ${Math.round(b.fleeChance() * 100)}%${b.fleeTalis() ? ' (có phù)' : ''}`, () => act({ t: 'flee' }), '', { dis: !myT }),
      h('span', { class: 'fa-spacer' }),
      btn('Tự động đánh', runAuto, 'ghost', { dis: !myT }),
      logBtn(),
    ));
  };
  if (keyFn) removeEventListener('keydown', keyFn);
  keyFn = (e: KeyboardEvent) => {
    if (!root) return;
    if (e.key === 'Escape' && logOpen) { e.preventDefault(); logOpen = false; draw(); return; }
    if (e.key === 'l' || e.key === 'L') { e.preventDefault(); logOpen = !logOpen; draw(); return; }
    if (logOpen) return;
    if (b.over) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } return; }
    if (auto || b.pending) return;
    if (e.key === ' ') { e.preventDefault(); act({ t: 'end' }); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= 9) {
      const k = [BASIC, ...b.p.skills][n - 1];
      if (k) act(k.id === 'quyen' ? { t: 'basic' } : { t: 'sk', id: k.id });
    }
  };
  addEventListener('keydown', keyFn);
  draw();
}

// ---------- Khôi phục trạng thái tại chỗ (giữ nguyên đối tượng để các closure của sự kiện vẫn đúng) ----------
function restoreInto(t: any, src: any) {
  if (Array.isArray(src)) {
    t.length = src.length;
    for (let i = 0; i < src.length; i++) {
      if (src[i] && typeof src[i] === 'object' && t[i] && typeof t[i] === 'object' && Array.isArray(src[i]) === Array.isArray(t[i])) restoreInto(t[i], src[i]);
      else t[i] = src[i];
    }
    return;
  }
  for (const k of Object.keys(t)) if (!(k in src)) delete t[k];
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v && typeof v === 'object' && t[k] && typeof t[k] === 'object' && Array.isArray(v) === Array.isArray(t[k])) restoreInto(t[k], v);
    else t[k] = v;
  }
}

/**
 * Chạy một hành động có thể có giao chiến. Khi gặp trận (FightPending), dừng lại mở màn đánh tay;
 * đánh xong thì khôi phục trạng thái, chạy lại hành động với cùng chuỗi ngẫu nhiên và kịch bản trận đã đánh.
 */
export function withFights<T>(fn: () => T, done: (v: T) => void, fail: (e: unknown) => void) {
  if (!manualFights()) {
    let v: T;
    try { v = fn(); } catch (e) { fail(e); return; }
    done(v);
    return;
  }
  const snapS = structuredClone(s);
  const snapM = structuredClone(meta);
  const logLen = fightLogs.length;
  const scripts: Script[] = [];
  let rec: number[] = [];
  const attempt = () => {
    const replay = rec;
    rec = [];
    let i = 0;
    const orig = Math.random;
    Math.random = () => { const v = i < replay.length ? replay[i++] : orig(); rec.push(v); return v; };
    setFightCtx({ scripts, i: 0 });
    let v: T | undefined;
    let pend: FightPending | null = null;
    let err: unknown = null;
    try { v = fn(); } catch (e) { if (e instanceof FightPending) pend = e; else err = e; }
    Math.random = orig;
    setFightCtx(null);
    if (err) { fail(err); return; }
    if (!pend) { done(v as T); return; }
    openFight(pend, (sc) => {
      scripts.push(sc);
      restoreInto(s, structuredClone(snapS));
      restoreInto(meta, structuredClone(snapM));
      fightLogs.length = logLen;
      attempt();
    });
  };
  attempt();
}
