
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";

type NavigationItem = {
  name: string;
  href?: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Business profile", href: "/onboarding", icon: Building2 },
  { name: "My products", href: "/products", icon: Package },
  { name: "Market discovery", icon: Compass },
  { name: "Localization", icon: Languages },
  { name: "Global pricing", icon: Wallet },
  { name: "Export readiness", icon: FileCheck2 },
  { name: "My storefronts", icon: Store },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
      {/* Brand */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102B3F] text-white">
          <Globe2 size={23} />
        </div>

        <div>
          <h1 className="text-xl font-extrabold tracking-[0.12em] text-[#102B3F] dark:text-white">
            VISTAAR
          </h1>

          <p className="text-[9px] font-semibold tracking-widest text-teal-700 dark:text-teal-400">
            LOCAL ROOTS. GLOBAL REACH.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Workspace
        </p>

        <nav className="space-y-1" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active = item.href
              ? item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)
              : false;

            const className = `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
              active
                ? "bg-[#E8F4F1] font-semibold text-[#087E70] dark:bg-teal-950 dark:text-teal-300"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`;

            if (item.href) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={className}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </Link>
              );
            }

            return (
              <div
                key={item.name}
                aria-disabled="true"
                title="Coming soon"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 dark:text-slate-600"
              >
                <Icon size={19} />

                <span>{item.name}</span>

                <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  Soon
                </span>
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
            href="/#getting-started"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-300 transition hover:text-teal-200"
          >
            Get started →
          </Link>
        </div>

        <div
          aria-disabled="true"
          title="Settings coming soon"
          className="mt-5 flex cursor-not-allowed items-center gap-3 px-3 py-2 text-sm text-slate-400 dark:text-slate-600"
        >
          <Settings size={17} />
          <span>Settings</span>
          <span className="ml-auto text-[9px]">Soon</span>
        </div>
      </div>
    </aside>
  );
}
