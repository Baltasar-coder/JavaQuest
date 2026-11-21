/* Armas ilustradas para la vista en primera persona.
   Cada hoja (assets/weapons/sheet_<nombre>.jpg) es una cuadrícula de 4x3 fotogramas con el «tablero de transparencia» pintado dentro del JPG.
   Se elige un fotograma limpio, se quita el tablero y se recorta. */
(function (G) {
'use strict';
const FRAMES = {   // fila y columna del fotograma correcto de cada hoja
  sword: { r: 0, c: 1 }, staff_purple: { r: 0, c: 1, glow: true }, axe: { r: 0, c: 1 }, staff_teal: { r: 0, c: 1, glow: true }, bow: { r: 0, c: 0 },
  sword_shield: { r: 2, c: 0 }, lute: { r: 0, c: 0 }
};
const READY = {}, WAIT = {};
G.JQ_WEAPON = READY;
G.whenWeapon = (key, cb) => { if (READY[key]) cb(READY[key]); else (WAIT[key] = WAIT[key] || []).push(cb); };

function keySheet(im, fr) {
  const w = im.width, h = im.height, cw = Math.floor(w / 4), ch = Math.floor(h / 3), x0 = fr.c * cw, y0 = fr.r * ch;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d'); c.drawImage(im, x0, y0, cw, ch, 0, 0, cw, ch);
  let img; try { img = c.getImageData(0, 0, cw, ch); } catch (e) { return cv; }
  const d = img.data, cand = new Uint8Array(cw * ch);
  // fondo = gris neutro (r≈g≈b) y no muy claro; las armas son azuladas, marrones o muy claras
  for (let i = 0; i < cw * ch; i++) { const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], m = Math.max(r, g, b); cand[i] = (m - Math.min(r, g, b) <= 6 && m < 128) ? 1 : 0; }
  for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) {
    const i = y * cw + x; if (!cand[i]) continue; let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += cand[i + dy * cw + dx];
    if (n >= 6) d[i * 4 + 3] = 0;
  }
  if (fr.glow) {
    // resplandor semitransparente (azul/violeta/turquesa) sobre el gris del JPG: se separa el gris y se deja solo el color como halo suave
    for (let i = 0; i < cw * ch; i++) {
      if (d[i * 4 + 3] === 0) continue;
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sp = mx - mn;
      if (b < r || mx >= 175 || sp < 3) continue;   // madera (rojiza), brillos casi blancos y grises puros se dejan
      const a = Math.max(0, Math.min(1, (sp - 9) / 34)), base = Math.max(r - mn, g - mn, b - mn) || 1, k = Math.min(255 / base, 2.1);
      if (a < 1) { d[i * 4] = Math.min(255, (r - mn) * k); d[i * 4 + 1] = Math.min(255, (g - mn) * k); d[i * 4 + 2] = Math.min(255, (b - mn) * k); d[i * 4 + 3] = Math.round(a * 255); }
    }
  }
  {   // limpieza: quita motas aisladas y suaviza los bordes semitransparentes (halo del brillo)
    const A = new Uint8Array(cw * ch); for (let i = 0; i < cw * ch; i++) A[i] = d[i * 4 + 3];
    for (let y = 2; y < ch - 2; y++) for (let x = 2; x < cw - 2; x++) {
      const i = y * cw + x; if (!A[i]) continue; let n = 0, s = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const v = A[i + dy * cw + dx]; if (v > 40) n++; }
      if (n < 9) { d[i * 4 + 3] = 0; continue; }
      if (fr.glow && A[i] < 255) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += A[i + dy * cw + dx]; d[i * 4 + 3] = Math.round(s / 9); }
    }
  }
  for (let x = 0; x < cw; x++) { d[x * 4 + 3] = 0; d[((ch - 1) * cw + x) * 4 + 3] = 0; } for (let y = 0; y < ch; y++) { d[y * cw * 4 + 3] = 0; d[(y * cw + cw - 1) * 4 + 3] = 0; }
  c.putImageData(img, 0, 0);
  // recorte al contenido
  let bx0 = cw, by0 = ch, bx1 = 0, by1 = 0;
  for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (d[(y * cw + x) * 4 + 3] > 40) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
  if (bx1 <= bx0 || by1 <= by0) return cv;
  const out = document.createElement('canvas'); out.width = bx1 - bx0 + 1; out.height = by1 - by0 + 1; out.getContext('2d').drawImage(cv, bx0, by0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
Object.keys(FRAMES).forEach(key => {
  const im = new Image();
  im.onload = () => {
    const cv = keySheet(im, FRAMES[key]); let url = null; try { url = cv.toDataURL('image/png'); } catch (e) { url = null; }
    if (!url) return; READY[key] = url; (WAIT[key] || []).forEach(cb => cb(url)); WAIT[key] = [];
  };
  im.src = 'assets/weapons/sheet_' + key + '.jpg';
});
})(window);
