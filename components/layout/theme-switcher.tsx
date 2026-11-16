
"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const Icon =
    theme === "dark"
      ? Moon
      : theme === "light"
        ? Sun
        : Monitor;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 dark:border-slate-700 dark:bg-slate-900">
      <Icon
        size={17}
        className="shrink-0 text-slate-600 dark:text-slate-300"
      />

      <label htmlFor="theme-select" className="sr-only">
        Choose appearance
      </label>

      <select
        id="theme-select"
        aria-label="Choose appearance"
        value={theme ?? "system"}
        onChange={(event) => setTheme(event.target.value)}
        className="h-10 w-[105px] cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
