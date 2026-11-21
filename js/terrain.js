/* Terrenos 3D por mundo: suelo, decorado y ambiente (cripta, bosque, catacumbas, torre, fortaleza) */
(function (G) {
'use strict';
const T = G.THREE; if (!T) return;
const TAU = Math.PI * 2;
function rng(seed) { let s = seed || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function tex(cv, rep) { const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; if (rep) t.repeat.set(rep, rep); return t; }
function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n || 256; return c; }
const rgb = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;

/* ---- texturas ---- */
function stone(base, rows, moss, seed) {
  const cv = canvas(), g = cv.getContext('2d'), rnd = rng(seed), n = parseInt(base.slice(1), 16), R = n >> 16, Gc = (n >> 8) & 255, B = n & 255, sh = l => rgb(R + l, Gc + l, B + l);
  g.fillStyle = '#12110d'; g.fillRect(0, 0, 256, 256); const h = 256 / rows;
  for (let r = 0; r < rows; r++) { let x = -(r % 2) * 40; while (x < 256) { const w = 70 + rnd() * 60; g.fillStyle = sh((rnd() - .5) * 22); g.fillRect(x + 3, r * h + 3, w - 5, h - 5); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 3, r * h + 3, w - 5, 4); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 3, r * h + h - 8, w - 5, 5); x += w; } }
  for (let i = 0; i < 1100; i++) { g.fillStyle = rgb(rnd() < .5 ? 0 : 255, rnd() < .5 ? 0 : 255, 230, rnd() * .09); g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  for (let i = 0; i < 26; i++) { g.strokeStyle = rgb(0, 0, 0, .2 + rnd() * .2); g.beginPath(); let cx = rnd() * 256, cy = rnd() * 256; g.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += (rnd() - .5) * 26; cy += rnd() * 16; g.lineTo(cx, cy); } g.stroke(); }
  if (moss) for (let i = 0; i < 16; i++) { g.fillStyle = rgb(70 + rnd() * 30, 105 + rnd() * 40, 50, .2 + rnd() * .25); g.beginPath(); g.ellipse(rnd() * 256, 190 + rnd() * 66, 14 + rnd() * 34, 6 + rnd() * 12, 0, 0, TAU); g.fill(); }
  return tex(cv);
}
function grass(seed) {
  const cv = canvas(), g = cv.getContext('2d'), rnd = rng(seed || 3); g.fillStyle = '#3f7d3b'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9; i++) { g.fillStyle = rgb(88 + rnd() * 30, 140 + rnd() * 30, 60, .35); g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 30 + rnd() * 40, 20 + rnd() * 30, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 3; i++) { g.fillStyle = rgb(110, 88, 56, .5); g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 14 + rnd() * 22, 8 + rnd() * 12, rnd() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 1500; i++) { const x = rnd() * 256, y = rnd() * 256, l = 5 + rnd() * 8; g.strokeStyle = rgb(40 + rnd() * 60, 110 + rnd() * 80, 40 + rnd() * 30, .7); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 4, y - l); g.stroke(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = ['#ffe14d', '#ffffff', '#f472b6'][i % 3]; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 1.8, 0, TAU); g.fill(); }
  return tex(cv);
}
function sand(seed) {
  const cv = canvas(), g = cv.getContext('2d'), rnd = rng(seed || 5); g.fillStyle = '#a58b60'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 10; i++) { g.fillStyle = rgb(130 + rnd() * 40, 105 + rnd() * 30, 70, .3); g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 30 + rnd() * 40, 14 + rnd() * 20, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 1800; i++) { g.fillStyle = rgb(rnd() < .5 ? 60 : 230, rnd() < .5 ? 45 : 215, 150, rnd() * .12); g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  for (let i = 0; i < 18; i++) { g.strokeStyle = rgb(60, 45, 25, .35); g.beginPath(); let cx = rnd() * 256, cy = rnd() * 256; g.moveTo(cx, cy); for (let k = 0; k < 5; k++) { cx += (rnd() - .5) * 30; cy += (rnd() - .5) * 30; g.lineTo(cx, cy); } g.stroke(); }
  for (let i = 0; i < 18; i++) { g.fillStyle = rgb(110, 100, 85, .8); g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 3 + rnd() * 4, 2 + rnd() * 3, rnd() * 3, 0, TAU); g.fill(); }
  return tex(cv);
}
function marble(seed) {
  const cv = canvas(), g = cv.getContext('2d'), rnd = rng(seed || 9);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#8fa6cf' : '#c7d5ee'; g.fillRect(x * 128, y * 128, 128, 128); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = rgb(255, 255, 255, .25 + rnd() * .3); g.lineWidth = .8 + rnd(); g.beginPath(); let cx = rnd() * 256, cy = rnd() * 256; g.moveTo(cx, cy); for (let k = 0; k < 5; k++) { cx += (rnd() - .5) * 60; cy += (rnd() - .5) * 60; g.lineTo(cx, cy); } g.stroke(); }
  g.strokeStyle = rgb(30, 50, 90, .6); g.lineWidth = 3; g.strokeRect(1, 1, 254, 254); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  return tex(cv);
}
function lavaBrick(seed) {
  const cv = canvas(), g = cv.getContext('2d'), rnd = rng(seed || 13); g.fillStyle = '#ff5a1f'; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) { let x = -(r % 2) * 40; while (x < 256) { const w = 70 + rnd() * 50; g.fillStyle = rgb(60 + rnd() * 18, 22 + rnd() * 8, 26 + rnd() * 8); g.fillRect(x + 4, r * 64 + 4, w - 7, 56); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 4, r * 64 + 4, w - 7, 4); x += w; } }
  for (let i = 0; i < 900; i++) { g.fillStyle = rgb(0, 0, 0, rnd() * .12); g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  return tex(cv);
}

