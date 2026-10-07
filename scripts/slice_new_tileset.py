import os
from PIL import Image
import numpy as np

src_path = r"C:\Users\ADVAN\.gemini\antigravity-ide\brain\3e6ac998-f266-4dbe-a069-98648b8d6f7a\.user_uploaded\media_1791377243825.png"
img = Image.open(src_path).convert("RGBA")
w, h = img.size
print(f"Source tileset sheet size: {w}x{h}")

# Let's inspect the sections in the image:
# Section 1: Seamless Ground Tiles (x: 55..370, y: 170..515)
# Section 2: Line Markings (x: 410..700, y: 180..515)
# Section 3: Sidewalk & Curb (x: 740..980, y: 170..515)
# Section 4: Court Markings (x: 55..360, y: 590..900)
# Section 5: Yard Objects & Natural Assets (x: 410..720, y: 590..920)
# Section 6: Structure & Boundary (x: 760..980, y: 590..930)

out_tiles_dir = r"d:\Gawe\Game Test\public\assets\maps\smkn7\tiles"
out_props_dir = r"d:\Gawe\Game Test\public\assets\maps\smkn7\props"
os.makedirs(out_tiles_dir, exist_ok=True)
os.makedirs(out_props_dir, exist_ok=True)
