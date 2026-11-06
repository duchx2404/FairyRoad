import { aiOn, aiBlockReason } from '../ai/ollama';
import { h, btn } from './dom';
import type { SongTuContext } from '../engine/songtu';
import { loadSongTuPrompt, writeSongTuSegment, requestSongTuMedia, SONGTU_SERVER } from '../ai/songtu';

/** Each retry generates only its own content, never gameplay rewards. */
export function songTuPanel(context: SongTuContext): HTMLElement {
  const controller = new AbortController();
  const storyStatus = h('div', { class: 'small muted' });
  const segmentList = h('div', {});
  const segmentTools = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' } });
  const media = h('div', {});
  const box = h('section', { class: 'songtu-scene' }, storyStatus, segmentTools, segmentList, media);
  let narrative = '', revision = 0, writing = false;
  const live = () => box.isConnected && !controller.signal.aborted;
  let promptCache: Awaited<ReturnType<typeof loadSongTuPrompt>> | null = null;
  const segmentStates = context.partners.map((name, index) => {
    const check = h('input', { type: 'checkbox', 'aria-label': `Chọn đoạn ${name} để viết lại` });
    const text = h('div', { class: 'story', style: { whiteSpace: 'pre-wrap' } });
    const status = h('div', { class: 'small muted' });
    const retryOne = btn(`Viết lại đoạn ${name}`, () => { void runSegments(status.textContent.startsWith('Lỗi') ? [index, ...segmentStates.slice(index + 1).map((s, i) => s.value ? -1 : index + 1 + i).filter(i => i >= 0)] : [index]); }, 'ghost');
    retryOne.hidden = true;
    const row = h('section', { style: { borderTop: '1px solid var(--line)', padding: '8px 0' } },
      h('label', { class: 'small', style: { display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 'bold' } }, check, `${index + 1}. ${name}`),
      status, text, retryOne);
    segmentList.append(row);
    return { name, check, text, status, retryOne, value: '', busy: false };
  });
  const selectAll = btn('Chọn hết', () => { segmentStates.forEach(s => { s.check.checked = true; }); }, 'ghost');
  const clearSelection = btn('Bỏ chọn', () => { segmentStates.forEach(s => { s.check.checked = false; }); }, 'ghost');
  const retrySelected = btn('Thử lại đoạn đã chọn', () => { void runSegments(segmentStates.flatMap((s, i) => s.check.checked ? [i] : [])); }, 'prime');
  segmentTools.append(selectAll, clearSelection, retrySelected);
  segmentTools.hidden = true;
  const updateStory = () => {
    narrative = segmentStates.map(s => s.value).filter(Boolean).join('\n\n');
    if (narrative) { revision++; parts.forEach(p => p.refresh()); }
  };
  const parts = (['image', 'video'] as const).map(kind => {
    const label = kind === 'image' ? 'ảnh' : 'video';
    const status = h('div', { class: 'small muted' });
    const note = h('div', { class: 'small muted' });
    const results = h('div', {});
    let busy = false, attempted = false, resultRevision = 0;
    const button = btn(`Tạo ${label}`, () => { void generate(); }, 'ghost');
    const section = h('div', {}, button, status, note, results);
    section.hidden = true;
    const refresh = () => {
      section.hidden = !narrative;
      button.disabled = writing || busy;
      button.textContent = busy ? `Đang tạo ${label}…` : attempted ? `Làm lại ${label}` : `Tạo ${label}`;
      note.textContent = resultRevision && resultRevision !== revision ? `${kind === 'image' ? 'Ảnh' : 'Video'} này theo lời kể trước. Bấm Làm lại ${label} để dùng lời kể mới.` : '';
    };
    const generate = async () => {
      if (busy || writing || !narrative) return;
      const source = narrative, sourceRevision = revision;
      busy = true; attempted = true; refresh();
      status.textContent = `Đang gửi yêu cầu tạo ${label}…`;
      const seen = new Set<string>();
      try {
        await requestSongTuMedia(context, source, kind, controller.signal, job => {
          if (!live()) return;
          status.textContent = job.state === 'queued' ? `Đang chờ tạo ${label}…` : job.state === 'running' ? `Đang tạo ${label} từ lời kể…` : job.errors.join(' · ');
          for (const result of job.results) {
            if (result.kind !== kind || seen.has(result.url) || !/^\/media\/[a-zA-Z0-9_-]+\.(png|jpg|webp|gif|mp4|webm)$/.test(result.url)) continue;
            if (!seen.size) results.replaceChildren();
            seen.add(result.url);
            resultRevision = sourceRevision;
            const url = SONGTU_SERVER + result.url;
            const element = kind === 'video' && !url.endsWith('.gif')
              ? h('video', { src: url, controls: true, preload: 'metadata', style: { width: '100%', maxHeight: '480px' } })
              : h('img', { src: url, alt: 'Cảnh Song Tu từ lời kể', style: { width: '100%', maxHeight: '480px', objectFit: 'contain' } });
            results.append(element, h('p', {}, h('a', { href: url, target: '_blank', rel: 'noopener', download: '' }, `Mở / lưu ${label}`)));
            refresh();
          }
        });
      } catch (e) {
        if (live()) status.textContent = `Chưa tạo được ${label}: ${e instanceof Error ? e.message : String(e)}`;
      } finally { busy = false; if (live()) refresh(); }
    };
    media.append(section);
    return { refresh };
  });
  const runSegments = async (indices: number[]) => {
    if (writing || !indices.length) return;
    writing = true; retry.disabled = true; parts.forEach(p => p.refresh());
    try {
      if (!aiOn()) throw new Error(aiBlockReason() ?? 'AI đang tắt. Bật lại ở Cài đặt.');
      promptCache ??= await loadSongTuPrompt(controller.signal);
      for (const index of indices) {
        const segment = segmentStates[index];
        if (!segment || !live()) return;
        segment.busy = true;
        segment.status.textContent = `Ollama đang viết đoạn ${index + 1}/${segmentStates.length} · ${segment.name}…`;
        segment.retryOne.hidden = true;
        try {
          const text = await writeSongTuSegment(
            promptCache,
            context,
            index,
            segmentStates[index - 1]?.value ?? '',
            (phase, total, _partial, done, latest, item, itemTotal) => {
              if (phase === 1 && item === 1 && !done) segment.text.replaceChildren();
              if (done && latest) {
                const piece = h('div', { style: { whiteSpace: 'pre-wrap', marginTop: '8px' } }, latest);
                segment.text.append(piece);
              }
              segment.status.textContent = itemTotal
                ? done
                  ? `Đã xong chặng 3 · mục ${item}/${itemTotal} · ${segment.name}; đang viết mục tiếp theo…`
                  : `Ollama đang viết chặng 3 · mục ${item}/${itemTotal} · ${segment.name}…`
                : done
                  ? `Đã xong chặng ${phase}/${total} · ${segment.name}; đang tiếp tục cùng người này…`
                  : `Ollama đang viết trọn cảnh ${index + 1}/${segmentStates.length} · ${segment.name} · chặng ${phase}/${total}…`;
            },
          );
          if (!text.trim()) throw new Error('AI chưa trả về nội dung.');
          if (/^#\s*Prompt mặc định|^##\s*Mục tiêu/m.test(text.trim())) throw new Error('Ollama lặp lại chỉ dẫn thay vì viết cảnh.');
          segment.value = text;
          segment.status.textContent = 'Đã viết xong.';
          segment.retryOne.hidden = false;
          updateStory();
        } catch (e) {
          segment.status.textContent = `Lỗi: ${e instanceof Error ? e.message : String(e)}. Bấm nút bên dưới để thử lại từ đoạn này.`;
          segment.retryOne.textContent = `Thử lại đoạn ${segment.name}`;
          segment.retryOne.hidden = false;
          segment.busy = false;
          break;
        }
        segment.busy = false;
      }
      const allDone = segmentStates.every(s => !!s.value);
      segmentTools.hidden = !allDone;
      storyStatus.textContent = allDone ? 'Đã viết xong các đoạn. Chọn đoạn cần viết lại hoặc chọn hết.' : '';
    } catch (e) {
      storyStatus.textContent = `Ollama chưa viết được cảnh: ${e instanceof Error ? e.message : String(e)}.`;
    } finally {
      writing = false;
      if (live()) { retry.disabled = false; parts.forEach(p => p.refresh()); }
    }
  };
  const retry = btn('Thử lại', () => { void runSegments(segmentStates.flatMap((s, i) => s.value ? [] : [i])); }, 'ghost');
  const write = async () => {
    if (writing) return;
    storyStatus.textContent = 'Ollama sẽ viết lần lượt từng đạo lữ; đoạn hoàn tất sẽ hiện ngay.';
    await runSegments(segmentStates.map((_s, i) => i));
  };
  box.append(retry);
  const observer = new MutationObserver(() => {
    if (!box.isConnected) { controller.abort(); observer.disconnect(); }
  });
  queueMicrotask(() => { if (!box.isConnected) return; observer.observe(document.body, { childList: true, subtree: true }); void write(); });
  return box;
}
