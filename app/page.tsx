import { UrlForm } from "@/components/url-form";
import { DemoGrid } from "@/components/demo-grid";
import { BudgetFooter } from "@/components/budget-footer";
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

export default async function Home() {
  const budget = await safeBudget();
  const paused = budget?.paused ?? false;

  return (
    <main className="reelink-gradient flex-1 flex flex-col items-center justify-start text-white px-6 pt-16 pb-12">
      <header className="text-center space-y-4 max-w-3xl">
        <h1 className="reelink-wordmark text-6xl sm:text-8xl font-black tracking-tight">
          Reelink
        </h1>
        <p className="text-base sm:text-xl text-emerald-50/80 max-w-xl mx-auto leading-relaxed">
          Paste any article URL. Get a vertical 9:16 video with AI voiceover
          and word-synced captions in under 90 seconds.
        </p>
      </header>

      <div className="mt-12 w-full flex justify-center">
        <UrlForm paused={paused} pausedMessage={PAUSED_MESSAGE} />
      </div>

      <DemoGrid />

      <BudgetFooter initial={budget} />
    </main>
  );
}
