import { NextResponse } from "next/server";
import { getVideoProvider, type CharacterInput } from "@/lib/video-provider";

const ACCEPTED_SONG_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a"];

export async function POST(request: Request) {
  const formData = await request.formData();

  const songName = formData.get("songName");
  const songType = formData.get("songType");
  if (typeof songName !== "string" || !songName) {
    return NextResponse.json({ error: "Une chanson est requise (MP3, WAV ou M4A)." }, { status: 400 });
  }
  if (typeof songType === "string" && songType && !ACCEPTED_SONG_TYPES.includes(songType)) {
    return NextResponse.json({ error: `Format audio non supporté : ${songType}.` }, { status: 400 });
  }

  const characterMode = formData.get("characterMode");
  const characterDescription = formData.get("characterDescription");
  const photoNames = formData.getAll("photoNames").filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  const visualDirection = formData.get("visualDirection");

  let character: CharacterInput = { mode: "none" };
  if (characterMode === "photos" && photoNames.length > 0) {
    character = { mode: "photos", photoNames };
  } else if (characterMode === "description" && typeof characterDescription === "string" && characterDescription.trim()) {
    character = { mode: "description", description: characterDescription.trim() };
  }

  const provider = getVideoProvider();

  try {
    const result = await provider.generate({
      songName,
      songType: typeof songType === "string" ? songType : "",
      character,
      visualDirection: typeof visualDirection === "string" ? visualDirection.trim() : "",
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de la génération.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
