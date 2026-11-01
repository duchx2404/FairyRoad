// Sự kiện đời sống: tông môn, nhân mạch, bế quan, đại sự thế giới cho cảnh giới cao.
//
// Quy ước chọn NPC: chọn trong text() và lưu id vào s.flags._evNpc; ch() đọc lại bằng the(F).
// Tiêu đề không phụ thuộc NPC (title() được gọi trước text()).
import { RMAX, effRi,
  register, s, M, gain, money, cult, hurt, heal, statUp, tamma, fame, good, evil, learnTech, learnSkill, giveGear,
  fight, fightSummary, cultivator, meet, he, npcTitle, relChange, findNpc, daolu, master, mark, addLog, setFlag, flag,
  canPay, hasItem, lose, inSect, sectName, contrib, here, realmN, lifeAdd, years, stat, root,
  ch, ri, rf, pick, fmt, clamp, REALMS, SECTS, TECHS, SKILLS,
  type NPC, type FoeSpec, type FightOpts, type Choice, type Outcome,
} from '../engine/api';
import { canJoin, joinSect, expel, rankName } from '../engine/sect';
import { wedDaolu } from '../engine/relationships';
import { meta } from '../engine/state';
import { MALE, FEM, DAO_HAO, BREAK_PILL, EL, npcCap } from '../data/core';
import { RK } from '../data/world';
import { HERBS } from '../data/items';

// ---------------------------------------------------------------- helper

