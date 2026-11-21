/* Ejecutor de niveles: corre el código del jugador contra las pruebas de un nivel */
(function (G) {
'use strict';
const JV = G.JV;

/* valor Java -> valor JS "normal" (para escribir comprobaciones cómodas) */
JV.js = function js(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof JV.Dbl) return v.v;
  if (v instanceof JV.Chr) return String.fromCharCode(v.c);
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof JV.JArray) return v.a.map(js);
  if (v instanceof JV.JList) return v.a.map(js);
  return v;
};

/* vars de prueba -> declaraciones Java (van en la MISMA línea que la primera del jugador) */
const jstr = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
function decl(name, val) {
  if (val && typeof val === 'object' && val.java) return val.java;
  if (val && typeof val === 'object' && 'double' in val) return `double ${name} = ${val.double};`;
  if (val && typeof val === 'object' && 'char' in val) return `char ${name} = '${val.char}';`;
  if (val && typeof val === 'object' && 'long' in val) return `long ${name} = ${val.long}L;`;
  if (typeof val === 'number') return Number.isInteger(val) ? `int ${name} = ${val};` : `double ${name} = ${val};`;
  if (typeof val === 'boolean') return `boolean ${name} = ${val};`;
  if (typeof val === 'string') return `String ${name} = ${jstr(val)};`;
  if (Array.isArray(val)) {
    if (val.length && typeof val[0] === 'string') return `String[] ${name} = {${val.map(jstr).join(', ')}};`;
    if (val.length && val.some(x => !Number.isInteger(x))) return `double[] ${name} = {${val.join(', ')}};`;
    return `int[] ${name} = {${val.join(', ')}};`;
  }
  throw new Error('tipo de variable de prueba no soportado: ' + name);
}
JV.declVars = vars => Object.keys(vars || {}).map(k => decl(k, vars[k])).join(' ');

/* ---------- simulador de combate (API del juego para los niveles con "heroe" y "enemigo") ---------- */
JV.makeSim = function (cfg) {
  const st = {
    heroHp: cfg.heroHp || 100, heroMax: cfg.heroHp || 100, heroDmg: cfg.heroDmg || 10,
    enemyHp: cfg.enemy.hp, enemyMax: cfg.enemy.hp, enemyDmg: cfg.enemy.dmg, enemyName: cfg.enemy.name || 'Enemigo',
    potions: cfg.potions === undefined ? 2 : cfg.potions, heal: cfg.heal || 30,
    fled: false, events: [], actions: 0, healed: 0, attacks: 0
  };
  const over = () => st.fled || st.heroHp <= 0 || st.enemyHp <= 0;
  const guard = I => { if (over()) I.throwJ('IllegalStateException', 'El combate ya terminó: ya no puedes actuar.'); if (++st.actions > 400) I.throwJ('IllegalStateException', 'Demasiadas acciones.'); };
  const retaliate = () => {
    if (st.enemyHp > 0) { st.heroHp = Math.max(0, st.heroHp - st.enemyDmg); st.events.push({ t: 'enemy', dmg: st.enemyDmg, heroHp: st.heroHp, enemyHp: st.enemyHp }); }
  };
  const heroe = JV.native('Heroe', {
    atacar: (a, I) => { guard(I); st.attacks++; st.enemyHp = Math.max(0, st.enemyHp - st.heroDmg); st.events.push({ t: 'hero', dmg: st.heroDmg, heroHp: st.heroHp, enemyHp: st.enemyHp }); retaliate(); },
    curar: (a, I) => {
      guard(I);
      if (st.potions <= 0) { st.events.push({ t: 'text', text: '¡No te quedan pociones!', heroHp: st.heroHp, enemyHp: st.enemyHp }); retaliate(); return; }
      st.potions--; st.healed++; st.heroHp = Math.min(st.heroMax, st.heroHp + st.heal);
      st.events.push({ t: 'heal', dmg: st.heal, heroHp: st.heroHp, enemyHp: st.enemyHp }); retaliate();
    },
    huir: (a, I) => { guard(I); st.fled = true; st.events.push({ t: 'flee', heroHp: st.heroHp, enemyHp: st.enemyHp }); },
    getVida: () => st.heroHp, getVidaMax: () => st.heroMax, getPociones: () => st.potions, getAtaque: () => st.heroDmg,
    estaVivo: () => st.heroHp > 0
  });
  const enemigo = JV.native('Enemigo', {
    estaVivo: () => st.enemyHp > 0, getVida: () => st.enemyHp, getVidaMax: () => st.enemyMax, getNombre: () => st.enemyName, getAtaque: () => st.enemyDmg
  });
  return { state: st, globals: { heroe, enemigo } };
};

