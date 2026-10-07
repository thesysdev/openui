# The OpenUI Language

**1.0**

The exact rules of OpenUI Lang. For a guided tour, read [overview.md](./overview.md). [prompt.md](./prompt.md) covers the LibrarySpec, the prompt, and stored responses. MUST, MUST NOT, SHOULD, and MAY are used as in RFC 2119.

The **generator** writes OpenUI Lang (in practice, a model). The **client** parses and renders it. The **host** is the app that embeds the client.

Each normative subsection ends with a "Fixtures:" line naming the conformance cases that check it (Appendix B).

## 1. Grammar

### 1.1 Notation

The grammar uses EBNF: `=` defines, `|` separates alternatives, `[ ]` is optional, `{ }` repeats zero or more times, `( )` groups, and terminals are in double quotes. The full grammar is in section 1.6.

### 1.2 Source text

The host removes its `]]>openui:` marker lines before passing text to the client ([prompt.md](./prompt.md), section 7). The client then prepares the text in this order:

1. **Fence extraction.** A fence opens only with three backticks at the start of a line, with or without a language tag. If the text has fences, the client joins the contents of every fence with newlines. Text outside fences is prose and is ignored. Quotes in prose outside fences do not shield anything. Inside a fence, backtick runs inside double-quoted strings do not close it. Single-quoted strings do not shield them. Comments are stripped after extraction, so backtick runs inside comments do count. An unterminated fence runs to the end of the text.
2. **Comment stripping.** `//` and `#` start a comment that runs to the end of the line. Comment markers inside strings, even multi-line ones, are not comments.
3. **Trimming.** Leading and trailing whitespace is removed.

Fixtures: `grammar/*-fence-*`, `grammar/*-comment-*`

### 1.3 Lexical elements

#### Identifiers

Identifiers match `[a-zA-Z_][a-zA-Z0-9_]*`. An uppercase first letter makes a component name. A lowercase letter or `_` makes a reference.

```ebnf
identifier    = ( letter | "_" ) { letter | digit | "_" } ;
state_name    = "$" identifier ;
function_name = "@" identifier ;
```

`$name` is a state variable, and the `$` is part of the name. `@name` calls a built-in, a custom function, or an action step. Clients MUST NOT give `$` and `@` other meanings.

#### Keywords

The only keywords are `true`, `false`, and `null`.

#### Reserved names

| Group | Names |
| --- | --- |
| Keyword literals | `true`, `false`, `null` |
| Reserved call forms | `Query`, `Mutation`, `Action` |
| Built-in functions | `@Count`, `@First`, `@Last`, `@Take`, `@Sum`, `@Avg`, `@Min`, `@Max`, `@Filter`, `@Sort`, `@Round`, `@Abs`, `@Floor`, `@Ceil`, `@Each` |
| Action steps | `@Set`, `@Reset`, `@Run`, `@ToAssistant`, `@OpenUrl` |
| State prefix | every `$name` |

`Query` and `Mutation` are statement forms. `Action` is an expression form (section 2.1). None of them is a component.

Library components, functions (section 3.6), and actions (section 6.3) MUST NOT use any name in this table. New built-in names are reserved when they are added ([prompt.md](./prompt.md), section 3).

#### Operators and punctuation

```text
=  ==  !=  ===  !==  >  <  >=  <=  +  -  *  /  %  &&  ||  !  ?  :  .  ,  (  )  [  ]  {  }
```

`===` and `!==` mean exactly `==` and `!=`. A single `&` or `|` means `&&` or `||`.

#### String literals

Strings are double-quoted or single-quoted. Double-quoted strings use JSON escapes (`\n`, `\t`, `\"`, `\\`, `\uXXXX`). Single-quoted strings support only `\'`, `\\`, `\n`, and `\t`. Any other escaped character is kept as is. An unterminated string at the end of a streaming buffer is closed implicitly (section 4).

#### Number literals

Numbers match `-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?`.

- An `e` or `E` after the digits is always an exponent marker, even with no digits after it. That token is not a usable number.
- A `.` is part of a number only when a digit follows. `1.` is `1` followed by member access.
- A `-` starts a number only when a digit follows and the previous token is not a value (a literal, reference, call, `)`, or `]`, but not `}`). Otherwise it is subtraction or negation. So `[1 -2]` is one element, `1 - 2`.

#### Whitespace and other characters

Spaces and tabs separate tokens. The `newline` token is `\n`, and a `\r` before it is consumed with it. A newline ends a statement only at bracket depth zero (section 1.4). A character that matches no rule is skipped: `a;b` lexes as `a` and `b`. Lexing never fails.

