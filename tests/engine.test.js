const { t, done } = require('./harness.js');
t('hola', 'System.out.println("Hola");', 'Hola\n');
t('vars', 'int a = 5; double b = 2.5; String s = "x"; System.out.println(a + b + s + (a/2) + " " + 7%3 + " " + 5/2.0);', '7.5x2 1 2.5\n');
t('if', 'int v = 20; if (v > 10) { System.out.println("alto"); } else System.out.println("bajo");', 'alto\n');
t('for', 'int s=0; for (int i=1;i<=5;i++) s+=i; System.out.println(s);', '15\n');
t('while/break', 'int i=0; while(true){ i++; if(i==3) break; } System.out.println(i);', '3\n');
t('array', 'int[] a = {3,1,2}; java.util.Arrays.sort(a); System.out.println(java.util.Arrays.toString(a) + a.length);', '[1, 2, 3]3\n');
t('method', 'static int dbl(int x){ return x*2; } System.out.println(dbl(21));', '42\n');
t('recursion', 'static int f(int n){ return n<=1?1:n*f(n-1);} System.out.println(f(10));', '3628800\n');
t('fib', 'static int fib(int n){ if(n<2) return n; return fib(n-1)+fib(n-2);} System.out.println(fib(20));', '6765\n');
t('class', `public class Main {
  static class P { private String n; P(String n){this.n=n;} String hi(){ return "Hola "+n; } }
  public static void main(String[] a){ P p=new P("Ana"); System.out.println(p.hi()); } }`, 'Hola Ana\n');
