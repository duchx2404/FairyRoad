// Bản đồ thủy mặc vẽ bằng canvas: nền tĩnh dựng một lần, lớp động vẽ mỗi khung.
import { worldVer, EMPIRES, empireAt, MAP_W, MAP_H, MAINLAND, LANDS, LANDMASS, REGION_LABELS, ISLANDS, RIVERS, MOUNTAINS, PEAKS, TRUNG_RING, VUC_BORDERS, CHAU_BORDERS, RIVER_LABELS, RIVER_MAJOR, VUC, vucOf, LOC_LIST, LOC_TYPE, REGIONS, LOCS, type Loc } from '../data/world';
import { drawGlyph } from './glyph';
import { s, type Pin } from '../engine/state';
import { realmOpen } from '../engine/core';
import { seeded } from '../core/util';
import { hasPhoto } from './art';
import { age } from '../engine/char';

const cv = document.getElementById('map') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
let bg: HTMLCanvasElement | null = null;
let bgVer = -1;
const view = { x: 0, y: 0, z: 0.45 };
let dpr = 1;
let onLoc: (l: Loc, sx: number, sy: number) => void = () => {};
let onPin: (p: Pin, sx: number, sy: number) => void = () => {};
let onEmpty: () => void = () => {};
let travelLine: { x: number; y: number } | null = null;

export function setMapHandlers(a: typeof onLoc, b: typeof onPin, c: typeof onEmpty) {
  onLoc = a;
  onPin = b;
  onEmpty = c;
}
export const setTravelLine = (p: { x: number; y: number } | null) => {
  travelLine = p;
  draw();
};

