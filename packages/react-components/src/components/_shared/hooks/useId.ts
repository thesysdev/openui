import { useMemo } from "react";

export const useId = () => {
  return useMemo(() => crypto.randomUUID(), []);
};
