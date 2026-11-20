import sys, pathlib
from PIL import Image
from rembg import remove, new_session

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
session = new_session("u2net_human_seg")
for photo in sorted(src.glob("p*.jpg")):
    image = Image.open(photo).convert("RGB")
    cut = remove(image, session=session)
    cut.save(out / (photo.stem + ".png"))
    print(photo.stem, image.size, cut.getbbox())
