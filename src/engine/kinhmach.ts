// Kinh mạch: bàn ô hình thân người. Võ công đang mang và tâm kinh đang vận là các "mảnh" hình khối,
// xếp lên những ô đã khai mở. Hai mảnh chạm nhau đồng hệ / tương sinh thì kinh mạch thông (tăng uy lực),
// tương khắc thì nghịch (giảm). Huyệt vị (ô vàng) tăng thêm cho mảnh hợp linh căn.
// Võ công chưa xếp vào kinh mạch chỉ phát huy 85% uy lực.
import { SINH, khacOf, REALMS, type El } from '../data/core';
import { SKILLS, TAMPHAP } from '../data/items';
import { s } from './state';
import { effRi, tamActive, body } from './char';
import { slots } from './slots';

export const KMW = 9, KMH = 10;
const hstr = (t: string) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; };
const seeded = (seed: number) => () => ((seed = (seed + 0x6d2b79f5) >>> 0), (((seed ^ (seed >>> 15)) * (seed | 1)) >>> 0) / 4294967296);
/** Ô hợp lệ: bỏ ba ô ở mỗi góc → 78 ô, dáng thân người. */
const valid = (x: number, y: number) => Math.min(x, KMW - 1 - x) + Math.min(y, KMH - 1 - y) >= 2;
/** Thứ tự khai mở: từ đan điền (giữa thân) lan ra ngoài. */
const ORDER: number[] = (() => {
  const a: [number, number][] = [];
  for (let y = 0; y < KMH; y++) for (let x = 0; x < KMW; x++) if (valid(x, y)) a.push([y * KMW + x, Math.hypot((x - 4) * 1.05, (y - 5.4) * 0.82) + (hstr(`${x},${y}`) % 100) / 330]);
  return a.sort((p, q) => p[1] - q[1]).map((p) => p[0]);
})();
export const KM_TOTAL = ORDER.length;
/** Huyệt vị: rải từ đan điền ra, hai huyệt cách nhau ít nhất 3 ô. */
const HX_ORD: number[] = (() => {
  const a: number[] = [];
  for (const i of ORDER) { const x = i % KMW, y = Math.floor(i / KMW); if (a.every((j) => Math.abs((j % KMW) - x) + Math.abs(Math.floor(j / KMW) - y) >= 3)) a.push(i); if (a.length >= 20) break; }
  return a;
})();
export const HX_NAME = ['Khí Hải', 'Đản Trung', 'Bách Hội', 'Mệnh Môn', 'Thần Khuyết', 'Ấn Đường', 'Kiên Tỉnh tả', 'Kiên Tỉnh hữu', 'Khúc Trì tả', 'Khúc Trì hữu', 'Lao Cung tả', 'Lao Cung hữu', 'Hoàn Khiêu tả', 'Hoàn Khiêu hữu', 'Túc Tam Lý tả', 'Túc Tam Lý hữu', 'Dũng Tuyền tả', 'Dũng Tuyền hữu', 'Thiên Đột', 'Đại Chùy'];
const KM_N = [4, 10, 18, 26, 34, 42, 50, 58, 66, 72];
const HX_N = [0, 1, 2, 3, 4, 6, 8, 10, 12, 14];
/** Số ô khai mở: theo cảnh giới, mỗi kinh mạch đả thông thêm 2 ô. */
export const kmOpen = () => Math.min(KM_TOTAL, (KM_N[Math.min(9, effRi())] ?? 72) + Math.max(0, effRi() - 9) * 2 + s.meridians * 2);
const hxCap = () => 12 + (['hondon', 'thiendo', 'kimcuong', 'cuuduong', 'thaiam'].includes(body().id) ? 4 : 0);
export const hxCount = () => Math.min(20, Math.round(((HX_N[Math.min(9, effRi())] ?? 14) + Math.max(0, effRi() - 9)) * hxCap() / 12));

