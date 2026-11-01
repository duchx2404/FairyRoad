// Các giới phía trên Thương Lan: Linh Giới, Tiên Giới, Thần Giới, Hồng Hoang, Hỗn Độn.
// Mỗi giới một bản đồ (vực, châu, vùng, địa điểm), tông môn, hoàng triều, yêu thú riêng.
// Thánh thú / thần thú: tổ chỉ ở Hỗn Độn (Tổ Long, Chân Phượng, Thủy Kỳ Lân…); giới thấp hơn chỉ còn huyết mạch thấp dần
// (Hồng Hoang: Long sinh cửu tử, Loan, Côn Bằng… — không có Chân Long hay thứ tương đương).
import { registerWorld, DIA_THE, MAP_W, MAP_H, mkDragons, mkGates, majorRivers, makeFormationLocations, linkBeastFamilies, RIVER_N0, RIVER_MAJOR_N0, type WorldPack, type Loc, type Sect, type Region, type Beast, type Empire, type Vuc, type LocType, type Chau } from './world';
import { WORLD_CAP, LAST_WORLD, type El } from './core';
import type { CelestialId } from './celestial';
import { TECHS } from './items';

const CX = MAP_W / 2, CY = MAP_H / 2;
type Outer = Exclude<Vuc, 'trung'>;
const VUCS: Vuc[] = ['trung', 'dong', 'tay', 'nam', 'bac'];
const OUTER: Outer[] = ['dong', 'tay', 'nam', 'bac'];
const VUC_EL: Record<Vuc, El[]> = { trung: ['quang', 'kim', 'tho'], dong: ['moc', 'thuy', 'phong'], tay: ['kim', 'tho', 'phong'], nam: ['hoa', 'moc', 'loi'], bac: ['bang', 'thuy', 'am'] };
const VUC_C: Record<Vuc, [string, string]> = { trung: ['#c8b98a', '#bfae7c'], dong: ['#9fb59a', '#a7bba0'], tay: ['#c9a77a', '#c2a070'], nam: ['#a3b386', '#9aab7c'], bac: ['#a9b6c4', '#b1bdca'] };

interface Theme {
  vuc: Record<Vuc, [string, string]>;
  seas: [string, string, string, string]; // đông, nam, tây, bắc
  /** trung: [lõi, bắc, nam, đông, tây]; vực ngoài: 3 châu đất liền (đảo không lập châu). */
  chau: { trung: [string, string, string, string, string] } & Record<Outer, [string, string, string]>;
  regions: Record<Vuc, [[string, string], [string, string]]>;
  /** [tên, vực, bậc, linh căn, mô tả, môn huấn, nghề, ma đạo?, chỉ nhận nữ?, trên đảo ngoài khơi vực này?] */
  sects: [string, Vuc, 1 | 2 | 3 | 4, El[], string, string, 'alch' | 'talis' | 'forge', boolean?, boolean?, boolean?][];
  towns: [string, Vuc, string, ('auction' | 'forge')?][];
  villages: [string, Vuc, string][];
  markets: [string, Vuc, string][];
  /** [tên, vực, độ hiểm 0..1, mô tả] */
  wilds: [string, Vuc, number, string][];
  realms: [string, Vuc, number, string][];
  isles: [string, Outer, 'wild' | 'market', number, string][];
  empires: [string, string, 1 | 2 | 3, string, string][];
  /** yêu thú thường: [tên, hệ, cận dưới, cận trên] (tỉ lệ theo trần cảnh giới của giới) */
  beasts: [string, El, number, number][];
  /** dòng huyết mạch: [tên tổ, hệ, cảnh giới, nơi ở (tên hiểm địa), lời chép, tên hậu duệ (thuần, đậm, loãng)?] */
  lineage: [string, El, number, string, string, [string, string, string]?][];
  scale?: { trung?: number; outer?: number };
  /** Ghim vị trí theo truyền thuyết: tên địa điểm → [vực, nx, ny], toạ độ chuẩn hoá trong elip lục địa của vực
   *  (0,0 là tâm; nx dương về đông, ny dương về nam; |n| > 1 là ngoài khơi). Địa điểm có ghim không bị xếp lại tự động. */
  pins?: Record<string, [Vuc, number, number]>;
  /** false: không sinh thêm địa điểm / tông môn tên ngẫu nhiên (giới dùng địa danh truyền thuyết có thật). */
  fill?: boolean;
  /** Tên sông đặt tay, theo thứ tự vực trung, đông, tây, nam, bắc (số sông mỗi vực = RIVER_N, sông lớn đứng đầu mỗi vực). */
  rivers?: string[];
  /** Tông môn giữ cổng thần giới: [tên tông, chức người đứng đầu?, mô tả cổng riêng của giới?]. Không có thì tự chọn tông mạnh nhất theo vực. */
  gates?: Partial<Record<CelestialId, [string, string?, string?]>>;
  /** Số sông / sông lớn mỗi vực (mặc định như các giới khác). */
  riverN?: Record<Vuc, number>;
  riverMajorN?: Record<Vuc, number>;
  /** Dòng chảy đặt tay cho sông nhỏ: tên sông → điểm [vực, nx, ny]. */
  riverPaths?: Record<string, [Vuc, number, number][]>;
  /** Long Vương các sông lớn (thay danh sách chung, tránh trùng nhân vật có thật). */
  riverKings?: string[];
  /** Vị trí Hải Long Cung: vực biển → [vực, nx, ny]. */
  seaPins?: Partial<Record<Outer, [Vuc, number, number]>>;
  /** Chủ quản chỉ định: tên địa điểm → tên vương triều (ải nằm trong châu khác) hoặc tên tông môn (trực thuộc tông). */
  owners?: Record<string, string>;
  /** Vùng chỉ định cho địa danh ghim (chỉ số vùng của vực), khi nguồn ghi rõ thuộc chương nào (ví dụ Hải Ngoại hay Đại Hoang). */
  regAt?: Record<string, 0 | 1>;
  /** Âm tiết đặt tên cho các thế lực / địa điểm sinh thêm (giới càng cao càng nhiều). */
  syll: string[];
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '');
function pickTech(els: El[], tier: number, evil = false): string {
  const want = [0, 2, 3, 4, 5][tier];
  const ts = Object.values(TECHS).filter((t) => !t.blood && !!t.evil === evil && t.tier <= want);
  const fit = ts.filter((t) => !t.el.length || t.el.some((e) => els.includes(e)));
  const pool = (fit.length ? fit : ts).sort((a, b) => b.tier - a.tier || (b.pq ?? 0) - (a.pq ?? 0));
  return (pool[0] || Object.values(TECHS)[0]).id;
}

