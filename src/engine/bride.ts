// Hôn ước: hồ sơ (ngoại hình, linh căn, thể chất, thiên phú) của thánh nữ / công chúa / thánh tử,
// và cách thêm một hôn ước mới (ban hôn từ vương triều, tông môn...) vào cùng hệ thống với các thánh nữ Diệp gia.
import { s, type NPC } from './state';
import { BODIES, PERKS, ROOTS, EL, type El } from '../data/core';
import { pick, ri, shuffle } from '../core/util';
import { mark, addLog } from './core';
import { HEROINE } from '../data/heroine';

// hồ sơ: ngoại hình tả lúc 18 tuổi, luôn đẹp; tính cách có thể xấu; luôn có thiên phú Khuynh quốc khuynh thành
const LOOK_A = ['Dung nhan khuynh quốc khuynh thành', 'Tuyệt sắc giai nhân, nhìn một lần khó quên', 'Đẹp như tiên nữ giáng trần', 'Đẹp lạnh lùng như hoa mai trong tuyết', 'Đẹp rực rỡ như nắng sớm', 'Đẹp thanh khiết như sen trắng giữa hồ'];
const LOOK_H = ['tóc đen dài ngang lưng, mềm như suối', 'tóc bạc như tuyết buông tới gót', 'tóc búi cao cài trâm phượng ngọc', 'tóc tím nhạt buộc hờ bằng dải lụa', 'tóc đen xõa như thác mực, điểm vài sợi lụa đỏ', 'tóc dài màu hạt dẻ tết một bím'];
const LOOK_F = ['gương mặt trái xoan, mày liễu, mắt phượng', 'mắt hạnh long lanh, sống mũi thanh tú, môi đỏ như son', 'da trắng như ngọc, đôi mắt trong như nước hồ thu', 'đôi mắt hổ phách sắc lạnh, khóe môi luôn mím nhẹ', 'má lúm đồng tiền mỗi khi cười, mắt cong như trăng non', 'giữa trán một nốt chu sa đỏ, mắt sâu như sao đêm'];
const LOOK_B = ['dáng người cao thon, đứng thẳng như một thanh kiếm', 'dáng người mảnh mai, bước đi nhẹ như mây', 'dáng người nhỏ nhắn, linh hoạt như chim én', 'dáng thướt tha, tà áo bay như khói', 'dáng đoan trang, cử chỉ chuẩn mực như đo bằng thước'];
const LOOK_K = ['khí chất cao quý khiến người ta không dám nhìn thẳng', 'toát ra hàn khí, người lạ không dám lại gần', 'nụ cười làm tan cả băng tuyết', 'vừa đứng đó đã như một bức họa', 'thần thái kiêu hãnh như phượng hoàng'];
/** Tỉ lệ một người có hôn ước với ngươi mang tính Ích kỷ (user chốt 2026-11-02). */
export const SELFISH_RATE = 0.05;
const TRAITS_F = ['Hoạt bát', 'Lương thiện', 'Lạnh lùng', 'Kiêu ngạo', 'Ôn nhu', 'Nghịch ngợm', 'Tự phụ', 'Đa nghi', 'Thẳng thắn', 'Hay ghen', 'Trầm tĩnh', 'Bướng bỉnh', 'Tinh quái', 'Hiền thục', 'Nóng nảy', 'Lắm mưu', 'Ích kỷ', 'Chung tình'];
const HOBBY = ['Luyện kiếm', 'Luyện đan', 'Vẽ phù', 'Đánh đàn', 'Ngắm sao', 'Đọc sách', 'Nuôi linh thú', 'Thêu thùa', 'Chơi cờ', 'Trồng hoa', 'Câu cá', 'Múa', 'Pha trà', 'Thổi tiêu'];
const FAM_HOLY = ['Cháu gái Thái Thượng Trưởng Lão', 'Con gái Thánh chủ', 'Đệ tử thân truyền của Thánh chủ', 'Cháu gái Đại trưởng lão', 'Hậu duệ của tổ sư khai sơn', 'Con gái Thánh chủ đời trước'];
const FAM_CLAN = ['Đích nữ của gia chủ', 'Cháu gái lão tổ', 'Thiên kiêu số một trong tộc', 'Con gái út của gia chủ'];
const ROOT_OPT: [number, number][] = [[5, 1], [6, 1]]; // thánh nữ: chỉ Thiên linh căn (đơn hệ) hoặc Dị linh căn
const GOOD_BODY = BODIES.filter((b) => b.g !== 'm' && !['pham', 'thiendo', 'doanmenh'].includes(b.id));
// nam: thái tử, thánh tử… (khi người chơi là nữ)
const LOOK_MA = ['Tuấn mỹ như ngọc, phong thái xuất trần', 'Anh tuấn bất phàm, đứng đâu cũng là tâm điểm', 'Tuấn lãng như trăng rằm', 'Khuôn mặt lạnh như băng mà đẹp như tượng tạc', 'Phong lưu tiêu sái, cười một cái là nghiêng cả thành'];
const LOOK_MH = ['tóc đen buộc cao bằng dải lụa trắng', 'tóc dài xõa vai, cài một chiếc trâm gỗ', 'tóc bạc như tuyết, buộc gọn sau lưng', 'tóc đen vấn quan ngọc'];
const LOOK_MF = ['mày kiếm mắt sao, sống mũi cao thẳng', 'mắt phượng hẹp dài, khóe môi luôn hơi cong', 'mắt sâu như đáy giếng, đường nét sắc như dao', 'da trắng như ngọc, mày thanh mắt sáng'];
const LOOK_MB = ['vai rộng lưng thẳng, dáng đứng như tùng', 'thân hình cao gầy, tay áo rộng bay trong gió', 'dáng người tráng kiện, bước đi vững như núi'];
const LOOK_MK = ['khí độ vương giả khiến kẻ khác tự nhiên cúi đầu', 'thần thái lạnh nhạt như không gì lay chuyển được', 'nụ cười ấm áp làm người ta bất giác tin tưởng', 'kiếm ý quanh người, đứng im cũng toát sát khí'];
const FAM_ROYAL_F = ['Trưởng công chúa, con gái đầu của đương kim', 'Công chúa út, được sủng ái nhất hậu cung', 'Công chúa đích xuất, mẹ là hoàng hậu', 'Quận chúa, cháu gái ruột của đương kim'];
const FAM_ROYAL_M = ['Thái tử, người kế vị ngai vàng', 'Hoàng tử thứ, mẹ là quý phi được sủng ái', 'Thế tử, cháu đích tôn của đương kim', 'Hoàng tử út, nổi tiếng văn võ song toàn'];
const FAM_SECT_F = ['Thánh nữ của tông, được tông chủ đích thân nuôi dạy', 'Con gái Tông chủ', 'Đệ tử thân truyền của Tông chủ', 'Cháu gái Thái thượng trưởng lão'];
const FAM_SECT_M = ['Thánh tử của tông, được tông chủ đích thân nuôi dạy', 'Con trai Tông chủ', 'Đệ tử thân truyền của Tông chủ', 'Cháu nội Thái thượng trưởng lão'];
const GOOD_BODY_M = BODIES.filter((b) => b.g !== 'f' && !['pham', 'thiendo', 'doanmenh'].includes(b.id));