// ---------- Mảnh ----------
/** Số ô kinh mạch một võ công chiếm, theo giai. */
export const skSize = (tier: number) => (tier >= 5 ? 6 : tier >= 3 ? 5 : tier >= 1 ? 4 : 3);
export interface Piece { id: string; kind: 'sk' | 'tk'; key: string; n: string; el: El | null; size: number; shape: [number, number][] }
const norm = (c: [number, number][]) => { const mx = Math.min(...c.map((p) => p[0])), my = Math.min(...c.map((p) => p[1])); return c.map(([x, y]) => [x - mx, y - my] as [number, number]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
export const kmRot = (c: [number, number][], r: number) => { let o = c; for (let i = 0; i < (r & 3); i++) o = norm(o.map(([x, y]) => [-y, x] as [number, number])); return o; };
export function shapeOf(id: string, n: number): [number, number][] {
  const rnd = seeded(hstr(id));
  const c: [number, number][] = [[0, 0]];
  const has = (x: number, y: number) => c.some((p) => p[0] === x && p[1] === y);
  while (c.length < n) {
    const b = c[Math.floor(rnd() * c.length)], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rnd() * 4)];
    if (!has(b[0] + d[0], b[1] + d[1])) c.push([b[0] + d[0], b[1] + d[1]]);
  }
  return norm(c);
}
export function kmPieces(): Piece[] {
  const P: Piece[] = [];
  for (const k of s.skills) { const sk = SKILLS[k]; if (sk) P.push({ id: 'sk:' + k, kind: 'sk', key: k, n: sk.n, el: sk.el, size: skSize(sk.tier), shape: [] }); }
  for (const k of tamActive()) { const t = TAMPHAP[k]; if (t) P.push({ id: 'tk:' + k, kind: 'tk', key: k, n: t.n, el: null, size: 2 + Math.ceil(t.tier / 2), shape: [] }); }
  for (const p of P) p.shape = shapeOf(p.id, p.size);
  return P;
}
export const KM_KIND = { sk: 'Võ công', tk: 'Tâm kinh' };
type Pl = { x: number; y: number; r: number };
const store = (): Record<string, Pl> => (s.flags.kmb ||= {});
export function kmCells(p: Piece, pl: Pl): [number, number][] {
  const sh = kmRot(p.shape, pl.r), a = sh[0];
  return sh.map(([x, y]) => [pl.x + x - a[0], pl.y + y - a[1]]);
}

// ---------- Quan hệ ngũ hành ----------
export const kmRel = (a: El | null, b: El | null): 'dong' | 'sinh' | 'khac' | null =>
  !a || !b ? null : a === b ? 'dong' : SINH[a] === b || SINH[b] === a ? 'sinh' : khacOf(a)?.includes(b) || khacOf(b)?.includes(a) ? 'khac' : null;
/** Quan hệ hệ của mảnh với linh căn: hợp mệnh, mệnh sinh, sinh mệnh (dưỡng), khắc mệnh. */
export function kmRoot(e: El | null): 'menh' | 'sinh' | 'duong' | 'khac' | null {
  const R = s.root.els;
  if (!e || !R.length) return null;
  if (R.includes(e)) return 'menh';
  if (R.some((r) => SINH[r] === e)) return 'sinh';
  if (R.some((r) => SINH[e] === r)) return 'duong';
  if (R.some((r) => khacOf(r)?.includes(e) || khacOf(e)?.includes(r))) return 'khac';
  return null;
}
export const KM_ROOT: Record<string, [string, number]> = { menh: ['Hợp mệnh', 0.08], sinh: ['Mệnh sinh', 0.12], duong: ['Dưỡng mệnh', 0.04], khac: ['Khắc mệnh', -0.08] };
const hxMatch = (e: El | null) => ['menh', 'sinh'].includes(kmRoot(e) ?? '');

