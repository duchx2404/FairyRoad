// Giao diện Modal Lãnh Thổ Yêu Thú & Quỷ Vực Âm Sát Chi Khí
import { h, btn } from './dom';
import { glyphSvg } from './glyph';
import { openModal, closeModal, run } from './modal';
import { s } from '../engine/state';
import { REALMS, EL } from '../data/core';
import { CHANLINH } from '../data/spirit';
import {
  type BeastTerritory,
  type GhostDomain,
  huntBeast,
  tameMount,
  observeTerritory,
  GHOST_RANKS,
  challengeGhostRank,
} from '../engine/wild-territory';
import {
  type YaoSpeciesInfo,
  fightTerritoryClash,
  bribeTerritoryClash,
  identifyYaoSpecies,
  claimTreasureAsKin,
  claimTreasureAsVassal,
  fightForTreasure,
  stealTreasure,
  isSpeciesSubjugated,
} from '../engine/yao-territory';
import { addLog } from '../engine/core';
import { fmt } from '../core/util';

/** Mở giao diện tương tác Lãnh Thổ Yêu Thú */
export function openBeastTerritoryModal(territory: BeastTerritory) {
  const draw = () => {
    const body: HTMLElement[] = [];

    // Header giới thiệu
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(40, 30, 20, 0.06)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '12px',
          },
        },
        h('h4', { style: { margin: '0 0 6px', color: '#b45309' } }, territory.name),
        h('p', { class: 'small', style: { margin: '0 0 8px', lineHeight: '1.5' } }, territory.desc),
        h(
          'p',
          { class: 'small muted', style: { margin: 0, fontStyle: 'italic' } },
          '✦ Ý thức lãnh thổ loài thú: Vùng ngoại vi là nơi sinh tồn của loài yếu. Càng tiến sâu vào hạch tâm cấm địa, uy áp loài mạnh càng khủng khiếp. Kẻ yếu không được xâm phạm cương thổ kẻ mạnh!'
        )
      )
    );

    // Nút quan sát ranh giới
    body.push(
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' } },
        btn('👁️ Quan sát ranh giới sinh tồn', () => {
          const obs = observeTerritory(territory);
          addLog(obs);
          alert(obs);
        }, 'small prime'),
        h('small', { class: 'muted' }, `Ngươi hiện ở cảnh giới: ${REALMS[s.r].n}`)
      )
    );

    // Danh sách phân vùng các loài thú
    const list = h('div', { class: 'list' });
    const tierNames = ['', 'Ngoại Vi Biên Duyên', 'Trung Vực Khâu Lăng', 'Thâm Xứ Sơn Cốc', 'Hạch Tâm Cấm Địa'];

    // Nhóm theo tier
    for (let t = 1; t <= 4; t++) {
      const sps = territory.species.filter((sp) => sp.tier === t);
      if (!sps.length) continue;

      list.append(
        h(
          'div',
          { style: { background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', color: '#8a2424', marginTop: '6px' } },
          `Tầng ${t}: 【${tierNames[t]}】 · Áp lực lãnh thổ ${t >= 3 ? 'Cực Đại' : 'Bình Thường'}`
        )
      );

      for (const sp of sps) {
        const chan = sp.mountId ? CHANLINH[sp.mountId] : null;
        list.append(
          h(
            'div',
            { class: 'item', style: { padding: '10px' } },
            h('div', { class: 'ic', style: { background: '#2a5a3b' }, html: glyphSvg('beast', 22) }),
            h(
              'div',
              { class: 'nm' },
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                h('b', {}, sp.name),
                h('span', { class: 'pill' }, `Bậc: ${REALMS[sp.realm].n}`),
                h('span', { class: 'pill muted' }, `${EL[sp.el].n} hệ`),
                chan ? h('span', { class: 'pill', style: { borderColor: '#d4af37', color: '#b45309' } }, chan.mount ? `Tọa kỵ: ${chan.n}` : `Linh sủng: ${chan.n}`) : null
              ),
              h('small', { style: { display: 'block', marginTop: '3px' } }, sp.desc),
              sp.preyIds && sp.preyIds.length
                ? h(
                    'small',
                    { style: { color: '#b91c1c', display: 'block', marginTop: '2px' } },
                    `Ý thức lãnh thổ: Tuyệt đối không dung thứ cho các loài yếu hơn bén mảng vào vùng săn!`
                  )
                : null
            ),
            h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px' } },
              btn('Săn lấy Yêu Đan', () => {
                const res = huntBeast(territory, sp);
                alert(res.msg);
                draw();
              }, 'small prime'),
              chan
                ? btn(chan.mount ? 'Thu phục Tọa Kỵ' : 'Thu phục Linh Sủng', () => {
                    const res = tameMount(territory, sp);
                    alert(res.msg);
                    draw();
                  }, 'small prime')
                : null
            )
          )
        );
      }
    }

    body.push(list);
    body.push(
      h(
        'div',
        { class: 'center', style: { marginTop: '14px' } },
        btn('Rời khỏi lãnh thổ yêu thú', () => closeModal(), 'prime')
      )
    );

    openModal(territory.name, body, { wide: true, xBtn: true });
  };

  draw();
}

