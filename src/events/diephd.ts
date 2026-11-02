// Xuất thân "Huyết mạch Diệp gia Hỗn Độn": tuổi thơ 1–6 (không tu luyện, chơi cùng các thánh nữ có hôn ước),
// 6 tuổi thức tỉnh linh căn (bị coi là phế → giáng làm đệ tử ngoại môn, ra vực ngoài lo gia nghiệp),
// trước 16 tuổi: gia nhập tông môn / đại hoàng triều thì các vị hôn thê gửi thư chúc mừng (cùng tông thì gặp mặt),
// 16 tuổi: các hôn ước được quyết — giữ hay từ hôn tùy vào quá trình phát triển của nhân vật.
import { s, ch, years, statUp, fame, tamma, relChange, mark, addLog, findNpc, setLoc, effRi, LOCS, REALMS, type NPC, type Outcome } from '../engine/api';
import { age, has } from '../engine/char';
import { REGIONS, VUC, SECTS, EMPIRES, COURT_RANKS, type Vuc } from '../data/world';
import type { Scene } from '../engine/actions';
import { activeAllies, exiles } from '../engine/ally';
import { bioDesc, reviveBrides } from '../engine/bride';
import { spawnSuitors } from './suitor';

export const isDiepHD = () => s.origin === 'diep_hondon';
export const inChildhood = () => isDiepHD() && !!s.flags.childhood;
const brides = (): NPC[] => ((s.flags.dhBrides as string[]) || []).map((id) => findNpc(id)).filter((n): n is NPC => !!n && n.alive);
const shortN = (n: NPC) => n.name;
const from = (n: NPC) => n.how.split(' — ')[0];

/** Một năm tuổi thơ: hai bước — làm gì, rồi dành thời gian cho ai. */
const YEARS: { title: string; text: (bs: NPC[]) => string; acts: [string, () => string, string][]; who: string; pick: (n: NPC) => string; all: [string, string]; some: (names: string) => string }[] = [
  {
    title: 'Lễ thôi nôi',
    text: (bs) => `Một tuổi. Cả Diệp gia Tổ Địa treo đèn kết hoa. Các vị thánh nữ có hôn ước với ngươi — ${bs.map(shortN).join(', ')} — được bế tới dự lễ, vị nào cũng còn nhỏ xíu, mắt tròn xoe. Trên chiếu bày đầy đồ vật cho ngươi bốc.`,
    acts: [['Bốc thanh kiếm gỗ', () => statUp('can', 1), 'Ngươi nắm chặt thanh kiếm gỗ không chịu buông. Các trưởng lão gật gù.'], ['Bốc quyển sách', () => statUp('ngo', 1), 'Ngươi ôm quyển sách, lật lật rồi ngủ gục lên đó.'], ['Bốc ngọc bội Hỗn Độn', () => statUp('van', 1), 'Ngươi bò thẳng tới tấm ngọc bội trong nôi cũ. Ngọc lóe lên một tia sáng mà chỉ lão tổ thấy.']],
    who: 'Rồi ngươi bò tới chỗ ai?',
    pick: (n) => `Ngươi bò tới chỗ ${n.name}, túm lấy tay áo nàng. Nàng không khóc, chỉ nhìn ngươi rồi cười khúc khích.`,
    all: ['Ôm tất cả các vị hôn thê', 'Ngươi bò một vòng, ôm từng người một. Các vị hôn thê nhỏ ngã lăn ra chiếu cười khanh khách, cả sảnh người lớn cũng bật cười theo.'],
    some: (ns) => `Ngươi bò một vòng, ôm lấy ${ns}. Những nàng còn lại ngồi nhìn, mắt tròn xoe.`,
  },
  {
    title: 'Trốn tìm',
    text: () => 'Hai tuổi. Các vị thánh nữ được gửi tới Tổ Địa ở mấy tháng. Ngươi cùng các nàng chơi trốn tìm khắp từ đường, giả sơn và vườn thuốc. Tới lượt ngươi đi trốn, các nàng bịt mắt đếm tới mười rồi chia nhau đi tìm.',
    acts: [['Trốn sau giả sơn', () => statUp('van', 1), 'Ngươi thu mình trong một hốc giả sơn, nín thở không dám động đậy.'], ['Trèo lên cây cổ thụ', () => statUp('can', 1), 'Ngươi trèo lên tận ngọn, tới lúc xuống thì xước hết tay chân.'], ['Trốn trong từ đường', () => statUp('tam', 1), 'Ngươi ngồi im trước bài vị tổ tiên rất lâu, lòng yên lạ thường.']],
    who: 'Ai là người tìm thấy ngươi?',
    pick: (n) => `${n.name} tìm thấy ngươi đầu tiên. Nàng chống nạnh: "Lần sau phải trốn chung với ta!"`,
    all: ['Tất cả cùng tìm thấy ngươi', 'Các vị hôn thê cùng ùa tới chỗ ngươi trốn một lượt, đồng thanh hô "Tìm thấy rồi!". Rồi các nàng cãi nhau xem ai thấy trước, cãi mãi không xong, cuối cùng ngồi bệt xuống đất cùng cười.'],
    some: (ns) => `${ns} cùng lúc tìm thấy ngươi, tranh nhau xem ai thấy trước, rốt cuộc chẳng ai chịu ai.`,
  },
  {
    title: 'Học chữ',
    text: () => 'Ba tuổi. Gia tộc mời tiên sinh dạy chữ cho bọn trẻ. Ngươi được dạy viết chữ đầu tiên của đời mình.',
    acts: [['Viết chữ "Đạo"', () => statUp('ngo', 1), 'Nét chữ xiêu vẹo, nhưng tiên sinh nhìn rất lâu.'], ['Viết chữ "Kiếm"', () => statUp('can', 1), 'Nét cuối như một mũi kiếm đâm thủng giấy.'], ['Viết chữ "Diệp"', () => statUp('tam', 1), 'Chữ "Diệp" đầu tiên ngươi viết được treo trong từ đường.']],
    who: 'Ngươi ngồi cạnh ai?',
    pick: (n) => `Ngươi ngồi cạnh ${n.name}. Nàng viết đẹp hơn ngươi, lén cầm tay ngươi sửa từng nét.`,
    all: ['Ngồi giữa tất cả', 'Ngươi ngồi chính giữa, mỗi người cầm tay sửa cho ngươi một nét. Chữ viết ra chẳng giống ai, nhưng tiên sinh giữ lại tờ giấy ấy.'],
    some: (ns) => `Ngươi ngồi giữa ${ns}, mỗi người cầm tay sửa cho ngươi một nét.`,
  },
  {
    title: 'Linh thú nổi điên',
    text: () => 'Bốn tuổi. Một con linh thú con trong vườn bỗng nổi điên, lao vào đám trẻ.',
    acts: [['Lao ra chắn trước mặt mọi người', () => statUp('can', 1) + (fame(10), ''), 'Ngươi dang tay chắn, bị cào một vết dài trên tay. Con thú chững lại trước ánh mắt của ngươi.'], ['Kéo mọi người chạy', () => statUp('tam', 1), 'Ngươi nắm tay từng người kéo chạy vào nhà.'], ['Hét gọi người lớn', () => statUp('ngo', 1), 'Ngươi hét to tới mức cả Tổ Địa nghe thấy.']],
    who: 'Ngươi che chở cho ai?',
    pick: (n) => `Ngươi kéo ${n.name} ra sau lưng mình. Về sau, nàng kể lại chuyện này cho cả thánh địa nghe.`,
    all: ['Dang tay che chở cho tất cả', 'Ngươi đứng chắn trước các nàng, hai tay dang rộng. Con thú dừng lại, gầm gừ rồi bỏ đi. Từ hôm đó, các nàng gọi ngươi là "tiểu ca ca".'],
    some: (ns) => `Ngươi dang tay chắn trước ${ns}. Con thú gầm gừ rồi bỏ đi.`,
  },
  {
    title: 'Kể chuyện sao băng',
    text: () => 'Năm tuổi. Các trưởng lão kể lại dị tượng mưa sao băng từng đồng thời xuất hiện khắp Thương Lan. Ngươi cùng các vị hôn thê trốn lên mái từ đường ngắm trời đêm, tin rằng điều ước sẽ thành khi sao rơi.',
    acts: [['Ước thành tiên', () => statUp('ngo', 1), 'Ngươi ước bay lên tận trời cao.'], ['Ước bảo vệ gia tộc', () => statUp('tam', 1), 'Ngươi ước Diệp gia không ai phải chết nữa.'], ['Ước mãi được ở bên nhau', () => statUp('mi', 1), 'Ngươi ước mọi người mãi mãi như đêm nay.']],
    who: 'Ngươi thì thầm điều ước với ai?',
    pick: (n) => `Ngươi ghé tai ${n.name} nói điều ước. Nàng đỏ mặt, ngoắc tay với ngươi.`,
    all: ['Ngoắc tay với tất cả', 'Ngươi chìa ngón út ra, từng người một ngoắc tay. Sao băng rơi qua đầu, không ai nói ra điều ước — nhưng ai cũng nhớ đêm ấy.'],
    some: (ns) => `Ngươi ngoắc tay với ${ns} dưới mưa sao băng.`,
  },
];

