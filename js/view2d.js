/* Vista 2D estilo dibujo animado: personajes dibujados por código, arena de combate y mazmorra vista desde arriba */
(function (G) {
'use strict';
const O = '#1b1226', TAU = Math.PI * 2;
const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'], HAIR = ['#3b2314', '#d4a017', '#1a1a1a', '#b5451b', '#e8e8e8'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* ---------- primitivas ---------- */
function path(g, fill, fn, lw) { g.beginPath(); fn(); if (fill) { g.fillStyle = fill; g.fill(); } g.lineWidth = lw || 3; g.strokeStyle = O; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
const ell = (g, x, y, rx, ry, f) => path(g, f, () => g.ellipse(x, y, rx, ry, 0, 0, TAU));
const rect = (g, x, y, w, h, r, f) => path(g, f, () => { if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); });
const poly = (g, pts, f) => path(g, f, () => { pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); });
function limb(g, x, y, len, w, ang, fill, extra) { g.save(); g.translate(x, y); g.rotate(ang); rect(g, -w / 2, 0, w, len, w / 2, fill); if (extra) { g.translate(0, len); extra(g); } g.restore(); }
const eyes = (g, hy, hr, col, big) => { [.28, .72].forEach(k => { ell(g, hr * k, hy + 1, big || 4.2, (big || 4.2) * 1.2, col || '#fff'); ell(g, hr * k + 1.2, hy + 1.5, (big || 4.2) * .5, (big || 4.2) * .6, '#111'); }); };
const swingAng = a => a < .2 ? -.9 - 1.7 * (a / .2) : a < .55 ? -2.6 + 2.4 * ((a - .2) / .35) : -.2 - .7 * ((a - .55) / .45);

/* ---------- armas (apuntan a lo largo del brazo, +y) ---------- */
function weapon(g, kind, col) {
  if (kind === '🪄') { rect(g, -2.5, -16, 5, 66, 2, '#8b5a2b'); ell(g, 0, 54, 9, 9, col || '#a78bfa'); ell(g, -2, 51, 3, 3, '#fff'); }
  else if (kind === '🏹') { path(g, null, () => g.arc(-4, 22, 26, -1.25, 1.25), 4); g.beginPath(); g.moveTo(-4 + Math.cos(-1.25) * 26, 22 + Math.sin(-1.25) * 26); g.lineTo(-4 + Math.cos(1.25) * 26, 22 + Math.sin(1.25) * 26); g.lineWidth = 1.5; g.stroke(); }
  else if (kind === '🔨') { rect(g, -3, -6, 6, 46, 2, '#8b5a2b'); rect(g, -15, 32, 30, 18, 3, '#9aa0a6'); }
  else if (kind === '🪓') { rect(g, -3, -6, 6, 50, 2, '#8b5a2b'); poly(g, [[3, 28], [24, 22], [24, 50], [3, 44]], '#c0c6cc'); }
  else { rect(g, -3.5, 4, 7, 40, 2, '#e5e7eb'); rect(g, -10, 0, 20, 6, 2, '#c9a227'); rect(g, -3, -10, 6, 10, 2, '#6b3f1d'); }
}
const dagger = (g, c) => { rect(g, -2.5, 2, 5, 22, 2, c || '#d0d4d8'); rect(g, -6, 0, 12, 4, 2, '#555'); };

/* ---------- bípedos ---------- */
function biped(g, p, o) {
  const w = p.walk, ph = Math.sin(p.t / 105) * w, H = o.legH || 26, bw = o.bw || 30, bh = o.bh || 34, hr = o.hr || 24;
  g.translate(0, -Math.abs(Math.sin(p.t / 105)) * 7 * w + Math.sin(p.t / 380) * 1.6 * (1 - w));
  const hy = -H - bh - hr + 8;
  if (o.pre) o.pre(g, hy, hr);
  limb(g, -bw / 2 + 3, -H - bh + 9, o.armL || 24, o.armW || 9, -ph * .9 + .12, o.armCol || o.skin);
  limb(g, -8, -H, H + 2, o.legW || 11, ph * .8, o.legCol); limb(g, 8, -H, H + 2, o.legW || 11, -ph * .8, o.legCol);
  rect(g, -bw / 2, -H - bh, bw, bh, 9, o.body); if (o.bodyX) o.bodyX(g, bw, bh, H);
  ell(g, 0, hy, hr, hr * .95, o.skin); if (o.head) o.head(g, hy, hr); else eyes(g, hy, hr);
  if (o.top) o.top(g, hy, hr);
  const ang = p.atk ? swingAng(p.atk) : -.9 + ph * .3 + Math.sin(p.t / 500) * .05;
  limb(g, bw / 2 - 4, -H - bh + 9, o.armL || 24, o.armW || 9, ang, o.armCol || o.skin, o.weapon);
}
const DRAW = {
  hero(g, p, look) {
    const sk = SKIN[(look.avatarIdx || 0) % 5], hair = HAIR[(look.avatarIdx || 0) % 5], col = look.color || '#a78bfa';
    biped(g, p, { skin: sk, body: col, legCol: '#2b2a3a', weapon: gg => weapon(gg, look.weapon, col), armCol: sk,
      pre: (gg, hy) => poly(gg, [[-14, -66], [-34, -22 + Math.sin(p.t / 250) * 3], [-12, -34]], col),
      head: (gg, hy, hr) => { gg.beginPath(); gg.arc(0, hy, hr + 1, Math.PI * 1.02, Math.PI * 2.0); gg.closePath(); gg.fillStyle = hair; gg.fill(); gg.lineWidth = 3; gg.strokeStyle = O; gg.stroke(); poly(gg, [[-hr, hy - 2], [-hr - 4, hy + 12], [-hr + 8, hy + 6]], hair); eyes(gg, hy + 4, hr); path(gg, null, () => gg.arc(hr * .5, hy + 14, 4, .2, Math.PI - .2), 2); } });
  },
  goblin(g, p) {
    const gr = '#6cc24a'; g.scale(.82, .82);
    biped(g, p, { skin: gr, body: '#8a5a2b', legCol: '#4d8a32', hr: 27, bw: 28, bh: 28, legH: 22, weapon: gg => dagger(gg),
      pre: (gg, hy, hr) => { poly(gg, [[-hr + 4, hy - 6], [-hr - 26, hy - 18], [-hr + 4, hy + 10]], gr); poly(gg, [[hr - 4, hy - 6], [hr + 26, hy - 18], [hr - 4, hy + 10]], gr); },
      head: (gg, hy, hr) => { eyes(gg, hy, hr, '#ffe14d', 5.5); poly(gg, [[hr * .5, hy + 4], [hr * .8, hy + 12], [hr * .3, hy + 12]], '#4d8a32'); path(gg, null, () => { gg.moveTo(hr * .2, hy + 15); gg.lineTo(hr * .9, hy + 15); }, 2); poly(gg, [[hr * .35, hy + 15], [hr * .45, hy + 21], [hr * .55, hy + 15]], '#fff'); } });
  },
  thief(g, p) {
    const cl = '#3a3d57';
    biped(g, p, { skin: '#d9b38c', body: cl, legCol: '#262839', weapon: gg => dagger(gg), armCol: cl,
      pre: (gg) => poly(gg, [[-13, -62], [-30, -20], [-8, -30]], '#2a2c42'),
      head: (gg, hy, hr) => { gg.beginPath(); gg.arc(0, hy - 2, hr + 3, Math.PI * .85, Math.PI * 2.15); gg.lineTo(hr * .2, hy + hr * .8); gg.closePath(); gg.fillStyle = cl; gg.fill(); gg.lineWidth = 3; gg.strokeStyle = O; gg.stroke(); rect(gg, -hr + 2, hy - 6, hr * 2 - 4, 13, 4, '#15131f'); eyes(gg, hy, hr, '#fff', 3.4); },
      top: (gg, hy, hr) => poly(gg, [[-6, hy - hr - 2], [4, hy - hr - 14], [12, hy - hr + 2]], cl) });
  },
  humanoid(g, p) {
    const rb = '#9b3d52';
    biped(g, p, { skin: '#e0b090', body: rb, legCol: '#4a3a2a', bw: 34, bh: 38, weapon: gg => { weapon(gg, '🪄', '#22d3ee'); },
      bodyX: (gg, bw, bh) => rect(gg, -bw / 2, -26, bw, 6, 2, '#f5c542'),
      head: (gg, hy, hr) => { eyes(gg, hy + 2, hr); poly(gg, [[-hr * .6, hy + 8], [0, hy + 34], [hr * .6, hy + 8], [0, hy + 14]], '#e8e8e8'); },
      top: (gg, hy, hr) => { poly(gg, [[-hr - 8, hy - hr * .55], [hr + 8, hy - hr * .55], [hr * .5, hy - hr * .7], [2, hy - hr - 34], [-hr * .5, hy - hr * .7]], '#5a3fa8'); ell(gg, 2, hy - hr - 8, 3, 3, '#f5c542'); } });
  },
  skeleton(g, p, look) {
    const b = '#efe9d6';
    biped(g, p, { skin: b, body: b, legCol: b, legW: 8, armW: 7, bw: 26, bh: 34, hr: 25, armCol: b,
      weapon: gg => { rect(gg, -3, 4, 6, 40, 2, '#9aa5b1'); rect(gg, -9, 0, 18, 5, 2, '#555'); },
      bodyX: (gg, bw, bh) => { for (let i = 0; i < 4; i++) { gg.beginPath(); gg.moveTo(-bw / 2 + 3, -bh - 26 + 8 + i * 7); gg.lineTo(bw / 2 - 3, -bh - 26 + 8 + i * 7); gg.lineWidth = 2.4; gg.strokeStyle = '#8f8a78'; gg.stroke(); } },
      head: (gg, hy, hr) => { [.3, .7].forEach(k => ell(gg, hr * k, hy + 1, 6, 7.5, '#18121f')); poly(gg, [[hr * .6, hy + 8], [hr * .8, hy + 14], [hr * .4, hy + 14]], '#18121f'); for (let i = 0; i < 4; i++) { gg.beginPath(); gg.moveTo(-hr * .35 + i * 7, hy + 17); gg.lineTo(-hr * .35 + i * 7, hy + 23); gg.lineWidth = 2; gg.stroke(); } },
      top: (gg, hy, hr) => { if (look && look.crown) { poly(gg, [[-14, hy - hr + 2], [-16, hy - hr - 16], [-7, hy - hr - 6], [0, hy - hr - 18], [7, hy - hr - 6], [16, hy - hr - 16], [14, hy - hr + 2]], '#f5c542'); } } });
    if (look && look.crown) { /* corona ya dibujada */ }
  },
  troll(g, p) {
    const sk = '#7fa070'; g.scale(1.3, 1.3);
    biped(g, p, { skin: sk, body: '#7fa070', legCol: '#5b7a50', legW: 16, armW: 14, armL: 32, bw: 46, bh: 44, hr: 25, legH: 24,
      bodyX: (gg, bw, bh, H) => { rect(gg, -bw / 2, -H - 12, bw, 12, 3, '#6b4a2b'); },
      weapon: gg => { rect(gg, -5, -8, 10, 46, 3, '#8b5a2b'); rect(gg, -11, 30, 22, 26, 8, '#9a6a3a'); },
      head: (gg, hy, hr) => { eyes(gg, hy, hr, '#ffd38a', 5); rect(gg, hr * .1, hy + 8, hr * .85, 11, 4, '#4d6847'); poly(gg, [[hr * .25, hy + 10], [hr * .35, hy + 2], [hr * .45, hy + 10]], '#fff'); poly(gg, [[hr * .65, hy + 10], [hr * .75, hy + 2], [hr * .85, hy + 10]], '#fff'); },
      top: (gg, hy, hr) => { [-1, 1].forEach(s => poly(gg, [[s * hr * .7, hy - hr * .6], [s * (hr + 6), hy - hr - 8], [s * (hr * .35), hy - hr * .75]], '#5b7a50')); } });
  },
  wolf(g, p) {
    const fur = '#8a8f98', dk = '#575b63', w = p.walk, ph = Math.sin(p.t / 90) * w;
    g.translate(0, Math.sin(p.t / 400) * 1.2 - Math.abs(ph) * 4);
    [[-22, 1], [26, -1], [-30, -1], [18, 1]].forEach(([x, s], i) => limb(g, x, -26, 28, 11, ph * .9 * (i % 2 ? -1 : 1), i < 2 ? fur : dk));
    path(g, fur, () => { g.moveTo(-34, -40); g.quadraticCurveTo(-62, -44 + Math.sin(p.t / 150) * 8, -64, -66); g.quadraticCurveTo(-48, -58, -30, -52); g.closePath(); });
    ell(g, 0, -42, 40, 20, fur); ell(g, 6, -32, 28, 10, '#d8dbe0');
    const open = Math.sin(p.atk * Math.PI) * 10; g.save(); g.translate(Math.sin(p.atk * Math.PI) * 10, 0);
    poly(g, [[36, -66], [38, -86], [48, -68]], dk); poly(g, [[48, -66], [54, -84], [60, -66]], dk);
    ell(g, 46, -54, 19, 16, fur); path(g, dk, () => { g.moveTo(52, -56 - open * .2); g.lineTo(78, -50 - open * .2); g.lineTo(52, -46); g.closePath(); }); ell(g, 77, -50 - open * .2, 4, 3.4, '#111');
    poly(g, [[56, -47], [60, -41 + open * .6], [64, -47]], '#fff'); ell(g, 50, -58, 4.6, 5, '#ffd23f'); ell(g, 51, -58, 2, 2.6, '#c1121f'); g.restore();
  },
  dragon(g, p, look) {
    const rd = '#d43b32', dk = '#8f221d', be = '#f1c265', w = p.walk, ph = Math.sin(p.t / 120) * w;
    g.translate(0, Math.sin(p.t / 420) * 3 - Math.abs(ph) * 5); const fl = Math.sin(p.t / 230) * .35 + p.atk * .5;
    [[-30, -1], [34, 1]].forEach(([x, s]) => limb(g, x, -34, 34, 16, ph * .5 * s, dk));
    path(g, rd, () => { g.moveTo(-50, -60); g.quadraticCurveTo(-110, -50, -128, -14 + Math.sin(p.t / 200) * 8); g.quadraticCurveTo(-90, -34, -44, -34); g.closePath(); }); poly(g, [[-128, -14 + Math.sin(p.t / 200) * 8], [-142, -22], [-134, -4]], dk);
    g.save(); g.translate(-6, -80); g.rotate(-.5 - fl); poly(g, [[0, 0], [-70, -60], [-30, -20], [-34, 10], [6, 8]], dk); g.restore();
    ell(g, 0, -56, 58, 34, rd); ell(g, 8, -44, 44, 18, be); for (let i = 0; i < 5; i++) poly(g, [[-36 + i * 18, -86 + Math.abs(i - 2) * 3], [-30 + i * 18, -102], [-24 + i * 18, -86 + Math.abs(i - 2) * 3]], dk);
    [[-8, -1], [48, 1]].forEach(([x, s]) => limb(g, x, -34, 34, 16, -ph * .5 * s, rd));
    path(g, rd, () => { g.moveTo(34, -66); g.quadraticCurveTo(60, -86, 62, -124); g.lineTo(80, -122); g.quadraticCurveTo(80, -80, 54, -50); g.closePath(); });
    g.save(); g.translate(0, Math.sin(p.atk * Math.PI) * 8); ell(g, 76, -128, 25, 18, rd); path(g, rd, () => { g.moveTo(88, -128); g.lineTo(116, -122 + Math.sin(p.atk * Math.PI) * 6); g.lineTo(90, -112); g.closePath(); });
    poly(g, [[60, -140], [56, -168], [72, -144]], '#efe6cc'); poly(g, [[76, -142], [78, -170], [88, -144]], '#efe6cc'); ell(g, 78, -132, 5.5, 6.5, '#ffe14d'); ell(g, 79.5, -132, 2.4, 4.4, '#111'); ell(g, 100, -126, 2.4, 2, '#111');
    if (p.atk > .25 && p.atk < .8) { for (let i = 0; i < 4; i++) ell(g, 128 + i * 16, -118 + Math.sin(p.t / 40 + i) * 4, 10 - i * 1.6, 7 - i, i % 2 ? '#ffb347' : '#ff6b3d'); } g.restore();
    g.save(); g.translate(-6, -80); g.rotate(-.9 + fl); poly(g, [[0, 0], [-74, -50], [-34, -14], [-38, 14], [6, 8]], rd); g.restore();
  }
};

/* ---------- sprites ilustrados opcionales: assets/sprites/<nombre>.png (PNG con fondo transparente, mirando a la derecha) ---------- */
const SPR = {}, SPRITE_FILES = { goblin: 'goblin', wolf: 'wolf', troll: 'troll', skeleton: 'skeleton', humanoid: 'mage', dragon: 'dragon', thief: 'thief',
  hero_warrior_f: 'hero_warrior_f', hero_warrior_m: 'hero_warrior_m', hero_mage_f: 'hero_mage_f', hero_mage_m: 'hero_mage_m', hero_archer_f: 'hero_archer_f', hero_archer_m: 'hero_archer_m', hero_cleric_f: 'hero_cleric_f', hero_cleric_m: 'hero_cleric_m', naga: 'naga', arachne: 'arachne', zombie: 'zombie' };
DRAW.naga = DRAW.dragon; DRAW.arachne = DRAW.thief; DRAW.zombie = DRAW.skeleton;
G.JQ_SPR = SPR;
const SPRITE_H = { naga: 150, arachne: 125, zombie: 125, goblin: 105, wolf: 100, troll: 150, skeleton: 125, humanoid: 130, dragon: 150, thief: 120, hero: 125 };   // altura en pantalla (unidades del personaje)
const FACE = { thief: -1 };   // sprites que en la imagen original miran a la izquierda
/* Si la imagen no es transparente (JPG con fondo negro), quita el fondo desde los bordes y recorta los márgenes */
function prepare(im) {
  const w = im.width, h = im.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
  let img; try { img = c.getImageData(0, 0, w, h); } catch (e) { return { cv: im, box: { x: 0, y: 0, w, h } }; }
  const d = img.data;
  // umbral adaptativo: se mide lo oscuro que es el fondo real (borde de la imagen) y se usa justo por encima
  const bs = []; for (let x = 0; x < w; x += 7) { bs.push(Math.max(d[x * 4], d[x * 4 + 1], d[x * 4 + 2])); const j = ((h - 1) * w + x) * 4; bs.push(Math.max(d[j], d[j + 1], d[j + 2])); }
  for (let y = 0; y < h; y += 7) { const a = y * w * 4, b = (y * w + w - 1) * 4; bs.push(Math.max(d[a], d[a + 1], d[a + 2])); bs.push(Math.max(d[b], d[b + 1], d[b + 2])); }
  bs.sort((a, b) => a - b); const T = Math.max(8, Math.min(24, bs[Math.floor(bs.length * .97)] + 3)), F = 9;
  if (d[3] > 250 && d[(w - 1) * 4 + 3] > 250) {   // fondo opaco: relleno desde los bordes sobre píxeles muy oscuros
    const bg = new Uint8Array(w * h), st = []; const dark = i => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) < T;
    const push = i => { if (!bg[i] && dark(i)) { bg[i] = 1; st.push(i); } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (st.length) { const i = st.pop(), x = i % w, y = (i / w) | 0; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < h - 1) push(i + w); }
    for (let i = 0; i < w * h; i++) {
      if (bg[i]) { d[i * 4 + 3] = 0; continue; }
      const x = i % w, y = (i / w) | 0, nb = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
      if (nb) { const m = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]); if (m < T + F) d[i * 4 + 3] = Math.max(0, Math.min(255, (m - T) / F * 255)); }
    }
    c.putImageData(img, 0, 0);
  }
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const box = x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w, h };
  // reducción suave por pasos (evita el aspecto granulado al encoger imágenes muy grandes)
  const k = Math.min(1, 460 / box.h), tw = Math.max(1, Math.round(box.w * k)), th = Math.max(1, Math.round(box.h * k));
  let cur = document.createElement('canvas'); cur.width = box.w; cur.height = box.h; cur.getContext('2d').drawImage(cv, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  while (cur.width / 2 > tw && cur.height / 2 > th) {
    const n = document.createElement('canvas'); n.width = Math.round(cur.width / 2); n.height = Math.round(cur.height / 2);
    const nc = n.getContext('2d'); nc.imageSmoothingQuality = 'high'; nc.drawImage(cur, 0, 0, n.width, n.height); cur = n;
  }
  const out = document.createElement('canvas'); out.width = tw; out.height = th; const oc = out.getContext('2d'); oc.imageSmoothingQuality = 'high'; oc.drawImage(cur, 0, 0, tw, th);
  return { cv: out, box: { x: 0, y: 0, w: tw, h: th } };
}
Object.keys(SPRITE_FILES).forEach(k => {
  const im = new Image(); let tried = 0; const exts = ['jpg', 'png'];
  im.onload = () => { const p = prepare(im); SPR[k] = { im: p.cv, box: p.box }; };
  im.onerror = () => { if (++tried < exts.length) im.src = 'assets/sprites/' + SPRITE_FILES[k] + '.' + exts[tried]; };
  im.src = 'assets/sprites/' + SPRITE_FILES[k] + '.' + exts[0];
});
const MAPIMG = { im: null }; { const im = new Image(); im.onload = () => { MAPIMG.im = im; }; im.src = 'assets/maps/maze.jpg'; }
function drawSprite(g, s, kind, pose, look) {
  const h = SPRITE_H[kind] || (kind.indexOf('hero') === 0 ? 128 : 120), w = s.box.w / s.box.h * h, wk = pose.walk;
  if (kind.indexOf('hero') === 0 && look && look.color) { g.shadowColor = look.color; g.shadowBlur = 26; }
  g.translate(0, -Math.abs(Math.sin(pose.t / 105)) * 9 * wk);
  const sq = Math.sin(pose.t / 330) * .03 * (1 - wk); g.scale(1 - sq, 1 + sq);
  g.rotate(Math.sin(pose.atk * Math.PI) * .32 + Math.sin(pose.t / 105) * .05 * wk); if (FACE[kind] === -1) g.scale(-1, 1);
  g.imageSmoothingQuality = 'high'; g.drawImage(s.im, s.box.x, s.box.y, s.box.w, s.box.h, -w / 2, -h, w, h);
}

