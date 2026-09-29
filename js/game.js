// Maszyna stanów gry: MENU → GRA → PAUZA → GAME OVER oraz logika rozgrywki
// (fale, kolizje, punktacja, bonusy).
import {
  WIDTH, HEIGHT, GROUND_Y, WAVE_BANNER_TIME, FORMATION, BOSS, VULTURE, POWERUPS,
  ENEMY_TYPES, DIFFICULTY_ORDER, DEFAULT_DIFFICULTY, getDifficulty,
} from './config.js';
import { aabb, circleRect } from './collision.js';
import { scorePoints, enemyPoints, bossReward } from './scoring.js';
import { updateHighscore } from './storage.js';
import { Effects } from './effects.js';
import { Player } from './entities/player.js';
import { Formation, isBossWave } from './entities/enemies.js';
import { Boss } from './entities/boss.js';
import { Vulture, vulturePoints, nextVultureDelay } from './entities/vulture.js';
import { Bullet, Dynamite, Explosion } from './entities/bullets.js';
import { createShields } from './entities/shields.js';
import { PowerUp, POWERUP_INFO, rollPowerup } from './entities/powerups.js';
import {
  drawBackground, drawHUD, drawBossBar, drawBanner, drawMenu, drawPause, drawGameOver, drawMuteIndicator,
} from './render.js';

export const STATE = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' };

export class Game {
  constructor({ input, audio, storage }) {
    this.input = input;
    this.audio = audio;
    this.storage = storage;
    this.state = STATE.MENU;
    this.difficultyIndex = DIFFICULTY_ORDER.indexOf(DEFAULT_DIFFICULTY);
    this.highscores = storage.loadHighscores();
    this.audio.setMuted(storage.loadMuted());
    this.effects = new Effects();
    this.time = 0;
    this.score = 0;
    this.newRecord = false;
  }

  get difficultyKey() {
    return DIFFICULTY_ORDER[this.difficultyIndex];
  }

  get difficulty() {
    return getDifficulty(this.difficultyKey);
  }

  get record() {
    return Math.max(this.highscores[this.difficultyKey] ?? 0, this.score);
  }

  get isBossWave() {
    return isBossWave(this.wave);
  }

  // Wywoływane także przy ukryciu karty (visibilitychange)
  pause() {
    if (this.state === STATE.PLAYING) this.state = STATE.PAUSED;
  }

  // --- Przejścia między stanami ----------------------------------------------

  startGame() {
    this.state = STATE.PLAYING;
    this.score = 0;
    this.wave = 0;
    this.bossCount = 0;
    this.newRecord = false;
    this.player = new Player(this.difficulty.lives);
    this.shields = createShields();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.dynamites = [];
    this.explosions = [];
    this.powerups = [];
    this.effects.clear();
    this.formation = null;
    this.boss = null;
    this.vulture = null;
    this.vultureTimer = nextVultureDelay();
    this.nextWave();
  }

  // Napis „FALA N” przez 2 s, potem spawnWave()
  nextWave() {
    this.wave++;
    this.bannerTimer = WAVE_BANNER_TIME;
    this.formation = null;
    this.boss = null;
  }

  spawnWave() {
    if (this.isBossWave) {
      this.bossCount++;
      this.boss = new Boss(this.bossCount, this.difficulty);
      this.vulture = null;
      this.audio.play('boss');
    } else {
      this.formation = new Formation(this.wave, this.difficulty);
      this.vultureTimer = nextVultureDelay();
    }
  }

  endGame() {
    this.state = STATE.GAMEOVER;
    const { highscores, isNew } = updateHighscore(this.highscores, this.difficultyKey, this.score);
    this.newRecord = isNew;
    if (isNew) {
      this.highscores = highscores;
      this.storage.saveHighscores(highscores);
    }
    this.audio.play('gameover');
  }

  // --- Aktualizacja ----------------------------------------------------------

  update(dt) {
    this.time += dt;
    const input = this.input;

    if (input.wasPressed('KeyM')) {
      this.storage.saveMuted(this.audio.toggleMute());
    }

    switch (this.state) {
      case STATE.MENU: {
        const n = DIFFICULTY_ORDER.length;
        if (input.wasPressed('ArrowUp')) this.difficultyIndex = (this.difficultyIndex + n - 1) % n;
        if (input.wasPressed('ArrowDown')) this.difficultyIndex = (this.difficultyIndex + 1) % n;
        if (input.wasPressed('Enter')) this.startGame();
        break;
      }
      case STATE.PLAYING:
        if (input.wasPressed('KeyP', 'Escape')) {
          this.state = STATE.PAUSED;
          break;
        }
        this.updatePlaying(dt);
        break;
      case STATE.PAUSED:
        if (input.wasPressed('KeyP', 'Escape')) this.state = STATE.PLAYING;
        else if (input.wasPressed('Enter')) this.state = STATE.MENU;
        break;
      case STATE.GAMEOVER:
        if (input.wasPressed('Enter')) this.state = STATE.MENU;
        else if (input.wasPressed('KeyR')) this.startGame();
        break;
      default:
        break;
    }
  }

