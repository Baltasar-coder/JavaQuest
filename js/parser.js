/* Lexer + parser de un subconjunto amplio de Java (hasta Java 17 básico) */
(function (G) {
'use strict';
const JV = G.JV = G.JV || {};

class CompileError extends Error {
  constructor(msg, line) { super(msg); this.line = line || 0; this.kind = 'compile'; }
}
JV.CompileError = CompileError;

const KW = new Set(('abstract boolean break byte case catch char class continue default do double else enum extends ' +
  'final finally float for if implements import instanceof int interface long new package private protected public ' +
  'return short static super switch this throw throws try void while true false null').split(' '));
const PRIMS = new Set(['boolean', 'byte', 'char', 'short', 'int', 'long', 'float', 'double']);
JV.PRIMS = PRIMS;

/* ---------------- LEXER ---------------- */
function lex(src, line0) {
  const toks = []; let i = 0, line = line0 || 1; const n = src.length;
  const isIdStart = c => /[A-Za-z_$À-￿]/.test(c);
  const isId = c => /[A-Za-z0-9_$À-￿]/.test(c);
  const OPS = ['<<=', '...', '->', '::', '++', '--', '&&', '||', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<'];
  function esc(startLine) {
    // src[i] === '\\'
    const c = src[i + 1]; i += 2;
    switch (c) {
      case 'n': return '\n'; case 't': return '\t'; case 'r': return '\r'; case 'b': return '\b'; case 'f': return '\f';
      case '0': return '\0'; case 's': return ' ';
      case '"': return '"'; case "'": return "'"; case '\\': return '\\';
      case 'u': { while (src[i] === 'u') i++; const h = src.slice(i, i + 4); i += 4; return String.fromCharCode(parseInt(h, 16)); }
      default: throw new CompileError('illegal escape character', startLine);
    }
  }
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '﻿') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const st = line; i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
      if (i >= n) throw new CompileError('unclosed comment', st);
      i += 2; continue;
    }
    if (isIdStart(c)) {
      let j = i + 1; while (j < n && isId(src[j])) j++;
      const w = src.slice(i, j);
      toks.push({ t: KW.has(w) ? 'kw' : 'id', v: w, line, pos: i, end: j }); i = j; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i, kind = 'int', val, hexlike = false;
      if (c === '0' && /[xX]/.test(src[i + 1] || '')) {
        j = i + 2; while (/[0-9a-fA-F_]/.test(src[j] || '')) j++;
        val = BigInt('0x' + src.slice(i + 2, j).replace(/_/g, '')); hexlike = true;
      } else if (c === '0' && /[bB]/.test(src[i + 1] || '')) {
        j = i + 2; while (/[01_]/.test(src[j] || '')) j++;
        val = BigInt('0b' + src.slice(i + 2, j).replace(/_/g, '')); hexlike = true;
      } else {
        while (/[0-9_]/.test(src[j] || '')) j++;
        let isF = false;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { isF = true; j++; while (/[0-9_]/.test(src[j] || '')) j++; }
        if (/[eE]/.test(src[j] || '') && /[0-9+\-]/.test(src[j + 1] || '')) { isF = true; j++; if (/[+\-]/.test(src[j])) j++; while (/[0-9]/.test(src[j] || '')) j++; }
        const txt = src.slice(i, j).replace(/_/g, '');
        if (isF) { kind = 'double'; val = parseFloat(txt); }
        else if (txt.length > 1 && txt[0] === '0' && /^[0-7]+$/.test(txt)) val = BigInt('0o' + txt.slice(1));
        else val = BigInt(txt);
      }
      const sfx = src[j] || '';
      if (/[lL]/.test(sfx) && typeof val === 'bigint') { kind = 'long'; j++; }
      else if (/[fFdD]/.test(sfx) && !hexlike) { kind = 'double'; val = Number(val); j++; }
      let v;
      if (kind === 'int') {
        const lim = hexlike ? 0xFFFFFFFFn : 2147483648n;
        if (val > lim) throw new CompileError('integer number too large', line);
        v = Number(val) | 0;
      } else if (kind === 'long') v = BigInt.asIntN(64, val);
      else v = val;
      toks.push({ t: 'num', kind, v, line, pos: i, end: j }); i = j; continue;
    }
    if (c === '"') {
      const st = line; let s = ''; i++;
      while (i < n && src[i] !== '"') {
        if (src[i] === '\n') throw new CompileError('unclosed string literal', st);
        if (src[i] === '\\') s += esc(st); else s += src[i++];
      }
      if (i >= n) throw new CompileError('unclosed string literal', st);
      i++; toks.push({ t: 'str', v: s, line, pos: i, end: i }); continue;
    }
    if (c === "'") {
      let ch; i++;
      if (src[i] === '\\') ch = esc(line); else { ch = src[i++]; }
      if (src[i] !== "'") throw new CompileError('unclosed character literal', line);
      i++; toks.push({ t: 'chr', v: ch.charCodeAt(0), line, pos: i, end: i }); continue;
    }
    let op = null;
    for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
    if (!op && '+-*/%=<>!&|^~?:;,.(){}[]@'.includes(c)) op = c;
    if (!op) throw new CompileError("illegal character: '" + c + "'", line);
    toks.push({ t: 'op', v: op, line, pos: i, end: i + op.length }); i += op.length;
  }
  toks.push({ t: 'eof', v: '<EOF>', line, pos: n, end: n });
  return toks;
}
JV.lex = lex;

