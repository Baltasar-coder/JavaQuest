/* MUNDO 5 · La Fortaleza de las Clases — programación orientada a objetos */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };
const L = o => { W.levels[o.id] = o; return o; };

W.worlds.push({
  id: 5, name: 'La Fortaleza', emoji: '🏰', theme: 'fortress',
  blurb: 'Clases, objetos, encapsulación, herencia, polimorfismo, clases abstractas e interfaces.',
  intro: 'Una fortaleza inmensa se levanta sobre la colina. Dicen que cada habitación está construida con <b>clases</b>: moldes para crear guerreros, armas y criaturas. Aquí empieza la programación orientada a objetos.',
  nodes: ['5-1', '5-2', '5-3', '5-4', ['5-5a', '5-5b'], '5-b']
});

L({
  id: '5-1', world: 5, title: 'La forja de objetos', kind: 'puzzle', foe: { name: 'Yunque rebelde', emoji: '⚒️', dmg: 12 },
  story: 'El herrero de la fortaleza ha perdido su libro de planos. Necesitas escribir el «molde» de las armas para que la forja vuelva a funcionar.',
  lesson: `
<p>Una <b>clase</b> es un <b>molde</b>; un <b>objeto</b> es una pieza creada con ese molde. La clase define:</p>
<ul><li><b>Atributos</b> (los datos): <code>String nombre;</code></li>
<li><b>Constructor</b> (cómo se crea): mismo nombre que la clase, sin tipo de retorno.</li>
<li><b>Métodos</b> (lo que sabe hacer), esta vez <b>sin</b> <code>static</code>.</li></ul>
<pre><code>class Arma {
    String nombre;
    int danio;

    Arma(String nombre, int danio) {
        this.nombre = nombre;   // this = «este objeto»
        this.danio = danio;
    }

    String describir() {
        return nombre + " (daño " + danio + ")";
    }
}

Arma espada = new Arma("Espada", 12);   // crear un objeto
System.out.println(espada.describir());</code></pre>
<p><code>this.nombre</code> es el atributo del objeto; <code>nombre</code> a secas (el parámetro) es el valor que llega. Cada objeto tiene <b>sus propios</b> datos.</p>`,
  task: 'Crea la clase <code>Arma</code> con los atributos <code>String nombre</code> e <code>int danio</code> (sin <code>private</code> por ahora), un constructor <code>Arma(String nombre, int danio)</code> y un método <code>String describir()</code> que devuelva, por ejemplo, <code>Espada (daño 12)</code>.',
  mode: 'class',
  starter: `class Arma {\n    // atributos\n\n    // constructor\n\n    // método describir\n\n}\n`,
  free: 'Arma a = new Arma("Espada", 12);\nSystem.out.println(a.describir());',
  hints: ['Atributos: <code>String nombre;</code> e <code>int danio;</code>', 'Constructor: <code>Arma(String nombre, int danio) { this.nombre = nombre; this.danio = danio; }</code>', 'describir: <code>return nombre + " (daño " + danio + ")";</code>'],
  tests: [
    { name: 'Crear y describir una espada', snippet: 'Arma a = new Arma("Espada", 12);\nSystem.out.println(a.describir());', expect: 'Espada (daño 12)' },
    { name: 'Dos objetos independientes', snippet: 'Arma a = new Arma("Daga", 5);\nArma b = new Arma("Hacha", 20);\nSystem.out.println(a.describir() + " | " + b.describir());', expect: 'Daga (daño 5) | Hacha (daño 20)' },
    { name: 'Atributos accesibles', snippet: 'Arma a = new Arma("Arco", 7);\nSystem.out.println(a.nombre + " " + a.danio);', expect: 'Arco 7' }
  ],
  solution: `class Arma {\n    String nombre;\n    int danio;\n\n    Arma(String nombre, int danio) {\n        this.nombre = nombre;\n        this.danio = danio;\n    }\n\n    String describir() {\n        return nombre + " (daño " + danio + ")";\n    }\n}\n`,
  xp: 90, gold: 28
});

