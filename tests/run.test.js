// Valida que la respuesta de cada acertijo coincide con lo que imprime realmente el código (con el intérprete).
require('../js/parser.js'); require('../js/lib.js'); require('../js/interp.js'); require('../js/runner.js');
global.window = undefined; require('../js/run.js');
const R = globalThis.GAME.RUN; let bad = 0, n = 0;
const all = R.riddles.concat(...Object.values(R.chestRiddles));
for (const r of all) {
  if (!r.code) { continue; } n++;
  const res = JV.run({ code: r.code });
  const got = r.thrown ? (res.error && res.error.cls) : res.ok ? res.out.trim() : 'ERROR ' + (res.error && res.error.msg);
  if (got !== r.a) { bad++; console.log('✘', JSON.stringify(r.code), 'esperado', r.a, 'obtenido', got); }
}
console.log(`acertijos con código: ${n}, con problemas: ${bad}; total acertijos: ${R.riddles.length}`); process.exit(bad ? 1 : 0);
