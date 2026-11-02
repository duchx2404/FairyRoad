import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomInt } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEGATIVE = 'nudity, sexual activity, child, teenager, distorted face, extra limbs, text, watermark';
export function mediaPrompt(narrative, kind) {
  return (kind === 'video'
    ? 'Create a cinematic xianxia video of the completed story below. Keep characters consistent between frames; portray only actions and surroundings actually described. '
    : 'Create a cinematic xianxia illustration of a key moment in the completed story below. ') +
    'Follow the story faithfully, including characters, clothing, setting and mood. Fully clothed adults, non-explicit imagery. No invented characters, no text or watermark.\n\nCOMPLETED STORY:\n' + narrative;
}
const mime = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm' };
export function fill(template, context) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(context, key)) throw new Error(`Biến prompt không tồn tại: ${key}`);
    return String(context[key]);
  });
}
export function bindWorkflow(value, tokens) {
  if (typeof value === 'string') {
    const exact = value.match(/^\{\{(\w+)\}\}$/);
    if (exact && Object.hasOwn(tokens, exact[1])) return tokens[exact[1]];
    return fill(value, tokens);
  }
  if (Array.isArray(value)) return value.map(v => bindWorkflow(v, tokens));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, bindWorkflow(v, tokens)]));
  return value;
}
/** Same Flux GGUF models as tools/gen_art.py; no additional model download. */
export function imageWorkflow(prompt, negative, seed) {
  return {
    '1': { class_type: 'UnetLoaderGGUF', inputs: { unet_name: 'flux1-dev-Q6_K.gguf' } },
    '2': { class_type: 'DualCLIPLoaderGGUF', inputs: { clip_name1: 't5-v1_1-xxl-encoder-Q5_K_M.gguf', clip_name2: 'clip_l.safetensors', type: 'flux' } },
    '3': { class_type: 'VAELoader', inputs: { vae_name: 'ae.safetensors' } },
    '4': { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: prompt } },
    '7': { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: negative } },
    '15': { class_type: 'FluxGuidance', inputs: { conditioning: ['4', 0], guidance: 3 } },
    '5': { class_type: 'EmptySD3LatentImage', inputs: { width: 1024, height: 576, batch_size: 1 } },
    '6': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['15', 0], negative: ['7', 0], latent_image: ['5', 0], seed, steps: 20, cfg: 1, sampler_name: 'euler', scheduler: 'simple', denoise: 1 } },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['3', 0] } },
    '10': { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: 'tienlo_songtu' } },
  };
}

