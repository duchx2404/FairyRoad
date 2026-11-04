// Bản đồ tiểu thế giới cho Bốn Thần Giới (Địa Phủ, Thiên Đình, Yêu Giới, Linh Sơn).
// Thiết kế chuẩn phong cách thủy mặc tu tiên (Parchment Paper + Kim Tự Tháp Peaks + Sông Hồ Hữu Cơ như bản đồ Thương Lan).
import { CELESTIAL, type CelestialId, type CPlace } from '../data/celestial';
import { drawGlyph } from './glyph';
import { seeded } from '../core/util';

export const MAP_W = 1100;
export const MAP_H = 620;

interface RealmMapConfig {
  title: string;
  subTitle: string;
  parchmentBase: [number, number, number];
  waterColor: string;
  shoreColor: string;
  lineColor: string;
  accent: string;
  mountainBase: [number, number, number];
  riverName: string;
  lakeName: string;
  badgeBorder: string;
}

const REALM_CONFIG: Record<CelestialId, RealmMapConfig> = {
  thiendinh: {
    title: 'C Ử U   T R Ù N G   T H I Ê N   G I Ớ I',
    subTitle: 'Cửu Thiên Tiên Khuyết · Dao Trì Kim Mẫu · Thiên Cung Thần Vực',
    parchmentBase: [246, 242, 232],
    waterColor: 'rgba(82, 148, 195, 0.78)',
    shoreColor: 'rgba(150, 185, 215, 0.55)',
    lineColor: '#c99e32',
    accent: '#d4af37',
    mountainBase: [225, 218, 206],
    riverName: 'Thiên Hà (Ngân Hán Tinh Lưu)',
    lakeName: 'Dao Trì Tiên Đàm',
    badgeBorder: '#9b2a1f',
  },
  diaphu: {
    title: 'Â M   T Y   U   M I N H   G I Ớ I',
    subTitle: 'Thập Điện Hoàng Tuyền · Phong Đô Quỷ Vực · Lục Đạo Luân Hồi',
    parchmentBase: [232, 222, 212],
    waterColor: 'rgba(175, 48, 48, 0.78)',
    shoreColor: 'rgba(125, 35, 35, 0.45)',
    lineColor: '#8a2b2b',
    accent: '#b83b3b',
    mountainBase: [188, 175, 172],
    riverName: 'Vong Xuyên Hà (Hoàng Tuyền Lạc)',
    lakeName: 'Huyết Trì U Uyên',
    badgeBorder: '#781d1d',
  },
  yeugioi: {
    title: 'T H Ậ P   V Ạ N   Đ Ạ I   S Ơ N   Y Ê U   G I Ớ I',
    subTitle: 'Vạn Yêu Thánh Vực · Thất Đại Thánh Sơn · Hồng Hoang Phúc Địa',
    parchmentBase: [238, 242, 230],
    waterColor: 'rgba(64, 132, 115, 0.78)',
    shoreColor: 'rgba(120, 165, 140, 0.5)',
    lineColor: '#4f7a35',
    accent: '#64a342',
    mountainBase: [205, 215, 196],
    riverName: 'Bích Ba Khê (Thông Lạc Thủy)',
    lakeName: 'Thủy Liêm Đàm',
    badgeBorder: '#2c5e2a',
  },
  linhson: {
    title: 'T Â Y   T H I Ê N   C Ự C   L Ạ C   L I N H   S Ơ N',
    subTitle: 'Đại Lôi Âm Tự · Bát Nhã Phật Sơn · Vạn Phật Triều Tông',
    parchmentBase: [248, 244, 228],
    waterColor: 'rgba(72, 142, 170, 0.78)',
    shoreColor: 'rgba(215, 190, 130, 0.55)',
    lineColor: '#b8861e',
    accent: '#d89c28',
    mountainBase: [230, 222, 198],
    riverName: 'Bát Công Đức Thủy',
    lakeName: 'Thánh Liên Hoa Trì',
    badgeBorder: '#8a4b12',
  },
};

/** Tọa độ pixel cố định của từng địa danh trên bản đồ 1100x620 */
const PLACE_COORDS: Record<CelestialId, Record<string, [number, number]>> = {
  thiendinh: {
    namthienmon: [130, 390],
    linhtieu: [560, 150],
    daotri: [810, 320],
    dausuat: [340, 190],
    quanghan: [970, 140],
    thienha: [380, 500],
    tuhai: [740, 520],
  },
  diaphu: {
    quymon: [110, 330],
    hoangtuyen: [270, 190],
    vonghuong: [410, 430],
    tamsinh: [550, 180],
    naiha: [660, 360],
    manhba: [750, 490],
    phongdo: [870, 240],
    uongtu: [920, 450],
    luanhoi: [1020, 320],
  },
  yeugioi: {
    codmon: [110, 360],
    yeuhoang: [550, 200],
    hoaqua: [920, 160],
    tichloi: [300, 150],
    sudaa: [780, 430],
    banty: [370, 490],
    hacphong: [570, 540],
    bachho: [990, 490],
  },
  linhson: {
    sonmon: [110, 390],
    loiam: [550, 160],
    lacgia: [910, 350],
    ngudai: [290, 180],
    ngami: [330, 520],
    cuuhoa: [760, 530],
    tangkinh: [630, 370],
  },
};

function mixRgb(c: [number, number, number], to: [number, number, number], k: number): string {
  return `rgb(${c.map((v, i) => Math.round(v + (to[i] - v) * k)).join(',')})`;
}

