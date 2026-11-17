
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    FileCheck2,
    Loader2,
    ShieldCheck,
} from "lucide-react";

type Business = {
    id: string;
    name: string;
    country: string;
    category: string;
};

type Product = {
    id: string;
    businessId: string;
    name: string;
};

type Market = {
    id: string;
    country: string;
    countryCode: string;
    rank: number;
};

type ChecklistItem = {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: "REQUIRED" | "RECOMMENDED" | "INFORMATIONAL";
    sourceName: string | null;
    sourceUrl: string | null;
    status: "PENDING" | "COMPLETED" | "NOT_APPLICABLE";
    notes: string | null;
};

type Assessment = {
    id: string;
    status: "IN_PROGRESS" | "COMPLETED";
    totalItems: number;
    completedItems: number;
    items: ChecklistItem[];
    marketResult: Market;
    product: {
        id: string;
        name: string;
    };
};

const panelClass =
    "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

const priorityStyles = {
    REQUIRED:
        "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    RECOMMENDED:
        "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    INFORMATIONAL:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const categoryLabels: Record<string, string> = {
    BUSINESS_REGISTRATION: "Business registration",
    EXPORT_REGISTRATION: "Export registration",
    PRODUCT_CLASSIFICATION: "Product classification",
    PRODUCT_COMPLIANCE: "Product compliance",
    DOCUMENTATION: "Documentation",
    CUSTOMS: "Customs",
    PACKAGING_LABELING: "Packaging and labelling",
    SHIPPING: "Shipping",
};

