import React, { useEffect, useState, useRef } from 'react';
import type { Card, QteGrade } from '../types/game';
import { playSound } from '../utils/audio';

interface ActionTimingBarProps {
  card: Card;
  onResolve?: (grade: QteGrade, multiplier: number) => void;
  onComplete?: (grade: QteGrade, multiplier: number) => void;
  onCancel?: () => void;
}

export const ActionTimingBar: React.FC<ActionTimingBarProps> = ({
  card,
  onResolve,
  onComplete,
  onCancel,
}) => {
  const [needlePos, setNeedlePos] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [grade, setGrade] = useState<QteGrade>(null);

  const posRef = useRef(0);
  const directionRef = useRef(1);
  const animFrameRef = useRef<number | null>(null);

  const speed = card.timingDifficulty === 'hard' ? 2.4 : card.timingDifficulty === 'easy' ? 1.4 : 1.8;
  const perfectWidth = card.timingDifficulty === 'hard' ? 10 : card.timingDifficulty === 'easy' ? 22 : 16;
  const goodWidth = perfectWidth + 24;

  const targetCenter = 50;
  const perfectStart = targetCenter - perfectWidth / 2;
  const perfectEnd = targetCenter + perfectWidth / 2;
  const goodStart = targetCenter - goodWidth / 2;
  const goodEnd = targetCenter + goodWidth / 2;

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 16.66;
      lastTime = currentTime;

      posRef.current += directionRef.current * speed * dt;

      if (posRef.current >= 100) {
        posRef.current = 100;
        directionRef.current = -1;
      } else if (posRef.current <= 0) {
        posRef.current = 0;
        directionRef.current = 1;
      }

      setNeedlePos(posRef.current);

      if (!isResolved) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [speed, isResolved]);

  const triggerHit = () => {
    if (isResolved) return;
    setIsResolved(true);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const hitPos = posRef.current;
    let hitGrade: QteGrade = 'MISS';
    let mult = 0.8;

    if (hitPos >= perfectStart && hitPos <= perfectEnd) {
      hitGrade = 'PERFECT';
      mult = 2.0;
      playSound.attackHit(true);
    } else if (hitPos >= goodStart && hitPos <= goodEnd) {
      hitGrade = 'GOOD';
      mult = 1.3;
      playSound.attackHit(false);
    } else {
      hitGrade = 'MISS';
      mult = 0.8;
      playSound.attackHit(false);
    }

    setGrade(hitGrade);

    setTimeout(() => {
      if (onResolve) onResolve(hitGrade, mult);
      if (onComplete) onComplete(hitGrade, mult);
    }, 750);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerHit();
      } else if (e.code === 'Escape' && onCancel) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResolved, onCancel]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#121218] border-2 border-[#323246] p-6 w-full max-w-lg text-white font-mono shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#323246]">
          <span className="font-bold text-yellow-400 uppercase tracking-wider text-sm">
            [ ACTION TIMING ] {card.name}
          </span>
          <span className="text-xs text-neutral-400 bg-[#1c1c28] px-2 py-0.5 border border-[#323246]">
            Kesulitan: {card.timingDifficulty.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-neutral-300 mb-6 text-center">
          Tekan <span className="text-yellow-300 font-bold bg-[#272738] px-1.5 py-0.5">[SPASI]</span> atau klik tombol di bawah tepat saat jarum berada di zona hijau!
        </p>

        <div className="relative h-14 bg-[#1a1a26] border-2 border-[#474766] mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#3b1219]" />

          <div
            className="absolute top-0 bottom-0 bg-[#854d0e] border-x border-[#ca8a04]"
            style={{ left: `${goodStart}%`, width: `${goodWidth}%` }}
          />

          <div
            className="absolute top-0 bottom-0 bg-[#15803d] border-x-2 border-[#22c55e] flex items-center justify-center"
            style={{ left: `${perfectStart}%`, width: `${perfectWidth}%` }}
          >
            <span className="text-[10px] font-bold text-white tracking-widest uppercase select-none opacity-90">
              CRIT
            </span>
          </div>

          <div
            className={`absolute top-0 bottom-0 w-2.5 transition-colors -ml-1 border-x border-black shadow-[0_0_8px_white] ${
              isResolved 
                ? grade === 'PERFECT' ? 'bg-green-300' : grade === 'GOOD' ? 'bg-yellow-300' : 'bg-red-400'
                : 'bg-white'
            }`}
            style={{ left: `${needlePos}%` }}
          />
        </div>

        <div className="h-10 flex items-center justify-center mb-4">
          {grade && (
            <div
              className={`px-4 py-1 font-black text-sm tracking-wider uppercase border-2 ${
                grade === 'PERFECT'
                  ? 'bg-green-600 text-white border-green-400 animate-bounce'
                  : grade === 'GOOD'
                  ? 'bg-yellow-600 text-white border-yellow-300'
                  : 'bg-red-700 text-white border-red-500'
              }`}
            >
              {grade === 'PERFECT' && '★ PERFECT HIT! CRITICAL x2.0 ★'}
              {grade === 'GOOD' && '✓ GOOD HIT! DAMAGE x1.3'}
              {grade === 'MISS' && '✗ OFF TIMING! DAMAGE x0.8'}
            </div>
          )}
        </div>

        <button
          onClick={triggerHit}
          disabled={isResolved}
          className="w-full py-3 bg-[#e11d48] hover:bg-[#be123c] active:bg-[#9f1239] disabled:opacity-50 text-white font-bold text-base uppercase tracking-widest border-2 border-[#fda4af] transition-colors"
        >
          {isResolved ? 'EKSEKUSI...' : 'TEKAN DISINI / [SPASI]!'}
        </button>
      </div>
    </div>
  );
};
