"use client";

import { STAGE_LABELS, type Stage } from "./orchestrator";

const ORDER: Stage[] = [
  "writing-script",
  "recording-voice",
  "aligning-captions",
  "rendering",
];

export type ProgressDisplayProps = {
  stage: Stage;
  detail?: string;
};

export function ProgressDisplay({ stage, detail }: ProgressDisplayProps) {
  const currentIdx = ORDER.indexOf(stage);
  return (
    <div className="w-full space-y-5 border-t border-cream/15 pt-5">
      <p className="font-mono text-[10px] tracking-[0.3em] text-ochre/80 uppercase">
        · Filming your reel
      </p>
      <ul className="space-y-3">
        {STAGE_LABELS.map((s, i) => {
          const state =
            i < currentIdx ? "done" : i === currentIdx ? "current" : "pending";
          return (
            <li key={s.key} className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] tracking-[0.2em] text-cream/35 uppercase">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Dot state={state} />
              <span
                className={
                  state === "done"
                    ? "font-display text-base text-cream/45 line-through"
                    : state === "current"
                      ? "font-display text-base text-cream"
                      : "font-display text-base text-cream/30"
                }
              >
                {s.label}
              </span>
              {state === "current" && detail && (
                <span className="ml-auto font-mono text-[11px] text-cream/55">
                  {detail}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Dot({ state }: { state: "done" | "current" | "pending" }) {
  if (state === "done") {
    return (
      <span className="inline-block size-1.5 translate-y-px rounded-full bg-ochre" />
    );
  }
  if (state === "current") {
    return (
      <span className="relative inline-flex size-1.5 translate-y-px items-center justify-center">
        <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-ochre/60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-ochre" />
      </span>
    );
  }
  return (
    <span className="inline-block size-1.5 translate-y-px rounded-full border border-cream/30" />
  );
}
