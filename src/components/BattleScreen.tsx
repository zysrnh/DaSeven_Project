import React, { useState, useEffect, useRef } from 'react';
import type { Card, Enemy, Player, QteGrade } from '../types/game';
import { getSpriteDataUrl } from '../utils/sprites';
import { playSound } from '../utils/audio';
import { ActionTimingBar } from './ActionTimingBar';
import { EnemyDefenseQte } from './EnemyDefenseQte';

interface BattleScreenProps {
  player: Player;
  enemy: Enemy;
  onVictory: (updatedPlayer: Player) => void;
  onDefeat: () => void;
  onRetreat?: () => void;
}

type HeroPose =
  | 'idle'
  | 'windup_light'
  | 'attack_light'
  | 'windup_heavy'
  | 'attack_heavy'
  | 'block'
  | 'buff'
  | 'heal'
  | 'hurt'
  | 'victory'
  | 'defeat';

// KUMPULAN DECK KARTU SISWA DENGAN 2 TIPE SERANGAN (LIGHT & HEAVY) + DEFENSE & HEAL
interface BattleCard extends Card {
  attackVariant?: 'light' | 'heavy';
}

const DEFAULT_CARD_POOL: BattleCard[] = [
  // 1. LIGHT ATTACK (Serangan Ringan & Cepat)
  {
    id: 'c_penggaris',
    name: 'Penggaris Besi 30cm',
    cost: 1,
    type: 'attack',
    attackVariant: 'light',
    value: 15,
    description: 'Sabetan cepat penggaris baja. Serangan ringan & lincah.',
    flavor: 'Senjata darurat andalan anak teknik.',
    iconName: 'ruler',
    color: '#e11d48',
    timingDifficulty: 'easy',
  },
  {
    id: 'c_tang_crimping',
    name: 'Jepitan Tang Crimping',
    cost: 1,
    type: 'attack',
    attackVariant: 'light',
    value: 18,
    description: 'Jepitan cepat pada kabel dan titik vital anomali.',
    flavor: 'Alat praktikum lab jaringan komputer.',
    iconName: 'tool',
    color: '#f43f5e',
    timingDifficulty: 'normal',
  },
  {
    id: 'c_kabel_lan',
    name: 'Cambuk Kabel LAN Cat6',
    cost: 1,
    type: 'attack',
    attackVariant: 'light',
    value: 20,
    description: 'Pecutan kabel berkecepatan 1 Gbps dengan konektor RJ45.',
    flavor: 'Transmisi pukulan cepat tanpa delay.',
    iconName: 'cable',
    color: '#ea580c',
    timingDifficulty: 'normal',
  },

  // 2. HEAVY ATTACK (Serangan Berat & Berdaya Hancur Tinggi)
  {
    id: 'c_kunci_pas',
    name: 'Hantaman Kunci Pas 12',
    cost: 2,
    type: 'attack',
    attackVariant: 'heavy',
    value: 32,
    description: 'Pukulan logam berat berdaya rusak masif. Timing sempit!',
    flavor: 'Pinjam dari bengkel motor dekat sekolah.',
    iconName: 'wrench',
    color: '#b91c1c',
    timingDifficulty: 'hard',
  },
  {
    id: 'c_solder_panas',
    name: 'Tusukan Solder Panas 60W',
    cost: 2,
    type: 'special',
    attackVariant: 'heavy',
    value: 28,
    description: 'Mata solder membara tembus perisai shield musuh!',
    flavor: 'Timah panas yang melelehkan sirkuit anomali.',
    iconName: 'zap',
    color: '#9333ea',
    timingDifficulty: 'hard',
  },

  // 3. DEFENSE (Perisai Pertahanan)
  {
    id: 'c_casing_cpu',
    name: 'Perisai Casing CPU',
    cost: 1,
    type: 'defense',
    value: 22,
    description: 'Menahan serangan dengan plat baja casing tower (+22 Shield).',
    flavor: 'Kokoh dan tahan banting dari benturan.',
    iconName: 'shield',
    color: '#0284c7',
    timingDifficulty: 'easy',
  },
  {
    id: 'c_modul_tebal',
    name: 'Buku Modul Kejuruan',
    cost: 1,
    type: 'defense',
    value: 18,
    description: 'Menangkis pukulan dengan modul setebal 400 halaman (+18 Shield).',
    flavor: 'Buku pelajaran paling berat di tas.',
    iconName: 'book',
    color: '#0891b2',
    timingDifficulty: 'easy',
  },

  // 4. HEAL (Pemulihan HP Siswa)
  {
    id: 'c_es_teh',
    name: 'Es Teh Plastik Kantin',
    cost: 1,
    type: 'heal',
    value: 20,
    description: 'Meneguk es teh manis kantin. Memulihkan 20 HP.',
    flavor: 'Plastik diikat karet merah khas sekolah.',
    iconName: 'glass',
    color: '#16a34a',
    timingDifficulty: 'easy',
  },
  {
    id: 'c_kopi_joss',
    name: 'Kopi Joss Kuningan',
    cost: 1,
    type: 'heal',
    value: 28,
    description: 'Kopi arang panas khas Warmindo. Memulihkan 28 HP.',
    flavor: 'Mengembalikan fokus dan energi tempur.',
    iconName: 'coffee',
    color: '#15803d',
    timingDifficulty: 'easy',
  },
];

