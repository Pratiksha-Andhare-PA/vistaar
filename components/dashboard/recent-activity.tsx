
import { Activity, CheckCircle2 } from "lucide-react";

export function RecentActivity() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Recent activity
          </h3>

          <Activity
            size={20}
            className="text-teal-700 dark:text-teal-400"
          />
        </div>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your latest workspace updates.
        </p>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
          <Activity size={26} className="text-slate-400 dark:text-slate-500" />
        </div>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Nothing here yet
        </h4>

        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
          Your market research, product updates and storefront activity
          will appear here.
        </p>

        <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-400">
          <CheckCircle2 size={15} />
          Workspace ready to begin
        </span>
      </div>
    </section>
  );
}