function build(w: number, T: Theme): WorldPack {
  const cap = WORLD_CAP[w];
  const P = `w${w}_`;
  const used = new Set<string>();
  const id = (n: string) => { let k = P + slug(n); while (used.has(k)) k += 'x'; used.add(k); return k; };
  // ---- vùng ----
  const regions: Record<string, Region> = {};
  const regOf: Record<Vuc, string[]> = { trung: [], dong: [], tay: [], nam: [], bac: [] };
  for (const v of VUCS) T.regions[v].forEach(([n, d], i) => {
    const rid = `${P}${v}${i}`;
    regions[rid] = { id: rid, vuc: v, n, el: VUC_EL[v], d, c: VUC_C[v][i] };
    regOf[v].push(rid);
  });
  const seaReg: Record<Outer, string> = {} as Record<Outer, string>;
  OUTER.forEach((v, i) => {
    const rid = `${P}${v}hai`;
    const sea = T.seas[[0, 2, 1, 3][i]];
    regions[rid] = { id: rid, vuc: v, n: `Quần đảo ${sea.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}`, el: VUC_EL[v], d: 'Những hòn đảo rải rác ngoài khơi.', c: VUC_C[v][1] };
    seaReg[v] = rid;
  });
  // ---- châu ----
  const chau: Record<string, Chau> = {};
  const MID_D = ['Lõi của trung vực, linh khí đặc nhất giới.', 'Phía bắc trung vực.', 'Phía nam trung vực.', 'Phía đông trung vực.', 'Phía tây trung vực.'];
  const mid = T.chau.trung.map((n, i) => { const cid = `${P}c_t${i}`; chau[cid] = { id: cid, n, vuc: 'trung', d: MID_D[i] }; return cid; }) as WorldPack['chauMid'];
  const chauLand = {} as WorldPack['chauLand'];
  for (const v of OUTER) {
    const ids = T.chau[v].map((n, i) => { const cid = `${P}c_${v}${i}`; chau[cid] = { id: cid, n, vuc: v, d: `Một phần ba ${T.vuc[v][0]}.` }; return cid; });
    chauLand[v] = [ids[0], ids[1], ids[2]];
  }
  // ---- địa điểm ----
  const locs: Loc[] = [];
  const reg = (v: Vuc, i: number) => regOf[v][i % regOf[v].length];
  const qiMul = 1 + w * 0.08;
  const byName: Record<string, Loc> = {};
  const push = (l: Loc) => { locs.push(l); byName[l.n] = l; return l; };
  T.towns.forEach(([n, v, d, f], i) => push({ id: id(n), n, type: 'town', reg: reg(v, i), x: 0, y: 0, qi: +(0.95 * qiMul).toFixed(2), d, ...(f === 'auction' ? { auction: true } : f === 'forge' ? { forge: true } : {}) }));
  T.villages.forEach(([n, v, d], i) => push({ id: id(n), n, type: 'village', reg: reg(v, i + 1), x: 0, y: 0, qi: +(0.85 * qiMul).toFixed(2), d }));
  T.markets.forEach(([n, v, d], i) => push({ id: id(n), n, type: 'market', reg: reg(v, i), x: 0, y: 0, qi: +(1.05 * qiMul).toFixed(2), d }));
  const lvOf = (f: number) => Math.max(1, Math.min(cap - 1, 1 + Math.round(f * (cap - 2))));
  T.wilds.forEach(([n, v, f, d], i) => push({ id: id(n), n, type: 'wild', reg: reg(v, i), x: 0, y: 0, qi: +((1.15 + f * 0.9) * qiMul).toFixed(2), lv: lvOf(f), d }));
  T.realms.forEach(([n, v, f, d], i) => { const lv = lvOf(f); push({ id: id(n), n, type: 'realm', reg: reg(v, i + 1), x: 0, y: 0, qi: +((1.8 + f * 0.6) * qiMul).toFixed(2), lv, minRealm: Math.max(2, lv - 2), open: [40 + lv * 5, 3], d }); });
  T.isles.forEach(([n, v, ty, f, d]) => push({ id: id(n), n, type: ty as LocType, reg: seaReg[v], x: 0, y: 0, island: true, qi: +((ty === 'wild' ? 1.3 + f * 0.8 : 1.1) * qiMul).toFixed(2), ...(ty === 'wild' ? { lv: lvOf(f) } : {}), d }));
  // ---- tông môn ----
  const sects: Record<string, Sect> = {};
  T.sects.forEach(([n, v, tier, el, d, motto, craft, evil, fem, isle], i) => {
    const sid = id(n);
    if (isle && v === 'trung') throw new Error(`Tông "${n}": đảo phải thuộc một hải vực ngoài (đông, tây, nam, bắc)`);
    push({ id: sid, n, type: 'sect', reg: isle ? seaReg[v as Outer] : reg(v, i), x: 0, y: 0, qi: +((1.2 + tier * 0.25) * qiMul).toFixed(2), sect: sid, d, ...(isle ? { island: true } : {}) });
    sects[sid] = { id: sid, n, loc: sid, tier, el, minQ: [0, 1, 2, 3, 5][tier], tech: pickTech(el, tier, !!evil), craft, ...(evil ? { evil: true } : {}), ...(fem ? { fem: true } : {}), d, motto };
  });
  // ---- hoàng triều ----
  const empires: Record<string, Empire> = {};
  for (const [n, cap0, tier, ruler, d] of T.empires) {
    const c = byName[cap0];
    if (!c) continue;
    const eid = id(n);
    empires[eid] = { id: eid, n, capital: c.id, tier, ruler, patron: null, d };
  }
  // ---- giới càng cao càng rộng, càng nhiều thế lực: sinh thêm địa điểm và tông môn ----
  if (T.fill !== false) {
    let seed = w * 7919 + 17;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = <X,>(a: X[]) => a[Math.floor(rnd() * a.length)];
    const names = new Set(locs.map((l) => l.n));
    const uname = (mk: () => string) => { for (let k = 0; k < 40; k++) { const n = mk(); if (!names.has(n)) { names.add(n); return n; } } return ''; };
    const SECT_SUF = ['Tông', 'Môn', 'Các', 'Cung', 'Phái', 'Cốc', 'Điện', 'Quán', 'Sơn Trang', 'Lâu', 'Giáo', 'Đạo Viện'];
    const WILD_SUF = ['Sơn', 'Cốc', 'Lâm', 'Uyên', 'Nguyên', 'Hồ', 'Lĩnh', 'Động', 'Hiệp', 'Nhai', 'Trạch', 'Phong'];
    const nLoc = 20 * w, nSect = 5 * w;
    for (let i = 0; i < nLoc; i++) {
      const v = VUCS[i % 5];
      const k = rnd();
      const pre = pick(T.syll);
      if (k < 0.18) { const n = uname(() => `${pick(T.syll)} ${pick(['Thành', 'Thành', 'Trấn'])}`); if (n) push({ id: id(n), n, type: 'town', reg: reg(v, i), x: 0, y: 0, qi: +(0.95 * qiMul).toFixed(2), d: `${n.endsWith('Trấn') ? 'Trấn' : 'Thành'} của ${T.vuc[v][0]}, tu sĩ qua lại tấp nập.` }); }
      else if (k < 0.34) { const n = uname(() => `${pick(T.syll)} Thôn`); if (n) push({ id: id(n), n, type: 'village', reg: reg(v, i + 1), x: 0, y: 0, qi: +(0.85 * qiMul).toFixed(2), d: 'Thôn nhỏ, phàm nhân ở đây cũng có linh căn nhiều hơn hạ giới.' }); }
      else if (k < 0.42) { const n = uname(() => `${pick(T.syll)} phường thị`); if (n) push({ id: id(n), n, type: 'market', reg: reg(v, i), x: 0, y: 0, qi: +(1.05 * qiMul).toFixed(2), d: 'Phường thị của tán tu.' }); }
      else if (k < 0.92) { const f = rnd(); const n = uname(() => `${pick(T.syll)} ${pick(WILD_SUF)}`); if (n) push({ id: id(n), n, type: 'wild', reg: reg(v, i), x: 0, y: 0, qi: +((1.15 + f * 0.9) * qiMul).toFixed(2), lv: lvOf(f), d: f > 0.7 ? 'Hiểm địa, yêu thú cổ xưa ẩn mình.' : f > 0.4 ? 'Núi rừng hoang dã, yêu thú thành bầy.' : 'Nơi hoang dã, yêu thú còn hiền.' }); }
      else { const f = 0.5 + rnd() * 0.45; const lv = lvOf(f); const n = uname(() => `${pick(T.syll)} Bí Cảnh`); if (n) push({ id: id(n), n, type: 'realm', reg: reg(v, i + 1), x: 0, y: 0, qi: +((1.8 + f * 0.6) * qiMul).toFixed(2), lv, minRealm: Math.max(2, lv - 2), open: [40 + lv * 5, 3], d: 'Bí cảnh do một vị đại năng để lại.' }); }
      void pre;
    }
    for (let i = 0; i < nSect; i++) {
      const v = VUCS[(i + 1) % 5];
      const x = rnd();
      const tier = (x < 0.42 ? 1 : x < 0.77 ? 2 : x < 0.95 ? 3 : 4) as 1 | 2 | 3 | 4;
      const evil = rnd() < 0.18;
      const els = VUC_EL[v].filter(() => rnd() < 0.7);
      const el = els.length ? els : [VUC_EL[v][0]];
      const n = uname(() => `${pick(T.syll)} ${evil ? pick(['Ma Tông', 'Ma Điện', 'Huyết Giáo', 'Quỷ Môn']) : pick(SECT_SUF)}`);
      if (!n) continue;
      const sid = id(n);
      push({ id: sid, n, type: 'sect', reg: reg(v, i), x: 0, y: 0, qi: +((1.2 + tier * 0.25) * qiMul).toFixed(2), sect: sid, d: `${['', 'Hạ tông', 'Trung tông', 'Thượng tông', 'Thánh địa'][tier]} ở ${T.vuc[v][0]}.` });
      sects[sid] = { id: sid, n, loc: sid, tier, el, minQ: [0, 1, 2, 3, 5][tier], tech: pickTech(el, tier, evil), craft: pick(['alch', 'talis', 'forge'] as const), ...(evil ? { evil: true } : {}), d: evil ? 'Ma đạo, hành sự không chừa thủ đoạn.' : 'Tông môn truyền thừa nhiều đời.', motto: pick(['Đạo vô tận.', 'Tu tâm trước tu thân.', 'Mạnh được yếu thua.', 'Thuận thiên nghịch mệnh.', 'Một lòng cầu đạo.']) };
    }
  }
  // ---- yêu thú ----
  const beasts: Beast[] = [];
  const lr = (f: number) => Math.max(1, Math.min(cap, 1 + Math.round(f * (cap - 1))));
  for (const [n, el, a, b] of T.beasts) beasts.push({ n, el, lv: [lr(a), lr(b)], mat: b > 0.6 ? 'yeudan' : 'dayeu' });
  for (const [n, el, r, home, d, names] of T.lineage) {
    const hl = byName[home];
    if (!hl) continue;
    const nm = names || [`${n} · thuần huyết`, `${n} · huyết mạch đậm`, `${n} · huyết mạch loãng`];
    beasts.push({ n, el, lv: [r, r], home: hl.id, shj: d, mat: 'cotuhuyet' });
    beasts.push({ n: nm[0], el, lv: [r - 1, r - 1], reg: [hl.reg], anc: n, blood: 0, mat: 'tuduehuyet', codexHidden: true });
    beasts.push({ n: nm[1], el, lv: [Math.max(1, r - 3), r - 2], reg: [hl.reg], anc: n, blood: 1, mat: 'tuduehuyet', codexHidden: true });
    beasts.push({ n: nm[2], el, lv: [Math.max(1, r - 8), Math.max(1, r - 6)], reg: [hl.reg], anc: n, blood: 2, mat: 'yeudan', codexHidden: true });
    hl.lv = Math.max(hl.lv ?? 0, Math.min(cap - 1, r - 1));
    hl.qi = Math.max(hl.qi, +((1.6 + r * 0.04) * qiMul).toFixed(2));
  }
  // nơi mang thiên địa chi thế (trúc cơ ở đây thành Cực phẩm đạo cơ)
  locs.filter((l) => l.type === 'wild').sort((a, b) => (b.lv ?? 0) - (a.lv ?? 0)).slice(0, 4).forEach((l) => (DIA_THE[l.id] = `thế của ${l.n}`));
  // ---- lục địa: mỗi giới một hình dáng ----
  const tS = T.scale?.trung ?? 1, oS = T.scale?.outer ?? 1;
  const j = (k: number) => 1 + (((w * 37 + k * 11) % 17) - 8) / 100;
  const landmass: WorldPack['landmass'] = {
    trung: { x: CX, y: CY, rx: 1500 * tS * j(1), ry: 1060 * tS * j(2) },
    dong: { x: CX + 3000 * j(3), y: CY + 120 * (w % 3 - 1), rx: 1000 * oS * j(4), ry: 1780 * oS * j(5) },
    tay: { x: CX - 3000 * j(6), y: CY - 120 * (w % 3 - 1), rx: 1000 * oS * j(7), ry: 1780 * oS * j(8) },
    nam: { x: CX + 150 * (w % 2 ? 1 : -1), y: CY + 2300 * j(9), rx: 2250 * oS * j(10), ry: 880 * oS * j(11) },
    bac: { x: CX - 150 * (w % 2 ? 1 : -1), y: CY - 2300 * j(12), rx: 2250 * oS * j(13), ry: 880 * oS * j(14) },
  };
  // ghim địa danh truyền thuyết vào đúng phương vị
  {
    const pinned: { l: Loc; v: Vuc; x: number; y: number }[] = [];
    for (const [name, [v, nx, ny]] of Object.entries(T.pins ?? {})) {
      const l = byName[name];
      if (!l) throw new Error(`Ghim bản đồ: không có địa điểm "${name}" ở giới ${w}`);
      const m = landmass[v];
      pinned.push({ l, v, x: m.x + nx * m.rx, y: m.y + ny * m.ry });
    }
    // giãn nhẹ các điểm ghim quá gần nhau (giữ phương vị, chỉ xê dịch vài trăm bước); điểm trên đất liền không bị đẩy ra biển
    const MIN = 280;
    for (let it = 0; it < 200; it++) {
      let moved = false;
      for (let i = 0; i < pinned.length; i++) for (let k = i + 1; k < pinned.length; k++) {
        const a = pinned[i], b = pinned[k];
        if (!!a.l.island !== !!b.l.island) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        if (d >= MIN) continue;
        const p = (MIN - d) / 2 + 1;
        a.x -= (dx / d) * p; a.y -= (dy / d) * p; b.x += (dx / d) * p; b.y += (dy / d) * p; moved = true;
      }
      for (const q of pinned) {
        if (q.l.island) continue;
        const m = landmass[q.v];
        const nx = (q.x - m.x) / m.rx, ny = (q.y - m.y) / m.ry, r = Math.hypot(nx, ny);
        if (r > 0.86) { q.x = m.x + (nx / r) * 0.86 * m.rx; q.y = m.y + (ny / r) * 0.86 * m.ry; }
      }
      if (!moved) break;
    }
    for (const q of pinned) q.l.xy = [Math.round(q.x), Math.round(q.y)];
    // vùng theo vị trí: Trung Thổ — thành, thôn, chợ ở vùng 0, núi non động phủ ở vùng 1;
    // khối ngoài — nửa sát biển phía Trung Thổ là vùng 0 (Hải Ngoại), nửa xa là vùng 1 (Đại Hoang)
    for (const q of pinned) {
      if (q.l.island || q.l.river) continue;
      const m = landmass[q.v];
      const nx = (q.x - m.x) / m.rx, ny = (q.y - m.y) / m.ry;
      const out = q.v === 'dong' ? nx : q.v === 'tay' ? -nx : q.v === 'nam' ? ny : q.v === 'bac' ? -ny : 0;
      const k = T.regAt?.[q.l.n] ?? (q.v === 'trung' ? (['town', 'village', 'market'].includes(q.l.type) ? 0 : 1) : out >= 0.25 ? 1 : 0);
      q.l.reg = regOf[q.v][k % regOf[q.v].length];
    }
    for (const q of pinned) q.l.pin = true;
    // dòng huyết mạch sinh theo vùng của nơi ở: cập nhật theo vùng mới của nơi ở
    const locById = new Map(locs.map((l) => [l.id, l]));
    const homeOf = new Map(beasts.filter((b) => b.home).map((b) => [b.n, locById.get(b.home!)]));
    for (const b of beasts) { const hl = b.anc ? homeOf.get(b.anc) : undefined; if (hl && b.reg) b.reg = [hl.reg]; }
  }
  // chủ quản chỉ định
  for (const [name, owner] of Object.entries(T.owners ?? {})) {
    const l = byName[name];
    if (!l) throw new Error(`Chủ quản: không có địa điểm "${name}" ở giới ${w}`);
    const emp = Object.values(empires).find((e) => e.n === owner);
    const sc = Object.values(sects).find((x) => x.n === owner);
    if (emp) l.ownerEmp = emp.id;
    else if (sc) l.patronSect = sc.id;
    else throw new Error(`Chủ quản: không có vương triều / tông môn "${owner}" ở giới ${w}`);
  }
  locs.push(...makeFormationLocations(P, regions, landmass, {
    trung: regOf.trung[0], dong: regOf.dong[0], tay: regOf.tay[0], nam: regOf.nam[0], bac: regOf.bac[0],
  }));
  // thế lực / di tích dưới đáy biển: nằm giữa biển như đảo nhưng không có đảo
  for (const l of locs) if ((l.type === 'sect' || l.type === 'realm') && /dưới đáy|chìm dưới nước|đáy biển/i.test(l.d || '')) { l.island = true; l.sea = true; }
  // sông: Trung và Đông nhiều, các vực khác ít hơn; long cung dưới sông lớn, 4 Hải Long Cung ngoài biển
  const RN = T.riverN ?? RIVER_N0, RMN = T.riverMajorN ?? RIVER_MAJOR_N0;
  const nRiver = Object.values(RN).reduce((s2, n) => s2 + n, 0);
  const rivers: string[] = [];
  const SUF = ['Giang', 'Hà', 'Thủy', 'Khê'];
  const majorIdx = new Set<number>(); { let i = 0; for (const v of ['trung', 'dong', 'tay', 'nam', 'bac'] as const) { for (let j = 0; j < RN[v]; j++, i++) if (j < RMN[v]) majorIdx.add(i); } } // sông lớn chỉ mang đuôi Giang / Hà
  if (T.rivers) {
    if (T.rivers.length !== nRiver || new Set(T.rivers).size !== nRiver) throw new Error(`Giới ${w}: cần đúng ${nRiver} tên sông khác nhau`);
    rivers.push(...T.rivers);
  }
  for (let i = 0; rivers.length < nRiver && i < nRiver * 6; i++) {
    const base = T.syll[(i * 7 + w * 3) % T.syll.length];
    const suf = majorIdx.has(rivers.length) ? (rivers.length % 2 ? 'Hà' : 'Giang') : SUF[i % SUF.length];
    const n = /(Hà|Giang|Thủy|Xuyên|Khê)$/.test(base) ? base : `${base} ${suf}`;
    if (!rivers.includes(n)) rivers.push(n);
  }
  const seaXY: Partial<Record<Outer, [number, number]>> = {};
  for (const [sv, [v, nx, ny]] of Object.entries(T.seaPins ?? {}) as [Outer, [Vuc, number, number]][]) seaXY[sv] = [Math.round(landmass[v].x + nx * landmass[v].rx), Math.round(landmass[v].y + ny * landmass[v].ry)];
  const dr = mkDragons({ prefix: P, seas: T.seas, rivers: majorRivers(rivers, RN, RMN), seaXY, riverKings: T.riverKings, majorN: RMN, seaReg, landReg: { trung: regOf.trung[0], dong: regOf.dong[0], tay: regOf.tay[0], nam: regOf.nam[0], bac: regOf.bac[0] }, seaTech: pickTech(['thuy', 'loi'], 3), riverTech: pickTech(['thuy'], 2), landmass });
  locs.push(...dr.locs);
  Object.assign(sects, dr.sects);
  if (w !== LAST_WORLD) {
    // Bốn thần giới chỉ có cổng tại các giới thấp; Hỗn Độn không có Thiên Đình, Yêu Giới, Linh Sơn hay Địa Phủ.
    const vucOfL = (l: Loc) => regions[l.reg]?.vuc;
    const sectLocs = locs.filter((l) => l.type === 'sect' && sects[l.sect!] && !l.island && !l.river);
    const best = (f: (l: Loc) => boolean) => sectLocs.filter(f).sort((x, y) => sects[y.sect!].tier - sects[x.sect!].tier)[0];
    const named = (k: CelestialId) => {
      const g = T.gates?.[k];
      if (!g) return undefined;
      const hl = sectLocs.find((l) => l.n === g[0]);
      if (!hl) throw new Error(`Giới ${w}: cổng ${k} cần tông "${g[0]}" trên đất liền`);
      return hl;
    };
    const hosts = {
      thiendinh: named('thiendinh') ?? best((l) => vucOfL(l) === 'trung'),
      yeugioi: named('yeugioi') ?? best((l) => vucOfL(l) === 'nam'),
      linhson: named('linhson') ?? best((l) => vucOfL(l) === 'tay' && !sects[l.sect!].evil),
      diaphu: named('diaphu') ?? (best((l) => !!sects[l.sect!].evil) || best((l) => vucOfL(l) === 'dong')),
    };
    const LEADER = { thiendinh: 'Vân Tiêu Tiên Tử', yeugioi: 'Yêu Hoàng', linhson: 'Phương Trượng (Phật Đà)', diaphu: 'Minh Chủ' } as const;
    for (const k of Object.keys(hosts) as (keyof typeof hosts)[]) {
      const hl = hosts[k];
      if (!hl) continue;
      const leader = T.gates?.[k] ? T.gates[k]![1] : LEADER[k]; // tông chỉ định giữ người đứng đầu theo truyền thuyết, không gán chức chung
      if (leader) sects[hl.sect!].leader = leader;
      if (sects[hl.sect!].tier < 4) { sects[hl.sect!].tier = 4; sects[hl.sect!].minQ = 5; } // thế lực giữ cổng luôn là bậc cao nhất
    }
    const gates = mkGates({ prefix: P, hosts });
    for (const g of gates) { const d = T.gates?.[g.gate!]?.[2]; if (d) g.d = d; } // mô tả cổng theo lore của giới này
    locs.push(...gates);
  }
  linkBeastFamilies(beasts);
  return {
    vuc: Object.fromEntries(VUCS.map((v) => [v, { n: T.vuc[v][0], d: T.vuc[v][1] }])) as WorldPack['vuc'],
    landmass, regions, chau, chauMid: mid, chauLand, seas: T.seas, rivers, locs, sects, empires, beasts, geo: `w${w}`,
    ...(T.riverN ? { riverN: T.riverN, riverMajorN: RMN } : {}), ...(T.riverPaths ? { riverPaths: T.riverPaths } : {}),
  };
}

