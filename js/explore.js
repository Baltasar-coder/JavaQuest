/* Niveles de exploración 3D: el héroe se mueve, decide y ataca con comandos Java */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };
const L = o => { W.levels[o.id] = o; return o; };
const REF = `<table class="t">
<tr><td><code>heroe.avanzar();</code></td><td>un paso adelante</td></tr>
<tr><td><code>heroe.girarIzquierda();</code> / <code>girarDerecha();</code></td><td>gira 90°</td></tr>
<tr><td><code>heroe.atacar();</code></td><td>golpea lo que haya delante</td></tr>
<tr><td><code>heroe.abrir();</code> / <code>recoger();</code></td><td>abre la puerta de delante / recoge el tesoro del suelo</td></tr>
<tr><td><code>heroe.hayPared()</code> <code>hayPuerta()</code> <code>hayEnemigo()</code></td><td>sensores (devuelven <code>boolean</code>)</td></tr>
<tr><td><code>heroe.estaEnSalida()</code> <code>hayTesoroAqui()</code> <code>getVida()</code></td><td>más sensores</td></tr></table>`;

L({
  id: '1-e', world: 1, title: 'Primeros pasos en 3D', kind: 'explore', foe: { name: 'La mazmorra', emoji: '🧭', dmg: 8 },
  story: 'Por fin ves la cripta con tus propios ojos. Hay un pasillo con forma de «S» y, al fondo, un portal verde: la salida. Tu héroe obedece órdenes en Java, <b>una detrás de otra</b>.',
  lesson: `
<p>Llamar a un método de un objeto se escribe <code>objeto.metodo();</code>. Igual que <code>System.out.println(...)</code>, pero ahora el objeto es tu héroe y el método es una <b>acción</b>:</p>
${REF}
<p>Las instrucciones se ejecutan <b>en orden</b>, de arriba abajo. Para dar 3 pasos escribes 3 veces <code>heroe.avanzar();</code> (más adelante aprenderás a no repetirte con bucles).</p>
<div class="note">🧭 <b>Orientación:</b> el héroe empieza mirando al Este (→). <code>girarDerecha()</code> desde el Este te deja mirando al Sur (↓). Mira el minimapa de arriba a la derecha: la flecha es tu héroe.</div>`,
  task: 'Lleva al héroe hasta la salida 🌀: primero <b>4 pasos</b> hacia delante, gira a la derecha, <b>2 pasos</b>, gira otra vez a la derecha y <b>4 pasos</b> más. Pulsa «▶ Probar» para ver tu recorrido en 3D.',
  mode: 'script',
  explore: true,
  starter: `// El héroe empieza mirando al Este.\n// Escribe los comandos uno por línea:\nheroe.avanzar();\n`,
  hints: ['Repite <code>heroe.avanzar();</code> cuatro veces seguidas.', 'Después <code>heroe.girarDerecha();</code> y dos <code>avanzar</code>.', 'Otro <code>girarDerecha()</code> y cuatro <code>avanzar</code> finales. Si chocas con un muro verás «¡Pum!».'],
  tests: [
    { name: 'Llegar a la salida', explore: { map: ['#######', '#S....#', '#####.#', '#X....#', '#######'], dir: 'E', hp: 20 }, check: c => c.sim.exited ? true : `Tu héroe se quedó en la casilla (${c.sim.x}, ${c.sim.y}). Debe llegar al portal verde.` },
    { name: 'Sin chocar contra las paredes', explore: { map: ['#######', '#S....#', '#####.#', '#X....#', '#######'], dir: 'E', hp: 20 }, check: c => c.sim.bumps === 0 ? true : `Has chocado ${c.sim.bumps} vez/veces contra una pared.` }
  ],
  solution: `heroe.avanzar();\nheroe.avanzar();\nheroe.avanzar();\nheroe.avanzar();\nheroe.girarDerecha();\nheroe.avanzar();\nheroe.avanzar();\nheroe.girarDerecha();\nheroe.avanzar();\nheroe.avanzar();\nheroe.avanzar();\nheroe.avanzar();`,
  xp: 40, gold: 14
});

