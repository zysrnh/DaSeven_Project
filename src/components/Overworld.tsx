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
  dir: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
}

export const Overworld: React.FC<OverworldProps> = ({ player, onEncounter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [posX, setPosX] = useState(2);
  const [posY, setPosY] = useState(2);
  const [direction, setDirection] = useState<Direction>('down');
  const [walkFrame, setWalkFrame] = useState(0);

  const monstersRef = useRef<RoamingMonster[]>([
    { id: 'm1', x: 8, y: 4, dir: 1, spriteKey: 'void_eyeball' },
    { id: 'm2', x: 14, y: 9, dir: -1, spriteKey: 'glitch_monolith' },
    { id: 'm3', x: 4, y: 11, dir: 1, spriteKey: 'cosmic_slime' },
  ]);

  const tickRef = useRef(0);

  const isSolid = (x: number, y: number) => {
    if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return true;
    const tile = MAP_DATA[y][x];
    return tile === 1 || tile === 2 || tile === 4;
  };

  const tryMove = (dx: number, dy: number, newDir: Direction) => {
    setDirection(newDir);
    const targetX = posX + dx;
    const targetY = posY + dy;

    if (!isSolid(targetX, targetY)) {
      setPosX(targetX);
      setPosY(targetY);
      setWalkFrame((prev) => (prev === 0 ? 1 : 0));
      playSound.step();

      const monsterIdx = monstersRef.current.findIndex(
        (m) => Math.round(m.x) === targetX && Math.round(m.y) === targetY
      );

      if (monsterIdx !== -1) {
        playSound.encounter();
        const enemy = getRandomEnemy();
        monstersRef.current.splice(monsterIdx, 1);
        setTimeout(() => onEncounter(enemy), 200);
        return;
      }

      if (MAP_DATA[targetY][targetX] === 5) {
        playSound.encounter();
        const enemy = getRandomEnemy();
        setTimeout(() => onEncounter(enemy), 200);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        tryMove(0, -1, 'up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        tryMove(0, 1, 'down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        tryMove(-1, 0, 'left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        tryMove(1, 0, 'right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posX, posY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animId: number;

    const render = () => {
      tickRef.current++;
      const animStep = Math.floor(tickRef.current / 16) % 2;

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

      monstersRef.current.forEach((m) => {
        const spriteKey = `${m.spriteKey}_${animStep}` as SpriteId;
        const monsterCanvas = getSprite(spriteKey);

        ctx.fillStyle = 'rgba(192, 38, 211, 0.2)';
        ctx.beginPath();
        ctx.arc(m.x * TILE_SIZE + 16, m.y * TILE_SIZE + 16, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(monsterCanvas, m.x * TILE_SIZE, m.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      });

      const playerSpriteId = `hero_${direction}_${walkFrame}` as SpriteId;
      const playerCanvas = getSprite(playerSpriteId);
      ctx.drawImage(playerCanvas, posX * TILE_SIZE, posY * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [posX, posY, direction, walkFrame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d12] text-white p-4 font-mono select-none">
      <div className="w-full max-w-[640px] bg-[#161622] border-2 border-[#323246] p-3 mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 animate-ping" />
          <span className="font-bold text-yellow-400">
            SMK NEGERI 1 KOSMIK • LAB KOMPUTER & JARINGAN
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-neutral-400">
            HP: <strong className="text-green-400">{player.hp}/{player.maxHp}</strong>
          </span>
          <span className="text-cyan-400 font-bold bg-[#1e293b] px-2 py-0.5 border border-[#334155]">
            TKJ
          </span>
        </div>
      </div>

      <div className="relative border-4 border-[#323246] bg-black shadow-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={MAP_COLS * TILE_SIZE}
          height={MAP_ROWS * TILE_SIZE}
          className="block [image-rendering:pixelated]"
          style={{ width: MAP_COLS * TILE_SIZE, height: MAP_ROWS * TILE_SIZE }}
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />
      </div>

      <div className="w-full max-w-[640px] mt-3 bg-[#161622] border-2 border-[#323246] p-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-neutral-300">
          <p className="font-bold text-yellow-400 mb-1">🎮 KONTROL EKSPLORASI:</p>
          <p>Tekan <strong className="text-white">WASD</strong> atau <strong className="text-white">Tombol Panah</strong> untuk berjalan.</p>
          <p className="text-neutral-400 mt-0.5">Dekati anomali alien atau portal retak di lantai untuk bertarung!</p>
        </div>

        <div className="grid grid-cols-3 gap-1 w-28">
          <div />
          <button
            onClick={() => tryMove(0, -1, 'up')}
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => tryMove(-1, 0, 'left')}
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
          >
            ◀
          </button>
          <button
            onClick={() => tryMove(0, 1, 'down')}
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
          >
            ▼
          </button>
          <button
            onClick={() => tryMove(1, 0, 'right')}
            className="p-2 bg-[#262638] hover:bg-[#3b3b54] active:bg-[#4f4f6e] text-white border border-[#4a4a66] font-bold"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
