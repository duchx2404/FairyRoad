"""Pháp Thiên Tượng Địa: người dùng đứng trên đỉnh núi, phía sau là bản sao khổng lồ của chính mình
   chỉ gồm các NÉT sáng + tia sét (rỗng, nhìn xuyên thấy trời núi), mặt chỉ gợi bằng vài nét, cự nhân mặc giáp chiến thời xưa.
   Màu nét theo hệ chủ đạo của công pháp (hệ đầu); vô hệ = trắng bạc.
   Cách làm: vẽ 2 ảnh gốc (nam / nữ chính, LoRA) nét vàng kim → lọc chỉ giữ nét mảnh, làm mờ phần tô đầy → đổi màu nét → 22 ảnh.
   python tools/gen_pttd.py [--redraw base_m,base_f]"""
import argparse, io, json, random, time, urllib.parse, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from gen_items import OUT, COMFY, post, get
from gen_art import graph, LORA_MALE, LORA_FEMALE, LORA_DETAIL, NEG

CACHE = Path(__file__).resolve().parent / 'pttd_cache'
SIZE = 640

BASE = ('Hyper-detailed semi-realistic digital painting, {trig}, {who} standing on a rocky mountain peak, full body, three-quarter view, '
        'holding a sword, clearly in the foreground, sharply rendered. Behind {pr} floats a giant copy of {pr}self about twice as tall, in the same pose, '
        'the giant is {gender} with the same hairstyle as {pr}, standing directly BEHIND {pr}, centered, towering about twice {pr} height, '
        'but the giant is NOT a solid figure: it is a hollow wireframe made purely of thin glowing golden neon light lines and crackling golden lightning filaments, '
        'like a light sketch drawn in the air, only its outline and a few inner contour lines, NO filled surfaces, NO shading, NO rendered skin, NO rendered face: '
        'the face of the giant is only suggested by three or four glowing strokes (brow, nose, jaw), the sky and mountains fully visible through every part of it. '
        'The wireframe shows the giant wearing ancient Chinese general battle armor ({armor}): no helmet, beast-head pauldrons, lamellar chest plate, armored skirt, greaves and a flowing war cape, all as thin golden outline lines. '
        'Golden sparks floating in the air. Cold blue-grey overcast dusk sky with dark clouds, no sunset, the golden lines are the only warm light in the image, cinematic light, ' + NEG)
WHO = {
  # khoá: (trigger LoRA, mô tả người thật, đại từ, giới của cự nhân, kiểu giáp, LoRA)
  'm': ('aif181817m, a man', 'a young man with long black hair in a high topknot with a small gold crown, wearing a black silk robe with gold dragon embroidery', 'him', 'a MAN, a giant copy of this same young man', 'male general armor', LORA_MALE),
  'f': ('aif181817f, a woman', 'a young woman with long dark hair in an elegant high updo, wearing a white silk hanfu with gold trim', 'her', 'a WOMAN, a giant copy of this same young woman, female figure with the same high updo hair', 'female general armor fitted to a woman', LORA_FEMALE),
}
# màu hệ: (hue 0..360, độ bão hoà 0..1); None = trắng bạc (vô hệ)
HUE = {
  'kim': (45, 0.85), 'moc': (135, 0.8), 'thuy': (212, 0.9), 'hoa': (18, 0.95), 'tho': (32, 0.7),
  'bang': (195, 0.55), 'loi': (258, 0.95), 'phong': (165, 0.65), 'am': (268, 1.0), 'quang': (52, 0.35),
  'none': None,
}

def render(prompt, loras, dest):
    pid = post('/prompt', {'prompt': graph(prompt, random.randint(1, 2**31), loras, SIZE)})['prompt_id']
    while True:
        time.sleep(2)
        h = get('/history/' + pid)
        if pid in h:
            st = h[pid].get('status', {})
            if st.get('status_str') == 'error': raise RuntimeError(str(st)[:300])
            imgs = [i for n in h[pid]['outputs'].values() for i in n.get('images', [])]
            if imgs: break
    im = imgs[0]
    q = urllib.parse.urlencode({'filename': im['filename'], 'subfolder': im['subfolder'], 'type': im['type']})
    Image.open(io.BytesIO(urllib.request.urlopen(COMFY + '/view?' + q, timeout=60).read())).convert('RGB').save(dest)
    try: (Path('E:/ComfyUI_windows_portable/ComfyUI/output') / im['subfolder'] / im['filename']).unlink()
    except OSError: pass

