---
"@openuidev/lang-core": minor
---

An expression state default (`$total = 1 + 2`) is evaluated once when the program is parsed, so the store starts with its value instead of the expression's syntax tree. It reads the defaults of states declared before it; query results read as null. Expressions inside a list or object default are evaluated too. A default that calls a library function, an action or a component is null, since those run only in the client.
