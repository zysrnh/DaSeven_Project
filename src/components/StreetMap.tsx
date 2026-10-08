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

// Coordinates & Boundaries
// Y: 0 - 192 (Rows 0-2): Tembok & Gerbang Batas Atas
// Y: 192 - 448 (Rows 3-6): Trotoar Utara (Paving Pedestrian)
// Y: 448 - 480: Kerb Trotoar Utara (Batu Tepi Jalan Hitam-Putih)
// Y: 480 - 1152 (Rows 8-17): Jalan Raya Utama Dua Arah (Aspal Solid)
// Y: 1152 - 1184: Kerb Trotoar Selatan (Batu Tepi Jalan Hitam-Putih)
// Y: 1184 - 1408 (Rows 19-21): Trotoar Selatan (Paving Pedestrian)
// Y: 1408 - 1664 (Rows 22-25): Taman Rumput & Batas Selatan

interface StreetProp {
  id: string;
  imgKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  collision?: { ox: number; oy: number; ow: number; oh: number };
}

// Props diletakkan dengan teratur dan selaras
const STREET_PROPS: StreetProp[] = [
  // 1. AREA PARKIRAN MOTOR TROTOAR UTARA (Sisi Kiri Gerbang)
  { id: 'motor_u1', imgKey: 'prop_motor_matic_1', x: 260, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u2', imgKey: 'prop_motor_matic_2', x: 345, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u3', imgKey: 'prop_motor_matic_1', x: 430, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u4', imgKey: 'prop_motor_matic_2', x: 515, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },

  // Pot Tanaman & Tempat Sampah Trotoar Utara
  { id: 'pot_u1', imgKey: 'tile_tanaman_pot', x: 180, y: 245, w: 55, h: 75, collision: { ox: 5, oy: 30, ow: 45, oh: 40 } },
  { id: 'pot_u2', imgKey: 'tile_tanaman_pot', x: 610, y: 245, w: 55, h: 75, collision: { ox: 5, oy: 30, ow: 45, oh: 40 } },
  { id: 'sampah_u1', imgKey: 'prop_tempat_sampah_3', x: 690, y: 250, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },

  // Sisi Kanan Gerbang (Trotoar Utara)
  { id: 'pot_u3', imgKey: 'tile_tanaman_pot', x: 1530, y: 245, w: 55, h: 75, collision: { ox: 5, oy: 30, ow: 45, oh: 40 } },
  { id: 'sampah_u2', imgKey: 'prop_tempat_sampah_3', x: 1610, y: 250, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'motor_u5', imgKey: 'prop_motor_matic_1', x: 1740, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u6', imgKey: 'prop_motor_matic_2', x: 1825, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_u7', imgKey: 'prop_motor_matic_1', x: 1910, y: 250, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'pot_u4', imgKey: 'tile_tanaman_pot', x: 2010, y: 245, w: 55, h: 75, collision: { ox: 5, oy: 30, ow: 45, oh: 40 } },

  // 2. TROTOAR SELATAN (Sisi Bawah)
  { id: 'pot_s1', imgKey: 'tile_tanaman_pot', x: 300, y: 1220, w: 55, h: 75, collision: { ox: 5, oy: 30, ow: 45, oh: 40 } },
  { id: 'sampah_s1', imgKey: 'prop_tempat_sampah_3', x: 380, y: 1225, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
  { id: 'motor_s1', imgKey: 'prop_motor_matic_2', x: 750, y: 1220, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_s2', imgKey: 'prop_motor_matic_1', x: 835, y: 1220, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'pot_s2', imgKey: 'tile_tanaman_pot', x: 1250, y: 1220, w: 55, h: 75, collision: { ox: 5, oy: 30, ow: 45, oh: 40 } },
  { id: 'motor_s3', imgKey: 'prop_motor_matic_1', x: 1700, y: 1220, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'motor_s4', imgKey: 'prop_motor_matic_2', x: 1785, y: 1220, w: 75, h: 68, collision: { ox: 5, oy: 25, ow: 65, oh: 40 } },
  { id: 'pot_s3', imgKey: 'tile_tanaman_pot', x: 2150, y: 1220, w: 55, h: 75, collision: { ox: 5, oy: 30, ow: 45, oh: 40 } },
  { id: 'sampah_s2', imgKey: 'prop_tempat_sampah_3', x: 2230, y: 1225, w: 100, h: 65, collision: { ox: 8, oy: 25, ow: 84, oh: 35 } },
];

interface RoamingEnemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
}

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
  const [imagesLoaded, setImagesLoaded] = useState(false);

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
    // Ada celah gerbang di X: 1240 s/d 1448
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
      if (feetRight > 1180 && feetLeft < 1240) return true; // Pilar kiri
      if (feetRight > 1448 && feetLeft < 1500) return true; // Pilar kanan
    }

    // Props Kolisi (Motor, Pot, Tempat Sampah)
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

      // Otomatis pindah jika player jalan masuk ke pintu gerbang
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

      // Encounter Check
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

      // 4. DRAWING CUSTOM PROCEDURAL MAP (Flat, Crisp, Zero Seams)
      // Background Base Dark
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, viewportSize.w, viewportSize.h);

      // Area Taman Selatan (Rumput Hijau Solid)
      const grassY = 1408 - camY;
      ctx.fillStyle = '#14532d';
      ctx.fillRect(-camX, grassY, WORLD_WIDTH, 256);

      // Paving Trotoar Selatan (Pedestrian Abu-abu Solid)
      const southSidewalkY = 1184 - camY;
      ctx.fillStyle = '#334155';
      ctx.fillRect(-camX, southSidewalkY, WORLD_WIDTH, 224);

      // Nat Paving Trotoar Selatan
      ctx.strokeStyle = '#293548';
      ctx.lineWidth = 1;
      for (let x = 0; x < WORLD_WIDTH; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x - camX, southSidewalkY);
        ctx.lineTo(x - camX, southSidewalkY + 224);
        ctx.stroke();
      }
      for (let y = 1184; y <= 1408; y += 32) {
        ctx.beginPath();
        ctx.moveTo(-camX, y - camY);
        ctx.lineTo(WORLD_WIDTH - camX, y - camY);
        ctx.stroke();
      }

      // Aspal Jalan Raya Utama (Solid Dark Slate Asphalt)
      const roadY = 480 - camY;
      const roadH = 672;
      ctx.fillStyle = '#1e242d';
      ctx.fillRect(-camX, roadY, WORLD_WIDTH, roadH);

      // Kerb Trotoar Utara (Pola Belang Hitam-Putih Tegas)
      const northCurbY = 448 - camY;
      for (let x = 0; x < WORLD_WIDTH; x += 48) {
        ctx.fillStyle = Math.floor(x / 48) % 2 === 0 ? '#f8fafc' : '#0f172a';
        ctx.fillRect(x - camX, northCurbY, 48, 32);
      }
      // Border Kerb Utara
      ctx.fillStyle = '#334155';
      ctx.fillRect(-camX, northCurbY + 30, WORLD_WIDTH, 2);

      // Kerb Trotoar Selatan (Pola Belang Hitam-Putih Tegas)
      const southCurbY = 1152 - camY;
      for (let x = 0; x < WORLD_WIDTH; x += 48) {
        ctx.fillStyle = Math.floor(x / 48) % 2 === 0 ? '#f8fafc' : '#0f172a';
        ctx.fillRect(x - camX, southCurbY, 48, 32);
      }
      ctx.fillStyle = '#334155';
      ctx.fillRect(-camX, southCurbY, WORLD_WIDTH, 2);

      // Paving Trotoar Utara (Pedestrian Abu-abu Solid)
      const northSidewalkY = 192 - camY;
      ctx.fillStyle = '#334155';
      ctx.fillRect(-camX, northSidewalkY, WORLD_WIDTH, 256);

      // Nat Paving Trotoar Utara
      ctx.strokeStyle = '#293548';
      ctx.lineWidth = 1;
      for (let x = 0; x < WORLD_WIDTH; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x - camX, northSidewalkY);
        ctx.lineTo(x - camX, northSidewalkY + 256);
        ctx.stroke();
      }
      for (let y = 192; y <= 448; y += 32) {
        ctx.beginPath();
        ctx.moveTo(-camX, y - camY);
        ctx.lineTo(WORLD_WIDTH - camX, y - camY);
        ctx.stroke();
      }

      // Area Pagar & Dinding Batas Atas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-camX, -camY, WORLD_WIDTH, 192);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-camX, 170 - camY, WORLD_WIDTH, 22);

      // AREA GERBANG UTAMA SMKN 7 (X: 1216 s/d 1472, Y: 0 s/d 192)
      // Jalur Gerbang Terbuka
      ctx.fillStyle = '#262d3a';
      ctx.fillRect(1240 - camX, -camY, 208, 192);

      // Paving Jalur Masuk Gerbang
      ctx.fillStyle = '#3b4252';
      ctx.fillRect(1240 - camX, 64 - camY, 208, 128);

      // Pilar Gerbang Kiri & Kanan (Beton Kokoh)
      ctx.fillStyle = '#475569';
      ctx.fillRect(1200 - camX, 100 - camY, 40, 92);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1204 - camX, 104 - camY, 32, 84);

      ctx.fillStyle = '#475569';
      ctx.fillRect(1448 - camX, 100 - camY, 40, 92);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1452 - camX, 104 - camY, 32, 84);

      // Plang Pintu Gerbang "SMK NEGERI 7 BALEENDAH"
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

      // --- MARKA JALAN RAYA (ROAD MARKINGS) ---

      // 1. Garis Bahu Jalan Solid Putih (Shoulder Line)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-camX, 492 - camY, WORLD_WIDTH, 4);
      ctx.fillRect(-camX, 1140 - camY, WORLD_WIDTH, 4);

      // 2. Garis Putus-putus Pemisah Lajur (White Dashed Lane Dividers)
      const drawDashedLine = (lineY: number) => {
        const segLen = 70;
        const gapLen = 60;
        const total = segLen + gapLen;
        for (let x = 0; x < WORLD_WIDTH; x += total) {
          // Jangan tumpuk di atas zebra cross (X: 1200 - 1488)
          if (x + segLen >= 1200 && x <= 1488) continue;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x - camX, lineY - camY, segLen, 5);
        }
      };

      // Lajur Barat (Atas) & Lajur Timur (Bawah)
      drawDashedLine(648);
      drawDashedLine(984);

      // 3. Garis Ganda Kuning Tengah Jalan (Double Yellow Centerline)
      const centerLineY = 816;
      for (let x = 0; x < WORLD_WIDTH; x += 16) {
        // Jangan tumpuk di atas area zebra cross
        if (x >= 1200 && x <= 1488) continue;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x - camX, centerLineY - 6 - camY, 16, 5);
        ctx.fillRect(x - camX, centerLineY + 2 - camY, 16, 5);
      }

      // 4. ZEBRA CROSS PENYEBERANGAN PEJALAN KAKI (X: 1220 s/d 1468, Y: 496 s/d 1136)
      const zebraXStart = 1220;
      const zebraXEnd = 1468;
      const zebraStripeH = 26;
      const zebraGap = 20;
      for (let y = 506; y < 1130; y += zebraStripeH + zebraGap) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(zebraXStart - camX, y - camY, zebraXEnd - zebraXStart, zebraStripeH);
      }

      // Garis Batas Stop Line Zebra Cross (Solid Putih Tebal)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(1200 - camX, 500 - camY, 10, 636);
      ctx.fillRect(1478 - camX, 500 - camY, 10, 636);

      // 5. Marka Panah Arah Jalan (Crisp Procedural Arrows)
      const drawRoadArrow = (ax: number, ay: number, dirArrow: 'west' | 'east') => {
        ctx.save();
        ctx.translate(ax - camX, ay - camY);
        ctx.fillStyle = '#f8fafc';
        if (dirArrow === 'west') {
          // Panah Ke Kiri (Barat)
          ctx.fillRect(0, -4, 40, 8);
          ctx.beginPath();
          ctx.moveTo(-15, 0);
          ctx.lineTo(5, -16);
          ctx.lineTo(5, 16);
          ctx.closePath();
          ctx.fill();
        } else {
          // Panah Ke Kanan (Timur)
          ctx.fillRect(-40, -4, 40, 8);
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(-5, -16);
          ctx.lineTo(-5, 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };

      drawRoadArrow(600, 648, 'west');
      drawRoadArrow(1850, 648, 'west');
      drawRoadArrow(750, 984, 'east');
      drawRoadArrow(2000, 984, 'east');

      // 5. Y-SORTED ENTITIES (Props, Monsters, Player)
      interface RenderEntity {
        yOrder: number;
        draw: () => void;
      }

      const entities: RenderEntity[] = [];

      // Render Props
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
          const yFoot = prop.collision ? prop.y + prop.collision.oy + prop.collision.oh : prop.y + prop.h;

          entities.push({
            yOrder: yFoot,
            draw: () => {
              if (img && img.complete && img.naturalWidth > 0) {
                // Bayangan prop
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath();
                ctx.ellipse(scrX + prop.w / 2, scrY + prop.h - 4, prop.w * 0.42, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.drawImage(img, scrX, scrY, prop.w, prop.h);
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
            // Aura merah deteksi
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.beginPath();
            ctx.arc(scrX, scrY + 16, 26, 0, Math.PI * 2);
            ctx.fill();

            // Monster Canvas Sprite
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
          // Bayangan Kaki Player
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
            // Fallback jika belum load
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-16, -48, 32, 48);
          }
          ctx.restore();
        },
      });

      // Sortir dan Render Semuanya
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
