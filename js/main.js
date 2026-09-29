// Inicjalizacja i pętla gry (requestAnimationFrame + ograniczony delta time).
import { MAX_DT, FONT_TITLE } from './config.js';
import { Input } from './input.js';
import { SoundFx } from './audio.js';
import { createStorage } from './storage.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const storage = createStorage();
const audio = new SoundFx();
const input = new Input(window, () => audio.init());
const game = new Game({ input, audio, storage });

// Ukryta karta → automatyczna pauza
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pause();
});

// Czcionka „Rye” z Google Fonts — gra działa też bez niej (fallback Georgia)
document.fonts?.load(`32px ${FONT_TITLE}`).catch(() => {});

let last = performance.now();

function frame(now) {
  // Po powrocie do karty nie „przeskakujemy” — maks. 50 ms na klatkę
  const dt = Math.min(Math.max(0, (now - last) / 1000), MAX_DT);
  last = now;
  game.update(dt);
  game.draw(ctx);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
