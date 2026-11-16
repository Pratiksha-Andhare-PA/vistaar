
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 dark:border-slate-700 dark:bg-slate-900">
      <Sun
        size={17}
        className="shrink-0 text-slate-600 dark:hidden"
        aria-hidden="true"
      />

      <Moon
        size={17}
        className="hidden shrink-0 text-slate-300 dark:block"
        aria-hidden="true"
      />

      <select
        aria-label="Select theme"
        value={theme ?? "system"}
        onChange={(event) => setTheme(event.target.value)}
        className="bg-transparent py-2 text-sm text-slate-700 outline-none dark:text-slate-200"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
