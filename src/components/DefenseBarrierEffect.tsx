import React from 'react';

interface DefenseBarrierEffectProps {
  isActive: boolean;
  shieldValue: number;
}

export const DefenseBarrierEffect: React.FC<DefenseBarrierEffectProps> = ({ isActive, shieldValue }) => {
  if (!isActive && shieldValue <= 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Outer Flat Geometric Barrier Box */}
      <div className="relative w-44 h-40 border-2 border-cyan-400 bg-cyan-950/40">
        {/* Solid Corner Brackets */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-300" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-300" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-300" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-300" />

        {/* Flat Grid lines (Retro Pixel Forcefield) */}
        <div className="absolute inset-2 border border-dashed border-cyan-500/60" />

        {/* Center Hexagonal Shield Emblem (Flat Solid SVG) */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0e1726] border-2 border-cyan-400 px-2 py-0.5 flex items-center gap-1 shadow-sm">
          <svg className="w-3.5 h-3.5 fill-cyan-400" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.54-3.07 8.79-7 9.88-3.93-1.09-7-5.34-7-9.88V6.3l7-3.12z" />
          </svg>
          <span className="text-[10px] font-bold text-cyan-300 font-mono tracking-wider">
            PERISAI BINDER +{shieldValue}
          </span>
        </div>

        {/* Defense Buff Indicator at the Bottom */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-cyan-400 px-2 py-0.2">
          <span className="text-[9px] font-bold text-white uppercase tracking-tight">
            DEFEND BUFF AKTIF
          </span>
        </div>
      </div>
    </div>
  );
};
