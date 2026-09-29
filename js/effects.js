// Efekty wizualne: odłamki po trafieniu i unoszące się napisy (punkty, „SUPER BONUS!”).
import { FONT_TITLE } from './config.js';

export class Effects {
  constructor() {
    this.particles = [];
    this.popups = [];
  }

  clear() {
    this.particles.length = 0;
    this.popups.length = 0;
  }

  burst(x, y, color, count = 12, speed = 140) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.6, t: 0, color });
    }
  }

  popup(text, x, y, { color = '#ffe2a8', size = 18, duration = 1, rise = 40 } = {}) {
    this.popups.push({ text, x, y, color, size, duration, rise, t: 0 });
  }

  update(dt) {
    for (const p of this.particles) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // grawitacja
    }
    this.particles = this.particles.filter((p) => p.t < p.life);
    for (const p of this.popups) p.t += dt;
    this.popups = this.popups.filter((p) => p.t < p.duration);
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.popups) {
      const k = p.t / p.duration;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.font = `${p.size}px ${FONT_TITLE}`;
      const y = p.y - p.rise * k;
      ctx.fillStyle = '#2b1a0f';
      ctx.fillText(p.text, p.x + 2, y + 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, y);
    }
    ctx.globalAlpha = 1;
  }
}