const TALENT_N = (x: number) => (x >= 1.9 ? 'tuyệt thế' : x >= 1.7 ? 'thiên kiêu' : x >= 1.5 ? 'xuất chúng' : 'hơn người');
/** Thông tin cơ bản của một thánh nữ để người chơi dễ chọn. */
export function brideInfo(n: NPC): string[] {
  const b = n.bio;
  if (!b) return [`Gia thế: ${from(n)}`, `Tính cách: ${n.trait}`];
  return [
    exiles()[n.id] && b.family ? `Gia thế: ${b.family}` : `Gia thế: ${from(n)}${b.family ? ' — ' + b.family : ''}`, // đã rời tông: gia thế gắn tông cũ
    `Cảnh giới: ${n.r ? REALMS[n.r].n : 'chưa tu luyện'}`,
    `Ngoại hình (18 tuổi): ${b.look}`,
    `Tính cách: ${b.traits ?? n.trait}`,
    ...(b.hobby ? [`Sở thích: ${b.hobby}`] : []),
    `Linh căn: ${b.root}`,
    `Thể chất: ${b.body}${bioDesc(b, 'body') ? ` (${bioDesc(b, 'body')!.replace(/\.$/, '')})` : ''}`,
    `Thiên phú: ${b.perk}${bioDesc(b, 'perk') ? ` (${bioDesc(b, 'perk')!.replace(/\.$/, '')})` : ''}, Khuynh quốc khuynh thành (dung mạo tuyệt thế, ai gặp cũng sinh thiện cảm; người khác giới khó lòng xuống tay với nàng)`,
    `Tư chất: ${TALENT_N(n.talent)}`,
  ];
}
/** Bước hai mỗi năm: chọn một, vài, hay tất cả vị hôn thê. Càng chọn nhiều, mỗi người được ít thiện cảm hơn.
 *  Kết quả của cả hai bước (việc đã làm + người đã chọn) được kể gộp một lần sau khi xác nhận. */
function bridePick(i: number, act: string, pre: string): Outcome {
  const bs = brides();
  const y = YEARS[i];
  if (!bs.length) { years(1); return pre; }
  return {
    text: `${y.who} (chọn một, vài người, hoặc tất cả)`,
    quiet: true,
    pick: {
      head: act,
      items: bs.map((n) => ({ id: n.id, label: n.name, head: `Tên: ${n.name}   Tuổi: ${Math.floor(s.year - n.born)}   Thiện cảm: ${Math.round(n.rel)}`, info: brideInfo(n) })),
      min: 1,
      confirm: 'Xác nhận',
      done: (ids) => {
        const pickd = bs.filter((n) => ids.includes(n.id));
        const k = pickd.length;
        const each = k === 1 ? 18 : k === bs.length ? 11 : Math.round(18 - (7 * (k - 1)) / Math.max(1, bs.length - 1));
        for (const n of bs) relChange(n, pickd.includes(n) ? each : 3);
        years(1);
        const txt = k === 1 ? y.pick(pickd[0]) : k === bs.length ? y.all[1] : y.some(pickd.map((n) => n.name).join(', '));
        return `${pre}\n\n${txt} (mỗi người được chọn +${each} thiện cảm${k < bs.length ? ', người khác +3' : ''})`;
      },
    },
  };
}

/** Cảnh tuổi thơ theo tuổi hiện tại (1..5), hoặc thức tỉnh linh căn khi đủ 6 tuổi. */
export function childScene(): Scene {
  const a = Math.floor(age());
  if (a >= 6) return awakenScene();
  const y = YEARS[Math.max(0, Math.min(4, a - 1))];
  const bs = brides();
  return {
    title: `${y.title} · ${a} tuổi`,
    text: y.text(bs) + '\n\nTừ một tới sáu tuổi ngươi chưa thể tu luyện — chỉ có thể lớn lên cùng các thánh nữ.',
    aiContext: `Có chính xác ${bs.length} vị hôn thê trong cảnh này: ${bs.map(shortN).join(', ')}. Giữ nguyên đủ số lượng và tên người. Nếu lời kể nói tới tất cả thì phải nói đúng ${bs.length} người, tuyệt đối không đổi thành số khác.`,
    kind: 'event',
    choices: y.acts.map(([t, eff, txt]) => ({ t, fn: () => bridePick(YEARS.indexOf(y), t, txt + eff()) })),
  };
}

