export {};
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { doctrineAccepts, doctrineWeight } = await import('../src/engine/sect-doctrine');
const life = await import('../src/engine/life');
const ST = await import('../src/engine/state');
const tc = await import('../src/engine/tienco');
function check(value: unknown, message: string) { if (!value) throw new Error(message); }
for (const race of ['Nhân tộc', 'Yêu tộc', 'Vu tộc', 'Ma tộc']) {
  check(doctrineAccepts({ id: race, sect: 'Tiệt Giáo · Bích Du Cung', talent: 0.3, race }), 'Tiệt accepts all races and aptitude levels');
}
check(!doctrineAccepts({ id: 'a', sect: 'Xiển Giáo · Ngọc Hư Cung', talent: 0.8 }), 'Xiển recruits selectively');
check(!doctrineAccepts({ id: 'a', sect: 'Đạo Giáo · Bát Cảnh Cung', talent: 3 }), 'Laozi disciples are not random recruits');
check(doctrineWeight('Tiệt Giáo · Bích Du Cung') > doctrineWeight('Xiển Giáo · Ngọc Hư Cung'), 'different recruitment breadth');
life.newLife({ name: 'Doctrine', g: 'm', origin: 'mucdong', fate: life.rollFate(false, 'm'), perks: [] });
ST.s.world = 4;
for (let i = 0; i < 100; i++) tc.recruitPerson(4);
const people = tc.tcPeople();
check(people.filter(p => p.world === 4 && !p.chief && !p.fengshen && !p.ret && !p.lord).every(doctrineAccepts), 'all generated residents respect doctrine');
check(people.some(p => p.name === 'Huyền Đô Đại Pháp Sư' && p.sect === 'Đạo Giáo · Bát Cảnh Cung'), 'Laozi canonical disciple present');
check(people.some(p => p.name === 'Long Tu Hổ' && p.sect.includes('Xiển')), 'canonical exceptions preserved');
const p = tc.recruitPerson(4);
p.sect = 'Đạo Giáo · Bát Cảnh Cung'; p.beast = 'Hải Giao'; p.st = 0;
const beast = p.beast;
tc.tc(); check(p.sect === 'Tán tu' && p.beast === beast, 'old save affiliations repaired without changing species');
console.log('PASS: inclusive Tiệt, selective Xiển, canonical Laozi lineage and save migration');
