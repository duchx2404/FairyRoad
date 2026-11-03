// Hiểm địa, bí cảnh và các dấu trên bản đồ (?, !, bao = bảo vật, bi = bí ẩn).
// Độ khó: hiểm địa/bí cảnh theo here().lv; dấu bản đồ theo s.flags.pinLv (engine gán trước khi gọi).
import { RMAX, effRi,
  register, s, M, gain, money, cult, hurt, heal, statUp, tamma, fame, good, evil, learnSkill, giveGear,
  meet, ch, ri, pick, clamp, realmN, here, mark, setFlag, flag, canPay, hasItem, lose, stat,
  fight, fightSummary, beastFoe, dangerLabel, itemName, years, turnY, lifeAdd, TECHS, SKILLS,
  type Choice, type Outcome, type FoeSpec, type FightResult, type El, type GameEvent,
} from '../engine/api';
import { HERBS, TALIS, MATS } from '../data/items';
import { BREAK_PILL, WORLD, LAST_WORLD, REALMS } from '../data/core';
import { isChaosBroken, CHAOS_FORGE_MATS } from '../engine/items';

// ======================= Helper nội bộ =======================

/** Cấp hiểm địa / bí cảnh đang đứng. */
const LV = () => clamp(here().lv ?? effRi(), 0, RMAX());
/** Cấp của dấu bản đồ vừa bấm. */
const PL = () => clamp(typeof s.flags.pinLv === 'number' ? s.flags.pinLv : effRi(), 0, RMAX());
const REG = () => here().reg;

/** Yêu thú hợp vùng, cố định tiểu cảnh giới để nhãn nguy hiểm khớp trận thật. */
const yeuThu = (lv: number, mult = 1): FoeSpec => ({ ...beastFoe(clamp(lv, 0, RMAX()), REG(), mult).spec, st: ri(0, 3) });
/** Tu sĩ địch ở cảnh giới tuyệt đối r. */
const tuSi = (name: string, r: number, mult = 1, el?: El): FoeSpec => ({ name, r: clamp(r, 0, RMAX()), st: ri(0, 3), kind: 'cultivator', mult, ...(el ? { el } : {}) });
/** Quái đặc biệt (boss / ma vật). */
const quai = (name: string, r: number, kind: 'boss' | 'demon' | 'beast', mult = 1, el?: El, mat?: string): FoeSpec => ({ name, r: clamp(r, 0, RMAX()), st: ri(1, 3), kind, mult, ...(el ? { el } : {}), ...(mat ? { mat } : {}) });

/** Chú thích nút: đối thủ, cảnh giới, mức nguy hiểm. */
const nguy = (f: FoeSpec) => `${f.name} · ${f.r ? realmN(f.r) : 'chưa khai linh'} · ${dangerLabel(f)}`;

/** Đánh một trận; nếu chết thì chỉ trả về câu tử trận. win/flee/lose có thể trả về bước kế tiếp. */
function duel(spec: FoeSpec, o: { win: (r: FightResult) => Outcome; flee?: (r: FightResult) => Outcome; lose?: (r: FightResult) => Outcome; lethal?: boolean; noFlee?: boolean }): Outcome {
  const r = fight(spec, { lethal: o.lethal, noFlee: o.noFlee });
  let t = fightSummary(r);
  // Chiến lợi phẩm đã được liệt kê trong r.lootDesc (fightSummary).
  const join = (x: Outcome): Outcome => (typeof x === 'string' ? t + ' ' + x : { ...x, text: t + ' ' + x.text });
  if (r.died) return t;
  if (r.win) return join(o.win(r));
  if (r.fled) return o.flee ? join(o.flee(r)) : t + ' Ngươi tháo chạy, chẳng mang theo được gì.';
  return o.lose ? join(o.lose(r)) : t;
}

/** Linh thảo theo phẩm, ưu tiên loài mọc ở vùng này. */
function herb(t: number): string {
  const tt = clamp(Math.round(t), 1, 6);
  const all = Object.values(HERBS).filter((h) => h.tier === tt);
  const local = all.filter((h) => h.reg.includes(REG()));
  return 'h:' + pick(local.length ? local : all).id;
}
/** Linh thảo phẩm ≈ cấp (lv hoặc lv+1). */
const herbLv = (lv: number, bonus = 0) => herb(Math.max(1, lv) + bonus + (ch(0.3) ? 1 : 0));

const CULT_PILL = ['tukhi', 'tukhi', 'ngungnguyen', 'hoanguyen', 'duonganh', 'hoathan', 'hoathan', 'hoathan', 'hoathan'];
const cultPill = (r = effRi()) => 'p:' + CULT_PILL[clamp(r, 0, RMAX())];
/** Đan phá cảnh cho bước kế tiếp của người chơi. */
const breakPill = () => 'p:' + (effRi() < 8 ? BREAK_PILL[effRi() + 1] : CULT_PILL[8]);

/** Phẩm bí kíp tối đa: cảnh giới/2 + 1. */
const techCap = () => clamp(Math.floor(effRi() / 2) + 1, 1, 4);
function techBook(cap = techCap(), els?: El[], wantEvil = false): string {
  const base = Object.values(TECHS).filter((t) => !t.blood && t.tier <= cap && !!t.evil === wantEvil);
  let pool = base.filter((t) => t.tier >= cap - 1);
  if (els) {
    const f = pool.filter((t) => t.el.some((e) => els.includes(e)));
    if (f.length) pool = f;
  }
  if (!pool.length) pool = base.length ? base : Object.values(TECHS).filter((t) => !t.blood && t.tier <= cap);
  return 'cp:' + pick(pool).id;
}
function skillBook(cap = techCap(), el?: El): string {
  let pool = Object.values(SKILLS).filter((k) => !k.peak && k.tier <= cap && k.tier >= cap - 1);
  if (el) {
    const f = pool.filter((k) => k.el === el);
    if (f.length) pool = f;
  }
  if (!pool.length) pool = Object.values(SKILLS).filter((k) => !k.peak && k.tier <= Math.max(1, cap));
  return 'sk:' + pick(pool).id;
}
function talis(t: number): string {
  const tt = clamp(t, 1, 4);
  const pool = Object.values(TALIS).filter((x) => !x.co && x.tier === tt);
  return 't:' + pick(pool.length ? pool : Object.values(TALIS).filter((x) => !x.co && x.tier <= tt)).id;
}
function mat(t: number): string {
  const tt = clamp(t, 1, 6);
  const all = Object.values(MATS).filter((m) => m.id !== 'phuchi' && m.id !== 'chusa');
  const near = all.filter((m) => Math.abs(m.tier - tt) <= 1);
  return 'm:' + pick(near.length ? near : all).id;
}
/** Phẩm trang bị tối đa 4. */
const gearG = (g: number) => clamp(g, 0, 4);
const nam = (y: number) => years(Math.max(0.1, y));
/** Văn thêm có xác suất. */
const may = (p: number, f: () => string) => (ch(p) ? f() : '');

/** Mô tả cảnh theo vùng. */
const SCENE: Record<string, string> = {
  trungtho: 'Gió thổi qua cánh đồng cổ, cỏ rạp xuống để lộ những mũi giáo gỉ sét cắm nghiêng.',
  bacminh: 'Băng nguyên trắng xóa tới tận chân trời. Tuyết rơi không tiếng động, hơi thở đóng thành sương trên mi mắt.',
  tayluong: 'Cát vàng cuộn thành sóng. Xa xa, miệng núi lửa phun một cột khói đỏ như máu đông.',
  namman: 'Rừng già dày đặc, chướng khí xanh lục trôi lững lờ giữa những thân cây to ba người ôm.',
  vanmong: 'Sương mù trắng đục phủ mặt đầm. Tiếng nước vỗ, tiếng ếch, và một thứ gì đó lướt qua dưới bèo.',
  donghai: 'Sóng bạc đầu đập vào ghềnh đá. Trên đỉnh đảo, sét tím giáng xuống liên hồi như trời đang rèn kiếm.',
  tienchau: 'Biển mây cuộn dưới chân. Không gian nơi đây méo mó, ánh sáng bẻ cong thành những vệt cầu vồng câm lặng.',
};
const scene = () => SCENE[REG()] ?? 'Núi rừng hoang vu, sương mỏng như khói hương.';

/** Yêu tộc biết nói theo vùng. */
const YEUTOC: Record<string, { n: string; d: string; el: El; g: 'm' | 'f' }> = {
  trungtho: { n: 'Hoàng Bì Lão Tiên', d: 'một con chồn vàng già khoác áo đạo sĩ rách, ngồi xếp bằng trên mỏm đá', el: 'tho', g: 'm' },
  bacminh: { n: 'Tuyết Nhi', d: 'một con cáo trắng ba đuôi, mắt xanh như băng, nằm cuộn trên tảng đá phủ tuyết', el: 'bang', g: 'f' },
  tayluong: { n: 'Sa Lão Quy', d: 'một con rùa đất mai nứt như ruộng hạn, già tới mức cát đã đóng thành rêu trên lưng', el: 'tho', g: 'm' },
  namman: { n: 'Thanh Y', d: 'một con rắn xanh dài ba trượng, nửa thân trên đã hóa thành thiếu nữ áo lục', el: 'moc', g: 'f' },
  vanmong: { n: 'Bạch Lộ Quân', d: 'một con cò trắng đứng một chân giữa đầm, lông cánh phát ra ánh sáng mờ', el: 'thuy', g: 'm' },
  donghai: { n: 'Lam Lân', d: 'một con cá chép xanh to bằng con thuyền, nổi lên khỏi mặt sóng, râu rồng mới nhú', el: 'thuy', g: 'm' },
  tienchau: { n: 'Vân Hạc Tử', d: 'một con hạc đầu đỏ đứng trên ngọn tùng mọc ngược giữa không trung', el: 'phong', g: 'm' },
};

// ======================= Sự kiện nhân bản cho hiểm địa và dấu bản đồ =======================

/** Yêu thú mẹ bảo vệ con (chuỗi 2 bước). */
function evYeuMau(id: string, where: GameEvent['where'], lvF: () => number): GameEvent {
  return {
    id,
    where,
    w: 3,
    cd: 10,
    title: 'Hang thú non',
    text: () => `Sau bụi gai có một cái hang nông. Ba con thú non lông còn ướt đang rúc vào nhau. Phía sau ngươi, cành khô gãy rắc — con mẹ đã về, mắt đỏ ngầu, nanh nhỏ dãi.`,
    ch: () => {
      const me = yeuThu(lvF(), 1.3);
      return [
        {
          t: 'Giết thú mẹ, bắt thú non',
          cls: 'danger',
          hint: nguy(me) + ' · liều chết bảo vệ con',
          fn: () =>
            duel(me, {
              noFlee: false,
              win: () => ({
                text: `${me.name} gục xuống, thân vẫn che trước miệng hang. Ba con non kêu lên những tiếng the thé.`,
                choices: [
                  {
                    t: 'Bắt mang đi bán',
                    fn: () => {
                      evil(2);
                      return 'Thú non yêu tộc là hàng hiếm ở phường thị. Ngươi nhét chúng vào bao, cố không nghe tiếng kêu.' + money(M(30 + lvF() * 10)) + tamma(6);
                    },
                  },
                  {
                    t: 'Lấy yêu đan rồi để chúng lại',
                    fn: () => 'Ngươi mổ lấy yêu đan, quay lưng đi. Rừng sẽ quyết định số phận chúng.' + gain('m:yeudan') + tamma(3),
                  },
                  {
                    t: 'Ôm chúng tới chỗ an toàn',
                    fn: () => {
                      good(2);
                      return 'Ngươi mang ba con non tới một khe đá sâu, để lại chút thịt khô. Lúc quay đi, con lớn nhất nhìn theo ngươi rất lâu.' + statUp('tam', 1);
                    },
                  },
                ],
              }),
            }),
        },
        {
          t: 'Lùi lại thật chậm',
          cls: 'prime',
          fn: () => {
            if (ch(0.55 + stat('van') * 0.03)) {
              good(1);
              return 'Ngươi hạ tay, lùi từng bước. Con mẹ gầm gừ nhưng không đuổi. Khi ra khỏi bụi gai, ngươi thấy một cây linh thảo mọc ngay vết chân nó vừa giẫm.' + gain(herbLv(lvF()));
            }
            return 'Con mẹ không tin ngươi. Một cú vồ sượt qua vai, máu thấm áo. Ngươi lăn xuống dốc mới thoát được.' + hurt(18);
          },
        },
        { t: 'Bỏ đi', fn: () => 'Ngươi vòng đường khác. Tiếng gầm sau lưng xa dần.' },
      ];
    },
  };
}

/** Tán tu giết người đoạt bảo. */
function evTanTu(id: string, where: GameEvent['where'], lvF: () => number): GameEvent {
  return {
    id,
    where,
    w: 4,
    minR: 1,
    cd: 8,
    title: 'Kẻ chặn đường',
    text: () => {
      const v = pick(['một xác tu sĩ còn ấm', 'hai cái xác nằm sấp trong vũng máu', 'một thiếu niên bị ghim xuống đất bằng phi kiếm']);
      return `Mùi máu tanh dẫn ngươi tới khoảng rừng trống. Dưới gốc cây là ${v}. Kẻ ra tay đang lục túi trữ vật, ngẩng lên nhìn ngươi, cười nhạt: "Thấy rồi thì để lại túi của ngươi luôn đi."`;
    },
    ch: () => {
      const lv = lvF();
      const k = tuSi(pick(['Tán tu mặt sẹo', 'Huyết Thủ Lão Lục', 'Kẻ áo xám', 'Tán tu cụt tai']), Math.max(1, lv + (ch(0.4) ? 1 : 0)));
      const fee = M(25 + lv * 8);
      return [
        {
          t: 'Rút binh khí',
          cls: 'danger',
          hint: nguy(k),
          fn: () =>
            duel(k, {
              win: () => {
                fame(5);
                return `Ngươi lục người hắn: túi trữ vật căng phồng — phần lớn là đồ của người chết.` + money(M(40 + lv * 15)) + (ch(0.5) ? giveGear(clamp(k.r, 0, RMAX()), ri(1, 2)) : gain(talis(Math.ceil((k.r + 1) / 2))));
              },
              flee: () => 'Hắn không đuổi theo, chỉ cười vang sau lưng ngươi.',
              lose: () => 'Hắn lột sạch linh thạch của ngươi rồi đá ngươi xuống suối.' + money(-Math.floor(s.money * 0.4)),
            }),
        },
        {
          t: `Ném túi linh thạch mua mạng (${fee})`,
          dis: !canPay(fee),
          fn: () => {
            s.money -= fee;
            return 'Hắn bắt lấy túi, cân thử, hất cằm: "Biết điều." Ngươi đi, không ngoảnh lại.' + tamma(3);
          },
        },
        {
          t: 'Bỏ chạy',
          fn: () => (ch(0.5 + stat('van') * 0.03) ? 'Ngươi lao vào bụi rậm, đổi hướng ba lần. Không còn tiếng bước chân sau lưng.' : 'Phi kiếm của hắn đuổi kịp, xẻ một đường dài trên lưng ngươi trước khi ngươi thoát được.' + hurt(22)),
        },
      ];
    },
  };
}

