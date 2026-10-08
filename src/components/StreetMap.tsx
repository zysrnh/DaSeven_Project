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

// DAFTAR BANGUNAN & TOKO BERVARIASI (SESUAI SKETSA Stere.png)
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
    bannerColor: '#334155',
    textColor: '#f8fafc',
    wallColor: '#1e293b',
    roofColor: '#0f172a',
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
    bannerColor: '#1e3a8a',
    textColor: '#fbbf24',
    wallColor: '#1e2532',
    roofColor: '#0f141d',
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
    bannerColor: '#0284c7',
    textColor: '#ffffff',
    wallColor: '#252e3d',
    roofColor: '#151d28',
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
    bannerColor: '#dc2626',
    textColor: '#fef08a',
    wallColor: '#2b2623',
    roofColor: '#1c1613',
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
    bannerColor: '#15803d',
    textColor: '#ffffff',
    wallColor: '#212d27',
    roofColor: '#111b15',
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
    bannerColor: '#6d28d9',
    textColor: '#ffffff',
    wallColor: '#241e33',
    roofColor: '#151021',
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
    bannerColor: '#b45309',
    textColor: '#fef3c7',
    wallColor: '#2d231b',
    roofColor: '#1a130d',
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
    bannerColor: '#c2410c',
    textColor: '#ffffff',
    wallColor: '#29221c',
    roofColor: '#17110b',
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
    bannerColor: '#0369a1',
    textColor: '#ffffff',
    wallColor: '#1b2936',
    roofColor: '#0e1822',
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
  { id: 'sampah_s1', type: 'trash_station', x: 1070, y: 405, w: 76, h: 62, collision: { ox: 4, oy: 25, ow: 68, oh: 34 } },
  { id: 'lamp_s2', type: 'street_lamp', x: 1140, y: 350, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },

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

  // Area TN Lapang Terbuka Selatan (Sesuai Sketsa "TN" Pojok Kanan Bawah Toko)
  { id: 'planter_bot1', type: 'planter_box', x: 1460, y: 965, w: 80, h: 80, collision: { ox: 4, oy: 42, ow: 72, oh: 36 } },
  { id: 'bench_bot2', type: 'bench', x: 1590, y: 975, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },
  { id: 'lamp_bot3', type: 'street_lamp', x: 1740, y: 920, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },

  // Trotoar Sudut Toko Selatan Perempatan
  { id: 'lamp_bot4', type: 'street_lamp', x: 2310, y: 920, w: 48, h: 125, collision: { ox: 14, oy: 100, ow: 18, oh: 20 } },
  { id: 'bench_bot3', type: 'bench', x: 2450, y: 975, w: 100, h: 56, collision: { ox: 6, oy: 20, ow: 88, oh: 32 } },
];

// Helper: Pola Aspal Gritty Halus 128x128
const createFineAsphaltPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.fillStyle = '#1e232d';
  ctx.fillRect(0, 0, 128, 128);

  const colors = ['#161a22', '#1a1f28', '#222834', '#28303e', '#303a4c'];
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const hash = ((x * 48271 + y * 69621) ^ 0x4f7b2c91) >>> 0;
      const mod = hash % 100;
      if (mod < 20) ctx.fillStyle = colors[0];
      else if (mod < 42) ctx.fillStyle = colors[1];
      else if (mod < 68) ctx.fillStyle = colors[2];
      else if (mod < 84) ctx.fillStyle = colors[3];
      else if (mod < 94) ctx.fillStyle = colors[4];
      else continue;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Efek jejak ban halus
  ctx.fillStyle = 'rgba(16, 20, 26, 0.45)';
  ctx.fillRect(0, 18, 128, 30);
  ctx.fillRect(0, 78, 128, 30);
  return c;
};

// Helper: Pola Tanah / Dirt Ground TN Alami 64x64 Pixel Art
const createDirtGroundPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Warna dasar tanah coklat alami pinggir jalan
  ctx.fillStyle = '#4e3b2b';
  ctx.fillRect(0, 0, 64, 64);

  // Palet partikel tanah, debu pasir & kerikil
  const dirtTones = ['#3d2e21', '#463526', '#594432', '#634c38', '#6e543e', '#7c6046'];

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const hash = ((x * 374761393 + y * 668265263) ^ 0x5bf03635) >>> 0;
      const mod = hash % 100;

      if (mod < 24) ctx.fillStyle = dirtTones[0];
      else if (mod < 46) ctx.fillStyle = dirtTones[1];
      else if (mod < 68) ctx.fillStyle = dirtTones[2];
      else if (mod < 82) ctx.fillStyle = dirtTones[3];
      else if (mod < 92) ctx.fillStyle = dirtTones[4];
      else ctx.fillStyle = dirtTones[5];

      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Kerikil batu kecil khas tepi jalan
  const pebbles = [
    { x: 8, y: 12, c: '#2b2118', s: 2 },
    { x: 26, y: 7, c: '#846e55', s: 1 },
    { x: 44, y: 22, c: '#2b2118', s: 2 },
    { x: 18, y: 38, c: '#947e65', s: 2 },
    { x: 52, y: 46, c: '#271e16', s: 2 },
    { x: 34, y: 56, c: '#7b654e', s: 1 },
  ];
  pebbles.forEach((p) => {
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, p.s, p.s);
  });

  return c;
};

