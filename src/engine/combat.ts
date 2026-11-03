import { worldDefinitions } from '../data/local-items';
// Chiến đấu theo lượt kiểu "linh lực": chiêu thức không có hồi chiêu, đủ linh lực là xuất chiêu.
// Mỗi hiệp ngươi ra tay trước: mỗi chiêu dùng được một lần, còn linh lực bao nhiêu thì tung bấy nhiêu chiêu,
// cộng một lần dùng đan hoặc phù; hết linh lực thì chỉ còn quyền cước cơ bản. Điều tức (khi chưa ra chiêu)
// hồi nhiều linh lực, chịu ít sát thương hơn. Địch lộ trước đòn sắp đánh.
//
// Mọi ngẫu nhiên trong trận lấy từ RNG có hạt giống riêng. Nhờ vậy cùng hạt giống + cùng chuỗi thao tác
// thì trận đánh ra y hệt — màn đánh tay (ui/fightui) chơi trước, rồi sự kiện chạy lại bằng kịch bản đã ghi.
import { skSrcMul } from './char';
import { kmSkMul } from './kinhmach';
import { RMAX, npcCap, LAST_WORLD, EL, REALMS, STAGES, elMult, type El } from '../data/core';
import { BEASTS, LOCS, beastRoot, isMythicBeast } from '../data/world';
import { SKILLS, TALIS, PILLS, TECHS, GRADE_MULT, MATS, mkGear, type Skill } from '../data/items';
import { s, codexAdd } from './state';
import { atkOf, defOf, maxHp, has, stat, npcPow, count, removeItem, addItem, addGear, itemName, root, pqSum, clSum, myLinh, age, maxLife, effRi, stageName } from './char';
import { CHANLINH } from '../data/spirit';
import { STAGE_NAMES, type BeastStage } from './beast-companion';
import { activeNpcs, compMul, kitSum, kitSkills } from './party';
import { findNpc } from './core';
import { laws, daos, daoMult, DAOS, R_CHUANTHANH, R_THANHNHAN, weaponKey } from './dao';
import { addLog, killPlayer } from './core';
import { ch, clamp, pick, rf, ri } from '../core/util';

export interface Fighter {
  name: string;
  r: number;
  st: number;
  el: El | null;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  skills: Skill[];
  shield: number;
  dot: { dmg: number; turns: number }[];
  /** Hồi máu theo lượt (vd. Tích Huyết Trùng Sinh): mỗi lượt hồi v khí huyết, còn turns lượt. Không hồi giáp. */
  hot?: { v: number; turns: number; n: string }[];
  player?: boolean;
  /** Đồng hành: id NPC hoặc 'cl' (chân linh); địch không có. */
  id?: string;
  g?: 'm' | 'f';
  /** Khoá chân dung riêng của NPC (thánh nữ 'sn_…') để chọn sprite riêng trong trận. */
  pic?: string;
  kind?: string;
  /** Đã chạy thoát khỏi trận (trọng thương). */
  fled?: boolean;
  /** Pháp tắc / đại đạo đã ngộ (Chuẩn Thánh trở lên). */
  laws?: string[];
  daos?: string[];
}

export interface FoeSpec {
  name: string;
  r: number;
  st?: number;
  el?: El | null;
  mult?: number;
  skills?: string[];
  kind?: 'beast' | 'cultivator' | 'mortal' | 'boss' | 'demon';
  mat?: string;
  /** Kẻ giữ Đại Đạo / đạo kiếp: không bị chặn ở Hợp Đạo. */
  dao?: boolean;
}

export interface FightOpts {
  /** Địch đi theo nhóm: các kẻ địch thêm ngoài kẻ chính (tối đa 9). */
  group?: FoeSpec[];
  lethal?: boolean;
  noFlee?: boolean;
  fleeAt?: number;
  noLoot?: boolean;
}

export interface FightResult {
  win: boolean;
  fled: boolean;
  died: boolean;
  rounds: number;
  log: string[];
  foe: Fighter;
  hpLeft: number;
  loot: string[];
  lootMoney?: number;
  lootDesc?: string;
  /** Đồng hành tử trận / trọng thương. */
  lost?: string[];
  injured?: string[];
}

export const fightLogs: FightResult[] = [];

// ---------- RNG có hạt giống ----------
export type Rng = () => number;
export function mkRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BEAST_SKILLS: Record<string, Skill> = {
  cau: { id: 'cau', n: 'Vồ cắn', el: null, tier: 1, k: 'atk', m: 1.25, cd: 0, d: '' },
  gam: { id: 'gam', n: 'Gầm thét', el: null, tier: 1, k: 'atk', m: 1.6, cd: 0, d: '' },
};
const ELEM_BEAST_SKILL: Record<El, string> = {
  kim: 'kimtien', moc: 'dangleo', thuy: 'thuytien', hoa: 'hoacau', tho: 'thothuan', bang: 'hanbangtien', loi: 'loiquang', phong: 'phongnhan', am: 'uanhthich', quang: 'quangkiem', yin: 'phehon', yang: 'dieunhat', hondon: 'khaithien', none: 'cau',
};

/** Linh lực mỗi lần thi triển chiêu thức. */
export const skCost = (k: Skill) => k.el === 'hondon'
  ? Math.max(3, Math.round(2 + Math.min(k.m, 2.2 + effRi() * 0.35) * 2.2 + Math.min(k.tier, Math.max(1, effRi())) * 0.8))
  : Math.max(3, Math.round(2 + k.m * 2.2 + k.tier * 0.8));

export function mkFoe(spec: FoeSpec, rng: Rng = Math.random): Fighter {
  const R = (a: number, b: number) => a + rng() * (b - a);
  const P = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const st = spec.st ?? Math.floor(R(0, 4));
  const el: El | null = spec.el === undefined ? P((Object.keys(EL) as El[]).filter((e) => e !== 'hondon')) : spec.el; // hệ Hỗn Độn chỉ có ở chiêu Hỗn Nguyên Kinh
  const kind = spec.kind || 'cultivator';
  const rr = spec.dao ? spec.r : Math.min(spec.r, npcCap()); // Đại Đạo chỉ có một
  let p = npcPow(rr, st) * (spec.mult ?? 1) * R(0.9, 1.1);
  if (kind === 'mortal') p = Math.max(3, p * 0.6);
  if (kind === 'beast' && isMythicBeast(spec.name)) {
    p *= 1.25; // Dị thú có cơ sở truyền thuyết thượng cổ mạnh hơn 25% so với loài thường cùng bậc
  }
  const skills: Skill[] = [];
  if (spec.skills) for (const k of spec.skills) if (SKILLS[k]) skills.push(SKILLS[k]);
  if (!spec.skills) {
    if (kind === 'beast' || kind === 'demon') {
      skills.push(BEAST_SKILLS.cau);
      if (spec.r >= 1 && el) skills.push(SKILLS[ELEM_BEAST_SKILL[el]]);
      if (spec.r >= 3) skills.push(BEAST_SKILLS.gam);
    } else if (kind !== 'mortal') {
      const pool = worldDefinitions('sk').filter((k) => !k.peak && k.tier <= Math.ceil(spec.r / 2) + 1 && (k.el === el || k.el === null));
      for (let i = 0; i < Math.min(3, 1 + Math.floor(spec.r / 2)) && pool.length; i++) {
        const sk = P(pool);
        if (!skills.includes(sk)) skills.push(sk);
      }
    }
  }
  const hp = Math.round(p * 8 * (kind === 'beast' ? 1.25 : 1));
  // Chuẩn Thánh trở lên: địch cũng ngộ pháp tắc theo hệ / vũ khí; Thánh Nhân trở lên có thể có đại đạo (tầng thường; ba tầng trên hiếm)
  const lw: string[] = [], dw: string[] = [];
  if (rr >= R_CHUANTHANH && !spec.dao) {
    const common = DAOS.filter((d) => d.tier === 'thuong');
    const pool = common.filter((d) => d.el === el || (d.weapon && d.weapon === weaponKey(spec.name)));
    const src = pool.length ? pool : common;
    const pick1 = src[Math.floor(rng() * src.length)];
    lw.push(pick1.id);
    if (rr >= R_THANHNHAN && rng() < 0.6) dw.push(pick1.id);
    if (rng() < 0.12 * (rr - R_CHUANTHANH + 1)) lw.push(['luc', 'man', 'pha', 'ngu'][Math.floor(rng() * 4)]);
    if (rng() < 0.05 * (rr - R_CHUANTHANH + 1)) lw.push(rng() < 0.5 ? 'yin' : 'yang');
    if (rng() < 0.08 * (rr - R_CHUANTHANH + 1)) lw.push(rng() < 0.5 ? 'khonggian' : 'thoigian');
  }
  if (spec.dao) { lw.push('hondon', 'thoigian', 'khonggian'); dw.push('hondon', 'thoigian', 'khonggian'); } // kẻ giữ Đại Đạo
  return { name: spec.name, r: rr, st, el, hp, maxHp: hp, atk: Math.round(p), def: Math.round(p * 0.35), skills, shield: 0, dot: [], kind, laws: lw, daos: dw };
}

