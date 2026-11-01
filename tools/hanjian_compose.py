"""Ghép kiếm rút (hj_drawn) + bao rỗng (hj_scabbard) [+ kiếm trong bao (hj_sheathed) nếu có] thành 1 ảnh song song.
Bao được co sao cho dài = lưỡi + 1 đốt ngón tay (4% lưỡi)."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

D = Path('D:/AI/learn/tienlo_hanjian')
BG = (210, 213, 213)
FINGER = 0.085  # 1 đốt ngón tay ≈ 2,7 cm, đo theo chuôi một bàn tay ≈ 9 cm


def upright(path, top_is_dark=True, thr=28, signed=False):
    """Xoay vật dài về thẳng đứng, cắt sát. Trả về (ảnh RGB nền xám, mặt nạ bool)."""
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(float)
    bg = np.median(a[:40].reshape(-1, 3), 0)
    def mk(arr, ref):
        if not signed: return np.abs(arr - ref).max(2) > thr
        d = arr.mean(2) - np.mean(ref)
        mm = (d > 10) | (d < -60)  # sáng hơn nền (lưỡi) hoặc tối hẳn (chuôi); bóng mờ bị loại
        im_ = Image.fromarray((mm * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
        return np.asarray(im_) > 127
    m = mk(a, bg)
    ys, xs = np.nonzero(m)
    pts = np.stack([xs, ys], 1).astype(float)
    c = pts.mean(0)
    _, _, vt = np.linalg.svd(pts - c, full_matrices=False)
    ax = vt[0]
    ang = np.degrees(np.arctan2(ax[1], ax[0]))  # góc trục so với ngang
    rot = ang - 90  # xoay sao cho trục thẳng đứng
    im2 = im.rotate(rot, resample=Image.BICUBIC, expand=True, fillcolor=BG)
    a2 = np.asarray(im2).astype(float)
    m2 = mk(a2, np.array(BG, float))
    ys, xs = np.nonzero(m2)
    box = (max(0, xs.min() - 6), max(0, ys.min() - 6), min(im2.width, xs.max() + 7), min(im2.height, ys.max() + 7))
    im2 = im2.crop(box); m2 = m2[box[1]:box[3], box[0]:box[2]]
    # nền về đúng BG: giữ vật (mặt nạ nới 2px, mép mềm), ngoài vật tô BG
    soft = Image.fromarray((m2 * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))  # không nới, không giữ bóng
    im2 = Image.composite(im2, Image.new('RGB', im2.size, BG), soft)
    # đầu nào tối (chuôi/đốc) phải ở trên
    a3 = np.asarray(im2).astype(float).mean(2)
    h = a3.shape[0]
    top_dark = (a3[: h // 5][m2[: h // 5]] < 90).mean()
    bot_dark = (a3[-h // 5:][m2[-h // 5:]] < 90).mean()
    if top_is_dark is None:  # bao: đầu cắt vuông (rộng) lên trên, đầu nhọn xuống dưới
        wtop = m2[:12].sum(1).max(); wbot = m2[-12:].sum(1).max()
        flip = wbot > wtop
    else:
        flip = (bot_dark > top_dark) == top_is_dark
    if flip:
        im2 = im2.rotate(180, expand=True, fillcolor=BG); m2 = m2[::-1, ::-1]
    return im2, m2


def straighten(im, m):
    """Nắn thẳng: tâm mỗi hàng khớp đường thẳng; dịch ngang từng hàng để tâm nằm đúng trên đường."""
    H, W = m.shape
    ys = np.array([y for y in range(H) if m[y].any()])
    cx = np.array([np.nonzero(m[y])[0].mean() for y in ys])
    a, b = np.polyfit(ys, cx, 1)
    resid = cx - (a * ys + b)
    sm = np.convolve(resid, np.ones(31) / 31, 'same')  # lọc nhiễu
    print(f'  độ cong tối đa {np.abs(sm).max():.1f}px / {H}px')
    arr = np.asarray(im).copy(); mm = m.copy()
    shift = dict(zip(ys, -sm))
    for y in range(H):
        d = int(round(shift.get(y, 0)))
        if d: arr[y] = np.roll(arr[y], d, 0); mm[y] = np.roll(mm[y], d)
    return Image.fromarray(arr), mm


def rectify(im, m):
    """Kéo thân bao thành hình chữ nhật thẳng đứng: khớp 2 mép thân (bỏ hàng có khoen) thành 2 đường thẳng → biến đổi phối cảnh."""
    H, W = m.shape
    L = np.array([np.nonzero(m[y])[0].min() if m[y].any() else -1 for y in range(H)])
    R = np.array([np.nonzero(m[y])[0].max() if m[y].any() else -1 for y in range(H)])
    w = R - L
    ok = (L >= 0)
    med = np.median(w[ok])
    body = ok & (np.abs(w - med) < med * 0.08)  # hàng thân (không khoen, không đầu)
    ys = np.nonzero(body)[0]
    aL, bL = np.polyfit(ys, L[ys], 1); aR, bR = np.polyfit(ys, R[ys], 1)
    y0, y1 = ys.min(), ys.max()
    print(f'  mép trái nghiêng {np.degrees(np.arctan(aL)):.2f}°, mép phải {np.degrees(np.arctan(aR)):.2f}°')
    # quad nguồn (TL,BL,BR,TR) theo 2 đường mép kéo dài tới toàn ảnh, đích: hình chữ nhật đứng
    xl0, xl1 = aL * 0 + bL, aL * H + bL
    xr0, xr1 = aR * 0 + bR, aR * H + bR
    XL, XR = np.mean([xl0, xl1]), np.mean([xr0, xr1])
    quad = (xl0, 0, xl1, H, xr1, H, xr0, 0)
    # ánh xạ đích→nguồn: PIL QUAD nhận quad nguồn tương ứng 4 góc ảnh đích; giữ kích thước ảnh, cột XL..XR
    sx = (XR - XL) / W
    # dựng quad nguồn cho toàn ảnh đích rộng W: mở rộng tuyến tính ra ngoài 2 mép
    def srcx(y, X):  # x nguồn ứng với x đích X ở hàng y
        t = (X - XL) / (XR - XL)
        return (aL * y + bL) + t * ((aR * y + bR) - (aL * y + bL))
    q = (srcx(0, 0), 0, srcx(H, 0), H, srcx(H, W), H, srcx(0, W), 0)
    im2 = im.transform((W, H), Image.QUAD, q, Image.BICUBIC, fillcolor=BG)
    mk = Image.fromarray((m * 255).astype(np.uint8)).transform((W, H), Image.QUAD, q, Image.NEAREST, fillcolor=0)
    return im2, np.asarray(mk) > 127


def extrude_body(im, m):
    """Bao thẳng tuyệt đối: giữ nguyên các cụm có hoa văn (khoen miệng, khoen giữa, đầu bao) đã căn mép,
    mọi hàng thân trơn thay bằng một hàng mẫu kéo dài. Nền toàn ảnh về BG."""
    H, W = m.shape
    arr = np.asarray(im).copy(); arr[~m] = BG
    g = arr.astype(float).mean(2)
    L = np.array([np.nonzero(m[y])[0].min() if m[y].any() else -1 for y in range(H)])
    R = np.array([np.nonzero(m[y])[0].max() if m[y].any() else -1 for y in range(H)])
    ok = L >= 0; w = R - L; med = np.median(w[ok])
    # độ hoa văn: lệch chuẩn sáng tối trong hàng (chỉ phần vật), làm mượt 9 hàng
    sd = np.array([g[y][m[y]].std() if m[y].any() else 0 for y in range(H)])
    sd = np.convolve(sd, np.ones(9) / 9, 'same')
    plain = ok & (sd < np.median(sd[ok]) * 1.25) & (np.abs(w - med) < med * 0.08)
    y0, y1 = np.nonzero(ok)[0].min(), np.nonzero(ok)[0].max()
    # cụm giữ = chuỗi hàng không-trơn dài >= 15
    keep = np.zeros(H, bool); runs = []; start = None
    for y in range(y0, y1 + 2):
        nb = (y <= y1) and not plain[y]
        if nb: start = y if start is None else start
        elif start is not None:
            if y - start >= 15: keep[start:y] = True; runs.append((start, y))
            start = None
    XL = int(round(np.median(L[plain]))); XR = int(round(np.median(R[plain])))
    # hàng mẫu: trung bình 9 hàng trơn ở 1/3 trên, co về bề rộng XL..XR
    pys = np.nonzero(plain)[0]; yref = pys[len(pys) // 3]
    prof = np.stack([np.asarray(Image.fromarray(arr[y, L[y] : R[y] + 1][None]).resize((XR - XL + 1, 1), Image.LANCZOS))[0]
                     for y in range(yref - 4, yref + 5)]).mean(0).round().astype(np.uint8)
    mm = m.copy()
    for ra, rb in runs:  # căn mép trái cụm giữ về XL (mép trái không có khoen nhô)
        dx = int(round(XL - np.median([L[y] for y in range(ra, rb) if L[y] >= 0])))
        if dx:
            arr[ra:rb] = np.roll(arr[ra:rb], dx, 1); mm[ra:rb] = np.roll(mm[ra:rb], dx, 1)
    n = 0
    for y in range(y0, y1 + 1):
        if keep[y]: continue
        arr[y] = BG; mm[y] = False
        arr[y, XL : XR + 1] = prof; mm[y, XL : XR + 1] = True; n += 1
    print(f'  cụm giữ nguyên (hàng đầu, số hàng): {[(ra, rb - ra) for ra, rb in runs]} · thân kéo thẳng {n} hàng, cột {XL}..{XR}')
    out = Image.fromarray(arr); out.save(D / 'hj_scabbard_straight.png')
    return out, mm


def guard_tilt(im, m, bs):
    """Góc nghiêng (độ) của 2 cạnh bên hộ thủ so với phương thẳng đứng; dương = đỉnh lệch phải."""
    rows = range(bs - 62, bs - 6)
    L = np.array([np.nonzero(m[y])[0].min() for y in rows]); R = np.array([np.nonzero(m[y])[0].max() for y in rows])
    ys = np.array(list(rows))
    aL = np.polyfit(ys, L, 1)[0]; aR = np.polyfit(ys, R, 1)[0]
    return np.degrees(np.arctan((aL + aR) / 2))


def level_guard(im, m):
    """Xoay cả thanh kiếm để cạnh bên hộ thủ thẳng đứng."""
    bs = blade_start(im, m)
    t = guard_tilt(im, m, bs)
    print(f'  hộ thủ nghiêng {t:.2f}° → xoay bù')
    im2 = im.rotate(-t, resample=Image.BICUBIC, expand=True, fillcolor=BG)
    m2 = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).rotate(-t, resample=Image.NEAREST, expand=True, fillcolor=0)) > 127
    ys, xs = np.nonzero(m2)
    box = (max(0, xs.min() - 6), max(0, ys.min() - 6), min(im2.width, xs.max() + 7), min(im2.height, ys.max() + 7))
    im2 = im2.crop(box); m2 = m2[box[1]:box[3], box[0]:box[2]]
    bs2 = blade_start(im2, m2)
    print(f'  sau xoay: hộ thủ nghiêng {guard_tilt(im2, m2, bs2):.2f}°')
    return im2, m2


def shorten_body(im, m, target):
    """Rút ngắn bao về đúng target hàng bằng cách bỏ một đoạn thân trơn (bề rộng = trung vị, ít hoa văn) ở nửa dưới."""
    H, W = m.shape
    cut = im.height - target
    if cut <= 0:
        print(f'  bao {im.height}px đã ngắn hơn/bằng mục tiêu {target}px, giữ nguyên'); return im
    g = np.asarray(im).astype(float).mean(2)
    w = m.sum(1); med = np.median(w[w > 0])
    sd = np.array([g[y][m[y]].std() if m[y].any() else 99 for y in range(H)])
    plain = (np.abs(w - med) <= 5) & (sd < np.median(sd[w > 0]) * 1.3)
    print('  hàng không trơn (khoen/hoa văn):', [y for y in range(0, H, 10) if not plain[y]])
    # cửa sổ thân trơn cố định giữa hoa văn giữa và đầu bao (đo từ ảnh pair_2)
    w0, w1 = 320, 590
    bad = [y for y in range(w0, w1) if abs(w[y] - med) > 5]
    if bad: raise SystemExit(f'cửa sổ {w0}..{w1} có {len(bad)} hàng không trơn: {bad[:10]}')
    if w1 - w0 < cut + 10: raise SystemExit(f'cửa sổ chỉ {w1 - w0}px, cần {cut}px')
    arr = np.asarray(im); keep = np.ones(H, bool)
    c0 = (w0 + w1) // 2 - cut // 2; keep[c0 : c0 + cut] = False; info = [(c0, cut)]
    out = arr[keep]
    print(f'  bao {im.height}px → {out.shape[0]}px: bỏ các đoạn thân trơn (hàng đầu, số hàng) {info}')
    return Image.fromarray(out)


def trim_rim(im, m, lim=100):
    """Hàng tối: chỉ giữ lõi tối (pixel đầu..cuối có độ sáng < lim); viền sáng hai bên tô nền."""
    arr = np.asarray(im).copy(); mm = m.copy(); g = arr.astype(float).mean(2)
    n = 0
    for y in range(mm.shape[0]):
        xs = np.nonzero(mm[y])[0]
        if len(xs) < 8 or (g[y][mm[y]] < 90).mean() < 0.5: continue
        dark = np.nonzero(mm[y] & (g[y] < lim))[0]
        if len(dark) == 0: continue
        core = np.zeros_like(mm[y]); core[dark.min() : dark.max() + 1] = True
        out = mm[y] & ~core
        n += out.sum(); arr[y][out] = BG; mm[y] &= core
    print(f'  bỏ viền sáng: {n} pixel')
    return Image.fromarray(arr), mm


def blade_start(im, m):
    """Hàng đầu tiên của lưỡi (dưới hộ thủ): hàng sáng đầu tiên sau cụm hàng tối ở trên."""
    g = np.asarray(im).astype(float).mean(2)
    rows = []
    for y in range(g.shape[0]):
        sel = m[y]
        rows.append((g[y][sel] < 90).mean() if sel.any() else 1.0)
    rows = np.array(rows)
    # tìm điểm chuyển từ tối (>0.6) sang sáng (<0.4) lần đầu
    dark = True
    for y in range(len(rows)):
        if dark and rows[y] < 0.4 and rows[y : y + 60].mean() < 0.35 and rows[y : y + 60].max() < 0.6:
            return y
    return 0


def main():
    sword, ms = upright(D / 'hj_sword_p2.png', signed=True)
    sword, ms = trim_rim(sword, ms)
    scab, mc = upright(D / 'hj_scabbard_p2.png', top_is_dark=None, thr=70)
    scab, mc = trim_rim(scab, mc)
    bs = blade_start(sword, ms)
    blade_len = sword.height - bs
    target = blade_len * (1 + FINGER)
    scab = shorten_body(scab, mc, round(target))
    parts = [(sword, bs), (scab, 0)]
    # kiếm trong bao = chuôi + hộ thủ (ảnh 1, tới đáy hộ thủ) đặt sát miệng bao (ảnh 2)
    g = np.asarray(sword).astype(float).mean(2)
    darkfrac = np.array([(g[y][ms[y]] < 90).mean() if ms[y].any() else 0 for y in range(bs + 2)])
    gb = max(y for y in range(bs + 2) if darkfrac[y] > 0.5) + 1  # đáy hộ thủ (không vượt quá đầu lưỡi)
    gb -= 2  # bỏ viền sáng đáy hộ thủ
    hilt = sword.crop((0, 0, sword.width, gb))
    hm = ms[:gb].copy()
    gr = [y for y in range(20, gb) if hm[y].any()]  # trục chung chuôi + hộ thủ
    hc = np.median([(np.nonzero(hm[y])[0].min() + np.nonzero(hm[y])[0].max()) / 2 for y in gr])
    print(f'  trục chuôi+hộ thủ x={hc:.1f}')
    scm = np.abs(np.asarray(scab).astype(float) - np.array(BG)).max(2) > 28
    Ls = np.array([np.nonzero(scm[y])[0].min() if scm[y].any() else -1 for y in range(scab.height)])
    Rs = np.array([np.nonzero(scm[y])[0].max() if scm[y].any() else -1 for y in range(scab.height)])
    ws = Rs - Ls; okr = (Ls >= 0) & (np.abs(ws - np.median(ws[Ls >= 0])) < np.median(ws[Ls >= 0]) * 0.08)
    scc = np.median((Ls[okr] + Rs[okr]) / 2)  # tâm thân bao, bỏ hàng có khoen
    wmax = max(hilt.width, scab.width) + 20
    sg = np.asarray(scab).astype(float).mean(2)
    sdark = np.array([(sg[y][scm[y]] < 90).mean() if scm[y].any() else 0 for y in range(scab.height)])
    ov = next(y for y in range(scab.height) if scm[y].sum() > 10 and sg[y][scm[y]].mean() < 100) + 8  # khoen chui 8px dưới hộ thủ  # hộ thủ phủ hết nắp sáng ở miệng bao
    sh = Image.new('RGB', (wmax, gb - ov + scab.height), BG)
    cx = wmax // 2
    sh.paste(scab, (round(cx - scc), gb - ov))
    sh.paste(hilt, (round(cx - hc), 0), Image.fromarray((hm * 255).astype(np.uint8)))
    parts.append((sh, bs))
    print(f'đáy hộ thủ {gb}px, bắt đầu lưỡi {bs}px')
    gap = 60
    W = sum(p.width for p, _ in parts) + gap * (len(parts) + 1)
    H = round(bs + max(p.height - top for p, top in parts) + 80)
    out = Image.new('RGB', (W, H), BG)
    x = gap
    for p, top in parts:
        out.paste(p, (x, 40 + bs - top))
        x += p.width + gap
    out.save(D / 'hj_set.png')
    print(f'lưỡi {blade_len}px, chuôi+hộ thủ {bs}px, bao {scab.height}px, ảnh {out.size}')


main()