const PREC = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, 'instanceof': 7,
  '<<': 8, '>>': 8, '>>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=']);

/* ---------------- PARSER ---------------- */
class Parser {
  constructor(toks) { this.t = toks; this.p = 0; this.anon = 0; }
  get cur() { return this.t[this.p]; }
  at(k) { return this.t[Math.min(this.p + k, this.t.length - 1)]; }
  isOp(v, k = 0) { const t = this.at(k); return t.t === 'op' && t.v === v; }
  isKw(v, k = 0) { const t = this.at(k); return t.t === 'kw' && t.v === v; }
  isId(k = 0) { return this.at(k).t === 'id'; }
  isIdv(v, k = 0) { const t = this.at(k); return t.t === 'id' && t.v === v; }
  eatOp(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
  eatKw(v) { if (this.isKw(v)) { this.p++; return true; } return false; }
  err(msg) {
    let line = this.cur.line;
    if (this.p > 0 && this.t[this.p - 1].line < line && /expected/.test(msg)) line = this.t[this.p - 1].line;
    throw new CompileError(msg, line);
  }
  expectOp(v) { if (!this.eatOp(v)) this.err(`'${v}' expected`); }
  expectKw(v) { if (!this.eatKw(v)) this.err(`'${v}' expected`); }
  ident() { const t = this.cur; if (t.t !== 'id') this.err('<identifier> expected'); this.p++; return t.v; }

  /* ----- programa ----- */
  parseProgram() {
    while (this.isKw('package') || this.isKw('import')) {
      while (!this.isOp(';') && this.cur.t !== 'eof') this.p++;
      this.expectOp(';');
    }
    const start = this.p;
    if (this.looksLikeClass()) {
      const classes = []; let ok = true;
      while (this.cur.t !== 'eof') {
        if (this.eatOp(';')) continue;
        const save = this.p;
        const mods = this.parseModifiers();
        if (!this.looksLikeClass()) {
          if (this.isOp('}') || this.cur.t === 'eof' || classes.length === 0) this.err('class, interface, enum, or record expected');
          this.p = save; ok = false; break;
        }
        classes.push(this.parseTypeDecl(mods));
      }
      if (ok) return { script: false, classes };
      this.p = start; // clases seguidas de sentencias sueltas: modo script
    }
    // modo script: sentencias sueltas (+ métodos y clases opcionales)
    const stmts = [], methods = [], classes = [];
    while (this.cur.t !== 'eof') {
      if (this.looksLikeClass()) { const mods = this.parseModifiers(); classes.push(this.parseTypeDecl(mods)); }
      else if (this.looksLikeMethod()) { const m = this.parseScriptMethod(); methods.push(m); }
      else stmts.push(this.parseStatement());
    }
    const hasMain = methods.some(m => m.name === 'main');
    const main = { k: 'method', name: 'main', params: [{ t: { n: 'String', d: 1 }, n: 'args' }], ret: { n: 'void', d: 0 },
      mods: { static: true, public: true }, body: { k: 'block', body: stmts, line: 1, endLine: this.cur.line }, line: 1, endLine: this.cur.line };
    const cls = this.newClass('Main', 'class', { public: true }, 1);
    cls.methods = hasMain ? methods : [main].concat(methods);
    classes.unshift(cls);
    return { script: true, classes };
  }
  newClass(name, kind, mods, line) {
    return { k: 'class', name, kind, mods, line, superName: null, ifaces: [], fields: [], methods: [], ctors: [],
      instInit: [], staticInit: [], consts: [], nested: [], recordComps: null };
  }
  looksLikeClass() {
    let k = 0;
    for (;;) {
      const t = this.at(k);
      if (t.t === 'kw' && ['public', 'private', 'protected', 'abstract', 'final', 'static'].includes(t.v)) { k++; continue; }
      if (t.t === 'id' && (t.v === 'sealed' || t.v === 'strictfp')) { k++; continue; }
      if (this.isOp('@', k) && this.at(k + 1).t === 'id') { k += 2; continue; }
      break;
    }
    const t = this.at(k);
    return (t.t === 'kw' && (t.v === 'class' || t.v === 'interface' || t.v === 'enum')) ||
      (t.t === 'id' && t.v === 'record' && this.at(k + 1).t === 'id' && (this.isOp('(', k + 2) || this.isOp('<', k + 2)));
  }
  looksLikeMethod() {
    const save = this.p; let ok = false;
    try {
      this.parseModifiers();
      if (this.isOp('<')) this.skipTypeParams();
      if (this.isKw('void')) this.p++; else this.parseType();
      if (this.isId() && this.isOp('(', 1)) {
        this.p++; let d = 0;
        do { if (this.isOp('(')) d++; else if (this.isOp(')')) d--; this.p++; } while (d > 0 && this.cur.t !== 'eof');
        ok = this.isOp('{') || this.isKw('throws');
      }
    } catch (e) { ok = false; }
    this.p = save; return ok;
  }
  parseScriptMethod() {
    const mods = this.parseModifiers(); mods.static = true;
    const m = this.parseMethodRest(mods, null);
    return m;
  }

  parseModifiers() {
    const m = {};
    for (;;) {
      const t = this.cur;
      if (t.t === 'kw' && ['public', 'private', 'protected', 'static', 'final', 'abstract', 'default'].includes(t.v)) {
        if (t.v === 'default' && (this.isOp(':', 1) || this.isOp('->', 1))) break;
        m[t.v] = true; this.p++; continue;
      }
      if (t.t === 'id' && ['synchronized', 'native', 'transient', 'volatile', 'strictfp', 'sealed'].includes(t.v) &&
        (this.at(1).t === 'kw' || this.at(1).t === 'id')) { this.p++; continue; }
      if (this.isOp('@') && !this.isKw('interface', 1)) {
        this.p++; const nm = this.ident(); if (nm === 'Override') m.override = true;
        while (this.eatOp('.')) this.ident();
        if (this.isOp('(')) { let d = 0; do { if (this.isOp('(')) d++; else if (this.isOp(')')) d--; this.p++; } while (d > 0 && this.cur.t !== 'eof'); }
        continue;
      }
      break;
    }
    return m;
  }
  skipTypeParams() {
    let d = 0;
    do { if (this.isOp('<')) d++; else if (this.isOp('>')) d--; this.p++; } while (d > 0 && this.cur.t !== 'eof');
  }

  /* ----- tipos ----- */
  parseType() {
    const t = this.cur; let name, args = null;
    if (t.t === 'kw' && (PRIMS.has(t.v) || t.v === 'void')) { name = t.v; this.p++; }
    else if (t.t === 'id') {
      name = t.v; this.p++;
      if (this.isOp('<')) args = this.parseTypeArgs();
      while (this.isOp('.') && this.at(1).t === 'id') { this.p++; name = this.cur.v; this.p++; if (this.isOp('<')) args = this.parseTypeArgs(); }
    } else this.err('<identifier> expected');
    let d = 0;
    while (this.isOp('[') && this.isOp(']', 1)) { this.p += 2; d++; }
    return { n: name, d, a: args };
  }
  parseTypeArgs() {
    this.expectOp('<'); const args = [];
    if (this.eatOp('>')) return args;
    do {
      if (this.eatOp('?')) {
        if (this.eatKw('extends') || this.eatKw('super')) args.push(this.parseType()); else args.push({ n: 'Object', d: 0 });
      } else args.push(this.parseType());
    } while (this.eatOp(','));
    this.expectOp('>'); return args;
  }

  /* ----- declaraciones de tipo ----- */
  parseTypeDecl(mods) {
    const line = this.cur.line; let kind;
    if (this.eatKw('class')) kind = 'class';
    else if (this.eatKw('interface')) kind = 'interface';
    else if (this.eatKw('enum')) kind = 'enum';
    else if (this.isIdv('record')) { this.p++; kind = 'record'; }
    else if (this.isOp('@')) { this.p++; this.p++; kind = 'interface'; }
    else this.err('class, interface, enum, or record expected');
    const name = this.ident();
    const cls = this.newClass(name, kind, mods, line);
    if (this.isOp('<')) this.skipTypeParams();
    if (kind === 'record') {
      this.expectOp('(');
      cls.recordComps = [];
      if (!this.isOp(')')) do { const t = this.parseType(); cls.recordComps.push({ t, n: this.ident() }); } while (this.eatOp(','));
      this.expectOp(')');
    }
    if (this.eatKw('extends')) {
      if (kind === 'interface') { do { cls.ifaces.push(this.parseType().n); } while (this.eatOp(',')); }
      else cls.superName = this.parseType().n;
    }
    if (this.eatKw('implements')) { do { cls.ifaces.push(this.parseType().n); } while (this.eatOp(',')); }
    if (this.isIdv('permits')) { this.p++; do { this.parseType(); } while (this.eatOp(',')); }
    this.parseClassBody(cls);
    if (kind === 'record') this.synthRecord(cls);
    return cls;
  }
  synthRecord(cls) {
    const comps = cls.recordComps, line = cls.line;
    const hasCtor = cls.ctors.some(c => c.params.length === comps.length);
    for (const c of comps) {
      cls.fields.push({ name: c.n, type: c.t, mods: { private: true, final: true }, init: null, line });
      if (!cls.methods.some(m => m.name === c.n && m.params.length === 0))
        cls.methods.push({ k: 'method', name: c.n, params: [], ret: c.t, mods: { public: true }, line, endLine: line,
          body: { k: 'block', line, endLine: line, body: [{ k: 'return', line, e: { k: 'field', o: { k: 'this', line }, n: c.n, line } }] } });
    }
    if (!hasCtor) {
      cls.ctors.push({ k: 'method', name: cls.name, isCtor: true, params: comps.map(c => ({ t: c.t, n: c.n })), ret: null, mods: { public: true }, line, endLine: line,
        body: { k: 'block', line, endLine: line, body: comps.map(c => ({ k: 'expr', line, e: { k: 'assign', op: '=', line,
          t: { k: 'field', o: { k: 'this', line }, n: c.n, line }, v: { k: 'name', n: c.n, line } } })) } });
    }
  }
  parseClassBody(cls) {
    this.expectOp('{');
    if (cls.kind === 'enum') this.parseEnumConsts(cls);
    while (!this.isOp('}')) {
      if (this.cur.t === 'eof') this.err('reached end of file while parsing');
      if (this.eatOp(';')) continue;
      this.parseMember(cls);
    }
    this.expectOp('}');
  }
  parseEnumConsts(cls) {
    while (this.isId()) {
      const line = this.cur.line, name = this.ident(); let args = [], body = null;
      if (this.isOp('(')) args = this.parseArgs();
      if (this.isOp('{')) {
        body = this.newClass(cls.name + '$' + name, 'class', {}, line); body.superName = cls.name; body.anonymous = true;
        this.parseClassBody(body);
      }
      cls.consts.push({ name, args, body, line });
      if (!this.eatOp(',')) break;
    }
    if (!this.isOp('}')) this.expectOp(';');
  }
  parseMember(cls) {
    const mods = this.parseModifiers(); const t = this.cur; const line = t.line;
    if ((t.t === 'kw' && (t.v === 'class' || t.v === 'interface' || t.v === 'enum')) ||
      (this.isIdv('record') && this.isId(1) && (this.isOp('(', 2) || this.isOp('<', 2)))) {
      cls.nested.push(this.parseTypeDecl(mods)); return;
    }
    if (this.isOp('{')) {
      const b = this.parseBlock(); const e = { k: 'init', block: b, static: !!mods.static };
      (mods.static ? cls.staticInit : cls.instInit).push(e); return;
    }
    if (this.isOp('<')) this.skipTypeParams();
    if (cls.kind === 'interface') { if (!mods.private) mods.public = true; }
    // constructor
    if (this.cur.t === 'id' && this.cur.v === cls.name && this.isOp('(', 1)) {
      this.p++;
      const params = this.parseParams();
      if (this.eatKw('throws')) { do { this.parseType(); } while (this.eatOp(',')); }
      const body = this.parseBlock();
      const c = { k: 'method', name: cls.name, isCtor: true, params, ret: null, mods, body, line, endLine: body.endLine };
      cls.ctors.push(c); return;
    }
    if (cls.kind === 'record' && this.cur.t === 'id' && this.cur.v === cls.name && this.isOp('{', 1)) {
      // constructor compacto
      this.p++; const body = this.parseBlock();
      const params = cls.recordComps.map(c => ({ t: c.t, n: c.n }));
      const assigns = cls.recordComps.map(c => ({ k: 'expr', line, e: { k: 'assign', op: '=', line, t: { k: 'field', o: { k: 'this', line }, n: c.n, line }, v: { k: 'name', n: c.n, line } } }));
      cls.ctors.push({ k: 'method', name: cls.name, isCtor: true, params, ret: null, mods, line, endLine: body.endLine,
        body: { k: 'block', line, endLine: body.endLine, body: body.body.concat(assigns) } });
      return;
    }
    if (this.cur.t === 'id' && this.isOp('(', 1)) this.err('invalid method declaration; return type required');
    let type;
    if (this.isKw('void')) { this.p++; type = { n: 'void', d: 0 }; } else type = this.parseType();
    const nameTok = this.cur; const name = this.ident();
    if (this.isOp('(')) {
      const m = this.parseMethodRest(mods, type, name, nameTok.line);
      if (cls.kind === 'interface' && !m.body) m.mods.abstract = true;
      cls.methods.push(m); return;
    }
    // campos
    if (cls.kind === 'interface') { mods.static = true; mods.final = true; }
    let nm = name;
    for (;;) {
      let ft = type, d = 0;
      while (this.isOp('[') && this.isOp(']', 1)) { this.p += 2; d++; }
      if (d) ft = { n: type.n, d: type.d + d, a: type.a };
      let init = null;
      if (this.eatOp('=')) init = this.parseVarInit();
      const f = { name: nm, type: ft, mods, init, line };
      cls.fields.push(f);
      (mods.static ? cls.staticInit : cls.instInit).push({ k: 'field', f, static: !!mods.static });
      if (this.eatOp(',')) { nm = this.ident(); continue; }
      break;
    }
    this.expectOp(';');
  }
  parseMethodRest(mods, type, name, line) {
    if (type === null) {
      if (this.isKw('void')) { this.p++; type = { n: 'void', d: 0 }; } else type = this.parseType();
      line = this.cur.line; name = this.ident();
    }
    const params = this.parseParams();
    while (this.isOp('[') && this.isOp(']', 1)) this.p += 2;
    if (this.eatKw('throws')) { do { this.parseType(); } while (this.eatOp(',')); }
    let body = null;
    if (this.isOp('{')) body = this.parseBlock(); else this.expectOp(';');
    if (!body && !mods.abstract && !mods.native) mods.abstract = true;
    return { k: 'method', name, params, ret: type, mods, body, line, endLine: body ? body.endLine : line };
  }
  parseParams() {
    this.expectOp('('); const ps = [];
    if (!this.isOp(')')) {
      do {
        this.parseModifiers();
        let t = this.parseType(); let va = false;
        if (this.eatOp('...')) { va = true; t = { n: t.n, d: t.d + 1, a: t.a }; }
        const n = this.ident();
        while (this.isOp('[') && this.isOp(']', 1)) { this.p += 2; t = { n: t.n, d: t.d + 1, a: t.a }; }
        ps.push({ t, n, va });
      } while (this.eatOp(','));
    }
    this.expectOp(')'); return ps;
  }

  /* ----- sentencias ----- */
  parseBlock() {
    const line = this.cur.line; this.expectOp('{');
    const body = [];
    while (!this.isOp('}')) {
      if (this.cur.t === 'eof') this.err('reached end of file while parsing');
      body.push(this.parseStatement());
    }
    const endLine = this.cur.line; this.p++;
    return { k: 'block', body, line, endLine };
  }
  isLocalVarDecl() {
    const t = this.cur;
    if (t.t === 'kw' && (PRIMS.has(t.v) || t.v === 'final')) return true;
    if (t.t === 'id') {
      if (t.v === 'var' && this.at(1).t === 'id') return true;
      const save = this.p; let ok = false;
      try {
        this.parseType();
        if (this.cur.t === 'id') {
          const n = this.at(1);
          ok = n.t === 'op' && ['=', ';', ',', ':', '['].includes(n.v);
          if (!ok && n.t !== 'op') ok = true; // "String nombre nombre2" -> error de sintaxis más adelante
        }
      } catch (e) { ok = false; }
      this.p = save; return ok;
    }
    return false;
  }
  parseLocalDecl() {
    const line = this.cur.line; let fin = false;
    while (this.isKw('final')) { fin = true; this.p++; }
    const type = this.parseType(); const decls = [];
    do {
      const nm = this.ident(); let d = 0;
      while (this.isOp('[') && this.isOp(']', 1)) { this.p += 2; d++; }
      let init = null; if (this.eatOp('=')) init = this.parseVarInit();
      decls.push({ name: nm, dims: d, init, line: this.t[this.p - 1].line });
    } while (this.eatOp(','));
    return { k: 'local', type, decls, final: fin, line };
  }
  parseVarInit() { return this.isOp('{') ? this.parseArrayLit() : this.parseExpr(); }
  parseArrayLit() {
    const line = this.cur.line; this.expectOp('{'); const elems = [];
    while (!this.isOp('}')) {
      elems.push(this.parseVarInit());
      if (!this.eatOp(',')) break;
    }
    this.expectOp('}'); return { k: 'arrlit', elems, line };
  }
  parseStatement() {
    const t = this.cur, line = t.line;
    if (t.t === 'op') {
      if (t.v === '{') return this.parseBlock();
      if (t.v === ';') { this.p++; return { k: 'empty', line }; }
    }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'if': {
          this.p++; this.expectOp('('); const c = this.parseExpr(); this.expectOp(')');
          const a = this.parseStatement(); let b = null;
          if (this.eatKw('else')) b = this.parseStatement();
          return { k: 'if', c, a, b, line };
        }
        case 'while': { this.p++; this.expectOp('('); const c = this.parseExpr(); this.expectOp(')'); return { k: 'while', c, body: this.parseStatement(), line }; }
        case 'do': {
          this.p++; const body = this.parseStatement(); this.expectKw('while'); this.expectOp('(');
          const c = this.parseExpr(); this.expectOp(')'); this.expectOp(';'); return { k: 'do', c, body, line };
        }
        case 'for': return this.parseFor();
        case 'return': {
          this.p++; let e = null; if (!this.isOp(';')) e = this.parseExpr(); this.expectOp(';'); return { k: 'return', e, line };
        }
        case 'break': { this.p++; let label = null; if (this.isId()) label = this.ident(); this.expectOp(';'); return { k: 'break', label, line }; }
        case 'continue': { this.p++; let label = null; if (this.isId()) label = this.ident(); this.expectOp(';'); return { k: 'continue', label, line }; }
        case 'throw': { this.p++; const e = this.parseExpr(); this.expectOp(';'); return { k: 'throw', e, line }; }
        case 'try': return this.parseTry();
        case 'switch': {
          const sw = this.parseSwitch(false);
          return sw;
        }
        case 'else': this.err("illegal start of statement ('else' without 'if')"); break;
        case 'case': case 'default': this.err("orphaned " + t.v); break;
        case 'class': case 'interface': case 'enum': case 'abstract': case 'static': {
          const mods = this.parseModifiers(); const cd = this.parseTypeDecl(mods); return { k: 'localclass', cls: cd, line };
        }
        case 'final': {
          if (this.isKw('class', 1)) { const mods = this.parseModifiers(); return { k: 'localclass', cls: this.parseTypeDecl(mods), line }; }
          const d = this.parseLocalDecl(); this.expectOp(';'); return d;
        }
        default: break;
      }
    }
    if (t.t === 'id') {
      if (t.v === 'yield' && !this.isOp('=', 1) && !this.isOp('.', 1) && !this.isOp('(', 1) && !this.isOp('++', 1) && !this.isOp('--', 1)) {
        this.p++; const e = this.parseExpr(); this.expectOp(';'); return { k: 'yield', e, line };
      }
      if (this.isOp(':', 1)) { const label = t.v; this.p += 2; return { k: 'labeled', label, body: this.parseStatement(), line }; }
      if (t.v === 'record' && this.isId(1) && this.isOp('(', 2)) return { k: 'localclass', cls: this.parseTypeDecl({}), line };
    }
    if (this.isLocalVarDecl()) { const d = this.parseLocalDecl(); this.expectOp(';'); return d; }
    const e = this.parseExpr();
    if (!['assign', 'inc', 'call', 'new', 'ctorcall'].includes(e.k)) { throw new CompileError('not a statement', line); }
    this.expectOp(';');
    return { k: 'expr', e, line };
  }
  parseFor() {
    const line = this.cur.line; this.p++; this.expectOp('(');
    let init = null;
    if (!this.isOp(';')) {
      if (this.isLocalVarDecl()) {
        const save = this.p;
        this.parseModifiers(); const type = this.parseType();
        if (this.isId() && this.isOp(':', 1)) {
          const name = this.ident(); this.p++; const iter = this.parseExpr(); this.expectOp(')');
          return { k: 'foreach', type, name, iter, body: this.parseStatement(), line };
        }
        this.p = save; init = [this.parseLocalDecl()];
      } else {
        init = [];
        do { const e = this.parseExpr(); init.push({ k: 'expr', e, line }); } while (this.eatOp(','));
      }
    }
    this.expectOp(';');
    let c = null; if (!this.isOp(';')) c = this.parseExpr(); this.expectOp(';');
    const upd = [];
    if (!this.isOp(')')) do { upd.push(this.parseExpr()); } while (this.eatOp(','));
    this.expectOp(')');
    return { k: 'for', init, c, upd, body: this.parseStatement(), line };
  }
  parseTry() {
    const line = this.cur.line; this.p++;
    let res = null;
    if (this.eatOp('(')) {
      res = [];
      while (!this.isOp(')')) {
        const d = this.parseLocalDecl(); res.push(d); if (!this.eatOp(';')) break;
      }
      this.expectOp(')');
    }
    const block = this.parseBlock(); const catches = []; let fin = null;
    while (this.isKw('catch')) {
      const cl = this.cur.line; this.p++; this.expectOp('('); this.parseModifiers();
      const types = [this.parseType()];
      while (this.eatOp('|')) types.push(this.parseType());
      const name = this.ident(); this.expectOp(')');
      catches.push({ types, name, block: this.parseBlock(), line: cl });
    }
    if (this.eatKw('finally')) fin = this.parseBlock();
    if (!catches.length && !fin && !res) throw new CompileError("'try' without 'catch', 'finally' or resource declarations", line);
    return { k: 'try', res, block, catches, fin, line };
  }
  parseSwitch(isExpr) {
    const line = this.cur.line; this.p++; this.expectOp('(');
    const sel = this.parseExpr(); this.expectOp(')'); this.expectOp('{');
    const cases = []; let arrow = null;
    while (!this.isOp('}')) {
      if (this.cur.t === 'eof') this.err('reached end of file while parsing');
      const cl = this.cur.line; let labels = null;
      if (this.eatKw('default')) labels = null;
      else if (this.eatKw('case')) {
        labels = [];
        do { labels.push(this.parseTernary()); } while (this.eatOp(','));
      } else this.err("case, default, or '}' expected");
      let isArrow;
      if (this.eatOp('->')) isArrow = true; else if (this.eatOp(':')) isArrow = false; else this.err("':' or '->' expected");
      if (arrow === null) arrow = isArrow; else if (arrow !== isArrow) throw new CompileError('different case kinds used in the switch', cl);
      const c = { labels, arrow: isArrow, line: cl };
      if (isArrow) {
        if (this.isOp('{')) c.body = this.parseBlock();
        else if (this.isKw('throw')) c.body = this.parseStatement();
        else { const e = this.parseExpr(); this.expectOp(';'); c.expr = e; }
      } else {
        c.body = [];
        while (!this.isKw('case') && !this.isKw('default') && !this.isOp('}')) {
          if (this.cur.t === 'eof') this.err('reached end of file while parsing');
          c.body.push(this.parseStatement());
        }
      }
      cases.push(c);
    }
    this.expectOp('}');
    return { k: 'switch', sel, cases, arrow: !!arrow, isExpr, line };
  }

  /* ----- expresiones ----- */
  parseExpr() { return this.parseAssign(); }
  isLambdaStart() {
    if (this.isId() && this.isOp('->', 1)) return true;
    if (this.isOp('(')) {
      let d = 0, k = 0;
      for (;;) {
        const t = this.at(k);
        if (t.t === 'eof') return false;
        if (t.t === 'op' && t.v === '(') d++;
        else if (t.t === 'op' && t.v === ')') { d--; if (d === 0) break; }
        k++;
      }
      return this.isOp('->', k + 1);
    }
    return false;
  }
  parseLambda() {
    const line = this.cur.line; const params = [];
    if (this.isId()) params.push(this.ident());
    else {
      this.expectOp('(');
      if (!this.isOp(')')) do {
        this.parseModifiers();
        if (this.isId() && (this.isOp(',', 1) || this.isOp(')', 1))) params.push(this.ident());
        else { this.parseType(); params.push(this.ident()); }
      } while (this.eatOp(','));
      this.expectOp(')');
    }
    this.expectOp('->');
    const body = this.isOp('{') ? this.parseBlock() : this.parseExpr();
    return { k: 'lambda', params, body, line };
  }
  parseAssign() {
    if (this.isLambdaStart()) return this.parseLambda();
    const lhs = this.parseTernary();
    const t = this.cur;
    if (t.t === 'op' && ASSIGN.has(t.v)) {
      if (!['name', 'field', 'index'].includes(lhs.k)) throw new CompileError('unexpected type\n  required: variable\n  found:    value', t.line);
      this.p++; const rhs = this.parseAssign();
      return { k: 'assign', op: t.v, t: lhs, v: rhs, line: t.line };
    }
    // >>= y >>>=
    if (t.t === 'op' && t.v === '>' && this.isOp('>=', 1) && this.at(1).pos === t.pos + 1) {
      this.p += 2; const rhs = this.parseAssign(); return { k: 'assign', op: '>>=', t: lhs, v: rhs, line: t.line };
    }
    return lhs;
  }
  parseTernary() {
    const c = this.parseBin(1);
    if (this.isOp('?')) {
      const line = this.cur.line; this.p++;
      const a = this.parseAssign(); this.expectOp(':');
      const b = this.isLambdaStart() ? this.parseLambda() : this.parseTernary();
      return { k: 'cond', c, a, b, line };
    }
    return c;
  }
  binOp() {
    const t = this.cur;
    if (t.t === 'kw' && t.v === 'instanceof') return { op: 'instanceof', n: 1 };
    if (t.t !== 'op') return null;
    if (t.v === '>') {
      const a = this.at(1);
      if (a.t === 'op' && a.v === '>' && a.pos === t.pos + 1) {
        const b = this.at(2);
        if (b.t === 'op' && b.v === '>' && b.pos === t.pos + 2) { const c = this.at(3); if (c.t === 'op' && c.v === '>=' && c.pos === t.pos + 3) return null; return { op: '>>>', n: 3 }; }
        if (b.t === 'op' && b.v === '>=' && b.pos === t.pos + 2) return null;
        return { op: '>>', n: 2 };
      }
      if (a.t === 'op' && a.v === '>=' && a.pos === t.pos + 1) return null; // >>=
    }
    if (PREC[t.v] !== undefined) return { op: t.v, n: 1 };
    return null;
  }
  parseBin(minPrec) {
    let left = this.parseUnary();
    for (;;) {
      const o = this.binOp(); if (!o) break;
      const prec = PREC[o.op]; if (prec < minPrec) break;
      const line = this.cur.line; this.p += o.n;
      if (o.op === 'instanceof') {
        this.eatKw('final');
        const type = this.parseType(); let bind = null;
        if (this.isId()) bind = this.ident();
        left = { k: 'instof', e: left, type, bind, line }; continue;
      }
      const right = this.parseBin(prec + 1);
      left = { k: 'bin', op: o.op, l: left, r: right, line };
    }
    return left;
  }
  parseUnary() {
    const t = this.cur, line = t.line;
    if (t.t === 'op') {
      if (t.v === '-' || t.v === '+') {
        this.p++; const e = this.parseUnary();
        if (t.v === '-' && e.k === 'lit') {
          if (typeof e.v === 'number') return { k: 'lit', v: (-e.v) | 0, line };
          if (typeof e.v === 'bigint') return { k: 'lit', v: BigInt.asIntN(64, -e.v), line };
          if (e.v && e.v.constructor && e.v.constructor.name === 'Dbl') return { k: 'lit', v: new JV.Dbl(-e.v.v), line };
        }
        return { k: 'unary', op: t.v, e, line };
      }
      if (t.v === '!' || t.v === '~') { this.p++; return { k: 'unary', op: t.v, e: this.parseUnary(), line }; }
      if (t.v === '++' || t.v === '--') {
        this.p++; const e = this.parseUnary();
        if (!['name', 'field', 'index'].includes(e.k)) throw new CompileError('unexpected type\n  required: variable\n  found:    value', line);
        return { k: 'inc', op: t.v, prefix: true, t: e, line };
      }
      if (t.v === '(') {
        const n1 = this.at(1);
        if (n1.t === 'kw' && PRIMS.has(n1.v)) {
          this.p++; const type = this.parseType(); this.expectOp(')');
          return { k: 'cast', type, e: this.parseUnary(), line };
        }
        if (n1.t === 'id') {
          const save = this.p; this.p++;
          try {
            const type = this.parseType();
            if (this.isOp(')')) {
              const nx = this.at(1);
              const ok = nx.t === 'id' || nx.t === 'str' || nx.t === 'chr' || nx.t === 'num' ||
                (nx.t === 'kw' && ['this', 'new', 'super', 'true', 'false', 'null'].includes(nx.v)) ||
                (nx.t === 'op' && (nx.v === '(' || nx.v === '!' || nx.v === '~'));
              if (ok) { this.p++; return { k: 'cast', type, e: this.parseUnary(), line }; }
            }
          } catch (e) { if (!(e instanceof CompileError)) throw e; }
          this.p = save;
        }
      }
    }
    return this.parsePostfix(this.parsePrimary());
  }
  parseArgs() {
    this.expectOp('('); const args = [];
    if (!this.isOp(')')) do { args.push(this.parseExpr()); } while (this.eatOp(','));
    this.expectOp(')'); return args;
  }
  parsePostfix(e) {
    for (;;) {
      const t = this.cur, line = t.line;
      if (this.isOp('.')) {
        this.p++;
        if (this.isOp('<')) this.parseTypeArgs();
        if (this.isKw('new')) { // outer.new Inner()
          const n = this.parsePrimary(); n.outer = e; e = n; continue;
        }
        if (this.isKw('this')) { this.p++; e = { k: 'outerthis', o: e, line }; continue; }
        if (this.isKw('class')) { this.p++; e = { k: 'classlit', o: e, line }; continue; }
        const nameTok = this.cur;
        if (nameTok.t !== 'id') this.err('<identifier> expected');
        this.p++;
        if (this.isOp('(')) e = { k: 'call', o: e, n: nameTok.v, args: this.parseArgs(), line: nameTok.line };
        else e = { k: 'field', o: e, n: nameTok.v, line: nameTok.line };
      } else if (this.isOp('[')) {
        this.p++; const i = this.parseExpr(); this.expectOp(']');
        e = { k: 'index', a: e, i, line };
      } else if (this.isOp('++') || this.isOp('--')) {
        if (!['name', 'field', 'index'].includes(e.k)) break;
        this.p++; e = { k: 'inc', op: t.v, prefix: false, t: e, line };
      } else if (this.isOp('::')) {
        this.p++; const n = this.isKw('new') ? (this.p++, 'new') : this.ident();
        e = { k: 'mref', o: e, n, line };
      } else break;
    }
    return e;
  }
  parsePrimary() {
    const t = this.cur, line = t.line;
    switch (t.t) {
      case 'num': this.p++;
        return { k: 'lit', v: t.kind === 'int' ? t.v : t.kind === 'long' ? t.v : new JV.Dbl(t.v), line };
      case 'str': this.p++; return { k: 'lit', v: t.v, line };
      case 'chr': this.p++; return { k: 'lit', v: new JV.Chr(t.v), line };
      case 'kw':
        switch (t.v) {
          case 'true': this.p++; return { k: 'lit', v: true, line };
          case 'false': this.p++; return { k: 'lit', v: false, line };
          case 'null': this.p++; return { k: 'lit', v: null, line };
          case 'this':
            this.p++;
            if (this.isOp('(')) return { k: 'ctorcall', which: 'this', args: this.parseArgs(), line };
            return { k: 'this', line };
          case 'super':
            this.p++;
            if (this.isOp('(')) return { k: 'ctorcall', which: 'super', args: this.parseArgs(), line };
            if (this.isOp('::')) return { k: 'super', line };
            if (!this.isOp('.')) this.err("'.' expected");
            return { k: 'super', line };
          case 'new': return this.parseNew();
          case 'switch': return this.parseSwitch(true);
          case 'int': case 'double': case 'boolean': case 'char': case 'long': case 'float': case 'byte': case 'short': {
            // int[]::new  o  int.class
            const type = this.parseType();
            if (this.isOp('::')) { return { k: 'name', n: type.n + '[]', line }; }
            this.err("'.class' expected"); break;
          }
          default: break;
        }
        this.err('illegal start of expression'); break;
      case 'id':
        this.p++;
        if (this.isOp('(')) return { k: 'call', o: null, n: t.v, args: this.parseArgs(), line };
        return { k: 'name', n: t.v, line };
      case 'op':
        if (t.v === '(') {
          this.p++; const e = this.parseExpr(); this.expectOp(')');
          return { k: 'paren', e, line };
        }
        this.err('illegal start of expression'); break;
      default:
        this.err('illegal start of expression');
    }
    return null;
  }
  parseNew() {
    const line = this.cur.line; this.p++;
    const t = this.cur; let name, args = null;
    if (t.t === 'kw' && PRIMS.has(t.v)) { name = t.v; this.p++; }
    else if (t.t === 'id') {
      name = t.v; this.p++;
      if (this.isOp('<')) args = this.parseTypeArgs();
      while (this.isOp('.') && this.at(1).t === 'id') { this.p++; name = this.cur.v; this.p++; if (this.isOp('<')) args = this.parseTypeArgs(); }
    } else this.err('<identifier> expected');
    if (this.isOp('[')) {
      const dims = []; let extra = 0;
      while (this.isOp('[')) {
        this.p++;
        if (this.isOp(']')) { this.p++; extra++; }
        else { if (extra) this.err("']' expected"); dims.push(this.parseExpr()); this.expectOp(']'); }
      }
      let init = null;
      if (this.isOp('{')) { if (dims.length) this.err("';' expected"); init = this.parseArrayLit(); }
      else if (!dims.length) throw new CompileError('array dimension missing', line);
      return { k: 'newarr', et: { n: name, d: 0 }, dims, extra, init, line };
    }
    if (!this.isOp('(')) this.err("'(' or '[' expected");
    const cargs = this.parseArgs(); let body = null;
    if (this.isOp('{')) {
      body = this.newClass('', 'class', {}, line); body.anonymous = true; body.superName = name; body.id = ++this.anon;
      this.parseClassBody(body);
    }
    return { k: 'new', type: { n: name, d: 0, a: args }, args: cargs, body, line };
  }
}

JV.parse = function (src, line0) { return new Parser(lex(src, line0)).parseProgram(); };
})(globalThis);

