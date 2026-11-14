# Per-frame sharpness (mean edge contrast) and change (mean abs diff to the previous frame) inside each region of a shiver.mjs run.
# Usage: python .qa/shiver.py <framesDir>
# Shiver shows as change that goes on after the region has stopped moving, and sharpness that sits below its final value.
import glob
import json
import os
import sys
from PIL import Image, ImageChops, ImageFilter, ImageStat

d = sys.argv[1]
regions = json.load(open(os.path.join(d, "regions.json")))
files = sorted(glob.glob(os.path.join(d, "*.png")))
times = [int(os.path.basename(f).split("_")[1].split(".")[0]) for f in files]
images = [Image.open(f).convert("L") for f in files]


def sharpness(img):
    return ImageStat.Stat(img.filter(ImageFilter.FIND_EDGES)).mean[0]


for name, box in regions.items():
    if not box:
        print(f"\n## {name}: not found")
        continue
    crops = [img.crop(box) for img in images]
    print(f"\n## {name}  box {box}")
    print("   ms  sharp  change")
    prev = None
    for t, crop in zip(times, crops):
        s = sharpness(crop)
        c = ImageStat.Stat(ImageChops.difference(crop, prev)).mean[0] if prev is not None else 0
        print(f"{t:5d}  {s:5.2f}  {c:6.3f}")
        prev = crop
