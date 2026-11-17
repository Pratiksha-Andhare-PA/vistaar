
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    Globe,
    Loader2,
    Store,
} from "lucide-react";

type Business = {
    id: string;
    name: string;
    country: string;
    city: string;
};

type Product = {
    id: string;
    businessId: string;
    name: string;
};

type Localization = {
    id: string;
    locale: string;
    status: string;
    localizedTitle: string | null;
    localizedDescription: string | null;
};

type Market = {
    id: string;
    country: string;
    countryCode: string;
    localizations: Localization[];
};

type PricingScenario = {
    id: string;
    title: string | null;
    targetCurrency: string;
    recommendedPrice: string | number;
    marketResultId: string;
    marketResult: {
        country: string;
        countryCode: string;
    };
};

type Storefront = {
    id: string;
    slug: string;
    status: "DRAFT" | "APPROVED" | "PUBLISHED";
    productId: string;
    marketResultId: string;
    localizationId: string;
    pricingScenarioId: string;
    locale: string;
    country: string;
    countryCode: string;
    productName: string;
    localizedTitle: string;
    localizedDescription: string;
    businessName: string;
    currency: string;
    price: string | number;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
};

const panelClass =
    "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

const statusStyles: Record<Storefront["status"], string> = {
    DRAFT:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    APPROVED:
        "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    PUBLISHED:
        "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

export function MyStorefronts() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [scenarios, setScenarios] = useState<PricingScenario[]>([]);
    const [storefronts, setStorefronts] = useState<Storefront[]>([]);

    const [businessId, setBusinessId] = useState("");
    const [productId, setProductId] = useState("");
    const [marketResultId, setMarketResultId] = useState("");
    const [localizationId, setLocalizationId] = useState("");
    const [pricingScenarioId, setPricingScenarioId] = useState("");

    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const [creating, setCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState("");

    const [success, setSuccess] = useState("");

    const [error, setError] = useState("");

    const selectedMarket = useMemo(
        () => markets.find((market) => market.id === marketResultId) ?? null,
        [markets, marketResultId],
    );

    const completedLocalizations = useMemo(
        () =>
            selectedMarket?.localizations.filter(
                (localization) =>
                    localization.status === "COMPLETED" &&
                    Boolean(localization.localizedTitle?.trim()) &&
                    Boolean(localization.localizedDescription?.trim()),
            ) ?? [],
        [selectedMarket],
    );

    const availableScenarios = useMemo(
        () =>
            scenarios.filter(
                (scenario) => scenario.marketResultId === marketResultId,
            ),
        [scenarios, marketResultId],
    );

    const loadStorefronts = useCallback(async (selectedProductId: string) => {
        const response = await fetch(
            `/api/storefronts?productId=${encodeURIComponent(selectedProductId)}`,
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to load storefronts.");
        }

        setStorefronts(data.storefronts ?? []);
    }, []);

    useEffect(() => {
        async function loadBusinesses() {
            try {
                const response = await fetch("/api/business");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load businesses.");
                }

                const list: Business[] = data.businesses ?? [];
                setBusinesses(list);

                if (list.length > 0) {
                    setBusinessId(list[0].id);
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Unable to load businesses.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadBusinesses();
    }, []);

    useEffect(() => {
        if (!businessId) return;

        async function loadProducts() {
            setLoadingProducts(true);
            setProductId("");
            setMarkets([]);
            setScenarios([]);
            setStorefronts([]);
            setMarketResultId("");
            setLocalizationId("");
            setPricingScenarioId("");

            try {
                const response = await fetch(
                    `/api/products?businessId=${encodeURIComponent(businessId)}`,
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load products.");
                }

                const list: Product[] = data.products ?? [];
                setProducts(list);

                if (list.length > 0) {
                    setProductId(list[0].id);
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Unable to load products.",
                );
            } finally {
                setLoadingProducts(false);
            }
        }

        loadProducts();
    }, [businessId]);

    useEffect(() => {
        if (!productId) return;

        async function loadProductData() {
            setLoadingData(true);
            setError("");
            setMarketResultId("");
            setLocalizationId("");
            setPricingScenarioId("");

            try {
                const [localizationResponse, pricingResponse] = await Promise.all([
                    fetch(
                        `/api/localization?productId=${encodeURIComponent(productId)}`,
                    ),
                    fetch(`/api/pricing?productId=${encodeURIComponent(productId)}`),
                    loadStorefronts(productId),
                ]);

                const localizationData = await localizationResponse.json();
                const pricingData = await pricingResponse.json();

                if (!localizationResponse.ok) {
                    throw new Error(
                        localizationData.error || "Unable to load localizations.",
                    );
                }

                if (!pricingResponse.ok) {
                    throw new Error(
                        pricingData.error || "Unable to load pricing scenarios.",
                    );
                }

                const marketList: Market[] = localizationData.marketResults ?? [];
                const scenarioList: PricingScenario[] = pricingData.scenarios ?? [];

                setMarkets(marketList);
                setScenarios(scenarioList);

                if (marketList.length > 0) {
                    setMarketResultId(marketList[0].id);
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load storefront data.",
                );
            } finally {
                setLoadingData(false);
            }
        }

        loadProductData();
    }, [productId, loadStorefronts]);

    async function createStorefront() {
        const selectedLocalization = completedLocalizations.find(
            (localization) => localization.id === localizationId,
        );

        if (
            !productId ||
            !marketResultId ||
            !localizationId ||
            !pricingScenarioId ||
            !selectedLocalization
        ) {
            setError("Please select all storefront details.");
            return;
        }

        setCreating(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/storefronts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId,
                    marketResultId,
                    localizationId,
                    pricingScenarioId,
                    locale: selectedLocalization.locale,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to create storefront.");
            }

            if (!data.storefront) {
                throw new Error("The server did not return the created storefront.");
            }

            setStorefronts((current) => [
                data.storefront as Storefront,
                ...current,
            ]);

            setSuccess("Your storefront draft has been created successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create storefront.",
            );
        } finally {
            setCreating(false);
        }
    }

    async function updateStorefront(
        id: string,
        action: "approve" | "publish" | "unpublish",
    ) {
        setUpdatingId(id);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/storefronts/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to update storefront.");
            }

            if (!data.storefront) {
                throw new Error("The server did not return the updated storefront.");
            }

            setStorefronts((current) =>
                current.map((storefront) =>
                    storefront.id === id
                        ? (data.storefront as Storefront)
                        : storefront,
                ),
            );

            setSuccess(data.message || "Storefront updated successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update storefront.",
            );
        } finally {
            setUpdatingId("");
        }
    }
    return (
        <div className="mx-auto w-full max-w-7xl min-w-0 space-y-7 px-4 pt-8 pb-10 sm:px-6 sm:pt-10 lg:px-8">
            <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400">
                    <Store size={18} />
                    GLOBAL STOREFRONTS
                </div>

                <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                    My Storefronts
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Create localized product pages for your target international markets
                    using your saved translations and global pricing.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
                >
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    {success}
                </div>
            )}



            {loading ? (
                <div className="flex min-h-80 items-center justify-center">
                    <Loader2 className="animate-spin text-teal-600" size={28} />
                </div>
            ) : businesses.length === 0 ? (
                <div className={`${panelClass} p-8 text-center`}>
                    <Store className="mx-auto text-slate-400" size={32} />
                    <h2 className="mt-4 font-bold text-slate-900 dark:text-white">
                        No business profile found
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Create your business profile before setting up a storefront.
                    </p>
                    <a
                        href="/onboarding"
                        className="mt-5 inline-flex rounded-xl bg-[#087E70] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#06695e]"
                    >
                        Set up business
                    </a>
                </div>
            ) : (
                <div className={`${panelClass} p-5 sm:p-6`}>
                    <h2 className="font-bold text-slate-900 dark:text-white">
                        Create a storefront
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Select an existing product, completed localization and saved
                        pricing scenario.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="storefront-business"
                                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Business
                            </label>
                            <select
                                id="storefront-business"
                                value={businessId}
                                onChange={(event) => setBusinessId(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                                {businesses.map((business) => (
                                    <option key={business.id} value={business.id}>
                                        {business.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="storefront-product"
                                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Product
                            </label>
                            <select
                                id="storefront-product"
                                value={productId}
                                onChange={(event) => setProductId(event.target.value)}
                                disabled={loadingProducts || products.length === 0}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                        </div>

                        <div>
                            <label
                                htmlFor="storefront-market"
                                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Target market
                            </label>
                            <select
                                id="storefront-market"
                                value={marketResultId}
                                onChange={(event) => {
                                    setMarketResultId(event.target.value);
                                    setLocalizationId("");
                                    setPricingScenarioId("");
                                }}
                                disabled={loadingData || markets.length === 0}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                                {markets.length === 0 && (
                                    <option value="">No researched markets available</option>
                                )}
                                {markets.map((market) => (
                                    <option key={market.id} value={market.id}>
                                        {market.country}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="storefront-localization"
                                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Completed localization
                            </label>
                            <select
                                id="storefront-localization"
                                value={localizationId}
                                onChange={(event) => setLocalizationId(event.target.value)}
                                disabled={completedLocalizations.length === 0}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                                <option value="">Select localization</option>
                                {completedLocalizations.map((localization) => (
                                    <option key={localization.id} value={localization.id}>
                                        {localization.locale} — {localization.localizedTitle}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label
                                htmlFor="storefront-pricing"
                                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Saved global pricing
                            </label>
                            <select
                                id="storefront-pricing"
                                value={pricingScenarioId}
                                onChange={(event) => setPricingScenarioId(event.target.value)}
                                disabled={availableScenarios.length === 0}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                                <option value="">Select pricing scenario</option>
                                {availableScenarios.map((scenario) => (
                                    <option key={scenario.id} value={scenario.id}>
                                        {scenario.title || scenario.marketResult.country} —{" "}
                                        {scenario.targetCurrency}{" "}
                                        {Number(scenario.recommendedPrice).toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            onClick={createStorefront}
                            disabled={
                                creating ||
                                loadingData ||
                                !productId ||
                                !marketResultId ||
                                !localizationId ||
                                !pricingScenarioId
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#087E70] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#06695e] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {creating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating draft...
                                </>
                            ) : (
                                <>
                                    <Store size={16} />
                                    Create Draft
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                        {loadingData
                            ? "Loading saved localization and pricing data..."
                            : "Only completed localizations and saved pricing scenarios are available."}
                    </p>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Your storefronts
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Manage your international product pages.
                        </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {storefronts.length} total
                    </span>
                </div>

                {storefronts.length === 0 ? (
                    <div className={`${panelClass} p-8 text-center`}>
                        <Globe className="mx-auto text-slate-400" size={32} />
                        <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
                            No storefronts yet
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Select your product, localization and pricing above to create
                            your first international storefront.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {storefronts.map((storefront) => (
                            <div
                                key={storefront.id}
                                className={`${panelClass} p-5`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            {storefront.productName}
                                        </p>

                                        <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                            {storefront.localizedTitle}
                                        </h3>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[storefront.status]}`}
                                    >
                                        {storefront.status}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Target market
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                            {storefront.country}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Localized price
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                            {storefront.currency}{" "}
                                            {Number(storefront.price).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    Locale: {storefront.locale}
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {storefront.status === "DRAFT" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateStorefront(storefront.id, "approve")
                                            }
                                            disabled={updatingId === storefront.id}
                                            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                                        >
                                            {updatingId === storefront.id ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={15} />
                                            )}
                                            Approve
                                        </button>
                                    )}

                                    {storefront.status === "APPROVED" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateStorefront(storefront.id, "publish")
                                            }
                                            disabled={updatingId === storefront.id}
                                            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                                        >
                                            {updatingId === storefront.id ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : (
                                                <Globe size={15} />
                                            )}
                                            Publish
                                        </button>
                                    )}

                                    {storefront.status === "PUBLISHED" && (
                                        <>
                                            <a
                                                href={`/store/${storefront.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-400 dark:hover:bg-teal-950"
                                            >
                                                <ExternalLink size={15} />
                                                View live page
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateStorefront(
                                                        storefront.id,
                                                        "unpublish",
                                                    )
                                                }
                                                disabled={updatingId === storefront.id}
                                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                {updatingId === storefront.id
                                                    ? "Updating..."
                                                    : "Unpublish"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
