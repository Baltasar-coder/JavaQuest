/* MUNDO 2 · El Bosque de las Decisiones — condicionales */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };
const L = o => { W.levels[o.id] = o; return o; };

W.worlds.push({
  id: 2, name: 'El Bosque de las Decisiones', emoji: '🌲', theme: 'forest',
  blurb: 'if / else, switch, comparaciones y operadores lógicos: elegir camino.',
  intro: 'Sales de la cripta a un bosque cubierto de niebla. Los senderos se bifurcan por todas partes: un programa que no sabe decidir se pierde para siempre.',
  nodes: ['2-1', '2-e', ['2-2a', '2-2b'], '2-3', '2-4', '2-b']
});

L({
  id: '2-1', world: 2, title: 'La bifurcación', kind: 'combat', foe: { name: 'Lobo del sendero', emoji: '🐺', dmg: 8 },
  story: 'El camino se parte en dos. Un lobo te gruñe desde la maleza: si vas herido, no sobrevivirás al túnel.',
  lesson: `
<p>Con <code>if</code> el programa <b>decide</b> qué ejecutar según una condición:</p>
<pre><code>if (vida &lt; 40) {
    System.out.println("Descansar");
} else {
    System.out.println("Avanzar");
}</code></pre>
<ul>
<li>La condición va entre paréntesis y debe ser <code>boolean</code> (verdadero o falso).</li>
<li>Comparadores: <code>&lt;</code> <code>&gt;</code> <code>&lt;=</code> <code>&gt;=</code> <code>==</code> (igual) <code>!=</code> (distinto).</li>
<li>El bloque <code>else</code> es opcional: se ejecuta si la condición fue falsa.</li>
</ul>
<div class="note">⚠️ <b>Error clásico:</b> <code>=</code> asigna, <code>==</code> compara. <code>if (vida = 40)</code> no compila.</div>`,
  task: 'La variable <code>vida</code> ya existe. Si es <b>menor que 40</b>, imprime <code>Descansar en la hoguera</code>. Si no, imprime <code>Avanzar por el túnel</code>.',
  mode: 'script',
  starter: `// vida ya existe\nif (/* condición */) {\n    \n} else {\n    \n}\n`,
  hints: ['La condición es <code>vida &lt; 40</code>.', 'Dentro de cada bloque, un <code>System.out.println</code>.', 'Ojo con el caso <code>vida == 40</code>: no es menor que 40.'],
  tests: [
    { name: 'vida = 20', vars: { vida: 20 }, expect: 'Descansar en la hoguera' },
    { name: 'vida = 85', vars: { vida: 85 }, expect: 'Avanzar por el túnel' },
    { name: 'vida = 40 (el límite)', vars: { vida: 40 }, expect: 'Avanzar por el túnel' },
    { name: 'vida = 39 (justo debajo)', vars: { vida: 39 }, expect: 'Descansar en la hoguera' }
  ],
  solution: `if (vida < 40) {\n    System.out.println("Descansar en la hoguera");\n} else {\n    System.out.println("Avanzar por el túnel");\n}`,
  xp: 40, gold: 12
});

