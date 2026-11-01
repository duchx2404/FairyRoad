#!/usr/bin/env python
"""Máy vẽ theo yêu cầu cho game TienLo.

Nhận lệnh từ nút "Vẽ chân dung" / "Vẽ toàn thân" trong game (cửa sổ xem tranh của từng người), xếp hàng và vẽ LẦN LƯỢT
từng ảnh một — không bao giờ vẽ đồng loạt cả bộ (ComfyUI hay sập khi RAM thấp). Dùng lại đúng mẫu prompt / LoRA của
tools/gen_art.py (chân dung) và tools/gen_battle.py (toàn thân, sprite), nên sửa prompt ở đó là nút vẽ dùng ngay.

Chạy:  python tools/art_server.py        (hoặc: npm run art)
Cổng 8787. Tự khởi động ComfyUI (E:/ComfyUI_windows_portable) nếu chưa chạy. Ảnh ra: public/items/<khoá>.webp + manifest.json.

API (JSON, có CORS cho trang game):
  GET  /keys            → {"keys": [khoá có mẫu vẽ...]}
  GET  /status          → {"comfy": bool, "current": khoá|null, "queue": [...], "jobs": {khoá: {state, pos, elapsed, err, dur}}}
  POST /draw {"key": k} → {"ok": true, "state": "queued"|"drawing", "pos": n}   (404 nếu không có mẫu, 429 nếu hàng đợi đầy)
  POST /cancel          → xoá hàng đợi (ảnh đang vẽ vẫn vẽ nốt)
"""
import json, random, subprocess, sys, threading, time, traceback, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass
from PIL import Image
import gen_art, gen_battle
from gen_items import OUT, COMFY, render_graph

PORT = 8787
COMFY_DIR = 'E:/ComfyUI_windows_portable'
MAX_QUEUE = 4          # tối đa 4 ảnh chờ; vẫn vẽ từng ảnh một
KEEP_JOBS = 60         # giữ trạng thái 60 yêu cầu gần nhất để game hỏi

def log(*a): print(time.strftime('[%H:%M:%S]'), *a, flush=True)

# ---------------- mẫu vẽ: khoá → cách vẽ ----------------
def build_jobs():
    jobs = {}
    for key, grp, prompt, loras in gen_art.jobs(): jobs[key] = ('pt', grp, prompt, loras)
    for key, grp, prompt, loras, w, h, post_fn in gen_battle.jobs(): jobs.setdefault(key, ('body', grp, prompt, loras, w, h, post_fn))
    return jobs
JOBS = build_jobs()

def write_manifest():
    (OUT / 'manifest.json').write_text(json.dumps(sorted(p.stem for p in OUT.glob('*.webp'))), encoding='utf-8')

def draw(key):
    j = JOBS[key]
    OUT.mkdir(parents=True, exist_ok=True)
    if j[0] == 'pt':
        _, grp, prompt, loras = j
        render_graph(key, gen_art.graph(prompt, random.randint(1, 2**31), loras))  # 256px webp, giống gen_art.main
    else:
        _, grp, prompt, loras, w, h, post_fn = j
        img = gen_battle.render(prompt, loras, w, h)
        if post_fn:
            gen_battle.RAW.mkdir(exist_ok=True)
            img.save(gen_battle.RAW / f'{key}.png')
            img = post_fn(img)
            if key in gen_battle.FLIP: img = img.transpose(Image.FLIP_LEFT_RIGHT)
        if grp == 'bg': img.save(OUT / f'{key}.webp', 'WEBP', quality=84)
        else: img.save(OUT / f'{key}.webp', 'WEBP', quality=90, exact=True)
    write_manifest()

# ---------------- ComfyUI ----------------
def comfy_up():
    try: urllib.request.urlopen(COMFY + '/system_stats', timeout=3).read(); return True
    except Exception: return False
_comfy_cache = [0.0, False]
def comfy_up_cached():  # cho /status: hỏi ComfyUI tối đa 10 giây một lần
    if time.time() - _comfy_cache[0] > 10: _comfy_cache[:] = [time.time(), comfy_up()]
    return _comfy_cache[1]

