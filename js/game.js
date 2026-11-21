/* JavaQuest — interfaz y reglas del juego */
(function () {
'use strict';
const GAME = window.GAME, JV = window.JV;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const app = $('#app'), modalRoot = $('#modal-root');
const KEY = 'javaquest.v1';
const AVATARS = ['🧙‍♀️', '🧝‍♀️', '🥷', '🤺', '🦸‍♀️'];
const COLORS = ['#a78bfa', '#f87171', '#4ade80', '#60a5fa', '#fbbf24', '#f472b6'];
const WEAPONS = ['🗡️', '🪄', '🏹', '🔨', '🪓'];
const HEROES = [
  { id: 'warrior_f', name: 'Guerrera', wp: 'sword', weapon: '🗡️', emoji: '🛡️', f: 1 }, { id: 'warrior_m', name: 'Guerrero', wp: 'axe', weapon: '🗡️', emoji: '🛡️', f: 0 },
  { id: 'mage_f', name: 'Maga', wp: 'staff_purple', weapon: '🪄', emoji: '🔮', f: 1 }, { id: 'mage_m', name: 'Mago', wp: 'staff_purple', weapon: '🪄', emoji: '🔮', f: 0 },
  { id: 'archer_f', name: 'Arquera', wp: 'bow', weapon: '🏹', emoji: '🏹', f: 1 }, { id: 'archer_m', name: 'Arquero', wp: 'bow', weapon: '🏹', emoji: '🏹', f: 0 },
  { id: 'cleric_f', name: 'Clériga', wp: 'staff_teal', weapon: '🪄', emoji: '✨', f: 1 }, { id: 'cleric_m', name: 'Clérigo', wp: 'staff_teal', weapon: '🪄', emoji: '✨', f: 0 }];
const heroDef = id => HEROES.find(h => h.id === id) || HEROES[0];
const heroFace = (id, size, w) => `<div class="hface" style="width:${size}px;height:${w || size}px;background-image:url(assets/sprites/hero_${heroDef(id).id}.jpg)"></div>`;
let d3 = null, stage = null;
const HAS3D = !!(window.THREE && window.Models && window.Stage3D);
const MODEL_EMOJI = { wolf: '🐺', goblin: '👺', troll: '🧌', dragon: '🐉', skeleton: '💀', humanoid: '🧙', thief: '🥷', naga: '🐍', arachne: '🕷️', zombie: '🧟' };
const FOES = {
  '1-1': ['goblin', 'Goblin portero'], '1-e': ['goblin', 'Goblin explorador'], '1-2': ['thief', 'Ladrón de cuevas'], '1-3': ['goblin', 'Goblin del cofre'], '1-4': ['skeleton', 'Esqueleto avaro'],
  '1-5': ['wolf', 'Lobo de las criptas'], '1-6': ['zombie', 'Zombi indeciso'], '1-7': ['thief', 'Ladrón de dos caras'], '1-8': ['naga', 'Naga bifronte'], '1-9': ['arachne', 'Araña transformista'], '1-10': ['humanoid', 'Hechicero de las letras'], '1-11': ['skeleton', 'Esqueleto escribano'], '1-b': ['troll', 'Troll guardián'],
  '2-1': ['wolf', 'Lobo del sendero'], '2-e': ['wolf', 'Lobo del laberinto'], '2-2a': ['troll', 'Troll del puente'], '2-2b': ['humanoid', 'Sabio de la esfinge'], '2-3': ['humanoid', 'Alquimista loco'],
  '2-4': ['thief', 'Ladrón de cerraduras'], '2-b': ['naga', 'Hidra Rey Cobra'],
  '3-1': ['arachne', 'Reina araña'], '3-2': ['skeleton', 'Esqueleto avaro'], '3-3': ['zombie', 'Zombi resistente'], '3-e': ['goblin', 'Guardianes goblin'], '3-4': ['troll', 'Ogro furioso'],
  '3-5': ['thief', 'Ladrón de cofres'], '3-6a': ['skeleton', 'Esqueleto apilador'], '3-6b': ['goblin', 'Goblin tejedor'], '3-b': ['skeleton', 'Rey Esqueleto'],
  '4-1': ['skeleton', 'Espectro del primer piso'], '4-2': ['troll', 'Gárgola de piedra'], '4-3a': ['humanoid', 'Caballero hueco'], '4-3b': ['thief', 'Ladrón de trampas'], '4-4': ['goblin', 'Goblin del cofre'],
  '4-5': ['thief', 'Ladrón de mochilas'], '4-6': ['skeleton', 'Cartógrafo esqueleto'], '4-7': ['wolf', 'Lobo de la escalera'], '4-b': ['troll', 'Gólem de Arrays'],
  '5-1': ['goblin', 'Goblin herrero'], '5-2': ['wolf', 'Lobo vigía'], '5-3': ['humanoid', 'Caballero sin linaje'], '5-4': ['troll', 'Troll de la horda'], '5-5a': ['skeleton', 'Mago esqueleto'],
  '5-5b': ['thief', 'Ladrón gemelo'], '5-b': ['dragon', 'Dragón de las Clases']
};
Object.keys(GAME.levels).forEach(id => { const f = FOES[id]; const lv = GAME.levels[id]; if (f) lv.foe = Object.assign({}, lv.foe, { model: f[0], name: f[1], emoji: MODEL_EMOJI[f[0]] }); else lv.foe.model = lv.foe.model || 'goblin'; });
function applyArenaBg(arena, theme, st) {   // fondo ilustrado por mundo (assets/backgrounds/<tema>.jpg); si no existe, se queda el terreno 3D
  const im = new Image(); im.onload = () => { if (!arena || !arena.isConnected) return; arena.style.background = '#000 url(assets/backgrounds/' + theme + '.jpg) center / cover no-repeat'; if (st && st.setBackdrop) st.setBackdrop(true); };
  im.src = 'assets/backgrounds/' + theme + '.jpg';
}
function bindStage(st) {
  [['hero', '#fh'], ['foe', '#ff']].forEach(([side, sel]) => {
    const e = $(sel); if (!e) return;
    new MutationObserver(() => {
      const c = e.classList;
      if (c.contains('attack') && !e._a) { e._a = 1; st.attack(side); } if (!c.contains('attack')) e._a = 0;
      if (c.contains('hit') && !e._h) { e._h = 1; st.hurt(side); } if (!c.contains('hit')) e._h = 0;
      if (c.contains('dead') && !e._d) { e._d = 1; st.die(side); } if (!c.contains('dead') && e._d) { e._d = 0; st.revive(side); }
      if (c.contains('win') && !e._w) { e._w = 1; st.cheer(side); } if (!c.contains('win') && e._w) { e._w = 0; st.stopCheer(); }
    }).observe(e, { attributes: true, attributeFilter: ['class'] });
  });
}
const KIND = { explore: ['🧭', 'Exploración 3D'], puzzle: ['🧩', 'Enigma'], combat: ['⚔️', 'Combate'], boss: ['👑', 'JEFE'], treasure: ['📦', 'Tesoro'], trap: ['🪤', 'Trampa'] };
const dummy = document.createElement('div'), el = s => $(s) || dummy;
async function playExplore(t) { if (d3 && t && t.explore) { d3.cfg = t.explore; await d3.play(t.events || []); } }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const worlds = GAME.worlds.slice().sort((a, b) => a.id - b.id), levels = GAME.levels;
const COMING = [
  { id: 6, name: 'El Abismo de las Colecciones', emoji: '🕳️', blurb: 'ArrayList, HashMap, excepciones (try/catch), ficheros y más.' },
  { id: 7, name: 'El Trono del Experto', emoji: '🏰', blurb: 'Recursión, algoritmos, lambdas y streams, patrones de diseño y el jefe final.' }
];

/* ================= estado ================= */
let S = null, R = null, editor = null;
try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v === 1) S = j; } catch (e) { /* sin guardado */ }
if (S && !S.color) { S.color = COLORS[0]; S.weapon = WEAPONS[0]; }
if (S) { S.books = S.books || {}; S.learned = S.learned || {}; delete S.runBusy; }
if (S && S.viewV !== 2) { S.view = '3d'; S.viewV = 2; }   // la vista 3D (con personajes ilustrados) es la predeterminada
if (S && !S.hero) { S.hero = 'warrior_f'; S.avatar = '🛡️'; S.weapon = '🗡️'; }
const newState = (name, hero, color) => ({ v: 1, view: '3d', viewV: 2, books: {}, learned: {}, name, hero: heroDef(hero).id, avatar: heroDef(hero).emoji, color: color || COLORS[0], weapon: heroDef(hero).weapon, hp: 100, maxHp: 100, xp: 0, lvl: 1, gold: 20, potions: 1, done: {}, codes: {}, seen: {}, sound: true });
let saveT = null;
const Cloud = window.Cloud || { enabled: false, user: null, save() { }, flush() { return Promise.resolve(); } };
function save() {
  if (S) { S.updated = Date.now(); if (Cloud.user) { S.uid = Cloud.user.uid; Cloud.save(S); } }
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ }
}
function normalizeState(s) {   // completa campos que pueden faltar en partidas antiguas o remotas
  if (!s.color) { s.color = COLORS[0]; s.weapon = WEAPONS[0]; } if (!s.hero) { s.hero = 'warrior_f'; s.avatar = '🛡️'; s.weapon = '🗡️'; }
  s.books = s.books || {}; s.learned = s.learned || {}; delete s.runBusy; if (s.tutDone === undefined) s.tutDone = Object.keys(s.done || {}).length > 0; if (s.viewV !== 2) { s.view = '3d'; s.viewV = 2; } return s;
}
async function adoptCloud() {   // decide qué partida usar al iniciar sesión: la de la nube, la local, o ninguna
  const u = Cloud.user; let remote = null;
  try { remote = await Cloud.fetch(); } catch (e) { console.warn('No se pudo leer la nube:', e); }
  const own = S && S.uid === u.uid, anon = S && !S.uid, foreign = S && S.uid && S.uid !== u.uid;
  if (remote) { normalizeState(remote); S = ((own || anon) && (S.updated || 0) > (remote.updated || 0)) ? S : remote; }
  else if (foreign) S = null;   // el progreso local es de otra cuenta: no se mezcla
  if (S) { S.uid = u.uid; save(); Cloud.flush(); } else { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } }
}
async function bootGame() {
  if (Cloud.enabled) { app.innerHTML = '<div class="title-screen"><h1><img class="logo" src="assets/ui/logo.png" alt="">JavaQuest</h1><div class="sub">Conectando con tu cuenta...</div></div>'; await Cloud.init(); if (Cloud.user) await adoptCloud(); }
  renderTitle();
}
function accountBlock() {
  if (!Cloud.enabled) return '';
  if (Cloud.user) return `<div class="acct"><span>☁️ Sesión de <b>${esc(Cloud.user.name)}</b> · tu progreso se guarda en la nube</span><button class="btn ghost small" data-act="logout">Cerrar sesión</button></div>`;
  return `<div class="acct"><button class="btn google" data-act="google">🔐 Continuar con Google</button> <button class="btn" data-act="emailform">✉️ Entrar o crear cuenta con email</button>
    <div class="small">Con una cuenta puedes seguir tu aventura desde cualquier ordenador o móvil. También puedes jugar sin cuenta (el progreso se queda en este navegador).</div></div>`;
}
function openEmailForm(mode) {
  const create = mode === 'create';
  const p = modal(`<h2>${create ? '✉️ Crear cuenta' : '✉️ Entrar con email'}</h2>
    ${create ? '<input type="text" id="em-name" maxlength="20" placeholder="Tu nombre">' : ''}
    <input type="text" id="em-mail" placeholder="Email" autocomplete="email" style="margin-top:8px"><input type="password" id="em-pass" placeholder="Contraseña (mínimo 6)" autocomplete="${create ? 'new-password' : 'current-password'}" style="margin-top:8px">
    <p class="small" id="em-msg" style="min-height:20px;color:#fca5a5"></p>
    <div class="actions"><button class="btn ghost small" data-act="emailswitch" data-mode="${create ? 'login' : 'create'}">${create ? 'Ya tengo cuenta' : 'Crear una cuenta nueva'}</button>${create ? '' : '<button class="btn ghost small" data-act="emailreset">Olvidé la contraseña</button>'}<button class="btn primary" data-act="emailgo" data-mode="${create ? 'create' : 'login'}">${create ? 'Crear cuenta' : 'Entrar'}</button></div>`);
  return p;
}
function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
const need = l => 100 + (l - 1) * 60;

/* ================= sonido ================= */
let ac = null;
function beep(f, d = 0.09, type = 'square', vol = 0.035, when = 0) {
  if (!S || !S.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol;
    o.connect(g); g.connect(ac.destination); const t = ac.currentTime + when; o.start(t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.stop(t + d);
  } catch (e) { /* sin audio */ }
}
const sfx = {
  hit: () => { beep(330, .07, 'square'); beep(520, .09, 'square', .035, .06); },
  hurt: () => { beep(160, .18, 'sawtooth', .05); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, .16, 'triangle', .05, i * .12)),
  lose: () => [330, 262, 196, 130].forEach((f, i) => beep(f, .22, 'sawtooth', .05, i * .18)),
  click: () => beep(440, .04, 'square', .02)
};


/* ================= sonido de ambiente (generado con Web Audio: sin archivos) ================= */
const Ambient = (() => {
  let ctx = null, master = null, theme = 'crypt', drone = [], filt = null, echo = null;
  const TH = { crypt: [55, 420], forest: [65.4, 760], catacomb: [49, 360], tower: [73.4, 950], fortress: [43.7, 520], abyss: [46.2, 380], throne: [51.9, 620] };
  const MULT = [1, 1.5, 2.01];
  const vol = () => (S && S.ambient === false) ? 0 : (S && typeof S.vol === 'number' ? S.vol : .5);
  function noiseBuf(brown) { const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { l = (l + .02 * w) / 1.02; d[i] = l * 3.5; } else d[i] = w; } return b; }
  function drip() {
    if (!ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = 260 + Math.random() * 220;   // gota grave de agua (nada agudo: parecería un pájaro)
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + .06);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.045, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + .14);
    o.connect(g); g.connect(master); g.connect(echo); o.start(t); o.stop(t + .3); setTimeout(drip, 3500 + Math.random() * 7000);
  }
  function crackle() {   // chasquidos de antorcha
    if (!ctx) return; const t = ctx.currentTime, s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(false); hp.type = 'highpass'; hp.frequency.value = 2500; g.gain.setValueAtTime(.025 + Math.random() * .03, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03 + Math.random() * .05);
    s.connect(hp); hp.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + .1); setTimeout(crackle, 200 + Math.random() * 1500);
  }
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const [root, cut] = TH[theme] || TH.crypt;
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = cut; filt.Q.value = .7; filt.connect(master);
    drone = MULT.map((m, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = i === 0 ? 'sawtooth' : 'sine'; o.frequency.value = root * m; g.gain.value = [.06, .05, .03][i]; o.connect(g); g.connect(filt); o.start(); return o; });
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = cut * .3; lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuf(true); nz.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = .6;
    const ng = ctx.createGain(); ng.gain.value = .2; nz.connect(bp); bp.connect(ng); ng.connect(master); nz.start();
    const wl = ctx.createOscillator(), wg = ctx.createGain(); wl.frequency.value = .11; wg.gain.value = .1; wl.connect(wg); wg.connect(ng.gain); wl.start();
    echo = ctx.createDelay(1); echo.delayTime.value = .42; const fb = ctx.createGain(); fb.gain.value = .38; echo.connect(fb); fb.connect(echo); echo.connect(master);
    setTimeout(drip, 2500); crackle();
  }
  const api = {
    start() { try { if (!ctx) build(); if (ctx.state === 'suspended' && vol() > 0) ctx.resume(); api.apply(); } catch (e) { /* sin audio */ } },
    apply() { if (master) { master.gain.setTargetAtTime(vol(), ctx.currentTime, .6); if (ctx.state === 'suspended' && vol() > 0) ctx.resume(); } },
    setTheme(t) { theme = TH[t] ? t : 'crypt'; if (!ctx) return; const [root, cut] = TH[theme]; drone.forEach((o, i) => o.frequency.setTargetAtTime(root * MULT[i], ctx.currentTime, 2.5)); filt.frequency.setTargetAtTime(cut, ctx.currentTime, 2.5); }
  };
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, function once() { document.removeEventListener(ev, once); api.start(); }));
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (vol() > 0) ctx.resume(); });
  return api;
})();
/* ================= progreso ================= */
const isDone = id => !!S.done[id];
const nodeDone = n => [].concat(n).some(isDone);
function worldUnlocked(w) { if (w.id === worlds[0].id) return true; const pw = worlds.filter(x => x.id < w.id).pop(); return pw ? nodeDone(pw.nodes[pw.nodes.length - 1]) : true; }
function nodeUnlocked(w, i) { if (!worldUnlocked(w)) return false; for (let k = 0; k < i; k++) if (!nodeDone(w.nodes[k])) return false; return true; }
function order() { const o = []; worlds.forEach(w => w.nodes.forEach(n => o.push({ w, n }))); return o; }
function nextLevelAfter(id) {
  const o = order(); const i = o.findIndex(x => [].concat(x.n).includes(id));
  for (let k = i + 1; k < o.length; k++) { const n = [].concat(o[k].n); if (!n.some(isDone)) return n.length === 1 ? n[0] : null; }
  return null;
}
function addXp(n) {
  S.xp += n; let up = 0;
  while (S.xp >= need(S.lvl)) { S.xp -= need(S.lvl); S.lvl++; S.maxHp += 10; S.hp = S.maxHp; up++; }
  return up;
}

/* ================= explicaciones en español ================= */
const EXPL = [
  [/';' expected/, () => 'Falta un punto y coma <code>;</code> al final de una instrucción. Mira la línea indicada (o la anterior).'],
  [/'\)' expected/, () => 'Falta cerrar un paréntesis <code>)</code>. Cuenta que por cada <code>(</code> haya un <code>)</code>.'],
  [/'\(' expected/, () => 'Falta abrir un paréntesis <code>(</code>.'],
  [/'\]' expected/, () => 'Falta cerrar un corchete <code>]</code>.'],
  [/'\{' expected/, () => 'Falta una llave de apertura <code>{</code>.'],
  [/reached end of file while parsing/, () => 'Falta cerrar alguna llave <code>}</code>: has abierto más llaves de las que has cerrado.'],
  [/class, interface, enum, or record expected/, () => 'Sobra una llave <code>}</code> o hay código fuera de una clase.'],
  [/cannot find symbol[\s\S]*variable (\w+)/, m => `Java no conoce la variable <code>${m[1]}</code>. ¿La declaraste antes? ¿Está bien escrita (las mayúsculas cuentan)? Una variable solo existe dentro del bloque <code>{ }</code> donde se declara.`],
  [/cannot find symbol[\s\S]*method (\w+)/, m => `Java no encuentra el método <code>${m[1]}</code> con esos argumentos. Revisa el nombre, los parámetros y a qué objeto/clase pertenece.`],
  [/cannot find symbol[\s\S]*class (\w+)/, m => `Java no conoce la clase <code>${m[1]}</code>. ¿Está bien escrita? Los nombres de clase empiezan en mayúscula.`],
  [/possible lossy conversion from (\w+) to (\w+)/, m => `Estás guardando un <code>${m[1]}</code> en un <code>${m[2]}</code>: se perdería información (los decimales, por ejemplo). Cambia el tipo de la variable o usa un cast: <code>(${m[2]}) valor</code>.`],
  [/incompatible types: (\w+) cannot be converted to boolean/, m => `Una condición necesita un <code>boolean</code> (true/false) y tú le das un <code>${m[1]}</code>. ¿Has escrito <code>=</code> en vez de <code>==</code>?`],
  [/incompatible types: (\S+) cannot be converted to (\S+)/, m => `No puedes guardar un <code>${m[1]}</code> donde se espera un <code>${m[2]}</code>. Los tipos tienen que encajar.`],
  [/might not have been initialized/, () => 'Estás usando una variable a la que todavía no le has dado ningún valor.'],
  [/already defined/, () => 'Ya existe otra variable con ese nombre en este ámbito. Usa otro nombre o quita la declaración repetida.'],
  [/missing return statement/, () => 'Un método que devuelve un valor debe hacer <code>return</code> en <b>todos</b> los caminos posibles.'],
  [/not a statement/, () => 'Eso no es una instrucción válida. ¿Falta una llamada, una asignación o un <code>;</code>?'],
  [/unclosed string literal/, () => 'Falta cerrar unas comillas <code>"</code>.'],
  [/illegal start of expression/, () => 'Java no entiende cómo empieza esa expresión. Suele ser un paréntesis, una llave o un <code>;</code> mal puesto justo antes.'],
  [/<identifier> expected/, () => 'Java esperaba un nombre (de variable, método...) y encontró otra cosa. Suele pasar con instrucciones sueltas fuera de un método.'],
  [/is not abstract and does not override abstract method/, () => 'La clase promete implementar un método (por herencia o interfaz) y no lo hace. Impleméntalo con la misma firma.'],
  [/has private access/, () => 'Ese atributo/método es <code>private</code>: solo se puede usar dentro de su propia clase. Usa un getter/setter.'],
  [/non-static (variable|method).*static context/, () => 'Estás usando algo de un objeto (no estático) desde un método <code>static</code>. Crea un objeto o haz el miembro <code>static</code>.'],
  [/cannot be applied to given types|cannot be applied/, () => 'Estás llamando a un constructor/método con argumentos que no coinciden con los que declara.'],
  [/bad operand types/, () => 'Ese operador no se puede usar con esos tipos (por ejemplo, restar textos o usar <code>&amp;&amp;</code> con números).'],
  [/cannot assign a value to final variable/, () => 'Es <code>final</code> (constante): no se puede cambiar una vez asignada.'],
  [/invalid method declaration; return type required/, () => 'Falta el tipo de retorno del método (<code>void</code>, <code>int</code>...).'],
  [/is abstract; cannot be instantiated/, () => 'No se pueden crear objetos de una clase abstracta o de una interfaz: crea uno de una subclase.'],
  [/no se encontró el método main/, () => 'Falta el punto de entrada: <code>public static void main(String[] args)</code>.'],
  [/incomparable types/, () => 'Estás comparando dos cosas de tipos incompatibles.'],
  [/array required/, () => 'Usas <code>[ ]</code> sobre algo que no es un array.'],
  [/'else' without 'if'/, () => 'Hay un <code>else</code> sin su <code>if</code>. Revisa las llaves y los <code>;</code> tras el if.'],
  [/does not override or implement a method/, () => '<code>@Override</code> indica que redefines un método del padre, pero no existe ese método con esa firma. Revisa el nombre y los parámetros.'],
  [/unexpected type/, () => 'A la izquierda de <code>=</code> debe haber una variable, no un valor.']
];
function explain(msg) { for (const [re, f] of EXPL) { const m = re.exec(msg); if (m) return f(m); } return ''; }
const EXC_EXPL = {
  ArithmeticException: 'Dividiste un número entero entre <b>cero</b>. Con <code>int</code> eso es un error (con <code>double</code> daría Infinity).',
  ArrayIndexOutOfBoundsException: 'Te pasaste del tamaño del array. Los índices van de <b>0</b> a <b>length - 1</b>.',
  StringIndexOutOfBoundsException: 'Pediste una posición del texto que no existe. Las posiciones van de 0 a length()-1.',
  IndexOutOfBoundsException: 'Pediste una posición de la lista que no existe. Va de 0 a size()-1.',
  NullPointerException: 'Intentaste usar algo que vale <code>null</code> (no apunta a ningún objeto). Comprueba que lo has creado/inicializado.',
  NumberFormatException: 'Intentaste convertir a número un texto que no lo es.',
  ClassCastException: 'Intentaste convertir un objeto a un tipo que no es el suyo.',
  StackOverflowError: 'Recursión infinita: tu método se llama a sí mismo sin parar. Te falta un <b>caso base</b> que detenga la recursión.',
  ConcurrentModificationException: 'Modificaste una lista mientras la recorrías con for-each. Usa un Iterator o <code>removeIf</code>.',
  IllegalStateException: 'El programa estaba en un estado en el que esa acción no se permite.',
  IllegalArgumentException: 'Le pasaste a un método un argumento que no acepta.',
  NoSuchElementException: 'Pediste un elemento que no existe (colección vacía, Optional vacío...).',
  UnsupportedOperationException: 'Esa colección es inmutable o de tamaño fijo: no admite añadir/quitar.',
  InputMismatchException: 'Se leyó un dato de un tipo distinto al esperado.',
  NegativeArraySizeException: 'Un array no puede tener tamaño negativo.'
};

