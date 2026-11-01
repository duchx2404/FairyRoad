// Hoàng triều: yết kiến, phong chức, bổng lộc, việc triều đình.
import { RMAX, REALMS } from '../data/core';
import { EMPIRES, EMPIRE_GUARD, COURT_RANKS, courtReq, type Empire } from '../data/world';
import { s } from './state';
import { effRi, M, age, has, addItem, itemName } from './char';
import { passTime, mark, addLog, mkNpc, mkName, addNpc, holyNpcName } from './core';
import { slots } from './slots';
import { fight, fightSummary, beastFoe, dangerLabel, type FoeSpec } from './combat';
import { ch, pick, ri, fmt } from '../core/util';
import { SECTS } from '../data/world';
import { mkBrideBio, addBetrothal } from './bride';
import type { Scene } from './actions';
import type { Choice, Outcome } from './events';

export interface CourtPost { id: string; rank: number; favor: number; lastPay: number }
export const myCourt = (): CourtPost | null => s.flags.court || null;
export const courtTitle = () => { const c = myCourt(); return c ? `${COURT_RANKS[c.rank]} ${EMPIRES[c.id].n}` : ''; };

/** Yết kiến: mỗi năm một lần. Người chơi chọn cách ứng xử trước bệ rồng; mỗi cách một phần thưởng khác nhau,
 *  và có thể dẫn tới ban hôn (công chúa / hoàng tử của vương triều, hoặc thánh nữ / thánh tử của tông môn hậu thuẫn). */