L({
  id: '2-2a', world: 2, title: 'El troll del puente', kind: 'combat', foe: { name: 'Troll del puente', emoji: '🧌', dmg: 9 },
  story: 'Un troll enorme custodia el puente. Reacciona de forma distinta según la fuerza de tu golpe.',
  lesson: `
<p>Cuando hay <b>más de dos caminos</b> encadenas condiciones con <code>else if</code>:</p>
<pre><code>if (ataque &gt;= 20) {
    ...
} else if (ataque &gt;= 10) {
    ...
} else {
    ...
}</code></pre>
<p>Java prueba las condiciones <b>en orden</b> y ejecuta solo el <b>primer</b> bloque cuya condición sea verdadera. Por eso conviene ordenar de más exigente a menos.</p>`,
  task: 'Existe <code>ataque</code> (int). Si es ≥ 20 imprime <code>¡Golpe crítico! El troll cae</code>; si es ≥ 10 imprime <code>Golpe decente: el troll gruñe</code>; en cualquier otro caso <code>Golpe débil: el troll ríe</code>.',
  mode: 'script',
  starter: `// ataque ya existe\n`,
  hints: ['Empieza por la condición más exigente: <code>if (ataque &gt;= 20)</code>.', 'Luego <code>else if (ataque &gt;= 10)</code>.', 'Y termina con un <code>else</code> para todo lo demás.'],
  tests: [
    { name: 'ataque = 25', vars: { ataque: 25 }, expect: '¡Golpe crítico! El troll cae' },
    { name: 'ataque = 20', vars: { ataque: 20 }, expect: '¡Golpe crítico! El troll cae' },
    { name: 'ataque = 15', vars: { ataque: 15 }, expect: 'Golpe decente: el troll gruñe' },
    { name: 'ataque = 10', vars: { ataque: 10 }, expect: 'Golpe decente: el troll gruñe' },
    { name: 'ataque = 3', vars: { ataque: 3 }, expect: 'Golpe débil: el troll ríe' }
  ],
  solution: `if (ataque >= 20) {\n    System.out.println("¡Golpe crítico! El troll cae");\n} else if (ataque >= 10) {\n    System.out.println("Golpe decente: el troll gruñe");\n} else {\n    System.out.println("Golpe débil: el troll ríe");\n}`,
  xp: 45, gold: 14
});

L({
  id: '2-2b', world: 2, title: 'El acertijo de la esfinge', kind: 'puzzle', foe: { name: 'Esfinge', emoji: '🦁', dmg: 9 },
  story: 'Una esfinge pregunta: «Te sigo siempre, pero nunca me alcanzas. ¿Qué soy?». La respuesta del viajero está en la variable <code>respuesta</code>.',
  lesson: `
<p>Los textos (<code>String</code>) se comparan con <b><code>.equals()</code></b>:</p>
<pre><code>if (respuesta.equals("sombra")) { ... }
if (respuesta.equalsIgnoreCase("sombra")) { ... }  // ignora mayúsculas</code></pre>
<div class="note">📝 <b>Para el examen:</b> <code>==</code> con Strings compara si son <i>el mismo objeto</i> en memoria, no si dicen lo mismo. Con <code>equals</code> comparas el contenido. Es una de las preguntas favoritas.</div>`,
  task: 'Si <code>respuesta</code> es «sombra» (sin importar mayúsculas/minúsculas) imprime <code>Puedes pasar</code>; si no, imprime <code>Las fauces se abren</code>.',
  mode: 'script',
  starter: `// respuesta ya existe\n`,
  hints: ['Usa <code>respuesta.equalsIgnoreCase("sombra")</code>.', 'Estructura: <code>if (...) { ... } else { ... }</code>', 'No uses <code>==</code> para comparar textos.'],
  tests: [
    { name: 'respuesta = "sombra"', vars: { respuesta: 'sombra' }, expect: 'Puedes pasar' },
    { name: 'respuesta = "Sombra"', vars: { respuesta: 'Sombra' }, expect: 'Puedes pasar' },
    { name: 'respuesta = "luz"', vars: { respuesta: 'luz' }, expect: 'Las fauces se abren' },
    { name: 'respuesta = "SOMBRA"', vars: { respuesta: 'SOMBRA' }, expect: 'Puedes pasar' }
  ],
  solution: `if (respuesta.equalsIgnoreCase("sombra")) {\n    System.out.println("Puedes pasar");\n} else {\n    System.out.println("Las fauces se abren");\n}`,
  xp: 45, gold: 14
});

