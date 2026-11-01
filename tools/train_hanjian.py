"""Huấn luyện LoRA "Hán kiếm" (từ khoá: hanjian) cho Flux từ 3 ảnh mẫu tools/ref/hj_{black,silver,gold}.png (user đưa 2026-11-01; 4 ảnh cũ ở tools/ref/old).
   Dùng lại pipeline kohya của AIFilm (E:/Project/AIFilm/tools/kohya_launch.py + config.json › learn).

   python tools/train_hanjian.py --dataset-only        # chỉ dựng bộ ảnh + caption + bảng xem thử (không cần GPU)
   python tools/train_hanjian.py [--steps 800]          # dựng bộ ảnh rồi huấn luyện (tắt ComfyUI để nhường VRAM)
   Kết quả: D:/AI/models/loras/tienlo_hanjian.safetensors · nhật ký D:/AI/learn/tienlo_hanjian/train.log
"""
import argparse, json, random, re, shutil, subprocess, sys, time
from pathlib import Path
from PIL import Image, ImageOps

for s in (sys.stdout, sys.stderr): s.reconfigure(encoding="utf-8", errors="replace")
HERE = Path(__file__).resolve().parent
REF = HERE / "ref"
AIFILM = Path("E:/Project/AIFilm")
LEARN = json.loads((AIFILM / "config.json").read_text(encoding="utf-8"))["learn"]
ROOT = Path(LEARN["root"]) / "tienlo_hanjian"
DS = ROOT / "dataset"
OUT = ROOT / "output"
NAME = "tienlo_hanjian"
TRIG = "hanjian"

# ---- cắt ảnh mẫu: (file, hộp cắt (trái, trên, phải, dưới), mô tả) ----
# Ảnh 1/2 (800×800): kiếm + bao nằm chéo trên thảm xám, góc dưới phải có hình tròn phóng to hộ thủ → tách riêng làm ảnh cận cảnh.
# Ảnh 3 (447×447): 8 thanh trong bao dựng trên nền tre. Ảnh 4 (554×554): kiếm đồng + bao, có watermark ở (95..240, 395..470) và chữ ở (330..450, 330..400) → tô nền.
SWORD = ("a real Han dynasty Chinese jian sword: a long straight double-edged polished steel blade with a sharp pointed tip, engraved along its length with silver scroll patterns, "
         "a thick small rectangular block-shaped guard carved with patterns, a round grip tightly wrapped in cord, and a round pommel")
CROPS = [
    # hj_black / hj_silver (554×554): kiếm nằm chéo từ chuôi (trên phải) tới mũi (dưới trái), bao kiếm song song bên trái; góc dưới phải có hình tròn phóng to hộ thủ
    ("hj_black.png", (0, 0, 554, 290), f"the upper part of {SWORD}, black cord grip and black fittings, with the top of its black lacquered rectangular scabbard with a metal fitting, lying diagonally on a grey carpet"),
    ("hj_black.png", (0, 0, 300, 554), f"the lower part of {SWORD}, the engraved blade and its sharp pointed tip, next to its black lacquered rectangular scabbard with a metal chape, lying diagonally on a grey carpet"),
    ("hj_black.png", (310, 300, 554, 545), "close-up photo of the guard of a real Han dynasty Chinese jian sword: a thick small black rectangular block-shaped guard carved with patterns, the black cord-wrapped grip, and the base of the straight polished steel blade engraved with silver scroll patterns, on a grey carpet"),
    ("hj_silver.png", (0, 0, 554, 290), f"the upper part of {SWORD}, white cord grip and silver fittings, with the top of its silver crackle-lacquered rectangular scabbard, lying diagonally on a grey carpet"),
    ("hj_silver.png", (0, 0, 300, 554), f"the lower part of {SWORD} with silver fittings, the engraved blade and its sharp pointed tip, next to its silver rectangular scabbard with a metal chape, lying diagonally on a grey carpet"),
    ("hj_silver.png", (310, 300, 554, 545), "close-up photo of the guard of a real Han dynasty Chinese jian sword: a thick small silver rectangular block-shaped guard carved with patterns, the white cord-wrapped grip, and the base of the straight polished steel blade engraved with scroll patterns, on a grey carpet"),
    # hj_gold (554×554): kiếm nằm chéo từ chuôi (trên trái) tới mũi (dưới phải), bao đen khoen vàng song song bên phải, không có hình tròn
    ("hj_gold.png", (0, 0, 554, 554), f"{SWORD}, black cord grip and gold fittings, full length next to its black lacquered rectangular scabbard with gold fittings and a gold chape, lying diagonally on a grey carpet"),
    ("hj_gold.png", (0, 0, 340, 340), f"the upper part of {SWORD}, black cord grip, small gold rectangular block-shaped guard and gold round pommel, with the gold fitting at the top of its black rectangular scabbard, lying diagonally on a grey carpet"),
    ("hj_gold.png", (180, 180, 554, 554), f"the lower part of {SWORD} with gold fittings, the engraved blade and its sharp pointed tip, next to the gold chape of its black rectangular scabbard, lying diagonally on a grey carpet"),
]
MASK = {}


