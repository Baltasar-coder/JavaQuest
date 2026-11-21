/* MUNDO 3 · Las Catacumbas de los Bucles — while, for, break, continue */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };
const L = o => { W.levels[o.id] = o; return o; };

W.worlds.push({
  id: 3, name: 'Las Catacumbas de los Bucles', emoji: '♾️', theme: 'catacomb',
  blurb: 'while, for, break, continue y bucles anidados. Combates y huidas con código.',
  intro: 'Las catacumbas se extienden en círculos infinitos. Aquí todo se repite: pasillos, enemigos, cofres. Dominar los bucles es la única forma de no repetirte (tú) a mano.',
  nodes: ['3-1', '3-2', '3-3', '3-e', '3-4', '3-5', ['3-6a', '3-6b'], '3-b']
});

L({
  id: '3-1', world: 3, title: 'Cuenta atrás', kind: 'combat', foe: { name: 'Araña gigante', emoji: '🕷️', dmg: 9 },
  story: 'Una araña teje su tela a toda velocidad. Para derribarla lanzarás un hechizo con cuenta atrás.',
  lesson: `
<p>El bucle <code>for</code> repite un bloque un número controlado de veces:</p>
<pre><code>for (int i = 1; i &lt;= 5; i++) {
    System.out.println(i);
}</code></pre>
<p>Tiene tres partes entre paréntesis, separadas por <code>;</code>:</p>
<ol><li><b>Inicio</b>: <code>int i = 1</code> (se ejecuta una vez)</li>
<li><b>Condición</b>: <code>i &lt;= 5</code> (se comprueba antes de cada vuelta)</li>
<li><b>Paso</b>: <code>i++</code> (suma 1 al terminar cada vuelta; <code>i--</code> resta 1)</li></ol>
<div class="note">📝 Para contar hacia atrás: <code>for (int i = 5; i &gt;= 1; i--)</code>.</div>`,
  task: 'Existe <code>n</code>. Imprime una línea por cada número desde <code>n</code> hasta 1 (hacia atrás) y, al final, <code>¡Fuego!</code>.',
  mode: 'script',
  starter: `// n ya existe\nfor (/* inicio */; /* condición */; /* paso */) {\n    \n}\nSystem.out.println("¡Fuego!");\n`,
  hints: ['Empieza en <code>int i = n</code>.', 'Mientras <code>i &gt;= 1</code>.', 'Resta en cada vuelta: <code>i--</code>.'],
  tests: [
    { name: 'n = 5', vars: { n: 5 }, expect: '5\n4\n3\n2\n1\n¡Fuego!' },
    { name: 'n = 3', vars: { n: 3 }, expect: '3\n2\n1\n¡Fuego!' },
    { name: 'n = 1', vars: { n: 1 }, expect: '1\n¡Fuego!' }
  ],
  solution: `for (int i = n; i >= 1; i--) {\n    System.out.println(i);\n}\nSystem.out.println("¡Fuego!");`,
  xp: 50, gold: 15
});