export type BrideKind = 'holy' | 'clan' | 'royal' | 'sect';
/** Hồ sơ một người có hôn ước với người chơi. g = giới của người đó (mặc định nữ). */
export function mkBrideBio(kind: BrideKind, g: 'm' | 'f' = 'f'): NonNullable<NPC['bio']> {
  let x = Math.random() * ROOT_OPT.reduce((a, r) => a + r[1], 0);
  const rk = (ROOT_OPT.find((r) => (x -= r[1]) <= 0) || ROOT_OPT[0])[0];
  const els = shuffle(rk === 6 ? ['bang', 'loi', 'phong', 'am', 'quang'] : ['kim', 'moc', 'thuy', 'hoa', 'tho']).slice(0, rk === 4 ? 2 : rk === 3 ? 3 : 1) as El[];
  const body = pick(g === 'm' ? GOOD_BODY_M : GOOD_BODY);
  const perk = pick(PERKS.filter((p) => !p.bad));
  // người có hôn ước với ngươi hiếm khi ích kỷ: đúng 5% mang tính này
  const tr = shuffle(TRAITS_F.filter((t) => t !== 'Ích kỷ')).slice(0, 2);
  if (Math.random() < SELFISH_RATE) tr[Math.floor(Math.random() * 2)] = 'Ích kỷ';
  const fam = kind === 'holy' ? FAM_HOLY : kind === 'clan' ? FAM_CLAN : kind === 'royal' ? (g === 'm' ? FAM_ROYAL_M : FAM_ROYAL_F) : g === 'm' ? FAM_SECT_M : FAM_SECT_F;
  const look = g === 'm'
    ? `${pick(LOOK_MA)}: ${pick(LOOK_MH)}, ${pick(LOOK_MF)}; ${pick(LOOK_MB)}, ${pick(LOOK_MK)}.`
    : `${pick(LOOK_A)}: ${pick(LOOK_H)}, ${pick(LOOK_F)}; ${pick(LOOK_B)}, ${pick(LOOK_K)}.`;
  return {
    look,
    root: `${rk === 5 ? 'Thiên linh căn' : ROOTS[rk].n} (${els.map((e) => EL[e].n).join(' · ')})`,
    els,
    body: body.n, bodyD: body.d,
    perk: perk.n, perkD: perk.d,
    family: pick(fam),
    traits: `${tr[0]}, ${tr[1].toLowerCase()}`,
    hobby: shuffle(HOBBY).slice(0, ri(1, 3)).join(', '),
  };
}

