// Ożywione tło: dryfujące chmury, migoczące gwiazdy i toczący się krzak (tumbleweed).
// Czysto dekoracyjne — nie biorą udziału w kolizjach.
import { WIDTH, HORIZON_Y, HUD_HEIGHT, VISUALS } from './config.js';

const between = (min, max) => min + Math.random() * (max - min);

export class Ambient {
  constructor() {
    this.t = 0;
    this.clouds = [];
    for (let i = 0; i < VISUALS.cloudCount; i++) {
      const w = between(90, 170);
      this.clouds.push({
        x: between(-w, WIDTH),
        y: between(HUD_HEIGHT + 20, 230),
        w,
        speed: between(VISUALS.cloudMinSpeed, VISUALS.cloudMaxSpeed),
        img: paintCloud(w),
      });
    }
    this.stars = [];
    for (let i = 0; i < VISUALS.starTwinkleCount; i++) {
      this.stars.push({ x: between(10, WIDTH - 10), y: between(HUD_HEIGHT + 8, 160), phase: between(0, Math.PI * 2), rate: between(1.5, 3.5) });
    }
    this.weed = null;
    this.weedTimer = between(2, VISUALS.tumbleweedMinDelay);
    this.weedImg = paintTumbleweed(14);
  }

  update(dt) {
    this.t += dt;
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > WIDTH) {
        c.x = -c.w;
        c.y = between(HUD_HEIGHT + 20, 230);
      }
    }

    if (this.weed) {
      const w = this.weed;
      w.x += w.dir * VISUALS.tumbleweedSpeed * dt;
      w.angle += w.dir * (VISUALS.tumbleweedSpeed / 14) * dt;
      w.hop += dt * 5;
      if (w.x < -40 || w.x > WIDTH + 40) this.weed = null;
    } else {
      this.weedTimer -= dt;
      if (this.weedTimer <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.weed = { x: dir > 0 ? -30 : WIDTH + 30, y: between(HORIZON_Y + 30, 520), dir, angle: 0, hop: 0 };
        this.weedTimer = between(VISUALS.tumbleweedMinDelay, VISUALS.tumbleweedMaxDelay);
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#fff4dc';
    for (const s of this.stars) {
      const a = 0.25 + 0.75 * Math.max(0, Math.sin(this.t * s.rate + s.phase));
      ctx.globalAlpha = a;
      ctx.fillRect(s.x, s.y - 1, 1, 3);   // mały krzyżyk
      ctx.fillRect(s.x - 1, s.y, 3, 1);
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.5;
    for (const c of this.clouds) ctx.drawImage(c.img, Math.round(c.x), Math.round(c.y));
    ctx.globalAlpha = 1;

    if (this.weed) {
      const w = this.weed;
      const hop = Math.abs(Math.sin(w.hop)) * 10;   // podskoki
      // cień na piasku
      ctx.fillStyle = 'rgba(80, 40, 20, 0.3)';
      ctx.beginPath();
      ctx.ellipse(w.x, w.y + 14, 12 - hop * 0.4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(w.x, w.y - hop);
      ctx.rotate(w.angle);
      ctx.drawImage(this.weedImg, -this.weedImg.width / 2, -this.weedImg.height / 2);
      ctx.restore();
    }
  }
}

// Chmura z kilku elips: ciemnofioletowa góra, podświetlony od słońca dół.
// Kolory kryjące — przezroczystość nadaje draw(), więc elipsy nie tworzą ciemnych plam
function paintCloud(w) {
  const h = Math.round(w * 0.32);
  const c = document.createElement('canvas');
  c.width = Math.ceil(w);
  c.height = h;
  const g = c.getContext('2d');
  const fill = g.createLinearGradient(0, 0, 0, h);
  fill.addColorStop(0, '#5c2e58');
  fill.addColorStop(0.7, '#c45c54');
  fill.addColorStop(1, '#ffaa6e');
  g.fillStyle = fill;
  const blobs = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobs; i++) {
    const bx = w * (0.15 + (0.7 * i) / (blobs - 1));
    const rx = w * between(0.12, 0.2);
    const ry = h * between(0.25, 0.4);
    g.beginPath();
    g.ellipse(bx, h - ry - 2, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

// Kłębek suchych gałązek: losowe łuki w okręgu
function paintTumbleweed(r) {
  const size = r * 2 + 4;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  g.translate(size / 2, size / 2);
  g.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = i % 3 === 0 ? '#6e4a24' : '#9a6a36';
    g.beginPath();
    const a = Math.random() * Math.PI * 2;
    g.arc(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, between(r * 0.4, r * 0.75), a, a + between(1.5, 3.5));
    g.stroke();
  }
  return c;
}
