// Private opaque references exist only at the native bridge boundary. The
// upstream evaluator resolves them through its ordinary context callback.
// Model data cannot construct a token, and no string name is reserved.
const values = new WeakMap<object, unknown>();
export function capture(value: unknown): any {
  const token = Object.freeze({});
  values.set(token, value);
  return { k: 'Ref', n: token };
}
export function hasCapture(node: any): boolean {
  return node?.k === 'Ref' && typeof node.n === 'object' && node.n !== null && values.has(node.n);
}
export function capturedValue(node: any): unknown {
  return values.get(node.n);
}
export function evaluationContext(context: any): any {
  return {
    ...context,
    resolveRef(name: any) {
      if (typeof name === 'object' && name !== null && values.has(name)) return values.get(name);
      return context.resolveRef(name);
    },
  };
}

// Native-authored plans execute at the host boundary. They do not bypass
// upstream ownSteps when a DSL Action(...) composes plans.
const trustedPlans = new WeakSet<object>();
export function nativePlan<T extends object>(plan: T): T {
  trustedPlans.add(plan);
  return plan;
}
export function isNativePlan(plan: object): boolean {
  return trustedPlans.has(plan);
}
