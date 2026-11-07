// Native presentation metadata. Syntax marks live only on parser-owned ASTs;
// evaluated values use a WeakMap so application data (including frozen values)
// gains no properties. Neither channel is part of the OpenUI protocol.
import { getCallDefs } from '../../lang-core/src/parser/builtins';
const syntax = Symbol('native.source.syntax');
const ready = new WeakMap<object, boolean>();
const nativeValues = new WeakMap<object, boolean>();
const memo = Symbol('native.source.memo');
const path = Symbol('native.source.path');
const emptyScope: ReadonlySet<string> = new Set();

export function tokenComplete(token: any): boolean { return token?.[syntax] !== false; }
export function tagSyntax<T extends object>(value: T, complete: boolean): T {
  (value as any)[syntax] = complete; return value;
}
export function tagReady<T>(value: T, complete: boolean): T {
  if (value && typeof value === 'object') ready.set(value as object, complete);
  return value;
}
export function tagNativeSource<T extends object>(value: T, complete: boolean): T {
  nativeValues.set(value, complete); return tagReady(value, complete);
}
export function sourceComplete(value: any): boolean {
  return (value && typeof value === 'object' ? ready.get(value) : undefined) ?? value?.[syntax] ?? !value?.partial;
}

export function astComplete(node: any, ctx: any, scope: ReadonlySet<string> = emptyScope, seen: Set<any> = ctx[path] ??= new Set()): boolean {
  if (!node || typeof node !== 'object') return true;
  if (seen.size > 256 || ctx.nativeLimit) return false;
  if (node[syntax] === false || node.k === 'Ph') return false;
  const key = scope.size ? [...scope].sort().join('\0') : '';
  const groups: Map<string, WeakMap<object, boolean>> = ctx[memo] ??= new Map();
  let cache = groups.get(key);
  if (!cache) groups.set(key, cache = new WeakMap());
  const known = cache.get(node);
  if (known !== undefined) return known;
  if (seen.has(node)) return false;
  seen.add(node);
  const child = (value: any, local = scope): boolean => astComplete(value, ctx, local, seen);
  let result = true;
  if (node.k === 'Ref' || node.k === 'StateRef') {
    // Opaque native captures and a control's injected $value are already bound.
    if (typeof node.n !== 'string' || scope.has(node.n) || node.n === '$value') result = true;
    else if (node.k === 'StateRef' && !ctx.syms?.has(node.n)) result = true;
    else result = ctx.syms ? ctx.syms.has(node.n) && child(ctx.syms.get(node.n)) : true;
  } else if (node.k === 'Comp') {
    const call = getCallDefs(ctx.cat).get(node.name);
    const definition = call ?? ctx.cat?.get(node.name);
    const lazy = call?.lazy;
    const variable = node.args?.[1];
    const name = variable?.k === 'Str' ? variable.v : variable?.k === 'Ref' ? variable.n : undefined;
    const nested = lazy && name ? new Set([...scope, name]) : scope;
    // Validation drops unsupported calls and excess arguments. Their unused
    // data must not become an unrelated control's readiness dependency.
    const args = definition ? node.args.slice(0, definition.params.length) : [];
    result = args.every((value: any, index: number) => lazy && name && index === 1 ? true : child(value, index > 1 ? nested : scope));
  } else {
    const visit = (value: any): boolean => Array.isArray(value)
      ? value.every(visit) : value && typeof value === 'object' && typeof value.k === 'string' ? child(value) : true;
    result = Object.values(node).every(visit);
  }
  seen.delete(node);
  cache.set(node, result);
  return result;
}

export function finishEvaluation(node: any, value: any): any {
  const complete = sourceComplete(node) && (value && typeof value === 'object' ? nativeValues.get(value) ?? true : true);
  tagReady(value, complete);
  // A lazy template can be closed while its input declaration is unfinished.
  // Its generated controls must wait for that input, including nested controls.
  if (node.k === 'Comp' && node.name === 'Each' && !complete) {
    const invalidate = (item: any) => {
      if (!item || typeof item !== 'object') return;
      tagReady(item, false);
      if (Array.isArray(item)) item.forEach(invalidate);
      else if (item.type === 'element') Object.values(item.props).forEach(invalidate);
    };
    invalidate(value);
  }
  return value;
}
