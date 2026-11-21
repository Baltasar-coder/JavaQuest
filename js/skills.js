/* Habilidades por clase y libros (lecciones, trucos y retos de examen) */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };

/* ---- habilidades: 5 tipos (máximo 5 en la barra). Las básicas empiezan desbloqueadas; el resto se aprende con libros ---- */
W.SKILLS = {
  healAmt: 30,
  types: {
    attack: { basic: true, uses: Infinity, desc: 'Ataque básico: cada prueba superada golpea al enemigo.' },
    guard: { basic: true, uses: 2, desc: 'Preparas la defensa: este turno recibes la mitad de daño por cada prueba fallada. (2 usos por reto)' },
    heal: { uses: 1, desc: 'Recuperas 30 de vida al instante. (1 uso por reto)' },
    second: { uses: 1, desc: 'Segunda oportunidad: el primer fallo de este turno no te hace daño. (1 uso por reto)' },
    power: { uses: 1, desc: 'Golpe maestro: si superas todas las pruebas este turno, ganas +25% de XP y oro. (1 uso por reto)' }
  },
  classes: {
    warrior: { attack: ['Tajo', '⚔️'], guard: ['Guardia', '🛡️'], heal: ['Segundo aliento', '❤️‍🩹'], second: ['Contraataque', '🔁'], power: ['Golpe demoledor', '💥'] },
    mage: { attack: ['Rayo arcano', '⚡'], guard: ['Escudo de runas', '🔰'], heal: ['Luz restauradora', '💚'], second: ['Reescribir hechizo', '📜'], power: ['Meteoro', '☄️'] },
    archer: { attack: ['Disparo', '🏹'], guard: ['Esquiva', '💨'], heal: ['Vendaje', '🩹'], second: ['Tiro de rebote', '🎯'], power: ['Lluvia de flechas', '🌧️'] },
    cleric: { attack: ['Golpe sagrado', '✨'], guard: ['Bendición', '🙏'], heal: ['Sanar', '💖'], second: ['Segunda oportunidad', '🕊️'], power: ['Juicio divino', '☀️'] }
  },
  unlock: { heal: 'vocales', second: 'palindromo', power: 'fibonacci' }   // libro (reto) que enseña cada habilidad
};

/* ---- libros: dónde se consiguen ---- */
W.DROPS = {
  '1-e': 'strings', '1-8': 'ternario', '1-b': 'vocales',
  '2-e': 'nulidad', '2-2a': 'palindromo', '2-b': 'media',
  '3-e': 'bucles', '3-4': 'invertir', '3-b': 'fibonacci'
};
W.DROP_WHY = { explore: 'por explorar la mazmorra', boss: 'al derrotar a un jefe', elite: 'al vencer a un enemigo difícil' };

