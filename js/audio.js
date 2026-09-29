// Efekty dźwiękowe generowane w Web Audio API (bez plików audio).
// AudioContext powstaje przy pierwszym naciśnięciu klawisza (wymóg przeglądarek).

const VOLUME = 0.35;

export class SoundFx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : VOLUME;
    this.master.connect(this.ctx.destination);

    // Bufor białego szumu dla strzałów i wybuchów
    const len = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : VOLUME;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  tone(freq, to, dur, type = 'square', vol = 0.3, delay = 0) {
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.3, freq = 1000, delay = 0) {
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t, 0, dur + 0.02);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'shoot':      // huk rewolweru
        this.noise(0.12, 0.35, 3000);
        this.tone(900, 180, 0.08, 'square', 0.12);
        break;
      case 'hit':        // trafienie bandyty
        this.tone(420, 90, 0.14, 'square', 0.18);
        this.noise(0.08, 0.15, 1500);
        break;
      case 'explosion':  // dynamit / pokonany boss
        this.noise(0.6, 0.6, 700);
        this.tone(120, 40, 0.5, 'sawtooth', 0.2);
        break;
      case 'powerup':
        [523, 659, 784].forEach((f, i) => this.tone(f, f, 0.1, 'triangle', 0.25, i * 0.07));
        break;
      case 'super':      // wyraźna, dłuższa fanfara
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f * 1.01, 0.16, 'triangle', 0.3, i * 0.08));
        [1047, 1568].forEach((f, i) => this.tone(f, f, 0.4, 'sine', 0.15, 0.4 + i * 0.1));
        break;
      case 'absorb':     // gwiazda szeryfa pochłonęła trafienie
        this.tone(1200, 600, 0.15, 'triangle', 0.25);
        break;
      case 'lifeLost':
        this.tone(440, 70, 0.6, 'sawtooth', 0.25);
        this.noise(0.3, 0.25, 900);
        break;
      case 'boss':       // złowrogi motyw El Diablo
        [110, 104, 98].forEach((f, i) => this.tone(f, f * 0.98, 0.35, 'sawtooth', 0.25, i * 0.3));
        break;
      case 'vulture':
        this.tone(1400, 900, 0.25, 'sawtooth', 0.06);
        break;
      case 'gameover':
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, f * 0.97, 0.3, 'triangle', 0.3, i * 0.28));
        break;
      default:
        break;
    }
  }
}