/** Vẽ núi phong cách thủy mặc hữu cơ: 2 mặt sáng tối, uốn cong tự nhiên, đỉnh tuyết phủ, gân sống núi */
function drawPyramidPeak(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  w: number,
  h: number,
  snow = false,
  baseColor: [number, number, number] = [225, 218, 206]
) {
  const sVal = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
  const rJit = (n: number) => {
    const v = Math.sin(sVal + n * 91.345) * 43758.5453;
    return v - Math.floor(v);
  };

  const apexOff = (rJit(1) - 0.5) * w * 0.18;
  const ax = px + apexOff, ay = py - h;
  const rx = px + w * 0.14 + (rJit(2) - 0.5) * w * 0.08;

  const lightPeak = mixRgb(baseColor, [255, 252, 246], 0.55);
  const lightMid = mixRgb(baseColor, [248, 242, 230], 0.35);
  const darkPeak = mixRgb(baseColor, [40, 34, 28], 0.48);
  const darkMid = mixRgb(baseColor, [46, 38, 33], 0.38);

  const gradLight = ctx.createLinearGradient(0, ay, 0, py + 3);
  gradLight.addColorStop(0, lightPeak);
  gradLight.addColorStop(0.68, lightMid);
  gradLight.addColorStop(1, mixRgb(baseColor, [240, 235, 225], 0.18));

  const gradDark = ctx.createLinearGradient(0, ay, 0, py + 3);
  gradDark.addColorStop(0, darkPeak);
  gradDark.addColorStop(0.65, darkMid);
  gradDark.addColorStop(1, mixRgb(baseColor, [42, 36, 31], 0.2));

  const l1x = px - w * 0.82, l1y = py - h * 0.26;
  const l2x = px - w * 0.42 + (rJit(3) - 0.5) * 5, l2y = py - h * 0.68;
  const r1x = px + w * 0.38 + (rJit(4) - 0.5) * 5, r1y = py - h * 0.68;
  const r2x = px + w * 0.78, r2y = py - h * 0.26;

  const crx = (ax + rx) / 2 + (rJit(5) - 0.5) * w * 0.12;
  const cry = (ay + py) / 2 + (rJit(6) - 0.5) * h * 0.08;

  // Mặt sáng (dương diện)
  ctx.fillStyle = gradLight;
  ctx.beginPath();
  ctx.moveTo(px - w, py);
  ctx.bezierCurveTo(l1x, l1y, l2x, l2y, ax, ay);
  ctx.quadraticCurveTo(crx, cry, rx, py);
  ctx.closePath();
  ctx.fill();

  // Mặt tối (âm diện)
  ctx.fillStyle = gradDark;
  ctx.beginPath();
  ctx.moveTo(rx, py);
  ctx.quadraticCurveTo(crx, cry, ax, ay);
  ctx.bezierCurveTo(r1x, r1y, r2x, r2y, px + w, py);
  ctx.closePath();
  ctx.fill();

  // Đỉnh tuyết hoặc kim quang
  if (snow) {
    const sk = 0.32;
    const say = ay + h * sk;
    const slx = px - w * sk * 0.85;
    const srx = px + w * sk * 0.85;
    const scx = ax + (rx - ax) * sk;

    ctx.fillStyle = 'rgba(252, 254, 255, 0.95)';
    ctx.beginPath();
    ctx.moveTo(slx, say);
    ctx.bezierCurveTo(px - w * 0.45 * sk, ay + h * 0.18, ax - w * 0.15 * sk, ay + h * 0.08, ax, ay);
    ctx.quadraticCurveTo((ax + scx) / 2, (ay + say) / 2, scx, say);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(215, 226, 238, 0.94)';
    ctx.beginPath();
    ctx.moveTo(scx, say);
    ctx.quadraticCurveTo((ax + scx) / 2, (ay + say) / 2, ax, ay);
    ctx.bezierCurveTo(ax + w * 0.15 * sk, ay + h * 0.08, px + w * 0.45 * sk, ay + h * 0.18, srx, say);
    ctx.closePath();
    ctx.fill();
  }

  // Viền nét bút mực ngoài
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = 'rgba(40, 34, 28, 0.48)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(crx, cry, rx, py);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(38, 32, 26, 0.6)';
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  ctx.moveTo(px - w, py);
  ctx.bezierCurveTo(l1x, l1y, l2x, l2y, ax, ay);
  ctx.bezierCurveTo(r1x, r1y, r2x, r2y, px + w, py);
  ctx.stroke();

  // Nếp gân đá
  if (h > 32) {
    ctx.strokeStyle = 'rgba(38, 32, 26, 0.22)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const tx1 = (ax + r1x) / 2, ty1 = (ay + r1y) / 2;
    ctx.moveTo(tx1, ty1);
    ctx.quadraticCurveTo(tx1 + (rJit(7) - 0.5) * 6 + 3, ty1 + h * 0.2, (crx + px + w) / 2, py - 3);
    ctx.stroke();
  }
}

