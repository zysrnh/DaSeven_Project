import os
import numpy as np
from PIL import Image
from collections import deque

tiles_dir = r"d:\Gawe\Game Test\public\assets\tiles"

def flood_remove_bg(crop_img, bg_color, thresh=18):
    w, h = crop_img.size
    arr = np.array(crop_img.convert("RGB"))
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

def slice_attirbut():
    p = os.path.join(tiles_dir, "Attirbut_tiles.jpg")
    im = Image.open(p).convert("RGB")
    bg = np.array([33, 33, 33], dtype=float)
    
    # Exact bounding boxes from Attirbut_tiles.jpg
    items = [
        ("prop_monumen_smkn7", (36, 36, 309, 255)),
        ("prop_plang_gantung", (346, 35, 487, 114)),
        ("prop_podium", (363, 118, 453, 247)),
        ("prop_meja_siswa_top", (521, 70, 676, 228)),
        ("prop_fotokopi_1", (706, 95, 804, 215)),
        ("prop_router", (822, 106, 913, 184)),
        ("prop_dispenser_1", (929, 79, 978, 213)),
        ("prop_fotokopi_2", (54, 280, 139, 405)),
        ("prop_router_2", (160, 290, 252, 369)),
        ("prop_dispenser_2", (271, 264, 331, 405)),
        ("prop_kursi_susun", (360, 267, 419, 384)),
        ("prop_meja_siswa_satuan_1", (522, 245, 598, 356)),
        ("prop_meja_siswa_satuan_2", (616, 249, 678, 359)),
        ("prop_apar_1", (724, 265, 762, 341)),
        ("prop_apar_2", (777, 266, 816, 342)),
        ("prop_kotak_uks", (836, 266, 895, 343)),
        ("prop_kotak_p3k", (911, 274, 983, 335)),
        ("prop_tempat_sampah_3", (46, 447, 189, 525)),
        ("prop_kursi_tas_1", (225, 435, 297, 533)),
        ("prop_kursi_tas_2", (315, 434, 389, 529)),
        ("prop_kursi_tas_3", (407, 432, 480, 531)),
        ("prop_parkiran_motor", (500, 386, 843, 533)),
        ("prop_motor_matic_1", (897, 381, 977, 453)),
        ("prop_motor_matic_2", (902, 462, 980, 535)),
    ]
    
    for name, box in items:
        crop = im.crop(box)
        clean = flood_remove_bg(crop, bg, thresh=18)
        out_p = os.path.join(tiles_dir, f"{name}.png")
        clean.save(out_p, "PNG")
        print(f"Saved {name}.png -> size={clean.size}")

def slice_tileset():
    p = os.path.join(tiles_dir, "765470a2-bfb7-4654-871d-6f847e0c7742.jpg")
    im = Image.open(p).convert("RGB")
    bg = np.array([21, 26, 30], dtype=float)
    
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
        if "floor" in name:
            out_p = os.path.join(tiles_dir, f"{name}.png")
            crop.save(out_p, "PNG")
        else:
            clean = flood_remove_bg(crop, bg, thresh=24)
            out_p = os.path.join(tiles_dir, f"{name}.png")
            clean.save(out_p, "PNG")
        print(f"Saved {name}.png -> size={crop.size}")

if __name__ == "__main__":
    slice_attirbut()
    slice_tileset()
    print("ALL CLEAN SLICING COMPLETE!")