/** Yêu thú ngẫu nhiên phù hợp cấp và vùng. */
export function beastFoe(lv: number, reg = LOCS[s.loc].reg, mult = 1): { spec: FoeSpec } {
  const home = BEASTS.filter((b) => b.home === s.loc && !b.codexOnly);
  let b;
  if (home.length) {
    const kin = BEASTS.filter((x) => !x.codexOnly && x.anc && home.some((h) => h.n === beastRoot(x)) && x.blood! <= 1);
    b = ch(0.12) || !kin.length ? pick(home) : pick(kin);
  } else {
    const pool = BEASTS.filter((x) => !x.home && !x.codexOnly && lv >= x.lv[0] - 1 && lv <= x.lv[1] + 1 && (!x.reg || x.reg.includes(reg)));
    b = pool.length ? pick(pool) : pick(BEASTS.filter((x) => !x.home && !x.anc && !x.codexOnly));
  }
  const r = b.home || b.anc ? clamp(Math.max(b.lv[0], Math.min(b.lv[1], lv)), 0, npcCap()) : clamp(lv, 0, npcCap());
  codexAdd('beast', beastRoot(b));
  // phản tổ: ở các giới dưới Hỗn Độn, yêu thú mang một tia huyết mạch thánh thú đôi khi thức tỉnh
  const top = lineTop(b.n);
  if (top && (s.world ?? 0) < LAST_WORLD && !b.home && ch(b.blood === 0 ? 0.06 : 0.03)) {
    return { spec: { name: `${b.n} (phản tổ · huyết mạch ${top})`, r: Math.min(npcCap(), r + 2), el: b.el, kind: 'beast', mat: 'tuduehuyet', mult: mult * 1.3 } };
  }
  return { spec: { name: b.n, r, el: b.el, kind: 'beast', mat: b.mat, mult } };
}

/** Dòng huyết mạch thánh thú của một yêu thú (theo tên) → tên thủy tổ ở Hỗn Độn. */
const LINES: [RegExp, string][] = [
  [/Long|Giao|Tù Ngưu|Nhai Tí|Trào Phong|Bồ Lao|Toan Nghê|Bá Hạ|Bệ Ngạn|Phụ Hí|Si Vẫn|Mãng|Trường Xà/, 'Tổ Long'],
  [/Phượng|Loan|Khổng Tước|Tước|Điểu|Kim Ô|Tất Phương|Hạc/, 'Chân Phượng'],
  [/Kỳ Lân|Lân/, 'Thủy Kỳ Lân'],
  [/Bằng|Côn|Điêu|Ưng/, 'Côn Bằng'],
];
export const lineTop = (n: string) => LINES.find(([re]) => re.test(n))?.[1] ?? null;

export const BASIC: Skill = { id: 'quyen', n: 'Quyền cước cơ bản', el: null, tier: 1, k: 'atk', m: 1, cd: 0, d: 'Không tốn linh lực.' };

function playerFighter(): Fighter {
  const mh = maxHp();
  const sk = s.skills.map((k) => SKILLS[k]).filter(Boolean);
  const tel = s.tech ? TECHS[s.tech].el : [];
  const el = tel.find((e) => s.root.els.includes(e)) || tel[0] || null;
  return {
    name: s.name, r: s.r, st: s.st, el: el ?? (s.root.els[0] || null),
    hp: Math.max(1, Math.round(mh * (1 - s.hurt / 100))), maxHp: mh, atk: atkOf(), def: defOf(),
    skills: sk, shield: 0, dot: [], player: true, laws: [...laws()], daos: [...daos()],
  };
}

// ---------- Thao tác của người chơi (ghi lại để chạy lại y hệt) ----------
export type Act =
  | { t: 'sk'; id: string } | { t: 'basic' } | { t: 'item'; id: string; g: number } | { t: 'end' } | { t: 'rest' }
  | { t: 'burn' } | { t: 'flee' } | { t: 'uy' } | { t: 'auto' }
  /** Cứu đồng hành sắp chết: cho chạy trốn, hoặc chọn người đỡ đòn ('me' = nhân vật chính, hoặc id đồng hành). */
  | { t: 'rescue'; mode: 'flee' | 'guard'; who?: string };
/** Đồng hành sắp bị đánh gục: chờ người chơi quyết. */
export interface Pending { ally: Fighter; attacker: Fighter; label: string; dmg: number }
export interface Script { seed: number; acts: Act[] }

/** Đòn kế tiếp của địch (lộ ra cho người chơi thấy trước). */
export interface Intent { sk: Skill | null; n: string; m: number; k: Skill['k'] }

export class Battle {
  rng: Rng;
  p: Fighter;
  foe: Fighter;
  spec: FoeSpec | null;
  opts: FightOpts;
  log: string[] = [];
  round = 1;
  mp: number;
  mpMax: number;
  regen: number;
  used: string[] = [];
  itemUsed = false;
  guard = false;
  burns = 0;
  burnYears = 0;
  uyDiff: number;
  intent: Intent;
  over: '' | 'win' | 'lose' | 'fled' | 'draw' = '';
  lethal: boolean;
  acts: Act[] = [];
  private atkTal = 0;
  /** Thiên Đố Chi Thể: địch chỉ thấy Luyện Khí nên khinh địch (hiệp đầu đánh qua loa, không phòng bị). */
  contempt = false;
  /** Đã thi triển Pháp Thiên Tượng Địa: hư ảnh cự nhân hiện sau lưng tới hết trận. */
  pttd = false;
  /** Đồng hành xuất trận (tự đánh) và địch đi theo nhóm (ngoài kẻ chính this.foe). */
  allies: Fighter[] = [];
  foes: Fighter[] = [];
  /** Đồng hành sắp chết đang chờ người chơi quyết (chỉ khi đánh tay). */
  pending: Pending | null = null;
  /** Đánh tay: dừng lại hỏi khi đồng hành sắp chết; bot / tự động thì cho chạy trốn ngay. */
  interactive = false;
  private foeQueue: Fighter[] = [];
  private pillUsed = false;
  private xingtianUsed = false;

