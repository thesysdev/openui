"use client";

import { useAppTheme } from "@components/components/AppThemeProvider/AppThemeProvider";
import { IconButton } from "@openuidev/react-ui/IconButton";
import { Contrast } from "lucide-react";

export default function ThemeToggle() {
  const { mode, toggleMode } = useAppTheme();
  const nextMode = mode === "light" ? "dark" : "light";

  return (
    <IconButton
      icon={<Contrast size={14} />}
      variant="secondary"
      size="small"
      onClick={toggleMode}
      aria-label={`Switch to ${nextMode} mode`}
      title={`Switch to ${nextMode} mode`}
    />
  );
}