def fill_bg(im: Image.Image, boxes):
    """Tô các hộp chữ/watermark bằng màu nền trắng lấy ở góc ảnh."""
    im = im.copy()
    px = im.load()
    col = px[12, 12]  # nền trắng ở góc ảnh
    for (l, t, r, b) in boxes:
        for y in range(t, b):
            for x in range(l, r):
                px[x, y] = col
    return im


def build_dataset() -> int:
    if DS.exists(): shutil.rmtree(DS)
    DS.mkdir(parents=True)
    rnd = random.Random(7)
    n = 0
    for i, (fn, box, cap) in enumerate(CROPS):
        im = Image.open(REF / fn).convert("RGB")
        if fn in MASK: im = fill_bg(im, MASK[fn])
        base = im.crop(box)
        variants = [("a", base), ("b", ImageOps.mirror(base))]
        # thêm 2 lát cắt ngẫu nhiên 70–90% để LoRA học chi tiết ở nhiều tỉ lệ
        for k in ("c", "d"):
            w, h = base.size
            f = rnd.uniform(0.7, 0.9)
            cw, ch = int(w * f), int(h * f)
            x0, y0 = rnd.randint(0, w - cw), rnd.randint(0, h - ch)
            v = base.crop((x0, y0, x0 + cw, y0 + ch))
            if rnd.random() < 0.5: v = ImageOps.mirror(v)
            variants.append((k, v))
        for k, v in variants:
            v = v.copy()
            v.thumbnail((768, 768))
            stem = f"hj_{i:02d}{k}"
            v.save(DS / f"{stem}.png")
            (DS / f"{stem}.txt").write_text(f"{TRIG}, {cap}", encoding="utf-8")
            n += 1
    # bảng xem thử
    files = sorted(DS.glob("*.png"))
    cols = 8
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 160, rows * 160), "white")
    for j, f in enumerate(files):
        t = Image.open(f); t.thumbnail((156, 156))
        sheet.paste(t, ((j % cols) * 160 + 2, (j // cols) * 160 + 2))
    sheet.save(ROOT / "dataset_sheet.png")
    return n


def free_vram():
    out = subprocess.run(["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True).stdout
    for line in out.splitlines():
        p = line.split()
        if len(p) >= 5 and p[1].endswith(":8188") and p[3].upper() == "LISTENING":
            subprocess.run(["taskkill", "/PID", p[4], "/T", "/F"], capture_output=True)
            print("Đã tắt ComfyUI để nhường VRAM (khởi động lại sau khi huấn luyện xong).", flush=True)
    try:
        for line in subprocess.run(["ollama", "ps"], capture_output=True, text=True, timeout=15).stdout.splitlines()[1:]:
            if line.split(): subprocess.run(["ollama", "stop", line.split()[0]], capture_output=True, timeout=30)
    except Exception:
        pass


def train(total: int, n_img: int):
    sd = Path(LEARN["sd_scripts"]); py = Path(LEARN["venv"]) / "Scripts" / "python.exe"
    rank = int(LEARN.get("rank", 16)); every = max(25, int(LEARN.get("save_every", 25)) * 4)
    OUT.mkdir(parents=True, exist_ok=True)
    for x in OUT.iterdir(): shutil.rmtree(x, ignore_errors=True) if x.is_dir() else x.unlink(missing_ok=True)
    toml = ROOT / "dataset.toml"
    toml.write_text(f"""[general]
caption_extension = ".txt"
shuffle_caption = false
keep_tokens = 1

[[datasets]]
resolution = {int(LEARN.get("resolution", 512))}
batch_size = 1
enable_bucket = true

  [[datasets.subsets]]
  image_dir = '{DS.as_posix()}'
  num_repeats = 4
""", encoding="utf-8")
    cmd = [str(py), "-u", str(AIFILM / "tools" / "kohya_launch.py"), str(sd), "flux_train_network.py",
           f"--pretrained_model_name_or_path={LEARN['flux']}", f"--clip_l={LEARN['clip_l']}", f"--t5xxl={LEARN['t5']}", f"--ae={LEARN['ae']}",
           f"--dataset_config={toml}", f"--output_dir={OUT}", f"--output_name={NAME}", "--save_model_as=safetensors",
           "--network_module=networks.lora_flux", f"--network_dim={rank}", f"--network_alpha={rank}", "--network_train_unet_only",
           f"--learning_rate={LEARN.get('lr', 1e-4)}", "--optimizer_type=AdamW8bit", "--lr_scheduler=constant",
           "--sdpa", "--mixed_precision=bf16", "--save_precision=bf16", "--gradient_checkpointing", "--fp8_base",
           f"--blocks_to_swap={int(LEARN.get('blocks_to_swap', 18))}",
           "--guidance_scale=1.0", "--timestep_sampling=flux_shift", "--model_prediction_type=raw",
           "--cache_latents", "--cache_latents_to_disk", "--cache_text_encoder_outputs", "--cache_text_encoder_outputs_to_disk",
           "--max_data_loader_n_workers=0", "--seed=42",
           f"--max_train_steps={total}", f"--save_every_n_steps={every}", f"--save_last_n_steps={every}",
           "--save_state", f"--save_last_n_steps_state={every}"]  # lưu trạng thái để có thể học tiếp (--resume) nếu LoRA còn non
    log = (ROOT / "train.log").open("w", encoding="utf-8")
    print(f"Huấn luyện LoRA {NAME} · {n_img} ảnh · {total} bước · rank {rank} · từ khoá {TRIG}", flush=True)
    free_vram(); time.sleep(2)
    t0 = time.time()
    proc = subprocess.Popen(cmd, cwd=str(sd), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    pat = re.compile(r"steps:\s*\d+%.*?\|\s*(\d+)/(\d+)\s*\[([^\]]*)\]")
    buf = b""; last = -1
    while True:
        ch = proc.stdout.read(1)
        if not ch: break
        if ch not in (b"\r", b"\n"): buf += ch; continue
        line = buf.decode("utf-8", "replace").strip(); buf = b""
        if not line: continue
        m = pat.search(line)
        if m:
            done = int(m.group(1))
            if done != last and (done in (1, 5, 10) or done % 25 == 0 or done == total):
                msg = f"##PROGRESS {done}/{total} · {m.group(3)} · {(time.time() - t0) / 60:.1f} phút"
                print(msg, flush=True); log.write(msg + "\n"); log.flush()
            last = done
        elif "steps:" not in line:
            log.write(line[:300] + "\n"); log.flush()
            if re.search(r"(?i)caching latents|caching text encoder|running training|error|Traceback", line): print(line[:200], flush=True)
    proc.wait()
    final = OUT / f"{NAME}.safetensors"
    if proc.returncode != 0 or not final.exists():
        print(f"LỖI huấn luyện (mã {proc.returncode}). Xem {ROOT / 'train.log'}", flush=True); sys.exit(1)
    dst = Path(LEARN["lora_dir"]) / f"{NAME}.safetensors"
    shutil.copyfile(final, dst)
    print(f"##DONE {dst} · {(time.time() - t0) / 60:.0f} phút", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--steps", type=int, default=800)  # ~14 s/bước trên RTX 3060 khi ComfyUI đã tắt → 800 bước ≈ 3h10
    ap.add_argument("--dataset-only", action="store_true")
    a = ap.parse_args()
    ROOT.mkdir(parents=True, exist_ok=True)
    n = build_dataset()
    print(f"Bộ ảnh: {n} ảnh + caption ở {DS} · bảng xem thử {ROOT / 'dataset_sheet.png'}", flush=True)
    if a.dataset_only: return
    train(a.steps, n)


if __name__ == "__main__":
    main()
