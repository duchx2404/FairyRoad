export {};
// Kiểm tra bản đồ Hồng Hoang theo truyền thuyết: phương vị, châu, vương triều, đảo, cổng thần giới, không còn tên ngẫu nhiên.
// Chạy: npx tsx tools/test_map_honghoang.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] };

await import('../src/engine/state');
await import('../src/data/worlds');
const W = await import('../src/data/world');
const { LOC_LIST: L, LOCS, CHAU, EMPIRES, SECTS, LANDMASS, REGIONS, RIVER_NAMES, RIVERS, RIVER_MAJOR, ISLANDS, MAINLAND, BEASTS, inPoly, applyWorld, ownerTxt, MAP_W, MAP_H } = W as any;
const { FACTION_BY_SECT } = await import('../src/events/fengshen');

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };

applyWorld(4);
const byName = (n: string) => (L as any[]).find((l) => l.n === n);
const CX = MAP_W / 2, CY = MAP_H / 2;

// 1. Châu của các kinh đô
const CAPS: [string, string][] = [
  ['Triều Ca', 'Ký Châu'], ['Sùng Thành', 'Tế Châu'], ['Nam Đô Thành', 'Thứ Châu'], ['Đông Lỗ Thành', 'Dương Châu'], ['Tây Kỳ Thành', 'Yêm Châu'],
  ['Thanh Khâu Thành', 'Cức Lâm'], ['Quân Tử Thành', 'Tang Dã'], ['Ngạo Lai Thành', 'Thiếu Hải'],
  ['Bạch Dân Thành', 'Kim Khâu'], ['Hiên Viên Thành', 'Ốc Dã'], ['Nữ Tử Thành', 'Tuyền Trạch'],
  ['Vũ Dân Thành', 'Phản Hộ'], ['Hoan Đâu Thành', 'Hạo Trạch'], ['Bất Tử Thành', 'Đại Mộng'],
  ['Nhất Mục Thành', 'Ủy Vũ'], ['Bắc Hải Thành', 'Tích Băng'], ['Chung Bắc Thành', 'Hàn Trạch'],
];
for (const [town, chau] of CAPS) {
  const l = byName(town);
  ok(!!l && CHAU[l.chau]?.n === chau, `${town} nằm ở ${chau} (thực tế: ${l ? CHAU[l.chau]?.n : 'không có'})`);
}

// 2. Vương triều: mỗi châu một triều chính có tên truyền thuyết, không có triều tự sinh
const emps = Object.values(EMPIRES) as any[];
ok(!emps.some((e) => e.id.startsWith('emp_')), `không có vương triều tự sinh (${emps.filter((e) => e.id.startsWith('emp_')).map((e) => e.n).join(', ') || 'không'})`);
for (const c of Object.values(CHAU) as any[]) {
  const main = emps.filter((e) => !e.vassal && LOCS[e.capital]?.chau === c.id);
  ok(main.length === 1, `châu ${c.n} có đúng một triều chính (${main.map((e) => e.n).join(', ') || 'không có'})`);
}

// 3. Phương vị theo truyền thuyết
const P = (n: string) => { const l = byName(n); return l ? [l.x, l.y] : [NaN, NaN]; };
const [tcx] = P('Triều Ca'), [tkx] = P('Tây Kỳ Thành');
ok(tcx > tkx, 'Triều Ca ở phía đông Tây Kỳ');
const [kx, ky] = P('Xiển Giáo · Ngọc Hư Cung');
ok(kx < CX && ky < CY && LOCS[byName('Xiển Giáo · Ngọc Hư Cung').id] && (REGIONS[byName('Xiển Giáo · Ngọc Hư Cung').reg].vuc === 'trung'), 'Côn Lôn (Ngọc Hư Cung) ở tây bắc Trung Thổ');
const [bx, by] = P('Bất Chu Sơn');
ok(bx < CX && by < CY && REGIONS[byName('Bất Chu Sơn').reg].vuc === 'bac', 'Bất Chu Sơn ở tây bắc, thuộc Bắc Câu Lô Châu');
const [jx] = P('Tiệt Giáo · Bích Du Cung');
ok(jx > CX + LANDMASS.trung.rx, 'Kim Ngao Đảo (Bích Du Cung) ở Đông Hải, phía đông Trung Thổ');
const [cx] = P('Cửu Long Đảo');
ok(cx < CX - LANDMASS.trung.rx, 'Cửu Long Đảo ở Tây Hải');
const [tgx] = P('Thang Cốc');
ok(tgx > LANDMASS.dong.x, 'Thang Cốc ở phía đông Đông Thắng Thần Châu (nơi mặt trời mọc)');
const [ngx] = P('Ngu Uyên');
ok(ngx < LANDMASS.tay.x, 'Ngu Uyên ở phía tây Tây Ngưu Hạ Châu (nơi mặt trời lặn)');
const [tpx] = P('Tây Phương Giáo');
ok(tpx < LANDMASS.tay.x, 'Tây Phương Cực Lạc ở tận cùng phía tây');
const [lgx, lgy] = P('Lạc Già Sơn');
ok(lgy > LANDMASS.nam.y, `Phổ Đà Lạc Già ở Nam Hải (${lgx}, ${lgy})`);