t('inherit', `abstract class A { abstract String s(); public String toString(){ return "A:"+s(); } }
class B extends A { String s(){ return "b"; } }
public class Main { public static void main(String[] x){ A a = new B(); System.out.println(a); } }`, 'A:b\n');
t('list', 'import java.util.*; List<Integer> l = new ArrayList<>(); l.add(3); l.add(1); l.add(2); Collections.sort(l); System.out.println(l + " " + l.size());', '[1, 2, 3] 3\n');
t('map', 'Map<String,Integer> m = new HashMap<>(); m.put("b",2); m.put("a",1); m.put("zebra",3); for (String k : m.keySet()) System.out.print(k+"="+m.get(k)+" "); System.out.println(m);', 'zebra=3 a=1 b=2 {zebra=3, a=1, b=2}\n');
t('exc', 'try { int x = 1/0; } catch (ArithmeticException e) { System.out.println("caught " + e.getMessage()); } finally { System.out.println("fin"); }', 'caught / by zero\nfin\n');
t('uncaught', 'int[] a = new int[2]; a[5] = 1;', 'exception: java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 2 @1');
t('custom exc', `class MiEx extends Exception { MiEx(String m){ super(m);} }
public class Main { static void f() throws MiEx { throw new MiEx("boom"); } public static void main(String[] a){ try { f(); } catch (MiEx e) { System.out.println(e.getMessage()+" "+e); } } }`, 'boom MiEx: boom\n');
t('compile lossy', 'int x = 3.5;', 'compile: incompatible types: possible lossy conversion from double to int @1');
t('compile semi', 'int x = 3\nSystem.out.println(x);', "compile: ';' expected @1");
t('compile str', 'int x = "a";', 'compile: incompatible types: String cannot be converted to int @1');
t('missing ret', 'static int f(int a){ if(a>1) return 1; } System.out.println(f(2));', 'compile: missing return statement @1');
t('switch', 'int d=2; switch(d){ case 1: System.out.println("a"); break; case 2: System.out.println("b"); case 3: System.out.println("c"); break; default: System.out.println("z"); }', 'b\nc\n');
t('switch expr', 'String s = "x"; int r = switch(s){ case "x" -> 10; case "y" -> 20; default -> 0; }; System.out.println(r);', '10\n');
t('enum', 'enum C { ROJO, AZUL; } C c = C.AZUL; System.out.println(c + " " + c.ordinal() + " " + C.values().length); switch(c){ case ROJO -> System.out.println("r"); case AZUL -> System.out.println("a"); }', 'AZUL 1 2\na\n');
t('lambda', 'import java.util.*; List<String> l = new ArrayList<>(List.of("bb","a","ccc")); l.sort((x,y)->x.length()-y.length()); System.out.println(l); l.forEach(s -> System.out.print(s)); System.out.println();', '[a, bb, ccc]\nabbccc\n');
t('stream', 'import java.util.*; List<Integer> l = List.of(1,2,3,4); System.out.println(l.stream().filter(x->x%2==0).map(x->x*10).toList());', '[20, 40]\n');
t('format', 'System.out.printf("%5.2f|%-5s|%05d|%,d|%n", 3.14159, "ab", 42, 1234567);', ' 3.14|ab   |00042|1,234,567|\n');
t('string methods', 'String s = "Hola Mundo"; System.out.println(s.toUpperCase()+s.length()+s.charAt(1)+s.substring(5)+s.indexOf("M")+s.replace("o","0"));', 'HOLA MUNDO10oMundo5H0la Mund0\n');
t('char math', 'char c = (char)(\'a\' + 1); int n = \'a\' + 1; System.out.println(c + " " + n + (char)65);', 'b 98A\n');
t('long overflow', 'int a = Integer.MAX_VALUE; a++; long b = 1L << 40; System.out.println(a + " " + b);', '-2147483648 1099511627776\n');
t('stackoverflow', 'static int f(int n){ return f(n+1)+1; } try { f(0); } catch (StackOverflowError e) { System.out.println("so"); }', 'so\n');
t('deep recursion 300', 'static int s(int n){ return n==0?0:n+s(n-1);} System.out.println(s(300));', '45150\n');
t('infinite', 'while(true){}', 'timeout: Tu programa tardó demasiado: ¿hay un bucle infinito? @1');
t('private', `class A { private int x = 1; }
public class Main { public static void main(String[] a){ A o = new A(); System.out.println(o.x); } }`, 'compile: x has private access in A @2');
t('interface', `interface Vol { int alt(); default String d(){ return "alt="+alt(); } }
class Ave implements Vol { public int alt(){ return 5; } }
public class Main { public static void main(String[] a){ Vol v = new Ave(); System.out.println(v.d()); } }`, 'alt=5\n');
t('abstract miss', `interface I { void f(); }
class C implements I { }
public class Main { public static void main(String[] a){ } }`, 'compile: C is not abstract and does not override abstract method f() in I @2');
t('static counter', `class C { static int n = 0; C(){ n++; } }
public class Main { public static void main(String[] a){ new C(); new C(); System.out.println(C.n); } }`, '2\n');
t('2d array', 'int[][] g = new int[3][4]; g[1][2] = 7; int s=0; for(int[] r : g) for(int v : r) s+=v; System.out.println(s + " " + g.length + g[0].length);', '7 34\n');
t('ternary/compound', 'int x = 10; x += 5; x *= 2; x -= 1; x /= 3; x %= 7; double d = 5; d /= 2; System.out.println(x + " " + d);', '2 2.5\n');
t('anon class', `interface G { String hi(); }
public class Main { public static void main(String[] a){ String n="Ana"; G g = new G(){ public String hi(){ return "hola "+n; } }; System.out.println(g.hi()); } }`, 'hola Ana\n');
t('super call', `class A { String n; A(String n){ this.n=n; } String d(){ return "A"+n; } }
class B extends A { B(){ super("x"); } String d(){ return "B"+super.d(); } }
public class Main { public static void main(String[] a){ System.out.println(new B().d()); } }`, 'BAx\n');
t('super ctor missing', `class A { A(int x){} }
class B extends A { B(){ } }
public class Main { public static void main(String[] a){ } }`, 'compile: constructor A in class A cannot be applied to given types;\n  required: int\n  found:    no arguments @2');
t('ConcurrentMod', 'List<Integer> l = new ArrayList<>(List.of(1,2,3)); try { for (int x : l) if (x==1) l.remove(Integer.valueOf(x)); } catch (ConcurrentModificationException e) { System.out.println("CME"); }', 'CME\n');
t('uninit', 'int x; System.out.println(x);', 'compile: variable x might not have been initialized @1');
t('stringbuilder', 'StringBuilder sb = new StringBuilder(); for(int i=0;i<3;i++) sb.append(i).append(","); sb.reverse(); System.out.println(sb);', ',2,1,0\n');
t('random', 'Random r = new Random(42); System.out.println(r.nextInt(100) + " " + r.nextInt(100) + " " + r.nextInt());', '30 63 -1360544799\n');
t('hashcode', 'System.out.println("hello".hashCode());', '99162322\n');
t('record', 'record P(int x, int y) {} P p = new P(1,2); System.out.println(p + " " + p.x() + " " + p.equals(new P(1,2)));', 'P[x=1, y=2] 1 true\n');
t('labeled', 'outer: for(int i=0;i<3;i++){ for(int j=0;j<3;j++){ if(j==2) continue outer; if(i==2) break outer; System.out.print(i+""+j+" "); } } System.out.println();', '00 01 10 11 \n');
t('inner/outer scope', 'int x = 1; { int y = 2; } int y = 3; System.out.println(x+y);', '4\n');
t('dup var', 'int x = 1; int x = 2;', 'compile: variable x is already defined in this scope @1');
t('string equals', 'String a = "hi"; String b = "hi"; System.out.println(a.equals(b) + " " + "abc".compareTo("abd") + " " + "a".compareTo("c"));', 'true -1 -2\n');
t('double print', 'System.out.println(1.0/3 + " " + 100.0 + " " + 1e10 + " " + (float)1.5 + " " + 0.1+0.2 + " " + (0.1+0.2));', '0.3333333333333333 100.0 1.0E10 1.5 0.10.2 0.30000000000000004\n');
t('math', 'System.out.println(Math.max(3,7)+" "+Math.pow(2,10)+" "+Math.sqrt(16)+" "+Math.round(2.5)+" "+Math.abs(-4)+" "+Math.floor(-1.5));', '7 1024.0 4.0 3 4 -2.0\n');
done();