export function audience(e: Empire): Scene {
  const y = Math.floor(s.year);
  passTime(1 / 12);
  s.flags.audYear = { ...(s.flags.audYear || {}), [e.id]: y };
  const c = myCourt();
  const mine = c?.id === e.id;
  const guard = EMPIRE_GUARD[e.tier];
  const high = effRi() >= guard;
  const gift = M(10 * e.tier * (mine ? 2 : 1));
  const favor = (n: number) => { if (!mine || !c) return ''; c.favor = Math.max(0, c.favor + n); return ` (ân sủng ${n >= 0 ? '+' : ''}${n})`; };
  const pat = e.patron ? SECTS[e.patron] : null;
  const spec: FoeSpec = { name: pick(SECRET), r: Math.min(RMAX(), Math.max(1, guard - 2 + (ch(0.5) ? 1 : 0))), kind: 'cultivator', mult: 1.05 };
  const text = `${e.ruler} ${e.n} tiếp ngươi ở điện bên. ${high ? 'Người đứng dậy đón, giọng kính cẩn như với bậc tiền bối.' : 'Ánh mắt dò xét, nhưng lời lẽ khách sáo.'}${pat ? ` Quốc sư — một trưởng lão của ${pat.n} — đứng hầu bên cạnh.` : ''} Hàn huyên vài câu, ${e.ruler} hỏi ngươi lần này tới triều có việc gì.`;
  const choices: Choice[] = [
    {
      t: 'Chỉ tới vấn an, nhận lễ vật rồi lui', hint: `${fmt(gift)} linh thạch · danh vọng`,
      fn: () => { s.money += gift; s.fame += 2 * e.tier; return withOffer(e, `Lúc lui ra, nội thị dâng một mâm lễ vật (${fmt(gift)} linh thạch).${favor(3)}`, 0.1); },
    },
    {
      t: `Luận đạo trị quốc với ${e.ruler}`, hint: 'tùy Ngộ tính, Mị lực · ân sủng, danh vọng, lễ vật gấp đôi',
      fn: () => {
        if (ch(0.2 + s.stats.ngo * 0.06 + s.stats.mi * 0.03 + (high ? 0.2 : 0))) {
          const g2 = gift * 2;
          s.money += g2; s.fame += 5 * e.tier;
          return withOffer(e, `Ngươi nói trị nước như trị thân: khí huyết phải thông, kinh mạch không được nghẽn, một châu bị bỏ đói thì cả nước sinh bệnh. ${e.ruler} vỗ án: "Hay!" — rồi sai nội thị dâng gấp đôi lễ vật (${fmt(g2)} linh thạch).${favor(10)}${statUp(e)}`, 0.3);
        }
        s.money += gift; s.fame += e.tier;
        return `Ngươi nói chưa hết nửa thì ${e.ruler} đã kín đáo che miệng ngáp. Quần thần nhìn nhau. Lễ vật vẫn đủ lệ (${fmt(gift)} linh thạch), nhưng không ai mời ngươi ở lại dùng cơm.${favor(-2)}`;
      },
    },
    {
      t: 'Thi triển thần thông trước bệ rồng', hint: high ? 'cảnh giới vượt hộ quốc lão tổ · uy chấn cả triều' : `dưới ${REALMS[guard].n} dễ bị xem là múa rìu qua mắt thợ`,
      fn: () => {
        if (high) {
          const g3 = gift * 3;
          s.money += g3; s.fame += 12 * e.tier;
          return withOffer(e, `Linh áp ${REALMS[effRi()].n} lan ra, đèn nến trên điện tắt phụt rồi bùng lên ánh xanh. Cả triều quỳ rạp, hộ quốc lão tổ sau rèm cũng phải bước ra thi lễ. ${e.ruler} tự tay rót rượu mời ngươi, ban lễ vật gấp ba (${fmt(g3)} linh thạch).${favor(15)}`, 0.5);
        }
        if (guard - effRi() <= 1) {
          s.money += gift; s.fame += 4 * e.tier;
          return withOffer(e, `Kiếm quang xé ngang điện, cắt đôi cột khói trầm mà không chạm tới một sợi lụa. Sau rèm, hộ quốc lão tổ khẽ "ừm" một tiếng — xem như công nhận. Lễ vật đủ lệ (${fmt(gift)} linh thạch).${favor(5)}`, 0.2);
        }
        const g4 = Math.round(gift / 2);
        s.money += g4; s.fame -= 2 * e.tier;
        return `Ngươi vừa vận công, sau rèm đã vang tiếng cười khẽ của hộ quốc lão tổ. ${e.ruler} phẩy tay: "Thôi." Lễ vật bị bớt đi một nửa (${fmt(g4)} linh thạch), ngươi lui ra trong ánh mắt chế giễu của quần thần.${favor(-8)}`;
      },
    },
    {
      t: `Xin nhận mật lệnh của ${e.ruler}`, hint: `một trận ${dangerLabel(spec)} · thưởng lớn, ân sủng, dễ được ban hôn`,
      fn: () => {
        passTime(0.25);
        const r = fight(spec, { lethal: false });
        if (r.win) {
          const pay = M(30 * e.tier);
          s.money += pay; s.fame += 8 * e.tier;
          return withOffer(e, `Mật lệnh: ${spec.name.toLowerCase()}. ${fightSummary(r)} Việc thành, ${e.ruler} ban thưởng ${fmt(pay)} linh thạch.${favor(15)}`, 0.55);
        }
        return `Mật lệnh: ${spec.name.toLowerCase()}. ${fightSummary(r)} Việc không thành, ${e.ruler} không trách, nhưng cũng không ban gì.${favor(-5)}`;
      },
    },
  ];
  return { title: `Yết kiến ${e.ruler}`, text, choices, kind: 'event' };
}
const SECRET = ['Thích khách ẩn trong hậu cung', 'Phản thần trốn ra biên ải', 'Tà tu quấy long mạch kinh đô', 'Gián điệp nước địch giả làm sứ thần', 'Yêu tu đội lốt quan lại'];
/** Luận đạo thành công: mỗi vương triều chỉ khai mở Ngộ tính một lần. */
const statUp = (e: Empire) => { const d = (s.flags.audNgo ||= {}) as Record<string, boolean>; if (d[e.id]) return ''; d[e.id] = true; s.stats.ngo += 1; return ' (Ngộ tính +1)'; };
const gain = (id: string, n: number) => (addItem(id, n) ? ` Nhận được ${itemName(id)} ×${n}.` : ` (Túi đồ đã đầy, đành bỏ lại ${itemName(id)}.)`);

/** Ban hôn: mỗi vương triều một lần, cần 14 tuổi, chưa có đạo lữ (trừ thiên phú Đào hoa).
 *  Vương triều chỉ ban hôn con cháu hoàng tộc (công chúa / hoàng tử). Nếu có tông môn hậu thuẫn, có tỉ lệ
 *  công chúa ấy được gửi vào tông từ nhỏ và chính là Thánh nữ / Thánh tử của tông — khi đó mang cả hai thân phận. */