L({
  id: '5-2', world: 5, title: 'El héroe herido', kind: 'combat', foe: { name: 'Gárgola vigía', emoji: '🦇', dmg: 12 },
  story: 'Tu héroe se deja la vida en cada batalla... literalmente: nada impide que su vida baje de cero o suba de 100. Hay que <b>protegerla</b>.',
  lesson: `
<p>La <b>encapsulación</b> protege los datos de un objeto: los atributos se declaran <code>private</code> y solo se tocan a través de métodos que <b>controlan</b> lo que se puede hacer.</p>
<pre><code>class Cuenta {
    private int saldo;                  // nadie fuera puede tocarlo

    Cuenta(int saldo) { this.saldo = saldo; }

    int getSaldo() { return saldo; }    // getter: leer

    void retirar(int c) {               // método que protege la regla
        if (c &lt;= saldo) saldo -= c;
    }
}</code></pre>
<ul><li>Fuera de la clase, <code>cuenta.saldo</code> es un <b>error de compilación</b> («has private access»).</li>
<li>Un <b>getter</b> (<code>getX</code>) devuelve el valor; un <b>setter</b> (<code>setX</code>) lo cambia, pudiendo validarlo.</li></ul>
<div class="note">📝 <b>Para el examen:</b> los 4 pilares de la POO son encapsulación, herencia, polimorfismo y abstracción.</div>`,
  task: 'Crea la clase <code>Heroe</code> con <code>private int vida</code>, constructor <code>Heroe(int vida)</code>, <code>int getVida()</code>, <code>void recibirDanio(int d)</code> (la vida <b>nunca baja de 0</b>) y <code>void curar(int c)</code> (la vida <b>nunca pasa de 100</b>).',
  mode: 'class',
  starter: `class Heroe {\n    // atributo privado\n\n    // constructor\n\n    // getVida, recibirDanio, curar\n\n}\n`,
  free: 'Heroe h = new Heroe(50);\nh.recibirDanio(80);\nSystem.out.println(h.getVida());',
  hints: ['<code>private int vida;</code> y en el constructor <code>this.vida = vida;</code>', 'recibirDanio: <code>vida = vida - d; if (vida &lt; 0) vida = 0;</code>', 'curar: <code>vida = vida + c; if (vida &gt; 100) vida = 100;</code> (también vale <code>Math.min</code>/<code>Math.max</code>).'],
  tests: [
    { name: 'recibir daño normal', snippet: 'Heroe h = new Heroe(50);\nh.recibirDanio(20);\nSystem.out.println(h.getVida());', expect: '30' },
    { name: 'la vida no baja de 0', snippet: 'Heroe h = new Heroe(50);\nh.recibirDanio(80);\nSystem.out.println(h.getVida());', expect: '0' },
    { name: 'la vida no pasa de 100', snippet: 'Heroe h = new Heroe(50);\nh.curar(80);\nSystem.out.println(h.getVida());', expect: '100' },
    { name: 'curar y recibir daño', snippet: 'Heroe h = new Heroe(10);\nh.curar(5);\nh.recibirDanio(3);\nSystem.out.println(h.getVida());', expect: '12' },
    { name: 'El atributo vida es private', snippet: 'int x = 0;', check: c => /private\s+int\s+vida\b/.test(c.code) ? true : 'El atributo vida debe declararse como private int vida;' }
  ],
  solution: `class Heroe {\n    private int vida;\n\n    Heroe(int vida) {\n        this.vida = vida;\n    }\n\n    int getVida() {\n        return vida;\n    }\n\n    void recibirDanio(int d) {\n        vida = vida - d;\n        if (vida < 0) {\n            vida = 0;\n        }\n    }\n\n    void curar(int c) {\n        vida = vida + c;\n        if (vida > 100) {\n            vida = 100;\n        }\n    }\n}\n`,
  xp: 100, gold: 30
});