/* ---- construcción de elementos del decorado ---- */
const std = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, flatShading: true }, o || {}));
function add(p, m, x, y, z) { m.position.set(x, y, z); p.add(m); return m; }
function mesh(geo, mat) { return new T.Mesh(geo, mat); }
const M = {
  tree(s) { const g = new T.Group(); add(g, mesh(new T.CylinderGeometry(.12 * s, .17 * s, 1 * s, 6), std('#6b4423')), 0, .5 * s, 0); [[1.05, .75], [1.6, .6], [2.05, .42]].forEach(([y, r], i) => add(g, mesh(new T.ConeGeometry(r * s, 1.1 * s, 7), std(['#2f7a3a', '#3a8f45', '#46a352'][i])), 0, y * s + .2, 0)); return g; },
  pillar(h, c) { const g = new T.Group(); add(g, mesh(new T.CylinderGeometry(.3, .36, h, 8), std(c || '#6d6a72')), 0, h / 2, 0); add(g, mesh(new T.BoxGeometry(.8, .16, .8), std('#55525b')), 0, h + .08, 0); add(g, mesh(new T.BoxGeometry(.8, .16, .8), std('#55525b')), 0, .08, 0); return g; },
  torch() { const g = new T.Group(); add(g, mesh(new T.CylinderGeometry(.04, .05, .7, 5), std('#4a3320')), 0, .35, 0); const f = add(g, mesh(new T.ConeGeometry(.12, .34, 6), new T.MeshBasicMaterial({ color: '#ff9f43' })), 0, .86, 0); g.userData.flame = f; return g; },
  bones(r) { const g = new T.Group(); for (let i = 0; i < 6; i++) { const b = add(g, mesh(new T.CylinderGeometry(.03, .03, .3 + r() * .2, 5), std('#e8e0c8')), (r() - .5) * .7, .04, (r() - .5) * .7); b.rotation.z = r() * 3; b.rotation.y = r() * 3; add(g, mesh(new T.SphereGeometry(.05, 6, 5), std('#e8e0c8')), b.position.x + .15, .05, b.position.z); } const sk = add(g, mesh(new T.SphereGeometry(.16, 8, 6), std('#efe8d2')), .1, .16, .1); [-1, 1].forEach(s => add(sk, mesh(new T.SphereGeometry(.035, 5, 4), std('#111')), s * .06, .02, .13)); return g; },
  barrel() { const g = new T.Group(); add(g, mesh(new T.CylinderGeometry(.3, .27, .7, 10), std('#7a4e24')), 0, .35, 0); [.18, .52].forEach(y => add(g, mesh(new T.CylinderGeometry(.32, .32, .05, 10), std('#3a3a3a')), 0, y, 0)); return g; },
  crate() { const g = new T.Group(); add(g, mesh(new T.BoxGeometry(.6, .6, .6), std('#8a5a2c')), 0, .3, 0); add(g, mesh(new T.BoxGeometry(.64, .08, .64), std('#5b3a1a')), 0, .6, 0); return g; },
  column(h) { const g = new T.Group(); add(g, mesh(new T.CylinderGeometry(.28, .3, h, 14), std('#dbe6ff', { roughness: .4 })), 0, h / 2, 0); add(g, mesh(new T.BoxGeometry(.8, .18, .8), std('#b9c8e8')), 0, h + .09, 0); add(g, mesh(new T.BoxGeometry(.8, .18, .8), std('#b9c8e8')), 0, .09, 0); return g; },
  orb(c) { const g = new T.Group(); const o = add(g, mesh(new T.SphereGeometry(.22, 12, 10), new T.MeshBasicMaterial({ color: c || '#7dd3fc' })), 0, 2.0, 0); g.userData.bob = o; return g; },
  banner(c) { const g = new T.Group(); add(g, mesh(new T.CylinderGeometry(.04, .04, 3.4, 5), std('#2a2a2a')), 0, 1.7, 0); const b = add(g, mesh(new T.PlaneGeometry(.9, 2.2), new T.MeshStandardMaterial({ color: c || '#8f1f2b', side: T.DoubleSide, roughness: .8 })), .46, 2.1, 0); add(g, mesh(new T.BoxGeometry(.96, .08, .05), std('#c9a227')), .46, 3.2, 0); return g; },
  spike() { const g = new T.Group(); add(g, mesh(new T.ConeGeometry(.16, 1.1, 5), std('#2f2f35')), 0, .55, 0); return g; },
  rock(r) { const m = mesh(new T.DodecahedronGeometry(.35 + r() * .4, 0), std('#6c6f75')); m.position.y = .2; return m; }
};

