// Hộp thoại Tài khoản, Đăng nhập Google & Đồng bộ Đám mây
import { h, btn } from './dom';
import { glyphSvg } from './glyph';
import { notice } from './dialog';
import {
  getCurrentUser,
  isLoggedIn,
  loginOrRegister,
  loginWithGoogle,
  logout,
  syncSaveToCloud,
  loadSaveFromCloud,
  updateAccountGeminiKey,
} from '../engine/auth';
import { meta, saveMeta } from '../engine/state';
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
      // --- ĐÃ ĐĂNG NHẬP ---
      const infoBox = h('div', { class: 'card', style: { margin: '12px 0', padding: '12px' } });

      const nameRow = h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' } },
        user.avatar
          ? h('img', { src: user.avatar, style: { width: '42px', height: '42px', borderRadius: '50%' } })
          : h('span', { class: 'badge gold', style: { fontSize: '18px', padding: '6px 12px' } }, '仙'),
        h(
          'div',
          {},
          h('div', { style: { fontWeight: 'bold', fontSize: '15px' } }, user.displayName || user.username),
          h('div', { class: 'small muted' }, `@${user.username} · ${user.authProvider === 'google' ? 'Đăng nhập Google' : 'Tài khoản nội bộ'}`)
        )
      );
      infoBox.append(nameRow);

      // Trạng thái AI Engine
      const aiStatus = isGeminiActive()
        ? h('div', { class: 'badge green small', style: { margin: '6px 0', display: 'inline-block' } }, '✨ Đang kích hoạt Google Gemini AI (Cloud)')
        : h('div', { class: 'badge small', style: { margin: '6px 0', display: 'inline-block' } }, '💻 Đang dùng Ollama AI (Local)');
      infoBox.append(aiStatus);

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

      // Ô nhập Gemini API Key riêng (tùy chọn)
      const keyBox = h('div', { style: { margin: '12px 0', borderTop: '1px solid var(--border)', paddingTop: '10px' } });
      keyBox.append(h('div', { class: 'small muted', style: { marginBottom: '4px' } }, 'Gemini API Key (Tùy chọn, tự động dùng khi đăng nhập Google):'));
      const keyInput = h('input', {
        type: 'password',
        placeholder: 'Dán API Key (AI Studio)...',
        value: meta.settings.geminiKey || user.geminiKey || '',
        style: { width: '100%', padding: '6px 8px', marginBottom: '6px', boxSizing: 'border-box' },
      });
      const saveKeyBtn = btn('Lưu Gemini Key', async () => {
        const val = keyInput.value.trim();
        meta.settings.geminiKey = val;
        meta.settings.aiProvider = 'gemini';
        saveMeta();
        await updateAccountGeminiKey(val);
        notice('Đã lưu Gemini API Key! Game sẽ dùng Gemini AI để kể sự kiện.');
        render();
      }, 'sm');
      keyBox.append(keyInput, saveKeyBtn);
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
      // --- CHƯA ĐĂNG NHẬP ---
      const tabs = h('div', { style: { display: 'flex', gap: '8px', margin: '12px 0 8px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px' } });
      let currentTab: 'local' | 'google' = 'local';

      const tabLocal = h('button', { class: 'btn sm prime', onclick: () => { currentTab = 'local'; updateTab(); } }, 'Tài khoản thường');
      const tabGoogle = h('button', { class: 'btn sm', onclick: () => { currentTab = 'google'; updateTab(); } }, 'Đăng nhập Google');
      tabs.append(tabLocal, tabGoogle);
      box.append(tabs);

      const tabBody = h('div', {});
      box.append(tabBody);

      function updateTab() {
        tabLocal.className = currentTab === 'local' ? 'btn sm prime' : 'btn sm';
        tabGoogle.className = currentTab === 'google' ? 'btn sm prime' : 'btn sm';
        tabBody.innerHTML = '';

        if (currentTab === 'local') {
          // Tab 1: Username & Password
          const intro = h('div', { class: 'small muted', style: { marginBottom: '10px' } },
            'Nhập tài khoản và mật khẩu. Nếu tài khoản chưa từng tồn tại, hệ thống sẽ ' +
            h('strong', {}, 'tự động đăng ký mới ngay lập tức') + ' (không cần xác minh email).'
          );
          tabBody.append(intro);

          const userInput = h('input', { type: 'text', placeholder: 'Tên tài khoản (username)...', style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' } });
          const passInput = h('input', { type: 'password', placeholder: 'Mật khẩu...', style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' } });
          const nameInput = h('input', { type: 'text', placeholder: 'Đạo hiệu / Biệt danh (tùy chọn)...', style: { width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' } });

          const statusMsg = h('div', { class: 'small', style: { color: 'var(--seal)', marginBottom: '8px' } });

          const submitBtn = btn('⚡ Đăng nhập / Tự động đăng ký', async () => {
            const u = userInput.value.trim();
            const p = passInput.value.trim();
            const d = nameInput.value.trim();
            if (!u || !p) {
              statusMsg.textContent = 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!';
              return;
            }
            submitBtn.textContent = 'Đang xử lý...';
            statusMsg.textContent = '';
            const res = await loginOrRegister(u, p, d);
            if (res.ok) {
              notice(res.action === 'register' ? 'Đăng ký tài khoản mới thành công!' : 'Đăng nhập thành công!');
              render();
              onSuccess?.();
            } else {
              submitBtn.textContent = '⚡ Đăng nhập / Tự động đăng ký';
              statusMsg.textContent = res.error || 'Thất bại.';
            }
          }, 'prime');
          submitBtn.style.width = '100%';

          tabBody.append(userInput, passInput, nameInput, statusMsg, submitBtn);
        } else {
          // Tab 2: Google Sign-in
          const gIntro = h('div', { class: 'small muted', style: { marginBottom: '12px' } },
            'Khi đăng nhập bằng Google, game sẽ ' +
            h('strong', {}, 'tự động kích hoạt Google Gemini AI') +
            ' để viết lại diễn biến sự kiện và tiểu sử kiếp người thay thế cho AI Local.'
          );
          tabBody.append(gIntro);

          const gEmailInput = h('input', { type: 'email', placeholder: 'Nhập địa chỉ Google Email...', style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' } });
          const gNameInput = h('input', { type: 'text', placeholder: 'Tên hiển thị Google...', style: { width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' } });

          const gStatus = h('div', { class: 'small', style: { color: 'var(--seal)', marginBottom: '8px' } });

          const googleBtn = btn('🚀 Đăng nhập với Google', async () => {
            const email = gEmailInput.value.trim();
            const name = gNameInput.value.trim() || (email ? email.split('@')[0] : 'Đạo Hữu Google');
            if (!email) {
              gStatus.textContent = 'Vui lòng nhập Email Google để liên kết tài khoản.';
              return;
            }
            googleBtn.textContent = 'Đang đăng nhập...';
            // Tạo ID Google định danh từ email
            const googleId = 'g_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
            const res = await loginWithGoogle({ googleId, email, name });
            if (res.ok) {
              notice('Đăng nhập Google thành công! Đã tự động kích hoạt Gemini AI.');
              render();
              onSuccess?.();
            } else {
              googleBtn.textContent = '🚀 Đăng nhập với Google';
              gStatus.textContent = res.error || 'Đăng nhập thất bại.';
            }
          }, 'prime');
          googleBtn.style.width = '100%';

          tabBody.append(gEmailInput, gNameInput, gStatus, googleBtn);
        }
      }

      updateTab();
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
