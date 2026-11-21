/* MUNDO 1 · La Cripta del Aprendiz — fundamentos */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };
const L = o => { W.levels[o.id] = o; return o; };

W.worlds.push({
  id: 1, name: 'La Cripta del Aprendiz', emoji: '🕯️', theme: 'crypt',
  blurb: 'Fundamentos de Java: variables, operadores, casting, String y Scanner. Programas completos, como en Eclipse.',
  intro: 'Despiertas en una cripta húmeda. Una voz cavernosa susurra: «Solo quien domine las palabras y los números saldrá de aquí...»',
  nodes: ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10', '1-11', '1-e', '1-b']
});

L({
  id: '1-1', world: 1, title: 'La puerta rúnica', kind: 'puzzle', foe: { name: 'Puerta rúnica', emoji: '🚪' },
  story: 'Un goblin portero guarda la puerta rúnica y no te deja pasar. Para plantarle cara hay que hablarle en el idioma de las máquinas: escribe lo que le dirías y haz que salga en pantalla.',
  lesson: `
<p>Todo programa Java vive dentro de una <b>clase</b> y arranca en el método <code>main</code>:</p>
<pre><code>public class Main {
    public static void main(String[] args) {
        // aquí van tus órdenes
    }
}</code></pre>
<div class="note">⌨️ <b>Truco de Eclipse:</b> escribe <code>main</code> y pulsa <b>Ctrl + Espacio</b>: se escribe todo solo. Con <code>syso</code> + Ctrl + Espacio sale <code>System.out.println();</code> Y <b>Ctrl + Shift + F</b> ordena la sangría de todo el código.</div>
<p>Dentro del <code>main</code> pones tus órdenes. La instrucción para escribir texto en pantalla es:</p>
<pre><code>System.out.println("Hola");</code></pre>
<ul>
<li>El texto va entre <b>comillas dobles</b> <code>" "</code>.</li>
<li>Cada instrucción termina con un <b>punto y coma</b> <code>;</code>. Si te lo olvidas, Java se queja.</li>
<li><code>println</code> escribe el texto y salta de línea. Para no saltar existe <code>print</code>.</li>
<li>Lo que escribes tras <code>//</code> es un <b>comentario</b>: Java lo ignora, es para humanos.</li>
</ul>
<div class="note">📝 <b>Para el examen:</b> en Java mayúsculas y minúsculas importan. <code>System</code> se escribe con S mayúscula; <code>system</code> no existe.</div>`,
  task: 'Escribe <b>dos líneas</b> en pantalla: <code>Hola sucio goblin</code> y debajo <code>He venido a derrotarte</code>. Después, <b>dentro del <code>main</code></b>, ordena el golpe con <code>heroe.atacar(1);</code>.',
  mode: 'script',
  requireMain: true,
  starter: `// 1) Escribe main y pulsa Ctrl + Espacio: Java te rellena el esqueleto del programa.\n// 2) Dentro, escribe syso y pulsa Ctrl + Espacio para escribir en pantalla.\n// 3) Al final del main, ordena el golpe: heroe.atacar(1);\n`,
  guide: {
    title: 'Tu primer programa en Java',
    pages: [
      'Todo programa Java es una <b>clase</b> que contiene un método llamado <b><code>main</code></b>. Es el punto donde el programa empieza a ejecutarse, y hay que escribirlo siempre.',
      'No hace falta teclearlo entero. Escribe <code>main</code> en el editor y pulsa <b>Ctrl + Espacio</b> (como en Eclipse): aparece todo el esqueleto y el cursor queda <b>dentro del main</b>, que es donde van tus órdenes.',
      'Para escribir algo en pantalla usas el método <code>println</code> del objeto <code>System.out</code>. Dentro del <code>main</code> escribe <code>syso</code> y pulsa <b>Ctrl + Espacio</b>: se completa <code>System.out.println();</code> (es la abreviatura que usa Eclipse; también vale <code>sysout</code>). Lo que va entre los paréntesis es el <b>parámetro</b>: lo que quieres mostrar.',
      'Un texto se escribe <b>entre comillas dobles</b>: <code>"Hola"</code>. Ese texto es un <b>String</b> (cadena de caracteres), un tipo de dato que es un objeto. Cada orden termina con <b>;</b> y se escribe una por línea.',
      '<b>⚔️ En JavaQuest todo se hace programando, también atacar.</b><br>Tu programa de combate tiene dos partes: <b>1)</b> lo que pide la misión (aquí, dos <code>println</code>) y <b>2)</b> la <b>orden de ataque</b>, que escribes tú <b>dentro de <code>main</code>, al final</b>: <code>heroe.atacar(1);</code>.<br>Es una llamada a un método del objeto <code>heroe</code> (como <code>System.out.println</code>); el número (el <b>parámetro</b>) es el enemigo al que golpeas.',
      '<b>Ahora te toca a ti.</b> Crea el programa (<code>main</code> + Ctrl+Espacio), escribe las dos líneas de la misión con <code>syso</code> + Ctrl+Espacio y, debajo, la orden <code>heroe.atacar(1);</code>. Pulsa <b>▶ Probar</b> para ver lo que imprime y <b>⚡ Cargar ataque</b> para comprobarlo: cada prueba superada carga un golpe y tu orden lo lanza contra el enemigo.'
    ],
    error: 'Recuerda: el programa necesita el esqueleto (<code>main</code> + Ctrl+Espacio) y, dentro, órdenes como <code>System.out.println("tu texto");</code> con comillas dobles y <code>;</code> al final.'
  },
  hints: ['La instrucción es <code>System.out.println("texto");</code>', 'La orden de ataque se escribe dentro de main, después de los println: <code>heroe.atacar(1);</code>', 'Necesitas dos instrucciones println: una por cada línea.', 'Cuidado con el <code>;</code> final y con las comillas dobles.'],
  tests: [{ name: 'Mensaje al goblin', lines: ['Hola sucio goblin', 'He venido a derrotarte'] }],
  solution: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hola sucio goblin");\n        System.out.println("He venido a derrotarte");\n        heroe.atacar(1);\n    }\n}`,
  xp: 20, gold: 10
});