  constructor(spec: FoeSpec | Fighter, opts: FightOpts, seed: number) {
    this.rng = mkRng(seed);
    this.spec = 'atk' in spec ? null : spec;
    this.foe = 'atk' in spec ? { ...spec, dot: [], shield: 0 } : mkFoe(spec, this.rng);
    this.p = playerFighter();
    this.opts = opts;
    this.allies = allyFighters(this.p, this.rng);
    this.foes = (opts.group || []).slice(0, 9).map((g) => mkFoe(g, this.rng));
    this.lethal = opts.lethal ?? true;
    this.uyDiff = this.foe.r - effRi();
    const ngo = stat('ngo');
    this.mpMax = (10 + ngo * 0.6 + effRi() * 2 + s.meridians * 0.5) * (1 + pqSum('cult') / 200);
    this.regen = (2.4 + ngo * 0.1 + effRi() * 0.35) * (this.uyDiff > 0 ? Math.pow(0.85, this.uyDiff) : 1);
    this.mp = this.mpMax;
    const f = this.foe, p = this.p;
    this.log.push(`— ${p.name} (${stageName()}) đối đầu ${f.name} (${f.r ? REALMS[f.r].n + ' ' + STAGES[f.st] : 'phàm nhân'}${f.el ? ', hệ ' + EL[f.el].n : ''}) —`);
    if (this.uyDiff > 0) this.log.push(`Uy áp ${REALMS[f.r].n} đè xuống, công phạt của ngươi còn ${Math.round(this.uyMul() * 100)}%.`);
    else if (this.uyDiff <= -2) this.log.push('Uy áp cảnh giới của ngươi tỏa ra, đối phương run rẩy.');
    this.intent = this.pickIntent();
    if (s.body === 'thiendo' && s.r === 1 && f.r >= 2 && !('atk' in spec && (spec as Fighter).player)) {
      this.contempt = true;
      this.log.push(`${f.name} liếc ngươi một cái: "Luyện Khí? Kiến cỏ cũng dám cản đường." Hắn chẳng buồn vận công.`);
      this.intent = { sk: null, n: 'phẩy tay', m: 0.5, k: 'atk' };
    }
  }

  // ----- tiện ích -----
  /** Bên ta còn đứng được (người chơi + đồng hành chưa gục / chưa chạy). */
  meSide = () => [this.p, ...this.allies].filter((x) => x.hp > 0 && !x.fled);
  /** Bên địch còn sống (kẻ chính + nhóm). */
  foeSide = () => [this.foe, ...this.foes].filter((x) => x.hp > 0);
  /** Tỉ lệ đồng hành chạy thoát khi sắp gục. */
  allyFleeChance = (a: Fighter) => clamp(0.5 + (stat('van') - 5) * 0.02 + (a.hp / a.maxHp) * 0.2 - (this.uyDiff > 0 ? 0.1 * this.uyDiff : 0), 0.1, 0.9);
  private ch = (p: number) => this.rng() < p;
  private rf = (a: number, b: number) => a + this.rng() * (b - a);
  uyMul = () => (this.uyDiff > 0 ? Math.pow(0.8, this.uyDiff) : 1);
  burnCost = () => Math.max(2, Math.round(4 * (effRi() + 1) * (this.burns + 1)));
  canUy = () => this.uyDiff <= -2;
  fleeChance(): number {
    const f = this.foe, p = this.p;
    let fp = 0.45 + pqSum('flee') + clSum('flee') + (stat('van') - 5) * 0.02 + (has('tranphap') ? 0.25 : 0) + (this.uyDiff < 0 ? 0.15 : -0.1 * this.uyDiff);
    if (f.hp / f.maxHp < 0.3) fp += 0.1;
    const tal = this.fleeTalis();
    if (tal) fp += tal.m * (tal.co ? 3 : 1);
    void p;
    return clamp(fp, 0.05, 0.97);
  }
  fleeTalis() {
    return worldDefinitions('t').filter((t) => t.k === 'flee' && count('t:' + t.id) > 0).sort((a, b) => b.tier - a.tier)[0];
  }
  /** Ước lượng sát thương đòn kế của địch lên ngươi. */
  estIntent(): number { return this.estMove(this.intent); }
  /** Hệ số chiêu của người chơi sau linh căn, kiếm tâm. */
  skMul(sk: Skill): number {
    let m = sk.m;
    if (sk.sword && has('kiemtam')) m *= 1.2;
    if (sk.sword && has('hoangdao')) m *= 1.2;
    if (sk.el && s.root.els.includes(sk.el) && /^(Thập|Dị)/.test(root().n)) m *= 1.15; // linh căn đặc biệt
    m *= skSrcMul(sk.id); // phẩm công pháp truyền thụ
    m *= kmSkMul(sk.id); // kinh mạch: thông / nghịch / huyệt / hợp mệnh; chưa xếp ×0,85
    return m;
  }
  /** Ước lượng tác dụng một chiêu của ngươi: sát thương lên địch, hoặc lượng hồi / hộ thuẫn. */
  estSkill(sk: Skill): { v: number; k: 'dmg' | 'heal' | 'shield'; em: number } {
    const p = this.p, f = this.foe;
    const m = sk.id === 'quyen' ? 1 : this.skMul(sk);
    const el = sk.id === 'quyen' ? p.el : sk.el ?? p.el;
    const em = elMult(el, f.el);
    if (sk.k === 'heal') return { v: Math.round(p.maxHp * 0.18 * m), k: 'heal', em: 1 };
    if (sk.k === 'shield') return { v: Math.round(p.def * 2 * m + p.maxHp * 0.08 * m), k: 'shield', em: 1 };
    let d = p.atk * m * em * this.uyMul() * Math.pow(1.5, this.burns) * daoMult({ laws: p.laws || [], daos: p.daos || [] }, { laws: f.laws || [], daos: f.daos || [] });
    if (this.contempt && this.round === 1) d *= 1.6;
    if (has('cuongchien')) d *= 1 + (1 - p.hp / p.maxHp) * 0.5;
    if (has('mahuyet')) d *= 1 + (1 - p.hp / p.maxHp) * 0.3;
    if (has('hoangdao')) d *= 1.15;
    if (has('binhchu')) d *= 1.15;
    if (has('yeudan')) d *= 1.25;
    d = Math.max(d * 0.15, d - f.def * 0.5) * (sk.k === 'multi' ? 3 : 1) * (sk.all ? this.foeSide().length || 1 : 1);
    return { v: Math.round(d), k: 'dmg', em };
  }
  /** Các đòn địch có thể ra (để hiện bảng chiêu thức của địch). */
  foeMoves(): Intent[] {
    return [{ sk: null, n: 'đòn thường', m: 1, k: 'atk' }, ...this.foe.skills.map((k) => ({ sk: k, n: k.n, m: k.m, k: k.k }))];
  }
  estMove(it: Intent): number {
    const m = it.k === 'atk' || it.k === 'multi' || it.k === 'dot' ? it.m * (it.k === 'multi' ? 3 : 1) : 0;
    const em = elMult(it.sk ? it.sk.el ?? this.foe.el : this.foe.el, this.p.el);
    return Math.round(Math.max(0, this.foe.atk * m * em * this.foeDmgMul() * (this.guard ? 0.6 : 1) * daoMult({ laws: this.foe.laws || [], daos: this.foe.daos || [] }, { laws: this.p.laws || [], daos: this.p.daos || [] }) - this.p.def * 0.5));
  }
  private foeDmgMul = () => (this.uyDiff > 0 ? 1 + 0.15 * this.uyDiff : 1) * Math.pow(0.67, this.burns);

