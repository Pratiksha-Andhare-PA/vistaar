import { ContactForm } from "@/components/dashboard/contact-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function Home() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
        <WelcomeBanner />

        <StatsCards />

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <GettingStarted />
          <RecentActivity />
        </div>

        <ContactForm />

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <span>© 2026 Vistaar. Local Roots. Global Reach.</span>
          <span>Powered by AI</span>
        </footer>
      </div>
    </DashboardShell>
  );
}