// ---------- Tính toán ----------
export interface KmCalc {
  P: Piece[]; B: Map<number, string>; cells: Record<string, [number, number][]>; open: Set<number>; HX: Set<number>;
  links: { a: string; b: string; k: 'dong' | 'sinh' | 'khac' }[]; edges: { x: number; y: number; dx: number; dy: number; k: 'thong' | 'khac' }[];
  per: Record<string, number>; atk: number; sp: number; used: number; hxOn: Record<string, number>;
}
let cKey = '', cVal: KmCalc | null = null;
export function kmCalc(): KmCalc {
  const key = JSON.stringify([s.flags.kmb, s.skills, tamActive(), s.root.els, effRi(), s.meridians, s.body]);
  if (cVal && key === cKey) return cVal;
  const P = kmPieces(), open = new Set(ORDER.slice(0, kmOpen())), B = new Map<number, string>(), cells: KmCalc['cells'] = {};
  const st = store();
  for (const p of P) {
    const pl = st[p.id];
    if (!pl) continue;
    const cs = kmCells(p, pl);
    if (cs.some(([x, y]) => x < 0 || y < 0 || x >= KMW || y >= KMH || !open.has(y * KMW + x) || B.has(y * KMW + x))) { delete st[p.id]; continue; }
    cs.forEach(([x, y]) => B.set(y * KMW + x, p.id));
    cells[p.id] = cs;
  }
  for (const id of Object.keys(st)) if (!P.some((p) => p.id === id)) delete st[id];
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  const links: KmCalc['links'] = [], edges: KmCalc['edges'] = [], seen = new Set<string>();
  for (const [i, id] of B) {
    const x = i % KMW, y = Math.floor(i / KMW);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (x + dx >= KMW || y + dy >= KMH) continue;
      const id2 = B.get((y + dy) * KMW + x + dx);
      if (!id2 || id2 === id) continue;
      const r = kmRel(byId[id].el, byId[id2].el);
      if (!r) continue;
      edges.push({ x, y, dx, dy, k: r === 'khac' ? 'khac' : 'thong' });
      const pk = [id, id2].sort().join('|');
      if (!seen.has(pk)) { seen.add(pk); links.push({ a: id, b: id2, k: r }); }
    }
  }
  const HX = new Set(HX_ORD.slice(0, hxCount()).filter((i) => open.has(i)));
  const hxOn: Record<string, number> = {}, per: Record<string, number> = {};
  let atk = 0, sp = 0, used = 0;
  for (const p of P) {
    if (!cells[p.id]) continue;
    used += cells[p.id].length;
    const hx = cells[p.id].filter(([x, y]) => HX.has(y * KMW + x)).length;
    hxOn[p.id] = hx;
    const g = links.filter((l) => (l.a === p.id || l.b === p.id) && l.k !== 'khac').length;
    const r = links.filter((l) => (l.a === p.id || l.b === p.id) && l.k === 'khac').length;
    const rt = kmRoot(p.el);
    per[p.id] = Math.max(0.6, Math.min(2.2, 1 + (rt ? KM_ROOT[rt][1] : 0) + 0.06 * g - 0.08 * r + hx * (hxMatch(p.el) ? 0.06 : 0.015)));
    if (p.kind === 'tk') { sp += 0.03 + hx * 0.02; atk += 0.02; }
    if (rt === 'duong') sp += 0.02;
  }
  for (const l of links) { if (l.k === 'khac') { atk -= 0.035; sp -= 0.03; } else { atk += 0.025; sp += 0.02; } }
  cKey = key;
  cVal = { P, B, cells, open, HX, links, edges, per, atk, sp, used, hxOn };
  return cVal;
}
export const kmReset = () => { cKey = ''; };

