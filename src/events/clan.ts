// Sự kiện thế gia tu chân: thù địch, liên minh, tông môn bảo hộ, tranh ngôi gia chủ.
import { RMAX, effRi,
  register, s, M, money, cult, hurt, statUp, fame, good, evil, giveGear, gain, battle, cultivator, meet, he, ch, ri, pick,
  relChange, findNpc, mark, setFlag, flag, canPay, years, LOCS, SECTS, REALMS, here, contrib, type NPC, type Choice,
} from '../engine/api';
import { CLANS, clanRel, type Clan } from '../data/core';
import { canJoin, joinSect } from '../engine/sect';
import { wedDaolu } from '../engine/relationships';

const myClan = (): Clan | null => (s.flags.clan ? CLANS[s.flags.clan] : null);
const sur = (n: NPC) => n.name.split(' ').slice(0, -1).join(' ');
const clanOf = (n: NPC) => Object.values(CLANS).find((c) => c.sur === sur(n)) || null;
/** Kẻ thù từ thế gia đối địch, còn sống. */
const foeHeir = () => {
  const c = myClan();
  if (!c) return null;
  return s.npcs.find((n) => n.alive && n.tag === 'enemy' && c.foes.some((f) => CLANS[f].sur === sur(n))) || null;
};
const cousin = () => s.npcs.find((n) => n.alive && n.tag === 'rival' && myClan() && sur(n) === myClan()!.sur) || null;
const allyKid = () => {
  const c = myClan();
  if (!c) return null;
  return s.npcs.find((n) => n.alive && c.allies.some((a) => CLANS[a].sur === sur(n))) || null;
};
const nameNpcSur = (o: Parameters<typeof meet>[0], surname: string) => {
  const n = meet(o);
  n.name = surname + ' ' + n.name.split(' ').slice(-1)[0];
  return n;
};
void ri;

