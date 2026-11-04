// Interview Preparation content: one entry per sidebar topic. `runner` picks how the compiler runs its code.
const code = (strings, ...values) => String.raw(strings, ...values).trim();

/** Fresh tables for every SQL run, so practice queries can't break anything. */
export const SQL_SEED = code`
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'HR'), (4, 'Legal');

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  dept_id INTEGER REFERENCES departments(id),
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL,
  hire_date TEXT NOT NULL
);
INSERT INTO employees VALUES
  (1, 'Asha',   1, NULL, 150000, '2018-03-12'),
  (2, 'Ravi',   1, 1,    120000, '2019-07-01'),
  (3, 'Meera',  1, 1,    120000, '2021-01-15'),
  (4, 'John',   2, 1,     80000, '2020-05-20'),
  (5, 'Priya',  2, 4,     85000, '2022-09-09'),
  (6, 'Karan',  3, 1,     60000, '2023-02-01'),
  (7, 'Neha',   NULL, 1,  55000, '2024-06-17');
`;

export const SQL_TABLES = [
  { name: 'departments', columns: 'id, name' },
  { name: 'employees', columns: 'id, name, dept_id, manager_id, salary, hire_date' },
];

export const TOPICS = {
  java: {
    name: 'Java',
    runner: 'java',
    fileName: 'Main.java',
    subtitle: 'OOP, collections, strings, concurrency and the JVM',
    starter: code`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
`,
    questions: [
      {
        level: 'Basic',
        q: 'What is the difference between JDK, JRE and JVM?',
        a: 'The JVM runs compiled bytecode. The JRE is the JVM plus the standard libraries needed to run programs. The JDK is the JRE plus development tools such as the javac compiler. You need the JDK to write Java and only a runtime to run it.',
      },
      {
        level: 'Basic',
        q: 'What is the difference between == and equals()?',
        a: '== compares primitive values or, for objects, whether two references point to the same object. equals() compares logical content when the class overrides it, as String does. Always compare strings with equals().',
        code: code`
public class Main {
    public static void main(String[] args) {
        String a = new String("java");
        String b = new String("java");
        System.out.println(a == b);       // false: different objects
        System.out.println(a.equals(b));  // true: same content
    }
}
`,
      },
      {
        level: 'Basic',
        q: 'Why are Strings immutable, and when should you use StringBuilder?',
        a: 'Immutable strings can be safely shared in the string pool, cached as hash keys and passed between threads. Every change creates a new object, so use StringBuilder when building a string in a loop. StringBuffer is its older, synchronized version.',
        code: code`
public class Main {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append(i).append(' ');
        }
        System.out.println(sb.toString().trim());
        System.out.println(new StringBuilder("level").reverse());
    }
}
`,
      },
      {
        level: 'Basic',
        q: 'What are the four pillars of OOP?',
        a: 'Encapsulation hides data behind methods. Inheritance lets a class reuse another class. Polymorphism lets one call behave differently depending on the object. Abstraction exposes what an object does and hides how it does it.',
        code: code`
abstract class Shape {
    abstract double area();
}

class Circle extends Shape {
    private final double radius;
    Circle(double radius) { this.radius = radius; }
    @Override double area() { return Math.PI * radius * radius; }
}

class Square extends Shape {
    private final double side;
    Square(double side) { this.side = side; }
    @Override double area() { return side * side; }
}

public class Main {
    public static void main(String[] args) {
        Shape[] shapes = { new Circle(1), new Square(2) };
        for (Shape s : shapes) {
            System.out.printf("%s: %.2f%n", s.getClass().getSimpleName(), s.area());
        }
    }
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between an abstract class and an interface?',
        a: 'An abstract class can hold state and constructors, and a class can extend only one. An interface defines a contract with constants and abstract, default, static or private methods, and a class can implement many. Use an abstract class for shared state and an interface for a capability.',
      },
      {
        level: 'Intermediate',
        q: 'Compare ArrayList and LinkedList.',
        a: 'ArrayList uses a resizable array, so reading by index is O(1) and inserting in the middle is O(n). LinkedList uses linked nodes, so adding at either end is O(1) but reaching an index is O(n). ArrayList is the better default because it is also friendlier to the CPU cache.',
      },
      {
        level: 'Intermediate',
        q: 'How does HashMap work internally?',
        a: 'HashMap hashes the key to choose a bucket in an array. Keys that land in the same bucket are stored in a linked list, which becomes a balanced tree once it grows large. It compares keys with equals() and resizes when entries exceed capacity times the load factor of 0.75. That is why equal objects must have equal hash codes.',
        code: code`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "java python java sql java python";
        Map<String, Integer> counts = new TreeMap<>();
        for (String word : text.split(" ")) {
            counts.merge(word, 1, Integer::sum);
        }
        System.out.println(counts);
    }
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between checked and unchecked exceptions?',
        a: 'Checked exceptions such as IOException must be caught or declared, because callers can often recover from them. Unchecked exceptions extend RuntimeException, such as NullPointerException, and usually signal a programming bug. Use try-with-resources to close resources automatically.',
      },
      {
        level: 'Intermediate',
        q: 'What do Java Streams do? Filter and transform a list.',
        a: 'Streams describe a pipeline of operations on data. Intermediate steps such as filter and map are lazy and run only when a terminal step such as collect or sum starts the pipeline. They do not change the source collection.',
        code: code`
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
        List<Integer> evenSquares = nums.stream()
                .filter(n -> n % 2 == 0)
                .map(n -> n * n)
                .collect(Collectors.toList());
        System.out.println(evenSquares);
    }
}
`,
      },
      {
        level: 'Advanced',
        q: 'What is the difference between synchronized and volatile?',
        a: 'volatile guarantees that every thread sees the latest value of a variable, but it does not make compound actions such as count++ atomic. synchronized gives both visibility and mutual exclusion by allowing one thread at a time into the block. For simple counters, AtomicInteger is lighter.',
        code: code`
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger count = new AtomicInteger();
        Runnable task = () -> {
            for (int i = 0; i < 10000; i++) count.incrementAndGet();
        };
        Thread a = new Thread(task);
        Thread b = new Thread(task);
        a.start();
        b.start();
        a.join();
        b.join();
        System.out.println(count.get()); // always 20000
    }
}
`,
      },
      {
        level: 'Advanced',
        q: 'How does garbage collection work in Java?',
        a: 'The JVM frees objects that are no longer reachable from roots such as thread stacks and static fields. Most heaps are generational: new objects start in the young generation, and those that survive move to the old generation, because most objects die young. You can request collection with System.gc(), but the JVM may ignore it.',
      },
      {
        level: 'Basic',
        q: 'What is the difference between final, finally and finalize?',
        a: 'final stops a variable from being reassigned, a method from being overridden or a class from being extended. finally is a block that runs after try and catch, even when an exception occurs. finalize was a cleanup hook called by the garbage collector and is now deprecated.',
      },
      {
        level: 'Basic',
        q: 'What is the difference between overloading and overriding?',
        a: 'Overloading means methods in a class share a name but have different parameters, and the compiler chooses one. Overriding means a subclass replaces a parent method with the same signature, and the JVM chooses at runtime based on the actual object.',
        code: code`
class Animal {
    String sound() { return "..."; }
    String sound(int times) { return sound().repeat(times); } // overload
}

class Dog extends Animal {
    @Override String sound() { return "Woof "; } // override
}

public class Main {
    public static void main(String[] args) {
        Animal pet = new Dog();
        System.out.println(pet.sound());
        System.out.println(pet.sound(2));
    }
}
`,
      },
      {
        level: 'Basic',
        q: 'What does the static keyword mean?',
        a: 'A static member belongs to the class, not to any one object, so all instances share it. Static methods can be called without creating an object, but they cannot use this or access instance fields directly.',
        code: code`
class Counter {
    static int created = 0;
    Counter() { created++; }
}

public class Main {
    public static void main(String[] args) {
        new Counter();
        new Counter();
        System.out.println(Counter.created);
    }
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the contract between equals() and hashCode()?',
        a: 'If two objects are equal, they must return the same hash code. The reverse need not be true. If you override equals without hashCode, hash-based collections can fail to find an object. Records generate both for you.',
        code: code`
import java.util.*;

record Point(int x, int y) {}

public class Main {
    public static void main(String[] args) {
        Set<Point> points = new HashSet<>();
        points.add(new Point(1, 2));
        System.out.println(points.contains(new Point(1, 2)));
    }
}
`,
      },
      {
        level: 'Intermediate',
        q: 'Compare HashMap, Hashtable and ConcurrentHashMap.',
        a: 'HashMap is not thread-safe and allows one null key. Hashtable is a legacy class that locks the whole map for each operation. ConcurrentHashMap is thread-safe with much finer locking, so it is the usual choice for concurrent code. Hashtable and ConcurrentHashMap do not allow null keys or values.',
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between Comparable and Comparator?',
        a: 'Comparable is implemented by the class itself and defines one natural order through compareTo. Comparator is a separate object, so you can define many orders without changing the class.',
        code: code`
import java.util.*;

record Employee(String name, int salary) implements Comparable<Employee> {
    public int compareTo(Employee other) {
        return name.compareTo(other.name);
    }
}

public class Main {
    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>(List.of(new Employee("Ravi", 90), new Employee("Asha", 70)));
        Collections.sort(staff);
        System.out.println(staff.get(0).name());
        staff.sort(Comparator.comparingInt(Employee::salary).reversed());
        System.out.println(staff.get(0).name());
    }
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What is a functional interface?',
        a: 'It is an interface with exactly one abstract method, such as Runnable or Function, so a lambda can implement it. @FunctionalInterface asks the compiler to enforce this rule.',
        code: code`
@FunctionalInterface
interface Discount {
    double apply(double price);
}

public class Main {
    public static void main(String[] args) {
        Discount festive = price -> price * 0.8;
        System.out.println(festive.apply(100));
    }
}
`,
      },
      {
        level: 'Advanced',
        q: 'Why use an ExecutorService instead of creating threads directly?',
        a: 'Creating threads is costly and unlimited threads can exhaust resources. An ExecutorService reuses a pool of threads and queues tasks. Submitting a task returns a Future for its result. Always shut the pool down when you finish.',
        code: code`
import java.util.*;
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> results = new ArrayList<>();
            for (int i = 1; i <= 3; i++) {
                int n = i;
                results.add(pool.submit(() -> n * n));
            }
            for (Future<Integer> result : results) {
                System.out.println(result.get());
            }
        } finally {
            pool.shutdown();
        }
    }
}
`,
      },
      {
        level: 'Advanced',
        q: 'How do you create a thread-safe Singleton?',
        a: 'The holder idiom is simple and lazy: the JVM initializes the nested class only on first use, and class initialization is thread-safe. An enum with a single value is another good option and also handles serialization.',
        code: code`
class Config {
    private Config() {}

    private static class Holder {
        static final Config INSTANCE = new Config();
    }

    static Config getInstance() {
        return Holder.INSTANCE;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Config.getInstance() == Config.getInstance());
    }
}
`,
      },
    ],
  },

  sql: {
    name: 'SQL',
    runner: 'sql',
    fileName: 'query.sql',
    subtitle: 'Joins, grouping, subqueries and window functions',
    starter: code`
SELECT e.name, d.name AS department, e.salary
FROM employees e
JOIN departments d ON d.id = e.dept_id
ORDER BY e.salary DESC;
`,
    questions: [
      {
        level: 'Basic',
        q: 'What is the difference between WHERE and HAVING?',
        a: 'WHERE filters individual rows before grouping. HAVING filters groups after GROUP BY, so it can use aggregates such as COUNT or SUM.',
        code: code`
SELECT dept_id, COUNT(*) AS people, AVG(salary) AS avg_salary
FROM employees
WHERE salary > 60000
GROUP BY dept_id
HAVING COUNT(*) >= 2;
`,
      },
      {
        level: 'Basic',
        q: 'Explain INNER, LEFT, RIGHT and FULL joins.',
        a: 'INNER JOIN keeps only rows that match in both tables. LEFT JOIN keeps every left row, with NULLs where the right has no match. RIGHT JOIN does the opposite, and FULL JOIN keeps all rows from both sides. Note that Neha has no department and Legal has no employees.',
        code: code`
SELECT e.name, d.name AS department
FROM employees e
LEFT JOIN departments d ON d.id = e.dept_id;
`,
      },
      {
        level: 'Basic',
        q: 'What is the difference between DELETE, TRUNCATE and DROP?',
        a: 'DELETE removes chosen rows, can use WHERE and is usually logged row by row. TRUNCATE quickly removes all rows and keeps the table. DROP removes the table itself, including its structure. Rollback behaviour for TRUNCATE and DROP depends on the database.',
      },
      {
        level: 'Basic',
        q: 'What are primary keys and foreign keys?',
        a: 'A primary key uniquely identifies each row and cannot be NULL. A foreign key references a key in another table, which keeps relationships valid. In the sample tables, employees.dept_id is a foreign key to departments.id.',
      },
      {
        level: 'Intermediate',
        q: 'Find the second highest salary. (LeetCode 176)',
        link: 'https://leetcode.com/problems/second-highest-salary/',
        a: 'Take the highest salary among those below the maximum. Using a subquery handles ties, because duplicates of the top salary are all excluded.',
        code: code`
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
`,
      },
      {
        level: 'Intermediate',
        q: 'Find departments that have no employees.',
        a: 'Use a LEFT JOIN and keep the rows where the right side is NULL. NOT EXISTS works too, and it is safer than NOT IN when the column can contain NULLs.',
        code: code`
SELECT d.name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
WHERE e.id IS NULL;
`,
      },
      {
        level: 'Intermediate',
        q: 'What is a self join? List each employee with their manager.',
        a: 'A self join joins a table to itself using two aliases. It suits hierarchies such as employees and managers. A LEFT JOIN keeps the top manager, who has no manager of their own.',
        code: code`
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;
`,
      },
      {
        level: 'Intermediate',
        q: 'What is an index, and what does it cost?',
        a: 'An index is a sorted structure, usually a B-tree, that lets the database find rows without scanning the whole table. The cost is extra storage and slower inserts, updates and deletes. Index columns that are often used in WHERE, JOIN and ORDER BY.',
      },
      {
        level: 'Advanced',
        q: 'What is the difference between RANK, DENSE_RANK and ROW_NUMBER?',
        a: 'ROW_NUMBER gives every row a unique number. RANK gives ties the same rank and leaves gaps after them. DENSE_RANK gives ties the same rank without gaps. Run this query to see Ravi and Meera tie.',
        code: code`
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
       RANK()       OVER (ORDER BY salary DESC) AS rank_num,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_num
FROM employees;
`,
      },
      {
        level: 'Advanced',
        q: 'Find the highest paid employee in each department. (LeetCode 184)',
        link: 'https://leetcode.com/problems/department-highest-salary/',
        a: 'Rank rows within each department using PARTITION BY inside a common table expression, then keep rank 1. DENSE_RANK returns everyone tied for the top salary.',
        code: code`
WITH ranked AS (
  SELECT name, dept_id, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS pos
  FROM employees
  WHERE dept_id IS NOT NULL
)
SELECT d.name AS department, r.name, r.salary
FROM ranked r
JOIN departments d ON d.id = r.dept_id
WHERE r.pos = 1;
`,
      },
      {
        level: 'Advanced',
        q: 'What are ACID properties?',
        a: 'Atomicity means a transaction fully happens or not at all. Consistency means it moves the database between valid states. Isolation means concurrent transactions do not interfere beyond the chosen isolation level. Durability means committed data survives a crash.',
      },
      {
        level: 'Basic',
        q: 'Find duplicate values in a column. (LeetCode 182)',
        link: 'https://leetcode.com/problems/duplicate-emails/',
        a: 'Group by the column and keep the groups with more than one row. The LeetCode problem does this for emails, and here it finds salaries shared by several employees.',
        code: code`
SELECT salary, COUNT(*) AS people
FROM employees
GROUP BY salary
HAVING COUNT(*) > 1;
`,
      },
      {
        level: 'Basic',
        q: 'Find employees who earn more than their manager. (LeetCode 181)',
        link: 'https://leetcode.com/problems/employees-earning-more-than-their-managers/',
        a: 'Self join the table to reach each employee\'s manager, then compare the two salaries.',
        code: code`
SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;
`,
      },
      {
        level: 'Basic',
        q: 'Find the top salary and how many people earn it. (HackerRank: Top Earners)',
        link: 'https://www.hackerrank.com/challenges/earnings-of-employees/problem',
        a: 'Group by the amount, sort it from highest to lowest, and keep the first row. The HackerRank version calculates earnings as months multiplied by salary, and the same approach applies.',
        code: code`
SELECT salary, COUNT(*) AS people
FROM employees
GROUP BY salary
ORDER BY salary DESC
LIMIT 1;
`,
      },
      {
        level: 'Intermediate',
        q: 'Find the Nth highest salary. (LeetCode 177)',
        link: 'https://leetcode.com/problems/nth-highest-salary/',
        a: 'Select distinct salaries in descending order, then skip N - 1 rows using OFFSET. DISTINCT makes tied salaries count once. To find the 3rd highest, use OFFSET 2.',
        code: code`
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 2;
`,
      },
      {
        level: 'Intermediate',
        q: 'Find the shortest and longest names. (HackerRank: Weather Observation Station 5)',
        link: 'https://www.hackerrank.com/challenges/weather-observation-station-5/problem',
        a: 'Run two sorted queries that each keep one row, and combine them with UNION ALL. Sorting by the name as a second key breaks ties alphabetically.',
        code: code`
SELECT * FROM (SELECT name, LENGTH(name) AS size FROM employees ORDER BY size, name LIMIT 1)
UNION ALL
SELECT * FROM (SELECT name, LENGTH(name) AS size FROM employees ORDER BY size DESC, name LIMIT 1);
`,
      },
      {
        level: 'Intermediate',
        q: 'Format names and count each group. (HackerRank: The PADS)',
        link: 'https://www.hackerrank.com/challenges/the-pads/problem',
        a: 'Join text with the concatenation operator, take the first letter with a substring function, and count rows with GROUP BY. SQLite uses ||, while MySQL uses CONCAT.',
        code: code`
SELECT e.name || '(' || SUBSTR(d.name, 1, 1) || ')' AS label
FROM employees e
JOIN departments d ON d.id = e.dept_id
ORDER BY e.name;

SELECT d.name, COUNT(*) AS people
FROM employees e
JOIN departments d ON d.id = e.dept_id
GROUP BY d.name
ORDER BY people, d.name;
`,
      },
      {
        level: 'Intermediate',
        q: 'Classify rows in a hierarchy. (HackerRank: Binary Tree Nodes)',
        link: 'https://www.hackerrank.com/challenges/binary-search-tree-1/problem',
        a: 'Use CASE with a parent check: no parent means root, being someone\'s parent means inner, and anything else is a leaf. The sample tables have the same structure through manager_id.',
        code: code`
SELECT id, name,
       CASE
         WHEN manager_id IS NULL THEN 'Root'
         WHEN id IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL) THEN 'Inner'
         ELSE 'Leaf'
       END AS node_type
FROM employees
ORDER BY id;
`,
      },
      {
        level: 'Advanced',
        q: 'Pivot rows into columns. (HackerRank: Occupations)',
        link: 'https://www.hackerrank.com/challenges/occupations/problem',
        a: 'Number the rows within each group using ROW_NUMBER, then group by that number. MAX with CASE moves each value into the column for its group, and missing values become NULL.',
        code: code`
WITH numbered AS (
  SELECT e.name, d.name AS department,
         ROW_NUMBER() OVER (PARTITION BY d.name ORDER BY e.name) AS row_num
  FROM employees e
  JOIN departments d ON d.id = e.dept_id
)
SELECT MAX(CASE WHEN department = 'Engineering' THEN name END) AS Engineering,
       MAX(CASE WHEN department = 'Sales' THEN name END) AS Sales,
       MAX(CASE WHEN department = 'HR' THEN name END) AS HR
FROM numbered
GROUP BY row_num;
`,
      },
      {
        level: 'Advanced',
        q: 'Calculate a running total.',
        a: 'SUM used as a window function with ORDER BY adds each row to the total so far. Unlike GROUP BY, it keeps every row. Adding PARTITION BY would restart the total for each group.',
        code: code`
SELECT name, hire_date, salary,
       SUM(salary) OVER (ORDER BY hire_date) AS running_total
FROM employees
ORDER BY hire_date;
`,
      },
    ],
  },

  python: {
    name: 'Python',
    runner: 'python',
    fileName: 'main.py',
    subtitle: 'Data structures, functions, generators and OOP',
    starter: code`
name = "Python"
print(f"Hello, {name}!")
`,
    questions: [
      {
        level: 'Basic',
        q: 'What is the difference between a list and a tuple?',
        a: 'Lists are mutable and tuples are immutable. Tuples can be dictionary keys when their contents are hashable, and they suit fixed records. Lists suit collections that change.',
        code: code`
items = [1, 2]
items.append(3)
print(items)

point = (10, 20)
locations = {point: "home"}
print(locations[(10, 20)])
`,
      },
      {
        level: 'Basic',
        q: 'What is the difference between is and ==?',
        a: '== checks whether two values are equal. is checks whether two names refer to the same object. Use is mainly for comparing with None.',
        code: code`
a = [1, 2]
b = [1, 2]
print(a == b)  # True
print(a is b)  # False
print(a is a)  # True
`,
      },
      {
        level: 'Basic',
        q: 'What are list comprehensions?',
        a: 'A comprehension builds a list from an iterable in one readable expression, with an optional filter. Dictionary and set comprehensions use the same form.',
        code: code`
squares = [n * n for n in range(1, 11) if n % 2 == 0]
print(squares)

lengths = {word: len(word) for word in ["sql", "python"]}
print(lengths)
`,
      },
      {
        level: 'Basic',
        q: 'What do *args and **kwargs do?',
        a: '*args collects extra positional arguments into a tuple. **kwargs collects extra keyword arguments into a dictionary. They let a function accept a flexible number of arguments.',
        code: code`
def describe(*args, **kwargs):
    print("args:", args)
    print("kwargs:", kwargs)

describe(1, 2, role="developer", city="Pune")
`,
      },
      {
        level: 'Intermediate',
        q: 'Why are mutable default arguments dangerous?',
        a: 'Default values are created once, when the function is defined. A mutable default such as a list is shared between calls and keeps earlier changes. Use None as the default and create the list inside the function.',
        code: code`
def bad(item, items=[]):
    items.append(item)
    return items

def good(item, items=None):
    items = [] if items is None else items
    items.append(item)
    return items

print(bad(1), bad(2))
print(good(1), good(2))
`,
      },
      {
        level: 'Intermediate',
        q: 'What is a decorator? Write one.',
        a: 'A decorator is a function that wraps another function to add behaviour without changing its code, such as logging, caching or access checks. functools.wraps keeps the original function name and docstring.',
        code: code`
from functools import wraps

def shout(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper

@shout
def greet(name):
    return f"hello {name}"

print(greet("sanjeev"))
print(greet.__name__)
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between a generator and a list?',
        a: 'A list stores every item in memory. A generator produces items one at a time using yield and remembers where it paused, so it suits large or endless sequences. It can be iterated only once.',
        code: code`
def fibonacci(limit):
    a, b = 0, 1
    while a < limit:
        yield a
        a, b = b, a + b

print(list(fibonacci(50)))
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between a shallow copy and a deep copy?',
        a: 'A shallow copy creates a new outer object that still shares inner objects. A deep copy recursively copies everything, so changes to nested data do not affect the original.',
        code: code`
import copy

original = [[1, 2], [3]]
shallow = copy.copy(original)
deep = copy.deepcopy(original)

original[0].append(99)
print("shallow:", shallow)
print("deep:", deep)
`,
      },
      {
        level: 'Advanced',
        q: 'What is the GIL?',
        a: 'In standard CPython, the Global Interpreter Lock lets only one thread run Python bytecode at a time. Threads still help with I/O work because the lock is released while waiting. For CPU-heavy work, use multiprocessing or native extensions. Python 3.13 added an optional free-threaded build.',
      },
      {
        level: 'Advanced',
        q: 'What is the difference between @staticmethod and @classmethod?',
        a: 'An instance method receives the object as self. A classmethod receives the class as cls, which suits alternative constructors. A staticmethod receives neither and is an ordinary function grouped with the class.',
        code: code`
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    @classmethod
    def from_text(cls, text):
        name, salary = text.split(",")
        return cls(name, int(salary))

    @staticmethod
    def is_valid_salary(amount):
        return amount > 0

person = Employee.from_text("Asha,150000")
print(person.name, person.salary)
print(Employee.is_valid_salary(-5))
`,
      },
      {
        level: 'Advanced',
        q: 'How do context managers work?',
        a: 'The with statement calls __enter__ at the start and __exit__ at the end, even if an exception occurs. This guarantees cleanup of files, locks and connections. contextlib.contextmanager lets you write one as a generator.',
        code: code`
from contextlib import contextmanager

@contextmanager
def step(name):
    print("start", name)
    try:
        yield
    finally:
        print("end", name)

with step("backup"):
    print("working...")
`,
      },
      {
        level: 'Basic',
        q: 'Which Python types are mutable and which are immutable?',
        a: 'Lists, dictionaries and sets are mutable, so they can change in place. Integers, floats, strings, tuples and frozensets are immutable, so an update creates a new object. Only hashable objects can be dictionary keys.',
        code: code`
text = "hi"
before = id(text)
text += "!"
print(id(text) == before)

items = [1]
before = id(items)
items.append(2)
print(id(items) == before)
`,
      },
      {
        level: 'Basic',
        q: 'What is the difference between append and extend?',
        a: 'append adds its argument as one item. extend adds each item from an iterable. Both change the list in place and return None.',
        code: code`
a = [1, 2]
a.append([3, 4])
print(a)

b = [1, 2]
b.extend([3, 4])
print(b)
`,
      },
      {
        level: 'Basic',
        q: 'What are lambda functions, and how are map and filter used?',
        a: 'A lambda is a small anonymous function with one expression. map applies a function to each item, and filter keeps the items for which it returns true. A comprehension is often easier to read.',
        code: code`
nums = [1, 2, 3, 4]
print(list(map(lambda n: n * 2, nums)))
print(list(filter(lambda n: n % 2 == 0, nums)))
print(sorted(["sql", "java", "c"], key=lambda word: len(word)))
`,
      },
      {
        level: 'Intermediate',
        q: 'How does exception handling work, including else and finally?',
        a: 'try holds code that may fail, and except handles specific errors. else runs only if no exception occurred, and finally always runs. Catch the narrowest exception you can.',
        code: code`
def divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("cannot divide by zero")
    else:
        print("result", result)
    finally:
        print("done")

divide(10, 2)
divide(1, 0)
`,
      },
      {
        level: 'Intermediate',
        q: 'What is method resolution order (MRO)?',
        a: 'MRO is the order Python searches classes for a method, which matters with multiple inheritance. It uses the C3 linearization algorithm, and super() follows this order rather than simply calling the parent.',
        code: code`
class A:
    def who(self):
        return "A"

class B(A):
    def who(self):
        return "B>" + super().who()

class C(A):
    def who(self):
        return "C>" + super().who()

class D(B, C):
    pass

print(D().who())
print([cls.__name__ for cls in D.__mro__])
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between __str__ and __repr__?',
        a: '__str__ gives a readable string for users and is what print uses. __repr__ gives an unambiguous string for developers. If __str__ is missing, Python falls back to __repr__.',
        code: code`
class User:
    def __init__(self, name):
        self.name = name

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"User(name={self.name!r})"

user = User("Asha")
print(str(user))
print(repr(user))
`,
      },
      {
        level: 'Intermediate',
        q: 'What is a closure?',
        a: 'A closure is an inner function that remembers variables from its enclosing scope after the outer function returns. Use nonlocal when the inner function needs to reassign such a variable.',
        code: code`
def counter():
    count = 0
    def increase():
        nonlocal count
        count += 1
        return count
    return increase

tick = counter()
tick()
print(tick())
`,
      },
      {
        level: 'Advanced',
        q: 'When would you use threading, multiprocessing and asyncio?',
        a: 'Use threading for blocking I/O with a moderate number of tasks. Use multiprocessing for CPU-heavy work, because each process has its own interpreter. Use asyncio for many concurrent I/O tasks on one thread, as long as the libraries you call support it.',
        code: code`
import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return name

async def main():
    results = await asyncio.gather(fetch("a", 0.2), fetch("b", 0.1))
    print(results)

asyncio.run(main())
`,
      },
      {
        level: 'Advanced',
        q: 'How does Python manage memory?',
        a: 'CPython mainly uses reference counting and frees an object as soon as its count reaches zero. A generational garbage collector also finds reference cycles that counting alone cannot free. Small objects come from a private allocator.',
      },
    ],
  },

  html: {
    name: 'HTML',
    runner: 'preview',
    fileName: 'index.html',
    subtitle: 'Semantic structure, forms, accessibility and SEO',
    starter: code`
<!doctype html>
<html lang="en">
  <head>
    <title>Practice</title>
  </head>
  <body>
    <h1>Hello, HTML!</h1>
    <p>Edit this code and press Run.</p>
  </body>
</html>
`,
    questions: [
      {
        level: 'Basic',
        q: 'What does <!doctype html> do?',
        a: 'It tells the browser to render the page in standards mode. Without it, browsers fall back to quirks mode, which imitates old browser behaviour and can change the layout.',
      },
      {
        level: 'Basic',
        q: 'What are semantic elements?',
        a: 'Semantic elements such as header, nav, main, article and footer describe the meaning of their content. They help screen readers and search engines understand the page, while div and span carry no meaning.',
        code: code`
<header><h1>My Blog</h1></header>
<nav><a href="#">Home</a> | <a href="#">About</a></nav>
<main>
  <article>
    <h2>First post</h2>
    <p>Semantic tags describe what the content is.</p>
  </article>
</main>
<footer>Copyright 2026</footer>
`,
      },
      {
        level: 'Basic',
        q: 'What is the difference between block and inline elements?',
        a: 'Block elements such as div and p start on a new line and take the available width. Inline elements such as span and a sit within the text flow and take only the width they need. Width and height do not apply to ordinary inline elements.',
        code: code`
<div style="background:#dbeafe">A block element takes the full width</div>
<div style="background:#ccfbf1">So this one starts on a new line</div>
<p>This text has an <span style="background:#fde68a">inline span</span> inside it.</p>
`,
      },
      {
        level: 'Basic',
        q: 'Why does the alt attribute on images matter?',
        a: 'Screen readers read alt text aloud, and browsers show it if the image fails to load. Search engines also use it. Use an empty alt="" for decorative images so that screen readers skip them.',
      },
      {
        level: 'Intermediate',
        q: 'Build an accessible form with validation.',
        a: 'Link each label to its input using for and id. Built-in types and attributes such as email and required give validation without JavaScript. Server-side validation is still needed, because client checks can be bypassed.',
        code: code`
<form>
  <p>
    <label for="email">Email</label><br />
    <input id="email" type="email" required />
  </p>
  <p>
    <label for="age">Age</label><br />
    <input id="age" type="number" min="18" max="65" />
  </p>
  <button>Submit</button>
</form>
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between localStorage, sessionStorage and cookies?',
        a: 'localStorage stays until cleared. sessionStorage lasts for the tab session. Cookies are sent to the server with matching requests and can have an expiry and security flags such as HttpOnly. Storage is readable by JavaScript, so never put secrets there without considering XSS.',
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between the defer and async script attributes?',
        a: 'Both download the script without blocking HTML parsing. async runs the script as soon as it downloads, in any order. defer runs scripts in order after parsing finishes, so it suits scripts that use the DOM or depend on each other.',
      },
      {
        level: 'Intermediate',
        q: 'What are data-* attributes?',
        a: 'They store custom data on an element without using invalid attributes. JavaScript reads them through the dataset property, and CSS can select them.',
        code: code`
<button id="buy" data-product-id="42" data-price="999">Buy</button>
<p id="out"></p>
<script>
  const button = document.getElementById('buy');
  button.onclick = () => {
    document.getElementById('out').textContent =
      'Product ' + button.dataset.productId + ' costs ' + button.dataset.price;
  };
</script>
`,
      },
      {
        level: 'Advanced',
        q: 'What is the critical rendering path?',
        a: 'The browser parses HTML into the DOM and CSS into the CSSOM, combines them into a render tree, calculates layout, paints pixels and composites layers. Blocking CSS and scripts delay the first paint, so reducing them speeds up the page.',
      },
      {
        level: 'Advanced',
        q: 'What is ARIA, and when should you use it?',
        a: 'ARIA attributes describe roles and states to assistive technology. They do not add behaviour. The first rule is to prefer native elements, such as button rather than a clickable div, and to use ARIA only when HTML has no equivalent.',
        code: code`
<button aria-expanded="false" aria-controls="details" id="toggle">Show details</button>
<div id="details" hidden>Here are the details.</div>
<script>
  const toggle = document.getElementById('toggle');
  const details = document.getElementById('details');
  toggle.onclick = () => {
    details.hidden = !details.hidden;
    toggle.setAttribute('aria-expanded', String(!details.hidden));
  };
</script>
`,
      },
      {
        level: 'Basic',
        q: 'What is the difference between a tag, an element and an attribute?',
        a: 'A tag is the markup itself, such as <p>. An element is the full structure, including its opening tag, content and closing tag. An attribute gives extra information inside the opening tag, such as href or id.',
      },
      {
        level: 'Basic',
        q: 'What is the difference between id and class?',
        a: 'An id must be unique within the page and suits a single element, such as a link target. A class can be shared by many elements, and one element can have several classes. Classes are usually better for styling.',
        code: code`
<style>
  .note { color: #0f766e; }
  #intro { font-weight: bold; }
</style>
<p id="intro" class="note">Unique intro with a shared class</p>
<p class="note">Another element with the same class</p>
`,
      },
      {
        level: 'Basic',
        q: 'What does the viewport meta tag do?',
        a: 'It tells mobile browsers to use the device width for layout, rather than rendering a wide desktop page and shrinking it. Responsive pages should include <meta name="viewport" content="width=device-width, initial-scale=1">.',
      },
      {
        level: 'Basic',
        q: 'What do target="_blank" and rel="noopener" do on a link?',
        a: 'target="_blank" opens the link in a new tab. rel="noopener" stops the new page from accessing the original through window.opener, and modern browsers now apply it by default for _blank links. It is still common to include it explicitly.',
      },
      {
        level: 'Intermediate',
        q: 'How do you write an accessible table?',
        a: 'Use a caption for the title, thead and tbody for structure, and th with scope to identify headers. Screen readers use these relationships to announce each cell. Do not use tables for page layout.',
        code: code`
<table border="1" cellpadding="8">
  <caption>Team salaries</caption>
  <thead>
    <tr><th scope="col">Name</th><th scope="col">Salary</th></tr>
  </thead>
  <tbody>
    <tr><td>Asha</td><td>150000</td></tr>
    <tr><td>Ravi</td><td>120000</td></tr>
  </tbody>
</table>
`,
      },
      {
        level: 'Intermediate',
        q: 'How do srcset and picture help with responsive images?',
        a: 'srcset lists image files by size, and the browser downloads the best one for the screen. picture lets you choose different formats or crops using media conditions. Both save data and improve load time.',
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between SVG and canvas?',
        a: 'SVG is markup, so shapes are DOM elements that scale cleanly and can receive events. Canvas is a bitmap drawn by JavaScript and is better for many moving objects, as in games. Canvas content needs a separate accessible alternative.',
        code: code`
<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="#1e3a8a" /></svg>
<canvas id="board" width="100" height="100"></canvas>
<script>
  const context = document.getElementById('board').getContext('2d');
  context.fillStyle = '#14b8a6';
  context.fillRect(10, 10, 80, 80);
</script>
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between section, article and div?',
        a: 'article is self-contained content that could stand alone, such as a post. section is a themed part of a page and normally has a heading. div has no meaning and is used only as a generic styling or layout container.',
      },
      {
        level: 'Advanced',
        q: 'What is XSS, and how does the iframe sandbox attribute help?',
        a: 'Cross-site scripting happens when untrusted input runs as script on your page. Prevent it by encoding output and avoiding raw HTML insertion, and add a Content Security Policy. The sandbox attribute limits what framed content can do, and omitting allow-same-origin isolates it from your origin.',
      },
      {
        level: 'Advanced',
        q: 'What do loading="lazy", preload and prefetch do?',
        a: 'loading="lazy" delays offscreen images and iframes until they are near the viewport. rel="preload" fetches a resource the current page will definitely need soon. rel="prefetch" fetches something a later navigation may need, at low priority.',
      },
    ],
  },

  css: {
    name: 'CSS',
    runner: 'preview',
    fileName: 'styles.html',
    subtitle: 'Box model, specificity, Flexbox, Grid and responsive design',
    starter: code`
<style>
  .card {
    max-width: 280px;
    padding: 20px;
    border-radius: 12px;
    background: #1e3a8a;
    color: white;
    font-family: system-ui;
  }
</style>

<div class="card">Hello, CSS! Edit the style and press Run.</div>
`,
    questions: [
      {
        level: 'Basic',
        q: 'Explain the box model.',
        a: 'Every element is made of content, padding, border and margin. By default, width applies to the content only. With box-sizing: border-box, width includes padding and border, which makes layouts easier to reason about.',
        code: code`
<style>
  .box { width: 200px; padding: 20px; border: 5px solid #1e3a8a; margin-bottom: 12px; font-family: system-ui; }
  .border-box { box-sizing: border-box; }
</style>
<div class="box">content-box: 250px wide in total</div>
<div class="box border-box">border-box: 200px wide in total</div>
`,
      },
      {
        level: 'Basic',
        q: 'How does specificity decide which rule wins?',
        a: 'Inline styles beat IDs, IDs beat classes and attributes, and classes beat element selectors. If specificity is equal, the later rule wins. !important overrides normal rules, so use it rarely.',
        code: code`
<style>
  p { color: red; }
  .note { color: green; }
  #first { color: blue; }
</style>
<p id="first" class="note">The ID wins, so this is blue</p>
<p class="note">The class wins, so this is green</p>
<p>The element rule applies, so this is red</p>
`,
      },
      {
        level: 'Basic',
        q: 'What is the difference between display: none and visibility: hidden?',
        a: 'display: none removes the element from the layout, so it takes up no space. visibility: hidden makes it invisible but keeps its space.',
      },
      {
        level: 'Basic',
        q: 'Explain the position values.',
        a: 'static is the default. relative offsets an element while keeping its space. absolute removes it from the flow and positions it against its nearest positioned ancestor. fixed positions it against the viewport. sticky acts as relative until it reaches a scroll threshold.',
        code: code`
<style>
  .parent { position: relative; height: 120px; background: #e6ecf8; font-family: system-ui; }
  .badge { position: absolute; top: 8px; right: 8px; padding: 4px 8px; background: #14b8a6; color: white; }
</style>
<div class="parent">
  Parent is relative
  <span class="badge">Absolute badge</span>
</div>
`,
      },
      {
        level: 'Intermediate',
        q: 'How do you center an element with Flexbox?',
        a: 'Set display: flex on the parent. justify-content aligns along the main axis and align-items along the cross axis. display: grid with place-items: center is an equally short alternative.',
        code: code`
<style>
  .center { display: flex; justify-content: center; align-items: center; height: 200px; background: #e6ecf8; }
  .item { padding: 16px 24px; background: #1e3a8a; color: white; font-family: system-ui; }
</style>
<div class="center"><div class="item">Centered</div></div>
`,
      },
      {
        level: 'Intermediate',
        q: 'When would you use Flexbox and when Grid?',
        a: 'Flexbox lays out items along one direction and suits navbars and button rows. Grid controls rows and columns together and suits whole page layouts and card galleries. They work well together.',
        code: code`
<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; font-family: system-ui; }
  .grid div { padding: 24px; background: #ccfbf1; text-align: center; }
</style>
<div class="grid">
  <div>One</div><div>Two</div><div>Three</div><div>Four</div>
</div>
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between em, rem, % and vw?',
        a: 'em is relative to the font size of the element, so it compounds when nested. rem is relative to the root font size. % is relative to the parent for most properties. vw and vh are percentages of the viewport. rem is a reliable choice for typography.',
      },
      {
        level: 'Intermediate',
        q: 'What are pseudo-classes and pseudo-elements?',
        a: 'A pseudo-class such as :hover selects an element in a particular state. A pseudo-element such as ::before styles or inserts a specific part of an element. Pseudo-elements use two colons.',
        code: code`
<style>
  a { font-family: system-ui; color: #1e3a8a; }
  a:hover { color: #14b8a6; }
  a::before { content: "> "; }
  li:nth-child(odd) { background: #e6ecf8; }
</style>
<a href="#">Hover over this link</a>
<ul><li>One</li><li>Two</li><li>Three</li></ul>
`,
      },
      {
        level: 'Advanced',
        q: 'What is a stacking context?',
        a: 'A stacking context is a group of elements layered together. z-index only compares elements within the same context. Properties such as opacity below 1, transform and a positioned element with a z-index create a new one, which is why a large z-index sometimes appears to do nothing.',
      },
      {
        level: 'Advanced',
        q: 'Which animations perform best, and why?',
        a: 'Animating transform and opacity is usually cheapest, because browsers can often handle them on the compositor without recalculating layout. Animating width or top forces layout and paint work, which can cause jank.',
        code: code`
<style>
  .pulse { width: 80px; height: 80px; background: #1e3a8a; border-radius: 16px; animation: pulse 1.2s ease-in-out infinite alternate; }
  @keyframes pulse {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(1.3); opacity: 0.5; }
  }
</style>
<div style="padding: 30px"><div class="pulse"></div></div>
`,
      },
      {
        level: 'Basic',
        q: 'What are the CSS combinators?',
        a: 'A space selects descendants, > selects direct children, + selects the next sibling, and ~ selects all following siblings. Choosing the right one keeps selectors precise.',
        code: code`
<style>
  .box p { color: #1e3a8a; }
  .box > p { font-weight: bold; }
  h3 + p { background: #ccfbf1; }
</style>
<div class="box">
  <h3>Title</h3>
  <p>Direct child straight after the heading</p>
  <div><p>Nested descendant</p></div>
</div>
`,
      },
      {
        level: 'Basic',
        q: 'What is the difference between inline, block and inline-block?',
        a: 'inline stays in the text flow and ignores width and height. block starts on a new line and accepts dimensions. inline-block stays in the flow like inline but accepts width, height and vertical spacing.',
        code: code`
<style>
  span { background: #ccfbf1; padding: 6px; width: 120px; }
  .inline-block { display: inline-block; }
  .block { display: block; }
</style>
<span>inline</span> <span class="inline-block">inline-block</span>
<span class="block">block</span>
`,
      },
      {
        level: 'Basic',
        q: 'What does the overflow property do?',
        a: 'It controls content that does not fit its box. visible lets it spill out, hidden clips it, scroll always shows scrollbars, and auto shows them only when needed.',
        code: code`
<style>
  .small { width: 200px; height: 60px; overflow: auto; border: 1px solid #1e3a8a; padding: 8px; font-family: system-ui; }
</style>
<div class="small">This text is too long for the box, so a scrollbar appears and lets you read all of it without breaking the layout.</div>
`,
      },
      {
        level: 'Intermediate',
        q: 'What is margin collapsing?',
        a: 'Adjacent vertical margins between block elements merge into one, using the larger value rather than the sum. It does not happen in flex or grid layouts, or with horizontal margins.',
        code: code`
<style>
  .a, .b { padding: 8px; background: #e6ecf8; font-family: system-ui; }
  .a { margin-bottom: 30px; }
  .b { margin-top: 20px; }
</style>
<div class="a">The gap below is 30px</div>
<div class="b">Not 50px</div>
`,
      },
      {
        level: 'Intermediate',
        q: 'What are media queries, and what is mobile-first design?',
        a: 'Media queries apply styles under conditions such as screen width. Mobile-first means writing base styles for small screens and adding larger layouts with min-width queries, which tends to keep CSS simpler.',
        code: code`
<style>
  .cards { display: grid; gap: 10px; font-family: system-ui; }
  .cards div { padding: 20px; background: #ccfbf1; }
  @media (min-width: 500px) {
    .cards { grid-template-columns: 1fr 1fr; }
  }
</style>
<div class="cards"><div>One</div><div>Two</div></div>
`,
      },
      {
        level: 'Intermediate',
        q: 'How do CSS variables differ from preprocessor variables?',
        a: 'CSS custom properties exist at runtime, follow the cascade and can be changed with JavaScript or media queries. Sass variables are replaced at build time. Custom properties suit features such as theming.',
        code: code`
<style>
  :root { --brand: #1e3a8a; }
  .dark { --brand: #14b8a6; }
  p { color: var(--brand); font-family: system-ui; }
</style>
<p>Uses the root value</p>
<div class="dark"><p>The same rule gets an overridden value</p></div>
`,
      },
      {
        level: 'Intermediate',
        q: 'What do flex-grow, flex-shrink and flex-basis do?',
        a: 'flex-basis sets the starting size. flex-grow shares out extra space, and flex-shrink decides how items give up space when there is too little. flex: 1 is shorthand that lets items share space equally.',
        code: code`
<style>
  .row { display: flex; gap: 8px; font-family: system-ui; }
  .row div { padding: 14px; background: #e6ecf8; }
  .wide { flex: 2; }
  .normal { flex: 1; }
</style>
<div class="row"><div class="wide">flex: 2</div><div class="normal">flex: 1</div></div>
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between transitions and animations?',
        a: 'A transition animates between two states when a value changes, such as on hover. An animation uses keyframes, can have many steps, and can start by itself and repeat.',
        code: code`
<style>
  button { padding: 12px 20px; border: none; background: #1e3a8a; color: white; transition: transform 0.2s; }
  button:hover { transform: scale(1.1); }
</style>
<button>Hover over me</button>
`,
      },
      {
        level: 'Advanced',
        q: 'What is a block formatting context (BFC)?',
        a: 'A BFC is an isolated layout area. It contains its floats and stops its margins collapsing with outside elements. display: flow-root creates one with no side effects, and flex or grid items also establish their own formatting context.',
        code: code`
<style>
  .float { float: left; width: 60px; height: 60px; background: #14b8a6; }
  .wrap { background: #e6ecf8; font-family: system-ui; margin-bottom: 12px; }
  .root { display: flow-root; }
</style>
<div class="wrap root"><div class="float"></div>flow-root contains the float</div>
`,
      },
      {
        level: 'Advanced',
        q: 'What are container queries?',
        a: 'Media queries react to the viewport, while container queries react to the size of a parent container. Components can then adapt wherever they are placed. Set container-type on the parent, and use an @container rule on its descendants.',
        code: code`
<style>
  .panel { container-type: inline-size; width: 80%; font-family: system-ui; }
  .item { display: grid; gap: 8px; padding: 12px; background: #ccfbf1; }
  @container (min-width: 300px) {
    .item { grid-template-columns: 1fr 1fr; }
  }
</style>
<div class="panel"><div class="item"><span>Image</span><span>Details</span></div></div>
`,
      },
    ],
  },

  react: {
    name: 'React',
    runner: 'react',
    fileName: 'App.jsx',
    subtitle: 'Components, hooks, state and rendering',
    starter: code`
function App() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
`,
    questions: [
      {
        level: 'Basic',
        q: 'What is the difference between state and props?',
        a: 'Props are inputs passed from a parent, and the receiving component should treat them as read-only. State is data a component owns, and updating it triggers a re-render. Data usually flows down through props and events flow up through callbacks.',
        code: code`
function Greeting({ name }) {
  return <h2>Hello, {name}</h2>;
}

function App() {
  const [name, setName] = useState('Sanjeev');
  return (
    <div>
      <Greeting name={name} />
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}
`,
      },
      {
        level: 'Basic',
        q: 'What is JSX?',
        a: 'JSX is a syntax extension that looks like HTML inside JavaScript. A compiler turns it into function calls such as React.createElement. Braces embed JavaScript expressions, and attributes use names such as className.',
      },
      {
        level: 'Basic',
        q: 'Why do lists need keys?',
        a: 'Keys let React match list items between renders, so it updates only what changed and keeps each item\'s state. Use a stable ID. Using the array index can cause bugs when items are reordered or removed.',
        code: code`
function App() {
  const [skills, setSkills] = useState([
    { id: 1, name: 'Java' },
    { id: 2, name: 'SQL' },
  ]);
  return (
    <ul>
      {skills.map((skill) => (
        <li key={skill.id}>
          {skill.name}{' '}
          <button onClick={() => setSkills(skills.filter((s) => s.id !== skill.id))}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
`,
      },
      {
        level: 'Basic',
        q: 'What is the virtual DOM?',
        a: 'React keeps a lightweight description of the UI in memory. After a state change, it compares the new description with the previous one and applies only the necessary changes to the real DOM. This process is called reconciliation.',
      },
      {
        level: 'Intermediate',
        q: 'How does useEffect work, and what is its cleanup for?',
        a: 'useEffect runs after rendering to sync with outside systems such as timers, subscriptions or network requests. The dependency array controls when it runs again. The returned cleanup runs before the next effect and on unmount, which prevents leaks.',
        code: code`
function App() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return <h2>Running for {seconds} seconds</h2>;
}
`,
      },
      {
        level: 'Intermediate',
        q: 'Why use the functional form of setState?',
        a: 'State updates are batched and each render sees a snapshot of state. Calling setCount(count + 1) twice uses the same value and adds only 1. The functional form receives the latest value, so it adds 2.',
        code: code`
function App() {
  const [count, setCount] = useState(0);

  function addTwo() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }

  return <button onClick={addTwo}>Count: {count}</button>;
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What is the difference between controlled and uncontrolled inputs?',
        a: 'A controlled input takes its value from React state, which makes validation and formatting simple. An uncontrolled input keeps its value in the DOM and is read through a ref when needed.',
        code: code`
function App() {
  const [email, setEmail] = useState('');
  const fileNote = useRef(null);
  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Controlled" />
      <p>Valid: {email.includes('@') ? 'yes' : 'no'}</p>
      <input ref={fileNote} placeholder="Uncontrolled" />
      <button onClick={() => alert(fileNote.current.value)}>Read value</button>
    </div>
  );
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What is prop drilling, and how does Context help?',
        a: 'Prop drilling means passing props through components that do not use them. Context lets descendants read a value directly. Every consumer re-renders when the value changes, so it suits data such as theme or the signed-in user.',
        code: code`
const ThemeContext = createContext('light');

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <p>The current theme is {theme}</p>;
}

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Switch</button>
    </ThemeContext.Provider>
  );
}
`,
      },
      {
        level: 'Advanced',
        q: 'What is the difference between useMemo, useCallback and React.memo?',
        a: 'useMemo caches a calculated value. useCallback caches a function, so its identity stays stable. React.memo skips re-rendering a component when its props are unchanged. They add complexity, so use them where you can measure a benefit.',
        code: code`
const Child = React.memo(function Child({ onClick }) {
  console.log('Child rendered');
  return <button onClick={onClick}>Child button</button>;
});

function App() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => console.log('clicked'), []);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Parent: {count}</button>
      <Child onClick={handleClick} />
    </div>
  );
}
`,
      },
      {
        level: 'Advanced',
        q: 'Write a custom hook.',
        a: 'A custom hook is a function whose name starts with use and which calls other hooks. It shares stateful logic between components, and each component gets its own independent state.',
        code: code`
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((value) => !value), []);
  return [on, toggle];
}

function App() {
  const [open, toggleOpen] = useToggle();
  return (
    <div>
      <button onClick={toggleOpen}>{open ? 'Hide' : 'Show'}</button>
      {open && <p>Now you can see this text.</p>}
    </div>
  );
}
`,
      },
      {
        level: 'Advanced',
        q: 'What are the Rules of Hooks?',
        a: 'Call hooks only at the top level of a component or custom hook, never inside loops, conditions or nested functions. React identifies each hook by its call order, so that order must be the same on every render.',
      },
      {
        level: 'Basic',
        q: 'What is the difference between function and class components?',
        a: 'Function components use hooks for state and side effects and need less code. Class components use lifecycle methods and this. New code generally uses functions, although error boundaries still require a class.',
      },
      {
        level: 'Basic',
        q: 'How do you render content conditionally?',
        a: 'Use a ternary to choose between two outputs and && to show something or nothing. Be careful with numbers: 0 && <p /> renders 0, so write count > 0 && instead.',
        code: code`
function App() {
  const [signedIn, setSignedIn] = useState(false);
  const count = 0;
  return (
    <div>
      <p>{signedIn ? 'Welcome back' : 'Please sign in'}</p>
      {count > 0 && <p>You have {count} messages</p>}
      <button onClick={() => setSignedIn(!signedIn)}>Toggle</button>
    </div>
  );
}
`,
      },
      {
        level: 'Basic',
        q: 'What is a Fragment?',
        a: 'A component must return one parent. A Fragment groups several elements without adding an extra DOM node, which matters inside structures such as tables. <></> is the short form, and <React.Fragment key={id}> is needed for a key.',
        code: code`
function Row() {
  return (
    <>
      <td>Asha</td>
      <td>Engineering</td>
    </>
  );
}

function App() {
  return <table><tbody><tr><Row /></tr></tbody></table>;
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What does lifting state up mean?',
        a: 'When two components need the same data, move the state to their closest common parent and pass it down as props, with callbacks for changes. This keeps one source of truth.',
        code: code`
function Input({ value, onChange }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}

function App() {
  const [text, setText] = useState('hello');
  return (
    <div>
      <Input value={text} onChange={setText} />
      <p>{text.length} characters</p>
    </div>
  );
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What is useRef used for?',
        a: 'useRef holds a mutable value that survives re-renders, and changing it does not trigger a render. Common uses are accessing a DOM element and storing values such as timer IDs.',
        code: code`
function App() {
  const input = useRef(null);
  const clicks = useRef(0);
  return (
    <div>
      <input ref={input} placeholder="Click the button" />
      <button onClick={() => { clicks.current += 1; input.current.focus(); console.log(clicks.current); }}>
        Focus
      </button>
    </div>
  );
}
`,
      },
      {
        level: 'Intermediate',
        q: 'When would you use useReducer instead of useState?',
        a: 'useReducer suits state with several related values or updates that depend on an action. All update logic sits in one pure function, which makes it easier to test.',
        code: code`
function reducer(state, action) {
  switch (action.type) {
    case 'add': return { count: state.count + 1 };
    case 'reset': return { count: 0 };
    default: return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'add' })}>Add</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}
`,
      },
      {
        level: 'Intermediate',
        q: 'What causes a component to re-render?',
        a: 'A component re-renders when its state changes, when its parent re-renders or when a context it uses changes. A re-render does not always update the DOM, because React applies only the differences.',
      },
      {
        level: 'Advanced',
        q: 'What are code splitting and React.lazy?',
        a: 'Code splitting divides the bundle so users download code only when needed. React.lazy loads a component through a dynamic import, and Suspense shows a fallback while it loads. Routes are a common place to split.',
      },
      {
        level: 'Advanced',
        q: 'What are error boundaries?',
        a: 'An error boundary is a class component that catches errors thrown while rendering its children and shows a fallback. It does not catch errors in event handlers, asynchronous code or server rendering.',
        code: code`
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <p>Something went wrong.</p> : this.props.children;
  }
}

function Risky({ crash }) {
  if (crash) throw new Error('Crashed');
  return <p>All good</p>;
}

function App() {
  const [crash, setCrash] = useState(false);
  return (
    <ErrorBoundary>
      <Risky crash={crash} />
      <button onClick={() => setCrash(true)}>Break it</button>
    </ErrorBoundary>
  );
}
`,
      },
    ],
  },

  // Summaries and solutions are our own wording; `link` opens the full problem on LeetCode.
  dsa: {
    name: 'DSA',
    subtitle: 'Frequently asked LeetCode problems with Java and Python solutions',
    levels: ['All', 'Easy', 'Medium', 'Hard'],
    languages: {
      java: {
        label: 'Java',
        runner: 'java',
        fileName: 'Main.java',
        starter: code`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 1, 2};
        Arrays.sort(nums);
        System.out.println(Arrays.toString(nums));
    }
}
`,
      },
      python: {
        label: 'Python',
        runner: 'python',
        fileName: 'main.py',
        starter: code`
nums = [3, 1, 2]
print(sorted(nums))
`,
      },
    },
    questions: [
      {
        level: 'Easy',
        q: 'Two Sum (LeetCode 1)',
        link: 'https://leetcode.com/problems/two-sum/',
        a: 'Find the positions of two numbers that add up to a target. Store each number in a hash map as you go, and check whether its complement has already been seen. Time O(n), space O(n).',
        code: code`
import java.util.*;

public class Main {
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);
            if (j != null) return new int[] {j, i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9)));
    }
}
`,
        python: code`
