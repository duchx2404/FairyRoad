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
          h('div', { class: 'small muted' }, `@${user.username} · ${isGoogle ? 'Tài khoản Google' : 'Tài khoản thường'}`)
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

      // CẤU HÌNH GEMINI API CHO TÀI KHOẢN:
      const currentKey = meta.settings.geminiKey || user.geminiKey || '';
      const hasOAuthToken = !!(meta.settings.geminiToken || user.geminiToken);
      const keyBox = h('div', { style: { margin: '12px 0', borderTop: '1px solid var(--border)', paddingTop: '10px' } });

      keyBox.append(
        h('div', { style: { fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: '#2e7d32' } }, '✨ Thiết lập Google Gemini AI:'),
        h('div', { class: 'small muted', style: { marginBottom: '8px' } },
          hasOAuthToken
            ? '✓ Tài khoản Google đã được cấp quyền OAuth trực tiếp. Gemini AI hoạt động tự động không cần API Key!'
            : isGoogle
              ? 'Tài khoản đã liên kết Google OAuth. Bạn có thể bấm nút dưới để kích hoạt Gemini trực tiếp mà KHÔNG CẦN DÁN KEY:'
              : 'Dán API Key cá nhân để sử dụng Gemini 2.5 Flash trên đám mây:'
        )
      );

      if (isGoogle) {
        const oauthAuthBtn = btn(hasOAuthToken ? '🔄 Cập nhật lại quyền Gemini OAuth' : '⚡ Kích hoạt Gemini Tự Động (Google OAuth - Không cần Key)', () => {
          oauthAuthBtn.textContent = 'Đang mở Google...';
          const clientId = meta.settings.googleClientId || '744884064365-0lt381v4e24g1ihe6botta6tf4dripuv.apps.googleusercontent.com';
          if (!window.google?.accounts?.oauth2) {
            notice('Đang tải thư viện Google, vui lòng thử lại sau vài giây.');
            oauthAuthBtn.textContent = '⚡ Kích hoạt Gemini Tự Động (Google OAuth - Không cần Key)';
            return;
          }
          try {
            const client = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'openid email profile https://www.googleapis.com/auth/generative-language',
              callback: async (tokenResp: any) => {
                if (tokenResp.error) {
                  oauthAuthBtn.textContent = '⚡ Kích hoạt Gemini Tự Động (Google OAuth - Không cần Key)';
                  notice('Google OAuth: ' + tokenResp.error);
                  return;
                }
                meta.settings.geminiToken = tokenResp.access_token;
                meta.settings.aiProvider = 'gemini';
                saveMeta();
                notice('✓ Đã cấp quyền Google Gemini OAuth thành công! Không cần API Key.');
                render();
              },
            });
            client.requestAccessToken();
          } catch (e: any) {
            oauthAuthBtn.textContent = '⚡ Kích hoạt Gemini Tự Động (Google OAuth - Không cần Key)';
            notice('Lỗi: ' + e.message);
          }
        }, 'prime sm');
        oauthAuthBtn.style.width = '100%';
        oauthAuthBtn.style.marginBottom = '8px';
        keyBox.append(oauthAuthBtn);
      }

      const keyInput = h('input', {
        type: 'password',
        placeholder: 'Hoặc dán mã API Key (AIzaSy...) nếu muốn dùng Key riêng...',
        value: currentKey,
        style: { width: '100%', padding: '6px 8px', marginBottom: '6px', boxSizing: 'border-box' },
      });

      const keyRow = h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' } });
      const saveKeyBtn = btn('Lưu Key', async () => {
        const val = keyInput.value.trim();
        meta.settings.geminiKey = val;
        meta.settings.aiProvider = 'gemini';
        saveMeta();
        await updateAccountGeminiKey(val);
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
      const tabs = h('div', {
        style: {
          display: 'flex',
          gap: '8px',
          margin: '12px 0 8px 0',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '6px',
        },
      });
      let currentTab: 'google' | 'local' = 'google';

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
          // --- TAB 1: ĐĂNG NHẬP GOOGLE ---
          const gIntro = h(
            'div',
            { class: 'small muted', style: { marginBottom: '12px', lineHeight: '1.5' } },
            'Đăng nhập tài khoản Google để đồng bộ dữ liệu và sử dụng Gemini AI.'
          );
          tabBody.append(gIntro);

          // NÚT ĐĂNG NHẬP GOOGLE CHÍNH THỨC (GOOGLE GIS POPUP)
          const officialBox = h('div', { class: 'card', style: { padding: '12px', textAlign: 'center', marginBottom: '12px', border: '1px solid var(--border)' } });
          officialBox.append(
            h('div', { style: { fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' } }, 'Bấm nút để chọn tài khoản Google:'),
          );

          const googleBtnContainer = h('div', {
            id: 'google_signin_btn_container',
            style: { display: 'flex', justifyContent: 'center', margin: '8px 0' },
          });
          officialBox.append(googleBtnContainer);

          const clientId = meta.settings.googleClientId || '744884064365-0lt381v4e24g1ihe6botta6tf4dripuv.apps.googleusercontent.com';
          if (window.google?.accounts?.id) {
            try {
              window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response: any) => {
                  try {
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
                    }
                  } catch (e: any) {
                    notice('Lỗi xác thực Google: ' + e.message);
                  }
                },
              });

              window.google.accounts.id.renderButton(googleBtnContainer, {
                type: 'standard',
                theme: 'filled_blue',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                width: 280,
              });
            } catch (err) {
              console.warn('Lỗi init GIS:', err);
            }
          }

          const oauthLoginBtn = btn('🚀 Đăng nhập Google & Cấp quyền Gemini (Tự động)', () => {
            if (!window.google?.accounts?.oauth2) {
              notice('Thư viện Google đang tải, vui lòng thử lại sau 2 giây.');
              return;
            }
            oauthLoginBtn.textContent = 'Đang mở Google...';
            try {
              const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'openid email profile https://www.googleapis.com/auth/generative-language',
                callback: async (tokenResp: any) => {
                  if (tokenResp.error) {
                    oauthLoginBtn.textContent = '🚀 Đăng nhập Google & Cấp quyền Gemini (Tự động)';
                    notice('Google OAuth: ' + tokenResp.error);
                    return;
                  }
                  oauthLoginBtn.textContent = 'Đang đăng nhập...';
                  try {
                    const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                      headers: { Authorization: `Bearer ${tokenResp.access_token}` },
                    });
                    const profile = await uRes.json();
                    meta.settings.geminiToken = tokenResp.access_token;
                    meta.settings.aiProvider = 'gemini';
                    saveMeta();

                    const res = await loginWithGoogle({
                      googleId: profile.sub,
                      email: profile.email,
                      name: profile.name,
                      picture: profile.picture,
                      geminiToken: tokenResp.access_token,
                    });
                    if (res.ok) {
                      notice(`✓ Đăng nhập Google thành công! Đã tự động kết nối Gemini AI cho ${profile.name}. Không cần API Key!`);
                      render();
                      onSuccess?.();
                    } else {
                      notice(res.error || 'Lỗi đăng nhập.');
                    }
                  } catch (err: any) {
                    notice('Lỗi lấy thông tin Google: ' + err.message);
                  } finally {
                    oauthLoginBtn.textContent = '🚀 Đăng nhập Google & Cấp quyền Gemini (Tự động)';
                  }
                },
              });
              client.requestAccessToken();
            } catch (err: any) {
              oauthLoginBtn.textContent = '🚀 Đăng nhập Google & Cấp quyền Gemini (Tự động)';
              notice('Lỗi: ' + err.message);
            }
          }, 'prime');
          oauthLoginBtn.style.width = '100%';
          oauthLoginBtn.style.margin = '8px 0';
          officialBox.append(oauthLoginBtn);

          tabBody.append(officialBox);

          // LỰA CHỌN PHỤ: ĐĂNG NHẬP NHANH VỚI EMAIL GOOGLE
          const fastToggle = h('details', { style: { margin: '8px 0', fontSize: '13px' } },
            h('summary', { style: { cursor: 'pointer', color: 'var(--accent)' } }, 'Hoặc nhập nhanh bằng Google Email'),
            h('div', { class: 'small muted', style: { margin: '6px 0' } }, 'Nhập trực tiếp email để vào game:')
          );

          const fastBox = h('div', { class: 'card', style: { padding: '10px', margin: '8px 0' } });

          const fastEmailInput = h('input', {
            type: 'email',
            placeholder: 'Ví dụ: duchx2404@gmail.com',
            value: meta.settings.lastGoogleEmail || '',
            style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' },
          });

          const fastNameInput = h('input', {
            type: 'text',
            placeholder: 'Tên hiển thị đạo hiệu (tùy chọn)...',
            style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' },
          });

          const fastGeminiKeyInput = h('input', {
            type: 'password',
            placeholder: 'Gemini API Key của bạn (Tùy chọn, lưu vĩnh viễn vào tài khoản)...',
            value: meta.settings.geminiKey || '',
            style: { width: '100%', padding: '8px', marginBottom: '6px', boxSizing: 'border-box' },
          });

          const fastKeyGuide = h('div', { class: 'small muted', style: { fontSize: '11px', marginBottom: '10px' } },
            '🔑 Key của ai người nấy dùng riêng để không lo hết token. Lấy mã miễn phí tại ',
            h('a', { href: 'https://aistudio.google.com/app/apikey', target: '_blank', style: { color: 'var(--prime)', textDecoration: 'underline' } }, 'Google AI Studio'),
            '.'
          );

          const fastStatus = h('div', { class: 'small', style: { color: 'var(--seal)', marginBottom: '6px' } });

          const fastLoginBtn = btn('Vào Game với Tài Khoản Google', async () => {
            const email = fastEmailInput.value.trim();
            if (!email || !email.includes('@')) {
              fastStatus.textContent = 'Vui lòng nhập đúng định dạng email Google!';
              return;
            }
            fastLoginBtn.textContent = 'Đang đăng nhập...';
            meta.settings.lastGoogleEmail = email;
            saveMeta();

            const name = fastNameInput.value.trim() || email.split('@')[0];
            const googleId = 'g_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
            const geminiKey = fastGeminiKeyInput.value.trim() || undefined;
            const res = await loginWithGoogle({ googleId, email, name, geminiKey });
            if (res.ok) {
              notice(`Đăng nhập thành công với tài khoản: ${email}! Đã tự động kết nối tài khoản.`);
              render();
              onSuccess?.();
            } else {
              fastLoginBtn.textContent = 'Vào Game với Tài Khoản Google';
              fastStatus.textContent = res.error || 'Đăng nhập thất bại.';
            }
          }, 'prime');
          fastLoginBtn.style.width = '100%';

          fastBox.append(fastEmailInput, fastNameInput, fastGeminiKeyInput, fastKeyGuide, fastStatus, fastLoginBtn);
          fastToggle.append(fastBox);
          tabBody.append(fastToggle);

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
            style: { width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' },
          });

          const localGeminiKeyInput = h('input', {
            type: 'password',
            placeholder: 'Gemini API Key riêng của bạn (tùy chọn, lưu vĩnh viễn)...',
            value: meta.settings.geminiKey || '',
            style: { width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' },
          });

          const localStatus = h('div', { class: 'small', style: { color: 'var(--seal)', marginBottom: '8px' } });

          const submitBtn = btn('⚡ Đăng nhập / Tự động đăng ký', async () => {
            const u = userInput.value.trim();
            const p = passInput.value.trim();
            const d = nameInput.value.trim();
            const k = localGeminiKeyInput.value.trim() || undefined;
            if (!u || !p) {
              localStatus.textContent = 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!';
              return;
            }
            submitBtn.textContent = 'Đang xử lý...';
            localStatus.textContent = '';
            const res = await loginOrRegister(u, p, d, k);
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