// =====================================================================================
const LINH: Theme = {
  syll: ['Thanh Vân', 'Linh Tuyền', 'Bích Ngọc', 'Tử Trúc', 'Hàn Sương', 'Lạc Nhật', 'Kim Phong', 'Ngân Hà', 'Phi Vân', 'Lục Liễu', 'Xích Hà', 'Huyền Thạch', 'Vọng Nguyệt', 'Thiên Trì', 'Mộc Linh', 'Sương Hoa', 'Lôi Minh', 'Tịch Dương', 'Bạch Lộ', 'Tàng Phong', 'Ngọc Lan', 'Thanh Khê', 'Hỏa Vân', 'Băng Tâm', 'Lưu Quang', 'Thúy Bình', 'Kim Thiềm', 'Vân Mộng', 'Hồng Diệp', 'Linh Hư'],
  vuc: {
    trung: ['Linh Khư Trung Vực', 'Lõi Linh Giới, linh mạch tụ về như trăm sông đổ biển.'],
    dong: ['Thanh Mộc Vực', 'Rừng linh mộc vạn năm, cây cao chạm mây.'],
    tay: ['Canh Kim Vực', 'Núi quặng và biển kim sa, kiếm tu nhiều như cát.'],
    nam: ['Ly Hỏa Vực', 'Đất lửa: núi lửa, hồ dung nham và mưa tro.'],
    bac: ['Huyền Thủy Vực', 'Băng hải và tuyết nguyên, hàn khí thấu xương.'],
  },
  seas: ['THANH LINH HẢI', 'XÍCH LINH HẢI', 'BẠCH LINH HẢI', 'HUYỀN LINH HẢI'],
  chau: {
    trung: ['Linh Khư Châu', 'Thượng Linh Châu', 'Hạ Linh Châu', 'Đông Linh Châu', 'Tây Linh Châu'],
    dong: ['Bích Lạc Châu', 'Mộc Hoa Châu', 'Thanh Khê Châu'],
    tay: ['Kim Sa Châu', 'Thiết Lĩnh Châu', 'Canh Phong Châu'],
    nam: ['Ly Viêm Châu', 'Xích Diễm Châu', 'Dung Hồ Châu'],
    bac: ['Hàn Uyên Châu', 'Huyền Băng Châu', 'Tuyết Vực Châu'],
  },
  regions: {
    trung: [['Linh Khư Bình Nguyên', 'Đồng bằng phủ cỏ linh, thành trì của tu sĩ.'], ['Vạn Linh Sơn Mạch', 'Dãy núi nơi linh mạch chính chạy qua.']],
    dong: [['Thanh Mộc Lâm', 'Rừng linh mộc, đi ba ngày không thấy mặt trời.'], ['Bích Thủy Trạch', 'Đầm nước biếc, giao xà ẩn dưới sen.']],
    tay: [['Kim Sa Mạc', 'Biển cát vàng, mỗi hạt cát là một mảnh kim tinh.'], ['Thiết Kiếm Lĩnh', 'Núi đá đen sắc như lưỡi kiếm.']],
    nam: [['Ly Hỏa Nguyên', 'Đồng lửa, cỏ cũng cháy âm ỉ.'], ['Dung Nham Hồ', 'Hồ dung nham sôi sục, hỏa linh sinh sôi.']],
    bac: [['Huyền Băng Nguyên', 'Băng nguyên trắng xóa không bờ.'], ['Hàn Uyên Cốc', 'Hẻm vực băng, gió rít như quỷ khóc.']],
  },
  sects: [
    ['Thiên Linh Thánh Địa', 'trung', 4, ['quang', 'kim', 'thuy', 'tho'], 'Thánh địa đứng đầu Linh Giới, tọa trên linh mạch tổ.', 'Linh khởi vạn vật.', 'alch'],
    ['Vạn Kiếm Thánh Tông', 'tay', 4, ['kim', 'phong', 'loi'], 'Mỗi đệ tử đều có một thanh bản mệnh kiếm sinh từ kim mạch.', 'Một kiếm phá vạn pháp.', 'forge'],
    ['Thái Âm Thánh Cung', 'bac', 4, ['bang', 'thuy', 'am'], 'Cung điện trên băng hải, chỉ nhận nữ đệ tử.', 'Nguyệt lạnh soi tâm.', 'talis', false, true],
    ['Thanh Đế Môn', 'dong', 3, ['moc', 'thuy'], 'Tông môn trong lõi rừng linh mộc, giỏi y đạo và mộc pháp.', 'Sinh sinh bất tức.', 'alch'],
    ['Ly Hỏa Tông', 'nam', 3, ['hoa', 'tho'], 'Đạo tràng dựng trên miệng núi lửa, luyện khí số một Linh Giới.', 'Lửa thử vàng.', 'forge'],
    ['Huyền Minh Ma Tông', 'bac', 3, ['am', 'bang'], 'Ma tông dưới đáy hàn uyên, luyện hồn phách người chết đuối.', 'Âm tận dương sinh.', 'talis', true],
    ['Bích Lạc Cốc', 'dong', 2, ['moc', 'phong'], 'Thung lũng hoa đào, đệ tử phần đông là y tu.', 'Hoa nở có lúc.', 'alch'],
    ['Kim Sa Môn', 'tay', 2, ['kim', 'tho'], 'Tông môn đãi kim sa, giàu nhất Canh Kim Vực.', 'Cát chảy thành vàng.', 'forge'],
    ['Xích Diễm Các', 'nam', 2, ['hoa'], 'Lầu các bằng đá đỏ, phù sư hỏa hệ tụ hội.', 'Một đốm lửa đốt cả đồng.', 'talis'],
    ['Phong Lôi Tông', 'trung', 2, ['phong', 'loi'], 'Tông môn trên đỉnh núi trọc, ngày ngày dẫn lôi luyện thể.', 'Gió nổi sấm vang.', 'forge'],
    ['Tuyết Lang Bảo', 'bac', 1, ['bang'], 'Thành bảo của người nuôi tuyết lang.', 'Bầy sói không bỏ ai.', 'forge'],
    ['Thanh Trúc Quán', 'dong', 1, ['moc'], 'Đạo quán trong rừng trúc, cửa luôn mở.', 'Trúc thẳng lòng rỗng.', 'alch'],
    ['Sa Đà Bang', 'tay', 1, ['tho', 'kim'], 'Bang hội hộ tống thương đội qua biển cát.', 'Có tiền là có đường.', 'talis'],
    ['Hỏa Nha Trại', 'nam', 1, ['hoa', 'am'], 'Trại cướp tu sĩ trong đồng lửa.', 'Quạ lửa không chừa xác.', 'talis', true],
  ],
  towns: [
    ['Linh Khư Thành', 'trung', 'Thành lớn nhất Linh Giới, xây quanh một mắt linh tuyền.', 'auction'],
    ['Vạn Linh Thành', 'trung', 'Kinh đô Đại Linh Hoàng Triều, tường thành khắc tụ linh trận.'],
    ['Thanh Mộc Thành', 'dong', 'Thành dựng trên những thân cây khổng lồ, đi lại bằng cầu treo.'],
    ['Kim Sa Thành', 'tay', 'Thành giữa biển cát, lò rèn đỏ lửa ngày đêm.', 'forge'],
    ['Ly Hỏa Thành', 'nam', 'Thành đá đen bên hồ dung nham.'],
    ['Hàn Uyên Thành', 'bac', 'Thành băng bên miệng vực, người dân mặc áo da tuyết lang.'],
    ['Bích Thủy Trấn', 'dong', 'Trấn nhỏ trên mặt đầm, nhà nào cũng có thuyền.'],
    ['Thiết Kiếm Trấn', 'tay', 'Trấn của kiếm khách lang bạt.'],
    ['Tuyết Phong Trấn', 'bac', 'Trấn giữa hai ngọn núi tuyết, quanh năm bão.'],
  ],
  villages: [
    ['Linh Điền Thôn', 'trung', 'Thôn trồng linh cốc, phàm nhân ở đây cũng sống trăm tuổi.'],
    ['Mộc Hương Thôn', 'dong', 'Thôn tiều phu đốn linh mộc.'],
    ['Sa Tuyền Thôn', 'tay', 'Thôn quanh giếng nước ngọt giữa sa mạc.'],
    ['Hỏa Thạch Thôn', 'nam', 'Thôn đào hỏa thạch, ai cũng có tay chai và mắt đỏ.'],
    ['Băng Hà Thôn', 'bac', 'Thôn đánh cá dưới lớp băng.'],
  ],
  markets: [
    ['Vạn Bảo Lâu', 'trung', 'Phường thị chín tầng, tầng càng cao hàng càng quý.'],
    ['Thanh Mộc phường thị', 'dong', 'Chợ linh thảo và gỗ quý.'],
    ['Kim Sa phường thị', 'tay', 'Chợ quặng và pháp khí.'],
    ['Ly Hỏa phường thị', 'nam', 'Chợ hỏa tinh và đan dược.'],
  ],
  wilds: [
    ['Thanh Phong Cốc', 'trung', 0.1, 'Thung lũng gió mát, yêu thú hiền lành.'],
    ['Vạn Thú Sơn', 'trung', 0.55, 'Núi của vạn thú, nơi yêu vương xưng bá.'],
    ['Linh Mạch Tổ Nguyên', 'trung', 0.9, 'Gốc của mọi linh mạch Linh Giới, yêu thú cổ xưa canh giữ.'],
    ['Bích Ba Hồ', 'dong', 0.15, 'Hồ biếc, cá linh nhảy lên ánh nắng.'],
    ['Vạn Mộc Cổ Lâm', 'dong', 0.35, 'Rừng cổ, cây biết đi.'],
    ['Lôi Giao Đàm', 'dong', 0.75, 'Đầm sét, giao long lôi thuộc làm tổ.'],
    ['Kim Sa Hải', 'tay', 0.4, 'Biển cát chảy, nuốt người không dấu vết.'],
    ['Toái Kiếm Cốc', 'tay', 0.7, 'Thung lũng đầy kiếm gãy, kiếm ý còn chém người.'],
    ['Hỏa Linh Sơn', 'nam', 0.45, 'Núi lửa nhỏ, hỏa linh lượn quanh.'],
    ['Phần Thiên Hỏa Uyên', 'nam', 0.85, 'Vực lửa không đáy, lửa bốc tận trời.'],
    ['Tuyết Lang Nguyên', 'bac', 0.25, 'Đồng tuyết của bầy sói trắng.'],
    ['Huyền Băng Vực Sâu', 'bac', 0.8, 'Vực băng đen, hàn khí đóng băng cả thần thức.'],
  ],
  realms: [
    ['Cổ Tiên Động Phủ', 'trung', 0.85, 'Động phủ của một tiên nhân thời thượng cổ, cấm chế còn nguyên.'],
    ['Kiếm Trủng', 'tay', 0.6, 'Mộ kiếm của Vạn Kiếm Thánh Tông đời đầu.'],
    ['Băng Phong Thần Điện', 'bac', 0.7, 'Thần điện bị băng phong, trăm năm tan một lần.'],
  ],
  isles: [
    ['Linh Quy Đảo', 'dong', 'wild', 0.6, 'Đảo là mai một con rùa linh đang ngủ.'],
    ['Thanh Linh Hải Thị', 'dong', 'market', 0, 'Chợ trên những chiếc thuyền buộc vào nhau.'],
    ['Bạch Kình Đảo', 'tay', 'wild', 0.5, 'Đảo xương cá voi trắng.'],
    ['Xích Diễm Đảo', 'nam', 'wild', 0.55, 'Đảo núi lửa giữa biển đỏ.'],
    ['Huyền Băng Đảo', 'bac', 'wild', 0.7, 'Đảo băng trôi, trên có cung điện bỏ hoang.'],
  ],
  empires: [
    ['Đại Linh Hoàng Triều', 'Vạn Linh Thành', 3, 'Linh Hoàng', 'Hoàng triều thống trị Linh Khư, hoàng tộc mang linh căn thuần nhất.'],
    ['Thanh Mộc Vương Triều', 'Thanh Mộc Thành', 2, 'Mộc Vương', 'Vương triều của người rừng, sống trên cây.'],
  ],
  beasts: [
    ['Vân Lộc', 'moc', 0, 0.25], ['Linh Lang', 'phong', 0, 0.3], ['Thiết Giáp Tê', 'tho', 0.1, 0.4], ['Thanh Mộc Viên', 'moc', 0.15, 0.45],
    ['Hỏa Linh Tước', 'hoa', 0.2, 0.5], ['Huyền Băng Mãng', 'bang', 0.3, 0.6], ['Kim Giáp Hạt', 'kim', 0.35, 0.65], ['Lôi Ưng', 'loi', 0.4, 0.7],
    ['Ám Ảnh Báo', 'am', 0.45, 0.75], ['Ngân Nguyệt Hồ', 'quang', 0.5, 0.8], ['Thạch Hùng', 'tho', 0.55, 0.85], ['Thôn Sơn Ngạc', 'thuy', 0.6, 0.95],
  ],
  lineage: [
    ['Lôi Giao', 'loi', 12, 'Lôi Giao Đàm', 'Giao long mang một tia lôi huyết. Tổ tiên xa xưa của nó, nghe nói, là chân long ở Hỗn Độn.'],
    ['Hỏa Vũ Điểu', 'hoa', 11, 'Phần Thiên Hỏa Uyên', 'Chim lửa đuôi dài, trong máu có một giọt phượng huyết loãng đến không nhận ra.'],
    ['Huyền Quy', 'thuy', 12, 'Huyền Băng Vực Sâu', 'Rùa đen cõng băng sơn, sống lâu hơn cả Linh Giới.'],
    ['Kim Lân Thú', 'kim', 11, 'Toái Kiếm Cốc', 'Thú vảy vàng một sừng, người ta đồn là cháu chắt chín đời của kỳ lân.'],
    ['Thanh Vũ Điêu', 'phong', 11, 'Vạn Thú Sơn', 'Chim điêu cánh xanh, sải cánh trăm trượng — một nhánh rất xa của Bằng tộc.'],
  ],
};

const TIEN: Theme = {
  syll: ['Tử Hà', 'Ngọc Thanh', 'Thượng Thanh', 'Thái Thanh', 'Dao Quang', 'Thiên Xu', 'Thiên Toàn', 'Thiên Cơ', 'Ngọc Hành', 'Khai Dương', 'Lưu Ly', 'Bồng Hồ', 'Vân Tiêu', 'Quỳnh Hoa', 'Kim Khuyết', 'Ngân Hán', 'Thải Vân', 'Thanh Hư', 'Hạc Lĩnh', 'Đào Hoa', 'Linh Chi', 'Tiên Lộ', 'Ngọc Đỉnh', 'Hoàng Đình', 'Tử Phủ', 'Huyền Đô', 'Thái Vi', 'Thiên Hoa', 'Bích Tiêu', 'Vũ Hóa'],
  vuc: {
    trung: ['Thiên Khuyết Tiên Vực', 'Nơi Tiên Đình ngự, mây tiên quanh năm không tan.'],
    dong: ['Đông Hoa Tiên Vực', 'Đất của tiên hạc, đào tiên và những hòn đảo trôi.'],
    tay: ['Tây Côn Tiên Vực', 'Quần sơn ngọc thạch, kiếm tiên ẩn cư.'],
    nam: ['Nam Minh Tiên Vực', 'Biển lửa phương nam, đất của hỏa tiên.'],
    bac: ['Bắc Thần Tiên Vực', 'Tinh không phía bắc, sao trời sà xuống ngang đầu.'],
  },
  seas: ['ĐÔNG HOA TIÊN HẢI', 'NAM MINH HỎA HẢI', 'TÂY CÔN NGỌC HẢI', 'BẮC THẦN TINH HẢI'],
  chau: {
    trung: ['Thiên Khuyết Châu', 'Lăng Tiêu Châu', 'Dao Trì Châu', 'Tử Phủ Châu', 'Dao Quang Châu'],
    dong: ['Bồng Lai Châu', 'Doanh Châu', 'Đào Nguyên Châu'],
    tay: ['Côn Ngọc Châu', 'Dao Sơn Châu', 'Kim Hà Châu'],
    nam: ['Nam Minh Châu', 'Ly Hỏa Tiên Châu', 'Xích Thành Châu'],
    bac: ['Bắc Thần Châu', 'Tử Vi Châu', 'Thiên Xu Châu'],
  },
  regions: {
    trung: [['Lăng Tiêu Vân Hải', 'Biển mây dưới chân Tiên Đình.'], ['Dao Trì Tiên Cảnh', 'Hồ ngọc, tiên nữ hái sen.']],
    dong: [['Bồng Lai Tiên Lục', 'Lục địa của tiên sơn trôi.'], ['Đào Nguyên Cốc', 'Thung lũng đào tiên, ba nghìn năm ra quả.']],
    tay: [['Ngọc Hư Sơn Mạch', 'Núi ngọc trắng, kiếm khí phủ đỉnh.'], ['Kim Hà Tiên Lộ', 'Con đường dọc sông vàng.']],
    nam: [['Nam Minh Hỏa Nguyên', 'Đồng lửa tiên, cháy mà không tàn.'], ['Xích Thành Sơn', 'Núi đỏ như thành lũy.']],
    bac: [['Tử Vi Tinh Nguyên', 'Đồng sao, đêm sáng như ngày.'], ['Bắc Minh Hàn Hải', 'Biển lạnh bờ bắc, cá lớn như núi.']],
  },
  sects: [
    ['Thiên Đình Tiên Phủ', 'trung', 4, ['quang', 'kim', 'loi', 'thuy'], 'Tiên phủ trực thuộc Tiên Đình, thống lĩnh thiên binh.', 'Thiên quy vô tư.', 'talis'],
    ['Dao Trì Thánh Cung', 'trung', 4, ['thuy', 'moc', 'bang'], 'Thánh cung bên hồ Dao Trì, giữ vườn đào tiên.', 'Nước lặng soi trời.', 'alch', false, true],
    ['Ngọc Hư Kiếm Các', 'tay', 4, ['kim', 'phong'], 'Kiếm các trên đỉnh ngọc sơn, kiếm tiên số một.', 'Kiếm tâm thông minh.', 'forge'],
    ['Bồng Lai Tiên Tông', 'dong', 3, ['moc', 'thuy', 'phong'], 'Tiên tông trên đảo trôi, đệ tử cưỡi hạc.', 'Tiêu dao tự tại.', 'alch'],
    ['Nam Minh Ly Hỏa Cung', 'nam', 3, ['hoa'], 'Cung điện giữa biển lửa, luyện chân hỏa.', 'Lửa không tắt thì đạo không dứt.', 'forge'],
    ['Tử Vi Tinh Tông', 'bac', 3, ['quang', 'am', 'loi'], 'Tông môn xem sao đoán mệnh.', 'Sao đổi thì mệnh đổi.', 'talis'],
    ['Huyết Hải Ma Cung', 'nam', 3, ['am', 'hoa'], 'Ma cung dưới đáy biển máu, đọa tiên tụ hội.', 'Máu là đạo.', 'talis', true],
    ['Đào Nguyên Quán', 'dong', 2, ['moc'], 'Đạo quán giữa rừng đào.', 'Đào nở thì về.', 'alch'],
    ['Kim Hà Môn', 'tay', 2, ['kim', 'thuy'], 'Tông môn đãi kim tiên sa trên sông vàng.', 'Sông vàng chảy mãi.', 'forge'],
    ['Thiên Xu Các', 'bac', 2, ['phong', 'quang'], 'Lầu các giữ bản đồ tinh không.', 'Theo sao mà đi.', 'talis'],
    ['Vân Hạc Tông', 'trung', 1, ['phong'], 'Tông môn nhỏ nuôi tiên hạc cho Tiên Đình.', 'Hạc bay ngàn dặm.', 'alch'],
    ['Xích Thành Phái', 'nam', 1, ['hoa', 'tho'], 'Phái giữ cửa Nam Minh.', 'Thành còn người còn.', 'forge'],
    ['Tán Tiên Minh', 'tay', 1, ['kim', 'tho', 'moc'], 'Liên minh của tán tiên không tông không phái.', 'Không ai làm chủ ai.', 'talis'],
  ],
  towns: [
    ['Lăng Tiêu Tiên Thành', 'trung', 'Thành trên mây ngay dưới Tiên Đình.', 'auction'],
    ['Thiên Môn Tiên Thành', 'trung', 'Thành giữ cửa trời, tiên binh canh gác.'],
    ['Bồng Lai Thành', 'dong', 'Thành trên đảo trôi lớn nhất.'],
    ['Côn Ngọc Thành', 'tay', 'Thành xây bằng ngọc, lò luyện tiên khí không tắt.', 'forge'],
    ['Nam Minh Thành', 'nam', 'Thành bên biển lửa.'],
    ['Tử Vi Thành', 'bac', 'Thành dưới tinh không, đêm như ngày.'],
    ['Đào Nguyên Trấn', 'dong', 'Trấn trong rừng đào.'],
    ['Xích Thành Trấn', 'nam', 'Trấn đá đỏ.'],
    ['Thiên Xu Trấn', 'bac', 'Trấn của người xem sao.'],
  ],
  villages: [
    ['Tiên Điền Thôn', 'trung', 'Thôn trồng linh cốc cho Tiên Đình.'],
    ['Hạc Minh Thôn', 'dong', 'Thôn nuôi tiên hạc.'],
    ['Ngọc Tuyền Thôn', 'tay', 'Thôn quanh suối ngọc.'],
    ['Hỏa Liên Thôn', 'nam', 'Thôn trồng hỏa liên.'],
    ['Tinh Lạc Thôn', 'bac', 'Thôn nơi sao băng hay rơi.'],
  ],
  markets: [
    ['Tiên Bảo Các', 'trung', 'Phường thị của tiên nhân, linh thạch chỉ là tiền lẻ.'],
    ['Bồng Lai phường thị', 'dong', 'Chợ đào tiên và tiên dược.'],
    ['Côn Ngọc phường thị', 'tay', 'Chợ tiên khí.'],
    ['Tinh Hà phường thị', 'bac', 'Chợ tinh thạch.'],
  ],
  wilds: [
    ['Vân Hải Tiên Lộ', 'trung', 0.15, 'Đường mây, tiên thú hiền lành.'],
    ['Thiên Hà', 'trung', 0.55, 'Sông trời, nước là ánh sao.'],
    ['Bàn Đào Lâm', 'dong', 0.2, 'Rừng đào tiên hoang.'],
    ['Tiên Hạc Nhai', 'dong', 0.45, 'Vách đá nơi hạc vương làm tổ.'],
    ['Giao Long Uyên', 'dong', 0.8, 'Vực biển nơi giao long tiên giới ẩn mình.'],
    ['Ngọc Hư Phong', 'tay', 0.5, 'Đỉnh ngọc, kiếm khí tự sinh.'],
    ['Kỳ Lân Nhai', 'tay', 0.7, 'Vách đá có dấu chân thú một sừng.'],
    ['Tru Tiên Cổ Trận', 'tay', 0.9, 'Cổ trận đã giết vô số tiên nhân.'],
    ['Nam Minh Hỏa Hải', 'nam', 0.6, 'Biển lửa không bờ.'],
    ['Phượng Tê Cốc', 'nam', 0.85, 'Thung lũng ngô đồng, chim lửa làm tổ.'],
    ['Tinh Vẫn Nguyên', 'bac', 0.4, 'Đồng thiên thạch.'],
    ['Bắc Minh Uyên', 'bac', 0.75, 'Vực biển bắc, cá lớn ẩn dưới.'],
  ],
  realms: [
    ['Cổ Thiên Đình Di Chỉ', 'trung', 0.9, 'Tàn tích của Thiên Đình đời trước.'],
    ['Bàn Đào Viên', 'dong', 0.6, 'Vườn đào tiên, chín nghìn năm mở một lần.'],
    ['Tinh Thần Mộ', 'bac', 0.75, 'Mộ của một vì sao đã tắt.'],
  ],
  isles: [
    ['Phương Trượng Đảo', 'dong', 'wild', 0.5, 'Đảo tiên trôi, sương mù vây kín.'],
    ['Doanh Châu Thị', 'dong', 'market', 0, 'Chợ trên đảo Doanh Châu.'],
    ['Ngọc Kình Đảo', 'tay', 'wild', 0.55, 'Đảo là lưng một con kình ngọc.'],
    ['Hỏa Phượng Đảo', 'nam', 'wild', 0.7, 'Đảo lửa giữa Nam Minh.'],
    ['Tinh Hà Đảo', 'bac', 'wild', 0.6, 'Đảo nằm trên dòng sao.'],
  ],
  empires: [
    ['Tiên Đình Thiên Triều', 'Lăng Tiêu Tiên Thành', 3, 'Tiên Đế', 'Thiên triều cai quản Tiên Giới, tiên binh mười vạn.'],
    ['Nam Minh Tiên Quốc', 'Nam Minh Thành', 2, 'Hỏa Đế', 'Tiên quốc của hỏa tiên phương nam.'],
  ],
  beasts: [
    ['Tiên Hạc', 'phong', 0, 0.3], ['Bạch Lộc', 'moc', 0, 0.3], ['Vân Báo', 'phong', 0.1, 0.4], ['Ngọc Thiềm', 'thuy', 0.2, 0.5],
    ['Hỏa Vân Mã', 'hoa', 0.3, 0.6], ['Băng Phách Tằm', 'bang', 0.3, 0.6], ['Tinh Hồ', 'quang', 0.35, 0.65], ['Thôn Vân Thú', 'am', 0.4, 0.7],
    ['Kim Giác Tê', 'kim', 0.5, 0.8], ['Lôi Thú', 'loi', 0.55, 0.85], ['Huyền Viên', 'tho', 0.6, 0.95],
  ],
  lineage: [
    ['Giao Long Vương', 'thuy', 15, 'Giao Long Uyên', 'Giao long tiên giới, trên đầu mọc nửa chiếc sừng — cách chân long còn vạn bậc.'],
    ['Xích Hỏa Thanh Điểu', 'hoa', 15, 'Phượng Tê Cốc', 'Chim xanh lửa đỏ, một nhánh rất xa của phượng tộc.'],
    ['Lân Mã', 'kim', 14, 'Kỳ Lân Nhai', 'Mình ngựa vảy lân, mang một phần mười huyết mạch kỳ lân.'],
    ['Côn Ngư', 'thuy', 14, 'Bắc Minh Uyên', 'Cá lớn Bắc Minh, nghe nói là hậu duệ xa của Côn Bằng — nhưng chưa từng hóa chim.'],
    ['Tiên Hạc Vương', 'phong', 13, 'Tiên Hạc Nhai', 'Vua của tiên hạc, đã chở ba đời Tiên Đế.'],
  ],
  scale: { trung: 1.05, outer: 0.97 },
};

