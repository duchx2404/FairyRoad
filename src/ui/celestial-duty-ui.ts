// Giao diện UI cho Hệ thống Chấp Hành Tiên Chức & Mini-Game Thần Thoại:
// - Mini-game 1: Hành Vân Bố Vũ (Đong đếm lượng mưa theo chiếu chỉ Ngọc Hoàng)
// - Mini-game 2: Truy Bắt Kẻ Xấu / Phản Tặc (Bước 1: Tìm người bằng Chiếu Yêu Kính -> Bước 2: Vây bắt, quy án hoặc trảm tại chỗ)
// - Mini-game 3: Câu Hồn Người Chết (Hạ phàm câu hồn, điều tra giải oan hoặc trảm ma tu cướp phách)

import { h, btn } from './dom';
import { glyphSvg } from './glyph';
import { openModal, closeModal, run } from './modal';
import { s } from '../engine/state';
import { type CelestialId, CELESTIAL } from '../data/celestial';
import {
  initRainMission,
  actGatherClouds,
  actTriggerLightning,
  actCastRain,
  actFinishRain,
  type RainMissionState,
  genWantedCriminal,
  trackCriminal,
  confrontCriminal,
  executeAtSite,
  sendToPrison,
  type WantedCriminal,
  type CaptureResult,
  genSoulMission,
  conductSoulCatch,
  investigateGrievance,
  defeatEvilCult,
  type SoulMissionState,
} from '../engine/celestial-duty';
import { celestialRankInfo, celestialBranch } from '../engine/celestial-faction';
import { fmt } from '../core/util';