  private pickIntent(): Intent {
    const f = this.foe;
    const opts: [Intent, number][] = [[{ sk: null, n: 'đòn thường', m: 1, k: 'atk' }, 3]];
    for (const k of f.skills) {
      if (k.k === 'shield' && f.shield > 0) continue;
      if (k.k === 'heal' && f.hp / f.maxHp > 0.6) continue;
      opts.push([{ sk: k, n: k.n, m: k.m, k: k.k }, k.k === 'atk' || k.k === 'multi' || k.k === 'dot' ? 1.6 : 1]);
    }
    let x = this.rng() * opts.reduce((a, o) => a + o[1], 0);
    for (const [it, w] of opts) { x -= w; if (x <= 0) return it; }
    return opts[0][0];
  }

  private hit(a: Fighter, d: Fighter, mult: number, el: El | null, label: string): number {
    let dmg = a.atk * mult * elMult(el ?? a.el, d.el) * this.rf(0.85, 1.15) * daoMult({ laws: a.laws || [], daos: a.daos || [] }, { laws: d.laws || [], daos: d.daos || [] });
    if (a.player) {
      dmg *= this.uyMul() * Math.pow(1.5, this.burns);
      if (this.contempt && this.round === 1) dmg *= 1.6; // đối phương khinh địch, không phòng bị
      if (has('cuongchien')) dmg *= 1 + (1 - a.hp / a.maxHp) * 0.5;
      if (has('mahuyet')) dmg *= 1 + (1 - a.hp / a.maxHp) * 0.3;
      if (has('hoangdao')) dmg *= 1.2;
      if (has('binhchu')) dmg *= 1.2;
      if (has('yeudan')) dmg *= 1.25;
    } else if (d.player) {
      dmg *= this.foeDmgMul() * (this.guard ? 0.6 : 1);
      if (has('vuthe')) dmg = Math.round(dmg * 0.85);
      if (has('binhchu')) dmg = Math.round(dmg * 0.85);
    }
    const crit = this.ch(0.07 + (a.player ? clamp(stat('van') - 5, 0, 10) * 0.008 : 0));
    if (crit) dmg *= 1.6;
    dmg = Math.round(Math.max(dmg * 0.15, dmg - d.def * 0.5));
    if (d.shield > 0) { const ab = Math.min(d.shield, dmg); d.shield -= ab; dmg -= ab; }
    d.hp -= dmg;
    if (a.player && has('mahuyet') && dmg > 0) {
      const leach = Math.round(dmg * 0.2);
      a.hp = Math.min(a.maxHp, a.hp + leach);
      this.log.push(`Ma Huyết Phệ Hồn: ${a.name} cắn nuốt tinh huyết, hồi phục ${leach} khí huyết.`);
    }
    if (d.player && d.hp <= 0 && has('batkhuat') && !this.xingtianUsed) {
      this.xingtianUsed = true;
      d.hp = Math.max(1, Math.round(d.maxHp * 0.3));
      this.log.push(`Hình Thiên Bất Khuất: Thân thể ngã xuống nhưng chiến ý gầm thét xé trời! ${d.name} múa khiên rìu tử chiến, hồi sinh với ${d.hp} khí huyết!`);
    }
    const em = elMult(el ?? a.el, d.el);
    this.log.push(`${a.name} dùng ${label}${em > 1 ? ' (khắc hệ)' : em < 1 ? ' (bị khắc)' : ''}${crit ? ', bạo kích' : ''}: ${d.name} mất ${dmg} khí huyết.`);
    return dmg;
  }

  private cast(a: Fighter, d: Fighter, sk: Skill) {
    const m = a.player ? this.skMul(sk) : sk.m;
    switch (sk.k) {
      case 'atk': if (sk.all) { const mine = a === this.p || this.allies.includes(a); for (const t of mine ? this.foeSide() : this.meSide()) this.hit(a, t, m, sk.el, sk.n); } else this.hit(a, d, m, sk.el, sk.n); break; // all: đánh toàn bộ kẻ địch
      case 'multi': for (let i = 0; i < 3 && d.hp > 0; i++) this.hit(a, d, m, sk.el, `${sk.n} (${i + 1})`); break;
      case 'dot': { const dm = this.hit(a, d, m, sk.el, sk.n); d.dot.push({ dmg: Math.max(1, Math.round(dm * 0.6)), turns: 3 }); break; }
      case 'heal': {
        const h = Math.round(a.maxHp * 0.18 * m);
        a.hp = Math.min(a.maxHp, a.hp + h);
        if (sk.hot) { // hồi tiếp theo lượt; dùng lại thì làm mới chứ không cộng chồng
          const v = Math.max(1, Math.round(h * sk.hot.m));
          a.hot = [...(a.hot || []).filter((x) => x.n !== sk.n), { v, turns: sk.hot.turns, n: sk.n }];
          this.log.push(`${a.name} thi triển ${sk.n}, hồi ${h} khí huyết; ${sk.hot.turns} lượt tới mỗi lượt hồi thêm ${v}.`);
        } else this.log.push(`${a.name} thi triển ${sk.n}, hồi ${h} khí huyết.`);
        break;
      }
      case 'shield': { a.shield = Math.round(a.def * 2 * m + a.maxHp * 0.08 * m); this.log.push(`${a.name} thi triển ${sk.n}, dựng hộ thuẫn ${a.shield}.`); break; }
    }
  }

  // ----- người chơi -----
  canUse(sk: Skill) { return !this.over && !this.used.includes(sk.id) && this.mp >= skCost(sk); }
  canRest() { return !this.over && !this.used.length; }
  items(): { id: string; g: number; n: string }[] {
    const out: { id: string; g: number; n: string }[] = [];
    for (const b of s.bag) {
      if (b.n <= 0) continue;
      const [k, key] = b.id.split(':');
      if (k === 'p' && PILLS[key]?.k === 'heal') out.push({ id: b.id, g: b.g ?? 1, n: PILLS[key].n });
      if (k === 't' && TALIS[key] && TALIS[key].k !== 'flee') out.push({ id: b.id, g: b.g ?? 1, n: TALIS[key].n });
    }
    return out;
  }