L({
  id: '3-2', world: 3, title: 'Las monedas del pasillo', kind: 'treasure', foe: { name: 'Fantasma avaro', emoji: '👻', dmg: 9 },
  story: 'Un fantasma ha repartido monedas por el pasillo: 1 en la primera baldosa, 2 en la segunda, 3 en la tercera... Quiere saber cuánto suma todo.',
  lesson: `
<p>Los bucles sirven mucho para <b>acumular</b>: una variable «acumulador» que crece en cada vuelta.</p>
<pre><code>int total = 0;                    // empieza en 0
for (int i = 1; i &lt;= n; i++) {
    total = total + i;            // o total += i;
}
System.out.println(total);</code></pre>
<p>El acumulador se declara <b>fuera</b> del bucle. Si lo declaras dentro, se reinicia en cada vuelta y se pierde al terminar.</p>
<div class="note">📝 Atajos: <code>x += 5</code> es <code>x = x + 5</code>. También existen <code>-=</code>, <code>*=</code>, <code>/=</code>, <code>%=</code>.</div>`,
  task: 'Existe <code>n</code>. Suma todos los números del 1 al <code>n</code> e imprime <code>Total: X</code>.',
  mode: 'script',
  starter: `// n ya existe\nint total = 0;\n\nSystem.out.println("Total: " + total);\n`,
  hints: ['Un <code>for</code> de 1 a <code>n</code>.', 'Dentro: <code>total += i;</code>', 'Imprime fuera del bucle.'],
  tests: [
    { name: 'n = 10', vars: { n: 10 }, expect: 'Total: 55' },
    { name: 'n = 100', vars: { n: 100 }, expect: 'Total: 5050' },
    { name: 'n = 1', vars: { n: 1 }, expect: 'Total: 1' }
  ],
  solution: `int total = 0;\nfor (int i = 1; i <= n; i++) {\n    total += i;\n}\nSystem.out.println("Total: " + total);`,
  xp: 55, gold: 16
});

L({
  id: '3-3', world: 3, title: 'El zombi resistente', kind: 'combat', foe: { name: 'Zombi resistente', emoji: '🧟', dmg: 9 },
  story: 'Un zombi se levanta una y otra vez. No sabes cuántos golpes necesitará... pero sí sabes cuándo parar: cuando esté muerto.',
  lesson: `
<p><code>while</code> repite <b>mientras</b> la condición sea verdadera. Es ideal cuando no sabes cuántas vueltas harán falta:</p>
<pre><code>while (enemigo.estaVivo()) {
    heroe.atacar();
}</code></pre>
<p>En este nivel el juego te da dos objetos ya creados:</p>
<ul><li><code>heroe</code>: <code>atacar()</code>, <code>curar()</code>, <code>huir()</code>, <code>getVida()</code>, <code>getPociones()</code></li>
<li><code>enemigo</code>: <code>estaVivo()</code>, <code>getVida()</code>, <code>getNombre()</code>, <code>getAtaque()</code></li></ul>
<p>Cada vez que tú actúas, el enemigo contraataca. <b>Cuidado con los bucles infinitos:</b> si la condición nunca se vuelve falsa, el programa no termina.</p>`,
  task: 'Derrota al zombi: ataca con <code>heroe.atacar()</code> <b>mientras el enemigo esté vivo</b>. Tu héroe debe sobrevivir.',
  mode: 'script',
  starter: `// heroe y enemigo ya existen\n`,
  hints: ['<code>while (enemigo.estaVivo()) { ... }</code>', 'Dentro del bucle: <code>heroe.atacar();</code>', 'Sin el bucle solo darías un golpe.'],
  tests: [
    { name: 'Zombi de 50 de vida', sim: { heroHp: 100, heroDmg: 10, enemy: { name: 'Zombi', hp: 50, dmg: 5 } }, check: c => c.sim.enemyHp === 0 && c.sim.heroHp > 0 ? true : 'El zombi sigue en pie. ¿Atacas hasta que muera?' },
    { name: 'Zombi de 120 de vida', sim: { heroHp: 100, heroDmg: 10, enemy: { name: 'Zombi', hp: 120, dmg: 3 } }, check: c => c.sim.enemyHp === 0 && c.sim.heroHp > 0 ? true : 'El zombi sigue en pie. ¿Atacas hasta que muera?' }
  ],
  solution: `while (enemigo.estaVivo()) {\n    heroe.atacar();\n}`,
  xp: 60, gold: 18
});