// ---------- Nền tĩnh ----------
function smoothPath(c: CanvasRenderingContext2D, pts: [number, number][], jitter: number, seed: number) {
  const rnd = seeded(seed);
  // chèn điểm phụ có nhiễu để bờ biển hữu cơ
  const dense: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 45));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      dense.push([a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * jitter, a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * jitter]);
    }
  }
  c.beginPath();
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(dense[dense.length - 1], dense[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < dense.length; i++) {
    const p = dense[i];
    const m = mid(p, dense[(i + 1) % dense.length]);
    c.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  c.closePath();
}
function ellipsePts(cx: number, cy: number, rx: number, ry: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}
function landPath(c: CanvasRenderingContext2D) {
  smoothPath(c, MAINLAND, 60, 7);
  LANDS.forEach((pts, i) => smoothMore(c, pts, 50, 300 + i));
  ISLANDS.forEach(([x, y, rx, ry], i) => smoothSub(c, ellipsePts(x, y, rx, ry), Math.min(rx, ry) * 0.55, 100 + i));
}
function smoothMore(c: CanvasRenderingContext2D, pts: [number, number][], jitter: number, seed: number) {
  const rnd = seeded(seed);
  const dense: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 70));
    for (let k = 0; k < n; k++) {
      const q = k / n;
      dense.push([a[0] + (b[0] - a[0]) * q + (rnd() - 0.5) * jitter, a[1] + (b[1] - a[1]) * q + (rnd() - 0.5) * jitter]);
    }
  }
  smoothSub(c, dense, 0, seed + 1);
}
function smoothSub(c: CanvasRenderingContext2D, pts: [number, number][], jitter: number, seed: number) {
  const rnd = seeded(seed);
  const dense = pts.map(([x, y]) => [x + (rnd() - 0.5) * jitter, y + (rnd() - 0.5) * jitter] as [number, number]);
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(dense[dense.length - 1], dense[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < dense.length; i++) {
    const p = dense[i];
    const m = mid(p, dense[(i + 1) % dense.length]);
    c.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  c.closePath();
}

// ---------- Khí hậu từng vùng ----------
// Bắc: băng tuyết (xanh trắng) · Nam: núi lửa (đỏ) · Tây: sa mạc (vàng cam, nâu đất) · Đông: đồng bằng, rừng rậm (xanh lá)
// Trung Vực gộp cả bốn: phía bắc tuyết, phía nam núi lửa, phía tây cát, phía đông rừng; lõi giữ sắc vàng đất linh khí.
type Clim = 'bac' | 'nam' | 'dong' | 'tay';
const CLIM_C = (k: Clim) => VUC[k].c;
function hexRGB(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
function mixHex(a: string, b: string, t: number) {
  const p = hexRGB(a), q = hexRGB(b);
  return rgbHex(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t);
}
/** Toạ độ chuẩn hoá trong bầu dục Trung Vực: [-1..1] theo mỗi trục. */
function trungNorm(x: number, y: number): [number, number] {
  const c = LANDMASS.trung;
  return [(x - c.x) / c.rx, (y - c.y) / c.ry];
}
/** Màu loang tại một điểm: vực ngoài lấy màu vực; Trung Vực pha bốn màu theo hướng, lõi giữ vàng đất. */
function climateColor(x: number, y: number, vuc: string): string {
  if (vuc !== 'trung') return VUC[vuc as Clim].c;
  const [nx, ny] = trungNorm(x, y);
  const len = Math.hypot(nx, ny);
  if (len < 1e-6) return VUC.trung.c;
  const w: Record<Clim, number> = { dong: Math.max(0, nx), tay: Math.max(0, -nx), nam: Math.max(0, ny), bac: Math.max(0, -ny) };
  const sum = w.dong + w.tay + w.nam + w.bac;
  let r = 0, g = 0, b = 0;
  for (const k of Object.keys(w) as Clim[]) {
    const c = hexRGB(CLIM_C(k));
    r += (c[0] * w[k]) / sum; g += (c[1] * w[k]) / sum; b += (c[2] * w[k]) / sum;
  }
  return mixHex(VUC.trung.c, rgbHex(r, g, b), Math.min(1, len / 0.55));
}
/** Khí hậu tại một điểm trên đất liền (để rắc hoạ tiết): null = biển / đảo / lõi Trung Vực. */
function climateAt(x: number, y: number): Clim | null {
  for (const v of Object.keys(LANDMASS) as (keyof typeof LANDMASS)[]) {
    const c = LANDMASS[v];
    const nx = (x - c.x) / c.rx, ny = (y - c.y) / c.ry;
    if (nx * nx + ny * ny > 1.05) continue;
    if (v !== 'trung') return v;
    if (Math.hypot(nx, ny) < 0.32) return null;
    return Math.abs(nx) >= Math.abs(ny) ? (nx > 0 ? 'dong' : 'tay') : ny > 0 ? 'nam' : 'bac';
  }
  return null;
}

type LakeClimate = Clim | 'trung';
type LakeSize = 'small' | 'medium' | 'large';
interface Lake { x: number; y: number; rx: number; ry: number; climate: LakeClimate; size: LakeSize; seed: number; lava?: boolean }
const LAKE_PROFILE: Record<LakeClimate, { chance: number; small: number; medium: number; large: number }> = {
  trung: { chance: 0.2, small: 0.48, medium: 0.38, large: 0.14 },
  dong: { chance: 0.38, small: 0.48, medium: 0.37, large: 0.15 },
  tay: { chance: 0.06, small: 0.78, medium: 0.2, large: 0.02 },
  nam: { chance: 0.19, small: 0.58, medium: 0.34, large: 0.08 },
  bac: { chance: 0.16, small: 0.42, medium: 0.43, large: 0.15 },
};
// ---------- Hồ phải nằm trong đất liền ----------
// Hồ vẽ trong vùng cắt đất liền: hồ sát bờ bị cắt ngang thành ra "hồ giáp biển". Mọi hồ phải chừa một dải đất tới bờ.
let landProbe: { ctx: CanvasRenderingContext2D; path: Path2D } | null = null;
function onLand(x: number, y: number) {
  if (!landProbe) {
    const path = new Path2D();
    landPath(Object.assign(path, { beginPath() {} }) as unknown as CanvasRenderingContext2D); // cùng đường bờ với nền
    landProbe = { ctx: document.createElement('canvas').getContext('2d')!, path };
  }
  return landProbe.ctx.isPointInPath(landProbe.path, x, y);
}
/** Viền hồ lồi tối đa ~1.16 bán kính; thêm dải đất ≥ 45 đơn vị bản đồ tới bờ biển. */
function lakeInland(l: Pick<Lake, 'x' | 'y' | 'rx' | 'ry'>) {
  if (!onLand(l.x, l.y)) return false;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    if (!onLand(l.x + Math.cos(a) * (l.rx * 1.2 + 45), l.y + Math.sin(a) * (l.ry * 1.2 + 45))) return false;
  }
  return true;
}
/** Hồ gắn với địa danh: giữ địa danh nằm trong hồ, thu nhỏ hoặc dời tâm vào đất liền cho tới khi không chạm bờ. */
function fitLake(l: Lake): Lake {
  const mass = Object.values(LANDMASS).reduce((b, m) => (Math.hypot((l.x - m.x) / m.rx, (l.y - m.y) / m.ry) < Math.hypot((l.x - b.x) / b.rx, (l.y - b.y) / b.ry) ? m : b));
  const d = Math.hypot(mass.x - l.x, mass.y - l.y) || 1;
  const ux = (mass.x - l.x) / d, uy = (mass.y - l.y) / d;
  let last = l;
  for (const k of [1, 0.85, 0.72, 0.6, 0.5, 0.4]) {
    for (const sh of [0, 0.2, 0.35, 0.5]) {
      const rx = l.rx * k, ry = l.ry * k;
      last = { ...l, rx, ry, x: l.x + ux * rx * sh, y: l.y + uy * ry * sh };
      if (lakeInland(last)) return last;
    }
  }
  return last;
}

function scatterLakes(): Lake[] {
  const rnd = seeded(0x1a6e);
  const lakes: Lake[] = [];
  const attempts: Record<keyof typeof LANDMASS, number> = { trung: 125, dong: 90, tay: 80, nam: 80, bac: 80 };
  for (const v of Object.keys(LANDMASS) as (keyof typeof LANDMASS)[]) {
    const mass = LANDMASS[v];
    const scale = Math.max(0.75, Math.min(1.6, Math.sqrt(mass.rx * mass.ry) / 1334));
    for (let i = 0; i < attempts[v]; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 0.74;
      const x = mass.x + Math.cos(a) * d * mass.rx, y = mass.y + Math.sin(a) * d * mass.ry;
      const normalized = Math.hypot((x - LANDMASS.trung.x) / LANDMASS.trung.rx, (y - LANDMASS.trung.y) / LANDMASS.trung.ry);
      const climate = v === 'trung' && normalized < 0.36 ? 'trung' : climateAt(x, y);
      if (!climate) continue;
      const profile = LAKE_PROFILE[climate];
      if (rnd() >= profile.chance) continue;
      const kindRoll = rnd();
      const size: LakeSize = kindRoll < profile.small ? 'small' : kindRoll < profile.small + profile.medium ? 'medium' : 'large';
      const [minR, maxR] = size === 'small' ? [24, 48] : size === 'medium' ? [50, 92] : [96, 165];
      const rx = (minR + rnd() * (maxR - minR)) * scale;
      const ry = rx * (0.42 + rnd() * 0.43);
      if (LOC_LIST.some((l) => ['town', 'market', 'village', 'sect'].includes(l.type) && Math.hypot((x - l.x) / (rx + 100), (y - l.y) / (ry + 100)) < 1)) continue;
      if (lakes.some((l) => Math.hypot((x - l.x) / (rx + l.rx + 40), (y - l.y) / (ry + l.ry + 40)) < 0.82)) continue;
      if (!lakeInland({ x, y, rx, ry })) continue;
      lakes.push({ x, y, rx, ry, climate, size, seed: lakes.length * 977 + i * 31 + v.length * 131 });
    }
  }
  return lakes;
}
function lakeOutline(g: CanvasRenderingContext2D, lake: Lake, seed = lake.seed) {
  const rnd = seeded(seed);
  const points: [number, number][] = [];
  const rotation = rnd() * Math.PI * 2;
  for (let i = 0; i < 24; i++) {
    const a = rotation + (i / 24) * Math.PI * 2;
    const r = 0.88 + rnd() * 0.24;
    points.push([lake.x + Math.cos(a) * lake.rx * r, lake.y + Math.sin(a) * lake.ry * r]);
  }
  g.beginPath();
  smoothSub(g, points, Math.min(lake.rx, lake.ry) * 0.08, seed + 1);
}
function drawLake(g: CanvasRenderingContext2D, lake: Lake) {
  const palette = lake.lava
    ? { shore: 'rgba(95,54,39,0.48)', water: 'rgba(202,82,39,0.82)', edge: 'rgba(255,172,78,0.82)', light: 'rgba(255,205,111,0.5)' }
    : lake.climate === 'bac'
    ? { shore: 'rgba(82,119,135,0.35)', water: 'rgba(158,195,210,0.78)', edge: 'rgba(242,250,250,0.9)', light: 'rgba(255,255,255,0.48)' }
    : lake.climate === 'tay'
    ? { shore: 'rgba(177,132,69,0.58)', water: 'rgba(43,119,139,0.82)', edge: 'rgba(220,192,126,0.8)', light: 'rgba(225,243,216,0.42)' }
    : lake.climate === 'dong'
    ? { shore: 'rgba(66,98,72,0.42)', water: 'rgba(48,105,126,0.76)', edge: 'rgba(184,210,185,0.78)', light: 'rgba(208,235,215,0.36)' }
    : { shore: 'rgba(96,105,76,0.42)', water: 'rgba(55,112,135,0.76)', edge: 'rgba(214,221,187,0.8)', light: 'rgba(220,239,225,0.4)' };
  g.save();
  lakeOutline(g, lake);
  g.fillStyle = palette.water;
  g.fill();
  g.lineWidth = Math.max(2, Math.min(9, lake.rx * 0.045));
  g.strokeStyle = palette.shore;
  g.stroke();
  g.clip();
  const rnd = seeded(lake.seed + 2);
  if (lake.climate === 'bac' && !lake.lava) {
    for (let i = 0; i < 3; i++) {
      const x = lake.x + (rnd() - 0.5) * lake.rx;
      const y = lake.y + (rnd() - 0.5) * lake.ry;
      g.beginPath();
      g.moveTo(x - lake.rx * 0.24, y - lake.ry * 0.08);
      g.lineTo(x + lake.rx * 0.2, y + lake.ry * 0.1);
      g.strokeStyle = palette.edge;
      g.lineWidth = 1.4;
      g.stroke();
    }
  } else {
    for (let i = 0; i < (lake.size === 'small' ? 1 : 3); i++) {
      const x = lake.x + (rnd() - 0.5) * lake.rx * 0.8;
      const y = lake.y + (rnd() - 0.5) * lake.ry * 0.5;
      g.beginPath();
      g.ellipse(x, y, lake.rx * (0.12 + rnd() * 0.14), Math.max(2, lake.ry * 0.035), rnd() * 0.3, 0, Math.PI * 2);
      g.fillStyle = palette.light;
      g.fill();
    }
  }
  g.restore();
}

const BG_S = 0.45; // nền dựng ở 45% độ phân giải cho bản đồ siêu rộng 16000x12000 mượt mà tiết kiệm RAM
function buildBg() {
  const c = document.createElement('canvas');
  c.width = Math.round(MAP_W * BG_S);
  c.height = Math.round(MAP_H * BG_S);
  const g = c.getContext('2d')!;
  g.scale(BG_S, BG_S);
  landProbe = null; // bản đồ giới khác → đường bờ khác
  const rnd = seeded(42);
  // biển
  g.fillStyle = '#d7dccd';
  g.fillRect(0, 0, MAP_W, MAP_H);
  for (let i = 0; i < 4000; i++) {
    g.strokeStyle = `rgba(63,106,133,${0.03 + rnd() * 0.05})`;
    g.lineWidth = 1;
    const x = rnd() * MAP_W, y = rnd() * MAP_H, w = 10 + rnd() * 30;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + w / 2, y - 3, x + w, y);
    g.stroke();
  }
  // viền nước loang quanh bờ
  for (let k = 5; k >= 1; k--) {
    g.save();
    landPath(g);
    g.strokeStyle = `rgba(63,106,133,${0.05})`;
    g.lineWidth = k * 22;
    g.stroke();
    g.restore();
  }
  // đất liền
  g.save();
  landPath(g);
  g.fillStyle = '#efe6d0';
  g.fill();
  g.clip();
  // loang màu vùng — nền rộng theo lục địa (kể cả chỗ không có địa điểm)
  const glow = (x: number, y: number, rad: number, c: string, a: number) => {
    const grd = g.createRadialGradient(x, y, rad * 0.1, x, y, rad);
    grd.addColorStop(0, hexA(c, a));
    grd.addColorStop(1, hexA(c, 0));
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  for (const v of ['dong', 'tay', 'nam', 'bac'] as const) {
    const c = LANDMASS[v];
    g.save();
    g.translate(c.x, c.y);
    g.scale(c.rx / Math.max(c.rx, c.ry), c.ry / Math.max(c.rx, c.ry));
    glow(0, 0, Math.max(c.rx, c.ry) * 1.1, VUC[v].c, 0.3);
    g.restore();
  }
  {
    const c = LANDMASS.trung;
    const k = Math.max(c.rx, c.ry);
    g.save();
    g.translate(c.x, c.y);
    g.scale(c.rx / k, c.ry / k);
    glow(0, -k * 0.62, k * 0.75, VUC.bac.c, 0.34);
    glow(0, k * 0.62, k * 0.75, VUC.nam.c, 0.34);
    glow(-k * 0.62, 0, k * 0.75, mixHex(VUC.tay.c, '#8a5a2b', 0.35), 0.4); // cát phía tây đậm hơn lõi vàng
    glow(k * 0.62, 0, k * 0.75, VUC.dong.c, 0.34);
    glow(0, 0, k * 0.5, VUC.trung.c, 0.42);
    g.restore();
  }
  // loang thêm quanh từng địa điểm
  for (const l of LOC_LIST) {
    const c = climateColor(l.x, l.y, vucOf(l));
    const grd = g.createRadialGradient(l.x, l.y, 10, l.x, l.y, 520);
    grd.addColorStop(0, hexA(c, 0.26));
    grd.addColorStop(1, hexA(c, 0));
    g.fillStyle = grd;
    g.fillRect(l.x - 520, l.y - 520, 1040, 1040);
  }
  // vân giấy
  for (let i = 0; i < 12000; i++) {
    g.fillStyle = `rgba(42,36,31,${rnd() * 0.035})`;
    g.fillRect(rnd() * MAP_W, rnd() * MAP_H, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  // rừng rậm, đồng cỏ: chấm mực xanh (Đông Vực + rìa đông Trung Vực)
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * MAP_W, y = rnd() * MAP_H;
    if (climateAt(x, y) !== 'dong') continue;
    g.fillStyle = `rgba(50,92,48,${0.08 + rnd() * 0.12})`;
    g.beginPath();
    g.arc(x, y, 5 + rnd() * 8, 0, Math.PI * 2);
    g.fill();
  }
  // cây cỏ, rặng thông & thảm thực vật hải đảo trên toàn bộ các đảo
  for (const [ix, iy, irx, iry] of ISLANDS) {
    // Vệt loang linh khí đảo ngọc (màu xanh lục bảo)
    const grd = g.createRadialGradient(ix, iy, 0, ix, iy, Math.max(irx, iry) * 0.95);
    grd.addColorStop(0, 'rgba(68, 136, 88, 0.32)');
    grd.addColorStop(0.7, 'rgba(78, 148, 98, 0.18)');
    grd.addColorStop(1, 'rgba(78, 148, 98, 0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(ix, iy, irx * 0.95, iry * 0.95, 0, 0, Math.PI * 2);
    g.fill();

    // Rặng tùng bách hải đảo xanh tươi
    const nTrees = Math.max(4, Math.round(irx * iry * 0.0028));
    for (let ti = 0; ti < nTrees; ti++) {
      const ta = rnd() * Math.PI * 2;
      const tr = Math.sqrt(rnd()) * 0.72;
      const tx = ix + Math.cos(ta) * irx * tr;
      const ty = iy + Math.sin(ta) * iry * tr;
      g.fillStyle = `rgba(32, 78, 46, ${0.16 + rnd() * 0.24})`;
      g.beginPath();
      g.arc(tx, ty, 3.5 + rnd() * 5.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  // sa mạc: gợn cát (Tây Vực + rìa tây Trung Vực)
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * MAP_W, y = rnd() * MAP_H;
    if (climateAt(x, y) !== 'tay') continue;
    g.strokeStyle = `rgba(150,105,40,${0.14 + rnd() * 0.1})`;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x, y);
    g.bezierCurveTo(x + 25, y - 9, x + 50, y + 9, x + 75, y);
    g.stroke();
  }
  // băng tuyết: đốm trắng và vệt băng (Bắc Vực + rìa bắc Trung Vực)
  for (let i = 0; i < 12000; i++) {
    const x = rnd() * MAP_W, y = rnd() * MAP_H;
    if (climateAt(x, y) !== 'bac') continue;
    if (rnd() < 0.8) {
      g.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.4})`;
      g.beginPath();
      g.arc(x, y, 1.5 + rnd() * 4, 0, Math.PI * 2);
      g.fill();
    } else {
      g.strokeStyle = `rgba(190,215,232,${0.3 + rnd() * 0.25})`;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 20 + rnd() * 30, y - 4 + rnd() * 8);
      g.stroke();
    }
  }
  // núi lửa: khe dung nham và đốm than đỏ (Nam Vực + rìa nam Trung Vực)
  for (let i = 0; i < 9000; i++) {
    const x = rnd() * MAP_W, y = rnd() * MAP_H;
    if (climateAt(x, y) !== 'nam') continue;
    if (rnd() < 0.55) {
      g.strokeStyle = `rgba(200,60,28,${0.22 + rnd() * 0.2})`;
      g.lineWidth = 1.4 + rnd();
      g.beginPath();
      g.moveTo(x, y);
      let px = x, py = y;
      for (let k = 0; k < 3; k++) { px += 8 + rnd() * 14; py += (rnd() - 0.5) * 18; g.lineTo(px, py); }
      g.stroke();
    } else {
      const r = 2 + rnd() * 5;
      const grd = g.createRadialGradient(x, y, 0, x, y, r * 2.2);
      grd.addColorStop(0, `rgba(235,110,40,${0.3 + rnd() * 0.25})`);
      grd.addColorStop(1, 'rgba(235,110,40,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r * 2.2, 0, Math.PI * 2);
      g.fill();
    }
  }
  // hồ nội địa: mật độ và kích thước phụ thuộc khí hậu, rải theo từng lục địa.
  for (const lake of scatterLakes()) drawLake(g, lake);
  // Hồ/đầm có tên và thành xây trên mặt nước phải khớp với địa hình ngay dưới địa điểm.
  for (const l of LOC_LIST) {
    if (l.island || l.sea) continue;
    const desc = `${l.n} ${l.d}`;
    if (l.type === 'town' && /(mặt nước|mặt đầm|trên mặt hồ|trên mặt đầm)/i.test(desc)) {
      const lake = fitLake({ x: l.x, y: l.y, rx: 285, ry: 175, climate: climateAt(l.x, l.y) ?? 'dong', size: 'large', seed: l.x + l.y });
      const k = lake.rx / 285;
      drawLake(g, lake);
      lakeOutline(g, { ...lake, x: l.x + 8 * k, y: l.y - 2 * k, rx: 48 * Math.max(0.6, k), ry: 30 * Math.max(0.6, k) }, lake.seed + 7);
      g.fillStyle = '#b9aa81';
      g.fill();
      g.strokeStyle = 'rgba(68,81,66,0.55)';
      g.lineWidth = 3;
      g.stroke();
    } else if (l.type === 'wild' && /(hồ lớn|đầm lớn|đầm lầy|đầm sen|hồ nước|nước hồ|hồ biếc|đầm sét|đầm hoang|đầm lau)/i.test(l.d)) {
      const large = /(đại trạch|hồ lớn|đầm lớn)/i.test(desc);
      const lake: Lake = fitLake({
        x: l.x, y: l.y, rx: large ? 245 : 155, ry: large ? 150 : 95,
        climate: climateAt(l.x, l.y) ?? 'trung', size: large ? 'large' : 'medium', seed: l.x + l.y,
        lava: /dung nham/i.test(desc),
      });
      drawLake(g, lake);
    }
  }
  // sông
  for (const [ri, rv] of RIVERS.entries()) {
    const kw = RIVER_MAJOR[ri] ? 1 : 0.55; // sông nhỏ vẽ mảnh hơn
    for (const [w, a] of [[16, 0.12], [7, 0.28], [2.6, 0.5]] as const) {
      g.strokeStyle = `rgba(63,106,133,${a})`;
      g.lineWidth = w * kw;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(rv[0][0], rv[0][1]);
      for (let i = 1; i < rv.length - 1; i++) {
        const mx = (rv[i][0] + rv[i + 1][0]) / 2, my = (rv[i][1] + rv[i + 1][1]) / 2;
        g.quadraticCurveTo(rv[i][0], rv[i][1], mx, my);
      }
      const last = rv[rv.length - 1];
      g.lineTo(last[0], last[1]);
      g.stroke();
    }
  }
  // núi
  // ranh giới Trung Vực và bốn vực
  g.setLineDash([26, 18]);
  g.lineWidth = 5;
  g.strokeStyle = 'rgba(154,122,46,0.55)';
  g.beginPath();
  TRUNG_RING.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.stroke();
  g.lineWidth = 4;
  g.strokeStyle = 'rgba(42,36,31,0.32)';
  for (const line of VUC_BORDERS) {
    g.beginPath();
    line.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  }
  // ranh giới châu: nét đứt mảnh hơn ranh giới vực
  g.setLineDash([11, 9]);
  g.lineWidth = 3;
  g.strokeStyle = 'rgba(42,36,31,0.34)';
  for (const line of CHAU_BORDERS) {
    g.beginPath();
    line.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  }
  g.setLineDash([]);
  g.setLineDash([]);
  g.restore();
  // đường bờ biển bằng nét mực
  g.save();
  landPath(g);
  g.strokeStyle = 'rgba(42,36,31,0.55)';
  g.lineWidth = 2.6;
  g.stroke();
  g.restore();
  // núi vẽ sau cùng, ngoài vùng cắt theo bờ biển để đỉnh núi sát bờ không bị cắt cụt
  drawMountains(g);
  // tên sông: chữ nghiêng nhỏ, xoay theo dòng chảy
  g.save();
  g.textAlign = 'center';
  g.letterSpacing = '2px';
  g.font = 'italic 600 34px "Noto Serif", serif';
  g.fillStyle = 'rgba(48,88,112,0.75)';
  for (const [i, [t, x, y, ang]] of RIVER_LABELS.entries()) {
    if (!t) continue;
    g.font = RIVER_MAJOR[i] ? 'italic 600 34px "Noto Serif", serif' : 'italic 500 24px "Noto Serif", serif';
    g.save();
    g.translate(x, y);
    g.rotate(ang > Math.PI / 2 || ang < -Math.PI / 2 ? ang + Math.PI : ang);
    g.fillText(t, 0, 0);
    g.restore();
  }
  g.restore();
  // la bàn
  g.save();
  g.translate(MAP_W - 220, MAP_H - 220);
  g.scale(1.8, 1.8);
  g.strokeStyle = 'rgba(42,36,31,0.4)';
  g.fillStyle = 'rgba(155,42,31,0.6)';
  g.beginPath(); g.arc(0, 0, 46, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(0, -60); g.lineTo(8, 0); g.lineTo(0, 60); g.lineTo(-8, 0); g.closePath(); g.fill();
  g.font = '600 18px "Noto Serif SC", serif';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(42,36,31,0.7)';
  g.translate(0, -72);
  drawGlyph(g, 'north', 22, 'rgba(42,36,31,0.7)');
  g.restore();
  bg = c;
}
// ---------- Chân dung người chơi trên bản đồ ----------
const imgCache = new Map<string, HTMLImageElement | null>();
/** Ảnh chân dung người chơi (items/pc_*.webp); null khi chưa có ảnh hoặc chưa tải xong. */
function playerImg(): HTMLImageElement | null {
  const g = s.g;
  const key = age() < 14 && hasPhoto(`pc_${g}_child`) ? `pc_${g}_child` : hasPhoto(`pc_${g}`) ? `pc_${g}` : '';
  if (!key) return null;
  if (!imgCache.has(key)) {
    const im = new Image();
    im.onload = () => { if (s) draw(); };
    im.src = `items/${key}.webp`;
    imgCache.set(key, im);
  }
  const im = imgCache.get(key);
  return im && im.complete && im.naturalWidth > 0 ? im : null;
}
/** Núi phong cách thủy mặc cổ họa tiên hiệp:
 *  - Dáng núi uốn lượn tự nhiên theo nét bút lông (bezier curves thay vì tam giác phẳng).
 *  - Sống núi (long tích) uốn mềm mại phân định dương diện (đón sáng) và âm diện (khuất bóng).
 *  - Chân núi có gradient hòa sắc sương khói mờ ảo vào nền đất giấy da cổ.
 *  - Nét gân đá (披麻皴 - phi ma huân) truyền thống tôn tạo chiều sâu vách đá.
 *  - Đỉnh tuyết phủ mềm mại uốn lượn theo dáng sườn núi.
 *  Vẽ theo thứ tự từ xa tới gần (y tăng dần), núi trước che chở núi sau tự nhiên. */
function drawMountains(g: CanvasRenderingContext2D) {
  type Peak = { px: number; py: number; h: number; w: number };
  const peaks: Peak[] = PEAKS.map((p) => ({ px: p.x, py: p.y, h: p.h, w: p.w }));
  peaks.sort((a, b) => a.py - b.py);
  const mix = (c: [number, number, number], to: [number, number, number], k: number) =>
    `rgb(${c.map((v, i) => Math.round(v + (to[i] - v) * k)).join(',')})`;

  for (const { px, py, h, w } of peaks) {
    // Màu nền ngay dưới chân núi (canvas nền dựng ở tỉ lệ BG_S)
    const d = g.getImageData(Math.max(0, Math.round(px * BG_S)), Math.max(0, Math.round((py - 2) * BG_S)), 1, 1).data;
    const base: [number, number, number] = [d[0] || 220, d[1] || 210, d[2] || 195];

    // Seed jitter dựa theo tọa độ đỉnh núi để mỗi ngọn có hình thái riêng sinh động nhưng ổn định
    const sVal = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
    const rJit = (n: number) => {
      const v = Math.sin(sVal + n * 91.345) * 43758.5453;
      return v - Math.floor(v);
    };

    const snow = climateAt(px, py) === 'bac';
    // Đỉnh núi hơi lệch ngẫu nhiên nhẹ (-10% đến +10% bề rộng)
    const apexOff = (rJit(1) - 0.5) * w * 0.2;
    const ax = px + apexOff;
    const ay = py - h;
    // Chân sống núi (long tích)
    const rx = px + w * 0.12 + (rJit(2) - 0.5) * w * 0.1;

    // Màu sắc thủy mặc: đỉnh đậm đà chất đá, chân núi thoa mờ vào sương nền
    const lightPeak = mix(base, [255, 252, 246], 0.52);
    const lightMid = mix(base, [248, 242, 230], 0.35);
    const darkPeak = mix(base, [38, 32, 27], 0.48);
    const darkMid = mix(base, [45, 38, 33], 0.38);

    // Gradient sương mù chân núi: chuyển từ màu đá ở đỉnh xuống hòa tan mờ vào nền tại chân núi
    const gradLight = g.createLinearGradient(0, ay, 0, py + 3);
    gradLight.addColorStop(0, lightPeak);
    gradLight.addColorStop(0.68, lightMid);
    gradLight.addColorStop(1, mix(base, [240, 235, 225], 0.18));

    const gradDark = g.createLinearGradient(0, ay, 0, py + 3);
    gradDark.addColorStop(0, darkPeak);
    gradDark.addColorStop(0.65, darkMid);
    gradDark.addColorStop(1, mix(base, [42, 36, 31], 0.2));

    // Điểm uốn cong tự nhiên của sườn núi (tạo dáng núi thủy mặc uốn lượn hữu cơ)
    const l1x = px - w * 0.82, l1y = py - h * 0.26;
    const l2x = px - w * 0.42 + (rJit(3) - 0.5) * 6, l2y = py - h * 0.68;

    const r1x = px + w * 0.38 + (rJit(4) - 0.5) * 6, r1y = py - h * 0.68;
    const r2x = px + w * 0.78, r2y = py - h * 0.26;

    // Điểm uốn của sống núi (long tích lượn sóng mềm)
    const crx = (ax + rx) / 2 + (rJit(5) - 0.5) * w * 0.14;
    const cry = (ay + py) / 2 + (rJit(6) - 0.5) * h * 0.08;

    // 1. Mặt sáng (dương diện - sườn đón sáng bên trái)
    g.fillStyle = gradLight;
    g.beginPath();
    g.moveTo(px - w, py);
    g.bezierCurveTo(l1x, l1y, l2x, l2y, ax, ay);
    g.quadraticCurveTo(crx, cry, rx, py);
    g.closePath();
    g.fill();

    // 2. Mặt tối (âm diện - sườn khuất bóng bên phải)
    g.fillStyle = gradDark;
    g.beginPath();
    g.moveTo(rx, py);
    g.quadraticCurveTo(crx, cry, ax, ay);
    g.bezierCurveTo(r1x, r1y, r2x, r2y, px + w, py);
    g.closePath();
    g.fill();

    // 3. Đỉnh tuyết phủ (vùng Bắc Vực hoặc núi thần)
    if (snow) {
      const sk = 0.32;
      const say = ay + h * sk;
      const slx = px - w * sk * 0.85;
      const srx = px + w * sk * 0.85;
      const scx = ax + (rx - ax) * sk;

      // Nửa sáng tuyết
      g.fillStyle = 'rgba(252, 254, 255, 0.94)';
      g.beginPath();
      g.moveTo(slx, say);
      g.bezierCurveTo(px - w * 0.45 * sk, ay + h * 0.18, ax - w * 0.15 * sk, ay + h * 0.08, ax, ay);
      g.quadraticCurveTo((ax + scx) / 2, (ay + say) / 2, scx, say);
      g.closePath();
      g.fill();

      // Nửa khuất tuyết ánh lam
      g.fillStyle = 'rgba(215, 228, 240, 0.92)';
      g.beginPath();
      g.moveTo(scx, say);
      g.quadraticCurveTo((ax + scx) / 2, (ay + say) / 2, ax, ay);
      g.bezierCurveTo(ax + w * 0.15 * sk, ay + h * 0.08, px + w * 0.45 * sk, ay + h * 0.18, srx, say);
      g.closePath();
      g.fill();
    }

    // 4. Đường nét mực họa (Chinese Ink Brush Outlines)
    g.lineCap = 'round';
    g.lineJoin = 'round';

    // Đường sống núi uốn lượn
    g.strokeStyle = 'rgba(38, 32, 28, 0.48)';
    g.lineWidth = 1.25;
    g.beginPath();
    g.moveTo(ax, ay);
    g.quadraticCurveTo(crx, cry, rx, py);
    g.stroke();

    // Viền sườn núi mềm mại
    g.strokeStyle = 'rgba(35, 30, 26, 0.6)';
    g.lineWidth = 1.35;
    g.beginPath();
    g.moveTo(px - w, py);
    g.bezierCurveTo(l1x, l1y, l2x, l2y, ax, ay);
    g.bezierCurveTo(r1x, r1y, r2x, r2y, px + w, py);
    g.stroke();

    // 5. Nếp gân đá thủy mặc (披麻皴 - Phi Ma Huân) trên sườn núi tối
    if (h > 34) {
      g.strokeStyle = 'rgba(35, 30, 26, 0.22)';
      g.lineWidth = 0.9;
      // Gân đá thứ nhất
      g.beginPath();
      const tx1 = (ax + r1x) / 2, ty1 = (ay + r1y) / 2;
      g.moveTo(tx1, ty1);
      g.quadraticCurveTo(tx1 + (rJit(7) - 0.5) * 8 + 4, ty1 + h * 0.2, (crx + px + w) / 2, py - 4);
      g.stroke();

      // Gân đá thứ hai cho núi trung/lớn
      if (h > 52) {
        g.beginPath();
        const tx2 = (ax + crx) / 2, ty2 = (ay + cry) / 2;
        g.moveTo(tx2, ty2);
        g.quadraticCurveTo(tx2 + 6, ty2 + h * 0.22, rx + (rJit(8) - 0.5) * 8, py - 2);
        g.stroke();
      }
    }
  }
}
function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ---------- Vẽ ----------
const TYPE_STYLE: Record<string, { c: string; shape: 'sq' | 'ci' | 'di' }> = {
  village: { c: '#6e6253', shape: 'ci' },
  town: { c: '#9b2a1f', shape: 'sq' },
  market: { c: '#9a7a2e', shape: 'sq' },
  sect: { c: '#9b2a1f', shape: 'ci' },
  wild: { c: '#2a241f', shape: 'di' },
  realm: { c: '#5e4c8a', shape: 'di' },
  formation: { c: '#287f88', shape: 'ci' },
};
const PIN_C: Record<string, string> = { '?': '#9a7a2e', '!': '#9b2a1f', bao: '#4f7a55', bi: '#5e4c8a' };

export function getContentBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  // 1. Đại lục (LANDMASS)
  for (const m of Object.values(LANDMASS)) {
    minX = Math.min(minX, m.x - m.rx * 1.12);
    maxX = Math.max(maxX, m.x + m.rx * 1.12);
    minY = Math.min(minY, m.y - m.ry * 1.12);
    maxY = Math.max(maxY, m.y + m.ry * 1.12);
  }
  // 2. Toạ độ bờ biển thực tế
  for (const [x, y] of MAINLAND) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  for (const pts of LANDS) for (const [x, y] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  // 3. Toàn bộ quần đảo ngoại hải (kèm viền sóng loang ~40px)
  for (const [x, y, rx, ry] of ISLANDS) {
    minX = Math.min(minX, x - rx - 45);
    maxX = Math.max(maxX, x + rx + 45);
    minY = Math.min(minY, y - ry - 45);
    maxY = Math.max(maxY, y + ry + 45);
  }
  // 4. Nhãn biển và nhãn vùng (đảm bảo chữ không chạm mép)
  for (const [, x, y, sz] of REGION_LABELS) {
    const w = (sz >= 100 ? 500 : sz < 72 ? 320 : 380);
    const h = 75;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minY = Math.min(minY, y - h);
    maxY = Math.max(maxY, y + 25);
  }
  const padX = 140;
  const padY = 250; // Đệm rộng đỉnh và đáy để thanh header và nút thao tác không che nhãn địa danh
  return {
    minX: Math.max(0, minX - padX),
    maxX: Math.min(MAP_W, maxX + padX),
    minY: Math.max(0, minY - padY),
    maxY: Math.min(MAP_H, maxY + padY),
  };
}

export function fitWorld() {
  fitWorldView();
}

export function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  clampView();
  draw();
}
function clampView() {
  const b = getContentBounds();
  const spanW = Math.max(1000, b.maxX - b.minX);
  const spanH = Math.max(1000, b.maxY - b.minY);
  // Trừ đệm UI: thanh menu đỉnh (~75px) và thanh hành động đáy (~80px)
  const availW = Math.max(400, innerWidth - 90);
  const availH = Math.max(300, innerHeight - 210);
  const fitZ = Math.min(availW / spanW, availH / spanH);
  // Cho phép thu nhỏ thêm để nhìn bao quát toàn bộ tứ hải và quần đảo xa
  const minZ = Math.max(0.06, fitZ * 0.75);
  view.z = Math.max(minZ, Math.min(2.5, view.z));

  const vw = innerWidth / view.z, vh = innerHeight / view.z;
  const midX = (b.minX + b.maxX) / 2;
  const midY = (b.minY + b.maxY) / 2;

  // Khi camera thu nhỏ thấy toàn bộ thế giới: căn giữa đối xứng hoàn hảo trong không gian khả dụng, chừa khoảng trống cho header
  const idealX = midX - vw / 2;
  const idealY = midY - vh / 2 + 25 / view.z;

  if (vw >= spanW * 1.04) {
    view.x = idealX;
  } else {
    view.x = Math.max(b.minX - vw * 0.2, Math.min(b.maxX - vw * 0.8, view.x));
  }
  if (vh >= spanH * 1.04) {
    view.y = idealY;
  } else {
    view.y = Math.max(b.minY - vh * 0.2, Math.min(b.maxY - vh * 0.8, view.y));
  }
}
export function centerOn(x: number, y: number) {
  view.x = x - innerWidth / view.z / 2;
  view.y = y - innerHeight / view.z / 2;
  clampView();
  draw();
}
(window as any).centerOn = centerOn;
(window as any).zoom = zoom;
(window as any).mapView = view;
(window as any).mapDraw = draw;
export function zoom(dir: number, cx = innerWidth / 2, cy = innerHeight / 2) {
  const wx = view.x + cx / view.z, wy = view.y + cy / view.z;
  view.z *= dir > 0 ? 1.2 : 1 / 1.2;
  clampView();
  view.x = wx - cx / view.z;
  view.y = wy - cy / view.z;
  clampView();
  draw();
}
export const toScreen = (x: number, y: number) => ({ x: (x - view.x) * view.z, y: (y - view.y) * view.z });

/** Vẽ tên Vực, Châu và Biển: khi thu nhỏ (zoom out) thì đậm rõ, khi phóng to (zoom in) thì mờ dần. */
function drawRegionLabels(g: CanvasRenderingContext2D, z: number) {
  const labels = REGION_LABELS;
  if (!labels.length) return;

  // Hệ số mờ dần theo mức zoom (z càng lớn thì càng mờ)
  // Vực (sz >= 100): rõ nhất khi z <= 0.20, mờ dần và ẩn hoàn toàn khi z >= 0.80
  const kVuc = Math.max(0, Math.min(1, (0.80 - z) / (0.80 - 0.18)));
  const aVuc = 0.95 * Math.pow(kVuc, 1.2);

  // Châu (72 <= sz < 100): rõ nhất khi z <= 0.22, mờ dần và ẩn hoàn toàn khi z >= 0.95
  const kChau = Math.max(0, Math.min(1, (0.95 - z) / (0.95 - 0.20)));
  const aChau = 0.92 * Math.pow(kChau, 1.2);

  // Biển (sz < 72): mờ dần từ z = 0.20 đến z = 0.75
  const kSea = Math.max(0, Math.min(1, (0.75 - z) / (0.75 - 0.18)));
  const aSea = 0.85 * Math.pow(kSea, 1.2);

  if (aVuc <= 0.01 && aChau <= 0.01 && aSea <= 0.01) return;

  g.save();
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';

  for (const [t, x, y, sz] of labels) {
    const isVuc = sz >= 100;
    const isSea = sz < 72;
    const alpha = isVuc ? aVuc : isSea ? aSea : aChau;
    if (alpha <= 0.01) continue;

    // Khi thu nhỏ tối đa (zoom out), đảm bảo kích thước hiển thị trên màn hình tối thiểu ~10-14px để luôn đọc rõ nét
    const minScreenPx = isVuc ? 14 : isSea ? 10 : 9.5;
    const effectiveSz = Math.max(sz, minScreenPx / z);

    g.font = `700 ${Math.round(effectiveSz)}px "Noto Serif", serif`;
    g.letterSpacing = isVuc ? '22px' : isSea ? '10px' : '6px';

    // Viền sáng mỏng (halo) màu giấy cổ giúp chữ nổi bật, đậm đà trên mọi nền địa hình
    const haloAlpha = alpha * 0.75;
    g.lineWidth = isVuc ? 7 : isSea ? 4 : 5;
    g.strokeStyle = `rgba(248, 242, 227, ${haloAlpha.toFixed(3)})`;
    g.strokeText(t, x, y);

    // Mực đậm: Vực dùng mực đen đậm, Châu dùng son trầm, Biển dùng lam thẫm
    if (isVuc) {
      g.fillStyle = `rgba(32, 26, 20, ${alpha.toFixed(3)})`;
    } else if (isSea) {
      g.fillStyle = `rgba(38, 75, 96, ${alpha.toFixed(3)})`;
    } else {
      g.fillStyle = `rgba(118, 32, 22, ${alpha.toFixed(3)})`;
    }
    g.fillText(t, x, y);
  }
  g.restore();
}

let pulse = 0;
export function draw() {
  if (!bg || bgVer !== worldVer) { buildBg(); bgVer = worldVer; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#d7dccd';
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.save();
  ctx.scale(view.z, view.z);
  ctx.translate(-view.x, -view.y);
  ctx.drawImage(bg!, 0, 0, MAP_W, MAP_H);
  drawRegionLabels(ctx, view.z);
  // In world preview or spectator mode, continue drawing terrain and locations even if s is null
  // đường đi dự kiến
  if (travelLine) {
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(155,42,31,0.7)';
    ctx.lineWidth = 2 / view.z + 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(travelLine.x, travelLine.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // địa điểm
  const f = Math.min(2.6, Math.max(1, 0.7 / view.z)); // phóng ký hiệu khi thu nhỏ để vẫn đọc được
  const showNames = view.z > 0.2;
  for (const l of LOC_LIST) {
    const st = TYPE_STYLE[l.type];
    const closed = l.type === 'realm' && (s ? !realmOpen(l) : false);
    const r = l.type === 'sect' || l.type === 'town' ? 13 : 11;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(f, f);
    ctx.globalAlpha = closed ? 0.45 : 1;
    if (l.sea || l.river) {
      // dưới đáy biển / dưới sông: vòng xoáy nước quanh ký hiệu
      ctx.fillStyle = 'rgba(63,106,133,0.22)';
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(63,106,133,0.55)';
      ctx.lineWidth = 1.6;
      for (const [rr, a0, a1] of [[20, 0.2, 2.6], [27, 2.9, 5.6], [34, 0.9, 3.4], [34, 4.0, 6.0]] as const) { ctx.beginPath(); ctx.arc(0, 0, rr, a0, a1); ctx.stroke(); }
    }
    ctx.fillStyle = l.shj ? '#5b4a7a' : st.c;
    ctx.strokeStyle = l.shj ? '#d8b25a' : '#f8f2e3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (st.shape === 'sq') ctx.rect(-r, -r, r * 2, r * 2);
    else if (st.shape === 'ci') ctx.arc(0, 0, r, 0, Math.PI * 2);
    else { ctx.moveTo(0, -r - 2); ctx.lineTo(r + 2, 0); ctx.lineTo(0, r + 2); ctx.lineTo(-r - 2, 0); ctx.closePath(); }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${r * 1.15}px "Noto Serif SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawGlyph(ctx, l.shj ? 'mountain' : LOC_TYPE[l.type].ic, r * 1.5, '#fff', 2.2);
    const emp = empireAt(l.id);
    if (emp && !emp.vassal) { // thuộc quốc không có vương miện
      const ct = EMPIRES[emp.id].tier;
      ctx.fillStyle = ct === 3 ? '#c9a23a' : ct === 2 ? '#b08d3a' : '#9a8a6a';
      ctx.strokeStyle = '#5a4012';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -r - 4); ctx.lineTo(-9, -r - 13); ctx.lineTo(-4.5, -r - 8); ctx.lineTo(0, -r - 15); ctx.lineTo(4.5, -r - 8); ctx.lineTo(9, -r - 13); ctx.lineTo(9, -r - 4); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    if (showNames || l.gate) {
      ctx.font = `${l.id === s?.loc ? 700 : 600} 14px "Noto Serif", serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(239,230,208,0.9)';
      ctx.strokeText(l.n, 0, r + 14);
      ctx.fillStyle = '#2a241f';
      ctx.fillText(l.n, 0, r + 14);
    }
    ctx.restore();
  }
  // dấu
  pulse = (performance.now() / 600) % (Math.PI * 2);
  for (const p of (s?.pins || [])) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(f, f);
    const c = PIN_C[p.k];
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(pulse);
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f8f2e3';
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c;
    ctx.font = `700 13px "Noto Serif SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (p.k === 'bao' || p.k === 'bi') drawGlyph(ctx, p.k, 15, c, 2.2);
    else ctx.fillText(p.k, 0, 1);
    ctx.restore();
  }
  if (s) { // người chơi: chân dung tròn lơ lửng phía trên địa điểm; ký hiệu và tên địa điểm bên dưới vẫn thấy rõ
  {
    const R = 17; // bán kính chân dung
    const LIFT = R + 35; // tâm chân dung nằm trên ký hiệu địa điểm
    const im = playerImg();
    const bob = Math.sin(pulse) * 1.5; // nhấp nhô nhẹ
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(f, f);
    ctx.translate(0, -LIFT + bob);
    // cuống chỉ xuống vị trí
    ctx.fillStyle = '#9b2a1f';
    ctx.strokeStyle = '#f8f2e3';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-6, R - 2); ctx.lineTo(6, R - 2); ctx.lineTo(0, R + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    // nền + ảnh
    ctx.fillStyle = '#f8f2e3';
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, R - 1, 0, Math.PI * 2); ctx.clip();
    if (im) {
      const sz = Math.min(im.naturalWidth, im.naturalHeight);
      ctx.drawImage(im, (im.naturalWidth - sz) / 2, (im.naturalHeight - sz) / 2, sz, sz, -R, -R, R * 2, R * 2);
    } else {
      // chưa có tranh: hình người đơn giản
      ctx.fillStyle = '#6e6253';
      ctx.beginPath(); ctx.moveTo(-R, R); ctx.quadraticCurveTo(-R + 2, 2, 0, 0); ctx.quadraticCurveTo(R - 2, 2, R, R); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ead9bd';
      ctx.beginPath(); ctx.arc(0, -6, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a241f';
      ctx.beginPath(); ctx.arc(0, -8, 7, Math.PI, 0); ctx.fill();
    }
    ctx.restore();
    // viền đỏ + viền kem mảnh
    ctx.strokeStyle = '#9b2a1f';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#f8f2e3';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, R + 1.9, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  }
  ctx.restore();
}

/** Tự động cân chỉnh camera bao quát toàn bộ thế giới, mở rộng kín màn hình nhưng không bị lẹm UI */
export function fitWorldView() {
  const b = getContentBounds();
  const spanW = Math.max(1000, b.maxX - b.minX);
  const spanH = Math.max(1000, b.maxY - b.minY);
  // Khoảng không khả dụng trừ thanh header (~75px) và thanh hành động đáy (~80px)
  const availW = Math.max(400, innerWidth - 90);
  const availH = Math.max(300, innerHeight - 210);
  const fitZ = Math.min(availW / spanW, availH / spanH);
  view.z = Math.max(0.06, fitZ * 0.91);
  const vw = innerWidth / view.z, vh = innerHeight / view.z;
  const midX = (b.minX + b.maxX) / 2;
  const midY = (b.minY + b.maxY) / 2;
  view.x = midX - vw / 2;
  // Căn giữa cân đối, dịch nhẹ xuống để header đỉnh không đè nhãn cực bắc
  view.y = midY - vh / 2 + 25 / view.z;
  clampView();
  draw();
}

// ---------- Tương tác ----------
let dragging = false;
let moved = 0;
let last = { x: 0, y: 0 };
const pointers = new Map<number, { x: number; y: number }>();
let pinchD = 0;
let pinchCenter = { x: 0, y: 0 };
function clearPointer(id: number) {
  pointers.delete(id);
  if (pointers.size < 2) pinchD = 0;
  if (pointers.size === 1) {
    const only = pointers.values().next().value;
    if (only) last = { x: only.x, y: only.y };
  }
  dragging = pointers.size > 0;
  if (!dragging) cv.classList.remove('drag');
}
cv.addEventListener('pointerdown', (e) => {
  try { cv.setPointerCapture(e.pointerId); } catch {}
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragging = true;
  if (pointers.size === 1) {
    moved = 0;
    last = { x: e.clientX, y: e.clientY };
  } else if (pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    pinchD = Math.hypot(a.x - b.x, a.y - b.y);
    pinchCenter = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
});
cv.addEventListener('pointermove', (e) => {
  if (!dragging || !pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
    if (pinchD > 0 && Math.abs(d - pinchD) > 2) {
      const factor = d / pinchD;
      const wx = view.x + midX / view.z, wy = view.y + midY / view.z;
      view.z = view.z * factor;
      clampView();
      view.x = wx - midX / view.z;
      view.y = wy - midY / view.z;
      clampView();
      draw();
      pinchD = d;
      pinchCenter = { x: midX, y: midY };
    } else if (!pinchD) {
      pinchD = d;
      pinchCenter = { x: midX, y: midY };
    }
    moved += 10;
    return;
  }
  const dx = e.clientX - last.x, dy = e.clientY - last.y;
  moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 4) cv.classList.add('drag');
  view.x -= dx / view.z;
  view.y -= dy / view.z;
  last = { x: e.clientX, y: e.clientY };
  clampView();
  draw();
});
cv.addEventListener('pointerup', (e) => {
  const wasPinching = pointers.size >= 2;
  clearPointer(e.pointerId);
  try { cv.releasePointerCapture(e.pointerId); } catch {}
  if (!wasPinching && moved < 6 && s) click(e.clientX, e.clientY);
});
cv.addEventListener('pointercancel', (e) => {
  clearPointer(e.pointerId);
  try { cv.releasePointerCapture(e.pointerId); } catch {}
});
cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
}, { passive: false });

function click(sx: number, sy: number) {
  const wx = view.x + sx / view.z, wy = view.y + sy / view.z;
  const hitR = 22 / Math.min(1, view.z);
  for (const p of s.pins) if (Math.hypot(p.x - wx, p.y - wy) < hitR) return onPin(p, sx, sy);
  let best: Loc | null = null;
  let bd = hitR;
  for (const l of LOC_LIST) {
    const d = Math.hypot(l.x - wx, l.y - wy);
    if (d < bd) { bd = d; best = l; }
  }
  if (best) onLoc(best, sx, sy);
  else onEmpty();
}

let raf = 0;
export function startAnim() {
  cancelAnimationFrame(raf);
  let lastT = 0;
  const loop = (t: number) => {
    if (t - lastT > 80) {
      lastT = t;
      draw();
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}
export const locAt = (id: string) => LOCS[id];
addEventListener('resize', resize);
