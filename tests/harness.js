require('../js/parser.js'); require('../js/lib.js'); require('../js/interp.js');
const JV = globalThis.JV;
let pass = 0, fail = 0;
function t(name, code, expectOut, opts) {
  const r = JV.run(Object.assign({ code }, opts || {}));
  const got = r.ok ? r.out : (r.error.type + ': ' + r.error.msg + ' @' + r.error.line + (r.out ? '\n--out--\n' + r.out : ''));
  if (got === expectOut) pass++; else { fail++; console.log('FAIL ' + name + '\n  expected: ' + JSON.stringify(expectOut) + '\n  got:      ' + JSON.stringify(got)); }
}
module.exports = { t, done: () => { console.log(`pass=${pass} fail=${fail}`); process.exit(fail ? 1 : 0); } };
