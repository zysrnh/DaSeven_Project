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

type MenuMode = 'main' | 'skill' | 'item';

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

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [heroPose, setHeroPose] = useState<HeroPose>('idle');
  const [idleFrame, setIdleFrame] = useState(0);
  const [animSubFrame, setAnimSubFrame] = useState(1);
  const [enemyFlash, setEnemyFlash] = useState(false);
  const [enemyAttackAnim, setEnemyAttackAnim] = useState(false);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [menuMode, setMenuMode] = useState<MenuMode>('main');

  const [battleLogs, setBattleLogs] = useState<string[]>([
    `Pertarungan dimulai! ${enemy.name} menghalangi koridor SMKN 7!`,
  ]);

  // Ransel Item Siswa
  const [inventory, setInventory] = useState([
    { id: 'item_kopi', name: 'Kopi Joss Kuningan', healHp: 20, healSp: 2, count: 2, desc: 'Memulihkan 20 HP & 2 SP' },
    { id: 'item_gorengan', name: 'Gorengan Hangat', healHp: 30, healSp: 0, count: 3, desc: 'Memulihkan 30 HP' },
    { id: 'item_p3k', name: 'P3K Jurusan TKJ', healHp: 50, healSp: 3, count: 1, desc: 'Memulihkan 50 HP & 3 SP' },
  ]);

  // Keep playerHpRef up to date
  useEffect(() => {
    playerHpRef.current = player.hp;
  }, [player.hp]);

  // Breathing animation idle
  useEffect(() => {
    const timer = setInterval(() => {
      setIdleFrame((prev) => (prev + 1) % 3);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg: string) => {
    setBattleLogs((prev) => [msg, ...prev.slice(0, 3)]);
  };

  const startTurn = () => {
    if (isGameOverRef.current || playerHpRef.current <= 0) return;
    setPlayer((prev) => ({
      ...prev,
      ap: prev.maxAp,
      shield: 0,
    }));
    setHeroPose('idle');
    setMenuMode('main');
  };

  // 1. ACTION: ATTACK (Pukulan / Tebasan Dasar)
  const handleActionAttack = () => {
    if (player.ap < 1 || isGameOverRef.current) {
      addLog('SP tidak cukup untuk menyerang!');
      return;
    }
    playSound.cardSelect();

    const basicAttackCard: Card = {
      id: 'basic_attack',
      name: 'Pukulan Presisi',
      cost: 1,
      type: 'attack',
      value: 16,
      description: 'Serangan fisik langsung ke anomali.',
      flavor: 'Pukulan terarah jarak dekat.',
      iconName: 'sword',
      color: '#e11d48',
      timingDifficulty: 'normal',
    };

    setActiveCard(basicAttackCard);
    setHeroPose('windup_light');
  };

  // 2. ACTION: SKILL (Jurus Kejuruan)
  const handleSelectSkill = (card: Card) => {
    if (player.ap < card.cost || isGameOverRef.current) {
      addLog(`SP tidak cukup untuk memainkan ${card.name}!`);
      return;
    }
    playSound.cardSelect();
    setMenuMode('main');

    if (card.type === 'attack' || card.type === 'special') {
      setActiveCard(card);
      setHeroPose('windup_heavy');
    } else if (card.type === 'defense') {
      setHeroPose('block');
      setAnimSubFrame(1);
      setTimeout(() => setAnimSubFrame(2), 200);

      setPlayer((prev) => ({
        ...prev,
        ap: prev.ap - card.cost,
        shield: prev.shield + card.value,
      }));
      playSound.attackHit(false);
      addLog(`Memasang ${card.name}! Shield bertambah +${card.value}!`);
      setTimeout(() => {
        setHeroPose('idle');
        checkEnemyTurn();
      }, 900);
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
          ap: prev.ap - card.cost,
        };
      });
      addLog(`Menggunakan ${card.name}! Pulih +${card.value} HP!`);
      setTimeout(() => {
        setHeroPose('idle');
        checkEnemyTurn();
      }, 1000);
    }
  };

  // 3. ACTION: ITEM (Konsumsi Ransel)
  const handleUseItem = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item || item.count <= 0 || isGameOverRef.current) return;

    playSound.heal();
    setInventory((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, count: i.count - 1 } : i))
    );

    setPlayer((prev) => {
      const nextHp = Math.min(prev.maxHp, prev.hp + item.healHp);
      playerHpRef.current = nextHp;
      return {
        ...prev,
        hp: nextHp,
        ap: Math.min(prev.maxAp, prev.ap + item.healSp),
      };
    });

    addLog(`Mengonsumsi ${item.name}! Pulih +${item.healHp} HP & +${item.healSp} SP!`);
    setMenuMode('main');
    setHeroPose('heal');
    setTimeout(() => {
      setHeroPose('idle');
      checkEnemyTurn();
    }, 900);
  };

  // 4. ACTION: RETREAT (Kabur)
  const handleRetreat = () => {
    playSound.cardSelect();
    addLog('Kamu mencoba mundur dan keluar dari koridor...');
    setTimeout(() => {
      if (onRetreat) onRetreat();
      else onDefeat();
    }, 600);
  };

  // Cek Giliran Musuh
  const checkEnemyTurn = () => {
    if (isGameOverRef.current) return;
    setTimeout(() => {
      if (enemy.hp > 0 && playerHpRef.current > 0) {
        addLog(`Giliran kamu selesai. ${enemy.name} bersiap menyerang!`);
        setIsEnemyAttacking(true);
      }
    }, 600);
  };

  // Resolusi QTE Serangan Player
  const handleResolvePlayerQte = (grade: QteGrade, multiplier: number) => {
    if (!activeCard) return;

    const baseDmg = activeCard.value;
    const finalDamage = Math.round(baseDmg * multiplier);
    const isHeavy = activeCard.cost >= 2 || activeCard.type === 'special';

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

      if (newShield > 0) {
        const absorbed = Math.min(newShield, dmgLeft);
        newShield -= absorbed;
        dmgLeft -= absorbed;
      }
      newHp = Math.max(0, newHp - dmgLeft);

      return {
        ...prev,
        hp: newHp,
        shield: newShield,
      };
    });

    const gradeText = grade === 'PERFECT' ? 'CRITICAL HIT (x2.0)' : grade === 'GOOD' ? 'GOOD HIT (x1.3)' : 'HIT';
    addLog(`[${gradeText}] ${activeCard.name} menghasilkan ${finalDamage} Damage ke ${enemy.name}!`);

    setPlayer((prev) => ({
      ...prev,
      ap: Math.max(0, prev.ap - activeCard.cost),
    }));

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
        checkEnemyTurn();
      }
    }, 750);
  };

  // Resolusi Serangan Musuh (Parry / Defense) & DETEKSI KEKALAHAN AKURAT
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

    // Hitung HP baru secara langsung untuk menghindari stale closure
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
      addLog(`★ PARRY BERHASIL! Menahan hantaman ${enemy.name}! Kena ${finalDmg} DMG!`);
    } else {
      addLog(`✗ PARRY GAGAL! ${enemy.name} menghantam sebesar ${finalDmg} DMG!`);
    }

    // DETEKSI KEMATIAN / DEFEAT (KALO HP HABIS LANGSUNG MATI / GAME OVER)
    setTimeout(() => {
      if (newPlayerHp <= 0 || playerHpRef.current <= 0) {
        isGameOverRef.current = true;
        setHeroPose('defeat');
        setAnimSubFrame(3); // Karakter tersungkur ke lantai
        addLog(`HP Rian habis! Kamu pingsan di koridor sekolah...`);

        setTimeout(() => {
          onDefeat();
        }, 1500);
      } else {
        setHeroPose('idle');
        startTurn();
      }
    }, 850);
  };

  // Sprite Hero Berdasarkan Pose (Menghadap Kanan Secara Alami)
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

  const availableSkills: Card[] = player.deck.length > 0 ? player.deck : [
    { id: 's1', name: 'Crimson Slash', cost: 2, type: 'attack', value: 24, description: 'Tebasan keras berkecepatan tinggi.', flavor: 'Jurus andalan siswa.', iconName: 'sword', color: '#e11d48', timingDifficulty: 'hard' },
    { id: 's2', name: 'Overclock Hardware', cost: 1, type: 'buff', value: 10, description: 'Meningkatkan fokus dan pulihkan 10 HP.', flavor: 'Overclock sistem saraf.', iconName: 'chip', color: '#0284c7', timingDifficulty: 'easy' },
    { id: 's3', name: 'Perisai Fiber Optik', cost: 1, type: 'defense', value: 16, description: 'Membentangkan perisai data +16 Shield.', flavor: 'Pertahanan jaringan kuat.', iconName: 'shield', color: '#10b981', timingDifficulty: 'normal' },
  ];

  const mainActions = [
    { label: 'Attack', action: handleActionAttack },
    { label: 'Skill', action: () => setMenuMode('skill') },
    { label: 'Item', action: () => setMenuMode('item') },
    { label: 'Retreat', action: handleRetreat },
  ];

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0b0f17] text-white font-mono select-none flex flex-col justify-between overflow-hidden">
      
      {/* ======================================================== */}
      {/* 1. ARENA PERTEMPURAN: FULL SCREEN KORIDOR SMKN 7 BALEENDAH */}
      {/* ======================================================== */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between">
        
        {/* DINDING KORIDOR KELAS SMKN 7 PIXEL ART */}
        <div className="absolute inset-0 bg-[#161d27] z-0">
          {/* Dinding Atas Koridor (Cream Grayish Slate) */}
          <div className="absolute top-0 inset-x-0 h-[62%] bg-[#252f3e] border-b-4 border-[#18202c]">
            {/* Jendela Kaca Koridor Sekolah */}
            <div className="absolute top-8 left-[12%] w-36 h-28 bg-[#182433] border-4 border-[#334255] rounded-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#2a3c50]/50 to-transparent" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#334255]" />
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#334255]" />
            </div>

            <div className="absolute top-8 left-[40%] w-36 h-28 bg-[#182433] border-4 border-[#334255] rounded-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#2a3c50]/50 to-transparent" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#334255]" />
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#334255]" />
            </div>

            <div className="absolute top-8 right-[15%] w-36 h-28 bg-[#182433] border-4 border-[#334255] rounded-sm overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#2a3c50]/50 to-transparent" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#334255]" />
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#334255]" />
            </div>

            {/* Papan Mading / Pengumuman Sekolah SMKN 7 */}
            <div className="absolute top-12 left-[28%] w-24 h-20 bg-[#3b2b1d] border-2 border-[#54402d] p-1 shadow-md">
              <div className="w-full h-3 bg-[#e0b567] text-[7px] text-black font-black px-1 leading-3">
                MADING TKJ
              </div>
              <div className="mt-1 flex flex-col gap-1">
                <div className="w-12 h-4 bg-white/70" />
                <div className="w-16 h-3 bg-white/60" />
              </div>
            </div>

            {/* Lampu Neon Koridor Sekolah */}
            <div className="absolute top-0 left-1/4 w-32 h-2.5 bg-[#fef08a] shadow-[0_0_15px_#fef08a]" />
            <div className="absolute top-0 right-1/4 w-32 h-2.5 bg-[#fef08a] shadow-[0_0_15px_#fef08a]" />
          </div>

          {/* Lis Dinding Sekolah */}
          <div className="absolute top-[60%] inset-x-0 h-4 bg-[#141b24] border-y border-[#2c3645]" />
        </div>

        {/* LANTAI UBIN KORIDOR SMKN 7 (SLATE CHARCOAL IDENTIK DENGAN LANTAI MAINE) */}
        <div className="absolute bottom-0 inset-x-0 h-[38%] bg-[#1c232e] border-t-4 border-[#121720] z-0">
          {/* Garis Nat Grid Ubin Lantai Sekolah */}
          <div className="w-full h-full bg-[linear-gradient(to_right,#111620_2px,transparent_2px),linear-gradient(to_bottom,#111620_2px,transparent_2px)] bg-[size:64px_48px] opacity-70" />
        </div>

        {/* ======================================================== */}
        {/* SISI KIRI: PLAYER (RIAN PRATAMA / MAINE) MENGHADAP KANAN */}
        {/* ======================================================== */}
        <div className="absolute bottom-16 left-24 z-10 flex flex-col items-center">
          {/* INDIKATOR TURN POINTER SEGITIGA BIRU */}
          {!isEnemyAttacking && !isGameOverRef.current && (
            <div className="absolute -top-7 text-cyan-400 text-2xl animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              ▼
            </div>
          )}

          {/* Sprite Player Menghadap Kanan (Posisi Alami Tanpa Mirror Aneh) */}
          <div className="relative flex items-center justify-center">
            <img
              src={heroSpriteSrc}
              alt="Rian Pratama"
              className={`max-h-44 object-contain [image-rendering:pixelated] drop-shadow-[0_8px_0_rgba(0,0,0,0.5)] transition-transform duration-150 ${
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
          {/* Bayangan Oval Tepat di Bawah Kaki Player */}
          <div className="w-24 h-4 bg-black/45 rounded-full blur-[1px] -mt-1" />
        </div>

        {/* ======================================================== */}
        {/* SISI KANAN: ENEMY / ANOMALI MENGHADAP KIRI */}
        {/* ======================================================== */}
        <div className="absolute bottom-20 right-28 z-10 flex flex-col items-center">
          {/* Status Bar Musuh di Atas Kepala */}
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

          {/* Sprite Musuh Proporsional dengan Bayangan Pas di Bawahnya */}
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
            {/* Bayangan Oval Pas di Bawah Musuh */}
            <div className="w-28 h-4 bg-black/45 rounded-full blur-[1px] mt-1" />
          </div>
        </div>

        {/* COMBAT LOG NOTIFIKASI DI ATAS KORIDOR */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#121824]/90 border border-[#334155] px-5 py-2 rounded-lg text-xs shadow-xl max-w-md text-center">
          <span className="text-yellow-300 font-bold">› {battleLogs[0]}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PANEL AKSI & STATUS DI BAWAH (FULL SCREEN WIDTH) */}
      {/* ======================================================== */}
      <div className="w-full bg-[#121824] border-t-4 border-[#253244] px-6 py-3 flex items-center justify-between gap-6 z-30 shadow-2xl">
        
        {/* MENU AKSI VERTIKAL (Attack, Skill, Item, Retreat) */}
        <div className="flex flex-col w-36 gap-1.5">
          {menuMode === 'main' ? (
            mainActions.map((btn, idx) => {
              const isSelected = selectedActionIndex === idx && !isEnemyAttacking && !isGameOverRef.current;
              return (
                <button
                  key={btn.label}
                  onClick={() => {
                    setSelectedActionIndex(idx);
                    btn.action();
                  }}
                  disabled={isEnemyAttacking || isGameOverRef.current}
                  className={`py-1.5 px-3.5 text-left font-bold text-xs uppercase tracking-wider border-2 transition-all rounded ${
                    isSelected
                      ? 'bg-[#1e344e] border-[#38bdf8] text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                      : 'bg-[#18202d] border-[#293547] text-neutral-300 hover:bg-[#202c3d] hover:border-neutral-500'
                  } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                >
                  {btn.label}
                </button>
              );
            })
          ) : (
            <button
              onClick={() => setMenuMode('main')}
              className="py-3 px-3 bg-[#334155] hover:bg-[#475569] text-white font-bold text-xs uppercase border border-[#64748b] rounded cursor-pointer"
            >
              ◀ Kembali
            </button>
          )}
        </div>

        {/* SUB-MENU SKILL / ITEM */}
        {menuMode === 'skill' && (
          <div className="flex-1 bg-[#18202d] border-2 border-[#38bdf8] p-2.5 rounded-lg flex flex-col justify-center h-full">
            <div className="text-[11px] font-bold text-cyan-300 mb-1.5">PILIH JURUS KEJURUAN:</div>
            <div className="flex gap-2.5">
              {availableSkills.map((sk) => (
                <button
                  key={sk.id}
                  onClick={() => handleSelectSkill(sk)}
                  className="flex-1 p-2 bg-[#121824] hover:bg-[#1f2b3e] border border-[#334155] rounded-md text-left cursor-pointer transition-colors"
                >
                  <div className="flex justify-between text-xs font-bold text-yellow-300 mb-0.5">
                    <span>{sk.name}</span>
                    <span className="text-[10px] text-cyan-400">⚡{sk.cost} SP</span>
                  </div>
                  <div className="text-[10px] text-neutral-300 leading-tight truncate">{sk.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {menuMode === 'item' && (
          <div className="flex-1 bg-[#18202d] border-2 border-[#10b981] p-2.5 rounded-lg flex flex-col justify-center h-full">
            <div className="text-[11px] font-bold text-emerald-300 mb-1.5">RANSEL ITEM SISWA:</div>
            <div className="flex gap-2.5">
              {inventory.map((it) => (
                <button
                  key={it.id}
                  disabled={it.count <= 0}
                  onClick={() => handleUseItem(it.id)}
                  className="flex-1 p-2 bg-[#121824] hover:bg-[#1f2b3e] border border-[#334155] rounded-md text-left disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between text-xs font-bold text-emerald-300 mb-0.5">
                    <span>{it.name}</span>
                    <span className="text-[10px] text-white font-bold bg-[#1e293b] px-1 rounded">x{it.count}</span>
                  </div>
                  <div className="text-[10px] text-neutral-300 leading-tight truncate">{it.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KARTU STATUS PLAYER MAINE (RIAN PRATAMA) */}
        {menuMode === 'main' && (
          <div className="flex-1 flex items-center justify-end">
            <div className="bg-[#18202d] border-2 border-[#38bdf8] p-2.5 rounded-lg flex items-center gap-4 w-72 shadow-lg">
              <div className="relative">
                <img
                  src="/assets/characters/maine/avatar.png"
                  alt={player.name}
                  className="w-14 h-14 object-cover bg-[#1e293b] border-2 border-[#38bdf8] rounded"
                />
                <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-cyan-700 text-white px-1.5 border border-cyan-400 rounded">
                  Lv.1
                </span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-white truncate mb-1">
                  {player.name}
                </div>
                
                {/* HP BAR (MERAH) */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black text-red-400">HP</span>
                  <div className="flex-1 h-2.5 bg-[#331118] border border-[#551d27] rounded-sm overflow-hidden relative">
                    <div
                      className="h-full bg-[#ef4444] transition-all duration-300"
                      style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">{player.hp}/{player.maxHp}</span>
                </div>

                {/* SP BAR (TOSCA / EMERALD) */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-cyan-400">SP</span>
                  <div className="flex-1 h-2.5 bg-[#0c2429] border border-[#134e5a] rounded-sm overflow-hidden relative">
                    <div
                      className="h-full bg-[#06b6d4] transition-all duration-300"
                      style={{ width: `${(player.ap / player.maxAp) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-300 font-bold">{player.ap}/{player.maxAp}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL QTE SERANGAN PLAYER */}
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
