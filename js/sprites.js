// Pixel-art zapisany jako tablice znaków ('.' = przezroczysty piksel)
// oraz pomocnicze kształty rysowane kodem. Sprite'y są raz malowane
// do małych canvasów (cache), a potem kopiowane drawImage — szybko przy 60 FPS.

const SKIN = '#e0ac69';
const DARK = '#1a1a1a';

export const SPRITES = {
  sheriff: {
    palette: { H: '#6b4423', B: '#d4a017', S: SKIN, K: DARK, M: '#5a3a1a', W: '#f0e6d0', V: '#3d2b1f', G: '#ffd700', P: '#2e4a7a', D: '#3b2314' },
    frames: [[
      '....HHHHH....',
      '...HHHHHHH...',
      '...HBBBBBH...',
      'HHHHHHHHHHHHH',
      '...SSSSSSS...',
      '...SKSSSKS...',
      '...SSMMMSS...',
      '....SSSSS....',
      '..WVVVVVVVW..',
      '.WWVGVVVVVWW.',
      '.S.VVVVVVV.S.',
      '...PPPPPPP...',
      '...PPP.PPP...',
      '..DDD...DDD..',
    ]],
  },

  opryszek: {
    palette: { H: '#8b5a2b', S: '#d09a60', K: DARK, R: '#c0392b', C: '#4f6d3a', D: '#2b1a0f' },
    frames: [
      [
        '...HHHHH...',
        '..HHHHHHH..',
        'HHHHHHHHHHH',
        '..SKSSSKS..',
        '..RRRRRRR..',
        '.RRRRRRRRR.',
        'S.CCCCCCC.S',
        '..CCC.CCC..',
        '..DD...DD..',
      ],
      [
        '...HHHHH...',
        '..HHHHHHH..',
        'HHHHHHHHHHH',
        '..SKSSSKS..',
        '..RRRRRRR..',
        '.RRRRRRRRR.',
        '.SCCCCCCCS.',
        '..CCC.CCC..',
        '.DD.....DD.',
      ],
    ],
  },

  rewolwerowiec: {
    palette: { K: '#1b1b1b', S: SKIN, E: DARK, M: '#2b1a0f', P: '#2f8f83', G: '#b8bec4', D: '#2b1a0f' },
    frames: [
      [
        '....KKK....',
        '...KKKKK...',
        'KKKKKKKKKKK',
        '..SSSSSSS..',
        '..SESSSES..',
        '...SMMMS...',
        '.PPPPPPPPP.',
        'GPPPPPPPPPG',
        '..DD...DD..',
      ],
      [
        '....KKK....',
        '...KKKKK...',
        'KKKKKKKKKKK',
        '..SSSSSSS..',
        '..SESSSES..',
        '...SMMMS...',
        'GPPPPPPPPPG',
        '.PPPPPPPPP.',
        '.DD.....DD.',
      ],
    ],
  },

  herszt: {
    palette: { Y: '#e3b43b', O: '#c0392b', S: SKIN, K: DARK, M: '#3b2314', R: '#7b2d8b', D: '#2b1a0f' },
    frames: [
      [
        '....YYY....',
        '...YYYYY...',
        'YYYYYYYYYYY',
        '.OYOYOYOYO.',
        '..SSSSSSS..',
        '..SKSSSKS..',
        '..SMMMMMS..',
        '.RRRRRRRRR.',
        '..DD...DD..',
      ],
      [
        '....YYY....',
        '...YYYYY...',
        'YYYYYYYYYYY',
        '.OYOYOYOYO.',
        '..SSSSSSS..',
        '..SKSSSKS..',
        '..SMMMMMS..',
        'SRRRRRRRRRS',
        '.DD.....DD.',
      ],
    ],
  },
};

const cache = new Map();

function paintSprite(rows, palette, scale) {
  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;
  const g = canvas.getContext('2d');
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = palette[ch];
      g.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  return canvas;
}

// Rysuje klatkę sprite'a o nazwie `name` w punkcie (x, y)
export function drawSprite(ctx, name, frame, x, y, scale) {
  const key = `${name}:${frame}:${scale}`;
  let img = cache.get(key);
  if (!img) {
    const sprite = SPRITES[name];
    img = paintSprite(sprite.frames[frame % sprite.frames.length], sprite.palette, scale);
    cache.set(key, img);
  }
  ctx.drawImage(img, Math.round(x), Math.round(y));
}

// Gwiazda (szeryfa) — wielokąt o `points` ramionach
export function drawStar(ctx, cx, cy, r, color, points = 5) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

// Kapelusz kowbojski (ikona życia w HUD)
export function drawHat(ctx, x, y, color = '#8b5a2b', band = '#d4a017') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 9, 20, 3);        // rondo
  ctx.fillRect(x + 1, y + 8, 2, 1);
  ctx.fillRect(x + 17, y + 8, 2, 1);
  ctx.fillRect(x + 5, y + 2, 10, 7);    // główka
  ctx.fillRect(x + 7, y, 6, 2);
  ctx.fillStyle = band;
  ctx.fillRect(x + 5, y + 6, 10, 2);    // opaska
}
