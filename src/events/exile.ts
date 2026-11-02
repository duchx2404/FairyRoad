// Cố nhân bị hãm hại phải rời tông (chuỗi):
// 1. Người quen thân (có tông môn riêng) tìm tới: bị kẻ gian trong tông hãm hại (thường là Thánh tử ép cưới, bỏ xuân dược không thành,
//    phe trưởng lão của hắn chèn ép, vu tội), mất tông môn và chức vụ; gia thế gắn lại với tông cũ; sư phụ hy sinh để người ấy chạy thoát.
// 2. Đi cùng → đánh lui truy binh (tay chân của kẻ gian).
// 3. Hỏi dự định: mời đồng hành → vào Đồng hành, theo ngươi gia nhập thế lực (engine/ally.ts); không thì đường ai nấy đi.
// 4. Về sau, ở cùng tông với ngươi và đủ cảnh giới: có thể được phong Thánh nữ / Thánh tử thứ hai.
// Bản lưu cũ đã đánh xong trận ở hẻm núi (bản cũ của sự kiện "Cố nhân tìm tới"): nhận ra qua nhật ký, hiện bước 3 ở hành động kế tiếp.
import { s, register, M, money, statUp, fame, good, relChange, findNpc, mark, addLog, he, npcTitle, cultivator, fight, fightSummary, canPay, SECTS, type NPC, type Choice, type Outcome } from '../engine/api';
import { party, outfit, inParty } from '../engine/party';
import { exiles, allyIds, allySync, allySectTitle, activeAllies, exileCause, exileFamily, exileHow, exileMigrate, type Exile } from '../engine/ally';
import { SECT_TIER_INFO, headTitle } from '../data/world';
import type { Scene } from '../engine/actions';

const EVK = '_evNpc';
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const He = (n: NPC) => cap(he(n));
const plain = (n: NPC) => !['master', 'disciple', 'kin', 'daolu', 'enemy', 'rival'].includes(n.tag);
/** Người quen thân có tông môn riêng (không phải tông của ngươi), chưa từng bị trục xuất. */
export const exileCandidate = (n: NPC) => n.alive && plain(n) && n.rel >= 40 && !!n.sect && !!SECTS[n.sect] && n.sect !== s.sect?.id && !exiles()[n.id];

/** Chức cũ trong tông, lấy từ lý lịch nếu có, không thì "Đệ tử <tông>". */
function oldTitle(n: NPC, scN: string): string {
  const first = n.how.split(' — ')[0];
  return first.includes(scN) && /^(Thánh nữ|Thánh tử|Thủ tịch|Thân truyền|Nội môn|Ngoại môn|Ký danh|Trưởng lão|Tạp dịch)/.test(first) ? first : `Đệ tử ${scN}`;
}
/** Hủy tông môn và chức vụ: ghi hồ sơ trục xuất, gắn gia thế vào tông cũ, đổi lý lịch. */
export function applyExile(n: NPC): Exile {
  const sc = SECTS[n.sect!];
  const e: Exile = { from: sc.id, title: oldTitle(n, sc.n), ...exileCause(n), v: 2 };
  exiles()[n.id] = e;
  n.sect = null;
  if (n.bio?.family) n.bio.family = exileFamily(n.bio.family, sc.n);
  n.how = exileHow(n, e);
  addLog(`${n.name} ${e.why}; ${sc.n} xóa tên, mất danh vị ${low(e.title)}. Sư phụ ${he(n)} vì che chở mà hy sinh.`, 'bad');
  return e;
}
/** Lời kể vì sao rời tông + sư phụ hy sinh (ngôi thứ nhất). */
const storyOf = (e: Exile) => `${e.story || `${e.traitor} gài bẫy hãm hại ta.`} Sư phụ đứng ra che cho ta, bị chúng đánh trọng thương — người dốc chút tu vi cuối cùng mở đường cho ta chạy, rồi… không qua khỏi.`;

