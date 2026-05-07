"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);
  return mounted ? <>{children}</> : null;
}
