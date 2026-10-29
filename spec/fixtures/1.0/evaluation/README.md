# evaluation

These cases protect a client from computing different values than other clients for the same program: how statements are classified, how references resolve, how operators coerce, and how built-in and custom functions behave. They cover [language.md sections 2.1, 2.3, and 2.4](../../../language.md#2-program-model) and [section 3](../../../language.md#3-evaluation). Numbers 002, 007, and 009 are not used.

| Case | What it checks | Spec |
| --- | --- | --- |
| 001-kind-classify | A Query inline in a computed expression is null with no error, a state default and an `Action` statement work by reference, the unused Text is an orphan, and the query statement `data` is not. | [2.1](../../../language.md#21-statement-kinds), [2.3](../../../language.md#23-references-and-hoisting) |
| 003-ref-cycle | `a` contains `b`, which contains `a`: the reference that closes the cycle is unresolved and left out of `b`'s children. | [2.3](../../../language.md#23-references-and-hoisting) |
| 004-duplicate-later-wins | `t` is defined twice: the later "second" renders. | [2.4](../../../language.md#24-duplicate-names) |
| 005-op-coerce-values | `toNumber` coercion, loose equality, `+` joining strings with null as "", division and modulo by 0 giving 0, `&&` and `||` returning the deciding operand, and unary operators on strings; the undeclared `$u` reads as null. | [3.1](../../../language.md#31-values-and-coercion), [3.2](../../../language.md#32-operators) |
| 006-member-pluck-and-null | `rows.name` plucks from every element (null where missing), `.length` counts, indexing reads arrays and objects, and member access or indexing with null gives null. | [3.3](../../../language.md#33-member-access-and-pluck) |
| 008-builtin-sort-locale | @Sort uses locale collation for strings (a, b, B, é, Z), compares numeric strings as numbers, sorts by field descending, returns a non-array unchanged, and sorts null as "". | [3.4](../../../language.md#34-built-in-functions) |
| 010-function-registered | The custom function @Upper runs ("HI"), and `@Count([1, 2]) + ""` gives "2". | [3.6](../../../language.md#36-custom-functions) |
| 011-function-null-required-arg | @Upper given an unset `$variable` or an unresolved reference evaluates to null with no error, so the prop is left out. | [3.6](../../../language.md#36-custom-functions) |
| 012-kind-query-dollar-name | `$items = Query(...)` is a query statement, and `$items.rows` reads the state store, not the result, so @Count gives 0 with no error. | [2.1](../../../language.md#21-statement-kinds) |
