/* Modelos 3D de bajo polígono (Three.js): héroe y monstruos, con animación procedural */
(function (G) {
'use strict';
const T = G.THREE; if (!T) return;
const M = {};
const mats = [];
let TOON = null;
const gradient = () => { if (!TOON) { TOON = new T.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, T.LuminanceFormat); TOON.minFilter = TOON.magFilter = T.NearestFilter; TOON.needsUpdate = true; } return TOON; };
const mat = (c, o) => { const p = { color: c, gradientMap: gradient() }; if (o && o.emissive) { p.emissive = o.emissive; p.emissiveIntensity = o.emissiveIntensity || 1; } const m = new T.MeshToonMaterial(p); if (o && o.emissive) m._glow = true; mats.push(m); return m; };
const add = (p, mesh, x, y, z) => { mesh.position.set(x || 0, y || 0, z || 0); p.add(mesh); return mesh; };
const box = (p, w, h, d, c, x, y, z, o) => add(p, new T.Mesh(new T.BoxGeometry(w, h, d), mat(c, o)), x, y, z);
const sph = (p, r, c, x, y, z, sx, sy, sz, o) => { const m = add(p, new T.Mesh(new T.SphereGeometry(r, 10, 8), mat(c, o)), x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); return m; };
const cone = (p, r, h, c, x, y, z, rx, rz) => { const m = add(p, new T.Mesh(new T.ConeGeometry(r, h, 6), mat(c)), x, y, z); m.rotation.x = rx || 0; m.rotation.z = rz || 0; return m; };
const cyl = (p, r1, r2, h, c, x, y, z, o) => add(p, new T.Mesh(new T.CylinderGeometry(r1, r2, h, 8), mat(c, o)), x, y, z);
// miembro articulado: pivote en la articulación, geometría colgando hacia abajo
const limb = (p, x, y, z, w, h, d, c) => { const g = new T.Group(); g.position.set(x, y, z); box(g, w, h, d, c, 0, -h / 2, 0); p.add(g); return g; };
const eyes = (p, c, x, y, z, sep, r) => { [-1, 1].forEach(s => sph(p, r || .04, c, x + s * sep, y, z, 1, 1, 1, { emissive: c, emissiveIntensity: .9 })); };
const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'], HAIR = ['#3b2314', '#d4a017', '#1a1a1a', '#b5451b', '#e8e8e8'];

function weapon(p, kind, c) {
  const g = new T.Group(); p.add(g); g.position.set(0, -.62, .1);
  if (kind === '🪄') { cyl(g, .025, .03, .9, '#6b4423', 0, .3, 0); sph(g, .09, c, 0, .8, 0, 1, 1, 1, { emissive: c, emissiveIntensity: 1 }); }
  else if (kind === '🏹') { const b = new T.Mesh(new T.TorusGeometry(.4, .025, 6, 14, Math.PI), mat('#8b5a2b')); b.rotation.z = -Math.PI / 2; add(g, b, 0, .3, 0); box(g, .01, .8, .01, '#ddd', -0.0, .3, 0); }
  else if (kind === '🔨') { cyl(g, .03, .03, .8, '#6b4423', 0, .25, 0); box(g, .3, .22, .22, '#9aa0a6', 0, .7, 0); }
  else if (kind === '🪓') { cyl(g, .03, .03, .85, '#6b4423', 0, .25, 0); box(g, .28, .3, .05, '#c0c6cc', .15, .65, 0); }
  else { box(g, .05, .75, .02, '#e5e7eb', 0, .55, 0, { metalness: .6, roughness: .3 }); box(g, .22, .05, .06, '#c9a227', 0, .17, 0); box(g, .05, .16, .05, '#4b2e1a', 0, .07, 0); }
  g.rotation.x = Math.PI / 2.3; return g;
}

M.hero = look => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const ai = Math.max(0, look.avatarIdx || 0);
  const skin = SKIN[ai % 5], col = look.color || '#a78bfa';
  const legL = limb(g, -.12, .55, 0, .17, .55, .2, '#2b2a3a'), legR = limb(g, .12, .55, 0, .17, .55, .2, '#2b2a3a');
  box(legL, .2, .1, .28, '#1a1a1a', 0, -.55, .04); box(legR, .2, .1, .28, '#1a1a1a', 0, -.55, .04);
  box(g, .5, .6, .3, col, 0, .85, 0);                                  // torso
  box(g, .52, .08, .32, '#6b4423', 0, .58, 0);                         // cinturón
  box(g, .56, .75, .06, col, 0, .78, -.2, { roughness: .6 });          // capa
  const armL = limb(g, -.34, 1.1, 0, .14, .5, .14, skin), armR = limb(g, .34, 1.1, 0, .14, .5, .14, skin);
  box(armL, .17, .2, .17, col, 0, -.1, 0); box(armR, .17, .2, .17, col, 0, -.1, 0);
  const head = new T.Group(); head.position.set(0, 1.35, 0); g.add(head);
  sph(head, .2, skin, 0, .1, 0); sph(head, .215, HAIR[ai % 5], 0, .16, -.03, 1, .85, 1);
  eyes(head, '#222', 0, .12, .18, .08, .025);
  weapon(armR, look.weapon, col);
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs: [legL, legR], arms: [armL], atkArm: armR, head }, baseY: 0, mats: null };
  root.scale.setScalar(1.05); return root;
};

