# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

- Always communicate with the user in **Ukrainian** (explanations, questions, summaries, status updates).
- Keep everything written into the repository in **English**: code, identifiers, file/folder names, comments, commit messages, PR titles/descriptions, documentation files.
- This split is non-negotiable: Ukrainian for talking to the user, English for anything that lands on disk or in git.

## Behavioral guidelines

Adapted from Andrej Karpathy's CLAUDE.md. These bias toward caution over speed; use judgment on trivial tasks.

### 1. Think before coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite.

Ask: "Would a senior engineer call this overcomplicated?" If yes, simplify.

### 3. Surgical changes

Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

Test: every changed line should trace directly to the user's request.

### 4. Goal-driven execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria enable independent looping. Weak criteria ("make it work") force constant clarification.

---

## Project overview

**Reelink** turns an article URL into a vertical 9:16 short-form video with AI voiceover and word-synced TikTok-style captions, in ≤90 seconds. Deployed on Vercel Hobby (free tier) with a $15 cumulative-spend kill-switch and a 3-generations/IP/day rate limit.

Stack:
- **Next.js 16** (App Router, Turbopack) — single deployable, no separate backend.
- **Vercel AI SDK** + OpenAI `gpt-4o` for script generation, `tts-1-hd` (voice `nova`) for audio, `whisper-1` for word-level caption timing.
- **Remotion 4** + **Remotion Lambda** for video render (offloaded to AWS).
- **Upstash Redis (free tier)** for the spend counter, rate-limit counters, and alert flags.
- **Vercel Blob (free tier)** for per-scene mp3s; **AWS S3** (Lambda's own bucket) for the final mp4 with a 7-day lifecycle. No mp4 ever lands in Blob.
- **shadcn/ui** + Tailwind v4 for UI.

## Commands

```bash
pnpm install                          # install deps
pnpm dev                              # Next dev server at :3000
pnpm build                            # production build + TS type-check
pnpm lint                             # eslint
pnpm remotion:preview                 # interactive Remotion Studio
pnpm script scripts/test-extract.ts   # smoke: 3 URLs through extract pipeline
pnpm script scripts/test-script.ts    # smoke: extract + script gen (needs OPENAI_API_KEY)
pnpm script scripts/budget-sanity.ts  # smoke: KV budget counter (needs KV vars)
```

## Architecture

### Why client-side orchestration

Vercel Hobby caps serverless functions at 60 s, but the full pipeline can take ~90 s. The fix: split the pipeline into five short API routes that the **browser** orchestrates in sequence (see `components/orchestrator.ts`). Each endpoint stays well under the 60 s cap.

```
client.orchestrate(url):
  POST /api/generate/start          → extract + script           (~10-15 s)
  POST /api/generate/audio          → parallel TTS + Blob upload (~20-35 s)
  POST /api/generate/captions       → parallel Whisper alignment (~15-30 s)
  POST /api/generate/render         → kick Remotion Lambda       (~2-5 s)
  poll GET /api/generate/render-status until done                (~1-3 s × N)
```

The actual Remotion render runs on **AWS Lambda**, not Vercel. Vercel just kicks it off and polls.

### Kill-switch + rate-limit gate

Every `/api/generate/*` route starts with:

1. `await checkPaused()` → 503 if `reelink:spent_cents >= 1500` (set in `lib/budget.ts`).
2. `/start` only: `checkAndIncrement(ip)` → 429 if `> 3` requests today.

`/api/generate/render` is the only route that increments the counter — `addSpent(5)` (5¢ per generation) after Lambda is kicked. This is a simplification (we don't track per-step costs) but it's deterministic and easy to reason about.

Threshold alerts fire from `lib/alerts.ts` at $10 (warn) and $14 (critical). Without `ALERT_WEBHOOK_URL`, they fall through to `console.warn`/`console.error`, which Vercel log drains pick up.

`/api/admin/reset` zeroes the counter (token-gated by `x-admin-token: $ADMIN_RESET_TOKEN`).

### Storage

| Asset | Backend | TTL | Quota concern |
| --- | --- | --- | --- |
| Per-scene mp3 | Vercel Blob (`audio/<jobId>/<idx>.mp3`) | Daily cron deletes >24 h | Free tier 1 GB; steady-state way under |
| Final mp4 | Lambda's S3 bucket (returned URL is public) | S3 lifecycle deletes after 7 d (set once, see below) | No Vercel quota impact |

The pre-rendered demo videos at `public/demos/*.mp4` are static assets served straight from the build — they survive a `503 paused` state, so the landing page always looks polished.

### One-time AWS setup (do once, document the function name + serve URL in env)

```bash
npx remotion lambda functions deploy
npx remotion lambda sites create remotion/index.ts --site-name=reelink
# Then capture function name + serve URL into .env.local

# Set the 7-day lifecycle on the bucket Remotion created:
aws s3api put-bucket-lifecycle-configuration \
  --bucket <bucket-from-the-output-above> \
  --lifecycle-configuration '{"Rules":[{"ID":"reelink-7d","Status":"Enabled","Filter":{},"Expiration":{"Days":7}}]}'
```

### Environment variables

See `.env.local.example` for the full list. Required:
- `OPENAI_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash standalone free tier — no card required)
- `ADMIN_RESET_TOKEN` (any long random string)
- `REMOTION_LAMBDA_FUNCTION_NAME`, `REMOTION_SERVE_URL`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

Optional:
- `ALERT_WEBHOOK_URL` (Discord/Slack webhook; omit to use console-only alerts)
- `CRON_SECRET` (if set, `/api/cron/cleanup` requires `Authorization: Bearer $CRON_SECRET`)

## Notes for working in this repo

- The `app/` directory holds the Next.js App Router (pages + API route handlers). The `remotion/` directory is a separate compilation unit driven by the Remotion CLI — its types are checked by the main tsconfig but bundling is independent.
- `components/ui/*` is shadcn-generated and uses Base UI's `render` prop pattern (not Radix `asChild`). When extending shadcn primitives, prefer `render={<MyTag />}` over `asChild`.
- All `/api/generate/*` routes set `runtime = "nodejs"` and `maxDuration = 60`. Keep them under the Hobby 60 s cap — if any single stage blows past, parallelize harder or split into more stages.
- `lib/extract-article.ts` uses a desktop UA and a 10 s fetch timeout. Sites that block bot-style requests will fail with a `FriendlyError` — UX surfaces "Couldn't read that article — try a different URL."
- The `scripts/*.ts` smoke scripts auto-load `.env.local` via `dotenv` and are gated behind the relevant env vars — they don't dry-run if you haven't configured the service yet.
