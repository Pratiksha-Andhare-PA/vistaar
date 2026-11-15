
"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type FormValues = {
  name: string;
  businessType: string;
  category: string;
  country: string;
  city: string;
  description: string;
  email: string;
  phone: string;
  website: string;
};

const initialForm: FormValues = {
  name: "",
  businessType: "INDIVIDUAL",
  category: "HANDLOOM",
  country: "India",
  city: "",
  description: "",
  email: "",
  phone: "",
  website: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500";

const labelClass =
  "text-sm font-semibold text-slate-700 dark:text-slate-200";

export function BusinessForm() {
  const [form, setForm] = useState<FormValues>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          website: form.website || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errors = result.fieldErrors as
          | Record<string, string[] | undefined>
          | undefined;

        const firstFieldError = errors
          ? Object.entries(errors).flatMap(([field, messages]) =>
              (messages ?? []).map(
                (message) => `${field}: ${message}`
              )
            )[0]
          : undefined;

        throw new Error(
          firstFieldError ||
            result.error ||
            "Something went wrong"
        );
      }

      setSuccess(
        `Business "${result.business.name}" was registered successfully.`
      );

      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your business profile"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Business information */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Business information
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tell us about your business.
          </p>
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            Business name <span className="text-red-500">*</span>
          </label>

          <input
            id="name"
            name="name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Shree Handloom Creations"
            className={inputClass}
            required
            minLength={2}
            maxLength={120}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="businessType" className={labelClass}>
              Business type <span className="text-red-500">*</span>
            </label>

            <select
              id="businessType"
              value={form.businessType}
              onChange={(e) =>
                updateField("businessType", e.target.value)
              }
              className={inputClass}
            >
              <option value="INDIVIDUAL">
                Individual artisan / creator
              </option>
              <option value="REGISTERED_BUSINESS">
                Registered business
              </option>
              <option value="COOPERATIVE">Cooperative</option>
              <option value="ARTISAN_GROUP">Artisan group</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Business category <span className="text-red-500">*</span>
            </label>

            <select
              id="category"
              value={form.category}
              onChange={(e) =>
                updateField("category", e.target.value)
              }
              className={inputClass}
            >
              <option value="HANDLOOM">Handloom and textiles</option>
              <option value="JEWELLERY">Jewellery</option>
              <option value="HANDICRAFTS">Handicrafts</option>
              <option value="APPAREL">Apparel and clothing</option>
              <option value="HOME_DECOR">Home decor</option>
              <option value="ORGANIC_PRODUCTS">Organic products</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            About your business <span className="text-red-500">*</span>
          </label>

          <textarea
            id="description"
            value={form.description}
            onChange={(e) =>
              updateField("description", e.target.value)
            }
            placeholder="Describe your business, products, craftsmanship and what makes your products special..."
            rows={5}
            minLength={20}
            maxLength={2000}
            className={inputClass}
            required
          />

          <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
            {form.description.length}/2000 characters
          </p>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* Business location */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Business location
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Where does your business operate?
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="country" className={labelClass}>
              Country <span className="text-red-500">*</span>
            </label>

            <input
              id="country"
              value={form.country}
              onChange={(e) =>
                updateField("country", e.target.value)
              }
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>
              City <span className="text-red-500">*</span>
            </label>

            <input
              id="city"
              value={form.city}
              onChange={(e) =>
                updateField("city", e.target.value)
              }
              placeholder="Enter your city"
              className={inputClass}
              required
            />
          </div>
        </div>
      </section>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* Contact information */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Contact information
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            How can customers or partners contact your business?
          </p>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Business email <span className="text-red-500">*</span>
          </label>

          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="business@example.com"
            className={inputClass}
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone number
            </label>

            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 9876543210"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="website" className={labelClass}>
              Website (optional)
            </label>

            <input
              id="website"
              type="url"
              value={form.website}
              onChange={(e) =>
                updateField("website", e.target.value)
              }
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-semibold">{success}</p>

            <p className="mt-1 text-xs">
              Your information has been saved in Vistaar.
            </p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102B3F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Saving profile...
            </>
          ) : (
            <>
              Save business profile
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