/** Mở giao diện Quỷ Vực Âm Sát Chi Khí */
export function openGhostDomainModal(domain: GhostDomain) {
  const draw = () => {
    const body: HTMLElement[] = [];

    // Header âm sát
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(30, 15, 30, 0.08)',
            border: '1px solid #781d1d',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '12px',
          },
        },
        h('h4', { style: { margin: '0 0 6px', color: '#8a2424' } }, `👻 ${domain.name}`),
        h('p', { class: 'small', style: { margin: '0 0 8px', lineHeight: '1.5' } }, domain.desc),
        h('p', { class: 'small', style: { color: '#991b1b', fontStyle: 'italic', margin: '0 0 8px' } }, `✦ Âm Sát Chi Khí: ${domain.yinAura}`),
        h(
          'p',
          { class: 'small muted', style: { margin: 0, fontWeight: '500' } },
          '✦ Trật tự lãnh thổ Quỷ Vực nghiêm ngặt: Quỷ Vương > Quỷ Soái > Quỷ Tướng > Quỷ Binh > Quỷ Tốt > Dã Quỷ. Dã quỷ lảng vảng ở rìa ngoài, không dám bén mảng vào nội trướng của Quỷ Soái, Quỷ Vương!'
        )
      )
    );

    // Danh sách 6 bậc Quỷ
    const list = h('div', { class: 'list' });
    GHOST_RANKS.forEach((rk, idx) => {
      const isBoss = idx >= 4;
      list.append(
        h(
          'div',
          {
            class: 'item',
            style: {
              background: isBoss ? 'rgba(120, 20, 20, 0.05)' : 'transparent',
              borderLeft: isBoss ? '4px solid #8a2424' : '4px solid #4b5563',
              padding: '10px',
            },
          },
          h('div', { class: 'ic', style: { background: isBoss ? '#8a2424' : '#374151' }, html: glyphSvg(isBoss ? 'crown' : 'skull', 22) }),
          h(
            'div',
            { class: 'nm' },
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
              h('b', { style: { color: isBoss ? '#8a2424' : 'inherit' } }, `Bậc ${6 - idx}: ${rk.title}`),
              h('span', { class: 'pill' }, `Thực lực: ${REALMS[rk.realm].n}`),
              h('small', { class: 'muted' }, `Phần thưởng: ${fmt(rk.soulDrop * 5)} linh thạch`)
            ),
            h('small', { style: { display: 'block', marginTop: '3px' } }, rk.desc)
          ),
          btn(
            idx >= 3 ? 'Khiêu chiến trảm quỷ' : 'Siêu độ vong hồn',
            () => {
              const res = challengeGhostRank(domain, idx);
              alert(res.msg);
              draw();
            },
            idx >= 4 ? 'small prime' : 'small ghost'
          )
        )
      );
    });

    body.push(list);
    body.push(
      h(
        'div',
        { class: 'center', style: { marginTop: '14px' } },
        btn('Rời khỏi quỷ vực âm sát', () => closeModal(), 'prime')
      )
    );

    openModal(domain.name, body, { wide: true, xBtn: true });
  };

  draw();
}

