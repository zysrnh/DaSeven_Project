import os
import numpy as np
from PIL import Image

dir_path = r"d:\Gawe\Game Test\public\assets\Maine"

def slice_sheet(filename, expected_frames, output_prefix, threshold=20):
    filepath = os.path.join(dir_path, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filename}")
        return
        
    img = Image.open(filepath).convert('RGB')
    w, h = img.size
    arr = np.array(img, dtype=np.float32)
    
    # Background estimation from borders
    corners = np.vstack([
        arr[0:15, 0:15].reshape(-1, 3),
        arr[0:15, -15:].reshape(-1, 3),
        arr[-15:, 0:15].reshape(-1, 3),
        arr[-15:, -15:].reshape(-1, 3)
    ])
    bg_color = np.median(corners, axis=0)
    
    # Distance from background color
    diff = np.max(np.abs(arr - bg_color), axis=2)
    fg_mask = diff > threshold
    
    # Find active columns
    col_counts = np.sum(fg_mask, axis=0)
    col_active = col_counts > (h * 0.01)
    
    # Find contiguous column intervals
    blocks = []
    in_block = False
    start = 0
    for i, val in enumerate(col_active):
        if val and not in_block:
            in_block = True
            start = i
        elif not val and in_block:
            in_block = False
            if i - start > 20:
                blocks.append((start, i))
    if in_block and w - start > 20:
        blocks.append((start, w))
        
    print(f"{filename}: {len(blocks)} blocks found -> {blocks}")
    
    # If blocks count differs from expected_frames, partition evenly
    if len(blocks) != expected_frames:
        print(f"  Adjusting {filename} to {expected_frames} frames evenly")
        step = w // expected_frames
        blocks = [(i * step, (i + 1) * step) for i in range(expected_frames)]
        
    arr_uint8 = np.array(img, dtype=np.uint8)
    for idx, (bx0, bx1) in enumerate(blocks[:expected_frames]):
        sub_fg = fg_mask[:, bx0:bx1]
        row_counts = np.sum(sub_fg, axis=1)
        active_rows = np.where(row_counts > 5)[0]
        if len(active_rows) == 0:
            continue
        by0, by1 = active_rows[0], active_rows[-1] + 1
        
        # Trim horizontally within block
        col_counts_sub = np.sum(sub_fg, axis=0)
        active_cols_sub = np.where(col_counts_sub > 5)[0]
        if len(active_cols_sub) == 0:
            continue
        cx0 = bx0 + active_cols_sub[0]
        cx1 = bx0 + active_cols_sub[-1] + 1
        
        pad = 2
        px0 = max(0, cx0 - pad)
        px1 = min(w, cx1 + pad)
        py0 = max(0, by0 - pad)
        py1 = min(h, by1 + pad)
        
        crop_rgb = arr_uint8[py0:py1, px0:px1]
        crop_fg = fg_mask[py0:py1, px0:px1]
        
        out_arr = np.zeros((py1 - py0, px1 - px0, 4), dtype=np.uint8)
        out_arr[:, :, :3] = crop_rgb
        out_arr[:, :, 3] = np.where(crop_fg, 255, 0)
        
        out_img = Image.fromarray(out_arr, 'RGBA')
        out_name = f"{output_prefix}_{idx+1}.png"
        out_path = os.path.join(dir_path, out_name)
        out_img.save(out_path, 'PNG')
        print(f"  -> Saved {out_name} size={out_img.size}")

def slice_avatar():
    filepath = os.path.join(dir_path, "icon.jpg")
    if not os.path.exists(filepath):
        return
    img = Image.open(filepath).convert('RGB')
    w, h = img.size
    arr = np.array(img, dtype=np.float32)
    corners = np.vstack([
        arr[0:15, 0:15].reshape(-1, 3),
        arr[0:15, -15:].reshape(-1, 3),
        arr[-15:, 0:15].reshape(-1, 3),
        arr[-15:, -15:].reshape(-1, 3)
    ])
    bg_color = np.median(corners, axis=0)
    diff = np.max(np.abs(arr - bg_color), axis=2)
    fg_mask = diff > 25
    
    row_counts = np.sum(fg_mask, axis=1)
    col_counts = np.sum(fg_mask, axis=0)
    active_rows = np.where(row_counts > 5)[0]
    active_cols = np.where(col_counts > 5)[0]
    
    arr_uint8 = np.array(img, dtype=np.uint8)
    if len(active_rows) > 0 and len(active_cols) > 0:
        py0, py1 = active_rows[0], active_rows[-1] + 1
        px0, px1 = active_cols[0], active_cols[-1] + 1
        crop_rgb = arr_uint8[py0:py1, px0:px1]
        crop_fg = fg_mask[py0:py1, px0:px1]
        out_arr = np.zeros((py1 - py0, px1 - px0, 4), dtype=np.uint8)
        out_arr[:, :, :3] = crop_rgb
        out_arr[:, :, 3] = np.where(crop_fg, 255, 0)
        out_img = Image.fromarray(out_arr, 'RGBA')
        out_path = os.path.join(dir_path, "hero_avatar.png")
        out_img.save(out_path, 'PNG')
        print(f"  -> Saved hero_avatar.png size={out_img.size}")

if __name__ == "__main__":
    slice_sheet('idle_sheet.jpg', 3, 'hero_idle')
    slice_sheet('frontwalk_sheet.jpg', 3, 'hero_walk_front')
    slice_sheet('walk_sheet.jpg', 3, 'hero_walk_side')
    slice_sheet('upwalk_sheet.jpg', 3, 'hero_walk_up')
    slice_sheet('idlebatt_sheet.jpg', 3, 'hero_battle_idle')
    slice_sheet('lightatt_sheet.jpg', 3, 'hero_attack_light')
    slice_sheet('heavyatt_sheet.jpg', 2, 'hero_attack_heavy')
    slice_sheet('block_sheet.jpg', 3, 'hero_battle_block')
    slice_sheet('buff_sheet.jpg', 3, 'hero_battle_buff')
    slice_sheet('heal_sheet.jpg', 3, 'hero_battle_heal')
    slice_avatar()
    print("ALL SLICING COMPLETED SUCCESSFULLY!")
