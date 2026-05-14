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
    <div className="w-full max-w-xl space-y-4">
      <p className="text-emerald-100/80 text-sm uppercase tracking-widest text-center">
        Generating your reel
      </p>
      <ul className="space-y-3">
        {STAGE_LABELS.map((s, i) => {
          const state =
            i < currentIdx ? "done" : i === currentIdx ? "current" : "pending";
          return (
            <li
              key={s.key}
              className="flex items-center gap-3 text-base"
            >
              <Dot state={state} />
              <span
                className={
                  state === "done"
                    ? "text-emerald-200/70 line-through"
                    : state === "current"
                      ? "text-white font-semibold"
                      : "text-white/40"
                }
              >
                {s.label}
              </span>
              {state === "current" && detail && (
                <span className="text-emerald-200/70 text-sm ml-auto">
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
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-emerald-950">
        ✓
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center">
        <span className="h-3 w-3 rounded-full bg-emerald-300 animate-ping absolute" />
        <span className="h-3 w-3 rounded-full bg-emerald-300" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/30" />
  );
}
