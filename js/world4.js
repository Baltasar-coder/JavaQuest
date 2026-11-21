/* MUNDO 4 · La Torre de los Métodos y Arrays */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };
const L = o => { W.levels[o.id] = o; return o; };
const SK = (body, extra) => `public class Main {\n\n${extra || ''}${body}\n}\n`;

W.worlds.push({
  id: 4, name: 'La Torre de los Métodos', emoji: '🗼', theme: 'tower',
  blurb: 'Métodos, parámetros, retorno, sobrecarga, arrays, matrices y recursión.',
  intro: 'Una torre altísima se alza ante ti. Cada piso guarda un hechizo que solo funciona si lo escribes como un <b>método</b> reutilizable. A partir de aquí escribirás una clase completa: <code>public class Main</code>.',
  nodes: ['4-1', '4-2', ['4-3a', '4-3b'], '4-4', '4-5', '4-6', '4-7', '4-b']
});

L({
  id: '4-1', world: 4, title: 'Tu primer hechizo', kind: 'combat', foe: { name: 'Espectro del primer piso', emoji: '👻', dmg: 10 },
  story: 'Un espectro bloquea la escalera. Solo huirá ante un hechizo bien lanzado... y ese hechizo hay que <b>escribirlo</b>.',
  lesson: `
<p>Un <b>método</b> es un trozo de código con nombre que puedes ejecutar (<i>llamar</i>) cuantas veces quieras:</p>
<pre><code>public class Main {

    static void bolaDeFuego() {
        System.out.println("¡Bola de fuego!");
    }

    public static void main(String[] args) {
        bolaDeFuego();     // llamada al método
        bolaDeFuego();
    }
}</code></pre>
<ul>
<li><code>void</code>: el método <b>no devuelve</b> ningún valor.</li>
<li><code>static</code>: por ahora escríbelo siempre; en el mundo 5 entenderás por qué.</li>
<li>Los paréntesis <code>()</code> están vacíos porque no recibe datos.</li>
</ul>
<div class="note">📝 A partir de este mundo escribes <b>clases completas</b>. Todo el código vive dentro de <code>public class Main { ... }</code>.</div>`,
  task: 'Dentro de la clase <code>Main</code>, escribe un método <code>static void bolaDeFuego()</code> que imprima <code>¡Bola de fuego!</code>. El juego lo llamará varias veces.',
  mode: 'class',
  starter: SK('    // static void bolaDeFuego() { ... }\n'),
  free: 'Main.bolaDeFuego();',
  hints: ['La firma es <code>static void bolaDeFuego()</code>.', 'El cuerpo va entre llaves e incluye un <code>System.out.println</code>.', 'No hace falta escribir <code>main</code>: el juego llama a tu método.'],
  tests: [
    { name: 'Una llamada', snippet: 'Main.bolaDeFuego();', expect: '¡Bola de fuego!' },
    { name: 'Tres llamadas seguidas', snippet: 'Main.bolaDeFuego(); Main.bolaDeFuego(); Main.bolaDeFuego();', expect: '¡Bola de fuego!\n¡Bola de fuego!\n¡Bola de fuego!' }
  ],
  solution: SK('    static void bolaDeFuego() {\n        System.out.println("¡Bola de fuego!");\n    }\n'),
  xp: 60, gold: 20
});