  /** Thực hiện một thao tác. Trả về false nếu không hợp lệ. */
  do(a: Act): boolean {
    if (this.over) return false;
    if (this.pending && a.t !== 'rescue') return false;
    switch (a.t) {
      case 'rescue': {
        const pd = this.pending;
        if (!pd) return false;
        const al = pd.ally;
        if (a.mode === 'guard') {
          const g = a.who === 'me' ? this.p : this.allies.find((x) => x.id === a.who);
          if (!g || g.hp <= 0 || g.fled) return false;
          let dmg = pd.dmg;
          if (g.shield > 0) { const ab = Math.min(g.shield, dmg); g.shield -= ab; dmg -= ab; }
          g.hp -= dmg;
          this.log.push(`${g.name} lao tới đỡ ${pd.label} của ${pd.attacker.name} thay ${al.name}, mất ${dmg} khí huyết.`);
          al.fled = true; al.hp = Math.max(1, Math.round(al.maxHp * 0.1));
          this.log.push(`${al.name} thừa cơ thoát khỏi vòng chiến, trọng thương.`);
          if (g.hp <= 0 && !g.player) this.log.push(`${g.name} gục xuống sau đòn đỡ ấy.`);
        } else {
          if (this.ch(this.allyFleeChance(al))) { al.fled = true; al.hp = Math.max(1, Math.round(al.maxHp * 0.1)); this.log.push(`${al.name} liều mạng thoát khỏi vòng chiến, trọng thương.`); }
          else { al.hp = 0; this.log.push(`${al.name} định chạy nhưng không kịp — ${pd.attacker.name} hạ sát.`); }
        }
        this.pending = null;
        this.acts.push(a);
        if (this.checkOver()) return true;
        this.runFoes();
        if (!this.pending) this.finishRound();
        return true;
      }
      case 'sk': {
        const sk = this.p.skills.find((k) => k.id === a.id);
        if (!sk || !this.canUse(sk)) return false;
        this.mp -= skCost(sk);
        this.used.push(sk.id);
        if (sk.id === 'phapthientuongdia' || sk.id === 'honnguyenphaptuong') this.pttd = true;
        this.cast(this.p, this.foe, sk);
        break;
      }
      case 'basic':
        if (this.used.includes('quyen')) return false;
        this.used.push('quyen');
        this.hit(this.p, this.foe, 1, this.p.el, BASIC.n);
        break;
      case 'item': {
        if (this.itemUsed || count(a.id, a.g) < 1) return false;
        this.itemUsed = true;
        this.useItem(a.id, a.g);
        break;
      }
      case 'rest': {
        if (!this.canRest()) return false;
        const g = this.mpMax * 0.35;
        this.mp = Math.min(this.mpMax, this.mp + g);
        this.guard = true;
        this.log.push(`${this.p.name} thủ thế điều tức, hồi ${g.toFixed(1)} linh lực, đòn của địch lượt này giảm 40%.`);
        this.acts.push(a);
        this.endTurn();
        return true;
      }
      case 'burn': {
        if (this.burns >= 3) return false;
        const y = this.burnCost();
        this.burns++;
        this.burnYears += y;
        this.mp = this.mpMax;
        this.log.push(`${this.p.name} thiêu đốt ${y} năm thọ nguyên! Huyết khí bùng cháy: công ×${Math.pow(1.5, this.burns).toFixed(2)}, linh lực hồi đầy.`);
        break;
      }
      case 'uy':
        if (!this.canUy()) return false;
        this.log.push(`${this.p.name} phóng uy áp ${REALMS[effRi()].n}. ${this.foe.name} quỳ rạp, không còn sức phản kháng.`);
        this.foe.hp = 0;
        for (const x of this.foes) x.hp = 0;
        break;
      case 'flee': {
        if (this.opts.noFlee) return false;
        const tal = this.fleeTalis();
        const fp = this.fleeChance();
        if (tal) { removeItem('t:' + tal.id); this.log.push(`${this.p.name} kích phát ${tal.n}!`); }
        if (this.ch(fp)) { this.log.push(`${this.p.name} thoát thân thành công.`); this.over = 'fled'; this.acts.push(a); return true; }
        this.log.push(`${this.p.name} định bỏ chạy nhưng bị chặn lại.`);
        this.acts.push(a);
        this.endTurn();
        return true;
      }
      case 'end':
        this.acts.push(a);
        this.endTurn();
        return true;
      case 'auto':
        this.acts.push(a);
        this.autoRest();
        return true;
    }
    this.acts.push(a);
    this.checkOver();
    return true;
  }

  private useItem(id: string, g: number) {
    const [k, key] = id.split(':');
    removeItem(id, 1, g);
    if (k === 'p') {
      const h = Math.round(this.p.maxHp * PILLS[key].v / 100);
      this.p.hp = Math.min(this.p.maxHp, this.p.hp + h);
      this.log.push(`${this.p.name} nuốt ${PILLS[key].n}, hồi ${h} khí huyết.`);
      return;
    }
    const t = TALIS[key];
    const gm = (GRADE_MULT[g] ?? 1) * (t.co ? 10 : 1);
    const power = Math.max(this.p.atk, Math.max(10, REALMS[t.p - 1].pow) * 1.2) * gm;
    if (t.k === 'atk') this.hit({ ...this.p, atk: power }, this.foe, t.m, t.el, `phù ${t.n}`);
    else if (t.k === 'shield') { this.p.shield += Math.round(power * t.m * 1.5); this.log.push(`${this.p.name} kích phát ${t.n}, hộ thuẫn ${this.p.shield}.`); }
    else { const h = Math.round(this.p.maxHp * t.m * 0.5); this.p.hp = Math.min(this.p.maxHp, this.p.hp + h); this.log.push(`${this.p.name} đốt ${t.n}, hồi ${h} khí huyết.`); }
  }

  private checkOver(): boolean {
    if (this.foe.hp <= 0 && this.foes.every((x) => x.hp <= 0)) { this.over = 'win'; return true; }
    if (this.p.hp <= 0) { this.over = 'lose'; return true; }
    return false;
  }

