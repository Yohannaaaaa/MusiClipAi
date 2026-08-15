import { put } from "@vercel/blob";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";

export const maxDuration = 30;

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

interface ExtractFrameBody {
  videoUrl?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ExtractFrameBody;
  if (!body.videoUrl) {
    return NextResponse.json({ error: "videoUrl est requis." }, { status: 400 });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "musiclip-frame-"));

  try {
    const response = await fetch(body.videoUrl);
    if (!response.ok) throw new Error(`Échec du téléchargement de la vidéo (HTTP ${response.status}).`);

    const videoPath = path.join(workDir, "clip.mp4");
    await writeFile(videoPath, Buffer.from(await response.arrayBuffer()));

    const framePath = path.join(workDir, "frame.jpg");
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .inputOptions(["-sseof", "-1"])
        .outputOptions(["-update", "1", "-q:v", "2"])
        .save(framePath)
        .on("end", () => resolve())
        .on("error", (error: Error) => reject(error));
    });

    const frameBuffer = await readFile(framePath);
    const blob = await put(`frames/${Date.now()}.jpg`, frameBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    return NextResponse.json({ imageUrl: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de l'extraction de l'image.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
