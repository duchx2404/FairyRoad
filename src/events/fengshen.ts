import { mark, register, ri, s, type Choice } from '../engine/api';
import type { Scene } from '../engine/actions';
import { tcPeople, worldOf, type TcPerson } from '../engine/tienco';
import { REALMS } from '../data/core';
import { SECTS } from '../data/world';
import { FENGSHEN_OFFICES, FENGSHEN_ROSTER, FENGSHEN_TOTAL, type FengshenGod } from '../data/fengshen';

type FengshenSide = {
  id: string;
  name: string;
  support: string;
};

// Theo nguyên tác: chỉ Xiển Giáo và Tiệt Giáo ở trong kiếp số (cùng nhân gian Thương, Chu là quân cờ của hai giáo).
// Lão Tử (giáo chủ Đạo Giáo, đại sư huynh của hai giáo) và Tây Phương Giáo chỉ ra tay can dự, không nhập kiếp, không ai lên bảng → đứng ngoài, không thành phe.
const SIDES: FengshenSide[] = [
  { id: 'xianjiao', name: 'Xiển Giáo', support: 'phò trợ Tây Kỳ, mượn nhân gian phân định thiên mệnh' },
  { id: 'jiejiao', name: 'Tiệt Giáo', support: 'bảo vệ môn nhân đang bị cuốn vào cuộc chiến Đại Thương' },
];

type FengshenForce = {
  id: string;
  name: string;
  power: number;
  status: 'active' | 'surrendered' | 'destroyed' | 'allied';
};

export type FengshenBoardEntry = {
  /** Mã người được sắc phong (TcPerson.id); tên có thể trùng nên không dùng tên làm khóa. */
  id: string;
  name: string;
  faction: string;
  office: string;
  year: number;
  /** Bộ trong Phong Thần Bảng (Lôi Bộ, Đẩu Bộ…), có khi người này có tên định sẵn. */
  dept?: string;
};

export { FENGSHEN_TOTAL };

type FengshenBase = {
  sides: FengshenForce[];
  round: number;
  observations: number;
  board: FengshenBoardEntry[];
  ended: boolean;
  winner?: string;
  settled?: boolean;
};

type FengshenState =
  | (FengshenBase & { mode: 'neutral' })
  | (FengshenBase & { mode: 'liangjie'; side: string; faction: string; merit: number; battles: number; founded: boolean; memberSect?: string });

const status = (): FengshenState | undefined => {
  const saved = s.flags.fengshen as FengshenState | undefined;
  if (!saved) return undefined;
  saved.sides ||= makeForces(saved.mode === 'liangjie' && saved.founded);
  saved.round ??= 0;
  saved.observations ??= 0;
  saved.board ||= [];
  saved.ended ??= false;
  if (saved.mode === 'liangjie') {
    saved.merit ??= 0;
    saved.battles ??= 0;
    saved.founded ??= false;
    saved.side ??= 'xianjiao';
    saved.faction ??= sideById(saved.side)?.name ?? saved.side;
  }
  return saved;
};

export const fengshenData = () => status();
const KIM_TIEN = REALMS.findIndex((realm) => realm.n === 'Kim Tiên');
const CHUAN_THANH = REALMS.findIndex((realm) => realm.n === 'Chuẩn Thánh');

const makeForces = (founded = false): FengshenForce[] => [
  { id: 'xianjiao', name: 'Xiển Giáo', power: 12, status: 'active' },
  { id: 'jiejiao', name: 'Tiệt Giáo', power: 12, status: 'active' },
  ...(founded ? [{ id: 'self', name: `Đạo Thống ${s.name}`, power: 8, status: 'active' as const }] : []),
];

const sideById = (id: string) => SIDES.find((side) => side.id === id);
const sideName = (id: string, campaign = status()) => campaign?.sides.find((side) => side.id === id)?.name ?? sideById(id)?.name ?? id;

function fengshenThreshold(): { r: number; st: number; prog: number } {
  return (s.flags.fengshenWhen ||= {
    r: ri(KIM_TIEN, CHUAN_THANH),
    st: ri(0, 3),
    prog: Math.random() * 100,
  });
}