Fixtures: `grammar/*-lex-*`

### 1.4 Statements

A statement is `name = expression` (section 1.6). The name is a reference, component, or state name. A line without this shape is skipped without an error.

A statement continues past a newline when:

1. the newline is inside an unclosed `(`, `[`, or `{`;
2. the newline is inside an unterminated string (strings may hold raw newlines); or
3. a ternary is open at bracket depth zero, or the next line's first non-whitespace token is `?`. A ternary is **open** from its `?` until the first complete operand after its matching `:`. A newline while either branch is still empty continues the statement.

```openui-lang
status = $count > 0
  ? "Has items"
  : "Empty"
```

The batch parser, the streaming parser, and the edit merge (section 7) MUST agree on these boundaries byte for byte. Rule 3 looks at the next line, so a boundary is provisional while streaming (section 4, rule 1).

Fixtures: `grammar/*-statement-*`

### 1.5 Expressions

#### Operands

Object keys may be names, strings, numbers, component names, or `$` names (the `$` is dropped). All keys are strings. Any other token is read as the key `?`.

A bare identifier in operand position is a reference, whatever its case. Only the call head makes an uppercase identifier a component.

Inside an expression, `$name = expression` parses as a binding assignment, used by the runtime for two-way binding. Generators SHOULD NOT write it.

#### Calls

A call is a component name or an `@` name followed by `( arguments )`.

- Arguments are positional. `null` skips an optional argument.
- Commas between arguments, array elements, and object entries are optional. Trailing commas are ignored.
- The name after `@` is uppercase by convention, but either case parses.
- Built-ins and custom functions need the `@`. `Count(x)` parses as the reference `Count`, and the arguments are lost. Only `Action([...])` works with or without `@`.

#### Member access and indexing

`a.field` and `a[expression]` follow any primary. A field accepts the same tokens as an object key. After `.`, a run of digits is an integer field or index, not a decimal number, so `m.0.1` is `m[0][1]`. A member access is never callable: `foo.bar(x)` is not a call.

#### Operators and precedence

From lowest to highest. Binary operators are left-associative.

1. `? :` (ternary, right-associative)
2. `||`
3. `&&`
4. `==` `!=` `===` `!==`
5. `>` `<` `>=` `<=`
6. `+` `-`
7. `*` `/` `%`
8. unary `!` and `-` (they stack: `!!x` is valid)
9. postfix: member access and indexing (calls are primary forms)

Fixtures: `grammar/*-expr-*`, `grammar/*-member-digits-*`

### 1.6 Complete grammar

```ebnf
program        = statement { newline statement } ;
statement      = ( identifier | state_name ) "=" expression ;
expression     = ternary ;
ternary        = or [ "?" ternary ":" ternary ] ;
or             = and { "||" and } ;
and            = equality { "&&" equality } ;
equality       = comparison { ( "==" | "!=" | "===" | "!==" ) comparison } ;
comparison     = additive { ( ">" | "<" | ">=" | "<=" ) additive } ;
additive       = multiplicative { ( "+" | "-" ) multiplicative } ;
multiplicative = unary { ( "*" | "/" | "%" ) unary } ;
unary          = { "!" | "-" } postfix ;
postfix        = primary { "." field | "[" expression "]" } ;
primary        = literal | array | object | call | reference
               | "(" expression ")" ;
call           = ( ComponentName | function_name ) "(" [ arguments ] ")" ;
arguments      = expression { [ "," ] expression } ;
array          = "[" [ arguments ] "]" ;
object         = "{" [ key ":" expression { [ "," ] key ":" expression } ] "}" ;
literal        = string | number | "true" | "false" | "null" ;
reference      = identifier | state_name ;
```

Tokens and the token sets for `key` and `field` are in sections 1.3 and 1.5.

Implementation-defined in 1.0, and untested: trailing tokens after a complete expression in one statement, the value of a number with a dangling exponent, a partly received unicode escape under implicit closing, and whether an unchanged query fetches again after a merge.

Fixtures: `grammar/`

## 2. Program model

### 2.1 Statement kinds

Each statement is classified in this order:

1. `Query(...)` as the whole right side: a **query statement**.
2. `Mutation(...)` as the whole right side: a **mutation statement**.
3. A `$` name on the left: a **state declaration**. The right side is its default.
4. Anything else: a **value statement**.