const OUTER: [Vuc, string][] = [['dong', 'Đông Vực'], ['tay', 'Tây Vực'], ['nam', 'Nam Vực'], ['bac', 'Bắc Vực']];
function awakenScene(): Scene {
  return {
    title: 'Thức tỉnh linh căn · 6 tuổi',
    kind: 'event',
    text: 'Sáu tuổi. Trước toàn tộc, ngươi đặt tay lên đá trắc linh. Đá không sáng — một tia cũng không. Có người thì thầm hai chữ "phế linh căn". Trưởng lão hội họp ba ngày ba đêm: người kế thừa gia chủ không thể là phế vật. Dưỡng phụ cắn răng tuyên bố: ngươi bị giáng làm đệ tử ngoại môn, đưa ra một vực bên ngoài lo gia nghiệp của Diệp gia.\n\nĐêm ấy, ngồi một mình trong phòng, ngươi cảm thấy mười dòng linh khí lặng lẽ xoay quanh đan điền — đá trắc linh không đo được, vì nó chưa từng thấy linh căn nào như thế.',
    choices: OUTER.map(([v, n]) => ({
      t: `Tới ${VUC[v].n || n}`,
      hint: 'Lo gia nghiệp của Diệp gia ở đó',
      fn: () => {
        const towns = Object.values(LOCS).filter((l) => l.type === 'town' && !l.island && REGIONS[l.reg]?.vuc === v);
        const to = towns.length ? towns[Math.floor(Math.random() * towns.length)] : null;
        s.flags.childhood = false;
        s.flags.dhHeir = false;
        s.flags.dhOuter = v;
        s.r = 1; s.st = 0; s.prog = 0;
        if (to) setLoc(to.id);
        for (const b of brides()) relChange(b, -8);
        mark(`Bị giáng làm đệ tử ngoại môn, ra ${VUC[v].n} lo gia nghiệp`);
        addLog('Tin Diệp gia có người kế thừa "phế linh căn" lan tới các thánh địa.', 'bad');
        return `Ngươi rời Tổ Địa trên một cỗ xe ngựa cũ${to ? `, tới ${to.n}` : ''}. Không ai tiễn, trừ dưỡng phụ đứng trên tường thành rất lâu. Ở nơi mới, ngươi là đệ tử ngoại môn trông coi gia nghiệp — và cũng là lần đầu tiên tự mình tu luyện. Mười dòng linh khí đưa ngươi bước vào Luyện Khí.` + tamma(-5);
      },
    })),
  };
}

/** Thư giữ hôn ước — mỗi thánh nữ viết một kiểu, theo tính cách của nàng. */
const KEEP_LETTER: Record<string, (n: NPC) => string> = {
  'hoạt bát': () => `gửi thư dày ba tờ, kể đủ chuyện trên núi, cuối thư mới viết thêm một dòng nhỏ: "À, hôn ước ấy, ta không đổi ý đâu. Mau lớn lên đi!"`,
  'lương thiện': () => `gửi thư kèm một túi đan dược hộ thân: "Nghe nói dạo này ngươi vất vả lắm, giữ gìn sức khỏe. Chuyện hôn ước ngươi đừng lo, ta đã thưa với sư tôn rồi — ta giữ."`,
  'lạnh lùng': () => `chỉ gửi một tấm thiệp trắng, vỏn vẹn bốn chữ: "Ước cũ không đổi." Không ký tên — nhưng nét chữ ấy ngươi nhận ra.`,
  'kiêu ngạo': () => `gửi thư, chữ to và sắc: "Ta đã chọn ai, kẻ đó không thể tầm thường. Hôn ước giữ nguyên. Đừng làm ta mất mặt."`,
  'ôn nhu': () => `gửi thư thơm mùi mực mới, chữ nắn nót: "Mười sáu năm trước người lớn định cho chúng ta. Hôm nay là ta tự định. Ngươi cứ đi đường của ngươi, ta ở đây."`,
  'nghịch ngợm': () => `gửi một bức vẽ nguệch ngoạc hai đứa trẻ ngoắc tay, bên dưới ghi: "Nuốt lời là chó con. Ta không nuốt. Còn ngươi?"`,
  'tự phụ': () => `gửi thư: "Ta không cần một hôn phu mạnh. Ta chỉ cần người ta đã chọn. Hôn ước giữ nguyên — đó là quyết định của ta, không ai được bàn."`,
  'đa nghi': () => `gửi thư viết rồi gạch, gạch rồi viết, cuối cùng chỉ còn một câu đọc được: "Người ta nói đủ điều về ngươi. Ta không tin ai cả, ta tự xem. Hôn ước cứ để đó."`,
  'thẳng thắn': () => `gửi thư ngắn gọn: "Sư môn ép ta từ hôn. Ta nói không. Hết chuyện. Khi nào rảnh thì viết thư."`,
  'hay ghen': () => `gửi thư, nét chữ hơi gắt: "Nghe nói bên cạnh ngươi có cô nương hay qua lại? Hôn ước ta vẫn giữ. Ngươi tự hiểu phải giữ cái gì."`,
  'trầm tĩnh': () => `gửi thư chỉ chép lại một câu trong sách ngày bé hai người cùng học: "Lời đã hứa, trọng hơn núi." Dưới ký tên nàng.`,
  'bướng bỉnh': () => `gửi thư: "Cả thánh địa khuyên ta bỏ. Càng khuyên ta càng không bỏ. Ngươi mà dám bỏ trước thì ta tìm tới tận nơi."`,
  'tinh quái': () => `gửi thư niêm bằng phù chú, mở ra chỉ thấy tờ giấy trắng. Hơ lên lửa mới hiện chữ: "Đoán xem ta có từ hôn không? Không đâu. Lừa được ngươi rồi."`,
  'hiền thục': () => `gửi kèm một chiếc áo ấm nàng tự may, đường kim còn vụng: "Trời trở lạnh rồi. Hôn ước vẫn như xưa, ngươi đừng nghĩ nhiều."`,
  'nóng nảy': () => `gửi thư, nét chữ hằn sâu suýt rách giấy: "Kẻ nào bảo ta từ hôn, ta đánh kẻ đó. Đã đánh ba người rồi. Ngươi liệu mà tu cho tử tế!"`,
  'lắm mưu': () => `gửi thư: "Ta đã nói với sư tôn rằng giữ hôn ước với Diệp gia có lợi cho thánh địa, người tin ngay. Nhưng lý do thật là gì, ngươi biết mà."`,
  'ích kỷ': () => `gửi thư: "Thứ gì là của ta thì mãi là của ta. Hôn ước cũng vậy. Ngươi không được để kẻ khác lấy mất."`,
  'chung tình': () => `gửi thư chỉ một dòng, giấy đã nhòe mấy chỗ: "Từ đêm sao băng năm ấy, ta chưa từng nghĩ tới ai khác. Ta đợi."`,
};
const KEEP_FALLBACK: ((n: NPC) => string)[] = [
  () => `gửi thư tới, nét chữ vẫn như năm nào nàng cầm tay ngươi sửa: "Hôn ước vẫn còn. Ta đợi."`,
  () => `nhờ hạc giấy mang tới một phong thư ngắn: "Người ta hỏi ta có hối không. Ta hỏi lại: hối cái gì? Hôn ước giữ nguyên."`,
  () => `gửi tới nửa tấm ngọc bội định thân năm xưa, kèm một dòng: "Nửa kia ngươi giữ. Khi nào ghép lại được thì tới tìm ta."`,
  (n) => `gửi thư kể chuyện ${(n.bio?.hobby || 'luyện công').split(', ')[0].toLowerCase()} trên núi dài hai trang, rồi mới nhắc khẽ ở cuối: "Thánh địa muốn ta từ hôn. Ta không ký."`,
  () => `gửi thư viết bằng nét chữ non nớt của chính nàng, không nhờ ai chép: "Ta nhớ lời hứa ở Tổ Địa. Ngươi nhớ không? Ta vẫn nhớ."`,
  () => `gửi thư: "Ngươi ở đâu không quan trọng. Ngươi tu được hay không cũng không quan trọng. Hôn thư ta cất trong tay áo, chưa từng rời người."`,
];
/** Nơi ngươi vừa gia nhập, dùng trong thư chúc mừng. `did` ghép sau "ngươi ..." (vd. "bái nhập Tử Tiêu Tiên Cung"). */
interface Join { n: string; did: string; girls: string; robe: string }
/** Thư chúc mừng khi ngươi gia nhập tông môn / đại hoàng triều trước mốc mười sáu tuổi.
 *  Chỉ mừng cho ngươi — chuyện hôn ước để tới năm mười sáu tuổi mới bàn, nên thư không hứa giữ hay bỏ. */