// 4. Đảo không nằm trên đất liền; đất liền không nằm ngoài biển
const inLand = (x: number, y: number) => (Object.values(LANDMASS) as any[]).some((m) => ((x - m.x) / m.rx) ** 2 + ((y - m.y) / m.ry) ** 2 < 1);
const wet = (L as any[]).filter((l) => l.island && !l.sea && inLand(l.x, l.y));
ok(!wet.length, `không đảo nào nằm trên đất liền (${wet.map((l) => l.n).join(', ') || 'không'})`);
const dry = (L as any[]).filter((l) => !l.island && !l.river && !l.formationTo && !l.gate && !inLand(l.x, l.y));
ok(!dry.length, `không địa điểm đất liền nào rơi ra biển (${dry.map((l) => l.n).join(', ') || 'không'})`);

// 5. Khoảng cách
const close: string[] = [];
const arr = (L as any[]).filter((l) => !l.formationTo && !l.gate); // cổng thần giới cố ý đặt sát sau lưng tông giữ cổng
for (let i = 0; i < arr.length; i++) for (let k = i + 1; k < arr.length; k++) {
  const d = Math.hypot(arr[i].x - arr[k].x, arr[i].y - arr[k].y);
  if (d < 150) close.push(`${arr[i].n} – ${arr[k].n} (${Math.round(d)})`);
}
ok(close.length <= 3, `địa điểm không chồng lên nhau (${close.length} cặp dưới 150: ${close.slice(0, 8).join('; ')})`);

// 6. Không còn tên sinh ngẫu nhiên
const junk = (L as any[]).filter((l) => /Bí Cảnh$| phường thị$| Thôn$/.test(l.n) && !['Bạch Liễu Thôn'].includes(l.n));
ok(!junk.length, `không còn địa danh tên ngẫu nhiên (${junk.map((l) => l.n).join(', ') || 'không'})`);
ok(['Hoàng Hà', 'Trường Giang', 'Hoài Thủy', 'Tế Thủy'].every((n) => RIVER_NAMES.slice(0, 4).includes(n)), `sông lớn Trung Thổ là Tứ Độc (${RIVER_NAMES.slice(0, 4).join(', ')})`);
// sông Cửu Châu không được nằm ở bốn khối ngoài
const NINE = ['Tứ Thủy', 'Nghi Thủy', 'Truy Thủy', 'Duy Thủy', 'Vấn Thủy', 'Tháp Thủy', 'Tương Giang', 'Nguyên Thủy', 'Lễ Thủy', 'Liêu Thủy', 'Dịch Thủy', 'Hô Đà Thủy', 'Tang Càn Thủy', 'Phần Thủy', 'Lưu Sa Giang', 'Nhược Thủy Hà', 'Thang Cốc Thủy', 'Hàm Trì Thủy'];
ok(!RIVER_NAMES.slice(10).some((n: string) => NINE.includes(n)), `khối ngoài không dùng sông Cửu Châu hay tên ghép (${RIVER_NAMES.slice(10).filter((n: string) => NINE.includes(n)).join(', ') || 'không'})`);
const locNames = new Set((L as any[]).map((l) => l.n));
ok(!RIVER_NAMES.some((n: string) => locNames.has(n)), `tên sông không trùng tên địa điểm (${RIVER_NAMES.filter((n: string) => locNames.has(n)).join(', ') || 'không'})`);
// sông chảy qua đúng nơi nguyên tác chép
const nearRiver = (loc: string, river: string) => { const l = byName(loc), r = RIVERS[RIVER_NAMES.indexOf(river)]; return l && r ? Math.min(...r.map(([x, y]: [number, number]) => Math.hypot(x - l.x, y - l.y))) : Infinity; };
for (const [loc, river, max] of [['Mạnh Tân', 'Hoàng Hà', 160], ['Mãnh Trì', 'Hoàng Hà', 230], ['Long Môn', 'Hoàng Hà', 180], ['Bàn Khê', 'Vị Thủy', 150], ['Tây Kỳ Thành', 'Vị Thủy', 250], ['Trần Đường Quan', 'Cửu Loan Hà', 100], ['Động Đình Sơn', 'Trường Giang', 150], ['Trần Gia Trang', 'Thông Thiên Hà', 200]] as [string, string, number][])
  ok(nearRiver(loc, river) <= max, `${loc} bên ${river} (cách ${Math.round(nearRiver(loc, river))})`);
