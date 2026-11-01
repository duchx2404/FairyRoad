// Pháp tắc & Đại đạo: từ Chuẩn Thánh phải cảm ngộ Pháp tắc mới lên Thánh Nhân; Thánh Nhân cảm ngộ Đại đạo mới lên Hợp Đạo;
// đoạt Đại Đạo (Đạo chủ) cần ít nhất 3 Đại đạo. Pháp tắc là bản đơn giản của Đại đạo cùng loại: ngộ pháp tắc nào thì sau ngộ đại đạo đó.
// Tầng bậc: Hỗn Độn > Thời gian > Không gian > các loại khác (10 hệ pháp thuật, vũ khí: kiếm, đao, thương, cung, quyền, chưởng, kích, quạt, cầm, âm, côn).
// Hỗn Độn chỉ người mang Hỗn Độn Đạo Thai mới cảm nhận được (bẩm sinh thân cận).
import { s } from './state';
import { EL, REALMS, khacOf, BATQUAI, type El } from '../data/core';
import { TECHS, type Weapon } from '../data/items';
import { stat } from './char';
import { slots } from './slots';
import { passTime, addLog, mark } from './core';
import { ch, pick } from '../core/util';

export type DaoTier = 'hondon' | 'thoigian' | 'khonggian' | 'batquai' | 'amduong' | 'lmpn' | 'thuong';
export interface DaoDef { id: string; tier: DaoTier; n: string; dao: string; pow: number; daoPow: number; d: string; el?: El; weapon?: Weapon | string }
export const TIER_N: Record<DaoTier, string> = { hondon: 'Hỗn Độn', thoigian: 'Thời gian', khonggian: 'Không gian', batquai: 'Bát quái', amduong: 'Âm Dương', lmpn: 'Lực · Mẫn · Phá · Ngự', thuong: 'Thường' };
/** Thứ tự mạnh yếu; cùng bậc thì so pow. */
export const TIER_RANK: Record<DaoTier, number> = { hondon: 6, thoigian: 5, khonggian: 4, batquai: 3, amduong: 2, lmpn: 1, thuong: 0 };

const el = (id: El, n: string, dao: string, pow: number, daoPow: number, d: string): DaoDef => ({ id, tier: 'thuong', el: id, n, dao, pow, daoPow, d });
const wp = (id: string, name: string, n: string, dao: string, pow: number, daoPow: number, d: string): DaoDef => ({ id: 'w_' + id, tier: 'thuong', weapon: id, n, dao, pow, daoPow, d: `${name}. ${d}` });

