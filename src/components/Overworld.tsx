import React, { useEffect, useRef, useState } from 'react';
import type { Direction, Enemy, Player } from '../types/game';
import { getSprite, type SpriteId } from '../utils/sprites';
import { getRandomEnemy } from '../data/enemies';
import { playSound } from '../utils/audio';

interface OverworldProps {
  player: Player;
  onEncounter: (enemy: Enemy) => void;
}

const TILE_SIZE = 32;
const MAP_COLS = 20;
const MAP_ROWS = 14;
const CANVAS_WIDTH = MAP_COLS * TILE_SIZE;
const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE;

// 0: Floor, 1: Wall, 2: PC Desk, 3: Door, 4: Blackboard, 5: Anomaly Rift
const MAP_DATA: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 4, 4, 1, 3, 1, 4, 4, 1, 1, 1, 4, 4, 1, 3, 1, 4, 4, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1],
  [1, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 3, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 1],
  [1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

  // Position & Direction
  const playerPosRef = useRef({ x: 96, y: 72 });
  const playerDirRef = useRef<Direction>('right');
  const isMovingRef = useRef(false);
  const animTimerRef = useRef(0);
  const animFrameRef = useRef(0);
  const idleTimerRef = useRef(0);
  const idleFrameRef = useRef(0);
  const stepSoundTimerRef = useRef(0);

  const keysDownRef = useRef<Set<string>>(new Set());

  // 4-Directional 2-Frame Sprites
  const spriteImgRefs = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const list: Record<string, string> = {
      walk_front_1: '/assets/Maine/hero_walk_front_1.png',
      walk_front_2: '/assets/Maine/hero_walk_front_2.png',
      walk_back_1: '/assets/Maine/hero_walk_back_1.png',
      walk_back_2: '/assets/Maine/hero_walk_back_2.png',
      walk_side_1: '/assets/Maine/hero_walk_side_1.png',
      walk_side_2: '/assets/Maine/hero_walk_side_2.png',
      idle_front_1: '/assets/Maine/hero_idle_front_1.png',
      idle_front_2: '/assets/Maine/hero_idle_front_2.png',
    };

    let loadedCount = 0;
    const total = Object.keys(list).length;

    Object.entries(list).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= total) setImagesLoaded(true);
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= total) setImagesLoaded(true);
      };
      spriteImgRefs.current[key] = img;
    });
  }, []);

  // Roaming Monsters
  const monstersRef = useRef<RoamingMonster[]>([
    { id: 'm1', x: 260, y: 130, vx: 20, spriteKey: 'void_eyeball' },
    { id: 'm2', x: 450, y: 290, vx: -20, spriteKey: 'glitch_monolith' },
    { id: 'm3', x: 130, y: 350, vx: 18, spriteKey: 'cosmic_slime' },
  ]);

  const tickRef = useRef(0);

  // Hitbox Collision
  const checkCollisionAt = (px: number, py: number): boolean => {
    const feetLeft = px - 10;
    const feetRight = px + 10;
    const feetTop = py + 12;
    const feetBottom = py + 24;

    if (feetLeft < 0 || feetRight >= CANVAS_WIDTH || feetTop < 0 || feetBottom >= CANVAS_HEIGHT) {
      return true;
    }

    const minCol = Math.floor(feetLeft / TILE_SIZE);
    const maxCol = Math.floor(feetRight / TILE_SIZE);
    const minRow = Math.floor(feetTop / TILE_SIZE);
    const maxRow = Math.floor(feetBottom / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
          const tile = MAP_DATA[r][c];
          if (tile === 1 || tile === 2 || tile === 4) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Keyboard
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

  // Game Loop
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

      // Input
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

      // Analog sliding movement
      if (isMoving) {
        const len = Math.hypot(dx, dy) || 1;
        const speed = 120;
        const moveX = (dx / len) * speed * dt;
        const moveY = (dy / len) * speed * dt;

        const curPos = playerPosRef.current;
        if (!checkCollisionAt(curPos.x + moveX, curPos.y)) {
          curPos.x += moveX;
        }
        if (!checkCollisionAt(curPos.x, curPos.y + moveY)) {
          curPos.y += moveY;
        }

        stepSoundTimerRef.current += dt;
        if (stepSoundTimerRef.current > 0.28) {
          stepSoundTimerRef.current = 0;
          playSound.step();
        }

        animTimerRef.current += dt;
        if (animTimerRef.current > 0.16) {
          animTimerRef.current = 0;
          animFrameRef.current = animFrameRef.current === 0 ? 1 : 0;
        }
      } else {
        animFrameRef.current = 0;
        stepSoundTimerRef.current = 0.2;

        // Idle subtle breathing cycle
        idleTimerRef.current += dt;
        if (idleTimerRef.current > 0.6) {
          idleTimerRef.current = 0;
          idleFrameRef.current = idleFrameRef.current === 0 ? 1 : 0;
        }
      }

      // Monster positions
      monstersRef.current.forEach((m) => {
        m.x += m.vx * dt;
        if (m.x < 100 || m.x > 540) m.vx *= -1;
      });

      // Encounter checks
      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;

      for (let i = 0; i < monstersRef.current.length; i++) {
        const m = monstersRef.current[i];
        if (Math.hypot(pX - m.x, pY - m.y) < 28) {
          playSound.encounter();
          const enemy = getRandomEnemy();
          monstersRef.current.splice(i, 1);
          cancelAnimationFrame(animId);
          onEncounter(enemy);
          return;
        }
      }

      const tileCol = Math.floor(pX / TILE_SIZE);
      const tileRow = Math.floor(pY / TILE_SIZE);
      if (tileRow >= 0 && tileRow < MAP_ROWS && tileCol >= 0 && tileCol < MAP_COLS) {
        if (MAP_DATA[tileRow][tileCol] === 5) {
          playSound.encounter();
          const enemy = getRandomEnemy();
          cancelAnimationFrame(animId);
          onEncounter(enemy);
          return;
        }
      }

      // Draw Tiles
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          const tile = MAP_DATA[r][c];
          let spriteId: SpriteId = 'tile_floor';
          if (tile === 1) spriteId = 'tile_wall';
          else if (tile === 2) spriteId = 'tile_pc_desk';
          else if (tile === 3) spriteId = 'tile_door';
          else if (tile === 4) spriteId = 'tile_blackboard';
          else if (tile === 5) spriteId = 'tile_rift';

          const tileCanvas = getSprite(spriteId);
          ctx.drawImage(tileCanvas, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }

      // Draw Monsters
      const animStep = Math.floor(tickRef.current / 16) % 2;
      monstersRef.current.forEach((m) => {
        const spriteKey = `${m.spriteKey}_${animStep}` as SpriteId;
        const monsterCanvas = getSprite(spriteKey);

        ctx.fillStyle = 'rgba(192, 38, 211, 0.25)';
        ctx.beginPath();
        ctx.arc(m.x, m.y + 12, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(monsterCanvas, m.x - 16, m.y - 12, 32, 32);
      });

      // Draw Player Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(pX, pY + 24, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pick correct 2-frame sprite based on direction & movement state
      let activeSpriteKey = 'idle_front_1';
      const dir = playerDirRef.current;
      const walkFrame = animFrameRef.current;
      const idleFrame = idleFrameRef.current;

      if (isMoving) {
        if (dir === 'down') {
          activeSpriteKey = walkFrame === 0 ? 'walk_front_1' : 'walk_front_2';
        } else if (dir === 'up') {
          activeSpriteKey = walkFrame === 0 ? 'walk_back_1' : 'walk_back_2';
        } else {
          // left / right side walk
          activeSpriteKey = walkFrame === 0 ? 'walk_side_1' : 'walk_side_2';
        }
      } else {
        // Idle states
        if (dir === 'down') {
          activeSpriteKey = idleFrame === 0 ? 'idle_front_1' : 'idle_front_2';
        } else if (dir === 'up') {
          activeSpriteKey = 'walk_back_1';
        } else {
          // Standing sideways
          activeSpriteKey = 'walk_side_2';
        }
      }

      const img = spriteImgRefs.current[activeSpriteKey];

      ctx.save();
      ctx.translate(pX, pY);

      if (dir === 'left') {
        ctx.scale(-1, 1); // Flip horizontally for left walk
      }

      // Render upscaled 16-bit retro sprite (~54x76 px)
      if (img && img.complete && img.naturalWidth > 0) {
        const aspect = img.naturalWidth / img.naturalHeight;
        const targetH = 74;
        const targetW = targetH * aspect;
        ctx.drawImage(img, -targetW / 2, -44, targetW, targetH);
      } else {
        const fallbackId = `hero_${dir}_${animFrameRef.current}` as SpriteId;
        const fallbackCanvas = getSprite(fallbackId);
        ctx.drawImage(fallbackCanvas, -16, -16, 32, 32);
      }

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [onEncounter, imagesLoaded]);

  const startVirtualKey = (key: string) => keysDownRef.current.add(key);
  const stopVirtualKey = (key: string) => keysDownRef.current.delete(key);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d12] text-white p-4 font-mono select-none">
      <div className="w-full max-w-[640px] bg-[#161622] border-2 border-[#323246] p-3 mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 animate-ping" />
          <span className="font-bold text-yellow-400">
            SMK NEGERI 1 KOSMIK • KORIDOR & LAB TKJ
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-neutral-400">
            HP: <strong className="text-green-400">{player.hp}/{player.maxHp}</strong>
          </span>
          <span className="text-cyan-400 font-bold bg-[#1e293b] px-2 py-0.5 border border-[#334155]">
            4 ARAH AKTIF (2-FRAME)
          </span>
        </div>
      </div>

      <div className="relative border-4 border-[#323246] bg-black shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block [image-rendering:pixelated]"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />
      </div>

      <div className="w-full max-w-[640px] mt-3 bg-[#161622] border-2 border-[#323246] p-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-neutral-300">
          <p className="font-bold text-yellow-400 mb-1">🎮 KONTROL GERAK BEBAS 4-ARAH:</p>
          <p>Tahan tombol <strong className="text-white">WASD</strong> atau <strong className="text-white">Panah</strong>. Karakter melangkah natural 2 frame ke 4 arah dengan ukuran sprite pas!</p>
        </div>

        <div className="grid grid-cols-3 gap-1 w-28">
          <div />
          <button
            onMouseDown={() => startVirtualKey('KeyW')}
            onMouseUp={() => stopVirtualKey('KeyW')}
            onMouseLeave={() => stopVirtualKey('KeyW')}
            onTouchStart={() => startVirtualKey('KeyW')}
            onTouchEnd={() => stopVirtualKey('KeyW')}
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
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
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
          >
            ◀
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyS')}
            onMouseUp={() => stopVirtualKey('KeyS')}
            onMouseLeave={() => stopVirtualKey('KeyS')}
            onTouchStart={() => startVirtualKey('KeyS')}
            onTouchEnd={() => stopVirtualKey('KeyS')}
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
          >
            ▼
          </button>
          <button
            onMouseDown={() => startVirtualKey('KeyD')}
            onMouseUp={() => stopVirtualKey('KeyD')}
            onMouseLeave={() => stopVirtualKey('KeyD')}
            onTouchStart={() => startVirtualKey('KeyD')}
            onTouchEnd={() => stopVirtualKey('KeyD')}
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
