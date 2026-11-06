// Tích hợp Google Gemini AI cho FairyRoad: Sinh lời kể sự kiện, viết lại diễn biến & tiểu sử.
import { meta, saveMeta } from '../engine/state';
import { getCurrentUser } from '../engine/auth';

export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

/** Danh sách model theo thứ tự ưu tiên thử nghiệm khi gặp quá tải */
export function getCandidateModels(prefModel?: string): string[] {
  const base = [
    prefModel,
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
  ].filter(Boolean) as string[];

  // Loại bỏ trùng lặp và loại bỏ model 2.5-flash đã bị dừng cho user mới
  return Array.from(new Set(base)).filter((m) => m !== 'gemini-2.5-flash');
}

/** Dịch và chuẩn hóa tất cả thông báo lỗi từ Google AI / Gemini sang tiếng Việt thân thiện */
export function formatGeminiError(rawMsg: string): string {
  if (!rawMsg) return 'Lỗi không xác định khi kết nối với máy chủ AI.';
  const str = String(rawMsg);
  const lower = str.toLowerCase();

  if (
    lower.includes('experiencing high demand') ||
    lower.includes('spikes in demand') ||
    lower.includes('overloaded') ||
    lower.includes('service unavailable') ||
    lower.includes('503')
  ) {
    return 'Máy chủ Google AI hiện đang quá tải hoặc có lượng truy cập đột biến. Hệ thống đã thử đổi model dự phòng nhưng chưa thể xử lý. Vui lòng thử lại sau giây lát!';
  }

  if (lower.includes('no longer available to new users')) {
    return 'Model AI này đã dừng cung cấp cho người dùng mới. Hệ thống sẽ tự động chuyển sang phiên bản thay thế.';
  }

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('invalid api key') ||
    lower.includes('key not valid')
  ) {
    return 'Mã Gemini API Key không chính xác hoặc không hợp lệ. Vui lòng kiểm tra lại mã đã lấy từ Google AI Studio (aistudio.google.com).';
  }

  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('429')
  ) {
    return 'Đã chạm hạn mức truy vấn miễn phí của Google AI trong phút này (Quota Exceeded). Vui lòng đợi 1 phút và thử lại.';
  }

  if (
    lower.includes('user location is not supported') ||
    lower.includes('location_not_supported') ||
    lower.includes('country') ||
    lower.includes('region')
  ) {
    return 'Khu vực địa lý hiện tại chưa được Google AI hỗ trợ trực tiếp. Bạn hãy bật VPN hoặc sử dụng máy chủ Proxy của game.';
  }

  if (
    lower.includes('has not been used in project') ||
    lower.includes('disabled') ||
    lower.includes('generative language api')
  ) {
    return 'Dự án Google Cloud của bạn chưa bật "Generative Language API". Hãy vào console.cloud.google.com để Bật API này.';
  }

  if (
    lower.includes('phiên đăng nhập') ||
    lower.includes('unauthenticated') ||
    lower.includes('token expired') ||
    lower.includes('401')
  ) {
    return 'Phiên đăng nhập tài khoản đã hết hạn. Vui lòng đăng nhập lại tài khoản.';
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network') ||
    lower.includes('abort') ||
    lower.includes('timeout')
  ) {
    return 'Không thể kết nối đến máy chủ Google AI do lỗi mạng hoặc quá thời gian chờ (Timeout). Vui lòng kiểm tra kết nối mạng.';
  }

  if (lower.includes('chưa có gemini api key') || lower.includes('chưa nhập api key')) {
    return 'Chưa có Gemini API Key. Vui lòng dán mã API Key miễn phí từ aistudio.google.com vào ô cấu hình.';
  }

  // Loại bỏ các tiền tố tiếng Anh nếu có
  const cleaned = str
    .replace(/^Error:\s*/i, '')
    .replace(/^Google API:\s*/i, '')
    .replace(/^Google OAuth:\s*/i, '')
    .trim();

  return `Lỗi từ Google AI: ${cleaned}`;
}