export function fengshenTriggerReached(): boolean {
  if (worldOf() !== 4 || status()) return false;
  const threshold = s.flags.fengshenWhen as { r: number; st: number; prog: number } | undefined;
  return !!threshold && (s.r > threshold.r
    || (s.r === threshold.r && s.st > threshold.st)
    || (s.r === threshold.r && s.st === threshold.st && s.prog >= threshold.prog));
}

function chooseSide(side: FengshenSide | 'self'): string {
  const founded = side === 'self';
  const faction = founded ? `Đạo Thống ${s.name}` : side.name;
  const id = founded ? 'self' : side.id;
  s.flags.fengshen = {
    mode: 'liangjie',
    side: id,
    faction,
    merit: 0,
    battles: 0,
    founded,
    ...(founded && s.sect ? { memberSect: s.sect.id } : {}),
    sides: makeForces(founded),
    round: 0,
    observations: 0,
    board: [],
    ended: false,
  } satisfies FengshenState;
  mark(founded
    ? `Lập ${faction}, nhập Phong Thần Lượng Kiếp`
    : `Nhập Phong Thần Lượng Kiếp, đứng về ${faction}`);
  return founded
    ? `Ngươi dựng cờ lập ${faction}, tự mình tranh đoạt đạo thống giữa đại kiếp. Cục diện sẽ đổi theo từng trận; lượng kiếp chỉ khép lại khi các phe khác đầu hàng hoặc bị diệt vong.`
    : `Ngươi quyết định ${side.support}, chính thức đứng về ${faction} trong Phong Thần Lượng Kiếp. Cục diện sẽ đổi theo từng trận; lượng kiếp chỉ khép lại khi các phe khác đầu hàng hoặc bị diệt vong.`;
}

export function fengshenGateScene(): Scene | null {
  if (worldOf() !== 4 || status()) return null;
  fengshenThreshold();
  if (!fengshenTriggerReached()) return null;
  const choices: Choice[] = [
    ...SIDES.map((side) => ({
      t: `Nhập kiếp · ${side.name}`,
      hint: side.support,
      fn: () => chooseSide(side),
    })),
    {
      t: 'Nhập kiếp · tự lập đạo thống',
      hint: `Dựng Đạo Thống ${s.name} và tự tranh đoạt cơ duyên phong thần`,
      fn: () => chooseSide('self'),
    },
    {
      t: 'Không nhập Lượng Kiếp',
      hint: 'Không theo phe nào, không tranh đoạt đạo thống; chỉ đứng ngoài đại chiến',
      fn: () => {
        s.flags.fengshen = {
          mode: 'neutral',
          sides: makeForces(),
          round: 0,
          observations: 0,
          board: [],
          ended: false,
        } satisfies FengshenState;
        mark('Chọn đứng ngoài Phong Thần Lượng Kiếp');
        return 'Ngươi khép cửa đạo tâm, không nhận lời mời của bất kỳ phe nào. Phong thần vẫn diễn ra theo thiên mệnh đã định; ngươi chỉ có thể quan sát hoặc rời chiến địa.';
      },
    },
  ];
  return {
    title: 'Phong Thần Lượng Kiếp',
    kind: 'event',
    text: 'Hồng Hoang bước vào thời đại phong thần. Kiếp số giáng xuống Xiển Giáo và Tiệt Giáo; Tây Kỳ và Đại Thương chỉ là những quân cờ nhân gian trong đại kiếp. Lão Tử ở Bát Cảnh Cung, giáo chủ Đạo Giáo và là đại sư huynh của hai vị giáo chủ, cùng Tây Phương Giáo không ở trong kiếp số, chỉ đứng ngoài. Người có chí còn muốn tự dựng đạo thống, tranh đoạt cơ duyên. Ngươi có thể chọn một thế lực, tự lập đạo thống, hoặc giữ mình ngoài cuộc.',
    choices,
  };
}

const FALLBACK_OFFICES = [
  'Lôi Bộ Chính Thần',
  'Đẩu Bộ Tinh Quân',
  'Ôn Bộ Chính Thần',
  'Hỏa Bộ Chính Thần',
  'Thủy Bộ Chính Thần',
  'Thiên Đình Thần Tướng',
  'Tử Vi Tinh Quân',
  'Thái Tuế Tinh Quân',
  'Địa Sát Tinh Quân',
  'Thiên Cương Tinh Quân',
  'Thiên Hà Thủy Tướng',
  'Tuần Thiên Thần Tướng',
];

