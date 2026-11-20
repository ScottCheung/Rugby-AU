"""Keep the main figure, frame it head-to-waist, save a uniform PNG."""
import sys, pathlib
from collections import deque
from PIL import Image

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
names = {}
keep_x = {}  # optional: keep only this horizontal share of the figure, "0:0.45"
for arg in sys.argv[3:]:
    stem, value = arg.split("=")
    name, _, share = value.partition("@")
    names[stem] = name
    if share:
        keep_x[stem] = tuple(float(v) for v in share.split(":"))
out.mkdir(parents=True, exist_ok=True)

def largest_blob(alpha, scale=4):
    """Bounding mask of the largest connected opaque region (on a small copy)."""
    small = alpha.resize((alpha.width // scale, alpha.height // scale))
    w, h = small.size
    px = small.load()
    seen = [[False] * w for _ in range(h)]
    best = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or px[x, y] < 128:
                continue
            blob, queue = [], deque([(x, y)])
            seen[y][x] = True
            while queue:
                cx, cy = queue.popleft()
                blob.append((cx, cy))
                for nx, ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and px[nx, ny] >= 128:
                        seen[ny][nx] = True
                        queue.append((nx, ny))
            if len(blob) > len(best):
                best = blob
    keep = Image.new("L", (w, h), 0)
    kp = keep.load()
    for x, y in best:
        kp[x, y] = 255
    # Grow slightly so soft edges of the kept figure survive.
    from PIL import ImageFilter
    keep = keep.filter(ImageFilter.MaxFilter(5)).resize(alpha.size)
    return keep

for f in sorted(src.glob("p*.png")):
    name = names.get(f.stem)
    if not name:
        continue
    im = Image.open(f).convert("RGBA")
    if f.stem in keep_x:
        l, t, r_, b_ = im.getbbox()
        lo, hi = keep_x[f.stem]
        im = im.crop((l + int((r_ - l) * lo), t, l + int((r_ - l) * hi), b_))
    r, g, b, a = im.split()
    keep = largest_blob(a)
    a = Image.composite(a, Image.new("L", a.size, 0), keep)
    im = Image.merge("RGBA", (r, g, b, a))
    left, top, right, bottom = im.getbbox()
    # Same framing for everyone: a tall figure is cut near the waist (60% of
    # its height), a wide pose at a height equal to its width.
    full = bottom - top
    height = min(full, max(right - left, int(full * 0.6)))
    im = im.crop((left, top, right, top + height))
    im.thumbnail((900, 1100))
    im.save(out / f"{name}.png", optimize=True)
    print(name, im.size)
