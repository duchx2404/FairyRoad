// Hệ thống Xác thực, Đồng bộ Đám mây & Multi-player cho FairyRoad
import { meta, saveMeta, s, MAX_SAVE_SLOTS, getSlotKey, getActiveSlot, setActiveSlot } from './state';
import { REALMS } from '../data/core';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  authProvider: 'local' | 'google';
  googleEmail?: string | null;
  geminiKey?: string | null;
  geminiToken?: string | null;
  token: string;
}

const AUTH_KEY = 'fairyroad_auth_session';

function getServerUrl(): string {
  return meta.settings.serverUrl || 'http://localhost:3001';
}

/** Lấy thông tin người dùng đang đăng nhập hiện tại */
export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getCurrentUser()?.token;
}

export function saveSession(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  // Nếu user có Gemini Token hoặc Key, tự động cập nhật vào meta.settings
  if (user.geminiToken) {
    meta.settings.geminiToken = user.geminiToken;
    meta.settings.aiProvider = 'gemini';
    saveMeta();
  } else if (user.geminiKey) {
    meta.settings.geminiKey = user.geminiKey;
    meta.settings.aiProvider = 'gemini';
    saveMeta();
  } else if (user.authProvider === 'google') {
    // Đăng nhập bằng Google: tự động ưu tiên chế độ Gemini AI
    meta.settings.aiProvider = 'gemini';
    saveMeta();
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

/** Đăng nhập hoặc Tự động đăng ký nhanh với Username & Password */
export async function loginOrRegister(username: string, password: string, displayName?: string, geminiKey?: string): Promise<{ ok: boolean; error?: string; user?: AuthUser; action?: string }> {
  try {
    const url = `${getServerUrl()}/api/auth/login-or-register`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName, geminiKey }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Đăng nhập/đăng ký thất bại.' };
    }
    const authUser: AuthUser = {
      ...data.user,
      token: data.token,
    };
    saveSession(authUser);
    return { ok: true, user: authUser, action: data.action };
  } catch (err: any) {
    return { ok: false, error: 'Không thể kết nối đến máy chủ. Hãy kiểm tra server đã chạy chưa (' + getServerUrl() + ').' };
  }
}

/** Đăng nhập thông qua Google */
export async function loginWithGoogle(googleData: { googleId: string; email?: string; name?: string; picture?: string; geminiKey?: string; geminiToken?: string }): Promise<{ ok: boolean; error?: string; user?: AuthUser }> {
  try {
    const url = `${getServerUrl()}/api/auth/google`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleData),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Đăng nhập Google thất bại.' };
    }
    const authUser: AuthUser = {
      ...data.user,
      token: data.token,
    };
    saveSession(authUser);
    return { ok: true, user: authUser };
  } catch (err: any) {
    return { ok: false, error: 'Không thể kết nối đến máy chủ: ' + err.message };
  }
}

/** Cập nhật Gemini API Key cho tài khoản */
export async function updateAccountGeminiKey(apiKey: string): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;
  user.geminiKey = apiKey;
  saveSession(user);

  try {
    await fetch(`${getServerUrl()}/api/user/gemini-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ geminiKey: apiKey }),
    });
    return true;
  } catch {
    return true; // Lưu local thành công
  }
}

/** Đồng bộ dữ liệu Save Game (tất cả 5 slot) lên Đám Mây */
export async function syncSaveToCloud(): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  try {
    const slotsData: Record<number, any> = {};
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const raw = localStorage.getItem(getSlotKey(i));
      if (raw) {
        try { slotsData[i] = JSON.parse(raw); } catch {}
      }
    }
    const rawMeta = localStorage.getItem('tienlo.meta.v1');
    const activeSlot = getActiveSlot();

    const curSave = slotsData[activeSlot] || slotsData[1] || (s ? s : null);
    const saveData = {
      activeSlot,
      slots: slotsData,
      save: curSave,
      meta: rawMeta ? JSON.parse(rawMeta) : null,
    };

    // Tạo preview nhân vật hiện tại cho Bảng Thiên Kiêu / Lôi Đài
    let characterPreview = null;
    if (curSave) {
      characterPreview = {
        name: curSave.name,
        gender: curSave.g,
        realm: REALMS[curSave.r]?.n || 'Phàm nhân',
        realmIdx: curSave.r,
        life: curSave.year - curSave.born,
        born: curSave.born,
        score: curSave.money,
        karma: meta.karma,
        spec: {
          name: curSave.name,
          r: curSave.r,
          mult: 1.1,
          kind: 'cultivator',
          el: curSave.root?.els?.[0] || null,
        },
      };
    }

    const res = await fetch(`${getServerUrl()}/api/user/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ saveData, characterPreview }),
    });

    return res.ok;
  } catch (err) {
    console.warn('Lỗi sync cloud save:', err);
    return false;
  }
}

/** Tải Save Game từ Đám Mây về máy (cả 5 slot) */
export async function loadSaveFromCloud(): Promise<{ ok: boolean; hasSave: boolean; error?: string }> {
  const user = getCurrentUser();
  if (!user) return { ok: false, hasSave: false, error: 'Chưa đăng nhập.' };

  try {
    const res = await fetch(`${getServerUrl()}/api/user/save`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return { ok: false, hasSave: false, error: data.error };
    if (!data.hasSave || !data.saveData) return { ok: true, hasSave: false };

    let restoredCount = 0;
    if (data.saveData.slots && typeof data.saveData.slots === 'object') {
      for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const slotSave = data.saveData.slots[i];
        if (slotSave) {
          localStorage.setItem(getSlotKey(i), JSON.stringify(slotSave));
          restoredCount++;
        }
      }
      if (data.saveData.activeSlot) {
        setActiveSlot(data.saveData.activeSlot);
      }
    } else if (data.saveData.save) {
      localStorage.setItem(getSlotKey(1), JSON.stringify(data.saveData.save));
      setActiveSlot(1);
      restoredCount = 1;
    }

    if (data.saveData.meta) {
      localStorage.setItem('tienlo.meta.v1', JSON.stringify(data.saveData.meta));
    }

    return { ok: true, hasSave: restoredCount > 0 };
  } catch (err: any) {
    return { ok: false, hasSave: false, error: err.message };
  }
}

/** Lấy danh sách cao thủ Thiên Kiêu Bảng & Đối thủ Lôi Đài PvP */
export async function fetchRoster(): Promise<any[]> {
  try {
    const res = await fetch(`${getServerUrl()}/api/multiplayer/roster`);
    const data = await res.json();
    return data.ok && Array.isArray(data.roster) ? data.roster : [];
  } catch {
    return [];
  }
}

/** Lấy tin nhắn Kênh Chat Thế Giới */
export async function fetchWorldChat(): Promise<any[]> {
  try {
    const res = await fetch(`${getServerUrl()}/api/multiplayer/chat`);
    const data = await res.json();
    return data.ok && Array.isArray(data.messages) ? data.messages : [];
  } catch {
    return [];
  }
}

/** Gửi tin nhắn lên Kênh Chat Thế Giới */
export async function sendWorldChatMessage(message: string, realm = 'Tu sĩ'): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  try {
    const res = await fetch(`${getServerUrl()}/api/multiplayer/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ message, realm }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
