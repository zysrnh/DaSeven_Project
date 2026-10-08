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
const MAP_COLS = 42;
const MAP_ROWS = 26;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;   // 2688 px
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE; // 1664 px

interface StreetProp {
  id: string;
  imgKey?: string;
  type?: 'pot_plant' | 'street_lamp' | 'bench';
  x: number;
  y: number;
  w: number;
  h: number;
  collision?: { ox: number; oy: number; ow: number; oh: number };
}

// Props diletakkan dengan proporsi yang pas dan selaras
const STREET_PROPS: StreetProp[] = [
  // 1. TROTOAR UTARA (Sisi Kiri Gerbang)
  { id: 'lamp_u1', type: 'street_lamp', x: 140, y: 220, w: 32, h: 90, collision: { ox: 8, oy: 70, ow: 16, oh: 18 } },
  { id: 'pot_u1', type: 'pot_plant', x: 200, y: 245, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'motor_u1', imgKey: 'prop_motor_matic_1', x: 280, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u2', imgKey: 'prop_motor_matic_2', x: 370, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u3', imgKey: 'prop_motor_matic_1', x: 460, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'pot_u2', type: 'pot_plant', x: 570, y: 245, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'sampah_u1', imgKey: 'prop_tempat_sampah_3', x: 650, y: 248, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'bench_u1', type: 'bench', x: 800, y: 250, w: 80, h: 48, collision: { ox: 4, oy: 15, ow: 72, oh: 30 } },
  { id: 'pot_u3', type: 'pot_plant', x: 910, y: 245, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'lamp_u2', type: 'street_lamp', x: 1050, y: 220, w: 32, h: 90, collision: { ox: 8, oy: 70, ow: 16, oh: 18 } },

  // Sisi Kanan Gerbang (Trotoar Utara)
  { id: 'lamp_u3', type: 'street_lamp', x: 1510, y: 220, w: 32, h: 90, collision: { ox: 8, oy: 70, ow: 16, oh: 18 } },
  { id: 'pot_u4', type: 'pot_plant', x: 1570, y: 245, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'sampah_u2', imgKey: 'prop_tempat_sampah_3', x: 1650, y: 248, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'motor_u4', imgKey: 'prop_motor_matic_1', x: 1780, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u5', imgKey: 'prop_motor_matic_2', x: 1870, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'bench_u2', type: 'bench', x: 2000, y: 250, w: 80, h: 48, collision: { ox: 4, oy: 15, ow: 72, oh: 30 } },
  { id: 'pot_u5', type: 'pot_plant', x: 2110, y: 245, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'lamp_u4', type: 'street_lamp', x: 2250, y: 220, w: 32, h: 90, collision: { ox: 8, oy: 70, ow: 16, oh: 18 } },

  // 2. TROTOAR SELATAN (Sisi Bawah)
  { id: 'lamp_s1', type: 'street_lamp', x: 220, y: 1200, w: 32, h: 90, collision: { ox: 8, oy: 70, ow: 16, oh: 18 } },
  { id: 'pot_s1', type: 'pot_plant', x: 300, y: 1225, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'sampah_s1', imgKey: 'prop_tempat_sampah_3', x: 380, y: 1228, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'motor_s1', imgKey: 'prop_motor_matic_2', x: 700, y: 1225, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_s2', imgKey: 'prop_motor_matic_1', x: 790, y: 1225, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'bench_s1', type: 'bench', x: 920, y: 1225, w: 80, h: 48, collision: { ox: 4, oy: 15, ow: 72, oh: 30 } },
  { id: 'pot_s2', type: 'pot_plant', x: 1250, y: 1225, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'motor_s3', imgKey: 'prop_motor_matic_1', x: 1650, y: 1225, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_s4', imgKey: 'prop_motor_matic_2', x: 1740, y: 1225, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'pot_s3', type: 'pot_plant', x: 1900, y: 1225, w: 48, h: 56, collision: { ox: 4, oy: 20, ow: 40, oh: 32 } },
  { id: 'sampah_s2', imgKey: 'prop_tempat_sampah_3', x: 2100, y: 1228, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'lamp_s2', type: 'street_lamp', x: 2280, y: 1200, w: 32, h: 90, collision: { ox: 8, oy: 70, ow: 16, oh: 18 } },
];

interface RoamingEnemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
}

// Helper: Buat Tekstur Aspal Pixel Art (Grain & Dither)
const createAsphaltPixelPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Base Dark Asphalt
  ctx.fillStyle = '#222733';
  ctx.fillRect(0, 0, 32, 32);

  // Pixel Dithering & Gravel Flecks
  const tones = ['#1a1e27', '#1f242f', '#262c3a', '#2c3444', '#343d4f'];
  // Deterministic pseudo-random flecks
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const hash = ((x * 374761393 + y * 668265263) ^ 0x5bf03635) >>> 0;
      const mod = hash % 100;
      if (mod < 28) {
        ctx.fillStyle = tones[0];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 48) {
        ctx.fillStyle = tones[1];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 75) {
        ctx.fillStyle = tones[2];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 90) {
        ctx.fillStyle = tones[3];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 98) {
        ctx.fillStyle = tones[4];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
};

// Helper: Buat Tekstur Paving Trotoar Pixel Art (Bevelled Paving Blocks)
const createSidewalkPixelPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Background Nat Ubin Gelap
  ctx.fillStyle = '#262d3a';
  ctx.fillRect(0, 0, 32, 32);

  // 4 Blok Paving 15x15 dalam grid 32x32
  const blocks = [
    { x: 1, y: 1 },
    { x: 17, y: 1 },
    { x: 1, y: 17 },
    { x: 17, y: 17 },
  ];

  blocks.forEach((b, idx) => {
    // Body Block
    ctx.fillStyle = (b.x + b.y + idx) % 2 === 0 ? '#424c5e' : '#3d4657';
    ctx.fillRect(b.x, b.y, 14, 14);

    // Bevel Top & Left (Highlight)
    ctx.fillStyle = '#59657b';
    ctx.fillRect(b.x, b.y, 14, 1);
    ctx.fillRect(b.x, b.y, 1, 14);

    // Bevel Bottom & Right (Shadow)
    ctx.fillStyle = '#2d3543';
    ctx.fillRect(b.x, b.y + 13, 14, 1);
    ctx.fillRect(b.x + 13, b.y, 1, 14);

    // Subtle Surface Grain
    ctx.fillStyle = '#4b566b';
    ctx.fillRect(b.x + 4, b.y + 5, 2, 2);
    ctx.fillRect(b.x + 9, b.y + 8, 2, 2);
  });

  return c;
};

// Helper: Buat Tekstur Rumput Hijau Pixel Art
const createGrassPixelPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Base Green
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, 32, 32);

  // Pixel Grass Texture Flecks
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const hash = ((x * 48271 + y * 16807) ^ 0x2719a3) >>> 0;
      const mod = hash % 100;
      if (mod < 25) {
        ctx.fillStyle = '#0f3f22'; // Dark shade
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 45) {
        ctx.fillStyle = '#166534'; // Mid green
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 60) {
        ctx.fillStyle = '#15803d'; // Highlight blade
        ctx.fillRect(x, y, 1, 2);
      }
    }
  }
  return c;
};

