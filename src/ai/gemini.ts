// Tích hợp Google Gemini AI cho FairyRoad: Sinh lời kể sự kiện, viết lại diễn biến & tiểu sử.
import { meta, saveMeta } from '../engine/state';
import { getCurrentUser } from '../engine/auth';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/** Kiểm tra xem Gemini AI có đang được kích hoạt và khả dụng hay không */
export function isGeminiActive(): boolean {
  if (!meta.settings.ai) return false;
  // Ưu tiên Gemini nếu được chọn trong cài đặt HOẶC người chơi đã đăng nhập bằng Google
  const user = getCurrentUser();
  if (meta.settings.aiProvider === 'gemini') return true;
  if (user?.authProvider === 'google') return true;
  if (meta.settings.geminiKey || user?.geminiKey) return true;
  return false;
}

export function getActiveGeminiAuth(): { apiKey?: string; accessToken?: string } {
  const user = getCurrentUser();
  const accessToken = meta.settings.geminiToken || user?.geminiToken || undefined;
  const apiKey = meta.settings.geminiKey || user?.geminiKey || undefined;
  return { apiKey, accessToken };
}

/** Lấy API Key hiện tại từ settings hoặc profile tài khoản */
export function getActiveGeminiKey(): string | null {
  const user = getCurrentUser();
  return meta.settings.geminiKey || user?.geminiKey || null;
}

/** Gọi Gemini AI để sinh nội dung văn bản */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 600,
  temperature = 0.8
): Promise<string> {
  const model = meta.settings.geminiModel || DEFAULT_GEMINI_MODEL;
  const { apiKey, accessToken } = getActiveGeminiAuth();
  const serverUrl = meta.settings.serverUrl || 'http://localhost:3001';

  // Cách 1: Gọi bằng OAuth Access Token (Khi đăng nhập Google, không cần API Key)
  if (accessToken) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.9,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === 'string') {
          return text.trim();
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Lỗi HTTP ${res.status}`;
        console.warn('Gemini OAuth error:', errMsg);
        if (errMsg.includes('has not been used in project') || errMsg.includes('disabled')) {
          throw new Error('Dự án Google Cloud của bạn chưa bật "Generative Language API". Hãy vào console.cloud.google.com để Bật API này.');
        }
        if (res.status === 401) {
          meta.settings.geminiToken = undefined;
          saveMeta();
          throw new Error('Phiên đăng nhập Google đã hết hạn. Vui lòng bấm Đăng nhập lại Google.');
        }
        throw new Error(`Google OAuth: ${errMsg}`);
      }
    } catch (err: any) {
      console.warn('Lỗi gọi Gemini qua OAuth token:', err.message);
      if (err.message && (err.message.includes('Generative Language API') || err.message.includes('Google OAuth') || err.message.includes('Phiên đăng nhập'))) {
        throw err;
      }
    }
  }

  // Cách 2: Gọi trực tiếp tới Google AI API (nếu có API Key)
  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.9,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === 'string') {
          return text.trim();
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Lỗi HTTP ${res.status}`;
        console.warn('Gemini direct API error:', errMsg);
        throw new Error(`Google API: ${errMsg}`);
      }
    } catch (err: any) {
      console.warn('Lỗi gọi trực tiếp Gemini API, thử qua máy chủ proxy:', err.message);
      if (err.message && err.message.startsWith('Google API:')) {
        throw err;
      }
    }
  }

  // Cách 2: Gọi thông qua Proxy Server FairyRoad (dành cho người chơi đăng nhập Google hoặc dùng server key)
  try {
    const proxyEndpoint = `${serverUrl}/api/ai/gemini-proxy`;
    const user = getCurrentUser();
    const res = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        prompt: `${systemPrompt}\n\n---\nYÊU CẦU CẦN KỂ LẠI:\n${userPrompt}`,
        model,
        apiKey: apiKey || undefined,
      }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok && data?.text) {
      return data.text.trim();
    }
    if (data?.error) {
      throw new Error(data.error);
    }
  } catch (err: any) {
    console.warn('Proxy Gemini server không phản hồi:', err);
    throw err;
  }

  throw new Error('Chưa có Gemini API Key. Bạn có thể lấy mã miễn phí tại aistudio.google.com và dán vào Cài đặt.');
}
