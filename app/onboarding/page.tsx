
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BusinessForm } from "@/components/onboarding/business-form";

export default function OnboardingPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-7 p-5 sm:p-8">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <section>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F4F1] text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <Building2 size={24} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Set up your business
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Tell Vistaar about your business. We'll use this information
            to identify relevant international markets and opportunities
            for your products.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <BusinessForm />
        </section>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Vistaar · Local Roots. Global Reach.
        </p>

      </div>
    </DashboardShell>
  );
}
