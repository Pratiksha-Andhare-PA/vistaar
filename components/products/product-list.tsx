
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Image as ImageIcon,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
} from "lucide-react";

type Business = {
  id: string;
  name: string;
  country: string;
  city: string;
  _count?: {
    products: number;
  };
};

type Product = {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: string | number;
  currency: string;
  imageUrl: string | null;
  createdAt: string;
};

type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  currency: string;
  imageUrl: string;
};

const initialForm: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  currency: "INR",
  imageUrl: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500";

const labelClass = "text-sm font-semibold text-slate-700 dark:text-slate-200";

function formatPrice(price: string | number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(price));
  } catch {
    return `${currency} ${price}`;
  }
}

export function ProductList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductFormValues>(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the businesses registered in Vistaar.
  useEffect(() => {
    async function loadBusinesses() {
      setBusinessesLoading(true);
      setError("");

      try {
        const response = await fetch("/api/business");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load businesses");
        }

        const list: Business[] = result.businesses ?? [];
        setBusinesses(list);

        if (list.length > 0) {
          setSelectedBusinessId((current) => current || list[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load businesses"
        );
      } finally {
        setBusinessesLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  // Load products whenever the selected business changes.
  useEffect(() => {
    if (!selectedBusinessId) {
      setProducts([]);
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      setProductsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/products?businessId=${encodeURIComponent(selectedBusinessId)}`,
          { signal: controller.signal }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load products");
        }

        setProducts(result.products ?? []);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Unable to load products");
        }
      } finally {
        if (!controller.signal.aborted) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [selectedBusinessId]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }, [products, search]);

  const selectedBusiness = businesses.find(
    (business) => business.id === selectedBusinessId
  );

  function updateField<K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBusinessId) {
      setError("Select a business before adding a product.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          businessId: selectedBusinessId,
          imageUrl: form.imageUrl.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const fieldErrors = result.fieldErrors as
          | Record<string, string[] | undefined>
          | undefined;

        const firstFieldError = fieldErrors
          ? Object.values(fieldErrors).flatMap((messages) => messages ?? [])[0]
          : undefined;

        throw new Error(
          firstFieldError || result.error || "Unable to create product"
        );
      }

      setProducts((current) => [result.product, ...current]);
      setForm(initialForm);
      setShowForm(false);
      setSuccess("Product added successfully.");

      // Refresh the business product count.
      setBusinesses((current) =>
        current.map((business) =>
          business.id === selectedBusinessId
            ? {
                ...business,
                _count: {
                  products: (business._count?.products ?? 0) + 1,
                },
              }
            : business
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create product"
      );
    } finally {
      setSaving(false);
    }
  }

  if (businessesLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Package size={16} />
            <span>Workspace</span>
            <span>/</span>
            <span className="text-teal-700 dark:text-teal-400">
              My products
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            My Products
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage your catalogue and prepare your products for global markets.
          </p>
        </div>

        {businesses.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
          >
            <Plus size={18} />
            Add product
          </button>
        )}
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
          className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
        >
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* No business state */}
      {businesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <Building2 size={30} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
            Set up your business profile first
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your products belong to a business profile. Create your profile
            before adding products to your catalogue.
          </p>

          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950"
          >
            Create business profile
            <Plus size={17} />
          </Link>
        </div>
      ) : (
        <>
          {/* Business selector and catalogue summary */}
          <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <label
                htmlFor="business-select"
                className="text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Select business
              </label>

              <select
                id="business-select"
                value={selectedBusinessId}
                onChange={(event) => {
                  setSelectedBusinessId(event.target.value);
                  setSearch("");
                  setSuccess("");
                }}
                className={inputClass}
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>

              {selectedBusiness && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {selectedBusiness.city}, {selectedBusiness.country}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <Package size={23} />
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Products in catalogue
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {products.length}
                </p>
              </div>
            </div>
          </section>

          {/* Search */}
          <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Product catalogue
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  All products registered under this business.
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          </section>

          {/* Product grid */}
          {productsLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="animate-spin text-teal-600" size={28} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Package size={30} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                {search ? "No matching products" : "Your catalogue is empty"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? "Try another search term or clear your search."
                  : "Add your first product to start building your global-ready catalogue."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950"
                >
                  <Plus size={17} />
                  Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative flex h-52 items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                        <ImageIcon size={36} />
                        <span className="text-xs">No product image</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-5">
                    <div>
                      <h3 className="line-clamp-1 text-base font-bold text-slate-900 dark:text-white">
                        {product.name}
                      </h3>

                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-400">
                        Listed price
                      </span>
                      <span className="text-base font-bold text-teal-700 dark:text-teal-400">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Added{" "}
                      {new Date(product.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add product dialog */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-title"
            className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-product-title"
                  className="text-xl font-bold text-slate-900 dark:text-white"
                >
                  Add a product
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter the details of a product in your catalogue.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="product-name" className={labelClass}>
                  Product name *
                </label>
                <input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="e.g. Paithani Silk Saree"
                  className={inputClass}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>

              <div>
                <label htmlFor="product-description" className={labelClass}>
                  Product description *
                </label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Describe the material, craftsmanship, features and what makes this product unique..."
                  rows={4}
                  className={inputClass}
                  required
                  minLength={10}
                  maxLength={2000}
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.description.length}/2000 characters
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr]">
                <div>
                  <label htmlFor="product-price" className={labelClass}>
                    Price *
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      updateField("price", event.target.value)
                    }
                    placeholder="12500.00"
                    min="0.01"
                    step="0.01"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="product-currency" className={labelClass}>
                    Currency *
                  </label>
                  <select
                    id="product-currency"
                    value={form.currency}
                    onChange={(event) =>
                      updateField("currency", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="INR">INR — Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — Pound</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="product-image" className={labelClass}>
                  Product image URL
                </label>
                <input
                  id="product-image"
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) =>
                    updateField("imageUrl", event.target.value)
                  }
                  placeholder="https://example.com/product-image.jpg"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Optional. Use a publicly accessible image URL.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102B3F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving product...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Save product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
