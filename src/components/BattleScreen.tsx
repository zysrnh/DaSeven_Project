import React, { useState, useEffect } from 'react';
import type { Card, Enemy, Player, QteGrade } from '../types/game';
import { getSpriteDataUrl } from '../utils/sprites';
import { playSound } from '../utils/audio';
import { ActionTimingBar } from './ActionTimingBar';
import { EnemyDefenseQte } from './EnemyDefenseQte';
import { DefenseBarrierEffect } from './DefenseBarrierEffect';

interface BattleScreenProps {
  player: Player;
  enemy: Enemy;
  onVictory: (updatedPlayer: Player) => void;
  onDefeat: () => void;
}

type HeroPose = 'idle' | 'windup' | 'attack' | 'defend' | 'hurt' | 'heal' | 'victory' | 'defeat';

export const BattleScreen: React.FC<BattleScreenProps> = ({
  player: initialPlayer,
  enemy: initialEnemy,
  onVictory,
  onDefeat,
}) => {
  const [player, setPlayer] = useState<Player>({ ...initialPlayer });
  const [enemy, setEnemy] = useState<Enemy>({ ...initialEnemy });

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [heroPose, setHeroPose] = useState<HeroPose>('idle');
  const [idleToggle, setIdleToggle] = useState(false);
  const [enemyFlash, setEnemyFlash] = useState(false);
  const [battleLogs, setBattleLogs] = useState<string[]>([
    `Pertarungan dimulai! ${enemy.name} (${enemy.title}) menghalangi lorong!`,
  ]);

  // Subtle breathing idle animation toggle in battle
  useEffect(() => {
    const timer = setInterval(() => {
      setIdleToggle((prev) => !prev);
    }, 650);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg: string) => {
    setBattleLogs((prev) => [msg, ...prev.slice(0, 4)]);
  };

  const startTurn = () => {
    setPlayer((prev) => {
      let deck = [...prev.deck];
      let discard = [...prev.discard];
      let hand = [...prev.hand];

      while (hand.length < 4) {
        if (deck.length === 0) {
          if (discard.length === 0) break;
          deck = [...discard];
          discard = [];
        }
        const drawn = deck.pop();
        if (drawn) hand.push(drawn);
      }

      return {
        ...prev,
        ap: prev.maxAp,
        shield: 0,
        deck,
        discard,
        hand,
      };
    });
    setHeroPose('idle');
  };

  useEffect(() => {
    startTurn();
  }, []);

  const handlePlayCard = (card: Card) => {
    if (player.ap < card.cost) {
      addLog(`AP tidak cukup untuk memainkan ${card.name}!`);
      return;
    }

    playSound.cardSelect();

    if (card.type === 'attack' || card.type === 'special') {
      setActiveCard(card);
      setHeroPose('windup'); // Pose ancang-ancang angkat penggaris
    } else if (card.type === 'defense') {
      setHeroPose('defend'); // Pose pasang buku modul binder rapat sebagai perisai!
      setPlayer((prev) => ({
        ...prev,
        ap: prev.ap - card.cost,
        shield: prev.shield + card.value,
        hand: prev.hand.filter((c) => c.id !== card.id),
        discard: [...prev.discard, card],
      }));
      playSound.attackHit(false);
      addLog(`Kamu memasang ${card.name}! Mendapatkan +${card.value} Shield!`);
      setTimeout(() => setHeroPose('idle'), 1100);
    } else if (card.type === 'heal') {
      setHeroPose('heal'); // Pose minum es teh kantin berplastik dengan sedotan!
      playSound.heal();
      setPlayer((prev) => {
        let deck = [...prev.deck];
        let discard = [...prev.discard];
        let hand = prev.hand.filter((c) => c.id !== card.id);

        if (deck.length > 0) {
          const drawn = deck.pop()!;
          hand.push(drawn);
        }

        return {
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + card.value),
          ap: prev.ap - card.cost,
          deck,
          discard: [...discard, card],
          hand,
        };
      });
      addLog(`Minum ${card.name}! Pulih +${card.value} HP & menarik 1 kartu!`);
      setTimeout(() => setHeroPose('idle'), 1100);
    }
  };

  const handleResolvePlayerQte = (grade: QteGrade, multiplier: number) => {
    if (!activeCard) return;

    const baseDmg = activeCard.value;
    const finalDamage = Math.round(baseDmg * multiplier);

    setHeroPose('attack'); // Pose tebas slash penggaris besi dengan efek putih!
    setEnemyFlash(true);

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

    const gradeText = grade === 'PERFECT' ? 'CRITICAL HIT (x2.0)' : grade === 'GOOD' ? 'GOOD HIT' : 'MISS';
    addLog(`[${gradeText}] ${activeCard.name} menghasilkan ${finalDamage} Damage ke ${enemy.name}!`);

    setPlayer((prev) => ({
      ...prev,
      ap: prev.ap - activeCard.cost,
      hand: prev.hand.filter((c) => c.id !== activeCard.id),
      discard: [...prev.discard, activeCard],
    }));

    setActiveCard(null);

    setTimeout(() => {
      setEnemyFlash(false);

      if (enemy.hp - finalDamage <= 0) {
        setHeroPose('victory'); // Pose menang acung jempol!
        playSound.victory();
        setTimeout(() => {
          onVictory(player);
        }, 1200);
      } else {
        setHeroPose('idle');
      }
    }, 700);
  };

  const handleEndTurn = () => {
    if (activeCard || isEnemyAttacking) return;
    addLog(`Giliran kamu selesai. ${enemy.name} bersiap menyerang!`);
    setIsEnemyAttacking(true);
  };

  const handleResolveEnemyDefense = (parried: boolean) => {
    setIsEnemyAttacking(false);

    const rawDmg = enemy.intent.value;
    const finalDmg = parried ? Math.max(1, Math.round(rawDmg * 0.2)) : rawDmg;

    setHeroPose(parried ? 'defend' : 'hurt');

    setPlayer((prev) => {
      let dmgLeft = finalDmg;
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

    if (parried) {
      addLog(`★ PARRY SUKSES! Kamu menangkis dengan perisai binder! Hanya kena ${finalDmg} DMG!`);
    } else {
      addLog(`✗ PARRY GAGAL! ${enemy.name} menghantam sebesar ${finalDmg} DMG!`);
    }

    setTimeout(() => {
      if (player.hp - finalDmg <= 0) {
        // Menggunakan hero_defeat_1 (berlutut lemas & menunduk) sesuai permintaan
        setHeroPose('defeat');
        setTimeout(() => {
          onDefeat();
        }, 1400);
      } else {
        setHeroPose('idle');
        startTurn();
      }
    }, 900);
  };

  // Dynamic 20-Sprite Asset Mapping
  let heroSpriteSrc = idleToggle
    ? '/assets/Maine/hero_battle_idle_2.png'
    : '/assets/Maine/hero_battle_idle_1.png';

  if (heroPose === 'windup') {
    heroSpriteSrc = '/assets/Maine/hero_attack_windup.png';
  } else if (heroPose === 'attack') {
    heroSpriteSrc = '/assets/Maine/hero_attack_slash.png';
  } else if (heroPose === 'defend') {
    heroSpriteSrc = '/assets/Maine/hero_battle_defend_1.png';
  } else if (heroPose === 'hurt') {
    heroSpriteSrc = '/assets/Maine/hero_hurt_1.png';
  } else if (heroPose === 'heal') {
    heroSpriteSrc = '/assets/Maine/hero_heal_1.png';
  } else if (heroPose === 'victory') {
    heroSpriteSrc = '/assets/Maine/hero_victory_2.png';
  } else if (heroPose === 'defeat') {
    // Sesuai permintaan user: Menggunakan hero_defeat_1.png (berlutut lemas)
    heroSpriteSrc = '/assets/Maine/hero_defeat_1.png';
  }

  const enemySpriteUrl = getSpriteDataUrl(`${enemy.spriteKey}_0`);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d12] text-white p-3 font-mono select-none">
      <div className="w-full max-w-[640px] bg-[#161622] border-2 border-[#323246] p-2.5 mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-yellow-400" />
          <span className="font-bold text-yellow-400 uppercase tracking-wider">
            ANOMALI PERTEMPURAN • TURN-BASED ACTION
          </span>
        </div>
        <div className="text-neutral-400 text-[11px]">
          Fase: <strong className="text-white">{isEnemyAttacking ? 'PARRY REACTION' : 'GILIRAN KAMU'}</strong>
        </div>
      </div>

      <div className="w-full max-w-[640px] border-4 border-[#323246] bg-[#0a0a0f] flex flex-col shadow-2xl relative overflow-hidden">
        {/* ARENA */}
        <div className="relative h-64 border-b-2 border-[#323246] bg-[#12121c] flex items-center justify-around px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#1f1f2e_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

          {/* PLAYER */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-[#1e1e2d] border-2 border-[#474766] p-2.5 mb-2 w-44 shadow-md">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-white">{player.name}</span>
                <span className="text-[10px] text-cyan-400 bg-[#0f172a] px-1 border border-[#334155]">{player.jurusan}</span>
              </div>
              
              <div className="h-3 bg-[#331118] border border-[#66222b] overflow-hidden mb-1 relative">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-300">
                <span>HP: {player.hp}/{player.maxHp}</span>
                {player.shield > 0 && (
                  <span className="text-cyan-300 font-bold">🛡 Shield: +{player.shield}</span>
                )}
              </div>
            </div>

            {/* Dynamic Battle Sprite Frame with Defense Barrier Overlay */}
            <div className="relative w-44 h-36 flex items-center justify-center">
              <DefenseBarrierEffect
                isActive={heroPose === 'defend' || player.shield > 0}
                shieldValue={player.shield}
              />
              <img
                src={heroSpriteSrc}
                alt="Hero Anak SMK"
                className={`max-h-36 object-contain [image-rendering:pixelated] drop-shadow-[0_8px_0_rgba(0,0,0,0.5)] transition-transform duration-150 ${
                  heroPose === 'attack'
                    ? 'scale-110 translate-x-4'
                    : heroPose === 'hurt'
                    ? 'opacity-70 -translate-x-2'
                    : heroPose === 'defeat'
                    ? 'opacity-90'
                    : ''
                }`}
              />
            </div>
          </div>

          <div className="z-10 bg-[#272738] border-2 border-[#4a4a66] px-3 py-1 text-xs font-black text-yellow-400">
            VS
          </div>

          {/* ENEMY */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-[#1e1e2d] border-2 border-[#474766] p-2.5 mb-2 w-48 shadow-md">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-red-400">{enemy.name}</span>
                <span className="text-[9px] text-neutral-400">{enemy.title}</span>
              </div>

              <div className="h-3 bg-[#331118] border border-[#66222b] overflow-hidden mb-1">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-300">
                <span>HP: {enemy.hp}/{enemy.maxHp}</span>
                {enemy.shield > 0 && (
                  <span className="text-cyan-300 font-bold">🛡 Shield: +{enemy.shield}</span>
                )}
              </div>

              <div className="mt-1 pt-1 border-t border-[#323246] flex items-center justify-between text-[10px]">
                <span className="text-yellow-400 font-bold">Niat:</span>
                <span className="text-neutral-300">⚔ {enemy.intent.name} ({enemy.intent.value} DMG)</span>
              </div>
            </div>

            <div className="w-32 h-36 flex items-center justify-center animate-bounce duration-1000">
              <img
                src={enemySpriteUrl}
                alt={enemy.name}
                className={`w-32 h-32 [image-rendering:pixelated] drop-shadow-[0_8px_0_rgba(0,0,0,0.5)] transition-all ${
                  enemyFlash ? 'brightness-200 invert' : ''
                }`}
              />
            </div>
          </div>
        </div>

        {/* COMBAT LOGS */}
        <div className="bg-[#0e0e14] border-b-2 border-[#323246] px-4 py-2 text-xs text-neutral-300 h-16 flex flex-col justify-center">
          {battleLogs.slice(0, 2).map((log, idx) => (
            <div key={idx} className={idx === 0 ? 'text-yellow-300 font-bold' : 'text-neutral-400'}>
              › {log}
            </div>
          ))}
        </div>

        {/* AP & ACTIONS */}
        <div className="bg-[#181824] px-4 py-2 border-b-2 border-[#323246] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-neutral-300">AP ENERGI:</span>
            <div className="flex space-x-1">
              {Array.from({ length: player.maxAp }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 border-2 flex items-center justify-center text-[10px] font-black ${
                    i < player.ap
                      ? 'bg-yellow-400 border-yellow-200 text-black'
                      : 'bg-[#262638] border-[#44445e] text-neutral-500'
                  }`}
                >
                  ⚡
                </div>
              ))}
            </div>
            <span className="text-xs text-yellow-300 font-bold ml-1">
              ({player.ap}/{player.maxAp})
            </span>
          </div>

          <button
            onClick={handleEndTurn}
            disabled={isEnemyAttacking || activeCard !== null}
            className="px-4 py-1.5 bg-[#e11d48] hover:bg-[#be123c] active:bg-[#9f1239] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider border border-[#fda4af]"
          >
            Akhiri Giliran ➔
          </button>
        </div>

        {/* HAND CARDS */}
        <div className="bg-[#121218] p-4 flex flex-wrap gap-3 justify-center min-h-[180px]">
          {player.hand.map((card) => {
            const canAfford = player.ap >= card.cost && !isEnemyAttacking && !activeCard;
            return (
              <div
                key={card.id}
                onClick={() => canAfford && handlePlayCard(card)}
                className={`w-44 p-3 border-2 transition-all flex flex-col justify-between select-none ${
                  canAfford
                    ? 'cursor-pointer hover:-translate-y-2 hover:border-yellow-400 bg-[#1e1e2d] border-[#3e3e56]'
                    : 'opacity-50 cursor-not-allowed bg-[#161622] border-[#2a2a3b]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-[#323246]">
                    <span className="font-bold text-xs text-white truncate">{card.name}</span>
                    <span className="w-5 h-5 bg-yellow-400 text-black font-black text-xs flex items-center justify-center border border-yellow-200">
                      {card.cost}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-300 mb-2 leading-tight">
                    {card.description}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-neutral-400 italic mb-1.5 border-t border-[#262636] pt-1">
                    "{card.flavor}"
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span
                      className="px-1.5 py-0.5 font-bold uppercase"
                      style={{ backgroundColor: card.color, color: '#ffffff' }}
                    >
                      {card.type}
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {card.type === 'attack' || card.type === 'special' ? `⚔ ${card.value} DMG` : card.type === 'defense' ? `🛡 +${card.value}` : `♥ +${card.value}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeCard && (
        <ActionTimingBar
          card={activeCard}
          onComplete={handleResolvePlayerQte}
        />
      )}

      {isEnemyAttacking && (
        <EnemyDefenseQte
          enemy={enemy}
          onComplete={handleResolveEnemyDefense}
        />
      )}
    </div>
  );
};
