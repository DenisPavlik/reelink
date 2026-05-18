"use client";

import { useState, useTransition } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { orchestrate, type Stage, type ProgressUpdate } from "./orchestrator";
import { ProgressDisplay } from "./progress-display";
import { VideoPlayer } from "./video-player";

export type UrlFormProps = {
  paused: boolean;
  pausedMessage?: string;
};

type UrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: string };

function normalizeAndValidateUrl(input: string): UrlCheck {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "Paste a URL first." };

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Use an http:// or https:// link." };
  }
  if (
    parsed.hostname === "localhost" ||
    !parsed.hostname.includes(".") ||
    parsed.hostname.endsWith(".")
  ) {
    return {
      ok: false,
      reason: "That hostname isn't a public website.",
    };
  }

  return { ok: true, url: parsed.toString() };
}

export function UrlForm({ paused, pausedMessage }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [stageDetail, setStageDetail] = useState<string | undefined>();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitting = stage !== "idle" && stage !== "done" && stage !== "error";
  const disabled = paused || submitting || isPending;

  function onProgress(update: ProgressUpdate) {
    setStage(update.stage);
    setStageDetail(update.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    const check = normalizeAndValidateUrl(url);
    if (!check.ok) {
      setError(check.reason);
      return;
    }

    setError(null);
    setVideoUrl(null);
    setStage("writing-script");
    setStageDetail(undefined);

    startTransition(() => {
      orchestrate(check.url, onProgress).then((result) => {
        if (result.ok) {
          setVideoUrl(result.videoUrl);
        } else {
          setError(result.message);
        }
      });
    });
  }

  if (videoUrl) {
    return (
      <VideoPlayer
        src={videoUrl}
        onReset={() => {
          setVideoUrl(null);
          setUrl("");
          setStage("idle");
          setError(null);
        }}
      />
    );
  }

  if (submitting) {
    return <ProgressDisplay stage={stage} detail={stageDetail} />;
  }

  const submit = (
    <button
      type="submit"
      disabled={disabled}
      className="group/btn flex shrink-0 items-center gap-2 bg-ochre/15 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ochre transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-ochre enabled:hover:text-ink"
    >
      <span>{paused ? "Paused" : "Generate"}</span>
      <span
        aria-hidden
        className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1.5"
      >
        →
      </span>
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Editorial framed input — clearly a paste-here zone */}
      <div
        id="url-form-frame"
        className="group/field relative border border-cream/25 bg-ink-2/40 backdrop-blur transition-colors focus-within:border-ochre/60"
      >
        {/* Stamped label that sits in the top border */}
        <span className="absolute -top-2 left-4 bg-ink px-2 font-mono text-[9px] tracking-[0.3em] text-ochre/85 uppercase">
          ¶ Paste article URL
        </span>

        <div className="flex items-stretch gap-3">
          <input
            id="article-url"
            type="text"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="https://nyti.ms/some-article"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            disabled={disabled}
            aria-label="Article URL"
            aria-invalid={error ? true : undefined}
            className="w-full min-w-0 flex-1 bg-transparent px-5 py-4 font-mono text-base text-cream placeholder:text-cream/25 focus:outline-none disabled:opacity-50"
          />
          {paused ? (
            <Tooltip>
              <TooltipTrigger render={<span className="contents">{submit}</span>} />
              <TooltipContent side="bottom">
                {pausedMessage ??
                  "Live demo paused — try the pre-rendered films below."}
              </TooltipContent>
            </Tooltip>
          ) : (
            submit
          )}
        </div>
      </div>
      {error && (
        <p className="mt-4 border-l-2 border-oxblood/60 bg-oxblood/10 px-4 py-2 font-mono text-xs text-cream/80">
          {error}
        </p>
      )}
    </form>
  );
}
