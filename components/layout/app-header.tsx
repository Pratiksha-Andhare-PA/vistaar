
import { Globe2 } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
      {/* Mobile brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <Globe2 size={22} className="text-teal-700" />
        <span className="font-extrabold tracking-widest text-[#102B3F]">
          VISTAAR
        </span>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm font-semibold text-slate-800">
          Overview
        </p>
        <p className="text-xs text-slate-500">
          Your business expansion workspace
        </p>
      </div>

      {/* Workspace profile */}
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            Your workspace
          </p>
          <p className="text-xs text-slate-500">
            Business owner
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDF1EC] font-bold text-teal-800">
          V
        </div>
      </div>
    </header>
  );
}