/* ================= pantallas ================= */
/* ----- equipo de guerrero (nivel 1): cascos y petos ----- */
const HELMETS = [
  { id: 'w1a', img: 'helm_w1a', name: 'Yelmo de hierro oxidado', def: 1, price: 50 },
  { id: 'w1b', img: 'helm_w1b', name: 'Casco de cúpula remachado', def: 2, price: 90 },
  { id: 'w1c', img: 'helm_w1c', name: 'Casco de visera y cadenas', def: 3, price: 140 },
  { id: 'w1d', img: 'helm_w1d', name: 'Casco astado', def: 4, price: 200 }
];
const CHESTS = [
  { id: 'c1a', img: 'chest_w1a', name: 'Peto agrietado', def: 1, price: 60 },
  { id: 'c1b', img: 'chest_w1b', name: 'Peto de correas cruzadas', def: 2, price: 110 },
  { id: 'c1c', img: 'chest_w1c', name: 'Coraza con faldón', def: 3, price: 170 },
  { id: 'c1d', img: 'chest_w1d', name: 'Armadura de brazos reforzada', def: 4, price: 250 }
];
const GLOVES = [
  { id: 'g1a', img: 'gloves_w1a', name: 'Guanteletes remachados', def: 1, price: 55 },
  { id: 'g1b', img: 'gloves_w1b', name: 'Guanteletes de acero', def: 2, price: 100 },
  { id: 'g1c', img: 'gloves_w1c', name: 'Brazales de placas', def: 3, price: 150 },
  { id: 'g1d', img: 'gloves_w1d', name: 'Brazales plateados', def: 4, price: 220 }
];
const BOOTS = [
  { id: 'b1a', img: 'boots_w1a', name: 'Botas de cuero con puntera', def: 1, price: 50 },
  { id: 'b1b', img: 'boots_w1b', name: 'Botas atadas y remachadas', def: 2, price: 90 },
  { id: 'b1c', img: 'boots_w1c', name: 'Botas altas con correas', def: 3, price: 140 }
];
const LEGS = [
  { id: 'l1a', img: 'legs_w1a', name: 'Pantalones de cuero con rodilleras', def: 1, price: 55 },
  { id: 'l1b', img: 'legs_w1b', name: 'Pantalones reforzados con grebas', def: 2, price: 100 },
  { id: 'l1c', img: 'legs_w1c', name: 'Calzas de cinturones y hombreras', def: 3, price: 150 },
  { id: 'l1d', img: 'legs_w1d', name: 'Grebas de placas remachadas', def: 4, price: 220 }
];
const SLOTS = [['helmet', HELMETS, '🪖 Cascos de guerrero · nivel 1'], ['chest', CHESTS, '🛡️ Petos de guerrero · nivel 1'], ['gloves', GLOVES, '🧤 Guantes y brazales de guerrero · nivel 1'], ['legs', LEGS, '👖 Pantalones de guerrero · nivel 1'], ['boots', BOOTS, '🥾 Botas de guerrero · nivel 1']];
/* el héroe con su equipo puesto: las piezas se colocan encima del dibujo del personaje */
function heroSheet(h) {
  const id = heroDef(S.hero).id, male = /_m$/.test(id), H = curGear('helmet'), C = curGear('chest'), G = curGear('gloves'), B = curGear('boots'), L = curGear('legs');
  const img = (it, x, y, w, cls) => `<img class="gi ${cls}" src="assets/gear/${it.img}.png" alt="${esc(it.name)}" title="${esc(it.name)}" style="left:${x}%;top:${y}%;width:${w}%${hueStyle(it)}">`;
  const half = (it, x, y, w, side) => `<i class="gi gglove" title="${esc(it.name)}" style="left:${x}%;top:${y}%;width:${w}%;background-image:url(assets/gear/${it.img}.png);background-position:${side ? '100%' : '0'} 50%${hueStyle(it)}"></i>`;
  return `<div class="herosheet" style="--h:${h || 340}px"><i class="hsbg" style="background-image:url(assets/sprites/hero_${id}.jpg)"></i><div class="hsin">`
    + (L ? img(L, 47, 71, 74, 'gl').replace('style="', 'style="height:38%;object-fit:fill;') : '') + (B ? half(B, 24, 88, 15, 0) + half(B, 71, 81, 15, 1) : '') + (C ? img(C, 52, 35, 34, 'gc') : '') + (G ? half(G, 76, 36, 14, 1) + half(G, 24, 52, 14, 0) : '') + (H ? img(H, 51.5, male ? 17.5 : 16, 24, 'gh') : '') + '</div></div>';
}
const gear = () => S.gear || (S.gear = { owned: {}, helmet: null, chest: null });
const findGear = id => { for (const s of SLOTS) { const h = s[1].find(x => x.id === id); if (h) return h; } return (S.items || {})[id]; };
const curGear = slot => findGear(gear()[slot]);
const weaponAtk = () => ((curGear('weapon') || {}).atk) || 0;
const hueStyle = it => it && it.hue ? `;filter:drop-shadow(0 2px 3px #000b) hue-rotate(${it.hue}deg)` : '';
const defense = () => SLOTS.reduce((a, s) => a + ((curGear(s[0]) || {}).def || 0), 0);
const helmetIcon = () => !S ? '' : SLOTS.map(s => { const h = curGear(s[0]); return h ? `<img class="helmet-ic" src="assets/gear/${h.img}.png" alt="" title="${esc(h.name)} (defensa +${h.def})">` : ''; }).join('');
/* iconos de la interfaz: imágenes (assets/ui) y dibujos vectoriales */
const uic = n => `<img class="uic" src="assets/ui/${n}.png" alt="">`;
const SVG = {
  heart: '<svg class="uic" viewBox="0 0 24 24"><defs><linearGradient id="gh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a8a"/><stop offset="1" stop-color="#c4162a"/></linearGradient></defs><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" fill="url(#gh)" stroke="#5a0a14" stroke-width="1"/><path d="M7 8.500a2.500 2.500 0 0 1 2.500-1.500" stroke="#fff9" stroke-width="1.400" fill="none" stroke-linecap="round"/></svg>',
  star: '<svg class="uic" viewBox="0 0 24 24"><path d="M12 2l2.500 7.500L22 12l-7.500 2.500L12 22l-2.500-7.500L2 12l7.500-2.500z" fill="#ffe08a" stroke="#a87410" stroke-width="1"/></svg>',
  gear: '<svg class="uic" viewBox="0 0 24 24"><path d="M12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7zm9 4.500v-2l-2.300-.5a7 7 0 0 0-.8-1.900l1.300-2-1.400-1.400-2 1.300a7 7 0 0 0-1.900-.8L13 3h-2l-.5 2.300a7 7 0 0 0-1.900.8l-2-1.300L5.200 6.200l1.300 2a7 7 0 0 0-.8 1.900L3.400 11v2l2.300.5c.2.700.5 1.300.8 1.900l-1.300 2 1.400 1.400 2-1.300c.6.400 1.200.6 1.900.8L11 21h2l.5-2.300c.7-.2 1.300-.5 1.900-.8l2 1.300 1.400-1.400-1.300-2c.4-.6.600-1.200.8-1.900z" fill="#c9c2d8" stroke="#4a4560" stroke-width="1"/></svg>',
  books: '<svg class="uic" viewBox="0 0 24 24"><rect x="3" y="5" width="4.500" height="15" rx="1" fill="#c0392b" stroke="#4a1410"/><rect x="8" y="3" width="4.500" height="17" rx="1" fill="#2e86c1" stroke="#10304a"/><rect x="13" y="6" width="4.500" height="14" rx="1" fill="#27ae60" stroke="#0e3a20"/><rect x="18" y="4" width="3.500" height="16" rx="1" fill="#d4a017" stroke="#4a3608"/></svg>'
};
function topbar(inRoom) {
  if (!S) return ''; document.documentElement.style.setProperty('--aura', S.color || '#a78bfa');
  return `<div class="topbar">
    <div class="who" data-act="custom" title="Personalizar héroe" style="cursor:pointer"><span class="avatar" style="filter:drop-shadow(0 0 8px ${S.color})">${heroFace(S.hero, 44).replace('class="hface"', 'class="hface round"')}</span>${helmetIcon()}<div><div class="nm">${esc(S.name)}</div><div class="lv">Nivel ${S.lvl}</div></div></div>
    <div class="meter hp" title="Vida"><i style="width:${S.hp / S.maxHp * 100}%"></i><span>${SVG.heart}${S.hp}/${S.maxHp}</span></div>
    <div class="meter xp" title="Experiencia"><i style="width:${S.xp / need(S.lvl) * 100}%"></i><span>${SVG.star}${S.xp}/${need(S.lvl)}</span></div>
    <span class="stat">${uic('coin')}${S.gold}</span><span class="stat">${uic('potion')}${S.potions}</span>
    <div class="spacer"></div>
    ${inRoom ? `<button class="btn small" data-act="map">${uic('map')}Mapa</button>` : ''}
    <button class="btn small" data-act="library">${uic('books_spine')}Libros${Object.values(S.books || {}).some(x => x === 'new') ? ' 🔴' : ''}</button>
    <button class="btn small" data-act="grimoire">${uic('grim_icon')}Grimorio</button>
    <button class="btn small" data-act="shop">${uic('potion2')}Tienda</button>
    <button class="btn small" data-act="inventory">🎒 Inventario</button>
    <button class="btn small" data-act="achievements">🏆 Logros</button>
    <button class="btn small setbtn" data-act="settings" title="Ajustes">${uic('gear_brass')}</button>
  </div>`;
}
function refreshTop() { const t = $('.topbar'); if (t) t.outerHTML = topbar(!!$('.room')); }

const CLASSES = [
  { id: 'warrior', name: 'Guerrero', icon: '⚔️', desc: 'Espada o hacha. Lucha cuerpo a cuerpo y aguanta bien los golpes.' },
  { id: 'mage', name: 'Mago', icon: '🔮', desc: 'Báculo arcano. Poder mágico y hechizos a distancia.' },
  { id: 'archer', name: 'Arquero', icon: '🏹', desc: 'Arco. Puntería y rapidez.' },
  { id: 'cleric', name: 'Clérigo', icon: '✨', desc: 'Báculo sagrado. Cura y protege.' }];
const defName = id => /_m$/.test(id || '') ? 'Aventurero' : 'Aventurera';   // nombre por defecto según el género elegido
const isDefName = n => n === 'Aventurera' || n === 'Aventurero';
function pickers(hero, col) {
  const [cl, g] = (hero || 'warrior_f').split('_');
  return `<div class="hpreview">${heroFace(hero || 'warrior_f', 120, 150).replace('class="hface"', 'class="hface" id="hpv"')}<div><b id="hname"></b><div id="clsinfo" class="small"></div></div></div>
    <div class="small">1 · Elige tu clase</div><div class="avatars">${CLASSES.map(c => `<button class="clsbtn ${c.id === cl ? 'sel' : ''}" data-class="${c.id}"><span class="ci"><img class="uic cls ${c.id}" src="assets/ui/${({ warrior: 'swords', mage: 'orb', archer: 'bow', cleric: 'sparkle' })[c.id]}.png" alt=""></span><span>${c.name}</span></button>`).join('')}</div>
    <div class="small">2 · Elige tu género</div><div class="gendercards">${[['f', 'Mujer'], ['m', 'Hombre']].map(([k, n]) => `<button class="gcard ${g === k ? 'sel' : ''}" data-gender="${k}"><span class="gface" data-gk="${k}" style="background-image:url(assets/sprites/hero_${cl}_${k}.jpg)"></span><span class="gname">${n}</span></button>`).join('')}</div>
    <div class="small">3 · Color de tu aura</div><div class="avatars">${COLORS.map((c, i) => `<button class="swatch gem ${c === col ? 'sel' : ''}" data-col="${c}" style="background-image:url(assets/ui/gem${i + 1}.png)" title="Aura ${i + 1}"></button>`).join('')}</div>`;
}
const heroSel = () => { const c = $('[data-class].sel'), g = $('[data-gender].sel'); return c && g ? c.dataset.class + '_' + g.dataset.gender : null; };
function refreshHeroPreview() {   // la vista previa y el texto cambian al elegir clase o género
  const ac = $('[data-col].sel'); if (ac) document.documentElement.style.setProperty('--aura', ac.dataset.col);
  const id = heroSel(); if (!id) return; const d = heroDef(id), pv = $('#hpv'), cl = CLASSES.find(c => c.id === id.split('_')[0]);
  if (pv) pv.style.backgroundImage = `url(assets/sprites/hero_${d.id}.jpg)`; $$('.gface').forEach(f => { f.style.backgroundImage = `url(assets/sprites/hero_${id.split('_')[0]}_${f.dataset.gk}.jpg)`; }); const n = $('#hname'); if (n) n.textContent = d.name; const i = $('#clsinfo'); if (i) i.textContent = cl.desc;
}
const selected = a => { const e = $('[' + a + '].sel'); return e ? e.getAttribute(a) : null; };
function openCustomize() {
  modal(`<h2>🎨 Personaliza a tu héroe</h2><input type="text" id="name2" maxlength="16" value="${esc(S.name)}">
    ${pickers(S.hero, S.color)}<div class="actions"><button class="btn primary" data-act="savecustom">Guardar</button></div>`);
  refreshHeroPreview();
}
function renderTitle() {
  R = null;
  const form = S ? `<p>${/_m$/.test(S.hero || '') ? 'Bienvenido' : 'Bienvenida'} de nuevo, <b>${S.avatar} ${esc(S.name)}</b> · nivel ${S.lvl}</p>
      <button class="btn primary" data-act="map">${uic('swords')}Continuar la aventura</button>
      <p><button class="btn ghost small" data-act="newgame">Empezar una partida nueva</button></p>`
    : `<h3>Crea tu héroe</h3><input type="text" id="name" maxlength="16" placeholder="Tu nombre (si lo dejas vacío: Aventurera/o)" autofocus>
      ${pickers(HEROES[0].id, COLORS[0])}
      <button class="btn primary" data-act="start">${uic('swords')}Entrar en la mazmorra</button>`;
  app.innerHTML = `<div class="title-screen"><h1><img class="logo" src="assets/ui/logo.png" alt="">JavaQuest</h1><div class="sub">Mazmorras del Código · aprende Java derrotando monstruos</div>${accountBlock()}<div class="card">${form}</div>
    <p class="small">${Cloud.user ? 'Tu progreso se guarda automáticamente en la nube.' : 'Tu progreso se guarda automáticamente en este navegador.'}</p></div>`;
  refreshHeroPreview();
}

function stars(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
const MODEL_FILE = { goblin: 'goblin', wolf: 'wolf', troll: 'troll', skeleton: 'skeleton', humanoid: 'mage', thief: 'thief', dragon: 'dragon', naga: 'naga', arachne: 'arachne', zombie: 'zombie' };
function medal(id, st, size) {
  const lv = levels[id], k = KIND[lv.kind] || KIND.puzzle, d = S.done[id], img = `assets/sprites/${MODEL_FILE[lv.foe.model] || 'goblin'}.jpg`;
  return `<button class="medal ${st} ${lv.kind === 'boss' ? 'boss' : ''}" style="--s:${size}px;left:var(--x);top:var(--y)" data-act="open" data-id="${id}" ${st === 'locked' ? 'disabled' : ''} title="${esc(lv.title)} · ${k[1]}">
    <span class="ring"><span class="pic" style="background-image:url(${img})"></span></span>
    ${st === 'locked' ? '<i class="lock">🔒</i>' : ''}${d ? '<i class="check">✔</i>' : ''}${lv.kind === 'boss' ? '<i class="crown">👑</i>' : ''}${st === 'current' ? '<i class="here">▼</i>' : ''}
    <span class="lbl">${esc(lv.title)}</span>${d ? `<span class="stars">${stars(d.stars)}</span>` : `<span class="kind">${k[0]} ${k[1]}</span>`}</button>`;
}
function nextToPlay() { for (const { w, n } of order()) { if (nodeDone(n)) continue; const i = w.nodes.indexOf(n); if (nodeUnlocked(w, i)) return [].concat(n)[0]; } return null; }
function renderMap() {
  Ambient.setTheme('crypt'); R = null; editor = null; d3 = null; stage = null;
  const PER = 4, COLX = [13, 37, 63, 87], RH = 175, total = Object.keys(levels).length, doneAll = Object.keys(S.done).length, nxt = nextToPlay();
  let html = topbar(false) + `<div class="map"><div class="herocard">${heroSheet(110)}<div style="flex:1"><div class="hn">${esc(S.name)} · nivel ${S.lvl}</div>
    <div class="small">Retos completados: ${doneAll} de ${total}</div><div class="wbar big"><i style="width:${doneAll / total * 100}%"></i></div></div>
    ${nxt ? `<button class="btn primary" data-act="open" data-id="${nxt}">▶ Continuar la aventura<br><span class="small" style="color:#4a2b00">${esc(levels[nxt].title)}</span></button>` : '<b>🏆 ¡Has completado todo lo disponible!</b>'}</div>`;
  const curW = (worlds.find(x => worldUnlocked(x) && x.nodes.some(n => !nodeDone(n))) || worlds[worlds.length - 1]).id;   // por defecto solo se despliega el mundo en el que estás
  for (const w of worlds) {
    const isOpen = S.wopen && S.wopen[w.id] !== undefined ? !!S.wopen[w.id] : w.id === curW;
    const unlocked = worldUnlocked(w), doneN = w.nodes.filter(nodeDone).length, rows = Math.ceil(w.nodes.length / PER), H = rows * RH + 20;
    const pos = w.nodes.map((n, i) => { const row = Math.floor(i / PER), c = i % PER, col = row % 2 ? PER - 1 - c : c; return { x: COLX[col], y: row * RH + 88, row }; });
    let current = -1; for (let i = 0; i < w.nodes.length; i++) if (!nodeDone(w.nodes[i])) { current = i; break; }
    let svg = '';
    for (let i = 0; i < w.nodes.length - 1; i++) {
      const a = pos[i], b = pos[i + 1], gold = nodeDone(w.nodes[i]);
      const d = a.row === b.row ? `M${a.x} ${a.y} L${b.x} ${b.y}` : `M${a.x} ${a.y} C${a.x + (a.x > 50 ? 14 : -14)} ${a.y + 70}, ${b.x + (b.x > 50 ? 14 : -14)} ${b.y - 70}, ${b.x} ${b.y}`;
      svg += `<path d="${d}" class="${gold ? 'gold' : ''}"/>`;
    }
    let medals = '';
    w.nodes.forEach((n, i) => {
      const ok = nodeUnlocked(w, i), ids = [].concat(n), p = pos[i];
      ids.forEach((id, j) => {
        const st = S.done[id] ? 'done' : (i === current && ok ? 'current' : ok ? 'open' : 'locked');
        const off = ids.length > 1 ? (j ? 8 : -8) : 0, size = ids.length > 1 ? 70 : (levels[id].kind === 'boss' ? 104 : 86);
        medals += `<div class="slot" style="--x:${p.x + off}%;--y:${p.y}px">${medal(id, st, size)}</div>`;
      });
      if (ids.length > 1) medals += `<div class="forklbl" style="left:${p.x}%;top:${p.y - 62}px">🔀 Elige tu camino</div>`;
    });
    const BANNER_IMG = { 2: 1, 3: 1, 4: 1, 5: 1 }, imgb = !!BANNER_IMG[w.id];   // mundos con cabecera ilustrada (el título va dentro de la imagen)
    html += `<section class="world2 ${w.theme} ${unlocked ? '' : 'locked'}${isOpen ? '' : ' collapsed'}" id="world${w.id}"><div class="wbanner${imgb ? ' imgb' : ''}" data-act="togglew" data-w="${w.id}" title="Pulsa para plegar o desplegar este mundo"><span class="wchev">▾</span>${imgb ? `<img class="wbimg" src="assets/ui/wb_${w.id}.jpg" alt="Mundo ${w.id}: ${esc(w.name)}">` : `<div class="wem">${w.id === 1 ? '<img class="candle" src="assets/ui/candle.png" alt="">' : w.emoji}</div>
      <div class="wtxt"><h2>Mundo ${w.id}: ${esc(w.name)}</h2><p>${esc(w.blurb)}</p></div>`}
      ${unlocked ? `<button class="btn small" data-act="run" data-w="${w.id}" title="Elige puertas sin saber qué hay detrás y escribe las instrucciones Java para actuar">🧭 ${S.run && !S.run.approach && S.run.world === w.id ? 'Continuar exploración' : 'Mazmorra errante'}</button>` : ''}
      <div class="wprog"><div class="wbar"><i style="width:${doneN / w.nodes.length * 100}%"></i></div><span>${unlocked ? doneN + '/' + w.nodes.length : '🔒'}</span></div></div>
      <div class="wmap" style="height:${H}px"><svg viewBox="0 0 100 ${H}" preserveAspectRatio="none">${svg}</svg>${medals}</div>
      ${unlocked ? '' : '<div class="wlock"><span>🔒 Derrota al jefe del mundo anterior para entrar</span></div>'}</section>`;
  }
  for (const c of COMING) html += `<section class="world2 soon"><div class="wbanner imgb"><img class="wbimg" src="assets/ui/wb_${c.id}.jpg" alt="Mundo ${c.id}: ${esc(c.name)} (próximamente)"></div></section>`;
  app.innerHTML = html + '</div>';
  const cur = $('.medal.current'); if (cur && !window.__mapScrolled) { window.__mapScrolled = 1; setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150); }
}

