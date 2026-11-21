/* Mazmorra errante: eliges puertas sin saber qué hay detrás y escribes la instrucción Java para actuar */
(function (G) {
const W = G.GAME = G.GAME || { worlds: [], levels: {} };

W.RUN = {
  total: 5,   // habitaciones por mazmorra (la última es el jefe)
  types: {
    enemy: { emoji: '⚔️', name: 'Un enemigo' }, elite: { emoji: '💀', name: 'Un enemigo temible' }, treasure: { emoji: '📦', name: 'Un tesoro' },
    riddle: { emoji: '❓', name: 'Un acertijo' }, rest: { emoji: '⛲', name: 'Una fuente curativa' }, boss: { emoji: '👑', name: '¡El jefe de la mazmorra!' }
  },
  hints: {
    enemy: 'Al otro lado se oyen pasos y gruñidos.', elite: 'Un rugido grave hace vibrar la puerta...', treasure: 'Un destello dorado se cuela por la rendija.',
    riddle: 'Se oye un murmullo, como de alguien que hace preguntas.', rest: 'Se oye agua que gotea y una calma extraña: parece un lugar para descansar.', boss: 'El suelo tiembla con cada latido de algo enorme.'
  },
  // qué instrucción hay que escribir en cada situación
  commands: {
    walk: [['heroe.caminar();', 'das unos pasos por el pasillo']],
    choose: [['heroe.entrar(2);', 'abre la puerta 2 y entra'], ['heroe.escuchar(1);', 'pega la oreja a la puerta 1 (una vez por habitación)'], ['heroe.ayuda();', 'lista los comandos']],
    choose1: [['heroe.entrar(1);', 'abre la única puerta y entra'], ['heroe.escuchar(1);', 'pega la oreja a la puerta (una vez por habitación)'], ['heroe.ayuda();', 'lista los comandos']],
    enemy: [['heroe.atacar();', 'plantas cara y empieza el combate'], ['heroe.huir();', 'retrocedes (pierdes un poco de vida)']],
    elite: [['heroe.atacar();', 'plantas cara y empieza el combate'], ['heroe.huir();', 'retrocedes (pierdes vida)']],
    boss: [['heroe.desafiar();', 'desafías al jefe: empieza el combate'], ['heroe.huir();', 'retrocedes (pierdes bastante vida)']],
    treasure: [['heroe.abrir(3);', 'eliges el cofre 3 y te plantea su reto (si hay varios cofres, cada uno con su número)'], ['heroe.huir();', 'te marchas sin abrir ningún cofre']],
    chest: [['heroe.responder("24");', 'das la respuesta al reto del cofre'], ['heroe.huir();', 'te marchas sin abrirlo']],
    riddle: [['heroe.responder("3");', 'das tu respuesta al acertijo (texto o número)'], ['heroe.huir();', 'te marchas sin responder']],
    rest: [['heroe.responder("3");', 'respondes al acertijo de la fuente: si aciertas, recuperas vida'], ['heroe.huir();', 'te marchas de la fuente (por ejemplo, si ya tienes la vida completa)']]
  },
  // tutorial guiado de la primera vez: 1) caminar, 2) elegir puerta (contenido aleatorio), 3) primer combate real (nivel 1-1)
  generateTutorial(worldId) {
    const mid = ['treasure', 'riddle', Math.random() < .5 ? 'treasure' : 'riddle'].sort(() => Math.random() - .5);
    return { world: worldId, tut: true, step: 0, phase: 'walk', cur: null, listened: false, tries: 0, log: [],
      rooms: [{ walk: true, doors: [], blocked: [] }, { doors: mid, blocked: [false, false, false] }, { doors: ['enemy'], blocked: [false] }] };
  },
  // puertas que se eligen antes de cada reto del mapa: una lleva al reto y las otras esconden tesoros y acertijos con grimorios
  generateApproach(lv) {
    const fight = lv.kind === 'boss' ? 'boss' : 'enemy';
    const others = ['treasure', 'riddle', 'rest'].sort(() => Math.random() - .5).slice(0, 2);   // tesoro, acertijo con grimorio o fuente curativa
    const doors = [fight, ...others].sort(() => Math.random() - .5);
    return { world: lv.world, approach: lv.id, step: 0, phase: 'choose', cur: null, listened: false, tries: 0, log: [], rooms: [{ doors, blocked: [false, false, false] }] };
  },
  generate(worldId) {
    const bag = ['enemy', 'enemy', 'enemy', 'enemy', 'treasure', 'treasure', 'riddle', 'riddle', 'riddle', 'elite'];
    const rooms = [];
    for (let i = 0; i < W.RUN.total - 1; i++) {
      const doors = [0, 1, 2].map(() => bag[Math.floor(Math.random() * bag.length)]);
      if (doors.every(t => t === doors[0])) doors[Math.floor(Math.random() * 3)] = doors[0] === 'riddle' ? 'enemy' : 'riddle';   // un poco de variedad
      rooms.push({ doors, blocked: [false, false, false] });
    }
    rooms.push({ doors: ['boss'], blocked: [false] });
    return { world: worldId, step: 0, rooms, phase: 'choose', cur: null, listened: false, tries: 0, log: [] };
  },
  // acertijos de Java: `code` se muestra y `a` es la respuesta (se valida con el intérprete en los tests)
  riddles: [
    { q: '¿Qué imprime este código?', code: 'System.out.println(7 / 2);', a: '3' },
    { q: '¿Qué imprime este código?', code: 'System.out.println("Java".length());', a: '4' },
    { q: '¿Qué imprime este código?', code: 'int x = 5;\nx += 3;\nSystem.out.println(x);', a: '8' },
    { q: '¿Qué imprime este código?', code: 'System.out.println(10 % 4);', a: '2' },
    { q: '¿Qué imprime este código?', code: 'String s = "hola";\nSystem.out.println(s.charAt(1));', a: 'o' },
    { q: '¿Qué imprime este código? (true o false)', code: 'boolean b = (5 > 3) && (2 > 4);\nSystem.out.println(b);', a: 'false' },
    { q: '¿Qué imprime este código?', code: 'System.out.println(1 + 2 + "3");', a: '33' },
    { q: '¿Qué imprime este código?', code: 'System.out.println("1" + 2 + 3);', a: '123' },
    { q: '¿Qué imprime este código?', code: 'int[] a = {4, 5, 6};\nSystem.out.println(a.length);', a: '3' },
    { q: '¿Qué imprime este código?', code: 'System.out.println((int) 3.99);', a: '3' },
    { q: '¿Qué imprime este código?', code: 'System.out.println(Math.max(3, 8));', a: '8' },
    { q: '¿Qué imprime este código?', code: "System.out.println('a' + 1);", a: '98' },
    { q: '¿Qué imprime este código?', code: 'double d = 5 / 2;\nSystem.out.println(d);', a: '2.0' },
    { q: '¿Qué imprime este código?', code: 'int s = 0;\nfor (int i = 1; i <= 4; i++) {\n    s += i;\n}\nSystem.out.println(s);', a: '10' },
    { q: '¿Qué imprime este código?', code: 'String t = "Hola";\nSystem.out.println(t.toUpperCase());', a: 'HOLA' },
    { q: '¿Qué imprime este código?', code: 'int n = 3;\nSystem.out.println(n > 2 ? "grande" : "pequeño");', a: 'grande' },
    { q: 'El método especial que se ejecuta al crear un objeto y se llama igual que la clase es el...', code: '', a: 'constructor' },
    { q: 'Palabra clave para que una clase herede de otra (class Perro ___ Animal):', code: '', a: 'extends' },
    { q: 'Palabra clave para lanzar una excepción manualmente (___ new Exception("x")):', code: '', a: 'throw' }
  ],
  // cofres del tesoro: cuanto mejor el cofre, más difícil el reto de Java (adivinar lo que imprime) y mejor el premio
  chests: [
    { id: 1, key: 'madera', world: 1, name: 'Cofre de madera', tier: 'Fácil', gold: [15, 10], xp: 8, potion: 0, book: .1, hurt: 3 },
    { id: 2, key: 'hierro', world: 3, name: 'Cofre de hierro', tier: 'Medio', gold: [35, 15], xp: 15, potion: .25, book: .25, hurt: 5 },
    { id: 3, key: 'oro', world: 5, name: 'Cofre de oro', tier: 'Difícil', gold: [70, 30], xp: 30, potion: .5, book: .5, hurt: 8 },
    { id: 4, key: 'diamante', world: 6, name: 'Cofre de diamante', tier: 'Experto', gold: [140, 60], xp: 55, potion: 1, book: 1, hurt: 12 }
  ],
  chestRiddles: {
    1: [
      { q: '¿Qué imprime este código?', code: 'int edad = 17;\nif (edad >= 18) {\n    System.out.println("mayor");\n} else {\n    System.out.println("menor");\n}', a: 'menor' },
      { q: '¿Qué imprime este código?', code: 'int d = 3;\nswitch (d) {\n    case 1: System.out.println("L"); break;\n    case 3: System.out.println("X"); break;\n    default: System.out.println("?");\n}', a: 'X' },
      { q: '¿Qué imprime este código? (true o false)', code: 'boolean a = true, b = false;\nSystem.out.println(a && !b);', a: 'true' },
      { q: '¿Qué imprime este código?', code: 'int a = 4;\nint b = 6;\nSystem.out.println(a * b);', a: '24' },
      { q: '¿Qué imprime este código?', code: 'String s = "Hola" + " " + "mundo";\nSystem.out.println(s);', a: 'Hola mundo' },
      { q: '¿Qué imprime este código? (true o false)', code: 'int x = 9;\nSystem.out.println(x % 2 == 0);', a: 'false' },
      { q: '¿Qué imprime este código?', code: 'System.out.println(15 / 4);', a: '3' },
      { q: '¿Qué imprime este código?', code: 'System.out.println("cofre".length());', a: '5' },
      { q: '¿Qué imprime este código?', code: 'int n = 3;\nn++;\nSystem.out.println(n);', a: '4' }
    ],
    2: [
      { q: '¿Qué imprime este código?', code: 'int s = 0;\nfor (int i = 0; i < 5; i += 2) {\n    s += i;\n}\nSystem.out.println(s);', a: '6' },
      { q: '¿Qué imprime este código?', code: 'String t = "mazmorra";\nSystem.out.println(t.substring(2, 5));', a: 'zmo' },
      { q: '¿Qué imprime este código?', code: 'int[] v = {3, 1, 4};\nint m = v[0];\nfor (int x : v) {\n    if (x > m) m = x;\n}\nSystem.out.println(m);', a: '4' },
      { q: '¿Qué imprime este código?', code: 'int i = 0;\nwhile (i < 10) {\n    i += 3;\n}\nSystem.out.println(i);', a: '12' },
      { q: '¿Qué imprime este código?', code: 'String a = "java";\nSystem.out.println(a.indexOf(\'v\'));', a: '2' },
      { q: '¿Qué imprime este código?', code: 'System.out.println(Math.pow(2, 3));', a: '8.0' }
    ],
    3: [
      { q: '¿Qué imprime este código?', code: 'int x = 5;\nSystem.out.println(x++ + ++x);', a: '12' },
      { q: '¿Qué imprime este código? (ojo: los String son inmutables)', code: 'String s = "ab";\ns.toUpperCase();\nSystem.out.println(s);', a: 'ab' },
      { q: '¿Qué imprime este código?', code: 'int[] a = {1, 2, 3};\nint[] b = a;\nb[0] = 9;\nSystem.out.println(a[0]);', a: '9' },
      { q: '¿Qué imprime este código?', code: 'StringBuilder sb = new StringBuilder("abc");\nsb.reverse();\nsb.append(1);\nSystem.out.println(sb);', a: 'cba1' },
      { q: '¿Qué imprime este código?', code: 'System.out.println(10 / 4 * 2.0);', a: '4.0' },
      { q: '¿Qué imprime este código?', code: 'int c = 0;\nfor (int i = 0; i < 3; i++) {\n    for (int j = i; j < 3; j++) {\n        c++;\n    }\n}\nSystem.out.println(c);', a: '6' },
      { q: '¿Qué imprime este código? (true o false)', code: 'System.out.println(0.1 + 0.2 == 0.3);', a: 'false' }
    ],
    4: [
      { q: '¿Qué imprime este código?', code: 'System.out.println(Integer.MAX_VALUE + 1);', a: '-2147483648' },
      { q: '¿Qué imprime este código?', code: 'int x = 7;\nx ^= 3;\nSystem.out.println(x);', a: '4' },
      { q: '¿Qué imprime este código?', code: 'Map<String, Integer> m = new HashMap<>();\nm.put("a", 1);\nm.put("a", 2);\nm.put("b", 3);\nSystem.out.println(m.size() + " " + m.get("a"));', a: '2 2' },
      { q: '¿Qué imprime este código?', code: 'List<Integer> l = new ArrayList<>(List.of(1, 2, 3, 4));\nl.remove(Integer.valueOf(2));\nl.remove(0);\nSystem.out.println(l);', a: '[3, 4]' },
      { q: '¿Qué imprime este código?', code: 'System.out.println((char) (\'a\' + 2));', a: 'c' },
      { q: '¿Qué imprime este código?', code: 'System.out.println(5 + 3 + "x" + 5 + 3);', a: '8x53' },
      { q: '¿Qué imprime este código? (true o false)', code: 'int z = 0;\nboolean r = (z != 0) && (10 / z > 1);\nSystem.out.println(r);', a: 'false' },
      { q: '¿Qué imprime este código?', code: 'System.out.println("a,b,,c".split(",").length);', a: '4' },
      { q: '¿Qué excepción lanza este código? (nombre de la clase)', code: 'int[] a = new int[3];\na[3] = 1;', a: 'ArrayIndexOutOfBoundsException', thrown: true }
    ]
  }  ,
  // mundo mínimo para poder resolver cada acertijo de cofre (según lo que se haya enseñado hasta entonces)
  minWorld(r) { const c = r.code || ''; let w = 1; if (/if \(|switch|&&|\|\|/.test(c)) w = 2; if (/while|for \(/.test(c)) w = 3; if (/int\[\]|\[3\] = 1/.test(c)) w = 4; if (/HashMap|ArrayList|List\.of/.test(c)) w = 6; if (/constructor|herede|extends|class |excepci|crear un objeto/i.test(r.q || '')) w = Math.max(w, 5); return w; },
  // acertijo general (puertas de acertijo y fuentes): solo con lo que se ha enseñado en ese mundo
  pickGeneral(world, rnd, tut) { const pool = tut ? this.riddles.slice(0, 5) : this.riddles.filter(r => this.minWorld(r) <= (world || 1)); return pool[rnd(pool.length)]; },
  // siempre 3 cofres: mundos 1-2 madera · 3-4 madera y hierro · 5 hierro y oro · 6-7 oro y diamante (según la sala)
  chestCount() { return 3; },
  chestAt(n, world, scene) {
    const w = world || 1; if (w <= 2) return this.chests[0]; if (w <= 4) return n === 3 ? this.chests[1] : this.chests[0];
    const key = (this.scenes[scene] || this.scenes.a)[n - 1]; return this.chests.find(c => c.key === key);
  },
  // salas de cofres del mundo 5 en adelante (una imagen por sala; se elige una al entrar)
  scenes: { a: ['hierro', 'hierro', 'oro'], b: ['hierro', 'oro', 'oro'], c: ['oro', 'oro', 'oro'], d: ['oro', 'oro', 'diamante'], e: ['diamante', 'diamante', 'oro'] },
  scenesByWorld: { 5: ['a', 'b'], 6: ['c', 'd'], 7: ['d', 'e'] },
  pickScene(world, rnd) { if ((world || 1) < 5) return null; const l = this.scenesByWorld[Math.min(world, 7)]; return l[rnd(l.length)]; },
  layout(world, scene) { return [1, 2, 3].map(n => this.chestAt(n, world, scene)); },  // cofres disponibles en un mundo: 1 madera · 3 hierro · 5 oro · 6 diamante
  chestOpen(chest, world) { return (world || 1) >= chest.world; },
  // nivel del equipo que da un cofre: cada material tiene dos niveles (el segundo, un mundo después de aparecer)
  gearPower(chest, world) { return Math.min(3, (chest.id - 1) + ((world || 1) > chest.world ? 1 : 0)); },
  pickRiddle(chestId, world, rnd) {
    for (let p = chestId; p >= 1; p--) { const l = this.chestRiddles[p].filter(r => this.minWorld(r) <= (world || 1)); if (l.length) return l[rnd(l.length)]; }
    return this.chestRiddles[1][rnd(this.chestRiddles[1].length)];
  }};
})(typeof window !== 'undefined' ? window : globalThis);
