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
  type?: 'street_lamp' | 'bench' | 'planter_box';
  x: number;
  y: number;
  w: number;
  h: number;
  collision?: { ox: number; oy: number; ow: number; oh: number };
}

// Props Penataan Trotoar Jalan Raya (Bersih, Rapi, Tanpa Motor)
const STREET_PROPS: StreetProp[] = [
  // 1. TROTOAR UTARA (Sisi Kiri Gerbang)
  { id: 'lamp_u1', type: 'street_lamp', x: 160, y: 200, w: 44, h: 120, collision: { ox: 14, oy: 96, ow: 16, oh: 20 } },
  { id: 'planter_u1', type: 'planter_box', x: 270, y: 240, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'bench_u1', type: 'bench', x: 420, y: 250, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
  { id: 'planter_u2', type: 'planter_box', x: 590, y: 240, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'sampah_u1', imgKey: 'prop_tempat_sampah_3', x: 730, y: 248, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'bench_u2', type: 'bench', x: 890, y: 250, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
  { id: 'lamp_u2', type: 'street_lamp', x: 1070, y: 200, w: 44, h: 120, collision: { ox: 14, oy: 96, ow: 16, oh: 20 } },

  // Sisi Kanan Gerbang (Trotoar Utara)
  { id: 'lamp_u3', type: 'street_lamp', x: 1510, y: 200, w: 44, h: 120, collision: { ox: 14, oy: 96, ow: 16, oh: 20 } },
  { id: 'bench_u3', type: 'bench', x: 1620, y: 250, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
  { id: 'planter_u3', type: 'planter_box', x: 1780, y: 240, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'sampah_u2', imgKey: 'prop_tempat_sampah_3', x: 1910, y: 248, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'bench_u4', type: 'bench', x: 2060, y: 250, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
  { id: 'planter_u4', type: 'planter_box', x: 2220, y: 240, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'lamp_u4', type: 'street_lamp', x: 2360, y: 200, w: 44, h: 120, collision: { ox: 14, oy: 96, ow: 16, oh: 20 } },

  // 2. TROTOAR SELATAN (Sisi Bawah Jalan Raya)
  { id: 'lamp_s1', type: 'street_lamp', x: 200, y: 1190, w: 44, h: 120, collision: { ox: 14, oy: 96, ow: 16, oh: 20 } },
  { id: 'planter_s1', type: 'planter_box', x: 310, y: 1230, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'sampah_s1', imgKey: 'prop_tempat_sampah_3', x: 440, y: 1238, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'bench_s1', type: 'bench', x: 620, y: 1240, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
  { id: 'planter_s2', type: 'planter_box', x: 800, y: 1230, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'lamp_s2', type: 'street_lamp', x: 980, y: 1190, w: 44, h: 120, collision: { ox: 14, oy: 96, ow: 16, oh: 20 } },
  { id: 'bench_s2', type: 'bench', x: 1140, y: 1240, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
  { id: 'planter_s3', type: 'planter_box', x: 1320, y: 1230, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'sampah_s2', imgKey: 'prop_tempat_sampah_3', x: 1540, y: 1238, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'bench_s3', type: 'bench', x: 1720, y: 1240, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
  { id: 'planter_s4', type: 'planter_box', x: 1900, y: 1230, w: 84, h: 76, collision: { ox: 6, oy: 36, ow: 72, oh: 36 } },
  { id: 'lamp_s3', type: 'street_lamp', x: 2150, y: 1190, w: 44, h: 120, collision: { ox: 14, oy: 96, ow: 16, oh: 20 } },
  { id: 'bench_s4', type: 'bench', x: 2280, y: 1240, w: 110, h: 56, collision: { ox: 6, oy: 20, ow: 98, oh: 32 } },
];

interface RoamingEnemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
}

// 1. Helper: Aspal Alami Halus (Ukuran 128x128 untuk menghilangkan pola berulang 32px)
const createFineAsphaltPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Base Solid Asphalt
  ctx.fillStyle = '#212631';
  ctx.fillRect(0, 0, 128, 128);

  // Micro-organic noise (Speckle alami tanpa pola grid menyolok)
  const colors = ['#1a1e27', '#1d222b', '#252b37', '#2a313f', '#2f3747'];
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const hash = ((x * 48271 + y * 69621) ^ 0x4f7b2c91) >>> 0;
      const mod = hash % 100;
      if (mod < 18) {
        ctx.fillStyle = colors[0];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 38) {
        ctx.fillStyle = colors[1];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 62) {
        ctx.fillStyle = colors[2];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 78) {
        ctx.fillStyle = colors[3];
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 88) {
        ctx.fillStyle = colors[4];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Aksen garis lajur roda samar horizontal
  ctx.fillStyle = 'rgba(23, 27, 35, 0.4)';
  ctx.fillRect(0, 20, 128, 28);
  ctx.fillRect(0, 80, 128, 28);

  return c;
};

// 2. Helper: Paving Trotoar Pedestrian Bevelled
const createSidewalkPixelPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Nat gelap
  ctx.fillStyle = '#232934';
  ctx.fillRect(0, 0, 32, 32);

  const blocks = [
    { x: 1, y: 1 },
    { x: 17, y: 1 },
    { x: 1, y: 17 },
    { x: 17, y: 17 },
  ];

  blocks.forEach((b, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#3e4757' : '#394150';
    ctx.fillRect(b.x, b.y, 14, 14);

    // Bevel Top & Left
    ctx.fillStyle = '#525d70';
    ctx.fillRect(b.x, b.y, 14, 1);
    ctx.fillRect(b.x, b.y, 1, 14);

    // Bevel Bottom & Right
    ctx.fillStyle = '#282f3b';
    ctx.fillRect(b.x, b.y + 13, 14, 1);
    ctx.fillRect(b.x + 13, b.y, 1, 14);

    // Bintik halus
    ctx.fillStyle = '#465061';
    ctx.fillRect(b.x + 4, b.y + 5, 2, 2);
    ctx.fillRect(b.x + 9, b.y + 8, 2, 2);
  });

  return c;
};

// 3. Helper: Rumput Hijau Taman
const createGrassPixelPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, 32, 32);

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const hash = ((x * 48271 + y * 16807) ^ 0x2719a3) >>> 0;
      const mod = hash % 100;
      if (mod < 22) {
        ctx.fillStyle = '#0f3f22';
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 45) {
        ctx.fillStyle = '#166534';
        ctx.fillRect(x, y, 1, 1);
      } else if (mod < 65) {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x, y, 1, 2);
      }
    }
  }
  return c;
};

