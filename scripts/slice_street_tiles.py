import os
from PIL import Image

src_img = Image.open('public/assets/tiles/Street/Street_tiles.jpg').convert('RGBA')
out_dir = r'public/assets/maps/smkn7/tiles/street'
os.makedirs(out_dir, exist_ok=True)

# 1. Seamless Asphalt Section (x: 35..485, y: 35..165)
# Plain asphalt block:
src_img.crop((35, 35, 185, 165)).save(os.path.join(out_dir, 'asphalt_plain.png'))
# Vertical curb asphalt:
src_img.crop((255, 35, 315, 165)).save(os.path.join(out_dir, 'asphalt_curb_strip.png'))
# Dark gravel:
src_img.crop((350, 35, 415, 100)).save(os.path.join(out_dir, 'asphalt_gravel_dark.png'))
# Light pebble asphalt:
src_img.crop((415, 35, 480, 100)).save(os.path.join(out_dir, 'asphalt_pebbles.png'))
# Smooth worn asphalt:
src_img.crop((350, 100, 415, 165)).save(os.path.join(out_dir, 'asphalt_worn.png'))
# Light stone gravel:
src_img.crop((415, 100, 480, 165)).save(os.path.join(out_dir, 'asphalt_gravel_light.png'))

# 2. Cracks & Potholes (x: 520..970, y: 35..165)
# Spider crack:
src_img.crop((580, 35, 645, 100)).save(os.path.join(out_dir, 'crack_spider.png'))
# Deep crack:
src_img.crop((680, 35, 745, 100)).save(os.path.join(out_dir, 'crack_deep.png'))
# Pothole shallow:
src_img.crop((745, 35, 810, 100)).save(os.path.join(out_dir, 'pothole_shallow.png'))
# Pothole deep:
src_img.crop((810, 35, 890, 100)).save(os.path.join(out_dir, 'pothole_deep.png'))
# Pothole large:
src_img.crop((890, 35, 970, 100)).save(os.path.join(out_dir, 'pothole_large.png'))
# Puddle asphalt:
src_img.crop((890, 100, 970, 165)).save(os.path.join(out_dir, 'puddle_water.png'))
# Oil stain / debris pothole:
src_img.crop((745, 100, 815, 165)).save(os.path.join(out_dir, 'asphalt_oil_stain.png'))

# 3. Motorcycle Parking (x: 35..470, y: 215..370)
# Parking stall lines top:
src_img.crop((35, 215, 205, 275)).save(os.path.join(out_dir, 'parking_motor_slots_top.png'))
# Parking stall lines bottom:
src_img.crop((35, 310, 170, 370)).save(os.path.join(out_dir, 'parking_motor_slots_bottom.png'))
# Diagonal striped box:
src_img.crop((210, 220, 380, 280)).save(os.path.join(out_dir, 'parking_diagonal_box_top.png'))
src_img.crop((210, 310, 380, 370)).save(os.path.join(out_dir, 'parking_diagonal_box_bottom.png'))

# 4. Yellow Road Lines (x: 520..970, y: 215..375)
# Double yellow horizontal road:
src_img.crop((520, 215, 815, 285)).save(os.path.join(out_dir, 'road_yellow_double_h.png'))
# Double yellow vertical road:
src_img.crop((830, 215, 895, 285)).save(os.path.join(out_dir, 'road_yellow_double_v.png'))
# Plain asphalt square:
src_img.crop((895, 215, 965, 285)).save(os.path.join(out_dir, 'asphalt_square.png'))
# Yellow cross intersection:
src_img.crop((680, 285, 815, 375)).save(os.path.join(out_dir, 'road_yellow_intersection_1.png'))
src_img.crop((830, 285, 965, 375)).save(os.path.join(out_dir, 'road_yellow_intersection_2.png'))

# 5. White Lane Markings (x: 35..470, y: 410..545)
# Dashed lane divider:
src_img.crop((35, 410, 145, 475)).save(os.path.join(out_dir, 'road_white_dashed.png'))
# Solid white line:
src_img.crop((145, 410, 250, 475)).save(os.path.join(out_dir, 'road_white_solid.png'))
# Corner white turn:
src_img.crop((395, 410, 470, 475)).save(os.path.join(out_dir, 'road_white_corner.png'))
# Arrow Straight:
src_img.crop((205, 480, 250, 545)).save(os.path.join(out_dir, 'arrow_straight.png'))
# Arrow Turn Right:
src_img.crop((250, 480, 300, 545)).save(os.path.join(out_dir, 'arrow_turn_right.png'))
# Arrow Combo Straight & Right:
src_img.crop((345, 480, 400, 545)).save(os.path.join(out_dir, 'arrow_combo.png'))

# 6. Edge Transitions & Dirt (x: 520..970, y: 410..550)
# Road to dirt edge left:
src_img.crop((520, 410, 580, 545)).save(os.path.join(out_dir, 'road_dirt_edge_left.png'))
# Road to dirt edge right:
src_img.crop((580, 410, 645, 545)).save(os.path.join(out_dir, 'road_dirt_edge_right.png'))
# Road to rocky grass:
src_img.crop((680, 410, 750, 545)).save(os.path.join(out_dir, 'road_grass_moss_edge.png'))
# Road with roadside debris:
src_img.crop((750, 410, 815, 545)).save(os.path.join(out_dir, 'road_debris_litter.png'))
# Roadside oil splatter:
src_img.crop((900, 410, 965, 475)).save(os.path.join(out_dir, 'road_oil_splatter.png'))

print("All street tiles successfully sliced into:", out_dir)
