// Obsługa klawiatury: stan wciśniętych klawiszy + pojedyncze naciśnięcia w danej klatce.

const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
  'KeyA', 'KeyD', 'KeyP', 'KeyM', 'KeyR', 'Escape', 'Enter', 'NumpadEnter',
]);

export class Input {
  constructor(target, onFirstKey) {
    this.down = new Set();
    this.pressed = new Set();
    this.onFirstKey = onFirstKey;

    target.addEventListener('keydown', (e) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      // AudioContext wolno utworzyć dopiero po interakcji użytkownika
      if (this.onFirstKey) this.onFirstKey();
      const code = e.code === 'NumpadEnter' ? 'Enter' : e.code;
      if (!e.repeat) this.pressed.add(code);
      this.down.add(code);
    });
    target.addEventListener('keyup', (e) => {
      const code = e.code === 'NumpadEnter' ? 'Enter' : e.code;
      this.down.delete(code);
    });
    // Po utracie fokusu nie zostawiamy „zawieszonych” klawiszy
    target.addEventListener('blur', () => this.down.clear());
  }

  isDown(...codes) {
    return codes.some((c) => this.down.has(c));
  }

  wasPressed(...codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  // Wywoływane na końcu każdej klatki
  endFrame() {
    this.pressed.clear();
  }
}