type NF = (n: NPC) => boolean;
const EVK = '_evNpc';
const live = (f: NF) => s.npcs.filter((n) => n.alive && f(n));
const exists = (f: NF) => s.npcs.some((n) => n.alive && f(n));
/** Chọn một NPC hợp điều kiện, ghi nhớ cho ch(). */
function choose(f: NF): NPC {
  const n = pick(live(f));
  s.flags[EVK] = n.id;
  return n;
}
/** Chọn, hoặc tạo mới nếu không có ai hợp. */
function chooseOr(f: NF, mk: () => NPC): NPC {
  const l = live(f);
  const n = l.length ? pick(l) : mk();
  s.flags[EVK] = n.id;
  return n;
}
/** Lấy lại NPC đã chọn trong text(). */
function the(f: NF): NPC {
  const n = findNpc(s.flags[EVK]);
  return n && n.alive && f(n) ? n : choose(f);
}
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const He = (n: NPC) => cap(he(n));
const sh = (n: NPC) => (n.g === 'm' ? 'sư huynh' : 'sư tỷ');
const sd = (n: NPC) => (n.g === 'm' ? 'sư đệ' : 'sư muội');
const npcAge = (n: NPC) => Math.floor(s.year - n.born);
const foeOf = (n: NPC, mult = 1): FoeSpec => ({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator', mult });

/** Đánh và trả kết quả gọn. */
function duel(spec: FoeSpec, o: FightOpts = {}) {
  const r = fight(spec, o);
  return { t: fightSummary(r), win: r.win, fled: r.fled, died: r.died };
}
function killNpc(n: NPC, cause: string, byMe = false) {
  n.alive = false;
  n.died = s.year;
  n.cause = cause;
  if (byMe) ((s.flags.lifeSlain ||= []) as { name: string; y: number; done?: boolean }[]).push({ name: n.name, y: s.year });
  if (n.tag === 'daolu' && !daolu()) s.flags.daolu_bonus = false;
}

// tông môn
const atHome = () => !!s.sect && here().sect === s.sect.id;
const hostId = () => here().sect || '';
const visiting = () => here().type === 'sect' && !!here().sect && !(s.sect && s.sect.id === here().sect);
const mySect = () => SECTS[s.sect!.id];
const sameSect: NF = (n) => !!s.sect && n.sect === s.sect.id;
function sectHead(id = s.sect!.id): string {
  const k = 'life_head_' + id;
  if (!s.flags[k]) s.flags[k] = `${pick(DAO_HAO)} ${SECTS[id].evil ? 'Ma Tôn' : 'Chân Nhân'}`;
  return s.flags[k];
}
/** Trưởng lão cố định của tông (NPC thật trong nhân mạch). */
function sectElder(): NPC {
  const k = 'life_elder_' + s.sect!.id;
  const old = findNpc(s.flags[k]);
  if (old && old.alive) return old;
  const n = meet({ r: clamp(Math.max(effRi() + 2, mySect().tier + 1), 1, 8), sect: s.sect!.id, tag: 'senior', rel: 10, how: `Trưởng lão ${mySect().n}` });
  s.flags[k] = n.id;
  return n;
}
function payContrib(n: number): boolean {
  if (!s.sect || s.sect.contrib < n) return false;
  s.sect.contrib -= n;
  return true;
}

// đồ theo cảnh giới
const CULT_PILL = ['tukhi', 'tukhi', 'ngungnguyen', 'hoanguyen', 'duonganh', 'hoathan', 'hoathan', 'hoathan', 'hoathan'];
const cultPill = () => 'p:' + CULT_PILL[effRi()];
const healPill = () => (effRi() <= 1 ? 'p:hoixuandan' : 'p:tucotthuc');
const breakPill = () => (effRi() < 8 ? 'p:' + BREAK_PILL[effRi() + 1] : cultPill());
function herb(tierBonus = 0): string {
  const t = clamp(Math.ceil(effRi() * 0.7) + tierBonus, 1, 6);
  const l = Object.values(HERBS).filter((h) => h.tier === t);
  return 'h:' + pick(l.length ? l : Object.values(HERBS)).id;
}
/** Thuật pháp chưa học, hợp linh căn nếu được. */
function skillFor(maxTier = clamp(Math.ceil(effRi() / 2) + 1, 1, 4)): string | null {
  const l = Object.values(SKILLS).filter((k) => !k.peak && k.tier <= maxTier && !s.known.includes(k.id));
  if (!l.length) return null;
  const fit = l.filter((k) => !k.el || s.root.els.includes(k.el));
  return pick(fit.length ? fit : l).id;
}
/** Công pháp hợp linh căn, tối đa phẩm maxTier. */
function techFor(maxTier: number, evilOk = false): string | null {
  const l = Object.values(TECHS).filter((t) => !t.blood && t.tier <= maxTier && (evilOk || !t.evil) && (t.el.length === 0 || t.el.some((e) => s.root.els.includes(e))));
  if (!l.length) return null;
  const best = Math.max(...l.map((t) => t.tier));
  return pick(l.filter((t) => t.tier === best)).id;
}
const curTier = () => (s.tech ? TECHS[s.tech].tier : 0);

// người nhà, đạo lữ
const plain: NF = (n) => !['master', 'disciple', 'kin', 'daolu', 'enemy', 'rival'].includes(n.tag);
const childIds = (): string[] => (s.flags.lifeChildren ||= []);
const isChild: NF = (n) => childIds().includes(n.id);
const surname = () => s.name.split(' ')[0];
const pot = (c: NPC): number => s.flags['lifePot_' + c.id] ?? 1;
function loans(): Record<string, { a: number; y: number }> {
  return (s.flags.lifeLoans ||= {});
}

// ---------------------------------------------------------------- A. TÔNG MÔN

register([
  // ----- Đại tỷ thí nội môn (chuỗi 2 vòng) -----
  {
    id: 'life_sect_tythi',
    where: ['sect'],
    w: 4,
    minR: 1,
    cd: 10,
    cond: () => atHome(),
    title: 'Đại tỷ thí nội môn',
    text: () => {
      const n = chooseOr((x) => sameSect(x) && (x.tag === 'peer' || x.tag === 'senior' || x.tag === 'rival') && Math.abs(x.r - effRi()) <= 1, () =>
        meet({ dr: 0, sect: s.sect!.id, tag: 'peer', rel: 0, how: `Đồng môn ở ${sectName()}` }),
      );
      return `Chuông đồng trên đỉnh ${sectName()} gõ chín tiếng. Đại tỷ thí mười năm một lần bắt đầu. Trên lôi đài đá xanh, người rút thăm gặp ngươi ở vòng đầu là ${npcTitle(n)}. ${He(n)} ôm quyền, ánh mắt không giấu được chiến ý.`;
    },
    ch: () => {
      const n = the((x) => sameSect(x));
      return [
        {
          t: 'Lên đài',
          cls: 'prime',
          fn: (): Outcome => {
            const d = duel(foeOf(n), { lethal: false, noLoot: true });
            if (!d.win) {
              relChange(n, 5);
              return `${d.t} ${n.name} đưa tay kéo ngươi dậy: "Lần sau." Dưới đài có tiếng cười khẽ, cũng có người gật gù.` + contrib(5) + statUp('tam', 1);
            }
            relChange(n, n.tag === 'rival' ? 10 : -5);
            return {
              text: `${d.t} Dưới đài reo hò. Vòng sau, ngươi gặp chân truyền đệ tử được kỳ vọng nhất năm nay — một người mặc áo trắng, kiếm chưa ra khỏi vỏ mà gió đã lạnh.`,
              choices: [
                {
                  t: 'Đánh tới cùng',
                  cls: 'danger',
                  fn: () => {
                    const d2 = duel(cultivator('Chân truyền áo trắng', 0, 1.2), { lethal: false, noLoot: true });
                    if (d2.win) {
                      fame(30);
                      mark(`Đoạt khôi thủ đại tỷ thí ${sectName()}`);
                      const r = meet({ dr: 0, sect: s.sect!.id, tag: 'rival', rel: -15, talent: 1.3, how: `Bại dưới tay ngươi ở đại tỷ thí ${sectName()}` });
                      return `${d2.t} Cả quảng trường lặng đi rồi vỡ òa. Tông chủ ${sectHead()} khẽ gật đầu. Người áo trắng — ${r.name} — lau máu khóe miệng, nói nhỏ: "Mười năm sau." Từ đó ngươi có một đối thủ.` + contrib(60) + giveGear(effRi(), 2);
                    }
                    return `${d2.t} Thua mà không nhục. Trưởng lão ghi tên ngươi vào danh sách đệ tử đáng bồi dưỡng.` + contrib(25) + cult(15);
                  },
                },
                { t: 'Dừng ở đây, giữ sức', fn: () => 'Ngươi xin rút. Có người chê nhát, ngươi mặc kệ. Một chỗ trong tốp mười cũng đủ đổi vài viên đan.' + contrib(15) + gain(cultPill()) },
              ],
            };
          },
        },
        { t: 'Bỏ quyền thi đấu', fn: () => { relChange(n, -5); return `Ngươi xuống đài. ${n.name} nhíu mày, như vừa bị coi thường.` + tamma(3); } },
      ];
    },
  },

  // ----- Sư huynh chèn ép (chuỗi) -----
  {
    id: 'life_sect_bully',
    where: ['sect'],
    w: 4,
    cd: 12,
    cond: () => atHome() && s.sect!.rank <= 2,
    title: 'Bị chèn ép',
    text: () => {
      const n = chooseOr((x) => sameSect(x) && x.tag === 'senior' && x.rel < 20 && x.r >= effRi(), () =>
        meet({ dr: 1, sect: s.sect!.id, tag: 'senior', rel: -10, how: `${ch(0.5) ? 'Sư huynh' : 'Sư tỷ'} hay bắt nạt ở ${sectName()}` }),
      );
      return `Ngày phát bổng lộc. Ngươi vừa nhận túi linh thạch thì ${npcTitle(n)} chặn ở cửa phòng, chìa tay: "Đệ tử mới phải biết quy củ. Một nửa." Mấy kẻ đứng sau ${he(n)} cười khẩy.`;
    },
    ch: () => {
      const n = the((x) => sameSect(x));
      return [
        { t: 'Nhẫn nhịn, đưa ra', fn: () => { relChange(n, 5); return `Ngươi đưa. ${n.name} vỗ vai ngươi: "Biết điều." Cái vỗ vai ấy nặng hơn núi.` + money(-M(6)) + tamma(8) + statUp('tam', 1); } },
        {
          t: 'Không đưa',
          cls: 'danger',
          fn: (): Outcome => {
            relChange(n, -25);
            return {
              text: `${n.name} sầm mặt: "To gan. Ra sau núi, ta dạy ngươi cách làm người." Đám đông bắt đầu xúm lại.`,
              choices: [
                {
                  t: 'Ra sau núi',
                  cls: 'danger',
                  fn: () => {
                    const d = duel(foeOf(n), { lethal: false, noLoot: true });
                    if (d.win) {
                      relChange(n, -20);
                      fame(10);
                      return `${d.t} ${n.name} nằm dưới đất, mặt đỏ như gan lợn. Từ đó không ai dám chìa tay đòi bổng lộc của ngươi nữa. Nhưng ${he(n)} sẽ nhớ.`;
                    }
                    return `${d.t} Ngươi bị lột cả túi linh thạch, nằm ba ngày mới dậy nổi.` + money(-M(12)) + hurt(25) + tamma(10);
                  },
                },
                {
                  t: 'Lên Giới Luật Đường tố cáo',
                  fn: () => {
                    if (ch(0.4 + stat('mi') * 0.04)) {
                      relChange(n, -30);
                      return `Chấp sự Giới Luật Đường nghe xong, phạt ${n.name} quét bậc đá ba tháng. Đồng môn nhìn ngươi khác hẳn — vừa nể, vừa dè chừng.` + contrib(10);
                    }
                    relChange(n, -15);
                    return `Chấp sự uể oải: "Chuyện vặt giữa sư huynh đệ, tự giải quyết." Đêm đó cửa phòng ngươi bị ai đó đạp hỏng.` + tamma(6);
                  },
                },
              ],
            };
          },
        },
      ];
    },
  },

  // ----- Trưởng lão giao việc riêng (chuỗi) -----
  {
    id: 'life_sect_elder_task',
    where: ['sect'],
    w: 3,
    minR: 1,
    cd: 12,
    cond: () => atHome(),
    title: 'Việc riêng của trưởng lão',
    text: () => {
      const e = sectElder();
      s.flags[EVK] = e.id;
      return `${npcTitle(e)} gọi ngươi vào đan phòng. Lò đan đồng xanh cao bằng người đang đỏ lửa. "Ta phải ra ngoài ba ngày. Ngươi trông lò. Lửa không được tắt, cũng không được bùng. Xong việc, không thiệt ngươi."`;
    },
    ch: () => {
      const e = the((x) => sameSect(x));
      return [
        {
          t: 'Nhận lời',
          cls: 'prime',
          fn: (): Outcome => ({
            text: 'Đêm thứ hai, lò đan rung lên bần bật. Nắp lò nóng đỏ, khe hở rỉ ra khói tím. Nếu nổ, cả gian đan phòng bay mất.',
            choices: [
              {
                t: 'Dồn chân nguyên ép lò',
                cls: 'danger',
                fn: () => {
                  if (ch(0.35 + stat('can') * 0.03 + stat('ngo') * 0.03)) {
                    relChange(e, 30);
                    s.craft.alch = Math.max(s.craft.alch, 1);
                    return `Ngươi đặt hai tay lên lò, mồ hôi chảy thành dòng. Gần sáng, lò lặng xuống. ${e.name} về, mở lò, chín viên đan tròn lẳn. Lão nhìn ngươi lâu hơn thường lệ: "Khá."` + gain(cultPill(), 2, 2) + contrib(30);
                  }
                  relChange(e, -5);
                  return 'Lò nổ. Ngươi bị hất văng vào vách, tóc cháy xém. Trưởng lão về, nhìn đống tro, thở dài mà không mắng — có lẽ lão cũng biết lò này khó trị.' + hurt(30);
                },
              },
              {
                t: 'Chạy đi tìm người giúp',
                fn: () => {
                  relChange(e, -10);
                  return `Ngươi chạy khắp núi tìm người. Khi quay lại, lò đã nguội ngắt, thuốc hỏng hết. ${e.name} chỉ phẩy tay: "Thôi. Mạng ngươi còn quý hơn một lò thuốc."` + contrib(5);
                },
              },
            ],
          }),
        },
        { t: 'Thoái thác vì bận tu luyện', fn: () => { relChange(e, -8); return `${e.name} hừ một tiếng, gọi người khác.`; } },
      ];
    },
  },

  // ----- Đại hội tông môn -----
  {
    id: 'life_sect_daihoi',
    where: ['sect'],
    w: 3,
    cd: 15,
    cond: () => atHome(),
    title: 'Đại hội khai sơn',
    text: () => `Ngày giỗ tổ khai sơn ${sectName()}. Hương án dài trăm trượng, khách các phái tới chúc mừng. Tông chủ ${sectHead()} ngồi trên đài cao giảng đạo, giọng không lớn mà vang tới từng chân núi.`,
    ch: () => [
      { t: 'Ngồi nghe giảng đạo', cls: 'prime', fn: () => 'Có một câu ngươi không hiểu hết, nhưng khắc vào lòng. Về phòng ngồi xuống, kinh mạch như thông thêm một đoạn.' + cult(ri(15, 30)) },
      {
        t: `Dâng lễ vật (${fmt(M(25))} linh thạch)`,
        dis: !canPay(M(25)),
        fn: () => { s.money -= M(25); fame(5); return 'Lễ vật được xướng tên trước mặt khách các phái. Chấp sự ghi công cho ngươi.' + contrib(25); },
      },
      {
        t: 'Xin múa kiếm mừng thọ',
        fn: () => {
          if (ch(0.3 + stat('mi') * 0.04 + stat('can') * 0.02)) {
            fame(15);
            return 'Kiếm quang như mưa hoa. Khách quý vỗ tay, tông chủ cười, sai người ban rượu.' + contrib(20) + statUp('mi', 1);
          }
          return 'Giữa chừng ngươi trượt chân. Kiếm vẫn múa xong, nhưng tiếng cười dưới đài thì ngươi nhớ mãi.' + tamma(5);
        },
      },
    ],
  },

  // ----- Cấm địa (chuỗi, có thể bị phạt) -----
  {
    id: 'life_sect_camdia',
    where: ['sect'],
    w: 2,
    minR: 1,
    cd: 20,
    cond: () => atHome(),
    title: 'Cấm địa sau núi',
    text: () => `Sau núi ${sectName()} có một khe đá dán đầy phù phong ấn, môn quy cấm tuyệt đối. Đêm nay, một tấm phù đã bong ra, gió từ trong khe thổi ra mang theo tiếng kiếm ngân rất khẽ.`,
    ch: () => [
      {
        t: 'Lẻn vào',
        cls: 'danger',
        fn: (): Outcome => ({
          text: 'Trong khe là một thạch thất. Giữa phòng cắm một thanh kiếm gãy, quanh vách chi chít vết kiếm — có ai đó đã ngộ đạo ở đây rồi chết ở đây. Bộ xương ngồi xếp bằng vẫn hướng về vách đá.',
          choices: [
            {
              t: 'Ngồi xuống cảm ngộ vết kiếm',
              cls: 'prime',
              fn: () => {
                let t = 'Ngươi nhìn vết kiếm tới khi mắt rát. Đến một lúc, những vết khắc như chuyển động.';
                if (ch(0.3 + stat('ngo') * 0.05)) {
                  const k = skillFor();
                  t += cult(40) + (k ? learnSkill(k) : statUp('ngo', 1));
                } else t += cult(15);
                if (ch(0.35)) return t + '\n\nRa tới cửa khe, đèn lồng Giới Luật Đường đã chờ sẵn. Ngươi bị phạt diện bích một năm, trừ sạch cống hiến.' + ((s.sect!.contrib = 0), years(1), '');
                return t + ' Ngươi lặng lẽ dán lại phù, không ai hay biết.';
              },
            },
            {
              t: 'Nhổ thanh kiếm gãy mang đi',
              cls: 'danger',
              fn: (): Outcome => {
                const g = giveGear(Math.min(RMAX(), effRi() + 1), 2, 0);
                if (ch(0.55)) {
                  return {
                    text: `Kiếm vừa rời đá, cả ngọn núi rung lên. Trận cấm địa bị kinh động.${g} Sáng hôm sau, ngươi bị áp giải lên Giới Luật Đường. Chấp pháp trưởng lão lạnh lùng: "Trộm vật trong cấm địa. Ngươi có gì để nói?"`,
                    choices: [
                      { t: 'Nhận tội, chịu phạt', fn: () => { s.sect!.contrib = 0; return 'Ba mươi roi giới luật, trừ sạch cống hiến. Ngươi cắn răng không kêu một tiếng. Kiếm gãy bị thu lại, nhưng trưởng lão để ý thấy ngươi có gan.' + hurt(35) + statUp('tam', 1); } },
                      {
                        t: 'Chối, nói kiếm tự bay ra',
                        cls: 'danger',
                        fn: () => {
                          if (ch(0.25 + stat('mi') * 0.03)) return 'Không ai tin, nhưng cũng không ai chứng minh được. Ngươi bị quản thúc nửa năm.' + (years(0.5), '') + tamma(5);
                          return 'Lời nói dối bị lật tẩy bằng một tấm Chiếu Tâm Kính. ' + expel() + ' Ngươi ôm hành lý xuống núi, sau lưng là ánh mắt của những người từng gọi ngươi là đồng môn.' + tamma(15);
                        },
                      },
                    ],
                  };
                }
                return `Kiếm rời đá, không có gì xảy ra. Ngươi ôm kiếm về như ôm một khối băng.${g}` + tamma(5);
              },
            },
          ],
        }),
      },
      { t: 'Báo cho Giới Luật Đường', fn: () => 'Chấp sự tới dán lại phù, liếc ngươi một cái. Hôm sau tên ngươi có thêm một dòng công.' + contrib(15) + statUp('tam', 1) },
    ],
  },

  // ----- Tàng Kinh Các -----
  {
    id: 'life_sect_tangkinh',
    where: ['sect'],
    w: 3,
    cd: 10,
    cond: () => atHome(),
    title: 'Tàng Kinh Các',
    text: () => 'Tầng ba Tàng Kinh Các, lão giữ các ngủ gật trên ghế mây. Trong góc khuất, ngươi thấy một quyển sách không có tên, bìa dính đầy bụi, kẹp giữa hai bộ điển tịch mà chẳng ai mượn.',
    ch: () => [
      {
        t: 'Ngồi xuống đọc kỹ',
        cls: 'prime',
        fn: () => {
          years(0.5);
          if (ch(0.3 + stat('ngo') * 0.05)) {
            const k = skillFor();
            return 'Nửa năm trôi qua mà như một chớp mắt. Đây là bút ký của một vị tiền bối, viết về những chỗ sai trong cách chính mình tu luyện.' + (k ? learnSkill(k) : statUp('ngo', 1)) + cult(15);
          }
          return 'Chữ như gà bới, ngươi đọc nửa năm chỉ hiểu được dăm trang. Nhưng tâm tĩnh hơn hẳn.' + tamma(-10) + cult(10);
        },
      },
      {
        t: 'Đánh thức lão giữ các hỏi chuyện',
        fn: () => {
          const r = ch(0.4 + stat('mi') * 0.03);
          return r
            ? 'Lão mở một mắt: "Quyển đó à? Của sư tổ ta. Đọc được thì là duyên." Rồi lão kể cả buổi chiều về những đời đệ tử đã đi qua tầng này. Lúc ngươi về, lão nhét vào tay ngươi một ngọn giản cũ.' + gain('x:ngocgian')
            : 'Lão càu nhàu vì bị đánh thức, phạt ngươi lau kệ sách một tháng. Bụi nhiều đến nỗi ngươi ho cả tháng.' + contrib(5);
        },
      },
      { t: 'Đặt lại chỗ cũ', fn: () => 'Có những thứ không thuộc về mình. Ngươi đặt sách lại, phủi tay đi xuống.' + statUp('tam', 1) },
    ],
  },

  // ----- Tranh suất vào bí cảnh (chuỗi) -----
  {
    id: 'life_sect_bicanh',
    where: ['sect'],
    w: 3,
    minR: 1,
    cd: 15,
    cond: () => atHome(),
    title: 'Suất vào bí cảnh',
    text: () => {
      const n = chooseOr((x) => sameSect(x) && x.tag !== 'master' && x.tag !== 'disciple', () =>
        meet({ dr: 0, sect: s.sect!.id, tag: 'peer', rel: 10, how: `Đồng môn ở ${sectName()}` }),
      );
      return `Tông môn có ba suất vào một tiểu bí cảnh sắp mở. Mười mấy người tranh. ${n.name} kéo ngươi ra góc: "Ta chỉ còn mười năm thọ nguyên để Trúc Cơ… nếu ngươi không tranh, ta có cơ hội." Mắt ${he(n)} đỏ hoe.`;
    },
    ch: () => {
      const n = the((x) => sameSect(x));
      const enter = (pre: string): Outcome => ({
        text: pre + '\n\nCửa bí cảnh là một màn nước dựng đứng. Bên kia, cỏ cây cao bằng nhà, linh khí đặc như sương. Ngươi chỉ có nửa nén hương trước khi cửa đóng.',
        choices: [
          { t: 'Hái linh thảo gần cửa', fn: () => 'An toàn, đủ dùng.' + gain(herb(), 2) + gain(herb(1)) + cult(10) },
          {
            t: 'Lao vào sâu tìm truyền thừa',
            cls: 'danger',
            fn: () => {
              const d = duel(cultivator('Khôi lỗi giữ cửa', 0, 1.15));
              if (d.win) return `${d.t} Sau khôi lỗi là một hộp đá. Trong hộp có pháp khí còn vẹn nguyên.` + giveGear(effRi(), 3) + contrib(20);
              return d.t + ' Ngươi chật vật lao ra khỏi màn nước đúng lúc nó khép lại.';
            },
          },
        ],
      });
      return [
        {
          t: 'Lên đài giành suất',
          cls: 'prime',
          fn: () => {
            const d = duel(cultivator('Đồng môn tranh suất', 0, 1.05), { lethal: false, noLoot: true });
            relChange(n, -15);
            if (!d.win) return `${d.t} Suất rơi vào tay người khác. ${n.name} cũng không được.`;
            return enter(d.t);
          },
        },
        {
          t: 'Đổi 60 cống hiến lấy một suất',
          dis: !s.sect || s.sect.contrib < 60,
          fn: () => { payContrib(60); return enter('Ngươi nộp lệnh bài. Chấp sự gạch tên một người, viết tên ngươi vào.'); },
        },
        {
          t: `Nhường cho ${n.name}`,
          fn: () => {
            relChange(n, 35);
            good(2);
            if (ch(0.5)) { n.r = Math.min(npcCap(), n.r + 1); n.st = 0; }
            return `Ngươi rút tên. Hai năm sau, ${n.name} gõ cửa phòng ngươi, quỳ xuống dập đầu một cái rồi đi, không nói lời nào. Trên bàn để lại một gói nhỏ.` + gain(herb(1)) + statUp('tam', 1);
          },
        },
      ];
    },
  },

  // ----- Ma đạo / chính đạo tấn công sơn môn (chuỗi) -----
  {
    id: 'life_sect_siege',
    where: ['sect'],
    w: 2,
    minR: 1,
    cd: 30,
    cond: () => atHome(),
    title: 'Đại trận hộ sơn rung chuyển',
    text: () => {
      const foe = mySect().evil ? 'Tu sĩ chính đạo liên thủ' : 'Ma tu Huyết Sát Điện';
      return `Nửa đêm, chuông báo động vang lên dồn dập. ${foe} kéo tới, đại trận hộ sơn như mặt trống bị đánh, mỗi tiếng nổ là một vệt nứt trên trời. Đệ tử ngoại môn la hét chạy tán loạn.`;
    },
    ch: () => {
      const foeN = mySect().evil ? 'Kiếm tu chính đạo' : 'Ma tu áo đỏ';
      return [
        {
          t: 'Lên tường trận giữ sơn môn',
          cls: 'prime',
          fn: (): Outcome => {
            const d = duel(cultivator(foeN, 0, 1.05), { lethal: false });
            if (!d.win) return `${d.t} Ngươi bị đánh văng khỏi tường trận. Sáng ra địch rút, ngươi nằm trong y đường cùng trăm người khác.` + hurt(30) + contrib(15);
            const mate = live((x) => sameSect(x) && x.rel >= 10 && x.tag !== 'master');
            const f = mate.length ? pick(mate) : null;
            if (f) s.flags[EVK] = f.id;
            return {
              text: `${d.t} Khói lửa mù mịt. ${f ? `Phía tây, ngươi thấy ${f.name} bị ba tên vây giữa đám cháy.` : 'Phía tây, mấy đệ tử nhỏ tuổi bị vây giữa đám cháy.'} Phía đông, kẻ cầm đầu đang đánh vào mắt trận.`,
              choices: [
                {
                  t: f ? `Cứu ${f.name}` : 'Cứu các đệ tử nhỏ',
                  fn: () => {
                    const d2 = duel(cultivator(foeN, 0, 1.15), { lethal: false });
                    if (d2.win) {
                      good(2);
                      if (f) relChange(f, 35);
                      return `${d2.t} ${f ? `${f.name} ôm vết thương, nhìn ngươi không nói nên lời. Ân cứu mạng này, ${he(f)} sẽ nhớ cả đời.` : 'Mấy đứa nhỏ khóc òa, níu áo ngươi không buông.'}` + contrib(50);
                    }
                    if (f && ch(0.5)) killNpc(f, 'tử trận khi ma đạo đánh sơn môn');
                    return `${d2.t} ${f && !f.alive ? `${f.name} ngã xuống trước mắt ngươi.` : 'Ngươi chỉ kéo được một người ra.'}` + tamma(15) + contrib(20);
                  },
                },
                {
                  t: 'Truy kẻ cầm đầu',
                  cls: 'danger',
                  fn: () => {
                    const d2 = duel({ name: mySect().evil ? 'Chấp pháp trưởng lão chính đạo' : 'Huyết Sát hộ pháp', r: Math.min(RMAX(), effRi() + 1), kind: 'boss', mult: 0.9 });
                    if (d2.win) {
                      fame(60);
                      mark(`Chém kẻ cầm đầu đánh lên ${sectName()}`);
                      return `${d2.t} Đầu lĩnh ngã, địch tan như ong vỡ tổ. Tông chủ đích thân ra tận chân trận đón ngươi.` + contrib(100) + giveGear(effRi() + 1, 2);
                    }
                    return d2.t + ' Mắt trận vẫn giữ được nhờ các trưởng lão kịp tới.' + contrib(30);
                  },
                },
              ],
            };
          },
        },
        {
          t: 'Trốn vào động phủ',
          fn: () => {
            for (const n of s.npcs) if (sameSect(n) && n.alive) n.rel -= 8;
            return 'Ngươi đóng cửa đá, nghe tiếng nổ suốt đêm. Sáng ra địch rút. Không ai nói gì, nhưng ai cũng biết đêm qua ngươi ở đâu.' + tamma(12);
          },
        },
      ];
    },
  },

  // ----- Nội gián (chuỗi) -----
  {
    id: 'life_sect_spy',
    where: ['sect'],
    w: 2,
    minR: 1,
    cd: 25,
    cond: () => atHome(),
    title: 'Phi kiếm truyền thư lúc nửa đêm',
    text: () => {
      const n = chooseOr((x) => sameSect(x) && (x.tag === 'peer' || x.tag === 'senior' || x.tag === 'friend' || x.tag === 'acq'), () =>
        meet({ dr: 0, sect: s.sect!.id, tag: 'peer', rel: 20, how: `Đồng môn ở ${sectName()}` }),
      );
      return `Đêm không trăng. Ngươi thấy ${n.name} lén ra rìa vách núi, búng một đạo phi kiếm truyền thư bay khỏi đại trận — đúng hướng có ma khí.`;
    },
    ch: () => {
      const n = the((x) => sameSect(x));
      return [
        {
          t: 'Bám theo',
          cls: 'prime',
          fn: (): Outcome => ({
            text: `Ba đêm sau, ngươi nấp sau tảng đá ở chân núi, thấy ${n.name} trao một tấm bản đồ đại trận cho một kẻ áo đen. Khi kẻ kia đi rồi, ${n.name} ngồi thụp xuống, ôm mặt.`,
            choices: [
              {
                t: 'Về báo Giới Luật Đường',
                fn: () => {
                  killNpc(n, 'bị tông môn xử tử vì tội thông đồng ma đạo');
                  mark(`Vạch mặt nội gián ${n.name}`);
                  return `${n.name} bị bắt ngay trong đêm. Ba ngày sau, đầu ${he(n)} treo trước sơn môn. Ngươi được ghi đại công.` + contrib(70) + (n.rel >= 40 ? tamma(20) : tamma(5));
                },
              },
              {
                t: 'Ra mặt đối chất',
                fn: (): Outcome => {
                  relChange(n, 10);
                  return {
                    text: `${n.name} giật mình, rồi bật khóc: "Chúng bắt mẹ ta ở thôn dưới núi. Ta không còn cách nào…"`,
                    choices: [
                      {
                        t: 'Cùng đi cứu người',
                        cls: 'danger',
                        fn: () => {
                          const d = duel(cultivator('Ma tu canh ngục', 0, 1.1));
                          if (d.win) {
                            relChange(n, 50);
                            good(3);
                            n.tag = 'friend';
                            return `${d.t} Bà lão được cứu ra. ${n.name} tự lên Giới Luật Đường thú tội, được giảm nhẹ. Từ đó ${he(n)} coi ngươi như người nhà.` + contrib(30);
                          }
                          return d.t + ' Không cứu được người. ' + `${n.name} gục xuống bên ngươi, tiếng khóc như xé ruột.` + tamma(15);
                        },
                      },
                      {
                        t: 'Ép hắn tự thú',
                        fn: () => {
                          relChange(n, -40);
                          return `${n.name} bị phế tu vi, đuổi khỏi sơn môn. Trước khi đi, ${he(n)} nhìn ngươi một lần — không giận, chỉ trống rỗng.` + contrib(35) + ((n.r = 0), (n.sect = null), '');
                        },
                      },
                    ],
                  };
                },
              },
            ],
          }),
        },
        { t: 'Làm như không thấy', fn: () => 'Ngươi quay về phòng. Đêm đó không ngủ được.' + tamma(10) },
      ];
    },
  },

  // ----- Sư phụ ban thưởng -----
  {
    id: 'life_sect_reward',
    where: ['sect'],
    w: 4,
    cd: 10,
    cond: () => atHome() && !!master() && master()!.rel >= 30,
    title: 'Sư phụ gọi',
    text: () => {
      const m = master()!;
      s.flags[EVK] = m.id;
      return `Tiểu đồng tới báo: sư phụ ${m.name} gọi. Ngươi vào, thấy ${he(m)} đang pha trà. "Mấy năm nay ngươi không làm ta mất mặt. Muốn gì, nói."`;
    },
    ch: () => {
      const m = the((x) => x.tag === 'master');
      return [
        { t: 'Xin đan dược đột phá', cls: 'prime', fn: () => { relChange(m, 3); return `${m.name} ném cho ngươi một bình ngọc: "Đừng lãng phí."` + gain(breakPill(), 1, 1); } },
        { t: 'Xin một món pháp khí', fn: () => { relChange(m, 3); return `${m.name} lục trong tay áo, lấy ra một món đồ cũ của mình.` + giveGear(Math.min(RMAX(), effRi() + 1), 1); } },
        { t: 'Chỉ xin được chỉ điểm', fn: () => { relChange(m, 10); return `${m.name} khẽ cười. Một chén trà, ${he(m)} nói ba câu, đúng ba chỗ ngươi vướng mắc bấy lâu.` + cult(ri(25, 40)); } },
      ];
    },
  },

  // ----- Bị vu oan, phạm môn quy (chuỗi, có thể bị trục xuất) -----
  {
    id: 'life_sect_framed',
    where: ['sect'],
    w: 2,
    cd: 30,
    cond: () => atHome() && s.sect!.rank < RK.TL_NOI,
    title: 'Giới Luật Đường triệu tập',
    text: () => {
      const n = chooseOr((x) => sameSect(x) && (x.rel <= -20 || x.tag === 'rival'), () =>
        meet({ dr: 0, sect: s.sect!.id, tag: 'peer', rel: -30, how: `Đồng môn ghen ghét ngươi ở ${sectName()}` }),
      );
      return `Vườn thuốc mất ba gốc linh chi trăm năm. ${n.name} đứng trước Giới Luật Đường, chỉ thẳng vào ngươi: "Đêm đó con thấy ${s.g === 'm' ? 'hắn' : 'nàng'} lảng vảng ở vườn thuốc." Dưới gối giường ngươi, người ta tìm thấy một chiếc lá linh chi.`;
    },
    ch: () => {
      const n = the((x) => sameSect(x));
      const punish = (): Outcome => ({
        text: 'Chấp pháp trưởng lão đập bàn: "Tang chứng rõ ràng. Hoặc chịu phạt, hoặc cút."',
        choices: [
          { t: 'Cắn răng chịu phạt', fn: () => { s.sect!.contrib = Math.floor(s.sect!.contrib / 3); relChange(n, -10); return 'Năm mươi roi, cống hiến bị trừ phần lớn. Ngươi lết về phòng, nằm nhìn trần nhà, thề sẽ có ngày lật lại vụ này.' + hurt(35) + tamma(15); } },
          {
            t: 'Đánh chấp pháp, xông xuống núi',
            cls: 'danger',
            fn: () => {
              const d = duel(cultivator('Chấp pháp đệ tử', 1, 0.9), { lethal: false, noLoot: true });
              relChange(n, -30);
              if (d.win) return `${d.t} Ngươi phá vòng vây xuống núi. ` + expel() + ' Từ nay ngươi là kẻ phản môn trong mắt họ.';
              return `${d.t} ` + expel() + ' Ngươi bị phế bỏ lệnh bài, ném ra ngoài sơn môn như một con chó.' + hurt(40) + tamma(20);
            },
          },
        ],
      });
      const m = master();
      const out: Choice[] = [
        {
          t: 'Biện bạch',
          cls: 'prime',
          fn: () => {
            if (ch(0.3 + stat('mi') * 0.04 + stat('van') * 0.03)) {
              relChange(n, -30);
              return `Ngươi chỉ ra chiếc lá còn tươi, mà linh chi mất từ năm ngày trước. Cả đường im lặng. ${n.name} tái mặt, bị phạt thay ngươi.` + contrib(20) + statUp('tam', 1);
            }
            return punish();
          },
        },
      ];
      if (m && m.rel >= 30)
        out.push({
          t: `Nhờ sư phụ ${m.name} đứng ra`,
          fn: () => {
            relChange(m, -5);
            if (m.r >= 3 || ch(0.6)) {
              relChange(n, -20);
              return `${m.name} tới, chỉ nói một câu: "Đồ đệ của ta không thiếu ba gốc linh chi." Không ai dám nói thêm. Vụ việc chìm xuồng, nhưng ${n.name} ghi hận.`;
            }
            return punish();
          },
        });
      return out;
    },
  },

  // ----- Kế nhiệm (chuỗi) -----
  {
    id: 'life_sect_heir',
    where: ['sect'],
    w: 5,
    minR: 5,
    once: true,
    cond: () => atHome() && s.sect!.rank >= RK.THUTICH && s.sect!.rank < RK.CHU,
    title: 'Ngôi tông chủ',
    text: () => `Tông chủ ${sectHead()} gọi ngươi lên đỉnh núi cao nhất. Tóc lão đã bạc như tuyết. "Thọ nguyên của ta không còn bao lâu. ${sectName()} cần một người gánh vác. Ta đã nhìn ngươi rất lâu rồi."`,
    ch: () => [
      {
        t: 'Quỳ xuống nhận lệnh',
        cls: 'prime',
        fn: (): Outcome => ({
          text: 'Ngày đại lễ, trước mặt toàn tông, một vị trưởng lão râu dài bước ra: "Ta không phục! Hắn nhập môn sau ta hai trăm năm!" Không khí đông cứng.',
          choices: [
            {
              t: 'Mời trưởng lão chỉ giáo',
              cls: 'danger',
              fn: () => {
                const d = duel(cultivator('Trưởng lão bất phục', 0, 1.15), { lethal: false, noLoot: true });
                s.sect!.rank = Math.max(s.sect!.rank, RK.CHU);
                setFlag('sect_heir', s.sect!.id);
                mark(`Kế nhiệm ngôi tông chủ ${sectName()}`);
                fame(200);
                if (d.win) return `${d.t} Trưởng lão im lặng thật lâu rồi cúi đầu. Từ hôm nay, ngươi là tông chủ ${sectName()}.` + contrib(300);
                return `${d.t} Nhưng lệnh tông chủ đã ban. Ngươi nhận ấn tín trong tiếng xì xào. Đường còn dài.` + contrib(150) + tamma(10);
              },
            },
            {
              t: 'Để tông chủ xử',
              fn: () => {
                s.sect!.rank = Math.max(s.sect!.rank, RK.CHU);
                setFlag('sect_heir', s.sect!.id);
                mark(`Kế nhiệm ngôi tông chủ ${sectName()}`);
                fame(120);
                return `Lão tông chủ chỉ nhìn trưởng lão kia một cái. Người ấy lùi lại. Ngươi nhận ấn tín, cảm thấy nó nặng hơn bất cứ pháp bảo nào.` + contrib(200);
              },
            },
          ],
        }),
      },
      {
        t: 'Từ chối, tiến cử người khác',
        fn: () => { good(3); fame(30); return 'Ngươi cúi đầu: "Đệ tử chỉ muốn cầu đạo." Lão tông chủ thở dài, rồi cười: "Cũng tốt. Người biết mình muốn gì, hiếm lắm."' + statUp('tam', 2); },
      },
    ],
  },

  // ----- Sư đệ mới vào -----
  {
    id: 'life_sect_junior',
    where: ['sect'],
    w: 3,
    cd: 10,
    cond: () => atHome() && s.sect!.rank >= 1,
    title: 'Sư đệ mới nhập môn',
    text: () => {
      const n = meet({ dr: -1, sect: s.sect!.id, tag: 'peer', rel: 15, how: `Hậu bối ở ${sectName()}`, age: ri(13, 17) });
      s.flags[EVK] = n.id;
      return `Một ${n.g === 'm' ? 'thiếu niên' : 'thiếu nữ'} gầy gò tên ${n.name} đứng luyện công dưới mưa cả buổi, mãi không dẫn được khí vào đan điền. Thấy ngươi đi qua, ${he(n)} rụt rè gọi: "${s.g === 'm' ? 'Sư huynh' : 'Sư tỷ'}… có thể chỉ cho đệ một chút không?"`;
    },
    ch: () => {
      const n = the((x) => sameSect(x));
      return [
        { t: 'Dừng lại chỉ điểm', cls: 'prime', fn: () => { relChange(n, 30); n.talent += 0.1; good(1); return `Ngươi đứng dưới mưa cùng ${he(n)} tới tối. Dạy người khác, chính ngươi cũng nhìn ra chỗ hổng của mình.` + cult(10); } },
        { t: 'Bảo tự ngộ đi', fn: () => { relChange(n, -5); return `${n.name} cúi đầu, tiếp tục đứng dưới mưa.`; } },
      ];
    },
  },

  // ----- Thăm tông khác: khảo hạch nhập môn (chuỗi) -----
  {
    id: 'life_visit_trial',
    where: ['sect'],
    w: 5,
    cd: 6,
    cond: () => visiting() && !s.sect && root().m > 0,
    title: 'Khảo hạch nhập môn',
    text: () => {
      const sc = SECTS[hostId()];
      return `Trước sơn môn ${sc.n} người đông như hội. Hôm nay là ngày khảo hạch. Một chấp sự đứng trên bậc đá, giọng lạnh như sắt: "Ai muốn bái nhập, bước lên. Môn quy: ${sc.motto}"`;
    },
    ch: () => {
      const id = hostId();
      const sc = SECTS[id];
      const out: Choice[] = [
        {
          t: 'Bước lên khảo hạch',
          cls: 'prime',
          fn: (): Outcome => {
            const c = canJoin(id);
            if (!c.ok) return `Chấp sự đặt tay lên trán ngươi một hơi thở rồi lắc đầu: "${c.why}" Ngươi bị mời xuống núi.` + tamma(4);
            return {
              text: `Cửa ải cuối là Vấn Tâm Thê — chín trăm bậc đá, mỗi bậc là một ảo cảnh. Ở bậc sáu trăm, ngươi thấy cha mẹ mình đứng ở chân núi vẫy gọi.`,
              choices: [
                {
                  t: 'Không quay đầu',
                  cls: 'prime',
                  fn: () => {
                    if (ch(0.45 + stat('tam') * 0.05)) return 'Ngươi bước tiếp, nước mắt chảy mà chân không dừng. Tới đỉnh, chấp sự đưa cho ngươi một tấm lệnh bài.\n\n' + joinSect(id);
                    return 'Ở bậc tám trăm, ảo cảnh nuốt chửng ngươi. Tỉnh lại thì đã nằm ở chân núi. Năm sau thử lại.' + statUp('tam', 1);
                  },
                },
                { t: 'Quay đầu nhìn một lần', fn: () => 'Chỉ một lần. Ảo cảnh vỡ, ngươi ngã xuống chân thang. Chấp sự lắc đầu.' + tamma(5) },
              ],
            };
          },
        },
      ];
      if (hasItem('x:kiemlenh'))
        out.push({
          t: 'Trình lệnh bài tiến cử',
          fn: () => {
            const c = canJoin(id, true);
            if (!c.ok) return `Chấp sự xem lệnh bài, rồi trả lại: "${c.why}"`;
            lose('x:kiemlenh');
            return `Chấp sự đổi sắc mặt, đích thân dẫn ngươi vào.\n\n` + joinSect(id);
          },
        });
      out.push({ t: 'Chỉ đứng xem', fn: () => `Ngươi xem cả ngày. Người đỗ cười, người trượt khóc. ${sc.n} vẫn lạnh lùng như núi.` });
      return out;
    },
  },

  // ----- Thăm tông khác: bị đuổi về -----
  {
    id: 'life_visit_banned',
    where: ['sect'],
    w: 5,
    cd: 4,
    cond: () => visiting() && (s.sectHist[hostId()] === 'expelled' || s.sectHist[hostId()] === 'betrayed'),
    title: 'Cửa núi đóng sập',
    text: () => `Vừa tới chân núi ${SECTS[hostId()].n}, mấy đệ tử tuần sơn đã nhận ra ngươi. Kiếm rút khỏi vỏ: "Kẻ phản môn còn dám vác mặt về?"`,
    ch: () => [
      {
        t: 'Rút vũ khí',
        cls: 'danger',
        fn: () => {
          const d = duel(cultivator('Đệ tử tuần sơn', 0, 1));
          evil(1);
          return d.win ? `${d.t} Ngươi quay lưng đi giữa tiếng chuông báo động. Món nợ này càng lúc càng lớn.` : d.t;
        },
      },
      { t: 'Lặng lẽ bỏ đi', fn: () => 'Ngươi nhìn cổng núi lần cuối rồi quay đi. Có những nơi không thể trở về.' + tamma(6) },
    ],
  },

  // ----- Thăm tông khác: kết giao -----
  {
    id: 'life_visit_friend',
    where: ['sect'],
    w: 4,
    cd: 8,
    cond: () => visiting() && !(s.sectHist[hostId()] === 'expelled' || s.sectHist[hostId()] === 'betrayed'),
    title: 'Khách lạ ở sơn môn',
    text: () => {
      const n = meet({ dr: ri(-1, 1), sect: hostId(), tag: 'acq', rel: 15, how: `Gặp khi ghé ${SECTS[hostId()].n}` });
      s.flags[EVK] = n.id;
      return `Đệ tử tiếp khách của ${SECTS[hostId()].n} là ${npcTitle(n)}, người ${n.trait}. ${He(n)} dẫn ngươi đi một vòng quanh núi, kể chuyện tông môn mình không chút giấu giếm.`;
    },
    ch: () => {
      const n = the((x) => x.sect === hostId());
      return [
        { t: 'Ngồi luận đạo', cls: 'prime', fn: () => { relChange(n, 20); return `Hai người nói từ trưa tới khuya. Pháp môn của ${SECTS[hostId()].n} khác hẳn những gì ngươi biết.` + cult(12); } },
        { t: 'Mời một vò rượu', fn: () => { relChange(n, 28); return `${n.name} uống say, khoác vai ngươi gọi huynh đệ. Lúc chia tay, ${he(n)} dặn: "Có việc cứ tìm ta."` + money(-M(3)); } },
        { t: 'Chào rồi đi', fn: () => 'Ngươi cảm ơn, xuống núi.' },
      ];
    },
  },
]);

// ---------------------------------------------------------------- B. NHÂN MẠCH

register([
  // ----- Bạn cũ tới nhờ giúp (chuỗi) -----
  {
    id: 'life_friend_help',
    where: ['any'],
    w: 5,
    cd: 8,
    cond: () => exists((n) => plain(n) && n.rel >= 40),
    title: 'Cố nhân tìm tới',
    text: () => {
      const n = choose((x) => plain(x) && x.rel >= 40);
      return `${npcTitle(n)} tìm tới, áo dính bụi đường, mắt thâm quầng. "Ta không còn ai để nhờ. Một bọn tán tu cướp mất di vật sư phụ để lại cho ta, chúng đóng ở hẻm núi phía bắc."`;
    },
    ch: () => {
      const n = the((x) => plain(x));
      return [
        {
          t: 'Đi cùng',
          cls: 'prime',
          fn: (): Outcome => {
            const d = duel(cultivator('Đầu lĩnh tán tu', 0, 1.05));
            if (!d.win) { relChange(n, 10); return `${d.t} Hai người thoát được, nhưng di vật vẫn chưa lấy lại. ${n.name} cười buồn: "Ngươi chịu đi là đủ rồi."`; }
            relChange(n, 25);
            return {
              text: `${d.t} Trong hang ổ, ngoài di vật của ${n.name} còn một rương linh thạch.`,
              choices: [
                { t: 'Chia đôi', fn: () => `Hai người chia đôi dưới ánh lửa. ${n.name} nâng bình rượu: "Kiếp này có ngươi là đủ."` + money(M(20)) },
                { t: 'Nhường hết cho bạn', fn: () => { relChange(n, 15); good(1); return `${n.name} không nói gì, chỉ nắm chặt tay ngươi.` + statUp('tam', 1); } },
              ],
            };
          },
        },
        { t: 'Đưa ít linh thạch để bạn thuê người', dis: !canPay(M(15)), fn: () => { s.money -= M(15); relChange(n, 5); return `${n.name} nhận, cảm ơn, nhưng ánh mắt hơi tối đi.`; } },
        { t: 'Từ chối', fn: () => { relChange(n, -15); return `${n.name} gật đầu, quay đi. Bóng lưng ${he(n)} lúc ấy, ngươi nhớ rất lâu.`; } },
      ];
    },
  },

  // ----- Bạn mượn tiền -----
  {
    id: 'life_friend_borrow',
    where: ['town', 'market', 'village', 'sect'],
    w: 4,
    cd: 10,
    cond: () => exists((n) => plain(n) && n.rel >= 25 && !loans()[n.id]) && s.money >= M(30),
    title: 'Mượn linh thạch',
    text: () => {
      const n = choose((x) => plain(x) && x.rel >= 25 && !loans()[x.id]);
      return `${npcTitle(n)} gãi đầu, ấp úng mãi mới nói: "Ta sắp đột phá, thiếu một viên đan… Ngươi cho ta mượn ${fmt(M(30))} linh thạch được không? Ba năm, ta trả."`;
    },
    ch: () => {
      const n = the((x) => plain(x));
      const a = M(30);
      return [
        { t: 'Cho mượn', cls: 'prime', fn: () => { loans()[n.id] = { a, y: s.year }; relChange(n, 10); return `${n.name} cầm túi linh thạch, mắt sáng lên: "Ta nhớ!"` + money(-a); } },
        { t: 'Cho luôn, khỏi trả', fn: () => { relChange(n, 25); good(1); return `${n.name} sững người, rồi vái ngươi một vái thật sâu.` + money(-a); } },
        { t: 'Từ chối', fn: () => { relChange(n, -10); return `${n.name} cười gượng: "Không sao, không sao." Rồi đi rất nhanh.`; } },
      ];
    },
  },

  // ----- Món nợ cũ -----
  {
    id: 'life_friend_repay',
    where: ['any'],
    w: 6,
    cd: 3,
    cond: () => Object.entries(loans()).some(([id, l]) => s.year - l.y >= 3 && !!findNpc(id)),
    title: 'Món nợ cũ',
    text: () => {
      const [id, l] = Object.entries(loans()).find(([i, x]) => s.year - x.y >= 3 && !!findNpc(i))!;
      const n = findNpc(id)!;
      delete loans()[id];
      if (!n.alive) return `Ngươi nhận được một gói đồ từ người lạ. Trong có ${fmt(l.a)} linh thạch và một mẩu giấy: "Trả cho ngươi. — ${n.name}". Người mang tới nói ${n.name} đã ${n.cause || 'qua đời'} từ năm ngoái; trước lúc nhắm mắt chỉ dặn đúng việc này.` + money(l.a) + tamma(8);
      if (n.trait === 'tham tài' || n.rel < 20 || ch(0.2)) {
        relChange(n, -40);
        return `Đã quá hẹn lâu. Ngươi hỏi thăm thì nghe nói ${n.name} vẫn khỏe, chỉ là gặp ngươi thì tránh đi đường khác. Tiền mất, bạn cũng mất.` + tamma(6);
      }
      relChange(n, 20);
      const r = n.r > effRi() ? `Giờ ${he(n)} đã là ${realmN(n.r)}.` : '';
      return `${n.name} tìm tới, đặt lên bàn một túi linh thạch nặng gấp đôi ngày trước. ${r} "Nhờ viên đan năm ấy. Phần dư là lãi, đừng từ chối."` + money(l.a * 2);
    },
    ch: () => [{ t: 'Tiếp tục', fn: () => 'Chuyện tiền bạc, xưa nay là thước đo lòng người.' }],
  },

  // ----- Kẻ thù mai phục (chuỗi) -----
  {
    id: 'life_enemy_ambush',
    where: ['road', 'wild', 'town', 'market'],
    w: 5,
    cd: 8,
    cond: () => exists((n) => (n.tag === 'enemy' || n.rel <= -50) && n.id !== flag('nemesis') && n.r >= 1),
    title: 'Mai phục',
    text: () => {
      const n = choose((x) => (x.tag === 'enemy' || x.rel <= -50) && x.id !== flag('nemesis') && x.r >= 1);
      return `Trên đường vắng, một đạo kiếm quang từ trong rừng đâm thẳng vào lưng ngươi. Ngươi lăn mình né được. ${npcTitle(n)} bước ra, cười lạnh: "Đợi ngươi ba tháng rồi."`;
    },
    ch: () => {
      const n = the((x) => x.tag === 'enemy' || x.rel <= -50);
      const out: Choice[] = [
        {
          t: 'Nghênh chiến',
          cls: 'danger',
          fn: (): Outcome => {
            const d = duel(foeOf(n));
            if (!d.win) return d.t + (d.fled ? ` ${n.name} không đuổi theo, chỉ để lại một câu: "Lần sau."` : '');
            return {
              text: `${d.t} ${n.name} quỳ một gối, máu nhuộm vạt áo: "Giết đi. Ta không cầu xin."`,
              choices: [
                { t: 'Kết liễu', cls: 'danger', fn: () => { killNpc(n, 'bị ngươi chém chết', true); fame(15); return `Ngươi hạ kiếm. ${n.name} ngã xuống. Thù cũ chấm dứt — hoặc chỉ là chuyển sang người khác.` + giveGear(n.r, 1); } },
                { t: 'Tha mạng', fn: () => { n.rel = 0; n.tag = 'acq'; good(3); return `Ngươi tra kiếm vào vỏ. "Đi đi." ${n.name} nhìn ngươi thật lâu, rồi khập khiễng bỏ đi. Có lẽ hận thù cũng có lúc mỏi.` + statUp('tam', 1); } },
              ],
            };
          },
        },
        {
          t: 'Cầu hòa',
          fn: () => {
            if (ch(0.2 + stat('mi') * 0.04)) { relChange(n, 30); return `Ngươi nói rất lâu. ${n.name} không thu kiếm, nhưng cũng không đâm. Cuối cùng ${he(n)} quay đi: "Lần này thôi."`; }
            const d = duel(foeOf(n, 1.1));
            return `${n.name} cười nhạt: "Muộn rồi." ${d.t}`;
          },
        },
      ];
      const flee = hasItem('t:dichphu') ? 't:dichphu' : hasItem('t:thanhanhphu') ? 't:thanhanhphu' : '';
      if (flee) out.push({ t: 'Bóp nát phù độn thổ', fn: () => { lose(flee); return 'Phù quang lóe lên, ngươi biến mất trước mũi kiếm. Phía sau vọng lại tiếng chửi.'; } });
      return out;
    },
  },

  // ----- Tình cảm nảy nở -----
  {
    id: 'life_love_bloom',
    where: ['any'],
    w: 5,
    cd: 6,
    minAge: 16,
    cond: () => exists((n) => plain(n) && n.rel >= 50 && n.rel < 80 && n.r >= 1 && !isChild(n)),
    title: 'Dưới trăng',
    text: () => {
      const n = choose((x) => plain(x) && x.rel >= 50 && x.rel < 80 && x.r >= 1 && !isChild(x));
      return `Đêm trăng tròn, ${n.name} rủ ngươi lên mỏm đá ngắm sao. Gió thổi, ${he(n)} ${n.g === 'f' ? 'vén lọn tóc mai' : 'cởi áo khoác đưa ngươi'}, rồi im lặng rất lâu. Có câu gì đó ${he(n)} muốn nói mà mãi không thành lời.`;
    },
    ch: () => {
      const n = the((x) => plain(x));
      return [
        {
          t: 'Hỏi thẳng',
          cls: 'prime',
          fn: () => {
            if (ch(0.4 + stat('mi') * 0.05)) { relChange(n, ri(15, 25)); return `${n.name} bật cười, gò má đỏ ửng: "Ngươi ngốc thật." Rồi ${he(n)} tựa vào vai ngươi tới sáng.` + tamma(-10); }
            relChange(n, 5);
            return `${n.name} lảng sang chuyện khác. Nhưng lúc về, ${he(n)} đi chậm hơn thường lệ.`;
          },
        },
        { t: 'Cùng ngắm sao, không nói gì', fn: () => { relChange(n, 10); return 'Có những đêm không cần lời. Sao rơi một ngôi, hai người cùng nhìn theo.' + tamma(-8); } },
        { t: 'Giữ khoảng cách — đạo tâm là trên hết', fn: () => { relChange(n, -8); return `Ngươi viện cớ tu luyện, cáo từ về trước. ${n.name} ngồi lại một mình.` + statUp('tam', 1); } },
      ];
    },
  },

  // ----- Kết làm đạo lữ (chuỗi) -----
  {
    id: 'life_daolu_propose',
    where: ['any'],
    w: 6,
    cd: 5,
    minAge: 16,
    cond: () => exists((n) => plain(n) && n.rel >= 80 && n.r >= 1 && !isChild(n)),
    title: 'Ngọc bội đôi',
    text: () => {
      const n = choose((x) => plain(x) && x.rel >= 80 && x.r >= 1 && !isChild(x));
      return `${n.name} đặt vào tay ngươi một nửa miếng ngọc bội, nửa kia đeo trên cổ ${he(n)}. "Ta không giỏi nói. Đường tu dài lắm. Ta muốn đi cùng ngươi tới cuối — nếu ngươi chịu."`;
    },
    ch: () => {
      const n = the((x) => plain(x));
      const wed = (big: boolean) => {
        wedDaolu(n);
        n.rel = 100;
        mark(`Kết làm đạo lữ với ${n.name}`);
        return big;
      };
      return [
        {
          t: 'Nhận ngọc bội',
          cls: 'prime',
          fn: (): Outcome => ({
            text: `Ngươi siết miếng ngọc. Nó còn ấm hơi người. ${n.name} cười — lần đầu ngươi thấy ${he(n)} cười mà nước mắt rơi.`,
            choices: [
              {
                t: `Mở đại lễ, mời bạn bè (${fmt(M(40))} linh thạch)`,
                dis: !canPay(M(40)),
                fn: () => {
                  s.money -= M(40);
                  wed(true);
                  fame(20);
                  for (const f of s.npcs) if (f.alive && f.rel >= 40 && f.id !== n.id) relChange(f, 5);
                  return 'Đèn lồng đỏ treo kín sân. Bạn cũ tới đông đủ, uống tới say mềm. Có người hát, có người khóc. Từ nay, trên đường cầu đạo ngươi không còn một mình.' + tamma(-20);
                },
              },
              { t: 'Chỉ hai người bái thiên địa', fn: () => { wed(false); return 'Không khách khứa, không kèn trống. Hai người quỳ trước trời đất, ba lạy, một chén rượu. Đủ rồi.' + tamma(-20) + statUp('tam', 1); } },
            ],
          }),
        },
        { t: 'Trả lại ngọc bội', fn: () => { relChange(n, -30); return `${n.name} nhận lại, cười: "Ta biết mà." Đêm ấy ${he(n)} rời đi, không từ biệt.` + tamma(10); } },
      ];
    },
  },

  // ----- Song tu -----
  {
    id: 'life_daolu_songtu',
    where: ['cult', 'sect', 'town', 'village'],
    w: 5,
    minR: 1,
    cd: 6,
    cond: () => !!daolu() && daolu()!.r >= 1,
    title: 'Song tu',
    text: () => {
      const n = daolu()!;
      s.flags[EVK] = n.id;
      return `${n.name} đẩy cửa động phủ bước vào, mang theo mùi trà và hơi sương. "Ta vừa nghĩ thông một đoạn pháp quyết. Cùng tu đi."`;
    },
    ch: () => {
      const n = the((x) => x.tag === 'daolu');
      return [
        {
          t: 'Song tu',
          cls: 'prime',
          fn: () => {
            setFlag('daolu_bonus');
            relChange(n, 5);
            if (n.st < 3 && ch(0.4)) n.st++;
            return 'Chân nguyên hai người tuần hoàn như âm dương xoay vần. Từ nay mỗi lần nhập định, ngươi đều cảm thấy một hơi thở khác hòa cùng mình.' + cult(ri(20, 35)) + tamma(-10);
          },
        },
        { t: 'Ngồi luận đạo', fn: () => { relChange(n, 5); return `${n.name} nói, ngươi nghe. Có chỗ ${he(n)} sai, ngươi chỉ ra; có chỗ ngươi mù mờ, ${he(n)} vẽ ra bằng một cành cây trên đất.` + cult(15) + (ch(0.2) ? statUp('ngo', 1) : ''); } },
      ];
    },
  },

  // ----- Đạo lữ hộ pháp lúc bế quan -----
  {
    id: 'life_daolu_guard',
    where: ['cult'],
    w: 4,
    cd: 10,
    cond: () => !!daolu(),
    title: 'Người canh cửa',
    text: () => {
      const n = daolu()!;
      return `Xuất quan, ngươi thấy ${n.name} ngồi tựa cửa đá, áo phủ đầy lá rụng. Ba con yêu thú nằm chết dưới chân núi. ${He(n)} ngẩng lên, cười mệt mỏi: "Xong rồi à? Ta nấu cháo."`;
    },
    ch: () => [
      {
        t: 'Ôm lấy',
        cls: 'prime',
        fn: () => {
          const n = daolu()!;
          relChange(n, 5);
          return 'Cháo nguội, nhưng ngươi ăn hết. Tâm trí tĩnh như mặt hồ không gió.' + tamma(-15) + cult(12);
        },
      },
    ],
  },

  // ----- Đạo lữ gặp nạn (chuỗi) -----
  {
    id: 'life_daolu_peril',
    where: ['any'],
    w: 4,
    minR: 1,
    cd: 25,
    cond: () => !!daolu() && daolu()!.r >= 1,
    title: 'Mệnh bài nứt',
    text: () => {
      const n = daolu()!;
      s.flags[EVK] = n.id;
      return `Mệnh bài của ${n.name} ngươi luôn mang bên người bỗng nứt một đường dài. Phù truyền âm vang lên đứt quãng: "…bị vây ở hẻm núi… đừng tới…" rồi im bặt.`;
    },
    ch: () => {
      const n = the((x) => x.tag === 'daolu');
      const die = () => {
        killNpc(n, 'chết khi bị vây ở hẻm núi');
        if (!daolu()) s.flags.daolu_bonus = false;
        mark(`Đạo lữ ${n.name} tử nạn`);
        return tamma(35);
      };
      return [
        {
          t: 'Lập tức lên đường',
          cls: 'danger',
          fn: (): Outcome => {
            years(0.1);
            const d = duel(cultivator('Kẻ cầm đầu vây công', ri(0, 1), 1.1));
            if (d.win) {
              relChange(n, 10);
              mark(`Liều chết cứu đạo lữ ${n.name}`);
              return `${d.t} ${n.name} nằm giữa vòng máu, còn thở. ${He(n)} túm vạt áo ngươi: "Đã bảo đừng tới…" rồi ngất đi trong tay ngươi.` + statUp('tam', 1);
            }
            if (d.died) return d.t;
            return {
              text: `${d.t} Kẻ địch lôi ${n.name} đi, để lại lời nhắn: "${fmt(M(150))} linh thạch, mười ngày."`,
              choices: [
                { t: 'Gom tiền chuộc người', dis: !canPay(M(150)), fn: () => { s.money -= M(150); relChange(n, 10); return `Ngươi bán gần hết gia sản. ${n.name} trở về, gầy rộc, nhưng còn sống. Thế là đủ.`; } },
                { t: 'Liều đánh lần nữa', cls: 'danger', fn: () => { const d2 = duel(cultivator('Kẻ cầm đầu vây công', 0, 1.2)); return d2.win ? `${d2.t} Ngươi phá cửa ngục, cõng ${n.name} ra trong đêm.` : `${d2.t} Khi ngươi tỉnh lại, chỉ còn một nửa ngọc bội đẫm máu.` + die(); } },
              ],
            };
          },
        },
        { t: 'Nghe lời, không tới', fn: () => `Ngươi ngồi bất động suốt đêm. Gần sáng, mệnh bài vỡ vụn trong tay. ${n.name} không bao giờ trở về nữa.` + die() },
      ];
    },
  },

  // ----- Sư phụ truyền thụ -----
  {
    id: 'life_master_teach',
    where: ['any'],
    w: 5,
    cd: 10,
    cond: () => !!master() && master()!.rel >= 40,
    title: 'Sư phụ truyền pháp',
    text: () => {
      const m = master()!;
      s.flags[EVK] = m.id;
      return `Phù truyền âm của sư phụ ${m.name}: "Lại đây." Ngươi tới, thấy ${he(m)} đứng chắp tay trên vách đá, gió thổi tung tà áo. "Tu vi ngươi đã tới lúc cần thứ khác. Ngươi muốn học gì?"`;
    },
    ch: () => {
      const m = the((x) => x.tag === 'master');
      const tid = techFor(clamp(Math.ceil(m.r / 2), 1, 4));
      const kid = skillFor(clamp(Math.ceil(m.r / 2), 1, 4));
      const out: Choice[] = [];
      if (tid && TECHS[tid].tier > curTier()) out.push({ t: `Xin công pháp (${TECHS[tid].n})`, cls: 'prime', fn: () => { relChange(m, 3); return `${m.name} đặt hai ngón tay lên trán ngươi. Từng câu khẩu quyết chảy vào thần thức.` + learnTech(tid); } });
      if (kid) out.push({ t: `Xin thuật pháp (${SKILLS[kid].n})`, fn: () => { relChange(m, 3); return `${m.name} diễn một lần. Ngươi tập ba tháng mới được bảy phần.` + learnSkill(kid); } });
      out.push({ t: 'Hỏi về tâm cảnh', fn: () => { relChange(m, 8); return `${m.name} im lặng một lúc: "Đừng sợ cái chết, cũng đừng sợ sống lâu. Cả hai đều cô độc như nhau." Ngươi về ngồi nghĩ suốt một tháng.` + tamma(-20) + statUp('tam', 1); } });
      return out;
    },
  },

  // ----- Sư phụ thọ tận (chuỗi) -----
  {
    id: 'life_master_last',
    where: ['any'],
    w: 6,
    cd: 20,
    cond: () => !!master() && master()!.life - npcAge(master()!) <= 12 && master()!.rel >= 20,
    title: 'Ngọn đèn sắp tắt',
    text: () => {
      const m = master()!;
      s.flags[EVK] = m.id;
      return `Tin báo: sư phụ ${m.name} thọ nguyên sắp cạn. ${He(m)} không bế quan nữa, chỉ ngồi trước động phủ nhìn mây, hỏi mấy lần: "Đồ đệ ta đâu?"`;
    },
    ch: () => {
      const m = the((x) => x.tag === 'master');
      return [
        {
          t: 'Về hầu hạ tới cuối',
          cls: 'prime',
          fn: (): Outcome => {
            years(1);
            return {
              text: `Một năm ngươi pha trà, quét lá, nghe ${he(m)} kể chuyện thời trẻ. Đêm cuối, ${m.name} nắm tay ngươi: "Ta còn hai thứ. Một là tu vi cả đời, hai là chút đồ lặt vặt. Ngươi chọn."`,
              choices: [
                { t: 'Nhận truyền công', cls: 'prime', fn: () => { killNpc(m, 'thọ tận, tọa hóa trong vòng tay đồ đệ'); mark(`Tiễn sư phụ ${m.name} tọa hóa, nhận truyền công`); return `Một luồng ấm nóng chảy vào đan điền. Khi ngươi mở mắt, ${m.name} đã nhắm mắt, môi còn vương nụ cười.` + cult(ri(80, 120)) + tamma(-10); } },
                { t: 'Nhận di vật', fn: () => { killNpc(m, 'thọ tận, tọa hóa trong vòng tay đồ đệ'); mark(`Tiễn sư phụ ${m.name} tọa hóa`); return `${m.name} cười: "${s.g === 'm' ? 'Thằng ngốc' : 'Con bé ngốc'}. Thôi được." Sáng ra, ngươi chôn ${he(m)} dưới gốc tùng, mang theo chiếc túi cũ.` + giveGear(Math.min(RMAX(), m.r), 3) + gain(breakPill(), 1, 2) + statUp('tam', 1); } },
              ],
            };
          },
        },
        { t: 'Bận việc, gửi thư hỏi thăm', fn: () => { killNpc(m, 'thọ tận, tọa hóa một mình'); return `Thư tới nơi thì ${m.name} đã đi được ba ngày. Tiểu đồng nói, lúc cuối ${he(m)} vẫn nhìn về phía cổng.` + tamma(25); } },
      ];
    },
  },

  // ----- Thu đồ đệ (chuỗi) -----
  {
    id: 'life_take_disciple',
    where: ['any'],
    w: 4,
    minR: 3,
    cd: 20,
    cond: () => live((n) => n.tag === 'disciple').length < 3,
    title: 'Đứa trẻ quỳ trong tuyết',
    text: () => 'Ba ngày ba đêm có một đứa trẻ quỳ trước cửa động phủ. Tuyết phủ trắng vai, môi tím tái, lưng vẫn thẳng. "Xin tiên trưởng thu nhận. Con không có gì, chỉ có cái mạng."',
    ch: () => [
      {
        t: 'Thu nhận',
        cls: 'prime',
        fn: (): Outcome => {
          const d = meet({ tag: 'disciple', dr: -2, rel: 50, age: ri(10, 15), sect: s.sect?.id ?? null, how: 'Đồ đệ ngươi nhặt về từ tuyết' });
          s.flags[EVK] = d.id;
          mark(`Thu ${d.name} làm đồ đệ`);
          return {
            text: `Ngươi đặt cho nó cái tên trong môn là ${d.name}. Đêm đầu tiên, nó ngủ gục bên bếp lửa, tay vẫn nắm chặt vạt áo ngươi. Dạy nó thế nào đây?`,
            choices: [
              { t: 'Nghiêm khắc như sắt', fn: () => { d.talent += 0.25; relChange(d, -5); return 'Sáng gánh nước, trưa luyện quyền, tối chép kinh. Nó khóc, nhưng không bỏ. Tu vi nó lên nhanh hơn người thường.'; } },
              { t: 'Dịu dàng như cha mẹ', fn: () => { relChange(d, 25); return 'Ngươi dạy nó đọc chữ trước khi dạy dẫn khí. Nó cười nhiều hơn. Có lẽ đó cũng là một loại đạo.' + tamma(-10); } },
            ],
          };
        },
      },
      { t: 'Cho ít linh thạch, bảo về', fn: () => 'Đứa trẻ nhận, dập đầu, rồi lảo đảo đi trong tuyết. Ngươi không biết nó sẽ về đâu.' + money(-M(3)) + tamma(4) },
    ],
  },

  // ----- Đồ đệ: hiếu kính hay phản sư -----
  {
    id: 'life_disciple_turn',
    where: ['any'],
    w: 4,
    cd: 12,
    cond: () => exists((n) => n.tag === 'disciple' && s.year - n.met >= 5),
    title: 'Đồ đệ trưởng thành',
    text: () => {
      const d = choose((n) => n.tag === 'disciple' && s.year - n.met >= 5);
      if (d.rel < 15) return `${d.name} đã ${realmN(d.r)}. Mấy năm nay nó ít khi tới vấn an. Sáng nay, ngươi phát hiện kho đan dược trống trơn, cùng một mẩu giấy: "Sư phụ dạy ta được bao nhiêu? Ta tự đi tìm đạo."`;
      return `${d.name} giờ đã ${realmN(d.r)}, không còn là đứa trẻ quỳ trong tuyết. Nó mang về một bọc đồ, quỳ xuống: "Đồ nhi đi lịch luyện, kiếm được ít thứ. Sư phụ đừng chê."`;
    },
    ch: () => {
      const d = the((n) => n.tag === 'disciple');
      if (d.rel < 15)
        return [
          { t: 'Đuổi theo đòi lại', cls: 'danger', fn: () => { d.tag = 'enemy'; relChange(d, -50); const r = duel(foeOf(d), { lethal: false }); return r.win ? `${r.t} Ngươi lấy lại đồ, nhưng đứa trò cũ thì mất hẳn. ${d.name} lau máu, không nhìn ngươi nữa.` : `${r.t} Học trò đánh thắng thầy. Ngươi ngồi giữa đường rất lâu.` + tamma(20); } },
          { t: 'Để nó đi', fn: () => { d.tag = 'acq'; d.rel = -10; return 'Ngươi gấp mẩu giấy lại. Có lẽ ngươi đã dạy nó sai từ đầu.' + money(-M(10)) + statUp('tam', 1); } },
        ];
      return [
        { t: 'Nhận lấy, xoa đầu nó', cls: 'prime', fn: () => { relChange(d, 10); return `${d.name} cười toe như ngày nhỏ.` + gain(herb(), 2) + money(M(10)); } },
        { t: 'Bảo nó giữ mà dùng, truyền thêm một chiêu', fn: () => { relChange(d, 20); d.talent += 0.1; good(1); return 'Ngươi diễn một lần chiêu tâm đắc nhất. Mắt nó sáng rực.' + statUp('tam', 1); } },
      ];
    },
  },

  // ----- Đồ đệ gây chuyện -----
  {
    id: 'life_disciple_trouble',
    where: ['any'],
    w: 3,
    cd: 15,
    cond: () => exists((n) => n.tag === 'disciple'),
    title: 'Đồ đệ gây họa',
    text: () => {
      const d = choose((n) => n.tag === 'disciple');
      return `Một tu sĩ râu đỏ xách cổ ${d.name} tới trước cửa: "Đồ đệ ngươi đánh gãy tay đồ đệ ta. Ngươi tính sao?" ${d.name} mặt sưng vù, cắn môi: "Là bọn chúng ức hiếp dân làng trước!"`;
    },
    ch: () => {
      const d = the((n) => n.tag === 'disciple');
      return [
        {
          t: 'Bênh đồ đệ',
          cls: 'danger',
          fn: () => {
            relChange(d, 25);
            const r = duel(cultivator('Tu sĩ râu đỏ', 0, 1), { lethal: false });
            return r.win ? `${r.t} Lão râu đỏ lủi mất. ${d.name} nhìn ngươi như nhìn núi Thái Sơn.` + (fame(5), '') : `${r.t} Ngươi thua, nhưng ${d.name} đỡ ngươi về, vừa đi vừa khóc.`;
          },
        },
        { t: 'Hỏi rõ đầu đuôi rồi xử công bằng', fn: () => { relChange(d, 10); good(1); return `Ngươi đi một vòng hỏi dân làng. Sự thật đúng như ${d.name} nói. Lão râu đỏ đỏ mặt bỏ đi, ${d.name} thì học được rằng đúng thôi chưa đủ, còn phải có chứng cứ.`; } },
        { t: 'Bắt đồ đệ quỳ xin lỗi', fn: () => { relChange(d, -25); return `${d.name} quỳ, mắt đầy oán hận. Lão râu đỏ hài lòng bỏ đi. Đêm đó đứa trò không ăn cơm.` + tamma(5); } },
      ];
    },
  },

  // ----- Con cái -----
  {
    id: 'life_child_born',
    where: ['any'],
    w: 4,
    minAge: 18,
    cd: 25,
    cond: () => !!daolu() && live(isChild).length < 3,
    title: 'Tiếng khóc trẻ thơ',
    text: () => {
      const n = daolu()!;
      return `${n.name} đặt tay ngươi lên ${n.g === 'f' ? 'bụng mình' : 'bụng ngươi'}, cười như trẻ con: "Có rồi." Tu sĩ có con muộn và khó; vậy mà trời đã cho. Chín tháng sau, tiếng khóc đầu đời vang khắp động phủ.`;
    },
    ch: () => {
      const g: 'm' | 'f' = ch(0.5) ? 'm' : 'f';
      const names = [pick(g === 'm' ? MALE : FEM), pick(g === 'm' ? MALE : FEM)].filter((v, i, a) => a.indexOf(v) === i);
      return names.map((nm) => ({
        t: `Đặt tên ${surname()} ${nm}`,
        fn: () => {
          const c = meet({ name: `${surname()} ${nm}`, g, r: 0, age: 0, rel: 85, tag: 'kin', sect: null, talent: 0, how: `${g === 'm' ? 'Con trai' : 'Con gái'} của ngươi và ${daolu()?.name ?? 'đạo lữ'}` });
          childIds().push(c.id);
          s.flags['lifePot_' + c.id] = rf(0.6, 1.5); // tư chất tiềm ẩn, chỉ bộc lộ khi bắt đầu tu
          mark(`${g === 'm' ? 'Con trai' : 'Con gái'} ${c.name} chào đời`);
          return `${c.name}. Đứa bé nắm ngón tay ngươi, không chịu buông. Lần đầu tiên, ngươi thấy trường sinh không phải điều duy nhất đáng cầu.` + tamma(-20);
        },
      }));
    },
  },

  // ----- Hậu duệ trưởng thành -----
  {
    id: 'life_child_grow',
    where: ['any'],
    w: 5,
    cd: 15,
    cond: () => exists((n) => isChild(n) && npcAge(n) >= 12 && !s.flags['lifeGrown_' + n.id]),
    title: 'Con đã lớn',
    text: () => {
      const c = choose((n) => isChild(n) && npcAge(n) >= 12 && !s.flags['lifeGrown_' + n.id]);
      setFlag('lifeGrown_' + c.id);
      return `${c.name} năm nay ${npcAge(c)} tuổi, cao gần bằng ngươi. ${c.g === 'm' ? 'Nó' : 'Con bé'} đứng trước mặt ngươi, giọng run mà kiên quyết: "Con muốn tự chọn con đường của mình."`;
    },
    ch: () => {
      const c = the(isChild);
      const out: Choice[] = [
        { t: 'Tự tay truyền công pháp', cls: 'prime', fn: () => { if (c.r === 0) { c.r = 1; c.st = 0; } c.talent = pot(c) + 0.2; relChange(c, 10); return `Ngươi dạy ${c.name} từng hơi thở. Ba tháng sau, lần đầu tiên linh khí chảy vào đan điền ${c.g === 'm' ? 'nó' : 'con bé'}. Hai cha con cùng cười như điên.`; } },
        { t: 'Để con tự chọn', fn: () => { relChange(c, 20); if (ch(0.5)) { c.talent = 0; c.r = 0; return `${c.name} chọn làm phàm nhân, mở một tiệm sách ở thành. Ngươi buồn mất mấy ngày, rồi thấy nhẹ nhõm lạ.` + statUp('tam', 1); } c.r = Math.max(1, c.r); c.talent = Math.max(c.talent, pot(c)); return `${c.name} chọn tu tiên, nhưng muốn tự đi. Ngươi đứng ở cổng nhìn theo bóng ${c.g === 'm' ? 'nó' : 'con bé'} xa dần.` + statUp('tam', 1); } },
      ];
      if (s.sect) out.push({ t: `Gửi vào ${sectName()}`, fn: () => { c.sect = s.sect!.id; if (c.r === 0) c.r = 1; c.talent = Math.max(c.talent, pot(c)); relChange(c, 5); return `${c.name} trở thành đệ tử ${sectName()}. Ngươi dặn chấp sự đừng ưu ái — rồi lén gửi thêm một bình đan.` ; } });
      return out;
    },
  },

  // ----- Người thân phàm trần -----
  {
    id: 'life_kin_farewell',
    where: ['any'],
    w: 5,
    cd: 10,
    cond: () => exists((n) => n.tag === 'kin' && n.r === 0 && !isChild(n) && npcAge(n) >= 55),
    title: 'Thư nhà',
    text: () => {
      const k = choose((n) => n.tag === 'kin' && n.r === 0 && !isChild(n) && npcAge(n) >= 55);
      return `Một lá thư nhà, chữ xiêu vẹo: "${k.name} bệnh nặng, nằm liệt đã ba tháng, đêm nào cũng gọi tên con." Đã bao năm ngươi chưa về?`;
    },
    ch: () => {
      const k = the((n) => n.tag === 'kin' && n.r === 0);
      return [
        {
          t: 'Về ngay',
          cls: 'prime',
          fn: () => {
            years(0.3);
            killNpc(k, 'thọ tận, mất trong vòng tay con cháu');
            mark(`Về tiễn ${k.name} lần cuối`);
            return `Nhà cũ thấp hơn trong trí nhớ. ${k.name} gầy như que củi, nhưng vẫn nhận ra ngươi. Ngươi truyền chân khí, giữ được thêm ba tháng. Ba tháng ấy ${he(k)} cười nhiều hơn mười năm cộng lại. Rồi một buổi sáng, ${he(k)} đi, nhẹ như lá rụng.` + tamma(-15) + statUp('tam', 1);
          },
        },
        { t: `Gửi linh thạch về (${fmt(M(8))})`, dis: !canPay(M(8)), fn: () => { s.money -= M(8); killNpc(k, 'bệnh mất ở quê nhà'); return `Linh thạch tới, người đã đi. Hàng xóm nói ${k.name} cầm túi tiền, cười bảo: "Nó vẫn nhớ."` + tamma(12); } },
        { t: 'Tu đạo phải đoạn tình', fn: () => { killNpc(k, 'bệnh mất ở quê nhà'); return 'Ngươi gấp lá thư, tiếp tục ngồi thiền. Nhưng đêm đó, câu khẩu quyết quen thuộc cứ đọc sai mãi.' + tamma(22); } },
      ];
    },
  },

  // ----- Đối thủ thách đấu -----
  {
    id: 'life_rival_duel',
    where: ['town', 'market', 'sect', 'road', 'wild'],
    w: 5,
    minR: 1,
    cd: 8,
    cond: () => exists((n) => n.tag === 'rival' && n.r >= 1),
    title: 'Chiến thư',
    text: () => {
      const n = choose((x) => x.tag === 'rival' && x.r >= 1);
      return `Một thanh phi kiếm cắm phập xuống trước mặt ngươi, chuôi buộc chiến thư: "Đỉnh Vọng Phong, ba ngày sau. — ${n.name}". ${n.name} nay đã là ${realmN(n.r)}.`;
    },
    ch: () => {
      const n = the((x) => x.tag === 'rival');
      return [
        {
          t: 'Ứng chiến',
          cls: 'prime',
          fn: () => {
            const d = duel(foeOf(n), { lethal: false, noLoot: true });
            if (d.win) {
              fame(20);
              relChange(n, 15);
              if (n.rel >= 30) { n.tag = 'friend'; return `${d.t} ${n.name} nằm ngửa trên cỏ, bật cười: "Đánh không lại ngươi cả đời mất. Thôi, uống rượu." Từ đối thủ thành tri kỷ — chuyện ấy trên đời không hiếm.` + statUp('tam', 1); }
              return `${d.t} ${n.name} nghiến răng: "Lần sau." Có một kẻ đuổi theo sau lưng, ngươi không dám lười.` + cult(15);
            }
            relChange(n, 5);
            return `${d.t} ${n.name} thu kiếm, không chế giễu: "Ngươi chậm lại rồi."` + tamma(8) + statUp('tam', 1);
          },
        },
        { t: 'Gửi thư từ chối', fn: () => { relChange(n, -15); fame(-10); return `Hôm sau khắp phường thị đồn ngươi sợ ${n.name}.` + tamma(6); } },
      ];
    },
  },

  // ----- Gặp thiên kiêu — sinh ra đối thủ -----
  {
    id: 'life_rival_meet',
    where: ['town', 'market', 'sect'],
    w: 3,
    minR: 1,
    cd: 20,
    cond: () => live((n) => n.tag === 'rival').length < 2,
    title: 'Thiên kiêu',
    text: () => {
      const n = meet({ dr: 0, tag: 'peer', rel: -5, talent: rf(1.2, 1.6), how: 'Thiên kiêu cùng thế hệ' });
      s.flags[EVK] = n.id;
      return `Trên lầu trà, một ${n.g === 'm' ? 'thanh niên' : 'thiếu nữ'} áo xanh độc chiếm cả bàn giữa. Đó là ${npcTitle(n)}, nghe nói cùng tuổi ngươi mà chưa từng bại. ${He(n)} liếc ngươi: "Ngươi là người được gọi là thiên tài? Trông không giống lắm."`;
    },
    ch: () => {
      const n = the((x) => x.tag === 'peer');
      return [
        { t: 'Hẹn ngày phân cao thấp', cls: 'prime', fn: () => { n.tag = 'rival'; relChange(n, -10); return `"Mười năm," ngươi nói. ${n.name} cười lớn: "Ta đợi." Từ đó, mỗi lần muốn lười, ngươi lại nhớ tới nụ cười ấy.` + statUp('tam', 1); } },
        { t: 'Cười xòa, mời một chén trà', fn: () => { relChange(n, 25); return `${n.name} ngẩn ra, rồi ngồi xuống. Hóa ra thiên kiêu cũng cô đơn.`; } },
      ];
    },
  },

  // ----- Cố nhân say rượu -----
  {
    id: 'life_old_friend_drink',
    where: ['town', 'market', 'village'],
    w: 5,
    cd: 6,
    cond: () => exists((n) => plain(n) && n.rel >= 50),
    title: 'Rượu cũ người xưa',
    text: () => {
      const n = choose((x) => plain(x) && x.rel >= 50);
      return `Trong tửu lâu, có người vỗ vai ngươi từ phía sau. Là ${n.name}! Mấy năm không gặp, ${he(n)} ${n.r > effRi() ? 'đã vượt ngươi một bậc' : n.r < effRi() ? 'tóc mai đã điểm bạc' : 'vẫn như xưa'}. "Hôm nay không say không về!"`;
    },
    ch: () => {
      const n = the((x) => plain(x));
      return [
        { t: 'Say một trận', cls: 'prime', fn: () => { relChange(n, 10); return 'Uống tới khi quán đóng cửa. Kể chuyện cũ, khóc rồi cười. Sáng ra đầu đau như búa bổ, lòng nhẹ như mây.' + tamma(-15); } },
        { t: 'Luận đạo bên chén trà', fn: () => { relChange(n, 6); return `${n.name} kể những gì ${he(n)} ngộ ra mấy năm qua. Có một câu đáng giá mười năm khổ tu.` + cult(ri(12, 20)); } },
        { t: 'Tặng một món đồ làm kỷ niệm', fn: () => { relChange(n, 15); return `${n.name} cầm lấy, ngắm mãi. "Ta sẽ giữ tới chết."` + money(-M(5)); } },
      ];
    },
  },

  // ----- Tảo mộ -----
  {
    id: 'life_grave',
    where: ['village', 'town', 'wild', 'sect'],
    w: 3,
    cd: 12,
    cond: () => s.npcs.some((n) => !n.alive && n.rel >= 50 && !s.flags['lifeGrave_' + n.id]),
    title: 'Nấm mộ cỏ xanh',
    text: () => {
      const l = s.npcs.filter((n) => !n.alive && n.rel >= 50 && !s.flags['lifeGrave_' + n.id]);
      const n = pick(l);
      s.flags[EVK] = n.id;
      setFlag('lifeGrave_' + n.id);
      return `Đi ngang một ngọn đồi, ngươi chợt nhớ ${n.name} được chôn ở đây. ${He(n)} đã ${n.cause || 'qua đời'}. Cỏ mọc cao tới gối, bia đá nghiêng.`;
    },
    ch: () => [
      { t: 'Nhổ cỏ, rót một chén rượu', cls: 'prime', fn: () => 'Ngươi ngồi tới khi mặt trời lặn, kể cho nấm mộ nghe những năm qua. Gió thổi qua cỏ như tiếng ai đó cười.' + tamma(-15) + (ch(0.3) ? statUp('tam', 1) : '') },
      { t: 'Cúi đầu rồi đi', fn: () => 'Người sống còn phải đi tiếp.' + tamma(-5) },
    ],
  },

  // ----- Hậu nhân kẻ bị giết tìm báo thù (chuỗi) -----
  {
    id: 'life_revenge_heir',
    where: ['road', 'wild', 'town', 'market'],
    w: 4,
    cd: 15,
    cond: () => ((s.flags.lifeSlain || []) as { y: number; done?: boolean }[]).some((x) => !x.done && s.year - x.y >= 8),
    title: 'Món nợ máu',
    text: () => {
      const e = ((s.flags.lifeSlain || []) as { name: string; y: number; done?: boolean }[]).find((x) => !x.done && s.year - x.y >= 8)!;
      e.done = true;
      const n = meet({ dr: 0, tag: 'enemy', rel: -80, talent: 1.3, how: `Hậu nhân của ${e.name}, kẻ bị ngươi giết` });
      s.flags[EVK] = n.id;
      return `Một ${n.g === 'm' ? 'thanh niên' : 'thiếu nữ'} chặn đường, tay nắm chặt chuôi kiếm đến trắng bệch. "Ngươi còn nhớ ${e.name} không? Ta là ${n.name}. ${Math.floor(s.year - e.y)} năm, ta chỉ sống vì ngày này."`;
    },
    ch: () => {
      const n = the((x) => x.tag === 'enemy');
      return [
        {
          t: 'Ứng chiến',
          cls: 'danger',
          fn: (): Outcome => {
            const d = duel(foeOf(n));
            if (!d.win) return d.t;
            return {
              text: `${d.t} ${n.name} gục xuống, nước mắt hòa máu: "Giết ta đi. Rồi con ta sẽ tìm ngươi."`,
              choices: [
                { t: 'Diệt cỏ tận gốc', cls: 'danger', fn: () => { killNpc(n, 'bị ngươi chém chết', true); evil(2); return 'Ngươi hạ kiếm. Vòng thù hận khép lại một nút, mở ra một nút khác ở đâu đó.' + tamma(12); } },
                { t: 'Tha, nói rõ nhân quả', fn: () => { n.rel = -30; good(2); return `Ngươi kể lại chuyện năm xưa, không thêm không bớt. ${n.name} im lặng rất lâu, rồi bỏ đi. Có lẽ ${he(n)} sẽ quay lại; có lẽ không.` + statUp('tam', 1); } },
              ],
            };
          },
        },
        { t: `Bồi thường (${fmt(M(60))} linh thạch)`, dis: !canPay(M(60)), fn: () => { s.money -= M(60); relChange(n, 40); return `${n.name} ném túi linh thạch xuống đất, nhưng rồi vẫn nhặt lên. "Đừng để ta gặp lại ngươi."`; } },
      ];
    },
  },
]);

// ---------------------------------------------------------------- C. BẾ QUAN

register([
  // ----- Đốn ngộ -----
  {
    id: 'life_cult_epiphany',
    where: ['cult'],
    w: 4,
    minR: 1,
    cd: 12,
    title: 'Đốn ngộ',
    text: () => 'Một giọt nước rơi từ nhũ đá xuống, tách. Không hiểu vì sao, tiếng ấy như gõ thẳng vào thức hải. Những đoạn pháp quyết rời rạc bỗng nối lại thành một dòng sông.',
    ch: () => [
      {
        t: 'Buông hết, thuận theo',
        cls: 'prime',
        fn: () => {
          if (ch(0.15 + stat('ngo') * 0.02)) return 'Ngươi ngồi bất động bảy ngày bảy đêm. Khi mở mắt, trời đất như trong hơn một tầng.' + cult(ri(80, 120)) + statUp('ngo', 1);
          return 'Dòng sông chảy qua rồi tan. Còn lại không nhiều, nhưng là của ngươi.' + cult(ri(25, 40));
        },
      },
      { t: 'Vội ghi lại vào ngọc giản', fn: () => { s.techM = clamp(s.techM + 15, 0, 100); return 'Ghi được bảy phần, ba phần trôi mất. Nhưng bảy phần ấy khắc sâu vào công pháp.' + cult(15) + ' (Thuần thục công pháp tăng)'; } },
    ],
  },

  // ----- Linh khí bạo động (chuỗi) -----
  {
    id: 'life_cult_surge',
    where: ['cult'],
    w: 4,
    cd: 10,
    title: 'Linh khí bạo động',
    text: () => 'Đất rung nhẹ. Linh mạch dưới động phủ đột nhiên trào lên, linh khí đặc tới mức đọng thành sương trên vách đá, cuộn quanh người ngươi như thác lũ.',
    ch: () => [
      {
        t: 'Mở toàn bộ kinh mạch hấp thu',
        cls: 'danger',
        fn: (): Outcome => {
          if (ch(0.35 + stat('can') * 0.04)) {
            return {
              text: 'Kinh mạch căng như dây đàn, nhưng chịu được. Linh khí cuồn cuộn chảy vào đan điền.' + cult(ri(50, 70)) + '\n\nKhi cơn lũ qua đi, ở mắt linh mạch đọng lại một vũng linh dịch sáng như bạc.',
              choices: [
                { t: 'Thu vào bình', fn: () => 'Để dành lúc cần.' + gain('x:linhtuyen') },
                { t: 'Uống ngay', fn: () => 'Mát lạnh tới tận xương.' + cult(25) },
              ],
            };
          }
          return 'Một mạch máu ở cổ tay nổ tung. Ngươi phải dừng lại, cố đẩy linh khí dư ra khỏi người.' + hurt(30) + cult(15);
        },
      },
      { t: 'Hấp thu từ từ', fn: () => 'Ngươi chỉ hút phần mình chịu được. Phần còn lại tản vào núi, cây cỏ quanh động phủ xanh tốt hẳn lên.' + cult(ri(20, 30)) },
      { t: 'Phong bế động phủ', fn: () => 'An toàn là trên hết. Ngươi đóng trận, chờ linh mạch lặng xuống.' + cult(8) },
    ],
  },

  // ----- Kẻ đột nhập động phủ (chuỗi) -----
  {
    id: 'life_cult_intruder',
    where: ['cult'],
    w: 3,
    minR: 1,
    cd: 12,
    title: 'Kẻ đột nhập',
    text: () => 'Cấm chế ngoài cửa động phủ rung lên. Có kẻ đang dùng phá cấm phù, từng lớp, từng lớp. Kẻ đó không biết ngươi đang ở bên trong.',
    ch: () => [
      {
        t: 'Mở cửa nghênh địch',
        cls: 'prime',
        fn: (): Outcome => {
          const d = duel(cultivator('Kẻ trộm bịt mặt', ri(-1, 0), 1));
          if (!d.win) return d.t + ' Hắn cuỗm theo ít linh thạch.' + money(-M(10));
          const foes = live((n) => n.tag === 'enemy' || n.rel <= -40);
          return {
            text: `${d.t} Kẻ trộm bị trói gô, mặt cắt không còn giọt máu.`,
            choices: [
              {
                t: 'Tra hỏi kẻ đứng sau',
                fn: () => {
                  if (foes.length && ch(0.6)) {
                    const e = pick(foes);
                    relChange(e, -10);
                    setFlag('lifeKnowFoe', e.id);
                    return `Hắn khai: ${e.name} trả tiền để hắn dò xét động phủ của ngươi. Ngươi ghi nhớ cái tên ấy thêm một lần nữa.`;
                  }
                  return 'Chỉ là một tán tu đói ăn. Hắn khóc lóc xin tha, dâng hết túi đồ.' + money(M(8));
                },
              },
              { t: 'Phế tu vi, ném xuống núi', cls: 'danger', fn: () => { evil(1); return 'Tiếng kêu thảm vọng mãi dưới thung. Từ đó không ai dám mò tới động phủ ngươi nữa.'; } },
              { t: 'Thả đi', fn: () => { good(1); return 'Hắn bò đi, ngoái lại vái ba vái.'; } },
            ],
          };
        },
      },
      { t: 'Gia cố cấm chế, mặc kệ', fn: () => 'Ngươi rót thêm chân nguyên vào trận. Bên ngoài vang lên tiếng chửi thề rồi tiếng bước chân xa dần.' + cult(5) },
    ],
  },

  // ----- Mộng cảnh tiền kiếp -----
  {
    id: 'life_cult_pastdream',
    where: ['cult'],
    w: 3,
    cd: 25,
    cond: () => meta.lives.length > 0,
    title: 'Mộng cảnh',
    text: () => {
      const l = pick(meta.lives);
      s.flags._lifeDream = l.name;
      return `Giữa nhập định, ngươi rơi vào một giấc mộng. Trong mộng, ngươi tên ${l.name}, ${l.realm}, đang ${l.cause ? `đối mặt với giây phút cuối: ${l.cause.toLowerCase()}` : 'đứng một mình trên đỉnh núi'}. Cảm giác ấy thật tới mức ngươi nghe được cả tiếng tim mình — tim của người kia.`;
    },
    ch: () => [
      {
        t: 'Đi sâu vào mộng',
        cls: 'prime',
        fn: () => {
          if (ch(0.5 + stat('tam') * 0.03)) return `Ngươi sống trọn một đời ${s.flags._lifeDream} trong một đêm. Tỉnh dậy, có những điều ngươi chưa từng học mà đã biết.` + cult(ri(20, 35)) + statUp('ngo', 1);
          return 'Mộng biến thành ác mộng. Ngươi chết thêm một lần nữa, đau như thật.' + tamma(15) + cult(10);
        },
      },
      { t: 'Cắt đứt, tỉnh lại', fn: () => 'Kiếp trước là kiếp trước. Ngươi mở mắt, lòng bình thản.' + statUp('tam', 1) },
    ],
  },

  // ----- Cảm ứng thiên địa -----
  {
    id: 'life_cult_resonance',
    where: ['cult'],
    w: 3,
    minR: 2,
    cd: 15,
    title: 'Cảm ứng thiên địa',
    text: () => {
      const e = pick(s.root.els);
      s.flags._lifeEl = e;
      const scene: Record<string, string> = {
        kim: 'Gió thu thổi qua, lá rụng như dao.',
        moc: 'Mưa xuân rơi, mầm non đội đất mà lên.',
        thuy: 'Mưa lớn ba ngày, suối dưới núi gầm như thú.',
        hoa: 'Núi lửa xa xa phun khói, đá dưới chân ấm lên.',
        tho: 'Đất dưới động phủ rên khẽ như có ai trở mình.',
        bang: 'Tuyết rơi lúc nửa đêm, nước trong bình đông thành băng.',
        loi: 'Sấm rền không ngớt, chớp xé ngang đỉnh núi.',
        phong: 'Gió lớn nổi lên, rít qua khe đá như sáo.',
      };
      return `${scene[e] || scene.tho} Linh căn hệ ${EL[e].n} trong người ngươi rung lên, như dây đàn gặp tiếng hòa.`;
    },
    ch: () => [
      { t: 'Thả thần thức hòa vào trời đất', cls: 'prime', fn: () => { s.techM = clamp(s.techM + 10, 0, 100); return 'Có một khắc, ngươi không còn biết đâu là mình, đâu là trời đất.' + cult(ri(25, 40)) + ' (Thuần thục công pháp tăng)'; } },
      { t: 'Ghi nhớ cảm giác, tiếp tục tu luyện', fn: () => 'Ngươi khắc cảm giác ấy vào lòng.' + cult(15) },
    ],
  },

  // ----- Tẩu hỏa nhập ma nhẹ -----
  {
    id: 'life_cult_qideviation',
    where: ['cult'],
    w: 3,
    minR: 1,
    cd: 10,
    title: 'Chân khí nghịch hành',
    text: () => 'Đang vận công tới đại chu thiên thứ chín, một luồng chân khí bỗng đi ngược, đâm vào mạch Nhâm. Ngực nóng như than, tay chân tê dại.',
    ch: () => {
      const out: Choice[] = [
        { t: 'Dừng ngay, tán công', fn: () => 'Ngươi tán một phần chân khí. Mất ít tu vi, giữ được kinh mạch.' + hurt(12) },
        {
          t: 'Cưỡng ép xông qua',
          cls: 'danger',
          fn: () => {
            if (ch(0.3 + stat('can') * 0.03 + stat('tam') * 0.03)) return 'Ngươi nghiến răng, đẩy luồng khí nghịch về đúng mạch. Một tiếng "bục" nhẹ, kinh mạch rộng thêm một phần.' + cult(ri(40, 60));
            return 'Máu trào khỏi miệng. Ngươi ngã vật ra, mắt hoa lên những ảo ảnh.' + hurt(40) + tamma(15);
          },
        },
      ];
      const hp = healPill();
      if (hasItem(hp)) out.push({ t: 'Nuốt đan chữa thương', fn: () => { lose(hp); return 'Dược lực mát lạnh dập tắt cơn nóng. Hữu kinh vô hiểm.' + heal(10) + cult(8); } });
      return out;
    },
  },
]);

// ---------------------------------------------------------------- D. ĐẠI SỰ THẾ GIỚI

register([
  // ----- Chiến tranh chính – ma (chuỗi) -----
  {
    id: 'life_world_war',
    where: ['town', 'sect', 'market'],
    w: 3,
    minR: 4,
    cd: 60,
    title: 'Chính ma đại chiến',
    text: () => `Huyết Sát Điện xua quân ra khỏi sa mạc Tây Lương, ba tòa thành biên giới cháy trong một đêm. Thái Huyền Đạo Tông phát Anh Hùng Thiếp khắp Thương Lan: tu sĩ ${realmN(4)} trở lên, mời tới tiền tuyến. Cùng lúc ấy, một sứ giả áo đỏ cũng tìm tới ngươi, mang theo một hộp gấm.`,
    ch: () => [
      {
        t: 'Ra tiền tuyến chính đạo',
        cls: 'prime',
        fn: (): Outcome => {
          setFlag('war_side', 'chinh');
          years(1);
          const d = duel(cultivator('Ma đạo trưởng lão', 0, 1.1));
          if (!d.win) return `${d.t} Ngươi được khiêng về hậu doanh. Một năm chiến sự, ngươi nằm hết nửa.` + (d.died ? '' : hurt(30) + tamma(10));
          fame(80);
          return {
            text: `${d.t} Phòng tuyến giữ được. Đêm ấy, thám tử báo: ma quân lui về một hang ổ ở hẻm núi, giữ trong đó hàng trăm phàm nhân bắt làm huyết thực.`,
            choices: [
              {
                t: 'Dẫn người đánh vào hang ổ',
                cls: 'danger',
                fn: () => {
                  const d2 = duel({ name: 'Huyết Sát hộ pháp', r: effRi(), st: 3, kind: 'boss', mult: 1.1 });
                  if (d2.win) { good(5); fame(150); mark('Phá hang ổ ma đạo, cứu trăm phàm nhân'); return `${d2.t} Cửa ngục mở ra. Những gương mặt gầy guộc nhìn ngươi như nhìn thần tiên.` + giveGear(effRi(), 3) + cult(40); }
                  return d2.t;
                },
              },
              { t: 'Giữ phòng tuyến, không mạo hiểm', fn: () => 'Ngươi giữ vững. Chiến công không lớn, nhưng người dưới quyền ngươi không ai chết.' + contrib(80) + money(M(40)) },
            ],
          };
        },
      },
      {
        t: 'Mở hộp gấm của sứ giả',
        cls: 'danger',
        fn: (): Outcome => ({
          text: `Trong hộp là một viên ${effRi() < 8 ? 'đan dược đột phá' : 'đan dược'} đỏ như máu, cùng một lá thư: "Đứng ngoài, hoặc đứng về phía ta. Viên đan này chỉ là quà gặp mặt."`,
          choices: [
            { t: 'Nhận, đứng về phía ma đạo', cls: 'danger', fn: () => { setFlag('war_side', 'ma'); evil(6); fame(-40); mark('Theo ma đạo trong chính ma đại chiến'); return 'Từ hôm nay, tên ngươi nằm trong danh sách của cả hai phe — một bên mời, một bên giết.' + gain(breakPill(), 1, 2) + money(M(80)); } },
            { t: 'Nhận quà, đứng ngoài', fn: () => { setFlag('war_side', 'none'); evil(1); return 'Ngươi bế quan suốt cuộc chiến. Khi khói tan, có người gọi ngươi là kẻ khôn, có người gọi ngươi là kẻ hèn.' + gain(breakPill(), 1, 1) + tamma(10); } },
            { t: 'Ném trả hộp gấm', fn: () => { setFlag('war_side', 'none'); return 'Sứ giả nhặt hộp, cười nhạt rồi biến mất trong khói đỏ.' + statUp('tam', 1); } },
          ],
        }),
      },
    ],
  },

  // ----- Thánh địa mở cửa (chuỗi) -----
  {
    id: 'life_world_holyland',
    where: ['town', 'sect', 'market'],
    w: 3,
    minR: 4,
    cd: 80,
    title: 'Tử Tiêu mở cửa',
    text: () => 'Mây tím từ phương đông kéo tới che nửa bầu trời. Tử Tiêu Tiên Cung — ngàn năm mới mở cửa một lần — đã hạ cầu vồng xuống biển mây. Ai qua được tầng cương phong, người ấy được vào.',
    ch: () => {
      const out: Choice[] = [];
      if (!s.sect)
        out.push({
          t: 'Xin bái nhập thánh địa',
          cls: 'prime',
          fn: () => {
            const c = canJoin('tutieu');
            if (!c.ok) return `Thủ môn thánh sứ chỉ liếc qua: "${c.why}" Cầu vồng tan dưới chân ngươi.`;
            mark('Bái nhập Tử Tiêu Tiên Cung');
            return 'Ngươi bước qua cương phong, áo rách tả tơi, nhưng tới nơi.\n\n' + joinSect('tutieu');
          },
        });
      out.push({
        t: 'Vào thánh cảnh tầm cơ duyên',
        fn: (): Outcome => {
          if (!ch(0.35 + stat('can') * 0.04)) return 'Cương phong như dao cạo. Ngươi bị thổi ngược ra ngoài, da thịt rướm máu.' + hurt(35);
          return {
            text: 'Qua tầng cương phong, ngươi đứng trên một quảng trường bằng mây đông đặc. Phía trước có hai con đường: một dẫn tới Lôi Trì, nơi thần lôi tụ thành hồ; một dẫn tới bức tường khắc kín đạo văn.',
            choices: [
              { t: 'Xuống Lôi Trì', cls: 'danger', fn: () => (ch(0.5 + stat('can') * 0.03) ? 'Ngươi ngâm mình trong sét tím ba ngày. Da tróc từng lớp, xương như được rèn lại.' + statUp('can', 2) + giveGear(effRi(), 3, undefined, 'loi') : 'Sét đánh tơi tả. Ngươi bò lên bờ, tóc dựng như lông nhím.' + hurt(40) + statUp('can', 1)) },
              { t: 'Ngồi trước tường đạo văn', fn: () => 'Đạo văn như sao, mỗi chữ một tinh thần. Ngươi ngồi tới khi thánh cảnh đóng cửa.' + cult(ri(100, 150)) + statUp('ngo', 1) },
            ],
          };
        },
      });
      out.push({ t: 'Đứng xa nhìn', fn: () => 'Cầu vồng tím tan dần. Ngàn năm nữa, liệu ngươi còn sống để thấy lại?' });
      return out;
    },
  },

  // ----- Đại năng tọa hóa để lại truyền thừa (chuỗi) -----
  {
    id: 'life_world_legacy',
    where: ['any'],
    w: 3,
    minR: 4,
    cd: 40,
    title: 'Đạo quang xung thiên',
    text: () => `Một cột sáng từ phương xa xuyên lên tầng mây, ba ngày không tắt. Ai cũng biết: một vị đại năng ${realmN(Math.min(RMAX(), effRi() + 2))} vừa tọa hóa, truyền thừa đang chờ người hữu duyên. Tu sĩ khắp nơi đổ về như kiến.`,
    ch: () => [
      {
        t: 'Tới tranh cơ duyên',
        cls: 'prime',
        fn: (): Outcome => {
          const r = meet({ dr: 0, tag: 'rival', rel: -30, talent: 1.3, how: 'Cùng tranh truyền thừa đại năng' });
          s.flags[EVK] = r.id;
          return {
            text: `Tới cửa động phủ của đại năng, chỉ còn ngươi và ${npcTitle(r)}. Thạch bích khắc một dòng: "Chỉ một người được vào."`,
            choices: [
              {
                t: 'Giao thủ',
                cls: 'danger',
                fn: () => {
                  const d = duel(foeOf(r), { lethal: false });
                  if (!d.win) { relChange(r, -10); return `${d.t} ${r.name} bước vào. Cửa đá khép lại trước mặt ngươi.` + tamma(15); }
                  const tid = techFor(4);
                  mark('Nhận truyền thừa của đại năng tọa hóa');
                  fame(60);
                  return `${d.t} Ngươi bước vào. Bộ hài cốt ngồi xếp bằng, trước mặt là một ngọc giản và một bình đan.` + (tid ? learnTech(tid) : cult(80)) + lifeAdd(30) + cult(40);
                },
              },
              { t: `Nhường cho ${r.name}`, fn: () => { r.tag = 'friend'; r.rel = 50; good(3); return `${r.name} ngẩn người, rồi chắp tay: "Món nợ này, ta ghi." Lúc ra, ${he(r)} ném cho ngươi một bình đan trong động.` + gain(cultPill(), 2, 2) + statUp('tam', 1); } },
            ],
          };
        },
      },
      { t: 'Chỉ đứng xa cảm ngộ đạo quang', fn: () => 'Đạo quang chiếu ba ngày, ngươi ngồi ba ngày. Không tranh, cũng có cái được.' + cult(ri(30, 45)) },
    ],
  },

  // ----- Thiên kiếp của người khác -----
  {
    id: 'life_world_tribulation',
    where: ['any'],
    w: 3,
    minR: 4,
    cd: 25,
    title: 'Lôi kiếp nơi xa',
    text: () => {
      const f = live((n) => n.rel >= 40 && n.r >= effRi() - 1 && n.r >= 4 && n.r < 8);
      const n = f.length ? pick(f) : meet({ dr: 0, tag: 'acq', rel: 0, how: 'Gặp khi người ấy độ kiếp' });
      s.flags[EVK] = n.id;
      return `Mây kiếp đen kịt tụ lại trên ngọn núi phía trước, sấm đánh như trống trận. Người độ kiếp là ${npcTitle(n)}. Đạo lôi thứ bảy đã đánh xuống, hộ thể của ${he(n)} mỏng như giấy.`;
    },
    ch: () => {
      const n = the(() => true);
      return [
        { t: 'Đứng xa quan sát thiên uy', cls: 'prime', fn: () => 'Mỗi đạo lôi là một bài học về thiên đạo. Ngươi khắc từng đạo vào lòng.' + cult(ri(25, 40)) + (ch(0.25) ? statUp('ngo', 1) : '') },
        {
          t: 'Xông vào đỡ một đạo lôi',
          cls: 'danger',
          fn: () => {
            relChange(n, 40);
            good(2);
            if (n.r < 8) { n.r++; n.st = 0; }
            mark(`Đỡ lôi kiếp cho ${n.name}`);
            return `Sét giáng xuống vai ngươi. Thế giới trắng xóa. Khi tỉnh lại, ${n.name} đã vượt kiếp, đang ngồi bên ngươi thay thuốc: "Kẻ ngốc. Mạng này ta nợ ngươi."` + hurt(45) + statUp('can', 1);
          },
        },
        {
          t: 'Chờ người kia thất bại để nhặt di vật',
          cls: 'danger',
          fn: () => {
            evil(3);
            if (ch(0.5)) { killNpc(n, 'chết dưới thiên kiếp'); return `Đạo lôi thứ chín đánh tan ${n.name} thành tro. Ngươi lặng lẽ nhặt túi trữ vật còn sót lại.` + giveGear(Math.min(RMAX(), n.r), 2) + money(M(30)) + tamma(10); }
            relChange(n, -60);
            n.tag = 'enemy';
            return `${n.name} vượt kiếp. Ánh mắt đầu tiên ${he(n)} nhìn khi ra khỏi mây kiếp là nhìn ngươi — kẻ đang lảng vảng như kền kền.` + tamma(5);
          },
        },
      ];
    },
  },

  // ----- Hoàng triều đổi chủ (chuỗi) -----
  {
    id: 'life_world_dynasty',
    where: ['town'],
    w: 3,
    minR: 4,
    once: true,
    title: 'Hoàng triều đổi chủ',
    text: () => 'Thiên Kinh treo cờ trắng. Lão hoàng đế Đại Chu băng hà, ba hoàng tử tranh ngôi, binh lửa sắp nổi. Thái tử đích thân tới quán trọ ngươi ở, quỳ một gối: "Xin tiên sư trấn quốc. Thiên hạ trăm vạn dân không chịu nổi một cuộc nội chiến."',
    ch: () => [
      {
        t: 'Nhận lời trấn quốc',
        cls: 'prime',
        fn: (): Outcome => ({
          text: 'Đêm trước lễ đăng cơ, nhị hoàng tử mời một tu sĩ áo xám làm cung phụng. Kẻ đó đứng trên mái điện, phất tay áo — cấm vệ quân đổ rạp như lúa.',
          choices: [
            {
              t: 'Đối đầu cung phụng áo xám',
              cls: 'danger',
              fn: () => {
                const d = duel(cultivator('Cung phụng áo xám', 0, 1.05));
                if (!d.win) return d.t + ' Kinh thành rơi vào binh lửa ba năm.' + tamma(15);
                setFlag('quocsu');
                mark('Trấn quốc Đại Chu, được phong quốc sư');
                good(4);
                fame(100);
                return `${d.t} Thái tử đăng cơ thuận lợi. Ngươi được phong Hộ Quốc Thiên Sư, thiên hạ yên ổn một thời.` + money(M(120)) + gain('x:linhthach_trung', 3);
              },
            },
            { t: 'Dùng uy áp dọa lui, không động thủ', fn: () => { setFlag('quocsu'); good(2); return 'Ngươi chỉ thả ra một tia uy áp. Tu sĩ áo xám tái mặt, lui đi trong đêm. Không ai chết.' + money(M(80)) + statUp('tam', 1); } },
          ],
        }),
      },
      { t: 'Từ chối — tu sĩ không can phàm sự', fn: () => 'Thái tử đi rồi, ngươi ngồi nghe tiếng mưa. Ba tháng sau, kinh thành cháy. Ngươi tự hỏi mình đúng hay sai.' + tamma(10) + statUp('tam', 1) },
      { t: 'Đòi giá thật cao', fn: () => { evil(1); return 'Thái tử cắn răng dâng một nửa quốc khố. Ngươi trấn quốc ba năm, rồi rời đi không lời từ biệt.' + money(M(200)) + (years(3), ''); } },
    ],
  },

  // ----- Thiên ma xuất thế (chuỗi) -----
  {
    id: 'life_world_heavenlydemon',
    where: ['any'],
    w: 3,
    minR: 5,
    once: true,
    title: 'Thiên ma xuất thế',
    text: () => 'Trời Bắc Minh nứt một đường đen dài nghìn dặm. Từ khe nứt rỉ ra thứ khí không thuộc về thế giới này: ai nhìn lâu sẽ quên tên mình. Các thánh địa, đại tông phát lệnh triệu tập: thiên ma đã xuất thế, cần người phong ấn.',
    ch: () => [
      {
        t: 'Tới Bắc Minh phong ấn',
        cls: 'prime',
        fn: (): Outcome => ({
          text: 'Chín mươi chín tu sĩ ngồi thành đại trận quanh khe nứt. Ngươi trấn một mắt trận. Giữa chừng, một phân thân thiên ma — hình người, không mặt — tách khỏi bóng tối, lao thẳng về phía ngươi.',
          choices: [
            {
              t: 'Rời mắt trận, giao chiến',
              cls: 'danger',
              fn: () => {
                const d = duel({ name: 'Thiên ma phân thân', r: effRi(), st: 3, kind: 'demon', mult: 1.25 });
                if (d.win) { fame(300); mark('Chém phân thân thiên ma ở Bắc Minh'); return `${d.t} Phân thân tan thành khói. Khe nứt khép lại. Tên ngươi được khắc lên bia trấn ma.` + cult(ri(100, 150)) + lifeAdd(50); }
                return d.t + (d.died ? '' : tamma(25));
              },
            },
            {
              t: 'Giữ chặt mắt trận, mặc nó cắn xé',
              fn: () => {
                fame(150);
                good(5);
                mark('Giữ mắt trận phong ấn thiên ma');
                return 'Ma khí gặm vào hộ thể, rồi vào da thịt, rồi vào thần hồn. Ngươi không động. Khi trận thành, ngươi ngã xuống, tóc bạc trắng một nửa — nhưng thiên ma đã bị phong ấn.' + hurt(60) + ((s.lifeBonus -= 20), ' (Thọ nguyên −20 năm)') + statUp('tam', 3);
              },
            },
          ],
        }),
      },
      { t: 'Bế quan, mặc thiên hạ', fn: () => { fame(-30); return 'Ngươi đóng cửa động phủ. Ba năm sau, khe nứt được phong ấn bằng mạng của ba mươi người. Ngươi không biết tên ai trong số họ.' + tamma(15); } },
    ],
  },
]);

// gợi ý cho trình biên dịch
void [inSect, rankName, addLog, gain, heal, flag];