/* ================= sala ================= */
function foeDmg(lv) { return lv.foe.dmg || (6 + lv.world * 2); }
function openLevel(id, fromRun) {
  if (!fromRun && !S.tutDone && id === '1-1') { if (!S.run || !S.run.tut) { S.run = GAME.RUN.generateTutorial(1); save(); } renderRun(); return; }   // la primera vez: tutorial guiado
  const lv = levels[id];
  if (!fromRun && shouldApproach(lv)) { if (!S.run || S.run.approach !== id) startApproach(lv); renderRun(); return; }   // antes de cada reto: elegir puerta
  R = { lv, attempts: 0, fails: 0, hints: 0, solution: false, busy: false, foeMax: 1, foeHp: 1, tab: 'task', tests: [], uses: freshUses(), armed: null, fromRun: !!fromRun, foes: makeFoes(lv), target: 0 };
  renderRoom();
}
function renderRoom() {
  const lv = R.lv, w = worlds.find(x => x.id === lv.world); Ambient.setTheme(w.theme);
  app.innerHTML = topbar(true) + `<div class="room has-side">
    <div class="col">
      ${lv.kind === 'explore' ? `<div class="arena view3d ${w.theme}" id="arena"><canvas id="c3d" width="520" height="320"></canvas></div>` : `<div class="arena ${w.theme}" id="arena">
        <div class="fighter hero" id="fh"><div class="sprite" style="filter:drop-shadow(0 0 14px ${S.color})">${S.avatar}</div><div class="fname">${esc(S.name)}</div><div class="bar hp"><i id="hbar"></i><span id="htxt"></span></div></div>
        <div class="vs">⚔️</div>
        <div class="fighter foe" id="ff"><div class="sprite">${lv.foe.emoji}</div><div class="fname">${esc(lv.foe.name)}</div><div class="bar foebar"><i id="fbar"></i><span id="ftxt"></span></div></div>
      </div>`}
      <div class="skillbar" id="skillbar"></div>
      <div class="foestrip" id="foestrip"></div>
      <div class="orders" id="orders" hidden></div>
    </div>
    <div class="col">
      <div class="tabs"><button data-tab="task">${uic('target')}Misión</button><button data-tab="lesson">${uic('book')}Lección${S.seen[lv.id] ? '' : '<span class="dot"></span>'}</button><button data-tab="hints">${uic('bulb')}Pistas</button></div>
      <div class="info" id="info"></div>
      <div id="coach"></div>
      <div id="editor"></div>
      <div class="toolbar">
        <button class="btn primary" data-act="attack" id="b-attack" title="Comprueba tu programa con las pruebas del reto: cada prueba superada carga un golpe">⚡ Cargar ataque <span class="small" style="color:#4a2b00">(Ctrl+Enter)</span></button>
        <button class="btn" data-act="try" id="b-try">▶ Probar</button>
        <button class="btn" data-act="format" title="Ordena la sangría del código (Ctrl+Shift+F)">⇥ Ordenar código</button>
        <button class="btn" data-act="bigeditor" title="Agranda o reduce la caja del código (también puedes arrastrar su esquina inferior derecha)">⤢ Ampliar editor</button>
        ${lv.kind === 'explore' ? '<button class="btn" data-act="cam" id="b-cam">🎥 Cámara</button>' : ''}
        <button class="btn" data-act="potion" id="b-potion">🧪 Poción</button>
        <button class="btn ghost" data-act="reset">↺ Reiniciar</button>
        <button class="btn ghost" data-act="solution" id="b-sol" disabled>🔓 Solución</button>
      </div>
      <div class="stdinbox" id="stdinbox" hidden><label for="stdin">⌨️ Entrada de teclado (Scanner): una lectura por línea</label><textarea id="stdin" rows="2" spellcheck="false"></textarea></div>
    </div>
    <div class="col side">
      <div class="tests" id="tests"></div>
      <div class="console" id="console"><span class="dim">Aquí aparecerá la salida de tu programa. «▶ Probar» ejecuta sin riesgo; «⚡ Cargar ataque» lanza las pruebas del reto y carga golpes; y tu orden heroe.atacar(n); (escrita dentro de main) lanza los golpes.</span></div>
    </div></div>`;
  editor = window.createEditor($('#editor'), { onRun: attack, onChange: v => { S.codes[lv.id] = v; saveSoon(); toggleStdin(v); } });
  editor.set(S.codes[lv.id] !== undefined ? S.codes[lv.id] : lv.starter);
  toggleStdin(editor.get(), true);
  R.foeMax = Math.max(1, lv.tests.length); R.foeHp = R.foeMax;
  const look = { color: S.color, weapon: S.weapon, avatarIdx: heroDef(S.hero).f ? 1 : 0, hero: S.hero, wp: heroDef(S.hero).wp };
  const use3D = S.view === '3d' && HAS3D;
  d3 = lv.kind === 'explore' ? new (use3D && window.DungeonGL ? window.DungeonGL : window.Dungeon2D)($('#c3d'), lv.tests[0].explore, look, w.theme) : null;
  stage = null;
  if (d3 && d3.setCam) { d3.setCam(S.cam || 'fp', true); const bc = $('#b-cam'); if (bc) bc.textContent = (S.cam || 'fp') === 'fp' ? '🎥 Vista aérea' : '🎥 Primera persona'; }
  if (lv.kind !== 'explore' && (use3D || window.Stage2D)) {
    const cv = document.createElement('canvas'); cv.id = 'stage3d'; $('#arena').prepend(cv); $('#arena').classList.add('has3d');
    stage = use3D ? new window.Stage3D(cv, look, lv.foe.model, lv.kind === 'boss', w.theme, (R.foes || []).slice(1).map(f => f.model)) : new window.Stage2D(cv, look, lv.foe.model, lv.kind === 'boss', w.theme); bindStage(stage); if (use3D) applyArenaBg($('#arena'), w.theme, stage); (R.foes || []).forEach(f => { f._sd = false; }); syncStageFoes();
  }
  setBars(); showTab(lv.guide && !S.done[lv.id] ? 'task' : S.seen[lv.id] ? 'task' : 'lesson'); renderSkillbar(); refreshCoach(); renderFoes(); renderOrders();
  if (lv.kind !== 'explore') addHeroChip($('#arena'));
  if (lv.kind !== 'explore' && !S.combatIntro) { S.combatIntro = true; save(); setTimeout(() => modal(`<h2>⚔️ Así se combate</h2><p>En JavaQuest <b>todo se hace programando</b>: también atacar. Tu programa Java lleva dos partes:</p>
    <ol class="steps"><li><b>Lo que pide el reto</b> (por ejemplo, imprimir unas líneas). Cada prueba que tu programa supera <b>carga un golpe</b>.</li>
    <li><b>La orden de ataque</b>, escrita por ti <b>dentro de <code>main</code></b>, al final: <code>heroe.atacar(1);</code>. Es una llamada a un método del objeto <code>heroe</code>: el número elige a qué enemigo golpeas.</li></ol>
    <p class="small">Pulsa <b>⚡ Cargar ataque</b> (Ctrl+Enter): se comprueba tu programa y, si ordenas atacar, lanzas los golpes que hayas cargado. Después contraatacan los enemigos. Otras órdenes: <code>heroe.defender();</code> (guardia) y <code>heroe.curar();</code> (poción).</p>
    <div class="actions"><button class="btn primary" data-close>Entendido</button></div>`), 400); }
  setTimeout(() => editor.focus(), 50);
}
function setBars() {
  const h = $('#hbar'); if (!h) return;
  h.style.width = (S.hp / S.maxHp * 100) + '%'; $('#htxt').textContent = `${S.hp}/${S.maxHp}`;
  $('#fbar').style.width = (R.foeHp / R.foeMax * 100) + '%'; $('#ftxt').textContent = `${Math.round(R.foeHp / R.foeMax * 100)}%`;
}
function showTab(t) {
  R.tab = t; const lv = R.lv; const info = $('#info');
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  if (t === 'task') info.innerHTML = `<h3>${esc(lv.title)}</h3><p class="story">${lv.story}</p><div class="task"><b>🎯 Tu misión</b><br>${lv.task}</div>${lv.kind !== 'explore' ? '<div class="nextstep" id="nextstep"></div>' : ''}${lv.requireMain ? '<p class="small">Aquí escribes el programa <b>completo</b>: la clase y su <code>main</code> (truco: escribe <code>main</code> + <b>Ctrl+Espacio</b>).</p>' : lv.mode === 'script' ? '<p class="small">Escribe solo las instrucciones: el juego pone el <code>main</code> por ti. Las variables que cita el enunciado ya existen.</p>' : ''}`;
  if (t === 'task') updateNextStep();
  else if (t === 'lesson') { info.innerHTML = lv.lesson; S.seen[lv.id] = true; saveSoon(); const d = $('.tabs .dot'); if (d) d.remove(); }
  else {
    const shown = lv.hints.slice(0, R.hints);
    const ex = lv.example ? `<div class="example"><b>📌 Un ejemplo parecido</b> <span class="small">(no es tu ejercicio: fíjate en cómo está hecho)</span><pre><code>${esc(lv.example)}</code></pre></div>` : '';
    const tok = S.tokens || 0;
    info.innerHTML = `<h3>💡 Pistas</h3>${ex}${shown.map((h, i) => `<div class="hint"><b>Pista ${i + 1}:</b> ${h}</div>`).join('') || '<p class="small">Todavía no has pedido ninguna pista. Intenta primero tú: ¡equivocarse enseña!</p>'}
      ${R.hints < lv.hints.length ? `<button class="btn small" data-act="hint">Pedir otra pista${tok ? ' (gratis: 📜 ' + tok + ')' : ''}</button><p class="small">${tok ? 'Con un pergamino de pista no pierdes estrellas.' : 'Usar pistas reduce las estrellas que ganas (puedes comprar pergaminos en la tienda).'}</p>` : ''}`;
  }
  $$('pre code', info).forEach(c => { c.innerHTML = window.highlightJava(c.textContent); });
  $$('.task code', info).forEach(() => 0);
}
function setBusy(b) { R.busy = b; ['b-attack', 'b-try', 'b-potion'].forEach(id => { const e = $('#' + id); if (e) e.disabled = b; }); const s = $('#b-sol'); if (s) s.disabled = b || R.fails < 2; }

function consoleHtml(html) { const c = $('#console'); if (c) { c.innerHTML = html; c.scrollTop = 0; } }
/* guía interactiva (retos iniciales y tutorial): una idea por pantalla y un botón «Siguiente» */
let coachSt = { id: '', i: 0 };
const coachHtml = g => {
  if (coachSt.id !== g.title) coachSt = { id: g.title, i: 0 };
  const n = g.pages.length, i = Math.min(coachSt.i, n - 1);
  return `<div class="coach"><div class="ch"><span>🧭 ${g.title}</span><span class="cstep">Paso ${i + 1} de ${n}</span></div><div class="cdots">${g.pages.map((_, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join('')}</div><div class="cpage">${g.pages[i]}</div>
    <div class="cnav">${i > 0 ? '<button class="btn small" data-act="coachnav" data-dir="-1">◀ Anterior</button>' : '<span></span>'}${i < n - 1 ? '<button class="btn small cnext" data-act="coachnav" data-dir="1">Siguiente ▶</button>' : '<span class="small cdone">✋ Ahora te toca a ti</span>'}</div></div>`;
};
function coachNav(d) { coachSt.i = Math.max(0, coachSt.i + d); if (S.run && $('#runstatus')) renderRunStatus(); else refreshCoach(); }
function insertCode(code, replace) {
  if (!editor) return; const keep = replace ? '' : editor.get().split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).join('\n');
  editor.set((keep ? keep + '\n' : '') + code + '\n'); editor.focus();
}
function refreshCoach() {
  const c = $('#coach'); if (!c || !R) return; const g = R.lv.guide;
  c.innerHTML = g && !S.done[R.lv.id] ? coachHtml(g) : ''; $$('code', c).forEach(x => { x.innerHTML = window.highlightJava(x.textContent); });
}
function compileHtml(c) {
  let h = `<div class="err"><b>❌ Error de compilación</b>${c.line ? ` · línea ${c.line}` : ''}</div><div class="err">${esc(c.msg)}</div>`;
  if (R && R.lv && R.lv.guide && R.lv.guide.error && !S.done[R.lv.id]) h += `<div class="explain">🧭 ${R.lv.guide.error}</div>`;
  const ex = explain(c.msg);
  if (c.harness) h = `<div class="err"><b>❌ Tu código no tiene lo que la prueba necesita</b></div><div class="err">${esc(c.msg)}</div><div class="explain">La prueba intenta usar tu código (por ejemplo llamando a un método o creando una clase) y no lo encuentra tal como se pide. Revisa que los <b>nombres, parámetros y tipos</b> coincidan con el enunciado.</div>`;
  else if (ex) h += `<div class="explain">💡 ${ex}</div>`;
  return h;
}
function segsHtml(segs) { return segs.map(s => `<span class="${s.err ? 'err' : ''}">${esc(s.s)}</span>`).join(''); }
function exceptionHtml(e) {
  const x = EXC_EXPL[e.cls];
  return `<div class="err"><b>💥 Excepción en tiempo de ejecución</b></div><div class="err">Exception in thread "main" ${esc(e.msg)}${e.line && e.line < 100000 ? `\n\tat Main.main(Main.java:${e.line})` : ''}</div>${x ? `<div class="explain">💡 ${x}</div>` : ''}`;
}
function eventsText(ev) {
  if (!ev || !ev.length) return '';
  return '\n<span class="dim">── Registro del combate ──</span>\n' + ev.map(e => e.t === 'hero' ? `⚔️ Golpeas: -${e.dmg}  (enemigo: ${e.enemyHp})` : e.t === 'enemy' ? `🩸 Te golpean: -${e.dmg}  (tu vida: ${e.heroHp})` : e.t === 'heal' ? `🧪 Te curas +${e.dmg}  (tu vida: ${e.heroHp})` : e.t === 'flee' ? '🏃 ¡Huyes del combate!' :
    e.t === 'move' ? `👣 Avanzas a (${e.x}, ${e.y})` : e.t === 'turn' ? `↻ Giras hacia ${'ESON'[e.dir]}` : e.t === 'bump' ? '💥 ¡Chocas contra algo!' :
    e.t === 'attack' ? (e.hit ? (e.killed ? '⚔️ ¡Derrotas al enemigo!' : '⚔️ Golpeas al enemigo') : '⚔️ Golpe al aire') : e.t === 'hurt' ? `🩸 Te golpean: -${e.dmg} (vida: ${e.hp})` :
    e.t === 'open' ? '🚪 Abres la puerta' : e.t === 'pickup' ? '💰 Recoges el tesoro' : e.t === 'exit' ? '🌀 ¡Llegas a la salida!' : '… ' + (e.text || '')).join('\n');
}

