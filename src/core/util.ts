// Tiện ích chung: ngẫu nhiên, định dạng số, thoát HTML.

export const rnd = () => Math.random();
export const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const rf = (a: number, b: number) => a + Math.random() * (b - a);
export const ch = (p: number) => Math.random() < p;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export const uid = () => Math.random().toString(36).slice(2, 10);

export function wpick<T>(items: readonly T[], w: (t: T) => number): T {
  let total = 0;
  for (const it of items) total += Math.max(0, w(it));
  let r = Math.random() * total;
  for (const it of items) {
    r -= Math.max(0, w(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const esc = (s: unknown) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Số lớn theo cách đọc Việt: 12.500 → "1,25 vạn". */
/** Đơn vị theo bậc 10^(4k): vạn, ức, vạn ức, kinh, cai, vạn cai, nhương, câu, giản, chính, tải, cực. */
const BIG_UNITS = ['', 'vạn', 'ức', 'vạn ức', 'kinh', 'cai', 'vạn cai', 'nhương', 'câu', 'giản', 'chính', 'tải', 'cực'];
export function fmt(n: number): string {
  n = Math.floor(n);
  const a = Math.abs(n);
  if (a >= 1e12) {
    // đơn vị cổ, mỗi bậc gấp vạn lần (bỏ "triệu", "tỷ" vì trùng nghĩa hiện nay → vạn ức, vạn cai)
    const k = Math.floor(Math.log10(a) / 4);
    const unit = BIG_UNITS[Math.min(k, BIG_UNITS.length - 1)];
    const m = n / Math.pow(10, 4 * Math.min(k, BIG_UNITS.length - 1));
    return m.toFixed(Math.abs(m) >= 10 ? 0 : 1).replace('.', ',') + ' ' + unit;
  }
  if (a >= 1e8) return (n / 1e8).toFixed(a >= 1e9 ? 0 : 1).replace('.', ',') + ' ức';
  if (a >= 1e5) return (n / 1e4).toFixed(a >= 1e6 ? 0 : 1).replace('.', ',') + ' vạn';
  return n.toLocaleString('vi-VN');
}

export const pct = (p: number) => Math.round(clamp(p, 0, 1) * 100) + '%';

/** Năm (số thực) → "12 năm 3 tháng". */
export function yearsTxt(y: number): string {
  const total = Math.round(y * 12);
  const yy = Math.floor(total / 12);
  const mm = total % 12;
  if (yy === 0) return `${Math.max(1, mm)} tháng`;
  return mm ? `${yy} năm ${mm} tháng` : `${yy} năm`;
}

/** Ngẫu nhiên có hạt giống (mulberry32) — dùng cho hàng hóa cửa tiệm để không đổi mỗi lần mở. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
