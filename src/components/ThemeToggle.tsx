"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const newTheme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(newTheme);
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  if (!mounted) return null;

  return (
    <button
      onClick={cycleTheme}
      className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
      title={`Current: ${theme} mode`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
