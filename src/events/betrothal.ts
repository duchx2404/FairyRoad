// Hôn ước từ bé của Thánh tử/nữ Thập linh căn (trong cùng thánh địa), từ hôn, hẹn đấu,
// và mối duyên với Thánh tử/nữ thánh địa khác gặp ở bí cảnh hoặc đại hội các thánh địa.
import { effRi, register, s, M, money, cult, hurt, statUp, fame, good, tamma, gain, battle, ch, pick, mark, findNpc, relChange, meet, SECTS, REALMS, thapHidden, hiddenRootName, hiddenFlows, here, years, type NPC, type Choice } from '../engine/api';
import { holyNpcName } from '../engine/core';
import { revealThap } from '../engine/items';
import { wedDaolu } from '../engine/relationships';
import { RK } from '../data/world';

const fz = (): NPC | null => { const n = s.flags.betrothed ? findNpc(s.flags.betrothed) : null; return n && n.alive ? n : null; };
const oth = (): NPC | null => { const n = s.flags.outsider ? findNpc(s.flags.outsider) : null; return n && n.alive ? n : null; };
const broken = () => !!s.flags.engageBroken;
const homeSect = () => (s.flags.holyScion ? SECTS[s.flags.holyScion] : null);
// xưng hô theo giới
const nang = (n: NPC) => (n.g === 'f' ? 'nàng' : 'chàng');
const Nang = (n: NPC) => (n.g === 'f' ? 'Nàng' : 'Chàng');
const honthe = (n: NPC) => (n.g === 'f' ? 'hôn thê' : 'hôn phu');
const thanhTu = (n: NPC) => (n.g === 'f' ? 'Thánh nữ' : 'Thánh tử');

function wed(n: NPC, how: string): string {
  wedDaolu(n);
  n.rel = Math.max(n.rel, 90);
  mark(`Kết làm đạo lữ với ${n.name}`);
  return how;
}

