import re
import base64
import io
from PIL import Image
import numpy as np

# 1. Extract raw PNG from Heavy Att.svg
with open('public/assets/Maine/Maine/Heavy Att.svg', 'r', encoding='utf-8') as f:
    svg_data = f.read()

m = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', svg_data)
if m:
    png_bytes = base64.b64decode(m.group(1))
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    print(f"Original embedded PNG size: {img.size}")
else:
    # fallback to cairosvg or screenshot
    import cairosvg
    png_bytes = cairosvg.svg2png(url='public/assets/Maine/Maine/Heavy Att.svg', scale=2.0)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    print(f"Cairo rendered PNG size: {img.size}")

img.save('public/assets/Maine/heavy_att_full.png')
print("Saved full sheet to public/assets/Maine/heavy_att_full.png")

# Inspect alpha and non-transparent bounding boxes
arr = np.array(img)
alpha = arr[:, :, 3]
h, w = alpha.shape

# Let's inspect columns with content
col_sums = np.sum(alpha > 10, axis=0)

# Let's find distinct bounding regions
# In Heavy Att:
# Character 1: left side (around x=0 to x=380)
# Character 2: middle (around x=280 to x=720) with white arc curving
# Character 3: right side (around x=650 to x=1024)

# Let's check coordinates of the 3 poses
print("Width:", w, "Height:", h)