const THAN: Theme = {
  syll: ['Liệt Nhật', 'Hạo Nguyệt', 'Thiên Lôi', 'Cuồng Phong', 'Thần Huy', 'Kim Dương', 'U Ảnh', 'Thánh Quang', 'Hoàng Kim', 'Xích Viêm', 'Băng Nguyệt', 'Tinh Hà', 'Thần Mộc', 'Thần Hỏa', 'Thần Thạch', 'Vĩnh Hằng', 'Huy Hoàng', 'Thiên Phạt', 'Vạn Thần', 'Quang Minh', 'Diệt Thế', 'Phá Quân', 'Tham Lang', 'Thất Sát', 'Thái Bạch', 'Huỳnh Hoặc', 'Thần Uy', 'Thánh Hỏa', 'Lôi Âm', 'Phong Hành'],
  vuc: {
    trung: ['Chư Thần Trung Vực', 'Thần đình của chư thần, thần quang chiếu khắp.'],
    dong: ['Thái Dương Thần Vực', 'Mặt trời không bao giờ lặn.'],
    tay: ['Thái Âm Thần Vực', 'Đêm vĩnh hằng, trăng bạc treo cao.'],
    nam: ['Lôi Đình Thần Vực', 'Sấm sét không dứt, lôi thần làm chủ.'],
    bac: ['Phong Bạo Thần Vực', 'Cuồng phong vạn năm không ngừng.'],
  },
  seas: ['THẦN HUY HẢI', 'LÔI QUANG HẢI', 'NGUYỆT ẢNH HẢI', 'CUỒNG PHONG HẢI'],
  chau: {
    trung: ['Chư Thần Châu', 'Thiên Quang Châu', 'Địa Hoàng Châu', 'Đông Hoàng Châu', 'Tây Hoàng Châu'],
    dong: ['Phù Tang Châu', 'Kim Ô Châu', 'Diệu Dương Châu'],
    tay: ['Quảng Hàn Châu', 'Thanh Nguyệt Châu', 'Ảnh Dạ Châu'],
    nam: ['Lôi Trạch Châu', 'Cửu Tiêu Châu', 'Đình Tiêu Châu'],
    bac: ['Cương Phong Châu', 'Thiên Phong Châu', 'Liệt Phong Châu'],
  },
  regions: {
    trung: [['Chư Thần Điện Nguyên', 'Cao nguyên đặt thần điện của chư thần.'], ['Thần Hoang Sơn', 'Núi hoang nơi thần ma từng giao chiến.']],
    dong: [['Phù Tang Thần Mộc', 'Cây thần ôm cả mặt trời.'], ['Liệt Dương Hoang Nguyên', 'Đồng hoang dưới nắng không tắt.']],
    tay: [['Quảng Hàn Băng Nguyên', 'Băng nguyên dưới ánh trăng vĩnh viễn.'], ['Vĩnh Dạ Sâm Lâm', 'Rừng đêm, bóng tối có hình.']],
    nam: [['Lôi Trạch', 'Đầm sét, nước dẫn lôi.'], ['Cửu Tiêu Lôi Sơn', 'Núi chín tầng sét.']],
    bac: [['Cương Phong Hiệp', 'Hẻm gió cắt cả thần thể.'], ['Phong Bạo Cao Nguyên', 'Cao nguyên của lốc xoáy.']],
  },
  sects: [
    ['Chư Thần Điện', 'trung', 4, ['quang', 'kim', 'tho', 'loi'], 'Điện thờ chư thần, nơi thần chức được phong.', 'Thần ở trên, đạo ở trong.', 'talis'],
    ['Thái Dương Thần Cung', 'dong', 4, ['hoa', 'quang'], 'Thần cung trên cây Phù Tang, thờ mặt trời.', 'Dương không bao giờ tắt.', 'forge'],
    ['Thái Âm Thần Cung', 'tay', 4, ['bang', 'thuy', 'am'], 'Thần cung trên Quảng Hàn, chỉ nhận nữ.', 'Nguyệt hằng tại.', 'alch', false, true],
    ['Lôi Thần Điện', 'nam', 3, ['loi', 'phong'], 'Điện của lôi thần, đệ tử tắm trong sét.', 'Lôi phạt bất nghĩa.', 'forge'],
    ['Phong Thần Điện', 'bac', 3, ['phong'], 'Điện giữa mắt bão.', 'Gió không có hình.', 'talis'],
    ['Hoàng Tuyền Thần Giáo', 'tay', 3, ['am', 'thuy'], 'Thần giáo thờ dòng sông người chết.', 'Ai rồi cũng tới Hoàng Tuyền.', 'talis', true],
    ['Phù Tang Thần Tông', 'dong', 2, ['moc', 'hoa'], 'Tông môn giữ gốc cây Phù Tang.', 'Rễ sâu thì lá xanh.', 'alch'],
    ['Nguyệt Ảnh Các', 'tay', 2, ['am', 'bang'], 'Lầu các của thích khách dưới trăng.', 'Bóng không có tiếng.', 'talis'],
    ['Cửu Tiêu Môn', 'nam', 2, ['loi'], 'Tông môn trên tầng sét thứ chín.', 'Chín tầng một bước.', 'forge'],
    ['Thần Binh Cốc', 'trung', 2, ['kim', 'hoa'], 'Thung lũng rèn thần binh cho chư thần.', 'Binh có hồn.', 'forge'],
    ['Liệt Phong Bảo', 'bac', 1, ['phong', 'tho'], 'Thành bảo chắn gió.', 'Đứng vững là thắng.', 'forge'],
    ['Lôi Trạch Phái', 'nam', 1, ['loi', 'thuy'], 'Phái nhỏ bên đầm sét.', 'Nước dẫn sấm.', 'alch'],
    ['Dạ Hành Hội', 'tay', 1, ['am'], 'Hội của kẻ đi đêm.', 'Đêm là nhà.', 'talis', true],
  ],
  towns: [
    ['Chư Thần Thành', 'trung', 'Thành dưới chân Chư Thần Điện, thần dân cầu nguyện ngày đêm.', 'auction'],
    ['Thiên Quang Thành', 'trung', 'Thành của thần quang, không có bóng tối.'],
    ['Phù Tang Thành', 'dong', 'Thành trên cành cây Phù Tang.'],
    ['Quảng Hàn Thành', 'tay', 'Thành băng dưới trăng.'],
    ['Lôi Trạch Thành', 'nam', 'Thành bên đầm sét.'],
    ['Cương Phong Thành', 'bac', 'Thành đá chắn gió, lò rèn thần binh.', 'forge'],
    ['Diệu Dương Trấn', 'dong', 'Trấn nắng.'],
    ['Ảnh Dạ Trấn', 'tay', 'Trấn đêm.'],
    ['Liệt Phong Trấn', 'bac', 'Trấn gió.'],
  ],
  villages: [
    ['Thần Điền Thôn', 'trung', 'Thôn trồng thần cốc.'],
    ['Kim Ô Thôn', 'dong', 'Thôn thờ chim lửa ba chân.'],
    ['Nguyệt Hạ Thôn', 'tay', 'Thôn dưới trăng.'],
    ['Lôi Thạch Thôn', 'nam', 'Thôn đào lôi thạch.'],
    ['Phong Linh Thôn', 'bac', 'Thôn treo chuông gió.'],
  ],
  markets: [
    ['Thần Khí phường thị', 'trung', 'Chợ thần khí và thần cách.'],
    ['Thái Dương phường thị', 'dong', 'Chợ nhật tinh.'],
    ['Ảnh Nguyệt phường thị', 'tay', 'Chợ đêm, hàng không hỏi nguồn.'],
    ['Cửu Tiêu phường thị', 'nam', 'Chợ lôi tinh.'],
  ],
  wilds: [
    ['Thần Hoang Biên Dã', 'trung', 0.15, 'Đồng hoang ven thần đình.'],
    ['Thần Ma Mộ', 'trung', 0.65, 'Mộ của thần ma thời thượng cổ.'],
    ['Thần Hoang Cổ Chiến Trường', 'trung', 0.95, 'Chiến trường thần ma, thần huyết thấm đất.'],
    ['Liệt Dương Hoang', 'dong', 0.3, 'Đồng nắng cháy.'],
    ['Khổng Tước Sơn', 'dong', 0.6, 'Núi của khổng tước ngũ sắc.'],
    ['Phù Tang Thần Thụ', 'dong', 0.85, 'Gốc cây thần, lửa mặt trời rơi xuống.'],
    ['Vĩnh Dạ Lâm', 'tay', 0.2, 'Rừng đêm.'],
    ['Quảng Hàn Băng Cốc', 'tay', 0.5, 'Thung lũng băng dưới trăng.'],
    ['Cửu Tiêu Lôi Phong', 'nam', 0.4, 'Đỉnh sét.'],
    ['Lôi Trạch Thâm Uyên', 'nam', 0.75, 'Vực sét không đáy.'],
    ['Vạn Phong Quật', 'bac', 0.25, 'Hang gió.'],
    ['Kim Sí Nhai', 'bac', 0.9, 'Vách đá cao nhất Thần Giới, chim cánh vàng làm tổ.'],
  ],
  realms: [
    ['Thần Táng Địa', 'trung', 0.95, 'Nơi chôn những vị thần đã chết.'],
    ['Nguyệt Cung Di Tích', 'tay', 0.75, 'Tàn tích cung trăng đời trước.'],
    ['Lôi Kiếp Trì', 'nam', 0.8, 'Ao sét, ngâm mình là độ kiếp.'],
  ],
  isles: [
    ['Kim Ô Đảo', 'dong', 'wild', 0.6, 'Đảo nơi chim lửa ba chân đậu.'],
    ['Thần Huy Hải Thị', 'dong', 'market', 0, 'Chợ trên biển sáng.'],
    ['Thanh Nguyệt Đảo', 'tay', 'wild', 0.55, 'Đảo ánh trăng.'],
    ['Lôi Quang Đảo', 'nam', 'wild', 0.65, 'Đảo sét.'],
    ['Phong Nhãn Đảo', 'bac', 'wild', 0.7, 'Đảo ở mắt bão.'],
  ],
  empires: [
    ['Chư Thần Thiên Triều', 'Chư Thần Thành', 3, 'Thần Hoàng', 'Thiên triều của chư thần, phong thần ban chức.'],
    ['Phù Tang Thần Quốc', 'Phù Tang Thành', 2, 'Thái Dương Vương', 'Thần quốc thờ mặt trời.'],
  ],
  beasts: [
    ['Thần Lộc', 'quang', 0, 0.3], ['Liệt Dương Sư', 'hoa', 0.1, 0.4], ['Nguyệt Lang', 'bang', 0.15, 0.45], ['Phong Ưng', 'phong', 0.2, 0.5],
    ['Lôi Tê', 'loi', 0.3, 0.6], ['Ảnh Hồ', 'am', 0.35, 0.65], ['Thôn Kim Thử', 'kim', 0.4, 0.7], ['Thần Viên', 'tho', 0.45, 0.75],
    ['Huyết Ma Ngưu', 'am', 0.5, 0.8], ['Ngân Giáp Ngạc', 'thuy', 0.55, 0.85], ['Thanh Mộc Thần Tằm', 'moc', 0.6, 0.9],
  ],
  lineage: [
    ['Kim Sí Đại Bằng', 'phong', 18, 'Kim Sí Nhai', 'Bằng cánh vàng, một vỗ chín vạn dặm. Huyết mạch Côn Bằng trong nó đã loãng chín phần.'],
    ['Khổng Tước', 'quang', 18, 'Khổng Tước Sơn', 'Khổng tước ngũ sắc, ngũ hành thần quang quét đâu sạch đó. Tổ tiên xa là phượng huyết.'],
    ['Thần Giao', 'loi', 17, 'Lôi Trạch Thâm Uyên', 'Giao long hóa thần, sừng đã đủ một đôi nhưng vẫn chưa phải long.'],
    ['Hỏa Kỳ Lân', 'hoa', 17, 'Phù Tang Thần Thụ', 'Kỳ lân hỏa thuộc — một tia huyết của Thủy Kỳ Lân bị lửa thiêu đổi tính.'],
    ['Huyền Quy Thần', 'thuy', 17, 'Quảng Hàn Băng Cốc', 'Rùa thần cõng một ngọn núi băng.'],
  ],
  scale: { trung: 1.1, outer: 0.95 },
};

