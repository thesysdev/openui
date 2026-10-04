import { useMemo, useRef } from "react";

export const useTransformedKeys = (keys: string[]) => {
  const nextIdRef = useRef(0);
  const cacheRef = useRef<Record<string, string>>({});

  return useMemo(() => {
    return keys.reduce(
      (acc, key) => {
        if (!cacheRef.current[key]) {
          cacheRef.current[key] = `tk-${nextIdRef.current++}`;
        }
        acc[key] = cacheRef.current[key];
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [keys]);
};