/** Vẽ đường bờ biển hữu cơ bằng quadratic beziers */
function drawOrganicBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  points = 18,
  seed = 42,
  jitter = 0.08
) {
  const rnd = seeded(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = 1 + (rnd() - 0.5) * jitter;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  ctx.beginPath();
  const mid = (p: [number, number], q: [number, number]): [number, number] => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[pts.length - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % pts.length]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}

/** Vẽ hồ nước hữu cơ chuẩn Hình 5 */
function drawOrganicLake(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  lrx: number,
  lry: number,
  waterColor: string,
  shoreColor: string,
  name?: string
) {
  ctx.save();
  drawOrganicBlob(ctx, lx, ly, lrx, lry, 16, Math.floor(lx + ly), 0.16);

  // Nước hồ
  ctx.fillStyle = waterColor;
  ctx.fill();

  // Bờ hồ
  ctx.strokeStyle = shoreColor;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Sóng gợn nước
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.2;
  for (let dy = -lry + 10; dy < lry - 10; dy += 16) {
    const span = Math.sqrt(Math.max(0, 1 - (dy / lry) ** 2)) * lrx * 0.7;
    ctx.beginPath();
    ctx.moveTo(lx - span, ly + dy);
    ctx.quadraticCurveTo(lx - span * 0.5, ly + dy - 3, lx, ly + dy);
    ctx.quadraticCurveTo(lx + span * 0.5, ly + dy + 3, lx + span, ly + dy);
    ctx.stroke();
  }
  ctx.restore();

  if (name) {
    ctx.font = 'italic 600 12px "Cinzel", "Noto Serif", serif';
    ctx.fillStyle = 'rgba(40, 75, 95, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(name, lx, ly + 4);
  }
}

/** Vẽ dòng sông uốn lượn kèm chữ tên sông */
function drawRiver(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  width = 6,
  label = ''
) {
  if (pts.length < 2) return;
  ctx.save();

  // Viền bờ sông
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  ctx.strokeStyle = 'rgba(70, 60, 50, 0.35)';
  ctx.lineWidth = width + 2.5;
  ctx.stroke();

  // Nước sông
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Nhãn tên sông
  if (label && pts.length >= 3) {
    const midIdx = Math.floor(pts.length / 2);
    const p1 = pts[midIdx - 1];
    const p2 = pts[midIdx + 1];
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2 - 10;
    const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.font = 'italic 600 12px "Cinzel", "Noto Serif", serif';
    ctx.fillStyle = 'rgba(45, 75, 95, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/** Vẽ các cụm rừng cây nhỏ rải rác kiểu phong cách bản đồ Thương Lan */
function drawForestClusters(ctx: CanvasRenderingContext2D, clusters: [number, number, number, string][]) {
  ctx.save();
  for (const [cx, cy, count, color] of clusters) {
    const rnd = seeded(Math.floor(cx * 13 + cy * 17));
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * 28;
      const tx = cx + Math.cos(a) * d;
      const ty = cy + Math.sin(a) * d * 0.7;
      const r = 2.4 + rnd() * 2.2;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Lấy biểu tượng glyph đặc thù */
function getLandmarkGlyph(realm: CelestialId, placeId: string): string {
  switch (realm) {
    case 'thiendinh':
      if (placeId === 'namthienmon') return 'gate';
      if (placeId === 'linhtieu') return 'holy';
      if (placeId === 'daotri') return 'thuy';
      if (placeId === 'dausuat') return 'furnace';
      if (placeId === 'quanghan') return 'am';
      if (placeId === 'thienha') return 'thuy';
      if (placeId === 'tuhai') return 'crown';
      return 'place';
    case 'diaphu':
      if (placeId === 'quymon') return 'gate';
      if (placeId === 'hoangtuyen') return 'wild';
      if (placeId === 'vonghuong') return 'mountain';
      if (placeId === 'tamsinh') return 'ore';
      if (placeId === 'naiha') return 'thuy';
      if (placeId === 'manhba') return 'furnace';
      if (placeId === 'phongdo') return 'town';
      if (placeId === 'uongtu') return 'sect';
      if (placeId === 'luanhoi') return 'yin';
      return 'place';
    case 'yeugioi':
      if (placeId === 'codmon') return 'gate';
      if (placeId === 'yeuhoang') return 'demon';
      if (placeId === 'hoaqua') return 'mountain';
      if (placeId === 'tichloi') return 'loi';
      if (placeId === 'sudaa') return 'mountain';
      if (placeId === 'banty') return 'wild';
      if (placeId === 'hacphong') return 'mountain';
      if (placeId === 'bachho') return 'mountain';
      return 'place';
    case 'linhson':
      if (placeId === 'sonmon') return 'gate';
      if (placeId === 'loiam') return 'pagoda';
      if (placeId === 'lacgia') return 'mountain';
      if (placeId === 'ngudai') return 'mountain';
      if (placeId === 'ngami') return 'mountain';
      if (placeId === 'cuuhoa') return 'mountain';
      if (placeId === 'tangkinh') return 'sect';
      return 'place';
  }
}


/** Vẽ biểu tượng đặc thù mỹ thuật cao cho từng địa danh của 4 Thần Giới */
function drawLandmarkDetailedIcon(
  ctx: CanvasRenderingContext2D,
  realm: CelestialId,
  placeId: string,
  px: number,
  py: number,
  isSel: boolean,
  isHov: boolean
) {
  const R = 21;

  // 1. Vòng hào quang thiên giới tỏa sáng khi chọn hoặc hover
  if (isSel || isHov) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, R + 7, 0, Math.PI * 2);
    ctx.fillStyle = isSel ? 'rgba(220, 38, 38, 0.32)' : 'rgba(234, 179, 8, 0.32)';
    ctx.fill();
    ctx.strokeStyle = isSel ? '#dc2626' : '#eab308';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Hào quang gợn sóng vòng ngoài
    ctx.beginPath();
    ctx.arc(px, py, R + 12, 0, Math.PI * 2);
    ctx.strokeStyle = isSel ? 'rgba(239, 68, 68, 0.4)' : 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // 2. Huy hiệu nền tròn vững chắc (Obsidian / Gold / Jade / Cinnabar)
  ctx.save();
  ctx.translate(px, py);

  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  const baseGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, R);

  if (realm === 'thiendinh') {
    baseGrad.addColorStop(0, '#2c3e50');
    baseGrad.addColorStop(1, '#0f172a');
  } else if (realm === 'diaphu') {
    baseGrad.addColorStop(0, '#450a0a');
    baseGrad.addColorStop(1, '#1c0508');
  } else if (realm === 'yeugioi') {
    baseGrad.addColorStop(0, '#14532d');
    baseGrad.addColorStop(1, '#052e16');
  } else {
    baseGrad.addColorStop(0, '#582c0c');
    baseGrad.addColorStop(1, '#291404');
  }
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // Viền huy hiệu hoàng kim sang trọng
  ctx.strokeStyle = isSel ? '#f87171' : isHov ? '#fde047' : '#d4af37';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Viền chỉ vàng mảnh bên trong
  ctx.beginPath();
  ctx.arc(0, 0, R - 2.8, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 248, 220, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 3. VẼ BIỂU TƯỢNG ĐẶC THÙ RIÊNG CHO TỪNG ĐỊA DANH
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ========== THIÊN ĐÌNH ==========
  if (realm === 'thiendinh') {
    if (placeId === 'namthienmon') {
      // Cổng trời Nam Thiên Môn: cột son, mái vàng, mây trắng
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-10, -5, 3.5, 15);
      ctx.fillRect(6.5, -5, 3.5, 15);
      // Xà ngang
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-12, -4, 24, 3);
      // Mái cong tiên gia
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.quadraticCurveTo(0, -11, 14, -6);
      ctx.lineTo(12, -8);
      ctx.quadraticCurveTo(0, -13, -12, -8);
      ctx.closePath();
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Mây tiên dưới chân
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(-5, 9, 3, 0, Math.PI * 2);
      ctx.arc(0, 8.5, 4, 0, Math.PI * 2);
      ctx.arc(5, 9, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (placeId === 'linhtieu') {
      // Lăng Tiêu Bảo Điện: Cung điện hoàng kim 3 tầng mái vàng lộng lẫy
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      // Tầng 1
      ctx.beginPath();
      ctx.moveTo(-13, 5); ctx.lineTo(0, 0); ctx.lineTo(13, 5); ctx.lineTo(9, 7); ctx.lineTo(-9, 7); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Tầng 2
      ctx.beginPath();
      ctx.moveTo(-9, 0); ctx.lineTo(0, -4); ctx.lineTo(9, 0); ctx.lineTo(6, 2); ctx.lineTo(-6, 2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Tầng đỉnh + bảo đao chóp
      ctx.beginPath();
      ctx.moveTo(-5, -5); ctx.lineTo(0, -11); ctx.lineTo(5, -5); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Cột cung điện
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-8, 7, 2.5, 4);
      ctx.fillRect(5.5, 7, 2.5, 4);
      // Ánh hào quang ngọc hoàng
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(0, -11, 1.8, 0, Math.PI * 2); ctx.fill();
    } else if (placeId === 'dausuat') {
      // Đâu Suất Cung: Lò Bát Quái luyện đan, tam muội chân hỏa
      ctx.fillStyle = '#ca8a04';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      // Thân vạc đồng
      ctx.beginPath();
      ctx.arc(0, 2, 7.5, 0, Math.PI);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Chân vạc
      ctx.fillRect(-6, 8, 2.5, 4);
      ctx.fillRect(3.5, 8, 2.5, 4);
      // Nắp lò Bát Quái
      ctx.beginPath();
      ctx.moveTo(-7.5, 2); ctx.quadraticCurveTo(0, -4, 7.5, 2); ctx.closePath();
      ctx.fillStyle = '#eab308';
      ctx.fill(); ctx.stroke();
      // Núm nắp
      ctx.beginPath(); ctx.arc(0, -4, 1.8, 0, Math.PI * 2); ctx.fill();
      // Ngọn lửa thần màu cam đỏ
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-3, 1); ctx.quadraticCurveTo(0, -6, 2, -2); ctx.quadraticCurveTo(0, 4, -3, 1);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (placeId === 'daotri') {
      // Dao Trì: Đầm tiên ngọc bích, hoa sen hồng & đào trường sinh
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 5, 11, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Quả đào tiên
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(-2.5, -3, 5, 0, Math.PI * 2);
      ctx.arc(2.5, -3, 5, 0, Math.PI * 2);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, Math.PI * 2); ctx.fill();
      // Lá đào xanh
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.quadraticCurveTo(5, -11, 7, -8); ctx.quadraticCurveTo(4, -6, 0, -7);
      ctx.fill();
    } else if (placeId === 'quanghan') {
      // Quảng Hàn Cung: Trăng khuyết băng tuyết & thỏ ngọc
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0.6 * Math.PI, 1.8 * Math.PI, false);
      ctx.arc(2, -1, 7.5, 1.8 * Math.PI, 0.6 * Math.PI, true);
      ctx.closePath();
      ctx.fill();
      // Tinh tú băng phách
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -5, 2, 2);
      ctx.fillRect(4, -4, 1.8, 1.8);
      ctx.fillRect(3, 3, 2, 2);
      // Tai thỏ ngọc trắng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, 3, 1.5, 4, -0.2, 0, Math.PI * 2);
      ctx.ellipse(1.5, 3, 1.5, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (placeId === 'thienha') {
      // Thiên Hà Thủy Doanh: Sóng bạc ngân hà & đinh ba chiến hạm
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-11, 4); ctx.quadraticCurveTo(-5, 0, 0, 4); ctx.quadraticCurveTo(5, 8, 11, 4);
      ctx.moveTo(-11, 8); ctx.quadraticCurveTo(-5, 4, 0, 8); ctx.quadraticCurveTo(5, 12, 11, 8);
      ctx.stroke();
      // Đinh ba vàng của Thủy Quân Nguyên Soái
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -10); ctx.lineTo(0, 5);
      ctx.moveTo(-5, -6); ctx.lineTo(-5, -4); ctx.quadraticCurveTo(-3, -1, 0, -1); ctx.quadraticCurveTo(3, -1, 5, -4); ctx.lineTo(5, -6);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(-2, -8); ctx.lineTo(2, -8); ctx.closePath(); ctx.fill();
    } else {
      // Tứ Hải Long Cung: Vương miện rồng lam ngọc & dạ minh châu
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, 4); ctx.lineTo(-11, -5); ctx.lineTo(-5, -1); ctx.lineTo(0, -9); ctx.lineTo(5, -1); ctx.lineTo(11, -5); ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Dạ minh châu tỏa sáng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#93c5fd';
      ctx.stroke();
    }
  }

  // ========== ĐỊA PHỦ ==========
  else if (realm === 'diaphu') {
    if (placeId === 'quymon') {
      // Quỷ Môn Quan: Sừng quỷ đỏ dữ tợn & đôi mắt lân hỏa xanh
      ctx.strokeStyle = '#b91c1c';
      ctx.fillStyle = '#450a0a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-11, 4); ctx.quadraticCurveTo(-13, -8, -5, -10); ctx.quadraticCurveTo(-7, -4, 0, -4);
      ctx.quadraticCurveTo(7, -4, 5, -10); ctx.quadraticCurveTo(13, -8, 11, 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 2 Cột trụ xương
      ctx.fillRect(-9, 4, 3, 7);
      ctx.fillRect(6, 4, 3, 7);
      // Mắt ma xanh u hồn
      ctx.fillStyle = '#2dd4bf';
      ctx.beginPath(); ctx.arc(-4, 0, 1.8, 0, Math.PI * 2); ctx.arc(4, 0, 1.8, 0, Math.PI * 2); ctx.fill();
    } else if (placeId === 'hoangtuyen') {
      // Hoàng Tuyền Lộ: Hoa Bỉ Ngạn đỏ rực 6 cánh mảnh cong
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.4;
      for (let a = 0; a < 6; a++) {
        const rad = (a * 60 * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(rad + 0.3) * 6, Math.sin(rad + 0.3) * 6, Math.cos(rad) * 11, Math.sin(rad) * 11);
        ctx.stroke();
      }
      ctx.fillStyle = '#f87171';
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (placeId === 'vonghuong') {
      // Vọng Hương Đài: Đài quan sát cao tầng & gương Nghiệp Kính
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-7, 2, 14, 9);
      // Mái đài cong
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(-11, 2); ctx.lineTo(0, -3); ctx.lineTo(11, 2); ctx.lineTo(8, 4); ctx.lineTo(-8, 4); ctx.closePath();
      ctx.fill();
      // Gương soi nhân gian
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, -6, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (placeId === 'tamsinh') {
      // Tam Sinh Thạch: Tảng đá cự thạch khắc ba kiếp (đỏ, vàng, lam)
      ctx.fillStyle = '#57534e';
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-7, 10); ctx.lineTo(-9, -2); ctx.lineTo(-3, -10); ctx.lineTo(6, -8); ctx.lineTo(8, 10); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 3 Phù văn tiền kiếp, hiện kiếp, lai kiếp
      ctx.fillStyle = '#f87171'; ctx.fillRect(-3, -5, 6, 1.8);
      ctx.fillStyle = '#facc15'; ctx.fillRect(-4, -1, 8, 1.8);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-3, 3, 6, 1.8);
    } else if (placeId === 'naiha') {
      // Nại Hà Kiều: Cây cầu đá vòm cong bắc qua dòng huyết hà
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, 7); ctx.lineTo(12, 7);
      ctx.stroke();
      // Nhịp vòm cầu đá
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 9, 9, Math.PI, 0, false);
      ctx.stroke();
      // Lan can cầu
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 9, 12, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.stroke();
    } else if (placeId === 'manhba') {
      // Mạnh Bà Đình: Đình lục giác cổ & vạc canh quên lãng
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(-10, -2); ctx.lineTo(0, -9); ctx.lineTo(10, -2); ctx.lineTo(7, 0); ctx.lineTo(-7, 0); ctx.closePath();
      ctx.fill();
      // Cột đình
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-7, 0, 2, 10);
      ctx.fillRect(5, 0, 2, 10);
      // Nồi canh Mạnh Bà
      ctx.fillStyle = '#1c1917';
      ctx.beginPath(); ctx.arc(0, 6, 4, 0, Math.PI); ctx.fill();
      // Khói canh nghi ngút
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-1, 2); ctx.quadraticCurveTo(-3, -1, -1, -3);
      ctx.moveTo(2, 2); ctx.quadraticCurveTo(4, -1, 2, -3);
      ctx.stroke();
    } else if (placeId === 'phongdo') {
      // Phong Đô Thành: Thành trì hắc thiết nguy nga của Diêm La
      ctx.fillStyle = '#292524';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.2;
      // Tường thành
      ctx.beginPath();
      ctx.rect(-10, 0, 20, 10);
      ctx.fill(); ctx.stroke();
      // Lỗ châu mai
      ctx.fillRect(-10, -3, 3.5, 3);
      ctx.fillRect(-2, -3, 4, 3);
      ctx.fillRect(6.5, -3, 3.5, 3);
      // Tháp canh giữa
      ctx.beginPath();
      ctx.moveTo(-5, 0); ctx.lineTo(0, -9); ctx.lineTo(5, 0); ctx.closePath();
      ctx.fillStyle = '#991b1b';
      ctx.fill(); ctx.stroke();
      // Cổng thành đỏ rực
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, 10, 3.5, Math.PI, 0); ctx.fill();
    } else if (placeId === 'uongtu') {
      // Uổng Tử Thành: Tòa thành giam giữ hồn chết oan có xích sắt
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-9, -5, 18, 14);
      // Xiềng xích sắt chéo
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(-9, -5); ctx.lineTo(9, 9);
      ctx.moveTo(9, -5); ctx.lineTo(-9, 9);
      ctx.stroke();
      // Linh phù phong ấn oán khí
      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.arc(0, 2, 2.8, 0, Math.PI * 2); ctx.fill();
    } else {
      // Lục Đạo Luân Hồi Đài: Bánh xe luân hồi 6 cánh
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const rad = (i * 60 * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rad) * 9, Math.sin(rad) * 9);
        ctx.stroke();
      }
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ========== YÊU GIỚI ==========
  else if (realm === 'yeugioi') {
    if (placeId === 'codmon') {
      // Vạn Yêu Cổ Môn: Cổng đá cự thạch hồng hoang phủ rêu xanh
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(-10, -5, 4, 15);
      ctx.fillRect(6, -5, 4, 15);
      // Tảng đá xà ngang
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-12, -7, 24, 4);
      // Răng nanh yêu thú
      ctx.fillStyle = '#f4f4f5';
      ctx.beginPath();
      ctx.moveTo(-4, -3); ctx.lineTo(-2, 2); ctx.lineTo(0, -3);
      ctx.moveTo(0, -3); ctx.lineTo(2, 2); ctx.lineTo(4, -3);
      ctx.fill();
      // Dây leo xanh
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(-5, 6); ctx.stroke();
    } else if (placeId === 'yeuhoang') {
      // Yêu Hoàng Điện: Vương miện thú vương sừng nhọn & rìu chiến
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-9, 5); ctx.lineTo(-10, -5); ctx.lineTo(-4, -1); ctx.lineTo(0, -9); ctx.lineTo(4, -1); ctx.lineTo(10, -5); ctx.lineTo(9, 5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Ngọc đỏ yêu hoàng
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (placeId === 'hoaqua') {
      // Hoa Quả Sơn: Thác nước đổ & Gậy Như Ý vàng đỏ
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-8, -4, 4, 14);
      // Gậy Như Ý kình thiên
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(7, -8); ctx.lineTo(-2, 9); ctx.stroke();
      // Đầu bịt vàng
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(7, -8); ctx.lineTo(5, -4);
      ctx.moveTo(0, 5); ctx.lineTo(-2, 9);
      ctx.stroke();
      // Quả đào đỏ
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(4, 2, 3, 0, Math.PI * 2); ctx.fill();
    } else if (placeId === 'tichloi') {
      // Tích Lôi Sơn: Núi đen & tia sét tím lôi đình
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.moveTo(-10, 8); ctx.lineTo(0, -6); ctx.lineTo(10, 8); ctx.closePath();
      ctx.fill();
      // Tia chớp tím Lôi Đình
      ctx.strokeStyle = '#c084fc';
      ctx.fillStyle = '#e879f9';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(1, -10); ctx.lineTo(-3, -2); ctx.lineTo(2, -2); ctx.lineTo(-2, 7); ctx.lineTo(4, 0); ctx.lineTo(0, 0); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (placeId === 'sudaa') {
      // Sư Đà Lĩnh: Đôi cánh Bằng Ma Vương & đầu Sư Tử
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-6, -9, 0, 2); ctx.quadraticCurveTo(-6, -2, -12, -2);
      ctx.moveTo(12, -2); ctx.quadraticCurveTo(6, -9, 0, 2); ctx.quadraticCurveTo(6, -2, 12, -2);
      ctx.fill();
      // Vuốt sư tử vồ
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (placeId === 'banty') {
      // Bàn Ty Động: Mạng nhện tơ bạc kỳ bí
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        ctx.moveTo(0, 0); ctx.lineTo(Math.cos(rad) * 9, Math.sin(rad) * 9);
      }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.stroke();
      // Nhện tinh tím
      ctx.fillStyle = '#a855f7';
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (placeId === 'hacphong') {
      // Hắc Phong Sơn: Cơn lốc đen cuồng phong
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -4, 3, 0, Math.PI);
      ctx.arc(0, -1, 5.5, Math.PI, 0, false);
      ctx.arc(0, 2, 8, 0, Math.PI, false);
      ctx.stroke();
      // Đôi mắt gấu sói hung hãn
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-3, 6, 2, 2); ctx.fillRect(1, 6, 2, 2);
    } else {
      // Bạch Cốt Lĩnh: Đồi sọ trắng & lửa u hồn
      ctx.fillStyle = '#f4f4f5';
      ctx.beginPath();
      ctx.arc(0, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      // Hàm dưới sọ
      ctx.fillRect(-3, 4, 6, 3.5);
      // 2 hốc mắt đen
      ctx.fillStyle = '#18181b';
      ctx.beginPath(); ctx.arc(-2.5, -2, 1.8, 0, Math.PI * 2); ctx.arc(2.5, -2, 1.8, 0, Math.PI * 2); ctx.fill();
      // Lửa ma xanh
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.arc(0, -8, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ========== LINH SƠN ==========
  else {
    if (placeId === 'sonmon') {
      // Linh Sơn Sơn Môn: Cổng tam quan Phật tích trang nghiêm
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-10, -4, 3.5, 14);
      ctx.fillRect(6.5, -4, 3.5, 14);
      // Mái ngói nâu vàng
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(-13, -4); ctx.quadraticCurveTo(0, -9, 13, -4); ctx.lineTo(11, -7); ctx.quadraticCurveTo(0, -12, -11, -7); ctx.closePath();
      ctx.fill();
      // Chữ Phật / Vạn tự
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.2;
      ctx.strokeRect(-2, -1, 4, 4);
    } else if (placeId === 'loiam') {
      // Đại Lôi Âm Tự: Đại Hùng Bảo Điện dát vàng tỏa vạn trượng hào quang
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -3, 8.5, 0, Math.PI * 2);
      ctx.fill();
      // Tháp bảo điện
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(-9, 5); ctx.lineTo(0, -10); ctx.lineTo(9, 5); ctx.closePath();
      ctx.fill();
      // Vạn tự Phật quang (Swastika / Wan 卍)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -4); ctx.lineTo(0, 2);
      ctx.moveTo(-3, -1); ctx.lineTo(3, -1);
      ctx.moveTo(-3, -1); ctx.lineTo(-3, -3);
      ctx.moveTo(3, -1); ctx.lineTo(3, 1);
      ctx.moveTo(0, -4); ctx.lineTo(2, -4);
      ctx.moveTo(0, 2); ctx.lineTo(-2, 2);
      ctx.stroke();
    } else if (placeId === 'lacgia') {
      // Phổ Đà Lạc Già Sơn: Cành dương liễu & Tịnh bình cam lộ Nam Hải
      // Sóng biển Nam Hải
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-10, 7); ctx.quadraticCurveTo(-5, 4, 0, 7); ctx.quadraticCurveTo(5, 10, 10, 7); ctx.stroke();
      // Bình nước cam lộ trắng ngọc
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-3, 6); ctx.lineTo(-4, 0); ctx.lineTo(-2, -4); ctx.lineTo(2, -4); ctx.lineTo(4, 0); ctx.lineTo(3, 6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Cành dương liễu xanh biếc
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -4); ctx.quadraticCurveTo(5, -9, 8, -6);
      ctx.stroke();
    } else if (placeId === 'ngudai') {
      // Ngũ Đài Sơn: Núi tuyết & Thanh kiếm huệ Văn Thù
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-9, 8); ctx.lineTo(0, -3); ctx.lineTo(9, 8); ctx.closePath();
      ctx.fill();
      // Thanh kiếm trí tuệ
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.stroke();
      // Lửa bát nhã
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, -11, 2, 0, Math.PI * 2); ctx.fill();
    } else if (placeId === 'ngami') {
      // Nga Mi Sơn: Voi trắng 6 ngà của Phổ Hiền
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -1, 6.5, 0, Math.PI * 2);
      ctx.fill();
      // Ngà voi cong lên
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, 1); ctx.quadraticCurveTo(-9, 5, -8, 8);
      ctx.moveTo(5, 1); ctx.quadraticCurveTo(9, 5, 8, 8);
      ctx.stroke();
    } else if (placeId === 'cuuhoa') {
      // Cửu Hoa Sơn: Tích trượng vàng Địa Tạng Vương & ngọc minh châu
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
      // Vòng tích trượng
      ctx.beginPath(); ctx.arc(0, -6, 4, 0, Math.PI * 2); ctx.stroke();
      // Dạ minh châu chiếu rọi u minh
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, -6, 2.2, 0, Math.PI * 2); ctx.fill();
    } else {
      // Tàng Kinh Các: Tháp kinh 3 tầng chứa vạn quyển kinh điển
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-7, 2, 14, 6);
      ctx.fillRect(-5, -3, 10, 5);
      ctx.fillRect(-3, -8, 6, 5);
      // Mái chùa cong vàng
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-9, 1, 18, 2);
      ctx.fillRect(-7, -4, 14, 2);
      ctx.fillRect(-5, -9, 10, 2);
    }
  }

  ctx.restore();
}