L({
  id: '4-2', world: 4, title: 'Daño a medida', kind: 'combat', foe: { name: 'Gárgola', emoji: '🗿', dmg: 10 },
  story: 'La gárgola exige un hechizo adaptable: que cambie según tu fuerza y tu nivel. Es hora de usar <b>parámetros</b> y <b>return</b>.',
  lesson: `
<p>Los métodos pueden <b>recibir datos</b> (parámetros) y <b>devolver un resultado</b> (<code>return</code>):</p>
<pre><code>static int suma(int a, int b) {
    return a + b;
}</code></pre>
<ul>
<li>Delante del nombre va el <b>tipo de retorno</b> (<code>int</code>, <code>double</code>, <code>String</code>, <code>boolean</code>...). Con <code>void</code> no se devuelve nada.</li>
<li>Cada parámetro lleva su tipo: <code>(int a, int b)</code>.</li>
<li><code>return</code> termina el método y entrega el valor. Debe coincidir con el tipo de retorno.</li>
<li>Quien llama puede guardar el resultado: <code>int r = suma(2, 3);</code></li>
</ul>`,
  task: 'Escribe <code>static int calcularDanio(int fuerza, int nivel)</code> que <b>devuelva</b> <code>fuerza * 2 + nivel</code>. (Devolver no es lo mismo que imprimir.)',
  mode: 'class',
  starter: SK('    // static int calcularDanio(int fuerza, int nivel) { ... }\n'),
  free: 'System.out.println(Main.calcularDanio(10, 3));',
  hints: ['La primera línea: <code>static int calcularDanio(int fuerza, int nivel) {</code>', 'Dentro: <code>return fuerza * 2 + nivel;</code>', 'No uses println dentro: el método debe devolver el número.'],
  tests: [
    { name: 'calcularDanio(10, 3)', snippet: 'System.out.println(Main.calcularDanio(10, 3));', expect: '23' },
    { name: 'calcularDanio(0, 0)', snippet: 'System.out.println(Main.calcularDanio(0, 0));', expect: '0' },
    { name: 'calcularDanio(25, 7)', snippet: 'System.out.println(Main.calcularDanio(25, 7));', expect: '57' },
    { name: 'Se puede usar en una operación', snippet: 'int total = Main.calcularDanio(5, 1) + Main.calcularDanio(2, 2);\nSystem.out.println(total);', expect: '17' }
  ],
  solution: SK('    static int calcularDanio(int fuerza, int nivel) {\n        return fuerza * 2 + nivel;\n    }\n'),
  xp: 65, gold: 22
});

L({
  id: '4-3a', world: 4, title: 'Una espada, muchos golpes', kind: 'puzzle', foe: { name: 'Armadura viviente', emoji: '🛡️', dmg: 11 },
  story: 'La armadura reacciona igual ante «atacar con espada» que ante «atacar con arco tres veces». Dos formas de llamar al mismo hechizo.',
  lesson: `
<p>La <b>sobrecarga</b> permite definir <b>varios métodos con el mismo nombre</b> si sus parámetros son distintos (en número o en tipo):</p>
<pre><code>static String saludar(String nombre) { ... }
static String saludar(String nombre, int veces) { ... }</code></pre>
<p>Java decide cuál ejecutar mirando los argumentos de la llamada.</p>
<div class="note">📝 <b>Para el examen:</b> el tipo de retorno <b>no</b> cuenta para distinguir métodos sobrecargados. Lo que importa es la lista de parámetros.</div>`,
  task: 'Escribe dos métodos llamados <code>atacar</code>: <code>static String atacar(String arma)</code> devuelve <code>Atacas con ARMA</code>; y <code>static String atacar(String arma, int veces)</code> devuelve <code>Atacas con ARMA N veces</code> (sustituyendo ARMA y N).',
  mode: 'class',
  starter: SK('    // dos métodos llamados atacar, con distintos parámetros\n'),
  free: 'System.out.println(Main.atacar("espada"));\nSystem.out.println(Main.atacar("arco", 3));',
  hints: ['Uno recibe solo <code>String arma</code>; el otro <code>String arma, int veces</code>.', '<code>return "Atacas con " + arma;</code>', '<code>return "Atacas con " + arma + " " + veces + " veces";</code>'],
  tests: [
    { name: 'atacar("espada")', snippet: 'System.out.println(Main.atacar("espada"));', expect: 'Atacas con espada' },
    { name: 'atacar("arco", 3)', snippet: 'System.out.println(Main.atacar("arco", 3));', expect: 'Atacas con arco 3 veces' },
    { name: 'atacar("daga", 10)', snippet: 'System.out.println(Main.atacar("daga", 10));', expect: 'Atacas con daga 10 veces' }
  ],
  solution: SK('    static String atacar(String arma) {\n        return "Atacas con " + arma;\n    }\n\n    static String atacar(String arma, int veces) {\n        return "Atacas con " + arma + " " + veces + " veces";\n    }\n'),
  xp: 70, gold: 24
});

