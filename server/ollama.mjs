import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const localHost = h => ['localhost', '127.0.0.1', '[::1]'].includes(h);

/** A single shared startup prevents concurrent AI requests launching multiple servers. */
export function createOllamaStarter({ probe = async () => {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1000) });
    return res.ok && Array.isArray((await res.json()).models);
  } catch { return false; }
}, launch = () => new Promise((resolve, reject) => {
  const installed = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Ollama', 'ollama.exe');
  const executable = process.platform === 'win32' && installed && existsSync(installed) ? installed : 'ollama';
  const child = spawn(executable, ['serve'], { detached: true, stdio: 'ignore', windowsHide: true });
  child.once('error', () => reject(new Error('Không tìm thấy Ollama. Hãy cài Ollama trên máy rồi thử lại.')));
  child.once('spawn', () => { child.unref(); resolve(); });
}), delay = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  let pending;
  return () => pending ||= (async () => {
    if (await probe()) return { ok: true, started: false };
    await launch();
    for (let i = 0; i < 16; i++) {
      if (await probe()) return { ok: true, started: true };
      await delay(250);
    }
    throw new Error('Đã mở Ollama nhưng dịch vụ chưa sẵn sàng. Hãy thử lại sau ít giây.');
  })().finally(() => { pending = undefined; });
}

export const ensureOllama = createOllamaStarter();

/** This endpoint can launch only the fixed local Ollama executable, never a supplied command. */
export function ollamaStartHandler(start = ensureOllama) {
  return async (req, res) => {
    const reply = (status, data) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    if (req.method !== 'POST') return reply(405, { ok: false, error: 'Chỉ hỗ trợ POST.' });
    const peer = req.socket.remoteAddress;
    try {
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer) || !localHost(new URL(`http://${req.headers.host}`).hostname) || (req.headers.origin && !localHost(new URL(req.headers.origin).hostname))) {
        return reply(403, { ok: false, error: 'Chỉ bản game chạy trên máy này được mở Ollama.' });
      }
    } catch { return reply(403, { ok: false, error: 'Địa chỉ truy cập không hợp lệ.' }); }
    try { reply(200, await start()); }
    catch (err) { reply(503, { ok: false, error: err.message }); }
  };
}