def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []

print(two_sum([2, 7, 11, 15], 9))
`,
      },
      {
        level: 'Easy',
        q: 'Valid Parentheses (LeetCode 20)',
        link: 'https://leetcode.com/problems/valid-parentheses/',
        a: 'Check that every bracket closes in the right order. Push opening brackets onto a stack, and make sure each closing bracket matches the top. Time O(n), space O(n).',
        code: code`
import java.util.*;

public class Main {
    static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '[') stack.push(']');
            else if (c == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        System.out.println(isValid("{[()]}"));
        System.out.println(isValid("(]"));
    }
}
`,
        python: code`
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack

print(is_valid("{[()]}"))
print(is_valid("(]"))
`,
      },
      {
        level: 'Easy',
        q: 'Best Time to Buy and Sell Stock (LeetCode 121)',
        link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
        a: 'Find the largest profit from one buy followed by one later sale. Track the lowest price so far, and compare each day\'s profit against the best. Time O(n), space O(1).',
        code: code`
public class Main {
    static int maxProfit(int[] prices) {
        int lowest = Integer.MAX_VALUE, best = 0;
        for (int price : prices) {
            lowest = Math.min(lowest, price);
            best = Math.max(best, price - lowest);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxProfit(new int[] {7, 1, 5, 3, 6, 4}));
    }
}
`,
        python: code`
