// Typed Swift declarations enter the shared authoring API through this adapter.
// No name/order/slot validation or extension algorithm lives here.
import * as core from '../../lang-core/src/index';
import * as z from 'zod/v4';
import { ACTION_DEFS } from '../../lang-core/src/parser/builtins';
import { compileSchema } from '../../lang-core/src/parser/parser';
import { copySchemaTags } from '../../lang-core/src/signature';

const own = (value: any, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const clone = (value: any) => JSON.parse(JSON.stringify(value));
function parameterObject(params: any[] = [], strict = true): any {
  const properties = Object.fromEntries(params.map(p => {
    const schema = clone(p.schema ?? {});
    if (p.hasDefault && !own(schema, 'default')) schema.default = p.defaultValue;
    return [p.name, schema];
  }));
  const required = params.filter(p => p.required && !p.hasDefault).map(p => p.name);
  return { type: 'object', properties, ...(required.length || !strict ? { required } : {}), ...(strict ? { additionalProperties: false } : {}) };
}
function actionSchemas(): any {
  return Object.fromEntries(Object.entries(ACTION_DEFS).map(([name, schema]) => {
    const { $schema, ...body } = z.toJSONSchema(schema as any);
    return [name, { ...body, id: name }];
  }));
}
function wireTemplate(input: any): any {
  const defs: any = Object.fromEntries(input.components.map((c: any) => [c.name, {
    ...parameterObject(c.params), id: c.name, ...(c.description ? { description: c.description } : {}),
  }]));
  for (const [name, schema] of Object.entries(actionSchemas())) if (!own(defs, name)) defs[name] = schema;
  for (const action of input.actions ?? []) {
    const ref = core.defineAction({ name: action.name, description: action.description, params: z.object({}) }).ref;
    const { $schema, ...body } = z.toJSONSchema(ref as any);
    (body as any).properties.params = parameterObject(action.params, false);
    defs[action.name] = { ...body, id: action.name };
  }
  const calls = (items: any[]) => Object.fromEntries(items.map(c => [c.name, {
    ...(c.description ? { description: c.description } : {}), params: parameterObject(c.params, false),
    ...(c.returns ? { returns: c.returns } : {}),
  }]));
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object',
    properties: Object.fromEntries(input.components.map((c: any) => [c.name, { $ref: '#/$defs/' + c.name }])),
    required: input.components.map((c: any) => c.name), additionalProperties: false, $defs: defs,
    ...((input.functions ?? []).length ? { functions: calls(input.functions) } : {}),
    ...((input.actions ?? []).length ? { actions: calls(input.actions) } : {}),
    ...(input.root ? { root: input.root } : {}),
  };
}
// JSON object-without-properties is the native spelling of a string-key record.
function converterInput(value: any): any {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(converterInput);
  const next: any = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, ['default', 'enum', 'const', 'examples'].includes(k) ? v : converterInput(v)]));
  if (next.type === 'object' && !own(next, 'properties') && !own(next, 'propertyNames')) next.propertyNames = { type: 'string' };
  return next;
}
function copySchema(schema: any, patch: any): any {
  const result = z.core.clone(schema, { ...schema._zod.def, ...patch });
  copySchemaTags(schema, result);
  if (core.isReactiveSchema(schema)) core.markReactive(result);
  const metadata = z.globalRegistry.get(schema);
  if (metadata) z.globalRegistry.add(result, metadata);
  return result;
}
function parts(input: any, previous?: any, changed = new Set<string>()): any {
  const template = wireTemplate(input);
  const properties: any = { ...template.properties };
  for (const [i, f] of (input.functions ?? []).entries()) {
    properties['@function:' + i] = parameterObject(f.params, false);
    if (f.returns) properties['@returns:' + i] = f.returns;
  }
  for (const [i, a] of (input.actions ?? []).entries()) properties['@action:' + i] = parameterObject(a.params, false);
  const document = { ...template, properties, required: Object.keys(properties) };
  const converted: any = z.fromJSONSchema(converterInput(document), { registry: z.registry() });
  const componentSchemas: any = Object.fromEntries(input.components.map((c: any) => [c.name,
    previous?.components[c.name] && !changed.has(c.name) ? previous.components[c.name].props : converted.shape[c.name],
  ]));
  const actions: any = Object.fromEntries((input.actions ?? []).map((a: any, i: number) => [a.name,
    previous?.actions?.[a.name] ?? core.defineAction({ name: a.name, description: a.description, params: converted.shape['@action:' + i] }),
  ]));
  // Restore reference identity after JSON transport. Decisions about placement,
  // override/removal and parent rebuilding are exclusively lib.extend's work.
  function link(raw: any, schema: any): any {
    if (!raw || !schema?._zod) return schema;
    const def = schema._zod.def;
    if (['optional', 'default', 'nullable', 'readonly'].includes(def.type))
      return copySchema(schema, { innerType: link(raw, def.innerType) });
    // Zod's JSON importer adds safe-integer bounds that JSON Schema did not
    // declare. Carry the actual input range as schema metadata before the core
    // generates its spec; no output spelling/order/signature projection follows.
    if (raw.type === 'integer' && def.type === 'number') {
      const checks = (def.checks ?? []).filter((check: any) => check._zod?.def?.format !== 'safeint');
      const result = copySchema(schema, { checks }).refine(Number.isInteger);
      result._zod.bag.format = 'integer';
      return result;
    }
    const reference = raw.$ref ?? (raw['x-openui-ref'] ? '#/$defs/' + raw['x-openui-ref'] : undefined);
    if (reference?.startsWith('#/$defs/')) {
      const name = reference.slice(8);
      if (componentSchemas[name]) return componentSchemas[name];
      if (actions[name]) return actions[name].ref;
      if (ACTION_DEFS[name]) return ACTION_DEFS[name];
      return schema;
    }
    if (def.type === 'array' && raw.items) return copySchema(schema, { element: link(raw.items, def.element) });
    if (['union', 'xor'].includes(def.type) && (raw.anyOf || raw.oneOf)) {
      const options = raw.anyOf ?? raw.oneOf;
      return copySchema(schema, { options: def.options.map((s: any, i: number) => link(options[i], s)) });
    }
    if (def.type === 'object' && raw.properties) {
      for (const [key, field] of Object.entries(raw.properties)) schema.shape[key] = link(field, schema.shape[key]);
    }
    return schema;
  }
  for (const c of input.components) if (!previous?.components[c.name] || changed.has(c.name)) {
    link(template.$defs[c.name], componentSchemas[c.name]);
    for (const p of c.params) if (p.isBindable) core.markReactive(componentSchemas[c.name].shape[p.name]);
  }
  for (const [i, a] of (input.actions ?? []).entries()) if (!previous?.actions?.[a.name]) link(parameterObject(a.params, false), actions[a.name].params);
  const functions: any = Object.fromEntries((input.functions ?? []).map((f: any, i: number) => [f.name,
    previous?.functions?.[f.name] ?? core.defineFunction({ name: f.name, description: f.description,
      params: link(parameterObject(f.params, false), converted.shape['@function:' + i]),
      ...(f.returns ? { returns: link(f.returns, converted.shape['@returns:' + i]) } : {}), fn: () => null }),
  ]));
  const components = input.components.map((c: any) => previous?.components[c.name] && !changed.has(c.name)
    ? previous.components[c.name] : core.defineComponent({ name: c.name, description: c.description, props: componentSchemas[c.name], component: null }));
  return { components, functions, actions };
}
function create(input: any): any {
  const built = parts(input);
  return { ...built, lib: core.createLibrary({ components: built.components, functions: Object.values(built.functions), actions: Object.values(built.actions), root: input.root, id: input.id, componentGroups: input.componentGroups }) };
}
function describe(lib: any): any {
  const spec = lib.toSpec();
  const schema = spec.schema;
  const reg = z.registry();
  for (const [name, c] of Object.entries(lib.components) as any) reg.add(c.props, { id: name });
  for (const [name, ref] of Object.entries(ACTION_DEFS)) if (!lib.components[name]) reg.add(ref as any, { id: name });
  for (const [name, a] of Object.entries(lib.actions) as any) reg.add(a.ref, { id: name });
  const params = (raw: any, obj: any) => Object.entries(obj.shape).map(([name, field]: any) => {
    const p = compileSchema({ $defs: { P: raw } } as any).get('P')!.params.find(p => p.name === name)!;
    return { name, required: p.required, hasDefault: own(raw.properties[name], 'default'), defaultValue: p.defaultValue ?? null,
      isBindable: core.isReactiveSchema(field), schema: raw.properties[name] };
  });
  const components = Object.entries(lib.components).map(([name, c]: any) => ({ name, description: c.description, params: params(schema.$defs[name], c.props) }));
  const functions = Object.entries(lib.functions).map(([name, f]: any) => ({ name, description: f.description, params: params(schema.functions[name].params, f.params), ...(schema.functions[name].returns ? { returns: schema.functions[name].returns } : {}) }));
  const actions = Object.entries(lib.actions).map(([name, a]: any) => ({ name, description: a.description, params: params(schema.actions[name].params, a.params) }));
  return { components, functions, actions, root: lib.root, id: lib.id, componentGroups: lib.componentGroups, spec: { ...spec, schema } };
}
export function nativeAuthoring(input: any, extension?: any): any {
  try {
    const base = create(input);
    if (!extension) return { value: describe(base.lib) };
    const added = extension.addComponents ?? [], overridden = extension.overrideComponents ?? [];
    const combined = { ...input, components: [...input.components, ...added, ...overridden], functions: [...input.functions, ...(extension.addFunctions ?? [])], actions: [...input.actions, ...(extension.addActions ?? [])] };
    const changes = parts(combined, base.lib, new Set([...added, ...overridden].map(c => c.name)));
    const named = (name: string) => changes.components.slice().reverse().find((c: any) => c.name === name);
    const lib = base.lib.extend({ components: { add: added.map((c: any) => extension.addComponentSlots?.[c.name] ? { component: named(c.name), slots: extension.addComponentSlots[c.name] } : named(c.name)), override: overridden.map((c: any) => named(c.name)), remove: extension.removeComponents }, functions: { add: (extension.addFunctions ?? []).map((f: any) => changes.functions[f.name]) }, actions: { add: (extension.addActions ?? []).map((a: any) => changes.actions[a.name]) } });
    return { value: describe(lib) };
  } catch (error) { return { error: String((error as any)?.message ?? error) }; }
}
export function nativeCompileSchema(schema: any, spec?: any, nativeBindings?: any): any {
  const compiled = compileSchema(schema);
  const bindings: any = nativeBindings ?? Object.fromEntries(Object.entries(spec?.components ?? {}).map(([name, entry]: any) => [name, [...entry.signature.matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)\??:\s*\$binding</g)].map(m => m[1])]));
  const project = (p: any) => ({ name: p.name, required: p.required, hasDefault: own(p.schema ?? {}, 'default'), defaultValue: p.defaultValue ?? null, schema: p.schema });
  return { components: Object.fromEntries([...compiled].map(([name, def]) => [name, def.params.map(p => ({ ...project(p), isBindable: bindings[name]?.includes(p.name) ?? false }))])),
    calls: Object.fromEntries([...compiled.callDefs!].map(([name, def]) => [name, { kind: def.kind, params: def.params.map(project), builtin: def.builtin ?? false, lazy: def.lazy ?? false }])) };
}

export function nativeSignature(name: string, params: any[], actionNames: string[]): string {
  const names = new Set<string>();
  const visit = (value: any) => {
    if (!value || typeof value !== 'object') return;
    if (value.$ref?.startsWith('#/$defs/')) names.add(value.$ref.slice(8));
    Object.values(value).forEach(visit);
  };
  params.forEach(p => visit(p.schema));
  const actions = actionNames.filter(n => names.has(n) && !ACTION_DEFS[n]).map(n => ({ name: n, description: '', params: [] }));
  const components = [{ name, description: '', params }, ...[...names].filter(n => n !== name && !ACTION_DEFS[n] && !actionNames.includes(n)).map(n => ({ name: n, description: '', params: [] }))];
  const input = { components, functions: [], actions };
  const result = nativeAuthoring(input);
  if (result.error) throw new Error(result.error);
  return result.value.spec.components[name].signature;
}
