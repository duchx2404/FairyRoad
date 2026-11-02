import { effRi } from './char';
// Khung sự kiện. Mỗi gói sự kiện (src/events/*.ts) gọi register([...]).
import type { LocType } from '../data/world';
import { LOCS } from '../data/world';
import { s } from './state';
import { wpick } from '../core/util';

export type Where = LocType | 'road' | 'any' | 'cult' | 'pin?' | 'pin!' | 'pinbao' | 'pinbi';

export interface Choice {
  t: string; // nhãn nút
  dis?: boolean; // vô hiệu
  hint?: string; // chú thích nhỏ dưới nút
  cls?: 'prime' | 'danger';
  fn: () => Outcome;
}
/** Kết quả của một lựa chọn: chuỗi văn bản, hoặc văn bản + lựa chọn tiếp theo (chuỗi sự kiện nhiều bước). */
/** Một mục trong bảng chọn nhiều (vd. chọn vài vị hôn thê). */
export interface PickItem { id: string; label: string; head?: string; info: string[] }
export interface PickSpec { items: PickItem[]; min?: number; confirm: string; done: (ids: string[]) => Outcome; /** Nhãn lựa chọn trước đó, ghép vào đầu dòng "▸" khi hiện kết quả. */ head?: string }
/** quiet: văn bản chỉ là câu hỏi dẫn tới bước chọn tiếp theo — không kể lại, không ghi nhật ký, không AI viết lại. */
export type Outcome = string | { text: string; choices?: Choice[]; title?: string; pick?: PickSpec; quiet?: boolean; songTu?: import('./songtu').SongTuContext };

export interface GameEvent {
  id: string;
  /** Nơi xảy ra. 'road' = trên đường đi, 'cult' = lúc bế quan, 'pin?' = dấu kỳ ngộ trên bản đồ... */
  where: Where[];
  w: number; // trọng số
  title: string | (() => string);
  text: () => string;
  ch: () => Choice[];
  minR?: number;
  maxR?: number;
  reg?: string[]; // giới hạn vùng
  cond?: () => boolean;
  once?: boolean; // mỗi kiếp một lần
  cd?: number; // số năm trước khi lặp lại (mặc định 8)
  minAge?: number;
  maxAge?: number;
}

export const EVENTS: GameEvent[] = [];
export function register(list: GameEvent[]) {
  for (const e of list) {
    if (EVENTS.some((x) => x.id === e.id)) {
      console.warn('Trùng id sự kiện', e.id);
      continue;
    }
    EVENTS.push(e);
  }
}

export function eligible(e: GameEvent, where: Where, place = LOCS[s.loc]): boolean {
  if (!e.where.includes(where) && !e.where.includes('any')) return false;
  if (e.minR !== undefined && effRi() < e.minR) return false;
  if (e.maxR !== undefined && effRi() > e.maxR) return false;
  if (e.reg && !e.reg.includes(place.reg)) return false;
  // minAge xét tuổi thân thể (cưới hỏi…); maxAge xét tuổi linh hồn — kẻ phi thăng mang thân hài nhi nhưng tâm trí ngàn năm, không gặp lại chuyện tuổi thơ
  const age = s.year - s.born;
  const soul = s.year - (s.flags.soulBorn ?? s.born);
  if (e.minAge !== undefined && age < e.minAge) return false;
  if (e.maxAge !== undefined && soul > e.maxAge) return false;
  const seen = s.evSeen[e.id];
  if (seen !== undefined) {
    if (e.once) return false;
    const cd = (e.cd ?? 8) * Math.max(1, effRi() * 0.6);
    if (s.year - seen < cd) return false;
  }
  try {
    if (e.cond && !e.cond()) return false;
  } catch (err) {
    console.warn('Lỗi cond sự kiện', e.id, err);
    return false;
  }
  return true;
}

export function pickEvent(where: Where): GameEvent | null {
  const pool = EVENTS.filter((e) => eligible(e, where));
  if (!pool.length) return null;
  return wpick(pool, (e) => e.w);
}

export function markSeen(e: GameEvent) {
  s.evSeen[e.id] = s.year;
}
export const evTitle = (e: GameEvent) => (typeof e.title === 'function' ? e.title() : e.title);
