# Tile each slices/<tag>/*.png folder into one contact sheet: python sheets.py <walkDir> [cols] [scale]
import glob
import os
import sys
from PIL import Image

root = sys.argv[1]
cols_arg = int(sys.argv[2]) if len(sys.argv) > 2 else 0
scale_arg = float(sys.argv[3]) if len(sys.argv) > 3 else 0
out = os.path.join(root, "sheets")
os.makedirs(out, exist_ok=True)
for tag in sorted(os.listdir(os.path.join(root, "slices"))):
    frames = sorted(glob.glob(os.path.join(root, "slices", tag, "*.png")))
    if not frames:
        continue
    first = Image.open(frames[0])
    w, h = first.size
    scale = scale_arg or (0.6 if w <= 430 else 0.5 if w <= 700 else 0.4)
    cols = cols_arg or (5 if w <= 430 else 4 if w <= 800 else 3)
    tw, th = int(w * scale), int(h * scale)
    rows = (len(frames) + cols - 1) // cols
    gap = 6
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * gap, rows * th + (rows + 1) * gap), (40, 40, 40))
    for i, f in enumerate(frames):
        im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
        x = gap + (i % cols) * (tw + gap)
        y = gap + (i // cols) * (th + gap)
        sheet.paste(im, (x, y))
    sheet.save(os.path.join(out, tag + ".png"), optimize=True)
    print(tag, len(frames), "slices ->", sheet.size)
