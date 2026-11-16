
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Calculator,
    CheckCircle2,
    Clock,
    Loader2,
    Save,
    Trash2,
} from "lucide-react";

import {
    calculateGlobalPrice,
    type PricingInputs,
} from "@/lib/pricing/pricing-calculator";
import { PricingBreakdown } from "./pricing-breakdown";

interface GlobalPricingProps {
    initialProductId?: string;
    initialMarketResultId?: string;
}

interface Business {
    id: string;
    name: string;
}

interface Product {
    id: string;
    businessId: string;
    name: string;
    currency: string;
    price: string | number;
}

interface Market {
    id: string;
    country: string;
    countryCode: string;
    rank: number;
    opportunityScore: number;
    suggestedCurrency: string | null;
}

interface Research {
    id: string;
    summary: string | null;
    recommendedCountry: string | null;
    results: Market[];
}

interface PricingScenario {
    id: string;
    title: string | null;
    targetCurrency: string;
    recommendedPrice: string | number;
    createdAt: string;
    marketResult: {
        country: string;
        countryCode: string;
    };
}

const DEFAULT_INPUTS: PricingInputs = {
    manufacturingCost: 0,
    packagingCost: 0,
    shippingCost: 0,
    exchangeRate: 0,
    customsDutyRate: 0,
    platformFeeRate: 0,
    paymentFeeRate: 0,
    taxRate: 0,
    desiredProfitMargin: 20,
};

const COUNTRY_CURRENCIES: Record<string, string> = {
    AE: "AED",
    GB: "GBP",
    US: "USD",
    IN: "INR",
    DE: "EUR",
    FR: "EUR",
    IT: "EUR",
    ES: "EUR",
    NL: "EUR",
    NZ: "NZD",
    CH: "CHF",
    SA: "SAR",
};

function getCurrencyForMarket(market: Market): string {
    const countryCode = market.countryCode.trim().toUpperCase();

    return (
        COUNTRY_CURRENCIES[countryCode] ??
        (market.suggestedCurrency &&
            /^[A-Z]{3}$/.test(market.suggestedCurrency.trim().toUpperCase())
            ? market.suggestedCurrency.trim().toUpperCase()
            : "")
    );
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

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
    }).format(new Date(value));
}

function NumberField({
    label,
    value,
    onChange,
    suffix,
    description,
    min = 0,
    step = "0.01",
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
    description?: string;
    min?: number;
    step?: string;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
                {suffix && (
                    <span className="ml-1 text-xs font-normal text-slate-500">
                        ({suffix})
                    </span>
                )}
            </label>

            <input
                type="number"
                min={min}
                step={step}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value === ""
                            ? 0
                            : Number(event.target.value),
                    )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            )}
        </div>
    );
}

