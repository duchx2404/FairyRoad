// Hộp thoại Quản lý & Chọn 5 Bản Lưu Game
import { h, btn } from './dom';
import { glyphSvg } from './glyph';
import { notice, askConfirm } from './dialog';
import {
  s,
  save,
  load,
  getActiveSlot,
  setActiveSlot,
  getAllSlotsInfo,
  deleteSlot,
  MAX_SAVE_SLOTS,
  type SaveSlotInfo,
} from '../engine/state';
import { getCurrentUser, isLoggedIn, syncSaveToCloud, loadSaveFromCloud } from '../engine/auth';
import { formatStonesShort } from '../engine/stones';
import { avatarSvg, playerPortrait } from './portrait';
import { creation, hideScreen, runOnStart } from './screens';
import { closeModal } from './modal';
import { closeAll } from './panels';
import { closePopup } from './hud';

let modalEl: HTMLElement | null = null;

export function closeSaveSlotsModal() {
  modalEl?.remove();
  modalEl = null;
}

function formatDate(ts?: number | null): string {
  if (!ts) return 'Không rõ thời gian';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function openSaveSlotsModal(onCloseCallback?: () => void) {
  closeSaveSlotsModal();

  const veil = h('div', {
    class: 'dlg-veil',
    onclick: (e: Event) => {
      if (e.target === veil) {
        closeSaveSlotsModal();
        if (onCloseCallback) onCloseCallback();
      }
    },
  });

  const box = h('div', {
    class: 'dlg save-slots-modal',
    style: { maxWidth: '580px', width: '94%', maxHeight: '88vh', overflowY: 'auto' },
  });
  veil.append(box);
  modalEl = veil;
  document.body.append(veil);

  function render() {
    box.innerHTML = '';
    const activeSlot = getActiveSlot();
    const allSlots = getAllSlotsInfo();
    const usedCount = allSlots.filter((x) => x.hasSave).length;
    const user = getCurrentUser();

    // Tiêu đề
    const titleRow = h(
      'div',
      { class: 'dlg-title', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } },
      h('span', {}, h('span', { class: 'dlg-seal', html: glyphSvg('none', 18, 2) }), ' Danh Sách Bản Lưu Tu Tiên'),
      h('button', {
        class: 'btn sm',
        style: { padding: '2px 8px' },
        onclick: () => {
          closeSaveSlotsModal();
          if (onCloseCallback) onCloseCallback();
        },
      }, '✕')
    );
    box.append(titleRow);

    const subText = h(
      'div',
      { class: 'small muted', style: { marginBottom: '14px', lineHeight: '1.5' } },
      `Tài khoản có tối đa `,
      h('b', { style: { color: 'var(--seal)' } }, `${MAX_SAVE_SLOTS} bản save`),
      ` để luân phiên tu hành (đã dùng ${usedCount}/${MAX_SAVE_SLOTS}). Bạn có thể chuyển đổi qua lại, tạo kiếp mới hoặc xóa bản lưu tùy ý.`
    );
    box.append(subText);

    // Danh sách 5 slot
    const listWrap = h('div', { class: 'slots-list', style: { display: 'flex', flexDirection: 'column', gap: '10px' } });

    for (let slot = 1; slot <= MAX_SAVE_SLOTS; slot++) {
      const info = allSlots[slot - 1];
      const isCurrent = slot === activeSlot;

      const card = h('div', {
        class: 'card small',
        style: {
          margin: '0',
          padding: '12px 14px',
          border: isCurrent ? '2px solid var(--seal)' : '1px solid var(--line)',
          background: isCurrent ? 'rgba(180, 83, 9, 0.04)' : 'var(--sheet)',
          borderRadius: '6px',
          position: 'relative',
        },
      });

      // Hàng tiêu đề slot
      const headRow = h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('b', { style: { fontSize: '15px', color: isCurrent ? 'var(--seal)' : 'inherit' } }, `Bản lưu ${slot}`),
          isCurrent ? h('span', { class: 'badge gold small', style: { fontSize: '11px', padding: '1px 6px' } }, '★ Đang chọn') : null
        ),
        h(
          'div',
          { class: 'small muted' },
          info.hasSave ? `Lưu lúc: ${formatDate(info.savedAt)}` : 'Chưa có bản lưu'
        )
      );
      card.append(headRow);

      if (info.hasSave) {
        // NỘI DUNG SLOT ĐÃ CÓ SAVE
        const infoRow = h(
          'div',
          { style: { display: 'flex', gap: '12px', alignItems: 'center', margin: '8px 0' } },
          h('div', {
            class: 'hud-por sm',
            style: { flexShrink: '0' },
            html: avatarSvg(info.gender || 'm', info.realm || 0, 'loi', 48, playerPortrait(info.gender || 'm', info.age || 18)),
          }),
          h(
            'div',
            { style: { flex: '1', minWidth: '0' } },
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
              h('span', { style: { fontWeight: 'bold', fontSize: '15px', color: 'var(--seal)' } }, info.name),
              h('span', { class: 'badge small' }, info.gender === 'f' ? 'Nữ tu' : 'Nam tu')
            ),
            h(
              'div',
              { style: { fontSize: '13px', marginTop: '2px', fontWeight: '500' } },
              `${info.stageName} · ${info.worldName}`
            ),
            h(
              'div',
              { class: 'small muted', style: { marginTop: '2px' } },
              `Đang ở: ${info.locName} · ${info.age} tuổi (Năm ${info.year}) · ${formatStonesShort(info.money || 0)} linh thạch`
            )
          )
        );
        card.append(infoRow);

        // Nút hành động cho slot có save
        const btnRow = h(
          'div',
          { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--line)' } }
        );

        // Nút chơi / tải slot này
        const isPlayingThis = isCurrent && !!s && !s.dead;
        const playBtn = btn(
          isPlayingThis ? '✓ Đang chơi kiếp này' : '▶ Vào chơi kiếp này',
          () => {
            if (s) save();
            setActiveSlot(slot);
            load(slot);
            closeSaveSlotsModal();
            closeModal();
            closeAll();
            closePopup();
            hideScreen();
            runOnStart();
            notice(`Đã chuyển sang Bản lưu ${slot}: ${info.name}`);
          },
          isPlayingThis ? 'sm ghost' : 'sm prime',
          { dis: isPlayingThis }
        );
        btnRow.append(playBtn);

        // Nút đầu thai đè lên slot này
        const overwriteBtn = btn('Đầu thai đè', () => {
          askConfirm(
            `Bạn có chắc chắn muốn bỏ kiếp này và đầu thai mới vào Bản lưu ${slot}?\nDữ liệu hiện tại của tu sĩ [${info.name}] sẽ bị xóa hoàn toàn.`,
            () => {
              if (s && isCurrent) save();
              setActiveSlot(slot);
              closeSaveSlotsModal();
              closeModal();
              closeAll();
              closePopup();
              creation();
            },
            { title: `Đầu thai mới (Bản lưu ${slot})`, ok: 'Đầu thai đè', danger: true }
          );
        }, 'sm');
        btnRow.append(overwriteBtn);

        // Nút xóa bản lưu
        const deleteBtn = btn('Xóa', () => {
          askConfirm(
            `Xác nhận xóa hoàn toàn Bản lưu ${slot} của tu sĩ [${info.name}]?\nHành động này không thể hoàn tác.`,
            () => {
              deleteSlot(slot);
              notice(`Đã xóa Bản lưu ${slot}.`);
              render();
            },
            { title: `Xóa Bản lưu ${slot}`, ok: 'Xác nhận xóa', danger: true }
          );
        }, 'sm danger ghost');
        btnRow.append(deleteBtn);

        card.append(btnRow);
      } else {
        // NỘI DUNG SLOT TRỐNG
        const emptyRow = h(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' } },
          h(
            'div',
            {},
            h('div', { class: 'muted', style: { fontStyle: 'italic', fontSize: '13.5px' } }, '— Ô trống: Chưa có dữ liệu tu tiên —'),
            h('div', { class: 'small muted', style: { marginTop: '2px' } }, 'Bắt đầu một kiếp mới mà không ảnh hưởng tới các bản lưu khác.')
          ),
          btn('＋ Tạo kiếp mới', () => {
            if (s) save();
            setActiveSlot(slot);
            closeSaveSlotsModal();
            closeModal();
            closeAll();
            closePopup();
            creation();
          }, 'sm prime')
        );
        card.append(emptyRow);
      }

      listWrap.append(card);
    }

    box.append(listWrap);

    // Phần Cloud Sync & Đóng
    const footRow = h(
      'div',
      { style: { marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' } }
    );

    if (isLoggedIn() && user) {
      const cloudActs = h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } });
      const cloudSyncBtn = btn('☁️ Sao lưu cả 5 slot lên Cloud', async () => {
        cloudSyncBtn.textContent = 'Đang đồng bộ...';
        const ok = await syncSaveToCloud();
        cloudSyncBtn.textContent = ok ? '✓ Đã đồng bộ 5 slot!' : '✕ Lỗi kết nối';
        setTimeout(() => { cloudSyncBtn.textContent = '☁️ Sao lưu cả 5 slot lên Cloud'; }, 2000);
      }, 'sm');

      const cloudLoadBtn = btn('📥 Tải 5 slot từ Cloud', async () => {
        cloudLoadBtn.textContent = 'Đang tải...';
        const res = await loadSaveFromCloud();
        if (res.ok && res.hasSave) {
          notice('Đã khôi phục thành công các bản lưu từ đám mây!');
          render();
        } else {
          cloudLoadBtn.textContent = '✕ Chưa có save trên Cloud';
          setTimeout(() => { cloudLoadBtn.textContent = '📥 Tải 5 slot từ Cloud'; }, 2000);
        }
      }, 'sm ghost');

      cloudActs.append(cloudSyncBtn, cloudLoadBtn);
      footRow.append(cloudActs);
    } else {
      footRow.append(
        h('div', { class: 'small muted' }, '💡 Đăng nhập tài khoản để đồng bộ cả 5 bản lưu lên Đám Mây.')
      );
    }

    const closeBtn = btn('Đóng', () => {
      closeSaveSlotsModal();
      if (onCloseCallback) onCloseCallback();
    }, 'ghost sm');
    footRow.append(closeBtn);

    box.append(footRow);
  }

  render();
}
