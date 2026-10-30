import { capture, hasCapture, capturedValue, nativePlan, isNativePlan, evaluationContext } from './captures';
export { capture, hasCapture, capturedValue, nativePlan };
export { sourceComplete, tagNativeSource } from './readiness';
import * as core from '../../lang-core/src/index';
import { isASTNode } from '../../lang-core/src/parser/ast';
import {
  stripFences,
  nativePreprocess,
} from '../../lang-core/src/parser/parser';
import {
  nativeSplitSource,
} from '../../lang-core/src/parser/merge';
import { URL, URLSearchParams } from 'whatwg-url';
Object.assign(globalThis, { URL, URLSearchParams });
const ids = new WeakMap<object, number>();
let next = 0;
export const identity = (value: object) => {
  let id = ids.get(value);
  if (!id) ids.set(value, (id = ++next));
  return id;
};
export const keys = Object.keys;
export const json = JSON.parse;
export const isAST = isASTNode;
export const api = core;
export const fences = stripFences;
export const library = (schema: any, bindings: Record<string, string[]>) => ({
  components: Object.fromEntries(
    Object.entries(schema.$defs ?? {}).map(([name, def]: [string, any]) => [
      name,
      {
        props: {
          shape: Object.fromEntries(
            Object.keys(def.properties ?? {}).map((k) => {
              const prop = {};
              if (bindings[name]?.includes(k)) core.markReactive(prop);
              return [k, prop];
            }),
          ),
        },
      },
    ]),
  ),
  toJSONSchema: () => schema,
});
export const store = core.createStore;
export const evaluate = (node: any, ctx: any, lib: any) =>
  core.evaluate(node, evaluationContext(ctx), { library: lib });
export const root = (
  result: any,
  ctx: any,
  lib: any,
  store: any,
  errors: any[],
) => core.evaluateRoot(result, { ctx: evaluationContext(ctx), library: lib, store, errors });
export const element = (
  node: any,
  ctx: any,
  lib: any,
  store: any,
  errors: any[],
) => core.evaluateElementProps(node, { ctx: evaluationContext(ctx), library: lib, store, errors });
export const expression = (text: string) =>
  core.parseExpression(core.tokenize(text));
export const number = (value: any) => Number(value);
export const text = (value: any) => String(value ?? '');
export const numberText = (value: number) => String(value);
export const truth = (value: any) => !!value;
export const equal = (a: any, b: any) => a == b;
export const regexp = (pattern: string, text: string) => {
  try {
    return new RegExp(pattern).test(text) ? 'matches' : 'noMatch';
  } catch {
    return 'invalidPattern';
  }
};
export const queryManager = core.createQueryManager;
export const queryNode = (
  id: string,
  tool: string,
  args: any,
  defaults: any,
  deps: any,
  refresh: number,
  complete: boolean,
) => ({
  statementId: id,
  toolName: tool,
  args,
  defaults,
  deps,
  refreshInterval: refresh,
  complete,
});
export const promise = (start: (resolve: any, reject: any) => void) =>
  new Promise(start);
export const error = (message: string) => new Error(message);
export const toolError = (name: string, available: string[]) =>
  new core.ToolNotFoundError(name, available);
export const mcpError = (message: string) => new core.McpToolError(message);
import { BUILTINS, toNumber } from '../../lang-core/src/parser/builtins';
export const builtin = (name: string, args: any) =>
  BUILTINS[name]?.fn?.(args) ?? null;
