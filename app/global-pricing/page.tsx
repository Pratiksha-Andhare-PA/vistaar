
import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { GlobalPricing } from "@/components/global-pricing/global-pricing";

interface GlobalPricingPageProps {
    searchParams: Promise<{
        productId?: string;
        marketResultId?: string;
    }>;
}

async function GlobalPricingContent({
    searchParams,
}: GlobalPricingPageProps) {
    const params = await searchParams;

    return (
        <GlobalPricing
            initialProductId={params.productId ?? ""}
            initialMarketResultId={params.marketResultId ?? ""}
        />
    );
}

function GlobalPricingFallback() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-40 rounded-xl bg-slate-100 dark:bg-slate-900" />
            <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-900" />
        </div>
    );
}

export default function GlobalPricingPage({
    searchParams,
}: GlobalPricingPageProps) {
    return (
        <DashboardShell>
            <Suspense fallback={<GlobalPricingFallback />}>
                <GlobalPricingContent searchParams={searchParams} />
            </Suspense>
        </DashboardShell>
    );
}