/* ---- Mundo 1: programas completos, como en Eclipse. Pistas al principio; después, la lógica es tuya ---- */
const nc = c => c.code.replace(/\/\/.*$/gm, '');                       // código sin comentarios
const has = (re, msg) => c => re.test(nc(c)) ? true : msg;             // la prueba exige usar cierta construcción
const prog = body => `public class Main {\n    public static void main(String[] args) {\n${body.split('\n').map(l => l ? '        ' + l : l).join('\n')}\n    }\n}`;

L({
  id: '1-2', world: 1, title: 'La mochila del aventurero', kind: 'combat', foe: { name: 'Murciélago de cueva', emoji: '🦇', dmg: 6 }, requireMain: true,
  story: 'Un murciélago gigante te ataca. Entre aleteos descubres que tu mochila guarda cosas con etiqueta... ¡las variables!',
  lesson: `
<p>Una <b>variable</b> es una caja con <b>nombre</b>, <b>tipo</b> y <b>valor</b>. Se declara así: <code>tipo nombre = valor;</code></p>
<table class="t"><tr><td><code>int</code></td><td>enteros</td><td><code>int vida = 100;</code></td></tr>
<tr><td><code>double</code></td><td>decimales</td><td><code>double escudo = 2.5;</code></td></tr>
<tr><td><code>boolean</code></td><td>verdadero / falso</td><td><code>boolean vivo = true;</code></td></tr>
<tr><td><code>char</code></td><td>un carácter</td><td><code>char inicial = 'A';</code></td></tr>
<tr><td><code>String</code></td><td>texto</td><td><code>String nombre = "Aria";</code></td></tr></table>
<p>Para mezclar texto y variables se usa <code>+</code> (<b>concatenar</b>):</p>
<pre><code>System.out.println("Vida: " + vida);</code></pre>
<div class="note">📝 Los nombres de variables empiezan en minúscula y usan camelCase (<code>vidaMaxima</code>). No pueden llevar espacios ni empezar por número. Los <code>double</code> usan <b>punto</b> decimal: <code>2.5</code>.</div>`,
  task: 'Dentro del <code>main</code>, declara estas cuatro variables: <code>String nombre = "Aria"</code>, <code>int vida = 100</code>, <code>double escudo = 2.5</code> y <code>boolean vivo = true</code>. Después imprime, <b>usando las variables</b>, cuatro líneas: <code>Nombre: Aria</code>, <code>Vida: 100</code>, <code>Escudo: 2.5</code> y <code>Vivo: true</code>. <b>Ojo:</b> las etiquetas (<code>Nombre</code>, <code>Vida</code>...) se escriben <b>con mayúscula inicial</b>, exactamente como aquí, aunque la variable se llame <code>nombre</code> con minúscula: una cosa es el <b>nombre de la variable</b> y otra el <b>texto</b> que imprimes entre comillas.',
  mode: 'script',
  starter: `// 1) Escribe main + Ctrl+Espacio para crear el programa.\n// 2) Declara las cuatro variables (tipo nombre = valor;).\n// 3) Imprime cada una con su texto de la misión. Por ejemplo la primera: System.out.println("Nombre: " + nombre);\n`,
  hints: ['Las declaraciones: <code>String nombre = "Aria";</code> y <code>int vida = 100;</code>. Faltan <code>double escudo</code> y <code>boolean vivo</code>.', 'Para imprimir: <code>System.out.println("Nombre: " + nombre);</code> (el espacio tras los dos puntos va dentro de las comillas). Cada línea lleva <b>su propia etiqueta</b>: Nombre, Vida, Escudo y Vivo, tal como pide la misión.', 'Repite la misma estructura para vida, escudo y vivo. Los <code>boolean</code> se escriben <code>true</code>/<code>false</code> sin comillas.'],
  tests: [
    { name: 'Las cuatro líneas', lines: ['Nombre: Aria', 'Vida: 100', 'Escudo: 2.5', 'Vivo: true'] },
    { name: 'Declaras las 4 variables con su tipo', soft: true, check: c => /String\s+nombre\s*=\s*"Aria"/.test(nc(c)) && /int\s+vida\s*=\s*100/.test(nc(c)) && /double\s+escudo\s*=\s*2\.5/.test(nc(c)) && /boolean\s+vivo\s*=\s*true/.test(nc(c)) ? true : 'Declara String nombre, int vida, double escudo y boolean vivo con sus valores.' },
    { name: 'Imprimes usando las variables', soft: true, check: c => /\+\s*nombre/.test(nc(c)) && /\+\s*vida/.test(nc(c)) && /\+\s*escudo/.test(nc(c)) && /\+\s*vivo/.test(nc(c)) ? true : 'Concatena las variables con + en lugar de escribir los valores a mano.' }
  ],
  solution: prog(`String nombre = "Aria";\nint vida = 100;\ndouble escudo = 2.5;\nboolean vivo = true;\nSystem.out.println("Nombre: " + nombre);\nSystem.out.println("Vida: " + vida);\nSystem.out.println("Escudo: " + escudo);\nSystem.out.println("Vivo: " + vivo);`),
  xp: 25, gold: 10
});

