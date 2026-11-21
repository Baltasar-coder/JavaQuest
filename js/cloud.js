/* Cuentas y guardado en la nube con Firebase (Google y email). Si no hay configuración, el módulo queda desactivado. */
(function (G) {
'use strict';
const cfg = G.JQ_FIREBASE;
const Cloud = G.Cloud = { enabled: !!(cfg && cfg.apiKey), ready: false, user: null, error: null };
const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar ' + src)); document.head.appendChild(s); });
const doc = () => Cloud.db.collection('users').doc(Cloud.user.uid);
let timer = null, pending = null;

Cloud.init = async function () {
  if (!Cloud.enabled) return false;
  try {
    const base = 'https://www.gstatic.com/firebasejs/9.23.0/';
    await loadScript(base + 'firebase-app-compat.js'); await Promise.all([loadScript(base + 'firebase-auth-compat.js'), loadScript(base + 'firebase-firestore-compat.js')]);
    G.firebase.initializeApp(cfg); Cloud.auth = G.firebase.auth(); Cloud.db = G.firebase.firestore();
    await Promise.race([new Promise(res => { Cloud.auth.onAuthStateChanged(u => { Cloud.user = u ? { uid: u.uid, email: u.email || '', name: u.displayName || u.email || 'Aventurero', photo: u.photoURL || '' } : null; Cloud.ready = true; res(); }); }), new Promise(res => setTimeout(res, 8000))]);
    return true;
  } catch (e) { Cloud.error = e; Cloud.enabled = false; console.warn('Cuentas desactivadas:', e); return false; }
};
Cloud.google = async () => { const r = await Cloud.auth.signInWithPopup(new G.firebase.auth.GoogleAuthProvider()); const u = r.user; Cloud.user = { uid: u.uid, email: u.email || '', name: u.displayName || u.email || 'Aventurero', photo: u.photoURL || '' }; return Cloud.user; };
Cloud.signUp = async (email, pass, name) => { const c = await Cloud.auth.createUserWithEmailAndPassword(email, pass); if (name) await c.user.updateProfile({ displayName: name }); const u = c.user; Cloud.user = { uid: u.uid, email: u.email || '', name: name || u.email, photo: '' }; return Cloud.user; };
Cloud.signIn = async (email, pass) => { const c = await Cloud.auth.signInWithEmailAndPassword(email, pass); const u = c.user; Cloud.user = { uid: u.uid, email: u.email || '', name: u.displayName || u.email, photo: u.photoURL || '' }; return Cloud.user; };
Cloud.reset = email => Cloud.auth.sendPasswordResetEmail(email);
Cloud.signOut = async () => { await Cloud.flush(); await Cloud.auth.signOut(); Cloud.user = null; };
Cloud.fetch = async () => { const d = await doc().get(); return d.exists ? JSON.parse(d.data().save) : null; };
Cloud.wipe = async () => { if (Cloud.user) { pending = null; clearTimeout(timer); await doc().delete(); } };
Cloud.save = state => { if (!Cloud.user) return; pending = state; clearTimeout(timer); timer = setTimeout(() => Cloud.flush(), 1500); };
Cloud.flush = async () => {
  clearTimeout(timer); if (!pending || !Cloud.user) return; const s = pending; pending = null;
  try { await doc().set({ save: JSON.stringify(s), updated: Date.now(), name: Cloud.user.name }); } catch (e) { console.warn('No se pudo guardar en la nube:', e); pending = pending || s; }
};
G.addEventListener('pagehide', () => { Cloud.flush(); });
Cloud.errorText = e => ({
  'auth/popup-closed-by-user': 'Has cerrado la ventana de Google antes de terminar.', 'auth/cancelled-popup-request': 'Se canceló el inicio de sesión.',
  'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes para esta página.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Prueba a entrar.', 'auth/weak-password': 'La contraseña es muy corta (mínimo 6 caracteres).',
  'auth/invalid-email': 'Ese email no es válido.', 'auth/missing-password': 'Escribe la contraseña.', 'auth/user-not-found': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.', 'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a probar.', 'auth/network-request-failed': 'No hay conexión con internet.',
  'auth/unauthorized-domain': 'Esta dirección no está autorizada en Firebase. Añádela en Authentication → Settings → Authorized domains.',
  'auth/operation-not-allowed': 'Ese método de acceso no está activado en Firebase (Authentication → Sign-in method).'
}[e && e.code] || (e && e.message) || 'Error desconocido');
})(window);
