// Tích hợp Google Gemini AI cho FairyRoad: Sinh lời kể sự kiện, viết lại diễn biến & tiểu sử.
import { meta } from '../engine/state';
import { getCurrentUser } from '../engine/auth';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/** Kiểm tra xem Gemini AI có đang được kích hoạt và khả dụng hay không */
export function isGeminiActive(): boolean {
  if (!meta.settings.ai) return false;
  if (meta.settings.aiProvider === 'ollama') return false;
  return meta.settings.aiProvider === 'gemini' || !!getActiveGeminiKey();
}

/** Khi đăng nhập, chỉ dùng Key thuộc tài khoản hiện tại. */
export function getActiveGeminiKey(): string | null {
  const user = getCurrentUser();
  return user ? user.geminiKey || null : meta.settings.geminiKey || null;
}

export function getActiveGeminiAuth(): { apiKey?: string } {
  return { apiKey: getActiveGeminiKey() || undefined };
}

/** Gọi Gemini AI để sinh nội dung văn bản */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 600,
  temperature = 0.8
): Promise<string> {
  const model = meta.settings.geminiModel || DEFAULT_GEMINI_MODEL;
  const { apiKey } = getActiveGeminiAuth();
  const serverUrl = meta.settings.serverUrl || 'http://localhost:3001';

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

  // Dự phòng: proxy dùng Key đã gắn với tài khoản trên máy chủ.
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
        maxTokens,
        temperature,
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