def max_profit(prices):
    lowest, best = float("inf"), 0
    for price in prices:
        lowest = min(lowest, price)
        best = max(best, price - lowest)
    return best

print(max_profit([7, 1, 5, 3, 6, 4]))
`,
      },
      {
        level: 'Easy',
        q: 'Contains Duplicate (LeetCode 217)',
        link: 'https://leetcode.com/problems/contains-duplicate/',
        a: 'Return whether any value appears more than once. Add values to a hash set, and stop when one is already present. Time O(n), space O(n).',
        code: code`
import java.util.*;

public class Main {
    static boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int n : nums) {
            if (!seen.add(n)) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(containsDuplicate(new int[] {1, 2, 3, 1}));
    }
}
`,
        python: code`
def contains_duplicate(nums):
    return len(set(nums)) < len(nums)

print(contains_duplicate([1, 2, 3, 1]))
`,
      },
      {
        level: 'Easy',
        q: 'Valid Anagram (LeetCode 242)',
        link: 'https://leetcode.com/problems/valid-anagram/',
        a: 'Decide whether two strings use exactly the same letters. Count the letters of one string, subtract those of the other, and check that every count is zero. Time O(n), space O(1) for a fixed alphabet.',
        code: code`
public class Main {
    static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] counts = new int[26];
        for (int i = 0; i < s.length(); i++) {
            counts[s.charAt(i) - 'a']++;
            counts[t.charAt(i) - 'a']--;
        }
        for (int c : counts) {
            if (c != 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("listen", "silent"));
    }
}
`,
        python: code`