// Helper: Pola Paving Conblock Bata Urban Gritty 32x32 (untuk trotoar teras toko)
const createUrbanConblockPattern = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.fillStyle = '#1e242d';
  ctx.fillRect(0, 0, 32, 32);

  const drawBrick = (bx: number, by: number, bw: number) => {
    const isAlt = (bx + by) % 5 === 0;
    ctx.fillStyle = isAlt ? '#3a4452' : '#323c4a';
    ctx.fillRect(bx, by, bw - 1, 7);

    ctx.fillStyle = '#4c596b';
    ctx.fillRect(bx, by, bw - 1, 1);
    ctx.fillRect(bx, by, 1, 7);

    ctx.fillStyle = '#171c24';
    ctx.fillRect(bx, by + 6, bw - 1, 1);
    ctx.fillRect(bx + bw - 2, by, 1, 7);
  };

  drawBrick(0, 0, 16);
  drawBrick(16, 0, 16);
  drawBrick(0, 8, 8);
  drawBrick(8, 8, 16);
  drawBrick(24, 8, 8);
  drawBrick(0, 16, 16);
  drawBrick(16, 16, 16);
  drawBrick(0, 24, 8);
  drawBrick(8, 24, 16);
  drawBrick(24, 24, 8);

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
  const dirtPatternRef = useRef<CanvasPattern | null>(null);
  const sidewalkPatternRef = useRef<CanvasPattern | null>(null);

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

  // Sistem Hitbox Collision Presisi
  const checkCollisionAt = (px: number, py: number): boolean => {
    const feetLeft = px - 18;
    const feetRight = px + 18;
    const feetTop = py + 22;
    const feetBottom = py + 38;

    // Batas Luar Peta
    if (feetLeft < 50 || feetRight >= WORLD_WIDTH - 50 || feetTop < 40 || feetBottom >= WORLD_HEIGHT - 50) {
      return true;
    }

    // Gerbang SMKN 7: Celah Masuk Terbuka (x: 820 s/d 920, y: 340 ke atas)
    const inSchoolGatePass = feetLeft >= 820 && feetRight <= 920;
    if (feetTop < 380 && inSchoolGatePass && feetTop >= 250) {
      return false; // Bebas jalan masuk gerbang
    }

    // Jalan Cabang Barat (Jalan Tembus Antara Pabrik & SMKN 7, x: 400 s/d 560)
    const inWestBranchStreet = feetLeft >= 400 && feetRight <= 560;
    if (feetTop < 380 && inWestBranchStreet) {
      return false; // Bebas jalan di jalan tembus kiri
    }

    // Perempatan Jalan Timur (x: 1840 s/d 2240 yang tembus ke utara dan selatan)
    const inEastIntersectionNorth = feetLeft >= 1840 && feetRight <= 2240;
    if (feetTop < 380 && inEastIntersectionNorth) {
      return false; // Bebas jalan ke utara di persimpangan
    }

    const inEastIntersectionSouth = feetLeft >= 1840 && feetRight <= 2240;
    if (feetBottom > 1060 && inEastIntersectionSouth) {
      return false; // Bebas jalan ke selatan di persimpangan
    }

    // Cek Tabrakan Dinding Bangunan / Toko
    for (const b of BUILDINGS) {
      const bLeft = b.x;
      const bRight = b.x + b.w;
      const bTop = b.y;
      const bBottom = b.y + b.h;

      // Pintu gerbang sekolah punya akses masuk
      if (b.category === 'sekolah' && inSchoolGatePass && feetTop >= 250) {
        continue;
      }

      if (feetRight > bLeft && feetLeft < bRight && feetBottom > bTop && feetTop < bBottom) {
        return true;
      }
    }

    // Cek Tabrakan Props Trotoar
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
      const p = ctx.createPattern(createFineAsphaltPattern(), 'repeat');
      if (p) asphaltPatternRef.current = p;
    }
    if (!dirtPatternRef.current) {
      const p = ctx.createPattern(createDirtGroundPattern(), 'repeat');
      if (p) dirtPatternRef.current = p;
    }
    if (!sidewalkPatternRef.current) {
      const p = ctx.createPattern(createUrbanConblockPattern(), 'repeat');
      if (p) sidewalkPatternRef.current = p;
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

      // Deteksi Dekat Gerbang Sekolah SMKN 7
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

      // KUNCI PATTERN KE KOORDINAT DUNIA (WORLD ANCHORING)
      // Supaya tekstur tidak "ikut jalan / mengapung" saat kamera bergerak!
      if (asphaltPatternRef.current && typeof asphaltPatternRef.current.setTransform === 'function') {
        const matrix = new DOMMatrix().translate(-camX, -camY);
        asphaltPatternRef.current.setTransform(matrix);
      }
      if (dirtPatternRef.current && typeof dirtPatternRef.current.setTransform === 'function') {
        const matrix = new DOMMatrix().translate(-camX, -camY);
        dirtPatternRef.current.setTransform(matrix);
      }
      if (sidewalkPatternRef.current && typeof sidewalkPatternRef.current.setTransform === 'function') {
        const matrix = new DOMMatrix().translate(-camX, -camY);
        sidewalkPatternRef.current.setTransform(matrix);
      }

      // 3. BACKGROUND CLEAR
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, viewportSize.w, viewportSize.h);

      // ========================================================
      // A. RENDERING JALAN RAYA & PEREMPATAN ASPAL (TERKUNCI DI DUNIA)
      // ========================================================
      ctx.save();
      ctx.fillStyle = asphaltPatternRef.current || '#1e232d';

      // 1. Jalan Raya Utama Horizontal (y: 520 - 920, tinggi: 400)
      ctx.fillRect(-camX, 520 - camY, WORLD_WIDTH, 400);

      // 2. Jalan Cabang Barat Vertikal (x: 400 - 560, y: 0 - 520)
      ctx.fillRect(400 - camX, -camY, 160, 520);

      // 3. Perempatan Jalan Timur Vertikal (x: 1840 - 2240, tembus ke atas dan bawah)
      ctx.fillRect(1840 - camX, -camY, 400, WORLD_HEIGHT);
      ctx.restore();

      // ========================================================
      // B. RENDERING TN (TANAH MENYELURUH SESUAI SKETSA Stere.png)
      // ========================================================
      ctx.save();
      ctx.fillStyle = dirtPatternRef.current || '#4e3b2b';

      // 1. Jalur TN Utara Sepanjang Bibir Jalan (Depan Pabrik, SMKN 7, Fotocopy, Warmindo)
      // Dari ujung barat (x: 50) sampai persimpangan (x: 1840), kecuali celah jalan cabang (x: 400-560)
      ctx.fillRect(50 - camX, 380 - camY, 350, 140);
      ctx.fillRect(560 - camX, 380 - camY, 1280, 140);

      // 2. Jalur TN Utara Kanan Perempatan (Depan Minimarket TS)
      ctx.fillRect(2240 - camX, 380 - camY, WORLD_WIDTH - 2290, 140);

      // 3. Jalur TN Sisi Jalan Cabang Barat
      ctx.fillRect(360 - camX, -camY, 40, 420);
      ctx.fillRect(560 - camX, -camY, 40, 420);

      // 4. Jalur TN Selatan Sepanjang Toko-Toko Bawah (Counter HP, Warung Madura, Bengkel)
      // Dan AREA LAPANGAN KOSONG "TN" di pojok sebelum perempatan (x: 1360 s/d 1840)
      ctx.fillRect(50 - camX, 920 - camY, 1790, 160);

      // 5. Area Lapangan Tanah Luas (TN) di Selatan (Sesuai Sketsa Tulisan TN Besar)
      ctx.fillRect(1360 - camX, 1080 - camY, 480, 380);

      // 6. Jalur TN Tenggara Perempatan (Depan Toko Elektronik)
      ctx.fillRect(2240 - camX, 920 - camY, WORLD_WIDTH - 2290, 160);

      // 7. Jalur TN Sisi Vertikal Perempatan Timur
      ctx.fillRect(1800 - camX, -camY, 40, 420);
      ctx.fillRect(2240 - camX, -camY, 40, 420);
      ctx.fillRect(1800 - camX, 1020 - camY, 40, 480);
      ctx.fillRect(2240 - camX, 1020 - camY, 40, 480);
      ctx.restore();

      // Sedikit aksen paving di depan teras masuk gerbang SMKN 7
      ctx.save();
      ctx.fillStyle = sidewalkPatternRef.current || '#28313e';
      ctx.fillRect(800 - camX, 380 - camY, 140, 40);
      ctx.restore();

      // ========================================================
      // C. KERB BATU TEPI JALAN PIXEL ART (24x16)
      // ========================================================
      const drawHorizontalCurb = (startX: number, endX: number, cy: number, isUpper: boolean) => {
        const curbBlockW = 24;
        const curbBlockH = 16;
        for (let x = startX; x < endX; x += curbBlockW) {
          const isWhite = Math.floor(x / curbBlockW) % 2 === 0;
          const sx = x - camX;
          const sy = cy - camY;

          if (isWhite) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(sx, sy, curbBlockW - 1, curbBlockH);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(sx, sy + curbBlockH - 3, curbBlockW - 1, 3);
          } else {
            ctx.fillStyle = '#2c333f';
            ctx.fillRect(sx, sy, curbBlockW - 1, 3);
            ctx.fillStyle = '#181e26';
            ctx.fillRect(sx, sy + 3, curbBlockW - 1, curbBlockH - 3);
          }
          ctx.fillStyle = '#0f141a';
          ctx.fillRect(sx + curbBlockW - 1, sy, 1, curbBlockH);
        }
        ctx.fillStyle = isUpper ? '#12161e' : '#0f141a';
        ctx.fillRect(startX - camX, cy + (isUpper ? 16 : 0) - camY, endX - startX, 2);
      };

      // Kerb Tepi Jalan Utara
      drawHorizontalCurb(50, 400, 504, true);
      drawHorizontalCurb(560, 1840, 504, true);
      drawHorizontalCurb(2240, WORLD_WIDTH - 50, 504, true);

      // Kerb Tepi Jalan Selatan
      drawHorizontalCurb(50, 1840, 920, false);
      drawHorizontalCurb(2240, WORLD_WIDTH - 50, 920, false);

      // ========================================================
      // D. MARKA JALAN RAYA BALEENDAH
      // ========================================================
      // 1. Garis Bahu Jalan Solid
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(50 - camX, 526 - camY, 350, 4);
      ctx.fillRect(560 - camX, 526 - camY, 1280, 4);
      ctx.fillRect(2240 - camX, 526 - camY, WORLD_WIDTH - 2290, 4);
      ctx.fillRect(50 - camX, 910 - camY, 1790, 4);
      ctx.fillRect(2240 - camX, 910 - camY, WORLD_WIDTH - 2290, 4);

      // 2. Garis Ganda Kuning Tengah Jalan Utama (y: 720)
      const drawYellowDoubleLine = (x1: number, x2: number) => {
        for (let x = x1; x < x2; x += 16) {
          const sx = x - camX;
          const sy = 720 - camY;
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx, sy - 5, 16, 4);
          ctx.fillRect(sx, sy + 3, 16, 4);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(sx, sy - 1, 16, 1);
          ctx.fillRect(sx, sy + 7, 16, 1);
        }
      };
      drawYellowDoubleLine(50, 1800);
      drawYellowDoubleLine(2280, WORLD_WIDTH - 50);

      // 3. Garis Putus-putus Lajur (y: 620 & 820)
      const drawDashedLane = (x1: number, x2: number, ly: number) => {
        for (let x = x1; x < x2; x += 130) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x - camX, ly - camY, 70, 4);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(x - camX, ly + 3 - camY, 70, 1);
        }
      };
      drawDashedLane(60, 1800, 620);
      drawDashedLane(60, 1800, 820);
      drawDashedLane(2280, WORLD_WIDTH - 50, 620);
      drawDashedLane(2280, WORLD_WIDTH - 50, 820);

      // 4. Zebra Cross Depan Gerbang SMKN 7 (x: 800 - 940)
      for (let y = 530; y < 910; y += 44) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(800 - camX, y - camY, 140, 22);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(800 - camX, y + 19 - camY, 140, 3);
      }

      // 5. Zebra Cross di Simpang Perempatan Timur (x: 1840 s/d 2240)
      for (let y = 530; y < 910; y += 44) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(1770 - camX, y - camY, 60, 22);
        ctx.fillRect(2250 - camX, y - camY, 60, 22);
      }
      for (let x = 1860; x < 2220; x += 44) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x - camX, 480 - camY, 22, 50);
        ctx.fillRect(x - camX, 910 - camY, 22, 50);
      }

      // ========================================================
      // E. Y-SORTED ENTITIES (FASAD TOKO, PROPS 2.5D, PLAYER MAINE)
      // ========================================================
      interface RenderEntity {
        yOrder: number;
        draw: () => void;
      }
      const entities: RenderEntity[] = [];

      // Render Bangunan & Fasad Toko yang Sangat Detail
      BUILDINGS.forEach((b) => {
        const sx = b.x - camX;
        const sy = b.y - camY;

        // Entitas diurutkan berdasarkan dasar bangunan
        entities.push({
          yOrder: b.y + b.h - 10,
          draw: () => {
            // Drop shadow dasar bangunan
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(sx, sy + b.h - 8, b.w, 16);

            // Dinding utama bangunan
            ctx.fillStyle = b.wallColor;
            ctx.fillRect(sx, sy, b.w, b.h);

            // Garis panel/bata fasad
            ctx.strokeStyle = '#0b111e';
            ctx.lineWidth = 3;
            ctx.strokeRect(sx, sy, b.w, b.h);

            // ATAP / KANOPI ATAS BANGUNAN
            ctx.fillStyle = b.roofColor;
            ctx.fillRect(sx - 4, sy - 8, b.w + 8, 36);
            ctx.fillStyle = '#334155';
            ctx.fillRect(sx - 4, sy + 24, b.w + 8, 4);

            // PLANG NAMA TOKO (SPANDUK TIMBUL RETRO)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(sx + 10, sy + 38, b.w - 20, 58);
            ctx.fillStyle = b.bannerColor;
            ctx.fillRect(sx + 12, sy + 40, b.w - 24, 54);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx + 12, sy + 40, b.w - 24, 54);

            // Lampu sorot mini di atas plang
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(sx + 20, sy + 36, 12, 4);
            ctx.fillRect(sx + b.w - 32, sy + 36, 12, 4);

            // Teks Nama Toko
            ctx.fillStyle = b.textColor;
            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(b.name, sx + b.w / 2, sy + 66);

            // Subteks Tagline
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(b.tagline, sx + b.w / 2, sy + 84);

            // ========================================================
            // DETAIL FASAD SPESIFIK & REALISTIS UNTUK TIAP JENIS TOKO
            // ========================================================
            if (b.category === 'sekolah') {
              // 1. SMKN 7 BALEENDAH
              // Gerbang Masuk Utama SMKN 7 Terbuka (x: 820 s/d 920)
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(sx + 240, sy + 140, 100, 200);

              // Pilar Beton Gapura Kiri & Kanan
              ctx.fillStyle = '#334155';
              ctx.fillRect(sx + 210, sy + 110, 30, 230);
              ctx.fillRect(sx + 340, sy + 110, 30, 230);
              ctx.fillStyle = '#475569';
              ctx.fillRect(sx + 214, sy + 114, 22, 222);
              ctx.fillRect(sx + 344, sy + 114, 22, 222);

              // Palang Atas Gapura
              ctx.fillStyle = '#1e3a8a';
              ctx.fillRect(sx + 200, sy + 110, 180, 24);
              ctx.fillStyle = '#fbbf24';
              ctx.font = 'bold 10px monospace';
              ctx.fillText('🚪 GERBANG UTAMA SMKN 7', sx + 290, sy + 126);

              // Pos Satpam di Kiri Gerbang
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(sx + 80, sy + 180, 110, 150);
              ctx.strokeStyle = '#475569';
              ctx.lineWidth = 2;
              ctx.strokeRect(sx + 80, sy + 180, 110, 150);
              // Jendela Pos Satpam
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(sx + 95, sy + 200, 50, 40);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(sx + 100, sy + 205, 10, 10);
              ctx.fillStyle = '#f59e0b';
              ctx.font = 'bold 8px monospace';
              ctx.fillText('POS SATPAM', sx + 135, sy + 195);
            } else if (b.category === 'fotocopy') {
              // 2. FOTOCOPY & ATK "KURNIA"
              // Kanopi Biru-Putih Bergaris
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#0284c7' : '#f8fafc';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 22);
              }

              // Etalase Kaca Toko Besar
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(sx + 15, sy + 135, b.w - 30, 140);
              ctx.fillStyle = '#0369a1';
              ctx.fillRect(sx + 20, sy + 140, b.w - 40, 130);

              // Siluet Mesin Fotocopy Besar di Kiri
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(sx + 30, sy + 170, 70, 65);
              ctx.fillStyle = '#475569';
              ctx.fillRect(sx + 35, sy + 160, 40, 10); // Baki atas
              ctx.fillStyle = '#0284c7';
              ctx.fillRect(sx + 80, sy + 175, 12, 10); // Panel kontrol

              // Rak Kertas A4 & Buku di Kanan
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(sx + 120, sy + 165, 30, 20);
              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(sx + 155, sy + 165, 30, 20);
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(sx + 190, sy + 165, 30, 20);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(sx + 120, sy + 195, 100, 18);

              // Pintu Kaca Geser
              ctx.fillStyle = 'rgba(255,255,255,0.2)';
              ctx.fillRect(sx + b.w - 60, sy + 140, 35, 130);
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(sx + b.w - 55, sy + 195, 4, 20); // Handle
            } else if (b.category === 'warmindo') {
              // 3. WARMINDO "PUTRA KUNINGAN"
              // Kanopi Kuning & Merah Ikonik Warmindo
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#dc2626' : '#eab308';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 22);
              }

              // Ruangan Warmindo
              ctx.fillStyle = '#1c1917';
              ctx.fillRect(sx + 15, sy + 135, b.w - 30, 140);

              // Etalase Gorengan Kaca Hangat di Kiri
              ctx.fillStyle = '#fbbf24';
              ctx.fillRect(sx + 24, sy + 145, 80, 75);
              ctx.fillStyle = '#b45309';
              ctx.fillRect(sx + 28, sy + 185, 20, 14); // Tempe mendoan
              ctx.fillRect(sx + 52, sy + 185, 20, 14); // Bakwan
              ctx.fillRect(sx + 76, sy + 185, 20, 14); // Tahu isi
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillRect(sx + 28, sy + 150, 72, 10); // Kilau kaca

              // Rak Mie Instan Gantung Renceng Warna-Warni
              const mieColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
              for (let i = 0; i < 4; i++) {
                ctx.fillStyle = mieColors[i];
                ctx.fillRect(sx + 115 + i * 22, sy + 145, 16, 50);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(sx + 117 + i * 22, sy + 155, 12, 6);
              }

              // Meja Bar Warmindo Kayu
              ctx.fillStyle = '#78350f';
              ctx.fillRect(sx + 20, sy + 225, b.w - 40, 20);
              // Kaleng Kerupuk Blek Biru
              ctx.fillStyle = '#0284c7';
              ctx.fillRect(sx + 130, sy + 205, 22, 22);
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(sx + 134, sy + 209, 14, 14);
            } else if (b.category === 'counter_hp') {
              // 4. COUNTER HP & PULSA (SEVEN CELL & ACC)
              // Kanopi Ungu & Biru Modern
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#7c3aed' : '#2563eb';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 20);
              }

              // Fasad Toko Dalam
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(sx + 15, sy + 130, b.w - 30, 180);

              // Etalase Kaca Display Handphone & Perdana
              ctx.fillStyle = '#0284c7';
              ctx.fillRect(sx + 24, sy + 150, b.w - 48, 80);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.fillRect(sx + 30, sy + 155, b.w - 60, 16);

              // Display HP & Casing di Etalase
              for (let hx = sx + 35; hx < sx + b.w - 60; hx += 34) {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(hx, sy + 175, 16, 28);
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(hx + 2, sy + 177, 12, 22);
              }

              // Logo Operator Seluler (Telkomsel, Indosat, XL, Smartfren)
              ctx.fillStyle = '#dc2626';
              ctx.fillRect(sx + 35, sy + 240, 45, 22); // Telkomsel
              ctx.fillStyle = '#facc15';
              ctx.fillRect(sx + 90, sy + 240, 45, 22); // Indosat
              ctx.fillStyle = '#2563eb';
              ctx.fillRect(sx + 145, sy + 240, 45, 22); // XL
              ctx.fillStyle = '#a855f7';
              ctx.fillRect(sx + 200, sy + 240, 45, 22); // Smartfren
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px monospace';
              ctx.fillText('TS', sx + 57, sy + 254);
              ctx.fillText('ISAT', sx + 112, sy + 254);
              ctx.fillText('XL', sx + 167, sy + 254);
              ctx.fillText('SF', sx + 222, sy + 254);
            } else if (b.category === 'warung_madura') {
              // 5. WARUNG MADURA 24 JAM
              // Kanopi Terpal Merah-Putih Khas Warung Madura
              for (let ax = 0; ax < b.w - 30; ax += 20) {
                ctx.fillStyle = (ax / 20) % 2 === 0 ? '#b91c1c' : '#f8fafc';
                ctx.fillRect(sx + 15 + ax, sy + 106, 20, 20);
              }

              // Ruang Toko Dalam
              ctx.fillStyle = '#18120c';
              ctx.fillRect(sx + 15, sy + 130, b.w - 30, 180);

              // Etalase Kaca Sembako & Rokok Bertingkat
              ctx.fillStyle = '#78350f';
              ctx.fillRect(sx + 25, sy + 140, b.w - 50, 80);
              ctx.fillStyle = '#1c1917';
              ctx.fillRect(sx + 30, sy + 145, b.w - 60, 32); // Rak atas
              ctx.fillRect(sx + 30, sy + 182, b.w - 60, 32); // Rak bawah

              // Barisan Rokok & Sachet Kopi di Rak
              for (let rx = sx + 34; rx < sx + b.w - 40; rx += 14) {
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(rx, sy + 148, 10, 14);
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(rx, sy + 163, 10, 12);
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(rx, sy + 185, 10, 14);
              }

              // Galon Air Biru Bertumpuk di Depan
              ctx.fillStyle = '#0284c7';
              ctx.fillRect(sx + 35, sy + 235, 24, 34);
              ctx.fillRect(sx + 64, sy + 235, 24, 34);
              ctx.fillRect(sx + 49, sy + 205, 24, 34);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(sx + 41, sy + 239, 4, 26);
              ctx.fillRect(sx + 70, sy + 239, 4, 26);

              // Tabung Gas Melon 3KG Hijau
              ctx.fillStyle = '#16a34a';
              ctx.beginPath();
              ctx.ellipse(sx + 115, sy + 255, 12, 16, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(sx + 142, sy + 255, 12, 16, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#15803d';
              ctx.fillRect(sx + 109, sy + 238, 12, 4); // Handle gas
              ctx.fillRect(sx + 136, sy + 238, 12, 4);

              // Pom Mini Digital / Bensin Eceran
              ctx.fillStyle = '#b91c1c';
              ctx.fillRect(sx + b.w - 85, sy + 200, 50, 75);
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(sx + b.w - 78, sy + 210, 36, 20); // Monitor digital
              ctx.fillStyle = '#22c55e';
              ctx.fillRect(sx + b.w - 74, sy + 214, 28, 12);
            } else if (b.category === 'bengkel') {
              // 6. BENGKEL MOTOR "SETIA"
              // Kanopi Seng Baja Abu-abu Bergelombang
              ctx.fillStyle = '#475569';
              ctx.fillRect(sx + 15, sy + 106, b.w - 30, 20);
              for (let ax = 0; ax < b.w - 30; ax += 12) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(sx + 15 + ax, sy + 106, 2, 20);
              }

              // Pintu Rolling Door Terbuka Sebagian
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(sx + 20, sy + 130, b.w - 40, 180);

              // Kisi-kisi Besi Rolling Door
              for (let ry = sy + 130; ry < sy + 210; ry += 12) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(sx + 20, ry, b.w - 40, 9);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(sx + 20, ry + 9, b.w - 40, 3);
              }

              // Bengkel Dalam Terbuka (Bawah Rolling Door)
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(sx + 30, sy + 210, b.w - 60, 100);

              // Rak Botol Oli Mesin Berderet
              ctx.fillStyle = '#78350f';
              ctx.fillRect(sx + 40, sy + 230, 120, 10);
              const oliColors = ['#ef4444', '#16a34a', '#2563eb', '#f59e0b'];
              for (let i = 0; i < 4; i++) {
                ctx.fillStyle = oliColors[i];
                ctx.fillRect(sx + 46 + i * 26, sy + 216, 18, 14);
              }

              // Kompresor Angin Mini Oranye
              ctx.fillStyle = '#ea580c';
              ctx.fillRect(sx + 180, sy + 240, 36, 26);
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(sx + 184, sy + 264, 10, 8); // Roda
              ctx.fillRect(sx + 202, sy + 264, 10, 8);
              ctx.fillStyle = '#78716c';
              ctx.fillRect(sx + 194, sy + 232, 8, 8); // Tabung meteran

              // Tumpukan Ban Luar Motor di Samping
              for (let ti = 0; ti < 3; ti++) {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.ellipse(sx + b.w - 80, sy + 230 + ti * 16, 22, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.ellipse(sx + b.w - 80, sy + 230 + ti * 16, 10, 5, 0, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (b.category === 'minimarket') {
              // 7. BALEENDAH MART 24 JAM (TS)
              // Lis Warna Minimarket Merah-Kuning-Biru
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(sx + 15, sy + 106, b.w - 30, 6);
              ctx.fillStyle = '#facc15';
              ctx.fillRect(sx + 15, sy + 112, b.w - 30, 6);
              ctx.fillStyle = '#2563eb';
              ctx.fillRect(sx + 15, sy + 118, b.w - 30, 6);

              // Dinding Kaca Minimarket Modern
              ctx.fillStyle = '#0284c7';
              ctx.fillRect(sx + 20, sy + 135, b.w - 40, 150);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.fillRect(sx + 26, sy + 140, b.w - 52, 24);

              // Pintu Kaca Geser Otomatis
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(sx + b.w / 2 - 50, sy + 150, 100, 135);
              ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
              ctx.fillRect(sx + b.w / 2 - 45, sy + 155, 42, 125);
              ctx.fillRect(sx + b.w / 2 + 3, sy + 155, 42, 125);
              // Handle Pintu
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(sx + b.w / 2 - 7, sy + 205, 3, 25);
              ctx.fillRect(sx + b.w / 2 + 4, sy + 205, 3, 25);

              // Rak Gondola Snack Terlihat dari Kaca Kiri & Kanan
              for (let gy = sy + 175; gy < sy + 250; gy += 25) {
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(sx + 35, gy, 65, 12);
                ctx.fillStyle = '#10b981';
                ctx.fillRect(sx + b.w - 100, gy, 65, 12);
              }
            } else if (b.category === 'pabrik') {
              // 8. PT. TEXTILE BALEENDAH
              // Dinding Panel Baja Industri Bergaris
              for (let px = sx + 20; px < sx + b.w - 20; px += 20) {
                ctx.fillStyle = '#334155';
                ctx.fillRect(px, sy + 115, 18, 175);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(px + 16, sy + 115, 2, 175);
              }

              // Pintu Gerbang Kargo Pabrik dengan Strip Bahaya Kuning-Hitam
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(sx + 60, sy + 170, b.w - 120, 120);
              // Garis Hazard K3
              for (let hz = sx + 60; hz < sx + b.w - 60; hz += 24) {
                ctx.fillStyle = '#eab308';
                ctx.fillRect(hz, sy + 170, 12, 16);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(hz + 12, sy + 170, 12, 16);
              }

              // Ventilasi Turbin Udara di Atas
              ctx.fillStyle = '#64748b';
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
              // 1. Planter Box Beton Semak Rimbun
              if (prop.type === 'planter_box') {
                ctx.fillStyle = 'rgba(12, 16, 22, 0.5)';
                ctx.fillRect(scrX + 6, scrY + 70, 70, 10);
                ctx.fillStyle = '#1c222c';
                ctx.fillRect(scrX + 4, scrY + 40, 72, 32);
                ctx.fillStyle = '#2c3442';
                ctx.fillRect(scrX + 6, scrY + 42, 68, 28);
                ctx.fillStyle = '#3c4759';
                ctx.fillRect(scrX + 3, scrY + 36, 74, 6);

                // Semak Daun Hijau Rimbun
                const drawLeafCluster = (cx: number, cy: number, w: number, h: number) => {
                  ctx.fillStyle = '#0a2312';
                  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
                  ctx.fillStyle = '#14532d';
                  ctx.fillRect(cx - w / 2 + 2, cy - h / 2 + 1, w - 4, h - 2);
                  ctx.fillStyle = '#16a34a';
                  ctx.fillRect(cx - w / 2 + 4, cy - h / 2 + 3, w - 7, h - 5);
                  ctx.fillStyle = '#4ade80';
                  ctx.fillRect(cx - 2, cy - h / 2 + 2, 3, 2);
                };
                drawLeafCluster(scrX + 22, scrY + 30, 26, 20);
                drawLeafCluster(scrX + 58, scrY + 30, 26, 20);
                drawLeafCluster(scrX + 40, scrY + 22, 30, 22);
              }
              // 2. Tiang Lampu Jalan Vintage
              else if (prop.type === 'street_lamp') {
                ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
                ctx.beginPath();
                ctx.ellipse(scrX + 24, scrY + 112, 52, 16, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(12, 16, 22, 0.5)';
                ctx.beginPath();
                ctx.ellipse(scrX + 24, scrY + 114, 18, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0f141a';
                ctx.fillRect(scrX + 13, scrY + 104, 22, 10);
                ctx.fillStyle = '#131922';
                ctx.fillRect(scrX + 21, scrY + 22, 2, 76);
                ctx.fillStyle = '#3b4a5e';
                ctx.fillRect(scrX + 23, scrY + 22, 2, 76);

                // Lentera Kuning Vintage
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(scrX + 12, scrY + 7, 22, 12);
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(scrX + 15, scrY + 9, 16, 8);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(scrX + 20, scrY + 10, 6, 6);
                ctx.fillStyle = '#0f141a';
                ctx.fillRect(scrX + 8, scrY + 2, 30, 5);
              }
              // 3. Bangku Trotoar Besi-Kayu
              else if (prop.type === 'bench') {
                ctx.fillStyle = 'rgba(10, 14, 20, 0.55)';
                ctx.fillRect(scrX + 4, scrY + 44, 92, 12);
                ctx.fillStyle = '#0b0f14';
                ctx.fillRect(scrX + 8, scrY + 14, 6, 26);
                ctx.fillRect(scrX + 86, scrY + 14, 6, 26);

                // Bilah Kayu Mahoni
                for (let wy = scrY + 24; wy <= scrY + 36; wy += 6) {
                  ctx.fillStyle = '#633117';
                  ctx.fillRect(scrX + 6, wy, 88, 4);
                  ctx.fillStyle = '#8a4623';
                  ctx.fillRect(scrX + 6, wy, 88, 1);
                }
              }
              // 4. Tong Sampah Silinder Ganda
              else if (prop.type === 'trash_station') {
                ctx.fillStyle = 'rgba(10, 14, 20, 0.55)';
                ctx.fillRect(scrX + 10, scrY + 50, 56, 10);

                // Tabung Kiri (Hijau Organik)
                ctx.fillStyle = '#155e2d';
                ctx.fillRect(scrX + 8, scrY + 20, 24, 30);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(scrX + 12, scrY + 20, 4, 30);
                ctx.fillStyle = '#475569';
                ctx.fillRect(scrX + 6, scrY + 14, 28, 6);

                // Tabung Kanan (Kuning Anorganik)
                ctx.fillStyle = '#b45309';
                ctx.fillRect(scrX + 40, scrY + 20, 24, 30);
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(scrX + 44, scrY + 20, 4, 30);
                ctx.fillStyle = '#475569';
                ctx.fillRect(scrX + 38, scrY + 14, 28, 6);
              }
              // 5. Rak Bensin Eceran Botol Kaca (Khas Warung Madura)
              else if (prop.type === 'bensin_rack') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(scrX + 2, scrY + 48, 46, 8);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(scrX + 4, scrY + 20, 42, 30);
                ctx.fillStyle = '#64748b';
                ctx.fillRect(sx + 6, scrY + 32, 38, 2);

                // Botol Kaca Bensin Pertalite Hijau
                for (let bx = scrX + 8; bx < scrX + 40; bx += 10) {
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(bx, scrY + 22, 7, 10);
                  ctx.fillRect(bx, scrY + 35, 7, 12);
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(bx + 1, scrY + 20, 5, 2);
                  ctx.fillRect(bx + 1, scrY + 33, 5, 2);
                }
              }
              // 6. Tumpukan Ban Bekas Motor (Khas Bengkel)
              else if (prop.type === 'ban_stack') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(scrX + 2, scrY + 44, 56, 8);
                const drawTire = (tx: number, ty: number) => {
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(tx, ty, 24, 20);
                  ctx.fillStyle = '#0f172a';
                  ctx.fillRect(tx + 4, ty + 4, 16, 12);
                  ctx.fillStyle = '#475569';
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
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-16, -48, 32, 48);
          }
          ctx.restore();
        },
      });

      // Urutkan & Gambar Berdasarkan Kedalaman (Y-Sorting 2.5D)
      entities.sort((a, b) => a.yOrder - b.yOrder);
      entities.forEach((e) => e.draw());

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
            <div className="w-3.5 h-3.5 bg-emerald-500 animate-ping rounded-full" />
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
