// Trạng thái một kiếp (s) và dữ liệu xuyên kiếp (meta). Lưu localStorage.
import type { El, StatKey } from '../data/core';
import type { Gear } from '../data/items';

export interface BagItem {
  id: string; // 'h:' linh thảo · 'p:' đan · 'm:' vật liệu · 't:' phù · 'cp:' bí kíp công pháp · 'sk:' sách thuật · 'x:' vật đặc biệt
  n: number;
  g?: number; // phẩm (đan dược)
}

export type NpcTag = 'friend' | 'enemy' | 'master' | 'disciple' | 'daolu' | 'rival' | 'kin' | 'acq' | 'senior' | 'peer';
export interface NPC {
  id: string;
  name: string;
  g: 'm' | 'f';
  born: number; // năm sinh (năm thế giới)
  life: number;
  r: number;
  st: number;
  el: El;
  sect: string | null;
  rel: number; // -100..100
  tag: NpcTag;
  luck?: number;
  spouseRole?: 'primary' | 'concubine';
  how: string;
  alive: boolean;
  loc: string;
  trait: string;
  died?: number;
  cause?: string;
  talent: number; // 0.3..2 tốc độ tu luyện
  gift?: number; // năm gần nhất được tặng quà (tránh spam)
  met: number;
  /** Khoá chân dung riêng (vd. 'sn_tutieu' cho thánh nữ Tử Tiêu). */
  pic?: string;
  /** Trọng thương sau khi chạy thoát khỏi trận: không xuất trận được tới năm này. */
  injuredUntil?: number;
  /** Năm bị mời đồng hành gần nhất (từ chối thì đợi một năm). */
  inviteY?: number;
  /** Bộ đồ của đồng hành: trang bị 5 ô, công pháp, chiêu đã học, tiến độ tu luyện. Luôn tự phối mạnh nhất khi ra trận. */
  kit?: { gear: (Gear | null)[]; tech: string | null; known: string[]; p?: number };
  /** Hồ sơ (thánh nữ có hôn ước…): ngoại hình, linh căn, thể chất, thiên phú. */
  bio?: { look: string; root: string; els?: El[]; body: string; perk: string; family?: string; traits?: string; hobby?: string; bodyD?: string; perkD?: string };
}

export interface Pin {
  id: string;
  k: '?' | '!' | 'bao' | 'bi';
  x: number;
  y: number;
  lv: number;
  until: number; // năm biến mất
  reg: string;
}

export interface LogLine {
  y: number;
  t: string;
  k?: 'mark' | 'bad' | 'good' | 'ai';
}

export interface State {
  v: 1;
  id: string;
  name: string;
  g: 'm' | 'f';
  origin: string;
  race?: string;
  beast?: string;
  year: number; // năm thế giới hiện tại (số thực)
  born: number;
  stats: Record<StatKey, number>;
  root: { k: number; els: El[] };
  body: string;
  perks: string[];
  r: number;
  st: number;
  prog: number; // 0..100 tiến độ tiểu cảnh giới hiện tại
  hurt: number; // 0..100 thương thế
  tamma: number; // 0..100 tâm ma
  money: number;
  loc: string;
  x: number;
  y: number;
  tech: string | null;
  techM: number; // độ thuần thục công pháp 0..100
  known: string[]; // thuật pháp đã học
  skills: string[]; // thuật pháp mang theo (≤4)
  gear: (Gear | null)[];
  gearBag: Gear[];
  refining: { uid: string; left: number } | null;
  bag: BagItem[];
  meridians: number; // số kinh mạch đã đả thông (0..12)
  merProg: number;
  sect: { id: string; rank: number; contrib: number; joined: number; lastPay: number } | null;
  sectHist: Record<string, 'left' | 'expelled' | 'betrayed'>;
  npcs: NPC[];
  craft: { alch: number; talis: number; forge: number; ax: number; tx: number; fx: number };
  recipes: string[]; // đan phương / phù phương đã biết
  lifeBonus: number;
  lifePills: number;
  fame: number;
  evil: number;
  good: number;
  kills: number;
  wins: number;
  flags: Record<string, any>;
  evSeen: Record<string, number>; // id sự kiện → năm gặp gần nhất
  log: LogLine[];
  marks: LogLine[];
  pins: Pin[];
  turns: number;
  bestPower: number;
  dead?: { cause: string; y: number };
  ascended?: boolean;
  world?: number; // giới hiện tại: 0 Thương Lan Giới, 1 Linh Giới…
}