const CONGRATS_LETTER: Record<string, (n: NPC, j: Join) => string> = {
  'hoạt bát': (_n, j) => `gửi thư dày ba tờ, chữ nhảy nhót khắp trang: "Chúc mừng, chúc mừng! Ngươi ${j.did} thật rồi! Ta reo to tới mức sư tỷ phải bịt miệng ta. Năm mười sáu tuổi nhớ kể ta nghe hết đấy nhé!"`,
  'lương thiện': (_n, j) => `gửi thư kèm một túi đan dược hộ thân: "Chúc mừng ngươi ${j.did}. Bước đầu ở nơi mới, đừng cố quá sức. Ta ở thánh địa vẫn ngày ngày cầu cho ngươi bình an."`,
  'lạnh lùng': (_n, j) => `chỉ gửi một tấm thiệp trắng, vỏn vẹn mấy chữ: "Chúc mừng. ${j.n} — xứng với ngươi." Không ký tên, nhưng nét chữ ấy ngươi nhận ra.`,
  'kiêu ngạo': (_n, j) => `gửi thư, chữ to và sắc: "Ta đã nói rồi, người ta từng chọn không thể là phế vật. ${j.n} nhận ngươi, cả thiên hạ phải câm miệng. Chúc mừng. Những chuyện khác, đợi năm mười sáu tuổi hẵng nói."`,
  'ôn nhu': (_n, j) => `gửi thư thơm mùi mực mới, chữ nắn nót: "Nghe tin ngươi ${j.did}, ta mừng suốt mấy đêm không ngủ. Ngươi cứ vững bước, những lời muốn nói, ta để dành tới năm mười sáu tuổi."`,
  'nghịch ngợm': (_n, j) => `gửi một bức vẽ nguệch ngoạc: một đứa trẻ ưỡn ngực đứng trước cổng ${j.n}, bên cạnh một đứa trẻ khác đang vỗ tay. Bên dưới ghi: "Chúc mừng nhé! Đừng tưởng vào đó rồi là quên ta."`,
  'tự phụ': (_n, j) => `gửi thư: "${j.n} cũng biết nhìn người — giống ta. Chúc mừng. Cứ thế mà tiến, đừng để ta phải chờ ngươi."`,
  'đa nghi': (_n, j) => `gửi thư viết rồi gạch, gạch rồi viết, cuối cùng còn đọc được: "Ta cho người dò hỏi ba lần mới dám tin ngươi thật sự ${j.did}. Chúc mừng. Ta sẽ tiếp tục để mắt tới ngươi."`,
  'thẳng thắn': (_n, j) => `gửi thư ngắn gọn: "Chúc mừng ngươi ${j.did}. Làm tốt lắm. Khi nào rảnh thì viết thư."`,
  'hay ghen': (_n, j) => `gửi thư, nét chữ vui mà hơi gắt: "Chúc mừng ngươi ${j.did}! Nghe nói ở đó ${j.girls} đông lắm. Hừ, ta chỉ hỏi vậy thôi."`,
  'trầm tĩnh': (_n, j) => `gửi thư chép một câu trong sách ngày bé hai người cùng học: "Đường dài mới biết sức ngựa." Bên dưới thêm một dòng: "Mừng ngươi ${j.did}."`,
  'bướng bỉnh': (_n, j) => `gửi thư: "Ai từng bảo ngươi là phế vật, giờ hãy nhìn xem — ${j.n} nhận ngươi rồi đấy! Chúc mừng. Ta biết ngay mà."`,
  'tinh quái': (_n, j) => `gửi thư niêm bằng phù chú; hơ lên lửa mới hiện chữ: "Chúc mừng ngươi ${j.did}! Quà mừng ta giấu trong thư này đấy — đoán xem ở đâu?"`,
  'hiền thục': (_n, j) => `gửi kèm ${j.robe} nàng tự may, đường kim còn vụng: "Mừng ngươi ${j.did}. Ở nơi mới nhớ ăn mặc cho ấm."`,
  'nóng nảy': (_n, j) => `gửi thư, nét chữ hằn sâu: "Ha! ${j.n}! Kẻ nào còn dám gọi ngươi là phế vật, ta đánh kẻ đó. Chúc mừng! Ngươi liệu mà tu cho tử tế!"`,
  'lắm mưu': (_n, j) => `gửi thư: "Chúc mừng ngươi ${j.did}. Sư tôn ta nghe tin cũng phải nhìn ta bằng con mắt khác. Ngươi nợ ta một lời cảm ơn — năm mười sáu tuổi ta sẽ tới đòi."`,
  'ích kỷ': (_n, j) => `gửi thư: "Ngươi ${j.did}, ta mừng. Nhưng nhớ cho kỹ: người khác có tốt với ngươi tới đâu cũng không bằng ta."`,
  'chung tình': (_n, j) => `gửi thư chỉ hai dòng, giấy nhòe mấy chỗ: "Mừng ngươi ${j.did}. Từ đêm sao băng năm ấy, ta vẫn luôn dõi theo ngươi."`,
};
const CONGRATS_FALLBACK: ((n: NPC, j: Join) => string)[] = [
  (_n, j) => `gửi thư tới, nét chữ vẫn như năm nào nàng cầm tay ngươi sửa: "Chúc mừng ngươi ${j.did}. Ta mừng cho ngươi."`,
  (_n, j) => `nhờ hạc giấy mang tới một phong thư: "Tin ngươi ${j.did} truyền khắp các thánh địa. Chúc mừng."`,
  (_n, j) => `gửi tới một tấm bình an phù tự tay vẽ kèm một dòng: "Mừng ngươi ${j.did}. Mang theo bên người."`,
  (n, j) => `gửi thư kể chuyện ${(n.bio?.hobby || 'luyện công').split(', ')[0].toLowerCase()} trên núi dài hai trang, cuối thư mới viết: "Chúc mừng ngươi ${j.did}."`,
  (_n, j) => `gửi thư viết bằng chính nét chữ của nàng: "Ngươi ${j.did} rồi, ta mừng lắm. Đợi năm mười sáu tuổi gặp lại."`,
];
/** Thánh nữ của chính tông môn ngươi vừa bái vào: không viết thư mà tới gặp tận mặt chúc mừng.
 *  Chỉ chúc mừng — không nói gì tới chuyện giữ hay bỏ hôn ước (năm mười sáu tuổi mới bàn). */
