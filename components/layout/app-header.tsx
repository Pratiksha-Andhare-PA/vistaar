
import { Globe2 } from "lucide-react";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Globe2 size={22} className="text-teal-700 dark:text-teal-400" />

        <span className="font-extrabold tracking-widest text-[#102B3F] dark:text-white">
          VISTAAR
        </span>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Your Vistaar workspace
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your business expansion journey
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ThemeSwitcher />

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Your workspace
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Business owner
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDF1EC] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
          V
        </div>
      </div>
    </header>
  );
}