/** Kiểm tra xem Gemini AI có đang được kích hoạt và khả dụng hay không */
export function isGeminiActive(): boolean {
  if (!meta.settings.ai) return false;
  // Provider được chọn phải có quyền ưu tiên; đăng nhập Google không được khóa Ollama.
  return meta.settings.aiProvider === 'gemini';
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

/** Gọi Gemini AI để sinh nội dung văn bản (có cơ chế tự động chuyển model dự phòng khi quá tải) */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 600,
  temperature = 0.8
): Promise<string> {
  let prefModel = meta.settings.geminiModel || DEFAULT_GEMINI_MODEL;
  if (prefModel === 'gemini-2.5-flash') {
    prefModel = DEFAULT_GEMINI_MODEL;
    meta.settings.geminiModel = DEFAULT_GEMINI_MODEL;
    saveMeta();
  }

  const candidateModels = getCandidateModels(prefModel);
  const { apiKey, accessToken } = getActiveGeminiAuth();
  const serverUrl = meta.settings.serverUrl || 'http://localhost:3001';

  let lastErrorMsg = '';

  // Cách 1: Gọi bằng OAuth Access Token (Khi đăng nhập Google, không cần API Key)
  if (accessToken) {
    for (const curModel of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${curModel}:generateContent`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(18000),
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
            if (curModel !== meta.settings.geminiModel) {
              meta.settings.geminiModel = curModel;
              saveMeta();
            }
            return text.trim();
          }
        }

        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Lỗi HTTP ${res.status}`;
        lastErrorMsg = errMsg;
        console.warn(`Gemini OAuth (${curModel}) thất bại:`, errMsg);

        if (errMsg.includes('has not been used in project') || errMsg.includes('disabled')) {
          throw new Error('Dự án Google Cloud của bạn chưa bật "Generative Language API". Hãy vào console.cloud.google.com để Bật API này.');
        }

        if (res.status === 401) {
          meta.settings.geminiToken = undefined;
          saveMeta();
          throw new Error('Phiên đăng nhập Google đã hết hạn. Vui lòng bấm Đăng nhập lại Google.');
        }

        const isTransient =
          res.status === 503 ||
          res.status === 429 ||
          errMsg.toLowerCase().includes('high demand') ||
          errMsg.toLowerCase().includes('not available') ||
          errMsg.toLowerCase().includes('overloaded');

        if (!isTransient) {
          throw new Error(formatGeminiError(errMsg));
        }
      } catch (err: any) {
        lastErrorMsg = err.message;
        if (
          err.message &&
          (err.message.includes('Generative Language API') ||
            err.message.includes('Google Cloud') ||
            err.message.includes('Phiên đăng nhập') ||
            err.message.startsWith('Lỗi từ Google AI'))
        ) {
          throw err;
        }
      }
    }
  }

  // Cách 2: Gọi trực tiếp tới Google AI API (nếu có API Key)
  if (apiKey) {
    for (const curModel of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${curModel}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(18000),
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
            if (curModel !== meta.settings.geminiModel) {
              meta.settings.geminiModel = curModel;
              saveMeta();
            }
            return text.trim();
          }
        }

        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Lỗi HTTP ${res.status}`;
        lastErrorMsg = errMsg;
        console.warn(`Gemini direct API (${curModel}) thất bại:`, errMsg);

        const isTransient =
          res.status === 503 ||
          res.status === 429 ||
          errMsg.toLowerCase().includes('high demand') ||
          errMsg.toLowerCase().includes('not available') ||
          errMsg.toLowerCase().includes('overloaded');

        if (!isTransient) {
          throw new Error(formatGeminiError(errMsg));
        }
      } catch (err: any) {
        lastErrorMsg = err.message;
        if (err.message && err.message.includes('Mã Gemini API Key không chính xác')) {
          throw err;
        }
      }
    }
  }

  // Cách 3: Gọi thông qua Proxy Server FairyRoad (dành cho người chơi đăng nhập Google hoặc dùng server key)
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
        model: prefModel,
        apiKey: apiKey || undefined,
      }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok && data?.text) {
      if (data.modelUsed && data.modelUsed !== meta.settings.geminiModel) {
        meta.settings.geminiModel = data.modelUsed;
        saveMeta();
      }
      return data.text.trim();
    }
    if (data?.error) {
      lastErrorMsg = data.error;
    }
  } catch (err: any) {
    console.warn('Proxy Gemini server không phản hồi:', err);
    if (!lastErrorMsg) lastErrorMsg = err.message;
  }

  if (lastErrorMsg) {
    throw new Error(formatGeminiError(lastErrorMsg));
  }

  throw new Error('Chưa có Gemini API Key. Bạn có thể lấy mã miễn phí tại aistudio.google.com và dán vào Cài đặt.');
}