L({
  id: '4-3b', world: 4, title: 'El detector de trampas', kind: 'trap', foe: { name: 'Suelo trampa', emoji: '⚙️', dmg: 11 },
  story: 'El suelo está lleno de placas numeradas. Las de número <b>primo</b> son trampas mortales. Necesitas un método que lo detecte.',
  lesson: `
<p>Un método puede devolver <code>boolean</code> y usarse como <b>condición</b>:</p>
<pre><code>static boolean esPar(int n) {
    return n % 2 == 0;
}

if (esPar(4)) { ... }</code></pre>
<p>Un número <b>primo</b> es mayor que 1 y solo es divisible entre 1 y él mismo. Se comprueba probando divisores desde 2: si alguno divide exacto, no es primo.</p>
<div class="note">📝 Un <code>return</code> dentro de un bucle termina el método al instante: útil para «encontré un divisor, ya sé la respuesta».</div>`,
  task: 'Escribe <code>static boolean esPrimo(int n)</code>. Devuelve <code>true</code> si <code>n</code> es primo y <code>false</code> si no (los números menores que 2 no son primos).',
  mode: 'class',
  starter: SK('    // static boolean esPrimo(int n) { ... }\n'),
  free: 'System.out.println(Main.esPrimo(7));',
  hints: ['Si <code>n &lt; 2</code>, devuelve <code>false</code> directamente.', 'Bucle <code>for (int d = 2; d &lt; n; d++)</code>; si <code>n % d == 0</code>, devuelve <code>false</code>.', 'Si el bucle termina sin encontrar divisores, <code>return true;</code>.'],
  tests: [2, 3, 4, 17, 1, 0, 20, 29].map(n => ({ name: `esPrimo(${n})`, snippet: `System.out.println(Main.esPrimo(${n}));`, expect: String([2, 3, 5, 7, 11, 13, 17, 19, 23, 29].includes(n)) })),
  solution: SK('    static boolean esPrimo(int n) {\n        if (n < 2) {\n            return false;\n        }\n        for (int d = 2; d < n; d++) {\n            if (n % d == 0) {\n                return false;\n            }\n        }\n        return true;\n    }\n'),
  xp: 70, gold: 24
});

L({
  id: '4-4', world: 4, title: 'El inventario', kind: 'treasure', foe: { name: 'Cofre de la torre', emoji: '🧰', dmg: 11 },
  story: 'El cofre guarda objetos en casillas numeradas: un <b>array</b>. Para abrirlo debes sumar su valor y encontrar la pieza más valiosa.',
  lesson: `
<p>Un <b>array</b> guarda varios valores <b>del mismo tipo</b> en posiciones numeradas desde <b>0</b>:</p>
<pre><code>int[] valores = {5, 12, 7};
valores[0]            // 5
valores[2] = 9;       // cambia el tercero
valores.length        // 3  (¡sin paréntesis!)

int[] vacio = new int[4];   // {0, 0, 0, 0}</code></pre>
<p>Se recorre con <code>for</code> normal o con <b>for-each</b>:</p>
<pre><code>for (int i = 0; i &lt; valores.length; i++) { ... valores[i] ... }
for (int v : valores) { ... v ... }</code></pre>
<div class="note">⚠️ <code>valores[3]</code> en un array de 3 elementos lanza <code>ArrayIndexOutOfBoundsException</code>. Los índices válidos van de 0 a <code>length - 1</code>.</div>`,
  task: 'Escribe <code>static int sumar(int[] v)</code> (suma de todos los elementos) y <code>static int maximo(int[] v)</code> (el mayor; el array nunca está vacío).',
  mode: 'class',
  starter: SK('    // static int sumar(int[] v) { ... }\n    // static int maximo(int[] v) { ... }\n'),
  free: 'int[] a = {3, 9, 2};\nSystem.out.println(Main.sumar(a));\nSystem.out.println(Main.maximo(a));',
  hints: ['<code>int total = 0;</code> y un for-each: <code>for (int x : v) total += x;</code>', 'Para el máximo empieza con <code>int m = v[0];</code> y compara con los demás.', 'Cuidado: los números pueden ser negativos; no empieces el máximo en 0.'],
  tests: [
    { name: 'sumar({3, 9, 2})', snippet: 'int[] a = {3, 9, 2};\nSystem.out.println(Main.sumar(a));', expect: '14' },
    { name: 'maximo({3, 9, 2})', snippet: 'int[] a = {3, 9, 2};\nSystem.out.println(Main.maximo(a));', expect: '9' },
    { name: 'maximo con negativos', snippet: 'int[] a = {-8, -3, -20};\nSystem.out.println(Main.maximo(a));', expect: '-3' },
    { name: 'array de un solo elemento', snippet: 'int[] a = {42};\nSystem.out.println(Main.sumar(a) + " " + Main.maximo(a));', expect: '42 42' }
  ],
  solution: SK('    static int sumar(int[] v) {\n        int total = 0;\n        for (int x : v) {\n            total += x;\n        }\n        return total;\n    }\n\n    static int maximo(int[] v) {\n        int m = v[0];\n        for (int i = 1; i < v.length; i++) {\n            if (v[i] > m) {\n                m = v[i];\n            }\n        }\n        return m;\n    }\n'),
  xp: 80, gold: 26
});

