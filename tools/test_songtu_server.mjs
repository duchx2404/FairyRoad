import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSongTuServer, bindWorkflow } from './songtu_server.mjs';

const temp = await mkdtemp(path.join(os.tmpdir(), 'fairyroad-songtu-'));
const config = { narrative: await readFile(new URL('../public/prompts/song-tu.txt', import.meta.url), 'utf8') };
const promptFile = path.join(temp, 'prompt.json');
const mediaConfigFile = path.join(temp, 'media.json');
const mediaConfig = { imageWorkflow: null, videoWorkflow: null };
await writeFile(mediaConfigFile, JSON.stringify(mediaConfig));
const narrative = 'Thanh Vân cùng Ngọc Lan nhập định bên hồ sen tím dưới ánh trăng bạc.';
const requests = [];
const mock = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/prompt') {
    let text = ''; for await (const b of req) text += b;
    requests.push(JSON.parse(text).prompt);
    return res.end(JSON.stringify({ prompt_id: String(requests.length) }));
  }
  if (req.url.startsWith('/history/')) {
    const id = req.url.split('/').at(-1), graph = requests[Number(id) - 1];
    const video = Object.values(graph).some(n => n.class_type === 'TestVideo');
    return res.end(JSON.stringify({ [id]: { status: { completed: true }, outputs: { out: { [video ? 'gifs' : 'images']: [{ filename: video ? 'sample.mp4' : 'sample.png', subfolder: '', type: 'output' }] } } } }));
  }
  if (req.url.startsWith('/view?')) { res.setHeader('Content-Type', 'application/octet-stream'); return res.end(Buffer.from('fake-media-for-routing-test')); }
  res.writeHead(404); res.end('{}');
});
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
const mockUrl = await listen(mock);
await writeFile(promptFile, config.narrative);
const app = createSongTuServer({ promptFile, mediaConfigFile, outputDir: path.join(temp, 'output'), comfyUrl: mockUrl, pollMs: 1, timeoutMs: 2000 });
const url = await listen(app);
const context = { player: 'Thanh Vân, nam, 30 tuổi', partner: 'Ngọc Lan, nữ, 28 tuổi', place: 'Động phủ', world: 'Thương Lan', outcome: 'Tu vi tăng.', playerAge: 30, partnerAge: 28 };
async function generate(kind = 'image') {
  const r = await fetch(url + '/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, narrative, kind }) });
  assert.equal(r.status, 202); const { id } = await r.json();
  for (let i = 0; i < 100; i++) {
    const job = await (await fetch(url + '/jobs/' + id)).json();
    if (job.state === 'done' || job.state === 'error') return job;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('test queue timed out');
}
try {
  const image = await generate();
  assert.equal(image.results[0].kind, 'image');
  assert.match(requests[0]['4'].inputs.text, /Thanh Vân/);
  assert.match(requests[0]['4'].inputs.text, /Ngọc Lan/);
  assert.equal((await fetch(url + image.results[0].url)).status, 200);
  const range = await fetch(url + image.results[0].url, { headers: { Range: 'bytes=1-4' } });
  assert.equal(range.status, 206); assert.equal((await range.arrayBuffer()).byteLength, 4);
  assert.ok(requests[0]['4'].inputs.text.endsWith(narrative));
  assert.equal((await (await fetch(url + '/prompt')).json()).narrative, config.narrative);
  const missing = await fetch(url + '/jobs', { method: 'POST', body: JSON.stringify({ context }) });
  assert.equal(missing.status, 400);
  assert.equal(requests.length, 1);
  config.narrative = 'Edited narrative prompt';
  await writeFile(promptFile, config.narrative);
  assert.equal((await (await fetch(url + '/prompt')).json()).narrative, config.narrative);
  mediaConfig.videoWorkflow = { '1': { class_type: 'TestVideo', inputs: { text: '{{prompt}}', seed: '{{seed}}' } } };
  await writeFile(mediaConfigFile, JSON.stringify(mediaConfig));
  const video = await generate('video');
  assert.deepEqual(video.results.map(x => x.kind), ['video']);
  assert.ok(requests[1]['1'].inputs.text.endsWith(narrative));
  assert.equal(typeof requests[1]['1'].inputs.seed, 'number');
  assert.match(video.results[0].url, /\.mp4$/);
  mediaConfig.videoWorkflow = null; await writeFile(mediaConfigFile, JSON.stringify(mediaConfig));
  const failed = await generate('video');
  assert.equal(failed.state, 'error'); assert.equal(failed.results.length, 0);
  assert.match(failed.errors[0], /videoWorkflow/);
  assert.equal(requests.length, 2);
  assert.equal((await generate('image')).state, 'done');
  const invalid = await fetch(url + '/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: { ...context, partnerAge: 12 } }) });
  assert.equal(invalid.status, 400);
  const forbidden = await fetch(url + '/jobs', { method: 'POST', headers: { Origin: 'https://unrelated.example' }, body: '{}' });
  assert.equal(forbidden.status, 403);
  assert.deepEqual(bindWorkflow({ seed: '{{seed}}', text: 'P: {{prompt}}' }, { seed: 12, prompt: 'lotus' }), { seed: 12, text: 'P: lotus' });
  console.log('PASS: live prompt reload, image/video routing, queue, saved media/range, independent media failure and request validation (mock ComfyUI).');
} finally {
  await Promise.all([new Promise(resolve => app.close(resolve)), new Promise(resolve => mock.close(resolve))]);
  if (path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith('fairyroad-songtu-')) await rm(temp, { recursive: true, force: true });
}
