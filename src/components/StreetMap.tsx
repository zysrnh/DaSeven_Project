import React, { useEffect, useRef, useState } from 'react';
import type { Direction, Enemy, Player } from '../types/game';
import { playSound } from '../utils/audio';

interface StreetMapProps {
  player: Player;
  onEncounter: (enemy: Enemy) => void;
  onReturnToSchool: () => void;
}

// DIMENSI DUNIA JALAN RAYA BALEENDAH
const WORLD_WIDTH = 2880;
const WORLD_HEIGHT = 1500;

interface BuildingShop {
  id: string;
  name: string;
  tagline: string;
  category: 'pabrik' | 'sekolah' | 'fotocopy' | 'warmindo' | 'counter_hp' | 'warung_madura' | 'bengkel' | 'minimarket';
  x: number;
  y: number;
  w: number;
  h: number;
  bannerColor: string;
  textColor: string;
  wallColor: string;
  roofColor: string;
}

// DAFTAR BANGUNAN & TOKO BERVARIASI (PALET WARNA TERPADU 32-BIT MUTED CINEMATIC)
const BUILDINGS: BuildingShop[] = [
  // 1. P = PABRIK (Kiri Atas)
  {
    id: 'b_pabrik',
    name: 'PT. TEXTILE BALEENDAH',
    tagline: 'PABRIK & GUDANG INDUSTRI • K3 UTAMA',
    category: 'pabrik',
    x: 60,
    y: 40,
    w: 320,
    h: 340,
    bannerColor: '#2b3340',
    textColor: '#cbd5e1',
    wallColor: '#1a202a',
    roofColor: '#12161e',
  },

  // 2. S & G = GEDUNG & GERBANG SMKN 7 (Utara Tengah)
  {
    id: 'b_smkn7',
    name: 'SMK NEGERI 7 BALEENDAH',
    tagline: 'KAMPUS PUSAT KEJURUAN • DISIPLIN & PRESTASI',
    category: 'sekolah',
    x: 580,
    y: 40,
    w: 580,
    h: 340,
    bannerColor: '#1e2f47',
    textColor: '#e0b567',
    wallColor: '#1f2734',
    roofColor: '#141a24',
  },

  // 3. T1 = FOTOCOPY & ALAT TULIS (Samping Kanan Gerbang)
  {
    id: 'b_fotocopy',
    name: 'FOTOCOPY & ATK "KURNIA"',
    tagline: 'JILID • LAMINATING • CETAK SKRIPSI & TUGAS',
    category: 'fotocopy',
    x: 1200,
    y: 80,
    w: 250,
    h: 300,
    bannerColor: '#254a6b',
    textColor: '#e8edf3',
    wallColor: '#212935',
    roofColor: '#151b24',
  },

  // 4. T2 = WARMINDO KUNINGAN (Sebelah Fotocopy)
  {
    id: 'b_warmindo',
    name: 'WARMINDO "PUTRA KUNINGAN"',
    tagline: 'MIE DOK-DOK • KOPI JOSS • GORENGAN HANGAT',
    category: 'warmindo',
    x: 1480,
    y: 80,
    w: 250,
    h: 300,
    bannerColor: '#842f2b',
    textColor: '#eed28c',
    wallColor: '#282220',
    roofColor: '#181413',
  },

  // 5. TS = TOKO SERBA ADA / MINIMARKET (Sudut Kanan Atas Perempatan)
  {
    id: 'b_minimarket',
    name: 'BALEENDAH MART 24 JAM',
    tagline: 'MINIMARKET • ANEKA JAJANAN & MINUMAN DINGIN',
    category: 'minimarket',
    x: 2280,
    y: 60,
    w: 520,
    h: 320,
    bannerColor: '#23533c',
    textColor: '#eaf2ec',
    wallColor: '#1d2721',
    roofColor: '#121a15',
  },

  // 6. T3 = COUNTER PULSA & SERVIS HP (Selatan Kiri)
  {
    id: 'b_counter_hp',
    name: 'SEVEN CELL & ACC',
    tagline: 'PULSA • KUOTA ALL OPERATOR • SERVIS HP',
    category: 'counter_hp',
    x: 100,
    y: 1080,
    w: 380,
    h: 360,
    bannerColor: '#4f3c66',
    textColor: '#eee8f6',
    wallColor: '#231d2c',
    roofColor: '#15111b',
  },

  // 7. T4 = WARUNG KELONTONG MADURA 24 JAM (Selatan Tengah)
  {
    id: 'b_warung_madura',
    name: 'WARUNG MADURA 24 JAM',
    tagline: 'BENSIN ECERAN • GAS LPG • SEMBAKO LENGKAP',
    category: 'warung_madura',
    x: 510,
    y: 1080,
    w: 400,
    h: 360,
    bannerColor: '#7b4425',
    textColor: '#f7ebd0',
    wallColor: '#27201a',
    roofColor: '#17120e',
  },

  // 8. T5 = BENGKEL MOTOR & TAMBAL BAN (Selatan Kanan Sebelum TN Lapang)
  {
    id: 'b_bengkel',
    name: 'BENGKEL MOTOR "SETIA"',
    tagline: 'GANTI OLI • TAMBAL BAN • TUNE UP & SPAREPART',
    category: 'bengkel',
    x: 940,
    y: 1080,
    w: 420,
    h: 360,
    bannerColor: '#8a4023',
    textColor: '#eee5dd',
    wallColor: '#26201b',
    roofColor: '#16120e',
  },

  // 9. T6 = TOKO VARIASI DI TENGGARA PEREMPATAN
  {
    id: 'b_toko_selatan',
    name: 'TOKO ELEKTRONIK & TEKNIK',
    tagline: 'KABEL LAN • LAMPU LED • KOMPONEN ELEKTRO',
    category: 'counter_hp',
    x: 2280,
    y: 1080,
    w: 520,
    h: 360,
    bannerColor: '#264a66',
    textColor: '#e8edf3',
    wallColor: '#1b242e',
    roofColor: '#10171e',
  },
];

interface StreetProp {
  id: string;
  type: 'street_lamp' | 'bench' | 'planter_box' | 'trash_station' | 'bensin_rack' | 'ban_stack';
  x: number;
  y: number;
  w: number;
  h: number;
  collision?: { ox: number; oy: number; ow: number; oh: number };
}