L({
  id: '4-5', world: 4, title: 'Buscar en la mochila', kind: 'puzzle', foe: { name: 'Mochila embrujada', emoji: '🎒', dmg: 11 },
  story: 'La mochila embrujada esconde objetos y solo te dice «caliente» cuando preguntas por el correcto. Necesitas una <b>búsqueda lineal</b>.',
  lesson: `
<p>La <b>búsqueda lineal</b> recorre el array de principio a fin hasta encontrar lo que buscas:</p>
<pre><code>static int buscar(int[] v, int objetivo) {
    for (int i = 0; i &lt; v.length; i++) {
        if (v[i] == objetivo) {
            return i;          // lo encontré: devuelvo su posición
        }
    }
    return -1;                 // no está
}</code></pre>
<p>Devolver <b>-1</b> es la convención para «no encontrado», porque -1 nunca es una posición válida.</p>
<div class="note">⚠️ Con Strings no uses <code>==</code>: compara con <code>.equals()</code>.</div>`,
  task: 'Escribe <code>static int buscar(String[] objetos, String objetivo)</code>: devuelve la <b>posición</b> de la primera aparición de <code>objetivo</code>, o <code>-1</code> si no está.',
  mode: 'class',
  starter: SK('    // static int buscar(String[] objetos, String objetivo) { ... }\n'),
  free: 'String[] m = {"espada", "poción", "llave"};\nSystem.out.println(Main.buscar(m, "llave"));',
  hints: ['Recorre con <code>for (int i = 0; i &lt; objetos.length; i++)</code>.', 'Compara con <code>objetos[i].equals(objetivo)</code> y devuelve <code>i</code>.', 'Después del bucle, <code>return -1;</code>'],
  tests: [
    { name: 'objeto en el medio', snippet: 'String[] m = {"espada", "poción", "llave"};\nSystem.out.println(Main.buscar(m, "poción"));', expect: '1' },
    { name: 'objeto al final', snippet: 'String[] m = {"espada", "poción", "llave"};\nSystem.out.println(Main.buscar(m, "llave"));', expect: '2' },
    { name: 'objeto que no está', snippet: 'String[] m = {"espada", "poción", "llave"};\nSystem.out.println(Main.buscar(m, "escudo"));', expect: '-1' },
    { name: 'repetido: la primera aparición', snippet: 'String[] m = {"oro", "gema", "oro"};\nSystem.out.println(Main.buscar(m, "oro"));', expect: '0' }
  ],
  solution: SK('    static int buscar(String[] objetos, String objetivo) {\n        for (int i = 0; i < objetos.length; i++) {\n            if (objetos[i].equals(objetivo)) {\n                return i;\n            }\n        }\n        return -1;\n    }\n'),
  xp: 80, gold: 26
});

L({
  id: '4-6', world: 4, title: 'El mapa de la mazmorra', kind: 'treasure', foe: { name: 'Cartógrafo fantasma', emoji: '🗺️', dmg: 12 },
  story: 'El fantasma de un cartógrafo te entrega el plano de la planta: una cuadrícula. Quiere saber cuántos tesoros (<code>T</code>) hay marcados.',
  lesson: `
<p>Un <b>array bidimensional</b> es un array de arrays: una tabla con filas y columnas.</p>
<pre><code>char[][] mapa = {
    {'.', 'T', '.'},
    {'T', '#', 'T'}
};
mapa[1][2]        // 'T'  (fila 1, columna 2)
mapa.length       // 2    (número de filas)
mapa[0].length    // 3    (columnas de la fila 0)</code></pre>
<p>Se recorre con <b>dos bucles anidados</b>: uno para filas y otro para columnas.</p>
<pre><code>for (int f = 0; f &lt; mapa.length; f++) {
    for (int c = 0; c &lt; mapa[f].length; c++) { ... mapa[f][c] ... }
}</code></pre>
<div class="note">📝 Los <code>char</code> se escriben entre <b>comillas simples</b> <code>'T'</code>; los Strings, entre dobles <code>"T"</code>. Se comparan con <code>==</code>.</div>`,
  task: 'Escribe <code>static int contarTesoros(char[][] mapa)</code>: devuelve cuántas casillas contienen el carácter <code>\'T\'</code>.',
  mode: 'class',
  starter: SK('    // static int contarTesoros(char[][] mapa) { ... }\n'),
  free: "char[][] m = {{'.', 'T'}, {'T', 'T'}};\nSystem.out.println(Main.contarTesoros(m));",
  hints: ['Dos bucles for anidados: filas y columnas.', "Dentro: <code>if (mapa[f][c] == 'T') cuenta++;</code>", 'Declara el contador fuera de los bucles y devuélvelo al final.'],
  tests: [
    { name: 'mapa 2×3', snippet: "char[][] m = {{'.', 'T', '.'}, {'T', '#', 'T'}};\nSystem.out.println(Main.contarTesoros(m));", expect: '3' },
    { name: 'sin tesoros', snippet: "char[][] m = {{'#', '#'}, {'.', '.'}, {'#', '.'}};\nSystem.out.println(Main.contarTesoros(m));", expect: '0' },
    { name: 'todo tesoros', snippet: "char[][] m = {{'T', 'T'}, {'T', 'T'}};\nSystem.out.println(Main.contarTesoros(m));", expect: '4' },
    { name: 'filas de distinta longitud', snippet: "char[][] m = {{'T'}, {'.', 'T', 'T'}, {}};\nSystem.out.println(Main.contarTesoros(m));", expect: '3' }
  ],
  solution: SK("    static int contarTesoros(char[][] mapa) {\n        int cuenta = 0;\n        for (int f = 0; f < mapa.length; f++) {\n            for (int c = 0; c < mapa[f].length; c++) {\n                if (mapa[f][c] == 'T') {\n                    cuenta++;\n                }\n            }\n        }\n        return cuenta;\n    }\n"),
  xp: 90, gold: 28
});

