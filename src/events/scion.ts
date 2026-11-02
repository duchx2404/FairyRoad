// Công tử thánh địa "phế linh căn" (thật ra là Thập linh căn).
import { RMAX, effRi, register, s, M, money, cult, hurt, statUp, fame, good, evil, tamma, giveGear, gain, battle, ch, mark, flag, setFlag, learnTech, years, SECTS, REALMS, thapHidden, hiddenRootName, hiddenFlows, type NPC } from '../engine/api';
import { joinSect, leaveSect } from '../engine/sect';
import { revealThap } from '../engine/items';

const scion = () => (s.flags.holyScion ? SECTS[s.flags.holyScion] : null);
const atHome = () => !!scion() && s.loc === scion()!.loc;
const rival = (): NPC | null => s.npcs.find((n) => n.alive && n.tag === 'rival' && n.sect === s.flags.holyScion) || null;
const parent = (): NPC | null => s.npcs.find((n) => n.alive && n.tag === 'kin' && n.sect === s.flags.holyScion) || null;

register([
  {
    id: 'scion_anchoi',
    where: ['sect', 'town', 'market'],
    w: 6,
    cd: 6,
    cond: () => !!scion() && thapHidden(),
    title: 'Công tử thánh địa',
    text: () => `Đám con cháu trưởng lão rủ ngươi xuống ${s.loc === scion()!.loc ? 'chân núi' : 'phố'} uống rượu, nghe hát, đánh bạc bằng linh thạch. "Đằng nào cũng chẳng tu được, sống cho sướng đi, ${s.g === 'm' ? 'công tử' : 'tiểu thư'}!"`,
    ch: () => [
      { t: 'Ăn chơi thật — sống cho sướng', fn: () => { s.money = Math.max(0, s.money - M(30)); return 'Ba ngày ba đêm say khướt. Vui thì vui, nhưng tỉnh rượu thấy trong lòng trống rỗng.' + statUp('mi', 1) + tamma(8); } },
      { t: 'Đi cùng cho có, mượn tiếng ăn chơi để che mắt thiên hạ', cls: 'prime', fn: () => { years(0.25); return 'Ngươi ngồi bàn rượu cười cợt như mọi người, nhưng chén rượu đổ xuống gầm bàn. Đêm về, ngươi tu luyện tới sáng. Ai cũng tin ngươi là phế vật ăn chơi — đúng như ngươi muốn.' + cult(25); } },
      { t: 'Từ chối, ở nhà luyện công', fn: () => 'Đám bạn bĩu môi bỏ đi: "Phế vật còn bày đặt." Ngươi đóng cửa, ngồi xuống bồ đoàn.' + cult(15) },
    ],
  },
  {
    id: 'scion_nhucma',
    where: ['sect'],
    w: 6,
    cd: 8,
    cond: () => atHome() && !!rival() && thapHidden(),
    title: 'Tân Thánh tử',
    text: () => { const r = rival()!; return `${r.name} — người đang đội danh vị từng thuộc về ngươi — đi ngang qua giữa đám đệ tử vây quanh. ${r.g === 'm' ? 'Hắn' : 'Nàng'} dừng lại, nhìn ngươi từ đầu tới chân: "Ồ, phế ${s.g === 'm' ? 'công tử' : 'tiểu thư'} đây mà. Nghe nói hôm qua lại thua bạc? Thánh địa nuôi ngươi tốn linh thạch thật đấy."`; },
    ch: () => {
      const r = rival()!;
      return [
        { t: 'Cười xòa cho qua', fn: () => 'Ngươi cười, vái một vái thật sâu. Đám đệ tử cười ồ. Ngươi ghi nhớ từng khuôn mặt.' + statUp('tam', 1) },
        {
          t: 'Thách đấu ngay tại chỗ', cls: 'danger',
          fn: () => battle({ name: r.name, r: r.r, st: r.st, el: r.el, kind: 'cultivator' }, {
            lethal: false,
            win: () => { r.rel -= 20; fame(40); if (ch(0.6)) revealThap(); return `${r.name} ngã ngồi giữa quảng trường, mặt trắng bệch. Cả thánh địa im phăng phắc: "phế vật" vừa đánh bại Thánh tử.` + (s.flags.thapKnown ? ' Trưởng lão chấp pháp bước tới, nắm cổ tay ngươi bắt mạch — rồi tay ông run lên.' : ''); },
            lose: () => `Ngươi bị đánh văng ra. ${r.name} phủi tay áo: "Biết thân biết phận đi." Nhưng ${r.g === 'm' ? 'hắn' : 'nàng'} không nhận ra ngươi chịu được bao nhiêu đòn — một phế linh căn đáng lẽ không chịu nổi.` + hurt(15),
          }),
        },
      ];
    },
  },
  {
    id: 'scion_phumau',
    where: ['sect'],
    w: 4,
    cd: 15,
    cond: () => atHome() && !!parent() && thapHidden(),
    title: 'Người duy nhất tin ngươi',
    text: () => { const p = parent()!; return `${p.name} gọi ngươi vào động phủ. Người nhìn ngươi rất lâu, rồi chỉ hỏi: "Dạo này có ngủ được không?" Rồi thả vào tay ngươi một túi gấm.`; },
    ch: () => [
      { t: `Kể thật bí mật ${hiddenFlows()} hệ linh căn`, fn: () => { const p = parent()!; p.rel = 100; setFlag('parentKnows'); return `${p.name} im lặng rất lâu, rồi bật cười — tiếng cười của người đã giữ một nỗi lo suốt nhiều năm. "Giấu đi. Giấu tới khi không ai động được vào ngươi nữa." Người truyền cho ngươi một bộ công pháp từ kho riêng.` + learnTech(effRi() >= 2 ? 'nguhanhquyet' : 'ngunguyenquyet') + gain('p:' + (effRi() >= 2 ? 'trucco' : 'khaimach')); } },
      { t: 'Nhận túi gấm, giữ im lặng', fn: () => 'Trong túi có linh thạch và một viên đan. Ngươi cúi đầu cảm tạ.' + money(M(60)) + gain('p:' + (effRi() >= 2 ? 'ngungnguyen' : 'tukhi'), 2) },
    ],
  },
  {
    id: 'scion_phucvi',
    where: ['any'],
    w: 12,
    once: true,
    cond: () => !!scion() && !!s.flags.thapKnown && !s.flags.thanhtu,
    title: 'Thánh địa cầu phục vị',
    text: () => { const sc = scion()!; return `Tin ${s.name} mang ${hiddenRootName()} chấn động ${sc.n}. Thánh chủ đích thân triệu kiến, trước mặt các trưởng lão: "Năm ấy đá trắc linh không thấy được, là thánh địa mắt mù. Danh vị Thánh ${s.g === 'm' ? 'tử' : 'nữ'}, nay trả lại cho ngươi."`; },
    ch: () => {
      const sc = scion()!;
      const r = rival();
      return [
        {
          t: 'Nhận lại danh vị', cls: 'prime',
          fn: () => {
            const txt = s.sect?.id === sc.id ? (s.sect.rank = Math.max(s.sect.rank, 8), '') : joinSect(sc.id, 8);
            s.flags.thanhtu = sc.id;
            mark(`Được ${sc.n} phục vị Thánh ${s.g === 'm' ? 'tử' : 'nữ'}`);
            if (r) { r.rel -= 30; r.how += ' — nay bị giáng xuống, hận ngươi thấu xương'; }
            return `Lệnh bài Thánh ${s.g === 'm' ? 'tử' : 'nữ'} trở lại tay ngươi sau bao năm. ${r ? r.name + ' đứng ở góc điện, mặt xám như tro. ' : ''}${txt}` + learnTech(sc.tech, true) + giveGear(Math.min(RMAX(), effRi() + 1), 3);
          },
        },
        {
          t: 'Từ chối, phất áo rời thánh địa',
          fn: () => { delete s.flags.holyScion; if (s.sect?.id === sc.id) leaveSect(false); fame(80); good(1); mark(`Từ chối phục vị, rời ${sc.n}`); return `"Năm ấy các vị không thấy. Nay thấy rồi, cũng không cần nữa." Ngươi cúi chào ${parent()?.name || 'thân nhân'}, rồi bước xuống núi. Thiên hạ đồn ầm: kẻ từ chối cả thánh địa.` + statUp('tam', 2); },
        },
      ];
    },
  },
]);
void [evil, REALMS, flag];