function withOffer(e: Empire, pre: string, p: number): Outcome {
  const done = (s.flags.audWed ||= {}) as Record<string, boolean>;
  if (done[e.id] || age() < 14 || !ch(p)) return pre;
  done[e.id] = true;
  const g = s.g === 'm' ? 'f' : 'm';
  const pat = e.patron ? SECTS[e.patron] : null;
  const holy = !!pat && ch(0.4); // công chúa đồng thời là thánh nữ của tông môn hậu thuẫn
  const role = g === 'f' ? 'Công chúa' : 'Hoàng tử';
  const holyRole = g === 'f' ? 'Thánh nữ' : 'Thánh tử';
  const force = e.n;
  const a = Math.max(14, Math.round(age()) + ri(-3, 3));
  const n = mkNpc({
    g, r: Math.max(1, Math.min(EMPIRE_GUARD[e.tier] - 1, effRi() + (ch(holy ? 0.7 : 0.5) ? 1 : 0))), st: ri(0, 2), tag: 'friend', rel: 40, age: a, talent: (holy ? 1.6 : 1.4) + Math.random() * 0.4, sect: holy ? pat!.id : null,
    how: holy ? `${role} ${force}, cũng là ${holyRole} ${pat!.n} — ${e.ruler} ban hôn` : `${role} ${force} — ${e.ruler} ban hôn`,
  });
  n.name = (holy ? holyNpcName(pat!.id, g) : undefined) ?? mkName(g); // kiêm Thánh nữ / Thánh tử: mang họ cố định của thánh địa
  n.bio = mkBrideBio('royal', g);
  if (holy) n.bio.family = `${n.bio.family} — gửi vào ${pat!.n} tu luyện từ nhỏ, nay là ${holyRole} của tông`;
  n.el = n.bio.els![0];
  n.pic = holy && pat!.tier === 4 && g === 'f' ? 'sn_' + pat!.id : `npc_${g}${n.r <= 2 ? 1 : 2}`;
  const nang = g === 'f' ? 'nàng' : 'chàng';
  const fam = n.bio.family!.charAt(0).toLowerCase() + n.bio.family!.slice(1); // chỉ hạ chữ đầu, giữ hoa tên tông môn
  const ask = holy
    ? `${e.ruler} ngẫm nghĩ hồi lâu rồi nói: "Trẫm có một ${role.toLowerCase()} tên ${n.name}, ${fam}. Trẫm muốn ban hôn, kết ${e.n} với ngươi làm một nhà." Quốc sư — trưởng lão ${pat!.n} — đứng bên cũng chắp tay: "Tông môn không có ý khác."`
    : `${e.ruler} ngẫm nghĩ hồi lâu rồi nói: "Trẫm có một ${role.toLowerCase()} tên ${n.name}, ${fam}. Trẫm muốn ban hôn, kết ${e.n} với ngươi làm một nhà. Ý ngươi thế nào?"`;
  const b = n.bio;
  const info = [
    `Tuổi: ${Math.floor(s.year - n.born)} · Cảnh giới: ${REALMS[n.r].n}`,
    `Ngoại hình: ${b.look}`,
    `Tính cách: ${b.traits}${b.hobby ? ` · Sở thích: ${b.hobby}` : ''}`,
    `Linh căn: ${b.root} · Thể chất: ${b.body} · Thiên phú: ${b.perk}`,
  ];
  return {
    text: [pre, ask, ...info].join('\n\n').replace(/\n\n(Ngoại hình|Tính cách|Linh căn)/g, '\n$1'),
    choices: [
      {
        t: 'Nhận hôn ước', cls: 'prime', hint: `${role} ${n.name} thành vị hôn ${g === 'f' ? 'thê' : 'phu'} · luôn chịu đi theo làm đồng hành · ân sủng, danh vọng`,
        fn: () => {
          addNpc(n);
          addBetrothal(n, `${e.ruler} ${e.n} ban hôn`);
          const c = myCourt(); if (c && c.id === e.id) c.favor += 20;
          s.fame += 10 * e.tier;
          const extra = M(20 * e.tier); s.money += extra;
          return `Ngươi quỳ xuống tạ ơn. Hôn thư được viết ngay trên điện, đóng ngọc tỉ. ${n.name} được gọi tới ra mắt: ${nang} cúi đầu thi lễ, ${g === 'f' ? 'má ửng hồng' : 'ánh mắt thẳng và sáng'}, không nói một lời — nhưng lúc ngẩng lên thì nhìn ngươi rất lâu. ${force} gửi sính lễ ${fmt(extra)} linh thạch. Từ nay ${nang} là người có hôn ước với ngươi, có thể mời đi cùng trong Nhân mạch.`;
        },
      },
      {
        t: 'Xin đổi hôn sự lấy một món trọng bảo', hint: 'danh vọng, linh thạch, đan dược',
        fn: () => {
          const extra = M(40 * e.tier); s.money += extra; s.fame += 3 * e.tier;
          return `Ngươi chắp tay: "Duyên phận chưa tới, xin ${e.ruler} đừng ép." ${e.ruler} cười, không giận, sai mở quốc khố thay lễ (${fmt(extra)} linh thạch).` + gain('p:' + (effRi() >= 2 ? 'ngungnguyen' : 'tukhi'), 2);
        },
      },
      {
        t: 'Khéo léo từ chối', hint: 'không mất gì, ân sủng giảm nhẹ',
        fn: () => { const c = myCourt(); if (c && c.id === e.id) c.favor = Math.max(0, c.favor - 5); return `Ngươi cúi đầu: "Trong lòng đã có người, không dám phụ ${role.toLowerCase()}." ${e.ruler} im lặng một lát rồi gật đầu. Chuyện này không ai nhắc lại.`; },
      },
    ],
  };
}

