import { localServicesAvailable } from './service-access';
import type { SongTuContext } from '../engine/songtu';
import { writeCustomNarration } from './ollama';

export const SONGTU_SERVER = 'http://127.0.0.1:8788';
export interface SongTuPrompt { narrative: string; outcome: string }
export interface SongTuJob { state: 'queued' | 'running' | 'done' | 'error'; results: { kind: 'image' | 'video'; url: string }[]; errors: string[] }
export function fillSongTuTemplate(template: string, context: SongTuContext): string {
  let nextPartner = 0;
  const expanded = template.replace(/\{\{#(partners|withPartner|withNextPartner)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, kind: string, block: string) => {
    if (/\{\{[#/]/.test(block)) throw new Error('Không lồng các khối đạo lữ vào nhau.');
    if (kind === 'partners') return context.partners.map((name, index) => block.trim().replace(/\{\{(name|index)\}\}/g, (_match, key: string) => key === 'name' ? name : String(index + 1))).join('\n');
    // Each scene consumes fresh participants; numbered names are local to that scene.
    const slots = [...block.matchAll(/\{\{name(\d+)\}\}/g)].map(match => Number(match[1]));
    if (slots.some(slot => slot < 1)) throw new Error('Tên trong khối bắt đầu từ {{name1}}.');
    const count = Math.max(1, ...slots);
    if (nextPartner + count > context.partners.length) return '';
    const start = nextPartner;
    nextPartner += count;
    return block.trim().replace(/\{\{(name\d*|index)\}\}/g, (_match, key: string) =>
      key === 'index' ? String(start + 1) : context.partners[start + (key === 'name' ? 0 : Number(key.slice(4)) - 1)]);
  });
  if (/\{\{[#/]/.test(expanded)) throw new Error('Khối đạo lữ chưa đóng đúng hoặc không được hỗ trợ.');
  // Omit the entire line when it addresses a partner who was not selected.
  return expanded.split('\n').filter(line => ![...line.matchAll(/\{\{partner(\d+)\}\}/g)].some(match => Number(match[1]) < 1 || Number(match[1]) > context.partners.length)).join('\n').replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const numbered = key.match(/^partner(\d+)$/);
    if (numbered) return context.partners[Number(numbered[1]) - 1];
    if (!(key in context)) throw new Error(`Biến prompt không tồn tại: ${key}`);
    return String(context[key as keyof SongTuContext]);
  });
}
export async function loadDefaultSongTu(context: SongTuContext, signal?: AbortSignal): Promise<string> {
  let response: Response;
  try {
    if (!localServicesAvailable()) throw new Error('Dùng prompt được phục vụ cùng game.');
    const timeout = AbortSignal.timeout(3000);
    response = await fetch(SONGTU_SERVER + '/default-story', { cache: 'no-store', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
    if (!response.ok) throw new Error('Không đọc được lời kể mặc định từ server.');
  } catch (e) {
    if (signal?.aborted) throw e;
    response = await fetch(new URL('prompts/song-tu-default.txt', document.baseURI), { cache: 'no-store', signal });
  }
  if (!response.ok) throw new Error(`Không đọc được song-tu-default.txt (HTTP ${response.status}).`);
  const template = await response.text();
  if (!template.trim()) throw new Error('File song-tu-default.txt đang trống.');
  return fillSongTuTemplate(template, context);
}
export async function loadSongTuPrompt(signal?: AbortSignal): Promise<SongTuPrompt> {
  let r: Response;
  try {
    if (!localServicesAvailable()) throw new Error('Dùng prompt được phục vụ cùng game.');
    const timeout = AbortSignal.timeout(3000);
    r = await fetch(SONGTU_SERVER + '/prompt', { cache: 'no-store', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (e) {
    if (signal?.aborted) throw e;
    // Text still works when the media service is offline.
    const read = async (file: string) => {
      const response = await fetch(new URL('prompts/' + file, document.baseURI), { cache: 'no-store', signal });
      if (!response.ok) throw new Error(`Không đọc được ${file} (HTTP ${response.status}).`);
      return response.text();
    };
    const [narrative, outcome] = await Promise.all([read('song-tu.txt'), read('song-tu-ket-qua.txt')]);
    r = new Response(JSON.stringify({ narrative, outcome }));
  }
  if (!r.ok) throw new Error(`Không đọc được prompts/song-tu.txt (HTTP ${r.status}).`);
  const p = await r.json();
  if (!p || typeof p.narrative !== 'string' || !p.narrative.trim() || typeof p.outcome !== 'string' || !p.outcome.trim()) throw new Error('File song-tu.txt thiếu hoặc sai trường prompt.');
  return p;
}
export function writeSongTu(p: SongTuPrompt, context: SongTuContext) {
  return writeCustomNarration([
    'Tuân thủ từng gạch đầu dòng trong chỉ dẫn dưới đây khi viết lời kể. Chỉ trả về lời kể, không liệt kê lại chỉ dẫn.',
    fillSongTuTemplate(p.narrative, context),
    'THÔNG TIN CẢNH (dữ liệu):',
    `Nhân vật chính: ${context.player}\nĐạo lữ được chọn: ${context.partner}\nBối cảnh: ${context.place}, ${context.world}`,
    'KẾT QUẢ TU LUYỆN:',
    fillSongTuTemplate(p.outcome, context),
  ].join('\n\n'));
}
export async function requestSongTuMedia(context: SongTuContext, narrative: string, kind: 'image' | 'video', signal: AbortSignal, progress: (job: SongTuJob) => void): Promise<SongTuJob> {
  if (!localServicesAvailable()) throw new Error('Bản web chưa kết nối máy tạo ảnh/video trực tuyến.');
  const send = await fetch(SONGTU_SERVER + '/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, narrative, kind }), signal });
  const queued = await send.json();
  if (!send.ok) throw new Error(queued.error ?? `HTTP ${send.status}`);
  const deadline = Date.now() + 21 * 60_000;
  while (!signal.aborted && Date.now() < deadline) {
    const r = await fetch(`${SONGTU_SERVER}/jobs/${encodeURIComponent(queued.id)}`, { signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`Không đọc được tiến độ tạo hình (HTTP ${r.status}).`);
    const job: SongTuJob = await r.json();
    progress(job);
    if (job.state === 'done' || job.state === 'error') return job;
    await new Promise<void>((resolve, reject) => {
      const cancel = () => { clearTimeout(timer); reject(new DOMException('Đã đóng cảnh', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, 1500);
      signal.addEventListener('abort', cancel, { once: true });
    });
  }
  throw new Error('Đã hết thời gian chờ tạo hình.');
}
