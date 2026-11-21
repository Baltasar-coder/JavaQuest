/* Intérprete de Java (árbol de sintaxis) */
(function (G) {
'use strict';
const JV = G.JV;
const { CompileError, Dbl, Chr, JObject, JArray, JLambda, JMRef, JavaThrow, Timeout, ExitSignal, UNSET,
  JList, JMap, JSet, JSB, JClassRef, JComparator, JNative, typeName, PRIMS, STATICS, NEW } = JV;
const MAXDEPTH = 380;

/* ---- prelude: excepciones estándar escritas en Java ---- */
const EXC = [
  ['Exception', 'Throwable', 'java.lang'], ['Error', 'Throwable', 'java.lang'], ['RuntimeException', 'Exception', 'java.lang'],
  ['IllegalArgumentException', 'RuntimeException', 'java.lang'], ['IllegalStateException', 'RuntimeException', 'java.lang'],
  ['ArithmeticException', 'RuntimeException', 'java.lang'], ['NullPointerException', 'RuntimeException', 'java.lang'],
  ['ClassCastException', 'RuntimeException', 'java.lang'], ['UnsupportedOperationException', 'RuntimeException', 'java.lang'],
  ['NegativeArraySizeException', 'RuntimeException', 'java.lang'], ['ArrayStoreException', 'RuntimeException', 'java.lang'],
  ['IndexOutOfBoundsException', 'RuntimeException', 'java.lang'], ['ArrayIndexOutOfBoundsException', 'IndexOutOfBoundsException', 'java.lang'],
  ['StringIndexOutOfBoundsException', 'IndexOutOfBoundsException', 'java.lang'], ['NumberFormatException', 'IllegalArgumentException', 'java.lang'],
  ['SecurityException', 'RuntimeException', 'java.lang'], ['InterruptedException', 'Exception', 'java.lang'], ['CloneNotSupportedException', 'Exception', 'java.lang'],
  ['VirtualMachineError', 'Error', 'java.lang'], ['StackOverflowError', 'VirtualMachineError', 'java.lang'], ['OutOfMemoryError', 'VirtualMachineError', 'java.lang'],
  ['AssertionError', 'Error', 'java.lang'],
  ['NoSuchElementException', 'RuntimeException', 'java.util'], ['InputMismatchException', 'NoSuchElementException', 'java.util'],
  ['ConcurrentModificationException', 'RuntimeException', 'java.util'], ['EmptyStackException', 'RuntimeException', 'java.util'],
  ['IllegalFormatException', 'IllegalArgumentException', 'java.util'], ['MissingFormatArgumentException', 'IllegalFormatException', 'java.util'],
  ['IllegalFormatConversionException', 'IllegalFormatException', 'java.util'], ['UnknownFormatConversionException', 'IllegalFormatException', 'java.util'],
  ['IOException', 'Exception', 'java.io'], ['FileNotFoundException', 'IOException', 'java.io'], ['UncheckedIOException', 'RuntimeException', 'java.io'],
  ['DateTimeException', 'RuntimeException', 'java.time']
];
const PRELUDE_SRC = `
class Object { }
class Throwable {
  private String message; private Throwable cause;
  public Throwable() { }
  public Throwable(String message) { this.message = message; }
  public Throwable(String message, Throwable cause) { this.message = message; this.cause = cause; }
  public Throwable(Throwable cause) { this.cause = cause; if (cause != null) this.message = cause.toString(); }
  public String getMessage() { return message; }
  public String getLocalizedMessage() { return message; }
  public Throwable getCause() { return cause; }
  public Throwable initCause(Throwable c) { this.cause = c; return this; }
  public String toString() { String n = getClass().getName(); return message == null ? n : n + ": " + message; }
  public void printStackTrace() { System.err.println(this); System.err.println("\\tat Main.main(Main.java)"); }
  public void addSuppressed(Throwable t) { }
}
` + EXC.map(([n, p]) => `class ${n} extends ${p} { }`).join('\n');
let PRELUDE = null;
function prelude() {
  if (!PRELUDE) {
    PRELUDE = JV.parse(PRELUDE_SRC);
    const pk = {}; EXC.forEach(([n, p, pkg]) => { pk[n] = pkg; });
    PRELUDE.classes.forEach(c => { c.builtin = true; c.pkg = pk[c.name] || (c.name === 'Throwable' || c.name === 'Object' ? 'java.lang' : null); });
  }
  return PRELUDE;
}

class Env {
  constructor(parent) { this.vars = Object.create(null); this.parent = parent || null; this.ctx = parent ? parent.ctx : null; this.method = false; }
}
const tstr = t => t.n + '[]'.repeat(t.d);
const isTrueLit = c => c && ((c.k === 'lit' && c.v === true) || (c.k === 'paren' && isTrueLit(c.e)));
const kindOf = v => (typeof v === 'number' || v instanceof Chr) ? 1 : typeof v === 'bigint' ? 2 : v instanceof Dbl ? 3 : 0;
const toN = JV.toN;

class Interp {
  constructor(opts) {
    opts = opts || {};
    this.classes = Object.create(null); this.segs = []; this.stdout = ''; this.outLen = 0; this.stdin = opts.stdin || '';
    this.globals = opts.globals || {}; this.steps = 0; this.maxSteps = opts.maxSteps || 4e6; this.depth = 0; this.curLine = 0;
    this.anonCache = new Map(); this.anonN = 0; this.userClasses = [];
    JV.interp = this;
    this.loadAst(prelude(), true);
  }
  write(s, err) {
    this.outLen += s.length; if (this.outLen > 400000) throw new Timeout('Demasiada salida');
    const last = this.segs[this.segs.length - 1];
    if (last && last.err === !!err) last.s += s; else this.segs.push({ s, err: !!err });
    if (!err) this.stdout += s;
  }
  cerr(msg, line) { throw new CompileError(msg, line || this.curLine); }
  tick() { if (++this.steps > this.maxSteps) throw new Timeout('Tu programa tardó demasiado: ¿hay un bucle infinito?'); }

  /* ================= carga y enlace de clases ================= */
  loadSource(src, isUser, line0) {
    const parsed = JV.parse(src, line0);
    this.loadAst(parsed, false, isUser);
    return parsed;
  }
  loadAst(parsed, isPrelude, isUser) {
    const created = [];
    for (const c of parsed.classes) this.declare(c, null, created);
    for (const ci of created) this.link(ci);
    if (!isPrelude) { for (const ci of created) this.check(ci); if (isUser) created.forEach(c => { if (!c.outer) this.userClasses.push(c); }); }
    return created;
  }
  declare(ast, outer, created) {
    if (this.classes[ast.name] && !ast.anonymous) throw new CompileError(`duplicate class: ${ast.name}`, ast.line);
    const ci = {
      name: ast.name, ast, kind: ast.kind, outer: outer || null, sup: null, ifaces: [], ifaceNames: (ast.ifaces || []).slice(), superName: ast.superName,
      statics: Object.create(null), methods: Object.create(null), ctors: [], own: Object.create(null), instFields: [],
      initState: 0, abstract: !!ast.mods.abstract || ast.kind === 'interface', isInterface: ast.kind === 'interface', isEnum: ast.kind === 'enum',
      isRecord: ast.kind === 'record', builtin: !!ast.builtin, inherit: !!(ast.builtin || ast.anonymous), pkg: ast.pkg || null,
      enumVals: [], capEnv: null, isThrowable: false, inner: false
    };
    ci.top = outer ? outer.top : ci;
    ci.inner = !!outer && ast.kind === 'class' && !ast.mods.static && outer.kind !== 'interface' && !ast.anonymous;
    this.classes[ast.name] = ci; created.push(ci);
    for (const m of ast.methods) {
      const mr = Object.assign({}, m, { owner: ci });
      const list = ci.methods[m.name] || (ci.methods[m.name] = []);
      const sig = m.params.map(p => tstr(p.t)).join(',');
      if (list.some(o => o.params.map(p => tstr(p.t)).join(',') === sig)) throw new CompileError(`method ${m.name}(${sig}) is already defined in class ${ast.name}`, m.line);
      list.push(mr);
    }
    for (const c of ast.ctors) ci.ctors.push(Object.assign({}, c, { owner: ci }));
    for (const f of ast.fields) {
      if (ci.own[f.name]) throw new CompileError(`variable ${f.name} is already defined in class ${ast.name}`, f.line);
      const info = { name: f.name, type: f.type, mods: f.mods, owner: ci, static: !!f.mods.static, key: f.name };
      ci.own[f.name] = info;
      if (info.static) ci.statics[f.name] = { v: this.defVal(f.type), t: f.type, fin: !!f.mods.final };
    }
    if (ci.isEnum) {
      for (const c of ast.consts) {
        ci.own[c.name] = { name: c.name, type: { n: ast.name, d: 0 }, mods: { static: true, final: true, public: true }, owner: ci, static: true, key: c.name };
        ci.statics[c.name] = { v: null, t: null, fin: true };
        if (c.body) { c.body.name = ast.name + '$' + c.name; this.declare(c.body, ci, created); }
      }
    }
    for (const n of ast.nested) this.declare(n, ci, created);
    return ci;
  }
  link(ci) {
    const ast = ci.ast;
    if (ci.superName) {
      const s = this.classes[ci.superName];
      if (!s) { if (ci.superName !== 'Object') throw new CompileError(`cannot find symbol\n  symbol: class ${ci.superName}`, ast.line); }
      else {
        if (s.isInterface && !ast.anonymous) throw new CompileError('no interface expected here', ast.line);
        if (s.ast.mods.final && !ast.anonymous) throw new CompileError(`cannot inherit from final ${s.name}`, ast.line);
        if (s.isEnum && !ast.anonymous) throw new CompileError(`cannot inherit from final ${s.name}`, ast.line);
        ci.sup = s;
      }
    }
    for (const n of ci.ifaceNames) { const i = this.classes[n]; if (i) { if (!i.isInterface) throw new CompileError('interface expected here', ast.line); ci.ifaces.push(i); } }
    for (let c = ci.sup, k = 0; c; c = c.sup) { if (c === ci || ++k > 50) throw new CompileError(`cyclic inheritance involving ${ci.name}`, ast.line); }
    ci.isThrowable = ci.name === 'Throwable' || (ci.sup && ci.sup.isThrowable);
    // claves de campos (permite ocultar campos de la superclase)
    for (const f of Object.values(ci.own)) {
      if (f.static) continue;
      if (ci.sup && this.findFieldInfo(ci.sup, f.name) && !this.findFieldInfo(ci.sup, f.name).static) f.key = f.name + '@' + ci.name;
      ci.instFields.push(f);
    }
  }
  findFieldInfo(ci, name) {
    for (let c = ci; c; c = c.sup) {
      const f = c.own[name]; if (f) return f;
      for (const i of c.ifaces) { const g = this.findFieldInfo(i, name); if (g) return g; }
    }
    return null;
  }
  /* ---- comprobaciones estáticas (como haría javac) ---- */
  check(ci) {
    const ast = ci.ast;
    // métodos abstractos sin implementar
    if (!ci.abstract && !ci.isInterface && !(ci.isEnum && ast.consts.some(c => c.body))) {
      const abstracts = [], seen = new Set();
      const collect = c => {
        if (!c) return;
        for (const list of Object.values(c.methods)) for (const m of list) if (m.mods.abstract && !m.mods.static) abstracts.push(m);
        collect(c.sup); c.ifaces.forEach(collect);
      };
      collect(ci);
      for (const m of abstracts) {
        const key = m.name + '/' + m.params.length; if (seen.has(key)) continue; seen.add(key);
        const impl = this.collectMethods(ci, m.name).find(x => !x.mods.abstract && x.params.length === m.params.length && !x.mods.static);
        if (!impl) {
          if (ci.ifaceNames.some(n => !this.classes[n]) && false) continue;
          throw new CompileError(`${ci.name} is not abstract and does not override abstract method ${m.name}(${m.params.map(p => tstr(p.t)).join(',')}) in ${m.owner.name}`, ast.line);
        }
      }
    }
    for (const list of Object.values(ci.methods)) for (const m of list) {
      if (m.mods.override) {
        const found = (ci.sup && this.collectMethods(ci.sup, m.name).some(x => x.params.length === m.params.length)) ||
          ci.ifaces.some(i => this.collectMethods(i, m.name).some(x => x.params.length === m.params.length)) ||
          ['toString', 'equals', 'hashCode', 'clone', 'finalize'].includes(m.name) ||
          ci.ifaceNames.some(n => !this.classes[n]) || (ci.superName && !ci.sup && ci.superName !== 'Object') || ci.ast.anonymous;
        if (!found) throw new CompileError('method does not override or implement a method from a supertype', m.line - 0);
      }
      if (m.body && m.ret.n !== 'void' && this.canComplete(m.body)) throw new CompileError('missing return statement', m.endLine);
      if (!m.body && !m.mods.abstract && !m.mods.native) throw new CompileError('missing method body, or declare abstract', m.line);
      if (m.body && m.mods.abstract && ci.kind !== 'interface') throw new CompileError('abstract methods cannot have a body', m.line);
      if (m.mods.abstract && !ci.abstract && !ci.isEnum) throw new CompileError(`${ci.name} is not abstract and does not override abstract method ${m.name}(${m.params.map(p => tstr(p.t)).join(',')}) in ${ci.name}`, ast.line);
    }
    // constructor de la superclase sin argumentos
    if (ci.sup && !ci.sup.builtin && !ast.anonymous) {
      const sup = ci.sup, noArg = !sup.ctors.length || sup.ctors.some(c => c.params.length === 0 || (c.params.length === 1 && c.params[0].va));
      const need = (line) => {
        if (noArg) return;
        const c0 = sup.ctors[0];
        throw new CompileError(`constructor ${sup.name} in class ${sup.name} cannot be applied to given types;\n  required: ${c0.params.map(p => tstr(p.t)).join(',') || 'no arguments'}\n  found:    no arguments`, line);
      };
      if (!ci.ctors.length) need(ast.line);
      for (const c of ci.ctors) {
        const f = c.body.body[0];
        const explicit = f && f.k === 'expr' && f.e.k === 'ctorcall';
        if (!explicit) need(c.line);
      }
    }
    for (const c of ci.ctors) if (c.params.length !== c.params.length) void 0;
  }
  collectMethods(ci, name) {
    const out = [], seen = new Set();
    const visit = c => {
      if (!c) return;
      for (const m of c.methods[name] || []) { const k = m.params.map(p => tstr(p.t)).join(','); if (!seen.has(k)) { seen.add(k); out.push(m); } }
      visit(c.sup); c.ifaces.forEach(visit);
    };
    visit(ci); return out;
  }
  canComplete(s) {
    switch (s.k) {
      case 'return': case 'throw': return false;
      case 'block': return this.canCompleteList(s.body);
      case 'if': return s.b ? (this.canComplete(s.a) || this.canComplete(s.b)) : true;
      case 'while': return isTrueLit(s.c) ? this.hasBreak(s.body, true) : true;
      case 'do': return isTrueLit(s.c) ? this.hasBreak(s.body, true) : true;
      case 'for': return (!s.c || isTrueLit(s.c)) ? this.hasBreak(s.body, true) : true;
      case 'labeled': return this.canComplete(s.body) || this.hasBreak(s.body, false);
      case 'try': {
        if (s.fin && !this.canComplete(s.fin)) return false;
        return this.canComplete(s.block) || s.catches.some(c => this.canComplete(c.block));
      }
      case 'switch': {
        if (s.isExpr) return true;
        if (!s.cases.some(c => c.labels === null)) return true;
        if (s.cases.some(c => c.body && this.hasBreak(c.body, true))) return true;
        if (s.arrow) return s.cases.some(c => c.expr || (c.body && this.canComplete(c.body)));
        const last = s.cases[s.cases.length - 1];
        return this.canCompleteList(last.body);
      }
      default: return true;
    }
  }
  canCompleteList(list) { for (const st of list) if (!this.canComplete(st)) return false; return true; }
  hasBreak(s, top) {
    if (!s) return false;
    if (Array.isArray(s)) return s.some(x => this.hasBreak(x, top));
    switch (s.k) {
      case 'break': return !s.label || !top ? true : true;
      case 'block': return this.hasBreak(s.body, top);
      case 'if': return this.hasBreak(s.a, top) || this.hasBreak(s.b, top);
      case 'labeled': return this.hasBreak(s.body, top);
      case 'try': return this.hasBreak(s.block, top) || s.catches.some(c => this.hasBreak(c.block, top)) || this.hasBreak(s.fin, top);
      case 'while': case 'do': case 'for': case 'foreach': return this.hasLabeledBreak(s.body);
      case 'switch': return s.cases.some(c => this.hasLabeledBreak(c.body));
      default: return false;
    }
  }
  hasLabeledBreak(s) {
    if (!s) return false; if (Array.isArray(s)) return s.some(x => this.hasLabeledBreak(x));
    switch (s.k) {
      case 'break': return !!s.label; case 'block': return this.hasLabeledBreak(s.body); case 'if': return this.hasLabeledBreak(s.a) || this.hasLabeledBreak(s.b);
      case 'while': case 'do': case 'for': case 'foreach': case 'labeled': return this.hasLabeledBreak(s.body);
      case 'try': return this.hasLabeledBreak(s.block) || s.catches.some(c => this.hasLabeledBreak(c.block));
      default: return false;
    }
  }

  /* ================= valores y tipos ================= */
  defVal(t) {
    if (t.d > 0) return null;
    switch (t.n) {
      case 'int': case 'short': case 'byte': return 0; case 'long': return 0n; case 'double': case 'float': return new Dbl(0);
      case 'boolean': return false; case 'char': return new Chr(0); default: return null;
    }
  }
  bad(t, v) {
    const from = typeName(v), to = tstr(t);
    const num = ['int', 'short', 'byte', 'long', 'float', 'double', 'char'];
    if (num.includes(to) && ['double', 'long', 'float'].includes(from) && !(to === 'double' || to === 'float'))
      this.cerr(`incompatible types: possible lossy conversion from ${from} to ${to}`);
    this.cerr(`incompatible types: ${from} cannot be converted to ${to}`);
  }
  coerce(t, v) {
    if (!t || v === undefined) return v;
    if (t.d > 0) { if (v === null || v instanceof JArray) return v; this.bad(t, v); }
    switch (t.n) {
      case 'int': case 'short': case 'byte': if (typeof v === 'number') return v; if (v instanceof Chr) return v.c; return this.bad(t, v);
      case 'long': if (typeof v === 'bigint') return v; if (typeof v === 'number') return BigInt(v); if (v instanceof Chr) return BigInt(v.c); return this.bad(t, v);
      case 'double': case 'float':
        if (v instanceof Dbl) return v; if (typeof v === 'number') return new Dbl(v); if (typeof v === 'bigint') return new Dbl(Number(v)); if (v instanceof Chr) return new Dbl(v.c); return this.bad(t, v);
      case 'char': if (v instanceof Chr) return v; if (typeof v === 'number') return new Chr(v & 0xFFFF); return this.bad(t, v);
      case 'boolean': if (typeof v === 'boolean') return v; return this.bad(t, v);
      case 'String': if (typeof v === 'string' || v === null) return v; return this.bad(t, v);
      case 'Integer': if (typeof v === 'number' || v === null) return v; if (v instanceof Chr) return v.c; return this.bad(t, v);
      case 'Double': if (v instanceof Dbl || v === null) return v; return this.bad(t, v);
      case 'Long': if (typeof v === 'bigint' || v === null) return v; return this.bad(t, v);
      case 'Character': if (v instanceof Chr || v === null) return v; return this.bad(t, v);
      case 'Boolean': if (typeof v === 'boolean' || v === null) return v; return this.bad(t, v);
      default: {
        if (v === null) return v;
        const ci = this.classes[t.n];
        if (ci && !(ci.name === 'Object')) { if (!(v instanceof JObject)) { if (v instanceof JLambda && ci.isInterface) return v; this.bad(t, v); } if (!this.isSub(v.cls, t.n)) this.bad(t, v); }
        return v;
      }
    }
  }
  isSub(ci, name) {
    for (let c = ci; c; c = c.sup) {
      if (c.name === name) return true;
      if (c.ifaceNames.includes(name)) return true;
      for (const i of c.ifaces) if (this.isSub(i, name)) return true;
    }
    return name === 'Object';
  }
  instanceOf(v, name) {
    if (v === null || v === undefined) return false;
    if (name === 'Object') return true;
    if (v instanceof JObject) return this.isSub(v.cls, name);
    if (typeof v === 'string') return ['String', 'CharSequence', 'Comparable'].includes(name);
    if (typeof v === 'number') return ['Integer', 'Number', 'Comparable'].includes(name);
    if (v instanceof Dbl) return ['Double', 'Number', 'Comparable'].includes(name);
    if (typeof v === 'bigint') return ['Long', 'Number', 'Comparable'].includes(name);
    if (v instanceof Chr) return ['Character', 'Comparable'].includes(name);
    if (typeof v === 'boolean') return ['Boolean', 'Comparable'].includes(name);
    if (v instanceof JLambda || v instanceof JMRef) return !this.classes[name] || this.classes[name].isInterface;
    if (v.types) return v.types.includes(name);
    return false;
  }
  castTo(t, v) {
    if (t.d === 0 && PRIMS.has(t.n)) {
      if (t.n === 'boolean') { if (typeof v !== 'boolean') this.cerr(`incompatible types: ${typeName(v)} cannot be converted to boolean`); return v; }
      return JV.castPrim(t.n, v);
    }
    if (v === null || t.d > 0) return v;
    if (['Integer', 'Double', 'String', 'Long', 'Character', 'Boolean', 'Number'].includes(t.n) || this.classes[t.n]) {
      if (!this.instanceOf(v, t.n)) {
        const from = v instanceof JObject ? v.cls.name : v instanceof Dbl ? 'java.lang.Double' : typeof v === 'string' ? 'java.lang.String' : typeof v === 'number' ? 'java.lang.Integer' : typeName(v);
        const to = this.classes[t.n] ? t.n : 'java.lang.' + t.n;
        this.throwJ('ClassCastException', `class ${from} cannot be cast to class ${to}`);
      }
    }
    return v;
  }

  /* ================= excepciones ================= */
  throwJ(name, msg) {
    const ci = this.classes[name]; const o = new JObject(ci);
    o.f.message = msg === undefined ? null : msg; o.f.cause = null; o.line = this.curLine;
    throw new JavaThrow(o);
  }
  asJavaThrow(e) {
    if (e instanceof JavaThrow) return e;
    if (e instanceof RangeError) { try { this.throwJ('StackOverflowError', null); } catch (x) { return x; } }
    return null;
  }
  npe(node, name) {
    let d = 'value';
    if (node && node.o) { if (node.o.k === 'name') d = `"${node.o.n}"`; else if (node.o.k === 'call') d = `the return value of "${node.o.n}()"`; else if (node.o.k === 'field') d = `"${node.o.n}"`; }
    this.throwJ('NullPointerException', `Cannot invoke "${name}()" because ${d} is null`);
  }

  /* ================= conversión a texto, igualdad, hash ================= */
  str(v) {
    if (v === null || v === undefined) return 'null';
    switch (typeof v) {
      case 'string': return v; case 'number': return String(v); case 'boolean': return String(v); case 'bigint': return v.toString();
    }
    if (v instanceof Dbl) return JV.dblStr(v.v);
    if (v instanceof Chr) return String.fromCharCode(v.c);
    if (v instanceof JObject) return this.objStr(v);
    if (v instanceof JArray) {
      const code = { int: 'I', double: 'D', char: 'C', boolean: 'Z', long: 'J', byte: 'B', short: 'S', float: 'F' };
      const e = v.et; const pre = '['.repeat(e.d + 1) + (e.d === 0 && code[e.n] ? code[e.n] : 'L' + (e.n === 'String' ? 'java.lang.String' : e.n) + ';');
      return pre + '@' + ((v.id * 2654435761) >>> 0).toString(16).slice(0, 8);
    }
    if (v instanceof JLambda || v instanceof JMRef) return 'Main$$Lambda@' + ((v.id * 2654435761) >>> 0).toString(16);
    if (v.toJavaString) return v.toJavaString(this);
    return String(v);
  }
  objStr(o) {
    const r = this.findMethod(o.cls, 'toString', []);
    if (r && r.m.body) return this.str(this.invoke(r.m.owner, r.m, o, r.args));
    if (o.f.__name !== undefined) return o.f.__name;
    if (o.cls.isRecord) return o.cls.name + '[' + o.cls.ast.recordComps.map(c => c.n + '=' + this.str(o.f[c.n])).join(', ') + ']';
    return this.qname(o.cls) + '@' + ((o.id * 2654435761) >>> 0).toString(16).slice(0, 8);
  }
  qname(ci) { return ci.pkg ? ci.pkg + '.' + ci.name : ci.name; }
  jequals(a, b) {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return false;
    if (typeof a === 'number') return false;
    if (a instanceof Dbl) return b instanceof Dbl && (a.v === b.v || (Number.isNaN(a.v) && Number.isNaN(b.v)));
    if (a instanceof Chr) return b instanceof Chr && a.c === b.c;
    if (typeof a !== 'object') return false;
    if (a instanceof JObject) {
      const r = this.findMethod(a.cls, 'equals', [b]);
      if (r && r.m.body) return this.invoke(r.m.owner, r.m, a, r.args) === true;
      if (a.cls.isRecord && b instanceof JObject && b.cls === a.cls) return a.cls.ast.recordComps.every(c => this.jequals(a.f[c.n], b.f[c.n]));
      return false;
    }
    if (a instanceof JList) return b instanceof JList && a.a.length === b.a.length && a.a.every((x, i) => this.jequals(x, b.a[i]));
    if (a instanceof JSet) return b instanceof JSet && a.map.n === b.map.n && a.items(this).every(x => !!b.map.find(this, x));
    if (a instanceof JMap) return b instanceof JMap && a.n === b.n && a.entries(this).every(e => { const o = b.find(this, e.k); return o && this.jequals(e.v, o.v); });
    if (a.e && b.e) return this.jequals(a.e.k, b.e.k) && this.jequals(a.e.v, b.e.v);
    return false;
  }
  jhash(v) {
    if (v === null || v === undefined) return 0;
    switch (typeof v) {
      case 'number': return v; case 'string': return JV.hashString(v); case 'boolean': return v ? 1231 : 1237;
      case 'bigint': return Number(BigInt.asIntN(32, v ^ (v >> 32n)));
    }
    if (v instanceof Dbl) return JV.hashDouble(v.v);
    if (v instanceof Chr) return v.c;
    if (v instanceof JObject) {
      const r = this.findMethod(v.cls, 'hashCode', []);
      if (r && r.m.body) return this.invoke(r.m.owner, r.m, v, r.args) | 0;
      if (v.cls.isRecord) { let h = 0; for (const c of v.cls.ast.recordComps) h = (Math.imul(31, h) + this.jhash(v.f[c.n])) | 0; return h; }
      return (Math.imul(v.id, 0x9E3779B1) >>> 1) | 0;
    }
    if (v instanceof JList) { let h = 1; for (const x of v.a) h = (Math.imul(31, h) + this.jhash(x)) | 0; return h; }
    if (v instanceof JSet) { let h = 0; for (const x of v.items(this)) h = (h + this.jhash(x)) | 0; return h; }
    if (v instanceof JMap) { let h = 0; for (const e of v.entries(this)) h = (h + (this.jhash(e.k) ^ this.jhash(e.v))) | 0; return h; }
    return (Math.imul(v.id || 1, 0x9E3779B1) >>> 1) | 0;
  }
  keyId(k) {
    if (k === null) return 'n';
    switch (typeof k) { case 'string': return 's' + k; case 'number': return 'i' + k; case 'boolean': return 'b' + k; case 'bigint': return 'l' + k; }
    if (k instanceof Dbl) return 'd' + k.v; if (k instanceof Chr) return 'c' + k.c;
    if (k instanceof JObject) { const r = this.findMethod(k.cls, 'hashCode', []); return (r && r.m.body) || k.cls.isRecord ? 'h' + this.jhash(k) : 'o' + k.id; }
    if (k instanceof JList || k instanceof JSet || k instanceof JMap) return 'h' + this.jhash(k);
    return 'o' + (k.id || 0);
  }
  compareNatural(a, b) {
    if (a === null || b === null) this.throwJ('NullPointerException', null);
    if (typeof a === 'string' && typeof b === 'string') return JV.cmpStr(a, b);
    if (a instanceof Chr && b instanceof Chr) return a.c - b.c;
    if (kindOf(a) && kindOf(b)) { const x = a instanceof Dbl ? a.v : a instanceof Chr ? a.c : a, y = b instanceof Dbl ? b.v : b instanceof Chr ? b.c : b; return x < y ? -1 : x > y ? 1 : 0; }
    if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1;
    if (a instanceof JObject) {
      const r = this.findMethod(a.cls, 'compareTo', [b]);
      if (r && r.m.body) return this.invoke(r.m.owner, r.m, a, r.args);
      if (a.f.__ord !== undefined && b.f) return a.f.__ord - b.f.__ord;
      this.throwJ('ClassCastException', `class ${this.qname(a.cls)} cannot be cast to class java.lang.Comparable`);
    }
    this.throwJ('ClassCastException', `class ${typeName(a)} cannot be cast to class java.lang.Comparable`);
  }
  cmpFn(f) {
    if (f === null || f === undefined) return (a, b) => this.compareNatural(a, b);
    if (f instanceof JComparator) return f.fn;
    return (a, b) => this.callFn(f, [a, b], 'compare');
  }
  toArray(x) {
    if (x === null) this.throwJ('NullPointerException', null);
    if (x instanceof JArray || x instanceof JList || x instanceof JV.JPQ) return x.a;
    if (x instanceof JSet) return x.items(this);
    if (x instanceof JMap) return x.entries(this).map(e => new JV.JEntry(e));
    this.cerr('incompatible types: ' + typeName(x) + ' cannot be converted to Collection');
  }
  *iter(x) {
    if (x instanceof JArray) { for (let i = 0; i < x.a.length; i++) yield x.a[i]; return; }
    if (x instanceof JList) {
      let i = 0; const exp = x.mod;
      while (i !== x.a.length) { if (x.mod !== exp) this.throwJ('ConcurrentModificationException', null); yield x.a[i++]; }
      return;
    }
    if (x instanceof JSet) { const exp = x.mod; for (const v of x.items(this)) { if (x.mod !== exp) this.throwJ('ConcurrentModificationException', null); yield v; } return; }
    if (x instanceof JV.JPQ) { for (const v of x.a.slice()) yield v; return; }
    if (x instanceof JObject) {
      const it = this.callMethod(x, 'iterator', [], null);
      while (this.callMethod(it, 'hasNext', [], null)) yield this.callMethod(it, 'next', [], null);
      return;
    }
    this.cerr('for-each not applicable to expression type\n  required: array or java.lang.Iterable\n  found:    ' + typeName(x));
  }

  /* ================= clases: init, instancias, constructores ================= */
  ensureInit(ci) {
    if (ci.initState) return; ci.initState = 1;
    if (ci.sup) this.ensureInit(ci.sup);
    const env = new Env(null); env.ctx = { self: null, cls: ci, ctor: true }; env.method = true;
    if (ci.isEnum) {
      ci.ast.consts.forEach((c, i) => {
        const k = c.body ? this.classes[c.body.name] : ci; this.curLine = c.line;
        const o = new JObject(k); this.initFields(k, o); o.f.__name = c.name; o.f.__ord = i;
        this.construct(k, o, c.args.map(a => this.eval(a, env)));
        ci.statics[c.name].v = o; ci.enumVals.push(o);
      });
    }
    for (const it of ci.ast.staticInit) {
      if (it.k === 'field') { if (it.f.init) { this.curLine = it.f.line; ci.statics[it.f.name].v = this.coerce(it.f.type, this.evalInit(it.f.init, it.f.type, env)); } }
      else this.execBlock(it.block.body, new Env(env));
    }
    ci.initState = 2;
  }
  initFields(ci, o) {
    const chain = []; for (let c = ci; c; c = c.sup) chain.push(c);
    for (const c of chain) for (const f of c.instFields) o.f[f.key] = this.defVal(f.type);
  }
  instantiate(ci, args, env, node, cap) {
    if (ci.abstract) this.cerr(`${ci.name} is abstract; cannot be instantiated`, node && node.line);
    if (ci.isEnum) this.cerr('enum classes may not be instantiated', node && node.line);
    this.ensureInit(ci);
    const o = new JObject(ci);
    if (ci.isThrowable) o.line = this.curLine;
    this.initFields(ci, o);
    if (cap) o.cap = cap; else if (ci.capEnv) o.cap = ci.capEnv;
    if (ci.inner && env && env.ctx.self) {
      let s = env.ctx.self; while (s && !this.isSub(s.cls, ci.outer.name)) s = s.outerThis;
      if (s) o.outerThis = s;
    }
    this.construct(ci, o, args, node);
    return o;
  }
  construct(ci, o, args, node) {
    if (!ci.ctors.length) {
      if (ci.inherit && ci.sup) { this.construct(ci.sup, o, args, node); this.runFieldInits(ci, o); return; }
      if (args.length && !ci.inherit) this.cerr(`constructor ${ci.name} in class ${ci.name} cannot be applied to given types;\n  required: no arguments\n  found:    ${args.map(typeName).join(',')}`, node && node.line);
      if (ci.sup) this.construct(ci.sup, o, [], node);
      this.runFieldInits(ci, o); return;
    }
    const r = this.pickOverload(ci.ctors, args);
    if (!r) {
      const c0 = ci.ctors[0];
      this.cerr(`constructor ${ci.name} in class ${ci.name} cannot be applied to given types;\n  required: ${c0.params.map(p => tstr(p.t)).join(',') || 'no arguments'}\n  found:    ${args.map(typeName).join(',') || 'no arguments'}`, node && node.line);
    }
    if (r.m.mods.private && node && node.ctxTop && node.ctxTop !== ci.top) this.cerr(`${ci.name}(${r.m.params.map(p => tstr(p.t)).join(',')}) has private access in ${ci.name}`, node.line);
    this.runCtor(ci, o, r.m, r.args);
  }
  runFieldInits(ci, o) {
    const env = new Env(null); env.method = true; env.ctx = { self: o, cls: ci, ctor: true };
    if (o.cap) env.parent = o.cap;
    for (const it of ci.ast.instInit) {
      if (it.k === 'field') { if (it.f.init) { this.curLine = it.f.line; o.f[ci.own[it.f.name].key] = this.coerce(it.f.type, this.evalInit(it.f.init, it.f.type, env)); } }
      else this.execBlock(it.block.body, new Env(env));
    }
  }
  runCtor(ci, o, m, args) {
    if (this.depth >= MAXDEPTH) this.throwJ('StackOverflowError', null);
    this.depth++;
    try {
      const env = this.newMethodEnv(ci, o, m, args); env.ctx.ctor = true;
      const stmts = m.body.body; let i = 0; const first = stmts[0];
      if (first && first.k === 'expr' && first.e.k === 'ctorcall') {
        i = 1; const cc = first.e; this.curLine = first.line;
        const a = cc.args.map(x => this.eval(x, env));
        if (cc.which === 'this') this.construct(ci, o, a, cc);
        else { if (ci.sup) this.construct(ci.sup, o, a, cc); else if (a.length) this.cerr('constructor Object in class Object cannot be applied to given types;', cc.line); this.runFieldInits(ci, o); }
      } else { if (ci.sup) this.construct(ci.sup, o, [], null); this.runFieldInits(ci, o); }
      for (; i < stmts.length; i++) { const r = this.exec(stmts[i], env); if (r) break; }
    } finally { this.depth--; }
  }
  newMethodEnv(ci, self, m, args) {
    const env = new Env(null); env.method = true; env.ctx = { self, cls: ci, ctor: false };
    if (self && self.cap) env.parent = self.cap; else if (ci.capEnv) env.parent = ci.capEnv;
    const ps = m.params;
    for (let i = 0; i < ps.length; i++) env.vars[ps[i].n] = { v: this.coerce(ps[i].t, args[i]), t: ps[i].t, fin: false };
    return env;
  }
  invoke(ci, m, self, args) {
    if (!m.body) this.cerr(`abstract method ${m.name}() cannot be called directly`);
    if (this.depth >= MAXDEPTH) this.throwJ('StackOverflowError', null);
    this.depth++;
    const savedLine = this.curLine;
    try {
      const env = this.newMethodEnv(ci, self, m, args);
      const r = this.execBlock(m.body.body, env);
      this.curLine = savedLine;
      if (m.ret.n === 'void' && m.ret.d === 0) return undefined;
      if (r && r.t === 'r') return this.coerce(m.ret, r.v);
      return undefined;
    } finally { this.depth--; }
  }

  /* ================= resolución de métodos ================= */
  matchOne(t, v) {
    if (t.d > 0) { if (v === null) return 2; if (v instanceof JArray) return (v.et.d === t.d - 1 && v.et.n === t.n) ? 4 : (v.et.d === t.d - 1 && (PRIMS.has(t.n) || PRIMS.has(v.et.n))) ? -1 : 3; return -1; }
    switch (t.n) {
      case 'int': case 'short': case 'byte': return typeof v === 'number' ? 3 : v instanceof Chr ? 2 : -1;
      case 'long': return typeof v === 'bigint' ? 3 : typeof v === 'number' ? 2 : v instanceof Chr ? 1 : -1;
      case 'double': case 'float': return v instanceof Dbl ? 3 : (typeof v === 'bigint' || typeof v === 'number') ? 2 : v instanceof Chr ? 1 : -1;
      case 'boolean': return typeof v === 'boolean' ? 3 : -1;
      case 'char': return v instanceof Chr ? 3 : -1;
      case 'String': return typeof v === 'string' ? 3 : v === null ? 2 : -1;
      case 'Integer': return typeof v === 'number' ? 2 : v === null ? 1 : -1;
      case 'Double': return v instanceof Dbl ? 2 : v === null ? 1 : -1;
      case 'Long': return typeof v === 'bigint' ? 2 : v === null ? 1 : -1;
      case 'Character': return v instanceof Chr ? 2 : v === null ? 1 : -1;
      case 'Boolean': return typeof v === 'boolean' ? 2 : v === null ? 1 : -1;
      case 'Object': return 1;
      default: {
        if (v === null) return 2;
        const ci = this.classes[t.n];
        if (ci) { if (v instanceof JObject) return this.isSub(v.cls, t.n) ? (v.cls === ci ? 3 : 2.5) : -1; if (v instanceof JLambda && ci.isInterface) return 2; return -1; }
        if (JV.KNOWN_STD.has(t.n)) return this.instanceOf(v, t.n) ? 3 : -1;
        if (t.n === 'Number') return (kindOf(v) && !(v instanceof Chr)) ? 2 : -1;
        return 1;
      }
    }
  }
  applicable(m, args) {
    const ps = m.params, n = ps.length, va = n > 0 && ps[n - 1].va;
    if (!va || (args.length === n && args[n - 1] instanceof JArray && this.matchOne(ps[n - 1].t, args[n - 1]) >= 0)) {
      if (args.length !== n) return null;
      let tot = va ? 0 : 0.5;
      for (let i = 0; i < n; i++) { const s = this.matchOne(ps[i].t, args[i]); if (s < 0) return null; tot += s; }
      return { m, args, score: tot };
    }
    if (args.length < n - 1) return null;
    let tot = 0;
    for (let i = 0; i < n - 1; i++) { const s = this.matchOne(ps[i].t, args[i]); if (s < 0) return null; tot += s; }
    const et = { n: ps[n - 1].t.n, d: ps[n - 1].t.d - 1 };
    const rest = [];
    for (let i = n - 1; i < args.length; i++) { const s = this.matchOne(et, args[i]); if (s < 0) return null; tot += s; rest.push(this.coerce(et, args[i])); }
    return { m, args: args.slice(0, n - 1).concat([new JArray(et, rest)]), score: tot - 1 };
  }
  pickOverload(list, args) {
    let best = null;
    for (const m of list) { const r = this.applicable(m, args); if (r && (!best || r.score > best.score)) best = r; }
    return best;
  }
  findMethod(ci, name, args) { return this.pickOverload(this.collectMethods(ci, name), args); }
  methodNotFound(name, args, where, node) {
    this.cerr(`cannot find symbol\n  symbol:   method ${name}(${args.map(typeName).join(',')})\n  location: ${where}`, node && node.line);
  }
  checkPrivate(owner, mods, what, env, node) {
    if (mods && mods.private && env && env.ctx && env.ctx.cls.top !== owner.top) this.cerr(`${what} has private access in ${owner.name}`, node && node.line);
  }
  callObj(obj, name, args, env, node) {
    const r = this.findMethod(obj.cls, name, args);
    if (r && (r.m.body || !r.m.mods.abstract)) {
      this.checkPrivate(r.m.owner, r.m.mods, `${name}(${r.m.params.map(p => tstr(p.t)).join(',')})`, env, node);
      return this.invoke(r.m.owner, r.m, r.m.mods.static ? null : obj, r.args);
    }
    switch (name) {
      case 'toString': return this.objStr(obj);
      case 'equals': return this.jequals(obj, args[0]);
      case 'hashCode': return this.jhash(obj);
      case 'getClass': return new JClassRef(obj.cls.name, this.qname(obj.cls));
      case 'name': if (obj.f.__name !== undefined) return obj.f.__name; break;
      case 'ordinal': if (obj.f.__ord !== undefined) return obj.f.__ord; break;
      case 'compareTo': if (obj.f.__ord !== undefined) return obj.f.__ord - args[0].f.__ord; break;
      case 'getDeclaringClass': return new JClassRef(obj.cls.name);
    }
    this.methodNotFound(name, args, 'class ' + obj.cls.name, node);
  }
  callMethod(t, name, args, node, env) {
    if (t === null || t === undefined) this.npe(node, name);
    if (typeof t === 'string') return JV.stringMethod(t, name, args, this);
    if (t instanceof JObject) return this.callObj(t, name, args, env, node);
    if (t instanceof JArray) {
      switch (name) {
        case 'clone': return new JArray(t.et, t.a.slice()); case 'equals': return t === args[0]; case 'hashCode': return this.jhash(t);
        case 'toString': return this.str(t); case 'getClass': return new JClassRef(typeName(t));
        case 'length': this.cerr('cannot find symbol\n  symbol:   method length()\n  location: class ' + typeName(t), node && node.line);
      }
      this.methodNotFound(name, args, 'class ' + typeName(t), node);
    }
    if (t instanceof JLambda || t instanceof JMRef) {
      if (name === 'reversed') return new JComparator((a, b) => -this.callFn(t, [a, b], 'compare'));
      if (name === 'thenComparing') { const o = this.cmpFn(args[0]); return new JComparator((a, b) => this.callFn(t, [a, b], 'compare') || o(a, b)); }
      if (name === 'equals') return t === args[0];
      if (name === 'andThen' && args.length === 1) return new JMRef(null, false, null) && ((f, g) => new JNative('Function', { apply: (a, I) => I.callFn(g, [I.callFn(f, a, 'apply')], 'apply') }))(t, args[0]);
      return this.callFn(t, args, name);
    }
    if (typeof t.invoke === 'function') return t.invoke(name, args, this, node);
    return JV.boxedMethod(t, name, args, this);
  }
  callFn(f, args, hint) {
    if (f === null || f === undefined) this.throwJ('NullPointerException', null);
    if (f instanceof JLambda) {
      if (this.depth >= MAXDEPTH) this.throwJ('StackOverflowError', null);
      this.depth++;
      try {
        const env = new Env(f.env); env.ctx = f.env.ctx;
        f.params.forEach((p, i) => { env.vars[p] = { v: args[i], t: null, fin: false }; });
        if (f.body.k === 'block') { const r = this.execBlock(f.body.body, env); return r && r.t === 'r' ? r.v : undefined; }
        return this.eval(f.body, env);
      } finally { this.depth--; }
    }
    if (f instanceof JMRef) {
      if (f.isClass) {
        const ci = this.classes[f.target];
        if (f.name === 'new') { if (ci) return this.instantiate(ci, args, null, null); const nf = NEW[f.target]; if (nf) return nf(args, this); }
        if (ci) { const r = this.findMethod(ci, f.name, args); if (r && r.m.mods.static) return this.invoke(r.m.owner, r.m, null, r.args); }
        else if (STATICS[f.target] && STATICS[f.target][f.name] && typeof STATICS[f.target][f.name] === 'function') {
          try { return STATICS[f.target][f.name](args, this); } catch (e) { if (!(e instanceof CompileError) || !args.length) throw e; }
        }
        if (args.length) return this.callMethod(args[0], f.name, args.slice(1), null, null);
        this.cerr('invalid method reference: ' + f.target + '::' + f.name);
      }
      return this.callMethod(f.target, f.name, args, null, null);
    }
    if (f instanceof JComparator) return f.fn(args[0], args[1]);
    if (f instanceof JObject) {
      let r = hint && this.findMethod(f.cls, hint, args);
      if (!r || !r.m.body) {
        for (let c = f.cls; c && !r; c = c.sup) for (const list of Object.values(c.methods)) for (const m of list) if (!r && !m.mods.static && m.body) { const a = this.applicable(m, args); if (a) r = a; }
      }
      if (r) return this.invoke(r.m.owner, r.m, f, r.args);
      this.cerr('no se puede usar el objeto como función');
    }
    if (f.invoke) return f.invoke(hint, args, this);
    this.cerr('not a functional interface');
  }

  /* ================= variables ================= */
  findCell(name, env) { for (let e = env; e; e = e.parent) { const c = e.vars[name]; if (c !== undefined) return c; } return null; }
  member(name, env, node, forWrite) {
    const ctx = env.ctx;
    for (let c = ctx.cls, self = ctx.self; c; c = c.outer, self = self && self.outerThis) {
      const f = this.findFieldInfo(c, name);
      if (f) {
        if (f.static) { this.ensureInit(f.owner); return { h: f.owner.statics[name], k: 'v', t: f.type, fin: f.mods.final && forWrite && !ctx.ctor, name }; }
        if (self) return { h: self.f, k: f.key, t: f.type, fin: f.mods.final && forWrite && !ctx.ctor, name };
        if (c === ctx.cls) this.cerr(`non-static variable ${name} cannot be referenced from a static context`, node && node.line);
      }
    }
    if (Object.prototype.hasOwnProperty.call(this.globals, name)) return { h: this.globals, k: name, t: null, fin: false, name };
    return null;
  }
  getVar(name, env, node) {
    const c = this.findCell(name, env);
    if (c) { if (c.v === UNSET) this.cerr(`variable ${name} might not have been initialized`, node.line); return c.v; }
    const m = this.member(name, env, node, false);
    if (m) return m.h[m.k];
    this.cerr(`cannot find symbol\n  symbol:   variable ${name}\n  location: class ${env.ctx.cls.name}`, node.line);
  }
  isVar(name, env) { return !!(this.findCell(name, env) || this.member(name, env, null, false)); }
  declareLocal(env, name, t, v, fin, line) {
    for (let e = env; e; e = e.parent) {
      if (e.vars[name] !== undefined) this.cerr(`variable ${name} is already defined in method ${''}`.replace(' in method ', ' in this scope').replace(' ', ' '), line);
      if (e.method) break;
    }
    env.vars[name] = { v, t, fin: !!fin };
  }
  classRef(node, env) {
    if (node.k === 'name') {
      if (this.isVar(node.n, env)) return null;
      if (this.classes[node.n]) return { ci: this.classes[node.n] };
      if (STATICS[node.n] || NEW[node.n]) return { st: STATICS[node.n] || {}, name: node.n };
      return null;
    }
    if (node.k === 'field' && node.o.k === 'name' && this.classes[node.n] && !this.isVar(node.o.n, env) && (this.classes[node.o.n] || STATICS[node.o.n])) return { ci: this.classes[node.n] };
    if (node.k === 'field') { // nombres cualificados: java.util.Arrays
      let r = node; while (r.k === 'field') r = r.o;
      if (r.k === 'name' && (r.n === 'java' || r.n === 'javax') && !this.isVar(r.n, env)) return this.classRef({ k: 'name', n: node.n, line: node.line }, env);
    }
    if (node.k === 'field' && node.o.k === 'name' && this.classes[node.o.n] && this.classes[node.n]) return { ci: this.classes[node.n] };
    return null;
  }
  ref(n, env) {
    switch (n.k) {
      case 'name': {
        const c = this.findCell(n.n, env);
        if (c) return { h: c, k: 'v', t: c.t, fin: c.fin && c.v !== UNSET, name: n.n, cell: c };
        const m = this.member(n.n, env, n, true);
        if (m) return m;
        this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}\n  location: class ${env.ctx.cls.name}`, n.line);
        break;
      }
      case 'field': {
        const cr = this.classRef(n.o, env);
        if (cr) {
          if (cr.ci) { const f = this.findFieldInfo(cr.ci, n.n); if (!f || !f.static) this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}\n  location: class ${cr.ci.name}`, n.line); this.ensureInit(f.owner); this.checkPrivate(f.owner, f.mods, n.n, env, n); return { h: f.owner.statics[n.n], k: 'v', t: f.type, fin: f.mods.final && !env.ctx.ctor, name: n.n }; }
          this.cerr('cannot assign a value to final variable ' + n.n, n.line);
        }
        const obj = this.eval(n.o, env);
        if (obj === null) this.throwJ('NullPointerException', `Cannot assign field "${n.n}" because ${n.o.k === 'name' ? '"' + n.o.n + '"' : 'value'} is null`);
        if (obj instanceof JArray && n.n === 'length') this.cerr('cannot assign a value to final variable length', n.line);
        if (obj instanceof JObject) {
          const f = this.findFieldInfo(n.o.k === 'this' ? env.ctx.cls : obj.cls, n.n) || this.findFieldInfo(obj.cls, n.n);
          if (!f) this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}`, n.line);
          this.checkPrivate(f.owner, f.mods, n.n, env, n);
          if (f.static) return { h: f.owner.statics[n.n], k: 'v', t: f.type, fin: f.mods.final && !env.ctx.ctor, name: n.n };
          return { h: obj.f, k: f.key, t: f.type, fin: f.mods.final && !env.ctx.ctor, name: n.n };
        }
        this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}`, n.line);
        break;
      }
      case 'index': {
        const a = this.eval(n.a, env); let i = this.eval(n.i, env);
        if (a === null) this.throwJ('NullPointerException', `Cannot store to array because ${n.a.k === 'name' ? '"' + n.a.n + '"' : 'value'} is null`);
        if (!(a instanceof JArray)) this.cerr('array required, but ' + typeName(a) + ' found', n.line);
        if (i instanceof Chr) i = i.c;
        if (typeof i !== 'number') this.cerr(`incompatible types: possible lossy conversion from ${typeName(i)} to int`, n.line);
        if (i < 0 || i >= a.a.length) this.throwJ('ArrayIndexOutOfBoundsException', `Index ${i} out of bounds for length ${a.a.length}`);
        return { h: a.a, k: i, t: a.et, fin: false };
      }
    }
    this.cerr('unexpected type\n  required: variable\n  found:    value', n.line);
  }
  setRef(r, v) {
    if (r.fin) this.cerr(`cannot assign a value to final variable ${r.name}`);
    const nv = this.coerce(r.t, v); r.h[r.k] = nv; return nv;
  }
  readRef(r, n) {
    const v = r.h[r.k];
    if (v === UNSET) this.cerr(`variable ${n.n} might not have been initialized`, n.line);
    return v;
  }

  /* ================= operadores ================= */
  badOp(op, a, b, line) { this.cerr(`bad operand types for binary operator '${op}'\n  first type:  ${typeName(a)}\n  second type: ${typeName(b)}`, line); }
  bin(op, a, b, line) {
    if (op === '+' && (typeof a === 'string' || typeof b === 'string')) return this.str(a) + this.str(b);
    if (op === '==' || op === '!=') { const r = this.eq(a, b, line); return op === '==' ? r : !r; }
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      switch (op) { case '&': return a && b; case '|': return a || b; case '^': return a !== b; }
      this.badOp(op, a, b, line);
    }
    const ka = kindOf(a), kb = kindOf(b);
    if (!ka || !kb) this.badOp(op, a, b, line);
    const k = Math.max(ka, kb);
    switch (op) {
      case '<': return toN(a) < toN(b); case '>': return toN(a) > toN(b); case '<=': return toN(a) <= toN(b); case '>=': return toN(a) >= toN(b);
    }
    if (op === '<<' || op === '>>' || op === '>>>') {
      if (ka === 3 || kb === 3) this.badOp(op, a, b, line);
      const sh = Number(typeof b === 'bigint' ? b : toN(b));
      if (ka === 2) { const x = a; return op === '<<' ? BigInt.asIntN(64, x << BigInt(sh & 63)) : op === '>>' ? x >> BigInt(sh & 63) : BigInt.asIntN(64, BigInt.asUintN(64, x) >> BigInt(sh & 63)); }
      const x = toN(a); return op === '<<' ? x << sh : op === '>>' ? x >> sh : (x >>> sh) | 0;
    }
    if (k === 3) {
      const x = toN(a), y = toN(b);
      switch (op) {
        case '+': return new Dbl(x + y); case '-': return new Dbl(x - y); case '*': return new Dbl(x * y);
        case '/': return new Dbl(x / y); case '%': return new Dbl(x % y);
      }
      this.badOp(op, a, b, line);
    }
    if (k === 2) {
      const x = BigInt(typeof a === 'bigint' ? a : toN(a)), y = BigInt(typeof b === 'bigint' ? b : toN(b));
      switch (op) {
        case '+': return BigInt.asIntN(64, x + y); case '-': return BigInt.asIntN(64, x - y); case '*': return BigInt.asIntN(64, x * y);
        case '/': if (y === 0n) this.throwJ('ArithmeticException', '/ by zero'); return BigInt.asIntN(64, x / y);
        case '%': if (y === 0n) this.throwJ('ArithmeticException', '/ by zero'); return x % y;
        case '&': return x & y; case '|': return x | y; case '^': return x ^ y;
      }
      this.badOp(op, a, b, line);
    }
    const x = toN(a), y = toN(b);
    switch (op) {
      case '+': return (x + y) | 0; case '-': return (x - y) | 0; case '*': return Math.imul(x, y);
      case '/': if (y === 0) this.throwJ('ArithmeticException', '/ by zero'); return (x / y) | 0;
      case '%': if (y === 0) this.throwJ('ArithmeticException', '/ by zero'); return (x % y) | 0;
      case '&': return x & y; case '|': return x | y; case '^': return x ^ y;
    }
    this.badOp(op, a, b, line);
  }
  eq(a, b, line) {
    if (a === b) return true;
    const ka = kindOf(a), kb = kindOf(b);
    if (ka && kb) return (typeof a === 'bigint' || typeof b === 'bigint') && ka !== 3 && kb !== 3 ? BigInt(typeof a === 'bigint' ? a : toN(a)) === BigInt(typeof b === 'bigint' ? b : toN(b)) : toN(a) === toN(b);
    if ((ka && (typeof b === 'boolean' || typeof b === 'string')) || (kb && (typeof a === 'boolean' || typeof a === 'string')) || (typeof a === 'boolean' && typeof b === 'string') || (typeof b === 'boolean' && typeof a === 'string'))
      this.cerr(`incomparable types: ${typeName(a)} and ${typeName(b)}`, line);
    return false;
  }
  chkBool(c, node) { if (typeof c !== 'boolean') this.cerr(`incompatible types: ${typeName(c)} cannot be converted to boolean`, node && node.line); }

  /* ================= expresiones ================= */
  evalArgs(args, env) { const out = new Array(args.length); for (let i = 0; i < args.length; i++) out[i] = this.eval(args[i], env); return out; }
  evalInit(init, t, env) {
    if (init.k === 'arrlit') {
      if (t.d === 0) this.cerr(`illegal initializer for ${t.n}`, init.line);
      const et = { n: t.n, d: t.d - 1, a: t.a };
      return new JArray(et, init.elems.map(e => this.coerce(et, this.evalInit(e, et, env))));
    }
    return this.eval(init, env);
  }
  makeArray(et, sizes, level, total) {
    const len = sizes[level];
    if (len < 0) this.throwJ('NegativeArraySizeException', String(len));
    const elT = { n: et.n, d: total - level - 1 };
    const a = new Array(len);
    if (level === sizes.length - 1) { const dv = this.defVal(elT); for (let i = 0; i < len; i++) a[i] = dv; }
    else for (let i = 0; i < len; i++) a[i] = this.makeArray(et, sizes, level + 1, total);
    return new JArray(elT, a);
  }
  eval(n, env) {
    switch (n.k) {
      case 'lit': return n.v;
      case 'paren': return this.eval(n.e, env);
      case 'name': return this.getVar(n.n, env, n);
      case 'this': if (!env.ctx.self) this.cerr('non-static variable this cannot be referenced from a static context', n.line); return env.ctx.self;
      case 'bin': {
        if (n.op === '&&' || n.op === '||') {
          const l = this.eval(n.l, env);
          if (typeof l !== 'boolean') this.badOp(n.op, l, '?', n.line);
          if (n.op === '&&' ? !l : l) return l;
          const r = this.eval(n.r, env); if (typeof r !== 'boolean') this.badOp(n.op, l, r, n.line); return r;
        }
        return this.bin(n.op, this.eval(n.l, env), this.eval(n.r, env), n.line);
      }
      case 'unary': {
        const v = this.eval(n.e, env);
        switch (n.op) {
          case '!': if (typeof v !== 'boolean') this.cerr(`bad operand type ${typeName(v)} for unary operator '!'`, n.line); return !v;
          case '-': if (typeof v === 'number') return (-v) | 0; if (v instanceof Dbl) return new Dbl(-v.v); if (typeof v === 'bigint') return BigInt.asIntN(64, -v); if (v instanceof Chr) return -v.c; break;
          case '+': if (v instanceof Chr) return v.c; if (kindOf(v)) return v; break;
          case '~': if (typeof v === 'number') return ~v; if (typeof v === 'bigint') return ~v; if (v instanceof Chr) return ~v.c; break;
        }
        this.cerr(`bad operand type ${typeName(v)} for unary operator '${n.op}'`, n.line); break;
      }
      case 'assign': return this.evalAssign(n, env);
      case 'inc': {
        const r = this.ref(n.t, env); const old = this.readRef(r, n.t); const d = n.op === '++' ? 1 : -1; let nv;
        if (typeof old === 'number') nv = (old + d) | 0; else if (old instanceof Dbl) nv = new Dbl(old.v + d);
        else if (typeof old === 'bigint') nv = BigInt.asIntN(64, old + BigInt(d)); else if (old instanceof Chr) nv = new Chr((old.c + d) & 0xFFFF);
        else this.cerr(`bad operand type ${typeName(old)} for unary operator '${n.op}'`, n.line);
        this.setRef(r, nv); return n.prefix ? nv : old;
      }
      case 'cond': { const c = this.eval(n.c, env); this.chkBool(c, n.c); return this.eval(c ? n.a : n.b, env); }
      case 'cast': return this.castTo(n.type, this.eval(n.e, env));
      case 'instof': {
        const v = this.eval(n.e, env); const ok = this.instanceOf(v, n.type.n);
        if (ok && n.bind) { const c = env.vars[n.bind]; if (c) c.v = v; else this.declareLocal(env, n.bind, null, v, false, n.line); }
        return ok;
      }
      case 'index': {
        const a = this.eval(n.a, env); let i = this.eval(n.i, env);
        if (a === null) this.throwJ('NullPointerException', `Cannot load from array because ${n.a.k === 'name' ? '"' + n.a.n + '"' : 'value'} is null`);
        if (!(a instanceof JArray)) this.cerr('array required, but ' + typeName(a) + ' found', n.line);
        if (i instanceof Chr) i = i.c;
        if (typeof i !== 'number') this.cerr(`incompatible types: possible lossy conversion from ${typeName(i)} to int`, n.line);
        if (i < 0 || i >= a.a.length) this.throwJ('ArrayIndexOutOfBoundsException', `Index ${i} out of bounds for length ${a.a.length}`);
        return a.a[i];
      }
      case 'field': return this.evalField(n, env);
      case 'call': return this.evalCall(n, env);
      case 'new': return this.evalNew(n, env);
      case 'newarr': {
        if (n.init) { const t = { n: n.et.n, d: n.extra }; return this.evalInit(n.init, t, env); }
        const sizes = n.dims.map(d => { let v = this.eval(d, env); if (v instanceof Chr) v = v.c; if (typeof v !== 'number') this.cerr(`incompatible types: possible lossy conversion from ${typeName(v)} to int`, n.line); return v; });
        return this.makeArray(n.et, sizes, 0, n.dims.length + n.extra);
      }
      case 'lambda': return new JLambda(n.params, n.body, env);
      case 'mref': {
        const cr = this.classRef(n.o, env);
        if (cr) return new JMRef(cr.ci ? cr.ci.name : cr.name, true, n.n);
        if (n.o.k === 'name' && /\[\]$/.test(n.o.n)) return new JMRef(n.o.n, true, n.n);
        return new JMRef(this.eval(n.o, env), false, n.n);
      }
      case 'switch': {
        const r = this.execSwitch(n, env, true);
        if (r && r.t === 'y') return r.v;
        if (r && r.t === 'r') this.cerr('attempt to return out of a switch expression', n.line);
        this.cerr('switch expression does not have any result expressions', n.line); break;
      }
      case 'ctorcall': this.cerr(`call to ${n.which} must be first statement in constructor`, n.line); break;
      case 'super': this.cerr("'.' expected", n.line); break;
      case 'arrlit': this.cerr('illegal start of expression', n.line); break;
      case 'classlit': return new JClassRef(n.o.n || '?');
      case 'outerthis': { let s = env.ctx.self; while (s && s.cls.name !== n.o.n) s = s.outerThis; if (!s) this.cerr('not an enclosing class: ' + n.o.n, n.line); return s; }
    }
    this.cerr('expresión no soportada: ' + n.k, n.line);
  }
  evalAssign(n, env) {
    const t = n.t;
    if (t.k === 'name' && n.op === '=') {
      const c = this.findCell(t.n, env);
      if (c) {
        const v = this.eval(n.v, env);
        if (c.fin && c.v !== UNSET) this.cerr(`cannot assign a value to final variable ${t.n}`, n.line);
        return (c.v = this.coerce(c.t, v));
      }
    }
    const r = this.ref(t, env);
    if (n.op === '=') {
      const v = this.eval(n.v, env);
      return this.setRef(r, v);
    }
    const cur = this.readRef(r, t); const rhs = this.eval(n.v, env);
    let res = this.bin(n.op.slice(0, -1), cur, rhs, n.line);
    if (r.t && r.t.d === 0 && PRIMS.has(r.t.n) && r.t.n !== 'boolean' && typeof res !== 'string') res = JV.castPrim(r.t.n, res);
    else if (r.t && r.t.d === 0 && r.t.n === 'String' && typeof res !== 'string') res = this.coerce(r.t, res);
    return this.setRef(r, res);
  }
  evalField(n, env) {
    const cr = this.classRef(n.o, env);
    if (cr) {
      if (cr.ci) {
        const ci = cr.ci; const f = this.findFieldInfo(ci, n.n);
        if (f && f.static) { this.checkPrivate(f.owner, f.mods, n.n, env, n); this.ensureInit(f.owner); return f.owner.statics[n.n].v; }
        if (n.n === 'length' && false) return 0;
        if (this.classes[n.n]) this.cerr('class ' + n.n + ' used as a value', n.line);
        this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}\n  location: class ${ci.name}`, n.line);
      }
      const v = cr.st[n.n];
      if (v === undefined) this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}\n  location: class ${cr.name}`, n.line);
      return v;
    }
    const o = this.eval(n.o, env);
    if (o === null) this.throwJ('NullPointerException', `Cannot read field "${n.n}" because ${n.o.k === 'name' ? '"' + n.o.n + '"' : n.o.k === 'call' ? 'the return value of "' + n.o.n + '()"' : 'value'} is null`);
    if (o instanceof JArray) { if (n.n === 'length') return o.a.length; this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}`, n.line); }
    if (o instanceof JObject) {
      const f = this.findFieldInfo(n.o.k === 'this' ? env.ctx.cls : o.cls, n.n) || this.findFieldInfo(o.cls, n.n);
      if (!f) this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}\n  location: variable of type ${o.cls.name}`, n.line);
      this.checkPrivate(f.owner, f.mods, n.n, env, n);
      if (f.static) { this.ensureInit(f.owner); return f.owner.statics[n.n].v; }
      return o.f[f.key];
    }
    this.cerr(`cannot find symbol\n  symbol:   variable ${n.n}\n  location: class ${typeName(o)}`, n.line);
  }
  evalNew(n, env) {
    const tn = n.type.n;
    if (n.body) {
      const ci = this.anonClass(n);
      const args = this.evalArgs(n.args, env); this.curLine = n.line;
      return this.instantiate(ci, args, env, n, env);
    }
    const ci = this.classes[tn];
    if (ci) {
      const args = this.evalArgs(n.args, env); this.curLine = n.line;
      n.ctxTop = env.ctx.cls.top;
      return this.instantiate(ci, args, env, n);
    }
    const f = NEW[tn];
    if (f) { const args = this.evalArgs(n.args, env); return f(args, this, n); }
    this.cerr(`cannot find symbol\n  symbol:   class ${tn}\n  location: class ${env.ctx.cls.name}`, n.line);
  }
  anonClass(n) {
    let ci = this.anonCache.get(n); if (ci) return ci;
    const ast = n.body; const tn = n.type.n; const sup = this.classes[tn];
    ast.name = 'Anon$' + (++this.anonN); ast.mods = {};
    if (sup && sup.isInterface) { ast.ifaces = [tn]; ast.superName = null; } else if (sup) { ast.superName = tn; ast.ifaces = []; } else { ast.ifaces = [tn]; ast.superName = null; }
    const created = []; ci = this.declare(ast, null, created); created.forEach(c => this.link(c)); created.forEach(c => this.check(c));
    this.anonCache.set(n, ci); return ci;
  }
  evalCall(n, env) {
    const name = n.n;
    if (!n.o) {
      const args = this.evalArgs(n.args, env); this.curLine = n.line;
      const ctx = env.ctx;
      for (let c = ctx.cls, self = ctx.self; c; c = c.outer, self = self && self.outerThis) {
        const start = self && this.isSub(self.cls, c.name) ? self.cls : c;
        const r = this.findMethod(start, name, args);
        if (r) {
          if (r.m.mods.static) { this.ensureInit(r.m.owner); return this.invoke(r.m.owner, r.m, null, r.args); }
          if (!self || !this.isSub(self.cls, r.m.owner.name)) this.cerr(`non-static method ${name}(${r.m.params.map(p => tstr(p.t)).join(',')}) cannot be referenced from a static context`, n.line);
          if (!r.m.body) this.cerr(`abstract method ${name} cannot be accessed directly`, n.line);
          return this.invoke(r.m.owner, r.m, self, r.args);
        }
        if (self && (name === 'toString' || name === 'hashCode' || name === 'equals' || name === 'getClass' || name === 'name' || name === 'ordinal')) return this.callObj(self, name, args, env, n);
      }
      if (ctx.cls.isEnum && (name === 'values' || name === 'valueOf')) return this.enumStatic(ctx.cls, name, args, n);
      this.methodNotFound(name, args, 'class ' + ctx.cls.name, n);
    }
    if (n.o.k === 'super') {
      const args = this.evalArgs(n.args, env); this.curLine = n.line; const ctx = env.ctx;
      const start = ctx.cls.sup;
      let r = start && this.findMethod(start, name, args);
      if (!r || !r.m.body) for (const i of ctx.cls.ifaces) { const x = this.findMethod(i, name, args); if (x && x.m.body) { r = x; break; } }
      if (r && r.m.body) return this.invoke(r.m.owner, r.m, ctx.self, r.args);
      switch (name) {
        case 'toString': return this.qname(ctx.cls.sup || ctx.cls) === 'Object' || !ctx.cls.sup ? ctx.cls.name + '@' + ((ctx.self.id * 2654435761) >>> 0).toString(16).slice(0, 8) : this.objStr(ctx.self);
        case 'equals': return ctx.self === args[0]; case 'hashCode': return (Math.imul(ctx.self.id, 0x9E3779B1) >>> 1) | 0;
      }
      this.methodNotFound(name, args, 'class ' + (start ? start.name : 'Object'), n);
    }
    const cr = this.classRef(n.o, env);
    if (cr) {
      const args = this.evalArgs(n.args, env); this.curLine = n.line;
      if (cr.ci) {
        const ci = cr.ci; this.ensureInit(ci);
        const r = this.findMethod(ci, name, args);
        if (!r) { if (ci.isEnum && (name === 'values' || name === 'valueOf')) return this.enumStatic(ci, name, args, n); this.methodNotFound(name, args, 'class ' + ci.name, n); }
        if (!r.m.mods.static) this.cerr(`non-static method ${name}(${r.m.params.map(p => tstr(p.t)).join(',')}) cannot be referenced from a static context`, n.line);
        this.checkPrivate(r.m.owner, r.m.mods, `${name}(${r.m.params.map(p => tstr(p.t)).join(',')})`, env, n);
        return this.invoke(r.m.owner, r.m, null, r.args);
      }
      const f = cr.st[name];
      if (typeof f !== 'function') this.methodNotFound(name, args, 'class ' + cr.name, n);
      return f(args, this, n);
    }
    const t = this.eval(n.o, env);
    const args = this.evalArgs(n.args, env); this.curLine = n.line;
    if (name === 'remove' && t instanceof JList && n.args.length === 1) {
      const a0 = n.args[0];
      if ((a0.k === 'call' && a0.n === 'valueOf' && a0.o && a0.o.k === 'name' && a0.o.n === 'Integer') || (a0.k === 'cast' && (a0.type.n === 'Integer' || a0.type.n === 'Object')))
        return t.invoke('removeObj', args, this, n);
    }
    return this.callMethod(t, name, args, n, env);
  }
  enumStatic(ci, name, args, n) {
    this.ensureInit(ci);
    if (name === 'values') return new JArray({ n: ci.name, d: 0 }, ci.enumVals.slice());
    const v = ci.enumVals.find(o => o.f.__name === args[0]);
    if (!v) this.throwJ('IllegalArgumentException', `No enum constant ${ci.name}.${args[0]}`);
    return v;
  }

  /* ================= sentencias ================= */
  execBlock(list, env) {
    for (let i = 0; i < list.length; i++) { const r = this.exec(list[i], env); if (r) return r; }
    return null;
  }
  exec(s, env, label) {
    if (++this.steps > this.maxSteps) throw new Timeout('Tu programa tardó demasiado: ¿hay un bucle infinito?');
    this.curLine = s.line;
    switch (s.k) {
      case 'expr': this.eval(s.e, env); return null;
      case 'local': {
        for (const d of s.decls) {
          let t = s.type; if (d.dims) t = { n: t.n, d: t.d + d.dims, a: t.a };
          const isVar = t.n === 'var' && t.d === 0 && !this.classes.var;
          let v = UNSET;
          if (d.init) { this.curLine = d.line; v = isVar ? this.eval(d.init, env) : this.coerce(t, this.evalInit(d.init, t, env)); }
          else if (isVar) this.cerr("cannot infer type for local variable " + d.name + "\n  (cannot use 'var' on variable without initializer)", d.line);
          this.declareLocal(env, d.name, isVar ? null : t, v, s.final, d.line);
        }
        return null;
      }
      case 'block': return this.execBlock(s.body, new Env(env));
      case 'if': {
        const c = this.eval(s.c, env); this.chkBool(c, s.c);
        if (c) return this.exec(s.a, env); else if (s.b) return this.exec(s.b, env); return null;
      }
      case 'while': {
        for (;;) {
          const c = this.eval(s.c, env); this.chkBool(c, s.c); if (!c) break;
          this.tick();
          const r = this.exec(s.body, env);
          if (r) { if (r.t === 'b') { if (!r.l || r.l === label) break; return r; } if (r.t === 'c') { if (r.l && r.l !== label) return r; continue; } return r; }
        }
        return null;
      }
      case 'do': {
        for (;;) {
          this.tick();
          const r = this.exec(s.body, env);
          if (r) { if (r.t === 'b') { if (!r.l || r.l === label) break; return r; } if (r.t === 'c') { if (r.l && r.l !== label) return r; } else return r; }
          const c = this.eval(s.c, env); this.chkBool(c, s.c); if (!c) break;
        }
        return null;
      }
      case 'for': {
        const e2 = new Env(env);
        if (s.init) for (const i of s.init) this.exec(i, e2);
        for (;;) {
          if (s.c) { const c = this.eval(s.c, e2); this.chkBool(c, s.c); if (!c) break; }
          this.tick();
          const r = this.exec(s.body, e2);
          if (r) { if (r.t === 'b') { if (!r.l || r.l === label) break; return r; } if (r.t === 'c') { if (r.l && r.l !== label) return r; } else return r; }
          for (const u of s.upd) this.eval(u, e2);
        }
        return null;
      }
      case 'foreach': {
        const coll = this.eval(s.iter, env);
        if (coll === null) this.throwJ('NullPointerException', 'Cannot iterate because the collection is null');
        const isVar = s.type.n === 'var';
        for (const v of this.iter(coll)) {
          this.tick();
          const e2 = new Env(env); this.declareLocal(e2, s.name, isVar ? null : s.type, isVar ? v : this.coerce(s.type, v), false, s.line);
          const r = this.exec(s.body, e2);
          if (r) { if (r.t === 'b') { if (!r.l || r.l === label) break; return r; } if (r.t === 'c') { if (r.l && r.l !== label) return r; } else return r; }
        }
        return null;
      }
      case 'return': return { t: 'r', v: s.e ? this.eval(s.e, env) : undefined };
      case 'break': return { t: 'b', l: s.label };
      case 'continue': return { t: 'c', l: s.label };
      case 'yield': return { t: 'y', v: this.eval(s.e, env) };
      case 'labeled': return this.exec(s.body, env, s.label) || null;
      case 'empty': return null;
      case 'throw': {
        const v = this.eval(s.e, env);
        if (v === null) this.throwJ('NullPointerException', 'Cannot throw exception because value is null');
        if (!(v instanceof JObject) || !v.cls.isThrowable) this.cerr(`incompatible types: ${typeName(v)} cannot be converted to Throwable`, s.line);
        if (v.line === undefined || true) v.line = v.line || s.line;
        throw new JavaThrow(v);
      }
      case 'try': return this.execTry(s, env);
      case 'switch': return this.execSwitch(s, env, false);
      case 'localclass': {
        const created = []; this.declare(s.cls, null, created); created.forEach(c => { this.link(c); c.capEnv = env; }); created.forEach(c => this.check(c)); return null;
      }
    }
    this.cerr('sentencia no soportada: ' + s.k, s.line);
  }
  execTry(s, env) {
    let result = null, pending = null; const e1 = new Env(env); const resources = [];
    try {
      if (s.res) for (const d of s.res) { this.exec(d, e1); resources.push(e1.vars[d.decls[0].name].v); }
      result = this.execBlock(s.block.body, new Env(e1));
    } catch (e) {
      const jt = this.asJavaThrow(e);
      if (!jt) throw e;
      pending = jt;
    }
    for (const r of resources.reverse()) { try { if (r !== null) this.callMethod(r, 'close', [], null, env); } catch (e) { if (!pending) pending = this.asJavaThrow(e) || e; } }
    if (pending instanceof JavaThrow) {
      const c = s.catches.find(c => c.types.some(t => this.instanceOf(pending.obj, t.n)));
      if (c) {
        const jt = pending; pending = null;
        const e2 = new Env(env); e2.vars[c.name] = { v: jt.obj, t: null, fin: false };
        try { result = this.execBlock(c.block.body, e2); } catch (e) { pending = e; }
      }
    }
    if (s.fin) { const r = this.execBlock(s.fin.body, new Env(env)); if (r) return r; }
    if (pending) throw pending;
    return result;
  }
  caseMatch(sel, l, env) {
    if (sel instanceof JObject && sel.f.__name !== undefined && l.k === 'name') return sel.f.__name === l.n;
    if (l.k === 'lit' && l.v === null) return sel === null;
    const v = this.eval(l, env);
    if (typeof sel === 'string') return sel === v;
    return this.eq(sel, v, l.line);
  }
  execSwitch(s, env, isExpr) {
    const sel = this.eval(s.sel, env);
    if (sel === null && !s.cases.some(c => c.labels && c.labels.some(l => l.k === 'lit' && l.v === null))) this.throwJ('NullPointerException', 'Cannot invoke "Object.hashCode()" because value is null');
    const e2 = new Env(env); let idx = -1, def = -1;
    for (let i = 0; i < s.cases.length && idx < 0; i++) {
      const c = s.cases[i];
      if (c.labels === null) { def = i; continue; }
      for (const l of c.labels) if (this.caseMatch(sel, l, e2)) { idx = i; break; }
    }
    if (idx < 0) idx = def;
    if (idx < 0) { if (isExpr) this.throwJ('MatchException', null); return null; }
    if (s.arrow) {
      const c = s.cases[idx];
      if (c.expr) { const v = this.eval(c.expr, e2); return isExpr ? { t: 'y', v } : null; }
      const r = this.exec(c.body, e2);
      if (r && r.t === 'b' && !r.l && !isExpr) return null;
      return r;
    }
    for (let i = idx; i < s.cases.length; i++) {
      for (const st of s.cases[i].body) { const r = this.exec(st, e2); if (r) { if (r.t === 'b' && !r.l) return null; return r; } }
    }
    return null;
  }

  /* ================= ejecución ================= */
  findMain() {
    for (const ci of this.userClasses) {
      const list = ci.methods.main;
      if (list && list.some(m => m.mods.static && m.params.length <= 1)) return ci;
    }
    return null;
  }
  runMain() {
    const ci = this.findMain();
    if (!ci) throw new CompileError('error: no se encontró el método main\n  Necesitas: public static void main(String[] args)', 1);
    this.ensureInit(ci);
    const m = ci.methods.main.find(m => m.mods.static && m.params.length <= 1);
    const env = this.newMethodEnv(ci, null, m, m.params.length ? [new JArray({ n: 'String', d: 0 }, [])] : []);
    this.mainEnv = env; this.depth++;
    try { this.execBlock(m.body.body, env); } finally { this.depth--; }
    return undefined;
  }
  callStaticByName(cn, mn, args) {
    const ci = this.classes[cn]; this.ensureInit(ci);
    const r = this.findMethod(ci, mn, args || []);
    return this.invoke(ci, r.m, null, r.args);
  }
  describeError(e) {
    if (e instanceof CompileError) return { type: 'compile', msg: e.message, line: e.line };
    if (e instanceof Timeout) return { type: 'timeout', msg: e.message, line: this.curLine };
    const jt = this.asJavaThrow(e);
    if (jt) {
      const o = jt.obj; let text;
      try { text = this.str(o); } catch (x) { text = this.qname(o.cls); }
      return { type: 'exception', msg: text, cls: o.cls.name, fullName: this.qname(o.cls), message: o.f.message === undefined ? null : o.f.message, line: o.line || this.curLine, obj: o };
    }
    return { type: 'internal', msg: String(e && e.stack || e), line: this.curLine };
  }
}

JV.Interp = Interp;
JV.run = function (opts) {
  const I = new Interp(opts); const res = { ok: true, error: null, exit: null };
  try {
    if (opts.support) I.loadSource(opts.support, false);
    I.loadSource(opts.code, true);
    if (opts.snippet) {
      I.loadSource('class __T { public static void __run() {\n' + opts.snippet + '\n} }', false, 100000);
      I.callStaticByName('__T', '__run');
    } else if (!opts.noMain) I.runMain();
  } catch (e) {
    if (e instanceof ExitSignal) res.exit = e.code; else { res.ok = false; res.error = I.describeError(e); }
  }
  res.out = I.stdout; res.segs = I.segs; res.steps = I.steps; res.interp = I;
  return res;
};
if (typeof module !== 'undefined') module.exports = JV;
})(globalThis);