/** Bộ vẽ chính cho Bản đồ Thần Giới */
export function renderCelestialMap(
  canvas: HTMLCanvasElement,
  realmId: CelestialId,
  selectedId: string,
  hoveredId: string | null,
  counts: Record<string, number>
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = MAP_W * dpr;
  canvas.height = MAP_H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.scale(dpr, dpr);

  const cfg = REALM_CONFIG[realmId];
  const R = CELESTIAL[realmId];

  // 1. Nền giấy da cổ (Parchment Texture)
  ctx.fillStyle = `rgb(${cfg.parchmentBase.join(',')})`;
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // Đường bờ biển ngoài khơi (3 lớp chỉ sóng viền lục địa)
  const cx = MAP_W / 2, cy = MAP_H / 2 + 10;
  const rx = MAP_W * 0.46, ry = MAP_H * 0.43;

  for (let offset = 22; offset >= 8; offset -= 7) {
    ctx.strokeStyle = `rgba(50, 42, 34, ${0.05 + (22 - offset) * 0.01})`;
    ctx.lineWidth = 1.2;
    drawOrganicBlob(ctx, cx, cy, rx + offset, ry + offset, 24, 101 + offset, 0.07);
    ctx.stroke();
  }

  // Đất liền lục địa chính
  drawOrganicBlob(ctx, cx, cy, rx, ry, 26, 999, 0.08);
  const landGrad = ctx.createRadialGradient(cx, cy * 0.8, 80, cx, cy, rx);
  landGrad.addColorStop(0, mixRgb(cfg.parchmentBase, [255, 255, 255], 0.25));
  landGrad.addColorStop(0.7, mixRgb(cfg.parchmentBase, [240, 235, 220], 0.1));
  landGrad.addColorStop(1, mixRgb(cfg.parchmentBase, [180, 168, 148], 0.35));
  ctx.fillStyle = landGrad;
  ctx.fill();

  // Viền mép lục địa bằng nét mực thủy mặc
  ctx.strokeStyle = 'rgba(52, 44, 36, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 2. Vệt màu loang khí hậu đặc trưng của tiểu thế giới
  ctx.save();
  ctx.clip(); // Chỉ loang trong lục địa
  const mistGrad = ctx.createLinearGradient(0, 0, MAP_W, MAP_H);
  if (realmId === 'thiendinh') {
    mistGrad.addColorStop(0, 'rgba(215, 232, 250, 0.32)');
    mistGrad.addColorStop(0.5, 'rgba(255, 245, 220, 0.22)');
    mistGrad.addColorStop(1, 'rgba(220, 235, 248, 0.35)');
  } else if (realmId === 'diaphu') {
    mistGrad.addColorStop(0, 'rgba(165, 55, 55, 0.22)');
    mistGrad.addColorStop(0.5, 'rgba(60, 45, 75, 0.25)');
    mistGrad.addColorStop(1, 'rgba(185, 45, 45, 0.28)');
  } else if (realmId === 'yeugioi') {
    mistGrad.addColorStop(0, 'rgba(145, 185, 125, 0.32)');
    mistGrad.addColorStop(0.5, 'rgba(215, 195, 145, 0.25)');
    mistGrad.addColorStop(1, 'rgba(120, 168, 115, 0.35)');
  } else {
    mistGrad.addColorStop(0, 'rgba(245, 218, 145, 0.32)');
    mistGrad.addColorStop(0.5, 'rgba(235, 185, 175, 0.25)');
    mistGrad.addColorStop(1, 'rgba(240, 205, 130, 0.38)');
  }
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  ctx.restore();

  // 3. Hệ thống Sông & Hồ Hữu Cơ (Tự nhiên)
  if (realmId === 'thiendinh') {
    // Thiên Hà (Ngân Hán)
    drawRiver(ctx, [[180, 520], [320, 490], [480, 480], [680, 510], [920, 490]], cfg.waterColor, 12, cfg.riverName);
    // Dao Trì Tiên Đàm
    drawOrganicLake(ctx, 810, 320, 95, 60, cfg.waterColor, cfg.shoreColor, cfg.lakeName);
  } else if (realmId === 'diaphu') {
    // Vong Xuyên Hà
    drawRiver(ctx, [[140, 360], [290, 270], [460, 330], [640, 350], [820, 330], [1020, 360]], cfg.waterColor, 9, cfg.riverName);
    // Huyết Trì
    drawOrganicLake(ctx, 420, 220, 65, 42, cfg.waterColor, cfg.shoreColor, cfg.lakeName);
    // Tam Sinh Đàm
    drawOrganicLake(ctx, 550, 180, 52, 35, 'rgba(45, 55, 80, 0.72)', 'rgba(90, 105, 135, 0.5)');
  } else if (realmId === 'yeugioi') {
    // Bích Ba Khê
    drawRiver(ctx, [[160, 410], [360, 370], [540, 350], [740, 360], [940, 240]], cfg.waterColor, 8, cfg.riverName);
    // Thủy Liêm Đàm
    drawOrganicLake(ctx, 920, 190, 75, 48, cfg.waterColor, cfg.shoreColor, cfg.lakeName);
  } else {
    // Bát Công Đức Thủy
    drawRiver(ctx, [[160, 410], [380, 370], [550, 360], [750, 380], [940, 340]], cfg.waterColor, 8, cfg.riverName);
    // Thánh Liên Hoa Trì
    drawOrganicLake(ctx, 640, 370, 85, 52, cfg.waterColor, cfg.shoreColor, cfg.lakeName);
  }

  // 4. Rừng cây tự nhiên
  const forests: [number, number, number, string][] = [
    [220, 280, 14, 'rgba(75, 105, 70, 0.7)'],
    [460, 240, 18, realmId === 'diaphu' ? 'rgba(165, 40, 40, 0.75)' : 'rgba(85, 115, 75, 0.7)'],
    [720, 250, 16, realmId === 'linhson' ? 'rgba(185, 150, 60, 0.75)' : 'rgba(70, 100, 65, 0.7)'],
    [860, 420, 15, 'rgba(65, 95, 60, 0.7)'],
    [350, 440, 12, 'rgba(75, 105, 70, 0.7)'],
  ];
  drawForestClusters(ctx, forests);

  // 5. Dãy Núi Kim Tự Tháp chuẩn Hình 5
  type PeakDef = { px: number; py: number; w: number; h: number; snow?: boolean };
  const peaks: PeakDef[] = [];

  const addRange = (startX: number, startY: number, endX: number, endY: number, count: number, maxW: number, maxH: number, snow = false) => {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const px = startX + (endX - startX) * t + (Math.sin(i * 3.5) * 18);
      const py = startY + (endY - startY) * t + (Math.cos(i * 2.8) * 12);
      const w = maxW * (0.75 + (i % 3) * 0.14);
      const h = maxH * (0.8 + ((i + 1) % 3) * 0.12);
      peaks.push({ px, py, w, h, snow });
    }
  };

  // Tạo các dãy núi hiểm trở đặc thù cho từng giới
  if (realmId === 'thiendinh') {
    addRange(200, 150, 440, 140, 6, 42, 36, true);
    addRange(620, 130, 880, 130, 7, 44, 38, true);
    addRange(480, 230, 660, 240, 5, 38, 32, false);
    addRange(210, 340, 360, 350, 4, 34, 28, false);
    addRange(820, 430, 960, 440, 4, 36, 30, false);
  } else if (realmId === 'diaphu') {
    addRange(170, 160, 390, 150, 6, 44, 38, false);
    addRange(640, 150, 860, 160, 6, 46, 40, false);
    addRange(310, 350, 480, 360, 5, 40, 34, false);
    addRange(720, 310, 860, 310, 4, 38, 32, false);
    addRange(460, 490, 650, 500, 5, 42, 36, false);
  } else if (realmId === 'yeugioi') {
    // Thập Vạn Đại Sơn hùng vĩ
    addRange(180, 140, 440, 130, 7, 48, 42, true);
    addRange(630, 130, 890, 140, 7, 46, 40, false);
    addRange(220, 270, 380, 270, 4, 38, 32, false);
    addRange(660, 260, 840, 270, 5, 44, 38, false);
    addRange(420, 440, 640, 450, 6, 45, 38, false);
    addRange(780, 520, 940, 530, 4, 38, 30, false);
  } else {
    // Tây Thiên Phật Sơn
    addRange(180, 160, 420, 150, 6, 44, 38, true);
    addRange(640, 140, 890, 150, 7, 46, 40, true);
    addRange(210, 290, 370, 290, 4, 36, 30, false);
    addRange(470, 230, 640, 240, 5, 42, 36, true);
    addRange(770, 440, 930, 450, 4, 38, 32, false);
  }

  // Sắp xếp các đỉnh núi từ xa tới gần (py tăng dần) để núi trước che núi sau tự nhiên
  peaks.sort((a, b) => a.py - b.py);
  for (const pk of peaks) {
    drawPyramidPeak(ctx, pk.px, pk.py, pk.w, pk.h, pk.snow, cfg.mountainBase);
  }

  // 6. Tiêu đề phong cách Thần Giới Thủy Mặc ở đỉnh bản đồ
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 24px "Cinzel", "Noto Serif", "Songti SC", serif';
  ctx.fillStyle = 'rgba(45, 38, 32, 0.9)';
  ctx.letterSpacing = '8px';
  ctx.fillText(cfg.title, MAP_W / 2, 42);

  ctx.font = 'italic 500 13px "Cinzel", "Noto Serif", serif';
  ctx.fillStyle = 'rgba(75, 62, 50, 0.75)';
  ctx.letterSpacing = '2px';
  ctx.fillText(cfg.subTitle, MAP_W / 2, 64);
  ctx.restore();

  // 7. Vẽ các Địa Danh Thần Thánh (Badges + Titles theo chuẩn Hình 5)
  const coordsMap = PLACE_COORDS[realmId];

  const places = R.places;

  for (const place of places) {
    const pt = coordsMap[place.id];
    if (!pt) continue;
    const [px, py] = pt;
    const isSel = place.id === selectedId;
    const isHov = place.id === hoveredId;
    const glyphName = getLandmarkGlyph(realmId, place.id);
    const count = counts[place.id] || 0;

    // Vòng hào quang khi chọn hoặc hover
    if (isSel || isHov) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? 'rgba(215, 65, 50, 0.28)' : 'rgba(240, 185, 45, 0.28)';
      ctx.fill();
      ctx.strokeStyle = isSel ? '#c92a1f' : '#e5be49';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }

    // Vẽ Huy hiệu Icon Nghệ Thuật Riêng Biệt Cho Từng Địa Danh
    drawLandmarkDetailedIcon(ctx, realmId, place.id, px, py, isSel, isHov);

    // Thẻ tên địa danh hình chữ nhật bên dưới (Parchment Pill Banner chuẩn Hình 5)
    ctx.save();
    ctx.font = '600 12.5px "Cinzel", "Noto Serif", serif';
    const nameText = place.n;
    const textW = ctx.measureText(nameText).width;
    const pillW = textW + 18;
    const pillH = 22;
    const pillX = px - pillW / 2;
    const pillY = py + 20;

    // Bóng đổ nhẹ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(pillX + 1.5, pillY + 1.5, pillW, pillH);

    // Thân thẻ tên
    ctx.fillStyle = isSel ? '#8e231b' : 'rgba(252, 249, 242, 0.96)';
    ctx.strokeStyle = isSel ? '#d4af37' : 'rgba(52, 44, 36, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(pillX, pillY, pillW, pillH);
    ctx.fill();
    ctx.stroke();

    // Chữ tên địa danh
    ctx.fillStyle = isSel ? '#fffdf7' : '#2b231c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, px, pillY + pillH / 2 + 0.5);

    // Số lượng chức vụ nếu có
    if (count > 0) {
      const countX = pillX + pillW - 2;
      const countY = pillY + 2;
      ctx.beginPath();
      ctx.arc(countX, countY, 7, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? '#e5be49' : '#8e231b';
      ctx.fill();
      ctx.fillStyle = isSel ? '#201812' : '#ffffff';
      ctx.font = '700 9px sans-serif';
      ctx.fillText(String(count), countX, countY + 0.5);
    }

    ctx.restore();
  }

  ctx.restore();
}