/** Modal xử lý Mâu Thuẫn Cương Thổ Yêu Tộc khi sang địa phận loài khác */
export function openTerritoryClashModal(domSpec: YaoSpeciesInfo, onResolved?: () => void) {
  const mySpec = identifyYaoSpecies(s.beast);
  let logText = `Ngươi mang yêu khí 【${mySpec.name}】 bước vào vùng săn của 【${domSpec.name}】! Đàn thú bản địa coi đây là hành vi xâm lấn lãnh thổ nghiêm trọng. Tiếng gầm thét đe dọa vang vọng khắp sơn lâm!`;

  const draw = () => {
    const body: HTMLElement[] = [];

    // Header mâu thuẫn
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(185, 28, 28, 0.08)',
            border: '1px solid #b91c1c',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '12px',
          },
        },
        h('h4', { style: { margin: '0 0 6px', color: '#b91c1c' } }, `⚔️ Mâu Thuẫn Cương Thổ · ${domSpec.name}`),
        h('p', { class: 'small', style: { margin: '0 0 6px', lineHeight: '1.5' } }, `Quy tắc hoang dã: Kẻ mạnh vi tôn! Nếu đánh thắng cả tộc đối phương thì chúng phải cúi đầu THẦN PHỤC làm tộc phụ dung, dâng nạp cống phẩm, tuyệt đối không có quyền lợi ngang hàng!`),
        h('p', { class: 'small muted', style: { margin: 0, fontStyle: 'italic' } }, `✦ Bản thân ngươi là ${mySpec.name} (Họ ${mySpec.surname}). Đối diện là Đầu Đàn ${domSpec.name} (Họ ${domSpec.surname}).`)
      )
    );

    // Bảng diễn tiến
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(0,0,0,0.03)',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '14px',
            fontSize: '13px',
            lineHeight: '1.5',
          },
        },
        logText
      )
    );

    // Lựa chọn hành động
    const actionBox = h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
      btn('⚔️ Khai Chiến Trấn Áp (Đánh bại đầu đàn, ép toàn tộc THẦN PHỤC)', () => {
        const res = fightTerritoryClash(domSpec);
        logText = res.msg;
        alert(res.msg);
        if (res.ok) {
          closeModal();
          if (onResolved) onResolved();
        } else {
          draw();
        }
      }, 'prime'),
      btn('🌿 Cống Nạp Linh Dược (Ngoại giao cầu hòa tạm thời)', () => {
        const res = bribeTerritoryClash(domSpec);
        logText = res.msg;
        alert(res.msg);
        closeModal();
        if (onResolved) onResolved();
      }, 'ghost'),
      btn('💨 Rút Lui Về Lãnh Địa Loài Mình', () => {
        closeModal();
      }, 'ghost')
    );

    body.push(actionBox);
    openModal('Đụng Độ Cương Thổ Yêu Tộc', body, { wide: true, xBtn: true });
  };

  draw();
}