/** Hệ số uy lực của một võ công theo kinh mạch (chưa xếp: ×0,85). */
export function kmSkMul(skillId: string): number {
  if (!s || skillId === 'quyen') return 1;
  const C = kmCalc();
  return C.cells['sk:' + skillId] ? C.per['sk:' + skillId] ?? 1 : 0.85;
}
export const kmAtk = () => (s ? kmCalc().atk : 0);
export const kmCult = () => (s ? kmCalc().sp : 0);
slots.kmAtk = kmAtk;
slots.kmCult = kmCult;

// ---------- Đặt / gỡ ----------
export function kmCanPlace(C: KmCalc, p: Piece, x: number, y: number, r: number): boolean {
  return kmCells(p, { x, y, r }).every(([a, b]) => a >= 0 && b >= 0 && a < KMW && b < KMH && C.open.has(b * KMW + a) && (!C.B.has(b * KMW + a) || C.B.get(b * KMW + a) === p.id));
}
export function kmPlace(id: string, x: number, y: number, r: number): boolean {
  const C = kmCalc(), p = C.P.find((q) => q.id === id);
  if (!p || !kmCanPlace(C, p, x, y, r)) return false;
  store()[id] = { x, y, r };
  kmReset();
  return true;
}
export function kmRemove(id: string) { delete store()[id]; kmReset(); }
export const kmPlacement = (id: string): Pl | undefined => store()[id];
/** Đặt một mảnh vào chỗ tốt nhất còn trống (không xê dịch mảnh khác). */
export function kmPlaceOne(id: string): boolean {
  const C = kmCalc(), p = C.P.find((q) => q.id === id);
  if (!p) return false;
  if (C.cells[id]) return true;
  let best: (Pl & { sc: number }) | null = null;
  for (let r = 0; r < 4; r++) for (const i of C.open) {
    const x = i % KMW, y = Math.floor(i / KMW);
    if (!kmCanPlace(C, p, x, y, r)) continue;
    const cs = kmCells(p, { x, y, r });
    let sc = 0;
    for (const [a, b] of cs) if (C.HX.has(b * KMW + a)) sc += hxMatch(p.el) ? 4 : 1;
    for (const [a, b] of cs) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const id2 = C.B.get((b + dy) * KMW + a + dx);
      if (!id2 || id2 === id || a + dx < 0 || a + dx >= KMW) continue;
      const q = C.P.find((z) => z.id === id2)!, rl = kmRel(p.el, q.el);
      sc += rl === 'khac' ? -3 : rl ? 2 : 0;
    }
    sc -= Math.hypot(x - 4, y - 5) * 0.05;
    if (!best || sc > best.sc) best = { x, y, r, sc };
  }
  if (!best) return false;
  store()[id] = { x: best.x, y: best.y, r: best.r };
  kmReset();
  return true;
}
/** Gỡ hết rồi tự xếp lại: võ công phẩm cao trước. */
export function kmAutoAll(): number {
  s.flags.kmb = {};
  kmReset();
  const P = kmPieces().sort((a, b) => b.size - a.size);
  let miss = 0;
  for (const p of P) if (!kmPlaceOne(p.id)) miss++;
  return miss;
}
/** Mang theo = đã xếp vào kinh mạch: xếp chỗ trống cho mảnh mới, chiêu nào không xếp được thì cất đi. Trả về tên các chiêu bị cất. */
export function kmSyncSkills(): string[] {
  kmFillNew();
  const C = kmCalc();
  const drop = s.skills.filter((k) => !C.cells['sk:' + k]);
  if (drop.length) { s.skills = s.skills.filter((k) => C.cells['sk:' + k]); kmReset(); }
  return drop.map((k) => SKILLS[k]?.n ?? k);
}
/** Xếp những mảnh mới (vừa mang / vừa vận) vào chỗ trống. */
export function kmFillNew(): number {
  const C = kmCalc();
  let miss = 0;
  for (const p of C.P) if (!C.cells[p.id] && !kmPlaceOne(p.id)) miss++;
  return miss;
}
export const kmRealmName = () => REALMS[Math.min(REALMS.length - 1, effRi())].n;