/* ----- Probar sin consecuencias ----- */
function toggleStdin(code, init) {   // si el programa usa Scanner, aparece la caja de entrada de teclado
  const b = $('#stdinbox'); if (!b) return; const on = /Scanner/.test(code); b.hidden = !on; const ta = $('#stdin');
  if (on && ta && (init || !ta.value)) { const t = (R.lv.tests.find(t => t.stdin) || {}); if (!ta.value && t.stdin) ta.value = t.stdin.replace(/\n+$/, ''); }
}
function mainMissing(lv, code) {   // en los primeros retos hay que escribir el programa completo, con su main
  if (!lv.requireMain || /\bvoid\s+main\s*\(/.test(code)) return false;
  consoleHtml(`<div class="err"><b>❌ Falta el método main</b></div><div class="explain">🧭 Todo programa Java empieza en <code>public static void main(String[] args)</code>, dentro de una clase. Escribe <b><code>main</code></b> en el editor y pulsa <b>Ctrl + Espacio</b>: se rellena solo. Después escribe tus órdenes dentro de las llaves.</div>`);
  $$('#console code').forEach(c => { c.innerHTML = window.highlightJava(c.textContent); }); return true;
}
/* el objeto «heroe» dentro del programa: en las pruebas y en «Probar» no hace nada (solo existe para que compile);
   al cargar el ataque se ejecuta una vez de verdad y sus órdenes se aplican al combate */
const silentHeroe = () => JV.native('Heroe', { atacar: () => {}, defender: () => {}, curar: () => {}, ayuda: () => {}, getEnemigos: () => 0 });
function collectOrders(lv, code) {
  const calls = [], st = { guard: false, heal: 0 };
  const alive = () => R.foes.filter(f => !(f.max && f.hp <= 0)).length;
  const heroe = JV.native('Heroe', {
    atacar: (a, I) => { const n = a.length ? a[0] : R.target + 1; if (typeof n !== 'number') I.throwJ('IllegalArgumentException', 'atacar() necesita el número del enemigo (un int)'); if (n < 1 || n > R.foes.length) I.throwJ('IllegalArgumentException', `No existe el enemigo ${n}: hay ${R.foes.length} (de 1 a ${R.foes.length})`); const f = R.foes[n - 1]; if (f.max && f.hp <= 0) I.throwJ('IllegalStateException', `El enemigo ${n} ya está derrotado`); calls.push(n - 1); },
    defender: () => { st.guard = true; },
    curar: () => { st.heal++; },
    ayuda: () => {}, getEnemigos: alive
  });
  const res = JV.runFree(lv, code, '', { heroe });
  return { calls, guard: st.guard, heal: st.heal, error: res.error && res.error.type !== 'compile' ? res.error : null };
}
function tryRun() {
  if (R.busy) return;
  const lv = R.lv, code = editor.get(); S.codes[lv.id] = code; save(); if (mainMissing(lv, code)) return;
  const t = lv.tests.find(t => !t.hidden) || lv.tests[0] || {};
  const sin = $('#stdin') && !$('#stdinbox').hidden ? $('#stdin').value.replace(/\n?$/, '\n') : ''; const res = JV.runFree(lv, code, sin.trim() ? sin : '', { heroe: silentHeroe() });
  $('#tests').innerHTML = '';
  if (res.error && res.error.type === 'compile') {
    const harness = res.error.line >= 100000;
    consoleHtml(compileHtml({ msg: res.error.msg, line: harness ? 0 : res.error.line, harness }));
    if (!harness) editor.setError(res.error.line); return;
  }
  let h = '';
  if (t.vars) h += `<div class="dim">Probando con: ${Object.keys(t.vars).map(k => `${k} = ${esc(JSON.stringify(typeof t.vars[k] === 'object' && !Array.isArray(t.vars[k]) ? (t.vars[k].double !== undefined ? t.vars[k].double : t.vars[k].char) : t.vars[k]))}`).join(', ')}</div>`;
  h += res.out || res.segs.length ? segsHtml(res.segs) : '<span class="dim">(tu programa no ha imprimido nada)</span>';
  if (lv.mode === 'class') h = `<div class="dim">Probando con:\n${esc(lv.free || (t.snippet || ''))}</div>` + h;
  h += eventsText(res.events);
  if (res.error) h += '\n' + exceptionHtml(res.error);
  consoleHtml(h);
  if (d3 && res.explore) { setBusy(true); playExplore({ explore: res.explore, events: res.events }).then(() => setBusy(false)); }
}

/* ----- Atacar: ejecuta las pruebas con consecuencias ----- */
function renderTests(tests) {
  $('#tests').innerHTML = tests.map((t, i) => `<div class="test" data-i="${i}" id="t${i}"><span>⏳</span><span>${t.hidden ? '🔒 Prueba oculta' : esc(t.name)}</span></div>`).join('');
}
function failDetail(t) {
  if (t.msg) return esc(t.msg);
  if (t.expected !== undefined) {
    let h = `<b>esperado:</b> ${esc(clip(t.expected))}\n<b>obtenido:</b> ${esc(clip(t.got))}`; const e = String(t.expected), g = String(t.got);
    if (e !== g && e.toLowerCase() === g.toLowerCase()) h += '\n<span class="dim">💡 Solo cambian las <b>mayúsculas/minúsculas</b>. En Java el texto entre comillas se compara letra por letra: <code>"Nombre"</code> y <code>"nombre"</code> son textos distintos. (No confundas el texto con el nombre de la variable, que puede ir en minúscula.)</span>';
    else if (e !== g && e.replace(/\s+/g, '') === g.replace(/\s+/g, '')) h += '\n<span class="dim">💡 Solo cambian los <b>espacios</b>: revisa los espacios dentro de las comillas.</span>';
    return h;
  }
  return '';
}
const clip = s => { s = String(s); const l = s.split('\n'); return (l.length > 8 ? l.slice(0, 8).join('\n') + '\n…' : s).slice(0, 400); };
function floatAt(el, txt, cls) {
  const a = $('#arena'); if (!a || !el) return; const r = el.getBoundingClientRect(), ar = a.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'float ' + cls; f.textContent = txt;
  f.style.left = (r.left - ar.left + r.width / 2 - 14) + 'px'; f.style.top = (r.top - ar.top + 10) + 'px'; a.appendChild(f); setTimeout(() => f.remove(), 1000);
}
async function anim(el, cls, ms) { el.classList.add(cls); await sleep(ms); el.classList.remove(cls); }

/* ----- varios enemigos, turno enemigo y órdenes por comando ----- */
const EXTRA_FOES = [['wolf', 'Lobo'], ['goblin', 'Goblin'], ['skeleton', 'Esqueleto'], ['thief', 'Ladrón'], ['zombie', 'Zombi'], ['arachne', 'Araña']];
/* mundo 1: enemigos de uno en uno · mundo 2: hasta 2 · desde el 3: los jefes llevan 3 */
function makeFoes(lv) {
  const main = { model: lv.foe.model || 'goblin', name: lv.foe.name, dmg: foeDmg(lv), hp: null, max: null };
  const n = lv.world === 1 ? 1 : lv.kind === 'boss' ? (lv.world === 2 ? 2 : 3) : (lv.kind === 'combat' || lv.kind === 'trap') ? 2 : 1, seed = [...lv.id].reduce((a, c) => a + c.charCodeAt(0), 0), list = [main];
  for (let i = 1; i < n; i++) { let e = EXTRA_FOES[(seed + i * 2) % EXTRA_FOES.length]; if (e[0] === main.model) e = EXTRA_FOES[(seed + i * 2 + 1) % EXTRA_FOES.length]; list.push({ model: e[0], name: e[1] + (lv.kind === 'boss' ? ' guardián' : ' aliado'), dmg: Math.max(3, Math.ceil(main.dmg * 0.6)), hp: null, max: null }); }
  return list;
}
function allocFoes(n) {   // reparte las pruebas (golpes necesarios) entre los enemigos
  const F = R.foes; if (F[0].max !== null && F.reduce((a, f) => a + f.max, 0) === n) return;
  if (n < F.length) F.length = Math.max(1, n);
  const base = Math.floor(n / F.length), rem = n % F.length; F.forEach((f, i) => { f.max = base + (i < rem ? 1 : 0); f.hp = f.max; });
  if (R.target >= F.length) R.target = 0;
}
const foesLeft = () => R.foes.reduce((a, f) => a + Math.max(0, f.hp === null ? 1 : f.hp), 0);
function hitTarget() { const f = R.foes[R.target], tg = f && f.hp > 0 ? f : R.foes.find(x => x.hp > 0); if (tg) tg.hp--; }
function healFoe() { const f = R.foes[R.target], w = f && f.hp < f.max ? f : R.foes.find(x => x.hp < x.max); if (w) w.hp++; }
function syncStageFoes() {   // en el escenario 3D, los enemigos derrotados caen y los que reviven se levantan
  if (!stage || !stage.foes || stage.foes.length < 2 || !R.foes) return;
  R.foes.forEach((f, i) => { const dead = !!(f.max && f.hp <= 0); if (dead && !f._sd) { f._sd = true; stage.dieFoe(i); } else if (!dead && f._sd) { f._sd = false; stage.foeAt(i).userData.anim.dead = 0; } });
}
function syncFoes() { if (R.foes[0].max !== null) R.foeHp = foesLeft(); setBars(); renderFoes(); syncStageFoes(); }
function renderFoes() {
  const box = $('#foestrip'); if (!box || !R || !R.foes || R.foes.length < 2) { if (box) box.innerHTML = ''; return; }
  box.innerHTML = `<div class="fhead">Enemigos · objetivo: <b>${R.target + 1}</b></div>` + R.foes.map((f, i) => `<div class="fcard ${i === R.target ? 'tgt' : ''} ${f.max && f.hp <= 0 ? 'dead' : ''}" data-act="target" data-i="${i}" title="Pulsa o escribe heroe.atacar(${i + 1});"><span class="fnum">${i + 1}</span><img src="assets/sprites/${MODEL_FILE[f.model] || 'goblin'}.jpg" alt=""><div class="fi"><b>${esc(f.name)}</b><div class="bar foebar"><i style="width:${f.max ? Math.max(0, f.hp) / f.max * 100 : 100}%"></i></div></div></div>`).join('');
}
function renderOrders() {
  const box = $('#orders'); if (box) { box.hidden = true; box.innerHTML = ''; } return;   /* las órdenes ya no tienen caja aparte: se escriben dentro del programa */
  if (!box || !R || !R.foes || R.lv.kind === 'explore') return; box.hidden = false;
  box.innerHTML = `<label for="order">🎮 Órdenes de combate <span class="small">1) carga golpes con tu programa (⚡ Cargar ataque) · 2) ordena el golpe con un comando</span></label><div class="orow"><input id="order" type="text" spellcheck="false" autocomplete="off" placeholder="heroe.atacar(1);"><button class="btn small" data-act="order">Dar orden</button><button class="btn small primary" data-act="quickattack">⚔️ Atacar</button></div>
    <div class="small"><code>heroe.atacar(n);</code> elige a quién golpear · <code>heroe.defender();</code> guardia · <code>heroe.curar();</code> poción · <code>heroe.ayuda();</code></div>`;
}
async function enemyTurn(armed, fails, ff, fh) {
  const alive = R.foes.filter(f => f.hp > 0); if (!alive.length) return '';
  const parts = alive.map(f => ({ f, d: Math.max(2, Math.round(f.dmg * 0.55 * (1 + 0.15 * Math.min(fails, 5)))) }));
  const def = defense(); let total = Math.max(1, Math.min(parts.reduce((a, p) => a + p.d, 0), Math.floor(S.maxHp * 0.3)) - def), note = def ? ` <span class="dim">(🪖 tu equipo absorbe ${def})</span>` : '';
  if (armed === 'guard') { total = Math.ceil(total / 2); note = ' <span class="okk">🛡️ ¡Tu guardia reduce el daño a la mitad!</span>'; }
  else if (armed === 'second') { total = Math.max(0, total - parts[0].d); note = ' <span class="okk">🔁 Esquivas el primer golpe.</span>'; }
  ff.classList.add('attack'); await sleep(340); ff.classList.remove('attack'); anim(fh, 'hit', 350);
  S.hp = Math.max(0, S.hp - total); sfx.hurt(); floatAt($('.sprite', fh), total ? '-' + total : '🕊️', total ? 'dmg' : 'ok'); setBars(); refreshTop();
  const names = parts.map(p => esc(p.f.name)).join(' y ');
  return `\n💥 <b>${names}</b> ${parts.length > 1 ? 'atacan' : 'ataca'}: <b>-${total}</b> de vida.${note}${armed ? '' : ` <span class="dim">(Prepara «${esc(skillDef('guard').name)}» antes de atacar para recibir la mitad.)</span>`}`;
}
function runOrder() {
  if (!R || R.busy || !R.foes) return; const inp = $('#order'); if (!inp) return; const code = inp.value.trim(); if (!code) return;
  const heroe = JV.native('Heroe', {
    atacar: (a, I) => { const n = a.length ? a[0] : R.target + 1; if (typeof n !== 'number') I.throwJ('IllegalArgumentException', 'atacar() necesita el número del enemigo (un int)'); if (n < 1 || n > R.foes.length) I.throwJ('IllegalArgumentException', `No existe el enemigo ${n}: hay ${R.foes.length} (de 1 a ${R.foes.length})`); const f = R.foes[n - 1]; if (f.max && f.hp <= 0) I.throwJ('IllegalStateException', `El enemigo ${n} ya está derrotado`); R.target = n - 1; R.doAttack = true; I.write(`Apuntas a ${f.name}.\n`); },
    defender: (a, I) => { if (knownSkill('guard') && R.uses.guard > 0) { R.armed = 'guard'; I.write('Preparas la guardia: recibirás la mitad de daño en la próxima ronda.\n'); } else I.write('Ya no te quedan usos de guardia en este reto.\n'); },
    curar: (a, I) => { if (S.potions <= 0) I.write('No te quedan pociones.\n'); else if (S.hp >= S.maxHp) I.write('Ya tienes la vida completa.\n'); else { S.potions--; S.hp = Math.min(S.maxHp, S.hp + 40); save(); I.write('Bebes una poción: +40 de vida.\n'); } },
    ayuda: (a, I) => { I.write('heroe.atacar(n);   elige a qué enemigo golpear (de 1 a ' + R.foes.length + ')\nheroe.defender();  prepara la guardia\nheroe.curar();     bebe una poción\n'); },
    getEnemigos: () => R.foes.filter(f => !(f.max && f.hp <= 0)).length
  });
  const res = JV.run({ code, globals: { heroe } });
  if (res.error && res.error.type === 'compile') consoleHtml(compileHtml({ msg: res.error.msg, line: 0 }));
  else { let h = res.segs.length ? segsHtml(res.segs) : ''; if (res.error) h += (h ? '\n' : '') + exceptionHtml(res.error); consoleHtml(h || '<span class="dim">Esa orden no hizo nada. Prueba heroe.ayuda();</span>'); }
  inp.value = ''; renderSkillbar(); renderFoes(); setBars(); refreshTop();
  if (R.doAttack) { R.doAttack = false; doAttack(); }
}
function showSkillBookInfo() {}
/* «siguiente paso» dentro de la Misión: qué hacer ahora (cargar ataque u ordenar el golpe) */
function updateNextStep() {
  const box = $('#nextstep'); if (!box || !R || R.lv.kind === 'explore') return;
  const res = R.lastRes, charges = res ? Math.max(0, res.passed - (R.spent || 0)) : 0;
  let h;
  if (!res) h = '<b>👉 Siguiente paso:</b> escribe tu programa en el editor. <b>Al final de <code>main</code> añade la orden de ataque</b> <code>heroe.atacar(1);</code> y pulsa <b>⚡ Cargar ataque</b>: cada prueba superada carga un golpe y tu orden lo lanza.';
  else if (charges > 0) h = `<b>⚡ Tienes ${charges} ${charges === 1 ? 'golpe cargado' : 'golpes cargados'} sin lanzar.</b> Tu programa no ordenó atacar: añade <code>heroe.atacar(${R.target + 1});</code> al final de <code>main</code> y vuelve a pulsar <b>⚡ Cargar ataque</b>.${res.passed < res.total ? ` (Te faltan ${res.total - res.passed} pruebas por superar.)` : ''}`;
  else h = '<b>🔧 Todavía no has superado ninguna prueba:</b> mira la lista de la derecha, corrige tu programa y vuelve a pulsar <b>⚡ Cargar ataque</b>. Recuerda mantener <code>heroe.atacar(1);</code> al final de <code>main</code>.';
  box.innerHTML = h; const ob = $('#orders'); if (ob) ob.classList.toggle('pulse', charges > 0);
}
/* las órdenes de combate (heroe.atacar...) no van en el editor de Java */
function heroeInEditor(code) {
  if (!/(^|[^\w.])heroe\s*\./.test(code.replace(/\/\/.*$/gm, ''))) return false;
  consoleHtml('<span class="err"><b>Esa orden no va en el editor de Java.</b></span><br>Las órdenes de combate (<code>heroe.atacar(1);</code>) se escriben en la caja <b>«🎮 Órdenes de combate»</b>, debajo de la escena. En el editor solo va el programa del reto.');
  $$('#console code').forEach(c => { c.innerHTML = window.highlightJava(c.textContent); });
  return true;
}async function attack() {
  if (R.busy) return;
  const lv = R.lv, code = editor.get(); S.codes[lv.id] = code; save(); if (mainMissing(lv, code)) return;
  setBusy(true);
  let res;
  try { res = JV.runLevel(lv, code, { extraGlobals: { heroe: silentHeroe() } }); } catch (e) { consoleHtml(`<div class="err">Error interno del juego: ${esc(e.stack || e)}</div>`); setBusy(false); return; }
  if (res.compile) {
    $('#tests').innerHTML = ''; consoleHtml(compileHtml(res.compile) + '<div class="dim" style="margin-top:8px">No pierdes vida por errores de compilación: ¡corrige y vuelve a intentarlo!</div>');
    if (res.compile.line) editor.setError(res.compile.line); setBusy(false); return;
  }
  editor.setError(0);
  R.attempts++; const armed = R.armed === 'power' ? 'power' : null; if (armed) { R.armed = null; R.uses.power--; } R.powered = armed === 'power';   /* guardia y segundo aliento se quedan preparadas hasta la orden de atacar */ renderSkillbar(); R.tests = res.tests; R.foeMax = Math.max(1, res.tests.length); allocFoes(res.tests.length); const prevSet = R.passed || new Set(); syncFoes();   // los enemigos conservan el daño de los intentos anteriores
  renderTests(res.tests);
  const fh = el('#fh'), ff = el('#ff'), n = res.tests.length, fails = res.tests.filter(t => !t.ok).length;
  const delay = n > 12 ? 90 : n > 6 ? 180 : 340;
  if (d3) { await playExplore(res.tests.find(t => !t.ok && t.explore) || res.tests[0]); }
  for (let i = 0; i < n; i++) {   // se revisan las pruebas una a una: cada prueba superada carga un golpe
    const t = res.tests[i], row = $('#t' + i);
    row.classList.add('run'); await sleep(delay / 2);
    if (t.ok) { if (!prevSet.has(i)) { sfx.hit(); floatAt($('.sprite', fh), '⚡', 'ok'); } await sleep(delay / 2); }
    row.classList.remove('run'); row.classList.add(t.ok ? 'pass' : 'fail');
    row.innerHTML = `<span>${t.ok ? '✅' : '❌'}</span><span>${t.hidden ? '🔒 Prueba oculta' : esc(t.name)}</span>${t.ok ? '' : `<div class="why">${failDetail(t)}</div>`}`;
    await sleep(delay / 4);
  }
  R.lastRes = res; R.passed = new Set(res.tests.map((x, k) => x.ok ? k : -1).filter(k => k >= 0)); updateNextStep();
  const charges = Math.max(0, res.passed - (R.spent || 0)), out = outputBlock(res);
  save();
  const ord = collectOrders(lv, code);   // las órdenes (heroe.atacar...) escritas dentro del programa
  if (ord.heal) for (let k = 0; k < ord.heal; k++) { if (S.potions > 0 && S.hp < S.maxHp) { S.potions--; S.hp = Math.min(S.maxHp, S.hp + 40); } } if (ord.heal) { save(); setBars(); refreshTop(); }
  if (ord.guard && knownSkill('guard') && R.uses.guard > 0) { R.armed = 'guard'; renderSkillbar(); }
  const orderNote = ord.error ? `\n${exceptionHtml(ord.error)}` : '';
  if (res.passed === res.total) {
    consoleHtml(`<span class="okk"><b>✔ ¡Tu programa pasa todas las pruebas!</b></span>${out}${orderNote}` + (ord.calls.length && !ord.error ? `\n<div class="explain">⚡ Tienes <b>${charges}</b> ${charges === 1 ? 'golpe cargado' : 'golpes cargados'} y tu programa ordena atacar: ¡allá van!</div>` : `\n<div class="explain">⚡ Tienes <b>${charges}</b> ${charges === 1 ? 'golpe cargado' : 'golpes cargados'}, pero <b>tu programa no ordena ningún ataque</b>. Añade dentro de <code>main</code>, al final, la orden <code>heroe.atacar(${R.target + 1});</code> y vuelve a pulsar ⚡ Cargar ataque.</div>`));
    $$('#console code').forEach(c => { c.innerHTML = window.highlightJava(c.textContent); });
  } else {
    R.fails++;
    const first = res.tests.find(t => !t.ok);
    let h = `<b>${res.passed}/${res.total}</b> pruebas superadas. ¡Casi! Revisa las que fallan (haz clic en una prueba para ver su salida).`;
    if (first && first.error && first.error.type === 'exception') h += '\n' + exceptionHtml(first.error);
    else if (first && first.error && first.error.type === 'timeout') h += `\n<div class="err">⏱️ ${esc(first.error.msg)}</div>`;
    h += out + orderNote + `\n<span class="dim">⚡ Llevas <b>${charges}</b> ${charges === 1 ? 'golpe cargado' : 'golpes cargados'}${ord.calls.length && !ord.error ? ' y tu programa ordena atacar: lanzas los golpes que tienes, pero los enemigos contraatacarán. Corrige las pruebas que fallan para cargar más.' : '. Recuerda que tu programa debe incluir <code>heroe.atacar(n);</code> dentro de main para lanzarlos.'}</span>`;
    consoleHtml(h);
    if (R.fails >= 2) { const s = $('#b-sol'); if (s) s.disabled = false; }
  }
  setBusy(false);
  if (ord.calls.length && !ord.error) await doAttack(ord.calls);
}
/* salida del programa del jugador (lo que ha impreso), para que se vea qué hace su código */
function outputBlock(res) {
  const t = res.tests.find(x => !x.hidden && x.segs && x.segs.length) || res.tests.find(x => x.segs && x.segs.length);
  return t ? `\n<span class="dim">── Salida de tu programa ──</span>\n${segsHtml(t.segs)}` : '';
}
/* orden de ataque: gasta los golpes cargados contra el enemigo elegido y luego contraatacan los enemigos */
async function doAttack(calls) {
  if (!R || R.busy || !R.foes) return;
  if (!R.lastRes) { consoleHtml('<span class="err">Aún no has cargado ningún golpe.</span> Escribe tu programa y pulsa <b>«⚡ Cargar ataque»</b> (Ctrl+Enter) primero.'); return; }
  setBusy(true);
  const fh = el('#fh'), ff = el('#ff'), res = R.lastRes, charges = Math.max(0, res.passed - (R.spent || 0));
  const armed = R.armed; R.armed = null; if (armed) R.uses[armed]--; renderSkillbar();
  const tl = calls && calls.length ? calls : [R.target];   // los golpes se reparten entre los heroe.atacar(n) del programa
  R.target = tl[tl.length - 1]; const names = [...new Set(tl)].map(i => R.foes[i] ? esc(R.foes[i].name) : '?').join(' y ');
  consoleHtml(`⚔️ Tu programa ordena atacar a <b>${names}</b> con <b>${charges}</b> ${charges === 1 ? 'golpe' : 'golpes'}...`);
  for (let k = 0; k < charges && foesLeft() > 0; k++) { let ti = tl[k % tl.length]; if (!R.foes[ti] || R.foes[ti].hp <= 0) ti = R.foes.findIndex(f => f.hp > 0); R.target = ti < 0 ? 0 : ti; hitTarget(); sfx.hit(); fh.classList.add('attack'); await sleep(240); fh.classList.remove('attack'); if (stage && stage.hurtFoe && stage.foes && stage.foes.length > 1) stage.hurtFoe(R.target); else anim(ff, 'hit', 300); floatAt($('.sprite', ff), '⚔️', 'ok'); syncFoes(); await sleep(120); }
  R.spent = (R.spent || 0) + charges; updateNextStep();
  if (foesLeft() <= 0) { await victory(res); setBusy(false); return; }
  const fails = Math.max(1, res.total - res.passed), ehtml = await enemyTurn(armed, fails, ff, fh);
  consoleHtml((charges ? `Tus golpes han hecho daño. Quedan <b>${R.foes.filter(f => f.hp > 0).length}</b> enemigo(s).` : '<span class="err">Tu programa aún no funciona: no tenías ningún golpe cargado.</span>') + ehtml);
  if (S.hp <= 0) { save(); await defeat(); setBusy(false); return; }
  save(); setBusy(false);
}
function showTestDetail(i) {
  const t = R && R.tests && R.tests[i]; if (!t) return;
  if (d3 && t.explore && !R.busy) playExplore(t);
  let h = `<b>${t.hidden ? 'Prueba oculta' : esc(t.name)}</b> ${t.ok ? '<span class="okk">✔ superada</span>' : '<span class="err">✘ fallida</span>'}\n`;
  if (!t.ok) h += failDetail(t) + '\n';
  h += `\n<span class="dim">── Salida de tu programa ──</span>\n` + (t.segs && t.segs.length ? segsHtml(t.segs) : '<span class="dim">(sin salida)</span>');
  h += eventsText(t.events);
  if (t.error && t.error.type === 'exception') h += '\n' + exceptionHtml(t.error);
  consoleHtml(h);
}

async function defeat() {
  sfx.lose(); el('#ff').classList.add('win'); el('#fh').classList.add('dead');
  await sleep(700);
  const lost = Math.floor(S.gold * 0.15);
  S.hp = S.maxHp; S.gold -= lost; R.fails++; R.passed = new Set(); R.spent = 0; R.lastRes = null; (R.foes || []).forEach(f => { f.hp = f.max; }); save(); refreshTop(); updateNextStep();
  await modal(`<h2>💀 Has caído...</h2><p>Los golpes de <b>${esc(R.lv.foe.name)}</b> fueron demasiado. Despiertas junto a una hoguera, con todos los huesos... más o menos en su sitio.</p>
    <p>Pierdes <b>${lost} 🪙</b> en el apuro, pero recuperas toda tu vida. <b>Cada error enseña algo</b>: lee qué pruebas fallan y qué esperaba el juego.</p>
    <div class="actions"><button class="btn primary" data-close>Volver a intentarlo</button></div>`);
  renderRoomKeep();
}
function renderRoomKeep() { // vuelve a pintar la sala conservando el código actual
  const code = editor.get(), tab = R.tab, h = R.hints, f = R.fails, a = R.attempts, sol = R.solution, lv = R.lv;
  R = { lv, attempts: a, fails: f, hints: h, freeHints: R.freeHints || 0, passed: R.passed, foes: R.foes, target: R.target, spent: R.spent, lastRes: R.lastRes, solution: sol, busy: false, foeMax: 1, foeHp: 1, tab, tests: [], uses: R.uses, armed: null, fromRun: R.fromRun };
  S.codes[lv.id] = code; renderRoom(); const s = $('#b-sol'); if (s) s.disabled = R.fails < 2;
}

/* ----- botín del enemigo: elegir entre XP, dinero, su armadura o su arma ----- */
const CLASS_NAME = { warrior: 'guerrero', mage: 'mago', archer: 'arquero', cleric: 'clérigo' };
const CLASS_HUE = { warrior: 0, archer: 85, mage: 215, cleric: 40 };
const SLOT_NAME = { helmet: 'Casco', chest: 'Peto', gloves: 'Guantes', legs: 'Pantalones', boots: 'Botas' };
const WEAPON_KINDS = [['Espada', '⚔️', 'warrior'], ['Hacha', '🪓', 'warrior'], ['Arco', '🏹', 'archer'], ['Báculo', '🔮', 'mage'], ['Cetro sagrado', '✨', 'cleric']];
const bag = () => S.items || (S.items = {});
function newItem(o) { S.itemSeq = (S.itemSeq || 0) + 1; const id = 'it' + S.itemSeq; bag()[id] = Object.assign({ id }, o); return bag()[id]; }
function dropOnly(own) { const others = Object.keys(CLASS_NAME).filter(c => c !== own); return Math.random() < .5 ? own : others[rnd(others.length)]; }
/* bonificaciones del equipo: +% de XP, +% de oro y suerte (más botín, más libros y mejores objetos) */
const BONUS_INFO = { xp: ['✨', 'XP', '%', 'del Sabio'], gold: ['🪙', 'oro', '%', 'del Mercader'], luck: ['🍀', 'suerte', '', 'de la Fortuna'] };
function rollBonus(tier, boss, count) {
  const types = ['xp', 'gold', 'luck'].sort(() => Math.random() - .5).slice(0, count), b = {};
  types.forEach(t => { b[t] = t === 'luck' ? 1 + Math.floor(tier / 2) + rnd(2) + (boss ? 1 : 0) : 2 + tier * 2 + rnd(3) + (boss ? 2 : 0); });
  return b;
}
const bonusSum = b => Object.values(b || {}).reduce((a, v) => a + v, 0);
const bonusText = b => Object.keys(b || {}).map(k => `${BONUS_INFO[k][0]} +${b[k]}${BONUS_INFO[k][2]} ${BONUS_INFO[k][1]}`).join(' · ');
const gearBonus = type => ['helmet', 'chest', 'gloves', 'legs', 'boots', 'weapon'].reduce((a, s) => a + (((curGear(s) || {}).b || {})[type] || 0), 0);
const luck = () => gearBonus('luck');
const xpMul = () => 1 + (weaponAtk() + gearBonus('xp')) / 100, goldMul = () => 1 + (weaponAtk() + gearBonus('gold')) / 100;
function gearLine(it) {   // una línea con todo lo que da una pieza
  const p = []; if (it.def) p.push('🛡️ defensa +' + it.def); if (it.atk) p.push('⚔️ +' + it.atk + '% XP y oro'); const bt = bonusText(it.b); if (bt) p.push(bt); return p.join(' · ') || 'sin bonificación';
}
function rollArmor(lv, tier, boss, own) {
  if (Math.random() < luck() / 25) tier++;   // la suerte mejora la calidad del objeto
  const slot = ['helmet', 'chest', 'gloves', 'legs', 'boots'][rnd(5)], list = SLOTS.find(s => s[0] === slot)[1], base = list[Math.min(tier, list.length - 1)], only = own ? heroClass() : dropOnly(heroClass());
  const def = base.def + (boss ? 1 : 0), b = rollBonus(tier, boss, boss || tier >= 2 ? 2 : 1), suf = BONUS_INFO[Object.keys(b)[0]][3];
  return { kind: 'armor', slot, name: `${SLOT_NAME[slot]} de ${lv.foe.name} ${suf}`, img: base.img, def, b, only, hue: CLASS_HUE[only], sell: 25 + def * 25 + bonusSum(b) * 6 };
}
function rollWeapon(lv, tier, boss, own) {
  if (Math.random() < luck() / 25) tier++;
  const pool = own ? WEAPON_KINDS.filter(k => k[2] === heroClass()) : WEAPON_KINDS, w = pool[rnd(pool.length)] || WEAPON_KINDS[0], atk = 3 + tier * 3 + (boss ? 3 : 0), b = rollBonus(tier, boss, boss ? 2 : 1), suf = BONUS_INFO[Object.keys(b)[0]][3];
  return { kind: 'weapon', slot: 'weapon', name: `${w[0]} de ${lv.foe.name} ${suf}`, icon: w[1], atk, b, only: w[2], sell: 20 + atk * 12 + bonusSum(b) * 6 };
}
const itemStats = it => gearLine(it);
const WEAPON_IMG = { warrior: 'swords', archer: 'bow', mage: 'orb', cleric: 'sparkle' };
const itemArt = it => it.kind === 'armor' ? `<img src="assets/gear/${it.img}.png" alt="" style="filter:hue-rotate(${it.hue || 0}deg)">` : `<img src="assets/ui/${WEAPON_IMG[it.only] || 'swords'}.png" alt="${esc(it.name)}">`;
function itemCard(it, extra) {
  const ok = it.only === heroClass();
  return `<div class="lootitem"><div class="lart">${itemArt(it)}</div><b>${esc(it.name)}</b><div class="small">${itemStats(it)}</div><div class="small ${ok ? 'okk' : 'err'}">${ok ? 'Compatible con tu clase' : 'Solo para ' + CLASS_NAME[it.only] + ' · véndelo en la tienda'}</div>${extra || ''}</div>`;
}
async function lootChoice(lv) {
  const boss = lv.kind === 'boss', tier = Math.min(3, (lv.world - 1) + (boss ? 1 : 0));
  const xpB = Math.round(lv.xp * (boss ? 1.2 : .6)) + 10, goldB = Math.round(lv.gold * (boss ? 3 : 2)) + 15;
  const armor = rollArmor(lv, tier, boss, true), weapon = rollWeapon(lv, tier, boss, true); let c = null;   // el botín de un enemigo siempre es para tu clase
  while (!c) {
    c = await modal(`<div class="lootwin"><h2><img class="rwchest" src="assets/ui/loot_chest.png" alt="">Botín de ${esc(lv.foe.name)}</h2><p>Has derrotado a <b>${esc(lv.foe.name)}</b>. Elige <b>una</b> recompensa:</p>
      <div class="lootgrid">
        <button class="lootopt xp" data-close="xp"><div class="lart"><img class="rwic" src="assets/ui/loot_xp.png" alt=""></div><b>Experiencia</b><div class="small">+${xpB} XP</div></button>
        <button class="lootopt gold" data-close="gold"><div class="lart"><img class="rwic" src="assets/ui/loot_gold.png" alt=""></div><b>Dinero</b><div class="small">+${goldB} monedas</div></button>
        <button class="lootopt armor" data-close="armor">${itemCard(armor).replace('lootitem', 'lootitem in').replace(/<div class="lart">[\s\S]*?<\/div>/, `<div class="lart"><img src="assets/ui/loot_armor.png" alt="" style="filter:hue-rotate(${({ archer: 0, warrior: -95, mage: 100, cleric: -60 })[heroClass()] || 0}deg)"></div>`)}<span class="lt">🛡️ Su armadura</span></button>
        <button class="lootopt weapon" data-close="weapon">${itemCard(weapon).replace(/<div class="lart">[\s\S]*?<\/div>/, m => heroClass() === 'archer' ? '<div class="lart"><img src="assets/ui/loot_bow.png" alt=""></div>' : m)}<span class="lt">⚔️ Su arma</span></button>
      </div></div>`, true);
  }
  let msg = '';
  if (c === 'xp') { const up = addXp(xpB); msg = `✨ +${xpB} XP${up ? ' · ¡subes a nivel ' + S.lvl + '!' : ''}`; }
  else if (c === 'gold') { S.gold += goldB; msg = `🪙 +${goldB} monedas`; }
  else { const it = newItem(c === 'armor' ? armor : weapon); msg = `🎒 ${it.name} guardado en tu mochila${it.only === heroClass() ? ' (puedes equiparlo en la tienda)' : ' (no es de tu clase: véndelo en la tienda)'}`; }
  save(); refreshTop(); consoleHtml(`<span class="okk"><b>🎁 Botín elegido:</b> ${esc(msg)}</span>`);
}
function bagHtmlFor() {
  const items = Object.values(bag()); if (!items.length) return '';
  const eq = id => Object.keys(S.gear || {}).some(k => k !== 'owned' && S.gear[k] === id);
  return '<h3 class="shopsub">🎒 Mochila · botín de enemigos</h3>' + items.map(it => {
    const ok = it.only === heroClass(), on = eq(it.id);
    return `<div class="card shopitem"><div class="sic">${itemArt(it)}</div><div class="sbody"><b>${esc(it.name)}</b> <span class="small">· ${itemStats(it)}</span><div class="small ${ok ? '' : 'err'}">${ok ? 'Compatible con tu clase' : 'Solo para ' + CLASS_NAME[it.only]}</div></div>
      <div class="shopbtns">${ok ? `<button class="btn ${on ? '' : 'good'}" data-act="equipitem" data-id="${it.id}">${on ? '✔ Equipado' : 'Equipar'}</button>` : ''}<button class="btn" data-act="sellitem" data-id="${it.id}" ${on ? 'disabled title="Quítatelo antes de venderlo"' : ''}>Vender · ${it.sell} ${uic('coin')}</button></div></div>`;
  }).join('');
}
async function victory(res) {
  const lv = R.lv, first = !isDone(lv.id);
  const stars = R.solution ? 1 : (R.attempts === 1 && R.hints - (R.freeHints || 0) === 0 ? 3 : (R.attempts <= 3 ? 2 : 1));
  const prevStars = first ? 0 : S.done[lv.id].stars;
  let xp = 0, gold = 0, up = 0, bonus = '';
  if (first) {
    const pw = R.powered ? 1.25 : 1; xp = Math.round(lv.xp * (stars === 3 ? 1 : stars === 2 ? 0.85 : 0.6) * pw); gold = Math.round(lv.gold * (R.solution ? 0.5 : 1) * pw);
    if (R.powered) bonus += '<p style="text-align:center">☄️ <b>¡Golpe maestro!</b> +25% de XP y oro.</p>';
    const bx = weaponAtk() + gearBonus('xp'), bg = weaponAtk() + gearBonus('gold'); if (bx || bg) { xp = Math.round(xp * xpMul()); gold = Math.round(gold * goldMul()); bonus += `<p style="text-align:center">🎖️ Tu equipo te da <b>+${bx}%</b> de XP y <b>+${bg}%</b> de oro.</p>`; }
    up = addXp(xp); S.gold += gold;
    if (lv.kind === 'boss') { S.potions += 2; S.hp = S.maxHp; bonus = '<p>👑 <b>¡Jefe derrotado!</b> Recibes 2 🧪 pociones y recuperas toda tu vida.</p>'; }
  }
  let bookHtml = '', dropId = null;
  if (first && DROPS[lv.id] && !S.books[DROPS[lv.id]]) {   // botín: libros por explorar, jefes y enemigos difíciles
    dropId = DROPS[lv.id]; S.books[dropId] = 'new'; const b = BOOKS[dropId];
    bookHtml = `<div class="bookdrop"><div class="be">${b.emoji}</div><div><b>📚 ¡Has encontrado un libro!</b><br>«${esc(b.title)}» <span class="small">(${kindLabel(b.kind)})</span></div></div>`;
  }
  if (lv.book) {   // reto de un libro superado: se aprende la habilidad
    const b = BOOKS[lv.book]; S.books[lv.book] = 'done';
    if (b.skill && !S.learned[b.skill]) { S.learned[b.skill] = true; const d = skillDef(b.skill); bookHtml += `<div class="bookdrop learn"><div class="be">${d.icon}</div><div><b>¡Has aprendido una habilidad!</b><br>${esc(d.name)}<div class="small">${esc(d.desc)}</div></div></div>`; }
  }
  S.done[lv.id] = { stars: Math.max(prevStars, stars) }; save(); refreshTop();
  el('#ff').classList.add('dead'); el('#fh').classList.add('win'); sfx.win();
  consoleHtml(`<span class="okk"><b>✔ ¡Todas las pruebas superadas!</b></span>\n` + (res.notes && res.notes.length ? `<div class="explain">💡 Tu programa funciona, aunque lo has resuelto de otra manera que la que proponía el reto. Por si te interesa: ${res.notes.map(esc).join(' · ')}</div>` : ''));
  await sleep(500);
  const inRun = !!(R.fromRun && S.run && S.run.phase === 'encounter' && S.run.cur && S.run.cur.level === lv.id);
  if (inRun) bookHtml += runCombatWon();   // la exploración avanza a la siguiente habitación (o se completa)
  const tutEnd = inRun && (!S.run || R.approachDone);   // el tutorial acaba con este combate: se continúa por el mapa
  const next = (lv.book || (inRun && !tutEnd)) ? null : nextLevelAfter(lv.id);
  const w = worlds.find(x => x.id === lv.world); const worldDone = lv.kind === 'boss' && first;
  const msg = ['', 'Bien, aunque con ayuda.', 'Muy bien.', '¡Perfecto a la primera, sin pistas!'][stars];
  if (first && !lv.book) await lootChoice(lv);   // elegir el botín del enemigo
  const act = await modal(`<h2>${lv.kind === 'boss' ? '👑 ¡Jefe derrotado!' : '🎉 ¡Victoria!'}</h2>
    <div class="bigstars">${stars === 3 ? '★★★' : stars === 2 ? '★★☆' : '★☆☆'}</div><p style="text-align:center">${msg}</p>
    ${first ? `<div class="reward"><span>✨ +${xp} XP</span><span>🪙 +${gold}</span></div>` : '<p class="small" style="text-align:center">Nivel ya completado antes: sin recompensa nueva (pero tus estrellas se guardan).</p>'}
    ${up ? `<p style="text-align:center">⬆️ <b>¡Subes a nivel ${S.lvl}!</b> Vida máxima +${10 * up}.</p>` : ''}${bonus}${bookHtml}
    ${worldDone ? `<p style="text-align:center">🏆 <b>¡Has completado el mundo «${esc(w.name)}»!</b></p>` : ''}
    <p class="small" style="text-align:center">📖 Esta lección queda guardada en tu Grimorio.</p>
    <div class="actions"><button class="btn" data-close="map">🗺️ Mapa</button>${inRun && S.run && !R.approachDone ? '<button class="btn good" data-close="run">🧭 Seguir explorando</button>' : ''}${dropId ? '<button class="btn primary" data-close="read">📖 Leer el libro</button>' : ''}<button class="btn" data-close="stay">Seguir probando</button>${next ? '<button class="btn good" data-close="next">Siguiente reto ➜</button>' : ''}</div>`);
  S.wizSeen = S.wizSeen || {}; if (!S.wizSeen[lv.id]) { S.wizSeen[lv.id] = true; save(); await wizard(lv); }   // el mago pregunta por dudas una vez por nivel
  if (act === 'map') renderMap(); else if (act === 'run') renderRun(); else if (act === 'next') openLevel(next); else if (act === 'read') openBook(dropId); else { el('#ff').classList.remove('dead'); }
}

/* ================= habilidades y libros ================= */
const SK = GAME.SKILLS, BOOKS = GAME.BOOKS, DROPS = GAME.DROPS;
const KIND_BOOK = { truco: '💡 Truco', leccion: '📘 Lección', reto: '📝 Reto de examen' };
const kindLabel = k => KIND_BOOK[k] || k;
const heroClass = () => ((S && S.hero) || 'warrior_f').split('_')[0];
const skillDef = type => { const c = SK.classes[heroClass()][type]; return Object.assign({ type, name: c[0], icon: c[1] }, SK.types[type]); };
const atkIcon = () => ({ warrior: 'swords', mage: 'orb', archer: 'bow', cleric: 'sparkle' })[heroClass()] || 'swords';   // el icono del ataque básico depende de la clase
const knownSkill = t => !!(SK.types[t].basic || (S.learned && S.learned[t]));
function freshUses() { const o = {}; Object.keys(SK.types).forEach(t => { o[t] = SK.types[t].uses; }); if (o.guard !== undefined && o.guard !== Infinity) o.guard += S.guardBonus || 0; return o; }
function renderSkillbar() {
  const bar = $('#skillbar'); if (!bar || !R) return;
  if (R.lv.kind === 'explore') { bar.style.display = 'none'; return; }
  const fhg = $('#fh'); if (fhg) fhg.classList.toggle('guarded', R.armed === 'guard');
  bar.innerHTML = ['attack', 'guard', 'heal', 'second', 'power'].map(t => {
    const d = skillDef(t);
    if (!knownSkill(t)) return `<button class="skill locked" data-act="skillinfo" data-type="${t}" title="${esc(d.name)}: bloqueada. Se aprende con un libro."><i>${uic('lock')}</i><span>${esc(d.name)}</span><em>libro</em></button>`;
    const left = R.uses[t], on = R.armed === t || (t === 'attack' && !R.armed);
    return `<button class="skill ${on ? 'on' : ''} ${left <= 0 ? 'empty' : ''}" data-act="skill" data-type="${t}" title="${esc(d.name)}: ${esc(d.desc)}"><i>${t === 'attack' ? uic(atkIcon()) : t === 'guard' ? uic('shield') : d.icon}</i><span>${esc(d.name)}</span><em>${left === Infinity ? '∞' : left + '×'}</em></button>`;
  }).join('');
}
function useSkill(type) {
  if (!R || R.busy) return; const d = skillDef(type);
  if (type === 'attack') R.armed = null;
  else if (R.uses[type] <= 0) { consoleHtml(`<span class="err">Ya has gastado «${esc(d.name)}» en este reto.</span>`); return; }
  else if (type === 'heal') {
    if (S.hp >= S.maxHp) { consoleHtml('<span class="dim">Ya tienes la vida completa.</span>'); return; }
    R.uses.heal--; S.hp = Math.min(S.maxHp, S.hp + SK.healAmt); sfx.win(); save(); setBars(); refreshTop(); floatAt($('.sprite', el('#fh')), '+' + SK.healAmt, 'ok');
    consoleHtml(`${d.icon} <b>${esc(d.name)}</b>: recuperas ${SK.healAmt} de vida.`);
  } else {
    R.armed = R.armed === type ? null : type;
    const when = type === 'power' ? 'se usará en tu próximo <b>⚡ Cargar ataque</b>' : 'se activará cuando des la <b>orden de atacar</b> y los enemigos contraataquen';
    consoleHtml(R.armed ? `${d.icon} <b>${esc(d.name)}</b> preparada: ${when}.<br><span class="dim">${esc(d.desc)}</span>` : 'Habilidad cancelada.');
    const fhe = el('#fh'); if (fhe) { fhe.classList.toggle('guarded', R.armed === 'guard'); if (R.armed) floatAt($('.sprite', fhe), d.icon, 'ok'); }
  }
  renderSkillbar();
}
function skillInfo(type) {
  const d = skillDef(type), bid = SK.unlock[type], b = BOOKS[bid], have = S.books[bid];
  modal(`<h2>${d.icon} ${esc(d.name)} <span class="small">(bloqueada)</span></h2><p>${esc(d.desc)}</p>
    <p>Se aprende superando el <b>reto</b> del libro <b>«${esc(b.title)}»</b>. ${have ? 'Ya lo tienes: ábrelo desde tu biblioteca.' : 'Todavía no lo has encontrado: los libros se consiguen <b>explorando mazmorras</b> y <b>derrotando a jefes y enemigos difíciles</b>.'}</p>
    <div class="actions"><button class="btn" data-close>Cerrar</button>${have ? '<button class="btn primary" data-close="open">📖 Abrir el libro</button>' : '<button class="btn primary" data-close="shop">🛒 Comprarlo en la tienda</button>'}</div>`).then(v => { if (v === 'open') openBook(bid); else if (v === 'shop') openShop(); });
}
function whereBook(id) {
  const src = Object.entries(DROPS).find(([, b]) => b === id); if (!src) return 'En algún lugar...';
  const lv = levels[src[0]], k = lv.kind === 'boss' ? 'Lo guarda un jefe' : lv.kind === 'explore' ? 'Está en una mazmorra por explorar' : 'Lo tiene un enemigo difícil';
  return `${k} del mundo ${lv.world}...`;
}
function openLibrary() {
  const ids = Object.keys(BOOKS), owned = ids.filter(id => S.books[id]);
  const rows = ids.map(id => {
    const b = BOOKS[id], st = S.books[id];
    if (!st) return `<div class="bookrow lockedb"><span class="be"><img class="qic" src="assets/ui/${/mundo [1]/.test(whereBook(id)) ? 'q1' : 'q2'}.png" alt=""></span><div><b>Libro por descubrir</b><div class="small">${esc(whereBook(id))}</div></div></div>`;
    return `<button class="bookrow" data-act="openbook" data-id="${id}"><span class="be">${b.emoji}</span><div style="flex:1"><b>${esc(b.title)}</b><div class="small">${kindLabel(b.kind)}${b.skill ? ' · enseña «' + esc(skillDef(b.skill).name) + '»' : ''}</div></div><span class="bst ${st}">${st === 'new' ? '¡Nuevo!' : st === 'done' ? '✔ superado' : 'leído'}</span></button>`;
  }).join('');
  modal(`<div class="mhead"><img src="assets/ui/books_big.png" alt=""><div><h2>Biblioteca</h2><p class="small">${owned.length} de ${ids.length} libros. Se consiguen explorando mazmorras y venciendo a jefes y enemigos difíciles. Los <b>retos de examen</b> te enseñan habilidades nuevas.</p></div></div><div class="books">${rows}</div><div class="actions"><button class="btn" data-close>Cerrar</button></div>`, true);
}
async function openBook(id) {
  const b = BOOKS[id]; if (!b) return; const first = S.books[id] === 'new';
  if (first) { S.books[id] = 'read'; addXp(15); }
  const done = S.books[id] === 'done', sk = b.skill ? skillDef(b.skill) : null;
  save(); refreshTop();
  const p = modal(`<h2>${b.emoji} ${esc(b.title)}</h2><p class="small">${kindLabel(b.kind)}${first ? ' · +15 XP por leerlo' : ''}</p><div class="bookbody">${b.html}</div>
    ${b.challenge ? `<div class="note">📝 <b>Reto del libro:</b> ${done ? 'superado ✔' : 'supéralo para ' + (sk ? 'aprender <b>' + esc(sk.icon + ' ' + sk.name) + '</b>' : 'ganar XP y oro')}.</div>` : ''}
    <div class="actions"><button class="btn" data-close>Cerrar</button>${b.challenge ? `<button class="btn primary" data-close="go">${done ? '🔁 Repetir el reto' : '📝 Aceptar el reto'}</button>` : ''}</div>`, true);
  $$('.bookbody pre code').forEach(c => { c.innerHTML = window.highlightJava(c.textContent); });
  if (await p === 'go') openLevel(b.challenge);
}

/* ================= mazmorra errante ================= */
const RUN_ = GAME.RUN;
let rscene = null, runBusy = false;
const runWorld = () => worlds.find(w => w.id === S.run.world);
const rnd = n => Math.floor(Math.random() * n);
function pickRunLevel(type) {
  const run = S.run, ids = []; worlds.filter(w => w.id <= run.world).forEach(w => w.nodes.flat().forEach(id => ids.push(id)));
  let pool;
  if (type === 'boss') { const w = runWorld(); pool = [].concat(w.nodes[w.nodes.length - 1]); }
  else { pool = ids.filter(id => !['boss', 'explore'].includes(levels[id].kind)); if (type === 'elite') { const hard = pool.filter(id => levels[id].xp >= 60); if (hard.length) pool = hard; } }
  const fresh = pool.filter(id => !isDone(id)), from = fresh.length ? fresh : pool; return from[rnd(from.length)];
}
function giveRandomBook(chance) {
  if (Math.random() > chance + luck() / 100) return null; const ids = Object.keys(BOOKS).filter(id => !S.books[id]); if (!ids.length) return null;
  const id = ids[rnd(ids.length)]; S.books[id] = 'new'; return id;
}
/* diálogos propios: confirm() y alert() no funcionan en la versión publicada */
async function ask(msg) { return (await modal(`<p>${msg}</p><div class="actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-close="yes">Aceptar</button></div>`)) === 'yes'; }
function tell(msg) { return modal(`<p>${esc(msg)}</p><div class="actions"><button class="btn primary" data-close>Vale</button></div>`); }
async function openRun(wid) {
  if (S.run && S.run.approach) endApproach();
  if (!S.tutDone && wid === 1) { openLevel('1-1'); return; }
  if (S.run && S.run.world !== wid && !(await ask('Ya tienes una exploración empezada en otro mundo. ¿Abandonarla y empezar una nueva aquí?'))) return;
  if (!S.run || S.run.world !== wid) S.run = RUN_.generate(wid);
  save(); renderRun();
}
const cmdsHtml = key => `<div class="cmds">${(RUN_.commands[key] || []).map(([c, d]) => `<div><code>${esc(c)}</code> <span>${esc(d)}</span></div>`).join('')}</div>`;
const SITUATION = {
  enemy: 'Un enemigo te corta el paso. <b>Antes de entrar en combate tienes que dar la orden</b>: escribe la instrucción en el editor.',
  elite: 'Un enemigo temible bloquea la sala. Para plantarle cara hay que <b>escribir la instrucción</b> adecuada.',
  boss: 'El jefe de la mazmorra te observa desde el fondo. Para enfrentarte a él debes <b>escribir la instrucción</b> del desafío.',
  treasure: 'Un cofre brilla sobre un pedestal. Para abrirlo hay que <b>escribir la instrucción</b>.'
};
function runStarter() {
  const run = S.run; if (run.phase === 'walk') return '// Escribe aquí tu primera orden y pulsa «Ejecutar instrucción»:\n'; if (run.phase === 'choose') return run.rooms[run.step] && run.rooms[run.step].doors.length === 1 ? '// Solo hay una puerta. Para cruzarla escribe:\n// heroe.entrar(1);\n' : '// Elige una puerta sin saber qué hay detrás. Por ejemplo:\n// heroe.entrar(1);\n';
  return { enemy: '// Un enemigo bloquea el paso. ¿Qué haces?\n', elite: '// Un enemigo temible. ¿Qué haces?\n', boss: '// El jefe te espera. ¿Qué haces?\n', rest: '// Responde al acertijo de la fuente: heroe.responder("...");\n', treasure: run.cur.chest ? '// Resuelve el reto del cofre ' + run.cur.chest + ': heroe.responder("...");\n' : '// Cofres de esta sala: ' + RUN_.layout(run.world || 1, run.cur && run.cur.scene).map((c, i) => RUN_.chestOpen(c, run.world || 1) ? (i + 1) + ' ' + c.key : '').filter(Boolean).join(', ') + '.\n// Elige uno, por ejemplo: heroe.abrir(2);\n', riddle: '// Escribe tu respuesta con heroe.responder(...)\n' }[run.cur.type];
}
function tutGuide(run) {   // tutorial interactivo: una idea por pantalla, con ejemplos y sin jerga (para quien no sabe nada de programar)
  if (run.phase === 'walk') return { title: '👋 Bienvenida: tus primeros pasos', pages: [
    '¡Hola! Vas a aprender a programar en <b>Java</b> dando órdenes a tu personaje. <b>No necesitas saber nada</b>: voy explicando todo poco a poco. Lee cada pantalla y pulsa <b>Siguiente</b>.',
    'Programar es <b>escribir órdenes</b> para que el ordenador las cumpla. Las órdenes se escriben en el <b>recuadro negro</b> de la derecha (se llama <b>editor</b>) y se envían con el <b>botón naranja «Ejecutar instrucción»</b>.<br><br>Una orden tiene que estar escrita <b>exactamente bien</b>, como una fórmula mágica: si falta una letra o un signo, el ordenador no la entiende.',
    'Tu personaje se llama <code>heroe</code>. Para mandarle algo se escribe así:<pre><code>heroe.caminar();</code></pre><ul><li><code>heroe</code> → <b>a quién</b> le das la orden</li><li><code>.</code> (punto) → significa «haz esto»</li><li><code>caminar()</code> → <b>lo que debe hacer</b> (siempre con paréntesis)</li><li><code>;</code> (punto y coma) → «aquí termina la orden». <b>Nunca puede faltar.</b></li></ul>',
    'Algunas órdenes necesitan un <b>dato extra</b>. Por ejemplo, para entrar por una puerta hay que decir <b>cuál</b>. Ese dato va <b>dentro de los paréntesis</b> y se llama <b>parámetro</b>:<pre><code>heroe.entrar(2);</code></pre>Significa: «héroe, entra por la puerta número 2». En cambio <code>caminar()</code> no necesita ningún dato, y por eso sus paréntesis van vacíos.',
    'El héroe también tiene <b>datos suyos</b>: su vida, su nombre, su oro… Se llaman <b>atributos</b>. Y las cosas que sabe hacer (caminar, entrar, atacar) se llaman <b>métodos</b>. En Java, algo que tiene datos y acciones, como <code>heroe</code>, se llama <b>objeto</b>.<br><br>Se le puede preguntar un dato así: <code>heroe.getVida()</code> te dice cuánta vida tiene.',
    'Una <b>variable</b> es una <b>caja con etiqueta</b> donde guardas un dato para usarlo luego:<pre><code>int puerta = 2;\nheroe.entrar(puerta);</code></pre>La primera línea significa: «crea una caja llamada <code>puerta</code> que guarda un número entero (<code>int</code>) y mete dentro un 2». La segunda usa la caja: es lo mismo que <code>heroe.entrar(2);</code>',
    '<b>Ahora te toca a ti.</b><br>1. Haz clic en el recuadro negro (editor).<br>2. Escribe exactamente: <code>heroe.caminar();</code><br>3. Pulsa el botón naranja <b>▶ Ejecutar instrucción</b>.<br><br>Fíjate en el punto, los paréntesis y el punto y coma del final.'] };
  if (run.phase === 'choose') return run.step === 1
    ? { title: '🚪 Elige una puerta', pages: [
      'Has llegado a un cruce con <b>3 puertas numeradas</b> (1, 2 y 3). No sabes qué hay detrás de cada una, y <b>cambia en cada partida</b>: puede ser un tesoro, un acertijo…',
      'Para entrar por una puerta usas <code>entrar</code> y le das el número como <b>parámetro</b>:<pre><code>heroe.entrar(2);</code></pre>Cambia el 2 por el número de la puerta que quieras (1, 2 o 3).',
      'También puedes guardar el número en una <b>variable</b> y usarla. Escribe estas <b>dos líneas</b> (una debajo de otra):<pre><code>int puerta = 3;\nheroe.entrar(puerta);</code></pre>',
      'Si quieres una <b>pista</b>, antes puedes <b>escuchar</b> una puerta (solo <b>una vez</b> por sala): <code>heroe.escuchar(1);</code><br>La pista aparece <b>en el recuadro de abajo a la derecha</b> (el de los resultados). Después podrás elegir.',
      '<b>Ahora elige tú.</b> Escribe la orden para entrar por la puerta que prefieras y pulsa <b>▶ Ejecutar instrucción</b>.'] }
    : { title: '🚪 La última puerta', pages: ['Solo hay <b>una puerta</b>. Detrás te espera tu <b>primer combate</b>.', 'Escribe <code>heroe.entrar(1);</code> y pulsa <b>Ejecutar</b>. El <code>1</code> es el parámetro: el número de la puerta.'] };
  const t = run.cur && run.cur.type;
  if (t === 'treasure' && !run.cur.chest) return { title: '📦 ¡Un tesoro!', pages: ['Hay <b>cofres numerados</b> (los de madera, hierro, oro y diamante; según el mundo van apareciendo). Cuanto mejor es el cofre, más difícil es el reto que lo protege.', 'Como estás empezando, elige el <b>1 (madera)</b>: <code>heroe.abrir(1);</code><br>Otra vez el número entre paréntesis es un <b>parámetro</b>. Escríbelo y pulsa <b>Ejecutar</b>.'] };
  if (t === 'treasure' || t === 'riddle') return { title: '🧩 Resuelve el reto', pages: ['Lee el código que aparece abajo y piensa <b>qué escribiría en pantalla</b> si el ordenador lo ejecutara, <b>línea a línea</b>.', 'Escribe tu respuesta <b>entre comillas</b>:<pre><code>heroe.responder("24");</code></pre>Cambia el 24 por tu respuesta. Un texto entre comillas se llama <b>String</b> (cadena de texto) y aquí es el parámetro de la orden.'] };
  if (t === 'enemy') return { title: '⚔️ ¡Tu primer enemigo!', pages: ['Un enemigo te corta el paso. Para plantarle cara escribe <code>heroe.atacar();</code> y pulsa <b>Ejecutar</b>.', 'Después empieza el <b>combate de verdad</b>, y ahí atacarás <b>programando</b>: tu programa de Java llevará dentro de <code>main</code> la orden <code>heroe.atacar(1);</code>. Te lo explicaré al empezar.'] };
  return null;
}
function renderRunStatus() {
  const run = S.run, w = runWorld(), room = run.rooms[run.step], box = $('#runstatus'); if (!box) return;
  const dots = Array.from({ length: run.rooms.length }, (_, i) => `<span class="rdot ${i < run.step ? 'done' : i === run.step ? 'cur' : ''}">${i === run.rooms.length - 1 ? (run.tut ? '⚔️' : run.approach ? '🚪' : '👑') : i + 1}</span>`).join('<i></i>');
  let body;
  if (run.phase === 'walk') {
    body = `<p>Estás en la entrada de la mazmorra. Un pasillo oscuro se abre ante ti.</p>${cmdsHtml('walk')}`;
  } else if (run.phase === 'choose') {
    const bl = room.blocked.map((b, i) => b ? i + 1 : 0).filter(Boolean);
    body = room.doors.length === 1
      ? `<p>Solo hay <b>una puerta</b> y no queda otra salida. ${room.doors[0] === 'boss' ? 'Detrás espera el <b>jefe de la mazmorra</b>.' : 'Detrás te espera un combate.'} Puedes escuchar antes de entrar, pero al final tendrás que cruzarla.</p>${cmdsHtml('choose1')}`
      : `<p>Estás en un cruce con <b>${room.doors.length} puertas numeradas</b>. <b>No sabes qué hay detrás de ninguna</b>: puede ser un enemigo, un tesoro, un acertijo... o algo peor.</p>${bl.length ? `<p class="small">🚫 Bloqueadas: ${bl.join(', ')}</p>` : ''}${cmdsHtml('choose')}`;
  } else {
    const t = run.cur.type, info = RUN_.types[t];
    body = `<p><b>${info.emoji} ${info.name}</b>${run.cur.level ? ' · ' + esc(levels[run.cur.level].foe.name) : ''}</p>`;
    const ch = t === 'treasure' && run.cur.chest ? RUN_.chestAt(run.cur.chest, run.world || 1, run.cur && run.cur.scene) : null;
    if (t === 'riddle' || t === 'rest' || ch) { const r = run.cur.riddle; body += `${run.cur.trap ? '<p>👹 <b>¡Era un cofre mimo!</b> Te ha mordido. Sométele resolviendo su acertijo (2 intentos): si lo logras, su botín será mejor; si fallas, se esfuma.</p>' : ch ? `<p>🔐 <b>${esc(ch.name)}</b> · reto <b>${esc(ch.tier)}</b>: resuélvelo para abrirlo.</p>` : ''}<div class="riddle"><b>${esc(r.q)}</b>${r.code ? `<pre><code>${esc(r.code)}</code></pre>` : ''}<span class="small">Intentos: ${2 - run.tries} de 2</span></div>`; }
    else if (t === 'treasure') { const wd = run.world || 1, lay = RUN_.layout(wd, run.cur && run.cur.scene), op = lay.filter(c => RUN_.chestOpen(c, wd)).length; body += `<p>${op === 1 ? 'Hay un cofre en la sala.' : `Hay ${op} cofres que puedes abrir.`} <b>Cuanto mejor es el cofre, más difícil es el reto de Java</b> que lo protege (y mejor el botín y el equipo). Elige uno con <code>heroe.abrir(n)</code>.</p><div class="chestlist">${lay.map((c, i) => RUN_.chestOpen(c, wd) ? `<div class="ch${c.id}"><b>${i + 1}</b> ${esc(c.name)}</div>` : `<div class="ch${c.id} lockedch"><b>🔒</b> ${esc(c.name)} <span>aparece en el mundo ${c.world}</span></div>`).join('')}</div>`; }
    else body += `<p>${SITUATION[t]}</p>`;
    if (t === 'rest' && S.hp >= S.maxHp) body += '<p class="small">💚 Ya tienes la <b>vida completa</b>: la fuente no te hace falta. Puedes marcharte con <code>heroe.huir();</code> (no cuesta vida) o responder igualmente para ganar XP.</p>';
    body += cmdsHtml(ch ? 'chest' : t);
  }
  const tg = run.tut ? tutGuide(run) : null;
  box.innerHTML = `<div class="rhead">🧭 ${esc(w.name)}${run.tut ? ' · Tutorial' : ''}</div>${run.approach && run.phase === 'choose' ? `<p class="small">🎯 Reto: <b>${esc(levels[run.approach].title)}</b>. Una de las puertas lleva al reto; las otras esconden <b>tesoros</b>, <b>acertijos con grimorios</b> o una <b>fuente que cura</b>. ¿Cuál eliges?</p>` : ''}<div class="rdots">${dots}</div>${tg ? coachHtml(tg) : ''}${body}${run.log.length ? `<div class="rlog">${run.log.slice(-3).map(l => `<div>${l}</div>`).join('')}</div>` : ''}`;
  $$('#runstatus pre code, #runstatus .cmds code, #runstatus .coach code').forEach(c => { c.innerHTML = window.highlightJava(c.textContent); });
}
function buildRunScene() {
  const run = S.run, w = runWorld(), room = run.rooms[run.step], arena = $('#arena'); if (!arena) return;
  $$('.fpov, .runhud, .herochip', arena).forEach(e => e.remove()); $$('.runskills').forEach(e => e.remove()); arena.style.background = ''; const old = $('#rcv'), cv = document.createElement('canvas'); cv.id = 'rcv'; cv.width = 520; cv.height = 320; if (old) old.replaceWith(cv); else arena.prepend(cv);
  rscene = null;
  if (run.phase === 'walk') {   // pasillo ilustrado: al caminar se avanza hacia el fondo
    const div = document.createElement('div'); div.id = 'rcv'; div.className = 'doorsimg walkimg';
    div.innerHTML = `<div class="pic"></div><div class="walker">${heroFace(S.hero, 64, 64).replace('class="hface"', 'class="hface round"')}</div>`; cv.replaceWith(div); const pic = div.firstChild, wk = div.lastChild;
    rscene = { walk: () => { pic.style.transformOrigin = '50% 62%'; pic.style.transform = 'scale(2.2)'; wk.classList.add('go'); return sleep(1400); } }; return;
  }
  if (run.phase === 'choose' && room.doors.length === 1) {   // una sola puerta: la puerta central de la ilustración, con su número 1
    const div = document.createElement('div'); div.id = 'rcv'; div.className = 'doorsimg onedoor';
    div.innerHTML = '<div class="pic"><i class="glow" style="left:23%;top:40%"></i><i class="glow" style="left:76.7%;top:38%"></i></div><div class="doorplate">1</div>';
    cv.replaceWith(div); const pic = div.firstChild;
    rscene = { enter: () => { pic.style.transformOrigin = '50% 54%'; pic.style.transform = 'scale(3.6)'; div.classList.add('entering'); return sleep(1350); } }; return;
  }
  if (run.phase === 'choose' && room.doors.length === 3) {   // cruce de 3 puertas: ilustración con antorchas que parpadean
    const div = document.createElement('div'); div.id = 'rcv'; div.className = 'doorsimg doors3';
    div.innerHTML = '<div class="pic">' + [[22.9, 39], [41.2, 39], [58.1, 39], [76, 39]].map(([x, y]) => `<i class="glow" style="left:${x}%;top:${y}%"></i>`).join('') + room.blocked.map((b, i) => b ? `<i class="bdoor" style="left:${[32.4, 49.2, 66][i]}%"></i>` : '').join('') + '</div>';
    cv.replaceWith(div); const pic = div.firstChild, X = [32.4, 49.2, 66];
    rscene = { enter: i => { pic.style.transformOrigin = X[i] + '% 47%'; pic.style.transform = 'scale(3.6)'; return sleep(1350); } }; return;
  }
  if (run.phase === 'encounter' && run.cur.type === 'treasure') {   // cuatro cofres ilustrados: el elegido se ilumina y el resto se apaga
    const div = document.createElement('div'); div.id = 'rcv'; const wood3 = true; div.className = 'doorsimg chestsimg wood3' + ((run.world || 1) === 3 || (run.world || 1) === 4 ? ' mix3' : ''); const sel = run.cur.chest || 0, X = wood3 ? [18, 50.3, 81.8] : [17.3, 39.3, 61.5, 83.8];
    if (run.cur.trap) { div.className += ' trap'; div.innerHTML = '<div class="pic" style="background-image:url(assets/scenes/chests_mimic.jpg)"></div>'; cv.replaceWith(div); rscene = { open: async () => { div.classList.add('opening'); await sleep(900); } }; return; }
    div.innerHTML = '<div class="pic"' + (run.cur.scene ? ` style="background-image:url(assets/scenes/chests_${run.cur.scene}.jpg)"` : '') + '></div>' + RUN_.layout(run.world || 1, run.cur && run.cur.scene).map((c, i) => RUN_.chestOpen(c, run.world || 1) ? `<i class="cbadge c${c.id}${sel === i + 1 ? ' sel' : sel ? ' dim' : ''}" style="left:${X[i]}%">${i + 1}</i>` : `<i class="cbadge c${c.id} dim lockd" style="left:${X[i]}%" title="Aparece en el mundo ${c.world}">🔒</i>`).join('');
    cv.replaceWith(div); const pic = div.firstChild;
    rscene = { open: async () => { div.classList.add('opening'); await sleep(900); } }; return;
  }
  if (run.phase === 'encounter' && (run.cur.type === 'riddle' || run.cur.type === 'rest')) {   // acertijo: solo la ilustración (sin escena 3D, que mostraba un libro azul girando un instante)
    const div = document.createElement('div'); div.id = 'rcv'; div.className = 'doorsimg ' + (run.cur.type === 'rest' ? 'restimg' : 'riddleimg'); div.innerHTML = '<div class="pic"></div>'; cv.replaceWith(div); rscene = {}; return;
  }
  if (!(HAS3D && window.RoomScene)) { cv.style.background = 'radial-gradient(#3a2a5c,#0d0b0a)'; return; }
  const look = { color: S.color, weapon: S.weapon, avatarIdx: heroDef(S.hero).f ? 1 : 0, hero: S.hero, wp: heroDef(S.hero).wp };
  if (run.phase === 'choose') rscene = new window.RoomScene(cv, w.theme, 'doors', room.doors.length);
  else { const t = run.cur.type; rscene = t === 'treasure' ? new window.RoomScene(cv, w.theme, 'chest') : t === 'riddle' ? new window.RoomScene(cv, w.theme, 'altar') : new window.Stage3D(cv, look, levels[run.cur.level].foe.model, t === 'boss', w.theme); if (rscene.setBackdrop) applyArenaBg(arena, t === 'treasure' ? 'sala_cofre' : t === 'riddle' ? 'sala_libro' : w.theme, rscene); if (t === 'enemy' || t === 'elite' || t === 'boss') addRunHud(arena, levels[run.cur.level]); }
}
function addHeroChip(arena) {   // el héroe con su equipo, en una esquina de la escena
  if (!arena) return; $$('.herochip', arena).forEach(e => e.remove());
  const d = document.createElement('div'); d.className = 'herochip'; d.innerHTML = heroSheet(150); arena.appendChild(d);
}
function addRunHud(arena, lv) {   // vida del héroe y del enemigo, y las cinco habilidades (como en un combate)
  const hud = document.createElement('div'); hud.className = 'runhud';
  hud.innerHTML = `<div class="hb"><b>${esc(S.name)}</b><div class="bar hp"><i style="width:${S.hp / S.maxHp * 100}%"></i><span>${S.hp}/${S.maxHp}</span></div></div><div class="hb"><b>${esc(lv.foe.name)}</b><div class="bar foebar"><i style="width:100%"></i><span>100%</span></div></div>`;
  arena.appendChild(hud); addHeroChip(arena);
  const U = freshUses(), bar = document.createElement('div'); bar.className = 'skillbar runskills';
  bar.innerHTML = ['attack', 'guard', 'heal', 'second', 'power'].map(t => {
    const d = skillDef(t);
    if (!knownSkill(t)) return `<div class="skill locked" title="${esc(d.name)}: bloqueada. Se aprende con un libro."><i>${uic('lock')}</i><span>${esc(d.name)}</span><em>libro</em></div>`;
    return `<div class="skill ${t === 'attack' ? 'on' : ''}" title="${esc(d.name)}: ${esc(d.desc)}"><i>${t === 'attack' ? uic(atkIcon()) : t === 'guard' ? uic('shield') : d.icon}</i><span>${esc(d.name)}</span><em>${U[t] === Infinity ? '∞' : U[t] + '×'}</em></div>`;
  }).join('');
  arena.insertAdjacentElement('afterend', bar);
}
function renderRun() {
  R = null; d3 = null; stage = null; const run = S.run; if (!run) { renderMap(); return; } Ambient.setTheme(runWorld().theme);
  app.innerHTML = topbar(true) + `<div class="room runroom"><div class="col"><div class="arena view3d runarena ${runWorld().theme}" id="arena"><div class="runfade" id="runfade"></div></div></div>
    <div class="col"><div class="info runstatus" id="runstatus"></div><div id="editor"></div><div class="toolbar"><button class="btn primary" data-act="runexec">▶ Ejecutar instrucción <span class="small" style="color:#4a2b00">(Ctrl+Enter)</span></button><button class="btn" data-act="runhelp">❓ Ayuda</button><button class="btn" data-act="bigeditor" title="Agranda o reduce la caja del código">⤢ Ampliar editor</button><button class="btn ghost" data-act="map">🗺️ Salir al mapa</button></div>
    <div class="console" id="console"><span class="dim">Escribe una instrucción de Java en el editor y pulsa «Ejecutar». No se ve lo que hay al otro lado de las puertas hasta que entras.</span></div></div></div>`;
  editor = window.createEditor($('#editor'), { onRun: runExec }); $('#editor').classList.add('small'); editor.set(runStarter());
  buildRunScene(); renderRunStatus(); setTimeout(() => editor.focus(), 60);
}
function makeRunHero(act) {
  const run = S.run, room = run.rooms[run.step], enc = run.phase === 'encounter', type = enc ? run.cur.type : null;
  const set = (t, x) => { if (!act.t) { act.t = t; Object.assign(act, x || {}); } }, wrong = msg => { if (!act.t) { act.t = 'wrong'; act.msg = msg; } };
  const door = (a, I, fn) => { const n = a[0]; if (typeof n !== 'number') I.throwJ('IllegalArgumentException', fn + '() necesita el número de la puerta (un int)'); if (n < 1 || n > room.doors.length) I.throwJ('IllegalArgumentException', `No existe la puerta ${n}: hay ${room.doors.length} (de 1 a ${room.doors.length})`); return n; };
  const m = {
    caminar: (a, I) => { if (run.phase === 'walk') set('walk'); else I.write(run.phase === 'choose' ? 'Ya estás en el cruce: ahora toca elegir puerta con heroe.entrar(n);\n' : 'Aquí no hace falta caminar.\n'); },
    entrar: (a, I) => { if (enc) return wrong('Ya has entrado: ahora tienes algo delante. Usa los comandos de esta situación.'); const n = door(a, I, 'entrar'); if (room.blocked[n - 1]) I.throwJ('IllegalStateException', `La puerta ${n} está bloqueada: ya retrocediste por ahí`); set('enter', { n }); },
    escuchar: (a, I) => { if (enc) return wrong('Aquí no hay puertas que escuchar.'); const n = door(a, I, 'escuchar'); if (run.listened) { if (run.tut) return I.write('Ya has escuchado en esta sala: solo se puede una vez. Ahora elige una puerta, por ejemplo heroe.entrar(2);\n'); I.throwJ('IllegalStateException', 'Ya has escuchado en esta habitación: solo se puede una vez'); } set('listen', { n }); },
    atacar: () => { if (!enc) return wrong('No hay nada que atacar: primero elige una puerta con heroe.entrar(n).'); if (type === 'enemy' || type === 'elite') set('fight'); else if (type === 'boss') wrong('Ante un jefe no basta con «atacar»: ¡hay que desafiarlo! Usa heroe.desafiar().'); else wrong('Eso no es un enemigo: no hay a quién atacar.'); },
    desafiar: () => { if (!enc) return wrong('No hay nadie a quien desafiar todavía.'); if (type === 'boss') set('fight'); else wrong('Eso no es un jefe. Desafiar es solo para el jefe de la mazmorra.'); },
    abrir: (a, I) => {
      if (!enc) return wrong('No hay nada que abrir todavía: elige una puerta con heroe.entrar(n).'); if (type !== 'treasure') return wrong('No hay ningún cofre que abrir aquí.');
      if (run.cur.chest) return wrong('Ya has elegido el cofre ' + run.cur.chest + ': resuelve su reto con heroe.responder(...) o márchate con heroe.huir().');
      const n = a[0]; if (typeof n !== 'number') I.throwJ('IllegalArgumentException', 'abrir() necesita el número del cofre (un int)'); const cnt = RUN_.chestCount(run.world || 1); if (n < 1 || n > cnt) I.throwJ('IllegalArgumentException', `No existe el cofre ${n}: aquí hay ${cnt} (de 1 a ${cnt})`);
      const cd = RUN_.chestAt(n, run.world || 1, run.cur && run.cur.scene); if (!RUN_.chestOpen(cd, run.world || 1)) return wrong(`El ${cd.name.toLowerCase()} todavía no aparece: lo encontrarás a partir del mundo ${cd.world}. Abre uno de los cofres disponibles.`);
      set('chest', { n });
    },
    responder: (a, I) => { if (!enc || !(type === 'riddle' || type === 'rest' || (type === 'treasure' && run.cur.chest))) return wrong(type === 'treasure' ? 'Primero elige un cofre con heroe.abrir(n).' : 'Nadie te ha hecho ninguna pregunta.'); set('answer', { v: I.str(a[0]) }); },
    huir: () => { if (!enc) return wrong('No hay de qué huir: aún no has entrado a ninguna sala.'); set('flee'); },
    ayuda: (a, I) => { I.write((RUN_.commands[run.phase === 'choose' ? 'choose' : type === 'treasure' && run.cur.chest ? 'chest' : type] || []).map(([c, d]) => c + '   // ' + d).join('\n') + '\n'); },
    getVida: () => S.hp, getPuertas: () => room.doors.length, getHabitacion: () => run.step + 1
  };
  if (run.phase === 'walk') ['entrar', 'escuchar', 'atacar', 'desafiar', 'abrir', 'responder', 'huir'].forEach(k => { m[k] = () => wrong('Todavía no hay nada de eso: primero camina por el pasillo con heroe.caminar();'); });
  return JV.native('Heroe', m);
}
const norm = s => String(s).trim().toLowerCase().replace(/^["']|["']$/g, '').replace(/\s+/g, ' ');
function runHurt(n, why) {
  if (S.run && S.run.tut) { S.run.log.push(`💡 ${why}: en el tutorial no se pierde vida`); save(); return; }
  S.hp = Math.max(0, S.hp - n); sfx.hurt(); save(); refreshTop(); S.run.log.push(`🩸 ${why} (-${n} vida)`);
  if (S.hp <= 0) { const lost = Math.floor(S.gold * .15); S.hp = S.maxHp; S.gold -= lost; S.run.log.push(`💀 Caes inconsciente y despiertas... (pierdes ${lost} 🪙, recuperas la vida)`); save(); refreshTop(); }
}
/* ----- puertas antes de cada reto del mapa ----- */
const shouldApproach = lv => !!S.tutDone && S.approachOn !== false && !S.done[lv.id] && lv.kind !== 'explore' && !lv.book && !(S.run && S.run.tut);
function startApproach(lv) { if (S.run && !S.run.approach && !S.run.tut) S.runSaved = S.run; S.run = GAME.RUN.generateApproach(lv); save(); }
function endApproach() { S.run = S.runSaved || null; S.runSaved = null; save(); }
function leaveRoom() {   // sala de tesoro o acertijo resuelta: se vuelve a las puertas con esa cerrada (o se avanza si no es un reto previo)
  const run = S.run; if (!run.approach) return advanceRoom();
  const room = run.rooms[run.step]; if (run.cur && run.cur.door !== undefined) room.blocked[run.cur.door] = true;
  run.phase = 'choose'; run.cur = null; run.listened = false; run.tries = 0; save(); return false;
}
function advanceRoom() { const run = S.run; run.step++; run.phase = run.rooms[run.step] && run.rooms[run.step].walk ? 'walk' : 'choose'; run.cur = null; run.listened = false; run.tries = 0; save(); return run.step >= run.rooms.length; }
function completeRun() {
  if (S.run && S.run.tut) { S.tutDone = true; S.run = null; save(); return `<div class="bookdrop learn"><div class="be">🎓</div><div><b>¡Tutorial completado!</b><br><span class="small">Has caminado, elegido puerta y vencido a tu primer enemigo. A partir de aquí, el mapa es tuyo.</span></div></div>`; }
  const bk = giveRandomBook(1); S.gold += 60; S.potions++; S.hp = S.maxHp; const up = addXp(60); S.run = null; save(); refreshTop();
  return `<div class="bookdrop learn"><div class="be">🏆</div><div><b>¡Mazmorra completada!</b><br><span class="small">+60 XP · +60 🪙 · +1 🧪 · vida restaurada${up ? ' · ¡nivel ' + S.lvl + '!' : ''}</span></div></div>${bk ? `<div class="bookdrop"><div class="be">${BOOKS[bk].emoji}</div><div><b>📚 Libro del jefe:</b> «${esc(BOOKS[bk].title)}»</div></div>` : ''}`;
}
function runCombatWon() {   // se llama al ganar el combate lanzado desde la exploración
  const run = S.run, type = run.cur.type; let html = '';
  if (run.approach) { if (R) R.approachDone = true; endApproach(); return ''; }   // era la puerta del reto: termina el paso previo
  const gold = type === 'boss' ? 0 : type === 'elite' ? 30 : 15; if (gold) { S.gold += gold; html += `<div class="bookdrop"><div class="be">🪙</div><div><b>Botín de la mazmorra:</b> +${gold}</div></div>`; }
  if (type === 'elite') { const b = giveRandomBook(.5); if (b) html += `<div class="bookdrop"><div class="be">${BOOKS[b].emoji}</div><div><b>📚 Libro encontrado:</b> «${esc(BOOKS[b].title)}»</div></div>`; }
  run.log.push(`✔ Has vencido: ${esc(levels[run.cur.level].foe.name)}`);
  const done = advanceRoom(); if (done) html += completeRun();
  return html;
}
/* ventana de recompensa: se queda hasta que el jugador pulsa «Continuar», para dar tiempo a leerla */
async function rewardModal(title, rows, bookId) {
  const book = bookId ? `<div class="bookdrop learn"><div class="be">${BOOKS[bookId].emoji}</div><div><b>📚 ¡Has encontrado un libro!</b><br>«${esc(BOOKS[bookId].title)}»<div class="small">Lo tienes en tu 📚 Biblioteca.</div></div></div>` : '';
  const ICON = { '🪙': '<img class="rwic" src="assets/ui/coins_big.png" alt="">', '✨': '<img class="rwic" src="assets/ui/sparkles_big.png" alt="">' };
  const head = title.startsWith('📦') ? '<img class="rwchest" src="assets/ui/chest_open.png" alt="">' + title.slice(2).trim() : title;
  await modal(`<div class="rewardwin"><h2>${head}</h2><div class="rewardlist">${rows.map(r => `<div class="bookdrop rw"><div class="be">${ICON[r[0]] || r[0]}</div><div>${r[1]}</div></div>`).join('')}${book}</div><div class="actions"><button class="btn primary" data-close>Continuar</button></div></div>`);
}async function handleRunAct(act) {
  const run = S.run, room = run.rooms[run.step], fade = $('#runfade'); runBusy = true;
  try {
    if (act.t === 'walk') {
      run.log.push('👣 Caminas por el pasillo...'); save(); sfx.click(); if (rscene && rscene.walk) await rscene.walk();
      if (fade) fade.style.opacity = 1; await sleep(280); advanceRoom(); renderRun();
    }
    else if (act.t === 'listen') { run.listened = true; run.log.push(`👂 Puerta ${act.n}: ${RUN_.hints[room.doors[act.n - 1]]}`); save(); renderRunStatus(); consoleHtml(`<div class="okk"><b>👂 Pegas la oreja a la puerta ${act.n}...</b></div><div>«${RUN_.hints[room.doors[act.n - 1]]}»</div><div class="dim">${room.doors.length === 1 ? 'Ya tienes la pista. Solo hay una puerta: entra con heroe.entrar(1);' : 'Ya tienes la pista. Ahora elige una puerta con heroe.entrar(n);'}</div>`); }
    else if (act.t === 'enter') {
      const type = room.doors[act.n - 1]; run.cur = { door: act.n - 1, type }; if (type === 'treasure') { run.cur.scene = RUN_.pickScene(run.world || 1, rnd); const wd = RUN_.layout(run.world || 1, run.cur.scene).map((c, i) => c.key === 'madera' ? i + 1 : 0).filter(Boolean); if (!run.tut && wd.length && Math.random() < .3) run.cur.mimic = wd[rnd(wd.length)]; } if (type === 'riddle' || type === 'rest') run.cur.riddle = RUN_.pickGeneral(run.world || 1, rnd, run.tut); else if (type !== 'treasure') run.cur.level = run.approach ? run.approach : run.tut ? '1-1' : pickRunLevel(type);
      run.phase = 'encounter'; run.tries = 0; run.log.push(`🚪 Entras por la puerta ${act.n}: ${RUN_.types[type].emoji} ${RUN_.types[type].name}`); save(); sfx.click();
      if (rscene && rscene.enter) await rscene.enter(act.n - 1);
      if (fade) fade.style.opacity = 1; await sleep(280); buildRunScene(); renderRunStatus(); editor.set(runStarter()); if (fade) fade.style.opacity = 0;
    }
    else if (act.t === 'fight') { openLevel(run.cur.level, true); }
    else if (act.t === 'chest') {
      const ch = RUN_.chestAt(act.n, run.world || 1, run.cur && run.cur.scene); run.cur.chest = act.n; run.cur.riddle = RUN_.pickRiddle(run.tut ? 1 : ch.id, run.tut ? 1 : (run.world || 1), rnd); run.tries = 0;
      if (run.cur.mimic === act.n) { run.cur.trap = true; run.cur.riddle = RUN_.pickRiddle(1, run.tut ? 1 : (run.world || 1), rnd); run.log.push('👹 ¡Era un cofre MIMO! Te muerde'); runHurt(6 + 3 * (run.world || 1), '¡Era un mimo!'); sfx.hurt(); }
      else run.log.push(`🔐 Eliges el ${ch.name.toLowerCase()} (reto ${ch.tier.toLowerCase()})`);
      save(); sfx.click(); buildRunScene(); renderRunStatus(); editor.set('// Resuelve el reto del cofre ' + act.n + ': heroe.responder("...");\n');
    }
    else if (act.t === 'answer') {
      const r = run.cur.riddle, ch = run.cur.type === 'treasure' ? RUN_.chestAt(run.cur.chest, run.world || 1, run.cur && run.cur.scene) : null;
      if (ch && norm(act.v) === norm(r.a)) {
        if (rscene && rscene.open) await rscene.open(); const trap = !!run.cur.trap, gold = Math.round((ch.gold[0] + rnd(ch.gold[1] + 1)) * goldMul() * (trap ? 2 : 1)); S.gold += gold; const xpG = Math.round(ch.xp * xpMul()), up = addXp(xpG);
        const rows = [['🪙', `<b>+${gold} monedas</b>`], ['✨', `<b>+${xpG} XP</b>${up ? ' · ¡subes a nivel ' + S.lvl + '!' : ''}`]]; if (Math.random() < ch.potion + luck() / 100) { S.potions++; rows.push(['🧪', '<b>+1 poción de curación</b>']); }
        const gearChance = trap ? 1 : [.2, .35, .55, .8][ch.id - 1] + luck() / 50;   // los cofres mejores guardan equipo más a menudo
        if (Math.random() < gearChance) { const ti = Math.min(3, RUN_.gearPower(ch, run.world || 1) + (trap ? 1 : 0)), src = { foe: { name: ch.name.toLowerCase() } }, it = newItem(Math.random() < .65 ? rollArmor(src, ti, ti >= 3) : rollWeapon(src, ti, ti >= 3)); rows.push(['🎁', `<b>${esc(it.name)}</b><div class="small">${gearLine(it)}</div><div class="small ${it.only === heroClass() ? 'okk' : 'err'}">${it.only === heroClass() ? 'Guardado en la mochila: equípalo en 🎒 Inventario' : 'Solo para ' + CLASS_NAME[it.only] + ': véndelo en la tienda'}</div>`]); }
        const b = giveRandomBook(ch.book); sfx.win(); run.log.push(`📦 ${ch.name} abierto`); const done = leaveRoom(); save(); refreshTop();
        consoleHtml('<span class="okk"><b>✔ ¡Correcto! El cofre se abre.</b></span>');
        await rewardModal(trap ? '👹 ¡Mimo sometido!' : `📦 ¡${ch.name} abierto!`, rows, b);   // se queda en pantalla hasta que pulses «Continuar»
        if (done) { await modal(`<h2>🏆 Mazmorra completada</h2>${completeRun()}<div class="actions"><button class="btn primary" data-close>Volver al mapa</button></div>`); renderMap(); } else { renderRun(); }
      }
      else if (ch) {
        run.tries++; runHurt(ch.hurt, 'Reto del cofre fallado');
        if (run.tries >= 2) { run.log.push('🔒 El cofre se bloquea para siempre.'); leaveRoom(); save(); consoleHtml('<span class="err">✘ Incorrecto otra vez. El cofre se bloquea (la respuesta era <b>' + esc(r.a) + '</b>).</span>'); await sleep(1600); renderRun(); }
        else { save(); consoleHtml('<span class="err">✘ Respuesta incorrecta. Te queda 1 intento.</span>'); renderRunStatus(); }
      }
      else if (run.cur.type === 'rest' && norm(act.v) === norm(r.a)) {
        const heal = Math.min(S.maxHp - S.hp, 40); S.hp += heal; const up = addXp(10); run.log.push(`⛲ ¡Acertaste! Bebes de la fuente: +${heal} de vida · +10 XP`); sfx.win(); leaveRoom(); save(); refreshTop();
        consoleHtml('<span class="okk"><b>✔ ¡Correcto!</b></span>');
        await rewardModal('⛲ ¡La fuente te cura!', [['❤️', `<b>+${heal} de vida</b>${heal === 0 ? ' <span class="small">(ya tenías la vida completa)</span>' : ''}`], ['✨', `<b>+10 XP</b>${up ? ' · ¡subes a nivel ' + S.lvl + '!' : ''}`]]); renderRun();
      }
      else if (norm(act.v) === norm(r.a)) {
        const gold = Math.round((15 + rnd(11)) * goldMul()); S.gold += gold; const xpR = Math.round(25 * xpMul()), up = addXp(xpR); const b = giveRandomBook(run.approach ? .45 : .2); run.log.push(`✅ ¡Acertaste! +${xpR} XP · +${gold} 🪙${b ? ' · 📚 «' + BOOKS[b].title + '»' : ''}`); sfx.win(); leaveRoom(); save(); refreshTop();
        consoleHtml('<span class="okk"><b>✔ ¡Correcto!</b></span>');
        await rewardModal('📖 ¡Acertijo resuelto!', [['🪙', `<b>+${gold} monedas</b>`], ['✨', `<b>+${xpR} XP</b>${up ? ' · ¡subes a nivel ' + S.lvl + '!' : ''}`]], b); renderRun();
      } else {
        run.tries++; if (run.cur.type !== 'rest') runHurt(6, 'Respuesta incorrecta');
        if (run.tries >= 2) { run.log.push('🧱 El altar se apaga: pierdes el acertijo.'); leaveRoom(); save(); consoleHtml('<span class="err">✘ Incorrecto otra vez. El acertijo se desvanece (la respuesta era <b>' + esc(r.a) + '</b>).</span>'); await sleep(1400); renderRun(); }
        else { save(); consoleHtml('<span class="err">✘ Respuesta incorrecta. Te queda 1 intento.</span>'); renderRunStatus(); }
      }
    }
    else if (act.t === 'flee') {
      const t = run.cur.type, cost = { enemy: 8, elite: 12, boss: 18 }[t] || 0;
      if (cost) runHurt(cost, 'Huyes con el enemigo pisándote los talones'); else run.log.push('🏃 Das media vuelta.');
      if (run.approach) { if (cost) { endApproach(); renderMap(); return; } leaveRoom(); renderRun(); return; }   // en un reto previo: huir del reto = volver al mapa
      if (t === 'boss') { run.phase = 'choose'; run.cur = null; } else { room.blocked[run.cur.door] = true; if (room.blocked.every(Boolean)) { run.log.push('🧱 Todas las puertas están cerradas: sigues adelante.'); advanceRoom(); } else { run.phase = 'choose'; run.cur = null; } }
      save(); renderRun();
    }
    else if (act.t === 'wrong') { runHurt(5, 'Instrucción equivocada: ' + act.msg.replace(/<[^>]+>/g, '')); consoleHtml(`<span class="err"><b>✘ Esa instrucción no sirve aquí.</b></span><br>${esc(act.msg)}<br><span class="dim">${run.tut ? 'Tranquila: en el tutorial equivocarse no cuesta vida.' : 'Un descuido te cuesta 5 de vida.'}</span>`); save(); renderRunStatus(); }
  } finally { runBusy = false; }
}
function runExec() {
  if (!S.run || runBusy) return; const code = editor.get(), act = {}, heroe = makeRunHero(act);
  const res = JV.run({ code, globals: { heroe }, maxSteps: 200000 }); editor.setError(0);
  if (res.error && res.error.type === 'compile') { consoleHtml(compileHtml({ msg: res.error.msg, line: res.error.line }) + (S.run.tut ? '<div class="explain">🧭 Revisa: ¿la orden empieza por <code>heroe.</code> en minúsculas? ¿tiene los paréntesis <code>( )</code> y termina en <code>;</code>? Puedes pulsar el botón «Escribirlo por mí» de la guía.</div>' : '')); editor.setError(res.error.line); return; }
  let h = res.segs.length ? segsHtml(res.segs) : ''; if (res.error) h += (h ? '\n' : '') + exceptionHtml(res.error);
  if (!act.t && !res.error) h += '<span class="dim">No ha pasado nada: tu código no ha llamado a ninguna acción del héroe. Prueba con <code>heroe.ayuda();</code></span>';
  if (h) consoleHtml(h); if (act.t) handleRunAct(act);
}
function runHelp() {
  modal(`<h2>❓ Cómo se juega</h2><p>Cada orden es una <b>instrucción de Java</b> sobre el objeto <code>heroe</code>, que acaba en <code>;</code>. Por ejemplo <code>heroe.entrar(2);</code>.</p>
    <ul><li>Cada habitación tiene puertas numeradas y <b>no sabes qué hay tras ellas</b>: enemigo, enemigo temible, tesoro o acertijo. Al final de cada mazmorra espera un jefe.</li>
    <li>Con <code>heroe.escuchar(n);</code> puedes pegar la oreja una vez por habitación y tener una pista.</li>
    <li>Ante un enemigo hay que <b>escribir la orden</b> para entrar en combate. Si te equivocas de orden, pierdes un poco de vida.</li>
    <li>Como son instrucciones de verdad, puedes usar variables: <code>int p = 2; heroe.entrar(p);</code></li></ul>
    <div class="actions"><button class="btn" data-close>Entendido</button></div>`);
}

/* ================= el Maestro Byte: un mago que resuelve dudas una vez por nivel ================= */
const WIZ_KB = [
  [/variable/, 'Una <b>variable</b> es una cajita con nombre donde guardas un dato. Tiene <b>tipo</b>, <b>nombre</b> y <b>valor</b>: <code>int vidas = 3;</code> (tipo <code>int</code>, nombre <code>vidas</code>, valor 3). Puedes cambiar su valor después: <code>vidas = vidas - 1;</code>. El nombre empieza en minúscula y no puede llevar espacios.'],
  [/atribut|propiedad|campo/, 'Un <b>atributo</b> es un dato que guarda un objeto (por ejemplo, la <i>vida</i> de un héroe o el <i>nombre</i> de una persona). Dentro de una clase se declaran como variables: <code>private int vida;</code>. Desde fuera se suelen consultar con métodos «get», como <code>heroe.getVida()</code>.'],
  [/par[aá]metro|argumento/, 'Un <b>parámetro</b> es un dato extra que le das a un método para que sepa qué hacer: va <b>dentro de los paréntesis</b>. En <code>heroe.entrar(2);</code> el <code>2</code> es el parámetro. Si hay varios se separan con comas: <code>suma(3, 4)</code>. Al definir el método declaras su tipo: <code>int suma(int a, int b)</code>.'],
  [/m[eé]todo|funci[oó]n/, 'Un <b>método</b> es un bloque de código con nombre que hace una tarea. Se llama así: <code>objeto.nombre(parámetros);</code>. Al definirlo indicas qué devuelve: <code>int doble(int n) { return n * 2; }</code>. Si no devuelve nada, se escribe <code>void</code>.'],
  [/clase|objeto/, 'Una <b>clase</b> es el molde (por ejemplo <code>Heroe</code>) y un <b>objeto</b> es cada ejemplar creado con ese molde: <code>Heroe h = new Heroe();</code>. La clase define los <b>atributos</b> (datos) y los <b>métodos</b> (acciones) que tendrán todos sus objetos.'],
  [/\bmain\b/, '<code>main</code> es el método por el que Java empieza a ejecutar un programa: <code>public static void main(String[] args) { ... }</code>. Todo lo que quieres que ocurra al arrancar va dentro de sus llaves. En el editor: escribe <code>main</code> y pulsa Ctrl + Espacio.'],
  [/println|sysout|imprimir|pantalla|escribir/, '<code>System.out.println("texto");</code> escribe el texto en pantalla y salta de línea. <code>System.out.print(...)</code> lo escribe sin saltar. Lo que va entre paréntesis es el parámetro; los textos llevan comillas dobles.'],
  [/punto y coma|;|terminar|acabar/, 'El <b>punto y coma (;)</b> indica dónde acaba una orden, igual que el punto en una frase. Si falta, Java da error de compilación en esa línea (o en la siguiente). Los bloques con llaves <code>{ }</code> no llevan ; al cerrar.'],
  [/string|cadena|texto|comillas/, '<code>String</code> es el tipo para <b>texto</b> y se escribe entre <b>comillas dobles</b>: <code>String nombre = "Ana";</code>. Es una <b>clase</b> (tipo por referencia), no un tipo primitivo, y tiene métodos como <code>nombre.length()</code> o <code>nombre.toUpperCase()</code>. Un solo carácter es <code>char</code> con comillas simples: <code>\'a\'</code>.'],
  [/\bint\b|double|tipo|primitiv|boolean|\blong\b|float|\bchar\b|byte|short/, 'Tipos <b>primitivos</b>: enteros <code>byte, short, int, long</code> (de menor a mayor rango), decimales <code>float, double</code>, lógico <code>boolean</code> (true/false) y carácter <code>char</code>. El resto (String, arrays, tus clases…) son tipos por <b>referencia</b>: variables que apuntan a un objeto.'],
  [/constante|final/, 'Una <b>constante</b> es una variable que no cambia nunca: se declara con <code>final</code> y por convención en MAYÚSCULAS: <code>final double IVA = 0.21;</code>. Si intentas modificarla, Java da error.'],
  [/\bif\b|condici[oó]n|si no|else/, '<code>if</code> ejecuta un bloque solo si la condición es verdadera: <code>if (vida &lt; 40) { ... } else { ... }</code>. La condición va entre paréntesis y debe ser <code>boolean</code>. Compara con <code>==</code> (no con <code>=</code>, que asigna).'],
  [/\bfor\b|while|bucle|repetir/, 'Un <b>bucle</b> repite código. <code>for (int i = 0; i &lt; 5; i++) { ... }</code> cuando sabes cuántas veces; <code>while (condición) { ... }</code> mientras algo sea cierto. Cuida que la condición llegue a ser falsa o el bucle será infinito.'],
  [/array|vector|arreglo|lista/, 'Un <b>array</b> guarda varios valores del mismo tipo: <code>int[] notas = {7, 5, 9};</code>. Se accede por posición empezando en 0: <code>notas[0]</code> es 7. Su tamaño es <code>notas.length</code>. Pasarse de posición lanza <code>ArrayIndexOutOfBoundsException</code>.'],
  [/interfaz|interface/, 'Una <b>interfaz</b> es un contrato: declara métodos sin código y las clases que la implementan se comprometen a escribirlos: <code>interface Volador { void volar(); }</code> y <code>class Pajaro implements Volador { ... }</code>.']
];
function wizardLocal(q) {
  const n = q.toLowerCase(), hits = WIZ_KB.filter(([re]) => re.test(n)).slice(0, 2);
  if (hits.length) return hits.map(h => h[1]).join('<hr>');
  return 'Esa duda es buena, pero con mi libro de conjuros sin conexión no sé responderla todavía. Prueba a releer la pestaña <b>📘 Lección</b> del reto o el <b>📖 Grimorio</b>, y pregúntame con otras palabras (por ejemplo: «¿qué es una variable?», «¿para qué sirve un parámetro?»).';
}
const wizFmt = t => esc(t).replace(/```(?:java)?\n?([\s\S]*?)```/g, (m, c) => `<pre><code>${c}</code></pre>`).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
async function wizardAnswer(q, lv) {
  let sample = null; try { sample = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { sample = null; }
  if (sample) {
    const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
    const prompt = `Eres el Maestro Byte, un mago amable que enseña Java a una persona que está empezando (curso de DAM). Responde en español, con palabras sencillas, en un máximo de 150 palabras. Usa un ejemplo de código corto si ayuda (entre triple acento grave). No des la solución completa del reto: explica el concepto.\n\nReto actual: «${lv.title}».\nEnunciado: ${strip(lv.task)}\nLección: ${strip(lv.lesson)}\n\nDuda de la estudiante: ${q}`;
    try { const r = await sample([{ role: 'user', content: prompt }], { cache: false }); if (r && r.text) return { html: wizFmt(r.text) }; } catch (e) { if (!e || e.code !== 'not_granted') console.warn('sample:', e); }
  }
  return { html: wizardLocal(q) };
}
async function wizard(lv) {
  const p = modal(`<div class="wiz"><div class="wface"></div><div class="wbody"><h2>Maestro Byte</h2><div class="wchat" id="wchat"><div class="wm">Has superado <b>«${esc(lv.title)}»</b>. Dime, ¿te ha quedado alguna duda sobre lo que has visto en este reto?</div></div>
    <div class="actions" id="wact"><button class="btn" data-close>No, todo claro</button><button class="btn primary" id="wyes">Sí, tengo una duda</button></div>
    <div id="wask" hidden><textarea id="wq" rows="3" placeholder="Escribe tu duda con tus propias palabras…"></textarea><div class="actions"><button class="btn" data-close>Ya no tengo más dudas</button><button class="btn primary" id="wsend">Preguntar</button></div></div></div></div>`);
  const chat = $('#wchat'), add = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d; };
  $('#wyes').onclick = () => { $('#wact').hidden = true; $('#wask').hidden = false; $('#wq').focus(); };
  const send = async () => {
    const q = $('#wq').value.trim(); if (!q || $('#wsend').disabled) return; $('#wsend').disabled = true; $('#wq').value = '';
    add('wu', esc(q)); const th = add('wm dim', '🔮 Consultando mis libros…'); const a = await wizardAnswer(q, lv);
    th.className = 'wm'; th.innerHTML = a.html; $$('code', th).forEach(c => { if (c.parentElement.tagName === 'PRE') c.innerHTML = window.highlightJava(c.textContent); });
    add('wm', '¿Alguna duda más? Escríbela abajo, o ciérralo si ya está todo claro.'); $('#wsend').disabled = false; $('#wq').focus();
  };
  $('#wsend').onclick = send; $('#wq').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } });
  await p;
}

