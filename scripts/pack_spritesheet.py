import os
import json
from PIL import Image

maine_dir = r"d:\Gawe\Game Test\public\assets\Maine"

# Define structured rows of animation categories
rows_def = [
    {
        "category": "idle_overworld",
        "frames": ["hero_idle_1.png", "hero_idle_2.png", "hero_idle_3.png"]
    },
    {
        "category": "walk_front",
        "frames": ["hero_walk_front_1.png", "hero_walk_front_2.png", "hero_walk_front_3.png"]
    },
    {
        "category": "walk_side",
        "frames": ["hero_walk_side_1.png", "hero_walk_side_2.png", "hero_walk_side_3.png"]
    },
    {
        "category": "walk_up",
        "frames": ["hero_walk_up_1.png", "hero_walk_up_2.png", "hero_walk_up_3.png"]
    },
    {
        "category": "battle_idle",
        "frames": ["hero_battle_idle_1.png", "hero_battle_idle_2.png", "hero_battle_idle_3.png"]
    },
    {
        "category": "attack_light",
        "frames": ["hero_attack_light_1.png", "hero_attack_light_2.png", "hero_attack_light_3.png"]
    },
    {
        "category": "attack_heavy",
        "frames": ["hero_attack_heavy_1.png", "hero_attack_heavy_2.png"]
    },
    {
        "category": "battle_block",
        "frames": ["hero_battle_block_1.png", "hero_battle_block_2.png", "hero_battle_block_3.png"]
    },
    {
        "category": "battle_buff",
        "frames": ["hero_battle_buff_1.png", "hero_battle_buff_2.png", "hero_battle_buff_3.png"]
    },
    {
        "category": "battle_heal",
        "frames": ["hero_battle_heal_1.png", "hero_battle_heal_2.png", "hero_battle_heal_3.png"]
    },
    {
        "category": "battle_hurt",
        "frames": ["hero_battle_hurt_1.png", "hero_battle_hurt_2.png", "hero_battle_hurt_3.png"]
    },
    {
        "category": "battle_victory",
        "frames": ["hero_battle_victory_1.png", "hero_battle_victory_2.png", "hero_battle_victory_3.png"]
    },
    {
        "category": "talk",
        "frames": ["hero_talk_1.png", "hero_talk_2.png", "hero_talk_3.png"]
    },
    {
        "category": "avatar",
        "frames": ["hero_avatar.png"]
    }
]

def pack_spritesheet():
    pad = 16
    max_row_width = 0
    total_height = pad
    
    loaded_rows = []
    
    for row in rows_def:
        row_imgs = []
        row_w = pad
        row_max_h = 0
        
        for fn in row["frames"]:
            fp = os.path.join(maine_dir, fn)
            if os.path.exists(fp):
                img = Image.open(fp).convert("RGBA")
                row_imgs.append((fn, img))
                row_w += img.width + pad
                if img.height > row_max_h:
                    row_max_h = img.height
            else:
                print(f"Warning: {fn} missing!")
                
        if row_w > max_row_width:
            max_row_width = row_w
            
        loaded_rows.append({
            "category": row["category"],
            "imgs": row_imgs,
            "row_h": row_max_h
        })
        total_height += row_max_h + pad

    sheet = Image.new("RGBA", (max_row_width, total_height), (0, 0, 0, 0))
    
    atlas = {
        "meta": {
            "image": "hero_master_spritesheet.png",
            "size": {"w": max_row_width, "h": total_height},
            "format": "RGBA8888"
        },
        "frames": {},
        "animations": {}
    }
    
    cur_y = pad
    for r in loaded_rows:
        cur_x = pad
        cat = r["category"]
        atlas["animations"][cat] = []
        
        for fn, img in r["imgs"]:
            # Align frames to bottom of row
            draw_y = cur_y + (r["row_h"] - img.height)
            sheet.paste(img, (cur_x, draw_y), img)
            
            frame_id = os.path.splitext(fn)[0]
            atlas["frames"][frame_id] = {
                "frame": {"x": cur_x, "y": draw_y, "w": img.width, "h": img.height},
                "category": cat
            }
            atlas["animations"][cat].append(frame_id)
            
            cur_x += img.width + pad
            
        cur_y += r["row_h"] + pad
        
    out_png_path = os.path.join(maine_dir, "hero_master_spritesheet.png")
    out_json_path = os.path.join(maine_dir, "hero_spritesheet.json")
    
    sheet.save(out_png_path, "PNG")
    with open(out_json_path, "w", encoding="utf-8") as jf:
        json.dump(atlas, jf, indent=2)
        
    print(f"Master Sprite Sheet saved: {out_png_path} size={sheet.size}")
    print(f"Atlas Metadata saved: {out_json_path}")

if __name__ == "__main__":
    pack_spritesheet()