/** Tạo phần tử Canvas bản đồ thần giới tích hợp tương tác mượt mà */
export function createCelestialMapElement(
  realmId: CelestialId,
  selectedId: string,
  onSelect: (placeId: string) => void,
  counts: Record<string, number>
): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.aspectRatio = `${MAP_W} / ${MAP_H}`;
  container.style.maxHeight = '520px';
  container.style.borderRadius = '6px';
  container.style.overflow = 'hidden';
  container.style.border = '1.5px solid rgba(75, 62, 50, 0.4)';
  container.style.boxShadow = 'inset 0 0 25px rgba(50, 40, 30, 0.18), 0 6px 18px rgba(0, 0, 0, 0.25)';
  container.style.marginBottom = '12px';

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.cursor = 'default';
  container.appendChild(canvas);

  let currentSelected = selectedId;
  let hoveredId: string | null = null;

  const redraw = () => {
    renderCelestialMap(canvas, realmId, currentSelected, hoveredId, counts);
  };

  const coordsMap = PLACE_COORDS[realmId];
  const R = CELESTIAL[realmId];

  /** Tìm địa danh tại tọa độ chuột */
  const findPlaceAt = (mx: number, my: number): CPlace | null => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const scaleX = MAP_W / rect.width;
    const scaleY = MAP_H / rect.height;
    const x = (mx - rect.left) * scaleX;
    const y = (my - rect.top) * scaleY;

    for (const p of R.places) {
      const pt = coordsMap[p.id];
      if (!pt) continue;
      const [px, py] = pt;
      const distBadge = Math.hypot(x - px, y - py);
      const inCardX = Math.abs(x - px) < 65;
      const inCardY = y >= py && y <= py + 48;
      if (distBadge <= 26 || (inCardX && inCardY)) {
        return p;
      }
    }
    return null;
  };

  canvas.addEventListener('mousemove', (e) => {
    const p = findPlaceAt(e.clientX, e.clientY);
    const newHover = p ? p.id : null;
    if (newHover !== hoveredId) {
      hoveredId = newHover;
      canvas.style.cursor = hoveredId ? 'pointer' : 'default';
      if (p) canvas.title = `${p.n}: ${p.d}`;
      else canvas.removeAttribute('title');
      redraw();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hoveredId !== null) {
      hoveredId = null;
      canvas.style.cursor = 'default';
      canvas.removeAttribute('title');
      redraw();
    }
  });

  canvas.addEventListener('click', (e) => {
    const p = findPlaceAt(e.clientX, e.clientY);
    if (p) {
      currentSelected = p.id;
      onSelect(p.id);
      redraw();
    }
  });

  setTimeout(redraw, 0);
  const ro = new ResizeObserver(() => redraw());
  ro.observe(container);

  return container;
}
