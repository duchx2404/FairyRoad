// Gặp Chân linh ở hoang dã / di tích: thuần phục hoặc đoạt tinh huyết.
import { RMAX, effRi, register, s, ch, pick, mark, statUp, hurt, fame, battle, here, cult, REALMS, type Choice } from '../engine/api';
import { CHANLINH, clEffect, type ChanLinh } from '../data/spirit';

const pickLinh = (): ChanLinh | null => {
  const pool = Object.values(CHANLINH).filter((c) => effRi() >= c.minR && (!c.reg || c.reg.includes(here().reg)));
  return pool.length ? pick(pool) : null;
};
const cur = () => CHANLINH[s.flags._cl as string];

register([
  {
    id: 'spirit_meet',
    where: ['wild', 'realm', 'pin?', 'pinbi'],
    w: 4,
    cd: 12,
    minR: 1,
    cond: () => !!pickLinh(),
    title: 'Chân linh',
    text: () => {
      const c = pickLinh()!;
      s.flags._cl = c.id;
      return `Giữa ${here().n}, một con ${c.n} đứng chắn đường — không hung dữ, chỉ nhìn ngươi bằng đôi mắt có linh tính. ${c.d}${s.flags.chanlinh ? ` ${s.flags.chanlinh.name} bên cạnh ngươi gầm khẽ.` : ''}`;
    },
    ch: () => {
      const c = cur();
      const out: Choice[] = [];
      out.push({
        t: s.flags.chanlinh ? `Thuần phục (thả ${s.flags.chanlinh.name})` : 'Thuần phục', cls: 'prime',
        hint: `${clEffect(c)}`,
        fn: () => {
          const p = 0.25 + s.stats.mi * 0.03 + s.stats.van * 0.02 + (effRi() - c.minR) * 0.08;
          if (ch(Math.min(0.9, p))) {
            const name = c.n;
            s.flags.chanlinh = { id: c.id, name, bond: 20 };
            mark(`Thuần phục chân linh ${c.n}`);
            return `Ngươi chìa tay, để linh khí của mình chảy ra từ từ. Nó ngửi rất lâu, rồi cúi đầu chạm trán vào lòng bàn tay ngươi. Khế ước thành. Từ nay ${c.n} đi theo ngươi.`;
          }
          return `${c.n} lùi lại, gầm khẽ, rồi biến vào bóng cây. Duyên chưa đủ.`;
        },
      });
      out.push({
        t: 'Đoạt tinh huyết', cls: 'danger',
        fn: () => battle({ name: c.n, r: Math.min(RMAX(), Math.max(c.minR, effRi())), el: c.el, kind: 'beast', mult: 1.1 }, {
          win: () => {
            fame(5);
            const st = pick(['can', 'ngo', 'tam'] as const);
            return `Tinh huyết của ${c.n} còn nóng hổi. Ngươi luyện hóa nó vào kinh mạch.` + statUp(st, 1) + cult(25);
          },
          lose: () => 'Chân linh không dễ bắt nạt.' + hurt(10),
        }),
      });
      out.push({ t: 'Để nó đi', fn: () => `Ngươi đứng yên. ${c.n} nhìn ngươi thêm một lúc, rồi quay đi.` });
      return out;
    },
  },
  {
    id: 'spirit_grow',
    where: ['any'],
    w: 3,
    cd: 15,
    cond: () => !!s.flags.chanlinh && s.flags.chanlinh.bond >= 60,
    title: 'Chân linh lột xác',
    text: () => `${s.flags.chanlinh.name} mấy ngày nay biếng ăn, nằm cuộn tròn bên ngươi. Đêm nay, quanh người nó tỏa ra linh quang — nó đang lột xác.`,
    ch: () => [
      { t: 'Truyền chân nguyên hộ pháp', cls: 'prime', fn: () => { s.flags.chanlinh.bond = Math.min(100, s.flags.chanlinh.bond + 20); return `Ngươi truyền chân nguyên suốt ba ngày. Khi linh quang tan, ${s.flags.chanlinh.name} lớn hơn hẳn, ánh mắt thông tuệ như người. Hai bên tâm ý tương thông hơn.` + (ch(0.3) ? statUp('tam', 1) : ''); } },
      { t: 'Để nó tự vượt qua', fn: () => `${s.flags.chanlinh.name} tự vượt qua, chỉ là chậm hơn một chút.` },
    ],
  },
]);
void REALMS;
