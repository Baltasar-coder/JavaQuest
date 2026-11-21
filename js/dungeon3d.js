/* Mazmorra 3D en primera persona (raycasting sobre canvas, sin dependencias) */
(function (G) {
'use strict';
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

class Dungeon3D {
  constructor(canvas, cfg, look) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.W = canvas.width; this.H = canvas.height;
    this.look = look || { color: '#a78bfa', weapon: '🗡️' }; this.tweens = []; this.queueId = 0;
    this.load(cfg); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }
  load(cfg) {
    this.cfg = cfg; this.grid = cfg.map.map(r => r.split('')); this.sprites = [];
    let start = { x: 1, y: 1 };
    this.grid.forEach((row, y) => row.forEach((ch, x) => {
      if (ch === 'S') { start = { x, y }; row[x] = '.'; }
      else if (ch === 'E') { this.sprites.push({ k: 'E', x, y, hp: cfg.enemyHp || 2, max: cfg.enemyHp || 2, alive: true, flash: 0, emoji: cfg.enemyEmoji || '👹' }); row[x] = '.'; }
      else if (ch === 'T') { this.sprites.push({ k: 'T', x, y, alive: true, emoji: '💰' }); row[x] = '.'; }
      else if (ch === 'X') { this.sprites.push({ k: 'X', x, y, alive: true, emoji: '🌀' }); row[x] = '.'; }
    }));
    this.dir = Math.max(0, ['E', 'S', 'O', 'N'].indexOf(cfg.dir || 'E'));
    this.px = start.x + .5; this.py = start.y + .5; this.ang = this.dir * Math.PI / 2;
    this.swing = 0; this.hurt = 0; this.glow = 0; this.bob = 0; this.tweens = []; this.hp = cfg.hp || 30; this.maxHp = this.hp; this.msg = '';
  }
  reset() { this.queueId++; this.load(this.cfg); }
  tween(dur, fn) { return new Promise(res => this.tweens.push({ t0: performance.now(), dur, fn, res })); }
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  async play(events, speed) {
    const id = ++this.queueId; const sp = speed || 1;
    this.reset(); this.queueId = id;
    const alive = () => this.queueId === id && this.c.isConnected;
    for (const e of events) {
      if (!alive()) return;
      if (e.t === 'move') {
        const x0 = this.px, y0 = this.py, x1 = e.x + .5, y1 = e.y + .5;
        await this.tween(380 / sp, k => { this.px = x0 + (x1 - x0) * easeIO(k); this.py = y0 + (y1 - y0) * easeIO(k); this.bob = Math.sin(k * Math.PI * 2) * 0.02; });
        this.bob = 0;
      } else if (e.t === 'turn') {
        let d = e.dir - this.dir; if (d === 3) d = -1; if (d === -3) d = 1;
        const a0 = this.ang, a1 = a0 + d * Math.PI / 2; this.dir = e.dir;
        await this.tween(320 / sp, k => { this.ang = a0 + (a1 - a0) * easeIO(k); });
      } else if (e.t === 'bump') {
        const x0 = this.px, y0 = this.py, d = this.dir;
        this.msg = '¡Pum! Choque'; this.hurt = .35;
        await this.tween(240 / sp, k => { const o = Math.sin(k * Math.PI) * 0.18; this.px = x0 + DX[d] * o; this.py = y0 + DY[d] * o; });
        this.msg = '';
      } else if (e.t === 'attack') {
        this.swing = 1; const s = e.hit && this.sprites.find(s => s.k === 'E' && s.alive && s.x === e.x && s.y === e.y);
        await this.sleep(160 / sp);
        if (s) { s.hp--; s.flash = 1; if (e.killed) s.alive = false; this.msg = e.killed ? '¡Enemigo derrotado!' : '¡Golpe!'; } else this.msg = 'Golpe al aire';
        await this.tween(260 / sp, k => { this.swing = 1 - k; });
        this.msg = '';
      } else if (e.t === 'open') { this.grid[e.y][e.x] = '.'; this.msg = '¡Puerta abierta!'; await this.sleep(300 / sp); this.msg = ''; }
      else if (e.t === 'pickup') { const s = this.sprites.find(s => s.k === 'T' && s.alive && s.x === e.x && s.y === e.y); if (s) s.alive = false; this.msg = '¡Tesoro! 💰'; await this.sleep(350 / sp); this.msg = ''; }
      else if (e.t === 'hurt') { this.hurt = 1; this.hp = e.hp; await this.tween(260 / sp, () => { }); }
      else if (e.t === 'exit') { this.glow = 1; this.msg = '¡Salida alcanzada!'; await this.sleep(500 / sp); }
      else if (e.t === 'text') { this.msg = e.text; await this.sleep(500 / sp); this.msg = ''; }
      await this.sleep(60 / sp);
    }
    return alive();
  }
  loop(now) {
    if (!this.c.isConnected) return;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const t = this.tweens[i], k = Math.min(1, (now - t.t0) / t.dur); t.fn(k);
      if (k >= 1) { this.tweens.splice(i, 1); t.res(); }
    }
    this.hurt = Math.max(0, this.hurt - 0.02); this.glow = Math.max(0, this.glow - 0.005);
    for (const s of this.sprites) if (s.flash) s.flash = Math.max(0, s.flash - 0.05);
    this.render(now); requestAnimationFrame(this.loop);
  }
  isWall(x, y) { const r = this.grid[y]; return !r || r[x] === undefined || r[x] === '#' || r[x] === 'D'; }
  render(now) {
    const g = this.g, W = this.W, H = this.H, hz = H / 2 + this.bob * H;
    let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#07050c'); gr.addColorStop(1, '#241a36'); g.fillStyle = gr; g.fillRect(0, 0, W, hz);
    gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#1b1426'); gr.addColorStop(1, '#3a2c52'); g.fillStyle = gr; g.fillRect(0, hz, W, H - hz);
    const dx = Math.cos(this.ang), dy = Math.sin(this.ang), plx = -dy * 0.66, ply = dx * 0.66, zbuf = new Float32Array(W);
    const flick = 0.92 + Math.sin(now / 90) * 0.04 + Math.sin(now / 37) * 0.03, step = 2;
    for (let x = 0; x < W; x += step) {
      const cam = 2 * x / W - 1, rx = dx + plx * cam, ry = dy + ply * cam;
      let mx = Math.floor(this.px), my = Math.floor(this.py);
      const ddx = Math.abs(1 / (rx || 1e-9)), ddy = Math.abs(1 / (ry || 1e-9));
      let sx, sy, sdx, sdy;
      if (rx < 0) { sx = -1; sdx = (this.px - mx) * ddx; } else { sx = 1; sdx = (mx + 1 - this.px) * ddx; }
      if (ry < 0) { sy = -1; sdy = (this.py - my) * ddy; } else { sy = 1; sdy = (my + 1 - this.py) * ddy; }
      let side = 0, hit = 0, guard = 0;
      while (!hit && guard++ < 60) {
        if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
        if (this.isWall(mx, my)) hit = 1;
      }
      const dist = Math.max(0.05, side === 0 ? sdx - ddx : sdy - ddy); for (let k = 0; k < step; k++) zbuf[x + k] = dist;
      const lh = Math.min(H * 3, H / dist), top = hz - lh / 2;
      let wx = side === 0 ? this.py + dist * ry : this.px + dist * rx; wx -= Math.floor(wx);
      const door = this.grid[my] && this.grid[my][mx] === 'D';
      const shade = Math.max(0.08, Math.min(1, flick / (1 + dist * 0.38))) * (side ? 0.72 : 1);
      const mortarV = (wx * 4 % 1) < 0.045 || (wx * 4 % 1) > 0.97;
      let r, gg, b; if (door) { r = 150; gg = 95; b = 45; } else { r = 112; gg = 98; b = 128; }
      if (mortarV) { r *= .6; gg *= .6; b *= .6; }
      g.fillStyle = `rgb(${r * shade | 0},${gg * shade | 0},${b * shade | 0})`; g.fillRect(x, top, step, lh);
      g.fillStyle = `rgba(0,0,0,${0.35 * (1 - shade * .4)})`;
      for (let b2 = 1; b2 < 6; b2++) g.fillRect(x, top + lh * b2 / 6, step, Math.max(1, lh / 70));
      if (door) { g.fillStyle = `rgba(255,210,120,${0.5 * shade})`; g.fillRect(x, top + lh * 0.46, step, Math.max(2, lh * 0.05)); }
    }
    // sprites
    const list = this.sprites.filter(s => s.alive || s.flash).map(s => ({ s, d: (s.x + .5 - this.px) ** 2 + (s.y + .5 - this.py) ** 2 })).sort((a, b) => b.d - a.d);
    const inv = 1 / (plx * dy - dx * ply);
    for (const { s } of list) {
      const rx = s.x + .5 - this.px, ry = s.y + .5 - this.py;
      const tx = inv * (dy * rx - dx * ry), ty = inv * (-ply * rx + plx * ry);
      if (ty < 0.15) continue;
      const scx = (W / 2) * (1 + tx / ty), size = Math.min(H * 1.4, H / ty);
      if (scx < -size || scx > W + size) continue;
      const zc = zbuf[Math.max(0, Math.min(W - 1, Math.round(scx)))]; if (zc < ty - 0.2) continue;
      const sh = Math.max(0.25, 1 / (1 + ty * 0.3));
      g.save(); g.globalAlpha = s.alive ? 1 : s.flash; g.textAlign = 'center'; g.textBaseline = 'middle';
      const cy = hz + size * (s.k === 'E' ? 0.06 : s.k === 'T' ? 0.22 : 0.08) + (s.k === 'X' ? Math.sin(now / 300) * size * .03 : 0);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(scx, hz + size * .42, size * .28, size * .06, 0, 0, 7); g.fill();
      g.font = `${size * (s.k === 'T' ? .42 : .8)}px 'Segoe UI Emoji','Apple Color Emoji',serif`;
      if (s.flash) { g.shadowColor = '#f87171'; g.shadowBlur = 25 * s.flash; }
      if (s.k === 'X') { g.shadowColor = '#4ade80'; g.shadowBlur = 30; }
      g.filter = `brightness(${.45 + sh * .75})`; g.fillText(s.emoji, scx, cy); g.filter = 'none';
      if (s.k === 'E' && s.alive) { const bw = size * .4; g.shadowBlur = 0; g.fillStyle = '#000a'; g.fillRect(scx - bw / 2, cy - size * .5, bw, Math.max(3, size * .05)); g.fillStyle = '#f87171'; g.fillRect(scx - bw / 2, cy - size * .5, bw * Math.max(0, s.hp) / s.max, Math.max(3, size * .05)); }
      g.restore();
    }
    // arma en primera persona
    const sw = this.swing; g.save(); g.font = `${H * .36}px 'Segoe UI Emoji','Apple Color Emoji',serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.translate(W * .8 - sw * W * .22, H * .86 + Math.sin(now / 420) * 3 - sw * H * .25); g.rotate(-0.5 + sw * 1.4); g.fillText(this.look.weapon, 0, 0); g.restore();
    // viñeta con el color del héroe
    const v = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.72)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.strokeStyle = this.look.color; g.globalAlpha = .6; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3); g.globalAlpha = 1;
    if (this.hurt > 0) { g.fillStyle = `rgba(220,38,38,${Math.min(.55, this.hurt * .5)})`; g.fillRect(0, 0, W, H); }
    if (this.glow > 0) { g.fillStyle = `rgba(74,222,128,${this.glow * .45})`; g.fillRect(0, 0, W, H); }
    // HUD: vida, mensaje y minimapa
    g.font = 'bold 14px system-ui'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.shadowColor = '#000'; g.shadowBlur = 4;
    g.fillText('❤️ ' + this.hp + '/' + this.maxHp + '   🧭 ' + 'ESON'[this.dir], 12, 22);
    if (this.msg) { g.textAlign = 'center'; g.font = 'bold 20px system-ui'; g.fillText(this.msg, W / 2, H * .2); }
    g.shadowBlur = 0;
    const cs = 8, mw = this.grid[0].length * cs, ox = W - mw - 10, oy = 10; g.globalAlpha = .85;
    this.grid.forEach((row, y) => row.forEach((ch, x) => { g.fillStyle = ch === '#' ? '#4b4062' : ch === 'D' ? '#a8692d' : '#14101d'; g.fillRect(ox + x * cs, oy + y * cs, cs - 1, cs - 1); }));
    for (const s of this.sprites) if (s.alive) { g.fillStyle = s.k === 'E' ? '#f87171' : s.k === 'T' ? '#fbbf24' : '#4ade80'; g.fillRect(ox + s.x * cs + 2, oy + s.y * cs + 2, cs - 5, cs - 5); }
    g.fillStyle = this.look.color; g.beginPath(); const cx = ox + this.px * cs, cy2 = oy + this.py * cs;
    g.moveTo(cx + Math.cos(this.ang) * 5, cy2 + Math.sin(this.ang) * 5); g.lineTo(cx + Math.cos(this.ang + 2.5) * 4, cy2 + Math.sin(this.ang + 2.5) * 4); g.lineTo(cx + Math.cos(this.ang - 2.5) * 4, cy2 + Math.sin(this.ang - 2.5) * 4); g.fill(); g.globalAlpha = 1;
  }
}
G.Dungeon3D = Dungeon3D;
})(window);
