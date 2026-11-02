// Tình địch: kẻ thầm yêu Thánh nữ còn giữ hôn ước với người chơi — Thánh tử cùng tông, hoặc cháu / chắt của một nhân vật lớn trong tông.
// Sinh ngay khi hôn ước được chốt ở mốc mười sáu tuổi (mỗi nàng một kẻ, ghi flags.suitors {brideId: suitorId}); gặp thì gây hấn, thách đấu, ám hại.
import { s, register, ch, pick, ri, mark, fame, hurt, relChange, findNpc, battle, effRi, SECTS, REALMS, type NPC, type Choice } from '../engine/api';
import { CLANS } from '../data/core';
import { mkNpc, addNpc, holyNpcName } from '../engine/core';
import { has } from '../engine/char';

const kept = (): NPC[] => ((s.flags.dhKept as string[] | undefined) || []).map((id) => findNpc(id)).filter((n): n is NPC => !!n && n.alive && n.tag !== 'daolu');
const suitors = (): Record<string, string> => (s.flags.suitors ||= {});
/** Tình địch còn sống của các nàng còn giữ hôn ước. */
const rivals = (): { r: NPC; bride: NPC }[] => kept().map((b) => ({ bride: b, r: findNpc(suitors()[b.id] || '')! })).filter((x) => x.r && x.r.alive && x.r.tag !== 'acq');

const ROLE_HOLY = ['Thánh tử', 'Thánh tử', 'cháu nội của Thái Thượng Trưởng Lão', 'cháu ngoại của Đại trưởng lão', 'chắt của Thánh chủ đời trước', 'đệ tử thân truyền của Thánh chủ'];
const ROLE_CLAN = ['Thiếu chủ', 'cháu đích tôn của lão tổ', 'con trai thứ của gia chủ', 'thiên kiêu trẻ nhất trong tộc'];

/** Gọi sau khi chốt hôn ước: mỗi Thánh nữ còn giữ hôn ước sinh một tình địch cùng thế lực. */
export function spawnSuitors(): string {
  const names: string[] = [];
  for (const b of kept()) {
    if (suitors()[b.id] && findNpc(suitors()[b.id])?.alive) continue;
    const sc = b.sect ? SECTS[b.sect] : null;
    const clan = Object.values(CLANS).find((c) => b.name.startsWith(c.sur + ' ') && c.id !== 'diep');
    const isClan = !!clan && !(sc && sc.tier >= 4 && b.how.includes(sc.n));
    const force = isClan ? clan!.n : sc ? sc.n : 'thánh địa';
    const role = pick(isClan ? ROLE_CLAN : ROLE_HOLY);
    const r = addNpc(mkNpc({ g: 'm', r: Math.max(1, effRi() + 1), st: ri(1, 3), tag: 'enemy', rel: -55, sect: b.sect, el: b.el, age: ri(16, 24), talent: 1.4 + Math.random() * 0.5,
      how: `${role} ${force} — thầm yêu ${b.name}, coi hôn ước của ngươi là cái gai trong mắt` }));
    if (isClan) r.name = `${clan!.sur} ${r.name.split(' ').slice(-1)[0]}`; // người trong tộc mang họ của tộc
    else if (role === 'Thánh tử' && sc) r.name = holyNpcName(sc.id, 'm') ?? r.name; // Thánh tử mang họ cố định của thánh địa
    suitors()[b.id] = r.id;
    names.push(`${r.name} (${role} ${force}, vì ${b.name})`);
  }
  if (names.length) { mark(`Tình địch xuất hiện: ${names.length} kẻ`); return `\n\nTin hôn ước được giữ lan ra, cũng là lúc những kẻ thầm yêu các nàng lộ mặt: ${names.join('; ')}. Từ nay họ là kẻ thù của ngươi.`; }
  return '';
}

const rv = () => pick(rivals());
const dr = (r: NPC) => r.r - effRi();

