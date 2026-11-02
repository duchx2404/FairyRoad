(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { s } from '../src/engine/state';
import { newLife, rollFate } from '../src/engine/life';
import {
  STONE_VALUE,
  STONE_NAMES,
  breakdownStones,
  formatStonesDetail,
  stoneForRealm,
  worldStoneRate,
  stonesToBottleneck,
} from '../src/engine/stones';
import {
  mkChanLinh,
  getLinh,
  tickLinh,
  feedLinh,
  beastCultSpeed,
} from '../src/engine/beast-companion';
import { clSum } from '../src/engine/char';
import { cultivate } from '../src/engine/actions';
import { addItem } from '../src/engine/char';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

console.log('--- 1. KIỂM TRA QUY ĐỔI LINH THẠCH & HÀM BÌNH CẢNH ---');
// Tỷ lệ quy đổi: 1 Cực = 10 Thượng = 100 Trung = 1000 Hạ
assert(STONE_VALUE.ha === 1, 'Hạ phẩm = 1');
assert(STONE_VALUE.trung === 10, 'Trung phẩm = 10');
assert(STONE_VALUE.thuong === 100, 'Thượng phẩm = 100');
assert(STONE_VALUE.cuc === 1000, 'Cực phẩm = 1000');
assert(STONE_VALUE.cuc / STONE_VALUE.thuong === 10, '1 Cực phẩm = 10 Thượng phẩm');
assert(STONE_VALUE.thuong / STONE_VALUE.trung === 10, '1 Thượng phẩm = 10 Trung phẩm');
assert(STONE_VALUE.trung / STONE_VALUE.ha === 10, '1 Trung phẩm = 10 Hạ phẩm');

// Breakdown
const bd = breakdownStones(1234);
assert(bd.cuc === 1 && bd.thuong === 2 && bd.trung === 3 && bd.ha === 4, '1234 Hạ phẩm = 1 Cực, 2 Thượng, 3 Trung, 4 Hạ');
const detail = formatStonesDetail(1234);
assert(detail.includes('1 Cực phẩm') && detail.includes('2 Thượng phẩm'), `formatStonesDetail format đúng: ${detail}`);

// Cảnh giới dùng linh thạch
assert(stoneForRealm(1) === 'ha', 'Luyện Khí dùng Hạ phẩm');
assert(stoneForRealm(2) === 'ha', 'Trúc Cơ dùng Hạ phẩm');
assert(stoneForRealm(3) === 'trung', 'Kết Đan dùng Trung phẩm');
assert(stoneForRealm(4) === 'trung', 'Nguyên Anh dùng Trung phẩm');
assert(stoneForRealm(5) === 'thuong', 'Hóa Thần dùng Thượng phẩm');
assert(stoneForRealm(6) === 'thuong', 'Luyện Hư dùng Thượng phẩm');
assert(stoneForRealm(7) === 'cuc', 'Hợp Thể dùng Cực phẩm');
assert(stoneForRealm(8) === 'cuc', 'Đại Thừa dùng Cực phẩm');

// Tỷ lệ liên giới: 1 Hạ phẩm thế giới cao = 10 Cực phẩm = 10,000 Hạ phẩm thế giới thấp
assert(worldStoneRate(1, 0) === 10000, '1 Hạ phẩm giới 1 = 10,000 Hạ phẩm giới 0');
assert(worldStoneRate(2, 0) === 100000000, '2 bậc chênh lệch theo lũy thừa 10^8');

// Stones to Bottleneck
newLife({ name: 'Kiểm Chứng', g: 'm', origin: 'mucdong', fate: rollFate(false, 'm'), perks: [] });
s.body = 'pham';
delete s.flags.childhood;
delete s.flags.engageNpc;
s.r = 1; // Luyện Khí
s.st = 2; // Hậu kỳ
s.prog = 60;
s.money = 500;
const stInfo = stonesToBottleneck();
// Cần: st=2 -> st=3 (40%) + st=3 -> bottleneck (100%) = 140%
assert(stInfo.stoneGrade === 'ha', 'Luyện Khí dùng Hạ phẩm');
assert(stInfo.neededStones === 140, `Cần 140 viên Hạ phẩm (thực tế: ${stInfo.neededStones})`);
assert(stInfo.availableStones === 500, `Có 500 viên Hạ phẩm (thực tế: ${stInfo.availableStones})`);
assert(stInfo.usableStones === 140, 'Dùng 140 viên');
assert(stInfo.costInHa === 140, 'Tiêu tốn 140 Hạ phẩm');

// Bế quan dùng linh thạch
const oldProg = s.prog;
const oldSt = s.st;
const oldMoney = s.money;
cultivate(1, 50); // Dùng 50 linh thạch
assert(s.money === oldMoney - 50, `Linh thạch bị trừ 50 (còn: ${s.money})`);
assert(s.prog > oldProg || s.st > oldSt, 'Tu vi tăng lên nhờ hấp thu linh thạch');

console.log('\n--- 2. KIỂM TRA LINH THÚ ẤU NIÊN, TRƯỞNG THÀNH, GIÀ & NUÔI DƯỠNG ---');
// Tạo linh thú ấu niên
const baby = mkChanLinh('thanhxa', 'Tiểu Thanh', true);
assert(baby.stage === 'aunen', 'Linh thú mới nhận là Ấu niên');
assert(baby.name === 'Tiểu Thanh', 'Tên linh thú: Tiểu Thanh');
assert(baby.maxLife > 400, `Thọ nguyên gấp 4 lần nhân tộc: ${baby.maxLife} năm`);
assert(baby.age < 20, `Tuổi ấu niên nhỏ: ${baby.age} tuổi`);
assert(beastCultSpeed('aunen') === 1.25, 'Tốc độ tu vi ấu niên = 1.25');
assert(beastCultSpeed('truongthanh') === 1.0, 'Tốc độ tu vi trưởng thành = 1.0');
assert(beastCultSpeed('gia') === 0.35, 'Tốc độ tu vi già yếu = 0.35');

// Nuôi dưỡng bằng thức ăn không hợp lệ
addItem('m:sat', 5);
const feedBad = feedLinh('m:sat');
assert(!feedBad.ok, 'Linh thú từ chối ăn quặng sắt');

// Nuôi dưỡng bằng Yêu đan (thay vì nội đan)
addItem('m:yeudan', 2);
const oldP = baby.p;
const feedYd = feedLinh('m:yeudan');
assert(feedYd.ok, `Cho ăn Yêu đan thành công: ${feedYd.msg}`);
assert(baby.p > oldP, `Tu vi tăng thêm sau khi ăn Yêu đan: +${feedYd.progGain}%`);
assert(baby.stage === 'truongthanh', 'Ăn Yêu đan kích thích huyết mạch tiến hóa thành Trưởng Thành');

// Kiểm tra chỉ số chiến lực theo giai đoạn
const clHpAdult = clSum('hp');
baby.stage = 'gia';
const clHpOld = clSum('hp');
assert(clHpOld < clHpAdult, `Chiến lực già yếu (${clHpOld}) thấp hơn trưởng thành (${clHpAdult})`);

// Kiểm tra hóa già khi tuổi cao (>80% thọ nguyên)
baby.stage = 'truongthanh';
baby.age = baby.maxLife * 0.85;
tickLinh(1);
assert(baby.stage === 'gia', 'Hóa già khi tuổi thọ vượt quá 80%');

// Đột phá phản lão hoàn đồng
baby.stage = 'gia';
baby.st = 3;
baby.p = 99;
addItem('m:cotuhuyet', 1);
feedLinh('m:cotuhuyet'); // Đột phá đại cảnh giới (st: 3 -> 4 -> r++)
assert(baby.stage === 'truongthanh', 'Đột phá đại cảnh giới giúp phản lão hoàn đồng trở lại Trưởng Thành!');

console.log(`\nTổng kết: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