const code = s => `<pre><code>${s}</code></pre>`;
W.BOOKS = {
  strings: { emoji: '📗', kind: 'truco', title: 'Cuaderno de los Textos',
    html: `<p>Los <code>String</code> en Java son <b>inmutables</b>: cada «cambio» crea uno nuevo. Trucos que caen en examen:</p>
<ul><li><b>Compara con el literal primero</b> para no tener NullPointerException: <code>"admin".equals(usuario)</code> en vez de <code>usuario.equals("admin")</code>.</li>
<li>Si concatenas <b>dentro de un bucle</b>, usa <code>StringBuilder</code>: es mucho más rápido.</li>
<li><code>split(",")</code> parte un texto en un array; <code>String.join("-", partes)</code> hace lo contrario.</li>
<li><code>charAt(i)</code> da un <code>char</code>; los <code>char</code> se pueden sumar y comparar como números: <code>'c' - 'a'</code> vale 2.</li></ul>
${code(`StringBuilder sb = new StringBuilder();
for (int i = 0; i < 3; i++) sb.append(i).append(",");
System.out.println(sb);   // 0,1,2,`)}` },
  ternario: { emoji: '📘', kind: 'truco', title: 'Pergamino del Operador Ternario',
    html: `<p>El <b>operador ternario</b> es un <code>if/else</code> comprimido que <b>devuelve un valor</b>:</p>
${code(`String estado = vida > 0 ? "vivo" : "caído";
int mayor = a > b ? a : b;`)}
<ul><li>Forma: <code>condición ? valorSiVerdadero : valorSiFalso</code>.</li>
<li>Ambas ramas deben dar un valor compatible.</li>
<li>Se puede <b>anidar</b>, pero a partir de dos niveles es mejor un <code>if/else if</code>.</li></ul>
<div class="note">📝 <b>Pregunta de examen:</b> ¿qué imprime <code>System.out.println(5 &gt; 3 ? "a" : "b");</code>? → <code>a</code>.</div>` },
  nulidad: { emoji: '📙', kind: 'truco', title: 'Tratado de la Nulidad',
    html: `<p>La excepción más famosa: <code>NullPointerException</code>. Ocurre al usar un objeto que vale <code>null</code> (no apunta a nada).</p>
<ul><li>Causas típicas: variable sin inicializar, un método que devuelve <code>null</code>, un array de objetos (cada casilla empieza en <code>null</code>).</li>
<li><b>Defensa 1:</b> comprobar antes: <code>if (nombre != null &amp;&amp; nombre.length() &gt; 3)</code> (el <code>&amp;&amp;</code> corta si es null).</li>
<li><b>Defensa 2:</b> <code>Objects.requireNonNull(x, "x no puede ser null")</code> para fallar pronto y con mensaje claro.</li>
<li>Los tipos primitivos (<code>int</code>, <code>double</code>...) <b>nunca</b> son null; los envoltorios (<code>Integer</code>, <code>Double</code>) sí.</li></ul>` },
  bucles: { emoji: '📕', kind: 'truco', title: 'Códice de los Bucles',
    html: `<p>Elegir bien el bucle te ahorra errores:</p>
<ul><li><code>for</code>: sabes cuántas vueltas das. <code>while</code>: depende de una condición. <code>do-while</code>: se ejecuta <b>al menos una vez</b>.</li>
<li><b>for-each</b> (<code>for (int x : v)</code>) para recorrer sin índice. No sirve si necesitas la posición o modificar el array.</li>
<li><b>Error off-by-one:</b> con <code>i &lt;= v.length</code> te pasas una vuelta y salta <code>ArrayIndexOutOfBoundsException</code>.</li>
<li>Para <b>borrar mientras recorres</b> una lista: recorre de atrás hacia delante o usa <code>removeIf</code>.</li>
<li>Con <b>etiquetas</b> puedes salir de bucles anidados: <code>fuera: for (...) { for (...) { break fuera; } }</code>.</li></ul>` },
  vocales: { emoji: '📖', kind: 'reto', title: 'Libro de las Vocales', skill: 'heal', challenge: 'b-vocales',
    html: `<p>Un clásico de examen: <b>recorrer un String carácter a carácter</b>.</p>
<p>Idea: pasa el texto a minúsculas, recórrelo con <code>charAt(i)</code> y por cada letra comprueba si es una vocal. Un truco cómodo: <code>"aeiou".indexOf(c) &gt;= 0</code> dice si <code>c</code> es vocal.</p>
${code(`for (int i = 0; i < s.length(); i++) {
    char c = s.charAt(i);
    if ("aeiou".indexOf(c) >= 0) cuenta++;
}`)}
<p>Resuelve el reto del libro y aprenderás una <b>habilidad nueva</b> de tu clase.</p>` },
  palindromo: { emoji: '📖', kind: 'reto', title: 'Libro del Espejo', skill: 'second', challenge: 'b-palindromo',
    html: `<p>Un <b>palíndromo</b> se lee igual al derecho y al revés: «reconocer», «Ana».</p>
<p>Dos estrategias: (1) construir el texto invertido y compararlo con <code>equals</code>; (2) comparar el primer carácter con el último, el segundo con el penúltimo... (dos índices que se acercan).</p>
${code(`int i = 0, j = s.length() - 1;
while (i < j) {
    if (s.charAt(i) != s.charAt(j)) return false;
    i++; j--;
}
return true;`)}
<p>Resuelve el reto y aprenderás una <b>habilidad nueva</b>.</p>` },
  fibonacci: { emoji: '📖', kind: 'reto', title: 'Libro de la Espiral', skill: 'power', challenge: 'b-fibonacci',
    html: `<p>La <b>sucesión de Fibonacci</b>: 0, 1, 1, 2, 3, 5, 8, 13... cada término es la suma de los dos anteriores.</p>
<p>Puedes hacerlo con <b>recursión</b> (<code>fib(n-1) + fib(n-2)</code>, con casos base 0 y 1) o con un <b>bucle</b> guardando los dos últimos valores (mucho más eficiente: la recursión repite cálculos).</p>
<div class="note">📝 <b>Pregunta de examen:</b> ¿por qué la versión recursiva es lenta para n grande? Porque recalcula los mismos valores muchas veces (complejidad exponencial).</div>
<p>Resuelve el reto y aprenderás una <b>habilidad nueva</b>.</p>` },
  media: { emoji: '📖', kind: 'reto', title: 'Libro de la Media', challenge: 'b-media',
    html: `<p>Calcular la <b>media de un array</b>: suma todos los elementos y divide entre la cantidad. ¡Cuidado con la <b>división entera</b>! Convierte antes a <code>double</code>.</p>
${code(`double media = (double) suma / v.length;   // 7 / 2 = 3 pero (double) 7 / 2 = 3.5`)}
<p>Resuelve el reto del libro para ganar XP y oro.</p>` },
  invertir: { emoji: '📖', kind: 'reto', title: 'Libro del Revés', challenge: 'b-invertir',
    html: `<p>Invertir un texto: recórrelo <b>desde el final hasta el principio</b> y ve añadiendo cada carácter a un <code>StringBuilder</code> (o a un String).</p>
${code(`for (int i = s.length() - 1; i >= 0; i--) {
    r += s.charAt(i);
}`)}
<p>Resuelve el reto del libro para ganar XP y oro.</p>` }
};

/* ---- retos de los libros (ejercicios típicos de examen). No aparecen en el mapa: se abren desde el libro ---- */
const SK = body => `public class Main {\n\n${body}\n}\n`;
const L = o => { W.levels[o.id] = Object.assign({ world: 1, kind: 'puzzle', foe: { name: 'Guardián del libro', emoji: '📖', model: 'humanoid', dmg: 10 }, mode: 'class', book: o.id.slice(2), xp: 60, gold: 25 }, o); };

L({ id: 'b-vocales', world: 1, title: 'Reto del libro: contar vocales',
  story: 'Las páginas del libro se agitan: un espíritu guardián exige que demuestres lo que has leído.',
  lesson: `<p>Recorre el <code>String</code> con un bucle y cuenta cuántas veces aparece una vocal (a, e, i, o, u), sin distinguir mayúsculas de minúsculas.</p>${code('for (int i = 0; i < s.length(); i++) { char c = s.charAt(i); ... }')}`,
  task: 'Escribe <code>static int contarVocales(String s)</code>: devuelve cuántas vocales (a, e, i, o, u, en mayúscula o minúscula) tiene el texto.',
  starter: SK('    // static int contarVocales(String s) { ... }\n'), free: 'System.out.println(Main.contarVocales("Hola mundo"));',
  hints: ['Pasa el texto a minúsculas con <code>toLowerCase()</code>.', 'Recorre con <code>charAt(i)</code> y comprueba con <code>"aeiou".indexOf(c) &gt;= 0</code>.', 'Cuenta en una variable y devuélvela al final.'],
  tests: [['Hola mundo', 4], ['AEIOU', 5], ['rhythm', 0], ['Java Quest', 4], ['', 0]].map(([s, n]) => ({ name: `contarVocales("${s}") = ${n}`, snippet: `System.out.println(Main.contarVocales("${s}"));`, expect: String(n) })),
  solution: SK('    static int contarVocales(String s) {\n        int cuenta = 0;\n        String t = s.toLowerCase();\n        for (int i = 0; i < t.length(); i++) {\n            if ("aeiou".indexOf(t.charAt(i)) >= 0) {\n                cuenta++;\n            }\n        }\n        return cuenta;\n    }\n') });

L({ id: 'b-palindromo', world: 2, title: 'Reto del libro: palíndromo',
  story: 'El espejo del libro refleja tu código: si no se lee igual al revés, te devuelve el golpe.',
  lesson: `<p>Un palíndromo se lee igual de izquierda a derecha que de derecha a izquierda. Ignora mayúsculas/minúsculas.</p>${code('int i = 0, j = s.length() - 1;\nwhile (i < j) { ... i++; j--; }')}`,
  task: 'Escribe <code>static boolean esPalindromo(String s)</code>: <code>true</code> si el texto es un palíndromo (sin distinguir mayúsculas). El texto vacío cuenta como palíndromo.',
  starter: SK('    // static boolean esPalindromo(String s) { ... }\n'), free: 'System.out.println(Main.esPalindromo("reconocer"));',
  hints: ['Pasa a minúsculas primero.', 'Usa dos índices: <code>i</code> al principio y <code>j</code> al final.', 'Si <code>charAt(i) != charAt(j)</code>, devuelve false; si el bucle termina, true.'],
  tests: [['reconocer', true], ['Ana', true], ['java', false], ['a', true], ['', true], ['Radar', true], ['abca', false]].map(([s, b]) => ({ name: `esPalindromo("${s}") = ${b}`, snippet: `System.out.println(Main.esPalindromo("${s}"));`, expect: String(b) })),
  solution: SK('    static boolean esPalindromo(String s) {\n        String t = s.toLowerCase();\n        int i = 0;\n        int j = t.length() - 1;\n        while (i < j) {\n            if (t.charAt(i) != t.charAt(j)) {\n                return false;\n            }\n            i++;\n            j--;\n        }\n        return true;\n    }\n') });

L({ id: 'b-fibonacci', world: 3, title: 'Reto del libro: Fibonacci',
  story: 'Una espiral dorada gira sobre las páginas: cada vuelta suma las dos anteriores.',
  lesson: `<p>fib(0) = 0, fib(1) = 1 y fib(n) = fib(n-1) + fib(n-2). Puedes usar recursión o un bucle.</p>`,
  task: 'Escribe <code>static int fibonacci(int n)</code>: devuelve el término n de la sucesión (0, 1, 1, 2, 3, 5, 8...).',
  starter: SK('    // static int fibonacci(int n) { ... }\n'), free: 'System.out.println(Main.fibonacci(10));',
  hints: ['Casos base: <code>n == 0</code> devuelve 0 y <code>n == 1</code> devuelve 1.', 'Recursivo: <code>return fibonacci(n - 1) + fibonacci(n - 2);</code>', 'Con bucle: guarda los dos últimos valores y avanza n veces.'],
  tests: [[0, 0], [1, 1], [2, 1], [7, 13], [10, 55], [15, 610]].map(([n, r]) => ({ name: `fibonacci(${n}) = ${r}`, snippet: `System.out.println(Main.fibonacci(${n}));`, expect: String(r) })),
  solution: SK('    static int fibonacci(int n) {\n        if (n < 2) {\n            return n;\n        }\n        int a = 0;\n        int b = 1;\n        for (int i = 2; i <= n; i++) {\n            int c = a + b;\n            a = b;\n            b = c;\n        }\n        return b;\n    }\n') });

L({ id: 'b-media', world: 2, title: 'Reto del libro: la media',
  story: 'Los números del libro bailan: solo su media los calmará.',
  lesson: `<p>Suma los elementos y divide entre la cantidad. Con enteros, <code>7 / 2</code> da 3: convierte a <code>double</code> antes.</p>`,
  task: 'Escribe <code>static double media(int[] v)</code>: devuelve la media aritmética del array (nunca está vacío).',
  starter: SK('    // static double media(int[] v) { ... }\n'), free: 'int[] a = {1, 2, 3, 4};\nSystem.out.println(Main.media(a));',
  hints: ['Acumula la suma en un <code>int</code>.', 'Devuelve <code>(double) suma / v.length</code>.'],
  tests: [['{1, 2, 3, 4}', '2.5'], ['{10}', '10.0'], ['{1, 2}', '1.5'], ['{-4, 4}', '0.0']].map(([a, r]) => ({ name: `media(${a}) = ${r}`, snippet: `int[] a = ${a};\nSystem.out.println(Main.media(a));`, expect: r })),
  solution: SK('    static double media(int[] v) {\n        int suma = 0;\n        for (int x : v) {\n            suma += x;\n        }\n        return (double) suma / v.length;\n    }\n') });

L({ id: 'b-invertir', world: 3, title: 'Reto del libro: invertir un texto',
  story: 'Las letras del libro se han desordenado: hay que leerlas al revés.',
  lesson: `<p>Recorre el texto desde el último carácter hasta el primero y ve construyendo el resultado.</p>`,
  task: 'Escribe <code>static String invertir(String s)</code>: devuelve el texto al revés (<code>"hola"</code> → <code>"aloh"</code>).',
  starter: SK('    // static String invertir(String s) { ... }\n'), free: 'System.out.println(Main.invertir("hola"));',
  hints: ['Bucle <code>for (int i = s.length() - 1; i &gt;= 0; i--)</code>.', 'Añade cada <code>s.charAt(i)</code> a un <code>StringBuilder</code> o a un String.'],
  tests: [['hola', 'aloh'], ['Java', 'avaJ'], ['', ''], ['a', 'a'], ['ab cd', 'dc ba']].map(([s, r]) => ({ name: `invertir("${s}") = "${r}"`, snippet: `System.out.println("[" + Main.invertir("${s}") + "]");`, expect: `[${r}]` })),
  solution: SK('    static String invertir(String s) {\n        StringBuilder sb = new StringBuilder();\n        for (int i = s.length() - 1; i >= 0; i--) {\n            sb.append(s.charAt(i));\n        }\n        return sb.toString();\n    }\n') });
})(typeof window !== 'undefined' ? window : globalThis);