// Hồng Hoang theo truyền thuyết Trung Hoa. Bố cục chọn bản bám sát cổ điển nhất mà vẫn khớp 5 khối đất của game:
// - Khối giữa là Trung Thổ (Hải Nội, Cửu Châu trong bốn biển; năm châu mang tên Cửu Châu của Hoài Nam Tử). Toàn bộ nhân gian
//   Thương – Chu của Phong Thần Diễn Nghĩa nằm ở đây: Triều Ca phía đông, Ngũ Quan ở giữa, Tây Kỳ phía tây. Côn Lôn ở tây bắc
//   Hải Nội như Sơn Hải Kinh chép, nối lên trời.
// - Bốn khối ngoài là Tứ Đại Bộ Châu (Tây Du Ký), chứa các nước Hải Ngoại và Đại Hoang cùng hướng (Sơn Hải Kinh).
//   Bất Chu Sơn ở tây bắc như Hoài Nam Tử và Đại Hoang Tây Kinh chép (không phải ở giữa như truyện mạng).
// - Đảo theo đúng biển mà nguyên văn ghi: Kim Ngao Đảo ở Đông Hải, Cửu Long Đảo ở Tây Hải; Bồng Lai, Phương Trượng,
//   Doanh Châu, Quy Khư theo Liệt Tử; thập châu theo Hải Nội Thập Châu Ký.
// - Nơi nguyên tác không ghi vị trí (động phủ thập nhị kim tiên, Bát Cảnh Cung, Tử Tiêu Cung...) được đặt ở chỗ hợp lý.
// Ghim: [vực, nx, ny] trong elip lục địa của vực (nx dương về đông, ny dương về nam).
const HONGHOANG: Theme = {
  syll: ['Cửu Lê', 'Hữu Hùng', 'Hiên Viên', 'Thần Nông', 'Phục Hy', 'Toại Nhân', 'Hữu Sào', 'Đại Vũ', 'Chuyên Húc', 'Đế Cốc', 'Thiếu Hạo', 'Cộng Công', 'Chúc Dung', 'Hậu Thổ', 'Câu Mang', 'Huyền Minh', 'Nhục Thu', 'Đế Giang'],
  fill: false,
  vuc: {
    trung: ['Trung Thổ', 'Cửu Châu trong bốn biển. Côn Lôn ở tây bắc nối lên trời; nhà Thương đóng đô ở Triều Ca, nhà Chu dấy lên ở Tây Kỳ.'],
    dong: ['Đông Thắng Thần Châu', 'Bên kia Đông Hải, nơi mặt trời mọc từ Thang Cốc và cây Phù Tang; có nước Quân Tử, nước Đại Nhân, nước Thanh Khâu.'],
    tay: ['Tây Ngưu Hạ Châu', 'Bên kia Tây Hải: Lưu Sa, Ngọc Sơn của Tây Vương Mẫu, nước Hiên Viên; Tây Phương Cực Lạc ở tận cùng phía tây.'],
    nam: ['Nam Thiệm Bộ Châu', 'Bên kia Nam Hải: nước Vũ Dân, nước Bất Tử, núi Đan Huyệt có phượng hoàng, núi Thương Ngô có lăng vua Thuấn.'],
    bac: ['Bắc Câu Lô Châu', 'Bên kia Bắc Hải: Bất Chu Sơn gãy đỉnh ở tây bắc, Chung Sơn của Chúc Long, U Đô ở cực bắc.'],
  },
  seas: ['ĐÔNG HẢI', 'NAM HẢI', 'TÂY HẢI', 'BẮC HẢI'],
  chau: {
    trung: ['Ký Châu', 'Tế Châu', 'Thứ Châu', 'Dương Châu', 'Yêm Châu'],
    // bốn khối ngoài: tên vùng ngoài Cửu Châu theo Hoài Nam Tử · Địa Hình (Bát Ân, Bát Hoành), mỗi khối ba dải
    dong: ['Cức Lâm', 'Tang Dã', 'Thiếu Hải'],
    tay: ['Kim Khâu', 'Ốc Dã', 'Tuyền Trạch'],
    nam: ['Phản Hộ', 'Hạo Trạch', 'Đại Mộng'],
    bac: ['Ủy Vũ', 'Tích Băng', 'Hàn Trạch'],
  },
  regions: {
    trung: [['Hải Nội Cửu Châu', 'Đất trong bốn biển, nơi nhân tộc Thương Chu sinh sống.'], ['Trung Sơn Kinh Chư Sơn', 'Núi non trong bốn biển chép ở Sơn Hải Kinh, nơi tiên gia mở động phủ.']],
    dong: [['Hải Ngoại Đông Kinh', 'Các nước bên kia Đông Hải: Quân Tử, Đại Nhân, Thanh Khâu, Hắc Xỉ.'], ['Đại Hoang Đông Kinh', 'Rìa đông trời đất, nơi mặt trời mọc từ Thang Cốc.']],
    tay: [['Hải Ngoại Tây Kinh', 'Các nước bên kia Tây Hải: Hiên Viên, Nữ Tử, Bạch Dân, Vu Hàm.'], ['Đại Hoang Tây Kinh', 'Rìa tây trời đất, nơi mặt trời lặn xuống Ngu Uyên.']],
    nam: [['Hải Ngoại Nam Kinh', 'Các nước bên kia Nam Hải: Vũ Dân, Hoan Đâu, Yếm Hỏa, Quán Hung, Bất Tử.'], ['Đại Hoang Nam Kinh', 'Rìa nam nóng bức: Vu Sơn kho thuốc của Thiên Đế, Hy Hòa tắm mặt trời ở Cam Uyên.']],
    bac: [['Hải Ngoại Bắc Kinh', 'Các nước bên kia Bắc Hải: Nhất Mục, Chung Bắc, đất chư hầu Bắc Hải.'], ['Đại Hoang Bắc Kinh', 'Rìa bắc giá lạnh, U Đô và Chung Sơn của Chúc Long.']],
  },
  sects: [
    ['Xiển Giáo · Ngọc Hư Cung', 'trung', 4, ['quang', 'kim', 'thuy', 'tho'], 'Ngọc Hư Cung trên Côn Lôn, sau Kỳ Lân Nhai. Nguyên Thủy Thiên Tôn chưởng Xiển Giáo; thập nhị kim tiên chia nhau động phủ khắp danh sơn.', 'Thuận thiên mà hành.', 'alch'],
    ['Đạo Giáo · Bát Cảnh Cung', 'trung', 4, ['tho', 'thuy', 'moc'], 'Bát Cảnh Cung trong Đại La Cung, Huyền Đô Động, nơi Thái Thượng Lão Quân ngự; phải cưỡi mây mới tới. Tổ đình Đạo Giáo: Xiển Giáo và Tiệt Giáo là hai nhánh do hai sư đệ của Lão Quân chưởng quản. Vô vi mà trị, đệ tử cực ít.', 'Đạo pháp tự nhiên.', 'alch'],
    ['Tiệt Giáo · Bích Du Cung', 'dong', 4, ['kim', 'moc', 'thuy', 'hoa', 'tho', 'loi'], 'Bích Du Cung trên Kim Ngao Đảo giữa Đông Hải, Tử Chi Nhai dưới chân cung. Thông Thiên Giáo Chủ hữu giáo vô loại, vạn tiên lai triều.', 'Tiệt lấy một tia sinh cơ.', 'talis', false, false, true],
    ['Tây Phương Giáo', 'tay', 4, ['quang', 'tho'], 'Tây Phương Cực Lạc ở tận cùng phía tây, có Bát Đức Trì và Thất Bảo Lâm. Tiếp Dẫn, Chuẩn Đề độ người hữu duyên.', 'Tâm tịnh thì đất tịnh.', 'alch'],
    ['Hỏa Vân Động', 'trung', 3, ['hoa', 'moc', 'tho'], 'Đạo tràng của Tam Thánh nhân hoàng Phục Hy, Thần Nông, Hiên Viên; thế núi liền với thiên giới, bên cạnh có Tử Vân Nhai.', 'Nhân tộc tự cường.', 'alch'],
    ['Yêu Đình', 'bac', 3, ['am', 'phong', 'hoa'], 'Triều đình yêu tộc của Yêu Đế Đế Tuấn và Đông Hoàng Thái Nhất. Đại chiến Vu Yêu, hai vị tử trận, Yêu Đình tan; tàn dư theo Yêu Sư Côn Bằng về gần Bắc Minh.', 'Yêu tộc vi tôn.', 'talis', true],
    ['Vu Tộc · Bàn Cổ Điện', 'bac', 3, ['tho', 'hoa', 'thuy'], 'Điện thờ Bàn Cổ của mười hai Tổ Vu dưới chân Bất Chu Sơn — chỉ luyện thân, không tu nguyên thần. Hậu Thổ hóa luân hồi, nên cổng Địa Phủ mở từ đây.', 'Thân này là trời đất.', 'forge'],
    ['Ngũ Trang Quán', 'tay', 3, ['moc', 'tho'], 'Đạo quán trên Vạn Thọ Sơn, có cây nhân sâm quả; quán chủ Trấn Nguyên Tử là tổ của địa tiên.', 'Khách tới thì mời trà.', 'alch'],
    ['Phương Thốn Sơn · Tam Tinh Động', 'tay', 3, ['kim', 'phong', 'thuy'], 'Linh Đài Phương Thốn Sơn, Tà Nguyệt Tam Tinh Động của Tu Bồ Đề Tổ Sư; truyền bảy mươi hai phép biến hóa và cân đẩu vân cho Ngộ Không rồi đuổi đi, dặn không được nói là đồ đệ của ông.', 'Đừng nói thầy ngươi là ai.', 'talis'],
    ['Tam Tiên Đảo', 'dong', 2, ['thuy', 'phong'], 'Đảo của Vân Tiêu, Quỳnh Tiêu, Bích Tiêu, ba nữ tiên Tiệt Giáo; ngoài khơi Đông Hải.', 'Ba người một lòng.', 'talis', false, true, true],
    ['Cửu Long Đảo', 'tay', 2, ['thuy', 'loi', 'am'], 'Đảo giữa Tây Hải, nơi Tứ Thánh Vương Ma, Dương Sâm, Cao Hữu Càn, Lý Hưng Bá tu luyện; môn hạ Tiệt Giáo.', 'Chín rồng một đảo.', 'forge', false, false, true],
    ['Hỏa Long Đảo', 'nam', 2, ['hoa', 'loi'], 'Đảo lửa ngoài Nam Hải của Diệm Trung Tiên La Tuyên, môn hạ Tiệt Giáo; cưỡi Xích Yên Câu, phun lửa thiêu thành.', 'Lửa không hỏi ai.', 'forge', false, false, true],
    ['Nga Mi Sơn · La Phù Động', 'nam', 2, ['kim', 'loi', 'am'], 'Động phủ của Triệu Công Minh, môn hạ Tiệt Giáo, cưỡi Hắc Hổ, có Định Hải Châu.', 'Châu định biển, roi định người.', 'talis'],
    ['Hoa Quả Sơn · Thủy Liêm Động', 'dong', 2, ['kim', 'tho', 'moc'], 'Núi giữa biển sát nước Ngạo Lai; sau thác nước có Thủy Liêm Động, nước dưới Thiết Bản Kiều thông ra Đông Hải, theo đó tới Long Cung. Bầy khỉ tôn Mỹ Hầu Vương.', 'Trời sinh đất dưỡng.', 'forge', false, false, true],
    ['Khô Lâu Sơn · Bạch Cốt Động', 'trung', 1, ['tho', 'am'], 'Động của Thạch Cơ Nương Nương, môn hạ Tiệt Giáo, trong tầm mũi Chấn Thiên Tiễn bắn từ Trần Đường Quan.', 'Đá cũng thành tiên.', 'talis'],
    ['Mai Sơn', 'nam', 1, ['tho', 'moc', 'am'], 'Núi của Mai Sơn thất quái do Viên Hồng đứng đầu — viên hầu, bạch xà, heo, chó, dê, trâu, rết thành tinh.', 'Bảy quái một núi.', 'forge', true],
  ],
  towns: [
    ['Triều Ca', 'trung', 'Kinh đô nhà Thương. Có Lộc Đài, Trích Tinh Lâu, Cửu Gian Điện và miếu Nữ Oa.', 'auction'],
    ['Ký Châu Thành', 'trung', 'Đất của Ký Châu Hầu Tô Hộ, phía bắc Triều Ca; quê của Tô Đát Kỷ.'],
    ['Dữu Lý', 'trung', 'Thành trong đất nhà Thương, gần Triều Ca; Tây Bá Hầu Cơ Xương bị giam bảy năm ở đây.'],
    ['Mãnh Trì', 'trung', 'Huyện giữa Hoàng Hà và Lâm Đồng Quan, phía tây Mạnh Tân; Trương Khuê trấn giữ.'],
    ['Lâm Đồng Quan', 'trung', 'Cửa ải đầu tiên khi rời Triều Ca đi về tây.', 'forge'],
    ['Đồng Quan', 'trung', 'Cửa ải thứ hai tính từ Triều Ca; Dư Hóa Long và năm con trấn giữ.'],
    ['Xuyên Vân Quan', 'trung', 'Cửa ải thứ ba, giữa Đồng Quan và Giới Bài Quan.'],
    ['Giới Bài Quan', 'trung', 'Cửa ải thứ tư; trước ải từng bày Tru Tiên Trận.', 'forge'],
    ['Tị Thủy Quan', 'trung', 'Cửa ải cực tây của Ngũ Quan, tiếp giáp Kim Kê Lĩnh thuộc đất Tây Kỳ.'],
    ['Thanh Long Quan', 'trung', 'Ải bên trái con đường từ Triều Ca về tây, lệch tây nam.'],
    ['Giai Mộng Quan', 'trung', 'Ải bên phải con đường từ Triều Ca về tây, lệch tây bắc; Ma gia tứ tướng trấn giữ.'],
    ['Tây Kỳ Thành', 'trung', 'Đất nhà Chu ở đầu tây của trục Triều Ca – Tây Kỳ, ngoài Ngũ Quan và Kim Kê Lĩnh.', 'auction'],
    ['Đông Lỗ Thành', 'trung', 'Đất của Đông Bá Hầu Khương Hoàn Sở, phía đông Triều Ca.'],
    ['Du Hồn Quan', 'trung', 'Ải chặn hướng đông của nhà Thương, đối mặt quân Đông Lỗ.'],
    ['Trần Đường Quan', 'trung', 'Ải ven Đông Hải, sông Cửu Loan chảy qua rồi đổ ra cửa biển; tổng binh Lý Tĩnh trấn giữ.', 'forge'],
    ['Nam Đô Thành', 'trung', 'Đất của Nam Bá Hầu Ngạc Sùng Vũ, phía nam Triều Ca.'],
    ['Tam Sơn Quan', 'trung', 'Ải chặn hướng nam của nhà Thương, đối mặt quân Nam Đô.'],
    ['Sùng Thành', 'trung', 'Đất của Bắc Bá Hầu Sùng Hầu Hổ.'],
    ['Thanh Khâu Thành', 'dong', 'Đô thành nước Thanh Khâu, nơi hồ chín đuôi sinh sống.'],
    ['Quân Tử Thành', 'dong', 'Đô thành nước Quân Tử: người đeo kiếm, mặc áo mũ, ăn thú, sai hai con hổ vằn, nhường nhịn không tranh.'],
    ['Đại Nhân Thành', 'dong', 'Đô thành nước Đại Nhân, nơi người khổng lồ sống; phía nam nước Quân Tử.'],
    ['Ngạo Lai Thành', 'dong', 'Đô thành nước Ngạo Lai ven Đông Hải, ở Đông Thắng Thần Châu; ngoài khơi là Hoa Quả Sơn.', 'forge'],
    ['Hắc Xỉ Thành', 'dong', 'Đô thành nước Hắc Xỉ, phía nam Thang Cốc; người răng đen ăn lúa và rắn.'],
    ['Bạch Dân Thành', 'tay', 'Đô thành nước Bạch Dân, người tóc trắng; có thú Thừa Hoàng, cưỡi được thì thọ hai nghìn năm.'],
    ['Hiên Viên Thành', 'tay', 'Đô thành nước Hiên Viên gần Hiên Viên chi khâu, dòng dõi Hoàng Đế; người chết yểu nhất cũng tám trăm tuổi.'],
    ['Nữ Tử Thành', 'tay', 'Đô thành nước Nữ Tử, phía bắc nước Vu Hàm; cả nước toàn nữ giới.'],
    ['Vu Hàm Thành', 'tay', 'Đô thành nước Vu Hàm, nơi quần vu theo Đăng Bảo Sơn lên xuống trời.'],
    ['Vũ Dân Thành', 'nam', 'Đô thành nước Vũ Dân: người mọc lông vũ, sinh từ trứng, bay không xa.'],
    ['Hoan Đâu Thành', 'nam', 'Đô thành nước Hoan Đâu: người mặt người cánh chim, mỏ chim, bắt cá ăn.'],
    ['Yếm Hỏa Thành', 'nam', 'Đô thành nước Yếm Hỏa: người mình thú màu đen, miệng phun lửa.'],
    ['Quán Hung Thành', 'nam', 'Đô thành nước Quán Hung: ngực người có lỗ thủng xuyên qua.'],
    ['Bất Tử Thành', 'nam', 'Đô thành nước Bất Tử: người da đen, sống mãi không chết; trên núi có cây bất tử.'],
    ['Nhất Mục Thành', 'bac', 'Đô thành nước Nhất Mục, người một mắt giữa mặt; phía đông Chung Sơn.'],
    ['Bắc Hải Thành', 'bac', 'Đất của bảy mươi hai lộ chư hầu Bắc Hải do Viên Phúc Thông cầm đầu, từng nổi loạn chống nhà Thương.'],
    ['Chung Bắc Thành', 'bac', 'Đô thành nước Chung Bắc ở phía bắc Bắc Hải, Đại Vũ trị thủy từng lạc tới.'],
  ],
  villages: [
    ['Tống Gia Trang', 'trung', 'Trang của Tống Dị Nhân, nghĩa huynh Khương Tử Nha, ngoài cửa nam Triều Ca ba mươi lăm dặm.'],
    ['Bạch Liễu Thôn', 'trung', 'Thôn giữa Yến Sơn và Tây Kỳ Sơn, dân Tây Kỳ sinh sống.'],
    ['Trần Gia Trang', 'tay', 'Trang bên bờ đông Thông Thiên Hà; hằng năm phải cúng đồng nam đồng nữ cho Linh Cảm Đại Vương.'],
    ['Cao Lão Trang', 'nam', 'Trang thuộc nước Ô Tư Tạng, gần Phúc Lăng Sơn Vân Sạn Động.'],
  ],
  markets: [
    ['Mạnh Tân', 'trung', 'Bến sông phía tây Triều Ca ở bờ bắc Hoàng Hà, nơi tám trăm chư hầu hội minh; thuyền buôn bốn phương ghé lại.'],
  ],
  wilds: [
    // Trung Thổ — Côn Lôn ở tây bắc
    ['Côn Lôn Hư', 'trung', 0.65, 'Gò Côn Lôn, hạ đô của Thiên Đế do thần Lục Ngô cai quản; vạn sơn chi tổ.'],
    ['Nhược Thủy', 'trung', 0.75, 'Vực nước vây chân Côn Lôn, lông hồng thả xuống cũng chìm.'],
    ['Viêm Hỏa Sơn', 'trung', 0.8, 'Vành núi lửa ngoài Nhược Thủy quanh Côn Lôn, ném vật vào là cháy.'],
    ['Không Động Sơn', 'trung', 0.45, 'Không Động Sơn Nguyên Dương Động của Linh Bảo Đại Pháp Sư, môn hạ Xiển Giáo.'],
    ['Ngọc Tuyền Sơn', 'trung', 0.4, 'Ngọc Tuyền Sơn Kim Hà Động của Ngọc Đỉnh Chân Nhân, sư phụ Dương Tiễn; gần Tây Kỳ.'],
    ['Chung Nam Sơn', 'trung', 0.4, 'Chung Nam Sơn Ngọc Trụ Động của Vân Trung Tử, người từng dâng kiếm trừ yêu ở Triều Ca.'],
    ['Thái Hoa Sơn', 'trung', 0.45, 'Thái Hoa Sơn Vân Tiêu Động của Xích Tinh Tử, môn hạ Xiển Giáo.'],
    ['Thanh Phong Sơn', 'trung', 0.45, 'Thanh Phong Sơn Tử Dương Động của Thanh Hư Đạo Đức Chân Quân, sư phụ Hoàng Thiên Hóa.'],
    ['Kim Kê Lĩnh', 'trung', 0.3, 'Đèo ngoài Tị Thủy Quan, đầu phía đông của đất Tây Kỳ; ranh giới Thương – Chu.'],
    ['Thủ Dương Sơn', 'trung', 0.25, 'Núi giữa Kim Kê Lĩnh và Yến Sơn, nơi Bá Di, Thúc Tề chặn ngựa can vua.'],
    ['Bàn Khê', 'trung', 0.2, 'Bờ sông Vị ngoại ô Tây Kỳ, nơi Khương Tử Nha buông câu lưỡi thẳng.'],
    ['Tuyệt Long Lĩnh', 'trung', 0.55, 'Đèo trên đường Văn Thái Sư bại trận rút khỏi Tây Kỳ, nơi ông tử nạn.'],
    ['Hoàng Hoa Sơn', 'trung', 0.35, 'Sơn trại của bốn anh em Đặng Trung, Tân Hoàn, Trương Tiết, Đào Vinh trước khi theo Văn Trọng.'],
    ['Mục Dã', 'trung', 0.35, 'Bãi chiến trường ngoại ô Triều Ca, trận cuối diệt Thương.'],
    ['Hiên Viên Mộ', 'trung', 0.5, 'Mộ cổ ngoài cửa nam Triều Ca, hang của hồ ly ngàn năm, trĩ tinh và tỳ bà tinh.'],
    ['Thái Sơn', 'trung', 0.45, 'Đông Nhạc trong Đông Sơn Kinh; Hoàng Phi Hổ được phong Đông Nhạc Thái Sơn Đại Đế.'],
    ['Thái Hành Sơn', 'trung', 0.4, 'Núi vốn ở phía nam Ký Châu, bắc Hà Dương; Ngu Công dời núi, Thiên Đế sai hai con của Khoa Nga Thị cõng đặt sang phía đông đất Sóc.'],
    ['Cửu Cung Sơn', 'trung', 0.4, 'Cửu Cung Sơn Bạch Hạc Động của Phổ Hiền Chân Nhân, sư phụ Mộc Tra.'],
    ['Ngũ Long Sơn', 'trung', 0.4, 'Ngũ Long Sơn Vân Tiêu Động của Văn Thù Quảng Pháp Thiên Tôn, sư phụ Kim Tra.'],
    ['Nhị Tiên Sơn', 'trung', 0.4, 'Nhị Tiên Sơn Ma Cô Động của Hoàng Long Chân Nhân, môn hạ Xiển Giáo.'],
    ['Càn Nguyên Sơn', 'trung', 0.4, 'Càn Nguyên Sơn Kim Quang Động của Thái Ất Chân Nhân, sư phụ Na Tra; Na Tra qua lại giữa đây và Trần Đường Quan.'],
    ['Cửu Tiên Sơn', 'trung', 0.45, 'Cửu Tiên Sơn Đào Nguyên Động của Quảng Thành Tử, đại đệ tử Xiển Giáo.'],
    ['Kim Đình Sơn', 'trung', 0.4, 'Kim Đình Sơn Ngọc Ốc Động của Đạo Hạnh Thiên Tôn, môn hạ Xiển Giáo.'],
    ['Giáp Long Sơn', 'trung', 0.4, 'Giáp Long Sơn Phi Vân Động của Cụ Lưu Tôn, sư phụ Thổ Hành Tôn.'],
    ['Động Đình Sơn', 'trung', 0.35, 'Núi ở rìa nam Trung Thổ giữa các dòng Giang, Tương; hai con gái của Thiên Đế ở đây.'],
    ['Long Môn', 'trung', 0.5, 'Cửa đá trên sông Hà; cá chép vượt được thì hóa rồng.'],
    // Đông Thắng Thần Châu
    ['Thang Cốc', 'dong', 0.7, 'Hang nước sôi ở cực đông, nơi mười Kim Ô tắm; mặt trời mọc từ đây.'],
    ['Hàm Trì', 'dong', 0.6, 'Ao nơi mặt trời tắm trước khi lên, sát Thang Cốc.'],
    ['Đại Ngôn Sơn', 'dong', 0.5, 'Núi giữa Đại Hoang phía đông, nơi mặt trời mặt trăng mọc lên.'],
    ['Triều Dương Cốc', 'dong', 0.45, 'Hang của thần nước Thiên Ngô, tám đầu mặt người, tám chân tám đuôi.'],
    ['Hung Lê Thổ Khâu', 'dong', 0.75, 'Gò ở góc đông bắc Đại Hoang; Ứng Long ở cực nam gò này, sau khi giết Xi Vưu và Khoa Phụ không lên trời được nữa.'],
    ['Không Tang Sơn', 'dong', 0.4, 'Núi trong Đông Sơn Kinh, gần bờ Đông Hải.'],
    ['Đông Cực Sơn', 'dong', 0.8, 'Mép ngoài cùng phía đông của đất, có cửa Khai Minh; Thái Hạo và Câu Mang cai quản.'],
    // Tây Ngưu Hạ Châu
    ['Ngọc Sơn', 'tay', 0.7, 'Núi phía tây Côn Lôn, nơi Tây Vương Mẫu ở.'],
    ['Trường Lưu Sơn', 'tay', 0.5, 'Núi của Bạch Đế Thiếu Hạo trong Tây Sơn Kinh.'],
    ['Tam Nguy Sơn', 'tay', 0.55, 'Núi của ba con Thanh Điểu đưa tin cho Tây Vương Mẫu; cực tây của Tây phương.'],
    ['Thiên Sơn', 'tay', 0.6, 'Núi của thần Đế Giang — không mặt không mắt, biết ca múa.'],
    ['Lưu Sa Hà', 'tay', 0.5, 'Sông cát phía tây Côn Lôn, tám trăm dặm, lông ngỗng cũng chìm; ranh giới trước khi vào Tây Ngưu.'],
    ['Hỏa Diệm Sơn', 'tay', 0.75, 'Núi lửa tám trăm dặm giữa Tây Ngưu Hạ Châu; chỉ quạt Ba Tiêu mới dập được.'],
    ['Linh Thứu Sơn', 'tay', 0.45, 'Linh Thứu Sơn Nguyên Giác Động của Nhiên Đăng Đạo Nhân.'],
    ['Ngu Uyên', 'tay', 0.8, 'Vực ở cực tây nơi mặt trời lặn xuống.'],
    ['Yêm Tư Sơn', 'tay', 0.7, 'Núi cuối cùng của Tây Sơn Kinh, rìa tây nơi mặt trời vào.'],
    ['Thường Dương Sơn', 'tay', 0.65, 'Nơi Hình Thiên bị chặt đầu, lấy vú làm mắt, rốn làm miệng, vẫn cầm khiên rìu múa.'],
    ['Đăng Bảo Sơn', 'tay', 0.6, 'Núi nơi quần vu lên xuống trời.'],
    // Nam Thiệm Bộ Châu
    ['Vu Sơn', 'nam', 0.5, 'Núi trong Đại Hoang phía nam, kho thuốc của Thiên Đế.'],
    ['Đan Huyệt Sơn', 'nam', 0.55, 'Núi có phượng hoàng; vằn trên đầu là chữ Đức, trên cánh là Nghĩa.'],
    ['Thương Ngô Sơn', 'nam', 0.4, 'Núi có lăng vua Thuấn và Đan Chu.'],
    ['Địch Sơn', 'nam', 0.45, 'Núi có lăng vua Nghiêu và Đế Cốc.'],
    ['Trù Hoa Chi Dã', 'nam', 0.6, 'Đồng hoang nơi Hậu Nghệ giết Tạc Xỉ.'],
    ['Ngũ Di Sơn', 'nam', 0.4, 'Ngũ Di Sơn Bạch Vân Động của các tán nhân Kiều Khôn, Tiêu Thăng, Tào Bảo.'],
    ['Nam Cực Sơn', 'nam', 0.8, 'Mép ngoài cùng phía nam của đất, có cửa Thử Môn; Viêm Đế và Chúc Dung cai quản.'],
    // Bắc Câu Lô Châu
    ['Bất Chu Sơn', 'bac', 0.95, 'Cột chống trời ở tây bắc đã bị Cộng Công húc gãy; từ đó trời nghiêng về tây bắc, đất lún về đông nam.'],
    ['Chung Sơn', 'bac', 0.9, 'Núi của thần Chúc Long ngoài biển tây bắc: mở mắt là ngày, nhắm mắt là đêm.'],
    ['Thành Đô Tải Thiên Sơn', 'bac', 0.7, 'Núi trong Đại Hoang phía bắc, nơi Khoa Phụ thuộc dòng Hậu Thổ ở.'],
    ['Hệ Côn Sơn', 'bac', 0.7, 'Có đài Cộng Công; nơi Hạn Bạt, con gái Hoàng Đế, ở lại sau trận Xi Vưu.'],
    ['U Đô Sơn', 'bac', 0.9, 'Núi trong Bắc Hải ở cực bắc, cửa của cõi âm thời thượng cổ.'],
    ['Phụ Ngu Sơn', 'bac', 0.6, 'Núi giữa Đông Bắc Hải và Đại Hoang, có lăng Chuyên Húc và chín bà phi.'],
    ['Đại Trạch', 'bac', 0.4, 'Đầm nghìn dặm phía bắc Nhạn Môn, đàn chim thay lông ở đây.'],
  ],
  realms: [
    ['Kỳ Lân Nhai', 'trung', 0.85, 'Vách đá trước Ngọc Hư Cung trên Côn Lôn.'],
    ['Huyền Phố', 'trung', 0.9, 'Tầng thứ hai của Côn Lôn, trên Lương Phong; leo lên được thì hô mưa gọi gió.'],
    ['Phong Thần Đài', 'trung', 0.6, 'Đài dựng trên Kỳ Sơn cạnh Tây Kỳ; chân linh người tử trận Phong Thần bay về đây chờ sắc phong.'],
    ['Tử Tiêu Cung', 'trung', 0.97, 'Nơi Hồng Quân Đạo Tổ ngự; Tam Thanh từng nghe giảng ở đây.'],
    ['Phù Tang', 'dong', 0.9, 'Cây thần trên Thang Cốc; chín mặt trời đậu cành dưới, một mặt trời đậu cành trên.'],
    ['Kiến Mộc', 'tay', 0.9, 'Cây thần ở Đô Quảng, thang để chư thần lên xuống trời.'],
  ],
  isles: [
    ['Kim Ngao Đảo Thị', 'dong', 'market', 0, 'Chợ quanh Kim Ngao Đảo của tán tiên Tiệt Giáo.'],
    ['Bạch Lộc Đảo', 'dong', 'wild', 0.6, 'Đảo gần Kim Ngao Đảo, nơi Thập Thiên Quân luyện Thập Tuyệt Trận.'],
    ['Bồng Lai Đảo', 'dong', 'wild', 0.55, 'Một trong năm núi tiên ở Quy Khư, phía đông Bột Hải; luyện khí sĩ Bồng Lai ở đây.'],
    ['Phương Trượng Đảo', 'dong', 'wild', 0.6, 'Núi tiên giữa Đông Hải, nhiều rồng tụ.'],
    ['Doanh Châu', 'dong', 'wild', 0.6, 'Núi tiên giữa Đông Hải, có cỏ tiên và rượu ngọc.'],
    ['Quy Khư', 'dong', 'wild', 0.95, 'Vực không đáy phía đông Bột Hải, nước muôn sông đổ về; mười lăm con ngao cõng năm núi tiên.'],
    ['Lưu Ba Sơn', 'dong', 'wild', 0.7, 'Núi giữa Đông Hải cách bờ bảy nghìn dặm; thú Quỳ ra vào nước là có mưa gió.'],
    ['Độ Sóc Sơn', 'dong', 'wild', 0.65, 'Núi giữa Đông Hải có cây đào lớn; cửa quỷ ở phía đông bắc do Thần Đồ, Uất Lũy canh giữ.'],
    ['Phượng Lân Châu', 'tay', 'wild', 0.8, 'Đảo giữa Tây Hải có Nhược Thủy vây quanh; đàn phượng và lân ở đây.'],
    ['Tụ Quật Châu', 'tay', 'wild', 0.6, 'Đảo ở góc tây nam Tây Hải, chân tiên và linh quan tụ hội.'],
    ['Lưu Châu', 'tay', 'wild', 0.5, 'Đảo trong Tây Hải, nhiều tiên gia.'],
    ['Lạc Già Sơn', 'nam', 'wild', 0.5, 'Phổ Đà Sơn Lạc Già Động giữa Nam Hải, đạo tràng của Từ Hàng Đạo Nhân.'],
    ['Viêm Châu', 'nam', 'wild', 0.6, 'Đảo nóng trong Nam Hải, nhiều tiên gia.'],
    ['Trường Châu', 'nam', 'wild', 0.55, 'Đảo ở góc đông nam Nam Hải, còn gọi là Thanh Khâu.'],
    ['Cam Uyên', 'dong', 'wild', 0.6, 'Vực ngoài biển đông nam nơi Cam Thủy đọng lại; Hy Hòa tắm mặt trời ở đây.'],
    ['Huyền Châu', 'bac', 'wild', 0.7, 'Đảo ở góc tây bắc Bắc Hải, có Thái Huyền Đô.'],
    ['Nguyên Châu', 'bac', 'wild', 0.6, 'Đảo trong Bắc Hải, nhiều tiên gia.'],
    ['Thương Hải Đảo', 'bac', 'wild', 0.6, 'Đảo trong Bắc Hải, Cửu Lão Tiên Đô ở đây.'],
    ['Bắc Minh', 'bac', 'wild', 0.95, 'Biển tối ở cực bắc; cá Côn hóa chim Bằng bay về Nam Minh.'],
  ],
  empires: [
    ['Đại Thương', 'Triều Ca', 3, 'Thương Vương', 'Vương triều nhân tộc đóng đô ở Triều Ca; Tiệt Giáo đứng sau.'],
    ['Ký Châu', 'Ký Châu Thành', 1, 'Ký Châu Hầu', 'Chư hầu của nhà Thương do Tô Hộ cai quản.'],
    ['Tây Kỳ', 'Tây Kỳ Thành', 2, 'Tây Bá Hầu', 'Nhà Chu ở Tây Kỳ, được Xiển Giáo phò trợ.'],
    ['Đông Lỗ', 'Đông Lỗ Thành', 2, 'Đông Bá Hầu', 'Chư hầu phương đông do Khương Hoàn Sở cai quản.'],
    ['Nam Đô', 'Nam Đô Thành', 2, 'Nam Bá Hầu', 'Chư hầu phương nam do Ngạc Sùng Vũ cai quản.'],
    ['Sùng Quốc', 'Sùng Thành', 2, 'Bắc Bá Hầu', 'Chư hầu phương bắc do Sùng Hầu Hổ cai quản.'],
    ['Thanh Khâu Quốc', 'Thanh Khâu Thành', 2, 'Quốc chủ', 'Nước của hồ chín đuôi ở phương đông.'],
    ['Quân Tử Quốc', 'Quân Tử Thành', 2, 'Quốc chủ', 'Nước người quân tử ở Hải Ngoại phía đông.'],
    ['Đại Nhân Quốc', 'Đại Nhân Thành', 1, 'Quốc chủ', 'Nước người khổng lồ ở Hải Ngoại phía đông.'],
    ['Ngạo Lai Quốc', 'Ngạo Lai Thành', 2, 'Quốc vương', 'Nước phàm nhân ven biển Đông Thắng Thần Châu.'],
    ['Hắc Xỉ Quốc', 'Hắc Xỉ Thành', 1, 'Quốc chủ', 'Nước người răng đen phía nam Thang Cốc.'],
    ['Bạch Dân Quốc', 'Bạch Dân Thành', 2, 'Quốc chủ', 'Nước người tóc trắng ở Hải Ngoại phía tây.'],
    ['Hiên Viên Quốc', 'Hiên Viên Thành', 2, 'Quốc chủ', 'Nước dòng dõi Hoàng Đế ở Hải Ngoại phía tây.'],
    ['Nữ Tử Quốc', 'Nữ Tử Thành', 2, 'Nữ vương', 'Nước toàn nữ giới ở Hải Ngoại phía tây.'],
    ['Vu Hàm Quốc', 'Vu Hàm Thành', 1, 'Đại vu', 'Nước của quần vu ở Hải Ngoại phía tây.'],
    ['Vũ Dân Quốc', 'Vũ Dân Thành', 2, 'Quốc chủ', 'Nước người mọc lông vũ ở Hải Ngoại phía nam.'],
    ['Hoan Đâu Quốc', 'Hoan Đâu Thành', 2, 'Quốc chủ', 'Nước hậu duệ Hoan Đâu ở Hải Ngoại phía nam.'],
    ['Yếm Hỏa Quốc', 'Yếm Hỏa Thành', 1, 'Quốc chủ', 'Nước người phun lửa ở Hải Ngoại phía nam.'],
    ['Quán Hung Quốc', 'Quán Hung Thành', 1, 'Quốc chủ', 'Nước người ngực thủng ở Hải Ngoại phía nam.'],
    ['Bất Tử Quốc', 'Bất Tử Thành', 2, 'Quốc chủ', 'Nước người không chết ở Hải Ngoại phía nam.'],
    ['Nhất Mục Quốc', 'Nhất Mục Thành', 2, 'Quốc chủ', 'Nước người một mắt ở Hải Ngoại phía bắc.'],
    ['Bắc Hải Chư Hầu', 'Bắc Hải Thành', 2, 'Bắc Hải hầu', 'Bảy mươi hai lộ chư hầu Bắc Hải do Viên Phúc Thông cầm đầu.'],
    ['Chung Bắc Quốc', 'Chung Bắc Thành', 2, 'Quốc chủ', 'Nước ở phía bắc Bắc Hải.'],
  ],
  // nguồn ngoài Cửu Châu ít tên sông, nên Đông Thắng và Bắc Câu Lô có ít sông hơn các giới khác
  riverN: { trung: 10, dong: 3, tay: 6, nam: 7, bac: 3 },
  riverMajorN: { trung: 4, dong: 2, tay: 3, nam: 3, bac: 2 },
  rivers: [
    // Trung Thổ: Tứ Độc (Giang, Hà, Hoài, Tế) là sông lớn, rồi các sông trong Cửu Châu và sông Cửu Loan của Phong Thần
    'Trường Giang', 'Hoàng Hà', 'Hoài Thủy', 'Tế Thủy', 'Hán Thủy', 'Lạc Thủy', 'Cửu Loan Hà', 'Kinh Thủy', 'Tương Giang', 'Vị Thủy',
    // Đông Thắng: sông của Đại Hoang Đông Kinh (Cam Thủy đọng thành Cam Uyên; Dung Thủy ra từ núi Chiêu Dao; Dương Thủy ra từ núi Duật Sơn)
    'Cam Thủy', 'Dung Thủy', 'Dương Thủy',
    // Tây Ngưu: sông phía tây Côn Lôn (Đào Thủy ra từ Lạc Du Sơn chảy về tây, Anh Thủy ra từ Thiên Sơn chảy về tây nam,
    // Tuân Thủy ra từ gò Hiên Viên chảy về nam) là sông lớn; sông Tây Du là sông nhỏ (phủ dưới Thông Thiên Hà là của lão Ngoan, không có Long Cung)
    'Đào Thủy', 'Anh Thủy', 'Tuân Thủy', 'Thông Thiên Hà', 'Hắc Thủy Hà', 'Tử Mẫu Hà',
    // Nam Thiệm: Xích Thủy, Thanh Thủy, Hắc Thủy từ Côn Lôn đổ Nam Hải; các sông của Đại Hoang Nam Kinh
    'Xích Thủy', 'Thanh Thủy', 'Hắc Thủy', 'Vinh Thủy', 'Hất Thủy', 'Phiêu Thủy', 'Bạch Thủy',
    // Bắc Câu Lô: sông của Đại Hoang Bắc Kinh và Bắc Hải
    'Thuận Thủy', 'Xà Thủy', 'Xích Trạch Thủy',
  ],
  gates: {
    thiendinh: ['Xiển Giáo · Ngọc Hư Cung', undefined, 'Bậc mây sau Ngọc Hư Cung trên Côn Lôn, hạ đô của Thiên Đế; hết chín vạn bậc là Nam Thiên Môn.'], // Côn Lôn nối thẳng lên trời
    yeugioi: ['Yêu Đình', 'Yêu Hoàng', 'Cổng đá khắc vạn hình thú sau điện của Đế Tuấn, Thái Nhất ở Yêu Đình.'],
    linhson: ['Tây Phương Giáo', undefined, 'Cột Phật quang sau Bát Đức Trì ở Tây Phương Cực Lạc; Tiếp Dẫn, Chuẩn Đề độ người hữu duyên lên Linh Sơn.'],
    diaphu: ['Vu Tộc · Bàn Cổ Điện', undefined, 'Khe nứt sau Bàn Cổ Điện dưới chân Bất Chu Sơn; Hậu Thổ hóa luân hồi, đi xuống là Quỷ Môn Quan.'], // Hậu Thổ hóa luân hồi
  },
  // Long Vương sông: bỏ Ngao Bính (tam thái tử Đông Hải, đã lên Phong Thần Bảng) và Ngao Liệt (Tiểu Bạch Long của Tây Du)
  riverKings: ['Ngao Minh', 'Ngao Tuấn', 'Ngao Dật', 'Ngao Hạo', 'Ngao Tĩnh', 'Ngao Lăng', 'Ngao Ly', 'Ngao Chấn', 'Ngao Thanh', 'Ngao Hồng', 'Ngao Nhiên', 'Ngao Khải', 'Ngao Vân', 'Ngao Túc'],
  // Thủy Tinh Cung Đông Hải ở eo biển ngoài cửa Cửu Loan (Na Tra rửa vòng làm rung long cung)
  seaPins: { dong: ['dong', -1.25, 0.05] },
  // ải của nhà Thương nằm cả ở châu chư hầu; chợ Kim Ngao Đảo trực thuộc Tiệt Giáo
  regAt: {
    'Yếm Hỏa Thành': 0, 'Quán Hung Thành': 0, 'Đăng Bảo Sơn': 0, // Hải Ngoại Kinh
    'Vu Sơn': 1, 'Hung Lê Thổ Khâu': 1, 'Hệ Côn Sơn': 1, // Đại Hoang Kinh
  },
  owners: {
    'Mãnh Trì': 'Đại Thương', 'Lâm Đồng Quan': 'Đại Thương', 'Đồng Quan': 'Đại Thương', 'Xuyên Vân Quan': 'Đại Thương', 'Giới Bài Quan': 'Đại Thương',
    'Tị Thủy Quan': 'Đại Thương', 'Thanh Long Quan': 'Đại Thương', 'Giai Mộng Quan': 'Đại Thương', 'Du Hồn Quan': 'Đại Thương', 'Trần Đường Quan': 'Đại Thương',
    'Tam Sơn Quan': 'Đại Thương', 'Dữu Lý': 'Đại Thương', 'Bạch Liễu Thôn': 'Tây Kỳ', 'Kim Ngao Đảo Thị': 'Tiệt Giáo · Bích Du Cung',
  },
  // Dòng chảy theo cổ thư: Tứ Độc (Giang, Hà, Hoài, Tế) đều chảy về biển đông; Hoàng Hà ra từ Côn Lôn, qua giữa Mãnh Trì và
  // Mạnh Tân (bến bờ bắc), chảy phía nam Triều Ca; Vị Thủy qua Tây Kỳ đổ vào Hà; sông Cửu Loan qua Trần Đường Quan ra cửa Đông Hải.
  riverPaths: {
    // Trung Thổ, bắc → nam: Tế, Hà, Hoài, Giang đều chảy về biển đông.
    // Hoàng Hà ra từ Côn Lôn, chảy phía bắc Lâm Đồng Quan, qua giữa Mạnh Tân (bờ bắc) và Mãnh Trì (bờ nam), rồi vòng phía nam Triều Ca.
    'Trường Giang': [['trung', -0.5, 0.42], ['trung', -0.2, 0.52], ['trung', 0.1, 0.64], ['trung', 0.36, 0.72], ['trung', 0.55, 0.84], ['trung', 0.66, 0.97]],
    'Hoàng Hà': [['trung', -0.56, -0.5], ['trung', -0.42, -0.44], ['trung', -0.3, -0.36], ['trung', -0.2, -0.08], ['trung', -0.08, 0.05], ['trung', 0.05, 0.3], ['trung', 0.2, 0.5], ['trung', 0.45, 0.45], ['trung', 0.8, 0.4], ['trung', 1.16, 0.4]],
    'Hoài Thủy': [['trung', 0.24, 0.58], ['trung', 0.46, 0.57], ['trung', 0.75, 0.54], ['trung', 1.04, 0.58]],
    'Tế Thủy': [['trung', -0.02, -0.38], ['trung', 0.25, -0.3], ['trung', 0.5, -0.3], ['trung', 0.78, -0.4], ['trung', 1.04, -0.46]],
    'Hán Thủy': [['trung', -0.32, 0.3], ['trung', -0.16, 0.4], ['trung', -0.02, 0.52], ['trung', 0.1, 0.64]],
    'Lạc Thủy': [['trung', -0.16, 0.36], ['trung', -0.06, 0.3], ['trung', 0.04, 0.26]],
    'Kinh Thủy': [['trung', -0.84, -0.26], ['trung', -0.76, -0.02], ['trung', -0.72, 0.21]],
    'Tương Giang': [['trung', 0.24, 0.92], ['trung', 0.3, 0.82], ['trung', 0.36, 0.72]],
    'Vị Thủy': [['trung', -0.9, -0.08], ['trung', -0.86, 0.06], ['trung', -0.82, 0.22], ['trung', -0.72, 0.24], ['trung', -0.6, 0.16], ['trung', -0.5, 0.0], ['trung', -0.38, -0.39]],
    'Cửu Loan Hà': [['trung', 0.66, 0.1], ['trung', 0.74, 0.16], ['trung', 0.8, 0.22], ['trung', 0.92, 0.24], ['trung', 1.1, 0.25]],
    // Đông Thắng: Cam Thủy đọng thành Cam Uyên ngoài biển đông nam
    'Cam Thủy': [['dong', 0.05, 0.4], ['dong', 0.25, 0.62], ['dong', 0.45, 0.85], ['dong', 0.62, 1.06]],
    // Tây Ngưu: Anh Thủy từ Thiên Sơn về tây nam; Tuân Thủy từ gò Hiên Viên về nam
    'Anh Thủy': [['tay', -0.4, -0.68], ['tay', -0.54, -0.52], ['tay', -0.7, -0.38], ['tay', -0.98, -0.24]],
    'Tuân Thủy': [['tay', 0.22, -0.02], ['tay', 0.3, 0.2], ['tay', 0.36, 0.45], ['tay', 0.42, 0.72], ['tay', 0.46, 1.0]],
    // Tây Du đi về tây: Ngũ Trang Quán → Hắc Thủy Hà → Thông Thiên Hà (Trần Gia Trang bờ đông) → Tử Mẫu Hà (bờ tây) → Hỏa Diệm Sơn → Linh Sơn
    'Thông Thiên Hà': [['tay', -0.03, 0.16], ['tay', -0.08, 0.31], ['tay', -0.05, 0.46], ['tay', -0.18, 0.59], ['tay', -0.31, 0.72], ['tay', -0.42, 0.86], ['tay', -0.46, 1.02]],
    'Hắc Thủy Hà': [['tay', 0.24, 0.06], ['tay', 0.2, 0.18], ['tay', 0.12, 0.28], ['tay', 0.0, 0.34], ['tay', -0.06, 0.38]],
    'Tử Mẫu Hà': [['tay', -0.4, 0.36], ['tay', -0.32, 0.46], ['tay', -0.24, 0.54], ['tay', -0.18, 0.59]],
  },
  pins: {
    // ---- Trung Thổ ----
    // Ký Châu (lõi): Triều Ca ở phía đông trục, Mạnh Tân bến Hoàng Hà phía tây Triều Ca
    'Triều Ca': ['trung', 0.18, 0.02], 'Ký Châu Thành': ['trung', 0.05, -0.27], 'Dữu Lý': ['trung', 0.1, -0.16],
    'Mạnh Tân': ['trung', -0.06, -0.06], 'Tống Gia Trang': ['trung', 0.34, 0.2], 'Mục Dã': ['trung', 0.34, -0.12],
    'Hiên Viên Mộ': ['trung', 0.18, 0.28],
    // trục Triều Ca → Tây Kỳ: Mãnh Trì, Ngũ Quan, Kim Kê Lĩnh, Thủ Dương Sơn, Bạch Liễu Thôn, Tây Kỳ
    'Mãnh Trì': ['trung', -0.2, 0.08], 'Lâm Đồng Quan': ['trung', -0.28, -0.25], 'Đồng Quan': ['trung', -0.35, 0.36],
    'Xuyên Vân Quan': ['trung', -0.42, 0.08], 'Giới Bài Quan': ['trung', -0.49, -0.25], 'Tị Thủy Quan': ['trung', -0.55, 0.38],
    'Kim Kê Lĩnh': ['trung', -0.62, 0.08], 'Thủ Dương Sơn': ['trung', -0.66, -0.3], 'Bạch Liễu Thôn': ['trung', -0.74, 0.4],
    'Tây Kỳ Thành': ['trung', -0.8, -0.12], 'Phong Thần Đài': ['trung', -0.76, 0.14], 'Bàn Khê': ['trung', -0.84, 0.3],
    'Ngọc Tuyền Sơn': ['trung', -0.7, -0.6], 'Thanh Long Quan': ['trung', -0.17, 0.52], 'Tuyệt Long Lĩnh': ['trung', -0.47, 0.66],
    'Thanh Phong Sơn': ['trung', 0.3, 0.82], 'Thái Hoa Sơn': ['trung', -0.06, -0.7], 'Chung Nam Sơn': ['trung', -0.76, -0.42],
    // Côn Lôn ở tây bắc Hải Nội
    'Xiển Giáo · Ngọc Hư Cung': ['trung', -0.42, -0.6], 'Kỳ Lân Nhai': ['trung', -0.36, -0.68], 'Huyền Phố': ['trung', -0.5, -0.4],
    'Côn Lôn Hư': ['trung', -0.58, -0.62], 'Nhược Thủy': ['trung', -0.5, -0.74], 'Viêm Hỏa Sơn': ['trung', -0.25, -0.62],
    'Không Động Sơn': ['trung', -0.22, -0.4], 'Giai Mộng Quan': ['trung', -0.12, -0.24],
    // Tế Châu (bắc)
    'Sùng Thành': ['trung', -0.02, -0.52], 'Đạo Giáo · Bát Cảnh Cung': ['trung', 0.22, -0.62], 'Tử Tiêu Cung': ['trung', 0.0, -0.82],
    'Thái Hành Sơn': ['trung', 0.2, -0.36], 'Nhị Tiên Sơn': ['trung', 0.45, -0.62], 'Hoàng Hoa Sơn': ['trung', -0.3, 0.7], 'Long Môn': ['trung', -0.34, -0.38],
    // Dương Châu (đông): Đông Lỗ, Du Hồn Quan, Trần Đường Quan ven Đông Hải
    'Du Hồn Quan': ['trung', 0.46, -0.08], 'Đông Lỗ Thành': ['trung', 0.66, -0.18], 'Thái Sơn': ['trung', 0.6, -0.44],
    'Cửu Cung Sơn': ['trung', 0.76, -0.3], 'Trần Đường Quan': ['trung', 0.8, 0.2], 'Khô Lâu Sơn · Bạch Cốt Động': ['trung', 0.66, 0.42],
    'Càn Nguyên Sơn': ['trung', 0.5, 0.3], 'Ngũ Long Sơn': ['trung', 0.6, 0.06], 'Giáp Long Sơn': ['trung', 0.76, -0.04],
    // Thứ Châu (nam)
    'Tam Sơn Quan': ['trung', 0.08, 0.42], 'Nam Đô Thành': ['trung', 0.14, 0.64], 'Hỏa Vân Động': ['trung', -0.02, 0.66],
    'Động Đình Sơn': ['trung', 0.36, 0.62], 'Cửu Tiên Sơn': ['trung', 0.12, 0.84], 'Kim Đình Sơn': ['trung', 0.48, 0.48],
    // ---- Đông Thắng Thần Châu (bắc → nam) ----
    'Thanh Khâu Thành': ['dong', -0.2, -0.42], 'Triều Dương Cốc': ['dong', 0.1, -0.12], 'Hung Lê Thổ Khâu': ['dong', -0.2, -0.72],
    'Không Tang Sơn': ['dong', -0.45, -0.3], 'Hàm Trì': ['dong', 0.0, -0.88], 'Đông Cực Sơn': ['dong', 0.72, -0.15],
    'Quân Tử Thành': ['dong', -0.3, 0.18], 'Đại Ngôn Sơn': ['dong', 0.45, 0.05], 'Thang Cốc': ['dong', 0.3, -0.78], 'Phù Tang': ['dong', 0.55, -0.6],
    'Đại Nhân Thành': ['dong', -0.3, 0.5], 'Hắc Xỉ Thành': ['dong', 0.15, -0.56], 'Ngạo Lai Thành': ['dong', 0.72, 0.5],
    // ---- Tây Ngưu Hạ Châu (bắc → nam; nx dương là phía Côn Lôn) ----
    'Bạch Dân Thành': ['tay', 0.05, -0.6], 'Ngọc Sơn': ['tay', 0.5, -0.45], 'Thiên Sơn': ['tay', -0.4, -0.72], 'Tam Nguy Sơn': ['tay', -0.1, -0.78],
    'Trường Lưu Sơn': ['tay', 0.15, -0.5], 'Yêm Tư Sơn': ['tay', -0.62, -0.5], 'Ngu Uyên': ['tay', -0.74, -0.22],
    'Hiên Viên Thành': ['tay', 0.2, -0.08], 'Lưu Sa Hà': ['tay', 0.6, 0.05], 'Phương Thốn Sơn · Tam Tinh Động': ['tay', -0.35, -0.12],
    'Tây Phương Giáo': ['tay', -0.7, 0.1], 'Hỏa Diệm Sơn': ['tay', -0.38, 0.18], 'Ngũ Trang Quán': ['tay', 0.35, 0.25],
    'Trần Gia Trang': ['tay', 0.1, 0.42], 'Linh Thứu Sơn': ['tay', -0.5, 0.34], 'Thường Dương Sơn': ['tay', 0.0, 0.84],
    'Nữ Tử Thành': ['tay', 0.25, 0.5], 'Vu Hàm Thành': ['tay', -0.12, 0.66], 'Đăng Bảo Sơn': ['tay', -0.45, 0.62], 'Kiến Mộc': ['tay', 0.5, 0.56],
    // ---- Nam Thiệm Bộ Châu (tây → đông) ----
    'Nga Mi Sơn · La Phù Động': ['nam', -0.7, -0.22], 'Vu Sơn': ['nam', -0.5, -0.42], 'Vũ Dân Thành': ['nam', -0.55, 0.12], 'Cao Lão Trang': ['nam', -0.75, 0.25],
    'Mai Sơn': ['nam', -0.36, 0.45], 'Trù Hoa Chi Dã': ['nam', 0.66, 0.28],
    'Đan Huyệt Sơn': ['nam', -0.12, -0.4], 'Hoan Đâu Thành': ['nam', 0.0, 0.08], 'Ngũ Di Sơn': ['nam', -0.12, 0.5], 'Thương Ngô Sơn': ['nam', 0.45, -0.45],
    'Yếm Hỏa Thành': ['nam', 0.2, 0.42], 'Nam Cực Sơn': ['nam', 0.02, 0.8],
    'Bất Tử Thành': ['nam', 0.55, 0.0], 'Quán Hung Thành': ['nam', 0.45, 0.45], 'Địch Sơn': ['nam', 0.72, -0.28],
    // ---- Bắc Câu Lô Châu (tây → đông; ny âm là phía cực bắc) ----
    'Bất Chu Sơn': ['bac', -0.74, 0.18], 'Chung Sơn': ['bac', -0.76, -0.28], 'Vu Tộc · Bàn Cổ Điện': ['bac', -0.55, -0.05], 'Nhất Mục Thành': ['bac', -0.42, 0.3],
    'Thành Đô Tải Thiên Sơn': ['bac', -0.3, -0.42], 'Hệ Côn Sơn': ['bac', -0.1, -0.2], 'U Đô Sơn': ['bac', 0.05, -0.72], 'Bắc Hải Thành': ['bac', 0.05, 0.3],
    'Yêu Đình': ['bac', 0.42, -0.4], 'Bắc Minh': ['bac', 0.45, -1.45], 'Chung Bắc Thành': ['bac', 0.5, 0.12], 'Phụ Ngu Sơn': ['bac', 0.78, 0.1], 'Đại Trạch': ['bac', 0.28, 0.42],
    // ---- Đảo: Đông Hải giữa Trung Thổ và Đông Thắng (Kim Ngao, Bạch Lộc...), ngoài khơi đông (Quy Khư, ngũ thần sơn) ----
    'Tiệt Giáo · Bích Du Cung': ['dong', -1.35, 0.55], 'Kim Ngao Đảo Thị': ['dong', -1.25, 0.75], 'Bạch Lộc Đảo': ['dong', -1.3, 0.3],
    'Tam Tiên Đảo': ['dong', -1.35, -0.72], 'Hoa Quả Sơn · Thủy Liêm Động': ['dong', 1.28, 0.62],
    'Bồng Lai Đảo': ['dong', 1.25, -0.62], 'Phương Trượng Đảo': ['dong', 1.4, -0.3], 'Doanh Châu': ['dong', 1.45, 0.05],
    'Quy Khư': ['dong', 1.55, 0.3], 'Lưu Ba Sơn': ['dong', 1.35, 0.95], 'Độ Sóc Sơn': ['dong', 1.1, -0.95],
    'Cửu Long Đảo': ['tay', -1.35, -0.3], 'Phượng Lân Châu': ['tay', -1.45, 0.15], 'Tụ Quật Châu': ['tay', -1.25, 0.75], 'Lưu Châu': ['tay', 1.35, -0.75],
    'Hỏa Long Đảo': ['nam', -0.6, 1.4], 'Lạc Già Sơn': ['nam', 0.1, 1.45], 'Viêm Châu': ['nam', -0.15, 1.5], 'Trường Châu': ['nam', 0.6, 1.4], 'Cam Uyên': ['dong', 0.64, 1.14],
    'Huyền Châu': ['bac', -0.75, -1.4], 'Nguyên Châu': ['bac', 0.0, -1.5], 'Thương Hải Đảo': ['bac', 0.7, -1.4],
  },
  beasts: [
    ['Kim Giác Lộc', 'quang', 0, 0.25], ['Hồng Hoang Cự Tượng', 'tho', 0, 0.3], ['Hồng Hoang Hung Lang', 'am', 0.1, 0.4], ['Hỏa Nha', 'hoa', 0.2, 0.45],
    ['Tất Phương', 'hoa', 0.3, 0.6], ['Phi Liêm', 'phong', 0.4, 0.7], ['Vô Chi Kỳ', 'thuy', 0.45, 0.75], ['Cửu Anh', 'thuy', 0.55, 0.85],
    ['Đào Ngột', 'am', 0.6, 0.9], ['Thao Thiết', 'tho', 0.65, 0.95], ['Lôi Thú Hồng Hoang', 'loi', 0.5, 0.8], ['Kim Cương Viên', 'kim', 0.35, 0.65],
  ],
  lineage: [
    ['Côn Bằng', 'thuy', 20, 'Bắc Minh', 'Ở biển là Côn, lên trời là Bằng. Cánh như mây che trời — nhưng huyết mạch không sánh được thánh thú Hỗn Độn.'],
    ['Thanh Loan', 'phong', 20, 'Côn Lôn Hư', 'Loan điểu xanh, một trong chín hậu duệ do Phượng Hoàng sinh. Hồng Hoang không chứa nổi Chân Phượng, chỉ còn hậu duệ phượng tộc.'],
    ['Bạch Trạch', 'quang', 19, 'Không Tang Sơn', 'Thần thú biết tiếng người, thông hiểu vạn vật; Hoàng Đế gặp nó ở bờ Đông Hải.'],
    ['Kim Ô', 'hoa', 19, 'Thang Cốc', 'Chim lửa ba chân. Mười con từng cùng bay lên — nay chỉ còn một.'],
    ['Tù Ngưu', 'kim', 19, 'Bất Chu Sơn', 'Con đầu của Long sinh cửu tử, mê âm luật.'],
    ['Nhai Tí', 'kim', 19, 'Côn Lôn Hư', 'Con thứ hai, mắt hung, hay giết chóc.'],
    ['Trào Phong', 'phong', 18, 'Chung Sơn', 'Con thứ ba, thích chỗ hiểm, đứng trên đỉnh cao nhìn xuống.'],
    ['Bồ Lao', 'thuy', 18, 'Lưu Ba Sơn', 'Con thứ tư, tiếng kêu vang như chuông lớn.'],
    ['Toan Nghê', 'hoa', 18, 'Hỏa Diệm Sơn', 'Con thứ năm, hình sư tử, mê khói hương.'],
    ['Bá Hạ', 'tho', 19, 'Quy Khư', 'Con thứ sáu, hình rùa, cõng nổi cả núi.'],
    ['Bệ Ngạn', 'am', 18, 'Lưu Sa Hà', 'Con thứ bảy, hình hổ, thích kiện tụng phân xử.'],
    ['Phụ Hí', 'thuy', 18, 'Động Đình Sơn', 'Con thứ tám, mê văn chương thư pháp.'],
    ['Si Vẫn', 'thuy', 19, 'Long Môn', 'Con thứ chín, nuốt được lửa, trấn được nước.'],
  ],
  scale: { trung: 1.12, outer: 1.02 },
};