L({
  id: '1-3', world: 1, title: 'El cofre de las cuentas', kind: 'treasure', foe: { name: 'Cofre mimo', emoji: '🧰', dmg: 6 }, requireMain: true,
  story: '¡El cofre tiene dientes! Es un mimo. Solo se abre si le haces las cuentas bien.',
  lesson: `
<p>Operadores <b>aritméticos</b>:</p>
<table class="t"><tr><td><code>+</code></td><td>suma</td></tr><tr><td><code>-</code></td><td>resta</td></tr><tr><td><code>*</code></td><td>multiplicación</td></tr><tr><td><code>/</code></td><td>división</td></tr><tr><td><code>%</code></td><td>resto (módulo)</td></tr></table>
<p>Con enteros, la división <b>descarta los decimales</b>: <code>17 / 5</code> da <code>3</code>, y <code>17 % 5</code> da <code>2</code> (lo que sobra). La multiplicación y la división se hacen antes que la suma y la resta; los paréntesis cambian el orden.</p>
<pre><code>int a = 17;
int b = 5;
System.out.println("Suma: " + (a + b));</code></pre>
<div class="note">📝 Dentro de un texto, la suma necesita paréntesis: <code>"Suma: " + a + b</code> escribiría 175 (concatena), mientras que <code>"Suma: " + (a + b)</code> escribe 22.</div>`,
  task: 'Declara <code>int a = 17</code> y <code>int b = 5</code>. Imprime cinco líneas: <code>Suma: 22</code>, <code>Resta: 12</code>, <code>Producto: 85</code>, <code>Cociente: 3</code> y <code>Resto: 2</code>, calculándolas con los operadores (no escribas los resultados a mano).',
  mode: 'script',
  starter: `// 1) Crea el programa (main + Ctrl+Espacio).\n// 2) Declara a y b.\n// 3) Imprime las 5 operaciones. Recuerda los paréntesis: "Suma: " + (a + b)\n`,
  hints: ['<code>int a = 17;</code> y <code>int b = 5;</code>, cada una en su línea.', '<code>System.out.println("Suma: " + (a + b));</code>', 'Para el resto usa <code>%</code>: <code>a % b</code>. La división entera es <code>a / b</code>.'],
  tests: [
    { name: 'Las cinco líneas', lines: ['Suma: 22', 'Resta: 12', 'Producto: 85', 'Cociente: 3', 'Resto: 2'] },
    { name: 'Usas los 5 operadores con a y b', soft: true, check: c => ['\\+', '-', '\\*', '/', '%'].every(o => new RegExp('a\\s*' + o + '\\s*b').test(nc(c))) ? true : 'Calcula cada resultado con a y b usando + - * / %.' }
  ],
  solution: prog(`int a = 17;\nint b = 5;\nSystem.out.println("Suma: " + (a + b));\nSystem.out.println("Resta: " + (a - b));\nSystem.out.println("Producto: " + (a * b));\nSystem.out.println("Cociente: " + (a / b));\nSystem.out.println("Resto: " + (a % b));`),
  xp: 30, gold: 12
});

L({
  id: '1-4', world: 1, title: 'El esqueleto avaro', kind: 'combat', foe: { name: 'Esqueleto avaro', emoji: '💀', dmg: 7 }, requireMain: true,
  story: 'Un esqueleto cuenta y recuenta sus monedas, cambiándolas una y otra vez. Para vencerlo tendrás que seguirle el ritmo.',
  lesson: `
<p>El operador <b>de asignación</b> <code>=</code> guarda un valor en una variable (¡no compara!). Los <b>compuestos</b> abrevian "operar y volver a guardar":</p>
<table class="t"><tr><td><code>oro += 50;</code></td><td>igual que <code>oro = oro + 50;</code></td></tr>
<tr><td><code>oro -= 30;</code></td><td><code>oro = oro - 30;</code></td></tr>
<tr><td><code>oro *= 2;</code></td><td><code>oro = oro * 2;</code></td></tr>
<tr><td><code>oro /= 4;</code></td><td><code>oro = oro / 4;</code></td></tr>
<tr><td><code>oro %= 7;</code></td><td><code>oro = oro % 7;</code></td></tr></table>
<div class="note">📝 Primero se calcula el lado derecho y luego se guarda en la variable de la izquierda. En enteros, <code>/=</code> también descarta decimales.</div>`,
  task: 'Declara <code>int oro = 100</code>. Aplica estas operaciones <b>en este orden, con operadores compuestos</b>, e imprime <code>Oro: ...</code> después de cada una: <code>+= 50</code> → 150, <code>-= 30</code> → 120, <code>*= 2</code> → 240, <code>/= 4</code> → 60, <code>%= 7</code> → 4.',
  mode: 'script',
  starter: `// Declara oro = 100 y aplica cada operación compuesta.\n// Después de cada una, imprime "Oro: " + oro\n`,
  hints: ['<code>int oro = 100;</code> y después <code>oro += 50;</code> seguido de su <code>println</code>.', 'Cada paso parte del resultado anterior: 150 → 120 → 240 → 60 → 4.', 'Los operadores: <code>+=</code>, <code>-=</code>, <code>*=</code>, <code>/=</code> y <code>%=</code>.'],
  tests: [
    { name: 'Cinco líneas de oro', lines: ['Oro: 150', 'Oro: 120', 'Oro: 240', 'Oro: 60', 'Oro: 4'] },
    { name: 'Usas los 5 operadores compuestos', soft: true, check: c => ['\\+=', '-=', '\\*=', '/=', '%='].every(o => new RegExp(o).test(nc(c))) ? true : 'Usa += -= *= /= y %= (uno de cada).' }
  ],
  solution: prog(`int oro = 100;\noro += 50;\nSystem.out.println("Oro: " + oro);\noro -= 30;\nSystem.out.println("Oro: " + oro);\noro *= 2;\nSystem.out.println("Oro: " + oro);\noro /= 4;\nSystem.out.println("Oro: " + oro);\noro %= 7;\nSystem.out.println("Oro: " + oro);`),
  xp: 30, gold: 12
});

