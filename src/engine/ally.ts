// Đồng hành cùng thế lực: người đã mất tông môn (vd. bị kẻ gian hãm hại phải rời tông) nhận lời đi theo ngươi.
// Khi còn trong đội đồng hành, ngươi vào tông môn / hoàng triều nào thì người ấy vào theo; chức vụ đổi theo cảnh giới.
// Không import party.ts / sect.ts (sect.ts gọi lên đây) — đọc thẳng s.flags.party để tránh vòng import.
import { s, type NPC } from './state';
import { SECTS, EMPIRES, COURT_RANKS, SECT_TIER_INFO, RK, rankLabel, courtReq, type Sect } from '../data/world';
import { addLog, mark, mkName } from './core';

/** Hồ sơ người bị trục xuất: tông cũ, chức cũ, kẻ gian hãm hại, vì sao phải rời tông, đã được phong Thánh nữ / Thánh tử thứ hai chưa.
 *  why: mệnh đề ngắn cho lý lịch; story: lời kể ngôi thứ nhất trong cảnh; v: phiên bản hồ sơ (2 = có why/story). */
export interface Exile { from: string; title: string; traitor: string; why?: string; story?: string; saint?: boolean; v?: number }
export const exiles = (): Record<string, Exile> => (s.flags.exiles ||= {});

/** Vì sao phải rời tông: thường là Thánh tử ép cưới (bỏ xuân dược không thành), phe trưởng lão của hắn chèn ép, vu tội. */
export function exileCause(n: NPC): Pick<Exile, 'traitor' | 'why' | 'story'> {
  if (n.g === 'm') {
    const t = `Thủ tịch đệ tử ${mkName('m')}`;
    return { traitor: t, why: `bị ${t} cùng phe trưởng lão vu trộm bí điển trấn tông`, story: `${t} sợ ta tranh vị Thánh tử, cùng mấy trưởng lão phe hắn vu ta trộm bí điển trấn tông.` };
  }
  const t = `Thánh tử ${mkName('m')}`;
  const all = [
    { why: `bị ${t} ép cưới, bỏ xuân dược không thành, mấy trưởng lão phe hắn quay ra vu tội`, story: `${t} ép ta thành thân. Ta không thuận, hắn bỏ xuân dược vào trà — may ta phát hiện kịp, đánh hắn trọng thương mà thoát. Hôm sau mấy vị trưởng lão phe hắn lại vu ta ám hại đồng môn.` },
    { why: `cự tuyệt lời cầu thân của ${t}, bị phe trưởng lão của hắn dựng chuyện tư thông ma đạo`, story: `${t} cầu thân ba lần, ta cự tuyệt cả ba. Hắn liền cùng vài trưởng lão phe mình dựng chuyện ta tư thông ma đạo, ép tông môn xóa tên ta.` },
    { why: `bị ${t} ép cưới hòng thâu tóm thế lực sư môn, phe trưởng lão của hắn chèn ép tới cùng`, story: `${t} muốn cưới ta để nuốt trọn thế lực của sư môn. Ta không chịu, phe trưởng lão của hắn chèn ép đủ đường — cắt tài nguyên, giao nhiệm vụ tử địa, cuối cùng vu ta phản tông.` },
  ];
  return { traitor: t, ...all[Math.floor(Math.random() * all.length)] };
}
/** Gia thế gắn với tông cũ của chính người đó (scN = tên tông cũ, lấy từ hồ sơ trục xuất):
 *  "Con gái Thánh chủ đời trước" → "Con gái Thánh chủ <tông cũ> đời trước". */
export function exileFamily(family: string, scN: string): string {
  if (family.includes(scN)) return family;
  if (/của tông\b/.test(family)) return family.replace(/của tông\b/, scN);
  const re = /(Thánh chủ|Tông chủ|Thái [Tt]hượng [Tt]rưởng [Ll]ão|Đại trưởng lão|tổ sư khai sơn)/;
  return re.test(family) ? family.replace(re, `$1 ${scN}`) : `${family}, xuất thân ${scN}`;
}
/** Lý lịch người bị trục xuất (khi chưa vào thế lực nào cùng ngươi). */
export const exileHow = (n: NPC, e: Exile) => `Cựu ${e.title.charAt(0).toLowerCase() + e.title.slice(1)} — ${e.why || `bị ${e.traitor} hãm hại`}, buộc rời tông; sư phụ hy sinh để ${n.g === 'm' ? 'hắn' : 'nàng'} thoát`;
/** Nâng hồ sơ cũ (bản đầu: "Chấp pháp trưởng lão", gia thế chưa gắn tông cũ) lên bản hiện tại. Gọi được nhiều lần. */
export function exileMigrate() {
  for (const [id, e] of Object.entries(exiles())) {
    if (e.v === 2) continue;
    const n = s.npcs.find((x) => x.id === id);
    if (!n) continue;
    Object.assign(e, exileCause(n), { v: 2 });
    if (n.bio?.family && SECTS[e.from]) n.bio.family = exileFamily(n.bio.family, SECTS[e.from].n);
    if (n.how.startsWith('Cựu ')) n.how = exileHow(n, e);
  }
}
/** Danh sách người đi theo ngươi vào thế lực. */
export const allyIds = (): string[] => (s.flags.allies ||= []);
const inParty = (id: string) => { const p = s.flags.party as { active: string[]; reserve: string[] } | undefined; return !!p && (p.active.includes(id) || p.reserve.includes(id)); };
const findNpc = (id: string) => s.npcs.find((n) => n.id === id && n.alive);
/** Người đi theo đang còn sống và còn trong đội đồng hành. */
export const activeAllies = (): NPC[] => allyIds().map(findNpc).filter((n): n is NPC => !!n && inParty(n.id));