/** Thế lực nhân gian và tiên môn tham gia Lượng Kiếp: Đại Thương đứng sau Tiệt Giáo, Tây Kỳ đứng sau Xiển Giáo. */
export const FACTION_BY_SECT: Record<string, string> = {
  'Tiệt Giáo · Bích Du Cung': 'jiejiao',
  'Tiệt Giáo': 'jiejiao',
  'Tam Tiên Đảo': 'jiejiao',
  'Đại Thương': 'jiejiao',
  'Mai Sơn': 'jiejiao',
  'Cửu Long Đảo': 'jiejiao',
  'Hỏa Long Đảo': 'jiejiao',
  'Nga Mi Sơn · La Phù Động': 'jiejiao',
  'Khô Lâu Sơn · Bạch Cốt Động': 'jiejiao',
  'Đại Thương Vương Triều': 'jiejiao',
  'Xiển Giáo · Ngọc Hư Cung': 'xianjiao',
  'Xiển Giáo': 'xianjiao',
  'Tây Kỳ': 'xianjiao',
};
const factionOfSect = (sect: string): string | undefined => FACTION_BY_SECT[sect];

/** Thần vị định sẵn của một người, nếu có. */
const godOf = (person: TcPerson): FengshenGod | undefined => (person.fsi === undefined ? undefined : FENGSHEN_ROSTER[person.fsi]);

function factionOfNpc(n: (typeof s.npcs)[number], campaign: FengshenState): string | undefined {
  const memberSect = campaign.mode === 'liangjie' && campaign.founded ? campaign.memberSect ?? s.sect?.id : undefined;
  if (memberSect && n.tag === 'disciple' && n.sect === memberSect) return 'self';
  return factionOfSect(SECTS[n.sect ?? '']?.n ?? n.sect ?? '');
}

function factionOfPerson(person: TcPerson, campaign: FengshenState): string | undefined {
  const memberSect = campaign.mode === 'liangjie' && campaign.founded ? campaign.memberSect ?? s.sect?.id : undefined;
  if (memberSect && person.sect === SECTS[memberSect]?.n) return 'self';
  return factionOfSect(godOf(person)?.sect ?? person.sect);
}

function giveFortune(faction: string, amount: number, campaign: FengshenState) {
  if (campaign.mode === 'liangjie' && campaign.side === faction) s.stats.van = Math.max(0, s.stats.van + amount);
  const people = tcPeople().filter((person) => person.alive && person.world === 4);
  const linkedNpcs = new Set(people.map((person) => person.npc).filter((id): id is string => !!id));
  for (const n of s.npcs) {
    if (n.alive && !linkedNpcs.has(n.id) && factionOfNpc(n, campaign) === faction) n.luck = Math.max(0, (n.luck ?? 0) + amount);
  }
  for (const person of people) {
    if (factionOfPerson(person, campaign) === faction) {
      person.luck = Math.max(0, (person.luck ?? 0) + amount);
      const npc = person.npc ? s.npcs.find((candidate) => candidate.id === person.npc && candidate.alive) : undefined;
      if (npc) npc.luck = Math.max(0, (npc.luck ?? 0) + amount);
    }
  }
}

function settleFortune(campaign: FengshenState, winner: string) {
  if (campaign.settled) return;
  for (const side of campaign.sides) {
    if (side.id === winner) giveFortune(side.id, 2, campaign);
    else if (side.status === 'surrendered' || side.status === 'destroyed') giveFortune(side.id, -1, campaign);
  }
  campaign.settled = true;
}

const FALLEN_CAUSE = 'tử trận Phong Thần, được sắc phong lên Phong Thần Bảng';

