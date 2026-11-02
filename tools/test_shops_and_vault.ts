import { strict as assert } from 'node:assert';

(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import('../src/engine/wire');
await import('../src/data/worlds');
const { newLife, rollFate } = await import('../src/engine/life');
newLife({ name: 'Kiểm Chứng', g: 'm', origin: 'mucdong', fate: rollFate(false, 'm'), perks: [] });

const { s } = await import('../src/engine/state');
const { LOCS, SECTS } = await import('../src/data/world');
const { stock, lots, winLot, isBigTown } = await import('../src/engine/trade');
const { HERBS, MATS, SPECIALS } = await import('../src/data/items');
const { CHANLINH } = await import('../src/data/spirit');
const { sectWares, winSectWar, donateItemToVault, donateGearToVault } = await import('../src/engine/sect');
const { useSpecial } = await import('../src/engine/items');
const { count } = await import('../src/engine/char');

console.log('=== TEST 1: Cửa tiệm tại thành lớn bán đầy đủ vật liệu luyện đan, khí, phù ===');
s.loc = 'kinhdo'; // Thiên Kinh - Thành lớn
s.year = 100;
s.r = 1;

assert(isBigTown(LOCS[s.loc].n), 'Thiên Kinh phải là thành lớn');
const wares = stock();

// Kiểm tra đan dược / linh thảo
const herbWares = wares.filter((w) => w.id.startsWith('h:'));
assert(herbWares.length >= 10, `Thành lớn phải bán đầy đủ linh thảo (hiện có ${herbWares.length} loại)`);
assert(herbWares.some((w) => w.id === 'h:hoangtinh'), 'Có hoàng tinh');
assert(herbWares.some((w) => w.id === 'h:tuyetlien'), 'Có tuyết liên');

// Kiểm tra vật liệu luyện khí & luyện phù
const matWares = wares.filter((w) => w.id.startsWith('m:'));
assert(matWares.length >= 12, `Thành lớn phải bán đầy đủ nguyên liệu khoáng thạch, da thú, mộc (hiện có ${matWares.length} loại)`);
assert(matWares.some((w) => w.id === 'm:phuchi' && w.qty >= 20), 'Có phù chỉ số lượng lớn');
assert(matWares.some((w) => w.id === 'm:chusa' && w.qty >= 20), 'Có chu sa số lượng lớn');
assert(matWares.some((w) => w.id === 'm:huyenthiet'), 'Có huyền thiết luyện khí');
assert(matWares.some((w) => w.id === 'm:tinhkim'), 'Có tinh kim luyện khí');
assert(matWares.some((w) => w.id === 'm:yeudan'), 'Có yêu đan luyện khí/phù');
assert(matWares.some((w) => w.id === 'm:dayeu'), 'Có da yêu thú');
assert(matWares.some((w) => w.id === 'm:yeubiphuchi' || w.id === 'm:linhmocphuchi'), 'Có giấy chế cổ phù');

console.log('PASS: Thành lớn bán đầy đủ mọi vật liệu luyện phù, đan, khí.');

console.log('=== TEST 2: Đấu giá hội lớn và bé, vật phẩm hiếm, pháp bảo cao cấp, linh thú ấu niên ===');
// Thành lớn (Thiên Kinh)
const bigLots = lots();
assert(bigLots.length >= 5, 'Đại hội đấu giá thành lớn có nhiều lô hàng');
const bigBeastLot = bigLots.find((l) => l.id.startsWith('beast:'));
assert(bigBeastLot, 'Đại hội đấu giá có bán linh thú ấu niên');
const bigBeastId = bigBeastLot.id.slice(6);
assert(['chuoc', 'hacky', 'loiung', 'kimdieu', 'phonglinhhoa', 'huyenquy'].includes(bigBeastId), 'Thành lớn bán linh thú thượng phẩm');

// Kiểm tra pháp bảo cao cấp ở thành lớn
const bigGears = bigLots.filter((l) => l.gear);
assert(bigGears.some((l) => l.gear && l.gear.g >= 3), 'Đại hội đấu giá thành lớn có pháp bảo cao cấp (g >= 3)');

// Kiểm tra nguyên liệu hiếm ở thành lớn
console.log('bigLots:', bigLots);
const rareMats = bigLots.filter((l) => l.id.startsWith('m:') || l.id.startsWith('h:'));
assert(rareMats.length >= 1, 'Đại hội đấu giá thành lớn có bán nguyên liệu quý hiếm');

// Đấu giá hội bé (Trấn nhỏ, vd: Lạc Diệp Trấn hoặc Thanh Hà Trấn)
const smallTown = Object.values(LOCS).find((l) => l.type === 'town' && !isBigTown(l.n)) || { id: 'test_tran', n: 'Thanh Hà Trấn', type: 'town', reg: 'trungtho', x: 0, y: 0 };
LOCS['test_tran'] = smallTown as any;
s.loc = 'test_tran';
const smallLots = lots();
assert(smallLots.length >= 3, 'Đấu giá hội nhỏ có lô hàng');
const smallBeastLot = smallLots.find((l) => l.id.startsWith('beast:'));
assert(smallBeastLot, 'Đấu giá hội nhỏ có bán linh thú ấu niên');
const smallBeastId = smallBeastLot.id.slice(6);
assert(['hoaly', 'thanhxa', 'ngantho', 'tuyetlang'].includes(smallBeastId), 'Thành nhỏ bán linh thú sơ cấp');

// Mua linh thú ấu niên
s.flags.chanlinh = null;
s.money = 50000;
const winMsg = winLot(bigBeastLot, 1000);
assert(s.flags.chanlinh && s.flags.chanlinh.id === bigBeastId, 'Mua ấu thú khi chưa có chân linh -> ký kết trực tiếp');
assert(winMsg.includes(CHANLINH[bigBeastId].n), 'Thông báo đấu giá thành công');

// Mua thêm linh thú thứ hai khi đã có chân linh -> vào lồng phong ấn
const winMsg2 = winLot(bigBeastLot, 1000);
assert(s.bag.some((b) => b.id === 'x:trung_' + bigBeastId), 'Đã có chân linh -> nhận lồng linh thú phong ấn vào túi');
assert(winMsg2.includes('lồng phong ấn'), 'Thông báo nhận lồng phong ấn');

// Sử dụng lồng linh thú
const useMsg = useSpecial('trung_' + bigBeastId);
assert(useMsg.includes(CHANLINH[bigBeastId].n), 'Mở lồng ký khế ước mới');

console.log('PASS: Đấu giá hội lớn và bé hoạt động chuẩn xác, phân cấp linh thú và phẩm vật rõ ràng.');

console.log('=== TEST 3: Bảo khố tông môn đầy đủ mọi thứ và có thể đổi (mua + nộp đổi) ===');
s.sect = { id: 'tutieu', rank: 2, contrib: 1000 };
s.loc = SECTS['tutieu'].loc;
const vault = sectWares();

// Đầy đủ các danh mục
assert(vault.some((w) => w.id.startsWith('p:')), 'Bảo khố có đan dược');
assert(vault.some((w) => w.id.startsWith('h:')), 'Bảo khố có linh thảo');
assert(vault.some((w) => w.id.startsWith('m:')), 'Bảo khố có nguyên liệu');
assert(vault.some((w) => w.id.startsWith('t:')), 'Bảo khố có phù lục');
assert(vault.some((w) => w.gear), 'Bảo khố có pháp khí');

// Thử nộp vật phẩm vào bảo khố lấy cống hiến
s.bag.push({ id: 'm:huyenthiet', n: 5 });
const contribBefore = s.sect.contrib;
const donRes = donateItemToVault('m:huyenthiet', 2);
assert(donRes.ok && donRes.contrib > 0, 'Nộp thành công vật phẩm');
assert(s.sect.contrib === contribBefore + donRes.contrib, 'Cống hiến tăng lên đúng số lượng');
assert(count('m:huyenthiet') === 3, 'Số lượng trong túi giảm đi đúng');

console.log('PASS: Bảo khố đầy đủ mọi thứ và có thể đổi 2 chiều.');

console.log('=== TEST 4: Tông môn chiến chiến thắng -> Tàng Kinh Các có thêm sách, Bảo khố có thêm pháp bảo, nguyên liệu ===');
const booksBefore = sectWares().filter((w) => /^(cp|sk|tp|fq):/.test(w.id)).length;
const gearsBefore = sectWares().filter((w) => w.gear).length;
const matsBefore = sectWares().filter((w) => /^(m|h):/.test(w.id)).length;

const warRes = winSectWar('thienam');
assert(s.flags.sectWarWins === 1, 'Số lần thắng tông môn chiến được ghi nhận');
assert(warRes.includes('Chiến thắng'), 'Trả về thông điệp khải hoàn');

const waresAfterWar = sectWares();
const booksAfter = waresAfterWar.filter((w) => /^(cp|sk|tp|fq):/.test(w.id)).length;
const gearsAfter = waresAfterWar.filter((w) => w.gear).length;
const matsAfter = waresAfterWar.filter((w) => /^(m|h):/.test(w.id)).length;

assert(booksAfter > booksBefore, `Tàng Kinh Các có thêm sách (${booksBefore} -> ${booksAfter})`);
assert(gearsAfter > gearsBefore, `Bảo khố có thêm pháp bảo (${gearsBefore} -> ${gearsAfter})`);
assert(matsAfter > matsBefore, `Bảo khố có thêm nguyên liệu (${matsBefore} -> ${matsAfter})`);
assert(waresAfterWar.some((w) => w.n.includes('Chiến lợi')), 'Các vật phẩm chiến lợi có nhãn Chiến lợi từ tông địch');

console.log('PASS: Sau mỗi lần tông môn chiến thắng, Tàng Kinh Các và Bảo khố đều được bổ sung chiến lợi phẩm phong phú.');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
