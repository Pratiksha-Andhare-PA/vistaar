
import {
  Building2,
  ShoppingBag,
  Globe2,
  Store,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Set up your business",
    description: "Tell us about your business and where you're based.",
    icon: Building2,
    status: "Next step",
  },
  {
    number: "02",
    title: "Add your first product",
    description: "Upload your product image, description and price.",
    icon: ShoppingBag,
    status: "Upcoming",
  },
  {
    number: "03",
    title: "Discover global markets",
    description: "Find international markets with potential for your product.",
    icon: Globe2,
    status: "Upcoming",
  },
  {
    number: "04",
    title: "Launch your storefront",
    description: "Create a localized storefront for your chosen market.",
    icon: Store,
    status: "Upcoming",
  },
];

export function GettingStarted() {
  return (
    <section
      id="getting-started"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Getting started
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Four steps to take your business global.
          </p>
        </div>

        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          0 of 4 completed
        </span>
      </div>

      <div className="mt-7 space-y-6">
        {steps.map((step) => {
          const Icon = step.icon;
          const isNext = step.status === "Next step";

          return (
            <div key={step.number} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F4F1] text-teal-700">
                <Icon size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-teal-700">
                    STEP {step.number}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isNext
                        ? "bg-teal-50 text-teal-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                <h4 className="mt-1 text-sm font-semibold text-slate-900">
                  {step.title}
                </h4>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {step.description}
                </p>
              </div>

              {isNext && (
                <ArrowRight
                  size={18}
                  className="mt-3 shrink-0 text-teal-700"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
