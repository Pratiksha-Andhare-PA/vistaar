
import {
  Package,
  Globe2,
  Languages,
  Store,
} from "lucide-react";

const stats = [
  {
    label: "Products",
    value: "0",
    detail: "Products added",
    icon: Package,
    iconColor: "bg-blue-50 text-blue-700",
  },
  {
    label: "Markets explored",
    value: "0",
    detail: "Countries researched",
    icon: Globe2,
    iconColor: "bg-teal-50 text-teal-700",
  },
  {
    label: "Localized products",
    value: "0",
    detail: "Ready for global audiences",
    icon: Languages,
    iconColor: "bg-amber-50 text-amber-700",
  },
  {
    label: "Storefronts",
    value: "0",
    detail: "Global stores published",
    icon: Store,
    iconColor: "bg-purple-50 text-purple-700",
  },
];

export function StatsCards() {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">
          Your business at a glance
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Track your global expansion progress.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {stat.label}
                </span>

                <div className={`rounded-xl p-2.5 ${stat.iconColor}`}>
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {stat.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
