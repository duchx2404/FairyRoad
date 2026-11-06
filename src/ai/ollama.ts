import { serviceAvailable, serviceBlockReason } from './service-access';
// AI kể chuyện chạy qua Google Gemini hoặc Ollama (tùy chọn). Không có AI thì game vẫn chạy với văn bản soạn sẵn.
import { isGeminiActive, callGemini } from './gemini';
import { meta, saveMeta, s } from '../engine/state';
import type { LifeRec } from '../engine/state';

const NUM_CTX = 8192;

export const aiOn = () => meta.settings.ai && (isGeminiActive() || serviceAvailable(meta.settings.url));
/** Người chơi đã bật AI nhưng game không gọi được: trả lý do để hiển thị. AI tắt hoặc dùng được → null. */
export const aiBlockReason = () => { if (!meta.settings.ai) return null; if (isGeminiActive()) return null; return serviceBlockReason(meta.settings.url); };

export async function listModels(): Promise<string[]> {
  const r = await fetch(`${meta.settings.url}/api/tags`, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  return (j.models || []).map((m: { name: string }) => m.name);
}

const SYSTEM = `Bạn là người kể chuyện cho một game tu tiên tiếng Việt.
Luật bắt buộc:
- Chỉ viết tiếng Việt có dấu, văn phong tiên hiệp, gọi nhân vật chính là "ngươi".
- TUYỆT ĐỐI không dùng chữ Hán, không dùng tiếng Anh, không dùng tiếng Trung phiên âm sai.
- Giữ nguyên mọi sự thật trong đoạn gốc: tên người, tên vật phẩm, thắng/thua, ai sống ai chết. Không bịa thêm phần thưởng hay hậu quả mới.
- Không đưa chỉ số và phần thưởng vào lời kể (thiện cảm, khí vận, ngộ tính, căn cốt, mị lực, đạo tâm, điểm cộng, vật phẩm nhận được): game tự hiển thị riêng sau đoạn văn.
- Không tự gán quan hệ: chỉ gọi ai là hôn thê, hôn phu, đạo lữ, sư phụ, đệ tử… khi bản gốc hoặc thông tin bổ sung ghi rõ người đó có quan hệ ấy với ngươi. Người lạ, hồi hạ giả, đám đông thì gọi đúng như bản gốc ("hồi hạ giả", "từng người", "những đứa trẻ").
- Xưng hô trang trọng với người bản gốc đã ghi là hôn thê, hôn phu, thánh nữ, thánh tử, trưởng bối: dùng "vị" (vị hôn thê, các vị thánh nữ, vị trưởng lão), không bao giờ gọi họ là "đứa" (sai: "từng đứa hôn thê").
- Lời thoại xưng hô Ta–Ngươi: nhân vật tự xưng "ta", gọi nhân vật chính là "ngươi"; nhiều người thì "chúng ta". TUYỆT ĐỐI không xưng "mình", "tớ", "tôi", "cậu", "bạn", "anh", "em" khi nói với nhân vật chính (sai: "Mình cũng muốn cùng ngươi tu luyện.", "Ngươi có nhớ đến mình không?" — đúng: "Ta cũng muốn cùng ngươi tu luyện.", "Ngươi có nhớ đến ta không?"). Chỉ khi nhân vật tự nói một mình về người khác mới dùng "mình" (đúng: "Liệu hắn có nhớ đến mình không?").
- Lời thoại phải rõ nghĩa, đúng ngữ pháp tiếng Việt, đọc lên chỉ hiểu được một cách; viết xong tự đọc lại từng câu. Câu phủ định đặt chữ "không" đúng chỗ (sai, mập mờ: "Ngươi có thể không chọn ta đâu!" — đúng: "Ngươi nhất định phải chọn ta!"); tránh phủ định kép như "không thể không".
- Ngôi kể thống nhất: phần lời kể (ngoài ngoặc kép) LUÔN gọi nhân vật chính là "ngươi" từ đầu tới cuối, kể cả khi kể suy nghĩ, cảm xúc của nhân vật chính. Không bao giờ dùng "ta" trong lời kể (sai: "Ta không biết vì sao, nhưng lòng ngươi bỗng thấy ấm áp" — đúng: "Ngươi không biết vì sao, chỉ thấy lòng bỗng ấm áp"). "Ta" chỉ xuất hiện trong ngoặc kép, khi một nhân vật khác tự xưng. Không gọi nhân vật chính bằng tên, không gọi là "chàng", "hắn", "nàng", "cậu bé", "cô bé".
- Không gọi một nhóm người là "bầy", "lũ", "đám", "cả bọn"; dùng "các nàng", "mọi người", hoặc đúng danh xưng trong bản gốc.
- Không đổi vai và không kể trước: lời kể mở cảnh phải dừng đúng chỗ ngươi sắp lựa chọn, không tự quyết ngươi làm gì, không kể kết quả (vd. ngươi là người đi trốn thì không được kể ngươi đi tìm).
- Không giải thích, không mở đầu bằng "Dưới đây là", không dùng markdown. Chỉ trả về đoạn văn.`;

function clean(t: string): string {
  t = t.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // model đôi khi bọc cả đoạn trong ngoặc kép: chỉ gỡ khi cả đoạn là một cặp ngoặc, không cắt ngoặc của câu thoại cuối
  if (/^["“][^"“”]*["”]$/.test(t)) t = t.slice(1, -1);
  t = t.replace(/\*\*/g, '');
  // model đôi khi vẫn gọi "đứa hôn thê": sửa lại cho đúng xưng hô
  t = t.replace(/((?:những|mấy|từng|các|cả)\s+)?(đứa|bầy|lũ|đám)\s+(vị\s+)?(hôn thê|hôn phu|thánh nữ|thánh tử)/gi, (_m, q: string | undefined, kind: string, _v, who: string) => {
    const many = !q ? kind.toLowerCase() !== 'đứa' : /^(mấy|những|cả|các)/i.test(q);
    const up = (q ?? kind)[0] === (q ?? kind)[0].toUpperCase();
    const head = q && !many ? q : many ? (up ? 'Các ' : 'các ') : '';
    return `${head}${!head && up ? 'Vị' : 'vị'} ${who}`;
  });
  // lời thoại nói với nhân vật chính (có "ngươi"): "mình" làm chủ ngữ / tân ngữ → "ta".
  // Tự nói về người khác ("Liệu hắn có nhớ đến mình không?") và "mình" phản thân ("Ngươi nghĩ mình là ai?", "tự lo cho mình") giữ nguyên.
  t = t.replace(/([“"][^”"]*[”"])/g, (q) => {
    if (!/ngươi/i.test(q)) return q;
    return q.replace(/chúng mình/g, 'chúng ta').replace(/Chúng mình/g, 'Chúng ta')
      .replace(/(^[“"]|[.!?…]\s+)Mình(?=\s)/g, '$1Ta')
      .replace(/(,\s+)mình(?=\s+(sẽ|cũng|muốn|mong|đã|đang|luôn|chỉ|không|chưa|rất|thích|nhớ|biết|tin|hứa|đợi|chờ)(?=[\s,.!?…”"]))/g, '$1ta')
      .replace(/(\S+)(\s+)(đến|tới|với|cạnh|chọn|nhớ|quên|đợi|chờ|thương|yêu|giúp|gặp|theo|bỏ|gọi)\s+mình(?=\s*(?:không|chứ|đâu|nhé|nữa|mà|rồi|sao|chăng)?\s*[,.!?…”"])/g,
        (m, w: string, sp: string, v: string) => (/^tự$/i.test(w) ? m : `${w}${sp}${v} ta`));
  });
  // lời kể (ngoài ngoặc kép) dùng "ta" chỉ nhân vật chính → "ngươi"; giữ "người ta", "chúng ta", và "ta" trong lời thoại
  t = t.split(/([“"][^”"]*[”"])/).map((seg) => (/^[“"]/.test(seg) ? seg : seg
    .replace(/(^|[.!?…]\s+|\n\s*)Ta(?=[\s,.!?…;:]|$)/g, '$1Ngươi')
    .replace(/(?<!\p{L})(?<!(?:người|chúng|bọn)\s+)ta(?!\p{L})/giu, 'ngươi'))).join('');
  // nhân vật chính bị gọi bằng tên → "ngươi" (viết hoa đầu câu)
  if (s?.name) {
    const words = s.name.trim().split(/\s+/);
    const forms = [s.name.trim(), ...(words.length >= 3 ? [words.slice(1).join(' ')] : [])];
    for (const f of forms) {
      const esc = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      t = t.replace(new RegExp(`(^|[.!?…]\\s+|\\n\\s*|[“"]\\s*)?${esc}`, 'g'), (_m, pre: string | undefined) => (pre !== undefined ? `${pre}Ngươi` : 'ngươi'));
    }
  }
  return t;
}
const hasCJK = (t: string) => /[\u3400-\u9fff]/.test(t);

async function chat(user: string, maxTok: number, temp = 0.6, numCtx = NUM_CTX, timeoutMs = 90000, forceLocal = false): Promise<string> {
  if (!forceLocal && isGeminiActive()) {
    try {
      const out = clean(await callGemini(SYSTEM, user, maxTok, temp));
      if (hasCJK(out)) throw new Error('AI trả về chữ Hán.');
      return out;
    } catch (e: any) {
      // Nếu người chơi đang chọn Gemini AI, hiển thị rõ ràng lỗi của Gemini chứ không fallback sang Ollama
      if (meta.settings.aiProvider === 'gemini') {
        throw new Error(`Lỗi Gemini AI: ${e.message || 'Không thể gọi Gemini.'}`);
      }
      console.warn('Gemini AI không thành công, thử sang Ollama:', e);
    }
  }
  let r: Response;
  try {
    r = await fetch(`${meta.settings.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: meta.settings.model,
        think: false,
        stream: false,
        keep_alive: '15m',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: user },
        ],
        options: { num_ctx: numCtx, temperature: temp, top_p: 0.9, repeat_penalty: 1.08, num_predict: maxTok },
      }),
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`Không gọi được Ollama tại ${meta.settings.url}. Hãy kiểm tra Ollama đang chạy và địa chỉ trong Cài đặt. (${reason})`);
  }
  if (!r.ok) {
    const detail = (await r.text()).slice(0, 300);
    throw new Error(`Ollama trả lỗi HTTP ${r.status}${detail ? `: ${detail}` : ''}`);
  }
  const j = await r.json();
  const out = clean(j.message?.content || '');
  if (!out) throw new Error('Ollama không trả về nội dung. Hãy kiểm tra model đang hoạt động.');
  if (j.done_reason === 'length') throw new Error('AI đã chạm giới hạn độ dài đầu ra trước khi viết xong.');
  if (hasCJK(out)) throw new Error('Ollama trả về chữ Hán; hãy thử model khác hoặc gửi lại.');
  if (out.length < 20) throw new Error('Ollama trả lời quá ngắn; không thể dùng làm lời kể.');
  return out;
}

/** AI tự gán quan hệ (hôn ước, đạo lữ…) mà bản gốc không nhắc → không dùng bản AI. */
const REL_WORDS = ['hôn thê', 'hôn phu', 'hôn ước', 'đạo lữ', 'vị hôn'];
function guardRel(out: string, src: string) {
  const o = out.toLowerCase(), g = src.toLowerCase();
  const added = REL_WORDS.filter((w) => o.includes(w) && !g.includes(w));
  if (added.length) throw new Error(`AI tự thêm quan hệ "${added[0]}" không có trong bản gốc.`);
}

/** Tách phần thưởng "(Khí vận +1)", "Nhận được …." khỏi đoạn gốc: AI chỉ kể chuyện, game gắn phần thưởng lại ở cuối. */
const FACT_RE = /\s*\([^)]*\)|\s*Nhận được[^.]*\./g;
const splitFacts = (t: string) => ({ story: t.replace(FACT_RE, '').trim(), facts: (t.match(FACT_RE) || []).map((f) => f.trim()) });
/** Bỏ câu AI vẫn kể chỉ số / phần thưởng ("Mỗi người nhận thêm 11 thiện cảm", "khí vận của ngươi tăng lên một cấp"). */
const STAT_SENT = /(thiện cảm|khí vận|ngộ tính|căn cốt|mị lực|đạo tâm)[^.!?…]{0,40}(tăng|thêm|giảm|\d)|(\d|tăng|thêm|giảm)[^.!?…]{0,25}(thiện cảm|khí vận|ngộ tính|căn cốt|mị lực|đạo tâm)/i;
function dropStatSentences(t: string) {
  return t.split('\n').map((para) => para.split(/(?<=[.!?…])\s+/).filter((x) => !STAT_SENT.test(x)).join(' ')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function charLine() {
  if (!s) return '';
  return `Nhân vật chính: ${s.name}, ${s.g === 'm' ? 'nam' : 'nữ'}, ${Math.floor(s.year - s.born)} tuổi.`;
}

/** Viết lại lời kể mở đầu sự kiện (giữ nguyên sự thật). */
export async function rewriteNarration(title: string, text: string, context = '', cast = false): Promise<string | null> {
  if (!aiOn()) return null;
  const task = cast
    ? 'Viết lại toàn bộ lời kể thành văn xuôi tiếng Việt tự nhiên, sinh động. Giữ riêng đoạn cho từng nhân vật và đoạn tổng kết; không bỏ sót nhân vật hay tình tiết.'
    : 'Viết lại toàn bộ lời kể thành 2–5 câu tiếng Việt tự nhiên, sinh động.';
  const prompt = `${charLine()}
Sự kiện: ${title}
${context ? `Thông tin bổ sung:\n${context}\n` : ''}
Lời kể gốc: ${text}

${task} Giữ nguyên mọi sự thật, tên riêng, con số, phần thưởng và kết quả trong bản gốc. Không tự thêm chi tiết, không thêm lời thoại mà bản gốc không có.${cast ? ' Với cảnh hôn ước, viết lời thoại mới theo đúng tính cách từng nhân vật; không chép lại câu thoại gốc.' : ''}`;
  const out = dropStatSentences(await chat(prompt, cast ? Math.min(1400, Math.max(500, Math.ceil(text.length / 1.5))) : 380));
  guardRel(out, [text, context].join(' '));
  return out;
}

/** Viết lại kết quả một lựa chọn cho sinh động hơn (giữ nguyên sự thật). */
export async function rewriteOutcome(title: string, situation: string, choice: string, outcome: string, context = '', cast = false): Promise<string | null> {
  if (!aiOn()) return null;
  const { story, facts } = splitFacts(outcome);
  if (story.length < 15) return null; // kết quả chỉ có phần thưởng: giữ bản gốc
  const prompt = `${charLine()}
Sự kiện: ${title}
${context ? `Thông tin bổ sung:\n${context}\n` : ''}
Tình huống: ${situation}
Ngươi chọn: ${choice}
Kết quả gốc: ${story}

Hãy viết lại phần KẾT QUẢ thành 3–5 câu văn kể chuyện sinh động hơn, giữ nguyên mọi sự thật. Không nhắc chỉ số, điểm thiện cảm hay phần thưởng. Không lặp lại tình huống, nhưng câu đầu tiên phải nối tiếp lựa chọn của ngươi để chuyển cảnh mạch lạc, không mâu thuẫn với tình huống.${cast ? ' Lời thoại của nhân vật phải mới và phù hợp tính cách đã cung cấp; không chép câu thoại gốc.' : ''}`;
  const out = dropStatSentences(await chat(prompt, 380));
  guardRel(out, [situation, choice, outcome, context].join(' '));
  // giữ lại các dòng số liệu trong ngoặc của bản gốc để người chơi không mất thông tin
  const tail = facts.filter((f) => !out.includes(f)).join(' ');
  return tail ? `${out} ${tail}` : out;
}

/** Tiểu sử khi kết thúc một kiếp. */
export async function biography(rec: LifeRec): Promise<string | null> {
  if (!aiOn() || !meta.settings.aiBio) return null;
  const prompt = `Viết một đoạn tiểu sử 150–220 chữ, giọng sử quan, ngôi thứ ba (gọi bằng tên "${rec.name}", không dùng "ngươi" ở đây), về cuộc đời một tu sĩ dựa trên các mốc sau. Chỉ dùng sự thật có trong danh sách, có thể thêm cảm xúc và nhận xét. Kết bằng một câu bình luận ngắn.

Tên: ${rec.name} (${rec.g === 'm' ? 'nam' : 'nữ'})
Xuất thân: ${rec.origin}
Linh căn: ${rec.root}
Cảnh giới cuối: ${rec.realm}
${rec.sect ? 'Tông môn: ' + rec.sect : 'Tán tu'}
Hưởng thọ: ${rec.age} tuổi
Kết cục: ${rec.cause}
Các mốc:
${rec.marks.slice(0, 30).join('\n')}`;
  return chat(prompt, 600, 0.7);
}

export function setAi(patch: Partial<typeof meta.settings>) {
  Object.assign(meta.settings, patch);
  saveMeta();
}

/** Prompt riêng cho một tính năng chủ động gọi AI, dùng model đã chọn trong Cài đặt. */
export async function writeCustomNarration(prompt: string, maxTok = 1100, numCtx = NUM_CTX, forceLocal = false): Promise<string> {
  const timeoutMs = forceLocal ? 1800000 : 300000;
  try {
    return await chat(prompt, maxTok, 0.7, numCtx, timeoutMs, forceLocal);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    if (/chữ Hán/i.test(error.message)) {
      const correction = `${prompt}\n\nYÊU CẦU SỬA LỖI: Bản trước có chữ Hán. Viết lại toàn bộ bằng tiếng Việt có dấu; tuyệt đối không dùng chữ Hán, chữ Trung Quốc, ký tự Nhật hoặc ký tự ngoại ngữ. Giữ đầy đủ từng phần và mọi nhân vật, không rút gọn phần sau.`;
      return chat(correction, maxTok, 0.55, numCtx, timeoutMs, forceLocal);
    }
    if (/giới hạn độ dài/i.test(error.message)) {
      if (maxTok < 0) throw new Error('Cảnh đã chạm cửa sổ ngữ cảnh tối đa 40.960 token của model Ollama.');
      const expandedTokens = maxTok + Math.max(2500, Math.ceil(maxTok * 0.5));
      const expandedContext = Math.min(40960, Math.max(numCtx, expandedTokens + 7000));
      return chat(`${prompt}\n\nViết trọn vẹn cảnh từ đầu đến cuối. Không kết thúc giữa câu, không rút gọn các nhân vật xuất hiện sau.`, expandedTokens, 0.65, expandedContext, timeoutMs, forceLocal);
    }
    throw error;
  }
}
export const chatAi = (prompt: string) => chat(prompt, 600, 0.75);
