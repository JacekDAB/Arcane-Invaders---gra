import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollPowerup, weightedPick, applyExtraLife, applySuperBonus } from '../entities/powerups.js';
import { bossMaxHp } from '../entities/boss.js';

test('rollPowerup: szansa zależna od poziomu trudności', () => {
  assert.equal(rollPowerup(0.1, () => 0.5), null);
  assert.notEqual(rollPowerup(0.1, () => 0.05), null);
  assert.equal(rollPowerup(0, () => 0), null);
});

test('weightedPick: każdy zwykły bonus może wypaść, „życie” najrzadsze', () => {
  const weights = { double: 4, fast: 4, star: 3, life: 1 };
  const counts = { double: 0, fast: 0, star: 0, life: 0 };
  for (let i = 0; i < 1200; i++) counts[weightedPick(weights, i / 1200)]++;
  assert.deepEqual(counts, { double: 400, fast: 400, star: 300, life: 100 });
});

test('Dodatkowe życie: +1, maksymalnie 5', () => {
  assert.equal(applyExtraLife(3), 4);
  assert.equal(applyExtraLife(5), 5);
  assert.equal(applyExtraLife(6), 6); // życie z „Złotej podkowy” nie przepada
});

test('Złota podkowa: +1 życie ponad limit do 6, potem punkty', () => {
  assert.deepEqual(applySuperBonus(3), { lives: 4, overflow: false });
  assert.deepEqual(applySuperBonus(5), { lives: 6, overflow: false });
  assert.deepEqual(applySuperBonus(6), { lives: 6, overflow: true });
});

test('boss: 20 trafień bazowo, kolejni bossowie wytrzymalsi', () => {
  assert.equal(bossMaxHp(1), 20);
  assert.ok(bossMaxHp(2) > bossMaxHp(1));
});
