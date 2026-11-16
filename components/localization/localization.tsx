
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Languages,
  Loader2,
  RefreshCw,
  Sparkles,
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

type MarketingMessage = {
  channel: "SOCIAL_MEDIA" | "EMAIL" | "ADVERTISEMENT";
  headline: string;
  message: string;
};

type FAQ = {
  question: string;
  answer: string;
};

type Localization = {
  id: string;
  locale: string;
  country: string;
  countryCode: string;
  status: string;
  cacheKey: string | null;
  localizedTitle: string | null;
  localizedDescription: string | null;
  culturalGuidance: string[];
  seoKeywords: string[];
  marketingMessages: MarketingMessage[] | null;
  faqs: FAQ[] | null;
  modelUsed: string | null;
  createdAt: string;
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
  localizations: Localization[];
};

const LOCALES: Record<string, { value: string; label: string }[]> = {
  US: [{ value: "en-US", label: "English (United States)" }],
  GB: [{ value: "en-GB", label: "English (United Kingdom)" }],
  AE: [
    { value: "en-AE", label: "English (United Arab Emirates)" },
    { value: "ar-AE", label: "Arabic (United Arab Emirates)" },
  ],
  CA: [
    { value: "en-CA", label: "English (Canada)" },
    { value: "fr-CA", label: "French (Canada)" },
  ],
  AU: [{ value: "en-AU", label: "English (Australia)" }],
  SG: [
    { value: "en-SG", label: "English (Singapore)" },
    { value: "zh-SG", label: "Chinese (Singapore)" },
    { value: "ms-SG", label: "Malay (Singapore)" },
    { value: "ta-SG", label: "Tamil (Singapore)" },
  ],
};

