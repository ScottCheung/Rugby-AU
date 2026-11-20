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
fallback = new_session("isnet-general-use")
faces = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
W, H = 480, 640
SCALE = 3.6  # frame height in face heights

def largest_blob(alpha):
    n, labels, stats, _ = cv2.connectedComponentsWithStats((alpha > 128).astype(np.uint8))
    if n <= 1: return alpha
    keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = cv2.dilate((labels == keep).astype(np.uint8), np.ones((9, 9), np.uint8))
    return (alpha * mask).astype(np.uint8)

def body_cover(alpha):
    """How much of the middle of the photo (where the chest is) is kept."""
    h, w = alpha.shape
    return (alpha[int(h * 0.55):int(h * 0.95), int(w * 0.35):int(w * 0.65)] > 128).mean()

def fill_holes(alpha, below):
    """Fill holes inside the figure below the chin (a ball held to the chest
    can be cut away). Behind the card the same photo shows there anyway."""
    outside = (alpha <= 128).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(outside)
    h, w = alpha.shape
    alpha = alpha.copy()
    for i in range(1, n):
        x, y, bw, bh = stats[i, :4]
        enclosed = x > 0 and y > 0 and x + bw < w and y + bh < h
        if enclosed and y > below:
            alpha[labels == i] = 255
    return alpha

def clean_edges(rgb, alpha):
    """Tighten and soften a cut-out's edge, and take the backdrop's colour out
    of what is left: semi-transparent edge pixels get the colour of the solid
    figure next to them, so no green or orange fringe shows on a new
    background. Sizes scale with the photo (about 1px on a 384px headshot)."""
    k = max(1, round(min(alpha.shape) / 450))
    alpha = cv2.erode(alpha, np.ones((2 * k + 1,) * 2, np.uint8))
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.5 * k)
    solid = (alpha > 240).astype(np.float32)
    size = (6 * k + 1,) * 2
    total = cv2.blur(rgb.astype(np.float32) * solid[..., None], size)
    weight = cv2.blur(solid, size)[..., None]
    inside = np.where(weight > 0.02, total / np.maximum(weight, 1e-3), rgb)
    rgb = np.where((alpha < 250)[..., None], inside, rgb).astype(np.uint8)
    return rgb, alpha

def drop_backdrop_bits(rgb, alpha, below):
    """Remove bits of backdrop the cut-out kept beside the head (lettering on
    a busy backdrop): pixels near the edge that match one of the backdrop's
    main colours, above `below` (the chin), so a collar in the same colour
    is kept."""
    behind = rgb[alpha < 10].reshape(-1, 3).astype(np.float32)
    if len(behind) < 500:
        return alpha
    _, _, colours = cv2.kmeans(behind[:: max(1, len(behind) // 20000)], 3, None,
                               (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1), 3,
                               cv2.KMEANS_PP_CENTERS)
    # Only strong colours no skin or hair has (a branded backdrop's green):
    # white, grey, orange and dark backdrops look too much like skin, hair
    # and teeth. (clean_edges already takes any fringe colour out.)
    hsv = cv2.cvtColor(colours.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_RGB2HSV)[0]
    colours = colours[(hsv[:, 1] > 90) & (hsv[:, 2] > 40) & (hsv[:, 0] > 35) & (hsv[:, 0] < 150)]
    if not len(colours):
        return alpha
    k = max(1, round(min(alpha.shape) / 450))
    near_edge = cv2.erode((alpha > 128).astype(np.uint8), np.ones((12 * k + 1,) * 2, np.uint8)) == 0
    distance = np.min(np.linalg.norm(rgb[..., None, :].astype(np.float32) - colours, axis=-1), axis=-1)
    drop = (near_edge & (distance < 40) & (alpha > 0)).astype(np.uint8)
    drop[int(below):] = 0
    # Patches, not single pixels: those are just edge pixels of the figure.
    drop = cv2.morphologyEx(drop, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(drop)
    alpha = alpha.copy()
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= 6 * k * k:
            alpha[labels == i] = 0
    return largest_blob(alpha)

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
        # The person model sometimes drops a jersey the colour of the
        # backdrop, or a ball held in front: if the middle of the body is
        # missing, try the general model and keep whichever covers more.
        if body_cover(alpha) < 0.9:
            other = np.array(remove(Image.fromarray(rgb), session=fallback, post_process_mask=True))[..., 3]
            if body_cover(other) > body_cover(alpha):
                alpha = other
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
    # The figure's own colours for the cut-out; a club's ready-made cut-out
    # (has_alpha) is already clean.
    figure = rgb
    if not has_alpha:
        alpha = drop_backdrop_bits(rgb, alpha, below=fy + fh * 1.15)
        alpha = fill_holes(alpha, below=fy + fh * 1.15)
        figure, alpha = clean_edges(rgb, alpha)
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
    src = cv2.copyMakeBorder(figure, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
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
