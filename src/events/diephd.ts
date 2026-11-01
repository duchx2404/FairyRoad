// Xuất thân "Huyết mạch Diệp gia Hỗn Độn": tuổi thơ 1–6 (không tu luyện, chơi cùng các thánh nữ có hôn ước),
// 6 tuổi thức tỉnh linh căn (bị coi là phế → giáng làm đệ tử ngoại môn, ra vực ngoài lo gia nghiệp),
// 10 tuổi: các hôn ước được quyết — giữ hay từ hôn tùy vào quá trình phát triển của nhân vật.
import { s, ch, years, statUp, fame, tamma, relChange, mark, addLog, findNpc, setLoc, effRi, LOCS, REALMS, type NPC, type Outcome } from '../engine/api';
import { age, has } from '../engine/char';
import { REGIONS, VUC, SECTS, type Vuc } from '../data/world';
import type { Scene } from '../engine/actions';
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
    `Gia thế: ${from(n)}${b.family ? ' — ' + b.family : ''}`,
    `Cảnh giới: ${n.r ? REALMS[n.r].n : 'chưa tu luyện'}`,
    `Ngoại hình (18 tuổi): ${b.look}`,
    `Tính cách: ${b.traits ?? n.trait}`,
    ...(b.hobby ? [`Sở thích: ${b.hobby}`] : []),
    `Linh căn: ${b.root}`,
    `Thể chất: ${b.body}${b.bodyD ? ` (${b.bodyD.replace(/\.$/, '')})` : ''}`,
    `Thiên phú: ${b.perk}${b.perkD ? ` (${b.perkD.replace(/\.$/, '')})` : ''}, Khuynh quốc khuynh thành (dung mạo tuyệt thế, ai gặp cũng sinh thiện cảm; người khác giới khó lòng xuống tay với nàng)`,
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
  'lương thiện': () => `gửi thư kèm một túi đan dược hộ thân: "Nghe nói vực ngoài khổ lắm, ngươi giữ gìn sức khỏe. Chuyện hôn ước ngươi đừng lo, ta đã thưa với sư tôn rồi."`,
  'lạnh lùng': () => `chỉ gửi một tấm thiệp trắng, vỏn vẹn bốn chữ: "Ước cũ không đổi." Không ký tên — nhưng nét chữ ấy ngươi nhận ra.`,
  'kiêu ngạo': () => `gửi thư, chữ to và sắc: "Thiên hạ bảo ngươi là phế vật. Ta đã chọn ai, kẻ đó không thể là phế vật. Đừng làm ta mất mặt."`,
  'ôn nhu': () => `gửi thư thơm mùi mực mới, chữ nắn nót: "Mười năm trước người ta định cho chúng ta. Mười năm sau là ta tự định. Ngươi cứ đi đường của ngươi, ta ở đây."`,
  'nghịch ngợm': () => `gửi một bức vẽ nguệch ngoạc hai đứa trẻ ngoắc tay, bên dưới ghi: "Nuốt lời là chó con. Ta không nuốt. Còn ngươi?"`,
  'tự phụ': () => `gửi thư: "Ta không cần một hôn phu mạnh. Ta chỉ cần người ta đã chọn. Hôn ước giữ nguyên — đó là quyết định của ta, không ai được bàn."`,
  'đa nghi': () => `gửi thư viết rồi gạch, gạch rồi viết, cuối cùng chỉ còn một câu đọc được: "Người ta nói đủ điều về ngươi. Ta không tin ai cả, ta tự xem. Hôn ước cứ để đó."`,
  'thẳng thắn': () => `gửi thư ngắn gọn: "Sư môn ép ta từ hôn. Ta nói không. Hết chuyện. Khi nào rảnh thì viết thư."`,
  'hay ghen': () => `gửi thư, nét chữ hơi gắt: "Nghe nói ở vực ngoài có cô nương hay qua lại phủ ngươi? Hôn ước ta vẫn giữ. Ngươi tự hiểu phải giữ cái gì."`,
  'trầm tĩnh': () => `gửi thư chỉ chép lại một câu trong sách ngày bé hai người cùng học: "Lời đã hứa, trọng hơn núi." Dưới ký tên nàng.`,
  'bướng bỉnh': () => `gửi thư: "Cả thánh địa khuyên ta bỏ. Càng khuyên ta càng không bỏ. Ngươi mà dám bỏ trước thì ta tìm tới tận nơi."`,
  'tinh quái': () => `gửi thư niêm bằng phù chú, mở ra chỉ thấy tờ giấy trắng. Hơ lên lửa mới hiện chữ: "Đoán xem ta có từ hôn không? Không đâu. Lừa được ngươi rồi."`,
  'hiền thục': () => `gửi kèm một chiếc áo ấm nàng tự may, đường kim còn vụng: "Vực ngoài gió lạnh. Hôn ước vẫn như xưa, ngươi đừng nghĩ nhiều."`,
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
/** Thư chúc mừng khi ngươi đã bái vào thánh địa: mừng cho ngươi và nhắc lại vẫn giữ hôn ước. `sc` = tên thánh địa ngươi vào. */
const CONGRATS_LETTER: Record<string, (n: NPC, sc: string) => string> = {
  'hoạt bát': (_n, sc) => `gửi thư dày ba tờ, chữ nhảy nhót khắp trang: "Chúc mừng, chúc mừng! Ngươi vào ${sc} thật rồi! Ta reo to tới mức sư tỷ phải bịt miệng ta. Hôn ước ấy, ta vẫn nhớ từng chữ đấy nhé!"`,
  'lương thiện': (_n, sc) => `gửi thư kèm một túi đan dược hộ thân: "Chúc mừng ngươi bái nhập ${sc}. Mới vào sơn môn, đừng cố quá sức. Hôn ước giữa hai ta, ta vẫn giữ trong lòng."`,
  'lạnh lùng': (_n, sc) => `chỉ gửi một tấm thiệp trắng, vỏn vẹn mấy chữ: "Chúc mừng. ${sc} — xứng với ngươi. Ước cũ không đổi." Không ký tên, nhưng nét chữ ấy ngươi nhận ra.`,
  'kiêu ngạo': (_n, sc) => `gửi thư, chữ to và sắc: "Ta đã nói rồi, người ta chọn không thể là phế vật. ${sc} nhận ngươi, cả thiên hạ phải câm miệng. Chúc mừng. Hôn ước giữ nguyên — đừng làm ta mất mặt."`,
  'ôn nhu': (_n, sc) => `gửi thư thơm mùi mực mới, chữ nắn nót: "Nghe tin ngươi vào ${sc}, ta mừng suốt mấy đêm không ngủ. Mười năm trước người ta định cho chúng ta; hôm nay ta vẫn tự nguyện giữ lời ấy."`,
  'nghịch ngợm': (_n, sc) => `gửi một bức vẽ nguệch ngoạc: một đứa trẻ đội mũ đệ tử ${sc} đứng cạnh một đứa trẻ khác đang vỗ tay. Bên dưới ghi: "Chúc mừng nhé! Còn ngoắc tay năm xưa, ta vẫn chưa buông đâu."`,
  'tự phụ': (_n, sc) => `gửi thư: "${sc} cũng biết nhìn người — giống ta. Chúc mừng. Hôn ước giữ nguyên, đó là quyết định của ta từ lâu rồi."`,
  'đa nghi': (_n, sc) => `gửi thư viết rồi gạch, gạch rồi viết, cuối cùng còn đọc được: "Ta cho người dò hỏi ba lần mới dám tin ngươi thật sự vào ${sc}. Chúc mừng. Hôn ước cứ để đó, ta không quên."`,
  'thẳng thắn': (_n, sc) => `gửi thư ngắn gọn: "Chúc mừng ngươi vào ${sc}. Hôn ước vẫn còn. Hết chuyện. Khi nào rảnh thì viết thư."`,
  'hay ghen': (_n, sc) => `gửi thư, nét chữ vui mà hơi gắt: "Chúc mừng ngươi vào ${sc}! Nghe nói ở đó sư tỷ sư muội đông lắm. Hôn ước ta vẫn giữ — ngươi tự hiểu phải giữ cái gì."`,
  'trầm tĩnh': (_n, sc) => `gửi thư chép một câu trong sách ngày bé hai người cùng học: "Lời đã hứa, trọng hơn núi." Bên dưới thêm một dòng: "Mừng ngươi bái nhập ${sc}."`,
  'bướng bỉnh': (_n, sc) => `gửi thư: "Ai từng bảo ta bỏ ngươi, giờ hãy nhìn xem — ${sc} nhận ngươi rồi đấy! Chúc mừng. Hôn ước ta giữ, ai nói gì cũng mặc."`,
  'tinh quái': (_n, sc) => `gửi thư niêm bằng phù chú; hơ lên lửa mới hiện chữ: "Chúc mừng đệ tử ${sc}! Đoán xem ta có quên hôn ước không? Không đâu."`,
  'hiền thục': (_n, sc) => `gửi kèm một bộ đạo bào nàng tự may theo màu áo ${sc}, đường kim còn vụng: "Mừng ngươi nhập môn. Hôn ước vẫn như xưa."`,
  'nóng nảy': (_n, sc) => `gửi thư, nét chữ hằn sâu: "Ha! ${sc}! Kẻ nào còn dám gọi ngươi là phế vật, ta đánh kẻ đó. Chúc mừng! Hôn ước giữ chắc, ngươi liệu mà tu cho tử tế!"`,
  'lắm mưu': (_n, sc) => `gửi thư: "Chúc mừng ngươi vào ${sc}. Sư tôn ta nghe tin còn khen ta giữ hôn ước là có mắt nhìn người. Lý do thật thì ngươi biết rồi đấy."`,
  'ích kỷ': (_n, sc) => `gửi thư: "Người của ta vào ${sc}, ta mừng. Thứ gì là của ta thì mãi là của ta — hôn ước cũng vậy."`,
  'chung tình': (_n, sc) => `gửi thư chỉ hai dòng, giấy nhòe mấy chỗ: "Mừng ngươi vào ${sc}. Từ đêm sao băng năm ấy, ta chưa từng nghĩ tới ai khác."`,
};
const CONGRATS_FALLBACK: ((n: NPC, sc: string) => string)[] = [
  (_n, sc) => `gửi thư tới, nét chữ vẫn như năm nào nàng cầm tay ngươi sửa: "Chúc mừng ngươi bái nhập ${sc}. Hôn ước vẫn còn, ta vẫn nhớ."`,
  (_n, sc) => `nhờ hạc giấy mang tới một phong thư: "Tin ngươi vào ${sc} truyền khắp các thánh địa. Chúc mừng. Lời hứa năm xưa, ta chưa quên."`,
  (_n, sc) => `gửi tới nửa tấm ngọc bội định thân năm xưa kèm một dòng: "Mừng ngươi vào ${sc}. Nửa kia ngươi giữ — ước cũ không đổi."`,
  (n, sc) => `gửi thư kể chuyện ${(n.bio?.hobby || 'luyện công').split(', ')[0].toLowerCase()} trên núi dài hai trang, cuối thư viết: "Chúc mừng ngươi vào ${sc}. Hôn ước ấy, ta vẫn giữ."`,
  (_n, sc) => `gửi thư viết bằng chính nét chữ của nàng: "Ngươi vào ${sc} rồi, ta mừng lắm. Lời hứa ở Tổ Địa, ta vẫn nhớ."`,
];
/** Thánh nữ của chính tông môn ngươi vừa bái vào: không viết thư mà gặp mặt trước đông đảo đồng môn, công khai giữ hôn ước. */
const MEET_LINE: Record<string, (n: NPC, sc: string) => string> = {
  'hoạt bát': (_n, sc) => `chạy thẳng xuống quảng trường ${sc} giữa lúc đệ tử đang tụ tập, kéo tay ngươi lên bậc đá, nói to cho cả sơn môn nghe: "Đây là vị hôn phu của ta! Từ nay ai bắt nạt hắn là bắt nạt ta đấy!"`,
  'lương thiện': (_n, sc) => `tới tận nơi ở của tân đệ tử, trước mặt các trưởng lão và đồng môn trao cho ngươi một túi đan dược hộ thân: "Chúc mừng ngươi nhập môn ${sc}. Hôn ước giữa hai ta, ta vẫn giữ — hôm nay nói trước mặt mọi người, để ai cũng biết."`,
  'lạnh lùng': (_n, sc) => `bước vào giảng đường ${sc} giữa buổi truyền công, cả gian phòng lặng ngắt. Nàng dừng trước mặt ngươi, nói đúng bốn chữ: "Ước cũ không đổi." Rồi quay đi — nhưng từ hôm đó không ai trong sơn môn dám coi thường ngươi.`,
  'kiêu ngạo': (_n, sc) => `đứng trên bậc cao nhất của đại điện ${sc}, nhìn xuống đám đệ tử đang xì xào về "tân đệ tử nhà họ Diệp": "Người này là vị hôn phu của ta. Kẻ nào còn gọi hắn là phế vật, bước lên đây nói lại một lần."`,
  'ôn nhu': (_n, sc) => `đợi ngươi ở cổng sơn môn ${sc} ngay ngày đầu nhập môn, trước bao ánh mắt tò mò, nhẹ nhàng chỉnh lại vạt áo đệ tử cho ngươi: "Mười năm trước người ta định cho chúng ta. Hôm nay ta tự định — trước mặt mọi người."`,
  'nghịch ngợm': (_n, sc) => `giữa buổi điểm danh tân đệ tử ${sc}, chen thẳng vào hàng, chìa ngón út ra trước mặt ngươi: "Ngoắc tay năm xưa vẫn còn hiệu lực nhé!" Cả hàng đệ tử há hốc miệng.`,
  'tự phụ': (_n, sc) => `tới trước toàn thể đệ tử ${sc}, tuyên bố như đọc môn quy: "Hôn ước của ta giữ nguyên. Đó là quyết định của ta, không ai được bàn."`,
  'đa nghi': (_n, sc) => `tới nhìn ngươi khảo hạch nhập môn ${sc} từ đầu tới cuối, rồi mới bước ra trước mọi người: "Ta tự xem rồi. Hôn ước cứ để đó."`,
  'thẳng thắn': (_n, sc) => `bước tới giữa quảng trường ${sc}, nói to rõ từng chữ trước mặt đồng môn: "Chúc mừng ngươi nhập môn. Hôn ước vẫn còn. Hết chuyện."`,
  'hay ghen': (_n, sc) => `xuất hiện đúng lúc mấy sư tỷ ${sc} đang vây quanh hỏi han ngươi, đứng chắn trước mặt ngươi: "Chúc mừng vị hôn phu của ta nhập môn." Chữ "của ta" nói rất rõ.`,
  'trầm tĩnh': (_n, sc) => `tới trước đại điện ${sc}, trước mặt các trưởng lão chắp tay nói: "Lời đã hứa, trọng hơn núi. Hôn ước với Diệp gia, đệ tử vẫn giữ."`,
  'bướng bỉnh': (_n, sc) => `kéo ngươi tới trước mặt các trưởng lão ${sc} từng khuyên nàng bỏ hôn ước: "Các vị nhìn đi — hắn vào được tông ta rồi. Hôn ước ta giữ, ai nói gì cũng mặc."`,
  'tinh quái': (_n, sc) => `bày một trò ảo thuật giữa sân ${sc}: hoa lửa nổ thành hai chữ "Hôn ước", rồi cười trước bao ánh mắt sững sờ: "Đoán xem ta có quên không? Không đâu."`,
  'hiền thục': (_n, sc) => `tới tận nơi ở của tân đệ tử ${sc}, trước mặt đồng môn trao cho ngươi bộ đạo bào nàng tự may: "Mừng ngươi nhập môn. Hôn ước vẫn như xưa."`,
  'nóng nảy': (_n, sc) => `xông vào giữa đám đệ tử ${sc} đang bàn tán về ngươi, đập tay lên bàn: "Hôn ước của ta, ta giữ! Kẻ nào còn dám nói nửa câu, ra võ đài với ta!"`,
  'lắm mưu': (_n, sc) => `chọn đúng lúc tông chủ ${sc} đang tiếp kiến tân đệ tử, bước ra thi lễ: "Hôn ước với Diệp gia là có lợi cho tông môn, đệ tử xin giữ." Rồi quay sang nháy mắt với ngươi.`,
  'ích kỷ': (_n, sc) => `tới trước mặt đồng môn ${sc}, nắm lấy tay áo ngươi: "Người này là của ta. Hôn ước cũng vậy. Ai muốn tranh thì cứ thử."`,
  'chung tình': (_n, sc) => `đứng đợi ngươi ở bậc đá ${sc} từ sáng tới chiều, trước bao ánh mắt. Khi thấy ngươi, nàng chỉ nói: "Từ đêm sao băng năm ấy, ta chưa từng nghĩ tới ai khác."`,
};
const MEET_FALLBACK: ((n: NPC, sc: string) => string)[] = [
  (_n, sc) => `tới gặp ngươi giữa quảng trường ${sc}, trước đông đảo đồng môn: "Chúc mừng ngươi nhập môn. Hôn ước vẫn còn — ta nói ở đây để ai cũng nghe."`,
  (_n, sc) => `đích thân tới nơi ở của tân đệ tử ${sc}, trước mặt các trưởng lão lấy ra nửa tấm ngọc bội định thân năm xưa: "Nửa kia ngươi giữ. Ước cũ không đổi."`,
  (_n, sc) => `bước vào đại điện ${sc} giữa buổi bái sư, nắm tay ngươi trước mặt mọi người: "Lời hứa ở Tổ Địa, ta vẫn nhớ."`,
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
  'đa nghi': `đặt hôn thư xuống, nhìn quanh phủ một lượt: "Ta chờ ba năm xem ngươi có gì khác. Không có. Vậy thôi."`,
  'hay ghen': `đặt hôn thư xuống, giọng chua chát: "Nghe nói ngươi ở đây sống cũng vui vẻ lắm. Vậy khỏi cần ta nữa."`,
  'trầm tĩnh': `đặt hôn thư xuống, im lặng rất lâu rồi mới nói: "Đây là ý của thánh địa. Cũng là ý của ta."`,
  'bướng bỉnh': `ném hôn thư lên bàn: "Ta không muốn tới. Nhưng ta tới rồi. Đừng hỏi gì thêm."`,
  'tinh quái': `đặt hôn thư xuống, cười mà không có ý cười: "Không có trò đùa nào lần này đâu. Thật đấy."`,
  'hiền thục': `đặt hôn thư xuống, cúi đầu thật thấp: "Tội bất hiếu, ta không gánh nổi. Mong ngươi hiểu."`,
  'nóng nảy': `đập hôn thư xuống bàn: "Mười năm! Ngươi có mười năm mà vẫn thế này! Ta hết kiên nhẫn rồi."`,
  'lắm mưu': `đặt hôn thư xuống, giọng đều đều: "Thánh địa cần một hôn ước có ích. Hôn ước này hiện không có ích. Chỉ vậy thôi."`,
  'ích kỷ': `đặt hôn thư xuống: "Ta không thể gánh cả đời một người kéo ta xuống."`,
  'chung tình': `đặt hôn thư xuống, tay run: "Ta đã cố giữ ba năm. Ta thua rồi."`,
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

/** Năm 10 tuổi: các hôn ước được quyết. Mỗi thánh nữ tự định đoạt theo quá trình phát triển của ngươi. */
export function tenScene(): Scene {
  const bs = brides();
  s.flags.dhDecided = true;
  const score = (n: NPC) => n.rel + effRi() * 12 + s.st * 3 + Math.min(30, s.fame / 10) + (s.flags.thapKnown ? 25 : 0) + (ch(0.5) ? 5 : 0) + (has('dinhvan') ? 15 : 0); // Đào hoa: dễ giữ hôn ước
  const usedKeep = new Set<(n: NPC) => string>();
  const usedCongrats = new Set<(n: NPC, sc: string) => string>();
  // đã bái vào thánh địa: không còn lý do từ hôn — các vị hôn thê gửi thư chúc mừng
  const holy = s.sect && SECTS[s.sect.id]?.tier === 4 ? SECTS[s.sect.id] : null;
  const usedBreak = new Set<string>();
  const usedMeet = new Set<(n: NPC, sc: string) => string>();
  // thánh nữ của chính tông môn ngươi vừa bái vào (bất kỳ tông nào): gặp mặt công khai, luôn giữ hôn ước; đưa lên đầu cảnh
  const mySect = s.sect ? SECTS[s.sect.id] : null;
  const sameSect = (n: NPC) => !!mySect && n.sect === mySect.id && from(n).endsWith(mySect.n);
  bs.sort((a, b) => Number(sameSect(b)) - Number(sameSect(a)));
  const step = (i: number, acc: string): Outcome => {
    if (i >= bs.length) {
      const kept = brides().filter((n) => (s.flags.dhKept as string[] | undefined)?.includes(n.id));
      mark(kept.length ? `Mười tuổi: ${kept.length} hôn ước được giữ` : 'Mười tuổi: bị từ hôn toàn bộ');
      return acc + (kept.length ? `\n\nCuối cùng, còn ${kept.length} hôn ước: ${kept.map((n) => n.name).join(', ')}.` + spawnSuitors() : '\n\nTất cả hôn ước đều đã bị hủy. Con đường phía trước, ngươi tự đi.');
    }
    const n = bs[i];
    if (sameSect(n)) {
      relChange(n, 18);
      s.flags.dhKept = [...((s.flags.dhKept as string[]) || []), n.id];
      return step(i + 1, acc + `\n\n${n.name} (${from(n)}) không viết thư mà ${lineFor(n, MEET_LINE, MEET_FALLBACK, usedMeet)(n, mySect!.n)}`);
    }
    if (holy || score(n) >= 85) {
      relChange(n, holy ? 15 : 10);
      s.flags.dhKept = [...((s.flags.dhKept as string[]) || []), n.id];
      const letter = holy ? lineFor(n, CONGRATS_LETTER, CONGRATS_FALLBACK, usedCongrats)(n, holy.n) : lineFor(n, KEEP_LETTER, KEEP_FALLBACK, usedKeep)(n);
      return step(i + 1, acc + `\n\n${n.name} (${from(n)}) ${letter}`);
    }
    return {
      text: acc + `\n\n${n.name} (${from(n)}) đích thân tới, ${lineFor(n, BREAK_LINE, BREAK_FALLBACK, usedBreak)}`,
      choices: [
        { t: 'Bình thản nhận lại hôn thư', fn: () => { n.rel = Math.min(n.rel, 10); n.how = `${from(n)} — từng có hôn ước, đã từ hôn`; return step(i + 1, `Ngươi nhận hôn thư, cúi đầu chào. Nàng khựng lại một chút rồi mới quay đi.${statUp('tam', 1)}`); } },
        { t: '"Ba mươi năm Hà Đông, ba mươi năm Hà Tây — chớ khinh thiếu niên nghèo!"', cls: 'prime', fn: () => { n.rel = Math.min(n.rel, -20); n.tag = 'rival'; n.how = `${from(n)} — đã từ hôn ngươi năm mười tuổi`; s.flags.dhVow = true; fame(30); return step(i + 1, `Cả sảnh lặng ngắt. Nàng nhìn ngươi, lần đầu tiên không biết nói gì.${statUp('tam', 2)}`); } },
        { t: 'Tự tay xé hôn thư trước mặt nàng', cls: 'danger', fn: () => { n.rel = Math.min(n.rel, -50); n.tag = 'enemy'; n.how = `${from(n)} — bị ngươi xé hôn thư trước mặt`; return step(i + 1, `Giấy vụn bay đầy sảnh. Nàng tái mặt, quay người bỏ đi.${statUp('mi', 1)}`); } },
      ],
    };
  };
  const out = step(0, `Mười tuổi. Theo ước định, đây là năm các hôn ước được định đoạt.${holy ? ` Tin ngươi bái nhập ${holy.n} đã truyền khắp các thánh địa — không vị hôn thê nào còn lý do từ hôn.` : ''}`);
  const aiContext = `Hãy viết lời kể và lời thoại mới cho cảnh định đoạt hôn ước, dựa trên tính cách riêng của từng người. Không dùng nguyên văn lời thoại trong bản gốc.${holy ? ` Ngươi đã bái nhập ${holy.n} (thánh địa): mọi bức thư là thư CHÚC MỪNG ngươi nhập môn và nhắc lại vẫn giữ hôn ước — tuyệt đối không an ủi, không nhắc chuyện ngươi bị coi là phế vật hay sống khổ ở vực ngoài.` : ''}${bs.some(sameSect) ? ` ${bs.filter(sameSect).map((n) => n.name).join(', ')} cùng tông môn với ngươi nên KHÔNG viết thư: gặp mặt trực tiếp trước đông đảo đồng môn, công khai giữ hôn ước.` : ''}\n${bs.map((n) => `- ${n.name}: tính cách ${n.bio?.traits || n.trait}${n.bio?.hobby ? `; sở thích ${n.bio.hobby}` : ''}`).join('\n')}`;
  return typeof out === 'string'
    ? { title: 'Hôn ước năm mười tuổi', text: out, kind: 'event', aiContext, aiCast: true }
    : { title: 'Hôn ước năm mười tuổi', text: out.text, choices: out.choices, kind: 'event', aiContext, aiCast: true };
}
export const needTenScene = () => isDiepHD() && !s.flags.childhood && !s.flags.dhDecided && age() >= 10 && brides().length > 0;