def blur(arr: np.ndarray, r: float) -> np.ndarray:
    """Làm mờ Gauss một mảng float (1 hoặc 3 kênh, 0..1)."""
    if arr.ndim == 2:
        return np.asarray(Image.fromarray((arr * 255).clip(0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255
    return np.stack([blur(arr[..., i], r) for i in range(arr.shape[-1])], -1)

def lineify(img: Image.Image, target) -> Image.Image:
    """Trong vùng cự nhân vàng kim: chỉ giữ các nét sáng mảnh (đổi sang màu đích), phần tô đầy (mặt, giáp) trả về nền mờ."""
    orig = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    hsv = np.asarray(img.convert('HSV')).astype(np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    # vùng cự nhân: sắc vàng cam, đủ sáng, đủ bão hoà
    hue_w = np.clip(1 - np.abs(h - 45) / 30, 0, 1)
    g = np.clip(hue_w * np.clip((v - 0.35) / 0.25, 0, 1) * np.clip((s - 0.06) / 0.14, 0, 1) * 1.3, 0, 1)
    # nét = chỗ sáng hơn hẳn vùng quanh (lọc cao tần); phần còn lại là tô đầy
    line = np.clip((v - blur(v, 3)) / 0.08, 0, 1) * g
    fill = g * (1 - line)
    # nền ước lượng sau lưng cự nhân: trung bình các điểm không thuộc cự nhân quanh đó
    w = 1 - g
    bg = blur(orig * w[..., None], 14) / np.maximum(blur(w, 14), 1e-3)[..., None]
    # màu đích cho nét
    if target is None:
        nh, ns = h, s * 0.08
    else:
        nh, ns = np.full_like(h, target[0]), np.full_like(s, target[1] * 0.85)
    vcap = 0.97 if target is None or target[0] < 200 else 0.85  # màu lam/tím: hạ sáng để không ngả hồng
    col = np.stack([nh * 255 / 360, ns * 255, np.minimum(v, vcap) * 255], -1).clip(0, 255).astype(np.uint8)
    col = np.asarray(Image.fromarray(col, 'HSV').convert('RGB')).astype(np.float32) / 255
    # ghép: ngoài cự nhân giữ nguyên; nét = màu đích; tô đầy = nền + chút ánh màu (0.22) để còn cảm giác linh lực
    haze = 0.22
    out = orig * (1 - g)[..., None] + col * line[..., None] + (bg * (1 - haze) + col * haze) * fill[..., None]
    # quầng sáng nhẹ quanh nét
    out = np.clip(out + blur(col * line[..., None], 6) * 0.35, 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8), 'RGB')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--redraw', default='')
    a = ap.parse_args()
    CACHE.mkdir(exist_ok=True)
    redo = set(filter(None, a.redraw.split(',')))
    for g, (trig, who, pr, gender, armor, lora) in WHO.items():
        dest = CACHE / f'base_{g}.png'
        if dest.exists() and f'base_{g}' not in redo: continue
        t0 = time.time()
        render(BASE.format(trig=trig, who=who, pr=pr, gender=gender, armor=armor), [(lora[0], 0.85), (LORA_DETAIL[0], 0.4)], dest)
        print(f'vẽ base_{g} {time.time() - t0:.0f}s', flush=True)
    for g in WHO:
        base = Image.open(CACHE / f'base_{g}.png').convert('RGB')
        for e, t in HUE.items():
            lineify(base, t).resize((256, 256), Image.LANCZOS).save(OUT / f'pttd_{g}_{e}.webp', 'WEBP', quality=88)
    (OUT / 'manifest.json').write_text(json.dumps(sorted(p.stem for p in OUT.glob('*.webp'))), encoding='utf-8')
    print('ghép xong 22 ảnh pttd_*', flush=True)

if __name__ == '__main__':
    main()
