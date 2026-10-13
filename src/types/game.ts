export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'attack' | 'defense' | 'heal' | 'buff' | 'special';
  value: number;
  description: string;
  flavor: string;
  iconName: string;
  color: string;
  timingDifficulty: 'easy' | 'normal' | 'hard';
}

export interface EnemyIntent {
  type: 'attack' | 'defend' | 'buff';
  value: number;
  name: string;
  desc: string;
}

export interface Enemy {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  hp: number;
  shield: number;
  spriteKey: 'void_eyeball' | 'glitch_monolith' | 'cosmic_slime';
  intent: EnemyIntent;
  attackSpeed: number; // Duration of QTE in ms
}

export interface Player {
  name: string;
  jurusan: string;
  maxHp: number;
  hp: number;
  maxAp: number;
  ap: number;
  shield: number;
  deck: Card[];
  hand: Card[];
  discard: Card[];
}

export type BattlePhase = 
  | 'draw'
  | 'player_select'
  | 'player_qte'
  | 'player_anim'
  | 'enemy_intent'
  | 'enemy_qte'
  | 'enemy_anim'
  | 'victory'
  | 'defeat';

export type QteGrade = 'PERFECT' | 'GOOD' | 'MISS' | null;

export interface OverworldEntity {
  id: string;
  x: number;
  y: number;
  type: 'enemy' | 'chest' | 'npc';
  enemyData?: Enemy;
  spriteKey: string;
}

export type TrafficVehicleType = 'angkot' | 'pickup' | 'avanza';

export type BuildingCategory =
  | 'pabrik'
  | 'sekolah'
  | 'fotocopy'
  | 'warmindo'
  | 'counter_hp'
  | 'warung_madura'
  | 'bengkel'
  | 'minimarket';

export interface TrafficVehicle {
  id: string;
  vehicleType: TrafficVehicleType;
  x: number;
  y: number;
  speed: number;
  baseSpeed: number;
  dir: 'left' | 'right' | 'up' | 'down';
  animFrame: number;
  animTimer: number;
  isSpeeding: boolean;
  hornCooldown: number;
  isStopped: boolean;
  viewType: 'side' | 'front' | 'rear';
}