/** Chức trong tông theo cảnh giới (cảnh giới so với tông chủ của bậc tông ấy). */
function sectRank(n: NPC, sc: Sect): number {
  if (exiles()[n.id]?.saint) return RK.THANHTU;
  const c = SECT_TIER_INFO[sc.tier].chu;
  if (n.r >= c) return RK.THUTICH;
  if (n.r >= c - 1) return RK.THANTRUYEN;
  if (n.r >= 2) return RK.NOI;
  return RK.NGOAI;
}
/** Tên chức hiện tại trong tông, vd. "Nội môn đệ tử Tử Tiêu Tiên Cung", "Thánh nữ thứ hai của Tử Tiêu Tiên Cung". */
export function allySectTitle(n: NPC, sc: Sect): string {
  return sectRank(n, sc) === RK.THANHTU ? `${rankText(n, sc)} của ${sc.n}` : `${rankText(n, sc)} ${sc.n}`;
}
/** Tên chức không kèm tên tông, vd. "Nội môn đệ tử", "Thánh nữ thứ hai". */
function rankText(n: NPC, sc: Sect): string {
  const rk = sectRank(n, sc);
  return rk === RK.THANHTU ? `${rankLabel(rk, sc, n.g)} thứ hai` : rankLabel(rk, sc, n.g);
}
const tail = (n: NPC) => { const e = exiles()[n.id]; return e ? `cựu ${e.title.charAt(0).toLowerCase() + e.title.slice(1)}, theo ngươi gia nhập` : 'theo ngươi gia nhập'; };

/** Cập nhật thế lực + chức vụ của một người đi theo theo thế lực hiện tại của ngươi. Trả về câu kể (rỗng nếu không đổi). */
export function allySync(n: NPC): string {
  if (!allyIds().includes(n.id) || !n.alive || !inParty(n.id)) return '';
  const e = exiles()[n.id];
  if (s.sect) {
    const sc = SECTS[s.sect.id];
    if (e && e.from === sc.id) {
      // không quay lại nơi đã hại chết sư phụ
      if (n.sect === sc.id) n.sect = null;
      return '';
    }
    const before = n.how;
    const joined = n.sect !== sc.id;
    n.sect = sc.id;
    n.how = `${allySectTitle(n, sc)} — ${tail(n)}`;
    if (joined) return `${n.name} cũng theo ngươi bái nhập ${sc.n}, được xếp làm ${rankText(n, sc).toLowerCase()}.`;
    return before !== n.how ? `${n.name} được thăng làm ${allySectTitle(n, sc)}.` : '';
  }
  const c = s.flags.court as { id: string } | null | undefined;
  if (c && EMPIRES[c.id]) {
    const em = EMPIRES[c.id];
    const rank = n.r >= courtReq(1, em.tier) ? COURT_RANKS[1] : COURT_RANKS[0];
    const t = `${rank} ${em.n}`;
    const joined = !n.how.includes(em.n);
    n.sect = null;
    n.how = `${t} — ${tail(n)}`;
    return joined ? `${n.name} cũng theo ngươi vào ${em.n}, nhận chức ${rank.toLowerCase()}.` : '';
  }
  return '';
}
/** Ngươi vừa vào tông môn / hoàng triều: mọi người đi theo vào cùng. Trả về đoạn kể nối vào kết quả gia nhập. */
export function allyFollow(): string {
  const out: string[] = [];
  for (const n of activeAllies()) {
    const e = exiles()[n.id];
    if (s.sect && e && e.from === s.sect.id) { out.push(`${n.name} dừng lại trước sơn môn ${SECTS[e.from].n}, không chịu bước vào nơi đã hại chết sư phụ mình.`); continue; }
    const t = allySync(n);
    if (t) { out.push(t); mark(t.replace(/\.$/, '')); }
  }
  return out.length ? ' ' + out.join(' ') : '';
}
/** Gọi khi người đi theo lên cảnh giới: nâng chức theo cảnh giới mới. */
export function allyRealmUp(n: NPC) {
  if (!allyIds().includes(n.id)) return;
  const t = allySync(n);
  if (t) addLog(t, 'good');
}