/** Modal tương tác Thiên Tài Địa Bảo do tộc Yêu Thú canh giữ */
export function openTreasureModal(spec: YaoSpeciesInfo, onDone?: () => void) {
  const tr = spec.treasure;
  const mySpec = identifyYaoSpecies(s.beast);
  const isKin = mySpec.speciesKey === spec.speciesKey;
  const isVassal = isSpeciesSubjugated(spec);

  const draw = () => {
    const body: HTMLElement[] = [];

    // Header linh bảo
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid #d97706',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '12px',
          },
        },
        h('h4', { style: { margin: '0 0 6px', color: '#b45309' } }, `✨ Thiên Tài Địa Bảo · ${tr.name}`),
        h('p', { class: 'small', style: { margin: '0 0 6px', lineHeight: '1.5' } }, tr.desc),
        h('p', { class: 'small', style: { color: '#0369a1', margin: '0 0 6px' } }, `🌱 Môi trường sinh dưỡng: ${tr.envDesc}`),
        h('p', { class: 'small', style: { color: '#15803d', fontWeight: 'bold', margin: '0 0 6px' } }, `✦ Dược hiệu kỳ diệu: ${tr.effect}`),
        h(
          'p',
          { class: 'small muted', style: { margin: 0, fontStyle: 'italic' } },
          `🛡️ Thú Hộ Bảo canh giữ: 【${tr.guardian}】 (Cảnh giới ${REALMS[tr.guardianRealm].n}). Toàn tộc ${spec.name} coi đây là bản mệnh linh bảo, không cho phép ngoại tộc tự tiện xâm phạm!`
        )
      )
    );

    // Tình trạng sở hữu / quan hệ
    let statusText = '';
    if (isKin) {
      statusText = `Ngươi là đồng tộc ${spec.name}! Các bậc trưởng bối coi sóc linh bảo, cho phép tộc nhân định kỳ tiến vào hấp thu linh khí để đột phá cảnh giới.`;
    } else if (isVassal) {
      statusText = `Tộc ${spec.name} đã THẦN PHỤC ngươi làm Tôn Chủ! Bầy thú canh giữ linh bảo này chỉ để phụng sự và dâng nộp cho ngươi.`;
    } else {
      statusText = `Ngươi là người ngoài! Thú Hộ Bảo cùng bầy ${spec.name} đang gườm gườm canh chừng. Muốn đoạt bảo phải đánh bại Thú Hộ Bảo hoặc mạo hiểm hái trộm!`;
    }

    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(0,0,0,0.03)',
            padding: '10px 12px',
            borderRadius: '4px',
            marginBottom: '14px',
            fontSize: '12.5px',
            color: isKin ? '#15803d' : isVassal ? '#b45309' : '#b91c1c',
            fontWeight: '500',
          },
        },
        statusText
      )
    );

    // Các lựa chọn hành động
    const actionBox = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });

    if (isKin) {
      actionBox.append(
        btn('🌿 Hấp Thu Linh Khí Bản Mệnh (Đồng Tộc Thụ Dụng)', () => {
          const res = claimTreasureAsKin(spec);
          alert(res.msg);
          if (res.ok) {
            closeModal();
            if (onDone) onDone();
          }
        }, 'prime')
      );
    } else if (isVassal) {
      actionBox.append(
        btn('👑 Thu Nạp Cống Phẩm (Tộc Phụ Dung Kính Cẩn Dâng Nộp)', () => {
          const res = claimTreasureAsVassal(spec);
          alert(res.msg);
          if (res.ok) {
            closeModal();
            if (onDone) onDone();
          }
        }, 'prime')
      );
    } else {
      actionBox.append(
        btn(`⚔️ Khai Chiến Cường Đoạt (Quyết đấu ${tr.guardian})`, () => {
          const res = fightForTreasure(spec);
          alert(res.msg);
          if (res.ok) {
            closeModal();
            if (onDone) onDone();
          }
        }, 'prime'),
        btn('🍃 Ẩn Nấp Hái Trộm (Thử vận may lẩn tránh)', () => {
          const res = stealTreasure(spec);
          alert(res.msg);
          if (res.ok) {
            closeModal();
            if (onDone) onDone();
          }
        }, 'ghost')
      );
    }

    actionBox.append(
      btn('Rời Khỏi Cấm Địa Linh Bảo', () => {
        closeModal();
      }, 'ghost')
    );

    body.push(actionBox);
    openModal(`Cấm Địa Thiên Tài Địa Bảo · ${tr.name}`, body, { wide: true, xBtn: true });
  };

  draw();
}