export const StreetMap: React.FC<StreetMapProps> = ({ player, onEncounter, onReturnToSchool }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Posisi Player di Street Map
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

  // Preload Aset Karakter Maine & Tempat Sampah
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

    // Props Kolisi (Lampu, Bangku, Planter, Tempat Sampah)
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

    // Generate patterns
    if (!asphaltPatternRef.current) {
      const p = ctx.createPattern(createFineAsphaltPattern(), 'repeat');
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

      // Aspal Jalan Raya Utama (Pola Halus 128x128 Tanpa Kotak-Kotak Rajutan)
      const roadY = 480 - camY;
      const roadH = 672;
      ctx.save();
      ctx.translate(-camX, roadY);
      ctx.fillStyle = asphaltPatternRef.current || '#212631';
      ctx.fillRect(0, 0, WORLD_WIDTH, roadH);
      ctx.restore();

      // KERB BATU TEPI JALAN PIXEL ART (Proporsional & Bevelled)
      const drawPixelCurb = (cy: number, isUpperCurb: boolean) => {
        const curbBlockW = 24;
        const curbBlockH = 16;
        for (let x = 0; x < WORLD_WIDTH; x += curbBlockW) {
          const isWhite = Math.floor(x / curbBlockW) % 2 === 0;
          const sx = x - camX;
          const sy = cy - camY;

          if (isWhite) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(sx, sy, curbBlockW - 1, curbBlockH);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(sx, sy + 3, curbBlockW - 1, curbBlockH - 3);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(sx, sy + curbBlockH - 3, curbBlockW - 1, 3);
          } else {
            ctx.fillStyle = '#334155';
            ctx.fillRect(sx, sy, curbBlockW - 1, 3);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(sx, sy + 3, curbBlockW - 1, curbBlockH - 6);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(sx, sy + curbBlockH - 3, curbBlockW - 1, 3);
          }

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(sx + curbBlockW - 1, sy, 1, curbBlockH);
        }

        ctx.fillStyle = isUpperCurb ? '#141821' : '#0f172a';
        ctx.fillRect(-camX, cy + (isUpperCurb ? 16 : 0) - camY, WORLD_WIDTH, 2);
      };

      drawPixelCurb(464, true);
      drawPixelCurb(1152, false);

      // Area Pagar & Dinding Batas Atas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-camX, -camY, WORLD_WIDTH, 192);
      for (let y = 0; y < 180; y += 20) {
        ctx.fillStyle = y % 40 === 0 ? '#1e293b' : '#18202f';
        ctx.fillRect(-camX, y - camY, WORLD_WIDTH, 18);
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(-camX, y + 18 - camY, WORLD_WIDTH, 2);
      }

      // AREA GERBANG UTAMA SMKN 7
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

      // Plang Gerbang
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

      // --- MARKA JALAN BERTEKSTUR PIXEL ART & BEBAS KETIMPA ---

      // 1. Garis Bahu Jalan Solid Putih
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-camX, 492 - camY, WORLD_WIDTH, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-camX, 493 - camY, WORLD_WIDTH, 2);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-camX, 1140 - camY, WORLD_WIDTH, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-camX, 1141 - camY, WORLD_WIDTH, 2);

      // Definisi Lokasi Panah Arah Jalan (Biar garis putus-putus gak nembus ke panah!)
      // Lajur Atas (Barat): Panah di x = 650 dan x = 1850
      // Lajur Bawah (Timur): Panah di x = 800 dan x = 2000
      const upperArrowZones = [
        { start: 530, end: 770 },
        { start: 1730, end: 1970 },
      ];
      const lowerArrowZones = [
        { start: 680, end: 920 },
        { start: 1880, end: 2120 },
      ];

      // 2. Garis Putus-putus Pemisah Lajur (Dengan Clearance Zone Anti-Ketimpa)
      const drawDashedLineWithClearance = (lineY: number, arrowZones: { start: number; end: number }[]) => {
        const segLen = 70;
        const gapLen = 60;
        const total = segLen + gapLen;
        for (let x = 0; x < WORLD_WIDTH; x += total) {
          // Cek jangan tumpuk di atas area zebra cross (X: 1180 - 1500)
          if (x + segLen >= 1180 && x <= 1500) continue;

          // Cek jangan tumpuk atau menembus ke panah arah jalan!
          let inArrowClearance = false;
          for (const zone of arrowZones) {
            if (x + segLen >= zone.start && x <= zone.end) {
              inArrowClearance = true;
              break;
            }
          }
          if (inArrowClearance) continue;

          const sx = x - camX;
          const sy = lineY - camY;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(sx, sy, segLen, 5);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(sx, sy + 4, segLen, 1);
        }
      };

      drawDashedLineWithClearance(648, upperArrowZones);
      drawDashedLineWithClearance(984, lowerArrowZones);

      // 3. Garis Ganda Kuning Tengah Jalan
      const centerLineY = 816;
      for (let x = 0; x < WORLD_WIDTH; x += 16) {
        if (x >= 1200 && x <= 1488) continue;
        const sx = x - camX;
        const sy = centerLineY - camY;

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx, sy - 6, 16, 5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(sx, sy - 2, 16, 1);

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

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(1200 - camX, 500 - camY, 8, 636);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(1206 - camX, 500 - camY, 2, 636);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(1480 - camX, 500 - camY, 8, 636);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(1486 - camX, 500 - camY, 2, 636);

      // 5. Marka Panah Arah Jalan Pixel Art (Berdiri Bersih di Tengah Clearance Zone)
      const drawPixelRoadArrow = (ax: number, ay: number, dirArrow: 'west' | 'east') => {
        ctx.save();
        ctx.translate(ax - camX, ay - camY);
        ctx.fillStyle = '#f8fafc';
        if (dirArrow === 'west') {
          // Batang Panah
          ctx.fillRect(0, -4, 44, 8);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(0, 2, 44, 2);
          // Kepala Panah
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(4, -16);
          ctx.lineTo(4, 16);
          ctx.closePath();
          ctx.fill();
        } else {
          // Batang Panah
          ctx.fillRect(-44, -4, 44, 8);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-44, 2, 44, 2);
          // Kepala Panah
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-4, -16);
          ctx.lineTo(-4, 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };

      // Gambar Panah di Titik Tengah Clearance Zone
      drawPixelRoadArrow(650, 648, 'west');
      drawPixelRoadArrow(1850, 648, 'west');
      drawPixelRoadArrow(800, 984, 'east');
      drawPixelRoadArrow(2000, 984, 'east');

      // 6. Y-SORTED ENTITIES (Props, Monsters, Player)
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
              // 1. Planter Box Beton Kota Berisi Tanaman Rimbun
              if (prop.type === 'planter_box') {
                // Bayangan tanah
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath();
                ctx.ellipse(scrX + 42, scrY + 68, 38, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Bak Beton Trotoar
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(scrX + 6, scrY + 36, 72, 34);
                ctx.fillStyle = '#334155';
                ctx.fillRect(scrX + 8, scrY + 38, 68, 30);
                // Bibir bak beton
                ctx.fillStyle = '#475569';
                ctx.fillRect(scrX + 4, scrY + 34, 76, 6);
                ctx.fillStyle = '#64748b';
                ctx.fillRect(scrX + 4, scrY + 34, 76, 2);

                // Tanah humus
                ctx.fillStyle = '#29180d';
                ctx.fillRect(scrX + 8, scrY + 38, 68, 8);

                // Semak Rimbun Bertingkat (Bukan Lingkaran Lolipop)
                const drawBushCluster = (cx: number, cy: number, r: number) => {
                  ctx.fillStyle = '#14532d';
                  ctx.beginPath();
                  ctx.arc(cx, cy + 2, r, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = '#16a34a';
                  ctx.beginPath();
                  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = '#4ade80';
                  ctx.beginPath();
                  ctx.arc(cx - 3, cy - 3, r * 0.45, 0, Math.PI * 2);
                  ctx.fill();
                };

                drawBushCluster(scrX + 22, scrY + 28, 16);
                drawBushCluster(scrX + 62, scrY + 28, 16);
                drawBushCluster(scrX + 42, scrY + 22, 20);
                drawBushCluster(scrX + 42, scrY + 12, 15);
              }
              // 2. Tiang Lampu Jalan Pedestrian (Skala Besar & Proporsional)
              else if (prop.type === 'street_lamp') {
                // Pendaran Cahaya Lampu di Trotoar
                ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
                ctx.beginPath();
                ctx.ellipse(scrX + 22, scrY + 108, 48, 16, 0, 0, Math.PI * 2);
                ctx.fill();

                // Bayangan Tiang
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath();
                ctx.ellipse(scrX + 22, scrY + 110, 16, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Kaki Tiang Besi Cor Hitam
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(scrX + 13, scrY + 98, 18, 14);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(scrX + 15, scrY + 96, 14, 4);

                // Batang Tiang Lampu
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(scrX + 19, scrY + 18, 6, 80);
                ctx.fillStyle = '#334155';
                ctx.fillRect(scrX + 20, scrY + 18, 2, 80);

                // Ornamen Lengkung Kepala Tiang
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(scrX + 14, scrY + 14, 16, 6);
                ctx.fillRect(scrX + 10, scrY + 10, 24, 4);

                // Rumah Lampu / Kap Lentera Kaca
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(scrX + 8, scrY + 2, 28, 8); // Atap kap lampu
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(scrX + 18, scrY - 2, 8, 4); // Puncak ornamen

                // Kaca Menyala Hangat
                ctx.fillStyle = '#fde047';
                ctx.fillRect(scrX + 12, scrY + 10, 20, 14);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(scrX + 16, scrY + 12, 12, 10);

                // Rangka Besi Kaca
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(scrX + 11, scrY + 10, 2, 14);
                ctx.fillRect(scrX + 31, scrY + 10, 2, 14);
                ctx.fillRect(scrX + 21, scrY + 10, 2, 14);
                ctx.fillRect(scrX + 11, scrY + 23, 22, 2);
              }
              // 3. Bangku Trotoar Kayu & Besi Proporsional
              else if (prop.type === 'bench') {
                // Bayangan Bangku
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.fillRect(scrX + 4, scrY + 46, 102, 10);

                // Kaki & Sandaran Besi Hitam
                ctx.fillStyle = '#0f172a';
                // Kaki kiri & kanan
                ctx.fillRect(scrX + 10, scrY + 28, 8, 24);
                ctx.fillRect(scrX + 92, scrY + 28, 8, 24);
                // Sandaran tangan
                ctx.fillRect(scrX + 8, scrY + 22, 12, 6);
                ctx.fillRect(scrX + 90, scrY + 22, 12, 6);

                // Bilah Papan Sandaran Kayu (3 Tingkat)
                const drawWoodSlat = (wy: number, wh: number) => {
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(scrX + 6, wy, 98, wh);
                  ctx.fillStyle = '#9a3412';
                  ctx.fillRect(scrX + 6, wy, 98, 2);
                  ctx.fillStyle = '#b45309';
                  ctx.fillRect(scrX + 8, wy + 2, 94, wh - 3);
                };

                drawWoodSlat(scrY + 6, 7);
                drawWoodSlat(scrY + 15, 7);

                // Bilah Papan Dudukan Kayu
                drawWoodSlat(scrY + 28, 8);
                drawWoodSlat(scrY + 38, 8);
              }
              // 4. Prop Gambar (Tempat Sampah)
              else if (prop.imgKey) {
                const img = imagesRef.current[prop.imgKey];
                if (img && img.complete && img.naturalWidth > 0) {
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
