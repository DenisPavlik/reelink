import Image from "next/image";
import Link from "next/link";

import { UrlForm } from "@/components/url-form";
import { DemoGrid } from "@/components/demo-grid";
import { TryButton } from "@/components/try-button";
import { getStatus, type BudgetStatus } from "@/lib/budget";
import { PAUSED_MESSAGE } from "@/lib/api-helpers";

async function safeBudget(): Promise<BudgetStatus | null> {
  try {
    return await getStatus();
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

const ISSUE_LABEL = "Vol. I · Issue 03 · 18.V.MMXXVI";
const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Log in" },
];

export default async function Home() {
  const budget = await safeBudget();
  const paused = budget?.paused ?? false;

  return (
    <main className="reelink-canvas relative h-screen overflow-hidden">
      {/* ambient layers — drifting leaks, faded newspaper, halftone print dots, film grain */}
      <div className="reelink-leak reelink-leak-1" aria-hidden />
      <div className="reelink-leak reelink-leak-2" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-luminosity"
        style={{
          maskImage:
            "radial-gradient(ellipse 65% 75% at 32% 48%, #000 0%, #000 22%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 75% at 32% 48%, #000 0%, #000 22%, transparent 78%)",
        }}
      >
        <Image
          src="/hero-bg-newspaper.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="reelink-halftone" aria-hidden />
      <div className="reelink-grain" aria-hidden />

      <div className="relative z-10 mx-auto flex h-screen max-w-[1440px] flex-col px-8 py-6 lg:px-14 lg:py-8">
        {/* Editorial masthead */}
        <header className="flex items-baseline justify-between border-b border-cream/15 pb-5 font-mono text-[11px] tracking-[0.22em] text-cream/65 uppercase">
          <div className="flex items-baseline gap-4">
            <span className="flex items-center gap-3">
              <span className="inline-block size-1.5 rounded-full bg-ochre shadow-[0_0_8px_rgba(200,155,60,0.8)]" />
              <span className="text-cream/90">Reelink</span>
            </span>
            <span className="text-cream/30">§</span>
            <span className="hidden text-cream/55 md:inline">
              The Reelink Almanac
            </span>
            <span className="hidden text-cream/30 lg:inline">·</span>
            <span className="hidden text-cream/45 lg:inline">
              {ISSUE_LABEL}
            </span>
          </div>

          <nav className="flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden text-cream/65 transition-colors hover:text-cream sm:inline"
              >
                {link.label}
              </Link>
            ))}
            <TryButton />
          </nav>
        </header>

        {/* Body — 2-column single-viewport: hero (with newspaper bg) + film strip */}
        <div className="grid min-h-0 flex-1 grid-cols-12 gap-x-12 pt-10 pb-4 lg:pt-14">
          {/* Hero text */}
          <section className="col-span-12 flex min-h-0 flex-col lg:col-span-8">
            <p className="font-mono text-[11px] tracking-[0.3em] text-ochre/80 uppercase">
              ¶ N°00 — A film studio in a tab
            </p>

            <h1 className="reelink-wordmark mt-6 text-[clamp(3rem,8vw,7rem)] leading-[0.94] text-cream">
              <span>Reelink</span>
              <span className="text-cream/40"> — </span>
              <br />
              <span className="not-italic font-normal">a quiet way</span>
              <br />
              <span className="text-ochre">to film an article.</span>
            </h1>

            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
              <p className="font-sans text-[16px] leading-[1.6] text-cream/75 lg:col-span-5">
                <span className="float-left mr-2 font-display text-5xl leading-[0.75] text-ochre/90">
                  P
                </span>
                aste any URL. Reelink reads the article, narrates it in a
                human voice, illustrates each beat, and edits it into a
                vertical 9:16 short you can post anywhere.
              </p>

              <div className="lg:col-span-7">
                <UrlForm paused={paused} pausedMessage={PAUSED_MESSAGE} />

                <p className="mt-4 flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] text-cream/40 uppercase">
                  <span className="inline-block h-px w-6 bg-cream/30" />
                  takes ~90 seconds
                  <span className="text-cream/20">·</span>
                  no signup
                </p>
              </div>
            </div>
          </section>

          {/* Film strip — vertical, decorative, hover-to-pick */}
          <aside className="col-span-12 mt-10 min-h-0 lg:col-span-4 lg:mt-0">
            <DemoGrid />
          </aside>
        </div>
      </div>
    </main>
  );
}