L({
  id: '4-7', world: 4, title: 'La escalera infinita', kind: 'trap', foe: { name: 'Escalera encantada', emoji: '🪜', dmg: 12 },
  story: 'La escalera de caracol se repite igual que si cada peldaño contuviera otra escalera más pequeña. Es hora de pensar en <b>recursión</b>.',
  lesson: `
<p>Un método es <b>recursivo</b> cuando se <b>llama a sí mismo</b>. Siempre necesita dos cosas:</p>
<ol><li>Un <b>caso base</b>: cuando la respuesta es directa y no hace falta llamarse más.</li>
<li>Un <b>caso recursivo</b>: reduce el problema y se llama con algo «más pequeño».</li></ol>
<pre><code>static int sumaHasta(int n) {
    if (n == 0) {
        return 0;                    // caso base
    }
    return n + sumaHasta(n - 1);     // caso recursivo
}</code></pre>
<p>sumaHasta(3) = 3 + sumaHasta(2) = 3 + (2 + sumaHasta(1)) = 3 + (2 + (1 + 0)) = 6.</p>
<div class="note">⚠️ Sin caso base (o si nunca se alcanza) la recursión es infinita y Java lanza <code>StackOverflowError</code>.</div>`,
  task: 'Escribe, <b>de forma recursiva</b>, <code>static int factorial(int n)</code> (n! = n × (n-1) × ... × 1, y 0! = 1) y <code>static int sumaHasta(int n)</code> (1 + 2 + ... + n, con sumaHasta(0) = 0).',
  mode: 'class',
  starter: SK('    // static int factorial(int n) { ... }\n    // static int sumaHasta(int n) { ... }\n'),
  free: 'System.out.println(Main.factorial(5));',
  hints: ['Caso base de factorial: <code>if (n &lt;= 1) return 1;</code>', 'Caso recursivo: <code>return n * factorial(n - 1);</code>', 'sumaHasta es igual: base 0, y <code>n + sumaHasta(n - 1)</code>.'],
  tests: [
    { name: 'factorial(5) = 120', snippet: 'System.out.println(Main.factorial(5));', expect: '120' },
    { name: 'factorial(0) = 1', snippet: 'System.out.println(Main.factorial(0));', expect: '1' },
    { name: 'factorial(10) = 3628800', snippet: 'System.out.println(Main.factorial(10));', expect: '3628800' },
    { name: 'sumaHasta(10) = 55', snippet: 'System.out.println(Main.sumaHasta(10));', expect: '55' },
    { name: 'sumaHasta(0) = 0', snippet: 'System.out.println(Main.sumaHasta(0));', expect: '0' }
  ],
  solution: SK('    static int factorial(int n) {\n        if (n <= 1) {\n            return 1;\n        }\n        return n * factorial(n - 1);\n    }\n\n    static int sumaHasta(int n) {\n        if (n == 0) {\n            return 0;\n        }\n        return n + sumaHasta(n - 1);\n    }\n'),
  xp: 100, gold: 30
});