export const BattleScreen: React.FC<BattleScreenProps> = ({
  player: initialPlayer,
  enemy: initialEnemy,
  onVictory,
  onDefeat,
  onRetreat,
}) => {
  const [player, setPlayer] = useState<Player>({ ...initialPlayer });
  const [enemy, setEnemy] = useState<Enemy>({ ...initialEnemy });

  const playerHpRef = useRef<number>(initialPlayer.hp);
  const isGameOverRef = useRef<boolean>(false);

  // SISTEM 3 KARTU MELAYANG DI TENGAH DENGAN 3X SPIN
  const [floatingCards, setFloatingCards] = useState<BattleCard[]>([]);
  const [spinsLeft, setSpinsLeft] = useState<number>(3);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  const [activeCard, setActiveCard] = useState<BattleCard | null>(null);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState<boolean>(false);
  const [heroPose, setHeroPose] = useState<HeroPose>('idle');
  const [idleFrame, setIdleFrame] = useState<number>(0);
  const [animSubFrame, setAnimSubFrame] = useState<number>(1);
  const [enemyFlash, setEnemyFlash] = useState<boolean>(false);
  const [enemyAttackAnim, setEnemyAttackAnim] = useState<boolean>(false);

  const [showItemMenu, setShowItemMenu] = useState<boolean>(false);

  const [battleLogs, setBattleLogs] = useState<string[]>([
    `Pertarungan dimulai! ${enemy.name} menghalangi koridor SMKN 7!`,
  ]);

  // Ransel Item Siswa
  const [inventory, setInventory] = useState([
    { id: 'item_kopi', name: 'Kopi Joss Kuningan', healHp: 20, count: 2, desc: 'Pulihkan 20 HP' },
    { id: 'item_gorengan', name: 'Gorengan Warmindo', healHp: 30, count: 3, desc: 'Pulihkan 30 HP' },
    { id: 'item_p3k', name: 'P3K Kejuruan', healHp: 50, count: 1, desc: 'Pulihkan 50 HP' },
  ]);

  useEffect(() => {
    playerHpRef.current = player.hp;
  }, [player.hp]);

  // Animasi breathing idle hero
  useEffect(() => {
    const timer = setInterval(() => {
      setIdleFrame((prev) => (prev + 1) % 3);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg: string) => {
    setBattleLogs((prev) => [msg, ...prev.slice(0, 3)]);
  };

  // Helper mengambil 3 kartu acak dari pool kartu
  const drawThreeCards = (): BattleCard[] => {
    const pool = DEFAULT_CARD_POOL;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  // Memulai turn baru player (Reset spin jadi 3 dan munculkan 3 kartu melayang beranimasi flip)
  const startTurn = () => {
    if (isGameOverRef.current || playerHpRef.current <= 0) return;

    setPlayer((prev) => ({
      ...prev,
      shield: 0,
    }));
    setSpinsLeft(3);
    setHeroPose('idle');
    setShowItemMenu(false);

    // Animasi kartu melayang muncul dengan suara flip
    setIsFlipping(true);
    playSound.cardFlip();
    setTimeout(() => {
      setFloatingCards(drawThreeCards());
      setIsFlipping(false);
    }, 250);
  };

  // Inisialisasi awal
  useEffect(() => {
    startTurn();
  }, []);

  // FUNGSI SPIN / GANTI 3 KARTU (3 KALI PER TURN DENGAN SUARA FLIP)
  const handleSpinCards = () => {
    if (spinsLeft <= 0 || isEnemyAttacking || isFlipping || isGameOverRef.current) return;

    playSound.cardFlip();
    setIsFlipping(true);
    setSpinsLeft((prev) => prev - 1);

    setTimeout(() => {
      setFloatingCards(drawThreeCards());
      setIsFlipping(false);
      addLog(`Kartu di-spin! Sisa spin: ${spinsLeft - 1}`);
    }, 280);
  };

  // FUNGSI MEMILIH 1 DARI 3 KARTU MELAYANG
  const handlePlayChosenCard = (card: BattleCard) => {
    if (isEnemyAttacking || activeCard !== null || isGameOverRef.current) return;

    playSound.cardSelect();

    if (card.type === 'attack' || card.type === 'special') {
      setActiveCard(card);
      // Pembeda pose serangan ringan vs berat
      if (card.attackVariant === 'heavy' || card.cost >= 2 || card.timingDifficulty === 'hard') {
        setHeroPose('windup_heavy');
      } else {
        setHeroPose('windup_light');
      }
    } else if (card.type === 'defense') {
      setHeroPose('block');
      setAnimSubFrame(1);
      setTimeout(() => setAnimSubFrame(2), 200);

      setPlayer((prev) => ({
        ...prev,
        shield: prev.shield + card.value,
      }));
      playSound.attackHit(false);
      addLog(`Kamu memainkan [${card.name}]! Shield +${card.value}!`);

      setTimeout(() => {
        setHeroPose('idle');
        triggerEnemyTurn();
      }, 850);
    } else if (card.type === 'heal' || card.type === 'buff') {
      setHeroPose('heal');
      setAnimSubFrame(1);
      setTimeout(() => setAnimSubFrame(2), 250);

      playSound.heal();
      setPlayer((prev) => {
        const nextHp = Math.min(prev.maxHp, prev.hp + card.value);
        playerHpRef.current = nextHp;
        return {
          ...prev,
          hp: nextHp,
        };
      });
      addLog(`Kamu memainkan [${card.name}]! HP pulih +${card.value}!`);

      setTimeout(() => {
        setHeroPose('idle');
        triggerEnemyTurn();
      }, 950);
    }
  };

  // GANTI TURN KE MONSTER
  const triggerEnemyTurn = () => {
    if (isGameOverRef.current) return;

    setTimeout(() => {
      if (enemy.hp > 0 && playerHpRef.current > 0) {
        addLog(`Giliran selesai. ${enemy.name} bersiap menyerang!`);
        setIsEnemyAttacking(true);
      }
    }, 550);
  };

  // RESOLUSI SERANGAN KARTU VIA TIMING QTE
  const handleResolvePlayerQte = (grade: QteGrade, multiplier: number) => {
    if (!activeCard) return;

    const baseDmg = activeCard.value;
    const finalDamage = Math.round(baseDmg * multiplier);
    const isHeavy = activeCard.attackVariant === 'heavy' || activeCard.cost >= 2;

    if (isHeavy) {
      setHeroPose('attack_heavy');
      setAnimSubFrame(2);
      setTimeout(() => setAnimSubFrame(3), 250);
    } else {
      setHeroPose('attack_light');
      setAnimSubFrame(2);
      setTimeout(() => setAnimSubFrame(3), 200);
    }

    setEnemyFlash(true);

    const nextEnemyHp = Math.max(0, enemy.hp - finalDamage);

    setEnemy((prev) => {
      let dmgLeft = finalDamage;
      let newShield = prev.shield;
      let newHp = prev.hp;

      if (activeCard.type === 'special') {
        newHp = Math.max(0, newHp - dmgLeft);
      } else {
        if (newShield > 0) {
          const absorbed = Math.min(newShield, dmgLeft);
          newShield -= absorbed;
          dmgLeft -= absorbed;
        }
        newHp = Math.max(0, newHp - dmgLeft);
      }

      return {
        ...prev,
        hp: newHp,
        shield: newShield,
      };
    });

    const gradeText = grade === 'PERFECT' ? 'CRITICAL HIT (x2.0)' : grade === 'GOOD' ? 'GOOD HIT (x1.3)' : 'HIT';
    addLog(`[${gradeText}] ${activeCard.name} menghasilkan ${finalDamage} Damage ke ${enemy.name}!`);

    setActiveCard(null);

    setTimeout(() => {
      setEnemyFlash(false);

      if (nextEnemyHp <= 0) {
        isGameOverRef.current = true;
        setHeroPose('victory');
        setAnimSubFrame(1);
        setTimeout(() => setAnimSubFrame(2), 300);
        setTimeout(() => setAnimSubFrame(3), 600);
        playSound.victory();
        setTimeout(() => {
          onVictory(player);
        }, 1300);
      } else {
        setHeroPose('idle');
        triggerEnemyTurn();
      }
    }, 750);
  };

  // RESOLUSI SERANGAN MONSTER (PARRY / DEFENSE)
  const handleResolveEnemyDefense = (parried: boolean) => {
    setIsEnemyAttacking(false);
    setEnemyAttackAnim(true);
    setTimeout(() => setEnemyAttackAnim(false), 500);

    const rawDmg = enemy?.intent?.value ?? 14;
    const finalDmg = parried ? Math.max(1, Math.round(rawDmg * 0.2)) : rawDmg;

    if (parried) {
      setHeroPose('block');
      setAnimSubFrame(2);
    } else {
      setHeroPose('hurt');
      setAnimSubFrame(1);
      setTimeout(() => setAnimSubFrame(2), 200);
    }

    let newPlayerHp = 0;
    setPlayer((prev) => {
      let dmgLeft = finalDmg;
      let newShield = prev.shield;
      let hpResult = prev.hp;

      if (newShield > 0) {
        const absorbed = Math.min(newShield, dmgLeft);
        newShield -= absorbed;
        dmgLeft -= absorbed;
      }
      hpResult = Math.max(0, hpResult - dmgLeft);
      newPlayerHp = hpResult;
      playerHpRef.current = hpResult;

      return {
        ...prev,
        hp: hpResult,
        shield: newShield,
      };
    });

    if (parried) {
      addLog(`★ PARRY SUKSES! Menahan serangan ${enemy.name}! Kena ${finalDmg} DMG!`);
    } else {
      addLog(`✗ PARRY GAGAL! ${enemy.name} menghantam sebesar ${finalDmg} DMG!`);
    }

    setTimeout(() => {
      if (newPlayerHp <= 0 || playerHpRef.current <= 0) {
        isGameOverRef.current = true;
        setHeroPose('defeat');
        setAnimSubFrame(3);
        addLog(`HP Rian habis! Kamu pingsan di koridor...`);

        setTimeout(() => {
          onDefeat();
        }, 1500);
      } else {
        // GANTI KE GILIRAN PLAYER DENGAN KARTU MELAYANG BARU
        startTurn();
      }
    }, 850);
  };

  // Gunakan Item Ransel
  const handleUseInventoryItem = (itemId: string) => {
    const it = inventory.find((i) => i.id === itemId);
    if (!it || it.count <= 0 || isGameOverRef.current) return;

    playSound.heal();
    setInventory((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, count: i.count - 1 } : i))
    );

    setPlayer((prev) => {
      const nextHp = Math.min(prev.maxHp, prev.hp + it.healHp);
      playerHpRef.current = nextHp;
      return {
        ...prev,
        hp: nextHp,
      };
    });

    addLog(`Mengonsumsi [${it.name}]! HP pulih +${it.healHp}!`);
    setShowItemMenu(false);
    setHeroPose('heal');

    setTimeout(() => {
      setHeroPose('idle');
      triggerEnemyTurn();
    }, 900);
  };

  // Sprite Hero Berdasarkan Pose
  let heroSpriteSrc = `/assets/characters/maine/battle_idle_${idleFrame + 1}.png`;
  if (heroPose === 'windup_light') heroSpriteSrc = '/assets/characters/maine/attack_light_1.png';
  else if (heroPose === 'attack_light') heroSpriteSrc = `/assets/characters/maine/attack_light_${animSubFrame}.png`;
  else if (heroPose === 'windup_heavy') heroSpriteSrc = '/assets/characters/maine/attack_heavy_1.png';
  else if (heroPose === 'attack_heavy') heroSpriteSrc = `/assets/characters/maine/attack_heavy_${animSubFrame}.png`;
  else if (heroPose === 'block') heroSpriteSrc = `/assets/characters/maine/block_${animSubFrame}.png`;
  else if (heroPose === 'buff') heroSpriteSrc = `/assets/characters/maine/buff_${animSubFrame}.png`;
  else if (heroPose === 'heal') heroSpriteSrc = `/assets/characters/maine/heal_${animSubFrame}.png`;
  else if (heroPose === 'hurt') heroSpriteSrc = `/assets/characters/maine/hurt_${animSubFrame}.png`;
  else if (heroPose === 'victory') heroSpriteSrc = `/assets/characters/maine/victory_${animSubFrame}.png`;
  else if (heroPose === 'defeat') heroSpriteSrc = '/assets/characters/maine/hurt_3.png';

  const enemySpriteUrl = getSpriteDataUrl(`${enemy.spriteKey}_0`);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0b0f17] text-white font-mono select-none flex flex-col justify-between overflow-hidden">
      
      {/* ======================================================== */}
      {/* 1. ARENA PERTEMPURAN FULLSCREEN: KORIDOR SMKN 7 BALEENDAH */}
      {/* ======================================================== */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between">
        
        {/* DINDING KORIDOR KELAS SMKN 7 */}
        <div className="absolute inset-0 bg-[#161d27] z-0">
          <div className="absolute top-0 inset-x-0 h-[60%] bg-[#242e3d] border-b-4 border-[#18202c]">
            {/* Jendela Kaca Koridor */}
            <div className="absolute top-8 left-[12%] w-36 h-28 bg-[#182433] border-4 border-[#334255] rounded-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#2a3c50]/50 to-transparent" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#334255]" />
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#334255]" />
            </div>

            <div className="absolute top-8 left-[42%] w-36 h-28 bg-[#182433] border-4 border-[#334255] rounded-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#2a3c50]/50 to-transparent" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#334255]" />
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#334255]" />
            </div>

            <div className="absolute top-8 right-[15%] w-36 h-28 bg-[#182433] border-4 border-[#334255] rounded-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#2a3c50]/50 to-transparent" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#334255]" />
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#334255]" />
            </div>

            {/* Mading Sekolah */}
            <div className="absolute top-12 left-[28%] w-24 h-20 bg-[#3b2b1d] border-2 border-[#54402d] p-1 shadow-md">
              <div className="w-full h-3 bg-[#e0b567] text-[7px] text-black font-black px-1 leading-3">
                MADING TKJ
              </div>
              <div className="mt-1 flex flex-col gap-1">
                <div className="w-12 h-4 bg-white/70" />
                <div className="w-16 h-3 bg-white/60" />
              </div>
            </div>

            {/* Lampu Neon Koridor */}
            <div className="absolute top-0 left-1/4 w-32 h-2.5 bg-[#fef08a] shadow-[0_0_15px_#fef08a]" />
            <div className="absolute top-0 right-1/4 w-32 h-2.5 bg-[#fef08a] shadow-[0_0_15px_#fef08a]" />
          </div>

          <div className="absolute top-[58%] inset-x-0 h-4 bg-[#141b24] border-y border-[#2c3645]" />
        </div>

        {/* LANTAI UBIN KORIDOR (SLATE CHARCOAL IDENTIK DENGAN LANTAI MAINE) */}
        <div className="absolute bottom-0 inset-x-0 h-[40%] bg-[#1c232e] border-t-4 border-[#121720] z-0">
          <div className="w-full h-full bg-[linear-gradient(to_right,#111620_2px,transparent_2px),linear-gradient(to_bottom,#111620_2px,transparent_2px)] bg-[size:64px_48px] opacity-70" />
        </div>

        {/* ======================================================== */}
        {/* SISI KIRI: PLAYER (RIAN PRATAMA) MENGHADAP KANAN */}
        {/* ======================================================== */}
        <div className="absolute bottom-16 left-24 z-10 flex flex-col items-center">
          {!isEnemyAttacking && !isGameOverRef.current && (
            <div className="absolute -top-8 text-cyan-400 text-2xl animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              ▼
            </div>
          )}

          <div className="relative flex items-center justify-center">
            <img
              src={heroSpriteSrc}
              alt="Rian Pratama"
              className={`max-h-48 object-contain [image-rendering:pixelated] drop-shadow-[0_8px_0_rgba(0,0,0,0.5)] transition-transform duration-150 ${
                heroPose === 'attack_light' || heroPose === 'attack_heavy'
                  ? 'translate-x-12 scale-110'
                  : heroPose === 'hurt'
                  ? '-translate-x-4 opacity-75'
                  : heroPose === 'defeat'
                  ? 'opacity-85 translate-y-4'
                  : ''
              }`}
            />
          </div>
          <div className="w-24 h-4 bg-black/45 rounded-full blur-[1px] -mt-1" />
        </div>

        {/* ======================================================== */}
        {/* AREA TENGAH: 3 KARTU MELAYANG DI TENGAH ARENA PERTEMPURAN */}
        {/* ======================================================== */}
        {!isEnemyAttacking && !isGameOverRef.current && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-6 pointer-events-auto">
            {floatingCards.map((card, idx) => {
              const isCardDisabled = isEnemyAttacking || activeCard !== null || isGameOverRef.current;

              // Warna badge & aksen sesuai jenis kartu
              const isHeavy = card.attackVariant === 'heavy';
              const isLight = card.attackVariant === 'light';

              const badgeText = isHeavy
                ? '💥 HEAVY ATTACK'
                : isLight
                ? '⚔ LIGHT ATTACK'
                : card.type === 'defense'
                ? '🛡 DEFENSE'
                : card.type === 'heal'
                ? '🧪 HEAL'
                : '⚡ SPECIAL';

              const cardBorderColor = isHeavy
                ? 'border-[#ef4444] shadow-[0_8px_20px_rgba(239,68,68,0.35)]'
                : isLight
                ? 'border-[#f97316] shadow-[0_8px_20px_rgba(249,115,22,0.35)]'
                : card.type === 'defense'
                ? 'border-[#0ea5e9] shadow-[0_8px_20px_rgba(14,165,233,0.35)]'
                : card.type === 'heal'
                ? 'border-[#10b981] shadow-[0_8px_20px_rgba(16,185,129,0.35)]'
                : 'border-[#a855f7] shadow-[0_8px_20px_rgba(168,85,247,0.35)]';

              return (
                <div
                  key={`${card.id}_${idx}`}
                  onClick={() => !isCardDisabled && handlePlayChosenCard(card)}
                  style={{
                    transform: isFlipping
                      ? 'rotateY(90deg) scale(0.85)'
                      : 'rotateY(0deg) scale(1)',
                    transition: 'transform 0.28s ease, filter 0.2s ease',
                  }}
                  className={`w-56 h-72 bg-[#121824]/95 border-3 ${cardBorderColor} rounded-xl p-3.5 flex flex-col justify-between select-none relative backdrop-blur-md cursor-pointer group hover:-translate-y-5 hover:scale-105 hover:z-30 transition-all ${
                    isCardDisabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  {/* GLOW EFEK & PITA ATAS */}
                  <div>
                    {/* BADGE TIPE KARTU */}
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#293547]">
                      <span className="text-[10px] font-black tracking-wider uppercase text-white bg-black/50 px-2 py-0.5 rounded-md border border-white/20">
                        {badgeText}
                      </span>
                      <span className="text-[11px] font-bold text-yellow-300 bg-[#1e293b] px-1.5 py-0.5 rounded border border-[#334155]">
                        1 Turn
                      </span>
                    </div>

                    {/* NAMA KARTU */}
                    <h3 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors leading-snug mb-2">
                      {card.name}
                    </h3>

                    {/* NILAI VALUE ANGKA (DMG / SHIELD / HEAL) */}
                    <div className="my-2 p-2 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center text-center">
                      {isHeavy && (
                        <span className="text-base font-black text-red-400 drop-shadow">
                          💥 {card.value} DMG MASIF
                        </span>
                      )}
                      {isLight && (
                        <span className="text-base font-black text-orange-400 drop-shadow">
                          ⚔ {card.value} DMG CEPAT
                        </span>
                      )}
                      {card.type === 'defense' && (
                        <span className="text-base font-black text-cyan-400 drop-shadow">
                          🛡 +{card.value} SHIELD
                        </span>
                      )}
                      {card.type === 'heal' && (
                        <span className="text-base font-black text-emerald-400 drop-shadow">
                          🧪 +{card.value} HP PULIH
                        </span>
                      )}
                      {card.type === 'special' && (
                        <span className="text-base font-black text-purple-400 drop-shadow">
                          🔥 {card.value} DMG TEMBUS
                        </span>
                      )}
                    </div>

                    {/* DESKRIPSI KARTU */}
                    <p className="text-[11px] text-neutral-300 leading-snug mt-1">
                      {card.description}
                    </p>
                  </div>

                  {/* FOOTER FLAVOR & INDIKATOR KLIK */}
                  <div className="pt-2 border-t border-[#293547] flex items-center justify-between text-[10px] text-neutral-400 italic">
                    <span className="truncate max-w-[130px]">"{card.flavor}"</span>
                    <span className="text-cyan-400 font-black not-italic uppercase tracking-wider group-hover:animate-pulse">
                      MAINKAN ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* SISI KANAN: ENEMY (ANOMALI) MENGHADAP KIRI */}
        {/* ======================================================== */}
        <div className="absolute bottom-20 right-28 z-10 flex flex-col items-center">
          {/* Status Bar Musuh */}
          <div className="bg-[#121824]/95 border-2 border-[#334155] px-4 py-2 rounded-lg mb-4 shadow-xl min-w-[200px]">
            <div className="flex justify-between items-center text-xs mb-1 font-bold">
              <span className="text-red-400 tracking-wide">{enemy.name}</span>
              <span className="text-[10px] text-yellow-400 font-bold bg-[#1e293b] px-1.5 py-0.5 rounded border border-[#334155]">
                Lv. 1
              </span>
            </div>
            <div className="h-3 bg-[#331118] border border-[#551d27] rounded-sm overflow-hidden mb-1">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-300">
              <span>HP: {enemy.hp}/{enemy.maxHp}</span>
              {enemy.shield > 0 && <span className="text-cyan-300 font-bold">🛡 +{enemy.shield}</span>}
            </div>
          </div>

          {/* Sprite Musuh Proporsional */}
          <div className="relative flex flex-col items-center">
            <div
              className={`w-36 h-36 flex items-center justify-center transition-all ${
                enemyFlash ? 'brightness-200 invert scale-105' : ''
              } ${enemyAttackAnim ? '-translate-x-14 scale-110' : ''}`}
            >
              <img
                src={enemySpriteUrl}
                alt={enemy.name}
                className="max-h-36 max-w-36 object-contain [image-rendering:pixelated] drop-shadow-[0_8px_0_rgba(0,0,0,0.5)]"
              />
            </div>
            <div className="w-28 h-4 bg-black/45 rounded-full blur-[1px] mt-1" />
          </div>
        </div>

        {/* COMBAT LOG NOTIFIKASI DI ATAS */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#121824]/90 border border-[#334155] px-5 py-2 rounded-lg text-xs shadow-xl max-w-md text-center">
          <span className="text-yellow-300 font-bold">› {battleLogs[0]}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PANEL BAWAH: BERSIH & FOKUS KE KONTROL DAN STATUS */}
      {/* ======================================================== */}
      <div className="w-full bg-[#121824] border-t-4 border-[#253244] px-8 py-3.5 flex items-center justify-between gap-6 z-30 shadow-2xl min-h-[90px]">
        
        {/* SISI KIRI: MENU KONTROL (SPIN KARTU 3X, RANSEL ITEM, RETREAT) */}
        <div className="flex items-center gap-3">
          {/* TOMBOL SPIN KARTU MELAYANG (3 KALI PER TURN) */}
          <button
            onClick={handleSpinCards}
            disabled={spinsLeft <= 0 || isEnemyAttacking || isFlipping || isGameOverRef.current}
            className={`py-2 px-4 text-left font-black text-xs uppercase tracking-wider border-2 rounded-lg transition-all flex items-center gap-2.5 ${
              spinsLeft > 0 && !isEnemyAttacking
                ? 'bg-[#854d0e] hover:bg-[#a16207] active:bg-[#713f12] border-[#facc15] text-yellow-100 shadow-[0_0_12px_rgba(250,204,21,0.5)] cursor-pointer'
                : 'bg-[#1e293b] border-[#334155] text-neutral-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <span>🎰 SPIN / GANTI KARTU</span>
            <span className="bg-black/50 px-2 py-0.5 rounded text-[11px] text-yellow-300 font-bold">
              {spinsLeft}/3
            </span>
          </button>

          {/* TOMBOL RANSEL ITEM */}
          <button
            onClick={() => setShowItemMenu(!showItemMenu)}
            disabled={isEnemyAttacking || isGameOverRef.current}
            className="py-2 px-3.5 font-bold text-xs uppercase tracking-wider bg-[#18202d] hover:bg-[#202c3d] border-2 border-[#293547] hover:border-emerald-400 text-neutral-200 rounded-lg cursor-pointer transition-colors"
          >
            🧪 Ransel Item
          </button>

          {/* TOMBOL RETREAT */}
          <button
            onClick={onRetreat || onDefeat}
            disabled={isEnemyAttacking || isGameOverRef.current}
            className="py-2 px-3.5 font-bold text-xs uppercase tracking-wider bg-[#18202d] hover:bg-[#2d1b22] border-2 border-[#293547] hover:border-red-400 text-neutral-400 hover:text-red-300 rounded-lg cursor-pointer transition-colors"
          >
            🏃 Retreat
          </button>
        </div>

        {/* POPUP OVERLAY RANSEL ITEM JIKA DIBUKA */}
        {showItemMenu && (
          <div className="absolute bottom-24 left-8 z-40 bg-[#18202d] border-2 border-[#10b981] p-3 rounded-lg flex items-center gap-3 shadow-2xl">
            {inventory.map((it) => (
              <button
                key={it.id}
                disabled={it.count <= 0 || isEnemyAttacking}
                onClick={() => handleUseInventoryItem(it.id)}
                className="p-2 bg-[#121824] hover:bg-[#1b2b3a] border border-[#2d4256] rounded text-left disabled:opacity-40 cursor-pointer transition-all min-w-[130px]"
              >
                <div className="flex justify-between text-xs font-bold text-emerald-300 mb-0.5">
                  <span>{it.name}</span>
                  <span className="text-[10px] text-white bg-[#1e293b] px-1 rounded">x{it.count}</span>
                </div>
                <div className="text-[10px] text-neutral-300">{it.desc}</div>
              </button>
            ))}
            <button
              onClick={() => setShowItemMenu(false)}
              className="px-2.5 py-1.5 bg-[#334155] text-xs font-bold text-white rounded hover:bg-[#475569] cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* SISI KANAN: STATUS BAR RIAN PRATAMA (MAINE) */}
        <div className="flex items-center justify-end">
          <div className="bg-[#18202d] border-2 border-[#38bdf8] p-2.5 rounded-lg flex items-center gap-3.5 w-64 shadow-xl">
            <div className="relative">
              <img
                src="/assets/characters/maine/avatar.png"
                alt={player.name}
                className="w-12 h-12 object-cover bg-[#1e293b] border-2 border-[#38bdf8] rounded"
              />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-cyan-700 text-white px-1 border border-cyan-400 rounded">
                Lv.1
              </span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-xs text-white truncate mb-1">
                {player.name}
              </div>

              {/* HP BAR (MERAH) */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black text-red-400">HP</span>
                <div className="flex-1 h-2 bg-[#331118] border border-[#551d27] rounded-sm overflow-hidden relative">
                  <div
                    className="h-full bg-[#ef4444] transition-all duration-300"
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-neutral-300 font-bold">{player.hp}/{player.maxHp}</span>
              </div>

              {/* SP / SHIELD STATUS */}
              <div className="flex items-center justify-between text-[9px] text-neutral-400">
                <span>🛡 Shield: <strong className="text-cyan-300">+{player.shield}</strong></span>
                <span className="text-emerald-400 font-bold">SMKN 7</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL ACTION TIMING BAR UNTUK KARTU SERANGAN (LIGHT & HEAVY) */}
      {activeCard && (
        <ActionTimingBar
          card={activeCard}
          onResolve={handleResolvePlayerQte}
          onCancel={() => {
            setActiveCard(null);
            setHeroPose('idle');
          }}
        />
      )}

      {/* MODAL REAKSI TANGKIS / PARRY MUSUH */}
      {isEnemyAttacking && (
        <EnemyDefenseQte
          enemy={enemy}
          enemyName={enemy.name}
          intentValue={enemy.intent.value}
          onResolve={handleResolveEnemyDefense}
          onComplete={handleResolveEnemyDefense}
        />
      )}
    </div>
  );
};