M.goblin = () => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const green = '#5a9e3d', dk = '#3b6e27';
  const legL = limb(g, -.1, .38, 0, .13, .38, .14, dk), legR = limb(g, .1, .38, 0, .13, .38, .14, dk);
  box(g, .4, .42, .26, '#6b4a2b', 0, .6, 0); box(g, .42, .16, .28, '#4a3320', 0, .42, 0);
  const armL = limb(g, -.27, .78, 0, .11, .38, .11, green), armR = limb(g, .27, .78, 0, .11, .38, .11, green);
  const head = new T.Group(); head.position.set(0, .98, 0); g.add(head);
  sph(head, .26, green, 0, .1, 0, 1, .95, 1); [-1, 1].forEach(s => cone(head, .07, .36, green, s * .3, .16, 0, 0, -s * 1.35));
  eyes(head, '#ffe14d', 0, .15, .22, .1, .05); box(head, .1, .06, .06, dk, 0, .04, .26); box(head, .2, .03, .05, '#222', 0, -.05, .24);
  const dag = new T.Group(); armR.add(dag); dag.position.set(0, -.4, .05); box(dag, .04, .32, .02, '#d0d4d8', 0, .15, 0); dag.rotation.x = Math.PI / 2.4;
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs: [legL, legR], arms: [armL], atkArm: armR, head }, baseY: 0 };
  return root;
};
M.thief = () => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const cl = '#34364a';
  const legL = limb(g, -.11, .5, 0, .15, .5, .17, '#222331'), legR = limb(g, .11, .5, 0, .15, .5, .17, '#222331');
  box(g, .46, .62, .28, cl, 0, .82, 0); box(g, .5, .1, .3, '#7c5a2a', 0, .56, 0); box(g, .5, .5, .06, '#26283a', 0, .7, -.18);
  const armL = limb(g, -.31, 1.05, 0, .13, .5, .13, cl), armR = limb(g, .31, 1.05, 0, .13, .5, .13, cl);
  const head = new T.Group(); head.position.set(0, 1.28, 0); g.add(head);
  sph(head, .2, '#d9b38c', 0, .1, 0); cone(head, .24, .34, cl, 0, .3, -.03); box(head, .3, .09, .02, '#111', 0, .1, .19); box(head, .38, .13, .3, cl, 0, .0, .02);
  eyes(head, '#fff', 0, .11, .2, .07, .02);
  [-1, 1].forEach(s => { const d = new T.Group(); (s < 0 ? armL : armR).add(d); d.position.set(0, -.45, .05); box(d, .035, .3, .02, '#cfd3d8', 0, .15, 0); d.rotation.x = Math.PI / 2.3; });
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs: [legL, legR], arms: [armL], atkArm: armR, head }, baseY: 0 };
  return root;
};
M.humanoid = () => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const robe = '#8a3b3b';
  const legL = limb(g, -.12, .55, 0, .17, .55, .2, '#4a3a2a'), legR = limb(g, .12, .55, 0, .17, .55, .2, '#4a3a2a');
  box(g, .52, .64, .32, robe, 0, .88, 0); box(g, .54, .1, .34, '#222', 0, .6, 0); cone(g, .36, .55, robe, 0, .42, 0, 0, 0).scale.set(1, .8, .75);
  const armL = limb(g, -.35, 1.12, 0, .15, .52, .15, robe), armR = limb(g, .35, 1.12, 0, .15, .52, .15, robe);
  const head = new T.Group(); head.position.set(0, 1.4, 0); g.add(head);
  sph(head, .2, '#d8a47f', 0, .1, 0); sph(head, .22, '#5a5a5a', 0, .17, -.03, 1, .8, 1); box(head, .2, .22, .12, '#6e6e6e', 0, -.06, .12);
  eyes(head, '#222', 0, .12, .19, .08, .025);
  const st = new T.Group(); armR.add(st); st.position.set(0, -.5, .08); cyl(st, .03, .03, 1.1, '#5a3d22', 0, .3, 0); sph(st, .1, '#6ee7ff', 0, .88, 0, 1, 1, 1, { emissive: '#22d3ee', emissiveIntensity: 1 });
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs: [legL, legR], arms: [armL], atkArm: armR, head }, baseY: 0 };
  return root;
};
M.skeleton = look => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const bone = '#e8e2cf', cr = look && look.crown;
  const legL = limb(g, -.1, .55, 0, .08, .55, .08, bone), legR = limb(g, .1, .55, 0, .08, .55, .08, bone);
  box(g, .1, .12, .12, bone, 0, .55, 0); box(g, .12, .55, .08, bone, 0, .85, 0); for (let i = 0; i < 4; i++) box(g, .42 - i * .03, .045, .2, bone, 0, .98 - i * .1, .02);
  const armL = limb(g, -.27, 1.1, 0, .07, .5, .07, bone), armR = limb(g, .27, 1.1, 0, .07, .5, .07, bone);
  const head = new T.Group(); head.position.set(0, 1.3, 0); g.add(head);
  sph(head, .2, bone, 0, .12, 0, 1, 1.05, 1); box(head, .22, .1, .2, bone, 0, -.06, .02); eyes(head, '#111', 0, .14, .17, .08, .06);
  box(head, .06, .05, .03, '#111', 0, .04, .2);
  if (cr) { cyl(head, .2, .22, .1, '#f5c542', 0, .3, 0, { metalness: .6 }); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cone(head, .04, .12, '#f5c542', Math.cos(a) * .2, .4, Math.sin(a) * .2); } }
  const sw = new T.Group(); armR.add(sw); sw.position.set(0, -.5, .05); box(sw, .05, .7, .02, '#8f9aa5', 0, .35, 0, { metalness: .5 }); box(sw, .2, .04, .05, '#555', 0, .02, 0); sw.rotation.x = Math.PI / 2.4;
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs: [legL, legR], arms: [armL], atkArm: armR, head }, baseY: 0 };
  if (cr) root.scale.setScalar(1.35); return root;
};
M.troll = () => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const sk = '#6f8f66', dk = '#4d6847';
  const legL = limb(g, -.22, .6, 0, .3, .6, .32, dk), legR = limb(g, .22, .6, 0, .3, .6, .32, dk);
  box(g, .95, .85, .6, sk, 0, 1.0, 0); box(g, .98, .22, .62, '#6b4a2b', 0, .64, 0); sph(g, .25, sk, 0, 1.2, .26, 1.4, 1, .6);
  const armL = limb(g, -.62, 1.3, 0, .26, .85, .26, sk), armR = limb(g, .62, 1.3, 0, .26, .85, .26, sk);
  const head = new T.Group(); head.position.set(0, 1.62, .08); g.add(head);
  sph(head, .26, sk, 0, .1, 0, 1.1, .9, 1); box(head, .34, .18, .12, dk, 0, -.06, .2); [-1, 1].forEach(s => { box(head, .06, .14, .06, '#f1ead2', s * .13, -.04, .24); cone(head, .05, .16, '#f1ead2', s * .2, .3, 0); });
  eyes(head, '#ffb347', 0, .16, .24, .1, .045);
  const club = new T.Group(); armR.add(club); club.position.set(0, -.85, .1); cyl(club, .06, .1, .9, '#6b4423', 0, .3, 0); cyl(club, .17, .1, .4, '#7a5230', 0, .85, 0); club.rotation.x = Math.PI / 2.5;
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs: [legL, legR], arms: [armL], atkArm: armR, head }, baseY: 0 };
  root.scale.setScalar(1.25); return root;
};
M.wolf = () => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const fur = '#7b7f86', dk = '#53565c';
  const mk = (x, z) => limb(g, x, .5, z, .13, .5, .13, dk);
  const legs = [mk(-.18, .42), mk(.18, .42), mk(-.18, -.42), mk(.18, -.42)];
  sph(g, .32, fur, 0, .68, 0, .85, .8, 1.9); sph(g, .26, fur, 0, .74, .38, 1, 1, 1);
  const head = new T.Group(); head.position.set(0, .8, .68); g.add(head);
  sph(head, .22, fur, 0, 0, 0, 1, .9, 1.1); box(head, .17, .13, .32, dk, 0, -.06, .26); box(head, .08, .04, .06, '#111', 0, -.0, .43);
  [-1, 1].forEach(s => cone(head, .07, .2, dk, s * .13, .22, -.05)); eyes(head, '#ff3b30', 0, .07, .19, .1, .035);
  box(head, .15, .03, .26, '#fff', 0, -.13, .27);
  const tail = new T.Group(); tail.position.set(0, .8, -.62); g.add(tail); cone(tail, .09, .6, fur, 0, -.05, -.25, -Math.PI / 2.6);
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs, arms: [], atkArm: null, head, tail, quad: true }, baseY: 0 };
  root.scale.setScalar(1.1); return root;
};
M.dragon = () => {
  const root = new T.Group(), g = new T.Group(); root.add(g); const sc = '#b3322b', dk = '#7a1f1b', bel = '#e0b25a';
  const mk = (x, z) => { const l = limb(g, x, .8, z, .22, .8, .24, dk); box(l, .28, .1, .36, '#2a1210', 0, -.8, .08); return l; };
  const legs = [mk(-.4, .55), mk(.4, .55), mk(-.4, -.5), mk(.4, -.5)];
  sph(g, .62, sc, 0, 1.2, 0, 1, .85, 1.7); box(g, .5, .08, 1.4, bel, 0, .78, 0);
  for (let i = 0; i < 5; i++) cone(g, .09, .22, dk, 0, 1.78 - Math.abs(i - 2) * .06, -.6 + i * .3);
  const neck = new T.Group(); neck.position.set(0, 1.4, .85); g.add(neck); cyl(neck, .2, .28, .8, sc, 0, .3, .18).rotation.x = .5;
  const head = new T.Group(); head.position.set(0, 1.9, 1.2); g.add(head);
  sph(head, .3, sc, 0, 0, 0, 1, .9, 1.2); box(head, .3, .2, .5, dk, 0, -.1, .38); [-1, 1].forEach(s => { cone(head, .07, .4, '#e8dfc8', s * .17, .35, -.1, -.5); box(head, .04, .08, .04, '#fff', s * .1, -.22, .6); });
  eyes(head, '#ffd23f', 0, .1, .28, .15, .06);
  const tail = new T.Group(); tail.position.set(0, 1.1, -1.0); g.add(tail); cone(tail, .3, 1.8, sc, 0, 0, -.8, -Math.PI / 2.3);
  const wings = [-1, 1].map(s => { const w = new T.Group(); w.position.set(s * .5, 1.7, -.1); g.add(w); const a = box(w, 1.7, .05, .9, dk, s * .85, .2, -.1); a.rotation.z = s * .25; box(w, .08, .08, .1, '#2a1210', s * .1, 0, 0); return w; });
  root.userData = { root: g, anim: { walk: 0, atk: 0, dead: 0, hit: 0 }, parts: { legs, arms: [], atkArm: null, head, tail, wings, quad: true }, baseY: 0 };
  root.scale.setScalar(1.15); return root;
};

