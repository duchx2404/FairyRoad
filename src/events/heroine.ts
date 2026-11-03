// Tuyến Ngô Thu Phương phát triển cùng các hồi hạ giả; gặp gỡ và các bước tiếp theo đều là sự kiện ngẫu nhiên.
import { s, register, relChange, mark, fame, findNpc, type NPC } from '../engine/api';
import { HEROINE } from '../data/heroine';
import { wedDaolu } from '../engine/relationships';

const heroine = (): NPC | null => {
  const n = s.flags.heroineId ? findNpc(s.flags.heroineId) : null;
  return n?.alive && n.name === HEROINE.name ? n : null;
};
const wedded = () => heroine()?.tag === 'daolu';

register([
  {
    id: 'ngo_thuph_duyen',
    where: ['any'],
    w: 3,
    cd: 12,
    cond: () => {
      const n = heroine();
      return !!n && n.rel >= 75 && !wedded();
    },
    title: 'Nửa ngọc bội còn lại',
    text: () => `${HEROINE.name} đặt nửa ngọc bội đã ghép lên bàn. Nàng nhìn ngươi, không nhắc tới hôn ước hay lời hứa nào: "Con đường phía trước còn dài. Nếu ngươi muốn, chúng ta có thể cùng đi."`,
    ch: () => [
      {
        t: 'Cùng nàng kết làm đạo lữ (Chính thất)',
        cls: 'prime',
        fn: () => {
          const n = heroine();
          if (!n) return 'Nàng đã rời đi.';
          wedDaolu(n);
          n.rel = 100;
          mark(`Kết đạo lữ với ${HEROINE.name} (Chính thất)`);
          fame(300);
          return `${n.name} nhận lại nửa ngọc bội, khẽ mỉm cười. Hai nửa ngọc bội đôi trong tay hai người tương thông cộng hưởng. Từ nay hai người cùng bước tiếp trên tiên lộ.`;
        },
      },
      {
        t: 'Chưa quyết định',
        fn: () => {
          const n = heroine();
          if (n) relChange(n, 2);
          return 'Nàng gật đầu, không thúc ép. Chuyện tương lai cứ để duyên phận quyết định.';
        },
      },
    ],
  },
  {
    id: 'ngo_thuph_donghanh',
    where: ['any'],
    w: 2,
    cd: 10,
    cond: () => !!heroine() && !wedded(),
    title: () => `Đường tu của ${HEROINE.given}`,
    text: () => `${HEROINE.name} kể về những đổi thay trên con đường tu luyện của nàng. Ngô gia ở Thương Lan, tông môn và các cơ duyên đã đưa nàng tới hôm nay — chẳng điều gì giống với dự tính ban đầu.`,
    ch: () => [
      {
        t: 'Cùng nàng luận đạo',
        cls: 'prime',
        fn: () => {
          const n = heroine();
          if (n) relChange(n, 6);
          return 'Hai người trao đổi sở ngộ. Những khác biệt trong đường tu hóa thành cảm hứng mới.';
        },
      },
      {
        t: 'Chúc nàng thuận lợi',
        fn: () => {
          const n = heroine();
          if (n) relChange(n, 3);
          return 'Nàng cười, cất nửa ngọc bội vào tay áo rồi lại lên đường.';
        },
      },
    ],
  },
]);

export const isHeroine = (n: NPC) => n.name === HEROINE.name && n.id === s.flags.heroineId;
export { heroine };