from collections import Counter

def is_anagram(s, t):
    return Counter(s) == Counter(t)

print(is_anagram("listen", "silent"))
`,
      },
      {
        level: 'Easy',
        q: 'Reverse Linked List (LeetCode 206)',
        link: 'https://leetcode.com/problems/reverse-linked-list/',
        a: 'Reverse a singly linked list. Walk through it with a previous pointer, turning each next pointer backwards. Time O(n), space O(1).',
        code: code`
class Node {
    int val;
    Node next;
    Node(int val, Node next) { this.val = val; this.next = next; }
}

public class Main {
    static Node reverse(Node head) {
        Node prev = null;
        while (head != null) {
            Node next = head.next;
            head.next = prev;
            prev = head;
            head = next;
        }
        return prev;
    }

    public static void main(String[] args) {
        Node list = new Node(1, new Node(2, new Node(3, null)));
        for (Node n = reverse(list); n != null; n = n.next) {
            System.out.print(n.val + " ");
        }
        System.out.println();
    }
}
`,
        python: code`
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def reverse(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev

node = reverse(Node(1, Node(2, Node(3))))
while node:
    print(node.val, end=" ")
    node = node.next
print()
`,
      },
      {
        level: 'Medium',
        q: 'Maximum Subarray (LeetCode 53)',
        link: 'https://leetcode.com/problems/maximum-subarray/',
        a: 'Find the contiguous subarray with the largest sum. Kadane\'s algorithm either extends the current subarray or starts again at each number. Time O(n), space O(1).',
        code: code`
public class Main {
    static int maxSubArray(int[] nums) {
        int current = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            current = Math.max(nums[i], current + nums[i]);
            best = Math.max(best, current);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxSubArray(new int[] {-2, 1, -3, 4, -1, 2, 1, -5, 4}));
    }
}
`,
        python: code`
