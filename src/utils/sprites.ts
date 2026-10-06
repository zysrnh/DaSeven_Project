// 32x32 Pixel Art Procedural Generator for Anomali SMK
// All sprites are rendered crisply onto 32x32 canvas buffers

export type SpriteId = 
  | 'hero_down_0' | 'hero_down_1'
  | 'hero_up_0' | 'hero_up_1'
  | 'hero_left_0' | 'hero_left_1'
  | 'hero_right_0' | 'hero_right_1'
  | 'hero_battle_idle' | 'hero_battle_attack' | 'hero_battle_defend' | 'hero_battle_hurt'
  | 'void_eyeball_0' | 'void_eyeball_1'
  | 'glitch_monolith_0' | 'glitch_monolith_1'
  | 'cosmic_slime_0' | 'cosmic_slime_1'
  | 'tile_floor' | 'tile_wall' | 'tile_pc_desk' | 'tile_door' | 'tile_blackboard' | 'tile_rift';

const spriteCache: Record<string, HTMLCanvasElement> = {};

function createCanvas32(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

// Helper to draw a pixel rect
function p(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

// 1. HERO SPRITES (Anak SMK: Seragam Putih Abu-abu + Tas Ransel)
function drawHeroBase(ctx: CanvasRenderingContext2D, dir: 'down' | 'up' | 'left' | 'right', frame: number) {
  const legOffset = frame === 1 ? 2 : 0;
  
  // Shadow
  p(ctx, 8, 28, 16, 3, 'rgba(0,0,0,0.3)');

  if (dir === 'down') {
    // Hair
    p(ctx, 11, 4, 10, 6, '#18181b');
    p(ctx, 10, 6, 12, 4, '#27272a');
    p(ctx, 9, 8, 3, 3, '#18181b');
    p(ctx, 20, 8, 3, 3, '#18181b');
    
    // Face
    p(ctx, 11, 8, 10, 6, '#fed7aa');
    p(ctx, 13, 10, 2, 2, '#09090b');
    p(ctx, 17, 10, 2, 2, '#09090b');
    p(ctx, 15, 12, 2, 1, '#fb923c');

    // Shirt
    p(ctx, 10, 14, 12, 7, '#f8fafc');
    p(ctx, 11, 14, 10, 2, '#e2e8f0');
    p(ctx, 15, 15, 2, 4, '#64748b');

    // Hands
    p(ctx, 8, 15, 2, 5, '#fed7aa');
    p(ctx, 22, 15, 2, 5, '#fed7aa');

    // Pants & Legs
    p(ctx, 11, 21, 10, 2, '#475569');
    p(ctx, 11, 23, 4, 5 - legOffset, '#334155');
    p(ctx, 17, 23, 4, 5 + legOffset, '#334155');

    // Shoes
    p(ctx, 10, 28 - legOffset, 5, 3, '#0f172a');
    p(ctx, 17, 28 + legOffset, 5, 3, '#0f172a');
  } 
  else if (dir === 'up') {
    // Back Hair
    p(ctx, 10, 4, 12, 9, '#18181b');
    p(ctx, 11, 3, 10, 2, '#27272a');

    // Backpack
    p(ctx, 10, 13, 12, 8, '#09090b');
    p(ctx, 12, 15, 8, 5, '#1e293b');
    p(ctx, 15, 14, 2, 6, '#38bdf8');

    // Shoulders
    p(ctx, 8, 14, 2, 6, '#f8fafc');
    p(ctx, 22, 14, 2, 6, '#f8fafc');

    // Pants & Shoes
    p(ctx, 11, 22, 4, 6 - legOffset, '#334155');
    p(ctx, 17, 22, 4, 6 + legOffset, '#334155');
    p(ctx, 11, 28 - legOffset, 4, 3, '#0f172a');
    p(ctx, 17, 28 + legOffset, 4, 3, '#0f172a');
  } 
  else {
    // Side view
    const isRight = dir === 'right';

    ctx.save();
    if (!isRight) {
      ctx.scale(-1, 1);
      ctx.translate(-32, 0);
    }

    // Hair
    p(ctx, 12, 4, 9, 8, '#18181b');
    p(ctx, 17, 6, 4, 5, '#18181b');
    p(ctx, 15, 7, 7, 7, '#fed7aa');
    p(ctx, 19, 9, 2, 2, '#09090b');

    // Backpack
    p(ctx, 9, 13, 4, 8, '#09090b');

    // Shirt & Hand
    p(ctx, 13, 14, 7, 7, '#f8fafc');
    p(ctx, 14, 15, 4, 6, '#fed7aa');

    // Pants & Shoes
    p(ctx, 13, 21, 6, 2, '#475569');
    p(ctx, 13 - legOffset, 23, 4, 5, '#334155');
    p(ctx, 16 + legOffset, 23, 4, 5, '#1e293b');
    p(ctx, 13 - legOffset, 28, 5, 3, '#0f172a');
    p(ctx, 16 + legOffset, 28, 5, 3, '#0f172a');

    ctx.restore();
  }
}

// 2. HERO BATTLE POSES
function drawHeroBattle(ctx: CanvasRenderingContext2D, pose: 'idle' | 'attack' | 'defend' | 'hurt') {
  p(ctx, 8, 28, 16, 3, 'rgba(0,0,0,0.3)');

  p(ctx, 10, 4, 11, 8, '#18181b');
  p(ctx, 16, 6, 5, 4, '#18181b');
  p(ctx, 14, 8, 7, 6, '#fed7aa');
  p(ctx, 18, 9, 2, 2, pose === 'hurt' ? '#ef4444' : '#09090b');

  p(ctx, 12, 14, 8, 7, '#f8fafc');
  p(ctx, 14, 14, 2, 5, '#64748b');

  p(ctx, 11, 21, 9, 7, '#334155');
  p(ctx, 10, 28, 5, 3, '#0f172a');
  p(ctx, 16, 28, 5, 3, '#0f172a');

  if (pose === 'idle') {
    p(ctx, 14, 15, 4, 5, '#fed7aa');
    p(ctx, 9, 10, 2, 14, '#94a3b8');
    p(ctx, 9, 9, 2, 2, '#cbd5e1');
  } 
  else if (pose === 'attack') {
    p(ctx, 18, 14, 6, 3, '#fed7aa');
    p(ctx, 23, 8, 3, 16, '#e2e8f0');
    p(ctx, 24, 7, 2, 17, '#38bdf8');
    p(ctx, 26, 6, 4, 2, '#f8fafc');
    p(ctx, 28, 8, 3, 3, '#38bdf8');
    p(ctx, 27, 13, 4, 2, '#f8fafc');
  } 
  else if (pose === 'defend') {
    p(ctx, 18, 11, 5, 11, '#1e3a8a');
    p(ctx, 20, 12, 2, 9, '#f8fafc');
    p(ctx, 16, 14, 3, 4, '#fed7aa');
    p(ctx, 23, 10, 2, 13, '#38bdf8');
  } 
  else if (pose === 'hurt') {
    p(ctx, 8, 14, 4, 5, '#fed7aa');
    p(ctx, 16, 8, 5, 1, '#ef4444');
  }
}

// 3. ALIEN ABSTRAK 1: VOID EYEBALL (32x32)
function drawVoidEyeball(ctx: CanvasRenderingContext2D, frame: number) {
  const floatY = frame === 1 ? -1 : 1;

  p(ctx, 6, 14 + floatY, 3, 2, '#581c87');
  p(ctx, 23, 14 + floatY, 3, 2, '#581c87');
  p(ctx, 14, 4 + floatY, 4, 3, '#3b0764');
  p(ctx, 14, 25 + floatY, 4, 3, '#3b0764');

  p(ctx, 9, 8 + floatY, 14, 14, '#1e1b4b');
  p(ctx, 11, 6 + floatY, 10, 18, '#2e1065');
  p(ctx, 7, 10 + floatY, 18, 10, '#3b0764');

  p(ctx, 12, 11 + floatY, 8, 8, '#dc2626');
  p(ctx, 13, 10 + floatY, 6, 10, '#ef4444');
  
  p(ctx, 14, 13 + floatY, 4, 4, '#000000');
  p(ctx, 13, 12 + floatY, 2, 2, '#fecdd3');
  p(ctx, 17, 16 + floatY, 1, 1, '#f43f5e');

  p(ctx, 4, 8 + floatY, 2, 3, '#a855f7');
  p(ctx, 26, 20 + floatY, 2, 3, '#a855f7');
}

// 4. ALIEN ABSTRAK 2: GLITCH MONOLITH (32x32)
function drawGlitchMonolith(ctx: CanvasRenderingContext2D, frame: number) {
  const shift = frame === 1 ? 2 : -1;

  p(ctx, 11 + shift, 4, 10, 10, '#0f172a');
  p(ctx, 13 + shift, 5, 6, 8, '#1e293b');
  p(ctx, 15 + shift, 6, 2, 6, '#06b6d4');

  p(ctx, 8, 15, 16, 2, '#f43f5e');
  p(ctx, 12, 14, 8, 3, '#22d3ee');

  p(ctx, 11 - shift, 17, 10, 11, '#0f172a');
  p(ctx, 13 - shift, 18, 6, 9, '#1e293b');
  p(ctx, 14 - shift, 20, 4, 2, '#f43f5e');

  p(ctx, 6, 6, 2, 2, '#22d3ee');
  p(ctx, 24, 11, 2, 2, '#f43f5e');
  p(ctx, 7, 24, 2, 2, '#a855f7');
  p(ctx, 23, 26, 2, 2, '#22d3ee');
}

// 5. ALIEN ABSTRAK 3: COSMIC SLIME (32x32)
function drawCosmicSlime(ctx: CanvasRenderingContext2D, frame: number) {
  const squish = frame === 1 ? 2 : 0;

  p(ctx, 8 - squish, 18 - squish, 16 + (squish * 2), 10 + squish, '#047857');
  p(ctx, 6 - squish, 20, 20 + (squish * 2), 7, '#059669');
  p(ctx, 10, 15 - squish, 12, 12 + squish, '#10b981');
  p(ctx, 12, 13 - squish, 8, 5, '#34d399');

  p(ctx, 13, 18 - Math.floor(squish / 2), 6, 5, '#67e8f9');
  p(ctx, 14, 19 - Math.floor(squish / 2), 4, 3, '#ffffff');

  p(ctx, 9, 21, 2, 2, '#a7f3d0');
  p(ctx, 21, 20, 2, 2, '#a7f3d0');
  p(ctx, 15, 12, 2, 2, '#67e8f9');
}

// 6. OVERWORLD TILES (32x32)
function drawTileFloor(ctx: CanvasRenderingContext2D) {
  p(ctx, 0, 0, 32, 32, '#cbd5e1');
  p(ctx, 1, 1, 30, 30, '#e2e8f0');
  p(ctx, 0, 0, 32, 1, '#94a3b8');
  p(ctx, 0, 0, 1, 32, '#94a3b8');
  p(ctx, 6, 8, 2, 1, '#cbd5e1');
  p(ctx, 22, 18, 2, 1, '#cbd5e1');
  p(ctx, 14, 25, 2, 1, '#94a3b8');
}

function drawTileWall(ctx: CanvasRenderingContext2D) {
  p(ctx, 0, 0, 32, 32, '#334155');
  p(ctx, 0, 0, 32, 10, '#1e293b');
  p(ctx, 0, 10, 32, 18, '#475569');
  p(ctx, 0, 28, 32, 4, '#1e293b');
  p(ctx, 0, 18, 32, 1, '#334155');
  p(ctx, 16, 10, 1, 8, '#334155');
  p(ctx, 8, 19, 1, 9, '#334155');
  p(ctx, 24, 19, 1, 9, '#334155');
}

function drawTilePcDesk(ctx: CanvasRenderingContext2D) {
  drawTileFloor(ctx);
  p(ctx, 2, 12, 28, 18, '#78350f');
  p(ctx, 3, 13, 26, 4, '#92400e');
  p(ctx, 8, 2, 16, 14, '#1e293b');
  p(ctx, 9, 3, 14, 11, '#0f172a');
  p(ctx, 10, 4, 12, 9, '#0284c7');
  p(ctx, 12, 6, 8, 2, '#38bdf8');
  p(ctx, 12, 9, 5, 1, '#38bdf8');
  p(ctx, 9, 18, 14, 5, '#334155');
  p(ctx, 10, 19, 12, 3, '#475569');
}

function drawTileDoor(ctx: CanvasRenderingContext2D) {
  drawTileWall(ctx);
  p(ctx, 4, 6, 24, 26, '#854d0e');
  p(ctx, 6, 8, 20, 24, '#a16207');
  p(ctx, 9, 10, 14, 10, '#38bdf8');
  p(ctx, 10, 11, 12, 8, '#7dd3fc');
  p(ctx, 12, 12, 3, 4, '#ffffff');
  p(ctx, 23, 22, 3, 2, '#fbbf24');
}

function drawTileBlackboard(ctx: CanvasRenderingContext2D) {
  drawTileWall(ctx);
  p(ctx, 2, 4, 28, 22, '#713f12');
  p(ctx, 4, 6, 24, 18, '#14532d');
  p(ctx, 6, 9, 10, 2, '#bbf7d0');
  p(ctx, 6, 13, 14, 1, '#bbf7d0');
  p(ctx, 6, 16, 8, 1, '#86efac');
}

function drawTileRift(ctx: CanvasRenderingContext2D) {
  drawTileFloor(ctx);
  p(ctx, 8, 8, 16, 16, '#581c87');
  p(ctx, 10, 10, 12, 12, '#000000');
  p(ctx, 12, 12, 8, 8, '#c026d3');
  p(ctx, 6, 14, 4, 3, '#06b6d4');
  p(ctx, 22, 13, 5, 3, '#06b6d4');
  p(ctx, 14, 6, 3, 4, '#f43f5e');
  p(ctx, 13, 22, 4, 4, '#f43f5e');
}

// MAIN SPRITE RETRIEVAL
export function getSprite(id: SpriteId): HTMLCanvasElement {
  if (spriteCache[id]) return spriteCache[id];

  const [canvas, ctx] = createCanvas32();

  switch (id) {
    case 'hero_down_0': drawHeroBase(ctx, 'down', 0); break;
    case 'hero_down_1': drawHeroBase(ctx, 'down', 1); break;
    case 'hero_up_0': drawHeroBase(ctx, 'up', 0); break;
    case 'hero_up_1': drawHeroBase(ctx, 'up', 1); break;
    case 'hero_left_0': drawHeroBase(ctx, 'left', 0); break;
    case 'hero_left_1': drawHeroBase(ctx, 'left', 1); break;
    case 'hero_right_0': drawHeroBase(ctx, 'right', 0); break;
    case 'hero_right_1': drawHeroBase(ctx, 'right', 1); break;

    case 'hero_battle_idle': drawHeroBattle(ctx, 'idle'); break;
    case 'hero_battle_attack': drawHeroBattle(ctx, 'attack'); break;
    case 'hero_battle_defend': drawHeroBattle(ctx, 'defend'); break;
    case 'hero_battle_hurt': drawHeroBattle(ctx, 'hurt'); break;

    case 'void_eyeball_0': drawVoidEyeball(ctx, 0); break;
    case 'void_eyeball_1': drawVoidEyeball(ctx, 1); break;
    case 'glitch_monolith_0': drawGlitchMonolith(ctx, 0); break;
    case 'glitch_monolith_1': drawGlitchMonolith(ctx, 1); break;
    case 'cosmic_slime_0': drawCosmicSlime(ctx, 0); break;
    case 'cosmic_slime_1': drawCosmicSlime(ctx, 1); break;

    case 'tile_floor': drawTileFloor(ctx); break;
    case 'tile_wall': drawTileWall(ctx); break;
    case 'tile_pc_desk': drawTilePcDesk(ctx); break;
    case 'tile_door': drawTileDoor(ctx); break;
    case 'tile_blackboard': drawTileBlackboard(ctx); break;
    case 'tile_rift': drawTileRift(ctx); break;
  }

  spriteCache[id] = canvas;
  return canvas;
}

export function getSpriteDataUrl(id: SpriteId): string {
  return getSprite(id).toDataURL('image/png');
}