/* ================= modales ================= */
function modal(html, wide) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}">${html}</div>`; modalRoot.appendChild(bg);
    const close = v => { bg.remove(); res(v); };
    if (!bg.querySelector('[data-nobg]')) {   // «✕» arriba a la derecha: equivale a pulsar fuera de la ventana
      const x = document.createElement('button'); x.className = 'mclose'; x.type = 'button'; x.title = 'Cerrar'; x.setAttribute('aria-label', 'Cerrar'); x.textContent = '✕';
      x.addEventListener('click', ev => { ev.stopPropagation(); sfx.click(); close(null); }); bg.firstElementChild.appendChild(x);
    }
    bg.addEventListener('click', e => {
      const c = e.target.closest('[data-close]'); if (c) { sfx.click(); close(c.dataset.close || true); return; }
      if (e.target === bg && !bg.querySelector('[data-nobg]')) close(null);
    });
    modalRoot.dataset.last = '';
    bg._api = { close, el: bg };
  });
}
function topModal() { return modalRoot.lastElementChild; }

function openGrimoire(sel) {
  const unlocked = Object.keys(levels).filter(id => S.done[id] || (S.seen[id])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!unlocked.length) { modal('<div class="mhead"><img src="assets/ui/grim_book.png" alt=""><div><h2>Grimorio</h2><p>Aún está vacío. Cada vez que leas la lección de un reto, quedará guardada aquí para repasarla cuando quieras.</p></div></div><div class="actions"><button class="btn" data-close>Cerrar</button></div>'); return; }
  sel = sel && unlocked.includes(sel) ? sel : unlocked[0];
  modal(`<div class="mhead"><img src="assets/ui/grim_book.png" alt=""><div><h2>Grimorio</h2><p class="small">Todas las lecciones que ya has leído, para repasarlas cuando quieras.</p></div></div><div class="gri"><div class="list">${unlocked.map(id => `<button data-gri="${id}" class="${id === sel ? 'on' : ''}">${levels[id].foe.emoji} ${esc(levels[id].title)}</button>`).join('')}</div>
    <div class="body" id="gbody"><h3>${esc(levels[sel].title)}</h3>${levels[sel].lesson}</div></div><div class="actions"><button class="btn" data-close>Cerrar</button></div>`, true);
  $$('#gbody pre code').forEach(c => { c.innerHTML = window.highlightJava(c.textContent); });
}
const SHOP = [
  ...Object.keys(SK.unlock).map((t, i) => { const bid = SK.unlock[t]; return { id: 'book_' + t, icon: 'book', name: 'Libro «' + BOOKS[bid].title + '»', desc: 'Te enseñará «' + skillDef(t).name + '» cuando superes su reto de examen.', price: () => 120 + 60 * i, can: () => !S.books[bid], buy: () => { S.books[bid] = 'new'; } }; }),  { id: 'pot', icon: 'potion', name: 'Poción de curación', desc: 'Restaura 40 de vida. Se usa con el botón «Poción» dentro de un combate.', price: () => 25, can: () => true, buy: () => { S.potions++; } },
  { id: 'pack', icon: 'potion', name: 'Pack de 3 pociones', desc: 'Tres pociones de curación con descuento.', price: () => 65, can: () => true, buy: () => { S.potions += 3; } },
  { id: 'hint', icon: 'bulb', name: 'Pergamino de pista', desc: 'Una pista que <b>no te quita estrellas</b>. Se gasta al pedirla en un reto.', price: () => 40, can: () => true, buy: () => { S.tokens = (S.tokens || 0) + 1; }, have: () => S.tokens || 0 },
  { id: 'vit', icon: 'heart', name: 'Elixir de vitalidad', desc: '+10 de vida máxima para siempre (hasta 5 veces).', price: () => 80 + 40 * (S.vitBought || 0), can: () => (S.vitBought || 0) < 5, buy: () => { S.vitBought = (S.vitBought || 0) + 1; S.maxHp += 10; S.hp += 10; }, have: () => (S.vitBought || 0) + '/5' },
  { id: 'guard', icon: 'shield', name: 'Amuleto de guardia', desc: '+1 uso de «Guardia» en cada reto (hasta 3).', price: () => 120 * (1 + (S.guardBonus || 0)), can: () => (S.guardBonus || 0) < 3, buy: () => { S.guardBonus = (S.guardBonus || 0) + 1; }, have: () => (S.guardBonus || 0) + '/3' }
];
let gearScreen = 'shop';
const reopenGear = () => gearScreen === 'inv' ? openInventory() : openShop();
/* ================= inventario ================= */
function openInventory() {
  gearScreen = 'inv';
  const SL = [['helmet', 'Casco', 'gear/helm_w1a'], ['chest', 'Peto', 'gear/chest_w1a'], ['gloves', 'Guantes', 'gear/gloves_w1a'], ['legs', 'Pantalones', 'gear/legs_w1a'], ['boots', 'Botas', 'gear/boots_w1a'], ['weapon', 'Arma', 'ui/swords']];
  const slots = SL.map(([s, name, em]) => { const it = curGear(s); return `<div class="invslot ${it ? 'on' : ''}"><div class="lart">${it ? (it.img ? `<img src="assets/gear/${it.img}.png" alt=""${it.hue ? ` style="filter:hue-rotate(${it.hue}deg)"` : ""}>` : `<span class="wicon">${it.icon}</span>`) : `<img class="ghost" src="assets/${em}.png" alt="">`}</div><div><b>${name}</b><div class="small">${it ? esc(it.name) + '<br>' + gearLine(it) : 'vacío'}</div></div></div>`; }).join('');
  const owned = SLOTS.map(([slot, list]) => list.filter(h => gear().owned[h.id]).map(h => `<div class="card shopitem"><div class="sic"><img src="assets/gear/${h.img}.png" alt=""></div><div class="sbody"><b>${h.name}</b> <span class="small">· defensa +${h.def}</span></div><div class="shopbtns"><button class="btn ${gear()[slot] === h.id ? '' : 'good'}" data-act="equipgear" data-slot="${slot}" data-id="${h.id}">${gear()[slot] === h.id ? '✔ Equipado' : 'Equipar'}</button></div></div>`).join('')).join('');
  const nb = Object.values(S.books || {}).length, nl = Object.keys(S.learned || {}).length;
  modal(`<img class="hdrimg" src="assets/ui/hdr_inventario.jpg" alt="Inventario">
    <div class="invwrap"><div class="invcol"><div class="invhero">${heroSheet(300)}</div><p class="small" style="text-align:center">🛡️ Defensa total: <b>+${defense()}</b><br>✨ XP <b>+${Math.round((xpMul() - 1) * 100)}%</b> · 🪙 oro <b>+${Math.round((goldMul() - 1) * 100)}%</b> · 🍀 suerte <b>+${luck()}</b></p></div>
    <div class="invcol grow"><h3 class="shopsub">Equipado</h3><div class="invslots">${slots}</div>
      <h3 class="shopsub">Objetos</h3><div class="invstats"><span>${uic('coin')} <b>${S.gold}</b> monedas</span><span>${uic('potion')} <b>${S.potions}</b> pociones</span><span>📜 <b>${S.tokens || 0}</b> pergaminos de pista</span><span>📚 <b>${nb}</b> libros</span><span>✨ <b>${nl}</b> habilidades</span></div>
      ${owned ? '<h3 class="shopsub">Equipo comprado</h3>' + owned : ''}${bagHtmlFor() || '<p class="small">🎒 Tu mochila está vacía: derrota enemigos y elige su arma o su armadura como botín.</p>'}</div></div>
    <div class="actions"><button class="btn good" data-close="shop">🛒 Ir a la tienda</button><button class="btn" data-close>Cerrar</button></div>`, true).then(v => { if (v === 'shop') openShop(); });
}
/* ================= logros ================= */
function achievementList() {
  const doneIds = Object.keys(S.done || {}), n = doneIds.length, three = doneIds.filter(id => S.done[id].stars === 3).length;
  const bosses = doneIds.filter(id => levels[id] && levels[id].kind === 'boss').length, worldsDone = worlds.filter(w => nodeDone(w.nodes[w.nodes.length - 1])).length;
  const worn = ['helmet', 'chest', 'gloves', 'legs', 'boots'].filter(s => curGear(s)).length, nb = Object.keys(S.books || {}).length, nl = Object.keys(S.learned || {}).length;
  const A = (icon, name, desc, cur, goal) => ({ icon, name, desc, cur: Math.min(cur, goal), goal, ok: cur >= goal });
  return [
    A('🎓', 'Aprendiz', 'Completa el tutorial', S.tutDone ? 1 : 0, 1),
    A('⚔️', 'Primera sangre', 'Supera tu primer reto', n, 1),
    A('🗡️', 'Aventurero', 'Supera 10 retos', n, 10),
    A('🛡️', 'Veterano', 'Supera 30 retos', n, 30),
    A('🏰', 'Maestro de la mazmorra', 'Supera 80 retos', n, 80),
    A('👑', 'Matajefes', 'Derrota a 1 jefe', bosses, 1),
    A('🐉', 'Azote de jefes', 'Derrota a 4 jefes', bosses, 4),
    A('⭐', 'Sin ayuda', 'Consigue 3 estrellas en 10 retos', three, 10),
    A('🌟', 'Impecable', 'Consigue 3 estrellas en 40 retos', three, 40),
    A('🗺️', 'Explorador', 'Termina un mundo entero', worldsDone, 1),
    A('📈', 'Subiendo', 'Llega al nivel 5', S.lvl, 5),
    A('🔥', 'Héroe curtido', 'Llega al nivel 10', S.lvl, 10),
    A('🪙', 'Buen ahorrador', 'Ten 500 monedas a la vez', S.gold, 500),
    A('📚', 'Rata de biblioteca', 'Consigue 5 libros', nb, 5),
    A('🔮', 'Aprendiz de mago', 'Aprende 3 habilidades', nl, 3),
    A('🧥', 'Bien equipado', 'Ponte casco, peto, guantes, pantalones y botas a la vez', worn, 5),
    A('🎒', 'Cazador de botín', 'Guarda 3 objetos en la mochila', Object.keys(bag()).length, 3)
  ];
}
function openAchievements() {
  const L = achievementList(), got = L.filter(a => a.ok).length;
  modal(`<img class="hdrimg" src="assets/ui/hdr_logros.jpg" alt="Logros">
    <p style="text-align:center">Has conseguido <b>${got}</b> de <b>${L.length}</b> logros.</p>
    <div class="achgrid">${L.map(a => `<div class="ach ${a.ok ? 'got' : ''}"><div class="aic">${a.ok ? a.icon : '🔒'}</div><div class="abody"><b>${esc(a.name)}</b><div class="small">${esc(a.desc)}</div><div class="abar"><i style="width:${a.cur / a.goal * 100}%"></i></div><div class="small">${a.ok ? '✔ Conseguido' : a.cur + ' / ' + a.goal}</div></div></div>`).join('')}</div>
    <div class="actions"><button class="btn" data-close>Cerrar</button></div>`, true);
}
function openShop() {
  gearScreen = 'shop';
  const items = SHOP.map(it => {
    const price = it.price(), ok = it.can(), afford = S.gold >= price;
    return `<div class="card shopitem"><div class="sic">${it.icon === 'heart' ? SVG.heart : uic(it.icon)}</div><div class="sbody"><b>${it.name}</b>${it.have ? ` <span class="small">· tienes ${it.have()}</span>` : ''}<div class="small">${it.desc}</div></div>
      <button class="btn good" data-act="buyitem" data-id="${it.id}" ${!ok || !afford ? 'disabled' : ''}>${ok ? `Comprar · ${price} ${uic('coin')}` : 'Agotado'}</button></div>`;
  }).join('');
  const gearHtml = heroClass() === 'warrior'
    ? SLOTS.map(([slot, list, title]) => `<h3 class="shopsub">${title}</h3>` + list.map(h => {
      const own = gear().owned[h.id], eq = gear()[slot] === h.id;
      return `<div class="card shopitem"><div class="sic"><img src="assets/gear/${h.img}.png" alt=""></div><div class="sbody"><b>${h.name}</b> <span class="small">· defensa +${h.def}</span><div class="small">Reduce en ${h.def} el daño de cada ronda enemiga (se suma al resto del equipo).</div></div>
        ${own ? `<button class="btn ${eq ? '' : 'good'}" data-act="equipgear" data-slot="${slot}" data-id="${h.id}">${eq ? '✔ Equipado' : 'Equipar'}</button>` : `<button class="btn good" data-act="buygear" data-slot="${slot}" data-id="${h.id}" ${S.gold < h.price ? 'disabled' : ''}>Comprar · ${h.price} ${uic('coin')}</button>`}</div>`;
    }).join('')).join('') + `<p class="small">Defensa total: <b>+${defense()}</b>.</p>`
    : '<p class="small">El equipo de las otras clases llegará pronto.</p>';  modal(`<div class="mhead"><img src="assets/ui/potion.png" alt="" style="height:64px"><div><h2>Tienda del buhonero</h2><p>Tienes <b>${uic('coin')}${S.gold}</b> · <b>${uic('potion')}${S.potions}</b> pociones · <b>📜 ${S.tokens || 0}</b> pergaminos de pista.</p></div></div><div class="shopwrap"><div class="shoplist">${items}${gearHtml}${bagHtmlFor()}</div><aside class="shophero">${heroSheet(330)}<div class="small">Así te ven los enemigos.<br>Defensa total: <b>+${defense()}</b></div></aside></div>
    <div class="actions"><button class="btn" data-close>Cerrar</button></div>`, true);
}
function openSettings() {
  modal(`<h2>⚙️ Ajustes</h2>
    ${Cloud.enabled ? (Cloud.user ? `<p>☁️ <b>${esc(Cloud.user.name)}</b> <span class="small">${esc(Cloud.user.email)}</span> <button class="btn small" data-act="logout">Cerrar sesión</button></p>` : '<p class="small">☁️ Sin sesión: tu progreso solo está en este navegador. Vuelve a la pantalla de inicio para entrar con Google.</p>') : '<p class="small">☁️ Cuentas desactivadas: falta pegar la configuración de Firebase (mira LEEME-CUENTAS.md).</p>'}
    <p><button class="btn" data-act="ambient">${S.ambient === false ? '🔇 Ambiente: apagado' : '🎵 Ambiente: encendido'}</button> <label class="small">Volumen <input id="ambvol" type="range" min="0" max="100" value="${Math.round((typeof S.vol === 'number' ? S.vol : .5) * 100)}"></label></p>
    <p><button class="btn" data-act="approach">${S.approachOn === false ? '🚪 Puertas antes de cada reto: no' : '🚪 Puertas antes de cada reto: sí'}</button></p>
    <p><button class="btn" data-act="sound">${S.sound ? '🔊 Sonido: activado' : '🔇 Sonido: desactivado'}</button>
    <button class="btn" data-act="view">${S.view === '3d' ? '🧊 Vista: 3D' : '🎨 Vista: 2D'}</button></p>
    <p class="small">El cambio de vista se aplica al entrar en el siguiente reto.</p>
    <p class="small">Copia de seguridad (por si cambias de navegador u ordenador):</p>
    <p><button class="btn small" data-act="export">📤 Exportar progreso</button> <button class="btn small" data-act="import">📥 Importar</button></p>
    <textarea id="savebox" style="width:100%;height:70px;background:#0c0912;color:#ccc;border:1px solid var(--line);border-radius:8px;font:12px monospace" placeholder="Aquí aparece/pega tu código de guardado"></textarea>
    <p><button class="btn small ghost" data-act="newgame">🗑️ Borrar todo y empezar de cero</button></p>
    <div class="actions"><button class="btn" data-close>Cerrar</button></div>`);
}

