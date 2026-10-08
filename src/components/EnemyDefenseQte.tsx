import React, { useEffect, useState, useRef } from 'react';
import type { Enemy } from '../types/game';
import { playSound } from '../utils/audio';

interface EnemyDefenseQteProps {
  enemy?: Enemy;
  enemyName?: string;
  intentValue?: number;
  attackSpeed?: number;
  onComplete?: (parried: boolean) => void;
  onResolve?: (parried: boolean) => void;
}

export const EnemyDefenseQte: React.FC<EnemyDefenseQteProps> = ({
  enemy,
  enemyName,
  intentValue,
  attackSpeed,
  onComplete,
  onResolve,
}) => {
  const [progress, setProgress] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [parried, setParried] = useState<boolean | null>(null);

  const eName = enemy?.name || enemyName || 'Musuh Anomali';
  const eDmg = enemy?.intent?.value ?? intentValue ?? 12;
  const eIntentName = enemy?.intent?.name || 'Serangan Bayangan';
  const duration = enemy?.attackSpeed || attackSpeed || 1100;

  const parryWindowStart = 65;
  const parryWindowEnd = 92;

  const startTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);

  const finish = (isSuccess: boolean) => {
    if (onComplete) onComplete(isSuccess);
    if (onResolve) onResolve(isSuccess);
  };

  useEffect(() => {
    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct >= 100) {
        if (!resolved) {
          setResolved(true);
          setParried(false);
          playSound.alienHit();
          setTimeout(() => finish(false), 600);
        }
        return;
      }

      if (!resolved) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [duration, resolved]);

  const triggerDefend = () => {
    if (resolved) return;
    setResolved(true);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const isSuccess = progress >= parryWindowStart && progress <= parryWindowEnd;
    setParried(isSuccess);

    if (isSuccess) {
      playSound.parry();
    } else {
      playSound.alienHit();
    }

    setTimeout(() => {
      finish(isSuccess);
    }, 700);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerDefend();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resolved, progress]);

  return (
    <div className="fixed inset-0 bg-red-950/40 z-50 flex items-center justify-center p-4">
      <div className="bg-[#181014] border-2 border-red-600 p-6 w-full max-w-md text-white font-mono shadow-2xl animate-pulse">
        <div className="flex items-center justify-between pb-2 mb-4 border-b border-red-800">
          <span className="text-red-400 font-bold uppercase tracking-wider text-xs">
            ⚠ PERINGATAN SERANGAN ANOMALI!
          </span>
          <span className="text-xs text-red-300 font-bold">
            {eIntentName}
          </span>
        </div>

        <p className="text-sm font-bold text-center text-red-200 mb-4">
          {eName} menyerang sebesar <span className="text-yellow-400 font-black">{eDmg} DMG</span>!
        </p>

        <div className="relative h-10 bg-[#2d1217] border-2 border-red-500 mb-4 overflow-hidden">
          <div
            className="absolute top-0 bottom-0 bg-yellow-500/80 border-x-2 border-yellow-300 flex items-center justify-center"
            style={{ left: `${parryWindowStart}%`, width: `${parryWindowEnd - parryWindowStart}%` }}
          >
            <span className="text-[10px] font-black text-black uppercase tracking-wider">
              PARRY ZONE
            </span>
          </div>

          <div
            className="absolute top-0 bottom-0 left-0 bg-red-500 opacity-70"
            style={{ width: `${progress}%` }}
          />

          <div
            className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_8px_white]"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="h-8 flex items-center justify-center mb-4">
          {parried !== null && (
            <div
              className={`px-3 py-0.5 font-black text-sm uppercase tracking-wider border-2 ${
                parried
                  ? 'bg-cyan-700 text-cyan-100 border-cyan-400'
                  : 'bg-red-800 text-red-100 border-red-500'
              }`}
            >
              {parried ? '★ PARRY SUKSES! (-80% DAMAGE) ★' : '✗ PARRY GAGAL! KENA DAMAGE PENUH!'}
            </div>
          )}
        </div>

        <button
          onClick={triggerDefend}
          disabled={resolved}
          className="w-full py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-widest border border-red-300 transition-colors"
        >
          {resolved ? 'MENAHAN...' : 'TANGKIS! [SPASI]'}
        </button>
      </div>
    </div>
  );
};
