import { strict as assert } from 'node:assert';

(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { newLife, rollFate } = await import('../src/engine/life');
newLife({ name: 'Luyện Kiếm Giả', g: 'm', origin: 'mucdong', fate: rollFate(false, 'm'), perks: [] });

const { s } = await import('../src/engine/state');
const { SECTS } = await import('../src/data/world');
const { fight } = await import('../src/engine/combat');
const { sectWares } = await import('../src/engine/sect');
const { wareCat, SHOP_CATS } = await import('../src/engine/trade');
const { HERBS, MATS } = await import('../src/data/items');

console.log('=== TEST 1: Chiến lợi phẩm sau khi đánh yêu thú (Yêu đan, thịt, da, lông, nanh, sừng...) ===');
s.r = 2; // Trúc Cơ
s.bag = [];
s.gearBag = [];

// Đánh Ngân Nguyệt Lang Vương (sói: có lông, da, nanh vuốt, yêu đan, thịt)
const wolfResult = fight({ name: 'Ngân Nguyệt Lang Vương', r: 2, st: 2, kind: 'beast', mult: 0.1 });
assert(wolfResult.win, 'Người chơi đánh thắng yêu thú');
console.log('Wolf fight log loot:', wolfResult.lootDesc);
assert(s.bag.some(b => b.id === 'm:thityeu'), 'Đánh yêu thú phải rơi thịt yêu thú (thityeu)');
assert(s.bag.some(b => b.id === 'm:yeudan'), 'Đánh yêu thú tu vi Trúc Cơ rơi yêu đan (yeudan)');
assert(s.bag.some(b => b.id === 'm:longthu' || b.id === 'm:dayeu' || b.id === 'm:yeunha'), 'Rơi lông, da hoặc nanh vuốt của sói');

// Đánh Thanh Lân Mãng (mãng xà độc: có da, vảy, độc nang, thịt)
s.bag = [];
const snakeResult = fight({ name: 'Thanh Lân Độc Mãng', r: 2, st: 1, kind: 'beast', mult: 0.1 });
assert(snakeResult.win, 'Người chơi đánh thắng độc mãng');
console.log('Snake fight log loot:', snakeResult.lootDesc);
assert(s.bag.some(b => b.id === 'm:thityeu'), 'Rơi thịt yêu thú');
assert(s.bag.some(b => b.id === 'm:dayeu' || b.id === 'm:longlan' || b.id === 'm:docnang'), 'Rơi da yêu thú hoặc độc nang hoặc vảy');

console.log('PASS: Chiến lợi phẩm yêu thú chuẩn xác (thịt, yêu đan, da, lông, nanh, sừng, độc nang...)');

console.log('=== TEST 2: Đánh người / tu sĩ (Linh thạch và đồ trong trữ vật giới chỉ) ===');
s.bag = [];
s.gearBag = [];
const moneyBefore = s.money;
const cultivatorResult = fight({ name: 'Ma Đạo Trưởng Lão', r: 3, st: 2, kind: 'cultivator', mult: 0.1 });
assert(cultivatorResult.win, 'Người chơi đánh thắng tu sĩ');
console.log('Cultivator fight log loot:', cultivatorResult.lootDesc);
assert(s.money > moneyBefore, 'Đánh tu sĩ phải tịch thu linh thạch trong trữ vật giới chỉ');
assert(s.bag.length > 0 || s.gearBag.length > 0, 'Phải có vật phẩm (đan dược, phù lục, nguyên liệu hoặc pháp bảo) rơi từ trữ vật giới chỉ');

console.log('PASS: Đánh tu sĩ tịch thu linh thạch và vật phẩm trong trữ vật giới chỉ.');

console.log('=== TEST 3: Bảo khố tông môn bán đầy đủ mọi thứ như thành lớn ===');
const jieSect = Object.values(SECTS).find(sec => sec.n.startsWith('Tiệt Giáo'))!;
s.sect = { id: jieSect.id, rank: 2, contrib: 50000, joined: s.year, lastPay: s.year };
s.year = 100;

const wares = sectWares();
const herbsInVault = wares.filter(w => w.id.startsWith('h:'));
const matsInVault = wares.filter(w => w.id.startsWith('m:'));
const pillsInVault = wares.filter(w => w.id.startsWith('p:'));
const talisInVault = wares.filter(w => w.id.startsWith('t:'));

console.log(`Bảo khố Tiệt Giáo hiện có: ${herbsInVault.length} linh thảo, ${matsInVault.length} nguyên liệu, ${pillsInVault.length} đan dược, ${talisInVault.length} phù lục.`);
assert(herbsInVault.length >= 15, 'Bảo khố phải bán đầy đủ linh thảo (ít nhất 15 loại)');
assert(matsInVault.length >= 12, 'Bảo khố phải bán đầy đủ nguyên liệu luyện khí, luyện phù (ít nhất 12 loại)');

// Kiểm tra tab Vật liệu chế phù có đủ phù chỉ, chu sa, yêu bì, linh mộc
const talisMats = wares.filter(w => wareCat(w as any) === 6);
console.log('Vật liệu chế phù trong bảo khố:', talisMats.map(w => w.n));
assert(talisMats.some(w => w.id === 'm:phuchi'), 'Có phù chỉ');
assert(talisMats.some(w => w.id === 'm:chusa'), 'Có chu sa');
assert(talisMats.some(w => w.id === 'm:yeubiphuchi'), 'Có yêu bì phù chỉ trong tab chế phù');
assert(talisMats.some(w => w.id === 'm:linhmocphuchi'), 'Có linh mộc phù chỉ trong tab chế phù');

console.log('PASS: Bảo khố bán đầy đủ mọi thứ và phân loại tab chế phù chuẩn xác.');

console.log('=== TEST 4: Thỉnh thoảng làm mới ra vật phẩm cao cấp vốn bán ở đấu giá hội lớn ===');
const auctionRareInVault = wares.filter(w => (w as any).source === 'Đấu giá hội');
console.log('Trân phẩm đấu giá xuất hiện trong bảo khố:', auctionRareInVault.map(w => w.n));
assert(auctionRareInVault.length >= 2, 'Bảo khố có xuất hiện các trân phẩm cao cấp của đấu giá hội lớn');
assert(auctionRareInVault.some(w => w.n.includes('Trân phẩm Đấu Giá') || w.n.includes('Phong ấn bảo khố')), 'Có nhãn trân phẩm đấu giá / bảo khố');

console.log('PASS: Bảo khố định kỳ làm mới trân phẩm cao cấp từ đấu giá hội lớn.');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
