/* Editor de código sencillo con resaltado de sintaxis de Java */
(function (G) {
'use strict';
const KEYWORDS = new Set(('abstract boolean break byte case catch char class continue default do double else enum extends final finally float for if ' +
  'implements import instanceof int interface long new package private protected public return short static super switch this throw throws try void while var record').split(' '));
const LITERALS = new Set(['true', 'false', 'null']);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function highlight(code) {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?)|('(?:\\.|[^'\\\n])*'?)|(@\w+)|\b(\d+(?:\.\d+)?[LlFfDd]?)\b|\b([A-Za-z_]\w*)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index)); last = re.lastIndex;
    if (m[1]) out += '<span class="c">' + esc(m[1]) + '</span>';
    else if (m[2] || m[3]) out += '<span class="s">' + esc(m[0]) + '</span>';
    else if (m[4]) out += '<span class="a">' + esc(m[4]) + '</span>';
    else if (m[5]) out += '<span class="n">' + esc(m[5]) + '</span>';
    else {
      const w = m[6];
      if (KEYWORDS.has(w)) out += '<span class="k">' + w + '</span>';
      else if (LITERALS.has(w)) out += '<span class="n">' + w + '</span>';
      else if (/^[A-Z]/.test(w)) out += '<span class="t">' + w + '</span>';
      else if (code[last] === '(') out += '<span class="f">' + w + '</span>';
      else out += w;
    }
  }
  return out + esc(code.slice(last));
}
G.highlightJava = highlight;

const LH = 21; // alto de línea en px (debe coincidir con el CSS)