L({
  id: '3-4', world: 3, title: '¡A correr!', kind: 'combat', foe: { name: 'Ogro furioso', emoji: '👹', dmg: 12 },
  story: 'Un ogro enorme bloquea el pasillo. Algunos enemigos se pueden vencer... otros no. Un buen aventurero sabe cuándo <b>huir</b>.',
  lesson: `
<p><code>break</code> <b>sale del bucle</b> inmediatamente. Combinado con <code>if</code> permite reaccionar a situaciones especiales:</p>
<pre><code>while (enemigo.estaVivo()) {
    if (heroe.getVida() &lt; 40) {
        heroe.huir();
        break;          // salimos del bucle: ya no hay combate
    }
    heroe.atacar();
}</code></pre>
<p>Si después de <code>huir()</code> sigues llamando a <code>atacar()</code> el juego lanza un error: el combate ya terminó.</p>
<div class="note">🧠 Las buenas decisiones usan <b>márgenes</b>: huir con 5 de vida es demasiado tarde si el ogro pega 20.</div>`,
  task: 'Combate hasta el final, pero si tu vida baja de <b>40</b>, <b>huye</b> (<code>heroe.huir()</code>) y sal del bucle. ¡No huyas de enemigos débiles!',
  mode: 'script',
  starter: `// heroe y enemigo ya existen\nwhile (enemigo.estaVivo()) {\n    heroe.atacar();\n}\n`,
  hints: ['Dentro del <code>while</code>, antes de atacar, comprueba <code>heroe.getVida() &lt; 40</code>.', 'Si es cierto: <code>heroe.huir();</code> y <code>break;</code>', 'Si no, ataca normalmente.'],
  tests: [
    { name: 'Un ogro imposible (debes huir vivo)', sim: { heroHp: 100, heroDmg: 10, enemy: { name: 'Ogro', hp: 200, dmg: 20 } },
      check: c => c.sim.fled && c.sim.heroHp > 0 ? true : (c.sim.heroHp <= 0 ? 'Tu héroe cayó en combate: huye antes, con más margen.' : 'El ogro es demasiado fuerte: debes huir.') },
    { name: 'Una rata débil (no huyas)', sim: { heroHp: 100, heroDmg: 10, enemy: { name: 'Rata', hp: 30, dmg: 2 } },
      check: c => c.sim.enemyHp === 0 && !c.sim.fled ? true : 'Has huido de una simple rata...' },
    { name: 'Un goblin normal (se puede ganar)', sim: { heroHp: 100, heroDmg: 15, enemy: { name: 'Goblin', hp: 60, dmg: 10 } },
      check: c => c.sim.enemyHp === 0 && !c.sim.fled ? true : 'El goblin se podía vencer sin huir.' }
  ],
  solution: `while (enemigo.estaVivo()) {\n    if (heroe.getVida() < 40) {\n        heroe.huir();\n        break;\n    }\n    heroe.atacar();\n}`,
  xp: 70, gold: 20
});

// referencia en JS para generar la salida esperada
const cofres = limite => {
  const out = []; let total = 0;
  for (let i = 1; i <= 20; i++) { if (i % 3 === 0) continue; total += i; out.push('Cofre ' + i); if (total >= limite) break; }
  out.push('Total: ' + total); return out.join('\n');
};
L({
  id: '3-5', world: 3, title: 'La sala de los cofres', kind: 'trap', foe: { name: 'Sala de las trampas', emoji: '🪤', dmg: 10 },
  story: 'Veinte cofres en fila. Los que ocupan un lugar múltiplo de 3 están trampeados: no los toques. Y cuando tu mochila se llene, ¡sal corriendo!',
  lesson: `
<p>Dos instrucciones para controlar un bucle:</p>
<ul><li><code>continue</code>: <b>salta</b> el resto de la vuelta y pasa a la siguiente.</li>
<li><code>break</code>: <b>sale</b> del bucle por completo.</li></ul>
<pre><code>for (int i = 1; i &lt;= 20; i++) {
    if (i % 3 == 0) {
        continue;     // este no: pasa al siguiente
    }
    ...
    if (total &gt;= limite) {
        break;        // mochila llena: fin
    }
}</code></pre>
<div class="note">📝 <code>i % 3 == 0</code> significa «i es múltiplo de 3» (el resto de dividir entre 3 es cero).</div>`,
  task: 'Existe <code>limite</code> (peso máximo). Recorre los cofres 1 a 20: <b>salta</b> los múltiplos de 3; en los demás, suma su número al <code>total</code> e imprime <code>Cofre N</code>. Si el total llega a <code>limite</code> o más, <b>sal del bucle</b>. Al terminar imprime <code>Total: X</code>.',
  mode: 'script',
  starter: `// limite ya existe\nint total = 0;\nfor (int i = 1; i <= 20; i++) {\n    \n}\nSystem.out.println("Total: " + total);\n`,
  hints: ['Primera línea del cuerpo: <code>if (i % 3 == 0) { continue; }</code>', 'Luego <code>total += i;</code> y el println del cofre.', 'Al final de la vuelta: <code>if (total &gt;= limite) { break; }</code>'],
  tests: [
    { name: 'limite = 50', vars: { limite: 50 }, expect: cofres(50) },
    { name: 'limite = 10', vars: { limite: 10 }, expect: cofres(10) },
    { name: 'limite = 1000 (recorre todo)', vars: { limite: 1000 }, expect: cofres(1000) }
  ],
  solution: `int total = 0;\nfor (int i = 1; i <= 20; i++) {\n    if (i % 3 == 0) {\n        continue;\n    }\n    total += i;\n    System.out.println("Cofre " + i);\n    if (total >= limite) {\n        break;\n    }\n}\nSystem.out.println("Total: " + total);`,
  xp: 75, gold: 22
});

