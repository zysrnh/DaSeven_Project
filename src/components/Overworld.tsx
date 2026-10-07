import React, { useEffect, useRef, useState } from 'react';
import type { Direction, Enemy, Player } from '../types/game';
import { getSprite, type SpriteId } from '../utils/sprites';
import { getRandomEnemy } from '../data/enemies';
import { playSound } from '../utils/audio';

interface OverworldProps {
  player: Player;
  onEncounter: (enemy: Enemy) => void;
}

const TILE_SIZE = 64;
const MAP_COLS = 36;
const MAP_ROWS = 26;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

// Floor Types: 0: Paved Outdoor, 1: Solid Wall, 2: Hallway White Ceramic, 3: Lab Blue Anti-static, 4: Green Grass Garden
const MAP_TILES: number[][] = Array.from({ length: MAP_ROWS }, (_, r) => {
  return Array.from({ length: MAP_COLS }, (_, c) => {
    // Outer Borders
    if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) return 1;
    
    // Zone 1: Outdoor Courtyard & Parking (Rows 1 to 7)
    if (r < 8) {
      if (r < 3 && c > 11 && c < 25) return 4; // Green garden lawn
      return 0; // Dark asphalt/paved courtyard
    }
    
    // Building Exterior Wall & Entrance (Row 8)
    if (r === 8) {
      if (c === 17 || c === 18) return 2; // Main entrance doorway
      return 1; // Wall
    }
    
    // Zone 2: Main Hallway (Rows 9 to 13)
    if (r >= 9 && r <= 13) {
      return 2; // White ceramic hallway
    }
    
    // Wall Divider between Hallway & Lab (Row 14)
    if (r === 14) {
      if (c === 8 || c === 9 || c === 17 || c === 18 || c === 26 || c === 27) return 2; // Door openings
      return 1;
    }
    
    // Zone 3: Computer Lab TKJ/RPL (Rows 15 to 24, Cols 1 to 24)
    if (c <= 24) {
      return 3; // Blue anti-static floor
    }
    
    // Zone 4: Ruang UKS & Tata Usaha (Rows 15 to 24, Cols 25 to 34)
    return 2; // White floor
  });
});

interface PropObject {
  id: string;
  imgKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  collision?: { ox: number; oy: number; ow: number; oh: number };
}

