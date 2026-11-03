// Sự kiện Thiên Cơ Lâu: gặp hồi hạ giả (trẻ được thế lực Hỗn Độn đưa về Thương Lan), sứ giả bán tin,
// lên bảng được người đời nhận ra, kẻ xếp trên bảng tới khiêu chiến.
import { s, register, ch, ri, mkNpc, addNpc, relChange, fame, money, canPay, mark, effRi, battle, statUp, tamma, cult, type Choice, type NPC } from '../engine/api';
import { moneyScale, age } from '../engine/char';
import { WORLDS, CLANS } from '../data/core';
import { SECTS, LOCS } from '../data/world';
import { retPeople, board, myRank, linkNpc, revealAll, infoBought, realmTxt, worldOf, personOf, type TcPerson } from '../engine/tienco';

const isDiepHD = () => s.origin === 'diep_hondon';
/** Hồi hạ giả còn sống ở Thương Lan mà người chơi chưa gặp. */
const unmet = () => retPeople().filter((p) => p.alive && p.world === worldOf() && !p.npc && p.loc === s.loc && s.year - p.born >= 6);
const selected = () => {
  const pool = unmet();
  const current = personOf(s.flags._tc);
  if (current && pool.includes(current)) return current;
  const p = pool[ri(0, pool.length - 1)];
  s.flags._tc = p.id;
  return p;
};
const he = (p: TcPerson) => (p.g === 'm' ? 'hắn' : 'nàng');
const same = (p: TcPerson) => Math.abs(p.born - s.born) <= 3;

function spawn(p: TcPerson, tag: NPC['tag'], rel: number, how: string): NPC {
  const clan = p.clan ? CLANS[p.clan] : null;
  const sect = clan?.patron ?? Object.values(SECTS).find((x) => x.n === p.sect)?.id ?? null;
  const home = p.clan ? `thuộc ${clan!.n}` : p.sect;
  const n = mkNpc({ name: p.name, g: p.g, r: p.r, st: p.st, el: p.el, age: Math.max(1, Math.floor(s.year - p.born)), talent: p.talent, tag, rel, how: [how, home].filter(Boolean).join(' · '), sect });
  linkNpc(p, n);
  addNpc(n);
  n.loc = p.loc ?? s.loc;
  if (p.bio) n.bio = { ...p.bio, els: p.bio.els ? [...p.bio.els] : undefined };
  if (p.pic) n.pic = p.pic;
  if (p.heroine) s.flags.heroineId = n.id;
  if (s.g === 'f' && p.ret === 'Diệp gia Hỗn Độn' && p.g === 'm') s.flags.mainLeadId = n.id;
  return n;
}

