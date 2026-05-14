import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda/client";
import type { AwsRegion } from "@remotion/lambda";
import { FriendlyError } from "./errors";
import type { ReelProps } from "../remotion/Reel";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function lambdaConfig() {
  return {
    region: env("AWS_REGION") as AwsRegion,
    functionName: env("REMOTION_LAMBDA_FUNCTION_NAME"),
    serveUrl: env("REMOTION_SERVE_URL"),
  };
}

export type StartRenderResult = {
  renderId: string;
  bucketName: string;
};

export async function startRender(
  inputProps: ReelProps,
): Promise<StartRenderResult> {
  try {
    const { region, functionName, serveUrl } = lambdaConfig();
    const result = await renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition: "Reel",
      inputProps,
      codec: "h264",
      imageFormat: "jpeg",
      maxRetries: 1,
      privacy: "public",
    });
    return { renderId: result.renderId, bucketName: result.bucketName };
  } catch (cause) {
    throw new FriendlyError("Couldn't start the video render.", cause);
  }
}

export type RenderStatus = {
  done: boolean;
  progress: number;
  videoUrl?: string;
  errorMessage?: string;
};

export async function getRenderStatus(params: {
  renderId: string;
  bucketName: string;
}): Promise<RenderStatus> {
  try {
    const { region, functionName } = lambdaConfig();
    const status = await getRenderProgress({
      renderId: params.renderId,
      bucketName: params.bucketName,
      functionName,
      region,
    });

    if (status.fatalErrorEncountered) {
      return {
        done: true,
        progress: 1,
        errorMessage: status.errors?.[0]?.message ?? "Render failed.",
      };
    }
    if (status.done) {
      return {
        done: true,
        progress: 1,
        videoUrl: status.outputFile ?? undefined,
      };
    }
    return {
      done: false,
      progress: status.overallProgress ?? 0,
    };
  } catch (cause) {
    throw new FriendlyError("Couldn't check the render status.", cause);
  }
}