// Map Props Placed in SMKN 7 Baleendah
const MAP_PROPS: PropObject[] = [
  // 1. OUTDOOR GERBANG & PARKIRAN (Y: 100 - 450)
  {
    id: 'monumen_smkn7',
    imgKey: 'prop_monumen_smkn7',
    x: 1020,
    y: 110,
    w: 270,
    h: 215,
    collision: { ox: 20, oy: 90, ow: 230, oh: 115 },
  },
  {
    id: 'tanaman_pot_kiri',
    imgKey: 'tile_tanaman_pot',
    x: 960,
    y: 220,
    w: 60,
    h: 100,
    collision: { ox: 10, oy: 50, ow: 40, oh: 45 },
  },
  {
    id: 'tanaman_pot_kanan',
    imgKey: 'tile_tanaman_pot',
    x: 1300,
    y: 220,
    w: 60,
    h: 100,
    collision: { ox: 10, oy: 50, ow: 40, oh: 45 },
  },
  {
    id: 'parkiran_motor_1',
    imgKey: 'prop_parkiran_motor',
    x: 220,
    y: 160,
    w: 340,
    h: 147,
    collision: { ox: 15, oy: 50, ow: 310, oh: 90 },
  },
  {
    id: 'motor_matic_parkir',
    imgKey: 'prop_motor_matic_1',
    x: 600,
    y: 230,
    w: 80,
    h: 72,
    collision: { ox: 5, oy: 25, ow: 70, oh: 45 },
  },
  {
    id: 'tempat_sampah_outdoor',
    imgKey: 'prop_tempat_sampah_3',
    x: 1420,
    y: 220,
    w: 140,
    h: 78,
    collision: { ox: 10, oy: 30, ow: 120, oh: 45 },
  },

  // 2. KORIDOR KELAS & DINDING ATAS (Y: 460 - 850)
  {
    id: 'door_lab_tkj',
    imgKey: 'tile_door_lab',
    x: 1080,
    y: 470,
    w: 95,
    h: 145,
  },
  {
    id: 'door_kelas_rpl',
    imgKey: 'tile_door_kelas',
    x: 550,
    y: 470,
    w: 90,
    h: 145,
  },
  {
    id: 'door_kelas_multimedia',
    imgKey: 'tile_door_kelas',
    x: 1550,
    y: 470,
    w: 90,
    h: 145,
  },
  {
    id: 'banner_smk_bisa',
    imgKey: 'tile_banner_smk_bisa',
    x: 820,
    y: 490,
    w: 105,
    h: 75,
  },
  {
    id: 'foto_presiden',
    imgKey: 'tile_presiden_garuda',
    x: 1350,
    y: 490,
    w: 110,
    h: 60,
  },
  {
    id: 'lemari_piala_koridor',
    imgKey: 'tile_lemari_piala',
    x: 350,
    y: 495,
    w: 130,
    h: 120,
    collision: { ox: 10, oy: 40, ow: 110, oh: 75 },
  },
  {
    id: 'kursi_tunggu_koridor',
    imgKey: 'prop_kursi_susun',
    x: 1750,
    y: 540,
    w: 130,
    h: 60,
    collision: { ox: 10, oy: 20, ow: 110, oh: 35 },
  },

  // 3. LAB KOMPUTER / RUANG KELAS (Y: 920 - 1500, X: 100 - 1500)
  {
    id: 'blackboard_lab',
    imgKey: 'tile_blackboard',
    x: 320,
    y: 915,
    w: 220,
    h: 90,
  },
  {
    id: 'whiteboard_lab',
    imgKey: 'tile_whiteboard',
    x: 1120,
    y: 915,
    w: 200,
    h: 90,
  },
  {
    id: 'server_rack_1',
    imgKey: 'tile_server_racks',
    x: 140,
    y: 920,
    w: 125,
    h: 155,
    collision: { ox: 10, oy: 60, ow: 105, oh: 90 },
  },
  {
    id: 'pc_row_1',
    imgKey: 'tile_pc_desk_row',
    x: 240,
    y: 1120,
    w: 390,
    h: 140,
    collision: { ox: 15, oy: 40, ow: 360, oh: 90 },
  },
  {
    id: 'pc_row_2',
    imgKey: 'tile_pc_desk_row',
    x: 720,
    y: 1120,
    w: 390,
    h: 140,
    collision: { ox: 15, oy: 40, ow: 360, oh: 90 },
  },
  {
    id: 'pc_row_3',
    imgKey: 'tile_pc_desk_row',
    x: 1200,
    y: 1120,
    w: 310,
    h: 140,
    collision: { ox: 15, oy: 40, ow: 280, oh: 90 },
  },
  {
    id: 'plang_lab_gantung',
    imgKey: 'prop_plang_gantung',
    x: 930,
    y: 935,
    w: 155,
    h: 90,
  },
  {
    id: 'podium_guru_lab',
    imgKey: 'prop_podium',
    x: 650,
    y: 950,
    w: 85,
    h: 120,
    collision: { ox: 10, oy: 45, ow: 65, oh: 70 },
  },
  {
    id: 'meja_router_lab',
    imgKey: 'prop_router',
    x: 1320,
    y: 960,
    w: 85,
    h: 75,
    collision: { ox: 5, oy: 25, ow: 75, oh: 50 },
  },
  {
    id: 'dispenser_lab',
    imgKey: 'prop_dispenser_1',
    x: 1430,
    y: 940,
    w: 49,
    h: 134,
    collision: { ox: 5, oy: 50, ow: 40, oh: 80 },
  },

  // 4. RUANG TU & UKS (Y: 960 - 1500, X: 1600 - 2100)
  {
    id: 'fotokopi_tu',
    imgKey: 'prop_fotokopi_1',
    x: 1680,
    y: 1040,
    w: 98,
    h: 120,
    collision: { ox: 5, oy: 40, ow: 88, oh: 75 },
  },
  {
    id: 'meja_siswa_uks_1',
    imgKey: 'prop_meja_siswa_top',
    x: 1840,
    y: 1040,
    w: 155,
    h: 158,
    collision: { ox: 10, oy: 50, ow: 135, oh: 100 },
  },
  {
    id: 'kotak_uks_box',
    imgKey: 'prop_kotak_uks',
    x: 1700,
    y: 940,
    w: 60,
    h: 77,
  },
  {
    id: 'apar_koridor',
    imgKey: 'prop_apar_1',
    x: 1580,
    y: 940,
    w: 38,
    h: 76,
  },
];

interface RoamingMonster {
  id: string;
  x: number;
  y: number;
  vx: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
}