/* ---------- simulador de exploración 3D ----------
   cfg: { map:[filas], dir:'E'|'S'|'O'|'N', hp, enemyHp, enemyDmg }
   Mapa: # pared, . suelo, D puerta cerrada, E enemigo, T tesoro, X salida, S inicio */
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1], DNAMES = ['E', 'S', 'O', 'N'];
JV.makeExplore = function (cfg) {
  const grid = cfg.map.map(r => r.split('')); const enemies = [], treasures = []; let start = { x: 1, y: 1 }, exit = null;
  grid.forEach((row, y) => row.forEach((c, x) => {
    if (c === 'S') { start = { x, y }; row[x] = '.'; }
    else if (c === 'E') { enemies.push({ x, y, hp: cfg.enemyHp || 2, alive: true }); row[x] = '.'; }
    else if (c === 'T') { treasures.push({ x, y, taken: false }); row[x] = '.'; }
    else if (c === 'X') { exit = { x, y }; row[x] = '.'; }
  }));
  const st = { x: start.x, y: start.y, dir: Math.max(0, DNAMES.indexOf(cfg.dir || 'E')), hp: cfg.hp || 30, maxHp: cfg.hp || 30, steps: 0, bumps: 0, kills: 0,
    treasures: 0, actions: 0, exited: false, events: [], enemies, treasureList: treasures, exit, grid, attacks: 0, misses: 0 };
  const isWall = (x, y) => !grid[y] || grid[y][x] === undefined || grid[y][x] === '#';
  const enemyAt = (x, y) => enemies.find(e => e.alive && e.x === x && e.y === y);
  const front = () => ({ x: st.x + DX[st.dir], y: st.y + DY[st.dir] });
  const over = () => st.hp <= 0;
  const guard = I => { if (over()) I.throwJ('IllegalStateException', 'Tu héroe ha caído: ya no puede actuar.'); if (++st.actions > 600) I.throwJ('IllegalStateException', 'Demasiadas acciones: ¿bucle infinito?'); };
  const react = () => { // los enemigos adyacentes golpean tras cada acción
    for (const e of enemies) if (e.alive && Math.abs(e.x - st.x) + Math.abs(e.y - st.y) === 1) {
      const d = cfg.enemyDmg || 4; st.hp = Math.max(0, st.hp - d); st.events.push({ t: 'hurt', dmg: d, hp: st.hp });
    }
  };
  const ev = e => st.events.push(e);
  const heroe = JV.native('Heroe', {
    avanzar: (a, I) => {
      guard(I); const f = front();
      if (isWall(f.x, f.y) || grid[f.y][f.x] === 'D' || enemyAt(f.x, f.y)) { st.bumps++; ev({ t: 'bump' }); }
      else { st.x = f.x; st.y = f.y; st.steps++; ev({ t: 'move', x: st.x, y: st.y }); if (exit && st.x === exit.x && st.y === exit.y) { st.exited = true; ev({ t: 'exit' }); } }
      if (!st.exited) react();
    },
    girarIzquierda: (a, I) => { guard(I); st.dir = (st.dir + 3) % 4; ev({ t: 'turn', dir: st.dir }); react(); },
    girarDerecha: (a, I) => { guard(I); st.dir = (st.dir + 1) % 4; ev({ t: 'turn', dir: st.dir }); react(); },
    atacar: (a, I) => {
      guard(I); const f = front(), e = enemyAt(f.x, f.y);
      if (e) { e.hp--; st.attacks++; const killed = e.hp <= 0; if (killed) { e.alive = false; st.kills++; } ev({ t: 'attack', hit: true, x: f.x, y: f.y, killed }); }
      else { st.misses++; ev({ t: 'attack', hit: false }); }
      react();
    },
    abrir: (a, I) => {
      guard(I); const f = front();
      if (grid[f.y] && grid[f.y][f.x] === 'D') { grid[f.y][f.x] = '.'; ev({ t: 'open', x: f.x, y: f.y }); } else ev({ t: 'text', text: 'No hay puerta que abrir delante.' });
      react();
    },
    recoger: (a, I) => {
      guard(I); const t = treasures.find(t => !t.taken && t.x === st.x && t.y === st.y);
      if (t) { t.taken = true; st.treasures++; ev({ t: 'pickup', x: t.x, y: t.y }); } else ev({ t: 'text', text: 'Aquí no hay nada que recoger.' });
      react();
    },
    hayPared: () => { const f = front(); return isWall(f.x, f.y); },
    hayPuerta: () => { const f = front(); return !!grid[f.y] && grid[f.y][f.x] === 'D'; },
    hayEnemigo: () => { const f = front(); return !!enemyAt(f.x, f.y); },
    hayTesoroAqui: () => treasures.some(t => !t.taken && t.x === st.x && t.y === st.y),
    estaEnSalida: () => !!exit && st.x === exit.x && st.y === exit.y,
    getVida: () => st.hp, getX: () => st.x, getY: () => st.y, getDireccion: () => DNAMES[st.dir]
  });
  return { state: st, globals: { heroe }, start: Object.assign({}, start, { dir: st.dir }), cfg };
};

