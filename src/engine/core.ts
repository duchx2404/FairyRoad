import { ensureNpcBeasts } from '../data/npc-beasts';
import { phams, phamSum, perfectBody } from './char';
import { BREAK_PILL, PHAM_N, PHAM_T, holySur, GIVEN_F, GIVEN_M, hiddenRootKind } from '../data/core';
import { slots } from './slots';
import { ensureWorldNames } from './names';
import { doctrineAccepts } from './sect-doctrine';
// Lõi vận hành: nhật ký, thời gian, tu luyện, đột phá, đi lại, NPC, dấu trên bản đồ.
import { worldSize, RMAX, npcCap, DAO_CO, REALMS, BREAK_BASE, EL, ALL_EL, SURN, MALE, FEM, DAO_HAO, DAO_HAO_F, STAGES, type El } from '../data/core';
import { isLaoTo, daoTitle, DIA_THE, LOCS, LOC_LIST, SECTS, REGIONS, MAP_W, MAP_H, RANK_PAY, type Loc, worldPack } from '../data/world';
import { tryEvolvePlayerBeast } from './beast-evolution';
import { PILLS } from '../data/items';
import { s, meta, codexAdd, type NPC, type NpcTag, type Pin } from './state';
import { primaryDaolu } from './relationships';
import { moneyScale, effRi, tamSum, pqSum, myLinh, cultRate, atBottleneck, stat, age, maxLife, placeQi, has, pillMult, removeItem, count, body, thienMenh, daoCoInfo, thienDo, tang, turnLen, realmAt, effR, stageName } from './char';
import { hooks } from './bus';
import { ch, clamp, pick, ri, rf, uid, yearsTxt } from '../core/util';
import { CHANLINH, MOUNT_SPEED, MOUNT_BLINK, canRideBeast } from '../data/spirit';
import { tickLinh } from './beast-companion';

// ---------- Nhật ký ----------
export function addLog(t: string, k?: 'mark' | 'bad' | 'good' | 'ai') {
  s.log.push({ y: s.year, t, k });
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
}
/** Mốc đời người — hiện trong tiểu sử và sử ký. */
export function mark(t: string) {
  s.marks.push({ y: s.year, t, k: 'mark' });
  addLog(t, 'mark');
}

export const worldYear = () => Math.floor(s.year);
export function dateStr(y = s.year) {
  const yy = Math.floor(y);
  const mm = Math.floor((y - yy) * 12) + 1;
  return `Năm ${yy} tháng ${mm}`;
}