// PROPS TROTOAR & AKSESORIS TOKO
const STREET_PROPS: StreetProp[] = [
  // Trotoar Depan Pabrik & Jalan Cabang
  { id: 'lamp_p1', type: 'street_lamp', x: 200, y: 350, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },
  { id: 'planter_p1', type: 'planter_box', x: 290, y: 395, w: 80, h: 80, collision: { ox: 4, oy: 42, ow: 72, oh: 36 } },

  // Trotoar Depan SMKN 7
  { id: 'lamp_s1', type: 'street_lamp', x: 620, y: 350, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },
  { id: 'bench_s1', type: 'bench', x: 690, y: 405, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },
  { id: 'sampah_s1', type: 'trash_station', x: 1020, y: 405, w: 76, h: 62, collision: { ox: 4, oy: 25, ow: 68, oh: 34 } },
  { id: 'lamp_s2', type: 'street_lamp', x: 1120, y: 350, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },

  // Trotoar Depan Toko Fotocopy & Warmindo
  { id: 'planter_t1', type: 'planter_box', x: 1330, y: 395, w: 80, h: 80, collision: { ox: 4, oy: 42, ow: 72, oh: 36 } },
  { id: 'bench_t1', type: 'bench', x: 1530, y: 405, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },
  { id: 'lamp_t1', type: 'street_lamp', x: 1720, y: 350, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },

  // Trotoar Sudut Perempatan TS (Minimarket)
  { id: 'lamp_ts1', type: 'street_lamp', x: 2310, y: 350, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },
  { id: 'bench_ts1', type: 'bench', x: 2420, y: 405, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },
  { id: 'sampah_ts1', type: 'trash_station', x: 2570, y: 405, w: 76, h: 62, collision: { ox: 4, oy: 25, ow: 68, oh: 34 } },

  // Trotoar Selatan (Counter HP, Warung Madura, Bengkel)
  { id: 'lamp_bot1', type: 'street_lamp', x: 240, y: 920, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },
  { id: 'bench_bot1', type: 'bench', x: 350, y: 975, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },

  // Bensin Eceran Madura & Gas
  { id: 'bensin_1', type: 'bensin_rack', x: 530, y: 980, w: 50, h: 55, collision: { ox: 2, oy: 20, ow: 46, oh: 32 } },
  { id: 'lamp_bot2', type: 'street_lamp', x: 860, y: 920, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },

  // Ban Bekas Bengkel
  { id: 'ban_1', type: 'ban_stack', x: 960, y: 985, w: 60, h: 50, collision: { ox: 2, oy: 15, ow: 56, oh: 32 } },
  { id: 'sampah_bot1', type: 'trash_station', x: 1290, y: 975, w: 76, h: 62, collision: { ox: 4, oy: 25, ow: 68, oh: 34 } },

  // Area Lapangan Terbuka Selatan
  { id: 'planter_bot1', type: 'planter_box', x: 1460, y: 965, w: 80, h: 80, collision: { ox: 4, oy: 42, ow: 72, oh: 36 } },
  { id: 'bench_bot2', type: 'bench', x: 1590, y: 975, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },
  { id: 'lamp_bot3', type: 'street_lamp', x: 1740, y: 920, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },

  // Trotoar Sudut Toko Selatan Perempatan
  { id: 'lamp_bot4', type: 'street_lamp', x: 2310, y: 920, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },
  { id: 'bench_bot3', type: 'bench', x: 2450, y: 975, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },
];

// Helper: Pola Aspal 32-bit Retro Bersih (Senada dengan lantai Maine)
const createCleanAsphaltPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Warna dasar slate charcoal gelap
  ctx.fillStyle = '#161c24';
  ctx.fillRect(0, 0, 32, 32);

  // Dithering cluster pixel 2x2 yang lembut dan cinematic
  ctx.fillStyle = '#12171f';
  ctx.fillRect(4, 4, 4, 4);
  ctx.fillRect(20, 8, 4, 4);
  ctx.fillRect(8, 20, 4, 4);
  ctx.fillRect(24, 24, 4, 4);

  ctx.fillStyle = '#1c232e';
  ctx.fillRect(12, 12, 4, 4);
  ctx.fillRect(28, 2, 4, 4);
  ctx.fillRect(0, 26, 4, 4);
  ctx.fillRect(16, 28, 4, 4);

  // Lajur roda halus
  ctx.fillStyle = 'rgba(14, 18, 24, 0.45)';
  ctx.fillRect(0, 14, 32, 4);

  return c;
};

// Helper: Pola Trotoar Paving Blok 32x32 (Identik dengan lantai grid pada karakter Maine)
const createSidewalkTilePattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Nat sambungan gelap
  ctx.fillStyle = '#111620';
  ctx.fillRect(0, 0, 32, 32);

  const drawTile = (tx: number, ty: number, tw: number, th: number, tone: string, hi: string, sh: string) => {
    ctx.fillStyle = tone;
    ctx.fillRect(tx + 1, ty + 1, tw - 2, th - 2);

    ctx.fillStyle = hi;
    ctx.fillRect(tx + 1, ty + 1, tw - 2, 1);
    ctx.fillRect(tx + 1, ty + 1, 1, th - 2);

    ctx.fillStyle = sh;
    ctx.fillRect(tx + 1, ty + th - 2, tw - 2, 1);
    ctx.fillRect(tx + tw - 2, ty + 1, 1, th - 2);
  };

  // Ubin Paving bernuansa slate grey matching lantai di screenshot Maine
  drawTile(0, 0, 16, 16, '#242b37', '#333e50', '#181e28');
  drawTile(16, 0, 16, 16, '#28313e', '#374356', '#1c222c');
  drawTile(0, 16, 16, 16, '#262e3b', '#354152', '#1a202a');
  drawTile(16, 16, 16, 16, '#222934', '#313c4e', '#171c26');

  return c;
};

// Helper: Pola Tanah Lapang Terbuka Pixel Art 32x32 (Muted earthy tones)
const createCleanDirtPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.fillStyle = '#382b1f';
  ctx.fillRect(0, 0, 32, 32);

  ctx.fillStyle = '#2e2319';
  ctx.fillRect(6, 6, 4, 4);
  ctx.fillRect(22, 10, 4, 4);
  ctx.fillRect(10, 22, 4, 4);
  ctx.fillRect(24, 26, 4, 4);

  ctx.fillStyle = '#443527';
  ctx.fillRect(14, 14, 4, 4);
  ctx.fillRect(28, 2, 4, 4);
  ctx.fillRect(2, 28, 4, 4);

  ctx.fillStyle = '#594533';
  ctx.fillRect(8, 12, 2, 2);
  ctx.fillRect(24, 18, 2, 2);

  return c;
};

