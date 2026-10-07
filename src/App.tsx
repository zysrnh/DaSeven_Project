import React, { useState } from 'react';
import type { Enemy, Player } from './types/game';
import { STARTER_DECK } from './data/cards';
import { Overworld } from './components/Overworld';
import { BattleScreen } from './components/BattleScreen';

type GameMode = 'OVERWORLD' | 'ENCOUNTER_FLASH' | 'BATTLE' | 'VICTORY' | 'DEFEAT';

export const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('OVERWORLD');

  const [player, setPlayer] = useState<Player>({
    name: 'Rian Pratama',
    jurusan: 'Teknik Komputer & Jaringan',
    maxHp: 60,
    hp: 60,
    maxAp: 3,
    ap: 3,
    shield: 0,
    deck: [...STARTER_DECK],
    hand: [],
    discard: [],
  });

  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [battlesWon, setBattlesWon] = useState(0);

  const handleEncounter = (enemy: Enemy) => {
    setCurrentEnemy(enemy);
    setGameMode('ENCOUNTER_FLASH');

    setTimeout(() => {
      setGameMode('BATTLE');
    }, 600);
  };

  const handleVictory = (updatedPlayer: Player) => {
    setBattlesWon((prev) => prev + 1);
    setPlayer((prev) => ({
      ...prev,
      hp: Math.min(prev.maxHp, updatedPlayer.hp + 10),
      deck: updatedPlayer.deck,
      hand: [],
      discard: [],
    }));
    setGameMode('VICTORY');
  };

  const handleDefeat = () => {
    setGameMode('DEFEAT');
  };

  const handleReturnToSchool = () => {
    setGameMode('OVERWORLD');
    setCurrentEnemy(null);
  };

  const handleRestart = () => {
    setPlayer({
      name: 'Rian Pratama',
      jurusan: 'Teknik Komputer & Jaringan',
      maxHp: 60,
      hp: 60,
      maxAp: 3,
      ap: 3,
      shield: 0,
      deck: [...STARTER_DECK],
      hand: [],
      discard: [],
    });
    setBattlesWon(0);
    setCurrentEnemy(null);
    setGameMode('OVERWORLD');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#09090e] text-white font-mono antialiased">
      {gameMode === 'OVERWORLD' && (
        <Overworld player={player} onEncounter={handleEncounter} />
      )}

      {gameMode === 'ENCOUNTER_FLASH' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white animate-ping">
          <div className="text-black font-black text-3xl tracking-widest uppercase">
            ⚠ ANOMALI KOSMIK TERDETEKSI! ⚠
          </div>
        </div>
      )}

      {gameMode === 'BATTLE' && currentEnemy && (
        <BattleScreen
          player={player}
          enemy={currentEnemy}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
        />
      )}

      {gameMode === 'VICTORY' && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121218] border-4 border-yellow-500 p-8 w-full max-w-md text-center shadow-2xl">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-2xl font-black text-yellow-400 mb-2 uppercase tracking-widest">
              ANOMALI TERATASI!
            </h2>
            <p className="text-xs text-neutral-300 mb-6">
              Kamu berhasil mengusir anomali alien dari lorong sekolah dengan penggaris besi dan kabel LAN!
            </p>

            <div className="bg-[#1c1c28] border-2 border-[#323246] p-4 text-left text-xs mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Kemenangan:</span>
                <span className="text-yellow-400 font-bold">{battlesWon} Anomali</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Bonus Pemulihan:</span>
                <span className="text-green-400 font-bold">+10 HP Pulih</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Status Jurusan:</span>
                <span className="text-cyan-400 font-bold">Teknik Komputer & Jaringan</span>
              </div>
            </div>

            <button
              onClick={handleReturnToSchool}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-black text-sm uppercase tracking-widest border-2 border-yellow-200"
            >
              Lanjutkan Eksplorasi Lorong ➔
            </button>
          </div>
        </div>
      )}

      {gameMode === 'DEFEAT' && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-[#181014] border-4 border-red-600 p-8 w-full max-w-md text-center shadow-2xl">
            <div className="text-4xl mb-2">💀</div>
            <h2 className="text-2xl font-black text-red-500 mb-2 uppercase tracking-widest">
              KAMU TERELIMINASI
            </h2>
            <p className="text-xs text-neutral-400 mb-6">
              Radiasi anomali alien melumpuhkan seragam sekolahmu. Istirahatlah sejenak di ruang UKS.
            </p>

            <button
              onClick={handleRestart}
              className="w-full py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-sm uppercase tracking-widest border-2 border-red-300"
            >
              Ulangi dari Lab Komputer ↺
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
