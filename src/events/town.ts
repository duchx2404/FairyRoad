// Sự kiện nơi người ở: thôn (village), thành trì (town), phường thị (market) và trên đường (road).
// Phủ ba giai đoạn: tuổi thơ phàm nhân / Luyện Khí · Trúc Cơ–Kết Đan · Nguyên Anh trở lên.
import { RMAX, effRi,
  register, s, M, gain, money, cult, hurt, heal, statUp, tamma, fame, good, evil, giveGear, learnSkill, lifeAdd,
  battle, cultivator, beast, mortal, meet, he, ch, ri, pick, fmt, root, age, realmN, here, mark, setFlag, flag,
  canPay, hasItem, lose, relChange, realmStage, inSect, sectName, contrib, npcTitle, years,
  SECTS, LOCS, REALMS, fight, fightSummary, type Choice, type NPC, type FoeSpec, type FightOpts, type Outcome,
} from '../engine/api';
import { canJoin, joinSect } from '../engine/sect';
import { HERBS, PILLS } from '../data/items';
import { BREAK_PILL } from '../data/core';
import { wedDaolu } from '../engine/relationships';

// ---------- Helper nhỏ dùng riêng trong gói này ----------

/** Người nhà còn sống. */
const kin = () => s.npcs.filter((n) => n.alive && n.tag === 'kin');
const npcAgeOf = (n: NPC) => Math.floor(s.year - n.born);
/** Đan tăng tu vi hợp cảnh giới. */
const CULT_PILL = ['tukhi', 'tukhi', 'ngungnguyen', 'hoanguyen', 'duonganh', 'hoathan', 'hoathan', 'hoathan', 'hoathan'];
const cultPill = (r = effRi()) => 'p:' + CULT_PILL[Math.max(0, Math.min(RMAX(), r))];
/** Đan đột phá lên cảnh giới kế tiếp (rỗng nếu đã Đại Thừa). */
const breakPill = (r = effRi()) => (BREAK_PILL[r + 1] ? 'p:' + BREAK_PILL[r + 1] : '');
const healPill = (r = effRi()) => (r >= 2 ? 'p:tucotthuc' : 'p:hoixuandan');
/** Linh thảo theo phẩm, ưu tiên loại mọc ở vùng hiện tại. */
function herb(t = effRi()): string {
  const tier = Math.max(1, Math.min(6, t));
  const all = Object.values(HERBS).filter((h) => h.tier === tier);
  const local = all.filter((h) => h.reg.includes(here().reg));
  return 'h:' + pick(local.length ? local : all).id;
}
/** Kẻ địch "người đời": phàm nhân nếu ngươi còn là phàm nhân, tu sĩ cùng cấp nếu không. */
const thug = (name: string, mult = 1, dr = 0): FoeSpec => (effRi() === 0 ? mortal(name, mult) : cultivator(name, dr, mult));
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const pay = (n: number) => money(-n);
/** Trôi qua một ít thời gian, trả về chuỗi rỗng để nối văn. */
const wait = (y: number) => (years(y), '');
/** Trang bị trong túi có thể đem đổi (bỏ qua món đang luyện hóa). */
const spareGear = () => s.gearBag.filter((g) => g.uid !== s.refining?.uid);
function takeGear() {
  const pool = spareGear();
  const g = pick(pool);
  s.gearBag.splice(s.gearBag.indexOf(g), 1);
  return g;
}
/** Như battle(), nhưng khi thắng có thể trả về Outcome nhiều bước. */
function fightThen(spec: FoeSpec, o: FightOpts & { win: () => Outcome; lose?: () => string; flee?: () => string }): Outcome {
  const r = fight(spec, o);
  const head = fightSummary(r);
  if (r.win) {
    const w = o.win();
    return typeof w === 'string' ? head + ' ' + w : { ...w, text: head + ' ' + w.text };
  }
  if (r.fled) return head + (o.flee ? ' ' + o.flee() : '');
  if (!r.died && o.lose) return head + ' ' + o.lose();
  return head;
}
/** Tông môn đang ở vùng gần (hoặc bất kỳ) sẵn lòng nhận người chơi; nhớ theo năm để text và lựa chọn khớp nhau. */
let recruitCache: { y: number; id: string } | null = null;
function recruitSect(): string {
  if (recruitCache && recruitCache.y === s.year) return recruitCache.id;
  const ok = Object.values(SECTS).filter((sc) => sc.tier <= 3 && canJoin(sc.id).ok);
  const near = ok.filter((sc) => LOCS[sc.loc].reg === here().reg);
  const pool = near.length ? near : ok;
  const id = pool.length ? pick(pool).id : '';
  recruitCache = { y: s.year, id };
  return id;
}
/** Bạn cũ đã mất (để gặp hậu duệ). */
const deadFriend = () => s.npcs.find((n) => !n.alive && n.rel >= 30 && ['friend', 'kin', 'daolu', 'peer', 'senior'].includes(n.tag));