/** Mô tả thể chất / thiên phú theo dữ liệu hiện tại (sửa BODIES / PERKS là hiện ngay, kể cả bản lưu cũ đã chép mô tả cũ).
 *  Hồ sơ viết riêng (nữ chính) giữ mô tả của mình. */
export function bioDesc(b: NonNullable<NPC['bio']>, k: 'body' | 'perk'): string | undefined {
  const saved = k === 'body' ? b.bodyD : b.perkD;
  if (b.family === HEROINE.bio.family) return saved;
  const cur = k === 'body' ? BODIES.find((x) => x.n === b.body)?.d : PERKS.find((x) => x.n === b.perk)?.d;
  return cur ?? saved;
}
/** Nguyên nhân chết ngẫu nhiên hằng năm (npctick.ts) — trước đây hôn thê tư chất dưới 1.7 vẫn dính. */
const RANDOM_DEATH = ['bỏ mạng trong hiểm địa', 'tẩu hỏa nhập ma', 'bị kẻ thù ám sát', 'đột phá thất bại'];
/** Bản lưu cũ: hôn thê đã chết vì tai nạn ngẫu nhiên (không do sự kiện, trận đấu hay thọ tận) thì sống lại — tin dữ năm ấy là tin đồn sai. */
export function reviveBrides() {
  for (const id of (s.flags.dhBrides as string[] | undefined) || []) {
    const n = s.npcs.find((x) => x.id === id);
    if (!n || n.alive || !RANDOM_DEATH.includes(n.cause || '') || s.year - n.born > n.life) continue;
    n.alive = true;
    delete n.died;
    delete n.cause;
    addLog(`Tin ${n.name} qua đời năm trước hóa ra là tin đồn sai — nàng chỉ bế quan dưỡng thương, nay đã xuất quan.`, 'good');
  }
}
/** Danh sách mọi hôn ước (còn sống). */
export const betrothed = (): NPC[] => ((s.flags.dhBrides as string[] | undefined) || []).map((id) => s.npcs.find((n) => n.id === id)).filter((n): n is NPC => !!n && n.alive);
/** Diệp gia, sau tuổi thơ và trước mốc mười sáu tuổi: vừa gia nhập tông môn / đại hoàng triều → hẹn cảnh thư chúc mừng
 *  (hiện ngay sau khi đóng cảnh đang mở). `key` = 'sect:<id>' | 'court:<id>'; mỗi nơi chỉ chúc mừng một lần. */
export function queueJoinCongrats(key: string) {
  if (s.origin !== 'diep_hondon' || s.flags.childhood || s.flags.dhDecided || !betrothed().length) return;
  const done = (s.flags.dhCongratsDone ||= []) as string[];
  if (done.includes(key)) return;
  done.push(key);
  s.flags.dhCongrats = key;
}
/** Thêm một hôn ước mới. Diệp gia trước mốc mười sáu tuổi: vào danh sách chờ định đoạt; còn lại coi như hôn ước đã giữ
 *  (vào Nhân mạch như thánh nữ còn giữ ước: luôn chịu đi theo làm đồng hành). */
export function addBetrothal(n: NPC, why: string) {
  const ids = (s.flags.dhBrides ||= []) as string[];
  if (!ids.includes(n.id)) ids.push(n.id);
  if (s.origin !== 'diep_hondon' || s.flags.dhDecided) {
    const kept = (s.flags.dhKept ||= []) as string[];
    if (!kept.includes(n.id)) kept.push(n.id);
  }
  mark(`Hôn ước mới với ${n.name} — ${why}`);
}
