// Giao diện Thần Giới (Thiên Đình, Địa Phủ, Yêu Giới, Linh Sơn):
// Tiểu thế giới tương tác trọn vẹn như một Tông Môn / Hoàng Triều tối thượng:
// - Banner kiến trúc SVG hùng vĩ (.pl-banner) với biển hiệu chữ vàng danh xưng thần triều & địa danh.
// - Bản đồ thủy mặc Thương Lan tương tác (Hình 5) với sông núi, hồ nước, nhãn thư pháp.
// - Lưới 15 thẻ chức năng tông môn kinh điển (.pl-grid) đánh số 1-15:
//   1: Nhận nhiệm vụ phụng mệnh | 2: Nhiệm Vụ Đường (Giao nộp vật phẩm) | 3: Tàng Kinh Các Thần Giới
//   4: Bảo khố thần giới | 5: Tiên quan thường trực | 6: Thỉnh an tiên hiền / Bái sư
//   7: Thần giới tỉ thí | 8: Thần giới đại bỉ (Hội Bàn Đào, Vu Lan...) | 9: Bế quan thần mạch (tu vi x3)
//   10: Thần ma đại chiến (Giới chiến) | 11: Thân phận & Tiên chức thần thoại | 12: Dạo quanh tiên cảnh
//   13: Cúng dường linh thạch | 14: Lò luyện tiên đan / Thần khí | 15: Trở về trần giới
import { h, btn } from './dom';
import { glyphSvg } from './glyph';
import { openModal, closeModal, run, toast } from './modal';
import { s } from '../engine/state';
import { CELESTIAL, celestialOffices, celestialTop, hasCelestialRealms, CELESTIAL_PLACE_ARTS, type CelestialId, type COfficeView } from '../data/celestial';
import { SECTS, LOCS } from '../data/world';
import { REALMS, WORLDS, EL, STAGES } from '../data/core';
import { TECHS, SKILLS, TAMPHAP, TIER_C, learnReq, techGrade, skillGrade, tamGrade, tamEffect, MAX_SKILLS, HERBS, MATS, TALIS, PILLS, type Skill, type Tech } from '../data/items';
import { PHAPQUYET, pqGrade } from '../data/spirit';
import { tamList, tamActive, tamSlots, pqList, effRi, addItem, count, itemName, bagFree, itemTier, itemPrice } from '../engine/char';
import { learnTech, learnSkill } from '../engine/api';
import { addLog } from '../engine/core';
import { fmt, yearsTxt } from '../core/util';
import { createCelestialMapElement } from './celestial-map';
import { openCraft } from './menus';
import {
  celestialContrib,
  celestialRank,
  celestialRankInfo,
  celestialBranch,
  setCelestialBranch,
  getBranchRanks,
  CELESTIAL_BRANCHES,
  type CelestialBranchInfo,
  type CelestialRankInfo,
  canPromoteCelestialRank,
  promoteCelestialRank,
  canClaimCelestialSalary,
  claimCelestialSalary,
  getCelestialMissions,
  isMissionDone,
  completeMission,
  donateSpiritStones,
  getCelestialVaultEntries,
  redeemVaultItem,
  type VaultEntry,
  PLACE_TO_BRANCH,
  isCelestialTiThiDone,
  celestialTiThi,
  isCelestialDaiBiOpen,
  celestialDaiBiNext,
  isCelestialDaiBiDone,
  celestialDaiBi,
  celestialVeinCost,
  celestialVein,
  celestialCrusade,
  celestialWander,
  celestialBlessing,
  celestialDonateBagItem,
  celestialUsurpPolite,
  celestialUsurpRuthless,
  recruitCelestialDisciples,
} from '../engine/celestial-faction';
import { checkAndGrantOfficeTreasure } from '../engine/celestial-duty';
import { openRainMiniGame, openBountyHuntMiniGame, openSoulCatchMiniGame } from './celestial-duty-ui';

const selPlace: Record<string, string> = {};
const activeSubView: Record<string, string | null> = {};

interface Card {
  t: string;
  sub?: string;
  fn: () => void;
  dis?: boolean;
  hl?: boolean;
  why?: string;
  icon?: string;
  edge?: string;
  note?: string;
}

function grid(cards: Card[], start = 0): HTMLElement {
  const g = h('div', { class: 'pl-grid' });
  cards.forEach((c, i) => {
    g.append(
      h(
        'button',
        {
          class: 'pl-card' + (c.hl ? ' hl' : '') + (c.dis ? ' dis' : ''),
          disabled: c.dis,
          title: c.why || '',
          onclick: c.fn,
          'data-k': String(start + i + 1),
        },
        h('span', { class: 'pl-num' }, String(start + i + 1)),
        c.icon ? h('span', { class: 'pl-ic', html: c.icon }) : null,
        h(
          'span',
          { class: 'pl-txt' },
          h('b', {}, c.t),
          c.sub || c.why
            ? h(
                'small',
                {},
                c.sub || '',
                c.dis && c.why ? h('span', { class: 'pl-why' }, (c.sub ? ' · ' : '') + c.why) : null
              )
            : null,
          c.note ? h('small', { class: 'pl-note' }, c.note) : null
        )
      )
    );
    if (c.edge) (g.lastElementChild as HTMLElement).style.borderLeftColor = c.edge;
    if (c.icon) (g.lastElementChild as HTMLElement).classList.add('has-ic');
  });
  return g;
}

