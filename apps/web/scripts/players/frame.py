"""Cut out each official photo and frame it the same way (3:4, same head
position and scale), saving a matching background crop and cut-out."""
import sys, json, pathlib
import numpy as np, cv2
from PIL import Image
from rembg import remove, new_session

raw, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
only = set(sys.argv[3:])
out.mkdir(parents=True, exist_ok=True)
session = new_session("u2net_human_seg")
faces = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
W, H = 480, 640
SCALE = 3.6  # frame height in face heights

def largest_blob(alpha):
    n, labels, stats, _ = cv2.connectedComponentsWithStats((alpha > 128).astype(np.uint8))
    if n <= 1: return alpha
    keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = cv2.dilate((labels == keep).astype(np.uint8), np.ones((9, 9), np.uint8))
    return (alpha * mask).astype(np.uint8)

report = {}
for f in sorted(raw.iterdir()):
    if only and f.stem not in only: continue
    im = Image.open(f)
    rgba = im.convert("RGBA")
    if max(rgba.size) > 1800:
        rgba.thumbnail((1800, 1800), Image.LANCZOS)
    a = np.array(rgba)
    has_alpha = (a[..., 3] < 10).mean() > 0.2
    if has_alpha:
        alpha = a[..., 3]
        # Already a cut-out: the background is a deep shade of the jersey
        # (the lower half of the figure), darker towards the bottom.
        ys_, xs_ = np.nonzero(alpha > 200)
        body = a[ys_[ys_ > np.median(ys_)], xs_[ys_ > np.median(ys_)], :3].reshape(-1, 3)
        base = np.median(body, 0) * 0.72
        h_ = a.shape[0]
        ramp = np.linspace(1.15, 0.7, h_)[:, None, None]
        backdrop = np.clip(np.ones_like(a[..., :3], dtype=float) * base * ramp, 0, 255)
        m = (alpha[..., None] / 255.0)
        rgb = (a[..., :3] * m + backdrop * (1 - m)).astype(np.uint8)
        flat = backdrop.astype(np.uint8)
    else:
        rgb = a[..., :3]
        alpha = np.array(remove(Image.fromarray(rgb), session=session, post_process_mask=True))[..., 3]
    alpha = largest_blob(alpha)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    ys, xs = np.nonzero(alpha > 128)
    fig_top, fig_h = ys.min(), ys.max() - ys.min()
    # Strict first, then looser. A face must be near the top of the figure
    # (not a logo on the jersey).
    for scale, neighbours, smallest in ((1.08, 5, 12), (1.04, 3, 24)):
        found = faces.detectMultiScale(gray, scale, neighbours, minSize=(rgb.shape[1] // smallest,) * 2)
        fig_w = xs.max() - xs.min()
        found = [b for b in found if b[1] + b[3] / 2 < fig_top + 0.3 * fig_h
                 and alpha[int(b[1] + b[3] / 2), int(b[0] + b[2] / 2)] > 128
                 and b[2] > 0.15 * fig_w]  # not an eye or a badge
        if found:
            break
    if len(found):
        fx, fy, fw, fh = max(found, key=lambda b: b[2] * b[3])
        how = "face"
    else:  # fall back to the top of the figure
        top = ys.min(); head = xs[ys < top + rgb.shape[0] * 0.08]
        fw = fh = int((head.max() - head.min()) * 0.8) or rgb.shape[1] // 4
        fx = int(head.mean() - fw / 2); fy = int(top + fh * 0.45)
        how = "figure"
    fh_ = fh * SCALE
    fw_ = fh_ * 3 / 4
    left = fx + fw / 2 - fw_ / 2
    top = fy - 0.40 * fh - 0.06 * fh_
    # Keep a little space above the head.
    top = min(top, fig_top - 0.04 * fh_)
    if not has_alpha and abs(rgb.shape[0] / rgb.shape[1] - 4 / 3) < 0.02:
        # An official 3:4 headshot is already framed the same way for the
        # whole squad: use it as it is.
        left, top, fw_, fh_ = 0, 0, rgb.shape[1], rgb.shape[0]
        how = "as framed"
    box = [int(round(v)) for v in (left, top, left + fw_, top + fh_)]
    pad = max(0, -box[0], -box[1], box[2] - rgb.shape[1], box[3] - rgb.shape[0])
    # Behind the cut-out: the photo itself, or for a cut-out the backdrop.
    bg = cv2.copyMakeBorder(flat if has_alpha else rgb, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    src = cv2.copyMakeBorder(rgb, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    al = cv2.copyMakeBorder(alpha, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    l, t, r, b = (v + pad for v in box)
    bg_c = Image.fromarray(bg[t:b, l:r]).resize((W, H), Image.LANCZOS)
    cut = np.dstack([src[t:b, l:r], al[t:b, l:r]])
    cut_c = Image.fromarray(cut).resize((W, H), Image.LANCZOS)
    bg_c.save(out / f"{f.stem}-bg.webp", quality=80)
    cut_c.save(out / f"{f.stem}.webp", quality=85)
    report[f.stem] = {"how": how, "pad": pad}
    print(f.stem, how, pad, flush=True)
json.dump(report, open(out / "report.json", "w"), indent=1)