register([
  // ----- Thiếu chủ thế gia đối địch chặn đường -----
  {
    id: 'clan_ambush',
    where: ['road', 'town', 'wild', 'market'],
    w: 4,
    cd: 12,
    cond: () => !!foeHeir(),
    title: 'Oan gia ngõ hẹp',
    text: () => {
      const n = foeHeir()!;
      const fc = clanOf(n);
      return `${n.name} dẫn theo mấy gia nô chặn giữa đường, áo thêu gia huy ${fc ? fc.n : ''}. "${s.name}, ${myClan()!.sur} gia các ngươi còn nợ chúng ta một món nợ máu. Hôm nay trả một phần."`;
    },
    ch: () => {
      const n = foeHeir()!;
      return [
        {
          t: 'Rút kiếm nghênh chiến', cls: 'danger',
          fn: () => battle({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator', mult: 1.05 }, {
            lethal: n.r > effRi() + 1,
            win: () => { relChange(n, -10); fame(15); return `${n.name} ôm vết thương rút lui, quay đầu nghiến răng: "${myClan()!.sur} gia, chờ đó!"` + money(M(15)); },
            lose: () => `Ngươi bị đánh gục giữa đường. ${n.name} nhổ một bãi nước bọt rồi bỏ đi.` + hurt(20),
          }),
        },
        { t: 'Nhẫn nhịn, vòng đường khác', fn: () => { relChange(n, -5); return 'Ngươi không muốn đổ máu vì thù cũ của tổ tiên. Ngươi lùi lại; tiếng cười của bọn họ đuổi theo sau lưng.' + statUp('tam', 1); } },
        {
          t: 'Đề nghị hòa giải', hint: 'Cần Mị lực cao',
          fn: () => {
            if (ch(0.15 + s.stats.mi * 0.04)) {
              relChange(n, 40);
              n.tag = 'acq';
              good(2);
              return `Ngươi nói rằng mối thù trăm năm không phải của hai người. ${n.name} im lặng rất lâu rồi thu kiếm: "Hôm nay ta không thấy ngươi." Ít ra, giữa hai người đã có một kẽ hở.`;
            }
            return `${n.name} cười khẩy: "Hòa giải? Đi mà nói với bài vị tổ tông ta." Rồi bỏ đi.`;
          },
        },
      ];
    },
  },

  // ----- Đồng minh cầu viện -----
  {
    id: 'clan_ally_call',
    where: ['any'],
    w: 3,
    cd: 20,
    minR: 1,
    cond: () => !!myClan() && myClan()!.allies.length > 0,
    title: 'Thư cầu viện',
    text: () => {
      const c = myClan()!;
      const a = CLANS[s.flags._ally = pick(c.allies)];
      const f = a.foes.length ? CLANS[a.foes[0]] : null;
      return `Chim truyền tin của ${a.n} đáp xuống vai ngươi. Thư viết vội: ${f ? `${f.n} đang vây ép sản nghiệp của họ` : 'gia tộc gặp đại nạn'}, xin ${c.n} xuất người tương trợ theo minh ước.`;
    },
    ch: () => {
      const a = CLANS[s.flags._ally];
      const f = a.foes.length ? CLANS[a.foes[0]] : null;
      return [
        {
          t: 'Đích thân tới giúp', cls: 'prime',
          fn: () => battle(cultivator(`Cao thủ ${f ? f.n : 'kẻ địch'}`, 0, 1.05, f?.el[0]), {
            win: () => { setFlag('ally_' + a.id, (flag('ally_' + a.id) || 0) + 1); fame(20); good(1); const k = allyKid(); if (k) relChange(k, 15); return `Vòng vây tan. Gia chủ ${a.n} đích thân tiễn ngươi ra cổng, tặng hậu lễ.` + money(M(40)) + gain('p:' + (effRi() >= 2 ? 'ngungnguyen' : 'tukhi'), 2); },
            lose: () => `Ngươi không địch nổi. Đồng minh phải cắt đất cầu hòa, nhưng họ nhớ ngươi đã tới.` + hurt(15),
          }),
        },
        { t: `Gửi linh thạch thay người (${M(30)})`, dis: !canPay(M(30)), fn: () => { s.money -= M(30); return `${a.n} nhận được tiền, thuê thêm tán tu giữ thành. Thư cảm tạ gửi về lời lẽ có phần lạnh nhạt.`; } },
        { t: 'Làm ngơ', fn: () => { const k = allyKid(); if (k) relChange(k, -25); return `Ngươi đốt thư. Mấy tháng sau nghe tin ${a.n} tổn thất nặng. Minh ước giữa hai nhà rạn một đường.`; } },
      ];
    },
  },

  // ----- Tông môn bảo hộ triệu tập -----
  {
    id: 'clan_patron',
    where: ['town', 'village', 'market'],
    w: 5,
    once: true,
    maxR: 3,
    cond: () => !!myClan()?.patron && !s.sect && canJoin(myClan()!.patron!, true).ok,
    title: 'Sứ giả tông môn bảo hộ',
    text: () => {
      const c = myClan()!;
      const sc = SECTS[c.patron!];
      return `Một sứ giả ${sc.n} tới tổ trạch ${c.n}. Theo lệ thế gia phụ thuộc, mỗi đời phải tiến cử con cháu xuất sắc nhất vào tông. Gia chủ đặt lệnh bài tiến cử vào tay ngươi.`;
    },
    ch: () => {
      const c = myClan()!;
      const sc = SECTS[c.patron!];
      return [
        { t: `Theo sứ giả về ${sc.n}`, cls: 'prime', fn: () => joinSect(c.patron!) + ` Đệ tử ${c.n} trong tông vây quanh chào hỏi — ở đây ngươi không đơn độc.` },
        { t: 'Từ chối, muốn tự chọn đường', fn: () => `Gia chủ nhíu mày nhưng không ép. "Lệnh bài cứ giữ. Khi nào nghĩ lại thì tự mang tới ${sc.n}."` },
      ];
    },
  },

  // ----- Tranh ngôi gia chủ -----
  {
    id: 'clan_succession',
    where: ['town', 'village', 'any'],
    w: 6,
    minR: 3,
    once: true,
    cond: () => !!myClan() && !flag('clanHead'),
    title: 'Tranh ngôi gia chủ',
    text: () => {
      const c = myClan()!;
      const r = cousin();
      return `Gia chủ ${c.n} tọa hóa. Theo tổ huấn, ngôi gia chủ thuộc về người mạnh nhất trong hàng đích hệ.${r ? ` Đối thủ của ngươi là ${r.name}, ${REALMS[r.r].n} — người đã ganh với ngươi từ thuở nhỏ.` : ''} Các trưởng lão chia làm hai phe.`;
    },
    ch: () => {
      const c = myClan()!;
      const r = cousin();
      const head = () => { setFlag('clanHead'); mark(`Kế vị gia chủ ${c.n}`); fame(60); return ` Ngươi ngồi lên ghế gia chủ ${c.n}. Từ nay mỗi lần về tổ trạch, kho tộc mở cho ngươi.` + money(M(150)); };
      const out: Choice[] = [];
      if (r) out.push({
        t: `Tỷ thí với ${r.name} trước tổ đường`, cls: 'prime',
        fn: () => battle({ name: r.name, r: r.r, st: r.st, el: r.el, kind: 'cultivator' }, {
          lethal: false,
          win: () => { relChange(r, -20); return `${r.name} quỳ một gối, cắn môi đến bật máu.` + head(); },
          lose: () => { setFlag('clanHead', false); return `${r.name} thắng. Ngươi trở thành trưởng lão, thấp hơn người mình coi thường một bậc.` + statUp('tam', 1); },
        }),
      });
      else out.push({ t: 'Nhận ngôi gia chủ', cls: 'prime', fn: () => 'Không còn ai đủ sức tranh với ngươi.' + head() });
      out.push({ t: 'Nhường ngôi, chuyên tâm tu đạo', fn: () => { if (r) relChange(r, 30); good(2); return 'Ngươi từ chối. Ghế gia chủ là xiềng xích; tiên lộ còn dài.' + statUp('tam', 2) + cult(30); } });
      return out;
    },
  },

  // ----- Hôn ước liên minh -----
  {
    id: 'clan_marriage',
    where: ['town', 'village', 'market', 'sect'],
    w: 4,
    once: true,
    minAge: 16,
    cond: () => !!allyKid(),
    title: 'Hôn ước giữa hai nhà',
    text: () => {
      const k = allyKid()!;
      return `Trưởng bối hai nhà nhắc lại hôn ước năm xưa giữa ngươi và ${k.name}. Thiệp đỏ đã viết sẵn — chỉ chờ một cái gật đầu. ${k.name} đứng sau rèm, không nói gì.`;
    },
    ch: () => {
      const k = allyKid()!;
      const kc = clanOf(k);
      return [
        {
          t: 'Đồng ý kết thân', cls: 'prime',
          fn: () => {
            if (k.rel >= 30 || ch(0.5)) {
              wedDaolu(k);
              k.rel = Math.max(k.rel, 80);
              mark(`Thành thân với ${k.name}, liên kết ${myClan()!.n} và ${kc?.n || ''}`);
              return `Pháo hoa nổ trên hai tổ trạch. ${k.name} vén khăn, khẽ cười: "Hóa ra là ngươi thật." Từ nay hai nhà là một.` + money(M(60));
            }
            relChange(k, -15);
            return `Ngày cưới, ${k.name} biến mất, để lại một lá thư: "Ta không muốn sống theo ý người khác." Hai nhà xấu hổ, minh ước lung lay.`;
          },
        },
        { t: 'Từ chối', fn: () => { relChange(k, -10); return `Ngươi thoái hôn. Trưởng bối ${kc?.n || 'nhà bên'} giận tím mặt, nhưng ${k.name} gửi tới một mảnh giấy: "Cảm ơn."`; } },
      ];
    },
  },

  // ----- Chiến tranh thế gia (chuỗi) -----
  {
    id: 'clan_war',
    where: ['any'],
    w: 3,
    minR: 2,
    cd: 40,
    cond: () => !!myClan() && myClan()!.foes.length > 0,
    title: 'Thế gia khai chiến',
    text: () => {
      const c = myClan()!;
      const f = CLANS[c.foes[0]];
      return `Tin dữ: ${f.n} bất ngờ đánh vào sản nghiệp của ${c.n}. ${c.feud} Nay rốt cuộc nổ ra thành chiến tranh. Gia tộc triệu tập mọi con cháu.`;
    },
    ch: () => {
      const c = myClan()!;
      const f = CLANS[c.foes[0]];
      return [
        {
          t: 'Về tổ trạch tham chiến', cls: 'danger',
          fn: () => {
            s.loc = c.seat;
            const r1 = battle(cultivator(`Trưởng lão ${f.n}`, 0, 1.1, f.el[0]));
            if (s.hurt >= 90 || s.dead) return r1;
            return {
              text: r1 + `\n\nTrận đầu qua đi. Đêm đó, có tin ${f.n} mời lão tổ ra tay${f.patron ? `, ${SECTS[f.patron].n} đứng sau ủng hộ` : ''}.`,
              choices: [
                {
                  t: 'Đánh úp tổ trạch đối phương', cls: 'danger',
                  fn: () => battle(cultivator(`Gia chủ ${f.n}`, 1, 1, f.el[0]), {
                    win: () => { setFlag('clanWarWon'); fame(80); mark(`Đánh bại ${f.n} trong chiến tranh thế gia`); const h = s.npcs.find((n) => n.alive && sur(n) === f.sur && n.tag === 'enemy'); if (h) relChange(h, -30); return `Tổ trạch ${f.n} cháy đỏ trời. Họ phải cắt mạch linh thạch cầu hòa.` + money(M(200)) + giveGear(effRi(), 2); },
                    lose: () => `Ngươi bị đánh lui. ${c.n} buộc phải nhượng một nửa sản nghiệp.` + hurt(25),
                  }),
                },
                {
                  t: 'Cầu tông môn bảo hộ phân xử',
                  dis: !c.patron,
                  hint: c.patron ? SECTS[c.patron].n : 'Gia tộc ngươi không có tông môn bảo hộ',
                  fn: () => `${SECTS[c.patron!].n} cử trưởng lão xuống, ép hai nhà đình chiến. Không ai thắng, nhưng không ai chết thêm. Đổi lại, ${c.n} phải cống nạp gấp đôi trong mười năm.` + (s.sect?.id === c.patron ? contrib(-20) : ''),
                },
                { t: 'Thủ vững chờ thời', fn: () => 'Hai nhà giằng co ba năm rồi tự đình chiến vì kiệt quệ. Mối thù lại chìm xuống, chờ đời sau.' + statUp('tam', 1) },
              ],
            };
          },
        },
        { t: 'Ở lại tu luyện, mặc kệ', fn: () => { evil(1); return `Ngươi không về. Gia tộc thắng hay thua, ngươi chỉ nghe kể lại. Trong tộc bắt đầu có người gọi ngươi là kẻ phản tổ.`; } },
      ];
    },
  },

  // ----- Bí mật của Mộ Dung gia -----
  {
    id: 'clan_secret',
    where: ['town', 'market', 'road'],
    w: 2,
    minR: 2,
    once: true,
    cond: () => !!CLANS.mudung.secret && s.flags.clan !== undefined,
    reg: ['tayluong'],
    title: 'Chuyến hàng đêm',
    text: () => 'Nửa đêm ngoài Hoàng Sa Trấn, ngươi thấy đoàn lạc đà treo cờ Mộ Dung gia lặng lẽ giao mấy rương sắt cho người áo đỏ thẫm — tu sĩ Huyết Sát Điện. Trong rương có tiếng rên khe khẽ.',
    ch: () => {
      const mine = s.flags.clan === 'mudung';
      return [
        {
          t: 'Chặn đoàn hàng, cứu người', cls: 'danger',
          fn: () => battle(cultivator('Hộ pháp Huyết Sát Điện', 0, 1.1, 'am'), {
            win: () => { good(4); fame(40); if (mine) setFlag('clanTraitor'); return `Trong rương là những đứa trẻ có linh căn bị bắt cóc. Tin này mà lộ, ${mine ? 'chính gia tộc ngươi' : 'Mộ Dung gia'} sẽ bị cả chính đạo vây đánh.` + (mine ? ' Ngươi biết từ nay mình đứng ở đâu.' : ''); },
          }),
        },
        { t: mine ? 'Giả vờ không thấy — chuyện nhà' : 'Bán tin cho Đoan Mộc gia', fn: () => (mine ? (evil(2), 'Ngươi quay đi. Có những bí mật giữ gia tộc đứng vững... và có những bí mật làm nó mục từ bên trong.') : (fame(10), 'Đoan Mộc gia trả hậu cho tin này. Thương lộ Tây Lương sắp có biến.' + money(M(80)))) },
        { t: 'Lặng lẽ rời đi', fn: () => 'Có những chuyện biết rồi thì không ngủ yên được. Ngươi cố quên.' },
      ];
    },
  },

  // ----- Về tổ trạch -----
  {
    id: 'clan_home',
    where: ['town', 'village', 'market'],
    w: 8,
    cd: 10,
    cond: () => !!myClan() && here().id === myClan()!.seat,
    title: 'Về tổ trạch',
    text: () => {
      const c = myClan()!;
      return `Cổng son ${c.n} mở rộng. ${flag('clanHead') ? 'Gia nhân quỳ đón gia chủ trở về.' : 'Trưởng lão quản khố gật đầu với ngươi.'} Theo lệ, con cháu có công được nhận bổng lộc từ kho tộc.`;
    },
    ch: () => {
      const head = !!flag('clanHead');
      return [
        { t: 'Nhận bổng lộc', cls: 'prime', fn: () => 'Kho tộc mở cửa.' + money(M(head ? 80 : 30)) + gain('p:' + (effRi() >= 3 ? 'hoanguyen' : effRi() >= 2 ? 'ngungnguyen' : 'tukhi'), head ? 3 : 1) },
        { t: 'Vào từ đường bế quan', fn: () => { years(REALMS[effRi()].turn); return 'Từ đường xây trên linh mạch của tộc, linh khí dày đặc.' + cult(head ? 60 : 35); } },
        { t: 'Dạy dỗ con cháu trong tộc', fn: () => { good(1); fame(5); return 'Ngươi chỉ điểm cho đám nhỏ trong tộc. Mấy đứa nhìn ngươi như nhìn thần tượng.' + (ch(0.3) ? statUp('ngo', 1) : ''); } },
      ];
    },
  },

  // ----- Người ngoài bị cuốn vào mối thù -----
  {
    id: 'clan_bystander',
    where: ['town', 'market'],
    w: 3,
    cd: 15,
    minR: 1,
    cond: () => !s.flags.clan,
    title: 'Hai nhà tranh chấp',
    text: () => {
      const a = CLANS[s.flags._ca = pick(Object.keys(CLANS))];
      const b = CLANS[s.flags._cb = pick(a.foes)];
      return `Giữa phố, con cháu ${a.n} và ${b.n} đang rút kiếm đối mặt. ${a.feud} Thấy ngươi, cả hai bên đều muốn kéo ngươi về phe mình.`;
    },
    ch: () => {
      const a = CLANS[s.flags._ca];
      const b = CLANS[s.flags._cb];
      const side = (w: Clan, l: Clan): Choice => ({
        t: `Giúp ${w.n}`,
        fn: () => battle(cultivator(`Con cháu ${l.n}`, 0, 1, l.el[0]), {
          lethal: false,
          win: () => { const n = nameNpcSur({ dr: 0, tag: 'friend', rel: 45, el: w.el[0], how: `Con cháu ${w.n}, nợ ngươi một ân tình` }, w.sur); const e = nameNpcSur({ dr: 0, tag: 'enemy', rel: -40, el: l.el[0], how: `Con cháu ${l.n}, bị ngươi làm nhục giữa phố` }, l.sur); return `${n.name} chắp tay: "${w.n} sẽ nhớ ơn này." Còn ${e.name} thì nhớ mặt ngươi.` + money(M(20)); },
        }),
      });
      return [side(a, b), side(b, a), { t: 'Đứng ngoài', fn: () => 'Thù nhà người ta, dính vào làm gì. Ngươi bỏ đi trước khi máu đổ.' }];
    },
  },

  // ----- Lão tổ xuất quan -----
  {
    id: 'clan_ancestor',
    where: ['any'],
    w: 2,
    once: true,
    minR: 2,
    cond: () => !!myClan() && s.npcs.some((n) => n.alive && n.tag === 'kin' && n.r >= 3 && n.how.startsWith('Lão tổ')),
    title: 'Lão tổ xuất quan',
    text: () => {
      const a = s.npcs.find((n) => n.alive && n.tag === 'kin' && n.how.startsWith('Lão tổ'))!;
      return `${a.name}, lão tổ ${myClan()!.n}, phá quan sau trăm năm. Lão gọi riêng ngươi tới, quan sát rất lâu: "Trong đám con cháu, chỉ có ngươi làm ta nhớ tới mình thời trẻ."`;
    },
    ch: () => {
      const a = s.npcs.find((n) => n.alive && n.tag === 'kin' && n.how.startsWith('Lão tổ'))!;
      return [
        { t: 'Xin lão tổ truyền đạo', cls: 'prime', fn: () => { relChange(a, 20); a.tag = 'master'; s.flags.masterPick = a.id; return `${a.name} truyền cho ngươi tâm đắc cả đời. Từ nay lão là sư phụ của ngươi.` + cult(60) + statUp('ngo', 1); } },
        { t: 'Xin bảo vật hộ thân', fn: () => `Lão tổ cười, tháo chiếc nhẫn trên tay ném cho ngươi.` + giveGear(Math.min(RMAX(), effRi() + 1), 2, 3) },
      ];
    },
  },
]);

void [hurt, he, findNpc, LOCS, clanRel];
