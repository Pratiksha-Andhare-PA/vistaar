
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Globe2,
  Loader2,
  Package,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type Business = {
  id: string;
  name: string;
  country: string;
};

type Product = {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: string | number;
  currency: string;
};

type Market = {
  id: string;
  country: string;
  countryCode: string;
  rank: number;
  opportunityScore: number;
  demandLevel: string;
  competitionLevel: string;
  targetCustomers: string;
  marketRationale: string;
  opportunities: string[];
  risks: string[];
  culturalConsiderations: string[];
  suggestedPriceMin: string | number | null;
  suggestedPriceMax: string | number | null;
  suggestedCurrency: string | null;
  scoreBreakdown?: {
    demand: number;
    competition: number;
    culturalFit: number;
    exportPracticality: number;
    total: number;
  } | null;
};

type Research = {
  id: string;
  status: string;
  summary: string | null;
  recommendedCountry: string | null;
  recommendationReason: string | null;
  modelUsed: string | null;
  results: Market[];
};

type Country = {
  code: string;
  name: string;
  flag: string;
};

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
];

const panelClass =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

function levelColor(level: string) {
  switch (level.toUpperCase()) {
    case "HIGH":
      return "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function formatPrice(
  value: string | number | null,
  currency: string | null,
) {
  if (value === null || !currency) return "Not available";

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${currency} ${value}`;
  }
}


const SCORE_FACTORS = [
  {
    key: "demand",
    label: "Market demand",
    maximum: 40,
    description: "Higher assessed demand earns more points.",
  },
  {
    key: "competition",
    label: "Competition",
    maximum: 25,
    description: "Lower assessed competition earns more points.",
  },
  {
    key: "culturalFit",
    label: "Cultural fit",
    maximum: 20,
    description: "Stronger alignment with local preferences earns more points.",
  },
  {
    key: "exportPracticality",
    label: "Export practicality",
    maximum: 15,
    description: "More practical export conditions earn more points.",
  },
] as const;

function ScoringMethodology() {
  return (
    <div className={`${panelClass} p-5 sm:p-6`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          <TrendingUp size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">
            How opportunity scores are calculated
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Each market receives a score out of 100 using four weighted
            factors. These are heuristic assessments, not measured market
            statistics or guaranteed business outcomes.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SCORE_FACTORS.map((factor) => (
          <div
            key={factor.key}
            className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {factor.label}
              </p>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                {factor.maximum} pts
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {factor.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Maximum possible score
        </span>
        <span className="text-lg font-extrabold text-teal-700 dark:text-teal-400">
          100 points
        </span>
      </div>
    </div>
  );
}

function MarketComparisonTable({ markets }: { markets: Market[] }) {
  const sortedMarkets = [...markets].sort((a, b) => a.rank - b.rank);

  return (
    <div className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
        <h3 className="font-bold text-slate-900 dark:text-white">
          Side-by-side market comparison
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Compare each market&apos;s overall score and individual scoring factors.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
            <tr>
              <th className="px-4 py-4 font-semibold">Market</th>
              <th className="px-4 py-4 font-semibold">Opportunity</th>
              <th className="px-4 py-4 font-semibold">Demand</th>
              <th className="px-4 py-4 font-semibold">Competition</th>
              <th className="px-4 py-4 font-semibold">Demand</th>
              <th className="px-4 py-4 font-semibold">Competition</th>
              <th className="px-4 py-4 font-semibold">Cultural fit</th>
              <th className="px-4 py-4 font-semibold">Export</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedMarkets.map((market) => {
              const breakdown = market.scoreBreakdown;
              const flag =
                COUNTRIES.find((item) => item.code === market.countryCode)?.flag ??
                "🌍";

              return (
                <tr key={market.id} className="text-slate-700 dark:text-slate-300">
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{flag}</span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {market.country}
                        </p>
                        <p className="text-xs text-slate-400">
                          Rank #{market.rank}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-extrabold text-teal-700 dark:text-teal-400">
                      {market.opportunityScore}/100
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelColor(market.demandLevel)}`}>
                      {market.demandLevel}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelColor(market.competitionLevel)}`}>
                      {market.competitionLevel}
                    </span>
                  </td>

                  {[
                    breakdown?.demand,
                    breakdown?.competition,
                    breakdown?.culturalFit,
                    breakdown?.exportPracticality,
                  ].map((value, index) => (
                    <td
                      key={`${market.id}-${index}`}
                      className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums"
                    >
                      {value ?? "—"}
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        / {SCORE_FACTORS[index].maximum}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-slate-800">
        A dash means scoring breakdown data is unavailable for that market.
        Scores are heuristic assessments.
      </p>
    </div>
  );
}

function MarketCard({
  market,
  recommended,
}: {
  market: Market;
  recommended: boolean;
}) {
  const breakdown = market.scoreBreakdown;

  return (
    <article className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-xl dark:bg-teal-950">
              {COUNTRIES.find((item) => item.code === market.countryCode)?.flag ?? "🌍"}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Rank #{market.rank}
              </p>
              <h3 className="mt-1 font-bold text-slate-900 dark:text-white">
                {market.country}
              </h3>
            </div>
          </div>

          {recommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <Sparkles size={12} />
              Recommended
            </span>
          )}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Opportunity score
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
              {market.opportunityScore}
              <span className="text-sm font-medium text-slate-400">/100</span>
            </p>
          </div>

          <TrendingUp className="mb-1 text-teal-600 dark:text-teal-400" size={25} />
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{
              width: `${Math.max(0, Math.min(100, market.opportunityScore))}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Market demand
            </p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelColor(market.demandLevel)}`}>
              {market.demandLevel}
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Competition
            </p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelColor(market.competitionLevel)}`}>
              {market.competitionLevel}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Market assessment
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {market.marketRationale}
          </p>
        </div>

        {breakdown && (
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              Score breakdown
            </h4>

            <div className="space-y-2">
              {[
                ["Demand", breakdown.demand],
                ["Competition", breakdown.competition],
                ["Cultural fit", breakdown.culturalFit],
                ["Export practicality", breakdown.exportPracticality],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {label}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {value} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Target customers
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {market.targetCustomers}
          </p>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-bold text-teal-700 dark:text-teal-400">
            Opportunities
          </h4>
          <ul className="space-y-2">
            {market.opportunities.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-bold text-amber-700 dark:text-amber-400">
            Risks to consider
          </h4>
          <ul className="space-y-2">
            {market.risks.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <h4 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            Cultural considerations
          </h4>
          <ul className="space-y-2">
            {market.culturalConsiderations.map((item, index) => (
              <li key={index} className="text-sm leading-5 text-slate-500 dark:text-slate-400">
                • {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suggested market price range
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
            {formatPrice(market.suggestedPriceMin, market.suggestedCurrency)}
            {" – "}
            {formatPrice(market.suggestedPriceMax, market.suggestedCurrency)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function MarketDiscovery() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [productId, setProductId] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "US",
    "GB",
    "AE",
  ]);

  const [research, setResearch] = useState<Research | null>(null);
  const [cached, setCached] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBusinesses() {
      try {
        const response = await fetch("/api/business", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load businesses.");
        }

        const list: Business[] = data.businesses ?? [];
        setBusinesses(list);
        setBusinessId(list[0]?.id ?? "");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBusinesses(false);
        }
      }
    }

    loadBusinesses();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!businessId) {
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      setLoadingProducts(true);
      setError("");
      setResearch(null);

      try {
        const response = await fetch(
          `/api/products?businessId=${encodeURIComponent(businessId)}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load products.");
        }

        const list: Product[] = data.products ?? [];
        setProducts(list);
        setProductId(list[0]?.id ?? "");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [businessId]);

  const selectedBusiness = businesses.find((item) => item.id === businessId);
  const selectedProduct = products.find((item) => item.id === productId);

  const availableCountries = useMemo(() => {
    const homeCountry = selectedBusiness?.country.trim().toLowerCase();

    const countryAliases: Record<string, string[]> = {
      india: ["india", "in"],
      "united states": ["united states", "us", "usa"],
      "united kingdom": ["united kingdom", "gb", "uk"],
      "united arab emirates": ["united arab emirates", "ae", "uae"],
      canada: ["canada", "ca"],
      australia: ["australia", "au"],
      singapore: ["singapore", "sg"],
    };

    return COUNTRIES.filter((country) => {
      const aliases = countryAliases[country.name.toLowerCase()] ?? [
        country.name.toLowerCase(),
        country.code.toLowerCase(),
      ];

      return !aliases.includes(homeCountry ?? "");
    });
  }, [selectedBusiness]);

  function toggleCountry(code: string) {
    setSelectedCountries((current) => {
      if (current.includes(code)) {
        return current.filter((item) => item !== code);
      }

      if (current.length >= 5) {
        setError("You can compare a maximum of five markets at a time.");
        return current;
      }

      setError("");
      return [...current, code];
    });

    setResearch(null);
  }

  async function handleResearch() {
    if (!productId || selectedCountries.length === 0) {
      setError("Select a product and at least one target market.");
      return;
    }

    setResearching(true);
    setError("");
    setResearch(null);

    try {
      const response = await fetch("/api/market-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          countries: selectedCountries,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Market research failed.",
        );
      }

      setResearch(data.research);
      setCached(Boolean(data.cached));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete market research.",
      );
    } finally {
      setResearching(false);
    }
  }

  if (loadingBusinesses) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Compass size={16} />
          <span>Workspace</span>
          <span>/</span>
          <span className="text-teal-700 dark:text-teal-400">
            Market discovery
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Discover global markets
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Explore international opportunities for your products. Compare
          demand, competition, cultural fit and export practicality before
          choosing your next market.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {businesses.length === 0 ? (
        <div className={`${panelClass} px-6 py-16 text-center`}>
          <Building2Placeholder />
          <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
            Set up your business profile first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Create your business profile and add products before exploring
            international markets.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950"
          >
            Create business profile <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <section className={`${panelClass} p-5 sm:p-7`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <Globe2 size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Configure your market research
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose a product and the countries you want to explore.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="discovery-business" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Business
                </label>
                <select
                  id="discovery-business"
                  value={businessId}
                  onChange={(event) => {
                    setBusinessId(event.target.value);
                    setProducts([]);
                    setProductId("");
                    setResearch(null);
                    setError("");
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} — {business.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="discovery-product" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Product
                </label>
                <select
                  id="discovery-product"
                  value={productId}
                  onChange={(event) => {
                    setProductId(event.target.value);
                    setResearch(null);
                  }}
                  disabled={loadingProducts || products.length === 0}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {products.length === 0 ? (
                    <option value="">No products available</option>
                  ) : (
                    products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedProduct && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <Package size={19} className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedProduct.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {selectedProduct.description}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
                    Listed price: {selectedProduct.currency} {Number(selectedProduct.price).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Select target markets
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Select up to five countries. Your home country is excluded.
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  {selectedCountries.length}/5 selected
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableCountries.map((country) => {
                  const selected = selectedCountries.includes(country.code);

                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => toggleCountry(country.code)}
                      aria-pressed={selected}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${selected
                        ? "border-teal-600 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/50"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                        }`}
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {country.name}
                      </span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${selected
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-300 dark:border-slate-600"
                        }`}>
                        {selected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {products.length === 0 && !loadingProducts && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                Add a product to your catalogue before starting market research.
                <Link href="/products" className="ml-1 font-semibold underline">
                  Go to products
                </Link>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-lg text-xs leading-5 text-slate-400">
                Identical completed research is reused automatically. New
                research may use your Claude API budget.
              </p>

              <button
                type="button"
                onClick={handleResearch}
                disabled={
                  researching ||
                  loadingProducts ||
                  !productId ||
                  selectedCountries.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102B3F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
              >
                {researching ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Researching markets...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    Discover markets
                  </>
                )}
              </button>
            </div>
          </section>

          {researching && (
            <div className={`${panelClass} flex flex-col items-center px-6 py-14 text-center`}>
              <Loader2 size={34} className="animate-spin text-teal-600" />
              <h3 className="mt-5 font-bold text-slate-900 dark:text-white">
                Analysing your global opportunities
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Evaluating demand, competition, cultural fit and export
                practicality across your selected markets.
              </p>
            </div>
          )}

          {research && !researching && (
            <section className="space-y-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-teal-600" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Market comparison
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {research.results.length} markets analysed for {selectedProduct?.name ?? "your product"}.
                  </p>
                </div>

                <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold ${cached
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                  {cached ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
                  {cached ? "Reused cached research" : "New AI research"}
                </span>
              </div>

              {research.recommendedCountry && (
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/40 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                        Recommended market
                      </p>
                      <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                        {research.recommendedCountry}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {research.recommendationReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {research.summary && (
                <div className={`${panelClass} p-5`}>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Research summary
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {research.summary}
                  </p>
                </div>
              )}

              <ScoringMethodology />

              <MarketComparisonTable markets={research.results} />

              <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {research.results.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    recommended={market.country === research.recommendedCountry}
                  />
                ))}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                These are preliminary AI-generated assessments, not verified
                market research. Demand and competition levels are hypotheses.
                Validate market demand, pricing, regulations and export
                requirements independently before making business decisions.
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResearch(null);
                    setCached(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw size={15} />
                  Start another comparison
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Building2Placeholder() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
      <Globe2 size={30} />
    </div>
  );
}