So `$x = Query(...)` is a query statement with the id `$x`, and it runs. But `$x` in an expression reads the state store and never sees the result. The client reports the non-fatal `state-query` diagnostic with the hint "name queries without `$`: `x = Query(...)`". The same goes for `$x = Mutation(...)`.

- A **value position** is a direct argument of a component call or a direct element of an array literal, before any operator applies.
- A **computed expression** is any other context: an operand, a ternary branch, an object value.

`Query` and `Mutation` are valid only as the whole right side. In a value position they report `inline-reserved` and evaluate to nothing. In a computed expression they evaluate to null with no error. `Action(...)` is an ordinary expression. It may appear inline or be bound to a statement.

Fixtures: `evaluation/*-kind-*`, `errors/*-state-query-*`

### 2.2 Entry

The entry is the statement named `root`. Its value must evaluate to a component: a component call, a reference to a statement whose value is one, or any expression that gives one. For example, `root = $t ? A : B` is a valid entry when `A` and `B` are component statements. When the value is not a component, the client reports a fatal `no-root` at stream end with the hint "root must be a component call", with no fallback.

With no `root` statement, if the first statement calls the library's root component (the LibrarySpec `root` field, [prompt.md](./prompt.md), section 2.2), it is the entry. It renders with a non-fatal `no-root`.

```openui-lang
page = Card([title, table])
title = Header("Orders")
```

If the library's root is `Card`, this renders with a non-fatal `no-root`. If `title` came first, nothing would render.

In every other case, at stream end the client reports a fatal `no-root` and nothing renders. If the library has no `root` field, only a `root` statement is an entry. While streaming, a missing entry is not an error.

Fixtures: `entry/`, including `entry/*-ternary-*`

### 2.3 References and hoisting

A bare name refers to the statement with that name, wherever it is in the program.

- A reference to a missing statement is **unresolved**. It goes into the parse metadata, not the error list.
- An unresolved reference is null in an expression and renders nothing in a component position. As a direct element of an array it is left out, in value positions and computed expressions alike, so `@Count([a, b])` with `b` unresolved is 1. While streaming, clients SHOULD NOT report required-prop errors caused only by unresolved references. At stream end, section 8.4 applies.
- A reference that closes a cycle is unresolved at that point.
- A statement referenced from two places is evaluated separately at each. Only the tree is copied: the state store is shared, and a query referenced twice fetches once, with both places reading the same result.
- References to query or mutation statements resolve to their results (section 6).

Value statements the entry cannot reach are **orphans**. They go into the parse metadata and are not rendered. State, query, and mutation statements are never orphans, and a query runs whether or not the entry reaches it.

Fixtures: `evaluation/*-ref-*`, including `evaluation/*-ref-array-*`

### 2.4 Duplicate names

If two statements bind the same name, the later one wins, whatever their kinds. While streaming, a pending statement that needed implicit closing never replaces a completed one (section 4, rule 3). At stream end a final redefinition wins.

Fixtures: `evaluation/*-duplicate-*`

## 3. Evaluation

### 3.1 Values and coercion

Values are strings, numbers, booleans, null, arrays, objects, and component instances.

Arithmetic and comparisons convert with `toNumber`: a number is itself, a string is parsed as a number or else 0 (NaN never appears), `true` is 1, and everything else is 0.

Truthiness follows JavaScript ToBoolean. Arrays, objects, and component instances are truthy. In an expression, a component instance acts like an object: `toNumber` gives 0 and member access gives null.

String-to-number parsing, loose equality, and number-to-string formatting follow ECMA-262 ToNumber, IsLooselyEqual, and Number::toString. Clients in other languages MUST reproduce them.

Fixtures: `evaluation/*-coerce-*`

### 3.2 Operators

- `+`: if either side is a string, it joins strings, and null becomes `""`. Otherwise it adds with `toNumber`.
- `-`, `*`, `/`, `%`: numeric with `toNumber`. A divisor of 0 gives 0.
- `==`, `!=`, `===`, `!==`: loose equality per IsLooselyEqual. `5 === "5"` is true.
- `>`, `<`, `>=`, `<=`: both sides with `toNumber`.
- `&&`, `||`: short-circuit and return the deciding operand.
- `!` negates truthiness. Unary `-` negates `toNumber` of its operand.
- `cond ? a : b` chooses by the truthiness of `cond`.

In a component position, null renders nothing, and strings, numbers, and booleans render as text.

Fixtures: `evaluation/*-op-*`

### 3.3 Member access and pluck

