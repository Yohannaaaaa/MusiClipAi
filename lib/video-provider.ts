export type CharacterInput =
  | { mode: "photos"; photoUrls: string[] }
  | { mode: "description"; description: string }
  | { mode: "none" };

export type VideoQuality = "normal" | "4k" | "8k";

export interface VideoGenerationInput {
  songName: string;
  songType: string;
  songUrl: string;
  character: CharacterInput;
  visualDirection: string;
  locations: string[];
  quality: VideoQuality;
}

const QUALITY_LABELS: Record<VideoQuality, string> = {
  normal: "normale (1080p)",
  "4k": "4K (2160p)",
  "8k": "8K (4320p)",
};

export interface VideoGenerationResult {
  status: "completed" | "failed";
  videoUrl?: string;
  message: string;
}

export interface VideoProvider {
  readonly id: string;
  generate(input: VideoGenerationInput): Promise<VideoGenerationResult>;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockVideoProvider implements VideoProvider {
  readonly id = "mock";

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    await delay(1200);
    const characterNote =
      input.character.mode === "photos"
        ? `${input.character.photoUrls.length} photo(s) de personnage reçue(s)`
        : input.character.mode === "description"
          ? `personnage décrit : "${input.character.description}"`
          : "aucun personnage fourni";

    const locationsNote = input.locations.length > 0 ? input.locations.join(", ") : "aucun lieu précisé";

    return {
      status: "completed",
      message:
        `Aperçu simulé (fournisseur "mock") : chanson "${input.songName}" reçue (stockée sur Vercel Blob), ${characterNote}, ` +
        `direction visuelle : "${input.visualDirection || "aucune"}", lieux : ${locationsNote}, ` +
        `qualité demandée : ${QUALITY_LABELS[input.quality]}. ` +
        `Aucune vidéo réelle n'a été générée — connectez un vrai fournisseur (variable d'env VIDEO_PROVIDER) pour produire un vrai clip.`,
    };
  }
}

const providers: Record<string, () => VideoProvider> = {
  mock: () => new MockVideoProvider(),
};

export function getVideoProvider(): VideoProvider {
  const id = process.env.VIDEO_PROVIDER ?? "mock";
  const factory = providers[id];
  if (!factory) {
    throw new Error(
      `Fournisseur vidéo "${id}" inconnu ou non configuré. Seul "mock" est implémenté. ` +
        `Pour connecter un vrai service (Runway, Pika, Kling, ...), ajoutez une classe VideoProvider dans lib/video-provider.ts, ` +
        `enregistrez-la dans "providers", puis définissez VIDEO_PROVIDER dans .env.local.`,
    );
  }
  return factory();
}
