"use client";

import type { Caption, Scene, AudioScene } from "@/lib/schemas";

export type Stage =
  | "idle"
  | "writing-script"
  | "recording-voice"
  | "aligning-captions"
  | "rendering"
  | "done"
  | "error";

export type StageLabel = {
  key: Exclude<Stage, "idle" | "done" | "error">;
  label: string;
};

export const STAGE_LABELS: StageLabel[] = [
  { key: "writing-script", label: "Reading article & writing script" },
  { key: "recording-voice", label: "Recording voiceover" },
  { key: "aligning-captions", label: "Aligning captions" },
  { key: "rendering", label: "Rendering video" },
];

export type ProgressUpdate = {
  stage: Stage;
  message?: string;
};

export type OrchestrateResult =
  | { ok: true; videoUrl: string }
  | { ok: false; kind: "paused" | "rate-limited" | "failed"; message: string };

type StartResponse = { jobId: string; title: string; scenes: Scene[] };
type AudioResponse = {
  scenes: AudioScene[];
  totalDurationMs: number;
  jobId: string;
};
type CaptionsResponse = { captions: Caption[] };
type RenderResponse = { renderId: string; bucketName: string };
type RenderStatusResponse = {
  done: boolean;
  progress: number;
  videoUrl?: string;
  errorMessage?: string;
};

type ApiError = {
  error: string;
  message: string;
  retryAfterSeconds?: number;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

async function toApiError(res: Response): Promise<OrchestrateResult> {
  const err = (await res.json().catch(() => null)) as ApiError | null;
  if (res.status === 503) {
    return {
      ok: false,
      kind: "paused",
      message: err?.message ?? "Live demo paused.",
    };
  }
  if (res.status === 429) {
    return {
      ok: false,
      kind: "rate-limited",
      message: err?.message ?? "Daily limit reached.",
    };
  }
  return {
    ok: false,
    kind: "failed",
    message: err?.message ?? "Something went wrong.",
  };
}

type FailureResult = Extract<OrchestrateResult, { ok: false }>;

function isFailureResult(value: unknown): value is FailureResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok: unknown }).ok === false
  );
}

export async function orchestrate(
  url: string,
  onProgress: (update: ProgressUpdate) => void,
): Promise<OrchestrateResult> {
  try {
    onProgress({ stage: "writing-script" });
    const start = await postJson<StartResponse>("/api/generate/start", { url });

    onProgress({ stage: "recording-voice" });
    const audio = await postJson<AudioResponse>("/api/generate/audio", {
      scenes: start.scenes,
      jobId: start.jobId,
    });

    onProgress({ stage: "aligning-captions" });
    const captions = await postJson<CaptionsResponse>(
      "/api/generate/captions",
      { audioScenes: audio.scenes },
    );

    onProgress({ stage: "rendering" });
    const render = await postJson<RenderResponse>("/api/generate/render", {
      scenes: audio.scenes,
      captions: captions.captions,
      totalDurationMs: audio.totalDurationMs,
    });

    const videoUrl = await pollRender(render, onProgress);
    onProgress({ stage: "done" });
    return { ok: true, videoUrl };
  } catch (err) {
    if (isFailureResult(err)) {
      onProgress({ stage: "error", message: err.message });
      return err;
    }
    const message =
      err instanceof Error ? err.message : "Unexpected client error.";
    onProgress({ stage: "error", message });
    return { ok: false, kind: "failed", message };
  }
}

async function pollRender(
  { renderId, bucketName }: RenderResponse,
  onProgress: (update: ProgressUpdate) => void,
): Promise<string> {
  while (true) {
    await sleep(3000);
    const status = await getJson<RenderStatusResponse>(
      `/api/generate/render-status?renderId=${encodeURIComponent(
        renderId,
      )}&bucket=${encodeURIComponent(bucketName)}`,
    );
    if (status.done) {
      if (status.errorMessage || !status.videoUrl) {
        throw {
          ok: false,
          kind: "failed",
          message: status.errorMessage ?? "Render failed.",
        } satisfies OrchestrateResult;
      }
      return status.videoUrl;
    }
    onProgress({
      stage: "rendering",
      message: `${Math.round((status.progress ?? 0) * 100)}%`,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