export const StreetMap: React.FC<StreetMapProps> = ({ player, onEncounter, onReturnToSchool }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Posisi Player di Street Map (di depan Zebra Cross dekat gerbang SMKN 7)
  const playerPosRef = useRef({ x: 1344, y: 360 });
  const playerDirRef = useRef<Direction>('down');
  const isMovingRef = useRef(false);
  const animTimerRef = useRef(0);
  const animFrameRef = useRef(0);
  const idleTimerRef = useRef(0);
  const idleFrameRef = useRef(0);
  const stepSoundTimerRef = useRef(0);

  // Kamera
  const cameraRef = useRef({ x: 1344, y: 360 });
  const [viewportSize, setViewportSize] = useState({ w: 1024, h: 640 });

  const keysDownRef = useRef<Set<string>>(new Set());
  const [nearSchoolGate, setNearSchoolGate] = useState(false);

  // Cache Gambar Karakter & Props
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});

  // Patterns Cache
  const asphaltPatternRef = useRef<CanvasPattern | null>(null);
  const sidewalkPatternRef = useRef<CanvasPattern | null>(null);
  const grassPatternRef = useRef<CanvasPattern | null>(null);

  // Handle Resize Layar
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

  // Preload Aset Karakter Maine & Props Bersih
  useEffect(() => {
    const assetList: Record<string, string> = {
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

      prop_motor_matic_1: '/assets/maps/smkn7/props/prop_motor_matic_1.png',
      prop_motor_matic_2: '/assets/maps/smkn7/props/prop_motor_matic_2.png',
      prop_tempat_sampah_3: '/assets/maps/smkn7/props/prop_tempat_sampah_3.png',
    };

    Object.entries(assetList).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      imagesRef.current[key] = img;
    });
  }, []);

  // Monster Patrol di Jalan Raya
  const monstersRef = useRef<RoamingEnemy[]>([
    { id: 'm1', x: 600, y: 650, vx: 50, spriteKey: 'void_eyeball' },
    { id: 'm2', x: 1900, y: 650, vx: -50, spriteKey: 'glitch_monolith' },
    { id: 'm3', x: 800, y: 980, vx: 55, spriteKey: 'cosmic_slime' },
    { id: 'm4', x: 1700, y: 980, vx: -55, spriteKey: 'void_eyeball' },
  ]);

  const tickRef = useRef(0);

  // Deteksi Kolisi Presisi
  const checkCollisionAt = (px: number, py: number): boolean => {
    const feetLeft = px - 18;
    const feetRight = px + 18;
    const feetTop = py + 22;
    const feetBottom = py + 38;

    // Batas Map Kiri / Kanan
    if (feetLeft < 70 || feetRight >= WORLD_WIDTH - 70) return true;

    // Batas Map Atas (Pagar Sekolah)
    if (feetTop < 200) {
      const inGate = feetLeft >= 1240 && feetRight <= 1448;
      if (!inGate || feetTop < 130) {
        return true;
      }
    }

    // Batas Map Bawah (Pagar Selatan)
    if (feetBottom >= 1520) return true;

    // Pilar Gerbang Kiri & Kanan
    if (feetTop < 220) {
      if (feetRight > 1180 && feetLeft < 1240) return true;
      if (feetRight > 1448 && feetLeft < 1500) return true;
    }

    // Props Kolisi
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

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'Space'].includes(code)) {
        e.preventDefault();
        keysDownRef.current.add(code);

        if (code === 'Space') {
          const cur = playerPosRef.current;
          if (cur.x >= 1220 && cur.x <= 1460 && cur.y <= 260) {
            playSound.select();
            onReturnToSchool();
          }
        }
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
  }, [onReturnToSchool]);

  // Virtual Controls untuk Layar Sentuh / Mouse
  const startVirtualKey = (code: string) => {
    keysDownRef.current.add(code);
  };
  const stopVirtualKey = (code: string) => {
    keysDownRef.current.delete(code);
  };

  // Main Render & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Generate patterns once
    if (!asphaltPatternRef.current) {
      const p = ctx.createPattern(createAsphaltPixelPattern(), 'repeat');
      if (p) asphaltPatternRef.current = p;
    }
    if (!sidewalkPatternRef.current) {
      const p = ctx.createPattern(createSidewalkPixelPattern(), 'repeat');
      if (p) sidewalkPatternRef.current = p;
    }
    if (!grassPatternRef.current) {
      const p = ctx.createPattern(createGrassPixelPattern(), 'repeat');
      if (p) grassPatternRef.current = p;
    }

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
        const speed = 220;
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

      // Cek apakah dekat gerbang sekolah
      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;
      const isNearGate = pX >= 1220 && pX <= 1460 && pY <= 260;
      setNearSchoolGate(isNearGate);

      if (isNearGate && pY <= 150) {
        playSound.select();
        cancelAnimationFrame(animId);
        onReturnToSchool();
        return;
      }

      // 2. CAMERA SMOOTH FOLLOW
      const targetCamX = pX - viewportSize.w / 2;
      const targetCamY = pY - viewportSize.h / 2;
      const maxCamX = WORLD_WIDTH - viewportSize.w;
      const maxCamY = WORLD_HEIGHT - viewportSize.h;

      const clampedTargetX = Math.max(0, Math.min(maxCamX, targetCamX));
      const clampedTargetY = Math.max(0, Math.min(maxCamY, targetCamY));

      cameraRef.current.x += (clampedTargetX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (clampedTargetY - cameraRef.current.y) * 0.12;

      const camX = Math.round(cameraRef.current.x);
      const camY = Math.round(cameraRef.current.y);

      // 3. ROAMING MONSTERS PATROL
      monstersRef.current.forEach((m) => {
        m.x += m.vx * dt;
        if (m.x < 350 || m.x > 2300) m.vx *= -1;
      });

      for (let i = 0; i < monstersRef.current.length; i++) {
        const m = monstersRef.current[i];
        if (Math.hypot(pX - m.x, pY - m.y) < 42) {
          playSound.encounter();
          const enemy = getRandomEnemy();
          monstersRef.current.splice(i, 1);
          cancelAnimationFrame(animId);
          onEncounter(enemy);
          return;
        }
      }

      // 4. DRAWING TEXTURED MAP (Authentic Pixel Art Textures)
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, viewportSize.w, viewportSize.h);

      // Area Taman Selatan (Rumput Hijau Bertekstur Pixel)
      const grassY = 1408 - camY;
      ctx.save();
      ctx.translate(-camX, grassY);
      ctx.fillStyle = grassPatternRef.current || '#14532d';
      ctx.fillRect(0, 0, WORLD_WIDTH, 256);
      ctx.restore();

      // Trotoar Selatan (Paving Pixel Art Bevelled)
      const southSidewalkY = 1184 - camY;
      ctx.save();
      ctx.translate(-camX, southSidewalkY);
      ctx.fillStyle = sidewalkPatternRef.current || '#334155';
      ctx.fillRect(0, 0, WORLD_WIDTH, 224);
      ctx.restore();

      // Trotoar Utara (Paving Pixel Art Bevelled)
      const northSidewalkY = 192 - camY;
      ctx.save();
      ctx.translate(-camX, northSidewalkY);
      ctx.fillStyle = sidewalkPatternRef.current || '#334155';
      ctx.fillRect(0, 0, WORLD_WIDTH, 256);
      ctx.restore();

      // Aspal Jalan Raya Utama (Tekstur Aspal Pixel Art Berkerikil)
      const roadY = 480 - camY;
      const roadH = 672;
      ctx.save();
      ctx.translate(-camX, roadY);
      ctx.fillStyle = asphaltPatternRef.current || '#1e242d';
      ctx.fillRect(0, 0, WORLD_WIDTH, roadH);
      ctx.restore();

      // KERB BATU TEPI JALAN PIXEL ART (Proporsional & Bevelled)
      // Lebar tiap blok kerb 24px, tinggi 16px
      const drawPixelCurb = (cy: number, isUpperCurb: boolean) => {
        const curbBlockW = 24;
        const curbBlockH = 16;
        for (let x = 0; x < WORLD_WIDTH; x += curbBlockW) {
          const isWhite = Math.floor(x / curbBlockW) % 2 === 0;
          const sx = x - camX;
          const sy = cy - camY;

          if (isWhite) {
            // White curb block with highlights
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(sx, sy, curbBlockW - 1, curbBlockH);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(sx, sy + 3, curbBlockW - 1, curbBlockH - 3);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(sx, sy + curbBlockH - 3, curbBlockW - 1, 3);
          } else {
            // Dark curb block with bevel
            ctx.fillStyle = '#334155';
            ctx.fillRect(sx, sy, curbBlockW - 1, 3);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(sx, sy + 3, curbBlockW - 1, curbBlockH - 6);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(sx, sy + curbBlockH - 3, curbBlockW - 1, 3);
          }

          // Gap vertical shadow antar balok kerb
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(sx + curbBlockW - 1, sy, 1, curbBlockH);
        }

        // Garis batas kontak aspal
        ctx.fillStyle = isUpperCurb ? '#141821' : '#0f172a';
        ctx.fillRect(-camX, cy + (isUpperCurb ? 16 : 0) - camY, WORLD_WIDTH, 2);
      };

      // Gambar Kerb Utara (Y: 464) dan Kerb Selatan (Y: 1152)
      drawPixelCurb(464, true);
      drawPixelCurb(1152, false);

      // Area Pagar & Dinding Batas Atas (Pagar Sekolah SMKN 7)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-camX, -camY, WORLD_WIDTH, 192);
      // Dinding bata beton pagar atas
      for (let y = 0; y < 180; y += 20) {
        ctx.fillStyle = y % 40 === 0 ? '#1e293b' : '#18202f';
        ctx.fillRect(-camX, y - camY, WORLD_WIDTH, 18);
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(-camX, y + 18 - camY, WORLD_WIDTH, 2);
      }

      // AREA GERBANG UTAMA SMKN 7 (X: 1216 s/d 1472)
      ctx.fillStyle = '#262d3a';
      ctx.fillRect(1240 - camX, -camY, 208, 192);
      ctx.fillStyle = '#3b4252';
      ctx.fillRect(1240 - camX, 64 - camY, 208, 128);

      // Pilar Gerbang Beton
      ctx.fillStyle = '#475569';
      ctx.fillRect(1200 - camX, 100 - camY, 40, 92);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1204 - camX, 104 - camY, 32, 84);
      ctx.fillStyle = '#334155';
      ctx.fillRect(1200 - camX, 96 - camY, 40, 4);

      ctx.fillStyle = '#475569';
      ctx.fillRect(1448 - camX, 100 - camY, 40, 92);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1452 - camX, 104 - camY, 32, 84);
      ctx.fillStyle = '#334155';
      ctx.fillRect(1448 - camX, 96 - camY, 40, 4);

      // Plang Gerbang "SMK NEGERI 7 BALEENDAH"
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(1220 - camX, 40 - camY, 248, 48);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(1220 - camX, 40 - camY, 248, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GERBANG UTAMA SMKN 7', 1344 - camX, 62 - camY);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('KEMBALI KE AREA SEKOLAH ➔', 1344 - camX, 78 - camY);

      // --- MARKA JALAN BERTEKSTUR PIXEL ART ---

      // 1. Garis Bahu Jalan Solid Putih
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-camX, 492 - camY, WORLD_WIDTH, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-camX, 493 - camY, WORLD_WIDTH, 2);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-camX, 1140 - camY, WORLD_WIDTH, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-camX, 1141 - camY, WORLD_WIDTH, 2);

      // 2. Garis Putus-putus Pemisah Lajur
      const drawDashedLine = (lineY: number) => {
        const segLen = 70;
        const gapLen = 60;
        const total = segLen + gapLen;
        for (let x = 0; x < WORLD_WIDTH; x += total) {
          if (x + segLen >= 1200 && x <= 1488) continue;
          const sx = x - camX;
          const sy = lineY - camY;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(sx, sy, segLen, 5);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(sx, sy + 4, segLen, 1);
        }
      };

      drawDashedLine(648);
      drawDashedLine(984);

      // 3. Garis Ganda Kuning Tengah Jalan
      const centerLineY = 816;
      for (let x = 0; x < WORLD_WIDTH; x += 16) {
        if (x >= 1200 && x <= 1488) continue;
        const sx = x - camX;
        const sy = centerLineY - camY;

        // Garis Atas
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx, sy - 6, 16, 5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(sx, sy - 2, 16, 1);

        // Garis Bawah
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx, sy + 2, 16, 5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(sx, sy + 6, 16, 1);
      }

      // 4. ZEBRA CROSS PENYEBERANGAN (Pixel Art Edges)
      const zebraXStart = 1220;
      const zebraXEnd = 1468;
      const zebraStripeH = 24;
      const zebraGap = 20;
      for (let y = 506; y < 1130; y += zebraStripeH + zebraGap) {
        const sy = y - camY;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(zebraXStart - camX, sy, zebraXEnd - zebraXStart, zebraStripeH);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(zebraXStart - camX, sy + zebraStripeH - 3, zebraXEnd - zebraXStart, 3);
      }

      // Garis Batas Stop Line Zebra Cross
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(1200 - camX, 500 - camY, 8, 636);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(1206 - camX, 500 - camY, 2, 636);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(1480 - camX, 500 - camY, 8, 636);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(1486 - camX, 500 - camY, 2, 636);

      // 5. Marka Panah Arah Jalan Pixel Art
      const drawPixelRoadArrow = (ax: number, ay: number, dirArrow: 'west' | 'east') => {
        ctx.save();
        ctx.translate(ax - camX, ay - camY);
        ctx.fillStyle = '#f8fafc';
        if (dirArrow === 'west') {
          ctx.fillRect(0, -4, 40, 8);
          ctx.beginPath();
          ctx.moveTo(-15, 0);
          ctx.lineTo(5, -15);
          ctx.lineTo(5, 15);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-40, -4, 40, 8);
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(-5, -15);
          ctx.lineTo(-5, 15);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };

      drawPixelRoadArrow(600, 648, 'west');
      drawPixelRoadArrow(1850, 648, 'west');
      drawPixelRoadArrow(750, 984, 'east');
      drawPixelRoadArrow(2000, 984, 'east');

      // 5. Y-SORTED ENTITIES (Props, Monsters, Player)
      interface RenderEntity {
        yOrder: number;
        draw: () => void;
      }

      const entities: RenderEntity[] = [];

      // Render Procedural Pixel Props & Images
      STREET_PROPS.forEach((prop) => {
        const scrX = prop.x - camX;
        const scrY = prop.y - camY;

        if (
          scrX + prop.w >= -100 &&
          scrX <= viewportSize.w + 100 &&
          scrY + prop.h >= -100 &&
          scrY <= viewportSize.h + 100
        ) {
          const yFoot = prop.collision ? prop.y + prop.collision.oy + prop.collision.oh : prop.y + prop.h;

          entities.push({
            yOrder: yFoot,
            draw: () => {
              // Custom Procedural Pixel Art Props
              if (prop.type === 'pot_plant') {
                // Bayangan Pot
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(scrX + 24, scrY + 50, 20, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Pot Terracotta Pixel Art
                ctx.fillStyle = '#9a3412';
                ctx.fillRect(scrX + 10, scrY + 28, 28, 24);
                ctx.fillStyle = '#c2410c';
                ctx.fillRect(scrX + 8, scrY + 24, 32, 6);
                ctx.fillStyle = '#7c2d12';
                ctx.fillRect(scrX + 10, scrY + 48, 28, 4);

                // Tanaman Rindang Pixel Art
                ctx.fillStyle = '#15803d';
                ctx.beginPath();
                ctx.arc(scrX + 24, scrY + 16, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(scrX + 20, scrY + 12, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#166534';
                ctx.beginPath();
                ctx.arc(scrX + 28, scrY + 20, 10, 0, Math.PI * 2);
                ctx.fill();
              } else if (prop.type === 'street_lamp') {
                // Tiang Lampu Jalan Pedestrian
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.beginPath();
                ctx.ellipse(scrX + 16, scrY + 85, 12, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tiang Besi Hitam
                ctx.fillStyle = '#334155';
                ctx.fillRect(scrX + 14, scrY + 12, 4, 74);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(scrX + 11, scrY + 80, 10, 6);

                // Kepala Lampu
                ctx.fillStyle = '#475569';
                ctx.fillRect(scrX + 8, scrY + 4, 16, 8);
                // Bola Lampu Menyala Hangat
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(scrX + 10, scrY + 10, 12, 6);
              } else if (prop.type === 'bench') {
                // Bangku Taman Trotoar
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(scrX + 4, scrY + 38, 72, 8);

                // Kaki Bangku Besi
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(scrX + 8, scrY + 24, 6, 18);
                ctx.fillRect(scrX + 66, scrY + 24, 6, 18);

                // Kayu Bangku
                ctx.fillStyle = '#92400e';
                ctx.fillRect(scrX + 2, scrY + 16, 76, 8);
                ctx.fillStyle = '#b45309';
                ctx.fillRect(scrX + 2, scrY + 8, 76, 6);
              } else if (prop.imgKey) {
                const img = imagesRef.current[prop.imgKey];
                if (img && img.complete && img.naturalWidth > 0) {
                  // Bayangan Motor / Tempat Sampah
                  ctx.fillStyle = 'rgba(0,0,0,0.35)';
                  ctx.beginPath();
                  ctx.ellipse(scrX + prop.w / 2, scrY + prop.h - 4, prop.w * 0.42, 6, 0, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.drawImage(img, scrX, scrY, prop.w, prop.h);
                }
              }
            },
          });
        }
      });

      // Render Monsters
      const animStep = Math.floor(tickRef.current / 16) % 2;
      monstersRef.current.forEach((m) => {
        const scrX = m.x - camX;
        const scrY = m.y - camY;
        const spriteKey = `${m.spriteKey}_${animStep}` as SpriteId;
        const monsterCanvas = getSprite(spriteKey);

        entities.push({
          yOrder: m.y + 16,
          draw: () => {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.beginPath();
            ctx.arc(scrX, scrY + 16, 26, 0, Math.PI * 2);
            ctx.fill();

            ctx.drawImage(monsterCanvas, scrX - 24, scrY - 24, 48, 48);
          },
        });
      });

      // Render Player (Maine)
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
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.beginPath();
          ctx.ellipse(pScrX, pScrY + 36, 18, 6, 0, 0, Math.PI * 2);
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
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-16, -48, 32, 48);
          }
          ctx.restore();
        },
      });

      entities.sort((a, b) => a.yOrder - b.yOrder);
      entities.forEach((e) => e.draw());

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [onEncounter, onReturnToSchool, viewportSize]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-[#090d16]">
      {/* TOP HUD BAR */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-3 bg-[#121824]/95 border-2 border-[#334155] px-4 py-2 shadow-2xl pointer-events-auto">
          <img
            src="/assets/characters/maine/avatar.png"
            alt={player.name}
            className="w-10 h-10 border border-[#475569] bg-[#1e293b] object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-yellow-400 text-sm tracking-wide">{player.name}</span>
              <span className="text-[10px] text-cyan-300 font-bold bg-[#1e293b] px-2 py-0.5 border border-[#334155]">
                {player.jurusan}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-300 mt-0.5">
              <span>🛣 MAP JALAN RAYA BALEENDAH</span>
              <span className="text-yellow-500">•</span>
              <span className="text-emerald-400 font-bold uppercase">DEPAN GERBANG UTAMA SMKN 7</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 pointer-events-auto">
          <button
            onClick={() => {
              playSound.select();
              onReturnToSchool();
            }}
            className="px-3.5 py-2 bg-[#1e3a8a] hover:bg-[#1d4ed8] active:bg-[#172554] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#60a5fa] shadow-2xl flex items-center gap-1.5 cursor-pointer"
          >
            <span>🏫 KEMBALI KE SMKN 7</span>
            <span>➔</span>
          </button>

          <div className="flex items-center space-x-3 bg-[#121824]/95 border-2 border-[#334155] px-4 py-2.5 shadow-2xl">
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
      </div>

      {/* NOTIFIKASI DEKAT GERBANG */}
      {nearSchoolGate && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-[#1e3a8a] border-2 border-[#fbbf24] px-5 py-2 text-white font-bold text-xs tracking-wide shadow-2xl flex items-center gap-2">
            <span>🚪 TEKAN [SPASI] / KLIK TOMBOL UNTUK MASUK KE SMKN 7</span>
          </div>
        </div>
      )}

      {/* CANVAS DISPLAY */}
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
        <div className="bg-[#121824]/95 border-2 border-[#334155] p-3 text-xs max-w-md pointer-events-auto">
          <p className="font-bold text-yellow-400 mb-0.5">🎮 KONTROL JALAN RAYA BALEENDAH:</p>
          <p className="text-neutral-300 text-[11px] leading-tight">
            Gunakan tombol <strong className="text-white">WASD</strong> atau <strong className="text-white">Panah</strong>.
            Waspada patroli bayangan di sepanjang jalan raya! Dekati Zebra Cross di depan gerbang untuk kembali ke sekolah.
          </p>
        </div>

        {/* VIRTUAL D-PAD */}
        <div className="grid grid-cols-3 gap-1.5 w-32 pointer-events-auto bg-[#121824]/95 p-2 border-2 border-[#334155]">
          <div />
          <button
            onMouseDown={() => startVirtualKey('KeyW')}
            onMouseUp={() => stopVirtualKey('KeyW')}
            onMouseLeave={() => stopVirtualKey('KeyW')}
            onTouchStart={() => startVirtualKey('KeyW')}
            onTouchEnd={() => stopVirtualKey('KeyW')}
            className="p-2.5 bg-[#1e293b] hover:bg-[#334155] active:bg-[#475569] text-white border border-[#475569] font-black text-sm text-center"
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
            className="p-2.5 bg-[#1e293b] hover:bg-[#334155] active:bg-[#475569] text-white border border-[#475569] font-black text-sm text-center"
          >
            ◀
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyS')}
            onMouseUp={() => stopVirtualKey('KeyS')}
            onMouseLeave={() => stopVirtualKey('KeyS')}
            onTouchStart={() => startVirtualKey('KeyS')}
            onTouchEnd={() => stopVirtualKey('KeyS')}
            className="p-2.5 bg-[#1e293b] hover:bg-[#334155] active:bg-[#475569] text-white border border-[#475569] font-black text-sm text-center"
          >
            ▼
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyD')}
            onMouseUp={() => stopVirtualKey('KeyD')}
            onMouseLeave={() => stopVirtualKey('KeyD')}
            onTouchStart={() => startVirtualKey('KeyD')}
            onTouchEnd={() => stopVirtualKey('KeyD')}
            className="p-2.5 bg-[#1e293b] hover:bg-[#334155] active:bg-[#475569] text-white border border-[#475569] font-black text-sm text-center"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