const tu = ['Trường Giang', 'Hoàng Hà', 'Hoài Thủy', 'Tế Thủy'].map((n) => RIVERS[RIVER_NAMES.indexOf(n)]);
ok(tu.every((r: [number, number][]) => r[r.length - 1][0] > CX + LANDMASS.trung.rx * 0.3), 'Tứ Độc đều chảy về phía đông');
const mouthWet = ['Trường Giang', 'Hoàng Hà', 'Hoài Thủy', 'Tế Thủy', 'Cửu Loan Hà'].filter((n) => { const r = RIVERS[RIVER_NAMES.indexOf(n)]; const e = r[r.length - 1]; return inPoly(e[0], e[1], MAINLAND); });
ok(!mouthWet.length, `Tứ Độc và Cửu Loan Hà đổ ra tới biển (${mouthWet.join(', ') || 'đủ'})`);
// không cặp sông nào cắt nhau ngoài chỗ hợp lưu (đầu/cuối dòng)
const segX = (a: number[], b: number[], c: number[], d: number[]) => { const o = (p: number[], q: number[], r: number[]) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
const cross: string[] = [];
for (let i = 0; i < 10; i++) for (let k = i + 1; k < 10; k++) {
  const A = RIVERS[i] as number[][], B = RIVERS[k] as number[][];
  const inner = (P: number[][]) => P.slice(1, -1);
  let hit = false;
  const a2 = inner(A), b2 = inner(B);
  for (let s = 0; s < a2.length - 1 && !hit; s++) for (let q = 0; q < b2.length - 1 && !hit; q++) if (segX(a2[s], a2[s + 1], b2[q], b2[q + 1])) hit = true;
  if (hit) cross.push(`${RIVER_NAMES[i]} × ${RIVER_NAMES[k]}`);
}
ok(!cross.length, `sông Trung Thổ không cắt nhau ngoài chỗ hợp lưu (${cross.join(', ') || 'không'})`);
// bờ bắc / bờ nam Hoàng Hà: Mạnh Tân, Triều Ca, Dữu Lý, Tống Gia Trang, Hiên Viên Mộ ở bờ bắc; Mãnh Trì, Lâm Đồng Quan ở bờ nam
const hh = RIVERS[RIVER_NAMES.indexOf('Hoàng Hà')] as number[][];
const riverYAt = (x: number) => { for (let i = 0; i < hh.length - 1; i++) { const [x1, y1] = hh[i], [x2, y2] = hh[i + 1]; if ((x - x1) * (x - x2) <= 0 && x1 !== x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1); } return NaN; };
const north = ['Mạnh Tân', 'Triều Ca', 'Dữu Lý', 'Tống Gia Trang', 'Hiên Viên Mộ'].filter((n) => !(byName(n).y < riverYAt(byName(n).x)));
const south = ['Mãnh Trì', 'Lâm Đồng Quan'].filter((n) => !(byName(n).y > riverYAt(byName(n).x)));
ok(!north.length && !south.length, `bờ sông đúng nguyên văn (sai bờ: ${[...north, ...south].join(', ') || 'không'})`);
ok(nearRiver('Cam Uyên', 'Cam Thủy') <= 300, `Cam Uyên ở cửa Cam Thủy (cách ${Math.round(nearRiver('Cam Uyên', 'Cam Thủy'))})`);
ok(!(L as any[]).some((l) => l.n === 'Thông Thiên Hà Long Cung'), 'Thông Thiên Hà không có Long Cung (phủ của lão Ngoan)');
const tm = RIVERS[RIVER_NAMES.indexOf('Tử Mẫu Hà')] as number[][], tt = RIVERS[RIVER_NAMES.indexOf('Thông Thiên Hà')] as number[][];
ok(tm[0][0] < Math.min(...tt.slice(0, 12).map((p) => p[0])), 'Tử Mẫu Hà ở bờ tây Thông Thiên Hà (Tây Du đi qua Thông Thiên rồi mới tới)');
// vùng của yêu thú huyết mạch trùng vùng nơi ở của tổ
const homeReg = new Map((BEASTS as any[]).filter((b) => b.home).map((b) => [b.n, LOCS[b.home]?.reg]));
const badBeast = (BEASTS as any[]).filter((b) => b.anc && homeReg.has(b.anc) && b.reg && b.reg[0] !== homeReg.get(b.anc));
ok(!badBeast.length, `yêu thú huyết mạch sinh ở đúng vùng nơi ở của tổ (${badBeast.slice(0, 4).map((b) => b.n).join(', ') || 'đúng'})`);
const regN = (n: string) => REGIONS[byName(n).reg]?.n;
ok(['Yếm Hỏa Thành', 'Quán Hung Thành'].every((n) => regN(n) === 'Hải Ngoại Nam Kinh') && regN('Vu Sơn') === 'Đại Hoang Nam Kinh' && regN('Hung Lê Thổ Khâu') === 'Đại Hoang Đông Kinh', 'vùng theo chương nguồn (Yếm Hỏa, Quán Hung ở Hải Ngoại; Vu Sơn, Hung Lê ở Đại Hoang)');

// 6b. Đường Triều Ca → Ngũ Quan → Kim Kê Lĩnh → Tây Kỳ đi đúng một chiều về tây
const chain = ['Triều Ca', 'Mạnh Tân', 'Mãnh Trì', 'Lâm Đồng Quan', 'Đồng Quan', 'Xuyên Vân Quan', 'Giới Bài Quan', 'Tị Thủy Quan', 'Kim Kê Lĩnh', 'Thủ Dương Sơn', 'Bạch Liễu Thôn', 'Tây Kỳ Thành'];
const xs = chain.map((n) => byName(n)?.x ?? NaN);
ok(xs.every((x, i) => i === 0 || x < xs[i - 1]), `đường Triều Ca → Tây Kỳ đi đúng thứ tự về tây (${xs.join(' > ')})`);
const dist = (a: string, b: string) => { const p = byName(a), q = byName(b); return Math.hypot(p.x - q.x, p.y - q.y); };
ok(dist('Phong Thần Đài', 'Tây Kỳ Thành') <= 330, `Phong Thần Đài (Kỳ Sơn) sát Tây Kỳ (${Math.round(dist('Phong Thần Đài', 'Tây Kỳ Thành'))})`);
ok(byName('Tây Kỳ Thành').x < byName('Phong Thần Đài').x && byName('Phong Thần Đài').x < byName('Bạch Liễu Thôn').x, 'Kỳ Sơn ở phía đông Tây Kỳ, trên đường từ Bạch Liễu Thôn tới');
const hl = ['Thanh Long Quan', 'Hoàng Hoa Sơn', 'Tuyệt Long Lĩnh'].map((n) => byName(n).x);
ok(hl[0] > hl[1] && hl[1] > hl[2], 'Thanh Long Quan → Hoàng Hoa Sơn → Tuyệt Long Lĩnh đi về tây');
// Đông Hải Long Cung ở eo biển ngoài Trần Đường Quan; cửa ải nhà Thương thuộc Đại Thương
const lcd = byName('Đông Hải Long Cung');
ok(lcd && lcd.x > CX + LANDMASS.trung.rx && lcd.x < LANDMASS.dong.x - LANDMASS.dong.rx && dist('Đông Hải Long Cung', 'Trần Đường Quan') < 700, `Đông Hải Long Cung ngoài cửa Trần Đường Quan (${lcd?.x}, ${lcd?.y})`);
ok(['Tị Thủy Quan', 'Giới Bài Quan', 'Du Hồn Quan', 'Trần Đường Quan', 'Tam Sơn Quan'].every((n) => ownerTxt(byName(n)) === 'thuộc Đại Thương'), 'các cửa ải nhà Thương đều thuộc Đại Thương');
ok(ownerTxt(byName('Kim Ngao Đảo Thị')) === 'trực thuộc Tiệt Giáo · Bích Du Cung', 'chợ Kim Ngao Đảo trực thuộc Tiệt Giáo');
// hình đảo vẽ đúng chỗ địa điểm đảo
const isl = (L as any[]).filter((l) => l.island && !l.sea);
const offIsl = isl.filter((l, i) => !ISLANDS[i] || Math.abs(ISLANDS[i][0] - l.x) > 1 || Math.abs(ISLANDS[i][1] - l.y) > 1);
ok(!offIsl.length, `hình đảo khớp vị trí đảo (${offIsl.map((l) => l.n).join(', ') || 'không lệch'})`);
// mọi tông Xiển / Tiệt trên bản đồ đều có phe trong Lượng Kiếp; tông không nhập kiếp thì không có
const sectList = Object.values(SECTS) as any[];
const missing = sectList.filter((x) => /Tiệt Giáo|Xiển Giáo/.test(x.d) && !x.n.includes('Bát Cảnh Cung') && !FACTION_BY_SECT[x.n]);
ok(!missing.length, `tông Xiển / Tiệt đều có phe Lượng Kiếp (${missing.map((x) => x.n).join(', ') || 'đủ'})`);
ok(!FACTION_BY_SECT['Đạo Giáo · Bát Cảnh Cung'] && !FACTION_BY_SECT['Tây Phương Giáo'], 'Bát Cảnh Cung và Tây Phương Giáo không có phe trong cuộc chiến');

// 7. Cổng thần giới
const gateHost = (g: string) => { const gl = (L as any[]).find((l) => l.gate === g); return gl ? LOCS[gl.gateHost]?.n : undefined; };
ok(gateHost('thiendinh') === 'Xiển Giáo · Ngọc Hư Cung', `cổng Thiên Đình ở Côn Lôn (${gateHost('thiendinh')})`);
ok(gateHost('linhson') === 'Tây Phương Giáo', `cổng Linh Sơn ở Tây Phương Giáo (${gateHost('linhson')})`);
ok(gateHost('yeugioi') === 'Yêu Đình', `cổng Yêu Giới ở Yêu Đình (${gateHost('yeugioi')})`);
ok(gateHost('diaphu') === 'Vu Tộc · Bàn Cổ Điện', `cổng Địa Phủ ở Bàn Cổ Điện (${gateHost('diaphu')})`);
const xien = (Object.values(SECTS) as any[]).find((x) => x.n === 'Xiển Giáo · Ngọc Hư Cung');
ok(!xien?.leader, `Xiển Giáo không bị gán chức chung cho người đứng đầu (${xien?.leader ?? 'không'})`);
const gateD = (L as any[]).filter((l) => l.gate).map((l) => l.d).join(' ');
ok(!/Tử Tiêu Tiên Cung|Vân Tiêu Tiên Tử|Linh Sơn Tự|Cửu U Minh Phủ|Vạn Yêu Thánh Đình/.test(gateD), 'mô tả cổng thần giới theo lore Hồng Hoang, không nhắc nơi của giới khác');

// 8. Không chữ Hán
ok(!/[\u3400-\u9fff]/.test(JSON.stringify((L as any[]).map((l) => [l.n, l.d]))), 'không có chữ Hán trong địa danh và mô tả');

console.log(`\n${(L as any[]).length} địa điểm ở Hồng Hoang; ${emps.length} vương triều; ${(Object.values(SECTS) as any[]).length} thế lực.`);
console.log(fails ? `\n${fails} FAIL` : '\nTất cả PASS');
process.exit(fails ? 1 : 0);
