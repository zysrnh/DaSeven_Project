import os
import base64
import io
from PIL import Image
import numpy as np

svg_dir = r"d:\Gawe\Game Test\public\assets\Maine\Maine"
out_dir = r"d:\Gawe\Game Test\public\assets\Maine"

def process_svg(svg_filename, expected_frames, output_prefix):
    filepath = os.path.join(svg_dir, svg_filename)
    if not os.path.exists(filepath):
        print(f"File not found: {svg_filename}")
        return
        
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    parts = content.split('data:image/png;base64,')
    if len(parts) < 3:
        print(f"Unexpected SVG format for {svg_filename}")
        return
        
    b64_mask = parts[1][:parts[1].find('"')]
    b64_rgb = parts[2][:parts[2].find('"')]
    
    mask = Image.open(io.BytesIO(base64.b64decode(b64_mask))).convert('L')
    rgb = Image.open(io.BytesIO(base64.b64decode(b64_rgb))).convert('RGB')
    
    # Check if mask needs invert
    mask_arr = np.array(mask)
    corners = [mask_arr[0,0], mask_arr[0,-1], mask_arr[-1,0], mask_arr[-1,-1]]
    if np.mean(corners) > 128:
        mask_arr = 255 - mask_arr
        mask = Image.fromarray(mask_arr, mode='L')
        
    w, h = mask.size
    
    # Active columns detection
    col_counts = np.sum(mask_arr > 20, axis=0)
    col_active = col_counts > 5
    
    blocks = []
    in_b = False
    start = 0
    for i, val in enumerate(col_active):
        if val and not in_b:
            in_b = True
            start = i
        elif not val and in_b:
            in_b = False
            if i - start > 15:
                blocks.append((start, i))
    if in_b and w - start > 15:
        blocks.append((start, w))
        
    print(f"{svg_filename} -> {len(blocks)} frames detected (expected {expected_frames})")
    
    if len(blocks) != expected_frames:
        print(f"  Adjusting {svg_filename} to {expected_frames} frames evenly")
        step = w // expected_frames
        blocks = [(i * step, (i + 1) * step) for i in range(expected_frames)]
        
    rgb_arr = np.array(rgb)
    for idx, (bx0, bx1) in enumerate(blocks[:expected_frames]):
        sub_mask = mask_arr[:, bx0:bx1]
        row_counts = np.sum(sub_mask > 20, axis=1)
        active_rows = np.where(row_counts > 3)[0]
        if len(active_rows) == 0:
            continue
        by0, by1 = active_rows[0], active_rows[-1] + 1
        
        # Trim horizontally within frame
        sub_col = np.sum(sub_mask > 20, axis=0)
        active_cols = np.where(sub_col > 3)[0]
        if len(active_cols) == 0:
            continue
        cx0 = bx0 + active_cols[0]
        cx1 = bx0 + active_cols[-1] + 1
        
        pad = 2
        px0 = max(0, cx0 - pad)
        px1 = min(w, cx1 + pad)
        py0 = max(0, by0 - pad)
        py1 = min(h, by1 + pad)
        
        crop_rgb = rgb_arr[py0:py1, px0:px1]
        crop_mask = mask_arr[py0:py1, px0:px1]
        
        out_arr = np.zeros((py1 - py0, px1 - px0, 4), dtype=np.uint8)
        out_arr[:, :, :3] = crop_rgb
        out_arr[:, :, 3] = crop_mask
        
        out_img = Image.fromarray(out_arr, 'RGBA')
        if expected_frames == 1:
            out_name = f"{output_prefix}.png"
        else:
            out_name = f"{output_prefix}_{idx+1}.png"
        out_path = os.path.join(out_dir, out_name)
        out_img.save(out_path, 'PNG')
        print(f"  -> Saved {out_name} size={out_img.size}")

if __name__ == "__main__":
    process_svg('14.svg', 1, 'hero_avatar')
    process_svg('Idle.svg', 3, 'hero_idle')
    process_svg('Walk Front.svg', 3, 'hero_walk_front')
    process_svg('Walk Side.svg', 3, 'hero_walk_side')
    process_svg('Walk Up.svg', 3, 'hero_walk_up')
    process_svg('Idle Battle.svg', 3, 'hero_battle_idle')
    process_svg('Light Att.svg', 3, 'hero_attack_light')
    process_svg('Heavy Att.svg', 2, 'hero_attack_heavy')
    process_svg('Blok.svg', 3, 'hero_battle_block')
    process_svg('Buff.svg', 3, 'hero_battle_buff')
    process_svg('Heal.svg', 3, 'hero_battle_heal')
    process_svg('Hit.svg', 3, 'hero_battle_hurt')
    process_svg('Victory.svg', 3, 'hero_battle_victory')
    process_svg('Talk Idle.svg', 3, 'hero_talk')
    print("ALL SVG SLICING COMPLETE!")