register([
  // =====================================================================
  //  I. TUỔI THƠ PHÀM NHÂN · LUYỆN KHÍ
  // =====================================================================
  {
    id: 'town_thadieu',
    where: ['village'],
    w: 4,
    maxR: 0,
    maxAge: 12,
    cd: 3,
    title: 'Con diều mắc ngọn đa',
    text: () => 'Gió chiều thổi mạnh, con diều giấy của ngươi đứt dây, mắc lên ngọn cây đa đầu làng. Lũ trẻ đứng dưới gốc ngửa cổ nhìn. Cây cao chừng năm trượng, cành mục lốm đốm.',
    ch: () => [
      {
        t: 'Xắn quần trèo lên lấy',
        cls: 'prime',
        fn: () => {
          if (ch(0.45 + s.stats.can * 0.04)) {
            const extra = ch(0.12 + s.stats.van * 0.02)
              ? ' Trong hốc cây gần ngọn có một miếng ngọc lạnh ngắt, sờ vào thấy đầu óc tỉnh hẳn. Ngươi lén nhét vào áo.' + gain('x:ngocgian')
              : '';
            return 'Ngươi bám từng cành như con sóc, gỡ được diều xuống. Lũ trẻ reo hò, từ nay gọi ngươi là "đại ca".' + statUp('can', 1) + extra;
          }
          return 'Đến lưng chừng thì cành gãy rắc. Ngươi rơi xuống đống rơm, may không gãy xương nhưng mông tím bầm ba ngày, lại bị mẹ đánh thêm một trận.' + hurt(15);
        },
      },
      { t: 'Nhờ ông lão chăn trâu lấy giùm', fn: () => 'Ông lão cười khà khà, vung cây sào một cái là diều rơi xuống. Ông bảo: "Muốn lên cao thì phải có cái sào dài, con ạ. Đời cũng vậy."' + statUp('ngo', 1) },
      { t: 'Bỏ, về làm diều mới', fn: () => 'Ngươi về nhà cắt tre dán giấy. Con diều mới xiêu vẹo nhưng bay được. Thì ra tự làm cũng vui.' },
    ],
  },
  {
    id: 'town_hocchu',
    where: ['village', 'town'],
    w: 4,
    maxR: 0,
    maxAge: 14,
    once: true,
    title: 'Lớp học của thầy đồ',
    text: () => `Ở ${here().n} có thầy đồ già mở lớp dạy chữ dưới mái hiên, mỗi tháng thu một đấu gạo. Tiếng trẻ con đọc "nhân chi sơ" lẫn với tiếng gà mổ thóc ngoài sân.`,
    ch: () => [
      {
        t: 'Xin nhà cho đi học',
        cls: 'prime',
        fn: () => 'Ngươi học chậm mà chắc. Thầy đồ hay gõ thước vào đầu ngươi, nhưng cuối năm lại cho ngươi mượn một cuốn sách chép tay về núi non sông biển.' + statUp('ngo', 1) + statUp('tam', 1),
      },
      { t: 'Trốn học đi bắt dế', fn: () => 'Ngươi nằm bờ ruộng cả mùa hè. Chữ không biết mấy, nhưng con dế lửa của ngươi đá thắng cả xóm. Trẻ con xóm trên phải nộp kẹo cho ngươi.' + statUp('van', 1) },
      { t: 'Đứng ngoài cửa sổ nghe lén', fn: () => 'Không có gạo nộp, ngươi đứng ngoài hiên nghe trộm. Một hôm thầy đồ mở cửa sổ, ném ra cái ghế đẩu: "Đứng mỏi chân thì ngồi."' + statUp('ngo', 1) },
    ],
  },
  {
    // chuỗi nhiều bước
    id: 'town_kiemquang',
    where: ['village'],
    w: 3,
    maxR: 0,
    minAge: 7,
    maxAge: 16,
    once: true,
    title: 'Vệt sáng rơi xuống bãi lau',
    text: () => 'Đêm ấy có một vệt sáng xanh xé ngang trời rồi rơi xuống bãi lau sau làng. Sáng ra ngươi lén đi xem: một người áo rách nằm sấp trong bùn, bên cạnh là thanh kiếm gãy còn rung khe khẽ.',
    ch: () => [
      {
        t: 'Lại gần xem người đó còn sống không',
        cls: 'prime',
        fn: () => ({
          text: 'Người đó còn thở. Là một nữ tu trẻ, môi tím tái, vai cắm một cái gai đen. Nàng hé mắt: "Nước... và đừng cho ai biết ta ở đây."',
          choices: [
            {
              t: 'Giấu nàng vào lều canh vịt, ngày ngày mang cơm nước',
              cls: 'prime',
              fn: () => {
                good(3);
                const n = meet({ r: 3, g: 'f', tag: 'friend', rel: 55, how: 'Nữ tu được ngươi cứu ở bãi lau lúc nhỏ', sect: null });
                mark(`Lúc nhỏ cứu ${n.name} bị thương rơi xuống bãi lau`);
                const reward = root().m > 0 ? gain('p:khaimach') : statUp('can', 2);
                return {
                  text: `Bảy ngày sau nàng đứng dậy được. Trước khi đi, nàng xoa đầu ngươi: "Ta là ${n.name}. Ân này ta ghi nhớ." Nàng để lại một bình sứ nhỏ, rồi hóa thành vệt sáng biến mất.` + reward,
                  choices: [
                    { t: 'Hỏi nàng có thể dạy ta không', fn: () => 'Giọng nàng vọng lại từ trên mây: "Lớn thêm chút nữa, tự tìm đến tông môn. Tiên lộ phải tự mình bước." Ngươi nhớ câu ấy suốt đời.' + statUp('tam', 1) },
                    { t: 'Vẫy tay tạm biệt', fn: () => 'Ngươi đứng nhìn trời đến khi cổ mỏi. Từ đó, ngươi hay ngẩng đầu nhìn mây.' },
                  ],
                };
              },
            },
            {
              t: 'Chạy về báo cho trưởng thôn',
              fn: () => {
                if (ch(0.5)) return 'Trưởng thôn dẫn trai làng ra thì bãi lau chỉ còn vết bùn. Người kia đã đi. Cả làng cười ngươi nằm mơ.';
                return 'Trưởng thôn chưa kịp tới, một gã áo đen đã đáp xuống bãi lau. Có tiếng hét ngắn ngủi, rồi im bặt. Đêm ấy ngươi không ngủ được.' + tamma(5);
              },
            },
          ],
        }),
      },
      {
        t: 'Nhặt thanh kiếm gãy rồi chạy',
        fn: () => {
          evil(1);
          return 'Ngươi ôm mảnh kiếm chạy một mạch về nhà, giấu dưới gầm giường. Đêm đêm nó lạnh buốt như tảng băng. Về sau đem bán cho thợ rèn, được một nắm tiền.' + money(M(8));
        },
      },
      { t: 'Sợ quá, quay về', fn: () => 'Ngươi chạy về, trùm chăn kín đầu. Hôm sau ra xem thì chỉ còn một vũng bùn cháy đen.' },
    ],
  },
  {
    id: 'town_nhagapnan',
    where: ['village'],
    w: 3,
    maxR: 0,
    maxAge: 18,
    cd: 10,
    cond: () => kin().length > 0,
    title: 'Năm mất mùa',
    text: () => {
      const k = kin()[0];
      return `Mưa đá trút xuống giữa mùa lúa trổ bông. Ruộng nhà ngươi nát như bị trâu giẫm. ${k.name} ngồi ở bậc cửa, cả đêm không nói câu nào. Kho thóc chỉ đủ ăn đến tết.`;
    },
    ch: () => [
      {
        t: 'Lên thành làm thuê',
        cls: 'prime',
        fn: () => {
          years(1);
          return 'Ngươi khuân vác ở bến thuyền cả năm, vai sưng vù. Tiền gửi về đủ cho nhà qua mùa giáp hạt.' + statUp('can', 1) + money(M(4)) + ' ' + (ch(0.3) ? 'Chủ bến thấy ngươi chịu khó, thưởng thêm một bao gạo.' : '');
        },
      },
      {
        t: 'Vào núi đào củ, hái thuốc',
        fn: () => {
          if (ch(0.3 + s.stats.van * 0.03)) return 'Trong khe đá ngươi thấy một cây cỏ lá đỏ như máu. Thầy lang dưới chợ trả giá cao, cả nhà mừng rơi nước mắt.' + gain('h:xichdiepthao') + money(M(6));
          return 'Ngươi bị lạc hai ngày, rắn cắn một phát vào chân, mang về được nửa gùi củ mài.' + hurt(20);
        },
      },
      {
        t: 'Thắp hương miếu thổ địa cầu xin',
        fn: () => (ch(0.2) ? 'Đêm ấy ngươi mơ một ông lão râu bạc chỉ tay về góc vườn. Sáng ra đào thử, được một hũ tiền đồng cũ.' + money(M(5)) + statUp('van', 1) : 'Hương tàn. Thổ địa không nói gì. Cả nhà ăn cháo loãng suốt mùa đông.' + hurt(5)),
      },
    ],
  },
  {
    // chuỗi nhiều bước — tiên sư thu đồ
    id: 'town_thudo',
    where: ['village', 'town'],
    w: 5,
    maxR: 1,
    minAge: 8,
    maxAge: 30,
    cd: 6,
    cond: () => !s.sect && root().m > 0 && !!recruitSect(),
    title: () => `${SECTS[recruitSect()].n} xuống núi thu đồ`,
    text: () => {
      const sc = SECTS[recruitSect()];
      return `Chuông đồng ở ${here().n} vang ba hồi. Một chiếc thuyền mây đáp xuống bãi đất trống, trên đó là một trung niên mặc đạo bào thêu hiệu ${sc.n}. Ông ta cầm một viên đá trắng: "Ai có linh căn, đặt tay lên đây. Không có thì đừng chen."`;
    },
    ch: () => {
      const id = recruitSect();
      const sc = SECTS[id];
      return [
        {
          t: 'Chen lên đặt tay vào đá',
          cls: 'prime',
          fn: () => ({
            text: `Viên đá sáng lên ${root().q >= 4 ? 'rực rỡ, ánh sáng chói đến mức tiên sư phải nheo mắt' : 'lờ mờ như đom đóm'}. Tiên sư gật đầu: "Còn một ải nữa. Leo hết chín trăm bậc đá kia trước khi nén hương tàn."`,
            choices: [
              {
                t: 'Cắn răng leo',
                cls: 'prime',
                fn: () => {
                  if (ch(0.45 + s.stats.can * 0.04 + s.stats.tam * 0.04)) return 'Đến bậc thứ tám trăm thì chân ngươi đã không còn cảm giác, nhưng ngươi vẫn bò lên. Tiên sư nhìn ngươi lâu một chút rồi nói: "Lên thuyền."\n' + joinSect(id);
                  return 'Hương tàn khi ngươi còn cách đỉnh trăm bậc. Tiên sư lắc đầu, thuyền mây cất cánh. Ngươi ngồi bệt trên đá, gió thổi khô nước mắt.' + statUp('tam', 1);
                },
              },
              {
                t: `Dúi linh thạch vào tay áo tiên sư (${fmt(M(30))})`,
                dis: !canPay(M(30)),
                hint: 'Đi cửa sau',
                fn: () => {
                  if (ch(0.6)) return pay(M(30)).trim() + ' Tiên sư ho một tiếng, mắt nhìn chỗ khác: "Bậc đá hôm nay trơn, miễn đi." \n' + joinSect(id);
                  evil(1);
                  return 'Tiên sư biến sắc, phẩy tay áo hất ngươi ngã chổng vó: "Đồ hủ bại!" Linh thạch rơi tung tóe, bị đám đông nhặt sạch.' + pay(M(30));
                },
              },
            ],
          }),
        },
        { t: 'Đứng xem rồi về', fn: () => `Ngươi đứng ngoài nhìn những đứa trẻ khác bước lên thuyền mây. Đường tu tiên đâu chỉ có một cửa vào ${sc.n}.` },
      ];
    },
  },
  {
    id: 'town_bitnat',
    where: ['village', 'town'],
    w: 4,
    maxR: 0,
    maxAge: 15,
    cd: 4,
    title: 'Con nhà địa chủ',
    text: () => 'Thằng con trai nhà địa chủ họ Bành cùng ba đứa tôi tớ chặn ngươi ở đầu ngõ, giật cái bánh nếp mẹ ngươi vừa gói. Nó cắn một miếng rồi nhổ xuống đất: "Bánh nhà nghèo, nhạt như nước ốc."',
    ch: () => [
      {
        t: 'Xông vào đánh',
        cls: 'danger',
        fn: () =>
          battle(mortal('Bành thiếu gia và lũ tôi tớ', 1.3), {
            lethal: false,
            win: () => {
              fame(2);
              return 'Ngươi đè nó xuống bùn, cả lũ tôi tớ chạy mất dép. Tối đó nhà địa chủ sang làm ầm, nhưng cả xóm đứng về phía ngươi.' + statUp('can', 1);
            },
            lose: () => 'Ngươi bị đánh bầm mắt, áo rách tơi tả. Nhưng từ đó thằng kia gặp ngươi là lảng đi, chắc sợ cái kiểu cắn tay của ngươi.' + hurt(15),
          }),
      },
      { t: 'Nhặt bánh lên, lặng lẽ bỏ đi', fn: () => 'Ngươi phủi đất, đem bánh về cho con chó nhà mình. Có những món nợ, nhớ là được rồi.' + statUp('tam', 1) },
      { t: 'Nói dối là trong bánh có thuốc chuột', fn: () => 'Thằng kia tái mặt, móc họng nôn thốc nôn tháo, cả buổi chiều không dám ra khỏi nhà. Ngươi cười đến đau bụng.' + statUp('mi', 1) },
    ],
  },
  {
    id: 'town_nhansamgia',
    where: ['market', 'town'],
    w: 4,
    maxR: 1,
    cd: 5,
    title: 'Củ sâm ngàn năm giá rẻ',
    text: () => 'Một gã mặt rỗ trải chiếu ở góc chợ, bày một củ "huyết sâm ngàn năm" to bằng bắp chân, rễ đỏ lòe. "Nhà có tang, bán gấp! Chỉ lấy giá một bữa rượu!"',
    ch: () => [
      {
        t: `Mua (${fmt(M(6))} linh thạch)`,
        dis: !canPay(M(6)),
        fn: () => {
          const p = pay(M(6));
          if (ch(0.15 + s.stats.van * 0.02)) return p + ' Về nhà gọt thử, củ sâm thì là giả, nhưng giữa ruột lại kẹp một cây linh chi thật — chắc gã kia nhặt nhầm trong núi mà không biết.' + gain('h:baclinhchi');
          return p + ' Về nhà ngâm nước, màu đỏ trôi sạch, lộ ra củ cải trắng phau. Nấu canh cũng khá ngọt.';
        },
      },
      {
        t: 'Bẻ thử một rễ trước mặt hắn',
        fn: () => {
          if (s.stats.ngo >= 6 || effRi() >= 1) {
            fame(1);
            return 'Ngươi bẻ đôi một rễ, nhựa trắng chảy ra, mùi củ cải bốc lên. Đám đông cười ồ. Gã mặt rỗ cuốn chiếu chạy, rơi lại vài đồng.' + money(M(2));
          }
          return 'Ngươi chưa kịp bẻ thì gã đã giật lại, chửi ngươi phá đám, lại sai đàn em đẩy ngươi ngã vào sọt cá.' + hurt(5);
        },
      },
      { t: 'Lắc đầu đi qua', fn: () => 'Của rẻ là của ôi. Ngươi đi qua, nghe sau lưng có người vừa móc hầu bao.' },
    ],
  },
  {
    id: 'town_bikiprom',
    where: ['market'],
    w: 4,
    maxR: 2,
    cd: 6,
    title: 'Cửu Thiên Thần Long Bá Thể Quyết',
    text: () => 'Một lão già mù một mắt ngồi sau chồng sách ố vàng. Cuốn trên cùng ghi chữ to bằng nắm tay: "Cửu Thiên Thần Long Bá Thể Quyết — tu ba tháng thành tiên". Lão nháy con mắt còn lại: "Chỉ một bản. Hữu duyên mới bán."',
    ch: () => [
      {
        t: `Mua liền (${fmt(M(15))})`,
        dis: !canPay(M(15)),
        fn: () => {
          const p = pay(M(15));
          if (ch(0.1 + s.stats.van * 0.015)) return p + ' Nội dung đúng là nhảm nhí, chép lại từ ba cuốn sách khác. Nhưng bìa sách được dán bằng một mảnh ngọc giản mỏng — thứ đó mới là đồ thật.' + gain('x:ngocgian');
          if (ch(0.3)) return p + ' Ngươi tập theo sách ba ngày, khí huyết đảo lộn, nằm liệt giường nửa tháng. Trang cuối có dòng chữ nhỏ: "Kẻ ngu tu sẽ chết, kẻ khôn đọc sẽ cười."' + hurt(20);
          return p + ' Đọc hết, ngươi chỉ học được một điều: trên đời không có thần công nào tu ba tháng thành tiên.' + statUp('tam', 1);
        },
      },
      {
        t: 'Xin đọc thử trang đầu',
        fn: () => (s.stats.ngo >= 6 ? 'Mới đọc ba dòng ngươi đã thấy ngay chỗ sai: kinh mạch ghi ngược chiều. Ngươi đặt sách xuống, lão già thở dài: "Mắt tinh thế, đi nơi khác mà kiếm cơm."' + statUp('ngo', 1) : 'Lão già giật lại: "Đọc thử thì còn gì là bí kíp?" Ngươi đành đi.'),
      },
      { t: 'Bỏ đi', fn: () => 'Tu ba tháng thành tiên thì lão đã không phải ngồi đây.' },
    ],
  },
  {
    id: 'town_acba',
    where: ['town', 'village'],
    w: 4,
    maxR: 1,
    cd: 6,
    title: 'Hổ Què thu tiền bảo kê',
    text: () => `Quán bánh bao của bà góa đầu phố ${here().n} bị lật tung. Gã đồ tể tên Hổ Què, chân thọt nhưng tay to như cột đình, đạp lên lồng hấp: "Tháng này thiếu nửa xâu tiền. Thiếu là phải trả bằng cái quán."`,
    ch: () => [
      {
        t: 'Ra tay dạy cho hắn một bài học',
        cls: 'danger',
        fn: () =>
          battle(thug('Hổ Què và đám đầu gấu', effRi() === 0 ? 1.8 : 0.6, 0), {
            lethal: effRi() > 0,
            win: () => {
              good(2);
              fame(4);
              return 'Hổ Què ôm cái chân còn lại mà kêu như lợn bị chọc tiết. Bà góa dúi cho ngươi một xửng bánh bao nóng, nhất định không cho từ chối.';
            },
            lose: () => 'Ngươi bị quăng ra giữa đường, mặt dính đầy bột. Hổ Què cười hô hố. Nhưng hôm sau hắn cũng không quay lại — chắc ngại phiền.' + hurt(20),
          }),
      },
      {
        t: `Trả tiền thay bà (${fmt(M(3))})`,
        dis: !canPay(M(3)),
        fn: () => {
          good(1);
          return pay(M(3)).trim() + ' Hổ Què nhận tiền, nhổ toẹt một bãi rồi đi. Bà góa khóc, nói tháng sau hắn lại tới. Ngươi biết bà nói đúng.';
        },
      },
      {
        t: 'Lên huyện nha tố cáo',
        fn: () =>
          ch(0.4)
            ? 'Huyện úy mới nhậm chức, đang cần thành tích. Hổ Què bị đánh hai mươi trượng, phố xá yên được nửa năm.' + statUp('mi', 1)
            : 'Nha dịch nghe xong cười khẩy: Hổ Què là em vợ của chủ bộ. Ngươi bị đuổi ra, lại bị đầu gấu chặn đánh ở đầu ngõ.' + hurt(10),
      },
    ],
  },
  {
    id: 'town_tuulau',
    where: ['town'],
    w: 4,
    maxR: 5,
    cd: 5,
    title: 'Chuyện bên bàn rượu',
    text: () => `Tửu lâu lớn nhất ${here().n} chật kín người. Bàn bên cạnh, mấy tu sĩ say ngà ngà đang bàn tán rôm rả: chuyện bí cảnh sắp mở, chuyện ai vừa vớ được bảo vật ở nhà đấu giá, chuyện tông nào vừa có trưởng lão tọa hóa.`,
    ch: () => [
      {
        t: `Gọi thêm một vò rượu mời cả bàn (${fmt(M(4))})`,
        dis: !canPay(M(4)),
        cls: 'prime',
        fn: () => {
          const p = pay(M(4));
          const rs = Object.values(LOCS).filter((l) => l.type === 'realm' && (l.minRealm ?? 0) <= effRi() + 1);
          const r = rs.length ? pick(rs) : null;
          if (ch(0.35)) return p + ' Một gã say khướt vỗ ngực, móc ra một mảnh da thuộc: "Ta... không cần nữa. Tặng huynh đệ!" Sáng hôm sau hắn đã đi mất.' + gain('x:banddo');
          return p + ` Rượu vào lời ra. Ngươi biết được ${r ? `${r.n} ở ${LOCS[r.id].reg === here().reg ? 'ngay trong vùng này' : 'phương xa'} sắp tới kỳ cấm chế lỏng` : 'mấy hiểm địa gần đây đang có yêu thú hóa hình'}, lại kết thêm vài người quen.` + statUp('mi', 1);
        },
      },
      { t: 'Ngồi yên lặng nghe', fn: () => 'Ngươi nhấm chén trà, nghe hết chuyện này đến chuyện khác. Một nửa là khoác lác, nửa kia là khoác lác có căn cứ.' + statUp('ngo', 1) },
      {
        t: 'Bàn kia to tiếng quá, nhắc họ khẽ chứ',
        cls: 'danger',
        fn: () =>
          ch(0.5)
            ? 'Mấy tu sĩ liếc nhau rồi hạ giọng, có người còn chắp tay xin lỗi. Hóa ra người say cũng biết điều.'
            : battle(cultivator('Tu sĩ say rượu', 0, 0.9), { lethal: false, win: () => { fame(3); return 'Ngươi quẳng hắn qua lan can xuống sông. Cả tửu lâu vỗ tay.'; }, lose: () => 'Ngươi bị đánh văng xuống cầu thang, chủ quán bắt đền bàn ghế.' + pay(M(3)) }),
      },
    ],
  },
  {
    id: 'town_cuocde',
    where: ['town', 'market'],
    w: 3,
    maxR: 3,
    cd: 5,
    title: 'Sòng xúc xắc',
    text: () => 'Sau hiệu cầm đồ có một gian nhà tối mùi mồ hôi và rượu rẻ. Ba con xúc xắc lăn trên mâm đồng, tiếng hò hét như sấm. Nhà cái có bộ râu dê, cười híp mắt mời ngươi ngồi.',
    ch: () => [
      {
        t: `Đặt cược (${fmt(M(8))})`,
        dis: !canPay(M(8)),
        fn: () => {
          if (ch(0.4 + s.stats.van * 0.015)) return 'Ba mặt sáu. Cả sòng im phăng phắc rồi nổ tung. Ngươi ôm tiền ra cửa, cố không ngoảnh lại.' + money(M(8));
          return 'Ngươi thua. Rồi thua tiếp. Nhà cái vẫn cười híp mắt.' + pay(M(8));
        },
      },
      {
        t: 'Dùng linh lực lật ngầm xúc xắc',
        dis: effRi() < 1,
        hint: effRi() < 1 ? 'Cần là tu sĩ' : 'Ăn gian',
        cls: 'danger',
        fn: () => {
          evil(1);
          if (ch(0.65)) return 'Mỗi ván ngươi chỉ khẽ thở ra một luồng linh khí. Nhà cái mặt xám như tro, đến ván thứ mười thì đóng sòng.' + money(M(25));
          return {
            text: 'Con xúc xắc đột nhiên khựng lại giữa chừng. Từ sau rèm bước ra một người đàn bà áo đỏ, ngón tay kẹp một lá bùa: "Ăn gian trên đất của ta à?"',
            choices: [
              { t: 'Đánh', cls: 'danger', fn: () => battle(cultivator('Bà chủ sòng bạc', 0, 1.1), { win: () => 'Bà ta bỏ chạy, để lại cả két tiền.' + money(M(30)), lose: () => 'Ngươi bị đánh ra khỏi cửa, túi tiền bị lột sạch một nửa.' + pay(Math.floor(s.money / 2)) }) },
              { t: 'Xin lỗi, đền tiền', fn: () => 'Ngươi cúi đầu, móc tiền ra đền gấp đôi. Bà ta cười nhạt, cho ngươi đi.' + pay(Math.min(s.money, M(16))) },
            ],
          };
        },
      },
      { t: 'Bỏ đi', fn: () => 'Mười người vào sòng, chín người ra trần. Ngươi không muốn làm người thứ mười để biết.' },
    ],
  },
  {
    id: 'town_moctui',
    where: ['town', 'market'],
    w: 4,
    maxR: 2,
    cd: 4,
    title: 'Bàn tay trong tay áo',
    text: () => 'Giữa phố đông, ngươi chợt thấy hông nhẹ hẳn. Một thằng bé gầy nhom đang len qua đám người, tay ôm túi tiền của ngươi, chạy nhanh như chuột.',
    ch: () => [
      {
        t: 'Đuổi theo',
        cls: 'prime',
        fn: () => {
          if (ch(0.55 + effRi() * 0.15)) {
            return {
              text: 'Ngươi tóm được cổ áo nó ở cuối hẻm. Thằng bé run cầm cập, sau lưng nó là căn lều rách, có một đứa em gái ho sù sụ.',
              choices: [
                { t: 'Lấy lại túi tiền, cho thêm vài đồng', fn: () => { good(2); return 'Ngươi để lại ít tiền mua thuốc. Thằng bé lạy ngươi ba lạy, mắt đỏ hoe.' + pay(Math.min(s.money, M(2))); } },
                { t: 'Lấy lại túi tiền, đánh cho nó một trận', fn: () => { evil(1); return 'Ngươi tát nó hai cái rồi bỏ đi. Sau lưng, tiếng ho của đứa em vẫn không dứt.' + tamma(3); } },
                {
                  t: 'Nhận nó làm sai vặt',
                  fn: () => {
                    const n = meet({ r: 0, g: 'm', tag: 'acq', rel: 40, how: 'Thằng bé móc túi ngươi từng thu nhận', sect: null, age: 11, talent: ch(0.3) ? 0.8 : 0 });
                    good(1);
                    return `Thằng bé tên ${n.name}. Nó nhanh tay nhanh mắt, biết hết ngóc ngách trong thành, sau này mua bán đỡ cho ngươi khối việc.` + statUp('mi', 1);
                  },
                },
              ],
            };
          }
          return 'Nó chui vào cống, biến mất. Ngươi đứng giữa đường, tay trắng.' + pay(Math.min(s.money, M(5)));
        },
      },
      { t: 'Thôi kệ, của đi thay người', fn: () => 'Ngươi tặc lưỡi. Từ nay phải buộc túi tiền chặt hơn.' + pay(Math.min(s.money, M(5))) },
    ],
  },
  {
    id: 'town_road_soncat',
    where: ['road'],
    w: 5,
    maxR: 2,
    cd: 3,
    title: 'Sơn tặc chặn đường',
    text: () => `Đường vắng, hai bên là rừng tre. Một cây gỗ lớn đổ chắn ngang, từ trong bụi nhảy ra năm sáu tên ${effRi() === 0 ? 'cầm dao rựa' : 'đeo pháp khí rỉ sét'}: "Đường này ta mở, cây này ta trồng..."`,
    ch: () => [
      {
        t: 'Rút binh khí',
        cls: 'danger',
        fn: () =>
          battle(thug('Sơn tặc', 1.3, 0), {
            win: () => {
              fame(2);
              return 'Bọn chúng bỏ chạy tán loạn, quên cả cái bao tải chứa của cướp được hôm trước.' + money(M(10)) + (ch(0.3) ? gain(herb(Math.max(1, effRi()))) : '');
            },
            lose: () => 'Ngươi bị trói vào gốc cây, lột sạch tiền.' + pay(Math.floor(s.money * 0.4)),
          }),
      },
      { t: `Nộp tiền mãi lộ (${fmt(M(5))})`, dis: !canPay(M(5)), fn: () => 'Tên đầu sỏ đếm tiền, cười khà khà rồi dẹp cây cho ngươi đi.' + pay(M(5)) },
      {
        t: 'Bỏ chạy vào rừng',
        fn: () => (ch(0.55 + s.stats.van * 0.03) ? 'Ngươi luồn qua rừng tre, mất nửa ngày đường nhưng giữ được tiền.' + wait(0.05) : 'Ngươi vấp rễ cây ngã sấp, bị đuổi kịp, ăn mấy gậy rồi bị lột túi.' + hurt(15) + pay(Math.floor(s.money * 0.3))),
      },
    ],
  },
  {
    id: 'town_bamoi',
    where: ['village', 'town'],
    w: 3,
    maxR: 1,
    minAge: 16,
    maxAge: 40,
    once: true,
    title: 'Bà mối gõ cửa',
    text: () => `Bà mối béo tròn, môi đỏ chót, ngồi chễm chệ giữa nhà: "Nhà họ ${pick(['Lâm', 'Trịnh', 'Phùng', 'Đào'])} bên kia sông có ${s.g === 'm' ? 'cô con gái' : 'cậu con trai'} vừa ngoan vừa đảm, tám chữ hợp với ${s.g === 'm' ? 'cậu' : 'cô'} như nồi với vung!"`,
    ch: () => [
      {
        t: 'Gật đầu',
        cls: 'prime',
        fn: () => {
          const n = meet({ r: 0, g: s.g === 'm' ? 'f' : 'm', tag: 'kin', rel: 60, how: s.g === 'm' ? 'Người vợ phàm trần' : 'Người chồng phàm trần', sect: null, age: Math.max(16, Math.floor(age()) - ri(0, 3)), talent: 0 });
          n.spouseRole = 'concubine';
          mark(`Thành thân với ${n.name}`);
          good(1);
          return `Pháo nổ đỏ ngõ. ${n.name} e lệ dưới khăn trùm đầu. Những ngày sau đó bình dị như nồi cơm sôi mỗi sáng. Nhưng ngươi biết, nếu bước lên tiên lộ, một ngày nào đó ${he(n)} sẽ già đi trước mắt ngươi.` + tamma(-10);
        },
      },
      { t: 'Từ chối, nói còn muốn tu đạo', fn: () => 'Bà mối bĩu môi: "Tu với chả tiên, mai kia không ai thắp hương cho đâu!" Ngươi tiễn bà ra ngõ, lòng trống trải một chút.' + statUp('tam', 1) },
      { t: 'Hỏi bà mối có nhận tiền mai mối không', fn: () => 'Bà mối tưởng ngươi muốn làm nghề, nhiệt tình kể cả buổi chiều cách se duyên. Đến tối ngươi biết thêm chuyện của nửa huyện.' + statUp('mi', 1) },
    ],
  },
  {
    id: 'town_thanmat',
    where: ['village', 'town'],
    w: 6,
    cd: 4,
    cond: () => kin().some((n) => n.r === 0 && npcAgeOf(n) >= 58),
    title: 'Ngọn đèn sắp tắt',
    text: () => {
      const k = kin().find((n) => n.r === 0 && npcAgeOf(n) >= 58)!;
      return `Tin nhắn từ quê nhà: ${k.name} đã ${npcAgeOf(k)} tuổi, nằm liệt giường, ăn không vào, cứ gọi tên ngươi trong mơ. ${effRi() >= 2 ? `Với ngươi bây giờ, ${npcAgeOf(k)} năm chỉ như một lần bế quan.` : ''}`;
    },
    ch: () => {
      const k = kin().find((n) => n.r === 0 && npcAgeOf(n) >= 58)!;
      const die = (cause: string) => {
        k.alive = false;
        k.died = s.year;
        k.cause = cause;
      };
      const c: Choice[] = [
        {
          t: 'Lập tức trở về',
          cls: 'prime',
          fn: () => {
            die('già yếu, mất trong vòng tay ngươi');
            good(2);
            mark(`Tiễn ${k.name} về nơi chín suối`);
            return `Ngươi về kịp. ${k.name} nắm tay ngươi, bàn tay nhẹ như chiếc lá khô: "Đi đường xa... nhớ mặc ấm." Rồi ${he(k)} nhắm mắt, nét mặt như đang ngủ. Ngươi đốt nén hương cuối, quỳ đến sáng.` + tamma(-15) + statUp('tam', 1);
          },
        },
        {
          t: 'Gửi tiền về, việc tu luyện không thể dừng',
          fn: () => {
            die('già yếu, ra đi khi ngươi không ở bên');
            return `Ngươi gửi về một túi tiền. Tháng sau có tin ${k.name} đã đi. Người ta nói lúc cuối ${he(k)} vẫn nhìn ra cổng.` + pay(Math.min(s.money, M(5))) + tamma(15);
          },
        },
      ];
      if (effRi() >= 1 && (hasItem('p:diennien') || hasItem('p:hoixuandan')))
        c.splice(1, 0, {
          t: 'Mang đan dược về, cố níu kéo',
          fn: () => {
            if (hasItem('p:diennien')) {
              lose('p:diennien');
              k.life += 12;
              return `Ngươi đút một viên Diên Niên Đan vào miệng ${k.name}. Sáng hôm sau ${he(k)} ngồi dậy đòi ăn cháo. Phàm thân không chịu nổi dược lực mạnh, nhưng cũng thêm được dăm năm bên con cháu.` + tamma(-10);
            }
            lose('p:hoixuandan');
            die('già yếu, uống đan dược cũng không giữ được');
            return `Hồi Xuân Đan chữa được thương, không chữa được tuổi già. ${k.name} tỉnh lại được một buổi chiều, kể cho ngươi nghe chuyện hồi ngươi mới tập đi. Rồi ${he(k)} ngủ, không dậy nữa.` + tamma(-5);
          },
        });
      return c;
    },
  },
  {
    id: 'town_dichbenh',
    where: ['village'],
    w: 3,
    maxR: 3,
    cd: 12,
    title: 'Ôn dịch',
    text: () => `${here().n} treo cờ vàng trước cổng: có dịch. Người lên cơn sốt, da nổi chấm đen, ba ngày là đi. Nhà nào cũng đóng cửa, chỉ có tiếng quạ trên mái.`,
    ch: () => [
      {
        t: 'Dùng đan dược cứu người',
        dis: !hasItem('p:giaidoc') && !hasItem('p:hoixuandan'),
        hint: 'Cần Bách Độc Giải hoặc Hồi Xuân Đan',
        cls: 'prime',
        fn: () => {
          if (!lose('p:giaidoc')) lose('p:hoixuandan');
          good(5);
          fame(8);
          mark(`Cứu dịch ở ${here().n}`);
          return 'Ngươi nghiền đan thành bột, hòa vào giếng làng. Bảy ngày sau người ốm bắt đầu ăn được cháo. Dân làng lập bàn thờ sống cho ngươi, thắp hương hơi nhiều làm ngươi hắt hơi suốt.' + statUp('tam', 1) + cult(15);
        },
      },
      {
        t: 'Ở lại đun thuốc, khiêng xác',
        fn: () => {
          good(3);
          if (effRi() === 0 && ch(0.35)) return 'Ngươi ở lại suốt mùa dịch. Rồi chính ngươi cũng lên cơn sốt, suýt chết. Bà lang trong làng thức trắng ba đêm giữ ngươi lại.' + hurt(45) + statUp('tam', 2);
          return 'Ngươi đun thuốc, đào huyệt, đốt quần áo người chết. Dịch qua đi, làng mất một phần ba người. Ngươi không biết mình đã cứu được ai, chỉ biết mình đã không bỏ đi.' + statUp('tam', 1) + wait(0.25);
        },
      },
      { t: 'Đi đường vòng, tránh xa', fn: () => 'Ngươi bịt mũi đi vòng qua làng. Sau lưng có tiếng ai đó gọi, ngươi không quay lại.' + tamma(5) },
    ],
  },
  {
    id: 'town_bachlang_davat',
    where: ['village', 'town'],
    reg: ['bacminh'],
    w: 4,
    maxR: 2,
    cd: 6,
    title: 'Hội đấu vật mùa cỏ',
    text: () => 'Cỏ xanh trở lại thảo nguyên, các bộ lạc mở hội. Giữa vòng người, những tay đô vạm vỡ mặc áo da ngắn vật nhau trên tuyết tan. Phần thưởng: một con tuấn mã và một bình sữa ngựa ủ ba năm.',
    ch: () => [
      {
        t: 'Cởi áo khoác bước vào vòng',
        cls: 'prime',
        fn: () =>
          battle(effRi() === 0 ? mortal('Đô vật bộ lạc Hắc Thạch', 1.5) : cultivator('Dũng sĩ bộ lạc luyện thể', -1, 1.4), {
            lethal: false,
            noFlee: true,
            win: () => {
              fame(5);
              return 'Ngươi quật ngã đối thủ cuối cùng xuống tuyết. Tộc trưởng khoác cho ngươi tấm da sói trắng, gọi ngươi là "con của gió".' + money(M(12)) + statUp('can', 1);
            },
            lose: () => 'Ngươi bị nhấc bổng lên rồi ném ra khỏi vòng như bao cỏ. Cả hội cười vang, rồi người ta mời ngươi uống sữa ngựa an ủi.' + hurt(10),
          }),
      },
      { t: 'Đặt cược vào gã khổng lồ chột mắt', fn: () => (ch(0.5) ? 'Gã chột mắt thắng. Ngươi được một túi tiền và một cái vỗ vai gãy cả xương quai xanh.' + money(M(6)) : 'Gã chột mắt bị một cậu bé mười lăm tuổi vật ngã. Ngươi mất tiền, nhưng được xem một trận hay.' + pay(Math.min(s.money, M(4)))) },
      { t: 'Đi giúp nhà bếp nướng thịt cừu', fn: () => 'Ngươi xoay xiên thịt cả buổi, được ăn no căng và nghe các cụ kể chuyện sói thần phương bắc.' + heal(15) + statUp('mi', 1) },
    ],
  },

  // =====================================================================
  //  II. TRÚC CƠ · KẾT ĐAN
  // =====================================================================
  {
    id: 'town_loidai',
    where: ['town', 'market'],
    w: 4,
    minR: 1,
    maxR: 4,
    cd: 6,
    title: 'Lôi đài tán tu',
    text: () => `Giữa quảng trường ${here().n} dựng một lôi đài đá xanh, bốn góc cắm cờ. Ai thắng liền ba trận được thưởng hậu. Đài đã có một ${realmN()} trẻ tuổi đứng chờ, tay xoay xoay thanh kiếm, mắt nhìn trời.`,
    ch: () => [
      {
        t: 'Lên đài',
        cls: 'prime',
        fn: () =>
          fightThen(cultivator('Kiếm khách lôi đài', 0, 1), {
            lethal: false,
            win: () => ({
              text: 'Kiếm khách văng ra khỏi đài, chắp tay nhận thua rất sòng phẳng. Đám đông hò reo. Một gã cao lớn vác đại phủ nhảy lên thay chỗ.',
              choices: [
                {
                  t: 'Đánh tiếp',
                  cls: 'danger',
                  fn: () =>
                    battle(cultivator('Phủ thủ cuồng bạo', 0, 1.2), {
                      lethal: false,
                      win: () => {
                        fame(10);
                        mark(`Thắng liền lôi đài ở ${here().n}`);
                        return 'Rìu gãy làm đôi. Chủ lôi đài tươi cười bước ra, trao phần thưởng.' + money(M(30)) + (ch(0.5) ? giveGear(effRi(), 1) : gain(cultPill(), 2));
                      },
                      lose: () => 'Ngươi gục trước nhát rìu thứ chín. Vẫn được nhận phần thưởng một trận thắng.' + money(M(8)) + hurt(15),
                    }),
                },
                { t: 'Nhận thưởng một trận rồi xuống', fn: () => { fame(3); return 'Biết dừng đúng lúc cũng là bản lĩnh.' + money(M(8)); } },
              ],
            }),
            lose: () => 'Ngươi bị một kiếm điểm vào ngực rồi đẩy văng khỏi đài. Kiếm khách gật đầu: "Không tệ, luyện thêm vài năm."' + hurt(10),
          }),
      },
      { t: 'Đứng dưới xem, học lỏm', fn: () => 'Mấy chục trận đấu trôi qua trước mắt. Ngươi nhìn ra nhiều sơ hở, của người ta và của chính mình.' + cult(10) + statUp('ngo', 1) },
    ],
  },
  {
    id: 'town_luandao',
    where: ['town', 'market'],
    w: 3,
    minR: 2,
    cd: 10,
    title: 'Trà lâu luận đạo',
    text: () => 'Trên lầu ba trà lâu, mười mấy tu sĩ ngồi quây quanh một lão đạo nhân mặc áo vải. Câu hỏi hôm nay: "Tu tiên là thuận trời hay nghịch trời?" Lão quay sang ngươi: "Đạo hữu nghĩ sao?"',
    ch: () => [
      { t: '"Nghịch trời. Không giành thì không có."', fn: () => (ch(0.5) ? 'Mấy tán tu trẻ vỗ đùi khen phải. Lão đạo cười không nói. Lòng ngươi nóng lên như lửa gặp gió.' + cult(25) + tamma(5) : 'Lão đạo hỏi lại: "Thế trời có giành với ngươi không?" Ngươi nghẹn lời, về nghĩ ba đêm.' + statUp('ngo', 1)) },
      { t: '"Thuận trời. Nước chảy chỗ trũng."', fn: () => 'Lão đạo gật đầu nhẹ. Có người chế giễu ngươi nhút nhát, ngươi không cãi. Đêm ấy ngồi thiền, chân nguyên trôi êm như sông mùa thu.' + cult(20) + tamma(-10) },
      { t: '"Ta tu là ta tu, trời chẳng liên quan."', cls: 'prime', fn: () => { fame(4); return 'Cả lầu im phăng phắc. Lão đạo cười lớn, rót cho ngươi một chén trà: "Câu này đáng ba năm khổ tu." Chén trà xanh trong, uống vào thấy đầu óc sáng ra.' + statUp('ngo', 1) + cult(30); } },
    ],
  },
  {
    // chuỗi nhiều bước — giao dịch đen
    id: 'town_choden',
    where: ['market'],
    w: 4,
    minR: 1,
    maxR: 5,
    cd: 8,
    title: 'Chợ đêm sau vách đá',
    text: () => `Nửa đêm ở ${here().n}, một gã đội nón rộng vành chặn ngươi lại, mở hé vạt áo: bên trong lấp ló một viên ${PILLS[BREAK_PILL[effRi() + 1] || 'hoanguyen'].n}. "Hàng từ đan phòng một đại tông, không giấy tờ. Muốn thì theo ta vào hẻm."`,
    ch: () => [
      {
        t: 'Theo hắn vào hẻm',
        cls: 'danger',
        fn: () => {
          if (ch(0.45)) {
            return {
              text: 'Hẻm cụt. Hai bóng người từ trên mái nhảy xuống, chặn đường lui. Gã đội nón cười nhe răng vàng: "Hàng thì không có. Có cái hẻm này cho ngươi nằm."',
              choices: [
                {
                  t: 'Đánh mở đường máu',
                  cls: 'danger',
                  fn: () => battle(cultivator('Ba tên cướp chợ đêm', 0, 1.3), {
                    win: () => 'Ba tên nằm la liệt. Lục người chúng, ngươi thấy túi linh thạch và một bình đan thật — chắc là của nạn nhân trước.' + money(M(20)) + gain(cultPill(), 2),
                    lose: () => 'Ngươi gắng sức thoát ra phố lớn, túi trữ vật bị giật mất một nửa.' + pay(Math.floor(s.money / 2)),
                  }),
                },
                { t: 'Ném túi tiền ra, xin tha', fn: () => 'Ngươi quăng túi tiền xuống đất. Chúng nhặt rồi biến vào bóng tối.' + pay(Math.floor(s.money * 0.6)) },
              ],
            };
          }
          const pid = breakPill() || cultPill();
          const cost = M(60);
          return {
            text: `Trong hẻm có một gian kho nhỏ. Gã đội nón thắp nến, bày ra hàng thật. Hắn ra giá ${fmt(cost)} linh thạch, "không trả giá, không hỏi nguồn".`,
            choices: [
              { t: `Mua (${fmt(cost)})`, dis: !canPay(cost), cls: 'prime', fn: () => 'Giao dịch chóng vánh. Ra khỏi hẻm, ngươi mới dám thở mạnh.' + pay(cost) + gain(pid) },
              { t: 'Mặc cả', fn: () => (ch(0.3 + s.stats.mi * 0.03) ? 'Ngươi nói khéo, hắn bớt cho ba phần. Hàng tốt giá hời.' + pay(Math.min(s.money, Math.round(cost * 0.7))) + gain(pid) : 'Hắn cụp vạt áo, quay lưng: "Đã bảo không trả giá." Rồi biến mất như chưa từng có.') },
              { t: 'Báo cho chấp sự phường thị', fn: () => { fame(3); return 'Chấp sự dẫn người tới vây bắt. Hàng bị tịch thu, ngươi được thưởng ít tiền và một ánh nhìn hằn học từ trong lồng sắt.' + money(M(10)); } },
            ],
          };
        },
      },
      { t: 'Lắc đầu, đi tiếp', fn: () => 'Đêm ở phường thị, thứ quý nhất là mạng của mình.' },
    ],
  },
  {
    id: 'town_bangthuong',
    where: ['town'],
    w: 4,
    minR: 1,
    maxR: 4,
    cd: 6,
    title: 'Bảng thưởng ở cổng thành',
    text: () => `Cổng ${here().n} dán một tờ bố cáo mới, mực còn chưa khô: yêu thú ngoài thành ăn mất ba đứa trẻ chăn trâu, quan phủ treo thưởng hậu cho vị tiên sư nào ra tay.`,
    ch: () => [
      {
        t: 'Bóc bảng',
        cls: 'prime',
        fn: () =>
          battle(beast(Math.max(0, effRi()), 1.1), {
            win: () => {
              good(2);
              fame(6);
              return 'Ngươi kéo xác yêu thú về cổng thành. Tri phủ đích thân ra đón, dân chúng bu đen bu đỏ.' + money(M(25)) + contrib(5);
            },
            lose: () => 'Yêu thú mạnh hơn lời đồn. Ngươi lết về thành, bố cáo vẫn còn trên tường.' + hurt(20),
          }),
      },
      { t: 'Hỏi nha lại xem thưởng bao nhiêu đã', fn: () => 'Nha lại lật sổ: "Năm mươi lượng bạc." Ngươi tính ra chưa bằng nửa viên linh thạch. Nhưng ngoài kia vẫn có trẻ con chăn trâu.' + statUp('tam', 1) },
      { t: 'Không phải việc của ta', fn: () => 'Ngươi đi qua cổng thành. Đêm ấy nghe tiếng mõ báo động vọng từ phía làng ngoài.' + tamma(3) },
    ],
  },
  {
    id: 'town_cauvu',
    where: ['village'],
    w: 3,
    minR: 2,
    cd: 10,
    title: 'Cầu mưa',
    text: () => `Ba tháng không một giọt mưa. Ruộng ${here().n} nứt nẻ như mai rùa. Dân làng khiêng kiệu thần đi quanh đồng, trống gõ rát cả tay. Thấy ngươi, trưởng làng quỳ sụp: "Tiên sư, xin thương lấy dân!"`,
    ch: () => [
      {
        t: 'Vận chân nguyên kéo mây',
        cls: 'prime',
        fn: () => {
          good(3);
          fame(6);
          return 'Ngươi bay lên không, kết ấn gom hơi nước từ sông xa. Mây đen ùn ùn kéo tới, mưa đổ ba ngày. Ngươi rơi xuống mệt lả, chân nguyên cạn sạch, nhưng tiếng cười dưới ruộng nghe rất được.' + hurt(15) + statUp('tam', 1) + (s.root.els.includes('thuy') ? cult(25) : '');
        },
      },
      {
        t: 'Bắt dân làng nộp lễ trước',
        fn: () => {
          evil(2);
          return 'Dân làng gom từng đồng, cả lợn giống, cả vòng bạc cưới. Ngươi làm mưa. Mưa xuống, nhưng không ai cười.' + money(M(10)) + tamma(5);
        },
      },
      { t: 'Thiên thời có lẽ của nó', fn: () => 'Ngươi nói thật: cưỡng ép thời tiết sẽ có nơi khác hạn hán. Dân làng không hiểu, chỉ thấy tiên sư bỏ đi.' + statUp('ngo', 1) },
    ],
  },
  {
    // chuỗi nhiều bước — tán tu rủ thám động phủ
    id: 'town_tansu_dongphu',
    where: ['market', 'town'],
    w: 4,
    minR: 1,
    maxR: 4,
    cd: 10,
    title: 'Lời mời của tán tu',
    text: () => `Một tán tu mặt sẹo ngồi xuống bàn ngươi, đặt lên một tấm bản đồ da dê: "Động phủ của một ${realmN(Math.min(RMAX(), effRi() + 1))} tọa hóa trăm năm. Cấm chế đã yếu. Ta thiếu một người giữ cửa. Chia ba bảy, ngươi ba."`,
    ch: () => [
      {
        t: 'Nhận lời',
        cls: 'prime',
        fn: () => {
          const n = meet({ dr: 0, tag: 'acq', rel: 10, how: 'Tán tu cùng thám động phủ', sect: null });
          return {
            text: `Hắn tên ${n.name}. Hai ngươi vượt núi bảy ngày, phá cấm chế mất ba đêm. Trong động có một bộ hài cốt ngồi xếp bằng, trước mặt là chiếc hộp ngọc. ${n.name} nhìn chiếc hộp, rồi nhìn ngươi. Tay ${he(n)} khẽ đặt lên chuôi kiếm.`,
            choices: [
              {
                t: 'Đề nghị chia đều, không ai động thủ',
                fn: () => {
                  if (ch(0.55 + s.stats.mi * 0.03)) {
                    relChange(n, 40);
                    return `${n.name} thở phào: "Tốt. Ta cũng chán đâm sau lưng rồi." Hộp mở, mỗi người một nửa.` + money(M(30)) + giveGear(effRi(), 1);
                  }
                  return {
                    text: `${n.name} cười lạnh, rút kiếm: "Chia đều? Ngươi nghĩ mình là ai?"`,
                    choices: [
                      { t: 'Ứng chiến', cls: 'danger', fn: () => battle({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator', mult: 1.05 }, { win: () => { n.alive = false; n.died = s.year; n.cause = 'chết trong động phủ vì lòng tham'; return 'Ngươi chôn hắn cạnh bộ hài cốt. Hộp ngọc là của ngươi.' + money(M(45)) + giveGear(effRi(), 2); }, lose: () => 'Ngươi trọng thương thoát ra khỏi động. Hắn ôm hộp ngọc biến mất.' }) },
                    ],
                  };
                },
              },
              {
                t: 'Ra tay trước',
                cls: 'danger',
                fn: () => {
                  evil(3);
                  return battle({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator', mult: 0.9 }, {
                    win: () => { n.alive = false; n.died = s.year; n.cause = 'bị ngươi đánh lén trong động phủ'; return 'Kiếm của ngươi nhanh hơn một nhịp. Hộp ngọc, túi trữ vật của hắn, tất cả là của ngươi. Lúc rời động, ngươi có cảm giác bộ hài cốt đang nhìn theo.' + money(M(50)) + giveGear(effRi(), 2) + tamma(10); },
                    lose: () => { relChange(n, -80); return 'Đánh lén hụt. Ngươi bỏ chạy, sau lưng là tiếng chửi rủa: "Ta sẽ nhớ mặt ngươi!"'; },
                  });
                },
              },
              {
                t: 'Nhường hắn chiếc hộp, chỉ lấy bộ sách trên vách',
                fn: () => {
                  relChange(n, 30);
                  return `${n.name} ngẩn ra, rồi ôm hộp cười toe. Ngươi lấy chồng ngọc giản cũ trên vách đá — thứ hắn coi là rác.` + gain('x:ngocgian') + (ch(0.4) ? gain('sk:' + pick(['ngukiem', 'kimchungtrao', 'diahoa', 'liemloi', 'sontrung'])) : '');
                },
              },
            ],
          };
        },
      },
      { t: 'Từ chối', fn: () => 'Ba bảy chia với người lạ, thường là người lạ bảy, mình ba tấc đất.' },
    ],
  },
  {
    id: 'town_thanhkhoai',
    where: ['town'],
    w: 4,
    minR: 1,
    maxR: 4,
    cd: 8,
    title: 'Công tử thế gia',
    text: () => 'Một cỗ xe kéo bằng hai con ngựa vảy lao qua phố, hất văng gánh rau của bà cụ bán hàng. Trên xe, một công tử áo gấm cười ha hả, phẩy tay ném ra một nắm bạc vụn: "Đền đấy!" Bạc rơi lăn lóc trong bùn.',
    ch: () => [
      {
        t: 'Chặn xe lại',
        cls: 'danger',
        fn: () => ({
          text: 'Ngươi giơ tay, hai con ngựa vảy chồm lên rồi khựng lại. Công tử nhíu mày, một lão bộc gầy gò từ trong xe bước ra, khí tức không yếu chút nào.',
          choices: [
            {
              t: 'Đấu với lão bộc',
              cls: 'danger',
              fn: () => battle(cultivator('Lão bộc thế gia', 0, 1.15), {
                win: () => { good(2); fame(6); const n = meet({ dr: -1, tag: 'enemy', rel: -50, how: 'Công tử thế gia bị ngươi làm mất mặt giữa phố', sect: null }); return `Lão bộc ngã gục. Công tử ${n.name} xanh mặt xuống xe, nhặt bạc trong bùn trả bà cụ, rồi rít qua kẽ răng: "Ngươi nhớ đấy."`; },
                lose: () => 'Ngươi bị đánh dạt vào tường. Xe ngựa phóng đi, tiếng cười còn vọng lại.' + hurt(10),
              }),
            },
            { t: 'Nói lý, đòi bồi thường đàng hoàng', fn: () => (ch(0.4 + s.stats.mi * 0.04) ? 'Trước mặt cả phố, công tử không muốn mất thể diện, đành sai người bồi thường gấp mười. Bà cụ cảm ơn rối rít.' + statUp('mi', 1) : 'Công tử cười khẩy, xe phóng đi. Ngươi đành bỏ tiền túi đền cho bà cụ.' + pay(Math.min(s.money, M(2)))) },
          ],
        }),
      },
      { t: 'Đỡ bà cụ, nhặt rau giúp', fn: () => { good(1); return 'Ngươi nhặt từng mớ rau, lau sạch bạc vụn đưa bà. Bà cụ dúi cho ngươi một quả trứng gà luộc, còn ấm.' + tamma(-5); } },
      { t: 'Không liên quan', fn: () => 'Thế gian bất bình nhiều như cát. Ngươi đi tiếp.' },
    ],
  },
  {
    id: 'town_road_thuongdoi',
    where: ['road'],
    w: 4,
    maxR: 4,
    cd: 6,
    title: 'Thương đội cần người hộ tống',
    text: () => `Một đoàn xe chở ${pick(['muối', 'tơ lụa', 'dược liệu', 'quặng sắt'])} dừng bên đường. Chủ thương đội, một người đàn ông béo mặc áo lụa, chạy tới vái ngươi: "Đoạn phía trước có yêu thú và cướp. Xin tiên sư đi cùng một quãng, thù lao xứng đáng!"`,
    ch: () => [
      {
        t: 'Nhận lời hộ tống',
        cls: 'prime',
        fn: () => {
          if (ch(0.4)) return 'Chuyến đi êm như ru. Ngươi ngồi trên xe ăn hạt dưa suốt bảy ngày, đến nơi nhận tiền.' + money(M(12)) + wait(0.05);
          const foe = ch(0.5) ? beast(Math.max(0, effRi() - 1), 1.2) : thug('Đạo tặc đường dài', 1.1, 0);
          return {
            text: `Đến ngày thứ năm, ${foe.kind === 'beast' ? 'một con yêu thú từ rừng lao ra, hất tung xe đi đầu' : 'tên bay như mưa từ hai bên vách núi'}. Phu xe kêu thét, ngựa chạy tán loạn.`,
            choices: [
              { t: 'Xông lên chặn', cls: 'danger', fn: () => battle(foe, { win: () => { fame(5); good(1); return 'Đoàn xe an toàn. Chủ thương đội cảm kích, trả gấp đôi thù lao.' + money(M(25)) + (ch(0.4) ? gain(herb()) : ''); }, lose: () => 'Ngươi không chặn nổi. Đoàn xe mất một nửa hàng, ngươi mất nửa phần thù lao.' + money(M(5)) }) },
              { t: 'Bảo vệ người, bỏ hàng', fn: () => { good(2); return 'Ngươi dồn phu xe vào hang đá, để mặc hàng hóa. Mất của nhưng không mất người. Chủ thương đội vừa khóc vừa trả tiền.' + money(M(8)); } },
            ],
          };
        },
      },
      { t: 'Từ chối', fn: () => 'Mỗi người một con đường. Ngươi rảo bước vượt lên trước.' },
    ],
  },
  {
    // chuỗi nhiều bước — cầu cứu trên đường
    id: 'town_road_caucuu',
    where: ['road'],
    w: 4,
    cd: 6,
    title: 'Tiếng kêu cứu bên đường',
    text: () => `Bên vệ đường có một cỗ xe lật nghiêng, bánh còn quay. Một ${pick(['thiếu nữ áo xanh', 'lão nông', 'thư sinh gầy'])} ngồi ôm chân rên rỉ: "Cứu... chân ta kẹt dưới xe..."`,
    ch: () => [
      {
        t: 'Dừng lại giúp',
        cls: 'prime',
        fn: () => {
          if (ch(0.3 - s.stats.van * 0.01)) {
            return {
              text: 'Ngươi vừa cúi xuống nâng xe, người bị nạn đột nhiên rút từ tay áo ra một cây châm đen sì đâm thẳng vào gáy ngươi. Bẫy!',
              choices: [
                { t: 'Phản kích', cls: 'danger', fn: () => battle(cultivator('Kẻ phục kích giả làm người bị nạn', 0, 1), { win: () => 'Kẻ phục kích gục xuống. Trong xe chất đầy túi trữ vật của những người tốt bụng trước ngươi.' + money(M(30)) + statUp('tam', 1), lose: () => 'Độc châm ngấm vào kinh mạch. Ngươi gắng gượng bỏ chạy.' + hurt(25) }) },
              ],
            };
          }
          good(2);
          return {
            text: 'Ngươi nhấc xe lên, kéo người bị nạn ra. Hóa ra là người nhà của một hiệu thuốc trong thành, đang chở hàng về.',
            choices: [
              { t: 'Đưa họ về tận thành', fn: () => { good(1); return 'Người nhà hiệu thuốc cảm tạ không thôi, nhất định tặng ngươi một gói thuốc quý.' + gain(ch(0.5) ? healPill() : herb()); } },
              { t: 'Chỉ đường rồi đi tiếp', fn: () => 'Ngươi băng bó qua loa rồi đi. Sau lưng, người kia cúi đầu vái mãi.' + tamma(-3) },
            ],
          };
        },
      },
      { t: 'Đi tiếp, đề phòng có bẫy', fn: () => (ch(0.5) ? 'Đi được một đoạn, ngươi ngoái lại: người kia đã đứng dậy phủi quần, nhìn theo ngươi với ánh mắt tiếc rẻ.' + statUp('ngo', 1) : 'Hôm sau ở quán trọ, ngươi nghe kể có người chết vì bị kẹt dưới xe ven đường.' + tamma(8)) },
    ],
  },
  {
    // chuỗi nhiều bước — cổ trùng Nam Man
    id: 'town_namman_co',
    where: ['town', 'village', 'market'],
    reg: ['namman'],
    w: 4,
    minR: 1,
    maxR: 5,
    cd: 12,
    title: 'Chén rượu ở chợ Man',
    text: () => 'Một cô gái Man vòng bạc kêu leng keng mời ngươi chén rượu cần. Ngươi uống xong mới thấy cổ họng ngứa ran, như có con gì bò từ dạ dày lên. Nàng ta cười khúc khích rồi biến vào đám đông.',
    ch: () => [
      {
        t: 'Vận công bức nó ra',
        cls: 'danger',
        fn: () => {
          if (ch(0.35 + s.stats.can * 0.03)) return 'Ngươi ép chân nguyên như ép nước, nôn ra một con sâu đỏ bằng ngón tay, còn ngọ nguậy. Ngươi bóp chết nó, lấy được túi độc.' + gain('m:docnang') + hurt(10);
          return {
            text: 'Con cổ trùng giật mình, chui sâu vào kinh mạch. Ngươi đau quặn, ngã quỵ. Một ông lão bán thuốc ven đường nhìn ngươi, lắc đầu: "Cổ Mê Tình. Chỉ người thả mới gọi ra được."',
            choices: [
              {
                t: 'Đi tìm cô gái kia',
                cls: 'prime',
                fn: () => {
                  const n = meet({ r: Math.max(1, effRi() - 1), g: 'f', tag: 'acq', rel: 0, how: 'Cô gái Man thả cổ vào chén rượu của ngươi', sect: 'vandoc' });
                  return {
                    text: `Ngươi lần theo tiếng vòng bạc tới một nhà sàn. Cô gái tên ${n.name}, ngồi chống cằm: "Ta thả cổ chỉ để thử xem người ngoài có bản lĩnh không. Muốn ta gọi nó ra thì làm cho ta một việc: lên núi bắt con rết vương đã cắn chết em trai ta."`,
                    choices: [
                      { t: 'Đi bắt rết vương', cls: 'danger', fn: () => battle(beast(Math.max(1, effRi()), 1.2), { win: () => { relChange(n, 50); return `${n.name} huýt sáo một tiếng, con cổ trùng bò ra khỏi tai ngươi, ngoan như mèo. Nàng tặng thêm một bình thuốc giải bách độc.` + gain('p:giaidoc') + heal(20); }, lose: () => 'Ngươi thất bại trở về. Nàng thở dài, vẫn gọi cổ ra cho ngươi, nhưng không nhìn ngươi lần nào nữa.' + hurt(10) }) },
                      { t: 'Kề kiếm vào cổ nàng', cls: 'danger', fn: () => { evil(2); relChange(n, -70); return battle(cultivator(n.name, n.r - effRi(), 1), { win: () => 'Nàng gọi cổ ra, mắt rực lửa hận. Ngươi rời Nam Man, sau lưng là tiếng trống đồng.' + heal(10), lose: () => 'Nàng cười lạnh. Con cổ cắn thêm một miếng, ngươi lăn lộn ba ngày mới gỡ được nó bằng thuốc mua chợ đen.' + hurt(35) }); } },
                    ],
                  };
                },
              },
              { t: `Mua thuốc của ông lão (${fmt(M(15))})`, dis: !canPay(M(15)), fn: () => 'Thuốc đắng như mật gấu, nhưng con cổ trùng chịu bò ra. Ông lão cười: "Rượu người Man, uống phải có người quen."' + pay(M(15)) + heal(10) },
            ],
          };
        },
      },
      { t: 'Uống thêm chén nữa, xem nàng định làm gì', fn: () => (ch(0.4) ? 'Cô gái quay lại, ngạc nhiên vì ngươi chưa gục. Nàng gọi cổ ra, rót thêm chén rượu thật: "Gan to. Ta thích." Rượu thật thơm như mật rừng.' + statUp('mi', 1) + cult(10) : 'Chén thứ hai có hai con cổ. Ngươi nằm bẹp ở nhà trọ mười ngày.' + hurt(30)) },
    ],
  },
  {
    id: 'town_tayluong_baocat',
    where: ['road', 'village'],
    reg: ['tayluong'],
    w: 4,
    maxR: 4,
    cd: 8,
    title: 'Bão cát',
    text: () => 'Chân trời phía tây đỏ quạch rồi tối sầm. Bão cát ập tới như bức tường, gió rít như ngàn con sói. Một thương đội lạc đà đang hoảng loạn ngay phía trước, có tiếng trẻ con khóc thét.',
    ch: () => [
      {
        t: 'Dựng chắn gió che cả đoàn',
        cls: 'prime',
        fn: () => {
          good(2);
          fame(3);
          if (effRi() === 0) return 'Ngươi chẳng có phép gì, chỉ biết lùa lạc đà nằm thành vòng, kéo người vào giữa. Bão qua, cả đoàn sống sót. Người dẫn đường già tặng ngươi một viên đá đỏ nhặt được ở lòng sông khô.' + gain('h:hoaduongqua') + statUp('tam', 1);
          return 'Ngươi dựng hộ thể, gồng mình chịu gió cát cả đêm. Sáng ra, chân nguyên cạn kiệt nhưng cả đoàn bình an. Thương đội tặng ngươi một quả lửa quý đem từ ốc đảo.' + gain('h:hoaduongqua') + hurt(10) + money(M(8));
        },
      },
      {
        t: 'Theo gió đi tìm chỗ trú riêng',
        fn: () => {
          if (ch(0.3)) return 'Ngươi chui vào một khe đá. Gió cát thổi lộ ra một mái ngói lưu ly bị vùi lấp, trong góc có mấy viên ngọc cũ.' + money(M(15)) + statUp('van', 1);
          return 'Ngươi sống sót, nhưng cát xé rách cả da mặt. Sáng ra không thấy thương đội đâu nữa.' + hurt(15) + tamma(5);
        },
      },
      {
        t: 'Chém vào tâm bão',
        cls: 'danger',
        dis: effRi() < 2,
        hint: effRi() < 2 ? 'Cần Trúc Cơ' : '',
        fn: () => battle(beast(Math.max(2, effRi()), 1), { win: () => 'Giữa tâm bão có một con Sa Hạt Vương khổng lồ đang quẫy đuôi. Ngươi chém đứt đuôi nó, bão lắng dần.' + gain('m:docnang') + money(M(12)), lose: () => 'Ngươi bị hất văng ra khỏi tâm bão, nằm vùi trong cát.' + hurt(10) }),
      },
    ],
  },
  {
    id: 'town_vanmong_thuyenhoa',
    where: ['market', 'town'],
    reg: ['vanmong'],
    w: 4,
    minR: 1,
    maxR: 5,
    cd: 8,
    title: 'Khúc ca trên thuyền hoa',
    text: () => 'Đêm Vân Mộng, đèn lồng lơ lửng trên mặt nước. Từ một chiếc thuyền hoa vọng ra tiếng đàn tỳ bà, giọng hát trong như sương: "Ba chín hai mươi bảy bước, liễu rủ chỗ rồng nằm..." Nghe kỹ, trong lời ca dường như có cài cái gì.',
    ch: () => [
      {
        t: `Lên thuyền nghe hết khúc (${fmt(M(5))})`,
        dis: !canPay(M(5)),
        cls: 'prime',
        fn: () => {
          const p = pay(M(5));
          if (s.stats.ngo >= 7 || ch(0.3)) return p + ' Ngươi chép lại lời ca, đối chiếu với bờ đầm. Hai mươi bảy bước từ gốc liễu già, dưới bùn có một hũ sành phong ấn. Nàng ca kỹ chỉ mỉm cười khi ngươi trở lại cảm ơn.' + gain(herb(Math.min(6, effRi() + 1))) + gain(cultPill());
          return p + ' Ngươi nghe đến say, quên cả lời. Tỉnh dậy đã thấy sáng, đầu ong ong, túi tiền vơi đi một nửa.' + pay(Math.floor(s.money * 0.15));
        },
      },
      { t: 'Đứng trên cầu nghe nhờ', fn: () => 'Gió mang tiếng ca đi mất một nửa. Ngươi chỉ nhớ một câu: "Người đi không về, đèn vẫn đỏ." Đêm ấy ngồi thiền, lòng rất yên.' + tamma(-10) },
    ],
  },
  {
    id: 'town_donghai_ngoctrai',
    where: ['town', 'market', 'village'],
    reg: ['donghai'],
    w: 4,
    maxR: 5,
    cd: 6,
    title: 'Mẻ lưới lạ',
    text: () => 'Bến cảng tanh mùi cá. Một thủy thủ già vừa cập bến, lôi ra từ lưới một con trai to bằng cái mâm, vỏ khắc vằn như vảy rồng. "Cạy không ra. Ai mua thì mua, ta bán nguyên con."',
    ch: () => [
      {
        t: `Mua nguyên con (${fmt(M(12))})`,
        dis: !canPay(M(12)),
        fn: () => {
          const p = pay(M(12));
          const r = Math.random();
          if (r < 0.15) return p + ' Ngươi dùng chân nguyên cạy mở. Bên trong không có ngọc, mà có một mảnh vảy xanh thẫm, lạnh như băng — vảy giao long!' + gain('m:longlan');
          if (r < 0.55) return p + ' Bên trong là một viên ngọc trai tròn như mắt rồng. Đem bán cho tiệm kim hoàn, lời gấp ba.' + money(M(36));
          return p + ' Cạy ra thì thịt trai đã thối. Cả bến cảng bịt mũi. Thủy thủ già đã đi uống rượu từ lâu.';
        },
      },
      { t: 'Hỏi ông lão kéo lưới ở đâu', fn: () => 'Ông lão chỉ ra phía đông nam, chỗ "nước đổi màu xanh tím vào đêm trăng". Ngươi ghi nhớ. Biển Đông Hải có nhiều chỗ như thế lắm.' + statUp('van', 1) },
      { t: 'Ăn một bát canh trai rồi đi', fn: () => 'Canh nóng, cay vừa, có mùi gừng biển. Một bát canh làm ấm cả người.' + heal(10) },
    ],
  },
  {
    id: 'town_lodan_thue',
    where: ['market'],
    w: 3,
    minR: 1,
    maxR: 4,
    cd: 8,
    title: 'Nổ lò ở phòng luyện đan thuê',
    text: () => 'Ngươi đi ngang dãy phòng luyện đan cho thuê của phường thị. Đột nhiên một tiếng "ầm!", phòng bên cạnh phun khói đen, một luyện đan sư mặt đen như đít nồi lao ra, tóc dựng đứng: "Hỏa căn! Hỏa căn của ta chạy mất rồi!"',
    ch: () => [
      {
        t: 'Xông vào dập lửa',
        cls: 'prime',
        fn: () => {
          const n = meet({ dr: ri(0, 1), tag: 'acq', rel: 30, how: 'Luyện đan sư bị nổ lò ở phường thị', sect: null });
          good(1);
          return `Ngươi bịt khói, chụp đốm hỏa linh đang nhảy nhót bằng một chậu nước linh tuyền. ${n.name} cảm động ôm chầm lấy ngươi, bôi đầy nhọ lên áo, rồi tặng mấy viên đan còn sót lại trong lò.` + gain(cultPill(), 2);
        },
      },
      {
        t: 'Vào nhặt bã thuốc vương vãi',
        fn: () => (ch(0.4) ? 'Giữa đống tro có một viên đan còn nguyên, cháy xém một góc nhưng dược lực vẫn còn.' + gain(cultPill()) : 'Ngươi nhặt được một nắm tro và một cái tát của chủ lò.' + hurt(5)),
      },
      { t: 'Đứng xa xem', fn: () => 'Cả phường thị kéo tới xem, cười nói rôm rả. Luyện đan, mười lò thì ba lò nổ là chuyện thường.' },
    ],
  },
  {
    id: 'town_lam_cauda',
    where: ['village'],
    w: 3,
    minR: 2,
    maxR: 5,
    cd: 15,
    title: 'Cây cầu sập',
    text: () => `Lũ cuốn trôi cây cầu duy nhất của ${here().n}. Trẻ con phải lội nước sang trường, đã có một đứa bị cuốn đi. Dân làng góp tiền ba năm vẫn chưa đủ thuê thợ.`,
    ch: () => [
      {
        t: 'Một mình dựng lại cầu',
        cls: 'prime',
        fn: () => {
          good(4);
          fame(5);
          mark(`Dựng cầu đá ở ${here().n}`);
          return 'Ngươi bổ núi lấy đá, một đêm xếp xong cầu. Sáng ra dân làng kéo nhau ra xem, có bà cụ sờ vào thành cầu mà khóc. Trăm năm sau người ta vẫn gọi đó là "cầu tiên".' + statUp('tam', 1) + cult(15);
        },
      },
      { t: `Để lại tiền cho làng (${fmt(M(10))})`, dis: !canPay(M(10)), fn: () => { good(2); return 'Ngươi đặt túi tiền lên bàn thờ đình làng rồi đi, không để lại tên.' + pay(M(10)); } },
      { t: 'Đi qua', fn: () => 'Ngươi bay qua sông, không cần cầu.' },
    ],
  },
  {
    id: 'town_tieuthu_kenre',
    where: ['town'],
    w: 3,
    minR: 2,
    maxR: 5,
    cd: 20,
    title: 'Tiểu thư kén rể',
    text: () => `Thành chủ ${here().n} mở hội kén rể cho ái nữ. Cổng phủ đông nghẹt, công tử tán tu chen nhau. Nghe nói người được chọn sẽ nhận cả gia sản — và một vị nhạc phụ là ${realmN(Math.min(RMAX(), effRi()))} khó tính.`,
    cond: () => s.g === 'm',
    ch: () => [
      {
        t: 'Vào thử cho vui',
        fn: () => {
          if (ch(0.2 + s.stats.mi * 0.04)) {
            return {
              text: 'Tiểu thư ném tú cầu trúng ngay đầu ngươi. Cả sân xôn xao. Thành chủ vuốt râu nhìn ngươi từ đầu đến chân.',
              choices: [
                { t: 'Nhận lời', cls: 'prime', fn: () => { const n = meet({ dr: -1, g: 'f', tag: 'friend', rel: 50, how: 'Ái nữ thành chủ ném tú cầu chọn ngươi', sect: null }); wedDaolu(n); mark(`Thành thân với ${n.name}`); return `Hôn lễ linh đình bảy ngày. ${n.name} tính tình hiền hậu, lại mang theo của hồi môn không nhỏ.` + money(M(40)) + tamma(-10); } },
                { t: 'Xin lỗi, ta chỉ vào xem', fn: () => { fame(-2); return 'Thành chủ đỏ mặt tía tai, sai người tống ngươi ra cổng. Từ đó ngươi nổi tiếng là "kẻ trả tú cầu".' + statUp('mi', 1); } },
              ],
            };
          }
          return 'Tú cầu bay vèo qua đầu ngươi, rơi vào tay một thư sinh nghèo đứng góc tường. Ngươi vỗ tay chúc mừng.';
        },
      },
      { t: 'Ăn tiệc miễn phí rồi về', fn: () => 'Cỗ cưới nhà thành chủ quả thật ngon. Ngươi ăn ba bát, gói thêm bánh mang theo.' + heal(10) },
    ],
  },

  // =====================================================================
  //  III. NGUYÊN ANH TRỞ LÊN — nhìn phàm trần từ trên cao
  // =====================================================================
  {
    id: 'town_haudue',
    where: ['village', 'town'],
    w: 4,
    minR: 3,
    cd: 40,
    cond: () => !!deadFriend(),
    title: 'Gương mặt quen trên phố',
    text: () => {
      const f = deadFriend()!;
      return `Một đứa bé chạy ngang qua, ngươi khựng lại: đôi mắt ấy giống hệt ${f.name} năm xưa. Hỏi ra mới biết, nó là chắt năm đời của ${f.name}. Ông bà nó chưa từng nghe nói nhà mình từng quen một ${realmN()}.`;
    },
    ch: () => {
      const f = deadFriend()!;
      return [
        {
          t: 'Xem căn cốt đứa bé',
          cls: 'prime',
          fn: () => {
            if (ch(0.4)) {
              const d = meet({ r: 0, g: ch(0.5) ? 'm' : 'f', tag: 'disciple', rel: 60, how: `Hậu duệ của ${f.name}, được ngươi nhận làm đệ tử`, sect: s.sect?.id ?? null, age: 9, talent: 1.1 });
              mark(`Nhận hậu duệ của ${f.name} làm đệ tử`);
              return `Linh căn tuy không mạnh nhưng sạch. Ngươi đặt tay lên đầu đứa bé: "Từ nay ngươi tên ${d.name}, là đồ đệ ta." Ngươi đã không kịp trả ân cho ${f.name}. Giờ có thể trả cho đứa trẻ này.` + tamma(-15) + statUp('tam', 1);
            }
            return 'Đứa bé không có linh căn. Ngươi để lại một viên đan cường thân và một túi bạc, dặn gia đình dạy nó đọc sách. Một kiếp phàm nhân bình an cũng là phúc.' + tamma(-8);
          },
        },
        { t: 'Lặng lẽ để lại của cải rồi đi', fn: () => { good(2); return `Đêm ấy nhà họ phát hiện một rương vàng sau bếp, kèm mảnh giấy: "Trả nợ cho ${f.name}." Cả họ bàn tán ba đời không ra.` + tamma(-10); } },
        { t: 'Đứng nhìn một lúc', fn: () => `Ngươi nhìn đứa bé đuổi gà quanh sân. ${f.name} đã thành tro bụi bao năm. Thọ nguyên dài, nghĩa là phải tiễn rất nhiều người.` + tamma(5) + statUp('ngo', 1) },
      ];
    },
  },
  {
    // chuỗi nhiều bước — hoàng triều cầu viện
    id: 'town_hoangtrieu',
    where: ['town'],
    reg: ['trungtho'],
    w: 3,
    minR: 4,
    cd: 60,
    title: 'Thánh chỉ trong hộp vàng',
    text: () => 'Một đoàn thái giám quỳ chặn đường ngươi, dâng lên hộp vàng niêm phong. Trong là thánh chỉ của Hoàng đế Đại Chu: ma tu chiếm đóng ba quận biên giới, quân triều đình thua liên tiếp. "Kính xin tiên trưởng ra tay, trẫm nguyện lấy lễ quốc sư mà đãi."',
    ch: () => [
      {
        t: 'Nhận lời',
        cls: 'prime',
        fn: () => ({
          text: 'Biên quận chìm trong khói đen. Ruộng đồng thành đất chết, làng mạc vắng tanh, trên tường thành treo đầy xác khô. Kẻ cầm đầu là một ma tu áo máu, đang dùng sinh hồn trăm vạn phàm nhân để luyện một lá cờ.',
          choices: [
            {
              t: 'Xông thẳng vào đại trận',
              cls: 'danger',
              fn: () => fightThen(cultivator('Ma tu luyện Vạn Hồn Phiên', 0, 1.2), {
                win: () => {
                  good(8);
                  fame(60);
                  setFlag('quocsu');
                  mark('Diệt ma tu biên quận, được phong Hộ Quốc Chân Nhân của Đại Chu');
                  return {
                    text: 'Lá cờ cháy rụi, trăm vạn hồn phách bay lên như đom đóm. Hoàng đế đích thân ra cổng thành nghênh đón, phong ngươi làm Hộ Quốc Chân Nhân, ban mật khố hoàng gia.',
                    choices: [
                      { t: 'Nhận phong hiệu', fn: () => 'Từ nay hương hỏa Đại Chu có phần của ngươi. Linh thạch, thảo dược trong mật khố cũng không ít.' + money(M(120)) + gain(herb(Math.min(6, effRi()))) + cult(40) },
                      { t: 'Từ chối, chỉ lấy một thứ trong mật khố', fn: () => 'Ngươi đi một vòng mật khố, chỉ lấy một mảnh đá đen trên giá cuối cùng — tinh thần thiết rơi từ trời, triều đình cất giữ ba trăm năm mà không ai luyện nổi.' + gain('m:thienthach') + statUp('tam', 1) + tamma(-10) },
                    ],
                  };
                },
                lose: () => 'Ngươi phá được nửa trận rồi phải rút lui. Ma tu bị thương, tạm thời không dám tiến quân.' + (fame(10), hurt(20)),
              }),
            },
            {
              t: 'Phá trận nhãn trước, cứu dân',
              fn: () => {
                good(5);
                fame(25);
                return 'Ngươi lặng lẽ phá ba trận nhãn, mở đường cho dân chạy nạn. Ma tu mất nguồn sinh hồn, tức giận rút về Tây Lương. Hoàng đế phong thưởng hậu hĩ.' + money(M(60)) + hurt(10);
              },
            },
          ],
        }),
      },
      { t: 'Từ chối — tu sĩ không can dự triều chính', fn: () => 'Ngươi trả hộp vàng. Thái giám dập đầu tới chảy máu. Mấy năm sau, tin biên quận thất thủ truyền về.' + tamma(8) },
      { t: 'Ra giá', fn: () => { evil(1); return 'Ngươi đòi ba vạn lượng vàng và một mỏ linh thạch. Triều đình gật đầu cái rụp. Trận ấy ngươi đánh thắng, nhưng dân biên quận chẳng ai nhớ tên ngươi.' + money(M(80)) + hurt(10); } },
    ],
  },
  {
    id: 'town_quecu',
    where: ['village', 'town'],
    w: 4,
    minR: 4,
    once: true,
    cond: () => age() >= 150,
    title: 'Về lại chốn cũ',
    text: () => `Ngươi đi ngang ${here().n}. Mọi thứ đều lạ: tường gạch thay vách đất, chợ mọc nơi trước kia là bãi tha ma. Chỉ có cây đa đầu làng vẫn đứng đó, già hơn, cành rủ xuống chạm đất. Ngươi đã ${Math.floor(age())} tuổi.`,
    ch: () => [
      { t: 'Ngồi dưới gốc đa một đêm', cls: 'prime', fn: () => 'Gió thổi qua lá, giống tiếng mẹ gọi về ăn cơm. Ngươi ngồi đến sáng. Bao nhiêu năm tranh đoạt, hóa ra thứ ngươi giữ chặt nhất lại là một buổi chiều xa lắc.' + tamma(-30) + statUp('tam', 2) + cult(30) },
      { t: 'Tìm mộ người thân', fn: () => 'Nghĩa địa cũ đã thành ruộng. Ngươi đứng giữa ruộng lúa, thắp nén hương không biết cắm vào đâu.' + tamma(10) + statUp('ngo', 1) },
      { t: 'Đi tiếp, không dừng lại', fn: () => 'Tu tiên là đi về phía trước. Ngươi không ngoảnh lại. Có điều, đi được một quãng xa, ngươi phát hiện mình đang khẽ hát một bài đồng dao.' },
    ],
  },
  {
    id: 'town_giadainang',
    where: ['market', 'town'],
    w: 3,
    minR: 4,
    cd: 25,
    title: () => `"${realmN()}" giả`,
    text: () => `Giữa phường thị, một lão già râu tóc bạc phơ ngồi kiệu tám người khiêng, xưng là ${realmN()} lão tổ, đang "ban duyên" — mỗi tán tu nộp mười viên linh thạch được xoa đầu một cái, "khai mở linh trí". Ngươi liếc mắt một cái: lão chỉ là ${realmN(Math.max(1, effRi() - 2))}, che giấu bằng một tấm bùa ẩn khí.`,
    ch: () => [
      {
        t: 'Thả ra một tia uy áp thật',
        cls: 'prime',
        fn: () => {
          fame(10);
          good(2);
          return 'Chỉ một tia. Lão già ngã từ trên kiệu xuống, tè cả ra quần. Tấm bùa ẩn khí cháy thành tro. Đám tán tu bị lừa ùa tới đòi lại tiền. Có người nhận ra ngươi, quỳ lạy như tế sao.' + money(M(5));
        },
      },
      {
        t: 'Gọi riêng lão ra chia phần',
        fn: () => {
          evil(3);
          return 'Lão già mặt cắt không còn giọt máu, dâng luôn một nửa số linh thạch lừa được. Ngươi tha cho lão. Từ đó lão xưng là "đồ tôn của một vị tiền bối vô danh".' + money(M(20)) + tamma(5);
        },
      },
      { t: 'Cười rồi đi', fn: () => 'Ngày xưa ngươi cũng từng trả tiền cho mấy kẻ như thế. Ai rồi cũng phải mất học phí.' + statUp('ngo', 1) },
    ],
  },
  {
    id: 'town_thientai_lu',
    where: ['village', 'town'],
    w: 3,
    minR: 4,
    cd: 40,
    title: 'Đê vỡ',
    text: () => `Mưa trút bốn mươi ngày. Đê thượng nguồn ${here().n} vỡ, nước bạc đầu cuồn cuộn đổ xuống, cuốn theo trâu bò, mái nhà. Trên ngọn cây có người bám chặt, tiếng kêu khóc vang khắp đồng.`,
    ch: () => [
      {
        t: 'Dời núi chắn dòng',
        cls: 'prime',
        fn: () => {
          good(6);
          fame(25);
          mark(`Dời núi chặn lũ cứu ${here().n}`);
          return 'Ngươi bay lên không, hai tay nâng một ngọn đồi bên cạnh đặt ngang dòng nước. Đất trời rung chuyển. Nước rẽ sang lòng sông cũ. Phàm nhân quỳ khắp nơi, gọi ngươi là thần.' + hurt(15) + cult(40) + statUp('tam', 1);
        },
      },
      { t: 'Chỉ cứu người, không cản lũ', fn: () => { good(3); return 'Ngươi lướt trên mặt nước, cứu từng người một đặt lên đồi cao. Lũ rút, ruộng nương mất hết, nhưng người còn.' + cult(15); } },
      { t: 'Thiên tai là thiên ý', fn: () => 'Ngươi đứng trên mây nhìn xuống. Vạn vật như chó rơm. Nhưng đêm ấy nhập định, ngươi vẫn nghe tiếng khóc.' + tamma(12) },
    ],
  },
  {
    id: 'town_thieunien_khieuchien',
    where: ['town', 'market'],
    w: 3,
    minR: 4,
    cd: 30,
    title: 'Kẻ trẻ tuổi không biết trời cao',
    text: () => {
      return `Một thiếu niên chừng hai mươi tuổi, mới ${realmN(Math.max(1, effRi() - 2))}, chặn trước mặt ngươi, rút kiếm: "Nghe danh tiền bối đã lâu. Xin chỉ giáo một chiêu!" Mắt nó sáng rực, tay cầm kiếm hơi run. Thiên tài kiểu này, trăm năm mới có một.`;
    },
    ch: () => [
      {
        t: 'Chỉ dùng một ngón tay',
        cls: 'prime',
        fn: () => {
          const n = meet({ dr: -2, tag: 'peer', rel: 40, how: 'Thiên tài trẻ tuổi từng khiêu chiến ngươi', sect: null, talent: 1.6 });
          fame(5);
          return {
            text: `Một ngón tay điểm vào mũi kiếm. Thanh kiếm cong lại như lá lúa, thiếu niên ngồi phịch xuống đất. ${n.name} ngẩn ra một lúc lâu rồi dập đầu: "Xin tiền bối thu con làm đồ đệ!"`,
            choices: [
              { t: 'Nhận làm đệ tử', fn: () => { n.tag = 'disciple'; n.rel = 70; n.how = 'Đệ tử thân truyền, từng khiêu chiến ngươi'; mark(`Thu ${n.name} làm đệ tử`); return `Ngươi gật đầu. ${n.name} vui như trẻ được kẹo. Truyền đạo cho người khác, ngươi cũng nhìn lại con đường của mình rõ hơn.` + statUp('ngo', 1) + cult(20); } },
              { t: 'Từ chối, chỉ điểm vài câu', fn: () => { relChange(n, 20); return 'Ngươi chỉ ra ba chỗ hở trong kiếm pháp của nó. Nó cúi đầu chép từng chữ.' + statUp('tam', 1); } },
            ],
          };
        },
      },
      { t: 'Không thèm đáp lời', fn: () => 'Ngươi đi qua như đi qua một cơn gió. Thiếu niên đứng như trời trồng, mặt đỏ bừng. Có lẽ ba mươi năm sau, nó sẽ đến tìm ngươi lần nữa.' },
    ],
  },
  {
    id: 'town_thiengoai_doivat',
    where: ['market'],
    reg: ['tienchau', 'donghai'],
    w: 3,
    minR: 4,
    cd: 20,
    title: 'Đổi vật lấy vật',
    text: () => `Trong một gian hàng không biển hiệu ở ${here().n}, một bà lão ngồi đan len. Trên bàn trước mặt bà chỉ có ba món: một nhánh cỏ phát sáng, một hạt giống đen, một chiếc chuông đồng nhỏ. "Không bán lấy linh thạch. Muốn thì đổi bằng một món pháp bảo của ngươi."`,
    ch: () => {
      const gearN = spareGear().length;
      const trade = (what: string) => {
        const g = takeGear();
        return `Ngươi đặt ${g.n} lên bàn. Bà lão gật gù, đẩy món đồ sang. ` + what;
      };
      return [
        { t: 'Đổi lấy nhánh cỏ phát sáng', dis: !gearN, hint: gearN ? 'Mất một trang bị trong túi' : 'Túi không có trang bị dư', fn: () => trade(gain(herb(Math.min(6, effRi())))) },
        { t: 'Đổi lấy hạt giống đen', dis: !gearN, hint: gearN ? 'Mất một trang bị trong túi' : 'Túi không có trang bị dư', fn: () => trade(ch(0.5) ? 'Hạt giống nảy mầm trong tay ngươi, hóa thành một luồng sinh cơ chui vào kinh mạch.' + lifeAdd(ri(15, 40)) : 'Hạt giống... chỉ là hạt giống. Bà lão cười móm mém.') },
        { t: 'Đổi lấy chiếc chuông đồng', dis: !gearN, hint: gearN ? 'Mất một trang bị trong túi' : 'Túi không có trang bị dư', fn: () => trade(giveGear(Math.min(RMAX(), effRi()), ch(0.25) ? 3 : 2, 2)) },
        { t: 'Cúi chào rồi đi', fn: () => 'Bà lão không ngẩng lên. Ra khỏi gian hàng ngoảnh lại, ngươi chỉ thấy một bức tường trống.' },
      ];
    },
  },
  {
    id: 'town_road_chanduong_cao',
    where: ['road'],
    w: 3,
    minR: 3,
    cd: 15,
    title: 'Ba bóng người trên mây',
    text: () => `Đang phi hành, ba luồng độn quang chặn trước sau. Ba tu sĩ bịt mặt, khí tức đều là ${realmN()}. "Đạo hữu mang theo nhiều thứ quá, chia bớt cho anh em chúng ta đi."`,
    ch: () => [
      {
        t: 'Một mình chọi ba',
        cls: 'danger',
        fn: () => battle(cultivator('Ba tu sĩ bịt mặt', 0, 1.45), {
          win: () => { fame(15); return 'Hai tên bỏ mạng, tên thứ ba độn thổ chạy mất. Túi trữ vật của chúng không ít đồ.' + money(M(40)) + giveGear(effRi(), 1); },
          lose: () => 'Ngươi liều mạng xé không gian đào thoát, trọng thương.' + pay(Math.floor(s.money * 0.3)),
        }),
      },
      {
        t: 'Bóp nát độn phù chạy',
        dis: !hasItem('t:dichphu') && !hasItem('t:thanhanhphu'),
        hint: 'Cần Thiên Lý Độn Phù hoặc Thần Hành Phù',
        fn: () => { if (!lose('t:dichphu')) lose('t:thanhanhphu'); return 'Một đạo sáng lóe lên, ngươi đã ở cách đó trăm dặm. Sau lưng, tiếng chửi rủa nhỏ dần.'; },
      },
      {
        t: 'Xưng danh tông môn',
        dis: !inSect(),
        hint: inSect() ? '' : 'Ngươi không có tông môn',
        fn: () => (ch(0.6) ? `Nghe tên ${sectName()}, ba người liếc nhau rồi lặng lẽ rút đi. Cây cao bóng cả, đôi khi cũng có ích.` + contrib(2) : `"${sectName()}? Càng tốt, giết xong không ai biết." Ngươi đành phải đánh.` + battle(cultivator('Ba tu sĩ bịt mặt', 0, 1.45), { win: () => money(M(40)), lose: () => pay(Math.floor(s.money * 0.3)) })),
      },
    ],
  },
  {
    id: 'town_cauthuoc_truongsinh',
    where: ['town'],
    w: 3,
    minR: 3,
    cd: 30,
    title: 'Phú ông cầu trường sinh',
    text: () => 'Một lão phú ông giàu nhất thành, chín mươi tuổi, khiêng cả rương vàng tới quỳ trước mặt ngươi: "Tiên sư, ta chỉ muốn sống thêm vài năm, nhìn thằng chắt nội cưới vợ. Bao nhiêu vàng cũng được!"',
    ch: () => [
      {
        t: 'Cho lão một viên Diên Niên Đan',
        dis: !hasItem('p:diennien'),
        hint: hasItem('p:diennien') ? '' : 'Cần Diên Niên Đan',
        cls: 'prime',
        fn: () => { lose('p:diennien'); good(2); return 'Lão uống đan, tóc bạc mọc ra chân đen. Lão dập đầu tới chảy máu, dâng cả rương vàng — đổi ra linh thạch cũng là một khoản lớn.' + money(M(50)); },
      },
      {
        t: 'Đưa lão một viên thuốc bổ, nói là tiên đan',
        fn: () => { evil(2); return 'Lão vui mừng uống ngay, cả nhà mở tiệc. Ngươi ôm rương vàng ra cổng. Ba tháng sau nghe tin lão chết trong một giấc ngủ yên lành, miệng còn mỉm cười.' + money(M(40)) + tamma(6); },
      },
      { t: 'Nói thật: sinh tử có số', fn: () => 'Lão khóc như đứa trẻ. Ngươi ngồi uống với lão một chén trà, nghe lão kể chuyện đời. Lão nói cả đời lo kiếm tiền, đến giờ mới biết uống trà ngon.' + statUp('ngo', 1) + tamma(-5) },
    ],
  },
  {
    id: 'town_mong_pham',
    where: ['town', 'village'],
    w: 2,
    minR: 5,
    once: true,
    title: 'Đứa trẻ bán bánh',
    text: () => 'Đầu phố có một đứa trẻ đen nhẻm bán bánh rán, gào khản cổ mà không ai mua. Nhìn nó, ngươi chợt nhớ lại chính mình ngày còn là phàm nhân, chưa biết linh khí là gì, chỉ biết mỗi bữa no là vui.',
    ch: () => [
      { t: 'Mua hết rổ bánh, ngồi ăn bên lề đường', cls: 'prime', fn: () => 'Bánh rán dầu cũ, hơi khét, nóng bỏng tay. Một vị ' + realmN() + ' ngồi xổm bên lề đường ăn bánh, đứa trẻ nhìn ngươi như nhìn người điên. Ngươi cười. Lâu lắm rồi ngươi mới cười như vậy.' + tamma(-30) + statUp('tam', 2) + cult(60) },
      { t: 'Điểm một ngón tay khai mở linh căn cho nó', fn: () => { good(3); const n = meet({ r: 0, tag: 'acq', rel: 50, how: 'Đứa trẻ bán bánh được ngươi khai linh căn', sect: null, age: 10, talent: 1 }); return `${n.name} đánh rơi cả rổ bánh, chỉ thấy toàn thân ấm sực. Ngươi để lại cho nó một bản công pháp nhập môn. Thêm một người bước lên tiên lộ — không biết là phúc hay họa.` + statUp('ngo', 1); } },
      { t: 'Đi qua', fn: () => 'Tiếng rao nhỏ dần sau lưng. Có những thứ đã mất, tu bao nhiêu cũng không lấy lại được.' + tamma(5) },
    ],
  },
  {
    id: 'town_kinhdo_quocsu',
    where: ['town'],
    reg: ['trungtho'],
    w: 3,
    minR: 2,
    maxR: 5,
    cd: 30,
    cond: () => s.loc === 'kinhdo',
    title: 'Quốc sư phủ mời khách',
    text: () => 'Một thư đồng mặc áo xanh mang thiệp mời vàng đến tận quán trọ: Quốc sư Đại Chu mở yến "luận bảo", mời các tu sĩ có danh ở Thiên Kinh đến dự. Ai đem tới bảo vật làm Quốc sư vừa lòng sẽ được đổi một món trong kho phủ.',
    ch: () => [
      {
        t: 'Đến dự yến',
        cls: 'prime',
        fn: () => ({
          text: 'Phủ Quốc sư rộng như một tòa thành nhỏ. Giữa yến, Quốc sư — một lão nhân mắt sáng như sao — chỉ vào ngươi: "Vị đạo hữu này mang gì tới?"',
          choices: [
            { t: 'Trình ra một món trang bị', dis: !spareGear().length, hint: spareGear().length ? 'Mất một trang bị trong túi' : 'Túi không có trang bị dư', fn: () => { const g = takeGear(); fame(5); return `Quốc sư cầm ${g.n} lên ngắm nghía, gật đầu: "Được." Ngươi được dẫn vào kho phủ chọn đồ.` + (ch(0.5) ? gain(breakPill() || cultPill()) : giveGear(effRi(), 2)); } },
            { t: 'Ngâm một bài thơ thay lễ vật', fn: () => (s.stats.ngo + s.stats.mi >= 13 ? 'Cả yến im lặng. Quốc sư vỗ bàn khen hay, tặng ngươi một quyển thuật thư trong kho.' + gain('sk:' + pick(['ngukiem', 'kimchungtrao', 'sontrung'])) + statUp('mi', 1) : 'Thơ của ngươi... vần thì có vần. Quốc sư cười xòa, mời thêm chén rượu. Ngươi ra về, đỏ mặt cả đường.' + heal(10)) },
            { t: 'Thẳng thắn nói: ta đến xem cho biết', fn: () => 'Quốc sư cười lớn: "Thẳng thắn hiếm hơn bảo vật." Ông ta tặng ngươi một bình rượu ngự, uống vào thấy linh khí cuộn trào.' + cult(25) },
          ],
        }),
      },
      { t: 'Từ chối, giữ mình xa quyền quý', fn: () => 'Ngươi trả thiệp. Thư đồng nhìn ngươi như nhìn quái vật.' + statUp('tam', 1) },
    ],
  },
  {
    id: 'town_road_mucdong',
    where: ['road'],
    reg: ['bacminh'],
    w: 3,
    cd: 10,
    title: 'Đàn sói trên tuyết',
    text: () => 'Gió tuyết thổi trắng xóa. Phía trước, một bầy sói xám đang vây quanh một túp lều da, bên trong có tiếng trẻ con khóc. Con đầu đàn to như con bê, mắt xanh lè, không giống sói thường.',
    ch: () => [
      { t: 'Đuổi bầy sói', cls: 'prime', fn: () => battle(effRi() <= 1 ? beast(Math.max(0, effRi()), 1) : beast(effRi(), 0.8), { win: () => { good(2); return 'Sói đầu đàn ngã gục, cả bầy tản vào bão tuyết. Người mẹ trong lều ôm con ra, cho ngươi một bát trà sữa nóng và một tấm da lông.' + gain('m:longthu') + heal(10); }, lose: () => 'Ngươi bị cắn rách vai, nhưng cũng kịp kéo mẹ con họ chạy tới trại gần nhất.' + hurt(10) }) },
      { t: 'Đốt lửa dọa sói', fn: () => (ch(0.6) ? 'Ngọn lửa bùng lên giữa tuyết. Sói lùi lại, gầm gừ, rồi bỏ đi. Đêm ấy ngươi ngồi canh lửa cạnh túp lều.' + statUp('tam', 1) : 'Gió quá mạnh, lửa tắt. Ngươi phải liều đánh tay không, áo rách tả tơi.' + hurt(20)) },
      { t: 'Đi tiếp', fn: () => 'Gió tuyết nuốt mất tiếng khóc. Ngươi kéo cổ áo cao hơn.' + tamma(8) },
    ],
  },
  {
    id: 'town_pho_truyenthuyet',
    where: ['town', 'village'],
    w: 3,
    minR: 5,
    cd: 50,
    cond: () => s.fame >= 100,
    title: 'Ngươi trong lời kể người khác',
    text: () => `Trong quán trà ${here().n}, một ông kể chuyện đập thước: "Hồi ấy, ${s.name} tiên trưởng một kiếm chém đôi núi..." Toàn chuyện ngươi chưa từng làm. Trẻ con nghe há hốc miệng. Ngươi ngồi ngay bàn bên, không ai nhận ra.`,
    ch: () => [
      { t: 'Đứng lên đính chính', fn: () => { fame(-5); return 'Ngươi nói thật mọi chuyện. Không ai tin. Ông kể chuyện bảo ngươi là kẻ ganh ghét, cả quán đuổi ngươi ra. Ngươi cười suốt đường về.' + statUp('tam', 1); } },
      { t: 'Thưởng cho ông kể chuyện một thỏi vàng', cls: 'prime', fn: () => { fame(10); return 'Ông kể chuyện cầm vàng, không hiểu gì, nhưng từ hôm đó câu chuyện có thêm đoạn "tiên trưởng thích nghe kể chuyện, hay đến quán trà ngồi ẩn danh".'; } },
      { t: 'Ngồi nghe hết', fn: () => 'Danh tiếng là thứ người đời tự nặn ra. Ngươi uống hết ấm trà, đặt tiền lên bàn, đi.' + statUp('ngo', 1) + tamma(-5) },
    ],
  },
]);

void [mark, flag, realmStage, npcTitle, cap, lose, fmt, learnSkill, REALMS];