// ---------- NPC ----------
export const TRAITS = ['trầm mặc ít lời', 'hào sảng thích rượu', 'đa nghi', 'si mê luyện đan', 'lắm mưu nhiều kế', 'chính trực cứng đầu', 'thích náo nhiệt', 'lạnh lùng', 'tham tài', 'hiếu học', 'dịu dàng', 'cuồng chiến', 'mê kiếm', 'nhát gan nhưng tốt bụng', 'tự phụ'];
export function mkName(g: 'm' | 'f') {
  return `${pick(SURN)} ${pick(g === 'm' ? MALE : FEM)}`;
}
export interface NpcOpts {
  g?: 'm' | 'f';
  name?: string;
  dr?: number; // chênh lệch cảnh giới so với người chơi
  r?: number;
  st?: number;
  tag?: NpcTag;
  rel?: number;
  how?: string;
  sect?: string | null;
  el?: El;
  age?: number;
  talent?: number;
}
export function mkNpc(o: NpcOpts = {}): NPC {
  const g = o.g || (ch(0.5) ? 'm' : 'f');
  const r = clamp(o.r ?? effRi() + (o.dr ?? 0), 0, npcCap());
  const st = o.st ?? (r === 0 ? 0 : ri(0, 3));
  const life = REALMS[r].life;
  const a = o.age ?? (r === 0 ? ri(14, 40) : Math.min(life - 5, ri(Math.max(16, Math.round(age() * 0.6)), Math.max(20, Math.round(life * (r >= 3 ? 0.5 : 0.35))))));
  let name = o.name || mkName(g);
  const tier = o.sect && SECTS[o.sect] ? SECTS[o.sect].tier : 0;
  if (!o.name && (r >= 4 || isLaoTo(r, st, tier)) && ch(0.5)) name = daoTitle(pick(g === 'm' ? DAO_HAO : DAO_HAO_F), r, st, tier, g);
  const n: NPC = {
    id: uid(),
    name,
    g,
    born: s.year - a,
    life: Math.round(life * rf(0.9, 1.15)),
    r,
    st,
    el: o.el || pick(ALL_EL),
    sect: o.sect === undefined ? (r > 0 && ch(0.5) ? pick(Object.keys(SECTS)) : null) : o.sect,
    rel: o.rel ?? 0,
    tag: o.tag || 'acq',
    how: o.how || '',
    alive: true,
    loc: s.loc,
    trait: pick(TRAITS),
    talent: o.talent ?? (r === 0 ? 0 : rf(0.5, 1.4)),
    met: s.year,
  };
  if (!o.name && n.sect && !doctrineAccepts({ ...n, sect: SECTS[n.sect]?.n ?? n.sect })) n.sect = null;
  ensureNpcBeasts(n, s.world ?? 0);
  return n;
}
/** Thêm NPC vào nhân mạch (tối đa 40, bỏ người quen sơ đã mất). */
/** Mọi người mang họ Diệp đều là huyết mạch Diệp thị Hoang Cổ, lưu lạc khắp các châu. */
export const isDiep = (name: string) => name.startsWith('Diệp ');
export function addNpc(n: NPC): NPC {
  if (has('dinhvan') && n.rel >= 0) n.rel += 15;
  if (isDiep(n.name) && !n.how.includes('Diệp thị')) {
    n.talent = Math.min(2, (n.talent ?? 1) * 1.2); // máu Hoang Cổ
    if (s.flags.diepBlood && n.tag !== 'enemy' && n.tag !== 'rival') {
      n.rel = Math.min(100, n.rel + 25);
      n.how = `${n.how} · cùng huyết mạch Diệp thị`;
    }
  }
  s.npcs.push(n);
  ensureWorldNames();
  if (s.npcs.length > 40) {
    const idx = s.npcs.findIndex((x) => !x.alive || (x.tag === 'acq' && Math.abs(x.rel) < 30));
    if (idx >= 0) s.npcs.splice(idx, 1);
  }
  return n;
}
export const npcAge = (n: NPC) => Math.floor(s.year - n.born);
/** Tên cho Thánh tử / Thánh nữ một thánh địa: họ cố định theo tông (HOLY_SUR), tên riêng ngẫu nhiên, không trùng ai. */
export function holyNpcName(sectId: string | null | undefined, g: 'm' | 'f'): string | undefined {
  const sur = holySur(sectId, g);
  if (!sur) return undefined;
  const taken = new Set([s?.name, ...(s?.npcs ?? []).map((x) => x.name)]);
  const givens = g === 'f' ? GIVEN_F : GIVEN_M;
  const pool = givens.filter((x) => !taken.has(`${sur} ${x}`));
  // ưu tiên tên riêng chưa ai dùng, để các thánh nữ / thánh tử không trùng tên riêng với nhau
  const fresh = pool.filter((x) => !(s?.npcs ?? []).some((n) => n.name.endsWith(' ' + x)));
  return `${sur} ${pick(fresh.length ? fresh : pool.length ? pool : givens)}`;
}
/** Đổi tên một NPC; mô tả của người khác có nhắc tên cũ cũng đổi theo. Trả lời lỗi nếu tên không hợp lệ. */
export function renameNpc(n: NPC, name: string): string | null {
  const nm = name.replace(/\s+/g, ' ').trim();
  if (nm.split(' ').length < 2) return 'Tên phải có họ và tên.';
  if (/[\u3400-\u9fff]/.test(nm)) return 'Không dùng chữ Hán.';
  if (nm.length > 30) return 'Tên quá dài.';
  if (nm === s.name || s.npcs.some((x) => x !== n && x.name === nm)) return 'Đã có người mang tên này.';
  const old = n.name;
  n.name = nm;
  for (const x of s.npcs) if (x !== n && x.how.includes(old)) x.how = x.how.split(old).join(nm);
  return null;
}
export const npcRealm = (n: NPC) => (n.r === 0 ? 'Phàm nhân' : `${REALMS[n.r].n} ${STAGES[n.st]}`);
export const findNpc = (id: string) => s.npcs.find((n) => n.id === id);
export const friends = () => s.npcs.filter((n) => n.alive && n.rel >= 40);
export const enemies = () => s.npcs.filter((n) => n.alive && (n.tag === 'enemy' || n.tag === 'rival' || n.rel <= -40));
export const daolu = () => primaryDaolu() ?? s.npcs.find((n) => n.alive && n.tag === 'daolu');
export const master = () => s.npcs.find((n) => n.alive && n.tag === 'master');
export function relChange(n: NPC, d: number) {
  n.rel = clamp(n.rel + d, -100, 100);
  if (n.rel <= -60 && n.tag !== 'enemy' && n.tag !== 'rival') n.tag = 'enemy';
  if (n.rel >= 40 && n.tag === 'acq') n.tag = 'friend';
}
export function relLabel(rel: number) {
  if (rel >= 90) return 'Sinh tử chi giao';
  if (rel >= 70) return 'Thân thiết';
  if (rel >= 40) return 'Bằng hữu';
  if (rel >= 10) return 'Có thiện cảm';
  if (rel > -10) return 'Bình thường';
  if (rel > -40) return 'Không ưa';
  if (rel > -70) return 'Thù địch';
  return 'Huyết hải thâm thù';
}