/* dibuja un personaje. flip=-1 lo mira hacia la izquierda */
function drawChar(g, kind, look, pose, x, y, sc, flip) {
  g.save(); g.translate(x, y); g.scale(sc * (flip || 1), sc);
  if (pose.dead) { g.rotate(pose.dead * 1.45 * (flip || 1)); g.translate(0, pose.dead * 8); g.globalAlpha = 1 - pose.dead * .35; }
  if (pose.hit > 0) { g.translate(Math.sin(pose.t / 25) * 3 * pose.hit, 0); g.filter = `brightness(${1 + pose.hit * 1.4}) saturate(${1 + pose.hit * 3}) hue-rotate(-30deg)`; }
  g.scale(1 + pose.hit * .06, 1 - pose.hit * .08);
  const key = kind === 'hero' && look && look.hero ? 'hero_' + look.hero : kind;
  if (SPR[key]) drawSprite(g, SPR[key], key, pose, look); else (DRAW[kind] || DRAW.goblin)(g, pose, look || {}); g.restore();
}
const newPose = () => ({ t: 0, walk: 0, atk: 0, hit: 0, dead: 0 });

function tweens() { const l = []; return { add: (d, f) => new Promise(r => l.push({ t0: performance.now(), d, f, r })), step(n) { for (let i = l.length - 1; i >= 0; i--) { const t = l[i], k = Math.min(1, (n - t.t0) / t.d); t.f(k); if (k >= 1) { l.splice(i, 1); t.r(); } } }, clear() { l.length = 0; } }; }
class Sparks {
  constructor() { this.l = []; }
  burst(x, y, col, n, sp) { for (let i = 0; i < (n || 12); i++) { const a = Math.random() * TAU; this.l.push({ x, y, vx: Math.cos(a) * (sp || 160) * Math.random(), vy: Math.sin(a) * (sp || 160) * Math.random() - 80, life: 1, col, s: 3 + Math.random() * 4 }); } }
  step(dt) { for (let i = this.l.length - 1; i >= 0; i--) { const p = this.l[i]; p.life -= dt * 1.6; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; if (p.life <= 0) this.l.splice(i, 1); } }
  draw(g) { for (const p of this.l) { g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.col; g.save(); g.translate(p.x, p.y); g.rotate(p.life * 6); g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); g.restore(); } g.globalAlpha = 1; }
}