export const DAOS: DaoDef[] = [
  // ---- ba tầng trên ----
  { id: 'hondon', tier: 'hondon', n: 'Pháp tắc Hỗn Độn', dao: 'Đại đạo Hỗn Độn', pow: 1.6, daoPow: 2.6, d: 'Trước khi trời đất phân chia chỉ có một thứ: Hỗn Độn. Mọi pháp tắc khác đều từ nó mà ra. Chỉ Hỗn Độn Đạo Thai mới nghe được tiếng của nó.' },
  { id: 'thoigian', tier: 'thoigian', n: 'Pháp tắc Thời Gian', dao: 'Đại đạo Thời Gian', pow: 1.45, daoPow: 2.1, d: 'Một nhịp của địch là trăm nhịp của ngươi. Đại đạo Thời Gian: vết thương chưa từng xảy ra.' },
  { id: 'khonggian', tier: 'khonggian', n: 'Pháp tắc Không Gian', dao: 'Đại đạo Không Gian', pow: 1.38, daoPow: 1.9, d: 'Cách ngàn dặm cũng là một bước. Đại đạo Không Gian: cắt rời không gian quanh địch.' },
  // ---- Bát quái (hợp nhất Âm + Dương; chỉ Bát quái linh căn) · Âm · Dương ----
  { id: 'batquai', tier: 'batquai', n: 'Pháp tắc Bát Quái', dao: 'Đại đạo Bát Quái', pow: 1.42, daoPow: 2.0, d: 'Âm Dương giao hòa sinh tám quẻ, tám quẻ diễn vạn vật. Chỉ Bát quái linh căn mới hợp nhất được.' },
  { id: 'yin', tier: 'amduong', el: 'yin', n: 'Pháp tắc Âm', dao: 'Đại đạo Âm', pow: 1.34, daoPow: 1.8, d: 'Âm là lạnh, là tĩnh, là mặt trăng. Đại đạo Âm: rút cạn sinh cơ.' },
  { id: 'yang', tier: 'amduong', el: 'yang', n: 'Pháp tắc Dương', dao: 'Đại đạo Dương', pow: 1.34, daoPow: 1.8, d: 'Dương là nóng, là động, là mặt trời. Đại đạo Dương: thiêu rụi tà ma.' },
  // ---- Lực · Mẫn · Phá · Ngự ----
  { id: 'luc', tier: 'lmpn', n: 'Pháp tắc Lực', dao: 'Đại đạo Lực', pow: 1.32, daoPow: 1.74, d: 'Sức mạnh thuần túy, một quyền nát núi. Đại đạo Lực: lực lớn vô cùng.' },
  { id: 'man', tier: 'lmpn', n: 'Pháp tắc Mẫn', dao: 'Đại đạo Mẫn', pow: 1.3, daoPow: 1.72, d: 'Nhanh hơn ý niệm. Đại đạo Mẫn: ra tay trước khi địch kịp nghĩ.' },
  { id: 'pha', tier: 'lmpn', n: 'Pháp tắc Phá', dao: 'Đại đạo Phá', pow: 1.33, daoPow: 1.76, d: 'Phá mọi phòng ngự. Đại đạo Phá: không gì là không phá được.' },
  { id: 'ngu', tier: 'lmpn', n: 'Pháp tắc Ngự', dao: 'Đại đạo Ngự', pow: 1.28, daoPow: 1.7, d: 'Ngự mọi công kích. Đại đạo Ngự: không gì đánh vào được.' },
  // ---- 10 hệ pháp thuật ----
  el('kim', 'Pháp tắc Phong Nhuệ', 'Đại đạo Sát Phạt', 1.25, 1.6, 'Mọi thứ đều có thể bị cắt đứt. Đại đạo Sát Phạt: một ý niệm, vạn vật đoạn.'),
  el('moc', 'Pháp tắc Sinh Trưởng', 'Đại đạo Sinh Mệnh', 1.12, 1.4, 'Cỏ cây sinh sôi, vết thương khép lại. Đại đạo Sinh Mệnh: còn một hơi là còn sống lại.'),
  el('thuy', 'Pháp tắc Nhu Thủy', 'Đại đạo Vạn Lưu', 1.15, 1.5, 'Nước chảy không ngừng, mềm mà thắng cứng. Đại đạo Vạn Lưu: trăm sông đổ về một biển.'),
  el('hoa', 'Pháp tắc Liệt Diễm', 'Đại đạo Hủy Diệt', 1.3, 1.65, 'Thiêu rụi. Đại đạo Hủy Diệt: cái gì cũng về tro.'),
  el('tho', 'Pháp tắc Hậu Thổ', 'Đại đạo Bất Diệt', 1.1, 1.45, 'Dày như đất, không gì lay nổi. Đại đạo Bất Diệt: thân thể là núi, núi không chết.'),
  el('bang', 'Pháp tắc Hàn Băng', 'Đại đạo Tĩnh Chỉ', 1.18, 1.55, 'Đóng băng. Đại đạo Tĩnh Chỉ: vạn vật ngừng lại, chỉ ngươi động.'),
  el('loi', 'Pháp tắc Lôi Đình', 'Đại đạo Thiên Phạt', 1.28, 1.62, 'Sấm sét là ý trời. Đại đạo Thiên Phạt: mượn trời giáng tội.'),
  el('phong', 'Pháp tắc Tật Phong', 'Đại đạo Tự Tại', 1.14, 1.48, 'Nhanh như gió, không gì giữ nổi. Đại đạo Tự Tại: đến đi tùy ý.'),
  el('am', 'Pháp tắc U Ám', 'Đại đạo Tử Vong', 1.22, 1.66, 'Bóng tối nuốt ánh sáng. Đại đạo Tử Vong: chạm vào là chết.'),
  el('quang', 'Pháp tắc Quang Minh', 'Đại đạo Nhân Quả', 1.2, 1.5, 'Ánh sáng soi tỏ. Đại đạo Nhân Quả: thấy nhân, định quả.'),
  // ---- vũ khí: mọi loại vũ khí lạnh, các nhánh gộp chung (trường / đoản / song kiếm → Kiếm) ----
  wp('kiem', 'Kiếm (trường kiếm, đoản kiếm, song kiếm, trọng kiếm)', 'Pháp tắc Kiếm', 'Đại đạo Kiếm', 1.26, 1.62, 'Một kiếm phá vạn pháp. Kiếm đạo: tâm là kiếm.'),
  wp('dao', 'Đao (đại đao, loan đao, phác đao, song đao)', 'Pháp tắc Đao', 'Đại đạo Đao', 1.24, 1.58, 'Đao thế bá đạo, một chém chẻ núi. Đao đạo: không lùi.'),
  wp('thuong', 'Thương (trường thương, mâu, sóc)', 'Pháp tắc Thương', 'Đại đạo Thương', 1.22, 1.56, 'Một đâm xuyên ba lớp giáp. Thương đạo: thẳng.'),
  wp('con', 'Côn (côn, bổng, trượng gỗ)', 'Pháp tắc Côn', 'Đại đạo Côn', 1.16, 1.5, 'Côn quét một dải, không gì đứng vững.'),
  wp('kich', 'Kích (phương thiên họa kích, qua)', 'Pháp tắc Kích', 'Đại đạo Kích', 1.22, 1.56, 'Một vòng quét ngang, nghìn quân ngã rạp.'),
  wp('phu', 'Phủ (búa, việt)', 'Pháp tắc Phủ', 'Đại đạo Phủ', 1.2, 1.54, 'Một búa bổ đôi hỗn độn.'),
  wp('chuy', 'Chùy (chùy, lang nha bổng, giản, đồng)', 'Pháp tắc Chùy', 'Đại đạo Chùy', 1.21, 1.55, 'Nặng tựa núi, chạm vào là nát.'),
  wp('tien', 'Tiên (roi, tiên, liên tử, dây xích)', 'Pháp tắc Tiên', 'Đại đạo Tiên', 1.14, 1.48, 'Mềm như nước, rút lại như sét.'),
  wp('cung', 'Cung nỏ (cung, nỏ, đạn cung)', 'Pháp tắc Tiễn', 'Đại đạo Tiễn', 1.2, 1.55, 'Mũi tên không bao giờ trượt. Tiễn đạo: bắn rơi sao.'),
  wp('amkhi', 'Ám khí (phi tiêu, châm, phi đao, lưu tinh)', 'Pháp tắc Ám Khí', 'Đại đạo Ám Khí', 1.17, 1.5, 'Không thấy đã trúng.'),
  wp('quyen', 'Quyền', 'Pháp tắc Quyền', 'Đại đạo Quyền', 1.2, 1.54, 'Nhục thân là binh khí. Quyền đạo: một quyền một mạng.'),
  wp('chuong', 'Chưởng chỉ (chưởng, chỉ, trảo)', 'Pháp tắc Chưởng', 'Đại đạo Chưởng', 1.18, 1.52, 'Bàn tay lật lên, trời đất đảo ngược.'),
  wp('cuoc', 'Cước (thoái pháp)', 'Pháp tắc Cước', 'Đại đạo Cước', 1.17, 1.5, 'Một cước đạp nát bầu trời.'),
  wp('phien', 'Quạt (phiến)', 'Pháp tắc Phiến', 'Đại đạo Phiến', 1.12, 1.46, 'Quạt mở, gió nổi; quạt khép, người đã ở sau lưng.'),
  wp('cam', 'Cầm (đàn, tranh, tỳ bà)', 'Pháp tắc Cầm', 'Đại đạo Cầm', 1.14, 1.5, 'Tiếng đàn giết người không thấy máu.'),
  wp('am', 'Âm (tiêu, sáo, chuông, trống, sư tử hống)', 'Pháp tắc Âm Luật', 'Đại đạo Âm Luật', 1.16, 1.52, 'Một tiếng hét, thần hồn tan.'),
  wp('cau', 'Câu (câu, liêm, thuẫn)', 'Pháp tắc Câu', 'Đại đạo Câu', 1.15, 1.49, 'Móc lấy binh khí địch, kéo lấy mạng địch.'),
  wp('truong', 'Trượng (phất trần, thiền trượng, pháp trượng)', 'Pháp tắc Trượng', 'Đại đạo Trượng', 1.15, 1.5, 'Một trượng trấn ma, một phất tiêu tai.'),
];
/** Tương khắc vũ khí (cứng khắc mềm, dài khắc ngắn, mềm khắc cứng, xa khắc gần): khắc[a] = các loại a khắc. */
export const WEAPON_KHAC: Record<string, string[]> = {
  kiem: ['thuong', 'phien', 'cam'], dao: ['con', 'cam', 'am'], thuong: ['dao', 'cuoc', 'quyen'], con: ['kiem', 'amkhi', 'chuong'], kich: ['kiem', 'dao', 'quyen'],
  phu: ['con', 'cau', 'truong'], chuy: ['con', 'cau', 'phien'], tien: ['phu', 'chuy', 'kich'], cung: ['quyen', 'cuoc', 'chuong'], amkhi: ['quyen', 'cuoc', 'cam'],
  quyen: ['cung', 'amkhi', 'tien'], chuong: ['cung', 'amkhi', 'phien'], cuoc: ['cung', 'amkhi', 'con'], phien: ['thuong', 'kich', 'phu'], cam: ['thuong', 'kich', 'chuy'],
  am: ['thuong', 'phu', 'chuy'], cau: ['kiem', 'dao', 'tien'], truong: ['cau', 'tien', 'amkhi'],
};
/** Lực · Mẫn · Phá · Ngự khắc vòng: Phá khắc Ngự, Ngự khắc Lực, Lực khắc Mẫn, Mẫn khắc Phá. */
const LMPN_KHAC: Record<string, string> = { pha: 'ngu', ngu: 'luc', luc: 'man', man: 'pha' };
/** a có khắc b không (pháp thuật theo vòng ngũ hành / biến hệ; vũ khí theo bảng; tầng cao khắc mọi tầng thấp). */
export function daoBeats(a: DaoDef, b: DaoDef): boolean {
  if (a.tier !== b.tier) return TIER_RANK[a.tier] > TIER_RANK[b.tier];
  if (a.el && b.el) return khacOf(a.el).includes(b.el);
  if (a.weapon && b.weapon) return (WEAPON_KHAC[a.weapon] || []).includes(b.weapon);
  if (a.tier === 'lmpn' && b.tier === 'lmpn') return LMPN_KHAC[a.id] === b.id;
  return false; // pháp thuật và vũ khí không khắc nhau
}
/** Pháp tắc / đại đạo chủ đạo của một bộ sưu tập: cái mạnh nhất (tầng trước, rồi hệ số). */
export function mainDao(law: string[], dao: string[]): { d: DaoDef; isDao: boolean } | null {
  let best: { d: DaoDef; isDao: boolean; v: number } | null = null;
  for (const id of law) { const d = daoOf(id); if (!d) continue; const v = TIER_RANK[d.tier] * 10 + d.pow; if (!best || v > best.v) best = { d, isDao: false, v }; }
  for (const id of dao) { const d = daoOf(id); if (!d) continue; const v = TIER_RANK[d.tier] * 10 + d.daoPow; if (!best || v > best.v) best = { d, isDao: true, v }; }
  return best;
}
/** Hệ số sát thương khi A đánh B theo pháp tắc / đại đạo chủ đạo mỗi bên.
    Khắc ×1.3 (đại đạo khắc ×1.5); bị khắc ×0.8 (bị đại đạo khắc ×0.7); đại đạo đè pháp tắc cùng loại ×1.15. */