// ---------- Thời gian ----------
let deathPending: string | null = null;
export const pendingDeath = () => deathPending;
export const clearPendingDeath = () => (deathPending = null);
export function killPlayer(cause: string) {
  if (!deathPending) deathPending = cause;
}

export function passTime(y: number) {
  if (y <= 0) return;
  s.year += y;
  s.turns++;
  // hồi phục
  const healRate = (s.r === 0 ? 30 : 40) * (body().heal || 1) * (1 + (stat('can') - 5) * 0.05) * (1 + pqSum('heal') / 100);
  s.hurt = clamp(s.hurt - y * healRate, 0, 100);
  s.tamma = clamp(s.tamma - y * (1 + stat('tam') * 0.2 + tamSum('calm')), 0, 100);
  // luyện hóa
  if (s.refining) {
    s.refining.left -= y;
    if (s.refining.left <= 0) {
      const g = s.gearBag.find((x) => x.uid === s.refining!.uid) || s.gear.find((x) => x?.uid === s.refining!.uid);
      if (g) {
        g.refined = true;
        addLog(`Luyện hóa xong ${g.n}.`, 'good');
      }
      s.refining = null;
    }
  }
  // NPC
  for (const n of s.npcs) slots.npcTick(n, y); // xem npctick.ts
  slots.tiencoTick(y); // người trên các bảng Thiên Cơ Lâu cũng tu luyện, phi thăng, chết già
  tickLinh(y);
  slots.courtPay();
  // tông môn bổng lộc
  if (s.sect) {
    const sc = SECTS[s.sect.id];
    const years = Math.floor(s.year) - Math.floor(s.sect.lastPay);
    if (years >= 1) {
      const pay = Math.round(RANK_PAY[s.sect.rank] * sc.tier * Math.pow(2.2, Math.max(0, effRi() - 1)) * years);
      s.money += pay;
      s.sect.lastPay = Math.floor(s.year);
    }
  }
  // bổng lộc hằng tháng của Diệp gia (xuất thân Diệp gia Hỗn Độn, khi còn ở Thương Lan)
  if (s.flags.dhStipend && !s.world) {
    const months = Math.floor((s.year - (s.flags.dhPayY ?? s.year)) * 12);
    if (months >= 1) {
      s.money += Math.round(20 * moneyScale(effRi()) * months);
      s.flags.dhPayY = (s.flags.dhPayY ?? s.year) + months / 12;
    } else if (s.flags.dhPayY === undefined) s.flags.dhPayY = s.year;
  }
  // bổng lộc công tử thánh địa (gia tộc chu cấp)
  if (s.flags.holyScion) {
    const yrs = Math.floor(s.year) - Math.floor(s.flags.scionPay ?? s.year - 0.5);
    if (yrs >= 1) {
      s.money += Math.round(60 * yrs * Math.pow(1.8, Math.max(0, effRi() - 1)));
      s.flags.scionPay = Math.floor(s.year);
    }
  }
  // hôn ước nguội dần dưới sức ép lời đồn "phế vật" nếu không vun đắp
  if (s.flags.betrothed && !s.flags.engageBroken && hiddenRootKind(s.root.k) && !s.flags.thapKnown) {
    const fz = s.npcs.find((n) => n.id === s.flags.betrothed && n.alive);
    if (fz && fz.tag !== 'daolu') fz.rel = clamp(fz.rel - 2.5 * y, -100, 100);
  }
  // dấu bản đồ
  s.pins = s.pins.filter((p) => p.until > s.year);
  const spawnP = clamp(0.25 + y * 0.15, 0, 0.9);
  if (s.pins.length < 5 && ch(spawnP)) spawnPin();
  if (s.pins.length < 3 && ch(spawnP * 0.6)) spawnPin();
  // thọ nguyên
  if (age() >= maxLife()) killPlayer('Thọ nguyên cạn kiệt, tọa hóa');
  meta.worldYear = Math.floor(s.year);
}