const PERSONAJE = `class Personaje {
    protected String nombre;
    protected int vida;

    Personaje(String nombre, int vida) {
        this.nombre = nombre;
        this.vida = vida;
    }

    String presentarse() {
        return "Soy " + nombre;
    }

    int atacar() {
        return 5;
    }
}
`;
L({
  id: '5-3', world: 5, title: 'La estirpe de guerreros', kind: 'combat', foe: { name: 'Caballero sin linaje', emoji: '🗡️', dmg: 13 },
  story: 'El árbol genealógico de la fortaleza está en blanco. Los guerreros heredan todo de los <b>Personajes</b>... pero añaden lo suyo.',
  lesson: `
<p>La <b>herencia</b> permite crear una clase a partir de otra con <code>extends</code>. La subclase hereda atributos y métodos del padre y puede añadir o <b>redefinir</b> los suyos.</p>
<pre><code>class Guerrero extends Personaje {

    Guerrero(String nombre) {
        super(nombre, 120);          // llama al constructor del padre
    }

    @Override
    String presentarse() {           // redefine (override) el método del padre
        return super.presentarse() + ", guerrero";   // super.m() usa la versión del padre
    }
}</code></pre>
<ul><li><code>super(...)</code> debe ser la <b>primera</b> instrucción del constructor.</li>
<li><code>protected</code>: visible para la propia clase, sus subclases y el mismo paquete.</li>
<li>Un <code>Guerrero</code> <b>es un</b> <code>Personaje</code>: puedes guardarlo en una variable <code>Personaje</code>.</li></ul>`,
  task: 'Ya existe la clase <code>Personaje</code> (arriba). Escribe <code>Guerrero extends Personaje</code>: constructor <code>Guerrero(String nombre)</code> con vida <b>120</b> (usa <code>super</code>); redefine <code>presentarse()</code> para que devuelva lo del padre + <code>, guerrero con 120 de vida</code> (usando el atributo <code>vida</code>); y redefine <code>atacar()</code> para que devuelva <b>20</b>.',
  mode: 'class',
  starter: PERSONAJE + `\n// Escribe aquí la clase Guerrero\n`,
  free: 'Guerrero g = new Guerrero("Thor");\nSystem.out.println(g.presentarse());',
  hints: ['<code>class Guerrero extends Personaje {</code>', 'Constructor: <code>Guerrero(String nombre) { super(nombre, 120); }</code>', '<code>return super.presentarse() + ", guerrero con " + vida + " de vida";</code>'],
  tests: [
    { name: 'presentarse()', snippet: 'Guerrero g = new Guerrero("Thor");\nSystem.out.println(g.presentarse());', expect: 'Soy Thor, guerrero con 120 de vida' },
    { name: 'atacar() redefinido', snippet: 'System.out.println(new Guerrero("X").atacar());', expect: '20' },
    { name: 'Polimorfismo: variable de tipo Personaje', snippet: 'Personaje p = new Guerrero("Freya");\nSystem.out.println(p.presentarse() + " / " + p.atacar());', expect: 'Soy Freya, guerrero con 120 de vida / 20' },
    { name: 'Un Guerrero es un Personaje', snippet: 'Object o = new Guerrero("Z");\nSystem.out.println(o instanceof Personaje);', expect: 'true' },
    { name: 'Un Personaje normal no cambia', snippet: 'Personaje p = new Personaje("Aldeano", 30);\nSystem.out.println(p.presentarse() + " / " + p.atacar());', expect: 'Soy Aldeano / 5' }
  ],
  solution: PERSONAJE + `\nclass Guerrero extends Personaje {\n    Guerrero(String nombre) {\n        super(nombre, 120);\n    }\n\n    @Override\n    String presentarse() {\n        return super.presentarse() + ", guerrero con " + vida + " de vida";\n    }\n\n    @Override\n    int atacar() {\n        return 20;\n    }\n}\n`,
  xp: 110, gold: 32
});

