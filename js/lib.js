/* Valores en tiempo de ejecución + librería estándar de Java (subconjunto) */
(function (G) {
'use strict';
const JV = G.JV = G.JV || {};
const CompileError = JV.CompileError;

let OBJ_ID = 0;
class Dbl { constructor(v) { this.v = v; } }
class Chr { constructor(c) { this.c = c; } }
class JObject { constructor(cls) { this.cls = cls; this.f = Object.create(null); this.id = ++OBJ_ID; } }
class JArray { constructor(et, a) { this.et = et; this.a = a; this.id = ++OBJ_ID; } }
class JLambda { constructor(params, body, env) { this.params = params; this.body = body; this.env = env; this.id = ++OBJ_ID; } }
class JMRef { constructor(target, isClass, name) { this.target = target; this.isClass = isClass; this.name = name; this.id = ++OBJ_ID; } }
class JavaThrow { constructor(obj) { this.obj = obj; } }
class Timeout extends Error { constructor(msg) { super(msg || 'timeout'); } }
class ExitSignal extends Error { constructor(code) { super('exit'); this.code = code; } }
const UNSET = { unset: true };
Object.assign(JV, { Dbl, Chr, JObject, JArray, JLambda, JMRef, JavaThrow, Timeout, ExitSignal, UNSET });
JV.newId = () => ++OBJ_ID;

/* ---------- utilidades numéricas / texto ---------- */
function dblStr(v) {
  if (Number.isNaN(v)) return 'NaN';
  if (!Number.isFinite(v)) return v > 0 ? 'Infinity' : '-Infinity';
  if (v === 0) return Object.is(v, -0) ? '-0.0' : '0.0';
  const a = Math.abs(v);
  if (a >= 1e-3 && a < 1e7) { let s = String(v); if (!s.includes('.')) s += '.0'; return s; }
  let [m, ex] = v.toExponential().split('e');
  if (!m.includes('.')) m += '.0';
  return m + 'E' + ex.replace('+', '');
}
function incDigits(s) {
  const a = s.split(''); let i = a.length - 1;
  while (i >= 0) { if (a[i] === '9') { a[i] = '0'; i--; } else { a[i] = String.fromCharCode(a[i].charCodeAt(0) + 1); break; } }
  if (i < 0) a.unshift('1');
  return a.join('');
}
function fmtFixed(v, prec) {
  if (!Number.isFinite(v)) return Number.isNaN(v) ? 'NaN' : (v > 0 ? 'Infinity' : '-Infinity');
  const neg = v < 0 || Object.is(v, -0); const a = Math.abs(v);
  let s = String(a);
  if (/e/i.test(s)) s = a >= 1 ? BigInt(Math.round(a)).toString() : a.toFixed(25).replace(/0+$/, '');
  let [ip, fp = ''] = s.split('.');
  if (fp.length <= prec) fp = fp.padEnd(prec, '0');
  else {
    const up = fp.charCodeAt(prec) >= 53;
    let digits = ip + fp.slice(0, prec);
    if (up) digits = incDigits(digits);
    ip = digits.slice(0, digits.length - prec) || '0'; fp = prec ? digits.slice(digits.length - prec) : '';
  }
  return (neg ? '-' : '') + ip + (prec ? '.' + fp : '');
}
function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function hashString(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h; }
const _f64 = new Float64Array(1), _i32 = new Int32Array(_f64.buffer);
function hashDouble(d) { _f64[0] = d; return (_i32[0] ^ _i32[1]) | 0; }
function boxName(v) {
  if (typeof v === 'number') return 'java.lang.Integer'; if (v instanceof Dbl) return 'java.lang.Double';
  if (typeof v === 'bigint') return 'java.lang.Long'; if (typeof v === 'string') return 'java.lang.String';
  if (v instanceof Chr) return 'java.lang.Character'; if (typeof v === 'boolean') return 'java.lang.Boolean'; return 'java.lang.Object';
}
function typeName(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return 'int'; if (v instanceof Dbl) return 'double'; if (typeof v === 'bigint') return 'long';
  if (v instanceof Chr) return 'char'; if (typeof v === 'boolean') return 'boolean'; if (typeof v === 'string') return 'String';
  if (v instanceof JObject) return v.cls.name;
  if (v instanceof JArray) return v.et.n + '[]'.repeat(v.et.d + 1);
  if (v instanceof JLambda) return 'lambda';
  return v.jn || 'Object';
}
JV.typeName = typeName; JV.dblStr = dblStr; JV.hashString = hashString; JV.hashDouble = hashDouble; JV.fmtFixed = fmtFixed;

function toN(v) { return typeof v === 'number' ? v : v instanceof Chr ? v.c : v instanceof Dbl ? v.v : Number(v); }
JV.toN = toN;

function javaFormat(I, fmt, args) {
  let ai = 0, out = '', last = 0, m;
  const re = /%(\d+\$)?([-#+ 0,(]*)(\d+)?(\.\d+)?([a-zA-Z%])/g;
  while ((m = re.exec(fmt))) {
    out += fmt.slice(last, m.index); last = re.lastIndex;
    const flags = m[2] || '', width = m[3] ? parseInt(m[3]) : 0, prec = m[4] ? parseInt(m[4].slice(1)) : -1, conv = m[5];
    if (conv === 'n') { out += '\n'; continue; }
    if (conv === '%') { out += '%'; continue; }
    let arg;
    if (m[1]) arg = args[parseInt(m[1]) - 1];
    else { if (ai >= args.length) I.throwJ('MissingFormatArgumentException', "Format specifier '" + m[0] + "'"); arg = args[ai++]; }
    let s, numeric = false;
    switch (conv.toLowerCase()) {
      case 'd': {
        if (arg === null) { s = 'null'; break; }
        if (typeof arg !== 'number' && typeof arg !== 'bigint') I.throwJ('IllegalFormatConversionException', conv + ' != ' + boxName(arg));
        const neg = arg < 0; let ds = String(neg ? -arg : arg); if (flags.includes(',')) ds = group(ds);
        s = (neg ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + ds; numeric = true; break;
      }
      case 'f': case 'e': {
        if (arg === null) { s = 'null'; break; }
        if (!(arg instanceof Dbl)) I.throwJ('IllegalFormatConversionException', conv + ' != ' + boxName(arg));
        const p = prec < 0 ? 6 : prec;
        if (conv.toLowerCase() === 'f') {
          let fs = fmtFixed(arg.v, p); const neg = fs[0] === '-'; if (neg) fs = fs.slice(1);
          if (flags.includes(',')) { const [i1, f1] = fs.split('.'); fs = group(i1) + (f1 !== undefined ? '.' + f1 : ''); }
          s = (neg ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + fs;
        } else {
          s = arg.v.toExponential(p).replace(/e([+-])(\d)$/, 'e$10$2');
          if (conv === 'E') s = s.toUpperCase();
        }
        numeric = true; break;
      }
      case 's': s = I.str(arg); if (prec >= 0) s = s.slice(0, prec); if (conv === 'S') s = s.toUpperCase(); break;
      case 'c': s = arg === null ? 'null' : arg instanceof Chr ? String.fromCharCode(arg.c) : typeof arg === 'number' ? String.fromCharCode(arg) :
        I.throwJ('IllegalFormatConversionException', 'c != ' + boxName(arg)); break;
      case 'b': s = String(arg !== null && arg !== false); break;
      case 'x': s = typeof arg === 'bigint' ? BigInt.asUintN(64, arg).toString(16) : (arg >>> 0).toString(16); if (conv === 'X') s = s.toUpperCase(); numeric = true; break;
      case 'o': s = (arg >>> 0).toString(8); numeric = true; break;
      default: I.throwJ('UnknownFormatConversionException', "Conversion = '" + conv + "'");
    }
    if (s.length < width) {
      if (flags.includes('-')) s = s.padEnd(width, ' ');
      else if (flags.includes('0') && numeric) { const sg = /^[+\- ]/.test(s) ? s[0] : ''; s = sg + s.slice(sg.length).padStart(width - sg.length, '0'); }
      else s = s.padStart(width, ' ');
    }
    out += s;
  }
  return out + fmt.slice(last);
}
JV.javaFormat = javaFormat;

const nf = (jn, name) => new CompileError(`cannot find symbol\n  symbol:   method ${name}()\n  location: class ${jn}`);

/* ---------- colecciones ---------- */
const LIST_TYPES = {
  ArrayList: ['ArrayList', 'List', 'Collection', 'Iterable', 'AbstractList', 'RandomAccess', 'Object'],
  LinkedList: ['LinkedList', 'List', 'Deque', 'Queue', 'Collection', 'Iterable', 'Object'],
  Stack: ['Stack', 'Vector', 'List', 'Collection', 'Iterable', 'Object'],
  ArrayDeque: ['ArrayDeque', 'Deque', 'Queue', 'Collection', 'Iterable', 'Object'],
  Vector: ['Vector', 'List', 'Collection', 'Iterable', 'Object'],
  ImmutableList: ['List', 'Collection', 'Iterable', 'Object']
};
class JList {
  constructor(kind, a) {
    this.jn = kind; this.a = a || []; this.mod = 0; this.imm = false; this.fixed = false; this.id = ++OBJ_ID;
    this.types = LIST_TYPES[kind] || LIST_TYPES.ArrayList; this.stack = kind === 'Stack';
  }
  chk(I, i, len) { if (typeof i !== 'number' || i < 0 || i >= len) I.throwJ('IndexOutOfBoundsException', `Index ${i} out of bounds for length ${len}`); }
  toJavaString(I) { return '[' + this.a.map(x => x === this ? '(this Collection)' : I.str(x)).join(', ') + ']'; }
  invoke(name, args, I) {
    const a = this.a;
    const mut = () => { if (this.imm || (this.fixed && ['add', 'remove', 'clear', 'addAll'].includes(name))) I.throwJ('UnsupportedOperationException', null); };
    const empty = () => I.throwJ(this.stack ? 'EmptyStackException' : 'NoSuchElementException', null);
    switch (name) {
      case 'add': case 'addLast': case 'offer': case 'offerLast':
        mut();
        if (args.length === 2) { if (typeof args[0] !== 'number' || args[0] < 0 || args[0] > a.length) I.throwJ('IndexOutOfBoundsException', `Index: ${args[0]}, Size: ${a.length}`); a.splice(args[0], 0, args[1]); this.mod++; return undefined; }
        a.push(args[0]); this.mod++; return name === 'addLast' ? undefined : true;
      case 'addFirst': case 'offerFirst': mut(); a.unshift(args[0]); this.mod++; return name === 'addFirst' ? undefined : true;
      case 'push': mut(); if (this.stack) { a.push(args[0]); } else a.unshift(args[0]); this.mod++; return args[0];
      case 'pop': if (!a.length) empty(); this.mod++; return this.stack ? a.pop() : a.shift();
      case 'peek': if (this.stack) { if (!a.length) empty(); return a[a.length - 1]; } return a.length ? a[0] : null;
      case 'peekFirst': return a.length ? a[0] : null;
      case 'peekLast': return a.length ? a[a.length - 1] : null;
      case 'poll': case 'pollFirst': if (!a.length) return null; this.mod++; return a.shift();
      case 'pollLast': if (!a.length) return null; this.mod++; return a.pop();
      case 'getFirst': case 'element': case 'firstElement': if (!a.length) empty(); return a[0];
      case 'getLast': case 'lastElement': if (!a.length) empty(); return a[a.length - 1];
      case 'removeFirst': if (!a.length) empty(); this.mod++; return a.shift();
      case 'removeLast': if (!a.length) empty(); this.mod++; return a.pop();
      case 'empty': return a.length === 0;
      case 'search': { const i = a.map(x => x).reverse().findIndex(x => I.jequals(x, args[0])); return i < 0 ? -1 : i + 1; }
      case 'get': case 'elementAt': this.chk(I, args[0], a.length); return a[args[0]];
      case 'set': if (this.imm) mut(); this.chk(I, args[0], a.length); { const o = a[args[0]]; a[args[0]] = args[1]; return o; }
      case 'remove':
        mut();
        if (args.length === 0) { if (!a.length) empty(); this.mod++; return a.shift(); }
        if (typeof args[0] === 'number' && this.jn !== 'ArrayDeque') { this.chk(I, args[0], a.length); this.mod++; return a.splice(args[0], 1)[0]; }
      // eslint-disable-next-line no-fallthrough
      case 'removeObj': { mut(); const i = a.findIndex(x => I.jequals(x, args[0])); if (i < 0) return false; a.splice(i, 1); this.mod++; return true; }
      case 'size': return a.length;
      case 'isEmpty': return a.length === 0;
      case 'contains': return a.some(x => I.jequals(x, args[0]));
      case 'indexOf': return a.findIndex(x => I.jequals(x, args[0]));
      case 'lastIndexOf': { for (let i = a.length - 1; i >= 0; i--) if (I.jequals(a[i], args[0])) return i; return -1; }
      case 'clear': mut(); a.length = 0; this.mod++; return undefined;
      case 'addAll': {
        mut(); const src = I.toArray(args[args.length - 1]);
        if (args.length === 2) a.splice(args[0], 0, ...src); else a.push(...src);
        this.mod++; return src.length > 0;
      }
      case 'removeAll': { mut(); const o = I.toArray(args[0]); const n = a.length; this.a = a.filter(x => !o.some(y => I.jequals(x, y))); this.mod++; return this.a.length !== n; }
      case 'retainAll': { mut(); const o = I.toArray(args[0]); const n = a.length; this.a = a.filter(x => o.some(y => I.jequals(x, y))); this.mod++; return this.a.length !== n; }
      case 'containsAll': return I.toArray(args[0]).every(y => a.some(x => I.jequals(x, y)));
      case 'forEach': for (const x of a.slice()) I.callFn(args[0], [x], 'accept'); return undefined;
      case 'sort': if (this.imm) mut(); a.sort(I.cmpFn(args[0])); this.mod++; return undefined;
      case 'removeIf': { mut(); const n = a.length; this.a = a.filter(x => !I.callFn(args[0], [x], 'test')); this.mod++; return this.a.length !== n; }
      case 'replaceAll': for (let i = 0; i < a.length; i++) a[i] = I.callFn(args[0], [a[i]], 'apply'); return undefined;
      case 'iterator': case 'listIterator': return new JIter(this, this.a.slice());
      case 'descendingIterator': return new JIter(this, this.a.slice().reverse());
      case 'subList': { if (args[0] < 0 || args[1] > a.length || args[0] > args[1]) I.throwJ('IndexOutOfBoundsException', `fromIndex: ${args[0]}, toIndex: ${args[1]}, size: ${a.length}`); return new JList('ArrayList', a.slice(args[0], args[1])); }
      case 'toArray': return new JArray({ n: 'Object', d: 0 }, a.slice());
      case 'stream': return JV.makeStream(a.slice());
      case 'reversed': return new JList('ArrayList', a.slice().reverse());
      case 'equals': return I.jequals(this, args[0]);
      case 'hashCode': return I.jhash(this);
      case 'toString': return this.toJavaString(I);
      case 'getClass': return new JClassRef(this.jn);
      case 'ensureCapacity': case 'trimToSize': return undefined;
      default: throw nf(this.jn, name);
    }
  }
}
class JIter {
  constructor(list, snap) { this.jn = 'Iterator'; this.list = list; this.snap = snap; this.i = 0; this.last = null; this.types = ['Iterator', 'ListIterator', 'Object']; }
  invoke(name, args, I) {
    switch (name) {
      case 'hasNext': return this.i < this.snap.length;
      case 'next': if (this.i >= this.snap.length) I.throwJ('NoSuchElementException', null); this.last = { v: this.snap[this.i++] }; return this.last.v;
      case 'remove': {
        if (!this.last) I.throwJ('IllegalStateException', null);
        if (this.list instanceof JList) { const k = this.list.a.findIndex(x => x === this.last.v); if (k >= 0) { this.list.a.splice(k, 1); } }
        else if (this.list.removeKey) this.list.removeKey(I, this.last.v);
        this.last = null; return undefined;
      }
      default: throw nf('Iterator', name);
    }
  }
}
class JEntry {
  constructor(e) { this.e = e; this.jn = 'Entry'; this.types = ['Entry', 'Object']; }
  toJavaString(I) { return I.str(this.e.k) + '=' + I.str(this.e.v); }
  invoke(name, args, I) {
    switch (name) {
      case 'getKey': return this.e.k; case 'getValue': return this.e.v;
      case 'setValue': { const o = this.e.v; this.e.v = args[0]; return o; }
      case 'toString': return this.toJavaString(I);
      case 'equals': return args[0] instanceof JEntry && I.jequals(this.e.k, args[0].e.k) && I.jequals(this.e.v, args[0].e.v);
      case 'hashCode': return I.jhash(this.e.k) ^ I.jhash(this.e.v);
      default: throw nf('Entry', name);
    }
  }
}
class JMap {
  constructor(kind, cmp) {
    this.jn = kind; this.kind = kind; this.m = new Map(); this.n = 0; this.seq = 0; this.cap = 16; this.cmp = cmp || null; this.mod = 0; this.id = ++OBJ_ID; this.imm = false;
    this.types = [kind, 'Map', 'AbstractMap', 'Object'];
  }
  find(I, k) { const b = this.m.get(I.keyId(k)); if (!b) return null; for (const e of b) if (I.jequals(e.k, k)) return e; return null; }
  put(I, k, v) {
    if (this.imm) I.throwJ('UnsupportedOperationException', null);
    if (this.kind === 'TreeMap' && k === null) I.throwJ('NullPointerException', null);
    const e = this.find(I, k);
    if (e) { const o = e.v; e.v = v; return o; }
    const id = I.keyId(k); let b = this.m.get(id); if (!b) { b = []; this.m.set(id, b); }
    b.push({ k, v, seq: this.seq++ }); this.n++; this.mod++;
    while (this.n > this.cap * 0.75) this.cap *= 2;
    return null;
  }
  removeKey(I, k) {
    if (this.imm) I.throwJ('UnsupportedOperationException', null);
    const id = I.keyId(k); const b = this.m.get(id); if (!b) return null;
    for (let i = 0; i < b.length; i++) if (I.jequals(b[i].k, k)) {
      const e = b.splice(i, 1)[0]; if (!b.length) this.m.delete(id); this.n--; this.mod++; return e;
    }
    return null;
  }
  entries(I) {
    const all = []; for (const b of this.m.values()) for (const e of b) all.push(e);
    if (this.kind === 'LinkedHashMap' || this.kind === 'LinkedHashSet') all.sort((x, y) => x.seq - y.seq);
    else if (this.kind === 'TreeMap') { const c = I.cmpFn(this.cmp); all.sort((x, y) => c(x.k, y.k)); }
    else {
      const mask = this.cap - 1;
      const idx = e => { const h = I.jhash(e.k); return ((h ^ (h >>> 16)) & mask) >>> 0; };
      all.forEach(e => { e.__i = idx(e); });
      all.sort((x, y) => x.__i - y.__i || x.seq - y.seq);
    }
    return all;
  }
  toJavaString(I) { return '{' + this.entries(I).map(e => I.str(e.k) + '=' + I.str(e.v)).join(', ') + '}'; }
  invoke(name, args, I) {
    const sortedKeys = () => this.entries(I);
    switch (name) {
      case 'put': return this.put(I, args[0], args[1]);
      case 'get': { const e = this.find(I, args[0]); return e ? e.v : null; }
      case 'getOrDefault': { const e = this.find(I, args[0]); return e ? e.v : args[1]; }
      case 'containsKey': return !!this.find(I, args[0]);
      case 'containsValue': return this.entries(I).some(e => I.jequals(e.v, args[0]));
      case 'remove': { const e = this.removeKey(I, args[0]); return e ? e.v : null; }
      case 'size': return this.n;
      case 'isEmpty': return this.n === 0;
      case 'clear': this.m.clear(); this.n = 0; this.mod++; return undefined;
      case 'putIfAbsent': { const e = this.find(I, args[0]); if (e && e.v !== null) return e.v; this.put(I, args[0], args[1]); return null; }
      case 'putAll': for (const e of args[0].entries(I)) this.put(I, e.k, e.v); return undefined;
      case 'merge': { const e = this.find(I, args[0]); if (!e || e.v === null) { this.put(I, args[0], args[1]); return args[1]; } const nv = I.callFn(args[2], [e.v, args[1]], 'apply'); if (nv === null) this.removeKey(I, args[0]); else e.v = nv; return nv; }
      case 'computeIfAbsent': { const e = this.find(I, args[0]); if (e && e.v !== null) return e.v; const v = I.callFn(args[1], [args[0]], 'apply'); if (v !== null) this.put(I, args[0], v); return v; }
      case 'computeIfPresent': { const e = this.find(I, args[0]); if (!e) return null; const v = I.callFn(args[1], [args[0], e.v], 'apply'); if (v === null) this.removeKey(I, args[0]); else e.v = v; return v; }
      case 'compute': { const e = this.find(I, args[0]); const v = I.callFn(args[1], [args[0], e ? e.v : null], 'apply'); if (v === null) this.removeKey(I, args[0]); else this.put(I, args[0], v); return v; }
      case 'keySet': case 'navigableKeySet': { const s = new JSet('LinkedHashSet'); sortedKeys().forEach(e => s.map.put(I, e.k, true)); return s; }
      case 'values': return new JList('ArrayList', sortedKeys().map(e => e.v));
      case 'entrySet': { const s = new JList('ArrayList', sortedKeys().map(e => new JEntry(e))); s.jn = 'EntrySet'; return s; }
      case 'forEach': for (const e of sortedKeys()) I.callFn(args[0], [e.k, e.v], 'accept'); return undefined;
      case 'replaceAll': for (const e of sortedKeys()) e.v = I.callFn(args[0], [e.k, e.v], 'apply'); return undefined;
      case 'firstKey': { const s = sortedKeys(); if (!s.length) I.throwJ('NoSuchElementException', null); return s[0].k; }
      case 'lastKey': { const s = sortedKeys(); if (!s.length) I.throwJ('NoSuchElementException', null); return s[s.length - 1].k; }
      case 'firstEntry': { const s = sortedKeys(); return s.length ? new JEntry(s[0]) : null; }
      case 'lastEntry': { const s = sortedKeys(); return s.length ? new JEntry(s[s.length - 1]) : null; }
      case 'equals': return I.jequals(this, args[0]);
      case 'hashCode': return I.jhash(this);
      case 'toString': return this.toJavaString(I);
      default: throw nf(this.jn, name);
    }
  }
}
class JSet {
  constructor(kind, cmp) {
    this.jn = kind; this.id = ++OBJ_ID;
    this.map = new JMap(kind === 'HashSet' ? 'HashMap' : kind === 'TreeSet' ? 'TreeMap' : 'LinkedHashMap', cmp);
    this.types = [kind, 'Set', 'Collection', 'Iterable', 'AbstractSet', 'Object'];
  }
  get mod() { return this.map.mod; }
  items(I) { return this.map.entries(I).map(e => e.k); }
  removeKey(I, k) { return this.map.removeKey(I, k); }
  toJavaString(I) { return '[' + this.items(I).map(x => I.str(x)).join(', ') + ']'; }
  invoke(name, args, I) {
    const m = this.map;
    switch (name) {
      case 'add': if (m.find(I, args[0])) return false; m.put(I, args[0], true); return true;
      case 'contains': return !!m.find(I, args[0]);
      case 'remove': return !!m.removeKey(I, args[0]);
      case 'size': return m.n;
      case 'isEmpty': return m.n === 0;
      case 'clear': m.m.clear(); m.n = 0; m.mod++; return undefined;
      case 'addAll': { let ch = false; for (const x of I.toArray(args[0])) if (!m.find(I, x)) { m.put(I, x, true); ch = true; } return ch; }
      case 'removeAll': { let ch = false; for (const x of I.toArray(args[0])) if (m.removeKey(I, x)) ch = true; return ch; }
      case 'retainAll': { const o = I.toArray(args[0]); let ch = false; for (const x of this.items(I)) if (!o.some(y => I.jequals(x, y))) { m.removeKey(I, x); ch = true; } return ch; }
      case 'containsAll': return I.toArray(args[0]).every(x => !!m.find(I, x));
      case 'forEach': for (const x of this.items(I)) I.callFn(args[0], [x], 'accept'); return undefined;
      case 'removeIf': { let ch = false; for (const x of this.items(I)) if (I.callFn(args[0], [x], 'test')) { m.removeKey(I, x); ch = true; } return ch; }
      case 'iterator': return new JIter(this, this.items(I));
      case 'first': { const s = this.items(I); if (!s.length) I.throwJ('NoSuchElementException', null); return s[0]; }
      case 'last': { const s = this.items(I); if (!s.length) I.throwJ('NoSuchElementException', null); return s[s.length - 1]; }
      case 'stream': return JV.makeStream(this.items(I));
      case 'toArray': return new JArray({ n: 'Object', d: 0 }, this.items(I));
      case 'equals': return I.jequals(this, args[0]);
      case 'hashCode': return I.jhash(this);
      case 'toString': return this.toJavaString(I);
      default: throw nf(this.jn, name);
    }
  }
}
// cola con prioridad (montículo binario como el de Java, para que el orden de impresión coincida)
class JPQ {
  constructor(cmp) { this.jn = 'PriorityQueue'; this.a = []; this.cmp = cmp || null; this.id = ++OBJ_ID; this.types = ['PriorityQueue', 'Queue', 'Collection', 'Iterable', 'Object']; }
  get mod() { return 0; }
  up(c, k) { const a = this.a, x = a[k]; while (k > 0) { const p = (k - 1) >>> 1; if (c(x, a[p]) >= 0) break; a[k] = a[p]; k = p; } a[k] = x; }
  down(c, k) {
    const a = this.a, n = a.length, x = a[k], half = n >>> 1;
    while (k < half) { let ch = 2 * k + 1; const r = ch + 1; if (r < n && c(a[ch], a[r]) > 0) ch = r; if (c(x, a[ch]) <= 0) break; a[k] = a[ch]; k = ch; }
    a[k] = x;
  }
  toJavaString(I) { return '[' + this.a.map(x => I.str(x)).join(', ') + ']'; }
  invoke(name, args, I) {
    const c = I.cmpFn(this.cmp), a = this.a;
    switch (name) {
      case 'add': case 'offer': a.push(args[0]); this.up(c, a.length - 1); return true;
      case 'poll': case 'remove': {
        if (name === 'remove' && args.length) { const i = a.findIndex(x => I.jequals(x, args[0])); if (i < 0) return false; a.splice(i, 1); const b = a.slice(); a.length = 0; b.forEach(x => { a.push(x); this.up(c, a.length - 1); }); return true; }
        if (!a.length) { if (name === 'remove') I.throwJ('NoSuchElementException', null); return null; }
        const r = a[0], l = a.pop(); if (a.length) { a[0] = l; this.down(c, 0); } return r;
      }
      case 'peek': case 'element': if (!a.length) { if (name === 'element') I.throwJ('NoSuchElementException', null); return null; } return a[0];
      case 'size': return a.length; case 'isEmpty': return a.length === 0; case 'clear': a.length = 0; return undefined;
      case 'contains': return a.some(x => I.jequals(x, args[0]));
      case 'addAll': for (const x of I.toArray(args[0])) { a.push(x); this.up(c, a.length - 1); } return true;
      case 'iterator': return new JIter(this, a.slice());
      case 'toString': return this.toJavaString(I);
      default: throw nf('PriorityQueue', name);
    }
  }
}
class JSB {
  constructor(s) { this.jn = 'StringBuilder'; this.s = s || ''; this.id = ++OBJ_ID; this.types = ['StringBuilder', 'StringBuffer', 'CharSequence', 'Object']; }
  toJavaString() { return this.s; }
  invoke(name, args, I) {
    const idx = (i, max) => { if (typeof i !== 'number' || i < 0 || i > max) I.throwJ('StringIndexOutOfBoundsException', `index ${i},length ${this.s.length}`); };
    switch (name) {
      case 'append': this.s += I.str(args[0]); return this;
      case 'toString': return this.s;
      case 'length': return this.s.length;
      case 'isEmpty': return this.s.length === 0;
      case 'charAt': if (args[0] < 0 || args[0] >= this.s.length) I.throwJ('StringIndexOutOfBoundsException', `index ${args[0]},length ${this.s.length}`); return new Chr(this.s.charCodeAt(args[0]));
      case 'reverse': this.s = [...this.s].reverse().join(''); return this;
      case 'insert': idx(args[0], this.s.length); this.s = this.s.slice(0, args[0]) + I.str(args[1]) + this.s.slice(args[0]); return this;
      case 'deleteCharAt': idx(args[0], this.s.length - 1); this.s = this.s.slice(0, args[0]) + this.s.slice(args[0] + 1); return this;
      case 'delete': { const e = Math.min(args[1], this.s.length); idx(args[0], e); this.s = this.s.slice(0, args[0]) + this.s.slice(e); return this; }
      case 'replace': { const e = Math.min(args[1], this.s.length); idx(args[0], e); this.s = this.s.slice(0, args[0]) + args[2] + this.s.slice(e); return this; }
      case 'setCharAt': idx(args[0], this.s.length - 1); this.s = this.s.slice(0, args[0]) + String.fromCharCode(args[1].c) + this.s.slice(args[0] + 1); return undefined;
      case 'setLength': this.s = args[0] <= this.s.length ? this.s.slice(0, args[0]) : this.s.padEnd(args[0], '\0'); return undefined;
      case 'indexOf': return this.s.indexOf(args[0]); case 'lastIndexOf': return this.s.lastIndexOf(args[0]);
      case 'substring': return this.s.substring(args[0], args.length > 1 ? args[1] : undefined);
      case 'capacity': return Math.max(16, this.s.length);
      case 'equals': return this === args[0];
      case 'hashCode': return this.id;
      case 'compareTo': return JV.cmpStr(this.s, args[0].s);
      default: throw nf('StringBuilder', name);
    }
  }
}
class JRandom {
  constructor(seed) {
    this.jn = 'Random'; this.types = ['Random', 'Object']; this.id = ++OBJ_ID;
    if (seed === undefined) seed = BigInt(Math.floor(Math.random() * 2 ** 48));
    this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);
  }
  next(bits) {
    this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n);
    return Number(BigInt.asIntN(32, this.seed >> BigInt(48 - bits)));
  }
  nextInt(I, bound) {
    if (bound === undefined) return this.next(32);
    if (bound <= 0) I.throwJ('IllegalArgumentException', 'bound must be positive');
    let r = this.next(31); const m = bound - 1;
    if ((bound & m) === 0) return Number((BigInt(bound) * BigInt(r)) >> 31n);
    for (let u = r; u - (r = u % bound) + m > 2147483647; u = this.next(31));
    return r;
  }
  nextDouble() { return (this.next(26) * 134217728 + this.next(27)) / 9007199254740992; }
  invoke(name, args, I) {
    switch (name) {
      case 'nextInt': if (args.length === 2) { if (args[0] >= args[1]) I.throwJ('IllegalArgumentException', 'bound must be greater than origin'); return args[0] + this.nextInt(I, args[1] - args[0]); } return this.nextInt(I, args[0]);
      case 'nextDouble': return new Dbl(this.nextDouble());
      case 'nextBoolean': return this.next(1) !== 0;
      case 'nextLong': return (BigInt(this.next(32)) << 32n) + BigInt(this.next(32));
      case 'setSeed': this.seed = (BigInt(args[0]) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n); return undefined;
      default: throw nf('Random', name);
    }
  }
}
class JScanner {
  constructor(I) { this.jn = 'Scanner'; this.types = ['Scanner', 'Object']; this.I = I; }
  get buf() { return this.I.stdin; }
  skipWs() { this.I.stdin = this.I.stdin.replace(/^\s+/, ''); }
  token(peek) { this.skipWs(); const m = /^\S+/.exec(this.I.stdin); if (!m) return null; if (!peek) this.I.stdin = this.I.stdin.slice(m[0].length); return m[0]; }
  invoke(name, args, I) {
    switch (name) {
      case 'nextLine': { if (!I.stdin.length) I.throwJ('NoSuchElementException', 'No line found'); const i = I.stdin.indexOf('\n'); const l = i < 0 ? I.stdin : I.stdin.slice(0, i); I.stdin = i < 0 ? '' : I.stdin.slice(i + 1); return l.replace(/\r$/, ''); }
      case 'next': { const t = this.token(); if (t === null) I.throwJ('NoSuchElementException', null); return t; }
      case 'nextInt': { const t = this.token(true); if (t === null) I.throwJ('NoSuchElementException', null); if (!/^[+-]?\d+$/.test(t)) I.throwJ('InputMismatchException', 'For input string: "' + t + '"'); this.token(); return parseInt(t, 10) | 0; }
      case 'nextDouble': { const t = this.token(true); if (t === null) I.throwJ('NoSuchElementException', null); if (isNaN(Number(t))) I.throwJ('InputMismatchException', 'For input string: "' + t + '"'); this.token(); return new Dbl(Number(t)); }
      case 'nextBoolean': { const t = this.token(true); if (t === null) I.throwJ('NoSuchElementException', null); if (!/^(true|false)$/i.test(t)) I.throwJ('InputMismatchException', 'For input string: "' + t + '"'); this.token(); return t.toLowerCase() === 'true'; }
      case 'nextLong': { const t = this.token(true); if (t === null) I.throwJ('NoSuchElementException', null); if (!/^[+-]?\d+$/.test(t)) I.throwJ('InputMismatchException', 'For input string: "' + t + '"'); this.token(); return BigInt.asIntN(64, BigInt(t)); }
      case 'nextFloat': { const t = this.token(true); if (t === null) I.throwJ('NoSuchElementException', null); if (isNaN(Number(t))) I.throwJ('InputMismatchException', 'For input string: "' + t + '"'); this.token(); return new Dbl(Math.fround(Number(t))); }
      case 'hasNext': return this.token(true) !== null;
      case 'hasNextDouble': { const t = this.token(true); return t !== null && !isNaN(Number(t)); }
      case 'hasNextInt': { const t = this.token(true); return t !== null && /^[+-]?\d+$/.test(t); }
      case 'hasNextLine': return I.stdin.length > 0;
      case 'close': return undefined;
      default: throw nf('Scanner', name);
    }
  }
}
class JClassRef {
  constructor(name, full) { this.jn = 'Class'; this.name = name; this.full = full || name; this.types = ['Class', 'Object']; }
  toJavaString() { return 'class ' + this.full; }
  invoke(name) {
    switch (name) {
      case 'getSimpleName': return this.name; case 'getName': case 'getTypeName': return this.full;
      case 'toString': return this.toJavaString(); case 'hashCode': return 1; default: throw nf('Class', name);
    }
  }
}
class JPrintStream {
  constructor(err) { this.jn = 'PrintStream'; this.err = err; this.types = ['PrintStream', 'Object']; }
  invoke(name, args, I) {
    const w = s => I.write(s, this.err);
    switch (name) {
      case 'println': case 'print':
        if (args.length > 1) I.cerr('no suitable method found for ' + name + '(' + args.length + ' argumentos)\n  ' + name + ' solo admite un argumento: une los valores con + (por ejemplo "Vida: " + vida)', null);
        if (name === 'println') w((args.length ? this.fmt(I, args[0]) : '') + '\n'); else w(this.fmt(I, args[0]));
        return undefined;
      case 'printf': case 'format': { const rest = args.slice(1); const a = rest.length === 1 && rest[0] instanceof JArray && rest[0].et.d === 0 && !JV.PRIMS.has(rest[0].et.n) ? rest[0].a : rest; w(javaFormat(I, args[0], a)); return this; }
      case 'flush': case 'close': return undefined;
      case 'write': w(String.fromCharCode(args[0])); return undefined;
      default: throw nf('PrintStream', name);
    }
  }
  fmt(I, v) { if (v instanceof JArray && v.et.n === 'char' && v.et.d === 0) return v.a.map(c => String.fromCharCode(c.c)).join(''); return I.str(v); }
}
class JComparator {
  constructor(fn) { this.jn = 'Comparator'; this.fn = fn; this.types = ['Comparator', 'Object']; }
  invoke(name, args, I) {
    switch (name) {
      case 'compare': return this.fn(args[0], args[1]);
      case 'reversed': return new JComparator((a, b) => this.fn(b, a));
      case 'thenComparing': case 'thenComparingInt': case 'thenComparingDouble': {
        const o = args[0]; const isKey = o instanceof JLambda && o.params.length === 1 || o instanceof JMRef && !(o.isClass && false);
        const next = (o instanceof JLambda && o.params.length === 2) || o instanceof JComparator ? I.cmpFn(o) : (a, b) => I.compareNatural(I.callFn(o, [a], 'apply'), I.callFn(o, [b], 'apply'));
        void isKey; return new JComparator((a, b) => this.fn(a, b) || next(a, b));
      }
      default: throw nf('Comparator', name);
    }
  }
}
class JNative {
  constructor(jn, methods, types) { this.jn = jn; this.m = methods; this.types = types || [jn, 'Object']; this.id = ++OBJ_ID; }
  toJavaString(I) { return this.m.toString ? I.str(this.m.toString([], I)) : this.jn + '@' + this.id.toString(16); }
  invoke(name, args, I, node) {
    const f = this.m[name];
    if (!f) throw new CompileError(`cannot find symbol\n  symbol:   method ${name}(${args.map(typeName).join(',')})\n  location: variable of type ${this.jn}`, node && node.line);
    return f(args, I, node);
  }
}
Object.assign(JV, { JList, JMap, JSet, JIter, JEntry, JPQ, JSB, JRandom, JScanner, JClassRef, JPrintStream, JComparator, JNative });
JV.native = (jn, methods, types) => new JNative(jn, methods, types);

/* ---------- Streams (subconjunto) ---------- */
class JStream {
  constructor(a, prim) { this.jn = 'Stream'; this.a = a; this.prim = prim || null; this.types = ['Stream', 'IntStream', 'Object']; }
  invoke(name, args, I) {
    const a = this.a, f = (fn, hint, ...xs) => I.callFn(fn, xs, hint);
    const num = x => x;
    switch (name) {
      case 'filter': return new JStream(a.filter(x => f(args[0], 'test', x)), this.prim);
      case 'map': return new JStream(a.map(x => f(args[0], 'apply', x)), this.prim);
      case 'mapToInt': return new JStream(a.map(x => f(args[0], 'applyAsInt', x)), 'int');
      case 'mapToDouble': return new JStream(a.map(x => f(args[0], 'applyAsDouble', x)), 'double');
      case 'mapToObj': return new JStream(a.map(x => f(args[0], 'apply', x)));
      case 'boxed': return new JStream(a);
      case 'sorted': return new JStream(a.slice().sort(I.cmpFn(args[0])), this.prim);
      case 'distinct': { const out = []; for (const x of a) if (!out.some(y => I.jequals(x, y))) out.push(x); return new JStream(out, this.prim); }
      case 'limit': return new JStream(a.slice(0, Number(args[0])), this.prim);
      case 'skip': return new JStream(a.slice(Number(args[0])), this.prim);
      case 'peek': a.forEach(x => f(args[0], 'accept', x)); return this;
      case 'forEach': case 'forEachOrdered': a.forEach(x => f(args[0], 'accept', x)); return undefined;
      case 'collect': return args[0](a, I);
      case 'toList': { const l = new JList('ImmutableList', a.slice()); l.imm = true; return l; }
      case 'toArray': return new JArray(this.prim ? { n: this.prim, d: 0 } : { n: 'Object', d: 0 }, a.slice());
      case 'count': return BigInt(a.length);
      case 'sum': return this.prim === 'double' ? new Dbl(a.reduce((s, x) => s + num(x.v), 0)) : a.reduce((s, x) => (s + x) | 0, 0);
      case 'average': { if (!a.length) return JV.optional(null); const s = a.reduce((t, x) => t + (x instanceof Dbl ? x.v : x), 0); return JV.optional(new Dbl(s / a.length)); }
      case 'min': case 'max': {
        if (!a.length) return JV.optional(null);
        const c = args.length ? I.cmpFn(args[0]) : I.cmpFn(null);
        let best = a[0]; for (const x of a) if (name === 'min' ? c(x, best) < 0 : c(x, best) > 0) best = x; return JV.optional(best);
      }
      case 'reduce': {
        if (args.length === 2) return a.reduce((acc, x) => f(args[1], 'apply', acc, x), args[0]);
        if (!a.length) return JV.optional(null);
        return JV.optional(a.slice(1).reduce((acc, x) => f(args[0], 'apply', acc, x), a[0]));
      }
      case 'anyMatch': return a.some(x => f(args[0], 'test', x));
      case 'allMatch': return a.every(x => f(args[0], 'test', x));
      case 'noneMatch': return !a.some(x => f(args[0], 'test', x));
      case 'findFirst': case 'findAny': return JV.optional(a.length ? a[0] : null);
      default: throw nf('Stream', name);
    }
  }
}
JV.makeStream = (a, prim) => new JStream(a, prim);
JV.optional = v => new JNative('Optional', {
  isPresent: () => v !== null, isEmpty: () => v === null,
  get: (_, I) => { if (v === null) I.throwJ('NoSuchElementException', 'No value present'); return v; },
  getAsInt: (_, I) => { if (v === null) I.throwJ('NoSuchElementException', 'No value present'); return v; },
  getAsDouble: (_, I) => { if (v === null) I.throwJ('NoSuchElementException', 'No value present'); return v; },
  orElse: a => v === null ? a[0] : v, orElseGet: (a, I) => v === null ? I.callFn(a[0], [], 'get') : v,
  orElseThrow: (a, I) => { if (v === null) { if (a.length) throw new JavaThrow(I.callFn(a[0], [], 'get')); I.throwJ('NoSuchElementException', 'No value present'); } return v; },
  ifPresent: (a, I) => { if (v !== null) I.callFn(a[0], [v], 'accept'); },
  map: (a, I) => JV.optional(v === null ? null : I.callFn(a[0], [v], 'apply')),
  toString: (a, I) => v === null ? 'Optional.empty' : 'Optional[' + I.str(v) + ']'
}, ['Optional', 'OptionalInt', 'OptionalDouble', 'Object']);
JV.JStream = JStream;

/* ---------- métodos de String ---------- */
function cmpStr(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { const d = a.charCodeAt(i) - b.charCodeAt(i); if (d) return d; }
  return a.length - b.length;
}
JV.cmpStr = cmpStr;
function javaSplit(s, re, limit) {
  if (s === '') return [''];
  let rx; try { rx = new RegExp(re.length === 1 && !/[.$|()\[{^?*+\\]/.test(re) ? re.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : re, 'g'); } catch (e) { return [s]; }
  const parts = []; let last = 0, m, cnt = 0;
  while ((m = rx.exec(s))) {
    if (m[0] === '') { if (m.index === 0 || m.index >= s.length) { rx.lastIndex++; continue; } }
    if (limit > 0 && cnt >= limit - 1) break;
    if (m.index === 0 && m[0] !== '' && false) continue;
    parts.push(s.slice(last, m.index)); last = m.index + m[0].length; cnt++;
    if (m[0] === '') rx.lastIndex++;
  }
  parts.push(s.slice(last));
  if (limit === 0) while (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
  if (limit === 0 && parts.length === 1 && parts[0] === '' && s !== '') return [];
  return parts;
}
JV.stringMethod = function (s, name, args, I) {
  const sioobe = msg => I.throwJ('StringIndexOutOfBoundsException', msg);
  const cs = x => x instanceof Chr ? String.fromCharCode(x.c) : x instanceof JSB ? x.s : x;
  switch (name) {
    case 'length': return s.length;
    case 'charAt': if (typeof args[0] !== 'number' || args[0] < 0 || args[0] >= s.length) sioobe(`Index ${args[0]} out of bounds for length ${s.length}`); return new Chr(s.charCodeAt(args[0]));
    case 'substring': case 'subSequence': {
      const b = args[0], e = args.length > 1 ? args[1] : s.length;
      if (b < 0 || e > s.length || b > e) sioobe(`begin ${b}, end ${e}, length ${s.length}`);
      return s.substring(b, e);
    }
    case 'indexOf': return s.indexOf(cs(args[0]) instanceof Object ? '' : (typeof args[0] === 'number' ? String.fromCharCode(args[0]) : cs(args[0])), args[1] || 0);
    case 'lastIndexOf': return s.lastIndexOf(typeof args[0] === 'number' ? String.fromCharCode(args[0]) : cs(args[0]));
    case 'contains': return s.includes(cs(args[0]));
    case 'startsWith': return s.startsWith(args[0], args[1] || 0);
    case 'endsWith': return s.endsWith(args[0]);
    case 'equals': return typeof args[0] === 'string' && s === args[0];
    case 'equalsIgnoreCase': return typeof args[0] === 'string' && s.toLowerCase() === args[0].toLowerCase();
    case 'compareTo': if (args[0] === null) I.throwJ('NullPointerException', null); return cmpStr(s, args[0]);
    case 'compareToIgnoreCase': return cmpStr(s.toLowerCase(), args[0].toLowerCase());
    case 'toUpperCase': return s.toUpperCase();
    case 'toLowerCase': return s.toLowerCase();
    case 'trim': return s.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '');
    case 'strip': return s.trim();
    case 'stripLeading': return s.trimStart(); case 'stripTrailing': return s.trimEnd();
    case 'isEmpty': return s.length === 0;
    case 'isBlank': return s.trim().length === 0;
    case 'replace': return s.split(cs(args[0])).join(cs(args[1]));
    case 'replaceAll': return s.replace(new RegExp(args[0], 'g'), args[1]);
    case 'replaceFirst': return s.replace(new RegExp(args[0]), args[1]);
    case 'split': return new JArray({ n: 'String', d: 0 }, javaSplit(s, args[0], args.length > 1 ? args[1] : 0));
    case 'toCharArray': return new JArray({ n: 'char', d: 0 }, [...s].map(c => new Chr(c.charCodeAt(0))));
    case 'concat': return s + args[0];
    case 'repeat': if (args[0] < 0) I.throwJ('IllegalArgumentException', 'count is negative: ' + args[0]); return s.repeat(args[0]);
    case 'hashCode': return hashString(s);
    case 'matches': return new RegExp('^(?:' + args[0] + ')$').test(s);
    case 'intern': case 'toString': return s;
    case 'chars': return new JStream([...s].map(c => c.charCodeAt(0)), 'int');
    case 'lines': return new JStream(s.split(/\r?\n/));
    case 'codePointAt': return s.charCodeAt(args[0]);
    case 'formatted': return javaFormat(I, s, args);
    case 'getClass': return new JClassRef('String', 'java.lang.String');
    default: throw new CompileError(`cannot find symbol\n  symbol:   method ${name}(${args.map(typeName).join(',')})\n  location: class String`);
  }
};

/* ---------- métodos de tipos envueltos (Integer, Double, ...) ---------- */
JV.boxedMethod = function (v, name, args, I) {
  switch (name) {
    case 'equals': return I.jequals(v, args[0]) && typeName(v) === typeName(args[0]);
    case 'hashCode': return I.jhash(v);
    case 'toString': return I.str(v);
    case 'compareTo': case 'compare': return I.compareNatural(v, args[0]);
    case 'intValue': return typeof v === 'number' ? v : JV.castPrim('int', v);
    case 'longValue': return JV.castPrim('long', v);
    case 'doubleValue': case 'floatValue': return JV.castPrim('double', v);
    case 'charValue': case 'booleanValue': return v;
    case 'isNaN': return Number.isNaN(v.v);
    case 'getClass': return new JClassRef(typeName(v) === 'int' ? 'Integer' : typeName(v) === 'double' ? 'Double' : typeName(v), boxName(v));
    default: throw new CompileError(`cannot find symbol\n  symbol:   method ${name}()\n  location: class ${typeName(v)}`);
  }
};

JV.castPrim = function (tn, v) {
  if (typeof v === 'boolean' || typeof v === 'string' || v === null || v === undefined || typeof v === 'object' && !(v instanceof Dbl) && !(v instanceof Chr))
    throw new CompileError(`incompatible types: ${typeName(v)} cannot be converted to ${tn}`);
  const n = typeof v === 'bigint' ? v : toN(v);
  switch (tn) {
    case 'int': case 'short': case 'byte': {
      let x;
      if (typeof n === 'bigint') x = Number(BigInt.asIntN(32, n));
      else if (v instanceof Dbl) x = Number.isNaN(n) ? 0 : n >= 2147483647 ? 2147483647 : n <= -2147483648 ? -2147483648 : Math.trunc(n);
      else x = n | 0;
      if (tn === 'short') return (x << 16) >> 16; if (tn === 'byte') return (x << 24) >> 24; return x;
    }
    case 'long':
      if (typeof n === 'bigint') return n;
      if (v instanceof Dbl) { if (Number.isNaN(n)) return 0n; if (n >= 9.223372036854775807e18) return 9223372036854775807n; if (n <= -9.223372036854775808e18) return -9223372036854775808n; return BigInt(Math.trunc(n)); }
      return BigInt(n);
    case 'double': return v instanceof Dbl ? v : new Dbl(Number(n));
    case 'float': return new Dbl(Math.fround(Number(n)));
    case 'char': return new Chr((typeof n === 'bigint' ? Number(BigInt.asUintN(16, n)) : Math.trunc(n)) & 0xFFFF);
    default: return v;
  }
};

/* ---------- clases estáticas (Math, Integer, ...) ---------- */
const S = JV.STATICS = Object.create(null);
const D = x => new Dbl(x);
const num = toN;
const nfe = (I, s) => I.throwJ('NumberFormatException', s === null ? 'Cannot parse null string: null' : `For input string: "${s}"`);
S.Math = {
  PI: D(Math.PI), E: D(Math.E),
  abs: a => { const v = a[0]; return typeof v === 'number' ? Math.abs(v) | 0 : typeof v === 'bigint' ? (v < 0n ? -v : v) : v instanceof Chr ? v.c : D(Math.abs(v.v)); },
  max: a => { const [x, y] = a; if (x instanceof Dbl || y instanceof Dbl) return D(Math.max(num(x), num(y))); if (typeof x === 'bigint' || typeof y === 'bigint') return BigInt(x) > BigInt(y) ? BigInt(x) : BigInt(y); return Math.max(num(x), num(y)); },
  min: a => { const [x, y] = a; if (x instanceof Dbl || y instanceof Dbl) return D(Math.min(num(x), num(y))); if (typeof x === 'bigint' || typeof y === 'bigint') return BigInt(x) < BigInt(y) ? BigInt(x) : BigInt(y); return Math.min(num(x), num(y)); },
  pow: a => D(Math.pow(num(a[0]), num(a[1]))), sqrt: a => D(Math.sqrt(num(a[0]))), cbrt: a => D(Math.cbrt(num(a[0]))),
  floor: a => D(Math.floor(num(a[0]))), ceil: a => D(Math.ceil(num(a[0]))), rint: a => D(Math.round(num(a[0]))),
  round: a => { const v = a[0]; if (!(v instanceof Dbl)) return v; const r = Math.floor(v.v + 0.5); return Number.isFinite(r) ? BigInt(r) : 0n; },
  random: () => D(Math.random()),
  sin: a => D(Math.sin(num(a[0]))), cos: a => D(Math.cos(num(a[0]))), tan: a => D(Math.tan(num(a[0]))),
  atan: a => D(Math.atan(num(a[0]))), atan2: a => D(Math.atan2(num(a[0]), num(a[1]))), exp: a => D(Math.exp(num(a[0]))),
  log: a => D(Math.log(num(a[0]))), log10: a => D(Math.log10(num(a[0]))), hypot: a => D(Math.hypot(num(a[0]), num(a[1]))),
  signum: a => D(Math.sign(num(a[0]))), toRadians: a => D(num(a[0]) * Math.PI / 180), toDegrees: a => D(num(a[0]) * 180 / Math.PI),
  floorMod: a => { const m = num(a[1]); return ((num(a[0]) % m) + m) % m; },
  floorDiv: (a, I) => { if (num(a[1]) === 0) I.throwJ('ArithmeticException', '/ by zero'); return Math.floor(num(a[0]) / num(a[1])); },
  addExact: (a, I) => { const r = num(a[0]) + num(a[1]); if (r > 2147483647 || r < -2147483648) I.throwJ('ArithmeticException', 'integer overflow'); return r; },
  multiplyExact: (a, I) => { const r = num(a[0]) * num(a[1]); if (r > 2147483647 || r < -2147483648) I.throwJ('ArithmeticException', 'integer overflow'); return r; },
  subtractExact: (a, I) => { const r = num(a[0]) - num(a[1]); if (r > 2147483647 || r < -2147483648) I.throwJ('ArithmeticException', 'integer overflow'); return r; },
  clamp: a => { const v = num(a[0]), lo = num(a[1]), hi = num(a[2]); const r = Math.min(Math.max(v, lo), hi); return a[1] instanceof Dbl ? D(r) : r; }
};
const parseIntJ = (I, s, radix) => {
  if (s === null) nfe(I, null);
  const re = radix === 10 ? /^[+-]?\d+$/ : null;
  if (re ? !re.test(s) : !(s.length && /^[+-]?[0-9a-zA-Z]+$/.test(s) && !isNaN(parseInt(s, radix)))) nfe(I, s);
  return parseInt(s, radix);
};
S.Integer = {
  MAX_VALUE: 2147483647, MIN_VALUE: -2147483648,
  parseInt: (a, I) => { const r = parseIntJ(I, a[0], a[1] || 10); if (r > 2147483647 || r < -2147483648) nfe(I, a[0]); return r; },
  valueOf: (a, I) => typeof a[0] === 'string' ? S.Integer.parseInt(a, I) : a[0] instanceof Chr ? a[0].c : a[0],
  toString: a => a.length > 1 ? a[0].toString(a[1]) : String(a[0]),
  compare: a => a[0] < a[1] ? -1 : a[0] > a[1] ? 1 : 0, sum: a => (a[0] + a[1]) | 0, max: a => Math.max(a[0], a[1]), min: a => Math.min(a[0], a[1]),
  toBinaryString: a => (a[0] >>> 0).toString(2), toHexString: a => (a[0] >>> 0).toString(16), toOctalString: a => (a[0] >>> 0).toString(8),
  signum: a => Math.sign(a[0]), bitCount: a => (a[0] >>> 0).toString(2).replace(/0/g, '').length, hashCode: a => a[0],
  abs: a => Math.abs(a[0]) | 0
};
S.Long = {
  MAX_VALUE: 9223372036854775807n, MIN_VALUE: -9223372036854775808n,
  parseLong: (a, I) => { if (a[0] === null || !/^[+-]?\d+$/.test(a[0])) nfe(I, a[0]); return BigInt.asIntN(64, BigInt(a[0])); },
  valueOf: (a, I) => typeof a[0] === 'string' ? S.Long.parseLong(a, I) : BigInt(a[0]),
  toString: a => String(a[0]), compare: a => a[0] < a[1] ? -1 : a[0] > a[1] ? 1 : 0, sum: a => BigInt.asIntN(64, BigInt(a[0]) + BigInt(a[1])),
  max: a => a[0] > a[1] ? a[0] : a[1], min: a => a[0] < a[1] ? a[0] : a[1]
};
const parseSmall = (min, max) => (a, I) => { const r = parseIntJ(I, a[0], a[1] || 10); if (r > max || r < min) I.throwJ('NumberFormatException', `Value out of range. Value:"${a[0]}" Radix:10`); return r; };
S.Short = { MAX_VALUE: 32767, MIN_VALUE: -32768, parseShort: parseSmall(-32768, 32767), valueOf: a => typeof a[0] === 'string' ? parseSmall(-32768, 32767)(a, S.__I) : a[0] };
S.Byte = { MAX_VALUE: 127, MIN_VALUE: -128, parseByte: parseSmall(-128, 127), valueOf: a => typeof a[0] === 'string' ? parseSmall(-128, 127)(a, S.__I) : a[0] };
S.Double = {
  MAX_VALUE: D(Number.MAX_VALUE), MIN_VALUE: D(5e-324), POSITIVE_INFINITY: D(Infinity), NEGATIVE_INFINITY: D(-Infinity), NaN: D(NaN),
  parseDouble: (a, I) => { const s = a[0]; if (s === null) I.throwJ('NullPointerException', null); const t = s.trim(); if (t === '' || isNaN(Number(t)) && !/^[+-]?(Infinity|NaN)$/.test(t)) I.throwJ('NumberFormatException', t === '' ? 'empty String' : `For input string: "${s}"`); return D(Number(t.replace(/[dDfF]$/, ''))); },
  valueOf: (a, I) => typeof a[0] === 'string' ? S.Double.parseDouble(a, I) : D(num(a[0])),
  toString: a => dblStr(num(a[0])), compare: a => { const x = num(a[0]), y = num(a[1]); return x < y ? -1 : x > y ? 1 : 0; },
  isNaN: a => Number.isNaN(num(a[0])), isInfinite: a => Math.abs(num(a[0])) === Infinity, sum: a => D(num(a[0]) + num(a[1])), max: a => D(Math.max(num(a[0]), num(a[1]))), min: a => D(Math.min(num(a[0]), num(a[1])))
};
S.Float = { parseFloat: (a, I) => S.Double.parseDouble(a, I), MAX_VALUE: D(3.4028234663852886e38) };
S.Boolean = {
  parseBoolean: a => typeof a[0] === 'string' && a[0].toLowerCase() === 'true', valueOf: a => typeof a[0] === 'string' ? a[0].toLowerCase() === 'true' : a[0],
  toString: a => String(a[0]), TRUE: true, FALSE: false, logicalAnd: a => a[0] && a[1], logicalOr: a => a[0] || a[1], logicalXor: a => a[0] !== a[1]
};
const cc = v => v instanceof Chr ? v.c : v;
const chStr = v => String.fromCharCode(cc(v));
S.Character = {
  MAX_VALUE: new Chr(65535), MIN_VALUE: new Chr(0),
  isDigit: a => /[0-9]/.test(chStr(a[0])), isLetter: a => /\p{L}/u.test(chStr(a[0])), isLetterOrDigit: a => /[\p{L}0-9]/u.test(chStr(a[0])),
  isAlphabetic: a => /\p{L}/u.test(chStr(a[0])), isUpperCase: a => /\p{Lu}/u.test(chStr(a[0])), isLowerCase: a => /\p{Ll}/u.test(chStr(a[0])),
  isWhitespace: a => /\s/.test(chStr(a[0])), isSpaceChar: a => /\s/.test(chStr(a[0])),
  toUpperCase: a => a[0] instanceof Chr ? new Chr(chStr(a[0]).toUpperCase().charCodeAt(0)) : chStr(a[0]).toUpperCase().charCodeAt(0),
  toLowerCase: a => a[0] instanceof Chr ? new Chr(chStr(a[0]).toLowerCase().charCodeAt(0)) : chStr(a[0]).toLowerCase().charCodeAt(0),
  getNumericValue: a => { const c = chStr(a[0]); return /[0-9]/.test(c) ? c.charCodeAt(0) - 48 : /[a-zA-Z]/.test(c) ? c.toLowerCase().charCodeAt(0) - 87 : -1; },
  toString: a => chStr(a[0]), valueOf: a => a[0], compare: a => cc(a[0]) - cc(a[1]), hashCode: a => cc(a[0]),
  toChars: a => new JArray({ n: 'char', d: 0 }, [new Chr(a[0])]), digit: a => { const v = parseInt(chStr(a[0]), a[1]); return isNaN(v) ? -1 : v; },
  forDigit: a => new Chr(a[0].toString(a[1]).charCodeAt(0))
};
S.String = {
  valueOf: (a, I) => a[0] instanceof JArray ? a[0].a.map(c => String.fromCharCode(c.c)).join('') : I.str(a[0]),
  copyValueOf: a => a[0].a.map(c => String.fromCharCode(c.c)).join(''),
  format: (a, I) => { const rest = a.slice(1); return javaFormat(I, a[0], rest.length === 1 && rest[0] instanceof JArray && rest[0].et.d === 0 && !JV.PRIMS.has(rest[0].et.n) ? rest[0].a : rest); },
  join: (a, I) => { const items = a.length === 2 && !(typeof a[1] === 'string') ? I.toArray(a[1]) : a.slice(1); return items.map(x => I.str(x)).join(a[0]); },
  CASE_INSENSITIVE_ORDER: new JComparator((x, y) => cmpStr(x.toLowerCase(), y.toLowerCase()))
};
S.System = {
  out: new JPrintStream(false), err: new JPrintStream(true), in: { jn: 'InputStream', types: ['InputStream', 'Object'] },
  currentTimeMillis: () => BigInt(Date.now()), nanoTime: () => BigInt(Math.round(performance.now() * 1e6)),
  lineSeparator: () => '\n', exit: a => { throw new ExitSignal(a[0]); },
  identityHashCode: a => a[0] && a[0].id ? a[0].id : 0,
  arraycopy: (a, I) => {
    const [src, sp, dst, dp, len] = a;
    if (src === null || dst === null) I.throwJ('NullPointerException', null);
    if (sp < 0 || dp < 0 || len < 0 || sp + len > src.a.length || dp + len > dst.a.length) I.throwJ('ArrayIndexOutOfBoundsException', `arraycopy: last source index ${sp + len} out of bounds for length ${src.a.length}`);
    const tmp = src.a.slice(sp, sp + len); for (let i = 0; i < len; i++) dst.a[dp + i] = tmp[i];
  },
  getProperty: () => null, getenv: () => null
};
S.Thread = { sleep: () => undefined, currentThread: () => new JNative('Thread', { getName: () => 'main', interrupt: () => undefined }) };
S.Objects = {
  equals: (a, I) => I.jequals(a[0], a[1]), hash: (a, I) => { const items = a.length === 1 && a[0] instanceof JArray ? a[0].a : a; let h = 1; for (const x of items) h = (Math.imul(31, h) + I.jhash(x)) | 0; return h; },
  hashCode: (a, I) => a[0] === null ? 0 : I.jhash(a[0]), toString: (a, I) => a[0] === null && a.length > 1 ? a[1] : I.str(a[0]), isNull: a => a[0] === null, nonNull: a => a[0] !== null,
  requireNonNull: (a, I) => { if (a[0] === null) I.throwJ('NullPointerException', a.length > 1 ? a[1] : null); return a[0]; },
  requireNonNullElse: a => a[0] === null ? a[1] : a[0]
};
const arrOf = (I, v) => { if (v === null) I.throwJ('NullPointerException', null); return v; };
S.Arrays = {
  toString: (a, I) => a[0] === null ? 'null' : '[' + a[0].a.map(x => I.str(x)).join(', ') + ']',
  deepToString: (a, I) => { const f = x => x instanceof JArray ? '[' + x.a.map(f).join(', ') + ']' : I.str(x); return a[0] === null ? 'null' : f(a[0]); },
  sort: (a, I) => {
    const arr = arrOf(I, a[0]); let from = 0, to = arr.a.length, cmp = null;
    if (a.length >= 3 && typeof a[1] === 'number') { from = a[1]; to = a[2]; cmp = a[3]; } else if (a.length === 2) cmp = a[1];
    const c = I.cmpFn(cmp), part = arr.a.slice(from, to).sort(c); for (let i = 0; i < part.length; i++) arr.a[from + i] = part[i];
  },
  fill: (a, I) => { const arr = arrOf(I, a[0]); if (a.length === 4) { for (let i = a[1]; i < a[2]; i++) arr.a[i] = I.coerce(arr.et, a[3]); } else arr.a.fill(I.coerce(arr.et, a[1])); },
  copyOf: (a, I) => { const arr = arrOf(I, a[0]); if (a[1] < 0) I.throwJ('NegativeArraySizeException', String(a[1])); const o = arr.a.slice(0, a[1]); while (o.length < a[1]) o.push(I.defVal(arr.et)); return new JArray(arr.et, o); },
  copyOfRange: (a, I) => { const arr = arrOf(I, a[0]); if (a[1] > a[2]) I.throwJ('IllegalArgumentException', `${a[1]} > ${a[2]}`); const o = arr.a.slice(a[1], a[2]); while (o.length < a[2] - a[1]) o.push(I.defVal(arr.et)); return new JArray(arr.et, o); },
  asList: (a, I) => { const items = a.length === 1 && a[0] instanceof JArray && !JV.PRIMS.has(a[0].et.n) ? a[0].a : a; const l = new JList('ArrayList', items.slice()); l.fixed = true; return l; },
  equals: (a, I) => a[0] === a[1] || (a[0] !== null && a[1] !== null && a[0].a.length === a[1].a.length && a[0].a.every((x, i) => I.jequals(x, a[1].a[i]))),
  deepEquals: (a, I) => I.jequals(a[0], a[1]), hashCode: (a, I) => I.jhash(a[0]),
  binarySearch: (a, I) => { const arr = a[0].a; let lo = 0, hi = arr.length - 1; while (lo <= hi) { const mid = (lo + hi) >>> 1, c = I.compareNatural(arr[mid], a[1]); if (c < 0) lo = mid + 1; else if (c > 0) hi = mid - 1; else return mid; } return -(lo + 1); },
  stream: a => JV.makeStream(a[0].a.slice(), a[0].et.d === 0 && JV.PRIMS.has(a[0].et.n) ? a[0].et.n : null)
};
S.List = {
  of: (a, I) => { const items = a.length === 1 && a[0] instanceof JArray ? a[0].a : a; const l = new JList('ImmutableList', items.slice()); l.imm = true; return l; },
  copyOf: (a, I) => { const l = new JList('ImmutableList', I.toArray(a[0]).slice()); l.imm = true; return l; }
};
S.Set = { of: (a, I) => { const s = new JSet('LinkedHashSet'); a.forEach(x => s.map.put(I, x, true)); s.map.imm = true; return s; } };
S.Map = {
  of: (a, I) => { const m = new JMap('LinkedHashMap'); for (let i = 0; i < a.length; i += 2) m.put(I, a[i], a[i + 1]); m.imm = true; return m; },
  entry: (a) => new JEntry({ k: a[0], v: a[1] })
};
S.Collections = {
  sort: (a, I) => { a[0].a.sort(I.cmpFn(a[1])); a[0].mod++; },
  reverse: a => { a[0].a.reverse(); },
  max: (a, I) => { const c = I.cmpFn(a[1]), l = I.toArray(a[0]); if (!l.length) I.throwJ('NoSuchElementException', null); return l.reduce((m, x) => c(x, m) > 0 ? x : m); },
  min: (a, I) => { const c = I.cmpFn(a[1]), l = I.toArray(a[0]); if (!l.length) I.throwJ('NoSuchElementException', null); return l.reduce((m, x) => c(x, m) < 0 ? x : m); },
  swap: (a, I) => { const l = a[0].a; a[0].chk(I, a[1], l.length); a[0].chk(I, a[2], l.length); const t = l[a[1]]; l[a[1]] = l[a[2]]; l[a[2]] = t; },
  shuffle: (a, I) => { const r = a[1] || new JRandom(); const l = a[0].a; for (let i = l.length; i > 1; i--) { const j = r.nextInt(I, i); const t = l[i - 1]; l[i - 1] = l[j]; l[j] = t; } },
  frequency: (a, I) => I.toArray(a[0]).filter(x => I.jequals(x, a[1])).length,
  unmodifiableList: a => { const l = new JList('ImmutableList', a[0].a.slice()); l.imm = true; return l; },
  emptyList: () => { const l = new JList('ImmutableList', []); l.imm = true; return l; },
  nCopies: a => { const l = new JList('ImmutableList', new Array(a[0]).fill(a[1])); l.imm = true; return l; },
  reverseOrder: () => new JComparator((x, y) => -JV.interp.compareNatural(x, y)),
  addAll: (a, I) => { const items = a.length === 2 && a[1] instanceof JArray ? a[1].a : a.slice(1); items.forEach(x => a[0].invoke('add', [x], I)); return true; },
  singletonList: a => { const l = new JList('ImmutableList', [a[0]]); l.imm = true; return l; }
};
S.Comparator = {
  naturalOrder: () => new JComparator((x, y) => JV.interp.compareNatural(x, y)),
  reverseOrder: () => new JComparator((x, y) => -JV.interp.compareNatural(y, x) * -1 * -1),
  comparing: (a, I) => new JComparator((x, y) => a.length > 1 ? I.cmpFn(a[1])(I.callFn(a[0], [x], 'apply'), I.callFn(a[0], [y], 'apply')) : I.compareNatural(I.callFn(a[0], [x], 'apply'), I.callFn(a[0], [y], 'apply'))),
};
S.Comparator.comparingInt = S.Comparator.comparingDouble = S.Comparator.comparingLong = S.Comparator.comparing;
S.Comparator.reverseOrder = () => new JComparator((x, y) => JV.interp.compareNatural(y, x));
S.Collectors = {
  toList: () => (a, I) => new JList('ArrayList', a),
  toSet: () => (a, I) => { const s = new JSet('HashSet'); a.forEach(x => s.map.put(I, x, true)); return s; },
  joining: a => (items, I) => (a[1] || '') + items.map(x => I.str(x)).join(a[0] || '') + (a[2] || ''),
  counting: () => (items) => BigInt(items.length),
  groupingBy: a => (items, I) => { const m = new JMap('HashMap'); for (const x of items) { const k = I.callFn(a[0], [x], 'apply'); const e = m.find(I, k); if (e) e.v.push(x); else m.put(I, k, [x]); } for (const e of m.entries(I)) e.v = a[1] ? a[a.length - 1](e.v, I) : new JList('ArrayList', e.v); return m; },
  summingInt: a => (items, I) => items.reduce((s, x) => (s + I.callFn(a[0], [x], 'applyAsInt')) | 0, 0),
  averagingInt: a => (items, I) => new Dbl(items.length ? items.reduce((s, x) => s + I.callFn(a[0], [x], 'applyAsInt'), 0) / items.length : 0)
};
S.IntStream = {
  range: a => JV.makeStream(Array.from({ length: Math.max(0, a[1] - a[0]) }, (_, i) => a[0] + i), 'int'),
  rangeClosed: a => JV.makeStream(Array.from({ length: Math.max(0, a[1] - a[0] + 1) }, (_, i) => a[0] + i), 'int'),
  of: a => JV.makeStream(a.length === 1 && a[0] instanceof JArray ? a[0].a.slice() : a.slice(), 'int')
};
S.Stream = { of: a => JV.makeStream(a.length === 1 && a[0] instanceof JArray ? a[0].a.slice() : a.slice()) };
S.Optional = { of: a => JV.optional(a[0]), empty: () => JV.optional(null), ofNullable: a => JV.optional(a[0]) };
S.ThreadLocalRandom = { current: () => new JRandom() };
S.TimeUnit = {};

/* ---------- constructores nativos ---------- */
const N = JV.NEW = Object.create(null);
const listOf = kind => (a, I) => { const l = new JList(kind); if (a.length && typeof a[0] === 'number') { if (a[0] < 0) I.throwJ('IllegalArgumentException', 'Illegal Capacity: ' + a[0]); } else if (a.length) l.a = I.toArray(a[0]).slice(); return l; };
N.ArrayList = listOf('ArrayList'); N.LinkedList = listOf('LinkedList'); N.Vector = listOf('Vector'); N.Stack = listOf('Stack'); N.ArrayDeque = listOf('ArrayDeque');
const mapOf = kind => (a, I) => { const m = new JMap(kind, a.length && !(typeof a[0] === 'number') && !(a[0] instanceof JMap) ? a[0] : null); if (a.length && a[0] instanceof JMap) for (const e of a[0].entries(I)) m.put(I, e.k, e.v); return m; };
N.HashMap = mapOf('HashMap'); N.LinkedHashMap = mapOf('LinkedHashMap'); N.TreeMap = mapOf('TreeMap'); N.Hashtable = mapOf('HashMap'); N.ConcurrentHashMap = mapOf('HashMap');
const setOf = kind => (a, I) => {
  const isCmp = a.length && (a[0] instanceof JLambda || a[0] instanceof JComparator || a[0] instanceof JObject && !(a[0] instanceof JList));
  const s = new JSet(kind, isCmp ? a[0] : null);
  if (a.length && !isCmp && typeof a[0] !== 'number') I.toArray(a[0]).forEach(x => s.map.put(I, x, true));
  return s;
};
N.HashSet = setOf('HashSet'); N.LinkedHashSet = setOf('LinkedHashSet'); N.TreeSet = setOf('TreeSet');
N.PriorityQueue = (a, I) => { const q = new JPQ(a.find(x => x instanceof JLambda || x instanceof JComparator || x instanceof JObject)); const c = a.find(x => x && (x.a || x.map)); if (c) I.toArray(c).forEach(x => q.invoke('add', [x], I)); return q; };
N.StringBuilder = N.StringBuffer = (a, I) => new JSB(a.length && typeof a[0] !== 'number' ? I.str(a[0]) : '');
N.Random = a => new JRandom(a.length ? a[0] : undefined);
N.Scanner = (a, I) => new JScanner(I);
N.String = (a, I) => a.length === 0 ? '' : a[0] instanceof JArray ? a[0].a.map(c => String.fromCharCode(c.c)).join('') : I.str(a[0]);
N.Object = (a, I) => new JObject(I.classes.Object);
N.Integer = a => typeof a[0] === 'string' ? parseInt(a[0], 10) : a[0]; N.Double = a => typeof a[0] === 'string' ? D(Number(a[0])) : D(num(a[0]));

// tipos estándar conocidos (para sobrecarga por tipo)
JV.KNOWN_STD = new Set(['List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'TreeMap', 'LinkedHashMap', 'Set', 'HashSet', 'TreeSet', 'LinkedHashSet',
  'StringBuilder', 'Random', 'Collection', 'Queue', 'Deque', 'Stack', 'ArrayDeque', 'PriorityQueue', 'Iterator', 'Scanner']);
})(globalThis);