const THEMES = {
  crypt: { ground: () => new T.MeshStandardMaterial({ map: stone('#4a4560', 3, true, 17), roughness: 1 }), rep: 3, ambient: ['#9a90d8', .85], dir: ['#e6d8ff', .9], fog: ['#120d1c', 7, 17], point: ['#ff9f43', .9], sky: null },
  forest: { ground: () => new T.MeshStandardMaterial({ map: grass(3), roughness: 1 }), rep: 5, ambient: ['#bfe8c0', 1.0], dir: ['#fff1c9', 1.2], fog: ['#0f2a1a', 8, 18], point: ['#ffd27a', .35] },
  catacomb: { ground: () => new T.MeshStandardMaterial({ map: sand(5), roughness: 1 }), rep: 4, ambient: ['#c9a574', .85], dir: ['#ffd9a0', .85], fog: ['#1a1209', 7, 16], point: ['#ff9d4d', 1.0] },
  tower: { ground: () => new T.MeshStandardMaterial({ map: marble(9), roughness: .45, metalness: .1 }), rep: 3, ambient: ['#c6dcff', 1.0], dir: ['#ffffff', 1.1], fog: ['#0b1526', 9, 20], point: ['#7dd3fc', .6] },
  fortress: { ground: () => new T.MeshStandardMaterial({ map: lavaBrick(13), roughness: .9, emissive: '#661a08', emissiveIntensity: .35 }), rep: 3, ambient: ['#ff9a8a', .8], dir: ['#ffb08a', .9], fog: ['#1a0709', 7, 16], point: ['#ff5a2a', 1.3] }
};
THEMES.abyss = THEMES.crypt; THEMES.throne = THEMES.fortress;