export const dslNumber = toNumber;
export const stringValue = (value: any) => String(value);
import { compileSchema } from '../../lang-core/src/parser/parser';
import {
  containsDynamicValue,
  materializeExpr,
  materializeValue,
} from '../../lang-core/src/parser/materialize';
import {
  buildParamsSignature,
  pushValidationIssue,
  validateSchemaValue,
  INVALID,
} from '../../lang-core/src/parser/validation';
export const dynamic = containsDynamicValue;
export function materialize(
  mode: string,
  value: any,
  schema: any,
  syms: any,
  partial: boolean,
  id: string,
  visited: string[],
  unreached: string[] | null,
  component?: string,
  path?: string,
  propSchema?: any,
) {
  const cat = compileSchema(schema);
  const ctx: any = {
    syms: new Map(Object.entries(syms)),
    cat,
    errors: [],
    unres: [],
    visited: new Set(visited),
    partial,
    currentStatementId: id,
    unreached: unreached ? new Set(unreached) : undefined,
  };
  const result =
    mode === 'expr'
      ? materializeExpr(value, ctx)
      : mode === 'validate'
        ? validateSchemaValue(value, propSchema, component!, path!, ctx)
        : mode === 'issue'
          ? (pushValidationIssue(ctx, component!, path!, value), null)
          : materializeValue(value, ctx);
  return {
    result: result === INVALID ? null : result,
    invalid: result === INVALID,
    errors: ctx.errors,
    unresolved: ctx.unres,
    unreached: ctx.unreached ? [...ctx.unreached] : null,
  };
}
export function signature(name: string, params: any) {
  const cat = compileSchema({
    $defs: { X: params },
    properties: { X: {} },
  } as any);
  return buildParamsSignature(name, cat.get('X')!.params);
}

export const preprocess = nativePreprocess;
export const splitSource = nativeSplitSource;

export const merge = core.mergeStatements;
export const object = () => ({});
export const define = (object: any, key: string, value: any) =>
  Object.defineProperty(object, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
export function extract(result: any) {
  try {
    return { value: core.extractToolResult(result) };
  } catch (error) {
    if (error instanceof core.McpToolError)
      return { error: error.toolErrorText };
    throw error;
  }
}
import { toLiteralAST } from '../../lang-core/src/parser/ast';
function serializable(value: any): any {
  if (!value || typeof value !== 'object') return value;
  if (hasCapture(value)) {
    const valueAST = serializable(capturedValue(value));
    return isASTNode(valueAST) ? valueAST : toLiteralAST(valueAST);
  }
  if (nativeKinds.get(value) !== 'object' && core.isReactiveAssign(value))
    return value.expr?.k === 'StateRef' && value.expr.n === '$value'
      ? { k: 'StateRef', n: value.target }
      : { k: 'Assign', target: value.target, value: value.expr };
  if (nativeKinds.get(value) !== 'object' && Array.isArray(value.steps)) {
    const steps = value.steps.map((step: any) => {
      let name: string, args: any[];
      switch (step.type) {
        case 'reset':
          name = 'Reset';
          args = step.targets.map((n: string) => ({ k: 'StateRef', n }));
          break;
        case 'set':
          name = 'Set';
          args = [{ k: 'StateRef', n: step.target }, step.valueAST];
          break;
        case 'run':
          name = 'Run';
          args = [
            { k: 'RuntimeRef', n: step.statementId, refType: step.refType },
          ];
          break;
        case 'open_url':
          name = 'OpenUrl';
          args = [toLiteralAST(step.url)];
          break;
        case 'continue_conversation':
          name = 'ToAssistant';
          args = [
            toLiteralAST(step.message),
            ...(step.context == null ? [] : [toLiteralAST(step.context)]),
          ];
          break;
        default:
          name = step.name;
          args = Object.values(step.params ?? {}).map(toLiteralAST);
      }
      return { k: 'Comp', name, args };
    });
    return steps.length === 1
      ? steps[0]
      : { k: 'Comp', name: 'Action', args: [{ k: 'Arr', els: steps }] };
  }
  if (Array.isArray(value)) return value.map(serializable);
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [key, serializable(v)]),
  );
}
export const serialize = (tree: any, library: any, options: any) =>
  core.jsonToOpenUI(serializable(tree), library, {
    ...options,
    stateDeclarations: serializable(options.stateDeclarations),
  });

const nativeKinds = new WeakMap<object, string>();
export const tag = (value: object, kind: string) => {
  nativeKinds.set(value, kind);
  return value;
};
export const kind = (value: object) => nativeKinds.get(value);

import { ownSteps } from '../../lang-core/src/runtime/evaluator';
export const actionSteps = (plan: any) =>
  isNativePlan(plan) ? plan.steps : ownSteps(plan).steps;

export { nativeAuthoring, nativeCompileSchema, nativeSignature } from './authoring';
