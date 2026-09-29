import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, updateHighscore, HIGHSCORES_KEY, MUTED_KEY } from '../storage.js';

// Atrapa localStorage
function mockStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

// localStorage, który rzuca wyjątkami (np. zablokowany w przeglądarce)
const brokenStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
};

test('brak zapisanych rekordów → zera', () => {
  assert.deepEqual(createStorage(mockStorage()).loadHighscores(), { latwy: 0, normalny: 0, trudny: 0 });
});

test('zapis i odczyt rekordów', () => {
  const backend = mockStorage();
  const storage = createStorage(backend);
  storage.saveHighscores({ latwy: 100, normalny: 2500, trudny: 0 });
  assert.deepEqual(JSON.parse(backend.data[HIGHSCORES_KEY]), { latwy: 100, normalny: 2500, trudny: 0 });
  assert.deepEqual(storage.loadHighscores(), { latwy: 100, normalny: 2500, trudny: 0 });
});

test('uszkodzone dane rekordów → zera, bez wyjątku', () => {
  const storage = createStorage(mockStorage({ [HIGHSCORES_KEY]: '{niepoprawny json' }));
  assert.deepEqual(storage.loadHighscores(), { latwy: 0, normalny: 0, trudny: 0 });
  const partial = createStorage(mockStorage({ [HIGHSCORES_KEY]: '{"normalny":"abc","trudny":700}' }));
  assert.deepEqual(partial.loadHighscores(), { latwy: 0, normalny: 0, trudny: 700 });
});

test('wyciszenie zapisywane jako true / false', () => {
  const backend = mockStorage();
  const storage = createStorage(backend);
  assert.equal(storage.loadMuted(), false);
  storage.saveMuted(true);
  assert.equal(backend.data[MUTED_KEY], 'true');
  assert.equal(storage.loadMuted(), true);
  storage.saveMuted(false);
  assert.equal(storage.loadMuted(), false);
});

test('niedostępny localStorage — gra działa dalej bez rekordów', () => {
  for (const backend of [brokenStorage, null]) {
    const storage = createStorage(backend);
    assert.deepEqual(storage.loadHighscores(), { latwy: 0, normalny: 0, trudny: 0 });
    assert.equal(storage.saveHighscores({ latwy: 1, normalny: 1, trudny: 1 }), false);
    assert.equal(storage.loadMuted(), false);
    assert.equal(storage.saveMuted(true), false);
  }
});

test('updateHighscore: nowy rekord tylko przy wyższym wyniku', () => {
  const hs = { latwy: 0, normalny: 1000, trudny: 0 };
  assert.deepEqual(updateHighscore(hs, 'normalny', 900), { highscores: hs, isNew: false });
  assert.deepEqual(updateHighscore(hs, 'normalny', 1000).isNew, false);
  const result = updateHighscore(hs, 'normalny', 1200);
  assert.equal(result.isNew, true);
  assert.equal(result.highscores.normalny, 1200);
  assert.equal(hs.normalny, 1000); // oryginał bez zmian
});