const MONSTRUO = `abstract class Monstruo {
    protected String nombre;

    Monstruo(String nombre) {
        this.nombre = nombre;
    }

    // Cada monstruo calcula su daño a su manera
    abstract int danio();

    String info() {
        return nombre + " hace " + danio() + " de daño";
    }
}
`;
L({
  id: '5-4', world: 5, title: 'La horda polimórfica', kind: 'combat', foe: { name: 'Horda de monstruos', emoji: '👹', dmg: 13 },
  story: 'Una horda variada ataca la fortaleza: orcos, duendes... No sabes quién es quién, pero todos hacen daño a su manera.',
  lesson: `
<p>Una clase <b>abstracta</b> (<code>abstract class</code>) es un molde incompleto: <b>no se pueden crear objetos</b> de ella, pero sirve de base. Puede tener métodos <code>abstract</code> (sin cuerpo) que las subclases <b>están obligadas</b> a implementar.</p>
<pre><code>abstract class Monstruo {
    abstract int danio();             // sin cuerpo
    String info() { return "hace " + danio(); }   // con cuerpo: se hereda
}
class Orco extends Monstruo {
    int danio() { return 15; }
}</code></pre>
<p>El <b>polimorfismo</b> permite tratar objetos distintos a través del tipo común. Java decide <b>en tiempo de ejecución</b> qué versión de <code>danio()</code> ejecutar:</p>
<pre><code>Monstruo[] horda = { new Orco(), new Duende() };
for (Monstruo m : horda) {
    System.out.println(m.danio());    // cada uno responde a su manera
}</code></pre>
<div class="note">📝 <b>Para el examen:</b> si una clase no abstracta no implementa todos los métodos abstractos heredados, no compila.</div>`,
  task: 'Ya existe la clase abstracta <code>Monstruo</code>. Escribe <code>Orco</code> (constructor sin parámetros que llama a <code>super("Orco")</code>; <code>danio()</code> devuelve <b>15</b>) y <code>Duende</code> (<code>super("Duende")</code>; <code>danio()</code> devuelve <b>5</b>).',
  mode: 'class',
  starter: MONSTRUO + `\n// Escribe aquí Orco y Duende\n`,
  free: 'Monstruo m = new Orco();\nSystem.out.println(m.info());',
  hints: ['<code>class Orco extends Monstruo {</code>', 'Constructor sin parámetros: <code>Orco() { super("Orco"); }</code>', 'Implementa <code>int danio() { return 15; }</code>'],
  tests: [
    { name: 'Un orco', snippet: 'Monstruo m = new Orco();\nSystem.out.println(m.info());', expect: 'Orco hace 15 de daño' },
    { name: 'Un duende', snippet: 'System.out.println(new Duende().info());', expect: 'Duende hace 5 de daño' },
    { name: 'Una horda (polimorfismo)', snippet: 'Monstruo[] horda = { new Orco(), new Duende(), new Duende() };\nint total = 0;\nfor (Monstruo x : horda) {\n    total += x.danio();\n}\nSystem.out.println(total);', expect: '25' }
  ],
  solution: MONSTRUO + `\nclass Orco extends Monstruo {\n    Orco() {\n        super("Orco");\n    }\n\n    int danio() {\n        return 15;\n    }\n}\n\nclass Duende extends Monstruo {\n    Duende() {\n        super("Duende");\n    }\n\n    int danio() {\n        return 5;\n    }\n}\n`,
  xp: 120, gold: 34
});

