import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createFormation, stepFormation, aliveBounds, formationSpeed,
  bottomShooters, pickShooter, formationWaveParams, isBossWave,
} from '../entities/enemies.js';
import { FORMATION, WIDTH } from '../config.js';

test('formacja startuje wyśrodkowana, w prawo, z 50 bandytami', () => {
  const f = createFormation(80);
  assert.equal(f.enemies.length, 50);
  assert.equal(f.dir, 1);
  const b = aliveBounds(f);
  assert.ok(Math.abs(b.left - (WIDTH - b.right)) < 1e-9);
});

test('ruch w bok bez dotknięcia krawędzi — bez zejścia w dół', () => {
  const f = createFormation(80);
  const x0 = f.x;
  const dropped = stepFormation(f, 5);
  assert.equal(dropped, false);
  assert.equal(f.x, x0 + 5);
  assert.equal(f.y, 80);
  assert.equal(f.dir, 1);
});

test('odbicie od prawej krawędzi: zejście w dół i zmiana kierunku', () => {
  const f = createFormation(80);
  const dropped = stepFormation(f, 1000);
  assert.equal(dropped, true);
  assert.equal(f.y, 80 + FORMATION.stepDown);
  assert.equal(f.dir, -1);
  assert.equal(aliveBounds(f).right, WIDTH - FORMATION.margin); // dosunięta do granicy
});

test('odbicie od lewej krawędzi', () => {
  const f = createFormation(80);
  f.dir = -1;
  stepFormation(f, 1000);
  assert.equal(f.dir, 1);
  assert.equal(aliveBounds(f).left, FORMATION.margin);
  assert.equal(f.y, 80 + FORMATION.stepDown);
});

test('krawędź liczona od żywych bandytów (martwe skrajne kolumny się nie liczą)', () => {
  const f = createFormation(80);
  for (const e of f.enemies) if (e.col === 9) e.alive = false;
  const before = aliveBounds(f).right;
  stepFormation(f, WIDTH - FORMATION.margin - before - 1); // tuż przed krawędzią
  assert.equal(f.dir, 1);
  stepFormation(f, 2);
  assert.equal(f.dir, -1);
});

test('pusta formacja się nie porusza', () => {
  const f = createFormation(80);
  for (const e of f.enemies) e.alive = false;
  assert.equal(aliveBounds(f), null);
  assert.equal(stepFormation(f, 10), false);
});

test('prędkość rośnie wraz ze spadkiem liczby żywych', () => {
  const full = formationSpeed(50, 50);
  const half = formationSpeed(25, 50);
  const last = formationSpeed(1, 50);
  assert.equal(full, FORMATION.baseSpeed);
  assert.ok(half > full && last > half);
  assert.equal(formationSpeed(0, 50), 0);
  assert.ok(formationSpeed(50, 50, 1, 1.4) > formationSpeed(50, 50, 1, 0.7));
});

test('kolejne fale zaczynają niżej i są szybsze; boss co 5 fal', () => {
  const w1 = formationWaveParams(1);
  const w2 = formationWaveParams(2);
  const w6 = formationWaveParams(6);
  assert.equal(w1.startY, FORMATION.startY);
  assert.ok(w2.startY > w1.startY && w2.waveSpeed > w1.waveSpeed);
  assert.equal(w6.index, 4); // fala 5 to boss, więc fala 6 to piąta formacja
  assert.ok(formationWaveParams(100).startY <= FORMATION.startY + FORMATION.startYMaxOffset);
  assert.deepEqual([1, 4, 5, 6, 10, 15].map(isBossWave), [false, false, true, false, true, true]);
});

test('strzela tylko najniższy żywy bandyta w kolumnie', () => {
  const f = createFormation(80, 3, 3);
  // kolumna 0: ginie dolny → strzela środkowy; kolumna 1: pusta; kolumna 2: wszyscy żyją
  const at = (r, c) => f.enemies.find((e) => e.row === r && e.col === c);
  at(2, 0).alive = false;
  for (let r = 0; r < 3; r++) at(r, 1).alive = false;

  const shooters = bottomShooters(f.enemies);
  assert.deepEqual(shooters.map((e) => [e.row, e.col]), [[1, 0], [2, 2]]);
});

test('pickShooter losuje spośród najniższych; null gdy brak żywych', () => {
  const f = createFormation(80, 2, 3);
  assert.deepEqual([pickShooter(f.enemies, () => 0).col, pickShooter(f.enemies, () => 0.99).col], [0, 2]);
  assert.equal(pickShooter(f.enemies, () => 0.5).row, 1);
  for (const e of f.enemies) e.alive = false;
  assert.equal(pickShooter(f.enemies), null);
});