L({
  id: '2-e', world: 2, title: 'El laberinto de decisiones', kind: 'explore', foe: { name: 'Laberinto', emoji: '🧭', dmg: 9 },
  story: 'El bosque esconde un laberinto de setos de piedra. Nadie te dará el mapa: tendrás que escribir una <b>regla</b> que sirva para cualquier pasillo en espiral.',
  lesson: `
<p>Los sensores devuelven <code>boolean</code>, así que encajan en un <code>if</code>:</p>
<pre><code>if (heroe.hayPared()) {
    heroe.girarDerecha();
} else {
    heroe.avanzar();
}</code></pre>
<p>Y con <code>while</code> repites hasta cumplir el objetivo. <code>!</code> niega: <code>!heroe.estaEnSalida()</code> es «todavía no estoy en la salida».</p>
${REF}
<div class="note">🧠 En vez de contar pasos, escribes una <b>regla general</b>. Por eso funciona en laberintos distintos: ¡hay dos pruebas con mapas diferentes!</div>`,
  task: 'Escribe un <code>while</code> que repita <b>mientras no estés en la salida</b>: si hay pared delante, <b>gira a la derecha</b>; si no, <b>avanza</b>. Debe funcionar en los dos laberintos de prueba.',
  mode: 'script', explore: true,
  starter: `// Mientras no estés en la salida:\n//   si hay pared delante -> gira a la derecha\n//   si no                -> avanza\nwhile (/* condición */) {\n    \n}\n`,
  hints: ['La condición es <code>!heroe.estaEnSalida()</code>.', 'Dentro del while: <code>if (heroe.hayPared()) { ... } else { ... }</code>', 'En el if: <code>heroe.girarDerecha();</code>; en el else: <code>heroe.avanzar();</code>'],
  tests: [
    { name: 'Laberinto en «S» ancha', explore: { map: ['#########', '#S......#', '#######.#', '#X......#', '#########'], dir: 'E', hp: 20 }, check: c => c.sim.exited ? true : 'No has llegado a la salida.' },
    { name: 'Laberinto estrecho', explore: { map: ['#######', '#S...##', '####.##', '#X...##', '#######'], dir: 'E', hp: 20 }, check: c => c.sim.exited ? true : 'No has llegado a la salida.' },
    { name: 'Sin chocar nunca', explore: { map: ['#########', '#S......#', '#######.#', '#X......#', '#########'], dir: 'E', hp: 20 }, check: c => c.sim.bumps === 0 && c.sim.exited ? true : 'Comprueba hayPared() ANTES de avanzar para no chocar.' }
  ],
  solution: `while (!heroe.estaEnSalida()) {\n    if (heroe.hayPared()) {\n        heroe.girarDerecha();\n    } else {\n        heroe.avanzar();\n    }\n}`,
  xp: 60, gold: 18
});

L({
  id: '3-e', world: 3, title: 'La patrulla de la cripta', kind: 'explore', foe: { name: 'Guardianes de la cripta', emoji: '👹', dmg: 10 },
  story: 'Dos guardianes patrullan el pasillo. Cada golpe tuyo les quita una vida (tienen dos), pero si te quedas a su lado, ellos también te golpean. <b>Explorar, decidir y atacar</b>, todo a la vez.',
  lesson: `
<p>Combina todo lo aprendido: un bucle <code>while</code> con varias decisiones <code>if / else if / else</code>. El <b>orden</b> importa: primero lo más urgente.</p>
<pre><code>while (!heroe.estaEnSalida()) {
    if (heroe.hayEnemigo()) {
        heroe.atacar();
    } else if (heroe.hayPared()) {
        heroe.girarDerecha();
    } else {
        heroe.avanzar();
    }
}</code></pre>
<p><code>hayEnemigo()</code> mira la casilla de <b>delante</b>. Si intentas <code>avanzar()</code> contra un enemigo, chocas con él.</p>
${REF}`,
  task: 'Llega a la salida <b>sin salir de la mazmorra con enemigos vivos</b>: si hay un enemigo delante, <b>atácalo</b>; si hay pared, <b>gira a la derecha</b>; si no, <b>avanza</b>. Tu héroe debe sobrevivir y derrotar a todos los guardianes.',
  mode: 'script', explore: true,
  starter: `while (!heroe.estaEnSalida()) {\n    if (heroe.hayPared()) {\n        heroe.girarDerecha();\n    } else {\n        heroe.avanzar();\n    }\n}\n`,
  hints: ['El primer <code>if</code> debe ser <code>heroe.hayEnemigo()</code> → <code>heroe.atacar();</code>', 'Luego <code>else if (heroe.hayPared())</code> y por último <code>else</code>.', 'Si empiezas por <code>hayPared</code>, el héroe se quedaría chocando con el enemigo.'],
  tests: [
    { name: 'Pasillo con dos guardianes', explore: { map: ['#########', '#S..E...#', '#######.#', '#X..E...#', '#########'], dir: 'E', hp: 30, enemyHp: 2, enemyDmg: 4, enemyType: 'goblin' },
      check: c => !c.sim.exited ? 'No has llegado a la salida.' : c.sim.hp <= 0 ? 'Tu héroe cayó.' : c.sim.kills < c.sim.enemies.length ? 'Quedan enemigos vivos.' : true },
    { name: 'Otro pasillo, otros guardianes', explore: { map: ['#######', '#S.E.##', '####.##', '#X.E.##', '#######'], dir: 'E', hp: 30, enemyHp: 2, enemyDmg: 4, enemyType: 'goblin' },
      check: c => !c.sim.exited ? 'No has llegado a la salida.' : c.sim.hp <= 0 ? 'Tu héroe cayó.' : c.sim.kills < c.sim.enemies.length ? 'Quedan enemigos vivos.' : true }
  ],
  solution: `while (!heroe.estaEnSalida()) {\n    if (heroe.hayEnemigo()) {\n        heroe.atacar();\n    } else if (heroe.hayPared()) {\n        heroe.girarDerecha();\n    } else {\n        heroe.avanzar();\n    }\n}`,
  xp: 90, gold: 30
});
})(typeof window !== 'undefined' ? window : globalThis);
