import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createOllamaStarter, ollamaStartHandler } from '../server/ollama.mjs';

let launches = 0, probes = 0;
const running = createOllamaStarter({ probe: async () => true, launch: async () => launches++ });
assert.deepEqual(await running(), { ok: true, started: false });
assert.equal(launches, 0);
const cold = createOllamaStarter({ probe: async () => ++probes >= 3, launch: async () => launches++, delay: async () => {} });
const results = await Promise.all([cold(), cold(), cold()]);
assert.ok(results.every(r => r.started));
assert.equal(launches, 1, 'concurrent requests launch once');
const missing = createOllamaStarter({ probe: async () => false, launch: async () => { throw new Error('not installed'); } });
await assert.rejects(missing(), /not installed/);
let attempts = 0;
const slow = createOllamaStarter({ probe: async () => { attempts++; return false; }, launch: async () => {}, delay: async () => {} });
await assert.rejects(slow(), /chưa sẵn sàng/);
assert.equal(attempts, 17, 'startup has a bounded timeout');

let handled = 0;
const handler = ollamaStartHandler(async () => { handled++; return { ok: true }; });
async function request(peer, origin, host = 'localhost:5180', method = 'POST') {
  const res = { statusCode: 0, setHeader() {}, end(body) { this.body = JSON.parse(body); } };
  await handler({ method, socket: { remoteAddress: peer }, headers: { host, origin } }, res);
  return res.statusCode;
}
assert.equal(await request('::1', 'http://localhost:5180'), 200);
assert.equal(await request('192.168.1.42', 'http://localhost:5180'), 403);
assert.equal(await request('127.0.0.1', 'https://other-site.example'), 403);
assert.equal(await request('127.0.0.1', undefined, 'other-site.example'), 403);
assert.equal(await request('127.0.0.1', 'http://localhost:5180', 'localhost:5180', 'GET'), 405);
assert.equal(handled, 1);

const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
globalThis.location = { href: 'http://localhost:5180/', hostname: 'localhost', protocol: 'http:' };
const vite = await createServer({ optimizeDeps: { noDiscovery: true, entries: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const originalFetch = globalThis.fetch;
try {
  const { meta } = await vite.ssrLoadModule('/src/engine/state.ts');
  const { ensureOllamaReady } = await vite.ssrLoadModule('/src/ai/ollama-runtime.ts');
  const { isGeminiActive } = await vite.ssrLoadModule('/src/ai/gemini.ts');
  meta.settings.aiProvider = 'ollama';
  meta.settings.geminiKey = 'test-key';
  assert.equal(isGeminiActive(), false, 'explicit Ollama selection wins over saved Gemini key');
  const models = () => new Response(JSON.stringify({ models: [{ name: 'test-model' }] }));
  let starts = 0, ready = false;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/api/tags')) {
      if (!ready) throw new Error('offline');
      return models();
    }
    assert.equal(url, 'http://localhost:5180/api/ai/ollama/start');
    assert.equal(options.method, 'POST');
    starts++; ready = true;
    return new Response(JSON.stringify({ ok: true }));
  };
  assert.deepEqual(await Promise.all([ensureOllamaReady(), ensureOllamaReady()]), [['test-model'], ['test-model']]);
  assert.equal(starts, 1);
  assert.deepEqual(await ensureOllamaReady(), ['test-model']);
  assert.equal(starts, 1, 'running Ollama is reused');
  const { chatAi } = await vite.ssrLoadModule('/src/ai/ollama.ts');
  let generations = 0;
  globalThis.fetch = async url => {
    if (String(url).endsWith('/api/tags')) return models();
    assert.ok(String(url).endsWith('/api/chat'), 'generation uses Ollama despite saved Gemini key');
    generations++;
    return new Response(JSON.stringify({ message: { content: 'Ngươi lặng lẽ bước qua cánh cổng sơn môn giữa làn sương sớm.' } }));
  };
  assert.match(await chatAi('Kể một câu'), /Ngươi/);
  assert.equal(generations, 1);
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(ensureOllamaReady('http://192.168.1.42:11434'), /Chỉ tự khởi động/);
  globalThis.location = { href: 'https://game.example/', hostname: 'game.example', protocol: 'https:' };
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('unexpected request'); };
  await assert.rejects(ensureOllamaReady(), /bản web/);
  assert.equal(calls, 0, 'hosted game cannot start services on another machine');
  console.log('PASS: running/cold Ollama, concurrent starts, timeout/errors, local-only launcher and explicit provider selection');
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.location;
  await vite.close();
}