L({
  id: '3-6a', world: 3, title: 'La pirámide de calaveras', kind: 'puzzle', foe: { name: 'Altar de calaveras', emoji: '💀', dmg: 10 },
  story: 'Un altar exige que apiles calaveras en forma de pirámide: una en la fila 1, dos en la fila 2, tres en la 3...',
  lesson: `
<p>Un bucle <b>dentro de otro</b> se llama bucle anidado. El de fuera controla las filas; el de dentro, las columnas.</p>
<pre><code>for (int fila = 1; fila &lt;= 3; fila++) {
    for (int col = 1; col &lt;= fila; col++) {
        System.out.print("*");     // print: sin salto de línea
    }
    System.out.println();          // salto de línea al terminar la fila
}</code></pre>
<p>Por cada vuelta del bucle externo, el interno da <b>todas</b> sus vueltas.</p>`,
  task: 'Existe <code>n</code>. Imprime una pirámide de <code>n</code> filas: la fila 1 tiene un <code>*</code>, la 2 tiene <code>**</code>, etc.',
  mode: 'script',
  starter: `// n ya existe\n`,
  hints: ['Bucle externo: filas de 1 a <code>n</code>.', 'Bucle interno: de 1 a la fila actual, con <code>System.out.print("*")</code>.', 'Al terminar cada fila: <code>System.out.println();</code>'],
  tests: [
    { name: 'n = 3', vars: { n: 3 }, expect: '*\n**\n***' },
    { name: 'n = 5', vars: { n: 5 }, expect: '*\n**\n***\n****\n*****' },
    { name: 'n = 1', vars: { n: 1 }, expect: '*' }
  ],
  solution: `for (int fila = 1; fila <= n; fila++) {\n    for (int col = 1; col <= fila; col++) {\n        System.out.print("*");\n    }\n    System.out.println();\n}`,
  xp: 80, gold: 24
});

