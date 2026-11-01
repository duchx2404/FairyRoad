// Nút "Vẽ chân dung" / "Vẽ toàn thân": gọi máy vẽ cục bộ (tools/art_server.py, cổng 8787) vẽ ĐÚNG MỘT ảnh của người đang xem.
// Máy vẽ xếp hàng và vẽ lần lượt, không bao giờ vẽ đồng loạt cả bộ (tránh sập ComfyUI).
import { h, btn } from './dom';
import { hasPhoto, markPhoto } from './art';
import { toast } from './modal';

const SERVER = 'http://127.0.0.1:8787';
type JobState = { state: 'queued' | 'drawing' | 'done' | 'error'; pos?: number; elapsed?: number; note?: string; err?: string; dur?: number };
type Cb = (st: JobState) => void;

let keys: Set<string> | null = null;
let keysAt = 0;
/** Danh sách khoá máy vẽ biết vẽ; null nếu máy vẽ chưa bật (thử lại sau 10 s). */
export async function artKeys(): Promise<Set<string> | null> {
  if (keys) return keys;
  if (Date.now() - keysAt < 10_000) return null;
  keysAt = Date.now();
  try {
    const r = await fetch(SERVER + '/keys', { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return null;
    keys = new Set(((await r.json()) as { keys: string[] }).keys);
    return keys;
  } catch { return null; }
}

// yêu cầu đang theo dõi: khoá → người nghe
const inflight = new Map<string, Set<Cb>>();
let polling = false;
async function poll() {
  if (polling) return;
  polling = true;
  let fails = 0;
  while (inflight.size) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const r = await fetch(SERVER + '/status', { signal: AbortSignal.timeout(4000) });
      const st = (await r.json()) as { jobs: Record<string, JobState> };
      fails = 0;
      for (const [k, cbs] of [...inflight]) {
        const j = st.jobs[k];
        if (!j) continue;
        if (j.state === 'done') { markPhoto(k); inflight.delete(k); toast(`Đã vẽ xong: ${k} (${j.dur ?? 0}s)`); }
        else if (j.state === 'error') { inflight.delete(k); toast(`Vẽ ${k} lỗi: ${j.err ?? 'không rõ'}`, 'bad'); }
        for (const cb of cbs) cb(j);
      }
    } catch {
      if (++fails >= 4) {
        for (const [k, cbs] of [...inflight]) { inflight.delete(k); for (const cb of cbs) cb({ state: 'error', err: 'mất kết nối máy vẽ' }); }
        toast('Mất kết nối máy vẽ (tools/art_server.py)', 'bad');
      }
    }
  }
  polling = false;
}
/** Gửi yêu cầu vẽ một khoá; cb được gọi mỗi lần trạng thái đổi cho tới khi xong / lỗi. */
export async function requestDraw(key: string, cb: Cb) {
  const had = inflight.get(key);
  if (had) { had.add(cb); cb({ state: 'queued' }); return; }
  inflight.set(key, new Set([cb]));
  try {
    const r = await fetch(SERVER + '/draw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }), signal: AbortSignal.timeout(4000) });
    const j = (await r.json()) as { ok: boolean; state?: 'queued' | 'drawing'; pos?: number; err?: string };
    if (!j.ok) throw new Error(j.err || 'máy vẽ từ chối');
    cb({ state: j.state || 'queued', pos: j.pos });
    void poll();
  } catch (e) {
    inflight.delete(key);
    keys = null; keysAt = 0;
    cb({ state: 'error', err: (e as Error).message });
    toast(`Không gửi được yêu cầu vẽ: ${(e as Error).message}`, 'bad');
  }
}
const drawing = (key: string) => inflight.has(key);

/** Dòng nút vẽ cho một người: chân dung (khoá muốn có, theo thứ tự ưu tiên) + toàn thân. onDone(khoá) khi vẽ xong để vẽ lại cửa sổ. */
export function drawButtons(o: { want: string[]; full: string | null; onDone: (key: string) => void }): HTMLElement {
  const box = h('div', { class: 'por-draw' }, h('span', { class: 'note' }, 'đang hỏi máy vẽ…'));
  const render = (ks: Set<string> | null) => {
    box.innerHTML = '';
    if (!ks) {
      box.append(h('span', { class: 'note' }, 'Máy vẽ chưa bật — chạy "npm run art" (tools/art_server.py) rồi bấm thử lại.'),
        btn('Thử lại', () => { keysAt = 0; void artKeys().then(render); }, 'ghost'));
      return;
    }
    const pk = o.want.find((k) => ks.has(k)) ?? null;
    const fk = o.full && ks.has(o.full) ? o.full : null;
    const mk = (key: string, what: string) => {
      const b = btn('', () => {
        b.disabled = true;
        void requestDraw(key, (st) => {
          if (st.state === 'queued') b.textContent = st.pos ? `Chờ vẽ ${what} (thứ ${st.pos})…` : `Chờ vẽ ${what}…`;
          else if (st.state === 'drawing') b.textContent = st.note ? `${st.note}` : `Đang vẽ ${what}… ${st.elapsed ?? 0}s`;
          else if (st.state === 'done') { b.disabled = false; b.textContent = `Vẽ lại ${what}`; o.onDone(key); }
          else { b.disabled = false; b.textContent = `Vẽ lại ${what}`; }
        });
      }, 'ghost', { title: `Vẽ riêng ảnh ${key} bằng ComfyUI (máy vẽ xếp hàng, mỗi lần một ảnh)` });
      b.textContent = drawing(key) ? `Đang vẽ ${what}…` : `${hasPhoto(key) ? 'Vẽ lại' : 'Vẽ'} ${what}`;
      if (drawing(key)) { b.disabled = true; void requestDraw(key, (st) => { if (st.state === 'done' || st.state === 'error') { b.disabled = false; b.textContent = `Vẽ lại ${what}`; if (st.state === 'done') o.onDone(key); } else if (st.state === 'drawing') b.textContent = `Đang vẽ ${what}… ${st.elapsed ?? 0}s`; }); }
      return b;
    };
    if (pk) box.append(mk(pk, 'chân dung'));
    if (fk) box.append(mk(fk, 'toàn thân'));
    if (!pk && !fk) box.append(h('span', { class: 'note' }, 'Người này chưa có mẫu vẽ riêng.'));
  };
  void artKeys().then(render);
  return box;
}