/** Bước 3: mời đồng hành. Ngươi đang ở tông môn / triều đình thì vào theo ngay, chưa thì đợi ngươi chọn thế lực. */
function joinMe(n: NPC): string {
  const e = exiles()[n.id];
  const P = party();
  if (!inParty(n.id)) P.reserve.push(n.id);
  if (!allyIds().includes(n.id)) allyIds().push(n.id);
  if (n.tag === 'acq' || n.tag === 'senior') n.tag = 'friend';
  relChange(n, 10);
  const back = !!s.sect && !!e && s.sect.id === e.from;
  const follow = back ? '' : allySync(n);
  outfit(n);
  mark(`${n.name} nhận lời đồng hành`);
  const where = back
    ? ` Chỉ có điều ${SECTS[s.sect!.id].n} là nơi vừa xóa tên ${he(n)} — ${he(n)} đi theo ngươi, nhưng không bước vào sơn môn ấy.`
    : follow
    ? ` ${follow}`
    : ` Ngươi chưa thuộc thế lực nào — sau này ngươi gia nhập tông môn hay hoàng triều nào, ${he(n)} sẽ theo vào đó.`;
  return `${n.name} im lặng rất lâu, rồi đứng dậy, chắp tay thi lễ với ngươi: "Mạng này ngươi cứu. Nếu ngươi không chê, từ nay ta đi theo ngươi."${where} (Đã vào Đồng hành › Đội hình, danh sách dự bị.)` + statUp('tam', 1);
}
function partWays(n: NPC, gift: boolean): string {
  if (gift) { s.money -= M(10); relChange(n, 8); good(1); }
  else relChange(n, 3);
  mark(`Chia tay ${n.name} sau trận truy binh`);
  return gift
    ? `Ngươi dúi vào tay ${he(n)} một túi linh thạch. ${n.name} nắm chặt, cúi đầu: "Ơn này ta ghi nhớ." Sáng hôm sau, chỗ ${he(n)} nằm chỉ còn đống tro tàn — đường ai nấy đi.`
    : `"Ngươi bảo trọng." ${n.name} gật đầu, khoác lại chiếc áo rách, một mình đi về phía chân trời. Đường ai nấy đi.`;
}
/** Bước 3: các lựa chọn sau câu hỏi "sau này định thế nào". */
function planChoices(n: NPC): Choice[] {
  return [
    { t: 'Mời đồng hành', cls: 'prime', hint: 'vào Đồng hành · theo ngươi gia nhập tông môn / hoàng triều · chức vụ theo cảnh giới', fn: () => joinMe(n) },
    { t: 'Tặng lộ phí, đường ai nấy đi', dis: !canPay(M(10)), hint: `${M(10)} linh thạch`, fn: () => partWays(n, true) },
    { t: 'Chúc lên đường bình an', fn: () => partWays(n, false) },
  ];
}
const planAsk = (n: NPC) => `Ngươi hỏi ${he(n)}: sau này định thế nào?\n\n"Tông môn không về được nữa. Sư phụ không còn. Ta… cũng không biết nên đi đâu." ${He(n)} ngập ngừng, rồi ngẩng lên nhìn ngươi.`;

/** Bước 2: chặn truy binh. Thắng thì sang bước 3. */
function chase(n: NPC): Outcome {
  const e = exiles()[n.id];
  const r = fight(cultivator(`Tay chân của ${e?.traitor || 'kẻ gian'}`, 0, 1.1));
  const t = fightSummary(r);
  if (!r.win) {
    relChange(n, 10);
    mark(`Cầm chân truy binh cho ${n.name} chạy thoát`);
    return `${t} Truy binh quá đông. Ngươi liều mình cầm chân để ${n.name} chạy thoát. Trước khi khuất bóng, ${he(n)} ngoái lại nhìn ngươi rất lâu.`;
  }
  relChange(n, 20);
  fame(5);
  mark(`Đánh lui truy binh của ${e?.traitor || 'kẻ gian'}, cứu ${n.name}`);
  return { text: `${t} Truy binh tan tác, kẻ cầm đầu bỏ chạy còn ngoái lại hằn học: "Trưởng lão sẽ không bỏ qua đâu!"\n\nĐêm ấy, bên đống lửa, ${n.name} ngồi ôm gối nhìn ngọn lửa rất lâu. ${planAsk(n)}`, choices: planChoices(n) };
}