/** Modal Mini-Game 1: Hành Vân Bố Vũ (Long Vương / Thủy Quân) */
export function openRainMiniGame(id: CelestialId, onDone?: () => void) {
  let st = initRainMission();
  let logText = `Tiếp nhận chiếu chỉ Ngọc Hoàng: Lập tức khởi giá tới 【${st.targetRegion}】, làm mưa đúng hạn định: 【${st.targetWater} tấc nước】! Tuyệt đối không được sai lệch quá 2 tấc!`;

  const draw = () => {
    const body: HTMLElement[] = [];

    // Header chiếu chỉ
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(30, 80, 150, 0.08)',
            border: '1px solid #1e40af',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '12px',
          },
        },
        h('h4', { style: { margin: '0 0 6px', color: '#1e3a8a' } }, '📜 Chiếu Chỉ Ngọc Hoàng Đại Đế · Hành Vân Bố Vũ'),
        h('p', { class: 'small', style: { margin: '0 0 6px', lineHeight: '1.5' } }, `Hạ chiếu khẩn cấp: Miền đất 【${st.targetRegion}】 đang gặp thời tiết biến đổi. Nay sắc lệnh Long Vương khởi hành nghi trượng, tích tụ mây mưa, ban phát đúng 【${st.targetWater} tấc nước】 để cứu tế muôn dân.`),
        h('p', { class: 'small muted', style: { margin: 0, fontStyle: 'italic' } }, '✦ Quy tắc Thiên Điều: Nếu mưa thiếu quá 2 tấc sẽ gây hạn hán (trừ cống hiến). Nếu mưa thừa quá 2 tấc sẽ gây lũ lụt ngập dân (phạm thiên quy, bị lôi phạt). Hoàn thành chuẩn xác sẽ ban thưởng hậu hĩnh!')
      )
    );

    // Thanh đo lượng nước trực quan
    const pct = Math.min(100, Math.round((st.currentWater / (st.targetWater * 1.3)) * 100));
    const targetPct = Math.round((st.targetWater / (st.targetWater * 1.3)) * 100);

    const meterBar = h(
      'div',
      {
        style: {
          background: 'rgba(0,0,0,0.06)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px',
          textAlign: 'center',
        },
      },
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' } },
        h('span', { style: { color: '#0369a1' } }, `Lượng nước hiện tại: ${st.currentWater} tấc`),
        h('span', { style: { color: '#b45309' } }, `Mục tiêu chiếu chỉ: ${st.targetWater} tấc (±2)`),
        h('span', { class: 'muted small' }, `Số lượt thi pháp: ${st.step}/${st.maxSteps}`)
      ),
      h(
        'div',
        { style: { position: 'relative', width: '100%', height: '22px', background: '#e2e8f0', borderRadius: '11px', overflow: 'hidden' } },
        h('div', {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${pct}%`,
            background: pct > targetPct + 10 ? '#ef4444' : pct >= targetPct - 8 ? '#10b981' : '#3b82f6',
            transition: 'width 0.3s ease',
          },
        }),
        h('div', {
          style: {
            position: 'absolute',
            left: `${targetPct}%`,
            top: 0,
            width: '4px',
            height: '100%',
            background: '#b45309',
            boxShadow: '0 0 6px #f59e0b',
          },
          title: 'Vạch mục tiêu chuẩn xác',
        })
      ),
      st.lightningBoost ? h('div', { style: { color: '#9333ea', fontWeight: 'bold', marginTop: '6px', fontSize: '12px' } }, '⚡ Đang tích tụ Thiên Lôi! Đợt trút mưa kế tiếp tăng x1.5 lượng nước!') : null
    );
    body.push(meterBar);

    // Bảng nhật ký biến cố
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
            lineHeight: '1.5',
            color: '#334155',
            minHeight: '44px',
          },
        },
        logText
      )
    );

    // Các nút thi triển pháp thuật
    if (!st.completed) {
      const actions = h(
        'div',
        { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' } },
        btn('☁️ Tích Tụ Vân Vụ (+4~7 tấc)', () => {
          logText = actGatherClouds(st);
          draw();
        }, 'prime'),
        btn('⚡ Kích Phát Thiên Lôi (x1.5 mưa)', () => {
          logText = actTriggerLightning(st);
          draw();
        }, 'ghost', { dis: st.lightningBoost }),
        btn('🌧️ Hành Vân Bố Vũ (+8~13 tấc)', () => {
          logText = actCastRain(st);
          draw();
        }, 'prime'),
        btn('🚩 Phất Kỳ Thu Vũ (Khóa mức nước)', () => {
          const res = actFinishRain(id, st);
          logText = res.msg;
          draw();
        }, 'prime')
      );
      body.push(actions);
    } else {
      body.push(
        h(
          'div',
          { class: 'center', style: { marginTop: '12px' } },
          btn('Hoàn Tất Bẩm Tấu Chiếu Chỉ', () => {
            closeModal();
            if (onDone) onDone();
          }, 'prime')
        )
      );
    }

    openModal('Hành Vân Bố Vũ · Phụng Mệnh Long Vương', body, { wide: true, xBtn: true });
  };

  draw();
}

/** Modal Mini-Game 2: Truy Bắt Kẻ Xấu / Phản Tặc (Thần Tướng / Chấp Pháp Sứ) */
export function openBountyHuntMiniGame(id: CelestialId, onDone?: () => void) {
  let c = genWantedCriminal();
  let step = 1; // 1: Dò tìm, 2: Đối mặt, 3: Kết cục
  let logText = `Điện Chấp Pháp phát lệnh truy nã khẩn cấp: Ác tặc 【${c.name}】 phạm tội 【${c.crime}】. Hiện đã trốn khỏi thiên môn, cần lập tức định vị và truy bắt!`;
  let fightRes: CaptureResult | null = null;

  const draw = () => {
    const body: HTMLElement[] = [];

    // Header truy nã
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(150, 30, 30, 0.08)',
            border: '1px solid #991b1b',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '12px',
          },
        },
        h('h4', { style: { margin: '0 0 6px', color: '#991b1b' } }, `⚡ Truy Nã Phạm Nhân · ${c.name}`),
        h('p', { class: 'small', style: { margin: '0 0 4px' } }, `Tội danh: ${c.crime}`),
        h('p', { class: 'small muted', style: { margin: 0 } }, `Thực lực ước tính: ${c.realm} phẩm · Trạng thái: ${c.found ? `Đã phát hiện tại 【${c.hideout}】` : 'Đang lẩn trốn trong hư không'}`)
      )
    );

    // Diễn tiến nhật ký
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

    // BƯỚC 1: TÌM NGƯỜI
    if (step === 1) {
      body.push(
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          h('p', { class: 'small', style: { fontWeight: 'bold' } }, 'Bước 1: Định vị hành tung phạm nhân'),
          h(
            'div',
            { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            btn('🔍 Tự mình dò tìm theo ma khí (Xác suất)', () => {
              const res = trackCriminal(c, false, id);
              logText = res.msg;
              if (res.ok) step = 2;
              draw();
            }, 'prime'),
            btn('🪞 Nhờ soi Chiếu Yêu Kính (100% tìm thấy)', () => {
              const res = trackCriminal(c, true, id);
              logText = res.msg;
              step = 2;
              draw();
            }, 'prime')
          )
        )
      );
    }

    // BƯỚC 2: VÂY BẮT & ĐỐI MẶT
    else if (step === 2) {
      body.push(
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          h('p', { class: 'small', style: { fontWeight: 'bold' } }, `Bước 2: Bao vây sào huyệt tại 【${c.hideout}】`),
          btn('⚔️ Khai Chiến Vây Bắt Phạm Nhân', () => {
            fightRes = confrontCriminal(c);
            logText = fightRes.msg;
            if (fightRes.ok) step = 3;
            draw();
          }, 'prime')
        )
      );
    }

    // BƯỚC 3: XỬ LÝ KẾT CỤC (QUY ÁN HOẶC TRẢM TẠI CHỖ)
    else if (step === 3 && fightRes) {
      const finishActions = h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } });

      if (fightRes.fierceResistance) {
        // Chống cự quyết liệt: Trảm tại chỗ
        finishActions.append(
          btn('🗡️ TRẢM QUYẾT TẠI CHỖ (Trảm thủ cấp trừ tà)', () => {
            logText = executeAtSite(id, c);
            step = 4;
            draw();
          }, 'prime')
        );
      } else {
        // Đầu hàng: Áp giải về quy án
        finishActions.append(
          btn('⛓️ Áp Giải Về Thiên Lao / Địa Ngục', () => {
            logText = sendToPrison(id, c, id === 'diaphu' ? 'hell' : 'jail');
            step = 4;
            draw();
          }, 'prime'),
          btn('⚖️ Khảo Đao Trảm Quyết Thị Chúng', () => {
            logText = sendToPrison(id, c, 'execute');
            step = 4;
            draw();
          }, 'ghost')
        );
      }
      body.push(finishActions);
    } else if (step === 4) {
      body.push(
        h(
          'div',
          { class: 'center', style: { marginTop: '12px' } },
          btn('Hoàn Tất Bàn Giao Vụ Án', () => {
            closeModal();
            if (onDone) onDone();
          }, 'prime')
        )
      );
    }

    openModal('Điện Chấp Pháp · Truy Nã Tội Phạm', body, { wide: true, xBtn: true });
  };

  draw();
}

/** Modal Mini-Game 3: Câu Hồn Người Chết (Hắc Bạch Vô Thường / Dẫn Hồn Sứ) */
export function openSoulCatchMiniGame(id: CelestialId, onDone?: () => void) {
  let st = genSoulMission();
  let logText = `Nhận Câu Hồn Bài từ Minh Phủ: Xuống trần tại 【${st.locName}】, cầm Tỏa Hồn Xích và Khốc Tang Bổng câu linh hồn 【${st.targetMortal}】 về Quỷ Môn Quan tra xét thiện ác.`;
  let stage = 0; // 0: Chuẩn bị, 1: Phát sinh biến cố, 2: Hoàn tất
  let needInv = false;
  let needFight = false;

  const draw = () => {
    const body: HTMLElement[] = [];

    // Header âm phủ câu hồn
    body.push(
      h(
        'div',
        {
          style: {
            background: 'rgba(50, 20, 40, 0.08)',
            border: '1px solid #581c87',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '12px',
          },
        },
        h('h4', { style: { margin: '0 0 6px', color: '#581c87' } }, `👻 Lệnh Bài Câu Hồn · ${st.targetMortal}`),
        h('p', { class: 'small', style: { margin: '0 0 4px' } }, `Địa điểm phàm trần: 【${st.locName}】`),
        h('p', { class: 'small muted', style: { margin: 0, fontStyle: 'italic' } }, '✦ Phụng mệnh Thập Điện Diêm La: Dẫn hồn đúng canh giờ, hóa giải oan khuất hoặc trừ diệt tà ma cướp phách để đưa trọn vẹn hồn phách về cõi u minh!')
      )
    );

    // Diễn tiến
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

    // Hành động
    if (stage === 0) {
      body.push(
        btn('🏮 Hạ Phàm Tiến Vào Hiện Trường Câu Hồn', () => {
          const res = conductSoulCatch(id, st);
          logText = res.msg;
          stage = 1;
          needInv = !!res.needInvestigate;
          needFight = !!res.needFight;
          draw();
        }, 'prime')
      );
    } else if (stage === 1) {
      if (needInv) {
        body.push(
          btn('🔍 Hiển Thánh Ban Đêm · Điều Tra Giải Oan Khất', () => {
            logText = investigateGrievance(id, st);
            stage = 2;
            draw();
          }, 'prime')
        );
      } else if (needFight) {
        body.push(
          btn('⚔️ Rút Khốc Tang Bổng Trảm Tà Tu Cướp Phách', () => {
            const res = defeatEvilCult(id, st);
            logText = res.msg;
            if (res.ok) stage = 2;
            draw();
          }, 'prime')
        );
      } else {
        // Thuận lợi
        stage = 2;
      }
    }

    if (stage === 2) {
      body.push(
        h(
          'div',
          { class: 'center', style: { marginTop: '12px' } },
          btn('Dẫn Giải Về Quỷ Môn Quan (Hoàn Tất)', () => {
            closeModal();
            if (onDone) onDone();
          }, 'prime')
        )
      );
    }

    openModal('Hắc Bạch Vô Thường · Phụng Mệnh Câu Hồn', body, { wide: true, xBtn: true });
  };

  draw();
}
