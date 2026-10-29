# state

These cases protect a client from losing or misplacing state: undeclared `$names`, two-way bindings, which form a field writes to, and which values pass validation. They cover [language.md section 5](../../../language.md#5-state-and-forms). The binding and form cases use `interactions.json`, and the validation case uses `validation.json` instead of a program.

| Case | What it checks | Spec |
| --- | --- | --- |
| 001-store-auto-declare | An undeclared `$name` is declared with null, so the Text shows "anon", and the store holds `$v` and `$name`. | [5.1](../../../language.md#51-the-state-store-and-what-is-reactive) |
| 002-binding-two-way (+ interactions) | `$query` passed to the bindable `Input.value` is a binding, and typing "late" writes it to the store. | [5.2](../../../language.md#52-two-way-binding) |
| 003-form-scope (+ interactions) | An Input inside `Form("contact", ...)`: the @ToAssistant event carries `formName: "contact"` and the field under that form. | [5.3](../../../language.md#53-form-state), [6.3](../../../language.md#63-actions) |
| 004-form-page-level (+ interactions) | An Input outside any form writes page-level state: the event has no `formName` and the field at the top level of `formState`. | [5.3](../../../language.md#53-form-state), [6.3](../../../language.md#63-actions) |
| 005-validation-rules | Pass or fail for each rule (`required`, `email`, `url`, `numeric`, `minLength`, `maxLength`, `min`, `max`, `pattern`), including that every rule but `required` skips empty values and that "12abc" is numeric. | [5.4](../../../language.md#54-validation-rules) |