export function ExportReadiness() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);

    const [businessId, setBusinessId] = useState("");
    const [productId, setProductId] = useState("");
    const [marketResultId, setMarketResultId] = useState("");

    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingMarkets, setLoadingMarkets] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [updatingItem, setUpdatingItem] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const selectedAssessment = useMemo(
        () =>
            assessments.find(
                (assessment) =>
                    assessment.marketResult?.id === marketResultId,
            ) ?? null,
        [assessments, marketResultId],
    );

    useEffect(() => {
        async function loadBusinesses() {
            try {
                const response = await fetch("/api/business");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load businesses.");
                }

                const records = data.businesses ?? data;
                const list = Array.isArray(records) ? records : [];

                setBusinesses(list);

                if (list.length > 0) {
                    setBusinessId(list[0].id);
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load businesses.",
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
            setMarketResultId("");
            setAssessments([]);

            try {
                const response = await fetch(
                    `/api/products?businessId=${encodeURIComponent(businessId)}`,
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load products.");
                }

                setProducts(data.products ?? []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load products.",
                );
            } finally {
                setLoadingProducts(false);
            }
        }

        loadProducts();
    }, [businessId]);

    useEffect(() => {
        if (!productId) return;

        async function loadMarkets() {
            setLoadingMarkets(true);
            setMarketResultId("");
            setAssessments([]);
            setError("");

            try {
                const response = await fetch(
                    `/api/market-research?productId=${encodeURIComponent(productId)}`,
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load market research.");
                }

                const research = data.researches ?? [];
                const latest = research[0];

                const results = latest?.results ?? [];

                setMarkets(results);

                if (results.length > 0) {
                    setMarketResultId(results[0].id);
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load market research.",
                );
            } finally {
                setLoadingMarkets(false);
            }
        }

        loadMarkets();
    }, [productId]);

    useEffect(() => {
        if (!productId) return;

        async function loadAssessments() {
            try {
                const response = await fetch(
                    `/api/export-readiness?productId=${encodeURIComponent(productId)}`,
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Unable to load assessments.");
                }

                setAssessments(data.assessments ?? []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load assessments.",
                );
            }
        }

        loadAssessments();
    }, [productId]);

    async function generateChecklist() {
        if (!productId || !marketResultId) return;

        setGenerating(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/export-readiness", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, marketResultId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to generate checklist.");
            }

            const assessment = data.assessment as Assessment;

            setAssessments((current) => [
                assessment,
                ...current.filter((item) => item.id !== assessment.id),
            ]);

            setSuccess(
                data.alreadyExists
                    ? "Your existing checklist has been loaded."
                    : "Your export readiness checklist has been generated.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to generate checklist.",
            );
        } finally {
            setGenerating(false);
        }
    }

    async function updateItem(
        itemId: string,
        updates: {
            status?: ChecklistItem["status"];
            notes?: string;
        },
    ) {
        if (!selectedAssessment) return;

        setUpdatingItem(itemId);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `/api/export-readiness/${selectedAssessment.id}/items/${itemId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updates),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to update checklist item.");
            }

            const updated = data.assessment as Assessment;

            setAssessments((current) =>
                current.map((item) =>
                    item.id === updated.id ? updated : item,
                ),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update checklist item.",
            );
        } finally {
            setUpdatingItem("");
        }
    }

    const progress = selectedAssessment
        ? selectedAssessment.totalItems > 0
            ? Math.round(
                (selectedAssessment.completedItems /
                    selectedAssessment.totalItems) *
                100,
            )
            : 0
        : 0;

    const groupedItems = useMemo(() => {
        if (!selectedAssessment) return {};

        return Object.groupBy(
            selectedAssessment.items,
            (item) => item.category,
        );
    }, [selectedAssessment]);

    if (loading) {
        return (
            <div className="flex min-h-80 items-center justify-center">
                <Loader2 className="animate-spin text-teal-600" size={28} />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl min-w-0 space-y-7 px-4 pt-8 pb-10 sm:px-6 sm:pt-10 lg:px-8">
            <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400">
                    <ShieldCheck size={18} />
                    EXPORT PREPARATION
                </div>
                <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                    Export Readiness
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Understand the requirements for taking your products
                    from India to international markets. Track your preparation
                    with a product-specific checklist.
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

            <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="mb-5">
                    <h2 className="font-bold text-slate-900 dark:text-white">
                        Select product and target market
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Choose a product with completed market research.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label
                            htmlFor="export-business"
                            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Business
                        </label>
                        <select
                            id="export-business"
                            value={businessId}
                            onChange={(event) => setBusinessId(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">Select business</option>
                            {businesses.map((business) => (
                                <option key={business.id} value={business.id}>
                                    {business.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="export-product"
                            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Product
                        </label>
                        <select
                            id="export-product"
                            value={productId}
                            onChange={(event) => setProductId(event.target.value)}
                            disabled={loadingProducts || products.length === 0}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">
                                {loadingProducts ? "Loading..." : "Select product"}
                            </option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="export-market"
                            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Target market
                        </label>
                        <select
                            id="export-market"
                            value={marketResultId}
                            onChange={(event) => setMarketResultId(event.target.value)}
                            disabled={loadingMarkets || markets.length === 0}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-teal-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                            <option value="">
                                {loadingMarkets ? "Loading..." : "Select researched market"}
                            </option>
                            {markets.map((market) => (
                                <option key={market.id} value={market.id}>
                                    {market.country} · Rank #{market.rank}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={generateChecklist}
                    disabled={!productId || !marketResultId || generating}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087E70] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#06685d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {generating ? (
                        <Loader2 size={17} className="animate-spin" />
                    ) : (
                        <FileCheck2 size={17} />
                    )}
                    {generating ? "Preparing checklist..." : "Generate checklist"}
                </button>
            </section>

            {!businesses.length && (
                <div className={`${panelClass} p-8 text-center`}>
                    <AlertCircle className="mx-auto text-amber-500" size={28} />
                    <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
                        No business profile found
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Complete your business onboarding before preparing for export.
                    </p>
                </div>
            )}

            {businesses.length > 0 && products.length === 0 && businessId && !loadingProducts && (
                <div className={`${panelClass} p-6 text-center`}>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Add a product to your selected business to get started.
                    </p>
                </div>
            )}

            {productId && !loadingMarkets && markets.length === 0 && (
                <div className={`${panelClass} p-6 text-center`}>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No completed market research found for this product. Complete
                        Market Discovery first.
                    </p>
                </div>
            )}

            {selectedAssessment && (
                <>
                    <section className={`${panelClass} p-5 sm:p-6`}>
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Export checklist
                                </p>
                                <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                                    {selectedAssessment.product.name} →{" "}
                                    {selectedAssessment.marketResult.country}
                                </h2>
                            </div>

                            <span
                                className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${selectedAssessment.status === "COMPLETED"
                                    ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    }`}
                            >
                                {selectedAssessment.status === "COMPLETED"
                                    ? "Checklist completed"
                                    : "In progress"}
                            </span>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Total requirements
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                                    {selectedAssessment.totalItems}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Completed
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-teal-700 dark:text-teal-400">
                                    {selectedAssessment.completedItems}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Progress
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                                    {progress}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className="h-full rounded-full bg-teal-600 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                Your export requirements
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Review each requirement, update its status, and keep notes
                                for your export preparation.
                            </p>
                        </div>

                        {Object.entries(groupedItems).map(([category, items = []]) => (
                            <div key={category} className={`${panelClass} overflow-hidden`}>
                                <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        {categoryLabels[category] ?? category}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {items.length} requirement{items.length === 1 ? "" : "s"}
                                    </p>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {items.map((item) => (
                                        <div key={item.id} className="p-5">
                                            <div className="flex flex-col justify-between gap-3 sm:flex-row">
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.status === "COMPLETED"}
                                                        disabled={updatingItem === item.id}
                                                        onChange={(event) =>
                                                            updateItem(item.id, {
                                                                status: event.target.checked
                                                                    ? "COMPLETED"
                                                                    : "PENDING",
                                                            })
                                                        }
                                                        className="mt-1 h-4 w-4 accent-teal-600"
                                                        aria-label={`Mark ${item.title} completed`}
                                                    />

                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-white">
                                                            {item.title}
                                                        </h4>
                                                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`h-fit w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[item.priority]}`}
                                                >
                                                    {item.priority}
                                                </span>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center gap-3 pl-7">
                                                {item.sourceUrl && (
                                                    <a
                                                        href={item.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                                                    >
                                                        {item.sourceName || "Official source"}
                                                        <ExternalLink size={13} />
                                                    </a>
                                                )}

                                                <select
                                                    value={item.status}
                                                    disabled={updatingItem === item.id}
                                                    onChange={(event) =>
                                                        updateItem(item.id, {
                                                            status: event.target.value as ChecklistItem["status"],
                                                        })
                                                    }
                                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                                    aria-label={`Status for ${item.title}`}
                                                >
                                                    <option value="PENDING">Pending</option>
                                                    <option value="COMPLETED">Completed</option>
                                                    <option value="NOT_APPLICABLE">Not applicable</option>
                                                </select>

                                                {updatingItem === item.id && (
                                                    <Loader2
                                                        size={15}
                                                        className="animate-spin text-teal-600"
                                                    />
                                                )}
                                            </div>

                                            <div className="mt-3 pl-7">
                                                <label
                                                    htmlFor={`notes-${item.id}`}
                                                    className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400"
                                                >
                                                    Notes
                                                </label>
                                                <textarea
                                                    id={`notes-${item.id}`}
                                                    key={`${item.id}-${item.notes ?? ""}`}
                                                    defaultValue={item.notes ?? ""}
                                                    onBlur={(event) => {
                                                        const value = event.target.value;
                                                        if (value !== (item.notes ?? "")) {
                                                            updateItem(item.id, { notes: value });
                                                        }
                                                    }}
                                                    rows={2}
                                                    maxLength={5000}
                                                    placeholder="Add notes about documents, progress or follow-ups..."
                                                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>

                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        This checklist is a preparation aid, not a legal compliance
                        certification. Requirements may vary by product, shipment and
                        destination. Verify current rules with the relevant authorities
                        and your customs professional before shipping.
                    </div>
                </>
            )}
        </div>
    );
}