/** Ghi một người lên Phong Thần Bảng. Người có thần vị định sẵn nhận đúng chức ấy; người ngoài danh sách nhận chức phụ còn trống. */
function addToFengshenBoard(campaign: FengshenState, id: string, name: string, faction: string, god?: FengshenGod, person?: TcPerson) {
  if (campaign.board.some((entry) => entry.id === id)) return;
  let office = god?.office;
  if (!office) {
    const assigned = new Set(campaign.board.map((entry) => entry.office));
    office = FALLBACK_OFFICES.find((candidate) => !assigned.has(candidate) && !FENGSHEN_OFFICES.has(candidate)) ?? `Phong Thần Chính Thần thứ ${campaign.board.length + 1}`;
  }
  campaign.board.push({
    id,
    name,
    faction: sideName(faction, campaign),
    office,
    year: Math.floor(s.year),
    ...(god ? { dept: god.dept } : {}),
  });
  if (!person?.alive) return;
  person.alive = false;
  person.died = s.year;
  person.cause = FALLEN_CAUSE;
  const npc = person.npc ? s.npcs.find((candidate) => candidate.id === person.npc) : undefined;
  if (npc?.alive) {
    npc.alive = false;
    npc.died = s.year;
    npc.cause = FALLEN_CAUSE;
  }
}

/** Lượng Kiếp khép lại: ai có tên trên bảng mà còn sống thì trở về vòng tu luyện, sinh tử bình thường. */
function releaseSurvivors() {
  for (const person of tcPeople()) if (person.fengshen) delete person.fengshen;
}

function resolveCanonical(campaign: FengshenState): string {
  const winner = campaign.sides.find((side) => side.id === 'xianjiao')!;
  const tiệt = campaign.sides.find((side) => side.id === 'jiejiao')!;
  winner.status = 'active';
  tiệt.status = 'destroyed';
  campaign.winner = winner.name;
  campaign.ended = true;
  // Thiên mệnh: toàn bộ Phong Thần Bảng ứng kiếp, theo đúng thứ tự sắc phong ở Phong Thần Đài.
  const byIndex = new Map<number, TcPerson>();
  for (const person of tcPeople()) if (person.world === 4 && person.fsi !== undefined) byIndex.set(person.fsi, person);
  for (const [i, god] of FENGSHEN_ROSTER.entries()) {
    const person = byIndex.get(i);
    addToFengshenBoard(campaign, person?.id ?? `fengshen-god-${i}`, god.name, factionOfSect(god.sect) ?? god.sect, god, person);
  }
  releaseSurvivors();
  settleFortune(campaign, winner.id);
  mark('Phong Thần Lượng Kiếp kết thúc theo thiên mệnh; Xiển Giáo phò Chu thắng trận, Tiệt Giáo thất thế');
  return `Thiên mệnh đã định: Tây Kỳ diệt Thương, Xiển Giáo thắng trận; Tiệt Giáo tan tác, Tây Phương Giáo độ vài người hữu duyên không có tên trên bảng về phương tây. ${campaign.board.length} người tử trận được ghi tên lên Phong Thần Bảng và nhận thần chức Thiên Đình.`;
}

function eliminate(force: FengshenForce) {
  if (force.status !== 'active') return;
  force.power = 0;
  force.status = Math.random() < 0.45 ? 'surrendered' : 'destroyed';
}

function resolveVariable(campaign: FengshenState): string | undefined {
  const active = campaign.sides.filter((side) => side.status === 'active');
  if (active.length > 1) return undefined;
  if (!active.length) {
    // Phòng hờ: các phe cuối cùng cùng gục trong một trận thì lượng kiếp vẫn phải khép lại, không ai thắng.
    campaign.winner = 'Không phe nào';
    campaign.ended = true;
    releaseSurvivors();
    settleFortune(campaign, '');
    mark('Phong Thần Lượng Kiếp kết thúc, không phe nào đứng vững');
    return `Lượng kiếp khép lại sau ${campaign.round} trận: các phe cuối cùng cùng tan rã, không ai giành được đạo thống. Các phe bại trận đều mất 1 khí vận.`;
  }
  const winner = active[0];
  campaign.winner = winner.name;
  campaign.ended = true;
  releaseSurvivors();
  settleFortune(campaign, winner.id);
  mark(`Phong Thần Lượng Kiếp kết thúc; ${winner.name} trở thành phe thắng cuộc`);
  const losses = campaign.sides
    .filter((side) => side.id !== winner.id)
    .map((side) => `${side.name} ${side.status === 'surrendered' ? 'đầu hàng' : side.status === 'allied' ? 'quy thuận' : 'diệt vong'}`)
    .join(', ');
  return `Lượng kiếp khép lại sau ${campaign.round} trận, không theo định hạn năm tháng. ${losses}; ${winner.name} là phe cuối cùng còn đứng vững. Thành viên phe thắng được +2 khí vận, các phe bại trận mất 1 khí vận.`;
}