L({
  id: '5-5a', world: 5, title: 'El contrato mágico', kind: 'puzzle', foe: { name: 'Grimorio parlante', emoji: '📕', dmg: 13 },
  story: 'Un grimorio exige a todo el que quiera lanzar hechizos que firme un <b>contrato</b>: debe saber hacer <code>lanzar()</code>. No importa si es mago o clérigo.',
  lesson: `
<p>Una <b>interfaz</b> es un <b>contrato</b>: lista de métodos que una clase promete implementar. No dice <i>cómo</i>, solo <i>qué</i>.</p>
<pre><code>interface Hechizable {
    String lanzar();               // sin cuerpo: es el contrato
}

class Mago implements Hechizable {
    public String lanzar() {       // en una interfaz los métodos son public
        return "Bola de fuego";
    }
}</code></pre>
<ul><li>Una clase puede <b>implementar varias</b> interfaces (<code>implements A, B</code>) pero solo heredar de <b>una</b> clase (<code>extends</code>).</li>
<li>Al implementar el método, hay que ponerle <code>public</code>.</li>
<li>Puedes usar la interfaz como tipo: <code>Hechizable h = new Mago();</code></li></ul>
<div class="note">📝 <b>Para el examen:</b> clase abstracta = «es un» con parte del código; interfaz = «sabe hacer» sin código (salvo <code>default</code>). Un objeto puede cumplir muchos contratos.</div>`,
  task: 'Ya existe la interfaz <code>Hechizable</code>. Crea <code>Mago implements Hechizable</code> cuyo <code>lanzar()</code> devuelve <code>Bola de fuego</code> y <code>Clerigo implements Hechizable</code> cuyo <code>lanzar()</code> devuelve <code>Curación divina</code>.',
  mode: 'class',
  starter: `interface Hechizable {\n    String lanzar();\n}\n\n// Escribe aquí Mago y Clerigo\n`,
  free: 'Hechizable h = new Mago();\nSystem.out.println(h.lanzar());',
  hints: ['<code>class Mago implements Hechizable {</code>', 'El método debe ser <code>public String lanzar()</code>.', 'Haz lo mismo para <code>Clerigo</code> con otro texto.'],
  tests: [
    { name: 'Mago', snippet: 'Hechizable h = new Mago();\nSystem.out.println(h.lanzar());', expect: 'Bola de fuego' },
    { name: 'Clérigo', snippet: 'Hechizable h = new Clerigo();\nSystem.out.println(h.lanzar());', expect: 'Curación divina' },
    { name: 'Un grupo de hechiceros', snippet: 'Hechizable[] grupo = { new Mago(), new Clerigo() };\nfor (Hechizable x : grupo) {\n    System.out.println(x.lanzar());\n}', expect: 'Bola de fuego\nCuración divina' }
  ],
  solution: `interface Hechizable {\n    String lanzar();\n}\n\nclass Mago implements Hechizable {\n    public String lanzar() {\n        return "Bola de fuego";\n    }\n}\n\nclass Clerigo implements Hechizable {\n    public String lanzar() {\n        return "Curación divina";\n    }\n}\n`,
  xp: 115, gold: 34
});

