// Sự kiện cốt lõi: phế linh căn tìm đường, tâm ma, kẻ thù diệt môn, động phủ tiền kiếp.
import { effRi,
  thapHidden, hiddenRootName, hiddenFlows, register, s, M, gain, money, cult, hurt, heal, statUp, tamma, fame, good, evil, learnTech, learnSkill, giveGear,
  battle, cultivator, beast, mortal, meet, he, ch, ri, pick, fmt, root, age, realmN, here, findNpc, mark, addLog, setFlag, flag,
  canPay, hasItem, lose, relChange, LOCS, REALMS,
} from '../engine/api';
import { meta } from '../engine/state';
import { revealThap } from '../engine/items';
import { ROOTS, BASIC_EL } from '../data/core';

register([
  // ----- Phế linh căn: cơ hội nghịch thiên -----
  {
    id: 'core_nghichthien',
    where: ['village', 'town', 'road', 'wild'],
    w: 6,
    maxR: 0,
    minAge: 12,
    cond: () => root().m === 0,
    cd: 6,
    title: 'Lão đạo sĩ bên giếng',
    text: () => 'Bên giếng nước đầu làng có một lão đạo sĩ áo vá ngồi uống nước. Lão liếc ngươi một cái rồi bật cười: "Kinh mạch bế tắc như ống tre đặc ruột. Tiếc thật, cái tâm thì lại sáng."',
    ch: () => [
      {
        t: 'Quỳ xuống xin lão chỉ đường',
        cls: 'prime',
        fn: () => {
          if (thapHidden()) return `Lão đạo sĩ đặt hai ngón tay lên đỉnh đầu ngươi, rồi giật bắn tay lại như chạm phải lửa. Lão nhìn ngươi rất lâu, hạ giọng: "Không phải phế... là ${hiddenFlows()} hệ cân bằng tới mức đá trắc linh cũng mù. ${hiddenRootName()}." Lão ấn vào tay ngươi một quyển sách cũ. "Đừng để ai biết, trước khi ngươi đủ sức tự bảo vệ."` + learnTech('ngunguyenquyet') + statUp('tam', 1);
          if (ch(0.3 + s.stats.tam * 0.03 + s.stats.van * 0.02)) {
            const k = ch(0.3) ? 3 : 2; // Tam hoặc Tứ linh căn
            s.root = { k, els: [...BASIC_EL].sort(() => Math.random() - 0.5).slice(0, k === 3 ? 3 : 4) };
            mark('Được dị nhân tẩy kinh phạt tủy, khai mở linh căn');
            return `Lão thở dài, đặt hai ngón tay lên đỉnh đầu ngươi. Một luồng nóng rực như nước sôi chảy khắp người. Ngươi ngất đi ba ngày. Tỉnh dậy, lão đã đi mất, còn ngươi cảm nhận được gió mang theo những đốm sáng li ti — linh khí. Linh căn của ngươi đã mở: ${ROOTS[s.root.k].n}.`;
          }
          return 'Lão đạo sĩ lắc đầu: "Duyên chưa tới." Lão đứng dậy đi mất. Ngươi quỳ đến khi trời tối.' + statUp('tam', 1);
        },
      },
      { t: 'Bĩu môi bỏ đi', fn: () => 'Lão già lẩm cẩm. Ngươi về nhà ăn cơm.' },
    ],
  },
  {
    id: 'core_luyenthe',
    where: ['village', 'town', 'market'],
    w: 3,
    maxR: 0,
    cond: () => root().m === 0 && age() >= 14,
    once: true,
    title: 'Con đường luyện thể',
    text: () => 'Một hán tử cởi trần đang đập đá ngoài chợ, từng nắm đấm làm đá vỡ vụn. Hắn nói không cần linh căn: "Lấy thân làm lò, lấy máu làm củi. Đau thì đau, mà sống được."',
    ch: () => [
      {
        t: `Xin học (${fmt(M(20))} linh thạch)`,
        dis: !canPay(M(20)),
        fn: () => {
          s.money -= M(20);
          setFlag('luyenthe');
          return 'Ba năm trời ngươi tắm thuốc, đập đá, ngâm mình trong nước lạnh. Xương cốt cứng lại, nhưng linh khí vẫn trôi qua người như gió qua lưới.' + statUp('can', 2) + ' Hán tử dặn: "Muốn thật sự tu tiên, ngươi vẫn phải tìm cách mở linh căn. Nghe nói có loại Tẩy Tủy Đan..."';
        },
      },
      { t: 'Thôi', fn: () => 'Ngươi xem một lúc rồi đi.' },
    ],
  },

  // ----- Thập linh căn: bị khinh vì "phế linh căn" -----
  {
    id: 'core_thap_khinh',
    where: ['town', 'village', 'market', 'sect'],
    w: 4,
    cd: 10,
    maxR: 2,
    cond: () => thapHidden(),
    title: 'Phế vật',
    text: () => `Đám đệ tử tông môn đi ngang, một tên chỉ vào ngươi: "Kia chẳng phải đứa phế linh căn đặt tay lên đá trắc linh mà đá không sáng nổi sao? Thế mà cũng đeo kiếm đi đường." Cả bọn cười rộ.${effRi() >= 1 ? ` Chúng không biết ngươi đã là tu sĩ — ${hiddenFlows()} hệ cân bằng tới mức khí tức cũng không lộ.` : ''}`,
    ch: () => [
      { t: 'Im lặng bỏ đi', fn: () => 'Ngươi không cãi. Để chúng cười. Ngày nào đó, chính chúng sẽ phải ngẩng đầu nhìn ngươi.' + statUp('tam', 1) },
      {
        t: 'Dạy chúng một bài học', cls: 'danger', dis: effRi() < 1, hint: effRi() < 1 ? 'Cần là tu sĩ' : undefined,
        fn: () => battle(cultivator('Đệ tử tông môn hống hách', 0, 0.9), {
          lethal: false,
          win: () => { fame(10); return 'Tên kia nằm dưới đất, mắt trợn tròn: "Ngươi... phế linh căn mà..." Ngươi bỏ đi, để lại đám đông xôn xao.' + (ch(0.4) ? (revealThap(), ' Tin đồn lan nhanh. Có người bắt đầu đoán ra sự thật.') : ''); },
        }),
      },
    ],
  },
  {
    id: 'core_thap_lo',
    where: ['town', 'market', 'sect', 'wild'],
    w: 3,
    once: true,
    minR: 2,
    cond: () => thapHidden(),
    title: 'Linh quang muôn sắc',
    text: () => {
      const hd = hiddenFlows() === 'mười hai';
      return `Trong lúc vận công, ngươi lơ đễnh để khí tức thoát ra một khắc. ${hd ? 'Mười hai' : 'Mười'} sắc linh quang bùng lên rồi tắt. Một lão giả đứng gần đó trợn mắt nhìn ngươi, miệng lẩm bẩm: "Kim Mộc Thủy Hỏa Thổ... Băng Lôi Phong... Ám... Quang${hd ? '... cả Âm lẫn Dương' : ''}? Không thể nào..."`;
    },
    ch: () => [
      { t: 'Thừa nhận — đã tới lúc thiên hạ biết', cls: 'prime', fn: () => { const n = hiddenRootName(); revealThap(); return `Tin tức lan khắp Thương Lan như lửa gặp gió: "Phế linh căn" năm xưa hóa ra là ${n} vạn năm khó gặp. Tông môn lớn bắt đầu gửi thiếp mời. Kẻ ghen ghét cũng vậy.`; } },
      { t: 'Nài lão giả giữ kín (biếu hậu lễ)', dis: !canPay(M(40)), fn: () => { s.money -= M(40); return 'Lão giả cất linh thạch, gật đầu: "Lão già này hôm nay hoa mắt." Bí mật vẫn là bí mật — ít nhất là lúc này.'; } },
      { t: 'Bỏ đi thật nhanh', fn: () => (ch(0.5) ? (revealThap(), `Ngươi rời đi, nhưng lão giả đã kịp kể cho người khác. Mấy tháng sau, cả phường thị đều bàn về "${hiddenRootName()}".`) : 'Ngươi lẩn vào đám đông. Lão giả dụi mắt, tưởng mình nhìn nhầm.') },
    ],
  },

  // ----- Truyền thừa Tiên giai (cực hiếm, bí cảnh cấp cao) -----
  {
    id: 'core_tiengiai',
    where: ['realm'],
    w: 1,
    once: true,
    minR: 5,
    cond: () => (here().lv ?? 0) >= 6,
    title: 'Tiên quang trong đá',
    text: () => `Sâu nhất trong ${here().n}, một tảng đá đen phát ra ánh sáng không thuộc về thế gian này. Trên mặt đá, chữ viết tự chảy như nước — mỗi chữ nhìn vào đều làm thần thức đau nhói. Đây là truyền thừa Tiên giai, thứ cả Thương Lan Giới chưa ai từng thấy.`,
    ch: () => [
      {
        t: 'Đặt tay lên đá, tiếp nhận truyền thừa', cls: 'danger',
        fn: () => {
          if (ch(0.35 + s.stats.ngo * 0.03 + s.stats.tam * 0.02)) {
            const id = s.root.els.length >= 10 || ch(0.3) ? 'thaiso' : 'hondonkinh';
            mark(`Nhận truyền thừa Tiên giai trong ${here().n}`);
            fame(300);
            return 'Chữ trên đá chảy vào mắt ngươi, vào xương, vào máu. Một ngàn năm như một chớp mắt.' + learnTech(id, true) + statUp('ngo', 2);
          }
          return 'Thần thức không chịu nổi. Ngươi ngất đi, tỉnh lại thì tảng đá đã nứt làm đôi, ánh sáng đã tắt.' + hurt(60) + tamma(20);
        },
      },
      { t: 'Không dám, lùi lại', fn: () => 'Có những thứ không phải để kẻ phàm chạm vào — ít nhất là lúc này. Ngươi cúi đầu lùi ra.' + statUp('tam', 1) },
    ],
  },

  // ----- Tâm ma khi bế quan -----
  {
    id: 'core_tamma',
    where: ['cult'],
    w: 4,
    minR: 2,
    cond: () => s.tamma >= 30,
    cd: 10,
    title: 'Tâm ma',
    text: () => {
      const d = s.npcs.find((n) => !n.alive && n.rel >= 40);
      return d
        ? `Giữa lúc nhập định, ${d.name} hiện ra trước mặt, áo đẫm máu: "Sao ngươi không cứu ta?" Ngươi biết đó là ảo ảnh, nhưng tim vẫn thắt lại.`
        : 'Giữa lúc nhập định, trong biển ý thức hiện ra một kẻ giống hệt ngươi, mắt đỏ như máu: "Tu tiên làm gì? Trường sinh để làm gì? Giết hết đi, lấy hết đi."';
    },
    ch: () => [
      {
        t: 'Giữ vững đạo tâm, chém tâm ma',
        cls: 'prime',
        fn: () => {
          if (ch(0.35 + s.stats.tam * 0.05 - s.tamma / 300)) {
            s.tamma = 0;
            return 'Ngươi niệm thanh tâm chú, từng chữ như búa đóng đinh. Ảo ảnh vỡ tan như gương. Tâm cảnh sáng như được lau rửa.' + statUp('tam', 1) + cult(30);
          }
          return 'Tâm ma cười sằng sặc, chui vào sâu hơn. Ngươi phun ra một ngụm máu, tỉnh khỏi nhập định.' + hurt(30) + tamma(15);
        },
      },
      {
        t: 'Thuận theo nó',
        cls: 'danger',
        fn: () => {
          evil(3);
          return 'Ngươi để mặc sát ý dâng lên. Tu vi tăng vọt, nhưng khi tỉnh dậy, tay ngươi run lên vì một cơn khát máu không rõ từ đâu.' + cult(80) + tamma(25);
        },
      },
      { t: 'Cưỡng ép xuất quan', fn: () => 'Ngươi cắn lưỡi cho tỉnh, dừng tu luyện. Ít ra không có gì tệ hơn xảy ra.' + hurt(10) },
    ],
  },

  // ----- Kẻ thù diệt môn (thiên phú "Huyết hải thâm thù") -----
  {
    id: 'core_nemesis',
    where: ['town', 'market', 'road', 'wild'],
    w: 5,
    cd: 25,
    cond: () => !!flag('nemesis') && !flag('revenged') && !!findNpc(flag('nemesis'))?.alive,
    title: () => `Kẻ thù: ${findNpc(flag('nemesis'))!.name}`,
    text: () => {
      const n = findNpc(flag('nemesis'))!;
      return `Giữa đám đông, ngươi nhận ra gương mặt đã ám ảnh mình bao năm: ${n.name}. ${he(n)[0].toUpperCase() + he(n).slice(1)} đã là ${REALMS[n.r].n}, không nhận ra ngươi.`;
    },
    ch: () => {
      const n = findNpc(flag('nemesis'))!;
      return [
        {
          t: 'Rút kiếm báo thù',
          cls: 'danger',
          fn: () =>
            battle({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator', mult: 1.1 }, {
              win: () => {
                n.alive = false;
                n.died = s.year;
                n.cause = 'bị ngươi chém chết';
                setFlag('revenged');
                mark(`Chém ${n.name}, báo thù diệt môn`);
                fame(80);
                s.tamma = 0;
                return `${n.name} ngã xuống, mắt vẫn mở to không hiểu. Ngươi đứng rất lâu giữa mưa. Gánh nặng hai mươi năm rơi khỏi vai.` + statUp('tam', 3) + cult(100) + giveGear(n.r, 2);
              },
              flee: () => 'Ngươi chưa đủ sức. Ngày khác.',
            }),
        },
        { t: 'Nhẫn nhịn, âm thầm đi theo dò xét', fn: () => { relChange(n, 0); return `Ngươi bám theo ${he(n)} ba ngày, biết được ${he(n)} hay lui tới ${LOCS[n.loc]?.n || 'một phường thị'}. Thù này, sẽ báo khi đủ sức.` + statUp('tam', 1); } },
      ];
    },
  },

  // ----- Động phủ tiền kiếp -----
  {
    id: 'core_tienkiep',
    where: ['wild', 'pinbi', 'pinbao'],
    w: 3,
    minR: 1,
    once: true,
    cond: () => meta.lives.some((l) => l.r >= 3 && l.id !== s.id),
    title: 'Động phủ quen thuộc',
    text: () => {
      const l = meta.lives.find((x) => x.r >= 3 && x.id !== s.id)!;
      return `Một vách đá phủ rêu. Không hiểu sao chân ngươi tự bước tới, tay tự kết ấn. Vách đá nứt ra, lộ một động phủ phủ bụi. Trên bia đá khắc: "${l.name}, ${l.realm}, tọa hóa năm ${l.year}." Nét chữ... là nét chữ của ngươi.`;
    },
    ch: () => [
      {
        t: 'Bái lạy rồi nhận lấy di vật',
        cls: 'prime',
        fn: () => {
          const l = meta.lives.find((x) => x.r >= 3 && x.id !== s.id)!;
          mark(`Tìm thấy động phủ tiền kiếp của ${l.name}`);
          return `Ngươi dập đầu ba cái trước chính mình. Trong hộp ngọc có túi linh thạch và một món pháp bảo vẫn còn nhận ra hơi thở của ngươi.` + money(M(120)) + giveGear(Math.min(l.r, effRi() + 1), 2) + statUp('ngo', 1);
        },
      },
    ],
  },

  // ----- Thọ nguyên sắp cạn -----
  {
    id: 'core_thonguyen',
    where: ['any'],
    w: 8,
    cd: 30,
    cond: () => effRi() >= 1 && REALMS[effRi()].life - age() < REALMS[effRi()].life * 0.08,
    title: 'Tóc bạc',
    text: () => 'Sáng nay soi gương, ngươi thấy tóc mai đã bạc trắng. Khí huyết suy, thọ nguyên không còn bao lâu. Nếu không đột phá, hoặc tìm được linh dược kéo dài tuổi thọ, ngươi sẽ tọa hóa như vạn vạn tu sĩ trước đây.',
    ch: () => [
      { t: 'Liều mạng bế quan', cls: 'prime', fn: () => 'Ngươi quyết định dồn tất cả vào lần đột phá cuối cùng.' + statUp('tam', 1) },
      { t: 'Đi tìm Diên Niên Đan', fn: () => 'Ngươi ghi nhớ: Diên Niên Đan cần Thiên Niên Huyết Sâm, Bách Niên Linh Chi và Thiên Sơn Tuyết Liên. Nhà đấu giá ở các thành lớn đôi khi cũng có.' },
    ],
  },
]);

// gợi ý cho trình biên dịch: các helper có thể không dùng hết trong gói này
void [gain, heal, learnTech, learnSkill, beast, mortal, cultivator, meet, ri, here, addLog, hasItem, lose, good, realmN];
