// Gặp tổ thú Sơn Hải Kinh ở núi của nó.
import { effRi, register, s, ch, mark, statUp, hurt, fame, battle, here, cult, lifeAdd, gain, REALMS, type Choice } from '../engine/api';
import { codexAdd } from '../engine/state';
import { shjAt, type Beast } from '../data/world';

const cur = (): Beast | undefined => shjAt(s.loc).find((b) => b.n === s.flags._shj) || shjAt(s.loc)[0];

/** Phần thưởng riêng khi quan sát / được tổ thú để mắt tới. */
function blessing(b: Beast): string {
  switch (b.n) {
    case 'Phượng Hoàng': return ' Lông vũ ngũ sắc rơi xuống vai ngươi.' + gain('m:cotuhuyet') + statUp('mi', 1);
    case 'Thừa Hoàng': return ' Nó cúi lưng cho ngươi cưỡi một vòng quanh đảo.' + lifeAdd(120);
    case 'Tinh Vệ': return ' Nhìn con chim nhỏ ngậm đá lấp biển, đạo tâm ngươi vững thêm.' + statUp('tam', 2);
    case 'Chúc Long': return ' Một lần nó mở mắt, ngươi thấy ngày và đêm trôi qua trong một hơi thở.' + statUp('ngo', 2);
    case 'Tinh Tinh': return ` Nó gọi đúng tên ngươi: "${s.name}". Rồi bỏ đi.` + statUp('ngo', 1);
    case 'Thiên Cẩu': return ' Nó đi theo ngươi một đoạn rồi mới quay về — có nó đi cùng, tà khí không dám lại gần.' + statUp('van', 1);
    default: return cult(25) + (ch(0.4) ? statUp('ngo', 1) : '');
  }
}

register([
  {
    id: 'shj_totu',
    where: ['wild'],
    w: 6,
    cd: 10,
    cond: () => shjAt(s.loc).length > 0,
    title: () => `${here().n} · Sơn Hải Kinh`,
    text: () => {
      const all = shjAt(s.loc);
      const b = all[Math.floor(Math.random() * all.length)];
      s.flags._shj = b.n;
      codexAdd('beast', b.n);
      const gap = b.lv[0] - effRi();
      const feel = gap >= 3 ? 'Uy áp ép ngươi quỳ rạp xuống đất, thở cũng không nổi.' : gap >= 1 ? 'Khí tức của nó đè nặng lên ngực ngươi.' : 'Ngươi đứng vững được trước khí tức của nó.';
      return `Sâu trong ${here().n}, ngươi gặp ${b.n} — tổ thú chép trong Sơn Hải Kinh (${REALMS[b.lv[0]].n}). ${b.shj} ${feel}`;
    },
    ch: () => {
      const b = cur()!;
      const gap = b.lv[0] - effRi();
      const out: Choice[] = [
        {
          t: 'Lặng lẽ quan sát', cls: 'prime', hint: 'Cảm ngộ từ dị thú thượng cổ',
          fn: () => (ch(gap >= 3 ? 0.55 : 0.8)
            ? `Ngươi nín thở nhìn ${b.n} rất lâu. Nó biết ngươi ở đó, nhưng không bận tâm.` + blessing(b)
            : `${b.n} quay đầu về phía ngươi. Chỉ một ánh mắt, ngươi đã thổ huyết bay ra ngoài núi.` + hurt(gap >= 3 ? 45 : 25)),
        },
        { t: 'Lui ra', fn: () => `Ngươi cúi đầu, lùi từng bước ra khỏi lãnh địa của ${b.n}. Có những thứ không nên chạm vào.` },
        {
          t: `Khiêu chiến ${b.n}`, cls: 'danger', hint: gap > 0 ? `Cao hơn ngươi ${gap} đại cảnh giới` : 'Ngang sức hoặc yếu hơn ngươi',
          fn: () => battle({ name: b.n, r: b.lv[0], st: 3, kind: 'boss', el: b.el, mult: 1.35, mat: 'cotuhuyet' }, {
            win: () => { mark(`Đánh bại ${b.n} ở ${here().n}`); fame(80 * b.lv[0]); return ` ${b.n} gục xuống. Tên ngươi sẽ được chép thêm vào lề Sơn Hải Kinh.` + gain('m:cotuhuyet', 2) + statUp('can', 1); },
            lose: () => ` ${b.n} không giết ngươi — chỉ hất ngươi văng khỏi núi như phủi bụi.` + hurt(60),
          }),
        },
      ];
      return out;
    },
  },
]);