export const StreetMap: React.FC<StreetMapProps> = ({ player, onReturnToSchool }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Posisi Awal Maine di Depan Gerbang SMKN 7 (x: 870, y: 440)
  const playerPosRef = useRef({ x: 870, y: 440 });
  const playerDirRef = useRef<Direction>('down');
  const isMovingRef = useRef(false);
  const animTimerRef = useRef(0);
  const animFrameRef = useRef(0);
  const idleTimerRef = useRef(0);
  const idleFrameRef = useRef(0);
  const stepSoundTimerRef = useRef(0);

  // Kamera Smooth Follow Berperspektif
  const cameraRef = useRef({ x: 870, y: 440 });
  const [viewportSize, setViewportSize] = useState({ w: 1024, h: 640 });

  const keysDownRef = useRef<Set<string>>(new Set());
  const [nearSchoolGate, setNearSchoolGate] = useState(false);

  // Cache Gambar Karakter Maine
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});

  // Patterns Cache
  const asphaltPatternRef = useRef<CanvasPattern | null>(null);
  const sidewalkPatternRef = useRef<CanvasPattern | null>(null);
  const dirtPatternRef = useRef<CanvasPattern | null>(null);

  // Resize Handler
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

  // Preload Aset Animasi Karakter Maine
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
    };

    Object.entries(assetList).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      imagesRef.current[key] = img;
    });
  }, []);

  // Hitbox Collision
  const checkCollisionAt = (px: number, py: number): boolean => {
    const feetLeft = px - 18;
    const feetRight = px + 18;
    const feetTop = py + 22;
    const feetBottom = py + 38;

    if (feetLeft < 50 || feetRight >= WORLD_WIDTH - 50 || feetTop < 40 || feetBottom >= WORLD_HEIGHT - 50) {
      return true;
    }

    const inSchoolGatePass = feetLeft >= 820 && feetRight <= 920;
    if (feetTop < 380 && inSchoolGatePass && feetTop >= 250) {
      return false;
    }

    const inWestBranchStreet = feetLeft >= 400 && feetRight <= 560;
    if (feetTop < 380 && inWestBranchStreet) {
      return false;
    }

    const inEastIntersectionNorth = feetLeft >= 1840 && feetRight <= 2240;
    if (feetTop < 380 && inEastIntersectionNorth) {
      return false;
    }

    const inEastIntersectionSouth = feetLeft >= 1840 && feetRight <= 2240;
    if (feetBottom > 1060 && inEastIntersectionSouth) {
      return false;
    }

    for (const b of BUILDINGS) {
      const bLeft = b.x;
      const bRight = b.x + b.w;
      const bTop = b.y;
      const bBottom = b.y + b.h;

      if (b.category === 'sekolah' && inSchoolGatePass && feetTop >= 250) {
        continue;
      }

      if (feetRight > bLeft && feetLeft < bRight && feetBottom > bTop && feetTop < bBottom) {
        return true;
      }
    }

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

  // Keyboard Event Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'Space'].includes(code)) {
        e.preventDefault();
        keysDownRef.current.add(code);

        if (code === 'Space') {
          const cur = playerPosRef.current;
          if (cur.x >= 800 && cur.x <= 940 && cur.y <= 390) {
            playSound.cardSelect();
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

  const startVirtualKey = (code: string) => keysDownRef.current.add(code);
  const stopVirtualKey = (code: string) => keysDownRef.current.delete(code);

  // Main Game Loop & Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    if (!asphaltPatternRef.current) {
      const p = ctx.createPattern(createCleanAsphaltPattern(), 'repeat');
      if (p) asphaltPatternRef.current = p;
    }
    if (!sidewalkPatternRef.current) {
      const p = ctx.createPattern(createSidewalkTilePattern(), 'repeat');
      if (p) sidewalkPatternRef.current = p;
    }
    if (!dirtPatternRef.current) {
      const p = ctx.createPattern(createCleanDirtPattern(), 'repeat');
      if (p) dirtPatternRef.current = p;
    }

    let lastTime = performance.now();
    let animId: number;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

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

      const isNearGate = pX >= 800 && pX <= 940 && pY <= 390;
      setNearSchoolGate(isNearGate);

      if (isNearGate && pY <= 270) {
        playSound.cardSelect();
        cancelAnimationFrame(animId);
        onReturnToSchool();
        return;
      }

      // 2. SMOOTH CAMERA FOLLOW
      const targetCamX = pX - viewportSize.w / 2;
      const targetCamY = pY - viewportSize.h / 2;
      const maxCamX = WORLD_WIDTH - viewportSize.w;
      const maxCamY = WORLD_HEIGHT - viewportSize.h;

      const clampedCamX = Math.max(0, Math.min(maxCamX, targetCamX));
      const clampedCamY = Math.max(0, Math.min(maxCamY, targetCamY));

      cameraRef.current.x += (clampedCamX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (clampedCamY - cameraRef.current.y) * 0.12;

      const camX = Math.round(cameraRef.current.x);
      const camY = Math.round(cameraRef.current.y);

      // KUNCI PATTERN KE KOORDINAT DUNIA
      if (asphaltPatternRef.current && typeof asphaltPatternRef.current.setTransform === 'function') {
        asphaltPatternRef.current.setTransform(new DOMMatrix().translate(-camX, -camY));
      }
      if (sidewalkPatternRef.current && typeof sidewalkPatternRef.current.setTransform === 'function') {
        sidewalkPatternRef.current.setTransform(new DOMMatrix().translate(-camX, -camY));
      }
      if (dirtPatternRef.current && typeof dirtPatternRef.current.setTransform === 'function') {
        dirtPatternRef.current.setTransform(new DOMMatrix().translate(-camX, -camY));
      }

      // 3. BACKGROUND CLEAR (Slate Dark Ambience)
      ctx.fillStyle = '#0f141d';
      ctx.fillRect(0, 0, viewportSize.w, viewportSize.h);

      // ========================================================
      // A. JALAN RAYA & PEREMPATAN ASPAL
      // ========================================================
      ctx.save();
      ctx.fillStyle = asphaltPatternRef.current || '#161c24';

      ctx.fillRect(-camX, 520 - camY, WORLD_WIDTH, 400);
      ctx.fillRect(400 - camX, -camY, 160, 520);
      ctx.fillRect(1840 - camX, -camY, 400, WORLD_HEIGHT);
      ctx.restore();

      // ========================================================
      // B. TROTOAR URBAN PAVING BERSIH (PALET SENADA LANTAI MAINE)
      // ========================================================
      ctx.save();
      ctx.fillStyle = sidewalkPatternRef.current || '#242b37';

      ctx.fillRect(50 - camX, 380 - camY, 350, 140);
      ctx.fillRect(560 - camX, 380 - camY, 1280, 140);
      ctx.fillRect(2240 - camX, 380 - camY, WORLD_WIDTH - 2290, 140);
      ctx.fillRect(360 - camX, -camY, 40, 420);
      ctx.fillRect(560 - camX, -camY, 40, 420);
      ctx.fillRect(50 - camX, 920 - camY, 1310, 160);
      ctx.fillRect(2240 - camX, 920 - camY, WORLD_WIDTH - 2290, 160);
      ctx.fillRect(1800 - camX, -camY, 40, 420);
      ctx.fillRect(2240 - camX, -camY, 40, 420);
      ctx.fillRect(1800 - camX, 1020 - camY, 40, 480);
      ctx.fillRect(2240 - camX, 1020 - camY, 40, 480);
      ctx.restore();

      // Lapangan Tanah Pojok Selatan
      ctx.save();
      ctx.fillStyle = dirtPatternRef.current || '#382b1f';
      ctx.fillRect(1360 - camX, 920 - camY, 480, 540);
      ctx.restore();

      // ========================================================
      // C. JALUR UBIN KUNING PEMANDU DISABILITAS (WARM AMBER OCHRE)
      // ========================================================
      const drawTactileLine = (x1: number, x2: number, ty: number) => {
        for (let x = x1; x < x2; x += 16) {
          const sx = x - camX;
          const sy = ty - camY;
          ctx.fillStyle = '#b88a38';
          ctx.fillRect(sx, sy, 15, 12);
          ctx.fillStyle = '#d4a84d';
          ctx.fillRect(sx, sy, 15, 2);
          ctx.fillRect(sx, sy + 5, 15, 2);
          ctx.fillRect(sx, sy + 10, 15, 2);
        }
      };

      drawTactileLine(60, 390, 444);
      drawTactileLine(570, 790, 444);
      drawTactileLine(950, 1830, 444);
      drawTactileLine(2250, WORLD_WIDTH - 60, 444);

      drawTactileLine(60, 790, 994);
      drawTactileLine(950, 1350, 994);
      drawTactileLine(2250, WORLD_WIDTH - 60, 994);

      // ========================================================
      // D. RAMP TURUNAN TROTOAR KE JALAN (TRANSISI ZEBRA CROSS)
      // ========================================================
      ctx.fillStyle = '#1c232e';
      ctx.fillRect(800 - camX, 504 - camY, 140, 22);
      ctx.fillStyle = '#262f3e';
      ctx.fillRect(800 - camX, 504 - camY, 140, 3);
      ctx.fillStyle = '#131820';
      ctx.fillRect(800 - camX, 523 - camY, 140, 3);

      ctx.fillStyle = '#1c232e';
      ctx.fillRect(800 - camX, 914 - camY, 140, 22);
      ctx.fillStyle = '#262f3e';
      ctx.fillRect(800 - camX, 933 - camY, 140, 3);
      ctx.fillStyle = '#131820';
      ctx.fillRect(800 - camX, 914 - camY, 140, 3);

      // ========================================================
      // E. KERB BATU TEPI JALAN PIXEL ART (MUTED STONE GREY)
      // ========================================================
      const drawHorizontalCurb = (startX: number, endX: number, cy: number, isUpper: boolean) => {
        const curbBlockW = 24;
        const curbBlockH = 16;
        for (let x = startX; x < endX; x += curbBlockW) {
          const isWhite = Math.floor(x / curbBlockW) % 2 === 0;
          const sx = x - camX;
          const sy = cy - camY;

          if (isWhite) {
            ctx.fillStyle = '#d5dae2';
            ctx.fillRect(sx, sy, curbBlockW - 1, curbBlockH);
            ctx.fillStyle = '#abb2bf';
            ctx.fillRect(sx, sy + curbBlockH - 3, curbBlockW - 1, 3);
          } else {
            ctx.fillStyle = '#28303d';
            ctx.fillRect(sx, sy, curbBlockW - 1, 3);
            ctx.fillStyle = '#191f28';
            ctx.fillRect(sx, sy + 3, curbBlockW - 1, curbBlockH - 3);
          }
          ctx.fillStyle = '#0f131a';
          ctx.fillRect(sx + curbBlockW - 1, sy, 1, curbBlockH);
        }
        ctx.fillStyle = isUpper ? '#11151c' : '#0e1218';
        ctx.fillRect(startX - camX, cy + (isUpper ? 16 : 0) - camY, endX - startX, 2);
      };

      drawHorizontalCurb(50, 400, 504, true);
      drawHorizontalCurb(560, 800, 504, true);
      drawHorizontalCurb(940, 1840, 504, true);
      drawHorizontalCurb(2240, WORLD_WIDTH - 50, 504, true);

      drawHorizontalCurb(50, 800, 920, false);
      drawHorizontalCurb(940, 1840, 920, false);
      drawHorizontalCurb(2240, WORLD_WIDTH - 50, 920, false);

      // ========================================================
      // F. MARKA JALAN RAYA BALEENDAH (BROKEN WHITE & WARM AMBER)
      // ========================================================
      ctx.fillStyle = '#dce1e8';
      ctx.fillRect(50 - camX, 526 - camY, 350, 4);
      ctx.fillRect(560 - camX, 526 - camY, 240, 4);
      ctx.fillRect(940 - camX, 526 - camY, 830, 4);
      ctx.fillRect(2240 - camX, 526 - camY, WORLD_WIDTH - 2290, 4);

      ctx.fillRect(50 - camX, 910 - camY, 750, 4);
      ctx.fillRect(940 - camX, 910 - camY, 830, 4);
      ctx.fillRect(2240 - camX, 910 - camY, WORLD_WIDTH - 2290, 4);

      const drawYellowDoubleLine = (x1: number, x2: number) => {
        for (let x = x1; x < x2; x += 16) {
          const sx = x - camX;
          const sy = 720 - camY;
          ctx.fillStyle = '#d49e35';
          ctx.fillRect(sx, sy - 5, 16, 4);
          ctx.fillRect(sx, sy + 3, 16, 4);
          ctx.fillStyle = '#b07c22';
          ctx.fillRect(sx, sy - 1, 16, 1);
          ctx.fillRect(sx, sy + 7, 16, 1);
        }
      };
      drawYellowDoubleLine(50, 1770);
      drawYellowDoubleLine(2280, WORLD_WIDTH - 50);

      const drawDashedLane = (x1: number, x2: number, ly: number) => {
        for (let x = x1; x < x2; x += 130) {
          ctx.fillStyle = '#dce1e8';
          ctx.fillRect(x - camX, ly - camY, 70, 4);
          ctx.fillStyle = '#838e9f';
          ctx.fillRect(x - camX, ly + 3 - camY, 70, 1);
        }
      };
      drawDashedLane(60, 1770, 620);
      drawDashedLane(60, 1770, 820);
      drawDashedLane(2280, WORLD_WIDTH - 50, 620);
      drawDashedLane(2280, WORLD_WIDTH - 50, 820);

      // Zebra Cross Depan Gerbang SMKN 7
      for (let y = 524; y < 916; y += 42) {
        ctx.fillStyle = '#e2e7ee';
        ctx.fillRect(800 - camX, y - camY, 140, 22);
        ctx.fillStyle = '#abb3bf';
        ctx.fillRect(800 - camX, y + 19 - camY, 140, 3);
      }

      // Zebra Cross Simpang Perempatan Timur
      for (let y = 530; y < 910; y += 44) {
        ctx.fillStyle = '#e2e7ee';
        ctx.fillRect(1770 - camX, y - camY, 60, 22);
        ctx.fillRect(2250 - camX, y - camY, 60, 22);
      }
      for (let x = 1860; x < 2220; x += 44) {
        ctx.fillStyle = '#e2e7ee';
        ctx.fillRect(x - camX, 480 - camY, 22, 50);
        ctx.fillRect(x - camX, 910 - camY, 22, 50);
      }

      // ========================================================
      // G. Y-SORTED ENTITIES (FASAD TOKO, PROPS 2.5D, PLAYER MAINE)
      // ========================================================
      interface RenderEntity {
        yOrder: number;
        draw: () => void;
      }
      const entities: RenderEntity[] = [];

      BUILDINGS.forEach((b) => {
        const sx = b.x - camX;
        const sy = b.y - camY;

        entities.push({
          yOrder: b.y + b.h - 10,
          draw: () => {
            ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
            ctx.fillRect(sx, sy + b.h - 8, b.w, 16);

            ctx.fillStyle = b.wallColor;
            ctx.fillRect(sx, sy, b.w, b.h);

            ctx.strokeStyle = '#121721';
            ctx.lineWidth = 3;
            ctx.strokeRect(sx, sy, b.w, b.h);

            // Atap Bangunan
            ctx.fillStyle = b.roofColor;
            ctx.fillRect(sx - 4, sy - 8, b.w + 8, 36);
            ctx.fillStyle = '#2b3442';
            ctx.fillRect(sx - 4, sy + 24, b.w + 8, 4);

            // Plang Nama Toko Vintage Muted
            ctx.fillStyle = '#111722';
            ctx.fillRect(sx + 10, sy + 38, b.w - 20, 58);
            ctx.fillStyle = b.bannerColor;
            ctx.fillRect(sx + 12, sy + 40, b.w - 24, 54);
            ctx.strokeStyle = '#d4a84d';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx + 12, sy + 40, b.w - 24, 54);

            ctx.fillStyle = '#eed28c';
            ctx.fillRect(sx + 20, sy + 36, 12, 4);
            ctx.fillRect(sx + b.w - 32, sy + 36, 12, 4);

            ctx.fillStyle = b.textColor;
            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(b.name, sx + b.w / 2, sy + 66);

            ctx.fillStyle = '#dce2ea';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(b.tagline, sx + b.w / 2, sy + 84);

            // DETAIL FASAD TOKO MUTED & HARMONIS
            if (b.category === 'sekolah') {
              ctx.fillStyle = '#111722';
              ctx.fillRect(sx + 240, sy + 140, 100, 200);

              ctx.fillStyle = '#2c3545';
              ctx.fillRect(sx + 210, sy + 110, 30, 230);
              ctx.fillRect(sx + 340, sy + 110, 30, 230);
              ctx.fillStyle = '#3a4659';
              ctx.fillRect(sx + 214, sy + 114, 22, 222);
              ctx.fillRect(sx + 344, sy + 114, 22, 222);

              ctx.fillStyle = '#1e2f47';
              ctx.fillRect(sx + 200, sy + 110, 180, 24);
              ctx.fillStyle = '#e0b567';
              ctx.font = 'bold 10px monospace';
              ctx.fillText('🚪 GERBANG UTAMA SMKN 7', sx + 290, sy + 126);

              ctx.fillStyle = '#1c2430';
              ctx.fillRect(sx + 80, sy + 180, 110, 150);
              ctx.strokeStyle = '#374354';
              ctx.lineWidth = 2;
              ctx.strokeRect(sx + 80, sy + 180, 110, 150);
              ctx.fillStyle = '#324a61';
              ctx.fillRect(sx + 95, sy + 200, 50, 40);
              ctx.fillStyle = '#cad3df';
              ctx.fillRect(sx + 100, sy + 205, 10, 10);
              ctx.fillStyle = '#d49e35';
              ctx.font = 'bold 8px monospace';
              ctx.fillText('POS SATPAM', sx + 135, sy + 195);
            } else if (b.category === 'fotocopy') {
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#254a6b' : '#d5dbe2';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 22);
              }
              ctx.fillStyle = '#111722';
              ctx.fillRect(sx + 15, sy + 135, b.w - 30, 140);
              ctx.fillStyle = '#1c364e';
              ctx.fillRect(sx + 20, sy + 140, b.w - 40, 130);

              ctx.fillStyle = '#abb4c0';
              ctx.fillRect(sx + 30, sy + 170, 70, 65);
              ctx.fillStyle = '#374151';
              ctx.fillRect(sx + 35, sy + 160, 40, 10);
              ctx.fillStyle = '#254a6b';
              ctx.fillRect(sx + 80, sy + 175, 12, 10);

              ctx.fillStyle = '#d8dee6';
              ctx.fillRect(sx + 120, sy + 165, 30, 20);
              ctx.fillStyle = '#ba8b3a';
              ctx.fillRect(sx + 155, sy + 165, 30, 20);
              ctx.fillStyle = '#873a36';
              ctx.fillRect(sx + 190, sy + 165, 30, 20);
              ctx.fillStyle = '#2d5173';
              ctx.fillRect(sx + 120, sy + 195, 100, 18);

              ctx.fillStyle = 'rgba(216, 225, 235, 0.15)';
              ctx.fillRect(sx + b.w - 60, sy + 140, 35, 130);
              ctx.fillStyle = '#e8edf3';
              ctx.fillRect(sx + b.w - 55, sy + 195, 4, 20);
            } else if (b.category === 'warmindo') {
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#842f2b' : '#c99335';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 22);
              }
              ctx.fillStyle = '#181413';
              ctx.fillRect(sx + 15, sy + 135, b.w - 30, 140);

              ctx.fillStyle = '#a8782a';
              ctx.fillRect(sx + 24, sy + 145, 80, 75);
              ctx.fillStyle = '#7a3e1b';
              ctx.fillRect(sx + 28, sy + 185, 20, 14);
              ctx.fillRect(sx + 52, sy + 185, 20, 14);
              ctx.fillRect(sx + 76, sy + 185, 20, 14);
              ctx.fillStyle = 'rgba(238, 210, 140, 0.2)';
              ctx.fillRect(sx + 28, sy + 150, 72, 10);

              const mieColors = ['#9e3535', '#b88a38', '#2e6b47', '#365375'];
              for (let i = 0; i < 4; i++) {
                ctx.fillStyle = mieColors[i];
                ctx.fillRect(sx + 115 + i * 22, sy + 145, 16, 50);
                ctx.fillStyle = '#ede5d8';
                ctx.fillRect(sx + 117 + i * 22, sy + 155, 12, 6);
              }

              ctx.fillStyle = '#59321c';
              ctx.fillRect(sx + 20, sy + 225, b.w - 40, 20);
              ctx.fillStyle = '#254a6b';
              ctx.fillRect(sx + 130, sy + 205, 22, 22);
              ctx.fillStyle = '#dce2e8';
              ctx.fillRect(sx + 134, sy + 209, 14, 14);
            } else if (b.category === 'counter_hp') {
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#4f3c66' : '#2b476e';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 20);
              }
              ctx.fillStyle = '#121017';
              ctx.fillRect(sx + 15, sy + 130, b.w - 30, 180);

              ctx.fillStyle = '#234460';
              ctx.fillRect(sx + 24, sy + 150, b.w - 48, 80);
              ctx.fillStyle = 'rgba(216, 225, 235, 0.15)';
              ctx.fillRect(sx + 30, sy + 155, b.w - 60, 16);

              for (let hx = sx + 35; hx < sx + b.w - 60; hx += 34) {
                ctx.fillStyle = '#1a202c';
                ctx.fillRect(hx, sy + 175, 16, 28);
                ctx.fillStyle = '#315473';
                ctx.fillRect(hx + 2, sy + 177, 12, 22);
              }

              ctx.fillStyle = '#943333';
              ctx.fillRect(sx + 35, sy + 240, 45, 22);
              ctx.fillStyle = '#b88a38';
              ctx.fillRect(sx + 90, sy + 240, 45, 22);
              ctx.fillStyle = '#2b4d73';
              ctx.fillRect(sx + 145, sy + 240, 45, 22);
              ctx.fillStyle = '#6b4782';
              ctx.fillRect(sx + 200, sy + 240, 45, 22);
              ctx.fillStyle = '#ede8f6';
              ctx.font = 'bold 8px monospace';
              ctx.fillText('TS', sx + 57, sy + 254);
              ctx.fillText('ISAT', sx + 112, sy + 254);
              ctx.fillText('XL', sx + 167, sy + 254);
              ctx.fillText('SF', sx + 222, sy + 254);
            } else if (b.category === 'warung_madura') {
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#8a3131' : '#ddd4c7';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 20);
              }
              ctx.fillStyle = '#17120e';
              ctx.fillRect(sx + 15, sy + 130, b.w - 30, 180);

              ctx.fillStyle = '#59321c';
              ctx.fillRect(sx + 25, sy + 140, b.w - 50, 80);
              ctx.fillStyle = '#181413';
              ctx.fillRect(sx + 30, sy + 145, b.w - 60, 32);
              ctx.fillRect(sx + 30, sy + 182, b.w - 60, 32);

              for (let rx = sx + 34; rx < sx + b.w - 40; rx += 14) {
                ctx.fillStyle = '#8f3434';
                ctx.fillRect(rx, sy + 148, 10, 14);
                ctx.fillStyle = '#b58434';
                ctx.fillRect(rx, sy + 163, 10, 12);
                ctx.fillStyle = '#2f4f70';
                ctx.fillRect(rx, sy + 185, 10, 14);
              }

              ctx.fillStyle = '#214663';
              ctx.fillRect(sx + 35, sy + 235, 24, 34);
              ctx.fillRect(sx + 64, sy + 235, 24, 34);
              ctx.fillRect(sx + 49, sy + 205, 24, 34);
              ctx.fillStyle = '#396b94';
              ctx.fillRect(sx + 41, sy + 239, 4, 26);
              ctx.fillRect(sx + 70, sy + 239, 4, 26);

              ctx.fillStyle = '#26593a';
              ctx.beginPath();
              ctx.ellipse(sx + 115, sy + 255, 12, 16, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(sx + 142, sy + 255, 12, 16, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#1d422b';
              ctx.fillRect(sx + 109, sy + 238, 12, 4);
              ctx.fillRect(sx + 136, sy + 238, 12, 4);

              ctx.fillStyle = '#842f2b';
              ctx.fillRect(sx + b.w - 85, sy + 200, 50, 75);
              ctx.fillStyle = '#dce1e8';
              ctx.fillRect(sx + b.w - 78, sy + 210, 36, 20);
              ctx.fillStyle = '#2d6142';
              ctx.fillRect(sx + b.w - 74, sy + 214, 28, 12);
            } else if (b.category === 'bengkel') {
              ctx.fillStyle = '#333b47';
              ctx.fillRect(sx + 15, sy + 106, b.w - 30, 20);
              for (let ax = 0; ax < b.w - 30; ax += 12) {
                ctx.fillStyle = '#242a33';
                ctx.fillRect(sx + 15 + ax, sy + 106, 2, 20);
              }
              ctx.fillStyle = '#171c24';
              ctx.fillRect(sx + 20, sy + 130, b.w - 40, 180);

              for (let ry = sy + 130; ry < sy + 210; ry += 12) {
                ctx.fillStyle = '#2c3440';
                ctx.fillRect(sx + 20, ry, b.w - 40, 9);
                ctx.fillStyle = '#171c24';
                ctx.fillRect(sx + 20, ry + 9, b.w - 40, 3);
              }

              ctx.fillStyle = '#10141a';
              ctx.fillRect(sx + 30, sy + 210, b.w - 60, 100);

              ctx.fillStyle = '#543420';
              ctx.fillRect(sx + 40, sy + 230, 120, 10);
              const oliColors = ['#8f3434', '#26593a', '#2b4d73', '#b58434'];
              for (let i = 0; i < 4; i++) {
                ctx.fillStyle = oliColors[i];
                ctx.fillRect(sx + 46 + i * 26, sy + 216, 18, 14);
              }

              ctx.fillStyle = '#a84c24';
              ctx.fillRect(sx + 180, sy + 240, 36, 26);
              ctx.fillStyle = '#171c24';
              ctx.fillRect(sx + 184, sy + 264, 10, 8);
              ctx.fillRect(sx + 202, sy + 264, 10, 8);
              ctx.fillStyle = '#595f6b';
              ctx.fillRect(sx + 194, sy + 232, 8, 8);

              for (let ti = 0; ti < 3; ti++) {
                ctx.fillStyle = '#12161e';
                ctx.beginPath();
                ctx.ellipse(sx + b.w - 80, sy + 230 + ti * 16, 22, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#262f3b';
                ctx.beginPath();
                ctx.ellipse(sx + b.w - 80, sy + 230 + ti * 16, 10, 5, 0, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (b.category === 'minimarket') {
              ctx.fillStyle = '#8f3434';
              ctx.fillRect(sx + 15, sy + 106, b.w - 30, 6);
              ctx.fillStyle = '#b88a38';
              ctx.fillRect(sx + 15, sy + 112, b.w - 30, 6);
              ctx.fillStyle = '#2b4d73';
              ctx.fillRect(sx + 15, sy + 118, b.w - 30, 6);

              ctx.fillStyle = '#203a4f';
              ctx.fillRect(sx + 20, sy + 135, b.w - 40, 150);
              ctx.fillStyle = 'rgba(216, 225, 235, 0.15)';
              ctx.fillRect(sx + 26, sy + 140, b.w - 52, 24);

              ctx.fillStyle = '#101720';
              ctx.fillRect(sx + b.w / 2 - 50, sy + 150, 100, 135);
              ctx.fillStyle = 'rgba(40, 74, 102, 0.4)';
              ctx.fillRect(sx + b.w / 2 - 45, sy + 155, 42, 125);
              ctx.fillRect(sx + b.w / 2 + 3, sy + 155, 42, 125);
              ctx.fillStyle = '#dce2ea';
              ctx.fillRect(sx + b.w / 2 - 7, sy + 205, 3, 25);
              ctx.fillRect(sx + b.w / 2 + 4, sy + 205, 3, 25);

              for (let gy = sy + 175; gy < sy + 250; gy += 25) {
                ctx.fillStyle = '#b58434';
                ctx.fillRect(sx + 35, gy, 65, 12);
                ctx.fillStyle = '#26593a';
                ctx.fillRect(sx + b.w - 100, gy, 65, 12);
              }
            } else if (b.category === 'pabrik') {
              for (let px = sx + 20; px < sx + b.w - 20; px += 20) {
                ctx.fillStyle = '#27313f';
                ctx.fillRect(px, sy + 115, 18, 175);
                ctx.fillStyle = '#171e27';
                ctx.fillRect(px + 16, sy + 115, 2, 175);
              }

              ctx.fillStyle = '#10151c';
              ctx.fillRect(sx + 60, sy + 170, b.w - 120, 120);
              for (let hz = sx + 60; hz < sx + b.w - 60; hz += 24) {
                ctx.fillStyle = '#9e7e2c';
                ctx.fillRect(hz, sy + 170, 12, 16);
                ctx.fillStyle = '#10151c';
                ctx.fillRect(hz + 12, sy + 170, 12, 16);
              }

              ctx.fillStyle = '#4c5768';
              ctx.fillRect(sx + 80, sy + 130, 45, 25);
              ctx.fillRect(sx + b.w - 125, sy + 130, 45, 25);
            }
          },
        });
      });

      // Render Props Trotoar 2.5D
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
              if (prop.type === 'planter_box') {
                ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
                ctx.fillRect(scrX + 6, scrY + 70, 70, 10);
                ctx.fillStyle = '#171d26';
                ctx.fillRect(scrX + 4, scrY + 40, 72, 32);
                ctx.fillStyle = '#242b36';
                ctx.fillRect(scrX + 6, scrY + 42, 68, 28);
                ctx.fillStyle = '#333d4c';
                ctx.fillRect(scrX + 3, scrY + 36, 74, 6);

                const drawLeafCluster = (cx: number, cy: number, w: number, h: number) => {
                  ctx.fillStyle = '#0f2618';
                  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
                  ctx.fillStyle = '#19422b';
                  ctx.fillRect(cx - w / 2 + 2, cy - h / 2 + 1, w - 4, h - 2);
                  ctx.fillStyle = '#296141';
                  ctx.fillRect(cx - w / 2 + 4, cy - h / 2 + 3, w - 7, h - 5);
                  ctx.fillStyle = '#45855e';
                  ctx.fillRect(cx - 2, cy - h / 2 + 2, 3, 2);
                };
                drawLeafCluster(scrX + 22, scrY + 30, 26, 20);
                drawLeafCluster(scrX + 58, scrY + 30, 26, 20);
                drawLeafCluster(scrX + 40, scrY + 22, 30, 22);
              } else if (prop.type === 'street_lamp') {
                ctx.fillStyle = 'rgba(238, 210, 140, 0.1)';
                ctx.beginPath();
                ctx.ellipse(scrX + 24, scrY + 112, 52, 16, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
                ctx.beginPath();
                ctx.ellipse(scrX + 24, scrY + 114, 18, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#11151c';
                ctx.fillRect(scrX + 13, scrY + 104, 22, 10);
                ctx.fillStyle = '#171d26';
                ctx.fillRect(scrX + 21, scrY + 22, 2, 76);
                ctx.fillStyle = '#313b4a';
                ctx.fillRect(scrX + 23, scrY + 22, 2, 76);

                ctx.fillStyle = '#d49e35';
                ctx.fillRect(scrX + 12, scrY + 7, 22, 12);
                ctx.fillStyle = '#eed28c';
                ctx.fillRect(scrX + 15, scrY + 9, 16, 8);
                ctx.fillStyle = '#faf5e8';
                ctx.fillRect(scrX + 20, scrY + 10, 6, 6);
                ctx.fillStyle = '#11151c';
                ctx.fillRect(scrX + 8, scrY + 2, 30, 5);
              } else if (prop.type === 'bench') {
                ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
                ctx.fillRect(scrX + 4, scrY + 44, 92, 12);
                ctx.fillStyle = '#11151c';
                ctx.fillRect(scrX + 8, scrY + 14, 6, 26);
                ctx.fillRect(scrX + 86, scrY + 14, 6, 26);

                for (let wy = scrY + 24; wy <= scrY + 36; wy += 6) {
                  ctx.fillStyle = '#4d2a17';
                  ctx.fillRect(scrX + 6, wy, 88, 4);
                  ctx.fillStyle = '#6b3c22';
                  ctx.fillRect(scrX + 6, wy, 88, 1);
                }
              } else if (prop.type === 'trash_station') {
                ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
                ctx.fillRect(scrX + 10, scrY + 50, 56, 10);

                ctx.fillStyle = '#1d422b';
                ctx.fillRect(scrX + 8, scrY + 20, 24, 30);
                ctx.fillStyle = '#2f6342';
                ctx.fillRect(scrX + 12, scrY + 20, 4, 30);
                ctx.fillStyle = '#3a4454';
                ctx.fillRect(scrX + 6, scrY + 14, 28, 6);

                ctx.fillStyle = '#7a4e1d';
                ctx.fillRect(scrX + 40, scrY + 20, 24, 30);
                ctx.fillStyle = '#aa712f';
                ctx.fillRect(scrX + 44, scrY + 20, 4, 30);
                ctx.fillStyle = '#3a4454';
                ctx.fillRect(scrX + 38, scrY + 14, 28, 6);
              } else if (prop.type === 'bensin_rack') {
                ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
                ctx.fillRect(scrX + 2, scrY + 48, 46, 8);
                ctx.fillStyle = '#11151c';
                ctx.fillRect(scrX + 4, scrY + 20, 42, 30);
                ctx.fillStyle = '#525d6e';
                ctx.fillRect(scrX + 6, scrY + 32, 38, 2);

                for (let bx = scrX + 8; bx < scrX + 40; bx += 10) {
                  ctx.fillStyle = '#2f6b45';
                  ctx.fillRect(bx, scrY + 22, 7, 10);
                  ctx.fillRect(bx, scrY + 35, 7, 12);
                  ctx.fillStyle = '#dce2ea';
                  ctx.fillRect(bx + 1, scrY + 20, 5, 2);
                  ctx.fillRect(bx + 1, scrY + 33, 5, 2);
                }
              } else if (prop.type === 'ban_stack') {
                ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
                ctx.fillRect(scrX + 2, scrY + 44, 56, 8);
                const drawTire = (tx: number, ty: number) => {
                  ctx.fillStyle = '#171d26';
                  ctx.fillRect(tx, ty, 24, 20);
                  ctx.fillStyle = '#0f131a';
                  ctx.fillRect(tx + 4, ty + 4, 16, 12);
                  ctx.fillStyle = '#333d4c';
                  ctx.fillRect(tx + 2, ty + 1, 20, 2);
                };
                drawTire(scrX + 4, scrY + 26);
                drawTire(scrX + 30, scrY + 26);
                drawTire(scrX + 17, scrY + 10);
              }
            },
          });
        }
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
          ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
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
            ctx.fillStyle = '#2b4d73';
            ctx.fillRect(-16, -48, 32, 48);
          }
          ctx.restore();
        },
      });

      entities.sort((a, b) => a.yOrder - b.yOrder);
      entities.forEach((e) => {
        try {
          e.draw();
        } catch (err) {
          console.error('Render error:', err);
        }
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [onReturnToSchool, viewportSize]);

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
              <span>🛣 JALAN RAYA BALEENDAH</span>
              <span className="text-yellow-500">•</span>
              <span className="text-emerald-400 font-bold uppercase">DEPAN SMKN 7 & SIMPANG PEREMPATAN</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 pointer-events-auto">
          <button
            onClick={() => {
              playSound.cardSelect();
              onReturnToSchool();
            }}
            className="px-3.5 py-2 bg-[#1e2f47] hover:bg-[#253d5e] active:bg-[#162234] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#486b96] shadow-2xl flex items-center gap-1.5 cursor-pointer"
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
            <div className="w-3.5 h-3.5 bg-emerald-500 animate-ping rounded-full" />
          </div>
        </div>
      </div>

      {/* NOTIFIKASI DEKAT GERBANG */}
      {nearSchoolGate && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-[#1e2f47] border-2 border-[#e0b567] px-5 py-2 text-white font-bold text-xs tracking-wide shadow-2xl flex items-center gap-2">
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
          <p className="font-bold text-yellow-400 mb-0.5">🎮 KONTROL JELAJAH JALAN RAYA BALEENDAH:</p>
          <p className="text-neutral-300 text-[11px] leading-tight">
            Gunakan tombol <strong className="text-white">WASD</strong> atau <strong className="text-white">Panah</strong>.
            Jelajahi Toko Fotocopy, Warmindo, Counter HP, Warung Madura, Bengkel, dan Simpang Perempatan! Dekati gerbang sekolah untuk masuk kembali.
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