  /** Kết thúc lượt người chơi: đồng hành ra tay, độc, lượt cả nhóm địch (có thể dừng chờ cứu đồng hành), sang hiệp mới. */
  endTurn() {
    if (this.over) return;
    // đồng hành tự đánh: mỗi người một đòn vào một kẻ địch còn sống (ưu tiên kẻ chính)
    for (const al of this.allies) {
      if (al.hp <= 0 || al.fled) continue;
      const tg = this.foeSide();
      if (!tg.length) break;
      const d = this.ch(0.6) && this.foe.hp > 0 ? this.foe : tg[Math.floor(this.rng() * tg.length)];
      const sk = al.skills.length && this.ch(0.5) ? al.skills[Math.floor(this.rng() * al.skills.length)] : null;
      if (sk) this.cast(al, d, sk); else this.hit(al, d, 1, al.el, al.id === 'cl' ? 'vồ cắn' : 'đòn thường');
    }
    for (const f of this.foeSide()) { for (const tk of f.dot) { f.hp -= tk.dmg; tk.turns--; this.log.push(`${f.name} trúng độc/trói, mất ${tk.dmg} khí huyết.`); } f.dot = f.dot.filter((tk) => tk.turns > 0); this.tickHot(f); }
    if (this.checkOver()) return;
    this.foeQueue = this.foeSide();
    this.runFoes();
    if (!this.pending) this.finishRound();
  }
  /** Lượt từng kẻ địch trong hàng đợi; đồng hành sắp gục trong trận sinh tử thì dừng lại chờ người chơi (đánh tay). */
  private runFoes() {
    while (this.foeQueue.length && !this.over) {
      const f = this.foeQueue.shift()!;
      if (f.hp <= 0) continue;
      const it = f === this.foe ? this.intent : this.moveFor(f);
      const side = this.meSide();
      if (!side.length) break;
      // chọn mục tiêu: người chơi dễ bị nhắm hơn một chút
      const w = side.map((x) => (x.player ? 1.5 : 1));
      let x = this.rng() * w.reduce((a, b) => a + b, 0);
      let d = side[0];
      for (let i = 0; i < side.length; i++) { x -= w[i]; if (x <= 0) { d = side[i]; break; } }
      const preHp = d.hp, preSh = d.shield;
      if (it.sk) this.cast(f, d, it.sk); else this.hit(f, d, 1, f.el, 'đòn thường');
      if (!d.player && d.hp <= 0 && this.lethal) {
        const dmg = preHp - Math.min(d.hp, 0) + 0; // sát thương vừa nhận (sau hộ thuẫn)
        if (this.interactive) {
          d.hp = preHp; d.shield = preSh; // hoàn lại, chờ người chơi quyết
          this.pending = { ally: d, attacker: f, label: it.n, dmg: Math.max(1, preHp - Math.max(0, d.hp)) || Math.max(1, dmg) };
          this.pending.dmg = Math.max(1, Math.round(dmg));
          this.log.push(`${d.name} sắp bị ${f.name} đánh gục!`);
          return;
        }
        // tự động: cho chạy trốn ngay
        if (this.ch(this.allyFleeChance(d))) { d.fled = true; d.hp = Math.max(1, Math.round(d.maxHp * 0.1)); this.log.push(`${d.name} liều mạng thoát khỏi vòng chiến, trọng thương.`); }
        else { d.hp = 0; this.log.push(`${d.name} gục xuống dưới tay ${f.name}.`); }
      } else if (!d.player && d.hp <= 0) {
        d.hp = Math.max(1, Math.round(d.maxHp * 0.05)); d.fled = true; // luận bàn: đồng hành chỉ rút lui
        this.log.push(`${d.name} không trụ nổi, lui khỏi vòng chiến.`);
      }
      if (this.checkOver()) return;
    }
  }
  /** Hồi máu theo lượt: chỉ hồi khí huyết (tối đa tới máu tối đa), không đụng tới giáp. */
  private tickHot(x: Fighter) {
    if (!x.hot?.length || x.hp <= 0) return;
    for (const t of x.hot) {
      const got = Math.min(t.v, Math.max(0, x.maxHp - x.hp));
      x.hp += got;
      t.turns--;
      this.log.push(`${x.name} được ${t.n} tái sinh huyết khí, hồi ${got} khí huyết (còn ${t.turns} lượt).`);
    }
    x.hot = x.hot.filter((t) => t.turns > 0);
  }
  /** Đòn của một kẻ địch trong nhóm (kẻ chính dùng intent đã lộ). */
  private moveFor(f: Fighter): Intent {
    const opts: Intent[] = [{ sk: null, n: 'đòn thường', m: 1, k: 'atk' }, ...f.skills.filter((k) => !(k.k === 'shield' && f.shield > 0) && !(k.k === 'heal' && f.hp / f.maxHp > 0.6)).map((k) => ({ sk: k, n: k.n, m: k.m, k: k.k }))];
    return opts[Math.floor(this.rng() * opts.length)];
  }
  /** Sang hiệp mới: độc lên bên ta, hồi linh lực, địch lộ đòn kế. */
  private finishRound() {
    const p = this.p, f = this.foe;
    for (const x of this.meSide()) { for (const tk of x.dot) { x.hp -= tk.dmg; tk.turns--; this.log.push(`${x.name} trúng độc/trói, mất ${tk.dmg} khí huyết.`); } x.dot = x.dot.filter((tk) => tk.turns > 0); }
    if (this.checkOver()) return;
    for (const x of this.meSide()) this.tickHot(x); // còn sống qua hiệp thì mới được hồi theo lượt
    this.round++;
    this.used = [];
    this.itemUsed = false;
    this.guard = false;
    this.mp = Math.min(this.mpMax, this.mp + this.regen);
    this.intent = this.pickIntent();
    if (this.contempt && this.round === 2) {
      this.log.push(`${f.name} biến sắc: "Ngươi… không phải Luyện Khí tầm thường!" Giờ hắn mới dốc toàn lực.`);
      this.contempt = false;
    }
    void p;
    if (this.round > 40) { this.log.push('Hai bên giằng co không phân thắng bại, đành rút lui.'); this.over = 'draw'; }
  }

  // ----- tự đánh -----
  /** Một lượt do máy chọn (dùng cho chế độ tự động, bot, và phần còn lại sau nút Tự động). */
  autoTurn() {
    const p = this.p, f = this.foe;
    if (this.pending) { this.do({ t: 'rescue', mode: 'flee' }); return; }
    if (this.canUy()) { this.do({ t: 'uy' }); return; }
    const hpPct = p.hp / p.maxHp;
    const fleeAt = this.opts.fleeAt ?? (s.flags.fleeAt ?? 0.3);
    if (!this.opts.noFlee && hpPct < fleeAt && f.hp / f.maxHp > 0.3) { this.do({ t: 'flee' }); return; }
    const its = this.items();
    if (!this.itemUsed) {
      const pill = its.find((x) => x.id.startsWith('p:'));
      const tk = (k: string) => its.filter((x) => x.id.startsWith('t:') && TALIS[x.id.slice(2)].k === k).sort((a, b) => TALIS[b.id.slice(2)].tier + (TALIS[b.id.slice(2)].co ? 3 : 0) - TALIS[a.id.slice(2)].tier - (TALIS[a.id.slice(2)].co ? 3 : 0))[0];
      if (hpPct < 0.35 && pill && !this.pillUsed) { this.pillUsed = true; this.do({ t: 'item', id: pill.id, g: pill.g }); }
      else if (hpPct < 0.45 && tk('heal')) { const x = tk('heal')!; this.do({ t: 'item', id: x.id, g: x.g }); }
      else if (hpPct < 0.6 && p.shield <= 0 && this.estIntent() > p.hp * 0.2 && tk('shield')) { const x = tk('shield')!; this.do({ t: 'item', id: x.id, g: x.g }); }
      else if (f.atk * f.hp > p.atk * p.hp && this.atkTal < 2 && tk('atk')) { this.atkTal++; const x = tk('atk')!; this.do({ t: 'item', id: x.id, g: x.g }); }
      if (this.over) return;
    }
    const usable = () => p.skills.filter((k) => this.canUse(k));
    // địch sắp ra đòn nặng → hộ thể / hồi máu trước
    const sh = usable().find((k) => k.k === 'shield');
    if (sh && p.shield <= 0 && this.estIntent() > p.hp * 0.25) this.do({ t: 'sk', id: sh.id });
    const hl = usable().find((k) => k.k === 'heal');
    if (hl && p.hp / p.maxHp < 0.5) this.do({ t: 'sk', id: hl.id });
    if (this.over) return;
    const off = () => usable().filter((k) => k.k === 'atk' || k.k === 'multi' || k.k === 'dot').sort((a, b) => b.m * (b.k === 'multi' ? 3 : 1) - a.m * (a.k === 'multi' ? 3 : 1));
    // linh lực quá thấp và chưa ra chiêu → điều tức
    if (!this.used.length && !off().length && this.mp < this.mpMax * 0.4 && f.hp / f.maxHp > 0.25) { this.do({ t: 'rest' }); return; }
    while (!this.over && off().length) this.do({ t: 'sk', id: off()[0].id });
    if (!this.over) this.do({ t: 'basic' });
    if (!this.over) this.do({ t: 'end' });
  }
  /** Đánh tự động tới hết trận. */
  autoRest() {
    let guard = 0;
    while (!this.over && guard++ < 200) this.autoTurn();
  }