const OUTLINE = new T.MeshBasicMaterial({ color: 0x140c1c, side: T.BackSide });
M.create = (kind, look) => {
  const m = (M[kind] || M.goblin)(look || {}); const P = m.userData.parts;
  if (P.head) { P.head.scale.setScalar(P.quad ? 1.2 : 1.55); if (!P.quad) P.head.position.y += .07; }   // cabezas grandes, estilo chibi
  const meshes = []; m.traverse(o => { if (o.isMesh && !o.material._glow) meshes.push(o); });
  meshes.forEach(o => { const ol = new T.Mesh(o.geometry, OUTLINE); ol.scale.setScalar(1.1); o.add(ol); });   // contorno de dibujo animado
  m.userData.key = kind === 'hero' ? 'hero_' + ((look && look.hero) || 'warrior_f') : kind; m.userData.look = look || {}; m.userData.baseScale = m.scale.x || 1;
  return m;
};
M.naga = M.dragon; M.arachne = M.wolf; M.zombie = M.skeleton;

/* ---- personajes ilustrados: figuras planas (billboards) dentro del escenario 3D ---- */
const BBH = { hero: 1.75, goblin: 1.3, wolf: 1.15, troll: 2.1, skeleton: 1.65, humanoid: 1.75, thief: 1.65, dragon: 2.3, naga: 2.2, arachne: 1.75, zombie: 1.7 };
M.bbHeight = key => BBH[key.indexOf('hero') === 0 ? 'hero' : key] || 1.5;
const TEX = {}, SHADOW = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .34, depthWrite: false });
function tryAttach(m) {
  const u = m.userData, S = G.JQ_SPR && G.JQ_SPR[u.key]; if (!S) return false;
  const tex = TEX[u.key] || (TEX[u.key] = new T.CanvasTexture(S.im)); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const H = M.bbHeight(u.key), Wd = H * S.box.w / S.box.h, holder = new T.Group(), pivot = new T.Group();
  const geo = new T.PlaneGeometry(Wd, H); geo.translate(0, H / 2, 0);
  const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .04, side: T.DoubleSide }), mesh = new T.Mesh(geo, mat); pivot.add(mesh); holder.add(pivot);
  const sh = new T.Mesh(new T.CircleGeometry(.5, 24), SHADOW); sh.rotation.x = -Math.PI / 2; sh.scale.set(Math.min(Wd * .5, 1.3), .38, 1); sh.position.y = .015; holder.add(sh);
  if (u.look && u.look.color && u.key.indexOf('hero') === 0) { const au = new T.Mesh(new T.RingGeometry(.42, .62, 28), new T.MeshBasicMaterial({ color: u.look.color, transparent: true, opacity: .75, depthWrite: false })); au.rotation.x = -Math.PI / 2; au.position.y = .02; au.scale.set(1, 1, 1); holder.add(au); u.aura = au; }
  holder.scale.setScalar(1 / u.baseScale); m.add(holder); u.root.visible = false; u.bb = { pivot, mesh, mat, holder }; return true;
}
function poseBB(m, now) {
  const u = m.userData, a = u.anim, b = u.bb, fs = Math.sin(m.rotation.y); if (Math.abs(fs) > .3) u.face = fs > 0 ? 1 : -1; m.rotation.y = 0; const f = u.face || 1;
  if (M.cam) b.mesh.rotation.y = Math.atan2(M.cam.position.x - m.position.x, M.cam.position.z - m.position.z);
  const hop = Math.abs(Math.sin(now / 105)) * .16 * a.walk, sq = Math.sin(now / 330) * .03 * (1 - a.walk);
  b.pivot.position.y = hop - a.dead * .1; b.pivot.scale.set(f * (1 - sq) * (1 + a.hit * .05), (1 + sq) * (1 - a.hit * .06), 1);
  b.pivot.rotation.z = -f * (Math.sin(a.atk * Math.PI) * .35 + Math.sin(now / 105) * .05 * a.walk) - f * a.dead * 1.45;
  b.mat.color.setRGB(1, 1 - a.hit * .65, 1 - a.hit * .65); b.mat.opacity = 1 - a.dead * .55;
  if (u.aura) u.aura.scale.setScalar(1 + Math.sin(now / 300) * .06);
}
const bump = k => k < .2 ? .9 * (k / .2) : k < .55 ? .9 - (k - .2) / .35 * 2.9 : -2.0 * (1 - (k - .55) / .45);

