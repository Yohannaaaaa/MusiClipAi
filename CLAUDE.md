# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

MusiClip AI: a Next.js web app that generates a music-video clip from a song, an optional character (uploaded
photos or a text description), optional clip locations, an optional visual-direction prompt, and a video-quality
choice (normal/4K/8K). The flow is modeled on OpenArt.ai's "Music Video" screen (dark UI, dashed upload dropzones,
gradient pill CTA).

## Commands

```bash
npm run dev          # dev server (Turbopack), http://localhost:3000
npm run build         # production build
npm run start          # serve the production build
npm run lint            # ESLint (flat config in eslint.config.mjs)
npx tsc --noEmit          # type-check without emitting
```

There is no test suite in this repo yet.

## Architecture

- **`app/page.tsx`** — cover/landing page (server component). Dark hero with CSS-gradient blobs and a CTA
  linking to `/create`. No client state.
- **`app/create/page.tsx`** — the generation form (client component). Holds all form state (song file, character
  mode `"photos" | "description" | null`, photos, character description, locations, visual direction, quality).
  On submit it first uploads the song (and any photos) **directly from the browser to Vercel Blob** via
  `upload()` from `@vercel/blob/client`, then POSTs the resulting blob URLs + text fields as JSON to
  `/api/generate`. The "photos" vs "description" character input is a mutually-exclusive toggle — only the
  active mode's field is sent meaningfully. If the response is `{ status: "processing", jobId }` (an async
  provider like Runway), it polls `GET /api/status?jobId=...` every 5 s (`POLL_INTERVAL_MS`, up to
  `MAX_POLL_ATTEMPTS`) until `completed`/`failed`, updating the displayed message each round.
- **`app/api/blob-upload/route.ts`** — the Blob client-upload handshake (`handleUpload` from `@vercel/blob/client`).
  The browser calls this route to get a scoped upload token before pushing bytes straight to Blob storage; the
  file itself never passes through this (or any) serverless function, so there's no request-body-size ceiling on
  uploads. Restricts `allowedContentTypes` to audio/image MIME types and caps size at 50 MB. Requires the
  `BLOB_READ_WRITE_TOKEN` env var, which Vercel injects automatically once a Blob store is created and linked to
  the project (Vercel dashboard → Storage → Blob) — there is no local fallback/mock for this token.
- **`app/api/generate/route.ts`** — the generation API route. Takes a JSON body (`songName`, `songType`,
  `songUrl`, `characterMode`, `characterDescription`, `photoUrls`, `visualDirection`, `locations`, `quality`),
  builds a `CharacterInput`, and delegates to `getVideoProvider().generate(...)`. Returns the provider's result
  as JSON (which may be `completed`, `failed`, or `processing` with a `jobId`), or a 400/500 with `{ error }`.
- **`app/api/status/route.ts`** — `GET ?jobId=...`, delegates to `getVideoProvider().getStatus(jobId)`. Only
  meaningful for async providers (Runway); returns 400 if the active provider doesn't implement `getStatus`.
- **`lib/video-provider.ts`** — the pluggable video-generation abstraction. `VideoProvider` is the interface
  (`generate(input): Promise<VideoGenerationResult>`, optional `getStatus(jobId)` for async providers);
  providers are registered by string id in the `providers` map. `getVideoProvider()` reads `VIDEO_PROVIDER` from
  the environment (default `"mock"`) and throws a descriptive error for any unregistered id.
  - `mock` (`MockVideoProvider`) — simulates a delay and echoes back what it received (including Blob URLs,
    locations, quality) without producing a real video. Always returns synchronously as `"completed"`.
  - `runway` (`RunwayVideoProvider`) — calls Runway's `image_to_video` REST API using the **first character
    photo** as input (fails fast with a clear message if no photo was provided, without making a network call).
    Generation is async on Runway's side (roughly 1–3 min), so `generate()` submits the task and immediately
    returns `{ status: "processing", jobId }`; `getStatus()` polls `GET /v1/tasks/{jobId}`. Requires
    `RUNWAY_API_KEY`. Runway's API surface (endpoints, model ids, param names) may drift from what's implemented
    here — check `docs.dev.runwayml.com` if calls start failing after previously working.

  To connect another service (Pika, Kling, Luma, ...): implement `VideoProvider` in this file (it already
  receives `songUrl`/`photoUrls`/`locations`/`quality` to work with), add it to `providers`, and set
  `VIDEO_PROVIDER` accordingly. If the service is async like Runway, follow the same submit-then-poll shape via
  `getStatus`, and `/api/status` will work with it automatically.

There is no database or auth. Uploaded audio/photos persist in Vercel Blob (not ephemeral like a request body) —
nothing is ever written to local disk. Generation job state (Runway's `jobId`) lives entirely on the provider's
side; this app doesn't persist job records anywhere itself.

## Conventions

- All user-facing text (labels, placeholders, errors) is in **French** — match this in any new UI or API
  error messages.
- Styling is Tailwind CSS v4 utility classes only (no separate stylesheets beyond `app/globals.css`, no
  `tailwind.config.js` — v4 configures via the `@theme` block in `globals.css`). Dark theme relies on Tailwind's
  media-based `dark:` variant. Visual language: fuchsia→purple gradients for primary actions, `zinc` neutrals,
  `rounded-2xl`/`rounded-full`, dashed borders for upload dropzones.
- `AGENTS.md` is regenerated by `next dev` itself (see the `nextjs-agent-rules` markers inside it) — don't hand-edit
  the content between those markers, and keep the `@AGENTS.md` import at the top of this file.
