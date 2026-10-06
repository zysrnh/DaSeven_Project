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
const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 640px
const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 448px

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
  x: number; // in pixels
  y: number;
  vx: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
}

export const Overworld: React.FC<OverworldProps> = ({ player, onEncounter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Continuous Pixel Positions
  const playerPosRef = useRef({ x: 96, y: 72 });
  const playerDirRef = useRef<Direction>('right');
  const isMovingRef = useRef(false);
  const animTimerRef = useRef(0);
  const animFrameRef = useRef(0);
  const stepSoundTimerRef = useRef(0);

  // Active Key Tracker
  const keysDownRef = useRef<Set<string>>(new Set());

  // Sliced Hero Sprites
  const heroIdleImgRef = useRef<HTMLImageElement | null>(null);
  const heroWalkImgRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load custom hero sprites
  useEffect(() => {
    let count = 0;
    const checkDone = () => {
      count++;
      if (count >= 2) setImagesLoaded(true);
    };

    const idle = new Image();
    idle.src = '/assets/hero_idle.png';
    idle.onload = checkDone;
    idle.onerror = checkDone;
    heroIdleImgRef.current = idle;

    const walk = new Image();
    walk.src = '/assets/hero_walk.png';
    walk.onload = checkDone;
    walk.onerror = checkDone;
    heroWalkImgRef.current = walk;
  }, []);

  // Roaming Monsters
  const monstersRef = useRef<RoamingMonster[]>([
    { id: 'm1', x: 260, y: 130, vx: 20, spriteKey: 'void_eyeball' },
    { id: 'm2', x: 450, y: 290, vx: -20, spriteKey: 'glitch_monolith' },
    { id: 'm3', x: 130, y: 350, vx: 18, spriteKey: 'cosmic_slime' },
  ]);

  const tickRef = useRef(0);

  // Hitbox Collision Check (AABB at character feet: 18x12 pixels)
  const checkCollisionAt = (px: number, py: number): boolean => {
    // Character base anchor: center-bottom
    const feetLeft = px - 9;
    const feetRight = px + 9;
    const feetTop = py + 8;
    const feetBottom = py + 20;

    // Check canvas boundaries
    if (feetLeft < 0 || feetRight >= CANVAS_WIDTH || feetTop < 0 || feetBottom >= CANVAS_HEIGHT) {
      return true;
    }

    // Check tiles intersecting feet hitbox
    const minCol = Math.floor(feetLeft / TILE_SIZE);
    const maxCol = Math.floor(feetRight / TILE_SIZE);
    const minRow = Math.floor(feetTop / TILE_SIZE);
    const maxRow = Math.floor(feetBottom / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
          const tile = MAP_DATA[r][c];
          if (tile === 1 || tile === 2 || tile === 4) {
            return true; // Solid collision (wall, desk, blackboard)
          }
        }
      }
    }
    return false;
  };

  // Keyboard Event Listeners
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

  // Main 60 FPS Game Loop (Smooth Analog Movement)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let lastTime = performance.now();
    let animId: number;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // Delta time in seconds, max 50ms
      lastTime = currentTime;
      tickRef.current++;

      // 1. Calculate Input Direction
      let dx = 0;
      let dy = 0;

      const keys = keysDownRef.current;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

      // Determine Facing Direction
      if (dx < 0) playerDirRef.current = 'left';
      else if (dx > 0) playerDirRef.current = 'right';
      else if (dy < 0) playerDirRef.current = 'up';
      else if (dy > 0) playerDirRef.current = 'down';

      // 2. Normalize Velocity
      const isMoving = dx !== 0 || dy !== 0;
      isMovingRef.current = isMoving;

      if (isMoving) {
        let length = Math.hypot(dx, dy);
        dx = (dx / length);
        dy = (dy / length);

        const speed = 135; // Pixels per second
        const moveX = dx * speed * dt;
        const moveY = dy * speed * dt;

        let curPos = playerPosRef.current;

        // Slide Collision: Check X movement independently
        if (!checkCollisionAt(curPos.x + moveX, curPos.y)) {
          curPos.x += moveX;
        }
        // Slide Collision: Check Y movement independently
        if (!checkCollisionAt(curPos.x, curPos.y + moveY)) {
          curPos.y += moveY;
        }

        // Footstep sound cadence
        stepSoundTimerRef.current += dt;
        if (stepSoundTimerRef.current > 0.28) {
          stepSoundTimerRef.current = 0;
          playSound.step();
        }

        // Walk cycle animation
        animTimerRef.current += dt;
        if (animTimerRef.current > 0.16) {
          animTimerRef.current = 0;
          animFrameRef.current = animFrameRef.current === 0 ? 1 : 0;
        }
      } else {
        animFrameRef.current = 0; // Return to idle
        stepSoundTimerRef.current = 0.2;
      }

      // 3. Update Roaming Monsters Position
      monstersRef.current.forEach((m) => {
        m.x += m.vx * dt;
        if (m.x < 100 || m.x > 540) m.vx *= -1; // Bounce inside corridor
      });

      // 4. Proximity Encounter Check with Monsters (radius 24px)
      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;

      for (let i = 0; i < monstersRef.current.length; i++) {
        const m = monstersRef.current[i];
        const dist = Math.hypot(pX - m.x, pY - m.y);
        if (dist < 26) {
          playSound.encounter();
          const enemy = getRandomEnemy();
          monstersRef.current.splice(i, 1);
          cancelAnimationFrame(animId);
          onEncounter(enemy);
          return;
        }
      }

      // Check proximity with Anomaly Rift tiles (tile 5)
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

      // 5. RENDER CANVAS
      // 5a. Draw Tiles
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

      // 5b. Draw Roaming Monsters
      const animStep = Math.floor(tickRef.current / 16) % 2;
      monstersRef.current.forEach((m) => {
        const spriteKey = `${m.spriteKey}_${animStep}` as SpriteId;
        const monsterCanvas = getSprite(spriteKey);

        // Cosmic aura glow
        ctx.fillStyle = 'rgba(192, 38, 211, 0.25)';
        ctx.beginPath();
        ctx.arc(m.x, m.y + 12, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(monsterCanvas, m.x - 16, m.y - 12, 32, 32);
      });

      // 5c. Draw Player (Anak SMK with High-Res Pixel Sprite)
      const isLeft = playerDirRef.current === 'left';
      const isWalk = isMovingRef.current && animFrameRef.current === 1;

      // Shadow under feet
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(pX, pY + 20, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(pX, pY);

      if (isLeft) {
        ctx.scale(-1, 1); // Flip horizontally for left movement
      }

      // Render custom sliced pixel sprite
      const targetImg = isWalk ? heroWalkImgRef.current : heroIdleImgRef.current;
      if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
        // Draw custom sprite: 40px wide, 48px tall, centered horizontally
        ctx.drawImage(targetImg, -20, -26, 40, 48);
      } else {
        // Fallback to procedural 32x32 sprite if image loading
        const fallbackId = `hero_${playerDirRef.current}_${animFrameRef.current}` as SpriteId;
        const fallbackCanvas = getSprite(fallbackId);
        ctx.drawImage(fallbackCanvas, -16, -16, 32, 32);
      }

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [onEncounter, imagesLoaded]);

  // Virtual Joypad Handlers (Hold to continuous move)
  const startVirtualKey = (key: string) => {
    keysDownRef.current.add(key);
  };
  const stopVirtualKey = (key: string) => {
    keysDownRef.current.delete(key);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d12] text-white p-4 font-mono select-none">
      {/* HEADER / HUD */}
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
            GERAK BEBAS
          </span>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative border-4 border-[#323246] bg-black shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block [image-rendering:pixelated]"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        />

        {/* Ambient CRT Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />
      </div>

      {/* INSTRUCTIONS & JOYPAD BUTTONS */}
      <div className="w-full max-w-[640px] mt-3 bg-[#161622] border-2 border-[#323246] p-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-neutral-300">
          <p className="font-bold text-yellow-400 mb-1">🎮 KONTROL GERAK BEBAS (ANALOG):</p>
          <p>Tahan tombol <strong className="text-white">WASD</strong> atau <strong className="text-white">Tombol Panah</strong> untuk jalan leluasa ke segala arah (termasuk serong/diagonal).</p>
          <p className="text-neutral-400 mt-0.5">Ada sistem collision sliding: tidak akan nyangkut di sudut dinding/meja!</p>
        </div>

        {/* VIRTUAL CONTINUOUS JOYPAD BUTTONS */}
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