register([
  {
    id: 'life_friend_exile',
    where: ['any'],
    w: 5,
    cd: 8,
    cond: () => s.npcs.some(exileCandidate),
    title: 'Cố nhân tìm tới',
    text: () => {
      const l = s.npcs.filter(exileCandidate);
      const n = l[Math.floor(Math.random() * l.length)];
      s.flags[EVK] = n.id;
      const e = applyExile(n);
      return `${npcTitle(n)} tìm tới, áo dính bụi đường, mắt thâm quầng, tay áo còn vết máu khô. "Ta không còn là ${low(e.title)} nữa rồi. ${storyOf(e)}" ${He(n)} ngoái nhìn phía sau: "Tay chân của ${e.traitor} vẫn bám theo. Ta không còn ai để nhờ."`;
    },
    ch: () => {
      const n = findNpc(s.flags[EVK])!;
      return [
        { t: 'Đi cùng, chặn truy binh', cls: 'prime', hint: 'một trận với tay chân của kẻ gian', fn: () => chase(n) },
        { t: 'Đưa ít linh thạch để bạn chạy trốn', dis: !canPay(M(15)), fn: () => { s.money -= M(15); relChange(n, 5); return `${n.name} nhận, cảm ơn, rồi một mình biến vào màn đêm. Ánh mắt ${he(n)} lúc quay đi hơi tối lại.`; } },
        { t: 'Từ chối', fn: () => { relChange(n, -15); return `${n.name} gật đầu, quay đi. Bóng lưng ${he(n)} lúc ấy, ngươi nhớ rất lâu.`; } },
      ];
    },
  },
  {
    // Bước 4: đồng hành ở cùng tông với ngươi, đủ cảnh giới → phong Thánh nữ / Thánh tử thứ hai
    id: 'exile_second_saint',
    where: ['any'],
    w: 40,
    cd: 1,
    cond: () => !!saintCandidate(),
    title: () => `${saintCandidate()?.g === 'm' ? 'Thánh tử' : 'Thánh nữ'} thứ hai`,
    text: () => {
      const n = saintCandidate()!;
      s.flags[EVK] = n.id;
      const e = exiles()[n.id];
      const sc = SECTS[s.sect!.id];
      e.saint = true;
      allySync(n);
      fame(10);
      mark(`${n.name} được phong ${allySectTitle(n, sc)}`);
      return `${headTitle(sc)} ${sc.n} triệu tập toàn tông. Trước đại điện, ${n.name} — người năm xưa bị ${SECTS[e.from].n} xóa tên — bước lên bậc đá giữa trăm ánh mắt. Chuông trấn tông ngân chín tiếng: ${n.name} được phong làm ${allySectTitle(n, sc)}. ${He(n)} quỳ nhận ngọc sách, lúc đứng dậy thì tìm ngay bóng ngươi trong đám đông.`;
    },
    ch: () => {
      const n = findNpc(s.flags[EVK])!;
      return [
        { t: 'Đứng dưới điện mỉm cười chúc mừng', cls: 'prime', fn: () => { relChange(n, 10); return `${n.name} khẽ gật đầu với ngươi. Chỉ hai người hiểu con đường từ đống lửa đêm ấy tới đại điện hôm nay dài thế nào.`; } },
        { t: 'Tặng một món quà mừng', dis: !canPay(M(10)), hint: `${M(10)} linh thạch`, fn: () => { relChange(n, 18); return `Tối đó ngươi mang tới một hộp gấm. ${n.name} mở ra, im lặng một lúc rồi bật cười: "Ngươi vẫn như vậy."` + money(-M(10)); } },
      ];
    },
  },
]);
/** Người đi theo ở cùng tông với ngươi, đủ cảnh giới (ngang thân truyền) và có tư chất, chưa được phong. */
function saintCandidate(): NPC | null {
  if (!s.sect) return null;
  const sc = SECTS[s.sect.id];
  const need = SECT_TIER_INFO[sc.tier].chu - 1;
  return activeAllies().find((n) => n.sect === sc.id && exiles()[n.id] && !exiles()[n.id].saint && n.r >= need && (!!n.bio || n.talent >= 1.4)) || null;
}

/** Bản lưu cũ: đã thắng trận ở hẻm núi của sự kiện "Cố nhân tìm tới" bản trước (chưa có chuyện rời tông).
 *  Tìm trong nhật ký người được giúp, đang còn tông môn → hủy tông môn, chức vụ và hẹn bước 3. */
function legacyFind() {
  const win = /chia đôi dưới ánh lửa|chỉ nắm chặt tay ngươi|Trong hang ổ/;
  const lines = s.log.filter((l) => l.t.startsWith('Cố nhân tìm tới:') && win.test(l.t)).reverse();
  for (const l of lines) {
    const n = s.npcs.find((x) => x.alive && l.t.includes(x.name) && !!x.sect && !!SECTS[x.sect] && !exiles()[x.id] && plain(x));
    if (n) { applyExile(n); s.flags.exilePlan = n.id; s.flags.exileLegacy = true; return; }
  }
}
/** Cảnh bước 3 đang chờ (bản lưu cũ): hiện chen trước kết quả hành động kế tiếp. Không có thì null. */
export function exileTalkScene(): Scene | null {
  exileMigrate();
  if (!s.flags.exileLegacyChecked) { s.flags.exileLegacyChecked = true; legacyFind(); }
  const id = s.flags.exilePlan as string | undefined;
  if (!id) return null;
  s.flags.exilePlan = null;
  const n = findNpc(id);
  const e = exiles()[id];
  if (!n || !n.alive || !e) return null;
  const sc = SECTS[e.from];
  return {
    title: 'Cố nhân thổ lộ',
    kind: 'event',
    text: `Mấy ngày sau trận ở hẻm núi, ${n.name} mới chịu nói thật. "Bọn người hôm ấy không phải cướp thường — là tay chân của ${e.traitor}. ${storyOf(e)} Di vật ấy là thứ cuối cùng người để lại." ${He(n)} cúi đầu: "${sc.n} đã xóa tên ta. Ta không còn là ${low(e.title)} nữa."\n\n${planAsk(n)}`,
    aiContext: `${n.name} vừa bị ${sc.n} xóa tên, mất danh vị ${low(e.title)} vì ${e.why}; sư phụ đã hy sinh để ${he(n)} thoát. Cảnh này kết thúc bằng câu hỏi về dự định sau này, chưa có câu trả lời.`,
    choices: planChoices(n),
  };
}