/** Linh tuyền. */
function evLinhTuyen(id: string, where: GameEvent['where'], lvF: () => number): GameEvent {
  return {
    id,
    where,
    w: 3,
    minR: 1,
    cd: 15,
    title: 'Linh tuyền',
    text: () => `${scene()} Giữa khe đá có một mạch nước nhỏ, trong tới mức thấy cả từng hạt cát dưới đáy. Hơi nước bốc lên mang theo linh khí đặc như sữa.`,
    ch: () => {
      const lv = lvF();
      const canh = yeuThu(lv, 1.1);
      return [
        {
          t: 'Ngồi xuống bên suối tu luyện',
          cls: 'prime',
          hint: 'Mất chút thời gian',
          fn: () => {
            nam(turnY());
            if (ch(0.3)) {
              return {
                text: `Ngươi đang nhập định thì mặt nước gợn sóng. ${canh.name} — chủ nhân mạch suối — đã về.`,
                choices: [
                  { t: 'Đứng dậy nghênh chiến', cls: 'danger', hint: nguy(canh), fn: () => duel(canh, { win: () => 'Mạch suối giờ là của ngươi, dù chỉ một đêm.' + cult(35) + heal(30) }) },
                  { t: 'Thu công rút đi', fn: () => 'Ngươi rút khỏi suối, tu vi vừa gom được tản mất một nửa.' + cult(10) },
                ],
              };
            }
            return 'Linh khí chảy vào kinh mạch êm như nước vào ruộng khô. Vết thương cũ cũng lành dần.' + cult(ri(20, 35)) + heal(40);
          },
        },
        {
          t: 'Đóng bình mang đi',
          fn: () => 'Ngươi lấy bình ngọc hứng đầy. Linh tuyền rời nguồn sẽ yếu dần, nhưng uống vẫn có ích.' + gain('x:linhtuyen'),
        },
        { t: 'Rửa mặt rồi đi tiếp', fn: () => 'Nước mát lạnh. Tâm trí sáng ra đôi chút.' + tamma(-5) },
      ];
    },
  };
}

/** Hang có hài cốt tu sĩ (chuỗi). */
function evHaiCot(id: string, where: GameEvent['where'], lvF: () => number): GameEvent {
  return {
    id,
    where,
    w: 3,
    minR: 1,
    cd: 12,
    title: 'Hài cốt trong hang',
    text: () => 'Cửa hang bị dây leo che kín. Bên trong, một bộ hài cốt ngồi xếp bằng, áo đạo bào đã mục thành tro, bên hông còn đeo túi trữ vật. Trên vách đá có vết móng tay cào thành bốn chữ: "Hậu nhân cẩn thận."',
    ch: () => {
      const lv = lvF();
      const hon = quai('Tàn hồn cổ tu', Math.max(1, lv + 1), 'demon', 0.8, undefined);
      return [
        {
          t: 'Bái ba lạy rồi lấy túi',
          cls: 'prime',
          fn: () => ({
            text: 'Ngươi vừa chạm tay vào túi, hốc mắt hài cốt sáng lên hai đốm lửa xanh. Một giọng khàn khàn vang trong đầu: "Muốn lấy đồ của ta, cho ta xem đạo tâm của ngươi."',
            choices: [
              {
                t: 'Mở thức hải đón thử thách',
                cls: 'danger',
                hint: 'Đạo tâm càng cao càng dễ qua',
                fn: () => {
                  if (ch(0.3 + stat('tam') * 0.05)) {
                    mark('Được tàn hồn cổ tu truyền lại di vật');
                    return 'Tàn hồn lục lọi ký ức ngươi, rồi thở dài: "Cũng được. Mang đi, đừng làm nhục nó." Lửa xanh tắt. Hài cốt đổ sụp thành bụi.' + money(M(60 + lv * 20)) + gain(techBook()) + (ch(0.35) ? gain('x:banddo') : gain(herbLv(lv, 1)));
                  }
                  return 'Tàn hồn quét qua thức hải như gió lạnh. Ngươi thấy lại mọi điều mình hối hận. Khi tỉnh lại, túi trữ vật đã thành tro.' + tamma(12) + hurt(10);
                },
              },
              { t: 'Buông tay, lui ra', fn: () => 'Lửa xanh mờ dần. Ngươi đi ra, lưng lạnh toát.' },
            ],
          }),
        },
        {
          t: 'Giật lấy ngay',
          cls: 'danger',
          hint: nguy(hon),
          fn: () => {
            evil(1);
            return duel(hon, {
              win: () => 'Tàn hồn tan thành khói. Ngươi lục túi, bên trong là tích góp cả đời một người.' + money(M(70 + lv * 25)) + giveGear(clamp(lv + 1, 0, RMAX()), ri(1, 2)) + (ch(0.3) ? gain('x:banddo') : ''),
            });
          },
        },
        {
          t: 'Chôn cất ông ta',
          fn: () => {
            good(2);
            if (ch(0.4)) return 'Ngươi đào huyệt, đặt hài cốt xuống. Dưới lớp đất nơi ông ngồi có một miếng ngọc giản, như cố tình để lại cho người tử tế.' + gain('x:ngocgian');
            return 'Ngươi đắp một nấm mồ nhỏ, cắm cành cây làm bia. Lòng nhẹ đi đôi chút.' + tamma(-8);
          },
        },
      ];
    },
  };
}

/** Đội săn rủ hợp tác rồi phản bội (chuỗi 3 bước). */
function evDoiSan(id: string, where: GameEvent['where'], lvF: () => number): GameEvent {
  return {
    id,
    where,
    w: 3,
    minR: 1,
    cd: 15,
    title: 'Đội săn yêu vương',
    text: () => 'Ba tu sĩ đang ngồi quanh đống lửa, kẻ cầm đầu vẫy ngươi lại: "Đạo hữu, phía trước có một con yêu vương sắp kết yêu đan. Bốn người chia đều, một mình thì chết chắc. Đi không?" Hai kẻ còn lại liếc nhau rất nhanh.',
    ch: () => {
      const lv = lvF();
      const vuong = yeuThu(lv + 1, 0.75); // có đồng đội gánh bớt
      return [
        {
          t: 'Nhận lời',
          cls: 'prime',
          hint: 'Có đồng đội: ' + nguy(vuong),
          fn: () =>
            duel(vuong, {
              win: () => {
                const phan = tuSi('Kẻ cầm đầu đội săn', Math.max(1, lv), 1.35);
                return {
                  text: `Yêu vương ngã xuống. Ngươi vừa thở ra, gáy chợt lạnh: ba kẻ kia đã đứng thành hình tam giác vây ngươi. "Đạo hữu, chia bốn thì ít quá."`,
                  choices: [
                    {
                      t: 'Ra tay trước',
                      cls: 'danger',
                      hint: 'Ba người hợp sức: ' + nguy(phan),
                      fn: () =>
                        duel(phan, {
                          win: () => {
                            fame(10);
                            mark('Phản sát đội săn phản bội');
                            return 'Kẻ cầm đầu ngã, hai tên kia bỏ chạy tán loạn. Toàn bộ chiến lợi phẩm thuộc về ngươi.' + gain('m:yeudan', 2) + money(M(60 + lv * 20)) + giveGear(clamp(lv, 0, RMAX()), ri(1, 2));
                          },
                          lose: () => 'Bọn chúng lấy hết rồi bỏ ngươi giữa rừng.' + money(-Math.floor(s.money * 0.3)),
                        }),
                    },
                    {
                      t: 'Buông yêu đan, xin đi',
                      fn: () => 'Ngươi đặt yêu đan xuống, lùi ra. Kẻ cầm đầu cười: "Biết thời thế." Ngươi giữ được mạng, và một bài học.' + statUp('tam', 1) + tamma(5),
                    },
                    {
                      t: 'Đốt phù bỏ chạy',
                      dis: !Object.keys(TALIS).some((t) => TALIS[t].k === 'flee' && hasItem('t:' + t)),
                      hint: 'Cần phù độn thổ',
                      fn: () => {
                        const f = Object.keys(TALIS).find((t) => TALIS[t].k === 'flee' && hasItem('t:' + t))!;
                        lose('t:' + f);
                        return 'Lá phù cháy, thân ngươi hóa thành vệt sáng. Ngươi còn kịp chộp theo yêu đan.' + gain('m:yeudan');
                      },
                    },
                  ],
                };
              },
              flee: () => 'Cả đội tan tác. Ba kẻ kia chạy nhanh hơn ngươi tưởng — như thể đã tính trước.',
            }),
        },
        { t: 'Từ chối khéo', fn: () => 'Ngươi cười, nói mình còn việc. Ánh mắt kẻ cầm đầu thoáng tiếc nuối. Có lẽ ngươi vừa tránh được gì đó.' },
      ];
    },
  };
}

// ======================= Đăng ký =======================