- `a.b` on an object reads the field.
- `a.b` on an array plucks: `b` from every element, null where it is missing.
- `.length` on an array is its element count.
- Member access on null is null.
- `a[i]` indexes arrays by number and objects by string key. A null object or index gives null.

Fixtures: `evaluation/*-member-*`

### 3.4 Built-in functions

| Built-in | Signature | Meaning |
| --- | --- | --- |
| `@Count` | `(array) → number` | Element count. 0 for non-arrays. |
| `@First`, `@Last` | `(array) → value` | First or last element. Null for empty arrays and non-arrays. |
| `@Take` | `(array, n) → array` | The first `n` elements. `n` goes through `toNumber` and is floored. `n <= 0` or a non-array gives `[]`. |
| `@Sum` | `(array) → number` | Sum with `toNumber`. 0 for non-arrays. |
| `@Avg` | `(array) → number` | Mean with `toNumber`. 0 for empty arrays and non-arrays. |
| `@Min`, `@Max` | `(array) → number` | Minimum or maximum with `toNumber`. 0 for empty arrays and non-arrays. |
| `@Filter` | `(array, field, op, value) → array` | Keeps elements whose `field` satisfies `op value`. Ops: `==`, `!=` (loose), `>`, `<`, `>=`, `<=` (numeric), `contains` (case-sensitive substring of the field as a string). An empty `field` tests the elements themselves. A missing op means `==`. An unknown op matches nothing. `[]` for non-arrays. |
| `@Sort` | `(array, field, direction?) → array` | Stable sort on `field`. An empty `field` sorts the elements themselves. When both values are numbers or strings that parse as numbers, they compare as numbers. Otherwise their string forms (null is `""`) compare by Unicode code point, with no locale. Descending only when the third argument is `"desc"`. A non-array is returned unchanged. |
| `@Round` | `(number, decimals?) → number` | Rounds to `decimals` places, default 0, with JavaScript `Math.round` (a half rounds up). |
| `@Abs`, `@Floor`, `@Ceil` | `(number) → number` | With `toNumber`. |
| `@Each` | `(array, varName, template) → array` | Section 3.5. |

Field arguments accept dot paths (`"customer.name"`).

Fixtures: `evaluation/*-builtin-*`, including `evaluation/*-builtin-sort-*`

### 3.5 Iteration with `@Each`

`@Each(array, varName, template)` evaluates `template` once per element, with `varName` bound to it. A non-array gives `[]`.

- The loop variable exists only inside the template, where it shadows a statement of the same name. A nested `@Each` with the same `varName` shadows the outer one.
- There is no index variable.
- The element is put into the template before any deferred evaluation, so an action in the template captures its own element.

```openui-lang
rows = @Each(tickets.rows, "t", Row(t.title, Button("Close", Action([@Run(close), @Set($selected, t.id)]))))
```

Fixtures: `evaluation/*-each-*`

### 3.6 Custom functions

A library declares extra functions in its `functions` list ([prompt.md](./prompt.md), section 2.5). Programs call them with `@`. Arguments are positional, in the function's `order` array (the same rule as components).

- Built-ins are looked up first. A library MUST NOT register a function named like a built-in, an action step, `Query`, `Mutation`, or one of its components.
- A `@Name` call that is not a built-in, action step, or custom function evaluates to null and reports `unknown-function`. The statement is kept.
- Custom functions MUST be pure and synchronous. The runtime MAY cache results and MAY call them any number of times, in any order.
- Arguments are checked against `params` the same way component props are. Literal arguments are checked when parsing, with the same codes (`type-mismatch`, `missing-required`, and `excess-args` for extra arguments). Arguments that are only known at runtime are checked when the call runs. Missing optional arguments take their defaults.
- A call with invalid runtime arguments, a function that throws, or a return value that does not match `returns` reports `runtime-error`, and the call evaluates to null.
- While streaming, a call runs as soon as the statement that holds it is complete. A call in the pending statement evaluates to null until that statement completes.

Fixtures: `evaluation/*-function-*`, `errors/*-unknown-function-*`

## 4. Streaming

A client MUST accept input a chunk at a time and produce a valid render after every chunk.