def start_comfy(note):
    log('khởi động ComfyUI')
    note('đang khởi động ComfyUI…')
    cmd = (f"Start-Process -FilePath '{COMFY_DIR}/python_embeded/python.exe' -ArgumentList '-s','ComfyUI\\main.py','--listen','127.0.0.1','--port','8188','--disable-auto-launch' "
           f"-WorkingDirectory '{COMFY_DIR}' -WindowStyle Minimized -RedirectStandardOutput '{Path(__file__).parent / 'comfy.out.log'}' -RedirectStandardError '{Path(__file__).parent / 'comfy.err.log'}'")
    # không được capture_output: ComfyUI thừa kế ống dẫn nên run() sẽ treo tới khi ComfyUI tắt
    subprocess.Popen(['powershell', '-NoProfile', '-Command', cmd], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        time.sleep(5)
        if comfy_up(): log('ComfyUI sẵn sàng'); return True
    return False

# ---------------- hàng đợi ----------------
LOCK = threading.Lock()
QUEUE = []                  # khoá chờ vẽ
JOBSTATE = {}               # khoá → {state, t, t0, dur, err, note}
CURRENT = None
WAKE = threading.Event()

def set_state(key, **kw):
    with LOCK:
        st = JOBSTATE.setdefault(key, {'state': 'queued', 't': time.time()})
        st.update(kw)
        st['t'] = time.time()
        if len(JOBSTATE) > KEEP_JOBS:
            for k in sorted(JOBSTATE, key=lambda k: JOBSTATE[k]['t'])[:len(JOBSTATE) - KEEP_JOBS]:
                if JOBSTATE[k]['state'] in ('done', 'error'): del JOBSTATE[k]

def worker():
    global CURRENT
    while True:
        WAKE.wait(1)
        WAKE.clear()
        while True:
            with LOCK:
                if not QUEUE: break
                key = QUEUE.pop(0)
                CURRENT = key
            t0 = time.time()
            set_state(key, state='drawing', t0=t0, note='')
            log('vẽ', key)
            try:
                if not comfy_up() and not start_comfy(lambda m: set_state(key, note=m)): raise RuntimeError('ComfyUI không khởi động được')
                set_state(key, note='')
                draw(key)
                set_state(key, state='done', dur=round(time.time() - t0))
                log(f'xong {key} ({time.time() - t0:.0f}s)')
            except Exception as e:
                err = str(e)[:200] or e.__class__.__name__
                if not comfy_up(): err = 'ComfyUI sập giữa chừng — bấm vẽ lại, máy sẽ tự khởi động lại ComfyUI'
                set_state(key, state='error', err=err, dur=round(time.time() - t0))
                log('LỖI', key, err); traceback.print_exc()
            finally:
                with LOCK: CURRENT = None

# ---------------- HTTP ----------------
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
    def do_GET(self):
        if self.path.startswith('/keys'): return self._send(200, {'keys': sorted(JOBS)})
        if self.path.startswith('/status'):
            now = time.time()
            with LOCK:
                jobs = {}
                for k, st in JOBSTATE.items():
                    o = {'state': st['state']}
                    if st['state'] == 'queued': o['pos'] = QUEUE.index(k) + 1 if k in QUEUE else 0
                    if st['state'] == 'drawing': o['elapsed'] = round(now - st.get('t0', now)); o['note'] = st.get('note', '')
                    if st['state'] in ('done', 'error'): o['dur'] = st.get('dur', 0)
                    if st.get('err'): o['err'] = st['err']
                    jobs[k] = o
                out = {'comfy': comfy_up_cached(), 'current': CURRENT, 'queue': list(QUEUE), 'jobs': jobs}
            return self._send(200, out)
        self._send(404, {'ok': False, 'err': 'không có đường dẫn này'})
    def do_POST(self):
        n = int(self.headers.get('Content-Length') or 0)
        try: data = json.loads(self.rfile.read(n) or b'{}')
        except Exception: data = {}
        if self.path.startswith('/cancel'):
            with LOCK:
                dropped = list(QUEUE); QUEUE.clear()
            for k in dropped: set_state(k, state='error', err='đã huỷ')
            log('huỷ hàng đợi', dropped)
            return self._send(200, {'ok': True, 'dropped': dropped})
        if self.path.startswith('/draw'):
            key = str(data.get('key') or '')
            if key not in JOBS: return self._send(404, {'ok': False, 'err': f'Không có mẫu vẽ cho khoá "{key}"'})
            with LOCK:
                if CURRENT == key: return self._send(200, {'ok': True, 'state': 'drawing', 'pos': 0})
                if key in QUEUE: return self._send(200, {'ok': True, 'state': 'queued', 'pos': QUEUE.index(key) + 1})
                if len(QUEUE) >= MAX_QUEUE: return self._send(429, {'ok': False, 'err': f'Hàng đợi đã đủ {MAX_QUEUE} ảnh, đợi vẽ xong rồi bấm lại'})
                QUEUE.append(key); pos = len(QUEUE)
            set_state(key, state='queued', err=None)
            WAKE.set()
            log('nhận yêu cầu', key, f'(thứ {pos})')
            return self._send(200, {'ok': True, 'state': 'queued', 'pos': pos})
        self._send(404, {'ok': False, 'err': 'không có đường dẫn này'})

class Server(ThreadingHTTPServer):
    allow_reuse_address = False  # Windows: SO_REUSEADDR cho phép hai máy vẽ cùng bám một cổng → cấm, chỉ một máy vẽ

def main():
    try:
        urllib.request.urlopen(f'http://127.0.0.1:{PORT}/status', timeout=2).read()
        log(f'đã có máy vẽ khác chạy ở cổng {PORT} — không chạy thêm'); return
    except Exception: pass
    threading.Thread(target=worker, daemon=True).start()
    srv = Server(('127.0.0.1', PORT), H)
    log(f'máy vẽ sẵn sàng tại http://127.0.0.1:{PORT} — {len(JOBS)} mẫu vẽ; ComfyUI {"đang chạy" if comfy_up() else "chưa chạy (sẽ tự bật khi có yêu cầu)"}')
    try: srv.serve_forever()
    except KeyboardInterrupt: log('tắt máy vẽ')

if __name__ == '__main__':
    main()
