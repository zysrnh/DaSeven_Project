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
  const animFrameRef = useRef(0); // 0, 1, 2 (3-phase walk cycle)
  const idleTimerRef = useRef(0);
  const idleFrameRef = useRef(0); // 0, 1, 2 (3-frame idle)
  const stepSoundTimerRef = useRef(0);

  const keysDownRef = useRef<Set<string>>(new Set());

  // Multi-Frame Sliced Sprites
  const spriteImgRefs = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const list: Record<string, string> = {
      // Idle overworld
      idle_1: '/assets/Maine/hero_idle_1.png',
      idle_2: '/assets/Maine/hero_idle_2.png',
      idle_3: '/assets/Maine/hero_idle_3.png',
      // Walk Down / Front
      walk_front_1: '/assets/Maine/hero_walk_front_1.png',
      walk_front_2: '/assets/Maine/hero_walk_front_2.png',
      walk_front_3: '/assets/Maine/hero_walk_front_3.png',
      // Walk Side (Horizontal)
      walk_side_1: '/assets/Maine/hero_walk_side_1.png',
      walk_side_2: '/assets/Maine/hero_walk_side_2.png',
      walk_side_3: '/assets/Maine/hero_walk_side_3.png',
      // Walk Up / Back
      walk_up_1: '/assets/Maine/hero_walk_up_1.png',
      walk_up_2: '/assets/Maine/hero_walk_up_2.png',
      walk_up_3: '/assets/Maine/hero_walk_up_3.png',
      // Avatar
      hero_avatar: '/assets/Maine/hero_avatar.png',
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

      // Kecepatan 175 px/detik
      if (isMoving) {
        const len = Math.hypot(dx, dy) || 1;
        const speed = 175;
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
        if (stepSoundTimerRef.current > 0.22) {
          stepSoundTimerRef.current = 0;
          playSound.step();
        }

        // Tempo animasi jalan 0.12s per frame (Cycle 0 -> 1 -> 2 -> 1)
        animTimerRef.current += dt;
        if (animTimerRef.current > 0.12) {
          animTimerRef.current = 0;
          animFrameRef.current = (animFrameRef.current + 1) % 4; // 0, 1, 2, 3
        }
      } else {
        animFrameRef.current = 0;
        stepSoundTimerRef.current = 0.15;

        // Idle bernapas santai 3 frame
        idleTimerRef.current += dt;
        if (idleTimerRef.current > 0.45) {
          idleTimerRef.current = 0;
          idleFrameRef.current = (idleFrameRef.current + 1) % 3;
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

      // Sprite Selection Logic
      let activeSpriteKey = 'idle_1';
      const dir = playerDirRef.current;
      const stepPhase = animFrameRef.current; // 0, 1, 2, 3
      // Walk 3-frame ping-pong: frame 1 -> frame 2 -> frame 3 -> frame 2
      const walkFrameIdx = stepPhase === 3 ? 2 : stepPhase + 1; // 1, 2, 3, 2

      if (isMoving) {
        if (dir === 'down') {
          activeSpriteKey = `walk_front_${walkFrameIdx}`;
        } else if (dir === 'up') {
          activeSpriteKey = `walk_up_${walkFrameIdx}`;
        } else {
          activeSpriteKey = `walk_side_${walkFrameIdx}`;
        }
      } else {
        // Idle states
        if (dir === 'down') {
          activeSpriteKey = `idle_${idleFrameRef.current + 1}`;
        } else if (dir === 'up') {
          activeSpriteKey = 'walk_up_2';
        } else {
          activeSpriteKey = 'walk_side_2';
        }
      }

      const img = spriteImgRefs.current[activeSpriteKey];

      ctx.save();
      ctx.translate(pX, pY);

      if (dir === 'left') {
        ctx.scale(-1, 1); // Flip horizontally saat hadap kiri
      }

      // Micro-bobbing
      const stepBob = isMoving && (stepPhase === 1 || stepPhase === 3) ? -2 : 0;

      // Render sliced sprite
      if (img && img.complete && img.naturalWidth > 0) {
        const aspect = img.naturalWidth / img.naturalHeight;
        const targetH = 74;
        const targetW = targetH * aspect;
        ctx.drawImage(img, -targetW / 2, -44 + stepBob, targetW, targetH);
      } else {
        const fallbackId = `hero_${dir}_${stepPhase % 2}` as SpriteId;
        const fallbackCanvas = getSprite(fallbackId);
        ctx.drawImage(fallbackCanvas, -16, -16 + stepBob, 32, 32);
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
          <img
            src="/assets/Maine/hero_avatar.png"
            alt="Hero Icon"
            className="w-10 h-10 object-contain bg-[#09090e] border border-yellow-500/50 p-0.5 shadow"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-yellow-400">{player.name}</span>
              <span className="text-[10px] text-cyan-400 bg-[#1e293b] px-1.5 py-0.2 border border-[#334155]">
                {player.jurusan}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">SMK NEGERI 1 KOSMIK • KORIDOR TKJ</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-neutral-400">
            HP: <strong className="text-green-400">{player.hp}/{player.maxHp}</strong>
          </span>
          <div className="w-3 h-3 bg-red-500 animate-ping" />
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
          <p>Tahan tombol <strong className="text-white">WASD</strong> atau <strong className="text-white">Panah</strong> untuk menjelajahi lab & koridor sekolah!</p>
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