L({
  id: '1-5', world: 1, title: 'El lobo que cuenta', kind: 'combat', foe: { name: 'Lobo de las criptas', emoji: '🐺', dmg: 7 }, requireMain: true,
  story: 'Un lobo aúlla una y otra vez, sumando uno a uno... y restando también. Nunca sabes cuándo cambia su cuenta.',
  lesson: `
<p>Los operadores de <b>incremento</b> (<code>++</code>) y <b>decremento</b> (<code>--</code>) suman o restan 1 a una variable. Según dónde se pongan, cambia <b>cuándo</b> se aplica:</p>
<table class="t"><tr><td><code>x++</code></td><td><b>postincremento</b>: primero usa el valor, luego suma 1</td></tr>
<tr><td><code>++x</code></td><td><b>preincremento</b>: primero suma 1, luego usa el valor</td></tr></table>
<pre><code>int x = 5;
System.out.println(x++);   // escribe 5 (y x pasa a valer 6)
System.out.println(++x);   // x pasa a 7 y escribe 7</code></pre>
<p>Con <code>--</code> funciona igual pero restando.</p>`,
  task: 'Declara <code>int x = 5</code> y escribe, <b>una instrucción por línea</b> y en este orden: <code>println(x++)</code>, <code>println(x)</code>, <code>println(++x)</code>, <code>println(x--)</code>, <code>println(x)</code>, <code>println(--x)</code>. Salida esperada: 5, 6, 7, 7, 6, 5. Piensa por qué sale cada número.',
  mode: 'script',
  starter: `// int x = 5;\n// Imprime x++, x, ++x, x--, x, --x (cada uno con su println)\n`,
  hints: ['<code>System.out.println(x++);</code> escribe el valor actual (5) y <i>después</i> lo sube a 6.', 'Con <code>++x</code> ocurre al revés: primero sube y luego escribe.', 'Las seis instrucciones son: <code>x++</code>, <code>x</code>, <code>++x</code>, <code>x--</code>, <code>x</code>, <code>--x</code>, cada una dentro de su <code>println( )</code>.'],
  tests: [
    { name: 'Salida 5 6 7 7 6 5', lines: ['5', '6', '7', '7', '6', '5'] },
    { name: 'Usas x++, ++x, x-- y --x', soft: true, check: c => /x\+\+/.test(nc(c)) && /\+\+x/.test(nc(c)) && /x--/.test(nc(c)) && /--x/.test(nc(c)) ? true : 'Debes usar las cuatro formas: x++, ++x, x-- y --x.' }
  ],
  solution: prog(`int x = 5;\nSystem.out.println(x++);\nSystem.out.println(x);\nSystem.out.println(++x);\nSystem.out.println(x--);\nSystem.out.println(x);\nSystem.out.println(--x);`),
  xp: 35, gold: 12
});