/** Thương vong một trận. Thánh nhân và nhân vật chính không có tên trên bảng (Tam Thanh, Tây Phương nhị thánh, Khương Tử Nha,
 *  Na Tra, Dương Tiễn…) không ứng kiếp; người có thần vị định sẵn dễ ứng kiếp hơn tu sĩ vô danh. */
function addBattleCasualties(campaign: FengshenState, count: number, preferredFaction?: string): string[] {
  const fighting = new Set(campaign.sides.filter((side) => side.status !== 'surrendered' && side.status !== 'allied').map((side) => side.id));
  const pool: { person: TcPerson; faction: string; weight: number }[] = [];
  for (const person of tcPeople()) {
    if (!person.alive || person.world !== 4 || person.name === s.name || person.lord || person.heroine) continue;
    const god = godOf(person);
    if (person.chief && !god) continue;
    const faction = factionOfPerson(person, campaign);
    if (!faction || !fighting.has(faction) || (preferredFaction && faction !== preferredFaction)) continue;
    pool.push({ person, faction, weight: god ? 3 : 1 });
  }
  const fallen: string[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    let roll = Math.random() * pool.reduce((sum, entry) => sum + entry.weight, 0);
    let at = pool.findIndex((entry) => (roll -= entry.weight) < 0);
    if (at < 0) at = pool.length - 1;
    const [{ person, faction }] = pool.splice(at, 1);
    addToFengshenBoard(campaign, person.id, person.name, faction, godOf(person), person);
    fallen.push(person.name);
  }
  return fallen;
}

/** Số người tử trận trong một trận: hoàn toàn ngẫu nhiên, có trận không ai chết, có trận chết rất nhiều; không có trần cố định. */
function randomDeaths(mean: number): number {
  return Math.floor(-Math.log(1 - Math.random()) * mean);
}

function casualtyNote(fallen: string[]): string | undefined {
  if (!fallen.length) return undefined;
  const shown = fallen.slice(0, 3).join(', ');
  const more = fallen.length > 3 ? ` và ${fallen.length - 3} người khác` : '';
  return `${shown}${more} tử trận, chân linh bay về Phong Thần Đài`;
}

function advanceBattle(campaign: FengshenState, targetId?: string): string {
  campaign.round++;
  if (campaign.mode === 'liangjie') campaign.battles++;
  const notes: string[] = [];
  if (targetId) {
    const target = campaign.sides.find((side) => side.id === targetId && side.status === 'active');
    if (target) {
      target.power -= 2;
      notes.push(`${target.name} mất thế trận`);
      if (target.power <= 0) {
        eliminate(target);
        notes.push(`${target.name} ${target.status === 'surrendered' ? 'xin hàng' : 'bị đánh tan'}`);
      }
    }
    if (campaign.mode === 'liangjie') {
      campaign.merit += 2;
      s.fame += 8;
    }
  }
  const active = campaign.sides.filter((side) => side.status === 'active');
  for (const force of active) {
    if (force.status !== 'active') continue; // phe vừa bị đánh gục trong trận này không còn ra đòn
    const targets = active.filter((side) => side.id !== force.id && side.status === 'active');
    if (!targets.length) break;
    const target = targets[Math.floor(Math.random() * targets.length)];
    target.power--;
    if (target.power <= 0) {
      eliminate(target);
      notes.push(`${target.name} ${target.status === 'surrendered' ? 'đầu hàng' : 'tan rã'}`);
    }
  }
  const fallen = [
    ...(targetId ? addBattleCasualties(campaign, randomDeaths(1.5), targetId) : []),
    ...addBattleCasualties(campaign, randomDeaths(2.5)),
  ];
  const note = casualtyNote(fallen);
  if (note) notes.push(note);
  const ending = resolveVariable(campaign);
  if (ending) notes.push(ending);
  return notes.join('. ') + (notes.length ? '.' : ' Các phe thăm dò lẫn nhau, chưa bên nào chịu lùi bước.');
}