def max_sub_array(nums):
    current = best = nums[0]
    for n in nums[1:]:
        current = max(n, current + n)
        best = max(best, current)
    return best

print(max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4]))
`,
      },
      {
        level: 'Medium',
        q: 'Longest Substring Without Repeating Characters (LeetCode 3)',
        link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        a: 'Find the length of the longest substring with all different characters. Use a sliding window, and jump its start past the last position of a repeated character. Time O(n), space O(k) for k distinct characters.',
        code: code`
import java.util.*;

public class Main {
    static int longest(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int start = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            Integer previous = last.put(s.charAt(i), i);
            if (previous != null && previous >= start) start = previous + 1;
            best = Math.max(best, i - start + 1);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(longest("abcabcbb"));
    }
}
`,
        python: code`
def longest(s):
    last = {}
    start = best = 0
    for i, c in enumerate(s):
        if c in last and last[c] >= start:
            start = last[c] + 1
        last[c] = i
        best = max(best, i - start + 1)
    return best

print(longest("abcabcbb"))
`,
      },
      {
        level: 'Medium',
        q: '3Sum (LeetCode 15)',
        link: 'https://leetcode.com/problems/3sum/',
        a: 'Find all unique triplets that sum to zero. Sort the array, fix one number, and move two pointers inward, skipping duplicates. Time O(n²), space O(1) apart from sorting and the output.',
        code: code`
