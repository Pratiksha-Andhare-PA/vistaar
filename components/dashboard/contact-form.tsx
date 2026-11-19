
"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, MessageSquare } from "lucide-react";

export function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setStatus(null);

        const payload = {
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            subject: String(formData.get("subject") ?? ""),
            message: String(formData.get("message") ?? ""),
            website: String(formData.get("website") ?? ""),
        };

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus({
                    type: "error",
                    message: data.error || "Something went wrong. Please try again.",
                });
                return;
            }

            setStatus({
                type: "success",
                message: "Your message has been sent! We'll get back to you soon.",
            });

            (document.getElementById("contact-form") as HTMLFormElement)?.reset();
        } catch {
            setStatus({
                type: "error",
                message: "Unable to send your message. Please check your connection.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <section
            id="contact"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F4F1] text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    <Mail size={20} />
                </div>

                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Contact us
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Have questions or feedback? We&apos;d love to hear from you.
                    </p>
                </div>
            </div>

            <form
                id="contact-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit(new FormData(event.currentTarget));
                }}
                className="mt-6 space-y-4"
            >
                {/* Honeypot field */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                        id="website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="contact-name"
                            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Name
                        </label>
                        <input
                            id="contact-name"
                            name="name"
                            required
                            minLength={2}
                            maxLength={100}
                            autoComplete="name"
                            placeholder="Your name"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="contact-email"
                            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Email
                        </label>
                        <input
                            id="contact-email"
                            name="email"
                            type="email"
                            required
                            maxLength={254}
                            autoComplete="email"
                            placeholder="you@example.com"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="contact-subject"
                        className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Subject
                    </label>
                    <input
                        id="contact-subject"
                        name="subject"
                        required
                        minLength={3}
                        maxLength={150}
                        placeholder="What would you like to discuss?"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                </div>

                <div>
                    <label
                        htmlFor="contact-message"
                        className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Message
                    </label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
                        minLength={10}
                        maxLength={5000}
                        rows={5}
                        placeholder="Write your message here..."
                        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                </div>

                {status && (
                    <div
                        role="status"
                        className={`flex items-start gap-2 rounded-lg p-3 text-sm ${status.type === "success"
                                ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            }`}
                    >
                        {status.type === "success" ? (
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                        ) : (
                            <MessageSquare size={18} className="mt-0.5 shrink-0" />
                        )}
                        <p>{status.message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-700"
                >
                    {loading ? "Sending..." : "Send message"}
                    <Send size={16} />
                </button>
            </form>
        </section>
    );
}