/* ---------- normalización de salidas ---------- */
const norm = s => String(s).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
JV.norm = norm;
const clip = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;

JV.describeHarnessError = function (err) {
  return err;
};

/* Ejecuta todas las pruebas de un nivel.
   Devuelve { compile, tests:[{name, ok, msg, expected, got, out, events, hidden}], passed, total } */
JV.runLevel = function (level, code, opts) {
  opts = opts || {};
  const out = { compile: null, tests: [], passed: 0, total: 0, runError: null };
  const tests = level.tests;
  for (const test of tests) {
    const sim = test.explore ? JV.makeExplore(test.explore) : (test.sim ? JV.makeSim(test.sim) : null);
    let src = code, snippet = test.snippet || null;
    if (level.mode !== 'class' && test.vars) {
      // el prefijo va en la primera línea para no cambiar la numeración
      src = JV.declVars(test.vars) + ' ' + code;
    }
    const res = JV.run({
      code: src, snippet, support: level.support || null, globals: Object.assign({}, opts.extraGlobals || {}, sim ? sim.globals : (test.globals || {})), stdin: test.stdin || '',
      maxSteps: level.maxSteps || 1500000
    });
    const names = test.lines ? test.lines.map((_, i) => test.name ? `${test.name} (línea ${i + 1})` : `Línea ${i + 1}`) : [test.name];
    const baseInfo = { out: res.out, segs: res.segs, events: sim ? sim.state.events : null, explore: test.explore || null, hidden: !!test.hidden };
    if (res.error) {
      const e = res.error;
      if (e.type === 'compile') {
        const fromHarness = e.line >= 100000;
        if (!fromHarness || !test.expectCompileError) {
          out.compile = { msg: e.msg, line: fromHarness ? 0 : e.line, harness: fromHarness, partialOut: res.out };
          out.tests = []; out.passed = 0; out.total = 0;
          return out;
        }
      }
      if (!test.expectException || e.type !== 'exception' || e.cls !== test.expectException) {
        // excepción / timeout: la prueba falla con una explicación
        const txt = e.type === 'exception' ? `Tu programa lanzó ${e.fullName}${e.message ? ': ' + e.message : ''}${e.line && e.line < 100000 ? ' (línea ' + e.line + ')' : ''}`
          : e.type === 'timeout' ? e.msg : 'Error interno: ' + clip(e.msg, 200);
        const n = test.lines ? test.lines.length : 1;
        for (let i = 0; i < n; i++) { out.tests.push(Object.assign({ name: names[i], ok: false, msg: txt, error: e }, baseInfo)); out.total++; }
        if (!out.runError) out.runError = e;
        continue;
      }
    }
    // comprobaciones
    const push = (name, ok, msg, expected, got) => { out.tests.push(Object.assign({ name, ok, msg, expected, got }, baseInfo)); out.total++; if (ok) out.passed++; };
    if (test.expectException) { push(names[0], res.error && res.error.cls === test.expectException, `Se esperaba la excepción ${test.expectException}`); continue; }
    if (test.lines) {
      const got = norm(res.out).split('\n');
      test.lines.forEach((exp, i) => {
        const g = got[i] === undefined ? '(no hay salida)' : got[i];
        push(names[i], g === exp, null, exp, g);
      });
      if (got.length > test.lines.length && !test.allowExtra) {
        out.tests.push(Object.assign({ name: 'Sin salida de más', ok: false, msg: 'Tu programa imprime más líneas de las esperadas.' }, baseInfo)); out.total++;
      }
      continue;
    }
    if (test.expect !== undefined) {
      const e = norm(test.expect), g = norm(res.out);
      push(names[0], e === g, null, e, g);
      continue;
    }
    if (test.check) {
      let r;
      try { r = test.check({ code, out: norm(res.out), raw: res.out, res, interp: res.interp, sim: sim ? sim.state : null, vars: JV.varsOf(res.interp), types: JV.typesOf(res.interp) }); }
      catch (e) { r = 'Error al comprobar: ' + e.message; }
      if (test.soft) {   // prueba «blanda»: solo es una sugerencia, no se castiga si el programa funciona de otra manera
        if (r !== true) (out.notes = out.notes || []).push(typeof r === 'string' ? r : 'No cumple lo pedido.');
        push(names[0], true, null); continue;
      }
      push(names[0], r === true, r === true ? null : (typeof r === 'string' ? r : 'No cumple lo pedido.'));
      continue;
    }
    push(names[0], true, null);
  }
  return out;
};