  /** Áp kết quả trận lên nhân vật (thương thế, thọ nguyên, chiến lợi phẩm, tử vong). */
  finish(): FightResult {
    const p = this.p, f = this.foe;
    if (this.burnYears) {
      s.lifeBonus -= this.burnYears;
      addLog(`Thiêu đốt ${this.burnYears} năm thọ nguyên trong trận với ${f.name}.`, 'bad');
    }
    let fled = this.over === 'fled' || this.over === 'draw';
    const win = this.over === 'win';
    let died = false;
    if (this.over === 'lose') {
      if (this.lethal) {
        const keep = 0.3 + clamp(stat('van') - 5, -3, 8) * 0.02 + (has('menhcung') ? 0.5 : 0) - (f.r > p.r ? 0.15 : 0);
        if (this.spec?.kind !== 'boss' && this.ch(keep)) {
          p.hp = 1;
          this.log.push(has('menhcung') ? 'Ngỡ đã chết, nhưng mệnh cứng giữ lại cho ngươi một hơi thở. Ngươi lết đi trong bóng tối.' : 'Ngươi ngã xuống, đối phương tưởng ngươi đã chết nên bỏ đi. Nửa đêm ngươi tỉnh lại giữa vũng máu.');
          fled = true;
        } else {
          died = true;
          killPlayer(`Tử trận dưới tay ${f.name}`);
        }
      } else p.hp = Math.max(1, Math.round(p.maxHp * 0.1));
    }
    s.hurt = clamp(Math.round((1 - Math.max(0, p.hp) / p.maxHp) * 100), 0, 100);
    if (fled && this.over === 'lose') s.hurt = 95;
    const loot: string[] = [];
    let lootMoney = 0;
    let lootDesc = '';
    if (win) {
      s.wins++;
      s.kills++;
      this.log.push(`${f.name} bại trận.`);
      if (!this.opts.noLoot) {
        const lootParts: string[] = [];
        const addLootItem = (id: string, qty = 1, g?: number) => {
          const added = addItem(id, qty, g);
          if (added > 0) {
            loot.push(id);
            lootParts.push(`${added > 1 ? `${added}x ` : ''}${itemName(id, g)}`);
          }
        };

        const isBeast = f.kind === 'beast' || this.spec?.kind === 'beast';
        if (isBeast) {
          // 1. Thịt yêu thú (luôn có)
          const meatQty = clamp(Math.round(1 + (f.r || 0) * 0.5 + this.rng() * 1.5), 1, 4);
          addLootItem('m:thityeu', meatQty);

          // 2. Yêu đan: yêu thú có tu vi (r >= 1) rơi yêu đan, cảnh giới càng cao tỷ lệ càng lớn
          const coreChance = f.r === 0 ? 0.25 : f.r === 1 ? 0.7 : 0.95;
          if (this.ch(coreChance)) {
            addLootItem('m:yeudan', 1);
          }

          // 3. Tùy chủng loại và đặc điểm yêu thú
          const nLower = f.name.toLowerCase();
          // Lông thú (các loài có lông, cầm thú, điêu, hồ, sói...)
          if (/lang|hồ|cáo|điêu|hùng|gấu|chuột|thử|thỏ|tho|điểu|cầm|hạc|ưng|phụng|tước|kê|sư/.test(nLower)) {
            addLootItem('m:longthu', Math.max(1, Math.round(1 + this.rng() * 2)));
          }
          // Da thú (các loài có da giáp, bò, heo, trâu, rắn, mãng, báo, cọp, voi...)
          if (/lang|trư|heo|mãng|xà|rắn|hùng|tê|ngưu|trâu|bò|sư|hổ|cọp|báo|tượng|dực|quái/.test(nLower)) {
            addLootItem('m:dayeu', Math.max(1, Math.round(1 + this.rng() * 2)));
          }
          // Nanh vuốt / sừng nhọn
          if (/hổ|báo|lang|sư|hùng|tê|ngưu|điêu|ưng|kê|nanh|giác|vuốt|trảo/.test(nLower) || this.ch(0.5)) {
            addLootItem('m:yeunha', 1);
          }
          // Cốt yêu thú
          if (f.r >= 2 || this.ch(0.6)) {
            addLootItem('m:yeucot', 1);
          }
          // Độc nang (loài rắn độc, bọ cạp, rết, nhện, sâu bọ, độc trùng...)
          if (/độc|doc|xà|mãng|ngô công|hạt|chu|nhện|trùng|cóc|thi quỷ/.test(nLower)) {
            addLootItem('m:docnang', 1);
          }
          // Vảy giao long / lân giáp (giao long, long, lân, mãng xà, rùa...)
          if (/giao|long|lân|mãng|hải|ngư|quy|rùa|kỳ lân/.test(nLower)) {
            addLootItem('m:longlan', 1);
          }
          // Huyết mạch tinh hoa / Tổ thú tinh huyết đối với dị thú thượng cổ
          if (f.r >= 4 && (/thánh thú|dị thú|tổ thú|thần thú|vương|thượng cổ|bạch trạch|phệ hồn|kỳ lân/.test(nLower) || this.ch(0.2))) {
            addLootItem(f.r >= 6 ? 'm:cotuhuyet' : 'm:tuduehuyet', 1);
          }
          // Vật liệu chỉ định riêng của loài
          if (this.spec?.mat && !loot.includes('m:' + this.spec.mat)) {
            addLootItem('m:' + this.spec.mat, 1);
          }

          lootDesc = `Thu hoạch từ xác ${f.name}: ${lootParts.join(', ')}`;
          this.log.push(lootDesc);
          addLog(lootDesc, 'good');
        } else {
          // Tu sĩ / Kẻ địch dạng người / Ma tu / Boss
          // 1. Linh thạch trong Trữ Vật Giới Chỉ
          const baseMoneyByR = [20, 60, 250, 1200, 5000, 20000, 80000, 300000, 1000000];
          const bm = baseMoneyByR[Math.min(baseMoneyByR.length - 1, f.r || 0)];
          lootMoney = Math.max(10, Math.round(bm * (0.8 + this.rng() * 0.6) * (f.kind === 'boss' ? 2 : 1)));
          s.money += lootMoney;

          // 2. Đan dược trong túi trữ vật của đối phương
          const poolPills = worldDefinitions('p').filter((p) => p.tier <= Math.min(6, (f.r || 1) + 1));
          if (poolPills.length && this.ch(0.85)) {
            const p = poolPills[Math.floor(this.rng() * poolPills.length)];
            addLootItem('p:' + p.id, 1, 1);
          }

          // 3. Phù lục trong túi trữ vật
          const poolTalis = worldDefinitions('t').filter((t) => !t.co && t.tier <= Math.min(6, (f.r || 1) + 1));
          if (poolTalis.length && this.ch(0.75)) {
            const t = poolTalis[Math.floor(this.rng() * poolTalis.length)];
            addLootItem('t:' + t.id, 1 + (this.ch(0.4) ? 1 : 0), 1);
          }

          // 4. Linh thảo hoặc khoáng thạch mang theo
          if (this.ch(0.7)) {
            const poolMats = Object.values(MATS).filter((m) => m.tier <= Math.min(6, (f.r || 1) + 1) && m.id !== 'phuchi' && m.id !== 'chusa');
            if (poolMats.length) {
              const m = poolMats[Math.floor(this.rng() * poolMats.length)];
              addLootItem('m:' + m.id, 1 + (this.ch(0.3) ? 1 : 0));
            }
          }

          // 5. Trang bị / Pháp bảo rơi ra
          if (this.ch(f.kind === 'boss' ? 0.9 : 0.35)) {
            const g = clamp(Math.round(1 + this.rng() * Math.min(5, f.r + 1)), 1, 6);
            const gr = mkGear(Math.min(RMAX(), f.r), g);
            if (addGear(gr)) {
              lootParts.push(`pháp bảo ${gr.n}`);
            }
          }

          // 6. Tàn bản công pháp / bí kíp kỹ pháp (khi tu vi cao hoặc boss)
          if ((f.r >= 3 || f.kind === 'boss') && this.ch(0.25)) {
            const poolSks = worldDefinitions('sk').filter((k) => !k.peak && k.tier <= Math.min(6, Math.ceil(((f.r || 1) + 1) / 2)) && !s.known.includes(k.id));
            if (poolSks.length) {
              const sk = poolSks[Math.floor(this.rng() * poolSks.length)];
              addLootItem('sk:' + sk.id, 1);
            }
          }

          lootDesc = `Tịch thu Trữ Vật Giới Chỉ của ${f.name}: được ${lootMoney} linh thạch${lootParts.length ? `, ` + lootParts.join(', ') : ''}`;
          this.log.push(lootDesc);
          addLog(lootDesc, 'good');
        }
      }
    } else if (!fled && !died) this.log.push(`${p.name} bại trận.`);
    if (died) addLog(`Tử trận dưới tay ${f.name}.`, 'bad');
    const lost: string[] = [], injured: string[] = [];
    for (const al of this.allies) {
      if (al.id === 'cl') {
        if (al.hp <= 0 && !al.fled) { lost.push(al.name); addLog(`Chân linh ${al.name} chết trong trận với ${f.name}.`, 'bad'); delete s.flags.chanlinh; }
        continue;
      }
      const n = al.id ? findNpc(al.id) : null;
      if (!n) continue;
      if (al.hp <= 0 && !al.fled) { lost.push(n.name); n.alive = false; n.died = s.year; n.cause = `Tử trận cùng ${s.name} dưới tay ${f.name}`; addLog(`${n.name} tử trận dưới tay ${f.name}.`, 'bad'); }
      else if (al.fled) { injured.push(n.name); n.injuredUntil = s.year + 1; addLog(`${n.name} trọng thương, cần một năm dưỡng thương.`); }
    }
    if (!died && age() >= maxLife()) killPlayer('Thiêu đốt thọ nguyên đến cạn kiệt, vũ hóa giữa trận');
    const res: FightResult = { win, fled, died, rounds: this.round, log: this.log, foe: f, hpLeft: Math.max(0, p.hp) / p.maxHp, loot, lootMoney, lootDesc, lost, injured };
    fightLogs.push(res);
    return res;
  }
}

