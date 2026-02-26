"use client";

import { useEffect } from "react";
import { useThemeStore, getEffectiveTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = getEffectiveTheme(theme);

    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);
  }, [theme]);

  return <>{children}</>;
}
