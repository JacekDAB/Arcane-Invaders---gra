import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTIES, DIFFICULTY_ORDER, getDifficulty, ROW_TYPES, FORMATION } from '../config.js';
import { SPRITES } from '../sprites.js';

test('trzy poziomy trudności w kolejności menu', () => {
  assert.deepEqual(DIFFICULTY_ORDER, ['latwy', 'normalny', 'trudny']);
  for (const key of DIFFICULTY_ORDER) assert.equal(DIFFICULTIES[key].key, key);
});

test('wartości poziomów zgodne z tabelą z wymagań', () => {
  const expected = {
    latwy:    { enemySpeed: 0.7, enemyFire: 0.5, lives: 5, powerupChance: 0.15, scoreMultiplier: 0.5 },
    normalny: { enemySpeed: 1.0, enemyFire: 1.0, lives: 3, powerupChance: 0.10, scoreMultiplier: 1.0 },
    trudny:   { enemySpeed: 1.4, enemyFire: 1.6, lives: 2, powerupChance: 0.06, scoreMultiplier: 1.5 },
  };
  for (const [key, values] of Object.entries(expected)) {
    for (const [param, value] of Object.entries(values)) {
      assert.equal(DIFFICULTIES[key][param], value, `${key}.${param}`);
    }
  }
});

test('trudniejszy poziom = szybsi i częściej strzelający wrogowie', () => {
  const [e, n, h] = DIFFICULTY_ORDER.map(getDifficulty);
  assert.ok(e.enemySpeed < n.enemySpeed && n.enemySpeed < h.enemySpeed);
  assert.ok(e.enemyFire < n.enemyFire && n.enemyFire < h.enemyFire);
  assert.ok(e.lives > n.lives && n.lives > h.lives);
});

test('getDifficulty: nieznany klucz → normalny', () => {
  assert.equal(getDifficulty('xyz'), DIFFICULTIES.normalny);
  assert.equal(getDifficulty('trudny'), DIFFICULTIES.trudny);
});

test('formacja 5×10 z typami rzędów: herszt, 2× rewolwerowiec, 2× opryszek', () => {
  assert.equal(FORMATION.rows, 5);
  assert.equal(FORMATION.cols, 10);
  assert.deepEqual(ROW_TYPES, ['herszt', 'rewolwerowiec', 'rewolwerowiec', 'opryszek', 'opryszek']);
});

test('sprite\'y: równe wiersze i kolory w palecie', () => {
  for (const [name, sprite] of Object.entries(SPRITES)) {
    for (const frame of sprite.frames) {
      const width = frame[0].length;
      for (const row of frame) {
        assert.equal(row.length, width, `${name}: wiersz „${row}”`);
        for (const ch of row) {
          if (ch !== '.') assert.ok(sprite.palette[ch], `${name}: brak koloru „${ch}”`);
        }
      }
    }
  }
});