// ---------- Đánh tay: tạm dừng sự kiện để người chơi tự đánh ----------
export class FightPending {
  constructor(public spec: FoeSpec | Fighter, public opts: FightOpts, public seed: number) {}
}
/** Khi có ngữ cảnh (đang chạy lựa chọn từ giao diện), trận chưa có kịch bản sẽ ném FightPending. */
let ctx: { scripts: Script[]; i: number } | null = null;
export const setFightCtx = (c: typeof ctx) => (ctx = c);
export const manualFights = () => !s.flags.autoFight;

export function fight(spec: FoeSpec | Fighter, opts: FightOpts = {}): FightResult {
  if (ctx && manualFights()) {
    const sc = ctx.scripts[ctx.i];
    if (!sc) throw new FightPending(spec, opts, Math.floor(Math.random() * 2 ** 31));
    ctx.i++;
    const b = new Battle(spec, opts, sc.seed);
    b.interactive = true;
    for (const a of sc.acts) b.do(a);
    if (!b.over) b.autoRest();
    return b.finish();
  }
  const b = new Battle(spec, opts, Math.floor(Math.random() * 2 ** 31));
  b.autoRest();
  return b.finish();
}

export function fightSummary(r: FightResult) {
  const tail = `${r.lost?.length ? ` Tử trận: ${r.lost.join(', ')}.` : ''}${r.injured?.length ? ` Trọng thương: ${r.injured.join(', ')}.` : ''}`;
  if (r.died) return `Ngươi gục xuống trước ${r.foe.name}.`;
  if (r.win) {
    const spoils = r.lootDesc ? `\n${r.lootDesc}.` : '';
    return `Ngươi đánh bại ${r.foe.name} sau ${r.rounds} hiệp, còn ${Math.round(r.hpLeft * 100)}% khí huyết.${tail}${spoils}`;
  }
  if (r.fled) return `Ngươi thoát khỏi ${r.foe.name}, còn ${Math.round(r.hpLeft * 100)}% khí huyết.${tail}`;
  return `Ngươi thua ${r.foe.name}, may mà giữ được mạng.${tail}`;
}
/** Dựng đồng hành thành chiến binh: chân linh theo sức chủ; NPC theo cảnh giới, tư chất, hệ. */
function allyFighters(p: Fighter, rng: Rng): Fighter[] {
  const out: Fighter[] = [];
  const cl = myLinh();
  if (cl && CHANLINH[cl.id] && !cl.ride) { // chỉ để cưỡi thì không vào trận
    const d = CHANLINH[cl.id];
    const clState = cl as any;
    const beastR = clState.r ?? p.r;
    const beastSt = clState.st ?? 0;
    const stage = clState.stage || 'truongthanh';
    const stageMul = stage === 'truongthanh' ? 1.3 : stage === 'aunen' ? 0.9 : 0.7;
    const hp = Math.round(p.maxHp * 0.35 * stageMul);
    out.push({
      id: 'cl',
      name: `${cl.name} (${STAGE_NAMES[stage as BeastStage] || 'Linh thú'})`,
      r: beastR,
      st: beastSt,
      el: d.el,
      hp,
      maxHp: hp,
      atk: Math.round(p.atk * (0.25 + cl.bond / 400) * stageMul),
      def: Math.round(p.def * 0.5 * stageMul),
      skills: [],
      shield: 0,
      dot: [],
      kind: 'beast',
    });
  }
  for (const n of activeNpcs()) {
    const f = mkFoe({ name: n.name, r: n.r, st: n.st, el: n.el, kind: 'cultivator', mult: compMul(n) }, rng);
    const ks = kitSum(n), sk = kitSkills(n).map((k) => SKILLS[k]);
    const hp = f.maxHp + ks.hp;
    out.push({ ...f, id: n.id, g: n.g, pic: n.pic, atk: f.atk + ks.atk, def: f.def + ks.def, hp, maxHp: hp, skills: sk.length ? sk : f.skills });
  }
  return out;
}

/** So tương quan sức mạnh: >1 là người chơi mạnh hơn. */
export function compare(spec: FoeSpec): number {
  const f = mkFoe(spec);
  return (atkOf() * maxHp()) / (f.atk * f.hp);
}
export function dangerLabel(spec: FoeSpec): string {
  const c = compare(spec);
  if (c > 3) return 'dễ như trở bàn tay';
  if (c > 1.4) return 'nắm chắc phần thắng';
  if (c > 0.8) return 'ngang tài ngang sức';
  if (c > 0.4) return 'rất nguy hiểm';
  return 'chắc chắn chết';
}
void rf; void ri;
