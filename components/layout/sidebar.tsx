
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Package,
  Compass,
  Languages,
  Wallet,
  FileCheck2,
  Store,
  Settings,
  Sparkles,
  Globe2,
} from "lucide-react";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Business profile", icon: Building2 },
  { name: "My products", icon: Package },
  { name: "Market discovery", icon: Compass },
  { name: "Localization", icon: Languages },
  { name: "Global pricing", icon: Wallet },
  { name: "Export readiness", icon: FileCheck2 },
  { name: "My storefronts", icon: Store },
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Brand */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102B3F] text-white">
          <Globe2 size={23} />
        </div>

        <div>
          <h1 className="text-xl font-extrabold tracking-[0.12em] text-[#102B3F]">
            VISTAAR
          </h1>
          <p className="text-[9px] font-semibold tracking-widest text-teal-700">
            LOCAL ROOTS. GLOBAL REACH.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            const active = index === 0;

            return (
              <div key={item.name}>
                {active ? (
                  <Link
                    href="/"
                    className="flex items-center gap-3 rounded-xl bg-[#E8F4F1] px-3 py-3 text-sm font-semibold text-[#087E70]"
                  >
                    <Icon size={19} />
                    {item.name}
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    title="Coming soon"
                    className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500"
                  >
                    <Icon size={19} />
                    <span>{item.name}</span>
                    <span className="ml-auto text-[9px] text-slate-400">
                      Soon
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom promotional section */}
      <div className="mt-auto p-4">
        <div className="rounded-2xl bg-[#102B3F] p-4 text-white">
          <Sparkles className="mb-3 text-teal-300" size={22} />

          <h3 className="text-sm font-bold">
            Your global journey starts here
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-300">
            Discover new opportunities and take your local products
            to international markets.
          </p>

          <Link
            href="#getting-started"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-300"
          >
            Get started →
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-3 px-3 py-2 text-sm text-slate-500">
          <Settings size={17} />
          Settings
        </div>
      </div>
    </aside>
  );
}
