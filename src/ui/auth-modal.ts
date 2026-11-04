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

declare global {
  interface Window {
    google?: any;
  }
}

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
      const isGoogle = user.authProvider === 'google';
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
          h('div', { class: 'small muted' }, `@${user.username} · ${isGoogle ? 'Tài khoản Google' : 'Tài khoản nội bộ'}`)
        )
      );
      infoBox.append(nameRow);

      // Trạng thái AI Engine
      if (isGoogle) {
        infoBox.append(
          h(
            'div',
            { class: 'badge green small', style: { margin: '4px 0', display: 'inline-block' } },
            '✨ Đã kết nối Google Gemini AI (Cloud)'
          )
        );
      } else if (isGeminiActive()) {
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

      // THÔNG BÁO GEMINI AI CHO GOOGLE:
      // Khi đã đăng nhập Google, Gemini AI tự động kích hoạt, TUYỆT ĐỐI KHÔNG CẦN NHẬP KEY!
      if (isGoogle) {
        const googleAiCard = h(
          'div',
          {
            class: 'card small',
            style: {
              margin: '12px 0',
              padding: '10px',
              background: 'rgba(52, 168, 83, 0.08)',
              border: '1px solid rgba(52, 168, 83, 0.3)',
            },
          },
          h('div', { style: { color: '#2e7d32', fontWeight: 'bold', marginBottom: '4px' } }, '✨ Tự động dùng Gemini AI'),
          h(
            'div',
            { class: 'small muted' },
            'Tài khoản Google đã tự động kích hoạt model Gemini 2.5 Flash để viết sự kiện và tiểu sử kiếp người. Bạn không cần nhập mã API nào cả!'
          )
        );
        box.append(googleAiCard);
      } else {
        // Chỉ tài khoản thường mới cần ô nhập API Key nếu muốn dùng Gemini
        const keyBox = h('div', { style: { margin: '12px 0', borderTop: '1px solid var(--border)', paddingTop: '10px' } });
        keyBox.append(h('div', { class: 'small muted', style: { marginBottom: '4px' } }, 'Gemini API Key (Tùy chọn cho tài khoản thường):'));
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
      }

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
      const tabs = h('div', {
        style: {
          display: 'flex',
          gap: '8px',
          margin: '12px 0 8px 0',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '6px',
        },
      });
      let currentTab: 'google' | 'local' = 'google'; // Mặc định mở tab Google theo mong muốn người chơi

      const tabGoogle = h('button', { class: 'btn sm prime', onclick: () => { currentTab = 'google'; updateTab(); } }, 'Đăng nhập Google');
      const tabLocal = h('button', { class: 'btn sm', onclick: () => { currentTab = 'local'; updateTab(); } }, 'Tài khoản thường');
      tabs.append(tabGoogle, tabLocal);
      box.append(tabs);

      const tabBody = h('div', {});
      box.append(tabBody);

      function updateTab() {
        tabGoogle.className = currentTab === 'google' ? 'btn sm prime' : 'btn sm';
        tabLocal.className = currentTab === 'local' ? 'btn sm prime' : 'btn sm';
        tabBody.innerHTML = '';

        if (currentTab === 'google') {
          // --- TAB 1: ĐĂNG NHẬP GOOGLE CHUẨN XÁC ---
          const gIntro = h(
            'div',
            { class: 'small muted', style: { marginBottom: '12px', lineHeight: '1.5' } },
            'Đăng nhập bằng tài khoản Google để đồng bộ dữ liệu và ',
            h('strong', { style: { color: 'var(--accent)' } }, 'tự động kích hoạt Google Gemini AI'),
            ' (gắn liền với tài khoản Google, không cần nhập mã API).'
          );
          tabBody.append(gIntro);

          // Container chứa nút Google Sign In chính thức của Google GIS
          const googleBtnContainer = h('div', {
            id: 'google_signin_btn_container',
            style: { display: 'flex', justifyContent: 'center', margin: '16px 0', minHeight: '44px' },
          });
          tabBody.append(googleBtnContainer);

          const statusMsg = h('div', { class: 'small center', style: { color: 'var(--seal)', margin: '8px 0' } });
          tabBody.append(statusMsg);

          // Kiểm tra và khởi tạo Google Identity Services
          const clientId = meta.settings.googleClientId || '';

          const initGoogleGIS = () => {
            if (window.google?.accounts?.id && clientId) {
              try {
                window.google.accounts.id.initialize({
                  client_id: clientId,
                  callback: async (response: any) => {
                    try {
                      statusMsg.textContent = 'Đang xác thực tài khoản Google...';
                      const base64Url = response.credential.split('.')[1];
                      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                      const jsonPayload = decodeURIComponent(
                        atob(base64)
                          .split('')
                          .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                          .join('')
                      );
                      const payload = JSON.parse(jsonPayload);
                      const res = await loginWithGoogle({
                        googleId: payload.sub,
                        email: payload.email,
                        name: payload.name,
                        picture: payload.picture,
                      });
                      if (res.ok) {
                        notice(`Đăng nhập Google thành công! Chào mừng ${payload.name}.`);
                        render();
                        onSuccess?.();
                      } else {
                        statusMsg.textContent = res.error || 'Lỗi đăng nhập Google.';
                      }
                    } catch (e: any) {
                      statusMsg.textContent = 'Lỗi xử lý phản hồi Google: ' + e.message;
                    }
                  },
                });

                window.google.accounts.id.renderButton(googleBtnContainer, {
                  type: 'standard',
                  theme: 'filled_blue',
                  size: 'large',
                  text: 'signin_with',
                  shape: 'rectangular',
                  width: 300,
                });
                return true;
              } catch (err: any) {
                console.warn('Lỗi init Google GIS:', err);
              }
            }
            return false;
          };

          const ready = initGoogleGIS();

          if (!ready || !clientId) {
            // Trường hợp chưa có Google Client ID trên localhost
            const promptBox = h('div', { class: 'card small', style: { padding: '10px', background: 'rgba(0,0,0,0.03)' } });
            promptBox.append(
              h('div', { style: { fontWeight: 'bold', marginBottom: '4px' } }, 'Cửa sổ chọn tài khoản Google:'),
              h('p', { class: 'small muted', style: { margin: '4px 0' } },
                'Google yêu cầu một Client ID để trình duyệt bật popup chọn tài khoản Google thật. ' +
                'Bạn có thể dán Google OAuth Client ID (tạo miễn phí tại Google Cloud Console) vào đây:'
              )
            );

            const clientIdInput = h('input', {
              type: 'text',
              placeholder: 'xxxx.apps.googleusercontent.com',
              value: meta.settings.googleClientId || '',
              style: { width: '100%', padding: '6px 8px', margin: '6px 0', boxSizing: 'border-box' },
            });

            const saveClientBtn = btn('Kích hoạt nút Google Sign-In', () => {
              const val = clientIdInput.value.trim();
              if (!val) {
                statusMsg.textContent = 'Vui lòng dán Client ID.';
                return;
              }
              meta.settings.googleClientId = val;
              saveMeta();
              notice('Đã lưu Google Client ID!');
              updateTab();
            }, 'sm prime');

            promptBox.append(clientIdInput, saveClientBtn);
            tabBody.append(promptBox);
          }

        } else {
          // --- TAB 2: TÀI KHOẢN THƯỜNG ---
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
            style: { width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' },
          });

          const localStatus = h('div', { class: 'small', style: { color: 'var(--seal)', marginBottom: '8px' } });

          const submitBtn = btn('⚡ Đăng nhập / Tự động đăng ký', async () => {
            const u = userInput.value.trim();
            const p = passInput.value.trim();
            const d = nameInput.value.trim();
            if (!u || !p) {
              localStatus.textContent = 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!';
              return;
            }
            submitBtn.textContent = 'Đang xử lý...';
            localStatus.textContent = '';
            const res = await loginOrRegister(u, p, d);
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

          tabBody.append(userInput, passInput, nameInput, localStatus, submitBtn);
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
