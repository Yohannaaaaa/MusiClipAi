import { put } from "@vercel/blob";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { generations } from "@/db/schema";

export const maxDuration = 60;

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

interface StitchRequestBody {
  clipUrls?: string[];
  songUrl?: string;
  songName?: string;
  locations?: string[];
  danceStyle?: string | null;
  quality?: string;
  visualDirection?: string;
}

function runFfmpeg(build: (command: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    build(ffmpeg())
      .save(outputPath)
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error));
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as StitchRequestBody;
  if (!body.clipUrls || body.clipUrls.length === 0 || !body.songUrl) {
    return NextResponse.json({ error: "clipUrls et songUrl sont requis." }, { status: 400 });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "musiclip-"));

  try {
    const clipPaths: string[] = [];
    for (const [index, clipUrl] of body.clipUrls.entries()) {
      const response = await fetch(clipUrl);
      if (!response.ok) throw new Error(`Échec du téléchargement du segment ${index + 1} (HTTP ${response.status}).`);
      const clipPath = path.join(workDir, `clip-${String(index).padStart(3, "0")}.mp4`);
      await writeFile(clipPath, Buffer.from(await response.arrayBuffer()));
      clipPaths.push(clipPath);
    }

    const songResponse = await fetch(body.songUrl);
    if (!songResponse.ok) throw new Error(`Échec du téléchargement de la chanson (HTTP ${songResponse.status}).`);
    const songExtension = path.extname(new URL(body.songUrl).pathname) || ".mp3";
    const songPath = path.join(workDir, `song${songExtension}`);
    await writeFile(songPath, Buffer.from(await songResponse.arrayBuffer()));

    const listPath = path.join(workDir, "list.txt");
    await writeFile(listPath, clipPaths.map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`).join("\n"));

    const concatPath = path.join(workDir, "concat.mp4");
    await runFfmpeg(
      (command) => command.input(listPath).inputOptions(["-f", "concat", "-safe", "0"]).outputOptions(["-c", "copy"]),
      concatPath,
    );

    const finalPath = path.join(workDir, "final.mp4");
    await runFfmpeg(
      (command) =>
        command
          .input(concatPath)
          .input(songPath)
          .outputOptions(["-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-shortest"]),
      finalPath,
    );

    const finalBuffer = await readFile(finalPath);
    const blob = await put(`clips/${Date.now()}-${(body.songName ?? "clip").replace(/[^a-z0-9.-]/gi, "_")}.mp4`, finalBuffer, {
      access: "public",
      contentType: "video/mp4",
    });

    const result = {
      status: "completed" as const,
      videoUrl: blob.url,
      message: `Vidéo complète assemblée à partir de ${body.clipUrls.length} segments.`,
    };

    try {
      const session = await auth();
      if (session?.user?.id) {
        await db.insert(generations).values({
          userId: session.user.id,
          songName: body.songName ?? "Chanson",
          songUrl: body.songUrl,
          status: result.status,
          videoUrl: result.videoUrl,
          message: result.message,
          locations: body.locations ?? [],
          danceStyle: body.danceStyle ?? null,
          quality: body.quality ?? "normal",
          visualDirection: body.visualDirection ?? "",
        });
      }
    } catch {
      // Best-effort history save — never let a DB hiccup mask a successful stitch.
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'assemblage.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