G.createEditor = function (host, opts) {
  opts = opts || {};
  host.classList.add('editor');
  host.innerHTML = '<div class="gutter"><div class="gutter-in"></div></div><div class="code-wrap"><pre class="hl" aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"></textarea></div>';
  const gutter = host.querySelector('.gutter-in'), pre = host.querySelector('.hl'), ta = host.querySelector('textarea');
  let errLine = 0;
  function render() {
    const code = ta.value;
    pre.innerHTML = (errLine ? '<span class="errline" style="top:' + (10 + (errLine - 1) * LH) + 'px"></span>' : '') + highlight(code) + '\n ';
    const n = code.split('\n').length; let g = '';
    for (let i = 1; i <= n; i++) g += '<div class="' + (i === errLine ? 'err' : '') + '">' + i + '</div>';
    gutter.innerHTML = g;
    sync();
  }
  function sync() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gutter.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)'; }
  ta.addEventListener('scroll', sync);
  ta.addEventListener('input', () => { errLine = 0; render(); if (opts.onChange) opts.onChange(ta.value); });
  ta.addEventListener('keydown', e => {
    const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
    const edit = (text, from, to, caret) => { ta.focus(); ta.setSelectionRange(from, to); if (!document.execCommand || !document.execCommand('insertText', false, text)) { ta.value = v.slice(0, from) + text + v.slice(to); } ta.setSelectionRange(caret, caret); errLine = 0; render(); if (opts.onChange) opts.onChange(ta.value); };
    if (e.key === 'Tab') {
      e.preventDefault();
      if (s !== en && v.slice(s, en).includes('\n')) { // sangrar/desangrar bloque
        const ls = v.lastIndexOf('\n', s - 1) + 1; const blk = v.slice(ls, en);
        const nb = e.shiftKey ? blk.replace(/^ {1,4}/gm, '') : blk.replace(/^/gm, '    ');
        edit(nb, ls, en, ls + nb.length); ta.setSelectionRange(ls, ls + nb.length);
      } else if (e.shiftKey) {
        const ls = v.lastIndexOf('\n', s - 1) + 1; const m = /^ {1,4}/.exec(v.slice(ls));
        if (m) edit('', ls, ls + m[0].length, Math.max(ls, s - m[0].length));
      } else edit('    ', s, en, s + 4);
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s); const ind = /^\s*/.exec(line)[0];
      const prev = v[s - 1], next = v[en];
      if (prev === '{' && next === '}') { const t = '\n' + ind + '    \n' + ind; edit(t, s, en, s + 1 + ind.length + 4); }
      else edit('\n' + ind + (prev === '{' ? '    ' : ''), s, en, s + 1 + ind.length + (prev === '{' ? 4 : 0));
    } else if (e.key === '}' && /^\s+$/.test(v.slice(v.lastIndexOf('\n', s - 1) + 1, s)) && s === en) {
      const ls = v.lastIndexOf('\n', s - 1) + 1; const ind = v.slice(ls, s);
      if (ind.length >= 4) { e.preventDefault(); edit('}', ls, s, ls + ind.length - 4 + 1); }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (opts.onRun) opts.onRun(); }
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); api.format(); }
    else if (e.ctrlKey && (e.key === ' ' || e.code === 'Space')) {   // Ctrl+Espacio: plantillas como en Eclipse (main, sysout, for, if...)
      e.preventDefault();
      const m = /[A-Za-z_]+$/.exec(v.slice(0, s)); if (!m) return; const t = G.JQ_TEMPLATES(m[0], v); if (!t) return;
      const ls = v.lastIndexOf('\n', s - 1) + 1, ind = /^\s*/.exec(v.slice(ls, s))[0], from = s - m[0].length;
      const lines = t.split('\n').map((l, i) => i ? ind + l : l), full = lines.join('\n'), k = full.indexOf('|'), body = full.replace('|', '');
      edit(body, from, en, from + (k < 0 ? body.length : k));
    }
  });
  const api = {
    get: () => ta.value,
    set: v => { ta.value = v; errLine = 0; render(); ta.scrollTop = 0; ta.scrollLeft = 0; sync(); },
    setError: n => { errLine = n || 0; render(); if (n) { const top = (n - 1) * LH; if (top < ta.scrollTop || top > ta.scrollTop + ta.clientHeight - 2 * LH) ta.scrollTop = Math.max(0, top - 3 * LH); sync(); } },
    focus: () => ta.focus(), el: ta,
    format: () => {   // reordena el código (Ctrl+Shift+F); se puede deshacer con Ctrl+Z
      const v = ta.value, nv = window.JQ_FORMAT(v); if (nv === v) return;
      const line = v.slice(0, ta.selectionStart).split('\n').length - 1; ta.focus(); ta.setSelectionRange(0, v.length);
      if (!document.execCommand || !document.execCommand('insertText', false, nv)) ta.value = nv;
      const nl = nv.split('\n'); let pos = 0; for (let i = 0; i < Math.min(line, nl.length - 1); i++) pos += nl[i].length + 1; pos += (nl[Math.min(line, nl.length - 1)] || '').length;
      ta.setSelectionRange(pos, pos); errLine = 0; render(); if (opts.onChange) opts.onChange(ta.value);
    }
  };
  render();
  return api;
};
/* Ctrl+Shift+F (Eclipse): reordena la sangría según las llaves, quita espacios sobrantes y junta líneas en blanco repetidas */
window.JQ_FORMAT = function (src) {
  const lines = src.replace(/\r/g, '').split('\n'), out = []; let stack = [], inBlock = false, blank = 0;
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) { if (++blank <= 1 && out.length) out.push(''); continue; } blank = 0;
    // texto «estructural»: sin cadenas, caracteres ni comentarios
    let s = '', i = 0;
    while (i < t.length) {
      if (inBlock) { const e = t.indexOf('*/', i); if (e < 0) { i = t.length; } else { inBlock = false; i = e + 2; } continue; }
      const c = t[i];
      if (c === '/' && t[i + 1] === '/') break;
      if (c === '/' && t[i + 1] === '*') { inBlock = true; i += 2; continue; }
      if (c === '"' || c === "'") { const q = c; i++; while (i < t.length && t[i] !== q) { if (t[i] === '\\') i++; i++; } i++; s += 'x'; continue; }
      s += c; i++;
    }
    const startsInComment = inBlock && !s.trim() && !t.startsWith('/*');
    const sw = () => stack.filter(k => k === 'S').length;
    s = s.trim(); const lead = (/^\}+/.exec(s) || [''])[0].length; for (let k = 0; k < lead; k++) stack.pop();
    let level = stack.length + sw();
    if (/^(case\b|default\s*:)/.test(t) && stack[stack.length - 1] === 'S') level -= 1;
    out.push('    '.repeat(Math.max(0, level)) + (startsInComment ? ' ' : '') + t);
    // llaves restantes de la línea
    let before = '';
    for (let k = lead; k < s.length; k++) {
      if (s[k] === '{') { stack.push(/\bswitch\s*\([^)]*\)\s*$/.test(before) ? 'S' : 'B'); before = ''; }
      else if (s[k] === '}') { stack.pop(); before = ''; }
      else before += s[k];
    }
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n') + '\n';
};
/* plantillas de Ctrl+Espacio (el «|» marca dónde queda el cursor) */
window.JQ_TEMPLATES = function (word, code) {
  const hasClass = /\bclass\s+\w+/.test(code);
  const T = {
    main: hasClass ? 'public static void main(String[] args) {\n    |\n}' : 'public class Main {\n    public static void main(String[] args) {\n        |\n    }\n}',
    sysout: 'System.out.println(|);', syso: 'System.out.println(|);', sout: 'System.out.println(|);',
    fori: 'for (int i = 0; i < |; i++) {\n    \n}', for: 'for (int i = 0; i < |; i++) {\n    \n}',
    foreach: 'for (String s : |) {\n    \n}', while: 'while (|) {\n    \n}',
    if: 'if (|) {\n    \n}', ifelse: 'if (|) {\n    \n} else {\n    \n}',
    switch: 'switch (|) {\n    case 1:\n        break;\n    default:\n        break;\n}',
    try: 'try {\n    |\n} catch (Exception e) {\n    e.printStackTrace();\n}',
    class: 'public class |Nombre {\n    \n}'
  };
  return T[word] || null;
};
})(window);