L({
  id: '5-5b', world: 5, title: 'El gemelo malvado', kind: 'trap', foe: { name: 'Espejo gemelo', emoji: '🪞', dmg: 13 },
  story: 'Un doble idéntico de cada objeto camina por la fortaleza. Dos «Oro» son el mismo objeto aunque su valor difiera... ¿o no? Hay que enseñar a Java a <b>compararlos</b> y a <b>contarlos</b>.',
  lesson: `
<p>Todas las clases heredan de <code>Object</code>, que ofrece tres métodos que conviene <b>redefinir</b>:</p>
<ul><li><code>toString()</code>: texto que representa al objeto (lo que sale al imprimirlo).</li>
<li><code>equals(Object o)</code>: cuándo dos objetos se consideran <b>iguales</b> (por defecto, solo si son el mismo).</li>
<li><code>hashCode()</code>: debe ser <b>coherente</b> con <code>equals</code> (iguales ⇒ mismo hash).</li></ul>
<pre><code>@Override
public boolean equals(Object o) {
    if (!(o instanceof Item)) return false;
    Item otro = (Item) o;               // cast tras comprobar instanceof
    return nombre.equals(otro.nombre);
}</code></pre>
<p>Un atributo <code>static</code> pertenece a <b>la clase</b>, no a cada objeto: es único y compartido (ideal para contadores).</p>
<pre><code>private static int creados = 0;     // uno solo para todos
static int getCreados() { return creados; }</code></pre>
<div class="note">⚠️ <code>a == b</code> compara si son el <b>mismo objeto</b>; <code>a.equals(b)</code> compara su <b>contenido</b> según la regla de la clase.</div>`,
  task: 'Crea <code>Item</code> con <code>nombre</code> (String) y <code>valor</code> (int), constructor <code>Item(String nombre, int valor)</code>. Redefine <code>toString()</code> → <code>Item[nombre=Gema, valor=50]</code>; <code>equals</code> → dos items son iguales si tienen el <b>mismo nombre</b> (y <code>equals</code> con algo que no es un Item da <code>false</code>); <code>hashCode</code> coherente. Añade un contador <code>static</code> de items creados con <code>static int getCreados()</code>.',
  mode: 'class',
  starter: `class Item {\n    // atributos y contador static\n\n    // constructor\n\n    // toString, equals, hashCode, getCreados\n\n}\n`,
  free: 'Item a = new Item("Gema", 50);\nSystem.out.println(a);',
  hints: ['El contador: <code>private static int creados = 0;</code> y súmale 1 en el constructor.', '<code>equals</code>: primero <code>if (!(o instanceof Item)) return false;</code>, luego compara <code>nombre.equals(...)</code>.', '<code>hashCode</code>: <code>return nombre.hashCode();</code>'],
  tests: [
    { name: 'toString', snippet: 'System.out.println(new Item("Gema", 50));', expect: 'Item[nombre=Gema, valor=50]' },
    { name: 'equals por nombre', snippet: 'Item a = new Item("Oro", 10), b = new Item("Oro", 99), c = new Item("Plata", 10);\nSystem.out.println(a.equals(b) + " " + a.equals(c));', expect: 'true false' },
    { name: 'equals con algo que no es un Item', snippet: 'System.out.println(new Item("a", 1).equals("a"));', expect: 'false' },
    { name: 'hashCode coherente con equals', snippet: 'System.out.println(new Item("Oro", 1).hashCode() == new Item("Oro", 2).hashCode());', expect: 'true' },
    { name: 'Contador static', snippet: 'new Item("a", 1);\nnew Item("b", 2);\nnew Item("c", 3);\nSystem.out.println(Item.getCreados());', expect: '3' }
  ],
  solution: `class Item {\n    private String nombre;\n    private int valor;\n    private static int creados = 0;\n\n    Item(String nombre, int valor) {\n        this.nombre = nombre;\n        this.valor = valor;\n        creados++;\n    }\n\n    static int getCreados() {\n        return creados;\n    }\n\n    @Override\n    public String toString() {\n        return "Item[nombre=" + nombre + ", valor=" + valor + "]";\n    }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Item)) {\n            return false;\n        }\n        Item otro = (Item) o;\n        return nombre.equals(otro.nombre);\n    }\n\n    @Override\n    public int hashCode() {\n        return nombre.hashCode();\n    }\n}\n`,
  xp: 125, gold: 36
});

