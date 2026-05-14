"use client";

import { useEffect, useState } from "react";

type BudgetStatus = {
  spentCents: number;
  capCents: number;
  remainingCents: number;
  paused: boolean;
};

export type BudgetFooterProps = {
  initial: BudgetStatus | null;
};

const POLL_MS = 30_000;

export function BudgetFooter({ initial }: BudgetFooterProps) {
  const [status, setStatus] = useState<BudgetStatus | null>(initial);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/budget", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as BudgetStatus;
        if (!cancelled) setStatus(next);
      } catch {
        // silent — UI keeps last known state
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!status) return null;

  const pct = Math.min(100, (status.spentCents / status.capCents) * 100);
  const dollars = (status.spentCents / 100).toFixed(2);
  const cap = (status.capCents / 100).toFixed(2);
  const accent = status.paused
    ? "bg-rose-400"
    : pct > 90
      ? "bg-amber-300"
      : "bg-emerald-300";

  return (
    <footer className="w-full max-w-xl mx-auto pt-12 pb-6 text-xs text-emerald-100/60">
      <div className="flex items-center justify-between mb-2 uppercase tracking-widest">
        <span>Budget</span>
        <span>
          ${dollars} / ${cap}
          {status.paused ? " — paused" : ""}
        </span>
      </div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${accent} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </footer>
  );
}