import java.util.*;

public class Main {
    static List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int lo = i + 1, hi = nums.length - 1;
            while (lo < hi) {
                int sum = nums[i] + nums[lo] + nums[hi];
                if (sum < 0) lo++;
                else if (sum > 0) hi--;
                else {
                    result.add(List.of(nums[i], nums[lo], nums[hi]));
                    lo++;
                    hi--;
                    while (lo < hi && nums[lo] == nums[lo - 1]) lo++;
                }
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(threeSum(new int[] {-1, 0, 1, 2, -1, -4}));
    }
}
`,
        python: code`
def three_sum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        lo, hi = i + 1, len(nums) - 1
        while lo < hi:
            total = nums[i] + nums[lo] + nums[hi]
            if total < 0:
                lo += 1
            elif total > 0:
                hi -= 1
            else:
                result.append([nums[i], nums[lo], nums[hi]])
                lo += 1
                hi -= 1
                while lo < hi and nums[lo] == nums[lo - 1]:
                    lo += 1
    return result

print(three_sum([-1, 0, 1, 2, -1, -4]))
`,
      },
      {
        level: 'Medium',
        q: 'Group Anagrams (LeetCode 49)',
        link: 'https://leetcode.com/problems/group-anagrams/',
        a: 'Group words that are anagrams of each other. Words with the same sorted letters share a key in a hash map. Time O(n · k log k) for n words of length k, space O(n · k).',
        code: code`