export function createSongTuServer({
  promptFile = path.join(root, 'public/prompts/song-tu.txt'),
  defaultFile = path.join(root, 'public/prompts/song-tu-default.txt'),
  outcomeFile = path.join(root, 'public/prompts/song-tu-ket-qua.txt'),
  mediaConfigFile = path.join(root, 'tools/songtu-media.json'),
  outputDir = path.join(root, 'public/generated/song-tu'),
  comfyUrl = process.env.COMFY_URL || 'http://127.0.0.1:8188',
  pollMs = 1500, timeoutMs = 20 * 60_000,
} = {}) {
  const jobs = new Map(), queue = [];
  let running = false;
  async function comfy(route, init) {
    const r = await fetch(comfyUrl.replace(/\/$/, '') + route, { ...init, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error(`ComfyUI HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return r;
  }
  async function generate(job, kind) {
    const config = job.config;
    const prompt = mediaPrompt(job.narrative, kind);
    const seed = randomInt(0, 2 ** 31);
    const template = config[kind + 'Workflow'];
    if (kind === 'video' && !template) throw new Error('Chưa cấu hình videoWorkflow trong tools/songtu-media.json. Cần workflow ComfyUI dạng API và model video tương ứng.');
    const graph = template ? bindWorkflow(template, { prompt, negative_prompt: NEGATIVE, seed }) : imageWorkflow(prompt, NEGATIVE, seed);
    if (!graph || Array.isArray(graph) || !Object.values(graph).every(n => n?.class_type && n?.inputs)) throw new Error('Workflow phải ở định dạng API của ComfyUI, không phải định dạng canvas.');
    const submitted = await (await comfy('/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: graph }) })).json();
    if (!submitted.prompt_id || submitted.error) throw new Error('ComfyUI không nhận workflow: ' + JSON.stringify(submitted.error ?? submitted.node_errors ?? {}).slice(0, 300));
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const history = await (await comfy('/history/' + encodeURIComponent(submitted.prompt_id))).json();
      const result = history[submitted.prompt_id];
      if (result?.status?.status_str === 'error') throw new Error('ComfyUI tạo hình thất bại: ' + JSON.stringify(result.status.messages ?? []).slice(0, 300));
      if (result) {
        const files = Object.values(result.outputs ?? {}).flatMap(o => [...(o.images ?? []), ...(o.gifs ?? []), ...(o.videos ?? [])]);
        const file = files.find(f => (kind === 'video' ? /\.(mp4|webm|gif)$/i : /\.(png|jpg|jpeg|webp)$/i).test(f.filename ?? ''));
        if (file) {
          const ext = path.extname(file.filename).slice(1).toLowerCase().replace('jpeg', 'jpg');
          const response = await comfy('/view?' + new URLSearchParams({ filename: file.filename, subfolder: file.subfolder ?? '', type: file.type ?? 'output' }));
          const raw = Buffer.from(await response.arrayBuffer());
          if (!raw.length || raw.length > 200 * 1024 * 1024) throw new Error('Tệp tạo ra rỗng hoặc quá lớn.');
          const name = `${job.id}_${kind}.${ext}`;
          await mkdir(outputDir, { recursive: true });
          await writeFile(path.join(outputDir, name), raw);
          await writeFile(path.join(outputDir, `${job.id}_${kind}.json`), JSON.stringify({ prompt, narrative: job.narrative, kind, seed, context: job.context }, null, 2));
          return { kind, url: '/media/' + name };
        }
        if (result.status?.completed) throw new Error(`Workflow đã chạy nhưng không xuất ${kind === 'video' ? 'video' : 'ảnh'} tương thích.`);
      }
      await new Promise(resolve => setTimeout(resolve, pollMs));
    }
    throw new Error('ComfyUI quá thời gian chờ tạo hình.');
  }
  async function drain() {
    if (running) return;
    running = true;
    try {
      while (queue.length) {
        const job = queue.shift(); job.state = 'running';
        for (const kind of [job.kind]) {
          try { job.results.push(await generate(job, kind)); }
          catch (e) { job.errors.push(`${kind === 'video' ? 'Video' : 'Ảnh'}: ${e.message}`); }
        }
        job.state = job.results.length || !job.errors.length ? 'done' : 'error';
      }
    } finally { running = false; }
  }
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const extra = (process.env.SONGTU_ORIGINS ?? '').split(',').filter(Boolean);
    if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) && !extra.includes(origin)) { res.writeHead(403); res.end(); return; }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    try {
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && pathname === '/health') return send(200, { ok: true, queued: queue.length, running });
      if (req.method === 'GET' && pathname === '/default-story') {
        const story = await readFile(defaultFile, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(story); return;
      }
      if (req.method === 'GET' && pathname === '/prompt') {
        const [narrative, outcome] = await Promise.all([readFile(promptFile, 'utf8'), readFile(outcomeFile, 'utf8')]);
        return send(200, { narrative, outcome });
      }
      if (req.method === 'GET' && /^\/media\/[a-zA-Z0-9_-]+\.(png|jpg|webp|gif|mp4|webm)$/.test(pathname)) {
        const name = pathname.slice(7), raw = await readFile(path.join(outputDir, name));
        const headers = { 'Content-Type': mime[path.extname(name).slice(1)], 'Accept-Ranges': 'bytes' };
        const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
        if (range) {
          const start = Number(range[1]), end = Math.min(Number(range[2] || raw.length - 1), raw.length - 1);
          if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${raw.length}` }); res.end(); return; }
          res.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${raw.length}` }); res.end(raw.subarray(start, end + 1)); return;
        }
        res.writeHead(200, { ...headers, 'Content-Length': raw.length }); res.end(raw); return;
      }
      if (req.method === 'GET' && pathname.startsWith('/jobs/')) {
        const job = jobs.get(pathname.slice(6));
        return job ? send(200, { state: job.state, results: job.results, errors: job.errors }) : send(404, { error: 'Không tìm thấy yêu cầu tạo hình.' });
      }
      if (req.method === 'POST' && pathname === '/jobs') {
        if (queue.length >= 8) return send(429, { error: 'Máy tạo hình đang bận; hãy chờ rồi thử lại.' });
        const chunks = []; let length = 0;
        for await (const chunk of req) { length += chunk.length; if (length > 98_304) return send(413, { error: 'Dữ liệu cảnh quá dài.' }); chunks.push(chunk); }
        let context, narrative, kind;
        try { ({ context, narrative, kind } = JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch { return send(400, { error: 'Dữ liệu cảnh không hợp lệ.' }); }
        if (!context || ['player', 'partner', 'place', 'world', 'outcome'].some(k => typeof context[k] !== 'string' || context[k].length > 6000) || !Number.isFinite(context.playerAge) || !Number.isFinite(context.partnerAge) || context.playerAge < 18 || context.partnerAge < 18) return send(400, { error: 'Cảnh Song Tu cần thông tin hợp lệ của hai nhân vật trưởng thành.' });
        if (!['image', 'video'].includes(kind) || typeof narrative !== 'string' || narrative.trim().length < 20 || narrative.length > 12000) return send(400, { error: 'Cần chọn ảnh hoặc video và gửi đoạn AI đã kể xong.' });
        const config = JSON.parse(await readFile(mediaConfigFile, 'utf8'));
        const job = { id: randomUUID(), state: 'queued', results: [], errors: [], context, narrative, kind, config };
        for (const [id, old] of jobs) { if (jobs.size < 100) break; if (old.state === 'done' || old.state === 'error') jobs.delete(id); }
        jobs.set(job.id, job); queue.push(job);
        send(202, { id: job.id }); void drain(); return;
      }
      send(404, { error: 'Không có đường dẫn này.' });
    } catch (e) { if (!res.headersSent) send(e.code === 'ENOENT' ? 404 : 500, { error: e.message }); else res.end(); }
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.SONGTU_PORT || 8788);
  createSongTuServer().listen(port, '127.0.0.1', () => console.log(`Máy Song Tu: http://127.0.0.1:${port}. Prompt: public/prompts/song-tu.txt`));
}
