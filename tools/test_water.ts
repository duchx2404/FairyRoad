export {};
// Kiểm tra sông có tên, long cung dưới sông/biển, Hoàng Tuyền Quỷ Môn cạnh Cửu U Minh Phủ. Chạy: npx tsx tools/test_water.ts
const W = await import('../src/data/world');
await import('../src/data/worlds');
const { TECHS } = await import('../src/data/items');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
for (const w of [0, 1, 3]) {
  W.applyWorld(w);
  console.log(`=== Giới ${w}: sông = ${W.RIVER_NAMES.join(', ')}`);
  ok(W.RIVER_NAMES.length === W.RIVERS.length && W.RIVER_LABELS.length === W.RIVERS.length && W.RIVERS.length === 39, `${W.RIVERS.length} sông đều có tên và nhãn`);
  const gates = W.LOC_LIST.filter((l) => l.gate);
  ok(gates.length === 4 && gates.every((g) => { const hst = W.LOCS[g.gateHost!]; const d = Math.hypot(g.x - hst.x, g.y - hst.y); return d >= 40 && d <= 175; }), `4 cổng thần giới sau lưng chủ: ${gates.map((g) => `${g.n} ← ${W.LOCS[g.gateHost!].n}`).join(' · ')}`);
  ok(gates.every((g) => Math.min(...W.LOC_LIST.filter((o) => o !== g && o.id !== g.gateHost).map((o) => Math.hypot(o.x - g.x, o.y - g.y))) >= 150), 'cổng thần giới cách mọi địa điểm khác (trừ chủ) ≥ 150');
  ok(['tutieu', 'vanyeudinh', 'linhsontu'].every((id) => w !== 0 || !!W.SECTS[id]?.leader), 'tông chủ có chức vụ (Vân Tiêu Tiên Tử, Yêu Hoàng, Phật Đà)');
  ok(gates.every((g) => W.SECTS[W.LOCS[g.gateHost!].sect!]?.tier === 4), 'thế lực giữ cổng đều bậc cao nhất');
  { const bad = Object.values(W.CHAU).filter((c) => { const ls = W.LOC_LIST.filter((l) => l.chau === c.id && !l.island); if (!ls.some((l) => l.type === 'town')) return false; return Object.values(W.EMPIRES).filter((e) => !e.vassal && W.LOCS[e.capital]?.chau === c.id).length !== 1; }); ok(!bad.length, `mỗi châu có thành đều có đúng một triều đình chính${bad.length ? ' — sai: ' + bad.map((c) => c.n).join(', ') : ''}`); }
  const lcs = W.LOC_LIST.filter((l) => l.sect && W.SECTS[l.sect]?.dragon);
  const seaP = lcs.filter((l) => !l.river);
  ok(seaP.length === 4 && seaP.every((l) => l.x === l.xy![0] && l.y === l.xy![1]), `4 Hải Long Cung đúng toạ độ cố định: ${seaP.map((l) => l.n).join(', ')}`);
  const riverP = W.LOC_LIST.filter((l) => l.river);
  const onRiver = riverP.every((l) => { const i = W.RIVER_NAMES.indexOf(l.river!); return W.RIVERS[i]?.some(([x, y]) => Math.hypot(x - l.x, y - l.y) < 1); });
  ok(riverP.length === 16 && onRiver, `${riverP.length} long cung dưới sông nằm đúng trên dòng: ${riverP.map((l) => l.n + ' (' + W.chauOf(l).n + ')').join(', ')}`);
  ok(lcs.every((l) => l.sect && W.SECTS[l.sect] && TECHS[W.SECTS[l.sect]!.tech]), 'mỗi long cung là tông môn có công pháp hợp lệ');
    if (w === 0) { const tt = W.LOCS.tutieu, g = W.LOCS.gate_thiendinh; const range = W.PEAKS.filter((p) => p.id === 'tutieu'); const root = range.find((p) => p.root)!; const onApex = (l: any, off: number) => range.some((p) => Math.hypot(p.x - l.x, p.y - p.h + off - l.y) < 2); const dg = Math.hypot(g.x - tt.x, g.y - tt.y); const gpk = range.find((p) => p.gate)!; const rest = range.filter((p) => p !== root && p !== gpk).map((p) => p.h); ok(root.h > gpk.h && gpk.h > Math.max(...rest) && onApex(tt, 6) && onApex(g, 8) && dg >= 75, `Tử Tiêu trên núi gốc cao nhất dãy (${Math.round(root.h)}), Nam Thiên Môn trên ngọn cao nhì (${Math.round(gpk.h)}) cách ${Math.round(dg)} (ngang ${Math.round(g.x - tt.x)}, dọc ${Math.round(g.y - tt.y)})`); }
    ok(lcs.every((l) => W.SECTS[l.sect!]?.tribe === (l.river ? 'thuy' : 'hai')), 'long cung biển chỉ nhận hải tộc, long cung sông chỉ nhận thủy tộc');
    if (w === 0) { const tr = W.LOCS.hoangtuyen, g = W.LOCS.gate_diaphu; const d = Math.hypot(tr.x - g.x, tr.y - g.y); ok(d >= 200 && d <= 420 && W.chauOf(tr).n === W.chauOf(g).n, `Hoàng Tuyền Trấn cách Hoàng Tuyền Quỷ Môn ${Math.round(d)} · ${W.chauOf(tr).n}`); }
  const near = W.LOC_LIST.filter((o) => !o.river && !o.gate).flatMap((o) => [...riverP].map((p) => Math.hypot(o.x - p.x, o.y - p.y)));
  ok(Math.min(...near) >= 200, `long cung sông cách địa điểm khác ≥ 200 (nhỏ nhất ${Math.round(Math.min(...near))})`);
  if (w === 0) {
    const ht = W.LOCS.gate_diaphu, cu = W.LOCS.cuuu;
    const d = Math.hypot(ht.x - cu.x, ht.y - cu.y);
    ok(d >= 40 && d <= 130, `Hoàng Tuyền Quỷ Môn cách Cửu U Minh Phủ ${Math.round(d)}; châu ${W.chauOf(ht).n} / ${W.chauOf(cu).n}`);
    console.log('  long vương:', lcs.map((l) => W.SECTS[l.sect!].d.match(/Long Vương [^,.]+/)?.[0]).join(' | '));
  }
}
console.log(fails ? `\n${fails} FAIL` : '\nALL PASS');