const HONDON: Theme = {
  syll: ['Hồng Mông', 'Hỗn Nguyên', 'Thái Sơ', 'Thái Thủy', 'Thái Tố', 'Thái Dịch', 'Vô Cực', 'Thái Cực', 'Tạo Hóa', 'Hư Vô', 'Tịch Diệt', 'Luân Hồi', 'Nhân Quả', 'Thời Không', 'Vạn Tượng', 'Bất Hủ', 'Vĩnh Hằng', 'Nguyên Sơ', 'Khai Thiên', 'Bàn Cổ', 'Đạo Nguyên', 'Pháp Tắc', 'Sinh Diệt', 'Âm Dương', 'Ngũ Hành', 'Vận Mệnh', 'Thiên Đạo', 'Hư Không', 'Hỗn Mang', 'Thánh Đạo'],
  vuc: {
    trung: ['Hỗn Độn Trung Nguyên', 'Đại lục lớn nhất trôi giữa hỗn độn, nơi Bàn Cổ khai thiên còn lưu dấu.'],
    dong: ['Thái Sơ Vực', 'Khí thái sơ chưa tan, vạn vật vừa mới thành hình.'],
    tay: ['Thái Thủy Vực', 'Hình tượng sơ khai, sông hỗn độn chảy ngược.'],
    nam: ['Thái Tố Vực', 'Đất đá đều là đạo tắc ngưng kết.'],
    bac: ['Thái Dịch Vực', 'Khí chưa phân, càng đi về bắc càng không phân được trên dưới.'],
  },
  seas: ['HỒNG MÔNG HẢI', 'HỖN NGUYÊN HẢI', 'HƯ VÔ HẢI', 'TỊCH DIỆT HẢI'],
  chau: {
    trung: ['Khai Thiên Châu', 'Hồng Mông Châu', 'Hỗn Nguyên Châu', 'Thái Sơ Châu', 'Thái Thủy Châu'],
    dong: ['Sơ Sinh Châu', 'Thanh Khí Châu', 'Vạn Tượng Châu'],
    tay: ['Thủy Hình Châu', 'Nghịch Hà Châu', 'Tạo Hóa Châu'],
    nam: ['Tố Chất Châu', 'Đạo Thạch Châu', 'Pháp Tắc Châu'],
    bac: ['Dịch Khí Châu', 'Vô Cực Châu', 'Tịch Diệt Châu'],
  },
  regions: {
    trung: [['Bàn Cổ Di Hài', 'Xương cốt Bàn Cổ hóa thành núi, máu hóa thành sông.'], ['Hồng Mông Thánh Nguyên', 'Đồng bằng tử khí hồng mông.']],
    dong: [['Thái Sơ Khí Hải', 'Biển khí thái sơ.'], ['Vạn Tượng Lâm', 'Rừng mà mỗi cây là một hình tượng của đạo.']],
    tay: [['Nghịch Lưu Hỗn Độn Hà', 'Sông hỗn độn chảy ngược về nguồn.'], ['Tạo Hóa Trì', 'Ao tạo hóa, vạn vật sinh từ đây.']],
    nam: [['Đạo Thạch Hoang Nguyên', 'Đồng đá đạo văn.'], ['Pháp Tắc Liệt Cốc', 'Hẻm vực nứt theo đường pháp tắc.']],
    bac: [['Vô Cực Hư Không', 'Hư không không có cực.'], ['Tịch Diệt Băng Nguyên', 'Băng nguyên của sự tịch diệt.']],
  },
  sects: [
    ['Hồng Mông Đạo Cung', 'trung', 4, ['quang', 'kim', 'thuy', 'hoa', 'tho'], 'Đạo cung giữ một sợi tử khí hồng mông.', 'Đạo sinh nhất.', 'alch'],
    ['Hỗn Nguyên Thánh Điện', 'trung', 4, ['am', 'quang', 'loi'], 'Thánh điện của những người hợp đạo.', 'Hỗn nguyên quy nhất.', 'talis'],
    ['Khai Thiên Thần Môn', 'nam', 4, ['kim', 'tho', 'hoa'], 'Thần môn giữ mảnh vỡ Khai Thiên Phủ.', 'Một búa mở trời.', 'forge'],
    ['Thái Sơ Đạo Tông', 'dong', 3, ['moc', 'thuy', 'phong'], 'Đạo tông tu khí thái sơ.', 'Trở về ban đầu.', 'alch'],
    ['Tạo Hóa Cung', 'tay', 3, ['moc', 'thuy', 'quang'], 'Cung bên ao tạo hóa.', 'Tạo hóa vô cùng.', 'alch'],
    ['Tịch Diệt Ma Điện', 'bac', 3, ['am', 'bang'], 'Ma điện tu đạo tịch diệt.', 'Vạn vật quy không.', 'talis', true],
    ['Vạn Tượng Các', 'dong', 2, ['phong', 'quang'], 'Lầu các ghi chép vạn tượng.', 'Thấy tượng biết đạo.', 'talis'],
    ['Đạo Thạch Môn', 'nam', 2, ['tho', 'kim'], 'Tông môn khắc đạo văn lên đá.', 'Đá không nói dối.', 'forge'],
    ['Hư Vô Tông', 'bac', 2, ['am', 'phong'], 'Tông môn tu hư vô.', 'Có tức là không.', 'talis'],
    ['Nghịch Hà Phái', 'tay', 1, ['thuy'], 'Phái bơi ngược sông hỗn độn.', 'Ngược dòng mới thấy nguồn.', 'forge'],
    ['Hỗn Độn Liệp Thú Minh', 'nam', 1, ['kim', 'hoa'], 'Liên minh săn thú hỗn độn.', 'Thú càng hung, giá càng cao.', 'forge'],
    ['Thanh Khí Quán', 'dong', 1, ['moc', 'phong'], 'Đạo quán nhỏ tu thanh khí.', 'Nhẹ thì lên.', 'alch'],
  ],
  towns: [
    ['Khai Thiên Thành', 'trung', 'Thành xây quanh vết búa Khai Thiên.', 'auction'],
    ['Hồng Mông Thành', 'trung', 'Thành dưới tử khí.'],
    ['Thái Sơ Thành', 'dong', 'Thành của khí đầu tiên.'],
    ['Nghịch Hà Thành', 'tay', 'Thành bên sông chảy ngược.'],
    ['Đạo Thạch Thành', 'nam', 'Thành đá đạo văn, lò rèn từ đạo tắc.', 'forge'],
    ['Vô Cực Thành', 'bac', 'Thành lơ lửng giữa hư không.'],
    ['Vạn Tượng Trấn', 'dong', 'Trấn trong rừng vạn tượng.'],
    ['Tạo Hóa Trấn', 'tay', 'Trấn bên ao tạo hóa.'],
    ['Tịch Diệt Trấn', 'bac', 'Trấn sắp bị băng nuốt.'],
  ],
  villages: [
    ['Bàn Cổ Cước Thôn', 'trung', 'Thôn trong hốc xương Bàn Cổ.'],
    ['Sơ Sinh Thôn', 'dong', 'Thôn của những sinh linh mới thành hình.'],
    ['Hà Ngạn Thôn', 'tay', 'Thôn bờ sông hỗn độn.'],
    ['Thạch Nhân Thôn', 'nam', 'Thôn của người đá.'],
    ['Hư Không Thôn', 'bac', 'Thôn treo giữa hư không.'],
  ],
  markets: [
    ['Hỗn Độn Bảo Khố', 'trung', 'Chợ bảo vật hỗn độn — linh bảo tiên thiên có giá.'],
    ['Thái Sơ phường thị', 'dong', 'Chợ khí thái sơ.'],
    ['Đạo Thạch phường thị', 'nam', 'Chợ đạo thạch.'],
    ['Vô Cực phường thị', 'bac', 'Chợ trong hư không.'],
  ],
  wilds: [
    ['Hỗn Độn Biên Hoang', 'trung', 0.15, 'Rìa đại lục, hỗn độn tràn vào.'],
    ['Bàn Cổ Hài Cốt Sơn', 'trung', 0.7, 'Núi xương Bàn Cổ.'],
    ['Thôn Thiên Thú Quật', 'trung', 0.9, 'Hang của cự thú nuốt trời.'],
    ['Vạn Tượng Lâm', 'dong', 0.35, 'Rừng vạn tượng.'],
    ['Thái Sơ Khí Hải', 'dong', 0.6, 'Biển khí thái sơ.'],
    ['Nghịch Lưu Hà', 'tay', 0.5, 'Sông chảy ngược.'],
    ['Tổ Long Uyên', 'tay', 0.95, 'Vực nơi Tổ Long cuộn mình ngủ — mỗi hơi thở là một trận bão hỗn độn.'],
    ['Đạo Thạch Hoang Nguyên', 'nam', 0.4, 'Đồng đá đạo văn.'],
    ['Pháp Tắc Liệt Cốc', 'nam', 0.65, 'Hẻm vực pháp tắc.'],
    ['Bất Tử Hỏa Sơn', 'nam', 0.95, 'Núi lửa bất tử, nơi Chân Phượng niết bàn.'],
    ['Tịch Diệt Băng Nguyên', 'bac', 0.25, 'Băng nguyên tịch diệt.'],
    ['Thủy Kỳ Lân Đàm', 'bac', 0.9, 'Đầm nước đen, Thủy Kỳ Lân trấn giữ.'],
  ],
  realms: [
    ['Hồng Mông Tử Khí Địa', 'trung', 0.95, 'Nơi một sợi tử khí hồng mông lộ ra.'],
    ['Khai Thiên Phủ Di Tích', 'nam', 0.85, 'Mảnh vỡ của búa khai thiên.'],
    ['Tạo Hóa Ngọc Điệp Đài', 'tay', 0.9, 'Đài đặt Tạo Hóa Ngọc Điệp xưa.'],
  ],
  isles: [
    ['Hồng Mông Đảo', 'dong', 'wild', 0.7, 'Đảo trôi trong biển hồng mông.'],
    ['Hỗn Nguyên Hải Thị', 'nam', 'market', 0, 'Chợ trôi trên biển hỗn nguyên.'],
    ['Hư Vô Đảo', 'tay', 'wild', 0.75, 'Đảo lúc có lúc không.'],
    ['Tịch Diệt Đảo', 'bac', 'wild', 0.8, 'Đảo băng tịch diệt.'],
    ['Thái Sơ Đảo', 'dong', 'wild', 0.5, 'Đảo khí thái sơ.'],
  ],
  empires: [
    ['Hỗn Độn Thiên Triều', 'Khai Thiên Thành', 3, 'Hỗn Độn Đế', 'Thiên triều của các thánh tộc, chỉ cúi đầu trước Đại Đạo.'],
    ['Thái Sơ Thánh Quốc', 'Thái Sơ Thành', 2, 'Thái Sơ Vương', 'Thánh quốc ở Thái Sơ Vực.'],
  ],
  beasts: [
    ['Thái Sơ Thần Lộc', 'quang', 0, 0.3], ['Hỗn Độn Ma Viên', 'tho', 0, 0.4], ['Hỗn Độn Thanh Liên Yêu', 'moc', 0.1, 0.4], ['Thời Không Trùng', 'am', 0.2, 0.55],
    ['Đạo Văn Hổ', 'kim', 0.3, 0.6], ['Phong Ma Ưng', 'phong', 0.35, 0.65], ['Hư Không Kình', 'thuy', 0.4, 0.75], ['Hỗn Độn Hỏa Quỷ', 'hoa', 0.45, 0.75],
    ['Tịch Diệt Băng Tằm', 'bang', 0.5, 0.8], ['Pháp Tắc Lôi Thú', 'loi', 0.55, 0.85],
    ['Hỗn Độn Thao Thiết', 'tho', 0.65, 0.95], ['Hỗn Độn Đào Ngột', 'am', 0.65, 0.95],
  ],
  lineage: [
    ['Tổ Long', 'thuy', 20, 'Tổ Long Uyên', 'Thủy tổ long tộc, sinh cùng hỗn độn. Một tiếng long ngâm, vạn giới chấn động.', ['Chân Long', 'Long tộc · huyết mạch đậm', 'Long tộc · huyết mạch loãng']],
    ['Chân Phượng', 'hoa', 20, 'Bất Tử Hỏa Sơn', 'Thủy tổ phượng tộc. Niết bàn một lần, hỗn độn đổi một kỷ.', ['Phượng Hoàng', 'Phượng tộc · huyết mạch đậm', 'Phượng tộc · huyết mạch loãng']],
    ['Thủy Kỳ Lân', 'thuy', 20, 'Thủy Kỳ Lân Đàm', 'Thủy tổ kỳ lân tộc, nhân từ mà cũng đáng sợ nhất.', ['Kỳ Lân', 'Kỳ Lân tộc · huyết mạch đậm', 'Kỳ Lân tộc · huyết mạch loãng']],
    ['Thôn Thiên Cự Thú', 'am', 20, 'Thôn Thiên Thú Quật', 'Cự thú hỗn độn, từng nuốt cả một phương thế giới.'],
  ],
  scale: { trung: 1.15, outer: 1.05 },
};

[LINH, TIEN, THAN, HONGHOANG, HONDON].forEach((t, i) => registerWorld(i + 1, build(i + 1, t)));