import java.util.*;

public class Main {
    static Collection<List<String>> group(String[] words) {
        Map<String, List<String>> groups = new TreeMap<>();
        for (String word : words) {
            char[] letters = word.toCharArray();
            Arrays.sort(letters);
            groups.computeIfAbsent(new String(letters), k -> new ArrayList<>()).add(word);
        }
        return groups.values();
    }

    public static void main(String[] args) {
        System.out.println(group(new String[] {"eat", "tea", "tan", "ate", "nat", "bat"}));
    }
}
`,
        python: code`
from collections import defaultdict

def group(words):
    groups = defaultdict(list)
    for word in words:
        groups["".join(sorted(word))].append(word)
    return list(groups.values())

print(group(["eat", "tea", "tan", "ate", "nat", "bat"]))
`,
      },
      {
        level: 'Medium',
        q: 'Product of Array Except Self (LeetCode 238)',
        link: 'https://leetcode.com/problems/product-of-array-except-self/',
        a: 'For each position, compute the product of all other numbers without using division. Multiply a running product from the left with one from the right. Time O(n), space O(1) apart from the output.',
        code: code`
import java.util.*;

public class Main {
    static int[] product(int[] nums) {
        int[] result = new int[nums.length];
        int left = 1;
        for (int i = 0; i < nums.length; i++) {
            result[i] = left;
            left *= nums[i];
        }
        int right = 1;
        for (int i = nums.length - 1; i >= 0; i--) {
            result[i] *= right;
            right *= nums[i];
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(product(new int[] {1, 2, 3, 4})));
    }
}
`,
        python: code`
def product(nums):
    result = [1] * len(nums)
    left = 1
    for i, n in enumerate(nums):
        result[i] = left
        left *= n
    right = 1
    for i in range(len(nums) - 1, -1, -1):
        result[i] *= right
        right *= nums[i]
    return result

print(product([1, 2, 3, 4]))
`,
      },
      {
        level: 'Medium',
        q: 'Merge Intervals (LeetCode 56)',
        link: 'https://leetcode.com/problems/merge-intervals/',
        a: 'Combine all overlapping intervals. Sort by start, then either extend the last merged interval or begin a new one. Time O(n log n), space O(n).',
        code: code`
import java.util.*;

public class Main {
    static List<int[]> merge(int[][] intervals) {
        Arrays.sort(intervals, Comparator.comparingInt(i -> i[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] interval : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < interval[0]) {
                merged.add(interval);
            } else {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], interval[1]);
            }
        }
        return merged;
    }

    public static void main(String[] args) {
        for (int[] i : merge(new int[][] {{1, 3}, {2, 6}, {8, 10}, {15, 18}})) {
            System.out.println(Arrays.toString(i));
        }
    }
}
`,
        python: code`
def merge(intervals):
    merged = []
    for start, end in sorted(intervals):
        if merged and merged[-1][1] >= start:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

print(merge([[1, 3], [2, 6], [8, 10], [15, 18]]))
`,
      },
      {
        level: 'Medium',
        q: 'Number of Islands (LeetCode 200)',
        link: 'https://leetcode.com/problems/number-of-islands/',
        a: 'Count groups of connected land cells in a grid. When you find land, count it and flood fill the whole island with DFS so it is not counted again. Time O(rows × columns), and DFS can use the same amount of space in the worst case.',
        code: code`
public class Main {
    static int count(char[][] grid) {
        int islands = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    islands++;
                    sink(grid, r, c);
                }
            }
        }
        return islands;
    }

    static void sink(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';
        sink(grid, r + 1, c);
        sink(grid, r - 1, c);
        sink(grid, r, c + 1);
        sink(grid, r, c - 1);
    }

    public static void main(String[] args) {
        char[][] grid = { "11000".toCharArray(), "11000".toCharArray(), "00100".toCharArray(), "00011".toCharArray() };
        System.out.println(count(grid));
    }
}
`,
        python: code`
def count(grid):
    def sink(r, c):
        if 0 <= r < len(grid) and 0 <= c < len(grid[0]) and grid[r][c] == "1":
            grid[r][c] = "0"
            sink(r + 1, c)
            sink(r - 1, c)
            sink(r, c + 1)
            sink(r, c - 1)

    islands = 0
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] == "1":
                islands += 1
                sink(r, c)
    return islands

print(count([list("11000"), list("11000"), list("00100"), list("00011")]))
`,
      },
      {
        level: 'Medium',
        q: 'Search in Rotated Sorted Array (LeetCode 33)',
        link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
        a: 'Find a target in a sorted array that has been rotated. In binary search, one half is always sorted, so check whether the target lies inside that half. Time O(log n), space O(1).',
        code: code`
public class Main {
    static int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(search(new int[] {4, 5, 6, 7, 0, 1, 2}, 0));
    }
}
`,
        python: code`
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1

print(search([4, 5, 6, 7, 0, 1, 2], 0))
`,
      },
      {
        level: 'Medium',
        q: 'Coin Change (LeetCode 322)',
        link: 'https://leetcode.com/problems/coin-change/',
        a: 'Find the fewest coins that make an amount, or -1 if it cannot be made. Dynamic programming builds the best answer for every amount up to the target. Time O(amount × coins), space O(amount).',
        code: code`
import java.util.*;

public class Main {
    static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int value = 1; value <= amount; value++) {
            for (int coin : coins) {
                if (coin <= value) dp[value] = Math.min(dp[value], dp[value - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }

    public static void main(String[] args) {
        System.out.println(coinChange(new int[] {1, 2, 5}, 11));
    }
}
`,
        python: code`
def coin_change(coins, amount):
    dp = [0] + [amount + 1] * amount
    for value in range(1, amount + 1):
        for coin in coins:
            if coin <= value:
                dp[value] = min(dp[value], dp[value - coin] + 1)
    return -1 if dp[amount] > amount else dp[amount]

print(coin_change([1, 2, 5], 11))
`,
      },
      {
        level: 'Medium',
        q: 'LRU Cache (LeetCode 146)',
        link: 'https://leetcode.com/problems/lru-cache/',
        a: 'Build a fixed-size cache that removes the least recently used item, with O(1) get and put. A hash map combined with a doubly linked list provides this, and Java\'s LinkedHashMap and Python\'s OrderedDict already combine them. In an interview, be ready to build the linked list yourself.',
        code: code`
import java.util.*;

class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int capacity;

    LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    int read(int key) { return getOrDefault(key, -1); }

    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}

public class Main {
    public static void main(String[] args) {
        LRUCache cache = new LRUCache(2);
        cache.put(1, 1);
        cache.put(2, 2);
        cache.read(1);
        cache.put(3, 3);
        System.out.println(cache.read(2));
        System.out.println(cache.read(1));
    }
}
`,
        python: code`
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.items = OrderedDict()

    def get(self, key):
        if key not in self.items:
            return -1
        self.items.move_to_end(key)
        return self.items[key]

    def put(self, key, value):
        self.items[key] = value
        self.items.move_to_end(key)
        if len(self.items) > self.capacity:
            self.items.popitem(last=False)

cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
cache.get(1)
cache.put(3, 3)
print(cache.get(2))
print(cache.get(1))
`,
      },
      {
        level: 'Hard',
        q: 'Trapping Rain Water (LeetCode 42)',
        link: 'https://leetcode.com/problems/trapping-rain-water/',
        a: 'Work out how much water bars of different heights can hold. Move two pointers inward, always processing the side with the lower wall, because that wall limits the water level. Time O(n), space O(1).',
        code: code`
public class Main {
    static int trap(int[] height) {
        int lo = 0, hi = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (lo < hi) {
            if (height[lo] < height[hi]) {
                leftMax = Math.max(leftMax, height[lo]);
                water += leftMax - height[lo++];
            } else {
                rightMax = Math.max(rightMax, height[hi]);
                water += rightMax - height[hi--];
            }
        }
        return water;
    }

    public static void main(String[] args) {
        System.out.println(trap(new int[] {0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}));
    }
}
`,
        python: code`
def trap(height):
    lo, hi = 0, len(height) - 1
    left_max = right_max = water = 0
    while lo < hi:
        if height[lo] < height[hi]:
            left_max = max(left_max, height[lo])
            water += left_max - height[lo]
            lo += 1
        else:
            right_max = max(right_max, height[hi])
            water += right_max - height[hi]
            hi -= 1
    return water

print(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))
`,
      },
      {
        level: 'Hard',
        q: 'Minimum Window Substring (LeetCode 76)',
        link: 'https://leetcode.com/problems/minimum-window-substring/',
        a: 'Find the shortest part of one string that contains all characters of another, including repeats. Expand a sliding window until it qualifies, then shrink it from the left while it still does. Time O(n + m), space O(k) for k distinct characters.',
        code: code`