/* ---------- Arena de combate 2D ---------- */
const THEMES = { crypt: ['#2a1a46', '#523a82', '#3b2a5e'], forest: ['#12301f', '#2e7a4c', '#1c4d31'], catacomb: ['#3a2a12', '#8a5f2a', '#5b3f1a'], tower: ['#12263a', '#3a74b0', '#234a73'], fortress: ['#3a1218', '#a8333f', '#6e1f28'], abyss: ['#26123a', '#6a3fb0', '#43267a'], throne: ['#3a3012', '#b89a2a', '#7a6419'] };
class Stage2D {
  constructor(canvas, look, kind, boss, theme) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.look = look; this.kind = kind; this.boss = boss; this.th = THEMES[theme] || THEMES.crypt; this.tw = tweens(); this.sp = new Sparks();
    this.P = { hero: newPose(), foe: newPose() }; this.ox = { hero: 0, foe: 0 }; this.oy = { hero: 0, foe: 0 }; this.cheerOn = null; this.last = 0; requestAnimationFrame(this.loop = this.loop.bind(this));
  }
  async attack(s) { const d = s === 'hero' ? 1 : -1, p = this.P[s], W = this.c.width; await this.tw.add(420, k => { this.ox[s] = d * Math.sin(Math.min(1, k * 1.15) * Math.PI) * W * .2; p.atk = k; }); this.ox[s] = 0; p.atk = 0; }
  async hurt(s) { const p = this.P[s], d = s === 'hero' ? -1 : 1; this.sp.burst(this.pos(s), this.c.height * .6, s === 'hero' ? '#f87171' : '#ffe14d', 16, 200); await this.tw.add(400, k => { p.hit = 1 - k; this.ox[s] = d * Math.sin(k * Math.PI) * 16; }); p.hit = 0; this.ox[s] = 0; }
  die(s) { const p = this.P[s]; this.sp.burst(this.pos(s), this.c.height * .7, '#d6d3e8', 14, 150); this.tw.add(700, k => { p.dead = easeIO(k); }); }
  revive(s) { this.P[s].dead = 0; }
  cheer(s) { this.cheerOn = s; } stopCheer() { this.cheerOn = null; this.oy.hero = this.oy.foe = 0; }
  pos(s) { return this.c.width * (s === 'hero' ? .27 : .73) + this.ox[s]; }
  loop(now) {
    if (!this.c.isConnected) return;
    const c = this.c, w = c.clientWidth || 520, h = c.clientHeight || 270; if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const g = this.g, W = c.width, H = c.height, dt = Math.min(.05, (now - this.last) / 1000 || .016); this.last = now; this.tw.step(now); this.sp.step(dt);
    for (const s of ['hero', 'foe']) this.P[s].t = now; if (this.cheerOn) { this.oy[this.cheerOn] = -Math.abs(Math.sin(now / 200)) * H * .1; if (Math.random() < .12) this.sp.burst(this.pos(this.cheerOn), H * .4, ['#fbbf24', '#f472b6', '#60a5fa', '#4ade80'][Math.random() * 4 | 0], 4, 120); }
    // fondo
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, this.th[0]); gr.addColorStop(.7, this.th[1]); gr.addColorStop(1, this.th[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 6; i++) { const x = (i * 0.2 + .05) * W; g.beginPath(); g.moveTo(x - 60, H * .66); g.lineTo(x, H * .2 + (i % 3) * 22); g.lineTo(x + 60, H * .66); g.fill(); }
    const gy = H * .8; g.fillStyle = this.th[2]; g.fillRect(0, gy, W, H - gy); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < W; x += 46) g.fillRect(x, gy, 23, H - gy);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, gy, W, 3);
    [W * .06, W * .94].forEach((tx, i) => { g.fillStyle = '#4a3320'; g.fillRect(tx - 3, gy - 70, 6, 70); const f = 10 + Math.sin(now / 80 + i) * 3; g.fillStyle = '#ff9f43'; g.beginPath(); g.ellipse(tx, gy - 78, 7, f, 0, 0, TAU); g.fill(); g.fillStyle = '#ffe14d'; g.beginPath(); g.ellipse(tx, gy - 76, 3.5, f * .55, 0, 0, TAU); g.fill(); });
    const sc = H / 235, fsc = sc * (this.kind === 'dragon' ? 1.05 : this.boss ? 1.18 : 1);
    for (const s of ['hero', 'foe']) { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(this.pos(s), gy + 4, (s === 'foe' && this.kind === 'dragon' ? 90 : 40) * sc, 9 * sc, 0, 0, TAU); g.fill(); }
    drawChar(g, this.kind, { crown: this.boss && this.kind === 'skeleton' }, this.P.foe, this.pos('foe'), gy + this.oy.foe, fsc, -1);
    drawChar(g, 'hero', this.look, this.P.hero, this.pos('hero'), gy + this.oy.hero, sc, 1);
    this.sp.draw(g); requestAnimationFrame(this.loop);
  }
}