/* ================= eventos ================= */
document.addEventListener('click', async e => {
  const pick = e.target.closest('[data-class],[data-gender],[data-col]');
  if (pick) { const at = pick.hasAttribute('data-class') ? 'data-class' : pick.hasAttribute('data-gender') ? 'data-gender' : 'data-col'; $$('[' + at + ']', pick.parentElement).forEach(b => b.classList.remove('sel')); pick.classList.add('sel'); refreshHeroPreview(); if (at === 'data-gender') { const nf = $('#name2'); if (nf && (!nf.value.trim() || isDefName(nf.value.trim()))) nf.value = defName(heroSel()); } return; }
  const tabB = e.target.closest('[data-tab]'); if (tabB && R) { showTab(tabB.dataset.tab); return; }
  const gri = e.target.closest('[data-gri]'); if (gri) { const bg = topModal(); bg._api.close(); openGrimoire(gri.dataset.gri); return; }
  const row = e.target.closest('.test'); if (row && R) { showTestDetail(+row.dataset.i); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  sfx.click();
  switch (b.dataset.act) {
    case 'start': {
      const name = ($('#name').value || '').trim() || defName(heroSel());
      S = newState(name, heroSel(), selected('data-col')); if (Cloud.user) S.uid = Cloud.user.uid; save(); renderMap(); break;
    }
    case 'custom': openCustomize(); break;
    case 'togglew': { const sec = b.closest('section'); if (sec) { const closed = sec.classList.toggle('collapsed'); S.wopen = S.wopen || {}; S.wopen[b.dataset.w] = !closed; save(); } break; }
    case 'savecustom': {
      const nm = ($('#name2').value || '').trim(); S.hero = heroDef(heroSel() || S.hero).id; S.name = !nm || isDefName(nm) ? defName(S.hero) : nm; S.avatar = heroDef(S.hero).emoji; S.weapon = heroDef(S.hero).weapon; S.color = selected('data-col') || S.color;
      save(); topModal()._api.close(); if (R && $('.room')) { const code = editor.get(); S.codes[R.lv.id] = code; renderRoom(); } else renderMap(); break;
    }
    case 'google': try { await Cloud.google(); await adoptCloud(); renderTitle(); } catch (err) { tell(Cloud.errorText(err)); } break;
    case 'emailform': openEmailForm('login'); break;
    case 'emailswitch': topModal()._api.close(); openEmailForm(b.dataset.mode); break;
    case 'emailreset': { const m = ($('#em-mail').value || '').trim(); if (!m) { $('#em-msg').textContent = 'Escribe primero tu email.'; break; } try { await Cloud.reset(m); $('#em-msg').style.color = '#86efac'; $('#em-msg').textContent = 'Te hemos enviado un email para cambiar la contraseña.'; } catch (err) { $('#em-msg').textContent = Cloud.errorText(err); } break; }
    case 'emailgo': {
      const mail = ($('#em-mail').value || '').trim(), pass = $('#em-pass').value || '', name = $('#em-name') ? $('#em-name').value.trim() : '', msg = $('#em-msg'); msg.style.color = '#fca5a5';
      if (!mail || !pass) { msg.textContent = 'Escribe el email y la contraseña.'; break; }
      try { if (b.dataset.mode === 'create') await Cloud.signUp(mail, pass, name); else await Cloud.signIn(mail, pass); topModal()._api.close(); await adoptCloud(); renderTitle(); } catch (err) { msg.textContent = Cloud.errorText(err); }
      break;
    }
    case 'logout': try { await Cloud.signOut(); } catch (err) { /* ya sin sesión */ } S = null; try { localStorage.removeItem(KEY); } catch (e2) { /* nada */ } $$('.modal-bg').forEach(m => m.remove()); renderTitle(); break;
    case 'newgame':
      if (!S || await ask('¿Seguro? Se borrará todo el progreso guardado' + (Cloud.user ? ' (también el de la nube)' : '') + '.')) { if (Cloud.user) { try { await Cloud.wipe(); } catch (e3) { /* sin conexión */ } } S = null; try { localStorage.removeItem(KEY); } catch (e2) { /* nada */ } $$('.modal-bg').forEach(m => m.remove()); renderTitle(); }
      break;
    case 'map': $$('.modal-bg').forEach(m => m.remove()); window.__mapScrolled = 0; renderMap(); break;
    case 'open': openLevel(b.dataset.id); break;
    case 'attack': attack(); break;
    case 'try': tryRun(); break;
    case 'hint': if ((S.tokens || 0) > 0) { S.tokens--; R.freeHints = (R.freeHints || 0) + 1; save(); } R.hints++; showTab('hints'); break;
    case 'reset': if (await ask('¿Volver al código inicial de este reto?')) { editor.set(R.lv.starter); S.codes[R.lv.id] = R.lv.starter; save(); } break;
    case 'potion':
      if (S.potions <= 0) consoleHtml('<span class="err">No te quedan pociones. Puedes comprar más en la 🧪 Tienda con tus monedas.</span>');
      else if (S.hp >= S.maxHp) consoleHtml('<span class="dim">Ya tienes la vida completa.</span>');
      else { S.potions--; S.hp = Math.min(S.maxHp, S.hp + 40); sfx.win(); save(); setBars(); refreshTop(); floatAt($('.sprite', $('#fh')), '+40', 'ok'); }
      break;
    case 'solution': {
      const ok = await modal(`<h2>🔓 Ver la solución</h2><p>Si la miras, este reto solo te dará <b>1 estrella</b> y la mitad del oro. Intenta entender <i>por qué</i> funciona, no la copies sin más.</p>
        <div class="actions"><button class="btn" data-close>Mejor sigo intentando</button><button class="btn primary" data-close="yes">Ver la solución</button></div>`);
      if (ok === 'yes') {
        R.solution = true;
        modal(`<h2>🔓 Solución</h2><pre style="background:#0c0912;border:1px solid var(--line);border-radius:10px;padding:12px;overflow:auto"><code id="solcode"></code></pre>
          <div class="actions"><button class="btn" data-close>Cerrar</button><button class="btn primary" data-close="use">Copiarla al editor</button></div>`).then(v => { if (v === 'use') { editor.set(R.lv.solution); S.codes[R.lv.id] = R.lv.solution; save(); } });
        $('#solcode').innerHTML = window.highlightJava(R.lv.solution);
      }
      break;
    }
    case 'run': openRun(+b.dataset.w); break;
    case 'runexec': runExec(); break;
    case 'coachins': insertCode(b.dataset.code, !!b.dataset.replace); break;
    case 'coachnav': coachNav(+b.dataset.dir); break;
    case 'format': if (editor) editor.format(); break;
    case 'ambient': S.ambient = S.ambient === false; save(); Ambient.start(); Ambient.apply(); b.textContent = S.ambient === false ? '🔇 Ambiente: apagado' : '🎵 Ambiente: encendido'; break;
    case 'approach': S.approachOn = S.approachOn === false; save(); b.textContent = S.approachOn === false ? '🚪 Puertas antes de cada reto: no' : '🚪 Puertas antes de cada reto: sí'; break;
    case 'bigeditor': { const ed = $('#editor'); if (ed) { ed.classList.toggle('big'); b.textContent = ed.classList.contains('big') ? '⤡ Reducir editor' : '⤢ Ampliar editor'; } break; }
    case 'target': if (R && R.foes) { const i = +b.dataset.i, f = R.foes[i]; if (f && !(f.max && f.hp <= 0)) { R.target = i; renderFoes(); consoleHtml('Apuntas a <b>' + esc(f.name) + '</b>: tus próximos golpes irán contra él.'); } } break;
    case 'order': runOrder(); break;
    case 'quickattack': { const oi = $('#order'); if (oi) { oi.value = 'heroe.atacar(' + (R.target + 1) + ');'; runOrder(); } break; }
    case 'runhelp': runHelp(); break;
    case 'skill': useSkill(b.dataset.type); break;
    case 'skillinfo': skillInfo(b.dataset.type); break;
    case 'library': openLibrary(); break;
    case 'openbook': $$('.modal-bg').forEach(m => m.remove()); openBook(b.dataset.id); break;
    case 'grimoire': openGrimoire(R && R.lv.id); break;
    case 'shop': openShop(); break;
    case 'inventory': openInventory(); break;
    case 'achievements': openAchievements(); break;
    case 'buygear': { const list = SLOTS.find(s => s[0] === b.dataset.slot)[1], h = list.find(x => x.id === b.dataset.id); if (h && !gear().owned[h.id] && S.gold >= h.price) { S.gold -= h.price; gear().owned[h.id] = true; gear()[b.dataset.slot] = h.id; sfx.win(); save(); refreshTop(); topModal()._api.close(); reopenGear(); } break; }
    case 'equipgear': { const slot = b.dataset.slot, id = b.dataset.id; if (gear().owned[id]) { gear()[slot] = gear()[slot] === id ? null : id; save(); refreshTop(); topModal()._api.close(); reopenGear(); } break; }
    case 'equipitem': { const it = bag()[b.dataset.id]; if (it && it.only === heroClass()) { gear()[it.slot] = gear()[it.slot] === it.id ? null : it.id; save(); refreshTop(); topModal()._api.close(); reopenGear(); } break; }
    case 'sellitem': { const it = bag()[b.dataset.id]; if (it) { const worn = Object.keys(gear()).some(k => k !== 'owned' && gear()[k] === it.id); if (!worn) { S.gold += it.sell; delete bag()[it.id]; sfx.win(); save(); refreshTop(); topModal()._api.close(); reopenGear(); } } break; }
    case 'buyitem': { const it = SHOP.find(x => x.id === b.dataset.id); if (it && it.can() && S.gold >= it.price()) { S.gold -= it.price(); it.buy(); sfx.win(); save(); refreshTop(); topModal()._api.close(); reopenGear(); } break; }
    case 'settings': openSettings(); break;
    case 'sound': S.sound = !S.sound; save(); b.textContent = S.sound ? '🔊 Sonido: activado' : '🔇 Sonido: desactivado'; break;
    case 'cam': S.cam = (S.cam || 'fp') === 'fp' ? 'top' : 'fp'; save(); if (d3 && d3.setCam) d3.setCam(S.cam); b.textContent = S.cam === 'fp' ? '🎥 Vista aérea' : '🎥 Primera persona'; break;
    case 'view': if (!HAS3D && S.view !== '3d') { b.textContent = '🧊 3D no disponible (sin conexión)'; break; } S.view = S.view === '3d' ? '2d' : '3d'; save(); b.textContent = S.view === '3d' ? '🧊 Vista: 3D' : '🎨 Vista: 2D'; break;
    case 'export': $('#savebox').value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); break;
    case 'import': {
      try { const j = JSON.parse(decodeURIComponent(escape(atob($('#savebox').value.trim())))); if (j && j.v === 1) { S = j; save(); $$('.modal-bg').forEach(m => m.remove()); renderMap(); } else throw 0; }
      catch (err) { tell('El código de guardado no es válido.'); }
      break;
    }
  }
});

document.addEventListener('keydown', e => { if (e.target && e.target.id === 'order' && e.key === 'Enter') { e.preventDefault(); runOrder(); } });
document.addEventListener('input', e => { if (e.target && e.target.id === 'ambvol') { S.vol = e.target.value / 100; saveSoon(); Ambient.start(); Ambient.apply(); } });
bootGame();
window.__jq = { get S() { return S; }, openLevel, renderMap, renderTitle, adoptCloud, renderRun, heroSheet };
})();
