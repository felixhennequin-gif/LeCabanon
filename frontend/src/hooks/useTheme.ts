import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme {
  return (localStorage.getItem("theme") as Theme) ?? "system";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
    applyTheme(t);
  }, []);

  // Apply on mount + listen for system changes
  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (getStoredTheme() === "system") applyTheme("system"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const toggle = useCallback(() => {
    const current = getStoredTheme();
    const isDark = current === "dark" || (current === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "light" : "dark");
  }, [setTheme]);

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return { theme, setTheme, toggle, isDark };
}