function battleChoices(campaign: FengshenState): Choice[] {
  if (campaign.mode === 'neutral') {
    return [
      {
        t: 'Đứng ngoài quan sát',
        fn: () => {
          campaign.observations++;
          if (campaign.observations >= 3) return resolveCanonical(campaign);
          const chapter = campaign.observations === 1
            ? 'Tây Kỳ dựng cờ, chư hầu hưởng ứng; những tiên gia đầu tiên bị cuốn vào sát kiếp.'
            : 'Đại chiến lan rộng. Xiển Giáo và Tiệt Giáo đối đầu; Lão Tử và hai vị giáo chủ Tây Phương ra tay phá trận nhưng không nhập kiếp.';
          return `${chapter} Ngươi vẫn đứng ngoài; thiên mệnh tiếp tục vận hành.`;
        },
      },
      {
        t: 'Rời khỏi chiến địa',
        fn: () => resolveCanonical(campaign),
      },
    ];
  }

  const ownForce = campaign.sides.find((side) => side.id === campaign.side);
  // Phe mình đã hàng hoặc tan rã thì không còn quân để xuất trận.
  const activeOpponents = ownForce?.status === 'active' ? campaign.sides.filter((side) => side.status === 'active' && side.id !== campaign.side) : [];
  const choices: Choice[] = activeOpponents.map((target) => ({
    t: `Dốc sức đánh ${target.name}`,
    hint: 'Đẩy phe đối thủ tới đầu hàng hoặc diệt vong; các phe khác vẫn tự giao chiến',
    cls: 'prime',
    fn: () => {
      const result = advanceBattle(campaign, target.id);
      return `Ngươi dẫn người phe mình xung trận. ${result}`;
    },
  }));
  if (ownForce?.status === 'active') {
    choices.push({
      t: 'Củng cố phòng tuyến',
      hint: 'Bảo toàn lực lượng; cục diện các phe vẫn biến động',
      fn: () => {
        ownForce.power++;
        const result = advanceBattle(campaign);
        return `Ngươi giữ vững trận tuyến của ${campaign.faction}. ${result}`;
      },
    });
    choices.push({
      t: 'Dẫn phe mình đầu hàng',
      hint: 'Rút khỏi cuộc tranh đoạt; phe này trở thành phe bại trận',
      cls: 'danger',
      fn: () => {
        ownForce.status = 'surrendered';
        ownForce.power = 0;
        const ending = resolveVariable(campaign);
        const result = ending ?? advanceBattle(campaign);
        return `${campaign.faction} treo cờ xin hàng. ${result}`;
      },
    });
  } else {
    choices.push({
      t: 'Theo dõi chiến cuộc',
      fn: () => `Phe của ngươi đã rời khỏi cuộc tranh đoạt. ${advanceBattle(campaign)}`,
    });
  }
  return choices;
}

register([{
  id: 'fengshen_battle',
  where: ['any'],
  w: 18,
  cd: 8,
  cond: () => worldOf() === 4 && !!status() && !status()!.ended,
  title: 'Phong Thần đại chiến',
  text: () => {
    const campaign = status()!;
    if (campaign.mode === 'neutral') return 'Xa xa, chiến trường phong thần rung chuyển. Ngươi không theo phe nào; Tây Kỳ, Đại Thương và các tiên gia vẫn đi theo thiên mệnh trong thần thoại.';
    const forces = campaign.sides.map((side) => `${side.name}: ${side.status === 'active' ? `thế lực ${side.power}` : side.status === 'surrendered' ? 'đã đầu hàng' : side.status === 'allied' ? 'đã quy thuận' : 'đã tan rã'}`).join(' · ');
    return `Chiến trường phong thần lại nổi sóng. ${campaign.faction} bị cuốn vào thế cục do chính hành động của các phe làm thay đổi. Lượng kiếp không có hạn năm định trước; nó chỉ kết thúc khi chỉ còn một phe đứng vững.\n\n${forces}\nPhong Thần Bảng: ${campaign.board.length} người.`;
  },
  ch: () => battleChoices(status()!),
}]);
