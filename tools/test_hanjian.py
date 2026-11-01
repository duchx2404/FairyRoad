"""Vẽ thử MỘT thanh Hán kiếm bằng LoRA tienlo_hanjian (từ khoá hanjian) để user duyệt.
   Tự khởi động ComfyUI nếu chưa chạy (sau huấn luyện ComfyUI đã bị tắt). Ảnh ra: D:/AI/learn/tienlo_hanjian/test_hanjian.png
   python tools/test_hanjian.py [--lora tienlo_hanjian.safetensors] [--w 0.9] [--prompt "..."]"""
import argparse, subprocess, sys, time, urllib.request
from pathlib import Path

for s in (sys.stdout, sys.stderr): s.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_battle as gb  # dùng chung graph()/render() với sprite trận

COMFY_DIR = Path("E:/ComfyUI_windows_portable")
OUT = Path("D:/AI/learn/tienlo_hanjian")


def comfy_up() -> bool:
    try:
        urllib.request.urlopen(gb.COMFY + "/system_stats", timeout=3); return True
    except Exception:
        return False


def start_comfy():
    if comfy_up(): return
    print("Khởi động ComfyUI…", flush=True)
    subprocess.Popen([str(COMFY_DIR / "python_embeded" / "python.exe"), "-s", "ComfyUI/main.py", "--listen", "127.0.0.1", "--port", "8188", "--disable-auto-launch"],
                     cwd=str(COMFY_DIR), creationflags=subprocess.CREATE_NEW_CONSOLE)
    for i in range(60):
        time.sleep(3)
        if comfy_up(): print(f"ComfyUI sẵn sàng sau {3 * (i + 1)} giây", flush=True); return
    raise SystemExit("ComfyUI không lên sau 3 phút")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lora", default="tienlo_hanjian.safetensors")
    ap.add_argument("--w", type=float, default=0.9)
    ap.add_argument("--prompt", default="")
    ap.add_argument("--out", default="test_hanjian.png")
    a = ap.parse_args()
    start_comfy()
    prompt = a.prompt or ("hanjian, product photograph of ONE Han dynasty Chinese jian sword drawn out of its scabbard, lying diagonally next to its black lacquered rectangular scabbard, "
                          "straight slender double-edged polished steel blade with faint engraved cloud patterns, small rectangular box-shaped bronze guard, black cord-wrapped round grip, "
                          "short cylindrical pommel, on a plain light grey studio background, sharp focus, " + gb.NEG)
    t0 = time.time()
    print(f"Vẽ 1 ảnh thử với LoRA {a.lora} ×{a.w} (~2 phút)…", flush=True)
    img = gb.render(prompt, [(a.lora, a.w)], 1024, 1024)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / a.out)
    print(f"##DONE {OUT / a.out} · {time.time() - t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