register([
  // ----- Gặp hôn thê/hôn phu -----
  {
    id: 'bt_gap',
    where: ['sect', 'town', 'market', 'any'],
    w: 5,
    cd: 4,
    cond: () => !!fz() && !broken(),
    title: 'Người được hứa hôn',
    text: () => {
      const n = fz()!;
      const r = n.rel;
      return r >= 70
        ? `${n.name} tìm tới, tay xách hộp điểm tâm còn ấm. ${Nang(n)} không nhắc gì tới lời đồn ngoài kia, chỉ hỏi dạo này ngươi ngủ có ngon không.`
        : r >= 45
          ? `Gặp ${n.name} ở hành lang. ${Nang(n)} khựng lại một chút như định nói gì, rồi chỉ khẽ gật đầu. Hai người đứng cạnh nhau, im lặng nhìn mây trôi.`
          : `${n.name} đi ngang qua cùng mấy đồng môn. Có người huých tay ${nang(n)} cười: "${honthe(n) === 'hôn thê' ? 'Phu quân' : 'Nương tử'} phế vật của ngươi kìa." ${Nang(n)} cúi mặt bước nhanh hơn.`;
    },
    ch: () => {
      const n = fz()!;
      const out: Choice[] = [
        { t: 'Ngồi xuống trò chuyện thật lòng', cls: 'prime', fn: () => { relChange(n, 6 + Math.round(s.stats.mi / 2)); return `Hai người nói chuyện tới khi trăng lên — chuyện hồi nhỏ trốn học, chuyện con hạc già ở hậu sơn. Lúc chia tay, ${n.name} cười nhiều hơn lúc tới.`; } },
        { t: `Tặng một món quà (${M(15)} linh thạch)`, dis: s.money < M(15), fn: () => { s.money -= M(15); relChange(n, 8); return `${n.name} cầm cây trâm ngọc, ngón tay mân mê mãi. "Ngươi... nhớ ta thích màu này à?"`; } },
        { t: 'Lạnh nhạt cho qua', fn: () => { relChange(n, -10); return `Ngươi gật đầu chào rồi đi. Sau lưng, ${n.name} đứng rất lâu.`; } },
      ];
      if (thapHidden() && n.rel >= 60 && !s.flags.fzKnows) out.splice(1, 0, {
        t: `Kể cho người ấy bí mật ${hiddenFlows()} hệ linh căn`,
        fn: () => {
          s.flags.fzKnows = true;
          relChange(n, 18);
          return `Ngươi nắm tay ${n.name}, để mười luồng linh khí khẽ chạy qua lòng bàn tay ${nang(n)}. ${Nang(n)} mở to mắt, rồi bật khóc. "Vậy mà cả tông... Ta sẽ giữ kín. Đến chết cũng giữ."`;
        },
      });
      return out;
    },
  },

  // ----- Từ hôn -----
  {
    id: 'bt_tuhon',
    where: ['sect', 'any'],
    w: 9,
    once: true,
    minAge: 14,
    cond: () => !!fz() && !broken() && thapHidden() && fz()!.rel < 50,
    title: 'Từ hôn',
    text: () => {
      const n = fz()!;
      return `Trưởng lão nội môn — cha mẹ của ${n.name} — đích thân tới phủ, đặt lên bàn chiếc ngọc bội định thân năm xưa. "Không phải lão phu bạc tình. Nhưng ${n.name} là thiên tài, không thể cả đời gắn với một người không tu luyện được." ${n.rel < 30 ? `${n.name} đứng phía sau, mặt lạnh như băng, không nhìn ngươi lấy một lần.` : `${n.name} đứng phía sau, môi mím chặt, mắt nhìn xuống đất.`}`;
    },
    ch: () => {
      const n = fz()!;
      const out: Choice[] = [
        { t: 'Nhận lại ngọc bội, không nói gì', fn: () => { s.flags.engageBroken = true; relChange(n, -5); mark(`Bị nhà ${n.name} từ hôn`); return 'Ngươi cầm ngọc bội lên, cúi đầu. Cửa khép lại. Trong phủ chỉ còn tiếng gió.' + statUp('tam', 1) + tamma(8); } },
        { t: 'Tự tay xé hôn thư trước', cls: 'danger', fn: () => { s.flags.engageBroken = true; relChange(n, -25); fame(25); mark(`Xé hôn thư với ${n.name} trước mặt trưởng lão`); return `Ngươi rút hôn thư ra, xé làm đôi trước mặt cả hai người. "Không phải các người từ hôn. Là ta không cần." Cả phủ chết lặng. Chuyện này lan khắp ${homeSect()?.n || 'thánh địa'} chỉ trong một ngày.`; } },
        {
          t: 'Hẹn mười năm sau lên lôi đài phân cao thấp',
          fn: () => { s.flags.engageBroken = true; s.flags.tenYearDuel = Math.floor(s.year) + 10; relChange(n, 5); mark(`Hẹn ${n.name} mười năm sau tỷ thí`); return `"Mười năm. Mười năm sau, trên lôi đài của thánh địa, ngươi sẽ biết mình bỏ lỡ điều gì." ${n.name} lần đầu ngẩng lên nhìn thẳng vào ngươi.` + statUp('tam', 2); },
        },
      ];
      if (n.rel >= 35) out.unshift({
        t: `Hỏi chính ${n.name} muốn gì`,
        cls: 'prime',
        fn: () => {
          if (ch(0.2 + (n.rel - 35) / 25 + s.stats.mi * 0.03)) {
            relChange(n, 25);
            mark(`${n.name} chống lại gia tộc, giữ hôn ước`);
            return `${n.name} bước lên, giật lại ngọc bội từ tay ${n.g === 'f' ? 'phụ thân' : 'mẫu thân'}. "Hôn ước là của con. Con không từ." Trưởng lão giận tím mặt, nhưng không giằng lại. Hôn ước vẫn còn.`;
          }
          s.flags.engageBroken = true;
          relChange(n, -5);
          return `${n.name} im lặng rất lâu. Cuối cùng chỉ nói: "Xin lỗi." Rồi quay đi. Ngọc bội nằm lại trên bàn.` + tamma(10);
        },
      });
      return out;
    },
  },

  // ----- Hẹn ước mười năm -----
  {
    id: 'bt_hendau',
    where: ['any'],
    w: 30,
    once: true,
    cond: () => !!s.flags.tenYearDuel && s.year >= s.flags.tenYearDuel && !!fz(),
    title: 'Hẹn ước mười năm',
    text: () => { const n = fz()!; return `Mười năm đã tới. Lôi đài giữa thánh địa chật kín người — ai cũng muốn xem "phế vật" bị ${thanhTu(n) === 'Thánh nữ' ? 'tiên tử' : 'thiên kiêu'} ${n.name} (${REALMS[n.r].n}) đánh bại thế nào.`; },
    ch: () => {
      const n = fz()!;
      return [
        {
          t: 'Bước lên lôi đài', cls: 'prime',
          fn: () => battle({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator' }, {
            lethal: false,
            win: () => { fame(120); relChange(n, 30); if (ch(0.7)) revealThap(); mark(`Thắng ${n.name} trên lôi đài hẹn ước mười năm`); return `${n.name} ngã xuống sàn đá. Cả quảng trường không một tiếng động. Rồi ${nang(n)} bật cười — một nụ cười vừa đau vừa nhẹ nhõm. "Hóa ra người mù là ta."`; },
            lose: () => `Ngươi bại. ${n.name} không nói gì, chỉ chìa tay kéo ngươi dậy trước mặt mọi người — một cử chỉ không ai hiểu nổi.` + statUp('tam', 1),
          }),
        },
        { t: 'Không tới', fn: () => { relChange(n, -20); fame(-20); return 'Ngươi không tới. Thiên hạ cười một trận, rồi quên.'; } },
      ];
    },
  },

  // ----- Thành hôn với hôn thê/hôn phu -----
  {
    id: 'bt_thanhhon',
    where: ['sect', 'any'],
    w: 20,
    once: true,
    minAge: 16,
    cond: () => !!fz() && !broken() && fz()!.rel >= 80,
    title: 'Đại hôn',
    text: () => { const n = fz()!; return `Hai nhà chọn ngày lành. ${n.name} khoác hỉ phục đỏ, đứng dưới cây hợp hoan trước điện. Lời đồn "phế vật" vẫn chưa tắt — nhưng hôm nay ${nang(n)} không quan tâm.`; },
    ch: () => [
      { t: 'Bái thiên địa', cls: 'prime', fn: () => wed(fz()!, `Ba lạy trời đất, hai lạy cao đường, một lạy nhau. Từ nay ngươi và ${fz()!.name} là đạo lữ.`) + money(M(80)) + gain('p:' + (effRi() >= 2 ? 'ngungnguyen' : 'tukhi'), 3) },
      { t: 'Hoãn lại', fn: () => 'Ngươi xin hoãn ngày cưới. Hai nhà không vui, nhưng chuyện vẫn để đó.' },
    ],
  },

  // ----- Hối hôn: thân phận lộ ra sau khi đã từ hôn -----
  {
    id: 'bt_hoihan',
    where: ['sect', 'any'],
    w: 12,
    once: true,
    cond: () => !!fz() && broken() && !thapHidden() && fz()!.rel > -60,
    title: 'Người cũ quay lại',
    text: () => { const n = fz()!; return `Tin ${hiddenRootName()} lan ra. Ngày hôm sau, ${n.g === 'f' ? 'phụ thân' : 'mẫu thân'} của ${n.name} mang ngọc bội cũ tới phủ, giọng khác hẳn năm xưa: "Năm đó là lão phu hồ đồ. Hôn ước... có thể nối lại chăng?" ${n.name} đứng ở cửa, không dám bước vào.`; },
    ch: () => {
      const n = fz()!;
      return [
        { t: 'Nối lại hôn ước', fn: () => { s.flags.engageBroken = false; relChange(n, 25); return `Ngươi nhận lại ngọc bội — không phải vì trưởng lão, mà vì người đứng ở cửa. ${n.name} khẽ thở ra.`; } },
        { t: 'Từ chối', cls: 'prime', fn: () => { fame(40); relChange(n, -10); return '"Ngọc bội này, năm ấy đã trả rồi." Ngươi tiễn khách. Thiên hạ lại có thêm một câu chuyện để kể.' + statUp('tam', 1); } },
      ];
    },
  },

  // ----- Gặp Thánh tử/nữ thánh địa khác (sau khi bị từ hôn) -----
  {
    id: 'bt_ngoai_gap',
    where: ['realm', 'sect', 'town', 'wild'],
    w: 8,
    once: true,
    minAge: 15,
    cond: () => broken() && !s.flags.outsider && !!homeSect(),
    title: () => (here().type === 'realm' ? 'Gặp gỡ trong bí cảnh' : 'Đại hội các thánh địa'),
    text: () => {
      const home = homeSect()!;
      const other = pick(Object.values(SECTS).filter((x) => x.tier === 4 && x.id !== home.id));
      const g2: 'm' | 'f' = s.g === 'm' ? 'f' : 'm';
      const n = meet({ r: Math.max(1, effRi()), st: 2, g: g2, sect: other.id, tag: 'acq', rel: 35, talent: 1.3, how: '' });
      n.how = `${g2 === 'f' ? 'Thánh nữ' : 'Thánh tử'} ${other.n}, gặp ngươi ${here().type === 'realm' ? `trong ${here().n}` : 'ở đại hội luận đạo của các thánh địa'}`;
      n.name = holyNpcName(other.id, g2) ?? n.name; // họ cố định của thánh địa
      s.flags.outsider = n.id;
      return here().type === 'realm'
        ? `Sâu trong ${here().n}, một con yêu thú canh bảo vật bất ngờ lao về phía người đứng cạnh ngươi — ${n.name}, ${thanhTu(n)} ${other.n}. Không kịp nghĩ, ngươi kéo ${nang(n)} ra sau lưng.`
        : `Đại hội luận đạo mười năm một lần của các thánh địa họp ở ${home.n}. Giữa buổi, khi mọi người đang cười nhạo "phế vật" ${s.name}, ${thanhTu(n)} ${other.n} — ${n.name} — đứng dậy, bước qua cả quảng trường tới ngồi cạnh ngươi: "Ngươi nói câu lúc nãy hay lắm. Nói tiếp đi."`;
    },
    ch: () => {
      const n = oth()!;
      return [
        {
          t: here().type === 'realm' ? 'Đỡ đòn thay người ấy' : 'Cùng người ấy luận đạo tới khuya', cls: 'prime',
          fn: () => {
            if (here().type === 'realm') {
              const r = battle({ name: 'Yêu thú canh bảo', r: Math.max(1, effRi()), kind: 'beast', el: 'loi' }, { lethal: false, win: () => `${n.name} nhìn ngươi, ánh mắt khác hẳn lúc trước.` });
              relChange(n, 30);
              return r + ` Lúc chia tay, ${nang(n)} để lại một lá truyền âm phù: "Có chuyện thì gọi ta."` + cult(20);
            }
            relChange(n, 28);
            return `Hai người tranh luận từ đạo ngũ hành tới đạo nhân tâm, tới khi đèn lồng tắt hết. ${n.name} đứng dậy, phủi áo: "Cả thánh địa của ngươi đều mù cả sao?"` + statUp('ngo', 1);
          },
        },
        { t: 'Giữ khoảng cách', fn: () => { relChange(n, 5); return `Ngươi chắp tay chào rồi lui đi. ${n.name} nhìn theo, nhíu mày như vừa gặp một câu đố.`; } },
      ];
    },
  },
  {
    id: 'bt_ngoai_thu',
    where: ['any'],
    w: 6,
    cd: 5,
    cond: () => !!oth() && oth()!.rel >= 50,
    title: 'Truyền âm phù',
    text: () => { const n = oth()!; return `Truyền âm phù trong túi sáng lên. Giọng ${n.name} vang nhỏ: "${s.name}, ${SECTS[n.sect!]?.n || 'thánh địa ta'} mấy hôm nay hoa đào nở. ${n.rel >= 75 ? 'Ta nhớ ngươi.' : 'Có rảnh thì tới xem.'}"`; },
    ch: () => {
      const n = oth()!;
      return [
        { t: 'Lên đường tới thăm', cls: 'prime', fn: () => { relChange(n, 12); years(0.2); return `Hai người dạo dưới rừng đào suốt ba ngày. Đệ tử ${SECTS[n.sect!]?.n} xì xào: ${thanhTu(n)} nhà họ chưa từng cười nhiều như vậy.` + cult(10); } },
        { t: 'Hồi âm vài câu', fn: () => { relChange(n, 4); return 'Ngươi gửi lại vài câu thơ vụng về. Nghe nói bên kia đọc xong cười cả buổi.'; } },
      ];
    },
  },
  {
    id: 'bt_ngoai_cauthan',
    where: ['any'],
    w: 15,
    once: true,
    minAge: 16,
    cond: () => !!oth() && oth()!.rel >= 80,
    title: 'Liên hôn thánh địa',
    text: () => { const n = oth()!; return `Sứ giả ${SECTS[n.sect!]?.n} mang sính lễ tới ${homeSect()?.n || 'nơi ngươi ở'}. Cả thánh địa náo loạn: ${thanhTu(n)} ${n.name} — thiên kiêu số một của họ — muốn kết đạo lữ với "phế vật" ${s.name}. Người nhà ${fz()?.name || 'cũ'} nghe tin, mặt xám như tro.`; },
    ch: () => [
      { t: 'Nhận lời', cls: 'prime', fn: () => wed(oth()!, `Ngươi nhận lời. Hôn lễ tổ chức ở cả hai thánh địa, chấn động Thương Lan.`) + (() => { fame(150); good(1); return money(M(150)); })() },
      { t: 'Chưa phải lúc', fn: () => { relChange(oth()!, -10); return 'Ngươi xin thêm thời gian. Sứ giả mang sính lễ về, người kia không trách — nhưng cũng không giấu được thất vọng.'; } },
    ],
  },
]);
void [hurt, RK, statUp];