const MEET_LINE: Record<string, (n: NPC, sc: string) => string> = {
  'hoạt bát': (_n, sc) => `chạy thẳng xuống quảng trường ${sc} giữa lúc đệ tử đang tụ tập, nhảy lên ôm chầm lấy ngươi: "Ngươi tới thật rồi! Từ nay ta dẫn ngươi đi khắp ${sc}, chỗ nào ăn ngon chơi vui ta đều biết hết!"`,
  'lương thiện': (_n, sc) => `tới tận nơi ở của tân đệ tử, mang theo một túi đan dược hộ thân: "Chúc mừng ngươi nhập môn ${sc}. Mới tới còn lạ nước lạ cái, có gì không hiểu cứ tới hỏi ta."`,
  'lạnh lùng': (_n, sc) => `đi ngang qua hàng tân đệ tử ${sc}, dừng lại trước mặt ngươi đúng một nhịp thở: "Chúc mừng." Rồi đi thẳng — nhưng tối hôm đó, trước cửa phòng ngươi có thêm một bình linh dịch.`,
  'kiêu ngạo': (_n, sc) => `đứng trên bậc cao của đại điện ${sc}, nhìn đám đệ tử đang xì xào về "tân đệ tử nhà họ Diệp", rồi nói với ngươi đủ to cho tất cả cùng nghe: "Vào được ${sc} là bản lĩnh của ngươi. Kẻ nào còn gọi ngươi là phế vật, cứ bước lên đây."`,
  'ôn nhu': (_n, sc) => `đợi ngươi ở cổng sơn môn ${sc} ngay ngày đầu nhập môn, nhẹ nhàng chỉnh lại vạt áo đệ tử cho ngươi: "Áo mới hợp với ngươi lắm. Chúc mừng ngươi."`,
  'nghịch ngợm': (_n, sc) => `giữa buổi điểm danh tân đệ tử ${sc}, lén chen vào hàng, giật nhẹ tóc ngươi một cái rồi thì thầm: "Chúc mừng nhé! Ta vào trước, từ nay phải gọi ta một tiếng sư tỷ." Cả hàng đệ tử nín cười.`,
  'tự phụ': (_n, sc) => `tới xem ngươi nhận lệnh bài ${sc}, khoanh tay gật đầu: "Không tệ. Đã vào ${sc} thì đừng làm mất mặt người quen của ta."`,
  'đa nghi': (_n, sc) => `tới xem ngươi khảo hạch nhập môn ${sc} từ đầu tới cuối, xong mới bước ra: "Ta tận mắt xem rồi — không phải nhờ quan hệ. Chúc mừng."`,
  'thẳng thắn': (_n, sc) => `bước tới giữa quảng trường ${sc}, vỗ vai ngươi trước mặt đồng môn: "Chúc mừng ngươi nhập môn. Mai ra luyện võ trường, ta xem ngươi tiến tới đâu rồi."`,
  'hay ghen': (_n, sc) => `xuất hiện đúng lúc mấy sư tỷ ${sc} đang vây quanh hỏi han ngươi, chen vào giữa: "Chúc mừng ngươi nhập môn. Các sư tỷ bận thì cứ đi, để ta dẫn ngươi đi nhận phòng."`,
  'trầm tĩnh': (_n, sc) => `tới trước đại điện ${sc}, đưa ngươi một quyển sổ chép tâm đắc tu luyện: "Chúc mừng ngươi nhập môn. Đây là những gì ta ghi lại mấy năm qua, có lẽ ngươi dùng được."`,
  'bướng bỉnh': (_n, sc) => `kéo ngươi tới trước mặt mấy vị trưởng lão ${sc} từng chê ngươi: "Các vị nhìn đi — vào được tông ta rồi đấy!" Rồi quay sang ngươi: "Chúc mừng. Ta biết ngay mà."`,
  'tinh quái': (_n, sc) => `bày một trò ảo thuật giữa sân ${sc}: pháo hoa nổ thành mấy chữ "Chúc mừng nhập môn", rồi cười trước bao ánh mắt sững sờ: "Quà ra mắt đấy. Thích không?"`,
  'hiền thục': (_n, sc) => `tới tận nơi ở của tân đệ tử ${sc}, trao cho ngươi bộ đạo bào nàng tự may: "Mừng ngươi nhập môn. Áo tông phát thô lắm, ngươi mặc bộ này cho êm."`,
  'nóng nảy': (_n, sc) => `xông vào giữa đám đệ tử ${sc} đang bàn tán về ngươi, đập tay lên bàn: "Người ta vào bằng bản lĩnh! Kẻ nào còn dám nói nửa câu, ra võ đài với ta!" Rồi quay sang ngươi: "Chúc mừng!"`,
  'lắm mưu': (_n, sc) => `chọn đúng lúc tông chủ ${sc} đang tiếp kiến tân đệ tử, bước ra thi lễ: "Diệp gia với tông ta vốn có giao tình, đệ tử xin được chỉ dẫn người mới này." Rồi quay sang nháy mắt với ngươi: "Chúc mừng."`,
  'ích kỷ': (_n, sc) => `kéo ngươi ra khỏi đám đồng môn ${sc}, vào một góc: "Chúc mừng ngươi nhập môn. Có gì cần thì tìm ta, đừng đi nhờ người khác."`,
  'chung tình': (_n, sc) => `đứng đợi ngươi ở bậc đá ${sc} từ sáng tới chiều. Khi thấy ngươi, nàng chỉ mỉm cười: "Chúc mừng ngươi. Ta đợi ngày này lâu lắm rồi."`,
};
const MEET_FALLBACK: ((n: NPC, sc: string) => string)[] = [
  (_n, sc) => `tới gặp ngươi giữa quảng trường ${sc}, trước đông đảo đồng môn: "Chúc mừng ngươi nhập môn. Từ nay là đồng môn rồi."`,
  (_n, sc) => `đích thân tới nơi ở của tân đệ tử ${sc}, tặng ngươi một tấm bình an phù tự tay vẽ: "Mừng ngươi nhập môn. Mang theo bên người."`,
  (_n, sc) => `đứng một bên đại điện ${sc} suốt buổi bái sư, mỉm cười với ngươi. Xong lễ mới tới nói nhỏ: "Chúc mừng. Ngày bé ở Tổ Địa, ai ngờ có hôm nay."`,
];
/** Năm mười sáu tuổi, thánh nữ cùng tông với ngươi: không viết thư mà tìm gặp tận mặt để bàn chuyện hôn ước — và giữ. */
const MEET16_LINE: Record<string, (n: NPC, sc: string) => string> = {
  'hoạt bát': (_n, sc) => `kéo ngươi ra sau núi ${sc}, ngồi vắt vẻo trên tảng đá, đung đưa chân: "Mười sáu rồi đấy. Người ta bảo năm nay phải định chuyện hôn ước. Ta định xong lâu rồi ngươi đừng hòng thoát khỏi tay bổn thánh nữ."`,
  'lương thiện': (_n, sc) => `tìm tới chỗ ở của ngươi trong ${sc}, mang theo một hộp điểm tâm: "Sư tôn hỏi ta chuyện hôn ước năm nay. Ta chưa trả lời nhưng ta muốn giữ."`,
  'lạnh lùng': (_n, sc) => `gặp ngươi trên bậc đá ${sc}, đứng cách ba bước: "Ước cũ — không đổi." Nói xong quay đi, vành tai hơi đỏ.`,
  'kiêu ngạo': (_n, sc) => `gọi ngươi tới đình nghị sự ${sc}, trước mặt mấy vị trưởng lão nói thẳng: "Hôn ước không đổi. Ai có ý kiến, nói chuyện với nắm đấm của ta."`,
  'ôn nhu': (_n, sc) => `hẹn ngươi dưới gốc cổ thụ sau ${sc}, rót cho ngươi chén trà: "Năm xưa người lớn định cho chúng ta. Hôm nay, ta tự định hôn ước này."`,
  'nghịch ngợm': (_n, sc) => `nhảy từ mái hiên ${sc} xuống ngay trước mặt ngươi, chìa ngón út: "Hôm nay định hôn ước. Ngoắc tay lần nữa — lần này là thật!"`,
  'tự phụ': (_n, sc) => `gặp ngươi ở luyện võ trường ${sc}: "Năm nay phải quyết chuyện hôn ước. Ta quyết định rồi. Không thay đổi."`,
  'đa nghi': (_n, sc) => `đứng xem ngươi luyện công ở ${sc} suốt một buổi rồi mới bước ra: "Mấy năm cùng tông, ta tự xem đủ rồi. Hôn ước cứ giữ."`,
  'thẳng thắn': (_n, sc) => `chặn ngươi giữa đường trong ${sc}: "Mười sáu tuổi, phải định hôn ước. Ta giữ. Ngươi thì sao? … Thôi khỏi trả lời, nhìn mặt là biết."`,
  'hay ghen': (_n, sc) => `kéo ngươi ra khỏi đám sư tỷ sư muội ${sc} đang trò chuyện: "Năm nay định đoạt hôn ước. Ta giữ — nên từ nay ngươi bớt cười với người khác đi."`,
  'trầm tĩnh': (_n, sc) => `tới chỗ ở của ngươi trong ${sc}, ngồi xuống đối diện, im lặng hồi lâu rồi mới nói: "Lời đã hứa, nặng hơn núi."`,
  'bướng bỉnh': (_n, sc) => `đứng giữa sân ${sc} nói to cho mọi người cùng nghe: "Có người bảo năm nay ta nên nghĩ lại chuyện hôn ước. Ta nghĩ rồi — không bỏ!"`,
  'tinh quái': (_n, sc) => `bày một trò ảo thuật giữa sân ${sc}: pháo hoa nổ thành hai chữ "Hôn thư", rồi cười trước bao ánh mắt sững sờ: "Ngươi đoán xem ta có quên không?." Sau đó nàng làm mặt quỷ rồi chạy mất.`,
  'hiền thục': (_n, sc) => `mang tới chỗ ở của ngươi trong ${sc} một túi thơm tự thêu: "Năm nay định hôn ước. Ta giữ, như xưa."`,
  'nóng nảy': (_n, sc) => `xông thẳng vào chỗ ở của ngươi trong ${sc}: "Mười sáu tuổi rồi! Hôn ước ta giữ! Kẻ nào bàn ra bàn vào thì ra võ đài với ta!"`,
  'lắm mưu': (_n, sc) => `mời ngươi đánh cờ trong ${sc}, giữa ván mới thong thả nói: "Năm nay định hôn ước. Ta giữ — lý do thật, ngươi biết mà." Rồi ăn luôn một quân của ngươi.`,
  'ích kỷ': (_n, sc) => `nắm tay áo ngươi ngay trước mặt đồng môn ${sc}: "Năm nay định hôn ước. Của ta thì vẫn là của ta."`,
  'chung tình': (_n, sc) => `đợi ngươi ở bậc đá ${sc} như mọi ngày, chỉ khẽ nói: "Mười sáu tuổi rồi. Ta vẫn đợi — từ đêm sao băng năm ấy."`,
};
const MEET16_FALLBACK: ((n: NPC, sc: string) => string)[] = [
  (_n, sc) => `tìm gặp ngươi giữa quảng trường ${sc}, trước mặt đồng môn: "Năm nay định đoạt hôn ước. Ta giữ — ta nói ở đây để ai cũng nghe."`,
  (_n, sc) => `hẹn ngươi lên đỉnh núi sau ${sc} lúc hoàng hôn, lấy ra nửa tấm ngọc bội định thân năm xưa: "Mười sáu tuổi rồi. Nửa kia ngươi giữ — ước cũ không đổi."`,
  (_n, sc) => `tới chỗ ở của ngươi trong ${sc}, ngồi rất lâu mới nói: "Ta nghĩ kỹ rồi. Hôn ước, ta giữ."`,
];
/** Lời từ hôn — cũng mỗi người một kiểu. */
const BREAK_LINE: Record<string, string> = {
  'lạnh lùng': `đặt hôn thư xuống bàn, không ngồi: "Diệp gia và thánh địa không nợ nhau gì nữa. Ngươi đi đường của ngươi."`,
  'kiêu ngạo': `đặt hôn thư xuống, cằm vẫn ngẩng cao: "Ta là thánh nữ. Vì sao tới đây, ngươi tự hiểu."`,
  'lương thiện': `đặt hôn thư xuống, mắt đỏ hoe: "Sư môn ép... ta không chống nổi. Xin lỗi ngươi."`,
  'hoạt bát': `đặt hôn thư xuống, lần đầu không cười: "Người lớn bảo thế. Ta... ta cũng không biết nữa."`,
  'thẳng thắn': `đặt hôn thư xuống: "Ta không thể gả cho người không tu được. Nói thẳng để ngươi khỏi mong."`,
  'ôn nhu': `đặt hôn thư xuống, giọng rất khẽ: "Đừng trách ta. Có những chuyện không phải ta quyết."`,
  'tự phụ': `đặt hôn thư xuống: "Tương lai của ta không thể buộc vào một người đứng yên tại chỗ."`,
  'đa nghi': `đặt hôn thư xuống, nhìn quanh phủ một lượt: "Ta chờ mười năm xem ngươi có gì khác. Không có. Vậy thôi."`,
  'hay ghen': `đặt hôn thư xuống, giọng chua chát: "Nghe nói ngươi ở đây sống cũng vui vẻ lắm. Vậy khỏi cần ta nữa."`,
  'trầm tĩnh': `đặt hôn thư xuống, im lặng rất lâu rồi mới nói: "Đây là ý của thánh địa. Cũng là ý của ta."`,
  'bướng bỉnh': `ném hôn thư lên bàn: "Ta không muốn tới. Nhưng ta tới rồi. Đừng hỏi gì thêm."`,
  'tinh quái': `đặt hôn thư xuống, cười mà không có ý cười: "Không có trò đùa nào lần này đâu. Thật đấy."`,
  'hiền thục': `đặt hôn thư xuống, cúi đầu thật thấp: "Tội bất hiếu, ta không gánh nổi. Mong ngươi hiểu."`,
  'nóng nảy': `đập hôn thư xuống bàn: "Mười năm! Ngươi có mười năm mà vẫn thế này! Ta hết kiên nhẫn rồi."`,
  'lắm mưu': `đặt hôn thư xuống, giọng đều đều: "Thánh địa cần một hôn ước có ích. Hôn ước này hiện không có ích. Chỉ vậy thôi."`,
  'ích kỷ': `đặt hôn thư xuống: "Ta không thể gánh cả đời một người kéo ta xuống."`,
  'chung tình': `đặt hôn thư xuống, tay run: "Ta đã cố giữ mười năm. Ta thua rồi."`,
  'nghịch ngợm': `đặt hôn thư xuống, không còn vẻ tinh nghịch ngày nào: "Hết trò chơi rồi, Diệp gia."`,
};
const BREAK_FALLBACK = [
  `đặt hôn thư lên bàn: "Diệp gia và thánh địa không nợ nhau gì nữa. Ngươi đi đường của ngươi."`,
  `đặt hôn thư lên bàn, không nhìn ngươi: "Trưởng lão đã quyết. Ta chỉ tới trả lại thứ này."`,
  `đặt hôn thư lên bàn: "Mười năm, ngươi không cho ta một lý do nào để giữ."`,
  `đặt hôn thư lên bàn, giọng khô khốc: "Từ nay, ngươi với ta không còn gì ràng buộc."`,
];
const traitKeys = (n: NPC) => (n.bio?.traits || n.trait || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
/** Chọn câu theo tính cách, không trùng với người trước trong cùng cảnh. */
function lineFor<T>(n: NPC, byTrait: Record<string, T>, fallback: T[], used: Set<T>): T {
  for (const k of traitKeys(n)) { const v = byTrait[k]; if (v && !used.has(v)) { used.add(v); return v; } }
  const rest = fallback.filter((v) => !used.has(v));
  const v = rest.length ? rest[Math.floor(Math.random() * rest.length)] : fallback[0];
  used.add(v);
  return v;
}

/** Thánh nữ thuộc chính tông môn `sc` (không tính người chỉ mang danh tông khác). */
const inSect = (n: NPC, sc: { id: string; n: string } | null) => !!sc && n.sect === sc.id && from(n).endsWith(sc.n);
const traitList = (bs: NPC[]) => bs.map((n) => `- ${n.name}: tính cách ${n.bio?.traits || n.trait}${n.bio?.hobby ? `; sở thích ${n.bio.hobby}` : ''}`).join('\n');

/** Thông tin nơi vừa gia nhập, theo khóa 'sect:<id>' | 'court:<id>'. */
function joinOf(key: string): { j: Join; sect: (typeof SECTS)[string] | null } | null {
  const [kind, id] = key.split(':');
  if (kind === 'sect' && SECTS[id]) {
    const sc = SECTS[id];
    return { sect: sc, j: { n: sc.n, did: `bái nhập ${sc.n}`, girls: 'sư tỷ sư muội', robe: `một bộ đạo bào màu áo ${sc.n}` } };
  }
  if (kind === 'court' && EMPIRES[id]) {
    const e = EMPIRES[id];
    const rank = COURT_RANKS[(s.flags.court?.id === id ? s.flags.court.rank : 0) as number] || COURT_RANKS[0];
    return { sect: null, j: { n: e.n, did: `được ${e.n} phong làm ${rank}`, girls: 'tiểu thư quyền quý', robe: 'một bộ trường bào thêu vân mây để mặc lúc vào triều' } };
  }
  return null;
}
export const needCongratsScene = () => isDiepHD() && !!s.flags.dhCongrats && !s.flags.childhood && !s.flags.dhDecided && brides().length > 0;
/** Vừa gia nhập tông môn / đại hoàng triều trước mốc mười sáu tuổi: mỗi vị hôn thê gửi một bức thư chúc mừng;
 *  thánh nữ cùng tông thì không viết thư mà tới gặp tận mặt. Chưa bàn chuyện giữ hay bỏ hôn ước. */
export function congratsScene(): Scene | null {
  const key = String(s.flags.dhCongrats);
  s.flags.dhCongrats = null;
  const at = joinOf(key);
  const withMe = new Set(activeAllies().map((n) => n.id)); // đồng hành vào thế lực cùng ngươi: không tự chúc mừng
  const bs = brides().filter((n) => !withMe.has(n.id));
  if (!at || !bs.length) return null;
  const { j, sect } = at;
  const same = (n: NPC) => inSect(n, sect);
  bs.sort((a, b) => Number(same(b)) - Number(same(a)));
  const usedC = new Set<(n: NPC, j: Join) => string>();
  const usedM = new Set<(n: NPC, sc: string) => string>();
  const parts = bs.map((n) => {
    relChange(n, same(n) ? 6 : 3);
    return same(n)
      ? `${n.name} (${from(n)}) không viết thư mà ${lineFor(n, MEET_LINE, MEET_FALLBACK, usedM)(n, sect!.n)}`
      : `${n.name} (${from(n)}) ${lineFor(n, CONGRATS_LETTER, CONGRATS_FALLBACK, usedC)(n, j)}`;
  });
  mark(`Các vị hôn thê chúc mừng ngươi ${j.did}`);
  const meet = bs.filter(same);
  const aiContext = `Hãy viết lời kể và lời thoại mới cho cảnh các vị hôn thê chúc mừng ngươi ${j.did}, dựa trên tính cách riêng của từng người. Không dùng nguyên văn lời thoại trong bản gốc. Đây là thư CHÚC MỪNG: chưa bàn chuyện giữ hay bỏ hôn ước (năm mười sáu tuổi mới định đoạt), không an ủi, không nhắc chuyện sống khổ ở vực ngoài.${meet.length ? ` ${meet.map((n) => n.name).join(', ')} cùng tông môn với ngươi nên KHÔNG viết thư: tới gặp mặt trực tiếp để chúc mừng — cũng không nhắc tới hôn ước, không gọi ngươi là hôn phu.` : ''} Có chính xác ${bs.length} người: ${bs.map(shortN).join(', ')}.\n${traitList(bs)}`;
  return {
    title: `Thư chúc mừng · ${j.n}`,
    text: `Tin ngươi ${j.did} truyền tới các thánh địa. Chẳng bao lâu sau, thư của các vị hôn thê lần lượt tới tay ngươi.\n\n${parts.join('\n\n')}`,
    kind: 'event', aiContext, aiCast: true,
  };
}

/** Năm 16 tuổi: các hôn ước được quyết. Mỗi thánh nữ gửi thư bàn chuyện hôn ước (cùng tông thì gặp mặt),
 *  tự định đoạt theo quá trình phát triển của ngươi. */
export function engageScene(): Scene {
  reviveBrides(); // bản lưu cũ: hôn thê chết vì tai nạn ngẫu nhiên thì sống lại trước khi định đoạt
  const bs = brides();
  s.flags.dhDecided = true;
  s.flags.dhCongrats = null; // thư chúc mừng chưa kịp hiện thì bỏ — giờ đã tới lúc bàn hôn ước
  const score = (n: NPC) => n.rel + effRi() * 12 + s.st * 3 + Math.min(30, s.fame / 10) + (s.flags.thapKnown ? 25 : 0) + (ch(0.5) ? 5 : 0) + (has('dinhvan') ? 15 : 0); // Đào hoa: dễ giữ hôn ước
  const usedKeep = new Set<(n: NPC) => string>();
  // đang ở thánh địa: không còn lý do từ hôn — mọi hôn ước đều giữ
  const holy = s.sect && SECTS[s.sect.id]?.tier === 4 ? SECTS[s.sect.id] : null;
  const usedBreak = new Set<string>();
  const usedMeet = new Set<(n: NPC, sc: string) => string>();
  // thánh nữ của chính tông môn ngươi đang ở (bất kỳ tông nào): gặp mặt trực tiếp, luôn giữ hôn ước; đưa lên đầu cảnh
  const mySect = s.sect ? SECTS[s.sect.id] : null;
  const sameSect = (n: NPC) => inSect(n, mySect);
  bs.sort((a, b) => Number(sameSect(b)) - Number(sameSect(a)));
  const step = (i: number, acc: string): Outcome => {
    if (i >= bs.length) {
      const kept = brides().filter((n) => (s.flags.dhKept as string[] | undefined)?.includes(n.id));
      mark(kept.length ? `Mười sáu tuổi: ${kept.length} hôn ước được giữ` : 'Mười sáu tuổi: bị từ hôn toàn bộ');
      return acc + (kept.length ? `\n\nCuối cùng, còn ${kept.length} hôn ước: ${kept.map((n) => n.name).join(', ')}.` + spawnSuitors() : '\n\nTất cả hôn ước đều đã bị hủy. Con đường phía trước, ngươi tự đi.');
    }
    const n = bs[i];
    if (sameSect(n)) {
      relChange(n, 18);
      s.flags.dhKept = [...((s.flags.dhKept as string[]) || []), n.id];
      return step(i + 1, acc + `\n\n${n.name} (${from(n)}) không viết thư mà ${lineFor(n, MEET16_LINE, MEET16_FALLBACK, usedMeet)(n, mySect!.n)}`);
    }
    if (holy || score(n) >= 85) {
      relChange(n, holy ? 15 : 10);
      s.flags.dhKept = [...((s.flags.dhKept as string[]) || []), n.id];
      return step(i + 1, acc + `\n\n${n.name} (${from(n)}) ${lineFor(n, KEEP_LETTER, KEEP_FALLBACK, usedKeep)(n)}`);
    }
    return {
      text: acc + `\n\n${n.name} (${from(n)}) đích thân tới, ${lineFor(n, BREAK_LINE, BREAK_FALLBACK, usedBreak)}`,
      choices: [
        { t: 'Bình thản nhận lại hôn thư', fn: () => { n.rel = Math.min(n.rel, 10); n.how = `${from(n)} — từng có hôn ước, đã từ hôn`; return step(i + 1, `Ngươi nhận hôn thư, cúi đầu chào. Nàng khựng lại một chút rồi mới quay đi.${statUp('tam', 1)}`); } },
        { t: '"Ba mươi năm Hà Đông, ba mươi năm Hà Tây — chớ khinh thiếu niên nghèo!"', cls: 'prime', fn: () => { n.rel = Math.min(n.rel, -20); n.tag = 'rival'; n.how = `${from(n)} — đã từ hôn ngươi năm mười sáu tuổi`; s.flags.dhVow = true; fame(30); return step(i + 1, `Cả sảnh lặng ngắt. Nàng nhìn ngươi, lần đầu tiên không biết nói gì.${statUp('tam', 2)}`); } },
        { t: 'Tự tay xé hôn thư trước mặt nàng', cls: 'danger', fn: () => { n.rel = Math.min(n.rel, -50); n.tag = 'enemy'; n.how = `${from(n)} — bị ngươi xé hôn thư trước mặt`; return step(i + 1, `Giấy vụn bay đầy sảnh. Nàng tái mặt, quay người bỏ đi.${statUp('mi', 1)}`); } },
      ],
    };
  };
  const settled = !!(s.sect || s.flags.court); // đã có chỗ đứng (tông môn / triều đình): không còn sống ở vực ngoài
  const out = step(0, `Mười sáu tuổi. Theo ước định, đây là năm các hôn ước được định đoạt. Các vị hôn thê lần lượt gửi thư bàn chuyện hôn ước.${holy ? ` Tin ngươi bái nhập ${holy.n} đã truyền khắp các thánh địa — không vị hôn thê nào còn lý do từ hôn.` : ''}`);
  const aiContext = `Hãy viết lời kể và lời thoại mới cho cảnh định đoạt hôn ước năm mười sáu tuổi, dựa trên tính cách riêng của từng người. Không dùng nguyên văn lời thoại trong bản gốc. Thư giữ hôn ước là thư BÀN VỀ HÔN ƯỚC, không phải thư chúc mừng.${holy ? ` Ngươi đang ở ${holy.n} (thánh địa): mọi bức thư đều giữ hôn ước — tuyệt đối không an ủi, không nhắc chuyện ngươi bị coi là phế vật.` : ''}${settled ? ' Ngươi đã có chỗ đứng, không còn sống khổ ở vực ngoài — đừng nhắc chuyện ấy.' : ''}${bs.some(sameSect) ? ` ${bs.filter(sameSect).map((n) => n.name).join(', ')} cùng tông môn với ngươi nên KHÔNG viết thư: tìm gặp ngươi trực tiếp để bàn chuyện hôn ước, và giữ hôn ước.` : ''}\n${traitList(bs)}`;
  return typeof out === 'string'
    ? { title: 'Hôn ước năm mười sáu tuổi', text: out, kind: 'event', aiContext, aiCast: true }
    : { title: 'Hôn ước năm mười sáu tuổi', text: out.text, choices: out.choices, kind: 'event', aiContext, aiCast: true };
}
export const needEngageScene = () => isDiepHD() && !s.flags.childhood && !s.flags.dhDecided && age() >= 16 && brides().length > 0;
