import { meta } from '../engine/state';
import { localServicesAvailable, serviceBlockReason } from './service-access';

const pending = new Map<string, Promise<string[]>>();

async function models(url: string): Promise<string[]> {
  const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Ollama trả lỗi HTTP ${res.status}.`);
  const data = await res.json();
  if (!Array.isArray(data.models)) throw new Error('Địa chỉ này không trả về danh sách model Ollama.');
  return data.models.map((m: { name: string }) => m.name);
}

export function ensureOllamaReady(url = meta.settings.url): Promise<string[]> {
  url = url.replace(/\/+$/, '');
  const current = pending.get(url);
  if (current) return current;
  const task = (async () => {
    const blocked = serviceBlockReason(url);
    if (blocked) throw new Error(blocked);
    try { return await models(url); } catch { /* Start only after a failed probe. */ }
    const target = new URL(url);
    if (!localServicesAvailable() || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || target.protocol !== 'http:' || target.port !== '11434' || target.pathname !== '/' || target.username || target.password || target.search || target.hash) {
      throw new Error(`Không kết nối được Ollama tại ${url}. Chỉ tự khởi động dịch vụ trên máy ở cổng 11434.`);
    }
    const helpers: string[] = [];
    if (typeof location !== 'undefined') helpers.push(new URL('/api/ai/ollama/start', location.href).href);
    const server = new URL(meta.settings.serverUrl || 'http://localhost:3001');
    if (['localhost', '127.0.0.1', '[::1]'].includes(server.hostname) && !serviceBlockReason(server.href)) helpers.push(new URL('/api/ai/ollama/start', server).href);
    for (const endpoint of new Set(helpers)) {
      let res: Response;
      try { res = await fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(25000) }); }
      catch { continue; }
      const data = await res.json().catch(() => null);
      if (!data) continue;
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không tự khởi động được Ollama.');
      return models(url);
    }
    throw new Error('Không kết nối được bộ khởi động Ollama. Hãy chạy game bằng npm run dev hoặc bật máy chủ local bằng npm run server.');
  })().finally(() => { pending.delete(url); });
  pending.set(url, task);
  return task;
}