// ---------- Tu luyện ----------
export interface CultResult {
  gained: number;
  turns: number;
  years: number;
  stageUps: number;
  bottleneck: boolean;
  interrupted: boolean;
}
export function cultivateTurn(): { gain: number; stageUp: boolean } {
  const gain = cultRate() * rf(0.85, 1.15);
  let stageUp = false;
  if (thienDo()) {
    s.prog += gain;
    while (s.prog >= 100 && !atBottleneck()) {
      s.prog -= 100;
      s.flags.tang = tang() + 1;
      s.st = Math.min(3, tang() - 1);
      stageUp = true;
      addLog(`Tu vi tinh tiến: ${stageName()}.`, 'good');
    }
  } else if (!atBottleneck()) {
    s.prog += gain;
    while (s.prog >= 100 && s.r > 0 && s.st < 3) {
      s.prog -= 100;
      s.st++;
      stageUp = true;
      addLog(`Tu vi tinh tiến: ${REALMS[s.r].n} ${STAGES[s.st]}.`, 'good');
    }
    if (s.prog > 100) s.prog = 100;
  }
  if (s.tech) s.techM = Math.min(100, s.techM + 1.2 * (1 + (stat('ngo') - 5) * 0.08));
  passTime(turnLen());
  return { gain, stageUp };
}

/** Thêm tu vi (đơn vị % một tiểu cảnh giới). Dùng cho đan dược, kỳ ngộ. */
export function addProg(p: number): string {
  if (s.root.k === 0 && s.r === 0 && !has('yeudan') && s.race !== 'Yêu tộc' && !s.beast) return 'Thân phàm không giữ được linh khí, tất cả tan đi.';
  let left = p;
  let ups = 0;
  if (thienDo()) {
    s.prog += p;
    while (s.prog >= 100 && !atBottleneck()) { s.prog -= 100; s.flags.tang = tang() + 1; s.st = Math.min(3, tang() - 1); ups++; }
    if (s.prog > 100) s.prog = 100;
    return ups ? `Tu vi tăng vọt, lên ${stageName()}!` : 'Tu vi tăng lên.';
  }
  while (left > 0 && !atBottleneck()) {
    const take = Math.min(left, 100 - s.prog);
    s.prog += take;
    left -= take;
    if (s.prog >= 100 && s.r > 0 && s.st < 3) {
      s.prog = 0;
      s.st++;
      ups++;
    }
  }
  return ups ? `Tu vi tăng vọt, lên ${REALMS[s.r].n} ${STAGES[s.st]}!` : 'Tu vi tăng lên.';
}

/** Tu vi từ làm nhiệm vụ (đánh nhau, luyện chế, tuần tra…): bằng một phần tu vi bế quan trong cùng khoảng thời gian.
 *  frac mặc định 30%; việc làm dần trong lúc vẫn tu luyện thì nên để thấp hơn. Nhiệm vụ giao nộp vật phẩm KHÔNG gọi hàm này.
 *  Trả về câu nối vào kết quả (rỗng nếu không tăng được, vd. đang ở bình cảnh). */
export function missionProg(years: number, frac = 0.3): string {
  if (years <= 0 || atBottleneck() || (s.root.k === 0 && s.r === 0)) return '';
  const p = Math.round(cultRate() * (years / Math.max(1 / 12, turnLen())) * frac);
  if (p <= 0) return '';
  const t = addProg(p);
  return ` Tu vi +${p}%${t.startsWith('Tu vi tăng vọt') ? ` — ${t.replace(/!$/, '')}` : ''}.`;
}

/** Kinh nghiệm thất bại: mỗi lần đột phá hỏng cùng một cảnh giới, lần sau dễ hơn (tối đa 5 lần cộng dồn). */
const FAIL_MAX = 5;
const failStep = (nr: number) => clamp((BREAK_BASE[nr] ?? 0.05) * 0.4, 0.03, 0.08);
export function failBonus(nr = s.r + 1): { n: number; v: number } {
  const f = s.flags.btFail as { r: number; n: number } | undefined;
  const n = f && f.r === nr ? Math.min(FAIL_MAX, f.n) : 0;
  return { n, v: n * failStep(nr) };
}
export function btChance(pillBonus = 0): number {
  const nr = s.r + 1;
  if (nr > RMAX()) return 0;
  if (perfectBody()) return 1; // Hỗn Độn Đạo Thai: đột phá mọi cảnh giới chắc chắn thành công
  if (nr === 2 && thienMenh()) return 1; // Thiên mệnh trúc cơ
  let p = BREAK_BASE[nr];
  if (nr === 2 && DIA_THE[s.loc]) p -= 0.05; // thiên địa chi thế đè lên người
  if (nr > 2) p += (daoCoInfo()?.brk || 0) + phamSum().brk;
  p += (stat('tam') - 5) * 0.02;
  p += s.techM / 2000;
  p -= s.tamma / 250;
  p -= s.hurt / 250;
  if (placeQi() >= 1.5) p += 0.03;
  if (s.flags.bodhi) p += 0.05;
  p += tamSum('brk');
  p += pillBonus;
  p += failBonus(nr).v;
  return clamp(p, 0.01, 0.97);
}
export const pillBonusOf = (id: string, g = 1) => (PILLS[id]?.k === 'break' ? PILLS[id].v * pillMult(g) : 0);