// Banner kiến trúc thần thoại SVG chuẩn tông môn (pl-banner + pl-art + pl-badge)
function celestialBannerSvg(id: CelestialId, placeName: string): string {
  switch (id) {
    case 'diaphu': {
      return `<svg viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dpSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#130e1a"/>
            <stop offset="100%" stop-color="#271727"/>
          </linearGradient>
          <linearGradient id="dpVongXuyen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8f1e24" stop-opacity="0.7"/>
            <stop offset="50%" stop-color="#d13b3b" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#5a1217" stop-opacity="0.7"/>
          </linearGradient>
        </defs>
        <rect width="600" height="150" fill="url(#dpSky)"/>
        <path d="M0 120 L60 65 L130 102 L210 50 L280 95 L370 45 L460 100 L530 60 L600 90 L600 120Z" fill="#221626" opacity="0.8"/>
        <path d="M0 125 L90 85 L180 115 L280 75 L380 110 L480 80 L600 118 L600 125Z" fill="#2d1b32" opacity="0.9"/>
        <rect y="120" width="600" height="30" fill="#1c1421"/>
        <!-- Dòng Vong Xuyên rực đỏ hoa bỉ ngạn -->
        <path d="M0 135 Q150 125 300 138 T600 132 L600 150 L0 150Z" fill="url(#dpVongXuyen)"/>
        <circle cx="80" cy="124" r="3" fill="#ff3344"/><circle cx="95" cy="126" r="2.5" fill="#ff2233"/>
        <circle cx="220" cy="128" r="3" fill="#ff3344"/><circle cx="510" cy="125" r="3" fill="#ff4455"/>
        <!-- Cổng Quỷ Môn Quan uy nghiêm -->
        <rect x="234" y="42" width="12" height="78" fill="#1c1722" stroke="#4a3754" stroke-width="1.5"/>
        <rect x="354" y="42" width="12" height="78" fill="#1c1722" stroke="#4a3754" stroke-width="1.5"/>
        <path d="M216 42 L384 42 L372 32 L228 32Z" fill="#2f2438" stroke="#6e527c" stroke-width="1.5"/>
        <path d="M206 32 Q300 16 394 32 L386 24 Q300 10 214 24Z" fill="#1b1322" stroke="#a1424a" stroke-width="1.5"/>
        <line x1="246" y1="55" x2="354" y2="55" stroke="#8f1e24" stroke-width="3"/>
        <circle cx="224" cy="56" r="5" fill="#4ae3b5" opacity="0.8"/><circle cx="224" cy="56" r="10" fill="#4ae3b5" opacity="0.2"/>
        <circle cx="376" cy="56" r="5" fill="#4ae3b5" opacity="0.8"/><circle cx="376" cy="56" r="10" fill="#4ae3b5" opacity="0.2"/>
        <!-- Biển hiệu chữ vàng sơn son -->
        <rect x="180" y="16" width="240" height="22" rx="3" fill="#1c131c" stroke="#d4af37" stroke-width="1.5"/>
        <text x="300" y="32" font-size="12" font-weight="bold" fill="#fae8b4" text-anchor="middle" font-family="'Noto Serif', serif">ĐỊA PHỦ · ${placeName.toUpperCase()}</text>
      </svg>`;
    }

    case 'thiendinh': {
      return `<svg viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="tdSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fcf6e8"/>
            <stop offset="60%" stop-color="#f5e5c4"/>
            <stop offset="100%" stop-color="#ecd4a1"/>
          </linearGradient>
        </defs>
        <rect width="600" height="150" fill="url(#tdSky)"/>
        <!-- Biển mây chín tầng trời -->
        <ellipse cx="120" cy="118" rx="160" ry="35" fill="#ffffff" opacity="0.85"/>
        <ellipse cx="320" cy="124" rx="200" ry="40" fill="#ffffff" opacity="0.9"/>
        <ellipse cx="500" cy="116" rx="170" ry="36" fill="#ffffff" opacity="0.85"/>
        <rect y="125" width="600" height="25" fill="#f5eedb"/>
        <!-- Bậc thang ngọc bạch thạch -->
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="${240 + i * 8}" y="${120 - i * 5}" width="${120 - i * 16}" height="5" fill="#e8dec3" stroke="#c7b997" stroke-width="0.8"/>`).join('')}
        <!-- Nam Thiên Môn / Lăng Tiêu Bảo Điện uy nghi vàng son -->
        <rect x="236" y="40" width="12" height="70" fill="#b83a2d" stroke="#872419" stroke-width="1.2"/>
        <rect x="352" y="40" width="12" height="70" fill="#b83a2d" stroke="#872419" stroke-width="1.2"/>
        <path d="M216 42 L384 42 L372 30 L228 30Z" fill="#dfb746" stroke="#b58c27" stroke-width="1.5"/>
        <path d="M204 30 Q300 14 396 30 L388 22 Q300 8 212 22Z" fill="#dfb746" stroke="#8a6514" stroke-width="1.5"/>
        <line x1="180" y1="120" x2="180" y2="35" stroke="#705423" stroke-width="2"/><path d="M180 35 L212 43 L180 52Z" fill="#b83a2d"/>
        <line x1="420" y1="120" x2="420" y2="35" stroke="#705423" stroke-width="2"/><path d="M420 35 L452 43 L420 52Z" fill="#dfb746"/>
        <path d="M90 45 Q100 40 110 43 Q102 46 90 45Z" fill="#6b5a45" opacity="0.6"/>
        <path d="M510 38 Q520 33 530 36 Q522 39 510 38Z" fill="#6b5a45" opacity="0.6"/>
        <!-- Biển hiệu hoàng kim -->
        <rect x="170" y="14" width="260" height="22" rx="3" fill="#221a10" stroke="#dfb746" stroke-width="1.6"/>
        <text x="300" y="30" font-size="12" font-weight="bold" fill="#fae8b4" text-anchor="middle" font-family="'Noto Serif', serif">THIÊN ĐÌNH · ${placeName.toUpperCase()}</text>
      </svg>`;
    }

    case 'linhson': {
      return `<svg viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lsSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fffbee"/>
            <stop offset="60%" stop-color="#f7eccb"/>
            <stop offset="100%" stop-color="#e8d39e"/>
          </linearGradient>
        </defs>
        <rect width="600" height="150" fill="url(#lsSky)"/>
        <!-- Núi Thứu Sơn & Đạo Tràng Tây Thiên -->
        <path d="M0 120 L80 50 L160 100 L250 40 L340 95 L440 35 L520 85 L600 55 L600 120Z" fill="#8a734e" opacity="0.35"/>
        <path d="M0 125 L100 80 L200 112 L300 70 L420 108 L510 78 L600 115 L600 125Z" fill="#a68c5b" opacity="0.5"/>
        <rect y="120" width="600" height="30" fill="#d9c598"/>
        <!-- Hào quang Phật chiếu rọi từ Đại Lôi Âm Tự -->
        <circle cx="300" cy="65" r="48" fill="none" stroke="#e5be49" stroke-width="1.8" opacity="0.7" stroke-dasharray="4,3"/>
        <circle cx="300" cy="65" r="36" fill="none" stroke="#e5be49" stroke-width="1.2" opacity="0.8"/>
        <!-- Tháp Cổ Đại Lôi Âm Tự -->
        <rect x="280" y="45" width="40" height="65" fill="#6b4e28" stroke="#4a3315" stroke-width="1.2"/>
        <path d="M260 48 L340 48 L330 36 L270 36Z" fill="#9e773a" stroke="#5e431a"/>
        <path d="M272 36 L328 36 L320 25 L280 25Z" fill="#b88d44" stroke="#5e431a"/>
        <path d="M250 120 C270 100 330 100 350 120Z" fill="#d98293" opacity="0.75"/>
        <!-- Biển hiệu Đại Hùng -->
        <rect x="170" y="12" width="260" height="22" rx="3" fill="#2b1f13" stroke="#e5be49" stroke-width="1.5"/>
        <text x="300" y="28" font-size="12" font-weight="bold" fill="#fae8b4" text-anchor="middle" font-family="'Noto Serif', serif">LINH SƠN · ${placeName.toUpperCase()}</text>
      </svg>`;
    }

    case 'yeugioi': {
      return `<svg viewBox="0 0 600 150" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ygSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#111d16"/>
            <stop offset="60%" stop-color="#1b2d22"/>
            <stop offset="100%" stop-color="#283d2e"/>
          </linearGradient>
        </defs>
        <rect width="600" height="150" fill="url(#ygSky)"/>
        <!-- Dãy núi Thập Vạn Đại Sơn hiểm trở -->
        <path d="M0 120 L70 45 L150 105 L230 35 L310 98 L400 40 L490 100 L560 50 L600 95 L600 120Z" fill="#17261c" opacity="0.75"/>
        <path d="M0 125 L90 80 L190 115 L290 70 L400 110 L500 75 L600 115 L600 125Z" fill="#223628" opacity="0.85"/>
        <rect y="120" width="600" height="30" fill="#19291f"/>
        <!-- Sấm sét Tích Lôi Sơn -->
        <path d="M210 20 L220 50 L212 55 L225 85" stroke="#a78bfa" stroke-width="1.5" fill="none" opacity="0.7"/>
        <path d="M390 15 L380 45 L388 50 L375 80" stroke="#a78bfa" stroke-width="1.5" fill="none" opacity="0.7"/>
        <!-- Cổng Vạn Yêu chạm khắc sừng thú và đại thụ -->
        <rect x="238" y="45" width="14" height="75" fill="#33251c" stroke="#1c130d" stroke-width="1.5"/>
        <rect x="348" y="45" width="14" height="75" fill="#33251c" stroke="#1c130d" stroke-width="1.5"/>
        <path d="M210 45 Q300 18 390 45 L380 34 Q300 10 220 34Z" fill="#233a29" stroke="#4ade80" stroke-width="1.5"/>
        <circle cx="228" cy="60" r="5" fill="#4ade80" opacity="0.85"/><circle cx="228" cy="60" r="12" fill="#4ade80" opacity="0.2"/>
        <circle cx="372" cy="60" r="5" fill="#4ade80" opacity="0.85"/><circle cx="372" cy="60" r="12" fill="#4ade80" opacity="0.2"/>
        <!-- Biển hiệu Vạn Yêu -->
        <rect x="165" y="14" width="270" height="22" rx="3" fill="#17241b" stroke="#4ade80" stroke-width="1.5"/>
        <text x="300" y="30" font-size="12" font-weight="bold" fill="#fae8b4" text-anchor="middle" font-family="'Noto Serif', serif">YÊU GIỚI · ${placeName.toUpperCase()}</text>
      </svg>`;
    }
  }
}

function celestialBadge(id: CelestialId): HTMLElement {
  const configs: Record<CelestialId, { bg: string; glyph: string }> = {
    diaphu: { bg: '#3a1e3d', glyph: 'demon' },
    thiendinh: { bg: '#916d25', glyph: 'crown' },
    linhson: { bg: '#b38827', glyph: 'holy' },
    yeugioi: { bg: '#2b5435', glyph: 'paw' },
  };
  const c = configs[id];
  return h(
    'div',
    { class: 'emb pl-badge', style: { background: c.bg } },
    h('i', { html: glyphSvg(c.glyph, 18, 2) })
  );
}

function openUsurpModal(realmId: CelestialId, placeId: string, o: COfficeView) {
  const R = CELESTIAL[realmId];
  const curP = R.places.find((p) => p.id === placeId) || R.places[0];

  const body = h('div', { class: 'modal-body', style: { padding: '8px 4px' } });

  // Banner đối thủ
  body.append(
    h(
      'div',
      {
        style: {
          background: 'rgba(138, 36, 36, 0.08)',
          border: '1px solid rgba(138, 36, 36, 0.3)',
          borderRadius: '6px',
          padding: '12px 14px',
          marginBottom: '14px',
        },
      },
      h('h3', { style: { margin: '0 0 6px', color: '#b91c1c' } }, `⚔️ Khiêu Chiến Đoạt Vị · 【${o.title}】`),
      h(
        'p',
        { class: 'small', style: { margin: '0 0 4px', lineHeight: '1.5' } },
        'Đối thủ đương nhiệm: ',
        h('b', {}, o.name),
        h('span', { class: 'pill', style: { marginLeft: '6px' } }, o.realm),
        o.daoHao ? h('span', { class: 'pill', style: { marginLeft: '4px' } }, o.daoHao) : null
      ),
      h('p', { class: 'small muted', style: { margin: '0' } }, `Đạo tràng trấn thủ: ${curP.n} · Thực lực của ngươi: ${REALMS[s.r].n} (${STAGES[s.st]})`)
    )
  );

  body.append(
    h(
      'p',
      { class: 'small', style: { marginBottom: '14px', lineHeight: '1.5' } },
      'Ngươi muốn cướp đoạt chức vị này để xưng bá thần triều, hưởng bổng lộc và uy quyền tối thượng. Hãy lựa chọn thái độ khiêu chiến đối với thế lực:'
    )
  );

  // Card 1: Thái độ đoan chính
  const politeCard = h(
    'div',
    {
      style: {
        background: 'rgba(37, 99, 235, 0.05)',
        border: '1px solid rgba(37, 99, 235, 0.3)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '10px',
      },
    },
    h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
      h('b', { style: { color: '#1d4ed8' } }, '1. Thái Độ Đoan Chính (Ước Hẹn Quang Minh)'),
      h('span', { class: 'pill', style: { background: '#1d4ed8', color: '#fff', fontSize: '11px' } }, 'Chính Đạo Tỉ Thí')
    ),
    h(
      'ul',
      { class: 'small muted', style: { margin: '0 0 10px', paddingLeft: '18px', lineHeight: '1.5' } },
      h('li', {}, `Chỉ cần đơn đả độc đấu 1v1 với ${o.name} trên lôi đài, môn hạ không can thiệp.`),
      h('li', {}, 'Đánh thua: Chỉ bị trọng thương dưỡng bệnh, giữ được tính mạng tiếp tục tu luyện.'),
      h('li', {}, `Đánh thắng: Danh chính ngôn thuận tiếp quản chức vị 【${o.title}】, chư tiên nể phục, không lo phản trắc.`)
    ),
    btn(
      'Khai chiến · Thái độ đoan chính',
      () => {
        closeModal();
        run(() => celestialUsurpPolite(realmId, o));
      },
      'prime'
    )
  );

  // Card 2: Thái độ ngang tàng
  const ruthlessCard = h(
    'div',
    {
      style: {
        background: 'rgba(185, 28, 28, 0.05)',
        border: '1px solid rgba(185, 28, 28, 0.3)',
        borderRadius: '6px',
        padding: '12px',
      },
    },
    h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
      h('b', { style: { color: '#b91c1c' } }, '2. Thái Độ Ngang Tàng (Huyết Tẩy Cướp Ngôi)'),
      h('span', { class: 'pill', style: { background: '#b91c1c', color: '#fff', fontSize: '11px' } }, 'Huyết Chiến Sinh Tử')
    ),
    h(
      'ul',
      { class: 'small muted', style: { margin: '0 0 10px', paddingLeft: '18px', lineHeight: '1.5' } },
      h('li', {}, `Đạp cửa đại điện coi khinh môn quy! Phải liên tiếp huyết chiến với Hộ Pháp Thần Tướng và toàn lực ${o.name}.`),
      h(
        'li',
        { style: { color: '#b91c1c', fontWeight: '500' } },
        'Đánh thua: TỬ TRẬN! Hồn lìa khỏi xác thành cô hồn dã quỷ, bị âm sai câu hồn xuống Địa Phủ xét xử (Tùy Thiện/Ác bị đày 18 tầng địa ngục hoặc làm quan tại địa phủ hoặc đầu thai).'
      ),
      h('li', {}, 'Đánh thắng: San bằng thế lực, được chọn Đánh phục tất cả (có nguy cơ phản bội) hoặc Giết sạch để chiêu mộ môn đồ mới từ đầu.')
    ),
    btn(
      'Huyết chiến · Thái độ ngang tàng',
      () => {
        closeModal();
        run(() => celestialUsurpRuthless(realmId, o));
      },
      'danger'
    )
  );

  body.append(politeCard, ruthlessCard);

  openModal(`Khiêu Chiến Đoạt Vị · ${o.title}`, body, { wide: true });
}

export function openCelestialPlace(id: CelestialId, placeId: string) {
  const R = CELESTIAL[id];
  const w = s.world ?? 0;
  if (!hasCelestialRealms(w)) return;
  selPlace[id] = placeId;

  // Tự động đồng bộ nhánh chức vụ tương ứng với địa danh đang thăm viếng
  const mappedBranch = PLACE_TO_BRANCH[id]?.[placeId];
  if (mappedBranch) {
    setCelestialBranch(id, mappedBranch);
  }

  const curP = R.places.find((p) => p.id === placeId) || R.places[0];
  const contrib = celestialContrib(id);
  const activeBranchId = celestialBranch(id);
  const branchList = CELESTIAL_BRANCHES[id];
  const activeBranch = branchList.find((b) => b.id === activeBranchId) || branchList[0];
  const curRank = celestialRank(id, activeBranchId);
  const rankInfo = celestialRankInfo(id, activeBranchId);
  const canSalary = canClaimCelestialSalary(id);
  const missions = getCelestialMissions(id);
  const doneCount = missions.filter((m) => isMissionDone(id, m.id)).length;
  const offices = celestialOffices(id, w);
  const placeOffices = offices.filter((o) => o.place === placeId);

  // Tự động kiểm tra và ban Pháp Bảo Trấn Chức tương ứng với chức vị
  checkAndGrantOfficeTreasure(id, activeBranchId);

  const after = (fn: () => void) => () => {
    closeModal();
    fn();
  };

  const drawPlace = () => {
    openModal(`${curP.n} · ${R.n}`, placeBody(), {
      wide: true,
      xBtn: true,
      noClose: true,
      sub: `${R.kind} · ${curP.d}`,
    });
  };

  const placeBody = (): HTMLElement[] => {
    const subView = activeSubView[id];

    // 1. Banner kiến trúc địa danh chuẩn tông môn (.pl-banner)
    const banner = h(
      'div',
      { class: 'pl-banner', style: { marginBottom: '8px' } },
      h('div', { class: 'pl-art', html: celestialBannerSvg(id, curP.n) }),
      celestialBadge(id)
    );

    // 2. Thống kê nhanh chức vị và cống hiến
    const statsBar = h(
      'div',
      {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--line)',
          borderRadius: '4px',
          padding: '7px 12px',
          marginBottom: '10px',
          gap: '8px',
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' } },
        h(
          'span',
          {},
          'Tiên chức: ',
          h('b', { style: { color: R.line } }, `【${rankInfo.title}】`),
          h('small', { class: 'muted', style: { marginLeft: '4px' } }, `(${activeBranch.name.split(' · ')[0]})`)
        ),
        h('span', {}, 'Cống hiến: ', h('b', { style: { color: '#b83b3b' } }, `${fmt(contrib)} điểm`)),
        h('span', { class: 'muted small' }, 'Bổng lộc: ', h('b', { style: { color: '#b45309' } }, `${fmt(rankInfo.salaryStones)} linh thạch`), h('span', { style: { color: '#b83b3b', marginLeft: '4px' } }, `(+${rankInfo.salaryContrib} cống hiến)`), ' / năm')
      ),
      h(
        'div',
        { style: { display: 'flex', gap: '6px' } },
        btn(
          canSalary ? 'Lĩnh bổng lộc năm nay' : 'Đã nhận bổng lộc',
          () => {
            if (!canSalary) return;
            const res = claimCelestialSalary(id);
            toast(res);
            drawPlace();
          },
          canSalary ? 'small prime' : 'small ghost',
          { dis: !canSalary }
        )
      )
    );

    // 3. Đoạn miêu tả phong vị địa danh & chư thần trấn thủ
    const holderNames = placeOffices.map((o) => `${o.title} (${o.holder})`).join(', ');
    const descText = `${curP.d}${holderNames ? ' Trấn thủ nơi này: ' + holderNames + '.' : ''}`;
    const desc = h('p', { class: 'small', style: { fontStyle: 'italic', margin: '0 0 12px', lineHeight: '1.5' } }, descText);

    // XỬ LÝ GIAO DIỆN PHỤ (SUB-VIEWS KHI BẤM VÀO THẺ 1-15)
    if (subView) {
      const backBar = h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' } },
        btn('← Trở về ' + curP.n, () => { activeSubView[id] = null; drawPlace(); }, 'prime'),
        h('b', { style: { color: R.line } }, `【${curP.n} · ${R.n}】`)
      );

      const subContent = h('div', { class: 'sub-content' });

      // VIEW 1: NHẬN NHIỆM VỤ PHỤNG MỆNH & CHẤP CHÍNH
      if (subView === 'mission') {
        subContent.append(
          h('h4', { style: { margin: '0 0 8px', color: R.line } }, 'Điện Phụng Mệnh · Nhiệm Vụ Thần Triều & Chấp Chính Đặc Thù'),
          h('p', { class: 'small muted', style: { marginBottom: '12px' } }, 'Hoàn thành các mệnh lệnh chấp chính tiên chức đặc thù (Hành vân bố vũ, Truy bắt kẻ xấu, Câu hồn người chết) cùng các việc tuần tra, cống nộp để tích lũy điểm cống hiến thần triều.')
        );

        // KHỐI NHIỆM VỤ ĐẶC THÙ TIÊN CHỨC (MINI-GAMES)
        const miniGameBox = h(
          'div',
          {
            style: {
              background: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid #d97706',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '14px',
            },
          },
          h('b', { style: { color: '#b45309', display: 'block', marginBottom: '8px', fontSize: '13px' } }, '⭐ Chấp Hành Trọng Trách Tiên Chức (Nhiệm Vụ Kèm Mini-Game)'),
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            // Nhiệm vụ 1: Hành vân bố vũ
            h(
              'div',
              { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fed7aa' } },
              h('div', {},
                h('b', { style: { color: '#0369a1' } }, '🌧️ Hành Vân Bố Vũ (Chiếu Chỉ Ngọc Hoàng)'),
                h('small', { style: { display: 'block', color: '#475569' } }, 'Mini-game Long Vương: Tạo mây, kích lôi, đổ mưa đúng lượng nước chiếu chỉ ban. Không thừa gây lụt, không thiếu gây hạn!')
              ),
              btn('Khởi Giá Bố Vũ', () => openRainMiniGame(id, () => drawPlace()), 'small prime')
            ),
            // Nhiệm vụ 2: Truy bắt kẻ xấu 2 bước
            h(
              'div',
              { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fed7aa' } },
              h('div', {},
                h('b', { style: { color: '#b91c1c' } }, '⚖️ Truy Nã Kẻ Xấu · Quy Án & Xử Trảm (2 Bước)'),
                h('small', { style: { display: 'block', color: '#475569' } }, 'Bước 1: Nhờ Chiếu Yêu Kính định vị tà tu trốn chạy. Bước 2: Vây bắt, quy án xét xử hoặc TRẢM TẠI CHỖ nếu chống cự quyết liệt!')
              ),
              btn('Tiếp Nhận Truy Nã', () => openBountyHuntMiniGame(id, () => drawPlace()), 'small prime')
            ),
            // Nhiệm vụ 3: Câu hồn người chết
            h(
              'div',
              { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fed7aa' } },
              h('div', {},
                h('b', { style: { color: '#7e22ce' } }, '👻 Hạ Phàm Câu Hồn (Hắc Bạch Vô Thường)'),
                h('small', { style: { display: 'block', color: '#475569' } }, 'Hạ phàm câu hồn người chết theo mệnh: Giải quyết oan khuất chưa tan bằng điều tra hoặc trảm sát tà tu cướp phách!')
              ),
              btn('Xuất Quân Câu Hồn', () => openSoulCatchMiniGame(id, () => drawPlace()), 'small prime')
            )
          )
        );
        subContent.append(miniGameBox);

        const mList = h('div', { class: 'list' });

        // Sắp xếp: Nhiệm vụ tại địa danh hiện tại lên đầu, tiếp đến việc chưa xong, cuối cùng là việc đã làm
        const sortedMissions = [...missions].sort((a, b) => {
          const aDone = isMissionDone(id, a.id) ? 1 : 0;
          const bDone = isMissionDone(id, b.id) ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          const aHere = a.placeId === curP.id ? 1 : 0;
          const bHere = b.placeId === curP.id ? 1 : 0;
          return bHere - aHere;
        });

        for (const m of sortedMissions) {
          const done = isMissionDone(id, m.id);
          const hasItem = m.type === 'donate_item' && m.reqItem && m.reqItemCount ? count(m.reqItem) >= m.reqItemCount : true;
          const isHere = m.placeId === curP.id;
          const targetPlace = m.placeId ? R.places.find((p) => p.id === m.placeId) : null;

          let iconGlyph = 'token';
          let iconBg = '#8a2424';
          let typeLabel = 'Nhiệm vụ';

          if (done) {
            iconGlyph = 'win';
            iconBg = '#4b5563';
          } else if (m.type === 'patrol') {
            iconGlyph = 'gate';
            iconBg = '#1d4ed8';
            typeLabel = 'Tuần Tra';
          } else if (m.type === 'meditate') {
            iconGlyph = 'holy';
            iconBg = '#7e22ce';
            typeLabel = 'Chiêm Bái';
          } else if (m.type === 'donate_item') {
            iconGlyph = m.reqItem?.startsWith('h:') ? 'herb' : 'ore';
            iconBg = '#b45309';
            typeLabel = 'Cung Nộp';
          } else if (m.type === 'slay') {
            iconGlyph = 'weapon';
            iconBg = '#b91c1c';
            typeLabel = 'Tiễu Trừ';
          }

          mList.append(
            h(
              'div',
              {
                class: 'item',
                style: {
                  opacity: done ? '0.7' : '1',
                  background: done ? 'rgba(0,0,0,0.03)' : isHere ? 'rgba(217, 119, 6, 0.05)' : 'transparent',
                  borderLeft: isHere && !done ? '3px solid #d97706' : '3px solid transparent',
                  padding: '10px',
                },
              },
              h('div', { class: 'ic', style: { background: iconBg }, html: glyphSvg(iconGlyph, 20) }),
              h(
                'div',
                { class: 'nm' },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                  h('b', {}, m.title),
                  h('span', { class: 'pill', style: { fontSize: '11px' } }, typeLabel),
                  targetPlace
                    ? h(
                        'span',
                        {
                          class: 'pill',
                          style: {
                            fontSize: '11px',
                            background: isHere ? '#15803d' : 'rgba(0,0,0,0.06)',
                            color: isHere ? '#fff' : 'inherit',
                            fontWeight: isHere ? 'bold' : 'normal',
                          },
                        },
                        isHere ? `⭐ Tại ${targetPlace.n}` : targetPlace.n
                      )
                    : null,
                  done ? h('span', { class: 'pill', style: { background: '#4b5563', color: '#fff', fontSize: '11px' } }, 'Đã xong năm nay') : null
                ),
                h('small', { style: { marginTop: '4px', display: 'block', lineHeight: '1.4' } }, m.desc),
                m.type === 'donate_item' && m.reqItem && m.reqItemCount
                  ? h(
                      'small',
                      { style: { color: hasItem ? '#15803d' : '#b91c1c', fontWeight: '500', display: 'block', marginTop: '2px' } },
                      `Yêu cầu vật phẩm: ${m.reqItemCount}x ${itemName(m.reqItem)} (hiện có trong túi: ${count(m.reqItem)})`
                    )
                  : null,
                h('small', { class: 'muted', style: { display: 'block', marginTop: '2px' } }, `Phần thưởng: +${m.rewardContrib} cống hiến thần triều, +${fmt(m.rewardStones)} linh thạch`)
              ),
              btn(
                done ? 'Đã xong' : m.type === 'donate_item' && !hasItem ? 'Thiếu vật phẩm' : m.type === 'donate_item' ? 'Giao nộp' : 'Chấp hành',
                () => {
                  const res = completeMission(id, m);
                  addLog(res.msg, res.ok ? 'good' : 'bad');
                  drawPlace();
                },
                done ? 'small ghost' : m.type === 'donate_item' && !hasItem ? 'small ghost' : 'small prime',
                { dis: done || !hasItem }
              )
            )
          );
        }
        subContent.append(mList);
      }

      // VIEW 2: NHIỆM VỤ ĐƯỜNG (GIAO NỘP VẬT PHẨM LẤY CỐNG HIẾN)
      else if (subView === 'deliver') {
        subContent.append(
          h('h4', { style: { margin: '0 0 8px', color: R.line } }, 'Nhiệm Vụ Đường · Cung Nộp Khoáng Thạch, Dược Thảo & Tài Vật'),
          h('p', { class: 'small muted', style: { marginBottom: '12px' } }, 'Giao nộp các loại linh thảo, khoáng thạch, linh đan hoặc phù lục trong túi trữ vật để quy đổi lấy cống hiến thần khố.')
        );

        const bagItems = Object.keys(s.bag).filter((k) => (k.startsWith('m:') || k.startsWith('h:') || k.startsWith('t:') || k.startsWith('p:')) && count(k) > 0);
        if (bagItems.length === 0) {
          subContent.append(h('p', { class: 'muted center', style: { padding: '20px' } }, 'Túi trữ vật của ngươi không có khoáng thạch, thảo dược hay phù lục nào để giao nộp.'));
        } else {
          const dList = h('div', { class: 'list' });
          for (const k of bagItems) {
            const qty = count(k);
            const tier = itemTier(k);
            const pr = itemPrice(k);
            const contribPer = Math.max(10, Math.round(tier * 25 + pr * 0.08));
            dList.append(
              h(
                'div',
                { class: 'item', style: { padding: '8px 10px' } },
                h('div', { class: 'ic', style: { background: '#2c3e50' }, html: glyphSvg(k.startsWith('h:') ? 'herb' : k.startsWith('m:') ? 'ore' : 'talisman', 18) }),
                h(
                  'div',
                  { class: 'nm' },
                  h('b', {}, itemName(k)),
                  h('span', { class: 'pill', style: { marginLeft: '6px' } }, `Cấp ${tier}`),
                  h('small', { class: 'muted' }, `Trong túi: ${qty} cái · Đổi được +${contribPer} cống hiến / cái`)
                ),
                h(
                  'div',
                  { style: { display: 'flex', gap: '4px' } },
                  btn('Nộp 1', () => { celestialDonateBagItem(id, k, 1); drawPlace(); }, 'small prime'),
                  qty >= 5 ? btn('Nộp 5', () => { celestialDonateBagItem(id, k, 5); drawPlace(); }, 'small ghost') : null,
                  qty >= 10 ? btn('Nộp hết', () => { celestialDonateBagItem(id, k, qty); drawPlace(); }, 'small ghost') : null
                )
              )
            );
          }
          subContent.append(dList);
        }
      }

      // VIEW 3: TÀNG KINH CÁC ĐỊA PHƯƠNG
      else if (subView === 'library') {
        subContent.append(
          h('h4', { style: { margin: '0 0 8px', color: R.line } }, `Tàng Kinh Các · Bí Điển Bản Địa ${curP.n}`),
          h('p', { class: 'small muted', style: { marginBottom: '12px' } }, 'Học hoặc khắc lục các bộ công pháp, võ kỹ, tâm pháp độc quyền chỉ được lưu truyền tại đạo tràng này.')
        );

        const techList = h('div', { class: 'list' });
        const artIds = CELESTIAL_PLACE_ARTS[id]?.[placeId] || [];
        const placeTechs: Tech[] = [];
        const placeSkills: Skill[] = [];
        const placeTams: (typeof TAMPHAP)[string][] = [];
        const placePqs: (typeof PHAPQUYET)[string][] = [];

        for (const aId of artIds) {
          if (aId.startsWith('cp:')) {
            const it = TECHS[aId.slice(3)];
            if (it) placeTechs.push(it);
          } else if (aId.startsWith('sk:')) {
            const it = SKILLS[aId.slice(3)];
            if (it) placeSkills.push(it);
          } else if (aId.startsWith('tp:')) {
            const it = TAMPHAP[aId.slice(3)];
            if (it) placeTams.push(it);
          } else if (aId.startsWith('fq:')) {
            const it = PHAPQUYET[aId.slice(3)];
            if (it) placePqs.push(it);
          }
        }

        if (artIds.length === 0) {
          techList.append(h('p', { class: 'muted center', style: { padding: '20px' } }, 'Nơi đây không cất giữ tàng thư đại đạo, hãy tới các cung điện và tự viện chính.'));
        }

        for (const t of placeTechs) {
          const learned = s.tech === t.id || ((s.flags.techSeen as string[] | undefined) || []).includes(t.id);
          const req = learnReq(t.tier);
          const can = effRi() >= req;
          const cost = (t.tier + 1) * 200;
          techList.append(
            h(
              'div',
              { class: 'item', style: { padding: '8px 10px' } },
              h('div', { class: 'ic', style: { background: '#8a2424' }, html: glyphSvg('book', 18) }),
              h(
                'div',
                { class: 'nm' },
                h('b', {}, t.n),
                h('span', { class: 'pill' }, 'Công pháp'),
                h('span', { class: 'pill', style: { color: TIER_C[t.tier] } }, techGrade(t)),
                learned ? h('span', { class: 'pill' }, 'Đã học') : null,
                h('small', {}, t.d),
                h('small', { class: 'muted' }, `Yêu cầu cảnh giới: ${REALMS[req].n} · Khắc lục tốn ${cost} linh thạch`)
              ),
              h(
                'div',
                { style: { display: 'flex', gap: '4px' } },
                btn(learned ? 'Đã học' : 'Tham ngộ', () => { learnTech(t.id, true); addLog(`Đã chuyển tu ${t.n}!`, 'good'); drawPlace(); }, 'small prime', { dis: learned || !can }),
                btn('Khắc lục', () => {
                  if (s.money < cost) { addLog('Không đủ linh thạch khắc lục!', 'bad'); return; }
                  s.money -= cost;
                  addItem('b:' + t.id, 1);
                  addLog(`Khắc lục thành công bí kíp ${t.n}!`, 'good');
                  drawPlace();
                }, 'small ghost', { dis: s.money < cost })
              )
            )
          );
        }

        for (const sk of placeSkills) {
          const learned = s.skills.includes(sk.id);
          const req = learnReq(sk.tier);
          const can = effRi() >= req;
          const cost = (sk.tier + 1) * 220;
          techList.append(
            h(
              'div',
              { class: 'item', style: { padding: '8px 10px' } },
              h('div', { class: 'ic', style: { background: '#1e3a8a' }, html: glyphSvg('skill', 18) }),
              h(
                'div',
                { class: 'nm' },
                h('b', {}, sk.n),
                h('span', { class: 'pill' }, 'Võ kỹ'),
                h('span', { class: 'pill', style: { color: TIER_C[sk.tier] } }, skillGrade(sk)),
                learned ? h('span', { class: 'pill' }, 'Đã lĩnh ngộ') : null,
                h('small', {}, sk.d),
                h('small', { class: 'muted' }, `Yêu cầu cảnh giới: ${REALMS[req].n} · Khắc lục tốn ${cost} linh thạch`)
              ),
              h(
                'div',
                { style: { display: 'flex', gap: '4px' } },
                btn(learned ? 'Đã học' : 'Tham ngộ', () => { learnSkill(sk.id); addLog(`Đã lĩnh ngộ chiêu thức ${sk.n}!`, 'good'); drawPlace(); }, 'small prime', { dis: learned || !can }),
                btn('Khắc lục', () => {
                  if (s.money < cost) { addLog('Không đủ linh thạch khắc lục!', 'bad'); return; }
                  s.money -= cost;
                  addItem('s:' + sk.id, 1);
                  addLog(`Khắc lục thành công bí kíp ${sk.n}!`, 'good');
                  drawPlace();
                }, 'small ghost', { dis: s.money < cost })
              )
            )
          );
        }

        for (const tm of placeTams) {
          const learned = tamList().includes(tm.id);
          const req = learnReq(tm.tier);
          const can = effRi() >= req;
          const cost = (tm.tier + 1) * 250;
          techList.append(
            h(
              'div',
              { class: 'item', style: { padding: '8px 10px' } },
              h('div', { class: 'ic', style: { background: '#5e2750' }, html: glyphSvg('heart', 18) }),
              h(
                'div',
                { class: 'nm' },
                h('b', {}, tm.n),
                h('span', { class: 'pill' }, 'Tâm pháp'),
                h('span', { class: 'pill', style: { color: TIER_C[tm.tier] } }, tamGrade(tm)),
                learned ? h('span', { class: 'pill' }, 'Đã thông') : null,
                h('small', {}, tamEffect(tm)),
                h('small', { class: 'muted' }, `Yêu cầu cảnh giới: ${REALMS[req].n} · Khắc lục tốn ${cost} linh thạch`)
              ),
              h(
                'div',
                { style: { display: 'flex', gap: '4px' } },
                btn(learned ? 'Đã thông' : 'Tham ngộ', () => { tamList().push(tm.id); addLog(`Đã ngộ tâm pháp ${tm.n}!`, 'good'); drawPlace(); }, 'small prime', { dis: learned || !can }),
                btn('Khắc lục', () => {
                  if (s.money < cost) { addLog('Không đủ linh thạch khắc lục!', 'bad'); return; }
                  s.money -= cost;
                  addItem('tm:' + tm.id, 1);
                  addLog(`Khắc lục thành công tâm pháp ${tm.n}!`, 'good');
                  drawPlace();
                }, 'small ghost', { dis: s.money < cost })
              )
            )
          );
        }

        for (const pq of placePqs) {
          const learned = pqList().includes(pq.id);
          const req = learnReq(pq.tier);
          const can = effRi() >= req;
          const cost = (pq.tier + 1) * 250;
          techList.append(
            h(
              'div',
              { class: 'item', style: { padding: '8px 10px' } },
              h('div', { class: 'ic', style: { background: '#1c4e4f' }, html: glyphSvg('magic', 18) }),
              h(
                'div',
                { class: 'nm' },
                h('b', {}, pq.n),
                h('span', { class: 'pill' }, 'Pháp quyết'),
                h('span', { class: 'pill', style: { color: TIER_C[pq.tier] } }, pqGrade(pq)),
                learned ? h('span', { class: 'pill' }, 'Đã học') : null,
                h('small', {}, pq.d),
                h('small', { class: 'muted' }, `Yêu cầu cảnh giới: ${REALMS[req].n} · Khắc lục tốn ${cost} linh thạch`)
              ),
              h(
                'div',
                { style: { display: 'flex', gap: '4px' } },
                btn(learned ? 'Đã học' : 'Tham ngộ', () => { pqList().push(pq.id); addLog(`Đã ngộ pháp quyết ${pq.n}!`, 'good'); drawPlace(); }, 'small prime', { dis: learned || !can }),
                btn('Khắc lục', () => {
                  if (s.money < cost) { addLog('Không đủ linh thạch khắc lục!', 'bad'); return; }
                  s.money -= cost;
                  addItem('pq:' + pq.id, 1);
                  addLog(`Khắc lục thành công pháp quyết ${pq.n}!`, 'good');
                  drawPlace();
                }, 'small ghost', { dis: s.money < cost })
              )
            )
          );
        }

        subContent.append(techList);
      }

      // VIEW 4: BẢO KHỐ THẦN GIỚI
      else if (subView === 'vault') {
        subContent.append(
          h('h4', { style: { margin: '0 0 8px', color: R.line } }, `Thần Giới Bảo Khố · ${R.n}`),
          h('p', { class: 'small muted', style: { marginBottom: '12px' } }, `Dùng điểm cống hiến thần triều (hiện có: ${fmt(contrib)}) để hoán đổi Đế Khí, Tiên Binh, Linh Đan Thượng Phẩm.`)
        );

        const vList = h('div', { class: 'list' });
        const entries = getCelestialVaultEntries(id);

        for (const entry of entries) {
          const canBuy = contrib >= entry.contribCost;
          const free = bagFree();
          vList.append(
            h(
              'div',
              { class: 'item', style: { padding: '10px' } },
              h('div', { class: 'ic', style: { background: '#b45309' }, html: glyphSvg(entry.id.startsWith('w:') ? 'weapon' : entry.id.startsWith('a:') ? 'armor' : 'treasure', 20) }),
              h(
                'div',
                { class: 'nm' },
                h('b', {}, entry.n),
                h('span', { class: 'pill', style: { color: TIER_C[entry.tier] } }, `Bậc ${entry.tier + 1}`),
                h('small', {}, entry.desc),
                h('small', { style: { color: canBuy ? 'var(--gold)' : 'var(--seal)' } }, `Giá đổi: ${fmt(entry.contribCost)} điểm cống hiến`)
              ),
              btn(
                'Hoán đổi',
                () => {
                  const res = redeemVaultItem(id, entry);
                  addLog(res.msg, res.ok ? 'good' : 'bad');
                  drawPlace();
                },
                'small prime',
                { dis: !canBuy || free <= 0 }
              )
            )
          );
        }
        subContent.append(vList);
      }

      // VIEW 5: TIÊN QUAN THƯỜNG TRỰC TẠI ĐỊA DANH
      else if (subView === 'roster') {
        subContent.append(
          h('h4', { style: { margin: '0 0 8px', color: R.line } }, `Chư Vị Tiên Quan & Thần Tướng Trấn Thủ · ${curP.n}`),
          h('p', { class: 'small muted', style: { marginBottom: '12px' } }, 'Các vị thần tiên, đại năng và phán quan trấn giữ đạo tràng này trong kỷ nguyên hiện tại. Có thể khiêu chiến đoạt lấy chức vị!')
        );

        if (placeOffices.length === 0) {
          subContent.append(h('p', { class: 'muted center', style: { padding: '20px' } }, 'Địa danh này chưa có thần tiên nào thường trú túc trực.'));
        } else {
          const rList = h('div', { class: 'list' });
          for (const o of placeOffices) {
            const isMe = o.isPlayer || s?.flags?.celestialUsurped?.[`${id}:${o.title}`] === true;
            rList.append(
              h(
                'div',
                {
                  class: 'item',
                  style: {
                    padding: '10px',
                    background: isMe ? 'rgba(21, 128, 61, 0.06)' : 'transparent',
                    borderLeft: isMe ? '3px solid #16a34a' : 'none',
                  },
                },
                h('div', { class: 'ic', style: { background: isMe ? '#15803d' : o.tier === 0 ? '#b45309' : o.tier === 1 ? '#8a2424' : '#2c3e50' }, html: glyphSvg(isMe ? 'win' : o.tier === 0 ? 'holy' : 'crown', 20) }),
                h(
                  'div',
                  { class: 'nm' },
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                    h('b', {}, o.name),
                    h('span', { class: 'pill', style: { borderColor: '#d4af37', color: '#e5be49' } }, o.title),
                    h('span', { class: 'pill' }, o.realm),
                    o.daoHao ? h('span', { class: 'pill', style: { opacity: '0.8' } }, o.daoHao) : null,
                    isMe ? h('span', { class: 'pill', style: { background: '#15803d', color: '#fff', fontWeight: 'bold' } }, '👑 Đương nhiệm') : null
                  ),
                  h('small', { style: { display: 'block', marginTop: '3px' } }, o.d)
                ),
                !isMe
                  ? btn(
                      '⚔️ Khiêu chiến đoạt vị',
                      () => openUsurpModal(id, placeId, o),
                      'small prime'
                    )
                  : h('span', { class: 'pill', style: { background: '#15803d', color: '#fff' } }, 'Đang nắm giữ')
              )
            );
          }
          subContent.append(rList);
        }

        // Nếu đạo tràng này đã bị giết sạch để chiêu mộ lại từ đầu:
        const canRecruit = s?.flags?.celestialRecruitNew?.[`${id}:${placeId}`] === true;
        const recruitMap = (s.flags.celestialRecruitedDisciples ||= {});
        const recruitedList: string[] = (recruitMap[`${id}:${placeId}`] as string[]) || [];

        if (canRecruit || recruitedList.length > 0) {
          subContent.append(
            h('h4', { style: { margin: '16px 0 6px', color: R.line } }, '✦ Môn Đồ & Thần Tướng Trung Thành Mới'),
            h('p', { class: 'small muted', style: { marginBottom: '10px' } }, 'Các môn đồ và thần tướng mới trung thành tuyệt đối do ngươi chiêu mộ trấn giữ nơi đây.')
          );

          if (recruitedList.length > 0) {
            const discList = h('div', { class: 'list', style: { marginBottom: '10px' } });
            for (const dName of recruitedList) {
              discList.append(
                h(
                  'div',
                  { class: 'item', style: { padding: '8px 10px' } },
                  h('div', { class: 'ic', style: { background: '#16a34a' }, html: glyphSvg('cultivator', 18) }),
                  h(
                    'div',
                    { class: 'nm' },
                    h('b', {}, dName),
                    h('span', { class: 'pill', style: { background: '#15803d', color: '#fff', marginLeft: '6px' } }, 'Trung thành 100%'),
                    h('small', { class: 'muted' }, 'Môn đồ tâm phúc, phụng mệnh trấn giữ tiên cảnh.')
                  )
                )
              );
            }
            subContent.append(discList);
          }

          subContent.append(
            h(
              'div',
              { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' } },
              btn(
                'Chiêu mộ thần tướng mới (-2,000 linh thạch)',
                () => {
                  const res = recruitCelestialDisciples(id, placeId);
                  addLog(res.msg, res.ok ? 'good' : 'bad');
                  drawPlace();
                },
                'small prime',
                { dis: s.money < 2000 }
              )
            )
          );
        }
      }

      // VIEW 11: THÂN PHẬN & TIÊN CHỨC THẦN THOẠI
      else if (subView === 'ranks') {
        subContent.append(
          h('h4', { style: { margin: '0 0 8px', color: R.line } }, 'Hệ Thống Tiên Chức Thần Thoại & Đạo Tràng Phụng Sự'),
          h('p', { class: 'small muted', style: { marginBottom: '12px' } }, 'Chọn chi nhánh điện phủ phù hợp với căn cơ đạo thống để tiến hành thăng phong chức vị và nhận bổng lộc hàng năm.')
        );

        const branchPills = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' } });
        for (const b of branchList) {
          const isAct = b.id === activeBranchId;
          const bRank = celestialRank(id, b.id);
          const bTitle = b.ranks[Math.min(b.ranks.length - 1, bRank)].title;
          branchPills.append(
            h(
              'button',
              {
                onclick: () => { setCelestialBranch(id, b.id); drawPlace(); },
                style: {
                  background: isAct ? '#8a2424' : 'rgba(0,0,0,.06)',
                  color: isAct ? '#fff8e7' : 'inherit',
                  border: `1px solid ${isAct ? R.line : 'var(--line)'}`,
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: isAct ? '600' : '400',
                },
              },
              b.name,
              h('small', { style: { opacity: '.85', marginLeft: '5px' } }, `· ${bTitle}`)
            )
          );
        }

        const bHeader = h(
          'div',
          { style: { background: 'rgba(0,0,0,.04)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px' } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' } },
            h('h4', { style: { margin: 0, color: R.line } }, activeBranch.name),
            h('span', { class: 'pill', style: { color: '#e5be49', borderColor: '#d4af37' } }, `Lãnh đạo nhánh: ${activeBranch.leader}`)
          ),
          h('p', { class: 'small muted', style: { margin: '4px 0 0' } }, `Đạo tràng: ${activeBranch.hall} · ${activeBranch.desc}`)
        );

        const rList = h('div', { class: 'list', style: { marginBottom: '14px' } });
        activeBranch.ranks.forEach((rk: CelestialRankInfo, idx: number) => {
          const isCurrent = idx === curRank;
          const isPassed = idx < curRank;
          const isBranchHead = idx === 4;
          const isSupreme = idx === 5;

          rList.append(
            h(
              'div',
              {
                class: 'item',
                style: {
                  opacity: isPassed ? 0.75 : 1,
                  background: isCurrent ? 'rgba(138, 36, 36, 0.08)' : isSupreme ? 'rgba(218, 165, 32, 0.08)' : 'transparent',
                  border: isCurrent ? `1px solid ${R.line}` : isBranchHead ? '1px dashed #d4af37' : '1px solid transparent',
                  padding: '8px 10px',
                },
              },
              h('div', { class: 'ic', style: { background: isSupreme ? '#d4af37' : isBranchHead ? '#8a2424' : isCurrent ? '#a13b3b' : 'rgba(0,0,0,.5)' }, html: glyphSvg(isSupreme ? 'holy' : 'crown', 20) }),
              h(
                'div',
                { class: 'nm' },
                h('b', { style: { color: isSupreme ? '#b45309' : isBranchHead ? '#8a2424' : 'inherit' } }, `Bậc ${idx + 1}: ${rk.title}`),
                isCurrent ? h('span', { class: 'pill', style: { color: '#e5be49', borderColor: '#d4af37', marginLeft: '6px' } }, 'Đang giữ chức') : null,
                isPassed ? h('span', { class: 'pill', style: { marginLeft: '6px' } }, 'Đã kinh qua') : null,
                h('small', {}, rk.desc),
                h('small', { class: 'muted' }, `Cần: ${fmt(rk.minContrib)} cống hiến · Cảnh giới: ${REALMS[rk.minRealm].n} · Bổng lộc: ${fmt(rk.salaryStones)} linh thạch/năm (+${rk.salaryContrib} cống hiến)`)
              )
            )
          );
        });

        const promoteCheck = canPromoteCelestialRank(id, activeBranchId);
        const promoteSec = h(
          'div',
          { style: { background: 'rgba(0,0,0,.04)', border: '1px solid var(--line)', borderRadius: '6px', padding: '12px' } },
          h('h4', { style: { margin: '0 0 6px', color: R.line } }, `Thăng Phong Tiên Chức · ${activeBranch.name}`),
          h('p', { class: 'small' }, promoteCheck.ok ? `Ngươi đã đủ điều kiện sắc phong lên 【${promoteCheck.next?.title}】!` : `Chưa đủ điều kiện: ${promoteCheck.why}`),
          btn('Cầu Phong Tiên Chức', () => {
            promoteCelestialRank(id, activeBranchId);
            checkAndGrantOfficeTreasure(id, activeBranchId);
            drawPlace();
          }, 'prime', { dis: !promoteCheck.ok })
        );

        subContent.append(branchPills, bHeader, rList, promoteSec);
      }

      // VIEW 13: CÚNG DƯỜNG LINH THẠCH
      else if (subView === 'donate') {
        subContent.append(
          h('h4', { style: { margin: '0 0 8px', color: R.line } }, 'Cúng Dường Thần Khố · Đổi Lấy Cống Hiến'),
          h('p', { class: 'small muted', style: { marginBottom: '14px' } }, 'Quyên góp linh thạch vào thần khố cõi thần để tích lũy công đức và cống hiến dùng chung cho toàn bộ các nhánh trong thần giới.'),
          h(
            'div',
            { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            btn('Cúng 1,000 linh thạch (+100 cống hiến)', () => { donateSpiritStones(id, 1); drawPlace(); }, 'small ghost', { dis: s.money < 1000 }),
            btn('Cúng 5,000 linh thạch (+550 cống hiến)', () => { donateSpiritStones(id, 2); drawPlace(); }, 'small ghost', { dis: s.money < 5000 }),
            btn('Cúng 20,000 linh thạch (+2,500 cống hiến)', () => { donateSpiritStones(id, 3); drawPlace(); }, 'small prime', { dis: s.money < 20000 })
          )
        );
      }

      return [banner, statsBar, desc, backBar, subContent];
    }

    // MAIN VIEW: GIAO DIỆN LƯỚI 15 THẺ TÔNG MÔN (.pl-grid)
    const cards: Card[] = [];

    // Thẻ 1: Nhận nhiệm vụ phụng mệnh & Chấp chính đặc thù
    cards.push({
      t: 'Nhận nhiệm vụ · Chấp chính đặc thù',
      sub: `Hành vân bố vũ, Truy nã kẻ xấu, Câu hồn... · ${missions.length} việc (${fmt(contrib)} cống hiến)`,
      hl: true,
      fn: () => { activeSubView[id] = 'mission'; drawPlace(); },
    });

    // Thẻ 2: Nhiệm Vụ Đường (Giao nộp vật phẩm)
    cards.push({
      t: 'Nhiệm Vụ Đường',
      sub: 'Giao nộp khoáng thạch, linh thảo, đan dược lấy cống hiến',
      fn: () => { activeSubView[id] = 'deliver'; drawPlace(); },
    });

    // Thẻ 3: Tàng Kinh Các Thần Giới
    cards.push({
      t: 'Tàng Kinh Các',
      sub: 'Công pháp, võ kỹ, tâm pháp, pháp quyết độc quyền bản địa',
      fn: () => { activeSubView[id] = 'library'; drawPlace(); },
    });

    // Thẻ 4: Bảo khố thần giới
    cards.push({
      t: 'Bảo khố thần giới',
      sub: 'Đổi cống hiến lấy Đế Khí, Tiên Binh, Thần Giáp, Linh Vật',
      fn: () => { activeSubView[id] = 'vault'; drawPlace(); },
    });

    // Thẻ 5: Tiên quan thường trực & Khiêu chiến đoạt vị
    cards.push({
      t: 'Tiên quan thường trực',
      sub: `${placeOffices.length} vị thần tướng · Khiêu chiến đoạt vị trí`,
      hl: placeOffices.length > 0,
      fn: () => { activeSubView[id] = 'roster'; drawPlace(); },
    });

    // Thẻ 6: Thỉnh an tiên hiền / Bái sư
    cards.push({
      t: 'Thỉnh an tiên hiền / Bái sư',
      sub: 'Cầu bái đại năng thần giới, tăng tiến đạo hạnh',
      fn: after(() => run(() => celestialBlessing(id))),
    });

    // Thẻ 7: Thần giới tỉ thí
    const tiThiDone = isCelestialTiThiDone(id);
    cards.push({
      t: 'Thần giới tỉ thí',
      sub: tiThiDone ? 'Năm nay đã tham gia tỉ thí' : 'Ba vòng lôi đài với chư thần tướng, thua không tổn mệnh',
      dis: tiThiDone,
      fn: after(() => run(() => celestialTiThi(id))),
    });

    // Thẻ 8: Thần giới đại bỉ / Pháp hội
    const daiBiOpen = isCelestialDaiBiOpen();
    const daiBiDone = isCelestialDaiBiDone(id);
    const festivalTitle = id === 'thiendinh' ? 'Hội Bàn Đào Dao Trì' : id === 'diaphu' ? 'Pháp Hội Vu Lan Bồn' : id === 'yeugioi' ? 'Vạn Yêu Triều Thánh' : 'Linh Sơn Vấn Đạo';
    cards.push({
      t: daiBiOpen ? `${festivalTitle} · đang mở` : festivalTitle,
      sub: daiBiOpen ? (daiBiDone ? 'Năm nay đã tham gia đại hội' : 'Mười năm một lần, năm vòng diễn võ, ban thần đan!') : `Năm ${celestialDaiBiNext()} (còn ${celestialDaiBiNext() - Math.floor(s.year)} năm)`,
      hl: daiBiOpen && !daiBiDone,
      dis: !daiBiOpen || daiBiDone,
      fn: after(() => run(() => celestialDaiBi(id))),
    });

    // Thẻ 9: Bế quan thần mạch / Tiên trì (Tu vi x3)
    const vCost = celestialVeinCost();
    const placePond = id === 'thiendinh' ? 'Dao Trì Tiên Tuyền' : id === 'diaphu' ? 'Hoàng Tuyền Thần Mạch' : id === 'yeugioi' ? 'Vạn Yêu Huyết Trì' : 'Kim Liên Bảo Trì';
    cards.push({
      t: `Bế quan ${placePond}`,
      sub: `1 năm 6 tháng · ${vCost} cống hiến · tu nhanh gấp ba (x3)`,
      dis: contrib < vCost,
      why: contrib < vCost ? `Cần ${vCost} cống hiến` : undefined,
      fn: after(() => run(() => celestialVein(id))),
    });

    // Thẻ 10: Thần ma đại chiến / Giới chiến
    const lastWar = s.flags['cel_war_' + id];
    const warOnCooldown = lastWar && Math.floor(s.year) - lastWar < 3;
    cards.push({
      t: 'Thần ma đại chiến',
      sub: warOnCooldown ? `Đang chỉnh đốn sau chiến dịch (năm ${lastWar + 3} có thể xuất quân)` : 'Chinh phạt Vực Ngoại Ma Tộc phản nghịch (đoạt Hỗn Độn Linh Tinh)',
      dis: !!warOnCooldown,
      hl: !warOnCooldown,
      fn: after(() => run(() => celestialCrusade(id))),
    });

    // Thẻ 11: Thân phận · Tiên chức thần thoại
    const checkPromo = canPromoteCelestialRank(id, activeBranchId);
    cards.push({
      t: checkPromo.ok ? 'Thăng cấp chức vị · đủ điều kiện!' : `Thân phận · ${rankInfo.title}`,
      sub: checkPromo.ok ? 'Ngươi đã đủ điều kiện sắc phong lên bậc kế tiếp!' : `Đạo tràng: ${activeBranch.name.split(' · ')[0]}`,
      hl: checkPromo.ok,
      fn: () => { activeSubView[id] = 'ranks'; drawPlace(); },
    });

    // Thẻ 12: Dạo quanh tiên cảnh
    cards.push({
      t: 'Dạo quanh tiên cảnh',
      sub: `${yearsTxt(2 / 12)} · du ngoạn kỳ ngộ, gặp gỡ chư tiên`,
      fn: after(() => run(() => celestialWander(id))),
    });

    // Thẻ 13: Cúng dường thần khố
    cards.push({
      t: 'Cúng dường linh thạch',
      sub: 'Quyên góp linh thạch đổi lấy cống hiến thần triều',
      fn: () => { activeSubView[id] = 'donate'; drawPlace(); },
    });

    // Thẻ 14: Luyện chế tiên đan / Thần khí
    const furnaceName = id === 'thiendinh' ? 'Lò Bát Quái Đâu Suất' : id === 'diaphu' ? 'Cửu U Minh Hỏa Đỉnh' : id === 'yeugioi' ? 'Tích Lôi Hỏa Lô' : 'Phật Quang Thiền Đỉnh';
    cards.push({
      t: `Luyện chế · ${furnaceName}`,
      sub: 'Tận dụng linh hỏa thần giới để luyện đan & tôi rèn thần binh',
      fn: () => openCraft(0),
    });

    // Thẻ 15: Trở về Bản Đồ Thần Giới
    cards.push({
      t: `← Trở về Bản Đồ ${R.n}`,
      sub: `Quay lại toàn cảnh ${R.n} để chọn đạo tràng / địa danh khác`,
      hl: true,
      fn: () => openCelestial(id),
    });

    return [
      banner,
      statsBar,
      desc,
      grid(cards),
    ];
  };

  drawPlace();
}

export function openCelestial(id: CelestialId) {
  const R = CELESTIAL[id];
  const w = s.world ?? 0;
  if (!hasCelestialRealms(w)) return;
  selPlace[id] ||= R.places[0].id;
  activeSubView[id] = null;

  const contrib = celestialContrib(id);
  const activeBranchId = celestialBranch(id);
  const branchList = CELESTIAL_BRANCHES[id];
  const activeBranch = branchList.find((b) => b.id === activeBranchId) || branchList[0];
  const rankInfo = celestialRankInfo(id, activeBranchId);
  const canSalary = canClaimCelestialSalary(id);

  const drawRealmMap = () =>
    openModal(`${R.n} · ${WORLDS[w]}`, realmMapBody(), {
      wide: true,
      xBtn: true,
      noClose: true,
      sub: `${R.kind} · trần thực lực ${REALMS[celestialTop(w)].n}`,
    });

  const realmMapBody = (): HTMLElement[] => {
    // 1. Thanh trạng thái Thần Triều (Cống hiến, Tiên chức, Bổng lộc)
    const statsBar = h(
      'div',
      {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--line)',
          borderRadius: '4px',
          padding: '8px 14px',
          marginBottom: '10px',
          gap: '8px',
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' } },
        h(
          'span',
          {},
          'Tiên chức: ',
          h('b', { style: { color: R.line } }, `【${rankInfo.title}】`),
          h('small', { class: 'muted', style: { marginLeft: '4px' } }, `(${activeBranch.name.split(' · ')[0]})`)
        ),
        h('span', {}, 'Cống hiến: ', h('b', { style: { color: '#b83b3b' } }, `${fmt(contrib)} điểm`)),
        h('span', { class: 'muted small' }, 'Bổng lộc: ', h('b', { style: { color: '#b45309' } }, `${fmt(rankInfo.salaryStones)} linh thạch`), h('span', { style: { color: '#b83b3b', marginLeft: '4px' } }, `(+${rankInfo.salaryContrib} cống hiến)`), ' / năm')
      ),
      h(
        'div',
        { style: { display: 'flex', gap: '6px' } },
        btn(
          canSalary ? 'Lĩnh bổng lộc năm nay' : 'Đã nhận bổng lộc',
          () => {
            if (!canSalary) return;
            const res = claimCelestialSalary(id);
            toast(res);
            drawRealmMap();
          },
          canSalary ? 'small prime' : 'small ghost',
          { dis: !canSalary }
        )
      )
    );

    // 2. Dẫn nhập thần giới
    const intro = h('p', { class: 'small muted', style: { margin: '0 0 10px', lineHeight: '1.5' } }, R.intro);

    // 3. Bản đồ Thủy Mặc Hình 5 rộng lớn, không nét đứt, mỗi điểm là một tông môn độc lập
    const offices = celestialOffices(id, w);
    const counts: Record<string, number> = {};
    for (const o of offices) counts[o.place] = (counts[o.place] || 0) + 1;

    const map = createCelestialMapElement(id, selPlace[id], (clickedPlaceId) => {
      openCelestialPlace(id, clickedPlaceId);
    }, counts);

    // 4. Danh sách các địa danh / đạo tràng dạng thẻ bấm nhanh
    const quickBar = h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 8px' } },
      h('small', { style: { color: R.line, fontWeight: '600' } }, '✦ Nhấp vào địa danh trên bản đồ hoặc danh sách bên dưới để tiến vào lĩnh địa:'),
      btn('Trở về trần giới', () => closeModal(), 'small prime')
    );

    const placeButtons = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' } });
    for (const p of R.places) {
      const countNum = counts[p.id] || 0;
      placeButtons.append(
        h(
          'button',
          {
            class: 'pill prime',
            style: {
              background: '#8a2424',
              color: '#fff8e7',
              border: '1px solid #731d1d',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '6px 12px',
              fontSize: '12px',
            },
            onclick: () => {
              openCelestialPlace(id, p.id);
            },
          },
          p.n,
          countNum ? h('small', { style: { opacity: '0.85', marginLeft: '5px' } }, `· ${countNum} chức`) : null
        )
      );
    }

    return [
      statsBar,
      intro,
      map,
      quickBar,
      placeButtons,
    ];
  };

  drawRealmMap();
}
