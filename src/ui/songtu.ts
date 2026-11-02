import { aiOn, aiBlockReason } from '../ai/ollama';
import { h, btn } from './dom';
import type { SongTuContext } from '../engine/songtu';
import { loadDefaultSongTu, loadSongTuPrompt, writeSongTu, requestSongTuMedia, SONGTU_SERVER } from '../ai/songtu';

/** Each retry generates only its own content, never gameplay rewards. */
export function songTuPanel(context: SongTuContext): HTMLElement {
  const controller = new AbortController();
  const story = h('div', { class: 'story', style: { whiteSpace: 'pre-wrap' } });
  const storyStatus = h('div', { class: 'small muted' });
  const media = h('div', {});
  const box = h('section', { class: 'songtu-scene' }, story, storyStatus);
  let narrative = '', revision = 0, writing = false;
  const live = () => box.isConnected && !controller.signal.aborted;
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
  const retry = btn('Làm lại lời kể', () => { void write(); }, 'ghost');
  const write = async () => {
    if (writing) return;
    writing = true; retry.disabled = true; parts.forEach(p => p.refresh());
    storyStatus.textContent = 'AI đang viết cảnh Song Tu…';
    try {
      if (!aiOn()) throw new Error(aiBlockReason() ?? 'AI đang tắt. Bật lại ở Cài đặt.');
      const prompt = await loadSongTuPrompt(controller.signal);
      if (!live()) return;
      const text = await writeSongTu(prompt, context);
      if (!live()) return;
      if (!text.trim()) throw new Error('AI chưa trả về lời kể.');
      narrative = text; revision++;
      story.textContent = text;
      storyStatus.textContent = '';
    } catch (e) {
      if (!live()) return;
      try {
        const text = await loadDefaultSongTu(context, controller.signal);
        if (!live()) return;
        narrative = text; revision++;
        story.textContent = text;
        storyStatus.textContent = 'Đang dùng lời kể mặc định vì AI chưa khả dụng.';
      } catch (fallbackError) {
        if (live()) storyStatus.textContent = `Chưa tải được lời kể mặc định: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`;
      }
    } finally {
      writing = false;
      if (live()) { retry.disabled = false; parts.forEach(p => p.refresh()); }
    }
  };
  box.append(retry, media);
  const observer = new MutationObserver(() => {
    if (!box.isConnected) { controller.abort(); observer.disconnect(); }
  });
  queueMicrotask(() => { if (!box.isConnected) return; observer.observe(document.body, { childList: true, subtree: true }); void write(); });
  return box;
}
