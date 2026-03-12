import { readable, type Readable } from "svelte/store";

export function readableFromController<T>(controller: {
  getState: () => T;
  subscribe: (listener: () => void) => () => void;
}): Readable<T> {
  return readable(controller.getState(), (set) =>
    controller.subscribe(() => {
      set(controller.getState());
    }),
  );
}