/* ---------- Mazmorra 2D vista desde arriba ---------- */
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
class Dungeon2D {
  constructor(canvas, cfg, look) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.look = look || {}; this.tw = tweens(); this.sp = new Sparks();
    const host = canvas.parentElement; this.hud = document.createElement('div'); this.hud.className = 'hud3d'; this.hud.innerHTML = '<div class="hp"></div><div class="msg"></div>'; host.appendChild(this.hud);
    this.load(cfg); this.last = 0; requestAnimationFrame(this.loop = this.loop.bind(this));
  }
  load(cfg) {
    this.cfg = cfg; this.tw.clear(); this.queueId = (this.queueId || 0) + 1; this.grid = cfg.map.map(r => r.split('')); this.enemies = []; this.items = []; let start = { x: 1, y: 1 };
    this.grid.forEach((row, y) => row.forEach((ch, x) => {
      if (ch === 'S') { start = { x, y }; row[x] = '.'; }
      else if (ch === 'E') { const hp = cfg.enemyHp || 2; this.enemies.push({ x, y, hp, max: hp, alive: true, pose: newPose() }); row[x] = '.'; }
      else if (ch === 'T') { this.items.push({ k: 'T', x, y, s: 1 }); row[x] = '.'; }
      else if (ch === 'X') { this.items.push({ k: 'X', x, y, s: 1 }); row[x] = '.'; }
    }));
    this.dir = Math.max(0, ['E', 'S', 'O', 'N'].indexOf(cfg.dir || 'E')); this.px = start.x + .5; this.py = start.y + .5; this.hero = newPose(); this.hp = cfg.hp || 30; this.maxHp = this.hp; this.msg = ''; this.shake = 0; this.glow = 0; this.doorOpen = {}; this.flip = this.dir === 2 ? -1 : 1;
  }
  reset() { this.load(this.cfg); }
  async play(events, speed) {
    this.reset(); const id = this.queueId, sp = speed || 1, alive = () => this.queueId === id && this.c.isConnected, tw = (d, f) => this.tw.add(d / sp, f), a = this.hero;
    for (const e of events) {
      if (!alive()) return false;
      if (e.t === 'move') { const x0 = this.px, y0 = this.py; a.walk = 1; await tw(420, k => { this.px = x0 + (e.x + .5 - x0) * easeIO(k); this.py = y0 + (e.y + .5 - y0) * easeIO(k); }); a.walk = 0; }
      else if (e.t === 'turn') { this.dir = e.dir; if (e.dir === 0) this.flip = 1; if (e.dir === 2) this.flip = -1; await sleep(220 / sp); }
      else if (e.t === 'bump') { const x0 = this.px, y0 = this.py, d = this.dir; this.msg = '¡Pum! Choque'; a.walk = 1; await tw(280, k => { const o = Math.sin(k * Math.PI) * .2; this.px = x0 + DX[d] * o; this.py = y0 + DY[d] * o; }); a.walk = 0; this.msg = ''; this.shake = 6; }
      else if (e.t === 'attack') {
        const en = e.hit && this.enemies.find(s => s.alive && s.x === e.x && s.y === e.y); const sw = tw(420, k => { a.atk = k; }); await sleep(200 / sp);
        if (en) { en.hp--; this.sp.burst(...this.scr(en.x + .5, en.y + .4), '#ffe14d', 14, 170); tw(380, k => { en.pose.hit = 1 - k; }); if (e.killed) { en.alive = false; tw(700, k => { en.pose.dead = easeIO(k); }); this.msg = '¡Enemigo derrotado!'; } else this.msg = '¡Golpe!'; } else this.msg = 'Golpe al aire';
        await sw; a.atk = 0; this.msg = '';
      }
      else if (e.t === 'open') { this.msg = '¡Puerta abierta!'; await tw(450, k => { this.doorOpen[e.x + ',' + e.y] = k; }); this.grid[e.y][e.x] = '.'; this.msg = ''; }
      else if (e.t === 'pickup') { const it = this.items.find(i => i.k === 'T' && i.x === e.x && i.y === e.y); this.msg = '¡Tesoro! 💰'; this.sp.burst(...this.scr(this.px, this.py), '#fbbf24', 22, 190); if (it) await tw(450, k => { it.s = 1 - k; }); this.msg = ''; }
      else if (e.t === 'hurt') { this.hp = e.hp; this.shake = 7; this.msg = `-${e.dmg} de vida`; this.sp.burst(...this.scr(this.px, this.py), '#f87171', 12, 170); await tw(380, k => { a.hit = 1 - k; }); a.hit = 0; this.msg = ''; }
      else if (e.t === 'exit') { this.glow = 1; this.msg = '¡Salida alcanzada!'; this.sp.burst(...this.scr(this.px, this.py), '#4ade80', 28, 210); await sleep(700 / sp); }
      else if (e.t === 'text') { this.msg = e.text; await sleep(600 / sp); this.msg = ''; }
      await sleep(60 / sp);
    }
    return alive();
  }
  scr(x, y) { return [this.ox + x * this.ts, this.oy + y * this.ts]; }
  loop(now) {
    if (!this.c.isConnected) { this.hud.remove(); return; }
    const c = this.c, g = this.g, w = c.clientWidth || 520, h = c.clientHeight || 320; if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const rows = this.grid.length, cols = this.grid[0].length, W = c.width, H = c.height; this.ts = Math.min(Math.floor(W / (cols + .4)), Math.floor(H / (rows + .4)), 84);
    const ts = this.ts; this.ox = Math.round((W - cols * ts) / 2); this.oy = Math.round((H - rows * ts) / 2);
    const dt = Math.min(.05, (now - this.last) / 1000 || .016); this.last = now; this.tw.step(now); this.sp.step(dt); this.shake = Math.max(0, this.shake - .4); this.glow = Math.max(0, this.glow - .004);
    this.hero.t = now; this.enemies.forEach(e => { e.pose.t = now; });
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1d44'); gr.addColorStop(1, '#1a1230'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    
    g.save(); if (this.shake) g.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    const isW = (x, y) => !this.grid[y] || this.grid[y][x] === undefined || this.grid[y][x] === '#';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = this.ox + x * ts, py = this.oy + y * ts, ch = this.grid[y][x];
      if (ch === '#') {
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a, b]) => !isW(x + a, y + b)); if (!near) continue;
        g.fillStyle = '#8f7cbb'; g.fillRect(px, py, ts, ts); g.fillStyle = '#a896d0'; g.fillRect(px, py, ts, ts * .55); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px, py + ts * .55, ts, ts * .45);
        g.strokeStyle = '#3b2f55'; g.lineWidth = 2; g.strokeRect(px + 1, py + 1, ts - 2, ts - 2); g.beginPath(); g.moveTo(px, py + ts * .55); g.lineTo(px + ts, py + ts * .55); g.moveTo(px + ts * .5, py); g.lineTo(px + ts * .5, py + ts * .55); g.stroke();
        if ((x * 7 + y * 13) % 5 === 0) { const f = 6 + Math.sin(now / 80 + x) * 2; g.fillStyle = '#ff9f43'; g.beginPath(); g.ellipse(px + ts / 2, py + ts * .3, ts * .1, f * ts / 40, 0, 0, TAU); g.fill(); g.fillStyle = '#ffe14d'; g.beginPath(); g.ellipse(px + ts / 2, py + ts * .33, ts * .05, f * ts / 80, 0, 0, TAU); g.fill(); }
      } else {
        g.fillStyle = (x + y) % 2 ? '#56438f' : '#614ea0'; g.fillRect(px, py, ts, ts); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.5; g.strokeRect(px + .5, py + .5, ts - 1, ts - 1);
        if (ch === 'D') { const k = this.doorOpen[x + ',' + y] || 0; g.fillStyle = '#b07a3a'; g.fillRect(px + 3, py + 3, ts - 6, (ts - 6) * (1 - k)); g.strokeStyle = O; g.lineWidth = 3; g.strokeRect(px + 3, py + 3, ts - 6, (ts - 6) * (1 - k)); g.fillStyle = '#f5c542'; g.beginPath(); g.arc(px + ts * .72, py + ts * .5, 4, 0, TAU); g.fill(); }
      }
    }
    // objetos y personajes ordenados por profundidad
    const list = []; this.items.forEach(i => { if (i.s > 0.02) list.push({ y: i.y + .5, d: () => this.drawItem(g, i, now) }); }); this.enemies.forEach(e => list.push({ y: e.y + .5, d: () => this.drawEnemy(g, e) }));
    list.push({ y: this.py, d: () => { const [sx, sy] = this.scr(this.px, this.py); const ang = this.dir * Math.PI / 2; g.save(); g.translate(sx, sy); g.rotate(ang); g.fillStyle = this.look.color || '#a78bfa'; g.globalAlpha = .55; g.beginPath(); g.moveTo(ts * .55, 0); g.lineTo(ts * .3, -ts * .14); g.lineTo(ts * .3, ts * .14); g.fill(); g.restore(); g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + ts * .16, ts * .28, ts * .09, 0, 0, TAU); g.fill(); drawChar(g, 'hero', this.look, this.hero, sx, sy + ts * .2, ts / 78, this.flip); } });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d()); this.sp.draw(g); g.restore();
    if (this.glow > 0) { g.fillStyle = `rgba(74,222,128,${this.glow * .3})`; g.fillRect(0, 0, W, H); }
    this.hud.querySelector('.hp').textContent = `❤️ ${this.hp}/${this.maxHp}   🧭 ${'ESON'[this.dir]}`; this.hud.querySelector('.msg').textContent = this.msg;
    requestAnimationFrame(this.loop);
  }
  drawEnemy(g, e) {
    const ts = this.ts, [sx, sy] = this.scr(e.x + .5, e.y + .5), kind = this.cfg.enemyType || 'goblin', flip = this.px < e.x + .5 ? -1 : 1;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(sx, sy + ts * .16, ts * .28, ts * .09, 0, 0, TAU); g.fill();
    drawChar(g, kind, {}, e.pose, sx, sy + ts * .2, ts / 78, flip);
    if (e.alive) { g.fillStyle = '#000a'; g.fillRect(sx - ts * .3, sy - ts * .95, ts * .6, 5); g.fillStyle = '#f87171'; g.fillRect(sx - ts * .3, sy - ts * .95, ts * .6 * Math.max(0, e.hp) / e.max, 5); }
  }
  drawItem(g, i, now) {
    const ts = this.ts, [sx, sy] = this.scr(i.x + .5, i.y + .5);
    if (i.k === 'T') { g.save(); g.translate(sx, sy + ts * .08); g.scale(i.s, i.s); rect(g, -ts * .24, -ts * .1, ts * .48, ts * .3, 4, '#a0622a'); rect(g, -ts * .26, -ts * .22, ts * .52, ts * .16, 5, '#f5c542'); ell(g, 0, 0, 3, 3.5, '#f5c542'); g.restore(); }
    else { g.save(); g.translate(sx, sy); g.shadowColor = '#4ade80'; g.shadowBlur = 20; for (let k = 0; k < 3; k++) { g.strokeStyle = ['#4ade80', '#86efac', '#16a34a'][k]; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, ts * (.32 - k * .08), ts * (.32 - k * .08) * .75, now / 500 * (k % 2 ? -1 : 1), 0, TAU * .8); g.stroke(); } g.restore(); }
  }
}
G.Stage2D = Stage2D; G.Dungeon2D = Dungeon2D; G.drawChar2D = drawChar; G.newPose2D = newPose;
})(window);
