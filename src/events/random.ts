// Sự kiện ngẫu nhiên giữa đường đời: thú triều, đồng môn bắt nạt, đại chiến tông môn, ma tu, người cầu cứu,
// thiên kiêu thánh địa gặp nạn, chính – ma giao tranh, dị bảo xuất thế, thiên tai. Mỗi sự kiện đều để người chơi chọn.
import { RMAX, effRi, seenRealm,
  register, s, ch, ri, pick, M, money, hurt, heal, cult, tamma, statUp, fame, good, evil, gain, giveGear, contrib, battle, beast, cultivator,
  meet, relChange, mark, here, realmN, he, npcTitle, sectName, years, SECTS, REALMS, findNpc, type Outcome, type NPC,
} from '../engine/api';
import { holyNpcName } from '../engine/core';

const atHome = () => !!s.sect && here().sect === s.sect.id;
const holyLands = () => Object.values(SECTS).filter((x) => x.tier === 4);
const npcOf = (k: string): NPC | undefined => findNpc(s.flags[k] as string);
const sw = (r: { win: boolean }, a: string, b: string) => (r.win ? a : b);

register([
  // ===================== Thú triều =====================
  {
    id: 'rd_thutrieu',
    where: ['town', 'village', 'market'],
    w: 3,
    cd: 25,
    minR: 1,
    title: 'Thú triều',
    text: () => `Chuông báo động vang khắp ${here().n}. Từ phía núi, bụi đất cuộn lên như mây giông — thú triều. Hàng ngàn yêu thú bị thứ gì đó trong rừng sâu xua ra, ào về phía thành. Phàm nhân chen nhau chạy, tu sĩ trong thành nhìn nhau.`,
    ch: () => [
      {
        t: 'Lên tường thành giữ cửa', cls: 'prime', hint: 'Đánh liên tiếp yêu thú',
        fn: (): Outcome => {
          const r1 = battle(beast(effRi(), 1), { lethal: false });
          const r2 = battle(beast(effRi(), 1.15), { lethal: false });
          if (s.hurt >= 90) return `${r1}\n\n${r2}\n\nNgươi gục trên tường thành. Có người kéo ngươi xuống, có người đứng thế vào chỗ ngươi. Sáng hôm sau, thành vẫn còn.` + statUp('tam', 1);
          good(3); fame(40 + effRi() * 20);
          return {
            text: `${r1}\n\n${r2}\n\nĐợt đầu bị đẩy lui. Giữa bầy thú, một con thú đầu đàn lớn gấp mười con khác đang gầm lên gọi bầy.`,
            choices: [
              { t: 'Xông ra chém thú vương', cls: 'danger', fn: () => battle({ name: 'Thú vương', r: Math.min(RMAX(), effRi() + 1), st: 0, kind: 'boss', mult: 1.05, mat: 'yeudan' }, {
                win: () => { mark(`Chém thú vương, giải thú triều ${here().n}`); fame(120); good(3); return 'Thú vương ngã, bầy thú tan tác chạy về núi. Cả thành hô tên ngươi.' + gain('m:yeudan', 3) + money(M(30)); },
                lose: () => 'Thú vương hất ngươi văng lại tường thành. Nhưng nó cũng bị thương, kéo bầy rút đi.' + hurt(30),
              }) },
              { t: 'Giữ vững tường thành tới sáng', fn: () => 'Ngươi không rời chỗ đứng. Tới sáng, thú triều tự rút. Quan phủ đem lễ tới cảm tạ.' + money(M(15)) + cult(15) },
            ],
          };
        },
      },
      {
        t: 'Mở đường sơ tán phàm nhân', hint: 'Cứu người, ít chiến công',
        fn: () => { good(4); years(0.1); const r = battle(beast(Math.max(0, effRi() - 1)), { lethal: false }); return `Ngươi dẫn dân chạy ra cửa nam, chặn mấy con thú đuổi theo. ${r}\n\nMấy trăm người sống sót nhờ ngươi. Một bà lão dúi vào tay ngươi gói bánh cuối cùng.` + statUp('tam', 1) + tamma(-5); },
      },
      {
        t: 'Thừa loạn săn yêu đan', hint: 'Lợi, nhưng mang tiếng',
        fn: () => { evil(1); const r = battle(beast(effRi()), { lethal: false }); return `Trong lúc người ta liều mạng giữ thành, ngươi lẻn ra rìa bầy thú nhặt những con lạc đàn. ${r}` + gain('m:yeudan', ri(2, 4)) + gain('m:dayeu', 2); },
      },
      { t: 'Rời thành ngay', fn: () => { years(0.05); return 'Ngươi bay đi trước khi cửa thành đóng. Sau lưng, khói bốc lên.' + tamma(4); } },
    ],
  },

  // ===================== Đồng môn bắt nạt (chứng kiến) =====================
  {
    id: 'rd_bully_witness',
    where: ['sect'],
    w: 4,
    cd: 10,
    cond: () => atHome(),
    title: 'Ức hiếp đồng môn',
    text: () => {
      const v = meet({ r: Math.max(1, effRi() - 1), sect: s.sect!.id, tag: 'acq', rel: 0, how: `Đệ tử ${sectName()} hay bị ức hiếp`, age: ri(12, 16) });
      const b = meet({ dr: 1, sect: s.sect!.id, tag: 'acq', rel: -5, how: `Đệ tử ${sectName()}, có chỗ dựa trong tông`, age: ri(18, 30) });
      s.flags._rdV = v.id; s.flags._rdB = b.id;
      return `Sau dược viên, ${npcTitle(b)} cùng mấy tên tay chân dồn ${npcTitle(v)} vào góc tường. Túi linh thạch của ${v.name} bị giật mất, mặt sưng một bên. "Ai cho ngươi nhận nhiệm vụ đó? Lần sau thấy mặt là gãy chân."`;
    },
    ch: () => {
      const v = npcOf('_rdV')!, b = npcOf('_rdB')!;
      return [
        {
          t: 'Ra mặt can', cls: 'prime', hint: `Đối phương ${REALMS[b.r].n}`,
          fn: (): Outcome => ({
            text: `${b.name} quay sang, nheo mắt: "${s.g === 'm' ? 'Sư đệ' : 'Sư muội'} muốn làm anh hùng à? Lên lôi đài, hay quỳ xuống đây?"`,
            choices: [
              { t: 'Lên lôi đài', cls: 'danger', fn: () => battle(cultivator(b.name, b.r - effRi(), 1), { lethal: false,
                win: () => { relChange(v, 40); relChange(b, -40); b.tag = 'enemy'; good(2); fame(25); return `${b.name} ôm ngực bò dậy, trừng mắt nhìn ngươi rồi bỏ đi. ${v.name} cúi rạp: "Ơn này đệ nhớ cả đời."` + contrib(10); },
                lose: () => { relChange(v, 25); relChange(b, -20); return `Ngươi thua, nhưng cả tông thấy ngươi dám đứng ra. ${b.name} không dám đụng tới ${v.name} nữa.` + hurt(15); },
              }) },
              { t: 'Đem môn quy ra nói', fn: () => { relChange(v, 20); relChange(b, -15); return `"Đồng môn tương tàn, môn quy phạt thế nào, sư huynh nhớ chứ?" ${b.name} hừ một tiếng rồi đi. Lần này thôi.` + statUp('mi', 1); } },
            ],
          }),
        },
        { t: 'Báo lên Chấp pháp đường', fn: () => { relChange(v, 15); relChange(b, -25); good(1); return `Chấp pháp trưởng lão phạt ${b.name} quỳ ba ngày trước bia môn quy. Từ đó ${b.name} nhìn ngươi bằng ánh mắt khác.` + contrib(5); } },
        { t: 'Lẳng lặng giúp sau', fn: () => { relChange(v, 25); good(1); return `Đợi bọn chúng đi, ngươi đỡ ${v.name} dậy, đưa hai viên linh thạch và một lọ thuốc.` + money(-2); } },
        { t: 'Làm ngơ', fn: () => { relChange(v, -10); return 'Ngươi đi đường vòng. Chuyện trong tông, càng ít dính càng tốt.' + tamma(3); } },
        { t: 'Nhập bọn', cls: 'danger', fn: () => { evil(2); relChange(b, 25); relChange(v, -50); v.tag = 'enemy'; return `Ngươi cười, đá thêm một cái. ${b.name} khoác vai ngươi: "Biết điều." Chia cho ngươi một phần.` + money(M(4)); } },
      ];
    },
  },

  // ===================== Đại chiến tông môn =====================
  {
    id: 'rd_sectwar',
    where: ['sect'],
    w: 2,
    cd: 50,
    minR: 1,
    cond: () => atHome() && Object.values(SECTS).some((x) => x.id !== s.sect!.id && Math.abs(x.tier - SECTS[s.sect!.id].tier) <= 1),
    title: 'Đại chiến tông môn',
    text: () => {
      const me = SECTS[s.sect!.id];
      const foe = pick(Object.values(SECTS).filter((x) => x.id !== me.id && Math.abs(x.tier - me.tier) <= 1));
      s.flags._rdFoe = foe.id;
      return `Nửa đêm, hộ sơn đại trận rung lên. ${foe.n} kéo tới chân núi, tranh linh mạch đã ấp ủ trăm năm. Chuông triệu tập vang chín tiếng — toàn tông nghênh chiến. Chưởng môn truyền lệnh: đệ tử mỗi người một việc.`;
    },
    ch: () => {
      const foe = SECTS[s.flags._rdFoe as string] || pick(Object.values(SECTS));
      return [
        {
          t: 'Ra tiền tuyến', cls: 'danger', hint: 'Chiến công lớn, rủi ro lớn',
          fn: (): Outcome => {
            const r1 = battle(cultivator(`Đệ tử ${foe.n}`, 0, 1.05, foe.el[0]), { lethal: false });
            if (s.hurt >= 85) return `${r1}\n\nNgươi được khiêng về sau trận. Trận chiến kéo dài bảy ngày, ${foe.n} rút lui.` + contrib(30);
            return {
              text: `${r1}\n\nTrận tuyến bên trái vỡ. Một trưởng lão ${foe.n} đang phá trận nhãn — nếu trận nhãn mất, hộ sơn đại trận sụp.`,
              choices: [
                { t: 'Lao tới giữ trận nhãn', cls: 'danger', fn: () => battle({ name: `Trưởng lão ${foe.n}`, r: Math.min(RMAX(), effRi() + 1), st: 0, kind: 'boss', mult: 0.9, el: foe.el[0] }, { lethal: false,
                  win: () => { mark(`Giữ trận nhãn trong đại chiến với ${foe.n}`); fame(150); return `Trưởng lão địch trọng thương rút lui. Trận nhãn giữ được, ${foe.n} lui binh. Chưởng môn gọi tên ngươi trước toàn tông.` + contrib(200) + giveGear(effRi(), 2); },
                  lose: () => 'Ngươi bị đánh văng, nhưng giữ chân đủ lâu để trưởng lão bên mình tới kịp.' + contrib(80) + hurt(25),
                }) },
                { t: 'Đi cứu đồng môn bị thương', fn: () => { good(2); return 'Ngươi cõng từng người về sau trận. Chiến công không ai ghi, nhưng có mười mấy người sống sót.' + contrib(60) + statUp('tam', 1); } },
              ],
            };
          },
        },
        { t: 'Trấn giữ tàng kinh các và dược viên', fn: () => { const r = battle(cultivator(`Kẻ trộm của ${foe.n}`, 0, 0.9), { lethal: false }); return `Quả nhiên có kẻ lẻn vào định đốt tàng kinh các. ${r}` + contrib(70); } },
        { t: 'Hộ tống đệ tử nhỏ tuổi rút vào hậu sơn', fn: () => { good(3); return 'Ngươi dẫn ba mươi đứa trẻ đi đường hầm vào hậu sơn. Không đứa nào bị thương.' + contrib(50) + statUp('mi', 1); } },
        { t: 'Nhân loạn lẻn vào bảo khố', cls: 'danger', hint: 'Bị bắt là bị phế', fn: () => {
          evil(4);
          if (ch(0.55)) return 'Không ai để ý một bóng người trong bảo khố lúc đại trận đang rung. Ngươi ra về với túi căng phồng.' + money(M(60)) + giveGear(effRi(), 2);
          s.sect!.contrib = 0; s.sect!.rank = Math.max(0, s.sect!.rank - 1);
          return 'Chấp pháp trưởng lão đứng chờ sẵn ở cửa bảo khố. Ngươi bị phạt mất sạch cống hiến, giáng một bậc.' + hurt(30);
        } },
      ];
    },
  },

  // ===================== Ma tu xuất hiện =====================
  {
    id: 'rd_matu',
    where: ['village', 'town', 'road'],
    w: 3,
    cd: 20,
    minR: 1,
    title: 'Ma tu xuất hiện',
    text: () => `Trẻ con quanh vùng mất tích, cứ bảy ngày một đứa. Sáng nay người ta tìm thấy một cái xác khô quắt bên bờ suối, máu bị hút sạch. Trên cổ có vết ấn hình đầu lâu — dấu hiệu của ma tu luyện huyết đan.`,
    ch: () => [
      {
        t: 'Lần theo dấu vết', cls: 'prime',
        fn: (): Outcome => ({
          text: 'Dấu huyết khí dẫn ngươi tới một miếu hoang trên núi. Dưới hầm có tiếng trẻ con khóc. Tên ma tu đang ngồi luyện đan, lò đan sôi sùng sục màu đỏ.',
          choices: [
            { t: 'Xông vào', cls: 'danger', fn: () => battle({ name: 'Ma tu luyện huyết', r: effRi(), st: ri(1, 3), kind: 'demon', mult: 1.05 }, {
              win: () => { good(5); fame(60); mark('Diệt ma tu, cứu trẻ con'); return 'Lò đan đổ, huyết đan vỡ tan. Ngươi bế từng đứa trẻ ra khỏi hầm.' + giveGear(effRi(), 1) + money(M(15)); },
              lose: () => 'Tên ma tu cười khanh khách rồi độn đi, bỏ lại lò đan. Ít ra lũ trẻ được thả.' + hurt(20),
            }) },
            { t: 'Lén cứu trẻ con trước', fn: () => { good(4); return ch(0.6 + (s.stats.van - 5) * 0.04) ? 'Ngươi đào đường vòng vào hầm, đưa lũ trẻ ra trước khi hắn kịp phát hiện. Rồi báo quan phủ phong tỏa núi.' + statUp('tam', 1) : 'Một đứa trẻ khóc to. Tên ma tu quay lại. ' + battle({ name: 'Ma tu luyện huyết', r: effRi(), st: 2, kind: 'demon', mult: 1.1 }, { lethal: false }); } },
            { t: 'Báo cho tông môn gần nhất', fn: () => { good(2); return 'Ba ngày sau, đệ tử tông môn tới vây miếu. Tên ma tu chạy thoát, nhưng lũ trẻ được cứu.' + (s.sect ? contrib(20) : ''); } },
          ],
        }),
      },
      { t: 'Giả như không biết', fn: () => 'Ngươi rời đi. Chuyện của phàm nhân, ngươi không gánh nổi hết.' + tamma(5) },
      { t: 'Tìm ma tu bàn chuyện làm ăn', cls: 'danger', hint: 'Ma đạo', fn: () => { evil(5); return 'Tên ma tu nhìn ngươi rất lâu, rồi đẩy sang một viên huyết đan. "Người hiểu chuyện. Lần sau đưa hàng tới, ta trả gấp đôi."' + cult(35) + tamma(12); } },
    ],
  },

  // ===================== Người đi đường cầu cứu =====================
  {
    id: 'rd_caucuu',
    where: ['road', 'wild'],
    w: 4,
    cd: 8,
    title: 'Người cầu cứu',
    text: () => {
      const trap = ch(0.3);
      s.flags._rdTrap = trap;
      const g = ch(0.5) ? 'm' : 'f';
      s.flags._rdG = g;
      return `Bên đường, một ${g === 'm' ? 'thư sinh' : 'cô gái'} người đầy máu lao ra, quỳ xuống ôm chân ngươi: "Tiên sư cứu mạng! Phía sau có cường đạo đuổi giết, cả nhà ta…" Xa xa có tiếng vó ngựa.`;
    },
    ch: () => {
      const trap = !!s.flags._rdTrap;
      const g = s.flags._rdG as 'm' | 'f';
      return [
        {
          t: 'Ra tay cứu', cls: 'prime',
          fn: () => {
            if (trap) return 'Ngươi vừa quay lưng, người kia rút dao găm đâm tới — là bẫy! Bọn cướp từ bụi rậm ùa ra.' + hurt(10) + ' ' + battle(cultivator('Cướp tu', 0, 1), { lethal: false, win: () => { good(1); return 'Bọn chúng chết sạch. Trong hang ổ có của cải cướp được của bao người.' + money(M(20)); } });
            return battle(cultivator('Cường đạo cầm đầu', -1, 1.1), { lethal: false,
              win: () => { good(3); const n = meet({ r: 0, g, tag: 'friend', rel: 55, how: 'Người ngươi cứu khỏi cường đạo giữa đường' }); return `Bọn cướp tan tác. ${n.name} dập đầu ba cái, xin cho biết tên ân nhân.` + money(M(6)) + statUp('van', ch(0.3) ? 1 : 0); },
              lose: () => 'Ngươi bị đánh lui, nhưng đủ để người kia chạy thoát.' + hurt(10),
            });
          },
        },
        { t: 'Cho thuốc rồi đi tiếp', fn: () => { if (trap) return 'Người kia nhận thuốc, nhìn theo ngươi với ánh mắt tiếc nuối. Ngươi không biết mình vừa thoát một cái bẫy.' + statUp('van', 1); good(1); return 'Ngươi để lại lọ thuốc và chỉ đường tắt. Phần còn lại tùy số họ.'; } },
        { t: 'Nhìn kỹ trước đã', hint: 'Dùng ngộ tính phân biệt thật giả', fn: () => {
          if (s.stats.ngo + ri(0, 4) < 8) return 'Ngươi nhìn mãi không ra. Lúc ngẩng lên, người kia đã chạy mất.';
          return trap ? 'Vết máu trên áo khô từ hôm qua, tay cầm dao chai sạn — cướp giả làm nạn nhân. Ngươi điểm huyệt hắn, giao cho quan phủ.' + money(M(8)) + statUp('ngo', 1)
            : 'Vết thương là thật. Ngươi chặn bọn cường đạo ở khúc quanh. ' + battle(cultivator('Cường đạo', -1, 1), { lethal: false, win: () => { good(3); return 'Người kia sống sót.' + money(M(5)); } });
        } },
        { t: 'Mặc kệ', fn: () => (trap ? 'Ngươi đi tiếp. Phía sau có tiếng chửi thề.' : 'Ngươi đi tiếp. Phía sau, tiếng kêu tắt dần.' + tamma(6)) },
      ];
    },
  },

  // ===================== Thiên kiêu thánh địa gặp nạn =====================
  {
    id: 'rd_thienkieu',
    where: ['wild'],
    w: 2,
    cd: 30,
    minR: 1,
    cond: () => !holyLands().some((h) => s.sect?.id === h.id && s.flags.thanhtu === h.id),
    title: 'Thiên kiêu gặp nạn',
    text: () => {
      const hl = pick(holyLands());
      const g = ch(0.5) ? 'm' : 'f';
      const n = meet({ r: Math.min(RMAX(), effRi() + 1), g, sect: hl.id, tag: 'acq', rel: 0, talent: 1.8, how: `Thánh ${g === 'm' ? 'tử' : 'nữ'} ${hl.n}, ra ngoài rèn luyện`, name: holyNpcName(hl.id, g), age: ri(16, 25) });
      s.flags._rdTK = n.id; s.flags._rdHL = hl.id;
      return `Giữa ${here().n}, ngươi nghe tiếng giao đấu. Một ${g === 'm' ? 'thanh niên' : 'thiếu nữ'} mặc đạo bào thêu ấn ký ${hl.n} — ${npcTitle(n)}, thiên chi kiêu ${g === 'm' ? 'tử' : 'nữ'} mà ai cũng nghe danh — đang bị bốn tu sĩ che mặt vây kín. ${he(n)[0].toUpperCase() + he(n).slice(1)} đã trúng độc, kiếm trong tay run run. Một kẻ che mặt cười: "Giết xong, ai biết là ai làm?"`;
    },
    ch: () => {
      const n = npcOf('_rdTK')!;
      const hl = SECTS[s.flags._rdHL as string];
      return [
        {
          t: 'Ra tay cứu', cls: 'prime', hint: 'Kẻ địch mạnh hơn ngươi',
          fn: () => battle(cultivator('Sát thủ che mặt', 1, 0.85), { lethal: false,
            win: () => { relChange(n, 70); n.tag = 'friend'; good(3); fame(80); mark(`Cứu ${n.name} của ${hl.n}`); s.flags[`favor_${hl.id}`] = true;
              return `Bọn sát thủ bỏ chạy, để lại một tấm lệnh bài — của một thế lực đối đầu ${hl.n}. ${n.name} nhìn ngươi rất lâu: "Món nợ này, ${hl.n} ghi nhớ." Rồi tháo ngọc bội đưa cho ngươi.` + giveGear(Math.min(RMAX(), effRi() + 1), 3) + money(M(40)); },
            lose: () => { relChange(n, 40); return `Ngươi không thắng nổi, nhưng câu được đủ thời gian. Trưởng lão hộ đạo của ${hl.n} tới kịp, bọn sát thủ tan như khói.` + hurt(25) + money(M(20)); },
          }),
        },
        { t: 'Ném giải độc đan rồi rút', fn: () => { relChange(n, 30); good(1); return `Viên đan bay vào tay ${n.name}. Độc vừa giải, khí thế ${he(n)} tăng vọt — bốn kẻ che mặt lùi lại. Ngươi đã biến mất trước khi ai kịp hỏi tên.` + statUp('van', 1); } },
        { t: 'Chờ hai bên lưỡng bại câu thương', cls: 'danger', hint: 'Nhặt bảo vật của thiên kiêu', fn: () => {
          evil(4); n.alive = false;
          return ch(0.6) ? `${n.name} chết cùng hai kẻ ám sát. Ngươi nhặt túi trữ vật trên người ${he(n)}. Đồ của thiên kiêu thánh địa, quả nhiên không tầm thường.` + giveGear(Math.min(RMAX(), effRi() + 1), 3) + cult(30) + tamma(15)
            : `Ngươi vừa chạm vào túi trữ vật thì một luồng thần thức từ xa quét tới — ${hl.n} đã khóa vị trí này. Ngươi bỏ chạy, nhưng cái tên ngươi đã bị ghi lại.` + hurt(30) + tamma(10);
        } },
        { t: 'Không dây vào', fn: () => 'Chuyện của thánh địa, kẻ như ngươi chen vào chỉ có chết. Ngươi lặng lẽ rời đi.' },
      ];
    },
  },

  // ===================== Chính – Ma giao tranh (cấp thấp) =====================
  {
    id: 'rd_chinhma',
    where: ['road', 'wild', 'town'],
    w: 2,
    cd: 30,
    minR: 1,
    maxR: 4,
    title: 'Chính – Ma giao tranh',
    text: () => `Cả một vùng trời đỏ rực. Tu sĩ chính đạo và ma tu đánh nhau trên ${here().n}, pháp bảo va nhau như sấm, xác người rơi xuống ruộng lúa. Lệnh chiêu mộ của cả hai bên bay khắp nơi: chính đạo hứa cống hiến và danh vọng, ma đạo hứa đan dược và công pháp.`,
    ch: () => [
      { t: 'Theo chính đạo ra trận', cls: 'prime', fn: () => battle(cultivator('Ma tu', 0, 1), { lethal: false,
        win: () => { good(3); fame(50); s.flags.war_side ||= 'chinh'; return 'Phe chính đạo giữ được trận địa. Ngươi được ghi tên vào bảng công.' + money(M(20)) + (s.sect ? contrib(40) : ''); },
        lose: () => 'Ngươi bị thương, rút về hậu tuyến.' + hurt(15),
      }) },
      { t: 'Lập trạm cứu thương cho dân', fn: () => { good(4); years(0.2); return 'Ngươi mở một trạm thuốc ở làng ven chiến trường. Không phe nào cảm ơn, nhưng dân làng thì nhớ.' + statUp('tam', 1) + tamma(-8) + heal(10); } },
      { t: 'Vét túi trữ vật trên chiến trường', cls: 'danger', fn: () => { evil(2); return ch(0.7) ? 'Người chết không cần pháp bảo nữa. Ngươi vét được không ít.' + money(M(25)) + gain('m:yeudan', 1) : 'Một ma tu giả chết bật dậy. ' + battle(cultivator('Ma tu giả chết', 0, 1.1)); } },
      { t: 'Nhận lời chiêu mộ của ma đạo', cls: 'danger', fn: () => { evil(5); fame(-30); s.flags.war_side = 'ma'; return 'Ma đạo giữ lời: một viên huyết đan và một quyển ma công chép tay. Từ nay chính đạo có tên ngươi trong sổ đen.' + cult(40) + tamma(15); } },
      { t: 'Tránh xa', fn: () => { years(0.05); return 'Ngươi đi đường vòng ba trăm dặm.'; } },
    ],
  },

  // ===================== Dị bảo xuất thế =====================
  {
    id: 'rd_dibao',
    where: ['wild'],
    w: 3,
    cd: 15,
    title: 'Dị bảo xuất thế',
    text: () => `Một cột sáng vọt lên từ khe núi trong ${here().n}, bảo quang chiếu đỏ nửa bầu trời. Chỉ một nén nhang sau, tu sĩ từ khắp nơi đã kéo tới — có kẻ ${seenRealm()} như ngươi, có kẻ ${realmN(Math.min(RMAX(), effRi() + 1))}.`,
    ch: () => [
      { t: 'Tranh đoạt', cls: 'danger', fn: () => battle(cultivator('Tu sĩ tranh bảo', ri(0, 1), 1), {
        win: () => (ch(0.5) ? 'Ngươi đánh lui kẻ cuối cùng, chạm tay vào bảo quang trước tiên.' + giveGear(Math.min(RMAX(), effRi() + 1), 2) : 'Ngươi thắng, nhưng bảo vật chỉ là một khối linh thạch tinh khiết khổng lồ.' + money(M(40))),
        lose: () => 'Ngươi bị đánh văng khỏi vòng tranh đoạt.' + hurt(15),
      }) },
      { t: 'Núp chờ ngư ông đắc lợi', hint: 'Dựa vào khí vận', fn: () => (ch(0.25 + (s.stats.van - 5) * 0.05)
        ? 'Hai kẻ mạnh nhất đánh nhau tới kiệt sức. Ngươi lướt qua giữa họ, cuốn bảo vật đi trong một hơi thở.' + giveGear(Math.min(RMAX(), effRi() + 1), 3) + statUp('van', 1)
        : 'Ngươi chờ quá lâu. Bảo vật đã có chủ, kẻ đó cũng đã đi xa.') },
      { t: 'Không tham, rời đi', fn: () => 'Bảo vật nhiều kẻ tranh, người cầm được chưa chắc giữ được. Ngươi quay đi.' + statUp('tam', 1) },
    ],
  },

  // ===================== Thiên tai =====================
  {
    id: 'rd_thientai',
    where: ['village', 'town'],
    w: 3,
    cd: 20,
    title: () => (s.flags._rdTai === 'lu' ? 'Đại hồng thủy' : 'Đại hạn'),
    text: () => {
      const lu = ch(0.5);
      s.flags._rdTai = lu ? 'lu' : 'han';
      return lu
        ? `Mưa bảy ngày không dứt. Đê ngoài ${here().n} sắp vỡ, nước đã ngập tới bậc cửa nhà dân. Quan phủ không còn bao tải cát, dân làng quỳ xin tiên sư.`
        : `Ba năm không một giọt mưa. Ruộng nứt như mai rùa, giếng cạn tới đáy. Dân ${here().n} lập đàn cầu mưa, già trẻ quỳ dưới nắng.`;
    },
    ch: () => {
      const lu = s.flags._rdTai === 'lu';
      return [
        { t: lu ? 'Dùng chân nguyên chặn đê' : 'Thi pháp cầu mưa', cls: 'prime', hint: effRi() < 2 ? 'Tu vi thấp, rất hao tổn' : 'Hao tổn tu vi', fn: () => {
          good(5); fame(30);
          const cost = effRi() < 2 ? 40 : 20;
          s.prog = Math.max(0, s.prog - cost);
          return (lu ? 'Ngươi đứng trên đê suốt một đêm, chân nguyên dựng thành tường chắn nước. Sáng ra, nước rút.' : 'Ngươi kéo thủy khí trăm dặm về một chỗ. Mây đen tụ lại, mưa rơi. Dân làng khóc như mưa.') + ` (Tu vi −${cost}%)` + statUp('tam', 1) + tamma(-10);
        } },
        { t: 'Bỏ tiền mua lương cứu tế', fn: () => { good(3); return 'Ngươi mua cả kho lương của thương nhân đầu cơ, chia cho dân.' + money(-M(15)); } },
        { t: 'Nhận lễ vật rồi làm cho có', cls: 'danger', fn: () => { evil(2); return 'Ngươi nhận lễ, múa may một hồi rồi đi. Lương tâm không nặng bằng túi linh thạch.' + money(M(8)) + tamma(8); } },
        { t: 'Lắc đầu đi qua', fn: () => 'Thiên đạo vô tình. Ngươi không phải thiên đạo, nhưng cũng không phải thánh nhân.' + tamma(4) },
      ];
    },
  },
]);