register([
  // ---------------- HIỂM ĐỊA: chung ----------------
  {
    id: 'wild_sanyeu',
    where: ['wild'],
    w: 5,
    cd: 4,
    title: 'Dấu chân yêu thú',
    text: () => `${scene()} Trên đất ẩm có dấu chân to bằng cái mâm, còn mới. Mùi tanh nồng phảng phất trong gió.`,
    ch: () => {
      const f = yeuThu(LV());
      return [
        {
          t: 'Lần theo săn nó',
          cls: 'danger',
          hint: nguy(f),
          fn: () => duel(f, { win: () => 'Ngươi xẻ thịt lấy những phần đáng giá.' + (ch(0.4) ? gain(herbLv(LV())) : money(M(15 + LV() * 5))) + cult(ri(5, 12)) }),
        },
        {
          t: 'Theo xa, xem nó canh giữ gì',
          fn: () => (ch(0.45 + stat('van') * 0.02) ? 'Con thú dẫn ngươi tới một khe núi nơi nó hay ăn cỏ. Ngươi hái trộm vài cây rồi lặng lẽ rút.' + gain(herbLv(LV())) : 'Nó đánh hơi được ngươi, gầm một tiếng rồi biến vào rừng. Uổng nửa ngày.'),
        },
        { t: 'Tránh đi', fn: () => 'Ngươi đi đường vòng. Sống lâu mới tu được lâu.' },
      ];
    },
  },
  evYeuMau('wild_yeumau', ['wild'], LV),
  evTanTu('wild_tantu', ['wild'], LV),
  evLinhTuyen('wild_linhtuyen', ['wild'], LV),
  evHaiCot('wild_haicot', ['wild'], LV),
  evDoiSan('wild_doisan', ['wild'], LV),
  {
    id: 'wild_lacduong',
    where: ['wild'],
    w: 2,
    cd: 30,
    title: 'Lạc lối',
    text: () => `${scene()} Ngươi đã đi qua cái cây gãy ngọn này ba lần. La bàn quay loạn. Mặt trời mọc ở phía ngươi vừa cho là tây.`,
    ch: () => [
      {
        t: 'Ngồi xuống đợi đêm, nhìn sao định hướng',
        cls: 'prime',
        fn: () => {
          if (ch(0.3 + stat('ngo') * 0.05)) {
            nam(turnY() * 0.5);
            return 'Đêm thứ ba, sao Bắc Đẩu hiện ra qua kẽ mây. Ngươi đi theo nó, và trong lúc nhìn trời lâu như vậy, ngươi chợt hiểu thêm một chút về sự vận hành của thiên địa.' + cult(ri(15, 25));
          }
          const y = Math.max(1, Math.round(turnY() * ri(3, 6)));
          nam(y);
          return `Mây không tan. Ngươi đi mãi, ăn rễ cây, uống sương. Khi thấy lại khói bếp nhân gian thì đã ${y} năm trôi qua.` + statUp('can', 1);
        },
      },
      {
        t: 'Đi theo dòng nước',
        fn: () => {
          const y = Math.max(0.5, Math.round(turnY() * ri(1, 4) * 10) / 10);
          nam(y);
          return `Nước chảy rồi cũng ra sông. Mất ${y} năm, nhưng dọc đường ngươi hái được thứ quý.` + gain(herbLv(LV()));
        },
      },
      {
        t: 'Cắt tay lấy máu vẽ trận phá ảo',
        cls: 'danger',
        hint: 'Liều, nhưng nhanh',
        fn: () => (ch(0.5) ? 'Trận vẽ bằng máu sáng lên, sương rách ra một khe. Ngươi bước ra ngoài, mặt trắng bệch.' + hurt(15) : 'Trận vỡ ngay khi thành hình, phản phệ đâm ngược vào kinh mạch.' + hurt(30) + tamma(5)),
      },
    ],
  },
  {
    id: 'wild_ngodao',
    where: ['wild', 'pin?'],
    w: 3,
    minR: 1,
    cd: 20,
    title: 'Thiên địa có đạo',
    text: () => {
      const v: Record<string, string> = {
        trungtho: 'Ngươi đứng giữa cổ chiến trường lúc hoàng hôn. Vạn binh khí gãy cắm trong đất, mà cỏ vẫn mọc xanh qua kẽ giáp.',
        bacminh: 'Một bông tuyết rơi lên đầu ngón tay ngươi. Sáu cánh, không cánh nào giống cánh nào, và nó tan đi trong một hơi thở.',
        tayluong: 'Dung nham chảy xuống biển cát, đông lại thành đá đen. Ba ngày sau, một mầm cỏ đã nhú lên từ khe nứt.',
        namman: 'Một cây cổ thụ mục rỗng ruột đổ xuống. Trên thân nó, trăm loài nấm và rêu đang tranh nhau sống.',
        vanmong: 'Sương tan lúc bình minh, mặt đầm phẳng như gương. Ngươi nhìn xuống, thấy trời ở dưới chân.',
        donghai: 'Thủy triều rút, để lại những vỏ ốc trống rỗng. Thủy triều lên, lại mang chúng đi. Không ai giữ được gì.',
        tienchau: 'Một khe nứt không gian mở ra rồi khép lại. Ngươi thoáng thấy phía bên kia là hư vô — và hư vô cũng đang nhìn lại.',
      };
      return v[REG()] ?? 'Mây trôi qua đỉnh núi, không vội, không dừng.';
    },
    ch: () => [
      {
        t: 'Ngồi xuống quan sát',
        cls: 'prime',
        hint: 'Tốn một ít thời gian',
        fn: () => {
          nam(turnY());
          if (ch(0.15 + stat('ngo') * 0.03)) {
            mark('Ngộ đạo trước thiên địa');
            return 'Ngươi ngồi bất động, chim làm tổ trên vai. Đến khi đứng dậy, trong lòng như có một cánh cửa vừa hé.' + cult(ri(60, 100)) + statUp('ngo', 1);
          }
          return 'Có điều gì đó lóe lên rồi vụt mất. Không sao — hạt giống đã gieo.' + cult(ri(15, 30)) + tamma(-5);
        },
      },
      { t: 'Đi tiếp', fn: () => 'Ngươi ngắm thêm một lúc rồi lên đường.' },
    ],
  },
  {
    id: 'wild_yeutoc',
    where: ['wild', 'pin?'],
    w: 3,
    minR: 1,
    cd: 25,
    cond: () => !flag('yeutoc_' + REG()),
    title: 'Yêu tộc biết nói',
    text: () => {
      const y = YEUTOC[REG()] ?? YEUTOC.trungtho;
      return `Bên đường có ${y.d}. Nó mở miệng, tiếng người rõ ràng: "Tu sĩ nhân tộc, ngồi xuống uống chén trà đã. Đã lâu ta không được nói chuyện."`;
    },
    ch: () => {
      const y = YEUTOC[REG()] ?? YEUTOC.trungtho;
      const yf = quai(y.n, Math.max(1, LV() + 1), 'beast', 1.1, y.el, 'yeudan');
      return [
        {
          t: 'Ngồi xuống trò chuyện',
          cls: 'prime',
          fn: () => {
            setFlag('yeutoc_' + REG());
            if (ch(0.4 + stat('mi') * 0.04)) {
              const n = meet({ name: y.n, g: y.g, r: yf.r, el: y.el, tag: 'friend', rel: 35, sect: null, how: `Kết giao khi uống trà bên đường ở ${here().n}` });
              return `Hai bên nói chuyện tới tận trăng lên. ${n.name} kể chuyện ngàn năm trước, khi nhân tộc và yêu tộc còn chưa thù nhau. Lúc chia tay, nó tặng ngươi một vật.` + gain(herbLv(LV(), 1)) + statUp('ngo', 1);
            }
            return `${y.n} hỏi ngươi ba câu về đạo. Ngươi đáp được hai. Nó gật gù rồi biến mất, để lại chén trà còn ấm.` + cult(ri(10, 20));
          },
        },
        {
          t: 'Yêu đan của ngươi trông ngon đấy',
          cls: 'danger',
          hint: nguy(yf),
          fn: () => {
            evil(2);
            setFlag('yeutoc_' + REG());
            return duel(yf, { win: () => 'Nó chết mà mắt vẫn mở, như không tin một chén trà có thể kết thúc thế này.' + gain('m:yeudan') + cult(ri(20, 35)) + tamma(8) });
          },
        },
        { t: 'Cúi chào rồi đi', fn: () => `${y.n} cười khẽ: "Nhân tộc bây giờ ít người còn biết lễ." ` + tamma(-3) },
      ];
    },
  },

  // ---------------- HIỂM ĐỊA: theo vùng ----------------
  {
    id: 'wild_bm_bangphong',
    where: ['wild'],
    reg: ['bacminh'],
    w: 3,
    minR: 2,
    once: true,
    title: 'Người trong băng',
    text: () => 'Gió quét qua một vách băng xanh thẫm. Trong băng có một người — tu sĩ áo trắng, mắt nhắm, tay còn kết ấn. Băng xung quanh hắn không đông đặc mà lưu chuyển chậm như nước.',
    ch: () => {
      const co = tuSi('Băng Phong Cổ Tu', Math.max(2, LV() + 1), 1.2, 'bang');
      return [
        {
          t: 'Phá băng',
          cls: 'danger',
          fn: () => ({
            text: 'Băng nứt từng đường như mạng nhện. Người kia mở mắt, đồng tử trắng toát. Giọng hắn khô như tuyết: "Bao nhiêu năm rồi? ...Thôi khỏi. Ngươi giải phong cho ta, ta nợ ngươi. Nhưng nếu ngươi định cướp, thì đừng trách."',
            choices: [
              {
                t: 'Chắp tay: "Tiền bối cứ đi."',
                cls: 'prime',
                fn: () => {
                  good(2);
                  const n = meet({ name: 'Bạch Y Băng Khách', g: 'm', r: co.r, el: 'bang', tag: 'senior', rel: 40, sect: null, how: 'Được ngươi phá băng giải phong ở Bắc Minh' });
                  return `${n.name} gật đầu, ném cho ngươi một vật rồi hóa thành cơn gió tuyết.` + gain(techBook(techCap(), ['bang', 'thuy'])) + statUp('tam', 1);
                },
              },
              {
                t: 'Hắn vừa tỉnh, đang yếu — ra tay',
                cls: 'danger',
                hint: nguy(co),
                fn: () => {
                  evil(3);
                  return duel(co, { win: () => 'Cổ tu ngã xuống, thân thể vỡ thành băng vụn. Trong băng còn lại túi trữ vật của hắn.' + giveGear(co.r, 2, undefined, 'bang') + gain('m:hanngoc', 2) });
                },
              },
            ],
          }),
        },
        { t: 'Khắc dấu, ghi nhớ rồi đi', fn: () => 'Ngươi không đủ tự tin với thứ mình không hiểu. Gió tuyết xóa dấu chân ngươi gần như ngay lập tức.' },
      ];
    },
  },
  {
    id: 'wild_tl_hoatam',
    where: ['wild'],
    reg: ['tayluong'],
    w: 3,
    minR: 2,
    cd: 40,
    title: 'Đốm lửa trong dung nham',
    text: () => 'Sông dung nham sôi lục bục. Giữa dòng có một đốm lửa trắng nhỏ bằng hạt đậu, trôi ngược dòng, đi tới đâu dung nham đông lại tới đó. Linh hỏa — thứ luyện đan sư đổi cả mạng để có.',
    ch: () => {
      const tinh = quai('Dung Nham Hỏa Tinh', Math.max(2, LV() + 1), 'beast', 1.2, 'hoa', 'yeudan');
      return [
        {
          t: 'Lao vào chộp lấy',
          cls: 'danger',
          hint: 'Lửa bảo vệ chủ: ' + nguy(tinh),
          fn: () =>
            duel(tinh, {
              win: () => {
                mark('Thu được mồi linh hỏa ở Tây Lương');
                return 'Hỏa tinh tan, đốm lửa trắng rơi vào lòng bàn tay ngươi, cháy xèo xèo mà không bỏng. Ngươi phong nó vào hộp ngọc.' + gain('x:thanhoa') + hurt(10);
              },
            }),
        },
        {
          t: 'Hứng hơi nóng mà tôi luyện thân thể',
          fn: () => 'Ngươi ngồi sát bờ dung nham, để hơi nóng nướng da thịt. Đau, nhưng xương cốt chắc lại.' + statUp('can', 1) + hurt(15),
        },
        { t: 'Không đáng mạo hiểm', fn: () => 'Đốm lửa trôi xa dần rồi chìm xuống. Có lẽ trăm năm nữa nó mới nổi lên.' },
      ];
    },
  },
  {
    id: 'wild_tl_cothanh',
    where: ['wild'],
    reg: ['tayluong'],
    w: 3,
    minR: 3,
    cd: 30,
    title: 'Mái ngói lưu ly',
    text: () => 'Bão cát đêm qua thổi lộ ra một mái ngói lưu ly xanh biếc. Bên dưới là cửa điện bằng đồng, khắc chữ cổ ngươi đọc không ra. Hai pho khôi lỗi đá đứng hai bên cửa, trong hốc mắt lóe lên ánh vàng.',
    ch: () => {
      const kl = quai('Khôi lỗi đá giữ thành', Math.max(3, LV()), 'boss', 1.25, 'tho');
      return [
        {
          t: 'Đánh thẳng vào',
          cls: 'danger',
          hint: nguy(kl),
          fn: () =>
            duel(kl, {
              win: () => ({
                text: 'Khôi lỗi đổ sụp thành đá vụn. Trong điện tối om, có ba hộp gỗ trầm trên bệ thờ — nhưng cát đang bắt đầu chảy vào. Chỉ kịp lấy một.',
                choices: [
                  { t: 'Hộp khắc hình kiếm', fn: () => giveGear(clamp(LV() + 1, 0, RMAX()), 2, 0) },
                  { t: 'Hộp khắc hình sách', fn: () => gain(techBook()) },
                  { t: 'Hộp nặng nhất', fn: () => money(M(150 + LV() * 40)) + gain('x:linhthach_trung', ri(1, 3)) },
                ],
              }),
            }),
        },
        {
          t: 'Tìm lối khác qua mái ngói',
          fn: () => (ch(0.35 + stat('van') * 0.03) ? 'Ngươi bò qua một lỗ hổng trên mái, nhặt được vài món trong gian bên trước khi cát lấp lại.' + money(M(50 + LV() * 15)) + gain(mat(LV())) : 'Mái ngói sụp, ngươi rơi xuống giữa đống đá. Khôi lỗi quay đầu. Ngươi chạy thục mạng.' + hurt(25)),
        },
        { t: 'Rời đi trước khi bão tới', fn: () => 'Gió lại nổi. Đến sáng, cổ thành đã chìm xuống cát như chưa từng hiện ra.' },
      ];
    },
  },
  {
    id: 'wild_nm_cotrung',
    where: ['wild'],
    reg: ['namman'],
    w: 3,
    cd: 12,
    title: 'Người Man trúng cổ',
    text: () => 'Dưới tán rừng, một thanh niên người Man nằm co quắp, da nổi những đường xanh như rễ cây chạy dưới thịt. Hắn trúng cổ. Cách đó không xa, một ổ cổ trùng to bằng nắm tay đang rì rào.',
    ch: () => {
      const cotr = yeuThu(LV(), 1);
      return [
        {
          t: 'Đốt ổ cổ để giải cổ cho hắn',
          cls: 'danger',
          hint: nguy(cotr),
          fn: () =>
            duel(cotr, {
              win: () => {
                good(2);
                const n = meet({ name: pick(['A Mộc', 'Nham Cát', 'Đằng Lỗ']), g: 'm', r: Math.max(0, effRi() - 1), tag: 'friend', rel: 45, sect: null, el: 'moc', how: 'Được ngươi giải cổ trong rừng Nam Man' });
                return `${n.name} tỉnh lại, quỳ xuống dập đầu theo kiểu người Man. Hắn dẫn ngươi tới một gốc cây mà chỉ dân bản xứ biết.` + gain(herbLv(LV(), 1)) + gain('m:docnang');
              },
            }),
        },
        {
          t: 'Lấy độc nang trong ổ rồi đi',
          fn: () => {
            evil(1);
            return ch(0.6) ? 'Ngươi khều được hai độc nang, mặc kệ người kia rên rỉ.' + gain('m:docnang', 2) + tamma(4) : 'Cổ trùng bò lên tay ngươi trước khi ngươi kịp rụt lại.' + hurt(20);
          },
        },
        { t: 'Rời đi', fn: () => 'Rừng Nam Man mỗi ngày chết vài người. Ngươi không phải thần.' },
      ];
    },
  },
  {
    id: 'wild_vm_aocanh',
    where: ['wild'],
    reg: ['vanmong'],
    w: 3,
    minR: 1,
    cd: 20,
    title: 'Bóng người trong sương',
    text: () => {
      const d = s.npcs.find((n) => !n.alive && n.rel >= 30);
      return d
        ? `Sương dày tới mức không thấy tay mình. Rồi một bóng người hiện ra phía trước, dáng đi quen thuộc. ${d.name}. Người đã chết. ${d.name} quay lại, vẫy ngươi đi theo, sâu vào đầm.`
        : 'Sương dày tới mức không thấy tay mình. Rồi một bóng người hiện ra phía trước — chính là ngươi, nhưng già hơn, mắt trũng sâu. Nó vẫy ngươi đi theo, sâu vào đầm.';
    },
    ch: () => {
      const tinh = quai('Vụ Yêu', Math.max(1, LV()), 'demon', 1, 'thuy', 'yeudan');
      return [
        {
          t: 'Đi theo bóng người',
          cls: 'danger',
          hint: 'Có thể là ảo cảnh của yêu vật',
          fn: () => {
            if (ch(0.25 + stat('tam') * 0.04)) {
              return {
                text: 'Ngươi bước theo, nhưng giữ một sợi tỉnh táo trong lòng. Khi bóng người dừng trước một hồ nước đen, ngươi nhìn thấy cái miệng đầy răng ẩn dưới mặt nước.',
                choices: [
                  { t: 'Chém vào chính giữa ảo ảnh', cls: 'danger', hint: nguy(tinh), fn: () => duel(tinh, { win: () => 'Vụ yêu tan, sương rút đi như thủy triều. Đáy hồ lộ ra một cây linh thảo quấn đầy xương.' + gain(herbLv(LV(), 1)) + statUp('tam', 1) }) },
                  { t: 'Lặng lẽ rút', fn: () => 'Ngươi lùi lại từng bước cho tới khi sương mỏng đi.' + tamma(-5) },
                ],
              };
            }
            return 'Ngươi tỉnh lại khi nước đã ngập tới ngực, bùn lạnh siết quanh chân. Ngươi giãy ra được, nhưng những gì nhìn thấy trong sương không chịu rời khỏi đầu.' + hurt(15) + tamma(12);
          },
        },
        { t: 'Niệm thanh tâm chú, đứng yên', cls: 'prime', fn: () => 'Ngươi nhắm mắt niệm chú. Khi mở ra, bóng người đã tan. Chỉ có tiếng ếch và sương.' + tamma(-8) + may(0.3, () => statUp('tam', 1)) },
      ];
    },
  },
  {
    id: 'wild_dh_loimoc',
    where: ['wild'],
    reg: ['donghai'],
    w: 3,
    minR: 3,
    cd: 25,
    title: 'Cây bị sét đánh',
    text: () => 'Trên đỉnh đảo có một cây cổ thụ cháy đen, nhưng mỗi khi sét đánh vào, thân nó lại sáng lên những đường vân tím. Lôi Kích Mộc — gỗ đã ăn sét trăm năm.',
    ch: () => {
      const lt = yeuThu(LV(), 1.1);
      return [
        {
          t: 'Trèo lên chặt cành giữa lúc sét đánh',
          cls: 'danger',
          hint: 'Sét không phân biệt người tốt kẻ xấu',
          fn: () => {
            if (ch(0.45 + stat('van') * 0.03)) return 'Ngươi chém ba nhát giữa hai đợt sấm. Cành gỗ rơi xuống còn tóe lửa tím.' + gain('h:loikichmoc', ri(1, 2)) + hurt(12);
            return {
              text: 'Một tia sét giáng thẳng xuống. Ngươi bị hất văng, tóc dựng đứng. Trong lúc chưa đứng dậy được, một bóng đen lớn đáp xuống cạnh gốc cây.',
              choices: [
                { t: 'Gượng dậy chiến đấu', cls: 'danger', hint: nguy(lt), fn: () => duel(lt, { win: () => 'Ngươi giết được nó, rồi ngồi thở dốc dưới mưa. Cành gỗ vẫn nằm đó.' + gain('h:loikichmoc') }) },
                { t: 'Lăn xuống dốc chạy', fn: () => 'Ngươi lăn tới tận bãi đá. Toàn thân tê dại.' + hurt(10) },
              ],
            };
          },
        },
        {
          t: 'Ngồi dưới gốc, dẫn sét luyện thể',
          fn: () => (ch(0.4) ? 'Sét chạy qua kinh mạch như ngàn mũi kim. Ngươi cắn răng chịu đựng. Đến lúc mưa tạnh, da thịt ngươi rắn như đồng.' + statUp('can', 1) + cult(ri(20, 35)) + hurt(25) : 'Sét quá mạnh. Ngươi ngất đi nửa ngày.' + hurt(35)),
        },
        { t: 'Đứng xa mà nhìn', fn: () => 'Ngươi ngắm sấm sét một hồi. Thiên uy thật đáng sợ.' },
      ];
    },
  },
  {
    id: 'wild_tc_khenut',
    where: ['wild'],
    reg: ['tienchau'],
    w: 3,
    minR: 5,
    cd: 40,
    title: 'Khe nứt hư không',
    text: () => 'Không gian trước mặt nứt toác như tấm lụa bị xé. Bên mép khe, những tinh thể xám nhạt mọc ra — hư không thạch. Bên trong khe, có thứ gì đó đang bò.',
    ch: () => {
      const tr = yeuThu(Math.max(6, LV()), 1);
      return [
        {
          t: 'Bẻ hư không thạch ở mép khe',
          cls: 'danger',
          hint: nguy(tr),
          fn: () => {
            if (ch(0.4)) return 'Ngươi bẻ được hai khối rồi lùi lại đúng lúc khe nứt khép vào, cắt đứt một vạt áo.' + gain('m:hukhongthach', 2);
            return duel(tr, { win: () => 'Xác con trùng tan vào hư vô. Ngươi bẻ đá trong im lặng tuyệt đối.' + gain('m:hukhongthach', ri(2, 3)) + cult(ri(25, 40)) });
          },
        },
        {
          t: 'Nhìn vào khe để ngộ không gian',
          fn: () => {
            if (ch(0.2 + stat('ngo') * 0.03)) return 'Ngươi nhìn thấy cách các tầng không gian chồng lên nhau như những trang sách. Một trang lật qua trong đầu ngươi.' + cult(ri(80, 140)) + statUp('ngo', 1);
            return 'Thần thức ngươi bị hút vào khe một khắc. Khi rút ra được, đầu đau như búa bổ.' + hurt(20) + tamma(8);
          },
        },
        { t: 'Lùi xa', fn: () => 'Ở Tiên Sơn, người sống lâu là người biết lùi.' },
      ];
    },
  },
  {
    id: 'wild_tt_chientruong',
    where: ['wild'],
    reg: ['trungtho'],
    w: 3,
    minR: 2,
    cd: 20,
    title: 'Tướng quân không chịu chết',
    text: () => 'Đêm trăng máu. Trên cổ chiến trường, sát khí ngưng thành sương đỏ. Một bộ giáp trụ không người bên trong chống thương đứng dậy, cất giọng như sắt cọ vào nhau: "Quân địch ở đâu?"',
    ch: () => {
      const tg = quai('Oán hồn cổ tướng', Math.max(2, LV() + 1), 'demon', 1.15, 'kim');
      return [
        {
          t: '"Ta là quân địch."',
          cls: 'danger',
          hint: nguy(tg),
          fn: () =>
            duel(tg, {
              win: () => {
                fame(10);
                return 'Bộ giáp đổ xuống, oán khí tan thành một tiếng thở dài. Mũi thương của hắn vẫn còn sắc.' + giveGear(clamp(LV() + 1, 0, RMAX()), 2, 0, 'kim') + cult(ri(20, 35));
              },
            }),
        },
        {
          t: '"Chiến tranh đã kết thúc vạn năm rồi."',
          cls: 'prime',
          fn: () => {
            if (ch(0.3 + stat('tam') * 0.04)) {
              good(2);
              return 'Bộ giáp đứng im rất lâu. Rồi nó cắm thương xuống đất, quỳ một gối, tan dần trong ánh trăng. Nơi nó quỳ còn lại một lá cờ lệnh mục nát, bên trong cuộn một quyển binh thư.' + gain(techBook()) + statUp('tam', 1);
            }
            return '"Láo!" Ngọn thương quét ngang. Ngươi đỡ được, nhưng bị đánh văng xa mười trượng. Lúc gượng dậy, bộ giáp đã đi tìm quân địch khác.' + hurt(25);
          },
        },
        { t: 'Nín thở nằm giữa xác chết', fn: () => 'Bộ giáp đi ngang qua ngươi, mũi thương lướt sát má. Rồi nó biến vào sương đỏ.' + tamma(4) },
      ];
    },
  },

  // ---------------- BÍ CẢNH: Thượng Cổ Dược Viên ----------------
  {
    id: 'wild_dv_vuongiua',
    where: ['realm'],
    w: 4,
    cd: 12,
    cond: () => here().id === 'duocvien',
    title: 'Vườn giữa',
    text: () => 'Qua chín lớp cổng trúc, ngươi tới vườn giữa. Những luống thuốc xếp theo hình bát quái, mỗi luống một mùi. Giữa vườn, một khôi lỗi mộc nhân cầm cuốc đang chậm rãi xới đất — đã xới như vậy suốt mấy ngàn năm.',
    ch: () => {
      const mn = quai('Mộc nhân giữ vườn', Math.max(LV() + 1, effRi()), 'boss', 1.2, 'moc', 'linhmoc');
      return [
        {
          t: 'Hạ mộc nhân rồi hái thuốc',
          cls: 'danger',
          hint: nguy(mn),
          fn: () =>
            duel(mn, {
              win: () => ({
                text: 'Mộc nhân đổ xuống, cái cuốc vẫn nắm trong tay. Cả vườn thuốc giờ không ai canh — nhưng từ xa đã nghe tiếng người. Ngươi chỉ kịp hái một luống.',
                choices: [
                  { t: 'Luống thuốc phá cảnh', cls: 'prime', fn: () => gain(breakPill(), 1, 2) + ' Trong luống còn sót một viên đan cổ ai đó luyện dở.' },
                  { t: 'Luống linh thảo cổ', fn: () => gain(herb(effRi() + 2)) + gain(herb(effRi() + 1)) },
                  { t: 'Đào cả gốc cây mẹ', cls: 'danger', hint: 'Tốn thời gian, có thể bị đuổi kịp', fn: () => (ch(0.5) ? 'Ngươi bứng được cây mẹ lên, rễ dài như râu rồng.' + gain(herb(effRi() + 2), 2) + lifeAdd(10) : 'Tu sĩ khác ập tới. Ngươi buông cây chạy, chỉ kịp giật vài lá.' + gain(herb(effRi() + 1)) + hurt(10)) },
                ],
              }),
            }),
        },
        {
          t: 'Lẻn sau lưng nó, hái trộm luống rìa',
          fn: () => (ch(0.5 + stat('van') * 0.03) ? 'Ngươi nhổ được hai cây trước khi mộc nhân quay lại.' + gain(herb(effRi() + 1), 2) : 'Mộc nhân quay ngoắt lại, cán cuốc đập trúng sườn ngươi.' + hurt(25)),
        },
        { t: 'Rời vườn giữa', fn: () => 'Ngươi quay ra. Tiếng cuốc xới đất vẫn đều đều sau lưng.' },
      ];
    },
  },
  {
    id: 'wild_dv_dandinh',
    where: ['realm'],
    w: 3,
    cd: 12,
    cond: () => here().id === 'duocvien',
    title: 'Lò đan ngủ quên',
    text: () => 'Trong một gian nhà đá sụp mái, lò đan bằng đồng vẫn còn âm ấm. Nắp lò khắc phù văn, khe hở lọt ra mùi đan thơm tới chóng mặt. Lửa trong lò chưa từng tắt.',
    ch: () => [
      {
        t: 'Dùng thần thức mở cấm chế nắp lò',
        cls: 'prime',
        hint: 'Ngộ tính càng cao càng dễ',
        fn: () => {
          if (ch(0.3 + stat('ngo') * 0.05)) {
            mark('Mở lò đan cổ ở Thượng Cổ Dược Viên');
            return 'Phù văn sáng lên theo thứ tự đúng, nắp lò tự nâng. Bên trong là mấy viên đan tròn trịa, còn tỏa ánh ngọc.' + gain(breakPill(), 1, 2) + gain(cultPill(), 2);
          }
          return 'Phù văn sai thứ tự, lửa trong lò phụt ra đốt cháy nửa người ngươi.' + hurt(30);
        },
      },
      {
        t: 'Đập vỡ lò',
        cls: 'danger',
        fn: () => (ch(0.4) ? 'Lò vỡ, đan bay tung tóe. Ngươi nhặt được một viên còn nguyên.' + gain(cultPill(), 1, 2) : 'Lò nổ. Đan dược hóa thành khói, ngươi hóa thành nửa cục than.' + hurt(40)),
      },
      { t: 'Ngồi cạnh lò hấp thụ dược khí', fn: () => 'Dược khí ngấm vào lỗ chân lông. Không bằng ăn đan, nhưng an toàn.' + cult(ri(15, 25)) + heal(20) },
    ],
  },
  {
    id: 'wild_dv_tranhsam',
    where: ['realm'],
    w: 3,
    cd: 12,
    cond: () => here().id === 'duocvien',
    title: 'Cây sâm ba người tranh',
    text: () => 'Một cây huyết sâm đỏ như máu mọc trên vách đá, lá đã kết hạt — vừa chín. Hai tu sĩ đã đứng đó trước ngươi, một của tông môn chính đạo, một là tán tu mặt rỗ. Cả hai đều quay lại nhìn ngươi.',
    ch: () => {
      const dt = tuSi('Đệ tử chính đạo', Math.max(1, effRi()), 1.05);
      const rr = tuSi('Tán tu mặt rỗ', Math.max(1, effRi() + (ch(0.5) ? 1 : 0)), 1);
      return [
        {
          t: 'Hợp sức với đệ tử chính đạo đánh tán tu',
          hint: nguy(rr),
          fn: () =>
            duel({ ...rr, mult: 0.75 }, {
              win: () => {
                const n = meet({ dr: 0, tag: 'friend', rel: 25, how: 'Cùng tranh sâm ở Thượng Cổ Dược Viên' });
                return `Tán tu bỏ chạy. ${n.name} chia đôi cây sâm, hẹn sau này gặp lại.` + gain(herb(Math.max(3, effRi() + 1)));
              },
            }),
        },
        {
          t: 'Đợi họ đánh nhau, ngư ông đắc lợi',
          cls: 'danger',
          hint: 'Kẻ thắng còn lại: ' + nguy(dt),
          fn: () => {
            evil(1);
            return {
              text: 'Hai người lao vào nhau. Ngươi ẩn khí tức chờ đợi. Một khắc sau, tán tu ngã xuống. Đệ tử chính đạo thở dốc, tay vươn về cây sâm.',
              choices: [
                { t: 'Đánh lén', cls: 'danger', hint: nguy({ ...dt, mult: 0.7 }), fn: () => duel({ ...dt, mult: 0.7 }, { win: () => 'Ngươi giật lấy cây sâm, và cả túi trữ vật của hai người.' + gain(herb(Math.max(3, effRi() + 1)), 2) + money(M(60)) + tamma(6) }) },
                { t: 'Thôi, để hắn lấy', fn: () => 'Ngươi rút đi trong im lặng. Ít ra không nhuốm máu.' },
              ],
            };
          },
        },
        { t: 'Nhường', fn: () => 'Ngươi chắp tay rồi đi. Dược viên còn rộng.' + cult(ri(5, 10)) },
      ];
    },
  },
  {
    id: 'wild_dv_ngoclo',
    where: ['realm'],
    w: 2,
    cd: 24,
    cond: () => here().id === 'duocvien',
    title: 'Ngọc lộc dẫn đường',
    text: () => 'Một con hươu nhỏ toàn thân như ngọc trắng bước ra từ bụi trúc, nhìn ngươi, rồi quay đầu đi chậm chậm như chờ ngươi theo.',
    ch: () => [
      {
        t: 'Đi theo nó',
        cls: 'prime',
        fn: () => {
          if (ch(0.45 + stat('van') * 0.04)) {
            mark('Được ngọc lộc dẫn tới linh chi vạn năm');
            return 'Hươu dẫn ngươi qua một lối mòn không có trên bất kỳ bản đồ nào, tới gốc cây linh chi to bằng cái lọng. Nó cúi đầu ăn một lá, rồi nhường phần còn lại cho ngươi.' + gain(herb(effRi() + 2)) + lifeAdd(ri(15, 30)) + cult(ri(30, 50));
          }
          return 'Hươu dẫn ngươi vòng vèo nửa ngày rồi biến mất. Ngươi nhặt được một cây thuốc bên đường, đành coi như lộ phí.' + gain(herb(effRi()));
        },
      },
      {
        t: 'Bắt nó',
        cls: 'danger',
        fn: () => {
          evil(2);
          return 'Ngươi vồ tới. Ngọc lộc hóa thành làn khói trắng. Cả khu vườn chợt lạnh đi — như có ai đó đã nhìn thấy.' + tamma(10);
        },
      },
    ],
  },

  // ---------------- BÍ CẢNH: Kiếm Trủng ----------------
  {
    id: 'wild_kt_kiemchon',
    where: ['realm'],
    w: 4,
    cd: 20,
    cond: () => here().id === 'kiemtrung',
    title: 'Kiếm chọn người',
    text: () => 'Vạn thanh kiếm cắm nghiêng trên sườn đồi đá, gió thổi qua thành tiếng ngân dài như khóc. Càng lên cao, kiếm ý càng nặng, ép tới mức đầu gối ngươi run lên.',
    ch: () => [
      {
        t: 'Leo lên cao hơn',
        cls: 'prime',
        fn: () => {
          if (!ch(0.35 + stat('can') * 0.05)) return 'Kiếm ý đè ngươi quỳ xuống. Ngươi phun máu, lăn xuống chân đồi.' + hurt(25) + may(0.3, () => statUp('tam', 1));
          return {
            text: 'Ngươi lên tới lưng chừng. Ba thanh kiếm cùng rung lên: một thanh gỉ sét không chuôi, một thanh trong như băng, một thanh đen tuyền đang rỉ khí đen.',
            choices: [
              {
                t: 'Thanh kiếm gỉ',
                fn: () => {
                  if (ch(0.3 + stat('tam') * 0.04)) {
                    mark('Được kiếm gỉ ở Kiếm Trủng chọn');
                    return 'Ngươi rút. Lớp gỉ bong ra từng mảng, để lộ thân kiếm sáng như nước thu. Kiếm này chọn ngươi.' + giveGear(clamp(Math.max(LV(), effRi()), 0, RMAX()), 3, 0, 'kim') + learnSkill('ngukiem');
                  }
                  return 'Kiếm không nhúc nhích. Một luồng kiếm khí bắn ngược vào lòng bàn tay ngươi.' + hurt(15);
                },
              },
              {
                t: 'Thanh kiếm băng',
                fn: () => 'Kiếm rời đất dễ như hái hoa. Lạnh, đẹp, ngoan ngoãn — như chưa từng có linh.' + giveGear(clamp(Math.max(LV(), effRi()), 0, RMAX()), 2, 0, 'bang'),
              },
              {
                t: 'Thanh kiếm đen',
                cls: 'danger',
                hint: 'Kiếm có ma tính',
                fn: () => {
                  evil(2);
                  return 'Thanh kiếm tự nhảy vào tay ngươi. Khí đen chui theo mạch máu lên tận tim. Rất mạnh. Rất đói.' + giveGear(clamp(Math.max(LV(), effRi()) + 1, 0, RMAX()), 3, 0, 'hoa') + tamma(20);
                },
              },
            ],
          };
        },
      },
      { t: 'Ngồi dưới chân đồi lắng nghe kiếm ngân', fn: () => 'Tiếng kiếm ngân dội vào kinh mạch. Ngươi lĩnh hội được đôi phần kiếm ý.' + cult(ri(15, 30)) },
    ],
  },
  {
    id: 'wild_kt_kiemhon',
    where: ['realm'],
    w: 3,
    cd: 20,
    cond: () => here().id === 'kiemtrung',
    title: 'Kiếm hồn cuồng loạn',
    text: () => 'Một thanh cổ kiếm tự rút khỏi đất, xoay vòng giữa không trung. Kiếm hồn bên trong đã điên vì cô độc quá lâu — nó chém vào bất cứ thứ gì còn sống.',
    ch: () => {
      const kh = quai('Cuồng kiếm hồn', Math.max(LV() + 1, effRi()), 'boss', 1.3, 'kim');
      return [
        {
          t: 'Đỡ kiếm, thu phục nó',
          cls: 'danger',
          hint: nguy(kh),
          fn: () =>
            duel(kh, {
              win: () => {
                fame(15);
                return 'Kiếm hồn kiệt sức, rơi xuống đất ngoan ngoãn. Trên thân kiếm khắc một bộ kiếm quyết.' + gain(skillBook(Math.min(3, techCap()), 'kim')) + giveGear(clamp(Math.max(LV(), effRi()), 0, RMAX()), 2, 0);
              },
            }),
        },
        { t: 'Nằm rạp xuống', fn: () => (ch(0.6) ? 'Kiếm quét qua trên đầu, cắt đứt một lọn tóc. Rồi nó bay đi tìm thứ khác.' : 'Kiếm xẹt qua lưng ngươi trước khi bay đi.' + hurt(20)) },
      ];
    },
  },
  {
    id: 'wild_kt_bia',
    where: ['realm'],
    w: 3,
    cd: 20,
    cond: () => here().id === 'kiemtrung',
    title: 'Bia kiếm ý',
    text: () => 'Giữa kiếm trủng có một tấm bia đá cao ba trượng, bề mặt chi chít vết chém. Không có chữ. Mỗi vết chém là một chiêu kiếm của người xưa để lại.',
    ch: () => [
      {
        t: 'Ngồi trước bia mà ngộ',
        cls: 'prime',
        hint: 'Tốn thời gian, cần ngộ tính',
        fn: () => {
          nam(turnY());
          const r = Math.random();
          if (r < 0.15 + stat('ngo') * 0.02) {
            mark('Ngộ kiếm ý trên bia Kiếm Trủng');
            if (effRi() >= 4 && ch(0.4)) return 'Mọi vết chém nối lại thành một đường duy nhất trong mắt ngươi. Ngươi khắc nó vào ngọc giản.' + gain('cp:canhkimkiem');
            return 'Ngươi vung tay theo bản năng, kiếm khí chém một vết mới lên bia. Kiếm Trủng ngân dài một tiếng.' + learnSkill(effRi() >= 4 ? 'canhkimkiem' : 'ngukiem') + cult(ri(30, 50));
          }
          if (r < 0.7) return 'Ngươi nhìn mãi, hiểu được vài vết. Như thế cũng là thu hoạch.' + cult(ri(15, 30));
          return 'Kiếm ý trên bia quá nặng, cắt vào thần thức ngươi.' + hurt(15) + tamma(5);
        },
      },
      { t: 'Chém thử một kiếm lên bia', cls: 'danger', fn: () => (ch(0.3) ? 'Bia không xước. Nhưng kiếm khí phản lại dạy ngươi nhiều hơn cả trăm ngày luyện.' + cult(ri(25, 40)) + hurt(15) : 'Kiếm khí phản chấn hất ngươi bay ra.' + hurt(30)) },
    ],
  },
  {
    id: 'wild_kt_doatkiem',
    where: ['realm'],
    w: 3,
    cd: 20,
    cond: () => here().id === 'kiemtrung',
    title: 'Kẻ đoạt kiếm',
    text: () => 'Một tu sĩ trẻ vừa được kiếm chọn, đang ôm thanh kiếm cười như điên. Từ ba phía, năm sáu người đã rút binh khí lặng lẽ áp sát hắn. Một người trong đó liếc ngươi: "Cùng làm, chia đều."',
    ch: () => {
      const tr = tuSi('Thiếu niên được kiếm chọn', Math.max(2, effRi() + 1), 1.1, 'kim');
      return [
        {
          t: 'Đứng về phía thiếu niên',
          cls: 'danger',
          hint: 'Một chọi đám đông: ' + nguy(tuSi('Đám tu sĩ đoạt kiếm', effRi(), 1.4)),
          fn: () =>
            duel(tuSi('Đám tu sĩ đoạt kiếm', effRi(), 1.4), {
              win: () => {
                good(3);
                fame(15);
                const n = meet({ dr: 0, tag: 'friend', rel: 55, el: 'kim', how: 'Được ngươi cứu ở Kiếm Trủng' });
                return `Đám người tan chạy. Thiếu niên — ${n.name} — dập đầu ba cái, nói mạng này nợ ngươi.` + money(M(80));
              },
            }),
        },
        {
          t: 'Cùng đám đông đoạt kiếm',
          cls: 'danger',
          hint: nguy({ ...tr, mult: 0.7 }),
          fn: () => {
            evil(3);
            return duel({ ...tr, mult: 0.7 }, { win: () => 'Thiếu niên chết. Thanh kiếm rơi vào tay ngươi, nhưng nó run lên như căm hận.' + giveGear(clamp(Math.max(LV(), effRi()), 0, RMAX()), 2, 0) + tamma(12) });
          },
        },
        { t: 'Không dính vào', fn: () => 'Ngươi quay đi. Sau lưng vang lên tiếng kiếm và tiếng hét.' + tamma(3) },
      ];
    },
  },

  // ---------------- BÍ CẢNH: Long Cung Di Tích ----------------
  {
    id: 'wild_lc_baokho',
    where: ['realm'],
    w: 4,
    cd: 50,
    cond: () => here().id === 'longcung',
    title: 'Bảo khố Long Cung',
    text: () => 'Cửa bảo khố là hai cánh san hô khổng lồ, nước biển vừa rút để lại vỏ sò bám kín. Trên bậc thềm, một con giao long thân dài hai mươi trượng đang ngủ, vảy xanh đen lấp lánh, mỗi hơi thở đẩy ra một luồng nước lạnh.',
    ch: () => {
      const gl = quai('Giao long giữ khố', Math.max(LV() + 1, effRi() + 1), 'beast', 1.25, 'thuy', 'longlan');
      return [
        {
          t: 'Tấn công khi nó còn ngủ',
          cls: 'danger',
          hint: nguy(gl),
          fn: () =>
            duel(gl, {
              win: () => {
                mark('Chém giao long, mở bảo khố Long Cung');
                fame(30);
                return {
                  text: 'Giao long gục trên bậc thềm. Cửa san hô mở ra: vàng bạc chất thành đồi, nhưng ngươi chỉ để ý ba thứ phát sáng trên bệ ngọc. Nước đã bắt đầu rỉ vào — chọn nhanh.',
                  choices: [
                    { t: 'Long châu', cls: 'prime', fn: () => 'Ngươi nuốt long châu. Long khí cuồn cuộn trong đan điền.' + cult(ri(120, 180)) + statUp('can', 1) },
                    { t: 'Giáp vảy rồng', fn: () => giveGear(clamp(effRi() + 1, 0, RMAX()), 3, 1, 'thuy') },
                    { t: 'Ngọc giản bọc lụa vàng', fn: () => gain(techBook(techCap(), ['thuy', 'bang'])) + gain(breakPill(), 1, 2) },
                  ],
                };
              },
            }),
        },
        {
          t: 'Ẩn khí tức lẻn qua',
          fn: () => {
            if (ch(0.3 + stat('van') * 0.04)) return 'Giao long trở mình nhưng không tỉnh. Ngươi vơ một nắm vàng ngọc ở gian ngoài rồi chuồn.' + money(M(120)) + gain('x:linhthach_trung', ri(1, 2));
            return 'Một mắt rồng mở ra. Đuôi nó quét ngang, đánh ngươi bay khỏi bậc thềm.' + hurt(35);
          },
        },
        { t: 'Không dám', fn: () => 'Ngươi lùi khỏi bậc thềm. Có những cửa không dành cho mình.' },
      ];
    },
  },
  {
    id: 'wild_lc_longhon',
    where: ['realm'],
    w: 3,
    cd: 50,
    cond: () => here().id === 'longcung',
    title: 'Tàn niệm chân long',
    text: () => 'Trong điện chính, một bộ xương rồng cuộn quanh cột ngọc. Khi ngươi bước vào, hốc mắt nó sáng lên. Giọng nói vang như sóng ngầm: "Hậu bối nhân tộc. Ta hỏi, ngươi đáp. Đáp đúng, ta tặng. Đáp sai, ở lại làm bạn với ta."',
    ch: () => [
      {
        t: 'Xin nghe câu hỏi',
        cls: 'danger',
        hint: 'Đạo tâm và ngộ tính quyết định',
        fn: () => ({
          text: '"Biển sâu vạn trượng, cá vẫn bơi. Trời cao vạn trượng, chim vẫn bay. Vì sao rồng phải hóa?"',
          choices: [
            { t: '"Vì rồng không chịu làm cá."', fn: () => (ch(0.4 + stat('tam') * 0.03) ? 'Bộ xương cười, tiếng cười làm nước rung. "Đúng. Không cam lòng — chính là đạo." Một luồng long khí rót vào người ngươi.' + lifeAdd(ri(30, 60)) + statUp('tam', 1) + cult(ri(60, 100)) : '"Nông cạn." Long uy đè xuống, ngươi phun máu.' + hurt(40)) },
            { t: '"Rồng không cần hóa. Rồng chỉ là rồng."', fn: () => (ch(0.3 + stat('ngo') * 0.04) ? '"...Ta mất mười vạn năm để hiểu câu đó." Bộ xương tan thành bụi sáng. Giữa đống bụi là một vảy nghịch.' + gain('m:longlan', 2) + statUp('ngo', 1) + giveGear(clamp(effRi() + 1, 0, RMAX()), 3, 2, 'thuy') : '"Ngụy biện." Ngươi bị hất ra khỏi điện.' + hurt(30)) },
            { t: 'Im lặng', fn: () => 'Tàn niệm chờ rất lâu, rồi thở dài: "Biết mình không biết, cũng là một loại biết." Nó tặng ngươi một giọt máu rồng.' + cult(ri(40, 60)) },
          ],
        }),
      },
      { t: 'Cúi chào rồi lui', fn: () => '"Khôn ngoan." Tàn niệm khép mắt lại.' + tamma(-5) },
    ],
  },
  {
    id: 'wild_lc_nuocdang',
    where: ['realm'],
    w: 3,
    cd: 30,
    cond: () => here().id === 'longcung',
    title: 'Nước dâng',
    text: () => 'Tiếng trống đá vang từ xa — dấu hiệu nước biển sắp tràn về. Tu sĩ khắp nơi đổ xô ra cửa. Nhưng ngay trước mặt ngươi, một gian phụ điện vừa sụp tường, lộ ra một rương báu.',
    ch: () => {
      const tt = tuSi('Tu sĩ áo lam chặn cửa', Math.max(3, effRi()), 1.1, 'thuy');
      return [
        {
          t: 'Phá rương rồi chạy',
          cls: 'danger',
          hint: 'Có thể bị kẹt lại',
          fn: () => {
            const got = gain(herb(Math.max(4, effRi())), 1) + money(M(150));
            if (ch(0.55 + stat('van') * 0.03)) return 'Ngươi phá rương, vơ đồ, lao ra cửa đúng lúc nước ập vào sau lưng.' + got;
            const y = Math.max(1, Math.round(turnY() * 2));
            nam(y);
            return `Nước tràn vào nhanh hơn tưởng. Ngươi bị kẹt trong một bọt khí dưới đáy biển suốt ${y} năm, sống nhờ linh khí loãng.` + got + hurt(30);
          },
        },
        {
          t: 'Ra cửa — nhưng có kẻ chặn đường',
          hint: nguy(tt),
          fn: () =>
            ch(0.5)
              ? 'Ngươi chen ra kịp, ngoái lại thấy cửa đã ngập.'
              : duel(tt, { win: () => 'Ngươi giẫm qua hắn mà ra. Túi hắn rơi ra mấy thứ hay ho.' + gain(talis(Math.min(4, Math.ceil(effRi() / 2)))) + money(M(60)), flee: () => 'Ngươi vòng qua cửa khác, chậm một nhịp.' + hurt(10) }),
        },
      ];
    },
  },
  {
    id: 'wild_lc_tranhtuyen',
    where: ['realm'],
    w: 3,
    cd: 50,
    cond: () => here().id === 'longcung',
    title: 'Long tuyền',
    text: () => 'Dưới đáy cung có một suối nước màu vàng nhạt, sủi bọt như sôi — long tuyền, nơi chân long năm xưa tắm. Ba tông môn đã dựng trận chiếm ba phía, đang cãi nhau ai được tắm trước.',
    ch: () => {
      const ts = tuSi('Trưởng lão tông môn', Math.max(4, effRi() + 1), 1.05);
      return [
        {
          t: 'Xông vào giữa',
          cls: 'danger',
          hint: nguy(ts),
          fn: () => duel(ts, { win: () => 'Cả ba phe ngỡ ngàng. Ngươi nhảy xuống long tuyền, ngâm đúng một nén hương trước khi họ hoàn hồn.' + cult(ri(80, 120)) + statUp('can', 1) + heal(100), flee: () => 'Ngươi bị ba phe hợp lực đuổi đi.' + hurt(15) }),
        },
        {
          t: 'Bán tin cho một phe để đổi một chén nước',
          fn: () => (ch(0.5 + stat('mi') * 0.03) ? 'Ngươi chỉ cho một phe chỗ yếu của trận bên kia. Họ giữ lời, cho ngươi một bình long tuyền.' + (evil(1), gain('x:linhtuyen', 2)) : 'Họ nghe xong thì quay lưng nuốt lời. Ngươi không làm gì được.'),
        },
        { t: 'Đứng xa xem', fn: () => 'Ba phe đánh nhau ba ngày. Ngươi học được vài chiêu khi xem.' + cult(ri(10, 20)) },
      ];
    },
  },

  // ---------------- BÍ CẢNH: Thiên Ma Quật ----------------
  {
    id: 'wild_tm_phongan',
    where: ['realm'],
    w: 4,
    cd: 100,
    cond: () => here().id === 'thienma',
    title: 'Phong ấn thiên ma',
    text: () => 'Đáy quật là một đầm máu đen. Chín sợi xích vàng xuyên vào lòng đầm, ba sợi đã đứt. Trong máu có thứ gì đó mở mắt, và giọng nói ngọt như mật chảy vào tai ngươi: "Chặt thêm một sợi. Ta sẽ cho ngươi tất cả."',
    ch: () => {
      const tm = quai('Thiên ma phân thân', Math.max(effRi() + 1, LV() + 1), 'demon', 1.3, 'hoa');
      return [
        {
          t: 'Hỏi nó sẽ cho gì',
          cls: 'danger',
          fn: () => ({
            text: '"Tu vi trăm năm. Công pháp mà Huyết Sát Điện cũng chỉ có bản thiếu. Chỉ một sợi xích thôi." Máu đen cuộn lên, hiện ra hình ảnh ngươi đứng trên đỉnh Thương Lan.',
            choices: [
              {
                t: 'Chặt xích',
                cls: 'danger',
                hint: 'Ma đạo — không có đường quay lại',
                fn: () => {
                  evil(10);
                  setFlag('thienma_xich', (flag('thienma_xich') ?? 0) + 1);
                  mark('Chặt xích phong ấn Thiên Ma Quật');
                  return 'Sợi xích đứt với tiếng kêu như người. Ma khí tràn vào kinh mạch, nóng và ngọt. Thiên ma cười dài.' + cult(ri(150, 200)) + gain(techBook(Math.min(3, techCap() + 1), undefined, true)) + tamma(35);
                },
              },
              {
                t: 'Rút kiếm: "Ta không phải con rối."',
                cls: 'danger',
                hint: nguy(tm),
                fn: () =>
                  duel(tm, {
                    win: () => {
                      good(5);
                      fame(40);
                      mark('Chém phân thân thiên ma');
                      return 'Phân thân tan, đầm máu lắng lại. Một sợi xích vàng tự nối liền. Đâu đó trên đỉnh quật, có tiếng chuông xa vang lên.' + statUp('tam', 2) + giveGear(clamp(effRi() + 1, 0, RMAX()), 3) + tamma(-20);
                    },
                  }),
              },
            ],
          }),
        },
        {
          t: 'Dồn chân nguyên gia cố phong ấn',
          cls: 'prime',
          fn: () => {
            good(3);
            if (ch(0.35 + stat('tam') * 0.04)) return 'Chân nguyên chảy vào xích, xích sáng lên. Thiên ma gào thét chìm xuống. Ngươi kiệt sức, nhưng đạo tâm trong như ngọc.' + statUp('tam', 1) + cult(ri(40, 60)) + hurt(20);
            return 'Ma khí theo chân nguyên ngược vào người ngươi. Ngươi kịp cắt đứt, nhưng đã nhiễm.' + tamma(20) + hurt(25);
          },
        },
        { t: 'Bịt tai bỏ đi', fn: () => 'Giọng nói đuổi theo ngươi tới tận cửa quật.' + tamma(8) },
      ];
    },
  },
  {
    id: 'wild_tm_maniem',
    where: ['realm'],
    w: 4,
    cd: 50,
    cond: () => here().id === 'thienma',
    title: 'Ma niệm',
    text: () => 'Ma khí trong quật đặc tới mức hóa thành sương đen. Mỗi hơi thở, ngươi lại nghe một tiếng thì thầm: nỗi sợ của ngươi, lòng tham của ngươi, mối thù của ngươi — tất cả đều có giọng.',
    ch: () => [
      {
        t: 'Luyện hóa ma khí làm tu vi',
        cls: 'danger',
        hint: 'Tu vi tăng mạnh, tâm ma cũng vậy',
        fn: () => (ch(0.25 + stat('tam') * 0.05) ? 'Ngươi nuốt ma khí như nuốt lửa, giữ một điểm thanh minh không tắt. Ma khí bị ép thành chân nguyên tinh thuần.' + cult(ri(80, 120)) + tamma(8) : 'Ma khí nuốt ngược lại ngươi. Ba ngày sau tỉnh dậy, tay đầy máu — không biết của ai.' + cult(ri(40, 60)) + tamma(30) + hurt(20)),
      },
      {
        t: 'Dùng Bồ Đề Tử trấn tâm',
        dis: !hasItem('x:phatnganh'),
        hint: 'Cần Bồ Đề Tử',
        fn: () => {
          lose('x:phatnganh');
          return 'Bồ Đề Tử tỏa ánh vàng nhạt. Ma niệm lùi lại như sương gặp nắng. Ngươi ngồi giữa ma quật mà tu luyện như giữa chùa.' + cult(ri(120, 160)) + tamma(-30);
        },
      },
      { t: 'Niệm chú, đi nhanh qua', cls: 'prime', fn: () => 'Ngươi niệm thanh tâm chú, mắt nhìn chân, không nghe không thấy.' + tamma(5) },
    ],
  },
  {
    id: 'wild_tm_caotang',
    where: ['realm'],
    w: 3,
    cd: 100,
    cond: () => here().id === 'thienma',
    title: 'Di cốt cao tăng',
    text: () => 'Trong một ngách đá, một vị hòa thượng khô quắt ngồi kiết già, xương đã hóa vàng như ngọc. Ma khí quanh quật không dám tới gần ông ba thước. Trên tay ông lần một chuỗi hạt — chỉ còn một hạt.',
    ch: () => [
      {
        t: 'Thắp hương, cung kính xin hạt bồ đề',
        cls: 'prime',
        fn: () => {
          if (ch(0.4 + stat('tam') * 0.04) && s.evil < 30) {
            good(2);
            mark('Được di cốt cao tăng tặng Bồ Đề Tử');
            return 'Chuỗi hạt tuột khỏi tay xương, lăn tới chân ngươi. Kim thân sụp xuống thành bụi vàng.' + gain('x:phatnganh') + statUp('tam', 1);
          }
          return 'Hạt bồ đề không động. Có lẽ ngươi chưa đủ duyên — hoặc nghiệp ngươi quá nặng.' + tamma(-5);
        },
      },
      {
        t: 'Lấy cả kim thân luyện bảo',
        cls: 'danger',
        fn: () => {
          evil(5);
          return 'Ngươi bẻ xương vàng. Vừa chạm vào, ma khí ba thước quanh đó ập tới như nước vỡ đê.' + giveGear(clamp(effRi() + 1, 0, RMAX()), 3, 2) + tamma(30) + hurt(25);
        },
      },
      { t: 'Vái ba vái rồi đi', fn: () => 'Ánh vàng quanh hài cốt sáng lên một chút, như mỉm cười.' + tamma(-10) },
    ],
  },
  {
    id: 'wild_tm_matu',
    where: ['realm'],
    w: 3,
    cd: 50,
    cond: () => here().id === 'thienma',
    title: 'Ma tu vây quật',
    text: () => 'Năm ma tu áo đỏ đã chặn lối ra, đang thu thập "máu tươi" cho trận pháp huyết tế. Kẻ dẫn đầu mặt trắng như giấy, ngón tay dài liếm qua môi: "Thêm một người nữa là đủ."',
    ch: () => {
      const mt = tuSi('Ma tu Huyết Sát Điện', Math.max(4, effRi() + 1), 1.15, 'hoa');
      return [
        {
          t: 'Phá vây',
          cls: 'danger',
          hint: nguy(mt),
          fn: () =>
            duel(mt, {
              win: () => {
                fame(25);
                good(2);
                return 'Kẻ dẫn đầu ngã, bốn tên còn lại tháo chạy. Ngươi lục được trên người hắn một bí kíp đỏ như máu — và một túi linh thạch dày.' + gain(techBook(Math.min(3, techCap()), undefined, true)) + money(M(200));
              },
            }),
        },
        {
          t: 'Giả làm ma tu cùng phe',
          fn: () => (s.evil >= 15 || ch(0.25 + stat('mi') * 0.03) ? 'Sát khí trên người ngươi đủ đậm để chúng tin. Kẻ dẫn đầu cười, mời ngươi chén rượu máu rồi để ngươi đi.' + tamma(5) : 'Hắn ngửi một cái, cười khẩy: "Chính đạo hôi lắm." Ngươi phải đánh tháo, mất nửa cái mạng.' + hurt(40)),
        },
        {
          t: 'Lùi vào sâu trong quật chờ',
          fn: () => {
            const y = Math.max(1, Math.round(turnY()));
            nam(y);
            return `Ngươi trốn trong khe đá ${y} năm, sống giữa ma khí. Khi ra, bọn chúng đã đi.` + tamma(15);
          },
        },
      ];
    },
  },

  // ---------------- DẤU "?" kỳ ngộ ----------------
  evLinhTuyen('wild_pin_linhtuyen', ['pin?'], PL),
  {
    id: 'wild_pin_khatcai',
    where: ['pin?'],
    w: 4,
    cd: 10,
    title: 'Lão ăn mày bán bản đồ',
    text: () => 'Bên gốc cây có một lão ăn mày răng sún, trước mặt bày một tấm da cũ vẽ nguệch ngoạc. "Bản đồ kho báu thật đấy, công tử. Lão già rồi, không đi nổi nữa. Chỉ cần đủ tiền mua một hũ rượu."',
    ch: () => {
      const gia = M(20 + PL() * 6);
      return [
        {
          t: `Mua (${gia})`,
          cls: 'prime',
          dis: !canPay(gia),
          fn: () => {
            s.money -= gia;
            if (ch(0.7)) return `Lão cười hềnh hệch, đưa tấm da cho ngươi. Mép da rách theo đường răng cưa — như vốn là một phần của tấm lớn hơn.` + gain('x:banddo') + (hasItem('x:banddo', 3) ? ' Ba mảnh khớp vào nhau. Ngươi đã biết nơi cần đến.' : '');
            return 'Lão đưa tấm da rồi biến mất trong chớp mắt. Đưa ra ánh sáng, đó là... bản đồ đường tới quán rượu đầu làng. Mặt sau có dòng chữ: "Tham thì thâm."' + statUp('tam', 1);
          },
        },
        {
          t: 'Cho lão bát cơm, không lấy gì',
          fn: () => {
            good(1);
            if (ch(0.3)) return 'Lão ăn xong, lau miệng, ánh mắt chợt sáng như sao: "Tâm tốt. Cái này cho ngươi." Rồi lão chỉ còn là một làn gió.' + gain('x:banddo') + statUp('van', 1);
            return 'Lão ăn ngấu nghiến, cảm ơn rối rít.' + tamma(-3);
          },
        },
        { t: 'Lừa đảo thôi', fn: () => 'Ngươi bỏ đi. Lão cũng chẳng níu kéo.' },
      ];
    },
  },
  {
    id: 'wild_pin_bode',
    where: ['pin?'],
    w: 2,
    minR: 2,
    once: true,
    title: 'Cây bồ đề trên đỉnh đá',
    text: () => 'Trên một mỏm đá trơ trụi, không đất không nước, lại mọc một cây bồ đề cổ. Dưới gốc có dấu một người từng ngồi rất lâu — đá lõm thành hình bồ đoàn.',
    ch: () => [
      {
        t: 'Ngồi vào chỗ lõm, tĩnh tọa',
        cls: 'prime',
        hint: 'Tốn thời gian',
        fn: () => {
          nam(turnY());
          if (ch(0.35 + stat('tam') * 0.04)) {
            mark('Tĩnh tọa dưới cây bồ đề cổ');
            return 'Gió thổi qua lá bồ đề như tiếng kinh. Tâm ma trong ngươi tan như sương. Khi mở mắt, trong lòng bàn tay có một hạt bồ đề vừa rụng.' + gain('x:phatnganh') + tamma(-30) + cult(ri(30, 50));
          }
          return 'Ngươi ngồi mãi mà lòng vẫn rối. Cây bồ đề không nói gì.' + tamma(-10);
        },
      },
      {
        t: 'Leo lên hái hạt',
        cls: 'danger',
        fn: () => {
          evil(1);
          return ch(0.3) ? 'Ngươi hái được một hạt. Cây bồ đề héo đi một cành.' + gain('x:phatnganh') + tamma(10) : 'Cành gãy. Ngươi rơi xuống đá.' + hurt(20);
        },
      },
    ],
  },
  {
    id: 'wild_pin_tuthuong',
    where: ['pin?'],
    w: 3,
    minR: 1,
    cd: 12,
    title: 'Tu sĩ trọng thương',
    text: () => 'Bên bờ suối, một tu sĩ nằm gục, bụng thủng một lỗ, tay vẫn siết túi trữ vật. Thấy ngươi, người đó gượng nói: "Cứu... ta có hậu tạ."',
    ch: () => {
      const lv = PL();
      const ke = tuSi('Kẻ giả trọng thương', Math.max(1, lv), 1.1);
      return [
        {
          t: 'Đỡ dậy chữa thương',
          cls: 'prime',
          fn: () => {
            if (ch(0.75)) {
              good(2);
              const n = meet({ r: Math.max(1, lv), tag: 'friend', rel: 40, how: 'Được ngươi cứu khi trọng thương bên suối' });
              return `${n.name} qua khỏi. ${n.g === 'm' ? 'Hắn' : 'Nàng'} giữ lời hậu tạ.` + money(M(40 + lv * 10)) + (ch(0.5) ? gain(talis(Math.max(1, Math.ceil(lv / 2)))) : gain(herbLv(lv)));
            }
            return {
              text: 'Ngươi vừa cúi xuống, "vết thương" kia khép lại. Một lưỡi dao đâm thẳng vào ngực ngươi — ngươi kịp nghiêng người.',
              choices: [{ t: 'Phản kích', cls: 'danger', hint: nguy(ke), fn: () => duel(ke, { win: () => 'Hóa ra là bẫy của bọn cướp tu. Túi trữ vật kia cũng là đồ ăn cướp.' + money(M(50 + lv * 15)) }) }],
            };
          },
        },
        { t: 'Lấy túi rồi đi', cls: 'danger', fn: () => { evil(3); return 'Người kia trợn mắt nhìn ngươi cho tới khi tắt thở.' + money(M(40 + lv * 10)) + tamma(10); } },
        { t: 'Đi tiếp', fn: () => 'Tu tiên giới, ai biết được ai thật ai giả.' },
      ];
    },
  },

  // ---------------- DẤU "!" nguy hiểm ----------------
  evYeuMau('wild_pin_yeumau', ['pin!'], PL),
  evTanTu('wild_pin_tantu', ['pin!'], PL),
  evDoiSan('wild_pin_doisan', ['pin!'], PL),
  {
    id: 'wild_pin_thuvuong',
    where: ['pin!'],
    w: 4,
    cd: 8,
    title: 'Yêu vương xuống núi',
    text: () => 'Cả một thôn nhỏ đã bỏ trống, cửa nhà nào cũng bị cào nát. Một ông lão chống gậy run rẩy chặn đường ngươi: "Tiên sư, con yêu ấy đêm nào cũng xuống bắt một người. Đêm nay... tới lượt cháu gái lão."',
    ch: () => {
      const yv = yeuThu(PL() + (ch(0.3) ? 1 : 0), 1.25);
      return [
        {
          t: 'Ở lại đợi nó',
          cls: 'danger',
          hint: nguy(yv),
          fn: () =>
            duel(yv, {
              win: () => {
                good(3);
                fame(15);
                return 'Đến canh tư, yêu vương gục xuống giữa sân đình. Dân thôn đổ ra, quỳ kín cả đường. Họ góp mọi thứ có giá trị cho ngươi.' + money(M(30 + PL() * 10)) + gain(herbLv(PL())) + may(0.4, () => statUp('tam', 1));
              },
            }),
        },
        { t: 'Đưa cả thôn đi lánh nạn', fn: () => { good(1); return 'Ngươi dẫn dân thôn qua núi. Không ai chết đêm ấy, nhưng con yêu vẫn còn đó.'; } },
        { t: 'Không phải việc của ta', fn: () => 'Ngươi đi. Tiếng khóc của ông lão theo ngươi tới tận cuối đường.' + tamma(5) },
      ];
    },
  },

  // ---------------- DẤU "bao" bảo vật ----------------
  {
    id: 'wild_bao_xuatthe',
    where: ['pinbao'],
    w: 4,
    cd: 15,
    title: 'Dị bảo xuất thế',
    text: () => 'Một cột sáng xanh vọt lên trời từ khe núi, mây kéo về xoáy thành vòng. Thiên tài địa bảo xuất thế! Từ bốn phía, độn quang của tu sĩ đã lao tới như sao băng.',
    ch: () => {
      const lv = PL();
      return [
        {
          t: 'Lao vào trước tiên',
          cls: 'danger',
          hint: 'Ai đến trước, người đó thành bia',
          fn: () => {
            const a = tuSi('Đệ tử tông môn', Math.max(1, lv), 1);
            return {
              text: 'Ngươi tới khe núi đầu tiên. Giữa đá vỡ, một trái cây đỏ rực đang chín dần, cần thêm một khắc. Một đệ tử tông môn đáp xuống ngay sau ngươi, rút kiếm.',
              choices: [
                {
                  t: 'Đánh',
                  cls: 'danger',
                  hint: nguy(a),
                  fn: () =>
                    duel(a, {
                      win: () => {
                        const b = tuSi('Lão quái áo đen', Math.max(1, lv + 1), 1.1);
                        return {
                          text: 'Đệ tử kia chạy. Trái cây đã chín, ánh đỏ như máu trong lòng tay ngươi. Nhưng một luồng sát khí lạnh buốt đã khóa chặt sau lưng: một lão quái áo đen đứng trên vách đá.',
                          choices: [
                            { t: 'Nuốt ngay tại chỗ', cls: 'prime', fn: () => 'Ngươi nuốt chửng. Dược lực bùng lên như núi lửa — lão quái chỉ kịp chửi một câu.' + cult(ri(80, 140)) + hurt(20) },
                            { t: 'Ôm bảo vật mà đánh', cls: 'danger', hint: nguy(b), fn: () => duel(b, { win: () => 'Lão quái bỏ chạy, để lại một vết máu trên đá.' + gain(herb(lv + 2)) + giveGear(clamp(lv + 1, 0, RMAX()), 2) }) },
                            { t: 'Ném trái cây về phía hắn, chạy', fn: () => 'Lão bắt lấy, cười lớn. Ngươi giữ được mạng.' },
                          ],
                        };
                      },
                    }),
                },
                { t: 'Nhường, rút lui', fn: () => 'Ngươi rút ra ngoài, đứng trên đỉnh núi nhìn mấy trận đánh nổ ra liên tiếp.' },
              ],
            };
          },
        },
        {
          t: 'Ẩn mình chờ các phe đánh nhau',
          fn: () => (ch(0.35 + stat('van') * 0.04) ? 'Ba phe đánh nhau tới cùng, không ai chú ý tới chiếc lá ngươi khều đi từ bụi cây bên cạnh — một cây linh thảo đã hút đủ dị quang.' + gain(herb(lv + 1)) + cult(ri(10, 20)) : 'Dư ba của trận đánh quét qua chỗ ngươi nấp.' + hurt(15)),
        },
        { t: 'Không dây vào', fn: () => 'Ngươi quay đi. Đêm đó, cột sáng tắt, và cũng có mấy ngọn đèn hồn tắt theo.' },
      ];
    },
  },
  {
    id: 'wild_bao_thaothu',
    where: ['pinbao'],
    w: 4,
    cd: 10,
    title: 'Linh thảo ngàn năm',
    text: () => 'Giữa vách đá lộng gió có một cây linh thảo ngàn năm, lá tỏa ánh ngọc, hương bay ba dặm. Dưới gốc, một con yêu thú nằm cuộn — nó đã canh cây này từ lúc cây còn là mầm.',
    ch: () => {
      const lv = PL();
      const thu = yeuThu(lv + 1, 1.15);
      return [
        {
          t: 'Đánh thẳng',
          cls: 'danger',
          hint: nguy(thu),
          fn: () => duel(thu, { win: () => 'Ngươi hái cây thuốc khi máu thú còn chưa nguội. Rễ dài như tóc người.' + gain(herb(lv + 1)) + gain(herb(lv), 1) }),
        },
        {
          t: 'Dụ nó đi chỗ khác',
          fn: () => ({
            text: 'Ngươi ném một miếng thịt có tẩm linh khí xuống thung lũng. Con thú hít hít, ngẩng đầu — rồi lại nằm xuống. Nó không ngu.',
            choices: [
              {
                t: 'Thêm một con mồi lớn hơn — yêu đan',
                dis: !hasItem('m:yeudan'),
                hint: 'Cần 1 yêu đan',
                fn: () => {
                  lose('m:yeudan');
                  return 'Mùi yêu đan quá hấp dẫn. Con thú lao xuống thung lũng. Ngươi trèo lên hái cây thuốc trong mười hơi thở.' + gain(herb(lv + 1));
                },
              },
              {
                t: 'Lẻn trèo từ sau lưng nó',
                cls: 'danger',
                fn: () => (ch(0.4 + stat('van') * 0.04) ? 'Ngươi bám vách đá, tay vươn tới cây thuốc — giật! — rồi buông người rơi xuống thác.' + gain(herb(lv + 1)) + hurt(10) : duel(thu, { win: () => 'Bị phát hiện, nhưng ngươi thắng.' + gain(herb(lv + 1)) })),
              },
              { t: 'Bỏ cuộc', fn: () => 'Có những thứ không thuộc về mình.' },
            ],
          }),
        },
        { t: 'Rời đi', fn: () => 'Ngươi nhớ vị trí. Trăm năm sau, có lẽ.' },
      ];
    },
  },
  {
    id: 'wild_bao_diahoa',
    where: ['pinbao'],
    w: 2,
    minR: 2,
    cd: 40,
    cond: () => !flag('flame'),
    title: 'Hỏa mạch dưới đất',
    text: () => 'Mặt đất nóng tới mức cỏ cháy vàng thành vòng tròn. Ngươi đào xuống ba thước, gặp một khe nứt đỏ rực — trong khe, một đốm lửa nhỏ đang thở như sinh vật sống.',
    ch: () => {
      const lv = PL();
      const hl = quai('Hỏa linh giữ mạch', Math.max(2, lv + 1), 'beast', 1.15, 'hoa', 'yeudan');
      return [
        {
          t: 'Thu phục đốm lửa',
          cls: 'danger',
          hint: nguy(hl),
          fn: () =>
            duel(hl, {
              win: () => {
                mark('Thu phục mồi linh hỏa');
                return 'Hỏa linh tan, đốm lửa co lại trong lòng bàn tay ngươi như con mèo con. Ngươi phong ấn nó.' + gain('x:thanhoa');
              },
            }),
        },
        { t: 'Lấy đá hỏa tinh quanh khe', fn: () => 'Ngươi cạy vài khối đá còn đỏ âm ỉ.' + gain(mat(lv)) + gain(herb(Math.max(2, lv))) },
        { t: 'Lấp lại', fn: () => 'Ngươi lấp đất. Có lẽ nó cần thêm thời gian.' },
      ];
    },
  },
  {
    id: 'wild_bao_khoangmach',
    where: ['pinbao'],
    w: 4,
    cd: 8,
    title: 'Mạch khoáng lộ thiên',
    text: () => 'Lở núi để lộ một vách đá lấp lánh như sao. Linh thạch! Một mạch nhỏ, nhưng đủ khiến người ta đỏ mắt. Trên vách đã có dấu đục của ai khác — mới đây thôi.',
    ch: () => {
      const lv = PL();
      const ck = tuSi('Chủ mỏ quay về', Math.max(1, lv), 1.05);
      return [
        {
          t: 'Đào nhanh',
          cls: 'prime',
          fn: () => {
            const got = money(M(40 + lv * 15)) + (lv >= 3 ? gain('x:linhthach_trung', ri(1, 2)) : '') + gain(mat(lv));
            if (ch(0.4))
              return {
                text: 'Ngươi đào được kha khá thì có kẻ quát sau lưng: "Mỏ của ta!"',
                choices: [
                  { t: 'Đánh', cls: 'danger', hint: nguy(ck), fn: () => duel(ck, { win: () => 'Mỏ giờ của ngươi.' + got + money(M(30 + lv * 10)) }) },
                  { t: 'Chia đôi với hắn', fn: () => 'Hắn cân nhắc rồi gật. Mỗi người một nửa.' + money(M(20 + lv * 8)) },
                ],
              };
            return 'Ngươi đục suốt đêm, túi trữ vật nặng trĩu.' + got;
          },
        },
        { t: 'Đào ít, đi ngay', fn: () => 'Vừa đủ.' + money(M(20 + lv * 6)) },
      ];
    },
  },
  {
    id: 'wild_bao_khobau',
    where: ['pinbao', 'pinbi', 'wild'],
    w: 6,
    once: true,
    cond: () => hasItem('x:banddo', 3),
    title: 'Kho báu trong bản đồ',
    text: () => 'Ba mảnh bản đồ ghép lại, đường nét khớp với dãy núi trước mặt. Theo chỉ dẫn, ngươi tìm thấy một tảng đá đề chữ "Tàng", bên dưới là bậc đá dẫn xuống lòng đất.',
    ch: () => {
      const lv = Math.max(effRi(), PL());
      const kl = quai('Khôi lỗi giữ kho', Math.max(1, lv + 1), 'boss', 1.1, 'kim');
      return [
        {
          t: 'Xuống',
          cls: 'prime',
          fn: () => {
            lose('x:banddo', 3);
            return {
              text: 'Bậc đá dẫn tới một cửa đồng. Trước cửa, một khôi lỗi bằng đồng xanh tỉnh dậy, mắt lóe sáng. Trên ngực nó khắc dòng chữ: "Đánh bại ta, hoặc đọc đúng khẩu quyết."',
              choices: [
                {
                  t: 'Đánh bại nó',
                  cls: 'danger',
                  hint: nguy(kl),
                  fn: () =>
                    duel(kl, {
                      win: () => {
                        mark('Mở được kho báu ba mảnh bản đồ');
                        return 'Cửa đồng mở. Kho báu của một vị cổ tu: linh thạch xếp thành núi nhỏ, và một chiếc hộp gấm.' + money(M(300)) + giveGear(clamp(lv + 1, 0, RMAX()), 3) + gain(techBook());
                      },
                      lose: () => 'Khôi lỗi ném ngươi lên mặt đất. Cửa hầm khép lại, có lẽ phải đợi ngày khác.',
                    }),
                },
                {
                  t: 'Đọc dòng chữ mờ trên mép bản đồ',
                  fn: () => {
                    if (ch(0.3 + stat('ngo') * 0.05)) {
                      mark('Giải khẩu quyết, mở kho báu cổ tu');
                      return 'Ngươi đọc ngược dòng chữ, khôi lỗi cúi đầu tránh đường. Bên trong, ngoài linh thạch, còn một bình đan và một quyển bí kíp chủ nhân để lại cho "người hiểu chuyện".' + money(M(250)) + gain(breakPill(), 1, 2) + gain(techBook(Math.min(4, techCap() + 1)));
                    }
                    return 'Khẩu quyết sai. Khôi lỗi giơ nắm đấm — ngươi chạy, nó không đuổi ra ngoài.' + hurt(20);
                  },
                },
              ],
            };
          },
        },
      ];
    },
  },

  // ---------------- DẤU "bi" động phủ / di tích ----------------
  evHaiCot('wild_bi_haicot', ['pinbi'], PL),
  {
    id: 'wild_bi_tranphap',
    where: ['pinbi'],
    w: 4,
    minR: 1,
    cd: 12,
    title: 'Trận pháp cổ',
    text: () => 'Lối vào di tích là một hành lang lát đá xanh, mỗi viên khắc một quẻ bát quái. Ngươi vừa bước một chân, cả hành lang sáng lên, cánh cửa sau lưng đóng sập.',
    ch: () => {
      const lv = PL();
      return [
        {
          t: 'Bình tĩnh tìm sinh môn',
          cls: 'prime',
          hint: 'Ngộ tính',
          fn: () => {
            if (ch(0.3 + stat('ngo') * 0.05)) {
              return {
                text: 'Ngươi nhìn ra quy luật: sinh môn đổi chỗ mỗi khi ngươi thở. Ngươi bước theo nhịp thở mà đi. Cuối hành lang có hai cửa — một cửa khắc hình lò đan, một cửa khắc hình kiếm.',
                choices: [
                  { t: 'Cửa lò đan', fn: () => 'Đan phòng còn mấy bình đan chưa hỏng.' + gain(cultPill(), 2) + (ch(0.4) ? gain(breakPill()) : gain(herb(lv + 1))) },
                  { t: 'Cửa kiếm', fn: () => 'Phòng binh khí, phần lớn đã mục. Một món còn nguyên.' + giveGear(clamp(lv + 1, 0, RMAX()), 2) },
                ],
              };
            }
            return 'Ngươi bước sai một ô. Đá dưới chân phun lửa, ngươi lăn ra khỏi trận với nửa người cháy xém.' + hurt(30);
          },
        },
        {
          t: 'Phá trận bằng sức mạnh',
          cls: 'danger',
          hint: 'Trận phản phệ',
          fn: () => {
            const tl = quai('Trận linh', Math.max(1, lv + 1), 'demon', 1.1);
            return duel(tl, { win: () => 'Trận vỡ thành ngàn mảnh sáng. Trong mắt trận còn khảm một viên trận thạch, và vài món đồ của kẻ bày trận.' + gain(mat(lv + 1)) + money(M(50 + lv * 15)) + gain(talis(Math.max(1, Math.ceil(lv / 2)))) });
          },
        },
        {
          t: 'Đốt phù độn thổ thoát ra',
          dis: !Object.keys(TALIS).some((t) => TALIS[t].k === 'flee' && hasItem('t:' + t)),
          hint: 'Cần phù chạy trốn',
          fn: () => {
            const f = Object.keys(TALIS).find((t) => TALIS[t].k === 'flee' && hasItem('t:' + t))!;
            lose('t:' + f);
            return 'Lá phù cháy, ngươi chui ra ngoài. Trận pháp phía sau lại chìm vào im lặng.';
          },
        },
      ];
    },
  },
  {
    id: 'wild_bi_dongphu',
    where: ['pinbi'],
    w: 4,
    minR: 1,
    cd: 15,
    title: 'Động phủ bỏ hoang',
    text: () => 'Sau thác nước là cửa đá khắc hai chữ triện. Cấm chế đã yếu tới mức chỉ còn như một lớp màng. Bên trong là động phủ ba gian: tĩnh thất, đan phòng, tàng kinh các. Cấm chế đang rung — ngươi chỉ kịp vào một gian trước khi nó khép lại.',
    ch: () => {
      const lv = PL();
      return [
        {
          t: 'Tĩnh thất',
          fn: () => {
            nam(turnY());
            return 'Bồ đoàn trong tĩnh thất còn lưu đạo vận chủ nhân. Ngươi ngồi xuống, tu luyện một mạch.' + cult(ri(40, 70)) + tamma(-10);
          },
        },
        {
          t: 'Đan phòng',
          fn: () => (ch(0.7) ? 'Phần lớn đan dược đã hóa bột, nhưng còn vài lọ ngọc niêm kín.' + gain(cultPill(), ri(1, 3)) + gain(herb(lv + 1)) : 'Đan độc! Một lọ vỡ, khói xanh xộc vào mũi.' + hurt(25) + gain(cultPill())),
        },
        {
          t: 'Tàng kinh các',
          cls: 'prime',
          fn: () => ({
            text: 'Trên giá sách chỉ còn hai ngọc giản nguyên vẹn. Một cái ấm áp, một cái lạnh buốt.',
            choices: [
              { t: 'Ngọc giản ấm', fn: () => gain(techBook()) },
              { t: 'Ngọc giản lạnh', fn: () => gain(skillBook()) + gain('x:ngocgian') },
            ],
          }),
        },
      ];
    },
  },
  {
    id: 'wild_bi_mocotu',
    where: ['pinbi'],
    w: 3,
    minR: 2,
    cd: 20,
    title: 'Mộ cổ tu',
    text: () => 'Một ngôi mộ đá bị đào dở. Thi thể ba kẻ trộm mộ nằm ở cửa, mặt xám ngoét, không một vết thương. Bên trong, quan tài ngọc nắp mở hé, khí lạnh trào ra như hơi thở.',
    ch: () => {
      const lv = PL();
      const cuong = quai('Ngọc thi', Math.max(2, lv + 1), 'demon', 1.2, 'bang');
      return [
        {
          t: 'Mở hẳn quan tài',
          cls: 'danger',
          hint: nguy(cuong),
          fn: () =>
            duel(cuong, {
              win: () => {
                fame(10);
                return 'Thi thể ngọc vỡ vụn. Dưới đáy quan có những vật tùy táng chủ nhân mang theo xuống mộ.' + giveGear(clamp(lv + 1, 0, RMAX()), ri(2, 3)) + money(M(80 + lv * 20));
              },
            }),
        },
        {
          t: 'Lục người kẻ trộm mộ',
          fn: () => (ch(0.6) ? 'Bọn chúng chuẩn bị kỹ. Phù và bản đồ vẫn còn trong túi.' + gain(talis(Math.max(1, Math.ceil(lv / 2)))) + (ch(0.4) ? gain('x:banddo') : money(M(30))) : 'Ngươi vừa chạm vào, thi khí trên xác bám lên tay.' + hurt(15)),
        },
        { t: 'Đóng cửa mộ lại', fn: () => { good(1); return 'Ngươi khép cửa mộ, đắp thêm đá. Người chết nên được yên.' + tamma(-5); } },
      ];
    },
  },
]);