export const Overworld: React.FC<OverworldProps> = ({ player, onEncounter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Position & Direction
  const playerPosRef = useRef({ x: 1140, y: 360 });
  const playerDirRef = useRef<Direction>('down');
  const isMovingRef = useRef(false);
  const animTimerRef = useRef(0);
  const animFrameRef = useRef(0);
  const idleTimerRef = useRef(0);
  const idleFrameRef = useRef(0);
  const stepSoundTimerRef = useRef(0);

  // Camera coordinates (Smooth Follow)
  const cameraRef = useRef({ x: 1140, y: 360 });
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

      // Sliced Props (SMKN 7)
      prop_monumen_smkn7: '/assets/maps/smkn7/props/prop_monumen_smkn7.png',
      prop_plang_gantung: '/assets/maps/smkn7/props/prop_plang_gantung.png',
      prop_podium: '/assets/maps/smkn7/props/prop_podium.png',
      prop_meja_siswa_top: '/assets/maps/smkn7/props/prop_meja_siswa_top.png',
      prop_fotokopi_1: '/assets/maps/smkn7/props/prop_fotokopi_1.png',
      prop_router: '/assets/maps/smkn7/props/prop_router.png',
      prop_dispenser_1: '/assets/maps/smkn7/props/prop_dispenser_1.png',
      prop_kursi_susun: '/assets/maps/smkn7/props/prop_kursi_susun.png',
      prop_apar_1: '/assets/maps/smkn7/props/prop_apar_1.png',
      prop_kotak_uks: '/assets/maps/smkn7/props/prop_kotak_uks.png',
      prop_tempat_sampah_3: '/assets/maps/smkn7/props/prop_tempat_sampah_3.png',
      prop_kursi_tas_1: '/assets/maps/smkn7/props/prop_kursi_tas_1.png',
      prop_parkiran_motor: '/assets/maps/smkn7/props/prop_parkiran_motor.png',
      prop_motor_matic_1: '/assets/maps/smkn7/props/prop_motor_matic_1.png',

      // Sliced Tiles (SMKN 7)
      tile_floor_white: '/assets/maps/smkn7/tiles/tile_floor_white.png',
      tile_floor_blue: '/assets/maps/smkn7/tiles/tile_floor_blue.png',
      tile_wall_brick: '/assets/maps/smkn7/tiles/tile_wall_brick.png',
      tile_wall_hallway: '/assets/maps/smkn7/tiles/tile_wall_hallway.png',
      tile_door_wood: '/assets/maps/smkn7/tiles/tile_door_wood.png',
      tile_door_lab: '/assets/maps/smkn7/tiles/tile_door_lab.png',
      tile_door_kelas: '/assets/maps/smkn7/tiles/tile_door_kelas.png',
      tile_pc_desk_row: '/assets/maps/smkn7/tiles/tile_pc_desk_row.png',
      tile_server_racks: '/assets/maps/smkn7/tiles/tile_server_racks.png',
      tile_blackboard: '/assets/maps/smkn7/tiles/tile_blackboard.png',
      tile_whiteboard: '/assets/maps/smkn7/tiles/tile_whiteboard.png',
      tile_banner_smk_bisa: '/assets/maps/smkn7/tiles/tile_banner_smk_bisa.png',
      tile_presiden_garuda: '/assets/maps/smkn7/tiles/tile_presiden_garuda.png',
      tile_lemari_piala: '/assets/maps/smkn7/tiles/tile_lemari_piala.png',
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

  // Roaming Monsters
  const monstersRef = useRef<RoamingMonster[]>([
    { id: 'm1', x: 450, y: 700, vx: 35, spriteKey: 'void_eyeball' },
    { id: 'm2', x: 1350, y: 700, vx: -30, spriteKey: 'glitch_monolith' },
    { id: 'm3', x: 800, y: 1100, vx: 25, spriteKey: 'cosmic_slime' },
    { id: 'm4', x: 1250, y: 1350, vx: -28, spriteKey: 'void_eyeball' },
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
          if (MAP_TILES[r][c] === 1) {
            return true;
          }
        }
      }
    }

    // Props Collision
    for (const prop of MAP_PROPS) {
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
        if (m.x < 300 || m.x > 1800) m.vx *= -1;
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

      // 4. DRAW BASE FLOORS (Clean Seamless Canvas)
      ctx.fillStyle = '#0e1117';
      ctx.fillRect(0, 0, viewportSize.w, viewportSize.h);

      const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
      const endCol = Math.min(MAP_COLS, Math.ceil((camX + viewportSize.w) / TILE_SIZE));
      const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
      const endRow = Math.min(MAP_ROWS, Math.ceil((camY + viewportSize.h) / TILE_SIZE));

      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          const tType = MAP_TILES[r][c];
          const scrX = c * TILE_SIZE - camX;
          const scrY = r * TILE_SIZE - camY;

          if (tType === 0) {
            // Outdoor Paved Courtyard
            ctx.fillStyle = (r + c) % 2 === 0 ? '#1f242d' : '#1a1e26';
            ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#15181f';
            ctx.strokeRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
          } else if (tType === 4) {
            // Green Lawn Garden
            ctx.fillStyle = (r + c) % 2 === 0 ? '#1b4332' : '#143628';
            ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
          } else if (tType === 1) {
            // Solid Wall Boundary
            ctx.fillStyle = '#1e1115';
            ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#4a151b';
            ctx.fillRect(scrX + 2, scrY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (tType === 2) {
            // Hallway Clean White Ceramic
            ctx.fillStyle = (r + c) % 2 === 0 ? '#e2e8f0' : '#cbd5e1';
            ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#94a3b8';
            ctx.strokeRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
          } else if (tType === 3) {
            // Lab Anti-static Blue Floor
            ctx.fillStyle = (r + c) % 2 === 0 ? '#1e3a8a' : '#1d4ed8';
            ctx.fillRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#1e40af';
            ctx.strokeRect(scrX, scrY, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // 5. Y-SORTED ENTITIES (Props, Monsters, Player)
      interface RenderEntity {
        yOrder: number;
        draw: () => void;
      }

      const entities: RenderEntity[] = [];

      // Add Props
      MAP_PROPS.forEach((prop) => {
        const scrX = prop.x - camX;
        const scrY = prop.y - camY;

        if (
          scrX + prop.w >= -50 &&
          scrX <= viewportSize.w + 50 &&
          scrY + prop.h >= -50 &&
          scrY <= viewportSize.h + 50
        ) {
          const img = imagesRef.current[prop.imgKey];
          const yFoot = prop.collision ? prop.y + prop.collision.oy + prop.collision.oh : prop.y + prop.h;

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
            ctx.fillStyle = 'rgba(192, 38, 211, 0.3)';
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
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
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

  // Dynamic Zone Name
  const curX = playerPosRef.current.x;
  const curY = playerPosRef.current.y;
  let currentZoneName = 'GERBANG & MONUMEN UTAMA';
  if (curY > 520 && curY <= 900) currentZoneName = 'KORIDOR KELAS & PRESTASI';
  else if (curY > 900 && curX <= 1600) currentZoneName = 'LAB KOMPUTER & JARINGAN (TKJ/RPL)';
  else if (curY > 900 && curX > 1600) currentZoneName = 'RUANG TATA USAHA & UKS';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0f] text-white font-mono select-none flex flex-col justify-between"
    >
      {/* TOP HUD BAR */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-3 bg-[#12121c]/90 backdrop-blur border-2 border-[#383850] p-2.5 shadow-2xl">
          <img
            src="/assets/characters/maine/avatar.png"
            alt="Hero Avatar"
            className="w-11 h-11 object-contain bg-[#09090e] border border-yellow-500/70 p-0.5 shadow"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-yellow-400 text-sm tracking-wide">{player.name}</span>
              <span className="text-[10px] text-cyan-300 font-bold bg-[#1e293b] px-2 py-0.5 border border-[#334155]">
                {player.jurusan}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-300 mt-0.5">
              <span>🏫 SMK NEGERI 7 BALEENDAH</span>
              <span className="text-yellow-500">•</span>
              <span className="text-emerald-400 font-bold uppercase">{currentZoneName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-[#12121c]/90 backdrop-blur border-2 border-[#383850] px-4 py-2.5 shadow-2xl">
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
          <div className="w-3.5 h-3.5 bg-red-500 animate-ping rounded-full" />
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
        <div className="bg-[#12121c]/90 backdrop-blur border-2 border-[#383850] p-3 text-xs max-w-md pointer-events-auto">
          <p className="font-bold text-yellow-400 mb-0.5">🎮 KONTROL JELAJAH SMKN 7 BALEENDAH:</p>
          <p className="text-neutral-300 text-[11px] leading-tight">
            Gunakan tombol <strong className="text-white">WASD</strong> atau <strong className="text-white">Panah</strong>. Jelajahi Monumen Utama, Parkiran Motor, Koridor Kelas, dan Lab Jaringan!
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 w-32 pointer-events-auto bg-[#12121c]/90 p-2 border-2 border-[#383850]">
          <div />
          <button
            onMouseDown={() => startVirtualKey('KeyW')}
            onMouseUp={() => stopVirtualKey('KeyW')}
            onMouseLeave={() => stopVirtualKey('KeyW')}
            onTouchStart={() => startVirtualKey('KeyW')}
            onTouchEnd={() => stopVirtualKey('KeyW')}
            className="p-2.5 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-black text-sm text-center"
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
            className="p-2.5 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-black text-sm text-center"
          >
            ◀
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyS')}
            onMouseUp={() => stopVirtualKey('KeyS')}
            onMouseLeave={() => stopVirtualKey('KeyS')}
            onTouchStart={() => startVirtualKey('KeyS')}
            onTouchEnd={() => stopVirtualKey('KeyS')}
            className="p-2.5 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-black text-sm text-center"
          >
            ▼
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyD')}
            onMouseUp={() => stopVirtualKey('KeyD')}
            onMouseLeave={() => stopVirtualKey('KeyD')}
            onTouchStart={() => startVirtualKey('KeyD')}
            onTouchEnd={() => stopVirtualKey('KeyD')}
            className="p-2.5 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-black text-sm text-center"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
