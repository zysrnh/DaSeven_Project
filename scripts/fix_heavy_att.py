import os, base64, io
from PIL import Image
import numpy as np

def extract_svg_rgba(svg_path):
    with open(svg_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    parts = content.split('data:image/png;base64,')
    b64_mask = parts[1][:parts[1].find('"')]
    b64_rgb = parts[2][:parts[2].find('"')]
    mask = Image.open(io.BytesIO(base64.b64decode(b64_mask))).convert('L')
    rgb = Image.open(io.BytesIO(base64.b64decode(b64_rgb))).convert('RGB')
    mask_arr = np.array(mask)
    if np.mean([mask_arr[0,0], mask_arr[0,-1], mask_arr[-1,0], mask_arr[-1,-1]]) > 128:
        mask_arr = 255 - mask_arr
        mask = Image.fromarray(mask_arr, mode='L')
    rgba = Image.new("RGBA", rgb.size)
    rgba.paste(rgb, (0, 0))
    rgba.putalpha(mask)
    return rgba

im = extract_svg_rgba('public/assets/Maine/Maine/Heavy Att.svg')
arr = np.array(im)
h, w, _ = arr.shape

# 1. Frame 1: Windup (left)
f1 = arr[:, 0:340].copy()
im1 = Image.fromarray(f1)
im1 = im1.crop(im1.getbbox())

# 2. Frame 2: Slash (middle)
f2 = arr[:, 340:745].copy()
for y in range(h):
    for x in range(340, 745):
        rel_x = x - 340
        if x >= 700 and y < 200:
            f2[y, rel_x] = [0, 0, 0, 0]
        if x >= 730:
            f2[y, rel_x] = [0, 0, 0, 0]

im2 = Image.fromarray(f2)
im2 = im2.crop(im2.getbbox())

# 3. Frame 3: Follow-through (right)
f3 = arr[:, 640:1010].copy()
for y in range(h):
    for x in range(640, 770):
        rel_x = x - 640
        if x < 690:
            f3[y, rel_x] = [0, 0, 0, 0]
        elif x < 740:
            bat_upper = 1.06 * (x - 690) + 175 - 15
            bat_lower = 1.06 * (x - 690) + 175 + 20
            if y > bat_lower or y < bat_upper:
                f3[y, rel_x] = [0, 0, 0, 0]

im3 = Image.fromarray(f3)
im3 = im3.crop(im3.getbbox())

# Save to public/assets/characters/maine/
im1.save('public/assets/characters/maine/attack_heavy_1.png')
im2.save('public/assets/characters/maine/attack_heavy_2.png')
im3.save('public/assets/characters/maine/attack_heavy_3.png')

# Save to public/assets/Maine/
im1.save('public/assets/Maine/hero_attack_heavy_1.png')
im2.save('public/assets/Maine/hero_attack_heavy_2.png')
im3.save('public/assets/Maine/hero_attack_heavy_3.png')

print("Successfully saved all 3 isolated attack frames:")
print("1. Windup:", im1.size)
print("2. Slash:", im2.size)
print("3. Follow-through:", im3.size)
