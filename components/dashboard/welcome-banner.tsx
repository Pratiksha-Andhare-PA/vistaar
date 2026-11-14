
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#102B3F] p-7 text-white shadow-sm sm:p-10">
      <div className="relative z-10 max-w-2xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-2 text-xs font-medium text-teal-200">
          <Sparkles size={15} />
          Your global expansion copilot
        </div>

        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Take your business
          <br />
          <span className="text-teal-300">beyond borders.</span>
        </h2>

        <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
          Discover international opportunities, adapt your products
          for new audiences and take your local business global
          with AI-powered intelligence.
        </p>

        <Link
          href="#getting-started"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#102B3F] transition hover:bg-teal-300"
        >
          Start your journey
          <ArrowRight size={17} />
        </Link>
      </div>

      {/* Decorative globe-inspired rings */}
      <div className="pointer-events-none absolute -right-28 -top-28 hidden h-96 w-96 rounded-full border border-teal-300/20 md:block" />
      <div className="pointer-events-none absolute -right-12 -top-12 hidden h-72 w-72 rounded-full border border-teal-300/20 md:block" />
      <div className="pointer-events-none absolute -bottom-40 right-24 hidden h-80 w-80 rounded-full bg-teal-400/10 blur-3xl md:block" />
    </section>
  );
}