export function daoMult(a: { laws: string[]; daos: string[] }, b: { laws: string[]; daos: string[] }): number {
  const A = mainDao(a.laws, a.daos), B = mainDao(b.laws, b.daos);
  if (!A && !B) return 1;
  if (A && !B) return A.isDao ? 1.2 : 1.1;
  if (!A && B) return B.isDao ? 0.75 : 0.85;
  if (daoBeats(A!.d, B!.d)) return A!.isDao ? 1.5 : 1.3;
  if (daoBeats(B!.d, A!.d)) return B!.isDao ? 0.7 : 0.8;
  if (A!.d.id === B!.d.id && A!.isDao !== B!.isDao) return A!.isDao ? 1.15 : 0.87;
  return 1;
}
export const R_CHUANTHANH = REALMS.findIndex((r) => r.n === 'Chuẩn Thánh');
export const R_THANHNHAN = REALMS.findIndex((r) => r.n === 'Thánh Nhân');
export const R_HOPDAO = REALMS.findIndex((r) => r.n === 'Hợp Đạo');
export const DAO_FOR_LORD = 3;

export const laws = (): string[] => (s.flags.laws ||= []);
export const daos = (): string[] => (s.flags.daos ||= []);
export const daoOf = (id: string) => DAOS.find((d) => d.id === id)!;
/** Hệ số công từ pháp tắc + đại đạo đã ngộ (nhân dồn; đại đạo thay pháp tắc cùng loại). */
export function daoPow(): number {
  let m = 1;
  for (const id of laws()) m *= daoOf(id).pow;
  for (const id of daos()) m *= daoOf(id).daoPow / daoOf(id).pow;
  return m;
}
slots.daoPow = daoPow;
export const perfectBody = () => s.body === 'hondon';
/** Loại vũ khí từ tên pháp khí / tên chiêu (gộp nhánh). */
export function weaponKey(n: string): string | null {
  const T: [RegExp, string][] = [[/Chùy|Giản|Đồng$|Lang Nha/, 'chuy'], [/Kiếm/, 'kiem'], [/Đao/, 'dao'], [/Thương|Mâu|Sóc/, 'thuong'], [/Côn|Bổng/, 'con'], [/Kích|Qua$/, 'kich'], [/Phủ|Búa|Việt/, 'phu'],
     [/Tiên$|Roi|Liên Tử|Xích/, 'tien'], [/Cung|Nỏ/, 'cung'], [/Tiêu$|Châm|Phi Đao|Lưu Tinh|Ám Khí/, 'amkhi'],
    [/Quyền/, 'quyen'], [/Chưởng|Chỉ$|Trảo/, 'chuong'], [/Cước|Thoái/, 'cuoc'], [/Phiến|Quạt/, 'phien'], [/Cầm|Tranh|Tỳ Bà/, 'cam'], [/Sáo|Chuông|Trống|Hống/, 'am'],
    [/Câu$|Liêm|Thuẫn/, 'cau'], [/Phất trần|Trượng/, 'truong']];
  for (const [re, k] of T) if (re.test(n)) return k;
  return null;
}
/** Vũ khí đang cầm (theo tên pháp khí ô 0). */
function myWeapon(): string | null {
  const n = s.gear[0]?.n || '';
  return weaponKey(n);
}
/** Có duyên: hệ linh căn / công pháp, vũ khí đang cầm; Hỗn Độn Đạo Thai thân cận ba tầng trên. */
function affinity(d: DaoDef): number {
  if (d.tier === 'hondon') return perfectBody() ? 0.25 : -1; // không phải Đạo Thai thì không thể
  if (d.tier === 'batquai') return s.root.k === BATQUAI ? 0.2 : -1; // chỉ Bát quái linh căn
  if (d.tier === 'amduong') return (s.root.els.includes(d.el!) ? 0.2 : 0) + (s.root.k === BATQUAI ? 0.1 : 0) + (perfectBody() ? 0.1 : 0);
  if (d.tier !== 'thuong') return perfectBody() ? 0.15 : 0;
  if (d.el) return s.root.els.includes(d.el) || !!(s.tech && TECHS[s.tech].el.includes(d.el)) ? 0.2 : 0;
  if (d.weapon) return myWeapon() === d.weapon ? 0.2 : 0;
  return 0;
}
/** Tỉ lệ ngộ: ba tầng trên khó dần (Hỗn Độn khó nhất). */
const tierPenalty: Record<DaoTier, number> = { hondon: 0.22, thoigian: 0.14, khonggian: 0.1, batquai: 0.08, amduong: 0.07, lmpn: 0.04, thuong: 0 };
export const lawChance = (id: string) => { const d = daoOf(id); const a = affinity(d); if (a < 0) return 0; return Math.max(0.03, Math.min(0.9, 0.18 + (stat('ngo') - 5) * 0.04 + a + (s.r - R_CHUANTHANH) * 0.08 + s.techM / 500 - s.tamma / 200 - laws().length * 0.05 - tierPenalty[d.tier])); };
export const daoChance = (id: string) => { const d = daoOf(id); const a = affinity(d); if (a < 0) return 0; return Math.max(0.02, Math.min(0.8, 0.1 + (stat('ngo') - 5) * 0.03 + a * 0.8 + (s.r - R_THANHNHAN) * 0.08 + s.techM / 600 - s.tamma / 200 - daos().length * 0.06 - tierPenalty[d.tier])); };
/** Điều kiện đột phá. */
export function daoGate(nr: number): string | null {
  if (nr === R_THANHNHAN && !laws().length) return 'Thánh Nhân phải nắm được ít nhất một Pháp tắc. Hãy Tham ngộ pháp tắc trước.';
  if (nr === R_HOPDAO && !daos().length) return 'Hợp Đạo phải ngộ được ít nhất một Đại đạo. Hãy Tham ngộ đại đạo trước.';
  return null;
}
export const canLord = () => daos().length >= DAO_FOR_LORD;
/** Có thể tham ngộ gì lúc này; Hỗn Độn chỉ hiện cho Hỗn Độn Đạo Thai. Sắp theo tầng rồi theo tỉ lệ. */
export function daoOptions(): { kind: 'law' | 'dao'; id: string; n: string; p: number; tier: DaoTier }[] {
  const out: { kind: 'law' | 'dao'; id: string; n: string; p: number; tier: DaoTier }[] = [];
  if (s.r >= R_CHUANTHANH) for (const d of DAOS) {
    if (laws().includes(d.id)) continue;
    if (d.tier === 'hondon' && !perfectBody()) continue;
    if (d.tier === 'batquai' && !canFuse('law')) continue;
    out.push({ kind: 'law', id: d.id, n: d.n, p: lawChance(d.id), tier: d.tier });
  }
  if (s.r >= R_THANHNHAN) for (const id of laws()) {
    if (daos().includes(id)) continue;
    if (id === 'batquai' && !canFuse('dao')) continue;
    out.push({ kind: 'dao', id, n: daoOf(id).dao, p: daoChance(id), tier: daoOf(id).tier });
  }
  return out.sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier] || b.p - a.p);
}
/** Hợp nhất Âm + Dương → Bát quái: cần Bát quái linh căn và đã có cả hai (pháp tắc hoặc đại đạo tương ứng). */
export const canFuse = (kind: 'law' | 'dao') => s.root.k === BATQUAI && (kind === 'law' ? laws().includes('yin') && laws().includes('yang') : daos().includes('yin') && daos().includes('yang'));
/** Nhãn hệ / vũ khí của một pháp tắc. */
const WEAPON_LABEL: Record<string, string> = { kiem: 'Kiếm', dao: 'Đao', thuong: 'Thương', con: 'Côn', kich: 'Kích', phu: 'Phủ', chuy: 'Chùy', tien: 'Tiên', cung: 'Cung nỏ', amkhi: 'Ám khí', quyen: 'Quyền', chuong: 'Chưởng chỉ', cuoc: 'Cước', phien: 'Quạt', cam: 'Cầm', am: 'Âm', cau: 'Câu', truong: 'Trượng' };
export const daoKindLabel = (d: DaoDef) => (d.tier !== 'thuong' ? TIER_N[d.tier] : d.el ? `${EL[d.el].n} hệ` : d.weapon ? WEAPON_LABEL[d.weapon] ?? d.weapon : '');
/** Tham ngộ một lượt (tốn thời gian một lượt tu luyện của cảnh giới). */
export function contemplate(kind: 'law' | 'dao', id: string): string {
  const d = daoOf(id);
  const p = kind === 'law' ? lawChance(id) : daoChance(id);
  if (p <= 0) return d.tier === 'batquai' ? `${d.n} chỉ Bát quái linh căn, đã có cả Âm lẫn Dương, mới hợp nhất được.` : `${d.n} không dành cho ngươi: chỉ Hỗn Độn Đạo Thai mới nghe được tiếng của Hỗn Độn.`;
  passTime(REALMS[s.r].turn);
  if (!ch(p)) {
    const gain = pick(['chỉ thấy mây trôi', 'chạm được một góc rồi tuột mất', 'ngộ được nửa câu, nửa câu sau tan đi', 'tâm thần mỏi mệt mà chưa thấy gì']);
    return `Ngươi ngồi quán tưởng ${kind === 'law' ? d.n : d.dao} suốt một kỳ bế quan, ${gain}. (Tỉ lệ ${Math.round(p * 100)}%; ngộ tính, công pháp thuần thục, hệ / vũ khí hợp duyên sẽ giúp.)`;
  }
  if (id === 'batquai') { const rm = (arr: string[]) => { for (const x of ['yin', 'yang']) { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); } }; rm(laws()); if (kind === 'dao') rm(daos()); }
  if (kind === 'law') { laws().push(id); mark(`Ngộ ${d.n}`); addLog(`Cảm ngộ ${d.n}: công phạt ×${d.pow}.`, 'good'); return `Trong khoảnh khắc, ${d.n} hiện ra trước mắt. ${d.d.split('.')[0]}. Công phạt ×${d.pow}.`; }
  daos().push(id); if (id === 'batquai' && !laws().includes(id)) laws().push(id); mark(`Ngộ ${d.dao}`); addLog(`Cảm ngộ ${d.dao}: công phạt ×${d.daoPow} (thay cho pháp tắc).`, 'good');
  return `${d.n} vỡ ra, phía sau là thứ lớn hơn gấp vạn lần: ${d.dao}. Công phạt ×${d.daoPow}.${canLord() ? ' Ba Đại đạo trong tay — ngươi đã đủ tư cách tranh ngôi Đạo chủ.' : ''}`;
}