export function GlobalPricing({
    initialProductId = "",
    initialMarketResultId = "",
}: GlobalPricingProps) {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [researches, setResearches] = useState<Research[]>([]);
    const [scenarios, setScenarios] = useState<PricingScenario[]>([]);

    const [selectedBusinessId, setSelectedBusinessId] = useState("");
    const [selectedProductId, setSelectedProductId] =
        useState(initialProductId);
    const [selectedMarketId, setSelectedMarketId] =
        useState(initialMarketResultId);

    const [targetCurrency, setTargetCurrency] = useState("");
    useEffect(() => {
        console.log("Target currency state:", targetCurrency);
    }, [targetCurrency]);
    const [scenarioTitle, setScenarioTitle] = useState("");
    const [exchangeRateSource, setExchangeRateSource] = useState("");
    const [exchangeRateDate, setExchangeRateDate] = useState("");

    const [inputs, setInputs] = useState<PricingInputs>({
        ...DEFAULT_INPUTS,
    });

    const [loadingBusinesses, setLoadingBusinesses] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingResearch, setLoadingResearch] = useState(false);
    const [loadingScenarios, setLoadingScenarios] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const selectedProduct = products.find(
        (product) => product.id === selectedProductId,
    );

    const allMarkets = researches.flatMap(
        (research) => research.results,
    );

    const selectedMarket = allMarkets.find(
        (market) => market.id === selectedMarketId,
    );

    const calculation = useMemo(() => {
        try {
            return {
                result: calculateGlobalPrice(inputs),
                error: "",
            };
        } catch (calculationError) {
            return {
                result: null,
                error:
                    calculationError instanceof Error
                        ? calculationError.message
                        : "Unable to calculate pricing.",
            };
        }
    }, [inputs]);

    const updateInput = (
        field: keyof PricingInputs,
        value: number,
    ) => {
        setInputs((current) => ({
            ...current,
            [field]: value,
        }));
    };

    // Load registered businesses.
    useEffect(() => {
        let cancelled = false;

        async function findProductBusiness(
            productId: string,
            availableBusinesses: Business[],
        ): Promise<Product | null> {
            for (const business of availableBusinesses) {
                const response = await fetch(
                    `/api/products?businessId=${encodeURIComponent(business.id)}`,
                );

                if (!response.ok) {
                    continue;
                }

                const data = await response.json();

                const match = (data.products ?? []).find(
                    (product: Product) => product.id === productId,
                );

                if (match) {
                    if (!cancelled) {
                        setProducts(data.products ?? []);
                    }

                    return match;
                }
            }

            return null;
        }

        async function loadBusinesses() {
            try {
                const response = await fetch("/api/business");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ?? "Unable to load businesses.",
                    );
                }

                if (cancelled) return;

                const availableBusinesses: Business[] =
                    data.businesses ?? [];

                setBusinesses(availableBusinesses);

                if (initialProductId) {
                    const matchingProduct = await findProductBusiness(
                        initialProductId,
                        availableBusinesses,
                    );

                    if (cancelled) return;

                    if (matchingProduct) {
                        setSelectedBusinessId(
                            matchingProduct.businessId,
                        );
                    } else if (availableBusinesses.length > 0) {
                        setSelectedBusinessId(
                            availableBusinesses[0].id,
                        );
                    }
                } else if (availableBusinesses.length > 0) {
                    setSelectedBusinessId(availableBusinesses[0].id);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Unable to load businesses.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingBusinesses(false);
                }
            }
        }

        void loadBusinesses();

        return () => {
            cancelled = true;
        };
    }, [initialProductId]);

    // Load products when the selected business changes.
    useEffect(() => {
        if (!selectedBusinessId) {
            return;
        }

        let cancelled = false;

        async function loadProducts() {
            setLoadingProducts(true);
            setError("");

            try {
                const response = await fetch(
                    `/api/products?businessId=${encodeURIComponent(selectedBusinessId)}`,
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ?? "Unable to load products.",
                    );
                }

                if (cancelled) return;

                const availableProducts: Product[] =
                    data.products ?? [];

                setProducts(availableProducts);

                const matchingProduct = availableProducts.find(
                    (product) => product.id === initialProductId,
                );

                setSelectedProductId((current) => {
                    if (
                        current &&
                        availableProducts.some(
                            (product) => product.id === current,
                        )
                    ) {
                        return current;
                    }

                    return (
                        matchingProduct?.id ??
                        availableProducts[0]?.id ??
                        ""
                    );
                });
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Unable to load products.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingProducts(false);
                }
            }
        }

        void loadProducts();

        return () => {
            cancelled = true;
        };
    }, [selectedBusinessId, initialProductId]);


    // Load completed market research and saved scenarios.
    useEffect(() => {
        let cancelled = false;

        if (!selectedProductId) {
            return () => {
                cancelled = true;
            };
        }

        async function loadProductData() {
            setLoadingResearch(true);
            setLoadingScenarios(true);
            setError("");

            try {
                const [researchResponse, scenarioResponse] =
                    await Promise.all([
                        fetch(
                            `/api/market-research?productId=${encodeURIComponent(selectedProductId)}`,
                        ),
                        fetch(
                            `/api/pricing?productId=${encodeURIComponent(selectedProductId)}`,
                        ),
                    ]);

                const [researchData, scenarioData] =
                    await Promise.all([
                        researchResponse.json(),
                        scenarioResponse.json(),
                    ]);

                if (!researchResponse.ok) {
                    throw new Error(
                        researchData.error ??
                        "Unable to load market research.",
                    );
                }

                if (!scenarioResponse.ok) {
                    throw new Error(
                        scenarioData.error ??
                        "Unable to load saved scenarios.",
                    );
                }

                if (cancelled) return;

                const availableResearches: Research[] =
                    researchData.researches ?? [];

                const availableMarkets = availableResearches.flatMap(
                    (research) => research.results,
                );

                const requestedMarket = availableMarkets.find(
                    (market) => market.id === initialMarketResultId,
                );

                // Prefer the market requested in the URL, otherwise
                // select the first available researched market.
                const marketToSelect =
                    requestedMarket ?? availableMarkets[0];

                setResearches(availableResearches);
                setScenarios(scenarioData.scenarios ?? []);

                setSelectedMarketId(marketToSelect?.id ?? "");

                setTargetCurrency(
                    marketToSelect
                        ? getCurrencyForMarket(marketToSelect)
                        : "",
                );
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Unable to load product pricing data.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingResearch(false);
                    setLoadingScenarios(false);
                }
            }
        }

        void loadProductData();

        return () => {
            cancelled = true;
        };
    }, [selectedProductId, initialMarketResultId]);


    async function saveScenario() {
        if (!selectedProduct || !selectedMarket) {
            setError(
                "Select a product and a researched target market.",
            );
            return;
        }

        if (!/^[A-Z]{3}$/.test(targetCurrency)) {
            setError("Enter a valid three-letter target currency code.");
            return;
        }

        if (!calculation.result) {
            setError(
                calculation.error || "Check your pricing inputs.",
            );
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/pricing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    marketResultId: selectedMarket.id,
                    title: scenarioTitle.trim() || undefined,
                    targetCurrency,
                    exchangeRateSource:
                        exchangeRateSource.trim() || undefined,
                    exchangeRateDate: exchangeRateDate
                        ? new Date(
                            `${exchangeRateDate}T00:00:00.000Z`,
                        ).toISOString()
                        : undefined,
                    inputs,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ?? "Unable to save pricing scenario.",
                );
            }

            setSuccess("Pricing scenario saved successfully.");
            setScenarioTitle("");

            const scenariosResponse = await fetch(
                `/api/pricing?productId=${encodeURIComponent(selectedProduct.id)}`,
            );

            const scenariosData = await scenariosResponse.json();

            if (scenariosResponse.ok) {
                setScenarios(scenariosData.scenarios ?? []);
            }
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Unable to save pricing scenario.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteScenario(id: string) {
        if (!window.confirm("Delete this pricing scenario?")) {
            return;
        }

        setDeletingId(id);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/pricing/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ?? "Unable to delete scenario.",
                );
            }

            setScenarios((current) =>
                current.filter((scenario) => scenario.id !== id),
            );

            setSuccess("Pricing scenario deleted.");
        } catch (deleteError) {
            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : "Unable to delete scenario.",
            );
        } finally {
            setDeletingId("");
        }
    }

    const inputSections = [
        {
            title: "Production and logistics costs",
            description:
                "Enter your costs in the product's original currency.",
            fields: [
                {
                    key: "manufacturingCost" as const,
                    label: "Manufacturing cost",
                    step: "0.01",
                },
                {
                    key: "packagingCost" as const,
                    label: "Packaging cost",
                    step: "0.01",
                },
                {
                    key: "shippingCost" as const,
                    label: "Shipping cost",
                    step: "0.01",
                },
            ],
        },
        {
            title: "International conversion",
            description:
                "Enter how many target-currency units equal one source-currency unit.",
            fields: [
                {
                    key: "exchangeRate" as const,
                    label: "Exchange rate",
                    step: "0.00000001",
                },
            ],
        },
        {
            title: "Duties, fees and profit",
            description:
                "These percentages are simplified pricing assumptions.",
            fields: [
                {
                    key: "customsDutyRate" as const,
                    label: "Estimated customs duty",
                    step: "0.01",
                },
                {
                    key: "platformFeeRate" as const,
                    label: "Platform fee",
                    step: "0.01",
                },
                {
                    key: "paymentFeeRate" as const,
                    label: "Payment processing fee",
                    step: "0.01",
                },
                {
                    key: "taxRate" as const,
                    label: "Estimated tax",
                    step: "0.01",
                },
                {
                    key: "desiredProfitMargin" as const,
                    label: "Desired profit margin",
                    step: "0.01",
                },
            ],
        },
    ] as const;

    return (
        <div className="mx-auto w-full max-w-7xl min-w-0 space-y-8 px-4 pt-8 pb-10 sm:px-6 sm:pt-10 lg:px-8">
            <div>
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-teal-100 p-2.5 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        <Calculator size={22} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Global Pricing
                        </h1>

                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Build a cost-based international selling price for
                            each target market.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300"
                >
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Select product and target market
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Business
                        </label>

                        <select
                            value={selectedBusinessId}
                            onChange={(event) => {
                                setSelectedBusinessId(event.target.value);
                                setSelectedProductId("");
                                setSelectedMarketId("");

                                setProducts([]);
                                setResearches([]);
                                setScenarios([]);

                                setTargetCurrency("");
                                setInputs({ ...DEFAULT_INPUTS });

                                setLoadingResearch(false);
                                setLoadingScenarios(false);

                                setError("");
                                setSuccess("");
                            }}
                            disabled={loadingBusinesses}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">
                                {loadingBusinesses
                                    ? "Loading businesses..."
                                    : "Select business"}
                            </option>

                            {businesses.map((business) => (
                                <option
                                    key={business.id}
                                    value={business.id}
                                >
                                    {business.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Product
                        </label>

                        <select
                            value={selectedProductId}
                            onChange={(event) => {
                                setSelectedProductId(event.target.value);
                                setSelectedMarketId("");

                                setResearches([]);
                                setScenarios([]);

                                setTargetCurrency("");
                                setInputs({ ...DEFAULT_INPUTS });

                                setLoadingResearch(false);
                                setLoadingScenarios(false);

                                setError("");
                                setSuccess("");
                            }}
                            disabled={
                                !selectedBusinessId ||
                                loadingProducts ||
                                products.length === 0
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">
                                {loadingProducts
                                    ? "Loading products..."
                                    : "Select product"}
                            </option>

                            {products.map((product) => (
                                <option
                                    key={product.id}
                                    value={product.id}
                                >
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Target market
                        </label>

                        <select
                            value={selectedMarketId}
                            onChange={(event) => {
                                const marketId = event.target.value;

                                const market = allMarkets.find(
                                    (item) => item.id === marketId,
                                );

                                const currency = market
                                    ? getCurrencyForMarket(market)
                                    : "";

                                console.log("Selected market:", market);
                                console.log("Resolved currency:", currency);

                                setSelectedMarketId(marketId);
                                setTargetCurrency(currency);
                            }}
                            disabled={
                                loadingResearch ||
                                allMarkets.length === 0
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">
                                {loadingResearch
                                    ? "Loading markets..."
                                    : "Select researched market"}
                            </option>

                            {allMarkets.map((market) => (
                                <option
                                    key={market.id}
                                    value={market.id}
                                >
                                    {market.country} · Rank #{market.rank}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedProduct && (
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                        Domestic product price:{" "}
                        {formatCurrency(
                            Number(selectedProduct.price),
                            selectedProduct.currency,
                        )}
                        {" · "}Source currency: {selectedProduct.currency}
                    </p>
                )}

                {!loadingBusinesses && businesses.length === 0 && (
                    <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                        Create a business profile before calculating global
                        prices.
                    </p>
                )}

                {!loadingProducts &&
                    selectedBusinessId &&
                    products.length === 0 && (
                        <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                            Add a product to this business before continuing.
                        </p>
                    )}

                {!loadingResearch &&
                    selectedProductId &&
                    allMarkets.length === 0 && (
                        <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                            No completed market research exists for this
                            product. Run Market Discovery first.
                        </p>
                    )}
            </section>

            {selectedProduct && selectedMarket && (
                <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <section className="min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Pricing assumptions
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {selectedProduct.currency} costs converted
                                into {targetCurrency || "your target currency"}{" "}
                                for {selectedMarket.country}.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Target currency
                                </label>

                                <input
                                    value={targetCurrency}
                                    onChange={(event) =>
                                        setTargetCurrency(
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    maxLength={3}
                                    placeholder="USD"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />

                                {! /^[A-Z]{3}$/.test(targetCurrency.trim()) && (
                                    <p className="text-xs text-red-500">
                                        Enter a valid three-letter currency code.
                                    </p>
                                )}
                            </div>

                            <NumberField
                                label="Exchange rate"
                                value={inputs.exchangeRate}
                                step="0.00000001"
                                onChange={(value) =>
                                    updateInput("exchangeRate", value)
                                }
                                description={`1 ${selectedProduct.currency} = ${inputs.exchangeRate} ${targetCurrency || "target currency"}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Exchange rate source
                            </label>

                            <input
                                value={exchangeRateSource}
                                onChange={(event) =>
                                    setExchangeRateSource(event.target.value)
                                }
                                placeholder="e.g. Bank, exchange provider or source URL"
                                maxLength={200}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Exchange rate date
                            </label>

                            <input
                                type="date"
                                value={exchangeRateDate}
                                onChange={(event) =>
                                    setExchangeRateDate(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        {inputSections.map((section) => (
                            <div
                                key={section.title}
                                className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800"
                            >
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {section.title}
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {section.description}
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {section.fields.map((field) => {
                                        const isRate =
                                            field.key !== "manufacturingCost" &&
                                            field.key !== "packagingCost" &&
                                            field.key !== "shippingCost" &&
                                            field.key !== "exchangeRate";

                                        return (
                                            <NumberField
                                                key={field.key}
                                                label={field.label}
                                                value={inputs[field.key]}
                                                onChange={(value) =>
                                                    updateInput(
                                                        field.key,
                                                        value,
                                                    )
                                                }
                                                suffix={
                                                    isRate
                                                        ? "%"
                                                        : field.key ===
                                                            "exchangeRate"
                                                            ? undefined
                                                            : selectedProduct.currency
                                                }
                                                step={field.step}
                                                min={0}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {calculation.error && (
                            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                {calculation.error}
                            </p>
                        )}

                        <div className="space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Scenario name (optional)
                                </label>

                                <input
                                    value={scenarioTitle}
                                    onChange={(event) =>
                                        setScenarioTitle(event.target.value)
                                    }
                                    maxLength={100}
                                    placeholder="e.g. US market - standard shipping"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={saveScenario}
                                disabled={
                                    saving ||
                                    !calculation.result ||
                                    !/^[A-Z]{3}$/.test(targetCurrency)
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
                            >
                                {saving ? (
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={18} />
                                )}

                                {saving
                                    ? "Saving scenario..."
                                    : "Save pricing scenario"}
                            </button>
                        </div>
                    </section>

                    <div className="space-y-6">
                        {calculation.result &&
                            /^[A-Z]{3}$/.test(targetCurrency) && (
                                <PricingBreakdown
                                    breakdown={calculation.result}
                                    targetCurrency={targetCurrency}
                                    sourceCurrency={selectedProduct.currency}
                                />
                            )}
                    </div>
                </div>
            )}

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Saved pricing scenarios
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Your saved assumptions and calculated prices for each
                        market.
                    </p>
                </div>

                {loadingScenarios ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800">
                        <Loader2 size={17} className="animate-spin" />
                        Loading saved scenarios...
                    </div>
                ) : scenarios.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                        <Clock
                            size={25}
                            className="mx-auto text-slate-400"
                        />

                        <p className="mt-3 font-medium text-slate-800 dark:text-slate-200">
                            No saved pricing scenarios yet
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Calculate a price and save your first scenario.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        {scenarios.map((scenario) => (
                            <div
                                key={scenario.id}
                                className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-800"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {scenario.title ||
                                            scenario.marketResult.country}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {scenario.marketResult.country} ·{" "}
                                        {formatDate(scenario.createdAt)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <p className="font-semibold tabular-nums text-slate-900 dark:text-white">
                                        {formatCurrency(
                                            Number(scenario.recommendedPrice),
                                            scenario.targetCurrency,
                                        )}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteScenario(scenario.id)
                                        }
                                        disabled={
                                            deletingId === scenario.id
                                        }
                                        aria-label={`Delete scenario for ${scenario.marketResult.country}`}
                                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"
                                    >
                                        {deletingId === scenario.id ? (
                                            <Loader2
                                                size={17}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Trash2 size={17} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
