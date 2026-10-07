import os
from PIL import Image

src_img = Image.open('public/assets/tiles/Street/Street_tiles.jpg').convert('RGBA')
out_dir = r'public/assets/maps/street'
os.makedirs(out_dir, exist_ok=True)

# 1. Seamless Asphalt Section
src_img.crop((35, 35, 185, 165)).save(os.path.join(out_dir, 'asphalt_plain.png'))
src_img.crop((255, 35, 315, 165)).save(os.path.join(out_dir, 'asphalt_curb_strip.png'))
src_img.crop((350, 35, 415, 100)).save(os.path.join(out_dir, 'asphalt_gravel_dark.png'))
src_img.crop((415, 35, 480, 100)).save(os.path.join(out_dir, 'asphalt_pebbles.png'))
src_img.crop((350, 100, 415, 165)).save(os.path.join(out_dir, 'asphalt_worn.png'))
src_img.crop((415, 100, 480, 165)).save(os.path.join(out_dir, 'asphalt_gravel_light.png'))

# 2. Cracks & Potholes
src_img.crop((580, 35, 645, 100)).save(os.path.join(out_dir, 'crack_spider.png'))
src_img.crop((680, 35, 745, 100)).save(os.path.join(out_dir, 'crack_deep.png'))
src_img.crop((745, 35, 810, 100)).save(os.path.join(out_dir, 'pothole_shallow.png'))
src_img.crop((810, 35, 890, 100)).save(os.path.join(out_dir, 'pothole_deep.png'))
src_img.crop((890, 35, 970, 100)).save(os.path.join(out_dir, 'pothole_large.png'))
src_img.crop((890, 100, 970, 165)).save(os.path.join(out_dir, 'puddle_water.png'))
src_img.crop((745, 100, 815, 165)).save(os.path.join(out_dir, 'asphalt_oil_stain.png'))

# 3. Motorcycle Parking
src_img.crop((35, 215, 205, 275)).save(os.path.join(out_dir, 'parking_motor_slots_top.png'))
src_img.crop((35, 310, 170, 370)).save(os.path.join(out_dir, 'parking_motor_slots_bottom.png'))
src_img.crop((210, 220, 380, 280)).save(os.path.join(out_dir, 'parking_diagonal_box_top.png'))
src_img.crop((210, 310, 380, 370)).save(os.path.join(out_dir, 'parking_diagonal_box_bottom.png'))

# 4. Yellow Road Lines
src_img.crop((520, 215, 815, 285)).save(os.path.join(out_dir, 'road_yellow_double_h.png'))
src_img.crop((830, 215, 895, 285)).save(os.path.join(out_dir, 'road_yellow_double_v.png'))
src_img.crop((895, 215, 965, 285)).save(os.path.join(out_dir, 'asphalt_square.png'))
src_img.crop((680, 285, 815, 375)).save(os.path.join(out_dir, 'road_yellow_intersection_1.png'))
src_img.crop((830, 285, 965, 375)).save(os.path.join(out_dir, 'road_yellow_intersection_2.png'))

# 5. White Lane Markings
src_img.crop((35, 410, 145, 475)).save(os.path.join(out_dir, 'road_white_dashed.png'))
src_img.crop((145, 410, 250, 475)).save(os.path.join(out_dir, 'road_white_solid.png'))
src_img.crop((395, 410, 470, 475)).save(os.path.join(out_dir, 'road_white_corner.png'))
src_img.crop((205, 480, 250, 545)).save(os.path.join(out_dir, 'arrow_straight.png'))
src_img.crop((250, 480, 300, 545)).save(os.path.join(out_dir, 'arrow_turn_right.png'))
src_img.crop((345, 480, 400, 545)).save(os.path.join(out_dir, 'arrow_combo.png'))

# 6. Edge Transitions & Dirt
src_img.crop((520, 410, 580, 545)).save(os.path.join(out_dir, 'road_dirt_edge_left.png'))
src_img.crop((580, 410, 645, 545)).save(os.path.join(out_dir, 'road_dirt_edge_right.png'))
src_img.crop((680, 410, 750, 545)).save(os.path.join(out_dir, 'road_grass_moss_edge.png'))
src_img.crop((750, 410, 815, 545)).save(os.path.join(out_dir, 'road_debris_litter.png'))
src_img.crop((900, 410, 965, 475)).save(os.path.join(out_dir, 'road_oil_splatter.png'))

print("All street tiles successfully sliced into:", out_dir)
