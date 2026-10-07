import os
import base64
import io
import shutil
from PIL import Image
import numpy as np

base_dir = r"d:\Gawe\Game Test\public\assets"
char_dir = os.path.join(base_dir, "characters", "maine")
map_props_dir = os.path.join(base_dir, "maps", "smkn7", "props")
map_tiles_dir = os.path.join(base_dir, "maps", "smkn7", "tiles")

os.makedirs(char_dir, exist_ok=True)
os.makedirs(map_props_dir, exist_ok=True)
os.makedirs(map_tiles_dir, exist_ok=True)

svg_source_dir = os.path.join(base_dir, "Maine", "Maine")

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

def slice_and_save(rgba, box, out_name):
    crop = rgba.crop(box)
    # Trim transparent borders
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    out_path = os.path.join(char_dir, out_name)
    crop.save(out_path, "PNG")
    print(f"Saved {out_name} -> size={crop.size}")

def process_characters():
    print("=== PROCESSING CHARACTER: MAINE ===")
    
    # 1. Avatar (14.svg)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "14.svg"))
    slice_and_save(im, (37, 0, 800, im.height), "avatar.png")
    
    # 2. Idle Overworld (Idle.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Idle.svg"))
    slice_and_save(im, (130, 0, 580, im.height), "idle_1.png")
    slice_and_save(im, (860, 0, 1320, im.height), "idle_2.png")
    slice_and_save(im, (1630, 0, 2070, im.height), "idle_3.png")
    
    # 3. Walk Front (Walk Front.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Walk Front.svg"))
    slice_and_save(im, (130, 0, 580, im.height), "walk_front_1.png")
    slice_and_save(im, (880, 0, 1320, im.height), "walk_front_2.png")
    slice_and_save(im, (1620, 0, 2100, im.height), "walk_front_3.png")
    
    # 4. Walk Side (Walk Side.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Walk Side.svg"))
    slice_and_save(im, (110, 0, 620, im.height), "walk_side_1.png")
    slice_and_save(im, (880, 0, 1320, im.height), "walk_side_2.png")
    slice_and_save(im, (1590, 0, 2140, im.height), "walk_side_3.png")
    
    # 5. Walk Up (Walk Up.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Walk Up.svg"))
    slice_and_save(im, (70, 0, 280, im.height), "walk_up_1.png")
    slice_and_save(im, (410, 0, 620, im.height), "walk_up_2.png")
    slice_and_save(im, (760, 0, 980, im.height), "walk_up_3.png")
    
    # 6. Battle Idle (Idle Battle.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Idle Battle.svg"))
    slice_and_save(im, (50, 0, 340, im.height), "battle_idle_1.png")
    slice_and_save(im, (380, 0, 670, im.height), "battle_idle_2.png")
    slice_and_save(im, (730, 0, 1010, im.height), "battle_idle_3.png")
    
    # 7. Light Attack (Light Att.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Light Att.svg"))
    slice_and_save(im, (35, 0, 280, im.height), "attack_light_1.png")
    slice_and_save(im, (350, 0, 710, im.height), "attack_light_2.png")
    slice_and_save(im, (760, 0, 1000, im.height), "attack_light_3.png")
    
    # 8. Heavy Attack (Heavy Att.svg -> 3 SEPARATE FRAMES!)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Heavy Att.svg"))
    # Frame 1: Windup (left)
    slice_and_save(im, (35, 0, 320, im.height), "attack_heavy_1.png")
    # Frame 2: Slash with white arc (middle - single character!)
    slice_and_save(im, (320, 0, 680, im.height), "attack_heavy_2.png")
    # Frame 3: Follow-through (right - single character!)
    slice_and_save(im, (680, 0, 1010, im.height), "attack_heavy_3.png")
    
    # 9. Block / Defend (Blok.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Blok.svg"))
    slice_and_save(im, (70, 0, 300, im.height), "block_1.png")
    slice_and_save(im, (380, 0, 670, im.height), "block_2.png")
    slice_and_save(im, (750, 0, 1010, im.height), "block_3.png")
    
    # 10. Buff (Buff.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Buff.svg"))
    slice_and_save(im, (60, 0, 240, im.height), "buff_1.png")
    slice_and_save(im, (320, 0, 690, im.height), "buff_2.png")
    slice_and_save(im, (740, 0, 1000, im.height), "buff_3.png")
    
    # 11. Heal (Heal.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Heal.svg"))
    slice_and_save(im, (60, 0, 290, im.height), "heal_1.png")
    slice_and_save(im, (430, 0, 630, im.height), "heal_2.png")
    slice_and_save(im, (760, 0, 990, im.height), "heal_3.png")
    
    # 12. Hurt & Defeat (Hit.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Hit.svg"))
    slice_and_save(im, (50, 0, 300, im.height), "hurt_1.png")
    slice_and_save(im, (350, 0, 670, im.height), "hurt_2.png")
    slice_and_save(im, (700, 0, 990, im.height), "hurt_3.png")
    
    # 13. Victory (Victory.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Victory.svg"))
    slice_and_save(im, (40, 0, 320, im.height), "victory_1.png")
    slice_and_save(im, (380, 0, 670, im.height), "victory_2.png")
    slice_and_save(im, (740, 0, 1020, im.height), "victory_3.png")
    
    # 14. Talk (Talk Idle.svg -> 3 frames)
    im = extract_svg_rgba(os.path.join(svg_source_dir, "Talk Idle.svg"))
    slice_and_save(im, (50, 0, 270, im.height), "talk_1.png")
    slice_and_save(im, (390, 0, 690, im.height), "talk_2.png")
    slice_and_save(im, (770, 0, 990, im.height), "talk_3.png")

def process_map_props():
    print("=== PROCESSING MAP PROPS: SMKN 7 BALEENDAH ===")
    src_tiles_dir = os.path.join(base_dir, "tiles")
    
    # Copy all generated props to map_props_dir
    for f in os.listdir(src_tiles_dir):
        if f.startswith("prop_") and f.endswith(".png"):
            src = os.path.join(src_tiles_dir, f)
            dst = os.path.join(map_props_dir, f)
            shutil.copy2(src, dst)
            print(f"Copied prop: {f} -> maps/smkn7/props/")
        elif f.startswith("tile_") and f.endswith(".png"):
            src = os.path.join(src_tiles_dir, f)
            dst = os.path.join(map_tiles_dir, f)
            shutil.copy2(src, dst)
            print(f"Copied tile: {f} -> maps/smkn7/tiles/")

if __name__ == "__main__":
    process_characters()
    process_map_props()
    print("REORGANIZATION AND CLEAN SLICING COMPLETE!")