register([
  {
    id: 'tc_sao_bang',
    where: ['any'],
    w: 30,
    once: true,
    cond: () => worldOf() === 0,
    title: 'Sao băng phủ khắp Thương Lan',
    text: () => {
      retPeople();
      const born = Math.floor(s.born);
      const near = LOCS[s.loc]?.n;
      if (isDiepHD()) return `Năm ${born}, đêm ngươi ra đời. Hư Không Liệt Cốc nứt toác; từ khe nứt, vô số sao băng cùng lúc rạch ngang bầu trời, rơi xuống khắp năm vực Thương Lan. Mỗi vệt sáng bọc một đứa trẻ sơ sinh, có trai có gái, mà các thế lực Hỗn Độn trả đại giá đưa về hạ giới, để chúng đi lại con đường tu hành từ những bước chân đầu tiên, đặt nền móng vững hơn bất kỳ ai sinh ra ở thượng giới. Người đời gọi họ là hồi hạ giả.

Một trong những vệt sáng ấy là ngươi. Chiếc nôi gỗ Hỗn Độn rơi xuống ${near ? `gần ${near}` : 'Thương Lan'}, tấm ngọc bội Diệp gia còn ấm bên gối. Những vệt sáng khác tản về những nơi rất xa nhau. Thiên Cơ Lâu ghi nhận nhiều hồi hạ giả cùng giáng lâm một đêm, nhưng danh tính từng hồi hạ giả đều không rõ.`;
      return `Năm ${born}, đêm ngươi ra đời. Vô số sao băng cùng lúc rạch ngang bầu trời khắp năm vực Thương Lan, rơi xuống những nơi xa cách nhau. Thiên Cơ Lâu ghi nhận nhiều hồi hạ giả cùng giáng lâm — những đứa trẻ có trai có gái, sinh cùng năm với ngươi — nhưng danh tính của từng người đều không rõ.

Ngươi không ở trong số đó. Ngươi sinh ra ở Thương Lan, chỉ là chào đời đúng vào đêm trời mưa sao.`;
    },
    ch: () => [{
      t: isDiepHD() ? 'Mở mắt ở Thương Lan' : 'Ghi nhớ dị tượng',
      cls: 'prime',
      fn: () => {
        if (isDiepHD()) {
          mark('Cùng các hồi hạ giả theo sao băng giáng xuống Thương Lan');
          return 'Ánh sao tắt dần quanh chiếc nôi. Người Diệp thị Hoang Cổ lần theo vệt sáng tìm tới, bế ngươi về Tổ Địa. Ở khắp năm vực, những đứa trẻ khác cũng đang được người lạ nhặt về — không ai biết chúng từ đâu tới.';
        }
        mark('Nhiều sao băng đồng loạt giáng xuống khắp Thương Lan');
        return 'Vệt sáng cuối cùng tắt sau dãy núi. Người đời bàn tán về dị tượng, nhưng không ai biết chúng đã mang theo điều gì.';
      },
    }],
  },
  // ---- Gặp hồi hạ giả ----
  {
    id: 'tc_hoiha_gap',
    where: ['town', 'market', 'sect', 'road', 'wild'],
    w: 3,
    cd: 5,
    cond: () => !s.flags.childhood && unmet().length > 0,
    title: () => selected().heroine ? 'Nửa ngọc bội giữa dòng người' : 'Duyên gặp gỡ',
    text: () => {
      const p = selected();
      if (p.heroine) return `Giữa dòng người qua lại, một thiếu nữ tên ${p.name} khẽ khựng bước. Nửa ngọc bội trong tay áo ngươi chợt ấm lên; nơi cổ nàng cũng đeo nửa ngọc bội đôi còn lại có đường vân khớp đến lạ.`;
      return `Một ${p.g === 'm' ? 'thiếu niên' : 'thiếu nữ'} ${same(p) ? 'trạc tuổi ngươi' : 'còn rất trẻ'} đi ngang. Tu vi ${realmTxt(p.r, p.st)}, thần sắc bình thản giữa dòng người.`;
    },
    ch: () => {
      const p = selected();
      delete s.flags._tc;
      if (p.heroine) return [
        {
          t: 'Lấy nửa ngọc bội ra',
          cls: 'prime',
          fn: () => {
            const n = spawn(p, 'peer', 35, `Gặp gỡ tại ${WORLDS[p.world]}`);
            n.rel = 70;
            s.flags.heroineMet = true;
            mark(`Gặp ${n.name} (giữ nửa ngọc bội đôi còn lại) giữa dòng người`);
            return `Hai mảnh ngọc bội vừa chạm nhau đã khớp thành một, ánh ngọc Hỗn Độn dịu nhẹ lan qua kẽ tay. ${n.name} mỉm cười, rồi cùng ngươi trò chuyện về con đường tu hành. Nửa ngọc bội đôi của hai người đã tìm thấy nhau. Từ đây, nàng đã ở trong Nhân mạch của ngươi.`;
          },
        },
        { t: 'Cất ngọc bội, lướt qua', fn: () => 'Ngươi không gọi nàng lại. Dòng người nhanh chóng che khuất bóng áo; mảnh ngọc trong tay áo dần nguội đi.' },
      ];
      const out: Choice[] = [
        {
          t: 'Bắt chuyện, kết giao', cls: 'prime',
          fn: () => {
            const n = spawn(p, 'peer', 15, `Gặp ở ${WORLDS[0]}`);
            mark(`Gặp ${n.name} ở ${WORLDS[0]}`);
            return `${n.name} trò chuyện với ngươi về việc tu hành, rồi mỗi người lại tiếp tục con đường riêng. ${he(p).replace(/^./, (c) => c.toUpperCase())} đã ở trong Nhân mạch của ngươi.`;
          },
        },
        {
          t: 'Chặn lại, tỉ thí luận bàn',
          fn: () => battle({ name: p.name, r: Math.max(1, p.r), st: p.st, el: p.el, kind: 'cultivator', mult: 1.15 }, {
            lethal: false,
            win: () => { const n = spawn(p, 'rival', -20, `Tỉ thí với ngươi ở ${WORLDS[0]}`); fame(15 * Math.max(1, effRi())); return `${n.name} lùi lại, ánh mắt sáng lên: "Trận này đã mắt thật. Lần sau ta sẽ không thua." ${he(p).replace(/^./, (c) => c.toUpperCase())} nhớ tên ngươi — và ngươi nhớ ${he(p)}.`; },
            lose: () => { const n = spawn(p, 'rival', -10, `Tỉ thí với ngươi ở ${WORLDS[0]}`); fame(-5); return `Ngươi thua. ${n.name} không cười nhạo, chỉ chắp tay rồi rời đi.`; },
          }),
        },
        { t: 'Lướt qua, coi như không thấy', fn: () => (ch(0.5) ? `Ngươi đi tiếp, dòng người nhanh chóng che khuất bóng dáng ấy.` : `Ngươi định đi, nhưng ${he(p)} bước lên chào hỏi. ${(() => { const n = spawn(p, 'acq', 10, `Gặp ở ${WORLDS[0]}`); return `${n.name} đã ở trong Nhân mạch của ngươi.`; })()}`) },
      ];
      return out;
    },
  },
  // ---- Sứ giả Thiên Cơ Lâu ----
  {
    id: 'tc_sugia',
    where: ['town', 'market'],
    w: 3,
    cd: 6,
    minR: 1,
    cond: () => !s.flags.childhood,
    title: 'Người áo xám của Thiên Cơ Lâu',
    text: () => `Một người áo xám không tuổi ngồi ở góc trà lâu, trước mặt không trà không bánh, chỉ một tấm thẻ gỗ khắc hình lầu ba tầng. Thấy ngươi, ${ch(0.5) ? 'hắn' : 'bà ta'} gật đầu như đã hẹn trước: "Thiên Cơ Lâu ${WORLDS[worldOf()]}. Ngươi hiện xếp ${myRank('tk') ? `hạng ${myRank('tk')} Thiên Kiêu Bảng` : 'ngoài Thiên Kiêu Bảng'}, ${myRank('cg') ? `hạng ${myRank('cg')} Cường Giả Bảng` : 'ngoài Cường Giả Bảng'}. Muốn biết gì thêm, trả giá."`,
    ch: () => {
      const w = worldOf();
      const price = Math.round(120 * moneyScale(Math.max(1, effRi())));
      const hidden = retPeople().filter((p) => p.alive && p.world === w && !p.known);
      const out: Choice[] = [];
      if (w === 0) out.push({
        t: `Mua Thiên Cơ Lục: ai là người được đưa về từ Hỗn Độn (${price} linh thạch)`, cls: 'prime',
        dis: !canPay(price) || infoBought(w) || !hidden.length,
        hint: infoBought(w) ? 'Đã mua' : !hidden.length ? 'Không còn ai để lộ' : !canPay(price) ? 'Không đủ linh thạch' : `${hidden.length} người trong giới`,
        fn: () => {
          money(-price);
          const got = revealAll(w);
          mark('Mua Thiên Cơ Lục về các hồi hạ giả');
          return `Tấm thẻ gỗ lật lại, mặt sau hiện chữ rồi tan: ${got.map((p) => `${p.name} — ${p.ret}`).join('; ')}. "Mỗi thế lực chỉ đưa được một người. Họ tu từ một tuổi, sống qua sáu lần thọ nguyên. Ngươi muốn làm bạn hay làm thù với họ, tùy." Lai lịch những người này đã hiện trên bảng.`;
        },
      });
      out.push({
        t: 'Hỏi vì sao người Hỗn Độn lại muốn tu từ Thương Lan',
        fn: () => { statUp('ngo', ch(0.3) ? 1 : 0); return `"Phi thăng là thân thể về một tuổi, tâm trí giữ nguyên, thọ nguyên tính lại. Kẻ sinh ở Hỗn Độn chỉ có một đời; kẻ bắt đầu từ Thương Lan có sáu đời. Đại tộc nào chẳng muốn con mình sống sáu đời? Nhưng xé không gian đưa một đứa trẻ xuống sáu tầng giới — cả thánh địa cũng chỉ gánh nổi một lần." ${ch(0.3) ? 'Ngươi ngẫm rất lâu về chữ "sáu đời" ấy.' : ''}`; },
      });
      out.push({ t: 'Không mua gì, đứng dậy', fn: () => '"Thiên Cơ Lâu không giữ khách." Người áo xám quay đi; lúc ngươi ngoảnh lại, góc bàn đã trống.' });
      return out;
    },
  },
  // ---- Lên bảng, người đời nhận ra ----
  {
    id: 'tc_lenbang',
    where: ['town', 'market', 'sect'],
    w: 5,
    cd: 10,
    minR: 1,
    cond: () => !s.flags.childhood && !!myRank('tk') && myRank('tk') <= 10 && !s.flags.tcSeen10,
    title: 'Tên trên Thiên Kiêu Bảng',
    text: () => `Trước cửa phân lâu Thiên Cơ Lâu, tấm bảng mới dán còn ướt mực. Có người đọc to: "Hạng ${myRank('tk')} — ${s.name}, ${realmTxt(s.r, s.st)}, ${Math.floor(age())} tuổi." Cả đám quay lại nhìn ngươi.`,
    ch: () => [
      { t: 'Chắp tay khiêm tốn rồi đi', cls: 'prime', fn: () => { s.flags.tcSeen10 = true; fame(20 * Math.max(1, effRi())); statUp('tam', 1); return 'Ngươi chắp tay một vòng rồi rẽ đám đông đi thẳng. Phía sau, có người nói: "Tuổi ấy, tu vi ấy, mà không kiêu." Danh tiếng lên, tâm cảnh cũng vững thêm.'; } },
      { t: 'Ngẩng cao đầu nhận lấy', fn: () => { s.flags.tcSeen10 = true; fame(35 * Math.max(1, effRi())); return `Ngươi đứng dưới bảng để mọi người nhìn cho rõ. Tiếng tung hô vang nửa con phố — và trong đám đông, vài ánh mắt không vui.${tamma(5)}`; } },
      { t: 'Hỏi Thiên Cơ Lâu ai đứng trên mình', fn: () => { s.flags.tcSeen10 = true; const b = board('tk'); const above = b.filter((r) => r.rank < myRank('tk')).slice(-3); return above.length ? `Người giữ bảng chỉ lên trên: ${above.map((r) => `hạng ${r.rank} ${r.name} (${realmTxt(r.r, r.st)}, ${r.age} tuổi)`).join('; ')}. "Muốn lên nữa, vượt họ."` : '"Trên ngươi không còn ai." Người giữ bảng cúi đầu rất thấp.'; } },
    ],
  },
  // ---- Kẻ xếp ngay trên tới khiêu chiến ----
  {
    id: 'tc_khieuchien',
    where: ['town', 'sect', 'road', 'market'],
    w: 3,
    cd: 8,
    minR: 1,
    cond: () => {
      if (s.flags.childhood) return false;
      const r = myRank('tk');
      if (!r || r > 60) return false;
      const b = board('tk');
      const above = b.find((x) => x.rank === r - 1);
      const below = b.find((x) => x.rank === r + 1);
      return !!((above && above.person && !above.npc) || (below && below.person && !below.npc));
    },
    title: 'Tranh hạng trên Thiên Kiêu Bảng',
    text: () => {
      const r = myRank('tk');
      const b = board('tk');
      const cand = [b.find((x) => x.rank === r + 1), b.find((x) => x.rank === r - 1)].filter((x) => x && x.person && !x.npc);
      const t = cand[ri(0, cand.length - 1)]!;
      s.flags._tc = t.id;
      s.flags._tcUp = t.rank < r;
      return t.rank < r
        ? `${t.name}, hạng ${t.rank} Thiên Kiêu Bảng — ngay trên ngươi — tìm tới tận nơi. "Thiên Cơ Lâu xếp ngươi sát sau ta. Ta không thích có người thở sau gáy. Đấu một trận, cho rõ ai trên ai dưới."`
        : `${t.name}, hạng ${t.rank} Thiên Kiêu Bảng — ngay dưới ngươi — chặn đường. "${t.age} tuổi mà xếp dưới ngươi? Thiên Cơ Lâu nhầm rồi. Đấu một trận."`;
    },
    ch: () => {
      const p = personOf(s.flags._tc)!;
      const up = !!s.flags._tcUp;
      return [
        {
          t: 'Nhận lời, đấu luận bàn', cls: 'prime',
          fn: () => battle({ name: p.name, r: Math.max(1, p.r), st: p.st, el: p.el, kind: 'cultivator', mult: 1.1 }, {
            lethal: false,
            win: () => { fame((up ? 30 : 15) * Math.max(1, effRi())); const n = spawn(p, 'rival', -15, `Thua ngươi khi tranh hạng Thiên Kiêu Bảng`); return `${n.name} ngã ngồi, nhìn ngươi rất lâu rồi bật cười: "Được. Thiên Cơ Lâu không sai." Trận này lan khắp giới.${cult(3)}`; },
            lose: () => { fame(-10); const n = spawn(p, 'rival', -10, `Thắng ngươi khi tranh hạng Thiên Kiêu Bảng`); return `${n.name} thu tay: "Về tu thêm đi." Đêm đó tấm bảng trước Thiên Cơ Lâu được dán lại.`; },
          }),
        },
        { t: 'Từ chối: bảng là của Thiên Cơ Lâu, không phải của ta', fn: () => { fame(-5); const n = spawn(p, 'acq', -5, `Từng tới khiêu chiến tranh hạng, ngươi không nhận`); return `${n.name} nhếch mép: "Sợ." Rồi bỏ đi. Ngươi không sợ — ngươi chỉ không có thời gian. Nhưng người đời không phân biệt hai thứ đó.`; } },
      ];
    },
  },
  // ---- Hồi hạ giả nhắn nhủ khi ngươi sắp phi thăng (chỉ với Diệp Thần) ----
  {
    id: 'tc_hoiha_loihen',
    where: ['cult', 'any'],
    w: 4,
    once: true,
    cond: () => isDiepHD() && worldOf() === 0 && s.r >= 8 && retPeople().some((p) => p.alive && p.npc && p.world === 0),
    title: 'Lời hẹn trước ngày phi thăng',
    text: () => { const ps = retPeople().filter((p) => p.alive && p.npc && p.world === 0); return `${ps.map((p) => p.name).join(', ')} tìm tới ngươi trong một đêm không trăng. "Ngươi sắp đi trước bọn ta. Lên tới Hỗn Độn, nếu còn cơ duyên gặp lại, hãy cùng nâng chén."`; },
    ch: () => [
      { t: 'Hẹn ngày gặp lại', cls: 'prime', fn: () => { for (const p of retPeople().filter((p) => p.npc)) { const n = s.npcs.find((x) => x.id === p.npc); if (n) relChange(n, 15); } statUp('tam', 1); return 'Các ngươi cùng chạm chén. Không ai nói chữ "nếu". Tâm cảnh ngươi vững thêm một bậc.'; } },
      { t: 'Mỗi người một đường', fn: () => 'Ngươi không hứa gì. Họ cũng không trách. Trên con đường này, lời hứa là thứ xa xỉ nhất.' },
    ],
  },
]);
