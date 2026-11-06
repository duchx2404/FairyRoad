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
    const [narrative, outcome] = await Promise.all([read('song-tu-default-edited.txt'), read('song-tu-ket-qua.txt')]);
    r = new Response(JSON.stringify({ narrative, outcome }));
  }
  if (!r.ok) throw new Error(`Không đọc được prompts/song-tu.txt (HTTP ${r.status}).`);
  const p = await r.json();
  if (!p || typeof p.narrative !== 'string' || !p.narrative.trim() || typeof p.outcome !== 'string' || !p.outcome.trim()) throw new Error('File song-tu.txt thiếu hoặc sai trường prompt.');
  return p;
}
export async function writeSongTuSegment(
  p: SongTuPrompt,
  context: SongTuContext,
  index: number,
  previousScene = '',
  onProgress?: (phase: number, total: number, partial: string, done: boolean, latest: string) => void,
): Promise<string> {
  const name = context.partners[index];
  if (!name) throw new Error('Không tìm thấy đạo lữ của đoạn này.');
  const partnerLine = context.partner.split('\n')[index] ?? name;
  const sceneContext: SongTuContext = { ...context, partners: [name], partnerNames: name, partner: partnerLine, outcome: '' };
  const phases = [
    'MỞ CẢNH: chỉ dựng địa điểm, tâm trạng, đối thoại mở đầu và cách hai người chủ động tiến lại gần. Chưa hôn, chưa vuốt ve, chưa song tu. Kết ở khoảnh khắc chuẩn bị tiến gần.',
    'TIẾN GẦN: bắt đầu đúng từ khoảnh khắc cuối của phần trước. Viết riêng sự ngập ngừng, xác nhận ý muốn, nụ hôn và cái ôm; không nhắc lại địa điểm, lời thoại hay hành động đã xuất hiện. Chưa bắt đầu điều hòa linh khí.',
    'SONG TU: bắt đầu ngay sau cái ôm/nụ hôn của phần trước. Viết quá trình cùng ngồi/đứng vào vị trí tu luyện, phối hợp hơi thở và điều hòa linh khí từng nhịp; mô tả biến chuyển cảm xúc và phản ứng của cả hai. Không mở cảnh lại, không lặp nụ hôn hay lời thoại cũ.',
    index === context.partners.length - 1
      ? `LẮNG CẢNH: hoàn tất diễn biến riêng với người này, chăm sóc và trò chuyện sau song tu, rồi khép buổi bằng một nhịp chung tự nhiên. Kết quả đã xác định: ${fillSongTuTemplate(p.outcome, context)}`
      : 'LẮNG CẢNH: hoàn tất trọn diễn biến riêng với người này, chăm sóc và trò chuyện sau song tu. Kết thúc đoạn của người này trước khi bắt đầu người kế tiếp; không viết trước cảnh của người sau.',
  ];
  const completed: string[] = [];
  const qualityIssues = (text: string, previous: string[]): string[] => {
    const issues: string[] = [];
    const paragraphs = text.trim().split(/\n\s*\n/).filter(Boolean);
    if (paragraphs.length < 5) issues.push(`Chặng chỉ có ${paragraphs.length} đoạn; cần ít nhất 5 đoạn có diễn biến cụ thể`);
    const narration = text.replace(/[“"'][^”"']*[”"']/g, ' ');
    if (/(?:^|[.!?…]\s*)(?:anh|cô ấy|cô ngươi|hắn|cậu|em)\b/i.test(narration)) issues.push('Sai ngôi kể; lời kể phải gọi nhân vật chính là “ngươi”');
    if (/cô\s+ngươi/i.test(text)) issues.push('Lỗi xưng hô “cô ngươi”');
    const sentences = text.split(/(?<=[.!?…])\s+/).map(s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()).filter(s => s.length > 35);
    if (new Set(sentences).size < sentences.length * 0.8) issues.push('Có câu bị lặp nguyên văn');
    if (previous.length) {
      const stop = new Set(['ngươi','nàng','hoa','tử','yên','một','những','được','đang','cảm','thấy','như','thể','lại','cũng','với','cho','trong','không','đó','này','của','là','và','rồi','khi','đến','hơn','mình','hai','người','ánh','mắt','linh','khí','nhẹ','nhàng']);
      const shingles = (value: string) => {
        const words = value.toLowerCase().replace(/hoa\s*tử\s*yên/g, ' ').match(/[\p{L}\p{N}]+/gu)?.filter(w => w.length > 2 && !stop.has(w)) ?? [];
        const out = new Set<string>();
        for (let i = 0; i + 3 < words.length; i++) out.add(words.slice(i, i + 4).join(' '));
        return out;
      };
      const now = shingles(text), before = shingles(previous.join(' '));
      let overlap = 0;
      for (const phrase of now) if (before.has(phrase)) overlap++;
      if (now.size > 8 && overlap / now.size > 0.32) issues.push('Chặng lặp lại nhiều cụm nội dung của chặng trước');
    }
    return issues;
  };
  for (let phase = 0; phase < phases.length; phase++) {
    onProgress?.(phase + 1, phases.length, completed.join('\n\n'), false, '');
    const firstPhase = phase === 0;
    const prior = [...(previousScene ? [`KẾT ĐOẠN TRƯỚC CỦA BUỔI:\n${previousScene.slice(-1400)}`] : []), ...completed.map((s, i) => `PHẦN ${i + 1} ĐÃ VIẾT — chỉ nối tiếp, không nhắc lại:\n${s}`)];
    const prompt = [
      firstPhase ? fillSongTuTemplate(p.narrative, sceneContext) : 'Chỉ viết tiếp truyện bằng tiếng Việt tự nhiên. Nhân vật trưởng thành, mọi tương tác tự nguyện; kể thân mật gợi tả, không đồ họa. Không chép lại chỉ dẫn.',
      `LƯỢT ${index + 1}/${context.partners.length}, CHẶNG ${phase + 1}/${phases.length}. Đối tác hiện tại: ${name}. ${phases[phase]} Viết 5–7 đoạn, mỗi đoạn 3–5 câu cụ thể. Chỉ viết diễn biến thuộc chặng này; không tóm tắt, không kết thúc cả cảnh trước chặng cuối.`,
      ...prior,
      `Nhân vật chính: ${context.player}\nĐạo lữ hiện tại: ${partnerLine}\nBối cảnh: ${context.place}, ${context.world}`,
    ].join('\n\n');
    let draft = await writeCustomNarration(prompt, -1, 8192, true);
    for (let attempt = 0; attempt < 2; attempt++) {
      const issues = qualityIssues(draft, completed);
      if (!issues.length) break;
      if (attempt === 1) throw new Error(`Chặng ${phase + 1} chưa đạt yêu cầu (${issues.join('; ')}).`);
      draft = await writeCustomNarration(`${prompt}\n\nBẢN TRƯỚC KHÔNG ĐẠT: ${issues.join('; ')}. Viết lại riêng chặng này từ đầu. Tạo diễn biến mới đúng giai đoạn, không lặp bất kỳ lời thoại/cử chỉ/cụm ý nào trong phần trước. Giữ ngôi kể “ngươi”, không dùng “anh”, “cô ấy” hay “cô ngươi” cho nhân vật chính. Đủ ít nhất 5 đoạn có hành động và phản ứng cụ thể.`, -1, 8192, true);
    }
    completed.push(draft);
    onProgress?.(phase + 1, phases.length, completed.join('\n\n'), true, completed[completed.length - 1]);
  }
  return completed.join('\n\n');
}
export async function writeSongTu(p: SongTuPrompt, context: SongTuContext, onSegment?: (index: number, text: string) => void): Promise<string> {
  const scenes: string[] = [];
  for (let i = 0; i < context.partners.length; i++) {
    const scene = await writeSongTuSegment(p, context, i);
    scenes.push(scene);
    onSegment?.(i, scene);
  }
  return scenes.join('\n\n');
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
