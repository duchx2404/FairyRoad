import { localServicesAvailable } from './service-access';
import type { SongTuContext } from '../engine/songtu';
import { writeCustomNarration } from './ollama';

export const SONGTU_SERVER = 'http://127.0.0.1:8788';
export interface SongTuPrompt { narrative: string; outcome: string }
export interface SongTuJob { state: 'queued' | 'running' | 'done' | 'error'; results: { kind: 'image' | 'video'; url: string }[]; errors: string[] }

const SONGTU_SYSTEM = `Bạn là người viết truyện nối tiếp cho một cảnh Song Tu trong game, bằng tiếng Việt tự nhiên.
Quy tắc bắt buộc:
- Làm đúng chỉ dẫn của mục hiện tại trong prompt người dùng; viết thành diễn biến đang xảy ra, không tóm tắt, không bỏ ý, không thay chỉ dẫn bằng câu nói rằng hành động đã xảy ra.
- Chỉ dùng nhân vật chính và đạo lữ được nêu trong lượt hiện tại. Không sáng tạo nhân vật, tên người, lai lịch, quan hệ, vật thể hoặc sự kiện mới.
- Ngôi kể ngoài lời thoại luôn gọi nhân vật chính là “ngươi”. Trong lời thoại, người đang nói tự xưng “ta” và gọi nhân vật chính là “ngươi”; giữ đúng người nói, không tráo đại từ giữa hai người.
- Viết tiếp từ đoạn liền trước. Không áp dụng quy tắc dừng trước lựa chọn của các cảnh mở đầu; các chặng sau phải tiếp tục diễn biến đến hết phần được giao.
- Không nhắc lại nguyên văn hoặc kể lại hành động của đoạn trước. Từng đoạn phải có hành động, phản ứng hoặc thay đổi cảm xúc cụ thể.
- Chỉ trả về phần truyện, không markdown, không phân tích, không nhắc đến prompt.`;
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
  onProgress?: (phase: number, total: number, partial: string, done: boolean, latest: string, item?: number, itemTotal?: number) => void,
): Promise<string> {
  const name = context.partners[index];
  if (!name) throw new Error('Không tìm thấy đạo lữ của đoạn này.');
  const partnerLine = context.partner.split('\n')[index] ?? name;
  const sceneContext: SongTuContext = { ...context, partners: [name], partnerNames: name, partner: partnerLine, outcome: '' };
  const allowedNames = new Set([name, context.player.split(',')[0].trim(), context.place, context.world]);
  for (const entity of [context.place, context.world]) {
    for (const match of entity.matchAll(/[\p{Lu}Đ][\p{L}]+(?:\s+[\p{Lu}Đ][\p{L}]+){1,2}/gu)) allowedNames.add(match[0]);
  }
  const promptText = fillSongTuTemplate(p.narrative, sceneContext);
  const section = (heading: RegExp): string => {
    const lines = promptText.split('\n');
    const start = lines.findIndex(line => heading.test(line.trim()));
    if (start < 0) return '';
    let end = start + 1;
    while (end < lines.length && !/^#{1,3}\s/.test(lines[end].trim())) end++;
    return lines.slice(start, end).join('\n').trim();
  };
  const numberedSection = section(/^###\s*3\.\s*Tiến gần từng nhịp/i);
  const numberedSteps: string[] = [];
  let currentStep = -1;
  for (const line of numberedSection.split('\n')) {
    const match = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (match) {
      currentStep = Number(match[1]) - 1;
      numberedSteps[currentStep] = match[2];
    } else if (currentStep >= 0 && /^\s*-\s+/.test(line)) {
      numberedSteps[currentStep] += `\n${line.trim()}`;
    }
  }
  if (numberedSteps.length !== 7 || numberedSteps.some(step => !step)) {
    throw new Error(`Prompt “Tiến gần từng nhịp” cần đủ mục 1–7; hiện tìm thấy ${numberedSteps.filter(Boolean).length}.`);
  }
  const stepLines = numberedSection.split('\n');
  const firstStep = stepLines.findIndex(line => /^\s*1\.\s+/.test(line));
  const lastStep = stepLines.reduce((last, line, lineIndex) => /^\s*\d+\.\s+/.test(line) ? lineIndex : last, -1);
  const numberedGuidance = [
    stepLines.slice(0, firstStep).join('\n').trim(),
    stepLines.slice(lastStep + 1).join('\n').trim(),
  ].filter(Boolean).join('\n\n');
  const phases = [
    'MỞ CẢNH: chỉ dựng địa điểm, tâm trạng, đối thoại mở đầu và cách hai người chủ động tiến lại gần. Chưa thực hiện các mục 1–7, chưa hôn, chưa vuốt ve, chưa song tu. Kết ngay trước khi bắt đầu mục 1.',
    'TIẾN GẦN TỪNG NHỊP: thực hiện tuần tự đầy đủ các mục 1–7 trong prompt; mỗi mục là một phần diễn biến riêng, tuyệt đối không gộp, lược hoặc thay bằng câu tổng kết.',
    'SONG TU: sau khi hoàn tất mục 1–7, viết quá trình cùng vào vị trí tu luyện, phối hợp hơi thở và điều hòa linh khí từng nhịp; mô tả biến chuyển cảm xúc và phản ứng của cả hai. Không mở cảnh lại, không lặp hành động cũ.',
    index === context.partners.length - 1
      ? `LẮNG CẢNH: hoàn tất diễn biến riêng với người này, chăm sóc và trò chuyện sau song tu, rồi khép buổi bằng một nhịp chung tự nhiên. Kết quả đã xác định: ${fillSongTuTemplate(p.outcome, context)}`
      : 'LẮNG CẢNH: hoàn tất trọn diễn biến riêng với người này, chăm sóc và trò chuyện sau song tu. Kết thúc đoạn của người này trước khi bắt đầu người kế tiếp; không viết trước cảnh của người sau.',
  ];
  const completed: string[] = [];
  const dialogueLines = (value: string) => [...value.matchAll(/[“"]([^”"]{20,})[”"]/g)]
    .map(match => match[1].toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').trim());
  const repeatedParagraphs = (text: string, priorText: string): string[] => {
    const stop = new Set(['ngươi', 'nàng', 'nếu', 'như', 'thể', 'đang', 'được', 'trong', 'một', 'những', 'các', 'của', 'với', 'cho', 'rồi', 'cũng', 'đến', 'lại', 'hơn', 'khẽ', 'nhẹ', 'nhàng', 'dịu', 'dàng', 'cảm', 'thấy', 'khiến', 'khoảnh', 'khắc', 'ánh', 'mắt', 'nụ', 'cười', 'lòng', 'tim', 'người', 'hai', 'cả', 'mình', 'này', 'đó', 'ấy', 'rất', 'thật', 'từng', 'từ', 'vào', 'lên', 'xuống', 'qua', 'nữa', 'thêm', 'nên', 'nhưng', 'mà', 'thì', 'để', 'vừa', 'đã', 'mỗi', 'một', 'phần', ...name.toLocaleLowerCase('vi').split(/\s+/)]);
    const paragraphs = (value: string) => value.split(/\n\s*\n/).map(paragraph => ({
      text: paragraph.trim(),
      words: new Set((paragraph.toLocaleLowerCase('vi').match(/[\p{L}]{3,}/gu) ?? []).filter(word => !stop.has(word))),
      phrases: (() => {
        const words = (paragraph.toLocaleLowerCase('vi').match(/[\p{L}]{3,}/gu) ?? []).filter(word => !stop.has(word));
        return new Set(words.slice(1).map((word, index) => `${words[index]} ${word}`));
      })(),
    })).filter(paragraph => paragraph.text.length > 100 && paragraph.words.size >= 7);
    const prior = paragraphs(priorText);
    const current = paragraphs(text);
    const repeated: string[] = [];
    for (let i = 0; i < current.length; i++) {
      const earlier = [...prior, ...current.slice(0, i)];
      for (const previous of earlier) {
        let shared = 0;
        for (const word of current[i].words) if (previous.words.has(word)) shared++;
        let sharedPhrases = 0;
        for (const phrase of current[i].phrases) if (previous.phrases.has(phrase)) sharedPhrases++;
        const dice = 2 * shared / (current[i].words.size + previous.words.size);
        if ((shared >= 6 && dice >= 0.50) || (shared >= 5 && sharedPhrases >= 3)) {
          repeated.push(current[i].text.slice(0, 260));
          break;
        }
      }
    }
    return repeated;
  };
  const qualityIssues = (text: string, minimumParagraphs = 5, priorText = '', itemNumber = 0): string[] => {
    const issues: string[] = [];
    const paragraphs = text.trim().split(/\n\s*\n/).filter(Boolean);
    if (paragraphs.length < minimumParagraphs) issues.push(`Phần chỉ có ${paragraphs.length} đoạn; cần ít nhất ${minimumParagraphs} đoạn có diễn biến cụ thể`);
    const narration = text.replace(/[“"'][^”"']*[”"']/g, ' ');
    if (/(?:^|[.!?…]\s*)(?:anh|cô ấy|cô ngươi|hắn|cậu|em)\b/i.test(narration)) issues.push('Sai ngôi kể; lời kể phải gọi nhân vật chính là “ngươi”');
    if (/cô\s+ngươi/i.test(text)) issues.push('Lỗi xưng hô “cô ngươi”');
    if (/[“"].{0,80}\bngươi\s+(?:muốn|có muốn|cảm thấy|biết)\b[^\n.!?]{0,100}\b(?:bên|ở lại với|cùng)\s+ngươi\b.{0,80}[”"]/i.test(text)) issues.push('Đảo lộn Ta–Ngươi trong lời thoại; người nói tự xưng “ta”, không nói “ngươi muốn ở bên ngươi”');
    const introduced = [...text.matchAll(/\b(?:là|tên là|chính là)\s+([\p{Lu}Đ][\p{L}]+(?:\s+[\p{Lu}Đ][\p{L}]+){1,2})/gu)]
      .map(match => match[1].trim()).find(candidate => !allowedNames.has(candidate));
    if (introduced) issues.push(`Tự bịa nhân vật/tên riêng “${introduced}”; chỉ được dùng nhân vật chính và ${name}`);
    const sentences = text.split(/(?<=[.!?…])\s+/).map(s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()).filter(s => s.length > 35);
    if (new Set(sentences).size < sentences.length * 0.8) issues.push('Có câu bị lặp nguyên văn');
    const currentDialogue = dialogueLines(text);
    const priorDialogue = new Set(dialogueLines(priorText));
    if (currentDialogue.some((line, lineIndex) => currentDialogue.indexOf(line) !== lineIndex || priorDialogue.has(line))) {
      issues.push('Có câu thoại dài bị lặp trong cùng cảnh hoặc lặp lại ở đoạn trước; thay bằng lời thoại mới phù hợp diễn biến hiện tại');
    }
    if (itemNumber > 4 && /(?:nụ hôn|hôn)[^.!?…]{0,100}(?:đầu tiên|lần đầu|bắt đầu chậm|chậm rãi|e ấp)|(?:môi|đôi môi)[^.!?…]{0,70}(?:chạm|đặt)[^.!?…]{0,30}môi[^.!?…]{0,50}(?:lần đầu|đầu tiên)/i.test(text)) {
      issues.push('Đang kể lại nụ hôn đầu/nhịp bắt đầu của mục trước; từ mục này phải viết tiếp diễn biến mới, không khởi động nụ hôn lại');
    }
    const kissMotifs = [...`${priorText}\n${text}`.matchAll(/môi\s+chạm\s+môi[^.!?…]{0,100}lưỡi\s+chạm\s+lưỡi/gi)];
    if (kissMotifs.length > 1) issues.push('Lặp lại cùng mô-típ môi chạm môi, lưỡi chạm lưỡi; chỉ giữ một lần và phát triển hành động tiếp theo');
    if (repeatedParagraphs(text, priorText).length) issues.push('Có đoạn đang kể lại cùng diễn biến đã có bằng cách đổi câu chữ; phải tạo hành động và phản ứng mới, không dựng lại chạm má, vuốt ve hay nụ hôn đã diễn ra');
    return issues;
  };
  for (let phase = 0; phase < phases.length; phase++) {
    const phaseName = phase + 1;
    const intro = section(/^##\s*Mục tiêu/i) + '\n\n' + section(/^##\s*Ràng buộc nội dung/i);
    const phasePrompt = phase === 0 ? `${intro}\n\n${section(/^###\s*1\.\s*Dẫn vào cảnh/i)}\n\n${section(/^###\s*2\.\s*Xác nhận ý muốn/i)}`
      : phase === 2 ? 'SONG TU: tập trung vào việc hai người cùng ổn định tư thế tu luyện, phối hợp hơi thở, tuần hoàn linh khí và phản ứng riêng của từng người. Viết diễn biến từ lúc bắt đầu điều hòa đến khi hoàn tất, không mở lại phần gần gũi trước đó.'
      : phase === 3 ? section(/^###\s*5\.\s*Khép cảnh/i)
      : '';
    const items = phase === 1 ? numberedSteps.map((instruction, itemIndex) => ({ instruction, itemIndex })) : [{ instruction: phases[phase], itemIndex: -1 }];
    const phaseParts: string[] = [];
    for (let partIndex = 0; partIndex < items.length; partIndex++) {
      const { instruction, itemIndex } = items[partIndex];
      const itemNumber = itemIndex + 1;
      onProgress?.(phaseName, phases.length, [...completed, ...phaseParts].join('\n\n'), false, '', itemIndex >= 0 ? itemNumber : undefined, itemIndex >= 0 ? numberedSteps.length : undefined);
      const previous = phaseParts.length ? phaseParts.at(-1)!.slice(-1600) : completed.at(-1)?.slice(-1200) ?? previousScene.slice(-900);
      const prompt = [
        `CHỈ DẪN CẢNH: chỉ có nhân vật chính ${context.player.split(',')[0].trim()} và đạo lữ hiện tại ${name}; mọi tương tác giữa người trưởng thành đều tự nguyện. Không cho người thứ ba xuất hiện, không bịa tên, lai lịch hoặc sự kiện.`,
        phase === 1 ? numberedGuidance : phasePrompt,
        phase === 1
          ? `CHẶNG 3 — MỤC ${itemNumber}/7 (đây là mục duy nhất cần viết trong lượt này).\nChỉ dẫn đầy đủ của mục hiện tại:\n${instruction}\n\nHãy chuyển từng ý và từng gạch đầu dòng trong mục này thành hành động cùng phản ứng cụ thể, đúng thứ tự. Không chỉ nhắc tên hành động, không bỏ ý, không viết thay bằng tổng kết. Viết tối thiểu 5 đoạn; nếu mục có nhiều gạch đầu dòng thì dành ít nhất một đoạn diễn biến riêng cho mỗi ý. Mỗi đoạn 3–5 câu và nối tiếp tự nhiên từ đoạn ngay trước.${itemNumber > 4 ? ' Nụ hôn và nhịp bắt đầu đã diễn ra ở mục trước: không kể lại nụ hôn đầu, không tả môi vừa chạm lần đầu, không lùi diễn biến về lúc ngập ngừng; tiếp tục từ trạng thái thân mật hiện tại và chỉ viết hành động mới của mục này.' : ''}`
          : `LƯỢT ${index + 1}/${context.partners.length}, CHẶNG ${phaseName}/4. ${phases[phase]} Viết ít nhất 5 đoạn, mỗi đoạn nhiều câu cụ thể; không tóm tắt.`,
        previous ? `ĐOẠN LIỀN TRƯỚC — chỉ để nối tiếp, không lặp lại:\n${previous}` : '',
        `Nhân vật chính: ${context.player}\nĐạo lữ: ${partnerLine}\nĐịa điểm: ${context.place}, ${context.world}`,
        phase === 3 && index === context.partners.length - 1 ? `Kết quả đã xác định: ${fillSongTuTemplate(p.outcome, context)}` : '',
      ].filter(Boolean).join('\n\n');
      let draft = await writeCustomNarration(prompt, -1, 8192, true, SONGTU_SYSTEM);
      for (let attempt = 0; attempt < 2; attempt++) {
        const priorText = [...completed, ...phaseParts].join('\n\n');
        const issues = qualityIssues(draft, 5, priorText, itemIndex >= 0 ? itemNumber : 0);
        if (!issues.length) break;
        if (attempt === 1) throw new Error(`Chặng ${phaseName}${phase === 1 ? `, mục ${itemNumber}` : ''} chưa đạt yêu cầu (${issues.join('; ')}).`);
        const previousQuotes = new Set(dialogueLines(priorText));
        const repeatedQuotes = [...new Set(dialogueLines(draft).filter((line, lineIndex, lines) => lines.indexOf(line) !== lineIndex || previousQuotes.has(line)))];
        const repeatedActions = repeatedParagraphs(draft, priorText);
        draft = await writeCustomNarration(`${prompt}\n\nBẢN TRƯỚC KHÔNG ĐẠT: ${issues.join('; ')}. Viết lại riêng phần này từ đầu, tuân thủ đầy đủ mọi ý và gạch đầu dòng của mục hiện tại. Mỗi đoạn phải đưa cảnh tiến thêm một bước bằng hành động hoặc phản ứng mới; không kể lại diễn biến cũ bằng từ đồng nghĩa.${repeatedQuotes.length ? `\nCác câu thoại trùng cần thay mới, tuyệt đối không chép lại: ${repeatedQuotes.join(' | ')}` : ''}${repeatedActions.length ? `\nCác đoạn có nội dung trùng, không được diễn đạt lại: ${repeatedActions.join(' | ')}` : ''}`, -1, 8192, true, SONGTU_SYSTEM);
      }
      phaseParts.push(draft);
      onProgress?.(phaseName, phases.length, [...completed, ...phaseParts].join('\n\n'), true, draft, itemIndex >= 0 ? itemNumber : undefined, itemIndex >= 0 ? numberedSteps.length : undefined);
    }
    completed.push(phaseParts.join('\n\n'));
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