register([
  {
    id: 'su_chan',
    where: ['sect', 'town', 'market', 'road'],
    w: 6,
    cd: 3,
    cond: () => rivals().length > 0,
    title: 'Tình địch chặn đường',
    text: () => { const { r, bride } = rv(); s.flags._su = r.id; return `${r.name} đứng chắn giữa đường, tay vân vê chuôi kiếm. "Ngươi tưởng một tờ hôn thư là xứng với ${bride.name}? Ta theo nàng từ thuở nàng còn chưa biết chữ. Ngươi là cái gì?"`; },
    ch: () => {
      const r = findNpc(s.flags._su)!;
      const bride = kept().find((b) => suitors()[b.id] === r.id);
      const out: Choice[] = [
        { t: 'Nhận lời tỉ thí, đấu luận bàn', cls: 'prime', fn: () => battle({ name: r.name, r: r.r, st: r.st, el: r.el, kind: 'cultivator', mult: 1.1 }, { lethal: false,
          win: () => { relChange(r, -10); fame(20); if (bride) relChange(bride, 6); return `${r.name} lùi ba bước, mặt trắng bệch. Chuyện này lan tới tai ${bride?.name ?? 'nàng'}, nàng chỉ cười.`; },
          lose: () => { fame(-10); if (bride) relChange(bride, -3); return `Ngươi thua. ${r.name} phủi tay áo: "Về mà tu thêm trăm năm."`; } }) },
        { t: 'Bỏ ngoài tai, đi tiếp', fn: () => (ch(0.6) ? `Ngươi bước qua. Sau lưng, tiếng kiếm rút khỏi vỏ rồi lại tra vào.` : `${r.name} không để ngươi đi.` + battle({ name: r.name, r: r.r, st: r.st, el: r.el, kind: 'cultivator', mult: 1.1 }, { lethal: false, win: () => 'Hắn gục xuống, mắt vẫn trừng trừng nhìn ngươi.' })) },
      ];
      if (dr(r) <= -2) out.push({ t: 'Phóng uy áp đuổi đi', fn: () => { relChange(r, -5); return `Khí thế ${REALMS[effRi()].n} đè xuống, ${r.name} quỳ sụp. "Nhớ lấy: ta không giết ngươi vì nể ${bride?.name ?? 'nàng'}."`; } });
      return out;
    },
  },
  {
    id: 'su_amhai',
    where: ['wild', 'road', 'realm'],
    w: 4,
    cd: 6,
    cond: () => rivals().length > 0 && effRi() >= 2,
    title: 'Mai phục trong đêm',
    text: () => { const { r } = rv(); s.flags._su = r.id; return `Đêm ngủ lại ven đường, kiếm khí xé màn trướng. ${r.name} cùng hai sát thủ áo đen lao vào — lần này hắn không muốn luận bàn.`; },
    ch: () => {
      const r = findNpc(s.flags._su)!;
      const bride = kept().find((b) => suitors()[b.id] === r.id);
      return [
        { t: 'Nghênh chiến sinh tử', cls: 'danger', fn: () => battle({ name: r.name, r: r.r, st: r.st, el: r.el, kind: 'cultivator', mult: 1.2 }, { lethal: true,
          group: [{ name: 'Sát thủ áo đen', r: Math.max(1, r.r - 1), st: 1, kind: 'cultivator', el: 'am' }, { name: 'Sát thủ áo đen', r: Math.max(1, r.r - 1), st: 0, kind: 'cultivator', el: 'am' }],
          win: () => { r.alive = false; r.died = s.year; r.cause = `Bỏ mạng khi ám hại ${s.name}`; fame(40); if (bride) relChange(bride, 4); mark(`Giết tình địch ${r.name}`); return `${r.name} ngã xuống. Hai sát thủ bỏ chạy. ${bride ? `${bride.name} nghe tin, lặng đi rất lâu rồi nói: "Hắn tự chọn."` : ''}`; },
          flee: () => 'Ngươi thoát trong đêm, lưng còn vết kiếm.' }) },
        { t: 'Tung phù thoát thân', dis: !has('tranphap') && !s.bag.some((b) => b.id.startsWith('t:') && /thanhanh|dich|nadi/.test(b.id)), fn: () => { hurt(15); return 'Ánh phù lóe lên, ngươi biến mất trong sương. Sáng ra toàn thân ê ẩm.'; } },
      ];
    },
  },
  {
    id: 'su_tin',
    where: ['any'],
    w: 3,
    cd: 8,
    cond: () => rivals().length > 0,
    title: 'Lời ong tiếng ve',
    text: () => { const { r, bride } = rv(); s.flags._su = r.id; return `Có tin đồn khắp ${SECTS[bride.sect ?? '']?.n ?? 'thánh địa'}: ${r.name} nói ngươi chỉ là kẻ ăn bám, hôn ước với ${bride.name} là Diệp gia ép buộc.`; },
    ch: () => {
      const r = findNpc(s.flags._su)!;
      const bride = kept().find((b) => suitors()[b.id] === r.id);
      return [
        { t: 'Viết thư cho nàng, nói rõ lòng mình', cls: 'prime', fn: () => { if (bride) relChange(bride, 8); return `${bride?.name ?? 'Nàng'} hồi thư chỉ một dòng: "Ta tin ngươi, không tin lời đồn."`; } },
        { t: 'Mặc kệ, miệng đời ai cấm', fn: () => { fame(-5); if (bride) relChange(bride, -2); return 'Tin đồn lan thêm một dạo rồi lắng.'; } },
        { t: 'Tới tận nơi đối chất', fn: () => { fame(10); relChange(r, -8); return `Ngươi đứng giữa sảnh, nói rành rọt từng chuyện. ${r.name} đỏ mặt bỏ đi.`; } },
      ];
    },
  },
]);