const Terrain = {
  palette(theme) { return THEMES[theme] || THEMES.crypt; },
  ground(theme) { const t = Terrain.palette(theme), m = t.ground(); if (m.map) m.map.repeat.set(t.rep, t.rep); return m; },
  /* decorado alrededor de la arena (devuelve una función update(now)) */
  scenery(theme, scene) {
    const r = rng(41), anim = [], place = (obj, x, z, ry) => { obj.position.set(x, 0, z); obj.rotation.y = ry || 0; scene.add(obj); return obj; };
    const ring = (n, rmin, rmax, fn) => { for (let i = 0; i < n; i++) { const a = (-70 + 140 * (i + r() * .6) / n) * Math.PI / 180, d = rmin + r() * (rmax - rmin); fn(Math.cos(a) * d + 1, Math.sin(a) * d, i); } };
    const side = fn => { [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) fn(-3 + i * 2.2 + r(), s * (4.2 + r() * 1.5), i); }); };
    if (theme === 'forest') {
      ring(16, 5.2, 9.5, (x, z) => place(M.tree(.8 + r() * .8), x, z)); side((x, z) => place(M.tree(.9 + r() * .7), x, z));
      for (let i = 0; i < 8; i++) place(M.rock(r), 1 + r() * 4, (r() - .5) * 7);
    } else if (theme === 'catacomb') {
      ring(7, 5, 8, (x, z, i) => { place(M.pillar(2.4 + r(), '#7a6a50'), x, z); });
      for (let i = 0; i < 9; i++) place(M.bones(r), -2 + r() * 7, (r() - .5) * 7);
      [[3.8, 2.6], [4.4, -2], [-2.8, -3.3], [-2.2, 3.4]].forEach(([x, z], i) => place(i % 2 ? M.crate() : M.barrel(), x, z));
    } else if (theme === 'tower') {
      ring(8, 5, 8, (x, z) => place(M.column(2.8 + r()), x, z)); side((x, z) => { if (r() < .6) place(M.column(2.2), x, z); });
      for (let i = 0; i < 5; i++) { const o = place(M.orb(i % 2 ? '#7dd3fc' : '#c4b5fd'), 2 + r() * 5, (r() - .5) * 8); anim.push(t => { o.userData.bob.position.y = 1.7 + Math.sin(t / 700 + i) * .25; }); }
    } else if (theme === 'fortress') {
      ring(7, 5, 8, (x, z) => place(M.banner(r() < .5 ? '#8f1f2b' : '#5a1220'), x, z, Math.PI / 2 - Math.atan2(z, x - 1)));
      ring(9, 4.6, 6.5, (x, z) => place(M.spike(), x, z));
      ring(3, 5.5, 7, (x, z) => { const t = place(M.torch(), x, z); anim.push(tm => { t.userData.flame.scale.setScalar(.9 + Math.sin(tm / 80 + x) * .2); }); });
    } else {   // cripta
      ring(8, 5, 8.5, (x, z) => place(M.pillar(2.6 + r() * .8), x, z));
      ring(4, 4.4, 5.6, (x, z) => { const t = place(M.torch(), x, z); anim.push(tm => { t.userData.flame.scale.setScalar(.9 + Math.sin(tm / 80 + x) * .2); }); });
      for (let i = 0; i < 6; i++) place(M.bones(r), -2 + r() * 6, (r() - .5) * 7);
    }
    return now => anim.forEach(f => f(now));
  },
  /* materiales del tablero de exploración por tema */
  dungeon(theme) {
    const sets = {
      crypt: { side: '#474c46', cap: '#6d6f62', floor: () => stone('#4a4338', 3, true, 23), ceil: '#2f2e2a' },
      forest: { side: '#2f6b34', cap: '#3f8a45', floor: () => grass(3), ceil: '#1d3a22', hedge: true },
      catacomb: { side: '#7d6c4c', cap: '#947f58', floor: () => sand(5), ceil: '#3a2f20' },
      tower: { side: '#8da1c8', cap: '#c7d5ee', floor: () => marble(9), ceil: '#2a3550' },
      fortress: { side: '#4a2227', cap: '#6a2f33', floor: () => lavaBrick(13), ceil: '#220d10' }
    }, s = sets[theme] || sets.crypt;
    const side = new T.MeshStandardMaterial({ map: s.hedge ? grass(8) : stone(s.side, 3, true, 11), color: s.hedge ? '#4d7f48' : '#ffffff', roughness: 1 });
    const cap = new T.MeshStandardMaterial({ map: s.hedge ? grass(9) : stone(s.cap, 2, false, 5), roughness: 1 });
    const floor = new T.MeshStandardMaterial({ map: s.floor(), roughness: 1, color: s.hedge ? '#8a9a82' : '#ffffff' }), ceil = new T.MeshStandardMaterial({ map: stone(s.ceil, 3, false, 31), roughness: 1, side: T.DoubleSide });
    return { side, cap, floor, ceil };
  }
};
G.Terrain = Terrain;
})(window);