L({
  id: '4-b', world: 4, title: 'El Gólem de Arrays', kind: 'boss', foe: { name: 'Gólem de Arrays', emoji: '🤖', dmg: 14 },
  story: 'En la cima de la torre, un gólem de engranajes mantiene todo desordenado. Para detenerlo debes <b>ordenar</b> sus piezas y <b>darles la vuelta</b>.',
  lesson: `
<p>Ordenar un array es un clásico. El <b>método de la burbuja</b> compara vecinos y los intercambia si están mal colocados, repitiendo hasta que no queda nada por cambiar:</p>
<pre><code>for (int pasada = 0; pasada &lt; v.length - 1; pasada++) {
    for (int i = 0; i &lt; v.length - 1 - pasada; i++) {
        if (v[i] &gt; v[i + 1]) {
            int tmp = v[i];       // intercambio con variable auxiliar
            v[i] = v[i + 1];
            v[i + 1] = tmp;
        }
    }
}</code></pre>
<p>Los arrays se pasan <b>por referencia</b>: si un método modifica el array recibido, el cambio lo ve quien llamó. Por eso <code>ordenar</code> puede ser <code>void</code>.</p>
<div class="note">📝 <b>Para el examen:</b> los tipos primitivos (<code>int</code>...) se pasan por valor (copia); los arrays y objetos, por referencia (el mismo objeto).</div>`,
  task: 'Escribe <code>static void ordenar(int[] v)</code> que <b>ordene de menor a mayor el propio array</b> (sin usar <code>Arrays.sort</code>) y <code>static int[] invertir(int[] v)</code> que <b>devuelva un array nuevo</b> con los elementos en orden inverso (sin modificar el original).',
  mode: 'class',
  starter: SK('    // static void ordenar(int[] v) { ... }\n    // static int[] invertir(int[] v) { ... }\n'),
  free: 'int[] a = {5, 2, 9, 1};\nMain.ordenar(a);\nSystem.out.println(java.util.Arrays.toString(a));',
  hints: ['Burbuja: dos bucles anidados; si <code>v[i] &gt; v[i+1]</code>, intercámbialos con una variable <code>tmp</code>.', 'Para invertir: <code>int[] r = new int[v.length];</code> y <code>r[i] = v[v.length - 1 - i];</code>', 'invertir debe devolver <code>r</code> y dejar <code>v</code> intacto.'],
  tests: [
    { name: 'ordenar {5, 2, 9, 1}', snippet: 'int[] a = {5, 2, 9, 1};\nMain.ordenar(a);\nSystem.out.println(java.util.Arrays.toString(a));', expect: '[1, 2, 5, 9]' },
    { name: 'ordenar con repetidos y negativos', snippet: 'int[] a = {3, -1, 3, 0, -5};\nMain.ordenar(a);\nSystem.out.println(java.util.Arrays.toString(a));', expect: '[-5, -1, 0, 3, 3]' },
    { name: 'ordenar un array ya ordenado', snippet: 'int[] a = {1, 2, 3};\nMain.ordenar(a);\nSystem.out.println(java.util.Arrays.toString(a));', expect: '[1, 2, 3]' },
    { name: 'invertir {1, 2, 3, 4}', snippet: 'int[] a = {1, 2, 3, 4};\nSystem.out.println(java.util.Arrays.toString(Main.invertir(a)));', expect: '[4, 3, 2, 1]' },
    { name: 'invertir no modifica el original', snippet: 'int[] a = {1, 2, 3};\nint[] b = Main.invertir(a);\nSystem.out.println(java.util.Arrays.toString(a) + " " + java.util.Arrays.toString(b));', expect: '[1, 2, 3] [3, 2, 1]' }
  ],
  solution: SK('    static void ordenar(int[] v) {\n        for (int pasada = 0; pasada < v.length - 1; pasada++) {\n            for (int i = 0; i < v.length - 1 - pasada; i++) {\n                if (v[i] > v[i + 1]) {\n                    int tmp = v[i];\n                    v[i] = v[i + 1];\n                    v[i + 1] = tmp;\n                }\n            }\n        }\n    }\n\n    static int[] invertir(int[] v) {\n        int[] r = new int[v.length];\n        for (int i = 0; i < v.length; i++) {\n            r[i] = v[v.length - 1 - i];\n        }\n        return r;\n    }\n'),
  xp: 140, gold: 70
});
})(typeof window !== 'undefined' ? window : globalThis);
