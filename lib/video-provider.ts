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
  status: "completed" | "failed" | "processing";
  videoUrl?: string;
  jobId?: string;
  message: string;
}

export interface VideoProvider {
  readonly id: string;
  generate(input: VideoGenerationInput): Promise<VideoGenerationResult>;
  getStatus?(jobId: string): Promise<VideoGenerationResult>;
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

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_VERSION = "2024-11-06";

interface RunwayTaskResponse {
  id: string;
}

interface RunwayTaskStatus {
  status: "PENDING" | "THROTTLED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  output?: string[];
  failure?: string;
  failureCode?: string;
}

class RunwayVideoProvider implements VideoProvider {
  readonly id = "runway";

  private headers(): Record<string, string> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RUNWAY_API_KEY n'est pas configurée. Créez une clé sur runwayml.com (Account Settings → API Keys) " +
          "et ajoutez-la comme variable d'environnement.",
      );
    }
    return {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": RUNWAY_API_VERSION,
      "Content-Type": "application/json",
    };
  }

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const promptImage = input.character.mode === "photos" ? input.character.photoUrls[0] : undefined;
    if (!promptImage) {
      return {
        status: "failed",
        message:
          "Runway génère une vidéo à partir d'une photo : ajoutez au moins une photo de personnage " +
          "(section « Qui est dans votre histoire ? ») avant de relancer.",
      };
    }

    const promptText = [input.visualDirection, input.locations.length > 0 ? `Lieux : ${input.locations.join(", ")}` : ""]
      .filter(Boolean)
      .join(". ");

    const response = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        promptImage,
        promptText: promptText || undefined,
        model: input.quality === "8k" ? "gen4_turbo" : "gen3a_turbo",
        ratio: "1280:768",
        duration: 10,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Runway a refusé la demande (HTTP ${response.status}) : ${errorBody.slice(0, 300)}`);
    }

    const data = (await response.json()) as RunwayTaskResponse;
    return {
      status: "processing",
      jobId: data.id,
      message: "Génération lancée sur Runway (image → vidéo, ~10 s de clip). Cela prend en général 1 à 3 minutes.",
    };
  }

  async getStatus(jobId: string): Promise<VideoGenerationResult> {
    const response = await fetch(`${RUNWAY_API_BASE}/tasks/${jobId}`, {
      headers: this.headers(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Impossible de vérifier la tâche Runway (HTTP ${response.status}) : ${errorBody.slice(0, 300)}`);
    }

    const data = (await response.json()) as RunwayTaskStatus;

    if (data.status === "SUCCEEDED") {
      return { status: "completed", videoUrl: data.output?.[0], message: "Vidéo générée." };
    }
    if (data.status === "FAILED") {
      return { status: "failed", message: data.failure ?? "La génération Runway a échoué." };
    }
    return { status: "processing", jobId, message: `Runway : ${data.status.toLowerCase()}...` };
  }
}

const providers: Record<string, () => VideoProvider> = {
  mock: () => new MockVideoProvider(),
  runway: () => new RunwayVideoProvider(),
};

export function getVideoProvider(): VideoProvider {
  const id = process.env.VIDEO_PROVIDER ?? "mock";
  const factory = providers[id];
  if (!factory) {
    throw new Error(
      `Fournisseur vidéo "${id}" inconnu. Fournisseurs disponibles : ${Object.keys(providers).join(", ")}. ` +
        `Pour en ajouter un, implémentez une classe VideoProvider dans lib/video-provider.ts, ` +
        `enregistrez-la dans "providers", puis définissez VIDEO_PROVIDER dans .env.local.`,
    );
  }
  return factory();
}