1. **Statement completion.** A statement is complete when its ending newline has arrived and the rules of section 1.4 cannot extend it. For the ternary rule, the next line's first non-whitespace character must have arrived and not be `?`. Completed statements are parsed once and never change.
2. **The pending tail.** The text after the last completed statement is parsed on every chunk, after implicit closing. An unterminated string is closed (adding a `\` first if the text ends mid-escape). Then unclosed brackets are closed in reverse order. A closing bracket that does not match is skipped and leaves the bracket stack alone. A pending statement that still fails to parse is not produced.
3. **Pending does not overwrite completed.** A pending statement that needed implicit closing is discarded if a completed statement has the same name.
4. **Reconciliation.** If the prepared text no longer starts with the previously completed prefix (for example, a fence opener arrives), the client MUST discard its cache and parse again from the start.
5. **No placeholders.** An array element that is an unresolved reference is left out, as in section 2.3, not shown as a hole or skeleton.
6. **Interactive features wait.** Queries and mutations MUST NOT run while streaming. State declarations initialize as they arrive. A default read from a truncated statement MUST be replaced when the full statement arrives, unless the user has changed that state.
7. **The host ends the stream.** The language has no end marker. The host signals the end (in React, `isStreaming` turns false). A stored message records it with an `end` marker line ([prompt.md](./prompt.md), section 7). The signal finalizes the pending tail: implicit closing applies, and the resulting statements become completed, including a redefinition of an earlier name. Chunks after the signal are a new stream.

**Streaming equals parsing.** At stream end, the result MUST equal a batch parse of the full text: statements, entry, errors, and state defaults.

Fixtures: `streaming/`

## 5. State and forms

### 5.1 The state store and what is reactive

Every value is reactive: anything that uses a `$variable` or a query result evaluates again when that input changes. `$` marks only state the user or an action writes (input bindings, `@Set`, `@Reset`). Query results and derived values use plain names.

```openui-lang
$status = "open"
tickets = Query("listTickets", { status: $status }, { rows: [] })
openCount = @Count(tickets.rows)
```

The state store is a flat map from `$name` to value, scoped to one rendered program.

- A state declaration gives the default. An undeclared `$name` is declared automatically with the default null.
- Defaults apply only when the variable has no value yet. Parsing again, while streaming or after an edit, MUST NOT overwrite a value the user produced.
- Persisted state from the host is applied over the defaults at initialization.
- Parsing again never deletes a key.

Fixtures: `state/*-store-*`

### 5.2 Two-way binding

A `$variable` passed to a prop the library marks as bindable (`"x-openui": "binding"`, [prompt.md](./prompt.md), section 2.3) creates a two-way binding: the component shows the value and writes user changes back. The prompt prints bindable props as `$binding<type>`. A `$variable` passed to any other prop evaluates to its current value.

```openui-lang
$query = ""
search = Input("search", "Search tickets", "text", null, $query)
```

(This uses the reference library's `Input(name, placeholder, type, rules, value)`.)

Fixtures: `state/*-binding-*`

### 5.3 Form state

Fields group under the nearest enclosing form component, one that gives a form name to its subtree (like the reference library's `Form`). Inputs outside any form write into **page-level state**, the unnamed default scope.

Form values persist across parses. When an action sends a message to the model, the form state goes with the event (section 6.3). Hosts MAY persist form state and restore it when rendering a stored program again ([prompt.md](./prompt.md), section 7).

Fixtures: `state/*-form-*`

### 5.4 Validation rules

Validation rules are an object argument on input components, for example `{ required: true, email: true, maxLength: 80 }`. The rules are `required`, `email`, `url`, `numeric`, `minLength`, `maxLength`, `min`, `max`, and `pattern`.

- `email` checks the shape `local@domain.tld` with no spaces, with the regular expression `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- `url` checks for an absolute URL with a scheme and a host.
- `numeric` passes a number that is not NaN, or a string that is not blank and whose ECMAScript `parseFloat` is not NaN. So `"12abc"` passes.
- `pattern` is a regular expression with no flags. It uses only features common to ECMAScript and ICU: character classes, quantifiers, anchors, groups, and alternation. Lookbehind and backreferences are not required.
- Every rule except `required` skips empty values: null, `""`, an empty array, or an object with no keys.
- The first failing rule gives the field its error.
- A form submits only when every field passes.

Fixtures: `state/*-validation-*`

## 6. Data and actions

### 6.1 Query lifecycle

`name = Query(tool, args, defaults, refreshSeconds?)`: the tool name, the argument object, the result shown until data arrives, and an optional refresh interval in seconds.

- A query runs when streaming ends, and again when a `$variable` written literally in its `args` changes. State reached through a referenced statement does not trigger a fetch.
- While a fetch for changed arguments is in flight, the previous result stays visible. A result for stale arguments is discarded.
- References resolve to the latest result, or to the defaults before the first one. The reserved keys `__openui_loading`, `__openui_refetching`, and `__openui_errors` expose fetch state to the host. Expressions cannot read them.
- A refresh interval runs the query again on a timer.
- References inside Query and Mutation args resolve to their statements' values before the call, the same as anywhere else.

Fixtures: `actions/*-query-*`, including `actions/*-query-args-*`

### 6.2 Mutation lifecycle

`name = Mutation(tool, args)` runs only through `@Run`, never on load.

- Its `args` are evaluated when it runs, with the current state.
- References resolve to `{ status, data, error }`. `status` is `idle`, `loading`, `success`, or `error`.
- While `loading`, a second run is rejected.

Fixtures: `actions/*-mutation-*`

### 6.3 Action plans and steps

`Action([step, step, ...])` builds a plan, which a component's action prop triggers. An action position is a prop whose schema is a `$ref` to `ActionExpression`, or an `anyOf` of `$ref`s to action names ([prompt.md](./prompt.md), section 2.3). Steps run in order. A mutation run is awaited. Query fetches and host events are sent without waiting.

- `@Set($var, value)`: evaluates `value` when the step runs, and writes it.
- `@Reset($a, $b, ...)`: restores the declared defaults (null if none).
- `@Run(ref)`: runs a mutation or fetches a query again. A failed mutation stops the remaining steps. `@Run` on a query never stops the plan.
- `@ToAssistant(message, context?)`: sends a `continue_conversation` event with the message, the optional context, and the form state.
- `@OpenUrl(url)`: sends an `open_url` event.
- `@Name(args)`, a custom action from the library's `actions` ([prompt.md](./prompt.md), section 2.5): sends an event with `type` set to `Name`, `params` holding the arguments keyed by the action's param names, and an empty `humanFriendlyMessage`. Arguments map by position in the action's `order` and are checked like custom function arguments (section 3.6). A step whose arguments are invalid does nothing.

`@Run`, `@Set`, and `@Reset` name their targets instead of evaluating them: `@Run` takes a query or mutation reference, `@Set` and `@Reset` take state variables. The `@Each` template is deferred the same way.

**Single steps.** Any step written directly in an action position is a plan of one step: `Button("Save", @ToAssistant("Save"))` equals `Button("Save", Action([@ToAssistant("Save")]))`.

**Context.** The `context` of `@ToAssistant` may be any value. The host receives it unchanged in `params.context` and decides how it reaches the model ([prompt.md](./prompt.md), section 6.3).

**Form state timing.** Each event carries the form state as of when its step runs, so an earlier `@Set` in the same plan is visible.

Components MAY define a default action. The reference library's button with no action sends `continue_conversation` with its label as the message.

Events reach the host in one shape:

```json
{ "type": "continue_conversation",
  "humanFriendlyMessage": "Ticket closed",
  "params": { "context": { "ticket": "T-42" } },
  "formName": "ticket",
  "formState": { "ticket": { "status": { "value": "closed", "componentType": "input" } } } }
```

- `formName` is the nearest form around the triggering component, absent otherwise.
- `formState` holds each field as `{ value, componentType }`: that form's fields inside a form, the page-level state outside one.
- `open_url` events carry the same fields, with `params.url` and an empty `humanFriendlyMessage`.

Fixtures: `actions/*-plan-*`, `actions/*-single-step-*`, `actions/*-event-*`, `actions/*-custom-*`

### 6.4 Tool resolution

The host supplies tools as a map of async functions keyed by name, or as an MCP client. Tool names are case-sensitive. A missing tool fails the query or mutation with `tool-not-found` and a hint listing the tools. It MUST NOT crash the host.

Fixtures: `actions/*-tool-*`

## 7. Incremental editing

In edit mode, the model gets the current program and answers with only the changed statements. The client merges by name:

- A patch statement whose name exists replaces the original. A new name is appended. Names absent from the patch are kept.
- A top-level `name = null` in a patch deletes the statement. (Inside one program it is an ordinary binding.) A state declaration set to null gets the default null, and its store key is kept.
- After merging, statements `root` cannot reach are removed, unless there is no `root` statement. State declarations are always kept.

The merge MUST read both texts with sections 1.2 and 1.4, including multi-line ternaries. The host decides when a text is a patch. While streaming, each patched statement is applied as it completes. If the reply is prose plus a fenced patch, only the fenced part is merged.

Fixtures: `editing/`

## 8. Errors and recovery

### 8.1 Drop and render

**A mistake removes the smallest possible unit, and everything else renders.** An invalid argument degrades the prop, an invalid component drops the component, and an invalid statement drops the statement. Nothing a model writes crashes the client, and every removal is reported.

Fixtures: `errors/`

### 8.2 Error codes

A **fatal** error means nothing renders. Any other error leaves the rest of the page rendering.

| Code | Source | Meaning | Recovery |
| --- | --- | --- | --- |
| `unknown-component` | parser | Component not in the library | Component dropped (section 8.4) |
| `missing-required` | parser | Required prop absent | Filled from the schema default if there is one, else the component is dropped |
| `null-required` | parser | Required prop is null | Same as `missing-required` |
| `type-mismatch` | parser | Argument does not match the prop's type or enum | Schema default if any. Otherwise the optional prop or array item is removed; a required prop drops the component |
| `excess-args` | parser | More arguments than props | Extra arguments dropped, component renders |
| `inline-reserved` | parser | `Query` or `Mutation` in a value position | Expression evaluates to nothing |
| `unknown-function` | parser | `@Name` is not a built-in, an action step, or a custom function | The call evaluates to null. The statement is kept |
| `state-query` | parser | `Query` or `Mutation` bound to a `$` name | Non-fatal. The statement runs; the hint says to name it without `$` |
| `no-root` | parser | No usable entry (section 2.2), stream complete | Non-fatal when the first statement calls the root component and renders. Fatal otherwise |
| `parse-failed` | parser | The response has text but yields no statements | Fatal |
| `parse-exception` | parser | The parser itself failed | Fatal. The client MUST catch it |
| `runtime-error` | runtime | Evaluating an expression threw | The prop whose evaluation threw becomes null |
| `render-error` | runtime | A component renderer threw | Contained. The last good render is kept |
| `tool-not-found` | query, mutation | Unknown tool name | A query keeps its defaults. The hint lists the tools |
| `tool-error`, `mcp-error` | query, mutation | The tool call failed | A mutation result carries the error. A query keeps its defaults or last good data |

`no-root` and enum checks wait for the stream to end. Type checks on scalars run while streaming.

Fixtures: `errors/*-<code>-*` (one folder per code, for example `errors/*-no-root-*`)

### 8.3 The error object

Errors cross the wire in one shape, ready to paste into a model conversation:

```json
{
  "source": "parser",
  "code": "missing-required",
  "statementId": "chart",
  "component": "BarChart",
  "path": "/labels",
  "message": "missing required field \"/labels\"",
  "hint": "Signature: BarChart(labels*, series*, variant). * marks required"
}
```

`hint` is a short signature from the JSON Schema (prop names only, required props starred), or the available names for an unknown name.

- When a stream starts, the client clears its errors and emits an empty list if the last list was not empty.
- At stream end, and after each later render, the client emits the error list if it changed.
- Clients MUST NOT emit an unchanged list again. They MUST signal recovery by emitting an empty list.

Fixtures: `errors/*-shape-*`

### 8.4 Component validation

Arguments map to props by position against the library schema, then each prop is checked per section 8.2. Also:

- A list prop needs `[...]`, even for one item. A bare value is a `type-mismatch`.
- A slot that takes only components (every option of its schema is a `$ref` to a component) accepts any component. Data there (an object, array, string, number, or boolean) is a `type-mismatch`, and the value is left out.
- Inside arrays, invalid components and unresolved references are left out, in computed expressions too (section 2.3). Explicit `null` literals are kept and render nothing.
- A call to a name in a component's `aliases` ([prompt.md](./prompt.md), section 3.2) resolves to that component. It is not unknown.
- An unknown component in a value position is dropped. In a computed expression it stays in the tree for the error to point at, but renders nothing.

Fixtures: `errors/*-validate-*`

## 9. The program tree and serialization

### 9.1 The tree

Parsing produces a tree: each statement's name and kind, and for component calls the type with arguments mapped to named props. Evaluation and rendering use the tree. The fixtures summarize it (Appendix B).

### 9.2 Serialization

A rendered tree serializes back to source text:

- The entry statement comes first. Every other named component becomes its own statement, children before parents.
- Props are written by position in schema order. `null` holds an unfilled required position. Trailing nulls for optional props are trimmed.
- Object keys are written unquoted, so they must be valid names to round-trip.
- State declarations from the host come after the component statements.
- Query and mutation statements do not round-trip.

Serialized output SHOULD parse back to an equal tree, up to the recovery rules of section 8. Serializers SHOULD add parentheses where parsing back would change the grouping, as in `a - (b - c)` and `-(a + b)`.

Fixtures: `grammar/*-roundtrip-*`

## 10. Client checklist

A conforming client:

- MUST parse the complete grammar of section 1, even parts it does not run, and drop only the statements that need a missing part.
- MUST follow sections 2.2 (entry), 4 (streaming), 7 (edit merge), and 8 (recovery and error reporting) exactly.
- MUST NOT let generated content crash the host, including renderers that throw.
- MUST resolve tools case-sensitively and keep user-entered state across parses and edits.
- SHOULD give hosts a hook for unknown components, to show a diagnostic instead of blank space.
- MAY pace the visual reveal of streamed content, as long as parsing follows section 4.

## Appendix A. A worked streamed example

Four chunks arrive. The library's root component is `Card`.

1. `root = Card([header, kpis])\nheader = Head`: `root` completes, and `header` is pending as the reference `Head`. Render: an empty Card.
2. `er("Tickets", "Today")\nkpis = Stack([open`: `header` completes. Pending `kpis` closes to `Stack([open])`, and unresolved `open` is left out. Render: Card, Header, empty Stack.
3. `, closed])\nopen = Metric("Open", @Count(@Filter(tickets.rows, "status", "==", "open")))\n`: `kpis` and `open` complete. `closed` and `tickets` are unresolved. Render: one Metric, count 0.
4. `closed = Metric("Closed", 8)\ntickets = Query("listTickets", {}, { rows: [] })\n`: the host ends the stream, and the result equals a batch parse. The query runs and the metrics update.

Every frame was a valid page, with no errors and no placeholders.

Fixtures: `streaming/001-worked-example`

## Appendix B. Conformance fixtures

A client claims conformance by passing a tagged fixture release. If the prose and the fixtures disagree, that is a spec bug, and the next release fixes both.

```text
spec/fixtures/<area>/<NNN-short-name>/
```

The areas are `grammar`, `entry`, `streaming`, `evaluation`, `state`, `actions`, `editing`, and `errors`. Each "Fixtures:" line names a folder or a narrower pattern such as `entry/001-*`.

Each case holds:

- `input.oui`: the program text. Streaming cases use `chunks.json` instead, a JSON array of strings, the chunks in order.
- `expected.json`: the expected result after the stream ends.
- `steps.json`: action cases only. User actions and tool results, and what the host should see.

`expected.json`:

```json
{
  "root": {
    "type": "Card",
    "props": {
      "children": [
        { "type": "TextContent", "props": { "text": "Orders" } },
        { "type": "Input", "props": { "name": "q", "value": { "$binding": "$query" } } },
        { "type": "Button", "props": {
          "label": "Save",
          "action": { "action": [{ "step": "ToAssistant", "args": ["Save order"] }] } } }
      ]
    }
  },
  "errors": [{ "code": "unknown-component", "statementId": "chart" }],
  "unresolved": ["footer"],
  "orphans": ["oldHeader"],
  "incomplete": false
}
```

- `root` is the rendered tree summary, or null when nothing renders. A component is `{ "type", "props" }`. Primitive props are plain values. Component props are nested summaries. Actions are `{ "action": [ { "step", "args" } ] }`. Bindings are `{ "$binding": "$name" }`.
- `errors` lists `{ "code", "statementId" }` for each error.
- `unresolved` and `orphans` list names.
- `incomplete` is true when the input ended inside an unclosed string or bracket.

`steps.json`:

```json
{
  "steps": [
    { "type": ["search", "late"] },
    { "tool": "listTickets", "result": { "rows": [] } },
    { "click": "saveBtn" }
  ],
  "expected": {
    "events": [{ "type": "continue_conversation", "humanFriendlyMessage": "Save order" }],
    "state": { "$query": "late" }
  }
}
```

A step is `{ "click": "<statementId>" }`, `{ "type": ["<statementId>", "<text>"] }`, or `{ "tool": "<name>", "result": <json> }`. `expected.events` lists the host events in order, in the shape of section 6.3. `expected.state` is the final state.

## Appendix C. Changelog

- **2026-09-30**: 1.0. The entry is the `root` statement, or a first statement that calls the library's root component, with a real `no-root` code. Added `@Take`, custom functions, single-step actions, `===` and `!==`, any-value `@ToAssistant` context, form state read when the step runs, the `state-query` and `unknown-function` codes, and the fixture layout. Streaming must equal a batch parse, and edits merge with the parser's statement boundaries.
- Earlier drafts: 0.9 community review (2026-07-22) and 1.0-beta (2026-08-05). See the git history.
