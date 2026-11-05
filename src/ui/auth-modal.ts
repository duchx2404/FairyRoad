// Tài khoản thường, Gemini API Key và đồng bộ đám mây
import { h, btn } from './dom';
import { glyphSvg } from './glyph';
import { notice } from './dialog';
import {
  getCurrentUser,
  isLoggedIn,
  loginOrRegister,
  logout,
  syncSaveToCloud,
  loadSaveFromCloud,
  updateAccountGeminiKey,
} from '../engine/auth';
import { meta } from '../engine/state';
import { isGeminiActive } from '../ai/gemini';

let modalEl: HTMLElement | null = null;

export function openAuthModal(onSuccess?: () => void) {
  closeAuthModal();

  const veil = h('div', {
    class: 'dlg-veil',
    onclick: (e: Event) => {
      if (e.target === veil) closeAuthModal();
    },
  });

  const box = h('div', { class: 'dlg auth-modal', style: { maxWidth: '440px', width: '92%' } });
  veil.append(box);

  function render() {
    box.innerHTML = '';
    const user = getCurrentUser();

    // Tiêu đề
    const titleRow = h(
      'div',
      { class: 'dlg-title', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      h('span', {}, h('span', { class: 'dlg-seal', html: glyphSvg('ask', 17, 2) }), ' Tài Khoản Tu Tiên'),
      h('button', { class: 'btn sm', style: { padding: '2px 8px' }, onclick: closeAuthModal }, '✕')
    );
    box.append(titleRow);

    if (user && isLoggedIn()) {
      // ==========================================
      // TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP
      // ==========================================
      const infoBox = h('div', { class: 'card', style: { margin: '12px 0', padding: '12px' } });

      const nameRow = h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } },
        user.avatar
          ? h('img', { src: user.avatar, style: { width: '42px', height: '42px', borderRadius: '50%' } })
          : h('span', { class: 'badge gold', style: { fontSize: '18px', padding: '6px 12px' } }, '仙'),
        h(
          'div',
          {},
          h('div', { style: { fontWeight: 'bold', fontSize: '15px' } }, user.displayName || user.username),
          h('div', { class: 'small muted' }, `@${user.username} · Tài khoản thường`)
        )
      );
      infoBox.append(nameRow);

      // Trạng thái AI Engine
      if (isGeminiActive()) {
        infoBox.append(
          h(
            'div',
            { class: 'badge green small', style: { margin: '4px 0', display: 'inline-block' } },
            '✨ Đang dùng Google Gemini AI (API Key)'
          )
        );
      } else {
        infoBox.append(
          h(
            'div',
            { class: 'badge small', style: { margin: '4px 0', display: 'inline-block' } },
            '💻 Đang dùng Ollama AI (Local)'
          )
        );
      }

      box.append(infoBox);

      // Nút đồng bộ Cloud Save
      const syncBtn = btn('☁️ Đồng bộ Save lên Đám Mây', async () => {
        syncBtn.textContent = 'Đang đồng bộ...';
        const ok = await syncSaveToCloud();
        syncBtn.textContent = ok ? '✓ Đã đồng bộ thành công!' : '✕ Lỗi đồng bộ (kiểm tra server)';
        setTimeout(() => {
          syncBtn.textContent = '☁️ Đồng bộ Save lên Đám Mây';
        }, 2500);
      }, 'prime');
      syncBtn.style.width = '100%';
      syncBtn.style.margin = '4px 0';
      box.append(syncBtn);

      const loadBtn = btn('📥 Tải Save từ Đám Mây về máy', async () => {
        loadBtn.textContent = 'Đang tải...';
        const res = await loadSaveFromCloud();
        if (res.ok && res.hasSave) {
          notice('Đã tải thành công dữ liệu lưu từ đám mây! Game sẽ tải lại giao diện.');
          setTimeout(() => location.reload(), 1500);
        } else {
          loadBtn.textContent = '✕ Chưa có bản lưu trên cloud';
          setTimeout(() => {
            loadBtn.textContent = '📥 Tải Save từ Đám Mây về máy';
          }, 2500);
        }
      });
      loadBtn.style.width = '100%';
      loadBtn.style.margin = '4px 0';
      box.append(loadBtn);

      // CẤU HÌNH GEMINI API CHO TÀI KHOẢN:
      const currentKey = user.geminiKey || '';
      const keyBox = h('div', { style: { margin: '12px 0', borderTop: '1px solid var(--border)', paddingTop: '10px' } });

      keyBox.append(
        h('div', { style: { fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: '#2e7d32' } }, '✨ Thiết lập Google Gemini AI:'),
        h('div', { class: 'small muted', style: { marginBottom: '8px' } },
          'Dán mã Gemini API Key riêng của bạn để AI kể chuyện và đàm đạo (chỉ cần nhập 1 lần, lưu theo tài khoản trên máy chủ):'
        )
      );

      const keyInput = h('input', {
        type: 'password',
        placeholder: 'Dán Gemini API Key của tài khoản...',
        value: currentKey,
        style: { width: '100%', padding: '6px 8px', marginBottom: '6px', boxSizing: 'border-box' },
      });

      const keyRow = h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' } });
      const saveKeyBtn = btn('Lưu Key', async () => {
        const val = keyInput.value.trim();
        saveKeyBtn.disabled = true;
        const ok = await updateAccountGeminiKey(val);
        saveKeyBtn.disabled = false;
        if (!ok) { notice('Không lưu được API Key lên tài khoản. Kiểm tra kết nối hoặc đăng nhập lại.'); return; }
        notice('Đã lưu Gemini API Key!');
        render();
      }, 'sm');

      const testBtn = btn('Kiểm tra Gemini', async () => {
        testBtn.textContent = '...';
        try {
          const { callGemini } = await import('../ai/gemini');
          const res = await callGemini('Bạn là ai?', 'Hãy chào 1 câu ngắn gọn phong cách tiên hiệp.', 60, 0.7);
          notice('✓ Kết nối Gemini AI thành công! Phản hồi: ' + res);
        } catch (err: any) {
          notice('✕ ' + (err.message || 'Kiểm tra kết nối.'));
        } finally {
          testBtn.textContent = 'Kiểm tra Gemini';
        }
      }, 'sm prime');

      keyRow.append(saveKeyBtn, testBtn);
      keyBox.append(keyInput, keyRow);
      box.append(keyBox);

      // Nút Đăng xuất
      const logoutBtn = btn('Đăng xuất tài khoản', () => {
        logout();
        notice('Đã đăng xuất tài khoản.');
        render();
      }, 'danger');
      logoutBtn.style.width = '100%';
      logoutBtn.style.marginTop = '10px';
      box.append(logoutBtn);

    } else {
      // ==========================================
      // TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP
      // ==========================================
      const tabBody = h('div', {});
      box.append(tabBody);
      const intro = h(
        'div',
        { class: 'small muted', style: { marginBottom: '10px', lineHeight: '1.5' } },
        'Nhập tài khoản và mật khẩu. Nếu tài khoản chưa từng tồn tại, hệ thống sẽ ',
        h('strong', { style: { color: 'var(--accent)' } }, 'tự động đăng ký mới ngay lập tức'),
        ' (không cần xác minh email).'
      );
      tabBody.append(intro);

      const userInput = h('input', {
        type: 'text',
        placeholder: 'Tên tài khoản (username)...',
        style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' },
      });
      const passInput = h('input', {
        type: 'password',
        placeholder: 'Mật khẩu...',
        style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' },
      });
      const nameInput = h('input', {
        type: 'text',
        placeholder: 'Đạo hiệu / Biệt danh (tùy chọn)...',
        style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' },
      });

      const localGeminiKeyInput = h('input', {
        type: 'password',
        placeholder: 'Gemini API Key (tùy chọn, có thể thêm sau)...',
        value: '',
        style: { width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' },
      });

      const localStatus = h('div', { class: 'small', style: { color: 'var(--seal)', marginBottom: '8px' } });

      const submitBtn = btn('⚡ Đăng nhập / Tự động đăng ký', async () => {
        const u = userInput.value.trim();
        const p = passInput.value;
        const d = nameInput.value.trim();
        const k = localGeminiKeyInput.value.trim() || undefined;
        if (!u || !p) {
          localStatus.textContent = 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!';
          return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';
        localStatus.textContent = '';
        const res = await loginOrRegister(u, p, d, k);
        submitBtn.disabled = false;
        if (res.ok) {
          notice(res.action === 'register' ? 'Đăng ký tài khoản mới thành công!' : 'Đăng nhập thành công!');
          render();
          onSuccess?.();
        } else {
          submitBtn.textContent = '⚡ Đăng nhập / Tự động đăng ký';
          localStatus.textContent = res.error || 'Thất bại.';
        }
      }, 'prime');
      submitBtn.style.width = '100%';

      tabBody.append(userInput, passInput, nameInput, localGeminiKeyInput, localStatus, submitBtn);
    }
  }

  render();
  document.body.append(veil);
  modalEl = veil;
}

export function closeAuthModal() {
  modalEl?.remove();
  modalEl = null;
}
