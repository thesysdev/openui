# errors

These cases protect a client from crashing, dropping too much, or reporting the wrong code when a program has a mistake. A mistake removes the smallest unit (a prop, a component, or a statement), the rest renders, and each removal is reported with its code and statement. They cover [language.md section 8](../../../language.md#8-errors-and-recovery), the argument checks of [section 3.6](../../../language.md#36-custom-functions), and [prompt.md section 6.2](../../../prompt.md#62-error-feedback). Numbers 004 and 011 are not used.

| Case | What it checks | Spec |
| --- | --- | --- |
| 001-unknown-component-dropped | `Chart` is not in the library: it is dropped from the Stack, the Text still renders, and `unknown-component` is reported on `chart`. | [8.2](../../../language.md#82-error-codes), [8.4](../../../language.md#84-component-validation) |
| 002-unknown-function-null | `@Nope(1)` evaluates to null, so the Text shows "was null", and `unknown-function` is reported; the statement is kept. | [3.6](../../../language.md#36-custom-functions), [8.2](../../../language.md#82-error-codes) |
| 003-no-root-unresolved-root | `root = main` with no `main` statement: a fatal `no-root`, nothing renders, `main` is unresolved, and `other` is listed as an orphan. | [2.2](../../../language.md#22-entry), [8.2](../../../language.md#82-error-codes) |
| 005-shape-missing-required-metric | `Metric("Revenue")` has no required `value`: the Metric is dropped, and the error object has `source: "parser"`, `component: "Metric"`, and `path: "/value"`. | [8.3](../../../language.md#83-the-error-object) |
| 006-null-required-dropped | `Text(null)`: `null-required`, and the Text is dropped. | [8.2](../../../language.md#82-error-codes) |
| 007-type-mismatch-enum | `Tag("x", "purple")` with a color outside the enum: `type-mismatch`, the optional prop is removed, and the Tag renders. | [8.2](../../../language.md#82-error-codes) |
| 008-type-mismatch-bare-list | Card children given a bare Text instead of `[...]`: `type-mismatch`, the children prop is removed, and the Card renders. | [8.4](../../../language.md#84-component-validation) |
| 009-excess-args-dropped | `Text` with three arguments: the third is dropped, `excess-args` is reported, and the Text renders. | [8.2](../../../language.md#82-error-codes) |
| 010-inline-reserved-array | `Query(...)` as an array element: `inline-reserved` on `root`, and the element is left out. | [2.1](../../../language.md#21-statement-kinds), [8.2](../../../language.md#82-error-codes) |
| 012-validate-array-elements | In a children array, an unknown component is dropped with an error, an explicit `null` is kept, and an unresolved reference is left out. | [8.4](../../../language.md#84-component-validation) |
| 013-validate-component-slot-data | A string and an object in Stack children and a number in Card children: one `type-mismatch` each, and the values are left out. | [8.4](../../../language.md#84-component-validation) |
| 014-function-literal-args | Literal arguments to @Upper: an extra argument is dropped with `excess-args` (result "X"), a number gives `type-mismatch`, and no argument gives `missing-required`; the last two calls evaluate to null, so `placeholder` is absent. | [3.6](../../../language.md#36-custom-functions) |
