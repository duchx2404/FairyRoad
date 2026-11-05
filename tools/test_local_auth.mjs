import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const dataDir = await mkdtemp(path.join(tmpdir(), 'fairyroad-auth-test-'));
let child;
async function start() {
  child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: root, env: { ...process.env, PORT: '0', FAIRYROAD_DATA_DIR: dataDir, GEMINI_API_KEY: 'test-shared-key-must-not-be-used' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    child.stdout.on('data', data => {
      output += data;
      const port = output.match(/Máy chủ chạy tại http:\/\/localhost:(\d+)/)?.[1];
      if (port) { clearTimeout(timer); resolve(`http://localhost:${port}`); }
    });
    child.on('error', reject);
    child.once('exit', code => { clearTimeout(timer); if (code) reject(new Error(`Server exited ${code}`)); });
  });
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
}
let base;
async function request(route, body, token) {
  const res = await fetch(base + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}
try {
  base = await start();
  assert.equal((await request('/api/auth/google', { googleId: 'unused' })).status, 404);
  const a = (await request('/api/auth/login-or-register', { username: ' PlayerA ', password: ' test password ', geminiKey: 'test-key-a' })).data;
  assert.equal(a.action, 'register');
  assert.equal(a.user.username, 'playera');
  assert.equal(a.user.geminiKey, 'test-key-a');
  assert.equal((await request('/api/auth/login-or-register', { username: 'playera', password: 'test password' })).status, 401);
  assert.equal((await request('/api/auth/login-or-register', { username: ' ', password: 'password' })).status, 400);
  assert.equal((await request('/api/user/gemini-key', { geminiKey: 'test-key-b' })).status, 401);
  assert.equal((await request('/api/user/gemini-key', { geminiKey: { invalid: true } }, a.token)).status, 400);
  assert.equal((await request('/api/user/gemini-key', { geminiKey: 'test-key-a-updated' }, a.token)).status, 200);
  const again = (await request('/api/auth/login-or-register', { username: 'playera', password: ' test password ' })).data;
  assert.equal(again.action, 'login');
  assert.equal(again.user.geminiKey, 'test-key-a-updated');
  const b = (await request('/api/auth/login-or-register', { username: 'playerb', password: 'password' })).data;
  assert.equal(b.user.geminiKey, null);
  assert.equal((await request('/api/ai/gemini-proxy', { prompt: 'test', apiKey: 'body-key-must-not-be-used' }, b.token)).status, 400);
  assert.equal((await request('/api/ai/gemini-proxy', { prompt: 'test' })).status, 401);
  await stop();
  base = await start();
  const restored = (await request('/api/auth/login-or-register', { username: 'playera', password: ' test password ' })).data;
  assert.equal(restored.user.geminiKey, 'test-key-a-updated', 'account key persists across server restarts');
  await request('/api/user/gemini-key', { geminiKey: '' }, restored.token);
  const cleared = (await request('/api/auth/login-or-register', { username: 'playera', password: ' test password ' })).data;
  assert.equal(cleared.user.geminiKey, null);

  const storage = new Map();
  globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const realFetch = globalThis.fetch;
  try {
    const auth = await vite.ssrLoadModule('/src/engine/auth.ts');
    const { meta } = await vite.ssrLoadModule('/src/engine/state.ts');
    const gemini = await vite.ssrLoadModule('/src/ai/gemini.ts');
    auth.saveSession({ ...a.user, token: a.token });
    meta.settings.geminiKey = 'stale-other-account-key';
    assert.equal(gemini.getActiveGeminiKey(), 'test-key-a');
    auth.saveSession({ ...b.user, token: b.token });
    assert.equal(meta.settings.geminiKey, '');
    assert.equal(gemini.getActiveGeminiKey(), null);
    globalThis.fetch = async () => new Response(JSON.stringify({ ok: false }), { status: 401 });
    assert.equal(await auth.updateAccountGeminiKey('rejected-key'), false);
    assert.equal(auth.getCurrentUser().geminiKey, null);
    globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, geminiKey: 'test-key-b' }));
    assert.equal(await auth.updateAccountGeminiKey('test-key-b'), true);
    assert.equal(gemini.getActiveGeminiKey(), 'test-key-b');
    meta.settings.geminiToken = 'obsolete-token';
    globalThis.fetch = async (url, opts) => {
      assert.ok(url.includes('key=test-key-b'));
      assert.equal(opts.headers.Authorization, undefined);
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'API key works' }] } }] }));
    };
    assert.equal(await gemini.callGemini('test', 'test'), 'API key works');
    auth.logout();
    assert.equal(gemini.getActiveGeminiKey(), null);
    assert.equal(meta.settings.geminiKey, '');
  } finally { globalThis.fetch = realFetch; await vite.close(); }
  console.log('PASS: local accounts, password validation, account key persistence/isolation, failed key saves, OAuth removal and API-key-only Gemini');
} finally {
  await stop();
  const target = path.resolve(dataDir);
  assert.equal(path.dirname(target).toLowerCase(), path.resolve(tmpdir()).toLowerCase());
  assert.ok(path.basename(target).startsWith('fairyroad-auth-test-'));
  await rm(target, { recursive: true, force: true });
}
