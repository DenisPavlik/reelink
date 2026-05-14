"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    if (disabled || !url) return;
    setError(null);
    setVideoUrl(null);
    setStage("writing-script");
    setStageDetail(undefined);

    startTransition(() => {
      orchestrate(url, onProgress).then((result) => {
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

  const button = (
    <Button
      type="submit"
      size="lg"
      disabled={disabled}
      className="h-12 px-8 text-base font-semibold"
    >
      Create video
    </Button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          required
          className="h-12 text-base bg-white/10 border-white/30 text-white placeholder:text-white/40 backdrop-blur"
        />
        {paused ? (
          <Tooltip>
            <TooltipTrigger render={<span>{button}</span>} />
            <TooltipContent side="bottom">
              {pausedMessage ??
                "Live demo paused — try the pre-rendered demos below."}
            </TooltipContent>
          </Tooltip>
        ) : (
          button
        )}
      </div>
      {error && (
        <p className="text-rose-200/90 text-sm bg-rose-900/30 border border-rose-400/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </form>
  );
}
