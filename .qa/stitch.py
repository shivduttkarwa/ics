# Stitch the frames of `frames.mjs … page:<ms>` into one tall image, then cut it into columns on a sheet.
# Usage: python .qa/stitch.py <framesDir> <pageHeight> <out.png> [columns] [scale]
import glob
import sys
from PIL import Image

frames = sorted(glob.glob(sys.argv[1] + "/*.png"))
total = int(sys.argv[2])
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
first = Image.open(frames[0])
w, h = first.size
page = Image.new("RGB", (w, total))
for i, f in enumerate(frames):
    y = min(i * h, total - h)
    page.paste(Image.open(f).convert("RGB"), (0, max(y, 0)))
part = -(-total // cols)
sheet = Image.new("RGB", (int(w * scale) * cols + 10 * (cols - 1), int(part * scale)), "white")
for c in range(cols):
    piece = page.crop((0, c * part, w, min((c + 1) * part, total)))
    sheet.paste(piece.resize((int(w * scale), int(piece.size[1] * scale))), (c * (int(w * scale) + 10), 0))
sheet.save(sys.argv[3])
print(sheet.size)