/** Kiểu Trúc Cơ sẽ dùng nếu đột phá ở đây, lúc này. */
export const trucCoKind = (): 'menh' | 'the' | 'thuong' => (thienMenh() ? 'menh' : DIA_THE[s.loc] ? 'the' : 'thuong');
/** Gieo phẩm đột phá cho cảnh giới nr (>= 3): tâm cảnh, ngộ tính, thuần thục công pháp, thương thế, tâm ma, đan đúng loại. */
/** Điểm nền gieo phẩm (chưa cộng phần ngẫu nhiên 0..1) cho cảnh giới nr: tâm, ngộ, thuần thục, thương thế, tâm ma, đan, nền cảnh giới trước. */
export function phamBase(nr: number, pill?: { id: string; g: number } | 'any', bonus = 0): number {
  let sc = 0.1 + (stat('tam') - 5) * 0.03 + (stat('ngo') - 5) * 0.02 + s.techM / 400 - s.hurt / 300 - s.tamma / 300 + Math.min(0.3, bonus) * 0.8;
  if (pill === 'any') sc += 0.06 + 0.15 * 0.8; // ước lượng: đan đúng loại hạ phẩm
  else if (pill && BREAK_PILL[nr] === pill.id) sc += 0.06 + ((pill.g ?? 1) - 1) * 0.05;
  if ((phams()[nr - 1] ?? (nr === 3 ? s.flags.daoCo : 1)) >= 3) sc += 0.05; // nền cảnh giới trước vững thì dễ lên phẩm cao
  return sc;
}
/** Tỉ lệ ra từng phẩm (Hạ..Hoàn mỹ) cho cảnh giới nr với căn cơ hiện tại. */
export function phamProbs(nr: number, withPill = false): number[] {
  if (perfectBody()) return [0, 0, 0, 0, 1];
  if (nr === 2) {
    const k = trucCoKind();
    if (k === 'menh') return [0, 0, 0, 0, 1];
    if (k === 'the') return [0, 0, 0, 1, 0];
    const b = (stat('tam') - 5) * 0.04 + s.techM / 500 - s.hurt / 300 + (withPill ? 0.1 : 0);
    const P = (lo: number, hi: number) => Math.max(0, Math.min(1, hi - b) - Math.max(0, lo - b));
    return [P(-9, 0.5), P(0.5, 1), P(1, 9), 0, 0];
  }
  const b = phamBase(nr, withPill ? 'any' : undefined);
  const edges = [-9, ...PHAM_T, 9];
  return edges.slice(0, -1).map((lo, i) => Math.max(0, Math.min(1, edges[i + 1] - b) - Math.max(0, lo - b)));
}
function rollPham(nr: number, pill?: { id: string; g: number }, bonus = 0): number {
  if (perfectBody()) return 4;
  const sc = Math.random() + phamBase(nr, pill, bonus);
  return sc >= PHAM_T[3] ? 4 : sc >= PHAM_T[2] ? 3 : sc >= PHAM_T[1] ? 2 : sc >= PHAM_T[0] ? 1 : 0;
}

function rollDaoCo(pill?: { id: string; g: number }): number {
  const k = trucCoKind();
  if (k === 'menh' || perfectBody()) return 4;
  if (k === 'the') return 3;
  let sc = Math.random() + (stat('tam') - 5) * 0.04 + s.techM / 500 - s.hurt / 300;
  if (pill?.id === 'trucco') sc += 0.1 + ((pill.g ?? 1) - 1) * 0.08;
  return sc >= 1 ? 2 : sc >= 0.5 ? 1 : 0;
}

