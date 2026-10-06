import type { Enemy } from '../types/game';

export const ENEMY_POOL: Enemy[] = [
  {
    id: 'enemy_void_eye',
    name: 'Void Eyeball',
    title: 'Anomali Kosmik Pengawas',
    maxHp: 46,
    hp: 46,
    shield: 0,
    spriteKey: 'void_eyeball',
    attackSpeed: 1200,
    intent: {
      type: 'attack',
      value: 12,
      name: 'Sorotan Glitch Kosmik',
      desc: 'Memancarkan radiasi distorsi mata hitam yang menembus pikiran.',
    },
  },
  {
    id: 'enemy_monolith',
    name: 'Glitch Monolith',
    title: 'Pecahan Dimensi Geometris',
    maxHp: 65,
    hp: 65,
    shield: 8,
    spriteKey: 'glitch_monolith',
    attackSpeed: 1000,
    intent: {
      type: 'attack',
      value: 16,
      name: 'Patahan Ruang & Waktu',
      desc: 'Membelah gravitasi di sekitar lorong sekolah dengan prisma retak.',
    },
  },
  {
    id: 'enemy_slime',
    name: 'Prismatic Slime',
    title: 'Anomali Biokimia Kosmik',
    maxHp: 38,
    hp: 38,
    shield: 0,
    spriteKey: 'cosmic_slime',
    attackSpeed: 1350,
    intent: {
      type: 'attack',
      value: 10,
      name: 'Semprotan Asam Nebula',
      desc: 'Menyemburkan lendir beracun berkilau bintang ke arah seragam.',
    },
  },
];

export function getRandomEnemy(): Enemy {
  const chosen = ENEMY_POOL[Math.floor(Math.random() * ENEMY_POOL.length)];
  return JSON.parse(JSON.stringify(chosen));
}
