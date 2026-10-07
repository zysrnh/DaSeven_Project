import os
import numpy as np
from PIL import Image
from collections import deque

tiles_dir = r"d:\Gawe\Game Test\public\assets\tiles"

def flood_remove_bg(img, bg_color, thresh=22):
    w, h = img.size
    arr = np.array(img.convert("RGB"))
    diff = np.max(np.abs(arr.astype(float) - bg_color), axis=2)
    is_bg = diff <= thresh
    
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_bg[0, x]: q.append((0, x)); visited[0, x] = True
        if is_bg[h-1, x]: q.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if is_bg[y, 0]: q.append((y, 0)); visited[y, 0] = True
        if is_bg[y, w-1]: q.append((y, w-1)); visited[y, w-1] = True
        
    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if is_bg[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
                    
    fg_mask = ~visited
    out_arr = np.zeros((h, w, 4), dtype=np.uint8)
    out_arr[:, :, :3] = arr
    out_arr[:, :, 3] = np.where(fg_mask, 255, 0)
    return Image.fromarray(out_arr, "RGBA")

def slice_props_sheet():
    p = os.path.join(tiles_dir, "image.png")
    im = Image.open(p).convert("RGB")
    w, h = im.size
    
    # Specific bounding box regions for props in image.png:
    # 1. Monumen SMKN 7 Baleendah (top-left)
    # 2. Plang Gantung SMKN 7 (top-center)
    # 3. Podium Kayu (top-center)
    # 4. Meja Belajar Siswa (top)
    # 5. Mesin Fotokopi (right)
    # 6. Meja Router (right)
    # 7. Dispenser Aqua (right)
    # 8. Kursi Susun Plastik
    # 9. Kotak UKS & P3K
    # 10. APAR
    # 11. Tempat Sampah 3 Warna (bottom-left)
    # 12. Kursi Tas Ransel
    # 13. Parkiran Motor Kanopi (bottom-center)
    # 14. Motor Satuan (bottom-right)
    
    # Defined crop regions (x0, y0, x1, y1, name, bg_color)
    bg_props = np.array([47, 61, 76])
    
    items = [
        ("prop_monumen_smkn7", (95, 45, 335, 235)),
        ("prop_plang_gantung", (340, 45, 450, 115)),
        ("prop_podium", (340, 120, 425, 240)),
        ("prop_meja_siswa_top", (455, 60, 570, 240)),
        ("prop_meja_siswa_mid", (455, 270, 570, 410)),
        ("prop_fotokopi_1", (580, 70, 665, 240)),
        ("prop_fotokopi_2", (105, 270, 195, 440)),
        ("prop_router", (670, 100, 745, 220)),
        ("prop_dispenser_1", (750, 70, 805, 240)),
        ("prop_dispenser_2", (270, 270, 325, 440)),
        ("prop_kursi_susun", (340, 270, 435, 435)),
        ("prop_apar", (605, 270, 675, 400)),
        ("prop_kotak_uks", (680, 270, 790, 395)),
        ("prop_tempat_sampah_3", (105, 480, 220, 585)),
        ("prop_kursi_tas", (240, 470, 430, 595)),
        ("prop_parkiran_motor", (435, 435, 690, 600)),
        ("prop_motor_matic_1", (720, 435, 795, 520)),
        ("prop_motor_matic_2", (725, 520, 795, 600)),
    ]
    
    for name, box in items:
        crop = im.crop(box)
        clean = flood_remove_bg(crop, bg_props, thresh=22)
        out_p = os.path.join(tiles_dir, f"{name}.png")
        clean.save(out_p, "PNG")
        print(f"Saved {name}.png size={clean.size}")

def slice_tileset_sheet():
    p = os.path.join(tiles_dir, "765470a2-bfb7-4654-871d-6f847e0c7742.jpg")
    im = Image.open(p).convert("RGB")
    bg_tile = np.array([20, 25, 28])
    
    # Specific crops from the tileset sheet:
    # 1. Floor Ceramic White (top left 128x128)
    # 2. Floor Blue Lab (middle left 128x128)
    # 3. Wall Brick (top brick wall)
    # 4. Wall Hallway Window (middle hallway wall with windows)
    # 5. Door Wood (brown doors)
    # 6. Door Lab Komputer (double door "LAB. KOMPUTER")
    # 7. Door Kelas (single door "KELAS")
    # 8. PC Desks Single & Row
    # 9. Server Racks (bottom row with blinking lights & LAN cables)
    # 10. Blackboard Green & Whiteboard
    # 11. Banner SMK BISA
    # 12. Foto Presiden & Garuda
    # 13. Lemari Piala
    # 14. Tanaman Pot
    
    tiles = [
        ("tile_floor_white", (120, 60, 240, 180)),
        ("tile_floor_blue", (120, 195, 240, 315)),
        ("tile_wall_brick", (300, 60, 550, 180)),
        ("tile_wall_hallway", (300, 195, 550, 340)),
        ("tile_door_wood", (580, 60, 675, 180)),
        ("tile_door_lab", (690, 195, 785, 340)),
        ("tile_door_kelas", (785, 195, 875, 340)),
        ("tile_pc_desk_row", (120, 385, 530, 480)),
        ("tile_server_racks", (120, 485, 415, 630)),
        ("tile_blackboard", (590, 380, 720, 475)),
        ("tile_whiteboard", (590, 480, 745, 570)),
        ("tile_banner_smk_bisa", (470, 550, 575, 625)),
        ("tile_presiden_garuda", (720, 380, 790, 455)),
        ("tile_lemari_piala", (675, 550, 745, 650)),
        ("tile_tanaman_pot", (745, 550, 805, 650)),
    ]
    
    for name, box in tiles:
        crop = im.crop(box)
        # If it's a floor tile, keep opaque. If prop/furniture, flood remove bg.
        if "floor" in name or "wall" in name:
            out_p = os.path.join(tiles_dir, f"{name}.png")
            crop.save(out_p, "PNG")
        else:
            clean = flood_remove_bg(crop, bg_tile, thresh=24)
            out_p = os.path.join(tiles_dir, f"{name}.png")
            clean.save(out_p, "PNG")
        print(f"Saved {name}.png size={crop.size}")

if __name__ == "__main__":
    slice_props_sheet()
    slice_tileset_sheet()
    print("ALL TILES AND PROPS SLICED SUCCESSFULLY!")
