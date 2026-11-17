
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/database";

export const instant = false;

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getStorefront(slug: string) {
    return prisma.storefront.findFirst({
        where: {
            slug,
            status: "PUBLISHED",
        },
        select: {
            slug: true,
            locale: true,
            country: true,
            countryCode: true,
            productName: true,
            localizedTitle: true,
            localizedDescription: true,
            imageUrl: true,
            businessName: true,
            businessDescription: true,
            businessCity: true,
            businessCountry: true,
            currency: true,
            price: true,
            seoKeywords: true,
            culturalGuidance: true,
            marketingMessages: true,
            faqs: true,
            publishedAt: true,
        },
    });
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const storefront = await getStorefront(slug);

    if (!storefront) {
        return {
            title: "Storefront unavailable | Vistaar",
        };
    }

    return {
        title: `${storefront.localizedTitle} | ${storefront.businessName}`,
        description: storefront.localizedDescription.slice(0, 160),
        keywords: storefront.seoKeywords,
        openGraph: {
            title: storefront.localizedTitle,
            description: storefront.localizedDescription.slice(0, 200),
            images: storefront.imageUrl ? [storefront.imageUrl] : [],
        },
    };
}

export default async function PublicStorefrontPage({
    params,
}: PageProps) {
    const { slug } = await params;
    const storefront = await getStorefront(slug);

    if (!storefront) {
        notFound();
    }

    const formattedPrice = new Intl.NumberFormat(
        storefront.locale,
        {
            style: "currency",
            currency: storefront.currency,
        },
    ).format(Number(storefront.price));

    return (
        <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-slate-950 dark:text-slate-100">
            <header className="border-b border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <a
                        href={`/store/${storefront.slug}`}
                        className="text-xl font-bold tracking-tight"
                    >
                        Vistaar<span className="text-amber-600">.</span>
                    </a>

                    <span className="text-sm text-stone-500 dark:text-slate-400">
                        {storefront.country}
                    </span>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-12 lg:py-20">
                <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
                    <div className="overflow-hidden rounded-3xl bg-stone-200 dark:bg-slate-800">
                        {storefront.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={storefront.imageUrl}
                                alt={storefront.localizedTitle}
                                className="aspect-square w-full object-cover"
                            />
                        ) : (
                            <div className="flex aspect-square items-center justify-center text-stone-400">
                                <span className="text-sm">
                                    Product image unavailable
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                                {storefront.businessName}
                            </p>

                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                                {storefront.localizedTitle}
                            </h1>

                            <p className="text-3xl font-semibold text-stone-800 dark:text-slate-100">
                                {formattedPrice}
                            </p>
                        </div>

                        <div className="h-px bg-stone-200 dark:bg-slate-800" />

                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold">
                                About this product
                            </h2>

                            <p className="whitespace-pre-line leading-8 text-stone-600 dark:text-slate-300">
                                {storefront.localizedDescription}
                            </p>
                        </section>

                        <div className="h-px bg-stone-200 dark:bg-slate-800" />

                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold">
                                About the seller
                            </h2>

                            <p className="font-medium">
                                {storefront.businessName}
                            </p>

                            <p className="whitespace-pre-line leading-7 text-stone-600 dark:text-slate-300">
                                {storefront.businessDescription}
                            </p>

                            <p className="text-sm text-stone-500 dark:text-slate-400">
                                {[
                                    storefront.businessCity,
                                    storefront.businessCountry,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                        </section>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                Discover craftsmanship with global roots.
                            </p>

                            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                                Locally made. Thoughtfully presented for{" "}
                                {storefront.country}.
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="mt-20 border-t border-stone-200 pt-8 text-center text-sm text-stone-500 dark:border-slate-800 dark:text-slate-400">
                    <p>
                        © 2026 {storefront.businessName}. Powered by Vistaar.
                    </p>
                    <p className="mt-2">
                        Local Roots. Global Reach.
                    </p>
                </footer>
            </div>
        </main>
    );
}
