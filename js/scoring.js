// Naliczanie punktów z mnożnikiem poziomu trudności.
import { BOSS, ENEMY_TYPES, getDifficulty } from './config.js';

export function scorePoints(base, difficultyKey) {
  return Math.round(base * getDifficulty(difficultyKey).scoreMultiplier);
}

export function enemyPoints(type) {
  return ENEMY_TYPES[type]?.points ?? 0;
}

// Pierwszy boss = 500, drugi = 1000… (przed mnożnikiem trudności)
export function bossReward(bossNumber) {
  return BOSS.rewardPerBoss * bossNumber;
}