L({
  id: '2-3', world: 2, title: 'Pociones de colores', kind: 'treasure', foe: { name: 'Alquimista loco', emoji: '🧙', dmg: 9 },
  story: 'Un alquimista chiflado te ofrece pociones sin etiquetar, solo con un color. Tienes que decidir qué hace cada una sin equivocarte... o beberás veneno.',
  lesson: `
<p>Cuando comparas <b>una misma variable con muchos valores concretos</b>, <code>switch</code> es más limpio que muchos <code>else if</code>:</p>
<pre><code>switch (color) {
    case "rojo":
        System.out.println("Curación");
        break;
    case "azul":
        System.out.println("Maná");
        break;
    default:
        System.out.println("Desconocida");
}</code></pre>
<ul>
<li>Cada <code>case</code> termina con <code>break;</code> o Java <b>sigue cayendo</b> al siguiente caso (fall-through).</li>
<li><code>default</code> recoge todo lo que no coincide.</li>
<li>Desde Java 14 existe la forma flecha: <code>case "rojo" -&gt; System.out.println("Curación");</code> (sin <code>break</code>).</li>
</ul>`,
  task: 'Con la variable <code>color</code> (String): <code>rojo</code> → <code>Curación +30</code>; <code>azul</code> → <code>Maná +20</code>; <code>verde</code> → <code>¡Veneno! -10 de vida</code>; cualquier otro → <code>Poción desconocida: mejor no beberla</code>. Usa <code>switch</code>.',
  mode: 'script',
  starter: `// color ya existe\nswitch (color) {\n    \n}\n`,
  hints: ['<code>case "rojo":</code> seguido de la instrucción y de <code>break;</code>', 'No olvides el <code>default:</code> para los colores desconocidos.', 'Sin <code>break</code> el programa imprimiría varios mensajes seguidos.'],
  tests: [
    { name: 'rojo', vars: { color: 'rojo' }, expect: 'Curación +30' },
    { name: 'azul', vars: { color: 'azul' }, expect: 'Maná +20' },
    { name: 'verde', vars: { color: 'verde' }, expect: '¡Veneno! -10 de vida' },
    { name: 'negro (desconocido)', vars: { color: 'negro' }, expect: 'Poción desconocida: mejor no beberla' }
  ],
  solution: `switch (color) {\n    case "rojo":\n        System.out.println("Curación +30");\n        break;\n    case "azul":\n        System.out.println("Maná +20");\n        break;\n    case "verde":\n        System.out.println("¡Veneno! -10 de vida");\n        break;\n    default:\n        System.out.println("Poción desconocida: mejor no beberla");\n}`,
  xp: 50, gold: 15
});

L({
  id: '2-4', world: 2, title: 'La puerta de dos cerraduras', kind: 'trap', foe: { name: 'Puerta encantada', emoji: '🔐', dmg: 9 },
  story: 'Una puerta con dos cerraduras: una exige llave, la otra luz. Pero de día hay luz natural y no hace falta antorcha...',
  lesson: `
<p>Los <b>operadores lógicos</b> combinan condiciones:</p>
<table class="t"><tr><td><code>&amp;&amp;</code></td><td>Y (las dos deben ser verdaderas)</td></tr>
<tr><td><code>||</code></td><td>O (basta con una)</td></tr>
<tr><td><code>!</code></td><td>NO (invierte)</td></tr></table>
<pre><code>if (tieneLlave &amp;&amp; (tieneAntorcha || !esDeNoche)) { ... }</code></pre>
<p>Los paréntesis agrupan, igual que en matemáticas. <code>&amp;&amp;</code> se evalúa antes que <code>||</code>.</p>
<div class="note">📝 <b>Cortocircuito:</b> en <code>a &amp;&amp; b</code>, si <code>a</code> es falso Java ni mira <code>b</code>. Sirve para evitar errores: <code>x != 0 &amp;&amp; 10 / x &gt; 2</code>.</div>`,
  task: 'Variables booleanas: <code>tieneLlave</code>, <code>tieneAntorcha</code>, <code>esDeNoche</code>. La puerta se abre si <b>tienes la llave Y (tienes antorcha O no es de noche)</b>. Imprime <code>Abres la puerta</code> o <code>La puerta sigue cerrada</code>.',
  mode: 'script',
  starter: `// tieneLlave, tieneAntorcha y esDeNoche ya existen\n`,
  hints: ['Condición: <code>tieneLlave &amp;&amp; (tieneAntorcha || !esDeNoche)</code>', 'Un solo <code>if / else</code> basta.', 'Los paréntesis son importantes.'],
  tests: [
    { name: 'llave, antorcha, de noche', vars: { tieneLlave: true, tieneAntorcha: true, esDeNoche: true }, expect: 'Abres la puerta' },
    { name: 'llave, sin antorcha, de noche', vars: { tieneLlave: true, tieneAntorcha: false, esDeNoche: true }, expect: 'La puerta sigue cerrada' },
    { name: 'llave, sin antorcha, de día', vars: { tieneLlave: true, tieneAntorcha: false, esDeNoche: false }, expect: 'Abres la puerta' },
    { name: 'sin llave, antorcha, de día', vars: { tieneLlave: false, tieneAntorcha: true, esDeNoche: false }, expect: 'La puerta sigue cerrada' },
    { name: 'sin nada, de noche', vars: { tieneLlave: false, tieneAntorcha: false, esDeNoche: true }, expect: 'La puerta sigue cerrada' }
  ],
  solution: `if (tieneLlave && (tieneAntorcha || !esDeNoche)) {\n    System.out.println("Abres la puerta");\n} else {\n    System.out.println("La puerta sigue cerrada");\n}`,
  xp: 55, gold: 16
});

