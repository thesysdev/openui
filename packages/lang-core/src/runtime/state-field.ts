import type { EvaluationContext } from "./evaluator";
import { evaluate, isReactiveAssign } from "./evaluator";
import type { Store } from "./store";

export interface StateField<T = unknown> {
  name: string;
  value: T;
  setValue: (newValue: T) => void;
  isReactive: boolean;
}

export type InferStateFieldValue<T> = T extends StateField<infer U> ? U : T;

export function resolveStateField<T = unknown>(
  name: string,
  bindingValue: unknown,
  store: Store | null,
  evaluationContext: EvaluationContext | null,
  fieldGetter: (fieldName: string) => unknown,
  fieldSetter: (fieldName: string, value: unknown) => void,
): StateField<T> {
  if (isReactiveAssign(bindingValue) && store && evaluationContext) {
    const { target, expr } = bindingValue;
    return {
      name,
      value: store.get(target) as T,
      setValue: (value: T) => {
        const extraScope: Record<string, unknown> = { $value: value };
        const nextValue = evaluate(expr, { ...evaluationContext, extraScope });
        store.set(target, nextValue);
      },
      isReactive: true,
    };
  }

  return {
    name,
    value: (fieldGetter(name) ?? bindingValue) as T,
    setValue: (value: T) => fieldSetter(name, value),
    isReactive: false,
  };
}