  updatePlaying(dt) {
    const p = this.player;
    p.update(dt, this.input);

    if (this.input.isDown('Space')) {
      const bullet = p.tryShoot(this.playerBullets.length);
      if (bullet) {
        this.playerBullets.push(bullet);
        this.audio.play('shoot');
      }
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.spawnWave();
    }

    const enemyShot = (x, y, vx = 0, vy = FORMATION.bulletSpeed) => {
      this.enemyBullets.push(new Bullet(x - FORMATION.bulletW / 2, y, vx, vy, FORMATION.bulletW, FORMATION.bulletH, 'enemy'));
    };
    if (this.formation) this.formation.update(dt, enemyShot);
    if (this.boss) {
      this.boss.update(dt, p.x + p.w / 2, {
        fire: enemyShot,
        dynamite: (x, y, vx, vy) => this.dynamites.push(new Dynamite(x - 4, y, vx, vy)),
      });
    }
    this.updateVulture(dt);

    for (const list of [this.playerBullets, this.enemyBullets, this.powerups]) {
      for (const o of list) o.update(dt);
    }
    for (const e of this.explosions) e.update(dt);
    this.explosions = this.explosions.filter((e) => !e.done);
    this.effects.update(dt);

    this.updateDynamites(dt);
    this.handleCollisions();
    if (this.state !== STATE.PLAYING) return;

    this.playerBullets = this.playerBullets.filter((b) => !b.dead && !b.isOffscreen());
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead && !b.isOffscreen());
    this.powerups = this.powerups.filter((u) => !u.dead && !u.isOffscreen());

