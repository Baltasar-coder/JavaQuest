# Activar las cuentas (Google y email) en JavaQuest

El juego guarda el progreso en el navegador. Para poder **entrar con Google** y **seguir desde cualquier ordenador o móvil**, se usa **Firebase**
(de Google, con plan gratuito de sobra para esto). Hay que crear el proyecto una sola vez; son unos 10 minutos.

> Mientras no hagas esto, el juego funciona igual pero sin cuentas.

## 1. Crear el proyecto
1. Entra en https://console.firebase.google.com con tu cuenta de Google y pulsa **Crear un proyecto** (puedes desactivar Google Analytics).
2. En la página del proyecto pulsa el icono **`</>` (Web)** para añadir una app web. Ponle un nombre (p. ej. «JavaQuest») y registra la app (sin Hosting).
3. Te mostrará un bloque `firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", appId: "..." }`.
   **Cópialo** y pégalo en `js/config.js`, sustituyendo `window.JQ_FIREBASE = null;` por:

```js
window.JQ_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  appId: "1:1234567890:web:abcdef"
};
```
(La `apiKey` de Firebase para web no es un secreto: la seguridad la dan las reglas del paso 3.)

## 2. Activar los métodos de acceso
En **Build → Authentication → Sign-in method** activa:
- **Google** (elige un email de soporte del proyecto).
- **Correo electrónico/contraseña** (para quien no quiera usar Google).

## 3. Crear la base de datos y proteger los datos
1. **Build → Firestore Database → Crear base de datos** (modo producción, la región europea que prefieras).
2. En la pestaña **Reglas** pega esto y publica (cada persona solo puede leer y escribir **su propio** progreso):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4. Dónde se juega (importante)
El inicio de sesión **no funciona abriendo `index.html` con doble clic** (`file://`). Necesita una dirección web:
- **En tu ordenador:** `node serve.js` y entra en http://localhost:8080 (`localhost` ya viene autorizado).
- **Para que tu mujer juegue desde su ordenador/móvil:** publica la carpeta en un alojamiento web gratuito (Firebase Hosting, GitHub Pages, Netlify...).
  Después añade esa dirección en **Authentication → Settings → Authorized domains** (por ejemplo `miusuario.github.io`).

## Cómo funciona dentro del juego
- En la pantalla de inicio aparecen **«Continuar con Google»** y **«Entrar o crear cuenta con email»**. También se puede jugar sin cuenta.
- Al entrar, si ya había progreso en la nube se carga; si no, se sube el que haya en ese navegador.
- Cada cambio se guarda en la nube unos segundos después. «Cerrar sesión» está en ⚙️ Ajustes (guarda y borra la copia local del navegador, por si el equipo es compartido).