const panelClass =
  "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ContentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-6 first:border-0 first:pt-0 dark:border-slate-800">
      <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Localization() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);

  const [businessId, setBusinessId] = useState("");
  const [productId, setProductId] = useState("");
  const [marketResultId, setMarketResultId] = useState("");
  const [locale, setLocale] = useState("");

  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load registered businesses.
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

  // Load products when the selected business changes.
  useEffect(() => {
    if (!businessId) return;

    const controller = new AbortController();

    async function loadProducts() {
      setLoadingProducts(true);
      setError("");
      setMarkets([]);
      setMarketResultId("");
      setLocale("");

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

  // Load completed market research and saved localizations.
  useEffect(() => {
    if (!productId) return;

    const controller = new AbortController();

    async function loadMarkets() {
      setLoadingMarkets(true);
      setError("");
      setSuccess("");
      setMarkets([]);
      setMarketResultId("");
      setLocale("");

      try {
        const response = await fetch(
          `/api/localization?productId=${encodeURIComponent(productId)}`,
          { signal: controller.signal },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load market research.");
        }

        const list: Market[] = data.marketResults ?? [];

        setMarkets(list);
        setMarketResultId(list[0]?.id ?? "");
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMarkets(false);
        }
      }
    }

    loadMarkets();

    return () => controller.abort();
  }, [productId]);

  const selectedBusiness = businesses.find(
    (business) => business.id === businessId,
  );

  const selectedProduct = products.find(
    (product) => product.id === productId,
  );

  const selectedMarket = markets.find(
    (market) => market.id === marketResultId,
  );

  const localeOptions = useMemo(
    () => LOCALES[selectedMarket?.countryCode.toUpperCase() ?? ""] ?? [],
    [selectedMarket],
  );

  const effectiveLocale = localeOptions.some(
  (option) => option.value === locale,
)
  ? locale
  : localeOptions[0]?.value ?? "";

  const existingLocalization = selectedMarket?.localizations.find(
  (item) =>
    item.locale === effectiveLocale && item.status === "COMPLETED",
);

  const blockedLocalization = selectedMarket?.localizations.find(
  (item) =>
    item.locale === effectiveLocale &&
    item.status !== "COMPLETED" &&
    (item.status === "PENDING" ||
      item.status === "PROCESSING" ||
      Boolean(item.cacheKey)),
);

  const displayLocalization = existingLocalization;

  async function handleGenerate() {
    if (!productId || !marketResultId || !effectiveLocale) {
      setError("Select a product, market and supported locale.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/localization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          marketResultId,
          locale: effectiveLocale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to generate localization.",
        );
      }

      const generated: Localization = data.localization;

      setMarkets((current) =>
        current.map((market) => {
          if (market.id !== marketResultId) {
            return market;
          }

          return {
            ...market,
            localizations: [
              generated,
              ...market.localizations.filter(
                (item) => item.id !== generated.id,
              ),
            ],
          };
        }),
      );

      setSuccess(
        data.cached
          ? "Your previously generated localization has been loaded."
          : "Product localization generated successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate localization.",
      );
    } finally {
      setGenerating(false);
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
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Languages size={16} />
          <span>Workspace</span>
          <span>/</span>
          <span className="text-teal-700 dark:text-teal-400">
            Localization
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Cultural Localization
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Adapt your product content, messaging and customer communication
          for international markets while preserving your product&apos;s
          original identity.
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Selection panel */}
      <section className={`${panelClass} space-y-6 p-5 sm:p-6`}>
        <SectionHeading
          title="Choose your product and target market"
          description="Localization uses existing completed market research. It does not create new market research."
        />

        {businesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <Globe2 className="mx-auto text-teal-600" size={32} />
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
              Create your business profile first
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Register your business and products before localizing content.
            </p>
            <Link
              href="/onboarding"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 text-sm font-semibold text-white dark:bg-teal-500 dark:text-slate-950"
            >
              Set up business
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="localization-business"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Business
                </label>
                <select
                  id="localization-business"
                  value={businessId}
                  onChange={(event) => setBusinessId(event.target.value)}
                  className={inputClass}
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
                {selectedBusiness && (
                  <p className="mt-2 text-xs text-slate-400">
                    Origin: {selectedBusiness.country}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="localization-product"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Product
                </label>
                <select
                  id="localization-product"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  disabled={loadingProducts || products.length === 0}
                  className={inputClass}
                >
                  {products.length === 0 && (
                    <option value="">No products available</option>
                  )}
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="mt-2 text-xs text-slate-400">
                    Original price: {selectedProduct.currency}{" "}
                    {selectedProduct.price}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="localization-market"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Target market
                </label>
                <select
                  id="localization-market"
                  value={marketResultId}
                  onChange={(event) =>
                    setMarketResultId(event.target.value)
                  }
                  disabled={loadingMarkets || markets.length === 0}
                  className={inputClass}
                >
                  {markets.length === 0 && (
                    <option value="">No completed research available</option>
                  )}
                  {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.country} · Rank #{market.rank} ·{" "}
                      {market.opportunityScore}/100
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="localization-locale"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Content language and locale
                </label>
                <select
                  id="localization-locale"
                  value={effectiveLocale}
                  onChange={(event) => setLocale(event.target.value)}
                  disabled={localeOptions.length === 0}
                  className={inputClass}
                >
                  {localeOptions.length === 0 && (
                    <option value="">No supported locale configured</option>
                  )}
                  {localeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingProducts || loadingMarkets ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={17} className="animate-spin" />
                Loading product and market information...
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Add a product to your catalogue before continuing.
                <Link
                  href="/products"
                  className="ml-1 font-semibold text-teal-700 dark:text-teal-400"
                >
                  Manage products
                </Link>
              </div>
            ) : markets.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                No completed market research exists for this product.
                Complete Market Discovery first.
                <Link
                  href="/market-discovery"
                  className="ml-1 font-semibold underline"
                >
                  Go to Market Discovery
                </Link>
              </div>
            ) : localeOptions.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Locale choices have not been configured for this market yet.
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Ready to localize
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Your original product information will remain unchanged.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={
                    generating ||
                    !productId ||
                    !marketResultId ||
                    !effectiveLocale ||
                    Boolean(blockedLocalization)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
                >
                  {generating ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : existingLocalization ? (
                    <RefreshCw size={17} />
                  ) : (
                    <Sparkles size={17} />
                  )}
                  {generating
                    ? "Generating..."
                    : existingLocalization
                      ? "Load saved localization"
                      : "Generate localization"}
                </button>
              </div>
            )}

            {blockedLocalization && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              >
                A previous localization request for this locale is still
                processing or requires reconciliation. Automatic retry is
                disabled to avoid duplicate Claude charges. Review its
                status and budget reservation before retrying.
              </div>
            )}
          </>
        )}
      </section>

      {/* Existing localization output */}
      {displayLocalization ? (
        <section className={`${panelClass} space-y-7 p-5 sm:p-7`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <CheckCircle2 size={13} />
                Localization ready
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
                Localized product content
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {displayLocalization.country} · {displayLocalization.locale}
              </p>
            </div>

            <span className="text-xs text-slate-400">
              Generated{" "}
              {new Date(displayLocalization.createdAt).toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              )}
            </span>
          </div>

          <ContentSection
            title="Localized product title"
          >
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {displayLocalization.localizedTitle}
              </p>
            </div>
          </ContentSection>

          <ContentSection title="Localized product description">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
              {displayLocalization.localizedDescription}
            </p>
          </ContentSection>

          <ContentSection title="Cultural guidance">
            <ul className="space-y-3">
              {displayLocalization.culturalGuidance.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-teal-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </ContentSection>

          <ContentSection title="SEO keywords">
            <div className="flex flex-wrap gap-2">
              {displayLocalization.seoKeywords.map((keyword, index) => (
                <span
                  key={`${keyword}-${index}`}
                  className="rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </ContentSection>

          <ContentSection title="Marketing messages">
            <div className="grid gap-4 md:grid-cols-2">
              {(displayLocalization.marketingMessages ?? []).map(
                (message, index) => (
                  <article
                    key={index}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {message.channel.replace("_", " ")}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {message.headline}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {message.message}
                    </p>
                  </article>
                ),
              )}
            </div>
          </ContentSection>

          <ContentSection title="Customer FAQs">
            <div className="space-y-4">
              {(displayLocalization.faqs ?? []).map((faq, index) => (
                <article
                  key={index}
                  className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70"
                >
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {faq.question}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </ContentSection>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            AI-generated cultural and marketing suggestions are preliminary.
            Verify translations, product claims and customer-facing policies
            before publishing. This content is not legal or compliance advice.
          </div>
        </section>
      ) : (
        selectedMarket &&
        effectiveLocale && (
          <section className={`${panelClass} px-6 py-12 text-center`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <Languages size={27} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Your localized content will appear here
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Choose your preferred locale and generate localized product
              content for {selectedMarket.country}.
            </p>
          </section>
        )
      )}
    </div>
  );
}