export interface LifeRec {
  id: string;
  name: string;
  g: 'm' | 'f';
  origin: string;
  root: string;
  realm: string;
  r: number;
  age: number;
  cause: string;
  score: number;
  karma: number;
  year: number;
  marks: string[];
  epitaph: string;
  bio?: string;
  ascended?: boolean;
  sect?: string;
}

export interface Meta {
  v: 1;
  lives: LifeRec[];
  karma: number; // điểm luân hồi hiện có
  karmaTotal: number;
  up: Record<string, number>; // nâng cấp luân hồi đã mua
  codex: { loc: string[]; beast: string[]; item: string[]; tech: string[]; sect: string[] };
  ach: string[];
  settings: { ai: boolean; url: string; model: string; aiBio: boolean; anim: boolean; free: boolean };
  worldYear: number; // năm thế giới tiếp tục qua các kiếp
  seenIntro: boolean;
}

const SAVE_KEY = 'tienlo.save.v1';
const META_KEY = 'tienlo.meta.v1';

export let s: State = null as unknown as State;
export const setState = (n: State) => {
  s = n;
  if (!s.bag.some((item) => item.id === 'x:ngocboidoi')) s.bag.push({ id: 'x:ngocboidoi', n: 1 });
};

export const meta: Meta = loadMeta();

function loadMeta(): Meta {
  const base: Meta = {
    v: 1,
    lives: [],
    karma: 0,
    karmaTotal: 0,
    up: {},
    codex: { loc: [], beast: [], item: [], tech: [], sect: [] },
    ach: [],
    settings: { ai: true, url: 'http://127.0.0.1:11434', model: 'huihui_ai/qwen3-abliterated:14b', aiBio: true, anim: true, free: true },
    worldYear: 3120,
    seenIntro: false,
  };
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return base;
    const m = JSON.parse(raw);
    return { ...base, ...m, codex: { ...base.codex, ...(m.codex || {}) }, settings: { ...base.settings, ...(m.settings || {}) } };
  } catch {
    return base;
  }
}

export function saveMeta() {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function save() {
  if (!s) return;
  if (s.dead || s.ascended) localStorage.removeItem(SAVE_KEY);
  else localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  saveMeta();
}

export function load(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const st = JSON.parse(raw) as State;
    if (st.v !== 1 || st.dead) return false;
    // bản lưu cũ ghi loại dấu bằng chữ Hán → mã chữ cái
    for (const p of st.pins || []) { const k = p.k as string; if (k === '\u5bf6') p.k = 'bao'; else if (k === '\u79d8') p.k = 'bi'; }
    // bản lưu từ bản đồ nhỏ (2400×1600) → bản đồ lớn
    if (!st.flags.mapV2) {
      st.x = st.x * 2 + 300;
      st.y = st.y * 2 + 450;
      for (const p of st.pins) { p.x = p.x * 2 + 300; p.y = p.y * 2 + 450; }
      st.flags.mapV2 = true;
    }
    // thang bậc tông môn 5 bậc cũ → 11 bậc
    if (st.sect && !st.flags.rankV2) {
      const old = st.sect.rank;
      st.sect.rank = st.flags.thanhtu === st.sect.id ? 8 : [0, 1, 2, 5, 7][old] ?? old;
    }
    st.flags.rankV2 = true;
    s = st;
    return true;
  } catch {
    return false;
  }
}

export function wipeSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function codexAdd(k: keyof Meta['codex'], id: string) {
  if (!meta.codex[k].includes(id)) meta.codex[k].push(id);
}
