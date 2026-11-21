// Valida todos los niveles y retos de libros: la solución debe pasar todas las pruebas y el código inicial no.
require('../js/parser.js'); require('../js/lib.js'); require('../js/interp.js'); require('../js/runner.js');
global.window = undefined;
const SIL = { extraGlobals: { heroe: JV.native('Heroe', { atacar() {}, defender() {}, curar() {}, ayuda() {}, getEnemigos() { return 0; } }) } };   // «heroe» dentro de los programas del jugador
const fs = require('fs'), path = require('path');
for (const f of ['world1', 'world2', 'world3', 'world4', 'world5', 'explore', 'skills', 'fichas', 'fichas2', 'ejemplos']) require('../js/' + f + '.js');
const G = globalThis.GAME; let bad = 0, total = 0;
const inMap = new Set(); G.worlds.forEach(w => w.nodes.flat().forEach(id => inMap.add(id)));
function check(id, lv, label) {
  total++;
  const r = JV.runLevel(lv, lv.solution, SIL);
  if (r.compile) { bad++; console.log('✘', id, 'COMPILE', r.compile.msg, 'línea', r.compile.line); return; }
  const fails = r.tests.filter(t => !t.ok);
  const st = JV.runLevel(lv, lv.starter, SIL);
  const starterPasses = !st.compile && st.total > 0 && st.passed === st.total;
  if (fails.length || starterPasses) {
    bad++; console.log('✘', id, lv.title);
    fails.slice(0, 3).forEach(t => console.log('    ', t.name, '|', t.msg || '', '| esperado:', JSON.stringify(t.expected), 'obtenido:', JSON.stringify(t.got)));
    if (starterPasses) console.log('     (¡el código inicial ya pasa todas las pruebas!)');
  } else console.log('✔', label, id, lv.title, `(${r.passed}/${r.total})`);
}
for (const w of G.worlds) for (const node of w.nodes) for (const id of [].concat(node)) {
  const lv = G.levels[id]; if (!lv) { console.log('FALTA', id); bad++; total++; continue; }
  check(id, lv, 'nivel');
}
for (const id of Object.keys(G.levels)) if (!inMap.has(id)) check(id, G.levels[id], 'libro');
// cada libro con reto debe tener su nivel, y cada botín debe apuntar a un libro existente
for (const [bid, b] of Object.entries(G.BOOKS)) if (b.challenge && !G.levels[b.challenge]) { bad++; console.log('✘ libro sin reto', bid); }
for (const [lid, bid] of Object.entries(G.DROPS)) if (!G.BOOKS[bid] || !G.levels[lid]) { bad++; console.log('✘ botín incorrecto', lid, bid); }
for (const t of Object.values(G.SKILLS.unlock)) if (!G.BOOKS[t] || !G.BOOKS[t].skill) { bad++; console.log('✘ habilidad sin libro', t); }
console.log(`\nniveles y retos: ${total}, con problemas: ${bad}`); process.exit(bad ? 1 : 0);
