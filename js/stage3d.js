/* Escenarios 3D con Three.js: arena de combate (Stage3D) y mazmorra en tercera persona (DungeonGL) */
(function (G) {
'use strict';
const T = G.THREE, Mo = G.Models; if (!T || !Mo) return;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function tweenRunner() {
  const list = [];
  return {
    add(dur, fn) { return new Promise(res => list.push({ t0: performance.now(), dur, fn, res })); },
    step(now) { for (let i = list.length - 1; i >= 0; i--) { const t = list[i], k = Math.min(1, (now - t.t0) / t.dur); t.fn(k); if (k >= 1) { list.splice(i, 1); t.res(); } } },
    clear() { list.length = 0; }
  };
}
const brick = (c1, c2, mortar) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = mortar; g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const x = c * 64 + (r % 2 ? -32 : 0); g.fillStyle = (r + c) % 2 ? c1 : c2; g.fillRect(x + 2, r * 32 + 2, 60, 28); g.fillRect(x + 66, r * 32 + 2, 60, 28); }
  const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
};
/* piedra procedural con el aspecto de tu mazmorra: bloques oscuros, junta negra y musgo */
function stoneTex(base, rows, moss, seed0) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); let seed = seed0 || 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const num = parseInt(base.slice(1), 16), R = num >> 16, G = (num >> 8) & 255, B = num & 255, sh = l => `rgb(${Math.max(0, Math.min(255, R + l))},${Math.max(0, Math.min(255, G + l))},${Math.max(0, Math.min(255, B + l))})`;
  g.fillStyle = '#12110d'; g.fillRect(0, 0, 256, 256); const h = 256 / rows;
  for (let r = 0; r < rows; r++) { let x = -(r % 2) * 40; while (x < 256) { const w = 70 + rnd() * 60; g.fillStyle = sh((rnd() - .5) * 22); g.fillRect(x + 3, r * h + 3, w - 5, h - 5); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 3, r * h + 3, w - 5, 4); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 3, r * h + h - 8, w - 5, 5); x += w; } }
  for (let i = 0; i < 1100; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,230'},${rnd() * .09})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(0,0,0,${.2 + rnd() * .2})`; g.lineWidth = 1; g.beginPath(); let cx = rnd() * 256, cy = rnd() * 256; g.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += (rnd() - .5) * 26; cy += rnd() * 16; g.lineTo(cx, cy); } g.stroke(); }
  if (moss) for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(${70 + rnd() * 30 | 0},${105 + rnd() * 40 | 0},50,${.2 + rnd() * .25})`; g.beginPath(); g.ellipse(rnd() * 256, 190 + rnd() * 66, 14 + rnd() * 34, 6 + rnd() * 12, 0, 0, 6.3); g.fill(); }
  const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
}
const checker = (a, b) => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = a; g.fillRect(0, 0, 64, 64); g.fillStyle = b; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32); const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; return t; };
/* superposición de primera persona: arma en la mano y destello rojo al recibir daño */
function fpOverlay(host, weapon, wpKey) {
  const d = document.createElement('div'); d.className = 'fpov'; d.innerHTML = `<div class="fpw">${weapon || '🗡️'}</div><div class="fpflash"></div>`; host.appendChild(d);
  const w = d.querySelector('.fpw'), f = d.querySelector('.fpflash'); let shown = null;
  if (wpKey && G.whenWeapon) G.whenWeapon(wpKey, url => { w.innerHTML = '<img alt="" src="' + url + '">'; w.classList.add('img'); });
  return {
    el: d,
    show(on) { if (on !== shown) { shown = on; d.style.opacity = on ? 1 : 0; } },
    swing() { w.classList.remove('swing'); void w.offsetWidth; w.classList.add('swing'); },
    flash() { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  };
}
class Particles {
  constructor(scene) { this.scene = scene; this.list = []; this.geo = new T.OctahedronGeometry(.08); }
  burst(x, y, z, color, n, speed) {
    for (let i = 0; i < (n || 12); i++) {
      const m = new T.Mesh(this.geo, new T.MeshBasicMaterial({ color, transparent: true })), a = Math.random() * 6.283;
      m.position.set(x, y, z); m.userData = { vx: Math.cos(a) * (speed || 2.4) * Math.random(), vy: Math.random() * 3 + 1.5, vz: Math.sin(a) * (speed || 2.4) * Math.random(), life: 1 };
      this.scene.add(m); this.list.push(m);
    }
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i], u = m.userData; u.life -= dt * 1.6; m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.position.z += u.vz * dt; u.vy -= 9 * dt; m.rotation.x += dt * 8;
      m.material.opacity = Math.max(0, u.life); m.scale.setScalar(Math.max(.01, u.life));
      if (u.life <= 0) { this.scene.remove(m); m.material.dispose(); this.list.splice(i, 1); }
    }
  }
}
function renderer(canvas) { const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, G.devicePixelRatio || 1)); return r; }
function fit(r, cam, canvas) {
  const w = canvas.clientWidth || 520, h = canvas.clientHeight || 320;
  if (canvas._w !== w || canvas._h !== h) { canvas._w = w; canvas._h = h; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
}

/* ---------- Arena de combate: héroe contra monstruo ---------- */
class Stage3D {
  constructor(canvas, look, kind, boss, theme, extras) {
    const P = G.Terrain.palette(theme);
    this.c = canvas; this.r = renderer(canvas); this.scene = new T.Scene(); this.cam = new T.PerspectiveCamera(62, 2, .1, 50); this.tw = tweenRunner(); this.camOff = 0; this.shk = 0;
    this.ov = fpOverlay(canvas.parentElement, look && look.weapon, look && look.wp); this.ov.show(true);
    this.scene.add(new T.AmbientLight(P.ambient[0], P.ambient[1] * .6)); const d = new T.DirectionalLight(P.dir[0], P.dir[1] * .62); d.position.set(3, 6, 5); this.scene.add(d);
    const p = new T.PointLight(P.point[0], P.point[1], 14); p.position.set(0, 3, 2); this.scene.add(p); this.torch = p; this.torchBase = P.point[1];
    const ground = new T.Mesh(new T.CircleGeometry(4.8, 48), G.Terrain.ground(theme)); ground.rotation.x = -Math.PI / 2; this.scene.add(ground); this.ground = ground; this.sg = new T.Group(); this.scene.add(this.sg);
    this.sceneryUpdate = G.Terrain.scenery(theme, this.sg); this.scene.fog = new T.Fog(P.fog[0], P.fog[1] + 3, P.fog[2] + 4);
    this.hero = Mo.create('hero', look); this.foe = Mo.create(kind, { crown: boss && kind === 'skeleton' });
    if (boss && kind !== 'skeleton') this.foe.scale.multiplyScalar(1.15);
    this.hx = -1.9; this.fx = (kind === 'dragon' || kind === 'naga') ? 1.5 : .5; this.foe.scale.multiplyScalar(kind === 'dragon' || kind === 'naga' ? 1.0 : 1.35); this.hero.visible = false;   // primera persona: no se ve al propio héroe
    this.hero.position.set(this.hx, 0, 0); this.hero.rotation.y = Math.PI / 2; this.foe.position.set(this.fx, 0, 0); this.foe.rotation.y = -Math.PI / 2;
    this.scene.add(this.hero, this.foe); this.foes = [this.foe];
    const ex = extras || [], nf = 1 + ex.length;   // varios enemigos: se colocan uno junto a otro (1, 2, 3 de izquierda a derecha)
    ex.forEach(kd => { const m = Mo.create(kd, {}); m.scale.multiplyScalar(1.35); m.position.set(this.fx, 0, 0); m.rotation.y = -Math.PI / 2; this.scene.add(m); this.foes.push(m); });
    this.foeBase = this.foes.map(m => m.scale.clone());    this.parts = new Particles(this.scene); this.last = 0; this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }
  side(s) { return s === 'hero' ? this.hero : this.foe; }
  setBackdrop(on) { this.ground.visible = !on; this.sg.visible = !on; }   // con un fondo ilustrado se ocultan el suelo y el decorado 3D
  layoutFoes() {   // reparte a los enemigos según el ancho visible de la escena (más estrecha = más juntos y más pequeños)
    const n = this.foes.length; if (n < 2) return; const asp = this.cam.aspect || 1.6, halfW = Math.tan(31 * Math.PI / 180) * (this.fx - this.hx + .2) * asp;
    const spread = n === 2 ? .5 : .72, kk = Math.min(1, Math.max(.5, asp / 1.2)) * (n === 2 ? .85 : .7);
    this.foes.forEach((m, i) => { m.position.z = (n === 2 ? [-1, 1][i] : [-1, 0, 1][i]) * halfW * spread; m.scale.copy(this.foeBase[i]).multiplyScalar(kk); });
  }
  foeAt(i) { return this.foes[i] || this.foe; }
  async hurtFoe(i) { const m = this.foeAt(i), a = m.userData.anim, x0 = m.position.x; this.parts.burst(m.position.x, 1.1, m.position.z, '#ffe14d', 16, 2.8); await this.tw.add(380, k => { a.hit = 1 - k; m.position.x = x0 + Math.sin(k * Math.PI) * .25; }); a.hit = 0; m.position.x = x0; }
  dieFoe(i) { const m = this.foeAt(i), a = m.userData.anim; this.parts.burst(m.position.x, .6, m.position.z, '#cfcfe8', 14, 2); this.tw.add(700, k => { a.dead = easeIO(k); }); }
  async attack(s) {
    if (s === 'foe' && this.foes.length > 1) {   // todos los enemigos que siguen en pie se lanzan a la vez
      const ms = this.foes.filter(m => !(m.userData.anim.dead > .5)), x0s = ms.map(m => m.position.x); this.shk = .7;
      await this.tw.add(420, k => { ms.forEach((m, i) => { m.position.x = x0s[i] - Math.sin(Math.min(1, k * 1.15) * Math.PI) * .45; m.userData.anim.atk = k; }); }); ms.forEach((m, i) => { m.userData.anim.atk = 0; m.position.x = x0s[i]; }); return;
    }
    if (s === 'hero') { this.ov.swing(); await this.tw.add(420, k => { this.camOff = Math.sin(Math.min(1, k * 1.1) * Math.PI) * .8; }); this.camOff = 0; return; }
    const m = this.side(s), x0 = m.position.x, a = m.userData.anim; this.shk = .7;
    await this.tw.add(420, k => { m.position.x = x0 - Math.sin(Math.min(1, k * 1.15) * Math.PI) * .45; a.atk = k; }); a.atk = 0; m.position.x = x0;
  }
  async hurt(s) { if (s === 'hero') { this.ov.flash(); this.shk = 1.2; await this.tw.add(400, () => { }); return; } const m = this.side(s); this.parts.burst(m.position.x, 1.1, 0, s === 'hero' ? '#f87171' : '#ffe14d', 16, 2.8); const a = m.userData.anim, x0 = m.position.x, dir = s === 'hero' ? -1 : 1; await this.tw.add(380, k => { a.hit = 1 - k; m.position.x = x0 + dir * Math.sin(k * Math.PI) * .25; }); a.hit = 0; m.position.x = x0; }
  die(s) { const a = this.side(s).userData.anim; this.parts.burst(this.side(s).position.x, .6, 0, '#cfcfe8', 14, 2); this.tw.add(700, k => { a.dead = easeIO(k); }); }
  revive(s) { const a = this.side(s).userData.anim; a.dead = 0; }
  cheer(s) { const m = this.side(s); this._cheer = m; }
  stopCheer() { if (this._cheer) { this._cheer.position.y = 0; this._cheer = null; } }
  loop(now) {
    if (!this.c.isConnected) { this.r.dispose(); return; }
    fit(this.r, this.cam, this.c); this.layoutFoes(); this.tw.step(now); this.parts.update(Math.min(.05, (now - this.last) / 1000 || .016)); this.last = now;
    if (this._cheer) { this._cheer.position.y = Math.abs(Math.sin(now / 200)) * .45; if (Math.random() < .12) this.parts.burst(this._cheer.position.x, 1.8, 0, ['#fbbf24', '#f472b6', '#60a5fa', '#4ade80'][Math.random() * 4 | 0], 4, 1.6); }
    this.torch.intensity = this.torchBase + Math.sin(now / 90) * .1; if (this.sceneryUpdate) this.sceneryUpdate(now);
    const sk = this.shk * (Math.random() - .5) * .12; this.shk = Math.max(0, this.shk - .035);
    this.cam.position.set(this.hx - .2 + this.camOff + sk, 1.32 + sk + Math.sin(now / 650) * .018, sk); this.cam.lookAt(this.fx, 1.05 + sk, 0);
    Mo.cam = this.cam; Mo.pose(this.hero, now); this.foes.forEach(m => Mo.pose(m, now)); this.r.render(this.scene, this.cam); requestAnimationFrame(this.loop);
  }
}

/* ---------- Mazmorra en tercera persona ---------- */
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
class DungeonGL {
  constructor(canvas, cfg, look, theme) {
    this.theme = theme || 'crypt'; this.TH = G.Terrain.dungeon(this.theme); this.P = G.Terrain.palette(this.theme);
    this.c = canvas; this.look = look || {}; this.r = renderer(canvas); this.cam = new T.PerspectiveCamera(55, 1.6, .1, 60); this.tw = tweenRunner();
    const host = canvas.parentElement; this.hud = document.createElement('div'); this.hud.className = 'hud3d';
    this.hud.innerHTML = '<div class="hp"></div><div class="msg"></div><canvas class="mini"></canvas>'; host.appendChild(this.hud);
    this.mini = this.hud.querySelector('.mini'); this.mg = this.mini.getContext('2d'); this.ov = fpOverlay(host, this.look.weapon, this.look.wp);
    const side = this.TH.side, cap = this.TH.cap;
    this.mats = { wallArr: [side, side, cap, side, side, side], door: new T.MeshStandardMaterial({ color: '#7a4a22', roughness: .9 }) };
    this.load(cfg); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }
  load(cfg) {
    this.cfg = cfg; this.tw.clear(); this.queueId = (this.queueId || 0) + 1;
    this.scene = new T.Scene(); this.scene.background = null; this.scene.fog = new T.Fog(this.P.fog[0], this.P.fog[1] + 2, this.P.fog[2] + 5);
    this.grid = cfg.map.map(r => r.split('')); const H = this.grid.length, Wd = this.grid[0].length;
    this.scene.add(new T.AmbientLight(this.P.ambient[0], this.P.ambient[1] * .75)); const dl = new T.DirectionalLight(this.P.dir[0], this.P.dir[1] * .5); dl.position.set(-3, 8, 5); this.scene.add(dl);
    this.lantern = new T.PointLight('#ffb35c', 1.5, 9); this.scene.add(this.lantern); this.torchPts = []; this.torchLights = [];
    const fl = new T.Mesh(new T.PlaneGeometry(Wd, H), this.TH.floor.clone()); fl.material.map = this.TH.floor.map.clone(); fl.material.map.needsUpdate = true; fl.material.map.repeat.set(Wd / 1.3, H / 1.3); fl.rotation.x = -Math.PI / 2; fl.position.set(Wd / 2, 0, H / 2); this.scene.add(fl);
    this.walls = new T.Group(); this.scene.add(this.walls);
    this.ceil = new T.Mesh(new T.PlaneGeometry(Wd, H), this.TH.ceil.clone()); this.ceil.material.map = this.TH.ceil.map.clone(); this.ceil.material.map.needsUpdate = true; this.ceil.material.map.repeat.set(Wd / 1.3, H / 1.3);
    this.ceil.rotation.x = Math.PI / 2; this.ceil.position.set(Wd / 2, 1.73, H / 2); this.ceil.visible = false; this.scene.add(this.ceil); this.doors = {}; this.items = []; this.enemies = []; let start = { x: 1, y: 1 };
    const wallGeo = new T.BoxGeometry(1, 1.05, 1);
    this.grid.forEach((row, y) => row.forEach((ch, x) => {
      const cx = x + .5, cz = y + .5;
      if (ch === '#') {
        const touches = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a, b]) => this.grid[y + b] && this.grid[y + b][x + a] !== undefined && this.grid[y + b][x + a] !== '#');
        if (!touches) return;
        const w = new T.Mesh(wallGeo, this.mats.wallArr); w.position.set(cx, .525, cz); this.walls.add(w);
        if ((x * 7 + y * 13) % 5 === 0) { this.torchPts.push([cx, cz]); const f = new T.Mesh(new T.ConeGeometry(.07, .22, 6), new T.MeshBasicMaterial({ color: '#ffb347' })); f.position.set(cx, 1.5, cz); this.scene.add(f); const s = new T.Mesh(new T.CylinderGeometry(.03, .03, .22, 5), new T.MeshStandardMaterial({ color: '#4a3320' })); s.position.set(cx, 1.38, cz); this.scene.add(s); f.userData.flame = true; this.items.push(f); }
      } else if (ch === 'D') { const d = new T.Mesh(new T.BoxGeometry(1, 1.3, .35), this.mats.door); d.position.set(cx, .65, cz); if (this.grid[y][x - 1] === '#' && this.grid[y][x + 1] === '#') d.rotation.y = 0; else d.rotation.y = Math.PI / 2; this.scene.add(d); this.doors[x + ',' + y] = d; }
      else if (ch === 'S') { start = { x, y }; row[x] = '.'; }
      else if (ch === 'E') { const m = Mo.create(cfg.enemyType || 'goblin'); m.position.set(cx, 0, cz); const hp = cfg.enemyHp || 2; this.scene.add(m); const bar = new T.Mesh(new T.PlaneGeometry(.7, .08), new T.MeshBasicMaterial({ color: '#f87171' })); bar.position.set(cx, Mo.bbHeight(cfg.enemyType || 'goblin') + .25, cz); this.scene.add(bar); this.enemies.push({ x, y, m, bar, hp, max: hp, alive: true }); row[x] = '.'; }
      else if (ch === 'T') { const g = new T.Group(); const b = new T.Mesh(new T.BoxGeometry(.5, .3, .35), new T.MeshStandardMaterial({ color: '#7a4a1f' })); b.position.y = .15; const l = new T.Mesh(new T.BoxGeometry(.52, .12, .37), new T.MeshStandardMaterial({ color: '#f5c542', metalness: .6, roughness: .3 })); l.position.y = .36; g.add(b, l); g.position.set(cx, 0, cz); this.scene.add(g); this.items.push(g); g.userData = { treasure: true, x, y }; row[x] = '.'; }
      else if (ch === 'X') { const g = new T.Group(); const t = new T.Mesh(new T.TorusGeometry(.42, .07, 8, 24), new T.MeshBasicMaterial({ color: '#4ade80' })); t.position.y = .55; const d = new T.Mesh(new T.CircleGeometry(.4, 20), new T.MeshBasicMaterial({ color: '#16a34a', transparent: true, opacity: .55 })); d.position.y = .55; g.add(t, d); g.position.set(cx, 0, cz); const pl = new T.PointLight('#4ade80', .9, 4); pl.position.set(cx, .8, cz); this.scene.add(g, pl); g.userData = { exit: true }; this.items.push(g); row[x] = '.'; }
    }));
    const step = Math.max(1, Math.floor(this.torchPts.length / 4)); for (let i = 0; i < this.torchPts.length && this.torchLights.length < 4; i += step) { const l = new T.PointLight('#ff9d4d', 1.2, 6); l.position.set(this.torchPts[i][0], 1.4, this.torchPts[i][1]); this.scene.add(l); this.torchLights.push(l); }
    this.dir = Math.max(0, ['E', 'S', 'O', 'N'].indexOf(cfg.dir || 'E')); this.px = start.x + .5; this.py = start.y + .5; this.ang = this.dir * Math.PI / 2;
    this.hero = Mo.create('hero', this.look); this.hero.scale.multiplyScalar(.85); this.enemies.forEach(e => e.m.scale.multiplyScalar(.85)); this.scene.add(this.hero); this.parts = new Particles(this.scene); this.last = 0; this.hp = cfg.hp || 30; this.maxHp = this.hp; this.msg = ''; this.shake = 0; this.glow = 0;
    this.camPos = null; this.fp = 0; this.fpFocus = null;
  }
  reset() { this.load(this.cfg); }
  async play(events, speed) {
    this.reset(); const id = this.queueId, sp = speed || 1, alive = () => this.queueId === id && this.c.isConnected, tw = (d, f) => this.tw.add(d / sp, f);
    for (const e of events) {
      if (!alive()) return false; const a = this.hero.userData.anim;
      const fight = e.t === 'attack' || e.t === 'hurt', f0 = this.fp;   // al pelear, la cámara pasa a primera persona
      if (fight) { this.fpFocus = this.focusFor(e); if (f0 < 1) await tw(380, k => { this.fp = f0 + (1 - f0) * easeIO(k); }); }
      else if (f0 > 0) await tw(380, k => { this.fp = f0 * (1 - easeIO(k)); });
      if (e.t === 'move') { const x0 = this.px, y0 = this.py; a.walk = 1; await tw(420, k => { this.px = x0 + (e.x + .5 - x0) * easeIO(k); this.py = y0 + (e.y + .5 - y0) * easeIO(k); }); a.walk = 0; }
      else if (e.t === 'turn') { let d = e.dir - this.dir; if (d === 3) d = -1; if (d === -3) d = 1; const a0 = this.ang; this.dir = e.dir; a.walk = .4; await tw(360, k => { this.ang = a0 + d * Math.PI / 2 * easeIO(k); }); a.walk = 0; }
      else if (e.t === 'bump') { const x0 = this.px, y0 = this.py, dd = this.dir; this.msg = '¡Pum! Choque'; a.walk = 1; await tw(280, k => { const o = Math.sin(k * Math.PI) * .22; this.px = x0 + DX[dd] * o; this.py = y0 + DY[dd] * o; }); a.walk = 0; this.msg = ''; this.shake = .4; }
      else if (e.t === 'attack') {
        const en = e.hit && this.enemies.find(s => s.alive && s.x === e.x && s.y === e.y);
        this.ov.swing(); const swing = tw(400, k => { a.atk = k; }); await sleep(180 / sp);
        if (en) { en.hp--; en.bar.scale.x = Math.max(.001, en.hp / en.max); this.parts.burst(en.x + .5, 1, en.y + .5, '#ffe14d', 14, 2.6); const ea = en.m.userData.anim; tw(380, k => { ea.hit = 1 - k; }); if (e.killed) { en.alive = false; tw(700, k => { ea.dead = easeIO(k); }); en.bar.visible = false; this.msg = '¡Enemigo derrotado!'; } else this.msg = '¡Golpe!'; } else this.msg = 'Golpe al aire';
        await swing; a.atk = 0; this.msg = '';
      }
      else if (e.t === 'open') { const d = this.doors[e.x + ',' + e.y]; this.grid[e.y][e.x] = '.'; this.msg = '¡Puerta abierta!'; if (d) await tw(500, k => { d.position.y = .65 - k * 1.4; }); this.msg = ''; }
      else if (e.t === 'pickup') { const it = this.items.find(i => i.userData.treasure && i.userData.x === e.x && i.userData.y === e.y); this.msg = '¡Tesoro! 💰'; this.parts.burst(this.px, .8, this.py, '#fbbf24', 22, 2.8); if (it) await tw(500, k => { it.position.y = k * .8; it.scale.setScalar(1 - k); }); this.msg = ''; }
      else if (e.t === 'hurt') { this.ov.flash(); this.hp = e.hp; this.shake = .5; this.parts.burst(this.px, 1, this.py, '#f87171', 12, 2.2); this.msg = `-${e.dmg} de vida`; a.hit = 1; await tw(350, k => { a.hit = 1 - k; }); this.msg = ''; }
      else if (e.t === 'exit') { this.glow = 1; this.msg = '¡Salida alcanzada!'; this.parts.burst(this.px, .8, this.py, '#4ade80', 26, 3); await sleep(700 / sp); }
      else if (e.t === 'text') { this.msg = e.text; await sleep(600 / sp); this.msg = ''; }
      await sleep(60 / sp);
    }
    if (this.fp > 0 && alive()) { const f1 = this.fp; await tw(380, k => { this.fp = f1 * (1 - easeIO(k)); }); }
    return alive();
  }
  setCam(mode, instant) {   // 'fp' = caminar en primera persona; 'top' = vista aérea del tablero
    const to = mode === 'fp' ? 1 : 0, from = this.fpBase || 0; this.camMode = mode;
    if (instant) { this.fpBase = to; return; }
    this.tw.add(600, k => { this.fpBase = from + (to - from) * easeIO(k); });
  }
  focusFor(e) {   // hacia dónde mira el héroe al pelear: el enemigo golpeado, el adyacente o la casilla de delante
    if (e.t === 'attack' && e.hit) return { x: e.x + .5, z: e.y + .5 };
    const en = this.enemies.find(s => s.alive && Math.abs(s.x + .5 - this.px) + Math.abs(s.y + .5 - this.py) <= 1.01);
    if (en) return { x: en.x + .5, z: en.y + .5 };
    return { x: this.px + Math.cos(this.ang), z: this.py + Math.sin(this.ang) };
  }
  loop(now) {
    if (!this.c.isConnected) { this.hud.remove(); this.r.dispose(); return; }
    fit(this.r, this.cam, this.c); this.layoutFoes(); this.tw.step(now); this.parts.update(Math.min(.05, (now - this.last) / 1000 || .016)); this.last = now; this.shake = Math.max(0, this.shake - .02); this.glow = Math.max(0, this.glow - .004);
    const th = Math.PI / 2 - this.ang, fx = Math.cos(this.ang), fz = Math.sin(this.ang);
    this.hero.position.set(this.px, 0, this.py); this.hero.rotation.y = th; Mo.pose(this.hero, now);
    this.lantern.position.set(this.px + fx * .3, 1.9, this.py + fz * .3); this.lantern.intensity = .95 + Math.sin(now / 80) * .08; this.torchLights.forEach((l, i) => { l.intensity = .8 + Math.sin(now / 90 + i * 2.1) * .2; });
    // cámara fija con vista inclinada (estilo 2.5D): sigue al héroe sin girar, así las figuras ilustradas se ven siempre de perfil
    const sh = this.shake * (Math.random() - .5) * .25; Mo.cam = this.cam;
    this.camx = (this.camx === undefined ? this.px : this.camx + (this.px - this.camx) * .12); this.camz = (this.camz === undefined ? this.py : this.camz + (this.py - this.camz) * .12);
    const fp = easeIO(Math.max(0, Math.min(1, Math.max(this.fp, this.fpBase || 0)))), foc = (this.fp > .02 && this.fpFocus) ? this.fpFocus : { x: this.px + fx, z: this.py + fz }, L = (a, b) => a + (b - a) * fp;
    const wsc = 1 + .65 * fp; this.walls.scale.y = wsc; this.ceil.visible = fp > .6;   // muros altos y techo al caminar en primera persona
    for (const k in this.doors) { const [dx, dy] = k.split(',').map(Number); if (this.grid[dy][dx] === 'D') { const d = this.doors[k]; d.scale.y = wsc * 1.05 / 1.3; d.position.y = .525 * wsc; } }
    this.cam.position.set(L(this.camx, this.px - fx * .12) + sh, L(5.4, 1.1) + sh + fp * Math.abs(Math.sin(now / 105)) * .05 * this.hero.userData.anim.walk, L(this.camz + 2.8, this.py - fz * .12) + sh);
    this.cam.lookAt(L(this.camx, foc.x), L(.3, .9), L(this.camz - .3, foc.z));
    const fov = 55 + 10 * fp; if (Math.abs(this.cam.fov - fov) > .05) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
    this.hero.visible = fp < .55; this.ov.show(fp > .6);
    for (const en of this.enemies) {
      const dx = this.px - (en.x + .5), dz = this.py - (en.y + .5); if (en.alive) en.m.rotation.y = Math.atan2(dx, dz); Mo.pose(en.m, now);
      en.bar.quaternion.copy(this.cam.quaternion); en.bar.visible = en.alive && fp < .45; en.bar.position.x = en.x + .5 - (1 - en.bar.scale.x) * .35 * 0;
    }
    for (const it of this.items) { if (it.userData.flame) { it.scale.setScalar(.9 + Math.sin(now / 70 + it.position.x) * .15); } else if (it.userData.exit) it.rotation.y = now / 600; }
    this.r.render(this.scene, this.cam); this.drawHud();
    requestAnimationFrame(this.loop);
  }
  drawHud() {
    this.hud.querySelector('.hp').textContent = `❤️ ${this.hp}/${this.maxHp}   🧭 ${'ESON'[this.dir]}`; this.hud.querySelector('.msg').textContent = this.msg;
    const cs = 7, g = this.mg, w = this.grid[0].length * cs, h = this.grid.length * cs; if (this.mini.width !== w) { this.mini.width = w; this.mini.height = h; }
    g.clearRect(0, 0, w, h);
    this.grid.forEach((row, y) => row.forEach((ch, x) => { g.fillStyle = ch === '#' ? '#4b4062' : ch === 'D' ? '#a8692d' : '#14101d'; g.fillRect(x * cs, y * cs, cs - 1, cs - 1); }));
    for (const en of this.enemies) if (en.alive) { g.fillStyle = '#f87171'; g.fillRect(en.x * cs + 1, en.y * cs + 1, cs - 3, cs - 3); }
    for (const it of this.items) if (it.userData.treasure && it.scale.x > .5) { g.fillStyle = '#fbbf24'; g.fillRect(it.userData.x * cs + 1, it.userData.y * cs + 1, cs - 3, cs - 3); } else if (it.userData.exit) { g.fillStyle = '#4ade80'; g.fillRect((it.position.x - .5) * cs + 1, (it.position.z - .5) * cs + 1, cs - 3, cs - 3); }
    g.fillStyle = this.look.color || '#a78bfa'; const cx = this.px * cs, cy = this.py * cs; g.beginPath();
    g.moveTo(cx + Math.cos(this.ang) * 5, cy + Math.sin(this.ang) * 5); g.lineTo(cx + Math.cos(this.ang + 2.5) * 4, cy + Math.sin(this.ang + 2.5) * 4); g.lineTo(cx + Math.cos(this.ang - 2.5) * 4, cy + Math.sin(this.ang - 2.5) * 4); g.fill();
  }
}
/* ---------- Sala de la mazmorra errante: puertas sin identificar, cofre o altar de acertijo (primera persona) ---------- */
function woodTex() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#6b4220'; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#7a4c26' : '#5e3a1b'; g.fillRect(i * 25.6 + 1, 0, 24, 256); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 25.6, 0, 2, 256); }
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .18})`; g.fillRect(Math.random() * 128, Math.random() * 256, 1, 4 + Math.random() * 14); }
  g.fillStyle = '#2b2b30'; [50, 200].forEach(y => g.fillRect(0, y, 128, 14)); g.fillStyle = '#9aa0a8'; for (let x = 10; x < 128; x += 22) [57, 207].forEach(y => { g.beginPath(); g.arc(x, y, 2.4, 0, 6.3); g.fill(); });
  const t = new T.CanvasTexture(cv); t.anisotropy = 4; return t;
}
function plateTex(n) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#3b3b44'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#c9a227'; g.lineWidth = 6; g.strokeRect(6, 6, 116, 116);
  g.fillStyle = '#f5d76e'; g.font = 'bold 84px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 70); return new T.CanvasTexture(cv);
}
class RoomScene {
  constructor(canvas, theme, mode, n) {
    const P = G.Terrain.palette(theme), TH = G.Terrain.dungeon(theme); this.c = canvas; this.r = renderer(canvas); this.scene = new T.Scene(); this.cam = new T.PerspectiveCamera(60, 2, .1, 60); this.tw = tweenRunner();
    this.mode = mode; this.n = n || 3; this.flames = []; this.last = 0; this.parts = new Particles(this.scene);
    this.scene.add(new T.AmbientLight(P.ambient[0], P.ambient[1] * .55)); const dl = new T.DirectionalLight(P.dir[0], P.dir[1] * .45); dl.position.set(2, 6, 6); this.scene.add(dl);
    this.scene.fog = new T.Fog(P.fog[0], 8, 18);
    const gm = G.Terrain.ground(theme); gm.map.repeat.set(5, 5); const floor = new T.Mesh(new T.PlaneGeometry(14, 14), gm); floor.rotation.x = -Math.PI / 2; floor.position.z = -1; this.scene.add(floor); this.shell = [floor];
    const wallMat = (rx, ry) => { const m = TH.side.clone(); m.map = TH.side.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(rx, ry); return m; };
    const back = new T.Mesh(new T.PlaneGeometry(14, 4), wallMat(6, 2)); back.position.set(0, 2, -5.2); this.scene.add(back); this.shell.push(back);
    [-1, 1].forEach(s => { const w = new T.Mesh(new T.PlaneGeometry(14, 4), wallMat(6, 2)); w.position.set(s * 6, 2, -1); w.rotation.y = -s * Math.PI / 2; this.scene.add(w); this.shell.push(w); });
    const ce = new T.Mesh(new T.PlaneGeometry(14, 14), TH.ceil.clone()); ce.rotation.x = Math.PI / 2; ce.position.set(0, 3.6, -1); this.scene.add(ce); this.shell.push(ce);
    this.cx = 0; this.cz = 3.6; this.cy = 1.45; this.lookZ = -3;
    this.torch = (x, z) => { const g = new T.Group(); const s = new T.Mesh(new T.CylinderGeometry(.05, .06, .8, 6), new T.MeshStandardMaterial({ color: '#4a3320' })); s.position.y = 1.5; const f = new T.Mesh(new T.ConeGeometry(.14, .38, 6), new T.MeshBasicMaterial({ color: '#ff9f43' })); f.position.y = 2.05; g.add(s, f); g.position.set(x, 0, z); this.scene.add(g); (this.props = this.props || []).push(g); const l = new T.PointLight('#ff9d4d', 1.0, 7); l.position.set(x, 2.1, z + .5); this.scene.add(l); this.flames.push({ f, l }); };
    if (mode === 'doors') this.buildDoors(); else if (mode === 'chest') this.buildChest(); else this.buildAltar();
  }
  setBackdrop(on) { this.shell.forEach(m => m.visible = !on); if (on) { this.scene.fog = null; (this.props || []).forEach(m => m.visible = false); if (this.chestG) this.chestG.visible = false; if (this.book) this.book.visible = false; if (this.ped) this.ped.visible = false; if (this.alt) this.alt.visible = false; } }
  buildDoors() {
    this.doors = []; const n = this.n, gap = 2.7;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * gap, g = new T.Group(); g.position.set(x, 0, -5.05);
      const frame = new T.Mesh(new T.BoxGeometry(1.95, 2.75, .28), new T.MeshStandardMaterial({ color: '#2d2d34', roughness: 1 })); frame.position.y = 1.375; g.add(frame);
      const pivot = new T.Group(); pivot.position.set(-.76, 0, .1); const panel = new T.Mesh(new T.BoxGeometry(1.52, 2.45, .1), new T.MeshStandardMaterial({ map: woodTex(), roughness: .9 })); panel.position.set(.76, 1.225, 0); pivot.add(panel); g.add(pivot);
      const knob = new T.Mesh(new T.SphereGeometry(.07, 8, 6), new T.MeshStandardMaterial({ color: '#c9a227', metalness: .7, roughness: .3 })); knob.position.set(1.35, 1.2, .08); pivot.add(knob);
      const plate = new T.Mesh(new T.PlaneGeometry(.55, .55), new T.MeshBasicMaterial({ map: plateTex(i + 1) })); plate.position.set(0, 3.1, .15); g.add(plate);
      this.scene.add(g); this.doors.push({ g, pivot, x });
      if (i < n - 1) this.torch(x + gap / 2, -4.9);
    }
    this.torch(-(n * gap) / 2 - .2, -4.9); this.torch((n * gap) / 2 + .2, -4.9);
  }
  buildChest() {
    this.torch(-3, -3); this.torch(3, -3);
    const ped = new T.Mesh(new T.CylinderGeometry(.9, 1.1, .5, 12), new T.MeshStandardMaterial({ color: '#4a4a52', roughness: 1 })); ped.position.set(0, .25, -2.4); this.scene.add(ped); this.ped = ped;
    const g = new T.Group(); g.position.set(0, .5, -2.4); const base = new T.Mesh(new T.BoxGeometry(1.3, .6, .8), new T.MeshStandardMaterial({ color: '#7a4a1f' })); base.position.y = .3; g.add(base);
    const band = new T.Mesh(new T.BoxGeometry(1.34, .12, .84), new T.MeshStandardMaterial({ color: '#c9a227', metalness: .6, roughness: .35 })); band.position.y = .35; g.add(band);
    this.lid = new T.Group(); this.lid.position.set(0, .6, -.4); const lidm = new T.Mesh(new T.BoxGeometry(1.34, .3, .84), new T.MeshStandardMaterial({ color: '#8a5a2b' })); lidm.position.set(0, .15, .4); this.lid.add(lidm); g.add(this.lid);
    this.chestG = g; this.glow = new T.PointLight('#ffd24a', .8, 5); this.glow.position.set(0, 1.4, -2); this.scene.add(this.glow); this.scene.add(g); this.cy = 1.7; this.lookZ = -2.4;
  }
  buildAltar() {
    this.torch(-3, -3); this.torch(3, -3);
    const alt = new T.Mesh(new T.BoxGeometry(1.6, 1.0, .9), new T.MeshStandardMaterial({ color: '#55555e', roughness: 1 })); alt.position.set(0, .5, -2.6); this.scene.add(alt); this.alt = alt;
    this.book = new T.Group(); [-1, 1].forEach(s => { const p = new T.Mesh(new T.BoxGeometry(.5, .06, .7), new T.MeshStandardMaterial({ color: '#2a4a9a', emissive: '#3b6cff', emissiveIntensity: .5 })); p.position.x = s * .27; p.rotation.z = -s * .35; this.book.add(p); });
    this.book.position.set(0, 1.55, -2.6); this.scene.add(this.book);
    this.ring = new T.Mesh(new T.TorusGeometry(.75, .03, 8, 36), new T.MeshBasicMaterial({ color: '#7dd3fc' })); this.ring.position.set(0, 1.55, -2.6); this.ring.rotation.x = Math.PI / 2.4; this.scene.add(this.ring);
    this.glow = new T.PointLight('#7dd3fc', 1.1, 6); this.glow.position.set(0, 1.9, -2.2); this.scene.add(this.glow); this.cy = 1.6; this.lookZ = -2.6; this.lookY = 1.25;
    this.start = performance.now();
    this.loopStart = performance.now(); this.rcv = this.r;
    requestAnimationFrame(this.loop = this.loop.bind(this));
  }
  open() { if (!this.lid) return Promise.resolve(); this.parts.burst(0, 1.2, -2.4, '#ffd24a', 30, 3); return this.tw.add(700, k => { this.lid.rotation.x = -easeIO(k) * 1.2; this.glow.intensity = .8 + k * 3; }); }
  enter(i) {   // camina hacia la puerta elegida y la abre
    const d = this.doors[i]; if (!d) return Promise.resolve(); const x0 = this.cx, z0 = this.cz;
    return Promise.all([this.tw.add(1300, k => { const e = easeIO(k); this.cx = x0 + (d.x - x0) * e; this.cz = z0 + (-3.6 - z0) * e; }), this.tw.add(700, k => { d.pivot.rotation.y = -easeIO(k) * 1.45; })]);
  }
  loop(now) {
    if (!this.c.isConnected) { this.r.dispose(); return; }
    fit(this.r, this.cam, this.c); this.layoutFoes(); this.tw.step(now); this.parts.update(Math.min(.05, (now - this.last) / 1000 || .016)); this.last = now;
    this.flames.forEach((o, i) => { o.f.scale.setScalar(.9 + Math.sin(now / 80 + i * 2) * .18); o.l.intensity = .9 + Math.sin(now / 90 + i) * .2; });
    if (this.book) { this.book.position.y = 1.55 + Math.sin(now / 600) * .1; this.book.rotation.y = now / 1400; this.ring.rotation.z = now / 700; }
    if (this.mode === 'chest' && this.glow && !this.lid.rotation.x) this.glow.intensity = .8 + Math.sin(now / 300) * .25;
    this.cam.position.set(this.cx + Math.sin(now / 1700) * .05, this.cy + Math.sin(now / 900) * .02, this.cz); this.cam.lookAt(this.cx, this.lookY || 1.35, this.lookZ);
    this.r.render(this.scene, this.cam); requestAnimationFrame(this.loop);
  }
}
{ const _orig = RoomScene.prototype.buildDoors, _chest = RoomScene.prototype.buildChest; RoomScene.prototype.buildDoors = function () { _orig.call(this); this.begin(); }; RoomScene.prototype.buildChest = function () { _chest.call(this); this.begin(); }; RoomScene.prototype.begin = function () { if (this._begun) return; this._begun = true; requestAnimationFrame(this.loop = this.loop.bind(this)); }; }
G.RoomScene = RoomScene;
G.Stage3D = Stage3D; G.DungeonGL = DungeonGL;
})(window);
