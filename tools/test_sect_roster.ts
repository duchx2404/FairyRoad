(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import '../src/data/worlds';
import { s } from '../src/engine/state';
import { newLife, rollFate } from '../src/engine/life';
import { SECTS } from '../src/data/world';
import { elderRoster, getOrCreateElderNpc } from '../src/engine/sectx';
import { joinSect } from '../src/engine/sect';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

async function run() {
  console.log('--- Testing Sect Members & External Sect Prominent Figures ---');
  newLife({ name: 'Diệp Tinh Vân', g: 'm', origin: 'thegia_diep', fate: rollFate(false, 'm'), perks: [] });
  const jieId = 'legacy_0_jie';
  joinSect(jieId);

  // 1. Check player sect roster
  assert(s.sect?.id === jieId, 'Player belongs to Tiệt Giáo');
  const mySect = SECTS[s.sect.id];
  const myElders = elderRoster(mySect);
  assert(myElders.length > 5, `Tiệt Giáo has ${myElders.length} elders`);

  const jiejiaoLeader = myElders.find((e) => e.top && e.role === 'chu');
  assert(!!jiejiaoLeader, `Found Tiệt Giáo leader: ${jiejiaoLeader?.name} (${jiejiaoLeader?.seat})`);
  assert(/giáo chủ/i.test(jiejiaoLeader!.seat), 'Seat mentions Giáo Chủ');

  const thaiThuong = myElders.filter((e) => e.top && e.role === 'thaithuong');
  assert(thaiThuong.length > 0, `Found ${thaiThuong.length} Thái thượng trưởng lão in Tiệt Giáo`);

  // 2. Check external sect roster (Thương Lan Thủy Phủ)
  const extSect = SECTS.thuongthuy;
  assert(!!extSect, 'Thương Lan Thủy Phủ exists');
  const extElders = elderRoster(extSect);
  assert(extElders.length > 5, `Thương Lan Thủy Phủ has ${extElders.length} elders`);

  const extLeader = extElders.find((e) => e.top && e.role === 'chu');
  assert(!!extLeader, `Found Thương Lan Thủy Phủ leader: ${extLeader?.name} (${extLeader?.seat})`);
  assert(extLeader!.r >= 5, `Thương Lan Thủy Phủ leader realm is high (r=${extLeader?.r})`);

  // 3. Test getOrCreateElderNpc for meeting/visiting
  const elderToMeet = extLeader!;
  const npc1 = getOrCreateElderNpc(elderToMeet, 'thuongthuy');
  assert(!!npc1 && npc1.name === elderToMeet.name, `Created NPC for elder: ${npc1.name}`);
  assert(npc1.sect === 'thuongthuy', 'NPC belongs to Thương Lan Thủy Phủ');
  assert(s.npcs.some((n) => n.id === npc1.id), 'NPC is registered in s.npcs');

  // Re-calling should return same NPC without duplication
  const npc2 = getOrCreateElderNpc(elderToMeet, 'thuongthuy');
  assert(npc1.id === npc2.id, 'Idempotent NPC creation (no duplicate in s.npcs)');

  // 4. Test master and legacy holder synchronization (Fix duplicate Thông Vô Kỵ / Thông Thiếu Khanh)
  const { maintainLegacyHolders } = await import('../src/engine/legacy-holders');
  const { mkNpc, addNpc } = await import('../src/engine/core');
  const { isSameSect } = await import('../src/data/declining-schools');
  const { tc } = await import('../src/engine/tienco');

  // Initialize tienco state
  tc();

  // Create player's master Thông Thiếu Khanh in s.npcs
  const masterNpc = addNpc(mkNpc({
    name: 'Thông Thiếu Khanh',
    g: 'm',
    r: 3,
    st: 3,
    sect: 'legacy_0_jie',
    tag: 'master',
    rel: 65,
    el: 'loi',
    age: 368,
    how: 'Thượng Thanh Thông Thiên Giáo Chủ (còn gọi là Thượng Thanh Linh Bảo Thiên Tôn) – Giáo chủ Tiệt Giáo Tiệt Giáo · Bích Du truyền thừa, nhận ngươi làm đệ tử',
  }));

  // Simulate maintainLegacyHolders running
  maintainLegacyHolders(s.flags.tienco!.people);

  const holder = s.flags.tienco!.people.find((p: any) => p.world === 0 && p.legacyRole === 'jie:Giáo chủ Tiệt Giáo');
  assert(!!holder, 'Legacy holder for jie:Giáo chủ Tiệt Giáo exists');
  assert(holder!.name === 'Thông Thiếu Khanh', `Legacy holder synchronized to master name: ${holder!.name}`);
  assert(holder!.npc === masterNpc.id, 'Legacy holder linked to master NPC id');

  const refreshedElders = elderRoster(mySect);
  const updatedLeader = refreshedElders.find((e) => e.top && e.role === 'chu');
  assert(updatedLeader?.name === 'Thông Thiếu Khanh', `Giáo Chủ in elderRoster is Thông Thiếu Khanh: ${updatedLeader?.name}`);

  // Check no duplicate in geniuses or knownNpcs
  const people: any[] = s.flags.tienco?.people ?? [];
  const elderNames = new Set(refreshedElders.map((e) => e.name));
  const elderLegacyRoles = new Set(refreshedElders.map((e) => e.legacyRole).filter(Boolean));
  const geniuses = people.filter((p) => {
    if (!p.alive || p.world !== 0) return false;
    if (!isSameSect(p.sect, mySect.id) && !p.from?.includes(mySect.n)) return false;
    if (p.legacyRole || elderLegacyRoles.has(p.legacyRole)) return false;
    if (elderNames.has(p.name) || (masterNpc && masterNpc.name === p.name)) return false;
    const pAge = s.year - (p.born ?? s.year);
    const maxGeniusAge = p.beast ? 400 : 100;
    const isDisciple = p.from?.includes('Đệ tử') || p.from?.includes('Thánh');
    return isDisciple || pAge <= maxGeniusAge;
  });

  assert(!geniuses.some((g) => g.name === 'Thông Thiếu Khanh'), 'Master Thông Thiếu Khanh is NOT in geniuses');
  assert(!geniuses.some((g) => g.name === 'Thông Vô Kỵ'), 'Thông Vô Kỵ is NOT in geniuses');

  const knownNpcs = s.npcs.filter((n) =>
    n.alive &&
    isSameSect(n.sect, mySect.id) &&
    n.tag !== 'master' &&
    !elderNames.has(n.name) &&
    !refreshedElders.some((e) => (e.legacyRole && n.how?.includes(e.legacyRole))) &&
    !geniuses.some((g) => g.name === n.name)
  );

  assert(!knownNpcs.some((n) => n.name === 'Thông Thiếu Khanh'), 'Master Thông Thiếu Khanh is NOT duplicated in knownNpcs');

  // 5. Test disciple roster (Thân truyền đệ tử, Nội môn đệ tử, Ngoại môn đệ tử)
  const { discipleRoster, getOrCreateDiscipleNpc } = await import('../src/engine/sectx');
  const myDisciples = discipleRoster(mySect);
  assert(myDisciples.length === 14, `Tiệt Giáo has ${myDisciples.length} canon disciples in roster`);

  const coreDisciples = myDisciples.filter((d) => d.rankKey === 'thantruyen');
  assert(coreDisciples.length === 5, `Found ${coreDisciples.length} Thân truyền đệ tử in Tiệt Giáo`);
  
  // Check Honghuang heritage
  const hoaLinh = coreDisciples.find((d) => d.title.includes('Hỏa Linh'));
  assert(!!hoaLinh, 'Found descendant of Hỏa Linh Thánh Mẫu');
  assert(hoaLinh!.name.startsWith('Hỏa '), `Descendant has surname Hỏa: ${hoaLinh?.name}`);
  assert(hoaLinh!.d.includes('Hậu nhân họ Hỏa kế thừa đạo hiệu Hỏa Linh Đạo Nhân'), `Description has lineage: ${hoaLinh?.d}`);

  const nhatKhi = coreDisciples.find((d) => d.title.includes('Nhất Khí Tiên'));
  assert(!!nhatKhi, 'Found descendant of Nhất Khí Tiên Dư Nguyên');
  assert(nhatKhi!.name.startsWith('Dư '), `Descendant has surname Dư: ${nhatKhi?.name}`);

  const innerDisciples = myDisciples.filter((d) => d.rankKey === 'noimon');
  assert(innerDisciples.length === 5, `Found ${innerDisciples.length} Nội môn đệ tử`);
  const maGia = innerDisciples.find((d) => d.name.startsWith('Ma '));
  assert(!!maGia, `Found descendant of Ma Gia Tứ Tướng: ${maGia?.name} (${maGia?.title})`);

  const outerDisciples = myDisciples.filter((d) => d.rankKey === 'ngoaimon');
  assert(outerDisciples.length === 4, `Found ${outerDisciples.length} Ngoại môn đệ tử`);

  // Check Xiển Giáo disciples as well
  const chanSect = Object.values(SECTS).find((sc) => sc.n.startsWith('Xiển Giáo'));
  if (chanSect) {
    const chanDisciples = discipleRoster(chanSect);
    assert(chanDisciples.length === 14, `Xiển Giáo has ${chanDisciples.length} disciples`);
    const duongTien = chanDisciples.find((d) => d.title.includes('Hiển Thánh'));
    assert(!!duongTien && duongTien.name.startsWith('Dương '), `Found descendant of Dương Tiễn: ${duongTien?.name}`);
    const naTra = chanDisciples.find((d) => d.title.includes('Tam Đàn Hải Hội'));
    assert(!!naTra && naTra.name.startsWith('Lý '), `Found descendant of Na Tra: ${naTra?.name}`);
  }

  // Test meeting a disciple
  const dToMeet = coreDisciples[0];
  const discNpc1 = getOrCreateDiscipleNpc(dToMeet, jieId);
  assert(!!discNpc1 && discNpc1.name === dToMeet.name, `Created NPC for disciple: ${discNpc1.name}`);
  assert(discNpc1.sect === jieId, 'Disciple belongs to Tiệt Giáo');
  assert(s.npcs.some((n) => n.id === discNpc1.id), 'Disciple is registered in s.npcs');
  assert(discNpc1.how?.includes('Hậu nhân họ'), 'NPC how contains Honghuang lineage');

  // Idempotent test
  const discNpc2 = getOrCreateDiscipleNpc(dToMeet, jieId);
  assert(discNpc1.id === discNpc2.id, 'Idempotent disciple NPC creation');

  console.log('All sect roster tests passed successfully!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
