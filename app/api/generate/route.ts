import { NextResponse } from "next/server";
import { getVideoProvider, type CharacterInput } from "@/lib/video-provider";

const MAX_SONG_SIZE = 50 * 1024 * 1024;
const ACCEPTED_SONG_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a"];

export async function POST(request: Request) {
  const formData = await request.formData();

  const song = formData.get("song");
  if (!(song instanceof File) || song.size === 0) {
    return NextResponse.json({ error: "Une chanson est requise (MP3, WAV ou M4A)." }, { status: 400 });
  }
  if (song.size > MAX_SONG_SIZE) {
    return NextResponse.json({ error: "Le fichier audio dépasse la limite de 50 Mo." }, { status: 400 });
  }
  if (ACCEPTED_SONG_TYPES.length > 0 && song.type && !ACCEPTED_SONG_TYPES.includes(song.type)) {
    return NextResponse.json({ error: `Format audio non supporté : ${song.type}.` }, { status: 400 });
  }

  const characterMode = formData.get("characterMode");
  const characterDescription = formData.get("characterDescription");
  const photos = formData.getAll("photos").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const visualDirection = formData.get("visualDirection");

  let character: CharacterInput = { mode: "none" };
  if (characterMode === "photos" && photos.length > 0) {
    character = { mode: "photos", photoNames: photos.map((photo) => photo.name) };
  } else if (characterMode === "description" && typeof characterDescription === "string" && characterDescription.trim()) {
    character = { mode: "description", description: characterDescription.trim() };
  }

  const provider = getVideoProvider();

  try {
    const result = await provider.generate({
      songName: song.name,
      songType: song.type,
      character,
      visualDirection: typeof visualDirection === "string" ? visualDirection.trim() : "",
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de la génération.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
