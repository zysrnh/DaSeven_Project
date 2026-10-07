import React, { useEffect, useRef, useState } from 'react';
import type { Direction, Enemy, Player } from '../types/game';
import { getSprite, type SpriteId } from '../utils/sprites';
import { getRandomEnemy } from '../data/enemies';
import { playSound } from '../utils/audio';

interface StreetMapProps {
  player: Player;
  onEncounter: (enemy: Enemy) => void;
  onReturnToSchool: () => void;
}

const TILE_SIZE = 64;
const MAP_COLS = 40;
const MAP_ROWS = 28;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

// 0: Asphalt Plain, 1: Solid Wall / Boundary, 2: Road Curb Strip, 3: Dirt/Grass Edge, 4: Gravel Asphalt
const STREET_TILES: number[][] = Array.from({ length: MAP_ROWS }, (_, r) => {
  return Array.from({ length: MAP_COLS }, (_, c) => {
    // Outer boundaries
    if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) return 1;

    // Top sidewalk curb line (Row 1)
    if (r === 1) return 2;

    // Bottom dirt transition (Row 26)
    if (r >= 25) return 3;

    // Gravel side strip (Cols 1-2 and 37-38)
    if (c <= 2 || c >= 37) return 4;

    // Default asphalt road
    return 0;
  });
});

interface StreetProp {
  id: string;
  imgKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isDecal?: boolean;
  collision?: { ox: number; oy: number; ow: number; oh: number };
}

