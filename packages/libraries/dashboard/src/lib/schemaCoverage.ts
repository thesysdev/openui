/**
 * Compile-time check that a definition hands every schema field to its plain component.
 *
 * Passing each prop explicitly already fails the build when a field's type drifts from the
 * component's props interface. It does not catch a field added to the schema and never passed
 * on: the model could write that argument and nothing would draw it. This closes that gap. Every
 * key of the schema's props must be a key of the component's props, or be named in `Consumed`:
 * fields the definition uses itself (resolved into children, counted, inspected).
 *
 * Use it once per definition, as an exported type so it is checked but emits nothing:
 *
 *   export type CardSchemaCovered = Covered<SchemaCoverage<CardSchemaProps, CardProps, "content">>;
 *
 * When a field is left over, the build names it: `{ unusedSchemaFields: "badge" }` does not
 * satisfy the constraint `true`.
 */
export type SchemaCoverage<Schema, Props, Consumed extends keyof Schema = never> = [
  Exclude<keyof Schema, keyof Props | Consumed>,
] extends [never]
  ? true
  : { unusedSchemaFields: Exclude<keyof Schema, keyof Props | Consumed> };

/** Fails the build unless its argument is `true`; see `SchemaCoverage`. */
export type Covered<T extends true> = T;
