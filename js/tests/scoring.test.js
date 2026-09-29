import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scorePoints, enemyPoints, bossReward } from '../scoring.js';
import { vulturePoints } from '../entities/vulture.js';

test('punkty bandytów wg typu', () => {
  assert.equal(enemyPoints('herszt'), 30);
  assert.equal(enemyPoints('rewolwerowiec'), 20);
  assert.equal(enemyPoints('opryszek'), 10);
  assert.equal(enemyPoints('nieznany'), 0);
});

test('mnożnik trudności: łatwy ×0.5, normalny ×1, trudny ×1.5', () => {
  assert.equal(scorePoints(30, 'latwy'), 15);
  assert.equal(scorePoints(30, 'normalny'), 30);
  assert.equal(scorePoints(30, 'trudny'), 45);
});

test('punkty są zaokrąglane do liczb całkowitych', () => {
  assert.equal(scorePoints(10, 'trudny'), 15);
  assert.equal(scorePoints(25, 'latwy'), 13);
  assert.ok(Number.isInteger(scorePoints(15, 'latwy')));
});

test('nagroda za bossa: 500 × numer bossa', () => {
  assert.equal(bossReward(1), 500);
  assert.equal(bossReward(2), 1000);
  assert.equal(scorePoints(bossReward(3), 'trudny'), 2250);
});

test('sęp: 50–300 pkt w krokach co 50', () => {
  assert.equal(vulturePoints(() => 0), 50);
  assert.equal(vulturePoints(() => 0.9999), 300);
  for (let i = 0; i < 100; i++) {
    const p = vulturePoints();
    assert.ok(p >= 50 && p <= 300 && p % 50 === 0, `nieprawidłowe punkty: ${p}`);
  }
});