/* variables del main de un script (como valores JS) */
JV.varsOf = function (I) {
  const o = {};
  if (I && I.mainEnv) for (const k of Object.keys(I.mainEnv.vars)) { const c = I.mainEnv.vars[k]; if (c.v !== JV.UNSET) o[k] = JV.js(c.v); }
  return o;
};

JV.typesOf = function (I) {
  const o = {};
  if (I && I.mainEnv) for (const k of Object.keys(I.mainEnv.vars)) { const c = I.mainEnv.vars[k]; o[k] = c.t ? c.t.n + '[]'.repeat(c.t.d) : 'var'; }
  return o;
};

/* Ejecución libre (botón "Probar"): sin pruebas ni consecuencias */
JV.runFree = function (level, code, stdin, extraGlobals) {
  const t = level.tests.find(t => !t.hidden) || level.tests[0] || {};
  const sim = t.explore ? JV.makeExplore(t.explore) : (t.sim ? JV.makeSim(t.sim) : null);
  let src = code;
  if (level.mode !== 'class' && t.vars) src = JV.declVars(t.vars) + ' ' + code;
  const res = JV.run({ code: src, support: level.support || null, globals: Object.assign({}, extraGlobals || {}, sim ? sim.globals : {}), stdin: stdin ? stdin : (t.stdin || ''), maxSteps: 1500000, snippet: level.mode === 'class' ? (level.free || t.snippet || null) : null });
  res.events = sim ? sim.state.events : null; res.explore = t.explore || null;
  return res;
};

if (typeof module !== 'undefined') module.exports = JV;
})(globalThis);