L({
  id: '1-6', world: 1, title: 'La balanza de la verdad', kind: 'puzzle', foe: { name: 'Zombi indeciso', emoji: '🧟', dmg: 7 }, requireMain: true,
  story: 'Una balanza antigua pesa dos cantidades y responde solo «verdadero» o «falso». Aprende a preguntarle.',
  lesson: `
<p>Los operadores de <b>comparación</b> dan un resultado <code>boolean</code> (<code>true</code> o <code>false</code>):</p>
<table class="t"><tr><td><code>==</code></td><td>igual</td><td><code>!=</code></td><td>distinto</td></tr>
<tr><td><code>&lt;</code></td><td>menor</td><td><code>&gt;</code></td><td>mayor</td></tr>
<tr><td><code>&lt;=</code></td><td>menor o igual</td><td><code>&gt;=</code></td><td>mayor o igual</td></tr></table>
<pre><code>int vida = 60;
System.out.println("vida > 50: " + (vida > 50));   // true</code></pre>
<div class="note">📝 <code>=</code> asigna y <code>==</code> compara: confundirlos es el error más típico. Y en un texto, la comparación necesita paréntesis.</div>`,
  task: 'Declara <code>int vida = 60</code> y <code>int danio = 75</code>. Imprime estas seis líneas con las comparaciones: <code>vida &gt; danio: false</code>, <code>vida &lt; danio: true</code>, <code>vida == danio: false</code>, <code>vida != danio: true</code>, <code>vida &gt;= 60: true</code>, <code>danio &lt;= 70: false</code>.',
  mode: 'script',
  starter: `// Declara vida y danio.\n// Imprime cada comparación: System.out.println("vida > danio: " + (vida > danio));\n`,
  hints: ['<code>System.out.println("vida > danio: " + (vida > danio));</code>', 'Cambia el operador y las variables para cada línea. Los paréntesis alrededor de la comparación son obligatorios.', 'Los seis operadores que necesitas son <code>&gt; &lt; == != &gt;= &lt;=</code>.'],
  tests: [
    { name: 'Las seis comparaciones', lines: ['vida > danio: false', 'vida < danio: true', 'vida == danio: false', 'vida != danio: true', 'vida >= 60: true', 'danio <= 70: false'] },
    { name: 'Usas los seis operadores', soft: true, check: c => ['==', '!=', '>=', '<=', '(?<![>=!<])>(?!=)', '(?<![>=!<])<(?!=)'].every(o => new RegExp(o).test(nc(c).replace(/"[^"]*"/g, '""'))) ? true : 'Usa los seis operadores de comparación (no solo texto entre comillas).' }
  ],
  solution: prog(`int vida = 60;\nint danio = 75;\nSystem.out.println("vida > danio: " + (vida > danio));\nSystem.out.println("vida < danio: " + (vida < danio));\nSystem.out.println("vida == danio: " + (vida == danio));\nSystem.out.println("vida != danio: " + (vida != danio));\nSystem.out.println("vida >= 60: " + (vida >= 60));\nSystem.out.println("danio <= 70: " + (danio <= 70));`),
  xp: 35, gold: 12
});

L({
  id: '1-7', world: 1, title: 'La puerta de las tres cerraduras', kind: 'trap', foe: { name: 'Ladrón de dos caras', emoji: '🗝️', dmg: 8 }, requireMain: true,
  story: 'Una puerta se abre solo si se cumplen ciertas condiciones a la vez... o alguna de ellas. Combina las verdades.',
  lesson: `
<p>Los operadores <b>lógicos</b> combinan valores <code>boolean</code>:</p>
<table class="t"><tr><td><code>&amp;&amp;</code></td><td>Y: verdadero solo si <b>ambos</b> lo son</td></tr>
<tr><td><code>||</code></td><td>O: verdadero si <b>al menos uno</b> lo es</td></tr>
<tr><td><code>!</code></td><td>NO: invierte el valor</td></tr></table>
<pre><code>boolean a = true, b = false;
a &amp;&amp; b     // false
a || b     // true
!a         // false</code></pre>
<p>Se pueden mezclar con paréntesis: <code>a &amp;&amp; (b || !c)</code>. El <code>&amp;&amp;</code> se evalúa antes que el <code>||</code>.</p>`,
  task: 'Declara <code>boolean tieneLlave = true</code>, <code>boolean tieneAntorcha = false</code> y <code>boolean esDeNoche = false</code>. Imprime cuatro líneas: <code>Llave y antorcha: false</code> (<code>&amp;&amp;</code>), <code>Llave o antorcha: true</code> (<code>||</code>), <code>No es de noche: true</code> (<code>!</code>) y <code>Puede entrar: true</code>, que debe calcular <code>tieneLlave &amp;&amp; (tieneAntorcha || !esDeNoche)</code>.',
  mode: 'script',
  starter: `// Aquí ya tienes que ir con tu propia lógica.\n`,
  hints: ['<code>System.out.println("Llave y antorcha: " + (tieneLlave && tieneAntorcha));</code>', 'Para negar: <code>(!esDeNoche)</code>. Para combinar: <code>(tieneLlave &amp;&amp; (tieneAntorcha || !esDeNoche))</code>.', 'Declara las tres variables con <code>boolean nombre = valor;</code> antes de imprimir.'],
  tests: [
    { name: 'Las cuatro líneas', lines: ['Llave y antorcha: false', 'Llave o antorcha: true', 'No es de noche: true', 'Puede entrar: true'] },
    { name: 'Usas &&, || y !', soft: true, check: c => /&&/.test(nc(c).replace(/"[^"]*"/g, '')) && /\|\|/.test(nc(c).replace(/"[^"]*"/g, '')) && /![a-zA-Z(]/.test(nc(c).replace(/"[^"]*"/g, '')) ? true : 'Usa los tres operadores lógicos: &&, || y !.' }
  ],
  solution: prog(`boolean tieneLlave = true;\nboolean tieneAntorcha = false;\nboolean esDeNoche = false;\nSystem.out.println("Llave y antorcha: " + (tieneLlave && tieneAntorcha));\nSystem.out.println("Llave o antorcha: " + (tieneLlave || tieneAntorcha));\nSystem.out.println("No es de noche: " + (!esDeNoche));\nSystem.out.println("Puede entrar: " + (tieneLlave && (tieneAntorcha || !esDeNoche)));`),
  xp: 40, gold: 14
});

L({
  id: '1-8', world: 1, title: 'El espejo de las dos caras', kind: 'puzzle', foe: { name: 'Naga bifronte', emoji: '🐍', dmg: 8 }, requireMain: true,
  story: 'Un espejo muestra una imagen u otra según una condición. Aprende a elegir en una sola línea.',
  lesson: `
<p>El operador <b>condicional (ternario)</b> elige entre dos valores según una condición:</p>
<pre><code>condición ? valorSiVerdadero : valorSiFalso</code></pre>
<pre><code>int edad = 20;
String tipo = edad &gt;= 18 ? "adulto" : "menor";
int mayor = a &gt; b ? a : b;</code></pre>
<p>Es una forma corta de un <code>if / else</code> que <b>devuelve un valor</b>. Úsalo para decisiones sencillas.</p>`,
  task: 'Con el operador ternario: (1) <code>int edad = 17</code> → imprime <code>Eres menor de edad</code> o <code>Eres mayor de edad</code> según <code>edad &gt;= 18</code>; (2) <code>int a = 8</code> y <code>int b = 12</code> → imprime <code>Mayor: 12</code> (el mayor de los dos); (3) <code>int nota = 6</code> → imprime <code>Nota: Aprobado</code> si es &gt;= 5, o <code>Nota: Suspenso</code>.',
  mode: 'script',
  starter: `// Usa el operador ternario (condición ? siSi : siNo) en cada caso.\n`,
  hints: ['<code>String texto = edad >= 18 ? "Eres mayor de edad" : "Eres menor de edad";</code>', 'El mayor de dos números: <code>int mayor = a > b ? a : b;</code>', 'Puedes guardar el resultado en una variable y luego imprimirla, o ponerlo directamente entre paréntesis dentro del println.'],
  tests: [
    { name: 'Las tres líneas', lines: ['Eres menor de edad', 'Mayor: 12', 'Nota: Aprobado'] },
    { name: 'Usas el operador ternario (?:)', soft: true, check: c => (nc(c).replace(/"[^"]*"/g, '').match(/\?/g) || []).length >= 3 ? true : 'Resuelve los tres casos con el operador ternario ? :' }
  ],
  solution: prog(`int edad = 17;\nSystem.out.println(edad >= 18 ? "Eres mayor de edad" : "Eres menor de edad");\nint a = 8;\nint b = 12;\nint mayor = a > b ? a : b;\nSystem.out.println("Mayor: " + mayor);\nint nota = 6;\nString res = nota >= 5 ? "Aprobado" : "Suspenso";\nSystem.out.println("Nota: " + res);`),
  xp: 40, gold: 14
});

L({
  id: '1-9', world: 1, title: 'La araña transformista', kind: 'combat', foe: { name: 'Araña transformista', emoji: '🕷️', dmg: 8 }, requireMain: true,
  story: 'La araña cambia de forma: de decimal a entero, de número a letra. Para vencerla debes saber convertir tipos.',
  lesson: `
<p>El <b>casting</b> (conversión explícita) cambia un valor de un tipo a otro: <code>(tipo) valor</code>.</p>
<pre><code>double precio = 19.99;
int euros = (int) precio;        // 19  (se descarta la parte decimal, no se redondea)
int a = 7, b = 2;
double c = (double) a / b;       // 3.5 (si no, 7 / 2 daría 3)
int codigo = (int) 'A';          // 65  (código del carácter)
char letra = (char) 98;          // 'b'</code></pre>
<ul><li>De <b>menor a mayor</b> tamaño (<code>int → double</code>) la conversión es automática.</li>
<li>De <b>mayor a menor</b> (<code>double → int</code>) hay que hacer el cast, porque se pierde información.</li></ul>
<div class="note">📝 El cast se aplica antes que la división: <code>(double) a / b</code> convierte solo <code>a</code> y entonces divide como decimales.</div>`,
  task: 'Con casting: (1) <code>double precio = 19.99</code> → imprime <code>Euros: 19</code> convirtiéndolo a <code>int</code>; (2) <code>int a = 7</code>, <code>int b = 2</code> → imprime <code>Cociente: 3.5</code> usando <code>(double)</code>; (3) imprime <code>Código de A: 65</code> con <code>(int) \'A\'</code>; (4) imprime <code>Letra: b</code> con <code>(char) 98</code>.',
  mode: 'script',
  starter: `// Cuatro conversiones: (int), (double), (int) de un char y (char) de un número.\n`,
  hints: ['<code>int euros = (int) precio;</code> y después <code>System.out.println("Euros: " + euros);</code>', 'Para el cociente: <code>double cociente = (double) a / b;</code>', 'Un char entre comillas simples: <code>(int) \'A\'</code>. Y <code>char letra = (char) 98;</code>'],
  tests: [
    { name: 'Las cuatro líneas', lines: ['Euros: 19', 'Cociente: 3.5', 'Código de A: 65', 'Letra: b'] },
    { name: 'Usas (int), (double) y (char)', soft: true, check: c => /\(\s*int\s*\)/.test(nc(c)) && /\(\s*double\s*\)/.test(nc(c)) && /\(\s*char\s*\)/.test(nc(c)) ? true : 'Usa los tres casts: (int), (double) y (char).' }
  ],
  solution: prog(`double precio = 19.99;\nint euros = (int) precio;\nSystem.out.println("Euros: " + euros);\nint a = 7;\nint b = 2;\ndouble cociente = (double) a / b;\nSystem.out.println("Cociente: " + cociente);\nSystem.out.println("Código de A: " + (int) 'A');\nchar letra = (char) 98;\nSystem.out.println("Letra: " + letra);`),
  xp: 40, gold: 14
});

L({
  id: '1-10', world: 1, title: 'El pergamino de las letras', kind: 'puzzle', foe: { name: 'Hechicero de las letras', emoji: '🧙', dmg: 8 }, requireMain: true,
  story: 'Un pergamino encantado solo responde a quien sabe manejar el texto: medirlo, trocearlo y compararlo.',
  lesson: `
<p><code>String</code> es una <b>clase</b>: cada texto es un <b>objeto</b> con <b>métodos</b> que se llaman con un punto. Los más usados:</p>
<table class="t"><tr><td><code>s.length()</code></td><td>número de caracteres</td></tr>
<tr><td><code>s.charAt(i)</code></td><td>carácter en la posición <code>i</code> (empieza en 0)</td></tr>
<tr><td><code>s.toUpperCase()</code> / <code>toLowerCase()</code></td><td>mayúsculas / minúsculas</td></tr>
<tr><td><code>s.substring(a, b)</code></td><td>trozo desde <code>a</code> hasta <code>b</code> (sin incluir b)</td></tr>
<tr><td><code>s.indexOf("x")</code></td><td>posición donde aparece (o -1)</td></tr>
<tr><td><code>s.equals(t)</code> / <code>equalsIgnoreCase(t)</code></td><td>comparar contenido</td></tr></table>
<div class="note">📝 Los textos se comparan con <code>equals</code>, <b>nunca con <code>==</code></b> (compararía si son el mismo objeto, no si dicen lo mismo). Ojo: <code>length()</code> lleva paréntesis en los String, pero <code>length</code> sin paréntesis es de los arrays.</div>`,
  task: 'Con <code>String frase = "Mazmorra de Java"</code> imprime siete líneas: <code>Longitud: 16</code>, <code>Primera letra: M</code>, <code>Mayúsculas: MAZMORRA DE JAVA</code>, <code>Primera palabra: Mazmorra</code> (con <code>substring</code>), <code>Posición de Java: 12</code> (con <code>indexOf</code>), <code>Iguales: false</code> (frase <code>equals</code> "mazmorra de java") e <code>Iguales sin mayúsculas: true</code>.',
  mode: 'script',
  starter: `// String frase = "Mazmorra de Java";\n// Usa length, charAt, toUpperCase, substring, indexOf, equals y equalsIgnoreCase.\n`,
  hints: ['<code>frase.length()</code> da la longitud; <code>frase.charAt(0)</code> da la primera letra.', '<code>frase.substring(0, 8)</code> da "Mazmorra" y <code>frase.indexOf("Java")</code> da la posición.', '<code>frase.equals("mazmorra de java")</code> distingue mayúsculas; <code>frase.equalsIgnoreCase(...)</code> no.'],
  tests: [
    { name: 'Las siete líneas', lines: ['Longitud: 16', 'Primera letra: M', 'Mayúsculas: MAZMORRA DE JAVA', 'Primera palabra: Mazmorra', 'Posición de Java: 12', 'Iguales: false', 'Iguales sin mayúsculas: true'] },
    { name: 'Usas los 7 métodos de String', soft: true, check: c => ['length\\(\\)', 'charAt\\(', 'toUpperCase\\(\\)', 'substring\\(', 'indexOf\\(', '\\.equals\\(', 'equalsIgnoreCase\\('].every(m => new RegExp(m).test(nc(c))) ? true : 'Usa los siete métodos: length, charAt, toUpperCase, substring, indexOf, equals y equalsIgnoreCase.' }
  ],
  solution: prog(`String frase = "Mazmorra de Java";\nSystem.out.println("Longitud: " + frase.length());\nSystem.out.println("Primera letra: " + frase.charAt(0));\nSystem.out.println("Mayúsculas: " + frase.toUpperCase());\nSystem.out.println("Primera palabra: " + frase.substring(0, 8));\nSystem.out.println("Posición de Java: " + frase.indexOf("Java"));\nSystem.out.println("Iguales: " + frase.equals("mazmorra de java"));\nSystem.out.println("Iguales sin mayúsculas: " + frase.equalsIgnoreCase("mazmorra de java"));`),
  xp: 45, gold: 16
});

L({
  id: '1-11', world: 1, title: 'El escriba de huesos', kind: 'treasure', foe: { name: 'Esqueleto escribano', emoji: '💀', dmg: 9 }, requireMain: true,
  story: 'Un escriba esquelético solo te dejará pasar si le preguntas el nombre y la edad y respondes educadamente. ¡Hora de leer del teclado!',
  lesson: `
<p>La clase <b><code>Scanner</code></b> lee lo que el usuario escribe por teclado. Se importa, se crea y se usa:</p>
<pre><code>import java.util.Scanner;          // arriba del todo

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String nombre = sc.nextLine();   // una línea de texto
        int edad = sc.nextInt();         // un número entero
    }
}</code></pre>
<ul><li><code>nextLine()</code> lee una línea entera; <code>nextInt()</code> un entero; <code>nextDouble()</code> un decimal; <code>next()</code> una palabra.</li>
<li>⌨️ En Eclipse, si falta el <code>import</code>, pulsa <b>Ctrl + Shift + O</b> y se añade solo.</li></ul>
<div class="note">📝 Para probar tu programa escribe la entrada en la caja «⌨️ Entrada de teclado» (una lectura por línea) y pulsa ▶ Probar. Al atacar, el juego usa varias entradas distintas.</div>`,
  task: 'Escribe un programa que <b>lea con Scanner</b> un nombre (<code>nextLine</code>) y una edad (<code>nextInt</code>) y escriba: <code>Hola, NOMBRE. El año que viene tendrás EDAD+1 años.</code> Por ejemplo con <code>Aria</code> y <code>20</code>: <code>Hola, Aria. El año que viene tendrás 21 años.</code>',
  mode: 'script',
  starter: `// 1) import java.util.Scanner;  (arriba del todo)\n// 2) main + Ctrl+Espacio\n// 3) Scanner sc = new Scanner(System.in);\n// 4) Lee el nombre y la edad, y escribe la frase.\n`,
  hints: ['<code>Scanner sc = new Scanner(System.in);</code> y después <code>String nombre = sc.nextLine();</code>', '<code>int edad = sc.nextInt();</code> y la frase: <code>"Hola, " + nombre + ". El año que viene tendrás " + (edad + 1) + " años."</code>', 'No olvides la línea <code>import java.util.Scanner;</code> antes de <code>public class Main</code>.'],
  tests: [
    { name: 'Entrada: Aria, 20', stdin: 'Aria\n20\n', expect: 'Hola, Aria. El año que viene tendrás 21 años.' },
    { name: 'Entrada: Borin, 35', stdin: 'Borin\n35\n', expect: 'Hola, Borin. El año que viene tendrás 36 años.' },
    { name: 'Con import y new Scanner(System.in)', stdin: 'X\n1\n', check: c => /import\s+java\.util\.(Scanner|\*)\s*;/.test(nc(c)) && /new\s+Scanner\s*\(\s*System\.in\s*\)/.test(nc(c)) ? true : 'Necesitas «import java.util.Scanner;» y «new Scanner(System.in)».' }
  ],
  solution: `import java.util.Scanner;\n\n` + prog(`Scanner sc = new Scanner(System.in);\nString nombre = sc.nextLine();\nint edad = sc.nextInt();\nSystem.out.println("Hola, " + nombre + ". El año que viene tendrás " + (edad + 1) + " años.");`),
  xp: 50, gold: 18
});

L({
  id: '1-b', world: 1, title: 'Guardián de los Fundamentos', kind: 'boss', foe: { name: 'Guardián de los Fundamentos', emoji: '🗿', dmg: 10 }, requireMain: true,
  story: 'Un gólem de piedra bloquea la salida. «Demuestra que dominas variables, operadores, casting, String y Scanner... o serás polvo».',
  lesson: `
<p>¡Examen final del mundo! Todo lo aprendido junto:</p>
<ul><li>Lectura con <code>Scanner</code> (<code>nextInt()</code>).</li><li>Aritmética y resto: <code>+ - * / %</code>.</li><li>Casting para decimales: <code>(double) a / b</code>.</li><li>Ternario para elegir: <code>a &gt; b ? a : b</code>.</li><li>Comparaciones que dan <code>boolean</code>: <code>a % 2 == 0</code>.</li></ul>`,
  task: 'Lee <b>dos enteros</b> <code>a</code> y <code>b</code> con Scanner (cada uno en su línea) e imprime cuatro líneas: <code>Suma: ...</code>, <code>Media: ...</code> (con decimales, usando <code>(double)</code>), <code>Mayor: ...</code> (con el operador ternario) y <code>a es par: ...</code> (<code>true</code>/<code>false</code>, usando <code>%</code>). Ejemplo con 7 y 2: <code>Suma: 9</code>, <code>Media: 4.5</code>, <code>Mayor: 7</code>, <code>a es par: false</code>.',
  mode: 'script',
  starter: `// Tú solo: import, main, Scanner, cuatro operaciones y cuatro println.\n`,
  hints: ['Lee con <code>int a = sc.nextInt();</code> y <code>int b = sc.nextInt();</code>.', 'Media: <code>(a + b) / 2.0</code> o <code>(double) (a + b) / 2</code>. Mayor: <code>a > b ? a : b</code>.', 'Par: <code>a % 2 == 0</code> da un boolean que puedes concatenar entre paréntesis.'],
  tests: [
    { name: 'a = 7, b = 2', stdin: '7\n2\n', lines: ['Suma: 9', 'Media: 4.5', 'Mayor: 7', 'a es par: false'] },
    { name: 'a = 10, b = 4', stdin: '10\n4\n', lines: ['Suma: 14', 'Media: 7.0', 'Mayor: 10', 'a es par: true'] },
    { name: 'a = 3, b = 8', stdin: '3\n8\n', lines: ['Suma: 11', 'Media: 5.5', 'Mayor: 8', 'a es par: false'] },
    { name: 'Usas Scanner, casting o decimal, ternario y %', stdin: '1\n2\n', soft: true, check: c => /new\s+Scanner/.test(nc(c)) && /\?/.test(nc(c).replace(/"[^"]*"/g, '')) && /%/.test(nc(c)) && (/\(\s*double\s*\)/.test(nc(c)) || /2\.0/.test(nc(c))) ? true : 'Usa Scanner, el ternario ?:, el resto % y un cálculo con decimales.' }
  ],
  solution: `import java.util.Scanner;\n\n` + prog(`Scanner sc = new Scanner(System.in);\nint a = sc.nextInt();\nint b = sc.nextInt();\ndouble media = (double) (a + b) / 2;\nint mayor = a > b ? a : b;\nSystem.out.println("Suma: " + (a + b));\nSystem.out.println("Media: " + media);\nSystem.out.println("Mayor: " + mayor);\nSystem.out.println("a es par: " + (a % 2 == 0));`),
  xp: 90, gold: 45
});
})(typeof window !== 'undefined' ? window : globalThis);