import java.util.*;

public class Main {
    static String minWindow(String s, String t) {
        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
        int missing = t.length(), start = 0, bestStart = 0, bestLength = Integer.MAX_VALUE;
        for (int end = 0; end < s.length(); end++) {
            char c = s.charAt(end);
            if (need.containsKey(c)) {
                if (need.get(c) > 0) missing--;
                need.merge(c, -1, Integer::sum);
            }
            while (missing == 0) {
                if (end - start + 1 < bestLength) {
                    bestStart = start;
                    bestLength = end - start + 1;
                }
                char left = s.charAt(start++);
                if (need.containsKey(left)) {
                    need.merge(left, 1, Integer::sum);
                    if (need.get(left) > 0) missing++;
                }
            }
        }
        return bestLength == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLength);
    }

    public static void main(String[] args) {
        System.out.println(minWindow("ADOBECODEBANC", "ABC"));
    }
}
`,
        python: code`
from collections import Counter

def min_window(s, t):
    need = Counter(t)
    missing = len(t)
    start = 0
    best = ""
    for end, c in enumerate(s):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1
        while missing == 0:
            if not best or end - start + 1 < len(best):
                best = s[start:end + 1]
            need[s[start]] += 1
            if need[s[start]] > 0:
                missing += 1
            start += 1
    return best

print(min_window("ADOBECODEBANC", "ABC"))
`,
      },
      {
        level: 'Easy',
        q: 'Sock Merchant (HackerRank)',
        link: 'https://www.hackerrank.com/challenges/sock-merchant/problem',
        a: 'Count how many matching pairs can be made from a list of sock colours. Count each colour in a hash map, then add count / 2 for each one. Time O(n), space O(n).',
        code: code`
import java.util.*;

public class Main {
    static int pairs(int[] socks) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int sock : socks) counts.merge(sock, 1, Integer::sum);
        int total = 0;
        for (int count : counts.values()) total += count / 2;
        return total;
    }

    public static void main(String[] args) {
        System.out.println(pairs(new int[] {10, 20, 20, 10, 10, 30, 50, 10, 20}));
    }
}
`,
        python: code`
from collections import Counter

def pairs(socks):
    return sum(count // 2 for count in Counter(socks).values())

print(pairs([10, 20, 20, 10, 10, 30, 50, 10, 20]))
`,
      },
      {
        level: 'Easy',
        q: 'Counting Valleys (HackerRank)',
        link: 'https://www.hackerrank.com/challenges/counting-valleys/problem',
        a: 'Given up and down steps starting at sea level, count the valleys entered. Track the altitude, and count each time a step up returns you to sea level. Time O(n), space O(1).',
        code: code`
public class Main {
    static int valleys(String path) {
        int level = 0, count = 0;
        for (char step : path.toCharArray()) {
            level += step == 'U' ? 1 : -1;
            if (level == 0 && step == 'U') count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(valleys("UDDDUDUU"));
    }
}
`,
        python: code`
def valleys(path):
    level = count = 0
    for step in path:
        level += 1 if step == "U" else -1
        if level == 0 and step == "U":
            count += 1
    return count

print(valleys("UDDDUDUU"))
`,
      },
      {
        level: 'Easy',
        q: 'Repeated String (HackerRank)',
        link: 'https://www.hackerrank.com/challenges/repeated-string/problem',
        a: 'Count the letter a in the first n characters of an endlessly repeated string. Multiply the count in one copy by the number of full copies, and add the count in the remaining prefix. Use a 64-bit integer. Time O(length), space O(1).',
        code: code`
public class Main {
    static long countA(String s, long n) {
        long inOne = s.chars().filter(c -> c == 'a').count();
        int remainder = (int) (n % s.length());
        long inRest = s.substring(0, remainder).chars().filter(c -> c == 'a').count();
        return inOne * (n / s.length()) + inRest;
    }

    public static void main(String[] args) {
        System.out.println(countA("aba", 10));
    }
}
`,
        python: code`
def count_a(s, n):
    full, remainder = divmod(n, len(s))
    return s.count("a") * full + s[:remainder].count("a")

print(count_a("aba", 10))
`,
      },
      {
        level: 'Easy',
        q: '2D Array - DS (HackerRank)',
        link: 'https://www.hackerrank.com/challenges/2d-array/problem',
        a: 'Find the largest hourglass sum in a 6 × 6 grid, where an hourglass is three cells on top, one in the middle and three below. Try every top-left position. Because values can be negative, start the best value at the first sum rather than 0.',
        code: code`
public class Main {
    static int best(int[][] g) {
        int best = Integer.MIN_VALUE;
        for (int r = 0; r < 4; r++) {
            for (int c = 0; c < 4; c++) {
                int sum = g[r][c] + g[r][c + 1] + g[r][c + 2] + g[r + 1][c + 1]
                        + g[r + 2][c] + g[r + 2][c + 1] + g[r + 2][c + 2];
                best = Math.max(best, sum);
            }
        }
        return best;
    }

    public static void main(String[] args) {
        int[][] grid = {
            {1, 1, 1, 0, 0, 0}, {0, 1, 0, 0, 0, 0}, {1, 1, 1, 0, 0, 0},
            {0, 0, 2, 4, 4, 0}, {0, 0, 0, 2, 0, 0}, {0, 0, 1, 2, 4, 0},
        };
        System.out.println(best(grid));
    }
}
`,
        python: code`
def best(g):
    return max(
        sum(g[r][c:c + 3]) + g[r + 1][c + 1] + sum(g[r + 2][c:c + 3])
        for r in range(4)
        for c in range(4)
    )

grid = [
    [1, 1, 1, 0, 0, 0], [0, 1, 0, 0, 0, 0], [1, 1, 1, 0, 0, 0],
    [0, 0, 2, 4, 4, 0], [0, 0, 0, 2, 0, 0], [0, 0, 1, 2, 4, 0],
]
print(best(grid))
`,
      },
      {
        level: 'Easy',
        q: 'Left Rotation (HackerRank)',
        link: 'https://www.hackerrank.com/challenges/array-left-rotation/problem',
        a: 'Rotate an array left by d positions. Each element moves to (i - d) modulo n, or equivalently the output at i comes from (i + d) modulo n. Time O(n), space O(n).',
        code: code`
import java.util.*;

public class Main {
    static int[] rotate(int[] a, int d) {
        int[] result = new int[a.length];
        for (int i = 0; i < a.length; i++) {
            result[i] = a[(i + d) % a.length];
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(rotate(new int[] {1, 2, 3, 4, 5}, 2)));
    }
}
`,
        python: code`
def rotate(a, d):
    d %= len(a)
    return a[d:] + a[:d]

print(rotate([1, 2, 3, 4, 5], 2))
`,
      },
      {
        level: 'Medium',
        q: 'Minimum Swaps 2 (HackerRank)',
        link: 'https://www.hackerrank.com/challenges/minimum-swaps-2/problem',
        a: 'Find the fewest swaps to sort a permutation of 1 to n. Whenever a position holds the wrong value, swap that value straight into its correct place. Each swap fixes at least one value. Time O(n), space O(1).',
        code: code`
public class Main {
    static int minSwaps(int[] a) {
        int swaps = 0;
        for (int i = 0; i < a.length; ) {
            if (a[i] == i + 1) {
                i++;
            } else {
                int target = a[i] - 1;
                int held = a[target];
                a[target] = a[i];
                a[i] = held;
                swaps++;
            }
        }
        return swaps;
    }

    public static void main(String[] args) {
        System.out.println(minSwaps(new int[] {4, 3, 1, 2}));
    }
}
`,
        python: code`
def min_swaps(a):
    swaps = i = 0
    while i < len(a):
        if a[i] == i + 1:
            i += 1
        else:
            target = a[i] - 1
            a[i], a[target] = a[target], a[i]
            swaps += 1
    return swaps

print(min_swaps([4, 3, 1, 2]))
`,
      },
      {
        level: 'Medium',
        q: 'New Year Chaos (HackerRank)',
        link: 'https://www.hackerrank.com/challenges/new-year-chaos/problem',
        a: 'A person may bribe to move up at most two places. Find the total bribes or report that the queue is too chaotic. A person more than two ahead of their original place is invalid. Otherwise, count larger values in front of them, looking back no further than one position ahead of their original place. Time O(n), space O(1).',
        code: code`
public class Main {
    static String bribes(int[] q) {
        int total = 0;
        for (int i = 0; i < q.length; i++) {
            if (q[i] - (i + 1) > 2) return "Too chaotic";
            for (int j = Math.max(0, q[i] - 2); j < i; j++) {
                if (q[j] > q[i]) total++;
            }
        }
        return String.valueOf(total);
    }

    public static void main(String[] args) {
        System.out.println(bribes(new int[] {2, 1, 5, 3, 4}));
        System.out.println(bribes(new int[] {2, 5, 1, 3, 4}));
    }
}
`,
        python: code`
def bribes(q):
    total = 0
    for i, person in enumerate(q):
        if person - (i + 1) > 2:
            return "Too chaotic"
        for j in range(max(0, person - 2), i):
            if q[j] > person:
                total += 1
    return total

print(bribes([2, 1, 5, 3, 4]))
print(bribes([2, 5, 1, 3, 4]))
`,
      },
    ],
  },
};

// Easiest first, so questions added later still appear in a sensible order
const LEVEL_ORDER = ['Basic', 'Easy', 'Intermediate', 'Medium', 'Advanced', 'Hard'];
Object.values(TOPICS).forEach((topic) => {
  topic.questions.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
});

export const LEVELS = ['All', 'Basic', 'Intermediate', 'Advanced'];
