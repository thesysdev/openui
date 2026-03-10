"use client";

import { cn } from "@/lib/cn";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const value = mounted ? resolvedTheme : null;

  return (
    <button
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 *:rounded-full cursor-pointer",
        className,
      )}
      aria-label="Toggle Theme"
      onClick={() => setTheme(value === "light" ? "dark" : "light")}
      data-theme-toggle=""
    >
      {(["light", "dark"] as const).map((key) => {
        const Icon = key === "light" ? Sun : Moon;
        return (
          <Icon
            key={key}
            fill="currentColor"
            className={cn(
              "size-5 p-1",
              value === key
                ? "bg-fd-accent text-fd-accent-foreground rounded-full"
                : "text-fd-muted-foreground",
            )}
          />
        );
      })}
    </button>
  );
}