L({
  id: '2-b', world: 2, title: 'La Hidra de tres cabezas', kind: 'boss', foe: { name: 'Hidra de tres cabezas', emoji: '🐉', dmg: 12 },
  story: 'La Hidra surge del lago. En cada turno debes decidir bien: curarte, huir, rematar o seguir atacando.',
  lesson: `
<p>Las decisiones reales se <b>anidan</b>: un <code>if</code> dentro de otro.</p>
<pre><code>if (vida &lt; 25) {
    if (pociones &gt; 0) { ... } else { ... }
} else if (...) { ... }</code></pre>
<p>El <b>orden</b> de las reglas es parte de la lógica. Si «vida baja» tiene prioridad sobre «rematar», debe comprobarse primero.</p>`,
  task: 'Variables: <code>vida</code>, <code>pociones</code>, <code>vidaHidra</code>. Reglas por <b>prioridad</b>:<br>1) Si <code>vida &lt; 25</code>: si tienes pociones imprime <code>Beber poción</code>, si no <code>Huir</code>.<br>2) Si no, y <code>vidaHidra &lt;= 30</code>: <code>Remate final</code>.<br>3) En otro caso: <code>Atacar</code>.',
  mode: 'script',
  starter: `// vida, pociones y vidaHidra ya existen\n`,
  hints: ['Primero comprueba <code>vida &lt; 25</code>; dentro, un <code>if/else</code> sobre <code>pociones</code>.', 'Después <code>else if (vidaHidra &lt;= 30)</code>.', 'Cierra con <code>else</code> → <code>Atacar</code>.'],
  tests: [
    { name: 'vida baja, con pociones', vars: { vida: 20, pociones: 2, vidaHidra: 100 }, expect: 'Beber poción' },
    { name: 'vida baja, sin pociones', vars: { vida: 20, pociones: 0, vidaHidra: 100 }, expect: 'Huir' },
    { name: 'vida buena, hidra casi muerta', vars: { vida: 80, pociones: 1, vidaHidra: 25 }, expect: 'Remate final' },
    { name: 'vida buena, hidra fuerte', vars: { vida: 80, pociones: 1, vidaHidra: 100 }, expect: 'Atacar' },
    { name: 'prioridad: vida baja Y hidra casi muerta', vars: { vida: 24, pociones: 1, vidaHidra: 10 }, expect: 'Beber poción' },
    { name: 'justo en el límite de vida (25)', vars: { vida: 25, pociones: 3, vidaHidra: 90 }, expect: 'Atacar' }
  ],
  solution: `if (vida < 25) {\n    if (pociones > 0) {\n        System.out.println("Beber poción");\n    } else {\n        System.out.println("Huir");\n    }\n} else if (vidaHidra <= 30) {\n    System.out.println("Remate final");\n} else {\n    System.out.println("Atacar");\n}`,
  xp: 90, gold: 45
});
})(typeof window !== 'undefined' ? window : globalThis);
