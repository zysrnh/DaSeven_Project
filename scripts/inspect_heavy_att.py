import os
import base64
import io
from PIL import Image
import numpy as np

fp = r"d:\Gawe\Game Test\public\assets\Maine\Maine\Heavy Att.svg"
with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
parts = content.split('data:image/png;base64,')
b64_mask = parts[1][:parts[1].find('"')]
b64_rgb = parts[2][:parts[2].find('"')]
mask = Image.open(io.BytesIO(base64.b64decode(b64_mask))).convert('L')
rgb = Image.open(io.BytesIO(base64.b64decode(b64_rgb))).convert('RGB')
mask_arr = np.array(mask)
if np.mean([mask_arr[0,0], mask_arr[0,-1]]) > 128:
    mask_arr = 255 - mask_arr

rgba = Image.new("RGBA", rgb.size)
rgba.paste(rgb, (0, 0))
rgba.putalpha(mask)

# Save full uncut Heavy Att to check
rgba.save(r"d:\Gawe\Game Test\public\assets\Maine\heavy_att_full.png")

print(f"Heavy Att full image size: {rgba.size}")
# Let's inspect where the 3 characters are located in Heavy Att
# Character 1: left (x ~ 40 to 310)
# Character 2: middle slash (x ~ 340 to 670)
# Character 3: right follow-through (x ~ 670 to 1000)
c1 = rgba.crop((38, 0, 320, rgba.height))
c2 = rgba.crop((320, 0, 680, rgba.height))
c3 = rgba.crop((680, 0, 1010, rgba.height))

print("Character 1 bbox:", c1.getbbox())
print("Character 2 bbox:", c2.getbbox())
print("Character 3 bbox:", c3.getbbox())