export function breakthrough(pill?: { id: string; g: number }): { ok: boolean; text: string } {
  let bonus = 0;
  if (pill && count('p:' + pill.id, pill.g) > 0) {
    removeItem('p:' + pill.id, 1, pill.g);
    bonus = pillBonusOf(pill.id, pill.g);
    // dùng đan không đúng cảnh giới thì giảm hiệu lực
    if (PILLS[pill.id].tier < s.r + 1) bonus *= 0.35;
  }
  const p = btChance(bonus);
  passTime(REALMS[s.r].turn * 2);
  if (ch(p)) {
    const grade = s.r === 1 ? rollDaoCo(pill) : -1;
    const kind = trucCoKind();
    s.r++;
    s.st = 0;
    s.prog = 0;
    s.hurt = 0;
    s.flags.bodhi = false;
    delete s.flags.btFail;
    if (has('xuixeo')) s.prog = 40;
    s.fame += s.r * s.r * 3;
    mark(`Đột phá ${REALMS[s.r].n} năm ${Math.floor(age())} tuổi`);
    const txt = [
      '',
      'Kinh mạch như vỡ đê, linh khí ào vào. Từ nay ngươi là tu sĩ, không còn là phàm nhân.',
      'Chân nguyên lỏng như sương ngưng thành dịch, rót xuống đan điền đúc thành đạo cơ.',
      'Chân nguyên trong đan điền xoay tròn, nén lại, nén nữa — một viên kim đan sáng rực thành hình.',
      'Kim đan vỡ, một tiểu nhân giống hệt ngươi mở mắt trong đan điền. Nguyên Anh đã thành.',
      'Nguyên anh hòa vào thần hồn. Thần thức lan ra ngàn dặm, trời đất như trong lòng bàn tay.',
      'Thân thể như hư như thực, ngươi bắt đầu chạm được vào quy tắc của không gian.',
      'Pháp tướng và nhục thân hợp làm một. Một ý niệm, núi sông đổi dạng.',
      'Đạo của ngươi viên mãn. Chỉ còn một bước nữa là phá vỡ giới hạn của phương thế giới này.',
      'Từ ngày này, mây kiếp lảng vảng trên đầu ngươi không tan. Độ Kiếp cảnh — đi tới đâu cũng nghe tiếng sấm xa.',
      'Phàm thai thoát hết, tiên cơ nảy mầm. Nhân Tiên — bước đầu tiên trên con đường tiên đạo.',
      'Tiên lực bén rễ xuống đất, núi sông như nối liền với hơi thở ngươi. Địa Tiên.',
      'Tiên quang xông thẳng cửu tiêu, tên ngươi khắc lên thiên bảng. Thiên Tiên.',
      'Tiên thể thành chân, không còn chút trọc khí nào. Chân Tiên.',
      'Pháp tắc huyền ảo hiện ra trước mắt như chữ trên trang sách. Huyền Tiên.',
      'Kim quang hộ thể, vạn kiếp bất ma. Kim Tiên.',
      'Thái Ất chân hỏa thiêu luyện tam hoa, ngũ khí triều nguyên. Thái Ất Kim Tiên.',
      'Đại La thiên thượng, thời gian và không gian không trói được ngươi nữa. Đại La Kim Tiên.',
      'Trảm một thi, nửa bước chạm vào thánh vị. Chuẩn Thánh.',
      'Thánh nhân bất tử, vạn kiếp bất diệt. Ngươi mở miệng là thiên hiến.',
      'Ngươi lấy thân hợp đạo, một ý niệm của ngươi chính là quy tắc của trời đất.',
      'Không còn đạo nào ở ngoài ngươi. Đại Đạo.',
    ][s.r];
    let dc = '';
    if (s.r >= 3) {
      const g = rollPham(s.r, pill, bonus);
      phams()[s.r] = g;
      mark(`${REALMS[s.r].n}: ${PHAM_N[g]}`);
      addLog(`Phẩm chất đột phá ${REALMS[s.r].n}: ${PHAM_N[g]}.`, 'good');
      dc = `\n\nPhẩm chất đột phá: ${PHAM_N[g]} ${REALMS[s.r].n}.${g === 4 ? ' Căn cơ không một tì vết.' : g <= 1 ? ' Tâm cảnh, ngộ tính, độ thuần thục công pháp và đan đúng loại sẽ giúp phẩm cao hơn.' : ''}`;
    }
    if (grade >= 0) {
      s.flags.daoCo = grade;
      const g = DAO_CO[grade].n;
      mark(`Trúc Cơ: ${g}`);
      dc = kind === 'menh'
        ? `\n\nThiên mệnh trúc cơ. Trời cao như mở một khe cửa cho ngươi: mây lành tụ trên đỉnh đầu, đạo cơ đúc thành không một vết nứt — ${g}!`
        : kind === 'the'
        ? `\n\nĐịa thế trúc cơ. Ngươi mượn ${DIA_THE[s.loc]} ép vào đạo cơ, đúc ra ${g}!`
        : `\n\nTrúc cơ thường, thành ${g}.${grade < 2 ? ' Tâm cảnh, độ thuần thục công pháp và Trúc Cơ Đan tốt sẽ giúp đạo cơ vững hơn.' : ''}`;
      addLog(`Đạo cơ: ${g}.`, 'good');
    }
    if (s.race === 'Yêu tộc' || s.beast || has('yeudan')) {
      const evo = tryEvolvePlayerBeast(s, worldPack(s.world ?? 0).beasts);
      if (evo) {
        if (evo.ok) {
          addLog(evo.text, 'good');
          mark(`Huyết mạch thoát biến: ${evo.from} ➔ ${evo.to}`);
          dc += `\n\n${evo.text}`;
        } else if (evo.requiresChoice && evo.branches) {
          s.flags.pendingBeastBranches = evo.branches;
          const choicePrompt = `Huyết mạch ${s.beast} trong người ngươi cuộn trào trước nhiều ngã rẽ tiến hóa. Hãy chọn con đường đạo lộ huyết mạch của ngươi!`;
          addLog(choicePrompt, 'mark');
          dc += `\n\n【Chọn Con Đường Tiến Hóa】${choicePrompt}`;
        } else if (evo.blocked) {
          addLog(evo.blocked, 'bad');
          dc += `\n\n${evo.blocked}`;
        }
      }
    }
    return { ok: true, text: `Đột phá thành công! ${txt}${dc}` };
  }
  s.prog = s.r === 0 ? 70 : 45;
  const hurt = ri(25, 55);
  s.hurt = clamp(s.hurt + hurt, 0, 100);
  s.tamma = clamp(s.tamma + ri(8, 22), 0, 100);
  let txt = `Đột phá thất bại (tỉ lệ ${Math.round(p * 100)}%). Linh khí phản phệ, kinh mạch bị tổn thương.`;
  if (s.r >= 3 && ch(0.03 + s.tamma / 600)) {
    killPlayer(`Đột phá ${REALMS[s.r + 1].n} thất bại, thân tử đạo tiêu`);
    txt = 'Tâm ma nhân lúc chân nguyên hỗn loạn mà xông vào. Ngươi nghe tiếng kinh mạch đứt từng sợi...';
  } else {
    const nr = s.r + 1;
    const before = failBonus(nr);
    s.flags.btFail = { r: nr, n: Math.min(FAIL_MAX, before.n + 1) };
    const after = failBonus(nr);
    txt += after.n > before.n
      ? ` Nhưng ngươi đã nhìn rõ hơn chỗ bình cảnh vướng víu: lần sau tỉ lệ đột phá ${REALMS[nr].n} +${Math.round(after.v * 100)}% (kinh nghiệm ${after.n} lần thất bại).`
      : ` Kinh nghiệm thất bại đã chồng tới mức tối đa (+${Math.round(after.v * 100)}%).`;
  }
  addLog(txt, 'bad');
  return { ok: false, text: txt };
}