    if (this.formation && this.formation.alive === 0) this.nextWave();
  }

  updateVulture(dt) {
    if (this.vulture) {
      this.vulture.update(dt);
      if (this.vulture.gone) this.vulture = null;
      return;
    }
    if (!this.formation) return; // sęp tylko podczas zwykłej fali
    this.vultureTimer -= dt;
    if (this.vultureTimer <= 0) {
      this.vulture = new Vulture(Math.random() < 0.5 ? 1 : -1);
      this.vultureTimer = nextVultureDelay();
      this.audio.play('vulture');
    }
  }

  updateDynamites(dt) {
    const p = this.player;
    for (const d of this.dynamites) {
      d.update(dt);
      const hitsGround = d.y + d.h >= GROUND_Y;
      const hitsPlayer = aabb(d.rect, p.hitbox);
      const hitsShield = !hitsPlayer && this.shields.some((s) => s.hitRect(d.rect, false));
      if (hitsGround || hitsPlayer || hitsShield) {
        d.dead = true;
        this.explode(d.center.x, d.center.y);
      }
    }
    this.dynamites = this.dynamites.filter((d) => !d.dead);
  }

  // Wybuch dynamitu: większy obszar rażenia, niszczy kilka bloków osłon
  explode(x, y) {
    const r = BOSS.explosionRadius;
    this.explosions.push(new Explosion(x, y, r));
    for (const s of this.shields) s.destroyRadius(x, y, r);
    this.audio.play('explosion');
    if (circleRect(x, y, r, this.player.hitbox)) this.hitPlayer();
  }

  handleCollisions() {
    const p = this.player;

    // Pociski gracza: osłony → bandyci → boss → sęp
    for (const b of this.playerBullets) {
      if (this.shields.some((s) => s.hitRect(b.rect, true))) {
        b.dead = true;
        continue;
      }
      const hit = this.formation?.hitTest(b.rect);
      if (hit) {
        b.dead = true;
        this.killEnemy(hit.enemy, hit.rect);
        continue;
      }
      if (this.boss && !this.boss.entering && aabb(b.rect, this.boss.rect)) {
        b.dead = true;
        this.hitBoss();
        continue;
      }
      if (this.vulture && aabb(b.rect, this.vulture.rect)) {
        b.dead = true;
        this.killVulture();
      }
    }

    // Pociski wrogów: osłony → szeryf
    for (const b of this.enemyBullets) {
      if (this.shields.some((s) => s.hitRect(b.rect, false))) {
        b.dead = true;
        continue;
      }
      if (aabb(b.rect, p.hitbox)) {
        b.dead = true;
        this.hitPlayer();
        if (this.state !== STATE.PLAYING) return;
      }
    }

    // Zbieranie bonusów
    for (const u of this.powerups) {
      if (aabb(u.rect, p.rect)) {
        u.dead = true;
        this.collectPowerup(u.type);
      }
    }

    // Bandyci niszczą osłony, a po dotarciu do linii szeryfa — koniec gry
    if (this.formation) {
      for (const r of this.formation.aliveRects()) {
        for (const s of this.shields) s.eraseRect(r);
        if (r.y + r.h >= p.y) {
          this.endGame();
          return;
        }
      }
    }
  }

  // --- Zdarzenia rozgrywki ---------------------------------------------------

  addScore(base) {
    const points = scorePoints(base, this.difficultyKey);
    this.score += points;
    return points;
  }

  killEnemy(enemy, rect) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    this.addScore(enemyPoints(enemy.type));
    this.effects.burst(cx, cy, ENEMY_TYPES[enemy.type].color);
    this.audio.play('hit');
    const type = rollPowerup(this.difficulty.powerupChance);
    if (type) this.powerups.push(new PowerUp(type, cx, cy));
  }

  hitBoss() {
    const boss = this.boss;
    this.audio.play('hit');
    if (!boss.hit()) return;

    const cx = boss.x + boss.w / 2;
    const cy = boss.y + boss.h / 2;
    const points = this.addScore(bossReward(boss.number));
    this.effects.popup(`+${points}`, cx, cy - 20, { size: 28, color: '#ffd700', duration: 1.6 });
    for (let i = 0; i < 4; i++) {
      this.explosions.push(new Explosion(cx + (Math.random() - 0.5) * 70, cy + (Math.random() - 0.5) * 40, 45, 0.6 + i * 0.1));
    }
    this.effects.burst(cx, cy, '#c0392b', 30, 220);
    this.audio.play('explosion');
    // Boss zawsze zostawia „Złotą podkowę”; osłony zostają odnowione
    this.powerups.push(new PowerUp('super', cx, cy));
    this.shields = createShields();
    this.nextWave();
  }

  killVulture() {
    const v = this.vulture;
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;
    const points = this.addScore(vulturePoints());
    this.effects.popup(`+${points}`, cx, cy, { color: '#ffd700', size: 20 });
    this.effects.burst(cx, cy, '#1f1612', 14);
    this.audio.play('hit');
    if (Math.random() < VULTURE.superChance) this.powerups.push(new PowerUp('super', cx, cy));
    this.vulture = null;
  }

  hitPlayer() {
    const p = this.player;
    const result = p.hit();
    if (result === 'absorbed') {
      this.audio.play('absorb');
      this.effects.popup('GWIAZDA!', p.x + p.w / 2, p.y - 10, { size: 16, color: '#ffd700' });
    } else if (result === 'lost') {
      this.audio.play('lifeLost');
      this.effects.burst(p.x + p.w / 2, p.y + p.h / 2, '#e0ac69', 16);
    } else if (result === 'dead') {
      this.audio.play('lifeLost');
      this.effects.burst(p.x + p.w / 2, p.y + p.h / 2, '#e0ac69', 24);
      this.endGame();
    }
  }

  collectPowerup(type) {
    const p = this.player;
    const cx = p.x + p.w / 2;
    if (type === 'super') {
      const overflow = p.applyPowerup('super');
      if (overflow) {
        const points = this.addScore(POWERUPS.superOverflowPoints);
        this.effects.popup(`+${points}`, cx, p.y - 30, { color: '#ffd700' });
      }
      this.effects.popup('SUPER BONUS!', WIDTH / 2, HEIGHT / 2 - 40, { size: 44, color: '#ffd700', duration: 1.8, rise: 30 });
      this.audio.play('super');
      return;
    }
    p.applyPowerup(type);
    this.effects.popup(POWERUP_INFO[type].label, cx, p.y - 14, { size: 14 });
    this.audio.play('powerup');
  }

  // --- Rysowanie -------------------------------------------------------------

  draw(ctx) {
    drawBackground(ctx);

    if (this.state === STATE.MENU) {
      drawMenu(ctx, this);
      drawMuteIndicator(ctx, this.audio.muted);
      return;
    }

    for (const s of this.shields) s.draw(ctx);
    for (const u of this.powerups) u.draw(ctx);
    if (this.formation) this.formation.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    if (this.vulture) this.vulture.draw(ctx);
    for (const b of this.playerBullets) b.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);
    for (const d of this.dynamites) d.draw(ctx);
    if (this.state !== STATE.GAMEOVER || this.player.lives > 0) this.player.draw(ctx);
    for (const e of this.explosions) e.draw(ctx);
    this.effects.draw(ctx);

    drawHUD(ctx, this);
    if (this.boss && !this.boss.entering) drawBossBar(ctx, this.boss);
    if (this.bannerTimer > 0) drawBanner(ctx, this);

    if (this.state === STATE.PAUSED) drawPause(ctx);
    if (this.state === STATE.GAMEOVER) drawGameOver(ctx, this);
    drawMuteIndicator(ctx, this.audio.muted);
  }
}
