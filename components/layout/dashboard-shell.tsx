
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { AppHeader } from "./app-header";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F6F8F7] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <AppHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