// Street Map Objects & Road Markings Placed
const STREET_PROPS: StreetProp[] = [
  // 1. JALAN RAYA UTAMA (MAIN ROADWAY) - Y: 700 - 1100
  // Double Yellow Centerline Horizontal
  { id: 'road_yellow_h1', imgKey: 'tile_road_yellow_h', x: 200, y: 880, w: 450, h: 40, isDecal: true },
  { id: 'road_yellow_h2', imgKey: 'tile_road_yellow_h', x: 650, y: 880, w: 450, h: 40, isDecal: true },
  { id: 'road_yellow_cross', imgKey: 'tile_road_yellow_intersection_1', x: 1100, y: 780, w: 220, h: 220, isDecal: true },
  { id: 'road_yellow_h3', imgKey: 'tile_road_yellow_h', x: 1320, y: 880, w: 500, h: 40, isDecal: true },
  { id: 'road_yellow_h4', imgKey: 'tile_road_yellow_h', x: 1820, y: 880, w: 500, h: 40, isDecal: true },

  // Double Yellow Centerline Vertical (Persimpangan)
  { id: 'road_yellow_v1', imgKey: 'tile_road_yellow_v', x: 1180, y: 350, w: 60, h: 430, isDecal: true },
  { id: 'road_yellow_v2', imgKey: 'tile_road_yellow_v', x: 1180, y: 1000, w: 60, h: 500, isDecal: true },

  // White Dashed Lane Dividers (Jalur Utara & Selatan)
  { id: 'white_dash_1', imgKey: 'tile_road_white_dashed', x: 300, y: 800, w: 140, h: 45, isDecal: true },
  { id: 'white_dash_2', imgKey: 'tile_road_white_dashed', x: 600, y: 800, w: 140, h: 45, isDecal: true },
  { id: 'white_dash_3', imgKey: 'tile_road_white_dashed', x: 1450, y: 800, w: 140, h: 45, isDecal: true },
  { id: 'white_dash_4', imgKey: 'tile_road_white_dashed', x: 1750, y: 800, w: 140, h: 45, isDecal: true },

  { id: 'white_dash_b1', imgKey: 'tile_road_white_dashed', x: 300, y: 980, w: 140, h: 45, isDecal: true },
  { id: 'white_dash_b2', imgKey: 'tile_road_white_dashed', x: 600, y: 980, w: 140, h: 45, isDecal: true },
  { id: 'white_dash_b3', imgKey: 'tile_road_white_dashed', x: 1450, y: 980, w: 140, h: 45, isDecal: true },
  { id: 'white_dash_b4', imgKey: 'tile_road_white_dashed', x: 1750, y: 980, w: 140, h: 45, isDecal: true },

  // Marka Panah Arah Jalan
  { id: 'arrow_str_1', imgKey: 'tile_arrow_straight', x: 450, y: 790, w: 45, h: 60, isDecal: true },
  { id: 'arrow_str_2', imgKey: 'tile_arrow_straight', x: 1600, y: 790, w: 45, h: 60, isDecal: true },
  { id: 'arrow_turn_1', imgKey: 'tile_arrow_turn_right', x: 950, y: 790, w: 50, h: 60, isDecal: true },
  { id: 'arrow_combo_1', imgKey: 'tile_arrow_combo', x: 1180, y: 650, w: 55, h: 60, isDecal: true },

  // 2. AREA PARKIRAN MOTOR BALEENDAH (Y: 200 - 550, X: 200 - 1000)
  { id: 'parkir_slots_top1', imgKey: 'tile_parking_motor_slots_top', x: 260, y: 220, w: 260, h: 75, isDecal: true },
  { id: 'parkir_slots_top2', imgKey: 'tile_parking_motor_slots_top', x: 540, y: 220, w: 260, h: 75, isDecal: true },
  { id: 'parkir_diagonal_top', imgKey: 'tile_parking_diagonal_box_top', x: 820, y: 220, w: 200, h: 75, isDecal: true },

  { id: 'parkir_slots_bot1', imgKey: 'tile_parking_motor_slots_bottom', x: 260, y: 380, w: 260, h: 75, isDecal: true },
  { id: 'parkir_slots_bot2', imgKey: 'tile_parking_motor_slots_bottom', x: 540, y: 380, w: 260, h: 75, isDecal: true },
  { id: 'parkir_diagonal_bot', imgKey: 'tile_parking_diagonal_box_bottom', x: 820, y: 380, w: 200, h: 75, isDecal: true },

  // Parkiran Motor Kendaraan
  { id: 'motor_parkir_1', imgKey: 'prop_motor_matic_1', x: 300, y: 230, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_parkir_2', imgKey: 'prop_motor_matic_2', x: 380, y: 230, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_parkir_3', imgKey: 'prop_motor_matic_1', x: 580, y: 230, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_parkir_4', imgKey: 'prop_motor_matic_2', x: 660, y: 230, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_parkir_5', imgKey: 'prop_motor_matic_1', x: 340, y: 390, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_parkir_6', imgKey: 'prop_motor_matic_2', x: 620, y: 390, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },

  // Tempat Sampah & Pot di Area Parkir
  { id: 'trash_parkir', imgKey: 'prop_tempat_sampah_3', x: 1040, y: 240, w: 140, h: 78, collision: { ox: 10, oy: 30, ow: 120, oh: 45 } },
  { id: 'pot_parkir_1', imgKey: 'tile_tanaman_pot', x: 200, y: 220, w: 55, h: 90, collision: { ox: 5, oy: 40, ow: 45, oh: 45 } },
  { id: 'pot_parkir_2', imgKey: 'tile_tanaman_pot', x: 200, y: 380, w: 55, h: 90, collision: { ox: 5, oy: 40, ow: 45, oh: 45 } },

  // 3. JALANAN RUSAK, RETAKAN, LUBANG, DAN GENANGAN AIR (ROAD DETAILS)
  { id: 'crack_sp1', imgKey: 'tile_crack_spider', x: 500, y: 1150, w: 65, h: 65, isDecal: true },
  { id: 'crack_sp2', imgKey: 'tile_crack_spider', x: 1550, y: 700, w: 65, h: 65, isDecal: true },
  { id: 'crack_deep1', imgKey: 'tile_crack_deep', x: 800, y: 1250, w: 70, h: 70, isDecal: true },
  { id: 'crack_deep2', imgKey: 'tile_crack_deep', x: 1950, y: 920, w: 70, h: 70, isDecal: true },

  { id: 'pothole_sh1', imgKey: 'tile_pothole_shallow', x: 350, y: 1300, w: 75, h: 75, isDecal: true },
  { id: 'pothole_sh2', imgKey: 'tile_pothole_shallow', x: 1700, y: 1100, w: 75, h: 75, isDecal: true },
  { id: 'pothole_dp1', imgKey: 'tile_pothole_deep', x: 1050, y: 1350, w: 85, h: 80, isDecal: true },
  { id: 'pothole_lg1', imgKey: 'tile_pothole_large', x: 1400, y: 1300, w: 90, h: 80, isDecal: true },

  { id: 'puddle_1', imgKey: 'tile_puddle_water', x: 600, y: 1350, w: 90, h: 70, isDecal: true },
  { id: 'puddle_2', imgKey: 'tile_puddle_water', x: 1850, y: 1320, w: 90, h: 70, isDecal: true },
  { id: 'oil_stain_1', imgKey: 'tile_asphalt_oil_stain', x: 920, y: 950, w: 75, h: 70, isDecal: true },
  { id: 'oil_splat_1', imgKey: 'tile_road_oil_splatter', x: 1250, y: 1180, w: 70, h: 70, isDecal: true },

  // 4. PINGGIRAN TANAH & SAMPAH TEPI JALAN
  { id: 'dirt_edge_l1', imgKey: 'tile_road_dirt_edge_left', x: 150, y: 1450, w: 70, h: 140, isDecal: true },
  { id: 'dirt_edge_r1', imgKey: 'tile_road_dirt_edge_right', x: 2200, y: 1450, w: 70, h: 140, isDecal: true },
  { id: 'grass_moss_1', imgKey: 'tile_road_grass_moss_edge', x: 750, y: 1480, w: 80, h: 140, isDecal: true },
  { id: 'grass_moss_2', imgKey: 'tile_road_grass_moss_edge', x: 1600, y: 1480, w: 80, h: 140, isDecal: true },
  { id: 'debris_1', imgKey: 'tile_road_debris_litter', x: 420, y: 1480, w: 75, h: 80, isDecal: true },
  { id: 'debris_2', imgKey: 'tile_road_debris_litter', x: 1350, y: 1480, w: 75, h: 80, isDecal: true },
];

interface RoamingThug {
  id: string;
  x: number;
  y: number;
  vx: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
}

export const StreetMap: React.FC<StreetMapProps> = ({ player, onEncounter, onReturnToSchool }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Position & Direction in Street Map
  const playerPosRef = useRef({ x: 1180, y: 800 });
  const playerDirRef = useRef<Direction>('down');
  const isMovingRef = useRef(false);
  const animTimerRef = useRef(0);
  const animFrameRef = useRef(0);
  const idleTimerRef = useRef(0);
  const idleFrameRef = useRef(0);
  const stepSoundTimerRef = useRef(0);

  // Camera coordinates (Smooth Follow)
  const cameraRef = useRef({ x: 1180, y: 800 });
  const [viewportSize, setViewportSize] = useState({ w: 1024, h: 640 });

  const keysDownRef = useRef<Set<string>>(new Set());

  // Images Cache
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportSize({
          w: Math.max(640, Math.floor(rect.width)),
          h: Math.max(480, Math.floor(rect.height)),
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload all assets
  useEffect(() => {
    const assetList: Record<string, string> = {
      // Character Sprites (Maine)
      idle_1: '/assets/characters/maine/idle_1.png',
      idle_2: '/assets/characters/maine/idle_2.png',
      idle_3: '/assets/characters/maine/idle_3.png',
      walk_front_1: '/assets/characters/maine/walk_front_1.png',
      walk_front_2: '/assets/characters/maine/walk_front_2.png',
      walk_front_3: '/assets/characters/maine/walk_front_3.png',
      walk_side_1: '/assets/characters/maine/walk_side_1.png',
      walk_side_2: '/assets/characters/maine/walk_side_2.png',
      walk_side_3: '/assets/characters/maine/walk_side_3.png',
      walk_up_1: '/assets/characters/maine/walk_up_1.png',
      walk_up_2: '/assets/characters/maine/walk_up_2.png',
      walk_up_3: '/assets/characters/maine/walk_up_3.png',
      hero_avatar: '/assets/characters/maine/avatar.png',

      // Sliced Street Map Tiles
      tile_asphalt_plain: '/assets/maps/street/asphalt_plain.png',
      tile_asphalt_worn: '/assets/maps/street/asphalt_worn.png',
      tile_asphalt_gravel: '/assets/maps/street/asphalt_gravel_dark.png',
      tile_asphalt_pebbles: '/assets/maps/street/asphalt_pebbles.png',
      tile_asphalt_curb: '/assets/maps/street/asphalt_curb_strip.png',

      tile_crack_spider: '/assets/maps/street/crack_spider.png',
      tile_crack_deep: '/assets/maps/street/crack_deep.png',
      tile_pothole_shallow: '/assets/maps/street/pothole_shallow.png',
      tile_pothole_deep: '/assets/maps/street/pothole_deep.png',
      tile_pothole_large: '/assets/maps/street/pothole_large.png',
      tile_puddle_water: '/assets/maps/street/puddle_water.png',
      tile_asphalt_oil_stain: '/assets/maps/street/asphalt_oil_stain.png',
      tile_road_oil_splatter: '/assets/maps/street/road_oil_splatter.png',

      tile_parking_motor_slots_top: '/assets/maps/street/parking_motor_slots_top.png',
      tile_parking_motor_slots_bottom: '/assets/maps/street/parking_motor_slots_bottom.png',
      tile_parking_diagonal_box_top: '/assets/maps/street/parking_diagonal_box_top.png',
      tile_parking_diagonal_box_bottom: '/assets/maps/street/parking_diagonal_box_bottom.png',

      tile_road_yellow_h: '/assets/maps/street/road_yellow_double_h.png',
      tile_road_yellow_v: '/assets/maps/street/road_yellow_double_v.png',
      tile_road_yellow_intersection_1: '/assets/maps/street/road_yellow_intersection_1.png',

      tile_road_white_dashed: '/assets/maps/street/road_white_dashed.png',
      tile_arrow_straight: '/assets/maps/street/arrow_straight.png',
      tile_arrow_turn_right: '/assets/maps/street/arrow_turn_right.png',
      tile_arrow_combo: '/assets/maps/street/arrow_combo.png',

      tile_road_dirt_edge_left: '/assets/maps/street/road_dirt_edge_left.png',
      tile_road_dirt_edge_right: '/assets/maps/street/road_dirt_edge_right.png',
      tile_road_grass_moss_edge: '/assets/maps/street/road_grass_moss_edge.png',
      tile_road_debris_litter: '/assets/maps/street/road_debris_litter.png',

      // Props
      prop_motor_matic_1: '/assets/maps/smkn7/props/prop_motor_matic_1.png',
      prop_motor_matic_2: '/assets/maps/smkn7/props/prop_motor_matic_2.png',
      prop_tempat_sampah_3: '/assets/maps/smkn7/props/prop_tempat_sampah_3.png',
      tile_tanaman_pot: '/assets/maps/smkn7/tiles/tile_tanaman_pot.png',
    };

    let count = 0;
    const total = Object.keys(assetList).length;

    Object.entries(assetList).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        count++;
        if (count >= total) setImagesLoaded(true);
      };
      img.onerror = () => {
        count++;
        if (count >= total) setImagesLoaded(true);
      };
      imagesRef.current[key] = img;
    });
  }, []);

  // Roaming Street Monsters
  const monstersRef = useRef<RoamingThug[]>([
    { id: 's1', x: 450, y: 850, vx: 45, spriteKey: 'void_eyeball' },
    { id: 's2', x: 1550, y: 850, vx: -40, spriteKey: 'glitch_monolith' },
    { id: 's3', x: 800, y: 1300, vx: 35, spriteKey: 'cosmic_slime' },
    { id: 's4', x: 1200, y: 400, vx: -30, spriteKey: 'void_eyeball' },
  ]);

  const tickRef = useRef(0);

  // Collision Checking
  const checkCollisionAt = (px: number, py: number): boolean => {
    const feetLeft = px - 16;
    const feetRight = px + 16;
    const feetTop = py + 20;
    const feetBottom = py + 38;

    // Boundaries
    if (feetLeft < 64 || feetRight >= WORLD_WIDTH - 64 || feetTop < 64 || feetBottom >= WORLD_HEIGHT - 64) {
      return true;
    }

    // Grid Wall Collision
    const minCol = Math.floor(feetLeft / TILE_SIZE);
    const maxCol = Math.floor(feetRight / TILE_SIZE);
    const minRow = Math.floor(feetTop / TILE_SIZE);
    const maxRow = Math.floor(feetBottom / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
          if (STREET_TILES[r][c] === 1) {
            return true;
          }
        }
      }
    }

    // Props Collision
    for (const prop of STREET_PROPS) {
      if (prop.collision) {
        const cLeft = prop.x + prop.collision.ox;
        const cRight = cLeft + prop.collision.ow;
        const cTop = prop.y + prop.collision.oy;
        const cBottom = cTop + prop.collision.oh;

        if (feetRight > cLeft && feetLeft < cRight && feetBottom > cTop && feetTop < cBottom) {
          return true;
        }
      }
    }

    return false;
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(code)) {
        e.preventDefault();
        keysDownRef.current.add(code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let lastTime = performance.now();
    let animId: number;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      tickRef.current++;

      // 1. MOVEMENT INPUT
      let dx = 0;
      let dy = 0;

      const keys = keysDownRef.current;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

      if (dx < 0) playerDirRef.current = 'left';
      else if (dx > 0) playerDirRef.current = 'right';
      else if (dy < 0) playerDirRef.current = 'up';
      else if (dy > 0) playerDirRef.current = 'down';

      const isMoving = dx !== 0 || dy !== 0;
      isMovingRef.current = isMoving;

      if (isMoving) {
        const len = Math.hypot(dx, dy) || 1;
        const speed = 210;
        const moveX = (dx / len) * speed * dt;
        const moveY = (dy / len) * speed * dt;

        const cur = playerPosRef.current;
        if (!checkCollisionAt(cur.x + moveX, cur.y)) cur.x += moveX;
        if (!checkCollisionAt(cur.x, cur.y + moveY)) cur.y += moveY;

        stepSoundTimerRef.current += dt;
        if (stepSoundTimerRef.current > 0.22) {
          stepSoundTimerRef.current = 0;
          playSound.step();
        }

        animTimerRef.current += dt;
        if (animTimerRef.current > 0.12) {
          animTimerRef.current = 0;
          animFrameRef.current = (animFrameRef.current + 1) % 4;
        }
      } else {
        animFrameRef.current = 0;
        stepSoundTimerRef.current = 0.15;

        idleTimerRef.current += dt;
        if (idleTimerRef.current > 0.45) {
          idleTimerRef.current = 0;
          idleFrameRef.current = (idleFrameRef.current + 1) % 3;
        }
      }

      // 2. CAMERA FOLLOW
      const targetCamX = playerPosRef.current.x - viewportSize.w / 2;
      const targetCamY = playerPosRef.current.y - viewportSize.h / 2;
      const maxCamX = WORLD_WIDTH - viewportSize.w;
      const maxCamY = WORLD_HEIGHT - viewportSize.h;

      const clampedTargetX = Math.max(0, Math.min(maxCamX, targetCamX));
      const clampedTargetY = Math.max(0, Math.min(maxCamY, targetCamY));

      cameraRef.current.x += (clampedTargetX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (clampedTargetY - cameraRef.current.y) * 0.12;

      const camX = Math.round(cameraRef.current.x);
      const camY = Math.round(cameraRef.current.y);

      // 3. ENCOUNTERS
      monstersRef.current.forEach((m) => {
        m.x += m.vx * dt;
        if (m.x < 300 || m.x > 2100) m.vx *= -1;
      });

      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;

      for (let i = 0; i < monstersRef.current.length; i++) {
        const m = monstersRef.current[i];
        if (Math.hypot(pX - m.x, pY - m.y) < 40) {
          playSound.encounter();
          const enemy = getRandomEnemy();
          monstersRef.current.splice(i, 1);
          cancelAnimationFrame(animId);
          onEncounter(enemy);
          return;
        }
      }

      // 4. DRAW BASE FLOORS (Textured Asphalt & Pavement)
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(0, 0, viewportSize.w, viewportSize.h);

      const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
      const endCol = Math.min(MAP_COLS, Math.ceil((camX + viewportSize.w) / TILE_SIZE));
      const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
      const endRow = Math.min(MAP_ROWS, Math.ceil((camY + viewportSize.h) / TILE_SIZE));

      const asphaltImg = imagesRef.current.tile_asphalt_plain;
      const asphaltWorn = imagesRef.current.tile_asphalt_worn;
      const asphaltGravel = imagesRef.current.tile_asphalt_gravel;
      const asphaltCurb = imagesRef.current.tile_asphalt_curb;

      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          const tType = STREET_TILES[r][c];
          const scrX = c * TILE_SIZE - camX;
          const scrY = r * TILE_SIZE - camY;

          if (tType === 0) {
            // Main Asphalt Road
            const img = (r + c) % 3 === 0 ? asphaltWorn : asphaltImg;
            if (img && img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, scrX, scrY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#1e242d';
              ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            }
          } else if (tType === 2) {
            // Sidewalk / Curb Strip
            if (asphaltCurb && asphaltCurb.complete && asphaltCurb.naturalWidth > 0) {
              ctx.drawImage(asphaltCurb, scrX, scrY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#64748b';
              ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            }
          } else if (tType === 3) {
            // Dirt Grass Transition
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#152019';
            ctx.fillRect(scrX, scrY + 20, TILE_SIZE, TILE_SIZE - 20);
          } else if (tType === 4) {
            // Gravel Side Pavement
            if (asphaltGravel && asphaltGravel.complete && asphaltGravel.naturalWidth > 0) {
              ctx.drawImage(asphaltGravel, scrX, scrY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#334155';
              ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            }
          } else if (tType === 1) {
            // Solid Outer Road Barrier
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(scrX + 2, scrY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          }
        }
      }

      // 5. Y-SORTED ENTITIES (Props, Decals, Monsters, Player)
      interface RenderEntity {
        yOrder: number;
        draw: () => void;
      }

      const entities: RenderEntity[] = [];

      // Add Props & Street Markings
      STREET_PROPS.forEach((prop) => {
        const scrX = prop.x - camX;
        const scrY = prop.y - camY;

        if (
          scrX + prop.w >= -100 &&
          scrX <= viewportSize.w + 100 &&
          scrY + prop.h >= -100 &&
          scrY <= viewportSize.h + 100
        ) {
          const img = imagesRef.current[prop.imgKey];
          // Ground decals stay under characters
          const yFoot = prop.isDecal ? 50 : (prop.collision ? prop.y + prop.collision.oy + prop.collision.oh : prop.y + prop.h);

          entities.push({
            yOrder: yFoot,
            draw: () => {
              if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, scrX, scrY, prop.w, prop.h);
              }
            },
          });
        }
      });

      // Add Monsters
      const animStep = Math.floor(tickRef.current / 16) % 2;
      monstersRef.current.forEach((m) => {
        const scrX = m.x - camX;
        const scrY = m.y - camY;
        const spriteKey = `${m.spriteKey}_${animStep}` as SpriteId;
        const monsterCanvas = getSprite(spriteKey);

        entities.push({
          yOrder: m.y + 16,
          draw: () => {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.beginPath();
            ctx.arc(scrX, scrY + 16, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.drawImage(monsterCanvas, scrX - 24, scrY - 24, 48, 48);
          },
        });
      });

      // Add Player
      const dir = playerDirRef.current;
      const stepPhase = animFrameRef.current;
      const walkFrameIdx = stepPhase === 3 ? 2 : stepPhase + 1;

      let activeSpriteKey = 'idle_1';
      if (isMoving) {
        if (dir === 'down') activeSpriteKey = `walk_front_${walkFrameIdx}`;
        else if (dir === 'up') activeSpriteKey = `walk_up_${walkFrameIdx}`;
        else activeSpriteKey = `walk_side_${walkFrameIdx}`;
      } else {
        if (dir === 'down') activeSpriteKey = `idle_${idleFrameRef.current + 1}`;
        else if (dir === 'up') activeSpriteKey = 'walk_up_2';
        else activeSpriteKey = 'walk_side_2';
      }

      const playerImg = imagesRef.current[activeSpriteKey];
      const pScrX = pX - camX;
      const pScrY = pY - camY;

      entities.push({
        yOrder: pY + 36,
        draw: () => {
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath();
          ctx.ellipse(pScrX, pScrY + 36, 20, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(pScrX, pScrY);

          if (dir === 'left') {
            ctx.scale(-1, 1);
          }

          const stepBob = isMoving && (stepPhase === 1 || stepPhase === 3) ? -3 : 0;

          if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
            const aspect = playerImg.naturalWidth / playerImg.naturalHeight;
            const targetH = 92;
            const targetW = targetH * aspect;
            ctx.drawImage(playerImg, -targetW / 2, -56 + stepBob, targetW, targetH);
          }
          ctx.restore();
        },
      });

      // Sort and Draw
      entities.sort((a, b) => a.yOrder - b.yOrder);
      entities.forEach((e) => e.draw());

      // Subtle Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      for (let y = 0; y < viewportSize.h; y += 4) {
        ctx.fillRect(0, y, viewportSize.w, 1.5);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [onEncounter, imagesLoaded, viewportSize]);

  // Virtual keys
  const startVirtualKey = (key: string) => keysDownRef.current.add(key);
  const stopVirtualKey = (key: string) => keysDownRef.current.delete(key);

  // Dynamic Street Zone
  const curY = playerPosRef.current.y;
  let currentZoneName = 'JALAN RAYA BALEENDAH (JALUR UTAMA)';
  if (curY < 600) currentZoneName = 'PARKIRAN MOTOR & TROTOAR LUAR';
  else if (curY > 1100) currentZoneName = 'GANG ASPAL RETAK & TEPI TANAH';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#07090e] text-white font-mono select-none flex flex-col justify-between"
    >
      {/* TOP HUD BAR */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-3 bg-[#111827]/95 backdrop-blur border-2 border-[#374151] p-2.5 shadow-2xl">
          <img
            src="/assets/characters/maine/avatar.png"
            alt="Hero Avatar"
            className="w-11 h-11 object-contain bg-[#0f172a] border border-yellow-500/70 p-0.5 shadow"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-yellow-400 text-sm tracking-wide">{player.name}</span>
              <span className="text-[10px] text-cyan-300 font-bold bg-[#1e293b] px-2 py-0.5 border border-[#334155]">
                {player.jurusan}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-300 mt-0.5">
              <span>🛣 MAP JALAN RAYA (STREET)</span>
              <span className="text-yellow-500">•</span>
              <span className="text-amber-400 font-bold uppercase">{currentZoneName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 pointer-events-auto">
          <button
            onClick={onReturnToSchool}
            className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#34d399] shadow-2xl flex items-center gap-1.5 cursor-pointer"
          >
            <span>🏫 KEMBALI KE SMKN 7</span>
            <span>➔</span>
          </button>

          <div className="flex items-center space-x-3 bg-[#111827]/95 backdrop-blur border-2 border-[#374151] px-4 py-2.5 shadow-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">STAMINA & HP SISWA</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-3 bg-[#2d1216] border border-[#66222b] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {player.hp}/{player.maxHp}
                </span>
              </div>
            </div>
            <div className="w-3.5 h-3.5 bg-yellow-400 animate-ping rounded-full" />
          </div>
        </div>
      </div>

      {/* FULLSCREEN RESPONSIVE CANVAS */}
      <div className="w-full h-full">
        <canvas
          ref={canvasRef}
          width={viewportSize.w}
          height={viewportSize.h}
          className="w-full h-full block [image-rendering:pixelated]"
        />
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-end justify-between pointer-events-none">
        <div className="bg-[#111827]/95 backdrop-blur border-2 border-[#374151] p-3 text-xs max-w-md pointer-events-auto">
          <p className="font-bold text-yellow-400 mb-0.5">🎮 KONTROL MAP JALAN RAYA (STREET):</p>
          <p className="text-neutral-300 text-[11px] leading-tight">
            Gunakan tombol <strong className="text-white">WASD</strong> atau <strong className="text-white">Panah</strong>. Jelajahi Persimpangan Jalan Raya, Area Parkir Motor, Jalur Cepat Bergaris Putih, dan Gang Aspal Berlubang!
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 w-32 pointer-events-auto bg-[#111827]/95 p-2 border-2 border-[#374151]">
          <div />
          <button
            onMouseDown={() => startVirtualKey('KeyW')}
            onMouseUp={() => stopVirtualKey('KeyW')}
            onMouseLeave={() => stopVirtualKey('KeyW')}
            onTouchStart={() => startVirtualKey('KeyW')}
            onTouchEnd={() => stopVirtualKey('KeyW')}
            className="p-2.5 bg-[#1f2937] hover:bg-[#374151] active:bg-[#4b5563] text-white border border-[#4b5563] font-black text-sm text-center"
          >
            ▲
          </button>
          <div />
          <button
            onMouseDown={() => startVirtualKey('KeyA')}
            onMouseUp={() => stopVirtualKey('KeyA')}
            onMouseLeave={() => stopVirtualKey('KeyA')}
            onTouchStart={() => startVirtualKey('KeyA')}
            onTouchEnd={() => stopVirtualKey('KeyA')}
            className="p-2.5 bg-[#1f2937] hover:bg-[#374151] active:bg-[#4b5563] text-white border border-[#4b5563] font-black text-sm text-center"
          >
            ◀
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyS')}
            onMouseUp={() => stopVirtualKey('KeyS')}
            onMouseLeave={() => stopVirtualKey('KeyS')}
            onTouchStart={() => startVirtualKey('KeyS')}
            onTouchEnd={() => stopVirtualKey('KeyS')}
            className="p-2.5 bg-[#1f2937] hover:bg-[#374151] active:bg-[#4b5563] text-white border border-[#4b5563] font-black text-sm text-center"
          >
            ▼
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyD')}
            onMouseUp={() => stopVirtualKey('KeyD')}
            onMouseLeave={() => stopVirtualKey('KeyD')}
            onTouchStart={() => startVirtualKey('KeyD')}
            onTouchEnd={() => stopVirtualKey('KeyD')}
            className="p-2.5 bg-[#1f2937] hover:bg-[#374151] active:bg-[#4b5563] text-white border border-[#4b5563] font-black text-sm text-center"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