// ======================= Hỗn Độn giới: Hỗn Độn Thạch (sửa Hỗn Độn Kiếm (Tàn khuyết)) =======================
/** Hỗn Độn Thú canh đá: luôn Hợp Đạo sơ kỳ, không theo cấp nơi đứng. */
const chaosGuard = (mult: number): FoeSpec => ({ ...yeuThu(LV(), mult), name: 'Hỗn Độn Thú', r: REALMS.findIndex((x) => x.n === 'Hợp Đạo'), st: 0 });
const chaosSwordBroken = () => [...s.gear, ...s.gearBag].some((g) => isChaosBroken(g));
const chaosSwordRefined = () => [...s.gear, ...s.gearBag].find((g) => g?.grow && !isChaosBroken(g));
const nextChaosMat = () => {
  const sw = chaosSwordRefined();
  if (sw && sw.g === 12 && (sw.q ?? 0) < 3) {
    const k = CHAOS_FORGE_MATS[sw.q ?? 0];
    if (!hasItem('m:' + k)) return k;
  }
  return CHAOS_FORGE_MATS.find((k) => !hasItem('m:' + k)) ?? pick([...CHAOS_FORGE_MATS]);
};
register([
  {
    id: 'wild_hondonthach',
    where: ['wild'],
    w: 3,
    cd: 6,
    cond: () => WORLD.lv === LAST_WORLD,
    title: 'Hỗn Độn Thạch',
    text: () => `Giữa dòng khí hỗn độn xám đục có một khối đá to bằng nắm tay. Mặt đá không phản chiếu chút ánh sáng nào, chỉ lặng lẽ nuốt mọi thứ quanh nó. Một con Hỗn Độn Thú cuộn mình ngủ cạnh đó.${chaosSwordBroken() ? ' Thanh kiếm tàn khuyết bên hông ngươi bỗng run lên, như gặp lại cố nhân.' : ''}`,
    ch: () => {
      const f = chaosGuard(1.2);
      const out: Choice[] = [
        { t: 'Đánh con thú canh giữ, lấy đá', cls: 'danger', hint: nguy(f), fn: () => duel(f, { win: () => 'Con thú gục xuống. Ngươi nhặt khối đá lên, nhỏ bằng nắm tay mà nặng như cả ngọn núi.' + gain('m:hondonthach') }) },
      ];
      if (chaosSwordBroken()) {
        // kiếm dẫn tới đá và áp chế bớt con thú, nhưng vẫn phải đánh mới lấy được
        const g = chaosGuard(1.0);
        out.push({
          t: 'Để thanh kiếm tàn khuyết dẫn đường',
          cls: 'prime',
          hint: nguy(g) + ' · kiếm áp chế, thú yếu hơn',
          fn: () => duel(g, { win: () => 'Thanh kiếm kéo tay ngươi tới sát khối đá; kiếm khí vừa chạm đá thì con thú bừng tỉnh lao tới, nhưng uy áp của kiếm làm nó chậm đi nửa nhịp. Con thú gục xuống. Mũi kiếm chạm vào khối đá, đá tự rơi vào lòng bàn tay ngươi.' + gain('m:hondonthach') }),
        });
      }
      out.push({ t: 'Bỏ qua', fn: () => 'Khí hỗn độn quá dày, ngươi không dám nán lại.' });
      return out;
    },
  },
  {
    id: 'wild_hondon_nguyenlieu',
    where: ['wild'],
    w: 3,
    cd: 5,
    cond: () => WORLD.lv === LAST_WORLD,
    title: 'Nguyên liệu Hỗn Độn',
    text: () => {
      const m = MATS[nextChaosMat()];
      return `Sâu trong vết nứt hồng mông hiện ra một luồng đạo quang cổ xưa — đó là ${m.n}, nguyên liệu luyện khí cấp bậc Hỗn Độn cực kỳ hiếm thấy. Một đầu Hỗn Độn Thú đang nằm hấp thu bản nguyên quanh bảo vật.${chaosSwordRefined() || chaosSwordBroken() ? ' Thanh kiếm bên hông ngươi ngân vang, kiếm ý cộng hưởng với nguồn nguyên liệu.' : ''}`;
    },
    ch: () => {
      const matKey = nextChaosMat();
      const m = MATS[matKey];
      const f = chaosGuard(1.2);
      const out: Choice[] = [
        { t: `Đánh Hỗn Độn Thú, đoạt ${m.n}`, cls: 'danger', hint: nguy(f), fn: () => duel(f, { win: () => `Con thú gầm lên rồi tan vào khí hỗn độn. Ngươi thu lấy ${m.n} còn ấm nóng đạo vận.` + gain('m:' + matKey) }) },
      ];
      if (chaosSwordRefined() || chaosSwordBroken()) {
        const g = chaosGuard(1.0);
        out.push({
          t: `Dùng kiếm ý Hỗn Độn áp chế và thu lấy ${m.n}`,
          cls: 'prime',
          hint: nguy(g) + ' · kiếm ý Hỗn Độn áp chế thú canh giữ',
          fn: () => duel(g, { win: () => `Kiếm ý Hỗn Độn bùng lên trấn áp huyết mạch con thú khiến nó khựng lại. Đánh bại nó xong, ${m.n} tự bay về phía mũi kiếm của ngươi.` + gain('m:' + matKey) }),
        });
      }
      out.push({ t: 'Bỏ qua', fn: () => 'Khí hỗn độn cuộn trào dữ dội, ngươi lùi lại.' });

      return out;
    },
  },
]);
