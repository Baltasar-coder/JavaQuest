require('../js/parser.js'); require('../js/lib.js'); require('../js/interp.js');
const n = parseInt(process.argv[2]);
const r = JV.run({ code: `static int s(int n){ return n==0?0:n+s(n-1);} System.out.println(s(${n}));`});
console.log(n, r.ok ? r.out.trim() : r.error.msg);
