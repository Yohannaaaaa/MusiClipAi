import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { getVideoProvider, type CharacterInput } from "@/lib/video-provider";

const VIDEO_QUALITIES = ["normal", "4k", "8k"] as const;
type VideoQuality = (typeof VIDEO_QUALITIES)[number];

interface GenerateRequestBody {
  songName?: string;
  songType?: string;
  songUrl?: string;
  characterMode?: "photos" | "description" | "none";
  characterDescription?: string;
  photoUrls?: string[];
  visualDirection?: string;
  locations?: string[];
  danceStyle?: string | null;
  quality?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateRequestBody;

  if (!body.songName || !body.songUrl) {
    return NextResponse.json({ error: "Une chanson est requise (MP3, WAV ou M4A)." }, { status: 400 });
  }

  let character: CharacterInput = { mode: "none" };
  if (body.characterMode === "photos" && body.photoUrls && body.photoUrls.length > 0) {
    character = { mode: "photos", photoUrls: body.photoUrls };
  } else if (body.characterMode === "description" && body.characterDescription?.trim()) {
    character = { mode: "description", description: body.characterDescription.trim() };
  }

  const quality: VideoQuality = VIDEO_QUALITIES.includes(body.quality as VideoQuality)
    ? (body.quality as VideoQuality)
    : "normal";
  const locations = Array.isArray(body.locations) ? body.locations.filter((entry) => typeof entry === "string" && entry.trim()) : [];
  const danceStyle = typeof body.danceStyle === "string" && body.danceStyle.trim() ? body.danceStyle.trim() : null;
  const visualDirection = body.visualDirection?.trim() ?? "";

  const provider = getVideoProvider();

  try {
    const result = await provider.generate({
      songName: body.songName,
      songType: body.songType ?? "",
      songUrl: body.songUrl,
      character,
      visualDirection,
      locations,
      danceStyle,
      quality,
    });

    try {
      const session = await auth();
      if (session?.user?.id) {
        await db.insert(generations).values({
          userId: session.user.id,
          songName: body.songName,
          songUrl: body.songUrl,
          status: result.status,
          jobId: result.jobId ?? null,
          videoUrl: result.videoUrl ?? null,
          message: result.message,
          locations,
          danceStyle,
          quality,
          visualDirection,
        });
      }
    } catch {
      // Best-effort history save — never let a DB hiccup mask a successful generation.
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de la génération.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