// ---------- Kinh mạch ----------
export const MERIDIANS = ['Thủ Thái Âm Phế', 'Thủ Dương Minh Đại Trường', 'Túc Dương Minh Vị', 'Túc Thái Âm Tỳ', 'Thủ Thiếu Âm Tâm', 'Thủ Thái Dương Tiểu Trường', 'Túc Thái Dương Bàng Quang', 'Túc Thiếu Âm Thận', 'Thủ Quyết Âm Tâm Bào', 'Thủ Thiếu Dương Tam Tiêu', 'Túc Thiếu Dương Đởm', 'Túc Quyết Âm Can'];
export const merMax = () => Math.min(12, effRi() * 2);
export function openMeridian(): string {
  if (s.meridians >= merMax()) return 'Cảnh giới chưa đủ để đả thông thêm kinh mạch.';
  if (s.prog < 30 && s.st === 0) return 'Tu vi không đủ để xung kích kinh mạch (cần ít nhất 30% tiến độ).';
  const cost = 30;
  s.prog = Math.max(0, s.prog - cost);
  passTime(REALMS[s.r].turn);
  const p = clamp(0.45 + (stat('can') - 5) * 0.04 - s.meridians * 0.02, 0.15, 0.9);
  if (ch(p)) {
    s.meridians++;
    addLog(`Đả thông ${MERIDIANS[s.meridians - 1]} Kinh.`, 'good');
    return `Chân nguyên xông qua huyệt đạo cuối cùng — ${MERIDIANS[s.meridians - 1]} Kinh thông suốt! Tu luyện và chiến lực tăng.`;
  }
  s.hurt = clamp(s.hurt + 15, 0, 100);
  return 'Xung kích thất bại, chân nguyên dội ngược làm kinh mạch đau nhói.';
}