const CRIATURA = `abstract class Criatura {
    private String nombre;
    private int vida;

    Criatura(String nombre, int vida) {
        this.nombre = nombre;
        this.vida = vida;
    }

    String getNombre() { return nombre; }
    int getVida() { return vida; }
    boolean estaViva() { return vida > 0; }

    void recibirDanio(int d) {
        vida = Math.max(0, vida - d);
    }

    abstract int atacar();
}

interface Volador {
    String volar();
}
`;
L({
  id: '5-b', world: 5, title: 'El Dragón de las Clases', kind: 'boss', foe: { name: 'Dragón de las Clases', emoji: '🐲', dmg: 15 },
  story: 'En el torreón más alto duerme un dragón. Para enfrentarte a él debes modelar a los dos contendientes con todo lo aprendido: herencia, abstracción, encapsulación e interfaces.',
  lesson: `
<p>¡Combate final del mundo! Repasa:</p>
<ul><li><b>Herencia</b>: <code>class A extends B</code>, <code>super(...)</code> en el constructor.</li>
<li><b>Encapsulación</b>: los atributos <code>private</code> del padre <b>no</b> se ven desde el hijo; se usan los getters o el constructor del padre.</li>
<li><b>Abstracción</b>: hay que implementar todos los métodos <code>abstract</code>.</li>
<li><b>Interfaces</b>: <code>class A extends B implements C</code> (primero extends, luego implements) y los métodos de la interfaz son <code>public</code>.</li>
<li><b>Polimorfismo</b>: una variable de tipo <code>Criatura</code> puede guardar un <code>Dragon</code> o un <code>Caballero</code>.</li></ul>`,
  task: 'Ya existen <code>Criatura</code> (abstracta) y la interfaz <code>Volador</code>. Escribe:<br>• <code>Caballero extends Criatura</code>: constructor <code>Caballero(String nombre)</code> con <b>80</b> de vida; <code>atacar()</code> devuelve <b>25</b>.<br>• <code>Dragon extends Criatura implements Volador</code>: constructor sin parámetros, nombre <code>"Dragón"</code> y <b>100</b> de vida; <code>atacar()</code> devuelve <b>30</b>; <code>volar()</code> devuelve <code>El dragón alza el vuelo</code>.',
  mode: 'class',
  starter: CRIATURA + `\n// Escribe aquí Caballero y Dragon\n`,
  free: 'Criatura d = new Dragon();\nSystem.out.println(d.getNombre() + " " + d.getVida() + " " + d.atacar());',
  hints: ['<code>class Caballero extends Criatura {</code> con <code>Caballero(String nombre) { super(nombre, 80); }</code>', '<code>class Dragon extends Criatura implements Volador {</code> y <code>Dragon() { super("Dragón", 100); }</code>', 'Recuerda: <code>public String volar()</code> (los métodos de interfaz son públicos).'],
  tests: [
    { name: 'Estadísticas del dragón', snippet: 'Criatura d = new Dragon();\nSystem.out.println(d.getNombre() + " " + d.getVida() + " " + d.atacar());', expect: 'Dragón 100 30' },
    { name: 'Estadísticas del caballero', snippet: 'Caballero c = new Caballero("Lancelot");\nSystem.out.println(c.getNombre() + " " + c.getVida() + " " + c.atacar());', expect: 'Lancelot 80 25' },
    { name: 'El dragón vuela (interfaz)', snippet: 'Volador v = new Dragon();\nSystem.out.println(v.volar());', expect: 'El dragón alza el vuelo' },
    { name: 'Polimorfismo: suma de ataques', snippet: 'Criatura[] c = { new Caballero("A"), new Dragon() };\nint s = 0;\nfor (Criatura x : c) {\n    s += x.atacar();\n}\nSystem.out.println(s);', expect: '55' },
    { name: 'El duelo completo', snippet: 'Criatura h = new Caballero("Arthur");\nCriatura d = new Dragon();\nwhile (h.estaViva() && d.estaViva()) {\n    d.recibirDanio(h.atacar());\n    if (d.estaViva()) {\n        h.recibirDanio(d.atacar());\n    }\n}\nSystem.out.println(h.getNombre() + ": " + h.getVida());\nSystem.out.println(d.getNombre() + ": " + d.getVida());', expect: 'Arthur: 0\nDragón: 25' }
  ],
  solution: CRIATURA + `\nclass Caballero extends Criatura {\n    Caballero(String nombre) {\n        super(nombre, 80);\n    }\n\n    int atacar() {\n        return 25;\n    }\n}\n\nclass Dragon extends Criatura implements Volador {\n    Dragon() {\n        super("Dragón", 100);\n    }\n\n    int atacar() {\n        return 30;\n    }\n\n    public String volar() {\n        return "El dragón alza el vuelo";\n    }\n}\n`,
  xp: 180, gold: 90
});
})(typeof window !== 'undefined' ? window : globalThis);