export function canTakePost(e: Empire, rank: number): string | null {
  const c = myCourt();
  if (c && c.id !== e.id) return `Ngươi đang nhận chức ở ${EMPIRES[c.id].n}.`;
  if (c && c.rank >= rank) return 'Đã nhận chức này.';
  if (c && rank > c.rank + 1) return `Phải làm ${COURT_RANKS[rank - 1]} trước.`;
  if (!c && rank > 0) return `Phải bắt đầu từ ${COURT_RANKS[0]}.`;
  const need = courtReq(rank, e.tier);
  if (effRi() < need) return `Cần ${REALMS[need].n}.`;
  if (c && rank > 0 && c.favor < rank * 40) return `Cần ân sủng ${rank * 40} (hiện ${c.favor}).`;
  return null;
}
export function takePost(e: Empire, rank: number): string {
  const err = canTakePost(e, rank);
  if (err) return err;
  const c = myCourt();
  if (c) c.rank = rank; else s.flags.court = { id: e.id, rank, favor: 10, lastPay: Math.floor(s.year) };
  s.fame += 20 * e.tier * (rank + 1);
  mark(`Được ${e.n} phong làm ${COURT_RANKS[rank]}`);
  return `Thánh chỉ ban xuống: phong ngươi làm ${COURT_RANKS[rank]} của ${e.n}. Từ nay mỗi năm được hưởng bổng lộc triều đình.`;
}
export function resignPost(): string {
  const c = myCourt();
  if (!c) return '';
  s.flags.court = null;
  mark(`Từ quan khỏi ${EMPIRES[c.id].n}`);
  return 'Ngươi dâng sớ từ quan, trả lại ấn tín.';
}
/** Bổng lộc hằng năm (gọi từ passTime). */
export function courtPay() {
  const c = myCourt();
  if (!c) return;
  const yrs = Math.floor(s.year) - c.lastPay;
  if (yrs < 1) return;
  const e = EMPIRES[c.id];
  const pay = Math.round([8, 20, 60][c.rank] * e.tier * Math.pow(2, Math.max(0, effRi() - 1)) * yrs);
  s.money += pay;
  c.lastPay = Math.floor(s.year);
  addLog(`Bổng lộc ${COURT_RANKS[c.rank]} ${e.n}: ${fmt(pay)} linh thạch.`);
}
slots.courtPay = courtPay;

const TASKS = ['Trấn áp yêu thú phá biên ải', 'Dẹp loạn tà tu ở châu huyện', 'Hộ giá hoàng tộc đi tuần du', 'Truy bắt gián điệp nước địch', 'Trấn thủ long mạch kinh đô'];
export function courtTask(e: Empire): Scene {
  const name = pick(TASKS);
  passTime(Math.max(0.25, REALMS[s.r].turn * 0.6));
  const lv = Math.min(RMAX(), Math.max(0, EMPIRE_GUARD[e.tier] - 2 + (ch(0.5) ? 1 : 0)));
  const r = name.includes('yêu') ? fight(beastFoe(lv).spec) : fight({ name: name.includes('gián điệp') ? 'Gián điệp nước địch' : name.includes('tà tu') ? 'Thủ lĩnh tà tu' : 'Thích khách', r: lv, kind: 'cultivator', mult: 1.05 });
  const c = myCourt();
  if (r.win) {
    const pay = M(25 * e.tier);
    s.money += pay;
    s.fame += 5 * e.tier;
    if (c?.id === e.id) c.favor += 12;
    return { title: name, text: `${fightSummary(r)} Việc thành, triều đình ban thưởng ${fmt(pay)} linh thạch${c?.id === e.id ? ', ân sủng +12' : ''}.` };
  }
  if (c?.id === e.id) c.favor = Math.max(0, c.favor - 5);
  return { title: name, text: `${fightSummary(r)} Việc không thành.` };
}
