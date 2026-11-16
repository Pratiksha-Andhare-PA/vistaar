
import type { PricingBreakdown as PricingBreakdownData } from "@/lib/pricing/pricing-calculator";

interface PricingBreakdownProps {
  breakdown: PricingBreakdownData;
  targetCurrency: string;
  sourceCurrency: string;
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

interface BreakdownRowProps {
  label: string;
  value: number;
  currency: string;
}

function BreakdownRow({
  label,
  value,
  currency,
}: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {label}
      </span>

      <span className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
        {formatCurrency(value, currency)}
      </span>
    </div>
  );
}

export function PricingBreakdown({
  breakdown,
  targetCurrency,
  sourceCurrency,
}: PricingBreakdownProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Pricing breakdown
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Estimated international selling price and cost distribution.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="rounded-xl bg-teal-50 p-5 dark:bg-teal-950/40">
          <p className="text-sm font-medium text-teal-800 dark:text-teal-300">
            Recommended selling price
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-teal-950 dark:text-teal-100">
            {formatCurrency(
              breakdown.recommendedPrice,
              targetCurrency,
            )}
          </p>

          <p className="mt-2 text-xs text-teal-800 dark:text-teal-300">
            Estimated profit margin: {breakdown.effectiveProfitMargin}%
          </p>
        </div>

        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          <BreakdownRow
            label="Original costs (before conversion)"
            value={breakdown.sourceCost}
            currency={sourceCurrency}
          />

          <BreakdownRow
            label="Converted landed cost"
            value={breakdown.convertedLandedCost}
            currency={targetCurrency}
          />

          <BreakdownRow
            label="Estimated customs duty"
            value={breakdown.customsDuty}
            currency={targetCurrency}
          />

          <BreakdownRow
            label="Total cost"
            value={breakdown.totalCost}
            currency={targetCurrency}
          />

          <BreakdownRow
            label="Platform fee"
            value={breakdown.platformFee}
            currency={targetCurrency}
          />

          <BreakdownRow
            label="Payment processing fee"
            value={breakdown.paymentFee}
            currency={targetCurrency}
          />

          <BreakdownRow
            label="Estimated tax"
            value={breakdown.tax}
            currency={targetCurrency}
          />

          <BreakdownRow
            label="Estimated profit"
            value={breakdown.profit}
            currency={targetCurrency}
          />
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-900 dark:text-white">
              Effective profit margin
            </span>

            <span className="font-semibold text-teal-700 dark:text-teal-400">
              {breakdown.effectiveProfitMargin}%
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Important pricing assumptions
        </p>

        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-800 dark:text-amber-300">
          <li>
            Exchange rates and cost inputs are provided by you.
          </li>

          <li>
            Customs duty is estimated on converted manufacturing,
            packaging and shipping costs.
          </li>

          <li>
            Tax and fee percentages are simplified estimates
            calculated against the final selling price.
          </li>

          <li>
            Actual duties, taxes and import requirements depend
            on the destination country, product classification
            and applicable regulations.
          </li>
        </ul>

        <p className="mt-3 text-xs font-medium text-amber-900 dark:text-amber-200">
          Verify applicable rates with official authorities or
          a qualified export professional before setting your
          final selling price.
        </p>
      </div>
    </section>
  );
}
