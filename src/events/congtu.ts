// Công tử bột đời thứ hai, thứ ba: con quan, con nhà giàu, con cháu trưởng lão / thế gia — cậy thế quấy nhiễu ngươi và dân chúng.
// Với Thiên Đố Chi Thể, người ngoài chỉ thấy "Luyện Khí" nên càng coi ngươi như kiến cỏ.
import { RMAX,
  register, s, ch, ri, pick, M, money, hurt, tamma, statUp, fame, good, evil, gain, giveGear, contrib, battle, cultivator, mortal,
  meet, relChange, mark, here, he, npcTitle, findNpc, effRi, seenRealm, realmN, SECTS, type NPC, type Outcome,
} from '../engine/api';
import { CLANS } from '../data/core';

const thienDo = () => s.body === 'thiendo' && s.r === 1;
const hidden = () => (thienDo() ? `Trong mắt hắn, ngươi chỉ là một tên ${seenRealm()} quèn.` : '');
const npcOf = (k: string): NPC | undefined => findNpc(s.flags[k] as string);
/** Đánh với chính NPC đó (giữ đúng cảnh giới, tiểu cảnh, hệ). */
const vs = (n: NPC, mult = 1) => ({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator' as const, mult });

/** Tạo một công tử bột: con quan / nhà giàu / thế gia / trưởng lão. */
function congTu(kind: 'quan' | 'phu' | 'the' | 'tien', dr: number): NPC {
  const c = pick(Object.values(CLANS));
  const n = meet({ dr, g: 'm', tag: 'acq', rel: -20, age: ri(17, 26), talent: 0.9, how: '' });
  const given = n.name.split(' ').slice(-1)[0];
  n.name = kind === 'the' ? `${c.sur} ${given}` : `${pick(['Triệu', 'Tiền', 'Vương', 'Lưu', 'Hồ', 'Kim', 'Đổng'])} ${given}`;
  n.how = kind === 'quan' ? `Con trai quan tri phủ ${here().n}, cậy thế cha hoành hành`
    : kind === 'phu' ? `Thiếu gia nhà giàu nhất ${here().n}, tiền nhiều hơn não`
    : kind === 'the' ? `Đích tôn ${c.n}, đời thứ ba của thế gia`
    : `Con trai một vị trưởng lão${s.sect ? ' ' + SECTS[s.sect.id].n : ''}, sau lưng có hộ đạo nhân`;
  s.flags._ctId = n.id;
  s.flags._ctKind = kind;
  return n;
}
/** Hắn ghi thù — về sau có thể kéo người tới báo thù. */
function grudge(n: NPC) {
  n.tag = 'enemy';
  n.rel = Math.min(n.rel, -60);
  s.flags.ctGrudge = n.id;
  s.flags.ctGrudgeY = s.year;
}

register([
  // ===================== Phóng ngựa giữa phố =====================
  {
    id: 'ct_phongngua',
    where: ['town', 'village'],
    w: 4,
    cd: 10,
    title: 'Công tử phóng ngựa',
    text: () => {
      const n = congTu(ch(0.5) ? 'quan' : 'phu', -1);
      return `Tiếng vó ngựa dồn dập. ${npcTitle(n)} — ${n.how.toLowerCase()} — phi ngựa giữa phố đông, roi quất tứ tung. Sạp rau của một bà lão đổ nhào, bà ngã sóng soài, ngựa chỉ cách đầu bà một gang tay. Hắn ghìm cương, cười ha hả: "Lão già chắn đường bản công tử!"`;
    },
    ch: () => {
      const n = npcOf('_ctId')!;
      return [
        {
          t: 'Kéo cương ngựa của hắn lại', cls: 'prime',
          fn: (): Outcome => ({
            text: `Ngươi chộp lấy dây cương, con ngựa hí dựng lên rồi đứng im. ${n.name} tím mặt: "Ngươi biết cha ta là ai không? Người đâu, đánh!" Bốn tên gia đinh xông tới.`,
            choices: [
              { t: 'Dạy cho cả bọn một bài học', cls: 'danger', fn: () => battle(mortal('Gia đinh cầm gậy', 2.5), { lethal: false,
                win: () => { grudge(n); good(3); fame(20); return `Gia đinh nằm la liệt. ${n.name} lồm cồm bò lên ngựa, chỉ tay vào mặt ngươi: "Ngươi chờ đấy!" Dân phố vỗ tay rào rào.` + statUp('mi', 1); },
              }) },
              { t: 'Bắt hắn xuống ngựa xin lỗi bà lão', fn: () => { grudge(n); good(4); fame(30); relChange(n, -30); return `Ngươi xách cổ hắn xuống như xách gà, ấn đầu cúi ba cái trước bà lão. Cả phố im phăng phắc rồi vỡ òa. Hắn đi khỏi mà ánh mắt như muốn ăn tươi nuốt sống ngươi.` + statUp('tam', 1); } },
            ],
          }),
        },
        { t: 'Đỡ bà lão dậy, đền sạp rau', fn: () => { good(2); relChange(n, 5); return `Ngươi đỡ bà lão, nhặt rau, dúi vào tay bà mấy đồng. ${n.name} đã phóng ngựa đi xa, để lại một vệt bụi.` + money(-Math.max(2, Math.round(M(2)))); } },
        { t: 'Nói khéo với hắn', hint: 'Dựa vào mị lực', fn: () => (s.stats.mi + ri(0, 4) >= 9
          ? `"Công tử phong thái như vậy, cần gì so đo với một bà già?" ${n.name} được nịnh thì khoái chí, ném xuống một thỏi bạc rồi đi. Bà lão có tiền mua sạp mới.` + statUp('mi', 1)
          : `${n.name} nhổ nước bọt: "Ngươi là cái thá gì mà dạy đời bản công tử?" Rồi quất ngựa đi.` + tamma(3)) },
        { t: 'Làm ngơ', fn: () => 'Chuyện của quan phủ. Ngươi quay đi.' + tamma(4) },
      ];
    },
  },

  // ===================== Thu "phí bảo kê" =====================
  {
    id: 'ct_baoke',
    where: ['market', 'town'],
    w: 4,
    cd: 10,
    minR: 1,
    title: 'Tiên nhị đại thu phí',
    text: () => {
      const n = congTu('tien', 0);
      return `Ngươi vừa bày mấy món đồ ra bán, ${npcTitle(n)} dẫn đám tùy tùng tới, đá đổ tấm vải. "Phường thị này do nhà ta che chở. Bày hàng phải nộp phí — ${Math.round(M(12))} linh thạch." ${hidden()} Sau lưng hắn có một lão già áo xám đứng im lặng, khí tức sâu như giếng.`;
    },
    ch: () => {
      const n = npcOf('_ctId')!;
      const fee = Math.round(M(12));
      return [
        { t: `Nộp ${fee} linh thạch`, fn: () => { relChange(n, 10); return `${n.name} tung túi linh thạch lên tay: "Biết điều." Hắn đi sang sạp khác.` + money(-fee) + tamma(5); } },
        { t: 'Từ chối', fn: () => battle(cultivator(`Tùy tùng của ${n.name}`, 0, 0.9), { lethal: false,
          win: () => { grudge(n); fame(15); return `Tùy tùng của hắn bị đánh văng. ${n.name} lùi lại, liếc lão già áo xám — lão chỉ lắc đầu. "Hôm nay tha cho ngươi." Hắn bỏ đi, nhưng chuyện chưa xong.`; },
          lose: () => 'Ngươi bị đánh bầm dập, hàng hóa bị hất tung.' + money(-Math.round(fee / 2)),
        }) },
        { t: 'Đánh thẳng vào tên công tử', cls: 'danger', hint: 'Hộ đạo nhân sẽ ra tay',
          fn: (): Outcome => {
            const r1 = battle(vs(n, 0.8), { lethal: false });
            if (s.hurt >= 80) return r1;
            return {
              text: `${r1}\n\nLão già áo xám bước lên một bước — không khí đặc lại. "Đánh chó còn phải ngó mặt chủ. Tiểu tử, quỳ xuống."`,
              choices: [
                { t: 'Đánh luôn hộ đạo nhân', cls: 'danger', fn: () => battle({ name: 'Hộ đạo nhân áo xám', r: Math.min(RMAX(), effRi() + 1), st: 1, kind: 'boss', mult: 0.9 }, { lethal: false,
                  win: () => { grudge(n); fame(120); mark(`Đánh bại hộ đạo nhân của ${n.name}`); return `Lão già phun máu lùi lại, nhìn ngươi như nhìn quái vật. ${thienDo() ? `"Luyện Khí… sao có thể!"` : ''} ${n.name} mặt cắt không còn giọt máu, bị lão xách cổ chạy mất.` + giveGear(effRi(), 2) + money(M(20)); },
                  lose: () => { grudge(n); return 'Lão già chỉ phất tay áo, ngươi đã văng ra ngoài phường thị.' + hurt(20); },
                }) },
                { t: 'Rút lui', fn: () => { grudge(n); return 'Ngươi thu đồ rời đi. Sau lưng, tiếng cười của đám tùy tùng.' + tamma(6); } },
              ],
            };
          } },
      ];
    },
  },

  // ===================== Cưỡng ép dân nữ =====================
  {
    id: 'ct_cuonghon',
    where: ['town', 'village'],
    w: 3,
    cd: 15,
    title: 'Cưỡng ép dân nữ',
    text: () => {
      const n = congTu(pick(['quan', 'phu', 'the'] as const), -1);
      return `Trước cửa một tiệm hoa nhỏ, ${npcTitle(n)} sai người khiêng kiệu tới, ném lên quầy một rương bạc: "Con gái nhà ông, bản công tử lấy làm thiếp thứ chín." Cô gái bán hoa khóc, ông bố quỳ lạy van xin. Dân phố đứng xem, không ai dám lên tiếng.`;
    },
    ch: () => {
      const n = npcOf('_ctId')!;
      return [
        { t: 'Ra mặt ngăn cản', cls: 'prime', fn: () => battle(cultivator(`Hộ vệ của ${n.name}`, -1, 1.1), { lethal: false,
          win: () => { grudge(n); good(5); fame(40); const g = meet({ r: 0, g: 'f', tag: 'friend', rel: 55, how: 'Cô gái bán hoa ngươi cứu khỏi tay công tử bột' }); return `Kiệu bị đá đổ, hộ vệ chạy tán loạn. ${n.name} vừa chửi vừa chạy. ${g.name} cúi lạy ngươi, nước mắt chưa khô.` + statUp('mi', 1); },
          lose: () => { grudge(n); return 'Ngươi bị đánh gục. Nhưng ồn ào lớn quá, quan phủ đành can, cô gái tạm thời thoát.' + hurt(15); },
        }) },
        { t: 'Lén đưa hai cha con rời thành', fn: () => { good(4); grudge(n); return 'Đêm đó, ngươi đưa hai cha con ra cửa sau, chỉ đường tới một trấn xa. Sáng hôm sau, tiệm hoa trống trơn. Người của công tử lùng khắp nơi.' + money(-Math.round(M(3))) + statUp('tam', 1); } },
        { t: 'Đi báo quan', fn: () => (n.how.includes('quan')
          ? `Quan phủ chính là cha hắn. Ngươi bị đuổi ra khỏi công đường, suýt bị khép tội "vu cáo".` + tamma(8)
          : `Quan phủ ngại thế nhà ${n.name} nhưng cũng sợ dân phố, đành phạt hắn trả lại người. Hắn ghi tên ngươi vào sổ thù.` + (grudge(n), '') + statUp('mi', 1)) },
        { t: 'Không dây vào', fn: () => 'Ngươi quay đi. Sau lưng, tiếng khóc của cô gái bị kiệu khiêng đi.' + tamma(8) },
      ];
    },
  },

  // ===================== Bao trọn tửu lâu =====================
  {
    id: 'ct_tuulau',
    where: ['town', 'market'],
    w: 3,
    cd: 12,
    title: 'Bao trọn tửu lâu',
    text: () => {
      const n = congTu('phu', 0);
      return `Ngươi vừa ngồi xuống tửu lâu thì ${npcTitle(n)} bước vào: "Hôm nay bản công tử bao cả lầu. Tất cả cút!" Tiểu nhị chậm chân bị hắn tát lật mặt. Hắn liếc thấy ngươi vẫn ngồi: "Còn ngươi, điếc à?" ${hidden()}`;
    },
    ch: () => {
      const n = npcOf('_ctId')!;
      return [
        { t: 'Ngồi yên, uống tiếp', cls: 'prime', fn: () => battle(vs(n, 0.85), { lethal: false,
          win: () => { grudge(n); fame(20); return `Chén rượu của ngươi chưa kịp nguội, ${n.name} đã nằm dưới gầm bàn. Ngươi trả tiền cho cả tiểu nhị lẫn chủ quán rồi thong thả bước ra.` + money(-Math.round(M(2))) + statUp('tam', 1); },
          lose: () => 'Ngươi bị ném ra khỏi cửa sổ lầu hai.' + hurt(15),
        }) },
        { t: 'Bỏ ra gấp đôi bao lầu trước hắn', hint: 'Lấy tiền đè tiền', fn: () => (s.money >= M(30)
          ? (grudge(n), fame(10), `Ngươi đặt lên quầy một túi linh thạch: "Lầu này ta bao trước rồi." Chủ quán sáng mắt. ${n.name} tức đến run người mà không làm gì được.` + money(-Math.round(M(30))))
          : 'Túi tiền của ngươi không đủ nặng. Hắn cười phá lên. Ngươi đành rời đi.' + tamma(5)) },
        { t: 'Đứng dậy đi chỗ khác', fn: () => { relChange(n, 5); return 'Ngươi không muốn sinh chuyện. Lúc đi ngang, ngươi lén nhét cho tiểu nhị mấy viên linh thạch.' + money(-1); } },
      ];
    },
  },

  // ===================== Chặn đường "kiến cỏ" (Thiên Đố) =====================
  {
    id: 'ct_kienco',
    where: ['road', 'wild', 'town'],
    w: 5,
    cd: 6,
    minR: 2,
    cond: () => thienDo(),
    title: 'Kiến cỏ cản đường',
    text: () => {
      const n = congTu(pick(['the', 'tien'] as const), 0);
      return `${npcTitle(n)} cưỡi linh thú chặn ngang đường. Thần thức hắn quét qua người ngươi một cái rồi bật cười: "Luyện Khí? Tu đến tuổi này mà vẫn Luyện Khí? Phế vật! Quỳ xuống dập đầu ba cái, bản thiếu gia cho ngươi đi." Đám tùy tùng cười rộ. Hắn không hề biết ngươi đã luyện tới tầng thứ ${s.flags.tang ?? 1} — sức mạnh ngang ${realmN(effRi())}.`;
    },
    ch: () => {
      const n = npcOf('_ctId')!;
      return [
        { t: 'Một chưởng vả mặt', cls: 'prime', hint: 'Hắn khinh địch, hiệp đầu không phòng bị', fn: () => battle(vs(n, 0.9), { lethal: false,
          win: () => { grudge(n); fame(40); mark(`Vả mặt ${n.name}, kẻ coi ngươi là phế vật`); return `${n.name} bay ngược ra sau, mặt sưng vù, mắt trợn trừng: "Không… không thể nào… ngươi là Luyện Khí!" Đám tùy tùng câm như hến.` + money(M(15)) + statUp('tam', 1); },
          lose: () => 'Ngươi đánh hụt, bị đám tùy tùng xúm vào.' + hurt(15),
        }) },
        { t: 'Giả yếu, dụ hắn vào rừng', hint: 'Không ai thấy thì không ai biết', fn: (): Outcome => ({
          text: `Ngươi cúi đầu, run run lùi vào rừng. ${n.name} khoái chí đuổi theo, bỏ lại tùy tùng: "Chạy đi, chạy đi!" Sâu trong rừng, ngươi dừng lại, quay người.`,
          choices: [
            { t: 'Phế tu vi của hắn', cls: 'danger', fn: () => battle(vs(n, 0.9), { lethal: false, win: () => { grudge(n); evil(1); n.r = 0; n.how = `${n.how} — bị ngươi phế tu vi trong rừng`; return `Một chỉ điểm vào đan điền. Linh lực của ${n.name} tán loạn, từ nay chỉ là phàm nhân. Không ai biết là ai làm.` + gain('m:yeudan', 2); } }) },
            { t: 'Cướp sạch rồi thả', fn: () => battle(vs(n, 0.9), { lethal: false, win: () => { grudge(n); return `${n.name} bị lột sạch túi trữ vật, chạy về trong bộ áo lót. Hắn thề sẽ bắt "tên Luyện Khí đó" trả giá.` + money(M(40)) + giveGear(effRi(), 2); } }) },
            { t: 'Dọa một trận cho chừa', fn: () => { relChange(n, -10); return `Ngươi chỉ khẽ thả ra một tia khí tức. ${n.name} quỳ sụp, mồ hôi như tắm, không dám ngẩng đầu. Từ đó hắn không dám bén mảng gần ngươi.` + statUp('mi', 1); } },
          ],
        }) },
        { t: 'Nhẫn nhịn đi đường vòng', fn: () => { relChange(n, -5); return 'Ngươi chẳng buồn chấp. Rồng không cãi nhau với giun.' + statUp('tam', 1) + tamma(-3); } },
      ];
    },
  },

  // ===================== Chiếm linh điền trong tông =====================
  {
    id: 'ct_linhdien',
    where: ['sect'],
    w: 3,
    cd: 15,
    cond: () => !!s.sect && here().sect === s.sect.id,
    title: 'Linh điền bị chiếm',
    text: () => {
      const n = congTu('tien', 0);
      n.sect = s.sect!.id;
      return `Ngươi về tới linh điền được tông phân cho thì thấy hàng rào bị nhổ, cây non bị nhổ trụi. ${npcTitle(n)} đang sai người trồng giống của hắn. "Mảnh đất này linh khí tốt, bản công tử lấy rồi. Ngươi đi tìm chỗ khác." ${hidden()}`;
    },
    ch: () => {
      const n = npcOf('_ctId')!;
      return [
        { t: 'Hẹn lên lôi đài', cls: 'prime', fn: () => battle(vs(n, 0.95), { lethal: false,
          win: () => { grudge(n); fame(30); return `Cả tông kéo tới xem. ${n.name} bị đánh rơi khỏi lôi đài, mặt đỏ như gấc. Linh điền trả lại cho ngươi, kèm bồi thường.` + contrib(30); },
          lose: () => 'Ngươi thua. Linh điền mất, lại còn bị cười.' + hurt(10) + tamma(6),
        }) },
        { t: 'Kiện lên Chấp pháp đường', fn: () => (ch(0.5)
          ? (grudge(n), `Chấp pháp trưởng lão là người công tâm: ${n.name} bị phạt diện bích ba tháng, bồi thường cho ngươi.` + contrib(20))
          : `Chấp pháp trưởng lão nể mặt cha ${n.name}, phán "hai bên tự hòa giải". Ngươi mất đất.` + tamma(8)) },
        { t: 'Nhường', fn: () => { relChange(n, 10); return 'Ngươi dời sang mảnh đất cằn ở góc núi.' + tamma(5); } },
      ];
    },
  },

  // ===================== Báo thù: kéo người tới =====================
  {
    id: 'ct_baothu',
    where: ['road', 'town', 'village', 'market', 'wild'],
    w: 6,
    cd: 8,
    cond: () => !!s.flags.ctGrudge && s.year - (s.flags.ctGrudgeY ?? s.year) >= 0.5 && !!npcOf('ctGrudge')?.alive,
    title: 'Hắn quay lại',
    text: () => {
      const n = npcOf('ctGrudge')!;
      return `${npcTitle(n)} quay lại — lần này không đi một mình. Bên cạnh hắn là một người trung niên mặt lạnh như sắt, khí tức đè nặng cả con đường. "Cha, chính là tên này!" ${thienDo() ? `Người kia nhìn ngươi, nhíu mày: "Một tên Luyện Khí mà làm con ta ra nông nỗi này?"` : ''}`;
    },
    ch: () => {
      const n = npcOf('ctGrudge')!;
      const end = () => { s.flags.ctGrudge = ''; };
      return [
        { t: 'Nghênh chiến', cls: 'danger', fn: () => battle({ name: `Phụ thân của ${n.name}`, r: Math.min(RMAX(), effRi() + 1), st: ri(0, 2), kind: 'boss', mult: 0.85 }, {
          win: () => { end(); fame(150); n.rel = -100; mark(`Đánh bại phụ thân của ${n.name}`); return `Người trung niên ngã quỵ, nhìn ngươi bằng ánh mắt khác hẳn. "Là con ta có mắt không tròng." Hắn kéo ${n.name} quỳ xuống tạ lỗi, dâng lễ chuộc.` + money(M(50)) + giveGear(Math.min(RMAX(), effRi() + 1), 2); },
          lose: () => { end(); return `Ngươi bại. Người trung niên phất tay: "Lần này cho ngươi một bài học." ${n.name} cười đắc ý.` + hurt(30) + money(-Math.round(M(20))); },
        }) },
        { t: 'Xin lỗi, bồi thường', fn: () => { end(); relChange(n, 20); return 'Ngươi chắp tay tạ lỗi, đưa ra một túi linh thạch. Người trung niên nhận, kéo con đi. Mối thù coi như xong — ít nhất ngoài mặt.' + money(-Math.round(M(25))) + tamma(10); } },
        { t: 'Bỏ chạy', fn: () => (ch(0.55 + (s.stats.van - 5) * 0.04)
          ? 'Ngươi độn đi trước khi hắn kịp ra tay. Nhưng mối thù vẫn còn đó.'
          : 'Chạy không thoát. ' + battle({ name: `Phụ thân của ${n.name}`, r: Math.min(RMAX(), effRi() + 1), st: 0, kind: 'boss', mult: 0.85 }, { win: () => { end(); fame(100); return 'Bị dồn vào đường cùng, ngươi lại thắng.' + money(M(30)); }, lose: () => { end(); return 'Ngươi bị đánh trọng thương.' + hurt(30); } })) },
      ];
    },
  },
]);

void good; void he;