// ---------- Đi lại ----------
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
export function travelSpeed() {
  let sp = thienDo() ? realmAt('speed', effR()) : REALMS[s.r].speed;
  if (has('tranphap')) sp *= 1.2;
  sp *= 1 + pqSum('speed') / 100;
  return sp;
}
export function travelYears(to: { x: number; y: number }) {
  return mountYears(Math.max(1 / 12, (dist(s, to) * worldSize()) / travelSpeed()));
}
/** Cưỡi tọa kỵ (chân linh, kể cả khi chỉ để cưỡi): đi đường nhanh theo phẩm. Tiên giai: cự ly ngắn tới ngay (0), cự ly dài 1–3 tháng.
 *  base = thời gian đi thường (năm). */
export function mountYears(base: number): number {
  const c = myLinh();
  const d = c ? CHANLINH[c.id] : null;
  if (!d?.mount || !canRideBeast(d, c?.r ?? d.minR)) return base;
  if (d.resizeR && c) c.bodySize = 'large';
  const sp = MOUNT_SPEED[d.mount];
  if (!isFinite(sp)) return base <= MOUNT_BLINK ? 0 : clamp(base * 0.08, 1 / 12, 0.25);
  return Math.max(1 / 12, base / sp);
}
export function needsShip(l: Loc) {
  const here = LOCS[s.loc];
  if (REGIONS[l.reg].vuc !== REGIONS[here.reg].vuc) return true; // các vực cách nhau bởi biển
  return !!l.island !== !!here.island || (!!l.island && !!here.island && l.reg !== here.reg);
}
/** Kiểm tra có tới được không; trả chuỗi lý do nếu không. */
export function travelBlock(l: Loc): string | null {
  if (s.flags.childhood) return 'Ngươi còn quá nhỏ, chưa thể rời Diệp gia Tổ Địa.';
  if (l.type === 'formation' && REGIONS[l.reg].vuc !== REGIONS[LOCS[s.loc].reg].vuc) return 'Không thể đi thẳng tới đầu trận ở vực khác. Hãy tới trận ở vực mình rồi kích hoạt để truyền tống.';
  if (l.reg === 'tienchau' && LOCS[s.loc].reg !== 'tienchau' && effRi() < 4 && s.sect?.id !== 'tutieu' && s.flags.holyScion !== 'tutieu') return 'Cương phong quanh Hư Linh Tiên Sơn xé nát mọi thứ dưới Nguyên Anh.';
  if (l.type === 'realm') {
    if (!realmOpen(l)) return `Bí cảnh đang đóng. Lần mở tới: năm ${nextOpen(l)}.`;
    if (effRi() < (l.minRealm || 0)) return `Cấm chế bí cảnh chỉ cho ${REALMS[l.minRealm || 0].n} trở lên đi vào.`;
  }
  return null;
}
export const shipFare = () => 30;
export function realmOpen(l: Loc) {
  if (!l.open) return true;
  return Math.floor(s.year) % l.open[0] < l.open[1];
}
export function nextOpen(l: Loc) {
  if (!l.open) return Math.floor(s.year);
  const y = Math.floor(s.year);
  return y - (y % l.open[0]) + l.open[0];
}

export function setLoc(id: string) {
  const l = LOCS[id];
  s.loc = id;
  s.x = l.x;
  s.y = l.y;
  codexAdd('loc', id);
  if (l.sect) codexAdd('sect', l.sect);
}

export function nearestLoc(x: number, y: number): Loc {
  let best = LOC_LIST[0];
  let bd = Infinity;
  for (const l of LOC_LIST) {
    const d = Math.hypot(l.x - x, l.y - y);
    if (d < bd) {
      bd = d;
      best = l;
    }
  }
  return best;
}

// ---------- Dấu trên bản đồ ----------
export function spawnPin() {
  const anchors = LOC_LIST.filter((l) => l.type !== 'realm' && (l.reg !== 'tienchau' || effRi() >= 4) && Math.hypot(l.x - s.x, l.y - s.y) < 1300);
  const a = anchors.length ? pick(anchors) : pick(LOC_LIST);
  const roll = Math.random();
  const k: Pin['k'] = roll < 0.45 ? '?' : roll < 0.8 ? '!' : roll < 0.97 ? 'bao' : 'bi';
  const lv = clamp((a.lv ?? effRi()) + ri(-1, 1), 0, RMAX());
  s.pins.push({ id: uid(), k, x: clamp(a.x + ri(-200, 200), 40, MAP_W - 40), y: clamp(a.y + ri(-160, 160), 40, MAP_H - 40), lv, until: s.year + rf(3, 10) * Math.max(1, REALMS[s.r].turn), reg: a.reg });
}

// ---------- Tiện ích hiển thị ----------
export const elName = (e: El) => EL[e].n;
export const regionOf = (id = s.loc) => REGIONS[LOCS[id].reg];
export { yearsTxt };