L({
  id: '3-6b', world: 3, title: 'La sala del tablero', kind: 'puzzle', foe: { name: 'Telaraña cuadriculada', emoji: '🕸️', dmg: 10 },
  story: 'El suelo es un tablero. Para cruzarlo debes marcar cada baldosa con un <code>#</code>, fila a fila.',
  lesson: `
<p>Con dos bucles anidados recorres una <b>cuadrícula</b> (filas × columnas):</p>
<pre><code>for (int f = 0; f &lt; filas; f++) {
    for (int c = 0; c &lt; columnas; c++) {
        System.out.print("#");
    }
    System.out.println();
}</code></pre>
<div class="note">📝 Es habitual contar desde 0 y usar <code>&lt;</code>: <code>f &lt; filas</code> hace exactamente <i>filas</i> vueltas. Los arrays y listas también empiezan en 0.</div>`,
  task: 'Existen <code>filas</code> y <code>columnas</code>. Imprime un rectángulo de <code>#</code> con esa altura y anchura.',
  mode: 'script',
  starter: `// filas y columnas ya existen\n`,
  hints: ['Bucle externo: <code>filas</code> vueltas.', 'Bucle interno: <code>columnas</code> vueltas con <code>print("#")</code>.', '<code>System.out.println();</code> entre fila y fila.'],
  tests: [
    { name: '2 filas × 4 columnas', vars: { filas: 2, columnas: 4 }, expect: '####\n####' },
    { name: '3 × 3', vars: { filas: 3, columnas: 3 }, expect: '###\n###\n###' },
    { name: '1 × 5', vars: { filas: 1, columnas: 5 }, expect: '#####' }
  ],
  solution: `for (int f = 0; f < filas; f++) {\n    for (int c = 0; c < columnas; c++) {\n        System.out.print("#");\n    }\n    System.out.println();\n}`,
  xp: 80, gold: 24
});

const fizz = n => { const o = []; for (let i = 1; i <= n; i++) o.push(i % 15 === 0 ? 'Rey Esqueleto' : i % 3 === 0 ? 'Hueso' : i % 5 === 0 ? 'Calavera' : String(i)); return o; };
L({
  id: '3-b', world: 3, title: 'El Rey Esqueleto', kind: 'boss', foe: { name: 'Rey Esqueleto', emoji: '☠️', dmg: 12 },
  story: 'El Rey Esqueleto cuenta sus súbditos: «Por cada múltiplo de 3 aparece un Hueso; por cada múltiplo de 5, una Calavera. Y si es de ambos... ¡yo mismo!». Si te equivocas en un número, su espada caerá.',
  lesson: `
<p>Este es el famoso ejercicio <b>FizzBuzz</b>, una prueba clásica de entrevista. Combina bucle + condiciones. Lo importante es el <b>orden</b>:</p>
<ul><li>Primero el caso más específico (múltiplo de 3 <b>y</b> de 5).</li>
<li>Después los casos individuales.</li>
<li>Y por último, el caso por defecto.</li></ul>
<pre><code>if (i % 15 == 0) ...
else if (i % 3 == 0) ...
else if (i % 5 == 0) ...
else ...</code></pre>
<p>Si comprobaras primero «múltiplo de 3», el 15 nunca llegaría al caso especial.</p>`,
  task: 'Existe <code>n</code>. Para cada número del 1 al <code>n</code>, imprime en su propia línea: <code>Rey Esqueleto</code> si es múltiplo de 3 y de 5; <code>Hueso</code> si solo lo es de 3; <code>Calavera</code> si solo lo es de 5; y el propio número en otro caso.',
  mode: 'script',
  starter: `// n ya existe\n`,
  hints: ['Un <code>for</code> de 1 a <code>n</code>.', 'Primer caso a comprobar: <code>i % 3 == 0 &amp;&amp; i % 5 == 0</code> (o <code>i % 15 == 0</code>).', 'Después <code>else if</code> para 3, <code>else if</code> para 5 y <code>else</code> para imprimir <code>i</code>.'],
  tests: [
    { name: 'n = 15', vars: { n: 15 }, lines: fizz(15) },
    { name: 'n = 7', vars: { n: 7 }, lines: fizz(7) }
  ],
  solution: `for (int i = 1; i <= n; i++) {\n    if (i % 3 == 0 && i % 5 == 0) {\n        System.out.println("Rey Esqueleto");\n    } else if (i % 3 == 0) {\n        System.out.println("Hueso");\n    } else if (i % 5 == 0) {\n        System.out.println("Calavera");\n    } else {\n        System.out.println(i);\n    }\n}`,
  xp: 120, gold: 60
});
})(typeof window !== 'undefined' ? window : globalThis);