/* Pose procedural; llamar cada fotograma */
M.pose = (m, now) => {
  if (m.userData.key && !m.userData.bb) tryAttach(m);
  if (m.userData.bb) { poseBB(m, now); return; }
  const u = m.userData, a = u.anim, P = u.parts, w = a.walk, s = Math.sin(now / 105) * .75 * w;
  if (P.quad) P.legs.forEach((l, i) => { l.rotation.x = ((i === 0 || i === 3) ? s : -s) * .8; });
  else P.legs.forEach((l, i) => { l.rotation.x = i % 2 ? -s : s; });
  P.arms.forEach((ar, i) => { ar.rotation.x = (i % 2 ? s : -s) * .8; });
  if (P.atkArm) P.atkArm.rotation.x = a.atk ? bump(a.atk) : (-s * .8 + Math.sin(now / 500) * .06);
  if (P.head && !P.quad) { P.head.rotation.x = Math.sin(a.atk * Math.PI) * .3; P.head.rotation.z = Math.sin(now / 700) * .08 * (1 - w); }
  u.root.scale.set(1 - Math.sin(now / 330) * .02 * (1 - w) + a.hit * .08, 1 + Math.sin(now / 330) * .035 * (1 - w) - a.hit * .1, 1);
  if (P.quad && P.head) P.head.rotation.x = Math.sin(a.atk * Math.PI) * .6;
  if (P.tail) P.tail.rotation.y = Math.sin(now / 220) * .45;
  if (P.wings) P.wings.forEach((w2, i) => { w2.rotation.z = (i ? -1 : 1) * (Math.sin(now / 260) * .25 + .15 + a.atk * .5); });
  u.root.position.y = u.baseY + Math.abs(Math.sin(now / 105)) * .14 * w + Math.sin(now / 420) * .025 * (1 - w) - a.dead * .08;
  u.root.rotation.z = a.dead * Math.PI / 2 * (P.quad ? 1 : -1); u.root.rotation.x = P.quad ? 0 : -Math.sin(a.atk * Math.PI) * .12;
  if (P.quad || true) { u.root.position.z = Math.sin(a.atk * Math.PI) * .25; }
  const h = a.hit; if (h !== u._h) { u._h = h; m.traverse(o => { if (o.isMesh && o.material && o.material.emissive && !o.material._glow) o.material.emissive.setRGB(h * .9, 0, 0); }); }
};
G.Models = M;
})(window);
